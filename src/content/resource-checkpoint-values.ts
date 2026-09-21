/** Bounded presentation checks, not Rust admission or producer authentication.
 * Read only the selected control snapshot; never join historical access rows. */
import type { ImportedResourceCheckpoint } from "./recorded-resource-import";
import { resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";

export const RESOURCE_CHECKPOINT_VALUE_LIMIT = 64;
export const RESOURCE_CHECKPOINT_VALUE_BITS = 64;
type Row = Record<string, unknown>;
export interface CheckpointPointerValue {
  readonly addressSpace: "private" | "workgroup" | "global" | "constant" | "generic";
  readonly allocationOrdinal: string;
  readonly generation: string;
  readonly byteOffset: string;
}
export interface CheckpointValueRow {
  readonly key: string;
  readonly functionOrdinal: string;
  readonly frame: string;
  readonly valueOrdinal: string;
  readonly status: "captured" | "unavailable" | "redacted";
  readonly typeLabel: string;
  readonly representation: string;
  readonly interpretation: string;
  readonly pointer?: CheckpointPointerValue;
}
export type CheckpointValuesProjection =
  | { status: "ready"; anchor: ResourceSnapshotAnchor; requestId: number; rows: readonly CheckpointValueRow[] }
  | { status: "invalid" | "stale" | "unsupported"; detail: string };

class ProjectionRefusal extends Error {
  constructor(readonly status: "invalid" | "stale" | "unsupported", detail: string) { super(detail); }
}
function refuse(status: ProjectionRefusal["status"], detail: string): never {
  throw new ProjectionRefusal(status, detail);
}
function object(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse("invalid", "Expected a value object.");
  return value as Row;
}
function exact(value: unknown, fields: readonly string[]): Row {
  const data = object(value);
  if (Object.keys(data).length !== fields.length || fields.some(field => !Object.hasOwn(data, field))) {
    refuse("invalid", "Missing or unsupported fields in the checkpoint value projection.");
  }
  return data;
}
function integer(value: unknown, minimum = 0): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;
}
function u64(value: unknown, minimum = 0n): string {
  if ((typeof value !== "bigint" && !integer(value)) ||
      BigInt(value as number | bigint) < minimum || BigInt(value as number | bigint) > 0xffff_ffff_ffff_ffffn) {
    refuse("invalid", "Value identity or allocation offset is not an exact unsigned 64-bit integer.");
  }
  return String(value);
}
function stop(value: unknown): void {
  const data = exact(value, ["reason", "outcome", "exact"]);
  if (data.reason !== "step" || data.outcome !== "active" || data.exact !== true) {
    refuse("unsupported", "Only the existing exact active step checkpoint is displayed.");
  }
}
const UNAVAILABLE = new Set(["not_represented", "not_captured", "optimized_out", "outside_capture_scope",
  "not_in_scope", "not_live", "uninitialized", "truncated", "unsupported_by_backend", "requires_authenticated_map"]);
const REDACTED = new Set(["native_address", "runtime_handle", "policy"]);
const SPACES = new Set(["private", "workgroup", "global", "constant", "generic"]);

