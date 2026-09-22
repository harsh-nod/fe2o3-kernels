import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importResourceRecording } from "../src/content/recorded-resource-import";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";
import { projectResourceSourceValues } from "../src/content/resource-source-values";
import { retainedResourceExcerpt, type MutableResourceControl } from "./fixtures/recorded-resource-import";

// Requires a separately observed fresh capture. Missing files fail; never skip
// or replace these positives with the synthetic helper presentation fixtures.
const directory = "examples/helper-source-variable-resource-v2";
const requestName = "resource-helper-source-values.requests.jsonl";
const responseName = "resource-helper-source-values.responses.jsonl";
function actualFile(name: string, limit = 256 * 1024) {
  let bytes: Buffer;
  try { bytes = readFileSync(resolve(directory, name)); }
  catch { throw new Error("Missing actual helper recording: " + directory + "/" + name); }
  if (bytes.length === 0 || bytes.length > limit) throw new Error("Actual helper fixture byte limit: " + name);
  return bytes;
}
const provenance = parseProgramJson(actualFile("provenance.json").toString("utf8"), 256 * 1024) as MutableResourceControl;
function pinned(name: string) {
  const bytes = actualFile(name), pins = provenance.retained_files?.filter((pin: MutableResourceControl) => pin.path === name);
  if (!Array.isArray(pins) || pins.length !== 1 || pins[0].bytes !== bytes.length ||
      pins[0].sha256 !== createHash("sha256").update(bytes).digest("hex")) {
    throw new Error("Actual helper fixture differs from retained byte provenance: " + name);
  }
  return bytes;
}
const receipt = parseProgramJson(pinned("receipt.json").toString("utf8"), 256 * 1024) as MutableResourceControl;
if (receipt.status !== "passed" || receipt.purpose !== "existing-public-ordinary-helper-source-variable-resource-qualification" ||
    receipt.stack_profile !== "exact_two_frames_selected_current_helper_frame2_all_frame_ssa" ||
    receipt.source_variable_paging !== "complete_limit1" || receipt.raw_line_preservation !== true ||
    receipt.source_authentication !== false || receipt.hardware_observed !== false || receipt.performance_prediction !== false ||
    receipt.source_to_ssa_mapping !== "not_supplied" || receipt.dynamic_helper_activation !== "not_represented" ||
    receipt.allocation_reuse !== "not_represented" || !Array.isArray(receipt.checkpoints) || receipt.checkpoints.length !== 3 ||
    receipt.independent_result?.hardware_observed !== false || receipt.independent_result?.tail_canary_unchanged !== true) {
  throw new Error("Expected the actual ordinary-helper source-variable capture contract, not generated producer evidence.");
}
function excerpt(name: string) {
  const bytes = pinned(name), pins = receipt.excerpts?.filter((pin: MutableResourceControl) => pin.path === name);
  if (!Array.isArray(pins) || pins.length !== 1 || pins[0].bytes !== bytes.length ||
      pins[0].sha256 !== createHash("sha256").update(bytes).digest("hex")) {
    throw new Error("Actual helper excerpt differs from its capture receipt: " + name);
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (!text.endsWith("\n") || text.includes("\r") || text.charCodeAt(0) === 0xfeff || Buffer.byteLength(text) !== bytes.length) {
    throw new Error("Actual helper excerpt must retain exact UTF-8/LF bytes.");
  }
  return text;
}
const raw = { requests: excerpt(requestName), responses: excerpt(responseName) };
const requestLines = raw.requests.slice(0, -1).split("\n"), responseLines = raw.responses.slice(0, -1).split("\n");
const requests = requestLines.map(line => parseProgramJson(line, 65536) as MutableResourceControl);
const responses = responseLines.map(line => parseProgramJson(line, 65536) as MutableResourceControl);
if (requests.length !== responses.length || requests.length > 128 || requests.some((request, index) =>
  request.request_id !== responses[index].request_id || request.operation !== responses[index].operation || responses[index].status !== "ok")) {
  throw new Error("Actual helper excerpt must contain bounded paired successful original lines.");
}
const rowsForFrame = (rows: MutableResourceControl[], frame: number) => rows.filter(row => row.path.root.frame === frame);
const sourceFor = (checkpoint: Awaited<ReturnType<typeof importResourceRecording>>["checkpoints"][number]) => {
  const source = projectResourceSourceValues(checkpoint, checkpoint.sourceStack ?? null, checkpoint.sourceVariables ?? []);
  expect(source.status).toBe("ready");
  if (source.status !== "ready") throw new Error(source.detail);
  return source;
};

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());

