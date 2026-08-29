import milestoneData from "../../config/live-kfd-debugger-milestone.json";
import { deepFreeze } from "./registry";

export interface LiveKfdComparisonRow {
  surface: string;
  fe2o3: string;
  rocgdb: string;
  rocprof: string;
  mojo: string;
}

export type LiveWorkbenchBackendId =
  | "direct-kfd"
  | "rocgdb-mi"
  | "profiler-v4";

export type LiveWorkbenchTruthOrigin =
  | "declared"
  | "observed"
  | "inferred"
  | "unavailable";

export type LiveWorkbenchLaneState = "active" | "inactive" | "unavailable";

export interface LiveWorkbenchCell {
  lane: number;
  state: LiveWorkbenchLaneState;
  origin: LiveWorkbenchTruthOrigin;
  evidenceId?: string;
  detail: string;
}

export interface LiveWorkbenchBackend {
  id: LiveWorkbenchBackendId;
  label: string;
  shortLabel: string;
  status: string;
  scope: string;
  summary: string;
  evidenceId: string;
  origin: LiveWorkbenchTruthOrigin;
  matrixLabel: string;
  matrixNote: string;
  waveRows: Array<{
    id: string;
    label: string;
    cells: LiveWorkbenchCell[];
  }>;
  panels: Array<{
    label: "Source" | "Kernel IR" | "ISA / PC" | "Allocation";
    value: string;
    origin: LiveWorkbenchTruthOrigin;
    evidenceId?: string;
  }>;
  capabilities: Array<{
    label: string;
    state: "available" | "unavailable";
    origin: LiveWorkbenchTruthOrigin;
    detail: string;
  }>;
  record: Record<string, unknown>;
}

const exactObject = /^[0-9a-f]{40}$/u;
const liveKfdMirrors = [
  "harsh-nod/fe2o3@refs/heads/main",
  "powderluv/fe2o3@refs/heads/main",
] as const;

function validateLiveKfdPublication(): void {
  if (
    milestoneData.schema !==
      "fe2o3-live-kfd-debugger-tutorial-milestone-v1" ||
    milestoneData.status !== "observed-partial" ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(milestoneData.reviewedOn) ||
    !exactObject.test(milestoneData.compilerCommit) ||
    !exactObject.test(milestoneData.compilerTree) ||
    milestoneData.target !== "gfx942:xnack-" ||
    milestoneData.mirrors.length !== liveKfdMirrors.length ||
    milestoneData.mirrors.some(
      (mirror, index) => mirror !== liveKfdMirrors[index],
    ) ||
    milestoneData.validationCommand.trim().length === 0
  ) {
    throw new Error("live KFD debugger milestone is malformed");
  }
}

validateLiveKfdPublication();

export const liveKfdPublication = deepFreeze(milestoneData);

export function liveKfdSourceUrl(path: string): string {
  if (
    path.trim().length === 0 ||
    path !== path.trim() ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").includes("..")
  ) {
    throw new Error("live KFD source path must stay repository-relative");
  }
  return `https://github.com/harsh-nod/fe2o3/blob/${liveKfdPublication.compilerCommit}/${path}`;
}

const identity = (byte: string) => byte.repeat(64 / byte.length);
const declarationIdentity = identity("33");
const stoppedCheckpointIdentity = identity("a1");
const admittedMiIdentity = identity("b2");
const profilerBundleIdentity = identity("c3");

function laneCells(
  stateForLane: (lane: number) => LiveWorkbenchCell,
): LiveWorkbenchCell[] {
  return Array.from({ length: 64 }, (_, lane) => stateForLane(lane));
}

