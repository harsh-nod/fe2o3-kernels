/** Exact entry / one-event / restore V19 presentation, not executable admission.
 * Original JSONL bytes remain authoritative only as caller-supplied observations.
 * No compiler, simulator, source map or graph is reconstructed in this browser. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { projectResourceScalarValues, type CheckpointValueRow } from "./resource-checkpoint-values";

export const COMPLETE_BODY_DEBUG_SELECTOR_V19 = "--diagnostic-kir-v19";
export const COMPLETE_BODY_DEBUG_LIMITS_V19 = Object.freeze({
  fileBytes: 256 * 1024, lineBytes: 64 * 1024, metadataBytes: 8192, pairs: 5,
});
type Row = Record<string, unknown>;
export interface CompleteBodyDebugInputV19 {
  readonly selector: string;
  readonly requestsUtf8: string;
  readonly responsesUtf8: string;
  /** Optional declaration only; not joined to source custody or session identity. */
  readonly metadataUtf8?: string;
  readonly expected?: { readonly requests: string; readonly responses: string; readonly metadata?: string };
}
export interface CompleteBodyDebugMetadataV19 {
  readonly kernel: string; readonly canonicalIdentity: string; readonly canonicalBytes: number;
  readonly semanticMirIdentity: string;
}
export interface CompleteBodyDebugCheckpointV19 {
  readonly requestId: number; readonly label: string; readonly event: number; readonly revision: number;
  readonly requestUtf8: string; readonly responseUtf8: string;
  readonly observed: null | {
    readonly functionOrdinal: 0; readonly blockOrdinal: 0; readonly operationOrdinal: 0;
    readonly activeMask: bigint; readonly rows: readonly CheckpointValueRow[];
  };
}
export interface CompleteBodyDebugRecordingV19 {
  readonly status: "ready"; readonly key: string; readonly configuration: string;
  readonly requestSha256: string; readonly responseSha256: string; readonly metadataSha256: string | null;
  readonly metadata: CompleteBodyDebugMetadataV19 | null;
  readonly checkpoints: readonly CompleteBodyDebugCheckpointV19[];
}
export type CompleteBodyDebugProjectionV19 = CompleteBodyDebugRecordingV19
  | { readonly status: "unavailable" | "invalid"; readonly detail: string };
function need(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function object(value: unknown, required: readonly string[], optional: readonly string[] = []): Row {
  need(value !== null && typeof value === "object" && !Array.isArray(value), "Expected an object.");
  const row = value as Row;
  need(required.every(key => Object.hasOwn(row, key)) &&
    Object.keys(row).every(key => required.includes(key) || optional.includes(key)), "Missing or unsupported fields.");
  return row;
}
function uint(value: unknown, maximum = Number.MAX_SAFE_INTEGER): number {
  need(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum,
    "Inexact or out-of-range integer metadata.");
  return value;
}
function digest(value: unknown): string {
  need(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "Invalid identity.");
  return value;
}
function stable(value: unknown): string {
  if (typeof value === "bigint") return "u64:" + value.toString();
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ":" + stable((value as Row)[key])).join(",") + "}";
  return JSON.stringify(value) ?? "undefined";
}
function same(left: unknown, right: unknown): void { need(stable(left) === stable(right), "Recording identities or fields disagree."); }
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function lines(raw: string): { rows: Row[]; original: string[] } {
  need(typeof raw === "string" && new TextEncoder().encode(raw).byteLength <= COMPLETE_BODY_DEBUG_LIMITS_V19.fileBytes,
    "Each JSONL file must be at most 256 KiB.");
  need(raw.endsWith("\n") && !raw.includes("\r") && raw.charCodeAt(0) !== 0xfeff, "Use LF JSONL with a final LF and no BOM.");
  const original = raw.slice(0, -1).split("\n");
  need(original.length === COMPLETE_BODY_DEBUG_LIMITS_V19.pairs && original.every(line => line.trim().length > 0),
    "This adapter requires exactly five entry / one-event / restore pairs; other sessions are unsupported.");
  return { rows: original.map(line => object(parseProgramJson(line, COMPLETE_BODY_DEBUG_LIMITS_V19.lineBytes), [],
    ["schema", "request_id", "operation", "expected_revision", "direction", "granularity", "count", "status", "session", "result"])),
    original: original.map(line => line + "\n") };
}
function metadata(raw: string | undefined): CompleteBodyDebugMetadataV19 | null {
  if (raw === undefined) return null;
  const value = object(parseProgramJson(raw, COMPLETE_BODY_DEBUG_LIMITS_V19.metadataBytes),
    ["schema", "kernel", "canonical_bytes", "canonical_identity", "semantic_mir_v36",
      "artifact_or_launch_authority", "exported_compiler_authentication", "exported_source_authentication", "hardware_observed"]);
  same(value.schema, "fe2o3-diagnostic-kir-v19-observation");
  for (const name of ["artifact_or_launch_authority", "exported_compiler_authentication", "exported_source_authentication", "hardware_observed"])
    same(value[name], false);
  need(typeof value.kernel === "string" && value.kernel.length > 0 && value.kernel.length <= 1024, "Invalid declared kernel label.");
  const bytes = uint(value.canonical_bytes, 16 * 1024 * 1024); need(bytes > 0, "Empty declared canonical size.");
  return { kernel: value.kernel, canonicalIdentity: digest(value.canonical_identity),
    canonicalBytes: bytes, semanticMirIdentity: digest(value.semantic_mir_v36) };
}
const AVAILABLE = ["hierarchy_inspection", "kir_sites", "call_stack", "breakpoints", "watchpoints", "forward_step",
  "reverse_step", "deterministic_replay", "kir_ssa_values", "allocation_relative_memory", "semantic_trace"];
