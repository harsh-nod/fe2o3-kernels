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

const rowSoftmaxKernel = `#![allow(non_upper_case_globals)]

use fe2o3_device::{DeviceMath, DisjointSlice, kernel, thread};

const ROW_ELEMENTS: usize = 64;

#[kernel(
    typed,
    namespace = "b9c43562d541f2f0489f311058c425d85a7ea6c328a3991bb6da17bdf85f766c",
    launch(required = [64, 1, 1], max = [64, 1, 1]),
    control_flow(loop_bounds(64, 64, 64))
)]
pub fn row_softmax_v1(input: &[f32], mut output: DisjointSlice<f32>) {
    let lane = thread::index_1d().get();
    if lane == 0 {
        let mut maximum = f32::NEG_INFINITY;
        let mut index = 0_usize;
        while index < ROW_ELEMENTS {
            let value = input[index];
            if value > maximum {
                maximum = value;
            }
            index += 1;
        }

        let math = unsafe { DeviceMath::from_compiler() };
        let mut denominator = 0.0_f32;
        index = 0;
        while index < ROW_ELEMENTS {
            denominator += math.exp_f32(input[index] - maximum);
            index += 1;
        }

        index = 0;
        while index < ROW_ELEMENTS {
            let probability = math.exp_f32(input[index] - maximum) / denominator;
            if let Some(slot) = unsafe { output.get_mut_at(index) } {
                *slot = probability;
            }
            index += 1;
        }
    }
}
`;

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

const rowSoftmaxHost = `/// Inert exact token/buffer join before a runtime is observed.
#[must_use = "the joined row-softmax request must enter its one-shot lifecycle"]
pub struct JoinedProtectedRowSoftmaxV1<'input, 'output> {
    token: ProtectedRowSoftmaxV1HostTokenV1,
    host: GeneratedProtectedRowSoftmaxV1HostAdapterV1<'input, 'output>,
}

/// Consumes the sealed token and exact generated binding into one linear join.
pub fn join_protected_row_softmax_v1<'input, 'output>(
    token: ProtectedRowSoftmaxV1HostTokenV1,
    host: GeneratedProtectedRowSoftmaxV1HostAdapterV1<'input, 'output>,
) -> Result<JoinedProtectedRowSoftmaxV1<'input, 'output>, ProtectedRowSoftmaxV1JoinErrorV1> {
    validate_join(&token, &host)?;
    Ok(JoinedProtectedRowSoftmaxV1 { token, host })
}

impl<'input, 'output> JoinedProtectedRowSoftmaxV1<'input, 'output> {
    pub const fn token_identity(&self) -> ProtectedRowSoftmaxV1HostTokenIdentityV1 {
        self.token.identity()
    }

    pub const fn admission_identity(&self) -> ProtectedRowSoftmaxV1AdmissionIdentityV1 {
        self.token.admission_identity()
    }

    pub const fn finalized_artifact_identity(&self) -> FinalizedWorkerV2HsacoIdentityV1 {
        self.token.finalized_artifact_identity()
    }

    pub fn load<A: ReviewedProtectedRowSoftmaxV1RuntimeAdapterV1>(
        self,
        mut adapter: A,
    ) -> Result<
        LoadedProtectedRowSoftmaxV1<'input, 'output, A>,
        ProtectedRowSoftmaxV1LoadErrorV1<A::Error>,
    > {
        let context_identity = reviewed_adapter_call(|| unsafe { adapter.context_identity_v1() });
        if !self
            .host
            .observed_context_v1()
            .matches_core_context_identity_v1(context_identity)
        {
            return Err(ProtectedRowSoftmaxV1LoadErrorV1::ContextIdentity);
        }
        let state = load_after_context_match(self, adapter)?;
        Ok(LoadedProtectedRowSoftmaxV1 { state })
    }
}
`;