function valueRow(value: unknown): CheckpointValueRow {
  const data = exact(value, ["path", "availability"]);
  const path = exact(data.path, ["root", "components"]), root = object(path.root);
  if (root.kind !== "ssa" || !Array.isArray(path.components) || path.components.length !== 0) {
    refuse("unsupported", "Only whole scalar SSA roots are displayed; other roots and subpaths remain unsupported.");
  }
  exact(root, ["kind", "function_ordinal", "frame", "value_ordinal"]);
  const functionOrdinal = u64(root.function_ordinal), frame = u64(root.frame, 1n), valueOrdinal = u64(root.value_ordinal);
  const identity = { key: `${functionOrdinal}:${frame}:${valueOrdinal}`, functionOrdinal, frame, valueOrdinal };
  const availability = object(data.availability);
  if (availability.status === "unavailable" || availability.status === "redacted") {
    exact(availability, ["status", "reason"]);
    const reasons = availability.status === "unavailable" ? UNAVAILABLE : REDACTED;
    if (typeof availability.reason !== "string" || !reasons.has(availability.reason)) {
      refuse("invalid", "Unknown value availability reason.");
    }
    return { ...identity, status: availability.status, typeLabel: "Not supplied",
      representation: availability.reason, interpretation: "No value supplied; not zero or false." };
  }
  exact(availability, ["status", "value_type", "value", "provenance"]);
  if (availability.status !== "captured") refuse("invalid", "Unknown value availability.");
  if (availability.provenance !== "simulated_observation") {
    refuse("unsupported", "Only recorded simulated_observation values are displayed; hardware or reconstructed values are not relabeled.");
  }
  const type = object(availability.value_type);
  if (type.kind === "pointer") {
    exact(type, ["kind", "address_space"]);
    if (typeof type.address_space !== "string" || !SPACES.has(type.address_space)) refuse("invalid", "Unknown pointer address space.");
    const pointer = exact(availability.value, ["encoding", "allocation", "byte_offset"]);
    if (pointer.encoding !== "allocation_relative_pointer") refuse("invalid", "Pointer encoding does not match its type.");
    const allocation = exact(pointer.allocation, ["ordinal", "generation"]);
    const ordinal = u64(allocation.ordinal, 1n), generation = u64(allocation.generation), offset = u64(pointer.byte_offset);
    if (generation !== "0") refuse("unsupported", "Nonzero allocation generations are outside this recorded presentation subset.");
    return { ...identity, status: "captured", typeLabel: `${type.address_space} pointer`,
      pointer: { addressSpace: type.address_space as CheckpointPointerValue["addressSpace"],
        allocationOrdinal: ordinal, generation, byteOffset: offset },
      representation: `alloc#${ordinal}:g${generation} + ${offset} bytes`,
      interpretation: "Allocation-relative only; not dereferenced and not a native address or bounds check." };
  }
  let width: number, label: string;
  if (type.kind === "bool") { exact(type, ["kind"]); width = 1; label = "bool"; }
  else if (type.kind === "integer") {
    exact(type, ["kind", "signed", "bits"]);
    if (typeof type.signed !== "boolean" || !integer(type.bits, 1) || type.bits > 4096) refuse("invalid", "Invalid integer type.");
    if (type.bits > RESOURCE_CHECKPOINT_VALUE_BITS) refuse("unsupported", "Integer values wider than 64 bits are not displayed.");
    width = type.bits; label = `${type.signed ? "i" : "u"}${width}`;
  } else if (type.kind === "index" || type.kind === "float") {
    exact(type, ["kind", "bits"]);
    if (!integer(type.bits) || !(type.kind === "index" ? [32, 64] : [16, 32, 64]).includes(type.bits)) {
      refuse("invalid", "Invalid index or floating-point width.");
    }
    width = type.bits; label = type.kind === "index" ? `index${width}` : `f${width} (raw bits)`;
  } else refuse("unsupported", "Aggregate, byte-array and unknown value types are not displayed by this scalar inspector.");
  const bits = exact(availability.value, ["encoding", "bits"]);
  if (bits.encoding !== "bits" || typeof bits.bits !== "string" ||
      bits.bits.length !== 2 + Math.ceil(width / 4) || !/^0x[0-9a-f]+$/u.test(bits.bits)) {
    refuse("invalid", "Scalar encoding is not canonical width-matched hexadecimal bits.");
  }
  const unsigned = BigInt(bits.bits), modulus = 1n << BigInt(width);
  if (unsigned >= modulus) refuse("invalid", "Scalar bits exceed the declared width.");
  const interpreted = type.kind === "float" ? "Raw bits only; no floating-point decoding."
    : type.kind === "bool" ? (unsigned === 0n ? "false" : "true")
    : String(type.kind === "integer" && type.signed && unsigned >= modulus / 2n ? unsigned - modulus : unsigned);
  return { ...identity, status: "captured", typeLabel: label, representation: bits.bits, interpretation: interpreted };
}

