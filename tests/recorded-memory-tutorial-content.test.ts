import { createHash, webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { recordedMemoryExercises, recordedMemoryExcerptCommands, RECORDED_MEMORY_TUTORIAL_PIN,
  type RecordedMemoryExercise } from "../src/content/recorded-memory-tutorial";
import { importResourceRecording, RESOURCE_IMPORT_LIMITS, type ImportedResourceRecording } from "../src/content/recorded-resource-import";
import { projectResourceMemoryComparison, resourceMemoryComparisonReference } from "../src/content/resource-memory-comparison";
import { projectResourceCheckpointValues } from "../src/content/resource-checkpoint-values";

beforeEach(() => vi.stubGlobal("crypto", webcrypto));
afterEach(() => vi.unstubAllGlobals());
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
function excerpt(exercise: RecordedMemoryExercise, side: "requests" | "responses") {
  const full = readFileSync(resolve(exercise[side]));
  const lines = full.toString("utf8").split("\n");
  if (lines.pop() !== "") throw Error("Original final LF missing");
  const chosen = lines.filter(line => (exercise.ids as readonly number[]).includes(JSON.parse(line).request_id));
  return { full, bytes: Buffer.from(chosen.join("\n") + "\n"), lines, chosen };
}
async function recording(id: RecordedMemoryExercise["id"]) {
  const exercise = recordedMemoryExercises.find(item => item.id === id)!;
  return importResourceRecording(excerpt(exercise, "requests").bytes.toString("utf8"), excerpt(exercise, "responses").bytes.toString("utf8"));
}
function window(recorded: ImportedResourceRecording, id: number) {
  const checkpoint = recorded.checkpoints.find(item => item.memories.some(memory => memory.requestId === id));
  const memory = checkpoint?.memories.find(item => item.requestId === id);
  if (!checkpoint || !memory) throw Error("Exact original memory window missing");
  return resourceMemoryComparisonReference(recorded, checkpoint, memory);
}
function compare(recorded: ImportedResourceRecording, current: number, baseline: number) {
  return projectResourceMemoryComparison(recorded, window(recorded, current), window(recorded, baseline), 0, 1);
}

it.each(recordedMemoryExercises)("pins complete unchanged $id lines within existing admission limits", async exercise => {
  const sides = ["requests", "responses"] as const;
  for (const side of sides) {
    const input = excerpt(exercise, side);
    const request = side === "requests";
    expect(hash(input.full)).toBe(request ? exercise.fullRequestSha256 : exercise.fullResponseSha256);
    expect(input.bytes.length).toBe(request ? exercise.requestBytes : exercise.responseBytes);
    expect(hash(input.bytes)).toBe(request ? exercise.requestSha256 : exercise.responseSha256);
    expect(input.bytes.length).toBeLessThanOrEqual(RESOURCE_IMPORT_LIMITS.fileBytes);
    expect(input.chosen.map(line => JSON.parse(line).request_id)).toEqual(exercise.ids);
    // The documented sed line numbers select original lines, not parsed/reserialized DTOs.
    expect(input.chosen).toEqual(exercise.ids.map(id => input.lines[id - 1]));
    for (const line of input.chosen) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(RESOURCE_IMPORT_LIMITS.lineBytes);
  }
  const imported = await recording(exercise.id);
  expect(imported.pairs.map(pair => pair.requestId)).toEqual(exercise.ids);
  expect(imported.pairs.map(pair => pair.requestUtf8).join("")).toBe(excerpt(exercise, "requests").bytes.toString("utf8"));
  expect(imported.pairs.map(pair => pair.responseUtf8).join("")).toBe(excerpt(exercise, "responses").bytes.toString("utf8"));
  expect(imported.context.target).toBeNull();
  expect(imported.checkpoints.length).toBeLessThanOrEqual(RESOURCE_IMPORT_LIMITS.checkpoints);
});

it("keeps source hashes and documentation recipes tied to the original retained claims", () => {
  const docs = readFileSync(resolve("docs/recorded-memory-comparison-lab-v1.md"), "utf8");
  expect(docs).toContain(RECORDED_MEMORY_TUTORIAL_PIN);
  for (const exercise of recordedMemoryExercises) {
    const evidence = JSON.parse(readFileSync(resolve(exercise.evidence), "utf8"));
    const claim = exercise.id === "global" ? evidence.evidence : JSON.parse(evidence.receipt.utf8);
    expect(claim.source_sha256).toBe(exercise.sourceSha256);
    expect(claim.source ?? claim.source_path).toBe(exercise.source);
    expect(docs).toContain(recordedMemoryExcerptCommands(exercise));
    expect(docs).toContain(exercise.requestSha256);
    expect(docs).toContain(exercise.responseSha256);
  }
  expect(RESOURCE_IMPORT_LIMITS).toEqual({ fileBytes: 262144, lineBytes: 65536, pairs: 128, checkpoints: 32 });
});

it("checks the independent little-endian global word and preserved canary without inferring a writer", async () => {
  const recorded = await recording("global"), projected = compare(recorded, 11, 15);
  if (projected.status !== "ready") throw Error(projected.status);
  const expected = Buffer.alloc(4); expected.writeUInt32LE(469);
  expect(expected.toString("hex")).toBe("d5010000");
  const bytes = projected.cells.flatMap(cell => cell.bytes);
  expect(bytes.slice(0, 4).map(byte => byte.current?.hex)).toEqual([...expected].map(byte => "0x" + byte.toString(16).padStart(2, "0")));
  expect(bytes.slice(0, 4).every(byte => byte.baseline?.hex === "0xa5" && byte.baseline.initialized && byte.current?.initialized)).toBe(true);
  expect([projected.storageChanges, projected.initializationChanges, projected.comparedBytes]).toEqual([4, 0, 24]);
  expect(bytes.slice(16).map(byte => byte.current?.hex.slice(2)).join("")).toBe("deadbeefcafebabe");
  expect(bytes.slice(16).every(byte => byte.storageChanged === false && byte.initializationChanged === false)).toBe(true);
});

it("keeps repeated event identities distinct and requires an explicit baseline", async () => {
  const recorded = await recording("global");
  expect(projectResourceMemoryComparison(recorded, window(recorded, 11), null).status).toBe("idle");
  const projected = compare(recorded, 11, 21);
  if (projected.status !== "ready") throw Error(projected.status);
  expect([projected.current.anchor.cursor.event_sequence, projected.current.anchor.cursor.state_revision]).toEqual([33, 4]);
  expect([projected.baseline.anchor.cursor.event_sequence, projected.baseline.anchor.cursor.state_revision]).toEqual([33, 6]);
  expect([projected.storageChanges, projected.initializationChanges]).toEqual([0, 0]);
});

it("independently distinguishes one changed LDS storage byte from four initialized bytes", async () => {
  const projected = compare(await recording("lds"), 13, 17);
  if (projected.status !== "ready") throw Error(projected.status);
  expect([projected.storageChanges, projected.initializationChanges, projected.comparedBytes]).toEqual([1, 4, 256]);
  expect(projected.cells.slice(0, 4).map(cell => cell.marker)).toEqual(["B+I", "I", "I", "I"]);
  const bytes = projected.cells.flatMap(cell => cell.bytes);
  expect(bytes.slice(0, 4).map(byte => byte.current?.hex)).toEqual(["0x02", "0x00", "0x00", "0x00"]);
  expect(bytes.slice(0, 4).every(byte => byte.initializationChanged === true)).toBe(true);
  expect(bytes.slice(4).every(byte => byte.current?.hex === "0x00" && byte.current.initialized === false)).toBe(true);
});

it("admits the actual two-workgroup excerpt but never replaces its unavailable bytes with zeros", async () => {
  const recorded = await recording("scope");
  expect(recorded.checkpoints.map(checkpoint => checkpoint.control.requestId)).toEqual([79, 83, 86]);
  expect(JSON.parse(excerpt(recordedMemoryExercises[2], "responses").chosen[0]).result.snapshot.snapshot.values).toHaveLength(94);
  expect(projectResourceCheckpointValues(recorded.checkpoints[0])).toEqual({ status: "unsupported",
    detail: "This checkpoint exceeds the 64-value display budget; no partial or previous table is shown." });
  const projected = compare(recorded, 85, 89);
  expect(projected).toEqual({ status: "unavailable",
    detail: "Baseline unavailable: not_represented; current unavailable: not_represented. Missing storage is never replaced by zero." });
  expect(projected).not.toHaveProperty("cells");
});

it("refuses the real cross-workgroup/source selection even with the same allocation ordinal", async () => {
  const projected = compare(await recording("scope"), 85, 81);
  expect(projected.status).toBe("incompatible");
  expect(projected).toHaveProperty("detail", "Only cursor event/revision may differ; configuration, logical scope/mask, source/site and represented frame/occurrence must match exactly.");
  expect(projected).not.toHaveProperty("cells");
});

it("refuses the real different-allocation selection without treating uninitialized zeros as reuse", async () => {
  const projected = compare(await recording("scope"), 88, 85);
  expect(projected.status).toBe("incompatible");
  expect(projected).toHaveProperty("detail", "Comparison requires the same recorded generation-zero allocation and exact requested byte window. No lifetime or reuse is inferred.");
});

it("does not widen acceptance for an orphan excerpt or a request/response mismatch", async () => {
  const exercise = recordedMemoryExercises[2];
  const requests = excerpt(exercise, "requests").bytes.toString("utf8");
  const responses = excerpt(exercise, "responses").bytes.toString("utf8");
  await expect(importResourceRecording(requests.split("\n").slice(1).join("\n"), responses.split("\n").slice(1).join("\n"))).rejects.toThrow();
  await expect(importResourceRecording(requests, responses.replace('"request_id":79', '"request_id":78'))).rejects.toThrow();
});

it("keeps full transcripts outside the deliberately bounded excerpt importer", async () => {
  for (const exercise of recordedMemoryExercises) {
    await expect(importResourceRecording(readFileSync(resolve(exercise.requests), "utf8"), readFileSync(resolve(exercise.responses), "utf8"))).rejects.toThrow();
  }
});
