import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importWatchSourceObservation } from "../src/content/recorded-watch-source-observation";
import { importRecordedWatchpoint } from "../src/content/recorded-watchpoint-observation";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { readActualWatchSourceCapture } from "./fixtures/actual-watch-source-capture";
import type { MutableResourceControl as Row } from "./fixtures/recorded-resource-import";
const actual = readActualWatchSourceCapture();
beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

it("joins the exact actual full session and disjoint original excerpts without rewriting count2 controls", async () => {
  const result = await importWatchSourceObservation(actual.files);
  expect(result.fullPairs).toHaveLength(actual.receipt.full_pairs);
  expect(result.fullPairs.map(p => p.requestUtf8).join("")).toBe(actual.files.fullRequests);
  expect(result.fullPairs.map(p => p.responseUtf8).join("")).toBe(actual.files.fullResponses);
  expect(result.receiptUtf8).toBe(actual.files.receipt);
  expect(result.watchpoint).toEqual(await importRecordedWatchpoint(actual.files.watchRequests, actual.files.watchResponses));
  expect(result.source).toEqual(await importResourceRecording(actual.files.sourceRequests, actual.files.sourceResponses));
  expect(result.source.checkpoints.map(cp => (cp.control.request as Row).count)).toEqual(actual.receipt.source_control_counts);
  expect(result.source.checkpoints.map(cp => cp.anchor.scope.level === "lane" ? cp.anchor.scope.lane : null)).toEqual(actual.receipt.source_checkpoint_lanes);
  expect(result.source.pairs.every(p => !result.watchpoint.pairs.some(w => w.requestId === p.requestId))).toBe(true);
  expect(result.provenance).toEqual({ kind: "caller_supplied_unverified", sourceAuthentication: false,
    hardwareObserved: false, performancePrediction: false, runtimeClosureVerified: false });
});

it("retains both actual source refusals and a distinct immediate checkpoint with no invented next operation", async () => {
  const result = await importWatchSourceObservation(actual.files);
  expect(result.watchSourceRefusal.response).toEqual(actual.byId(actual.receipt.watchpoint_source_query_request_id).response);
  expect(result.immediateSourceRefusal.response).toEqual(actual.byId(actual.receipt.immediate_checkpoint_source_query_request_id).response);
  for (const p of [result.watchSourceRefusal, result.immediateSourceRefusal]) {
    expect(p.response).toMatchObject({ status: "unavailable", reason: "checkpoint_not_captured" });
    expect(p.response).not.toHaveProperty("values"); expect(p.response).not.toHaveProperty("snapshot");
  }
  expect(actual.immediateStack.response.result.frames[0]).not.toHaveProperty("next_operation");
  expect(result.immediate.anchor).toEqual(actual.receipt.immediate_checkpoint_anchor);
  expect(result.immediate.sourceVariables).toBeUndefined();
  expect(result.immediate.anchor).not.toEqual(result.source.checkpoints[0].anchor);
  expect(result.watchpoint.stop).not.toHaveProperty("scope");
  expect(actual.refusals.filter(p => p.response.status === "error").every(p => p.response.error.state_changed === false)).toBe(true);
});

it("uses every actual source page, counts whole SSA state and preserves truthful unavailable locals", async () => {
  const result = await importWatchSourceObservation(actual.files);
  for (const [i, cp] of result.source.checkpoints.entries()) {
    const group = actual.groups[i], source = projectResourceSourceValues(cp, cp.sourceStack!, cp.sourceVariables!);
    const ssa = projectResourceCheckpointValues(cp);
    expect(source.status).toBe("ready"); expect(ssa.status).toBe("ready");
    if (source.status !== "ready" || ssa.status !== "ready") throw new Error("Actual group did not project.");
    expect(cp.anchor).toEqual(group.summary.checkpoint_anchor); expect(source.sourceAnchor).toEqual(group.summary.source_anchor);
    expect(source.sourceAnchor).toEqual({ ...cp.anchor, frame: 1, occurrence: 1 }); expect(cp.anchor).not.toHaveProperty("frame");
    expect(source.sourceRequestIds).toEqual(group.summary.source_request_ids);
    expect(source.rows).toHaveLength(group.sourceRows.length); expect(ssa.rows).toHaveLength(group.ssaRows.length);
    expect(source.rows.map(r => r.identity)).toEqual(group.sourceRows.map(r => r.variable_identity));
    expect(source.rows.map(r => r.name)).toEqual(group.sourceRows.map(r => r.name));
    const captured = source.rows.filter(r => r.status === "captured");
    expect(captured.map(r => r.name).sort()).toEqual(["a", "b"]);
    expect(captured.every(r => r.generation === "1")).toBe(true);
    expect(source.rows.filter(r => !["a", "b"].includes(r.name)).every(r => r.status === "unavailable" &&
      r.generation === "0" && r.representation === "not_represented")).toBe(true);
    expect(cp.memories[0].response).toEqual(group.memory.response);
  }
});

it("observes cross-invocation reverse/forward restoration without dynamic-frame or source-to-SSA inference", async () => {
  const result = await importWatchSourceObservation(actual.files), [later, reverse, repeat] = result.source.checkpoints;
  expect(reverse.anchor.cursor.event_sequence).toBeLessThan(result.watchpoint.stop.cursor.event_sequence);
  expect(repeat.anchor.cursor.event_sequence).toBe(later.anchor.cursor.event_sequence);
  expect(repeat.anchor.cursor.state_revision).toBeGreaterThan(later.anchor.cursor.state_revision);
  expect(actual.groups[1].ssaRows).not.toEqual(actual.groups[0].ssaRows);
  expect(actual.groups[2].ssaRows).toEqual(actual.groups[0].ssaRows);
  expect(actual.groups[1].sourceRows).toEqual(actual.groups[0].sourceRows);
  expect(actual.groups[2].sourceRows).toEqual(actual.groups[0].sourceRows);
  const memory = actual.groups.map(g => g.memory.response.result.memory);
  expect(memory[1].availability.bytes).not.toBe(memory[0].availability.bytes);
  expect(memory[2]).toEqual(memory[0]);
  // Synthetic cross-stop projection joins of unchanged actual pairs: refusal,
  // not another observation and not a requirement on internal error ordering.
  for (const [cp, foreign] of [[repeat, later], [later, repeat]]) {
    const refused = projectResourceSourceValues(cp, foreign.sourceStack!, foreign.sourceVariables!);
    expect(refused.status).not.toBe("ready"); expect(refused).not.toHaveProperty("rows");
  }
});

it("rejects altered actual raw bytes and missing pages rather than showing prior values", async () => {
  const missingId = actual.groups[0].pages.at(-1)!.request.request_id;
  const requests = actual.files.sourceRequests.split("\n").filter(line => !line || !line.includes('"request_id":' + missingId + ",")).join("\n");
  await expect(importWatchSourceObservation({ ...actual.files, sourceRequests: requests })).rejects.toThrow(/file_hash/);
  await expect(importWatchSourceObservation({ ...actual.files,
    fullResponses: actual.files.fullResponses.replace('"state_changed":false', '"state_changed":true') })).rejects.toThrow(/file_hash/);
});
