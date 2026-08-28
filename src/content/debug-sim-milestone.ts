import counterCapture from "../../examples/debug_sim_milestone_v1/counter_capture_v2.json";
import counterCaptureRaw from "../../examples/debug_sim_milestone_v1/counter_capture_v2.json?raw";
import sourceExportReceiptRaw from "../../examples/debug_sim_milestone_v1/debug_scalar_export_receipt_v2.txt?raw";
import sourceMap from "../../examples/debug_sim_milestone_v1/debug_scalar_source_map_v2.json";
import sourceMapRaw from "../../examples/debug_sim_milestone_v1/debug_scalar_source_map_v2.json?raw";
import sourceVariablesRaw from "../../examples/debug_sim_milestone_v1/debug_scalar_source_variables_v2.jsonl?raw";
import explorationIncomplete from "../../examples/debug_sim_milestone_v1/exploration_incomplete_v1.json";
import explorationIncompleteRaw from "../../examples/debug_sim_milestone_v1/exploration_incomplete_v1.json?raw";
import explorationNoRace from "../../examples/debug_sim_milestone_v1/exploration_no_race_v1.json";
import explorationNoRaceRaw from "../../examples/debug_sim_milestone_v1/exploration_no_race_v1.json?raw";
import explorationRace from "../../examples/debug_sim_milestone_v1/exploration_race_v1.json";
import explorationRaceRaw from "../../examples/debug_sim_milestone_v1/exploration_race_v1.json?raw";
import pcCapabilities from "../../examples/debug_sim_milestone_v1/pc_capabilities_v3.json";
import pcHotspots from "../../examples/debug_sim_milestone_v1/pc_hotspots_v3.json";
import pcHotspotsRaw from "../../examples/debug_sim_milestone_v1/pc_hotspots_v3.json?raw";
import pcSampleCaptureRaw from "../../examples/debug_sim_milestone_v1/pc_sample_capture_v3.json?raw";
import pcSampleOpen from "../../examples/debug_sim_milestone_v1/pc_sample_open_v3.json";
import pcSampleOpenRaw from "../../examples/debug_sim_milestone_v1/pc_sample_open_v3.json?raw";
import pcSamplePage from "../../examples/debug_sim_milestone_v1/pc_sample_page_v3.json";
import pcSamplePageRaw from "../../examples/debug_sim_milestone_v1/pc_sample_page_v3.json?raw";
import replayResult from "../../examples/debug_sim_milestone_v1/race_replay_result_v1.json";
import replayScheduleRaw from "../../examples/debug_sim_milestone_v1/race_replay_schedule_v1.json?raw";
import wave32Error from "../../examples/debug_sim_milestone_v1/partial_wave32_error_v1.json";
import wave64Error from "../../examples/debug_sim_milestone_v1/partial_wave64_error_v1.json";
import wave32Result from "../../examples/debug_sim_milestone_v1/wave32_collectives_result_v1.json";
import wave64Result from "../../examples/debug_sim_milestone_v1/wave64_collectives_result_v1.json";

type JsonObject = Record<string, unknown>;
export type ExplorationEvidenceId = "race" | "no-race" | "incomplete";
export type LogicalWaveWidth = 32 | 64;

export const DEBUG_SIM_COMPILER_PIN = {
  commit: "db36030a9605465082c696210ccb71b1195a6b5f",
  tree: "4c8228139562148b34531439b658a2805028066f",
} as const;

