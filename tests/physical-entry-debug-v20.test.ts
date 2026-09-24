import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import { projectPhysicalDebugV20, type PhysicalDebugInputV20 } from "../src/content/physical-entry-debug-v20";
import { PHYSICAL_DEBUG_RETAINED_V20 } from "../src/content/physical-entry-debug-v20-retained";
type Row = Record<string, unknown>;
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });
// Test-only mutation serialization preserves u64 wire integers, never Number-rounds masks.
function wire(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(wire).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).map(([k, v]) => JSON.stringify(k) + ":" + wire(v)).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function rows(raw: string): Row[] { return raw.trimEnd().split("\n").map(s => parseProgramJson(s, 65536) as Row); }
function mutated(change: (q: Row[], r: Row[]) => void): PhysicalDebugInputV20 {
  const input = PHYSICAL_DEBUG_RETAINED_V20[0].input, q = rows(input.requestsUtf8), r = rows(input.responsesUtf8);
  change(q, r); return { selector: input.selector, requestsUtf8: q.map(wire).join("\n") + "\n", responsesUtf8: r.map(wire).join("\n") + "\n" };
}
const result = (row: Row) => row.result as Row;
const session = (row: Row) => row.session as Row;
const cursor = (row: Row) => session(row).cursor as Row;
describe("bounded V20 recorded JSONL presentation (no execution)", () => {
  it.each(PHYSICAL_DEBUG_RETAINED_V20)("retains actual byte-pinned $label command output", async ({ input }) => {
    const view = await projectPhysicalDebugV20(input);
    expect(view.status).toBe("ready");
    if (view.status !== "ready") return;
    expect(view.records.length).toBe(input.requestsUtf8.trimEnd().split("\n").length);
    expect(Object.isFrozen(view.records)).toBe(true);
    expect(view.records.filter(r => r.status === "error")).toHaveLength(4);
    expect(view.records.filter(r => r.status === "unavailable")).toHaveLength(6);
    expect(view.records.some(r => r.values?.some(v => v.status === "unavailable" && v.representation === "not_represented"))).toBe(true);
    expect(view.records.some(r => r.anchor?.activeMask === 18446744073709551615n)).toBe(true);
    expect(view.records.some(r => r.memory?.cells.some(b => !b.initialized))).toBe(true);
    expect(view.records.filter(r => r.status !== "ok").every(r => r.anchor === null && r.values === null && r.memory === null)).toBe(true);
    expect(new Set(view.records.flatMap(r => r.memory ? [r.memory.allocation] : []))).toEqual(new Set([1]));
  });
  const controls: [string, (q: Row[], r: Row[]) => void][] = [
    ["unknown operation", q => { q[7].operation = "execute_kernel"; }],
    ["missing terminate", (q, r) => { q.pop(); r.pop(); }],
    ["missing initial capabilities", (q, r) => { q.shift(); r.shift(); }],
    ["duplicate request identity", q => { q[1].request_id = 1; }],
    ["mismatched response identity", (_q, r) => { r[7].request_id = 1000; }],
    ["unknown response key", (_q, r) => { r[7].source_custody = true; }],
    ["hardware promotion", (_q, r) => { session(r[7]).hardware_observed = true; }],
    ["foreign session configuration", (_q, r) => { session(r[7]).configuration_identity = "1".repeat(64); }],
    ["revision move on failed request", (_q, r) => { session(r[3]).revision = 3; cursor(r[3]).state_revision = 3; }],
    ["refusal claims changed state", (_q, r) => { (r[3].error as Row).state_changed = true; }],
    ["successful stale expected revision", q => { q[7].expected_revision = 0; }],
    ["incorrect event movement", (_q, r) => { result(r[2]).events_advanced = 0; }],
    ["source-map false capability", (_q, r) => { (result(r[0]).capabilities as Row[])[2] = { name: "source_sites", availability: "available" }; }],
    ["non-V20 capability reason", (_q, r) => { (result(r[0]).capabilities as Row[])[12].reason = "not_represented"; }],
    ["value query wrong frame", q => { q[86].frame = 2; }],
    ["value query wrong lane", q => { (q[86].scope as Row).lane = 1; }],
    ["stale query snapshot", (_q, r) => { ((result(r[86]).snapshot as Row).cursor as Row).state_revision = 41; }],
    ["forged continuation identity", (_q, r) => { (result(r[91]).next_cursor as Row).query_identity = "1".repeat(64); }],
    ["nonprogressing continuation", (_q, r) => { (result(r[91]).next_cursor as Row).position = 0; }],
    ["duplicate SSA rows", (_q, r) => { const v = result(r[86]).values as Row[]; v[1] = v[0]; }],
    ["unknown symbolic reason", (_q, r) => { ((result(r[86]).values as Row[])[5].availability as Row).reason = "native_address"; }],
    ["symbolic fabricated bits", (_q, r) => { ((result(r[86]).values as Row[])[5].availability as Row).value = { bits: "0x00000000" }; }],
    ["memory allocation mismatch", (_q, r) => { ((result(r[7]).memory as Row).allocation as Row).ordinal = 2; }],
    ["memory extent mismatch", (_q, r) => { (result(r[7]).memory as Row).returned_bytes = 3; }],
    ["initialization padding set", (_q, r) => { ((result(r[7]).memory as Row).availability as Row).initialized = "0x80"; }],
    ["memory replaced by native address", (_q, r) => { (result(r[7]).memory as Row).native_address = "0x1234"; }],
    ["unknown unavailable reason", (_q, r) => { (r[87].unavailable as Row).reason = "unknown"; }],
    ["inconsistent immutable memory", (_q, r) => { ((result(r[83]).memory as Row).availability as Row).bytes = "0x00000000"; }],
  ];
  it.each(controls)("refuses %s without partial state", async (_name, change) => {
    const view = await projectPhysicalDebugV20(mutated(change));
    expect(view.status).toBe("invalid"); expect("records" in view).toBe(false);
  });
  it("joins a test-derived continuation page only to its exact unchanged revision", async () => {
    const input = mutated((q, r) => {
      const next = { ...(result(r[91]).next_cursor as Row) }, query = { ...q[91], page: { limit: 1, cursor: next } };
      const continuation = { ...r[91], result: { ...result(r[91]), values: (result(r[86]).values as Row[]).slice(1, 2),
        next_cursor: { ...next, position: 2 } } };
      q.splice(92, 0, query); r.splice(92, 0, continuation);
      q.forEach((v, i) => { v.request_id = i + 1; r[i].request_id = i + 1; });
    });
    const view = await projectPhysicalDebugV20(input); expect(view.status).toBe("ready");
    if (view.status === "ready") expect(view.records[92].page).toEqual({ start: 1, next: 2 });
  });
  it("refuses version relabeling, oversized bytes, duplicate keys and missing final LF", async () => {
    const base = PHYSICAL_DEBUG_RETAINED_V20[0].input;
    for (const input of [
      { ...base, selector: "--diagnostic-kir-v21" },
      { selector: base.selector, requestsUtf8: base.requestsUtf8, responsesUtf8: base.responsesUtf8
        .replaceAll("kir_v20_debug_", "kir_v21_debug_").replaceAll("physical-entry V20", "physical-global-copy V21") },
      { ...base, responsesUtf8: " ".repeat(262145) },
      { ...base, requestsUtf8: base.requestsUtf8.replace('"request_id":1', '"request_id":1,"request_id":1') },
      { ...base, responsesUtf8: base.responsesUtf8.trimEnd() },
      { ...base, expected: { ...base.expected!, responses: "1".repeat(64) } },
    ]) expect((await projectPhysicalDebugV20(input)).status).toBe("invalid");
  });
  it("does not substitute the previous recording for absent input", async () => {
    expect(await projectPhysicalDebugV20(null)).toMatchObject({ status: "unavailable" });
  });
});
