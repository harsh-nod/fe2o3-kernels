import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { importResourceRecording, type ImportedResourceRecording } from "../src/content/recorded-resource-import";
import { RESOURCE_BOOKMARK_MAX_BYTES, RESOURCE_BOOKMARK_SCHEMA, ResourceBookmarkError,
  readResourceBookmarkFile, restoreResourceSelectionBookmark, serializeResourceSelectionBookmark,
  type ResourceBookmarkSelection } from "../src/content/resource-selection-bookmark";
import { recordedComparison, comparisonWindow } from "./fixtures/resource-memory-comparison";
import { retainedResourceExcerpt, type MutableResourceControl } from "./fixtures/recorded-resource-import";
import multiRequests from "../examples/source_lds_multi_workgroup_v1.requests.jsonl?raw";
import multiResponses from "../examples/source_lds_multi_workgroup_v1.responses.jsonl?raw";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const globalSelection: ResourceBookmarkSelection = {
  checkpointRequestId: 6, pageRequestId: 7, memoryRequestId: 11,
  baseline: { checkpointRequestId: 14, memoryRequestId: 15 },
};
function document(recording: ImportedResourceRecording, selection = globalSelection): MutableResourceControl {
  return JSON.parse(serializeResourceSelectionBookmark(recording, selection));
}
function reopen(recording: ImportedResourceRecording, data: unknown) {
  return restoreResourceSelectionBookmark(recording, JSON.stringify(data));
}
async function multiRecording() {
  const pick = (raw: string) => raw.trimEnd().split("\n").filter(line => {
    const id = JSON.parse(line).request_id; return id >= 79 && id <= 89;
  }).join("\n") + "\n";
  return importResourceRecording(pick(multiRequests), pick(multiResponses));
}

it.each(["global", "lds"] as const)("round-trips the actual %s selection, exact anchors and unchanged original bytes", async kind => {
  const recording = await recordedComparison(kind), before = JSON.stringify(recording);
  const selected = kind === "global" ? globalSelection : { checkpointRequestId: 11, pageRequestId: 14,
    memoryRequestId: 13, baseline: { checkpointRequestId: 16, memoryRequestId: 17 } };
  const raw = serializeResourceSelectionBookmark(recording, selected), saved = JSON.parse(raw);
  expect(new TextEncoder().encode(raw).byteLength).toBeLessThan(RESOURCE_BOOKMARK_MAX_BYTES);
  expect(saved.schema).toBe(RESOURCE_BOOKMARK_SCHEMA);
  expect(saved.recording).toEqual({ requests: { sha256: recording.requestSha256, bytes: recording.requestBytes },
    responses: { sha256: recording.responseSha256, bytes: recording.responseBytes }, context: recording.context });
  expect(saved.anchor).toEqual(recording.checkpoints[0].anchor);
  expect(restoreResourceSelectionBookmark(recording, raw)).toEqual(selected);
  expect(JSON.stringify(recording)).toBe(before);
  expect(raw).not.toContain("requestUtf8"); expect(raw).not.toContain("responseUtf8");
  expect(raw).not.toContain("physical_register"); expect(raw).not.toContain("source_sha256");
  expect(Object.isFrozen(restoreResourceSelectionBookmark(recording, raw))).toBe(true);
});
it("distinguishes the same event at different revisions and permits a genuinely empty page collection", async () => {
  const recording = await recordedComparison();
  const selected = { checkpointRequestId: 18, pageRequestId: null, memoryRequestId: 21,
    baseline: { checkpointRequestId: 6, memoryRequestId: 11 } };
  const saved = document(recording, selected);
  expect(saved.anchor.cursor.event_sequence).toBe(saved.baselineAnchor.cursor.event_sequence);
  expect(saved.anchor.cursor.state_revision).not.toBe(saved.baselineAnchor.cursor.state_revision);
  expect(reopen(recording, saved)).toEqual(selected);
  saved.anchor.cursor.state_revision = saved.baselineAnchor.cursor.state_revision;
  expect(() => reopen(recording, saved)).toThrow(/anchor differs/u);
});
it("preserves actual unavailable and incompatible multi-workgroup selections without inventing values", async () => {
  const recording = await multiRecording();
  for (const selected of [
    { checkpointRequestId: 83, pageRequestId: 84, memoryRequestId: 85, baseline: { checkpointRequestId: 86, memoryRequestId: 89 } },
    { checkpointRequestId: 79, pageRequestId: 80, memoryRequestId: 81, baseline: { checkpointRequestId: 83, memoryRequestId: 85 } },
    { checkpointRequestId: 83, pageRequestId: 84, memoryRequestId: 85, baseline: { checkpointRequestId: 86, memoryRequestId: 88 } },
  ]) expect(reopen(recording, document(recording, selected))).toEqual(selected);
});
it("binds file bytes, not filenames or semantically equivalent reserialization", async () => {
  const recording = await recordedComparison(), input = retainedResourceExcerpt();
  const changed = await importResourceRecording(input.requests.replace('{"schema"', '{ "schema"'), input.responses);
  const raw = serializeResourceSelectionBookmark(recording, globalSelection);
  expect(changed.requestSha256).not.toBe(recording.requestSha256);
  expect(() => restoreResourceSelectionBookmark(changed, raw)).toThrow(/file bytes/u);
});
it.each(["requests-sha", "responses-sha", "requests-count", "responses-count", "swapped", "context", "target", "variant"])(
  "rejects mismatched %s binding atomically", async kind => {
    const recording = await recordedComparison(), saved = document(recording);
    if (kind === "requests-sha") saved.recording.requests.sha256 = "b".repeat(64);
    if (kind === "responses-sha") saved.recording.responses.sha256 = "c".repeat(64);
    if (kind === "requests-count") saved.recording.requests.bytes++;
    if (kind === "responses-count") saved.recording.responses.bytes++;
    if (kind === "swapped") [saved.recording.requests, saved.recording.responses] = [saved.recording.responses, saved.recording.requests];
    if (kind === "context") saved.recording.context.connectionId = "another";
    if (kind === "target") saved.recording.context.target = "gfx942";
    if (kind === "variant") saved.recording.context.variantIdentity = "d".repeat(64);
    expect(() => reopen(recording, saved)).toThrow(ResourceBookmarkError);
  });
