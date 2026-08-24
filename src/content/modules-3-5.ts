import { currentState } from "./current-state";
import { narrativeSection } from "./narrative-registry";
import flashAttentionKernel from "../../examples/flash_attention_general_v1/src/kernel.rs?raw";
import flashAttentionHost from "../../examples/flash_attention_general_v1/src/main.rs?raw";
import rowSoftmaxKernel from "../../examples/row_softmax_general_v1/src/kernel.rs?raw";
import rowSoftmaxHost from "../../examples/row_softmax_general_v1/src/main.rs?raw";
import flashAttentionProof from "../../examples/flash_attention_v1/verus/flash_attention_v1.rs?raw";
import gemmSlice1Kernel from "../../examples/gemm_design.rs?raw";
import dynamicGemmKernel from "../../examples/tiled_gemm_general_v1/src/kernel.rs?raw";
import dynamicGemmHost from "../../examples/tiled_gemm_general_v1/src/main.rs?raw";
import dynamicGemmHip from "../../examples/tiled_gemm_general_v1/benchmark_hip.cpp?raw";
import wave64CollectivesKernel from "../../examples/wave64_collectives_v1/src/kernel.rs?raw";
import workgroupSyncKernel from "../../examples/workgroup_sync_v1/src/kernel.rs?raw";
import {
  FE2O3_PIN,
  currentImplementationReference,
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

const gemmSafeSource = sourceMilestoneRecord(
  "tiled-gemm-safe-source-v1",
);
const dynamicGemmSource = sourceMilestoneRecord(
  "dynamic-gemm-executable-source-v1",
);
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
const flashAttentionVerus = sourceMilestoneRecord(
  "flash-attention-verus-v1",
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
  "runnable-now",
  [
    "Safe dynamic BF16/F32 MFMA GEMM on MI300X (gfx942)",
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
    "256       13.652 us      9.152 us      1.492x      2,457.79 GFLOP/s",
    "512       28.170 us     25.254 us      1.115x      9,529.13 GFLOP/s",
    "1024     138.112 us    130.541 us      1.058x     15,548.82 GFLOP/s",
    "",
    "This is a like-for-like MFMA kernel and host-launch comparison, not rocBLAS.",
    "Fe2O3 is safer and more expressive here; it is not faster than HIP yet.",
    "Protected release publication and complete source-to-machine refinement remain separate.",
  ].join("\n"),
);

const rowSoftmaxAddressModel = `pub open spec fn lane_input_index_v1(lane: nat) -> nat { lane }
pub open spec fn lane_scratch_index_v1(lane: nat) -> nat { lane }
pub open spec fn lane_output_index_v1(lane: nat) -> nat { lane }

pub open spec fn element_address_v1(base: int, index: nat) -> int {
    base + element_bytes_v1() * index
}

pub open spec fn row_region_fits_u64_v1(base: int) -> bool {
    0 <= base && base + row_bytes_v1() <= 0x1_0000_0000_0000_0000int
}

pub open spec fn separate_rows_v1(input_base: int, output_base: int) -> bool {
    input_base + row_bytes_v1() <= output_base
        || output_base + row_bytes_v1() <= input_base
}

pub proof fn active_lane_indices_are_in_bounds_v1(active: Seq<bool>, lane: nat)
    requires
        explicit_activity_mask_v1(active),
        lane < row_elements_v1(),
    ensures
        active[lane as int],
        lane_input_index_v1(lane) < row_elements_v1(),
        lane_scratch_index_v1(lane) < row_elements_v1(),
        lane_output_index_v1(lane) < row_elements_v1(),
{
}

pub proof fn active_element_address_is_in_row_v1(base: int, lane: nat)
    requires
        row_region_fits_u64_v1(base),
        lane < row_elements_v1(),
    ensures
        base <= element_address_v1(base, lane),
        element_address_v1(base, lane) + element_bytes_v1() <= base + row_bytes_v1(),
        element_address_v1(base, lane) + element_bytes_v1()
            <= 0x1_0000_0000_0000_0000int,
{
}

pub proof fn separate_input_and_output_accesses_do_not_alias_v1(
    input_base: int,
    output_base: int,
    reader: nat,
    writer: nat,
)
    requires
        row_region_fits_u64_v1(input_base),
        row_region_fits_u64_v1(output_base),
        separate_rows_v1(input_base, output_base),
        reader < row_elements_v1(),
        writer < row_elements_v1(),
    ensures
        element_address_v1(input_base, reader)
            != element_address_v1(output_base, writer),
{
    active_element_address_is_in_row_v1(input_base, reader);
    active_element_address_is_in_row_v1(output_base, writer);
}

pub proof fn distinct_output_element_addresses_v1(base: int, left: nat, right: nat)
    requires
        row_region_fits_u64_v1(base),
        left < row_elements_v1(),
        right < row_elements_v1(),
        left != right,
    ensures
        element_address_v1(base, lane_output_index_v1(left))
            != element_address_v1(base, lane_output_index_v1(right)),
{
}
`;

const rowSoftmaxResult = resultText(
  "gpu-observed",
  `Dynamic row softmax qualification on MI300X/gfx942

PASS single-column      rows=3 columns=1 stride=7 max_error=0
PASS wave-tail          rows=5 columns=63 stride=71 max_error=1.4901161e-8
PASS multi-iteration    rows=7 columns=257 stride=269 max_error=5.5879354e-9
PASS maximum-width      rows=2 columns=4096 stride=4103 max_error=6.0535967e-9

The production compiler collected two semantic functions and 58 correspondence blocks, admitted three formal-memory boundaries, discharged four ranked dynamic-index obligations, lowered subgroup max/sum through lane shuffles, emitted a 21,941-byte LLVM module, finalized HSACO, and launched it through fe2o3-host. Disassembly contained lane shuffles and no MFMA, which is intentional: softmax is a reduction workload, not a matrix contraction.

The logical column count and independent input/output strides are dynamic. Checked fallback loads supply negative infinity outside the logical row, row-striped ownership suppresses inactive stores, and output padding remains untouched. These qualification results establish the listed cases against an independent CPU oracle; they are not a proof for every input or a performance claim.`,
);

const flashAttentionResult = resultText(
  "gpu-observed",
  `Dynamic fused attention qualification on MI300X/gfx942

PASS tails-and-strides        heads=1 queries=16/16 keys=13/16 depth=18 value_dim=7 max_error=4.4703484e-8
PASS multi-head-multi-tile   heads=2 queries=17/32 keys=19/32 depth=33 value_dim=16 max_error=5.9604645e-8

The same production pipeline collected two semantic functions and 219 correspondence blocks, admitted 13 formal-memory boundaries, discharged 17 ranked dynamic-index obligations, emitted a 162,782-byte LLVM module, finalized HSACO, and launched it through fe2o3-host. Disassembly contained V_MFMA_F32_16X16X16_BF16 for QK score tiles and subgroup shuffles. One key-tile pass advances the stable online maximum, denominator, and V numerator; scores are never materialized in global memory.

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
      "c324f239a9e5641c1861cbbb3800e8398cebad48bb125473b2b75ab85d3d4fc7",
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
      "This tab is a replay command for the exact pinned hardware test, not a copy of the linked Rust file.",
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
    "Build and run a safe wave64 MFMA kernel with dynamic shapes, strides, tails, multiple workgroups, and an alpha/beta epilogue.",
  duration: "24 min",
  prerequisites: ["Typed indexing and ownership", "Matrix multiplication"],
  objectives: [
    "Map one wave64 workgroup to a 16x16 output tile and one lane to four outputs.",
    "Follow the dynamic K loop through target-neutral matrix fragments to a gfx942 MFMA.",
    "See how a loop-carried accumulator keeps its MFMA contract and current-wave provenance on every CFG edge.",
    "Use KernelResult and ? for fallible view and ownership construction, then consume zero-filled typed fragment loads directly.",
    "Compare the exact safe Rust kernel and host path with an equivalent HIP implementation.",
  ],
  claims: [
    sourceMilestoneClaim("dynamic-gemm-executable-source-v1"),
    {
      kind: "runnable-now",
      label: "Current MI300X qualification path",
      detail:
        "The exact safe Rust source compiles and launches through the workload-neutral production stack. Four dynamic correctness cases pass at zero error, the HSACO contains V_MFMA_F32_16X16X16_BF16, and a matched HIP comparison is recorded below.",
      reference: currentImplementationReference(
        [
          "examples/tiled_gemm_general_v1/run-gfx942.sh",
        ],
        [
          "examples/tiled_gemm_general_v1/src/kernel.rs",
          "examples/tiled_gemm_general_v1/src/main.rs",
          "examples/tiled_gemm_general_v1/run-gfx942.sh",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("gemm-tiling/mapping"),
    narrativeSection("gemm-tiling/loop-proof"),
  ],
  tabs: [
    { kind: "kernel", label: "Kernel", ...exactDynamicGemmKernelTab() },
    { kind: "verus", label: "Equivalent HIP", ...exactDynamicGemmHipTab() },
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
  title: "Proving and extending the MFMA kernel",
  summary:
    "Separate the working direct-global MFMA kernel from the additional proof needed for cooperative LDS staging.",
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
  ],
  tabs: completeTabs(
    exactTiledGemmKernelTab(),
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
    "Use safe Rust, dynamic row dimensions, and subgroup reductions to compile and run row softmax through the production pipeline.",
  duration: "35 min",
  prerequisites: ["Reductions", "Floating-point error basics"],
  objectives: [
    "Map one wave to each row and distribute columns across its 64 lanes.",
    "Explain why subgroup shuffles, rather than MFMA, implement softmax.",
    "Trace dynamic bounds from safe Rust through ranked verification and GPU execution.",
  ],
  claims: [
    {
      kind: "gpu-observed",
      label: "Dynamic row softmax on MI300X",
      detail:
        "Four dynamic-shape and strided cases compiled through the generic production pipeline and matched an independent CPU oracle on gfx942.",
      reference: currentImplementationReference(
        ["examples/row_softmax_general_v1/run-gfx942.sh"],
        [
          "examples/row_softmax_general_v1/src/kernel.rs",
          "examples/row_softmax_general_v1/src/main.rs",
          "examples/row_softmax_general_v1/run-gfx942.sh",
        ],
        {
          target: "gfx942:xnack-",
          note: "Qualification ran from current compiler main c88681a356516982bdb96496ac5f9839d0e91bd7; this is evidence for the four published cases, not a universal proof or performance result.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("softmax-invariant/spec"),
    narrativeSection("softmax-invariant/proof"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: rowSoftmaxKernel,
      sourcePath: "examples/row_softmax_general_v1/src/kernel.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "13c02223d099abfdc8415c3149721b6e98170da69f0725d39a45186a83116314",
      explanatory: false,
    },
    {
      language: "rust",
      code: rowSoftmaxAddressModel,
      sourcePath: "examples/row_softmax_v1/verus/row_softmax_v1.rs",
      sourceCommit: "dd841720591003f418d056b21a319088ce4559d6",
      sourceSha256:
        "cacf81e02eb071cc29b1124811e911097fd62e7d29556dda8380418a631f5db5",
      explanatory: true,
      notice:
        "This historical fixed-64 address model remains useful for its local ownership obligations. It does not prove the current dynamic row-softmax kernel or its source-to-machine lowering.",
    },
    {
      language: "rust",
      code: rowSoftmaxHost,
      sourcePath: "examples/row_softmax_general_v1/src/main.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "6bba6a37ce1db788207c59469a69c4a051ee7399c5da880041f650747be924ad",
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
  ],
  claims: [
    {
      kind: "gpu-observed",
      label: "Dynamic fused attention on MI300X",
      detail:
        "Two tail, stride, depth, and multi-head cases compiled through the generic production pipeline and matched an independent CPU oracle on gfx942.",
      reference: currentImplementationReference(
        ["examples/flash_attention_general_v1/run-gfx942.sh"],
        [
          "examples/flash_attention_general_v1/src/kernel.rs",
          "examples/flash_attention_general_v1/src/main.rs",
          "examples/flash_attention_general_v1/run-gfx942.sh",
        ],
        {
          target: "gfx942:xnack-",
          note: "Qualification ran from current compiler main c88681a356516982bdb96496ac5f9839d0e91bd7; no tuned-library performance claim is made.",
        },
      ),
    },
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
      sourcePath: "examples/flash_attention_general_v1/src/kernel.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "0e46343e7634185a7944c8d97d05aafd5353bd942b472b964217e96b315a951c",
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
        "This historical fixed-profile model proves the online recurrence and ownership obligations. It does not cover the dynamic executable kernel, exponential-law or IEEE FP32/OCML refinement, or source-to-machine refinement.",
    },
    {
      language: "rust",
      code: flashAttentionHost,
      sourcePath: "examples/flash_attention_general_v1/src/main.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "24ab06c4e5d3a6ffd4d859f3a4744106325d7d7cdcc7868ddd0fd9a294243e36",
      explanatory: false,
      notice:
        "The host builds causal and padding masks, launches the generated ABI, compares every active output with an independent reference, and checks output padding. Unsafe is confined to the host code-object and launch FFI boundary.",
    },
    {
      language: "text",
      code: flashAttentionResult,
      explanatory: true,
      notice:
        "Evidence boundary: these are direct qualification launches and numerical comparisons for two cases. They do not establish a universal proof, complete numerical refinement, or tuned-library performance.",
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
