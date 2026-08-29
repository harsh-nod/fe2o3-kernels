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
    label: "Exact executable",
    state: "observed after exec stop",
    truth: "observed",
  },
  {
    label: "HSACO",
    state: "inspected and target-declared",
    truth: "declared",
  },
  {
    label: "Runtime + queue",
    state: "observed through direct KFD",
    truth: "observed",
  },
  {
    label: "GPU execution identity",
    state: "not observed",
    truth: "unavailable",
  },
] as const;

export const liveKfdUnsupported = [
  "Stopped dispatch, workgroup, wave, and lane state",
  "PC, ISA, KIR, and source location at a hardware stop",
  "Scalar/vector registers and CWSR decode",
  "Allocation-relative target-memory reads",
  "Hardware breakpoints, stepping, and reverse execution",
] as const;

export const liveKfdComparisonRows: LiveKfdComparisonRow[] = [
  {
    surface: "Artifact and semantic identity",
    fe2o3:
      "Binds exact Bundle V2, request, KIR, Source Map V2, inspected COV6 HSACO, and the launch-owned executable. Target declarations and execution observations are separate fields.",
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
      "Today: direct-KFD runtime, device and queue lifecycle, exception events, suspend/resume, and termination. Wave, lane, PC, registers, memory, breakpoints, and stepping remain unavailable.",
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
      "One strict bounded JSONL protocol, closed operations, stable logical IDs, explicit stale revisions, typed unavailable results, and committed/partial/indeterminate effects.",
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
