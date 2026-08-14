import publicationGate from "../../config/publication-gate.json";
import { FE2O3_PIN, type StagedEvidenceId } from "./model";
import {
  isStagedEvidenceId,
  stagedEvidenceDetail,
  stagedEvidenceRecord,
  validateStagedEvidenceCatalog,
} from "./staged-evidence";

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

interface DevelopmentCheckpointBase {
  name: string;
  commit: string;
  state: "public" | "acceptance" | "repair" | "queued";
}

export interface NarrativeDevelopmentCheckpoint
  extends DevelopmentCheckpointBase {
  kind: "narrative";
  detail: string;
  stagedEvidenceIds?: never;
}

export interface PublicationGateDevelopmentCheckpoint
  extends DevelopmentCheckpointBase {
  kind: "publication-gate";
  detail?: never;
  stagedEvidenceIds?: never;
}

export interface StagedEvidenceDevelopmentCheckpoint
  extends DevelopmentCheckpointBase {
  kind: "staged-evidence";
  detail?: never;
  stagedEvidenceIds: StagedEvidenceId[];
}

export type DevelopmentCheckpoint =
  | NarrativeDevelopmentCheckpoint
  | PublicationGateDevelopmentCheckpoint
  | StagedEvidenceDevelopmentCheckpoint;

export const progressSnapshot = {
  reviewedOn: "2026-08-14",
  auditedCommit: FE2O3_PIN.commit,
  lastAuditedPublicCommit: "96b9890c3ad33ad8c6b4239a9b567728a176d65f",
  lastAuditedPublicTree: "f911f0c693238830ad6070b2674fb863857bfec1",
  eventualPublicCommit: publicationGate.requiredCommit,
  eventualPublicTree: publicationGate.requiredTree,
  publicationGate: {
    state: "blocked-until-public-refs-match",
    requiredCommit: publicationGate.requiredCommit,
    requiredRefs: publicationGate.requiredRefs.map(
      ({ repository, ref }) => `${repository}@${ref}`,
    ),
    requirement:
      "Do not publish this site revision until both required public refs resolve exactly to the required commit.",
  },
  repositories: publicationGate.requiredRefs.map(
    ({ repository }) => `https://github.com/${repository}`,
  ),
} as const;

export const tiledGemmV1Commits = {
  sourceBridge: stagedEvidenceRecord("tiled-source-bridge-v1").commit,
  hardwareEvidence: stagedEvidenceRecord("tiled-hardware-harness-v1").commit,
  structuralAdmission: stagedEvidenceRecord(
    "tiled-structural-admission-v1",
  ).commit,
} as const;

const stagedCheckpointSpecs = new Map<
  string,
  { commit: string; evidenceIds: readonly StagedEvidenceId[] }
>([
  [
    "Tiled GEMM V1 source-authenticated compiler bridge",
    {
      commit: tiledGemmV1Commits.sourceBridge,
      evidenceIds: [
        "tiled-source-bridge-v1",
        "tiled-cargo-metadata-v1",
        "tiled-cargo-root-v1",
      ],
    },
  ],
  [
    "Tiled GEMM V1 guarded gfx942 hardware harness",
    {
      commit: tiledGemmV1Commits.hardwareEvidence,
      evidenceIds: ["tiled-hardware-harness-v1"],
    },
  ],
  [
    "Tiled GEMM V1 structural artifact admission",
    {
      commit: tiledGemmV1Commits.structuralAdmission,
      evidenceIds: ["tiled-structural-admission-v1"],
    },
  ],
]);

