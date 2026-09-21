/** Local comparison of two retained windows, not replay, admission or lifecycle proof. */
import { RESOURCE_IMPORT_LIMITS, type ImportedResourceCheckpoint, type ImportedResourcePair, type ImportedResourceRecording } from "./recorded-resource-import";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, RESOURCE_MEMORY_VISIBLE_BYTES,
  type ResourceMemoryProjection, type ResourceSnapshotAnchor } from "./resource-memory-view";

export interface ResourceMemoryComparisonReference {
  readonly recordingKey: string;
  readonly checkpointRequestId: number;
  readonly memoryRequestId: number;
  readonly anchorKey: string;
}
export interface ComparedStorageByte {
  readonly hex: string;
  readonly initialized: boolean;
}
export interface ResourceMemoryComparisonByte {
  readonly byteOffset: number;
  readonly baseline: ComparedStorageByte | null;
  readonly current: ComparedStorageByte | null;
  readonly storageChanged: boolean | null;
  readonly initializationChanged: boolean | null;
}
export interface ResourceMemoryComparisonCell {
  readonly byteOffset: number;
  readonly bytes: readonly ResourceMemoryComparisonByte[];
  readonly marker: string;
}
type ReadyMemory = Extract<ResourceMemoryProjection, { status: "ready" }>;
export type ResourceMemoryComparison =
  | { status: "idle" | "invalid" | "stale" | "incompatible" | "unavailable"; detail: string }
  | { status: "ready"; baseline: ReadyMemory; current: ReadyMemory; page: number; pageCount: number;
      visibleStart: number; visibleEnd: number; cells: readonly ResourceMemoryComparisonCell[];
      storageChanges: number; initializationChanges: number; comparedBytes: number; unavailableBytes: number;
      completeWindows: boolean };

