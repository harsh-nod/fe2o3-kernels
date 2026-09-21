/** Pure local selection format, not capture admission, a debugger request,
 * producer/source authentication, or compilation/execution authority.
 * No files, storage, network, or processes are accessed by these functions. */
import { parseProgramJson } from "./ordered-program-observation.mjs";
import { importRecordedWatchpoint, WATCHPOINT_IMPORT_LIMITS,
  type RecordedWatchpointObservation } from "./recorded-watchpoint-observation";

export const WATCHPOINT_BOOKMARK_MAX_BYTES = 16 * 1024;
export const WATCHPOINT_BOOKMARK_SCHEMA = "fe2o3-watchpoint-moment-bookmark-v1";
export type WatchpointBookmarkMoment = "registration" | "stop" | "checkpoint";
export class WatchpointBookmarkError extends Error {
  constructor(detail: string) { super(detail); this.name = "WatchpointBookmarkError"; }
}
type Row = Record<string, unknown>;
function check(ok: unknown, detail: string): asserts ok {
  if (!ok) throw new WatchpointBookmarkError(detail);
}
function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Watchpoint bookmark cancelled.", "AbortError");
}
function moment(value: unknown): WatchpointBookmarkMoment {
  check(value === "registration" || value === "stop" || value === "checkpoint",
    "Select an explicit supported watchpoint moment.");
  return value;
}
function object(value: unknown): value is Row {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function exact(value: unknown, names: string[]): Row {
  check(object(value) && Object.keys(value).length === names.length &&
    names.every(name => Object.hasOwn(value, name)), "Bookmark fields are missing or unsupported.");
  return value;
}
function boundedText(raw: string): void {
  check(typeof raw === "string" && raw.length > 0 && raw.length <= WATCHPOINT_BOOKMARK_MAX_BYTES &&
    new TextEncoder().encode(raw).byteLength <= WATCHPOINT_BOOKMARK_MAX_BYTES,
  "Bookmark must be nonempty UTF-8 at most 16 KiB.");
  check(raw.charCodeAt(0) !== 0xfeff, "Bookmark UTF-8 BOM is unsupported.");
  for (const point of raw) {
    const code = point.codePointAt(0)!;
    check(code < 0xd800 || code > 0xdfff, "Bookmark contains invalid Unicode.");
  }
}
/** Compare bounded plain data without stringifying opaque u64 values.
 * Cycles, oversized containers and excessive depth/work refuse; no getters or
 * unusual prototypes are part of an imported recording's supported shape. */
function sameData(left: unknown, right: unknown, detail: string): void {
  let nodes = 0;
  function visit(a: unknown, b: unknown, depth: number): void {
    check(++nodes <= 131_072 && depth <= 32, "Recording comparison exceeds its bound.");
    check(typeof a === typeof b && (a === null) === (b === null), detail);
    if (typeof a === "string") {
      check(a.length <= WATCHPOINT_IMPORT_LIMITS.fileBytes && a === b, detail); return;
    }
    if (a === null || typeof a !== "object") {
      check(["undefined", "boolean", "number", "bigint"].includes(typeof a) || a === null, detail);
      check(a === b, detail); return;
    }
    if (Array.isArray(a)) {
      check(Array.isArray(b) && a.length <= 1024 && a.length === b.length, detail);
      check(Object.keys(a).length === a.length && Object.keys(b).length === b.length, detail);
      for (let i = 0; i < a.length; i++) {
        const first = Object.getOwnPropertyDescriptor(a, String(i));
        const second = Object.getOwnPropertyDescriptor(b, String(i));
        check(first && second && Object.hasOwn(first, "value") && Object.hasOwn(second, "value"), detail);
        visit(first.value, second.value, depth + 1);
      }
      return;
    }
    check(object(a) && object(b), detail);
    const keys = Object.keys(a).sort(), other = Object.keys(b).sort();
    check(keys.length <= 128 && keys.length === other.length, detail);
    for (let i = 0; i < keys.length; i++) {
      check(keys[i] === other[i], detail);
      const first = Object.getOwnPropertyDescriptor(a, keys[i]);
      const second = Object.getOwnPropertyDescriptor(b, keys[i]);
      check(first && second && Object.hasOwn(first, "value") && Object.hasOwn(second, "value"), detail);
      visit(first.value, second.value, depth + 1);
    }
  }
  visit(left, right, 0);
}
function parsed(raw: string): Row {
  boundedText(raw);
  let value: unknown;
  try { value = parseProgramJson(raw, WATCHPOINT_BOOKMARK_MAX_BYTES); }
  catch { throw new WatchpointBookmarkError("Malformed, duplicate-key or out-of-bounds bookmark JSON."); }
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const item = pending.pop()!;
    check(++nodes <= 512 && item.depth <= 16, "Bookmark structure exceeds its bound.");
    check(typeof item.value !== "bigint" && (typeof item.value !== "number" ||
      (Number.isSafeInteger(item.value) && item.value >= 0)), "Bookmark metadata integers must be exact.");
    if (item.value !== null && typeof item.value === "object") {
      const children = Object.values(item.value);
      check(children.length <= 32, "Bookmark collection exceeds its bound.");
      children.forEach(child => pending.push({ value: child, depth: item.depth + 1 }));
    }
  }
  return exact(value, ["schema", "recording", "watchpoint", "selection", "momentBinding"]);
}
async function current(recording: RecordedWatchpointObservation,
  signal?: AbortSignal): Promise<RecordedWatchpointObservation> {
  aborted(signal);
  check(object(recording), "Current observation must be plain retained data.");
  const retained = Object.getOwnPropertyDescriptor(recording, "pairs");
  check(retained && Object.hasOwn(retained, "value") && Array.isArray(retained.value) &&
    retained.value.length === WATCHPOINT_IMPORT_LIMITS.pairs, "Require the seven currently imported pairs.");
  const requests: string[] = [], responses: string[] = [];
  let requestBytes = 0, responseBytes = 0;
  for (let index = 0; index < WATCHPOINT_IMPORT_LIMITS.pairs; index++) {
    const entry = Object.getOwnPropertyDescriptor(retained.value, String(index));
    check(entry && Object.hasOwn(entry, "value") && object(entry.value), "Current retained pair is invalid.");
    const pair = entry.value;
    const request = Object.getOwnPropertyDescriptor(pair, "requestUtf8");
    const response = Object.getOwnPropertyDescriptor(pair, "responseUtf8");
    check(request && response && Object.hasOwn(request, "value") && Object.hasOwn(response, "value"),
      "Current retained line bytes are unavailable.");
    const first: unknown = request.value, second: unknown = response.value;
    check(typeof first === "string" && typeof second === "string" && first.length > 0 && second.length > 0 &&
      first.length <= WATCHPOINT_IMPORT_LIMITS.lineBytes + 1 && second.length <= WATCHPOINT_IMPORT_LIMITS.lineBytes + 1,
    "Current retained line exceeds its bound.");
    requestBytes += new TextEncoder().encode(first).byteLength;
    responseBytes += new TextEncoder().encode(second).byteLength;
    check(requestBytes <= WATCHPOINT_IMPORT_LIMITS.fileBytes && responseBytes <= WATCHPOINT_IMPORT_LIMITS.fileBytes,
      "Current recording exceeds its file bounds.");
    requests.push(first); responses.push(second);
  }
  // Re-derive hashes, the exact seven-pair chain and all model facts from original
  // strings. A caller-edited cached hash/anchor/model is not sufficient.
  let derived: RecordedWatchpointObservation;
  try { derived = await importRecordedWatchpoint(requests.join(""), responses.join(""), signal); }
  catch (error) {
    aborted(signal);
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new WatchpointBookmarkError("Current original pairs do not form the supported watchpoint recording.");
  }
  aborted(signal);
  sameData(recording, derived, "Current derived observation differs from its retained original pairs.");
  return derived;
}
function documentFor(recording: RecordedWatchpointObservation, selected: WatchpointBookmarkMoment) {
  const { initial, registration, stop, checkpoint, memory } = recording;
  // No checkpoint/source/value fields exist in the stop branch. The registration
  // anchor is explicitly the earlier inventory anchor, not a watch-stop anchor.
  const momentBinding = selected === "registration" ? {
    kind: "earlier_registration_and_inventory",
    initialRequestId: initial.pair.requestId,
    inventoryRequestId: recording.pairs[1].requestId,
    registrationRequestId: registration.pair.requestId,
    listingRequestId: registration.listingPair.requestId,
    initialAnchor: initial.anchor,
  } : selected === "stop" ? {
    kind: "uncaptured_watchpoint_stop",
    stopRequestId: stop.pair.requestId, watchpointId: stop.watchpointId,
    cursor: stop.cursor, snapshot: stop.snapshot, origin: stop.origin,
  } : {
    kind: "separate_later_checkpoint",
    checkpointRequestId: checkpoint.pair.requestId, memoryRequestId: memory.pair.requestId,
    anchor: checkpoint.anchor, belongsTo: memory.belongsTo,
  };
  return {
    schema: WATCHPOINT_BOOKMARK_SCHEMA,
    recording: { requests: { sha256: recording.requestSha256, bytes: recording.requestBytes },
      responses: { sha256: recording.responseSha256, bytes: recording.responseBytes }, context: recording.context },
    watchpoint: { registrationRequestId: registration.pair.requestId, listingRequestId: registration.listingPair.requestId,
      watchpointId: registration.watchpointId, spec: registration.spec },
    selection: { moment: selected }, momentBinding,
  };
}
/** Save only the chosen moment. Raw-pair, memory-cell, interpretation, pointer,
 * viewport and comparison selections are intentionally not persistent. */
export async function serializeWatchpointMomentBookmark(recording: RecordedWatchpointObservation,
  selected: WatchpointBookmarkMoment, signal?: AbortSignal): Promise<string> {
  aborted(signal);
  const selectedMoment = moment(selected);
  const derived = await current(recording, signal);
  aborted(signal);
  const raw = JSON.stringify(documentFor(derived, selectedMoment), null, 2) + "\n";
  boundedText(raw);
  return raw;
}
/** Restore only after the entire document joins the already-imported recording.
 * The caller must check its current import ticket and reset child state even
 * when the returned moment equals the existing selection. */
export async function restoreWatchpointMomentBookmark(recording: RecordedWatchpointObservation,
  utf8: string, signal?: AbortSignal): Promise<WatchpointBookmarkMoment> {
  aborted(signal);
  const document = parsed(utf8);
  check(document.schema === WATCHPOINT_BOOKMARK_SCHEMA, "Unsupported watchpoint bookmark version.");
  const selected = moment(exact(document.selection, ["moment"]).moment);
  const derived = await current(recording, signal);
  aborted(signal);
  sameData(document, documentFor(derived, selected), "Bookmark does not match this exact recording and moment.");
  return selected;
}