export const DEBUG_SIM_ARTIFACT_SHA256 = {
  counterCapture: "1f2e723df8b213c111461cafd05b28697216e8b0daecca439de04c1329e17799",
  sourceBundle: "bff1002631396413057ca42b1bca59874ba66bd919422bfa581381aa9b971b8e",
  sourceExportReceipt: "a5f560a1f19e04c80e50c65df5972fb529d473cb7fee7b947fd548aad9e5bc00",
  sourceRequest: "473aa538acbfa3a28f5319acb3672402379d3d3216026d8341bebb3d87d8f35f",
  sourceMap: "1edf534631d7d52dedc892f5c3a2275d987f19590791942dc7bbe51aa430262a",
  sourceVariables: "4624cb972baee136553b54d347483c15314df841f79730f5c9554e6d0a18d658",
  explorationIncomplete: "48e3a401f3512013318abed932b903834e75d43be244231e4f0d0fbc7f1212ba",
  explorationNoRace: "1c04b7ba45a9988fc71dd9d32ec28c94966361be775acf5adc057857f8f22732",
  explorationRace: "17c625d55de788311500dd3185fe796c1e318111d4b871ac571106d6c1c1085a",
  partialWave32Error: "2c628028033d57cfcdf0802d838aab999d7f68d9939975cdfe5840b1f66d5388",
  partialWave64Error: "18d8c638646f0a89a9060f020dfafdd110ca16e03392f0bb06d7cf7aa16f0ecb",
  pcCapabilities: "a1a4b3819815b4879c2fc1b8eccf1c28f967d83784356131ba40ff93739736ed",
  pcHotspots: "113d6df2e0e9a5d74a2f3a3dcbbf7f7aac3ab23aeee04e9c02aad6e5323a512c",
  pcSampleCapture: "c6bf5099ea7fd4f6c2a4d7660fbec9198f9ea53f45d14462edd61022450bf2a4",
  pcSampleOpen: "5a16c04424cc4b539d051464c29507b0c431dc26e94b2634296fd9807b472360",
  pcSamplePage: "30ac9350588adba6a6a02982233d1ac392c93548a53ed803b0b662b2000c6e09",
  replayResult: "5ff1433e20e9e204c7c847845779cf0955a7be19fc38f7160d7acdd7016dd9c9",
  replaySchedule: "28f9d9776509701316cfcd5d5e751f5ce7f8885cb49c4294b29f1d126eae313d",
  wave32Result: "ec856159689ad4aa2672587be7005965fa76216f7e3adf140a50e54f01c00334",
  wave64Result: "8cd9fcddf8835683093f5bd6e39bfbd7a2b2871665f069f635634841adc56305",
} as const;

const explorationTopKeys = [
  "authority",
  "exploration",
  "first_failure",
  "hardware_observed",
  "hardware_validation",
  "input",
  "performance_prediction",
  "schedule_space_exhausted",
  "schema",
  "simulated",
  "status",
  "target_profile",
  "witnesses",
];

function record(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: unknown, expected: readonly string[]): value is JsonObject {
  return (
    record(value) &&
    Object.keys(value).sort().join("\0") === [...expected].sort().join("\0")
  );
}

function field(value: unknown, key: string): unknown {
  return record(value) ? value[key] : undefined;
}

function validateExploration(
  value: unknown,
  expectedStatus: "races_observed" | "no_races_observed" | "incomplete",
): string[] {
  const issues: string[] = [];
  if (!exactKeys(value, explorationTopKeys)) {
    return ["exploration fixture has unknown or missing top-level fields"];
  }
  if (
    value.schema !== "fe2o3-simulation-exploration-v1" ||
    value.status !== "ok" ||
    value.authority !== "observation_only" ||
    value.simulated !== true ||
    value.hardware_observed !== false ||
    value.hardware_validation !== false ||
    value.performance_prediction !== false ||
    value.schedule_space_exhausted !== false ||
    value.first_failure !== null
  ) {
    issues.push("exploration fixture violates its observation-only truth envelope");
  }
  const exploration = value.exploration;
  if (
    !record(exploration) ||
    exploration.schedule_identity !==
      "workgroup_major_seeded_runnable_cooperative_v1" ||
    exploration.first_seed !== 41 ||
    exploration.requested_schedules !== 3 ||
    exploration.attempted !== 3 ||
    exploration.completed !== 3 ||
    exploration.failures !== 0 ||
    exploration.requested_seed_budget_consumed !== true ||
    exploration.witness_retention_exhausted !== false ||
    exploration.hard_max_schedules !== 4096 ||
    exploration.hard_max_decisions_per_schedule !== 4_194_304 ||
    exploration.hard_max_retained_decisions !== 65_536
  ) {
    issues.push("exploration fixture does not preserve the exact bounded seed sweep");
  }
  const witnesses = value.witnesses;
  if (!record(witnesses)) {
    return [...issues, "exploration fixture has no witness set"];
  }
  const witnessKey =
    expectedStatus === "races_observed"
      ? "first_race"
      : expectedStatus === "no_races_observed"
        ? "first_no_race"
        : "first_incomplete";
  const witness = witnesses[witnessKey];
  if (
    !record(witness) ||
    witness.seed !== 41 ||
    field(witness.assessment, "status") !== expectedStatus ||
    !record(witness.replay_schedule) ||
    typeof witness.replay_schedule.document !== "string" ||
    witness.replay_schedule.bytes !== witness.replay_schedule.document.length ||
    !/^[0-9a-f]{64}$/u.test(String(witness.replay_schedule.sha256))
  ) {
    issues.push(`exploration fixture has no exact ${expectedStatus} replay witness`);
  } else {
    const schedule = JSON.parse(witness.replay_schedule.document) as unknown;
    if (
      field(schedule, "schema") !== "fe2o3-simulation-schedule-v1" ||
      field(field(schedule, "schedule"), "seed") !== witness.seed
    ) {
      issues.push("exploration witness does not embed its exact seeded replay schedule");
    }
  }
  for (const candidate of ["first_race", "first_no_race", "first_incomplete"]) {
    if (candidate !== witnessKey && witnesses[candidate] !== null) {
      issues.push(`exploration fixture unexpectedly retains ${candidate}`);
    }
  }
  if (
    expectedStatus === "races_observed" &&
    (field(exploration, "races_observed") !== 3 ||
      field(field(witness, "assessment"), "racing_bytes") !== 4)
  ) {
    issues.push("race fixture lost its exact four-byte conflict witness");
  }
  if (
    expectedStatus === "no_races_observed" &&
    field(exploration, "no_races_observed") !== 3
  ) {
    issues.push("no-race fixture lost its three observed schedules");
  }
  if (
    expectedStatus === "incomplete" &&
    (field(exploration, "incomplete_assessments") !== 3 ||
      field(field(witness, "assessment"), "atomic_or_fence_happens_before_unmodeled") !==
        true)
  ) {
    issues.push("incomplete fixture lost its unmodeled synchronization reason");
  }
  return issues;
}

