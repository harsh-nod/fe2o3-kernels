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
  publicCommit: "4bd1be0d6325d3946075904d653222aa9c81eebd",
  publicTree: "c813c06a8897599bd5144c82d2dc93d72394ec53",
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
    commit: "4bd1be0d6325d3946075904d653222aa9c81eebd",
    state: "public",
    detail:
      "V6 passed 100/100 contention, 10/10 finalizer, 280/280 vertical, release, focused, and fresh mi300x generic gates without changing production timeouts. Both public mains are exact, and both hosted policy and generic workflows are green.",
  },
  {
    name: "Formal evidence isolation V10",
    commit: "81ade3914cfca7ea4e5e9473bf6d9600a3837457",
    state: "repair",
    detail:
      "Hostile rereview rejected namespace-relative root authority: an unprivileged user namespace could enter protected mode with a private root and lock. V11 is anchoring execution, installation objects, namespace identities, and reservation authority in an initial-namespace supervisor.",
  },
  {
    name: "Protected evidence publisher",
    commit: "795c317bfcb8369f9a1e02c00ad3aaaee7414029",
    state: "repair",
    detail:
      "Hostile rereview rejected a forward-length plus commit-magic corruption that still truncates a fully committed final record. V11 is making commit recognition independently durable under multi-field corruption and removing canonical generic-gate bytecode pollution.",
  },
  {
    name: "gfx942 scalar control flow",
    commit: "5434e778f8676684c97ec9c280d15587f3e47523",
    state: "repair",
    detail:
      "Hostile rereview accepted the MIR and artifact binding but rejected backend provenance and build isolation: arbitrary sealed bytes were trusted, exec reset nondumpability, source stayed replaceable, and receive could block forever. Integrated V4 is repairing this on public Cargo V6.",
  },
  {
    name: "Collected Rust scalar admission",
    commit: "5434e778f8676684c97ec9c280d15587f3e47523",
    state: "repair",
    detail:
      "V3 binds root and helper MIR plus compiler semantics, but its sealed backend transport lacks independent provenance and bounded lifecycle authority. V4 must close that protocol before direct COV6/LLD and hardware execution can be connected.",
  },
  {
    name: "gfx942 wave64 and LDS reduction",
    commit: "a2375e8d2cd34dc9197f7c541c83e062fc8baf69",
    state: "acceptance",
    detail:
      "The partial candidate lowers typed wave64 and static LDS reductions, passes 6 positive and 26 negative Verus cases, and matches all 256 lanes on MI300X through direct LLVM/LLD. Independent hostile review and the authenticated Rust-source-to-HSACO join remain.",
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
    evidence: "partial",
    dependsOn: ["source-derived control flow", "wave intrinsics"],
    next: "Accept the wave64 sum slice, connect its verified Kernel IR to Worker V2 finalization, then extend the same contract to scan.",
  },
  {
    id: "workgroup-reduction",
    kernel: "Workgroup LDS reduction",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: ["wave reduction", "LDS ownership epochs", "uniform barriers"],
    next: "Accept the 256-thread reduction slice and bind its direct-LLD hardware evidence to the authenticated source artifact.",
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