it("imports the actual helper capture with original bytes, complete frame counts and distinct anchors", async () => {
  const recording = await importResourceRecording(raw.requests, raw.responses);
  expect(recording.pairs).toHaveLength(requests.length);
  expect(recording.pairs.map(pair => pair.requestUtf8).join("")).toBe(raw.requests);
  expect(recording.pairs.map(pair => pair.responseUtf8).join("")).toBe(raw.responses);
  expect(recording.checkpoints).toHaveLength(receipt.checkpoints.length);
  expect(recording.context.target).toBeNull(); expect(recording.context.variantIdentity).toBeNull();
  for (const [index, checkpoint] of recording.checkpoints.entries()) {
    const expected = receipt.checkpoints[index], source = sourceFor(checkpoint);
    const stack = checkpoint.sourceStack!.response as MutableResourceControl;
    const frames = stack.result.frames as MutableResourceControl[];
    const snapshot = (checkpoint.control.response as MutableResourceControl).result.snapshot.snapshot;
    const pages = checkpoint.sourceVariables ?? [];
    const values = pages.flatMap(pair => (pair.response as MutableResourceControl).values as MutableResourceControl[]);
    expect(checkpoint.control.requestId).toBe(expected.control_request_id);
    expect(checkpoint.anchor).toEqual(expected.checkpoint_anchor);
    expect(source.sourceAnchor).toEqual(expected.source_variable_anchor);
    expect(source.sourceAnchor).toEqual({ ...checkpoint.anchor, frame: 2, occurrence: 1 });
    expect(checkpoint.anchor).not.toHaveProperty("frame"); expect(checkpoint.anchor).not.toHaveProperty("occurrence");
    expect(frames.map(frame => frame.frame)).toEqual([1, 2]);
    expect(frames[0].function_ordinal).not.toBe(frames[1].function_ordinal);
    expect(source.stackFrameCount).toBe(frames.length); expect(source.stackFrame.frame).toBe(2);
    expect(source.stackFrame.functionOrdinal).toBe(frames[1].function_ordinal);
    expect(source.stackFrame.functionOrdinal).toBe(checkpoint.anchor.site?.kir.function_ordinal);
    expect(source.stackFrame.valueCount).toBe(frames[1].values.value_count);
    expect(source.totalSsaValueCount).toBe(snapshot.values.length);
    expect(source.totalSsaValueCount).toBeLessThanOrEqual(64);
    for (const frame of frames) {
      const rows = rowsForFrame(snapshot.values, frame.frame);
      expect(rows).toHaveLength(frame.values.value_count);
      expect(rows.every(row => row.path.root.function_ordinal === frame.function_ordinal)).toBe(true);
    }
    expect(pages.map(pair => pair.requestId)).toEqual(expected.source_variable_request_ids);
    expect(pages.length).toBeGreaterThanOrEqual(2); expect(pages.length).toBeLessThanOrEqual(32);
    expect(source.rows).toHaveLength(values.length); expect(source.rows.length).toBeLessThanOrEqual(64);
    expect(source.rows.map(row => row.identity)).toEqual(values.map(value => value.variable_identity));
    expect(source.rows.map(row => row.name)).toEqual(values.map(value => value.name));
    expect(source.rows.every(row => row.functionOrdinal === frames[1].function_ordinal)).toBe(true);
    expect(source.rows.some(row => row.status === "captured")).toBe(true);
    expect(source.rows.some(row => row.status === "unavailable" && row.representation === "not_represented")).toBe(true);
    for (const pair of pages) {
      expect(pair.request).toMatchObject({ frame: 2, page: { limit: 1 } });
      expect((pair.response as MutableResourceControl).values).toHaveLength(1);
    }
    expect(checkpoint.memories).toHaveLength(1);
    expect((checkpoint.memories[0].response as MutableResourceControl).result.snapshot).toEqual(checkpoint.anchor);
    expect(Object.isFrozen(checkpoint.sourceVariables)).toBe(true);
    expect(Object.isFrozen(checkpoint.sourceStack!.response)).toBe(true);
    const ssa = projectResourceCheckpointValues(checkpoint);
    expect(ssa.status).toBe("ready"); if (ssa.status !== "ready") throw new Error(ssa.detail);
    expect(ssa.rows).toHaveLength(snapshot.values.length);
  }
});

