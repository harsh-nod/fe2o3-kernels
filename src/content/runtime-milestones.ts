import { deepFreeze } from "./registry";

export type RuntimeMilestoneId = "runtime-ownership-pipeline-v2";

export interface RuntimeMilestone {
  id: RuntimeMilestoneId;
  number: string;
  title: string;
  state: "implemented";
  status: "implementation-checked";
  summary: string;
  why: readonly string[];
  enables: readonly string[];
  commands: readonly string[];
  expected: readonly string[];
  limitations: readonly string[];
  commit: string;
  tree: string;
  sourcePaths: readonly string[];
}

export const runtimeMilestones = deepFreeze([
  {
    id: "runtime-ownership-pipeline-v2",
    number: "00",
    title: "One runtime ownership pipeline",
    state: "implemented",
    status: "implementation-checked",
    summary:
      "The native KFD runtime now uses one ownership pipeline for queue submission, completion, retirement, and destruction across its supported single- and two-queue compositions.",
    why: [
      "A GPU packet can outlive the CPU call that published it. Linear queue, dispatch, completion, and resource owners prevent a timeout or dropped value from being mistaken for cancellation.",
      "The executable OutstandingDispatchRegistryStateV1 is the canonical projection. Native transitions compute its successor before mutating the concrete authority table, keeping modeled state and retained KFD ownership aligned.",
      "Removing duplicate submit and teardown paths gives later compiler-generated launches one reviewed protocol to target. That refactored protocol has not yet been hardware-measured at this commit.",
    ],
    enables: [
      "A public synchronous launch facade that can preserve ownership without exposing raw addresses or diagnostic environment switches.",
      "Bounded multi-dispatch execution with exact completion identity, per-queue FIFO retirement, and certificate-gated destruction.",
      "Measured optimization of the fixed 64-slot registry without first reconciling competing implementations.",
    ],
    commands: [
      "cargo test -p fe2o3-runtime-model --locked",
      "cargo test -p fe2o3-kfd --features live-validation --locked",
      "cargo clippy -p fe2o3-kfd --all-targets --all-features --locked -- -D warnings",
    ],
    expected: [
      "87 runtime-model tests pass, including 100,000 sequential dispatch retirements without capacity exhaustion.",
      "The KFD live-validation suite passes without opening /dev/kfd or running a GPU kernel.",
      "Strict all-feature Clippy completes with warnings promoted to errors.",
    ],
    limitations: [
      "This commit has source, unit, and retained oracle coverage, but its current V2 runtime identities have not yet been re-observed on MI300X.",
      "Packet submission, one-step polling, release, and retirement remain crate-private until the synchronous facade can preserve the same linear authority.",
      "The historical first-kernel V1 observation remains evidence for its original frozen source only.",
    ],
    commit: "e5c8d66c5520d1bce7cf2db911c200f1cf4c5536",
    tree: "1c694eed427526dc507a129a721237613bafe094",
    sourcePaths: [
      "crates/fe2o3-kfd/ARCHITECTURE.md",
      "crates/fe2o3-kfd/src/queue_live.rs",
      "crates/fe2o3-kfd/src/queue_submit.rs",
      "crates/fe2o3-runtime-model/src/outstanding_dispatch_registry.rs",
    ],
  },
] satisfies RuntimeMilestone[]);

export function validateRuntimeMilestones(): string[] {
  const exactObject = /^[0-9a-f]{40}$/u;
  const ids = new Set<string>();
  const issues: string[] = [];

  for (const milestone of runtimeMilestones) {
    if (ids.has(milestone.id)) {
      issues.push(`${milestone.id}: duplicate milestone ID`);
    }
    ids.add(milestone.id);
    if (!exactObject.test(milestone.commit) || !exactObject.test(milestone.tree)) {
      issues.push(`${milestone.id}: milestone lacks exact commit and tree`);
    }
    if (milestone.commands.length === 0 || milestone.sourcePaths.length === 0) {
      issues.push(`${milestone.id}: milestone is not independently inspectable`);
    }
    if (
      milestone.commands.some((command) =>
        /(?:FE2O3_RUN|\/dev\/kfd|kfd-vecadd)/u.test(command),
      )
    ) {
      issues.push(`${milestone.id}: try-it commands must be hardware-safe`);
    }
  }
  return issues;
}