export const liveWorkbenchBackends: LiveWorkbenchBackend[] = [
  {
    id: "direct-kfd",
    label: "Direct KFD queue envelope",
    shortLabel: "Direct KFD",
    status: "MI300X stopped-queue envelope observed",
    scope: "gfx942 · KFD 1.18 · session-owned suspension",
    summary:
      "The session retains queue suspension and validates the device, queue, save area, and eight sequential XCC header reads. They are not one atomic hardware checkpoint, and Linux KFD does not publish the inner gfx942 wave/register record layout.",
    evidenceId: stoppedCheckpointIdentity,
    origin: "observed",
    matrixLabel: "Direct KFD unavailable inner wave and lane records",
    matrixNote:
      "The 64 columns visualize the logical Wave64 lane surface expected by higher-level tools. They are not decoded hardware lanes; every inner record is explicitly unavailable.",
    waveRows: [
      {
        id: "inner-records",
        label: "inner records",
        cells: laneCells((lane) => ({
          lane,
          state: "unavailable",
          origin: "unavailable",
          detail: "LaneStateRequiresWaveRecords",
        })),
      },
    ],
    panels: [
      {
        label: "Source",
        value: "SourceMapNotBound",
        origin: "unavailable",
      },
      {
        label: "Kernel IR",
        value: "Stopped checkpoint has no authenticated KIR site",
        origin: "unavailable",
      },
      {
        label: "ISA / PC",
        value: "ProgramCounterRequiresRegisterRecord",
        origin: "unavailable",
      },
      {
        label: "Allocation",
        value: "MemoryValuesNotCaptured",
        origin: "unavailable",
      },
    ],
    capabilities: [
      {
        label: "Suspension ownership",
        state: "available",
        origin: "observed",
        detail: "session-retained suspension with exact queue/device binding checks",
      },
      {
        label: "XCC topology",
        state: "available",
        origin: "observed",
        detail: "8 sequential 40-byte CPU-visible headers; non-atomic across XCCs",
      },
      {
        label: "Wave + lane records",
        state: "unavailable",
        origin: "unavailable",
        detail: "WaveRecordLayoutNotInKfdUapi",
      },
      {
        label: "Registers + PC",
        state: "unavailable",
        origin: "unavailable",
        detail: "RegisterRecordLayoutNotInKfdUapi",
      },
    ],
    record: {
      projection_schema: "fe2o3-tutorial-evidence-summary-v1",
      protocol_wire_record: false,
      backend_surface: "direct_kfd_stopped_queue_envelope",
      validated_evidence_scope: "mi300x_live_header_envelopes",
      session_state: "running_with_suspension_retained",
      observed_outer_envelope: {
        envelope_identity: stoppedCheckpointIdentity,
        device: { generation: 1, ordinal: 1 },
        queue: { generation: 1, ordinal: 1 },
        gfx_target_version: 90402,
        xcc_count: 8,
        ownership: "session_retained_suspension",
        resume_required: true,
        context_save: {
          availability: "available",
          context_bytes_per_xcc: 0x1621000,
          total_allocation_bytes: 0xb167000,
          headers: Array.from({ length: 8 }, (_, xccOrdinal) => ({
            xcc_ordinal: xccOrdinal,
            header_bytes: 40,
            observation: "sequential_non_atomic_cpu_shadow",
          })),
        },
      },
      unavailable_inner_records: {
        wave: { status: "unavailable", reason: "WaveRecordLayoutNotInKfdUapi" },
        lane: { status: "unavailable", reason: "LaneStateRequiresWaveRecords" },
        registers: {
          status: "unavailable",
          reason: "RegisterRecordLayoutNotInKfdUapi",
        },
        pc: {
          status: "unavailable",
          reason: "ProgramCounterRequiresRegisterRecord",
        },
      },
    },
  },
  {
    id: "rocgdb-mi",
    label: "ROCgdb / MI thread admission",
    shortLabel: "ROCgdb / MI",
    status: "Generic MI thread admitted",
    scope: "fake-MI tests + installed ROCgdb; GPU classification unavailable",
    summary:
      "A strict parser admits one caller-selected generic thread from structured -thread-info. Host, missing, and GPU-looking target text cannot establish a hardware wave; authorized breakpoint, continue, pause, and step control remain available.",
    evidenceId: admittedMiIdentity,
    origin: "observed",
    matrixLabel: "ROCgdb GPU wave and lane classification availability",
    matrixNote:
      "The deterministic fixture authenticates a generic MI thread record only. Every GPU lane remains unavailable until a separate trusted source correlates that thread to a hardware wave.",
    waveRows: [
      {
        id: "gpu-classification",
        label: "GPU wave unavailable",
        cells: laneCells((lane) => ({
          lane,
          state: "unavailable",
          origin: "unavailable",
          detail: "gpu_classification_unavailable",
        })),
      },
    ],
    panels: [
      {
        label: "Source",
        value: "GPU source site unsupported without authenticated thread correlation",
        origin: "unavailable",
      },
      {
        label: "Kernel IR",
        value: "No KIR site is inferred from a generic MI thread",
        origin: "unavailable",
      },
      {
        label: "ISA / PC",
        value: "Relative GPU PC unsupported",
        origin: "unavailable",
      },
      {
        label: "Allocation",
        value: "Allocation-relative GPU memory unsupported",
        origin: "unavailable",
      },
    ],
    capabilities: [
      {
        label: "Structured generic threads",
        state: "available",
        origin: "observed",
        detail: "caller-selected -thread-info tuple with sanitized logical identity",
      },
      {
        label: "GPU wave + lane state",
        state: "unavailable",
        origin: "unavailable",
        detail: "target-id text is not trusted GPU classification evidence",
      },
      {
        label: "GPU registers + PC + memory",
        state: "unavailable",
        origin: "unavailable",
        detail: "unsupported until a trusted GPU thread correlation exists",
      },
      {
        label: "Pause / continue / step",
        state: "available",
        origin: "observed",
        detail: "authorization identity, expected revision, effect, and audit identity",
      },
    ],
    record: {
      projection_schema: "fe2o3-tutorial-evidence-summary-v1",
      protocol_wire_record: false,
      backend_surface: "rocgdb_mi_generic_thread_admission",
      validated_evidence_scope: "deterministic_fake_mi_fixture",
      live_gpu_stop_validated: false,
      admission: {
        source: "structured_thread_info",
        thread_ordinal: 3,
        thread_identity: admittedMiIdentity,
        classification: "generic_mi_thread",
      },
      gpu_classification: { status: "unavailable", reason: "unsupported" },
      stopped_wave: { status: "unavailable", reason: "unsupported" },
      registers: { status: "unavailable", reason: "unsupported" },
      control: {
        authorization_identity: identity("b5"),
        expected_revision: 4,
        effect: "committed",
        audit_identity: identity("b6"),
      },
    },
  },
  {
    id: "profiler-v4",
    label: "Semantic Profiler Bundle V4",
    shortLabel: "Profiler V4",
    status: "Canonical fixture queried",
    scope: "rocprofv3 structured metadata + ATT references; external decoder retained",
    summary:
      "Bundle V4 answers bounded dispatch, hotspot, comparison, and next-capture queries. Its only numeric cross-bundle delta is total dispatch duration in opaque collector ticks; that requires exact caller-declared environment, tool, configuration, stable-device, KIR, artifact, and dispatch workload identities. Counter Capture V2 is a separate raw-counter path with no stable environment identity or environment-controlled performance conclusion.",
    evidenceId: profilerBundleIdentity,
    origin: "inferred",
    matrixLabel: "Profiler ATT wave and lane event availability",
    matrixNote:
      "An ATT manifest reference is not a decoded wave event. Every lane remains unavailable until supported Compute Viewer output is strictly imported.",
    waveRows: [
      {
        id: "att-events",
        label: "ATT events",
        cells: laneCells((lane) => ({
          lane,
          state: "unavailable",
          origin: "unavailable",
          detail: "decoded ATT event unavailable; reference only",
        })),
      },
    ],
    panels: [
      {
        label: "Source",
        value: "source map identity declared · correlation unauthenticated",
        origin: "declared",
        evidenceId: declarationIdentity,
      },
      {
        label: "Kernel IR",
        value: "canonical KIR V7 content claim bound to dispatch",
        origin: "declared",
        evidenceId: declarationIdentity,
      },
      {
        label: "ISA / PC",
        value: "decoded ATT / relative PC unavailable in this bundle",
        origin: "unavailable",
      },
      {
        label: "Allocation",
        value: "allocation events not represented by dispatch CSV",
        origin: "unavailable",
      },
    ],
    capabilities: [
      {
        label: "Dispatch duration hotspots",
        state: "available",
        origin: "inferred",
        detail: "ranked opaque collector ticks; not causal diagnosis",
      },
      {
        label: "Environment comparison",
        state: "available",
        origin: "declared",
        detail:
          "Bundle V4 identity equality gates its dispatch-duration delta only",
      },
      {
        label: "Counter Capture V2",
        state: "available",
        origin: "inferred",
        detail:
          "separate raw-value deltas; stable environment and performance conclusion unavailable",
      },
      {
        label: "Next-capture plan",
        state: "available",
        origin: "inferred",
        detail: "bounded plan requests supported external ATT decode",
      },
      {
        label: "Wait analysis",
        state: "unavailable",
        origin: "unavailable",
        detail: "decoded ATT wait events are not present",
      },
    ],
    record: {
      projection_schema: "fe2o3-tutorial-evidence-summary-v1",
      protocol_wire_record: false,
      backend_surface: "semantic_profiler_bundle_v4",
      bundle_identity: profilerBundleIdentity,
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
        artifact_identity: "separately_supplied_fixture_claim_available_and_exact",
        ordinary_profile_recipe_artifact_identity: "unavailable",
        unrepresented: ["arguments", "input_content"],
        numeric_dimension: "dispatch_total_duration_ticks",
        clock: "opaque_collector_ticks",
        pc_delta: {
          status: "unavailable",
          reason: "capture_local_code_object_identity",
        },
      },
      counter_capture_v2_comparison: {
        capture_schema: "fe2o3-semantic-counter-capture-v2",
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
      query: "plan_next_capture",
      goal: "explain_waits",
      result: {
        origin: "inferred",
        steps: [
          "decode_att_with_supported_rocprof_compute_viewer",
          "import_decoded_att_when_schema_is_supported",
        ],
        unavailable: [
          "decoded_att_events",
          "wait_events",
          "full_grid_wave_coverage",
        ],
      },
    },
  },
];

