import { narrativeSection } from "./narrative-registry";
import moeTop2Kernel from "../../examples/moe_top2_v1/src/kernel.rs?raw";
import moeTop2Proof from "../../examples/moe_top2_v1/verus/moe_top2_v1.rs?raw";
import moeExpertKernel from "../../examples/moe_expert_v1/src/kernel.rs?raw";
import moeExpertProof from "../../examples/moe_expert_v1/verus/moe_expert_memory_v1.rs?raw";
import {
  FE2O3_PIN,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import { completeTabs, noHost, noKernel, noProof, resultText } from "./shared";
import {
  sourceMilestoneClaim,
  sourceMilestoneRecord,
} from "./source-milestones";

const moeTop2Source = sourceMilestoneRecord("moe-top2-source-v1");
const moeTop2Verus = sourceMilestoneRecord("moe-top2-verus-v1");
const moeExpertSource = sourceMilestoneRecord("moe-expert-source-v1");
const moeExpertVerus = sourceMilestoneRecord("moe-expert-verus-v1");

const moeRouting: Lesson = {
  id: "moe-routing",
  module: 6,
  order: 0,
  title: "MoE routing: stable ownership",
  summary:
    "Turn top-k choices into capacity-bounded, deterministic expert slots before launching any expert GEMM.",
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
  tabs: completeTabs(
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

# This protected gate must fail closed before HSA load until the production
# static wrapper injects the opaque linear finalization receipt.
cargo test -p fe2o3-hsa-runtime \\
  --test moe_top2_v1_hardware \\
  protected_gfx942_moe_top2_v1_hardware \\
  -- --ignored --exact --nocapture`,
      sourcePath: "crates/fe2o3-hsa-runtime/tests/moe_top2_v1_hardware.rs",
      sourceCommit: "b1302940e9f7bc1cdcd58709a5d716bc2404df97",
      explanatory: true,
      notice:
        "The pinned logical memory/effect proof verifies 16 obligations and rejects eight mutations. The exact eight-buffer adapter and linear lifecycle are source-tested. The independent CPU oracle passes; the protected gate refuses artifact-path or raw-byte fallback and fails before HSA load until production static-wrapper receipt injection exists.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Exact ordinary attributed source, an independent oracle, debug/release tests, a 6,561-case bounded corpus, executable models, a pinned Verus proof of the mathematical routing policy, exact compiler admission, opaque deterministic upstream LLVM/LLD finalization, and T8/E4/K2/C4 typed host/runtime mechanics are public. The eight-buffer binding retains logits shared read-only and seven unique read-write outputs, rejects every alias pair, and enters a private linear join/load/dispatch-wait/unload lifecycle with reviewed HSA resource observation. Five binder tests, five lifecycle tests, nine compile-fail boundaries, and the independent routing oracle pass on MI300X. Commit d9ee4d09a97e59982b5e9ccf2e3877fff84fab5b adds a separate exact bounded logical memory/effect model: Verus verifies 16 obligations and all eight pinned mutations fail at their named postconditions. Its copyable expected-evidence descriptor remains inert and cannot mint or join an authenticated receipt. The protected test fails closed before HSA load because production static-wrapper receipt injection is absent. Remaining gaps: protected GPU output and seven-buffer oracle comparison, authenticated proof consumption, IEEE FP32/compiler/logical-address refinement, exact expert compiler/finalizer/runtime/protected execution, and source/model-to-machine refinement. The logical model does not establish generalized machine memory safety or race freedom. No functional hardware result is claimed. No protected GPU dispatch occurred.",
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
  title: "MoE expert GEMM and combine",
  summary:
    "Compose verified routing ranges with per-expert matrix contracts and a deterministic weighted combine.",
  duration: "50 min",
  prerequisites: ["MoE routing", "GEMM proof plan"],
  objectives: [
    "Treat each expert's compacted token range as a bounded GEMM batch.",
    "Carry route identity through expert output and inverse permutation.",
    "State determinism and numerical contracts for weighted combine.",
    "Separate host-snapshot consistency from authenticated router provenance.",
  ],
  claims: [
    sourceMilestoneClaim("moe-expert-source-v1"),
    sourceMilestoneClaim("moe-expert-verus-v1"),
  ],
  sections: [
    narrativeSection("moe-expert-compute/composition"),
    narrativeSection("moe-expert-compute/combine"),
    narrativeSection("moe-expert-compute/bounded-evidence"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: moeExpertKernel,
      sourcePath: moeExpertSource.primarySourcePath,
      sourceCommit: moeExpertSource.commit,
      sourceSha256: moeExpertSource.primarySourceSha256,
      evidenceId: moeExpertSource.id,
      explanatory: false,
    },
    {
      language: "rust",
      code: moeExpertProof,
      sourcePath: moeExpertVerus.primarySourcePath,
      sourceCommit: moeExpertVerus.commit,
      sourceSha256: moeExpertVerus.primarySourceSha256,
      evidenceId: moeExpertVerus.id,
      explanatory: false,
      notice:
        "This fixed logical model proves index bounds, padding separation, disjoint write owners, inverse-slot admission, and host phase order. It does not prove numerical or machine semantics.",
    },
    {
      language: "bash",
      code: `cargo test --locked \\
  --manifest-path examples/moe_expert_v1/Cargo.toml \\
  --all-targets

cargo test --locked --release \\
  --manifest-path examples/moe_expert_v1/Cargo.toml \\
  --all-targets

VERUS=/absolute/path/to/pinned/verus \\
  examples/moe_expert_v1/run-verus.sh

VERUS=/absolute/path/to/pinned/verus \\
  scripts/test-moe-expert-compact-plan-verus.sh

cargo test --locked -p fe2o3-host \\
  moe_routing_expert_bridge_v1 -- --nocapture

cargo test --locked -p fe2o3-host \\
  --test generated_moe_expert_v1_ui

# Requires gfx942:xnack- and performs copies plus readback only. No kernel runs.
cargo test --locked -p fe2o3-host \\
  --test moe_expert_v1_upload_hardware \\
  gfx942_routing_bridge_upload_readback_and_denial_are_exact \\
  -- --ignored --exact --nocapture`,
      sourcePath: "examples/moe_expert_v1/src/pipeline.rs",
      sourceCommit: moeExpertSource.commit,
      explanatory: true,
      notice:
        "These commands cover the host schedule, independent direct oracle, source checks, canaries, both pinned Verus models, host routing-snapshot checks, compile-fail boundaries, and the gfx942 offsets-plus-inverse upload/readback fixture. The upload fixture dispatches no kernel and grants no execution authority.",
    },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Commit ff0c08a5bdca2568178f690c04c0b0c6bfa6febe publishes two ordinary attributed kernels for the exact T8/E4/K2/C4, I16/O16 host-scheduled expert pipeline: one 16x16x16 BF16/F32 expert GEMM and one deterministic top-2 weighted combine. The executable host schedule and independent direct oracle agree on active and padded expert rows, compact outputs, dropped routes, route-order weighting, every final token output, unchanged inputs, and guard canaries in debug and release. The original logical memory/effect model verifies 15 obligations and rejects six pinned mutations. A separate acceptance-stage E4/C4/routes16/width16/tile256 compact-plan model verifies 19 obligations, rejects seven expected-failure mutations, and exhaustively checks all 625 count vectors. The host bridge validates internal consistency of caller-supplied top2 experts, requested and admitted counts, offsets, route slots, permutation, and inverse; it uploads offsets and inverse together, retains both regions, and passed gfx942 upload/readback. It does not authenticate router execution or readback provenance, derive top2 choices from logits, bind route weights or packed activations, or provide compiler, finalizer, artifact, dispatch, or expert-execution authority. It has no freshness or replay authority. Remaining gaps include those joins, exact compiler admission and direct finalization for both expert kernels, a typed multi-dispatch runtime, protected gfx942 execution of both expert kernels, GPU/oracle comparison, numerical refinement, source/model-to-machine refinement, authenticated proof consumption, machine memory safety, and generalized race freedom. Grouped or persistent expert scheduling is still separate future work. No functional hardware result is claimed. No functional expert GPU result or performance result is claimed. No expert kernel was dispatched.",
      ),
      explanatory: true,
      notice:
        "Evidence boundary: real attributed source, host arithmetic, independent oracle, canaries, fixed-profile Verus models, exhaustive CPU checks, and a retained host-to-device upload/readback observation exist. The new compact-plan and routing-bridge work is acceptance-stage and is not yet covered by this site's publication gate. Compiler, finalizer, artifact, dispatch, expert GPU execution, numerical, performance, provenance, freshness, replay, and protected-execution authority remain absent.",
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
    lessons: [pipeline, assurance],
  },
  {
    number: 8,
    title: "Exercises and contribution",
    summary: "Turn one bounded kernel slice into reviewable evidence.",
    lessons: [exercises, contributing],
  },
];
