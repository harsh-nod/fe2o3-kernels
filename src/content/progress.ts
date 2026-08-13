import { FE2O3_PIN } from "./model";

export type DeliveryGate = "complete" | "partial" | "blocked" | "planned";

export interface KernelProgress {
  id: string;
  kernel: string;
  run: DeliveryGate;
  verify: DeliveryGate;
  evidence: DeliveryGate;
  dependsOn: string[];
  next: string;
}

export interface DevelopmentCheckpoint {
  name: string;
  commit: string;
  state: "public" | "acceptance" | "repair" | "queued";
  detail: string;
}

export const progressSnapshot = {
  reviewedOn: "2026-08-12",
  auditedCommit: FE2O3_PIN.commit,
  publicCommit: "efc28dffea77d4f3fdf9a715b5a834d90176d4fa",
  publicTree: "4ccfb539f61ad1ae747a42516898124ef337df03",
  repositories: [
    "https://github.com/harsh-nod/fe2o3",
    "https://github.com/powderluv/fe2o3",
  ],
} as const;

export const developmentCheckpoints: DevelopmentCheckpoint[] = [
  {
    name: "Public main",
    commit: progressSnapshot.publicCommit,
    state: "public",
    detail:
      "Identical on harsh-nod/fe2o3 and powderluv/fe2o3. This is newer than the lesson evidence pin.",
  },
  {
    name: "Cargo acknowledgement repair",
    commit: "69c543279c294cd6d1035f076060768349a5f6b5",
    state: "repair",
    detail:
      "Acceptance rejected an unexpected candidate-worker timeout in the required finalizer all-target/all-feature gate after generic, 100/100 contention pairs, and 10/10 vertical suites passed. V6 is isolating the lifecycle and scheduling cause.",
  },
  {
    name: "Formal evidence isolation V10",
    commit: "81ade3914cfca7ea4e5e9473bf6d9600a3837457",
    state: "acceptance",
    detail:
      "V10 adds atomic verifier identity reservation, post-exec containment, transition- and object-bound Z3 admission, pidfd cleanup, and former-TID reconciliation. Focused verification and hostile regressions pass; independent rereview and protected execution remain.",
  },
  {
    name: "Protected evidence publisher",
    commit: "1c55fd8af805850c46c8183f57178713432af024",
    state: "repair",
    detail:
      "Hostile rereview rejected committed-frame corruption recovery and pre-handler slow-header admission. V10 is adding authenticated frame boundaries, connection-level deadlines and limits, and clean conformance execution.",
  },
  {
    name: "gfx942 scalar control flow",
    commit: "48ff155038a2aa90696258a494878ef2da7f40cf",
    state: "repair",
    detail:
      "Hostile rereview rejected identity-only body authority, mutable composed artifacts, incomplete compiler-semantics binding, and a replaceable test backend path. V3 is binding exact executable MIR and generated artifacts while hardening backend loading.",
  },
  {
    name: "Collected Rust scalar admission",
    commit: "48ff155038a2aa90696258a494878ef2da7f40cf",
    state: "repair",
    detail:
      "The collected path rejects root-body mutation through its portable digest, but its lower-level authority and composition APIs are not yet body-bound and immutable. V3 must close those gaps before direct COV6/LLD and hardware execution.",
  },
];