const rowSoftmaxResult = resultText(
  "compiler-hsaco-observed",
  `Fixed-width row-softmax V1 evidence boundary

Source: the ordinary example-owned attributed Rust #[kernel] body at examples/row_softmax_v1/src/kernel.rs fixes one unmasked 64-element row, WG64, and three bounded scalar loops executed by lane zero. Complete syn AST structural admission, a fixed reviewed interpreter/model, and digest/certificate binding cover this exact source under authenticated 64-element input/output preconditions. They do not establish Rust semantic refinement or observe runtime satisfaction of those preconditions.
CPU: independent host reference and numerical-oracle tests exist; they are not GPU observations.
Verus: the mathematical and address-set models verify bounded indices, row extents, and conditional disjoint-address obligations. They do not model concrete memory events or prove source-to-machine race freedom.
Compiler/code object: focused source admission, pinned upstream LLVM target-machine plus in-process LLD finalization, and inspection mechanics exist. Release A 31bf96a21c0a2bbfb55c44f9a22b7350cabcfcb1/tree 293c6d39e47d64f5949d450d6041dc598aafd0fe and manifest B fd89390788adc5670c54ecc2517b9720f2f80113/tree af0156687517c0e71eb0d607917964b7c375af43 bind manifest SHA-256 9c7dc4a08f2f972b581ffa0f88bf8834d2098f21ff57b1a8594dd4dfca03759c and one retained HSACO SHA-256 0864047320a7ade5eba29d3fbb3ef9efefcf2a1378097061010d163af461db93. Two fresh complete MI300X runs passed; independent review accepted the evidence package. These non-GPU runs establish bounded compiler/code-object reproducibility and operator-selected reviewed integrity only, not authentication or refinement.
Host: typed disjoint input/output binding and Joined -> Loaded -> Completed -> Unloaded source mechanics exist. The durable broker prepared-session consume foundation remains AUTHORITY=none and supplies no anti-rollback, key provenance, hostile same-UID resistance, multiwriter coordination, cross-system atomicity, publication, runtime, or GPU authority; protected receipt injection and HSA load remain open.
GPU: no protected dispatch and no numerical GPU result are claimed.

This evidence does not justify a cuda-oxide parity promotion.`,
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
  duration: "70 min",
  prerequisites: ["LDS and barriers", "Matrix multiplication"],
  objectives: [
    "Map each workgroup to one C tile and each lane to disjoint output fragments.",
    "Prove cooperative A/B loads stay in bounds at edge tiles.",
    "Distinguish safe-Rust kernel source from sealed unsafe compiler and runtime implementation boundaries.",
    "Classify invalid kernels by the fe2o3 property that must reject them before artifact emission.",
    "Separate one exact bounded protected Slice 1 run from compiler-origin, proof, refinement, and generalized-GEMM claims.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Full GEMM roadmap",
      detail:
        "fe2o3 now authenticates the fixed attributed LDS Slice 1 source through canonical V5 Kernel IR into an exact compiler-owned descriptor and single-use Worker V2 handoff, admits that handoff into a sealed authority-free exact-profile registry, finalizes it through direct upstream LLVM target-machine and LLD library APIs, prepares exact borrowed A/B/C views with a generated inert host adapter, and consumes those values through a private one-shot Joined -> Loaded -> Completed -> Unloaded lifecycle with exact context, resource, ABI, completion, cancellation, and terminal-unload checks. One public protected route passed on mi300x gfx942 over all 256 output bits with unchanged A/B values and A/B/C guard canaries. The exact bounded Slice 1 source and run are functional. Issue #138 separately provides 10 safe companion UI failures, structured-Kernel-IR rejection of all 15 mutations, and an exact safe Rust mutation-oracle corpus. Individual managed MI300X builds authenticate all 15 full-baseline mutations through optimized MIR and reject each at compiler preflight with its exact property, stage, diagnostic code, root and span chain, and zero artifacts. Rust UI errors are not fe2o3 proof diagnostics, and mutation-oracle source-to-diagnostic evidence is not positive source-to-IR refinement. The positive production source reaches only a structural non-authoritative frontend correspondence; the private two-schedule final join is compiled but unhooked, Verus proof authority remains fail-closed pending a root-owned runtime closure, and no qualified protected general-GEMM launch exists. Complete-family SOURCE_TO_IR, LOWERING, and PROTECTED_EXECUTION remain false. Slice 1 does not authenticate compiler origin, consume Verus certificates, prove compiler refinement or general illegal-access/race freedom, generalize GEMM, or cover protected Slice 3/4, so it is not generalized GEMM or a complete production authority chain.",
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
    narrativeSection("gemm-tiling/general-contract"),
    narrativeSection("gemm-tiling/semantic-failures"),
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
    {
      prompt: "Explain why a companion UI failure and an authenticated mutation-oracle failure establish different facts.",
      hint: "Compare local typestate enforcement with one exact full-baseline source mutation reaching compiler preflight.",
      acceptance: "The rustc UI error carries no fe2o3 proof diagnostic; the authenticated mutation-oracle build reports its exact property, stage, and code with no artifact, but grants no positive refinement or execution authority.",
    },
  ],
  glossary: [
    "GEMM",
    "tile",
    "MFMA",
    "accumulator invariant",
    "edge predicate",
    "proof-required build",
  ],
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
  title: "Softmax: one fixed row, six evidence layers",
  summary:
    "Read the real width-64 kernel, address-set model, and typed host lifecycle without combining their separate authority levels.",
  duration: "42 min",
  prerequisites: ["Reductions", "Floating-point error basics"],
  objectives: [
    "Trace the attributed max, exponential-sum, and normalization loops.",
    "Distinguish address-set obligations from a source-to-machine race proof.",
    "Separate CPU, Verus, compiler/code-object, host, and GPU evidence.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Production GPU boundary",
      detail:
        "Real attributed source, CPU checks, a Verus/address-set model, and compiler/host mechanics exist. Production authority still fails closed before HSA load, so there is no protected GPU result and no parity promotion.",
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
      sourcePath: "examples/row_softmax_v1/src/kernel.rs",
      sourceCommit: "86c4ca67a673bfec966f79e6c701104db872d8ea",
      sourceSha256:
        "c4e2d6bb6eebe01eb6ae7c0da1a524113819a37b4ec2d0a5167f32cc3134e6f4",
      explanatory: false,
    },
    {
      language: "rust",
      code: rowSoftmaxAddressModel,
      sourcePath: "examples/row_softmax_v1/verus/row_softmax_v1.rs",
      sourceCommit: "dd841720591003f418d056b21a319088ce4559d6",
      explanatory: false,
    },
    {
      language: "rust",
      code: rowSoftmaxHost,
      sourcePath:
        "crates/fe2o3-host/src/protected_row_softmax_v1_lifecycle.rs",
      sourceCommit: "38b0005765944de55bb32c559bc8431637317b2b",
      explanatory: false,
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
      hint: "Change source, CPU policy, Verus premises, compiler profile, and typed host ABI independently.",
      acceptance: "The proposal names one test or proof obligation for each of the six evidence layers.",
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
    "Inspect the exact fixed-shape causal Phase A kernel and its typed host/runtime mechanics, then close the protected execution and refinement gaps.",
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
      code: `cargo test -p fe2o3-hsa-runtime \\
  --test flash_attention_v1_hardware \\
  independent_flash_oracle_covers_nominal_masked_equal_dominant_and_exceptional_cases \\
  -- --exact --nocapture

# This protected gate must fail closed before HSA load pending W0 authenticated
# HostLinkClosureV1, W1 broker executable identity, and later receipt injection.
cargo test -p fe2o3-hsa-runtime \\
  --test flash_attention_v1_hardware \\
  protected_gfx942_flash_attention_v1_hardware \\
  -- --ignored --exact --nocapture`,
      sourcePath:
        "crates/fe2o3-hsa-runtime/tests/flash_attention_v1_hardware.rs",
      sourceCommit: "26c80737e3380cd73df21d9a8abd1838cdfa76bc",
      explanatory: true,
      notice:
        "The exact typed four-buffer adapter and linear lifecycle are source-tested. The independent CPU oracle passes, while the protected gate deliberately refuses raw bytes or an artifact path and fails before HSA load pending W0 authenticated HostLinkClosureV1, W1 broker cargo-fe2o3 executable identity, and subsequent receipt injection.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Exact ordinary attributed source, proof-facing models, a pinned Verus proof of the rational online recurrence, compiler admission, upstream LLVM/LLD finalization, and B1/H1/N8/D16 typed host/runtime mechanics are public. Commit c1aecbb11017125e84209a333d978ec6d5bdddb1 makes pinned upstream LLVM 22.1.8 the sole exact compiler identity and records two clean MI300X reproductions that agree at every measured stage; canonical kernel-body SHA-256 d2aa57c0f468f574f44a9fea06bbb8e98aa9b60bb2d9303cc4d8b6caf0cfca54 covers 2540 bytes, while ROCm LLVM 7.2.4 is rejected drift. The four-buffer binding retains input leases and a unique output lease, rejects aliases, and enters a private linear join/load/dispatch-wait/unload lifecycle with reviewed HSA resource observation. Nine compile-fail boundaries and an independent strict-f32 CPU oracle pass. Commit 182d5673327bdbf642e3328a50903a4607a1756c also adds an exhaustive fixed-domain memory/effect checker and a pinned Verus source: 13 obligations verify and eight named mutations fail. Its expected-evidence descriptor is inert, has no authenticated Verus receipt, and establishes no compiler, LLVM/ISA, logical-address, machine-safety, generalized race-freedom, or GPU-execution join. The protected test fails closed before HSA load pending W0 authenticated HostLinkClosureV1, W1 broker cargo-fe2o3 executable identity, and subsequent linear receipt injection. Remaining gaps: protected gfx942 output, GPU/oracle numerical comparison, exponential and IEEE FP32/OCML refinement, authenticated proof consumption, and source/model-to-machine refinement. Reproducible machine bytes do not establish functional or numerical correctness. No functional hardware result is claimed. No protected GPU dispatch occurred.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: this is source/model, bounded Verus memory/effect, pinned upstream machine-reproducibility, host/runtime mechanics, compile-fail, and CPU-oracle evidence. It does not establish an authenticated proof receipt, compiler or OCML semantics, compiled address/machine refinement, machine memory safety, generalized race freedom, protected GPU dispatch, or a numerical GPU result.",
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
