/** Narrow local presentation join. Caller-supplied bytes are never execution authority. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { importResourceRecording, type ImportedResourceCheckpoint, type ImportedResourcePair,
  type ImportedResourceRecording } from "./recorded-resource-import";
import { projectResourceCheckpointValues } from "./resource-checkpoint-values";
import { projectResourceSourceValues } from "./resource-source-values";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";

const KiB = 1024;
export const FAULT_SOURCE_LIMITS = Object.freeze({ totalBytes: 1024 * KiB, lineBytes: 64 * KiB, pairs: 44 });
export const FAULT_SOURCE_FILES = [
  { role: "receipt", label: "Fault capture receipt JSON", leaf: "receipt.json", limit: 64 * KiB },
  { role: "requests", label: "Fault session requests JSONL", leaf: "debug-requests.jsonl", limit: 256 * KiB },
  { role: "responses", label: "Fault session responses JSONL", leaf: "debug-responses.jsonl", limit: 256 * KiB },
  { role: "diagnostic", label: "Standalone uninitialized diagnostic", leaf: "uninitialized.stderr", limit: 4 * KiB },
] as const;
export type FaultSourceFileRole = typeof FAULT_SOURCE_FILES[number]["role"];
export type FaultSourceFiles = Readonly<Record<FaultSourceFileRole, string>>;
type Row = Record<string, unknown>;
export interface FaultSourcePair {
  readonly requestId: number; readonly request: Row; readonly response: Row;
  readonly requestUtf8: string; readonly responseUtf8: string;
}
export type FaultSourceMoment = "fault" | "prior" | "repeat" | "completed";
export interface FaultSourceReplay {
  readonly recording: ImportedResourceRecording;
  readonly fullPairs: readonly FaultSourcePair[];
  readonly momentPairs: Readonly<Record<FaultSourceMoment, readonly FaultSourcePair[]>>;
  readonly stalePair: FaultSourcePair;
  readonly diagnostic: Row;
  readonly diagnosticUtf8: string;
  readonly receiptUtf8: string;
  readonly files: readonly { role: FaultSourceFileRole; leaf: string; bytes: number; sha256: string }[];
  readonly provenance: { kind: "caller_supplied_unverified"; sourceAuthentication: false;
    fullRunVerified: false; hardwareObserved: false; performancePrediction: false };
}
export class FaultSourceImportError extends Error {
  constructor(readonly code: string, detail: string) { super(code + ": " + detail); this.name = "FaultSourceImportError"; }
}
function need(ok: unknown, code: string, detail: string): asserts ok {
  if (!ok) throw new FaultSourceImportError(code, detail);
}
function object(value: unknown): Row {
  need(value !== null && typeof value === "object" && !Array.isArray(value), "shape", "Expected an object.");
  return value as Row;
}
function exact(value: unknown, fields: readonly string[]): Row {
  const row = object(value);
  need(Object.keys(row).length === fields.length && fields.every(key => Object.hasOwn(row, key)),
    "fields", "Missing or unsupported fields in the closed fault presentation profile."); return row;
}
function nat(value: unknown, maximum = Number.MAX_SAFE_INTEGER, minimum = 0): number {
  need(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum,
    "integer", "Expected an exact bounded integer."); return value;
}
function array(value: unknown, minimum: number, maximum: number): unknown[] {
  need(Array.isArray(value) && value.length >= minimum && value.length <= maximum, "count", "Unexpected bounded row count.");
  return value;
}
function digest(value: unknown): string {
  need(typeof value === "string" && /^[a-f0-9]{64}$/u.test(value) && !/^0+$/u.test(value),
    "digest", "Expected a nonzero lowercase SHA-256."); return value;
}
function plain(value: unknown, maximum = 4096): string {
  need(typeof value === "string" && value.length > 0 && new TextEncoder().encode(value).length <= maximum &&
    !/[\p{Cc}\p{Cs}]/u.test(value), "text", "Expected bounded plain text."); return value;
}
function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "bigint") return "u64:" + value;
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ":" + canonical((value as Row)[key])).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function same(a: unknown, b: unknown, code = "mismatch"): void {
  need(canonical(a) === canonical(b), code, "Retained fields or identities do not match.");
}
function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Local fault/source import cancelled.", "AbortError");
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function parse(raw: string, maximum: number): unknown {
  try { return parseProgramJson(raw, maximum); }
  catch { throw new FaultSourceImportError("json", "Malformed, duplicate-key, overlarge or unsupported JSON."); }
}
function stream(raw: string) {
  need(raw.endsWith("\n") && !raw.includes("\r") && raw.charCodeAt(0) !== 0xfeff,
    "jsonl", "Require original UTF-8 LF JSONL with final LF and no BOM.");
  const lines = raw.slice(0, -1).split("\n");
  need(lines.length === FAULT_SOURCE_LIMITS.pairs && lines.every(line => line.trim()),
    "pair_count", "This profile requires exactly 44 original pairs.");
  return lines.map(line => ({ row: object(parse(line, FAULT_SOURCE_LIMITS.lineBytes)), raw: line + "\n" }));
}
function allocation(value: unknown): Row {
  const row = exact(value, ["ordinal", "generation"]);
  nat(row.ordinal, 65535, 1); same(row.generation, 0, "allocation_generation"); return row;
}
function cpuSession(value: unknown, terminated = false): Row {
  const row = exact(value, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor",
    "simulated", "hardware_observed", "performance_prediction"]);
  const cursor = exact(row.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
  same(row.backend, "cpu_kir_simulator"); same(row.execution_kind, "cpu_kir_simulation");
  same(row.state, terminated ? "terminated" : "stopped");
  same(row.simulated, true); same(row.hardware_observed, false); same(row.performance_prediction, false);
  digest(row.configuration_identity); nat(row.revision, 8); nat(cursor.event_sequence, 65536);
  same(cursor.configuration_identity, row.configuration_identity); same(cursor.state_revision, row.revision); return row;
}
function resourcePair(pair: FaultSourcePair, kind: ImportedResourcePair["kind"]): ImportedResourcePair {
  return { kind, requestId: pair.requestId, line: pair.requestId, request: pair.request, response: pair.response,
    requestUtf8: pair.requestUtf8, responseUtf8: pair.responseUtf8 };
}
function captured(pair: FaultSourcePair, sourceMap: string): ImportedResourceCheckpoint {
  const result = object(pair.response.result), wrapper = exact(result.snapshot, ["status", "snapshot"]);
  same(wrapper.status, "captured");
  const snapshot = exact(wrapper.snapshot, ["anchor", "stop", "values"]);
  same(snapshot.stop, result.stop);
  const anchor = exact(snapshot.anchor, ["cursor", "scope", "site"]);
  same(anchor.cursor, object(pair.response.session).cursor);
  same(anchor.scope, { level: "lane", workgroup: [0, 0, 0], wave: 0, lane: 0,
    logical_workitem: [0, 0, 0], active_mask: 15, wave_width: 32, interpretation: "logical_visualization" }, "scope");
  const site = exact(anchor.site, ["kir", "source"]), kir = exact(site.kir, ["function_ordinal", "block_ordinal", "point"]);
  same(kir.function_ordinal, 0); nat(kir.block_ordinal, 65535);
  const point = exact(kir.point, ["kind", "operation_ordinal"]); same(point.kind, "operation"); nat(point.operation_ordinal, 65535);
  const source = exact(site.source, ["status", "location"]); same(source.status, "resolved");
  const location = exact(source.location, ["map_identity", "file_identity", "provenance", "byte_start", "byte_end"]);
  same(location.map_identity, sourceMap, "source_map"); digest(location.file_identity); same(location.provenance, "compiler_bundle_bound");
  nat(location.byte_start); nat(location.byte_end, Number.MAX_SAFE_INTEGER, nat(location.byte_start) + 1);
  array(snapshot.values, 1, 64);
  for (const value of snapshot.values as unknown[]) {
    const root = object(object(object(value).path).root);
    same(root.frame, 1, "frame"); same(root.function_ordinal, kir.function_ordinal, "function");
  }
  const typedAnchor = anchor as unknown as ResourceSnapshotAnchor, anchorKey = resourceSnapshotAnchorKey(typedAnchor);
  need(anchorKey !== null, "anchor", "Unsupported captured anchor.");
  const checkpoint: ImportedResourceCheckpoint = { anchor: typedAnchor, anchorKey,
    control: resourcePair(pair, "checkpoint"), pages: [], memories: [] };
  need(projectResourceCheckpointValues(checkpoint).status === "ready", "ssa", "Invalid captured checkpoint SSA.");
  return checkpoint;
}
function inventory(pair: FaultSourcePair, checkpoint: ImportedResourceCheckpoint): unknown[] {
  same(pair.request, { schema: "fe2o3-debug-resource-request-v1", request_id: pair.requestId,
    expected_revision: checkpoint.anchor.cursor.state_revision, operation: "query_allocations",
    expected_snapshot: checkpoint.anchor, page: { max_items: 16, max_scanned: 16 } }, "inventory_request");
  const response = exact(pair.response, ["status", "schema", "request_id", "operation", "session", "snapshot", "page", "result", "physical_registers"]);
  same(response.status, "ok"); same(response.snapshot, checkpoint.anchor);
  same(response.page, { source_count: 3, scanned: 3, completeness: { status: "complete" } }); same(response.physical_registers, "not_represented");
  const result = exact(response.result, ["result", "allocations"]); same(result.result, "allocations");
  const rows = array(result.allocations, 3, 3), seen = new Set();
  const capacities: string[] = [];
  for (const value of rows) {
    const row = exact(value, ["allocation", "address_space", "access", "alignment", "capacity_bytes",
      "snapshot_bytes_available", "initialization_available", "owning_scope", "lifetime", "physical_base"]);
    const identity = allocation(row.allocation); need(!seen.has(identity.ordinal), "inventory", "Duplicate allocation identity."); seen.add(identity.ordinal);
    same(row.address_space, "global"); same(row.alignment, 4);
    need(row.capacity_bytes === "16" || row.capacity_bytes === "24", "capacity", "Unexpected retained capacity.");
    capacities.push(row.capacity_bytes); same(row.access, row.capacity_bytes === "24" ? "read_write" : "read_only");
    same(row.snapshot_bytes_available, true); same(row.initialization_available, true);
    for (const field of ["owning_scope", "lifetime", "physical_base"]) same(row[field], "not_represented");
  }
  same(capacities.sort(), ["16", "16", "24"]); return rows;
}
const V1 = "fe2o3-debug-request-v1", SOURCE = "fe2o3-debug-source-variable-request-v2", RESOURCE = "fe2o3-debug-resource-request-v1";
function query(pair: FaultSourcePair, operation: string, revision: number, observedAllocation?: unknown, page?: unknown): void {
  const base = { schema: operation === "inspect_source_variables" ? SOURCE : V1,
    request_id: pair.requestId, expected_revision: revision, operation };
  if (operation === "read_memory") {
    allocation(pair.request.allocation);
    same(pair.request, { ...base, allocation: observedAllocation ?? pair.request.allocation,
      byte_offset: 0, byte_len: page ?? 16 }, "memory_request"); return;
  }
  same(pair.request, { ...base, scope: { level: "dispatch" },
    ...(operation === "inspect_source_variables" ? { frame: 1 } : {}),
    ...(operation === "inspect_stack" ? {} : { selector: { selector: "all" } }),
    page: page ?? { limit: operation === "inspect_stack" ? 16 : operation === "inspect_values" ? 64 : 2 } }, "query_request");
}
function unavailable(pair: FaultSourcePair, revision: number, observedAllocation: unknown): void {
  const operation = String(pair.request.operation); query(pair, operation, revision, observedAllocation);
  const response = pair.response;
  if (operation === "inspect_source_variables") {
    exact(response, ["status", "schema", "request_id", "operation", "session", "reason"]);
    // This narrow 44-pair profile contains successful source groups, so a missing
    // source map is not an alternative explanation for its terminal refusals.
    same(response.status, "unavailable"); same(response.reason, "checkpoint_not_captured");
  } else {
    exact(response, ["status", "schema", "request_id", "operation", "session", "unavailable"]);
    same(response.status, "unavailable");
    const row = exact(response.unavailable, ["capability", "reason", "state_changed", "detail"]);
    same(row.capability, ({ inspect_stack: "call_stack", inspect_values: "kir_ssa_values", read_memory: "allocation_relative_memory" } as Row)[operation]);
    same(row.reason, "not_captured"); same(row.state_changed, false); plain(row.detail);
  }
}
const RECEIPT_FIELDS = ["bundle", "bundle_identity", "canonical_kir_digest", "claims", "compiler_scratch",
  "debugger_stderr", "elapsed_ms", "limits", "observations", "positive", "raw_line_preservation", "raw_transcripts",
  "retained_observation_bytes_before_receipt", "schema", "selected_input_and_artifact_pins", "source_files",
  "source_map_identity", "source_variables", "stages", "standalone_and_debugger_are_separate_executions",
  "standalone_diagnostic", "status", "transcript"];
const CLAIMS = ["source_authentication", "compiler_closure_attestation", "proof_authority", "production_resume",
  "hardware_execution", "physical_register_values", "performance_prediction", "terminal_values_captured", "allocation_reuse_observed"];
function pin(value: unknown, leaf: string, file: { bytes: number; sha256: string }): void {
  same(exact(value, ["path", "bytes", "sha256"]), { path: leaf, bytes: file.bytes, sha256: file.sha256 }, "file_pin");
}
function standalone(value: unknown): Row {
  const row = exact(value, ["schema", "status", "stage", "kind", "message", "invocation", "site"]);
  same(row.schema, "fe2o3-simulation-error-v1"); same(row.status, "error"); same(row.stage, "execution");
  same(row.kind, "execution_uninitialized_read"); plain(row.message);
  same(row.invocation, { global: [0, 0, 0], workgroup: [0, 0, 0], local: [0, 0, 0],
    workgroup_size: [256, 1, 1], workgroup_count: [1, 1, 1], launch_extent: [4, 1, 1] });
  const site = exact(row.site, ["function", "function_bytes", "function_truncated", "block", "operation"]);
  same(site.function, "vecadd"); same(site.function_bytes, 6); same(site.function_truncated, false);
  nat(site.block, 65535); nat(site.operation, 65535);
  // Raw simulator block ordinals are NOT joined to canonical debugger blocks.
  return row;
}
const OPS = ["step", "query_allocations", "continue", "inspect_stack", "inspect_values", "inspect_source_variables", "read_memory",
  "step", "inspect_stack", "inspect_values", "query_allocations", "inspect_source_variables", "inspect_source_variables",
  "inspect_source_variables", "read_memory", "read_memory", "read_memory",
  "step", "inspect_stack", "inspect_values", "inspect_source_variables", "read_memory",
  "step", "inspect_stack", "inspect_values", "query_allocations", "inspect_source_variables", "inspect_source_variables",
  "inspect_source_variables", "read_memory", "read_memory", "read_memory",
  "inspect_values", "step", "inspect_stack", "inspect_values", "inspect_source_variables", "read_memory",
  "continue", "inspect_stack", "inspect_values", "inspect_source_variables", "read_memory", "terminate"] as const;
const RESOURCE_IDS = [8, 9, 11, 12, 13, 14, 15, 16, 17, 23, 24, 26, 27, 28, 29, 30, 31, 32] as const;
const MODELS = [
  { bytes: "0x0000803f000000400000804000000041", initialized: "0xfeff", access: "read_only", length: 16 },
  { bytes: "0x0000003f0000c03f0000204000006040", initialized: "0xffff", access: "read_only", length: 16 },
  { bytes: "0x" + "a5a5a5a5".repeat(4) + "deadbeefcafebabe", initialized: "0xffffff", access: "read_write", length: 24 },
] as const;

/** Only validates the four supplied files and an exact retained subset, not the full capture run. */
export async function importFaultSourceReplay(input: FaultSourceFiles, signal?: AbortSignal): Promise<FaultSourceReplay> {
  aborted(signal);
  exact(input, FAULT_SOURCE_FILES.map(spec => spec.role));
  // Copy bounded primitive strings synchronously before any asynchronous digest.
  const copied = {} as Record<FaultSourceFileRole, string>; let total = 0;
  for (const spec of FAULT_SOURCE_FILES) {
    const raw = input[spec.role];
    need(typeof raw === "string" && raw.length > 0 && raw.length <= spec.limit,
      "file_limit", "Missing or oversized selected file.");
    const bytes = new TextEncoder().encode(raw).length; need(bytes <= spec.limit, "file_limit", "Selected UTF-8 file exceeds its bound.");
    copied[spec.role] = raw; total += bytes;
  }
  need(total <= FAULT_SOURCE_LIMITS.totalBytes, "total_limit", "Selected files exceed the total import bound.");
  const files = await Promise.all(FAULT_SOURCE_FILES.map(async spec => ({ role: spec.role, leaf: spec.leaf,
    bytes: new TextEncoder().encode(copied[spec.role]).length, sha256: await programSha256(copied[spec.role]) })));
  aborted(signal);
  const receipt = exact(parse(copied.receipt, FAULT_SOURCE_FILES[0].limit), RECEIPT_FIELDS);
  same(receipt.schema, "fe2o3-source-fault-replay-observation-v1"); same(receipt.status, "passed");
  const claims = exact(receipt.claims, CLAIMS); for (const field of CLAIMS) same(claims[field], false, "authority");
  same(receipt.standalone_and_debugger_are_separate_executions, true);
  same(receipt.raw_line_preservation, true);
  digest(receipt.bundle_identity); digest(receipt.canonical_kir_digest); const sourceMap = digest(receipt.source_map_identity);
  same(receipt.positive, { checked_output_words: 4, checked_canary_bytes: 8, input_bytes_and_initialization_unchanged: true });
  const pins = array(receipt.raw_transcripts, 2, 2);
  pin(pins[0], "debug-requests.jsonl", files[1]); pin(pins[1], "debug-responses.jsonl", files[2]);
  const stages = array(receipt.stages, 5, 5);
  same(stages.map(stage => object(stage).name), ["export", "inspection", "operations-0", "positive", "uninitialized"]);
  const diagnosticStage = object(stages[4]); same(diagnosticStage.code, 1); same(diagnosticStage.signal, null); same(diagnosticStage.reason, null);
  pin(diagnosticStage.stderr, "uninitialized.stderr", files[3]);
  const diagnostic = standalone(parse(copied.diagnostic, FAULT_SOURCE_FILES[3].limit));
  same(diagnostic, receipt.standalone_diagnostic, "diagnostic");
  const requests = stream(copied.requests), responses = stream(copied.responses);
  const pairs: FaultSourcePair[] = requests.map((request, index) => ({ requestId: index + 1,
    request: request.row, response: responses[index].row, requestUtf8: request.raw, responseUtf8: responses[index].raw }));
  const transcript = exact(receipt.transcript, ["pairs", "request_bytes", "response_bytes", "configuration_identity"]);
  same(transcript.pairs, 44); same(transcript.request_bytes, files[1].bytes); same(transcript.response_bytes, files[2].bytes);
  const configuration = digest(transcript.configuration_identity);
  let revision = 0, event = 0, previousSession: Row | null = null;
  const controls = new Map<number, ImportedResourceCheckpoint>();
  for (const pair of pairs) {
    aborted(signal);
    const q = pair.request, r = pair.response, id = pair.requestId, operation = OPS[id - 1];
    const schema = operation === "inspect_source_variables" ? SOURCE : operation === "query_allocations" ? RESOURCE : V1;
    same(q.schema, schema); same(q.request_id, id, "request_id"); same(q.operation, operation, "sequence");
    same(r.schema, schema.replace("request", "response")); same(r.request_id, id); same(r.operation, operation);
    same(q.expected_revision, id === 33 ? 3 : revision, "revision");
    const session = cpuSession(r.session, id === 44); same(session.configuration_identity, configuration, "session");
    const cursor = object(session.cursor), currentEvent = nat(cursor.event_sequence);
    if (operation === "step" || operation === "continue" || operation === "terminate") {
      same(session.revision, revision + 1, "revision"); same(r.status, "ok");
      exact(r, ["status", "schema", "request_id", "operation", "session", "result"]);
      if (operation === "terminate") {
        same(q, { schema: V1, request_id: id, expected_revision: revision, operation: "terminate" });
        same(r.result, { result: "terminated" }); same(currentEvent, event);
      } else {
        const reverse = id === 8 || id === 23;
        same(q, operation === "step" ? { schema: V1, request_id: id, expected_revision: revision, operation,
          direction: reverse ? "reverse" : "forward", granularity: "operation", count: 1 }
          : { schema: V1, request_id: id, expected_revision: revision, operation, max_events: 65536 }, "control_request");
        const result = exact(r.result, ["result", "stop", "snapshot", "events_advanced"]); same(result.result, "control");
        same(result.events_advanced, Math.abs(currentEvent - event), "event_distance");
        const isCaptured = id === 1 || id === 8 || id === 23;
        same(result.stop, { reason: isCaptured ? "step" : id === 39 ? "completed" : "fault",
          outcome: isCaptured ? "active" : "failed", exact: true });
        if (id === 39) same(currentEvent, event);
        else need(reverse ? currentEvent < event : currentEvent > event, "direction", "Control moved in the wrong event direction.");
        if (isCaptured) controls.set(id, captured(pair, sourceMap));
        else same(result.snapshot, { status: "unavailable", reason: "not_captured" }, "terminal_capture");
      }
      revision++; event = currentEvent; previousSession = session;
    } else same(session, previousSession, "query_session");
  }
  const initial = controls.get(1)!, first = controls.get(8)!, repeated = controls.get(23)!;
  const initialInventory = inventory(pairs[1], initial);
  const selectedAllocation = object(initialInventory.find(row => object(row).capacity_bytes === "16")).allocation;
  for (const start of [3, 18, 34, 39]) {
    const control = pairs[start - 1], terminalRevision = nat(object(control.response.session).revision);
    for (let offset = 1; offset <= 4; offset++) unavailable(pairs[start + offset - 1], terminalRevision, selectedAllocation);
  }
  const terminalEvent = object(object(pairs[2].response.session).cursor).event_sequence;
  for (const id of [18, 34, 39, 44]) same(object(object(pairs[id - 1].response.session).cursor).event_sequence, terminalEvent);
  same(first.anchor.cursor.event_sequence, nat(terminalEvent) - 1, "prior_event");
  same(first.anchor.cursor.event_sequence, repeated.anchor.cursor.event_sequence, "replay_event");
  same(first.anchor.scope, repeated.anchor.scope, "replay_scope"); same(first.anchor.site, repeated.anchor.site, "replay_site");
  const snapshotValues = (cp: ImportedResourceCheckpoint) => object(object(object(object(cp.control.response).result).snapshot).snapshot).values;
  same(snapshotValues(first), snapshotValues(repeated), "replay_ssa");
  for (const [controlId, stackId, ssaId] of [[8, 9, 10], [23, 24, 25]]) {
    const cp = controls.get(controlId)!, stackPair = pairs[stackId - 1], ssaPair = pairs[ssaId - 1];
    query(stackPair, "inspect_stack", cp.anchor.cursor.state_revision);
    query(ssaPair, "inspect_values", cp.anchor.cursor.state_revision);
    exact(stackPair.response, ["status", "schema", "request_id", "operation", "session", "result"]);
    same(stackPair.response.status, "ok");
    const stack = exact(stackPair.response.result, ["result", "snapshot", "frames"]);
    same(stack.result, "stack"); same(stack.snapshot, cp.anchor);
    const frame = exact(array(stack.frames, 1, 1)[0], ["frame", "function_ordinal", "block_ordinal", "next_operation", "values"]);
    same(frame.frame, 1); same(frame.function_ordinal, cp.anchor.site!.kir.function_ordinal);
    same(frame.block_ordinal, cp.anchor.site!.kir.block_ordinal);
    const point = object(cp.anchor.site!.kir.point);
    same(frame.next_operation, point.operation_ordinal, "next_operation");
    same(frame.values, { status: "captured", value_count: (snapshotValues(cp) as unknown[]).length });
    exact(ssaPair.response, ["status", "schema", "request_id", "operation", "session", "result"]);
    same(ssaPair.response.status, "ok");
    same(ssaPair.response.result, { result: "values", snapshot: cp.anchor, values: snapshotValues(cp) }, "ssa_query_join");
  }
  const stalePair = pairs[32];
  query(stalePair, "inspect_values", 3);
  exact(stalePair.response, ["status", "schema", "request_id", "operation", "session", "error"]);
  same(stalePair.response.status, "error");
  const error = exact(stalePair.response.error, ["stage", "code", "message", "state_changed"]);
  same(error.stage, "session"); same(error.code, "stale_revision"); same(error.state_changed, false); plain(error.message);
  // Preserve original lines and ids; no rewriting of revisions, anchors, frames,
  // commands or selectors to fit the unchanged successful-resource importer.
  const excerpt = RESOURCE_IDS.map(id => pairs[id - 1]);
  const recording = await importResourceRecording(excerpt.map(pair => pair.requestUtf8).join(""),
    excerpt.map(pair => pair.responseUtf8).join(""), signal);
  aborted(signal); same(recording.pairs.length, 18); same(recording.checkpoints.length, 2);
  const sourceRows: unknown[][] = [], memoryRows: unknown[][] = [];
  for (const [index, checkpoint] of recording.checkpoints.entries()) {
    same(checkpoint.control.requestId, index === 0 ? 8 : 23);
    const inventoryId = index === 0 ? 11 : 26;
    const rows = inventory(pairs[inventoryId - 1], checkpoint); same(rows, initialInventory, "inventory_replay");
    need(projectResourceCheckpointValues(checkpoint).status === "ready", "ssa", "Unsupported SSA projection.");
    need(projectResourceSourceValues(checkpoint, checkpoint.sourceStack ?? null, checkpoint.sourceVariables ?? []).status === "ready",
      "source", "Incomplete or incompatible captured source group.");
    const pages = checkpoint.sourceVariables ?? []; same(pages.length, 3);
    const sourceValues: unknown[] = [];
    let next: unknown;
    for (const pair of pages) {
      const original = pairs[pair.requestId - 1];
      query(original, "inspect_source_variables", checkpoint.anchor.cursor.state_revision, undefined,
        { limit: 2, ...(next === undefined ? {} : { cursor: next }) });
      const response = object(pair.response); array(response.values, 2, 2);
      sourceValues.push(...response.values as unknown[]); next = response.next_cursor;
    }
    same(next, undefined, "source_paging"); sourceRows.push(sourceValues);
    same(checkpoint.memories.length, 3);
    const models = new Set<number>(), memories: unknown[] = [];
    for (const [i, pair] of checkpoint.memories.entries()) {
      const row = object(rows[i]), length = Number(row.capacity_bytes);
      query(pairs[pair.requestId - 1], "read_memory", checkpoint.anchor.cursor.state_revision, row.allocation, length);
      const projection = projectResourceMemoryResponse(pair.response, checkpoint.anchor);
      need(projection.status === "ready", "memory", "Memory is not captured at this checkpoint.");
      const matches = MODELS.map((model, modelIndex) => ({ model, modelIndex })).filter(({ model }) =>
        model.access === row.access && model.length === length &&
        canonical(projection.memory) === canonical({ allocation: row.allocation, byte_offset: 0,
          requested_bytes: length, returned_bytes: length, availability: { status: "captured", address_space: "global",
            bytes: model.bytes, initialized: model.initialized, truncated: false } }));
      need(matches.length === 1 && !models.has(matches[0].modelIndex), "memory_model", "Retained bytes/access/initialization differ from this bounded profile.");
      models.add(matches[0].modelIndex); memories.push(projection.memory);
    }
    same(models.size, 3); memoryRows.push(memories);
  }
  same(sourceRows[0], sourceRows[1], "replay_source"); same(memoryRows[0], memoryRows[1], "replay_memory");
  const stackFrames = recording.checkpoints.map(cp => object(object(cp.sourceStack!.response).result).frames);
  same(stackFrames[0], stackFrames[1], "replay_stack");
  return freeze({ recording, fullPairs: pairs, momentPairs: { fault: pairs.slice(2, 7),
    prior: pairs.slice(7, 17), repeat: pairs.slice(22, 33), completed: pairs.slice(38, 44) },
    stalePair, diagnostic, diagnosticUtf8: copied.diagnostic, receiptUtf8: copied.receipt, files,
    provenance: { kind: "caller_supplied_unverified", sourceAuthentication: false, fullRunVerified: false,
      hardwareObserved: false, performancePrediction: false } });
}