const UNAVAILABLE: Record<string, string> = {
  source_sites: "requires_authenticated_map", source_variable_values: "requires_authenticated_map",
  register_values: "not_represented", hardware_wave_state: "logical_visualization_only",
  pause: "not_exposed_by_backend", kfd_dispatch_control: "not_exposed_by_backend",
};
function capabilities(value: unknown): void {
  const result = object(value, ["result", "capabilities"]); same(result.result, "capabilities");
  need(Array.isArray(result.capabilities) && result.capabilities.length === AVAILABLE.length + Object.keys(UNAVAILABLE).length,
    "Unsupported capability roster.");
  const seen = new Set<string>();
  for (const item of result.capabilities) {
    const row = object(item, ["name", "availability"], ["reason"]);
    need(typeof row.name === "string" && !seen.has(row.name), "Duplicate or invalid capability."); seen.add(row.name);
    if (AVAILABLE.includes(row.name)) same(row, { name: row.name, availability: "available" });
    else { need(Object.hasOwn(UNAVAILABLE, row.name), "Unknown capability."); same(row,
      { name: row.name, availability: "unavailable", reason: UNAVAILABLE[row.name] }); }
  }
}
function session(value: unknown, configuration: string, event: number, revision: number): void {
  same(value, { backend: "cpu_kir_simulator", execution_kind: "cpu_kir_simulation", state: "stopped",
    revision, configuration_identity: configuration, cursor: { configuration_identity: configuration,
      event_sequence: event, state_revision: revision }, simulated: true, hardware_observed: false, performance_prediction: false });
}
function firstEvent(value: unknown, configuration: string): NonNullable<CompleteBodyDebugCheckpointV19["observed"]> {
  const result = object(value, ["result", "stop", "snapshot", "events_advanced"]);
  same(result.result, "control"); same(result.events_advanced, 1);
  const stop = { reason: "step", outcome: "active", exact: true }; same(result.stop, stop);
  const availability = object(result.snapshot, ["status", "snapshot"]); same(availability.status, "captured");
  const snapshot = object(availability.snapshot, ["anchor", "stop", "values"]); same(snapshot.stop, stop);
  const anchor = object(snapshot.anchor, ["cursor", "scope", "site"]);
  same(anchor.cursor, { configuration_identity: configuration, event_sequence: 1, state_revision: 1 });
  // Preserve the actual full Wave64 mask as bigint. Never round it or replace it with lane 0's bit.
  const activeMask = 0xffffffffffffffffn;
  same(anchor.scope, { level: "lane", workgroup: [0, 0, 0], wave: 0, lane: 0, logical_workitem: [0, 0, 0],
    active_mask: activeMask, wave_width: 64, interpretation: "logical_visualization" });
  same(anchor.site, { kir: { function_ordinal: 0, block_ordinal: 0, point: { kind: "operation", operation_ordinal: 0 } },
    source: { status: "unavailable", reason: "requires_authenticated_map" } });
  const projected = projectResourceScalarValues(snapshot.values);
  need(projected.status === "ready", projected.status === "ready" ? "" : projected.detail);
  need(projected.rows.every(row => row.functionOrdinal === "0" && row.frame === "1"),
    "A first-event value belongs to a foreign function/frame.");
  return { functionOrdinal: 0, blockOrdinal: 0, operationOrdinal: 0, activeMask, rows: projected.rows };
}
/** Strict bounded display adapter. Even a ready result grants no source or execution authority. */
export async function projectCompleteBodyDebugV19(input: CompleteBodyDebugInputV19 | null): Promise<CompleteBodyDebugProjectionV19> {
  if (input === null) return { status: "unavailable", detail: "No V19 recording selected. No values are substituted." };
  try {
    object(input, ["selector", "requestsUtf8", "responsesUtf8"], ["metadataUtf8", "expected"]);
    same(input.selector, COMPLETE_BODY_DEBUG_SELECTOR_V19);
    const requests = lines(input.requestsUtf8), responses = lines(input.responsesUtf8), declared = metadata(input.metadataUtf8);
    const [requestSha256, responseSha256, metadataSha256] = await Promise.all([
      programSha256(input.requestsUtf8), programSha256(input.responsesUtf8),
      input.metadataUtf8 === undefined ? Promise.resolve(null) : programSha256(input.metadataUtf8),
    ]);
    if (input.expected !== undefined) {
      const expected = object(input.expected, ["requests", "responses"], ["metadata"]);
      same(digest(expected.requests), requestSha256); same(digest(expected.responses), responseSha256);
      if (Object.hasOwn(expected, "metadata")) same(digest(expected.metadata), metadataSha256);
    }
    const configuration = digest(object(responses.rows[0].session, ["backend", "execution_kind", "state", "revision",
      "configuration_identity", "cursor", "simulated", "hardware_observed", "performance_prediction"]).configuration_identity);
    const operations = ["discover_capabilities", "get_state", "step", "step", "get_state"];
    const events = [0, 0, 1, 0, 0], revisions = [0, 0, 1, 2, 2], expectedRevisions = [0, 0, 0, 1, 2];
    const checkpoints: CompleteBodyDebugCheckpointV19[] = [];
    let previousId = 0;
    for (let at = 0; at < operations.length; at++) {
      const request = requests.rows[at], response = responses.rows[at], requestId = uint(request.request_id);
      need(requestId > previousId, "Duplicate or reordered request ID."); previousId = requestId;
      same(request, { schema: "fe2o3-debug-request-v1", request_id: requestId, operation: operations[at],
        expected_revision: expectedRevisions[at], ...(operations[at] === "step" ?
          { direction: at === 2 ? "forward" : "reverse", granularity: "event", count: 1 } : {}) });
      object(response, ["schema", "request_id", "operation", "status", "session", "result"]);
      same(response.schema, "fe2o3-debug-response-v1"); same(response.request_id, requestId);
      same(response.operation, operations[at]); same(response.status, "ok");
      session(response.session, configuration, events[at], revisions[at]);
      let observed: CompleteBodyDebugCheckpointV19["observed"] = null;
      if (at === 0) capabilities(response.result);
      else if (at === 2) observed = firstEvent(response.result, configuration);
      else if (at === 3) same(response.result, { result: "control", stop: { reason: "entry", outcome: "active", exact: true },
        snapshot: { status: "unavailable", reason: "not_captured" }, events_advanced: 1 });
      else same(response.result, { result: "state", snapshot: { status: "unavailable", reason: "not_captured" } });
      if (at > 0) checkpoints.push({ requestId, label: ["", "Entry state", "First logical event",
        "Reverse-restored entry", "Restored entry state"][at], event: events[at], revision: revisions[at],
        requestUtf8: requests.original[at], responseUtf8: responses.original[at], observed });
    }
    return freeze({ status: "ready", key: requestSha256 + ":" + responseSha256 + ":" + (metadataSha256 ?? "absent"),
      configuration, requestSha256, responseSha256, metadataSha256, metadata: declared, checkpoints });
  } catch (error) {
    return { status: "invalid", detail: error instanceof Error ? error.message.slice(0, 240) : "Unsupported V19 recording." };
  }
}
