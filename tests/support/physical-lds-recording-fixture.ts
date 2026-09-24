import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { LDS_RECORDINGS } from "../../src/content/physical-lds-debug-v22-recordings";
import { parseProgramJson } from "../../src/content/ordered-program-observation.mjs";
import { type LdsInput } from "../../src/content/physical-lds-debug-v22-input";
import { type Row } from "../../src/content/physical-entry-debug-v20-shapes";
export function retained(which = 0): LdsInput {
  const p = LDS_RECORDINGS[which], read = (path: string) => readFileSync(new URL("../../public" + path, import.meta.url));
  return { indexUtf8: gunzipSync(read(p.index.path), { maxOutputLength: 8 * 1024 * 1024 }).toString("utf8"),
    documentUtf8: read(p.document.path).toString("utf8"), requestsUtf8: read(p.requests.path).toString("utf8"),
    responsesUtf8: read(p.responses.path).toString("utf8"), expected: {
      index: p.index.raw.sha256, document: p.document.sha256, requests: p.requests.sha256, responses: p.responses.sha256,
    } };
}
export function wire(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(wire).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.entries(value).map(([k, v]) => JSON.stringify(k) + ":" + wire(v)).join(",") + "}";
  return JSON.stringify(value) ?? "null";
}
export function rows(raw: string): Row[] { return raw.trimEnd().split("\n").map(line => parseProgramJson(line, 65536) as Row); }
export function protocolMutation(change: (q: Row[], r: Row[]) => void): LdsInput {
  const input = retained(), q = rows(input.requestsUtf8), r = rows(input.responsesUtf8); change(q, r);
  return { ...input, expected: undefined, requestsUtf8: q.map(wire).join("\n") + "\n", responsesUtf8: r.map(wire).join("\n") + "\n" };
}
export function indexMutation(change: (p: Row) => void): LdsInput {
  const input = retained(), raw = JSON.parse(input.indexUtf8) as Row, payload = raw.payload as Row;
  change(payload); const bytes = Buffer.from(JSON.stringify(payload)), length = Buffer.alloc(8); length.writeBigUInt64LE(BigInt(bytes.length));
  raw.identity = { sha256: createHash("sha256").update("fe2o3-debug-physical-lds-v22-capture-index-v1\0").update(length).update(bytes).digest("hex"), payload_bytes: bytes.length };
  return { ...input, expected: undefined, indexUtf8: JSON.stringify(raw) + "\n" };
}
export const result = (r: Row) => r.result as Row;
export const session = (r: Row) => r.session as Row;
