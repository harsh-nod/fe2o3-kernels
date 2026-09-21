import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { projectResourceMemoryComparison, resourceMemoryComparisonReference } from "../src/content/resource-memory-comparison";
import { resourceSnapshotAnchorKey } from "../src/content/resource-memory-view";
import { comparisonMemory, comparisonWindow, recordedComparison, resizeComparisonWindow } from "./fixtures/resource-memory-comparison";
import type { MutableResourceControl } from "./fixtures/recorded-resource-import";
import type { ImportedResourceRecording } from "../src/content/recorded-resource-import";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
function project(recording: ImportedResourceRecording, current = 11, baseline: number | null = 15, page = 0, cellBytes: 1 | 4 = 4) {
  return projectResourceMemoryComparison(recording, comparisonWindow(recording, current).reference,
    baseline === null ? null : comparisonWindow(recording, baseline).reference, page, cellBytes);
}
async function copied() { return structuredClone(await recordedComparison()); }

it("compares actual global storage against its exact reverse checkpoint without changing capture bytes", async () => {
  const recording = await recordedComparison(), before = JSON.stringify(recording), result = project(recording);
  expect(result.status).toBe("ready"); if (result.status !== "ready") throw Error("actual comparison unavailable");
  expect(result).toMatchObject({ visibleStart: 0, visibleEnd: 24, comparedBytes: 24, storageChanges: 4, initializationChanges: 0, unavailableBytes: 0, completeWindows: true });
  expect(result.current.anchor.cursor).toMatchObject({ event_sequence: 33, state_revision: 4 });
  expect(result.baseline.anchor.cursor).toMatchObject({ event_sequence: 31, state_revision: 5 });
  expect(result.cells[0].bytes.map(byte => [byte.baseline?.hex, byte.current?.hex])).toEqual([
    ["0xa5", "0xd5"], ["0xa5", "0x01"], ["0xa5", "0x00"], ["0xa5", "0x00"],
  ]);
  expect(result.cells.slice(4).flatMap(cell => cell.bytes).map(byte => byte.current?.hex)).toEqual([
    "0xde", "0xad", "0xbe", "0xef", "0xca", "0xfe", "0xba", "0xbe",
  ]);
  expect(result.cells.slice(1).every(cell => cell.marker === "=")).toBe(true);
  expect(JSON.stringify(recording)).toBe(before);
});
it("shows equal actual repeated storage while preserving both event33 revisions", async () => {
  const result = project(await recordedComparison(), 21, 11);
  expect(result.status).toBe("ready"); if (result.status !== "ready") throw Error("actual repeat unavailable");
  expect(result).toMatchObject({ comparedBytes: 24, storageChanges: 0, initializationChanges: 0 });
  expect(result.baseline.anchor.cursor.state_revision).toBe(4); expect(result.current.anchor.cursor.state_revision).toBe(6);
  expect(result.baseline.anchorKey).not.toBe(result.current.anchorKey);
});
it("separates the actual LDS storage change from four initialization changes", async () => {
  const recording = await recordedComparison("lds"), result = project(recording, 13, 17);
  expect(result.status).toBe("ready"); if (result.status !== "ready") throw Error("actual LDS unavailable");
  expect(result).toMatchObject({ comparedBytes: 256, storageChanges: 1, initializationChanges: 4, unavailableBytes: 0 });
  expect(result.cells[0].marker).toBe("B+I");
  expect(result.cells[0].bytes.map(byte => [byte.baseline?.hex, byte.current?.hex, byte.baseline?.initialized, byte.current?.initialized])).toEqual([
    ["0x00", "0x02", false, true], ["0x00", "0x00", false, true], ["0x00", "0x00", false, true], ["0x00", "0x00", false, true],
  ]);
  const swapped = project(recording, 17, 13);
  expect(swapped.status === "ready" && swapped.storageChanges).toBe(1);
  expect(swapped.status === "ready" && swapped.initializationChanges).toBe(4);
});
it("requires an explicit distinct baseline and refuses a missing pair or foreign recording reference", async () => {
  const recording = await recordedComparison(), current = comparisonWindow(recording, 11).reference, baseline = comparisonWindow(recording, 15).reference;
  expect(project(recording, 11, null).status).toBe("idle"); expect(project(recording, 11, 11).status).toBe("incompatible");
  expect(projectResourceMemoryComparison(recording, current, { ...baseline, memoryRequestId: 999 }).status).toBe("stale");
  expect(projectResourceMemoryComparison(recording, current, { ...baseline, recordingKey: "foreign" }).status).toBe("stale");
  expect(projectResourceMemoryComparison({ ...recording, context: { ...recording.context, connectionId: "other" } }, current, baseline).status).toBe("stale");
});
it.each(["source", "provenance", "scope", "mask", "site", "frame", "configuration"])("refuses independently valid but different %s context", async kind => {
  const recording = await copied(), window = comparisonWindow(recording, 15), anchor = structuredClone(window.checkpoint.anchor) as MutableResourceControl;
  if (kind === "source") anchor.site.source.location.file_identity = "a".repeat(64);
  if (kind === "provenance") anchor.site.source.location.provenance = "caller_bound";
  if (kind === "scope") anchor.scope.workgroup = [1, 0, 0];
  if (kind === "mask") anchor.scope.active_mask = 7;
  if (kind === "site") anchor.site.kir.block_ordinal++;
  if (kind === "frame") { anchor.frame = 2; anchor.occurrence = 1; }
  if (kind === "configuration") anchor.cursor.configuration_identity = "b".repeat(64);
  const checkpoint = window.checkpoint as unknown as MutableResourceControl;
  checkpoint.anchor = anchor; checkpoint.anchorKey = resourceSnapshotAnchorKey(anchor)!;
  (checkpoint.control.response as MutableResourceControl).result.snapshot.snapshot.anchor = anchor;
  const response = window.memory.response as MutableResourceControl;
  response.result.snapshot = anchor; response.session.cursor = anchor.cursor; response.session.configuration_identity = anchor.cursor.configuration_identity;
  expect(project(recording).status).toBe("incompatible");
});
it("rejects one-sided anchor replacement and stale original response/request pairs", async () => {
  for (const mutate of [
    (r: ImportedResourceRecording) => { (comparisonWindow(r, 15).memory.response as MutableResourceControl).session.revision++; },
    (r: ImportedResourceRecording) => { (comparisonWindow(r, 15).memory.request as MutableResourceControl).byte_len++; },
    (r: ImportedResourceRecording) => { (comparisonWindow(r, 15).checkpoint as unknown as MutableResourceControl).anchorKey = "stale"; },
    (r: ImportedResourceRecording) => { (comparisonWindow(r, 15).checkpoint.control.response as MutableResourceControl).result.snapshot.snapshot.anchor = {}; },
  ]) { const recording = await copied(); mutate(recording); expect(project(recording).status).toBe("stale"); }
});
it.each(["allocation", "generation", "address_space", "offset", "length"])("does not align incompatible %s by proximity", async field => {
  const recording = await copied(), memory = comparisonMemory(recording, 15), request = comparisonWindow(recording, 15).memory.request as MutableResourceControl;
  if (field === "allocation") { memory.allocation.ordinal = 2; request.allocation.ordinal = 2; }
  if (field === "generation") { memory.allocation.generation = 1; request.allocation.generation = 1; }
  if (field === "address_space") memory.availability.address_space = "workgroup";
  if (field === "offset") { memory.byte_offset = 1; request.byte_offset = 1; }
  if (field === "length") resizeComparisonWindow(recording, 15, 25);
  expect(project(recording).status).toBe("incompatible");
});
it.each(["unavailable", "redacted"])("preserves %s rather than substituting zero", async status => {
  const recording = await copied(), memory = comparisonMemory(recording, 15);
  memory.returned_bytes = 0; memory.availability = { status, reason: status === "redacted" ? "policy" : "not_captured" };
  const result = project(recording); expect(result.status).toBe("unavailable");
  expect(result).toHaveProperty("detail", expect.stringContaining(status)); expect(result).not.toHaveProperty("cells");
});
it("distinguishes missing tails, truncation, equal uninitialized storage and initialization-only differences", async () => {
  const recording = await copied(); resizeComparisonWindow(recording, 11, 8); resizeComparisonWindow(recording, 15, 8, 5);
  comparisonMemory(recording, 11).availability.initialized = "0x02";
  const result = project(recording, 11, 15, 0, 4);
  expect(result.status).toBe("ready"); if (result.status !== "ready") throw Error("partial control unavailable");
  expect(result).toMatchObject({ comparedBytes: 5, storageChanges: 0, initializationChanges: 1, unavailableBytes: 3, completeWindows: false });
  expect(result.cells.map(cell => cell.marker)).toEqual(["I", "?"]);
  expect(result.cells[0].bytes[0]).toMatchObject({ baseline: { initialized: false }, current: { initialized: false }, storageChanged: false });
  expect(result.cells[1].bytes[1]).toMatchObject({ baseline: null, storageChanged: null, initializationChanged: null });
});
it.each([1, 255, 256, 257, 4096])("bounds a %i-byte synthetic window and its partial final dword", async length => {
  const recording = await copied(); resizeComparisonWindow(recording, 11, length); resizeComparisonWindow(recording, 15, length);
  const last = Math.ceil(length / 256) - 1;
  const result = project(recording, 11, 15, last, 4);
  expect(result.status).toBe("ready"); if (result.status !== "ready") throw Error("bounded control unavailable");
  const visible = length - last * 256;
  expect(result.cells).toHaveLength(Math.ceil(visible / 4)); expect(result.cells.flatMap(cell => cell.bytes)).toHaveLength(visible);
  expect(result.cells.length).toBeLessThanOrEqual(64);
  expect(project(recording, 11, 15, last + 1).status).toBe("invalid");
});
it("refuses oversized/inexact memory metadata, malformed initialization and duplicate retained identities", async () => {
  for (const mutate of [
    (r: ImportedResourceRecording) => resizeComparisonWindow(r, 15, 4097),
    (r: ImportedResourceRecording) => { comparisonMemory(r, 15).byte_offset = Number.MAX_SAFE_INTEGER; },
    (r: ImportedResourceRecording) => { comparisonMemory(r, 15).availability.initialized = "0x00"; },
  ]) { const recording = await copied(); mutate(recording); expect(project(recording).status).toBe("invalid"); }
  const recording = await copied(), checkpoint = comparisonWindow(recording, 15).checkpoint;
  (checkpoint.memories as unknown as MutableResourceControl[]).push(checkpoint.memories[0] as unknown as MutableResourceControl);
  expect(project(recording).status).toBe("stale");
});
it("does not authenticate jointly changed caller byte claims", async () => {
  const recording = await copied(); comparisonMemory(recording, 15).availability.bytes = comparisonMemory(recording, 11).availability.bytes;
  const result = project(recording); expect(result.status === "ready" && result.storageChanges).toBe(0);
  const window = comparisonWindow(recording, 11);
  expect(resourceMemoryComparisonReference(recording, window.checkpoint, window.memory).recordingKey).toContain(recording.responseSha256);
});
