import requestsRaw from "../../examples/profiler_dispatch_import_v1/agent-requests.jsonl?raw";
import responsesRaw from "../../examples/profiler_dispatch_import_v1/agent-responses.jsonl?raw";
import bundleRaw from "../../examples/profiler_dispatch_import_v1/bundle-v4-projection.json?raw";
import captureRaw from "../../examples/profiler_dispatch_import_v1/capture-projection.json?raw";
import dialectsRaw from "../../examples/profiler_dispatch_import_v1/dialects.json?raw";
import manifestRaw from "../../examples/profiler_dispatch_import_v1/publication-manifest.txt?raw";
import receiptRaw from "../../examples/profiler_dispatch_import_v1/receipt-v1-projection.json?raw";
import milestoneData from "../../config/profiler-dispatch-import-tutorial.json";
import currentMilestonesData from "../../config/debugger-profiler-current-milestones.json";
import { deepFreeze } from "./registry";

type JsonRecord = Record<string, unknown>;

const digestPattern = /^[0-9a-f]{64}$/u;
const objectPairPattern = /^[0-9a-f]{40}:[0-9a-f]{40}$/u;

const exactObject = /^[0-9a-f]{40}$/u;
if (
  currentMilestonesData.schema !== "fe2o3-debugger-profiler-current-milestones-v1" ||
  currentMilestonesData.reviewedOn !== "2026-09-03" ||
  !exactObject.test(currentMilestonesData.physicalDifferential.commit) ||
  !exactObject.test(currentMilestonesData.physicalDifferential.tree) ||
  !exactObject.test(currentMilestonesData.physicalDifferential.packageIsolationCommit) ||
  currentMilestonesData.physicalDifferential.prerequisiteCount !== 14 ||
  currentMilestonesData.physicalDifferential.hardwarePasses !== 0 ||
  currentMilestonesData.physicalDifferential.parityPasses !== 0 ||
  currentMilestonesData.physicalDifferential.blocker !== "protected_verifier_unavailable" ||
  !exactObject.test(currentMilestonesData.runtimeCausality.commit) ||
  currentMilestonesData.runtimeCausality.dispatchJoin !== "unavailable" ||
  currentMilestonesData.runtimeCausality.clockJoin !== "unavailable" ||
  currentMilestonesData.runtimeCausality.deviceCopyProducer !== "unavailable" ||
  currentMilestonesData.runtimeCausality.dependencyProducer !== "unavailable" ||
  !exactObject.test(currentMilestonesData.rocprofWrapperOverhead.commit) ||
  !exactObject.test(currentMilestonesData.rocprofWrapperOverhead.tree) ||
  currentMilestonesData.rocprofWrapperOverhead.warmupPairs !== 5 ||
  currentMilestonesData.rocprofWrapperOverhead.measuredPairs !== 30 ||
  currentMilestonesData.rocprofWrapperOverhead.rawMedianNs !== 819180977 ||
  currentMilestonesData.rocprofWrapperOverhead.wrappedMedianNs !== 1075406076 ||
  currentMilestonesData.rocprofWrapperOverhead.pairedMedianDeltaBps !== 3135 ||
  currentMilestonesData.rocprofWrapperOverhead.candidateBudgetBps !== 1000 ||
  currentMilestonesData.rocprofWrapperOverhead.collectorArtifacts !== 0 ||
  currentMilestonesData.rocprofWrapperOverhead.captureOverhead !==
    "unavailable_no_admitted_capture" ||
  currentMilestonesData.rocprofWrapperOverhead.productionQualified !== false ||
  !exactObject.test(currentMilestonesData.liveDirectKfdRocprof.investigationCommit) ||
  currentMilestonesData.liveDirectKfdRocprof.directKfdQueueRegistration !==
    "unavailable_in_installed_rocprofv3_cli" ||
  !exactObject.test(currentMilestonesData.profilerVariantV3.commit) ||
  !exactObject.test(currentMilestonesData.profilerVariantV3.tree) ||
  currentMilestonesData.profilerVariantV3.bundleKirVersion !== 7 ||
  currentMilestonesData.profilerVariantV3.catalogKirVersion !== 8 ||
  currentMilestonesData.profilerVariantV3.uniqueCatalogJoin !== true ||
  currentMilestonesData.profilerVariantV3.archiveVersion !== 1 ||
  currentMilestonesData.profilerVariantV3.agentTransport !== "restartable_jsonl" ||
  currentMilestonesData.profilerVariantV3.maximumOpenArchives !== 2 ||
  currentMilestonesData.profilerVariantV3.maximumRequests !== 64 ||
  currentMilestonesData.profilerVariantV3.completeFinalizerReplay !== true ||
  currentMilestonesData.profilerVariantV3.externalProvenance !== "not_authenticated" ||
  currentMilestonesData.profilerVariantV3.scheduleExecution !== "typed_unavailable" ||
  currentMilestonesData.profilerVariantV3.causality !== "typed_unavailable"
) {
  throw new Error("direct-KFD differential or runtime-causality milestone is malformed");
}