it.each(["configuration", "event", "revision", "scope", "mask", "source", "map", "span", "provenance", "site", "frame", "extra"])(
  "rejects a substituted current or baseline %s anchor", async kind => {
    const recording = await recordedComparison();
    for (const field of ["anchor", "baselineAnchor"]) {
      const saved = document(recording), anchor = saved[field];
      if (kind === "configuration") anchor.cursor.configuration_identity = "a".repeat(64);
      if (kind === "event") anchor.cursor.event_sequence++;
      if (kind === "revision") anchor.cursor.state_revision++;
      if (kind === "scope") anchor.scope.workgroup = [1, 0, 0];
      if (kind === "mask") anchor.scope.active_mask = 7;
      if (kind === "source") anchor.site.source.location.file_identity = "a".repeat(64);
      if (kind === "map") anchor.site.source.location.map_identity = "a".repeat(64);
      if (kind === "span") anchor.site.source.location.byte_end++;
      if (kind === "provenance") anchor.site.source.location.provenance = "caller_bound";
      if (kind === "site") anchor.site.kir.block_ordinal++;
      if (kind === "frame") { anchor.frame = 1; anchor.occurrence = 1; }
      if (kind === "extra") anchor.sourceAuthority = true;
      expect(() => reopen(recording, saved)).toThrow(ResourceBookmarkError);
    }
  });
it.each(["checkpoint", "page", "memory", "baseline-checkpoint", "baseline-memory", "self", "page-null", "memory-null", "extra-baseline-anchor"])(
  "refuses missing, wrong-kind or omitted %s selections without fallback", async kind => {
    const recording = await recordedComparison(), saved = document(recording);
    if (kind === "checkpoint") saved.selection.checkpointRequestId = 999;
    if (kind === "page") saved.selection.pageRequestId = 11;
    if (kind === "memory") saved.selection.memoryRequestId = 15;
    if (kind === "baseline-checkpoint") saved.selection.baseline.checkpointRequestId = 6;
    if (kind === "baseline-memory") saved.selection.baseline.memoryRequestId = 999;
    if (kind === "self") saved.selection.baseline = { checkpointRequestId: 6, memoryRequestId: 11 };
    if (kind === "page-null") saved.selection.pageRequestId = null;
    if (kind === "memory-null") saved.selection.memoryRequestId = null;
    if (kind === "extra-baseline-anchor") saved.selection.baseline = null;
    expect(() => reopen(recording, saved)).toThrow(ResourceBookmarkError);
  });
