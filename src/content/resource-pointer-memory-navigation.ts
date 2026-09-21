/** Local navigation of unverified retained bytes, never a pointer dereference,
 * memory query, producer authentication, allocation-bounds or lifetime proof. */
import { RESOURCE_IMPORT_LIMITS, type ImportedResourceCheckpoint, type ImportedResourceRecording } from "./recorded-resource-import";
import { projectResourceCheckpointValues } from "./resource-checkpoint-values";
import { projectResourceMemoryResponse, resourceMemoryCells, resourceSnapshotAnchorKey,
  RESOURCE_MEMORY_VISIBLE_BYTES, type ResourceMemoryProjection } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export interface ResourcePointerMemoryFocus {
  readonly anchorKey: string;
  readonly contextKey: string;
  /** Complete projected window, including bytes, initialization and availability. */
  readonly memoryKey: string;
  readonly requestId: number;
  readonly addressSpace: "private" | "workgroup" | "global" | "constant" | "generic";
  readonly allocationOrdinal: string;
  readonly generation: string;
  readonly byteOffset: string;
  readonly selectionKey: number;
}
type Refusal = { status: "invalid" | "stale" | "unsupported" | "unavailable"; detail: string };
export type ResourcePointerMemoryNavigation = Refusal
  | { status: "ambiguous"; detail: string; windows: readonly { requestId: number; memoryIndex: number }[] }
  | { status: "ready"; focus: ResourcePointerMemoryFocus; memoryIndex: number; valueKey: string };
export type ResourcePointerMemoryFocusProjection = Refusal
  | { status: "ready"; page: number; byteWithinPage: number };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function keys(value: unknown, names: readonly string[]): value is Record<string, unknown> {
  return object(value) && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
}
function natural(value: unknown, minimum = 0): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}
function identity(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}
function decimal(value: unknown): value is string {
  return typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/u.test(value) && BigInt(value) <= 0xffff_ffff_ffff_ffffn;
}
// Caller-owned context fence only. Keep this closed guard local; no import or
// transport authority is widened to add a presentation feature.
function contextKey(value: unknown): string | null {
  const token = (entry: unknown) => typeof entry === "string" && /^[A-Za-z0-9_.:/+-]{1,128}$/u.test(entry);
  if (!keys(value, ["connectionId", "captureIdentity", "target", "variantIdentity"]) || !token(value.connectionId) ||
      !(value.captureIdentity === null || identity(value.captureIdentity)) ||
      !(value.variantIdentity === null || identity(value.variantIdentity)) || !(value.target === null || token(value.target))) return null;
  return JSON.stringify([value.connectionId, value.captureIdentity, value.target, value.variantIdentity]);
}

/** Recheck at the renderer boundary. A same-ID replacement with changed bytes,
 * initialization, context or anchor refuses instead of retaining an old cell. */
export function projectResourcePointerMemoryFocus(projection: ResourceMemoryProjection,
  focus: ResourcePointerMemoryFocus, context: ResourceMemoryContext): ResourcePointerMemoryFocusProjection {
  if (!keys(focus, ["anchorKey", "contextKey", "memoryKey", "requestId", "addressSpace", "allocationOrdinal", "generation", "byteOffset", "selectionKey"]) ||
      !natural(focus.requestId, 1) || !natural(focus.selectionKey, 1) || !decimal(focus.allocationOrdinal) || focus.allocationOrdinal === "0" ||
      !decimal(focus.generation) || !decimal(focus.byteOffset) ||
      !["private", "workgroup", "global", "constant", "generic"].includes(focus.addressSpace) ||
      typeof focus.anchorKey !== "string" || focus.anchorKey.length > 4096 ||
      typeof focus.contextKey !== "string" || focus.contextKey.length > 512 ||
      typeof focus.memoryKey !== "string" || focus.memoryKey.length > 12_288) {
    return { status: "invalid", detail: "Pointer navigation focus is malformed or exceeds its bounded representation." };
  }
  if (projection.status !== "ready") return projection;
  const currentContext = contextKey(context);
  if (currentContext === null || currentContext !== focus.contextKey || projection.anchorKey !== focus.anchorKey ||
      resourceSnapshotAnchorKey(projection.anchor) !== focus.anchorKey || projection.requestId !== focus.requestId ||
      JSON.stringify(projection.memory) !== focus.memoryKey) {
    return { status: "stale", detail: "Pointer selection no longer matches the current context, full snapshot and retained memory content." };
  }
  const memory = projection.memory;
  if (focus.generation !== "0" || memory.allocation.generation !== 0) {
    return { status: "unsupported", detail: "Only the recorded generation-zero subset is navigable; allocation reuse is not represented." };
  }
  if (String(memory.allocation.ordinal) !== focus.allocationOrdinal || memory.availability.status !== "captured" ||
      memory.availability.address_space !== focus.addressSpace || memory.returned_bytes === 0 || resourceMemoryCells(memory, 0, 1).length === 0) {
    return { status: "unavailable", detail: "No matching captured allocation, address space and byte window is available." };
  }
  const offset = BigInt(focus.byteOffset), start = BigInt(memory.byte_offset), end = start + BigInt(memory.returned_bytes);
  if (offset < start || offset >= end) return { status: "unavailable", detail: "The pointer byte is outside returned coverage; requested or truncated bytes are not substituted." };
  const relative = offset - start, viewport = BigInt(RESOURCE_MEMORY_VISIBLE_BYTES);
  return { status: "ready", page: Number(relative / viewport), byteWithinPage: Number(relative % viewport) };
}

