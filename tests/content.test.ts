import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { currentState } from "../src/content/current-state";
import {
  DEBUG_SIM_ARTIFACT_SHA256,
  DEBUG_SIM_COMPILER_PIN,
  debugSimCounterFixture,
  debugSimMilestoneProjection,
  debugSimPcSampleFixture,
  debugSimSourceVariableFixture,
  validateDebugSimMilestone,
} from "../src/content/debug-sim-milestone";
import {
  DEBUGGER_RESPONSES_SHA256,
  DEBUGGER_WORKBENCH_PROJECTION_SHA256,
  debuggerComparisonLinks,
  debuggerComparisonRows,
  debuggerProtocolRequests,
  debuggerWorkbenchFixture,
  debuggerWorkbenchProjection,
  validateDebuggerProtocolRequests,
  validateDebuggerWorkbenchFixture,
} from "../src/content/debugger-workbench";
import {
  liveKfdCurrentImplementationPaths,
  liveKfdPublication,
  liveKfdSourceUrl,
  liveKfdSources,
  liveWorkbenchBackends,
} from "../src/content/live-kfd-debugger";
import {
  profilerImportBundleProjection,
  profilerImportCaptureProjection,
  profilerImportDialectProjection,
  profilerImportManifest,
  profilerImportMilestone,
  profilerImportReceiptProjection,
  profilerImportRequests,
  profilerImportResponses,
  profilerImportSources,
  profilerImportSourceUrl,
  validateProfilerImportTutorial,
} from "../src/content/profiler-dispatch-import";
import { evidenceCatalog } from "../src/content/evidence-catalog";
import { functionalRefinementPublication } from "../src/content/functional-refinement-publication";
import {
  advancedRustEvidence,
  observedAdvancedEvidence,
  type AdvancedRustEvidence,
} from "../src/content/gfx950-advanced-evidence";
import { advancedPerformanceLessonIds } from "../src/content/gfx950-advanced-performance";
import {
  advancedCoreSourceCommit,
  advancedCoreSourceTree,
} from "../src/content/modules-10";
import { FE2O3_PIN, evidenceLabels } from "../src/content/model";
import { functionalCorrectnessCatalog } from "../src/content/functional-correctness-catalog";
import {
  functionalGateModeLabels,
  validateFunctionalReferenceGate,
} from "../src/content/functional-gates";
import { narrativeFingerprint } from "../src/content/narrative-fingerprint";
import { semanticCorrectnessMilestone } from "../src/content/semantic-correctness-milestone";
import {
  SOURCE_DEBUGGER_REQUESTS_SHA256,
  SOURCE_DEBUGGER_RESPONSES_SHA256,
  sourceDebuggerRequests,
  sourceDebuggerResponses,
  validateSourceDebuggerMilestone,
} from "../src/content/source-debugger-milestone";
import {
  sourceIsaCharacteristicDuplicateFacts,
  sourceIsaCharacteristicCollectionHex,
  sourceIsaCharacteristicFixtureReady,
  sourceIsaCharacteristicIntervals,
  sourceIsaCharacteristicLineage,
  sourceIsaCharacteristicMemoryTarget,
  sourceIsaCharacteristicMilestone,
  sourceIsaCharacteristicPlanes,
  sourceIsaCharacteristicRequests,
  sourceIsaCharacteristicResponses,
  sourceIsaCharacteristicSources,
  sourceIsaCharacteristicStructuralTarget,
  sourceIsaAgentCollectionHex,
  sourceIsaAgentMilestone,
  sourceIsaAgentRequests,
  sourceIsaAgentResponses,
  sourceIsaAgentSources,
} from "../src/content/source-isa-agent";
import {
  developmentCheckpointIds,
  developmentCheckpoints,
  developmentCheckpointDetail,
  kernelProgress,
  progressSnapshot,
  tiledGemmV1Commits,
  validateProgress,
} from "../src/content/progress";
import {
  narrativeEntry,
  narrativeIds,
  narrativeRegistrySnapshot,
  validateNarrativeRegistry,
} from "../src/content/narrative-registry";
import {
  progressNarrativeRegistrySnapshot,
  SAFE_PROGRESS_DETAIL,
  validateProgressNarrativeRegistry,
} from "../src/content/progress-narrative-registry";
import {
  expectedCargoTestSourcePath,
  isExactCargoClippyCommand,
  parseExactCargoTestCommand,
  stagedEvidenceDetail,
  stagedEvidenceOrder,
  stagedEvidenceRecord,
  validateStagedEvidenceCatalog,
} from "../src/content/staged-evidence";
import {
  sourceMilestoneOrder,
  sourceMilestoneRecord,
  validateSourceMilestoneCatalog,
} from "../src/content/source-milestones";
import { validateCurriculum } from "../src/content/validate";

describe("agent-native source/ISA inspection milestone", () => {
  it("pins the exact observation-only transcript and open qualification boundary", () => {
    expect(sourceIsaAgentMilestone).toMatchObject({
      compilerCommit: "8dc1ac8ec3e20801d8ec7054176fc031ce05ca25",
      compilerTree: "50846a969869b4fe858025d8a365dbaa1df743bd",
      issue: 215,
      issueState: "open",
      protectedMatrixRun: false,
      fixtureCanonicalBytes: 144,
    });
    expect(
      createHash("sha256")
        .update(Buffer.from(sourceIsaAgentCollectionHex, "hex"))
        .digest("hex"),
    ).toBe(sourceIsaAgentMilestone.fixtureSha256);
    expect(sourceIsaAgentRequests).toHaveLength(3);
    expect(sourceIsaAgentResponses.map((response) => response.response_revision)).toEqual([
      1,
      2,
      3,
    ]);
    expect(sourceIsaAgentResponses[1]).toMatchObject({
      status: "ok",
      result: {
        authority: {
          observation_only: true,
          compiler_authority: false,
          runtime_authority: false,
          hardware_execution_observed: false,
          semantic_refinement_proved: false,
        },
        collection: {
          completeness: { state: "incomplete", missing_unit_count: 1 },
        },
        page: { page_exhausted: true },
      },
    });
    expect(sourceIsaAgentResponses[2]).toMatchObject({
      status: "error",
      error: "invalid_collection",
      terminal: false,
    });
    expect(sourceIsaAgentSources).toHaveLength(5);
    expect(
      evidenceCatalog.gitObjects.find(
        (object) => object.label === "agent-native source/ISA inspection milestone",
      ),
    ).toMatchObject({
      commit: sourceIsaAgentMilestone.compilerCommit,
      tree: sourceIsaAgentMilestone.compilerTree,
      sourcePaths: sourceIsaAgentSources.map((source) => source.path),
    });
  });

  it("pins the exact synthetic four-plane characteristic transcript without elevating it", () => {
    expect(sourceIsaCharacteristicMilestone).toMatchObject({
      status: "implemented-exact-fixture",
      compilerCommit: "861e8a9027bffa4dc5bf61d149eb2277dbefe692",
      compilerTree: "0233d541ffb8c2a573444eda76683bc4adca2cb9",
      fixtureKind: "synthetic-canonical-self-claimed-characteristic-archive",
      fixtureCanonicalBytes: 1424,
      fixtureSha256: "ad395666f9a036a259ce6a8f6e47a568693dbfe1c923c3eb6bd062492627b3b4",
      collectionIdentity: "5595821cf85ebc8cb5018f68a7ac07e938af0b4ed424e9f4039201581db23a7c",
      synthetic: true,
      hardwareExecuted: false,
      archiveAuthenticated: false,
      issue: 215,
      issueState: "open",
      protectedMatrixRun: false,
      expectedPlaneCount: 4,
    });
    expect(sourceIsaCharacteristicFixtureReady).toBe(true);
    expect(Buffer.from(sourceIsaCharacteristicCollectionHex, "hex")).toHaveLength(1424);
    expect(
      createHash("sha256")
        .update(Buffer.from(sourceIsaCharacteristicCollectionHex, "hex"))
        .digest("hex"),
    ).toBe(sourceIsaCharacteristicMilestone.fixtureSha256);
    expect(sourceIsaCharacteristicRequests).toHaveLength(4);
    expect(sourceIsaCharacteristicResponses).toHaveLength(4);
    expect(sourceIsaCharacteristicPlanes.map((plane) => plane.label)).toEqual([
      "Capability",
      "Targets",
      "Facts",
      "Intervals",
    ]);
    expect(sourceIsaCharacteristicPlanes.every((plane) =>
      plane.state === "available" && plane.request !== null && plane.response !== null
    )).toBe(true);
    expect(sourceIsaCharacteristicLineage.map((stage) => stage.label)).toEqual([
      "Source",
      "MIR",
      "Neutral KIR",
      "Target KIR",
      "Semantic op",
      "LLVM handoff",
      "Sparse ISA",
    ]);
    expect(sourceIsaCharacteristicLineage.every((stage) =>
      stage.status === "present" && stage.value !== null
    )).toBe(true);
    expect(sourceIsaCharacteristicMemoryTarget).toMatchObject({
      kind: { label: "global_store", memory_form: { label: "plain" } },
      correlation_count: 2,
    });
    expect(sourceIsaCharacteristicStructuralTarget).toMatchObject({
      kind: { label: "global_store", memory_form: { label: "guarded" } },
      correlation_count: 0,
    });
    expect(sourceIsaCharacteristicDuplicateFacts).not.toBeNull();
    expect(sourceIsaCharacteristicDuplicateFacts?.map((fact) => fact.occurrence_identity)).toEqual([
      "d000c249aa034c3b7e13d51e7f63e52d12c6510329c8ee916426e19d89bb57c0",
      "23a201c5966c0b2d7338d26439356cbe14c08834ad4b0094f28b45f20038b3f6",
    ]);
    expect(sourceIsaCharacteristicIntervals).toHaveLength(2);
    expect(sourceIsaCharacteristicIntervals[0]?.interval).toEqual(
      sourceIsaCharacteristicIntervals[1]?.interval,
    );
    expect(sourceIsaCharacteristicIntervals[0]?.identity).not.toBe(
      sourceIsaCharacteristicIntervals[1]?.identity,
    );
    expect(sourceIsaCharacteristicResponses.every((response) => {
      const result = response.result as { authority?: Record<string, unknown> };
      return result.authority?.service_provenance === "canonical_self_claimed_archive" &&
        result.authority.archive_authenticity_proved === false &&
        result.authority.producer_evidence_authenticated === false &&
        result.authority.hardware_observation_authority === false;
    })).toBe(true);
    expect(
      evidenceCatalog.gitObjects.find(
        (object) => object.label === "source/ISA characteristic tutorial fixture",
      ),
    ).toMatchObject({
      commit: sourceIsaCharacteristicMilestone.compilerCommit,
      tree: sourceIsaCharacteristicMilestone.compilerTree,
      sourcePaths: sourceIsaCharacteristicSources.map((source) => source.path),
    });
  });
});

function serializedLessonContent(lessonId: string): string {
  const lesson = lessons.find((candidate) => candidate.id === lessonId);
  return JSON.stringify({
    lesson,
    narratives: lesson?.sections.flatMap((section) =>
      section.kind === "narrative"
        ? [narrativeEntry(section.narrativeId)]
        : [],
    ),
  });
}

function checkpointDetail(
  checkpoint: unknown,
): string {
  return checkpoint ? developmentCheckpointDetail(checkpoint) : "";
}

function expectAdvancedPerformanceContract(
  lessonId: string,
  code: string,
  notice: string | undefined,
): void {
  expect(code, `${lessonId}: optimization-stack heading`).toContain(
    "OPTIMIZATION STACK",
  );

  const optimizations = [
    ...code.matchAll(
      /^OPTIMIZATION \[([a-z0-9][a-z0-9._-]*)\]:\s+(.+)$/gimu,
    ),
  ];
  const impacts = [
    ...code.matchAll(
      /^IMPACT \[([a-z0-9][a-z0-9._-]*)\]:\s+(.+)$/gimu,
    ),
  ];
  expect(
    optimizations.length,
    `${lessonId}: explicit optimization entries`,
  ).toBeGreaterThan(0);

  const optimizationIds = optimizations.map((entry) => entry[1]);
  const impactIds = impacts.map((entry) => entry[1]);
  expect(
    new Set(optimizationIds).size,
    `${lessonId}: unique optimization IDs`,
  ).toBe(optimizationIds.length);
  expect(
    new Set(impactIds).size,
    `${lessonId}: unique impact IDs`,
  ).toBe(impactIds.length);
  expect(
    [...impactIds].sort(),
    `${lessonId}: one impact for every optimization`,
  ).toEqual([...optimizationIds].sort());

  const measuredImpact =
    /(?:\b(?:median|speedup|latency|instructions?|VGPRs?|SGPRs?|AGPRs?|HSACO|byte-identical|compiler-equivalent)\b|-?\d+(?:\.\d+)?\s*(?:ns|us|ms|%|x)\b)/iu;
  const nonResultStatus =
    /\b(?:unavailable|rejected|inapplicable|not applicable)\b/iu;
  const nonResultReason =
    /\b(?:because|due to|requires?|compiler|shape|dependency|recurrence|single[- ](?:wave|tile)|no (?:exact|independent|admitted)|not supported|cannot)\b/iu;
  for (const [, optimizationId, impact] of impacts) {
    expect(
      measuredImpact.test(impact) ||
        (nonResultStatus.test(impact) && nonResultReason.test(impact)),
      `${lessonId}: impact ${optimizationId} must be measured or explain why it is unavailable/rejected`,
    ).toBe(true);
  }

  const requiredAssessments = [
    "SOFTWARE PIPELINE ASSESSMENT",
    "LDS MULTI-BUFFER ASSESSMENT",
    "TILE SHAPE ASSESSMENT",
  ];
  for (const heading of requiredAssessments) {
    const assessment = code.match(new RegExp(`^${heading}:\\s+(.+)$`, "imu"));
    expect(assessment, `${lessonId}: ${heading.toLowerCase()}`).not.toBeNull();
    expect(
      assessment?.[1],
      `${lessonId}: ${heading.toLowerCase()} outcome`,
    ).toMatch(
      /\b(?:used|enabled|measured|retained|compiler-equivalent|unavailable|rejected|inapplicable|not applicable)\b/iu,
    );
  }

  expect(code, `${lessonId}: theoretical/resource floor heading`).toMatch(
    /THEORETICAL (?:RESOURCE )?FLOORS?/u,
  );
  expect(
    code,
    `${lessonId}: floor derivation or precise unavailable result`,
  ).toMatch(
    /(?:\bmax\s*\(|\b\d[\d,]*(?:\.\d+)?\s*B\s*\/\s*\d+(?:\.\d+)?\s*TB\/s|\bfloor\b[^\n]*(?:unavailable|not admitted)[^\n]*(?:because|needs?|requires?))/iu,
  );
  expect(code, `${lessonId}: comparator boundary heading`).toContain(
    "CLAIM BOUNDARY",
  );
  expect(code, `${lessonId}: exact-artifact comparator boundary`).toContain(
    "exact admitted artifacts",
  );
  expect(code, `${lessonId}: shape comparator boundary`).toContain(
    "differently shaped implementations are not comparable",
  );
  expect(code, `${lessonId}: no universal SOTA claim`).toContain(
    "not universal state-of-the-art claims",
  );
  expect(code, `${lessonId}: official bound-input evidence`).toContain(
    "perf-evidence/mi350x-bound-inputs-v1.json",
  );
  expect(code, `${lessonId}: cold-HBM bound boundary`).toContain(
    "cold-HBM logical-payload roofline normalization",
  );
  expect(code, `${lessonId}: whole-device bound boundary`).toContain(
    "across 256 CUs",
  );
  expect(notice, `${lessonId}: visible SOTA disclaimer`).toContain(
    "no universal state-of-the-art claim is made",
  );
}

describe("debugger workbench content", () => {
  it("keeps the committed fixture closed, simulated, and allocation-relative", () => {
    const rawFixture = JSON.parse(
      readFileSync("examples/debugger_workbench_v1.json", "utf8"),
    ) as Record<string, unknown>;
    expect(Object.keys(rawFixture).sort()).toEqual([
      "breakpoint_stop",
      "capabilities",
      "events",
      "hierarchy",
      "limitations",
      "memory",
      "post_write_step",
      "reverse_step",
      "schema",
      "source",
      "trace",
      "values",
      "watchpoint_stop",
    ]);
    expect(validateDebuggerWorkbenchFixture(rawFixture)).toEqual([]);
    expect(
      createHash("sha256")
        .update(readFileSync("examples/debugger_workbench_v1.json"))
        .digest("hex"),
    ).toBe(DEBUGGER_WORKBENCH_PROJECTION_SHA256);
    expect(debuggerWorkbenchProjection.source.protocol_responses_sha256).toBe(
      DEBUGGER_RESPONSES_SHA256,
    );
    expect(validateDebuggerProtocolRequests(debuggerProtocolRequests)).toEqual([]);
    expect(debuggerProtocolRequests).toHaveLength(19);
    expect(debuggerWorkbenchFixture.session).toMatchObject({
      execution_kind: "cpu_kir_simulation",
      simulated: true,
      hardware_observed: false,
      performance_prediction: false,
      wave_interpretation: "logical_visualization",
    });
    const serialized = JSON.stringify(debuggerWorkbenchProjection);
    expect(serialized).toContain("requires_authenticated_map");
    expect(serialized).toContain("CPU KIR simulation does not expose hardware registers");
    expect(serialized).toContain("allocation_relative_pointer");
    expect(serialized).not.toMatch(/native_(?:address|pointer)|gpu_va|host_address/u);
  });

  it("rejects unknown fixture keys through curriculum content validation", () => {
    const extraTopLevel = structuredClone(debuggerWorkbenchProjection) as unknown as Record<
      string,
      unknown
    >;
    extraTopLevel.native_address = "0xdeadbeef";
    expect(validateDebuggerWorkbenchFixture(extraTopLevel)).toContain(
      "fixture must contain only the exact CLI projection keys",
    );
    expect(validateCurriculum(curriculum, undefined, extraTopLevel)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "debuggerWorkbenchFixture" }),
      ]),
    );

    const extraEventField = structuredClone(debuggerWorkbenchProjection) as unknown as {
      events: { result: { events: Array<Record<string, unknown>> } };
    };
    extraEventField.events.result.events[0].native_registers = ["exec"];
    expect(validateDebuggerWorkbenchFixture(extraEventField)).toContain(
      "event response is not a bounded exact-key semantic trace",
    );
  });

  it("uses official comparison sources and complementary authority language", () => {
    expect(debuggerComparisonLinks.map((entry) => entry.href)).toEqual([
      "https://rocm.docs.amd.com/projects/ROCgdb/en/latest/ROCgdb/gdb/doc/gdb/AMD-GPU.html",
      "https://rocm.docs.amd.com/projects/ROCgdb/en/latest/quick-reference/essential-commands.html",
      "https://rocm.docs.amd.com/projects/rocprofiler-sdk/en/docs-7.2.3/how-to/using-thread-trace.html",
      "https://rocm.docs.amd.com/en/docs-10.0.0/components/profilers-and-debuggers.html",
      "https://docs.modular.com/mojo/cli/debug",
    ]);
    const comparison = JSON.stringify(debuggerComparisonRows);
    expect(comparison).toContain("hardware wavefront as a debugger thread");
    expect(comparison).toContain("early access");
    expect(comparison).toContain("LLDB does not support Mojo GPU debugging");
    expect(comparison).toContain("complements");
    expect(comparison).not.toMatch(/better than|replaces ROCgdb|replaces rocprof/iu);
  });
});

describe("live KFD debugger milestone", () => {
  it("pins the observed hardware tutorial separately from proof publication", () => {
    expect(liveKfdPublication).toMatchObject({
      schema: "fe2o3-live-kfd-debugger-tutorial-milestone-v1",
      status: "observed-partial",
      reviewedOn: "2026-08-29",
      compilerCommit: "ba0efc7f958e3afdf72eceeef1c37c2994fe2402",
      compilerTree: "3a595c10a3af6f28223ed89b6029ba444c16a2af",
      target: "gfx942:xnack-",
      mirrors: [
        "harsh-nod/fe2o3@refs/heads/main",
        "powderluv/fe2o3@refs/heads/main",
      ],
    });
    expect(liveKfdPublication.validationCommand).toContain(
      "mi300x_live_kfd_v3_binds_observes_controls_and_terminates",
    );
    const sourcePaths = [
      "crates/fe2o3-debug-cli/README.md",
      "crates/fe2o3-debug-protocol/src/live_gpu_v3.rs",
      "crates/fe2o3-debug-cli/tests/live_kfd_v3_live.rs",
      "crates/fe2o3-kfd/src/target_debug_telemetry_v1.rs",
      "crates/fe2o3-kfd/src/stopped_state_v1.rs",
      "crates/fe2o3-debug-protocol/src/rocgdb_mi_v3.rs",
      "crates/fe2o3-debug-cli/src/rocgdb_mi_v3.rs",
      "crates/fe2o3-debug-cli/src/live_rocgdb_v3.rs",
      "crates/cargo-fe2o3/src/profile_command.rs",
      "crates/fe2o3-semantic-import/src/profiler_bundle.rs",
      "crates/fe2o3-semantic-query/src/profiler_query.rs",
    ];
    expect(liveKfdSources.map((source) => source.path)).toEqual(sourcePaths);
    for (const path of sourcePaths) {
      expect(liveKfdSourceUrl(path)).toBe(
        `https://github.com/harsh-nod/fe2o3/blob/ba0efc7f958e3afdf72eceeef1c37c2994fe2402/${path}`,
      );
    }
    expect(() => liveKfdSourceUrl("../Cargo.toml")).toThrow(
      "repository-relative",
    );
  });

  it("keeps each composite workbench backend within its evidence scope", () => {
    expect(liveWorkbenchBackends.map((backend) => backend.id)).toEqual([
      "direct-kfd",
      "rocgdb-mi",
      "profiler-v4",
    ]);
    const directKfd = liveWorkbenchBackends[0];
    expect(directKfd.record).toMatchObject({
      projection_schema: "fe2o3-tutorial-evidence-summary-v1",
      protocol_wire_record: false,
      validated_evidence_scope: "mi300x_live_header_envelopes",
      observed_outer_envelope: {
        xcc_count: 8,
        ownership: "session_retained_suspension",
        resume_required: true,
      },
    });
    expect(JSON.stringify(directKfd.record)).toContain(
      "sequential_non_atomic_cpu_shadow",
    );
    expect(JSON.stringify(directKfd)).toContain("WaveRecordLayoutNotInKfdUapi");
    expect(directKfd.waveRows[0].cells).toHaveLength(64);
    expect(directKfd.waveRows[0].cells.every((cell) => cell.state === "unavailable"))
      .toBe(true);

    const rocgdb = liveWorkbenchBackends[1];
    expect(rocgdb.record).toMatchObject({
      projection_schema: "fe2o3-tutorial-evidence-summary-v1",
      protocol_wire_record: false,
      validated_evidence_scope: "deterministic_fake_mi_fixture",
      live_gpu_stop_validated: false,
    });
    expect(rocgdb.waveRows[0].cells.every((cell) => cell.state === "unavailable"))
      .toBe(true);
    expect(JSON.stringify(rocgdb.record)).toContain("generic_mi_thread");
    expect(JSON.stringify(rocgdb.record)).toContain("gpu_classification");
    expect(rocgdb.scope).toContain("GPU classification unavailable");

    const profiler = liveWorkbenchBackends[2];
    expect(JSON.stringify(profiler.record)).toContain("wait_events");
    expect(profiler.record).toMatchObject({
      device_binding: {
        strategy: "absolute_agent_id_to_kfd_node",
        csv_agent_id: "Agent <canonical decimal KFD node ID>",
        positional_binding: false,
        missing_binding: "reject",
        authorization_binds: ["kfd_node", "stable_device_identity"],
        topology_revalidation: ["before_collection", "after_collection"],
      },
      att_agent_binding: "explicit_required",
      bundle_v4_duration_comparison: {
        status: "comparable_for_dispatch_duration",
        exact: [
          "environment",
          "tool",
          "configuration",
          "stable_device",
          "dispatch_sequence_device_launch",
          "kir",
          "artifact",
        ],
        unrepresented: ["arguments", "input_content"],
        artifact_identity: "separately_supplied_fixture_claim_available_and_exact",
        ordinary_profile_recipe_artifact_identity: "unavailable",
        numeric_dimension: "dispatch_total_duration_ticks",
        pc_delta: {
          status: "unavailable",
          reason: "capture_local_code_object_identity",
        },
      },
      counter_capture_v2_comparison: {
        separate_from_bundle_v4: true,
        status: "raw_counter_deltas_when_dimensions_match",
        requires: [
          "exact_counter_definitions",
          "matching_dispatch_declarations",
        ],
        stable_environment: "unavailable",
        performance_conclusion: "unavailable",
        missing_dimensions: "unavailable_not_zero",
      },
    });
    expect(
      profiler.capabilities.find((capability) => capability.label === "Wait analysis"),
    ).toMatchObject({ state: "unavailable", origin: "unavailable" });
    expect(liveKfdCurrentImplementationPaths).toContain(
      "crates/fe2o3-semantic-query/src/profiler_query.rs",
    );
  });
});

describe("in-process profiler dispatch import milestone", () => {
  it("admits exact tutorial projections without elevating their authority", () => {
    expect(validateProfilerImportTutorial()).toEqual([]);
    expect(profilerImportMilestone).toMatchObject({
      schema: "fe2o3-profiler-dispatch-import-tutorial-milestone-v1",
      status: "implemented-qualified-bounded-checkpoint",
      issue: 215,
      issueState: "open",
      compilerRevision: "a5438d82203eeb223b4ff8aa25ea6581b1f1af81:3a319954541af34b3d77366498e73fe4663f2044",
      fixtureKind: "synthetic-deterministic-schematic-unexecuted",
      liveValidation: {
        host: "mi300x",
        machine: "MI300X",
        state: "bounded-importer-sealed-loader-qualified",
        checkpointRevision: "a5438d82203eeb223b4ff8aa25ea6581b1f1af81:3a319954541af34b3d77366498e73fe4663f2044",
        observed: [
          "sealed-route-validation",
          "target-mapping",
          "sdk-core-mapping",
          "sdk-tool-mapping",
          "no-internal-role-variable-leakage",
        ],
        notObserved: [
          "interpreter-mapping",
          "bootstrap-or-adapter-mapping",
          "real-gpu-dispatch-rocprofv3-to-import-roundtrip",
          "att-decode",
          "performance",
        ],
        gpuDispatchObserved: false,
      },
      qualification: {
        scope: "bounded-in-process-importer-and-sealed-loader-checkpoint",
        state: "qualified",
        genericCore: {
          command: "bash scripts/ci-local.sh generic-core",
          result: "passed",
          softNofile: 1024,
        },
      },
      remainingBoundaries: [
        "no-real-gpu-dispatch-rocprofv3-to-import-roundtrip",
        "att-decoder-unavailable-without-mutation-proof-sealed-route",
        "protected-source-isa-3x2-matrix-not-run",
        "t3-profiler-track-not-closed",
        "t5-distributed-overlap-blocked-on-issue-182-producer",
      ],
    });

    const dialects = profilerImportDialectProjection.dialects as Array<Record<string, unknown>>;
    expect(dialects.map((dialect) => dialect.id)).toEqual([
      "rocprofv3_json_installed1_1_97f5574",
      "rocprofv3_json_forward_848868d",
      "rocprofv3_csv_current22_column_stream_id",
    ]);
    const csvHeaders = dialects[2].headers as string[];
    expect(csvHeaders).toHaveLength(22);
    expect(csvHeaders[3]).toBe("Stream_Id");
    expect(csvHeaders[5]).toBe("Dispatch_Id");

    const bindings = profilerImportDialectProjection.json_process_local_bindings as Array<Record<string, unknown>>;
    expect(bindings.map((binding) => binding.opaque_agent_handle)).toEqual([7001, 7001]);
    expect(bindings.map((binding) => binding.direct_kfd_node)).toEqual([1, 2]);
    expect(bindings.map((binding) => binding.process_index)).toEqual([0, 1]);

    expect(profilerImportCaptureProjection).toMatchObject({
      protocol_wire_record: false,
      identity_semantics: "schematic_labels_not_content_identities",
      capture_identity: "schematic:capture",
      publication_shape: "embedded_in_bundle_not_a_separate_file",
      truth: {
        source_records: "synthetic",
        gpu_execution: "unavailable",
        performance_conclusion: "unavailable",
        authority_evidence: false,
      },
    });
    const completeFalseAuthority = {
      compiler: false,
      runtime: false,
      artifact: false,
      source_map: false,
      kernel_symbol: false,
      source_isa: false,
      att: false,
      performance: false,
      gpu_execution: false,
      producer_attestation: false,
    };
    expect(profilerImportBundleProjection).toMatchObject({
      protocol_wire_record: false,
      identity_semantics: "schematic_labels_not_content_identities",
      bundle_identity: "schematic:bundle",
      capture: { embedded: true },
      authority: completeFalseAuthority,
    });
    expect(profilerImportReceiptProjection).toMatchObject({
      protocol_wire_record: false,
      identity_semantics: "schematic_labels_not_content_identities",
      receipt_identity: "schematic:receipt",
      authority: completeFalseAuthority,
    });
    expect(profilerImportManifest).toContain("manifest-publication: last");
    expect(profilerImportManifest).toContain("identity-labels: schematic-not-content-identities");
    expect(profilerImportRequests).toHaveLength(3);
    expect(
      profilerImportRequests.every((request) =>
        request.schema === "fe2o3-profiler-import-query-exercise-request-v1" &&
        request.protocol_wire_record === false &&
        request.production_service_available === false &&
        request.exercise_kind === "deterministic_illustrative_non_wire"
      ),
    ).toBe(true);
    expect(profilerImportResponses[0]).toMatchObject({
      status: "illustrative_result",
      production_service_available: false,
    });
    expect(profilerImportResponses[2]).toMatchObject({
      status: "unavailable",
      truth_origin: "unavailable",
      production_service_available: false,
      reason: "att_decoder_requires_mutable_directory_namespace_without_sealed_route",
    });
    expect(profilerImportSourceUrl("crates/cargo-fe2o3/src/profile_command.rs")).toBe(
      "https://github.com/harsh-nod/fe2o3/blob/a5438d82203eeb223b4ff8aa25ea6581b1f1af81/crates/cargo-fe2o3/src/profile_command.rs",
    );
    expect(profilerImportSources.map((source) => source.path)).toEqual(
      expect.arrayContaining([
        "crates/fe2o3-semantic-import/src/lib.rs",
        "crates/fe2o3-semantic-import/src/raw_source_relation.rs",
        "crates/fe2o3-semantic-import/src/bin/fe2o3-profiler-import.rs",
        "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-installed-97f5574-kernel-dispatch-schema.json",
        "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-forward-848868-kernel-dispatch-schema.json",
        "crates/fe2o3-semantic-import/tests/fixtures/rocprofv3-current-kernel-dispatch.csv",
        "docs/source-isa-characteristic-acceptance-v2.md",
        "crates/fe2o3-semantic-query/src/distributed_overlap_v1.rs",
      ]),
    );
    expect(() => profilerImportSourceUrl("../Cargo.toml")).toThrow("repository-relative");
  });
});

