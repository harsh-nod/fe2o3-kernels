/** Local R2 presentation join only. Receipt and producer claims remain unverified.
 * Existing seven-pair/resource importers are reused without broadening them. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { importRecordedWatchpoint, type RecordedWatchpointObservation } from "./recorded-watchpoint-observation";
import { importResourceRecording, type ImportedResourceCheckpoint, type ImportedResourcePair,
  type ImportedResourceRecording } from "./recorded-resource-import";
import { projectResourceCheckpointValues } from "./resource-checkpoint-values";
import { projectResourceSourceValues } from "./resource-source-values";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";

const KiB = 1024, MiB = KiB * KiB;
export const WATCH_SOURCE_LIMITS = Object.freeze({ totalBytes: 8 * MiB, lineBytes: 64 * KiB, pairs: 128 });
export const WATCH_SOURCE_FILES = [
  { role: "receipt", label: "Capture receipt JSON", leaf: "receipt.json", limit: MiB },
  { role: "fullRequests", label: "Full session requests JSONL", leaf: "debug-requests.jsonl", limit: 256 * KiB },
  { role: "fullResponses", label: "Full session responses JSONL", leaf: "debug-responses.jsonl", limit: 4 * MiB },
  { role: "watchRequests", label: "Seven-pair watchpoint requests JSONL", leaf: "watchpoint.requests.jsonl", limit: 256 * KiB },
  { role: "watchResponses", label: "Seven-pair watchpoint responses JSONL", leaf: "watchpoint.responses.jsonl", limit: 256 * KiB },
  { role: "sourceRequests", label: "Cross-invocation source requests JSONL", leaf: "resource-watch-source-values.requests.jsonl", limit: 256 * KiB },
  { role: "sourceResponses", label: "Cross-invocation source responses JSONL", leaf: "resource-watch-source-values.responses.jsonl", limit: 256 * KiB },
] as const;
export type WatchSourceFileRole = typeof WATCH_SOURCE_FILES[number]["role"];
export type WatchSourceFiles = Readonly<Record<WatchSourceFileRole, string>>;
type Row = Record<string, unknown>;
export interface WatchSourcePair {
  readonly requestId: number; readonly request: Row; readonly response: Row;
  readonly requestUtf8: string; readonly responseUtf8: string;
}
export type WatchSourceMoment = "stop" | "immediate" | "post" | "reverse" | "repeat";
export interface WatchSourceObservation {
  readonly watchpoint: RecordedWatchpointObservation;
  readonly source: ImportedResourceRecording;
  readonly immediate: ImportedResourceCheckpoint;
  readonly watchSourceRefusal: WatchSourcePair;
  readonly immediateSourceRefusal: WatchSourcePair;
  readonly momentPairs: Readonly<Record<WatchSourceMoment, readonly WatchSourcePair[]>>;
  readonly files: readonly { role: WatchSourceFileRole; leaf: string; bytes: number; sha256: string }[];
  readonly receiptUtf8: string;
  readonly fullPairs: readonly WatchSourcePair[];
  readonly provenance: { kind: "caller_supplied_unverified"; sourceAuthentication: false;
    hardwareObserved: false; performancePrediction: false; runtimeClosureVerified: false };
}
export class WatchSourceImportError extends Error {
  constructor(readonly code: string, detail: string) { super(code + ": " + detail); this.name = "WatchSourceImportError"; }
}
function need(ok: unknown, code: string, detail: string): asserts ok {
  if (!ok) throw new WatchSourceImportError(code, detail);
}
function object(value: unknown): Row {
  need(value && typeof value === "object" && !Array.isArray(value), "shape", "Expected an object."); return value as Row;
}
function exact(value: unknown, fields: readonly string[]): Row {
  const row = object(value); need(Object.keys(row).length === fields.length && fields.every(k => Object.hasOwn(row, k)),
    "fields", "Missing or unsupported fields in this closed presentation profile."); return row;
}
function number(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  need(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum,
    "integer", "Expected an exact bounded integer."); return value;
}
function array(value: unknown, minimum: number, maximum: number): unknown[] {
  need(Array.isArray(value) && value.length >= minimum && value.length <= maximum, "count", "Array count is outside this profile."); return value;
}
function digest(value: unknown): string {
  need(typeof value === "string" && /^[a-f0-9]{64}$/u.test(value) && !/^0+$/u.test(value), "digest", "Expected a lowercase nonzero SHA-256."); return value;
}
function text(value: unknown, maximum = 4096): string {
  need(typeof value === "string" && value.length > 0 && new TextEncoder().encode(value).length <= maximum &&
    !/[\p{Cc}\p{Cs}]/u.test(value), "text", "Expected bounded plain text."); return value;
}
function canonical(value: unknown): string {
  if (typeof value === "bigint") return "u64:" + value;
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(k => JSON.stringify(k) + ":" + canonical((value as Row)[k])).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function same(a: unknown, b: unknown, code = "mismatch"): void { need(canonical(a) === canonical(b), code, "Retained identities or fields differ."); }
function aborted(signal?: AbortSignal): void { if (signal?.aborted) throw new DOMException("Local watch/source import cancelled.", "AbortError"); }
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value;
}
function parse(raw: string, maximum: number): unknown {
  try { return parseProgramJson(raw, maximum); } catch { throw new WatchSourceImportError("json", "Malformed, duplicate-key, overlarge or unsupported JSON."); }
}
function stream(raw: string, maximum: number) {
  need(typeof raw === "string" && raw.length > 0 && raw.length <= maximum &&
    new TextEncoder().encode(raw).length <= maximum, "file_limit", "A selected stream exceeds its byte bound.");
  need(raw.endsWith("\n") && !raw.includes("\r") && raw.charCodeAt(0) !== 0xfeff, "jsonl", "Require exact UTF-8 LF JSONL, final LF and no BOM.");
  const lines = raw.slice(0, -1).split("\n");
  need(lines.length > 0 && lines.length <= WATCH_SOURCE_LIMITS.pairs && lines.every(l => l.trim()), "pair_count", "Require at most 128 nonblank pairs.");
  return lines.map(line => ({ raw: line + "\n", row: object(parse(line, WATCH_SOURCE_LIMITS.lineBytes)) }));
}
function cpuSession(value: unknown, terminated = false): Row {
  const s = exact(value, ["backend", "execution_kind", "state", "revision", "configuration_identity", "cursor",
    "simulated", "hardware_observed", "performance_prediction"]);
  const cursor = exact(s.cursor, ["configuration_identity", "event_sequence", "state_revision"]);
  need(s.backend === "cpu_kir_simulator" && s.execution_kind === "cpu_kir_simulation" &&
    s.state === (terminated ? "terminated" : "stopped") && s.simulated === true &&
    s.hardware_observed === false && s.performance_prediction === false, "session", "Require the original CPU-only session classification.");
  digest(s.configuration_identity); number(s.revision); number(cursor.event_sequence);
  same(cursor.configuration_identity, s.configuration_identity); same(cursor.state_revision, s.revision); return s;
}
function scope(anchor: ResourceSnapshotAnchor, lane: 0 | 1): void {
  exact(anchor, ["cursor", "scope", "site"]);
  same(anchor.scope, { level: "lane", workgroup: [0, 0, 0], wave: 0, lane, logical_workitem: [lane, 0, 0],
    active_mask: 15, wave_width: 32, interpretation: "logical_visualization" }, "lane");
  need(anchor.site?.source.status === "resolved" && anchor.site.source.location.provenance === "compiler_bundle_bound" &&
    anchor.site.kir.function_ordinal === 0 && anchor.site.kir.point.kind === "operation", "source", "Require the original root source-bound operation.");
}
function asResourcePair(pair: WatchSourcePair, kind: ImportedResourcePair["kind"]): ImportedResourcePair {
  return { kind, requestId: pair.requestId, line: pair.requestId, request: pair.request, response: pair.response,
    requestUtf8: pair.requestUtf8, responseUtf8: pair.responseUtf8 };
}
function makeCheckpoint(pair: WatchSourcePair, anchor: ResourceSnapshotAnchor): ImportedResourceCheckpoint {
  const key = resourceSnapshotAnchorKey(anchor); need(key !== null, "anchor", "Unsupported checkpoint anchor.");
  return { anchor, anchorKey: key, control: asResourcePair(pair, "checkpoint"), pages: [], memories: [] };
}
const BEFORE = "0x" + "a5a5a5a5".repeat(4) + "deadbeefcafebabe";
const AFTER = "0xd5010000" + "a5a5a5a5".repeat(3) + "deadbeefcafebabe";
function memory(checkpoint: ImportedResourceCheckpoint, pair: { request: unknown; response: unknown }, expected: string, allocation: unknown): void {
  const request = object(pair.request), response = object(pair.response);
  exact(response, ["status", "schema", "request_id", "operation", "session", "result"]);
  const projection = projectResourceMemoryResponse(response, checkpoint.anchor);
  need(projection.status === "ready", "memory", "Memory must belong to this exact independent checkpoint.");
  same(request.allocation, allocation);
  same(projection.memory, { allocation, byte_offset: 0, requested_bytes: 24, returned_bytes: 24,
    availability: { status: "captured", address_space: "global", bytes: expected, initialized: "0xffffff", truncated: false } }, "memory");
}
function refusal(pair: WatchSourcePair, stopped: unknown, reason: "checkpoint_not_captured" | "invalid_cursor" | "stale_revision",
  expectedRevision: number, selector: unknown = { selector: "all" }, cursor?: unknown): void {
  same(pair.request, { schema: "fe2o3-debug-source-variable-request-v2", request_id: pair.requestId, expected_revision: expectedRevision,
    operation: "inspect_source_variables", scope: { level: "dispatch" }, frame: 1, selector,
    page: { limit: 2, ...(cursor === undefined ? {} : { cursor }) } }, "refusal_request");
  same(pair.response.session, stopped, "refusal_session");
  const unavailable = reason === "checkpoint_not_captured";
  exact(pair.response, ["status", "schema", "request_id", "operation", "session", ...(unavailable ? ["reason"] : ["error"])]);
  same(pair.response.schema, "fe2o3-debug-source-variable-response-v2");
  same(pair.response.status, unavailable ? "unavailable" : "error");
  if (unavailable) same(pair.response.reason, reason);
  else {
    const error = exact(pair.response.error, ["stage", "code", "message", "state_changed"]);
    same(error.stage, "session"); same(error.code, reason); same(error.state_changed, false); text(error.message);
  }
}
const RECEIPT_FIELDS = ["status", "purpose", "source", "source_sha256", "source_receipt", "bundle_sha256", "bundle_identity",
  "canonical_kir_digest", "request_sha256", "independent_result", "stages", "selected_input_pins", "limits", "full_pairs",
  "watchpoint_request_ids", "source_request_ids", "excerpts", "refusals", "watchpoint_source_query_request_id",
  "immediate_checkpoint_source_query_request_id", "immediate_checkpoint_anchor", "raw_transcripts", "observations",
  "independent_result_file", "debugger_stderr", "checkpoints", "raw_line_preservation", "watchpoint_snapshot",
  "values_at_watchpoint_stop", "immediate_postwrite_source_values", "source_and_memory_belong_to", "source_checkpoint_lanes",
  "source_control_counts", "frame_identity", "source_to_ssa_mapping", "allocation_reuse", "dynamic_helper_activation",
  "source_authentication", "hardware_observed", "performance_prediction", "elapsed_ms"] as const;
function pin(value: unknown, expectedLeaf?: string): Row {
  const p = exact(value, ["path", "bytes", "sha256"]); text(p.path); number(p.bytes, 0, 4 * MiB); digest(p.sha256);
  if (expectedLeaf) same(p.path, expectedLeaf, "pin_path"); return p;
}
function receiptShape(value: unknown): Row {
  const r = exact(value, RECEIPT_FIELDS);
  same(r.status, "passed"); same(r.purpose, "existing-public-watchpoint-source-variable-resource-qualification");
  same(r.source, "crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs");
  for (const k of ["source_sha256", "bundle_sha256", "bundle_identity", "canonical_kir_digest", "request_sha256"]) digest(r[k]);
  pin(r.source_receipt);
  same(r.independent_result, { expected_u32: 469, output_words: 4, tail_canary_unchanged: true, hardware_observed: false });
  same(r.limits, { source: 256 * KiB, json: MiB, bundle: 8 * MiB, tool: 512 * MiB, inputBytes: 2 * 1024 ** 3,
    line: 65536, requests: 256 * KiB, responses: 4 * MiB, stderr: 65536, excerpt: 256 * KiB,
    retained: 8 * MiB, failureReserve: 65536, commands: 128, pages: 32, values: 64,
    stageMs: 30000, debuggerMs: 120000, replyMs: 15000, drainMs: 10000, totalMs: 180000 });
  for (const [i, stage] of array(r.stages, 2, 2).entries()) {
    const s = exact(stage, ["name", "executable", "args", "code", "signal", "error", "stdout", "stderr"]);
    same(s.name, i === 0 ? "inspection" : "simulation"); text(s.executable);
    array(s.args, 1, 8).forEach(a => text(a)); same(s.code, 0); same(s.signal, null); same(s.error, null);
    pin(s.stdout, i === 0 ? "inspection.stdout" : "simulation.stdout"); pin(s.stderr, i === 0 ? "inspection.stderr" : "simulation.stderr");
  }
  for (const p of array(r.selected_input_pins, 1, 32)) {
    const item = exact(p, ["path", "bytes", "sha256", "identity", "cap"]); text(item.path); digest(item.sha256);
    const cap = number(item.cap, 1, 512 * MiB); number(item.bytes, 1, cap); array(item.identity, 7, 7).forEach(v => text(v, 128));
  }
  pin(r.observations, "observations.json"); pin(r.independent_result_file, "independent-result.json"); pin(r.debugger_stderr, "debug-stderr.txt");
  same(r.raw_line_preservation, true); same(r.watchpoint_snapshot, "unavailable_not_captured"); same(r.values_at_watchpoint_stop, "not_supplied");
  same(r.immediate_postwrite_source_values, "unavailable_checkpoint_not_captured");
  same(r.source_and_memory_belong_to, "distinct_cross_invocation_operation_checkpoints_only");
  same(r.source_checkpoint_lanes, [1, 0, 1]); same(r.source_control_counts, [1, 2, 2]);
  same(r.frame_identity, "static_stack_depth_not_dynamic_activation"); same(r.source_to_ssa_mapping, "not_supplied");
  same(r.allocation_reuse, "not_represented"); same(r.dynamic_helper_activation, "not_represented");
  for (const k of ["source_authentication", "hardware_observed", "performance_prediction"]) same(r[k], false);
  number(r.elapsed_ms, 0, 190000); return r;
}

/** Separate reader: old seven-pair/resource file limits remain unchanged. */
export function readWatchSourceFile(file: File, role: WatchSourceFileRole, signal: AbortSignal): Promise<string> {
  aborted(signal); const limit = WATCH_SOURCE_FILES.find(f => f.role === role)!.limit;
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > limit)
    return Promise.reject(new WatchSourceImportError("file_limit", "This file exceeds its role's retained-stream bound."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); let done = false;
    const cleanup = () => { signal.removeEventListener("abort", cancel); reader.onload = reader.onerror = reader.onabort = null; };
    const fail = (error: unknown) => { if (!done) { done = true; cleanup(); reject(error); } };
    const cancel = () => { fail(new DOMException("Local import cancelled.", "AbortError")); if (reader.readyState === FileReader.LOADING) reader.abort(); };
    reader.onerror = () => fail(new WatchSourceImportError("file_read", "Could not read the complete local file."));
    reader.onabort = () => fail(new DOMException("Local import cancelled.", "AbortError"));
    reader.onload = () => { try {
      aborted(signal); need(reader.result instanceof ArrayBuffer && reader.result.byteLength === file.size, "file_read", "File bytes changed during read.");
      const bytes = new Uint8Array(reader.result); need(!(bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191), "utf8", "BOM is unsupported.");
      const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      same(new TextEncoder().encode(raw).length, file.size, "utf8"); done = true; cleanup(); resolve(raw);
    } catch (error) { fail(error); } };
    signal.addEventListener("abort", cancel, { once: true }); if (signal.aborted) { cancel(); return; }
    try { reader.readAsArrayBuffer(file); } catch (error) { fail(error); }
  });
}