function hexBytes(value: unknown): Uint8Array {
  if (typeof value !== "string" || !/^0x(?:[0-9a-f]{2})+$/u.test(value)) {
    throw new Error("invalid exact byte string");
  }
  return Uint8Array.from(
    value.slice(2).match(/.{2}/gu)!.map((byte) => Number.parseInt(byte, 16)),
  );
}

function u32Values(value: unknown): number[] {
  const bytes = hexBytes(value);
  if (bytes.length % 4 !== 0) throw new Error("invalid u32 buffer");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: bytes.length / 4 }, (_, index) =>
    view.getUint32(index * 4, true),
  );
}

function bufferBytes(result: JsonObject, index: number): unknown {
  const argument = Array.isArray(result.arguments) ? result.arguments[index] : undefined;
  return field(field(argument, "value"), "bytes");
}

function validateWaveResult(value: unknown, width: LogicalWaveWidth): string[] {
  if (!record(value)) return [`wave${width} result is not an object`];
  const issues: string[] = [];
  const counts = value.counts;
  if (
    value.schema !== "fe2o3-simulation-result-v1" ||
    value.status !== "ok" ||
    value.authority !== "observation_only" ||
    value.simulated !== true ||
    value.hardware_observed !== false ||
    value.hardware_validation !== false ||
    value.performance_prediction !== false ||
    field(counts, "invocations_executed") !== width ||
    field(counts, "scheduled_slots_visited") !== width ||
    field(value.race_assessment, "status") !== "no_races_observed" ||
    !Array.isArray(value.arguments) ||
    value.arguments.length !== 5
  ) {
    issues.push(`wave${width} result violates its exact semantic envelope`);
    return issues;
  }
  try {
    const laneIds = u32Values(bufferBytes(value, 0));
    const shuffle = u32Values(bufferBytes(value, 4));
    const any = hexBytes(bufferBytes(value, 2));
    const all = hexBytes(bufferBytes(value, 3));
    if (
      laneIds.length !== width ||
      laneIds.some((lane, index) => lane !== index) ||
      shuffle.some((lane, index) => lane !== Math.floor(index / 8) * 8) ||
      any.some((byte) => byte !== 1) ||
      all.some((byte) => byte !== 0)
    ) {
      issues.push(`wave${width} collective result bytes changed`);
    }
    const ballot = hexBytes(bufferBytes(value, 1));
    const ballotStride = width === 32 ? 4 : 8;
    for (let offset = 0; offset < ballot.length; offset += ballotStride) {
      if (ballot[offset] !== 1 || ballot.slice(offset + 1, offset + ballotStride).some(Boolean)) {
        issues.push(`wave${width} ballot bits changed`);
        break;
      }
    }
  } catch {
    issues.push(`wave${width} result has malformed exact bits`);
  }
  return issues;
}

