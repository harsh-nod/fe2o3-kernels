/** Bounded display of existing private-test output. Not a debugger transport,
 * borrowed compiler owner, source authenticator, or production resume API. */
export const ORDERED_REGION_FEATURES = ["ordered-region-v31", "ordered-region-unused-v31"] as const;
export const ORDERED_REGION_MAX_SIDECAR_BYTES = 65_536;
export const ORDERED_REGION_MAX_TOTAL_BYTES = 524_288;
type Feature = typeof ORDERED_REGION_FEATURES[number];
type Row = Record<string, unknown>;
export interface OrderedRegionObservationInput {
  readonly sourceLadderUtf8: string;
  readonly expectedSourceLadderSha256: string;
  readonly variants: readonly {
    readonly feature: Feature;
    readonly debuggerUtf8: string;
    readonly expectedDebuggerSha256: string;
  }[];
}
export interface OrderedRegionCpuCase {
  readonly arguments: readonly number[];
  readonly beforeInputs: readonly number[];
  readonly afterResults: readonly number[];
  readonly recordIndices: readonly (readonly number[])[];
  readonly records: number;
  readonly scheduleIdentity: string;
}
export interface OrderedRegionVariant {
  readonly feature: Feature;
  readonly label: string;
  readonly sidecarSha256: string;
  readonly canonicalIdentity: string;
  readonly canonicalLength: number;
  readonly canonicalBytesSha256: string;
  readonly semanticSha256: string;
  readonly sourceSha256: string;
  readonly sourceIds: readonly string[];
  readonly inventorySha256: string;
  readonly preflightSha256: string;
  readonly coordinate: readonly number[];
  readonly rawBlock: number;
  readonly semanticCoordinate: readonly number[];
  readonly inputIds: readonly number[];
  readonly resultId: number;
  readonly roles: { readonly scratch: number; readonly output: number; readonly inputs: readonly number[] };
  readonly expansionAvailable: boolean;
  readonly callSiteAvailable: boolean;
  readonly cases: readonly OrderedRegionCpuCase[];
}
export type OrderedRegionObservationProjection = {
  readonly status: "ready";
  readonly captureKey: string;
  readonly ladderSha256: string;
  readonly variants: readonly OrderedRegionVariant[];
} | { readonly status: "invalid" | "unavailable"; readonly detail: string };

