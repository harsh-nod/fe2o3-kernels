/** Local presentation of existing debugger JSONL pairs, never protocol admission.
 * No producer is authenticated and no imported request is executed. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { projectResourceAccessResponse } from "./resource-access-view";
import { projectResourceSourceValues } from "./resource-source-values";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";

export const RESOURCE_IMPORT_LIMITS = Object.freeze({
  fileBytes: 256 * 1024, lineBytes: 64 * 1024, pairs: 128, checkpoints: 32,
});
type Row = Record<string, unknown>;
export interface ImportedResourcePair {
  readonly kind: "checkpoint" | "allocations" | "memory_accesses" | "memory" | "stack" | "source_variables";
  readonly requestId: number;
  readonly line: number;
  readonly request: unknown;
  readonly response: unknown;
  /** Original line text, including its LF; not reserialized DTOs. */
  readonly requestUtf8: string;
  readonly responseUtf8: string;
  readonly rowCount?: number;
}
export interface ImportedResourceCheckpoint {
  readonly anchor: ResourceSnapshotAnchor;
  readonly anchorKey: string;
  readonly control: ImportedResourcePair;
  readonly pages: readonly ImportedResourcePair[];
  readonly memories: readonly ImportedResourcePair[];
  readonly sourceStack?: ImportedResourcePair;
  readonly sourceVariables?: readonly ImportedResourcePair[];
}
export interface ImportedResourceRecording {
  readonly requestSha256: string;
  readonly responseSha256: string;
  readonly requestBytes: number;
  readonly responseBytes: number;
  readonly context: ResourceMemoryContext;
  readonly checkpoints: readonly ImportedResourceCheckpoint[];
  readonly pairs: readonly ImportedResourcePair[];
}
export class ResourceImportError extends Error {
  constructor(readonly code: string, detail: string) {
    super(code + ": " + detail);
    this.name = "ResourceImportError";
  }
}
function refuse(code: string, detail: string): never { throw new ResourceImportError(code, detail); }
function row(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse("invalid_shape", "Expected a JSON object.");
  return value as Row;
}
function exact(value: unknown, required: string[], optional: string[] = []): Row {
  const result = row(value);
  if (!required.every(key => Object.hasOwn(result, key)) ||
      Object.keys(result).some(key => !required.includes(key) && !optional.includes(key))) {
    refuse("unsupported_fields", "A supported envelope has missing or unknown fields.");
  }
  return result;
}
function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function same(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}
function canonical(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ":" + canonical((value as Row)[key])).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Local import cancelled.", "AbortError");
}
function frozen<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) frozen(child);
    Object.freeze(value);
  }
  return value;
}
function lines(raw: string): { rows: Row[]; raw: string[]; bytes: number } {
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (!bytes || bytes > RESOURCE_IMPORT_LIMITS.fileBytes) refuse("file_limit", "Each nonempty file must be at most 256 KiB.");
  if (!raw.endsWith("\n") || raw.includes("\r") || raw.charCodeAt(0) === 0xfeff) {
    refuse("invalid_jsonl", "Use UTF-8 JSONL with LF endings, a final LF and no BOM.");
  }
  const source = raw.slice(0, -1).split("\n");
  if (source.length > RESOURCE_IMPORT_LIMITS.pairs || source.some(line => !line.trim())) {
    refuse("line_limit", "Use at most 128 nonblank paired lines.");
  }
  const rows = source.map(line => {
    try { return row(parseProgramJson(line, RESOURCE_IMPORT_LIMITS.lineBytes)); }
    catch (error) {
      if (error instanceof ResourceImportError) throw error;
      refuse("invalid_json", "A line is malformed, duplicated-key, out of bounds, or outside the lossless unsigned-integer JSON subset.");
    }
  });
  return { rows, raw: source.map(line => line + "\n"), bytes };
}
function session(value: unknown, anchor: ResourceSnapshotAnchor): void {
  const data = exact(value, ["backend", "execution_kind", "state", "revision", "configuration_identity",
    "cursor", "simulated", "hardware_observed", "performance_prediction"]);
  if (data.backend !== "cpu_kir_simulator" || data.execution_kind !== "cpu_kir_simulation" ||
      data.state !== "stopped" || data.simulated !== true || data.hardware_observed !== false ||
      data.performance_prediction !== false || data.configuration_identity !== anchor.cursor.configuration_identity ||
      data.revision !== anchor.cursor.state_revision || !same(data.cursor, anchor.cursor)) {
    refuse("stale_session", "The stopped CPU session and independent checkpoint do not agree.");
  }
}
function stepAnchor(request: Row, response: Row): ResourceSnapshotAnchor {
  exact(request, ["schema", "request_id", "expected_revision", "operation", "direction", "granularity", "count"]);
  if (request.schema !== "fe2o3-debug-request-v1" || request.operation !== "step" ||
      !["forward", "reverse"].includes(String(request.direction)) || request.granularity !== "operation" ||
      !integer(request.count, 1, 65_536) || !integer(request.expected_revision, 0, Number.MAX_SAFE_INTEGER - 1)) {
    refuse("unsupported_control", "Only recorded forward/reverse operation-step checkpoints are supported.");
  }
  exact(response, ["schema", "status", "request_id", "operation", "session", "result"]);
  if (response.schema !== "fe2o3-debug-response-v1") refuse("wrong_schema", "Expected a debugger V1 control response.");
  const result = exact(response.result, ["result", "stop", "snapshot", "events_advanced"]);
  const stop = exact(result.stop, ["reason", "outcome", "exact"]);
  const availability = exact(result.snapshot, ["status", "snapshot"]);
  const snapshot = exact(availability.snapshot, ["anchor", "stop", "values"]);
  if (result.result !== "control" || stop.reason !== "step" || stop.outcome !== "active" || stop.exact !== true ||
      availability.status !== "captured" || !same(snapshot.stop, stop) || !Array.isArray(snapshot.values) ||
      !integer(result.events_advanced) || !resourceSnapshotAnchorKey(snapshot.anchor)) {
    refuse("unsupported_checkpoint", "A captured exact active step anchor with exactly representable metadata is required.");
  }
  // Import acceptance retains values verbatim. A separate optional presentation
  // guard checks supported scalar values; its refusal does not reject this import.
  const anchor = snapshot.anchor as ResourceSnapshotAnchor;
  if (anchor.scope.level !== "lane" || anchor.cursor.event_sequence === 0 ||
      anchor.cursor.state_revision !== request.expected_revision + 1) {
    refuse("stale_checkpoint", "The independent logical-lane step checkpoint must advance its request revision once.");
  }
  session(response.session, anchor);
  return anchor;
}