export const profilerPhysicalDifferentialMilestone = deepFreeze(
  currentMilestonesData.physicalDifferential,
);
export const profilerRuntimeCausalityMilestone = deepFreeze(
  currentMilestonesData.runtimeCausality,
);
export const profilerWrapperOverheadMilestone = deepFreeze(
  currentMilestonesData.rocprofWrapperOverhead,
);
export const profilerDirectKfdInvestigationMilestone = deepFreeze(
  currentMilestonesData.liveDirectKfdRocprof,
);
export const profilerVariantV3Milestone = deepFreeze(
  currentMilestonesData.profilerVariantV3,
);
const boundCompilerRevision =
  "a5438d82203eeb223b4ff8aa25ea6581b1f1af81:3a319954541af34b3d77366498e73fe4663f2044";
const milestoneKeys = [
  "compilerRevision",
  "fixtureKind",
  "fixtureSha256",
  "issue",
  "issueState",
  "liveValidation",
  "mirrors",
  "qualification",
  "remainingBoundaries",
  "reviewedOn",
  "schema",
  "status",
  "target",
] as const;
const qualificationKeys = ["focusedResults", "genericCore", "scope", "state"] as const;
const genericCoreKeys = ["command", "result", "softNofile", "summaries"] as const;
const liveValidationKeys = [
  "checkpointRevision",
  "gpuDispatchObserved",
  "host",
  "machine",
  "notObserved",
  "observed",
  "state",
  "test",
] as const;
const fixtureDigestKeys = [
  "bundle",
  "capture",
  "dialects",
  "manifest",
  "receipt",
  "requests",
  "responses",
] as const;
const authorityKeys = [
  "compiler",
  "runtime",
  "artifact",
  "source_map",
  "kernel_symbol",
  "source_isa",
  "att",
  "performance",
  "gpu_execution",
  "producer_attestation",
] as const;
const observedLoaderFacts = [
  "sealed-route-validation",
  "target-mapping",
  "sdk-core-mapping",
  "sdk-tool-mapping",
  "no-internal-role-variable-leakage",
] as const;
const unavailableLoaderFacts = [
  "interpreter-mapping",
  "bootstrap-or-adapter-mapping",
  "real-gpu-dispatch-rocprofv3-to-import-roundtrip",
  "att-decode",
  "performance",
] as const;
const focusedQualificationResults = [
  ["cargo fmt --all -- --check", "passed"],
  ["cargo check -p cargo-fe2o3 --all-targets", "passed"],
  ["cargo test -p fe2o3-semantic-import --all-targets", "72 passed"],
  ["cargo test -p cargo-fe2o3 --bin cargo-fe2o3 profile_command", "29 passed"],
  [
    "FE2O3_REQUIRE_GFX942_PROFILE_TEST=1 cargo test -p cargo-fe2o3 --test profile_cli",
    "19 passed",
  ],
  ["cargo test -p fe2o3-semantic-query --all-targets", "99 passed"],
  ["cargo test -p fe2o3-debug-cli --test agent_reference_client_v1", "4 passed"],
  ["bash scripts/tests/hosted-parity-ci.sh", "passed"],
] as const;
const genericCoreSummaries = [
  "cargo-fe2o3: 340 passed; 1 ignored",
  "profile_cli: 19/19 passed",
  "Worker V3: 50 passed; 1 ignored",
  "broad CPU, doctest, backend, UI, policy, rustc-codegen, and S09 partitions passed",
] as const;
const remainingBoundaries = [
  "no-real-gpu-dispatch-rocprofv3-to-import-roundtrip",
  "att-decoder-unavailable-without-mutation-proof-sealed-route",
  "protected-source-isa-3x2-matrix-not-run",
  "t3-profiler-track-not-closed",
  "t5-distributed-overlap-blocked-on-issue-182-producer",
] as const;
const requiredMirrors = [
  "harsh-nod/fe2o3@refs/heads/main",
  "powderluv/fe2o3@refs/heads/main",
] as const;

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function parseJson(raw: string, label: string): JsonRecord {
  return record(JSON.parse(raw) as unknown, label);
}

