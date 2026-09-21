/** Local read-only presentation of existing public JSONL pairs, not capture
 * admission, a protocol implementation, producer authentication or live control. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { readResourceImportFile, ResourceImportError } from "./recorded-resource-import";
import { projectResourceAccessResponse, type ResourceAllocationRow } from "./resource-access-view";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey,
  type ResourceCursor, type ResourceMemoryProjection, type ResourceSnapshotAnchor } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export const WATCHPOINT_IMPORT_LIMITS = Object.freeze({ fileBytes: 256 * 1024, lineBytes: 64 * 1024, pairs: 7 });
type Row = Record<string, unknown>;
type Frozen<T> = T extends readonly (infer Item)[] ? readonly Frozen<Item>[] :
  T extends object ? { readonly [Key in keyof T]: Frozen<T[Key]> } : T;
type Role = "initial" | "inventory" | "registration" | "listing" | "stop" | "checkpoint" | "memory";
type Pair = { role: Role; requestId: number; line: number; request: unknown; response: unknown;
  requestUtf8: string; responseUtf8: string };
type Spec = { client_label: "source-first-write"; enabled: true; allocation: { ordinal: number; generation: 0 };
  byte_offset: 0; byte_len: 4; access: "write"; timing: "after_commit" };
type ReadyMemory = Extract<ResourceMemoryProjection, { status: "ready" }>;
export type RecordedWatchpointPair = Frozen<Pair>;
type ObservationData = {
  requestSha256: string; responseSha256: string; requestBytes: number; responseBytes: number;
  context: ResourceMemoryContext; pairs: Pair[];
  initial: { pair: Pair; anchor: ResourceSnapshotAnchor; anchorKey: string };
  registration: { pair: Pair; listingPair: Pair; watchpointId: number; spec: Spec; inventoryRow: ResourceAllocationRow };
  stop: { pair: Pair; cursor: ResourceCursor; reason: "watchpoint"; watchpointId: number;
    outcome: "active"; exact: true; eventsAdvanced: number;
    snapshot: { status: "unavailable"; reason: "not_captured" };
    origin: { status: "unavailable"; reason: "not_captured" } };
  checkpoint: { pair: Pair; anchor: ResourceSnapshotAnchor; anchorKey: string; values: unknown[] };
  memory: { pair: Pair; projection: ReadyMemory; belongsTo: "later_checkpoint_only" };
  provenance: { kind: "caller_supplied_unverified"; sourceAuthentication: false;
    hardwareObserved: false; performancePrediction: false };
};
export type RecordedWatchpointObservation = Frozen<ObservationData>;
export class RecordedWatchpointImportError extends Error {
  constructor(readonly code: string, detail: string) {
    super(code + ": " + detail); this.name = "RecordedWatchpointImportError";
  }
}
function need(ok: unknown, code: string, detail: string): asserts ok {
  if (!ok) throw new RecordedWatchpointImportError(code, detail);
}
function exact(value: unknown, keys: string[]): Row {
  need(value && typeof value === "object" && !Array.isArray(value), "shape", "Expected an object.");
  const row = value as Row;
  need(Object.keys(row).length === keys.length && keys.every(key => Object.hasOwn(row, key)),
    "fields", "Missing or unsupported fields in this presentation subset.");
  return row;
}
function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function key(value: unknown): string {
  if (typeof value === "bigint") return "u64:" + value;
  if (Array.isArray(value)) return "[" + value.map(key).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(name => JSON.stringify(name) + ":" + key((value as Row)[name])).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function equal(a: unknown, b: unknown, code: string): void {
  need(key(a) === key(b), code, "Retained identities or fields do not agree.");
}
function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Local watchpoint import cancelled.", "AbortError");
}
function frozen<T>(value: T): Frozen<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(frozen); Object.freeze(value);
  }
  return value as Frozen<T>;
}
function lines(raw: string) {
  need(typeof raw === "string" && raw.length > 0 && raw.length <= WATCHPOINT_IMPORT_LIMITS.fileBytes,
    "file_limit", "Use a nonempty file of at most 256 KiB.");
  const bytes = new TextEncoder().encode(raw).byteLength;
  need(bytes <= WATCHPOINT_IMPORT_LIMITS.fileBytes, "file_limit", "Each file must be at most 256 KiB.");
  need(raw.endsWith("\n") && !raw.includes("\r") && raw.charCodeAt(0) !== 0xfeff,
    "jsonl", "Use UTF-8 JSONL with LF endings, final LF and no BOM.");
  const source = raw.slice(0, -1).split("\n");
  need(source.length === 7 && source.every(line => line.trim()), "pair_count", "Retain exactly the seven supported pairs.");
  const rows = source.map(line => {
    try {
      const value: unknown = parseProgramJson(line, WATCHPOINT_IMPORT_LIMITS.lineBytes);
      need(value && typeof value === "object" && !Array.isArray(value), "shape", "Each line must be an object.");
      return value as Row;
    } catch (error) {
      if (error instanceof RecordedWatchpointImportError) throw error;
      throw new RecordedWatchpointImportError("json", "Malformed, duplicate-key, overlarge or unsupported JSON.");
    }
  });
  return { bytes, rows, raw: source.map(line => line + "\n") };
}
function session(value: unknown): ResourceCursor {
  const data = exact(value, ["backend", "execution_kind", "state", "revision", "configuration_identity",
    "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  const cursor = exact(data.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
  need(data.backend === "cpu_kir_simulator" && data.execution_kind === "cpu_kir_simulation" &&
    data.state === "stopped" && data.simulated === true && data.hardware_observed === false &&
    data.performance_prediction === false, "session", "Only stopped recorded CPU sessions are supported.");
  need(typeof data.configuration_identity === "string" && /^[0-9a-f]{64}$/u.test(data.configuration_identity) &&
    !/^0+$/u.test(data.configuration_identity) && cursor.configuration_identity === data.configuration_identity &&
    integer(data.revision) && cursor.state_revision === data.revision && integer(cursor.event_sequence),
  "session", "The session and cursor must have exact, consistent metadata.");
  return cursor as unknown as ResourceCursor;
}
function controlRequest(request: Row, operation: string, extra: string[]): void {
  exact(request, ["schema", "request_id", "expected_revision", "operation", ...extra]);
  need(request.schema === "fe2o3-debug-request-v1" && request.operation === operation &&
    integer(request.expected_revision, 0, Number.MAX_SAFE_INTEGER - 1), "request", "Unsupported control request.");
}
function responseControl(response: Row): void {
  exact(response, ["schema", "status", "request_id", "operation", "session", "result"]);
  need(response.schema === "fe2o3-debug-response-v1", "response", "Expected a recorded debugger V1 response.");
}
function advance(request: Row, next: ResourceCursor, previous: ResourceCursor, mutation: boolean): void {
  need(request.expected_revision === previous.state_revision &&
    next.configuration_identity === previous.configuration_identity &&
    next.state_revision === previous.state_revision + (mutation ? 1 : 0), "stale", "Request/revision/configuration chain differs.");
  if (!mutation) equal(next, previous, "stale");
}
function checkpoint(request: Row, response: Row, cursor: ResourceCursor) {
  controlRequest(request, "step", ["direction", "granularity", "count"]); responseControl(response);
  need(request.direction === "forward" && request.granularity === "operation" && request.count === 1 &&
    cursor.state_revision === Number(request.expected_revision) + 1, "checkpoint", "Require one recorded forward operation step.");
  const result = exact(response.result, ["result", "stop", "snapshot", "events_advanced"]);
  equal(result.stop, { reason: "step", outcome: "active", exact: true }, "checkpoint");
  const availability = exact(result.snapshot, ["status", "snapshot"]);
  const snapshot = exact(availability.snapshot, ["anchor", "stop", "values"]);
  const anchorKey = resourceSnapshotAnchorKey(snapshot.anchor);
  need(result.result === "control" && availability.status === "captured" && anchorKey !== null &&
    integer(result.events_advanced, 1) && Array.isArray(snapshot.values) && snapshot.values.length <= 64,
  "checkpoint", "A bounded captured step with an exact independent anchor is required.");
  equal(snapshot.stop, result.stop, "checkpoint");
  const anchor = snapshot.anchor as ResourceSnapshotAnchor;
  equal(anchor.cursor, cursor, "stale");
  need(anchor.scope.level === "lane" && cursor.event_sequence > 0 && anchor.site?.source.status === "resolved" &&
    anchor.site.source.location.provenance === "compiler_bundle_bound", "origin", "Require the retained logical-lane source association.");
  // Values remain opaque retained data, as in the existing resource importer.
  // This module does not infer scalar types, frame activation or physical state.
  return { anchor, anchorKey, values: snapshot.values, eventsAdvanced: result.events_advanced };
}

/** Same bounded strict UTF-8 FileReader as the existing local importer. */
export async function readWatchpointFile(file: File, signal: AbortSignal): Promise<string> {
  try { return await readResourceImportFile(file, signal); }
  catch (error) {
    if (error instanceof ResourceImportError) throw new RecordedWatchpointImportError(error.code, error.message.slice(0, 384));
    throw error;
  }
}

