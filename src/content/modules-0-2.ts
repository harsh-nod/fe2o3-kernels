import { narrativeSection } from "./narrative-registry";
import { currentState } from "./current-state";
import compilerBoundsKernel from "../../examples/compiler_bounds.rs?raw";
import fillKernel from "../../examples/fill_kernel.rs?raw";
import injectiveProof from "../../examples/verus_injective.rs?raw";
import vecaddHost from "../../examples/vecadd_host.rs?raw";
import vecaddKernel from "../../examples/vecadd_kernel.rs?raw";
import {
  FE2O3_PIN,
  currentImplementationReference,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import { completeTabs, noKernel, noProof, resultText } from "./shared";

const genericCommand = "scripts/ci-local.sh generic";
const rocmCompileCommand =
  "FE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile";
const hardwareCommand =
  "FE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke";
const vecaddRunCommand =
  "FE2O3_TARGET=gfx942:xnack- cargo +nightly-2026-04-03 run --locked -p cargo-fe2o3 -- run -p fe2o3-vecadd";
const verusCommand =
  "VERUS=/absolute/path/to/verus examples/verus_vecadd/run-verus.sh --require";

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
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: fillKernel,
      sourcePath: "examples/fill/src/main.rs",
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
  glossary: ["ThreadIndex", "DisjointSlice", "rounded tail", "write partition"],
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
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: vecaddKernel,
      sourcePath: "examples/vecadd/src/vecadd_body.rs",
    },
    {
      language: "bash",
      code: verusCommand,
      sourcePath: "examples/verus_vecadd/run-verus.sh",
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
  glossary: ["typed kernel", "Prepared", "source sharing", "IEEE refinement"],
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
    "See authenticated safe Rust capabilities and workload-neutral verifier passes accept only the supported proof subset before lowering.",
  duration: "35 min",
  prerequisites: ["Bounds, initialization, and race freedom", "Rust arrays and slices"],
  objectives: [
    "Distinguish a proved static access from a checked dynamic access.",
    "Read Rejected and Incomplete diagnostics as fail-closed compilation results.",
    "Locate tensor-layout, bounds, atomic, race, barrier, workgroup-memory, semantic, and resource checks.",
    "Explain why MFMA register layout, operand role, storage transform, wave participation, and edge policy are separate proof obligations.",
    "Reason about multidimensional workgroups, alias classes, publication epochs, and atomic scope without relying on a workload recognizer.",
    "Follow sparse index facts through reachable typed CFG edges and explain why analysis caches end at each validation boundary.",
    "Separate Rust borrowing from compiler-issued cross-invocation GPU capabilities.",
    "Use KernelResult, Option adapters, checked arithmetic, and ? without changing the physical kernel ABI.",
    "Identify which Shifted, GridExclusive, Blocked, and atomic source forms are supported or fail closed.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
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
  ],
  sections: [
    narrativeSection("compiler-checks/catalog"),
    narrativeSection("compiler-checks/production-path"),
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: compilerBoundsKernel,
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "6a8d3073d8535a771accc4dc40920ffb95092f9a760ee3521c11908512074643",
      explanatory: false,
      notice:
        "Feature flags select the static-bounds, ownership-mapping, and barrier-convergence fixtures. The oob case rejects input[64] as one past the declared extent; the production driver also checks convergent, divergent, early-return, cyclic, and helper barrier placements.",
    },
    {
      language: "text",
      code: `Mandatory pre-lowering verification
0. dialect and structural verification
1. tensor instruction, fragment layout, tails, and convergence
2. ranked bounds and address arithmetic
3. atomic legality, ordering, and scope
4. race freedom, alias classes, and invocation ownership
5. barrier convergence
6. workgroup-memory must-initialization and epochs
7. declared semantic refinement

Shared analysis, once per immutable function:
- sparse affine/index facts through reachable typed CFG edges
- execution layout and exact bounded invocation traces
- Pending waits for inputs; conflicting or unsupported facts become Unknown
- a fresh manager is required after mutation or revalidation

Cross-cutting: bounded values, uses, edges, iterations, traces, and work

Guarded non-private loads must structurally tie slice data, slice length,
selected index, and index < length to the same allocation. A guard proves
bounds, not no-alias ownership.

Dynamic race proofs accept authenticated checked-tile coordinate identity.
Ordinary unresolved or potentially overflowing affine maps remain Incomplete.

MFMA contracts are workload-neutral:
- role and register distribution are Rust fragment types
- direct, row-major LDS, and XOR4 are per-operand storage facts
- the tensor pass checks lane/component maps and edge policy
- collective participation is derived from control flow
- an unproved contract is Incomplete, never assumed safe

Authenticated safe ownership mappings:
- one-layer Shifted<Index1D, N>: supported
- constant-leader GridExclusive: supported
- Blocked<Index1D, 1, E>: supported
- nested Shifted: Rejected
- dynamic GridExclusive or Blocked with L > 1: Incomplete

Semantic AtomicAccess preserves exact kind, ordering, and scope.
Ordinary Rust core atomic operation terminals are explicitly unsupported.
Rust Ordering is never used to invent a GPU scope.

Rejected: the analysis proves a violation.
Incomplete: the analysis cannot discharge an obligation within the supported model.
Both stop strict production compilation.`,
      explanatory: true,
      notice:
        "Typed kernels may use native KernelResult and ?. The attribute macro emits a private helper with the real Rust return type plus a unit-return GPU entry wrapper. Err terminates only that invocation; it is not copied to the host. The verifier still audits every reachable path and rejects lane-varying early exit before a required workgroup barrier.",
    },
    {
      language: "bash",
      code: "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 -- --ignored --exact ordinary_rust_bounds_and_production_pliron_pipeline_fail_closed",
      sourcePath:
        "crates/rustc-codegen-fe2o3/tests/production_ranked_bounds_driver_v1.rs",
      sourceCommit: currentState.compilerCommit,
      explanatory: true,
    },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        `error[FE2O3-BOUNDS-001]: ranked access is outside the declared bound
required: 64 < 64
Rust source: .../src/lib.rs:65:20
ranked PLIRON before rejected lowering: kernel.index_constant 64
lowering stopped before target IR or artifact emission`,
      ),
      explanatory: true,
      notice:
        "This is a compiler rejection, so no HSACO or runtime error exists for the invalid kernel.",
    },
  ),
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
    lessons: [fill, vecadd],
  },
  {
    number: 2,
    title: "Verification and compiler checks",
    summary: "Prove source properties and reject invalid kernel IR before lowering.",
    lessons: [verusBasics, memoryProofs, compilerChecks],
  },
];