/** Match exactly one selected SSA row to retained windows at THIS checkpoint.
 * A requested pair is accepted only among the current matching alternatives. */
export function projectResourcePointerMemoryNavigation(recording: ImportedResourceRecording,
  checkpoint: ImportedResourceCheckpoint, valueKey: string, selectionKey: number,
  memoryRequestId?: number): ResourcePointerMemoryNavigation {
  const currentContext = contextKey(recording.context);
  if (!natural(selectionKey, 1) || (memoryRequestId !== undefined && !natural(memoryRequestId, 1)) ||
      typeof valueKey !== "string" || valueKey.length > 64 || currentContext === null ||
      !identity(recording.requestSha256) || !identity(recording.responseSha256) ||
      recording.context.connectionId !== `local-jsonl:${recording.requestSha256}` || recording.context.captureIdentity !== recording.responseSha256 ||
      recording.context.target !== null || recording.context.variantIdentity !== null ||
      recording.checkpoints.length > RESOURCE_IMPORT_LIMITS.checkpoints || recording.pairs.length > RESOURCE_IMPORT_LIMITS.pairs ||
      checkpoint.memories.length > RESOURCE_IMPORT_LIMITS.pairs) {
    return { status: "invalid", detail: "Invalid or oversized local pointer navigation inputs." };
  }
  if (!recording.checkpoints.includes(checkpoint) || !recording.pairs.includes(checkpoint.control)) {
    return { status: "stale", detail: "The selected checkpoint is not retained in this recording." };
  }
  const values = projectResourceCheckpointValues(checkpoint);
  if (values.status !== "ready") return values;
  const row = values.rows.find(value => value.key === valueKey);
  if (!row?.pointer) return { status: "unavailable", detail: "The selected current SSA row is not a represented allocation-relative pointer." };
  const matches: { memoryIndex: number; focus: ResourcePointerMemoryFocus }[] = [];
  const seen = new Set<number>();
  for (const [memoryIndex, pair] of checkpoint.memories.entries()) {
    if (pair.kind !== "memory" || !recording.pairs.includes(pair) || seen.has(pair.requestId)) {
      return { status: "stale", detail: "The current retained memory pair is missing, duplicated or replaced." };
    }
    seen.add(pair.requestId);
    const projected = projectResourceMemoryResponse(pair.response, checkpoint.anchor), request = pair.request;
    if (projected.status !== "ready") return projected;
    if (!keys(request, ["schema", "request_id", "expected_revision", "operation", "allocation", "byte_offset", "byte_len"]) ||
        !keys(request.allocation, ["ordinal", "generation"]) || request.schema !== "fe2o3-debug-request-v1" || request.operation !== "read_memory" ||
        request.request_id !== pair.requestId || projected.requestId !== pair.requestId ||
        request.expected_revision !== checkpoint.anchor.cursor.state_revision || request.allocation.ordinal !== projected.memory.allocation.ordinal ||
        request.allocation.generation !== projected.memory.allocation.generation || request.byte_offset !== projected.memory.byte_offset ||
        request.byte_len !== projected.memory.requested_bytes) {
      return { status: "stale", detail: "The original memory request and current response disagree." };
    }
    const focus: ResourcePointerMemoryFocus = { ...row.pointer, anchorKey: checkpoint.anchorKey,
      contextKey: currentContext, memoryKey: JSON.stringify(projected.memory), requestId: pair.requestId, selectionKey };
    if (projectResourcePointerMemoryFocus(projected, focus, recording.context).status === "ready") matches.push({ memoryIndex, focus });
  }
  if (matches.length === 0) return { status: "unavailable", detail: "No retained window at this exact checkpoint contains the pointer byte with matching allocation, generation and address space. No new memory read was sent." };
  if (memoryRequestId !== undefined) {
    const chosen = matches.find(match => match.focus.requestId === memoryRequestId);
    return chosen ? { status: "ready", ...chosen, valueKey }
      : { status: "stale", detail: "The chosen memory request is no longer a matching current retained window." };
  }
  if (matches.length > 1) return { status: "ambiguous", detail: "Multiple retained windows contain this byte. Choose an exact request; none is selected automatically.",
    windows: matches.map(match => ({ requestId: match.focus.requestId, memoryIndex: match.memoryIndex })) };
  return { status: "ready", ...matches[0], valueKey };
}
