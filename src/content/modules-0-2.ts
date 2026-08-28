import { narrativeSection } from "./narrative-registry";
import { currentState } from "./current-state";
import { semanticMilestoneLessonBoundary } from "./semantic-correctness-milestone";
import compilerBoundsKernel from "../../examples/compiler_bounds.rs?raw";
import cpuSimulationSource from "../../examples/cpu_simulation_source.rs?raw";
import sourceSimulationRequest from "../../examples/source_simulation_request.json?raw";
import sourceSimulationResult from "../../examples/source_simulation_result.json?raw";
import sourceSimulationSchedule from "../../examples/source_simulation_schedule_v1.json?raw";
import fillKernel from "../../examples/fill_kernel.rs?raw";
import injectiveProof from "../../examples/verus_injective.rs?raw";
import referenceRefinementProof from "../../examples/reference_refinement_v1.rs?raw";
import safeCpuReferences from "../../examples/verus_vecadd/src/reference.rs?raw";
import vecaddHost from "../../examples/vecadd_host.rs?raw";
import vecaddKernel from "../../examples/vecadd_kernel.rs?raw";
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
  noKernel,
  noProof,
  resultText,
} from "./shared";
import {
  sourceDebuggerRequestsJsonl,
  sourceDebuggerTranscript,
} from "./source-debugger-milestone";

const genericCommand = "scripts/ci-local.sh generic";
const rocmCompileCommand =
  "FE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile";
const hardwareCommand =
  "FE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke";
const vecaddRunCommand =
  "FE2O3_TARGET=gfx942:xnack- cargo +nightly-2026-04-03 run --locked -p cargo-fe2o3 -- run -p fe2o3-vecadd";
const verusCommand =
  "VERUS=/absolute/path/to/verus examples/verus_vecadd/run-verus.sh --require";
const cpuSimulationBuildCommand =
  "cargo build --locked -p rustc-codegen-fe2o3 --bin fe2o3-export-sim --bin fe2o3-rustc-extract -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim -p fe2o3-debug-cli --bin fe2o3-debug";
const cpuSimulationExportCommand =
  "./target/debug/fe2o3-export-sim --crate fe2o3_production_ranked_bounds_fixture --output \"$PWD/barrier-before-access.fe2sim\" --target gfx942 --target-dir target/tutorial-sim-export -- --package fe2o3-production-ranked-bounds-fixture --features barrier_before_access --lib";
const cpuSimulationCommand =
  "./target/debug/fe2o3-kir-sim --bundle \"$PWD/barrier-before-access.fe2sim\" --request \"$PWD/barrier-before-access-request.json\" --record-canonical-schedule \"$PWD/barrier-before-access-schedule.json\"";
const cpuSimulationReplayCommand =
  "./target/debug/fe2o3-kir-sim --bundle \"$PWD/barrier-before-access.fe2sim\" --request \"$PWD/barrier-before-access-request.json\" --replay-schedule \"$PWD/barrier-before-access-schedule.json\"";
const cpuDebuggerCommand =
  "./target/debug/fe2o3-debug sim --bundle \"$PWD/barrier-before-access.fe2sim\" --request \"$PWD/barrier-before-access-request.json\" --protocol jsonl --wave-width 64";
const cpuSimulationTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 ordinary_kernel_source_exports_one_verified_authority_free_simulation_bundle -- --ignored --exact";

