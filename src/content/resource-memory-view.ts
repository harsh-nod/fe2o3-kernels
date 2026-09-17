/** Presentation guards for an existing, Rust-admitted debugger response.
 * This module does not admit captures, authenticate producers, or run a debugger.
 * Numeric metadata outside JavaScript's exact range is deliberately unavailable.
 */
export const RESOURCE_MEMORY_MAX_BYTES = 4096;
export const RESOURCE_MEMORY_VISIBLE_BYTES = 256;

type RecordValue = Record<string, unknown>;
type Vec3 = [number, number, number];

export interface ResourceCursor {
  configuration_identity: string;
  event_sequence: number;
  state_revision: number;
}

export type ResourceScope =
  | { level: "dispatch" }
  | { level: "workgroup"; workgroup: Vec3 }
  | {
      level: "wave" | "lane";
      workgroup: Vec3;
      wave: number;
      active_mask: number;
      wave_width: 32 | 64;
      interpretation: "logical_visualization";
      lane?: number;
      logical_workitem?: Vec3;
    };

export interface ResourceSnapshotAnchor {
  cursor: ResourceCursor;
  scope: ResourceScope;
  site?: {
    kir: {
      function_ordinal: number;
      block_ordinal: number;
      point:
        | { kind: "block_entry" | "terminator" }
        | { kind: "operation"; operation_ordinal: number };
    };
    source:
      | { status: "unavailable"; reason: string }
      | {
          status: "resolved";
          location: {
            map_identity: string;
            provenance: "caller_bound" | "compiler_bundle_bound";
            file_identity: string;
            byte_start: number;
            byte_end: number;
          };
        };
  };
  frame?: number;
  occurrence?: number;
}

export interface ResourceMemoryRead {
  allocation: { ordinal: number; generation: number };
  byte_offset: number;
  requested_bytes: number;
  returned_bytes: number;
  availability:
    | {
        status: "captured";
        address_space: "private" | "workgroup" | "global" | "constant" | "generic";
        bytes: string;
        initialized: string;
        truncated: boolean;
      }
    | { status: "unavailable" | "redacted"; reason: string };
}

export type ResourceMemoryProjection =
  | {
      status: "ready";
      anchor: ResourceSnapshotAnchor;
      anchorKey: string;
      requestId: number;
      memory: ResourceMemoryRead;
    }
  | { status: "invalid" | "stale" | "unsupported" | "unavailable"; detail: string };

function record(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keys(value: unknown, required: string[], optional: string[] = []): value is RecordValue {
  return record(value) && required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => required.includes(key) || optional.includes(key));
}

function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function identity(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}

function reason(value: unknown): value is string {
  return typeof value === "string" && value.length <= 128 && /^[a-z][a-z0-9_]*$/u.test(value);
}

