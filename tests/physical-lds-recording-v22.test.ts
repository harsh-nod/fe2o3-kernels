import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { projectLdsRecording } from "../src/content/physical-lds-debug-v22";
import { parseLdsIndex } from "../src/content/physical-lds-debug-v22-index";
import { type Row } from "../src/content/physical-entry-debug-v20-shapes";
import { retained, protocolMutation, indexMutation, result, session } from "./support/physical-lds-recording-fixture";
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
describe("V22 retained byte and observation joins, not execution", () => {
  it.each([0, 1])("projects exact real R3 asset set%s", async which => {
    const r = await projectLdsRecording(retained(which));
    expect(r.context.index.records.length).toBe(which ? 8718 : 8833);
    expect(r.observations).toHaveLength(88); expect(r.transitions).toHaveLength(4);
    expect(r.context.index.arrivals).toHaveLength(128); expect(r.context.index.lds.first).toBe(2);
    expect(new Set(r.context.index.records.map(row => row.wave))).toEqual(new Set([0, 1]));
    expect(r.observations.filter(o => o.status !== "ok")).toHaveLength(16);
    expect(r.observations.filter(o => o.status !== "ok").every(o => o.values === null && o.memory === null && o.anchor === null)).toBe(true);
    expect(Object.isFrozen(r)).toBe(true);
  });
  const controls: [string, (q: Row[], r: Row[]) => void][] = [
    ["unknown operation", q => { q[0].operation = "execute"; }],
    ["unknown source authority", (_q, r) => { r[0].source_custody = true; }],
    ["hardware promotion", (_q, r) => { session(r[1]).hardware_observed = true; }],
    ["duplicate request identity", q => { q[1].request_id = 1; }],
    ["response identity substitution", (_q, r) => { r[1].request_id = 3; }],
    ["missing terminate", (q, r) => { q.pop(); r.pop(); }],
    ["lost completed cursor", (q, r) => { const i = r.findIndex(x => result(x)?.stop && (result(x).stop as Row).reason === "completed"); q.splice(i, 1); r.splice(i, 1); }],
    ["incorrect events advanced", (_q, r) => { result(r[1]).events_advanced = 0; }],
    ["stale successful revision", q => { q[1].expected_revision = 9; }],
    ["wave1 incorrectly mapped to wave0", (_q, r) => { const a = (result(r[5]).snapshot as Row).snapshot as Row; ((a.anchor as Row).scope as Row).wave = 0; }],
    ["rounded u64 mask", (_q, r) => { const a = (result(r[1]).snapshot as Row).snapshot as Row; ((a.anchor as Row).scope as Row).active_mask = 18446744073709552000; }],
    ["false source capability", (_q, r) => { (result(r[0]).capabilities as Row[])[2] = { name: "source_sites", availability: "available" }; }],
    ["pre-frame refusal state mutation", (_q, r) => { (r[9].unavailable as Row).state_changed = true; }],
    ["initial LDS falsely initialized", (_q, r) => { ((result(r[11]).memory as Row).availability as Row).initialized = "0xffff"; }],
    ["root pointer origin substitution", (_q, r) => { const v = result(r[8]).values as Row[]; (((v[0].availability as Row).value as Row).allocation as Row).ordinal = 2; }],
    ["same SSA pending value fabricated", (_q, r) => { const entry = r.find(x => (result(x)?.values as Row[] | undefined)?.some(v => ((v.path as Row).root as Row).value_ordinal === 26 && (v.availability as Row).status === "unavailable"))!;
      const v = (result(entry).values as Row[]).find(v => ((v.path as Row).root as Row).value_ordinal === 26)!;
      v.availability = { status: "captured", value_type: { kind: "integer", signed: false, bits: 32 }, value: { encoding: "bits", bits: "0x00000000" }, provenance: "simulated_observation" }; }],
    ["final memory byte changed", (_q, r) => { const mem = result(r.find(x => (result(x)?.memory as Row | undefined)?.requested_bytes === 256)!).memory as Row; (mem.availability as Row).bytes = "0x01" + String((mem.availability as Row).bytes).slice(4); }],
    ["foreign page continuation", (_q, r) => { const row = r.find(x => result(x)?.next_cursor)!; (result(row).next_cursor as Row).query_identity = "1".repeat(64); }],
    ["stale refusal changed revision", (_q, r) => { const row = r.find(x => (x.error as Row | undefined)?.code === "stale_revision")!; session(row).revision = 0; }],
  ];
  it.each(controls)("refuses %s", async (_name, change) => { await expect(projectLdsRecording(protocolMutation(change))).rejects.toThrow(); });
  const indexControls: [string, (p: Row) => void][] = [
    ["wrong first LDS checkpoint", p => { (p.allocations as Row[])[2].first_checkpoint_sequence = 1; }],
    ["birth outside capture", p => { (p.allocations as Row[])[2].first_checkpoint_sequence = (p.records as Row[]).length + 1; }],
    ["birth at noncheckpoint", p => { (p.allocations as Row[])[2].first_checkpoint_sequence = (p.records as Row[]).find(r => (r.payload as Row).kind === "memory")!.sequence; }],
    ["duplicate barrier arrival", p => { const rows = (p.records as Row[]).filter(r => (r.payload as Row).kind === "barrier" && (r.payload as Row).action === "arrive"); rows[1].scope = rows[0].scope; }],
    ["publication epoch confused with barrier phase", p => { ((p.records as Row[]).find(r => (r.payload as Row).kind === "barrier")!.payload as Row).phase = 1; }],
    ["release participants63", p => { ((p.records as Row[]).find(r => (r.payload as Row).action === "release")!.payload as Row).participants = 63; }],
    ["false physical register availability", p => { p.unavailable = []; }],
    ["missing record with unchanged count", p => { (p.records as Row[]).pop(); }],
    ["reordered producer ordinal", p => { (p.records as Row[])[1].producer_ordinal = (p.records as Row[])[0].producer_ordinal; }],
    ["wrong LDS offset", p => { const row = (p.records as Row[]).find(r => (r.payload as Row).address_space === "workgroup")!; (row.payload as Row).byte_offset = 4; }],
    ["numeric pending encoding", p => { const r = (p.records as Row[]).find(r => Array.isArray((r.payload as Row).pending) && ((r.payload as Row).pending as Row[]).length)!; (((r.payload as Row).pending as Row[])[0]).numeric_availability = "captured"; }],
  ];
  it.each(indexControls)("rejects rehashed inconsistent index: %s", async (_name, change) => {
    await expect(parseLdsIndex(indexMutation(change).indexUtf8)).rejects.toThrow();
  });
  it("refuses stale asset digest and index payload digest", async () => {
    const input = retained(); await expect(projectLdsRecording({ ...input, expected: { ...input.expected!, index: "1".repeat(64) } })).rejects.toThrow();
    await expect(parseLdsIndex(input.indexUtf8.replace('"payload_bytes":3366431', '"payload_bytes":3366430'))).rejects.toThrow();
  });
  it("rejects duplicate JSON keys without Number-rounding u64", async () => {
    const input = retained(); await expect(projectLdsRecording({ ...input, expected: undefined,
      requestsUtf8: input.requestsUtf8.replace('"request_id":1', '"request_id":1,"request_id":1') })).rejects.toThrow();
  });
});
