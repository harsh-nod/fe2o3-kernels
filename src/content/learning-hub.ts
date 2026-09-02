import { advancedProductionTarget } from "./gfx950-advanced-evidence";
import { FE2O3_PIN, type EvidenceKind } from "./model";
import { deepFreeze, type DeepReadonly } from "./registry";

export type LearningTrackId =
  | "run-something"
  | "write-a-kernel"
  | "verify-the-boundary"
  | "contribute-a-slice";

export type SetupPathId =
  | "cpu-only"
  | "mi300x-gfx942"
  | "mi350-gfx950"
  | "site-authoring";

export type LaunchAudience =
  | "first-time-user"
  | "kernel-developer"
  | "verification-reviewer"
  | "operator-contributor";

export interface LaunchCommand {
  label: string;
  command: string;
  expected: string;
}

export interface StartHereTrack {
  id: LearningTrackId;
  label: string;
  audience: LaunchAudience;
  outcome: string;
  firstCommands: readonly LaunchCommand[];
  setupPathIds: readonly SetupPathId[];
  lessonIds: readonly string[];
  nextStep: string;
  boundary: string;
}

export interface RunMatrixEntry {
  id: string;
  operator: string;
  category: string;
  primaryLessonId: string;
  setupPathId: SetupPathId;
  hardware: string;
  status: EvidenceKind;
  commands: readonly LaunchCommand[];
  expectedOutput: string;
  sourcePaths: readonly string[];
  limitations: readonly string[];
}

export interface SetupPath {
  id: SetupPathId;
  label: string;
  purpose: string;
  prerequisites: readonly string[];
  commands: readonly LaunchCommand[];
  validates: readonly string[];
  doesNotProve: readonly string[];
  firstLessonIds: readonly string[];
}

export interface LaunchAuditFinding {
  id: string;
  finding: string;
  userImpact: string;
  contentModelResponse: string;
}

export interface ContributorChecklistItem {
  id: string;
  label: string;
  required: boolean;
  action: string;
  command?: string;
  sourcePaths: readonly string[];
  evidenceBoundary: string;
}

export interface ContributorWorkflowPhase {
  id: string;
  label: string;
  checklist: readonly ContributorChecklistItem[];
}

export interface EvidencePromotionRule {
  status: EvidenceKind;
  requirement: string;
  disallowedShortcut: string;
}

export interface LearningHub {
  reviewedOn: string;
  title: string;
  purpose: string;
  defaultRepository: string;
  defaultCommit: string;
  defaultTree: string;
  launchAudit: readonly LaunchAuditFinding[];
  startHereTracks: readonly StartHereTrack[];
  setupPaths: readonly SetupPath[];
  runMatrix: readonly RunMatrixEntry[];
  contributorWorkflow: readonly ContributorWorkflowPhase[];
  promotionRules: readonly EvidencePromotionRule[];
}

export interface LearningTrackCard {
  id: LearningTrackId;
  title: string;
  audience: string;
  summary: string;
  startHref: string;
  steps: readonly {
    label: string;
    outcome: string;
  }[];
}

export interface RunTodayMatrixRow {
  id: string;
  operator: string;
  href: string;
  environment: string;
  status: EvidenceKind;
  command: string;
  expected: string;
  boundary: string;
}

export interface SetupPathCard {
  id: "cpu" | SetupPathId;
  title: string;
  environment: string;
  command: string;
  expected: string;
  boundary: string;
}

export interface ContributorWorkflowCard {
  label: string;
  detail: string;
  check: string;
}

const checkoutPinnedFe2o3 = {
  label: "Checkout the lesson baseline",
  command: [
    `git clone ${FE2O3_PIN.repository}`,
    "cd fe2o3",
    `git checkout ${FE2O3_PIN.commit}`,
  ].join("\n"),
  expected:
    "The checkout is pinned to the lesson baseline before any command is interpreted as lesson evidence.",
} satisfies LaunchCommand;

const genericGate = {
  label: "Run generic checks",
  command: "scripts/ci-local.sh generic",
  expected:
    "Source, unit, and policy checks run without claiming ROCm, HSACO, or GPU execution evidence.",
} satisfies LaunchCommand;

const rocmCompileGate = {
  label: "Compile the gfx942 lane",
  command: "FE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile",
  expected:
    "The selected examples exercise ROCm compilation and code-object mechanics for gfx942 without implying a dispatch result.",
} satisfies LaunchCommand;

const gfx942HardwareGate = {
  label: "Run the opt-in gfx942 hardware smoke",
  command:
    "FE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke",
  expected:
    "The smoke lane dispatches selected examples only when the user opts in to a concrete gfx942 device.",
} satisfies LaunchCommand;

const cpuSimulationCommands = [
  {
    label: "Build the simulator tools",
    command:
      "cargo build --locked -p rustc-codegen-fe2o3 --bin fe2o3-export-sim --bin fe2o3-rustc-extract -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim -p fe2o3-debug-cli --bin fe2o3-debug",
    expected:
      "The source export, KIR simulator, and debugger CLIs are available locally.",
  },
  {
    label: "Export a simulation bundle",
    command:
      './target/debug/fe2o3-export-sim --crate fe2o3_production_ranked_bounds_fixture --output "$PWD/barrier-before-access.fe2sim" --target gfx942 --target-dir target/tutorial-sim-export -- --package fe2o3-production-ranked-bounds-fixture --features barrier_before_access --lib',
    expected:
      "One authority-free .fe2sim bundle is produced from the production source-to-KIR transaction.",
  },
  {
    label: "Run and record the schedule",
    command:
      './target/debug/fe2o3-kir-sim --bundle "$PWD/barrier-before-access.fe2sim" --request "$PWD/barrier-before-access-request.json" --record-canonical-schedule "$PWD/barrier-before-access-schedule.json"',
    expected:
      "The CPU simulator executes exact bundled KIR and records a deterministic replay schedule.",
  },
] as const satisfies readonly LaunchCommand[];

