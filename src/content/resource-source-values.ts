/** Read-only presentation checks, not Rust admission or producer authentication.
 * The framed query is an explicit refinement of a retained unframed checkpoint.
 * Never use equal values or names as a source-variable-to-SSA correspondence. */
import type { ImportedResourceCheckpoint } from "./recorded-resource-import";
import { projectResourceCheckpointValues } from "./resource-checkpoint-values";
import { resourceSnapshotAnchorKey, type ResourceSnapshotAnchor } from "./resource-memory-view";

export const RESOURCE_SOURCE_VALUE_LIMITS = Object.freeze({ rows: 64, pages: 32, nameBytes: 4096 });
export interface ResourceSourceValuePair {
  readonly requestId: number;
  readonly request: unknown;
  readonly response: unknown;
}
export interface ResourceSourceValueRow {
  readonly identity: string;
  readonly name: string;
  readonly functionOrdinal: number;
  readonly scopeIdentity: string;
  readonly scopeDepth: number;
  readonly generation: string;
  readonly status: "captured" | "unavailable" | "redacted" | "ambiguous";
  readonly typeLabel: string;
  readonly representation: string;
  readonly interpretation: string;
}
export type ResourceSourceValuesProjection = {
  readonly status: "ready";
  readonly checkpointAnchor: ResourceSnapshotAnchor;
  readonly sourceAnchor: ResourceSnapshotAnchor;
  readonly checkpointRequestId: number;
  readonly stackRequestId: number;
  readonly sourceRequestIds: readonly number[];
  readonly stackFrameCount: 1 | 2;
  readonly totalSsaValueCount: number;
  readonly stackFrame: { readonly frame: 1 | 2; readonly functionOrdinal: number; readonly blockOrdinal: number;
    readonly nextOperation: number; readonly valueCount: number };
  readonly rows: readonly ResourceSourceValueRow[];
} | { readonly status: "invalid" | "stale" | "unsupported" | "unavailable"; readonly detail: string };

type Row = Record<string, unknown>;
class Refusal extends Error {
  constructor(readonly status: "invalid" | "stale" | "unsupported", detail: string) { super(detail); }
}
function need(ok: unknown, detail: string, status: Refusal["status"] = "invalid"): asserts ok {
  if (!ok) throw new Refusal(status, detail);
}
function object(value: unknown): Row {
  need(value !== null && typeof value === "object" && !Array.isArray(value), "Expected a source-query object.");
  return value as Row;
}
function exact(value: unknown, fields: readonly string[]): Row {
  const row = object(value);
  need(Object.keys(row).length === fields.length && fields.every(key => Object.hasOwn(row, key)),
    "Missing or unsupported source-query fields.");
  return row;
}
function integer(value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
function digest(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value);
}
function u64(value: unknown, minimum = 0n): string {
  need((typeof value === "bigint" || integer(value)) && BigInt(value as number | bigint) >= minimum &&
    BigInt(value as number | bigint) <= 0xffff_ffff_ffff_ffffn, "An identity or offset is not an exact unsigned 64-bit integer.");
  return String(value);
}
function equal(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => equal(value, right[index]));
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  const a = left as Row, b = right as Row, keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
}
function same(value: unknown, expected: unknown, detail: string): void { need(equal(value, expected), detail, "stale"); }

const UNAVAILABLE = new Set(["not_represented", "not_captured", "optimized_out", "outside_capture_scope", "not_in_scope",
  "not_live", "uninitialized", "truncated", "unsupported_by_backend", "requires_authenticated_map"]);
