// Positive inputs are immutable, ordinary-source R3 capture bytes. Mutations below
// are synthetic refusal controls only, never alternative debugger observations.
import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAULT_SOURCE_FILES, importFaultSourceReplay, type FaultSourceFiles, type FaultSourceFileRole } from "../src/content/recorded-fault-source-replay";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { projectResourcePointerMemoryNavigation } from "../src/content/resource-pointer-memory-navigation";
// Deliberately invalid mutation objects only; not a production DTO.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const PINS: Readonly<Record<FaultSourceFileRole, readonly [number, string]>> = {
  receipt: [19683, "c60587e9d5d47d689efecb020133b4d670da2f620780e37644fd9738c6af9488"],
  requests: [10184, "0f9ad2fdd8b084504a022ce859e308d9e6579be03ad12b1eecf01f78a0668e1e"],
  responses: [69406, "9c569caee68dd88d42aa12f36c5ea8a011cf5a4d034d8d6640addc423cdd5c22"],
  diagnostic: [504, "91c3b2ba7237afca178616723db569e901b5eecee342dca86c1e19d81d71684f"],
};
function actualFiles(): FaultSourceFiles {
  const result = {} as Record<FaultSourceFileRole, string>;
  for (const spec of FAULT_SOURCE_FILES) {
    const bytes = readFileSync(resolve("examples/source-fault-replay-v2", spec.leaf));
    expect(bytes.length, "Actual fixture byte count: " + spec.leaf).toBe(PINS[spec.role][0]);
    expect(createHash("sha256").update(bytes).digest("hex"), "Actual fixture hash: " + spec.leaf).toBe(PINS[spec.role][1]);
    result[spec.role] = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    expect(Buffer.byteLength(result[spec.role])).toBe(bytes.length);
  }
  return result;
}
const actual = actualFiles(); // Missing files fail explicitly. No skip or synthetic fallback.
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function mutate(raw: string, id: number, edit: (row: Row) => void) {
  return raw.slice(0, -1).split("\n").map((line, index) => {
    if (index !== id - 1) return line;
    const row = JSON.parse(line) as Row; edit(row); return JSON.stringify(row);
  }).join("\n") + "\n";
}
/** Re-pin a synthetic negative so inner checks, rather than merely old hashes, reject it. */
function repin(changes: Partial<Record<FaultSourceFileRole, string>>): FaultSourceFiles {
  const files = { ...actual, ...changes }, receipt = JSON.parse(files.receipt) as Row;
  for (const [index, role] of (["requests", "responses"] as const).entries()) {
    receipt.raw_transcripts[index].bytes = Buffer.byteLength(files[role]);
    receipt.raw_transcripts[index].sha256 = createHash("sha256").update(files[role]).digest("hex");
  }
  receipt.transcript.request_bytes = Buffer.byteLength(files.requests);
  receipt.transcript.response_bytes = Buffer.byteLength(files.responses);
  receipt.stages[4].stderr.bytes = Buffer.byteLength(files.diagnostic);
  receipt.stages[4].stderr.sha256 = createHash("sha256").update(files.diagnostic).digest("hex");
  return { ...files, receipt: JSON.stringify(receipt) + "\n" };
}
describe("actual R3 fault replay retained-file adapter", () => {
  it("retains all 44 original lines and only the exact 18 original resource pairs", async () => {
    const result = await importFaultSourceReplay(actual);
    expect(result.fullPairs).toHaveLength(44);
    expect(result.fullPairs.map(pair => pair.requestUtf8).join("")).toBe(actual.requests);
    expect(result.fullPairs.map(pair => pair.responseUtf8).join("")).toBe(actual.responses);
    expect(result.diagnosticUtf8).toBe(actual.diagnostic); expect(result.receiptUtf8).toBe(actual.receipt);
    const ids = [8, 9, 11, 12, 13, 14, 15, 16, 17, 23, 24, 26, 27, 28, 29, 30, 31, 32];
    expect(result.recording.pairs.map(pair => pair.requestId)).toEqual(ids);
    const selected = ids.map(id => result.fullPairs[id - 1]);
    expect(result.recording).toEqual(await importResourceRecording(selected.map(pair => pair.requestUtf8).join(""),
      selected.map(pair => pair.responseUtf8).join("")));
    expect(result.provenance).toEqual({ kind: "caller_supplied_unverified", sourceAuthentication: false,
      fullRunVerified: false, hardwareObserved: false, performancePrediction: false });
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.fullPairs[0].response)).toBe(true);
  });
  it("keeps standalone typed diagnostics separate from all uncaptured terminal transitions", async () => {
    const result = await importFaultSourceReplay(actual);
    expect(result.diagnostic.kind).toBe("execution_uninitialized_read");
    expect(result.diagnostic).not.toHaveProperty("detail");
    for (const id of [3, 18, 34, 39]) {
      const pair = result.fullPairs[id - 1], control = pair.response.result as Row;
      expect(control.snapshot).toEqual({ status: "unavailable", reason: "not_captured" });
      expect(control).not.toHaveProperty("values");
      for (let offset = 1; offset <= 4; offset++) {
        const response = result.fullPairs[id + offset - 1].response;
        expect(response.status).toBe("unavailable"); expect(response).not.toHaveProperty("snapshot");
      }
    }
    expect((result.fullPairs[38].response.result as Row).events_advanced).toBe(0);
    expect((result.fullPairs[38].response.result as Row).stop).toEqual({ reason: "completed", outcome: "failed", exact: true });
  });
  it("projects actual six source bindings and thirteen SSA rows without a guessed name-to-SSA join", async () => {
    const result = await importFaultSourceReplay(actual);
    for (const cp of result.recording.checkpoints) {
      const source = projectResourceSourceValues(cp, cp.sourceStack!, cp.sourceVariables!);
      const ssa = projectResourceCheckpointValues(cp);
      expect(source.status).toBe("ready"); expect(ssa.status).toBe("ready");
      if (source.status !== "ready" || ssa.status !== "ready") throw new Error("Actual captured state did not project.");
      expect(source.rows).toHaveLength(6); expect(ssa.rows).toHaveLength(13);
      expect(source.rows.filter(row => row.status === "captured").map(row => row.name).sort()).toEqual(["a", "b"]);
      expect(source.rows.filter(row => row.status === "unavailable").map(row => row.representation))
        .toEqual(["not_represented", "not_represented", "not_represented", "not_represented"]);
      expect(source.sourceAnchor).toEqual({ ...cp.anchor, frame: 1, occurrence: 1 });
      expect(cp.anchor).not.toHaveProperty("frame");
    }
  });
  it("retains repeated event/state under a new revision, and an unchanged stale refusal", async () => {
    const result = await importFaultSourceReplay(actual), [prior, repeat] = result.recording.checkpoints;
    expect(prior.anchor.cursor.event_sequence).toBe(21); expect(repeat.anchor.cursor.event_sequence).toBe(21);
    expect(prior.anchor.cursor.state_revision).toBe(3); expect(repeat.anchor.cursor.state_revision).toBe(5);
    expect(prior.anchor.site).toEqual(repeat.anchor.site); expect(prior.anchor.scope).toEqual(repeat.anchor.scope);
    expect(result.stalePair.response).toMatchObject({ status: "error", error: { code: "stale_revision", state_changed: false } });
    expect(result.stalePair.response).not.toHaveProperty("result");
    expect((result.stalePair.response.session as Row).cursor).toEqual(repeat.anchor.cursor);
  });
  it("allows only local pointer selection into actual retained storage, including its uninitialized byte", async () => {
    const result = await importFaultSourceReplay(actual), cp = result.recording.checkpoints[0];
    const values = projectResourceCheckpointValues(cp); if (values.status !== "ready") throw new Error(values.detail);
    const memory = cp.memories.find(pair => (pair.response as Row).result.memory.availability.initialized === "0xfeff")!;
    const allocation = (memory.response as Row).result.memory.allocation;
    const row = values.rows.find(value => value.pointer?.allocationOrdinal === String(allocation.ordinal) &&
      value.pointer.byteOffset === "0")!;
    expect(row).toBeDefined();
    const nav = projectResourcePointerMemoryNavigation(result.recording, cp, row.key, 1);
    expect(nav.status).toBe("ready");
    if (nav.status !== "ready") throw new Error(nav.detail);
    expect(cp.memories[nav.memoryIndex].requestId).toBe(memory.requestId);
    expect(nav.focus.byteOffset).toBe("0");
    expect(nav.focus).not.toHaveProperty("faultRange");
  });
  it("does not silently broaden the unchanged successful-resource importer to the full terminal session", async () => {
    await expect(importResourceRecording(actual.requests, actual.responses)).rejects.toThrow();
  });
});
const BAD_REQUESTS: readonly [string, number, (row: Row) => void][] = [
  ["count two", 8, row => { row.count = 2; }],
  ["cross-revision", 9, row => { row.expected_revision = 2; }],
  ["wrong source frame", 12, row => { row.frame = 2; }],
  ["wrong source cursor", 13, row => { row.page.cursor.position = 4; }],
  ["wrong source page size", 12, row => { row.page.limit = 3; }],
  ["cross-stop memory selector", 15, row => { row.byte_offset = 4; }],
  ["old allocation generation", 15, row => { row.allocation.generation = 1; }],
  ["stale refusal becomes current request", 33, row => { row.expected_revision = 5; }],
  ["missing terminal budget", 3, row => { delete row.max_events; }],
];
const BAD_RESPONSES: readonly [string, number, (row: Row) => void][] = [
  ["cross-session query", 10, row => { row.session.configuration_identity = "e".repeat(64); row.session.cursor.configuration_identity = "e".repeat(64); }],
  ["false hardware authority", 3, row => { row.session.hardware_observed = true; }],
  ["fabricated terminal snapshot", 3, row => { row.result.snapshot = JSON.parse(actual.responses.split("\n")[7]).result.snapshot; }],
  ["terminal source field injection", 6, row => { row.values = []; }],
  ["terminal memory result injection", 7, row => { row.result = {}; }],
  ["source unavailable fallback", 6, row => { row.reason = "source_map_v2_required"; }],
  ["stale mutation", 33, row => { row.error.state_changed = true; }],
  ["wrong failed completion", 39, row => { row.result.stop.outcome = "complete"; }],
  ["wrong event distance", 18, row => { row.result.events_advanced = 2; }],
  ["independent SSA mismatch", 10, row => { row.result.values.pop(); }],
  ["wrong stack next operation", 9, row => { row.result.frames[0].next_operation++; }],
  ["incomplete source page", 14, row => { row.next_cursor = { query_identity: "a".repeat(64), position: 6 }; }],
  ["null is not an absent source cursor", 14, row => { row.next_cursor = null; }],
  ["wrong repeated source name", 27, row => { row.values[0].name = "invented"; }],
  ["wrong memory initialization", 15, row => { row.result.memory.availability.initialized = "0xffff"; }],
  ["wrong repeated SSA state", 23, row => { row.result.snapshot.snapshot.values.pop(); }],
];
describe("synthetic refusals derived from immutable actual bytes", () => {
  it.each(BAD_REQUESTS)("rejects %s", async (_label, id, edit) => {
    await expect(importFaultSourceReplay(repin({ requests: mutate(actual.requests, id, edit) }))).rejects.toThrow();
  });
  it.each(BAD_RESPONSES)("rejects %s", async (_label, id, edit) => {
    await expect(importFaultSourceReplay(repin({ responses: mutate(actual.responses, id, edit) }))).rejects.toThrow();
  });
  it("rejects missing, duplicated, reordered or non-LF original pairs", async () => {
    const lines = actual.responses.slice(0, -1).split("\n");
    for (const responses of [lines.slice(1).join("\n") + "\n", [lines[0], ...lines].join("\n") + "\n",
      [lines[1], lines[0], ...lines.slice(2)].join("\n") + "\n", actual.responses.replaceAll("\n", "\r\n")])
      await expect(importFaultSourceReplay(repin({ responses }))).rejects.toThrow();
  });
  it("rejects changed bytes without a new pin and mismatched standalone diagnostic custody", async () => {
    await expect(importFaultSourceReplay({ ...actual, diagnostic: actual.diagnostic + " " })).rejects.toThrow(/file_pin/);
    const changed = JSON.parse(actual.diagnostic) as Row; changed.message = "Synthetic negative diagnostic mismatch";
    await expect(importFaultSourceReplay(repin({ diagnostic: JSON.stringify(changed) + "\n" }))).rejects.toThrow(/diagnostic/);
  });
  it("rejects fake receipt authority, duplicate JSON keys and overlarge selected inputs", async () => {
    const receipt = JSON.parse(actual.receipt) as Row; receipt.claims.source_authentication = true;
    await expect(importFaultSourceReplay({ ...actual, receipt: JSON.stringify(receipt) })).rejects.toThrow(/authority/);
    await expect(importFaultSourceReplay({ ...actual, receipt: '{"status":"passed","status":"passed"}' })).rejects.toThrow(/json/);
    await expect(importFaultSourceReplay({ ...actual, diagnostic: "x".repeat(4097) })).rejects.toThrow(/file_limit/);
    const missing: Partial<Record<FaultSourceFileRole, string>> = { ...actual }; delete missing.responses;
    await expect(importFaultSourceReplay(missing as FaultSourceFiles)).rejects.toThrow(/fields/);
  });
  it("does not claim unimported receipt artifacts have been revalidated", async () => {
    const receipt = JSON.parse(actual.receipt) as Row;
    receipt.selected_input_and_artifact_pins = { explicitly_unchecked_negative_control: "not imported by this panel" };
    const result = await importFaultSourceReplay({ ...actual, receipt: JSON.stringify(receipt) + "\n" });
    expect(result.provenance.fullRunVerified).toBe(false); expect(result.provenance.sourceAuthentication).toBe(false);
  });
  it("does not equate missing selected-stage signal/reason with explicitly retained null", async () => {
    for (const field of ["signal", "reason"]) {
      const receipt = JSON.parse(actual.receipt) as Row;
      delete receipt.stages[4][field];
      await expect(importFaultSourceReplay({ ...actual, receipt: JSON.stringify(receipt) + "\n" })).rejects.toThrow();
    }
  });
  it("copies all four original strings before asynchronous hashing, despite caller replacement/deletion", async () => {
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    const original = webcrypto.subtle.digest.bind(webcrypto.subtle); let calls = 0;
    vi.spyOn(webcrypto.subtle, "digest").mockImplementation(async (algorithm, data) => {
      calls++; await gate; return original(algorithm, data);
    });
    const mutable: Partial<Record<FaultSourceFileRole, string>> = { ...actual };
    const pending = importFaultSourceReplay(mutable as FaultSourceFiles);
    expect(calls).toBe(4);
    mutable.receipt = "{}"; delete mutable.requests; mutable.responses = ""; mutable.diagnostic = "{}";
    release();
    const result = await pending;
    expect(result.receiptUtf8).toBe(actual.receipt); expect(result.diagnosticUtf8).toBe(actual.diagnostic);
    expect(result.fullPairs.map(pair => pair.requestUtf8).join("")).toBe(actual.requests);
    expect(result.fullPairs.map(pair => pair.responseUtf8).join("")).toBe(actual.responses);
    expect(result.provenance.fullRunVerified).toBe(false);
  });
  it("honors cancellation before import and while asynchronous hashing is pending", async () => {
    const early = new AbortController(); early.abort();
    await expect(importFaultSourceReplay(actual, early.signal)).rejects.toThrow(/cancelled/);
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    const original = webcrypto.subtle.digest.bind(webcrypto.subtle);
    vi.spyOn(webcrypto.subtle, "digest").mockImplementation(async (algorithm, data) => { await gate; return original(algorithm, data); });
    const controller = new AbortController(), pending = importFaultSourceReplay(actual, controller.signal);
    controller.abort(); release(); await expect(pending).rejects.toThrow(/cancelled/);
  });
});