it("permits no memory only for a real page-only excerpt and never a baseline without current memory", async () => {
  const input = retainedResourceExcerpt([6, 7]);
  const recording = await importResourceRecording(input.requests, input.responses);
  const selected = { checkpointRequestId: 6, pageRequestId: 7, memoryRequestId: null, baseline: null };
  expect(reopen(recording, document(recording, selected))).toEqual(selected);
  expect(() => serializeResourceSelectionBookmark(recording, { ...selected,
    baseline: { checkpointRequestId: 6, memoryRequestId: 11 } })).toThrow(ResourceBookmarkError);
});
it("refuses ambiguous or stale current retained references, not just altered bookmarks", async () => {
  const original = await recordedComparison(), raw = serializeResourceSelectionBookmark(original, globalSelection);
  const mutations = [
    (r: MutableResourceControl) => r.pairs.push(r.pairs[0]),
    (r: MutableResourceControl) => r.checkpoints.push(r.checkpoints[0]),
    (r: MutableResourceControl) => r.checkpoints[0].pages.push(r.checkpoints[0].pages[0]),
    (r: MutableResourceControl) => r.checkpoints[0].memories.push(r.checkpoints[0].memories[0]),
    (r: MutableResourceControl) => { r.checkpoints[0].anchorKey = "stale"; },
    (r: MutableResourceControl) => { r.checkpoints[0].control.response.session.revision++; },
    (r: MutableResourceControl) => { (comparisonWindow(r as unknown as ImportedResourceRecording, 11).memory.response as MutableResourceControl).result.memory.returned_bytes = 5000; },
    (r: MutableResourceControl) => { r.context.target = "gfx950"; },
  ];
  for (const mutate of mutations) {
    const current = structuredClone(original); mutate(current);
    expect(() => restoreResourceSelectionBookmark(current, raw)).toThrow(ResourceBookmarkError);
  }
});
it.each(["root", "recording", "requests", "context", "selection", "baseline"])("rejects unknown %s fields", async path => {
  const recording = await recordedComparison(), saved = document(recording);
  const target = path === "root" ? saved : path === "recording" ? saved.recording :
    path === "requests" ? saved.recording.requests : path === "context" ? saved.recording.context :
      path === "selection" ? saved.selection : saved.selection.baseline;
  target.unrecognized = 0;
  expect(() => reopen(recording, saved)).toThrow(ResourceBookmarkError);
});
it("rejects malformed, duplicate-key, noncanonical numeric and bounded-structure attacks", async () => {
  const recording = await recordedComparison(), raw = serializeResourceSelectionBookmark(recording, globalSelection);
  for (const bad of [
    "", " ", "{", raw + "null", "\ufeff" + raw, '"\\ud800"',
    '{"schema":1,"schema":2}', '{"schema":1,"\\u0073chema":2}',
    "[".repeat(25) + "0" + "]".repeat(25), JSON.stringify({ a: Array(33).fill(0) }),
    raw.replace('"checkpointRequestId": 6', '"checkpointRequestId": 9007199254740992'),
    raw.replace('"checkpointRequestId": 6', '"checkpointRequestId": -1'),
    raw.replace('"checkpointRequestId": 6', '"checkpointRequestId": 6.0'),
    raw.replace('"checkpointRequestId": 6', '"checkpointRequestId": 6e0'),
    raw.replace(RESOURCE_BOOKMARK_SCHEMA, "different"), " ".repeat(RESOURCE_BOOKMARK_MAX_BYTES + 1),
    JSON.stringify({ x: "é".repeat(RESOURCE_BOOKMARK_MAX_BYTES / 2) }),
  ]) expect(() => restoreResourceSelectionBookmark(recording, bad)).toThrow(ResourceBookmarkError);
  const exact = raw + " ".repeat(RESOURCE_BOOKMARK_MAX_BYTES - new TextEncoder().encode(raw).byteLength);
  expect(restoreResourceSelectionBookmark(recording, exact)).toEqual(globalSelection);
});
it("reads exact capped UTF-8 and aborts the actual FileReader without touching recording bytes", async () => {
  const recording = await recordedComparison(), raw = serializeResourceSelectionBookmark(recording, globalSelection);
  expect(await readResourceBookmarkFile(new File([raw], "view.json"), new AbortController().signal)).toBe(raw);
  const abort = vi.spyOn(FileReader.prototype, "abort"), controller = new AbortController();
  const pending = readResourceBookmarkFile(new File([raw], "cancel.json"), controller.signal);
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(abort).toHaveBeenCalledTimes(1);
  await expect(readResourceBookmarkFile(new File([raw], "already.json"), controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  for (const bytes of [new Uint8Array([0xc3, 0x28]), new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d])]) {
    await expect(readResourceBookmarkFile(new File([bytes], "invalid.json"), new AbortController().signal)).rejects.toThrow();
  }
  const reader = vi.spyOn(FileReader.prototype, "readAsArrayBuffer");
  reader.mockClear();
  for (const size of [0, RESOURCE_BOOKMARK_MAX_BYTES + 1]) {
    await expect(readResourceBookmarkFile(new File([new Uint8Array(size)], "large.json"), new AbortController().signal)).rejects.toThrow(ResourceBookmarkError);
  }
  expect(reader).not.toHaveBeenCalled();
});