function validateWaveError(value: unknown, width: LogicalWaveWidth): string[] {
  const digits = width / 4;
  if (
    !record(value) ||
    value.schema !== "fe2o3-simulation-error-v1" ||
    value.status !== "error" ||
    value.stage !== "execution" ||
    value.kind !== "execution_incomplete_wave" ||
    field(value.detail, "kind") !== "incomplete_wave" ||
    field(value.detail, "width") !== `wave${width}` ||
    field(value.detail, "active_mask") !== `0x${"0".repeat(digits - 1)}1` ||
    field(value.detail, "required_mask") !== `0x${"f".repeat(digits)}`
  ) {
    return [`wave${width} failure lost its fixed-width structured masks`];
  }
  return [];
}

const counterBitWords = Array.from(
  counterCaptureRaw.matchAll(/"value_f64_bits":(\d+)/gu),
  (match) => match[1],
);

function decodeF64(word: string): number {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setBigUint64(0, BigInt(word), false);
  return view.getFloat64(0, false);
}

function validateCounterCapture(value: unknown): string[] {
  const issues: string[] = [];
  if (
    !exactKeys(value, [
      "counter_definitions",
      "coverage",
      "devices",
      "dispatches",
      "runs",
      "schema_version",
      "source_kind",
    ]) ||
    value.schema_version !== 2 ||
    value.source_kind !== "rocprofv3_dispatch_counter_json" ||
    !Array.isArray(value.runs) ||
    value.runs.length !== 1 ||
    !Array.isArray(value.counter_definitions) ||
    value.counter_definitions.length !== 2 ||
    !Array.isArray(value.dispatches) ||
    value.dispatches.length !== 2
  ) {
    return ["counter capture V2 has an invalid closed envelope"];
  }
  if (
    value.dispatches.some(
      (dispatch) =>
        field(dispatch, "source_and_isa_correlation") !==
          "unavailable_no_authenticated_source_or_isa_map" ||
        field(dispatch, "timing_origin") !== "observed" ||
        field(field(dispatch, "kernel_ir"), "origin") !== "declared",
    ) ||
    field(value.coverage, "dimension_correlation") !==
      "unavailable_record_has_no_instance_identity" ||
    field(field(value.coverage, "loss"), "state") !== "unknown" ||
    counterBitWords.join(",") !==
      "4609434218613702656,4612811918334230528,4619567317775286272,4621256167635550208"
  ) {
    issues.push("counter capture V2 changed a truth origin, correlation boundary, or exact value");
  }
  return issues;
}

const sourceVariableResponses = sourceVariablesRaw
  .trimEnd()
  .split("\n")
  .map((line) => JSON.parse(line) as JsonObject);
const sourceVariableResponse = sourceVariableResponses[1];

