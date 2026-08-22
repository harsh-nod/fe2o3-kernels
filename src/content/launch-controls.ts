import { deepFreeze, hasOwn } from "./registry";

export type LaunchControlMilestoneId =
  | "authenticated-preparation-v1"
  | "authenticated-preflight-v1";

const launchControlOrder = [
  "authenticated-preparation-v1",
  "authenticated-preflight-v1",
] as const satisfies readonly LaunchControlMilestoneId[];

export interface LaunchControlEvidence {
  receiptPath: string;
  manifestSha256: string;
  sourceTree: string;
  preparationSha256: string;
  rawWorktreeSha256: string;
  runnerSha256?: string;
  resultSha256?: string;
}

export interface LaunchControlMilestone {
  id: LaunchControlMilestoneId;
  number: "P1" | "P2";
  title: string;
  status: "Receipt committed" | "Receipt reviewed";
  scope: "Preparation only" | "Preflight only";
  summary: string;
  why: readonly string[];
  enables: readonly string[];
  commands: readonly string[];
  expected: readonly string[];
  limitations: readonly string[];
  evidence: LaunchControlEvidence;
}

const PREPARATION_RECEIPT_COMMANDS = [
  "cd /home/harsh/m350-v2/prep-r",
  "/usr/bin/sha256sum receipt-manifest-v1.txt",
  "/usr/bin/sha256sum -c receipt-manifest-v1.txt",
  "/usr/bin/grep -E '\"(application_executed|live_kfd_gpu_command_run|phase1|phase2|phase3|result)\"' summary.json",
] as const;

const PREFLIGHT_RECEIPT_COMMANDS = [
  "cd /home/harsh/m350-v2/preflight-r3",
  "/usr/bin/sha256sum receipt-manifest-v1.txt result.txt runner.sh",
  "/usr/bin/sha256sum -c receipt-manifest-v1.txt",
  "/usr/bin/grep -E '^(result|build_phase_command_count|cargo_config_query_count|cargo_metadata_query_count|successful_cargo_exec_count|application_never_executed|live_kfd_gpu_command_never_invoked)=' result.txt",
] as const;

const launchControlPolicy = {
  "authenticated-preparation-v1": {
    number: "P1",
    status: "Receipt committed",
    scope: "Preparation only",
    commands: PREPARATION_RECEIPT_COMMANDS,
    evidence: {
      receiptPath: "/home/harsh/m350-v2/prep-r",
      manifestSha256:
        "08fcbdb9020960c32151585ec131c27c0c76a37d55de9e4a81b260ca85be2ab0",
      sourceTree: "6f82c75c948632005cd12e623a6dbc9acb6213b9",
      preparationSha256:
        "4d95ff570e3de0bb3f6877b7bcf15e3e6a046e7f9cc65b6b7669fda8ce6e1fac",
      rawWorktreeSha256:
        "bc9dcd991886d1b17e3b1ad8e6dda2cb6b0ff38b064feb435ab6b3149b4f2b97",
    },
  },
  "authenticated-preflight-v1": {
    number: "P2",
    status: "Receipt reviewed",
    scope: "Preflight only",
    commands: PREFLIGHT_RECEIPT_COMMANDS,
    evidence: {
      receiptPath: "/home/harsh/m350-v2/preflight-r3",
      manifestSha256:
        "81d5c89ae4d843e609cf7c2597f5f5f562d9cd7c54ac3b056cd66bccfe0898f6",
      sourceTree: "6f82c75c948632005cd12e623a6dbc9acb6213b9",
      preparationSha256:
        "4d95ff570e3de0bb3f6877b7bcf15e3e6a046e7f9cc65b6b7669fda8ce6e1fac",
      rawWorktreeSha256:
        "bc9dcd991886d1b17e3b1ad8e6dda2cb6b0ff38b064feb435ab6b3149b4f2b97",
      runnerSha256:
        "97ed45265f4144eb7adf46f83865acffdc55a4c35512b6f382986daba5ebebab",
      resultSha256:
        "e85d45bb98304f4afd9a34025bd4673f022850f74c2aa8f3c5a671c47f1f2928",
    },
  },
} as const satisfies Record<LaunchControlMilestoneId, {
  number: LaunchControlMilestone["number"];
  status: LaunchControlMilestone["status"];
  scope: LaunchControlMilestone["scope"];
  commands: readonly string[];
  evidence: LaunchControlEvidence;
}>;

