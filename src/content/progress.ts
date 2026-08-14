import publicationGate from "../../config/publication-gate.json";
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
  sourceBridge: "fb75e19a73ec0a9acebb203bd9821190b0592c82",
  hardwareEvidence: "b825661ac3f7e332d2cc9723ed1efbb54869fa33",
  structuralAdmission: "d43f11c86196e4f01c9ee305ea8d19f6d8c17672",
} as const;

export const developmentCheckpoints: DevelopmentCheckpoint[] = [
  {
    name: "Eventual public main (publication gated)",
    commit: progressSnapshot.eventualPublicCommit,
    state: "queued",
    detail:
      `This is a staged target, not an observation of current remote state. Site publication is blocked until harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main both resolve exactly to ${publicationGate.requiredCommit}.`,
  },
  {
    name: "Last audited public baseline",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    detail:
      "This historical public baseline is newer than the lesson evidence pin. It is not presented as the current tip of either remote.",
  },
  {
    name: "Production S09 rustc invocation capture",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "public",
    detail:
      "The production path canonically captures RustcInvocationDescriptorV2 and admits exactly /proc/./self/fd/198 as its backend capability. It rejects procfs/devfd aliases, other descriptor numbers, every preexisting joined or split codegen-backend selector spelling, and an option terminator before the sole final managed -Zcodegen-backend=<path> selector. A real cargo-fe2o3 integration test traverses pinned Cargo, the S09 broker, closed-environment materialization, pinned rustc spawn, Worker V2, and durable publication of a COV6 gfx942:xnack- HSACO containing exactly alpha. It decodes the canonical publication envelope and nested record, then binds the finalized-output identity and content-addressed artifact name to the exact inspected HSACO bytes. A retained mi300x observation records 1 passed in 132.45 seconds and HSACO SHA-256 5902632c5c249be05855ae5cef62bb9096a1f9277cfb0c58b4384594d6ee61de. This is non-authoritative: it proves no compiler origin and grants no loading, execution, or verification authority. Canonical cwd pathname capture is not a pathname-to-object identity join, and the scalar profile still establishes no general source or output-object association.",
  },
  {
    name: "Authenticated Verus execution V2",
    commit: "b704651757a3d46801144277e025f68153cb1ba9",
    state: "public",
    detail:
      "Linux x86_64 authenticated execution is bound to pinned local runtime and tool snapshots. V2 uses clone3 pidfds and ptrace-unresumable checkpoints, seccomp process-creation denial, exact live executable/backing comparison, runtime closure and baseline pinning, vDSO pinning, and immutable sealed results. It rejects compressed and alternate debug-section families. Package-scoped debug stripping makes the debug fixture reproducible, and a bounded two-root gate compares SHA-256, size, and Build ID. On the pinned local host, debug V2 integration passed 14/14 and release passed 13/13; the full verifier debug and release suites and 22 doctests passed. A run on mi300x correctly failed closed on its different vDSO and runtime baseline. This does not integrate stock Verus or Z3, establish semantic proof validity, guarantee exclusive measured-image execution between checkpoints, prove compiler refinement, or grant GPU authority.",
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
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "acceptance",
    detail:
      "Both public mains contain the source-bound frontend handoff (SHA-256 2569dcdc19df8d64fb937e65bb64737c6c2a3c5e68ad6adc5dee86df373e6cb5), measured upstream LLVM/LLD Worker, deterministic canonical finalization, retained-currentness load handoff, proof and physical-effect profiles, and a raw MI300X smoke test. The frontend commitment records lineage; it does not yet authenticate source-to-module causality. The 10,128-byte gfx942:xnack- COV6 artifact (SHA-256 ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9) passed every HARDWARE_CASES case in 1.41 seconds, including zero-output no-dispatch, k=0 +0, bitwise CPU-oracle, immutable-input, adjacent-canary, and unload checks. The raw smoke deliberately bypasses production prerequisite authentication. The upstream LLVM 22 MC analyzer now accepts those exact artifact bytes without COMGR: 4/4 native tests passed on mi300x for the exact 60-opcode scalar profile, one function, zero calls, two constrained backward loops, and 19 ordered physical effect sites. Both the analyzer result and raw smoke remain static or observational evidence and grant no protected authority. Authenticated Verus execution, analyzer-identity binding, compiler and address refinement, memory, bounds and race proofs, and production protected launch evidence remain open.",
  },
  {
    name: "Scalar GEMM proof profile",
    commit: "c223325ed437eebd9d382d0342cb35a01a17605e",
    state: "acceptance",
    detail:
      "Nine focused tests pin the exact 6,879-byte proof source (SHA-256 98803a62488e1af2fbc886b1da5ddc680b16d35a8a8a5c22d4959128dd2da5fe) and bind its target, ABI, effects, launch contract, seven required properties, tool identities, transcript, caller-supplied freshness, and finalized artifact digest. Replay is explicitly permitted after the process-local ledger is recreated. This is inert review evidence only: it does not execute Verus and creates no load, launch, or protected-evidence authority.",
  },
  {
    name: "Scalar GEMM physical-effect profile",
    commit: progressSnapshot.lastAuditedPublicCommit,
    state: "acceptance",
    detail:
      "On mi300x, 4/4 upstream LLVM 22 MC analyzer tests accepted the exact finalized artifact (SHA-256 ac1da70c69a5038b887b459dece40802668c41bcf98f621d7d1273d2f61ba2c9) without COMGR. The exact 60-opcode scalar profile has one function, zero calls, two constrained backward loops, and effects of 9 address / 8 read / 1 write / 1 return / 0 calls. The Rust profile now also binds the exact entry range [0x1b00, 0x25d0) and all 19 ordered physical effect sites, including address/access pairing; focused mutation tests reject relocation, reordering, width, range, and pairing changes. This is static, inert evidence only. It provides no compiler or address refinement and no proof of memory safety, bounds safety, race freedom, or launch correctness. The analyzer identity changed and downstream authenticated evidence must bind the new identity.",
  },
  {
    name: "Tiled GEMM V1 layout and frontend foundations",
    commit: "286331aab8639dd3707e55cdf51a83f8854d26a5",
    state: "public",
    detail:
      "The standalone gfx942:xnack- BF16/F32 host scaffold and source-level layout proof begin at commit 027ab901bef7007d0e8da3370470556ed28baad1. Executable Rust maps bind the official A/B/C/D register coordinates for gfx942 V_MFMA_F32_16X16X16_BF16 to AMD Matrix Instruction Calculator commit 2ef91896bcdc4d26624f952e5c905c787cd9bc9e, with XOR4 LDS staging for A and deliberately transposed B. Exhaustive 64-lane x 4-component goldens pin all four tables; 23 public Verus proof functions discharge 73 obligations; and five formula mutations are rejected. Descendants separate block counts, WG64 dimensions, and AQL work items, then add a sealed direct-global one-wave 16x16x16 Kernel IR graph with 12 reads, one BF16/BF16/F32 MFMA, and four F32 stores. Frontend checkpoint 286331aab8639dd3707e55cdf51a83f8854d26a5 separately records a build-scoped WG64/288-byte fragment probe. It is neither the later four-slice production profile nor the independent WG256/384-byte mutation, and it does not establish source-to-canonical Kernel IR correspondence.",
  },
  {
    name: "Tiled GEMM V1 source-authenticated compiler bridge",
    commit: tiledGemmV1Commits.sourceBridge,
    state: "acceptance",
    detail:
      "Commit fb75e19a73ec0a9acebb203bd9821190b0592c82 admits one exact collected Rust root with signature A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>. It binds the reviewed layouts, rustc FnAbi, portable-MIR identity, compiler profile, gfx942:xnack-, COV6, WG64, zero LDS, and the 64-byte explicit plus 256-byte implicit four-slice ABI. A private single-use receipt selects the canonical direct-global Kernel IR module with eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores; AMDGCN lowering represents the BF16 carriers with i16 loads. Follow-up b904f5b648c7eb249d32d73db427abe72970315a normalizes only Cargo-generated metadata in the semantic commitment while full observed argv and metadata remain receipt-bound. Follow-up 51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape while the full observed root remains receipt-bound. The older WG64 32-byte explicit/288-byte fragment probe remains separate. This source-to-canonical lowering is reviewed correspondence, not a compiler refinement proof. The Worker V2 handoff remains inert and grants no final-HSACO, publication, loading, or launch authority.",
  },
  {
    name: "Tiled GEMM V1 guarded gfx942 hardware harness",
    commit: tiledGemmV1Commits.hardwareEvidence,
    state: "acceptance",
    detail:
      "Commit b825661ac3f7e332d2cc9723ed1efbb54869fa33 adds an ignored, opt-in one-tile gfx942:xnack- harness for externally supplied digest-pinned bytes and a digest-pinned observed LLVM 22 objdump. Before dispatch it enforces COV6/WG64/320-byte metadata, one bound entry, exact disassembly coverage, one retained v_mfma_f32_16x16x16_bf16, a global store, and rejection of forbidden control and memory forms. If run, it checks a bitwise dyadic 16x16 oracle, that A/B/C inputs remained bitwise unchanged, adjacent canaries, synchronous completion, exact executable identity, and terminal unload. The commit contains no committed run receipt, so exact hardware execution remains uncommitted and non-authoritative. The harness deliberately bypasses production prerequisite authentication, does not authenticate the artifact producer or full objdump runtime, and grants no compiler, publication, loading, launch, or verification authority.",
  },
  {
    name: "Tiled GEMM V1 structural artifact admission",
    commit: tiledGemmV1Commits.structuralAdmission,
    state: "queued",
    detail:
      "Commit d43f11c86196e4f01c9ee305ea8d19f6d8c17672 adds sealed Worker V2 structural inspection and canonical finalization for exactly one gfx942:xnack- COV6 tiled_gemm_v1 descriptor: four slices in 64 explicit bytes, a 256-byte implicit suffix, WG64, wave64, and zero LDS. It separately rejects the WG64/288-byte fragment probe and independent WG256 and 384-byte structural mutations, along with descriptor, target, capability, and finalization drift. Structural admission deliberately accepts arbitrary .text in adversarial tests, so it does not inspect machine-body semantics, authenticate compiler origin, prove BF16 or MFMA semantics, or prove Verus results. It grants no publication, loading, or launch authority. The capability schema remains V1 and unknown tag 12 is rejected; no COMGR path is added.",
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

export function validateProgress(): string[] {
  const issues: string[] = [];
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