function parseJsonl(raw: string, label: string): JsonRecord[] {
  return raw.trim().split("\n").map((line, index) =>
    record(JSON.parse(line) as unknown, `${label} line ${index + 1}`));
}

function isExactStringArray(value: unknown, expected: readonly string[]): boolean {
  return Array.isArray(value) &&
    value.length === expected.length &&
    value.every((item, index) => item === expected[index]);
}

function hasCompleteFalseAuthority(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const authority = value as JsonRecord;
  return Object.keys(authority).length === authorityKeys.length &&
    authorityKeys.every((key) => authority[key] === false);
}

const dialectProjection = parseJson(dialectsRaw, "dialect projection");
const captureProjection = parseJson(captureRaw, "capture projection");
const bundleProjection = parseJson(bundleRaw, "bundle projection");
const receiptProjection = parseJson(receiptRaw, "receipt projection");
const requests = parseJsonl(requestsRaw, "illustrative query request");
const responses = parseJsonl(responsesRaw, "illustrative query response");

export function validateProfilerImportTutorial(): string[] {
  const issues: string[] = [];
  if (
    !isExactStringArray(Object.keys(milestoneData).sort(), milestoneKeys) ||
    milestoneData.schema !== "fe2o3-profiler-dispatch-import-tutorial-milestone-v1" ||
    milestoneData.reviewedOn !== "2026-09-01"
  ) {
    issues.push("milestone schema is not exact");
  }
  if (milestoneData.status !== "implemented-qualified-bounded-checkpoint") {
    issues.push("milestone status exceeds or understates the bounded qualified checkpoint");
  }
  if (milestoneData.issue !== 215 || milestoneData.issueState !== "open") {
    issues.push("issue #215 must remain open for the unfinished matrix");
  }
  if (
    milestoneData.compilerRevision !== boundCompilerRevision ||
    !objectPairPattern.test(milestoneData.compilerRevision)
  ) {
    issues.push("compiler revision must match the exact reviewed commit:tree pair");
  }
  if (
    milestoneData.target !== "gfx942:xnack-unobserved" ||
    milestoneData.fixtureKind !== "synthetic-deterministic-schematic-unexecuted"
  ) {
    issues.push("target and synthetic fixture kind must retain their exact boundaries");
  }
  const digestKeys = Object.keys(milestoneData.fixtureSha256).sort();
  if (
    !isExactStringArray(digestKeys, fixtureDigestKeys) ||
    Object.values(milestoneData.fixtureSha256).some(
      (digest) => !digestPattern.test(digest),
    )
  ) {
    issues.push("every tutorial fixture digest must be exact SHA-256");
  }
  if (
    !isExactStringArray(
      Object.keys(milestoneData.liveValidation).sort(),
      liveValidationKeys,
    ) ||
    milestoneData.liveValidation.host !== "mi300x" ||
    milestoneData.liveValidation.machine !== "MI300X" ||
    milestoneData.liveValidation.state !==
      "bounded-importer-sealed-loader-qualified" ||
    milestoneData.liveValidation.checkpointRevision !== milestoneData.compilerRevision ||
    !objectPairPattern.test(milestoneData.liveValidation.checkpointRevision) ||
    milestoneData.liveValidation.test !==
      "installed_collector_executes_sealed_entry_images_without_role_env_leakage" ||
    !isExactStringArray(milestoneData.liveValidation.observed, observedLoaderFacts) ||
    !isExactStringArray(milestoneData.liveValidation.notObserved, unavailableLoaderFacts) ||
    milestoneData.liveValidation.gpuDispatchObserved !== false
  ) {
    issues.push("live validation must bind the exact checkpoint and observed scope");
  }
  const focusedResults = milestoneData.qualification.focusedResults;
  if (
    !isExactStringArray(Object.keys(milestoneData.qualification).sort(), qualificationKeys) ||
    milestoneData.qualification.scope !==
      "bounded-in-process-importer-and-sealed-loader-checkpoint" ||
    milestoneData.qualification.state !== "qualified" ||
    focusedResults.length !== focusedQualificationResults.length ||
    focusedResults.some((entry, index) =>
      !isExactStringArray(Object.keys(entry).sort(), ["command", "result"]) ||
      entry.command !== focusedQualificationResults[index][0] ||
      entry.result !== focusedQualificationResults[index][1]
    ) ||
    !isExactStringArray(
      Object.keys(milestoneData.qualification.genericCore).sort(),
      genericCoreKeys,
    ) ||
    milestoneData.qualification.genericCore.command !==
      "bash scripts/ci-local.sh generic-core" ||
    milestoneData.qualification.genericCore.result !== "passed" ||
    milestoneData.qualification.genericCore.softNofile !== 1024 ||
    !isExactStringArray(
      milestoneData.qualification.genericCore.summaries,
      genericCoreSummaries,
    ) ||
    !isExactStringArray(milestoneData.remainingBoundaries, remainingBoundaries)
  ) {
    issues.push("qualification evidence or remaining boundaries are not exact");
  }
  if (!isExactStringArray(milestoneData.mirrors, requiredMirrors)) {
    issues.push("compiler mirror requirements are not exact");
  }

  const dialects = array(dialectProjection.dialects, "dialects").map((value, index) =>
    record(value, `dialect ${index + 1}`));
  const csv = dialects.find(
    (dialect) => dialect.id === "rocprofv3_csv_current22_column_stream_id",
  );
  const headers = array(csv?.headers, "CSV headers");
  if (
    dialectProjection.protocol_wire_record !== false ||
    dialectProjection.fixture_kind !==
      "synthetic-deterministic-schematic-unexecuted" ||
    dialects.length !== 3 ||
    headers.length !== 22 ||
    headers[3] !== "Stream_Id" ||
    headers[5] !== "Dispatch_Id"
  ) {
    issues.push("rocprof dialect inventory is not the exact 2 JSON + 22-column CSV set");
  }

  const bindings = array(
    dialectProjection.json_process_local_bindings,
    "process-local bindings",
  ).map((value, index) => record(value, `binding ${index + 1}`));
  if (
    bindings.length !== 2 ||
    bindings[0]?.opaque_agent_handle !== 7001 ||
    bindings[1]?.opaque_agent_handle !== 7001 ||
    bindings[0]?.process_index === bindings[1]?.process_index ||
    bindings[0]?.direct_kfd_node === bindings[1]?.direct_kfd_node
  ) {
    issues.push("fixture must demonstrate process-local opaque handle reuse");
  }

  const captureIdentity = captureProjection.capture_identity;
  const embeddedCapture = record(bundleProjection.capture, "embedded capture");
  if (
    captureProjection.protocol_wire_record !== false ||
    captureProjection.identity_semantics !==
      "schematic_labels_not_content_identities" ||
    captureIdentity !== "schematic:capture" ||
    embeddedCapture.identity !== captureIdentity ||
    receiptProjection.capture_identity !== captureIdentity ||
    receiptProjection.bundle_identity !== bundleProjection.bundle_identity ||
    bundleProjection.bundle_identity !== "schematic:bundle" ||
    receiptProjection.receipt_identity !== "schematic:receipt" ||
    bundleProjection.identity_semantics !==
      "schematic_labels_not_content_identities" ||
    receiptProjection.identity_semantics !==
      "schematic_labels_not_content_identities"
  ) {
    issues.push("capture, bundle, and receipt schematic relation is inconsistent");
  }
  if (captureProjection.publication_shape !== "embedded_in_bundle_not_a_separate_file") {
    issues.push("capture projection must disclose that production embeds Capture in Bundle");
  }
  if (
    !hasCompleteFalseAuthority(bundleProjection.authority) ||
    !hasCompleteFalseAuthority(receiptProjection.authority)
  ) {
    issues.push("Bundle and Receipt must retain the complete false-authority matrix");
  }
  const captureTruth = record(captureProjection.truth, "capture truth");
  if (
    captureTruth.source_records !== "synthetic" ||
    captureTruth.gpu_execution !== "unavailable" ||
    captureTruth.performance_conclusion !== "unavailable" ||
    captureTruth.authority_evidence !== false
  ) {
    issues.push("Capture truth must retain synthetic and authority-free boundaries");
  }
  if (
    !manifestRaw.includes("manifest-publication: last") ||
    !manifestRaw.includes("identity-labels: schematic-not-content-identities") ||
    !manifestRaw.includes("gpu-execution-observed: false") ||
    !manifestRaw.includes("att-decoded: false") ||
    !manifestRaw.includes("performance-authority: false")
  ) {
    issues.push("manifest-last projection or its nonclaims are absent");
  }

  if (
    requests.length !== 3 ||
    responses.length !== 3 ||
    requests.some((request) =>
      request.schema !== "fe2o3-profiler-import-query-exercise-request-v1" ||
      request.protocol_wire_record !== false ||
      request.production_service_available !== false ||
      request.exercise_kind !== "deterministic_illustrative_non_wire"
    ) ||
    responses.some((response) =>
      response.schema !== "fe2o3-profiler-import-query-exercise-response-v1" ||
      response.protocol_wire_record !== false ||
      response.production_service_available !== false ||
      response.exercise_kind !== "deterministic_illustrative_non_wire"
    ) ||
    requests.some((request, index) => request.request_id !== responses[index]?.request_id) ||
    responses[0]?.status !== "illustrative_result" ||
    responses[1]?.status !== "illustrative_result" ||
    responses[2]?.status !== "unavailable" ||
    responses[2]?.truth_origin !== "unavailable"
  ) {
    issues.push("illustrative non-wire query exercise is not exact and typed");
  }
  return issues;
}