function validateSourceVariableMilestone(): string[] {
  const issues: string[] = [];
  if (
    !/^[0-9a-f]{40}$/u.test(DEBUG_SIM_COMPILER_PIN.commit) ||
    !/^[0-9a-f]{40}$/u.test(DEBUG_SIM_COMPILER_PIN.tree)
  ) {
    issues.push("source-variable evidence has no exact compiler commit and tree pin");
  }
  if (
    !exactKeys(sourceMap, [
      "binding",
      "eliminated",
      "files",
      "schema",
      "scopes",
      "sites",
      "variables",
    ]) ||
    sourceMap.schema !== "fe2o3-debug-source-map-v2" ||
    !Array.isArray(sourceMap.scopes) ||
    sourceMap.scopes.length !== 3 ||
    !Array.isArray(sourceMap.variables) ||
    sourceMap.variables.length !== 5
  ) {
    return ["production source map V2 has an invalid closed envelope"];
  }
  const bundleSubject = field(sourceMap.binding, "bundle_subject_identity");
  const canonicalKir = field(field(sourceMap.binding, "canonical_kir"), "digest");
  if (
    typeof bundleSubject !== "string" ||
    typeof canonicalKir !== "string" ||
    !sourceExportReceiptRaw.includes(`simulation_bundle_subject ${bundleSubject}`) ||
    !sourceExportReceiptRaw.includes("explicit simulation bundle V2") ||
    !sourceExportReceiptRaw.includes("compiler-produced source variables") ||
    !sourceExportReceiptRaw.includes("authenticates_compiler_execution=false") ||
    !sourceExportReceiptRaw.includes(
      "proof/artifact/compiler/hardware/load/launch authority false",
    )
  ) {
    issues.push("production export receipt does not bind the exact V2 map without authority");
  }
  if (
    sourceVariableResponses.length !== 2 ||
    field(sourceVariableResponse, "schema") !== "fe2o3-debug-source-variable-response-v2" ||
    field(sourceVariableResponse, "status") !== "ok" ||
    field(sourceVariableResponse, "operation") !== "inspect_source_variables" ||
    field(field(sourceVariableResponse, "session"), "backend") !== "cpu_kir_simulator" ||
    field(field(sourceVariableResponse, "session"), "simulated") !== true ||
    field(field(sourceVariableResponse, "session"), "hardware_observed") !== false ||
    field(field(sourceVariableResponse, "session"), "performance_prediction") !== false ||
    field(field(field(sourceVariableResponse, "snapshot"), "site"), "source") === undefined ||
    field(
      field(
        field(field(field(sourceVariableResponse, "snapshot"), "site"), "source"),
        "location",
      ),
      "provenance",
    ) !== "compiler_bundle_bound"
  ) {
    issues.push("source-variable query changed its bounded simulated session or source provenance");
  }
  const values = field(sourceVariableResponse, "values");
  if (!Array.isArray(values) || values.length !== sourceMap.variables.length) {
    return [...issues, "source-variable query does not cover the exact mapped variables"];
  }
  for (const mapped of sourceMap.variables) {
    const queried = values.find((value) => field(value, "name") === mapped.name);
    if (
      !record(queried) ||
      queried.variable_identity !== mapped.identity ||
      queried.scope_identity !== mapped.scope_identity
    ) {
      issues.push(`source-variable query lost the exact ${mapped.name} map identity`);
      continue;
    }
    const availability = field(field(queried, "availability"), "value");
    const binding = field(mapped, "function_binding");
    if (mapped.fallback === "unrepresented") {
      if (
        binding !== undefined ||
        queried.generation !== 0 ||
        field(availability, "status") !== "unavailable" ||
        field(availability, "reason") !== "not_represented"
      ) {
        issues.push(`source-variable ${mapped.name} lost typed unrepresented evidence`);
      }
    } else if (
      mapped.fallback !== "not_in_scope" ||
      field(binding, "generation") !== 1 ||
      queried.generation !== 1 ||
      field(availability, "status") !== "captured" ||
      field(availability, "provenance") !== "simulated_observation"
    ) {
      issues.push(`source-variable ${mapped.name} lost its exact unchanged-parameter binding`);
    }
  }
  const input = values.find((value) => field(value, "name") === "input");
  const inputValue = field(field(field(input, "availability"), "value"), "value");
  const scalar = values.find((value) => field(value, "name") === "value");
  const scalarValue = field(field(field(scalar, "availability"), "value"), "value");
  if (
    field(inputValue, "encoding") !== "allocation_relative_pointer" ||
    field(field(inputValue, "allocation"), "ordinal") !== 1 ||
    field(inputValue, "byte_offset") !== 0 ||
    field(scalarValue, "encoding") !== "bits" ||
    field(scalarValue, "bits") !== "0x3f800000" ||
    /native_address/iu.test(sourceVariablesRaw)
  ) {
    issues.push("source-variable values lost exact bits or allocation-relative pointer safety");
  }
  return issues;
}

const pcExecMaskWords = Array.from(
  pcSamplePageRaw.matchAll(/"exec_mask":(\d+)/gu),
  (match) => match[1],
);
const pcTimestampWords = Array.from(
  pcSamplePageRaw.matchAll(/"ticks":(\d+)/gu),
  (match) => match[1],
);

function pcCaptureDigest(value: unknown): unknown {
  return field(field(field(value, "context"), "capture_identity"), "digest");
}

