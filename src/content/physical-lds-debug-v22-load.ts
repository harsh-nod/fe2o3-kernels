/** Fixed same-origin assets only; imported files cannot select URLs. */
import { aborted, collectBounded, hashBytes, LDS_LIMITS, readIndexStream } from "./physical-lds-debug-v22-framing";
import { need, same } from "./physical-entry-debug-v20-shapes";
import { LDS_RECORDINGS } from "./physical-lds-debug-v22-recordings";
import { type LdsInput } from "./physical-lds-debug-v22-input";
export async function loadLdsRecording(id: string, signal: AbortSignal): Promise<LdsInput> {
  const entry = LDS_RECORDINGS.find(v => v.id === id); need(entry, "Unknown bundled recording.");
  async function get(pin: { path: string; bytes: number; sha256: string }, cap: number): Promise<Uint8Array<ArrayBuffer>> {
    aborted(signal);
    const response = await fetch(import.meta.env.BASE_URL + pin.path.slice(1), { signal, credentials: "omit", redirect: "error" });
    need(response.ok && response.body, "Recording asset unavailable.");
    const raw = await collectBounded(response.body, cap, signal); same(raw.byteLength, pin.bytes); same(await hashBytes(raw), pin.sha256); aborted(signal); return raw;
  }
  const compressed = await get(entry.index, LDS_LIMITS.compressedBytes);
  const indexUtf8 = await readIndexStream(new Blob([compressed]).stream(), true, signal);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const documentUtf8 = decoder.decode(await get(entry.document, LDS_LIMITS.documentBytes));
  const requestsUtf8 = decoder.decode(await get(entry.requests, LDS_LIMITS.jsonlBytes));
  const responsesUtf8 = decoder.decode(await get(entry.responses, LDS_LIMITS.jsonlBytes));
  aborted(signal);
  return { indexUtf8, documentUtf8, requestsUtf8, responsesUtf8, expected: {
    index: entry.index.raw.sha256, document: entry.document.sha256, requests: entry.requests.sha256, responses: entry.responses.sha256,
  } };
}