it("observes helper-specific reverse change, stable suspended caller, and exact repeated SSA state", async () => {
  const recording = await importResourceRecording(raw.requests, raw.responses);
  const groups = recording.checkpoints.map(checkpoint => ({ checkpoint, source: sourceFor(checkpoint),
    response: checkpoint.control.response as MutableResourceControl,
    memory: (checkpoint.memories[0].response as MutableResourceControl).result.memory }));
  const [forward, reverse, repeat] = groups;
  expect(recording.checkpoints.map(checkpoint => (checkpoint.control.request as MutableResourceControl).direction)).toEqual(["forward", "reverse", "forward"]);
  const values = (group: typeof forward) => group.response.result.snapshot.snapshot.values as MutableResourceControl[];
  expect(reverse.checkpoint.anchor.cursor.event_sequence).toBeLessThan(forward.checkpoint.anchor.cursor.event_sequence);
  expect(repeat.checkpoint.anchor.cursor.event_sequence).toBe(forward.checkpoint.anchor.cursor.event_sequence);
  expect(reverse.checkpoint.anchor.cursor.state_revision).toBe(forward.checkpoint.anchor.cursor.state_revision + 1);
  expect(repeat.checkpoint.anchor.cursor.state_revision).toBe(reverse.checkpoint.anchor.cursor.state_revision + 1);
  expect(rowsForFrame(values(reverse), 1)).toEqual(rowsForFrame(values(forward), 1));
  expect(rowsForFrame(values(reverse), 2)).not.toEqual(rowsForFrame(values(forward), 2));
  expect(values(repeat)).toEqual(values(forward));
  for (const group of [reverse, repeat]) {
    expect(group.source.rows).toEqual(forward.source.rows);
    expect(group.memory).toEqual(forward.memory);
  }
  // Synthetic cross-stop joins of unchanged original pairs: old query IDs fail
  // before revision checks. Neither refusal may return prior-checkpoint rows.
  expect(projectResourceSourceValues(repeat.checkpoint, forward.checkpoint.sourceStack ?? null,
    forward.checkpoint.sourceVariables ?? [])).toEqual({
    status: "invalid", detail: "Retained query IDs must be unique and ordered.",
  });
  // The converse join has increasing IDs and reaches the revision guard.
  expect(projectResourceSourceValues(forward.checkpoint, repeat.checkpoint.sourceStack ?? null,
    repeat.checkpoint.sourceVariables ?? [])).toEqual({
    status: "stale", detail: "Source query uses another revision.",
  });
});

// Lossless serialization is used only for explicitly synthetic rejection controls.
function syntheticJson(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(syntheticJson).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.entries(value)
    .map(([key, entry]) => JSON.stringify(key) + ":" + syntheticJson(entry)).join(",") + "}";
  return JSON.stringify(value)!;
}
function mutated(side: "requests" | "responses", id: number, edit: (row: MutableResourceControl) => void) {
  const lines = side === "requests" ? requestLines : responseLines;
  return { ...raw, [side]: lines.map(line => {
    const value = parseProgramJson(line, 65536) as MutableResourceControl;
    if (value.request_id !== id) return line;
    edit(value); return syntheticJson(value);
  }).join("\n") + "\n" };
}
it("refuses incomplete and synthetically mutated actual helper groups rather than dropping source evidence", async () => {
  const firstSourceId = receipt.checkpoints[0].source_variable_request_ids[0];
  const lastSourceId = receipt.checkpoints[0].source_variable_request_ids.at(-1);
  const stackId = requests.find(request => request.operation === "inspect_stack")!.request_id;
  const incomplete = {
    requests: requestLines.filter((_, index) => requests[index].request_id !== lastSourceId).join("\n") + "\n",
    responses: responseLines.filter((_, index) => responses[index].request_id !== lastSourceId).join("\n") + "\n",
  };
  const cases: [typeof raw, string][] = [
    [incomplete, "source_values_refused"],
    [mutated("requests", firstSourceId, row => { row.frame = 1; }), "source_values_refused"],
    [mutated("requests", firstSourceId, row => { row.expected_revision--; }), "stale_request"],
    [mutated("responses", firstSourceId, row => { row.status = "unavailable"; }), "response_refused"],
    [mutated("responses", stackId, row => { row.result.frames[0].values.value_count++; }), "source_values_refused"],
    [mutated("responses", stackId, row => { row.result.frames.pop(); }), "source_values_refused"],
  ];
  for (const [control, reason] of cases) await expect(importResourceRecording(control.requests, control.responses)).rejects.toThrow(reason);
});

it("preserves the actual older no-source recording and existing actual frame1 profile", async () => {
  const legacy = retainedResourceExcerpt(), old = await importResourceRecording(legacy.requests, legacy.responses);
  expect(old.pairs.map(pair => pair.requestUtf8).join("")).toBe(legacy.requests);
  for (const checkpoint of old.checkpoints) expect(projectResourceSourceValues(checkpoint,
    checkpoint.sourceStack ?? null, checkpoint.sourceVariables ?? []).status).toBe("unavailable");
  const original = "examples/source-variable-resource-v2";
  const root = await importResourceRecording(
    readFileSync(resolve(original, "resource-source-values.requests.jsonl"), "utf8"),
    readFileSync(resolve(original, "resource-source-values.responses.jsonl"), "utf8"));
  for (const checkpoint of root.checkpoints) {
    const source = sourceFor(checkpoint);
    expect(source.stackFrameCount).toBe(1); expect(source.stackFrame.frame).toBe(1);
    expect(source.totalSsaValueCount).toBe(source.stackFrame.valueCount);
  }
});