const rawLearningHub = {
  reviewedOn: "2026-09-01",
  title: "fe2o3 Learning Hub",
  purpose:
    "Make fe2o3-kernels the launch entry point for learning fe2o3: start with one runnable path, then move from kernels to verification and evidence without hiding unsupported claims.",
  defaultRepository: FE2O3_PIN.repository,
  defaultCommit: FE2O3_PIN.commit,
  defaultTree: FE2O3_PIN.tree,
  launchAudit: [
    {
      id: "evidence-first-home",
      finding:
        "The current curriculum is rigorous, but a new reader meets evidence terminology before they know what to run or write.",
      userImpact:
        "First-time users can mistake the site for an audit archive rather than the primary learning path.",
      contentModelResponse:
        "Start Here tracks expose runnable, authoring, verification, and contribution paths before deep evidence records.",
    },
    {
      id: "run-status-scattered",
      finding:
        "Runnable commands and hardware status are spread across lessons, runner tabs, and evidence records.",
      userImpact:
        "Users cannot quickly answer which kernels are executable on CPU, MI300X/gfx942, or MI350/gfx950.",
      contentModelResponse:
        "The run matrix makes each operator's command, hardware target, status label, expected output, and limitations one row.",
    },
    {
      id: "setup-paths-mixed-with-lessons",
      finding:
        "CPU-only, gfx942, gfx950, and website-authoring setup steps are all present but not modeled as reusable launch paths.",
      userImpact:
        "A reader may assume every lesson requires a GPU, or that a site validation command proves fe2o3 runtime behavior.",
      contentModelResponse:
        "Setup paths separate no-GPU simulation, MI300X/gfx942 execution, MI350/gfx950 advanced operators, and docs validation.",
    },
    {
      id: "contributor-rules-need-task-shape",
      finding:
        "Contribution policy exists, but the launch site needs a checklist that maps a new operator slice to evidence promotion.",
      userImpact:
        "Contributors may over-promote examples or omit CPU oracles, negative fixtures, command records, or exact boundaries.",
      contentModelResponse:
        "The contributor workflow spells out source, oracle, negative-test, evidence, content, and validation steps.",
    },
  ],
  startHereTracks: [
    {
      id: "run-something",
      label: "Run something first",
      audience: "first-time-user",
      outcome:
        "Reach a passing local check and a CPU simulator run before deciding whether to use ROCm hardware.",
      firstCommands: [checkoutPinnedFe2o3, genericGate, ...cpuSimulationCommands],
      setupPathIds: ["cpu-only"],
      lessonIds: ["read-the-evidence", "cpu-semantic-simulation"],
      nextStep:
        "Move to Fill and Vecadd after the simulator path makes the evidence labels concrete.",
      boundary:
        "This path teaches source and KIR behavior. It does not produce HSACO, dispatch a GPU, or prove machine-code equivalence.",
    },
    {
      id: "write-a-kernel",
      label: "Write a first kernel",
      audience: "kernel-developer",
      outcome:
        "Understand how a small Rust kernel turns thread identity into a checked output write.",
      firstCommands: [
        checkoutPinnedFe2o3,
        {
          label: "Run Vecadd through the typed lane",
          command:
            "FE2O3_TARGET=gfx942:xnack- cargo +nightly-2026-04-03 run --locked -p cargo-fe2o3 -- run -p fe2o3-vecadd",
          expected:
            "The typed Vecadd vertical slice builds and checks its output on the selected gfx942 path.",
        },
      ],
      setupPathIds: ["cpu-only", "mi300x-gfx942"],
      lessonIds: ["first-fill", "typed-vecadd", "memory-race-proof"],
      nextStep:
        "Extend the elementwise pattern only after the write partition and output coverage obligations are explicit.",
      boundary:
        "Runnable elementwise examples do not imply general memory safety, compiler correctness, or optimized performance.",
    },
    {
      id: "verify-the-boundary",
      label: "Learn what is verified",
      audience: "verification-reviewer",
      outcome:
        "Read claims as source-model, compiler, artifact, or GPU observations instead of one generic verified badge.",
      firstCommands: [
        checkoutPinnedFe2o3,
        {
          label: "Run the Verus lane when Verus is installed",
          command: "VERUS=/absolute/path/to/verus scripts/ci-local.sh verus",
          expected:
            "Source-model proofs and expected-negative fixtures run where the lesson explicitly claims them.",
        },
      ],
      setupPathIds: ["cpu-only"],
      lessonIds: [
        "read-the-evidence",
        "verus-contracts",
        "compiler-checks",
        "evidence-pipeline",
        "what-verus-proves",
      ],
      nextStep:
        "Use the evidence pipeline lessons to decide which status label a new result can honestly carry.",
      boundary:
        "A Verus result is not a GPU run, and an HSACO inspection is not source-to-machine refinement.",
    },
    {
      id: "contribute-a-slice",
      label: "Contribute a bounded slice",
      audience: "operator-contributor",
      outcome:
        "Prepare a small kernel contribution with source, oracle, runner, status, and limitations aligned.",
      firstCommands: [
        checkoutPinnedFe2o3,
        {
          label: "Run site validation after content edits",
          command:
            "npm run validate && npm run validate:evidence -- --repository /path/to/fe2o3",
          expected:
            "The site content and external fe2o3 evidence references validate without promoting unsupported claims.",
        },
      ],
      setupPathIds: ["site-authoring", "mi300x-gfx942", "mi350-gfx950"],
      lessonIds: ["contributing-kernel", "evidence-archive", "exercise-ladder"],
      nextStep:
        "Start with a fixed shape and one target before proposing a broader operator or performance claim.",
      boundary:
        "A contribution can be useful while remaining source-tested, historical, or design-only until the missing evidence exists.",
    },
  ],
  setupPaths: [
    {
      id: "cpu-only",
      label: "CPU-only learning path",
      purpose:
        "Let any Linux user learn the compiler boundary, simulator, debugger, and evidence labels without ROCm.",
      prerequisites: [
        "Linux shell",
        `Rust ${FE2O3_PIN.rustToolchain} with rust-src and rustc-dev where the fe2o3 checkout requires it`,
        "No /dev/kfd or GPU access required",
      ],
      commands: [checkoutPinnedFe2o3, genericGate, ...cpuSimulationCommands],
      validates: [
        "content and generic source checks",
        "authority-free .fe2sim export",
        "deterministic CPU execution of exact bundled KIR",
        "debugger protocol behavior over the simulation bundle",
      ],
      doesNotProve: [
        "GPU execution",
        "HSACO production",
        "source-to-machine refinement",
        "performance",
      ],
      firstLessonIds: ["read-the-evidence", "cpu-semantic-simulation"],
    },
    {
      id: "mi300x-gfx942",
      label: "MI300X / gfx942 path",
      purpose:
        "Run the launch-baseline gfx942 compile and hardware gates for the older public tutorial stack.",
      prerequisites: [
        "ROCm installation with /dev/kfd access",
        "A selected MI300X-class gfx942 device",
        "Explicit FE2O3_TARGET=gfx942:xnack- target identity",
      ],
      commands: [
        checkoutPinnedFe2o3,
        genericGate,
        rocmCompileGate,
        gfx942HardwareGate,
      ],
      validates: [
        "ROCm compile lane for selected tutorial examples",
        "explicit opt-in hardware smoke on gfx942",
        "CPU-oracle comparison only where the lesson records that observation",
      ],
      doesNotProve: [
        "full compiler correctness",
        "generalized race freedom beyond stated contracts",
        "gfx950 behavior",
        "performance or state-of-the-art status",
      ],
      firstLessonIds: ["gfx942-setup", "first-fill", "typed-vecadd"],
    },
    {
      id: "mi350-gfx950",
      label: "MI350 / gfx950 advanced path",
      purpose:
        "Run advanced low-precision and model-shaped operator slices on CDNA 4 hardware with exact per-lesson boundaries.",
      prerequisites: [
        "ROCm LLVM capable of producing gfx950:xnack- code objects",
        "A selected MI350 or MI355X-class gfx950 device",
        "The per-lesson commit when an advanced result is newer than the default lesson baseline",
      ],
      commands: [
        {
          label: "Build low-precision tutorial checks",
          command:
            "cargo test --locked --manifest-path examples/gfx950_low_precision/Cargo.toml",
          expected:
            "Low-precision references and source-shape checks pass before any hardware runner is used.",
        },
        {
          label: "Run one advanced attention slice",
          command:
            "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
          expected:
            "The Kimi Delta Attention decode runner produces the bounded MI350X observation recorded by that lesson when run at its cited commit.",
        },
        {
          label: "Run the gpt-oss layer tile",
          command: "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
          expected:
            "The fixed layer-tile oracle runs for the exact advanced source and does not become a whole-model serving claim.",
        },
      ],
      validates: [
        `${advancedProductionTarget} production extraction and code-object finalization where recorded`,
        "symbol-scoped ISA inspection for required gfx950 instructions",
        "independent CPU-reference comparison for bounded operator fixtures",
      ],
      doesNotProve: [
        "whole-model equivalence",
        "serving integration",
        "compiler or Verus-to-machine refinement",
        "universal performance leadership",
      ],
      firstLessonIds: [
        "gfx950-fp4-gemm",
        "gfx950-fp8-attention",
        "gfx950-kda-gdn-linear-attention",
      ],
    },
    {
      id: "site-authoring",
      label: "Website authoring path",
      purpose:
        "Validate fe2o3-kernels as an authoritative learning source without confusing site checks with fe2o3 runtime checks.",
      prerequisites: [
        "Node 22.22.1 or newer",
        "A local fe2o3 checkout when validating external evidence references",
        "No GPU required unless changing GPU-observed content",
      ],
      commands: [
        {
          label: "Install site dependencies",
          command: "npm ci",
          expected: "The documentation app dependencies are installed exactly from package-lock.json.",
        },
        {
          label: "Run site validation",
          command: "npm run validate",
          expected:
            "Lint, TypeScript, content tests, and the Vite build pass for the documentation site.",
        },
        {
          label: "Validate evidence references",
          command: "npm run validate:evidence -- --repository /path/to/fe2o3",
          expected:
            "Pinned external source paths and digests resolve against the selected fe2o3 checkout.",
        },
      ],
      validates: [
        "content schema integrity",
        "route-independent learning data",
        "pinned source and evidence references when a fe2o3 repository is supplied",
      ],
      doesNotProve: [
        "a fe2o3 compiler build",
        "kernel launch behavior",
        "GPU numerical correctness",
        "performance",
      ],
      firstLessonIds: ["read-the-evidence", "contributing-kernel"],
    },
  ],
  runMatrix: [
    {
      id: "generic-ci-gate",
      operator: "Repository generic gate",
      category: "setup",
      primaryLessonId: "read-the-evidence",
      setupPathId: "cpu-only",
      hardware: "Linux CPU host",
      status: "compiler-checked",
      commands: [checkoutPinnedFe2o3, genericGate],
      expectedOutput:
        "Generic checks pass without claiming ROCm, HSACO, hardware dispatch, or performance.",
      sourcePaths: ["scripts/ci-local.sh", "docs/testing.md"],
      limitations: [
        "This is a launch-readiness check, not an operator execution result.",
        "It does not establish GPU behavior or source-to-machine refinement.",
      ],
    },
    {
      id: "cpu-semantic-simulation",
      operator: "CPU semantic simulation and source debugger",
      category: "debugging",
      primaryLessonId: "cpu-semantic-simulation",
      setupPathId: "cpu-only",
      hardware: "Linux CPU host",
      status: "runnable-now",
      commands: [checkoutPinnedFe2o3, ...cpuSimulationCommands],
      expectedOutput:
        "A .fe2sim bundle runs under the CPU KIR simulator and can be replayed with the recorded schedule.",
      sourcePaths: [
        "examples/cpu_simulation_source.rs",
        "examples/source_simulation_request.json",
        "examples/source_simulation_result.json",
      ],
      limitations: [
        "Simulation begins at verified KIR and is not a GPU hardware observation.",
        "The bundle does not authenticate protected compiler execution.",
      ],
    },
    {
      id: "fill-gfx942",
      operator: "Fill",
      category: "elementwise",
      primaryLessonId: "first-fill",
      setupPathId: "mi300x-gfx942",
      hardware: "MI300X / gfx942",
      status: "runnable-now",
      commands: [
        checkoutPinnedFe2o3,
        {
          label: "Run Fill",
          command:
            "FE2O3_TARGET=gfx942:xnack- cargo +nightly-2026-04-03 run --locked -p cargo-fe2o3 -- run -p fe2o3-fill",
          expected:
            "The manifest-selected Fill example launches through the compatibility path and checks its output.",
        },
      ],
      expectedOutput:
        "Every active logical element is filled; rounded-tail lanes perform no access.",
      sourcePaths: ["examples/fill_kernel.rs"],
      limitations: [
        "The lesson records an unsafe compatibility host boundary.",
        "This does not prove broad memory safety or compiler correctness.",
      ],
    },
    {
      id: "vecadd-gfx942",
      operator: "Vecadd",
      category: "elementwise",
      primaryLessonId: "typed-vecadd",
      setupPathId: "mi300x-gfx942",
      hardware: "MI300X / gfx942",
      status: "runnable-now",
      commands: [
        checkoutPinnedFe2o3,
        {
          label: "Run Vecadd",
          command:
            "FE2O3_TARGET=gfx942:xnack- cargo +nightly-2026-04-03 run --locked -p cargo-fe2o3 -- run -p fe2o3-vecadd",
          expected:
            "The typed Vecadd vertical slice runs with checked output ownership.",
        },
      ],
      expectedOutput:
        "The output vector matches the independent CPU expectation for the lesson fixture.",
      sourcePaths: [
        "examples/vecadd_kernel.rs",
        "examples/vecadd_host.rs",
        "examples/verus_vecadd/src/reference.rs",
      ],
      limitations: [
        "The proof covers the stated source model and ownership shape, not arbitrary kernels.",
        "No performance claim is attached to this beginner operator.",
      ],
    },
    {
      id: "dynamic-gemm-gfx942",
      operator: "Dynamic GEMM",
      category: "matrix",
      primaryLessonId: "gemm-tiling",
      setupPathId: "mi300x-gfx942",
      hardware: "MI300X / gfx942",
      status: "gpu-observed",
      commands: [
        checkoutPinnedFe2o3,
        {
          label: "Run dynamic GEMM qualification",
          command: "bash examples/tiled_gemm_general_v1/run-gfx942.sh",
          expected:
            "The dynamic GEMM fixture compiles, launches, and compares active outputs against the CPU oracle at the cited evidence commit.",
        },
      ],
      expectedOutput:
        "The lesson records zero maximum absolute error for the published dynamic GEMM case.",
      sourcePaths: [
        "examples/tiled_gemm_general_v1/src/kernel.rs",
        "examples/tiled_gemm_general_v1/src/reference.rs",
        "examples/tiled_gemm_general_v1/run-gfx942.sh",
      ],
      limitations: [
        "The qualification route and source commit are part of the evidence identity.",
        "It is not a general source-to-machine proof or tuned-library performance result.",
      ],
    },
    {
      id: "row-softmax-gfx942",
      operator: "Dynamic row softmax",
      category: "attention primitive",
      primaryLessonId: "softmax-invariant",
      setupPathId: "mi300x-gfx942",
      hardware: "MI300X / gfx942",
      status: "gpu-observed",
      commands: [
        checkoutPinnedFe2o3,
        {
          label: "Run row softmax qualification",
          command: "bash examples/row_softmax_general_v1/run-gfx942.sh",
          expected:
            "The historical qualification cases compare dynamic rows and strides against an independent CPU oracle.",
        },
      ],
      expectedOutput:
        "Four recorded cases matched the CPU oracle within the stated lesson boundary.",
      sourcePaths: [
        "examples/row_softmax_general_v1/src/kernel.rs",
        "examples/row_softmax_general_v1/src/reference.rs",
        "examples/row_softmax_general_v1/run-gfx942.sh",
      ],
      limitations: [
        "The observation is historical and case-bounded.",
        "It does not prove exp semantics, all masks, or performance.",
      ],
    },
    {
      id: "flash-attention-gfx942",
      operator: "Dynamic FlashAttention",
      category: "attention",
      primaryLessonId: "flash-attention",
      setupPathId: "mi300x-gfx942",
      hardware: "MI300X / gfx942",
      status: "gpu-observed",
      commands: [
        checkoutPinnedFe2o3,
        {
          label: "Run dynamic FlashAttention qualification",
          command: "bash examples/flash_attention_general_v1/run-gfx942.sh",
          expected:
            "The fused attention fixture launches and compares the active output domain against the CPU oracle.",
        },
      ],
      expectedOutput:
        "The recorded two-head, dynamic-shape fixture matched the safe CPU oracle.",
      sourcePaths: [
        "examples/flash_attention_general_v1/src/kernel.rs",
        "examples/flash_attention_general_v1/src/reference.rs",
        "examples/flash_attention_general_v1/run-gfx942.sh",
      ],
      limitations: [
        "The fixture does not cover all attention shapes or full model integration.",
        "No tuned performance or universal numerical proof is claimed.",
      ],
    },
    {
      id: "moe-grouped-expert-gfx942",
      operator: "Grouped-expert MoE",
      category: "mixture of experts",
      primaryLessonId: "moe-expert-compute",
      setupPathId: "mi300x-gfx942",
      hardware: "MI300X / gfx942",
      status: "gpu-observed",
      commands: [
        checkoutPinnedFe2o3,
        {
          label: "Run grouped-expert MoE qualification",
          command: "bash examples/moe_grouped_expert_general_v1/run-gfx942.sh",
          expected:
            "The grouped expert fixture compares routed expert outputs and padding behavior against the CPU oracle.",
        },
      ],
      expectedOutput:
        "The recorded output-width cases matched the independent CPU oracle.",
      sourcePaths: [
        "examples/moe_grouped_expert_general_v1/src/kernel.rs",
        "examples/moe_grouped_expert_general_v1/src/reference.rs",
        "examples/moe_grouped_expert_general_v1/run-gfx942.sh",
      ],
      limitations: [
        "This is a bounded grouped-expert fixture, not a full MoE layer or distributed serving system.",
        "The historical qualification route remains part of the claim boundary.",
      ],
    },
    {
      id: "gfx950-fp4-gemm",
      operator: "gfx950 FP4 GEMM",
      category: "low precision",
      primaryLessonId: "gfx950-fp4-gemm",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run FP4 GEMM",
          command: "bash examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
          expected:
            "The exact FP4 GEMM teaching kernel runs with its CPU-reference check and required ISA inspection.",
        },
      ],
      expectedOutput:
        "FP4 GEMM max error is recorded as zero for the fixed teaching fixture.",
      sourcePaths: [
        "examples/gfx950_low_precision/src/kernel.rs",
        "examples/gfx950_low_precision/src/reference.rs",
        "examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
      ],
      limitations: [
        "The fixed tile teaches packed E2M1 and accumulator ownership; it is not a general GEMM library.",
        "The lesson does not claim universal performance leadership.",
      ],
    },
    {
      id: "gfx950-fp8-attention",
      operator: "gfx950 FP8 flash attention",
      category: "low precision attention",
      primaryLessonId: "gfx950-fp8-attention",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run FP8 attention",
          command:
            "bash examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
          expected:
            "The FP8 attention slice checks B8 transpose loads, MFMA selection, and CPU-reference output.",
        },
      ],
      expectedOutput:
        "The lesson records attention max_error=2.38419e-07 for the fixed FP8 fixture.",
      sourcePaths: [
        "examples/gfx950_low_precision/src/kernel.rs",
        "examples/gfx950_low_precision/src/reference.rs",
        "examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
      ],
      limitations: [
        "The kernel is fixed-shape teaching code, not full serving attention.",
        "The result is correctness-oriented and does not claim tuned performance.",
      ],
    },
    {
      id: "gfx950-kda-gdn",
      operator: "gfx950 Kimi Delta Attention decode and chunkwise prefill",
      category: "linear attention",
      primaryLessonId: "gfx950-kda-gdn-linear-attention",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run KDA decode",
          command: "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
          expected:
            "The matrix-state decode teaching slice checks state and replicated output against the CPU reference.",
        },
        {
          label: "Run KDA chunkwise prefill",
          command: "bash examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
          expected:
            "The WY/UT chunkwise prefill teaching slice checks final state and chunk outputs against the CPU reference.",
        },
      ],
      expectedOutput:
        "Decode final_state max_error=1.490116119e-8 and output max_error=3.725290298e-9; prefill final_state max_error=2.980232239e-8 and chunk outputs max_error=7.450580597e-9.",
      sourcePaths: [
        "examples/gfx950_advanced_attention/src/kernel.rs",
        "examples/gfx950_advanced_attention/src/reference.rs",
        "examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
        "examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
      ],
      limitations: [
        "The lesson covers one bounded matrix-state KDA teaching shape, not every KDA or GDN formulation.",
        "No full Kimi K3 layer, serving-cache integration, model quality, or performance claim is made.",
      ],
    },
    {
      id: "gfx950-indexed-sparse-attention",
      operator: "gfx950 indexed sparse attention",
      category: "sparse attention",
      primaryLessonId: "gfx950-indexed-sparse-attention",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run content sparse attention",
          command:
            "bash examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh",
          expected:
            "The selected IDs and bounded attention output are checked against the CPU reference.",
        },
      ],
      expectedOutput:
        "Selected IDs are exact and sparse attention output stays within the lesson tolerance for the fixed fixture.",
      sourcePaths: [
        "examples/gfx950_advanced_attention/src/kernel.rs",
        "examples/gfx950_advanced_attention/src/reference.rs",
        "examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh",
      ],
      limitations: [
        "The selected sparse domain is fixed-shape teaching code, not a full sparse-attention backend.",
        "The result is a bounded CPU-reference comparison, not compile-time functional equivalence or performance evidence.",
      ],
    },
    {
      id: "gfx950-deepseek-sparse-attention",
      operator: "gfx950 DeepSeek sparse attention",
      category: "sparse attention",
      primaryLessonId: "gfx950-deepseek-sparse-attention",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run DeepSeek sparse attention",
          command:
            "bash examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
          expected:
            "The selected-domain output, maximum, and normalizer are checked against the CPU reference.",
        },
      ],
      expectedOutput:
        "Output and softmax state max-error values stay within the fixed sparse-attention tolerance.",
      sourcePaths: [
        "examples/gfx950_advanced_attention/src/kernel.rs",
        "examples/gfx950_advanced_attention/src/reference.rs",
        "examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
      ],
      limitations: [
        "The Lightning Indexer selection is caller-provided and not learned or proved by this kernel.",
        "No full DeepSeek serving path, arbitrary sparse policy, or performance claim is made.",
      ],
    },
    {
      id: "gfx950-compressed-hybrid-attention",
      operator: "gfx950 compressed hybrid attention",
      category: "hybrid attention",
      primaryLessonId: "gfx950-compressed-hybrid-attention",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run compressed hybrid attention",
          command:
            "bash examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
          expected:
            "The compressed branch, direct branch, and fused output are checked against the CPU reference.",
        },
      ],
      expectedOutput:
        "The fixed hybrid attention output stays within the lesson tolerance.",
      sourcePaths: [
        "examples/gfx950_advanced_attention/src/kernel.rs",
        "examples/gfx950_advanced_attention/src/reference.rs",
        "examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
      ],
      limitations: [
        "The branch domains and fusion rule are fixed teaching contracts, not an end-to-end hybrid-model equivalence result.",
        "No performance claim or generalized sparse/compressed policy is made.",
      ],
    },
    {
      id: "gfx950-residual-mixing",
      operator: "gfx950 AttnRes, GR, and mHC mixing",
      category: "residual mixing",
      primaryLessonId: "gfx950-attnres-gr-mhc",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run AttnRes aggregate",
          command:
            "bash examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh",
          expected:
            "The residual aggregate output is checked against its CPU reference.",
        },
        {
          label: "Run four-branch residual",
          command:
            "bash examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh",
          expected:
            "The gated residual output is checked against its CPU reference.",
        },
        {
          label: "Run mHC Sinkhorn mix",
          command:
            "bash examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
          expected:
            "The Sinkhorn mixing output is checked against its CPU reference.",
        },
      ],
      expectedOutput:
        "AttnRes, four-branch residual, and mHC/Sinkhorn outputs stay within their fixed tolerances.",
      sourcePaths: [
        "examples/gfx950_advanced_attention/src/kernel.rs",
        "examples/gfx950_advanced_attention/src/reference.rs",
        "examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh",
        "examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh",
        "examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
      ],
      limitations: [
        "These are three bounded residual-mixing contracts, not a general residual-stream optimizer.",
        "In-place aliasing and full model integration remain outside the launch claim unless stated by the lesson.",
      ],
    },
    {
      id: "gfx950-speculative-mtp",
      operator: "gfx950 speculative and MTP verification",
      category: "decode verification",
      primaryLessonId: "gfx950-speculative-mtp-verification",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run speculative transaction",
          command:
            "bash examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
          expected:
            "The accepted prefix, commit metadata, rollback lanes, and output state are checked against the CPU reference.",
        },
      ],
      expectedOutput:
        "Accepted-step metadata is exact and committed output state stays within the fixed tolerance.",
      sourcePaths: [
        "examples/gfx950_advanced_systems/src/kernel.rs",
        "examples/gfx950_advanced_systems/src/reference.rs",
        "examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
      ],
      limitations: [
        "This is a fixed verification kernel, not a serving scheduler, sampler, or complete decoder.",
        "It does not prove model quality or compile-time equivalence for arbitrary token policies.",
      ],
    },
    {
      id: "gfx950-ngram-gather",
      operator: "gfx950 N-gram hash-table gather",
      category: "indexed gather",
      primaryLessonId: "gfx950-ngram-embedding-gather",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run N-gram gather",
          command:
            "bash examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
          expected:
            "The exact integer lookup outputs are checked against the CPU reference.",
        },
      ],
      expectedOutput:
        "Hits, misses, and duplicate-key tie behavior produce exact integer outputs.",
      sourcePaths: [
        "examples/gfx950_advanced_systems/src/kernel.rs",
        "examples/gfx950_advanced_systems/src/reference.rs",
        "examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
      ],
      limitations: [
        "The current output is an integer table value, not a full embedding-vector gather.",
        "Hash-table policy, table size, and N-gram width are fixed for the teaching fixture.",
      ],
    },
    {
      id: "gfx950-muon-optimizer",
      operator: "gfx950 Muon polar update",
      category: "optimizer kernel",
      primaryLessonId: "gfx950-muon-optimizer",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run gradient shard staging",
          command:
            "bash examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh",
          expected:
            "The staged shard values are checked exactly against the CPU reference.",
        },
        {
          label: "Run Muon update",
          command:
            "bash examples/gfx950_advanced_systems/run-muon-update-gfx950.sh",
          expected:
            "The 4x4 polar update and reduced norm are checked against the CPU reference.",
        },
      ],
      expectedOutput:
        "Staged shard values are exact and Muon update/norm outputs stay within the fixed tolerance.",
      sourcePaths: [
        "examples/gfx950_advanced_systems/src/kernel.rs",
        "examples/gfx950_advanced_systems/src/reference.rs",
        "examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh",
        "examples/gfx950_advanced_systems/run-muon-update-gfx950.sh",
      ],
      limitations: [
        "The lesson covers one fixed optimizer step, not convergence, training quality, or general matrix sizes.",
        "The two-shard host staging path is not a distributed optimizer runtime.",
      ],
    },
    {
      id: "gfx950-gpt-oss-layer-tile",
      operator: "gpt-oss-120b layer-tile megakernel",
      category: "model-shaped fused tile",
      primaryLessonId: "gfx950-gpt-oss-120b-megakernel",
      setupPathId: "mi350-gfx950",
      hardware: "MI350 or MI355X / gfx950",
      status: "gpu-observed",
      commands: [
        {
          label: "Run gpt-oss layer tile",
          command: "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
          expected:
            "The fixed layer-tile fixture runs with the independent CPU reference and exact artifact checks.",
        },
      ],
      expectedOutput:
        "The compatibility matrix records the promoted fixed Wave64 layer tile and its bounded oracle result.",
      sourcePaths: [
        "examples/gfx950_gpt_oss_decode/src/kernel.rs",
        "examples/gfx950_gpt_oss_decode/src/reference.rs",
        "examples/gfx950_gpt_oss_decode/run-gfx950.sh",
      ],
      limitations: [
        "This is one fixed layer tile, not a complete model, complete layer, or serving stack.",
        "The archived performance comparison is separate and does not claim state of the art.",
      ],
    },
  ],
  contributorWorkflow: [
    {
      id: "scope",
      label: "Scope the contribution",
      checklist: [
        {
          id: "choose-smallest-slice",
          label: "Choose the smallest useful slice",
          required: true,
          action:
            "State the exact operator shape, tensor extents, target, dtype policy, and non-goals before adding evidence.",
          sourcePaths: ["CONTRIBUTING.md"],
          evidenceBoundary:
            "A small fixed shape can be launch-ready while larger shapes remain unclaimed.",
        },
        {
          id: "pick-initial-status",
          label: "Pick the weakest true status",
          required: true,
          action:
            "Start at design-only or source-tested, then promote only after the supporting command and result exist.",
          sourcePaths: ["src/content/model.ts"],
          evidenceBoundary:
            "Status labels describe evidence boundaries; they are not marketing maturity levels.",
        },
      ],
    },
    {
      id: "source-and-oracle",
      label: "Add source and oracle",
      checklist: [
        {
          id: "kernel-source",
          label: "Expose exact kernel source",
          required: true,
          action:
            "Point the lesson or matrix row at the source file and symbol that users should read first.",
          sourcePaths: ["examples"],
          evidenceBoundary:
            "Displayed source is not proof that the compiler emitted or executed equivalent machine code.",
        },
        {
          id: "safe-reference",
          label: "Add an independent CPU reference",
          required: true,
          action:
            "Use a safe host-side oracle with explicit shape, finite-value, padding, and tolerance rules.",
          sourcePaths: ["examples"],
          evidenceBoundary:
            "A CPU oracle supports bounded testing; it is not a universal functional proof.",
        },
        {
          id: "negative-fixtures",
          label: "Add expected-negative cases",
          required: false,
          action:
            "When claiming a verifier or compiler rejection, keep mutations targeted to one named obligation.",
          sourcePaths: ["examples", "tests"],
          evidenceBoundary:
            "Negative fixtures demonstrate fail-closed behavior for the named condition only.",
        },
      ],
    },
    {
      id: "evidence",
      label: "Capture evidence",
      checklist: [
        {
          id: "record-command",
          label: "Record exact commands",
          required: true,
          action:
            "Keep the command, commit, tree, target, runner path, hardware identity, and result together.",
          sourcePaths: ["src/content/modules-0-2.ts", "src/content/modules-10.ts"],
          evidenceBoundary:
            "A command is only evidence for the exact source and environment it names.",
        },
        {
          id: "bind-digests",
          label: "Bind digests when artifacts are cited",
          required: true,
          action:
            "Record source, displayed excerpt, LLVM, HSACO, ISA, or manifest SHA-256 values whenever the claim depends on exact bytes.",
          command: "npm run validate:evidence -- --repository /path/to/fe2o3",
          sourcePaths: ["scripts/validate-evidence.mjs"],
          evidenceBoundary:
            "Digest binding identifies bytes; it does not by itself prove compiler correctness or runtime behavior.",
        },
      ],
    },
    {
      id: "site-content",
      label: "Publish the learning record",
      checklist: [
        {
          id: "update-hub",
          label: "Update the learning hub",
          required: true,
          action:
            "Add or update the Start Here track, run-matrix row, setup path, or contributor checklist item that makes the new work discoverable.",
          sourcePaths: ["src/content/learning-hub.ts"],
          evidenceBoundary:
            "The hub is navigation and launch guidance; the underlying lesson still carries the detailed evidence claim.",
        },
        {
          id: "validate-site",
          label: "Validate the site",
          required: true,
          action:
            "Run lint, typecheck, content tests, and build before publishing the documentation change.",
          command: "npm run validate",
          sourcePaths: ["package.json", "tests"],
          evidenceBoundary:
            "Site validation proves the learning source is internally consistent, not that fe2o3 kernels execute.",
        },
      ],
    },
  ],
  promotionRules: [
    {
      status: "design-only",
      requirement:
        "Use when the content describes an intended contract, proof ledger, or future capability with no executing command for the stated claim.",
      disallowedShortcut:
        "Do not attach a runner or artifact result to design-only content unless the status is also reviewed.",
    },
    {
      status: "source-example",
      requirement:
        "Use when readable source illustrates the idea but the current content does not cite a passing test for the exact claim.",
      disallowedShortcut:
        "Do not call an illustrative snippet runnable because it resembles an implemented kernel.",
    },
    {
      status: "source-tested",
      requirement:
        "Use when the exact source shape has passing source or reference tests, but no compiler/artifact/hardware result is claimed.",
      disallowedShortcut:
        "Do not promote unit tests to GPU-observed without a target-specific dispatch and oracle.",
    },
    {
      status: "source-model-verified",
      requirement:
        "Use when Verus or another named model proof discharges explicit obligations with stated assumptions and expected-negative coverage.",
      disallowedShortcut:
        "Do not imply the source model proves LLVM, ISA, runtime launch, or hardware behavior.",
    },
    {
      status: "compiler-checked",
      requirement:
        "Use when fe2o3 admits, lowers, inspects, or finalizes the stated source/artifact path without claiming runtime execution.",
      disallowedShortcut:
        "Do not treat HSACO production or metadata inspection as numerical execution evidence.",
    },
    {
      status: "gpu-observed",
      requirement:
        "Use only with a concrete target, command, source identity, runtime observation, and independent result check.",
      disallowedShortcut:
        "Do not widen a bounded fixture to performance, full-model equivalence, or a different GPU target.",
    },
  ],
} satisfies LearningHub;