export const liveKfdCommand = [
  "fe2o3-debug live-kfd \\",
  "  --bundle-v2 kernel.fe2sim \\",
  "  --request request.json \\",
  "  --hsaco kernel.hsaco \\",
  "  --protocol jsonl --wave-width 64 \\",
  "  -- ./target-app",
].join("\n");

export const liveKfdMilestone = [
  {
    label: "KFD stopped queue envelope",
    state: "sequential headers observed on MI300X",
    truth: "observed",
  },
  {
    label: "KFD inner records",
    state: "not published by KFD UAPI",
    truth: "unavailable",
  },
  {
    label: "ROCgdb / MI generic thread",
    state: "admitted; GPU classification unavailable",
    truth: "observed",
  },
  {
    label: "Profiler V4 queries",
    state: "inferred from canonical fixture",
    truth: "inferred",
  },
] as const;

export const liveKfdUnsupported = [
  "Atomic cross-XCC KFD checkpoint capture; the eight CPU-shadow headers are read sequentially",
  "Direct KFD inner gfx942 wave, lane, register, and PC records",
  "ROCgdb/MI GPU-thread classification and live GPU wave state",
  "Decoded ATT events, waits, and full-grid wave coverage",
  "Authenticated source/KIR/ISA correlation across every backend",
  "Performance prediction or automated causal diagnosis",
] as const;

