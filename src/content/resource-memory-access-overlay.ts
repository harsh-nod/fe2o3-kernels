/** A retained access range over current checkpoint storage, never event-time
 * values, a lifecycle/physical map, a backend query, or producer authentication. */
import { projectResourceAccessResponse, type ResourceAccessProjectionInput, type ResourceAccessRow } from "./resource-access-view";
import { resourceAccessNavigation, resourceAccessPageKey, type ResourceAccessSelection } from "./resource-access-navigation";
import { RESOURCE_MEMORY_VISIBLE_BYTES, type ResourceMemoryCell, type ResourceMemoryProjection } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export interface ResourceMemoryAccessOverlayInput {
  access: ResourceAccessProjectionInput;
  selection: ResourceAccessSelection | null;
  /** Independently supplied by the owner of the selected memory response. */
  memoryContext: ResourceMemoryContext;
}
export interface ResourceMemoryAccessOverlay {
  status: "ready" | "off_window" | "different_allocation" | "different_space" | "no_selection" | "unavailable" | "stale" | "invalid";
  detail: string;
  historyNotice: string;
  access: { eventSequence: number; marker: string; kind: ResourceAccessRow["access"]; start: string; end: string } | null;
  overlap: { start: string; end: string } | null;
}
const markers = { read: "R", write_committed: "W", atomic_read: "AR", atomic_write_committed: "AW", atomic_read_write_committed: "AR/W" } as const;

export function resourceMemoryAccessOverlay(
  memory: ResourceMemoryProjection, input: ResourceMemoryAccessOverlayInput, page: number,
): ResourceMemoryAccessOverlay {
  const result: ResourceMemoryAccessOverlay = { status: "unavailable", detail: "", historyNotice: "", access: null, overlap: null };
  const fail = (status: ResourceMemoryAccessOverlay["status"], detail: string) => ({ ...result, status, detail });
  const access = projectResourceAccessResponse(input.access);
  if (access.status !== "ready") return fail(access.status === "stale" ? "stale" : "unavailable", `Access overlay unavailable: ${access.detail}`);
  if (access.kind !== "memory_accesses") return fail("invalid", "An access page, not an allocation inventory, is required.");
  result.historyNotice = `${access.completeness.status === "truncated" ? `Partial retained capture (${access.completeness.reason}). ` : "Complete retained capture; still only one bounded query page. "}${access.hasMorePages ? "More backend pages exist; they are not fetched. " : ""}Unmarked bytes do not establish no activity.`;
  if (memory.status !== "ready") return fail("unavailable", `Checkpoint memory unavailable: ${memory.detail}`);
  const context = input.memoryContext;
  const contextFields = ["connectionId", "captureIdentity", "target", "variantIdentity"] as const;
  if (!context || Object.keys(context).length !== contextFields.length || contextFields.some((field) =>
    !Object.hasOwn(context, field) || context[field] !== access.context[field]) ||
      memory.anchorKey !== access.anchorKey) return fail("stale", "Access and memory belong to different full checkpoints, connections, captures, targets, or source variants. No overlay is shown.");
  if (input.selection !== null && input.selection.pageKey !== resourceAccessPageKey(access)) return fail("stale", "The retained access selection belongs to another page or changed page contents. No prior overlay is shown.");
  const selected = resourceAccessNavigation(access, input.selection).selected;
  if (!selected) return fail("no_selection", "No retained access is selected in this page. An empty or filtered page does not establish empty history.");
  const start = BigInt(selected.range.byte_offset), end = start + BigInt(selected.range.byte_len);
  result.access = { eventSequence: selected.occurrence.event_sequence, marker: markers[selected.access], kind: selected.access, start: start.toString(), end: end.toString() };
  const window = memory.memory;
  if (window.allocation.ordinal !== selected.allocation.ordinal || window.allocation.generation !== selected.allocation.generation)
    return fail("different_allocation", `Historical event ${result.access.eventSequence} belongs to a different allocation or generation; it does not paint this checkpoint window.`);
  if (window.availability.status !== "captured" || window.returned_bytes === 0)
    return fail("unavailable", "No captured checkpoint bytes are available for the selected historical access. No bytes are substituted.");
  if (window.availability.address_space !== selected.address_space)
    return fail("different_space", "The historical access and checkpoint bytes have different address spaces. No overlay is shown.");
  if (!Number.isSafeInteger(page) || page < 0 || page >= Math.ceil(window.returned_bytes / RESOURCE_MEMORY_VISIBLE_BYTES))
    return fail("invalid", "The selected memory viewport is outside the bounded captured window.");
  const visibleStart = BigInt(window.byte_offset) + BigInt(page * RESOURCE_MEMORY_VISIBLE_BYTES);
  const capturedEnd = BigInt(window.byte_offset) + BigInt(window.returned_bytes);
  const visibleEnd = capturedEnd < visibleStart + BigInt(RESOURCE_MEMORY_VISIBLE_BYTES) ? capturedEnd : visibleStart + BigInt(RESOURCE_MEMORY_VISIBLE_BYTES);
  const overlapStart = start > visibleStart ? start : visibleStart, overlapEnd = end < visibleEnd ? end : visibleEnd;
  if (overlapStart >= overlapEnd) return fail("off_window", `Historical event ${result.access.eventSequence} range [${start}, ${end}) is outside this visible checkpoint window. No outside bytes are inferred.`);
  return { ...result, status: "ready", overlap: { start: overlapStart.toString(), end: overlapEnd.toString() },
    detail: `Historical event ${result.access.eventSequence}: ${selected.access.replaceAll("_", " ")} [${start}, ${end}); visible intersection [${overlapStart}, ${overlapEnd}).` };
}

/** Cell overlap is bounded to the current viewport. A partial dword is not a
 * claim that every byte in that group was accessed. Initialization is untouched. */
export function resourceMemoryAccessCell(overlay: ResourceMemoryAccessOverlay | null, cell: Pick<ResourceMemoryCell, "byteOffset" | "byteLength">): { marker: string; byteCount: number } | null {
  if (overlay?.status !== "ready" || !overlay.overlap || !overlay.access || !Number.isSafeInteger(cell.byteOffset) || cell.byteOffset < 0 ||
      !Number.isSafeInteger(cell.byteLength) || cell.byteLength < 1 || cell.byteLength > 4) return null;
  const start = BigInt(cell.byteOffset), end = start + BigInt(cell.byteLength);
  const left = start > BigInt(overlay.overlap.start) ? start : BigInt(overlay.overlap.start);
  const right = end < BigInt(overlay.overlap.end) ? end : BigInt(overlay.overlap.end);
  return left < right ? { marker: overlay.access.marker, byteCount: Number(right - left) } : null;
}