export function validateLearningHub(hub: LearningHub): string[] {
  const issues: string[] = [];
  const setupIds = new Set<SetupPathId>();
  const trackIds = new Set<LearningTrackId>();
  const matrixIds = new Set<string>();
  const promotionStatuses = new Set<EvidenceKind>();
  const gitObject = /^[0-9a-f]{40}$/u;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/u;
  const relativePath = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/u;

  function nonempty(value: string, path: string): void {
    if (value.trim().length === 0) {
      issues.push(`${path}: must be non-empty`);
    }
  }

  function commands(commands: readonly LaunchCommand[], path: string): void {
    if (commands.length === 0) {
      issues.push(`${path}: must include at least one command`);
    }
    for (const [index, command] of commands.entries()) {
      nonempty(command.label, `${path}[${index}].label`);
      nonempty(command.command, `${path}[${index}].command`);
      nonempty(command.expected, `${path}[${index}].expected`);
    }
  }

  function sourcePaths(paths: readonly string[], path: string): void {
    if (paths.length === 0) {
      issues.push(`${path}: must include at least one source path`);
    }
    for (const [index, sourcePath] of paths.entries()) {
      if (!relativePath.test(sourcePath)) {
        issues.push(`${path}[${index}]: must be a relative repository path`);
      }
    }
  }

  if (!isoDate.test(hub.reviewedOn)) {
    issues.push("reviewedOn: must be an ISO calendar date");
  }
  if (!gitObject.test(hub.defaultCommit)) {
    issues.push("defaultCommit: must be a git object");
  }
  if (!gitObject.test(hub.defaultTree)) {
    issues.push("defaultTree: must be a git object");
  }
  nonempty(hub.title, "title");
  nonempty(hub.purpose, "purpose");

  for (const [index, finding] of hub.launchAudit.entries()) {
    nonempty(finding.id, `launchAudit[${index}].id`);
    nonempty(finding.finding, `launchAudit[${index}].finding`);
    nonempty(finding.userImpact, `launchAudit[${index}].userImpact`);
    nonempty(
      finding.contentModelResponse,
      `launchAudit[${index}].contentModelResponse`,
    );
  }

  for (const [index, setup] of hub.setupPaths.entries()) {
    if (setupIds.has(setup.id)) {
      issues.push(`setupPaths[${index}].id: duplicate setup path`);
    }
    setupIds.add(setup.id);
    nonempty(setup.label, `setupPaths[${index}].label`);
    nonempty(setup.purpose, `setupPaths[${index}].purpose`);
    commands(setup.commands, `setupPaths[${index}].commands`);
    if (setup.prerequisites.length === 0) {
      issues.push(`setupPaths[${index}].prerequisites: must be non-empty`);
    }
    if (setup.validates.length === 0) {
      issues.push(`setupPaths[${index}].validates: must be non-empty`);
    }
    if (setup.doesNotProve.length === 0) {
      issues.push(`setupPaths[${index}].doesNotProve: must be non-empty`);
    }
    if (setup.firstLessonIds.length === 0) {
      issues.push(`setupPaths[${index}].firstLessonIds: must be non-empty`);
    }
  }

  for (const [index, track] of hub.startHereTracks.entries()) {
    if (trackIds.has(track.id)) {
      issues.push(`startHereTracks[${index}].id: duplicate track`);
    }
    trackIds.add(track.id);
    nonempty(track.label, `startHereTracks[${index}].label`);
    nonempty(track.outcome, `startHereTracks[${index}].outcome`);
    nonempty(track.nextStep, `startHereTracks[${index}].nextStep`);
    nonempty(track.boundary, `startHereTracks[${index}].boundary`);
    commands(track.firstCommands, `startHereTracks[${index}].firstCommands`);
    if (track.lessonIds.length === 0) {
      issues.push(`startHereTracks[${index}].lessonIds: must be non-empty`);
    }
    for (const setupId of track.setupPathIds) {
      if (!setupIds.has(setupId)) {
        issues.push(`startHereTracks[${index}].setupPathIds: unknown ${setupId}`);
      }
    }
  }

  for (const [index, row] of hub.runMatrix.entries()) {
    if (matrixIds.has(row.id)) {
      issues.push(`runMatrix[${index}].id: duplicate matrix row`);
    }
    matrixIds.add(row.id);
    if (!setupIds.has(row.setupPathId)) {
      issues.push(`runMatrix[${index}].setupPathId: unknown ${row.setupPathId}`);
    }
    nonempty(row.operator, `runMatrix[${index}].operator`);
    nonempty(row.category, `runMatrix[${index}].category`);
    nonempty(row.primaryLessonId, `runMatrix[${index}].primaryLessonId`);
    nonempty(row.hardware, `runMatrix[${index}].hardware`);
    commands(row.commands, `runMatrix[${index}].commands`);
    nonempty(row.expectedOutput, `runMatrix[${index}].expectedOutput`);
    sourcePaths(row.sourcePaths, `runMatrix[${index}].sourcePaths`);
    if (row.limitations.length === 0) {
      issues.push(`runMatrix[${index}].limitations: must be non-empty`);
    }
    if (
      row.status === "gpu-observed" &&
      !`${row.hardware} ${row.expectedOutput} ${row.limitations.join(" ")}`.match(
        /\b(?:MI300X|MI350|MI355X|gfx942|gfx950)\b/u,
      )
    ) {
      issues.push(`runMatrix[${index}]: gpu-observed rows must name a target`);
    }
  }

  for (const [phaseIndex, phase] of hub.contributorWorkflow.entries()) {
    nonempty(phase.id, `contributorWorkflow[${phaseIndex}].id`);
    nonempty(phase.label, `contributorWorkflow[${phaseIndex}].label`);
    if (phase.checklist.length === 0) {
      issues.push(`contributorWorkflow[${phaseIndex}].checklist: must be non-empty`);
    }
    for (const [itemIndex, item] of phase.checklist.entries()) {
      nonempty(
        item.id,
        `contributorWorkflow[${phaseIndex}].checklist[${itemIndex}].id`,
      );
      nonempty(
        item.label,
        `contributorWorkflow[${phaseIndex}].checklist[${itemIndex}].label`,
      );
      nonempty(
        item.action,
        `contributorWorkflow[${phaseIndex}].checklist[${itemIndex}].action`,
      );
      nonempty(
        item.evidenceBoundary,
        `contributorWorkflow[${phaseIndex}].checklist[${itemIndex}].evidenceBoundary`,
      );
      sourcePaths(
        item.sourcePaths,
        `contributorWorkflow[${phaseIndex}].checklist[${itemIndex}].sourcePaths`,
      );
    }
  }

  for (const [index, rule] of hub.promotionRules.entries()) {
    if (promotionStatuses.has(rule.status)) {
      issues.push(`promotionRules[${index}].status: duplicate promotion rule`);
    }
    promotionStatuses.add(rule.status);
    nonempty(rule.requirement, `promotionRules[${index}].requirement`);
    nonempty(
      rule.disallowedShortcut,
      `promotionRules[${index}].disallowedShortcut`,
    );
  }

  return issues;
}

