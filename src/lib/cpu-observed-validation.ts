/** Closed validation helpers for opt-in semantic CPU observations. */
export type ObservedRow = Record<string, unknown>;
export const OBSERVED_U64 = 0xffffffffffffffffn;
export function need(value: unknown): asserts value { if (!value) throw new Error("Invalid observed CPU response"); }
export function object(value: unknown, required: readonly string[], optional: readonly string[] = []): ObservedRow {
  need(value !== null && typeof value === "object" && !Array.isArray(value));
  const row = value as ObservedRow, keys = Object.keys(row);
  need(required.every(key => Object.hasOwn(row, key)) &&
    keys.every(key => required.includes(key) || optional.includes(key)));
  for (const key of optional) if (Object.hasOwn(row, key)) need(row[key] !== null && row[key] !== undefined);
  return row;
}
export function decimal(value: unknown, minimum = 0n): string {
  need(typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/u.test(value));
  const parsed = BigInt(value); need(parsed >= minimum && parsed <= OBSERVED_U64); return value;
}
export function uint(value: unknown, maximum = OBSERVED_U64): bigint {
  need(typeof value === "bigint" || (typeof value === "number" && Number.isSafeInteger(value)));
  const parsed = BigInt(value); need(parsed >= 0n && parsed <= maximum); return parsed;
}
export function enumValue(value: unknown, allowed: readonly string[]): string {
  need(typeof value === "string" && allowed.includes(value)); return value;
}
export function stable(value: unknown): string {
  if (typeof value === "bigint" || typeof value === "number") return "#" + uint(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ":" + stable((value as ObservedRow)[key])).join(",") + "}";
  return JSON.stringify(value) ?? "undefined";
}
export function same(a: unknown, b: unknown): void { need(stable(a) === stable(b)); }
export function frozen<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(frozen); Object.freeze(value);
  }
  return value;
}
export const UNAVAILABLE = ["not_requested", "policy_disabled", "no_selected_record", "not_checkpoint",
  "no_matching_operation", "aggregate_record", "legacy_stack_unavailable", "identity_invariant",
  "prefix_truncated", "invalid_join", "allocation_failure", "observation_stopped", "sequence_overflow",
  "not_captured", "work_limit"] as const;