function validatePcSampleMilestone(): string[] {
  const issues: string[] = [];
  const openContext = field(pcSampleOpen, "context");
  const coverage = field(pcSampleOpen, "coverage");
  const captureDigest = field(field(openContext, "capture_identity"), "digest");
  if (
    field(pcSampleOpen, "response") !== "open" ||
    field(openContext, "schema_version") !== 3 ||
    field(openContext, "dispatch_count") !== 2 ||
    field(openContext, "raw_sample_count") !== 5 ||
    field(openContext, "relative_pc_unavailable_count") !== 1 ||
    field(coverage, "pc_sample_scope") !== "stochastic_samples_only" ||
    field(field(coverage, "sampling"), "method") !== "stochastic" ||
    field(field(coverage, "sampling"), "unit_origin") !== "declared" ||
    field(field(coverage, "sampling"), "interval_origin") !== "declared" ||
    field(field(coverage, "sampling"), "interval") !== 1_048_576 ||
    field(field(coverage, "exec_mask_semantics"), "meaning") !==
      "rocprofiler_active_lane_mask_no_per_lane_instruction_execution_proof" ||
    field(field(coverage, "loss"), "state") !== "unknown"
  ) {
    issues.push("PC Sample Capture V3 open response changed its bounded truth envelope");
  }
  const samplePage = field(pcSamplePage, "page");
  const sampleItems = field(samplePage, "items");
  if (
    field(pcSamplePage, "response") !== "page" ||
    field(samplePage, "kind") !== "samples" ||
    field(samplePage, "returned") !== 2 ||
    field(field(samplePage, "next_cursor"), "position") !== 2 ||
    pcCaptureDigest(samplePage) !== captureDigest ||
    !Array.isArray(sampleItems) ||
    sampleItems.some(
      (item) =>
        field(item, "item") !== "sample" ||
        field(field(item, "sample"), "origin") !== "observed" ||
        field(field(field(item, "sample"), "timestamp"), "domain") !==
          "rocprofiler_opaque_collector_clock",
    ) ||
    pcExecMaskWords.join(",") !== "18446744073709551615,255" ||
    pcTimestampWords.join(",") !== "5380230786023534,5380230786033534"
  ) {
    issues.push("PC Sample Capture V3 sample page changed its cursor or observed records");
  }
  const hotspotPage = field(pcHotspots, "page");
  const hotspotItems = field(hotspotPage, "items");
  if (
    field(pcHotspots, "response") !== "page" ||
    field(hotspotPage, "kind") !== "pc_hotspots" ||
    field(hotspotPage, "returned") !== 4 ||
    pcCaptureDigest(hotspotPage) !== captureDigest ||
    !Array.isArray(hotspotItems) ||
    hotspotItems.some(
      (item) =>
        field(item, "item") !== "pc_hotspot" ||
        field(field(item, "hotspot"), "origin") !== "inferred" ||
        field(field(item, "hotspot"), "aggregation") !==
          "count_stochastic_records_by_dispatch_code_object_pc_and_instruction_type" ||
        field(field(item, "hotspot"), "limitation") !==
          "sample_count_is_not_instruction_count_or_complete_execution_coverage",
    )
  ) {
    issues.push("PC Sample Capture V3 hotspot page changed its bounded inference contract");
  }
  const capabilities = field(pcCapabilities, "capabilities");
  const unavailable = new Set([
    "source_correlation",
    "isa_correlation",
    "clock_conversion",
    "att_wave_timeline",
    "complete_instruction_timeline",
    "cross_capture_comparison",
    "execution_control",
  ]);
  if (
    field(pcCapabilities, "response") !== "capabilities" ||
    pcCaptureDigest(pcCapabilities) !== captureDigest ||
    !Array.isArray(capabilities) ||
    [...unavailable].some(
      (name) =>
        !capabilities.some(
          (capability) =>
            field(capability, "name") === name && field(capability, "availability") === "unavailable",
        ),
    )
  ) {
    issues.push("PC Sample Capture V3 capabilities lost an explicit unavailable boundary");
  }
  return issues;
}

export const debugSimMilestoneProjection = {
  compiler: DEBUG_SIM_COMPILER_PIN,
  sourceVariables: {
    exportReceiptRaw: sourceExportReceiptRaw,
    map: sourceMap,
    mapRaw: sourceMapRaw,
    response: sourceVariableResponse,
    responsesRaw: sourceVariablesRaw,
  },
  explorations: {
    race: explorationRace,
    "no-race": explorationNoRace,
    incomplete: explorationIncomplete,
  },
  replayResult,
  replayScheduleRaw,
  waves: {
    32: { result: wave32Result, failure: wave32Error },
    64: { result: wave64Result, failure: wave64Error },
  },
  counterCapture,
  pcSamples: {
    capabilities: pcCapabilities,
    captureRaw: pcSampleCaptureRaw,
    open: pcSampleOpen,
    page: pcSamplePage,
    hotspots: pcHotspots,
  },
};

