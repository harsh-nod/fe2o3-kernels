/** Bounded presentation of Rust resource-query DTOs. This is not admission,
 * source authentication, a transport, or execution/build control. */
import { resourceSnapshotAnchorKey, type ResourceScope, type ResourceSnapshotAnchor } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export const RESOURCE_ACCESS_MAX_ROWS = 256;
export const RESOURCE_ACCESS_VISIBLE_ROWS = 64;
const U64_MAX = 18_446_744_073_709_551_615n;
const spaces = ["private", "workgroup", "global", "constant", "generic"] as const;
const accessKinds = ["read", "write_committed", "atomic_read", "atomic_write_committed", "atomic_read_write_committed"] as const;
type Space = typeof spaces[number];
type AccessKind = typeof accessKinds[number];
type ObjectValue = Record<string, unknown>;
type Allocation = { ordinal: number; generation: 0 };
type Range = { byte_offset: string; byte_len: string };
type QueryScope = { level: "dispatch" } | { level: "workgroup"; workgroup: number[] } |
  { level: "wave"; workgroup: number[]; wave: number } | { level: "lane"; workgroup: number[]; wave: number; lane: number };
type AccessFilter = { scope: QueryScope; allocation?: Allocation; address_space?: Space; access?: AccessKind; range?: Range };

export interface ResourceAllocationRow {
  allocation: Allocation;
  address_space: Space;
  access: "read_only" | "write_only" | "read_write";
  alignment: number;
  capacity_bytes: string;
  snapshot_bytes_available: true;
  initialization_available: true;
  owning_scope: "not_represented";
  lifetime: "not_represented";
  physical_base: "not_represented";
}

export interface ResourceAccessRow {
  occurrence: {
    record_ordinal: number;
    event_sequence: number;
    scope: ResourceScope;
    site: NonNullable<ResourceSnapshotAnchor["site"]>["kir"];
    schedule: { identity: "workgroup_major_local_zyx_serial_v1" | "workgroup_major_local_zyx_cooperative_v1" | "workgroup_major_seeded_runnable_cooperative_v1"; decision_ordinal: number };
  };
  allocation: Allocation;
  range: Range;
  address_space: Space;
  access: AccessKind;
  call_frame: "not_represented";
  operation_occurrence: "not_represented";
  source_association: "not_represented";
}

export type ResourceCompleteness = { status: "complete" } | {
  status: "truncated";
  reason: "event_limit" | "byte_limit" | "resident_limit" | "producer_failure" | "user_stopped";
  emitted_events: number;
  dropped_events?: number;
};

export interface ResourceAccessProjectionInput {
  response: unknown;
  expectedSnapshot: unknown;
  expectedRequest: unknown;
  /** Caller-owned fences only, not claims attested by a backend response. */
  context: ResourceMemoryContext;
  responseContext: ResourceMemoryContext;
}

interface ReadyBase {
  status: "ready";
  anchor: ResourceSnapshotAnchor;
  anchorKey: string;
  context: ResourceMemoryContext;
  contextKey: string;
  requestId: number;
  sourceCount: number;
  scanned: number;
  completeness: ResourceCompleteness;
  hasMorePages: boolean;
}

export type ResourceAccessProjection =
  | (ReadyBase & { kind: "allocations"; rows: ResourceAllocationRow[] })
  | (ReadyBase & { kind: "memory_accesses"; rows: ResourceAccessRow[] })
  | { status: "invalid" | "stale" | "unsupported" | "unavailable" | "error"; detail: string };

