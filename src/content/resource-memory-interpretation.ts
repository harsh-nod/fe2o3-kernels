/** Bounded, explicitly chosen interpretations of recorded storage, not source types or hardware values. */
import { resourceMemoryCells, type ResourceMemoryProjection } from "./resource-memory-view";

export type MemoryValueFormat = "raw" | "u32" | "i32" | "f32";
export type MemoryByteOrder = "unknown" | "little" | "big";
export interface MemoryCellSelection {
  anchorKey: string;
  requestId: number;
  allocation: { ordinal: number; generation: number };
  page: number;
  cellBytes: 1 | 4;
  byteOffset: number;
}
export type MemoryCellInterpretation =
  | { status: "raw" | "unavailable" | "stale" | "invalid" | "needs-dword" | "needs-order" | "uninitialized"; detail: string }
  | {
      status: "ready";
      detail: string;
      byteOffset: number;
      bytes: string;
      bits: string;
      value: string;
      format: Exclude<MemoryValueFormat, "raw">;
      byteOrder: Exclude<MemoryByteOrder, "unknown">;
      floatClass: "finite" | "positive zero" | "negative zero" | "positive infinity" | "negative infinity" | "NaN" | null;
      partialWindow: boolean;
    };

/** Regenerate only the current viewport; never borrow adjacent bytes or another checkpoint. */
export function interpretResourceMemoryCell(
  projection: ResourceMemoryProjection,
  selection: MemoryCellSelection | null,
  format: MemoryValueFormat,
  byteOrder: MemoryByteOrder,
): MemoryCellInterpretation {
  if (!["raw", "u32", "i32", "f32"].includes(format) ||
      !["unknown", "little", "big"].includes(byteOrder)) {
    return { status: "invalid", detail: "Unsupported presentation choice. No scalar interpretation is available." };
  }
  if (projection.status !== "ready") {
    return { status: projection.status === "stale" ? "stale" : "unavailable", detail: projection.detail };
  }
  const { memory } = projection;
  if (memory.availability.status !== "captured") {
    return { status: "unavailable", detail: "Memory " + memory.availability.status + ": " + memory.availability.reason + ". No scalar interpretation is available." };
  }
  if (selection === null) return { status: "unavailable", detail: "Select a captured memory cell." };
  if (selection.anchorKey !== projection.anchorKey || selection.requestId !== projection.requestId ||
      selection.allocation.ordinal !== memory.allocation.ordinal || selection.allocation.generation !== memory.allocation.generation) {
    return { status: "stale", detail: "The cell selection belongs to a different recorded response, snapshot or allocation. Select a current cell." };
  }
  const cell = resourceMemoryCells(memory, selection.page, selection.cellBytes)
    .find(candidate => candidate.byteOffset === selection.byteOffset);
  if (!cell) return { status: "stale", detail: "The selected byte offset is not in this captured viewport. No neighboring or historical bytes are substituted." };
  if (format === "raw") {
    return { status: "raw", detail: "Raw storage only. Choose a value interpretation and byte order explicitly; no source type is inferred." };
  }
  if (selection.cellBytes !== 4 || cell.byteLength !== 4) {
    return { status: "needs-dword", detail: "A complete selected dword (4 captured bytes) is required. Partial cells and neighboring cells are not combined." };
  }
  if (!cell.initialized.every(Boolean)) {
    return { status: "uninitialized", detail: "Only " + cell.initialized.filter(Boolean).length + "/4 selected bytes are initialized. Raw storage remains visible, but it is not an initialized scalar value." };
  }
  if (byteOrder === "unknown") {
    return { status: "needs-order", detail: "Choose little-endian or big-endian explicitly. The recording does not establish this interpretation's byte order or source type." };
  }
  const bytes = Uint8Array.from({ length: 4 }, (_, index) => Number.parseInt(cell.bytes.slice(2 + index * 2, 4 + index * 2), 16));
  const ordered = byteOrder === "little" ? [...bytes].reverse() : [...bytes];
  const integer = ordered.reduce((value, byte) => (value << 8n) | BigInt(byte), 0n);
  const bits = "0x" + integer.toString(16).padStart(8, "0");
  let value: string;
  let floatClass: Extract<MemoryCellInterpretation, { status: "ready" }>["floatClass"] = null;
  if (format === "u32") value = integer.toString();
  else if (format === "i32") value = BigInt.asIntN(32, integer).toString();
  else {
    const float = new DataView(bytes.buffer).getFloat32(0, byteOrder === "little");
    if (Number.isNaN(float)) { value = "NaN"; floatClass = "NaN"; }
    else if (Object.is(float, -0)) { value = "-0"; floatClass = "negative zero"; }
    else if (float === 0) { value = "0"; floatClass = "positive zero"; }
    else if (float === Infinity) { value = "+Infinity"; floatClass = "positive infinity"; }
    else if (float === -Infinity) { value = "-Infinity"; floatClass = "negative infinity"; }
    else { value = String(float); floatClass = "finite"; }
  }
  return {
    status: "ready",
    detail: "Four captured, initialized bytes interpreted using your choices. This does not identify their source-language type or a live architectural value.",
    byteOffset: cell.byteOffset, bytes: cell.bytes, bits, value, format, byteOrder, floatClass,
    partialWindow: memory.availability.truncated || memory.returned_bytes < memory.requested_bytes,
  };
}