const mappedSourceVariables = sourceMap.variables as JsonObject[];
const queriedSourceVariables = field(sourceVariableResponse, "values") as JsonObject[];

export const debugSimSourceVariableFixture = {
  compiler: DEBUG_SIM_COMPILER_PIN,
  bundleSubject: field(sourceMap.binding, "bundle_subject_identity") as string,
  canonicalKir: field(field(sourceMap.binding, "canonical_kir"), "digest") as string,
  sourceLocation: field(
    field(field(field(sourceVariableResponse, "snapshot"), "site"), "source"),
    "location",
  ) as JsonObject,
  scopes: sourceMap.scopes,
  variables: mappedSourceVariables.map((mapped) => {
    const queried = queriedSourceVariables.find(
      (candidate) => field(candidate, "name") === mapped.name,
    )!;
    const availability = field(field(queried, "availability"), "value") as JsonObject;
    const captured = field(availability, "status") === "captured";
    const value = field(availability, "value");
    return {
      identity: mapped.identity as string,
      name: mapped.name as string,
      scopeDepth: queried.scope_depth as number,
      generation: queried.generation as number,
      fallback: mapped.fallback as string,
      status: field(availability, "status") as string,
      reason: field(availability, "reason") as string | undefined,
      provenance: field(availability, "provenance") as string | undefined,
      encoding: field(value, "encoding") as string | undefined,
      displayValue:
        captured && field(value, "encoding") === "bits"
          ? (field(value, "bits") as string)
          : captured && field(value, "encoding") === "allocation_relative_pointer"
            ? `alloc#${field(field(value, "allocation"), "ordinal")} +${field(value, "byte_offset")}`
            : "not represented",
    };
  }),
  raw: {
    exportReceipt: sourceExportReceiptRaw,
    map: sourceMapRaw,
    response: sourceVariablesRaw,
  },
} as const;

export const debugSimExplorationFixtures = [
  {
    id: "race",
    label: "Race observed",
    description: "Three bounded schedules retain the first exact four-byte conflict.",
    raw: explorationRaceRaw,
    capture: explorationRace as JsonObject,
    witnessKey: "first_race",
  },
  {
    id: "no-race",
    label: "No race observed",
    description: "Three bounded schedules complete without a racing conflict; this is not a proof.",
    raw: explorationNoRaceRaw,
    capture: explorationNoRace as JsonObject,
    witnessKey: "first_no_race",
  },
  {
    id: "incomplete",
    label: "Assessment incomplete",
    description: "The fence can affect happens-before, so the model refuses an exact race verdict.",
    raw: explorationIncompleteRaw,
    capture: explorationIncomplete as JsonObject,
    witnessKey: "first_incomplete",
  },
] as const;

export const debugSimWaveFixtures = {
  32: {
    result: wave32Result as JsonObject,
    failure: wave32Error as JsonObject,
  },
  64: {
    result: wave64Result as JsonObject,
    failure: wave64Error as JsonObject,
  },
} as const;

const counterDefinitions = (counterCapture as JsonObject).counter_definitions as JsonObject[];
const counterDispatches = (counterCapture as JsonObject).dispatches as JsonObject[];

export const debugSimCounterFixture = {
  schema: "SemanticCounterCaptureV2",
  sourceKind: (counterCapture as JsonObject).source_kind as string,
  definitions: counterDefinitions.map((definition) => ({
    identity: definition.identity as string,
    name: definition.name as string,
  })),
  dispatches: counterDispatches.map((dispatch) => ({
    identity: dispatch.identity as string,
    collection: dispatch.collection_index as number,
    durationTicks: dispatch.duration_ticks as number,
    correlation: dispatch.source_and_isa_correlation as string,
    values: ((dispatch.values as JsonObject[]) ?? []).map((value) => {
      const ordinal = counterDispatches
        .flatMap((candidate) => candidate.values as JsonObject[])
        .indexOf(value);
      const word = counterBitWords[ordinal];
      return {
        counterIdentity: value.counter_identity as string,
        exactBits: `0x${BigInt(word).toString(16).padStart(16, "0")}`,
        value: decodeF64(word),
      };
    }),
  })),
  raw: counterCaptureRaw,
  loss: "unknown",
  dimensionCorrelation: "unavailable_record_has_no_instance_identity",
} as const;