export const developmentCheckpoints: DevelopmentCheckpoint[] = [
  {
    kind: "publication-gate",
    name: "Eventual public main (publication gated)",
    commit: progressSnapshot.eventualPublicCommit,
    state: "queued",
  },
  {
    kind: "narrative",
    name: "Last audited public baseline",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    detail:
      "This historical public baseline is newer than the lesson evidence pin. It is not presented as the current tip of either remote.",
  },
  {
    kind: "narrative",
    name: "Production S09 rustc invocation capture",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    detail:
      "The production path canonically captures RustcInvocationDescriptorV2 and admits exactly /proc/./self/fd/198 as its backend capability. It rejects procfs/devfd aliases, other descriptor numbers, every preexisting joined or split codegen-backend selector spelling, and an option terminator before the sole final managed -Zcodegen-backend=<path> selector. A real cargo-fe2o3 integration test traverses pinned Cargo, the S09 broker, closed-environment materialization, pinned rustc spawn, Worker V2, and durable publication of a COV6 gfx942:xnack- HSACO containing exactly alpha. It decodes the canonical publication envelope and nested record, then binds the finalized-output identity and content-addressed artifact name to the exact inspected HSACO bytes. A retained mi300x observation records 1 passed in 132.45 seconds and HSACO SHA-256 5902632c5c249be05855ae5cef62bb9096a1f9277cfb0c58b4384594d6ee61de. This is non-authoritative: it proves no compiler origin and grants no loading, execution, or verification authority. Canonical cwd pathname capture is not a pathname-to-object identity join, and the scalar profile still establishes no general source or output-object association.",
  },
  {
    kind: "narrative",
    name: "Authenticated Verus execution V2",
    commit: "b704651757a3d46801144277e025f68153cb1ba9",
    state: "public",
    detail:
      "Linux x86_64 authenticated execution is bound to pinned local runtime and tool snapshots. V2 uses clone3 pidfds and ptrace-unresumable checkpoints, seccomp process-creation denial, exact live executable/backing comparison, runtime closure and baseline pinning, vDSO pinning, and immutable sealed results. It rejects compressed and alternate debug-section families. Package-scoped debug stripping makes the debug fixture reproducible, and a bounded two-root gate compares SHA-256, size, and Build ID. On the pinned local host, debug V2 integration passed 14/14 and release passed 13/13; the full verifier debug and release suites and 22 doctests passed. A run on mi300x correctly failed closed on its different vDSO and runtime baseline. This does not integrate stock Verus or Z3, establish semantic proof validity, guarantee exclusive measured-image execution between checkpoints, prove compiler refinement, or grant GPU authority.",
  },
  {
    kind: "narrative",
    name: "Cargo acknowledgement repair",
    commit: "4bd1be0d6325d3946075904d653222aa9c81eebd",
    state: "public",
    detail:
      "V6 passed 100/100 contention, 10/10 finalizer, 280/280 vertical, release, focused, and fresh mi300x generic gates without changing production timeouts. Both public mains are exact, and both hosted policy and generic workflows are green.",
  },
  {
    kind: "narrative",
    name: "Formal evidence isolation V11",
    commit: "1265afc07aed232a24dd055b56dda8d35446f577",
    state: "repair",
    detail:
      "V12 prototypes an Ed25519-signed external authority handoff, but protected evidence remains rejected. Independent policy anchors, separately sealed statement transport, hostile substitution and replay probes, and the full regression and reproducibility matrix are still required.",
  },
  {
    kind: "narrative",
    name: "Protected evidence publisher",
    commit: "85a38372d74873cb84e2d6d55eed66fd98e5904b",
    state: "public",
    detail:
      "V11 uses three independently checksummed checkpoints to bind the committed prefix and allows recovery only beyond it. Independent hostile rereview and the replayed full mi300x generic suite passed; both public main branches now contain the accepted merge.",
  },
  {
    kind: "narrative",
    name: "gfx942 scalar control flow",
    commit: "54ae9ff671b041205434aec80ab2b9a5979d0fa7",
    state: "repair",
    detail:
      "Independent hostile review rejected V4: preload constructors run before authority, clone can create namespaces, preload nondumpability is bypassable, fake rustc stderr can satisfy admission, and the authenticated build closure is incomplete. V5 must close all five attacks.",
  },
  {
    kind: "narrative",
    name: "Collected Rust scalar admission",
    commit: "54ae9ff671b041205434aec80ab2b9a5979d0fa7",
    state: "repair",
    detail:
      "V4 preserves admission-only and no-HSACO scope, but its compiler and process authority can be forged or escaped. V5 is adding pinned positive backend identity, complete closure authentication, and adversarial process-boundary tests before any executable claim.",
  },
  {
    kind: "narrative",
    name: "gfx942 wave64 and LDS reduction",
    commit: "b745b55dd59036aee7014f4814f4420c13e721cd",
    state: "public",
    detail:
      "V2 is identical on both public mains with green hosted policy and generic workflows. It binds canonical gfx942:xnack- through Kernel IR and Worker V2, rejects eleven unauthorized target forms, and passes 6/26 Verus plus 256-lane MI300X evidence; source finalization and compiler refinement remain partial.",
  },
  {
    kind: "narrative",
    name: "Scalar GEMM V1 vertical slice",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "acceptance",
    detail:
      "Both public mains contain the source-bound frontend handoff (SHA-256 2569dcdc19df8d64fb937e65bb64737c6c2a3c5e68ad6adc5dee86df373e6cb5), measured upstream LLVM/LLD Worker, deterministic canonical finalization, retained-currentness load handoff, proof and physical-effect profiles, and a raw MI300X smoke test. The frontend commitment records lineage; it does not yet authenticate source-to-module causality. The 10,128-byte gfx942:xnack- COV6 artifact (SHA-256 ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9) passed every HARDWARE_CASES case in 1.41 seconds, including zero-output no-dispatch, k=0 +0, bitwise CPU-oracle, immutable-input, adjacent-canary, and unload checks. The raw smoke deliberately bypasses production prerequisite authentication. The upstream LLVM 22 MC analyzer now accepts those exact artifact bytes without COMGR: 4/4 native tests passed on mi300x for the exact 60-opcode scalar profile, one function, zero calls, two constrained backward loops, and 19 ordered physical effect sites. Both the analyzer result and raw smoke remain static or observational evidence and grant no protected authority. Authenticated Verus execution, analyzer-identity binding, compiler and address refinement, memory, bounds and race proofs, and production protected launch evidence remain open.",
  },
  {
    kind: "narrative",
    name: "Scalar GEMM proof profile",
    commit: "c223325ed437eebd9d382d0342cb35a01a17605e",
    state: "acceptance",
    detail:
      "Nine focused tests pin the exact 6,879-byte proof source (SHA-256 98803a62488e1af2fbc886b1da5ddc680b16d35a8a8a5c22d4959128dd2da5fe) and bind its target, ABI, effects, launch contract, seven required properties, tool identities, transcript, caller-supplied freshness, and finalized artifact digest. Replay is explicitly permitted after the process-local ledger is recreated. This is inert review evidence only: it does not execute Verus and creates no load, launch, or protected-evidence authority.",
  },
  {
    kind: "narrative",
    name: "Scalar GEMM physical-effect profile",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "acceptance",
    detail:
      "On mi300x, 4/4 upstream LLVM 22 MC analyzer tests accepted the exact finalized artifact (SHA-256 ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9) without COMGR. The exact 60-opcode scalar profile has one function, zero calls, two constrained backward loops, and effects of 9 address / 8 read / 1 write / 1 return / 0 calls. The Rust profile now also binds the exact entry range [0x1b00, 0x25d0) and all 19 ordered physical effect sites, including address/access pairing; focused mutation tests reject relocation, reordering, width, range, and pairing changes. This is static, inert evidence only. It provides no compiler or address refinement and no proof of memory safety, bounds safety, race freedom, or launch correctness. The analyzer identity changed and downstream authenticated evidence must bind the new identity.",
  },
  {
    kind: "narrative",
    name: "Tiled GEMM V1 layout and frontend foundations",
    commit: "286331aab8639dd3707e55cdf51a83f8854d26a5",
    state: "public",
    detail:
      "The standalone gfx942:xnack- BF16/F32 host scaffold and source-level layout proof begin at commit 027ab901bef7007d0e8da3370470556ed28baad1. Executable Rust maps bind the official A/B/C/D register coordinates for gfx942 V_MFMA_F32_16X16X16_BF16 to AMD Matrix Instruction Calculator commit 2ef91896bcdc4d26624f952e5c905c787cd9bc9e, with XOR4 LDS staging for A and deliberately transposed B. Exhaustive 64-lane x 4-component goldens pin all four tables; 23 public Verus proof functions discharge 73 obligations; and five formula mutations are rejected. Descendants separate block counts, WG64 dimensions, and AQL work items, then add a sealed direct-global one-wave 16x16x16 Kernel IR graph with 12 reads, one BF16/BF16/F32 MFMA, and four F32 stores. Frontend checkpoint 286331aab8639dd3707e55cdf51a83f8854d26a5 separately records a build-scoped WG64/288-byte fragment probe. It is neither the later four-slice production profile nor the independent WG256/384-byte mutation, and it does not establish source-to-canonical Kernel IR correspondence.",
  },
  {
    kind: "staged-evidence",
    name: "Tiled GEMM V1 source-authenticated compiler bridge",
    commit: tiledGemmV1Commits.sourceBridge,
    state: "acceptance",
    stagedEvidenceIds: [
      "tiled-source-bridge-v1",
      "tiled-cargo-metadata-v1",
      "tiled-cargo-root-v1",
    ],
  },
  {
    kind: "staged-evidence",
    name: "Tiled GEMM V1 guarded gfx942 hardware harness",
    commit: tiledGemmV1Commits.hardwareEvidence,
    state: "acceptance",
    stagedEvidenceIds: ["tiled-hardware-harness-v1"],
  },
  {
    kind: "staged-evidence",
    name: "Tiled GEMM V1 structural artifact admission",
    commit: tiledGemmV1Commits.structuralAdmission,
    state: "queued",
    stagedEvidenceIds: ["tiled-structural-admission-v1"],
  },
];

