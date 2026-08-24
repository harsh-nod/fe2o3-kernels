import { currentState } from "./current-state";
import { narrativeSection } from "./narrative-registry";
import moeTop2Kernel from "../../examples/moe_top2_v1/src/kernel.rs?raw";
import moeTop2Proof from "../../examples/moe_top2_v1/verus/moe_top2_v1.rs?raw";
import moeTop2Reference from "../../examples/moe_top2_v1/src/oracle.rs?raw";
import moeExpertKernel from "../../examples/moe_grouped_expert_general_v1/src/kernel.rs?raw";
import moeExpertHost from "../../examples/moe_grouped_expert_general_v1/src/main.rs?raw";
import moeExpertReference from "../../examples/moe_grouped_expert_general_v1/src/reference.rs?raw";
import referenceRefinementProof from "../../examples/reference_refinement_v1.rs?raw";
import {
  FE2O3_PIN,
  currentImplementationReference,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import {
  completeReferenceTabs,
  completeTabs,
  noHost,
  noKernel,
  noProof,
  resultText,
} from "./shared";
import {
  sourceMilestoneClaim,
  sourceMilestoneRecord,
} from "./source-milestones";
import {
  stagedEvidenceClaim,
  stagedEvidenceOrder,
} from "./staged-evidence";

const moeTop2Source = sourceMilestoneRecord("moe-top2-source-v1");
const moeTop2Verus = sourceMilestoneRecord("moe-top2-verus-v1");

const moeRouting: Lesson = {
  id: "moe-routing",
  module: 6,
  order: 0,
  title: "MoE routing: stable ownership",
  summary:
    "Establish the deterministic routing contract consumed by the dynamic grouped-expert kernel in the next lesson.",
  duration: "58 min",
  prerequisites: ["Scans", "Stable sorting", "Tiled GEMM"],
  objectives: [
    "State deterministic top-k and tie-breaking assumptions.",
    "Use counts and exclusive scans to assign expert ranges.",
    "Prove accepted token routes own unique bounded slots.",
  ],
  claims: [
    sourceMilestoneClaim("moe-top2-source-v1"),
    sourceMilestoneClaim("moe-top2-verus-v1"),
  ],
  sections: [
    narrativeSection("moe-routing/assumptions"),
    narrativeSection("moe-routing/permutation"),
  ],
  tabs: completeReferenceTabs(
    {
      language: "rust",
      code: moeTop2Kernel,
      sourcePath: moeTop2Source.primarySourcePath,
      sourceCommit: moeTop2Source.commit,
      sourceSha256: moeTop2Source.primarySourceSha256,
      evidenceId: moeTop2Source.id,
      explanatory: false,
    },
    {
      language: "rust",
      code: moeTop2Reference,
      sourcePath: "examples/moe_top2_v1/src/oracle.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "a91d913d7fb7a91e0a24008ad4f1a15663225eb457ac0b0e3227f724a147785c",
      explanatory: false,
      notice:
        "This safe sequential oracle defines deterministic top-2 tie breaking, capacity, compact slots, inverse permutation, and sentinels.",
    },
    {
      language: "rust",
      code: moeTop2Proof,
      sourcePath: moeTop2Verus.primarySourcePath,
      sourceCommit: moeTop2Verus.commit,
      sourceSha256: moeTop2Verus.primarySourceSha256,
      evidenceId: moeTop2Verus.id,
      explanatory: false,
      notice:
        "This pinned mathematical model proves routing, capacity, scan, slot, permutation, and sentinel obligations. IEEE FP32 and source-to-machine refinement remain open.",
    },
    {
      language: "bash",
      code: `VERUS=/absolute/path/to/pinned/verus \\
  examples/moe_top2_v1/run-memory-verus.sh

cargo test -p fe2o3-hsa-runtime \\
  --test moe_top2_v1_hardware \\
  independent_moe_oracle_covers_ties_capacity_permutation_inverse_and_sentinels \\
  -- --exact --nocapture

# This protected gate must fail closed before HSA load pending W0 authenticated
# HostLinkClosureV1, W1 broker executable identity, and later receipt injection.
cargo test -p fe2o3-hsa-runtime \\
  --test moe_top2_v1_hardware \\
  protected_gfx942_moe_top2_v1_hardware \\
  -- --ignored --exact --nocapture`,
      sourcePath: "crates/fe2o3-hsa-runtime/tests/moe_top2_v1_hardware.rs",
      sourceCommit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
      explanatory: true,
      notice:
        "The pinned logical memory/effect proof verifies 16 obligations and rejects eight mutations. The exact eight-buffer adapter and linear lifecycle are source-tested. The independent CPU oracle passes; the protected gate refuses artifact-path or raw-byte fallback and fails before HSA load pending W0 authenticated HostLinkClosureV1, W1 broker cargo-fe2o3 executable identity, and subsequent receipt injection.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Exact ordinary attributed source, an independent oracle, debug/release tests, a 6,561-case bounded corpus, executable models, a pinned Verus proof of the mathematical routing policy, exact compiler admission, opaque deterministic upstream LLVM/LLD finalization, and T8/E4/K2/C4 typed host/runtime mechanics are public. The eight-buffer binding retains logits shared read-only and seven unique read-write outputs, rejects every alias pair, and enters a private linear join/load/dispatch-wait/unload lifecycle with reviewed HSA resource observation. Five binder tests, five lifecycle tests, nine compile-fail boundaries, and the independent routing oracle pass on MI300X. Commit d9ee4d09a97e59982b5e9ccf2e3877fff84fab5b adds a separate exact bounded logical memory/effect model: Verus verifies 16 obligations and all eight pinned mutations fail at their named postconditions. Its copyable expected-evidence descriptor remains inert and cannot mint or join an authenticated receipt. The protected test fails closed before HSA load pending W0 authenticated HostLinkClosureV1, W1 broker cargo-fe2o3 executable identity, and subsequent receipt injection. Remaining gaps: protected GPU output and seven-buffer oracle comparison, authenticated proof consumption, IEEE FP32/compiler/logical-address refinement, exact expert compiler/finalizer/runtime/protected execution, and source/model-to-machine refinement. The logical model does not establish generalized machine memory safety or race freedom. No functional hardware result is claimed. No protected GPU dispatch occurred.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: this combines fixed source/model proof, bounded logical memory/effect proof, typed ownership/lifecycle, compile-fail, and CPU-oracle evidence. It does not establish authenticated proof consumption, compiled Rust or machine semantics, generalized machine memory safety or race freedom, protected GPU dispatch, expert computation, or a numerical GPU result.",
    },
  ),
  diagram: "moe",
  exercises: [
    {
      prompt: "Specify deterministic top-2 routing when two experts have equal logits.",
      hint: "Use expert ID as a secondary total-order key.",
      acceptance: "The ordered result is unique for every finite or policy-handled input bit pattern.",
    },
  ],
  glossary: ["mixture of experts", "top-k", "capacity", "stable rank", "permutation"],
};

const expertCompute: Lesson = {
  id: "moe-expert-compute",
  module: 6,
  order: 1,
  title: "Dynamic grouped-expert MoE with MFMA",
  summary:
    "Pack top-2 routes by expert, run one dynamic MFMA projection kernel for each expert, and combine weighted results in token order.",
  duration: "45 min",
  prerequisites: ["MoE routing", "GEMM proof plan"],
  objectives: [
    "Treat each expert's compacted token range as a dynamic matrix batch.",
    "Trace BF16 matrix fragments through MFMA and the gated bias epilogue.",
    "Carry route identity through expert output and deterministic combine.",
    "Explain why the compiler pipeline needs no routing or MoE recognizer.",
  ],
  claims: [
    {
      kind: "gpu-observed",
      label: "Top-2 grouped experts on MI300X",
      detail:
        "Five output widths across both sides of the 16-column tile boundary, with 41 tokens, 4 experts, 82 routes, K=35, strides, edge tiles, bias, gates, and combine, matched an independent CPU oracle exactly on gfx942.",
      reference: currentImplementationReference(
        ["examples/moe_grouped_expert_general_v1/run-gfx942.sh"],
        [
          "examples/moe_grouped_expert_general_v1/src/kernel.rs",
          "examples/moe_grouped_expert_general_v1/src/main.rs",
          "examples/moe_grouped_expert_general_v1/run-gfx942.sh",
        ],
        {
          target: "gfx942:xnack-",
          note: "Qualification ran from current compiler main af0fd523e3b774377a9c5192cf0511e34fa19735. This is evidence for five output-width cases, not a router proof or performance result.",
        },
      ),
    },
    sourceMilestoneClaim("moe-expert-verus-v1"),
  ],
  sections: [
    narrativeSection("moe-expert-compute/composition"),
    narrativeSection("moe-expert-compute/combine"),
    narrativeSection("moe-expert-compute/bounded-evidence"),
  ],
  tabs: completeReferenceTabs(
    {
      language: "rust",
      code: moeExpertKernel,
      sourcePath: "examples/moe_grouped_expert_general_v1/src/kernel.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "3db71a144f7a5d0c44aae9ae93dd3532eeb3867b34cd07cb8983209ce310f505",
      explanatory: false,
    },
    {
      language: "rust",
      code: moeExpertReference,
      sourcePath: "examples/moe_grouped_expert_general_v1/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "e90e671831b8cef17960c276b930e39257c4399a64034554c9cabb4dbca494b7",
      explanatory: false,
      notice:
        "Safe sequential Rust defines dynamic routed rows, reduction and output extents, strides, expert selection, bias, gate, and preserved padding for runtime qualification. Its Vec allocation, loops, and calls place it outside compiler-authenticated reference-effect V1.",
    },
    {
      language: "rust",
      code: referenceRefinementProof,
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "55095841f5616c4af7c10bf57b8ea9178082f3bc4b130d9f8221e6e692c6761b",
      explanatory: false,
      notice:
        "This verified workload-neutral theorem states the generic equality-plus-hierarchy rule; it does not authenticate the dynamic Vec-returning MoE oracle against this kernel. Dynamic arithmetic, routing-to-expert composition, and source-to-ISA refinement remain open.",
    },
    {
      language: "rust",
      code: moeExpertHost,
      sourcePath: "examples/moe_grouped_expert_general_v1/src/main.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "24838bcdd753efa2d5fac08798c10c4b75176cb18eee88bd05c20af4af04cb1d",
      explanatory: false,
      notice:
        "The host owns deterministic top-2 routing, packs each expert group, launches the same generated kernel for every nonempty expert, combines route-weighted outputs, and compares against an independent CPU oracle. Unsafe is confined to the host FFI boundary.",
    },
    {
      language: "text",
      code: resultText(
        "gpu-observed",
        "PASS top2-routed-moe tokens=41 experts=4 K=35 N=1 routes=82 max_error=0\nPASS top2-routed-moe tokens=41 experts=4 K=35 N=15 routes=82 max_error=0\nPASS top2-routed-moe tokens=41 experts=4 K=35 N=16 routes=82 max_error=0\nPASS top2-routed-moe tokens=41 experts=4 K=35 N=17 routes=82 max_error=0\nPASS top2-routed-moe tokens=41 experts=4 K=35 N=33 routes=82 max_error=0\n\nThe production compiler collected two semantic functions and 104 correspondence blocks, admitted 13 formal-memory boundaries, discharged 17 ranked dynamic-index obligations, emitted a 53,080-byte LLVM module, finalized HSACO, and launched it through fe2o3-host. Disassembly contained V_MFMA_F32_16X16X16_BF16. The kernel accepts runtime padded rows, output columns, reduction depth, independent strides, expert ID and expert count; safe edge predicates cover partial K and N tiles. The host fixture exercises four experts and top-2 routing, verifies active and padded edge rows plus untouched output padding, and compares the combined result with an independent CPU oracle. The compiler sees only generic typed fragments, arithmetic, dynamic indices, disjoint output capabilities, and control flow. It has no GEMM, attention, routing, or MoE recognizer. This is correctness evidence for the listed cases, not a routing proof, persistent scheduling implementation, or performance result.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: this is one direct grouped-expert qualification launch and numerical comparison. It does not establish a universal routing proof, persistent device scheduling, or a tuned MoE performance result.",
    },
  ),
  diagram: "moe",
  exercises: [
    {
      prompt: "Define an inverse-map invariant for top-2 routing.",
      hint: "Recover both token ID and route rank from every accepted compact slot.",
      acceptance: "Forward then inverse mapping returns the original accepted route exactly once.",
    },
  ],
  glossary: ["grouped GEMM", "inverse permutation", "weighted combine", "persistent kernel"],
};

const pipeline: Lesson = {
  id: "evidence-pipeline",
  module: 7,
  order: 0,
  title: "From rustc to signed evidence",
  summary:
    "Trace source, proof, compiler, direct LLVM/LLD, HSACO inspection, runtime admission, and protected evidence as distinct authorities.",
  duration: "48 min",
  prerequisites: ["Evidence labels", "One advanced proof plan"],
  objectives: [
    "Name every identity join in the intended production pipeline.",
    "Explain why fe2o3 uses direct LLVM and LLD APIs rather than COMGR linking.",
    "Distinguish an inert evidence record from load or launch authority.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Direct-link Worker V2 mechanics",
      detail:
        "The repository contains a measured out-of-process LLVM/LLD worker, deterministic two-run comparison, HSACO inspection, and durable publication foundations. These outputs remain inert until downstream authentication.",
      reference: pinnedReference(
        ["ctest --test-dir /absolute/path/to/llvm-link-worker-build --output-on-failure"],
        [
          "tools/fe2o3-llvm-link-worker/README.md",
          "scripts/direct-link/README.md",
          "docs/direct-llvm-ffi-milestone.md",
          "docs/testing.md",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
    {
      kind: "source-model-verified",
      label: "Proof records are descriptive",
      detail:
        "Current Verus runners produce checked source-model results, while the general production prerequisite authenticator remains unimplemented.",
      reference: pinnedReference(
        [
          "PATH=/path/to/rustup/bin:$PATH VERUS=/absolute/path/to/verus examples/verus_vecadd/run-alpha-zeta-verus.sh",
        ],
        ["examples/verus_vecadd/run-alpha-zeta-verus.sh", "docs/verification-model.md"],
      ),
    },
  ],
  sections: [
    narrativeSection("evidence-pipeline/chain"),
    narrativeSection("evidence-pipeline/why-direct"),
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    {
      language: "bash",
      code: `# Native worker tests; configure against pinned LLVM/LLD first.\nctest --test-dir /absolute/path/to/llvm-link-worker-build --output-on-failure\n\n# Inspect a published code object.\n/opt/rocm/llvm/bin/llvm-readelf --notes /absolute/path/to/kernel.hsaco`,
    },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        "A deterministic, inspected HSACO is compiler evidence. It remains inert until authenticated admission and dispatch bind the same bytes.",
      ),
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "List the substitutions possible if a proof record stores only a kernel name.",
      hint: "Consider source, target, ABI, payload, model version, and launch contract.",
      acceptance: "The answer motivates binding all six identities rather than trusting a textual name.",
    },
  ],
  glossary: ["Kernel IR", "LLVM", "LLD", "machine-effect inspection", "artifact binding"],
};

const assurance: Lesson = {
  id: "what-verus-proves",
  module: 7,
  order: 1,
  title: "What Verus proves and what stays trusted",
  summary:
    "Draw the assurance boundary around source theorems, translation, numerical semantics, runtime facts, and hardware behavior.",
  duration: "32 min",
  prerequisites: ["Evidence pipeline"],
  objectives: [
    "Audit assumptions, external bodies, and abstract arithmetic adapters.",
    "Explain the role of hardware and mutation testing beside proofs.",
    "Avoid claiming that CUDA or HIP cannot be verified.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Current assurance policy",
      detail:
        "fe2o3 defines Verified, Checked, and Unsafe property-level labels, but current proof records and runtime bridges do not complete the general Verified authority path.",
      reference: pinnedReference(
        ["scripts/ci-local.sh parity-evidence"],
        [
          "docs/gpu-safety-contract-v1.md",
          "docs/verification-model.md",
          "docs/parity-signed-evidence-v2.md",
        ],
      ),
    },
  ],
  sections: [
    narrativeSection("what-verus-proves/proved"),
    narrativeSection("what-verus-proves/ecosystem"),
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    { language: "bash", code: "scripts/ci-local.sh parity-evidence" },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        "The policy gate validates evidence structure and promotion rules. It does not manufacture missing compiler, proof, or hardware results.",
      ),
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Audit one Verus theorem for assumptions and abstract adapters.",
      hint: "Search for requires, external_body, admit, assume, and modeled arithmetic.",
      acceptance: "The report separates theorem conclusions from each unproved refinement boundary.",
    },
  ],
  glossary: ["Verified", "Checked", "Unsafe", "external body", "assumption audit"],
};