function record(value: unknown): value is ObjectValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function keys(value: unknown, required: string[], optional: string[] = []): value is ObjectValue {
  return record(value) && required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => required.includes(key) || optional.includes(key));
}
function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function member<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}
function identity(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}
function token(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,128}$/u.test(value);
}
function contextKey(value: unknown): string | null {
  if (!keys(value, ["connectionId", "captureIdentity", "target", "variantIdentity"]) ||
      typeof value.connectionId !== "string" || !/^[A-Za-z0-9_.:/+-]{1,128}$/u.test(value.connectionId) ||
      !(value.captureIdentity === null || identity(value.captureIdentity)) ||
      !(value.variantIdentity === null || identity(value.variantIdentity)) ||
      !(value.target === null || (typeof value.target === "string" && /^[A-Za-z0-9_.:/+-]{1,128}$/u.test(value.target)))) return null;
  return JSON.stringify([value.connectionId, value.captureIdentity, value.target, value.variantIdentity]);
}
function decimal(value: unknown): value is string {
  return typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/u.test(value) && BigInt(value) <= U64_MAX;
}
function range(value: unknown): value is Range {
  return keys(value, ["byte_offset", "byte_len"]) && decimal(value.byte_offset) && decimal(value.byte_len) &&
    BigInt(value.byte_len) > 0n && BigInt(value.byte_offset) + BigInt(value.byte_len) <= U64_MAX;
}
function allocation(value: unknown): value is Allocation {
  return keys(value, ["ordinal", "generation"]) && integer(value.ordinal, 1) && value.generation === 0;
}
function vec3(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 3 && [0, 1, 2].every((index) => Object.hasOwn(value, index) && integer(value[index], 0, 0xffff_ffff));
}
function queryScope(value: unknown, width: number): value is QueryScope {
  if (!record(value)) return false;
  if (value.level === "dispatch") return keys(value, ["level"]);
  if (value.level === "workgroup") return keys(value, ["level", "workgroup"]) && vec3(value.workgroup);
  if (value.level === "wave") return keys(value, ["level", "workgroup", "wave"]) && vec3(value.workgroup) && integer(value.wave, 0, 0xffff_ffff);
  return value.level === "lane" && keys(value, ["level", "workgroup", "wave", "lane"]) &&
    vec3(value.workgroup) && integer(value.wave, 0, 0xffff_ffff) && integer(value.lane, 0, width - 1);
}
function accessFilter(value: unknown, width: number): value is AccessFilter {
  return keys(value, ["scope"], ["allocation", "address_space", "access", "range"]) && queryScope(value.scope, width) &&
    (!Object.hasOwn(value, "allocation") || allocation(value.allocation)) &&
    (!Object.hasOwn(value, "address_space") || member(value.address_space, spaces)) &&
    (!Object.hasOwn(value, "access") || member(value.access, accessKinds)) &&
    (!Object.hasOwn(value, "range") || range(value.range));
}
function completeness(value: unknown): value is ResourceCompleteness {
  return (keys(value, ["status"]) && value.status === "complete") ||
    (keys(value, ["status", "reason", "emitted_events"], ["dropped_events"]) && value.status === "truncated" &&
      member(value.reason, ["event_limit", "byte_limit", "resident_limit", "producer_failure", "user_stopped"]) &&
      integer(value.emitted_events) && (!Object.hasOwn(value, "dropped_events") || integer(value.dropped_events)));
}
function allocationRow(value: unknown): value is ResourceAllocationRow {
  return keys(value, ["allocation", "address_space", "access", "alignment", "capacity_bytes", "snapshot_bytes_available", "initialization_available", "owning_scope", "lifetime", "physical_base"]) &&
    allocation(value.allocation) && member(value.address_space, spaces) && member(value.access, ["read_only", "write_only", "read_write"]) &&
    integer(value.alignment, 1, 0xffff_ffff) && (BigInt(value.alignment) & (BigInt(value.alignment) - 1n)) === 0n && decimal(value.capacity_bytes) &&
    value.snapshot_bytes_available === true && value.initialization_available === true &&
    value.owning_scope === "not_represented" && value.lifetime === "not_represented" && value.physical_base === "not_represented";
}
function accessRow(value: unknown, anchor: ResourceSnapshotAnchor): value is ResourceAccessRow {
  if (!keys(value, ["occurrence", "allocation", "range", "address_space", "access", "call_frame", "operation_occurrence", "source_association"]) ||
      !allocation(value.allocation) || !range(value.range) || !member(value.address_space, spaces) || !member(value.access, accessKinds) ||
      value.call_frame !== "not_represented" || value.operation_occurrence !== "not_represented" || value.source_association !== "not_represented") return false;
  const occurrence = value.occurrence;
  if (!keys(occurrence, ["record_ordinal", "event_sequence", "scope", "site", "schedule"]) ||
      !integer(occurrence.record_ordinal) || !integer(occurrence.event_sequence, 1) ||
      occurrence.record_ordinal + 1 !== occurrence.event_sequence || occurrence.event_sequence > anchor.cursor.event_sequence ||
      !keys(occurrence.schedule, ["identity", "decision_ordinal"]) || !integer(occurrence.schedule.decision_ordinal) ||
      !member(occurrence.schedule.identity, ["workgroup_major_local_zyx_serial_v1", "workgroup_major_local_zyx_cooperative_v1", "workgroup_major_seeded_runnable_cooperative_v1"])) return false;
  // Reuse the public, closed anchor guard for scope and KIR site structure. This
  // temporary validation object is never emitted as a source/snapshot assertion.
  if (resourceSnapshotAnchorKey({ ...anchor, scope: occurrence.scope, site: { kir: occurrence.site, source: { status: "unavailable", reason: "not_represented" } } }) === null) return false;
  const scope = occurrence.scope as ResourceScope;
  const site = occurrence.site as NonNullable<ResourceSnapshotAnchor["site"]>["kir"];
  return scope.level === "lane" && anchor.scope.level === "lane" && scope.wave_width === anchor.scope.wave_width && site.point.kind === "operation";
}
function matchesFilter(row: ResourceAccessRow, filter: AccessFilter): boolean {
  const scope = row.occurrence.scope;
  if (scope.level !== "lane") return false;
  if (filter.scope.level !== "dispatch") {
    if (filter.scope.workgroup.some((coordinate, index) => coordinate !== scope.workgroup[index])) return false;
    if ((filter.scope.level === "wave" || filter.scope.level === "lane") && filter.scope.wave !== scope.wave) return false;
    if (filter.scope.level === "lane" && filter.scope.lane !== scope.lane) return false;
  }
  if (filter.allocation && filter.allocation.ordinal !== row.allocation.ordinal) return false;
  if (filter.address_space && filter.address_space !== row.address_space) return false;
  if (filter.access && filter.access !== row.access) return false;
  if (filter.range) {
    const left = BigInt(row.range.byte_offset), right = left + BigInt(row.range.byte_len);
    const selected = BigInt(filter.range.byte_offset), selectedEnd = selected + BigInt(filter.range.byte_len);
    if (left >= selectedEnd || selected >= right) return false;
  }
  return true;
}
function denseRows(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length <= RESOURCE_ACCESS_MAX_ROWS &&
    Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean);
}
function frozenCopy<T>(value: T): T {
  const copy = structuredClone(value);
  function freeze(child: unknown) {
    if (child && typeof child === "object") { Object.values(child).forEach(freeze); Object.freeze(child); }
  }
  freeze(copy);
  return copy;
}

