/** Viewer-only selection persistence. Existing JSONL import remains the admission
 * boundary; neither this document nor matching hashes authenticate a producer. */
import { parseProgramJson } from "./ordered-program-observation.mjs";
import { RESOURCE_IMPORT_LIMITS, type ImportedResourceRecording, type ImportedResourceCheckpoint,
  type ImportedResourcePair } from "./recorded-resource-import";
import { projectResourceAccessResponse } from "./resource-access-view";
import { projectResourceMemoryResponse, resourceSnapshotAnchorKey } from "./resource-memory-view";

export const RESOURCE_BOOKMARK_MAX_BYTES = 16 * 1024;
export const RESOURCE_BOOKMARK_SCHEMA = "fe2o3-resource-selection-bookmark-v1";
export interface ResourceBookmarkSelection {
  readonly checkpointRequestId: number;
  readonly pageRequestId: number | null;
  readonly memoryRequestId: number | null;
  readonly baseline: { readonly checkpointRequestId: number; readonly memoryRequestId: number } | null;
}
export class ResourceBookmarkError extends Error {
  constructor(detail: string) { super(detail); this.name = "ResourceBookmarkError"; }
}
type Row = Record<string, unknown>;
function check(ok: unknown, detail: string): asserts ok { if (!ok) throw new ResourceBookmarkError(detail); }
function row(value: unknown): Row {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Expected a bookmark object.");
  return value as Row;
}
function exact(value: unknown, names: string[]): Row {
  const result = row(value);
  check(Object.keys(result).length === names.length && names.every(name => Object.hasOwn(result, name)),
    "Bookmark fields are missing or unsupported.");
  return result;
}
function integer(value: unknown, minimum = 1, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function digest(value: unknown): boolean {
  return typeof value === "string" && value.length === 64 && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}
function key(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(key).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.keys(value).sort()
    .map(name => JSON.stringify(name) + ":" + key((value as Row)[name])).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
function boundedText(raw: string): void {
  check(typeof raw === "string" && raw.length > 0 && raw.length <= RESOURCE_BOOKMARK_MAX_BYTES &&
    new TextEncoder().encode(raw).byteLength <= RESOURCE_BOOKMARK_MAX_BYTES, "Bookmark must be nonempty UTF-8 at most 16 KiB.");
  check(raw.charCodeAt(0) !== 0xfeff, "Bookmark UTF-8 BOM is unsupported.");
  for (const point of raw) {
    const code = point.codePointAt(0)!;
    check(code < 0xd800 || code > 0xdfff, "Bookmark contains invalid Unicode.");
  }
}
function parsed(raw: string): Row {
  boundedText(raw);
  let value: unknown;
  try { value = parseProgramJson(raw, RESOURCE_BOOKMARK_MAX_BYTES); }
  catch { throw new ResourceBookmarkError("Malformed, duplicate-key or out-of-bounds bookmark JSON."); }
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const item = pending.pop()!;
    check(++nodes <= 512 && item.depth <= 16, "Bookmark structure exceeds its bound.");
    check(typeof item.value !== "bigint" && (typeof item.value !== "number" || integer(item.value, 0)),
      "Bookmark integers must be nonnegative and exactly representable.");
    if (item.value !== null && typeof item.value === "object") {
      const children = Object.values(item.value);
      check(children.length <= 32, "Bookmark collection exceeds its bound.");
      children.forEach(child => pending.push({ value: child, depth: item.depth + 1 }));
    }
  }
  return row(value);
}
function recordingGuard(recording: ImportedResourceRecording): void {
  check(digest(recording.requestSha256) && digest(recording.responseSha256) &&
    integer(recording.requestBytes, 1, RESOURCE_IMPORT_LIMITS.fileBytes) &&
    integer(recording.responseBytes, 1, RESOURCE_IMPORT_LIMITS.fileBytes), "Current recording byte identities are unavailable.");
  const context = exact(recording.context, ["connectionId", "captureIdentity", "target", "variantIdentity"]);
  check(context.connectionId === "local-jsonl:" + recording.requestSha256 &&
    context.captureIdentity === recording.responseSha256 && context.target === null && context.variantIdentity === null,
  "Current recording context is not the supported local import context.");
  check(Array.isArray(recording.checkpoints) && integer(recording.checkpoints.length, 1, RESOURCE_IMPORT_LIMITS.checkpoints) &&
    Array.isArray(recording.pairs) && integer(recording.pairs.length, 1, RESOURCE_IMPORT_LIMITS.pairs),
  "Current recording collections exceed import bounds.");
  let previous = 0;
  for (const pair of recording.pairs) {
    check(integer(pair.requestId) && pair.requestId > previous, "Current recording contains duplicate or unordered request IDs.");
    previous = pair.requestId;
  }
}
function retainedPair(recording: ImportedResourceRecording, pair: ImportedResourcePair): void {
  const matches = recording.pairs.filter(item => item.requestId === pair.requestId);
  check(matches.length === 1 && matches[0] === pair, "Selected pair is not uniquely retained in the current recording.");
  const request = row(pair.request), response = row(pair.response);
  check(request.request_id === pair.requestId && response.request_id === pair.requestId &&
    request.operation === response.operation && response.status === "ok", "Selected original request and response disagree.");
}
function checkpoint(recording: ImportedResourceRecording, requestId: number): ImportedResourceCheckpoint {
  const matches = recording.checkpoints.filter(item => item.control.requestId === requestId);
  check(matches.length === 1, "Selected checkpoint is missing or ambiguous.");
  const found = matches[0], anchorKey = resourceSnapshotAnchorKey(found.anchor);
  check(anchorKey !== null && anchorKey === found.anchorKey && found.control.kind === "checkpoint",
    "Selected checkpoint anchor is invalid or stale.");
  retainedPair(recording, found.control);
  const request = row(found.control.request), response = row(found.control.response);
  const result = row(response.result), snapshot = row(result.snapshot), captured = row(snapshot.snapshot);
  const session = row(response.session);
  check(request.operation === "step" && request.expected_revision === found.anchor.cursor.state_revision - 1 &&
    snapshot.status === "captured" && resourceSnapshotAnchorKey(captured.anchor) === anchorKey &&
    key(session.cursor) === key(found.anchor.cursor) && session.revision === found.anchor.cursor.state_revision &&
    session.configuration_identity === found.anchor.cursor.configuration_identity,
  "Selected control response no longer matches its checkpoint.");
  check(Array.isArray(found.pages) && found.pages.length <= RESOURCE_IMPORT_LIMITS.pairs &&
    Array.isArray(found.memories) && found.memories.length <= RESOURCE_IMPORT_LIMITS.pairs,
  "Selected checkpoint collections exceed import bounds.");
  return found;
}
function memory(recording: ImportedResourceRecording, point: ImportedResourceCheckpoint, requestId: number): void {
  const matches = point.memories.filter(item => item.requestId === requestId);
  check(matches.length === 1 && matches[0].kind === "memory", "Selected memory window is missing or ambiguous.");
  const pair = matches[0]; retainedPair(recording, pair);
  const projection = projectResourceMemoryResponse(pair.response, point.anchor), request = row(pair.request);
  check(projection.status === "ready", "Selected memory response is invalid or stale.");
  check(request.operation === "read_memory" && request.expected_revision === point.anchor.cursor.state_revision &&
    projection.requestId === requestId && key(request.allocation) === key(projection.memory.allocation) &&
    request.byte_offset === projection.memory.byte_offset && request.byte_len === projection.memory.requested_bytes,
  "Selected memory request and anchored response disagree.");
}
function page(recording: ImportedResourceRecording, point: ImportedResourceCheckpoint, requestId: number): void {
  const matches = point.pages.filter(item => item.requestId === requestId);
  check(matches.length === 1 && ["allocations", "memory_accesses"].includes(matches[0].kind),
    "Selected resource page is missing or ambiguous.");
  const pair = matches[0]; retainedPair(recording, pair);
  const projection = projectResourceAccessResponse({ response: pair.response, expectedRequest: pair.request,
    expectedSnapshot: point.anchor, context: recording.context, responseContext: recording.context });
  check(projection.status === "ready" && projection.requestId === requestId && projection.kind === pair.kind,
    "Selected resource page is invalid or stale.");
}
function selectionGuard(value: unknown): ResourceBookmarkSelection {
  const data = exact(value, ["checkpointRequestId", "pageRequestId", "memoryRequestId", "baseline"]);
  check(integer(data.checkpointRequestId) && (data.pageRequestId === null || integer(data.pageRequestId)) &&
    (data.memoryRequestId === null || integer(data.memoryRequestId)), "Bookmark request IDs are invalid.");
  let baseline: ResourceBookmarkSelection["baseline"] = null;
  if (data.baseline !== null) {
    const base = exact(data.baseline, ["checkpointRequestId", "memoryRequestId"]);
    check(integer(base.checkpointRequestId) && integer(base.memoryRequestId), "Baseline request IDs are invalid.");
    baseline = Object.freeze({ checkpointRequestId: base.checkpointRequestId, memoryRequestId: base.memoryRequestId });
  }
  return Object.freeze({ checkpointRequestId: data.checkpointRequestId, pageRequestId: data.pageRequestId,
    memoryRequestId: data.memoryRequestId, baseline });
}
function resolve(recording: ImportedResourceRecording, value: unknown) {
  recordingGuard(recording);
  const selection = selectionGuard(value), current = checkpoint(recording, selection.checkpointRequestId);
  check((selection.pageRequestId === null) === (current.pages.length === 0) &&
    (selection.memoryRequestId === null) === (current.memories.length === 0),
  "A retained page or memory window needs its exact request ID; no default is substituted.");
  if (selection.pageRequestId !== null) page(recording, current, selection.pageRequestId);
  if (selection.memoryRequestId !== null) memory(recording, current, selection.memoryRequestId);
  let baseline: ImportedResourceCheckpoint | null = null;
  if (selection.baseline !== null) {
    check(selection.memoryRequestId !== null && selection.baseline.memoryRequestId !== selection.memoryRequestId,
      "A baseline requires a distinct current memory window.");
    baseline = checkpoint(recording, selection.baseline.checkpointRequestId);
    memory(recording, baseline, selection.baseline.memoryRequestId);
    // A genuinely retained incompatible or unavailable baseline is still a
    // valid selection. The existing comparison renderer explains its refusal.
  }
  return { selection, current, baseline };
}
export function serializeResourceSelectionBookmark(recording: ImportedResourceRecording,
  selection: ResourceBookmarkSelection): string {
  const resolved = resolve(recording, selection);
  const document = { schema: RESOURCE_BOOKMARK_SCHEMA,
    recording: { requests: { sha256: recording.requestSha256, bytes: recording.requestBytes },
      responses: { sha256: recording.responseSha256, bytes: recording.responseBytes }, context: recording.context },
    selection: resolved.selection, anchor: resolved.current.anchor, baselineAnchor: resolved.baseline?.anchor ?? null };
  const raw = JSON.stringify(document, null, 2) + "\n";
  boundedText(raw);
  return raw;
}
export function restoreResourceSelectionBookmark(recording: ImportedResourceRecording, utf8: string): ResourceBookmarkSelection {
  const document = exact(parsed(utf8), ["schema", "recording", "selection", "anchor", "baselineAnchor"]);
  check(document.schema === RESOURCE_BOOKMARK_SCHEMA, "Unsupported viewer bookmark version.");
  const bytes = exact(document.recording, ["requests", "responses", "context"]);
  for (const [field, sha, count] of [["requests", recording.requestSha256, recording.requestBytes],
    ["responses", recording.responseSha256, recording.responseBytes]] as const) {
    const file = exact(bytes[field], ["sha256", "bytes"]);
    check(digest(file.sha256) && integer(file.bytes, 1, RESOURCE_IMPORT_LIMITS.fileBytes) &&
      file.sha256 === sha && file.bytes === count, "Bookmark belongs to different recording file bytes.");
  }
  exact(bytes.context, ["connectionId", "captureIdentity", "target", "variantIdentity"]);
  check(key(bytes.context) === key(recording.context), "Bookmark recording context differs.");
  const resolved = resolve(recording, document.selection);
  const expected = resourceSnapshotAnchorKey(document.anchor);
  check(expected !== null && expected === resolved.current.anchorKey, "Bookmark checkpoint anchor differs.");
  if (resolved.baseline === null) check(document.baselineAnchor === null, "Unexpected saved baseline anchor.");
  else {
    const anchor = resourceSnapshotAnchorKey(document.baselineAnchor);
    check(anchor !== null && anchor === resolved.baseline.anchorKey, "Bookmark baseline anchor differs.");
  }
  return resolved.selection;
}
/** One abortable capped file read; never reads recording files or executes a request. */
export function readResourceBookmarkFile(file: File, signal: AbortSignal): Promise<string> {
  if (signal.aborted) return Promise.reject(new DOMException("Bookmark read cancelled.", "AbortError"));
  if (!integer(file.size, 1, RESOURCE_BOOKMARK_MAX_BYTES)) {
    return Promise.reject(new ResourceBookmarkError("Bookmark must be nonempty UTF-8 at most 16 KiB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let finished = false;
    const cleanup = () => { signal.removeEventListener("abort", cancel); reader.onload = reader.onerror = reader.onabort = null; };
    const fail = (error: unknown) => { if (!finished) { finished = true; cleanup(); reject(error); } };
    const cancel = () => {
      fail(new DOMException("Bookmark read cancelled.", "AbortError"));
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
    reader.onerror = () => fail(new ResourceBookmarkError("Bookmark file could not be read."));
    reader.onabort = () => fail(new DOMException("Bookmark read cancelled.", "AbortError"));
    reader.onload = () => {
      try {
        if (signal.aborted) throw new DOMException("Bookmark read cancelled.", "AbortError");
        check(reader.result instanceof ArrayBuffer && reader.result.byteLength === file.size, "Bookmark file bytes changed.");
        const bytes = new Uint8Array(reader.result);
        check(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "Bookmark UTF-8 BOM is unsupported.");
        const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        check(new TextEncoder().encode(raw).byteLength === file.size, "Bookmark UTF-8 bytes did not round-trip.");
        boundedText(raw); finished = true; cleanup(); resolve(raw);
      } catch (error) { fail(error); }
    };
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    try { reader.readAsArrayBuffer(file); } catch (error) { fail(error); }
  });
}
