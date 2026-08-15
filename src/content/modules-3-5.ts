import { narrativeSection } from "./narrative-registry";
import flashAttentionKernel from "../../examples/flash_attention_v1/src/kernel.rs?raw";
import flashAttentionProof from "../../examples/flash_attention_v1/verus/flash_attention_v1.rs?raw";
import gemmSlice1Kernel from "../../examples/gemm_design.rs?raw";
import wave64CollectivesKernel from "../../examples/wave64_collectives_v1/src/kernel.rs?raw";
import workgroupSyncKernel from "../../examples/workgroup_sync_v1/src/kernel.rs?raw";
import {
  FE2O3_PIN,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import { completeTabs, noHost, resultText } from "./shared";
import {
  sourceMilestoneClaim,
  sourceMilestoneRecord,
} from "./source-milestones";
import {
  completedIssue94IncrementRecord,
  protectedSlice1HardwareObservation,
  stagedEvidenceOrder,
  stagedEvidenceRecord,
} from "./staged-evidence";

const gemmProofEvidence = stagedEvidenceRecord(
  "tiled-lds-source-model-correspondence-v1",
);
const gemmProtectedEvidence = completedIssue94IncrementRecord(
  "tiled-lds-protected-lifecycle-v1",
);
const gemmProofCommand = gemmProofEvidence.commands[0]!;
const gemmProtectedCommand = gemmProtectedEvidence.commands.at(-1)!;
const collectivesSource = sourceMilestoneRecord(
  "wave64-collectives-source-v1",
);
const synchronizationSource = sourceMilestoneRecord(
  "workgroup-sync-source-v1",
);
const flashAttentionSource = sourceMilestoneRecord(
  "flash-attention-source-v1",
);
const flashAttentionVerus = sourceMilestoneRecord(
  "flash-attention-verus-v1",
);
const gemmProtectedResult = resultText(
  "gpu-observed",
  `Exact bounded Slice 1 protected result

Commit: ${protectedSlice1HardwareObservation.commit}
Tree: ${protectedSlice1HardwareObservation.tree}
Target: ${protectedSlice1HardwareObservation.target} with HSA_XNACK=0
Worker: ${protectedSlice1HardwareObservation.workerId}
LLVM: ${protectedSlice1HardwareObservation.llvmBuild}

${protectedSlice1HardwareObservation.marker}

Validated all 256 output bit patterns against the CPU oracle.
A and B remained bitwise unchanged.
Every A/B/C prefix and suffix guard canary remained intact.
Result: 1/1 passed in 14.36 seconds.

Boundary: this is functional exact bounded Slice 1, not generalized GEMM, compiler-origin authentication, production certificate consumption, MIR-to-Kernel-IR or Kernel-IR-to-LLVM/ISA refinement, a general illegal-access or race-freedom proof, or protected Slice 3/4 execution.`,
);

function exactGemmKernelTab() {
  return {
    language: "rust" as const,
    code: gemmSlice1Kernel,
    sourcePath: "examples/tiled_gemm_v1/src/kernel.rs",
    sourceCommit: protectedSlice1HardwareObservation.commit,
    sourceSha256:
      "695e3449daa327944b0a9b0ecc081b0f1bd59eb60009cbe79ed6924942e86334",
    evidenceId: "tiled-lds-protected-lifecycle-v1" as const,
    explanatory: false,
  };
}

function exactGemmProofTab() {
  return {
    language: "bash" as const,
    code: gemmProofCommand,
    sourcePath:
      "examples/tiled_gemm_v1/verus/lds_tiled_slice1_source_refinement.rs",
    sourceCommit: gemmProofEvidence.commit,
    evidenceId: "tiled-lds-source-model-correspondence-v1" as const,
    explanatory: true,
    notice:
      "Real pinned command and bounded Verus source/model. The tab shows the replay command rather than reproducing the proof file, so it remains explanatory; 96 obligations verify, but no production certificate is consumed.",
  };
}

function exactGemmHostTab() {
  return {
    language: "bash" as const,
    code: gemmProtectedCommand,
    sourcePath:
      "crates/fe2o3-hsa-runtime/tests/tiled_gemm_lds_slice1_worker_v2_hardware.rs",
    sourceCommit: protectedSlice1HardwareObservation.commit,
    evidenceId: "tiled-lds-protected-lifecycle-v1" as const,
    explanatory: false,
  };
}

const collectives: Lesson = {
  id: "reductions-scans",
  module: 3,
  order: 0,
  title: "Reductions and scans by scope",
  summary:
    "Build reductions from active-lane semantics, then make workgroup composition and scratch ownership explicit.",
  duration: "42 min",
  prerequisites: ["Memory and race proofs", "Associative operations"],
  objectives: [
    "Distinguish wave and workgroup collectives.",
    "State how inactive lanes affect a reduction or scan.",
    "Separate bounded API/lowering profiles from general source integration.",
  ],
  claims: [
    sourceMilestoneClaim("wave64-collectives-source-v1"),
    {
      kind: "compiler-hsaco-observed",
      label: "Bounded collective foundations",
      detail:
        "Kernel IR, AMD lowering, and fe2o3-device contain target-gated wave and workgroup collective profiles, but general Rust source-to-collective execution is not complete.",
      reference: pinnedReference(
        [
          "cargo +nightly-2026-04-03 test --locked -p fe2o3-device -p fe2o3-kernel-ir -p dialect-amdgcn",
        ],
        [
          "crates/fe2o3-device/src/collective.rs",
          "crates/fe2o3-device/src/wave.rs",
          "crates/fe2o3-kernel-ir/src/verify.rs",
          "crates/dialect-amdgcn/src/lib.rs",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("reductions-scans/scope"),
    narrativeSection("reductions-scans/scan"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: wave64CollectivesKernel,
      sourcePath: collectivesSource.primarySourcePath,
      sourceCommit: collectivesSource.commit,
      sourceSha256: collectivesSource.primarySourceSha256,
      evidenceId: collectivesSource.id,
      explanatory: false,
    },
    {
      language: "bash",
      code: collectivesSource.commands[1]!,
      sourcePath:
        "examples/wave64_collectives_v1/verus/wave64_collectives_v1.rs",
      sourceCommit: collectivesSource.commit,
      evidenceId: collectivesSource.id,
      explanatory: true,
      notice:
        "Real pinned Phase A proof command and source link. It proves the bounded mathematical model, not compiler lowering or GPU execution.",
    },
    {
      language: "bash",
      code: noHost,
      explanatory: true,
      notice:
        "This historical source-model record does not bundle the later typed one-shot Wave64 host/runtime path; see Implementation status for its separately pinned protected gfx942 observation.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "This pinned source-model record remains independently reviewable. A later publication-gated descendant adds exact compiler admission, direct upstream LLVM/LLD finalization, a typed one-shot runtime, and one protected four-mask gfx942 observation. Compiler and Verus-to-machine refinement remain open; the historical source-model record itself grants no hardware authority.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: this is a source/model result, not a GPU result.",
    },
  ),
  diagram: "reduction",
  exercises: [
    {
      prompt: "Specify an exclusive scan for a partially active wave64.",
      hint: "Define the active-order prefix, not a physical-lane prefix with garbage values.",
      acceptance: "Inactive lanes contribute no value and every active result contains only earlier active lanes.",
    },
  ],
  glossary: ["wave64", "active mask", "reduction", "scan", "participation scope"],
};

const synchronization: Lesson = {
  id: "lds-barriers-atomics",
  module: 3,
  order: 1,
  title: "LDS, barriers, and atomics",
  summary:
    "Track initialization by epoch and use target-gated synchronization rather than treating a barrier as a universal fence.",
  duration: "45 min",
  prerequisites: ["Reductions and scans", "Memory ordering basics"],
  objectives: [
    "Model an LDS write phase and read phase as separate epochs.",
    "Reject divergent workgroup barriers.",
    "Match atomic ordering, scope, address space, and allocation eligibility.",
  ],
  claims: [
    sourceMilestoneClaim("workgroup-sync-source-v1"),
    {
      kind: "compiler-hsaco-observed",
      label: "Target-gated lowering",
      detail:
        "The experimental AMD lowering emits LDS, scoped integer atomics, fences, workgroup barriers, and bounded wave operations with focused tests.",
      reference: pinnedReference(
        [
          "cargo +nightly-2026-04-03 test --locked -p fe2o3-kernel-ir -p dialect-amdgcn -p fe2o3-amd-target",
        ],
        [
          "crates/fe2o3-kernel-ir/src/standard_atomics.rs",
          "crates/fe2o3-kernel-ir/src/verify.rs",
          "crates/dialect-amdgcn/src/lib.rs",
          "crates/fe2o3-amd-target/src/lib.rs",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("lds-barriers-atomics/epochs"),
    narrativeSection("lds-barriers-atomics/atomics"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: workgroupSyncKernel,
      sourcePath: synchronizationSource.primarySourcePath,
      sourceCommit: synchronizationSource.commit,
      sourceSha256: synchronizationSource.primarySourceSha256,
      evidenceId: synchronizationSource.id,
      explanatory: false,
    },
    {
      language: "bash",
      code: synchronizationSource.commands[1]!,
      sourcePath: "examples/workgroup_sync_v1/verus/workgroup_sync_v1.rs",
      sourceCommit: synchronizationSource.commit,
      evidenceId: synchronizationSource.id,
      explanatory: true,
      notice:
        "Real pinned Phase A proof command and source link. It proves the bounded synchronization model, not compiler lowering or GPU execution.",
    },
    {
      language: "bash",
      code: noHost,
      explanatory: true,
      notice:
        "Typed compiler-profile-bound host/runtime mechanics are public for both exact synchronization kernels. After canonical target-machine layout binding replaced the stale spelling, both passed the normal protected MI300X lifecycle in debug and release.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Exact separate LDS and scoped-atomic sources, CPU oracles, deterministic tests, and the bounded Verus model are public. The publication-gated descendant adds exact compiler profiles, opaque direct upstream LLVM/LLD finalizer receipts, typed argument admission, private one-shot host/runtime lifecycles, exact dynamic-LDS dispatch binding, and one bounded protected MI300X observation for each profile in debug and release. Remaining gaps: source/compiler/machine refinement, generalized illegal-access safety, and generalized race freedom. The hardware result is exact-profile evidence only.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: this is a source/model result, not a GPU result.",
    },
  ),
  diagram: "memory",
  exercises: [
    {
      prompt: "Construct a branch that makes a workgroup barrier illegal.",
      hint: "Branch on a varying lane predicate before the barrier.",
      acceptance: "At least one required participant can skip the dynamic barrier instance.",
    },
  ],
  glossary: ["LDS", "epoch", "barrier convergence", "atomic scope", "ordering"],
};

const gemmMapping: Lesson = {
  id: "gemm-tiling",
  module: 4,
  order: 0,
  title: "Tiled GEMM: map ownership first",
  summary:
    "Design a workgroup tile by fixing global output ownership, cooperative loads, and boundary predicates before optimizing math.",
  duration: "55 min",
  prerequisites: ["LDS and barriers", "Matrix multiplication"],
  objectives: [
    "Map each workgroup to one C tile and each lane to disjoint output fragments.",
    "Prove cooperative A/B loads stay in bounds at edge tiles.",
    "Separate one exact bounded protected Slice 1 run from compiler-origin, proof, refinement, and generalized-GEMM claims.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Full GEMM roadmap",
      detail:
        "fe2o3 now authenticates the fixed attributed LDS Slice 1 source through canonical V5 Kernel IR into an exact compiler-owned descriptor and single-use Worker V2 handoff, admits that handoff into a sealed authority-free exact-profile registry, finalizes it through direct upstream LLVM target-machine and LLD library APIs, prepares exact borrowed A/B/C views with a generated inert host adapter, and consumes those values through a private one-shot Joined -> Loaded -> Completed -> Unloaded lifecycle with exact context, resource, ABI, completion, cancellation, and terminal-unload checks. One public protected route passed on mi300x gfx942 over all 256 output bits with unchanged A/B values and A/B/C guard canaries. The exact bounded Slice 1 source and run are functional. They do not authenticate compiler origin, consume Verus certificates, prove compiler refinement or general illegal-access/race freedom, generalize GEMM, or cover protected Slice 3/4, so they are not generalized GEMM or a complete production authority chain.",
    },
    {
      kind: "compiler-hsaco-observed",
      label: "Reusable MFMA/LDS mechanics",
      detail:
        "A narrow gfx942 BF16 16x16x16 MFMA and XOR4 LDS tile/stream contract exists in the device, Kernel IR, target, and lowering layers.",
      reference: pinnedReference(
        [
          "cargo +nightly-2026-04-03 test --locked -p fe2o3-device -p fe2o3-kernel-ir -p dialect-amdgcn",
        ],
        [
          "crates/fe2o3-device/src/tensor.rs",
          "crates/fe2o3-kernel-ir/src/matrix.rs",
          "crates/dialect-amdgcn/src/lib.rs",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("gemm-tiling/public-layout-proof"),
    {
      kind: "staged-evidence",
      evidenceIds: [...stagedEvidenceOrder],
    },
    narrativeSection("gemm-tiling/mapping"),
    narrativeSection("gemm-tiling/loop-proof"),
  ],
  tabs: completeTabs(
    exactGemmKernelTab(),
    exactGemmProofTab(),
    exactGemmHostTab(),
    {
      language: "text",
      code: gemmProtectedResult,
    },
  ),
  diagram: "gemm",
  exercises: [
    {
      prompt: "Prove the C stores for a 16x16 workgroup tile are injective.",
      hint: "Factor the map into a unique lane fragment and unique element within that fragment.",
      acceptance: "Equal output coordinates imply equal workgroup, lane, and fragment element identities.",
    },
  ],
  glossary: ["GEMM", "tile", "MFMA", "accumulator invariant", "edge predicate"],
};

const gemmProof: Lesson = {
  id: "gemm-proof-plan",
  module: 4,
  order: 1,
  title: "GEMM proof and evidence plan",
  summary:
    "Turn the tiled algorithm into independent proof obligations and define the evidence needed before calling it complete.",
  duration: "38 min",
  prerequisites: ["Tiled GEMM mapping"],
  objectives: [
    "Partition GEMM assurance into memory, synchronization, function, and numerical properties.",
    "Pair every positive theorem with a targeted mutation.",
    "Define compiler, HSACO, and gfx942 observations for the same artifact identity.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Acceptance plan",
      detail:
        "The fixed Slice 1 attributed source reaches canonical V5 Kernel IR, an exact compiler descriptor, an inert final HSACO receipt through direct LLVM/LLD APIs, exact generated host preparation, the one-shot Joined -> Loaded -> Completed -> Unloaded implementation, and one bounded protected mi300x measurement; its bounded identity-bound source/model relation verifies, and exact Slice 3/4 graphs reach inspected machine shape. Compiler-origin binding, proof-certificate consumption, Slice 2-4 proof extension, generalized attributed source, protected Slice 3/4 execution, compiler and machine refinement, general safety evidence, and an IEEE numerical contract remain required before promotion.",
    },
  ],
  sections: [
    narrativeSection("gemm-proof-plan/proof-ledger"),
    narrativeSection("gemm-proof-plan/evidence"),
  ],
  tabs: completeTabs(
    exactGemmKernelTab(),
    exactGemmProofTab(),
    exactGemmHostTab(),
    {
      language: "text",
      code: gemmProtectedResult,
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Design one negative test for each row in the property ledger.",
      hint: "The mutation must fail at the named property, not during parsing.",
      acceptance: "Six well-scoped mutations with stable expected diagnostics or failed clauses.",
    },
  ],
  glossary: ["property ledger", "translation validation", "numerical oracle"],
};

const softmax: Lesson = {
  id: "softmax-invariant",
  module: 5,
  order: 0,
  title: "Softmax: specify stability first",
  summary:
    "Derive a numerically stable row softmax and make masking, empty rows, and approximation error explicit.",
  duration: "42 min",
  prerequisites: ["Reductions", "Floating-point error basics"],
  objectives: [
    "State the max-subtracted softmax specification.",
    "Handle all-masked rows without undefined division.",
    "Separate real-number identities from target math-library behavior.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Softmax roadmap",
      detail:
        "No current fe2o3 source-to-HSACO softmax kernel is claimed. The lesson prepares the contracts required by flash attention.",
    },
  ],
  sections: [
    narrativeSection("softmax-invariant/spec"),
    narrativeSection("softmax-invariant/proof"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: `// DESIGN ONLY\nlet m = reduce_max(active_scores);\nlet weights = map(active_scores, |x| exp(x - m));\nlet z = reduce_sum(weights);\nwrite_row(map(weights, |w| w / z));`,
      explanatory: true,
    },
    {
      language: "text",
      code: `ensures unmasked_sum(output) ~= 1\nensures masked(i) ==> output[i] == 0\nensures finite_inputs && nonempty_active ==> denominator > 0`,
      explanatory: true,
    },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "The output contract and error budget are ready to instantiate once source lowering, device math, and reduction execution are connected.",
      ),
    },
  ),
  diagram: "reduction",
  exercises: [
    {
      prompt: "Define the all-masked row behavior for your application.",
      hint: "Avoid a zero denominator and state whether the output is zero, NaN, or an error.",
      acceptance: "One explicit behavior appears in both the functional spec and host admission policy.",
    },
  ],
  glossary: ["softmax", "max subtraction", "error budget", "masking"],
};

const flash: Lesson = {
  id: "flash-attention",
  module: 5,
  order: 1,
  title: "Flash attention: online invariant",
  summary:
    "Inspect the exact fixed-shape causal Phase A kernel, then extend its online invariant toward compilation and GPU execution.",
  duration: "65 min",
  prerequisites: ["GEMM proof plan", "Softmax invariant"],
  objectives: [
    "Derive the online max, normalization sum, and output correction invariant.",
    "Track Q, K, V, score, and output tiles through distinct memory epochs.",
    "List masking, precision, and machine-effect evidence required for closure.",
  ],
  claims: [
    sourceMilestoneClaim("flash-attention-source-v1"),
    sourceMilestoneClaim("flash-attention-verus-v1"),
  ],
  sections: [
    narrativeSection("flash-attention/online"),
    narrativeSection("flash-attention/effects"),
    narrativeSection("flash-attention/closure"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: flashAttentionKernel,
      sourcePath: flashAttentionSource.primarySourcePath,
      sourceCommit: flashAttentionSource.commit,
      sourceSha256: flashAttentionSource.primarySourceSha256,
      evidenceId: flashAttentionSource.id,
      explanatory: false,
    },
    {
      language: "rust",
      code: flashAttentionProof,
      sourcePath: flashAttentionVerus.primarySourcePath,
      sourceCommit: flashAttentionVerus.commit,
      sourceSha256: flashAttentionVerus.primarySourceSha256,
      evidenceId: flashAttentionVerus.id,
      explanatory: false,
      notice:
        "This pinned rational model proves the online recurrence and ownership obligations. Exponential-law, IEEE FP32/OCML, source refinement, compiled effects, and GPU execution remain open.",
    },
    {
      language: "bash",
      code: noHost,
      explanatory: true,
      notice:
        "No generated host/runtime adapter exists for this exact FlashAttention profile.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Exact ordinary attributed source, an independent two-pass FP64 oracle, debug/release vectors, executable models, a pinned Verus proof of the rational online recurrence, and publication-gated exact compiler admission are public. Remaining gaps: exponential and IEEE FP32/OCML refinement, direct LLVM/LLD finalization, generated host/runtime, protected gfx942 execution, and source/model-to-machine refinement. No functional hardware result is claimed.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: the proof covers the fixed rational model, not compiled Rust, machine semantics, race freedom, or GPU execution.",
    },
  ),
  diagram: "attention",
  exercises: [
    {
      prompt: "Extend the online invariant with a causal mask.",
      hint: "Quantify only keys whose absolute position does not exceed the query position.",
      acceptance: "The processed set, maximum, sum, and numerator all use the identical masked domain.",
    },
  ],
  glossary: ["flash attention", "online softmax", "causal mask", "numerical refinement"],
};

export const modules3to5: CurriculumModule[] = [
  {
    number: 3,
    title: "Collectives and synchronization",
    summary: "Reason about scope, participation, epochs, and target gates.",
    lessons: [collectives, synchronization],
  },
  {
    number: 4,
    title: "Tiled GEMM",
    summary: "Design tile ownership and decompose the proof before optimization.",
    lessons: [gemmMapping, gemmProof],
  },
  {
    number: 5,
    title: "Softmax and attention",
    summary: "State online numerical invariants and fused memory effects.",
    lessons: [softmax, flash],
  },
];