const evidenceArchive: Lesson = {
  id: "evidence-archive",
  module: 7,
  order: 2,
  title: "Historical evidence archive",
  summary:
    "Inspect the exact staged compiler, tiled GEMM, and bounded MoE records without confusing them with current compiler main.",
  duration: "Reference",
  prerequisites: ["From rustc to signed evidence"],
  objectives: [
    "Read each historical record at its exact commit and tree.",
    "Separate staged authority from current implementation capability.",
    "Preserve negative evidence and explicit limitations during later revisions.",
  ],
  claims: stagedEvidenceOrder.map(stagedEvidenceClaim),
  sections: [
    narrativeSection("read-the-evidence/compiler-refactor"),
    narrativeSection("read-the-evidence/scalar-gemm-checkpoint"),
    narrativeSection("read-the-evidence/moe-bounded-evidence"),
    {
      kind: "staged-evidence",
      evidenceIds: [...stagedEvidenceOrder],
    },
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    {
      language: "bash",
      code: `# Every row supplies its own exact commit, tree, command, and paths.
git show --no-patch --format='%H %T' <commit>
git ls-tree -r --name-only <tree> -- <source-path>`,
      explanatory: true,
    },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        "Archived evidence is immutable historical support. The Architecture and Implementation status pages describe current main separately.",
      ),
      explanatory: true,
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Choose one staged row and verify that its commit resolves to the recorded tree.",
      hint: "Compare git show --format=%T with the evidence row before reading its claims.",
      acceptance:
        "The commit, tree, source paths, command, authority, and limitations are reviewed as one record.",
    },
  ],
  glossary: ["evidence binding", "authority", "artifact binding"],
};