const validationIssues = validateProfilerImportTutorial();
if (validationIssues.length > 0) {
  throw new Error(`profiler import tutorial is malformed: ${validationIssues.join("; ")}`);
}

export const profilerImportMilestone = deepFreeze(milestoneData);
export const profilerImportDialectProjection = deepFreeze(dialectProjection);
export const profilerImportCaptureProjection = deepFreeze(captureProjection);
export const profilerImportBundleProjection = deepFreeze(bundleProjection);
export const profilerImportReceiptProjection = deepFreeze(receiptProjection);
export const profilerImportManifest = manifestRaw.trimEnd();
export const profilerImportRequests = deepFreeze(requests);
export const profilerImportResponses = deepFreeze(responses);

export const profilerImportFixtureDirectory = "examples/profiler_dispatch_import_v1";

export const profilerImportCommands = [
  "cargo fe2o3 profile --kind dispatch-json \\",
  "  --kir-v7 /absolute/kernel.kir --output-dir /absolute/new-capture \\",
  "  -- /absolute/target [arguments...]",
  "# Review plan-sha256, then repeat with:",
  "# --collect --authorize-collection <exact-plan-sha256>",
] as const;

export const profilerImportDialectPlanes = deepFreeze([
  {
    id: "installed-json",
    label: "Installed JSON",
    summary: "ROCprofiler SDK 1.1 serializer 97f5574; exact nested types and counts.",
    evidence: JSON.stringify(array(dialectProjection.dialects, "dialects")[0], null, 2),
  },
  {
    id: "forward-json",
    label: "Forward JSON",
    summary: "Reviewed serializer 848868d; forward-only arrays are bounded and opaque.",
    evidence: JSON.stringify(array(dialectProjection.dialects, "dialects")[1], null, 2),
  },
  {
    id: "current-csv",
    label: "Current CSV",
    summary: "Exact ordered 22-column header with Stream_Id and canonical decimal Agent cells.",
    evidence: JSON.stringify(array(dialectProjection.dialects, "dialects")[2], null, 2),
  },
]);

