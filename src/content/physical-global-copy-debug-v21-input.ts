/** Closed V21 recording envelope and declared request joins; never source custody. */
import { parseProgramJson, programSha256 } from "./ordered-program-observation.mjs";
import { digest, need, object, same, uint, vector,
  type PhysicalObservationV20 } from "./physical-entry-debug-v20-shapes";
export const PHYSICAL_COPY_SELECTOR_V21 = "--diagnostic-kir-v21";
export const PHYSICAL_COPY_SCHEMA_V21 = "fe2o3-recorded-physical-global-copy-cpu-v21";
export const PHYSICAL_COPY_LIMITS_V21 = Object.freeze({
  fileBytes: 256 * 1024, documentBytes: 16384, requestBytes: 8192,
  responseBytes: 65536, pairs: 256, records: 8192, page: 64, memoryBytes: 256,
  allocationBytes: 4096, valueRows: 16384, memoryCells: 65536,
});
export interface PhysicalCopyInputV21 {
  readonly containerUtf8: string;
  readonly expectedSha256?: string;
}
export interface CopyAllocationV21 {
  readonly name: "input" | "output"; readonly access: "read_only" | "read_write";
  readonly allocation: number; readonly parameter: number; readonly backing: number;
  readonly offset: number; readonly elements: number;
  readonly bytes: readonly string[]; readonly initialized: readonly boolean[];
}
export interface CopyLocationV21 {
  readonly index: number; readonly block: number; readonly operation: number;
  readonly phase: "before_operation" | "after_operation";
}
export type CopyStageV21 = "load_before" | "pending" | "wait_before" | "ready" | "store_before" | "store_after";
export interface CopyContextV21 {
  readonly containerSha256: string; readonly simulationRequestSha256: string;
  readonly canonicalIdentity: string; readonly canonicalBytes: number;
  readonly feature: string; readonly entry: string; readonly grid: number;
  readonly configuration: string; readonly records: number; readonly finalIndex: number;
  readonly loadedValue: number; readonly stages: Readonly<Record<CopyStageV21, CopyLocationV21>>;
  readonly allocations: readonly CopyAllocationV21[];
  readonly requestsUtf8: string; readonly responsesUtf8: string;
}
export interface CopyFactsV21 {
  readonly stages: Readonly<Record<CopyStageV21, number>>;
  readonly pendingQuery: number; readonly readyQuery: number; readonly reversePendingQuery: number;
  readonly finalInputQueries: readonly number[]; readonly finalOutputQueries: readonly number[];
  readonly inputUnchangedBytes: number; readonly copiedWords: number; readonly outputCanaryBytes: number;
}
export interface PhysicalCopyRecordingV21 {
  readonly status: "ready"; readonly key: string; readonly configuration: string;
  readonly requestSha256: string; readonly responseSha256: string;
  readonly records: readonly PhysicalObservationV20[]; readonly context: CopyContextV21; readonly facts: CopyFactsV21;
}
export type PhysicalCopyProjectionV21 = PhysicalCopyRecordingV21 |
  { readonly status: "invalid" | "unavailable"; readonly detail: string };