const REDACTED = new Set(["native_address", "runtime_handle", "policy"]);
const SPACES = new Set(["private", "workgroup", "global", "constant", "generic"]);
function availability(value: unknown, generation: string): Pick<ResourceSourceValueRow, "status" | "typeLabel" | "representation" | "interpretation"> {
  const wrapper = object(value);
  if (wrapper.status === "ambiguous") {
    exact(wrapper, ["status"]);
    return { status: "ambiguous", typeLabel: "Not supplied", representation: "ambiguous",
      interpretation: "The producer did not identify one value. No candidate is chosen by name or bits." };
  }
  exact(wrapper, ["status", "value"]); need(wrapper.status === "value", "Unknown source-variable availability.");
  const data = object(wrapper.value);
  if (data.status === "unavailable" || data.status === "redacted") {
    exact(data, ["status", "reason"]);
    need(typeof data.reason === "string" && (data.status === "unavailable" ? UNAVAILABLE : REDACTED).has(data.reason),
      "Unknown source-variable availability reason.");
    if (data.status === "redacted" || ["uninitialized", "not_live", "truncated"].includes(data.reason)) {
      need(generation !== "0", "This availability requires a represented storage generation.");
    }
    return { status: data.status, typeLabel: "Not supplied", representation: data.reason,
      interpretation: "No value supplied; this is not zero or false." };
  }
  exact(data, ["status", "value_type", "value", "provenance"]);
  need(data.status === "captured", "Unknown value availability.");
  need(data.provenance === "simulated_observation", "Only recorded simulated values are supported; hardware values are not relabeled.", "unsupported");
  need(generation !== "0", "A captured source variable needs a represented storage generation.");
  const type = object(data.value_type);
  if (type.kind === "pointer") {
    exact(type, ["kind", "address_space"]);
    need(typeof type.address_space === "string" && SPACES.has(type.address_space), "Unknown pointer address space.");
    const pointer = exact(data.value, ["encoding", "allocation", "byte_offset"]), allocation = exact(pointer.allocation, ["ordinal", "generation"]);
    need(pointer.encoding === "allocation_relative_pointer", "Pointer type/encoding mismatch.");
    const ordinal = u64(allocation.ordinal, 1n), allocationGeneration = u64(allocation.generation), offset = u64(pointer.byte_offset);
    need(allocationGeneration === "0", "Nonzero allocation generations are outside this recorded profile.", "unsupported");
    return { status: "captured", typeLabel: `${type.address_space} pointer`, representation: `alloc#${ordinal}:g${allocationGeneration} + ${offset} bytes`,
      interpretation: "Recorded allocation-relative pointer; not dereferenced, not a native address or lifetime proof." };
  }
  let width: number, label: string;
  if (type.kind === "bool") { exact(type, ["kind"]); width = 1; label = "bool"; }
  else if (type.kind === "integer") {
    exact(type, ["kind", "signed", "bits"]);
    need(typeof type.signed === "boolean" && integer(type.bits, 1, 4096), "Invalid integer type.");
    need(type.bits <= 64, "Integers wider than 64 bits are not displayed.", "unsupported");
    width = type.bits; label = `${type.signed ? "i" : "u"}${width}`;
  } else if (type.kind === "index" || type.kind === "float") {
    exact(type, ["kind", "bits"]);
    need(integer(type.bits) && (type.kind === "index" ? [32, 64] : [16, 32, 64]).includes(type.bits), "Invalid scalar width.");
    width = type.bits; label = type.kind === "index" ? `index${width}` : `f${width} (raw bits)`;
  } else throw new Refusal("unsupported", "Aggregates, byte arrays and unknown types remain unsupported in this scalar panel.");
  const bits = exact(data.value, ["encoding", "bits"]);
  need(bits.encoding === "bits" && typeof bits.bits === "string" && bits.bits.length === 2 + Math.ceil(width / 4) &&
    /^0x[0-9a-f]+$/u.test(bits.bits), "Scalar bits are not canonical for their declared width.");
  const unsigned = BigInt(bits.bits), modulus = 1n << BigInt(width);
  need(unsigned < modulus, "Scalar bits exceed their declared width.");
  const interpretation = type.kind === "float" ? "Raw bits only; floating-point decoding is not inferred."
    : type.kind === "bool" ? (unsigned === 0n ? "false" : "true")
    : String(type.kind === "integer" && type.signed && unsigned >= modulus / 2n ? unsigned - modulus : unsigned);
  return { status: "captured", typeLabel: label, representation: bits.bits, interpretation };
}
function variable(value: unknown, functionOrdinal: number): ResourceSourceValueRow {
  const row = exact(value, ["variable_identity", "name", "function_ordinal", "scope_identity", "scope_depth", "generation", "availability"]);
  need(digest(row.variable_identity) && digest(row.scope_identity), "Invalid source-variable or scope identity.");
  need(typeof row.name === "string" && row.name.length > 0 && row.name.length <= RESOURCE_SOURCE_VALUE_LIMITS.nameBytes &&
    new TextEncoder().encode(row.name).byteLength <= RESOURCE_SOURCE_VALUE_LIMITS.nameBytes && !/[\p{Cc}\p{Cs}]/u.test(row.name), "Invalid source-variable name.");
  same(row.function_ordinal, functionOrdinal, "A source variable belongs to another function.");
  need(integer(row.scope_depth, 0, 4096), "Invalid lexical scope depth.");
  const generation = u64(row.generation);
  return { identity: row.variable_identity, name: row.name, functionOrdinal, scopeIdentity: row.scope_identity,
    scopeDepth: row.scope_depth, generation, ...availability(row.availability, generation) };
}

