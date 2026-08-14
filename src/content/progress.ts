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
  reviewedOn: "2026-08-13",
  auditedCommit: FE2O3_PIN.commit,
  publicCommit: "a78f3ef3538cbe1ce6187defc1bb7e48c7f6d484",
  publicTree: "53a3fc642d2c3d69ca850575ff60d538b34fedfb",
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
    name: "Formal evidence isolation V11",
    commit: "1265afc07aed232a24dd055b56dda8d35446f577",
    state: "repair",
    detail:
      "V12 prototypes an Ed25519-signed external authority handoff, but protected evidence remains rejected. Independent policy anchors, separately sealed statement transport, hostile substitution and replay probes, and the full regression and reproducibility matrix are still required.",
  },
  {
    name: "Protected evidence publisher",
    commit: "85a38372d74873cb84e2d6d55eed66fd98e5904b",
    state: "public",
    detail:
      "V11 uses three independently checksummed checkpoints to bind the committed prefix and allows recovery only beyond it. Independent hostile rereview and the replayed full mi300x generic suite passed; both public main branches now contain the accepted merge.",
  },
  {
    name: "gfx942 scalar control flow",
    commit: "54ae9ff671b041205434aec80ab2b9a5979d0fa7",
    state: "repair",
    detail:
      "Independent hostile review rejected V4: preload constructors run before authority, clone can create namespaces, preload nondumpability is bypassable, fake rustc stderr can satisfy admission, and the authenticated build closure is incomplete. V5 must close all five attacks.",
  },
  {
    name: "Collected Rust scalar admission",
    commit: "54ae9ff671b041205434aec80ab2b9a5979d0fa7",
    state: "repair",
    detail:
      "V4 preserves admission-only and no-HSACO scope, but its compiler and process authority can be forged or escaped. V5 is adding pinned positive backend identity, complete closure authentication, and adversarial process-boundary tests before any executable claim.",
  },
  {
    name: "gfx942 wave64 and LDS reduction",
    commit: "b745b55dd59036aee7014f4814f4420c13e721cd",
    state: "public",
    detail:
      "V2 is identical on both public mains with green hosted policy and generic workflows. It binds canonical gfx942:xnack- through Kernel IR and Worker V2, rejects eleven unauthorized target forms, and passes 6/26 Verus plus 256-lane MI300X evidence; source finalization and compiler refinement remain partial.",
  },
  {
    name: "Scalar GEMM V1 vertical slice",
    commit: "a78f3ef3538cbe1ce6187defc1bb7e48c7f6d484",
    state: "acceptance",
    detail:
      "Both public mains now contain the canonical Rust source, 15-proof Verus model, exact portable-MIR receipt, generated host adapter, canonical Kernel IR/lowering, Worker V2 validation, and fail-closed typed HSA harness. On mi300x, two upstream LLVM and in-process LLD runs produced identical 8,600-byte gfx942:xnack- COV6 HSACO (SHA-256 86a22b8cd3045a01445b30b12c00e11f6be466f989135402b871174109f2b1f5) with the exact two symbols, 64/320-byte kernarg spans, WG256, and wave64. Hardware dispatch and protected evidence remain open.",
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
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "authenticated HSA publication and launch",
      "source-to-machine refinement",
      "adjacent output canary views",
    ],
    next: "Carry the inspected Worker V2 artifact capability into the typed HSA harness, run the boundary matrix on MI300X, and publish protected source-to-artifact-to-launch evidence.",
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