export function projectResourceCheckpointValues(checkpoint: ImportedResourceCheckpoint): CheckpointValuesProjection {
  try {
    const expectedKey = resourceSnapshotAnchorKey(checkpoint.anchor);
    if (expectedKey === null || expectedKey !== checkpoint.anchorKey) refuse("stale", "The independent checkpoint anchor changed.");
    const control = checkpoint.control;
    const request = exact(control.request, ["schema", "request_id", "expected_revision", "operation", "direction", "granularity", "count"]);
    const response = exact(control.response, ["status", "schema", "request_id", "operation", "session", "result"]);
    if (control.kind !== "checkpoint" || !integer(control.requestId, 1) ||
        request.request_id !== control.requestId || response.request_id !== control.requestId ||
        request.schema !== "fe2o3-debug-request-v1" || response.schema !== "fe2o3-debug-response-v1" ||
        request.operation !== "step" || response.operation !== "step" || response.status !== "ok" ||
        !["forward", "reverse"].includes(String(request.direction)) || request.granularity !== "operation" ||
        !integer(request.count, 1) || request.count > 65_536 || !integer(request.expected_revision) ||
        request.expected_revision + 1 !== checkpoint.anchor.cursor.state_revision) {
      refuse("stale", "The recorded control pair does not match this step checkpoint.");
    }
    const session = exact(response.session, ["backend", "execution_kind", "state", "revision", "configuration_identity",
      "cursor", "simulated", "hardware_observed", "performance_prediction"]);
    const cursor = exact(session.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
    if (session.backend !== "cpu_kir_simulator" || session.execution_kind !== "cpu_kir_simulation" || session.state !== "stopped" ||
        session.simulated !== true || session.hardware_observed !== false || session.performance_prediction !== false ||
        session.revision !== checkpoint.anchor.cursor.state_revision || session.configuration_identity !== checkpoint.anchor.cursor.configuration_identity ||
        Object.entries(cursor).some(([key, value]) => value !== checkpoint.anchor.cursor[key as keyof typeof checkpoint.anchor.cursor])) {
      refuse("stale", "The stopped CPU session does not match the selected checkpoint.");
    }
    const result = exact(response.result, ["result", "stop", "snapshot", "events_advanced"]);
    if (result.result !== "control" || !integer(result.events_advanced)) refuse("invalid", "Invalid control result.");
    stop(result.stop);
    const availability = object(result.snapshot);
    if (availability.status !== "captured") refuse("unsupported", "No captured checkpoint snapshot is available; another stop is never substituted.");
    exact(availability, ["status", "snapshot"]);
    const snapshot = exact(availability.snapshot, ["anchor", "stop", "values"]);
    stop(snapshot.stop);
    if (resourceSnapshotAnchorKey(snapshot.anchor) !== expectedKey) refuse("stale", "Snapshot scope, source, occurrence or cursor differs from the selected checkpoint.");
    if (!Array.isArray(snapshot.values)) refuse("invalid", "Snapshot values are not an array.");
    if (snapshot.values.length > RESOURCE_CHECKPOINT_VALUE_LIMIT) refuse("unsupported", "This checkpoint exceeds the 64-value display budget; no partial or previous table is shown.");
    const rows = snapshot.values.map(valueRow);
    if (new Set(rows.map(row => row.key)).size !== rows.length) refuse("invalid", "Duplicate recorded function/frame/value identity.");
    return { status: "ready", anchor: checkpoint.anchor, requestId: control.requestId, rows };
  } catch (error) {
    if (error instanceof ProjectionRefusal) return { status: error.status, detail: error.message };
    throw error;
  }
}