export function projectResourceSourceValues(checkpoint: ImportedResourceCheckpoint,
  stackPair: ResourceSourceValuePair | null, sourcePages: readonly ResourceSourceValuePair[]): ResourceSourceValuesProjection {
  if (stackPair === null && sourcePages.length === 0) return { status: "unavailable", detail: "No source-variable query was retained for this checkpoint." };
  try {
    need(stackPair !== null && sourcePages.length > 0, "Retain both the independent stack and source-variable pages.");
    need(sourcePages.length <= RESOURCE_SOURCE_VALUE_LIMITS.pages, "The source-variable page budget was exceeded.", "unsupported");
    const checkpointValues = projectResourceCheckpointValues(checkpoint);
    if (checkpointValues.status !== "ready") return { status: checkpointValues.status, detail: checkpointValues.detail };
    const anchor = checkpointValues.anchor;
    exact(anchor, ["cursor", "scope", "site"]);
    need(anchor.site?.source.status === "resolved" && anchor.site.source.location.provenance === "compiler_bundle_bound" &&
      anchor.site.kir.point.kind === "operation", "The supported profile needs a retained compiler-bundle-bound source operation.", "unsupported");
    const functionOrdinal = anchor.site.kir.function_ordinal;
    const controlResponse = object(checkpoint.control.response), stopped = object(controlResponse.session);
    let previousId = checkpoint.control.requestId;
    const pair = (value: ResourceSourceValuePair, operation: string, schema: string) => {
      need(integer(value.requestId, 1) && value.requestId > previousId, "Retained query IDs must be unique and ordered."); previousId = value.requestId;
      const request = object(value.request), response = object(value.response);
      same(request.request_id, value.requestId, "Source-query request identity changed.");
      same(response.request_id, value.requestId, "Source-query response identity changed.");
      same(request.operation, operation, "Unsupported source-query operation."); same(response.operation, operation, "Mismatched source-query operation.");
      same(request.schema, schema, "Unsupported source-query request schema.");
      same(response.schema, schema.replace("request", "response"), "Unsupported source-query response schema.");
      need(response.status === "ok", "No successful source-variable data was captured at this stop.", "unsupported");
      same(request.expected_revision, anchor.cursor.state_revision, "Source query uses another revision.");
      same(response.session, stopped, "Source query uses another session, stop or truth classification.");
      return { request, response };
    };
    const stack = pair(stackPair, "inspect_stack", "fe2o3-debug-request-v1");
    exact(stack.request, ["schema", "request_id", "expected_revision", "operation", "scope", "page"]);
    exact(stack.response, ["status", "schema", "request_id", "operation", "session", "result"]);
    same(stack.request.scope, { level: "dispatch" }, "The supported stack query uses dispatch selection.");
    const stackPage = exact(stack.request.page, ["limit"]); need(integer(stackPage.limit, 1, 64), "Invalid stack page limit.");
    const result = exact(stack.response.result, ["result", "snapshot", "frames"]);
    need(result.result === "stack", "Expected a captured stack result.");
    same(resourceSnapshotAnchorKey(result.snapshot), checkpoint.anchorKey, "The stack is not from the exact independent checkpoint.");
    need(Array.isArray(result.frames) && (result.frames.length === 1 || result.frames.length === 2),
      "Only a complete root frame or root plus current helper frame is supported.", "unsupported");
    need(result.frames.length <= stackPage.limit, "The retained stack exceeds the requested page.");
    const stackFrameCount = result.frames.length as 1 | 2;
    let totalSsaValueCount = 0;
    const frames = result.frames.map((raw, index) => {
      const rawFrame = object(raw);
      const item = exact(rawFrame, ["frame", "function_ordinal", "block_ordinal", "values",
        ...(Object.hasOwn(rawFrame, "next_operation") ? ["next_operation"] : [])]);
      same(item.frame, index + 1, "The retained stack frame identities are not contiguous.");
      need(integer(item.function_ordinal) && integer(item.block_ordinal), "Invalid recorded stack coordinates.");
      if (Object.hasOwn(item, "next_operation")) need(integer(item.next_operation), "Invalid recorded next operation.");
      const values = exact(item.values, ["status", "value_count"]);
      need(values.status === "captured" && integer(values.value_count, 0, 64),
        "Stack values were not completely retained within the scalar budget.", "unsupported");
      const ssaRows = checkpointValues.rows.filter(row => row.frame === String(item.frame));
      same(ssaRows.length, values.value_count, "A frame's complete SSA table and stack value count differ.");
      for (const row of ssaRows) same(row.functionOrdinal, String(item.function_ordinal),
        "A retained SSA value belongs to another function.");
      totalSsaValueCount += values.value_count;
      return item;
    });
    same(totalSsaValueCount, checkpointValues.rows.length, "The complete stack does not account for every retained SSA value.");
    if (stackFrameCount === 2) need(frames[0].function_ordinal !== frames[1].function_ordinal,
      "Recursive or repeated same-function frames are outside this bounded helper profile.", "unsupported");
    const frame = frames[stackFrameCount - 1], selectedFrame = stackFrameCount;
    same(frame.function_ordinal, functionOrdinal, "Selected stack function differs from the recorded current operation.");
    same(frame.block_ordinal, anchor.site.kir.block_ordinal, "Selected stack block differs from the recorded current operation.");
    need(integer(frame.next_operation), "This selected stack frame has no available next operation.", "unsupported");
    const stackValues = object(frame.values);
    need(integer(stackValues.value_count, 0, 64), "Invalid selected stack value count.");
    const refined = { cursor: anchor.cursor, scope: anchor.scope, site: anchor.site, frame: selectedFrame, occurrence: 1 };
    const expectedSourceKey = resourceSnapshotAnchorKey(refined);
    need(expectedSourceKey !== null, "The expected explicit frame refinement is invalid.");
    const rows: ResourceSourceValueRow[] = [], identities = new Set<string>(), sourceRequestIds: number[] = [];
    let cursor: unknown, queryIdentity: string | null = null, sourceAnchor: ResourceSnapshotAnchor | null = null, pageLimit: number | null = null;
    for (const [index, item] of sourcePages.entries()) {
      const { request, response } = pair(item, "inspect_source_variables", "fe2o3-debug-source-variable-request-v2");
      exact(request, ["schema", "request_id", "expected_revision", "operation", "scope", "frame", "selector", "page"]);
      exact(response, ["status", "schema", "request_id", "operation", "session", "snapshot", "values",
        ...(Object.hasOwn(response, "next_cursor") ? ["next_cursor"] : [])]);
      same(request.scope, { level: "dispatch" }, "Source query scope differs from the supported stack selection.");
      same(request.frame, selectedFrame, "Source values require the explicitly retained current stack frame.");
      same(request.selector, { selector: "all" }, "The supported source query retains all variables, not a changed selector.");
      const page = exact(request.page, ["limit", ...(index === 0 ? [] : ["cursor"])]);
      need(integer(page.limit, 1, 64), "Invalid source-variable page limit."); pageLimit ??= page.limit;
      same(page.limit, pageLimit, "Source-variable page limit changed.");
      if (index > 0) same(page.cursor, cursor, "Source-variable page cursor is missing, stale or incompatible.");
      same(resourceSnapshotAnchorKey(response.snapshot), expectedSourceKey, "Source values do not carry this exact stop plus the explicit current-frame refinement.");
      sourceAnchor ??= response.snapshot as ResourceSnapshotAnchor;
      need(Array.isArray(response.values) && response.values.length <= pageLimit, "Source-variable page exceeds its requested limit.");
      need(index === 0 || response.values.length > 0, "A continuation cursor must have retained remaining rows.");
      for (const raw of response.values) {
        const row = variable(raw, functionOrdinal);
        need(!identities.has(row.identity), "Duplicate source-variable identity across retained pages."); identities.add(row.identity); rows.push(row);
        need(rows.length <= RESOURCE_SOURCE_VALUE_LIMITS.rows, "The 64-row source-variable budget was exceeded; no partial table is shown.", "unsupported");
      }
      cursor = response.next_cursor;
      if (cursor !== undefined) {
        const next = exact(cursor, ["query_identity", "position"]);
        need(digest(next.query_identity) && integer(next.position, 1), "Invalid source-variable page cursor.");
        same(next.position, rows.length, "Source-variable cursor skipped or repeated rows.");
        queryIdentity ??= next.query_identity; same(next.query_identity, queryIdentity, "Source-variable query identity changed.");
        need(response.values.length === pageLimit, "A nonfinal source page is unexpectedly partial.");
      }
      need((cursor === undefined) === (index === sourcePages.length - 1), "Retain the complete ordered source-variable page chain.");
      sourceRequestIds.push(item.requestId);
    }
    need(sourceAnchor !== null, "Missing source-variable anchor.");
    return { status: "ready", checkpointAnchor: anchor, sourceAnchor, checkpointRequestId: checkpoint.control.requestId,
      stackRequestId: stackPair.requestId, sourceRequestIds, rows, stackFrameCount, totalSsaValueCount,
      stackFrame: { frame: selectedFrame, functionOrdinal, blockOrdinal: anchor.site.kir.block_ordinal, nextOperation: frame.next_operation, valueCount: stackValues.value_count } };
  } catch (error) {
    if (error instanceof Refusal) return { status: error.status, detail: error.message };
    throw error;
  }
}
