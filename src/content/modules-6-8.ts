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
    {
      id: "assumptions",
      title: "Make router policy total",
      blocks: [
        {
          type: "paragraph",
          text: "Define how NaNs compare, how equal logits break ties, whether duplicate expert IDs are possible, and whether top-k order matters. A stable policy should produce the same ordered expert choices for the same input bits and model version.",
        },
        {
          type: "bullets",
          items: [
            "0 < K <= expert_count.",
            "Every selected expert ID is in range and unique for one token.",
            "Capacity and token_count * K arithmetic are checked before allocation.",
            "Overflow policy is explicit: drop, reroute, or spill.",
          ],
        },
      ],
    },
    {
      id: "permutation",
      title: "Counts, scans, and stable rank",
      blocks: [
        {
          type: "steps",
          items: [
            "Count accepted routes per expert under the capacity policy.",
            "Exclusive-scan counts to obtain disjoint expert output ranges.",
            "Give each token/expert pair a stable rank among earlier accepted routes.",
            "Prove base[expert] + rank is in that expert's range and globally unique.",
            "Write the inverse map needed to combine expert outputs back into token order.",
          ],
        },
        {
          type: "callout",
          tone: "proof",
          title: "Race-freedom hinge",
          text: "The permutation write is race-free only if stable_rank is injective among accepted routes for one expert and the exclusive-scan ranges for different experts are disjoint.",
        },
      ],
    },
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
    {
      id: "composition",
      title: "Range proofs become GEMM dimensions",
      blocks: [
        {
          type: "paragraph",
          text: "For expert e, the scan establishes a compact range [base_e, base_e + count_e). Use count_e as M for that expert's token-by-weight GEMM. The weight tensor supplies K and N. The GEMM admission proof must bind these dimensions, layouts, and exact expert weight identity.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Dynamic scheduling changes the proof surface",
          text: "A persistent kernel or device work queue introduces atomics, liveness, and fairness assumptions. Begin with a deterministic host-scheduled expert order before adding that separate profile.",
        },
      ],
    },
    {
      id: "combine",
      title: "Return to token order",
      blocks: [
        {
          type: "paragraph",
          text: "The inverse map ties every expert output row back to one original token and route rank. The combine writes one final token vector from its K routed results. Avoid cross-token races by assigning one owner to each final token; define route-weight normalization and accumulation order for numerical reproducibility.",
        },
        {
          type: "table",
          headers: ["Stage", "Identity carried", "Primary obligation"],
          rows: [
            ["Route", "token, expert, rank", "unique bounded slot"],
            ["Expert GEMM", "expert, compact row", "dimension/layout binding"],
            ["Inverse", "slot to token/rank", "bijection on accepted routes"],
            ["Combine", "token and ordered routes", "one writer; stated reduction order"],
          ],
        },
      ],
    },
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
    {
      id: "chain",
      title: "No layer self-certifies",
      blocks: [
        {
          type: "steps",
          items: [
            "rustc collects the exact monomorphized kernel and emits canonical semantic records.",
            "Kernel IR records types, control flow, regions, effects, barriers, atomics, and target capabilities.",
            "Verus checks versioned source-model properties and emits identity-bound evidence inputs.",
            "A measured worker links canonical LLVM modules with direct LLVM/LLD APIs and emits HSACO.",
            "Independent inspection binds ELF target, symbols, descriptors, kernarg ABI, resources, and machine effects.",
            "Runtime admission joins the loaded artifact with actual context, allocations, aliases, geometry, and lifetimes.",
            "Protected policy verifies signed result sets and independent review before promotion.",
          ],
        },
      ],
    },
    {
      id: "why-direct",
      title: "Why direct LLVM/LLD linking",
      blocks: [
        {
          type: "paragraph",
          text: "Direct APIs expose the exact module, target-machine, linker, diagnostics, and output bytes that fe2o3 needs to measure and bind. It avoids granting a second opaque linking authority through COMGR. The worker is still a trusted native component whose executable, LLVM build, inputs, limits, and output must be measured.",
        },
        {
          type: "callout",
          tone: "boundary",
          title: "Inspection is not execution proof",
          text: "Seeing an MFMA, barrier, or kernarg record in HSACO establishes a machine-code fact. It does not prove source refinement, functional correctness, race freedom, or that a later runtime loaded those exact bytes.",
        },
      ],
    },
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
    {
      id: "proved",
      title: "A theorem has a model and premises",
      blocks: [
        {
          type: "table",
          headers: ["Question", "Primary mechanism"],
          rows: [
            ["Are modeled accesses in bounds?", "Verus and Kernel IR obligations"],
            ["Do compiled effects match the model?", "translation validation and machine inspection"],
            ["Are actual buffers disjoint and alive?", "runtime admission and Rust lifetimes"],
            ["Does f32 match the abstract operation?", "versioned numerical refinement"],
            ["Did this GPU execute these bytes correctly?", "pinned hardware evidence and oracle"],
          ],
        },
      ],
    },
    {
      id: "ecosystem",
      title: "The differentiator is composition",
      blocks: [
        {
          type: "paragraph",
          text: "CUDA and HIP can be checked by sanitizers, static analyzers, symbolic executors, model checkers, and external proof developments. fe2o3's design goal is a Rust-native single-source path where proof properties and artifact/runtime evidence carry explicit identities and fail closed when a join is missing.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "No proof by branding",
          text: "A Rust type, compiler attribute, manifest, signature, test, sanitizer result, or proof record is evidence at one boundary. None alone establishes the complete kernel claim.",
        },
      ],
    },
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
    {
      id: "beginner",
      title: "Beginner to intermediate",
      blocks: [
        {
          type: "steps",
          items: [
            "Add a typed scalar-map profile with guarded writes and a CPU oracle.",
            "Prove a widening integer affine map with no-overflow arithmetic.",
            "Add a paired mutation that moves an input read above the output guard.",
            "Implement one bounded wave reduction profile with inactive-lane semantics.",
            "Compose a workgroup reduction using owned LDS slots and two explicit epochs.",
          ],
        },
      ],
    },
    {
      id: "advanced",
      title: "Advanced vertical slices",
      blocks: [
        {
          type: "steps",
          items: [
            "Land a scalar reference GEMM before introducing LDS or MFMA.",
            "Add one fixed gfx942 BF16 tile profile with a phase invariant and canaries.",
            "Build row softmax with an explicit all-masked and numerical-error policy.",
            "Add one fixed-shape forward attention profile and bind machine effects.",
            "Implement deterministic top-2 routing, then compose one fixed expert GEMM profile.",
          ],
        },
      ],
    },
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
    {
      id: "checklist",
      title: "Kernel contribution checklist",
      blocks: [
        {
          type: "steps",
          items: [
            "Add one shared executable body and a CPU oracle with edge dimensions.",
            "Declare target, ABI, layout, launch, effect, synchronization, and numerical contracts.",
            "Add positive Verus properties and one targeted expected-negative fixture per property.",
            "Reject unsupported source shapes and remove stale outputs transactionally.",
            "Inspect LLVM/HSACO target, symbols, descriptors, kernarg layout, resources, and relevant instructions.",
            "Run gfx942 with independent expected results, boundary sizes, aliases, and canary memory.",
            "Record exact commit, tree, tools, command, target, artifact digests, logs, and limitations.",
          ],
        },
      ],
    },
    {
      id: "review",
      title: "Promotion requires independent review",
      blocks: [
        {
          type: "paragraph",
          text: "A green candidate-owned test suite is not promotion authority. fe2o3's signed-evidence design takes verifier, row policy, trust policy, and keys from a protected base and requires a separate reviewer signature over an exact evidence set for Complete.",
        },
        {
          type: "callout",
          tone: "boundary",
          title: "Zero Missing is not parity",
          text: "At this tutorial baseline the dashboard has no Complete rows. A Partial row may contain substantial implementation and tests while still lacking one acceptance class or authenticated join.",
        },
      ],
    },
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