function vec3(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is Vec3 {
  return Array.isArray(value) && value.length === 3 &&
    [0, 1, 2].every((index) => Object.hasOwn(value, index) && integer(value[index], 0, maximum));
}

function cursor(value: unknown): value is ResourceCursor {
  return keys(value, ["configuration_identity", "event_sequence", "state_revision"]) &&
    identity(value.configuration_identity) && integer(value.event_sequence) && integer(value.state_revision);
}

function scope(value: unknown): value is ResourceScope {
  if (!record(value)) return false;
  if (value.level === "dispatch") return keys(value, ["level"]);
  if (value.level === "workgroup") {
    return keys(value, ["level", "workgroup"]) && vec3(value.workgroup, 0xffff_ffff);
  }
  const required = ["level", "workgroup", "wave", "active_mask", "wave_width", "interpretation"];
  if (value.level === "lane") required.push("lane", "logical_workitem");
  else if (value.level !== "wave") return false;
  if (!keys(value, required) || !vec3(value.workgroup, 0xffff_ffff) ||
      !integer(value.wave, 0, 0xffff_ffff) || !integer(value.active_mask) ||
      (value.wave_width !== 32 && value.wave_width !== 64) ||
      value.interpretation !== "logical_visualization") return false;
  if (value.wave_width === 32 && value.active_mask > 0xffff_ffff) return false;
  return value.level !== "lane" || (integer(value.lane, 0, value.wave_width - 1) &&
    vec3(value.logical_workitem) && (BigInt(value.active_mask) & (1n << BigInt(value.lane))) !== 0n);
}

function site(value: unknown): boolean {
  if (!keys(value, ["kir", "source"]) ||
      !keys(value.kir, ["function_ordinal", "block_ordinal", "point"]) ||
      !integer(value.kir.function_ordinal) || !integer(value.kir.block_ordinal)) return false;
  const point = value.kir.point;
  if (!record(point)) return false;
  if (point.kind === "operation") {
    if (!keys(point, ["kind", "operation_ordinal"]) || !integer(point.operation_ordinal)) return false;
  } else if ((point.kind !== "block_entry" && point.kind !== "terminator") || !keys(point, ["kind"])) {
    return false;
  }
  const source = value.source;
  if (!record(source)) return false;
  if (source.status === "unavailable") {
    return keys(source, ["status", "reason"]) && reason(source.reason);
  }
  if (source.status !== "resolved" || !keys(source, ["status", "location"])) return false;
  const location = source.location;
  return keys(location, ["map_identity", "provenance", "file_identity", "byte_start", "byte_end"]) &&
    identity(location.map_identity) && identity(location.file_identity) &&
    (location.provenance === "caller_bound" || location.provenance === "compiler_bundle_bound") &&
    integer(location.byte_start) && integer(location.byte_end) && location.byte_start < location.byte_end;
}

function anchor(value: unknown): value is ResourceSnapshotAnchor {
  return keys(value, ["cursor", "scope"], ["site", "frame", "occurrence"]) &&
    cursor(value.cursor) && scope(value.scope) &&
    (!Object.hasOwn(value, "site") || site(value.site)) &&
    (Object.hasOwn(value, "frame") === Object.hasOwn(value, "occurrence")) &&
    (!Object.hasOwn(value, "frame") || (integer(value.frame, 1) && integer(value.occurrence, 1)));
}

// All objects reaching this function have already passed the small closed guards.
function stableKey(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableKey).join(",")}]`;
  if (record(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableKey(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function resourceSnapshotAnchorKey(value: unknown): string | null {
  return anchor(value) ? stableKey(value) : null;
}

function hexBytes(value: unknown, bytes: number): value is string {
  return typeof value === "string" && value.length === 2 + bytes * 2 && /^0x[0-9a-f]*$/u.test(value);
}

function memoryRead(value: unknown): value is ResourceMemoryRead {
  if (!keys(value, ["allocation", "byte_offset", "requested_bytes", "returned_bytes", "availability"]) ||
      !keys(value.allocation, ["ordinal", "generation"]) || !integer(value.allocation.ordinal, 1) ||
      !integer(value.allocation.generation) || !integer(value.byte_offset) ||
      !integer(value.requested_bytes, 1, RESOURCE_MEMORY_MAX_BYTES) ||
      !integer(value.returned_bytes, 0, value.requested_bytes) ||
      !integer(value.byte_offset + value.requested_bytes)) return false;
  const available = value.availability;
  if (!record(available)) return false;
  if (available.status === "unavailable" || available.status === "redacted") {
    return keys(available, ["status", "reason"]) && reason(available.reason) && value.returned_bytes === 0;
  }
  if (!keys(available, ["status", "address_space", "bytes", "initialized", "truncated"]) ||
      available.status !== "captured" ||
      typeof available.address_space !== "string" ||
      !["private", "workgroup", "global", "constant", "generic"].includes(available.address_space) ||
      typeof available.truncated !== "boolean" ||
      !hexBytes(available.bytes, value.returned_bytes) ||
      !hexBytes(available.initialized, Math.ceil(value.returned_bytes / 8))) return false;
  // Rust packs initialization bit i in byte floor(i / 8), least-significant bit first.
  const remainder = value.returned_bytes % 8;
  return remainder === 0 || (Number.parseInt(available.initialized.slice(-2), 16) >> remainder) === 0;
}

export function projectResourceMemoryResponse(
  response: unknown,
  expectedSnapshot: unknown,
): ResourceMemoryProjection {
  const expectedKey = resourceSnapshotAnchorKey(expectedSnapshot);
  if (expectedKey === null || !anchor(expectedSnapshot)) {
    return { status: "invalid", detail: "The selected snapshot has invalid or inexact metadata. Integer metadata must fit JavaScript's exact range." };
  }
  if (!record(response) || response.schema !== "fe2o3-debug-response-v1" ||
      response.operation !== "read_memory" || !integer(response.request_id, 1)) {
    return { status: "invalid", detail: "An existing admitted read_memory debugger response is required." };
  }
  const session = response.session;
  if (!keys(session, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]) ||
      !cursor(session.cursor) || !identity(session.configuration_identity) || !integer(session.revision)) {
    return { status: "invalid", detail: "The response session has invalid or inexact metadata." };
  }
  if (session.backend !== "cpu_kir_simulator" || session.execution_kind !== "cpu_kir_simulation" ||
      session.simulated !== true || session.hardware_observed !== false || session.performance_prediction !== false) {
    return { status: "unsupported", detail: "This view currently supports admitted CPU simulator memory snapshots only." };
  }
  if (session.state !== "stopped" || session.configuration_identity !== session.cursor.configuration_identity ||
      session.revision !== session.cursor.state_revision || stableKey(session.cursor) !== stableKey(expectedSnapshot.cursor)) {
    return { status: "stale", detail: "The response no longer matches the selected stopped session and cursor. Select a matching snapshot." };
  }
  if (response.status === "unavailable") {
    const unavailable = response.unavailable;
    if (!keys(response, ["status", "schema", "request_id", "operation", "session", "unavailable"]) ||
        !keys(unavailable, ["capability", "reason", "state_changed", "detail"]) ||
        unavailable.capability !== "allocation_relative_memory" || !reason(unavailable.reason) ||
        unavailable.state_changed !== false || typeof unavailable.detail !== "string" || unavailable.detail.length > 256) {
      return { status: "invalid", detail: "The unavailable memory response does not match the supported response shape." };
    }
    return { status: "unavailable", detail: `Memory unavailable: ${unavailable.reason}. ${unavailable.detail}` };
  }
  if (!keys(response, ["status", "schema", "request_id", "operation", "session", "result"]) ||
      response.status !== "ok" || !keys(response.result, ["result", "snapshot", "memory"]) ||
      response.result.result !== "memory") {
    return { status: "invalid", detail: "The response is not a supported memory result." };
  }
  if (!anchor(response.result.snapshot)) {
    return { status: "invalid", detail: "The returned snapshot has invalid or inexact metadata." };
  }
  if (resourceSnapshotAnchorKey(response.result.snapshot) !== expectedKey) {
    return { status: "stale", detail: "The response belongs to a different snapshot, scope, source site, frame, or occurrence." };
  }
  if (!memoryRead(response.result.memory)) {
    return { status: "invalid", detail: `The memory window is invalid, inexact, or exceeds the ${RESOURCE_MEMORY_MAX_BYTES}-byte view bound. Request a smaller exact range.` };
  }
  return {
    status: "ready",
    anchor: response.result.snapshot,
    anchorKey: expectedKey,
    requestId: response.request_id,
    memory: response.result.memory,
  };
}

export interface ResourceMemoryCell {
  byteOffset: number;
  byteLength: number;
  bytes: string;
  initialized: boolean[];
}

/** Produces at most one 256-byte viewport, never a node for an entire allocation. */
export function resourceMemoryCells(
  memory: ResourceMemoryRead,
  page: number,
  cellBytes: 1 | 4,
): ResourceMemoryCell[] {
  if (!memoryRead(memory) || memory.availability.status !== "captured" ||
      !integer(page) || (cellBytes !== 1 && cellBytes !== 4)) return [];
  const availability = memory.availability;
  const start = page * RESOURCE_MEMORY_VISIBLE_BYTES;
  if (!integer(start) || start >= memory.returned_bytes) return [];
  const end = Math.min(start + RESOURCE_MEMORY_VISIBLE_BYTES, memory.returned_bytes);
  const cells: ResourceMemoryCell[] = [];
  for (let index = start; index < end; index += cellBytes) {
    const length = Math.min(cellBytes, end - index);
    const initialized = Array.from({ length }, (_, local) => {
      const position = index + local;
      const bitByte = Number.parseInt(availability.initialized.slice(
        2 + Math.floor(position / 8) * 2,
        4 + Math.floor(position / 8) * 2,
      ), 16);
      return (bitByte & (1 << (position % 8))) !== 0;
    });
    cells.push({
      byteOffset: memory.byte_offset + index,
      byteLength: length,
      bytes: `0x${availability.bytes.slice(2 + index * 2, 2 + (index + length) * 2)}`,
      initialized,
    });
  }
  return cells;
}
