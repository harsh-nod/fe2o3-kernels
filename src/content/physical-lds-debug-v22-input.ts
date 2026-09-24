/** Inert request/configuration joins. No byte-to-source or host authority. */
import { parseProgramJson } from "./ordered-program-observation.mjs";
import { aborted, boundedText, hashBytes, LDS_LIMITS, programSha256 } from "./physical-lds-debug-v22-framing";
import { parseLdsIndex, type LdsIndex } from "./physical-lds-debug-v22-index";
import { digest, freeze, need, object, same, uint } from "./physical-entry-debug-v20-shapes";
export interface LdsInput {
  readonly indexUtf8: string; readonly documentUtf8: string; readonly requestsUtf8: string; readonly responsesUtf8: string;
  readonly expected?: Readonly<{ index: string; document: string; requests: string; responses: string }>;
}
export interface LdsBuffer {
  readonly parameter: number; readonly backing: number; readonly elements: number;
  readonly bytes: readonly string[]; readonly initialized: readonly boolean[]; readonly offset: number;
}
export interface LdsContext {
  readonly index: LdsIndex; readonly entry: string; readonly input: LdsBuffer; readonly output: LdsBuffer;
  readonly requestsUtf8: string; readonly responsesUtf8: string;
  readonly documentDigest: string; readonly requestsDigest: string; readonly responsesDigest: string;
}
export function bytes(value: unknown, count: number): string[] {
  need(typeof value === "string" && value.length === 2 + count * 2 && /^0x[0-9a-f]*$/u.test(value), "Invalid bounded bytes.");
  return value.slice(2).match(/../gu) ?? [];
}
export function initialized(value: unknown, count: number): boolean[] {
  const data = bytes(value, Math.ceil(count / 8)).map(n => Number.parseInt(n, 16));
  if (count % 8) same(data.at(-1)! >> (count % 8), 0);
  return Array.from({ length: count }, (_, i) => (data[Math.floor(i / 8)] & (1 << (i % 8))) !== 0);
}
export async function ldsConfiguration(identity: string, canonicalBytes: number, requestHash: string, requestBytes: number): Promise<string> {
  const domain = new TextEncoder().encode("fe2o3-debug-physical-lds-exchange-v22-cpu-config-v1\0");
  const constants = [8192, 65536, 64, 4096, 1 << 29, 512 * 1024 * 1024, 16384,
    8192 * 128 + 65536 * 4, 1024, 8192 * 1024 * 4 + 65536 * 4 + 65536,
    1, 768, 8, 16384, 131072, 1, 128, 1, 768, 8, 4096, 8192, 64 * 1024 * 1024, 1024,
    128, 2, 128, 32768, 1];
  const caps = [8388608, 8387584, 16384, 8, 768, 8, 16384, 8454144, 50462720];
  const raw = new Uint8Array(domain.length + 80 + constants.length * 8 + 1 + caps.length * 8);
  raw.set(domain); let at = domain.length;
  for (const [hash, count] of [[identity, canonicalBytes], [requestHash, requestBytes]] as const) {
    digest(hash); raw.set(Uint8Array.from(hash.match(/../gu)!.map(x => Number.parseInt(x, 16))), at); at += 32;
    new DataView(raw.buffer).setBigUint64(at, BigInt(count), true); at += 8;
  }
  for (const n of constants) { new DataView(raw.buffer).setBigUint64(at, BigInt(n), true); at += 8; }
  raw[at++] = 1; // The index exists only on the explicitly export-enabled route.
  for (const n of caps) { new DataView(raw.buffer).setBigUint64(at, BigInt(n), true); at += 8; }
  same(at, raw.length); return hashBytes(raw);
}
export async function ldsContext(input: LdsInput, signal?: AbortSignal): Promise<LdsContext> {
  const caps = [LDS_LIMITS.indexBytes, LDS_LIMITS.documentBytes, LDS_LIMITS.jsonlBytes, LDS_LIMITS.jsonlBytes];
  const texts = [input.indexUtf8, input.documentUtf8, input.requestsUtf8, input.responsesUtf8];
  let total = 0;
  texts.forEach((text, i) => { boundedText(text, caps[i]); total += new TextEncoder().encode(text).byteLength; });
  need(total <= LDS_LIMITS.aggregateBytes, "Aggregate recording bound exceeded."); aborted(signal);
  const index = await parseLdsIndex(input.indexUtf8, signal);
  const hashes = await Promise.all(texts.slice(1).map(programSha256)); aborted(signal);
  const [documentDigest, requestsDigest, responsesDigest] = hashes;
  if (input.expected) {
    const expected = object(input.expected, ["index", "document", "requests", "responses"]);
    same(index.rawDigest, digest(expected.index)); same(documentDigest, digest(expected.document));
    same(requestsDigest, digest(expected.requests)); same(responsesDigest, digest(expected.responses));
  }
  same(index.requestDigest, documentDigest); same(index.requestBytes, new TextEncoder().encode(input.documentUtf8).byteLength);
  const d = object(parseProgramJson(input.documentUtf8, LDS_LIMITS.documentBytes),
    ["schema", "kernel", "grid", "workgroup", "shared_buffers", "arguments"]);
  same(d.schema, "fe2o3-simulation-request-v1");
  need(d.kernel === "physical_lds_exchange_one" || d.kernel === "physical_lds_exchange_registers", "Unsupported declared lesson entry.");
  same(d.grid, [128, 1, 1]); same(d.workgroup, [128, 1, 1]);
  need(Array.isArray(d.shared_buffers) && d.shared_buffers.length === 2 && Array.isArray(d.arguments) && d.arguments.length === 2,
    "Expected two logical buffer arguments.");
  const buffers = d.shared_buffers, arguments_ = d.arguments;
  const logical: LdsBuffer[] = arguments_.map((raw, parameter) => {
    const a = object(raw, ["kind", "backing", "element", "access", "alignment", "byte_offset", "elements"]);
    same(a.kind, "buffer_view"); same(a.element, "u32"); same(a.alignment, 4); same(a.byte_offset, 8);
    const access = parameter === 0 ? "read_only" : "read_write"; same(a.access, access);
    const backing = uint(a.backing), matching = buffers.filter(b => (b as { id?: unknown })?.id === backing);
    need(matching.length === 1, "Unjoined backing buffer.");
    const b = object(matching[0], ["id", "element", "access", "alignment", "bytes", "initialized"]);
    same(b.element, "u32"); same(b.access, access); same(b.alignment, 4);
    const count = parameter === 0 ? 528 : 532, rawBytes = bytes(b.bytes, count), init = initialized(b.initialized, count);
    const elements = uint(a.elements, 129);
    if (parameter === 0) { same(elements, 128); need(init.slice(8, 520).every(Boolean), "The full128-word input prefix must be initialized."); }
    else need([0, 13, 129].includes(elements), "This first lesson supports empty,13 or129 output words.");
    need(8 + elements * 4 <= count, "Declared view outside backing.");
    return { parameter, backing, elements, bytes: rawBytes, initialized: init, offset: 8 };
  });
  need(logical[0].backing !== logical[1].backing, "Same-backing input/output is outside this profile.");
  const configuration = await ldsConfiguration(index.canonicalIdentity, index.canonicalBytes, documentDigest, index.requestBytes);
  aborted(signal); same(configuration, index.configuration);
  return freeze({ index, entry: d.kernel, input: logical[0], output: logical[1],
    requestsUtf8: input.requestsUtf8, responsesUtf8: input.responsesUtf8, documentDigest, requestsDigest, responsesDigest });
}