export const launchControlMilestones = deepFreeze([
  {
    id: "authenticated-preparation-v1",
    number: "P1",
    title: "Authenticated compiler-build preparation",
    status: "Receipt committed",
    scope: "Preparation only",
    summary:
      "A fresh m350-v2 root now binds the exact compiler candidate, raw worktree, vendored dependency closure, Cargo configuration, Rust toolchain, ROCm tools, and sealed supervisor inputs in one committed preparation receipt. The transaction stopped before every compiler-build phase.",
    why: [
      "A later build is meaningful only if its source, dependency graph, toolchain, and control binaries are the identities reviewers approved. The preparation receipt turns those inputs into a closed, content-addressed set instead of relying on mutable caches or ambient configuration.",
      "Preparation is deliberately separate from compilation. Reviewers can validate checkout modes, offline vendor coverage, Cargo discovery, dynamic ELF dependencies, sealed executable inputs, and the raw source closure before an expensive or privileged action begins.",
      "The receipt is fail-closed and self-verifying: 62 manifest records authenticate with exact hashes, while its committed result explicitly records every compiler phase, application action, and live GPU action as not run.",
    ],
    enables: [
      "A preflight can compare the live host against the same candidate, vendor, toolchain, and helper identities without fetching dependencies or modifying the prepared worktree.",
      "A future build receipt can bind its artifacts to one reviewed source tree and one exact preparation manifest rather than to an informal machine state.",
      "Any later drift can be localized to a specific source, configuration, archive, tool, mode, or dynamic dependency before generated artifacts receive authority.",
    ],
    commands: PREPARATION_RECEIPT_COMMANDS,
    expected: [
      "The manifest digest is 08fcbdb9020960c32151585ec131c27c0c76a37d55de9e4a81b260ca85be2ab0 and all 62 listed records report OK.",
      "The summary result is PASS_PREPARATION_ONLY_NO_COMPILER_BUILD and all three compiler phases are NOT_RUN.",
      "Application execution and live KFD/GPU use are false; the receipt grants preparation authority only.",
    ],
    limitations: [
      "No compiler phase, preflight query, application, KFD command, or GPU workload ran during this milestone.",
      "This receipt authenticates one prepared host root. It is not a signed release, a general reproducible-build proof, or evidence that the candidate compiles successfully.",
      "Hashes, modes, and link counts are cooperative same-UID host evidence. They do not prevent the owner from replacing or deleting paths later, and no filesystem permanence is claimed.",
      "The old /home/harsh/m350 root remains separate and unchanged; only /home/harsh/m350-v2 and its exact receipt belong to this control record.",
    ],
    evidence: {
      receiptPath: "/home/harsh/m350-v2/prep-r",
      manifestSha256:
        "08fcbdb9020960c32151585ec131c27c0c76a37d55de9e4a81b260ca85be2ab0",
      sourceTree: "6f82c75c948632005cd12e623a6dbc9acb6213b9",
      preparationSha256:
        "4d95ff570e3de0bb3f6877b7bcf15e3e6a046e7f9cc65b6b7669fda8ce6e1fac",
      rawWorktreeSha256:
        "bc9dcd991886d1b17e3b1ad8e6dda2cb6b0ff38b064feb435ab6b3149b4f2b97",
    },
  },
  {
    id: "authenticated-preflight-v1",
    number: "P2",
    title: "Authenticated compiler-build preflight",
    status: "Receipt reviewed",
    scope: "Preflight only",
    summary:
      "The prepared MI300X host now passes the complete preflight contract: caller contamination tests, offline Cargo configuration and metadata queries, source and dependency closure checks, orchestration and dynamic-tool identities, and byte-identical before/after snapshots. It produced no compiler artifact and invoked no live KFD/GPU command.",
    why: [
      "The joined compiler path depends on more than source bytes. Preflight proves that Cargo resolution, system helpers, Rust and ROCm tools, loader dependencies, signal supervision, and the prepared filesystem still match before compilation is authorized.",
      "Each of the two Cargo configuration queries and the frozen offline metadata query ran under the native supervisor with setup and seccomp checks, terminal observation, descendant draining, and a frozen result record. This closes the gap between a static checklist and the exact Cargo behavior the build will inherit.",
      "The final receipt contains 110 authenticated records and 15 byte-identical before/after files: 13 policy identities plus configuration status and diagnostic companions. In particular, /usr/bin/kill and its loader/libc closure are measured rather than silently trusted, while build count remains zero.",
    ],
    enables: [
      "The next build-only transaction can authenticate manifest 81d5c89a... before creating any target directory, then compare the same 13 policy identities against fresh current snapshots.",
      "A reviewer can distinguish harmless configuration and metadata queries from compilation: two config queries and one offline metadata query ran, while successful build-Cargo executions remained zero.",
      "The compiler build now has one exact authorization boundary. Any changed runner, helper, dependency, source, tool, mode, or system closure fails before artifact generation.",
    ],
    commands: PREFLIGHT_RECEIPT_COMMANDS,
    expected: [
      "The manifest is 81d5c89ae4d843e609cf7c2597f5f5f562d9cd7c54ac3b056cd66bccfe0898f6 and all 110 listed records report OK.",
      "The result is PASS_PREFLIGHT_ONLY_NO_COMPILER_BUILD with build_phase_command_count=0 and successful_cargo_exec_count=0.",
      "The counters show two Cargo config queries and one frozen offline metadata query; application_never_executed and live_kfd_gpu_command_never_invoked are true.",
    ],
    limitations: [
      "This is host preflight evidence, not milestone 05 and not a compiler build or compiler-generated GPU observation.",
      "No launcher, backend, application, HSACO, numerical result, KFD packet, latency, throughput, or performance claim exists. KFD access is intentionally unproven because no live command ran.",
      "Before/after equality is cooperative same-UID host evidence. It does not prevent the owner from replacing or deleting paths after the receipt, and no filesystem permanence is claimed.",
      "The receipt authorizes only the exact reviewed build command after a separate explicit user gate. It does not authorize automatic retry, application execution, or a GPU launch.",
    ],
    evidence: {
      receiptPath: "/home/harsh/m350-v2/preflight-r3",
      manifestSha256:
        "81d5c89ae4d843e609cf7c2597f5f5f562d9cd7c54ac3b056cd66bccfe0898f6",
      sourceTree: "6f82c75c948632005cd12e623a6dbc9acb6213b9",
      preparationSha256:
        "4d95ff570e3de0bb3f6877b7bcf15e3e6a046e7f9cc65b6b7669fda8ce6e1fac",
      rawWorktreeSha256:
        "bc9dcd991886d1b17e3b1ad8e6dda2cb6b0ff38b064feb435ab6b3149b4f2b97",
      runnerSha256:
        "97ed45265f4144eb7adf46f83865acffdc55a4c35512b6f382986daba5ebebab",
      resultSha256:
        "e85d45bb98304f4afd9a34025bd4673f022850f74c2aa8f3c5a671c47f1f2928",
    },
  },
] satisfies LaunchControlMilestone[]);