export async function importWatchSourceObservation(provided: WatchSourceFiles, signal?: AbortSignal): Promise<WatchSourceObservation> {
  aborted(signal); exact(provided, WATCH_SOURCE_FILES.map(f => f.role)); let total = 0;
  // Caller ownership cannot be assumed across asynchronous hashing. Capture every
  // bounded primitive exactly once before the first await; all later work uses it.
  const selected = {} as Record<WatchSourceFileRole, string>;
  const measured = WATCH_SOURCE_FILES.map(spec => {
    const raw = provided[spec.role]; need(typeof raw === "string" && raw.length <= spec.limit, "file_limit", "A selected file exceeds its limit.");
    const bytes = new TextEncoder().encode(raw).length; number(bytes, 1, spec.limit); total += bytes;
    need(total <= WATCH_SOURCE_LIMITS.totalBytes, "total_limit", "The selected file set exceeds 8 MiB.");
    selected[spec.role] = raw;
    return { role: spec.role, leaf: spec.leaf, bytes };
  });
  const input: WatchSourceFiles = Object.freeze(selected);
  const files = await Promise.all(measured.map(async spec => ({
    ...spec, sha256: await programSha256(input[spec.role]),
  })));
  aborted(signal); const receipt = receiptShape(parse(input.receipt, MiB));
  const pins = [...array(receipt.raw_transcripts, 2, 2), ...array(receipt.excerpts, 4, 4)].map(p => pin(p));
  const expectedLeaves = WATCH_SOURCE_FILES.filter(f => f.role !== "receipt").map(f => f.leaf);
  same(pins.map(p => p.path).sort(), [...expectedLeaves].sort(), "pin_set");
  for (const file of files.filter(f => f.role !== "receipt")) {
    const p = pins.find(p => p.path === file.leaf)!; same([p.bytes, p.sha256], [file.bytes, file.sha256], "file_hash");
  }
  const requests = stream(input.fullRequests, 256 * KiB), responses = stream(input.fullResponses, 4 * MiB);
  same(requests.length, responses.length, "pair_count"); same(receipt.full_pairs, requests.length, "pair_count");
  const full: WatchSourcePair[] = requests.map((entry, index) => {
    aborted(signal); const response = responses[index].row, id = number(entry.row.request_id, 1, 128);
    same(id, index + 1, "full_order"); same(response.request_id, id); same(response.operation, entry.row.operation);
    cpuSession(response.session, entry.row.operation === "terminate");
    return { requestId: id, request: entry.row, response, requestUtf8: entry.raw, responseUtf8: responses[index].raw };
  });
  const watchpoint = await importRecordedWatchpoint(input.watchRequests, input.watchResponses, signal);
  const source = await importResourceRecording(input.sourceRequests, input.sourceResponses, signal);
  same(source.checkpoints.length, 3, "source_groups");
  same(receipt.watchpoint_request_ids, watchpoint.pairs.map(p => p.requestId));
  same(receipt.source_request_ids, source.pairs.map(p => p.requestId));
  need(!source.pairs.some(p => watchpoint.pairs.some(w => w.requestId === p.requestId)), "separation", "The two excerpts must not share pair identities.");
  let cursor = 0;
  const take = (): WatchSourcePair => { aborted(signal); need(cursor < full.length, "sequence", "Full session ended early."); return full[cursor++]; };
  const consume = (p: { requestId: number; requestUtf8: string; responseUtf8: string }): WatchSourcePair => {
    const actual = take(); same([actual.requestId, actual.requestUtf8, actual.responseUtf8],
      [p.requestId, p.requestUtf8, p.responseUtf8], "subsequence"); return actual;
  };
  watchpoint.pairs.slice(0, 5).forEach(consume);
  const watchSourceRefusal = take(), watchSession = object(watchpoint.stop.pair.response).session;
  refusal(watchSourceRefusal, watchSession, "checkpoint_not_captured", watchpoint.stop.cursor.state_revision);
  same(receipt.watchpoint_source_query_request_id, watchSourceRefusal.requestId);
  const immediateControl = consume(watchpoint.checkpoint.pair), immediateStack = take(), immediateSourceRefusal = take();
  const immediateMemory = consume(watchpoint.memory.pair);
  const immediate = makeCheckpoint(immediateControl, structuredClone(watchpoint.checkpoint.anchor) as ResourceSnapshotAnchor);
  scope(immediate.anchor, 0); same(receipt.immediate_checkpoint_anchor, immediate.anchor);
  const initial = makeCheckpoint(full[0], structuredClone(watchpoint.initial.anchor) as ResourceSnapshotAnchor); scope(initial.anchor, 0);
  same(initial.anchor.site!.kir, { function_ordinal: 0, block_ordinal: 0, point: { kind: "operation", operation_ordinal: 0 } }, "first_operation");
  const initialSource = object(object(initial.anchor.site!.source).location);
  const immediateSource = object(object(immediate.anchor.site!.source).location);
  for (const field of ["map_identity", "file_identity", "provenance"]) same(initialSource[field], immediateSource[field], "source_identity");
  same(watchpoint.registration.inventoryRow.capacity_bytes, "24", "allocation_extent");
  same(watchpoint.registration.inventoryRow.alignment, 4, "allocation_alignment");
  for (const cp of [initial, immediate]) {
    const values = projectResourceCheckpointValues(cp); need(values.status === "ready" && values.rows.length > 0 &&
      values.rows.every(r => r.frame === "1" && r.functionOrdinal === "0"), "ssa", "Require complete root-frame scalar SSA rows.");
  }
  same(immediateStack.request, { schema: "fe2o3-debug-request-v1", request_id: immediateStack.requestId,
    expected_revision: immediate.anchor.cursor.state_revision, operation: "inspect_stack", scope: { level: "dispatch" }, page: { limit: 16 } });
  exact(immediateStack.response, ["status", "schema", "request_id", "operation", "session", "result"]);
  same(immediateStack.response.status, "ok"); same(immediateStack.response.schema, "fe2o3-debug-response-v1");
  same(immediateStack.response.session, immediateControl.response.session);
  const captured = object(object(immediateControl.response.result).snapshot).snapshot;
  const capturedValues = array(object(captured).values, 1, 64);
  same(immediateStack.response.result, { result: "stack", snapshot: immediate.anchor, frames: [{ frame: 1,
    function_ordinal: 0, block_ordinal: immediate.anchor.site!.kir.block_ordinal,
    values: { status: "captured", value_count: capturedValues.length } }] }, "terminal_stack");
  refusal(immediateSourceRefusal, immediateControl.response.session, "checkpoint_not_captured", immediate.anchor.cursor.state_revision);
  same(receipt.immediate_checkpoint_source_query_request_id, immediateSourceRefusal.requestId);
  const allocation = watchpoint.registration.spec.allocation;
  memory(immediate, immediateMemory, AFTER, allocation);
  const momentPairs: Record<WatchSourceMoment, WatchSourcePair[]> = {
    stop: [full[4], watchSourceRefusal], immediate: [immediateControl, immediateStack, immediateSourceRefusal, immediateMemory],
    post: [], reverse: [], repeat: [],
  };
  const refusals: { request_id: number; status: string; reason: string }[] = [watchSourceRefusal, immediateSourceRefusal]
    .map(p => ({ request_id: p.requestId, status: "unavailable", reason: "checkpoint_not_captured" }));
  const summaries = array(receipt.checkpoints, 3, 3);
  let previous = immediate.anchor, oldCursor: unknown;
  for (const [index, cp] of source.checkpoints.entries()) {
    const name = (["post", "reverse", "repeat"] as const)[index], lane = index === 1 ? 0 : 1, count = index === 0 ? 1 : 2;
    scope(cp.anchor, lane); same(cp.pages.length, 0); same(cp.memories.length, 1);
    const sourceIdentity = object(object(cp.anchor.site!.source).location);
    for (const field of ["map_identity", "file_identity", "provenance"]) same(sourceIdentity[field], initialSource[field], "source_identity");
    need(cp.sourceStack && cp.sourceVariables && cp.sourceVariables.length >= 2 && cp.sourceVariables.length <= 32,
      "source_group", "Require the complete independent stack, source pages and memory.");
    const projection = projectResourceSourceValues(cp, cp.sourceStack, cp.sourceVariables);
    need(projection.status === "ready" && projection.stackFrameCount === 1 && projection.stackFrame.frame === 1 &&
      projection.stackFrame.functionOrdinal === 0 && projection.totalSsaValueCount > 0 &&
      projection.rows.every(r => r.status === "captured" || r.status === "unavailable"), "source_values", "Unsupported or incomplete source group.");
    for (const [parameter, bits] of [["a", "0xfffffff0"], ["b", "0x00000025"]]) {
      const matches = projection.rows.filter(r => r.name === parameter);
      need(matches.length === 1 && matches[0].generation === "1" && matches[0].status === "captured" &&
        matches[0].typeLabel === "u32" && matches[0].representation === bits, "parameters", "Expected represented source parameters are unavailable.");
    }
    for (const parameter of ["out", "result"]) same(projection.rows.filter(r => r.name === parameter).length, 1);
    same(object(cp.sourceStack.request).page, { limit: 16 });
    cp.sourceVariables.forEach(p => same(object(object(p.request).page).limit, 2));
    const members = [cp.control, cp.sourceStack, ...cp.sourceVariables, ...cp.memories];
    momentPairs[name].push(...members.map(consume));
    const request = object(cp.control.request), response = object(cp.control.response), result = object(response.result);
    same(request.direction, index === 1 ? "reverse" : "forward"); same(request.count, count);
    same(request.expected_revision, previous.cursor.state_revision); same(cp.anchor.cursor.state_revision, previous.cursor.state_revision + 1);
    same(cp.anchor.cursor.configuration_identity, immediate.anchor.cursor.configuration_identity);
    same(Math.abs(cp.anchor.cursor.event_sequence - previous.cursor.event_sequence), result.events_advanced, "event_distance");
    need(index === 1 ? cp.anchor.cursor.event_sequence < watchpoint.stop.cursor.event_sequence
      : cp.anchor.cursor.event_sequence > previous.cursor.event_sequence, "direction", "Recorded checkpoint direction differs.");
    same(cp.anchor.site, index === 1 ? immediate.anchor.site : initial.anchor.site, "static_site");
    same(projection.stackFrame.nextOperation, cp.anchor.site!.kir.point.kind === "operation" ? cp.anchor.site!.kir.point.operation_ordinal : -1);
    memory(cp, cp.memories[0], index === 1 ? BEFORE : AFTER, allocation);
    const summary = exact(summaries[index], ["control_request_id", "checkpoint_anchor", "source_anchor", "source_request_ids", "ssa_count", "source_count"]);
    same(summary, { control_request_id: cp.control.requestId, checkpoint_anchor: cp.anchor, source_anchor: projection.sourceAnchor,
      source_request_ids: cp.sourceVariables.map(p => p.requestId), ssa_count: projection.totalSsaValueCount, source_count: projection.rows.length });
    if (index === 0) {
      oldCursor = object(cp.sourceVariables[0].response).next_cursor; need(oldCursor !== undefined, "cursor", "Expected real paged source cursor.");
      const p = take(); refusal(p, response.session, "invalid_cursor", cp.anchor.cursor.state_revision,
        { selector: "name", name: "a" }, oldCursor); momentPairs[name].push(p);
      refusals.push({ request_id: p.requestId, status: "error", reason: "invalid_cursor" });
    } else if (index === 1) {
      const stale = take(), changed = take();
      refusal(stale, response.session, "stale_revision", source.checkpoints[0].anchor.cursor.state_revision);
      refusal(changed, response.session, "invalid_cursor", cp.anchor.cursor.state_revision, { selector: "all" }, oldCursor);
      momentPairs[name].push(stale, changed);
      refusals.push({ request_id: stale.requestId, status: "error", reason: "stale_revision" },
        { request_id: changed.requestId, status: "error", reason: "invalid_cursor" });
    }
    previous = cp.anchor;
  }
  same(receipt.refusals, refusals);
  const [post, , repeat] = source.checkpoints;
  same(repeat.anchor.cursor.event_sequence, post.anchor.cursor.event_sequence); same(repeat.anchor.scope, post.anchor.scope);
  const actualValues = (cp: ImportedResourceCheckpoint) => object(object(object(cp.control.response).result).snapshot).snapshot;
  same(object(actualValues(post)).values, object(actualValues(repeat)).values, "repeat_ssa");
  same(object(object(post.sourceStack!.response).result).frames, object(object(repeat.sourceStack!.response).result).frames, "repeat_stack");
  same(post.sourceVariables!.flatMap(p => array(object(p.response).values, 1, 2)),
    repeat.sourceVariables!.flatMap(p => array(object(p.response).values, 1, 2)), "repeat_source");
  const end = take(), previousSession = object(repeat.control.response).session;
  same(end.request, { schema: "fe2o3-debug-request-v1", request_id: end.requestId, expected_revision: previous.cursor.state_revision, operation: "terminate" });
  same(end.response, { status: "ok", schema: "fe2o3-debug-response-v1", request_id: end.requestId, operation: "terminate",
    session: { ...object(previousSession), state: "terminated", revision: previous.cursor.state_revision + 1,
      cursor: { ...previous.cursor, state_revision: previous.cursor.state_revision + 1 } }, result: { result: "terminated" } });
  same(cursor, full.length, "sequence"); aborted(signal);
  return freeze<WatchSourceObservation>({ watchpoint, source, immediate, watchSourceRefusal, immediateSourceRefusal, momentPairs, files,
    receiptUtf8: input.receipt, fullPairs: full, provenance: { kind: "caller_supplied_unverified", sourceAuthentication: false,
      hardwareObserved: false, performancePrediction: false, runtimeClosureVerified: false } });
}
