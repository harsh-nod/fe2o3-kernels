import { narrativeSection } from "./narrative-registry";
import { currentState } from "./current-state";
import { semanticCorrectnessMilestone } from "./semantic-correctness-milestone";
import compilerBoundsKernel from "../../examples/compiler_bounds.rs?raw";
import compilerReferenceDiagnostics from "../../examples/compiler_reference_v2/diagnostics.txt?raw";
import compilerReferenceEffect from "../../examples/compiler_reference_v2/effect-and-receipt.txt?raw";
import compilerReferenceKernel from "../../examples/compiler_reference_v2/kernel.rs?raw";
import compilerReferenceSource from "../../examples/compiler_reference_v2/reference.rs?raw";
import cpuSimulationKernel from "../../examples/cpu_simulation_kernel.rs?raw";
import cpuSimulationRequest from "../../examples/cpu_simulation_request.json?raw";
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

const genericCommand = "scripts/ci-local.sh generic";
const rocmCompileCommand =
  "FE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile";
const hardwareCommand =
  "FE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke";
const vecaddRunCommand =
  "FE2O3_TARGET=gfx942:xnack- cargo +nightly-2026-04-03 run --locked -p cargo-fe2o3 -- run -p fe2o3-vecadd";
const verusCommand =
  "VERUS=/absolute/path/to/verus examples/verus_vecadd/run-verus.sh --require";
const cpuSimulationCommand =
  "cargo fe2o3 simulate --request request.json --output result.json -- --package my-kernel";
const cpuSimulationFixtureCommand =
  "cargo fe2o3 simulate --request crates/cargo-fe2o3/tests/fixtures/simulate-fill-request-v1.json --output result.json -- --locked --manifest-path crates/cargo-fe2o3/tests/fixtures/simulation-source-fill/Cargo.toml";