const orientation: Lesson = {
  id: "read-the-evidence",
  module: 0,
  order: 0,
  title: "How to read this guide",
  summary:
    "Learn which code runs today and where compiler checks, proofs, and hardware observations fit.",
  duration: "8 min",
  prerequisites: ["Comfort reading Rust"],
  objectives: [
    "Distinguish a Verus source-model theorem from a machine-code theorem.",
    "Recognize which fe2o3 paths execute now and which are implementation plans.",
    "Use a pinned commit, command, source path, and target as one review unit.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Audited lesson baseline",
      detail:
        "Lesson evidence claims are pinned to the public fe2o3 tree shown below. The separately gated implementation-progress snapshot uses its own exact staged references.",
      reference: pinnedReference(
        ["git show --stat acb3d2752e4e50e4f4a99ebfc4b180eb79160930"],
        ["README.md", "docs/testing.md", "docs/verification-model.md"],
      ),
    },
  ],
  sections: [
    narrativeSection("read-the-evidence/labels"),
    narrativeSection("read-the-evidence/differentiator"),
    narrativeSection("read-the-evidence/semantic-correctness-milestone"),
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    {
      language: "bash",
      code: `git clone https://github.com/harsh-nod/fe2o3\ncd fe2o3\ngit checkout ${FE2O3_PIN.commit}\n${genericCommand}`,
    },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        `Pinned tree: ${FE2O3_PIN.tree}\nThe generic lane requires no GPU and grants no GPU evidence.`,
      ),
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Classify a successful Verus run with no generated HSACO.",
      hint: "Ask which boundary the command actually crossed.",
      acceptance: "Label it source-model verified, not runnable or GPU observed.",
    },
  ],
  glossary: ["evidence binding", "refinement", "authority"],
};