export const COPY_STAGES_V21: readonly CopyStageV21[] = [
  "load_before", "pending", "wait_before", "ready", "store_before", "store_after",
];
export function boundedText(value: unknown, cap: number): string {
  need(typeof value === "string" && value.length > 0 && value.length <= cap,
    "Text exceeds the closed V21 recording limit.");
  need(new TextEncoder().encode(value).byteLength <= cap, "UTF-8 bytes exceed the recording limit.");
  return value;
}
function bytes(value: unknown, limit: number): string[] {
  need(typeof value === "string" && /^0x(?:[0-9a-f]{2})*$/u.test(value) &&
    value.length > 2 && value.length <= 2 + limit * 2, "Invalid bounded byte encoding.");
  return value.slice(2).match(/../gu)!;
}
function initialized(value: unknown, count: number): boolean[] {
  const data = bytes(value, Math.ceil(count / 8)); same(data.length, Math.ceil(count / 8));
  const bits = data.map(n => Number.parseInt(n, 16));
  if (count % 8) same(bits.at(-1)! >> (count % 8), 0);
  return Array.from({ length: count }, (_, i) => (bits[Math.floor(i / 8)] & (1 << (i % 8))) !== 0);
}
async function configuration(identity: string, canonicalBytes: number, request: string): Promise<string> {
  const domain = new TextEncoder().encode("fe2o3-debug-physical-global-copy-v21-cpu-config-v1\0");
  const requestHash = await programSha256(request);
  const constants = [8192, 65536, 64, 4096, 1 << 29, 512 * 1024 * 1024, 8192,
    8192 * 128 + 65536 * 4, 1024, 8192 * 1024 * 4 + 65536 * 4 + 65536,
    1, 768, 8, 16384, 131072, 1, 128, 1, 768, 8, 4096, 8192,
    64 * 1024 * 1024, 1024, 128, 2, 128, 32768, 1];
  const raw = new Uint8Array(domain.length + 32 + 8 + 32 + 8 + constants.length * 8);
  raw.set(domain);
  let at = domain.length;
  for (const [hash, count] of [[identity, canonicalBytes], [requestHash, new TextEncoder().encode(request).byteLength]] as const) {
    raw.set(Uint8Array.from(hash.match(/../gu)!.map(x => Number.parseInt(x, 16))), at); at += 32;
    new DataView(raw.buffer).setBigUint64(at, BigInt(count), true); at += 8;
  }
  for (const n of constants) { new DataView(raw.buffer).setBigUint64(at, BigInt(n), true); at += 8; }
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", raw)),
    n => n.toString(16).padStart(2, "0")).join("");
}
export async function copyContextV21(input: PhysicalCopyInputV21): Promise<CopyContextV21> {
  // The cap is applied before parser, hash and any derived view construction.
  const text = boundedText(input.containerUtf8, PHYSICAL_COPY_LIMITS_V21.fileBytes);
  const envelope = object(parseProgramJson(text, PHYSICAL_COPY_LIMITS_V21.fileBytes),
    ["schema", "selector", "declared", "simulationRequestUtf8", "requestsUtf8", "responsesUtf8"]);
  same(envelope.schema, PHYSICAL_COPY_SCHEMA_V21); same(envelope.selector, PHYSICAL_COPY_SELECTOR_V21);
  const containerSha256 = await programSha256(text);
  if (input.expectedSha256 !== undefined) same(containerSha256, digest(input.expectedSha256));
  const declared = object(envelope.declared, ["canonicalIdentity", "canonicalBytes", "feature", "entry", "locations"]);
  const canonicalIdentity = digest(declared.canonicalIdentity), canonicalBytes = uint(declared.canonicalBytes, 131072);
  need(canonicalBytes > 0, "Missing declared canonical bytes.");
  need(typeof declared.entry === "string" && /^[A-Za-z_][A-Za-z0-9_]{0,127}$/u.test(declared.entry),
    "Unsupported declared entry symbol.");
  need(declared.feature === "physical-global-copy-one-v21" || declared.feature === "physical-global-copy-registers-v21",
    "This first recorded lesson covers the declared one-block and register-edited profiles only.");
  same(declared.entry, declared.feature === "physical-global-copy-one-v21" ? "physical_global_copy_one" : "physical_global_copy_registers");
  const simulationRequest = boundedText(envelope.simulationRequestUtf8, PHYSICAL_COPY_LIMITS_V21.documentBytes);
  const document = object(parseProgramJson(simulationRequest, PHYSICAL_COPY_LIMITS_V21.documentBytes),
    ["schema", "kernel", "grid", "workgroup", "shared_buffers", "arguments"]);
  same(document.schema, "fe2o3-simulation-request-v1"); same(document.kernel, declared.entry);
  const grid = vector(document.grid); need(grid[0] === 64 || grid[0] === 128, "Closed one/two-workgroup recording subset.");
  same(grid.slice(1), [1, 1]); same(document.workgroup, [64, 1, 1]);
  need(Array.isArray(document.shared_buffers) && document.shared_buffers.length === 2 &&
    Array.isArray(document.arguments) && document.arguments.length === 2, "Exactly two recorded buffers and arguments required.");
  const locations = object(declared.locations, ["schema", "canonical_identity", "canonical_bytes", "request_sha256", "records",
    "loaded_value_id", "allocations", ...COPY_STAGES_V21, "final_checkpoint_index", "source_custody", "hardware_observed",
    "runtime_authority", "protected_authority", "resumable_execution"]);
  same(locations.schema, "fe2o3-physical-global-copy-public-cli-locations-v21");
  same(locations.canonical_identity, "0x" + canonicalIdentity); same(locations.canonical_bytes, canonicalBytes);
  const simulationRequestSha256 = await programSha256(simulationRequest);
  same(locations.request_sha256, "0x" + simulationRequestSha256);
  for (const name of ["source_custody", "hardware_observed", "runtime_authority", "protected_authority", "resumable_execution"])
    same(locations[name], false);
  const records = uint(locations.records, PHYSICAL_COPY_LIMITS_V21.records); need(records > 0, "Missing capture extent.");
  const finalIndex = uint(locations.final_checkpoint_index, records - 1), loadedValue = uint(locations.loaded_value_id, 767);
  need(Array.isArray(locations.allocations) && locations.allocations.length === 2, "Two declared allocation joins required.");
  const allocationRows = locations.allocations;
  const buffers = document.shared_buffers.map(raw => object(raw, ["id", "element", "access", "alignment", "bytes", "initialized"]));
  need(new Set(buffers.map(b => uint(b.id))).size === 2, "Repeated backing ID.");
  const allocations = document.arguments.map((raw, i): CopyAllocationV21 => {
    const argument = object(raw, ["kind", "backing", "element", "access", "alignment", "byte_offset", "elements"]);
    const name = i === 0 ? "input" : "output", access = i === 0 ? "read_only" : "read_write";
    same(argument.kind, "buffer_view"); same(argument.element, "u32"); same(argument.access, access); same(argument.alignment, 4);
    const backing = uint(argument.backing), matches = buffers.filter(b => b.id === backing); same(matches.length, 1);
    const buffer = matches[0]; same(buffer.element, "u32"); same(buffer.access, access); same(buffer.alignment, 4);
    const data = bytes(buffer.bytes, PHYSICAL_COPY_LIMITS_V21.allocationBytes), init = initialized(buffer.initialized, data.length);
    const offset = uint(argument.byte_offset, data.length), elements = uint(argument.elements, 1024);
    need(offset % 4 === 0 && offset + elements * 4 <= data.length, "Recorded view exceeds backing storage.");
    if (i === 0) need(elements >= grid[0] && init.slice(offset, offset + grid[0] * 4).every(Boolean),
      "Full-EXEC input read requires all resident input bytes initialized, independently of output extent.");
    const allocation = object(allocationRows[i], ["id", "parameter", "offset", "bytes"]);
    same(allocation.offset, offset); same(allocation.bytes, data.length);
    const id = uint(allocation.id, 128), parameter = uint(allocation.parameter, 767); need(id > 0, "Missing allocation ordinal.");
    return { name, access, allocation: id, parameter, backing, offset, elements, bytes: data, initialized: init };
  });
  need(allocations[0].allocation !== allocations[1].allocation && allocations[0].backing !== allocations[1].backing &&
    allocations[0].parameter !== allocations[1].parameter && allocations.every(a => a.parameter !== loadedValue),
    "Distinct declared input/output/loaded bindings required.");
  const stages = {} as Record<CopyStageV21, CopyLocationV21>;
  let previous = -1;
  for (const [i, key] of COPY_STAGES_V21.entries()) {
    const point = object(locations[key], ["index", "block", "operation", "phase"]);
    const index = uint(point.index, records - 1); need(index > previous, "Reordered declared stages."); previous = index;
    const block = uint(point.block, 0xffff_ffff), operation = uint(point.operation, 4096);
    const phase = i % 2 ? "after_operation" : "before_operation"; same(point.phase, phase);
    stages[key] = { index, block, operation, phase };
  }
  need(finalIndex >= previous, "Final capture precedes declared store.");
  same(stages.load_before.block, stages.pending.block); same(stages.load_before.operation, stages.pending.operation);
  same(stages.wait_before.block, stages.ready.block); same(stages.wait_before.operation, stages.ready.operation);
  same(stages.ready.operation, stages.pending.operation + 1);
  same(stages.store_before.block, stages.store_after.block); same(stages.store_before.operation, stages.store_after.operation);
  return { containerSha256, simulationRequestSha256, canonicalIdentity, canonicalBytes,
    feature: declared.feature, entry: declared.entry, grid: grid[0],
    configuration: await configuration(canonicalIdentity, canonicalBytes, simulationRequest),
    records, finalIndex, loadedValue, stages, allocations,
    requestsUtf8: boundedText(envelope.requestsUtf8, PHYSICAL_COPY_LIMITS_V21.fileBytes),
    responsesUtf8: boundedText(envelope.responsesUtf8, PHYSICAL_COPY_LIMITS_V21.fileBytes) };
}
