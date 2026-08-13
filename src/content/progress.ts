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
  reviewedOn: "2026-08-11",
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
    state: "acceptance",
    detail:
      "The fresh generic and focused campaigns pass, including the prior worker-test failure. Invalid contention harness attempts were discarded; one clean corrected contention run and the remaining acceptance matrix are in progress.",
  },
  {
    name: "Formal evidence isolation v8",
    commit: "f7cb3132fb687cfc10809d58271dcb09505e1be9",
    state: "repair",
    detail:
      "The clean repair uses anonymous bounded result capture, closes ambient proof descriptors, and passes focused hostile and reproducibility checks. Independent rereview and protected root-installed execution remain required.",
  },
  {
    name: "Protected evidence publisher",
    commit: "1c55fd8af805850c46c8183f57178713432af024",
    state: "acceptance",
    detail:
      "The accepted 46-commit stack is replayed on the Cargo candidate without stale-tree regressions. Debug and release suites, secret-memory and adversarial client probes, Clippy, formatting, and a synchronized 100-run enrollment stress test pass on mi300x; independent rereview remains.",
  },
  {
    name: "gfx942 scalar control flow",
    commit: "d63bc81d190f4a33a5e22b9b22da6df24c86b3a3",
    state: "repair",
    detail:
      "Hostile review rejected implicit export authority, truncated identity collisions, incomplete xnack target binding, and late resource charging. A private repair is adding authenticated roles, canonical identities, exact target binding, and preflight bounds.",
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