function hasExactSequence(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

export function validateLaunchControlMilestones(
  milestones: readonly LaunchControlMilestone[] = launchControlMilestones,
): string[] {
  const exactObject = /^[0-9a-f]{40}$/u;
  const exactDigest = /^[0-9a-f]{64}$/u;
  const ids = new Set<string>();
  const issues: string[] = [];

  if (
    milestones.length !== launchControlOrder.length ||
    milestones.some(
      (milestone, index) => milestone.id !== launchControlOrder[index],
    )
  ) {
    issues.push("catalog: launch-control order differs from policy");
  }

  for (const milestone of milestones) {
    if (ids.has(milestone.id)) {
      issues.push(`${milestone.id}: duplicate launch-control ID`);
    }
    ids.add(milestone.id);
    if (!hasOwn(launchControlPolicy, milestone.id)) {
      issues.push(`${String(milestone.id)}: unknown launch-control ID`);
      continue;
    }
    const evidence = milestone.evidence;
    const policy =
      launchControlPolicy[milestone.id as LaunchControlMilestoneId];
    const canonical = launchControlMilestones.find(
      (entry) => entry.id === milestone.id,
    );
    if (
      !exactObject.test(evidence.sourceTree) ||
      !exactDigest.test(evidence.manifestSha256) ||
      !exactDigest.test(evidence.preparationSha256) ||
      !exactDigest.test(evidence.rawWorktreeSha256) ||
      (evidence.runnerSha256 !== undefined &&
        !exactDigest.test(evidence.runnerSha256)) ||
      (evidence.resultSha256 !== undefined &&
        !exactDigest.test(evidence.resultSha256))
    ) {
      issues.push(`${milestone.id}: launch-control evidence is not exactly bound`);
    }
    if (
      milestone.number !== policy.number ||
      milestone.status !== policy.status ||
      milestone.scope !== policy.scope
    ) {
      issues.push(`${milestone.id}: launch-control classification differs from policy`);
    }
    if (JSON.stringify(evidence) !== JSON.stringify(policy.evidence)) {
      issues.push(`${milestone.id}: receipt evidence differs from policy`);
    }
    if (!hasExactSequence(milestone.commands, policy.commands)) {
      issues.push(`${milestone.id}: receipt commands differ from policy`);
    }
    if (
      canonical === undefined ||
      milestone.title !== canonical.title ||
      milestone.summary !== canonical.summary ||
      !hasExactSequence(milestone.why, canonical.why) ||
      !hasExactSequence(milestone.enables, canonical.enables) ||
      !hasExactSequence(milestone.expected, canonical.expected) ||
      !hasExactSequence(milestone.limitations, canonical.limitations)
    ) {
      issues.push(`${milestone.id}: launch-control claims differ from policy`);
    }
    const boundary = milestone.limitations.join(" ");
    if (!/No (?:compiler phase|launcher)/u.test(boundary) || !/GPU/u.test(boundary)) {
      issues.push(`${milestone.id}: launch-control boundary is incomplete`);
    }
  }
  return issues;
}