const pcSamples = field(field(pcSamplePage, "page"), "items") as JsonObject[];
const pcHotspotItems = field(field(pcHotspots, "page"), "items") as JsonObject[];

export const debugSimPcSampleFixture = {
  identity: field(field(field(pcSampleOpen, "context"), "capture_identity"), "digest") as string,
  open: {
    dispatches: field(field(pcSampleOpen, "context"), "dispatch_count") as number,
    samples: field(field(pcSampleOpen, "context"), "raw_sample_count") as number,
    unavailableRelativePc: field(
      field(pcSampleOpen, "context"),
      "relative_pc_unavailable_count",
    ) as number,
    interval: field(field(field(pcSampleOpen, "coverage"), "sampling"), "interval") as number,
    execMaskMeaning: field(
      field(field(pcSampleOpen, "coverage"), "exec_mask_semantics"),
      "meaning",
    ) as string,
    loss: field(field(field(pcSampleOpen, "coverage"), "loss"), "state") as string,
    raw: pcSampleOpenRaw,
  },
  samples: pcSamples.map((item, index) => {
    const sample = field(item, "sample") as JsonObject;
    return {
      identity: sample.identity as string,
      dispatchIdentity: sample.dispatch_identity as string,
      instructionType: sample.instruction_type as string,
      codeObjectOffset: field(sample.pc, "code_object_offset") as number,
      timestamp: pcTimestampWords[index],
      timestampDomain: field(sample.timestamp, "domain") as string,
      execMask: `0x${BigInt(pcExecMaskWords[index]).toString(16).padStart(16, "0")}`,
      workgroup: field(sample.wave, "workgroup") as number[],
      waveInGroup: field(sample.wave, "wave_in_group") as number,
      cuOrWgp: field(sample.wave, "cu_or_wgp") as number,
      simd: field(sample.wave, "simd") as number,
    };
  }),
  sampleCursor: field(field(field(pcSamplePage, "page"), "next_cursor"), "query_binding") as string,
  hotspots: pcHotspotItems.map((item) => {
    const hotspot = field(item, "hotspot") as JsonObject;
    return {
      rank: hotspot.rank as number,
      dispatchIdentity: hotspot.dispatch_identity as string,
      codeObjectOffset: hotspot.code_object_offset as number,
      instructionType: hotspot.instruction_type as string,
      count: hotspot.raw_sample_count as number,
      origin: hotspot.origin as string,
      limitation: hotspot.limitation as string,
    };
  }),
  raw: {
    samples: pcSamplePageRaw,
    hotspots: pcHotspotsRaw,
  },
} as const;

export function validateDebugSimMilestone(): string[] {
  const issues = [
    ...validateExploration(explorationRace, "races_observed"),
    ...validateExploration(explorationNoRace, "no_races_observed"),
    ...validateExploration(explorationIncomplete, "incomplete"),
    ...validateWaveResult(wave32Result, 32),
    ...validateWaveResult(wave64Result, 64),
    ...validateWaveError(wave32Error, 32),
    ...validateWaveError(wave64Error, 64),
    ...validateSourceVariableMilestone(),
    ...validateCounterCapture(counterCapture),
    ...validatePcSampleMilestone(),
  ];
  const raceWitness = field(field(explorationRace, "witnesses"), "first_race");
  if (
    field(raceWitness, "assessment") === undefined ||
    JSON.stringify(field(raceWitness, "assessment")) !==
      JSON.stringify(field(replayResult, "race_assessment")) ||
    field(field(raceWitness, "replay_schedule"), "document") !== replayScheduleRaw
  ) {
    issues.push("race replay does not reproduce the retained witness assessment");
  }
  return issues;
}

const debugSimMilestoneIssues = validateDebugSimMilestone();
if (debugSimMilestoneIssues.length > 0) {
  throw new Error(`Invalid debug/simulator milestone: ${debugSimMilestoneIssues.join("; ")}`);
}