export const kernelProgress: KernelProgress[] = [
  {
    id: "fill",
    kernel: "Fill",
    run: "complete",
    verify: "partial",
    evidence: "partial",
    dependsOn: [],
    next: "Replace the legacy raw host boundary and bind proof, artifact, and launch identities.",
  },
  {
    id: "vecadd",
    kernel: "Typed vector addition",
    run: "complete",
    verify: "partial",
    evidence: "partial",
    dependsOn: [],
    next: "Close floating-point refinement and publish protected end-to-end evidence.",
  },
  {
    id: "scalar-map",
    kernel: "Scalar and affine maps",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: ["source-derived control flow"],
    next: "Accept and integrate the helper control-flow candidate, connect collected kernel entries, and add typed widening arithmetic profiles.",
  },
  {
    id: "wave-collectives",
    kernel: "Wave64 reduction and scan",
    run: "partial",
    verify: "partial",
    evidence: "planned",
    dependsOn: ["source-derived control flow", "wave intrinsics"],
    next: "Integrate shuffle/ballot lowering with inactive-lane semantics and hardware oracles.",
  },
  {
    id: "workgroup-reduction",
    kernel: "Workgroup LDS reduction",
    run: "partial",
    verify: "partial",
    evidence: "planned",
    dependsOn: ["wave reduction", "LDS ownership epochs", "uniform barriers"],
    next: "Connect existing LDS, barrier, and atomic contracts to one source-derived kernel.",
  },
  {
    id: "scalar-gemm",
    kernel: "Scalar reference GEMM",
    run: "blocked",
    verify: "planned",
    evidence: "planned",
    dependsOn: ["nested loops", "multidimensional indexing", "layout admission"],
    next: "Complete executable loops, helpers, edge predicates, and checked matrix indexing.",
  },
  {
    id: "tiled-gemm",
    kernel: "gfx942 BF16/F32 tiled GEMM",
    run: "partial",
    verify: "partial",
    evidence: "planned",
    dependsOn: ["scalar GEMM", "workgroup reduction", "MFMA integration"],
    next: "Compose MFMA and LDS mechanics into a fixed tile with accumulator-layout proofs.",
  },
  {
    id: "softmax",
    kernel: "Row softmax",
    run: "blocked",
    verify: "planned",
    evidence: "planned",
    dependsOn: ["reductions", "direct OCML linking", "numerical policy"],
    next: "Specify masking and NaN behavior, then bind exp and reduction-order error evidence.",
  },
  {
    id: "flash-attention",
    kernel: "Fixed-shape forward FlashAttention",
    run: "blocked",
    verify: "planned",
    evidence: "planned",
    dependsOn: ["tiled GEMM", "online softmax", "masking"],
    next: "Compose QK tiles, online softmax, and V accumulation under a fixed gfx942 profile.",
  },
  {
    id: "moe-routing",
    kernel: "Deterministic top-2 MoE routing",
    run: "blocked",
    verify: "planned",
    evidence: "planned",
    dependsOn: ["scan", "stable permutation", "capacity policy"],
    next: "Implement deterministic top-k, counts, exclusive scan, permutation, and inverse mapping.",
  },
  {
    id: "moe-experts",
    kernel: "MoE expert GEMM and combine",
    run: "blocked",
    verify: "planned",
    evidence: "planned",
    dependsOn: ["MoE routing", "tiled GEMM", "weighted combine"],
    next: "Start with host-scheduled experts, then add grouped persistent scheduling separately.",
  },
];

export const gateLabels: Record<
  DeliveryGate,
  { label: string; description: string }
> = {
  complete: {
    label: "Complete",
    description: "The kernel-specific gate is closed at the stated public baseline.",
  },
  partial: {
    label: "Partial",
    description: "Relevant mechanics exist, but the complete kernel gate is not closed.",
  },
  blocked: {
    label: "Blocked",
    description: "A named compiler, verifier, runtime, or kernel dependency is missing.",
  },
  planned: {
    label: "Planned",
    description: "The acceptance contract is known; implementation evidence is not yet present.",
  },
};

export function validateProgress(): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const exactCommit = /^[0-9a-f]{40}$/;

  if (!exactCommit.test(progressSnapshot.publicCommit)) {
    issues.push("public commit is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.publicTree)) {
    issues.push("public tree is not an exact Git object name");
  }
  for (const checkpoint of developmentCheckpoints) {
    if (!exactCommit.test(checkpoint.commit)) {
      issues.push(`${checkpoint.name} is not pinned to an exact commit`);
    }
  }
  for (const kernel of kernelProgress) {
    if (ids.has(kernel.id)) issues.push(`duplicate kernel id: ${kernel.id}`);
    ids.add(kernel.id);
    if (kernel.next.trim().length === 0) {
      issues.push(`${kernel.id} has no next closure step`);
    }
    if (kernel.run === "complete" && kernel.dependsOn.length > 0) {
      issues.push(`${kernel.id} is complete but still declares dependencies`);
    }
  }
  return issues;
}