export const profilerImportExecutionImages = deepFreeze([
  { label: "Interpreter", state: "sealed", detail: "read-only content snapshot" },
  { label: "Collector script", state: "sealed", detail: "exact or allowlisted installed adapter" },
  { label: "Target", state: "sealed", detail: "exact argv launches retained content" },
  { label: "SDK core", state: "sealed", detail: "loader receives read-only image" },
  { label: "SDK tool", state: "sealed", detail: "loader receives read-only image" },
  { label: "ATT decoder", state: "unavailable", detail: "requires mutable namespace; no sealed route" },
]);

export const profilerImportPublicationStages = deepFreeze([
  { label: "Source", identity: "schematic:source", detail: "retained source bytes" },
  { label: "Binding", identity: "schematic:binding", detail: "KIR + direct-KFD mapping" },
  { label: "Capture", identity: "schematic:capture", detail: "embedded in Bundle" },
  { label: "Bundle", identity: "schematic:bundle", detail: "durable before receipt" },
  { label: "Receipt", identity: "schematic:receipt", detail: "reread + exact tuple readmission" },
  { label: "Manifest", identity: "last", detail: "published only after final revalidation" },
]);

export const profilerImportTruthRows = deepFreeze([
  ["Tutorial source records", "synthetic", "Deterministic schematic projections; no collector or GPU produced them."],
  ["Bounded MI300X checkpoint", "qualified", "Focused importer, profile, query, agent-client, and hosted-parity checks passed; generic-core passed with soft nofile 1024. This does not qualify T3 overall."],
  ["Real GPU rocprof roundtrip", "unavailable", "A pure direct-KFD target ran under the installed ROCProfiler SDK 1.1.0 wrapper, but the collector emitted no dispatch artifact, so no GPU dispatch flowed from rocprofv3 through import."],
  ["Wrapper process wall time", "+31.35% observed", "Five warmup and thirty measured alternating pairs compare raw and wrapped processes for one exact MI300X target. Empty artifact inventories make actual kernel-capture overhead unavailable, not zero."],
  ["Exact KIR V7", "declared + admitted", "Canonical verified bytes constrain target family and Wave64 compatibility; they do not prove execution."],
  ["Profiler Variant V3 archive", "restartable JSONL", "A self-contained Archive V1 replays the complete Worker V3 finalizer derivation, reconstructs the exact V7-to-V8 bridge and catalog owners, and serves bounded Variant V3 comparisons in a fresh process. External producer provenance remains unauthenticated."],
  ["ATT", "unavailable", "Sealed collection rejects the decoder's mutable-directory requirement."],
  ["Protected source/ISA 3x2 matrix", "not run", "The protected family-by-target acceptance remains unavailable and is not covered by this checkpoint."],
  ["T5 distributed overlap", "blocked on #182", "No issue #182 typed producer supplies admitted operation, transfer, collective, and clock-correlation identities."],
  ["Performance", "unavailable", "Durations are opaque collector ticks and this fixture is unexecuted."],
] as const);