describe("debugger and simulator milestone content", () => {
  it("admits exact bounded exploration, wave, counter, and PC-sample fixtures", () => {
    expect(validateDebugSimMilestone()).toEqual([]);
    const files: Array<[string, keyof typeof DEBUG_SIM_ARTIFACT_SHA256]> = [
      ["counter_capture_v2.json", "counterCapture"],
      ["debug_scalar_v2.fe2sim", "sourceBundle"],
      ["debug_scalar_export_receipt_v2.txt", "sourceExportReceipt"],
      ["debug_scalar_request_v1.json", "sourceRequest"],
      ["debug_scalar_source_map_v2.json", "sourceMap"],
      ["debug_scalar_source_variables_v2.jsonl", "sourceVariables"],
      ["exploration_incomplete_v1.json", "explorationIncomplete"],
      ["exploration_no_race_v1.json", "explorationNoRace"],
      ["exploration_race_v1.json", "explorationRace"],
      ["partial_wave32_error_v1.json", "partialWave32Error"],
      ["partial_wave64_error_v1.json", "partialWave64Error"],
      ["pc_capabilities_v3.json", "pcCapabilities"],
      ["pc_hotspots_v3.json", "pcHotspots"],
      ["pc_sample_capture_v3.json", "pcSampleCapture"],
      ["pc_sample_open_v3.json", "pcSampleOpen"],
      ["pc_sample_page_v3.json", "pcSamplePage"],
      ["race_replay_result_v1.json", "replayResult"],
      ["race_replay_schedule_v1.json", "replaySchedule"],
      ["wave32_collectives_result_v1.json", "wave32Result"],
      ["wave64_collectives_result_v1.json", "wave64Result"],
    ];
    for (const [file, digest] of files) {
      expect(
        createHash("sha256")
          .update(readFileSync(`examples/debug_sim_milestone_v1/${file}`))
          .digest("hex"),
      ).toBe(DEBUG_SIM_ARTIFACT_SHA256[digest]);
    }
    expect(debugSimMilestoneProjection.explorations.race).toMatchObject({
      authority: "observation_only",
      schedule_space_exhausted: false,
      exploration: {
        requested_schedules: 3,
        requested_seed_budget_consumed: true,
      },
    });
    expect(debugSimMilestoneProjection.explorations.incomplete).toMatchObject({
      witnesses: {
        first_incomplete: {
          assessment: {
            status: "incomplete",
            atomic_or_fence_happens_before_unmodeled: true,
          },
        },
      },
    });
    expect(debugSimCounterFixture).toMatchObject({
      sourceKind: "rocprofv3_dispatch_counter_json",
      loss: "unknown",
      dimensionCorrelation: "unavailable_record_has_no_instance_identity",
    });
    expect(DEBUG_SIM_COMPILER_PIN).toEqual({
      commit: "db36030a9605465082c696210ccb71b1195a6b5f",
      tree: "4c8228139562148b34531439b658a2805028066f",
    });
    expect(debugSimSourceVariableFixture.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "value",
          generation: 1,
          fallback: "not_in_scope",
          status: "captured",
          displayValue: "0x3f800000",
          provenance: "simulated_observation",
        }),
        expect.objectContaining({
          name: "input",
          generation: 1,
          fallback: "not_in_scope",
          status: "captured",
          displayValue: "alloc#1 +0",
          encoding: "allocation_relative_pointer",
        }),
        expect.objectContaining({
          name: "output",
          generation: 0,
          fallback: "unrepresented",
          status: "unavailable",
          reason: "not_represented",
        }),
        expect.objectContaining({
          name: "element",
          fallback: "unrepresented",
          reason: "not_represented",
        }),
      ]),
    );
    expect(debugSimSourceVariableFixture.raw.exportReceipt).toContain(
      "authenticates_compiler_execution=false",
    );
    expect(debugSimSourceVariableFixture.raw.response).not.toContain("native_address");
    expect(debugSimPcSampleFixture).toMatchObject({
      open: {
        samples: 5,
        unavailableRelativePc: 1,
        loss: "unknown",
      },
    });
    expect(debugSimPcSampleFixture.samples[0].execMask).toBe("0xffffffffffffffff");
    expect(debugSimPcSampleFixture.hotspots).toHaveLength(4);
    expect(debugSimPcSampleFixture.hotspots.every((item) => item.origin === "inferred")).toBe(true);
    expect(JSON.stringify(debugSimMilestoneProjection)).not.toMatch(
      /performance_prediction":true|hardware_observed":true/iu,
    );
  });
});