const orientation: Lesson = {
  id: "read-the-evidence",
  module: 0,
  order: 0,
  title: "Read the evidence before the code",
  summary:
    "Learn the five labels this guide uses to keep source proofs, compiler checks, and hardware observations separate.",
  duration: "12 min",
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
  title: "Simulate typed source without a GPU",
  summary:
    "Run one ordinary safe Rust kernel through verified KIR and inspect a bounded deterministic CPU semantic result.",
  duration: "24 min",
  prerequisites: ["Typed vecadd", "JSON request files"],
  objectives: [
    "Run cargo fe2o3 simulate without a GPU or device runtime.",
    "Trace the source-to-MIR-to-KIR V7-to-formal-memory simulation boundary.",
    "Read simulated observation separately from hardware validation and performance evidence.",
  ],
  claims: [
    {
      kind: "runnable-now",
      label: "Source-first CPU semantic execution",
      detail:
        "The command compiles ordinary typed source through semantic MIR, verified canonical KIR V7, and formal-memory admission, then executes that exact KIR in the bounded deterministic CPU simulator. The no-hardware path neither initializes a GPU/device runtime nor predicts GPU performance.",
      reference: currentImplementationReference(
        [cpuSimulationCommand, cpuSimulationFixtureCommand],
        [
          "crates/cargo-fe2o3/src/main.rs",
          "crates/cargo-fe2o3/tests/fixtures/simulation-source-fill/src/lib.rs",
          "crates/cargo-fe2o3/tests/fixtures/simulate-fill-request-v1.json",
          "crates/cargo-fe2o3/tests/simulation_source_e2e.rs",
          "crates/fe2o3-kir-sim-cli/src/linux.rs",
        ],
        {
          target: "amdgpu_64_little_endian_v1 (simulated scalar profile)",
          note: "Observation-only CPU semantics; no GPU, device-runtime, hardware-validation, or performance-prediction authority.",
        },
      ),
    },
  ],
  sections: [
    narrativeSection("cpu-semantic-simulation/pipeline"),
    narrativeSection("cpu-semantic-simulation/evidence-boundary"),
    narrativeSection("cpu-semantic-simulation/testing-is-not-proof"),
  ],
  tabs: completeReferenceTabs(
    {
      language: "rust",
      code: cpuSimulationKernel,
      sourcePath:
        "crates/cargo-fe2o3/tests/fixtures/simulation-source-fill/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "19854910d7488530033bbf4c15ed6b32283e56f4f8b6ed64f7775d68597a46dd",
      explanatory: false,
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
        "The simulator's fill program is compared with the same safe sequential fill reference.",
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
        "This source-model theorem proves composition of semantic equality and exact ownership. It is not a generated production receipt and does not upgrade observation-only CPU simulation into GPU hardware evidence.",
    },
    {
      language: "bash",
      code: `# Exact request used by the source fixture:
REQUEST='${cpuSimulationRequest.trim()}'
printf '%s\\n' "$REQUEST" > request.json

# General source-first interface:
${cpuSimulationCommand}`,
    },
    {
      language: "text",
      code: resultText(
        "runnable-now",
        `schema: fe2o3-simulation-result-v1
status: ok
authority: observation_only
simulated: true
hardware_observed: false
hardware_validation: false
performance_prediction: false
target_profile.identity: amdgpu_64_little_endian_v1
kir.sha256: 64 lowercase hexadecimal digits (profile-specific)
kir.canonical_bytes: positive bounded byte length
counts.invocations_executed: 4
counts.workgroups_visited: 1
counts.scheduled_slots_visited: 64
schedule.identity: workgroup_major_local_zyx_cooperative_v1
arguments[0].value.bytes: 0x11000000110000001100000011000000

The complete JSON also binds the exact canonical KIR SHA-256 and byte length,
the deterministic scheduler identity, typed argument state, and bounded counts.`,
      ),
    },
  ),
  diagram: "simulation",
  exercises: [
    {
      prompt: "Change the fill value and predict the exact little-endian output bytes.",
      hint: "Four live logical invocations write the u32 elements inside one authenticated WG64; the other 60 scheduled slots are inactive padding.",
      acceptance:
        "The answer derives four repeated four-byte values and does not make a GPU timing or hardware-equivalence claim.",
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
  title: "Compiler checks: reject invalid kernels",
  summary:
    "See the complete workload-neutral error catalog, then bind safe Rust CPU semantics to one real GPU write and reject an incorrect result before lowering.",
  duration: "42 min",
  prerequisites: ["Bounds, initialization, and race freedom", "Rust arrays and slices"],
  objectives: [
    "Distinguish a proved static access from a checked dynamic access.",
    "Read Rejected and Incomplete diagnostics as fail-closed compilation results.",
    "Bind a local safe Rust reference with #[kernel(typed, reference = ...)] and use leading usize arguments as logical point coordinates.",
    "Follow compiler-owned ranked writes through a strict source-effect bijection, PLIRON structural output reconciliation, exact per-output formula replay, and one private joined admission.",
    "Distinguish per-effect partial correctness from total output coverage and full source-to-machine equivalence.",
    "Locate tensor-layout, bounds, atomic, race, barrier, workgroup-memory, semantic, and resource checks.",
    "Explain why MFMA register layout, operand role, storage transform, wave participation, and edge policy are separate proof obligations.",
    "Reason about multidimensional workgroups, alias classes, publication epochs, and atomic scope without relying on a workload recognizer.",
    "Follow sparse index facts through reachable typed CFG edges and explain why analysis caches end at each validation boundary.",
    "Follow compiler-owned semantic derivation, strict parallel derivation, and generated per-compilation Verus composition in their mandatory pre-KIR order.",
    "Explain exact pointwise formula replay without a generic relation premise.",
    "Distinguish canonical-loop authority from noncanonical SCC proof requests.",
    "Identify the exact ranked-extent subset that proves dynamic slice bounds and why tensor components and ErrorBounded relations still fail closed at formula replay.",
    "Separate Rust borrowing from compiler-issued cross-invocation GPU capabilities.",
    "Use KernelResult, Option adapters, checked arithmetic, and ? without changing the physical kernel ABI.",
    "Identify which Shifted, GridExclusive, Blocked, and atomic source forms are supported or fail closed.",
  ],
  claims: [
    {
      kind: "compiler-checked",
      label: "Production ranked-bounds rejection",
      detail:
        "At current compiler main, ordinary Rust semantic MIR reaches ranked PLIRON. The generic bounds verifier accepts the checked dynamic output access and rejects input[64] for [f32; 64] with FE2O3-BOUNDS-001 before target lowering or artifact emission.",
      reference: currentImplementationReference(
        [
          "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 -- --ignored --exact ordinary_rust_bounds_and_production_pliron_pipeline_fail_closed",
        ],
        [
          "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
          "crates/rustc-codegen-fe2o3/tests/production_ranked_bounds_driver_v1.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_pipeline.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_analysis_manager.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_ranked_bounds.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_sparse_index.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_race.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_barrier.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_workgroup_memory.rs",
          "crates/fe2o3-kernel-analysis/src/pliron_semantic_refinement.rs",
        ],
        { target: "gfx942" },
      ),
    },
    {
      kind: "compiler-checked",
      label: "Safe Rust per-compilation composition gate",
      detail:
        "The compiler resolves one local safe Rust reference and the kernel in one rustc session. Before KIR lowering it derives and reconciles their exact contracts, then generates one workload-neutral Verus checker. Exact pointwise integer or compiler-side IEEE operator-DAG claims replay each compiler-derived coordinate, domain, precondition, and value formula directly. PLIRON separately proves and reconciles total coverage, allocation separation, frames, schedules, and ordered-product identity. Status-Checked policy staging grants no authority; the private move-only join is the admission authority and requires matching structural and formula reports. mi300x lacks the root-owned /opt runtime, so no referenced production compile has completed this gate and there is no fallback.",
      reference: currentImplementationReference(
        [
          "cargo test --locked -p rustc-codegen-fe2o3 --features qualification-oracles-test-only --test reference_binding_v1 -- --ignored --nocapture --test-threads=1",
        ],
        [
          "crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/lib.rs",
          "crates/rustc-codegen-fe2o3/tests/reference_binding_v1.rs",
          "crates/rustc-codegen-fe2o3/src/reference_effect_v1.rs",
          "crates/rustc-codegen-fe2o3/src/production_reference_bounds_v2.rs",
          "crates/rustc-codegen-fe2o3/src/reference_effect_bijection_v1.rs",
          "crates/rustc-codegen-fe2o3/src/production_reference_effect_join_v2.rs",
          "crates/fe2o3-pliron/src/production/mir_pliron_semantic_contract_derivation_v1.rs",
          "crates/fe2o3-pliron/src/production/noncanonical_loop_proof_v1.rs",
          "crates/fe2o3-pliron/tests/noncanonical_loop_proof_v1.rs",
          "crates/fe2o3-pliron/src/production/parallel_reference_contract_v1.rs",
          "crates/dialect-proof/src/lib.rs",
          "crates/dialect-proof/tests/hostile.rs",
          "crates/fe2o3-verifier/src/mir_pliron_per_compilation_verus_v1.rs",
          "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_template_v1.rs",
          "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_generated_fixture_v1.rs",
          "crates/fe2o3-verifier/verus/mir_pliron_per_compilation_generated_multi_output_fixture_v1.rs",
          "crates/fe2o3-verifier/verus/negative/mir_pliron_per_compilation_multi_output_substitution_v1.rs",
          "crates/rustc-codegen-fe2o3/src/production_ranked_projection_v1.rs",
          "crates/rustc-codegen-fe2o3/src/production_mir_pliron_verus_join_v1.rs",
          "scripts/test-mir-pliron-per-compilation-verus.sh",
        ],
        { target: "gfx942" },
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
      label: "Bounds fixture",
      language: "rust",
      code: compilerBoundsKernel,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "b50e80f620ec69e18a4e623ccefa3b19a6c858c259c1417a195fae65eb853606",
      explanatory: false,
      notice:
        "Feature flags select the static-bounds, ownership-mapping, and barrier-convergence fixtures. The oob case rejects input[64] as one past the declared extent; the production driver also checks convergent, divergent, early-return, cyclic, and helper barrier placements.",
    },
    {
      kind: "comparison",
      label: "Reference-bound kernel",
      language: "rust",
      code: compilerReferenceKernel,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      explanatory: true,
      notice:
        "Minimal form of the exact positive source fixture. The leading usize reference argument names logical point axis 0; it is not a physical GPU pointer or launch argument.",
    },
    {
      kind: "reference",
      label: "Safe CPU reference",
      language: "rust",
      code: compilerReferenceSource,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      explanatory: true,
      notice:
        "Reference-effect V1 accepts one local safe Rust function with leading usize point axes and bounded point-output effects. Dynamic input[index] retains and matches its exact bounds assertion. It is discharged only when an identical symbolic ranked extent or an overflow-checked bounded static affine interval proves the full-domain bound; unrelated lengths, missing assertions, unsafe intervals, and overflow remain Incomplete. Canonical unit-step loops include an overflow-safe final latch. Other loop SCCs produce exact invariant/variant proof requests that cannot yet grant formula authority.",
    },
    {
      kind: "verus",
      label: "Production proof gate",
      language: "text",
      code: compilerReferenceEffect,
      sourcePath:
        "crates/rustc-codegen-fe2o3/src/production_reference_effect_join_v2.rs",
      sourceCommit: currentState.compilerCommit,
      explanatory: true,
      notice:
        `The display begins with the compiler-owned effect join. Production then derives the semantic contract, derives the strict parallel contract, and runs one generated per-compilation Verus checker before KIR lowering. The checker independently replays each supported exact point formula; PLIRON separately proves and reconciles total coverage, allocation separation, frames, schedules, and ordered-product identity. Status-Checked policy staging grants no authority. The pinned positive fixture is ${semanticCorrectnessMilestone.perCompilationMultiOutputFixturePath}; its exact substitution negative is ${semanticCorrectnessMilestone.perCompilationMultiOutputSubstitutionFixturePath}. The private move-only join is the admission authority and requires matching structural and formula reports at SafeReferenceMirToLivePliron; compiler extraction/projection and pass soundness remain trusted.`,
    },
    {
      kind: "host",
      label: "Run fixtures",
      language: "bash",
      code: "cargo test --locked -p rustc-codegen-fe2o3 --features qualification-oracles-test-only --test reference_binding_v1 -- --ignored --nocapture --test-threads=1\ncargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 -- --ignored --exact ordinary_rust_bounds_and_production_pliron_pipeline_fail_closed",
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/reference_binding_v1.rs",
      sourceCommit: currentState.compilerCommit,
      explanatory: true,
      notice:
        "The first command checks the positive boundary, the 17-to-18 mutation, and ten fail-closed reference forms. The second remains the exact static out-of-bounds production rejection.",
    },
    {
      kind: "result",
      label: "Reference diagnostics",
      language: "text",
      code: compilerReferenceDiagnostics,
      explanatory: true,
      notice:
        "The positive fixture intentionally stops if /opt/fe2o3/verus-runtime-v2/functional-refinement-0.2026.08.02-b677dd5 is absent. There is no fallback. Unrelated dynamic extents, missing assertions, unsafe affine bounds, overflow, noncanonical-loop composition, tensor-component replay, ErrorBounded formula replay, and malformed multiple-output products all fail closed.",
    },
  ],
  diagram: "memory",
  exercises: [
    {
      prompt: "Change input[64] to input[63], then explain why output.get_mut remains dynamic.",
      hint: "One bound is part of the array type; the other depends on the runtime launch identity and slice length.",
      acceptance:
        "The static array access is proved from 63 < 64, while get_mut emits a checked dynamic access that is safe only on its Some branch.",
    },
  ],
  glossary: [
    "ranked PLIRON",
    "Rejected",
    "Incomplete",
    "compiler-issued capability",
    "compiler safety pass",
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