/** Exactly seven original public pairs; no request is sent and no claim is authenticated. */
export async function importRecordedWatchpoint(requestUtf8: string, responseUtf8: string,
  signal?: AbortSignal): Promise<RecordedWatchpointObservation> {
  aborted(signal);
  const requests = lines(requestUtf8), responses = lines(responseUtf8);
  const roles: Role[] = ["initial", "inventory", "registration", "listing", "stop", "checkpoint", "memory"];
  const operations = ["step", "query_allocations", "set_watchpoints", "list_watchpoints", "continue", "step", "read_memory"];
  let previousId = 0;
  const pairs: Pair[] = requests.rows.map((request, index) => {
    aborted(signal); const response = responses.rows[index];
    need(integer(request.request_id, 1) && request.request_id > previousId, "order", "Request IDs must be exact, unique and increasing.");
    previousId = request.request_id;
    need(request.operation === operations[index] && response.operation === request.operation &&
      response.request_id === request.request_id && response.status === "ok", "pair", "Wrong operation, ID, order or unsuccessful response.");
    return { role: roles[index], requestId: request.request_id, line: index + 1, request, response,
      requestUtf8: requests.raw[index], responseUtf8: responses.raw[index] };
  });
  const cursors = responses.rows.map(response => session(response.session));
  const [initialRequest, inventoryRequest, registrationRequest, listingRequest, stopRequest, laterRequest, memoryRequest] = requests.rows;
  const [initialResponse, inventoryResponse, registrationResponse, listingResponse, stopResponse, laterResponse, memoryResponse] = responses.rows;
  const initial = checkpoint(initialRequest, initialResponse, cursors[0]);
  exact(inventoryRequest, ["schema", "request_id", "expected_revision", "operation", "expected_snapshot", "page"]);
  equal(inventoryRequest.page, { max_items: 16, max_scanned: 16 }, "inventory");
  advance(inventoryRequest, cursors[1], cursors[0], false);
  controlRequest(registrationRequest, "set_watchpoints", ["watchpoints"]); responseControl(registrationResponse);
  advance(registrationRequest, cursors[2], cursors[1], true);
  equal(cursors[2].event_sequence, cursors[1].event_sequence, "registration");
  equal(registrationResponse.result, { result: "acknowledged", accepted: 1 }, "registration");
  need(Array.isArray(registrationRequest.watchpoints) && registrationRequest.watchpoints.length === 1,
    "watchpoint", "Only one newly registered first-write watchpoint is supported.");
  const spec = exact(registrationRequest.watchpoints[0], ["client_label", "enabled", "allocation", "byte_offset", "byte_len", "access", "timing"]);
  const allocation = exact(spec.allocation, ["ordinal", "generation"]);
  need(integer(allocation.ordinal, 1) && allocation.generation === 0, "watchpoint", "Require an exact generation-zero allocation.");
  equal(spec, { client_label: "source-first-write", enabled: true, allocation, byte_offset: 0, byte_len: 4,
    access: "write", timing: "after_commit" }, "watchpoint");
  controlRequest(listingRequest, "list_watchpoints", ["page"]); responseControl(listingResponse);
  advance(listingRequest, cursors[3], cursors[2], false); equal(listingRequest.page, { limit: 16 }, "listing");
  const listing = exact(listingResponse.result, ["result", "watchpoints"]);
  need(listing.result === "watchpoints" && Array.isArray(listing.watchpoints) && listing.watchpoints.length === 1,
    "listing", "Require the one actual registered watchpoint row.");
  const listed = exact(listing.watchpoints[0], ["watchpoint_id", "spec", "hit_count"]);
  need(integer(listed.watchpoint_id, 1) && listed.hit_count === 0, "listing", "Require the actual ID with zero earlier hits.");
  equal(listed.spec, spec, "watchpoint");
  controlRequest(stopRequest, "continue", ["max_events"]); responseControl(stopResponse);
  advance(stopRequest, cursors[4], cursors[3], true); equal(stopRequest.max_events, 65_536, "stop");
  const stop = exact(stopResponse.result, ["result", "stop", "snapshot", "events_advanced"]);
  equal(stop.stop, { reason: "watchpoint", watchpoint_id: listed.watchpoint_id, outcome: "active", exact: true }, "stop");
  equal(stop.snapshot, { status: "unavailable", reason: "not_captured" }, "stop_snapshot");
  const eventsAdvanced = cursors[4].event_sequence - cursors[3].event_sequence;
  need(stop.result === "control" && integer(eventsAdvanced, 1, 65_536) && stop.events_advanced === eventsAdvanced,
    "stop", "The exact stop must advance within the retained request bound.");
  advance(laterRequest, cursors[5], cursors[4], true);
  const later = checkpoint(laterRequest, laterResponse, cursors[5]);
  need(integer(cursors[4].event_sequence + 1) && cursors[5].event_sequence === cursors[4].event_sequence + 1 &&
    later.eventsAdvanced === 1, "checkpoint", "The later captured checkpoint must be a separate next event.");
  // Different source spans are expected; never attach the later span to the stop.
  const beforeSource = initial.anchor.site!.source, laterSource = later.anchor.site!.source;
  need(beforeSource.status === "resolved" && laterSource.status === "resolved", "origin", "Source association unavailable.");
  equal([beforeSource.location.map_identity, beforeSource.location.file_identity, beforeSource.location.provenance],
    [laterSource.location.map_identity, laterSource.location.file_identity, laterSource.location.provenance], "origin");
  controlRequest(memoryRequest, "read_memory", ["allocation", "byte_offset", "byte_len"]);
  advance(memoryRequest, cursors[6], cursors[5], false);
  equal(memoryRequest.allocation, allocation, "memory");
  need(memoryRequest.byte_offset === 0 && memoryRequest.byte_len === 24, "memory", "Require the retained 24-byte window.");
  const memory = projectResourceMemoryResponse(memoryResponse, later.anchor);
  need(memory.status === "ready", "memory", "Memory must match the complete later checkpoint anchor.");
  equal(memory.memory.allocation, allocation, "memory");
  need(memory.memory.byte_offset === 0 && memory.memory.requested_bytes === 24 && memory.memory.returned_bytes === 24 &&
    memory.memory.availability.status === "captured" && memory.memory.availability.address_space === "global" &&
    memory.memory.availability.truncated === false, "memory", "Require the complete captured global window, without fabricated bytes.");
  const [requestSha256, responseSha256] = await Promise.all([programSha256(requestUtf8), programSha256(responseUtf8)]);
  aborted(signal);
  const context: ResourceMemoryContext = { connectionId: "local-watchpoint:" + requestSha256,
    captureIdentity: responseSha256, target: null, variantIdentity: null };
  const inventory = projectResourceAccessResponse({ response: inventoryResponse, expectedRequest: inventoryRequest,
    expectedSnapshot: initial.anchor, context, responseContext: context });
  need(inventory.status === "ready" && inventory.kind === "allocations" && inventory.completeness.status === "complete" &&
    !inventory.hasMorePages && inventory.sourceCount === inventory.rows.length, "inventory", "Require the complete actual initial allocation inventory.");
  const matching = inventory.rows.filter(row => row.allocation.ordinal === allocation.ordinal && row.allocation.generation === 0);
  need(matching.length === 1 && matching[0].address_space === "global" && matching[0].access === "read_write" &&
    BigInt(matching[0].capacity_bytes) >= 24n, "inventory", "The selected global allocation and retained window must exist in the inventory.");
  aborted(signal);
  return frozen<ObservationData>({ requestSha256, responseSha256, requestBytes: requests.bytes, responseBytes: responses.bytes, context, pairs,
    initial: { pair: pairs[0], anchor: initial.anchor, anchorKey: initial.anchorKey },
    registration: { pair: pairs[2], listingPair: pairs[3], watchpointId: listed.watchpoint_id,
      spec: spec as unknown as Spec, inventoryRow: matching[0] },
    stop: { pair: pairs[4], cursor: cursors[4], reason: "watchpoint", watchpointId: listed.watchpoint_id,
      outcome: "active", exact: true, eventsAdvanced, snapshot: { status: "unavailable", reason: "not_captured" },
      origin: { status: "unavailable", reason: "not_captured" } },
    checkpoint: { pair: pairs[5], anchor: later.anchor, anchorKey: later.anchorKey, values: later.values },
    memory: { pair: pairs[6], projection: memory, belongsTo: "later_checkpoint_only" },
    provenance: { kind: "caller_supplied_unverified", sourceAuthentication: false, hardwareObserved: false, performancePrediction: false } });
}
