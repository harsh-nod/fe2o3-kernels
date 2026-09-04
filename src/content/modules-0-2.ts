import { narrativeSection } from "./narrative-registry";
import { currentState } from "./current-state";
import { semanticMilestoneLessonBoundary } from "./semantic-correctness-milestone";
import compilerBoundsKernel from "../../examples/compiler_bounds.rs?raw";
import cpuSimulationSource from "../../examples/cpu_simulation_source.rs?raw";
import aggregateSimulationRequest from "../../examples/aggregate_simulation_request_v1.json?raw";
import sourceSimulationRequest from "../../examples/source_simulation_request.json?raw";
import sourceSimulationResult from "../../examples/source_simulation_result.json?raw";
import sourceSimulationSchedule from "../../examples/source_simulation_schedule_v1.json?raw";
import currentMilestones from "../../config/debugger-profiler-current-milestones.json";
import fillKernel from "../../examples/fill_kernel.rs?raw";
import injectiveProof from "../../examples/verus_injective.rs?raw";
import referenceRefinementProof from "../../examples/reference_refinement_v1.rs?raw";
import safeCpuReferences from "../../examples/verus_vecadd/src/reference.rs?raw";
import vecaddApplicationBoundary from "../../examples/vecadd_application_boundary.rs?raw";
import vecaddKernel from "../../examples/vecadd_kernel.rs?raw";
import {
  FE2O3_PIN,
  currentImplementationReference,
  historicalReference,
  pinnedReference,
  qualificationReference,
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
  "FE2O3_TARGET=gfx942 scripts/ci-local.sh rocm-compile";
const hardwareCommand =
  "FE2O3_TARGET=gfx942 FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke";
const noGpuQuickstartCommand = "bash scripts/quickstart.sh no-gpu";
const vecaddSourceCheckCommand =
  "bash scripts/quickstart.sh source-check examples/vecadd/Cargo.toml";
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
const aggregateSimulationExportCommand =
  "./target/debug/fe2o3-export-sim --crate fe2o3_production_ranked_bounds_fixture --output \"$PWD/aggregate-pair-struct-v4.fe2sim\" --target gfx942 --bundle-version 4 --target-dir target/tutorial-aggregate-export -- --package fe2o3-production-ranked-bounds-fixture --features aggregate_pair_struct --lib";
const aggregateDebuggerCommand =
  "./target/debug/fe2o3-debug sim --bundle-v4 \"$PWD/aggregate-pair-struct-v4.fe2sim\" --request \"$PWD/aggregate-pair-struct-request.json\" --protocol jsonl";
const aggregateSimulationTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 ordinary_rust_struct_argument_exports_exact_v4_components -- --ignored --exact";
const recursiveAggregateSimulationTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 ordinary_recursive_aggregates_export_and_unsafe_shapes_fail_typed -- --ignored --exact";
const recursiveAggregateV5ExecutionTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 ordinary_recursive_aggregates_export_and_execute_bundle_v5 -- --ignored --exact";
const productionSemanticConformanceTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_semantic_conformance_v3 -- --ignored --test-threads=1";
const v5SimulationExportCommand =
  "./target/debug/fe2o3-export-sim --crate fe2o3_production_ranked_bounds_fixture --output \"$PWD/wave-reduce-f32-v5.fe2sim\" --target gfx950 --bundle-version 5 --target-dir target/tutorial-v5-export -- --package fe2o3-production-ranked-bounds-fixture --features wave_reduce_f32 --lib";
const v5DebuggerCommand =
  "./target/debug/fe2o3-debug sim --bundle-v5 \"$PWD/wave-reduce-f32-v5.fe2sim\" --request \"$PWD/wave-reduce-f32-v5-request.json\" --protocol jsonl --wave-width 64";
const v5SimulationTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 ordinary_rust_v9_wave_collective_exports_v5_and_runs_in_public_debugger -- --ignored --exact";
const dynamicLdsSimulationTestCommand =
  "cargo test --locked -p fe2o3-kir-sim explicitly_sized_dynamic_lds -- --nocapture";
const workgroupReductionExportCommand =
  "./target/debug/fe2o3-export-sim --crate fe2o3_production_ranked_bounds_fixture --output \"$PWD/workgroup-reduce-u32-v5.fe2sim\" --target gfx942 --bundle-version 5 --target-dir target/tutorial-workgroup-reduce-export -- --package fe2o3-production-ranked-bounds-fixture --features workgroup_reduce_u32 --lib";
const workgroupReductionDebuggerCommand =
  "./target/debug/fe2o3-debug sim --bundle-v5 \"$PWD/workgroup-reduce-u32-v5.fe2sim\" --request \"$PWD/workgroup-reduce-u32-request.json\" --protocol jsonl --wave-width 64";
const workgroupReductionTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_ranked_bounds_driver_v1 ordinary_rust_workgroup_reductions_export_v5_and_execute_every_cpu_path -- --ignored --exact";
const workgroupScanApiTestCommand =
  "cargo test --locked -p fe2o3-device --test device_api_ui device_api_enforces_witness_boundaries -- --exact";
const workgroupScanSemanticTestCommand =
  "cargo test --locked -p fe2o3-kir-sim --test simulation workgroup_scan -- --nocapture";
const workgroupScanProductionTestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_neutral_workgroup_reduce_driver_v1 ordinary_neutral_collectives_reach_both_target_llvm_backends -- --ignored --exact";
const workgroupScanBundleV5TestCommand =
  "cargo test --locked -p rustc-codegen-fe2o3 --test production_neutral_workgroup_reduce_driver_v1 ordinary_scan_sources_export_v5_and_execute_every_cpu_observation_path -- --ignored --exact --test-threads=1";
const workgroupScanBundleV5QuickstartCommand =
  "./scripts/quickstart.sh simulate-source --crate fe2o3_workgroup_sync_v1 --request examples/workgroup_sync_v1/scan-u32-request.json --bundle-version 5 --output /tmp/scan-u32.fe2sim -- --manifest-path examples/workgroup_sync_v1/Cargo.toml --no-default-features --features lds-scan-u32-kernel --lib";
const semanticTraceV2TestCommand =
  "cargo test --locked -p fe2o3-semantic-trace --test codec_v2 && cargo test --locked -p fe2o3-kir-sim-trace --test adapter_v1 v2_trace_adapter_rejects_v7_and_binds_exact_v9_v10_owners -- --exact";
const cpuSimulationSourceMarker =
  "#[cfg(feature = \"aggregate_pair_struct\")]\n#[repr(C)]\npub struct AggregatePairStruct";
const cpuSimulationZstMarker =
  "#[cfg(feature = \"aggregate_zst\")]\npub struct AggregateZst;";
const cpuSimulationWaveMarker =
  "#[kernel(\n    typed,\n    launch(required = [64, 1, 1], max = [64, 1, 1]),\n)]\n#[cfg(feature = \"wave_reduce_f32\")]\npub fn wave_reduce_f32";
const cpuSimulationWorkgroupMarker =
  "#[kernel(\n    typed,\n    launch(\n        required = [64, 1, 1],\n        max = [64, 1, 1],\n        static_shared_memory_bytes = 256\n    ),\n)]\n#[cfg(feature = \"workgroup_reduce_u32\")]\npub fn workgroup_reduce_u32";
const cpuSimulationSourceMarkerOffset = cpuSimulationSource.indexOf(cpuSimulationSourceMarker);
const cpuSimulationZstMarkerOffset = cpuSimulationSource.indexOf(cpuSimulationZstMarker);
const cpuSimulationWaveMarkerOffset = cpuSimulationSource.indexOf(cpuSimulationWaveMarker);
const cpuSimulationWorkgroupMarkerOffset = cpuSimulationSource.indexOf(
  cpuSimulationWorkgroupMarker,
);
if (
  cpuSimulationSourceMarkerOffset <= 0 ||
  cpuSimulationSource.lastIndexOf(cpuSimulationSourceMarker) !== cpuSimulationSourceMarkerOffset
) {
  throw new Error("CPU simulation source is missing the aggregate fragment");
}
if (
  cpuSimulationZstMarkerOffset <= cpuSimulationSourceMarkerOffset ||
  cpuSimulationSource.lastIndexOf(cpuSimulationZstMarker) !== cpuSimulationZstMarkerOffset
) {
  throw new Error("CPU simulation source has a missing, duplicate, or reordered ZST fragment");
}
if (
  cpuSimulationWaveMarkerOffset <= cpuSimulationZstMarkerOffset ||
  cpuSimulationSource.lastIndexOf(cpuSimulationWaveMarker) !== cpuSimulationWaveMarkerOffset
) {
  throw new Error("CPU simulation source has a missing, duplicate, or reordered wave fragment");
}
if (
  cpuSimulationWorkgroupMarkerOffset <= cpuSimulationWaveMarkerOffset ||
  cpuSimulationSource.lastIndexOf(cpuSimulationWorkgroupMarker) !==
    cpuSimulationWorkgroupMarkerOffset
) {
  throw new Error(
    "CPU simulation source has a missing, duplicate, or reordered workgroup fragment",
  );
}
const cpuSimulationSourceFragments = [
  cpuSimulationSource.slice(0, cpuSimulationSourceMarkerOffset).trimEnd(),
  cpuSimulationSource.slice(
    cpuSimulationSourceMarkerOffset,
    cpuSimulationZstMarkerOffset,
  ).trimEnd(),
  cpuSimulationSource.slice(cpuSimulationZstMarkerOffset, cpuSimulationWaveMarkerOffset).trimEnd(),
  cpuSimulationSource.slice(
    cpuSimulationWaveMarkerOffset,
    cpuSimulationWorkgroupMarkerOffset,
  ).trimEnd(),
  cpuSimulationSource.slice(cpuSimulationWorkgroupMarkerOffset),
];

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
    "Pin rustc, inspect direct KFD, compile selected artifacts, and opt in explicitly before KFD-only MI300X smoke tests.",
  duration: "25 min",
  prerequisites: [
    "Linux",
    "Rustup",
    "AMDGPU compiler tools for the compile lane",
    "/dev/kfd access for the hardware lane",
  ],
  objectives: [
    "Use the repository-pinned nightly rather than ambient stable Rust.",
    "Run generic, ROCm compile, and hardware lanes independently.",
    "Recognize that hardware smoke exercises bounded KFD foundations, not application dispatch.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Compile campaign",
      detail:
        "The repository exposes a gfx942-compatible ROCm compile lane that builds and inspects every manifest-selected GPU example.",
      reference: currentImplementationReference(
        [rocmCompileCommand],
        ["scripts/ci-local.sh", "examples/regression-manifest-v1.txt"],
        { target: "gfx942" },
      ),
    },
    {
      kind: "gpu-observed",
      label: "Explicit hardware lane",
      detail:
        "Hardware smoke refuses to start without the opt-in, an explicit target, and writable KFD access; it exercises KFD identity, memory, queues, and debug controls without source-to-GPU application dispatch.",
      reference: currentImplementationReference(
        [hardwareCommand],
        ["scripts/ci-local.sh", "docs/testing.md"],
        { target: "gfx942" },
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
      code: "Generic: source/test gates only\nROCm compile: AMDGPU LLVM and HSACO mechanics\nHardware smoke: direct-KFD identity, memory, queue, and debug-control checks; no application dispatch or CPU/GPU comparison",
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
    "Run the ordinary source through the authority-free CPU simulation bundle path.",
  ],
  claims: [
    {
      kind: "runnable-now",
      label: "Source-to-CPU fill",
      detail:
        "The no-GPU quickstart exports the ordinary #[kernel(typed)] fill source through the production source/MIR/PLIRON/KIR transaction and executes its temporary authority-free bundle on the CPU.",
      reference: currentImplementationReference(
        [noGpuQuickstartCommand],
        [
          "scripts/quickstart.sh",
          "scripts/quickstart/fill-request.json",
          "examples/fill/src/lib.rs",
          "examples/fill/src/main.rs",
          "crates/rustc-codegen-fe2o3/src/bin/fe2o3-export-sim.rs",
          "crates/fe2o3-kir-sim-cli/src/linux.rs",
        ],
        {
          target: "gfx942",
          note: "Simulation observation only: no artifact publication, GPU dispatch, equivalence, or performance prediction.",
        },
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
      sourcePath: "examples/fill/src/lib.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "e763df1ad98cafe247454bd3e6a40f39d8e0ea557f5d3080f56290476ca53766",
      explanatory: false,
      notice:
        "The current no_std library target is the source exported by the no-GPU quickstart; this tab shows the guarded kernel body.",
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
      code: noGpuQuickstartCommand,
    },
    {
      language: "text",
      code: resultText(
        "runnable-now",
        "CPU simulation returns four f32 elements with exact little-endian bytes 00002a42 (42.5f32).\nAuthority: observation_only. Hardware observed: false. Performance prediction: false.",
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
    "Follow the shared Rust body into the generated typed binding, while the application execution boundary remains fail closed.",
  duration: "30 min",
  prerequisites: ["Fill: one witness, one write", "Rust borrowing"],
  objectives: [
    "Read the single shared index/read/write body used by Rust and Verus.",
    "Typecheck the generated direct-KFD Arguments binding without claiming application launch.",
    "Separate f32 memory-safety proofs from unproved IEEE arithmetic semantics.",
  ],
  claims: [
    {
      kind: "compiler-checked",
      label: "Typed vecadd binding",
      detail:
        "The exact three-slice f32 profile generates a lifetime-bound direct-KFD Arguments type. The source-check lane constructs its read and read-write capabilities from borrowed host slices and typechecks without the legacy HIP/HSA qualification feature. The example main returns Unsupported because the production Worker V3 application verifier is not wired.",
      reference: currentImplementationReference(
        [vecaddSourceCheckCommand],
        ["examples/vecadd/src/main.rs", "examples/vecadd/src/vecadd_body.rs"],
        {
          note: "Binding and host-test evidence only; no artifact publication, GPU load, or dispatch.",
        },
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
      label: "Historical MI300X correctness and HIP comparison",
      detail:
        "At the retained ecf7b17 benchmark revision, the then-runnable Fe2O3 path validated all 16,777,216 outputs. Its 42.52 us kernel average compared with HIP at 45.42 us; this archive does not make the current Worker V3 application path runnable.",
      reference: historicalReference(
        "ecf7b17f819021708d9c59ebe39a4daf9eb2562c",
        "2156423b9350d66cfaa8207133768e323111b507",
        ["benchmarks/vecadd_hip/profile-mi300x.sh"],
        [
          "benchmarks/vecadd_hip/README.md",
          "benchmarks/vecadd_hip/vecadd.hip",
          "benchmarks/vecadd_hip/profile-mi300x.sh",
        ],
        {
          target: FE2O3_PIN.target,
          note: "Historical benchmark evidence only; the current application route intentionally fails closed.",
        },
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
      code: vecaddApplicationBoundary,
      sourcePath: "examples/vecadd/src/main.rs",
      sourceCommit: currentState.compilerCommit,
      sourceSha256:
        "f97d7b6c1d51072a78bae7392a16ca0dd23ebdc2d3219e29334e557f7e47d246",
      explanatory: false,
      notice:
        "The default generated Arguments binding uses direct-KFD read and read-write capabilities over retained host borrows. The application entry point remains unavailable until the production Worker V3 verifier is wired; this test grants no artifact, load, or dispatch authority.",
    },
    {
      language: "text",
      code: resultText(
        "gpu-observed",
        `Historical record at ecf7b17, MI300X, 16,777,216 f32 elements

Correctness: every output matched the CPU reference.
Kernel only (105 launches): Fe2O3 42.52 us, HIP 45.42 us.
Host event interval (30 x 100 launches): Fe2O3 67.38 us, HIP 47.34 us.

Interpretation at that retained revision: GPU execution was at parity within
run-to-run noise. These values do not describe the current fail-closed Worker V3
application path and do not grant present-day GPU run authority.`,
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
    "Export ordinary Rust into exact V4/V5 bundles, run generated production conformance on the CPU, and inspect the boundary around hardware evidence.",
  duration: "46 min",
  prerequisites: ["Kernel IR evidence boundaries", "JSON and JSONL request files"],
  objectives: [
    "Export an ordinary #[kernel(typed)] crate to one authority-free .fe2sim through the production source, MIR, PLIRON, and KIR stages.",
    "Recognize the bounded recursive Unit, array, tuple, and struct scalar-leaf ABI subset and its typed unavailable boundaries.",
    "Run an ordinary gfx950 f32 wave reduction from its exact production V9 identity through a same-module KIR V10 Bundle V5.",
    "Run generated integer, exact float-bit, layout, bounds, and switch cases through the production Bundle V5 boundary.",
    "Export ordinary u32, i32, and f32 portable workgroup reductions and inspect workgroup, wave, memory, and operation views through one JSONL debugger session.",
    "Run all 18 ordinary inclusive/exclusive u32, i32, and f32 scan entries at extents 3, 65, and 255 through Bundle V5 CPU observation paths.",
    "Replay every persisted seeded schedule exactly, inspect the N=65 one-lane final Wave64, and recognize the N=255 debugger's bounded inexact resource stop.",
    "Run the embedded exact KIR, record and replay its bounded semantic schedule, and inspect exact software floating-point bits.",
    "Distinguish a retained byte-level race, a bounded no-race observation, and an incomplete happens-before assessment without claiming schedule-space exhaustion.",
    "Inspect exact full-active logical Wave32/Wave64 collectives and fixed-width structured failure masks.",
    "Query imported Counter Capture V2 and stochastic PC Sample Capture V3 evidence without inventing source, ISA, ATT, clock, loss, or per-lane instruction facts.",
    "Resolve source, stop at a source breakpoint, inspect a captured call stack, and step by source through the agent JSONL protocol.",
    "Explain how instance-qualified shared-helper correspondence and schedule custody prevent cross-wired source sites and stale replay.",
    "Separate bundle-bound source association from protected compiler authentication, hardware validation, and performance evidence.",
  ],
  claims: [
    {
      kind: "runnable-now",
      label: "Exact production KIR in the CPU semantic debugger",
      detail:
        "At compiler b15cf628f, one bounded gfx942 qualification gate exports all 18 ordinary inclusive/exclusive u32, i32, and f32 scan entries at extents 3, 65, and 255 as authority-free Bundle V5. The direct CPU simulator, complete Trace V2, SimRuntimeBackendV1, and persisted seeded replay each check exact output bytes; the JSONL semantic debugger separately checks bounded stops and nonempty hierarchy views. The N=65 debugger exposes its one-lane final logical Wave64; N=255 reaches a typed inexact resource-exhaustion stop while the retained prefix remains inspectable. Generated bundles and schedule documents are ephemeral test artifacts, protected compiler execution is not authenticated, and this is neither GPU execution nor performance prediction.",
      reference: qualificationReference(
        currentMilestones.workgroupScanBundleV5V1.commit,
        currentMilestones.workgroupScanBundleV5V1.tree,
        [
          cpuSimulationBuildCommand,
          cpuSimulationExportCommand,
          cpuSimulationCommand,
          cpuSimulationReplayCommand,
          cpuDebuggerCommand,
          cpuSimulationTestCommand,
          aggregateSimulationExportCommand,
          aggregateDebuggerCommand,
          aggregateSimulationTestCommand,
          recursiveAggregateSimulationTestCommand,
          recursiveAggregateV5ExecutionTestCommand,
          productionSemanticConformanceTestCommand,
          v5SimulationExportCommand,
          v5DebuggerCommand,
          v5SimulationTestCommand,
          dynamicLdsSimulationTestCommand,
          workgroupReductionExportCommand,
          workgroupReductionDebuggerCommand,
          workgroupReductionTestCommand,
          workgroupScanApiTestCommand,
          workgroupScanSemanticTestCommand,
          workgroupScanProductionTestCommand,
          workgroupScanBundleV5TestCommand,
          workgroupScanBundleV5QuickstartCommand,
          semanticTraceV2TestCommand,
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
          "crates/fe2o3-sim-runtime/src/lib.rs",
          "crates/fe2o3-kernel-ir/src/simulation_bundle_v5.rs",
          "crates/fe2o3-sim-differential/src/production_bundle_v5.rs",
          "crates/rustc-codegen-fe2o3/tests/production_semantic_conformance_v3.rs",
          "crates/rustc-codegen-fe2o3/tests/fixtures/production-semantic-conformance-device/src/lib.rs",
          "docs/simulator-production-conformance-v3.md",
          "docs/production-multifunction-semantic-debug-v1.md",
          "docs/target-neutral-workgroup-scan-v1.md",
          "crates/fe2o3-device/tests/ui/pass/bounded_collective_contract.rs",
          "crates/fe2o3-kir-sim/tests/simulation.rs",
          "crates/rustc-codegen-fe2o3/tests/production_neutral_workgroup_reduce_driver_v1.rs",
          "crates/rustc-codegen-fe2o3/src/production_ranked_projection_v1.rs",
          "crates/fe2o3-mir-model/src/semantic_mir_v1/canonical_decode.rs",
          "crates/fe2o3-lower-mir-kernel/src/production_semantic_kir_v1.rs",
          "examples/workgroup_sync_v1/src/lib.rs",
          "examples/workgroup_sync_v1/src/kernel_scan_u32.rs",
          "examples/workgroup_sync_v1/src/kernel_scan_u32_exclusive.rs",
          "examples/workgroup_sync_v1/src/kernel_scan_i32.rs",
          "examples/workgroup_sync_v1/src/kernel_scan_i32_inclusive.rs",
          "examples/workgroup_sync_v1/src/kernel_scan_f32.rs",
          "examples/workgroup_sync_v1/src/kernel_scan_f32_exclusive.rs",
          "examples/workgroup_sync_v1/scan-u32-request.json",
          "scripts/quickstart.sh",
          "scripts/tests/quickstart.sh",
          "crates/fe2o3-semantic-trace/tests/codec_v2.rs",
          "crates/fe2o3-kir-sim-trace/tests/adapter_v1.rs",
          "crates/fe2o3-hsaco-finalize/src/semantic_debug_instance_custody_v1.rs",
        ],
        {
          target: "gfx942:xnack- CPU semantic qualification; gfx942/gfx950 production compile coverage",
          note: "Qualification evidence for observation-only execution of exact Bundle V5 content with compiler-bundle-bound source locations. Generated bundles and schedule documents exist only in ephemeral test scratch. This is not protected compiler-execution authentication, source-to-KIR refinement, GPU/device-runtime use, hardware validation, timing, or performance prediction.",
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
      sourceCommit: currentMilestones.workgroupScanV1.commit,
      sourceSha256:
        "ed4273d0b9eda1e04e916773886f2442e0404d7ba489b25ddf94d2e7d5fc61d1",
      sourceDigestScope: "displayed",
      sourceFragments: cpuSimulationSourceFragments,
      explanatory: false,
      notice:
        "Exact barrier, struct, tuple, array, ZST, nested aggregate, rejected enum/pointer/drop, gfx950 wave reduction, and gfx942 u32/i32/f32 portable workgroup-reduction excerpts from the ordinary attributed Rust crate used by the pinned simulator regressions.",
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

# Export the barrier example, record/replay its schedule, and inspect source stepping.
${cpuSimulationExportCommand}
REQUEST='${sourceSimulationRequest.trim()}'
printf '%s\\n' "$REQUEST" > barrier-before-access-request.json
${cpuSimulationCommand}
${cpuSimulationReplayCommand}
DEBUG_REQUESTS='${sourceDebuggerRequestsJsonl.trim()}'
printf '%s\\n' "$DEBUG_REQUESTS" | ${cpuDebuggerCommand}

# Export the aggregate example and publish its strict flattened component request.
${aggregateSimulationExportCommand}
REQUEST='${aggregateSimulationRequest.trim()}'
printf '%s\\n' "$REQUEST" > aggregate-pair-struct-request.json
printf '%s\\n' '{"operation":"step","schema":"fe2o3-debug-request-v1","request_id":1,"expected_revision":0,"direction":"forward","granularity":"operation","count":1}' | ${aggregateDebuggerCommand}

# Exercise the ordinary recursive array/nested-struct Bundle V5 execution and hostile shapes.
${recursiveAggregateV5ExecutionTestCommand}
${recursiveAggregateSimulationTestCommand}

# Run generated ordinary-source semantics through strict Bundle V5/KIR V10 custody.
${productionSemanticConformanceTestCommand}

# Export ordinary gfx950 V9 wave code into exact same-module V10 custody.
${v5SimulationExportCommand}
printf '%s\\n' '{"schema":"fe2o3-simulation-request-v1","kernel":"wave_reduce_f32","grid":[64,1,1],"workgroup":[64,1,1],"arguments":[{"kind":"scalar","type":"f32","bits":"0x3f800000"},{"kind":"buffer","element":"f32","access":"read_write","alignment":4,"bytes":"0x${"00".repeat(64 * 4)}"}]}' > wave-reduce-f32-v5-request.json
printf '%s\\n' '{"operation":"continue","schema":"fe2o3-debug-request-v1","request_id":1,"expected_revision":0,"max_events":1000000}' | ${v5DebuggerCommand}

# Export an ordinary portable workgroup reduction and query its hierarchy and events.
${workgroupReductionExportCommand}
printf '%s\\n' '{"schema":"fe2o3-simulation-request-v1","kernel":"workgroup_reduce_u32","grid":[64,1,1],"workgroup":[64,1,1],"arguments":[{"kind":"scalar","type":"u32","bits":"0x00000002"},{"kind":"buffer","element":"u32","access":"read_write","alignment":4,"bytes":"0x${"00".repeat(64 * 4)}"}]}' > workgroup-reduce-u32-request.json
printf '%s\\n' \\
  '{"operation":"continue","schema":"fe2o3-debug-request-v1","request_id":1,"expected_revision":0,"max_events":1000000}' \\
  '{"operation":"inspect_scope","schema":"fe2o3-debug-request-v1","request_id":2,"expected_revision":1,"scope":{"level":"workgroup","workgroup":[0,0,0]},"include_children":true,"page":{"limit":128}}' \\
  '{"operation":"query_events","schema":"fe2o3-debug-request-v1","request_id":3,"expected_revision":1,"filter":{"scope":{"level":"workgroup","workgroup":[0,0,0]},"category":"memory"},"page":{"limit":128}}' \\
  '{"operation":"query_events","schema":"fe2o3-debug-request-v1","request_id":4,"expected_revision":1,"filter":{"scope":{"level":"workgroup","workgroup":[0,0,0]},"category":"operation"},"page":{"limit":128}}' \\
  '{"operation":"inspect_scope","schema":"fe2o3-debug-request-v1","request_id":5,"expected_revision":1,"scope":{"level":"wave","workgroup":[0,0,0],"wave":0},"include_children":true,"page":{"limit":128}}' \\
  | ${workgroupReductionDebuggerCommand}

${workgroupReductionTestCommand}

# Exercise every scan type/mode API contract and all six direct KIR V10 semantic cases.
${workgroupScanApiTestCommand}
${workgroupScanSemanticTestCommand}

# Trace V2 is additive: exact KIR V9/V10 only; Trace V1 remains exact KIR V7.
${semanticTraceV2TestCommand}

# Requires the pinned nightly rust-src and AMD targets; this compiles three attributed
# scan representatives through both production LLVM backends but does not execute a bundle.
${workgroupScanProductionTestCommand}

# Run all 18 ordinary scan entries through Bundle V5 CPU simulation, Trace V2,
# SimRuntimeBackendV1, debugger inspection, and exact persisted seeded replay.
${workgroupScanBundleV5TestCommand}

# Export and run the ordinary three-lane u32 quickstart without GPU access.
${workgroupScanBundleV5QuickstartCommand}
${dynamicLdsSimulationTestCommand}`,
    },
    {
      kind: "comparison",
      label: "Source debug and ABI boundary",
      language: "text",
      code: `${sourceDebuggerTranscript}

Aggregate Bundle V4 ABI boundary

Admitted and executable through Bundle V5 at 1205ddc59
  shapes: pointer-free Unit, fixed array, tuple, and struct
  bound: at most 256 structural nodes
  leaves: exact path, type, byte offset, scalar validity, ownership, and KIR slot
  pass modes: exact Ignore, Direct, Pair, simple Rust integer Cast,
              and sized non-stack/non-metadata Indirect
  execution: logical leaf inputs after independent simulator rederivation
  checked example: [u64; 2] and nested repr(C) aggregate
  production KIR: exact V8 identity
  simulator KIR: exact same-module V10
  consumers: fe2o3-debug sim --bundle-v5 and SimRuntimeBackendV1

Typed unavailable
  enums and niche materialization
  embedded pointers without owned region bindings
  adjusted, unsized, uninhabited, or needs-drop values
  complex/foreign Cast and metadata, on-stack, or non-exact Indirect
  dynamic by-value array indices

Physical Indirect carrier pointers and aggregate padding are never read.

Production semantic conformance V3 at 645750c12
  32 generated cases: i8/i16/i32/i64 and u8/u16/u32/u64
  18 exact-bit cases: f32/f64 corner tables
  additional exact families: scalar/buffer layout, checked bounds, u32 switch
  comparison: exact output bytes and byte-initialization state
  custody: strict Bundle V5 revalidation and canonical KIR V10 identity
  authority: simulated only; hardware and performance remain false

Bundle V5 exactness boundary

  production identity: canonical KIR V9
  executable custody: canonical KIR V10
  admission: re-encode the V10 module as V9 and require exact digest and length
  RegionSlice: pointer @ 0, usize @ 8, ZST marker ignored
  source map: exact bundle-bound V2 identity
  compiler bounds trap: admitted; terminal only if dynamically reached
  other external diagnostics: typed unavailable
  authority: observation only; no compiler, load, launch, or hardware authority

Multi-root semantic debug custody at 2df6130c5
  exact scope: singleton, disjoint, and shared-helper root occurrences
  identity key: correspondence owner + semantic function
  KIR identity: absolute ordinal + role + symbol
  custody: Source Map V2, semantic map, protected lineage, finalizer replay
  rejects: duplicate/reordered roots, substituted identities, overlapping spans
  shared physical helper: one KIR body, not duplicated
  shared source custody: exact owner-qualified occurrence sidecar
  protected ordinary-production proof: unavailable external verifier environment

Semantic Trace version custody at 2df6130c5
  Trace V1: unchanged, exact canonical KIR V7
  Trace V2: exact canonical KIR V9 or V10
  adapter: independently revalidates exact canonical bytes
  cross-version projection and cross-decoding: rejected`,
      explanatory: true,
      notice:
        "The JSONL prefix is the exact checked-in source-debug transcript. The appended recursive ABI and V5 boundaries come from separately pinned production regressions; admission follows compiler ABI/layout and KIR identity evidence, not Rust surface spelling.",
    },
    {
      kind: "result",
      label: "Expected result",
      language: "text",
      code: `# fe2o3-simulation-result-v1
${sourceSimulationResult.trimEnd()}

# fe2o3-simulation-schedule-v1
${sourceSimulationSchedule.trimEnd()}

# Aggregate Bundle V4 regression
Compiler-produced Bundle V4
  explicit kernarg bytes: 40
  explicit kernarg alignment: 8
  struct fields: u32 @ 0, u64 @ 8
  slice: value @ 16, metadata @ 24
  scalar: u64 @ 32

fe2o3-debug sim --bundle-v4
  status: ok
  session.simulated: true
  session.hardware_observed: false

Recursive Bundle V5 milestone at 1205ddc59
  [u64; 2]: admitted through exact sized Indirect evidence
  nested repr(C) struct: admitted as exact recursive scalar leaves
  production KIR V8 -> exact same-module simulator KIR V10
  fe2o3-debug sim --bundle-v5: completed
  SimRuntimeBackendV1: completed
  hostile roster/path/offset/validity/overlap: rejected
  enum, embedded pointer, needs-drop: typed unavailable
  physical carrier/padding reads: none
  canonical bounds trap: dynamic error only when reached

Production semantic conformance V3 at 645750c12
  generated integer cases: 32
  exact f32/f64 corner cases: 18
  ordinary u32 switch: agreement
  output bytes: exact
  initialization state: exact
  bundle version: 5
  canonical simulator KIR version: 10
  simulated: true
  hardware_observed: false
  performance_prediction: false

Target-neutral workgroup scans at 2df6130c5
  ordinary Rust API contracts: 6 (inclusive/exclusive x u32/i32/f32)
  attributed production representatives: 3 (inclusive u32, exclusive i32, inclusive f32)
  direct KIR V10 semantic cases: 6 under canonical, seed 0x5ca1, and exact replay
  u32 inclusive: [1, 3, 6, 10, 15, 21, 28, 36]
  u32 exclusive: [0, 1, 3, 6, 10, 15, 21, 28]
  i32 inclusive: [-4, 3, 1, 10, 7, 8, 14, 9]
  i32 exclusive: [0, -4, 3, 1, 10, 7, 8, 14]
  f32 inclusive: [1, 2, 3, 4, 5, 6, 7, 8]
  f32 exclusive: [0, 1, 2, 3, 4, 5, 6, 7]
  debugger: local lane 7, typed LDS event, 8-participant barrier release,
            seeded schedule identity, bounded decision ordinal
  wrong [4, 1, 1] roster: typed workgroup mismatch
  changed replay input: typed request binding mismatch
  retained ordinary scan Bundle V5 executions: 0
  external protected-production proof: unavailable
  hardware_observed: false
  performance_prediction: false

Ordinary Scan Bundle V5 qualification at b15cf628f
  target: gfx942:xnack-
  matrix: 3 scalar types x 2 modes x extents 3, 65, and 255 = 18 entries
  semantic MIR: additive V11 (V10 remains byte-for-byte closed)
  production KIR V8 -> exact same-module simulator KIR V10
  paths: direct CPU simulator, complete Trace V2, SimRuntimeBackendV1,
         JSONL semantic debugger, persisted seeded schedule replay
  replay seeds: 0x5ca0 through 0x5cb1
  replay checks: exact binding, canonical bytes, record, schedule,
                 transcript identity, complete coverage, and output rows
  cross-bundle replay: schedule_binding_mismatch
  N=65: wave 1, Wave64 active mask 0x0000000000000001,
        lane 0 -> logical work-item [64, 0, 0]
  N=255: resource_exhaustion, exact=false, outcome=active;
         retained prefix inspectable, exhausted dimension not exposed
  debugger bounds: 1,000,000 checkpoints, 16,000,000 values, 256 MiB
  archived generated bundles: 0
  archived schedule documents: 0
  protected compiler execution authenticated: false
  GPU execution / hardware validation / performance prediction: false

Physical differential at 69ae3731b
  hardware passes: 0
  parity passes: 0
  blocker: protected verifier and trust/refinement services unprovisioned

Bundle V5 debugger at 4c1cf6d9c
  production KIR: V9
  simulator KIR: exact same-module V10
  kernel: wave_reduce_f32 on gfx950:xnack-
  stop reason: completed
  session.simulated: true
  session.hardware_observed: false
  session.performance_prediction: false

Portable workgroup reductions at 9176b9c27
  ordinary Rust scalars: u32, i32, f32
  workgroup: [64, 1, 1]
  static LDS: 256 bytes
  exact AcquireRelease workgroup barriers: 14
  u32 input 2 -> 128 in all 64 output lanes
  i32 input -3 -> -192 in all 64 output lanes
  f32 input 1.5 -> 96.0 (0x42c00000) in all 64 output lanes
  debugger views: workgroup, logical wave, memory events, operation events
  schedules: canonical, seeded, exact persisted Bundle V5 replay
  runtime adapter: SimRuntimeBackendV1
  wrong [32, 1, 1] roster: typed workgroup mismatch
  hardware_observed: false
  performance_prediction: false`,
      explanatory: true,
      notice:
        "These are assertions from the pinned production integration and qualification contracts, not a retained live hardware capture.",
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
    { language: "rust", code: vecaddApplicationBoundary },
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
        "The single production ranked route runs bounded target preflight, a sealed checked constant fold, and the fixed nine analysis stages, including pipeline protocol between barrier and workgroup-memory verification. V5 is the sole live middle-end evidence producer; V4 is decoder-only archival data and the V1 declarative refinement API is removed. Independent raw replay is Complete only for the documented static bounded-access fragment; nonempty tensor flow and all other current witnesses remain Incomplete and grant no KIR authority.",
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
        "f8b6953d15b055390114de343e756628f878299c05307cbd27319cce57d0d058",
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