function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function object(value: unknown): Row {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Expected a retained object."); return value as Row;
}
function keys(value: unknown, expected: readonly string[]): Row {
  const row = object(value);
  check(Object.keys(row).length === expected.length && expected.every(key => Object.hasOwn(row, key)), "Unexpected retained fields."); return row;
}
function dense(value: unknown, length: number): unknown[] {
  check(Array.isArray(value) && value.length === length, "Missing, duplicate or oversized retained entries.");
  for (let index = 0; index < length; index++) check(Object.hasOwn(value, index), "Sparse retained entries."); return value;
}
function integer(value: unknown, maximum = 0xffff_ffff): number {
  check(typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum, "Inexact or out-of-range retained integer."); return value;
}
function digest(value: unknown): string {
  check(typeof value === "string" && /^[0-9a-f]{64}$/u.test(value) && !/^0+$/u.test(value), "Invalid retained SHA-256."); return value;
}
function numbers(value: unknown, length: number, maximum = 0xffff_ffff): readonly number[] {
  return Object.freeze(dense(value, length).map(item => integer(item, maximum)));
}
function equal(value: unknown, expected: unknown, message: string) { check(JSON.stringify(value) === JSON.stringify(expected), message); }
function text(value: unknown, cap: number): string {
  check(typeof value === "string" && value.length > 0 && value.length <= cap, "Retained text exceeds its byte budget.");
  for (const point of value) { const code = point.codePointAt(0)!; check(code < 0xd800 || code > 0xdfff, "Invalid retained Unicode."); }
  check(new TextEncoder().encode(value).length <= cap, "Retained text exceeds its byte budget."); return value;
}
function parsed(raw: string): Row {
  const value: unknown = JSON.parse(raw), pending = [{ value, depth: 0 }]; let count = 0;
  while (pending.length) {
    const item = pending.pop()!; check(++count <= 8192 && item.depth <= 20, "Retained JSON structure exceeds display bounds.");
    if (item.value !== null && typeof item.value === "object") {
      const children = Object.values(item.value); check(children.length <= 256, "Retained JSON collection exceeds display bounds.");
      for (const value of children) pending.push({ value, depth: item.depth + 1 });
    }
  }
  return object(value);
}
async function sha256(raw: string): Promise<string> {
  const bytes = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
function copyInput(value: unknown): OrderedRegionObservationInput {
  const row = keys(value, ["sourceLadderUtf8", "expectedSourceLadderSha256", "variants"]);
  const sourceLadderUtf8 = text(row.sourceLadderUtf8, 262_144);
  let total = new TextEncoder().encode(sourceLadderUtf8).length;
  const variants = dense(row.variants, 2).map((value, index) => {
    const item = keys(value, ["feature", "debuggerUtf8", "expectedDebuggerSha256"]);
    check(item.feature === ORDERED_REGION_FEATURES[index], "The two retained source variants must be distinct and ordered.");
    const debuggerUtf8 = text(item.debuggerUtf8, ORDERED_REGION_MAX_SIDECAR_BYTES); total += new TextEncoder().encode(debuggerUtf8).length;
    return Object.freeze({ feature: ORDERED_REGION_FEATURES[index], debuggerUtf8, expectedDebuggerSha256: digest(item.expectedDebuggerSha256) });
  });
  check(total <= ORDERED_REGION_MAX_TOTAL_BYTES, "Combined retained bytes exceed the display budget.");
  return Object.freeze({ sourceLadderUtf8, expectedSourceLadderSha256: digest(row.expectedSourceLadderSha256), variants: Object.freeze(variants) });
}

const identityFields = ["semantic_sha256", "canonical_v16_identity", "canonical_bytes_sha256", "rustc_identity_inventory_sha256", "rustc_preflight_plan_sha256"] as const;
function sourceRows(value: Row): Row[] {
  keys(value, ["schema", "observations", "grants_artifact_or_launch_authority", "hardware_observed"]);
  check(value.schema === "fe2o3-test-source-ordered-region-ladder-v31" && value.grants_artifact_or_launch_authority === false && value.hardware_observed === false, "Unsupported source ladder or elevated authority.");
  const features = [...ORDERED_REGION_FEATURES, "ordered-region-alias-v31", "ordered-region-dynamic-v31", "ordered-region-divergent-v31", "ordered-region-wrong-launch-v31"];
  return dense(value.observations, 6).map((value, index) => {
    const row = keys(value, ["schema", "feature", "invocation", "observation", "actual_rustc_callback", "source_unchanged", "proof_executed", "final_production_admitted", "grants_artifact_or_launch_authority", "hardware_observed"]);
    check(row.schema === "fe2o3-test-source-ordered-region-observation-v31" && row.feature === features[index] && row.actual_rustc_callback === true && row.source_unchanged === true, "Source callback case differs from the retained ladder.");
    for (const field of ["proof_executed", "final_production_admitted", "grants_artifact_or_launch_authority", "hardware_observed"]) check(row[field] === false, "Source observation attempts to grant authority.");
    const invocation = keys(row.invocation, ["schema", "feature", "args", "crate_binding", "cargo_observation", "source_sha256", "root_source_sha256", "manifest_sha256", "artifacts_sha256", "metadata_sha256"]);
    check(invocation.schema === "fe2o3-test-source-ordered-region-invocation-v31" && invocation.feature === row.feature, "Source invocation mismatch.");
    for (const field of ["crate_binding", "cargo_observation", "source_sha256", "root_source_sha256", "manifest_sha256", "artifacts_sha256", "metadata_sha256"]) digest(invocation[field]);
    check(Array.isArray(invocation.args) && invocation.args.length > 0 && invocation.args.length <= 128 && invocation.args.every(arg => typeof arg === "string" && arg.length > 0 && arg.length <= 4096), "Source invocation argument bounds.");
    if (index < 2) {
      const report = keys(row.observation, ["stage", ...identityFields, "canonical_v16_length", "llvm_sha256", "region_source_ids", "region_count", "cpu_cases", "lanes_per_case", "canaries_unchanged", "unused_result_retained"]);
      check(report.stage === "actual_source_v31_exact_v16_cpu_and_llvm_observed" && report.region_count === 1 && report.cpu_cases === 6 && report.lanes_per_case === 64 && report.canaries_unchanged === true && report.unused_result_retained === (index === 1), "Source observation coverage differs.");
      for (const field of [...identityFields, "llvm_sha256"]) digest(report[field]);
      check(integer(report.canonical_v16_length, 1_048_576) > 0, "Missing canonical bytes."); dense(report.region_source_ids, 4).forEach(digest);
    } else {
      const report = keys(row.observation, ["stage", "diagnostic"]);
      check(report.stage === "actual_source_profile_refused", "Negative source case has the wrong stage.");
      const refusals = ["ordered region physical roles must be distinct v0..v63", "ordered region physical role is not an actual MIR constant", "ordered region must precede every conditional source edge", "ordered region requires an explicit 64x1x1 workgroup"];
      check(text(report.diagnostic, 65_536).includes(refusals[index - 2]), "Negative source case has the wrong refusal.");
    }
    return row;
  });
}

function variantReport(raw: string, source: Row, feature: Feature, sidecarSha256: string): OrderedRegionVariant {
  const report = parsed(raw);
  keys(report, ["schema", "feature", "scope", "source_authentication_from_sidecar", "detached_transcript_admission", "grants_artifact_or_launch_authority", "grants_proof_or_resume_authority", "hardware_observed", "physical_register_values", "scratch_values", "exec_values", "instruction_microsteps", ...identityFields, "canonical_v16_length", "region_source_ids", "kir_coordinate", "kir_raw_block_id", "semantic_coordinate", "source_expansion_available", "source_call_site_available", "declared_target", "declared_wave_width", "logical_input_value_ids", "logical_result_value_id", "planned_physical_roles", "cpu_cases", "qualified_lanes_per_case", "same_kir_second_request_not_interchangeable", "wrong_index_width_and_wave_not_interchangeable", "truncated_control", "unavailable_control", "capture_count", "limits"]);
  check(report.schema === "fe2o3-test-source-ordered-region-debugger-observation-v1" && report.feature === feature && report.scope === "same-private-source-owner-and-immutable-request CPU observation", "Unsupported debugger sidecar profile.");
  for (const field of ["source_authentication_from_sidecar", "detached_transcript_admission", "grants_artifact_or_launch_authority", "grants_proof_or_resume_authority", "hardware_observed"]) check(report[field] === false, "Sidecar attempts to grant authority.");
  for (const field of ["physical_register_values", "scratch_values", "exec_values", "instruction_microsteps"]) check(report[field] === "unavailable", "Physical or intermediate values are not supplied by this sidecar.");
  check(report.declared_target === "gfx942:xnack-" && report.declared_wave_width === 64 && report.qualified_lanes_per_case === 64 && report.capture_count === 10 && report.same_kir_second_request_not_interchangeable === true && report.wrong_index_width_and_wave_not_interchangeable === true && report.truncated_control === "record-limit" && report.unavailable_control === "value-limit", "Sidecar profile or qualification controls differ.");
  const observed = object(source.observation), invocation = object(source.invocation);
  for (const field of [...identityFields, "canonical_v16_length", "region_source_ids"]) equal(report[field], observed[field], "Sidecar belongs to another canonical, semantic or source observation.");
  const roles = keys(report.planned_physical_roles, ["scratch", "output", "inputs"]);
  const scratch = integer(roles.scratch, 63), output = integer(roles.output, 63), inputs = numbers(roles.inputs, 3, 63);
  check(new Set([scratch, output, ...inputs]).size === 5, "Authored physical roles overlap.");
  check(typeof report.source_expansion_available === "boolean" && typeof report.source_call_site_available === "boolean", "Malformed source availability.");
  const limits = keys(report.limits, ["records_per_capture", "values_per_checkpoint", "retained_values", "retained_memory_bytes", "simulation_steps", "logical_view_storage"]);
  check(limits.records_per_capture === 16_384 && limits.values_per_checkpoint === 128 && limits.retained_values === 1_048_576 && limits.retained_memory_bytes === 16_777_216 && limits.simulation_steps === 8192 && integer(limits.logical_view_storage, 1024) > 0, "Unsupported capture bounds.");
  const cases = dense(report.cpu_cases, 6).map(value => {
    const row = keys(value, ["arguments_u32", "region_inputs_before_u32_each_lane", "region_results_after_u32", "before_after_record_indices", "records", "transcript_completeness", "logical_lanes", "schedule", "schedule_transcript_identity", "independent_oracle_matches", "canaries_unchanged"]);
    check(row.transcript_completeness === "complete" && row.logical_lanes === 64 && row.schedule === "workgroup-major-local-zyx-cooperative-v1" && row.independent_oracle_matches === true && row.canaries_unchanged === true, "Incomplete or incompatible logical CPU case.");
    const arguments_ = numbers(row.arguments_u32, 3), beforeInputs = numbers(row.region_inputs_before_u32_each_lane, 3), afterResults = numbers(row.region_results_after_u32, 64);
    equal(beforeInputs, arguments_, "Before-input observations differ from this request case.");
    const expected = Number(((BigInt(arguments_[0]) ^ BigInt(arguments_[1])) + BigInt(arguments_[2])) & 0xffff_ffffn);
    check(afterResults.every(value => value === expected), "Retained results disagree with the independent wrapping-u32 case.");
    const records = integer(row.records, 16_384); check(records > 0, "Missing logical records.");
    const recordIndices = Object.freeze(dense(row.before_after_record_indices, 64).map(value => {
      const pair = numbers(value, 2, records - 1); check(pair[1] === pair[0] + 1, "The whole-region checkpoint pair is not adjacent."); return pair;
    }));
    check(new Set(recordIndices.flat()).size === 128, "Duplicated logical lane checkpoint records.");
    return Object.freeze({ arguments: arguments_, beforeInputs, afterResults, recordIndices, records, scheduleIdentity: digest(row.schedule_transcript_identity) });
  });
  check(new Set(cases.map(row => JSON.stringify(row.arguments))).size === 6, "Repeated or missing request case.");
  return Object.freeze({ feature, label: feature === ORDERED_REGION_FEATURES[0] ? "Used region result" : "Unused region result", sidecarSha256,
    canonicalIdentity: digest(report.canonical_v16_identity), canonicalLength: integer(report.canonical_v16_length, 1_048_576), canonicalBytesSha256: digest(report.canonical_bytes_sha256),
    semanticSha256: digest(report.semantic_sha256), sourceSha256: digest(invocation.source_sha256), sourceIds: Object.freeze(dense(report.region_source_ids, 4).map(digest)), inventorySha256: digest(report.rustc_identity_inventory_sha256), preflightSha256: digest(report.rustc_preflight_plan_sha256),
    coordinate: numbers(report.kir_coordinate, 3), rawBlock: integer(report.kir_raw_block_id), semanticCoordinate: numbers(report.semantic_coordinate, 2), inputIds: numbers(report.logical_input_value_ids, 3), resultId: integer(report.logical_result_value_id),
    roles: Object.freeze({ scratch, output, inputs }), expansionAvailable: report.source_expansion_available, callSiteAvailable: report.source_call_site_available, cases: Object.freeze(cases) });
}

export async function projectOrderedRegionObservation(value: unknown): Promise<OrderedRegionObservationProjection> {
  if (value === null) return { status: "unavailable", detail: "No retained source observation supplied. No values are invented." };
  try {
    const input = copyInput(value); // Snapshot all bounded strings before awaiting hashes.
    if (!globalThis.crypto?.subtle) return { status: "unavailable", detail: "WebCrypto is required for retained-byte integrity checks." };
    check(await sha256(input.sourceLadderUtf8) === input.expectedSourceLadderSha256, "Source ladder bytes differ from the independently selected hash.");
    await Promise.all(input.variants.map(async variant => check(await sha256(variant.debuggerUtf8) === variant.expectedDebuggerSha256, "Debugger sidecar bytes differ from the independently selected hash.")));
    const rows = sourceRows(parsed(input.sourceLadderUtf8));
    const usedInvocation = object(rows[0].invocation), unusedInvocation = object(rows[1].invocation);
    for (const field of ["source_sha256", "root_source_sha256", "manifest_sha256"] as const) {
      check(usedInvocation[field] === unusedInvocation[field], `Retained used/unused variants differ in ${field}.`);
    }
    const variants = Object.freeze(input.variants.map((variant, index) => variantReport(variant.debuggerUtf8, rows[index], variant.feature, variant.expectedDebuggerSha256)));
    for (const field of ["sidecarSha256", "canonicalIdentity", "canonicalBytesSha256", "semanticSha256"] as const) check(variants[0][field] !== variants[1][field], "Source variants reuse an observation identity.");
    const captureKey = JSON.stringify([input.expectedSourceLadderSha256, ...variants.map(variant => [variant.feature, variant.sidecarSha256, variant.canonicalIdentity, variant.canonicalLength])]);
    return Object.freeze({ status: "ready", captureKey, ladderSha256: input.expectedSourceLadderSha256, variants });
  } catch (error) { return { status: "invalid", detail: error instanceof Error ? error.message.slice(0, 240) : "Invalid retained observation." }; }
}