export function resourceMemoryComparisonRecordingKey(recording: ImportedResourceRecording): string {
  return JSON.stringify([recording.requestSha256, recording.responseSha256, recording.context]);
}
export function resourceMemoryComparisonReference(recording: ImportedResourceRecording,
  checkpoint: ImportedResourceCheckpoint, memory: ImportedResourcePair): ResourceMemoryComparisonReference {
  return { recordingKey: resourceMemoryComparisonRecordingKey(recording), checkpointRequestId: checkpoint.control.requestId,
    memoryRequestId: memory.requestId, anchorKey: checkpoint.anchorKey };
}
export function resourceMemoryComparisonOptions(recording: ImportedResourceRecording) {
  if (recording.checkpoints.length > RESOURCE_IMPORT_LIMITS.checkpoints || recording.pairs.length > RESOURCE_IMPORT_LIMITS.pairs ||
      recording.checkpoints.some(checkpoint => checkpoint.memories.length > RESOURCE_IMPORT_LIMITS.pairs)) return [];
  const windows = recording.checkpoints.flatMap(checkpoint => checkpoint.memories.map(memory => ({ checkpoint, memory })));
  return windows.length <= RESOURCE_IMPORT_LIMITS.pairs ? windows : [];
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function natural(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function resolve(recording: ImportedResourceRecording, reference: ResourceMemoryComparisonReference): ResourceMemoryProjection {
  const stale = (detail: string): ResourceMemoryProjection => ({ status: "stale", detail });
  if (reference.recordingKey !== resourceMemoryComparisonRecordingKey(recording)) return stale("Selection belongs to another imported recording or context.");
  const windows = resourceMemoryComparisonOptions(recording);
  const found = windows.filter(({ checkpoint, memory }) => checkpoint.control.requestId === reference.checkpointRequestId && memory.requestId === reference.memoryRequestId);
  if (found.length !== 1) return stale("The exact selected checkpoint and memory pair are not uniquely retained.");
  const { checkpoint, memory } = found[0];
  if (reference.anchorKey !== checkpoint.anchorKey || resourceSnapshotAnchorKey(checkpoint.anchor) !== checkpoint.anchorKey ||
      checkpoint.control.kind !== "checkpoint" || memory.kind !== "memory") return stale("The independent checkpoint anchor changed.");
  // Admission remains the importer's job. These checks fence the selected
  // independent control and paired memory response, not another stop's state.
  const control = checkpoint.control.response;
  const result = object(control) && object(control.result) ? control.result : null;
  const captured = result && object(result.snapshot) && object(result.snapshot.snapshot) ? result.snapshot.snapshot : null;
  if (!captured || resourceSnapshotAnchorKey(captured.anchor) !== checkpoint.anchorKey) return stale("The selected control snapshot no longer matches its anchor.");
  const projected = projectResourceMemoryResponse(memory.response, checkpoint.anchor), request = memory.request;
  if (projected.status !== "ready") return projected;
  if (!object(request) || !object(request.allocation) || request.schema !== "fe2o3-debug-request-v1" || request.operation !== "read_memory" ||
      request.request_id !== memory.requestId || projected.requestId !== memory.requestId ||
      request.expected_revision !== checkpoint.anchor.cursor.state_revision || request.allocation.ordinal !== projected.memory.allocation.ordinal ||
      request.allocation.generation !== projected.memory.allocation.generation || request.byte_offset !== projected.memory.byte_offset ||
      request.byte_len !== projected.memory.requested_bytes) return stale("The original memory request and selected response disagree.");
  return projected;
}
function comparableAnchor(anchor: ResourceSnapshotAnchor): string | null {
  // ONLY cursor position/revision may differ. Scope, active mask, source
  // association, site and represented frame/occurrence remain exact.
  return resourceSnapshotAnchorKey({ ...anchor, cursor: { ...anchor.cursor, event_sequence: 0, state_revision: 0 } });
}
function byteAt(projection: ReadyMemory, index: number): ComparedStorageByte | null {
  const { memory } = projection, availability = memory.availability;
  if (availability.status !== "captured" || index >= memory.returned_bytes) return null;
  const packed = Number.parseInt(availability.initialized.slice(2 + 2 * Math.floor(index / 8), 4 + 2 * Math.floor(index / 8)), 16);
  return { hex: "0x" + availability.bytes.slice(2 + index * 2, 4 + index * 2), initialized: (packed & (1 << (index % 8))) !== 0 };
}

export function projectResourceMemoryComparison(recording: ImportedResourceRecording,
  currentReference: ResourceMemoryComparisonReference, baselineReference: ResourceMemoryComparisonReference | null,
  page = 0, cellBytes: 1 | 4 = 4): ResourceMemoryComparison {
  if (!natural(page) || (cellBytes !== 1 && cellBytes !== 4)) return { status: "invalid", detail: "Invalid bounded comparison viewport." };
  const current = resolve(recording, currentReference);
  if (current.status !== "ready") return { status: current.status === "unsupported" ? "incompatible" : current.status, detail: "Current window: " + current.detail };
  if (baselineReference === null) return { status: "idle", detail: "Choose a baseline retained memory window. No baseline is selected automatically." };
  const baseline = resolve(recording, baselineReference);
  if (baseline.status !== "ready") return { status: baseline.status === "unsupported" ? "incompatible" : baseline.status, detail: "Baseline window: " + baseline.detail };
  if (baseline.requestId === current.requestId) return { status: "incompatible", detail: "Choose a distinct retained memory pair, not the current window itself." };
  if (comparableAnchor(baseline.anchor) !== comparableAnchor(current.anchor)) return { status: "incompatible", detail: "Only cursor event/revision may differ; configuration, logical scope/mask, source/site and represented frame/occurrence must match exactly." };
  const a = baseline.memory, b = current.memory;
  if (a.allocation.ordinal !== b.allocation.ordinal || a.allocation.generation !== 0 || b.allocation.generation !== 0 ||
      a.byte_offset !== b.byte_offset || a.requested_bytes !== b.requested_bytes) return { status: "incompatible", detail: "Comparison requires the same recorded generation-zero allocation and exact requested byte window. No lifetime or reuse is inferred." };
  if (a.availability.status !== "captured" || b.availability.status !== "captured") {
    const label = (window: ReadyMemory) => window.memory.availability.status === "captured" ? "captured" : `${window.memory.availability.status}: ${window.memory.availability.reason}`;
    return { status: "unavailable", detail: `Baseline ${label(baseline)}; current ${label(current)}. Missing storage is never replaced by zero.` };
  }
  if (a.availability.address_space !== b.availability.address_space) return { status: "incompatible", detail: "The recorded memory address spaces differ." };
  const pageCount = Math.ceil(b.requested_bytes / RESOURCE_MEMORY_VISIBLE_BYTES);
  if (page >= pageCount) return { status: "invalid", detail: "Comparison viewport is outside the requested window." };
  const start = page * RESOURCE_MEMORY_VISIBLE_BYTES, end = Math.min(b.requested_bytes, start + RESOURCE_MEMORY_VISIBLE_BYTES);
  const cells: ResourceMemoryComparisonCell[] = [];
  let storageChanges = 0, initializationChanges = 0, comparedBytes = 0, unavailableBytes = 0;
  for (let offset = start; offset < end; offset += cellBytes) {
    const bytes: ResourceMemoryComparisonByte[] = [];
    for (let index = offset; index < Math.min(offset + cellBytes, end); index++) {
      const first = byteAt(baseline, index), second = byteAt(current, index);
      const storageChanged = first && second ? first.hex !== second.hex : null;
      const initializationChanged = first && second ? first.initialized !== second.initialized : null;
      if (storageChanged === null) unavailableBytes++; else comparedBytes++;
      if (storageChanged) storageChanges++; if (initializationChanged) initializationChanges++;
      bytes.push({ byteOffset: b.byte_offset + index, baseline: first, current: second, storageChanged, initializationChanged });
    }
    const markers = [bytes.some(byte => byte.storageChanged) ? "B" : "", bytes.some(byte => byte.initializationChanged) ? "I" : "",
      bytes.some(byte => byte.storageChanged === null) ? "?" : ""].filter(Boolean);
    cells.push({ byteOffset: b.byte_offset + offset, bytes, marker: markers.join("+") || "=" });
  }
  return { status: "ready", baseline, current, page, pageCount, cells, visibleStart: b.byte_offset + start, visibleEnd: b.byte_offset + end,
    storageChanges, initializationChanges, comparedBytes, unavailableBytes,
    completeWindows: a.returned_bytes === a.requested_bytes && b.returned_bytes === b.requested_bytes && !a.availability.truncated && !b.availability.truncated };
}
