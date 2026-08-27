import { currentState } from "./current-state";
import { narrativeSection } from "./narrative-registry";
import flashAttentionKernel from "../../examples/flash_attention_general_v1/src/kernel.rs?raw";
import flashAttentionHost from "../../examples/flash_attention_general_v1/src/main.rs?raw";
import flashAttentionReference from "../../examples/flash_attention_general_v1/src/reference.rs?raw";
import flashAttentionMilestoneSpec from "../../examples/semantic_reference_vnext/flash_attention_verus.rs?raw";
import gemmMilestoneSpec from "../../examples/semantic_reference_vnext/gemm_verus.rs?raw";
import rowSoftmaxKernel from "../../examples/row_softmax_general_v1/src/kernel.rs?raw";
import rowSoftmaxHost from "../../examples/row_softmax_general_v1/src/main.rs?raw";
import rowSoftmaxReference from "../../examples/row_softmax_general_v1/src/reference.rs?raw";
import rowSoftmaxMilestoneSpec from "../../examples/semantic_reference_vnext/softmax_verus.rs?raw";
import gemmSlice1Kernel from "../../examples/gemm_design.rs?raw";
import dynamicGemmKernel from "../../examples/tiled_gemm_general_v1/src/kernel.rs?raw";
import dynamicGemmHost from "../../examples/tiled_gemm_general_v1/src/main.rs?raw";
import dynamicGemmHip from "../../examples/tiled_gemm_general_v1/benchmark_hip.cpp?raw";
import dynamicGemmReference from "../../examples/tiled_gemm_general_v1/src/reference.rs?raw";
import wave64CollectivesKernel from "../../examples/wave64_collectives_v1/src/kernel.rs?raw";
import wave64CollectivesReference from "../../examples/wave64_collectives_v1/src/oracle.rs?raw";
import workgroupSyncKernel from "../../examples/workgroup_sync_v1/src/kernel.rs?raw";
import workgroupSyncReference from "../../examples/workgroup_sync_v1/src/contract.rs?raw";
import referenceRefinementProof from "../../examples/reference_refinement_v1.rs?raw";
import {
  FE2O3_PIN,
  historicalReference,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import {
  completeReferenceSpecTabs,
  completeReferenceTabs,
  noHost,
  resultText,
} from "./shared";
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

const gemmSafeSource = sourceMilestoneRecord(
  "tiled-gemm-safe-source-v1",
);
const dynamicGemmSource = sourceMilestoneRecord(
  "dynamic-gemm-executable-source-v1",
);
const qualificationCommit = dynamicGemmSource.commit;
const qualificationTree = dynamicGemmSource.tree;
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
const referenceRefinementSource = sourceMilestoneRecord(
  "reference-refinement-v1",
);
const gemmProtectedResult = resultText(
  "gpu-observed",
  `Exact bounded Slice 1 protected result

This result belongs to the historical protected source identified below. It does not transfer to the current safe kernel source tab.

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

const dynamicGemmResult = resultText(
  "gpu-observed",
  [
    "Historical safe dynamic BF16/F32 MFMA GEMM on MI300X (gfx942)",
    "",
    "Rust -> semantic MIR -> ranked PLIRON -> Kernel IR -> formal/ranked memory",
    "-> gfx942 LLVM -> HSACO -> fe2o3-host",
    "2 semantic functions, 81 correspondence blocks, 8 formal-memory admissions,",
    "12 ranked dynamic-index discharges, workgroup [64, 1, 1], 38,286 LLVM bytes",
    "",
    "PASS packed                       M=16 N=16 K=16 groups=1 max_error=0",
    "PASS strided-all-tails            M=17 N=19 K=18 groups=4 max_error=0",
    "PASS multi-workgroup-dynamic-k    M=33 N=35 K=33 groups=9 max_error=0",
    "PASS zero-k-epilogue              M=17 N=19 K=0 groups=4 max_error=0",
    "ISA: v_mfma_f32_16x16x16_bf16",
    "",
    "Matched direct-kernel benchmark, 2026-08-24, 15 event-timed samples:",
    "size    Fe2O3 median   HIP median   Fe2O3/HIP   Fe2O3 throughput",
    "256       13.620 us      9.138 us      1.490x      2,463.56 GFLOP/s",
    "512       28.038 us     25.262 us      1.110x      9,574.09 GFLOP/s",
    "1024     138.005 us    130.514 us      1.057x     15,560.87 GFLOP/s",
    "",
    "This is a like-for-like MFMA kernel and host-launch comparison, not rocBLAS.",
    "Fe2O3 is safer and more expressive here; it is not faster than HIP yet.",
    "This result came from the retired nonpublishing qualification route.",
    "Current production compilation stops at an unresolved generic race proof before KIR.",
    "Protected release publication and complete source-to-machine refinement remain separate.",
  ].join("\n"),
);

const rowSoftmaxResult = resultText(
  "gpu-observed",
  `Historical dynamic row softmax qualification on MI300X/gfx942

PASS single-column      rows=3 columns=1 stride=7 max_error=0
PASS wave-tail          rows=5 columns=63 stride=71 max_error=1.4901161e-8
PASS multi-iteration    rows=7 columns=257 stride=269 max_error=5.5879354e-9
PASS maximum-width      rows=2 columns=4096 stride=4103 max_error=6.0535967e-9

The retired row-softmax qualification oracle collected two semantic functions and 58 correspondence blocks, admitted three formal-memory boundaries, discharged four ranked dynamic-index obligations, lowered subgroup max/sum through lane shuffles, emitted a 21,941-byte LLVM module, finalized HSACO, and launched it through fe2o3-host at the pinned historical commit. That workload-selecting route is not present in the current compiler and cannot complete the production transaction. Disassembly contained lane shuffles and no MFMA, which is intentional: softmax is a reduction workload, not a matrix contraction.

The logical column count and independent input/output strides are dynamic. Checked fallback loads supply negative infinity outside the logical row, row-striped ownership suppresses inactive stores, and output padding remains untouched. These qualification results establish the listed cases against an independent CPU oracle; they are not a proof for every input or a performance claim.`,
);

const flashAttentionResult = resultText(
  "gpu-observed",
  `Historical dynamic fused attention qualification on MI300X/gfx942

PASS tails-and-strides        heads=1 queries=16/16 keys=13/16 depth=18 value_dim=7 max_error=4.4703484e-8
PASS multi-head-multi-tile   heads=2 queries=17/32 keys=19/32 depth=33 value_dim=16 max_error=5.9604645e-8

The retired FlashAttention qualification oracle collected two semantic functions and 219 correspondence blocks, admitted 13 formal-memory boundaries, discharged 17 ranked dynamic-index obligations, emitted a 162,782-byte LLVM module, finalized HSACO, and launched it through fe2o3-host at the pinned historical commit. That workload-selecting route is not present in the current compiler and cannot complete the production transaction. Disassembly contained V_MFMA_F32_16X16X16_BF16 for QK score tiles and subgroup shuffles. One key-tile pass advances the stable online maximum, denominator, and V numerator; scores are never materialized in global memory.

The kernel accepts runtime head count, padded query/key lengths, depth up to 1,024, keys up to 4,096, value width up to 16, independent legal strides, scale, and an additive mask for causal, padding, or application masks. Q and K are BF16; V, mask, accumulation, and output are FP32. The current PV contraction is scalar/reduction based, so this is correctness evidence rather than a claim of parity with a tuned production FlashAttention library.`,
);

function exactDynamicGemmKernelTab() {
  return {
    language: "rust" as const,
    code: dynamicGemmKernel,
    sourcePath: dynamicGemmSource.primarySourcePath,
    sourceCommit: dynamicGemmSource.commit,
    sourceSha256: dynamicGemmSource.primarySourceSha256,
    evidenceId: dynamicGemmSource.id,
    explanatory: false,
  };
}

function exactDynamicGemmHipTab() {
  return {
    language: "cpp" as const,
    code: dynamicGemmHip,
    sourcePath: "examples/tiled_gemm_general_v1/benchmark_hip.cpp",
    sourceCommit: dynamicGemmSource.commit,
    sourceSha256:
      "24233c267c1bad3bde9c4897fb063d2e48d6d2fa07439dd04f4d0c14bd2ea84c",
    evidenceId: dynamicGemmSource.id,
    explanatory: false,
  };
}

function exactDynamicGemmHostTab() {
  return {
    language: "rust" as const,
    code: dynamicGemmHost,
    sourcePath: "examples/tiled_gemm_general_v1/src/main.rs",
    sourceCommit: dynamicGemmSource.commit,
    sourceSha256:
      "6a67bb4fbf8a097389ce184764db2734a4b88037ef65ac607c12effede331a05",
    evidenceId: dynamicGemmSource.id,
    explanatory: false,
  };
}

function exactTiledGemmKernelTab() {
  return {
    language: "rust" as const,
    code: gemmSlice1Kernel,
    sourcePath: gemmSafeSource.primarySourcePath,
    sourceCommit: gemmSafeSource.commit,
    sourceSha256: gemmSafeSource.primarySourceSha256,
    evidenceId: gemmSafeSource.id,
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
    sourceSha256:
      "13be2ab972a35d97dcdb36b45f3c07ab81c697d1d4c28461abffbbacd761ee36",
    explanatory: true,
    notice:
      "Historical archive only: this replay command and linked workload-specific HSA test exist at the pinned evidence commit. The exact Worker V2 route and test were deleted from the current unified production tree.",
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
    narrativeSection("reductions-scans/contribution-domain"),
  ],
  tabs: completeReferenceTabs(
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
      language: "rust",
      code: wave64CollectivesReference,
      sourcePath: "examples/wave64_collectives_v1/src/oracle.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "837aae894e5c04da4b598e45f344f2e5df0aa8bc6155acf0bf05809ecd86d407",
      explanatory: false,
      notice:
        "This safe sequential oracle defines the complete masked reduction and scan result consumed by the generic reference-refinement obligation.",
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
        "This current safe source/model record does not inherit the separately pinned typed host/runtime or protected gfx942 observation; see Implementation status for those historical evidence boundaries.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "This current safe source/model record remains independently reviewable. Separately pinned historical checkpoints contain exact compiler admission, direct upstream LLVM/LLD finalization, a typed one-shot runtime, and one protected four-mask gfx942 observation. Compiler and Verus-to-machine refinement remain open; those observations do not transfer hardware authority to the current source.",
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
  glossary: [
    "wave64",
    "active mask",
    "reduction",
    "scan",
    "participation scope",
    "contribution domain",
  ],
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
    narrativeSection("lds-barriers-atomics/final-observable-effect"),
  ],
  tabs: completeReferenceTabs(
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
      language: "rust",
      code: workgroupSyncReference,
      sourcePath: "examples/workgroup_sync_v1/src/contract.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "f1b32bea55b8a6b908caaeb3f08d069bf969231735966b81bc67aa0f87ed421c",
      explanatory: false,
      notice:
        "These safe sequential LDS-reduction and scoped-atomic oracles define the observable results; synchronization safety remains a separate compiler obligation.",
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
        "Exact separate LDS and scoped-atomic sources, CPU oracles, deterministic tests, and the bounded Verus model are public. Separately pinned historical checkpoints contain exact compiler profiles, opaque direct upstream LLVM/LLD finalizer receipts, typed argument admission, private one-shot host/runtime lifecycles, exact dynamic-LDS dispatch binding, and one bounded protected MI300X observation for each profile in debug and release. Those observations do not transfer to the current safe source. Remaining gaps: source/compiler/machine refinement, generalized illegal-access safety, and generalized race freedom. The hardware result is exact-profile evidence only.",
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
  title: "Dynamic GEMM end to end",
  summary:
    "Study a safe wave64 MFMA kernel and its pinned historical run while tracking the current generic production boundary.",
  duration: "24 min",
  prerequisites: ["Typed indexing and ownership", "Matrix multiplication"],
  objectives: [
    "Map one wave64 workgroup to a 16x16 output tile and one lane to four outputs.",
    "Follow the dynamic K loop through target-neutral matrix fragments to a gfx942 MFMA.",
    "See how a loop-carried accumulator keeps its MFMA contract and current-wave provenance on every CFG edge.",
    "Separate compiler-verified canonical-loop and total-output staging facts from aggregate replay authority and the workload-specific GEMM recurrence obligation.",
    "Use KernelResult and ? for fallible view and ownership construction, then consume zero-filled typed fragment loads directly.",
    "Compare the exact safe Rust kernel and host path with an equivalent HIP implementation.",
  ],
  claims: [
    sourceMilestoneClaim("dynamic-gemm-executable-source-v1"),
    {
      kind: "gpu-observed",
      label: "Pinned MI300X qualification run",
      detail:
        "At the pinned historical compiler commit, the exact safe Rust source compiled and launched through an explicit nonpublishing qualification oracle. Four dynamic correctness cases passed at zero error, the HSACO contained V_MFMA_F32_16X16X16_BF16, and a matched HIP comparison was recorded. Current main has retired this alternate qualification host route.",
      reference: historicalReference(
        qualificationCommit,
        qualificationTree,
        [
          "examples/tiled_gemm_general_v1/run-gfx942.sh",
        ],
        [
          "examples/tiled_gemm_general_v1/src/kernel.rs",
          "examples/tiled_gemm_general_v1/src/main.rs",
          "examples/tiled_gemm_general_v1/run-gfx942.sh",
        ],
        {
          target: FE2O3_PIN.target,
          note: "Historical GPU observation. Current main retains the kernel and unified compiler machinery but not this alternate qualification host route.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("gemm-tiling/mapping"),
    narrativeSection("gemm-tiling/loop-proof"),
    narrativeSection("gemm-tiling/composed-reference"),
  ],
  tabs: [
    { kind: "kernel", label: "Kernel", ...exactDynamicGemmKernelTab() },
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: dynamicGemmReference,
      sourcePath: "examples/tiled_gemm_general_v1/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "80674fede2edfd020254e82637b77618bede8674d67b79e7d5c20ed780c1b5bc",
      explanatory: false,
      notice:
        "This host-allocating Vec reference is the runtime qualification oracle for MI300X. The complete oracle is not compiler-bound. The compiler can prove a one-dimensional input[index] over an identical symbolic ranked extent or an overflow-checked bounded static affine interval. This reference instead uses independent lengths, Vec allocation/return, multidimensional affine reads, nested reduction, and richer recurrence outside the admitted subset. Canonical unit-step loops are supported.",
    },
    {
      kind: "spec",
      label: "Sequential semantics",
      language: "rust",
      code: gemmMilestoneSpec,
      explanatory: true,
      notice:
        "This specification names the sequential result; it is not compiler-generated evidence. The workload-neutral compiler replays eligible exact point formulas and canonical loops. This Vec-returning source remains Incomplete for dynamic extent implication, multidimensional reads, nested recurrence, tensor-component theorem replay, numerical-error replay, and its complete hierarchy relation.",
    },
    {
      kind: "verus",
      label: "Verus refinement",
      language: "rust",
      code: referenceRefinementProof,
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: referenceRefinementSource.commit,
      sourceSha256:
        "55095841f5616c4af7c10bf57b8ea9178082f3bc4b130d9f8221e6e692c6761b",
      evidenceId: "reference-refinement-v1",
      explanatory: false,
      notice:
        "This verified workload-neutral source model explains equality-plus-hierarchy composition; it is not this compilation's generated report. Exact point formulas and overflow-safe canonical-loop termination are implemented. This reference's independent extents, multidimensional reads and nested recurrence, tensor-component and numerical-error replay, and the retained runtime remain Incomplete.",
    },
    { kind: "comparison", label: "Equivalent HIP", ...exactDynamicGemmHipTab() },
    { kind: "host", label: "Host", ...exactDynamicGemmHostTab() },
    {
      kind: "result",
      label: "MI300X result",
      language: "text",
      code: dynamicGemmResult,
    },
  ],
  diagram: "gemm-scalar",
  exercises: [
    {
      prompt: "Explain why two lanes or workgroups cannot write the same C element.",
      hint: "Follow the Tiled2D witness through workgroup tile, lane, and fragment component.",
      acceptance: "The argument identifies a unique workgroup, lane, and component for every store.",
    },
  ],
  glossary: ["GEMM", "stride", "epilogue", "DisjointSlice", "qualification"],
};

const gemmProof: Lesson = {
  id: "gemm-proof-plan",
  module: 4,
  order: 1,
  proofDetailsInitiallyOpen: true,
  title: "Proving and extending the MFMA kernel",
  summary:
    "Separate the pinned historical direct-global result from the current generic proof gap and the additional proof needed for cooperative LDS staging.",
  duration: "38 min",
  prerequisites: ["Dynamic GEMM end to end"],
  objectives: [
    "Partition a tiled optimization into memory, synchronization, function, and numerical properties.",
    "Pair every positive theorem with a targeted mutation.",
    "Define compiler, HSACO, and gfx942 observations for the same artifact identity.",
  ],
  claims: [
    sourceMilestoneClaim("tiled-gemm-safe-source-v1"),
    {
      kind: "design-only",
      label: "Acceptance plan",
      detail:
        "The fixed Slice 1 attributed source reaches canonical V5 Kernel IR, an exact compiler descriptor, an inert final HSACO receipt through direct LLVM/LLD APIs, exact generated host preparation, the one-shot Joined -> Loaded -> Completed -> Unloaded implementation, and one bounded protected mi300x measurement; its bounded identity-bound source/model relation verifies, and exact Slice 3/4 graphs reach inspected machine shape. Compiler-origin binding, proof-certificate consumption, Slice 2-4 proof extension, generalized attributed source, protected Slice 3/4 execution, compiler and machine refinement, general safety evidence, and an IEEE numerical contract remain required before promotion.",
    },
  ],
  sections: [
    narrativeSection("gemm-proof-plan/proof-ledger"),
    narrativeSection("gemm-tiling/general-contract"),
    narrativeSection("gemm-tiling/mutation-diagnostics"),
    narrativeSection("gemm-tiling/public-layout-proof"),
    {
      kind: "staged-evidence",
      evidenceIds: [...stagedEvidenceOrder],
    },
    narrativeSection("gemm-proof-plan/evidence"),
    narrativeSection("gemm-proof-plan/total-correctness-boundary"),
  ],
  tabs: completeReferenceTabs(
    exactTiledGemmKernelTab(),
    {
      language: "rust",
      code: dynamicGemmReference,
      sourcePath: "examples/tiled_gemm_general_v1/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "80674fede2edfd020254e82637b77618bede8674d67b79e7d5c20ed780c1b5bc",
      explanatory: false,
      notice:
        "This host-allocating Vec reference remains a runtime qualification oracle; the complete oracle is not compiler-bound. Exact point formulas and canonical loops can be compiler-bound, but its independent slice extents, Vec allocation/return, multidimensional accesses, and nested recurrence cannot. MFMA components bind exact stores at the claim boundary; tensor-component and BF16/F32 error-bound replay plus the retained runtime remain Incomplete.",
    },
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
  title: "Dynamic row softmax",
  summary:
    "Use safe Rust, dynamic row dimensions, and subgroup reductions, with a pinned historical qualification result and an explicit current boundary.",
  duration: "35 min",
  prerequisites: ["Reductions", "Floating-point error basics"],
  objectives: [
    "Map one wave to each row and distribute columns across its 64 lanes.",
    "Explain why subgroup shuffles, rather than MFMA, implement softmax.",
    "Trace dynamic bounds from safe Rust through ranked verification and GPU execution.",
    "Distinguish max/sum recurrence equality from generic contribution coverage and total-output composition.",
  ],
  claims: [
    {
      kind: "gpu-observed",
      label: "Pinned dynamic row softmax on MI300X",
      detail:
        "Four dynamic-shape and strided cases compiled through the explicit nonpublishing row-softmax qualification oracle and matched an independent CPU oracle on gfx942.",
      reference: historicalReference(
        qualificationCommit,
        qualificationTree,
        ["examples/row_softmax_general_v1/run-gfx942.sh"],
        [
          "examples/row_softmax_general_v1/src/kernel.rs",
          "examples/row_softmax_general_v1/src/main.rs",
          "examples/row_softmax_general_v1/run-gfx942.sh",
        ],
        {
          target: "gfx942:xnack-",
          note: "Historical qualification ran at compiler commit af0fd523e3b774377a9c5192cf0511e34fa19735; this is evidence for the four published cases, not a universal proof or performance result.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("softmax-invariant/spec"),
    narrativeSection("softmax-invariant/proof"),
    narrativeSection("softmax-invariant/composed-reference"),
  ],
  tabs: completeReferenceSpecTabs(
    {
      language: "rust",
      code: rowSoftmaxKernel,
      sourcePath: "examples/row_softmax_general_v1/src/kernel.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "58012e0d5168161cf48fa3f06644af04585c4e603af0a15b8737964ba96f04de",
      explanatory: false,
    },
    {
      language: "rust",
      code: rowSoftmaxReference,
      sourcePath: "examples/row_softmax_general_v1/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "8ff11a0aa3806c2fe7d5f5aab8c5b055316039de718b28d69c6042e439bed73a",
      explanatory: false,
      notice:
        "Safe sequential Rust defines dynamic rows, columns, strides, padding, and stable max subtraction for runtime qualification; the complete oracle is not compiler-bound. Exact point formulas and canonical loops can be compiler-bound. This oracle's independent extents, range slicing, iterators, Vec allocation, richer folds, and transcendentals remain outside that subset. ErrorBounded formula replay and the retained runtime remain Incomplete.",
    },
    {
      language: "rust",
      code: rowSoftmaxMilestoneSpec,
      explanatory: true,
      notice:
        "This specification names the sequential max, exponential, denominator, and normalization result. The compiler uses only generic fold, recurrence, output, hierarchy, and numerical-policy relations; this source remains Incomplete because its full MIR and transcendental semantics are not admitted.",
    },
    {
      language: "rust",
      code: referenceRefinementProof,
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: referenceRefinementSource.commit,
      sourceSha256:
        "55095841f5616c4af7c10bf57b8ea9178082f3bc4b130d9f8221e6e692c6761b",
      explanatory: false,
      notice:
        "This verified workload-neutral source model states the composition rule, not this compilation's generated receipt. Exact point formulas and overflow-safe canonical-loop termination are implemented. Dynamic extent implication and this oracle's range slices, richer folds, and exp semantics remain unsupported. ErrorBounded aggregate formula replay, the retained runtime, compiler projection, and LLVM-or-later refinement remain outside the claim.",
    },
    {
      language: "rust",
      code: rowSoftmaxHost,
      sourcePath: "examples/row_softmax_general_v1/src/main.rs",
      sourceCommit: qualificationCommit,
      sourceSha256:
        "8df056afb9e91aa3e42b4372860431612a77ef71b0abb7ebdd088c7210a5a1bd",
      explanatory: false,
      notice:
        "The kernel remains entirely safe Rust. Unsafe is confined to the ordinary host FFI boundaries for loading a code object and launching its generated ABI.",
    },
    {
      language: "text",
      code: rowSoftmaxResult,
      explanatory: true,
    },
  ),
  diagram: "reduction",
  exercises: [
    {
      prompt: "Add masking without overstating the proof boundary.",
      hint: "Encode inactive columns as negative infinity and keep at least one finite value in every row.",
      acceptance: "The added cases cover an interior mask, a tail mask, untouched output padding, and the all-masked rejection policy.",
    },
  ],
  glossary: ["softmax", "max subtraction", "error budget", "masking"],
};

const flash: Lesson = {
  id: "flash-attention",
  module: 5,
  order: 1,
  title: "Dynamic FlashAttention with MFMA",
  summary:
    "Fuse QK score tiles, masking, softmax, and the V contraction without materializing the score matrix.",
  duration: "55 min",
  prerequisites: ["GEMM proof plan", "Softmax invariant"],
  objectives: [
    "Trace BF16 QK fragments through target-neutral matrix types and gfx942 MFMA.",
    "Use an additive mask and subgroup reductions for dynamic key tails.",
    "Identify the current value-width and numerical limits without turning them into compiler assumptions.",
    "Separate the online rescaling recurrence from generic finite-loop and ownership facts, inert total-output staging, and aggregate replay authority.",
  ],
  claims: [
    {
      kind: "gpu-observed",
      label: "Pinned dynamic fused attention on MI300X",
      detail:
        "Two tail, stride, depth, and multi-head cases compiled through the explicit nonpublishing FlashAttention qualification oracle and matched an independent CPU oracle on gfx942.",
      reference: historicalReference(
        qualificationCommit,
        qualificationTree,
        ["examples/flash_attention_general_v1/run-gfx942.sh"],
        [
          "examples/flash_attention_general_v1/src/kernel.rs",
          "examples/flash_attention_general_v1/src/main.rs",
          "examples/flash_attention_general_v1/run-gfx942.sh",
        ],
        {
          target: "gfx942:xnack-",
          note: "Historical qualification ran at compiler commit af0fd523e3b774377a9c5192cf0511e34fa19735; no tuned-library performance claim is made.",
        },
      ),
    },
    sourceMilestoneClaim("flash-attention-verus-v1"),
  ],
  sections: [
    narrativeSection("flash-attention/online"),
    narrativeSection("flash-attention/effects"),
    narrativeSection("flash-attention/closure"),
    narrativeSection("flash-attention/composed-reference"),
  ],
  tabs: completeReferenceSpecTabs(
    {
      language: "rust",
      code: flashAttentionKernel,
      sourcePath: "examples/flash_attention_general_v1/src/kernel.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "0e46343e7634185a7944c8d97d05aafd5353bd942b472b964217e96b315a951c",
      explanatory: false,
    },
    {
      language: "rust",
      code: flashAttentionReference,
      sourcePath: "examples/flash_attention_general_v1/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "f14413bd3662973a8803cdfdd23e6c6b23facc9d4c627e4e91d7a1e63ee7f203",
      explanatory: false,
      notice:
        "Safe sequential Rust defines dynamic heads, strides, masks, fully-masked rows, and padding for runtime qualification; the complete oracle is not compiler-bound. Exact point formulas and canonical loops are generic, and PLIRON structurally reconciles separated point outputs. Independent extents and this oracle's Vec score allocation, multidimensional accesses, nested recurrence, and transcendentals exceed that subset. Tensor-component and numerical-error replay plus the retained runtime remain Incomplete.",
    },
    {
      language: "rust",
      code: flashAttentionMilestoneSpec,
      explanatory: true,
      notice:
        "This specification names the sequential masked online recurrence. The compiler vocabulary remains generic: bounded recurrence, fold, pointwise and separated output products, hierarchy coverage, and numerical policy. This source remains Incomplete for multidimensional reads, Vec score allocation, nested/eventful recurrence, helper semantics, tensor arithmetic, and transcendentals.",
    },
    {
      language: "rust",
      code: referenceRefinementProof,
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: referenceRefinementSource.commit,
      sourceSha256:
        "55095841f5616c4af7c10bf57b8ea9178082f3bc4b130d9f8221e6e692c6761b",
      explanatory: false,
      notice:
        "This verified workload-neutral source model states the generic composition rule, but is not a joined link from this dynamic oracle to the kernel. The compiler supports exact point formulas and canonical loops without recognizing attention; PLIRON structurally reconciles separated point outputs. Typed tensor components bind exact stores, but tensor-component formula replay is unsupported. Independent extents, richer recurrence, numerical-error replay, the retained runtime, compiler projection, and LLVM-or-later refinement remain Incomplete.",
    },
    {
      language: "rust",
      code: flashAttentionHost,
      sourcePath: "examples/flash_attention_general_v1/src/main.rs",
      sourceCommit: qualificationCommit,
      sourceSha256:
        "d119e41e3a15e0eb3e7866a439c23203b0e4983b3bd53d3fdc585e3bde2a4a25",
      explanatory: false,
      notice:
        "The host builds causal and padding masks, launches the generated ABI, compares every active output with an independent reference, and checks output padding. Unsafe is confined to the host code-object and launch FFI boundary.",
    },
    {
      language: "text",
      code: flashAttentionResult,
      explanatory: true,
      notice:
        "Evidence boundary: these are historical direct qualification launches and numerical comparisons for two cases. The workload-selecting route is retired; the record does not establish a current launch path, universal proof, complete numerical refinement, or tuned-library performance.",
    },
  ),
  diagram: "attention",
  exercises: [
    {
      prompt: "Add a windowed causal mask.",
      hint: "The additive mask is the workload policy; the compiler only sees ordinary indexed reads and arithmetic.",
      acceptance: "CPU and GPU agree for left and right window edges, query/key tails, and multiple heads.",
    },
  ],
  glossary: [
    "flash attention",
    "online softmax",
    "causal mask",
    "numerical refinement",
    "recurrence",
  ],
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
    title: "GEMM: correct, then fast",
    summary: "Run the dynamic baseline, then reason about a safe LDS/MFMA optimization.",
    lessons: [gemmMapping, gemmProof],
  },
  {
    number: 5,
    title: "Softmax and attention",
    summary: "Run dynamic wave reductions and fused MFMA attention through one compiler pipeline.",
    lessons: [softmax, flash],
  },
];
