/** Closed live CPU query projection. No transport, original JSONL, source authentication or GPU. */
import type { CpuBridgeReply, CpuCommand, CpuSessionView } from "./cpu-debug-session";
import type { ResourceCheckpointObservation } from "../content/resource-checkpoint-observation";
import type { ResourceMemoryContext } from "./resource-memory-controller";
import { projectResourceCheckpointValues, type CheckpointValuesProjection } from "../content/resource-checkpoint-values";
import { projectResourceSourceValues, type ResourceSourceValuePair, type ResourceSourceValuesProjection } from "../content/resource-source-values";
import { projectResourceAccessResponse, type ResourceAccessProjection, type ResourceAccessProjectionInput } from "../content/resource-access-view";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, type ResourceMemoryProjection, type ResourceSnapshotAnchor } from "../content/resource-memory-view";

type Row = Record<string, unknown>;
export const CPU_LIVE_QUERY_LIMITS = Object.freeze({ calls: 5, responseBytes: 2 * 1024 * 1024,
  rows: 16, scanned: 64, nodes: 50_000, depth: 64, memoryBytes: 4096 });
export interface CpuLiveCheckpoint extends ResourceCheckpointObservation {
  readonly context: ResourceMemoryContext;
  readonly values: CheckpointValuesProjection;
}
export interface CpuLiveQuerySelection {
  readonly ordinal: string; readonly generation: "0";
  readonly byteOffset: string; readonly byteLength: string;
}
export interface CpuLiveQueryCollection {
  readonly status: "complete" | "selection_required" | "unavailable";
  readonly detail: string;
  readonly checkpoint: CpuLiveCheckpoint;
  readonly selection: CpuLiveQuerySelection | null;
  readonly stack: ResourceSourceValuePair | null;
  readonly source: ResourceSourceValuesProjection;
  readonly values: CheckpointValuesProjection;
  readonly allocations: ResourceAccessProjection | null;
  readonly accesses: ResourceAccessProjection | null;
  readonly memory: ResourceMemoryProjection | null;
  readonly allocationsInput: ResourceAccessProjectionInput | null;
  readonly accessesInput: ResourceAccessProjectionInput | null;
  readonly memoryInput: { readonly response: unknown; readonly expectedSnapshot: unknown } | null;
  readonly replies: readonly CpuBridgeReply[];
  readonly responseBytes: number;
}
export interface CpuLiveQueryContext {
  readonly checkpoint: CpuLiveCheckpoint;
  readonly stack: ResourceSourceValuePair | null;
  readonly inventory: ResourceAccessProjection | null;
}
export class CpuLiveQueryError extends Error {
  constructor(readonly code: "checkpoint_required" | "unsupported_metadata" | "query_shape" |
    "query_stale" | "complete_stack_required" | "inventory_selection_required" | "query_limit") {
    super("Live CPU queries are unavailable for this selection. No previous values are substituted.");
    this.name = "CpuLiveQueryError";
  }
}
function need(value: unknown, code: CpuLiveQueryError["code"] = "query_shape"): asserts value {
  if (!value) throw new CpuLiveQueryError(code);
}
function row(value: unknown): Row {
  need(value !== null && typeof value === "object" && !Array.isArray(value)); return value as Row;
}
function exact(value: unknown, fields: readonly string[]): Row {
  const data = row(value);
  need(Object.keys(data).length === fields.length && fields.every(key => Object.hasOwn(data, key)));
  return data;
}
function key(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(key).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(name => JSON.stringify(name) + ":" + key((value as Row)[name])).join(",") + "}";
  return JSON.stringify(value) ?? "undefined";
}
function same(left: unknown, right: unknown): void { need(key(left) === key(right), "query_stale"); }
export function freezeCpuQuery<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeCpuQuery); Object.freeze(value);
  }
  return value;
}
/** Exact conversion for existing presentation guards only; never rounds a u64. */
export function normalizeCpuQuery(value: unknown): unknown {
  let nodes = 0;
  const copy = (item: unknown, depth: number): unknown => {
    need(++nodes <= CPU_LIVE_QUERY_LIMITS.nodes && depth <= CPU_LIVE_QUERY_LIMITS.depth, "query_limit");
    if (typeof item === "bigint") {
      need(item >= 0n && item <= BigInt(Number.MAX_SAFE_INTEGER), "unsupported_metadata");
      return Number(item);
    }
    if (typeof item === "number") {
      need(Number.isSafeInteger(item) && item >= 0, "unsupported_metadata"); return item;
    }
    if (item === null || typeof item === "boolean" || typeof item === "string") return item;
    if (Array.isArray(item)) return item.map(child => copy(child, depth + 1));
    need(item !== null && typeof item === "object");
    const result: Row = Object.create(null) as Row;
    for (const [name, child] of Object.entries(item)) result[name] = copy(child, depth + 1);
    return result;
  };
  return freezeCpuQuery(copy(value, 0));
}
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}
function identity(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}
function decimal(value: unknown, min = 0n): bigint {
  need(typeof value === "string" && /^(0|[1-9][0-9]{0,19})$/u.test(value));
  const parsed = BigInt(value);
  need(parsed >= min && parsed <= 0xffffffffffffffffn); return parsed;
}
export function isCpuQueryOperation(operation: string): boolean {
  return ["query_allocations", "query_memory_accesses", "inspect_source_variables"].includes(operation);
}
export function cpuQueryRequestSchema(operation: string): string {
  return operation === "inspect_source_variables" ? "fe2o3-debug-source-variable-request-v2"
    : isCpuQueryOperation(operation) ? "fe2o3-debug-resource-request-v1" : "fe2o3-debug-request-v1";
}
/** Expected protocol DTO derived from the closed sent command; not original JSONL bytes. */
export function cpuQueryPair(command: CpuCommand, reply: CpuBridgeReply, previous: CpuSessionView,
  checkpoint?: CpuLiveCheckpoint): ResourceSourceValuePair {
  const request = { schema: cpuQueryRequestSchema(command.operation), request_id: BigInt(reply.sequence) + 1n,
    expected_revision: BigInt(previous.revision), ...command.body,
    ...(["query_allocations", "query_memory_accesses"].includes(command.operation)
      ? { expected_snapshot: checkpoint?.anchor } : {}) };
  return freezeCpuQuery({ requestId: Number(BigInt(reply.sequence) + 1n),
    request: normalizeCpuQuery(request), response: normalizeCpuQuery(reply.response) });
}
export function captureCpuCheckpoint(command: CpuCommand, reply: CpuBridgeReply,
  previous: CpuSessionView): CpuLiveCheckpoint | null {
  try {
    if (command.operation !== "step" || command.body.granularity !== "operation" ||
        reply.response.status !== "ok" || reply.session.state !== "stopped") return null;
    const response = row(normalizeCpuQuery(reply.response)), result = row(response.result);
    exact(result.stop, ["reason", "outcome", "exact"]);
    need(row(result.stop).reason === "step" && row(result.stop).outcome === "active" && row(result.stop).exact === true);
    const availability = exact(result.snapshot, ["status", "snapshot"]); need(availability.status === "captured");
    const snapshot = exact(availability.snapshot, ["anchor", "stop", "values"]); same(snapshot.stop, result.stop);
    const anchor = exact(snapshot.anchor, ["cursor", "scope", "site"]);
    const anchorKey = resourceSnapshotAnchorKey(anchor);
    need(anchorKey !== null && row(anchor.scope).level === "lane" && row(row(anchor.site).kir).point !== undefined);
    need(row(row(row(anchor.site).kir).point).kind === "operation" && integer(row(anchor.cursor).event_sequence, 1));
    same(anchor.cursor, response.session && row(response.session).cursor);
    const pair = cpuQueryPair(command, reply, previous);
    const base: ResourceCheckpointObservation = { anchor: anchor as unknown as ResourceSnapshotAnchor,
      anchorKey, control: { kind: "checkpoint", ...pair } };
    const values = projectResourceCheckpointValues(base);
    need(values.status === "ready", "checkpoint_required");
    return freezeCpuQuery({ ...base, values, context: { connectionId: reply.connectionId,
      captureIdentity: reply.session.configuration_identity, target: null, variantIdentity: null } });
  } catch { return null; }
}
export function validateCpuStack(checkpoint: CpuLiveCheckpoint, pair: ResourceSourceValuePair): void {
  const response = row(pair.response), request = row(pair.request);
  need(response.status === "ok", "complete_stack_required");
  same(response.session, row(checkpoint.control.response).session);
  exact(request, ["schema", "request_id", "expected_revision", "operation", "scope", "page"]);
  same(request.scope, { level: "dispatch" }); same(request.page, { limit: 16 });
  exact(response, ["schema", "status", "request_id", "operation", "session", "result"]);
  const availableResult = row(response.result);
  need(!Object.hasOwn(availableResult, "next_cursor"), "complete_stack_required");
  const result = exact(availableResult, ["result", "snapshot", "frames"]);
  need(result.result === "stack"); same(result.snapshot, checkpoint.anchor);
  need(Array.isArray(result.frames) && result.frames.length === 1, "complete_stack_required");
  need(Object.hasOwn(row(result.frames[0]), "next_operation"), "complete_stack_required");
  const frame = exact(result.frames[0], ["frame", "function_ordinal", "block_ordinal", "next_operation", "values"]);
  const site = checkpoint.anchor.site;
  need(site && frame.frame === 1 && frame.function_ordinal === site.kir.function_ordinal &&
    frame.block_ordinal === site.kir.block_ordinal && integer(frame.next_operation), "complete_stack_required");
  need(row(frame.values).status === "captured", "complete_stack_required");
  const values = exact(frame.values, ["status", "value_count"]);
  need(values.status === "captured" && checkpoint.values.status === "ready" &&
    values.value_count === checkpoint.values.rows.length &&
    checkpoint.values.rows.every(value => value.frame === "1" && value.functionOrdinal === String(frame.function_ordinal)),
  "complete_stack_required");
}
export function cpuResourceInput(checkpoint: CpuLiveCheckpoint, pair: ResourceSourceValuePair): ResourceAccessProjectionInput {
  return freezeCpuQuery({ response: pair.response, expectedSnapshot: checkpoint.anchor, expectedRequest: pair.request,
    context: checkpoint.context, responseContext: checkpoint.context });
}
function acceptedProjection(projection: ResourceAccessProjection): void {
  need(projection.status !== "invalid" && projection.status !== "stale" && projection.status !== "unsupported");
}
export function cpuResourceProjection(checkpoint: CpuLiveCheckpoint, pair: ResourceSourceValuePair): ResourceAccessProjection {
  const response = row(pair.response);
  if (response.status === "error") validateError(response.error);
  const result = projectResourceAccessResponse(cpuResourceInput(checkpoint, pair)); acceptedProjection(result); return result;
}
function validateError(value: unknown): void {
  const error = exact(value, ["stage", "code", "message", "state_changed"]);
  need(error.state_changed === false && typeof error.stage === "string" &&
    ["framing", "protocol", "session", "backend", "output"].includes(error.stage) &&
    typeof error.code === "string" && ["invalid_json", "invalid_request", "unsupported_schema", "stale_revision",
      "invalid_state", "invalid_cursor", "resource_limit", "backend_failure", "response_too_large", "output_failure"].includes(error.code) &&
    typeof error.message === "string" && error.message.length > 0 &&
    new TextEncoder().encode(error.message).byteLength <= 256 && !/[\p{Cc}\p{Cs}]/u.test(error.message));
}
export function cpuSourceProjection(context: CpuLiveQueryContext, pair: ResourceSourceValuePair): ResourceSourceValuesProjection {
  need(context.stack !== null, "complete_stack_required"); validateCpuStack(context.checkpoint, context.stack);
  const response = row(pair.response);
  same(response.session, row(context.checkpoint.control.response).session);
  if (response.status === "unavailable") {
    exact(response, ["schema", "status", "request_id", "operation", "session", "reason"]);
    need(typeof response.reason === "string" &&
      ["source_map_v2_required", "variables_not_captured", "outside_capture_scope", "checkpoint_not_captured",
        "frame_unavailable", "name_not_in_scope"].includes(response.reason));
    return { status: "unavailable", detail: "Source variables unavailable: " + String(response.reason) + "." };
  }
  if (response.status === "error") {
    exact(response, ["schema", "status", "request_id", "operation", "session", "error"]); validateError(response.error);
    return { status: "unavailable", detail: "The source-variable query was refused; no values are substituted." };
  }
  exact(response, ["schema", "status", "request_id", "operation", "session", "snapshot", "values",
    ...(Object.hasOwn(response, "next_cursor") ? ["next_cursor"] : [])]);
  need(response.status === "ok" && Array.isArray(response.values) && response.values.length <= 16);
  same(response.snapshot, { ...context.checkpoint.anchor, frame: 1, occurrence: 1 });
  if (Object.hasOwn(response, "next_cursor")) {
    const cursor = exact(response.next_cursor, ["query_identity", "position"]);
    need(identity(cursor.query_identity) && cursor.position === 16 && response.values.length === 16);
    return { status: "unsupported", detail: "Source-variable results need another page; this live profile never follows cursors or displays a partial table." };
  }
  const projected = projectResourceSourceValues(context.checkpoint, context.stack, [pair]);
  need(projected.status !== "invalid" && projected.status !== "stale");
  return projected;
}
export function validateCpuQueryReply(command: CpuCommand, reply: CpuBridgeReply, previous: CpuSessionView,
  context: CpuLiveQueryContext): void {
  same(normalizeCpuQuery(reply.response.session), row(context.checkpoint.control.response).session);
  const pair = cpuQueryPair(command, reply, previous, context.checkpoint);
  if (command.operation === "inspect_source_variables") cpuSourceProjection(context, pair);
  else cpuResourceProjection(context.checkpoint, pair);
}
export function validateCpuQuerySelection(selection: CpuLiveQuerySelection): CpuLiveQuerySelection {
  exact(selection, ["ordinal", "generation", "byteOffset", "byteLength"]);
  const ordinal = decimal(selection.ordinal, 1n), offset = decimal(selection.byteOffset), length = decimal(selection.byteLength, 1n);
  need(selection.generation === "0" && ordinal <= BigInt(Number.MAX_SAFE_INTEGER) &&
    offset + length <= BigInt(Number.MAX_SAFE_INTEGER) && length <= 4096n, "unsupported_metadata");
  return freezeCpuQuery({ ...selection });
}
export function selectCpuInventory(inventory: ResourceAccessProjection | null, ordinal: string,
  selection?: CpuLiveQuerySelection): void {
  need(inventory?.status === "ready" && inventory.kind === "allocations", "inventory_selection_required");
  const selected = inventory.rows.find(item => String(item.allocation.ordinal) === ordinal && item.allocation.generation === 0);
  need(selected && selected.address_space === "global", "inventory_selection_required");
  if (selection) need(decimal(selection.byteOffset) + decimal(selection.byteLength, 1n) <= BigInt(selected.capacity_bytes),
    "inventory_selection_required");
}
export function emptyCpuSource(): ResourceSourceValuesProjection {
  return { status: "unavailable", detail: "A complete current one-frame stack and source-variable response are required." };
}
export async function collectCpuQueries(
  checkpoint: CpuLiveCheckpoint,
  selection: CpuLiveQuerySelection | undefined,
  send: (command: string) => Promise<CpuBridgeReply>,
  current: () => boolean,
  parse: (command: string) => CpuCommand,
): Promise<CpuLiveQueryCollection> {
  const selected = selection === undefined ? undefined : validateCpuQuerySelection(selection);
  const replies: CpuBridgeReply[] = [];
  let responseBytes = 0;
  const receive = async (text: string): Promise<{ reply: CpuBridgeReply; pair: ResourceSourceValuePair }> => {
    need(current() && replies.length < CPU_LIVE_QUERY_LIMITS.calls, "query_stale");
    const reply = await send(text); need(current(), "query_stale");
    need(integer(reply.responseBytes, 1)); responseBytes += reply.responseBytes;
    need(responseBytes <= CPU_LIVE_QUERY_LIMITS.responseBytes, "query_limit"); replies.push(reply);
    // All collection calls are read-only and retain the selected checkpoint session.
    const previous = { ...reply.session };
    const command = parse(text);
    return { reply, pair: cpuQueryPair(command, reply, previous, checkpoint) };
  };
  let stack: ResourceSourceValuePair | null = null, source = emptyCpuSource();
  const stackReply = await receive("stack");
  if (stackReply.reply.response.status === "ok") {
    try { validateCpuStack(checkpoint, stackReply.pair); stack = stackReply.pair; }
    catch (error) {
      if (!(error instanceof CpuLiveQueryError) || error.code !== "complete_stack_required") throw error;
    }
  }
  if (stack !== null) {
    const variables = await receive("variables 1");
    source = cpuSourceProjection({ checkpoint, stack, inventory: null }, variables.pair);
  }
  const allocationsReply = await receive("allocations");
  const allocationsInput = cpuResourceInput(checkpoint, allocationsReply.pair);
  const allocations = cpuResourceProjection(checkpoint, allocationsReply.pair);
  let accesses: ResourceAccessProjection | null = null, memory: ResourceMemoryProjection | null = null;
  let accessesInput: ResourceAccessProjectionInput | null = null;
  let memoryInput: CpuLiveQueryCollection["memoryInput"] = null;
  if (selected && allocations.status === "ready") {
    selectCpuInventory(allocations, selected.ordinal, selected);
    const accessReply = await receive("accesses " + selected.ordinal + " 0");
    accessesInput = cpuResourceInput(checkpoint, accessReply.pair);
    accesses = cpuResourceProjection(checkpoint, accessReply.pair);
    const memoryReply = await receive("memory " + selected.ordinal + " 0 " + selected.byteOffset + " " + selected.byteLength);
    memoryInput = freezeCpuQuery({ response: memoryReply.pair.response, expectedSnapshot: checkpoint.anchor });
    if (memoryReply.reply.response.status === "error") {
      validateError(memoryReply.reply.response.error);
      memory = { status: "unavailable", detail: "The memory query was refused; no bytes are substituted." };
      memoryInput = null;
    } else {
      memory = projectResourceMemoryResponse(memoryInput.response, memoryInput.expectedSnapshot);
      need(memory.status !== "invalid" && memory.status !== "stale");
    }
  }
  need(current(), "query_stale");
  const status = !selected && allocations.status === "ready" ? "selection_required"
    : selected && source.status === "ready" && allocations.status === "ready" &&
      accesses?.status === "ready" && memory?.status === "ready" ? "complete" : "unavailable";
  return freezeCpuQuery({ status, detail: status === "selection_required"
    ? "Select an allocation from this current first inventory page and explicitly refresh. No paging is performed."
    : status === "complete" ? "Bounded CPU-only queries at one exact checkpoint; no physical-register or lifetime proof."
      : "Some current query data is unavailable or outside this bounded profile; no earlier values are substituted.",
    checkpoint, selection: selected ?? null, stack, source, values: checkpoint.values, allocations, accesses, memory,
    allocationsInput, accessesInput, memoryInput, replies, responseBytes });
}