/** Read at most one capped browser File; abort stops the actual FileReader. */
export function readResourceImportFile(file: File, signal: AbortSignal): Promise<string> {
  aborted(signal);
  if (!integer(file.size, 1, RESOURCE_IMPORT_LIMITS.fileBytes)) {
    return Promise.reject(new ResourceImportError("file_limit", "Each nonempty file must be at most 256 KiB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let finished = false;
    const cleanup = () => {
      signal.removeEventListener("abort", cancel);
      reader.onload = reader.onerror = reader.onabort = null;
    };
    const fail = (error: unknown) => { if (!finished) { finished = true; cleanup(); reject(error); } };
    const cancel = () => {
      fail(new DOMException("Local import cancelled.", "AbortError"));
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
    reader.onerror = () => fail(new ResourceImportError("file_read", "The selected file could not be read."));
    reader.onabort = () => fail(new DOMException("Local import cancelled.", "AbortError"));
    reader.onload = () => {
      try {
        aborted(signal);
        if (!(reader.result instanceof ArrayBuffer) || reader.result.byteLength !== file.size) {
          refuse("file_read", "File bytes changed or could not be read completely.");
        }
        const bytes = new Uint8Array(reader.result);
        if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) refuse("invalid_utf8", "A UTF-8 BOM is not supported.");
        const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (new TextEncoder().encode(utf8).byteLength !== file.size) refuse("invalid_utf8", "UTF-8 bytes did not round-trip.");
        finished = true; cleanup(); resolve(utf8);
      } catch (error) { fail(error); }
    };
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    try { reader.readAsArrayBuffer(file); } catch (error) { fail(error); }
  });
}

export async function importResourceRecording(requestUtf8: string, responseUtf8: string,
  signal?: AbortSignal): Promise<ImportedResourceRecording> {
  aborted(signal);
  const requests = lines(requestUtf8), responses = lines(responseUtf8);
  if (requests.rows.length !== responses.rows.length) refuse("unpaired", "Request and response line counts differ.");
  const [requestSha256, responseSha256] = await Promise.all([programSha256(requestUtf8), programSha256(responseUtf8)]);
  aborted(signal);
  const context: ResourceMemoryContext = {
    connectionId: "local-jsonl:" + requestSha256,
    captureIdentity: responseSha256, target: null, variantIdentity: null,
  };
  const checkpoints: { anchor: ResourceSnapshotAnchor; anchorKey: string; control: ImportedResourcePair;
    pages: ImportedResourcePair[]; memories: ImportedResourcePair[]; sourceStack?: ImportedResourcePair;
    sourceVariables: ImportedResourcePair[] }[] = [];
  const pairs: ImportedResourcePair[] = [];
  const tokens = new Map<string, string>();
  const consumed = new Set<string>();
  let previousId = 0, configuration: string | null = null, sourceMap: string | null | undefined;
  for (let index = 0; index < requests.rows.length; index++) {
    aborted(signal);
    const request = requests.rows[index], response = responses.rows[index];
    if (!integer(request.request_id, 1) || request.request_id <= previousId) {
      refuse("duplicate_or_order", "Request IDs must be unique and strictly increasing in the retained excerpt.");
    }
    previousId = request.request_id;
    if (response.request_id !== request.request_id || response.operation !== request.operation) {
      refuse("unpaired", "Each response must occupy the same line as its exact request ID and operation.");
    }
    if (response.status !== "ok") refuse("response_refused", "Error, unavailable and stale responses are not successful resource data.");
    const base = { requestId: request.request_id, line: index + 1, request, response,
      requestUtf8: requests.raw[index], responseUtf8: responses.raw[index] };
    if (request.operation === "step") {
      const anchor = stepAnchor(request, response), anchorKey = resourceSnapshotAnchorKey(anchor)!;
      if (configuration !== null && configuration !== anchor.cursor.configuration_identity) {
        refuse("cross_capture", "Checkpoint configuration identities differ.");
      }
      configuration = anchor.cursor.configuration_identity;
      const map = anchor.site?.source.status === "resolved" ? anchor.site.source.location.map_identity : null;
      if (sourceMap !== undefined && sourceMap !== map) refuse("cross_capture", "Checkpoint source-map associations differ.");
      sourceMap = map;
      if (checkpoints.length && anchor.cursor.state_revision <= checkpoints[checkpoints.length - 1].anchor.cursor.state_revision) {
        refuse("stale_checkpoint", "Checkpoint revisions must increase; event sequences may move backward.");
      }
      if (checkpoints.length >= RESOURCE_IMPORT_LIMITS.checkpoints) refuse("checkpoint_limit", "At most 32 checkpoints may be imported.");
      const pair: ImportedResourcePair = { ...base, kind: "checkpoint" };
      checkpoints.push({ anchor, anchorKey, control: pair, pages: [], memories: [], sourceVariables: [] });
      pairs.push(pair);
      continue;
    }
    const checkpoint = checkpoints.at(-1);
    if (!checkpoint) refuse("missing_anchor", "Retain the preceding independent captured operation-step pair.");
    session(response.session, checkpoint.anchor);
    if (request.expected_revision !== checkpoint.anchor.cursor.state_revision) {
      refuse("stale_request", "Resource request revision does not match the preceding independent checkpoint.");
    }
    let pair: ImportedResourcePair;
    if (request.operation === "inspect_stack") {
      if (checkpoint.sourceStack) refuse("duplicate_stack", "Retain one complete stack for source-variable frame refinement.");
      pair = { ...base, kind: "stack" };
      checkpoint.sourceStack = pair;
    } else if (request.operation === "inspect_source_variables") {
      pair = { ...base, kind: "source_variables" };
      checkpoint.sourceVariables.push(pair);
    } else if (request.operation === "read_memory") {
      exact(request, ["schema", "request_id", "expected_revision", "operation", "allocation", "byte_offset", "byte_len"]);
      const allocation = exact(request.allocation, ["ordinal", "generation"]);
      if (request.schema !== "fe2o3-debug-request-v1" || !integer(allocation.ordinal, 1) || allocation.generation !== 0 ||
          !integer(request.byte_offset) || !integer(request.byte_len, 1, 4096)) {
        refuse("unsupported_memory", "Use a generation-zero allocation and an exact bounded allocation-relative byte window.");
      }
      const projection = projectResourceMemoryResponse(response, checkpoint.anchor);
      if (projection.status !== "ready") refuse("memory_refused", projection.detail);
      if (projection.requestId !== request.request_id || !same(projection.memory.allocation, allocation) ||
          projection.memory.byte_offset !== request.byte_offset || projection.memory.requested_bytes !== request.byte_len) {
        refuse("unpaired_memory", "Read-memory allocation and byte range disagree with the original request.");
      }
      pair = { ...base, kind: "memory" }; checkpoint.memories.push(pair);
    } else if (request.operation === "query_allocations" || request.operation === "query_memory_accesses") {
      const projection = projectResourceAccessResponse({ response, expectedSnapshot: checkpoint.anchor,
        expectedRequest: request, context, responseContext: context });
      if (projection.status !== "ready") refuse("resource_refused", projection.detail);
      const page = row(request.page), responsePage = row(response.page);
      const { request_id: ignoredId, page: ignoredPage, ...query } = request;
      void ignoredId; void ignoredPage;
      const queryKey = canonical(query) + ":" + checkpoint.anchorKey;
      if (page.token !== undefined) {
        if (typeof page.token !== "string" || tokens.get(page.token) !== queryKey || consumed.has(page.token)) {
          refuse("stale_token", "A page token must come from an earlier matching retained response and may be consumed only once.");
        }
        consumed.add(page.token);
      }
      if (responsePage.next_token !== undefined) {
        const token = String(responsePage.next_token);
        if (tokens.has(token)) refuse("duplicate_token", "A retained next-page token was reused.");
        tokens.set(token, queryKey);
      }
      pair = { ...base, kind: projection.kind, rowCount: projection.rows.length }; checkpoint.pages.push(pair);
    } else {
      refuse("unsupported_operation", "Use step checkpoints, resource queries, read_memory, and complete same-stop stack/source-variable pairs.");
    }
    pairs.push(pair);
  }
  if (!checkpoints.length || checkpoints.some(checkpoint => !checkpoint.pages.length && !checkpoint.memories.length)) {
    refuse("empty_checkpoint", "Every retained checkpoint must include at least one supported resource response.");
  }
  for (const checkpoint of checkpoints) {
    if (checkpoint.sourceStack || checkpoint.sourceVariables.length) {
      const projection = projectResourceSourceValues(checkpoint, checkpoint.sourceStack ?? null, checkpoint.sourceVariables);
      if (projection.status !== "ready") refuse("source_values_refused", projection.detail);
    }
  }
  aborted(signal);
  return frozen({ requestSha256, responseSha256, requestBytes: requests.bytes, responseBytes: responses.bytes,
    context, checkpoints, pairs });
}