const learningHubIssues = validateLearningHub(rawLearningHub);
if (learningHubIssues.length > 0) {
  throw new Error(`Invalid learning hub:\n${learningHubIssues.join("\n")}`);
}

export const learningHub: DeepReadonly<LearningHub> =
  deepFreeze(rawLearningHub);

export const learningTracks: DeepReadonly<readonly LearningTrackCard[]> =
  deepFreeze(
    rawLearningHub.startHereTracks.map((track) => ({
      id: track.id,
      title: track.label,
      audience: track.audience.replaceAll("-", " "),
      summary: track.outcome,
      startHref: `/lesson/${track.lessonIds[0]}`,
      steps: track.firstCommands.map((command) => ({
        label: command.label,
        outcome: command.expected,
      })),
    })),
  );

export const runTodayMatrix: DeepReadonly<readonly RunTodayMatrixRow[]> =
  deepFreeze(
    rawLearningHub.runMatrix.map((row) => ({
      id: row.id,
      operator: row.operator,
      href: `/lesson/${row.primaryLessonId}`,
      environment: row.hardware,
      status: row.status,
      command: row.commands[row.commands.length - 1]?.command ?? "",
      expected: row.expectedOutput,
      boundary: row.limitations.join(" "),
    })),
  );

export const setupPaths: DeepReadonly<readonly SetupPathCard[]> =
  deepFreeze(
    rawLearningHub.setupPaths.map((path) => ({
      id: path.id === "cpu-only" ? "cpu" : path.id,
      title: path.label,
      environment: path.prerequisites.join(" / "),
      command: path.commands[path.commands.length - 1]?.command ?? "",
      expected: path.validates.join("; "),
      boundary: path.doesNotProve.map((item) => `Not ${item}.`).join(" "),
    })),
  );

export const contributorWorkflow: DeepReadonly<
  readonly ContributorWorkflowCard[]
> = deepFreeze(
  rawLearningHub.contributorWorkflow.map((phase) => ({
    label: phase.label,
    detail: phase.checklist.map((item) => item.action).join(" "),
    check: phase.checklist
      .filter((item) => item.required)
      .map((item) => item.label)
      .join("; "),
  })),
);