describe("curriculum integrity", () => {
  it("keeps the semantic-correctness milestone explicit in every lesson", () => {
    expect(semanticCorrectnessMilestone.status).toBe("partial-current");
    expect(semanticCorrectnessMilestone.compilerCommit).toBe(
      "ecf7b17f819021708d9c59ebe39a4daf9eb2562c",
    );
    expect(semanticCorrectnessMilestone.compilerTree).toBe(
      "2156423b9350d66cfaa8207133768e323111b507",
    );
    expect(semanticCorrectnessMilestone).toMatchObject({
      perCompilationTemplatePath:
        "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_template_v1.rs",
      perCompilationGeneratedFixturePath:
        "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_generated_fixture_v1.rs",
      perCompilationMultiOutputFixturePath:
        "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_generated_multi_output_fixture_v1.rs",
      perCompilationMultiOutputFixtureSha256:
        "2425d9c3640de0f8476ba61e751485e7b0d02b7984fd303a12e601fdaf2cc8bc",
      perCompilationMultiOutputSubstitutionFixturePath:
        "crates/fe2o3-verifier/verus/negative/mir_pliron_per_compilation_multi_output_substitution_v1.rs",
      perCompilationMultiOutputSubstitutionFixtureSha256:
        "b0406bca54d4f0b1bac434cc26d3ec80d9c117b48ecfbc78daa2a915807dbcd8",
    });
    expect(
      semanticCorrectnessMilestone.mechanisms.map((mechanism) => [
        mechanism.id,
        mechanism.status,
      ]),
    ).toEqual([
      ["finite-total-view", "published-current"],
      ["atomic-contribution-coverage", "published-current"],
      ["typed-scalar-congruence", "published-current"],
      ["generic-semantic-composition", "published-current"],
      ["ranked-safe-reference-loads", "published-current"],
      ["canonical-dynamic-loop-refinement", "published-current"],
      ["output-numerical-refinement", "published-current"],
      ["cooperative-tensor-structural-validation", "published-current"],
      ["multiple-output-refinement", "published-current"],
      ["aggregate-mir-refinement-gate", "published-current"],
      ["exact-mir-pliron-contract", "published-current"],
      ["per-compilation-verus-composition", "published-current"],
    ]);

    for (const lesson of lessons) {
      expect(serializedLessonContent(lesson.id), lesson.id).toContain(
        "Milestone status: partial-current",
      );
    }

    const semanticEvidence = evidenceCatalog.gitObjects.find(
      (object) => object.label === "MIR/PLIRON semantic-correctness milestone",
    );
    const eligiblePaths = semanticCorrectnessMilestone.mechanisms
      .filter(
        (mechanism) =>
          mechanism.status === "published-current" ||
          mechanism.status === "implemented-unpinned",
      )
      .flatMap((mechanism) => mechanism.evidence);
    expect(semanticEvidence?.sourcePaths).toEqual(eligiblePaths);
    expect(
      semanticCorrectnessMilestone.mechanisms.some(
        (mechanism) => mechanism.status === "implemented-unpinned",
      ),
    ).toBe(false);

    for (const lessonId of [
      "gemm-tiling",
      "softmax-invariant",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      const lesson = lessons.find((candidate) => candidate.id === lessonId);
      const specification = lesson?.tabs.find((tab) => tab.kind === "spec");
      expect(specification, lessonId).toMatchObject({
        label: "Sequential semantics",
        language: "rust",
        explanatory: true,
      });
      expect(specification?.notice, lessonId).toContain(
        "compiler",
      );
      expect(specification?.notice, lessonId).toContain("Incomplete");
      expect(specification?.code, lessonId).toContain("WORKLOAD SPECIFICATION");
      expect(specification?.code, lessonId).toContain("arithmetic_is_defined");
    }
  });

  it("parses and joins the functional-refinement publication manifest", () => {
    expect(functionalRefinementPublication).toMatchObject({
      schema: "fe2o3-functional-refinement-tutorial-publication-v1",
      status: "published-current",
      compilerCommit: semanticCorrectnessMilestone.compilerCommit,
      compilerTree: semanticCorrectnessMilestone.compilerTree,
    });
    expect(functionalRefinementPublication.referenceCompilerCommand).not.toContain(
      "qualification-oracles-test-only",
    );
    expect(
      functionalRefinementPublication.validationCommands.filter((command) =>
        command.includes("--test reference_binding_v1"),
      ),
    ).toSatisfy((commands: readonly string[]) =>
      commands.every(
        (command) => !command.includes("qualification-oracles-test-only"),
      ),
    );
    const evidence = evidenceCatalog.gitObjects.find(
      (object) => object.label === "functional-refinement publication manifest",
    );
    expect(evidence?.sourcePaths).toEqual([
      functionalRefinementPublication.fixtureSourcePath,
      functionalRefinementPublication.receiptFixturePath,
      functionalRefinementPublication.runtimeControllerPath,
      functionalRefinementPublication.effectDiagnosticFixturePath,
      functionalRefinementPublication.authorityNegativeFixturePath,
      functionalRefinementPublication.dynamicBoundsSourcePath,
    ]);
  });

  it("catalogs the functional-correctness boundary for every kernel lesson", () => {
    expect(functionalCorrectnessCatalog.map((entry) => entry.lessonId)).toEqual(
      semanticCorrectnessMilestone.kernelLessons,
    );
    expect(functionalCorrectnessCatalog).toHaveLength(11);

    for (const entry of functionalCorrectnessCatalog) {
      const lesson = lessons.find((candidate) => candidate.id === entry.lessonId);
      const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
      expect(lesson, entry.lessonId).toBeDefined();
      expect(reference?.sourcePath, entry.lessonId).toBe(
        entry.referenceSourcePath,
      );
      expect(existsSync(entry.referenceSourcePath), entry.referenceSourcePath).toBe(
        true,
      );
      expect(entry.outputRelations.length, entry.lessonId).toBeGreaterThan(0);
      expect(entry.scheduleRelations.length, entry.lessonId).toBeGreaterThan(0);
      expect(
        functionalGateModeLabels[entry.functionalGate.mode],
        entry.lessonId,
      ).toBeDefined();
      expect(
        validateFunctionalReferenceGate(entry.functionalGate),
        entry.lessonId,
      ).toEqual([]);
      expect(entry.functionalGate.mismatchBehavior, entry.lessonId).toMatch(
        /mismatch/iu,
      );
      expect(entry.functionalGate.compileTimePromotion, entry.lessonId).toMatch(
        /SafeReferenceMirToLivePliron.*before KIR|fail closed.*before KIR/iu,
      );
      expect(entry.perCompilationVerus, entry.lessonId).toContain(
        "exact compilation",
      );
      expect(entry.productionPipeline, entry.lessonId).toMatch(
        /semantic contract.*parallel contract.*per-compilation Verus.*before KIR lowering/iu,
      );
      expect(entry.perCompilationVerus, entry.lessonId).toContain(
        "SafeReferenceMirToLivePliron",
      );
      expect(entry.boundary, entry.lessonId).not.toMatch(
        /universal(?:ly)? (?:correct|proved)/iu,
      );
    }

    expect(
      functionalCorrectnessCatalog
        .filter((entry) =>
          [
            "typed-vecadd",
            "reductions-scans",
            "lds-barriers-atomics",
            "gemm-tiling",
            "gemm-proof-plan",
            "softmax-invariant",
            "flash-attention",
            "moe-routing",
            "moe-expert-compute",
          ].includes(entry.lessonId),
        )
        .every((entry) => entry.disposition === "incomplete"),
    ).toBe(true);

    expect(
      functionalCorrectnessCatalog.find(
        (entry) => entry.lessonId === "cpu-semantic-simulation",
      )?.disposition,
    ).toBe("observation-only");

    for (const lessonId of [
      "gemm-tiling",
      "gemm-proof-plan",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.boundary,
        lessonId,
      ).toMatch(/tensor|MFMA/iu);
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.cooperativeTensor,
        lessonId,
      ).toMatch(/typed result component.*exact output store.*tensor-component formula replay/isu);
    }

    for (const lessonId of [
      "typed-vecadd",
      "reductions-scans",
      "gemm-tiling",
      "gemm-proof-plan",
      "softmax-invariant",
      "flash-attention",
      "moe-expert-compute",
    ]) {
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.numericalPolicy,
        lessonId,
      ).toMatch(/finite-error-formula replay is not implemented.*target IEEE.*LLVM/isu);
    }

    for (const lessonId of ["moe-routing", "moe-expert-compute"]) {
      expect(
        functionalCorrectnessCatalog.find((entry) => entry.lessonId === lessonId)
          ?.boundary,
        lessonId,
      ).toMatch(/multiple output|multiple outputs|output product|separated-output/iu);
    }
  });

  it("rejects a kernel lesson detached from its cataloged safe reference", () => {
    const changed = structuredClone(curriculum);
    const lesson = changed
      .flatMap((module) => module.lessons)
      .find((candidate) => candidate.id === "flash-attention")!;
    lesson.tabs.find((tab) => tab.kind === "reference")!.sourcePath =
      "examples/flash_attention_general_v1/src/not-the-reference.rs";

    expect(validateCurriculum(changed)).toContainEqual({
      path: "lesson[flash-attention]",
      message:
        "safe CPU reference tab does not match the functional-correctness catalog",
    });
  });

  it("covers modules zero through ten in order", () => {
    expect(curriculum.map((module) => module.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(lessons).toHaveLength(35);
    expect(validateCurriculum(curriculum)).toEqual([]);
    expect(
      new Set(
        lessons.flatMap((lesson) =>
          lesson.sections.flatMap((section) =>
            section.kind === "narrative" ? [section.narrativeId] : [],
          ),
        ),
      ),
    ).toEqual(new Set(narrativeIds));
  });

  it("publishes bounded production Rust gfx950 low-precision evidence", () => {
    const expected = [
      {
        lessonId: "gfx950-fp4-gemm",
        rustSymbol: "gfx950_fp4_gemm_rust",
        rustSha256: "0a4a3d325d588ddad15697aa58f0e354cd9af20ae83f441432bd1489965fecad",
        referenceSymbol: "gemm_reference",
        referenceSha256: "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c",
        hipSymbol: "gfx950_fp4_gemm",
        runner: "examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
        namespace: "ff22ff3610dda0a94803a8011ced229b78c77400ca63c9b929d6ecba78ed6f01",
        llvmSha256: "2eae91d0c3c4181684589ce9c6dc3fe05a78b1d37bf6748f7c67726c119a3e4e",
        hsacoSha256: "1308d41a97d523d2e77ad15e16a3292e9d5a75e2f4eedf53f9e1008c481ca750",
        hostIsa: "cbsz:4 blgp:4",
        requiredIsa: "cbsz:4 blgp:4",
        numericalResult: "max_absolute_error=0",
        tolerance: "absolute tolerance 1e-5",
      },
      {
        lessonId: "gfx950-fp8-gemm",
        rustSymbol: "gfx950_fp8_gemm_rust",
        rustSha256: "004ad607c55169f7f3291ea4cd74afc63e937877ec84efacf5b731f99248b9fd",
        referenceSymbol: "gemm_reference",
        referenceSha256: "cfcd4e567eb84127d93e77e9b568facb61674816026cd584f36d262a91b9541c",
        hipSymbol: "gfx950_fp8_gemm",
        runner: "examples/gfx950_low_precision/run-fp8-gemm-gfx950.sh",
        namespace: "d67f1755b38fbdac67cec83da3ebc359f874e3fbf90fcc036471455ec117dfea",
        llvmSha256: "9081a38065e977df077cc0fd142b77fb008fdd88a54e3f6915c704fdc5349d16",
        hsacoSha256: "701a0a4ef137173ba9563dfe8b3b1f916d3d57dca0063d393d8e81c671e4dd2b",
        hostIsa: "v_mfma_f32_16x16x128_f8f6f4",
        requiredIsa: "E4M3 selectors (not cbsz:4 blgp:4)",
        numericalResult: "max_absolute_error=0",
        tolerance: "absolute tolerance 1e-5",
      },
      {
        lessonId: "gfx950-fp4-attention",
        rustSymbol: "gfx950_fp4_attention_rust",
        rustSha256: "2e5adea75d61f9524f1f9ee9d0f00fa9c8e4a0fac3d1ebc2d8c49401b1797a96",
        referenceSymbol: "attention_reference",
        referenceSha256: "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0",
        hipSymbol: "gfx950_fp4_flash_attention",
        runner: "examples/gfx950_low_precision/run-fp4-attention-gfx950.sh",
        namespace: "a9a878f0e2fc3a42ad17edf0a326a89695398bb6d7460eaf278ea3e8c53f4cf5",
        llvmSha256: "0914282d013f8bf6da47e2e807b569e7ca47beb908f30616211e8ff25529e508",
        hsacoSha256: "90d8f5e0b1b058c96a0b855893f20d3c4a3adc86fe72fe4b9a0de9652eef122b",
        hostIsa: "ds_read_b64_tr_b4",
        requiredIsa: "two ds_read_b64_tr_b4",
        numericalResult: "max_absolute_error=2.235174179e-8",
        tolerance: "absolute tolerance 2e-3 plus relative tolerance 2e-3",
      },
      {
        lessonId: "gfx950-fp8-attention",
        rustSymbol: "gfx950_fp8_attention_rust",
        rustSha256: "c926d59ea1746895f406b72d3e343c38d2b240faec4c0654675dec6e8e05b738",
        referenceSymbol: "attention_reference",
        referenceSha256: "cad34588d47fcd31930fec04bccfc83f3c2d4b56fb413c2a5fc1fba1dd3b35c0",
        hipSymbol: "gfx950_fp8_flash_attention",
        runner: "examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
        namespace: "0c9610e86137831ce25b08b9ad87073ec16f459aa11aeea6806733f788bbeec1",
        llvmSha256: "32d869f2c4512717548913f693978773e91112f7f67158418cfb155106ef0d58",
        hsacoSha256: "9208b439a4fbd1a987ea3cca19c01cac79e69e00b021ccb54f09f440d11f6294",
        hostIsa: "ds_read_b64_tr_b8",
        requiredIsa: "four ds_read_b64_tr_b8",
        numericalResult: "max_absolute_error=5.960464478e-8",
        tolerance: "absolute tolerance 2e-3 plus relative tolerance 2e-3",
      },
    ] as const;

    for (const evidence of expected) {
      const {
        lessonId,
        rustSymbol,
        rustSha256,
        referenceSymbol,
        referenceSha256,
        hipSymbol,
        runner,
        namespace,
        llvmSha256,
        hsacoSha256,
        hostIsa,
        requiredIsa,
        numericalResult,
        tolerance,
      } = evidence;
      const lesson = lessons.find((candidate) => candidate.id === lessonId);
      expect(lesson, lessonId).toBeDefined();
      expect(lesson?.module).toBe(9);
      expect(lesson?.claims).toEqual([
        expect.objectContaining({ kind: "gpu-observed" }),
      ]);
      expect(lesson?.claims[0].reference).toMatchObject({
        scope: "historical-evidence",
        commit: "c1383e97db732f9f1ff8105f10d5c2b5971143e1",
        tree: "42385e6464ca40318fc70ae104845d3997844140",
        commands: [`bash ${runner}`],
        target: "gfx950:xnack-",
      });
      expect(lesson?.claims[0].reference?.sourcePaths).toEqual(
        expect.arrayContaining([
          "examples/gfx950_low_precision/src/kernel.rs",
          "examples/gfx950_low_precision/src/reference.rs",
          "examples/gfx950_low_precision/src/lib.rs",
          "examples/gfx950_low_precision/Cargo.toml",
          "examples/gfx950_low_precision/Cargo.lock",
          "examples/gfx950_low_precision/README.md",
          runner,
        ]),
      );
      expect(lesson?.claims[0].reference?.sourcePaths.some((path) =>
        path.startsWith("crates/fe2o3-hsa-runtime/tests/gfx950_"),
      )).toBe(true);
      expect(lesson?.tabs.map((tab) => tab.kind)).toEqual([
        "kernel", "reference", "comparison", "verus", "host", "result",
      ]);
      const kernel = lesson?.tabs[0];
      expect(kernel?.label).toBe("Rust kernel");
      expect(kernel?.language).toBe("rust");
      expect(kernel?.explanatory).toBe(false);
      expect(kernel?.sourceCommit).toBe("c1383e97db732f9f1ff8105f10d5c2b5971143e1");
      expect(kernel?.sourcePath).toBe("examples/gfx950_low_precision/src/kernel.rs");
      expect(kernel?.code).toContain(rustSymbol);
      expect(kernel?.sourceSha256).toBe(rustSha256);
      expect(kernel?.code).toContain("Blocked<Index1D, 16, 4>");
      expect(kernel?.code).toContain("checked_block::<16, 4>()");
      expect(kernel?.code).not.toContain("Tiled2D");
      if (rustSymbol.includes("attention")) {
        expect(kernel?.code).toContain("let Ok(query_matrix)");
        expect(kernel?.code).toContain("fe2o3_device::trap()");
        expect(kernel?.code).not.toContain("-> KernelResult");
      } else {
        expect(kernel?.code).toContain("let Ok(lhs_matrix)");
        expect(kernel?.code).toContain("let Ok(rhs_matrix)");
      }
      const reference = lesson?.tabs[1];
      expect(reference?.kind).toBe("reference");
      expect(reference?.language).toBe("rust");
      expect(reference?.explanatory).toBe(false);
      expect(reference?.sourceCommit).toBe("c1383e97db732f9f1ff8105f10d5c2b5971143e1");
      expect(reference?.code).toContain(referenceSymbol);
      expect(reference?.sourceSha256).toBe(referenceSha256);
      const comparison = lesson?.tabs[2];
      expect(comparison?.label).toBe("Equivalent HIP");
      expect(comparison?.code).toContain(hipSymbol);
      expect(comparison?.sourceSha256).toBe(
        "5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a",
      );
      expect(lesson?.tabs[3]?.kind).toBe("verus");
      const host = lesson?.tabs[4];
      expect(host?.code).toContain(`bash ${runner}`);
      expect(host?.code).toContain(hostIsa);
      expect(host?.code).toContain("finalizes exact gfx950:xnack- COV6 HSACO");
      expect(host?.code).toContain("Comparison only");
      const result = lesson?.tabs[5]?.code;
      expect(result).toContain("FE2O3 PRODUCTION RUST -> GFX950 EVIDENCE");
      expect(result).toContain("Core source commit: c1383e97db732f9f1ff8105f10d5c2b5971143e1");
      expect(result).toContain("Core source tree: 42385e6464ca40318fc70ae104845d3997844140");
      expect(result).toContain(`Portable namespace: ${namespace}`);
      expect(result).toContain(`Rust-produced LLVM SHA-256: ${llvmSha256}`);
      expect(result).toContain(`Rust-produced HSACO SHA-256: ${hsacoSha256}`);
      expect(result).toContain("Rust gfx950 lowering supported: true");
      expect(result).toContain("Required Rust ISA:");
      expect(result).toContain(requiredIsa);
      expect(result).toContain(`Rust numerical result: ${numericalResult}`);
      expect(result).toContain(`Acceptance tolerance: ${tolerance}`);
      expect(result).toContain("ROCm 7.2.1 on MI350X gfx950, ssh host mi350");
      expect(result).toContain("SEPARATE COMPARISON-ONLY HIP LANE");
      expect(result).toContain("The HIP artifact is an independent comparison");
      expect(result).not.toContain("Rust gfx950 lowering supported: false");
      expect(result).not.toContain("Rust-produced HSACO: none");
    }

    const fp4Gemm = serializedLessonContent("gfx950-fp4-gemm");
    expect(
      createHash("sha256")
        .update(readFileSync("examples/gfx950_low_precision/gfx950_low_precision.hip"))
        .digest("hex"),
    ).toBe("5ecfad224a691b61a07ef4aa16e144853bd3e8f53295a0e9c60404877356609a");
    expect(fp4Gemm).toContain("ab39293c0f251678496cb5da026b8fb6ebbb4f6c96989ad5a2962d3ad6018379");
    expect(fp4Gemm).toContain("one fixed K=128 phase");
    expect(fp4Gemm).toContain("identity-scale operands encoded as constants");
    const fp4Attention = serializedLessonContent("gfx950-fp4-attention");
    expect(fp4Attention).toContain("ds_read_b64_tr_b4");
    expect(fp4Attention).toContain("scalar FP32 loop");
    expect(fp4Attention).toContain("Multi-tile online rescaling");
    const fp8Attention = serializedLessonContent("gfx950-fp8-attention");
    expect(fp8Attention).toContain("ds_read_b64_tr_b8");
    expect(fp8Attention).toContain("attention max_error=2.38419e-07");
    expect(fp8Attention).toContain("four ds_read_b64_tr_b8");
  });

  it("keeps the exact KDA decode, chunkwise prefill, and independent oracle contract", () => {
    const lesson = lessons.find(
      (candidate) => candidate.id === "gfx950-kda-gdn-linear-attention",
    );
    expect(lesson?.title).toBe(
      "gfx950 Kimi Delta Attention decode and chunkwise prefill",
    );
    expect(lesson?.tabs.map((tab) => tab.kind)).not.toContain("comparison");
    expect(lesson?.tabs.map((tab) => tab.kind)).not.toContain("performance");
    expect(lesson?.tabs.map((tab) => tab.kind)).not.toContain("ablation");

    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel")?.code ?? "";
    expect(kernel).toContain("macro_rules! kda_chunk_wy_v3");
    expect(kernel).toContain("pub fn gfx950_kda_decode");
    expect(kernel).toContain("pub fn gfx950_kda_chunkwise_prefill");

    const reference =
      lesson?.tabs.find((tab) => tab.kind === "reference")?.code ?? "";
    expect(reference).toContain("fn kda_matrix_step_f64_v2");
    expect(reference).toContain("pub fn kda_decode_reference_v2");
    expect(reference).toContain("pub fn kda_prefill_reference_v2");

    const content = serializedLessonContent("gfx950-kda-gdn-linear-attention");
    expect(content).toContain("D_t = diag(alpha_t) S_(t-1)");
    expect(content).toContain("C=4 WY/UT equations");
    expect(content).toContain("L2-normalized q and k");
    expect(content).toContain("output_replicated max_absolute_error=3.725290298e-9");
    expect(content).toContain("output_chunk0_replicated max_absolute_error=7.450580597e-9");
    expect(content).toContain("https://arxiv.org/abs/2510.26692");
    expect(content).toContain(
      "d1782f1adc5ab27a123e99a81db150a6062c28f6404804282ed7210b350c8498",
    );
    expect(content).toContain(
      "4888a0b175bcc5b2897ba0594f0641acd700468c5302376a24463ba56eb49a56",
    );
  });

  it("publishes exact bounded advanced gfx950 source and fail-closed production runners", () => {
    const expected = [
      ["gfx950-advanced-moe", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_moe_route_fp4_t16_e4_k2_v1", "moe_routing_reference", "8e1d432962a1c51f4d8b08d33cb38dc838fad94ca47ebc64102ed2ce2e70dbd6", "gfx950_fused_fp4_fp8_moe", "expert counts=9,7,6,10", "cbsz:4"],
      ["gfx950-kda-gdn-linear-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_kda_decode", "kda_decode_reference_v2", "48b7dc1f1cbfbac0b62ba00d6df0383cdc477ab827cc9f40e2843d1309f07ed9", null, "final_state_value_major max_absolute_error=1.490116119e-8", "ds_bpermute_b32"],
      ["gfx950-indexed-sparse-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_content_sparse_attention", "content_sparse_attention_reference_v1", "48b7dc1f1cbfbac0b62ba00d6df0383cdc477ab827cc9f40e2843d1309f07ed9", "gfx950_content_sparse_attention", "selected IDs=[7,1,4]", "ds_read_b64_tr_b8"],
      ["gfx950-deepseek-sparse-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_deepseek_sparse_attention", "deepseek_sparse_attention_reference_v1", "48b7dc1f1cbfbac0b62ba00d6df0383cdc477ab827cc9f40e2843d1309f07ed9", null, "DeepSeek sparse attention", "no MFMA or transpose instructions"],
      ["gfx950-compressed-hybrid-attention", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_compressed_hybrid_attention", "compressed_hybrid_attention_reference_v1", "48b7dc1f1cbfbac0b62ba00d6df0383cdc477ab827cc9f40e2843d1309f07ed9", "gfx950_compressed_hybrid_attention", "compressed hybrid attention max_error=1.67638e-07", "v_mfma_f32_16x16x128_f8f6f4"],
      ["gfx950-attnres-gr-mhc", "examples/gfx950_advanced_attention/src/kernel.rs", "gfx950_mhc_sinkhorn_mix", "mhc_sinkhorn_mix_reference_v1", "48b7dc1f1cbfbac0b62ba00d6df0383cdc477ab827cc9f40e2843d1309f07ed9", "gfx950_mhc_sinkhorn_mix", "mHC/Sinkhorn max_error=2.98023e-08", "v_exp_f32"],
      ["gfx950-speculative-mtp-verification", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_speculative_transaction_v1", "speculative_reference", "8e1d432962a1c51f4d8b08d33cb38dc838fad94ca47ebc64102ed2ce2e70dbd6", "gfx950_speculative_transaction", "rolled-back candidates=6 with bitwise base-state equality", "gfx950_speculative_transaction"],
      ["gfx950-ngram-embedding-gather", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_qwen_ngram_gather_v1", "ngram_reference", "8e1d432962a1c51f4d8b08d33cb38dc838fad94ca47ebc64102ed2ce2e70dbd6", "gfx950_qwen_ngram_gather", "deterministic duplicate-key tie value=4242", "gfx950_qwen_ngram_gather"],
      ["gfx950-muon-optimizer", "examples/gfx950_advanced_systems/src/kernel.rs", "gfx950_muon_update_4x4_v1", "muon_reference", "8e1d432962a1c51f4d8b08d33cb38dc838fad94ca47ebc64102ed2ce2e70dbd6", "gfx950_muon_update", "reduced norm max_error=0 with norm=0.614919", "gfx950_muon_update"],
    ] as const;

    const excerptHashes = {
      "gfx950-advanced-moe": ["a774500131396c95a4768d2ff174b48fe1823e389b36debcf77dd4e35bc9a676", "13ab007af1facc9263b07b4be60479ff377eb6821629af5a009c4445c2d4690e"],
      "gfx950-kda-gdn-linear-attention": ["8d61f4d2c20464696bbec9c9a3396c5b513d90cce6f0d3344f4cd2a7ad8900b1", "9b693e07fa53fc0fdff9b235bffdb012987e336d63ca7cbeac8cac01cb5ac76d"],
      "gfx950-indexed-sparse-attention": ["8684d952e10438c4dd0bd4a6748010d04e38a7a911a69627ed388621a368b779", "813fce6fee60239b9c2ee8aa0c66958680595bfa66162d27b95f7cde7ca2dad9"],
      "gfx950-deepseek-sparse-attention": ["0608190331ac2a480ddbc947b754aebd80a60ecdf541998d4aae27b5706df17a", "6b2c81b68e6cdbf1f328ba6a061407113882457624067f2a0be679f26eb57a5f"],
      "gfx950-compressed-hybrid-attention": ["4b905913f30edfb7e6e0b0a20893c14bd7ca1b656a3e99c6794efe1a2175df03", "afe790e4c83988aae90763d6dccd394b265017ba72d6e4024b6f7b794e8d08db"],
      "gfx950-attnres-gr-mhc": ["5e9761447dfc694c713afe92f905867382a0c7f0069fe413806927d69c3863db", "d3fa6ba2d5fb187aeb5bf304ba3b29327636f8ce6afbf9455adbcf2273a3382f"],
      "gfx950-speculative-mtp-verification": ["7af417d630bff4724837b23cfc901045d1b059d352f85ea28391258c7c99d3ff", "36ca2f84521a24cf65177a8e030dbf935f3b1b03e30ef5fb7e8a8a1e2241d6bc"],
      "gfx950-ngram-embedding-gather": ["1ef0490edaf92a38ea77417654c187988b53d0281446f8e42e7dcdb2a1c3621d", "9ce2cdd494c09f727ba87834de2874a80400cddde22691e50dcacb532dc505b1"],
      "gfx950-muon-optimizer": ["58e17e63a3a539c143c30e56997bfdd811d7c9dd8a3ae643c71976b194c64b43", "20613ed1fad5dbdfd09f2bad3421e0927157a77e3085e0303092567d633403af"],
    } as const;

    const productionRecords = {
      "gfx950-advanced-moe": [
        ["gfx950_moe_route_fp4_t16_e4_k2_v1", "run-moe-route-gfx950.sh", "gfx950_moe_route_rust_cov6_matches_cpu_reference"],
        ["gfx950_moe_expert_rank_fp4_fp8_v1", "run-moe-expert-rank-gfx950.sh", "gfx950_moe_expert_rank_rust_cov6_matches_cpu_reference"],
        ["gfx950_combine_expert_ranks_v1", "run-combine-expert-ranks-gfx950.sh", "gfx950_combine_expert_ranks_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-kda-gdn-linear-attention": [
        ["gfx950_kda_decode", "run-kda-decode-gfx950.sh", "gfx950_kda_decode_rust_cov6_matches_cpu_reference"],
        ["gfx950_kda_chunkwise_prefill", "run-kda-chunkwise-prefill-gfx950.sh", "gfx950_kda_chunkwise_prefill_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-indexed-sparse-attention": [
        ["gfx950_content_sparse_attention", "run-content-sparse-attention-gfx950.sh", "gfx950_content_sparse_attention_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-deepseek-sparse-attention": [
        ["gfx950_deepseek_sparse_attention", "run-deepseek-sparse-attention-gfx950.sh", "gfx950_deepseek_sparse_attention_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-compressed-hybrid-attention": [
        ["gfx950_compressed_hybrid_attention", "run-compressed-hybrid-attention-gfx950.sh", "gfx950_compressed_hybrid_attention_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-attnres-gr-mhc": [
        ["gfx950_attnres_aggregate", "run-attnres-aggregate-gfx950.sh", "gfx950_attnres_aggregate_rust_cov6_matches_cpu_reference"],
        ["gfx950_four_branch_residual", "run-four-branch-residual-gfx950.sh", "gfx950_four_branch_residual_rust_cov6_matches_cpu_reference"],
        ["gfx950_mhc_sinkhorn_mix", "run-mhc-sinkhorn-mix-gfx950.sh", "gfx950_mhc_sinkhorn_mix_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-speculative-mtp-verification": [
        ["gfx950_speculative_transaction_v1", "run-speculative-transaction-gfx950.sh", "gfx950_speculative_transaction_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-ngram-embedding-gather": [
        ["gfx950_qwen_ngram_gather_v1", "run-qwen-ngram-gather-gfx950.sh", "gfx950_qwen_ngram_gather_rust_cov6_matches_cpu_reference"],
      ],
      "gfx950-muon-optimizer": [
        ["gfx950_stage_gradient_shard_v1", "run-stage-gradient-shard-gfx950.sh", "gfx950_stage_gradient_shard_rust_cov6_matches_cpu_reference"],
        ["gfx950_muon_update_4x4_v1", "run-muon-update-gfx950.sh", "gfx950_muon_update_rust_cov6_matches_cpu_reference"],
      ],
    } as const;

    const referenceRecords = {
      "gfx950-advanced-moe": ["moe_routing_reference", "moe_rank_reference"],
      "gfx950-kda-gdn-linear-attention": [
        "kda_decode_reference_v2",
        "kda_prefill_reference_v2",
      ],
      "gfx950-indexed-sparse-attention": [
        "content_sparse_attention_reference_v1",
      ],
      "gfx950-deepseek-sparse-attention": [
        "deepseek_sparse_attention_reference_v1",
      ],
      "gfx950-compressed-hybrid-attention": [
        "compressed_hybrid_attention_reference_v1",
      ],
      "gfx950-attnres-gr-mhc": [
        "attnres_aggregate_reference_v1",
        "four_branch_residual_reference_v1",
        "mhc_sinkhorn_mix_reference_v1",
      ],
      "gfx950-speculative-mtp-verification": ["speculative_reference"],
      "gfx950-ngram-embedding-gather": ["ngram_reference"],
      "gfx950-muon-optimizer": ["muon_reference"],
    } as const;

    for (const [lessonId, sourcePath, rustSymbol, referenceSymbol, sourceFileSha256, hipSymbol, result, isa] of expected) {
      const [rustExcerptSha256, referenceExcerptSha256] = excerptHashes[lessonId];
      const advanced = lessons.find((candidate) => candidate.id === lessonId);
      expect(advanced, lessonId).toBeDefined();
      expect(advanced?.module).toBe(10);
      expect(advanced?.claims).toEqual([
        expect.objectContaining({
          kind: advancedCoreSourceTree === null ? "source-example" : "gpu-observed",
        }),
      ]);
      const variantSourceCount = lessonId === "gfx950-attnres-gr-mhc" ? 1 : 0;
      const expectedTabKinds = [
        "kernel",
        ...Array.from({ length: variantSourceCount }, () => "kernel"),
        "reference",
        ...(hipSymbol === null ? [] : ["comparison"]),
        "verus",
        "host",
        "result",
      ];
      if (advancedPerformanceLessonIds.includes(lessonId)) {
        expectedTabKinds.push("performance");
      }
      expect(advanced?.tabs.map((tab) => tab.kind)).toEqual(expectedTabKinds);

      const kernel = advanced?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel?.sourcePath).toBe(sourcePath);
      expect(kernel?.language).toBe("rust");
      expect(kernel?.explanatory).toBe(false);
      expect(kernel?.sourceCommit).toBe(advancedCoreSourceCommit);
      expect(kernel?.sourceSha256).toBe(rustExcerptSha256);
      expect(kernel?.code).toContain(rustSymbol);
      expect(kernel?.code).not.toContain("SOURCE MIRROR PENDING");
      expect(kernel?.code.match(/pub fn gfx950_/gu) ?? []).toHaveLength(
        productionRecords[lessonId].length,
      );
      expect(createHash("sha256").update(readFileSync(sourcePath)).digest("hex")).toBe(
        sourceFileSha256,
      );

      const reference = advanced?.tabs.find((tab) => tab.kind === "reference");
      expect(reference?.kind).toBe("reference");
      expect(reference?.language).toBe("rust");
      expect(reference?.sourcePath).toBe(sourcePath.replace("kernel.rs", "reference.rs"));
      expect(reference?.sourceCommit).toBe(advancedCoreSourceCommit);
      expect(reference?.sourceSha256).toBe(referenceExcerptSha256);
      expect(reference?.explanatory).toBe(false);
      for (const exactReference of referenceRecords[lessonId]) {
        expect(reference?.code).toContain(`pub fn ${exactReference}(`);
      }
      expect(reference?.code).toContain(referenceSymbol);
      const comparison = advanced?.tabs.find((tab) => tab.kind === "comparison");
      if (hipSymbol === null) {
        expect(comparison).toBeUndefined();
      } else {
        expect(comparison?.label).toBe("Equivalent HIP");
        expect(comparison?.code).toContain(hipSymbol);
      }
      expect(advanced?.tabs.some((tab) => tab.kind === "verus")).toBe(true);
      const host = advanced?.tabs.find((tab) => tab.kind === "host");
      expect(host?.code).toContain(isa);
      expect(host?.code).toContain("cargo test --offline");
      expect(host?.code).toContain("pinned fe2o3 core checkout");
      expect(host?.code).toContain("ordinary Rust -> LLVM -> COV6 HSACO");
      expect(host?.code).toContain("gfx950:xnack-");

      const evidence = advanced?.tabs.find((tab) => tab.kind === "result")?.code;
      expect(evidence).toContain(`Kernel file SHA-256: ${sourceFileSha256}`);
      expect(evidence).toContain(`Core source commit: ${advancedCoreSourceCommit}`);
      expect(evidence).toContain(result);
      expect(evidence).toContain("FE2O3 PRODUCTION RUST -> GFX950 EVIDENCE");
      expect(evidence).toContain("Rust gfx950 lowering supported: true");
      expect(evidence).not.toContain("Rust-produced HSACO: none");
      if (hipSymbol === null) {
        expect(evidence).toContain("NO COMPARISON-ONLY HIP LANE");
        expect(evidence).toContain("No equivalent HIP fixture is published");
        expect(evidence).not.toContain("HIP runtime observation:");
      } else {
        expect(evidence).toContain("HIP runtime observation:");
        expect(evidence).toContain("does not produce, bind, or authorize any Rust artifact");
      }
      expect(evidence).toContain("Performance result: not claimed");
      expect(evidence).toContain("Formal source-to-machine proof: not claimed");

      for (const [symbol, runner, hardwareTest] of productionRecords[lessonId]) {
        const record = advancedRustEvidence[
          symbol as keyof typeof advancedRustEvidence
        ];
        expect(record.status).toBe("observed");
        if (record.status !== "observed") {
          throw new Error(`${symbol} must have an observed MI350 record`);
        }
        expect(kernel?.code).toContain(`pub fn ${symbol}(`);
        expect(host?.code).toContain(runner);
        expect(evidence).toContain(`Symbol: ${symbol}`);
        expect(evidence).toContain(`Production runner: bash examples/gfx950_advanced_`);
        expect(evidence).toContain(runner);
        expect(evidence).toContain(hardwareTest);
        expect(evidence).toContain("Evidence status: observed");
        expect(evidence).toContain(`Artifact source commit: ${record.sourceCommit}`);
        expect(evidence).toContain(`Artifact source tree: ${record.sourceTree}`);
        expect(evidence).toContain(`Portable namespace: ${record.namespace}`);
        expect(evidence).toContain(`Rust-produced LLVM SHA-256: ${record.llvmSha256}`);
        expect(evidence).toContain(`Rust-produced HSACO SHA-256: ${record.hsacoSha256}`);
        expect(evidence).toContain(`Symbol-scoped ISA SHA-256: ${record.isaSha256}`);
        expect(evidence).toContain(`Rust numerical result: ${record.numericalResult}`);
        expect(evidence).toContain(`Acceptance tolerance: ${record.tolerance}`);
        expect(evidence).not.toContain("pending mi350 end-to-end execution");
      }

      const serialized = serializedLessonContent(lessonId);
      expect(serialized).toContain("Fixed-shape teaching boundary");
      expect(serialized).toContain("no production serving");
      expect(serialized).toContain("full distributed collective");
      expect(serialized).toContain("full-model-equivalence claim");
    }
  });

  it("publishes exact status-labeled attention ablation Rust", () => {
    const expected = [
      [
        "gfx950-attnres-gr-mhc",
        "Mixing ablations [FINAL-COMPATIBILITY]",
        [
          "gfx950_attnres_aggregate",
          "gfx950_four_branch_residual",
          "gfx950_mhc_sinkhorn_mix",
        ],
      ],
    ] as const;
    for (const [lessonId, label, symbols] of expected) {
      const variant = lessons
        .find((lesson) => lesson.id === lessonId)
        ?.tabs.find((tab) => tab.label === label);
      expect(variant).toMatchObject({
        kind: "kernel",
        language: "rust",
        sourcePath: "examples/gfx950_advanced_attention/src/ablation.rs",
        sourceCommit: advancedCoreSourceCommit,
        sourceSha256:
          "c34bd3b07e47446d79ad9cdf5328c8e207f81b02a591bca5eb22f25a00087b2e",
        sourceDigestScope: "file",
        explanatory: false,
      });
      expect(variant?.notice).toContain("Exact final-compatibility Rust ablation source");
      for (const symbol of symbols) {
        expect(variant?.code).toContain(`pub fn ${symbol}(`);
      }
    }
  });


  it("publishes the real GPT-OSS Rust layer-tile tutorial with final integrated evidence boundaries", () => {
    const lesson = lessons.find(
      (candidate) => candidate.id === "gfx950-gpt-oss-120b-megakernel",
    );
    expect(lesson?.title).toBe(
      "gpt-oss-120b batch-1 layer-tile megakernel",
    );
    expect(lesson?.claims.map((claim) => claim.kind)).toEqual(["gpu-observed"]);
    expect(lesson?.tabs.map((tab) => tab.kind)).toEqual([
      "kernel",
      "kernel",
      "kernel",
      "kernel",
      "kernel",
      "kernel",
      "kernel",
      "reference",
      "comparison",
      "verus",
      "host",
      "result",
      "performance",
    ]);

    const kernel = lesson?.tabs.find(
      (tab) => tab.sourcePath === "examples/gfx950_gpt_oss_decode/src/kernel.rs",
    );
    expect(kernel).toMatchObject({
      label: "Rust kernel",
      language: "rust",
      sourcePath: "examples/gfx950_gpt_oss_decode/src/kernel.rs",
      sourceCommit: advancedCoreSourceCommit,
      sourceSha256: "6c10867e6dcb8b016e9f654f0ed1b357b128b4d466d896663ae365c837f0f0b0",
      explanatory: false,
    });
    expect(kernel?.code).toContain(
      "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1(",
    );
    const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
    expect(reference).toMatchObject({
      label: "Safe CPU reference",
      sourcePath: "examples/gfx950_gpt_oss_decode/src/reference.rs",
      sourceSha256: "f4f361e44d8cf56348d1189aa012ebeb2a83efc1833eaa110ea4f095ce22bd84",
      explanatory: false,
    });
    expect(reference?.code).toContain("pub fn reference(");
    const comparison = lesson?.tabs.find((tab) => tab.kind === "comparison");
    expect(comparison?.label).toBe("Archived c138 unfused HIP");
    expect(comparison?.code).toContain("gpt_oss_unfused_router");

    const expectedVariants = [
      ["Serial router ablation [FINAL-COMPATIBILITY]", "examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs", "060c5600b8522bea3f6245794809a15fbc468bee008f7b497e5c7f06740af841", "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1("],
      ["Held-fragment ablation [FINAL-COMPATIBILITY]", "examples/gfx950_gpt_oss_decode/src/kernel_held_fragments.rs", "a2cc65e6e9c74f4523786706d994193d0d68d708386f9b29163b13bcd98e12d2", "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1("],
      ["Interleaved-store ablation [FINAL-COMPATIBILITY]", "examples/gfx950_gpt_oss_decode/src/kernel_interleaved_stores.rs", "a31af40117e11ed6779ecb9d54cc597805449bbb04db47af7a005ca3da55d72e", "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1("],
      ["Materialized components [FINAL-COMPATIBILITY]", "examples/gfx950_gpt_oss_decode/src/kernel_components.rs", "6f7b1ca11e492ff8b2f0e8e4b8e34e0c5809a7d5b24dcefa4814fbbadce536a1", "pub fn gfx950_gpt_oss_120b_router_v1("],
      ["BF16 LDS pipeline [COMPILER-REJECTED]", "examples/gfx950_gpt_oss_decode/src/kernel_pipelined_attention.rs", "96e2e4c1ea1019aa30ed8ce5674671d0674687131b529ae15220965e2dcc7c79", "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1("],
      ["Scalar attention [COMPILER-REJECTED]", "examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs", "0755e02ef766b8ae88ca876ba8cf16d0cdc8da1cebc05a0aa354b766fac57b49", "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1("],
    ] as const;
    for (const [label, sourcePath, sourceSha256, symbol] of expectedVariants) {
      const variant = lesson?.tabs.find((tab) => tab.label === label);
      expect(variant).toMatchObject({
        kind: "kernel",
        language: "rust",
        sourcePath,
        sourceCommit: advancedCoreSourceCommit,
        sourceSha256,
        sourceDigestScope: "file",
        explanatory: false,
      });
      expect(variant?.code).toContain(symbol);
      expect(variant?.notice).toContain(
        label.includes("COMPILER-REJECTED")
          ? "compiler-rejected"
          : "final-compatibility",
      );
    }

    const host = lesson?.tabs.find((tab) => tab.kind === "host")?.code;
    expect(host).toContain("bash examples/gfx950_gpt_oss_decode/run-gfx950.sh");
    expect(host).toContain(
      "bash examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh",
    );
    expect(host).toContain("bash perf-evidence/run-gpt-oss-performance.sh");
    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code;
    expect(result).toContain("Historical campaign commit: c1383e97db732f9f1ff8105f10d5c2b5971143e1");
    expect(result).toContain("Final promoted-source wrapper: passed at c766ca761 on MI350X gfx950");
    expect(result).toContain("Historical performance wrapper: passed at c1383e97 on MI350X gfx950");
    expect(result).toContain("Final compatibility matrix: perf-evidence/gfx950-integrated-compatibility-v1.json; 32/32 cases passed");
    expect(result).toContain("Fused p5/p95: 1.059803 / 1.069283 ms");
    expect(result).toContain(
      "Archived c138 HIP three-dispatch/fused ratio: 0.732979",
    );
    expect(result).toContain("Outcome: fused is 1.3643x slower");
    expect(result).toContain("State-of-the-art claim: not claimed");
    expect(serializedLessonContent(lesson!.id)).not.toContain(
      "LESSON SHELL ONLY",
    );
  });
  it("publishes bounded MI350X performance evidence without widening comparator claims", () => {
    expect(advancedPerformanceLessonIds).toEqual([
      "gfx950-advanced-moe",
      "gfx950-indexed-sparse-attention",
      "gfx950-compressed-hybrid-attention",
      "gfx950-attnres-gr-mhc",
      "gfx950-speculative-mtp-verification",
      "gfx950-ngram-embedding-gather",
      "gfx950-muon-optimizer",
      "gfx950-gpt-oss-120b-megakernel",
    ]);

    const module10 = lessons.filter((lesson) => lesson.module === 10);
    for (const lesson of module10) {
      const performance = lesson.tabs.find((tab) => tab.kind === "performance");
      if (!advancedPerformanceLessonIds.includes(lesson.id)) {
        expect(performance, lesson.id).toBeUndefined();
        continue;
      }
      expect(performance, lesson.id).toMatchObject({
        label: "Performance",
        language: "text",
        explanatory: true,
      });
      expectAdvancedPerformanceContract(
        lesson.id,
        performance!.code,
        performance!.notice,
      );
      expect(performance?.code).toMatch(
        /(?:ADMITTED COMPARATOR RESULT|STATE-OF-THE-ART STATUS)/u,
      );
    }

    const performanceText = module10
      .flatMap((lesson) => lesson.tabs)
      .filter((tab) => tab.kind === "performance")
      .map((tab) => tab.code)
      .join("\n");
    for (const symbol of Object.keys(advancedRustEvidence)) {
      if (
        symbol === "gfx950_deepseek_sparse_attention" ||
        symbol === "gfx950_kda_decode" ||
        symbol === "gfx950_kda_chunkwise_prefill"
      ) continue;
      expect(performanceText, symbol).toContain(`KERNEL: ${symbol}`);
    }
    expect(performanceText).not.toContain("canonical early exit");
    expect(performanceText).not.toContain("hidden 512");
    expect(performanceText).not.toContain("0.1465%");

    const performanceFor = (lessonId: string) =>
      module10
        .find((lesson) => lesson.id === lessonId)
        ?.tabs.find((tab) => tab.kind === "performance")?.code ?? "";
    expect(performanceFor("gfx950-advanced-moe")).toContain(
      "No repeated software pipeline is used or implemented",
    );
    expect(performanceFor("gfx950-ngram-embedding-gather")).toContain(
      "Probe all 16 slots in ascending order",
    );
    const muonPerformance = performanceFor("gfx950-muon-optimizer");
    expect(muonPerformance).toContain(
      "examples/gfx950_advanced_systems/optimization-evidence-v1.json",
    );
    expect(muonPerformance).toContain("publishable_claim=false");
    expect(muonPerformance).toContain("historical and exploratory");
    const gptPerformance = performanceFor("gfx950-gpt-oss-120b-megakernel");
    expect(gptPerformance).toContain("hidden 2,880");
    expect(gptPerformance).toContain("a 0.0375% median reduction");
    expect(gptPerformance).toContain("da6 exact Rust component-materialization");

    for (const candidateId of [
      "sparse-lds-pingpong",
      "sparse-tile-tuning",
      "hybrid-lds-pingpong",
      "mixing-lds-stage",
      "transaction-prefetch",
      "table-lds-stage",
      "muon-iteration-pipeline",
      "fp4-lds-pipeline",
      "gpt-tile-tuning",
    ]) {
      expect(performanceText, candidateId).toMatch(
        new RegExp(`OPTIMIZATION \\[${candidateId}\\]: [^\\n]*NOT IMPLEMENTED`, "u"),
      );
    }
    expect(gptPerformance).toContain(
      "OPTIMIZATION [bf16-lds-pipeline]: IMPLEMENTED; COMPILER-REJECTED",
    );
    const gptContent = serializedLessonContent("gfx950-gpt-oss-120b-megakernel");
    expect(gptContent).toContain("archived c138 HIP three-dispatch comparator");
    expect(gptContent).toContain("da6 exact Rust component-materialization ablation");

    const finalAdvanced = JSON.parse(
      readFileSync(
        "perf-evidence/gfx950-advanced-ablation-evidence-v1.json",
        "utf8",
      ),
    );
    expect(finalAdvanced.protocol).toMatchObject({
      processes_per_variant: 1,
      initial_warmups: 1000,
      blocks: 30,
      samples_per_block: 100,
      block_rewarm: 20,
      source_commit: "da6c108d162bac8afd79e789ccf9b36ef8eb97a4",
    });
    expect(finalAdvanced.artifacts).toMatchObject({
      raw_samples: 105000,
      series: 35,
      hsaco_files: 32,
      leaked_amdgpu_target_directories: 0,
    });
    expect(finalAdvanced.comparisons).toHaveLength(14);
    expect(finalAdvanced.promotion_verification).toMatchObject({
      source_commit: "4f9b2bf09db41e6ef38db1bb926c2fa7989d8e1f",
      production_hsaco_sha256:
        "3cf9a73d1c684fc1f9f93c556eaa4772be0c250bd4d6d1f1b3241adbd5c5ef03",
      division_baseline_hsaco_sha256:
        "6c6addf04c745ad6560e45d2896725adbb8d87952cd49c6f710fde6e5011d823",
    });
    expect(performanceText).toContain("105,000 dispatch samples");
    expect(performanceText).toContain("paired 1.005300x");

    const mhc = module10
      .find((lesson) => lesson.id === "gfx950-attnres-gr-mhc")
      ?.tabs.find((tab) => tab.kind === "performance")?.code;
    expect(mhc).toContain("a 1.448x speedup and 30.9392% reduction");
    expect(mhc).toContain("mHC derivation: max(576 B / 8 TB/s, 616 counted FP32 algebraic ops / 144.2 TFLOP/s) = 0.072 ns");
    expect(mhc).toContain("independent latency is unavailable");

    const speculativeTab = module10
      .find((lesson) => lesson.id === "gfx950-speculative-mtp-verification")
      ?.tabs.find((tab) => tab.kind === "performance")?.code;
    expect(speculativeTab).toContain("5,800 -> broadcast 5,760 ns");
    expect(speculativeTab).toContain("a 1.006944x speedup");
  });

  it("keeps the advanced production evidence matrix exhaustive and fail-closed", () => {
    expect(Object.keys(advancedRustEvidence)).toEqual([
      "gfx950_kda_decode",
      "gfx950_kda_chunkwise_prefill",
      "gfx950_content_sparse_attention",
      "gfx950_deepseek_sparse_attention",
      "gfx950_compressed_hybrid_attention",
      "gfx950_attnres_aggregate",
      "gfx950_four_branch_residual",
      "gfx950_mhc_sinkhorn_mix",
      "gfx950_moe_route_fp4_t16_e4_k2_v1",
      "gfx950_moe_expert_rank_fp4_fp8_v1",
      "gfx950_combine_expert_ranks_v1",
      "gfx950_speculative_transaction_v1",
      "gfx950_qwen_ngram_gather_v1",
      "gfx950_stage_gradient_shard_v1",
      "gfx950_muon_update_4x4_v1",
      "gfx950_gpt_oss_120b_decode_megakernel_v1",
    ]);

    for (const [symbol, evidence] of Object.entries(
      advancedRustEvidence,
    ) as [string, AdvancedRustEvidence][]) {
      expect(evidence.symbol).toBe(symbol);
      expect(Object.isFrozen(evidence)).toBe(true);
      expect(evidence.requiredIsa.length).toBeGreaterThan(0);
      expect(evidence.kernargBytes).toBeGreaterThan(0);
      expect(evidence.workgroupSize).toBeGreaterThan(0);
      expect(evidence.ldsBytes).toBeGreaterThanOrEqual(0);
      expect(evidence.status).toBe("observed");
      if (evidence.status !== "observed") {
        throw new Error(`${symbol} must not regress to pending evidence`);
      }
      expect(evidence.namespace).toMatch(/^[0-9a-f]{64}$/u);
      expect(evidence.sourceCommit).toMatch(/^[0-9a-f]{40}$/u);
      expect(evidence.sourceTree).toMatch(/^[0-9a-f]{40}$/u);
      expect(evidence.llvmSha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(evidence.hsacoSha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(evidence.isaSha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(evidence.numericalResult).not.toMatch(/\bpending\b/iu);
      expect(evidence.tolerance).not.toMatch(/\bpending\b/iu);
      expect(evidence.runtimeObservation).not.toMatch(/\bpending\b/iu);
    }

    expect(advancedRustEvidence.gfx950_moe_route_fp4_t16_e4_k2_v1.workgroupSize).toBe(256);
    expect(advancedRustEvidence.gfx950_moe_expert_rank_fp4_fp8_v1.workgroupSize).toBe(64);

    expect(() =>
      observedAdvancedEvidence(
        {
          label: "invalid fixture",
          symbol: "gfx950_invalid_fixture",
          runnerPath:
            "examples/gfx950_advanced_attention/run-invalid-fixture-gfx950.sh",
          hardwareTest: "gfx950_invalid_fixture_rust_cov6_matches_cpu_reference",
          requiredIsa: ["symbol"],
          kernargBytes: 8,
          workgroupSize: 64,
        },
        {
          sourceCommit: "0".repeat(40),
          sourceTree: "1".repeat(40),
          namespace: "not-a-digest",
          llvmSha256: "0".repeat(64),
          hsacoSha256: "1".repeat(64),
          isaSha256: "2".repeat(64),
          numericalResult: "max_error=0",
          tolerance: "absolute tolerance 1e-5",
          runtimeObservation: "mi350 fixture",
        },
      ),
    ).toThrow("noncanonical namespace");
  });

  it("pins the timing-free final gfx950 compatibility matrix to the promoted evidence", () => {
    const matrix = JSON.parse(
      readFileSync(
        "perf-evidence/gfx950-integrated-compatibility-v1.json",
        "utf8",
      ),
    );
    expect(matrix).toMatchObject({
      schema: "fe2o3.gfx950.integrated-compatibility-matrix.v1",
      campaign: {
        id: "gfx950-final-compatibility-c766ca761-gpu6",
        source_commit: "c766ca761c492c4cd188047a497664f6b2ade278",
        source_tree: "cbda6eba10b34acb3eec93c6e504462fca3c8705",
        physical_gpu: 6,
        rocr_visible_devices: "6",
        hip_visible_devices: null,
      },
      summary: { cases: 32, passed: 32, rejected_candidates: 2 },
    });
    expect(matrix.claim_boundary.performance_measurements_included).toBe(false);
    expect(matrix.cases).toHaveLength(32);
    expect(matrix.cases.map((entry: { ordinal: number }) => entry.ordinal)).toEqual(
      Array.from({ length: 32 }, (_, index) => index + 1),
    );
    for (const entry of matrix.cases) {
      expect(entry.result).toBe("pass");
      expect(entry.artifact).toMatchObject({
        target: "gfx950:xnack-",
        code_object_version: 6,
        wavefront_size: 64,
      });
      for (const digest of [
        entry.source_sha256,
        entry.run_log.sha256,
        entry.artifact.crate_binding_sha256,
        entry.artifact.llvm_sha256,
        entry.artifact.hsaco_sha256,
        entry.artifact.isa_sha256,
      ]) {
        expect(digest).toMatch(/^[0-9a-f]{64}$/u);
      }
      expect(entry.source_blob).toMatch(/^[0-9a-f]{40}$/u);
      expect(entry.source_path).toMatch(/^examples\/gfx950_/u);
      expect(entry.run_log.file).toMatch(/^case\d{2}-.+\.log$/u);
      expect(entry.numerical_results.length).toBeGreaterThan(0);
      expect(entry.workloads.length).toBeGreaterThan(0);
      for (const workload of entry.workloads) {
        expect(workload.input_sha256).toMatch(/^[0-9a-f]{64}$/u);
        expect(workload.buffers.length).toBeGreaterThan(0);
        expect(
          workload.buffers.some(
            (buffer: { oracle: { kind: string } }) =>
              buffer.oracle.kind.startsWith("cpu-reference-"),
          ),
        ).toBe(true);
      }
      expect(Object.values(entry.gates).every((gate) => gate === "pass")).toBe(true);
    }

    const canonicalOrdinals = new Map([
      ["gfx950_content_sparse_attention", 5],
      ["gfx950_compressed_hybrid_attention", 8],
      ["gfx950_attnres_aggregate", 9],
      ["gfx950_four_branch_residual", 11],
      ["gfx950_mhc_sinkhorn_mix", 14],
      ["gfx950_moe_route_fp4_t16_e4_k2_v1", 15],
      ["gfx950_moe_expert_rank_fp4_fp8_v1", 16],
      ["gfx950_combine_expert_ranks_v1", 18],
      ["gfx950_speculative_transaction_v1", 19],
      ["gfx950_qwen_ngram_gather_v1", 21],
      ["gfx950_stage_gradient_shard_v1", 23],
      ["gfx950_muon_update_4x4_v1", 24],
      ["gfx950_gpt_oss_120b_decode_megakernel_v1", 26],
    ]);
    for (const [symbol, evidence] of Object.entries(advancedRustEvidence)) {
      if (
        symbol === "gfx950_deepseek_sparse_attention" ||
        symbol === "gfx950_kda_decode" ||
        symbol === "gfx950_kda_chunkwise_prefill"
      ) {
        expect(evidence.sourceCommit).toMatch(/^[0-9a-f]{40}$/u);
        expect(evidence.runnerPath).toBe(
          symbol === "gfx950_deepseek_sparse_attention"
            ? "examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh"
            : symbol === "gfx950_kda_decode"
              ? "examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh"
              : "examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
        );
        continue;
      }
      if (evidence.status !== "observed") {
        throw new Error(`${symbol} is missing final compatibility evidence`);
      }
      const compatibility = matrix.cases.find(
        (entry: { ordinal: number }) =>
          entry.ordinal === canonicalOrdinals.get(symbol),
      );
      expect(compatibility.kernel_export).toBe(symbol);
      expect(compatibility.artifact).toMatchObject({
        crate_binding_sha256: evidence.namespace,
        llvm_sha256: evidence.llvmSha256,
        hsaco_sha256: evidence.hsacoSha256,
        isa_sha256: evidence.isaSha256,
      });
    }

    const prohibitedKeys: string[] = [];
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        if (/timer|duration|latency|throughput/iu.test(key)) prohibitedKeys.push(key);
        visit(child);
      }
    };
    visit(matrix);
    expect(prohibitedKeys).toEqual([]);
    expect(matrix.rejected_candidates.map((entry: { variant: string }) => entry.variant)).toEqual([
      "scalar-attention",
      "pipelined-attention",
    ]);
    for (const rejection of matrix.rejected_candidates) {
      expect(rejection.source_blob).toMatch(/^[0-9a-f]{40}$/u);
      expect(rejection.source_sha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(rejection.rejection_log.sha256).toMatch(/^[0-9a-f]{64}$/u);
      expect(rejection.diagnostic).toMatch(/call terminator|pipeline scalar/u);
    }
  });


  it("publishes real Rust source tabs for all 20 gfx950 tutorial kernels", () => {
    const expectedSymbols = [
      "gfx950_fp4_gemm_rust",
      "gfx950_fp8_gemm_rust",
      "gfx950_fp4_attention_rust",
      "gfx950_fp8_attention_rust",
      ...Object.keys(advancedRustEvidence),
    ];
    expect(expectedSymbols).toHaveLength(20);
    const publishedRust = lessons
      .filter((lesson) => lesson.module === 9 || lesson.module === 10)
      .flatMap((lesson) => lesson.tabs)
      .filter((tab) => tab.kind === "kernel" && tab.explanatory === false)
      .map((tab) => tab.code)
      .join("\n");
    for (const symbol of expectedSymbols) {
      expect(publishedRust, symbol).toContain(`pub fn ${symbol}(`);
    }
  });
  it("pins byte-exact Rust mirrors for all gfx950 packages", () => {
    const mirrors = [
      ["examples/gfx950_low_precision/README.md", "5dc64435d18dc371431dacddaae8cd6114358fe0fce5e6924e046d0d4e351a6f"],
      ["examples/gfx950_low_precision/Cargo.toml", "79022908ab305eb2b608818e9338e8796e5515af43e590ed367acb222676e3c6"],
      ["examples/gfx950_low_precision/Cargo.lock", "0b9188ed6e3b51caab75b152e7ae142ae39410e4a3e8c96c47b4f691a4f5b9a1"],
      ["examples/gfx950_low_precision/src/kernel.rs", "7b8e9810ff23a84fae69ae87e52d88a5512f1afd2c176de3d72edb116a003dca"],
      ["examples/gfx950_low_precision/src/reference.rs", "388ec3bf3fff9a5290456afc92b9bd24be8813d9ae914865f780affb7fb6e3e7"],
      ["examples/gfx950_low_precision/src/lib.rs", "ef673aa1c80c6268d8039a5f819cb2ceea1656ef6214217efc8daeabe1bf4e4f"],
      ["examples/gfx950_low_precision/tests/kernel_source.rs", "addf296e35be54c66e51fc63393ce04bdc9dff2ce706171e8de20e0eb0fdb960"],
      ["crates/fe2o3-hsa-runtime/tests/gfx950_fp4_gemm_hardware.rs", "77e320d7175613ac7c9ef31571cdbd0b87940145963b66fe1e7bc1b1b5f8d3bc"],
      ["crates/fe2o3-hsa-runtime/tests/gfx950_fp8_gemm_hardware.rs", "d37a381d66bf79f4f9f01fa1c32c9c24076e4450cc691e4f4ce3479197371870"],
      ["crates/fe2o3-hsa-runtime/tests/gfx950_attention_hardware.rs", "d8b619377275a297cc7c7c3b8ae77563523897cddb060cc3bf5a78234aadf42e"],
      ["examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh", "a02d26d57716aff60099f98dbf76073a34bacd9a753bcb79d58d47c0ace603c7"],
      ["examples/gfx950_low_precision/run-fp8-gemm-gfx950.sh", "94734d16e766e6295b4311cbeb5b086566a25da21207e9ea2811339951ee65c5"],
      ["examples/gfx950_low_precision/run-fp4-attention-gfx950.sh", "b4bf55787793b3aa3f9fc042521c2941e643d04a2b6bf7933b1847d891b53dd6"],
      ["examples/gfx950_low_precision/run-fp8-attention-gfx950.sh", "73e3c73c37154ee0b6b5f9b9ec450cc1c11167335457100c29a576736279955d"],
      ["examples/gfx950_low_precision/run-attention-gfx950.sh", "9253aa5c740671ff91d69c44917a75cb1dc7c69b6f596f6ed999ded9d6db93ff"],
      ["examples/gfx950_low_precision/gfx950-ocml-closure.sh", "4acd64af08347456aa9b8e2c105e1af7ce2946167e95496c02c5dc88e2544c6a"],
      ["examples/gfx950_low_precision/gfx950-ocml-rocm-7.2.1.manifest", "43b868ede4500d71ff0f81fe3db2b91cec5cf4c973befc1533adfac51d9accc6"],
      ["examples/gfx950_advanced_attention/Cargo.lock", "b116346a8df0ed7013535122007e73c3b2f16e66a1fd7fe468dfd447e8bff4d1"],
      ["examples/gfx950_advanced_attention/Cargo.toml", "3b1a43534a9a46b4ce352d6eb1e727e599746c9241d7efc9fd8099f25d5dfb21"],
      ["examples/gfx950_advanced_attention/ablation-variants-v1.json", "ad890dee0ec1d5f98d4fe9929964fffaa57c4d7de7620e3f2fd002ff4a308bc5"],
      ["examples/gfx950_advanced_attention/README.md", "6794db859180f63f78b80716d697fa7c5c277adead2bc1283b8d7a7ffea5c7fc"],
      ["examples/gfx950_advanced_attention/build_and_test.sh", "edfb9d27b52a1493c6f9371ed0944d6bdbca230971cf0efcff35133c5b59e17d"],
      ["examples/gfx950_advanced_attention/check_isa.sh", "66781023b3d9706973cd14693d7ae2b018c662cde9cbd230a98ff1bd6a845615"],
      ["examples/gfx950_advanced_attention/gfx950-extractor-runtime.sh", "978e7f09899298c92bf44802b268e02480b9e00d6d93bf9720528ef649552985"],
      ["examples/gfx950_advanced_attention/gfx950_advanced_attention.hip", "c44b4227c0ec525a367359bdc16aff69c3086676aa61def1b653266604d1ed1d"],
      ["examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh", "b869214fcab25ac6768856cd5402ef098838a50f2a9626f90ee107f9d3be51b6"],
      ["examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh", "6709edbd2da0424fbfbaeb02d4b612e4a78ca8e941929dc9ecc2ecd3ecaef779"],
      ["examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh", "972e38c13f18c85fa087a3649d3f7ea4f5c7ebb7b97709b131386f4d0adc830c"],
      ["examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh", "cf9739d455303269357d742bef85aeb4675a5652073e0d9a701ebd6c87691094"],
      ["examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh", "9c4a4c2fceee19680e6f6a844966f591ef12feb1093b0300750a4448f22d7bf5"],
      ["examples/gfx950_advanced_attention/run-gfx950.sh", "b979c0a6976b98831deafa265d11a15a42a6233813e849fae0c7a0ffa1b3bcf5"],
      ["examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh", "47dc9c7f29f709f1fbe8ad4ff07099ecaf0431dafcc3f28763f15edc32c6a58c"],
      ["examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh", "b52f355e42d920435f12f46c4727bafdcbb89460ffe7ade9a66170d14123fd07"],
      ["examples/gfx950_advanced_attention/run-kda-prefill-gfx950.sh", "0546e3565717c05a5680420f5c87e1ee34b89ccce0d25f153bd3740cea6c3788"],
      ["examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh", "5e17ad7d3e87b67342b49eba0615f106051827d664eea228780b80a05ef81b26"],
      ["examples/gfx950_advanced_attention/src/ablation.rs", "c34bd3b07e47446d79ad9cdf5328c8e207f81b02a591bca5eb22f25a00087b2e"],
      ["examples/gfx950_advanced_attention/src/kernel.rs", "48b7dc1f1cbfbac0b62ba00d6df0383cdc477ab827cc9f40e2843d1309f07ed9"],
      ["examples/gfx950_advanced_attention/src/reference.rs", "557ca02fbea9d06865dc4d0d468e142e26175bb67291cd6dac7b91ad964eec53"],
      ["examples/gfx950_advanced_attention/src/lib.rs", "33d565721e383f6881da4a84c47eb817ab3fbb9ddc820afd794563dd93bfbe7d"],
      ["examples/gfx950_advanced_attention/test-extractor-runtime.sh", "47f0fa7b258d7b59dae1da26377a8b5acfe992ddf62511f96cf24d7ab4549363"],
      ["examples/gfx950_advanced_attention/tests/kernel_source.rs", "0622feba696514592077c482bfb9d4550dec68fd7b5ea4e3fc043b38e265eab6"],
      ["examples/gfx950_advanced_attention/tests/reference.rs", "6adcdf2128ea36e13dfcc14bb0cb6cf197f7ae5381a932f1f0754d12bf5d9a08"],
      ["examples/gfx950_advanced_systems/Cargo.lock", "223572e69b42b6e54f55935c3e1e1cf54b152466ed0d61acdb97010d647ebf1c"],
      ["examples/gfx950_advanced_systems/Cargo.toml", "4bb727180242b4f1a55693ecf2abcd87026e324cbd208d9c6a6970a45ae681e7"],
      ["examples/gfx950_advanced_systems/ablation-variants-v1.json", "e222f3bef1be96cd946b1847a8ac9b5341b8c67c8aeb0b6d4fd9d5a5268b3bba"],
      ["examples/gfx950_advanced_systems/optimization-evidence-v1.json", "b39ef177352261c3d33a6ea1c6804707ad8fb52de1641175308808ce09c72956"],
      ["examples/gfx950_advanced_systems/README.md", "2888360c965442ab0b4f5999bbe81d59eb4bb8fae66773408d730ff050444f25"],
      ["examples/gfx950_advanced_systems/build_and_test.sh", "20f05e523e56aa1fff05f5d766960ab0539dfcc2d1dd2d33405a15725c715d54"],
      ["examples/gfx950_advanced_systems/check_isa.sh", "7a115cbdabc14575f597b35f8443a6d9db36261fbd8d31551447c55a02196b53"],
      ["examples/gfx950_advanced_systems/gfx950_advanced_systems.hip", "c29a6bc2de55563abddfb50f43aaccf6077ef0b4706fbfb314266ecaa48054c5"],
      ["examples/gfx950_advanced_systems/run-combine-expert-ranks-gfx950.sh", "d586548c5529ab771b8795132ed375e1ea79d5ccb22d36ce3783a30151e36071"],
      ["examples/gfx950_advanced_systems/run-gfx950.sh", "bfc9dbc79e84a90f9a7b73a265b4c6f7bc5be938ec732e140f72e4615c37c922"],
      ["examples/gfx950_advanced_systems/run-ablation-gfx950.sh", "190a5193ba1bfdee841842b09f7b35615790c31af15458119bbe0a853f71e846"],
      ["examples/gfx950_advanced_systems/run-moe-expert-rank-gfx950.sh", "3f117cf3c2cb585dcabcf7b7e8d19f4c1f8c0b37d4c45faa957bcf736c65bb98"],
      ["examples/gfx950_advanced_systems/run-moe-route-gfx950.sh", "176766f056546afff1b854cd0525b7475c36ea57371106a819bd367506832489"],
      ["examples/gfx950_advanced_systems/run-muon-update-gfx950.sh", "d4bbf39e0e5fc38f7f767fffcae81bd1749911a2fdfcd250b0f79b0394cfbe3d"],
      ["examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh", "d25726c4015a35e05ab31c8fa7f7f8f04cc10686727f982adb86eeda36d10da1"],
      ["examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh", "a85a7c2317f10077dcf97c1df9e2d95326a843e6a325dce3062ae4d06e8629fd"],
      ["examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh", "7f2bcc17211dcfc2b8234e0e1842a7f4b6166f8d31672636ee89f9604092f3c5"],
      ["examples/gfx950_advanced_systems/src/kernel.rs", "8e1d432962a1c51f4d8b08d33cb38dc838fad94ca47ebc64102ed2ce2e70dbd6"],
      ["examples/gfx950_advanced_systems/src/reference.rs", "7817c51c5274671197460f11ceed5fdd2b8415ba934119013adad68c7d7c8dbd"],
      ["examples/gfx950_advanced_systems/src/lib.rs", "3ae59a0e6d0c36afccc1518d3bd418452a83297bcc59b71f5172fdd38c932f95"],
      ["examples/gfx950_advanced_systems/tests/references.rs", "dd16aa4d15c630a8756b5d96a0d505c8cbfd6cd7a4aa77692891304da219f5dd"],
      ["examples/gfx950_advanced_systems/tests/source.rs", "04535fabdb54d7d0f10c8b9f913d774d33506c92b51c39420a0329e3b84749f1"],
      ["examples/gfx950_gpt_oss_decode/Cargo.lock", "da37f44ba68cd16107506e418830e63a11099de15d9f8235daeccc9522c0f09b"],
      ["examples/gfx950_gpt_oss_decode/Cargo.toml", "ccae3bc056ca2487a47f04a840b89247e24e7ff3b648674dbadbbc9ce60de299"],
      ["examples/gfx950_gpt_oss_decode/README.md", "17c37981f54857f21d51edb045de965b8d007736d0cb1954c52251bae6fd8861"],
      ["examples/gfx950_gpt_oss_decode/ablation-variants-v1.json", "716f7f39909268834e353fc296185fa01dd436a54d9c06b52445a71f1c36bd04"],
      ["examples/gfx950_gpt_oss_decode/gpt_oss_unfused.hip", "902d38e7a6b974f95c6d3420a069ee6400b52b9eb7f24f4cfb9f5eeae147a09b"],
      ["examples/gfx950_gpt_oss_decode/run-gfx950.sh", "b88b02df8b6c7b3ef7de9d839d4be742eb25f3e56a59b634b559408fe7e206a3"],
      ["examples/gfx950_gpt_oss_decode/run-ablation-gfx950.sh", "413b4d43426e3227a3166c9703dd5704a9a4b798722a85fb36442e6ed250b787"],
      ["examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh", "bd6df83ce6a9b6b2db11c5d18e6ee6fff283c7ef122481b44fffc90d47b532da"],
      ["examples/gfx950_gpt_oss_decode/src/kernel.rs", "b84b16ed5797fdcf5bdf05f603823f47bfa9839f017921d92bd0bcfbd73aecb6"],
      ["examples/gfx950_gpt_oss_decode/src/kernel_components.rs", "6f7b1ca11e492ff8b2f0e8e4b8e34e0c5809a7d5b24dcefa4814fbbadce536a1"],
      ["examples/gfx950_gpt_oss_decode/src/kernel_held_fragments.rs", "a2cc65e6e9c74f4523786706d994193d0d68d708386f9b29163b13bcd98e12d2"],
      ["examples/gfx950_gpt_oss_decode/src/kernel_interleaved_stores.rs", "a31af40117e11ed6779ecb9d54cc597805449bbb04db47af7a005ca3da55d72e"],
      ["examples/gfx950_gpt_oss_decode/src/kernel_pipelined_attention.rs", "96e2e4c1ea1019aa30ed8ce5674671d0674687131b529ae15220965e2dcc7c79"],
      ["examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs", "060c5600b8522bea3f6245794809a15fbc468bee008f7b497e5c7f06740af841"],
      ["examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs", "0755e02ef766b8ae88ca876ba8cf16d0cdc8da1cebc05a0aa354b766fac57b49"],
      ["examples/gfx950_gpt_oss_decode/src/lib.rs", "a0d8a54c855c2bf9a0b1c20dab682f9ece1370e479d9ea9b85882a7586ad6949"],
      ["examples/gfx950_gpt_oss_decode/src/reference.rs", "1739eee2283c6aee6a10f16a38458a8657dd56478849e621072795734d915f05"],
      ["examples/gfx950_gpt_oss_decode/tests/reference.rs", "60156d4d1c2d932e00c792b3cb65b63784131b1919f3a97cd83d29b4e8ec0e94"],
      ["examples/gfx950_gpt_oss_decode/tests/source.rs", "f6f36b7082eb9376c5985f5b6ba85a9cae2ab91adebf0fae3f7a3318ccc37227"],
      ["perf-evidence/gpt-oss-layer-tile-evidence-v1.json", "65ae89cdba30261d4dc3dc92a295f392e95b7bcded67f721c48defd8de17635a"],
      ["perf-evidence/gfx950-advanced-ablation-evidence-v1.json", "da0bf8e61151ca1ae15dbaf57743a840e2099556c3d20eebfe0c43d4ec792ec5"],
      ["perf-evidence/gfx950-integrated-compatibility-v1.json", "803835efa3e9bd973a40791184e50cfcbefa60d22af7fb02c9d45e9f6c191a59"],
      ["perf-evidence/mi350x-bound-inputs-v1.json", "79057257dcba07cec6adeed2341c8cb7e8ccdcef231a7c7b9687cb562f49ab49"],
      ["perf-evidence/gfx950-rejection-logs/scalar-attention.log", "033c71aa06489832eff24ef48abcd451924b1950959546f8f29acb39ac022c14"],
      ["perf-evidence/gfx950-rejection-logs/pipelined-attention.log", "ddea01325d7723ab42cec98c7c90e48edd681d38c5fbe97a6f35e1045e6e3066"],
      ["perf-evidence/gfx950-advanced-evidence-v1.json", "550b290ec4e8dbf43fa338f31fda88199c6f8d86ae55f9570789bac7b968fd6a"],
      ["perf-evidence/run-gpt-oss-performance.sh", "e4ab1ba9b2f7ce2489bf163922d9cdb4bbf01591643cc9aef0d4b30db175f28f"],
      ["perf-evidence/run-gfx950-advanced-ablation.sh", "adb6ec6814935a8023eb9f0b65cedb110768e2a795aa8907968650fc044629ab"],
      ["crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs", "339c5f86265f1f3cda56719da4d9a9ad6eb2474586b27c11e5e22aa24d09de1e"],
    ] as const;
    for (const [path, digest] of mirrors) {
      expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(digest);
    }
  });

  it("uses every evidence label", () => {
    const kinds = new Set(
      lessons.flatMap((lesson) => lesson.claims.map((claim) => claim.kind)),
    );
    expect(kinds).toEqual(
      new Set(
        Object.keys(evidenceLabels).filter((kind) => kind !== "source-example"),
      ),
    );
    expect(evidenceLabels["source-example"].short).toBe("Source example");
  });

  it("pins the exact compiler-generated WG64 debugger schedule", () => {
    const lesson = lessons.find((entry) => entry.id === "reductions-scans");
    const claim = lesson?.claims.find(
      (entry) => entry.label === "Exact target-neutral WG64 generated-effect schedule",
    );
    expect(claim).toMatchObject({
      kind: "compiler-checked",
      reference: {
        scope: "qualification-evidence",
        commit: "d4a87f9d38b2b373929847e0eb149cb505b0cd6f",
        tree: "6ffbe16ebb828dc2a4edcf30f5dfe3bf54213ca4",
      },
    });
    expect(claim?.detail).toContain("34 ordered effects");
    expect(claim?.detail).toContain("20 workgroup-memory accesses");
    expect(claim?.detail).toContain("14 acquire-release workgroup barriers");

    const narrative = narrativeEntry("reductions-scans/contribution-domain");
    const schedule = narrative?.blocks.find(
      (block) =>
        block.type === "table" && block.headers[0] === "Effect ordinal",
    );
    expect(schedule).toMatchObject({
      type: "table",
      rows: [
        ["0", "Publish", expect.stringContaining("LDS write")],
        ["1", "Publish", expect.stringContaining("barrier")],
        ["2-6", "Offset 32", expect.stringContaining("LDS read self")],
        ["7-11", "Offset 16", expect.any(String)],
        ["12-16", "Offset 8", expect.any(String)],
        ["17-21", "Offset 4", expect.any(String)],
        ["22-26", "Offset 2", expect.any(String)],
        ["27-31", "Offset 1", expect.any(String)],
        ["32", "Result", expect.stringContaining("scratch[0]")],
        ["33", "Release", expect.stringContaining("scratch reuse")],
      ],
    });

    const serialized = serializedLessonContent("reductions-scans");
    for (const exactBoundary of [
      "GeneratedFromSemanticTerminator",
      "ranked block, ranked operation",
      "domain-separated SHA-256",
      "Deliberately absent",
      "does not fabricate a direct Rust span",
      "not GPU execution",
      "protected source-to-HSACO publication",
    ]) {
      expect(serialized).toContain(exactBoundary);
    }
  });

  it("pins every evidenced claim to exact source and commands", () => {
    for (const lesson of lessons) {
      for (const claim of lesson.claims) {
        if (claim.kind === "design-only" || claim.kind === "source-example") {
          expect(claim.reference).toBeUndefined();
          continue;
        }

        const reference = claim.reference;
        expect(reference?.commit).toMatch(/^[0-9a-f]{40}$/);
        expect(reference?.tree).toMatch(/^[0-9a-f]{40}$/);
        expect(reference?.commands.length).toBeGreaterThan(0);
        expect(reference?.sourcePaths.length).toBeGreaterThan(0);
        if (reference?.scope === "lesson-evidence") {
          expect(reference.commit).toBe(FE2O3_PIN.commit);
          expect(reference.tree).toBe(FE2O3_PIN.tree);
        } else if (reference?.scope === "historical-evidence") {
          expect(reference.note).toMatch(/\b(archived|historical|retired)\b/iu);
        } else if (reference?.scope === "source-milestone") {
          const record = sourceMilestoneRecord(reference.evidenceId);
          expect(reference.commit).toBe(record.commit);
          expect(reference.tree).toBe(record.tree);
          expect(reference.claim).toBe(record.claim);
          expect(reference.authority).toBe(record.authority);
        } else if (reference?.scope === "staged-progress") {
          expect(reference.claim).toBe(claim.kind);
          expect([
            "source-admission-only",
            "harness-only",
            "structural-admission-only",
            "kernel-ir-admission-only",
            "source-model-only",
            "source-shape-only",
            "machine-inspection-only",
            "wire-format-only",
            "inert-worker-handoff-only",
            "sealed-profile-registry-only",
          ]).toContain(reference.authority);
        }
        for (const path of reference?.sourcePaths ?? []) {
          expect(path).not.toMatch(/^\//);
          expect(path).not.toContain("..");
        }
      }
    }
  });

  it("rejects historical evidence without an explicit and distinct boundary", () => {
    const missingBoundary = structuredClone(curriculum);
    const missingClaim = missingBoundary
      .flatMap((module) => module.lessons)
      .flatMap((lesson) => lesson.claims)
      .find((claim) => claim.reference?.scope === "historical-evidence")!;
    const missingReference = missingClaim.reference!;
    missingReference.note = "Observation-only evidence.";
    expect(validateCurriculum(missingBoundary)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "historical claim does not state its archived boundary",
        }),
      ]),
    );

    const currentPin = structuredClone(curriculum);
    const currentClaim = currentPin
      .flatMap((module) => module.lessons)
      .flatMap((lesson) => lesson.claims)
      .find((claim) => claim.reference?.scope === "historical-evidence")!;
    const currentReference = currentClaim.reference!;
    currentReference.commit = currentState.compilerCommit;
    currentReference.tree = currentState.compilerTree;
    expect(validateCurriculum(currentPin)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "historical claim reuses the current compiler pin",
        }),
      ]),
    );
  });

  it("requires every real source tab to match its pinned digest", () => {
    for (const lesson of lessons) {
      for (const tab of lesson.tabs) {
        if (tab.explanatory !== false) continue;
        expect(tab.sourcePath).toBeTruthy();
        expect(tab.sourceCommit).toMatch(/^[0-9a-f]{40}$/u);
        expect(tab.sourceSha256).toMatch(/^[0-9a-f]{64}$/u);
        expect(createHash("sha256").update(tab.code).digest("hex")).toBe(
          tab.sourceSha256,
        );
      }
    }
  });

  it("shows only safe Rust in every kernel tab", () => {
    for (const lesson of lessons) {
      for (const kernel of lesson.tabs.filter((tab) => tab.kind === "kernel")) {
        expect(kernel.code).not.toMatch(
          /\bunsafe\s*(?:\{|fn\b|impl\b|trait\b|extern\b)/u,
        );
      }
    }
  });

  it("pairs every executable kernel lesson with a safe CPU reference and Verus obligation", () => {
    const referenceLessonIds = [
      "first-fill",
      "typed-vecadd",
      "cpu-semantic-simulation",
      "reductions-scans",
      "lds-barriers-atomics",
      "gemm-tiling",
      "gemm-proof-plan",
      "softmax-invariant",
      "flash-attention",
      "moe-routing",
      "moe-expert-compute",
    ];

    for (const lessonId of referenceLessonIds) {
      const lesson = lessons.find((entry) => entry.id === lessonId);
      const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
      const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
      expect(reference, lessonId).toBeDefined();
      expect(reference?.language, lessonId).toBe("rust");
      expect(reference?.code, lessonId).not.toMatch(/\bunsafe\b/u);
      expect(reference?.code.length, lessonId).toBeGreaterThan(100);
      expect(proof, lessonId).toBeDefined();
      expect(proof?.code, lessonId).not.toContain(
        "No Verus theorem is claimed for this lesson",
      );
    }
  });

  it("keeps source-to-bundle CPU simulation exact and non-hardware", () => {
    const lesson = lessons.find(
      (candidate) => candidate.id === "cpu-semantic-simulation",
    );
    expect(lesson).toBeDefined();
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      explanatory: false,
      sourceCommit: currentState.compilerCommit,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
      sourceDigestScope: "displayed",
    });
    expect(kernel?.code).toBe(
      readFileSync("examples/cpu_simulation_source.rs", "utf8"),
    );
    expect(kernel?.code).toContain("pub fn barrier_before_access");
    expect(kernel?.code).toContain("syncthreads();");
    const host = lesson?.tabs.find((tab) => tab.kind === "host")?.code ?? "";
    expect(host).toContain(
      readFileSync("examples/source_simulation_request.json", "utf8").trim(),
    );
    expect(host).toContain("fe2o3-export-sim --crate");
    expect(host).toContain("fe2o3-kir-sim --bundle");
    expect(host).toContain("--record-canonical-schedule");
    expect(host).toContain("--replay-schedule");
    expect(host).toContain("fe2o3-debug sim --bundle");
    expect(host).not.toContain("--kir-v7");
    const sourceDebug =
      lesson?.tabs.find((tab) => tab.kind === "comparison")?.code ?? "";
    expect(sourceDebug).toContain(
      readFileSync("examples/source_debugger_requests_v1.jsonl", "utf8").trim(),
    );
    expect(sourceDebug).toContain(
      readFileSync("examples/source_debugger_responses_v1.jsonl", "utf8").trim(),
    );
    expect(validateSourceDebuggerMilestone()).toEqual([]);
    expect(sourceDebuggerRequests).toHaveLength(5);
    expect(sourceDebuggerResponses).toHaveLength(5);
    expect(
      createHash("sha256")
        .update(readFileSync("examples/source_debugger_requests_v1.jsonl"))
        .digest("hex"),
    ).toBe(SOURCE_DEBUGGER_REQUESTS_SHA256);
    expect(
      createHash("sha256")
        .update(readFileSync("examples/source_debugger_responses_v1.jsonl"))
        .digest("hex"),
    ).toBe(SOURCE_DEBUGGER_RESPONSES_SHA256);
    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    const simulationResult = JSON.parse(
      readFileSync("examples/source_simulation_result.json", "utf8"),
    ) as Record<string, unknown>;
    const persistedSchedule = JSON.parse(
      readFileSync("examples/source_simulation_schedule_v1.json", "utf8"),
    ) as Record<string, unknown>;
    expect(result).toContain(
      readFileSync("examples/source_simulation_result.json", "utf8").trim(),
    );
    expect(result).toContain(
      readFileSync("examples/source_simulation_schedule_v1.json", "utf8").trim(),
    );
    expect(simulationResult).toMatchObject({
      authority: "observation_only",
      simulated: true,
      hardware_observed: false,
      hardware_validation: false,
      performance_prediction: false,
      kir: { canonical_bytes: 1187 },
      counts: {
        workgroups_visited: 1,
        scheduled_slots_visited: 64,
        steps_executed: 43,
      },
      schedule: {
        coverage: { decisions: 2, barrier_releases: 1, complete: true },
      },
    });
    expect(persistedSchedule).toMatchObject({
      schema: "fe2o3-simulation-schedule-v1",
      artifact: { kind: "simulation_bundle_v1" },
      coverage: { decisions: 2, barrier_releases: 1, complete: true },
    });
    expect(lesson?.claims[0]).toMatchObject({
      kind: "runnable-now",
      reference: {
        scope: "current-implementation",
        commit: currentState.compilerCommit,
        tree: currentState.compilerTree,
      },
    });
    const reference = lesson?.claims[0].reference;
    expect(reference).toMatchObject({
      scope: "current-implementation",
      commit: currentState.compilerCommit,
      tree: currentState.compilerTree,
      target: "amdgpu_64_little_endian_v1 (simulated scalar profile)",
    });
    expect(reference?.note).toContain("not protected compiler-execution authentication");
    expect(reference?.sourcePaths).toEqual(
      expect.arrayContaining([
        "docs/simulation-bundle-v1.md",
        "docs/semantic-schedule-v1.md",
        "crates/rustc-codegen-fe2o3/src/bin/fe2o3-export-sim.rs",
        "crates/fe2o3-kir-sim/src/schedule.rs",
      ]),
    );
    const content = serializedLessonContent("cpu-semantic-simulation");
    expect(content).toContain("ordinary attributed Rust");
    expect(content).toContain("compiler_bundle_bound");
    expect(content).toContain("Bundle-bound is not compiler-authenticated");
    expect(content).toContain("Persist the schedule, then replay it");
    expect(content).toContain("source breakpoints");
    expect(content).toContain("captured stacks");
    expect(content).toContain("Direct-KFD hardware V3");
    expect(content).toContain("Wave32/Wave64");
    expect(content).toContain("gfx950 LDS transpose");
    expect(content).toContain("no source-to-KIR refinement");
    expect(content).toContain("performance prediction");
    expect(content).toContain("ROCgdb remains the hardware-debugging substrate");
    expect(content).toContain("rocprofv3 and compute viewer");
    expect(content).toContain("Native HIP or Mojo workflow");
    expect(content).toContain("broader superiority is not claimed");

    expect(currentState.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ number: 215, state: "open" }),
        expect.objectContaining({ number: 216, state: "open" }),
      ]),
    );
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "semantic-debug-profile",
      )?.detail,
    ).toContain("exact ordinary-Rust bundle transcript");
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "semantic-debug-profile",
      )?.detail,
    ).toContain("profiler UI remain open");
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "cpu-semantic-simulation",
      )?.detail,
    ).toContain("authority-free .fe2sim");
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "cpu-semantic-simulation",
      )?.detail,
    ).toContain("no source refinement");
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "compiler-analysis",
      )?.detail,
    ).toContain("context-wide monotonic PLIRON mutation-attempt epoch");
    const middleEndCustody = currentState.capabilities.find(
      (capability) => capability.id === "middle-end-custody",
    );
    expect(middleEndCustody?.detail).toContain(
      "one fixed nine-pass sequence and one live evidence producer",
    );
    expect(middleEndCustody?.detail).toContain(
      "V4 decoder is strict and archival-only",
    );
    expect(middleEndCustody?.detail).toContain(
      "ProductionReferenceProofV1 and RequireReferenceEquivalent API is removed",
    );
    expect(middleEndCustody?.detail).toContain(
      "bounded structural inventory before recursive PLIRON verification",
    );
    expect(middleEndCustody?.detail).toContain("FE2O3-TARGET-000");
    expect(middleEndCustody?.detail).toContain(
      "Authenticated production projection now carries checked tiled and row-striped indices",
    );
    expect(middleEndCustody?.detail).toContain(
      "retained KIR lowering for the supported dynamic fragment",
    );
    expect(middleEndCustody?.sourcePaths).toContain(
      "crates/fe2o3-pliron/tests/production_middle_end_evidence_v5.rs",
    );
    const compilerAnalysis = currentState.capabilities.find(
      (capability) => capability.id === "compiler-analysis",
    );
    expect(compilerAnalysis?.detail).toContain(
      "static bounded-access fragment",
    );
    expect(compilerAnalysis?.detail).toContain(
      "nonempty tensor-layout replay remains Incomplete",
    );
    expect(compilerAnalysis?.detail).toContain(
      "Checked tiled and row-striped recipes carry an exact index",
    );
    expect(compilerAnalysis?.detail).toContain(
      "proves supported active store maps injective",
    );
    expect(compilerAnalysis?.detail).toContain(
      "contain no GEMM, attention, routing, or other workload selector",
    );
    expect(compilerAnalysis?.detail).toContain(
      "One production transformation folds",
    );
    expect(compilerAnalysis?.sourcePaths).toEqual(
      expect.arrayContaining([
        "crates/fe2o3-kernel-analysis/src/pliron_pass_contract.rs",
        "crates/fe2o3-kernel-analysis/src/pliron_report_validation.rs",
        "crates/fe2o3-kernel-analysis/src/pliron_analysis_witness.rs",
        "crates/dialect-kernel/src/ranked_memory.rs",
        "crates/fe2o3-pliron/tests/production_predicated_access.rs",
        "crates/fe2o3-kernel-analysis/tests/lit/race_predicated_checked_access_raw.pliron",
        "crates/rustc-codegen-fe2o3/src/production_ranked_projection_v1.rs",
        "crates/fe2o3-pliron/src/production/ranked/ranked_index_constant_fold_v1.rs",
      ]),
    );
    expect(compilerAnalysis?.sourcePaths).not.toContain(
      "crates/fe2o3-kernel-analysis/src/pliron_transform_refinement.rs",
    );
    const productionRoute = currentState.capabilities.find(
      (capability) => capability.id === "rust-production-route",
    );
    expect(productionRoute?.detail).toContain(
      "standalone AMDGCN/PLIRON-to-LLVM and KIR/PLIRON bridge packages have been deleted",
    );
    expect(productionRoute?.detail).toContain(
      "derived from live collective and LDS-transpose operations rather than a workload or function name",
    );
    expect(productionRoute?.detail).toContain(
      "nonzero power-of-two tile width through 64",
    );
    expect(productionRoute?.detail).toContain(
      "Unsupported widths, targets, profiles, and dynamic source lanes fail closed",
    );
    expect(productionRoute?.sourcePaths).toEqual(
      expect.arrayContaining([
        "crates/fe2o3-mir-model/src/semantic_mir_v1.rs",
        "crates/fe2o3-lower-mir-kernel/src/production_semantic_kir_v1.rs",
        "crates/fe2o3-amdgcn-model/src/lowering.rs",
        "crates/fe2o3-amdgcn-model/tests/gfx950_collectives_and_lds_transpose_v1.rs",
      ]),
    );
    const compilerCatalog = JSON.stringify(
      narrativeEntry("compiler-checks/catalog"),
    );
    expect(compilerCatalog).toContain(
      "retired standalone lowering and bridge packages are deleted",
    );
    expect(compilerCatalog).toContain(
      "Semantic MIR V6 and Kernel IR V9 selection follows live collective and LDS-transpose operations",
    );
    expect(compilerCatalog).toContain(
      "Successful target selection or lowering grants no source-to-KIR refinement",
    );
    expect(
      currentState.capabilities.find(
        (capability) => capability.id === "functional-reference",
      )?.detail,
    ).not.toContain("transition records");
  });

  it("pins the executable dynamic GEMM and historical tiled evidence separately", () => {
    const lesson = lessons.find((entry) => entry.id === "gemm-tiling");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath: "examples/tiled_gemm_general_v1/src/kernel.rs",
      sourceCommit: "1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e",
      sourceSha256:
        "414213d07b324628d56d51f1f5ed364d3829d7116b387a03752b15beee79580d",
      evidenceId: "workgroup-pipeline-source-v1",
      explanatory: false,
    });
    expect(kernel?.code).toContain("while phase_index < phase_count");
    expect(kernel?.code).toContain("WorkgroupPipeline::<Bf16MfmaAFragment");
    expect(kernel?.code).toContain("lhs_pipeline.stage(future_epoch)");
    expect(kernel?.code).toContain("lhs_pipeline.wait(phase_index)");
    expect(kernel?.code).toContain("lhs_pipeline.discard(phase_count)");
    expect(kernel?.code).toContain("matrix.multiply_accumulate(lhs, rhs, accumulator)");
    expect(kernel?.code).toContain("-> KernelResult");
    expect(kernel?.code).toContain(
      "let a_matrix = Bf16MfmaAMatrix::row_major(a, 0, m as usize, k as usize, lda as usize)?;",
    );
    expect(kernel?.code).toContain(
      "let next_lhs = a_matrix.load_m16k16(&wave_lane, tile_row * 16, next_phase);",
    );
    expect(kernel?.code).not.toMatch(/load_(?:m16k16|k16n16)\([^;]+\)\?/u);
    expect(kernel?.code).toContain("let matrix = Matrix::current()");
    expect(kernel?.code).toContain("alpha * values[0] + beta * *output");
    expect(kernel?.code).not.toMatch(/\bunsafe\b/u);
    expect(lesson?.diagram).toBe("gemm-scalar");

    const reference = lesson?.tabs.find((tab) => tab.kind === "reference");
    expect(reference).toMatchObject({
      label: "Safe CPU reference",
      sourcePath: "examples/tiled_gemm_general_v1/src/reference.rs",
      sourceCommit: "1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e",
      explanatory: false,
    });
    expect(reference?.code).toContain("#![forbid(unsafe_code)]");

    const refinement = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(refinement).toMatchObject({
      label: "Verus refinement",
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      evidenceId: "reference-refinement-v1",
      explanatory: false,
    });
    expect(refinement?.code).toContain(
      "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
    );

    const hip = lesson?.tabs.find((tab) => tab.kind === "comparison");
    expect(hip).toMatchObject({
      label: "Equivalent HIP",
      language: "cpp",
      sourcePath: "examples/tiled_gemm_general_v1/benchmark_hip.cpp",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "24233c267c1bad3bde9c4897fb063d2e48d6d2fa07439dd04f4d0c14bd2ea84c",
      explanatory: false,
    });
    expect(hip?.code).toContain("__builtin_amdgcn_mfma_f32_16x16x16bf16_1k");

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath: "examples/tiled_gemm_general_v1/src/main.rs",
      sourceCommit: "1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e",
      sourceSha256:
        "fdd4efbeff66aeb7f423abe11ec3ee1330918adde21558525241ca58ce27e64b",
      evidenceId: "workgroup-pipeline-source-v1",
      explanatory: false,
    });
    expect(host?.code).toContain("rows: 19");
    expect(host?.code).toContain("grid_dim: (tile_rows * tile_columns, 1, 1)");

    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    expect(result).toContain("110 correspondence blocks");
    expect(result).toContain("v_mfma_f32_16x16x16_bf16");
    expect(result).toContain("PASS tiled_gemm_general_v1: 19x21x23");
    expect(result).toContain("4 x s_barrier");
    expect(result).toContain("functional qualification, not a performance claim");
    expect(result).toContain("138.005 us");
    expect(result).toContain("130.514 us");

    const proofLesson = lessons.find((entry) => entry.id === "gemm-proof-plan");
    expect(proofLesson?.tabs.find((tab) => tab.kind === "kernel")).toMatchObject({
      sourcePath: "examples/tiled_gemm_v1/src/kernel.rs",
      evidenceId: "tiled-gemm-safe-source-v1",
    });
    expect(proofLesson?.tabs.find((tab) => tab.kind === "verus")?.code).toContain(
      "--test lds_source_refinement",
    );

    const changed = structuredClone(curriculum);
    const changedKernel = changed
      .flatMap((module) => module.lessons)
      .find((entry) => entry.id === "gemm-tiling")
      ?.tabs.find((tab) => tab.kind === "kernel");
    if (changedKernel) changedKernel.sourceCommit = "main";
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "code tab source is not pinned to an exact commit",
      }),
    );
  });

  it("keeps compiler diagnostics in the GEMM proof lesson", () => {
    const lesson = lessons.find((entry) => entry.id === "gemm-tiling");
    expect(lesson?.objectives).toContain(
      "Follow the dynamic K loop through target-neutral matrix fragments to a gfx942 MFMA.",
    );

    const contract = JSON.stringify(
      narrativeEntry("gemm-tiling/general-contract"),
    );
    expect(contract).toContain("Generic PLIRON safety passes are mandatory before lowering");
    expect(contract).toContain("mandatory workload-neutral safety sequence before Kernel IR lowering");
    expect(contract).toContain("memory bounds");
    expect(contract).toContain("atomic legality");
    expect(contract).toContain("global race freedom");
    expect(contract).toContain("barrier convergence");
    expect(contract).toContain("workgroup-memory initialization/publication");
    expect(contract).toContain("declared semantic refinement");
    expect(contract).toContain("sparse affine index dataflow");
    expect(contract).toContain("contains no GEMM names, tile-size tests, or schedule recognizers");
    expect(contract).toContain("checked index, success path, extent, dominance, provenance");
    expect(contract).toContain("KIR, LLVM, HSACO, and qualification launch");
    expect(contract).toContain("Remaining work is protected publication");
    expect(contract).toContain("current kernel uses BF16/F32 MFMA");
    expect(contract).toContain("compiler-owned double-buffered LDS staging");
    expect(contract).toContain("ceil_div(K,16)");
    expect(contract).toContain("defined BF16 +0");
    expect(contract).toContain("unconditional publish barrier");
    expect(contract).toContain("alpha*acc[m,n] + beta*C[m,n]");
    expect(contract).toContain("Ten safe UI fixtures");
    expect(contract).toContain("not fe2o3 semantic proof diagnostics");
    expect(contract).toContain("unsafe never discharges or bypasses a verifier obligation");
    for (const [obligation, code] of [
      ["memory_safe", "0x46470101"],
      ["bounds_safe", "0x46470102"],
      ["initialized", "0x46470103"],
      ["race_free", "0x46470104"],
      ["barrier_convergent", "0x46470105"],
      ["output_region_injective", "0x46470106"],
      ["lds_epoch_correct", "0x46470107"],
      ["accumulator_phase_refinement", "0x46470108"],
      ["tail_refinement", "0x46470109"],
      ["epilogue_refinement", "0x4647010a"],
      ["numerical_contract", "0x4647010b"],
      ["machine_refinement_boundary", "0x4647010c"],
    ]) {
      expect(contract).toContain(obligation);
      expect(contract).toContain(code);
    }
    for (const code of [
      "0x46470001",
      "0x46470002",
      "0x46470003",
      "0x46470004",
      "0x46470005",
      "0x46470006",
    ]) {
      expect(contract).toContain(code);
    }

    const catalog = narrativeEntry("compiler-checks/catalog");
    const productionPath = narrativeEntry("compiler-checks/production-path");
    const completeCatalog = narrativeEntry(
      "compiler-checks/complete-correctness-catalog",
    );
    const compilerNarrative = JSON.stringify([
      catalog,
      productionPath,
      narrativeEntry("compiler-checks/v7-simulation"),
      completeCatalog,
    ]);

    expect(compilerNarrative).toContain("From safe Rust to checked Kernel IR");
    expect(compilerNarrative).toContain(
      "No pass recognizes GEMM, softmax, attention, routing, or another workload name",
    );
    expect(compilerNarrative).toContain(
      "Static bounded ranked access witness",
    );
    expect(compilerNarrative).toContain(
      "Nonempty tensor-layout witness",
    );
    expect(compilerNarrative).toContain(
      "every other current independent stage witness remain Incomplete",
    );
    expect(compilerNarrative).toContain(
      "Checked tiled and row-striped recipes",
    );
    expect(compilerNarrative).toContain(
      "canonical single-entry multi-block forwarding SCCs",
    );
    expect(compilerNarrative).toContain(
      "source integer width and the ranked u64 update",
    );
    expect(compilerNarrative).toContain(
      "independent exact typed structural replay",
    );
    expect(compilerNarrative).toContain(
      "Overflow and zero divisors stay unfurled",
    );
    expect(compilerNarrative).toContain(
      "Canonical hashes are labels only",
    );
    expect(compilerNarrative).toContain(
      "Debug the verified bundle without upgrading observation into proof",
    );
    expect(compilerNarrative).not.toContain(
      "production registry contains zero transforming passes",
    );
    expect(compilerNarrative).not.toContain(
      "all eight independent semantic-witness checks remain Incomplete",
    );

    const failures = catalog.blocks.find(
      (block) => block.type === "compile-failures",
    );
    expect(failures?.type).toBe("compile-failures");
    if (failures?.type !== "compile-failures") return;
    expect(failures.examples.map(({ code }) => code)).toEqual([
      "FE2O3-BOUNDS-001",
      "FE2O3-RACE-001",
      "FE2O3-TENSOR-LAYOUT-005",
      "FE2O3-PIPELINE-001",
      "FE2O3-PIPELINE-001",
      "FE2O3-PIPELINE-001",
    ]);
    expect(JSON.stringify(failures)).toContain(
      "compiler-authenticated injective ownership mapping",
    );

    const relationTable = completeCatalog.blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Relation",
    );
    expect(relationTable?.type).toBe("table");
    if (relationTable?.type !== "table") return;
    expect(relationTable.rows.map(([relation]) => relation)).toEqual([
      "Static bounded ranked access witness",
      "Nonempty tensor-layout witness",
      "Bounds outside the raw fragment",
      "Race and ownership policy",
      "Loop progress policy",
      "Barrier, atomic, workgroup-memory, hierarchy, and semantic witnesses",
      "Checked index constant fold",
      "Any other transformation",
    ]);
    expect(
      relationTable.rows.find(
        ([relation]) => relation === "Nonempty tensor-layout witness",
      )?.[1],
    ).toBe("Incomplete");
  });

  it("teaches the single ranked compiler path and its narrow replay boundary", () => {
    const lesson = lessons.find((entry) => entry.id === "compiler-checks");
    const bounds = lesson?.tabs.find((tab) => tab.kind === "kernel");
    const fold = lesson?.tabs.find((tab) => tab.kind === "comparison");
    const result = lesson?.tabs.find((tab) => tab.kind === "result");
    const host = lesson?.tabs.find((tab) => tab.kind === "host");

    expect(lesson).toMatchObject({
      title: "Compiler checks: one path, explicit boundaries",
      duration: "18 min",
    });
    expect(lesson?.objectives).toHaveLength(6);
    expect(bounds).toMatchObject({
      label: "Static bounds",
      explanatory: false,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
    });
    expect(bounds?.code).toContain("let selected = input[64]");
    expect(fold).toMatchObject({ label: "Checked fold", explanatory: true });
    expect(fold?.code).toContain("kernel.index_binary Add");
    expect(fold?.code).toContain("kernel.index_constant 12");
    expect(fold?.notice).toContain("separate evaluator and structural replay");
    expect(result?.code).toContain(
      "static bounded ranked access raw replay",
    );
    expect(result?.code).toContain(
      "nonempty tensor-layout replay",
    );
    expect(result?.code).toContain(
      "every other current independent stage witness",
    );
    expect(result?.code.split("\n\nIncomplete:")[0]).not.toContain(
      "tensor",
    );
    expect(host?.code).toContain("production_ranked_constant_fold");
    expect(host?.code).toContain("pliron_analysis_witness");
    expect(host?.code).toContain("pliron_lit");
    expect(host?.code).not.toContain("qualification");

    const claim = lesson?.claims[0];
    expect(claim?.detail).toContain("sealed checked constant fold");
    expect(claim?.detail).toContain("all other current witnesses remain Incomplete");
    expect(claim?.reference?.sourcePaths).toEqual(
      expect.arrayContaining([
        "crates/fe2o3-pliron/src/production/ranked/ranked_index_constant_fold_v1.rs",
        "crates/fe2o3-kernel-analysis/src/pliron_analysis_witness.rs",
      ]),
    );
    expect(claim?.reference?.sourcePaths).not.toContain(
      "crates/fe2o3-kernel-analysis/src/pliron_transform_refinement.rs",
    );

    const narrative = JSON.stringify([
      narrativeEntry("compiler-checks/catalog"),
      narrativeEntry("compiler-checks/production-path"),
      narrativeEntry("compiler-checks/complete-correctness-catalog"),
    ]);
    for (const boundary of [
      "Rust MIR to ranked PLIRON to KIR",
      "exact preceding index constants",
      "mutation-attempt epoch",
      "Static bounded ranked access witness",
      "Nonempty tensor-layout witness",
      "Checked tiled and row-striped recipes",
      "Canonical single-entry multi-block forwarding SCCs",
      "ProductionMiddleEndEvidenceV5 is the sole live middle-end evidence producer",
      "V4 decoder is archival-only",
      "ProductionReferenceProofV1 and RequireReferenceEquivalent API has been removed",
      "bounded structural preflight accounts blocks, operations, values, operands, successors, attributes, and nesting",
      "FE2O3-TARGET-000",
      "Authenticated checked tiled and row-striped mappings",
      "Same-TyCtxt descriptor identity hardens substitution checks",
      "Any other transformation",
      "kernel.index_unsigned_cast",
      "Supported authenticated tiled and row-striped maps proceed to retained KIR",
      "not universal correctness",
    ]) {
      expect(narrative).toContain(boundary);
    }
    expect(narrative).toContain(
      "Raw or textual carriers without those facts",
    );
    expect(narrative).toContain(
      "active stores injective",
    );
    expect(narrative).not.toContain("zero production transformations");
    expect(narrative).not.toContain("all eight independent semantic-witness");
  });

  it("teaches row softmax from exact source while preserving evidence boundaries", () => {
    const lesson = lessons.find((entry) => entry.id === "softmax-invariant");
    const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
    expect(kernel).toMatchObject({
      sourcePath: "examples/row_softmax_general_v1/src/kernel.rs",
      sourceCommit: "ecf7b17f819021708d9c59ebe39a4daf9eb2562c",
      sourceSha256:
        "58012e0d5168161cf48fa3f06644af04585c4e603af0a15b8737964ba96f04de",
      explanatory: false,
    });
    expect(createHash("sha256").update(kernel?.code ?? "").digest("hex")).toBe(
      kernel?.sourceSha256,
    );
    expect(kernel?.code).toContain("#[kernel(");
    expect(kernel?.code).toContain("control_flow(loop_bounds(64, 64, 64))");
    expect(kernel?.code).toContain("Math::current()");
    expect(kernel?.code).toContain("Subgroup::current()");
    expect(kernel?.code).toContain("-> KernelResult");
    expect(kernel?.code).toContain("subgroup_reduce_max_f32::<64>");
    expect(kernel?.code).toContain("subgroup_reduce_sum_f32::<64>");
    expect(kernel?.code).toContain("checked_row_striped_2d::<64, 64>");

    const proof = lesson?.tabs.find((tab) => tab.kind === "verus");
    expect(proof).toMatchObject({
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      explanatory: false,
    });
    expect(proof?.code).toContain(
      "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
    );

    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    expect(host).toMatchObject({
      sourcePath: "examples/row_softmax_general_v1/src/main.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "8df056afb9e91aa3e42b4372860431612a77ef71b0abb7ebdd088c7210a5a1bd",
      explanatory: false,
    });
    expect(host?.code).toContain("grid_dim: (case.rows, 1, 1)");
    expect(host?.code).toContain("maximum-width");
    expect(host?.code).toContain("wrote output padding");

    const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code ?? "";
    expect(result).toContain("Historical dynamic row softmax qualification on MI300X/gfx942");
    expect(result).toContain("workload-selecting route is not present");
    expect(result).toContain("PASS single-column");
    expect(result).toContain("PASS maximum-width");
    expect(result).toContain("four ranked dynamic-index obligations");
    expect(result).toContain("lane shuffles and no MFMA");
    expect(result).toContain("not a proof for every input or a performance claim");

    const proofNarrative = narrativeEntry("softmax-invariant/proof");
    expect(JSON.stringify(proofNarrative)).toContain("PLIRON verification");
    expect(JSON.stringify(proofNarrative)).toContain(
      "The compiler does not know this is softmax",
    );
    expect(JSON.stringify(proofNarrative)).toContain(
      "never matches a softmax name or loop pattern",
    );
    expect(JSON.stringify(proofNarrative)).toContain(
      "has not been rerun through the 1dd61a01 end-to-end qualification",
    );
    expect(JSON.stringify(proofNarrative)).toContain(
      "runtime checked stripe construction",
    );
    expect(JSON.stringify(proofNarrative)).toContain(
      "no current KIR or gfx942 result",
    );
  });

  it("pins exact source-only kernel snapshots", () => {
    expect(sourceMilestoneOrder).toEqual([
      "workgroup-pipeline-source-v1",
      "dynamic-gemm-executable-source-v1",
      "tiled-gemm-safe-source-v1",
      "wave64-collectives-source-v1",
      "workgroup-sync-source-v1",
      "flash-attention-source-v1",
      "flash-attention-verus-v1",
      "moe-top2-source-v1",
      "moe-top2-verus-v1",
      "moe-expert-source-v1",
      "moe-expert-verus-v1",
      "reference-refinement-v1",
    ]);
    expect(validateSourceMilestoneCatalog()).toEqual([]);

    const moeExpertSource = sourceMilestoneRecord("moe-expert-source-v1");
    const moeExpertKernel = readFileSync(
      moeExpertSource.primarySourcePath,
      "utf8",
    );
    expect(createHash("sha256").update(moeExpertKernel).digest("hex")).toBe(
      moeExpertSource.primarySourceSha256,
    );
    expect(moeExpertSource.detail).toContain(
      "loaded MFMA fragments feed the matrix operation directly",
    );
    expect(moeExpertKernel).toContain(
      "activation_fragment,\n            weight_fragment,",
    );
    expect(moeExpertKernel).not.toContain(
      "gfx942_lds_bf16_tile_pair_m16x16_v1",
    );
    expect(moeExpertKernel).not.toContain(
      "gfx942_publish_lds_bf16_tile_pair_m16x16_v1",
    );

    const profiles = [
      {
        lessonId: "reductions-scans",
        evidenceId: "wave64-collectives-source-v1",
        sourcePath: "examples/wave64_collectives_v1/src/kernel.rs",
        bundledPath: "examples/wave64_collectives_v1/src/kernel.rs",
        sha256:
          "7c6ead1e7c01a61a8f31a010c9e8cb9bd1c21a905ba61e9d90c6c077c748ffd4",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      },
      {
        lessonId: "lds-barriers-atomics",
        evidenceId: "workgroup-sync-source-v1",
        sourcePath: "examples/workgroup_sync_v1/src/kernel.rs",
        bundledPath: "examples/workgroup_sync_v1/src/kernel.rs",
        sha256:
          "991542b783a144598be967ae1671609b2a02a812ca084c3bf6358a9f70968105",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      },
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-source-v1",
        sourcePath: "examples/moe_top2_v1/src/kernel.rs",
        bundledPath: "examples/moe_top2_v1/src/kernel.rs",
        sha256:
          "0e4570bd52866dd23b8b00d83983aadc818c77580de8f7f5e2982e12a57e20e2",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      },
    ] as const;

    for (const profile of profiles) {
      const lesson = lessons.find((entry) => entry.id === profile.lessonId);
      const kernel = lesson?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toMatchObject({
        sourcePath: profile.sourcePath,
        sourceCommit: profile.sourceCommit,
        sourceSha256: profile.sha256,
        evidenceId: profile.evidenceId,
        explanatory: false,
      });
      const bundled = readFileSync(profile.bundledPath, "utf8");
      expect(kernel?.code).toBe(bundled);
      expect(createHash("sha256").update(bundled).digest("hex")).toBe(
        profile.sha256,
      );
      expect(kernel?.code).toContain("#[kernel(");
      expect(kernel?.code).not.toMatch(/macro_rules!\s+[A-Za-z_]/u);

      for (const kind of ["host", "result"] as const) {
        expect(
          lesson?.tabs.find((tab) => tab.kind === kind)?.explanatory,
        ).toBe(true);
      }
      expect(lesson?.tabs.find((tab) => tab.kind === "verus")?.explanatory).toBe(
        profile.lessonId !== "moe-routing",
      );
      const result = lesson?.tabs.find((tab) => tab.kind === "result")?.code;
      const gaps = profile.lessonId === "moe-routing"
        ? [
            "W0 authenticated HostLinkClosureV1",
            "W1 broker cargo-fe2o3 executable identity",
            "protected GPU output",
            "authenticated proof consumption",
            "IEEE FP32/compiler/logical-address refinement",
            "source/model-to-machine refinement",
          ]
        : profile.lessonId === "lds-barriers-atomics"
          ? [
              "source/compiler/machine refinement",
              "generalized illegal-access safety",
              "generalized race freedom",
            ]
          : profile.lessonId === "reductions-scans"
            ? ["Compiler and Verus-to-machine refinement"]
          : [
            "compiler collector/lowering",
            "compiler profile and descriptor",
            "finalizer",
            "generated host/runtime",
            "protected gfx942 execution",
          ];
      for (const gap of gaps) {
        expect(result).toContain(gap);
      }
      if (profile.lessonId === "reductions-scans") {
        expect(result).toContain("protected four-mask gfx942 observation");
      } else if (profile.lessonId === "lds-barriers-atomics") {
        expect(result).toContain("bounded protected MI300X observation");
        expect(result).toContain("exact-profile evidence only");
      } else {
        expect(result).toContain("No functional hardware result is claimed");
      }
    }

    const proofProfiles = [
      {
        lessonId: "moe-routing",
        evidenceId: "moe-top2-verus-v1",
        bundledPath: "examples/moe_top2_v1/verus/moe_top2_v1.rs",
        sha256:
          "4a5a60b66284567522ab3f07d93309c7002abf75870f4aa9db752f8260cb296c",
        sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      },
    ] as const;
    for (const profile of proofProfiles) {
      const proof = lessons
        .find((entry) => entry.id === profile.lessonId)
        ?.tabs.find((tab) => tab.kind === "verus");
      const bundled = readFileSync(profile.bundledPath, "utf8");
      expect(proof).toMatchObject({
        code: bundled,
        sourcePath: profile.bundledPath,
        sourceCommit: profile.sourceCommit,
        sourceSha256: profile.sha256,
        evidenceId: profile.evidenceId,
        explanatory: false,
      });
      expect(createHash("sha256").update(bundled).digest("hex")).toBe(
        profile.sha256,
      );
    }

    const atomicPath = "examples/workgroup_sync_v1/src/scoped_atomic.rs";
    const atomic = readFileSync(atomicPath, "utf8");
    expect(createHash("sha256").update(atomic).digest("hex")).toBe(
      "30931d5236c4730e2b6212644587fe76d37067d87a9b7f1dfadbe3ea02fef28b",
    );
    const synchronizationClaim = lessons
      .find((entry) => entry.id === "lds-barriers-atomics")
      ?.claims.find(
        (claim) => claim.reference?.scope === "source-milestone",
      );
    expect(synchronizationClaim?.reference?.sourcePaths).toContain(atomicPath);
    expect(atomic).toContain("DeviceGlobalMutPtr<u32>");
  });

  it("rejects incomplete or substituted promoted source provenance", () => {
    const mutateCollectivesKernel = (
      mutate: (kernel: Record<string, unknown>) => void,
    ) => {
      const changed = structuredClone(curriculum);
      const kernel = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "reductions-scans")
        ?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toBeDefined();
      mutate(kernel as unknown as Record<string, unknown>);
      return validateCurriculum(changed);
    };

    expect(
      mutateCollectivesKernel((kernel) => delete kernel.sourceSha256),
    ).toContainEqual(
      expect.objectContaining({
        message: "promoted algorithm kernel lacks exact source provenance",
      }),
    );
    expect(
      mutateCollectivesKernel((kernel) => {
        kernel.sourceSha256 = "0".repeat(64);
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "real source tab does not match its exact source milestone",
      }),
    );
    expect(
      mutateCollectivesKernel((kernel) => {
        kernel.sourceCommit = "main";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab source is not pinned to an exact commit",
      }),
    );
  });

  it("rejects promoted GEMM tabs without exact evidence linkage", () => {
    const mutateKernel = (mutate: (kernel: Record<string, unknown>) => void) => {
      const changed = structuredClone(curriculum);
      const kernel = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "gemm-tiling")
        ?.tabs.find((tab) => tab.kind === "kernel");
      expect(kernel).toBeDefined();
      mutate(kernel as unknown as Record<string, unknown>);
      return validateCurriculum(changed);
    };

    expect(
      mutateKernel((kernel) => delete kernel.evidenceId),
    ).toContainEqual(
      expect.objectContaining({
        message:
          "promoted algorithm kernel tab lacks exact source and evidence linkage",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.sourceCommit = "5a45239aeeda3ca64cf16beb7fb1d3589e649bfe";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab source commit does not match its evidence",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.sourcePath = "examples/tiled_gemm_v1/src/oracle.rs";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab source path is not covered by its evidence",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.evidenceId = "unknown-evidence";
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "code tab has no recognized evidence linkage",
      }),
    );
    expect(
      mutateKernel((kernel) => {
        kernel.explanatory = true;
      }),
    ).toContainEqual(
      expect.objectContaining({
        message: "promoted algorithm kernel must be marked real",
      }),
    );
  });

  it("requires complete staged evidence references mechanically", () => {
    const mutations: Array<{
      field: string;
      value: unknown;
      message: string;
    }> = [
      {
        field: "commit",
        value: undefined,
        message: "claim has no exact commit",
      },
      { field: "tree", value: undefined, message: "claim has no exact tree" },
      { field: "commands", value: [], message: "claim has no exact command" },
      { field: "sourcePaths", value: [], message: "claim has no source path" },
      {
        field: "evidenceId",
        value: "unknown-staged-record",
        message: "staged reference has no recognized evidence id",
      },
      {
        field: "claim",
        value: "gpu-observed",
        message: "staged reference claim label does not match its claim",
      },
      {
        field: "authority",
        value: "",
        message: "staged reference has no recognized authority label",
      },
    ];

    for (const mutation of mutations) {
      const changed = structuredClone(curriculum);
      const lesson = changed
        .flatMap((module) => module.lessons)
        .find((entry) => entry.id === "evidence-archive");
      const reference = lesson?.claims.find(
        (claim) => claim.label === "Staged tiled source bridge",
      )?.reference;
      expect(reference?.scope).toBe("staged-progress");
      const mutable = reference as unknown as Record<string, unknown>;
      if (mutation.value === undefined) {
        delete mutable[mutation.field];
      } else {
        mutable[mutation.field] = mutation.value;
      }
      expect(validateCurriculum(changed)).toContainEqual(
        expect.objectContaining({ message: mutation.message }),
      );
    }
  });

  it("records every staged tiled statement with exact limited authority", () => {
    const lesson = lessons.find((entry) => entry.id === "evidence-archive");
    const staged = lesson?.claims.filter(
      (claim) => claim.reference?.scope === "staged-progress",
    );
    expect(
      staged?.map((claim) => ({
        label: claim.label,
        kind: claim.kind,
        evidenceId:
          claim.reference?.scope === "staged-progress"
            ? claim.reference.evidenceId
            : undefined,
        commit: claim.reference?.commit,
        tree: claim.reference?.tree,
        authority:
          claim.reference?.scope === "staged-progress"
            ? claim.reference.authority
            : undefined,
      })),
    ).toEqual([
      {
        label: "Staged tiled source bridge",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-source-bridge-v1",
        commit: "fb75e19a73ec0a9acebb203bd9821190b0592c82",
        tree: "0a57b2b6d14121da92dbbb2d7c4f9d8b4df4ce63",
        authority: "source-admission-only",
      },
      {
        label: "Staged Cargo metadata normalization",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-cargo-metadata-v1",
        commit: "b904f5b648c7eb249d32d73db427abe72970315a",
        tree: "a5b07af23c9fcf5f04ddcad1c18a6318469e6e06",
        authority: "source-admission-only",
      },
      {
        label: "Staged Cargo root normalization",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-cargo-root-v1",
        commit: "51bd129c31b08b636545f12229f34aaa431321f2",
        tree: "8be992dee9f145c73f61bb05f0066656298a7c75",
        authority: "source-admission-only",
      },
      {
        label: "Observed direct-global tiled GEMM tile",
        kind: "gpu-observed",
        evidenceId: "tiled-hardware-harness-v1",
        commit: "233b88f9722a0072d9a5fe3b9ccdc3dbaefdc1dd",
        tree: "03129e8e3badf707007a128a3d3a98e218b0df36",
        authority: "harness-only",
      },
      {
        label: "Staged tiled structural admission",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-structural-admission-v1",
        commit: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
        tree: "1396be8ff4947a16ddc6aabae7390cc376992c61",
        authority: "structural-admission-only",
      },
      {
        label: "Bounded LDS Kernel IR",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-kernel-ir-v1",
        commit: "4c79c58de1da19d9b7a22cba906f301e347c8f7c",
        tree: "164414ee43e9df53d02f3d3b53e63c7b7ff36a52",
        authority: "kernel-ir-admission-only",
      },
      {
        label: "Fixed LDS source model",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-verus-v1",
        commit: "97373b781ac3643b1de61b4572894f7028b565b0",
        tree: "f9b874cf641887a5295d58a2313ed9d7e5cb42cf",
        authority: "source-model-only",
      },
      {
        label: "Fail-closed attributed LDS source",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-attributed-source-v1",
        commit: "ee76cedcdc4126c69bc486a5ac12900c1c5485b1",
        tree: "cd0cec133dd5689c71c5d2795e125ea43cff4db3",
        authority: "source-shape-only",
      },
      {
        label: "Upstream LLVM/LLD LDS machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-machine-inspection-v1",
        commit: "50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2",
        tree: "4bc6c5a4f46a0c7cb86cbd5542ff20f170b3f940",
        authority: "machine-inspection-only",
      },
      {
        label: "Bounded Slice 2 K-phase model",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-kphase-model-v2",
        commit: "aba53376b4825c730ca9e9685e274e0c334e0e32",
        tree: "e05bf2ac73f31f2fda39762520d855031ddf7419",
        authority: "source-model-only",
      },
      {
        label: "Observed LDS Slice 1 execution",
        kind: "gpu-observed",
        evidenceId: "tiled-lds-hardware-observation-v1",
        commit: "79ad2298619baa4138b5edbf55e0d8044295bec2",
        tree: "2b7766ec5f003b1316853376a802ada4a9999d9b",
        authority: "harness-only",
      },
      {
        label: "Upstream LLVM/LLD K32 machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-k32-machine-inspection-v2",
        commit: "b94bd7d78604a6b7fe12f571f84cfc5f5b29eaba",
        tree: "70867ea4d2b360773480ded0a41f68b74722b209",
        authority: "machine-inspection-only",
      },
      {
        label: "Generated typed WG64 launch contract",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-wg64-contract-v1",
        commit: "280995762fce8a97f72fc2acb53c0d7effd2109f",
        tree: "782bcc60e1c5e12c32c0dabfd0975304a020d0bf",
        authority: "source-admission-only",
      },
      {
        label: "Bounded Slice 3 grid and stride model",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-grid-stride-model-v3",
        commit: "5bc57587b458da6a77a0f1063e4697f846cc0946",
        tree: "165566f92afaf03eed7cea8ae2b927aca53e618c",
        authority: "source-model-only",
      },
      {
        label: "Authenticated attributed LDS source correspondence",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-source-ir-correspondence-v1",
        commit: "dc31f23eb2decaa91eb2f9d72ae4c70e94766564",
        tree: "092103d6daa2d8ebcd513627b7be9a3b182bfa60",
        authority: "source-admission-only",
      },
      {
        label: "Exact Slice 3 upstream LLVM/LLD machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-grid-machine-inspection-v3",
        commit: "f38fe82ca574eff0eb273d5a793f04b0df3e00e1",
        tree: "0375b991b20dcdb934797b039120f4ac279ee8cd",
        authority: "machine-inspection-only",
      },
      {
        label: "Exact tail-safe Slice 4 Kernel IR",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-edge-kernel-ir-v4",
        commit: "f24063534fd9c69d8c595608c75213db0570aa5e",
        tree: "8fd840624c50c25c74beb3371625a53a51956831",
        authority: "kernel-ir-admission-only",
      },
      {
        label: "Exact Slice 4 upstream LLVM/LLD machine shape",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-edge-machine-inspection-v4",
        commit: "35575cc32cde9744078a3026b14c5e0e0066157f",
        tree: "f7f43e9d92f98144daf5f003734fc2d9b77130d9",
        authority: "machine-inspection-only",
      },
      {
        label: "Identity-bound Slice 1 source/model correspondence",
        kind: "source-model-verified",
        evidenceId: "tiled-lds-source-model-correspondence-v1",
        commit: "5a45239aeeda3ca64cf16beb7fb1d3589e649bfe",
        tree: "1b8e2d3589082114a0bafe231d79262e6f8b22a1",
        authority: "source-model-only",
      },
      {
        label: "Canonical bounded matrix Kernel IR wire",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-matrix-wire-v5",
        commit: "1429ed6ae46e14317bb5b927c8d9cb1f66f268c7",
        tree: "0a2b79650673b2b9b42965307f2ac40d05324afe",
        authority: "wire-format-only",
      },
      {
        label: "Source-bound compiler descriptor and inert handoff",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-inert-worker-handoff-v1",
        commit: "7337a2b87dffa0845d092c13399b012f884de90b",
        tree: "6dd4d922e22cf488157cc0fece17edf64df98b7c",
        authority: "inert-worker-handoff-only",
      },
      {
        label: "Sealed exact Slice 1 compiler import",
        kind: "compiler-hsaco-observed",
        evidenceId: "tiled-lds-sealed-profile-registry-v1",
        commit: "89ebe69bb3daf8262a485463c5fdf04cf095346f",
        tree: "c2604487ec76f337d7ada2c0319fffd02b3ce8c9",
        authority: "sealed-profile-registry-only",
      },
    ]);
    expect(staged?.every((claim) => claim.reference?.commands.length)).toBe(true);
    expect(staged?.every((claim) => claim.reference?.sourcePaths.length)).toBe(true);
    expect(staged?.filter((claim) => claim.kind === "gpu-observed")).toHaveLength(2);
  });

  it("requires whole Cargo test suites and referenced integration targets", () => {
    expect(validateStagedEvidenceCatalog()).toEqual([]);
    const sealedRegistry = stagedEvidenceRecord(
      "tiled-lds-sealed-profile-registry-v1",
    );
    expect(sealedRegistry.commands).toEqual([
      "cargo test --locked -p fe2o3-hsaco-finalize --all-targets",
      "cargo test --locked -p fe2o3-hsaco-finalize --test lds_gemm_profile_registry",
      "cargo clippy --locked -p fe2o3-hsaco-finalize --all-targets --no-deps -- -D warnings",
    ]);
    expect(stagedEvidenceDetail([sealedRegistry.id])).toContain(
      "Only the exact M16 N16 K16 Slice 1 manifest is enabled",
    );
    expect(stagedEvidenceDetail([sealedRegistry.id])).toContain(
      "grants no finalizer, Worker V2, LLVM linker, publication, load, launch, hardware, numerical, or Verus proof authority",
    );
    expect(
      stagedEvidenceRecord("tiled-structural-admission-v1").commands,
    ).toEqual([
      "cargo test -p fe2o3-kernel-descriptor --test tiled_gemm_v1",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_admission",
      "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_finalization",
    ]);
    const hardwareCommand = stagedEvidenceRecord(
      "tiled-hardware-harness-v1",
    ).commands[0];
    const parsedHardwareCommand = parseExactCargoTestCommand(hardwareCommand);
    expect(hardwareCommand).toContain("cargo test --locked");
    expect(parsedHardwareCommand).toMatchObject({
      locked: true,
      packageName: "fe2o3-hsa-runtime",
      mode: "test",
      targetName: "tiled_gemm_v1_hardware",
      testName: "gfx942_tiled_gemm_v1_one_tile_raw_hardware_evidence",
      features: "hardware-test-hooks",
      environment: {
        FE2O3_RUN_GFX942_TILED_GEMM_V1_HARDWARE: "1",
        FE2O3_GFX942_TILED_GEMM_V1_HSACO:
          "/home/harsh/fe2o3-tiled-gemm-f494.hsaco",
        FE2O3_GFX942_TILED_GEMM_V1_SHA256:
          "681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66",
        FE2O3_GFX942_TILED_GEMM_V1_KERNEL_SYMBOL: "tiled_gemm_v1",
        FE2O3_LLVM_OBJDUMP: "/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump",
        FE2O3_LLVM_OBJDUMP_SHA256:
          "e5bf27bb6ba178b4de94ac0d5da760b628672cd00d2ffeb40a4372fa6ad25140",
      },
    });
    const ldsHardwareCommand = stagedEvidenceRecord(
      "tiled-lds-hardware-observation-v1",
    ).commands[0];
    expect(parseExactCargoTestCommand(ldsHardwareCommand)).toMatchObject({
      locked: true,
      packageName: "fe2o3-hsa-runtime",
      mode: "test",
      targetName: "tiled_gemm_lds_v1_hardware",
      testName: "gfx942_tiled_gemm_lds_v1_observational_hardware_evidence",
      features: "hardware-test-hooks",
      environment: {
        FE2O3_RUN_GFX942_TILED_GEMM_LDS_V1_HARDWARE: "1",
        HSA_XNACK: "0",
        HIP_VISIBLE_DEVICES: "0",
        ROCR_VISIBLE_DEVICES: "0",
        FE2O3_LLC: "/absolute/canonical/llc",
        FE2O3_LLC_SHA256: "<sha256>",
        FE2O3_LLD: "/absolute/canonical/ld.lld",
        FE2O3_LLD_SHA256: "<sha256>",
        FE2O3_LLVM_OBJDUMP: "/absolute/canonical/llvm-objdump",
        FE2O3_LLVM_OBJDUMP_SHA256: "<sha256>",
      },
    });
    const parsedVerusCommand = parseExactCargoTestCommand(
      stagedEvidenceRecord("tiled-lds-verus-v1").commands[0],
    );
    expect(parsedVerusCommand).toMatchObject({
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "test",
      targetName: "lds_proof_verus",
      environment: { VERUS: "/absolute/path/to/pinned/verus" },
    });
    expect(
      parsedVerusCommand
        ? expectedCargoTestSourcePath(parsedVerusCommand)
        : undefined,
    ).toBe("examples/tiled_gemm_v1/tests/lds_proof_verus.rs");
    const sourceModelCommands = stagedEvidenceRecord(
      "tiled-lds-source-model-correspondence-v1",
    ).commands;
    expect(parseExactCargoTestCommand(sourceModelCommands[0])).toMatchObject({
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "test",
      release: false,
      targetName: "lds_source_refinement",
    });
    expect(parseExactCargoTestCommand(sourceModelCommands[1])).toMatchObject({
      environment: { VERUS: "/home/harsh/tools/verus-0.2026.08.02/verus" },
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "package",
      release: false,
    });
    expect(parseExactCargoTestCommand(sourceModelCommands[2])).toMatchObject({
      environment: { VERUS: "/home/harsh/tools/verus-0.2026.08.02/verus" },
      locked: true,
      manifestPath: "examples/tiled_gemm_v1/Cargo.toml",
      mode: "package",
      release: true,
    });
    expect(isExactCargoClippyCommand(sourceModelCommands[3])).toBe(true);
    const machineCommand = stagedEvidenceRecord(
      "tiled-lds-machine-inspection-v1",
    ).commands[1];
    expect(parseExactCargoTestCommand(machineCommand)).toMatchObject({
      locked: true,
      packageName: "fe2o3-hsaco-finalize",
      targetName: "tiled_gemm_lds_v1_machine",
      testName:
        "upstream_llvm_lld_final_artifact_has_the_exact_slice_1_machine_shape",
      environment: {
        FE2O3_LLC: "/opt/rocm-7.2.4/lib/llvm/bin/llc",
        FE2O3_LLD: "/opt/rocm-7.2.4/lib/llvm/bin/ld.lld",
        FE2O3_LLVM_OBJDUMP: "/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump",
      },
    });
    const k32Commands = stagedEvidenceRecord(
      "tiled-lds-k32-machine-inspection-v2",
    ).commands;
    expect(parseExactCargoTestCommand(k32Commands[0])).toMatchObject({
      locked: true,
      packageName: "dialect-amdgcn",
      mode: "package",
    });
    expect(isExactCargoClippyCommand(k32Commands[1])).toBe(true);
    expect(parseExactCargoTestCommand(k32Commands[2])).toMatchObject({
      locked: true,
      packageName: "dialect-amdgcn",
      mode: "test",
      targetName: "tiled_gemm_lds_k32_v2",
      testName:
        "upstream_llvm_lld_final_artifact_has_the_exact_k32_machine_shape",
      environment: {
        FE2O3_OPT: "/opt/rocm-7.2.4/lib/llvm/bin/opt",
        FE2O3_LLC: "/opt/rocm-7.2.4/lib/llvm/bin/llc",
        FE2O3_LLD: "/opt/rocm-7.2.4/lib/llvm/bin/ld.lld",
        FE2O3_LLVM_OBJDUMP:
          "/opt/rocm-7.2.4/lib/llvm/bin/llvm-objdump",
        FE2O3_LLVM_READOBJ:
          "/opt/rocm-7.2.4/lib/llvm/bin/llvm-readobj",
      },
    });
    for (const id of stagedEvidenceOrder) {
      const record = stagedEvidenceRecord(id);
      for (const command of record.commands) {
        const parsed = parseExactCargoTestCommand(command);
        expect(parsed ?? isExactCargoClippyCommand(command)).toBeTruthy();
        if (!parsed) continue;
        const targetPath = parsed
          ? expectedCargoTestSourcePath(parsed)
          : undefined;
        if (targetPath) expect(record.sourcePaths).toContain(targetPath);
      }
    }

    expect(
      parseExactCargoTestCommand(
        "cargo test -p fe2o3-kernel-descriptor tiled_gemm_v1",
      ),
    ).toBeUndefined();
    expect(
      parseExactCargoTestCommand(
        "cargo test -p fe2o3-hsaco-finalize --test worker_v2_hsaco_admission tiled",
      ),
    ).toBeUndefined();
    expect(
      parseExactCargoTestCommand(
        "cargo test -p rustc-codegen-fe2o3 --lib collected_tiled_gemm_v1",
      ),
    ).toBeUndefined();
    expect(
      isExactCargoClippyCommand(
        "cargo clippy -p dialect-amdgcn --all-targets --all-features",
      ),
    ).toBe(false);
  });

  it("rejects no-hash hardware authority moved into lesson narrative", () => {
    const unsupportedObservation =
      "The hardware run establishes protected GPU execution authority.";
    expect(unsupportedObservation).not.toMatch(/[0-9a-f]{40}/u);
    const changed = structuredClone(curriculum);
    const section = changed
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "gemm-proof-plan")
      ?.sections.find((candidate) => candidate.kind === "staged-evidence");
    const mutable = section as unknown as Record<string, unknown>;
    mutable.kind = "narrative";
    delete mutable.evidenceIds;
    mutable.narrativeId = "gemm-tiling/public-layout-proof";
    mutable.blocks = [
      {
        type: "paragraph",
        text: unsupportedObservation,
      },
    ];
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "narrative section accepts only one canonical narrative ID",
      }),
    );
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "lesson must contain exactly one canonical staged evidence section",
      }),
    );
  });

  it("rejects renamed and retyped staged checkpoints without evidence IDs", () => {
    const unsupportedAuthority =
      "The emitted machine code carries execution authority on the accelerator.";
    expect(unsupportedAuthority).not.toMatch(/[0-9a-f]{40}/u);
    const changed = structuredClone(developmentCheckpoints);
    const checkpoint = changed.find(
      (candidate) => candidate.id === "tiled-gemm-source-bridge",
    );
    const mutable = checkpoint as unknown as Record<string, unknown>;
    mutable.name = "Ordinary implementation note";
    mutable.kind = "narrative";
    delete mutable.stagedEvidenceIds;
    mutable.detail = unsupportedAuthority;
    expect(validateProgress(changed)).toContain(
      "tiled-gemm-source-bridge must retain canonical kind staged-evidence",
    );
    expect(validateProgress(changed)).toContain(
      "tiled-gemm-source-bridge fields do not match its canonical kind",
    );
    expect(validateProgress(changed)).toContain(
      "tiled-gemm-source-bridge must contain its complete canonical staged evidence IDs",
    );
    const rendered = developmentCheckpointDetail(checkpoint);
    expect(rendered).toBe(SAFE_PROGRESS_DETAIL);
    expect(rendered).not.toContain(unsupportedAuthority);
  });

  it("rejects progress authority prose stored on a checkpoint", () => {
    const unsupportedAuthority =
      "This checkpoint proves machine-code authority without further evidence.";
    const changed = structuredClone(developmentCheckpoints);
    const checkpoint = changed.find(
      (candidate) => candidate.id === "scalar-gemm-v1",
    );
    const mutable = checkpoint as unknown as Record<string, unknown>;
    mutable.detail = unsupportedAuthority;
    delete mutable.narrativeId;

    expect(validateProgress(changed)).toContain(
      "scalar-gemm-v1 fields do not match its canonical kind",
    );
    expect(validateProgress(changed)).toContain(
      "scalar-gemm-v1 does not bind its canonical progress narrative ID",
    );
    const rendered = developmentCheckpointDetail(checkpoint);
    expect(rendered).toBe(SAFE_PROGRESS_DETAIL);
    expect(rendered).not.toContain(unsupportedAuthority);
  });

  it("rejects renamed stable checkpoint IDs independently of display labels", () => {
    const changed = structuredClone(developmentCheckpoints);
    const checkpoint = changed.find(
      (candidate) => candidate.id === "tiled-gemm-source-bridge",
    );
    const mutable = checkpoint as unknown as Record<string, unknown>;
    mutable.id = "renamed-source-bridge";
    mutable.name = "Ordinary implementation note";
    expect(validateProgress(changed)).toContain(
      "development checkpoints do not contain the exact canonical ID order",
    );
    expect(validateProgress(changed)).toContain(
      "unknown development checkpoint id renamed-source-bridge",
    );
  });

  it("rejects unknown and prototype narrative IDs", () => {
    for (const invalidId of ["unknown-narrative", "__proto__"]) {
      const changed = structuredClone(curriculum);
      const section = changed[0].lessons[0].sections.find(
        (candidate) => candidate.kind === "narrative",
      );
      const mutable = section as unknown as Record<string, unknown>;
      mutable.narrativeId = invalidId;
      expect(validateCurriculum(changed)).toContainEqual(
        expect.objectContaining({ message: `unknown narrative id ${invalidId}` }),
      );
    }
  });

  it("rejects canonical narrative registry drift and unreviewed additions", () => {
    expect(validateNarrativeRegistry()).toEqual([]);
    expect(narrativeFingerprint("abc")).toBe(
      "6cc43f858fbb763301637b5af970e2a46b46f461f27e5a0f41e009c59b827b25",
    );
    const unsupportedAuthority =
      "The hardware result has unconditional execution authority.";
    expect(unsupportedAuthority).not.toMatch(/[0-9a-f]{40}/u);
    const changed = narrativeRegistrySnapshot();
    changed["gemm-tiling/public-layout-proof"].blocks[0] = {
      type: "paragraph",
      text: unsupportedAuthority,
    };
    expect(validateNarrativeRegistry(changed)).toContain(
      "gemm-tiling/public-layout-proof: canonical narrative text drift",
    );
    changed["unreviewed/new-claim"] = {
      sectionId: "new-claim",
      title: "Unreviewed claim",
      blocks: [],
    };
    expect(validateNarrativeRegistry(changed)).toContain(
      "registry does not contain the exact canonical narrative ID order",
    );
  });

  it("keeps frozen registries authoritative after detached mutations", () => {
    const unsupportedAuthority =
      "Mutated registry text grants unconditional machine authority.";
    expect(validateNarrativeRegistry()).toEqual([]);
    expect(validateProgressNarrativeRegistry()).toEqual([]);
    expect(validateStagedEvidenceCatalog()).toEqual([]);

    const narrative = narrativeEntry("first-fill/kernel-shape");
    const originalNarrativeText =
      narrative.blocks[0].type === "paragraph"
        ? narrative.blocks[0].text
        : "";
    expect(Object.isFrozen(narrative.blocks[0])).toBe(true);
    expect(
      Reflect.set(
        narrative.blocks[0] as object,
        "text",
        unsupportedAuthority,
      ),
    ).toBe(false);

    const narrativeSnapshot = narrativeRegistrySnapshot();
    const snapshotBlock =
      narrativeSnapshot["first-fill/kernel-shape"].blocks[0];
    if (snapshotBlock.type === "paragraph") {
      snapshotBlock.text = unsupportedAuthority;
    }
    expect(validateNarrativeRegistry(narrativeSnapshot)).toContain(
      "first-fill/kernel-shape: canonical narrative text drift",
    );
    expect(narrativeEntry("first-fill/kernel-shape").blocks[0]).toMatchObject({
      text: originalNarrativeText,
    });

    const progressSnapshotCandidate = progressNarrativeRegistrySnapshot();
    progressSnapshotCandidate["progress/scalar-gemm-v1"] = unsupportedAuthority;
    expect(validateProgressNarrativeRegistry(progressSnapshotCandidate)).toContain(
      "progress/scalar-gemm-v1: canonical progress narrative text drift",
    );
    const scalarCheckpoint = developmentCheckpoints.find(
      (candidate) => candidate.id === "scalar-gemm-v1",
    );
    expect(developmentCheckpointDetail(scalarCheckpoint)).not.toContain(
      unsupportedAuthority,
    );

    const staged = stagedEvidenceRecord("tiled-source-bridge-v1");
    expect(Object.isFrozen(staged.assertions[0])).toBe(true);
    expect(
      Reflect.set(
        staged.assertions[0] as object,
        "text",
        unsupportedAuthority,
      ),
    ).toBe(false);
    expect(stagedEvidenceDetail(["tiled-source-bridge-v1"])).not.toContain(
      unsupportedAuthority,
    );
  });

  it("rejects unknown staged evidence IDs", () => {
    const changed = structuredClone(curriculum);
    const section = changed
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "gemm-proof-plan")
      ?.sections.find((candidate) => candidate.kind === "staged-evidence");
    const mutable = section as unknown as Record<string, unknown>;
    mutable.evidenceIds = ["unknown-staged-record"];
    expect(validateCurriculum(changed)).toContainEqual(
      expect.objectContaining({
        message: "unknown staged evidence id unknown-staged-record",
      }),
    );

    const changedProgress = structuredClone(developmentCheckpoints);
    const checkpoint = changedProgress.find(
      (candidate) => candidate.id === "tiled-gemm-source-bridge",
    );
    const mutableCheckpoint = checkpoint as unknown as Record<string, unknown>;
    mutableCheckpoint.stagedEvidenceIds = ["unknown-staged-record"];
    expect(validateProgress(changedProgress)).toContain(
      "tiled-gemm-source-bridge has unknown staged evidence id unknown-staged-record",
    );

    mutableCheckpoint.stagedEvidenceIds = ["__proto__"];
    expect(validateProgress(changedProgress)).toContain(
      "tiled-gemm-source-bridge has unknown staged evidence id __proto__",
    );
  });

  it("rejects staged prose that mismatches its evidence record", () => {
    const changedClaims = structuredClone(curriculum);
    const claim = changedClaims
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === "evidence-archive")
      ?.claims.find(
        (candidate) =>
          candidate.reference?.scope === "staged-progress" &&
          candidate.reference.evidenceId === "tiled-source-bridge-v1",
      );
    if (claim) claim.detail += " Unsupported extra staged assertion.";
    expect(validateCurriculum(changedClaims)).toContainEqual(
      expect.objectContaining({
        message: "staged claim is not derived from its atomic evidence record",
      }),
    );
  });

  it("scopes the acb3 pin to lesson evidence, not staged progress", () => {
    const lesson = lessons.find((entry) => entry.id === "read-the-evidence");
    const baseline = lesson?.claims.find(
      (claim) => claim.label === "Audited lesson baseline",
    );
    expect(baseline?.detail).toContain("Lesson evidence claims are pinned");
    expect(baseline?.detail).toContain(
      "separately gated implementation-progress snapshot",
    );
    expect(baseline?.reference).toMatchObject({
      scope: "lesson-evidence",
      commit: FE2O3_PIN.commit,
      tree: FE2O3_PIN.tree,
    });
    expect(JSON.stringify(lessons)).not.toMatch(
      /guarded hardware (?:run|result)/iu,
    );

    const compilerRefactor = JSON.stringify(
      narrativeEntry("read-the-evidence/compiler-refactor"),
    );
    expect(compilerRefactor).toContain(
      "2f7c4fd1dfef7b9056caab0880700e3da7eeef03",
    );
    expect(compilerRefactor).toContain(
      "96d4275e7efde8ef594ef34b1c28f95d3000c8dc",
    );
    expect(compilerRefactor).toContain(
      "opaque bridge preserves canonical KIR bytes unchanged",
    );
    expect(compilerRefactor).toContain(
      "not a second KIR serialization, semantic lowering",
    );
    expect(compilerRefactor).toContain("context-bound services");
    expect(compilerRefactor).toContain("terminal typed errors");
    expect(compilerRefactor).toContain("no fallback and no result after failure");
    expect(compilerRefactor).toContain(
      "2610651306ea3ba670f68d5d8b1e1159bcd521ed",
    );
    expect(compilerRefactor).toContain("non-executing");
    expect(compilerRefactor).toContain("issue #140");
    expect(compilerRefactor).toContain("does not complete issue #134, #135, or #140");
    expect(compilerRefactor).toContain(
      "make any explanatory lesson kernel functional",
    );
    expect(compilerRefactor).toContain(
      "pinned upstream LLVM target-machine APIs plus in-process LLD",
    );
    expect(compilerRefactor).toContain("No COMGR path is introduced");
    expect(compilerRefactor).toContain("Checked gfx942 device identity");
    expect(compilerRefactor).toContain("does not provide production queues");
    expect(compilerRefactor).toContain("does not detect GPU reset");
  });

  it("makes every glossary item searchable and navigable", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    expect(glossary.length).toBeGreaterThan(50);
    for (const entry of glossary) {
      expect(entry.term.trim()).not.toBe("");
      expect(entry.definition.length).toBeGreaterThan(20);
      expect(lessonIds.has(entry.lessonId)).toBe(true);
    }
  });

  it("keeps advanced runnable claims restricted while permitting bounded Module 9 and 10 GPU observations", () => {
    for (const lesson of lessons.filter((entry) => entry.module >= 4)) {
      const runnable = lesson.claims.some(
        (claim) => claim.kind === "runnable-now",
      );
      expect(runnable).toBe(false);
      if (lesson.module === 9) {
        expect(lesson.claims.map((claim) => claim.kind)).toEqual([
          "gpu-observed",
        ]);
      }
      if (lesson.module === 10) {
        expect(lesson.claims.map((claim) => claim.kind)).toEqual([
          "gpu-observed",
        ]);
      }
      expect(lesson.tabs.find((tab) => tab.kind === "kernel")?.explanatory).toBe(
        [
          "gemm-tiling",
          "gemm-proof-plan",
          "softmax-invariant",
          "flash-attention",
          "moe-routing",
          "moe-expert-compute",
          "gfx950-fp4-gemm",
          "gfx950-fp8-gemm",
          "gfx950-fp4-attention",
          "gfx950-fp8-attention",
          "gfx950-advanced-moe",
          "gfx950-kda-gdn-linear-attention",
          "gfx950-indexed-sparse-attention",
          "gfx950-deepseek-sparse-attention",
          "gfx950-compressed-hybrid-attention",
          "gfx950-attnres-gr-mhc",
          "gfx950-speculative-mtp-verification",
          "gfx950-ngram-embedding-gather",
          "gfx950-muon-optimizer",
          "gfx950-gpt-oss-120b-megakernel",
        ].includes(lesson.id)
          ? false
          : true,
      );
    }
  });
});