export const liveKfdComparisonRows: LiveKfdComparisonRow[] = [
  {
    surface: "Artifact and semantic identity",
    fe2o3:
      "Composes exact debugger checkpoint, compiler, simulation, and Profiler Bundle V4 identities while retaining declared, observed, inferred, and unavailable origins.",
    rocgdb:
      "Provides mature live source and machine debugging. It does not use fe2o3's compiler/simulator identity graph or its declaration/proof/observation truth lattice.",
    rocprof:
      "Binds profiler captures to dispatch and machine activity; it is the stronger current source for counters and ATT hardware traces.",
    mojo:
      "The documented debug command delegates to LLDB or cuda-gdb; it does not expose fe2o3's exact KIR/bundle identity chain.",
  },
  {
    surface: "Live hardware depth",
    fe2o3:
      "Direct KFD owns suspension and validates a sequential stopped-queue header envelope, but inner wave/register records remain unavailable. ROCgdb/MI admits generic threads and control; it does not yet authenticate GPU thread or wave state.",
    rocgdb:
      "Ahead today: hardware wavefront threads, lanes, GPU register groups, breakpoints, stepping, and source-oriented live debugging.",
    rocprof:
      "Ahead today for performance: counters, timing, kernel traces, ATT, and Compute Viewer workflows.",
    mojo:
      "GPU debugging depends on the delegated backend and platform rather than a Mojo-native semantic protocol.",
  },
  {
    surface: "Agent interaction",
    fe2o3:
      "Strict bounded records join logical IDs, exact evidence links, revisions, typed unavailable results, control effects, profiler queries, comparisons, and next-capture plans. GPU-looking MI text cannot upgrade a generic thread into wave truth.",
    rocgdb:
      "GDB/MI is scriptable and mature, but its generic debugger model does not encode fe2o3 semantic evidence or exact CPU-reference correlation.",
    rocprof:
      "Machine-readable capture formats support automation, with analysis typically performed after collection rather than as one debugger state machine.",
    mojo:
      "Automation follows the selected LLDB or cuda-gdb interface.",
  },
  {
    surface: "Deterministic semantic replay",
    fe2o3:
      "The same binding can identify a separate bounded CPU semantic replay with thread, logical-wave, workgroup, KIR, SSA, and allocation-relative state. It never labels that replay as hardware state.",
    rocgdb:
      "Inspects the live machine; it does not provide fe2o3's deterministic KIR transcript and reverse semantic navigation.",
    rocprof:
      "Captures hardware performance evidence, not a deterministic language-level execution model.",
    mojo:
      "No equivalent deterministic GPU semantic replay is documented in the delegated debug flow.",
  },
  {
    surface: "Performance evidence",
    fe2o3:
      "Profiler Bundle V4 imports strict rocprofv3 metadata and ATT references, joins absolute agent IDs to stable KFD node identities by key, and compares only total dispatch duration when its caller-declared environment/tool/configuration/device/workload/KIR/artifact identities are exact. Counter Capture V2 separately computes raw-value deltas for exact counter definitions and matching dispatch declarations; its stable environment is unavailable, so the result is not an environment-controlled performance conclusion. Cross-run PC deltas and decoded waits remain unavailable.",
    rocgdb:
      "Interactive debugger state is its focus; it does not replace rocprof's counter and ATT collection workflows.",
    rocprof:
      "Owns the current collection and Compute Viewer decode path. fe2o3 preserves its references instead of reimplementing the decoder.",
    mojo:
      "Profiler capabilities follow the selected platform tooling rather than a documented Mojo-native semantic capture bundle.",
  },
  {
    surface: "Cross-run PC comparison",
    fe2o3:
      "Typed unavailable: PC Sample V3 code-object identities are capture-local. A future stable cross-run code-object identity is required before numeric PC deltas are safe.",
    rocgdb:
      "Can inspect a relative PC within one admitted stop; that does not establish cross-run profiler identity.",
    rocprof:
      "Collects PC samples, while stable semantic cross-run code-object correlation remains a separate evidence obligation.",
    mojo:
      "No documented Mojo-native stable cross-run code-object identity contract is used here.",
  },
];

