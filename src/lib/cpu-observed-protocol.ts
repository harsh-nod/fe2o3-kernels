/** Versioned observed-query command and reply contract, separate from legacy V1. */
import type { CpuBridgeReply, CpuCommand, CpuSessionView } from "./cpu-debug-session";
import { allocationDescriptor, binding, completeness, coverage, decimal, enumValue, error, frozen, hex,
  invocation, missing, need, object, origin, owner, range, same, site, stable, storageIdentity, uint, vector,
  type ObservedRow } from "./cpu-observed-validation";
export interface CpuObservedContext {
  readonly owner: ObservedRow | null;
  readonly runtime: CpuBridgeReply | null;
  readonly inventory: CpuBridgeReply | null;
}
const COMMANDS = ["runtime", "storage", "lifecycle", "storageaccess", "storagememory"] as const;
export function isCpuObservedCommand(command: CpuCommand): boolean {
  return COMMANDS.includes(command.text.split(" ")[0] as typeof COMMANDS[number]);
}
export function parseCpuObservedCommand(text: string): CpuCommand | null {
  const [name, ...args] = text.split(" ");
  if (!COMMANDS.includes(name as typeof COMMANDS[number])) return null;
  let body: ObservedRow;
  if (["runtime", "storage", "lifecycle"].includes(name)) {
    need(args.length === 0);
    const operation = name === "runtime" ? "inspect_current_record" :
      name === "storage" ? "query_allocations" : "query_allocation_lifecycle";
    body = { operation, ...(name === "runtime" ? {} : { page: { max_items: 16, max_scanned: 64 } }) };
  } else {
    need(args.length === (name === "storageaccess" ? 3 : 5));
    const allocation = { allocation: decimal(args[0], 1n), storage_slot: decimal(args[1], 1n), generation: decimal(args[2], 1n) };
    body = { operation: name === "storageaccess" ? "query_memory_accesses" : "read_allocation_memory", allocation };
    if (name === "storageaccess") body.page = { max_items: 16, max_scanned: 64 };
    else {
      const selected = { byte_offset: decimal(args[3]), byte_len: decimal(args[4], 1n) };
      range(selected); need(BigInt(selected.byte_len) <= 4096n); body.range = selected;
    }
  }
  return frozen({ text, operation: String(body.operation), body });
}
export function observedInventoryRows(reply: CpuBridgeReply | null): ObservedRow[] {
  if (reply?.response.status !== "ok") return [];
  const result = object(reply.response.result, ["result", "allocations"]);
  need(result.result === "allocations" && Array.isArray(result.allocations));
  return result.allocations as ObservedRow[];
}
export function requireObservedSelection(command: CpuCommand, context: CpuObservedContext): void {
  if (command.text === "runtime") return;
  need(context.runtime?.response.status === "ok");
  const watermark = object(context.runtime.response.allocation_watermark, ["availability"], ["through_sequence", "reason"]);
  need(watermark.availability === "available");
  if (command.text === "storage" || command.text === "lifecycle") return;
  const selected = selectedStorage(command, context);
  if (command.operation === "read_allocation_memory") {
    need(selected.snapshot_bytes_available === true && selected.initialization_available === true);
    const selectedRange = range(command.body.range), descriptor = allocationDescriptor(selected.descriptor);
    need(BigInt(decimal(selectedRange.byte_offset)) + BigInt(decimal(selectedRange.byte_len, 1n)) <= BigInt(decimal(descriptor.byte_len)));
  }
}
function selectedStorage(command: CpuCommand, context: CpuObservedContext): ObservedRow {
  const selected = observedInventoryRows(context.inventory).find(row =>
    stable(allocationDescriptor(row.descriptor).identity) === stable(command.body.allocation));
  need(selected); return selected;
}
function selectedDescriptor(command: CpuCommand, context: CpuObservedContext): ObservedRow {
  return allocationDescriptor(selectedStorage(command, context).descriptor);
}
function withinDescriptor(value: unknown, descriptor: ObservedRow): void {
  const selected = range(value);
  need(BigInt(decimal(selected.byte_offset)) + BigInt(decimal(selected.byte_len, 1n)) <= BigInt(decimal(descriptor.byte_len)));
}
function validateLifecycle(rows: unknown[]): void {
  // This page is a literal prefix beginning at sequence 1, so predecessor and
  // live-slot checks can use only these rows; no token or inferred history.
  const live = new Map<string, ObservedRow>(), all = new Map<string, ObservedRow>(),
    slots = new Map<string, string>(), released = new Set<string>();
  let lastCreation = 0n;
  for (const [index, item] of rows.entries()) {
    const transition = object(item, ["sequence", "descriptor", "kind"]),
      descriptor = allocationDescriptor(transition.descriptor), identity = storageIdentity(descriptor.identity),
      allocation = decimal(identity.allocation, 1n), slot = decimal(identity.storage_slot, 1n),
      generation = BigInt(decimal(identity.generation, 1n)),
      scope = object(descriptor.owning_scope, ["scope"], ["coordinate", "size", "count", "launch", "invocation"]),
      kind = object(transition.kind, ["transition"], ["previous_allocation"]);
    need(BigInt(decimal(transition.sequence, 1n)) === BigInt(index + 1));
    if (kind.transition === "release") {
      object(kind, ["transition"]);
      need(live.has(allocation) && slots.get(slot) === allocation); same(live.get(allocation), descriptor);
      live.delete(allocation); released.add(allocation); continue;
    }
    need(!all.has(allocation) && BigInt(allocation) > lastCreation);
    lastCreation = BigInt(allocation);
    if (kind.transition === "preexisting") {
      object(kind, ["transition"]);
      need(scope.scope === "dispatch" && !Object.hasOwn(descriptor, "creation_site") &&
        generation === 1n && !slots.has(slot));
    } else {
      need(kind.transition === "create" && scope.scope !== "dispatch" && Object.hasOwn(descriptor, "creation_site"));
      if (Object.hasOwn(kind, "previous_allocation")) {
        const predecessor = decimal(kind.previous_allocation, 1n), prior = all.get(predecessor);
        need(prior && released.has(predecessor) && slots.get(slot) === predecessor);
        const previousIdentity = storageIdentity(prior.identity);
        need(previousIdentity.storage_slot === slot && generation === BigInt(decimal(previousIdentity.generation, 1n)) + 1n);
        for (const field of ["address_space", "access", "alignment", "byte_len"]) same(descriptor[field], prior[field]);
      } else need(generation === 1n && !slots.has(slot));
    }
    need(!slots.has(slot) || released.has(slots.get(slot)!));
    live.set(allocation, descriptor); all.set(allocation, descriptor); slots.set(slot, allocation);
  }
}
function frameRows(value: unknown): ObservedRow[] | null {
  const container = object(value, ["availability"], ["frames", "reason"]);
  if (container.availability === "unavailable") { object(container, ["availability", "reason"]); missing(container.reason); return null; }
  need(container.availability === "captured"); object(container, ["availability", "frames"]);
  need(Array.isArray(container.frames) && container.frames.length > 0 && container.frames.length <= 64);
  const rows: ObservedRow[] = [], activations = new Set<string>();
  for (const [index, value] of container.frames.entries()) {
    const row = object(value, ["legacy_depth", "function_ordinal", "block", "activation", "operation", "parent"], ["next_operation"]);
    need(uint(row.legacy_depth, 4095n) === BigInt(index)); decimal(row.function_ordinal); uint(row.block, 0xffffffffn);
    if (Object.hasOwn(row, "next_operation")) uint(row.next_operation, 0xffffffffn);
    const activation = decimal(row.activation, 1n); need(!activations.has(activation)); activations.add(activation);
    const operation = object(row.operation, ["state"], ["attempt", "site"]);
    if (operation.state === "ready") object(operation, ["state"]);
    else { object(operation, ["state", "attempt", "site"]); enumValue(operation.state, ["active_operation", "suspended"]);
      decimal(operation.attempt, 1n); need(site(operation.site).function_ordinal === row.function_ordinal); }
    const parent = object(row.parent, ["parent"], ["activation", "attempt", "call_site"]);
    if (index === 0) { object(parent, ["parent"]); need(parent.parent === "root"); }
    else {
      object(parent, ["parent", "activation", "attempt", "call_site"]); need(parent.parent === "caller");
      decimal(parent.activation, 1n); decimal(parent.attempt, 1n); site(parent.call_site);
      const caller = rows[index - 1], suspended = object(caller.operation, ["state", "attempt", "site"]);
      need(parent.activation === caller.activation && BigInt(String(parent.activation)) < BigInt(activation) &&
        suspended.state === "suspended"); same(parent.attempt, suspended.attempt); same(parent.call_site, suspended.site);
    }
    if (index + 1 < container.frames.length) need(operation.state === "suspended");
    rows.push(row);
  }
  return rows;
}
export function observedFrames(reply: CpuBridgeReply): ObservedRow[] {
  return reply.response.status === "ok" ? frameRows(reply.response.frames) ?? [] : [];
}
function sessionCursor(view: CpuSessionView): ObservedRow {
  return { configuration_identity: view.cursor.configuration_identity,
    event_sequence: BigInt(view.cursor.event_sequence), state_revision: BigInt(view.cursor.state_revision) };
}
function validateRuntime(row: ObservedRow, current: CpuSessionView, context: CpuObservedContext): void {
  if (row.status === "error") { object(row, ["schema", "status", "request_id", "session", "error"]); error(row.error); return; }
  if (row.status === "unavailable") {
    object(row, ["schema", "status", "request_id", "session", "completeness", "reason"], ["binding"]);
    missing(row.reason); completeness(row.completeness);
    if (Object.hasOwn(row, "binding")) {
      const bound = binding(row.binding); same(bound.cursor, sessionCursor(current));
      if (context.owner) same(bound.owner, context.owner);
    } else need(context.owner === null && row.reason === "not_requested");
    return;
  }
  object(row, ["schema", "status", "request_id", "session", "binding", "invocation", "origin", "frames",
    "allocation_watermark", "completeness", "origin_coverage", "frame_coverage", "lifecycle_coverage"]);
  need(row.status === "ok");
  const bound = binding(row.binding), event = BigInt(current.cursor.event_sequence);
  need(event > 0n); same(bound.cursor, sessionCursor(current));
  if (context.owner) same(bound.owner, context.owner);
  invocation(row.invocation); const observedOrigin = origin(row.origin), frames = frameRows(row.frames);
  const watermark = object(row.allocation_watermark, ["availability"], ["through_sequence", "reason"]);
  if (watermark.availability === "available") { object(watermark, ["availability", "through_sequence"]); decimal(watermark.through_sequence); }
  else { object(watermark, ["availability", "reason"]); need(watermark.availability === "unavailable"); missing(watermark.reason); }
  completeness(row.completeness, event);
  coverage(row.origin_coverage, observedOrigin.availability === "available", event);
  coverage(row.frame_coverage, frames !== null, event);
  coverage(row.lifecycle_coverage, watermark.availability === "available", event);
  if (observedOrigin.availability === "available" && frames) {
    const top = frames.at(-1)!, identity = object(observedOrigin.identity, ["activation", "attempt", "site"]),
      operation = object(top.operation, ["state", "attempt", "site"]);
    need(operation.state === "active_operation" && top.activation === identity.activation);
    same(operation.attempt, identity.attempt); same(operation.site, identity.site);
  }
}
function validatePage(value: unknown, count: number): ObservedRow {
  const page = object(value, ["source_count", "source_start", "scanned"], ["next_token"]);
  const total = BigInt(decimal(page.source_count)), start = BigInt(decimal(page.source_start)), scanned = uint(page.scanned, 64n);
  need(start === 0n && count <= 16 && BigInt(count) <= scanned && scanned <= total &&
    (scanned > 0n || total === 0n));
  if (Object.hasOwn(page, "next_token")) {
    need(typeof page.next_token === "string" && /^[a-zA-Z0-9_.-]{1,128}$/u.test(page.next_token) && scanned < total);
  } else need(scanned === total);
  return page;
}
function validateAccess(value: unknown): ObservedRow {
  const row = object(value, ["occurrence", "invocation", "allocation", "range", "address_space", "access", "origin"]);
  const full = invocation(row.invocation); storageIdentity(row.allocation); range(row.range);
  enumValue(row.address_space, ["private", "workgroup", "global", "constant", "generic"]);
  enumValue(row.access, ["read", "write_committed", "atomic_read", "atomic_write_committed", "atomic_read_write_committed"]);
  const occurrence = object(row.occurrence, ["record_ordinal", "event_sequence", "scope", "site", "schedule"]);
  need(uint(occurrence.record_ordinal) + 1n === uint(occurrence.event_sequence));
  const scope = object(occurrence.scope, ["level", "workgroup", "wave", "lane", "logical_workitem", "active_mask", "wave_width", "interpretation"]);
  need(scope.level === "lane" && scope.interpretation === "logical_visualization");
  const width = uint(scope.wave_width, 64n), lane = uint(scope.lane, 63n), wave = uint(scope.wave, 0xffffffffn), mask = uint(scope.active_mask);
  need((width === 32n || width === 64n) && lane < width && (mask >> width) === 0n && (mask & (1n << lane)) !== 0n);
  const group = vector(scope.workgroup, false);
  need(Array.isArray(scope.logical_workitem) && scope.logical_workitem.length === 3);
  const global = scope.logical_workitem.map(v => uint(v));
  same(group, vector(full.workgroup, true)); same(global, vector(full.global, true));
  const [x, y, z] = vector(full.local, false), [sx, sy] = vector(full.workgroup_size, false);
  const flattened = (z * sy + y) * sx + x; need(flattened / width === wave && flattened % width === lane);
  const at = object(occurrence.site, ["function_ordinal", "block_ordinal", "point"]),
    point = object(at.point, ["kind", "operation_ordinal"]); need(point.kind === "operation");
  uint(at.function_ordinal); uint(at.block_ordinal); uint(point.operation_ordinal);
  const schedule = object(occurrence.schedule, ["identity", "decision_ordinal"]);
  enumValue(schedule.identity, ["workgroup_major_local_zyx_serial_v1", "workgroup_major_local_zyx_cooperative_v1", "workgroup_major_seeded_runnable_cooperative_v1"]);
  uint(schedule.decision_ordinal);
  const observed = origin(row.origin);
  if (observed.availability === "available") {
    const identity = object(observed.identity, ["activation", "attempt", "site"]), operation = site(identity.site);
    need(BigInt(String(operation.function_ordinal)) === uint(at.function_ordinal) && uint(operation.operation) === uint(point.operation_ordinal));
  }
  return row;
}
function validateResource(row: ObservedRow, command: CpuCommand, current: CpuSessionView, context: CpuObservedContext): void {
  if (row.status === "error") { object(row, ["schema", "status", "request_id", "operation", "session", "error"]); error(row.error); return; }
  need(context.runtime?.response.status === "ok");
  const expected = binding(context.runtime.response.binding), actual = binding(row.binding);
  same(actual, expected); same(actual.cursor, sessionCursor(current));
  same(row.completeness, context.runtime.response.completeness);
  if (row.status === "unavailable") {
    object(row, ["schema", "status", "request_id", "operation", "session", "binding", "completeness", "reason"]);
    missing(row.reason); completeness(row.completeness); return;
  }
  object(row, ["schema", "status", "request_id", "operation", "session", "binding", "through_sequence", "completeness", "result"], ["page"]);
  need(row.status === "ok"); completeness(row.completeness, BigInt(current.cursor.event_sequence));
  const through = BigInt(decimal(row.through_sequence)),
    watermark = object(context.runtime.response.allocation_watermark, ["availability", "through_sequence"]);
  need(watermark.availability === "available" && decimal(watermark.through_sequence) === row.through_sequence);
  const result = object(row.result, ["result"], ["allocations", "transitions", "accesses", "memory"]);
  if (command.text === "storage") {
    object(result, ["result", "allocations"]); need(result.result === "allocations" && Array.isArray(result.allocations));
    validatePage(row.page, result.allocations.length); const ids = new Set<string>(), slots = new Set<string>();
    for (const item of result.allocations) {
      const entry = object(item, ["descriptor", "snapshot_bytes_available", "initialization_available"]), descriptor = allocationDescriptor(entry.descriptor),
        id = storageIdentity(descriptor.identity);
      need(typeof entry.snapshot_bytes_available === "boolean" && entry.snapshot_bytes_available === entry.initialization_available);
      need(through > 0n && !ids.has(String(id.allocation)) && !slots.has(String(id.storage_slot)));
      ids.add(String(id.allocation)); slots.add(String(id.storage_slot));
    }
  } else if (command.text === "lifecycle") {
    object(result, ["result", "transitions"]); need(result.result === "allocation_lifecycle" && Array.isArray(result.transitions));
    const page = validatePage(row.page, result.transitions.length); need(BigInt(decimal(page.source_count)) === through && uint(page.scanned) === BigInt(result.transitions.length));
    validateLifecycle(result.transitions);
  } else if (command.operation === "query_memory_accesses") {
    object(result, ["result", "accesses"]); need(result.result === "memory_accesses" && Array.isArray(result.accesses));
    const page = validatePage(row.page, result.accesses.length); need(BigInt(decimal(page.source_count)) <= BigInt(current.cursor.event_sequence));
    const descriptor = selectedDescriptor(command, context);
    let previous = 0n;
    for (const item of result.accesses) {
      const access = validateAccess(item), occurrence = object(access.occurrence, ["record_ordinal", "event_sequence", "scope", "site", "schedule"]),
        sequence = uint(occurrence.event_sequence); same(access.allocation, command.body.allocation);
      need(access.address_space === descriptor.address_space); withinDescriptor(access.range, descriptor);
      need(sequence > previous && sequence <= uint(page.scanned) && through > 0n); previous = sequence;
    }
  } else {
    need(!Object.hasOwn(row, "page")); object(result, ["result", "memory"]); need(result.result === "allocation_memory" && through > 0n);
    const memory = object(result.memory, ["allocation", "range", "address_space", "bytes", "initialized"]);
    storageIdentity(memory.allocation); same(memory.allocation, command.body.allocation);
    const selected = range(memory.range); same(selected, command.body.range);
    const storage = selectedStorage(command, context), descriptor = allocationDescriptor(storage.descriptor);
    need(storage.snapshot_bytes_available === true && storage.initialization_available === true &&
      memory.address_space === descriptor.address_space);
    withinDescriptor(selected, descriptor);
    const count = BigInt(decimal(selected.byte_len, 1n)); need(count <= 4096n);
    hex(memory.bytes, count); hex(memory.initialized, (count + 7n) / 8n);
    if (count % 8n) need((BigInt("0x" + String(memory.initialized).slice(-2)) >> (count % 8n)) === 0n);
  }
}
export function validateCpuObservedReply(command: CpuCommand, reply: CpuBridgeReply, previous: CpuSessionView,
  context: CpuObservedContext): void {
  const parsed = parseCpuObservedCommand(command.text); need(parsed); same(parsed.body, command.body); need(parsed.operation === command.operation);
  same(reply.session, previous);
  const row = reply.response as ObservedRow;
  need(row.schema === (command.text === "runtime" ? "fe2o3-debug-runtime-observation-response-v1" : "fe2o3-debug-resource-response-v2"));
  need(uint(row.request_id) === BigInt(reply.sequence) + 1n);
  if (command.text === "runtime") validateRuntime(row, previous, context);
  else { need(row.operation === command.operation); validateResource(row, command, previous, context); }
}
export function observedOwner(reply: CpuBridgeReply): ObservedRow | null {
  return Object.hasOwn(reply.response, "binding") ? owner(binding(reply.response.binding).owner) : null;
}