const setup: Lesson = {
  id: "gfx942-setup",
  module: 0,
  order: 1,
  title: "Set up gfx942 and run the gates",
  summary:
    "Pin rustc, detect ROCm, compile the current examples, and opt in explicitly before touching MI300X hardware.",
  duration: "25 min",
  prerequisites: ["Linux", "ROCm with /dev/kfd access", "Rustup"],
  objectives: [
    "Use the repository-pinned nightly rather than ambient stable Rust.",
    "Run generic, ROCm compile, and hardware lanes independently.",
    "Recognize the explicit GPU opt-in and target identity requirements.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Compile campaign",
      detail:
        "The repository exposes a gfx942-compatible ROCm compile lane that builds and inspects every manifest-selected GPU example.",
      reference: pinnedReference(
        [rocmCompileCommand],
        ["scripts/ci-local.sh", "examples/regression-manifest-v1.txt"],
        { target: FE2O3_PIN.target },
      ),
    },
    {
      kind: "gpu-observed",
      label: "Explicit hardware lane",
      detail:
        "Hardware smoke refuses to start without the opt-in, an explicit target, and writable GPU access.",
      reference: pinnedReference(
        [hardwareCommand],
        ["scripts/ci-local.sh", "docs/testing.md"],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("gfx942-setup/toolchain"),
    narrativeSection("gfx942-setup/sequence"),
    narrativeSection("gfx942-setup/semantic-gates"),
  ],
  tabs: completeTabs(
    { language: "rust", code: noKernel, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    {
      language: "bash",
      code: `rustup toolchain install ${FE2O3_PIN.rustToolchain} --component rust-src rustc-dev rustfmt clippy\n${genericCommand}\n${rocmCompileCommand}\n${hardwareCommand}`,
    },
    {
      language: "text",
      code: "Generic: source/test gates only\nROCm compile: AMDGPU LLVM and HSACO mechanics\nHardware smoke: output checked against CPU expectations on the selected GPU",
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Run only the generic gate and explain why it is useful on a laptop.",
      hint: "Read the command list in scripts/ci-local.sh.",
      acceptance: "The answer separates source/unit/evidence checks from ROCm and hardware checks.",
    },
  ],
  glossary: ["gfx942", "HSACO", "target ID", "code object"],
};

const fill: Lesson = {
  id: "first-fill",
  module: 1,
  order: 0,
  title: "Fill: one witness, one write",
  summary:
    "Start with the smallest useful kernel and see why the checked output guard is part of the proof shape.",
  duration: "22 min",
  prerequisites: ["gfx942 setup", "Rust slices and Option"],
  objectives: [
    "Map one logical thread identity to one output element.",
    "Explain how DisjointSlice::get_mut couples bounds and write partitioning.",
    "Identify the unsafe boundary in the legacy host launch example.",
  ],
  claims: [
    {
      kind: "runnable-now",
      label: "Legacy fill runs",
      detail:
        "The manifest-selected fill example compiles to HSACO and is included in GPU smoke, but its host launch is an explicit unsafe compatibility path.",
      reference: pinnedReference(
        [hardwareCommand],
        ["examples/fill/src/main.rs", "examples/regression-manifest-v1.txt"],
        { target: FE2O3_PIN.target },
      ),
    },
    {
      kind: "source-model-verified",
      label: "Fill proof model",
      detail:
        "The Verus harness proves per-thread bounds, representable addresses, disjoint identity writes, frame behavior, and a launch-level fill postcondition under an explicit hardware-ID contract.",
      reference: pinnedReference(
        [verusCommand],
        ["examples/verus_vecadd/verus/fill.rs", "examples/verus_vecadd/run-verus.sh"],
      ),
    },
  ],
  sections: [
    narrativeSection("first-fill/kernel-shape"),
    narrativeSection("first-fill/trust"),
    narrativeSection("first-fill/total-output-coverage"),
  ],
  tabs: completeReferenceTabs(
    {
      language: "rust",
      code: fillKernel,
      sourcePath: "examples/fill/src/main.rs",
    },
    {
      language: "rust",
      code: safeCpuReferences,
      sourcePath: "examples/verus_vecadd/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "5fd27aaa8e84786e83438ac7c0800a599c41704286131599dab2bb8a21b8c989",
      explanatory: false,
      notice:
        "The generic safe map reference specializes to fill; no GPU capability or unsafe code is involved.",
    },
    {
      language: "rust",
      code: injectiveProof,
      sourcePath: "examples/verus_vecadd/verus/fill.rs",
    },
    {
      language: "bash",
      code: `FE2O3_TARGET=gfx942:xnack- cargo +${FE2O3_PIN.rustToolchain} run --locked -p cargo-fe2o3 -- run -p fe2o3-fill`,
    },
    {
      language: "text",
      code: resultText(
        "runnable-now",
        "fill passed for 1024 elements\nThe CPU check expects every value to equal 42.5 within 1e-5.",
      ),
    },
  ),
  diagram: "indexing",
  exercises: [
    {
      prompt: "Change the launch extent to N + 17 and preserve the output postcondition.",
      hint: "Do not move the write or any input access above the get_mut guard.",
      acceptance: "The extra lanes return None and no output index changes twice.",
    },
  ],
  glossary: [
    "ThreadIndex",
    "DisjointSlice",
    "rounded tail",
    "write partition",
    "total output coverage",
    "finality",
  ],
};

const vecadd: Lesson = {
  id: "typed-vecadd",
  module: 1,
  order: 1,
  title: "Vecadd: the current typed vertical slice",
  summary:
    "Follow the strongest current path from one shared Rust body to a generated typed host API.",
  duration: "30 min",
  prerequisites: ["Fill: one witness, one write", "Rust borrowing"],
  objectives: [
    "Read the single shared index/read/write body used by Rust and Verus.",
    "Use Kernel::load, prepare, and launch without manual argument packing.",
    "Separate f32 memory-safety proofs from unproved IEEE arithmetic semantics.",
  ],
  claims: [
    {
      kind: "runnable-now",
      label: "Typed vecadd",
      detail:
        "The exact three-slice f32 profile generates Kernel and Prepared types and runs through the safe example-facing API.",
      reference: pinnedReference(
        [vecaddRunCommand],
        ["examples/vecadd/src/main.rs", "examples/vecadd/src/vecadd_body.rs"],
        { target: FE2O3_PIN.target },
      ),
    },
    {
      kind: "source-model-verified",
      label: "Shared-body memory proof",
      detail:
        "Verus expands the same guarded control/index/access fragment and proves bounds, frame behavior, address representability, and disjoint output identities.",
      reference: pinnedReference(
        [verusCommand],
        [
          "examples/vecadd/src/vecadd_body.rs",
          "examples/verus_vecadd/verus/vecadd.rs",
          "examples/verus_vecadd/run-verus.sh",
        ],
      ),
    },
    {
      kind: "gpu-observed",
      label: "MI300X correctness and HIP comparison",
      detail:
        "The production Fe2O3 kernel validated all 16,777,216 outputs. Its 42.52 us kernel average was at parity with the equivalent HIP kernel at 45.42 us; the current synchronous safe host path measured 67.38 us versus HIP at 47.34 us.",
      reference: currentImplementationReference(
        ["benchmarks/vecadd_hip/profile-mi300x.sh"],
        [
          "benchmarks/vecadd_hip/README.md",
          "benchmarks/vecadd_hip/vecadd.hip",
          "benchmarks/vecadd_hip/profile-mi300x.sh",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    narrativeSection("typed-vecadd/same-body"),
    narrativeSection("typed-vecadd/typed-host"),
    narrativeSection("typed-vecadd/typed-arithmetic-contract"),
  ],
  tabs: completeReferenceTabs(
    {
      language: "rust",
      code: vecaddKernel,
      sourcePath: "examples/vecadd/src/vecadd_body.rs",
    },
    {
      language: "rust",
      code: safeCpuReferences,
      sourcePath: "examples/verus_vecadd/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "5fd27aaa8e84786e83438ac7c0800a599c41704286131599dab2bb8a21b8c989",
      explanatory: false,
      notice:
        "The generic safe zip reference specializes to vecadd and defines the sequential observable output.",
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
        "This workload-neutral source-model theorem composes exact per-coordinate equality with hierarchy ownership; it is not the compiler's generated per-compilation receipt, and the shared-body suite supplies only vecadd's local bounds and write facts.",
    },
    {
      language: "rust",
      code: vecaddHost,
      sourcePath: "examples/vecadd/src/main.rs",
    },
    {
      language: "text",
      code: resultText(
        "gpu-observed",
        `MI300X, 16,777,216 f32 elements

Correctness: every output matched the CPU reference.
Kernel only (105 launches): Fe2O3 42.52 us, HIP 45.42 us.
Host event interval (30 x 100 launches): Fe2O3 67.38 us, HIP 47.34 us.

Interpretation: GPU execution is at parity within run-to-run noise. The current
safe Fe2O3 launch waits for completion before releasing borrowed buffers, while
HIP queues the launch batch asynchronously. The 1.42x host-path gap is dispatch
policy overhead, not evidence that the generated kernel is slower.`,
      ),
    },
  ),
  diagram: "memory",
  exercises: [
    {
      prompt: "Explain why indexing a[i] before get_mut(idx) would weaken the proof.",
      hint: "Consider a rounded-up thread whose index is outside every slice.",
      acceptance: "The output guard currently dominates both input reads; moving a read bypasses that bound.",
    },
  ],
  glossary: [
    "typed kernel",
    "Prepared",
    "source sharing",
    "IEEE refinement",
    "numeric contract",
    "arithmetic definedness",
  ],
};

const cpuSimulation: Lesson = {
  id: "cpu-semantic-simulation",
  module: 1,
  order: 2,
  title: "Export and debug Rust without a GPU",
  summary:
    "Export an ordinary attributed Rust kernel, explore bounded CPU schedules, replay semantic witnesses, and correlate truth-labeled profiler evidence.",
  duration: "46 min",
  prerequisites: ["Kernel IR evidence boundaries", "JSON and JSONL request files"],
  objectives: [
    "Export an ordinary #[kernel] crate to one authority-free .fe2sim through the production source, MIR, PLIRON, and KIR stages.",
    "Run the embedded exact KIR, record and replay its bounded semantic schedule, and inspect exact software floating-point bits.",
    "Distinguish a retained byte-level race, a bounded no-race observation, and an incomplete happens-before assessment without claiming schedule-space exhaustion.",
    "Inspect exact full-active logical Wave32/Wave64 collectives and fixed-width structured failure masks.",
    "Query imported Counter Capture V2 and stochastic PC Sample Capture V3 evidence without inventing source, ISA, ATT, clock, loss, or per-lane instruction facts.",
    "Resolve source, stop at a source breakpoint, inspect a captured call stack, and step by source through the agent JSONL protocol.",
    "Separate bundle-bound source association from protected compiler authentication, hardware validation, and performance evidence.",
  ],
  claims: [
    {
      kind: "runnable-now",
      label: "Source-to-bundle CPU simulation and semantic debugging",
      detail:
        "The Linux-only fe2o3-export-sim command sends ordinary attributed Rust through the sole production source, semantic MIR, ranked PLIRON, and target-neutral KIR stages, then publishes one authority-free .fe2sim. fe2o3-kir-sim consumes its embedded exact KIR V7 directly, persists and replays a strict bounded schedule, and fe2o3-debug uses its compiler-bundle-bound map for source resolution, source breakpoints, captured stacks, and source stepping. Bundle binding authenticates exact local content, not protected compiler execution, and grants no proof, artifact, compiler, hardware, load, launch, timing, profiling, or performance-prediction authority.",
      reference: currentImplementationReference(
        [
          cpuSimulationBuildCommand,
          cpuSimulationExportCommand,
          cpuSimulationCommand,
          cpuSimulationReplayCommand,
          cpuDebuggerCommand,
          cpuSimulationTestCommand,
        ],
        [
          "docs/simulation-bundle-v1.md",
          "docs/semantic-schedule-v1.md",
          "crates/rustc-codegen-fe2o3/src/bin/fe2o3-export-sim.rs",
          "crates/rustc-codegen-fe2o3/src/production_rustc_driver_v1.rs",
          "crates/rustc-codegen-fe2o3/tests/production_ranked_bounds_driver_v1.rs",
          "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
          "crates/fe2o3-kir-sim-cli/src/linux.rs",
          "crates/fe2o3-kir-sim/src/preflight.rs",
          "crates/fe2o3-kir-sim/src/execute.rs",
          "crates/fe2o3-kir-sim/src/schedule.rs",
          "crates/fe2o3-kir-sim/tests/float_core.rs",
          "crates/fe2o3-debug-cli/src/lib.rs",
          "crates/fe2o3-debug-cli/tests/bundle_v1.rs",
        ],
        {
          target: "amdgpu_64_little_endian_v1 (simulated scalar profile)",
          note: "Observation-only execution of exact bundle content with compiler-bundle-bound source locations. This is not protected compiler-execution authentication, source-to-KIR refinement, GPU/device-runtime use, hardware validation, timing, or performance prediction.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("cpu-semantic-simulation/pipeline"),
    narrativeSection("cpu-semantic-simulation/evidence-boundary"),
    narrativeSection("cpu-semantic-simulation/testing-is-not-proof"),
  ],
  tabs: [
    {
      kind: "kernel",
      label: "Kernel",
      language: "rust",
      code: cpuSimulationSource,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "49cb3a97f822e4b00cb3dafd7ee2fde81f12e9e2419d86d111f1f528e740fd67",
      sourceDigestScope: "displayed",
      sourceFragments: [cpuSimulationSource],
      explanatory: false,
      notice:
        "Exact excerpt from the ordinary attributed Rust crate used by the pinned source-to-bundle production regression.",
    },
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: safeCpuReferences,
      sourcePath: "examples/verus_vecadd/src/reference.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "5fd27aaa8e84786e83438ac7c0800a599c41704286131599dab2bb8a21b8c989",
      explanatory: false,
      notice:
        "This independent fill reference illustrates the repeated-value oracle shape. It is not associated with the compiler-exported bundle and establishes no source refinement.",
    },
    {
      kind: "verus",
      label: "Verus proof",
      language: "rust",
      code: referenceRefinementProof,
      sourcePath: "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "55095841f5616c4af7c10bf57b8ea9178082f3bc4b130d9f8221e6e692c6761b",
      explanatory: false,
      notice:
        "This reusable source-model theorem records a later proof obligation. It is not applied to the compiler-exported bundle and grants no source-to-KIR, compiler, or GPU refinement authority.",
    },
    {
      kind: "host",
      label: "Host",
      language: "bash",
      code: `# Build the exporter and its sibling extraction compiler, simulator, and debugger.
${cpuSimulationBuildCommand}

# Export ordinary attributed Rust through the sole production lowering.
${cpuSimulationExportCommand}

# Publish the strict request used by the integration regression.
REQUEST='${sourceSimulationRequest.trim()}'
printf '%s\\n' "$REQUEST" > barrier-before-access-request.json

# Record, then replay, the exact bounded semantic schedule.
${cpuSimulationCommand}
${cpuSimulationReplayCommand}

# Run the source debugger against the map embedded in the same bundle.
DEBUG_REQUESTS='${sourceDebuggerRequestsJsonl.trim()}'
printf '%s\\n' "$DEBUG_REQUESTS" | ${cpuDebuggerCommand}`,
    },
    {
      kind: "comparison",
      label: "Source debug JSONL",
      language: "text",
      code: sourceDebuggerTranscript,
      explanatory: true,
      notice:
        "Exact checked-in request/response transcript captured by the pinned ordinary-Rust production integration test. Source provenance is compiler_bundle_bound, not compiler-execution authenticated.",
    },
    {
      kind: "result",
      label: "Expected result",
      language: "text",
      code: `# fe2o3-simulation-result-v1
${sourceSimulationResult.trimEnd()}

# fe2o3-simulation-schedule-v1
${sourceSimulationSchedule.trimEnd()}`,
      explanatory: true,
      notice:
        "Exact checked-in simulator output and persisted schedule from the same compiler-produced .fe2sim bundle. Canonical record and replay produced byte-identical result JSON.",
    },
  ],
  diagram: "simulation",
  exercises: [
    {
      prompt: "Record a seeded schedule, replay it, and identify every identity that rejects substitution.",
      hint: "Inspect the artifact, request, target, limits, context, transcript, record, coverage, and decision fields in the persisted document.",
      acceptance:
        "The answer explains why replay binds exact semantic custody while making no GPU scheduling, timing, or performance claim.",
    },
  ],
  glossary: [
    "CPU semantic simulation",
    "simulated observation",
    "formal memory",
    "deterministic schedule",
  ],
};

const verusBasics: Lesson = {
  id: "verus-contracts",
  module: 2,
  order: 0,
  proofDetailsInitiallyOpen: true,
  title: "Verus contracts and expected failures",
  summary:
    "Write requires and ensures clauses, then prove that meaningful mutations are rejected for the intended reason.",
  duration: "35 min",
  prerequisites: ["Typed vecadd", "Mathematical integers and sequences"],
  objectives: [
    "Use requires for caller-owned facts and ensures for kernel properties.",
    "Model overflow in mathematical integers before connecting machine integers.",
    "Treat an expected-negative proof as a first-class regression test.",
  ],
  claims: [
    {
      kind: "source-model-verified",
      label: "Positive and negative suite",
      detail:
        "The runner checks five positive harnesses and 24 expected proof rejections, including exact diagnostic and marker checks for the real-kernel mutations.",
      reference: pinnedReference(
        [verusCommand],
        ["examples/verus_vecadd/run-verus.sh", "examples/verus_vecadd/verus"],
      ),
    },
  ],
  sections: [
    narrativeSection("verus-contracts/contract-shape"),
    narrativeSection("verus-contracts/negative"),
    narrativeSection("verus-contracts/compositional-reference"),
  ],
  tabs: completeTabs(
    { language: "rust", code: fillKernel, explanatory: true },
    {
      language: "rust",
      code: injectiveProof,
      sourcePath: "examples/verus_vecadd/verus/fill.rs",
    },
    { language: "bash", code: verusCommand },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Expected summary at this pin: 5 proof harnesses pass and 24 intentional mutations are rejected.",
      ),
    },
  ),
  diagram: "memory",
  exercises: [
    {
      prompt: "Add a mutation claiming two identical thread IDs have disjoint writes.",
      hint: "Keep the fixture syntactically valid and fail one postcondition.",
      acceptance: "The runner identifies the named theorem and exactly one intended proof failure.",
    },
  ],
  glossary: ["requires", "ensures", "ghost state", "expected-negative test"],
};

const memoryProofs: Lesson = {
  id: "memory-race-proof",
  module: 2,
  order: 1,
  proofDetailsInitiallyOpen: true,
  title: "Bounds, initialization, and race freedom",
  summary:
    "Decompose GPU memory safety into region bounds, initialized reads, and non-conflicting concurrent effects.",
  duration: "40 min",
  prerequisites: ["Verus contracts", "Byte-address arithmetic"],
  objectives: [
    "Define regions by allocation identity, offset, and byte length.",
    "Prove injective writes independently from per-thread bounds.",
    "List the runtime facts needed to instantiate a source proof.",
  ],
  claims: [
    {
      kind: "source-model-verified",
      label: "Permission model",
      detail:
        "The alpha/zeta Verus source model proves bounded initialized reads, exclusive writes, address representability, and identity-based race freedom under explicit ghost premises.",
      reference: pinnedReference(
        [
          "PATH=/path/to/rustup/bin:$PATH VERUS=/absolute/path/to/verus examples/verus_vecadd/run-alpha-zeta-verus.sh",
        ],
        [
          "examples/verus_vecadd/verus/permission_core.rs",
          "examples/verus_vecadd/verus/two_kernel.rs",
          "examples/verus_vecadd/run-alpha-zeta-verus.sh",
        ],
      ),
    },
  ],
  sections: [
    narrativeSection("memory-race-proof/regions"),
    narrativeSection("memory-race-proof/dynamic-join"),
    narrativeSection("memory-race-proof/finality-and-frame"),
  ],
  tabs: completeTabs(
    { language: "rust", code: vecaddKernel },
    { language: "rust", code: injectiveProof },
    { language: "rust", code: vecaddHost },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "A valid proof establishes conditional source-model properties. A valid prepared launch establishes dynamic runtime checks. Full authority requires an authenticated identity join.",
      ),
    },
  ),
  diagram: "memory",
  exercises: [
    {
      prompt: "Write the byte region for output[i] where output contains f32 values.",
      hint: "Use an allocation identity and checked multiplication by four.",
      acceptance: "Region(output_alloc, i * 4, 4), plus checked representability and i < len.",
    },
  ],
  glossary: ["region", "provenance", "initialization", "injectivity", "race freedom"],
};

const compilerChecks: Lesson = {
  id: "compiler-checks",
  module: 2,
  order: 2,
  title: "Compiler checks: one path, explicit boundaries",
  summary:
    "Follow safe Rust through bounded target preflight, the fixed eight ranked PLIRON checks, one independently validated constant fold, and the one raw-replay fragment that is complete today.",
  duration: "18 min",
  prerequisites: ["Bounds, initialization, and race freedom", "Rust arrays and slices"],
  objectives: [
    "Follow the workload-neutral Rust MIR to ranked PLIRON to KIR path and its bounded target preflight.",
    "Distinguish Rejected, Incomplete, Clean policy reports, and Complete raw-replay witnesses.",
    "Explain what checked tiled and row-striped obligation carriers validate structurally, and why their missing source-semantic custody still fails closed.",
    "Identify static bounded access as the sole Complete independent raw-replay fragment.",
    "Explain how exact typed replay admits index constant folding without authorizing other transformations.",
    "Recognize unsupported CFG, no-wrap, dynamic, alias, and tensor cases as fail-closed compilation results.",
  ],
  claims: [
    {
      kind: "compiler-checked",
      label: "Fixed ranked verification with checked normalization",
      detail:
        "The single production ranked route runs bounded target preflight, a sealed checked constant fold, and the fixed eight analysis stages. V5 is the sole live middle-end evidence producer; V4 is decoder-only archival data and the V1 declarative refinement API is removed. Independent raw replay is Complete only for the documented static bounded-access fragment; nonempty tensor flow and all other current witnesses remain Incomplete and grant no KIR authority.",
      reference: currentImplementationReference(
        [
          "cargo test --locked -p fe2o3-pliron --test production_ranked_constant_fold",
          "cargo test --locked -p fe2o3-kernel-analysis --lib pliron_analysis_witness",
        ],
        [
          "crates/fe2o3-pliron/src/production/ranked.rs",
          "crates/fe2o3-pliron/src/production/ranked/ranked_index_constant_fold_v1.rs",
          "crates/fe2o3-pliron/tests/production_ranked_constant_fold.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_pipeline.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_ir_identity.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_launch_contract.rs",
          "crates/fe2o3-pliron/src/production/middle_end_evidence_v4.rs",
          "crates/fe2o3-pliron/src/production/middle_end_evidence_v5.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_analysis_witness.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_ranked_bounds.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_race.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_progress.rs",
          "crates/dialect-kernel/src/ranked_memory.rs",
          "crates/fe2o3-pliron/tests/production_predicated_access.rs",
          "crates/fe2o3-kernel-analysis/tests/lit/race_predicated_checked_access_raw.pliron",
          "crates/rustc-codegen-fe2o3/src/production_ranked_projection_v1.rs",
        ],
        {
          target: "gfx942",
          note: "The publication gate pins the exact integrated compiler commit and tree.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("compiler-checks/catalog"),
    narrativeSection("compiler-checks/production-path"),
    narrativeSection("compiler-checks/v7-simulation"),
    narrativeSection("compiler-checks/complete-correctness-catalog"),
  ],
  tabs: [
    {
      kind: "kernel",
      label: "Static bounds",
      language: "rust",
      code: compilerBoundsKernel,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "b50e80f620ec69e18a4e623ccefa3b19a6c858c259c1417a195fae65eb853606",
      explanatory: false,
      notice:
        "The one-past-end array read is Rejected before KIR. A supported finite safe case can additionally receive a Complete raw bounds replay.",
    },
    {
      kind: "comparison",
      label: "Checked fold",
      language: "text",
      code: "before:\n  %a = kernel.index_constant 5\n  %b = kernel.index_constant 7\n  %sum = kernel.index_binary Add %a, %b\nafter:\n  %a = kernel.index_constant 5\n  %b = kernel.index_constant 7\n  %sum = kernel.index_constant 12",
      explanatory: true,
      notice:
        "The folder proposes the rewrite. A separate evaluator and structural replay check the u64 result, SSA identity, CFG, operation position, and every unrelated typed operation before the transformed recipe is admitted.",
    },
    {
      kind: "verus",
      label: "Where Verus fits",
      language: "text",
      code:
        "You do not need to write a Verus proof to read a compiler diagnostic.\n\nVerus can state and prove a safe CPU reference contract. The compiler still needs a separate, supported refinement witness before that theorem says anything about an exact ranked PLIRON function. The narrow static-bounds raw replay below is a compiler-owned check, not a substitute for a workload semantics proof.\n\n" +
        semanticMilestoneLessonBoundary,
      explanatory: true,
      notice:
        "Start with ordinary safe Rust and the compiler diagnostics. Add a Verus reference when you need an explicit functional contract; unsupported refinement remains Incomplete.",
    },
    {
      kind: "result",
      label: "Witness boundary",
      language: "text",
      code: "Complete:\n  static bounded ranked access raw replay\n\nStructurally validated but Incomplete:\n  checked tiled or row-striped index + success + physical-extent carriers\n\nStill missing:\n  owner-custodied semantic MIR correspondence and exact receiver extent\n  two Option::Some paths plus allowed-use / CFG dominance\n  source provenance/noalias and retained KIR replay\n\nIncomplete:\n  nonempty tensor-layout replay without external-root / operational-SSA provenance\n  dynamic or over-budget bounds replay\n  every other current independent stage witness",
      explanatory: true,
      notice:
        "Typed carrier validation is not a Clean race report or a Complete independent witness. Raw, textual, and public recipes stop at FE2O3-RACE-002 rather than becoming proof by omission.",
    },
    {
      kind: "host",
      label: "Run checks",
      language: "bash",
      code: "cargo test --locked -p fe2o3-pliron --test production_ranked_constant_fold\ncargo test --locked -p fe2o3-kernel-analysis --lib pliron_analysis_witness\ncargo test --locked -p fe2o3-kernel-analysis --test pliron_lit",
      explanatory: true,
      notice:
        "These commands cover the checked transform, independent witness replay, and the textual workload-neutral PLIRON diagnostics. They do not execute a GPU artifact.",
    },
  ],
  diagram: "memory",
  exercises: [
    {
      prompt: "Explain why 5 + 7 may fold but u64::MAX + 1 must remain unfurled and fail closed.",
      hint: "The validator uses checked u64 semantics and accepts only an exact same-site rewrite.",
      acceptance:
        "12 is an exact checked result. Overflow has no admitted constant result, so the original binary operation remains for existing verification to reject.",
    },
  ],
  glossary: [
    "ranked PLIRON",
    "Rejected",
    "Incomplete",
    "raw replay witness",
    "checked transformation",
    "exact typed custody",
  ],
};

export const modules0to2: CurriculumModule[] = [
  {
    number: 0,
    title: "Orientation and setup",
    summary: "Pin the stack and learn its evidence vocabulary.",
    lessons: [orientation, setup],
  },
  {
    number: 1,
    title: "First kernels",
    summary: "Write guarded elementwise kernels and launch the typed slice.",
    lessons: [fill, vecadd, cpuSimulation],
  },
  {
    number: 2,
    title: "Verification and compiler checks",
    summary: "Prove source properties and reject invalid kernel IR before lowering.",
    lessons: [verusBasics, memoryProofs, compilerChecks],
  },
];
