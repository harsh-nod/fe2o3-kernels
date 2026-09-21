import { importResourceRecording, type ImportedResourceRecording } from "../../src/content/recorded-resource-import";
import { resourceMemoryComparisonReference } from "../../src/content/resource-memory-comparison";
import { retainedResourceExcerpt, type MutableResourceControl } from "./recorded-resource-import";
import { retainedLdsImportExcerpt } from "./recorded-lds-import";

/** Only selects unchanged original pairs from existing actual recordings. */
export async function recordedComparison(kind: "global" | "lds" = "global") {
  const input = kind === "global" ? retainedResourceExcerpt() : retainedLdsImportExcerpt();
  return importResourceRecording(input.requests, input.responses);
}
export function comparisonWindow(recording: ImportedResourceRecording, id: number) {
  const checkpoint = recording.checkpoints.find(item => item.memories.some(memory => memory.requestId === id));
  const memory = checkpoint?.memories.find(item => item.requestId === id);
  if (!checkpoint || !memory) throw new Error("Exact retained memory pair is absent.");
  return { checkpoint, memory, reference: resourceMemoryComparisonReference(recording, checkpoint, memory) };
}
/** Synthetic mutation controls below are not new producer evidence. */
export function comparisonMemory(recording: ImportedResourceRecording, id: number): MutableResourceControl {
  return (comparisonWindow(recording, id).memory.response as MutableResourceControl).result.memory;
}
export function resizeComparisonWindow(recording: ImportedResourceRecording, id: number, length: number, returned = length) {
  const pair = comparisonWindow(recording, id).memory;
  (pair.request as MutableResourceControl).byte_len = length;
  Object.assign(comparisonMemory(recording, id), { requested_bytes: length, returned_bytes: returned,
    availability: { status: "captured", address_space: "global", bytes: "0x" + "00".repeat(returned),
      initialized: "0x" + "00".repeat(Math.ceil(returned / 8)), truncated: returned < length } });
}