export function projectResourceAccessResponse(input: ResourceAccessProjectionInput): ResourceAccessProjection {
  const invalid = (detail: string): ResourceAccessProjection => ({ status: "invalid", detail });
  const stale = (detail: string): ResourceAccessProjection => ({ status: "stale", detail });
  const anchorKey = resourceSnapshotAnchorKey(input.expectedSnapshot);
  const selectedContext = contextKey(input.context), pairedContext = contextKey(input.responseContext);
  if (anchorKey === null || selectedContext === null || pairedContext === null) return invalid("The selected snapshot or caller-owned context is malformed or has inexact integer metadata.");
  if (selectedContext !== pairedContext) return stale("The response belongs to another caller-selected connection, capture, target, or variant.");
  const anchor = input.expectedSnapshot as ResourceSnapshotAnchor;
  if (anchor.scope.level !== "lane" || anchor.cursor.event_sequence === 0) return invalid("Resource queries require a concrete captured logical-lane checkpoint.");
  const request = input.expectedRequest;
  if (!record(request) || !member(request.operation, ["query_allocations", "query_memory_accesses"]) ||
      !keys(request, ["schema", "operation", "request_id", "expected_revision", "expected_snapshot", "page", ...(request.operation === "query_memory_accesses" ? ["filter"] : [])], request.operation === "query_allocations" ? ["address_space"] : []) ||
      request.schema !== "fe2o3-debug-resource-request-v1" || !integer(request.request_id, 1) || !integer(request.expected_revision) ||
      !keys(request.page, ["max_items", "max_scanned"], ["token"]) || !integer(request.page.max_items, 1, 256) || !integer(request.page.max_scanned, 1, 256) ||
      (Object.hasOwn(request.page, "token") && !token(request.page.token)) ||
      (request.operation === "query_allocations" && Object.hasOwn(request, "address_space") && !member(request.address_space, spaces)) ||
      (request.operation === "query_memory_accesses" && !accessFilter(request.filter, anchor.scope.wave_width))) return invalid("A bounded, read-only resource request with exact query filters is required.");
  const requestAnchorKey = resourceSnapshotAnchorKey(request.expected_snapshot);
  if (requestAnchorKey === null) return invalid("The requested snapshot is malformed or inexact.");
  if (requestAnchorKey !== anchorKey || request.expected_revision !== anchor.cursor.state_revision) return stale("The selected snapshot differs from the original resource request.");
  const response = input.response;
  if (!record(response) || response.schema !== "fe2o3-debug-resource-response-v1" || !integer(response.request_id, 1)) return invalid("A separately versioned Rust resource-query response is required.");
  if (response.request_id !== request.request_id || response.operation !== request.operation) return stale("The response does not match the selected resource request ID and operation.");
  const session = response.session;
  if (!keys(session, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]) ||
      !integer(session.revision) || !identity(session.configuration_identity) || !record(session.cursor) ||
      resourceSnapshotAnchorKey({ ...anchor, cursor: session.cursor }) === null) return invalid("The response session metadata is malformed or inexact.");
  if (session.backend !== "cpu_kir_simulator" || session.execution_kind !== "cpu_kir_simulation" || session.simulated !== true || session.hardware_observed !== false || session.performance_prediction !== false) {
    return { status: "unsupported", detail: "Only captured CPU simulator resource observations are supported; no hardware state is inferred." };
  }
  if (session.state !== "stopped" || session.configuration_identity !== session.cursor.configuration_identity || session.revision !== session.cursor.state_revision ||
      resourceSnapshotAnchorKey({ ...anchor, cursor: session.cursor }) !== anchorKey) return stale("The response is not from the selected stopped session and revision.");
  if (response.status === "error") {
    const error = response.error;
    if (!keys(response, ["schema", "status", "request_id", "operation", "session", "error"]) ||
        !keys(error, ["stage", "code", "message", "state_changed"]) || !token(error.stage) || !token(error.code) ||
        error.state_changed !== false || typeof error.message !== "string" || error.message.length === 0 || error.message.length > 256 ||
        new TextEncoder().encode(error.message).length > 256 || [...error.message].some((character) => {
          const code = character.charCodeAt(0);
          return code < 32 || (code >= 127 && code <= 159);
        })) return invalid("Malformed resource error response.");
    return { status: "error", detail: `Resource query rejected (${error.code}): ${error.message}` };
  }
  if (response.status === "unavailable") {
    if (!keys(response, ["schema", "status", "request_id", "operation", "session", "reason", "completeness"], ["required"]) ||
        !member(response.reason, ["no_selected_record", "not_checkpoint", "frame_limit", "value_limit", "allocation_limit", "memory_byte_limit", "allocation_failure", "not_captured"]) || !completeness(response.completeness)) return invalid("Malformed resource unavailability response.");
    const capture = response.reason !== "no_selected_record" && response.reason !== "not_checkpoint";
    if (capture !== Object.hasOwn(response, "required") || (capture && !decimal(response.required)) ||
        (request.operation === "query_memory_accesses" && response.reason !== "no_selected_record")) return invalid("The unavailable resource reason contradicts its capture metadata.");
    return { status: "unavailable", detail: `Resources unavailable: ${response.reason}${capture ? `; capture required ${response.required}` : ""}. ${response.completeness.status === "truncated" ? "The retained capture is truncated." : "No resource rows were returned."}` };
  }
  if (!keys(response, ["schema", "status", "request_id", "operation", "session", "snapshot", "page", "result", "physical_registers"]) || response.status !== "ok" || response.physical_registers !== "not_represented") return invalid("Malformed resource result or unsupported physical-register claim.");
  const receivedAnchorKey = resourceSnapshotAnchorKey(response.snapshot);
  if (receivedAnchorKey === null) return invalid("The returned resource snapshot is malformed or inexact.");
  if (receivedAnchorKey !== anchorKey) return stale("The full resource snapshot no longer matches the selected source, scope, cursor, or occurrence.");
  const page = response.page;
  if (!keys(page, ["source_count", "scanned", "completeness"], ["next_token"]) || !integer(page.source_count) ||
      !integer(page.scanned, 0, request.page.max_scanned) || page.scanned > page.source_count ||
      (page.scanned === 0 && page.source_count !== 0) || !completeness(page.completeness) ||
      (Object.hasOwn(page, "next_token") && (!token(page.next_token) || page.scanned === 0 || page.source_count <= page.scanned || page.next_token === request.page.token))) return invalid("The resource page has invalid counts, completeness, or continuation metadata.");
  const result = response.result;
  const kind = request.operation === "query_allocations" ? "allocations" : "memory_accesses";
  const rowKey = kind === "allocations" ? "allocations" : "accesses";
  if (!keys(result, ["result", rowKey]) || result.result !== kind || !denseRows(result[rowKey])) return invalid("The resource row collection is malformed or exceeds the 256-row bound.");
  const rows = result[rowKey] as unknown[];
  if (rows.length > request.page.max_items || rows.length > page.scanned) return invalid("Returned resource rows exceed the requested output or raw-scan budget.");
  const base: ReadyBase = { status: "ready", anchor, anchorKey, context: input.context, contextKey: selectedContext, requestId: request.request_id,
    sourceCount: page.source_count, scanned: page.scanned, completeness: page.completeness, hasMorePages: Object.hasOwn(page, "next_token") };
  if (kind === "allocations") {
    const identities = new Set<number>();
    for (const row of rows) {
      if (!allocationRow(row) || identities.has(row.allocation.ordinal) || (request.address_space !== undefined && request.address_space !== row.address_space)) return invalid("An allocation row is malformed, duplicated, or outside the requested address space.");
      identities.add(row.allocation.ordinal);
    }
    return frozenCopy({ ...base, kind, rows: rows as ResourceAllocationRow[] });
  }
  if (page.source_count > anchor.cursor.event_sequence || (page.completeness.status === "truncated" && page.completeness.emitted_events < page.source_count)) return invalid("The access page claims a future or impossible retained source prefix.");
  let previous = 0;
  for (const row of rows) {
    if (!accessRow(row, anchor) || row.occurrence.event_sequence <= previous || row.occurrence.event_sequence > page.source_count || !matchesFilter(row, request.filter as AccessFilter)) return invalid("An access row is malformed, duplicated, out of order, or outside the exact requested filter.");
    previous = row.occurrence.event_sequence;
  }
  return frozenCopy({ ...base, kind, rows: rows as ResourceAccessRow[] });
}

/** Exact half-open range label; callers never convert these byte extents to Number. */
export function resourceAccessRangeLabel(row: ResourceAccessRow): string {
  return `[${row.range.byte_offset}, ${(BigInt(row.range.byte_offset) + BigInt(row.range.byte_len)).toString()})`;
}

export function resourceAccessScopeLabel(scope: ResourceScope): string {
  if (scope.level === "dispatch") return "Dispatch";
  const group = `Workgroup [${scope.workgroup.join(", ")}]`;
  if (scope.level === "workgroup") return group;
  return `${group}, logical wave ${scope.wave}${scope.level === "lane" ? `, lane ${scope.lane}` : ""}`;
}
