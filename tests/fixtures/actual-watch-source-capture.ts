// ACTUAL retained bytes only. Missing or changed files fail; there is no synthetic fallback.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseProgramJson } from "../../src/content/ordered-program-observation.mjs";
import { WATCH_SOURCE_FILES, type WatchSourceFiles, type WatchSourceFileRole } from "../../src/content/recorded-watch-source-observation";
import type { MutableResourceControl as Row } from "./recorded-resource-import";
export const ACTUAL_WATCH_SOURCE_DIRECTORY = "examples/watch-source-replay-v2";
export const ACTUAL_WATCH_SOURCE_RECEIPT_SHA256 = "d6d58a1d6acf73921e7b475d8e24fef8eea6ce55a90c0982d30243156fbdb6a1";
function requireFact(ok: unknown, detail: string): asserts ok { if (!ok) throw new Error("Actual watch/source fixture: " + detail); }
export function readActualWatchSourceCapture() {
  function read(name: string, limit: number) {
    let bytes: Buffer;
    try { bytes = readFileSync(resolve(ACTUAL_WATCH_SOURCE_DIRECTORY, name)); }
    catch { throw new Error("Missing actual watch/source fixture: " + ACTUAL_WATCH_SOURCE_DIRECTORY + "/" + name); }
    requireFact(bytes.length > 0 && bytes.length <= limit, "file exceeds bounded role: " + name); return bytes;
  }
  const provenance = parseProgramJson(read("provenance.json", 256 * 1024).toString("utf8"), 256 * 1024) as Row;
  requireFact(provenance.kind === "retained_actual_capture" && provenance.source_authentication === false &&
    provenance.hardware_observed === false && provenance.performance_prediction === false, "unsupported provenance claims");
  requireFact(Array.isArray(provenance.retained_files) && provenance.retained_files.length === WATCH_SOURCE_FILES.length, "exact seven pins required");
  const files = {} as Record<WatchSourceFileRole, string>, buffers = {} as Record<WatchSourceFileRole, Buffer>;
  for (const spec of WATCH_SOURCE_FILES) {
    const bytes = read(spec.leaf, spec.limit), digest = createHash("sha256").update(bytes).digest("hex");
    const pins = (provenance.retained_files as Row[]).filter(p => p.path === spec.leaf);
    requireFact(pins.length === 1 && pins[0].bytes === bytes.length && pins[0].sha256 === digest, "provenance pin mismatch: " + spec.leaf);
    if (spec.role === "receipt") requireFact(digest === ACTUAL_WATCH_SOURCE_RECEIPT_SHA256, "not the separately qualified original capture receipt");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    requireFact(Buffer.byteLength(text) === bytes.length && text.charCodeAt(0) !== 0xfeff &&
      text.endsWith("\n") && !text.includes("\r"), "original UTF-8/LF bytes required");
    files[spec.role] = text; buffers[spec.role] = bytes;
  }
  const receipt = parseProgramJson(files.receipt, 1024 ** 2) as Row;
  requireFact(receipt.status === "passed" && receipt.purpose === "existing-public-watchpoint-source-variable-resource-qualification" &&
    receipt.raw_line_preservation === true && receipt.source_authentication === false && receipt.hardware_observed === false &&
    receipt.performance_prediction === false && Array.isArray(receipt.checkpoints) && receipt.checkpoints.length === 3, "capture contract differs");
  const pins = [...receipt.raw_transcripts, ...receipt.excerpts] as Row[];
  for (const spec of WATCH_SOURCE_FILES.filter(s => s.role !== "receipt")) {
    const matches = pins.filter(p => p.path === spec.leaf);
    requireFact(matches.length === 1 && matches[0].bytes === buffers[spec.role].length &&
      matches[0].sha256 === createHash("sha256").update(buffers[spec.role]).digest("hex"), "capture pin mismatch: " + spec.leaf);
  }
  const requestLines = files.fullRequests.slice(0, -1).split("\n"), responseLines = files.fullResponses.slice(0, -1).split("\n");
  requireFact(requestLines.length === responseLines.length && requestLines.length === receipt.full_pairs && requestLines.length <= 128, "full pair roster differs");
  const pairs = requestLines.map((request, i) => {
    const req = parseProgramJson(request, 65536) as Row, res = parseProgramJson(responseLines[i], 65536) as Row;
    requireFact(req.request_id === i + 1 && res.request_id === req.request_id && res.operation === req.operation, "full paired identity differs");
    return { request: req, response: res, requestUtf8: request + "\n", responseUtf8: responseLines[i] + "\n" };
  });
  const byId = (id: number) => { const p = pairs.find(p => p.request.request_id === id); requireFact(p, "missing pair " + id); return p; };
  for (const [ids, requestRole, responseRole] of [
    [receipt.watchpoint_request_ids, "watchRequests", "watchResponses"],
    [receipt.source_request_ids, "sourceRequests", "sourceResponses"],
  ] as [number[], WatchSourceFileRole, WatchSourceFileRole][]) {
    requireFact(ids.map(id => byId(id).requestUtf8).join("") === files[requestRole], "excerpt request bytes changed");
    requireFact(ids.map(id => byId(id).responseUtf8).join("") === files[responseRole], "excerpt response bytes changed");
  }
  const groups = (receipt.checkpoints as Row[]).map(summary => {
    const control = byId(summary.control_request_id), stack = byId(summary.control_request_id + 1);
    const pages = (summary.source_request_ids as number[]).map(byId), memory = byId(pages.at(-1)!.request.request_id + 1);
    requireFact(control.request.operation === "step" && stack.request.operation === "inspect_stack" &&
      pages.length >= 2 && pages.every(p => p.request.operation === "inspect_source_variables" && p.response.status === "ok") &&
      memory.request.operation === "read_memory", "complete source group roster differs");
    const sourceRows = pages.flatMap(p => p.response.values as Row[]), ssaRows = control.response.result.snapshot.snapshot.values as Row[];
    requireFact(sourceRows.length === summary.source_count && ssaRows.length === summary.ssa_count, "receipt row count differs");
    return { summary, control, stack, pages, memory, sourceRows, ssaRows };
  });
  const watch = byId(receipt.watchpoint_request_ids[4]), immediate = byId(receipt.watchpoint_request_ids[5]);
  const immediateStack = byId(immediate.request.request_id + 1);
  const refusals = (receipt.refusals as Row[]).map(r => {
    const p = byId(r.request_id); requireFact(p.response.status === r.status && (p.response.reason ?? p.response.error?.code) === r.reason, "refusal differs");
    return p;
  });
  return { files: Object.freeze(files) as WatchSourceFiles, buffers, provenance, receipt, pairs, byId, groups, watch, immediate, immediateStack, refusals };
}
