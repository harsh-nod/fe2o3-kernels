import milestoneData from "../../config/live-kfd-debugger-milestone.json";
import { deepFreeze } from "./registry";

export type LiveKfdOperationId =
  | "binding"
  | "queues"
  | "suspend"
  | "semantics";

export interface LiveKfdOperationExample {
  id: LiveKfdOperationId;
  label: string;
  summary: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

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
const bindingIdentity = identity("11");
const codeObjectIdentity = identity("22");
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
    label: "Direct KFD checkpoint",
    shortLabel: "Direct KFD",
    status: "MI300X header envelopes observed",
    scope: "gfx942 · KFD 1.18 · session-owned suspension",
    summary:
      "The session owns the stopped checkpoint and validates device, queue, save-area, and eight XCC header envelopes. Linux KFD does not publish the inner gfx942 wave/register record layout.",
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
        label: "Checkpoint ownership",
        state: "available",
        origin: "observed",
        detail: "session-owned suspension with queue/device snapshots before and after",
      },
      {
        label: "XCC topology",
        state: "available",
        origin: "observed",
        detail: "8 × 40-byte CPU-visible context header envelopes",
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
      backend: "direct_kfd",
      result: "stopped_checkpoint",
      validation_scope: "mi300x_live_header_envelopes",
      checkpoint_identity: stoppedCheckpointIdentity,
      device: { generation: 1, ordinal: 1 },
      queue: { generation: 1, ordinal: 1 },
      target: 90402,
      xcc_count: 8,
      context_header_bytes_per_xcc: 40,
      context_save_area_bytes_per_xcc: 0x1621000,
      allocation_bytes: 0xb167000,
      debug_region_bytes: 0x5f000,
      inner_records: {
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
    label: "ROCgdb / MI admission",
    shortLabel: "ROCgdb / MI",
    status: "Deterministic transcript admitted",
    scope: "fake-MI tests + installed capability discovery; live GPU stop unvalidated",
    summary:
      "A strict parser admits one caller-selected GPU thread from structured -thread-info, then sanitizes stopped wave, logical lanes, relative PC, registers, values, memory, and control audit records.",
    evidenceId: admittedMiIdentity,
    origin: "observed",
    matrixLabel: "Admitted ROCgdb transcript waves by logical lanes",
    matrixNote:
      "These cells reproduce a deterministic fake-MI fixture. Active lanes require the token-correlated exec register mask; this is not evidence of a validated live GPU stop.",
    waveRows: [
      {
        id: "wave-3",
        label: "wave 3 · SIMD 1",
        cells: laneCells((lane) => ({
          lane,
          state: lane < 8 ? "active" : "inactive",
          origin: "observed",
          evidenceId: admittedMiIdentity,
          detail:
            lane < 8
              ? "active in admitted exec mask 0x00000000000000ff"
              : "inactive in admitted exec mask 0x00000000000000ff",
        })),
      },
      {
        id: "wave-9",
        label: "wave 9 · mask absent",
        cells: laneCells((lane) => ({
          lane,
          state: "unavailable",
          origin: "unavailable",
          detail: "not_captured: token-correlated exec register unavailable",
        })),
      },
    ],
    panels: [
      {
        label: "Source",
        value: "admitted span · file identity 7c…e1 · bytes 420–438",
        origin: "observed",
        evidenceId: admittedMiIdentity,
      },
      {
        label: "Kernel IR",
        value: "caller-bound fn 0 · bb 3 · op 12",
        origin: "declared",
        evidenceId: declarationIdentity,
      },
      {
        label: "ISA / PC",
        value: "code object + 0x1f18 · instruction text unavailable",
        origin: "observed",
        evidenceId: admittedMiIdentity,
      },
      {
        label: "Allocation",
        value: "allocation 1:g0 + 32 · 4 bytes",
        origin: "observed",
        evidenceId: admittedMiIdentity,
      },
    ],
    capabilities: [
      {
        label: "Stopped wave + logical lanes",
        state: "available",
        origin: "observed",
        detail: "available in admitted structured transcript only",
      },
      {
        label: "Relative PC + registers",
        state: "available",
        origin: "observed",
        detail: "native addresses are sanitized before admission",
      },
      {
        label: "Allocation-relative memory",
        state: "available",
        origin: "observed",
        detail: "bounded exact fixture; no native address returned",
      },
      {
        label: "Pause / continue / step",
        state: "available",
        origin: "observed",
        detail: "authorization identity, expected revision, effect, and audit identity",
      },
    ],
    record: {
      backend: "rocgdb_mi",
      result: "stopped_wave",
      validation_scope: "deterministic_fake_mi_fixture",
      live_gpu_stop_validated: false,
      selected_thread: { source: "structured_thread_info", ordinal: 3 },
      wave: { identity: identity("b4"), logical_lanes: 64 },
      exec: { value: "0x00000000000000ff", origin: "observed" },
      pc: {
        encoding: "code_object_relative",
        code_object: codeObjectIdentity,
        byte_offset: 7960,
      },
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
      "Bundle V4 answers bounded dispatch, hotspot, comparison, and next-capture queries. Numeric duration and counter deltas require exact environment, tool, configuration, stable-device, dispatch sequence/device/launch, KIR, and artifact identities; arguments and input content remain unrepresented.",
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
          "exact environment/tool/config/device and dispatch/KIR/artifact identity equality",
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
      backend: "semantic_profiler_bundle_v4",
      bundle_identity: profilerBundleIdentity,
      comparison: {
        status: "comparable_for_duration_and_raw_counters",
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
        pc_delta: {
          status: "unavailable",
          reason: "capture_local_code_object_identity",
        },
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

const session = (revision: number, commandsProcessed: number) => ({
  backend: "direct_kfd",
  state: "running",
  revision,
  commands_processed: commandsProcessed,
  observation_sequence: 2,
  identity_generation: 1,
  runtime_enabled: true,
  binding_identity: bindingIdentity,
});

const unavailableTruth = { origin: "unavailable", evidence: [] };
const declarationTruth = {
  origin: "declared",
  evidence: [{ kind: "declaration", identity: declarationIdentity }],
};

export const liveKfdCommand = [
  "fe2o3-debug live-kfd \\",
  "  --bundle-v2 kernel.fe2sim \\",
  "  --request request.json \\",
  "  --hsaco kernel.hsaco \\",
  "  --protocol jsonl --wave-width 64 \\",
  "  -- ./target-app",
].join("\n");

export const liveKfdOperations: LiveKfdOperationExample[] = [
  {
    id: "binding",
    label: "Exact binding",
    summary:
      "The debugger distinguishes admitted bytes, a matching target declaration, and the still-unobserved execution identity.",
    request: {
      schema: "fe2o3-live-gpu-debug-request-v3",
      operation: "get_session_binding",
      request_id: 1,
      expected_revision: 0,
    },
    response: {
      status: "ok",
      schema: "fe2o3-live-gpu-debug-response-v3",
      request_id: 1,
      operation: "get_session_binding",
      session: session(0, 1),
      result: {
        result: "session_binding",
        binding: {
          binding_identity: bindingIdentity,
          code_object_version: 6,
          declared_code_object: {
            digest: codeObjectIdentity,
            canonical_bytes: 512,
          },
          declaration: declarationTruth,
          target_declared_code_object: {
            status: "available",
            value: {
              digest: codeObjectIdentity,
              canonical_bytes: 512,
            },
            truth: declarationTruth,
          },
          target_telemetry: {
            status: "available",
            value: {
              records: 3,
              artifact_records: 2,
              dispatch_records: 0,
              allocation_records: 0,
              diagnostic_records: 0,
              session_ended: false,
            },
            truth: declarationTruth,
          },
          execution_code_object: {
            status: "unavailable",
            reason: "not_observed",
            truth: unavailableTruth,
          },
          kernel_ir_v7: {
            digest: identity("44"),
            canonical_bytes: 320,
          },
          source_map_v2: {
            digest: identity("55"),
            canonical_bytes: 1040,
          },
          cpu_reference: {
            bundle_identity: identity("66"),
            request_identity: identity("77"),
            configuration_identity: identity("88"),
            deterministic_evidence: {
              status: "unavailable",
              reason: "not_captured",
            },
          },
        },
      },
    },
  },
  {
    id: "queues",
    label: "Live queues",
    summary:
      "KFD supplies a generation-scoped logical queue identity without exposing the native queue ID, PID, descriptor, or GPU address.",
    request: {
      schema: "fe2o3-live-gpu-debug-request-v3",
      operation: "inspect_hardware_queues",
      request_id: 2,
      expected_revision: 0,
      page: { expected_generation: 0, start: 0, limit: 16 },
    },
    response: {
      status: "ok",
      schema: "fe2o3-live-gpu-debug-response-v3",
      request_id: 2,
      operation: "inspect_hardware_queues",
      session: session(0, 2),
      result: {
        result: "hardware",
        hardware: {
          result: "queues",
          generation: 1,
          items: [
            {
              id: { generation: 1, ordinal: 1 },
              device: { generation: 1, ordinal: 1 },
              ring_bytes: 4096,
              queue_type: 0,
              context_save_area_bytes: 185036800,
              suspended_by_session: false,
            },
          ],
          next_start: 0,
        },
      },
    },
  },
  {
    id: "suspend",
    label: "Queue control",
    summary:
      "A committed KFD mutation advances the control revision; partial or indeterminate effects use distinct result classes.",
    request: {
      schema: "fe2o3-live-gpu-debug-request-v3",
      operation: "suspend_queues",
      request_id: 3,
      expected_revision: 0,
      queues: [{ generation: 1, ordinal: 1 }],
      grace_period: 0,
    },
    response: {
      status: "ok",
      schema: "fe2o3-live-gpu-debug-response-v3",
      request_id: 3,
      operation: "suspend_queues",
      session: session(1, 3),
      result: {
        result: "hardware",
        hardware: {
          result: "queue_control",
          outcomes: [
            {
              queue: { generation: 1, ordinal: 1 },
              state: "complete",
            },
          ],
          effect: "committed",
        },
      },
    },
  },
  {
    id: "semantics",
    label: "Honest absence",
    summary:
      "The live backend does not fabricate a stopped wave, PC, register file, or source site from a queue snapshot or CPU replay.",
    request: {
      schema: "fe2o3-live-gpu-debug-request-v3",
      operation: "inspect_stopped_scopes",
      request_id: 4,
      expected_revision: 0,
      binding_identity: bindingIdentity,
      stop_identity: identity("99"),
      scope: {
        level: "dispatch",
        dispatch: { domain: "runtime_model", identity: identity("aa") },
      },
      page: {
        snapshot_identity: identity("bb"),
        start: 0,
        limit: 16,
      },
    },
    response: {
      status: "unavailable",
      schema: "fe2o3-live-gpu-debug-response-v3",
      request_id: 4,
      operation: "inspect_stopped_scopes",
      session: session(0, 4),
      reason: "unsupported",
    },
  },
];

export const liveKfdMilestone = [
  {
    label: "KFD checkpoint headers",
    state: "observed on MI300X",
    truth: "observed",
  },
  {
    label: "KFD inner records",
    state: "not published by KFD UAPI",
    truth: "unavailable",
  },
  {
    label: "ROCgdb / MI state",
    state: "observed in deterministic fixture",
    truth: "observed",
  },
  {
    label: "Profiler V4 queries",
    state: "inferred from canonical fixture",
    truth: "inferred",
  },
] as const;

export const liveKfdUnsupported = [
  "Direct KFD inner gfx942 wave, lane, register, and PC records",
  "Live-GPU validation of the ROCgdb/MI stopped-state substrate",
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
      "Direct KFD owns suspension and validates stopped header topology, but inner wave/register records remain unavailable. ROCgdb/MI stopped-state support is structurally tested, not live-stop validated.",
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
      "Strict bounded records join logical IDs, exact evidence links, revisions, typed unavailable results, control effects, profiler queries, comparisons, and next-capture plans.",
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
      "Imports strict rocprofv3 metadata and ATT references into a content-addressed bundle. Duration and raw-counter deltas require exact environment/tool/configuration/stable-device plus dispatch sequence/device/launch, KIR, and artifact identities. Arguments and input content are unrepresented; cross-run PC deltas and decoded waits remain unavailable.",
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
] as const;

export const liveKfdCurrentImplementationPaths = [
  "crates/fe2o3-kfd/src/stopped_state_v1.rs",
  "crates/fe2o3-debug-protocol/src/rocgdb_mi_v3.rs",
  "crates/fe2o3-debug-cli/src/rocgdb_mi_parser_v3.rs",
  "crates/fe2o3-debug-cli/src/rocgdb_mi_v3.rs",
  "crates/fe2o3-semantic-import/src/profiler_bundle.rs",
  "crates/fe2o3-semantic-query/src/profiler_query.rs",
] as const;