const exercises: Lesson = {
  id: "exercise-ladder",
  module: 8,
  order: 0,
  title: "Exercise ladder",
  summary:
    "Advance from guarded elementwise kernels to evidence-complete advanced slices without skipping a boundary.",
  duration: "Project",
  prerequisites: ["Complete the relevant curriculum modules"],
  objectives: [
    "Choose a task whose implementation surface matches current fe2o3 maturity.",
    "Define positive, negative, compiler, and hardware acceptance before coding.",
    "Keep roadmap code visually and mechanically distinct from runnable code.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Project sequence",
      detail:
        "These exercises propose future work and must earn their own evidence before their labels change.",
    },
  ],
  sections: [
    narrativeSection("exercise-ladder/beginner"),
    narrativeSection("exercise-ladder/advanced"),
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "A project graduates only when its source, proof, compiler, artifact, runtime, and review claims are individually evidenced.",
      ),
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Select one project and write its evidence manifest before implementation.",
      hint: "Include source paths, exact commands, target, artifacts, negative cases, and limitations.",
      acceptance: "Every claimed property maps to an independent check and a failure case.",
    },
  ],
  glossary: ["vertical slice", "acceptance contract", "canary"],
};

const contributing: Lesson = {
  id: "contributing-kernel",
  module: 8,
  order: 1,
  title: "Contribute a kernel without overstating it",
  summary:
    "Package source, proof, negative fixtures, compiler checks, HSACO inspection, and gfx942 observations as reviewable evidence.",
  duration: "Reference",
  prerequisites: ["Exercise ladder"],
  objectives: [
    "Use small commits with one boundary change each.",
    "Run the required generic, Verus, ROCm, and hardware lanes.",
    "Write limitations that survive independent review.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Repository contribution gates",
      detail:
        "The pinned fe2o3 testing guide separates generic, proof, ROCm compile, hardware, and signed parity evidence lanes.",
      reference: pinnedReference(
        [
          "scripts/ci-local.sh generic",
          "VERUS=/absolute/path/to/verus scripts/ci-local.sh verus",
          "FE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile",
          "FE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke",
        ],
        ["docs/testing.md", "scripts/ci-local.sh"],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("contributing-kernel/checklist"),
    narrativeSection("contributing-kernel/review"),
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    {
      language: "bash",
      code: `scripts/ci-local.sh generic\nVERUS=/absolute/path/to/verus scripts/ci-local.sh verus\nFE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile\nFE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke`,
    },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        "Record each lane separately. Do not collapse source proof, compile, GPU observation, and Complete promotion into one label.",
      ),
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Write the limitations section for a kernel that passes Verus and GPU smoke but lacks translation validation.",
      hint: "Name what is proved, observed, and still trusted.",
      acceptance: "The text does not imply that the GPU binary is a refinement of the proved model.",
    },
  ],
  glossary: ["signed evidence", "protected policy", "independent review", "Complete"],
};

export const modules6to8: CurriculumModule[] = [
  {
    number: 6,
    title: "Mixture of experts",
    summary: "Prove deterministic routing, bounded slots, and expert composition.",
    lessons: [moeRouting, expertCompute],
  },
  {
    number: 7,
    title: "Production evidence",
    summary: "Bind source, proofs, compiler output, runtime facts, and review.",
    lessons: [pipeline, assurance, evidenceArchive],
  },
  {
    number: 8,
    title: "Exercises and contribution",
    summary: "Turn one bounded kernel slice into reviewable evidence.",
    lessons: [exercises, contributing],
  },
];