export const profilerImportSources = deepFreeze([
  { label: "Profile orchestration + sealed execution", path: "crates/cargo-fe2o3/src/profile_command.rs" },
  { label: "In-process dispatch import", path: "crates/cargo-fe2o3/src/profile_dispatch_import_v1.rs" },
  { label: "Strict rocprof parser + projector", path: "crates/fe2o3-semantic-import/src/lib.rs" },
  { label: "Raw-source/projection relation", path: "crates/fe2o3-semantic-import/src/raw_source_relation.rs" },
  { label: "Standalone import CLI boundary", path: "crates/fe2o3-semantic-import/src/bin/fe2o3-profiler-import.rs" },
  { label: "Semantic Capture", path: "crates/fe2o3-semantic-import/src/capture.rs" },
  { label: "Semantic Profiler Bundle V4", path: "crates/fe2o3-semantic-import/src/profiler_bundle.rs" },
  { label: "Production CLI acceptance", path: "crates/cargo-fe2o3/tests/profile_cli.rs" },
  { label: "Bounded wrapper overhead contract", path: "crates/cargo-fe2o3/src/profile_wrapper_overhead_v1.rs", commit: profilerWrapperOverheadMilestone.commit, tree: profilerWrapperOverheadMilestone.tree },
  { label: "Exact MI300X wrapper record", path: "docs/evidence/mi300x-rocprof-wrapper-host-wall-2026-09-03.json", commit: profilerWrapperOverheadMilestone.commit, tree: profilerWrapperOverheadMilestone.tree },
  { label: "Direct-KFD empty-inventory investigation", path: "docs/evidence/mi300x-direct-kfd-rocprof-2026-09-03.md", commit: profilerDirectKfdInvestigationMilestone.investigationCommit, tree: profilerDirectKfdInvestigationMilestone.investigationTree },
  { label: "Installed JSON dialect fixture", path: "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-installed-97f5574-kernel-dispatch-schema.json" },
  { label: "Forward JSON dialect fixture", path: "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-forward-848868-kernel-dispatch-schema.json" },
  { label: "Current CSV dialect fixture", path: "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-current-kernel-dispatch.csv" },
  { label: "Reviewed dialect provenance manifest", path: "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-current-schema-fixture-v1.txt" },
  { label: "Issue #215 closure matrix", path: "docs/debugger-profiler-architecture-v1.md" },
  { label: "Protected source/ISA 3x2 boundary", path: "docs/source-isa-characteristic-acceptance-v2.md" },
  { label: "T5 issue #182 dependency contract", path: "crates/fe2o3-semantic-query/src/distributed_overlap_v1.rs" },
  { label: "Profiler Variant V3 production bridge", path: "crates/fe2o3-semantic-query/src/profiler_variant_v3.rs", commit: profilerVariantV3Milestone.commit, tree: profilerVariantV3Milestone.tree },
  { label: "Production profiler KIR Archive V1", path: "crates/fe2o3-hsaco-finalize/src/production_profiler_kir_archive_v1.rs", commit: profilerVariantV3Milestone.commit, tree: profilerVariantV3Milestone.tree },
  { label: "Restartable Variant V3 JSONL service", path: "crates/fe2o3-semantic-query/src/agent_variant_service_v3.rs", commit: profilerVariantV3Milestone.commit, tree: profilerVariantV3Milestone.tree },
  { label: "Profiler Variant V3 contract", path: "docs/profiler-variant-v3.md", commit: profilerVariantV3Milestone.commit, tree: profilerVariantV3Milestone.tree },
  { label: "Production profiler archive contract", path: "docs/production-profiler-kir-archive-v1.md", commit: profilerVariantV3Milestone.commit, tree: profilerVariantV3Milestone.tree },
]);

export function profilerImportSourceUrl(path: string): string | null {
  if (
    path.trim().length === 0 ||
    path !== path.trim() ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").includes("..")
  ) {
    throw new Error("profiler import source path must stay repository-relative");
  }
  const source = profilerImportSources.find((candidate) => candidate.path === path);
  const [importCommit] = profilerImportMilestone.compilerRevision.split(":");
  const commit = source && typeof source.commit === "string" ? source.commit : importCommit;
  return typeof commit === "string" && exactObject.test(commit)
    ? `https://github.com/harsh-nod/fe2o3/blob/${commit}/${path}`
    : null;
}
