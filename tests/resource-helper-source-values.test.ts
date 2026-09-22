import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { syntheticHelperSourceImportPairs, syntheticHelperSourceValueGroup } from "./fixtures/resource-helper-source-values";
import { syntheticSourceValueGroup } from "./fixtures/resource-source-values";
import { encodeSyntheticSourcePairs } from "./fixtures/recorded-source-values-integration";
import type { MutableResourceControl } from "./fixtures/recorded-resource-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
type Group = ReturnType<typeof syntheticHelperSourceValueGroup>;
const project = (group: Group) => projectResourceSourceValues(group.checkpoint, group.stack, group.sourcePages);
const control = (group: Group) => group.checkpoint.control.response as MutableResourceControl;

it("synthetically joins current helper frame2 values with the complete two-frame SSA snapshot", () => {
  const group = syntheticHelperSourceValueGroup(), original = structuredClone(group), source = project(group);
  expect(source.status).toBe("ready"); if (source.status !== "ready") throw new Error(source.detail);
  expect(source.stackFrameCount).toBe(2); expect(source.totalSsaValueCount).toBe(4);
  expect(source.stackFrame).toEqual({ frame: 2, functionOrdinal: 7, blockOrdinal: 0, nextOperation: 1, valueCount: 2 });
  expect(source.sourceAnchor).toEqual({ ...source.checkpointAnchor, frame: 2, occurrence: 1 });
  expect(source.checkpointAnchor).not.toHaveProperty("frame");
  expect(source.rows.map(row => [row.name, row.functionOrdinal, row.status, row.generation])).toEqual([
    ["value", 7, "captured", "1"], ["adjusted", 7, "unavailable", "0"],
  ]);
  expect(source.rows[0].representation).toBe("0x3f800000");
  expect(source.rows[0].interpretation).toBe("Raw bits only; floating-point decoding is not inferred.");
  const ssa = projectResourceCheckpointValues(group.checkpoint);
  expect(ssa.status).toBe("ready"); if (ssa.status !== "ready") throw new Error(ssa.detail);
  expect(ssa.rows.map(row => row.frame)).toEqual(["1", "1", "2", "2"]);
  expect(group).toEqual(original);
  expect(group.stack.response.result.frames[0]).not.toHaveProperty("next_operation");
});
it("keeps the legacy single-frame profile and its count semantics", () => {
  const group = syntheticSourceValueGroup(), source = projectResourceSourceValues(group.checkpoint, group.stack, group.sourcePages);
  expect(source.status).toBe("ready"); if (source.status !== "ready") throw new Error(source.detail);
  expect(source.stackFrameCount).toBe(1); expect(source.stackFrame.frame).toBe(1);
  expect(source.totalSsaValueCount).toBe(2); expect(source.stackFrame.valueCount).toBe(2);
  expect(projectResourceSourceValues(group.checkpoint, null, []).status).toBe("unavailable");
});
it.each([
  ["missing caller", (group: Group) => { group.stack.response.result.frames.shift(); }],
  ["missing helper", (group: Group) => { group.stack.response.result.frames.pop(); }],
  ["extra nested frame", (group: Group) => { group.stack.response.result.frames.push(structuredClone(group.stack.response.result.frames[1])); }],
  ["duplicate frame identity", (group: Group) => { group.stack.response.result.frames[1].frame = 1; }],
  ["noncontiguous frame identity", (group: Group) => { group.stack.response.result.frames[1].frame = 3; }],
  ["same-function recursion", (group: Group) => {
    group.stack.response.result.frames[0].function_ordinal = 7;
    for (const row of control(group).result.snapshot.snapshot.values) {
      if (row.path.root.frame === 1) row.path.root.function_ordinal = 7;
    }
  }],
  ["wrong caller function", (group: Group) => { group.stack.response.result.frames[0].function_ordinal = 6; }],
  ["wrong current helper function", (group: Group) => { group.stack.response.result.frames[1].function_ordinal = 8; }],
  ["wrong current helper block", (group: Group) => { group.stack.response.result.frames[1].block_ordinal = 1; }],
  ["truncated helper SSA", (group: Group) => { group.stack.response.result.frames[1].values.value_count++; }],
  ["false count split with same total", (group: Group) => {
    group.stack.response.result.frames[0].values.value_count++; group.stack.response.result.frames[1].values.value_count--;
  }],
  ["unavailable caller SSA", (group: Group) => { group.stack.response.result.frames[0].values = { status: "unavailable", reason: "truncated" }; }],
  ["unaccounted SSA frame", (group: Group) => { control(group).result.snapshot.snapshot.values[0].path.root.frame = 3; }],
  ["SSA function on wrong frame", (group: Group) => { control(group).result.snapshot.snapshot.values[0].path.root.function_ordinal = 7; }],
  ["too-small stack request", (group: Group) => { group.stack.request.page.limit = 1; }],
  ["partial stack cursor", (group: Group) => { group.stack.response.result.next_cursor = { query_identity: "f".repeat(64), position: 1 }; }],
  ["explicit null caller next operation", (group: Group) => { group.stack.response.result.frames[0].next_operation = null; }],
  ["absent helper next operation", (group: Group) => { delete group.stack.response.result.frames[1].next_operation; }],
  ["caller source request", (group: Group) => { group.sourcePages[0].request.frame = 1; }],
  ["caller source anchor", (group: Group) => { group.sourcePages[0].response.snapshot.frame = 1; }],
  ["source variable of caller", (group: Group) => { group.sourcePages[0].response.values[0].function_ordinal = 0; }],
  ["invented activation", (group: Group) => { group.sourcePages[0].response.snapshot.occurrence = 2; }],
  ["incomplete source pages", (group: Group) => { group.sourcePages.pop(); }],
  ["frame changed between pages", (group: Group) => { group.sourcePages[1].request.frame = 1; }],
  ["stale page cursor", (group: Group) => { group.sourcePages[1].request.page.cursor.query_identity = "a".repeat(64); }],
  ["stale source stop", (group: Group) => { group.sourcePages[0].response.session.cursor.event_sequence--; }],
  ["unknown optional frame property", (group: Group) => { group.stack.response.result.frames[0].activation = 1; }],
])("refuses synthetic %s without producing a partial helper table", (_name, mutate) => {
  const group = syntheticHelperSourceValueGroup(); mutate(group); expect(project(group).status).not.toBe("ready");
});
it("retains unchanged source rows separately from distinct reverse and repeated SSA states", () => {
  const groups = [syntheticHelperSourceValueGroup(), syntheticHelperSourceValueGroup(1, 3, false), syntheticHelperSourceValueGroup(2, 4)];
  const sources = groups.map(project);
  for (const source of sources) expect(source.status).toBe("ready");
  if (sources.some(source => source.status !== "ready")) throw new Error("synthetic source control refused");
  expect(sources[1]).toMatchObject({ totalSsaValueCount: 3, stackFrame: { frame: 2, valueCount: 1 } });
  expect(sources[2]).toMatchObject({ totalSsaValueCount: 4, stackFrame: { frame: 2, valueCount: 2 } });
  expect(projectResourceSourceValues(groups[2].checkpoint, groups[0].stack, groups[0].sourcePages).status).toBe("stale");
});
it("imports synthetic helper groups with raw lines and original anchor shapes preserved", async () => {
  const raw = encodeSyntheticSourcePairs(syntheticHelperSourceImportPairs()), recording = await importResourceRecording(raw.requests, raw.responses);
  expect(recording.pairs).toHaveLength(15); expect(recording.checkpoints).toHaveLength(3);
  expect(recording.pairs.map(pair => pair.requestUtf8).join("")).toBe(raw.requests);
  expect(recording.pairs.map(pair => pair.responseUtf8).join("")).toBe(raw.responses);
  for (const checkpoint of recording.checkpoints) {
    const source = projectResourceSourceValues(checkpoint, checkpoint.sourceStack ?? null, checkpoint.sourceVariables ?? []);
    expect(source.status).toBe("ready");
    if (source.status !== "ready") throw new Error(source.detail);
    expect(source.sourceAnchor.frame).toBe(2); expect(source.checkpointAnchor).not.toHaveProperty("frame");
    expect(source.stackFrameCount).toBe(2); expect(checkpoint.memories).toHaveLength(1);
  }
});
it("refuses incomplete or failed helper imports rather than dropping the source group", async () => {
  for (const missing of [[5], [6], [7], [6, 7]]) {
    const pairs = syntheticHelperSourceImportPairs().filter(pair => !missing.includes(pair.request.request_id));
    const raw = encodeSyntheticSourcePairs(pairs);
    await expect(importResourceRecording(raw.requests, raw.responses)).rejects.toThrow("source_values_refused");
  }
  const failed = syntheticHelperSourceImportPairs(); failed[2].response.status = "unavailable";
  const raw = encodeSyntheticSourcePairs(failed);
  await expect(importResourceRecording(raw.requests, raw.responses)).rejects.toThrow("response_refused");
});
