// Synthetic presentation controls only. Fresh actual-capture/browser qualification is a separate gate.
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importWatchSourceObservation, readWatchSourceFile, WATCH_SOURCE_FILES, type WatchSourceFiles } from "../src/content/recorded-watch-source-observation";
import { importRecordedWatchpoint } from "../src/content/recorded-watchpoint-observation";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { syntheticWatchSourceCapture, syntheticWatchSourceFiles, repinSyntheticWatchSourceFiles,
  type SyntheticWatchSourceCapture } from "./fixtures/recorded-watch-source-observation";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("separate watch/source presentation profile — synthetic controls", () => {
  it("joins exact original lines without changing the seven-pair or resource importers", async () => {
    const files = await syntheticWatchSourceFiles(), before = structuredClone(files);
    const result = await importWatchSourceObservation(files);
    expect(files).toEqual(before);
    expect(result.watchpoint).toEqual(await importRecordedWatchpoint(files.watchRequests, files.watchResponses));
    expect(result.source).toEqual(await importResourceRecording(files.sourceRequests, files.sourceResponses));
    expect(result.watchpoint.pairs).toHaveLength(7);
    expect(result.source.checkpoints.map(c => (c.control.request as { count: number }).count)).toEqual([1, 2, 2]);
    expect(result.source.checkpoints.map(c => c.anchor.scope.level === "lane" ? c.anchor.scope.lane : null)).toEqual([1, 0, 1]);
    for (const cp of result.source.checkpoints) expect(projectResourceSourceValues(cp, cp.sourceStack!, cp.sourceVariables!)).toMatchObject({ status: "ready" });
    const originalRequests = files.fullRequests.split("\n").slice(0, -1).map(l => l + "\n");
    const originalResponses = files.fullResponses.split("\n").slice(0, -1).map(l => l + "\n");
    result.fullPairs.forEach((p, i) => { expect(p.requestUtf8).toBe(originalRequests[i]); expect(p.responseUtf8).toBe(originalResponses[i]); });
    expect(result.source.pairs.every(p => !result.watchpoint.pairs.some(w => p.requestId === w.requestId))).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.fullPairs[0].response)).toBe(true);
  });
  it("keeps both source refusals separate from lane-1, lane-0 and repeated lane-1 source groups", async () => {
    const result = await importWatchSourceObservation(await syntheticWatchSourceFiles());
    expect(result.watchpoint.stop.snapshot).toEqual({ status: "unavailable", reason: "not_captured" });
    expect(result.watchpoint.stop).not.toHaveProperty("scope");
    expect(result.watchSourceRefusal.response).toMatchObject({ status: "unavailable", reason: "checkpoint_not_captured" });
    expect(result.immediateSourceRefusal.response).toMatchObject({ status: "unavailable", reason: "checkpoint_not_captured" });
    expect(result.immediate.sourceVariables).toBeUndefined();
    expect(result.immediate.anchor).not.toEqual(result.source.checkpoints[0].anchor);
    expect(result.source.checkpoints[0].anchor.cursor.event_sequence).toBe(result.source.checkpoints[2].anchor.cursor.event_sequence);
    expect(result.source.checkpoints[0].anchor.cursor.state_revision).not.toBe(result.source.checkpoints[2].anchor.cursor.state_revision);
    expect(result.fullPairs.filter(p => p.response.status === "error")).toHaveLength(3);
    expect(result.provenance).toEqual({ kind: "caller_supplied_unverified", sourceAuthentication: false,
      hardwareObserved: false, performancePrediction: false, runtimeClosureVerified: false });
  });
  it("refuses missing roles, unsupported roles and overlarge files before treating them as recordings", async () => {
    const files = await syntheticWatchSourceFiles(), missing = { ...files } as Partial<Record<keyof WatchSourceFiles, string>>;
    delete missing.fullRequests;
    await expect(importWatchSourceObservation(missing as WatchSourceFiles)).rejects.toThrow();
    await expect(importWatchSourceObservation({ ...files, authenticated: true } as WatchSourceFiles)).rejects.toThrow();
    await expect(importWatchSourceObservation({ ...files, receipt: " ".repeat(1024 ** 2 + 1) })).rejects.toThrow();
    await expect(importWatchSourceObservation({ ...files, fullResponses: " ".repeat(4 * 1024 ** 2 + 1) })).rejects.toThrow();
  });
  it("checks SHA-256 byte pins, duplicate-key JSON and exact full-session subsequences", async () => {
    const files = await syntheticWatchSourceFiles();
    await expect(importWatchSourceObservation({ ...files, fullResponses: files.fullResponses.replace('"active"', '"done"') })).rejects.toThrow(/file_hash/);
    await expect(importWatchSourceObservation({ ...files, receipt: files.receipt.replace('"status": "passed"', '"status":"passed","status":"passed"') })).rejects.toThrow(/json/);
    const rehashed = await repinSyntheticWatchSourceFiles({ ...files,
      sourceRequests: files.sourceRequests.replace('{"schema"', '{ "schema"') });
    await expect(importWatchSourceObservation(rehashed)).rejects.toThrow(/subsequence/);
  });
  const negatives: readonly [string, (capture: SyntheticWatchSourceCapture) => void][] = [
    ["stale source expected revision", c => { c.full[12].request.expected_revision--; }],
    ["cross-session source response", c => { c.full[12].response.session.configuration_identity = "e".repeat(64); }],
    ["old checkpoint anchor on repeated source", c => { c.full[25].response.snapshot = structuredClone(c.full[12].response.snapshot); }],
    ["wrong later lane", c => { c.full[10].response.result.snapshot.snapshot.anchor.scope.lane = 0; }],
    ["wrong later logical invocation", c => { c.full[10].response.result.snapshot.snapshot.anchor.scope.logical_workitem = [0, 0, 0]; }],
    ["silently collapsed reverse count", c => { c.full[16].request.count = 1; }],
    ["silently collapsed repeated forward count", c => { c.full[23].request.count = 1; }],
    ["source values invented at watch stop", c => { c.full[5].response.values = c.full[12].response.values; }],
    ["source values invented immediately after store", c => { c.full[8].response.values = c.full[12].response.values; }],
    ["fabricated next operation after terminal store", c => { c.full[7].response.result.frames[0].next_operation = 0; }],
    ["incomplete source page chain", c => { c.full[13].response.next_cursor = { query_identity: "d".repeat(64), position: 4 }; }],
    ["changed source cursor selector", c => { c.full[13].request.selector = { selector: "name", name: "a" }; }],
    ["cross-stop memory", c => { c.full[14].response.result.snapshot = structuredClone(c.full[9].response.result.snapshot); }],
    ["wrong reverse memory restoration", c => { c.full[20].response.result.memory.availability.bytes = c.full[14].response.result.memory.availability.bytes; }],
    ["different repeated SSA rows", c => { c.full[23].response.result.snapshot.snapshot.values[2].availability.value.bits = "0x000001d6"; }],
    ["different repeated source rows", c => { c.full[26].response.values[1].availability.value.reason = "not_in_scope"; }],
    ["source query alleged to mutate state", c => { c.full[21].response.error.state_changed = true; }],
    ["invented activation identity", c => { c.full[12].response.snapshot.activation = 1; }],
    ["invented source-to-SSA correspondence", c => { c.full[12].response.values[0].ssa_value_ordinal = 0; }],
    ["source-authentication authority in receipt", c => { c.receipt.source_authentication = true; }],
    ["hardware authority in session", c => { c.full[12].response.session.hardware_observed = true; }],
    ["extra authority field in receipt", c => { c.receipt.proof_admitted = true; }],
    ["missing terminate", c => { c.full.pop(); c.receipt.full_pairs--; }],
    ["unsupported end operation", c => { c.full[28].request.operation = c.full[28].response.operation = "continue"; }],
    ["extra hidden full-session operation", c => { const p = structuredClone(c.full[28]); p.request.request_id = p.response.request_id = 30; c.full.push(p); c.receipt.full_pairs++; }],
  ];
  it.each(negatives)("refuses %s even when the synthetic file hashes agree", async (_name, mutate) => {
    const capture = syntheticWatchSourceCapture(); mutate(capture);
    await expect(importWatchSourceObservation(await syntheticWatchSourceFiles(capture))).rejects.toThrow();
  });
  it("does not silently turn a full transcript into the old seven-pair profile", async () => {
    const files = await syntheticWatchSourceFiles();
    await expect(importRecordedWatchpoint(files.fullRequests, files.fullResponses)).rejects.toThrow(/pair_count/);
    await expect(importWatchSourceObservation(await repinSyntheticWatchSourceFiles({ ...files,
      watchRequests: files.fullRequests, watchResponses: files.fullResponses }))).rejects.toThrow();
  });
  it.each(["replace", "delete"] as const)("pins one synchronous string snapshot if the caller later %ss its input during hashing", async change => {
    const original = await syntheticWatchSourceFiles();
    const expected = await importWatchSourceObservation(original);
    const provided: Record<string, unknown> = { ...original };
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const nativeDigest = webcrypto.subtle.digest.bind(webcrypto.subtle);
    const digest = vi.fn(async (...args: Parameters<typeof nativeDigest>) => {
      await gate; return nativeDigest(...args);
    });
    vi.stubGlobal("crypto", { subtle: { digest } });
    const pending = importWatchSourceObservation(provided as unknown as WatchSourceFiles);
    expect(digest).toHaveBeenCalledTimes(WATCH_SOURCE_FILES.length);
    for (const spec of WATCH_SOURCE_FILES) {
      if (change === "replace") provided[spec.role] = "{}\n";
      else delete provided[spec.role];
    }
    provided.source_authenticated = true;
    release();
    const result = await pending;
    expect(result).toEqual(expected);
    expect(result.receiptUtf8).toBe(original.receipt);
    expect(result.fullPairs.map(p => p.requestUtf8).join("")).toBe(original.fullRequests);
    expect(result.fullPairs.map(p => p.responseUtf8).join("")).toBe(original.fullResponses);
    expect(result.provenance.sourceAuthentication).toBe(false);
  });
  it("cancels, enforces each reader's role cap and rejects malformed UTF-8", async () => {
    const aborted = new AbortController(); aborted.abort();
    expect(() => readWatchSourceFile(new File(["x"], "x"), "receipt", aborted.signal)).toThrow(/cancelled/);
    const controller = new AbortController();
    for (const spec of WATCH_SOURCE_FILES) await expect(readWatchSourceFile(new File(["x".repeat(spec.limit + 1)], "large"), spec.role, controller.signal)).rejects.toThrow();
    await expect(readWatchSourceFile(new File([new Uint8Array([0xc3, 0x28])], "bad-utf8"), "receipt", controller.signal)).rejects.toThrow();
    await expect(readWatchSourceFile(new File([new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d])], "bom"), "receipt", controller.signal)).rejects.toThrow(/utf8/);
    await expect(importWatchSourceObservation(await syntheticWatchSourceFiles(), aborted.signal)).rejects.toThrow(/cancelled/);
  });
});