export function developmentCheckpointDetail(
  checkpoint: DevelopmentCheckpoint,
): string {
  if (checkpoint.kind === "staged-evidence") {
    return stagedEvidenceDetail(checkpoint.stagedEvidenceIds);
  }
  if (checkpoint.kind === "publication-gate") {
    return `This is a staged target, not an observation of current remote state. Site publication is blocked until harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main both resolve exactly to ${publicationGate.requiredCommit}.`;
  }
  return checkpoint.detail;
}

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
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "production protected transaction authenticator",
      "authenticated analyzer-identity binding",
      "compiler and address refinement",
      "protected MI300X launch evidence",
    ],
    next: "Bind the new analyzer identity into authenticated evidence, authenticate Verus execution, close compiler and address refinement, then admit the same bytes through the protected MI300X launch path.",
  },
  {
    id: "tiled-gemm",
    kernel: "gfx942 BF16/F32 tiled GEMM",
    run: "partial",
    verify: "partial",
    evidence: "partial",
    dependsOn: [
      "source-derived Worker V2 final HSACO",
      "machine-body semantic admission",
      "protected publication, load, and launch authority",
      "LDS ownership and race proof",
    ],
    next: "Connect the source-authenticated canonical module to the measured upstream LLVM/LLD Worker V2 path, bind its final HSACO to structural and machine-body admission, and carry the same identity through protected publication, load, and launch. Then add production XOR4 LDS tiling with bounds, initialization, barrier, and race proofs.",
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

export function validateProgress(
  checkpoints: DevelopmentCheckpoint[] = developmentCheckpoints,
): string[] {
  const issues: string[] = validateStagedEvidenceCatalog().map(
    (issue) => `staged evidence: ${issue}`,
  );
  const ids = new Set<string>();
  const exactCommit = /^[0-9a-f]{40}$/;

  if (!exactCommit.test(progressSnapshot.lastAuditedPublicCommit)) {
    issues.push("last audited public commit is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.lastAuditedPublicTree)) {
    issues.push("last audited public tree is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.eventualPublicCommit)) {
    issues.push("eventual public commit is not an exact Git object name");
  }
  if (!exactCommit.test(progressSnapshot.eventualPublicTree)) {
    issues.push("eventual public tree is not an exact Git object name");
  }
  if (
    progressSnapshot.publicationGate.requiredCommit !==
    progressSnapshot.eventualPublicCommit
  ) {
    issues.push("publication gate does not bind the eventual public commit");
  }
  if (progressSnapshot.publicationGate.requiredRefs.length !== 2) {
    issues.push("publication gate does not require both public refs");
  }
  for (const checkpoint of checkpoints) {
    if (!exactCommit.test(checkpoint.commit)) {
      issues.push(`${checkpoint.name} is not pinned to an exact commit`);
    }
    const rawCheckpoint = checkpoint as unknown as Record<string, unknown>;
    const expectedStaged = stagedCheckpointSpecs.get(checkpoint.name);
    if (expectedStaged && checkpoint.kind !== "staged-evidence") {
      issues.push(`${checkpoint.name} must remain a staged-evidence checkpoint`);
    }
    if (checkpoint.kind === "staged-evidence") {
      const allowedKeys = [
        "commit",
        "kind",
        "name",
        "stagedEvidenceIds",
        "state",
      ];
      if (
        JSON.stringify(Object.keys(rawCheckpoint).sort()) !==
        JSON.stringify(allowedKeys)
      ) {
        issues.push(`${checkpoint.name} contains free-form staged fields`);
      }
      const evidenceIds = Array.isArray(rawCheckpoint.stagedEvidenceIds)
        ? rawCheckpoint.stagedEvidenceIds
        : [];
      for (const evidenceId of evidenceIds) {
        if (
          !isStagedEvidenceId(evidenceId)
        ) {
          issues.push(
            `${checkpoint.name} has unknown staged evidence id ${String(evidenceId)}`,
          );
        }
      }
      if (!expectedStaged) {
        issues.push(`${checkpoint.name} has no canonical staged checkpoint spec`);
      } else {
        if (checkpoint.commit !== expectedStaged.commit) {
          issues.push(`${checkpoint.name} does not bind its canonical staged commit`);
        }
        if (
          evidenceIds.length !== expectedStaged.evidenceIds.length ||
          evidenceIds.some(
            (evidenceId, index) =>
              evidenceId !== expectedStaged.evidenceIds[index],
          )
        ) {
          issues.push(
            `${checkpoint.name} must contain its complete canonical staged evidence IDs`,
          );
        }
      }
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