describe("implementation progress integrity", () => {
  it("gates the published compiler baseline on both public main refs", () => {
    expect(validateProgress()).toEqual([]);
    expect(developmentCheckpoints.map((checkpoint) => checkpoint.id)).toEqual(
      developmentCheckpointIds,
    );
    expect(progressSnapshot.auditedCommit).toBe(FE2O3_PIN.commit);
    expect(progressSnapshot).toMatchObject({
      reviewedOn: "2026-08-28",
      lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
      lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
      eventualPublicCommit: "ecf7b17f819021708d9c59ebe39a4daf9eb2562c",
      eventualPublicTree: "2156423b9350d66cfaa8207133768e323111b507",
      publicationGate: {
        state: "deployment-gated-contained-object",
        requiredCommit: "ecf7b17f819021708d9c59ebe39a4daf9eb2562c",
        requiredTree: "2156423b9350d66cfaa8207133768e323111b507",
        requiredRefRelationship: "contains-required-commit",
        requiredRefs: [
          "harsh-nod/fe2o3@refs/heads/main",
          "powderluv/fe2o3@refs/heads/main",
        ],
      },
    });
    expect(progressSnapshot.publicationGate.requirement).toContain(
      "contain the exact required commit",
    );
    expect(developmentCheckpoints[0]).toMatchObject({
      name: "Published implementation snapshot (publication gated)",
      commit: progressSnapshot.eventualPublicCommit,
      state: "public",
    });
    expect(developmentCheckpointDetail(developmentCheckpoints[0])).toContain(
      "published compiler baseline is publication-gated",
    );
    const compilerRefactor = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "compiler-refactor-infrastructure",
    );
    expect(compilerRefactor).toMatchObject({
      name: "Pliron ownership and device identity at 2f7c4fd1d",
      commit: "2f7c4fd1dfef7b9056caab0880700e3da7eeef03",
      state: "public",
      narrativeId: "progress/compiler-refactor-infrastructure",
    });
    const compilerRefactorDetail = developmentCheckpointDetail(compilerRefactor);
    expect(compilerRefactorDetail).toContain(
      "Upstream Pliron v0.17.0 commit 2610651306ea3ba670f68d5d8b1e1159bcd521ed",
    );
    expect(compilerRefactorDetail).toContain("PassPlan is bounded and non-executing");
    expect(compilerRefactorDetail).toContain("issue #140");
    expect(compilerRefactorDetail).toContain("Issues #134, #135, and #140 remain open");
    expect(compilerRefactorDetail).toContain("make an explanatory kernel functional");
    expect(compilerRefactorDetail).toContain(
      "opaque KIR bridge preserves canonical V1-V5 bytes",
    );
    expect(compilerRefactorDetail).toContain(
      "not a second KIR serialization or semantic lowering",
    );
    expect(compilerRefactorDetail).toContain("detached context-bound services");
    expect(compilerRefactorDetail).toContain("typed terminal errors");
    expect(compilerRefactorDetail).toContain(
      "no fallback and no result after failure",
    );
    expect(compilerRefactorDetail).toContain(
      "pinned upstream LLVM target-machine APIs plus in-process LLD",
    );
    expect(compilerRefactorDetail).toContain("no COMGR or pliron-llvm path");
    expect(compilerRefactorDetail).toContain("Pure-Rust KFD 1.18 encoding");
    expect(compilerRefactorDetail).toContain("checked MI300X identity");
    expect(compilerRefactorDetail).toContain("does not detect GPU reset");
    const currentNarrative = JSON.stringify(
      narrativeEntry("read-the-evidence/scalar-gemm-checkpoint"),
    );
    expect(currentNarrative).toContain(progressSnapshot.eventualPublicCommit);
    expect(currentNarrative).toContain(progressSnapshot.eventualPublicTree);
    expect(currentNarrative).toContain("Both public main refs must contain");
    expect(currentNarrative).toContain(
      "PLIRON proves and reconciles non-vacuous total coverage",
    );
    expect(currentNarrative).toContain("complete live PLIRON graph");
    expect(
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.id === "last-audited-public-baseline",
      ),
    ).toMatchObject({
      name: "Historical audited public baseline",
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
  });

  it("records the four accepted commits in the current publication checkpoint", () => {
    const worker = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "worker-v2-ack-harness-isolation",
    );
    expect(worker).toMatchObject({
      commit: "c703eaa271040b7c297e0d3b9ea8cc9fa470f327",
      state: "public",
    });
    expect(checkpointDetail(worker)).toContain("tree c75b6cb9d70c6984bb375d09f095580eb2f7581a");
    expect(checkpointDetail(worker)).toContain("test-harness determinism repair only");

    const source = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "row-softmax-ordinary-source",
    );
    expect(source).toMatchObject({
      commit: "f4dcafb8b95345a5203a7f2c9886f9600345405f",
      state: "public",
    });
    expect(checkpointDetail(source)).toContain("Complete syn AST structural admission");
    expect(checkpointDetail(source)).toContain("not Rust semantic refinement");
    expect(checkpointDetail(source)).toContain("The row remains Partial");

    const broker = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "broker-durable-prepared-session",
    );
    expect(broker).toMatchObject({
      commit: "7139ccfd01e0ab8b0fc521613ac4356134d2e0c5",
      state: "public",
    });
    const brokerDetail = checkpointDetail(broker);
    expect(brokerDetail).toContain("AUTHORITY=none");
    expect(brokerDetail).toContain("hostile same-UID resistance");
    expect(brokerDetail).toContain("multiwriter coordination");
    expect(brokerDetail).toContain("cross-system atomicity");
    expect(brokerDetail).toContain("GPU authority");

    const ci = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "generic-ci-sharding",
    );
    expect(ci).toMatchObject({
      commit: "5a3f057b915b0cb21c3a0ac54094fd7e5e5ce6a4",
      state: "public",
    });
    expect(checkpointDetail(ci)).toContain("eight explicit rustc-codegen shards");
    expect(checkpointDetail(ci)).toContain("19 current Cargo integration-test targets");
    expect(checkpointDetail(ci)).toContain("Locked Cargo metadata is authoritative");
    expect(checkpointDetail(ci)).toContain(
      "the complete powderluv/fe2o3 GitHub-hosted generic run",
    );

    for (const id of ["softmax", "flash-attention", "moe-routing", "moe-experts"]) {
      expect(kernelProgress.find((kernel) => kernel.id === id)).toMatchObject({
        run: "partial",
        verify: "partial",
        evidence: "partial",
      });
    }
  });

  it("records bounded W0 acceptance and inert Broker V4 separately", () => {
    const w0 = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "w0-host-link-closure-v1",
    );
    expect(w0).toMatchObject({
      name: "Accepted W0/G1 static host-link boundary",
      commit: "9f40bbff39156f8b5f05868377ee12a2c4f74207",
      state: "public",
      narrativeId: "progress/w0-host-link-closure-v1",
    });
    const w0Detail = checkpointDetail(w0);
    expect(w0Detail).toContain("tree fd05530d3728aa928090b8e7beb372eaaf22b477");
    expect(w0Detail).toContain("85,597,472-byte tool");
    expect(w0Detail).toContain(
      "7c1a7429e93896393eb743ed54ead78ec6d492e3ed887183e67737b3872d7bf9",
    );
    expect(w0Detail).toContain("measured/no-authority");
    expect(w0Detail).toContain("no protected publication");
    expect(w0Detail).toContain("neither memory safety nor race freedom");
    expect(w0Detail).toContain("no source-to-machine or Verus-to-machine refinement");

    const broker = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "broker-v4-inert-foundation",
    );
    expect(broker).toMatchObject({
      name: "Inert Broker V4 protocol foundation",
      commit: "66393d3ca7a6805633ed94e12c707a6d22bdf1ad",
      state: "public",
      narrativeId: "progress/broker-v4-inert-foundation",
    });
    const brokerDetail = checkpointDetail(broker);
    expect(brokerDetail).toContain("tree f39f9c76d964bafe9e8a12a0b48099766490b366");
    expect(brokerDetail).toContain("AUTHORITY=none");
    expect(brokerDetail).toContain("No registry implementation");
    expect(brokerDetail).toContain("broker-owned durable registry");
    expect(brokerDetail).toContain("unforgeable move-only capability");
    expect(brokerDetail).toContain("persist replay exclusion across restart");

    for (const id of ["softmax", "flash-attention", "moe-routing", "moe-experts"]) {
      expect(kernelProgress.find((kernel) => kernel.id === id)).toMatchObject({
        run: "partial",
        verify: "partial",
        evidence: "partial",
      });
    }
  });

  it("records bounded Wave64 source-model-to-KIR correspondence", () => {
    const wave64 = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "gfx942-wave64-lds-reduction",
    );
    expect(wave64).toMatchObject({
      name: "gfx942 Wave64 bounded source-model/KIR correspondence",
      commit: "43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4",
      state: "public",
      narrativeId: "progress/gfx942-wave64-lds-reduction",
    });
    const detail = checkpointDetail(wave64);
    expect(detail).toContain("tree bfedcca0e8fb58acda182d780700e520d093fb0f");
    expect(detail).toContain("4,359 deterministic mask observations");
    expect(detail).toContain("38 tests with one existing hardware test ignored");
    expect(detail).toContain("22 positive obligations");
    expect(detail).toContain("all eight expected-negative fixtures");
    expect(detail).toContain("does not hash the CPU oracle or refinement implementation");
    expect(detail).toContain("KIR order is validated but not operationally executed");
    expect(detail).toContain("does not compute SHA-256");
    expect(detail).toContain("no source-to-model correspondence");
    expect(detail).toContain("compiler causality");
    expect(detail).toContain("LLVM/ISA refinement");
    expect(detail).toContain("generalized memory safety or race freedom");
    expect(detail).toContain("parity authority");
  });

  it("records reviewed Wave64 attributed-source structural correspondence", () => {
    const correspondence = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.id === "wave64-reviewed-source-structural-correspondence",
    );
    expect(correspondence).toMatchObject({
      name: "Wave64 reviewed attributed-source structural correspondence",
      commit: "e874da2083c2a1eb192048ea5f88a053c28d0ee2",
      state: "public",
      narrativeId: "progress/wave64-reviewed-source-structural-correspondence",
    });
    const detail = checkpointDetail(correspondence);
    expect(detail).toContain("tree 0e504b3be16b4dfaf3c997eefac8a6d24313e1b8");
    expect(detail).toContain("exact syn AST gate");
    expect(detail).toContain("fixed reviewed interpreter");
    expect(detail).toContain("17,436 observations");
    expect(detail).toContain("13 positive obligations");
    expect(detail).toContain("six expected-negative fixtures");
    expect(detail).toContain("proves_source_to_model_refinement=false");
    expect(detail).toContain("model-internal/definitional correspondence");
    expect(detail).toContain("constants rather than a verified SHA computation");
    expect(detail).toContain("interpreter is fixed after the AST gate");
    expect(detail).toContain("no theorem gives the Rust syntax operational semantics");
    expect(detail).toContain("no compiler, LLVM/ISA, artifact, GPU");
    expect(detail).toContain("generalized memory-safety or race-freedom");
    expect(detail).toContain("parity authority");
    expect(detail).toContain("promotes no lesson or parity row");
  });

  it("records only inert protected-service descriptor admission", () => {
    const admission = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "protected-service-descriptor-admission",
    );
    expect(admission).toMatchObject({
      name: "Inert protected-service descriptor admission",
      commit: "b8daeb2bc953924a424542820bed566e52d57290",
      state: "public",
      narrativeId: "progress/protected-service-descriptor-admission",
    });
    const detail = checkpointDetail(admission);
    expect(detail).toContain("tree ee06e94d6c5b5f5f447127a6c497e5a3e84ba417");
    expect(detail).toContain("AUTHORITY=none");
    expect(detail).toContain("27 unit tests and two compile-fail doctests");
    expect(detail).toContain("two privileged/root-only positive tests remain ignored");
    expect(detail).toContain("client liveness");
    expect(detail).toContain("PID-reuse protection");
    expect(detail).toContain("exclusive endpoint ownership");
    expect(detail).toContain("storage or anti-rollback");
    expect(detail).toContain("replay, reservation, host-link, publication, load, launch");
    expect(detail).toContain("changes no parity status");
    expect(detail).toContain("run/verify/evidence gate");
    expect(detail).toContain("lesson pin");
    expect(detail).toContain("explanatory-source label");
  });

  it("records the accepted static pre-exec containment foundation", () => {
    const preexec = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "static-preexec-containment-foundation",
    );
    expect(preexec).toMatchObject({
      name: "Accepted static pre-exec containment foundation",
      commit: "4aed8d4d394783362e289a558b6d94cc28ecda36",
      state: "public",
      narrativeId: "progress/static-preexec-containment-foundation",
    });
    const detail = checkpointDetail(preexec);
    expect(detail).toContain("tree 3996f269dad3e88748c50a24c98439c1422c1e3b");
    expect(detail).toContain("AUTHORITY=none");
    expect(detail).toContain("freestanding Linux x86-64 syscall-only _start");
    expect(detail).toContain("exact descriptor objects and process controls");
    expect(detail).toContain("empty target environment and fixed one-element argv");
    expect(detail).toContain("post-exec target inherits PDEATHSIG(SIGKILL)");
    expect(detail).toContain("Fourteen CTests and the Cargo integration pass");
    expect(detail).toContain("17,488-byte executable");
    expect(detail).toContain(
      "db65ee057a8a9d10f8c8e54087e46c4d34c7040b5b34e1732c42da2872b91c52",
    );
    expect(detail).toContain("trusts the supervisor and inherited process state");
    expect(detail).toContain("preattached ptrace tracer");
    expect(detail).toContain("inherited seccomp user notification");
    expect(detail).toContain("coarse object state");
    expect(detail).toContain("parent-start provenance relies on trusted procfs mount state");
    expect(detail).toContain("ordinary target exec resets dumpability");
    expect(detail).toContain("no supervisor authentication, broker session or replay");
    expect(detail).toContain("publication, link, load, launch, runtime, GPU, or parity authority");
    expect(detail).toContain("promotes no lesson or parity row");
  });

  it("records only the bounded external anti-rollback anchor protocol", () => {
    const anchor = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "external-anchor-protocol-foundation",
    );
    expect(anchor).toMatchObject({
      name: "Bounded external anti-rollback anchor protocol",
      commit: "4639ff36c8651a859495da86ea2c75e735377440",
      state: "public",
      narrativeId: "progress/external-anchor-protocol-foundation",
    });
    const detail = checkpointDetail(anchor);
    expect(detail).toContain("tree f0d91caaf705a7542135226c20cdb794dbc4f542");
    expect(detail).toContain("AUTHORITY=none");
    expect(detail).toContain("nonzero caller nonce");
    expect(detail).toContain("Strict Ed25519 verification");
    expect(detail).toContain("caller-supplied pinned public-key value");
    expect(detail).toContain("constructible only after a valid signature");
    expect(detail).toContain("unrelated or later positions fail closed");
    expect(detail).toContain("Fifteen unit, adversarial, and property-style tests");
    expect(detail).toContain("three compile-fail doctests");
    expect(detail).toContain("every single-byte response mutation");
    expect(detail).toContain("durable nonce freshness");
    expect(detail).toContain("monotonic anchor implementation");
    expect(detail).toContain("atomic anchoring or publication remain absent");
    expect(detail).toContain("changes no parity status");
    expect(detail).toContain("explanatory-source label");
  });

  it("records W0-B as rejected and pins the selected host-link closure", () => {
    const rejected = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "w0b-host-link-rejection",
    );
    expect(rejected).toMatchObject({
      name: "Rejected W0-B static host-link candidate",
      commit: "2e5ad53bcb20f2a46e91128a42e838d918d61581",
      state: "rejected",
      narrativeId: "progress/w0b-host-link-rejection",
    });
    const detail = checkpointDetail(rejected);
    expect(detail).toContain("tree 892f014381cd3e34f81cb05df3b9bbda4a412478");
    expect(detail).toContain("is rejected and is not integrated, accepted, or public");
    expect(detail).toContain(
      "crossed the static binding-wrapper, Cargo, rustc, backend, and kernel-collection boundaries",
    );
    expect(detail).toContain("broker lacked an authenticated cargo-fe2o3 executable identity");
    expect(detail).toContain("executed zero Workers");
    expect(detail).toContain("no artifact admission, load, dispatch, or GPU result");
    expect(detail).toContain("opened no COMGR path");
    expect(detail).toContain("ELF loader and system DSOs, CRTs, archives and objects, search roots");
    expect(detail).toContain("forwarded Cargo target artifacts outside the authenticated closure");
    expect(detail).toContain("env_clear reduces ambient configuration but does not authenticate");
    expect(detail).toContain("dedicated, genuinely static fe2o3-host-lld");
    expect(detail).toContain("pinned upstream LLVM/LLD archives");
    expect(detail).toContain("descriptor-backed HostLinkClosureV1");
    expect(detail).toContain("W0 is a dedicated");
    expect(detail).toContain(
      "W1 is authenticated broker cargo-fe2o3 executable identity and follows W0",
    );
    expect(detail).toContain("Retaining dynamic rust-lld is rejected");
    expect(detail).toContain("in-process host LLD is deferred");
    expect(detail).toContain(
      "Device code-object linking remains pinned upstream LLVM target-machine APIs plus in-process LLD",
    );
    expect(detail).toContain("no COMGR or shell GPU linker");
    expect(detail).toContain("promote no parity or evidence row");

    for (const id of ["softmax", "flash-attention", "moe-routing", "moe-experts"]) {
      expect(kernelProgress.find((kernel) => kernel.id === id)).toMatchObject({
        run: "partial",
        verify: "partial",
        evidence: "partial",
      });
    }
  });

  it("keeps the historical row pin separate from the LLVM release pair", () => {
    const historical = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "row-softmax-release-checkpoint",
    );
    expect(historical).toMatchObject({
      name: "Row-softmax historical 25-pin release checkpoint",
      commit: "aca28306fe89c036dc0129349ef9ed685a43c7bb",
      state: "public",
    });
    expect(checkpointDetail(historical)).toContain(
      "tree 37f1a92e0be0a4b48c5cef1b1a48327e0ea4c828",
    );
    expect(checkpointDetail(historical)).toContain("all 25 release pins");

    const llvmRelease = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "row-softmax-llvm-release",
    );
    expect(llvmRelease).toMatchObject({
      name: "Row-softmax LLVM release pair",
      commit: "fd89390788adc5670c54ecc2517b9720f2f80113",
      state: "public",
    });
    const detail = checkpointDetail(llvmRelease);
    expect(detail).toContain(
      "A 31bf96a21c0a2bbfb55c44f9a22b7350cabcfcb1, tree 293c6d39e47d64f5949d450d6041dc598aafd0fe",
    );
    expect(detail).toContain(
      "B fd89390788adc5670c54ecc2517b9720f2f80113, tree af0156687517c0e71eb0d607917964b7c375af43",
    );
    expect(detail).toContain(
      "9c7dc4a08f2f972b581ffa0f88bf8834d2098f21ff57b1a8594dd4dfca03759c",
    );
    expect(detail).toContain("Two fresh complete MI300X runs passed");
    expect(detail).toContain("independent review accepted the evidence package");
    expect(detail).toContain(
      "single retained HSACO identity 0864047320a7ade5eba29d3fbb3ef9efefcf2a1378097061010d163af461db93",
    );
    expect(detail).toContain("did not dispatch a GPU");
    expect(detail).toContain("upstream LLVM target-machine APIs plus in-process LLD");
    expect(detail).toContain("no runtime or GPU result, authentication");
  });

  it("tracks every tutorial kernel through three independent gates", () => {
    expect(kernelProgress.map((kernel) => kernel.id)).toEqual([
      "fill",
      "vecadd",
      "scalar-map",
      "wave-collectives",
      "workgroup-reduction",
      "scalar-gemm",
      "tiled-gemm",
      "softmax",
      "flash-attention",
      "moe-routing",
      "moe-experts",
    ]);
    expect(kernelProgress.every((kernel) => kernel.next.length > 0)).toBe(true);
    expect(
      kernelProgress.some(
        (kernel) =>
          kernel.run === "complete" &&
          kernel.verify === "complete" &&
          kernel.evidence === "complete",
      ),
    ).toBe(false);
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-experts"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
    });
  });

  it("tracks G4 Flash finalization, upstream reproduction, and typed runtime without GPU authority", () => {
    const admission = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-compiler-admission",
    );
    expect(admission).toMatchObject({
      commit: "bfc32b51314e75e4d619eda244e0d78573f1232c",
      state: "public",
    });

    const finalization = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-direct-finalization",
    );
    expect(finalization).toMatchObject({
      commit: "0b8ddf138d5420b90a61463ade8d612eb7101090",
      state: "public",
    });
    const detail = checkpointDetail(finalization);
    expect(detail).toContain("upstream LLVM target-machine APIs");
    expect(detail).toContain("in-process LLD");
    expect(detail).toContain("opaque deterministic-receipt evidence only");
    expect(detail).toContain(
      "no publication, load, launch, runtime, GPU, numerical, performance, compiler-refinement, OCML-semantics, general memory-safety, or race-freedom authority",
    );
    expect(detail).toContain("no measured proof of no-COMGR linkage");

    const reproducibility = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-upstream-reproducibility",
    );
    expect(reproducibility).toMatchObject({
      commit: "c1aecbb11017125e84209a333d978ec6d5bdddb1",
      state: "public",
    });
    const reproducibilityDetail = checkpointDetail(reproducibility);
    expect(reproducibilityDetail).toContain("sole exact FlashAttention V1 machine compiler identity");
    expect(reproducibilityDetail).toContain("Two previously absent worker build directories");
    expect(reproducibilityDetail).toContain(
      "d2aa57c0f468f574f44a9fea06bbb8e98aa9b60bb2d9303cc4d8b6caf0cfca54",
    );
    expect(reproducibilityDetail).toContain("ROCm LLVM 7.2.4 is rejected");
    expect(reproducibilityDetail).toContain("first measured toolchain divergence is linked bitcode");
    expect(reproducibilityDetail).toContain(
      "GPU device code-object path introduced no COMGR or shell GPU linker",
    );
    expect(reproducibilityDetail).toContain("no functional Flash semantics");

    const runtime = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-typed-runtime",
    );
    expect(runtime).toMatchObject({
      commit: "26c80737e3380cd73df21d9a8abd1838cdfa76bc",
      state: "public",
    });
    const runtimeDetail = checkpointDetail(runtime);
    expect(runtimeDetail).toContain("typed four-buffer binding");
    expect(runtimeDetail).toContain("Joined -> Loaded -> Completed -> Unloaded");
    expect(runtimeDetail).toContain("Nine compile-fail cases");
    expect(runtimeDetail).toContain("independent strict-f32 CPU oracle");
    expect(runtimeDetail).toContain("fails closed before HSA load");
    expect(runtimeDetail).toContain("no protected GPU dispatch or numerical GPU result");
    const memoryProof = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "flash-attention-memory-proof",
    );
    expect(memoryProof).toMatchObject({
      commit: "182d5673327bdbf642e3328a50903a4607a1756c",
      state: "public",
    });
    const memoryProofDetail = checkpointDetail(memoryProof);
    expect(memoryProofDetail).toContain("13 verified obligations");
    expect(memoryProofDetail).toContain("all eight pinned mutations");
    expect(memoryProofDetail).toContain("explicitly inert");
    expect(memoryProofDetail).toContain("has_identity_bound_verus_receipt false");
    expect(memoryProofDetail).toContain("No AuthenticatedVerusExecutionReceiptV2 join");
    expect(
      kernelProgress.find((kernel) => kernel.id === "flash-attention")?.next,
    ).toContain("W1 with broker-owned durable replay exclusion");

    const lesson = lessons.find((entry) => entry.id === "flash-attention");
    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    const result = lesson?.tabs.find((tab) => tab.kind === "result");
    expect(host).toMatchObject({
      sourcePath: "examples/flash_attention_general_v1/src/main.rs",
      sourceCommit: "1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e",
      sourceSha256:
        "afb79e75ca9e0f5f5f20ed3a9db15d05a05ba776c1e16ebf03ee6caf55f9c0a1",
      explanatory: false,
    });
    expect(host?.code).toContain("batch_heads: 2");
    expect(host?.code).toContain("queries: 19");
    expect(host?.code).toContain("attention modified output padding");
    expect(result?.explanatory).toBe(true);
    const attentionContent = serializedLessonContent("flash-attention");
    expect(attentionContent).toContain("checked tiled output ownership");
    expect(attentionContent).toContain("active workgroup/lane/component store map");
    expect(result?.code).toContain("Executable dynamic fused attention qualification");
    expect(result?.code).toContain("PASS flash_attention_general_v1");
    expect(result?.code).toContain("V_MFMA_F32_16X16X16_BF16");
    expect(result?.code).toContain("25 ranked dynamic-index discharges");
    expect(result?.code).toContain(
      "tuned-library performance claim",
    );
  });

  it("tracks G5 MoE finalization and typed runtime without granting GPU authority", () => {
    const admission = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-compiler-admission",
    );
    expect(admission).toMatchObject({
      commit: "40e04f8e8469f37d3e9c4fcfcb23bd5ab6d1536e",
      state: "public",
    });

    const finalization = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-direct-finalization",
    );
    expect(finalization).toMatchObject({
      commit: "8926b3f725a9cb6a15bc8f43f019af1afffc6c1c",
      state: "public",
    });
    const detail = checkpointDetail(finalization);
    expect(detail).toContain("upstream LLVM target-machine APIs");
    expect(detail).toContain("in-process LLD");
    expect(detail).toContain("non-Clone receipt is opaque");
    expect(detail).toContain("passed in debug and release");
    expect(detail).toContain("not measured no-COMGR authority");
    expect(detail).toContain(
      "no publication, load, launch, runtime, GPU numerical, performance, compiler-refinement, Verus-to-machine, general memory-safety, or race-freedom authority",
    );

    const runtime = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-typed-runtime",
    );
    expect(runtime).toMatchObject({
      commit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
      state: "public",
    });
    const runtimeDetail = checkpointDetail(runtime);
    expect(runtimeDetail).toContain("eight-buffer binding");
    expect(runtimeDetail).toContain("Joined -> Loaded -> Completed -> Unloaded");
    expect(runtimeDetail).toContain("nine compile-fail cases");
    expect(runtimeDetail).toContain("independent CPU oracle");
    expect(runtimeDetail).toContain("fails closed before HSA load");
    expect(runtimeDetail).toContain("no protected GPU routing result");

    const memoryProof = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-top2-memory-proof",
    );
    expect(memoryProof).toMatchObject({
      commit: "d9ee4d09a97e59982b5e9ccf2e3877fff84fab5b",
      state: "public",
    });
    const memoryProofDetail = checkpointDetail(memoryProof);
    expect(memoryProofDetail).toContain("16 verified obligations");
    expect(memoryProofDetail).toContain("all eight pinned mutations");
    expect(memoryProofDetail).toContain("explicitly inert");
    expect(memoryProofDetail).toContain("cannot mint or join");
    expect(memoryProofDetail).toContain("no source/compiler/KIR/LLVM/ISA");

    const expertEvidence = developmentCheckpoints.find(
      (checkpoint) => checkpoint.id === "moe-expert-bounded-evidence",
    );
    expect(expertEvidence).toMatchObject({
      commit: "43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4",
      state: "public",
      narrativeId: "progress/moe-expert-bounded-evidence",
    });
    const expertEvidenceDetail = checkpointDetail(expertEvidence);
    expect(expertEvidenceDetail).toContain(
      "retains the bounded MoE V2 proof and host-bridge evidence",
    );
    expect(expertEvidenceDetail).toContain("19 verified obligations");
    expect(expertEvidenceDetail).toContain(
      "all seven expected-failure mutations",
    );
    expect(expertEvidenceDetail).toContain("all 625 count vectors");
    expect(expertEvidenceDetail).toContain(
      "caller-supplied top2 experts, requested and admitted counts, offsets, route slots, permutation, and inverse",
    );
    expect(expertEvidenceDetail).toContain(
      "uploads offsets and inverse together",
    );
    expect(expertEvidenceDetail).toContain(
      "gfx942 upload/readback test is no kernel dispatch",
    );
    expect(expertEvidenceDetail).toContain(
      "does not authenticate router execution or device readback provenance",
    );
    expect(expertEvidenceDetail).toContain("freshness, replay, compiler, finalizer");
    expect(expertEvidenceDetail).toContain(
      "no router or expert GPU execution",
    );
    expect(progressSnapshot.eventualPublicCommit).toBe(
      "ecf7b17f819021708d9c59ebe39a4daf9eb2562c",
    );

    const lesson = curriculum
      .flatMap((module) => module.lessons)
      .find((candidate) => candidate.id === "moe-routing");
    const host = lesson?.tabs.find((tab) => tab.kind === "host");
    const result = lesson?.tabs.find((tab) => tab.kind === "result");
    expect(host).toMatchObject({
      sourcePath: "crates/fe2o3-hsa-runtime/tests/moe_top2_v1_hardware.rs",
      sourceCommit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
      explanatory: true,
    });
    expect(host?.code).toContain("examples/moe_top2_v1/run-memory-verus.sh");
    expect(host?.code).toContain("protected_gfx942_moe_top2_v1_hardware");
    expect(result?.code).toContain("No protected GPU dispatch occurred");
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-routing")?.next,
    ).toContain("W1 with broker-owned durable replay exclusion");

    const expertLesson = lessons.find(
      (candidate) => candidate.id === "moe-expert-compute",
    );
    const expertHost = expertLesson?.tabs.find((tab) => tab.kind === "host");
    const expertResult = expertLesson?.tabs.find((tab) => tab.kind === "result");
    const expertContent = serializedLessonContent("moe-expert-compute");
    expect(expertContent).toContain("runtime padded rows");
    expect(expertContent).toContain("MFMA is an operation, not a workload label");
    expect(expertContent).toContain("has not been requalified at compiler commit 1dd61a01");
    expect(expertContent).toContain("no KIR, MFMA lowering, launch, or hardware result is claimed");
    expect(expertContent).toContain("41 tokens, 4 experts, 82 routes");
    expect(expertContent).toContain("Host scheduling is still explicit");
    expect(expertLesson?.claims[0].reference).toMatchObject({
      scope: "historical-evidence",
      commit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      tree: "37ec6083aba26f3057bb21f3a51c619c17bceb49",
    });
    expect(expertHost).toMatchObject({
      sourcePath: "examples/moe_grouped_expert_general_v1/src/main.rs",
      sourceCommit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      sourceSha256:
        "24838bcdd753efa2d5fac08798c10c4b75176cb18eee88bd05c20af4af04cb1d",
      explanatory: false,
    });
    expect(expertHost?.code).toContain("launch_expert");
    expect(expertHost?.code).toContain("routes[(token % EXPERTS)");
    expect(expertHost?.notice).toContain("launches the same generated kernel");
    expect(expertResult?.code).toContain("PASS top2-routed-moe");
    expect(expertResult?.code).toContain("17 ranked dynamic-index obligations");
    expect(expertResult?.code).toContain(
      "no GEMM, attention, routing, or MoE recognizer",
    );

    const orientation = serializedLessonContent("evidence-archive");
    expect(orientation).toContain("Read bounded MoE evidence by layer");
    expect(orientation).toContain("all 625 count vectors");
    expect(orientation).toContain("uploads offsets and inverse together");
    expect(orientation).toContain("no freshness or replay authority");
    expect(orientation).toContain(
      "No expert GEMM or combine kernel was dispatched",
    );
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-experts"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: expect.arrayContaining([
        "authenticated router completion and device readback provenance",
        "logits-to-top2, route-weight, and packed-activation joins",
        "freshness and replay authority",
      ]),
    });
    expect(
      kernelProgress.find((kernel) => kernel.id === "moe-experts")?.next,
    ).toContain("Promote the exact compact-plan proof and host bridge only after");
  });

  it("tracks scalar GEMM hardware observation without upgrading authority", () => {
    const scalarCheckpoint =
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.name === "Scalar GEMM V1 vertical slice",
      );
    expect(scalarCheckpoint).toMatchObject({
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
    const scalarDetail = checkpointDetail(scalarCheckpoint);
    expect(scalarDetail).toContain(
      "ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9",
    );
    expect(scalarDetail).toContain(
      "raw smoke deliberately bypasses production prerequisite authentication",
    );
    expect(kernelProgress.find((kernel) => kernel.id === "scalar-gemm")).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "protected artifact publication and currentness",
        "complete source-to-machine refinement",
        "dynamic safe LDS/MFMA optimization",
        "comparative performance evidence",
      ],
    });
    expect(checkpointDetail(
      developmentCheckpoints.find(
        (checkpoint) => checkpoint.name === "Scalar GEMM proof profile",
      ),
    )).toContain("does not execute Verus");
    const physicalEffectCheckpoint = developmentCheckpoints.find(
      (checkpoint) => checkpoint.name === "Scalar GEMM physical-effect profile",
    );
    expect(physicalEffectCheckpoint).toMatchObject({
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "acceptance",
    });
    const physicalEffectDetail = checkpointDetail(physicalEffectCheckpoint);
    expect(physicalEffectDetail).toContain("upstream LLVM 22");
    expect(physicalEffectDetail).toContain("exact 60-opcode scalar profile");
    expect(physicalEffectDetail).toContain(
      "9 address / 8 read / 1 write / 1 return / 0 calls",
    );
    expect(physicalEffectDetail).toContain("without COMGR");
    expect(physicalEffectDetail).toContain(
      "static, inert evidence only",
    );
    expect(physicalEffectDetail).toContain(
      "downstream authenticated evidence must bind the new identity",
    );
  });

  it("tracks production S09 capture without granting compiler or execution authority", () => {
    const s09Checkpoint = developmentCheckpoints.find(
      (checkpoint) => checkpoint.name === "Production S09 rustc invocation capture",
    );
    expect(s09Checkpoint).toMatchObject({
      commit: progressSnapshot.lastAuditedPublicCommit,
      state: "public",
    });
    const s09Detail = checkpointDetail(s09Checkpoint);
    expect(s09Detail).toContain("RustcInvocationDescriptorV2");
    expect(s09Detail).toContain("exactly /proc/./self/fd/198");
    expect(s09Detail).toContain(
      "sole final managed -Zcodegen-backend=<path> selector",
    );
    expect(s09Detail).toContain("COV6 gfx942:xnack-");
    expect(s09Detail).toContain("containing exactly alpha");
    expect(s09Detail).toContain(
      "canonical publication envelope and nested record",
    );
    expect(s09Detail).toContain(
      "5902632c5c249be05855ae5cef62bb9096a1f9277cfb0c58b4384594d6ee61de",
    );
    expect(s09Detail).toContain("proves no compiler origin");
    expect(s09Detail).toContain(
      "no loading, execution, or verification authority",
    );
    expect(s09Detail).toContain(
      "not a pathname-to-object identity join",
    );
    expect(s09Detail).toContain(
      "no general source or output-object association",
    );
  });

  it("tracks authenticated Verus V2 without overstating its authority", () => {
    const checkpoint = developmentCheckpoints.find(
      (entry) => entry.name === "Authenticated Verus execution V2",
    );
    expect(checkpoint).toMatchObject({
      commit: "b704651757a3d46801144277e025f68153cb1ba9",
      state: "public",
    });
    const detail = checkpointDetail(checkpoint);
    expect(detail).toContain("Linux x86_64");
    expect(detail).toContain(
      "pinned local runtime and tool snapshots",
    );
    expect(detail).toContain(
      "clone3 pidfds and ptrace-unresumable checkpoints",
    );
    expect(detail).toContain("seccomp process-creation denial");
    expect(detail).toContain(
      "exact live executable/backing comparison",
    );
    expect(detail).toContain(
      "runtime closure and baseline pinning",
    );
    expect(detail).toContain("vDSO pinning");
    expect(detail).toContain("immutable sealed results");
    expect(detail).toContain(
      "compressed and alternate debug-section families",
    );
    expect(detail).toContain(
      "Package-scoped debug stripping",
    );
    expect(detail).toContain(
      "bounded two-root gate compares SHA-256, size, and Build ID",
    );
    expect(detail).toContain("debug V2 integration passed 14/14");
    expect(detail).toContain("release passed 13/13");
    expect(detail).toContain(
      "full verifier debug and release suites and 22 doctests passed",
    );
    expect(detail).toContain(
      "mi300x correctly failed closed on its different vDSO and runtime baseline",
    );
    expect(detail).toContain(
      "does not integrate stock Verus or Z3",
    );
    expect(detail).toContain("semantic proof validity");
    expect(detail).toContain(
      "exclusive measured-image execution between checkpoints",
    );
    expect(detail).toContain("compiler refinement");
    expect(detail).toContain("GPU authority");
  });

  it("keeps the tiled GEMM fragment probe separate from the four-slice profile", () => {
    const foundation = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 layout and frontend foundations",
    );
    expect(foundation).toMatchObject({
      commit: "286331aab8639dd3707e55cdf51a83f8854d26a5",
      state: "public",
    });
    const detail = checkpointDetail(foundation);
    expect(detail).toContain(
      "2ef91896bcdc4d26624f952e5c905c787cd9bc9e",
    );
    expect(detail).toContain(
      "commit 027ab901bef7007d0e8da3370470556ed28baad1",
    );
    expect(detail).toContain(
      "Exhaustive 64-lane x 4-component goldens",
    );
    expect(detail).toContain(
      "23 public Verus proof functions discharge 73 obligations",
    );
    expect(detail).toContain(
      "five formula mutations are rejected",
    );
    expect(detail).toContain(
      "build-scoped WG64/288-byte fragment probe",
    );
    expect(detail).toContain(
      "neither the later four-slice production profile nor the independent WG256/384-byte mutation",
    );
  });

  it("tracks source-authenticated tiled lowering without claiming refinement", () => {
    const sourceBridge = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 source-authenticated compiler bridge",
    );
    expect(sourceBridge).toMatchObject({
      kind: "staged-evidence",
      commit: tiledGemmV1Commits.sourceBridge,
      state: "acceptance",
    });
    expect(sourceBridge).not.toHaveProperty("detail");
    const sourceBridgeDetail = sourceBridge
      ? developmentCheckpointDetail(sourceBridge)
      : "";
    expect(sourceBridgeDetail).toBe(
      stagedEvidenceDetail([
        "tiled-source-bridge-v1",
        "tiled-cargo-metadata-v1",
        "tiled-cargo-root-v1",
      ]),
    );
    expect(sourceBridgeDetail).toContain(
      "A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>",
    );
    expect(sourceBridgeDetail).toContain(
      "portable-MIR identity, compiler profile, gfx942:xnack-, COV6, WG64, zero LDS",
    );
    expect(sourceBridgeDetail).toContain(
      "64-byte explicit plus 256-byte implicit four-slice ABI",
    );
    expect(sourceBridgeDetail).toContain(
      "eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores",
    );
    expect(sourceBridgeDetail).toContain(
      "AMDGCN lowering represents the BF16 carriers with i16 loads",
    );
    expect(sourceBridgeDetail).toContain("private single-use receipt");
    expect(sourceBridgeDetail).toContain(
      "b904f5b648c7eb249d32d73db427abe72970315a normalizes Cargo-generated metadata only inside the compiler-semantic commitment",
    );
    expect(sourceBridgeDetail).toContain(
      "private receipt carries that normalized compiler-semantic commitment",
    );
    expect(sourceBridgeDetail).toContain(
      "does not carry normalized metadata as a separate receipt field",
    );
    expect(sourceBridgeDetail).toContain(
      "managed cargo-fe2o3 wrapper separately binds the full ordered rustc argv and exact metadata observations",
    );
    expect(sourceBridgeDetail).not.toContain(
      "private receipt contain normalized Cargo-generated metadata",
    );
    expect(sourceBridgeDetail).not.toContain(
      "full observed argv and metadata remain receipt-bound",
    );
    expect(sourceBridgeDetail).toContain(
      "51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape in the compiler semantic commitment",
    );
    expect(sourceBridgeDetail).toContain(
      "full observed root is stored in the private receipt and length-framed into its authority commitment",
    );
    expect(sourceBridgeDetail).toContain("Worker V2 handoff remains inert");
    expect(sourceBridgeDetail).toContain(
      "not a compiler refinement proof",
    );
    expect(sourceBridgeDetail).toContain(
      "no final-HSACO, publication, loading, or launch authority",
    );
  });

  it("tracks the guarded tiled hardware observation without upgrading authority", () => {
    const hardware = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 guarded gfx942 hardware observation",
    );
    expect(hardware).toMatchObject({
      commit: tiledGemmV1Commits.hardwareEvidence,
      state: "public",
    });
    const hardwareDetail = hardware ? developmentCheckpointDetail(hardware) : "";
    expect(hardwareDetail).toContain("externally supplied digest-pinned bytes");
    expect(hardwareDetail).toContain("COV6/WG64/320-byte metadata");
    expect(hardwareDetail).toContain("bitwise dyadic 16x16 oracle");
    expect(hardwareDetail).toContain(
      "A/B/C inputs remained bitwise unchanged",
    );
    expect(hardwareDetail).not.toMatch(/immutable\s+inputs/);
    expect(hardwareDetail).toContain("6,672-byte HSACO");
    expect(hardwareDetail).toContain(
      "SHA-256 681077be1108c57d9d887f94afdd0ec3700ed2c86d73e66d2b229d6b418d0c66",
    );
    expect(hardwareDetail).toContain("passed 1/1 in 40.92 seconds");
    expect(hardwareDetail).toContain("compact console receipt is committed");
    expect(hardwareDetail).toContain("zero LDS and is not source-derived");
    expect(hardwareDetail).toContain("non-authoritative observation");
    expect(hardwareDetail).toContain("no compiler, publication, protected loading");
  });

  it("tracks structural artifact admission without claiming body semantics", () => {
    const structural = developmentCheckpoints.find(
      (checkpoint) =>
        checkpoint.name === "Tiled GEMM V1 structural artifact admission",
    );
    expect(structural).toMatchObject({
      commit: tiledGemmV1Commits.structuralAdmission,
      state: "public",
    });
    const structuralDetail = structural
      ? developmentCheckpointDetail(structural)
      : "";
    expect(structuralDetail).toContain(
      "four slices in 64 explicit bytes, a 256-byte implicit suffix",
    );
    expect(structuralDetail).toContain(
      "separately rejects the WG64/288-byte fragment probe",
    );
    expect(structuralDetail).toContain(
      "independent WG256 and 384-byte structural mutations",
    );
    expect(structuralDetail).toContain("admit arbitrary .text");
    expect(structuralDetail).toContain(
      "does not inspect machine-body semantics",
    );
    expect(structuralDetail).toContain(
      "no publication, loading, or launch authority",
    );
    expect(structuralDetail).toContain("no COMGR path is added");
  });

  it("tracks observational Slice 1 and proof-only Slice 2 without promotion", () => {
    const expected = [
      ["tiled-gemm-lds-kernel-ir", tiledGemmV1Commits.ldsKernelIr],
      ["tiled-gemm-lds-verus", tiledGemmV1Commits.ldsVerus],
      [
        "tiled-gemm-lds-attributed-source",
        tiledGemmV1Commits.ldsAttributedSource,
      ],
      [
        "tiled-gemm-lds-machine-inspection",
        tiledGemmV1Commits.ldsMachineInspection,
      ],
      ["tiled-gemm-lds-kphase-model", tiledGemmV1Commits.ldsKphaseModel],
      [
        "tiled-gemm-lds-hardware-observation",
        tiledGemmV1Commits.ldsHardwareObservation,
      ],
      [
        "tiled-gemm-lds-k32-machine-inspection",
        tiledGemmV1Commits.ldsK32MachineInspection,
      ],
      ["tiled-gemm-lds-wg64-contract", tiledGemmV1Commits.ldsWg64Contract],
      [
        "tiled-gemm-lds-grid-stride-model",
        tiledGemmV1Commits.ldsGridStrideModel,
      ],
      [
        "tiled-gemm-lds-source-ir-correspondence",
        tiledGemmV1Commits.ldsSourceIrCorrespondence,
      ],
      [
        "tiled-gemm-lds-grid-machine-inspection",
        tiledGemmV1Commits.ldsGridMachineInspection,
      ],
      [
        "tiled-gemm-lds-edge-kernel-ir",
        tiledGemmV1Commits.ldsEdgeKernelIr,
      ],
      [
        "tiled-gemm-lds-edge-machine-inspection",
        tiledGemmV1Commits.ldsEdgeMachineInspection,
      ],
      [
        "tiled-gemm-lds-source-model-correspondence",
        tiledGemmV1Commits.ldsSourceModelCorrespondence,
      ],
      [
        "tiled-gemm-lds-matrix-wire-v5",
        tiledGemmV1Commits.ldsMatrixWireV5,
      ],
      [
        "tiled-gemm-lds-inert-worker-handoff",
        tiledGemmV1Commits.ldsInertWorkerHandoff,
      ],
      [
        "tiled-gemm-lds-sealed-profile-registry",
        tiledGemmV1Commits.ldsSealedProfileRegistry,
      ],
    ];
    for (const [id, commit] of expected) {
      expect(
        developmentCheckpoints.find((checkpoint) => checkpoint.id === id),
      ).toMatchObject({ commit, state: "public" });
    }

    expect(stagedEvidenceDetail(["tiled-lds-kernel-ir-v1"])).toContain(
      "neither collection from the attributed Rust source",
    );
    expect(stagedEvidenceDetail(["tiled-lds-verus-v1"])).toContain(
      "excludes IEEE rounding",
    );
    const source = stagedEvidenceDetail(["tiled-lds-attributed-source-v1"]);
    expect(source).toContain("ordinary Rust function carrying #[kernel(typed, ...)]");
    expect(source).toContain("without macro_rules!");
    expect(source).toContain("At commit ee76cedc");
    expect(source).toContain("source is deliberately non-executable");
    expect(source).toContain("Later records first add");
    const machine = stagedEvidenceDetail([
      "tiled-lds-machine-inspection-v1",
    ]);
    expect(machine).toContain("direct upstream llc and ld.lld");
    expect(machine).toContain("not collected from the attributed Rust source");
    expect(machine).toContain("later hardware observation remains a separate evidence record");
    const kphase = stagedEvidenceDetail(["tiled-lds-kphase-model-v2"]);
    expect(kphase).toContain("196 verified and 0 errors");
    expect(kphase).toContain("1-, 2-, and 4-phase cases");
    expect(kphase).toContain("proof/model evidence only");
    expect(kphase).toContain("no attributed multi-phase GPU source");
    expect(kphase).toContain("later backend evidence remains independent");
    const hardware = stagedEvidenceDetail([
      "tiled-lds-hardware-observation-v1",
    ]);
    expect(hardware).toContain("SHA-256-pinned upstream LLVM 22 llc, ld.lld, and llvm-objdump");
    expect(hardware).toContain("COMGR is neither invoked nor admitted");
    expect(hardware).toContain("all 1,536 outputs");
    expect(hardware).toContain("passed 1/1 in 33.72 seconds");
    expect(hardware).toContain("observational IR-derived hardware evidence only");
    expect(hardware).toContain("no Worker V2, publisher, protected load, or protected launch authority");
    expect(hardware).toContain("cannot establish general illegal-memory-access detection");
    const k32Machine = stagedEvidenceDetail([
      "tiled-lds-k32-machine-inspection-v2",
    ]);
    expect(k32Machine).toContain("real two-trip SSA loop");
    expect(k32Machine).toContain("reuses the same two LDS tiles");
    expect(k32Machine).toContain("two physical workgroup barriers");
    expect(k32Machine).toContain("one static loop-body BF16 MFMA");
    expect(k32Machine).toContain("passed 120 tests");
    expect(k32Machine).toContain("Clippy passed with warnings denied");
    expect(k32Machine).toContain("no attributed multi-phase Rust source");
    expect(k32Machine).toContain("runtime hardware execution");
    expect(k32Machine).toContain("LLVM refinement proof");
    const wg64 = stagedEvidenceDetail(["tiled-lds-wg64-contract-v1"]);
    expect(wg64).toContain("macro generates the frontend contract bytes");
    expect(wg64).toContain("no longer carries a handwritten frontend sidecar");
    expect(wg64).toContain("required-only exact WG64 and WG256 compatibility");
    expect(wg64).toContain("fixed vecadd, alpha/zeta, and scalar-GEMM profiles");
    expect(wg64).toContain("source-to-LDS Kernel IR collection");
    expect(wg64).toContain("compiler-issued LDS acquisition are still open");
    expect(wg64).toContain("later dc31f23eb source-correspondence record");
    const gridStride = stagedEvidenceDetail([
      "tiled-lds-grid-stride-model-v3",
    ]);
    expect(gridStride).toContain("fixed-K16 Slice 3 Verus model");
    expect(gridStride).toContain("101 verified and 0 errors");
    expect(gridStride).toContain("73, 93, 196, and 101 verified obligations");
    expect(gridStride).toContain("12 expected negative rejections");
    expect(gridStride).toContain("1x1 through 3x3");
    expect(gridStride).toContain("lda=33, ldb=79, and ldc=96");
    expect(gridStride).toContain("no attributed kernel-source correspondence");
    expect(gridStride).toContain("runtime hardware execution");
    expect(gridStride).toContain("numerical-contract proof");
    expect(gridStride).toContain("compiler or machine refinement");

    const sourceIr = stagedEvidenceDetail([
      "tiled-lds-source-ir-correspondence-v1",
    ]);
    expect(sourceIr).toContain("ordinary #[kernel(typed, ...)] Rust");
    expect(sourceIr).toContain("contains no macro_rules! body");
    expect(sourceIr).toContain("select only the verified canonical");
    expect(sourceIr).toContain("Removed-barrier, A-index-drift");
    expect(sourceIr).toContain("stops before descriptor construction and Worker V2");
    expect(sourceIr).toContain("fe2o3 issue #85 was still open");
    expect(sourceIr).toContain("not a source-to-machine or compiler-refinement proof");

    const gridMachine = stagedEvidenceDetail([
      "tiled-lds-grid-machine-inspection-v3",
    ]);
    expect(gridMachine).toContain("M=64, N=48, K=16");
    expect(gridMachine).toContain("lda=33, ldb=79, ldc=96");
    expect(gridMachine).toContain("gfx942:xnack- COV6");
    expect(gridMachine).toContain("zero spills, scratch, calls, atomics, or COMGR");
    expect(gridMachine).toContain("protected Slice 3 Worker V2 execution remains open");

    const edgeIr = stagedEvidenceDetail(["tiled-lds-edge-kernel-ir-v4"]);
    expect(edgeIr).toContain("M=17, N=19, K=18");
    expect(edgeIr).toContain("BF16 zero-fill tails");
    expect(edgeIr).toContain("alpha=2.0, beta=-1.0");
    expect(edgeIr).toContain("unconditional publish and reuse barriers");
    expect(edgeIr).toContain("At commit f2406353");
    expect(edgeIr).toContain("later 35575cc32 machine-inspection record");
    expect(edgeIr).toContain("protected execution remains open in #89");

    const edgeMachine = stagedEvidenceDetail([
      "tiled-lds-edge-machine-inspection-v4",
    ]);
    expect(edgeMachine).toContain("M=17, N=19, K=18");
    expect(edgeMachine).toContain("alpha=2.0, beta=-1.0");
    expect(edgeMachine).toContain("two predicated K16 phases");
    expect(edgeMachine).toContain("exactly two static barriers");
    expect(edgeMachine).toContain("one static loop-body BF16 MFMA");
    expect(edgeMachine).toContain("5 active tests and 1 intentional LLVM-tool ignore");
    expect(edgeMachine).toContain("129 active dialect tests with 23 intentional ignores");
    expect(edgeMachine).toContain("362 active Kernel IR tests with 1 intentional ignore");
    expect(edgeMachine).toContain("closes fe2o3 issue #86");
    expect(edgeMachine).toContain("protected Slice 4 MI300X execution in #89");

    const sourceModel = stagedEvidenceDetail([
      "tiled-lds-source-model-correspondence-v1",
    ]);
    expect(sourceModel).toContain("96 verified and 0 errors");
    expect(sourceModel).toContain("exact 256/256/256 lengths");
    expect(sourceModel).toContain("Four new expected-negative fixtures");
    expect(sourceModel).toContain("76 debug tests, 76 release tests");
    expect(sourceModel).toContain("7 doctests in each lane");
    expect(sourceModel).toContain("all six positive proof groups");
    expect(sourceModel).toContain("all 21 expected-negative fixtures");
    expect(sourceModel).toContain("identity-bound bounded source/model correspondence only");
    expect(sourceModel).toContain("does not prove rustc MIR-to-IR semantics");
    expect(sourceModel).toContain("descriptor or Worker V2 integrity");
    expect(sourceModel).toContain("certificate consumption");
    expect(sourceModel).toContain("fe2o3 #91");
    expect(sourceModel).toContain("#92");
    expect(sourceModel).toContain("#106");

    const matrixWire = stagedEvidenceDetail(["tiled-lds-matrix-wire-v5"]);
    expect(matrixWire).toContain("canonical Kernel IR V5 bytes");
    expect(matrixWire).toContain("V1 through V4 remain frozen");
    expect(matrixWire).toContain("wire identity only");

    const inertHandoff = stagedEvidenceDetail([
      "tiled-lds-inert-worker-handoff-v1",
    ]);
    expect(inertHandoff).toContain("exact compiler-owned descriptor");
    expect(inertHandoff).toContain("single-use Worker V2 handoff");
    expect(inertHandoff).toContain("original pre-section upstream-LLVM body");
    expect(inertHandoff).toContain("380 library tests passed");
    expect(inertHandoff).toContain("grants no worker, linker, final-HSACO");
  });

  it("keeps tiled GEMM partial until source, body, authority, and race closure", () => {
    expect(
      kernelProgress.find((kernel) => kernel.id === "tiled-gemm"),
    ).toMatchObject({
      run: "partial",
      verify: "partial",
      evidence: "partial",
      dependsOn: [
        "compiler-origin-authenticated source-to-HSACO binding",
        "production proof-certificate consumption (fe2o3 #91)",
        "K-phase, grid, and edge proof extension (fe2o3 #92)",
        "MIR-to-IR and IR-to-machine safety correspondence (fe2o3 #106 and #107)",
        "protected Slice 3 and Slice 4 execution (fe2o3 #88 and #89)",
        "general dimensions, strides, tails, and coefficients (fe2o3 #90)",
        "source and Verus-to-machine refinement",
      ],
    });
  });

  it("teaches the staged tiled evidence boundaries without repinning claims", () => {
    const orientation = serializedLessonContent("evidence-archive");
    const mapping = serializedLessonContent("gemm-tiling");
    const proofPlan = serializedLessonContent("gemm-proof-plan");
    const renderedStaged = stagedEvidenceDetail(stagedEvidenceOrder);

    expect(orientation).toContain(tiledGemmV1Commits.structuralAdmission);
    expect(orientation).toContain(
      "The checked-in publication gate pins compiler commit",
    );
    expect(orientation).toContain("Both public main refs must contain");
    expect(orientation).toContain("not a compiler refinement proof");
    expect(orientation).toContain("passed 1/1 in 40.92 seconds");
    expect(orientation).toContain("does not inspect machine-body semantics");

    for (const commit of Object.values(tiledGemmV1Commits)) {
      expect(renderedStaged).toContain(commit);
    }
    expect(renderedStaged).toContain("Worker V2 handoff remains inert");
    expect(renderedStaged).toContain(
      "eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores",
    );
    expect(renderedStaged).toContain(
      "WG64/288-byte fragment probe",
    );
    expect(renderedStaged).toContain(
      "independent WG256 and 384-byte structural mutations",
    );
    expect(renderedStaged).toContain("inputs remained bitwise unchanged");
    expect(renderedStaged).not.toMatch(/immutable\s+inputs/);
    expect(renderedStaged).toContain(
      "c4fcb4d980cf979c0527dfa135a7b9f4fe72a811",
    );
    expect(renderedStaged).toContain(
      "FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0",
    );
    expect(renderedStaged).toContain(
      "fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db",
    );
    expect(renderedStaged).toContain(
      "crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs",
    );
    expect(renderedStaged).not.toContain(
      "crates/fe2o3-host/tests/generated_lds_gemm_lifecycle.rs",
    );
    expect(mapping).toContain("Safe Rust qualification kernel for dynamic strided matrix multiplication");
    expect(mapping).toContain("sourceCommit\":\"1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e");
    expect(mapping).not.toContain("Optimized schedule mutation diagnostics");
    expect(mapping).not.toContain("staged-evidence");
    expect(proofPlan).toContain("Historical LDS-family routes are retired");
    expect(proofPlan).toContain("Protected Worker V3 publication remains separate");
    expect(proofPlan).toContain("collected-source selector");
    expect(proofPlan).toContain("authenticates the exact attributed source");
    expect(proofPlan).toContain("stops before descriptor construction and Worker V2");
    expect(proofPlan).toContain("six cases checked 1,536 outputs");
    expect(proofPlan).toContain("not Rust-source correspondence");
    expect(proofPlan).toContain("196 verified and 0 errors");
    expect(proofPlan).toContain("not an attributed multi-phase GPU kernel");
    expect(proofPlan).toContain("real two-trip SSA loop");
    expect(proofPlan).toContain("macro-owned for general typed #[kernel]");
    expect(proofPlan).toContain("fixed-K16 grid/stride source model");
    expect(proofPlan).toContain("101 verified and 0 errors");
    expect(renderedStaged).toContain("12 expected negative rejections");
    expect(proofPlan).toContain("M=64, N=48, K=16");
    expect(proofPlan).toContain("gfx942:xnack- COV6");
    expect(proofPlan).toContain("passed 1/1 in 14.36 seconds");
    expect(proofPlan).toContain("one exact bounded Slice 1 protected hardware observation");
    expect(proofPlan).toContain("Slice 4 at f24063534");
    expect(proofPlan).toContain("Commit 35575cc32");
    expect(proofPlan).toContain("M=17, N=19, K=18");
    for (const issue of [
      "#85",
      "#86",
      "#87",
      "#88",
      "#89",
      "#90",
      "#91",
      "#92",
      "#93",
      "#94",
      "#96",
      "#97",
      "#99",
      "#100",
    ]) {
      expect(proofPlan).toContain(issue);
    }
    expect(proofPlan).toContain("fe2o3-kernels #2");
    expect(proofPlan).toContain("the sealed authority-free exact-profile registry (#96)");
    expect(proofPlan).toContain("were later deleted from the unified compiler tree");
    expect(renderedStaged).toContain("Historical archive only");
    expect(proofPlan).toContain("96 verified and 0 errors");
    expect(proofPlan).toContain("76 debug tests, 76 release tests");
    expect(proofPlan).toContain("Production certificate consumption is tracked in #91");
    expect(proofPlan).toContain(
      "new dynamic WorkgroupPipeline route reaches KIR, LLVM, HSACO, and MI300X qualification",
    );
    for (const issue of [85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 96, 97, 99, 100]) {
      expect(proofPlan).toContain(
        `https://github.com/harsh-nod/fe2o3/issues/${String(issue)}`,
      );
    }
    expect(proofPlan).toContain(
      "https://github.com/harsh-nod/fe2o3-kernels/issues/2",
    );
    expect(proofPlan).not.toContain("#[kernel] WG64 contract integration remain open");

    expect(proofPlan).toContain("multi-phase source-to-machine derivation");
    expect(proofPlan).toContain("remain separate from the attributed source");
    expect(proofPlan).not.toContain(tiledGemmV1Commits.sourceBridge);
  });
});