export function missing(value: unknown): void { enumValue(value, UNAVAILABLE); }
export function owner(value: unknown): ObservedRow {
  const row = object(value, ["backend_session", "capture_instance"]);
  decimal(row.backend_session, 1n); decimal(row.capture_instance, 1n); return row;
}
export function cursor(value: unknown): ObservedRow {
  const row = object(value, ["configuration_identity", "event_sequence", "state_revision"]);
  need(typeof row.configuration_identity === "string" && /^[0-9a-f]{64}$/u.test(row.configuration_identity) &&
    !/^0+$/u.test(row.configuration_identity));
  uint(row.event_sequence); uint(row.state_revision); return row;
}
export function binding(value: unknown): ObservedRow {
  const row = object(value, ["owner", "cursor"]); owner(row.owner); cursor(row.cursor); return row;
}
export function completeness(value: unknown, currentEvent?: bigint): void {
  const row = object(value, ["status"], ["reason", "emitted_events", "dropped_events"]);
  if (row.status === "complete") { object(row, ["status"]); return; }
  need(row.status === "truncated"); object(row, ["status", "reason", "emitted_events"], ["dropped_events"]);
  enumValue(row.reason, ["event_limit", "byte_limit", "resident_limit", "producer_failure", "user_stopped"]);
  const emitted = uint(row.emitted_events);
  if (currentEvent !== undefined) need(emitted >= currentEvent);
  if (Object.hasOwn(row, "dropped_events")) uint(row.dropped_events);
}
export function coverage(value: unknown, available: boolean, event: bigint): void {
  const row = object(value, ["coverage"], ["retained_records", "reason"]);
  if (row.coverage === "prefix_truncated") {
    object(row, ["coverage", "retained_records", "reason"]);
    enumValue(row.reason, ["row_limit", "frame_limit", "transition_limit", "byte_limit",
      "allocation_failure", "invalid_capacity", "validation_work_limit"]);
    const retained = BigInt(decimal(row.retained_records)); if (available) need(retained >= event);
  } else {
    object(row, ["coverage"]); enumValue(row.coverage, ["disabled", "complete", "invalid_join"]);
    if (available) need(row.coverage === "complete");
  }
}
export function vector(value: unknown, strings: boolean, positive = false): bigint[] {
  need(Array.isArray(value) && value.length === 3);
  return value.map(v => strings ? BigInt(decimal(v, positive ? 1n : 0n)) : uint(v, 0xffffffffn));
}
export function invocation(value: unknown): ObservedRow {
  const row = object(value, ["global", "workgroup", "local", "workgroup_size", "workgroup_count", "launch_extent"]);
  const global = vector(row.global, true), group = vector(row.workgroup, true), local = vector(row.local, false),
    size = vector(row.workgroup_size, false), count = vector(row.workgroup_count, true, true), launch = vector(row.launch_extent, true, true);
  for (let axis = 0; axis < 3; axis++) {
    need(size[axis] > 0n && count[axis] === (launch[axis] + size[axis] - 1n) / size[axis] &&
      group[axis] < count[axis] && local[axis] < size[axis] &&
      global[axis] === group[axis] * size[axis] + local[axis] && global[axis] < launch[axis]);
  }
  return row;
}
export function site(value: unknown): ObservedRow {
  const row = object(value, ["function_ordinal", "block", "operation"]);
  decimal(row.function_ordinal); uint(row.block, 0xffffffffn); uint(row.operation, 0xffffffffn); return row;
}
export function origin(value: unknown): ObservedRow {
  const row = object(value, ["availability"], ["identity", "reason"]);
  if (row.availability === "unavailable") { object(row, ["availability", "reason"]); missing(row.reason); }
  else {
    need(row.availability === "available"); object(row, ["availability", "identity"]);
    const identity = object(row.identity, ["activation", "attempt", "site"]);
    decimal(identity.activation, 1n); decimal(identity.attempt, 1n); site(identity.site);
  }
  return row;
}
export function storageIdentity(value: unknown): ObservedRow {
  const row = object(value, ["allocation", "storage_slot", "generation"]);
  for (const field of ["allocation", "storage_slot", "generation"]) decimal(row[field], 1n);
  return row;
}
export function range(value: unknown): ObservedRow {
  const row = object(value, ["byte_offset", "byte_len"]);
  need(BigInt(decimal(row.byte_offset)) + BigInt(decimal(row.byte_len, 1n)) <= OBSERVED_U64); return row;
}
export function allocationDescriptor(value: unknown): ObservedRow {
  const row = object(value, ["identity", "address_space", "access", "alignment", "byte_len", "owning_scope"], ["creation_site"]);
  storageIdentity(row.identity); enumValue(row.address_space, ["global", "constant", "private", "workgroup"]);
  enumValue(row.access, ["read_only", "write_only", "read_write"]); decimal(row.byte_len);
  const alignment = uint(row.alignment, 0xffffffffn); need(alignment > 0n && (alignment & (alignment - 1n)) === 0n);
  if (Object.hasOwn(row, "creation_site")) {
    const at = object(row.creation_site, ["function_ordinal", "block"], ["operation"]);
    decimal(at.function_ordinal); uint(at.block, 0xffffffffn); if (Object.hasOwn(at, "operation")) uint(at.operation, 0xffffffffn);
  }
  const scope = object(row.owning_scope, ["scope"], ["coordinate", "size", "count", "launch", "invocation"]);
  if (scope.scope === "dispatch") { object(scope, ["scope"]); need(["global", "constant"].includes(String(row.address_space))); }
  else if (scope.scope === "invocation") {
    object(scope, ["scope", "invocation"]); need(row.address_space === "private"); invocation(scope.invocation);
  } else {
    object(scope, ["scope", "coordinate", "size", "count", "launch"]); need(scope.scope === "workgroup" && row.address_space === "workgroup");
    const group = vector(scope.coordinate, true), size = vector(scope.size, false), count = vector(scope.count, true, true), launch = vector(scope.launch, true, true);
    for (let axis = 0; axis < 3; axis++) need(size[axis] > 0n && group[axis] < count[axis] &&
      count[axis] === (launch[axis] + size[axis] - 1n) / size[axis]);
  }
  return row;
}
export function hex(value: unknown, bytes: bigint): void {
  need(typeof value === "string" && /^0x[0-9a-f]*$/u.test(value) && BigInt(value.length) === 2n + 2n * bytes);
}
export function error(value: unknown): void {
  const row = object(value, ["stage", "code", "message", "state_changed"]);
  enumValue(row.stage, ["framing", "protocol", "session", "backend", "output"]);
  enumValue(row.code, ["invalid_json", "invalid_request", "unsupported_schema", "stale_revision", "invalid_state",
    "invalid_cursor", "resource_limit", "backend_failure", "response_too_large", "output_failure"]);
  need(row.state_changed === false && typeof row.message === "string" && row.message.length > 0 &&
    new TextEncoder().encode(row.message).byteLength <= 256 && !/[\p{Cc}\p{Cs}]/u.test(row.message));
}
