/** V22-only bounded byte readers/framing. Never execute imported instructions. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { need, object, same, uint, type Row } from "./physical-entry-debug-v20-shapes";
export const LDS_LIMITS = Object.freeze({
  indexBytes: 8 * 1024 * 1024, compressedBytes: 1024 * 1024, payloadBytes: 8387584,
  records: 16384, rowBytes: 16384, documentBytes: 16384, jsonlBytes: 1024 * 1024,
  requestBytes: 8192, responseBytes: 65536, pairs: 192, valueRows: 8192, memoryCells: 8192,
  allocations: 8, pending: 8, page: 64, memoryPage: 256, chunks: 65536,
  aggregateBytes: 11 * 1024 * 1024,
});
export function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Recording read cancelled.", "AbortError");
}
export async function collectBounded(
  stream: ReadableStream<Uint8Array>, cap: number, signal?: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  aborted(signal);
  const reader = stream.getReader(), chunks: Uint8Array[] = [];
  let bytes = 0, count = 0;
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    for (;;) {
      aborted(signal);
      const next = await reader.read(); aborted(signal);
      if (next.done) break;
      // Native streams may supply genuine Uint8Arrays from another realm.
      need(ArrayBuffer.isView(next.value) && Object.prototype.toString.call(next.value) === "[object Uint8Array]",
        "Byte stream must contain Uint8Array chunks.");
      need(++count <= LDS_LIMITS.chunks, "Byte stream chunk bound exceeded.");
      // Reject before retaining, concatenating or parsing this output chunk.
      need(next.value.byteLength <= cap - bytes, "Recording byte limit exceeded.");
      bytes += next.value.byteLength; if (next.value.byteLength) chunks.push(next.value);
    }
    const result = new Uint8Array(bytes); let at = 0;
    for (const chunk of chunks) { result.set(chunk, at); at += chunk.byteLength; }
    aborted(signal); return result;
  } catch (error) {
    await reader.cancel().catch(() => undefined); throw error;
  } finally {
    signal?.removeEventListener("abort", cancel); reader.releaseLock();
  }
}
export async function readIndexStream(
  source: ReadableStream<Uint8Array>, gzip: boolean, signal?: AbortSignal,
): Promise<string> {
  aborted(signal);
  let stream = source;
  if (gzip) {
    need(typeof DecompressionStream !== "undefined", "Gzip decompression is unavailable; no fallback interpretation.");
    let inputBytes = 0, chunks = 0;
    const bounded = new TransformStream<Uint8Array, Uint8Array<ArrayBuffer>>({
      transform(chunk, controller) {
        aborted(signal); need(++chunks <= LDS_LIMITS.chunks, "Compressed chunk limit exceeded.");
        need(chunk.byteLength <= LDS_LIMITS.compressedBytes - inputBytes, "Compressed input exceeds 1 MiB.");
        inputBytes += chunk.byteLength; controller.enqueue(Uint8Array.from(chunk));
      },
    });
    stream = source.pipeThrough(bounded).pipeThrough(new DecompressionStream("gzip"));
  }
  const raw = await collectBounded(stream, LDS_LIMITS.indexBytes, signal);
  need(raw.byteLength > 0, "Empty index.");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(raw); aborted(signal); return text;
}
export async function readLdsFile(file: File, kind: "index" | "document" | "jsonl", signal: AbortSignal): Promise<string> {
  const gzip = kind === "index" && (file.name.endsWith(".gz") || file.name.endsWith(".gzip"));
  const cap = kind === "index" ? (gzip ? LDS_LIMITS.compressedBytes : LDS_LIMITS.indexBytes)
    : kind === "document" ? LDS_LIMITS.documentBytes : LDS_LIMITS.jsonlBytes;
  need(file.size > 0 && file.size <= cap, "Selected file exceeds the V22 input bound.");
  aborted(signal);
  if (kind === "index") return readIndexStream(file.stream(), gzip, signal);
  const bytes = await collectBounded(file.stream(), cap, signal);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); aborted(signal); return text;
}
export function boundedText(raw: string, cap: number): void {
  need(typeof raw === "string" && raw.length > 0 && raw.length <= cap &&
    new TextEncoder().encode(raw).byteLength <= cap, "UTF-8 input exceeds its bound.");
}
export async function hashBytes(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  need(globalThis.crypto?.subtle, "WebCrypto is unavailable.");
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), n => n.toString(16).padStart(2, "0")).join("");
}
export { programSha256 };
/** Exact producer ASCII envelope. Per-row JSON uses the unchanged lossless parser. */
export async function frameIndex(raw: string, signal?: AbortSignal): Promise<{
  header: Row; records: Row[]; rawDigest: string; payloadDigest: string;
}> {
  boundedText(raw, LDS_LIMITS.indexBytes); aborted(signal);
  need(/^[\x20-\x7e]*\n$/u.test(raw), "Index must be the exact one-line ASCII producer output.");
  const prefix = /^\{"schema":"fe2o3-physical-lds-cpu-capture-index-v1","identity":\{"sha256":"([a-f0-9]{64})","payload_bytes":([1-9][0-9]{0,6})\},"payload":/u.exec(raw);
  need(prefix && raw.endsWith("]}}\n"), "Unsupported V22 index envelope.");
  const marker = ',"records":[', markerAt = raw.indexOf(marker, prefix[0].length);
  need(markerAt > prefix[0].length && markerAt === raw.lastIndexOf(marker), "Missing or ambiguous records field.");
  const headerText = raw.slice(prefix[0].length, markerAt) + ',"records":[]}';
  const header = object(parseProgramJson(headerText, 16384),
    ["configuration_identity", "canonical", "request", "outcome", "capture_stop", "record_count", "simulated",
      "hardware_observed", "performance_prediction", "provenance", "wave_interpretation", "unavailable", "allocations", "records"]);
  const payload = new TextEncoder().encode(raw.slice(prefix[0].length, -2));
  need(payload.length <= LDS_LIMITS.payloadBytes, "Payload bound exceeded."); same(payload.length, Number(prefix[2]));
  const domain = new TextEncoder().encode("fe2o3-debug-physical-lds-v22-capture-index-v1\0");
  const hashed = new Uint8Array(domain.length + 8 + payload.length);
  hashed.set(domain); new DataView(hashed.buffer).setBigUint64(domain.length, BigInt(payload.length), true);
  hashed.set(payload, domain.length + 8);
  const payloadDigest = await hashBytes(hashed); aborted(signal); same(payloadDigest, prefix[1]);
  const records: Row[] = []; let at = markerAt + marker.length;
  const end = raw.length - 4;
  while (at < end) {
    aborted(signal); need(records.length < LDS_LIMITS.records && raw[at] === "{", "Invalid index row boundary.");
    const start = at; let depth = 0, quoted = false, escaped = false;
    for (; at < end; at++) {
      need(at - start < LDS_LIMITS.rowBytes, "Index row byte bound exceeded.");
      const char = raw[at];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === "{" || char === "[") { depth++; need(depth <= 24, "Index row nesting exceeded."); }
      else if (char === "}" || char === "]") {
        need(depth > 0, "Unbalanced row.");
        if (--depth === 0) { at++; break; }
      }
    }
    need(!quoted && depth === 0 && at > start, "Truncated index row.");
    records.push(object(parseProgramJson(raw.slice(start, at), LDS_LIMITS.rowBytes),
      ["sequence", "producer_ordinal", "scope", "site", "payload"]));
    if (at === end) break;
    need(raw[at++] === "," && at < end, "Invalid record separator.");
  }
  same(records.length, uint(header.record_count, LDS_LIMITS.records)); need(records.length > 0, "Missing observations.");
  const rawDigest = await programSha256(raw); aborted(signal);
  return { header, records, rawDigest, payloadDigest };
}