export const liveKfdSources = [
  {
    label: "Live KFD CLI contract",
    path: "crates/fe2o3-debug-cli/README.md",
  },
  {
    label: "V3 wire protocol",
    path: "crates/fe2o3-debug-protocol/src/live_gpu_v3.rs",
  },
  {
    label: "MI300X acceptance test",
    path: "crates/fe2o3-debug-cli/tests/live_kfd_v3_live.rs",
  },
  {
    label: "Target telemetry transport",
    path: "crates/fe2o3-kfd/src/target_debug_telemetry_v1.rs",
  },
  {
    label: "Stopped queue producer",
    path: "crates/fe2o3-kfd/src/stopped_state_v1.rs",
  },
  {
    label: "ROCgdb MI protocol",
    path: "crates/fe2o3-debug-protocol/src/rocgdb_mi_v3.rs",
  },
  {
    label: "ROCgdb MI live backend",
    path: "crates/fe2o3-debug-cli/src/rocgdb_mi_v3.rs",
  },
  {
    label: "ROCgdb JSONL coordinator",
    path: "crates/fe2o3-debug-cli/src/live_rocgdb_v3.rs",
  },
  {
    label: "rocprofv3 orchestrator",
    path: "crates/cargo-fe2o3/src/profile_command.rs",
  },
  {
    label: "Profiler V4 importer",
    path: "crates/fe2o3-semantic-import/src/profiler_bundle.rs",
  },
  {
    label: "Profiler V4 queries",
    path: "crates/fe2o3-semantic-query/src/profiler_query.rs",
  },
] as const;

export const liveKfdCurrentImplementationPaths = [
  "crates/fe2o3-kfd/src/stopped_state_v1.rs",
  "crates/fe2o3-debug-protocol/src/rocgdb_mi_v3.rs",
  "crates/fe2o3-debug-cli/src/rocgdb_mi_parser_v3.rs",
  "crates/fe2o3-debug-cli/src/rocgdb_mi_v3.rs",
  "crates/fe2o3-debug-cli/src/live_rocgdb_v3.rs",
  "crates/cargo-fe2o3/src/profile_command.rs",
  "crates/fe2o3-semantic-import/src/profiler_bundle.rs",
  "crates/fe2o3-semantic-query/src/profiler_query.rs",
] as const;
