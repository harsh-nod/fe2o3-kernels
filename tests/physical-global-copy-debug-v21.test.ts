import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import { projectPhysicalCopyDebugV21, PHYSICAL_COPY_LIMITS_V21, type PhysicalCopyInputV21 } from "../src/content/physical-global-copy-debug-v21";
import { PHYSICAL_COPY_RETAINED_V21 } from "../src/content/physical-global-copy-debug-v21-retained";
import { projectPhysicalDebugV20 } from "../src/content/physical-entry-debug-v20";
type Row = Record<string, unknown>;
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); });
afterEach(() => { vi.unstubAllGlobals(); });
function wire(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(wire).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).map(([k, v]) => JSON.stringify(k) + ":" + wire(v)).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function rows(text: unknown): Row[] { return String(text).trimEnd().split("\n").map(s => parseProgramJson(s, 65536) as Row); }
const result = (r: Row) => r.result as Row;
const session = (r: Row) => r.session as Row;
const anchor = (r: Row) => result(r).snapshot as Row;
const values = (r: Row) => result(r).values as Row[];
const root = (v: Row) => (v.path as Row).root as Row;
function loaded(r: Row): Row { return values(r).find(v => root(v).value_ordinal === 26)!; }
function mutated(change: (e: Row, q: Row[], r: Row[]) => void, variant = 0): PhysicalCopyInputV21 {
  const e = parseProgramJson(PHYSICAL_COPY_RETAINED_V21[variant].input.containerUtf8, 262144) as Row;
  const q = rows(e.requestsUtf8), r = rows(e.responsesUtf8);
  change(e, q, r);
  e.requestsUtf8 = q.map(wire).join("\n") + "\n";
  e.responsesUtf8 = r.map(wire).join("\n") + "\n";
  return { containerUtf8: wire(e) };
}
describe("separately admitted V21 recorded observations, never execution", () => {
  it.each(PHYSICAL_COPY_RETAINED_V21)("joins actual retained $label", async ({ input }) => {
    const view = await projectPhysicalCopyDebugV21(input);
    expect(view.status).toBe("ready");
    if (view.status !== "ready") return;
    expect(view.records).toHaveLength(48);
    expect(view.records.filter(r => r.status === "error")).toHaveLength(4);
    expect(view.records.filter(r => r.status === "unavailable")).toHaveLength(10);
    expect(view.facts.inputUnchangedBytes).toBe(528);
    expect(view.facts.copiedWords).toBe(Math.min(view.context.grid, view.context.allocations[1].elements));
    expect(view.facts.outputCanaryBytes).toBe(532 - 4 * view.facts.copiedWords);
    expect(view.records[view.facts.pendingQuery].values!.find(v => v.valueOrdinal === "26")).toMatchObject({
      key: "0:1:26", status: "unavailable", representation: "not_represented" });
    expect(view.records[view.facts.readyQuery].values!.find(v => v.valueOrdinal === "26")).toMatchObject({
      key: "0:1:26", status: "captured", typeLabel: "u32", representation: "0x80000001" });
    expect(view.records[view.facts.reversePendingQuery].values!.find(v => v.valueOrdinal === "26")?.status).toBe("unavailable");
    expect(view.records.some(r => r.anchor?.activeMask === 18446744073709551615n)).toBe(true);
    expect(view.records[28].page).toEqual({ start: 1, next: 2 }); // Actual accepted continuation.
    expect(view.records[31].status).toBe("unavailable"); // Actual stale continuation, not synthetic.
    expect(new Set(view.records.flatMap(r => r.memory ? [r.memory.allocation] : []))).toEqual(new Set([1, 2]));
    expect(view.records.filter(r => r.status !== "ok").every(r => !r.anchor && !r.values && !r.memory)).toBe(true);
    expect(Object.isFrozen(view.context.allocations[0].bytes)).toBe(true);
    expect(Object.isFrozen(view.records)).toBe(true);
  });
  const controls: [string, (e: Row, q: Row[], r: Row[]) => void][] = [
    ["V20 selector", e => { e.selector = "--diagnostic-kir-v20"; }],
    ["V20 outer schema", e => { e.schema = "fe2o3-recorded-physical-entry-cpu-v20"; }],
    ["unknown envelope field", e => { e.source_custody = true; }],
    ["declared source authority", e => { ((e.declared as Row).locations as Row).source_custody = true; }],
    ["wrong canonical digest", e => { (e.declared as Row).canonicalIdentity = "1".repeat(64); }],
    ["register label without matching entry", e => { (e.declared as Row).feature = "physical-global-copy-registers-v21"; }],
    ["wrong loaded SSA", e => { ((e.declared as Row).locations as Row).loaded_value_id = 25; }],
    ["wrong checkpoint index", e => { ((((e.declared as Row).locations as Row).pending as Row)).index = 27; }],
    ["wrong checkpoint site", e => { ((((e.declared as Row).locations as Row).pending as Row)).operation = 12; }],
    ["wrong declared allocation", e => { (((e.declared as Row).locations as Row).allocations as Row[])[0].id = 9; }],
    ["too many records", e => { ((e.declared as Row).locations as Row).records = 8193; }],
    ["wrong final checkpoint", e => { ((e.declared as Row).locations as Row).final_checkpoint_index = 3198; }],
    ["missing initial discovery", (_e, q, r) => { q.shift(); r.shift(); }],
    ["missing final terminate", (_e, q, r) => { q.pop(); r.pop(); }],
    ["unknown operation", (_e, q) => { q[4].operation = "execute_kernel"; }],
    ["response request mismatch", (_e, _q, r) => { r[4].request_id = 900; }],
    ["foreign configuration", (_e, _q, r) => { session(r[4]).configuration_identity = "1".repeat(64); }],
    ["hardware promotion", (_e, _q, r) => { session(r[4]).hardware_observed = true; }],
    ["successful stale revision", (_e, q) => { q[4].expected_revision = 0; }],
    ["wrong query frame", (_e, q) => { q[4].frame = 2; }],
    ["wrong query lane", (_e, q) => { (q[4].scope as Row).lane = 1; }],
    ["wrong query snapshot revision", (_e, _q, r) => { (anchor(r[4]).cursor as Row).state_revision = 100; }],
    ["duplicate SSA", (_e, _q, r) => { values(r[4])[1] = values(r[4])[0]; }],
    ["swapped input pointer", (_e, _q, r) => {
      (((values(r[4])[0].availability as Row).value as Row).allocation as Row).ordinal = 2;
    }],
    ["pointer generation", (_e, _q, r) => {
      (((values(r[4])[0].availability as Row).value as Row).allocation as Row).generation = 1;
    }],
    ["pending fabricated ready value", (_e, _q, r) => { loaded(r[6]).availability = loaded(r[10]).availability; }],
    ["ready still pending", (_e, _q, r) => { loaded(r[10]).availability = loaded(r[6]).availability; }],
    ["wrong ready word", (_e, _q, r) => { ((loaded(r[10]).availability as Row).value as Row).bits = "0x00000000"; }],
    ["wrong loaded root frame", (_e, _q, r) => { root(loaded(r[10])).frame = 2; }],
    ["reverse changed immutable pending", (_e, _q, r) => { loaded(r[12]).availability = loaded(r[10]).availability; }],
    ["forged page domain", (_e, _q, r) => { (result(r[27]).next_cursor as Row).query_identity = "1".repeat(64); }],
    ["continuation starts at wrong position", (_e, q) => { ((q[28].page as Row).cursor as Row).position = 2; }],
    ["stale page falsely succeeds", (_e, _q, r) => { r[31].status = "ok"; r[31].result = result(r[28]); delete r[31].unavailable; }],
    ["refusal changed session", (_e, _q, r) => { session(r[20]).revision = 900; }],
    ["refusal claims state mutation", (_e, _q, r) => { (r[20].error as Row).state_changed = true; }],
    ["unknown unavailable profile", (_e, _q, r) => { (r[24].unavailable as Row).detail = "diagnostic physical-entry V20 exposes bounded CPU observations only"; }],
    ["query allocation generation mismatch", (_e, q) => { (q[14].allocation as Row).generation = 1; }],
    ["memory allocation mismatch", (_e, _q, r) => { ((result(r[14]).memory as Row).allocation as Row).ordinal = 1; }],
    ["memory offset mismatch", (_e, _q, r) => { (result(r[14]).memory as Row).byte_offset = 9; }],
    ["memory returned size mismatch", (_e, _q, r) => { (result(r[14]).memory as Row).returned_bytes = 3; }],
    ["stale memory snapshot", (_e, _q, r) => { (anchor(r[14]).cursor as Row).event_sequence = 29; }],
    ["input silently modified", (_e, _q, r) => {
      const a = (result(r[40]).memory as Row).availability as Row; a.bytes = "0x00" + String(a.bytes).slice(4);
    }],
    ["output canary modified", (_e, _q, r) => {
      const a = (result(r[45]).memory as Row).availability as Row; a.bytes = String(a.bytes).slice(0, -2) + "00";
    }],
    ["final input page missing", (_e, q, r) => { q.splice(42, 1); r.splice(42, 1); }],
  ];
  it.each(controls)("refuses %s without partial views", async (_label, change) => {
    const view = await projectPhysicalCopyDebugV21(mutated(change));
    expect(view.status).toBe("invalid"); expect("records" in view).toBe(false);
  });
  const laterRootControls = [8, 10].flatMap(at => [0, 1].flatMap(parameter =>
    ["role", "offset", "unavailable", "scalar"].map(mode => ({ at, parameter, mode }))));
  it.each(laterRootControls)("refuses later parameter $parameter $mode drift at recorded query $at", async ({ at, parameter, mode }) => {
    const input = mutated((_e, _q, r) => {
      // These are distinct captured sites from the initial required root observation.
      // Neither selected event has another SSA query, so this tests cross-site identity,
      // not the already-existing same-event immutable-page check.
      const event = (session(r[at]).cursor as Row).event_sequence;
      expect(event).not.toBe((session(r[4]).cursor as Row).event_sequence);
      expect(r.filter(row => (row.result as Row | undefined)?.values &&
        (session(row).cursor as Row).event_sequence === event)).toHaveLength(1);
      const row = values(r[at]).find(value => root(value).value_ordinal === parameter)!;
      const availability = row.availability as Row, pointer = availability.value as Row;
      if (mode === "role") (pointer.allocation as Row).ordinal = parameter === 0 ? 2 : 1;
      else if (mode === "offset") pointer.byte_offset = 12; // Still inside the same allocation.
      else if (mode === "unavailable") row.availability = { status: "unavailable", reason: "not_represented" };
      else row.availability = loaded(r[10]).availability; // Well-formed captured u32, not a pointer.
    });
    const view = await projectPhysicalCopyDebugV21(input);
    expect(view.status).toBe("invalid"); expect("records" in view).toBe(false);
    if (view.status === "invalid") expect(view.detail).toContain("parameter pointer changed across captured sites");
  });
  it("enforces the file cap before parser/hash and preserves bounded file identity", async () => {
    const digest = vi.spyOn(webcrypto.subtle, "digest");
    const oversized = await projectPhysicalCopyDebugV21({ containerUtf8: " ".repeat(PHYSICAL_COPY_LIMITS_V21.fileBytes + 1) });
    expect(oversized.status).toBe("invalid"); expect(digest).not.toHaveBeenCalled(); digest.mockRestore();
    expect((await projectPhysicalCopyDebugV21({ ...PHYSICAL_COPY_RETAINED_V21[0].input, expectedSha256: "1".repeat(64) })).status).toBe("invalid");
    expect((await projectPhysicalCopyDebugV21({ containerUtf8: '{"schema":1,"schema":2}' })).status).toBe("invalid");
    expect((await projectPhysicalCopyDebugV21(null)).status).toBe("unavailable");
  });
  it("rejects invalid full-EXEC input even when the declared output extent is zero", async () => {
    for (const mode of ["short", "uninitialized"]) {
      const input = mutated(e => {
        const doc = parseProgramJson(String(e.simulationRequestUtf8), 16384) as Row;
        if (mode === "short") (doc.arguments as Row[])[0].elements = 127;
        else {
          const first = (doc.shared_buffers as Row[])[0];
          const bits = String(first.initialized);
          // Input starts at byte 8: clear the next initialized byte mask, not a prefix canary.
          first.initialized = bits.slice(0, 4) + "00" + bits.slice(6);
        }
        e.simulationRequestUtf8 = wire(doc);
        ((e.declared as Row).locations as Row).request_sha256 = "0x" + createHash("sha256").update(String(e.simulationRequestUtf8)).digest("hex");
      }, 4);
      const view = await projectPhysicalCopyDebugV21(input);
      expect(view.status).toBe("invalid");
      if (view.status === "invalid") expect(view.detail).toContain("Full-EXEC input read");
    }
  });
  it("old V20 adapter refuses unchanged V21 inner streams even with a claimed old selector", async () => {
    const e = parseProgramJson(PHYSICAL_COPY_RETAINED_V21[0].input.containerUtf8, 262144) as Row;
    expect((await projectPhysicalDebugV20({ selector: "--diagnostic-kir-v20",
      requestsUtf8: String(e.requestsUtf8), responsesUtf8: String(e.responsesUtf8) })).status).toBe("invalid");
  });
  it("retains zero/partial output masks without inventing skipped input reads", async () => {
    for (const index of [4, 5]) {
      const view = await projectPhysicalCopyDebugV21(PHYSICAL_COPY_RETAINED_V21[index].input);
      expect(view.status).toBe("ready"); if (view.status !== "ready") continue;
      expect(view.context.grid).toBe(128); expect(view.facts.inputUnchangedBytes).toBe(528);
      expect(view.facts.copiedWords).toBe(index === 4 ? 0 : 33);
      expect(view.facts.outputCanaryBytes).toBe(index === 4 ? 532 : 400);
    }
  });
});
