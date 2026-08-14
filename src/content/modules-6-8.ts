import { narrativeSection } from "./narrative-registry";
import moeDesign from "../../examples/moe_design.rs?raw";
import {
  FE2O3_PIN,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import { completeTabs, noHost, noKernel, noProof, resultText } from "./shared";

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
    {
      kind: "design-only",
      label: "MoE routing roadmap",
      detail:
        "The routing code is proof-oriented pseudocode. No current fe2o3 top-k, permutation, or grouped expert dispatch is claimed.",
    },
  ],
  sections: [
    narrativeSection("moe-routing/assumptions"),
    narrativeSection("moe-routing/permutation"),
  ],
  tabs: completeTabs(
    { language: "rust", code: moeDesign, explanatory: true },
    {
      language: "text",
      code: `requires selected experts are in range and unique\nrequires total accepted routes fit the output allocation\nensures accepted route -> exactly one expert slot\nensures distinct accepted routes -> distinct slots`,
      explanatory: true,
    },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "The desired result is a deterministic permutation plus inverse map. No fe2o3 GPU result is claimed.",
      ),
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
  ],
  claims: [
    {
      kind: "design-only",
      label: "Expert pipeline roadmap",
      detail:
        "Grouped expert GEMM, dynamic scheduling, and combine are not current runnable fe2o3 features.",
    },
  ],
  sections: [
    narrativeSection("moe-expert-compute/composition"),
    narrativeSection("moe-expert-compute/combine"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: `// DESIGN ONLY\nfor expert in 0..expert_count {\n    let rows = routed.range_for(expert);\n    expert_gemm(expert_weights[expert], rows, expert_output[rows]);\n}\ncombine_in_token_order(expert_output, inverse_routes, route_weights);`,
      explanatory: true,
    },
    {
      language: "text",
      code: `route identity is preserved through every stage\nexpert ranges are disjoint\ncombine owns one final token row\nweighted result follows one specified route order`,
      explanatory: true,
    },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "A future result must compare routing, each expert GEMM, and the final combine with independent CPU oracles and canaries.",
      ),
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
