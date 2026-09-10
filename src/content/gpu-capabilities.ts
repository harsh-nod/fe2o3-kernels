import tutorialKernelManifest from "../../config/tutorial-kernel-manifest-v1.json";
import tiledGemmKernel from "../../examples/tiled_gemm_general_v1/src/kernel.rs?raw";
import { deepFreeze } from "./registry";

export type CapabilityAvailability =
  | "implemented-contract"
  | "component-only"
  | "unavailable";

export interface CapabilityPipelineStage {
  id: string;
  label: string;
  owner: string;
  disposition: CapabilityAvailability;
  current: string;
  gate: string;
}

export interface CapabilityObligation {
  name: string;
  question: string;
  gemmApplication: string;
}

export interface AssuranceLayer {
  term: string;
  producer: string;
  establishes: string;
  doesNotEstablish: string;
}

interface CapabilityKernelManifestRecord {
  fixtureId: string;
  capabilityClosure: {
    status: string;
    requirements: string[];
  };
  productionCapabilityPath: {
    status: string;
    path: string;
  };
  proofRequirements: {
    status: string;
    properties: string[];
  };
  targetMatrix: Array<{
    kind: string;
    target: string;
    status: string;
  }>;
  simulatorCommand: { status: string; reasonCode: string | null };
  hardwareCommand: { status: string; reasonCode: string | null };
  negativeFixtureCoverage: { status: string; cases: unknown[] };
}

interface CapabilityManifest {
  schema: string;
  baseline: { compilerCommit: string; status: string };
  entries: unknown[];
  compilerFixtures: unknown[];
  capabilityKernels: CapabilityKernelManifestRecord[];
}

const manifest = tutorialKernelManifest as CapabilityManifest;
const tiledGemm = manifest.capabilityKernels.find(
  (kernel) => kernel.fixtureId === "gfx942-tiled-gemm",
);

if (!tiledGemm) {
  throw new Error("tutorial capability manifest is missing gfx942-tiled-gemm");
}

const countBy = <Item>(items: readonly Item[], predicate: (item: Item) => boolean) =>
  items.filter(predicate).length;

const kirExcerpt = `OperationKind::KernelContextIssue(KernelContextIssueV1 { ... })
OperationKind::GlobalCapabilityBind(GlobalCapabilityBindV1 { ... })
OperationKind::GlobalCapabilityIndex(GlobalCapabilityIndexV1 { ... })
OperationKind::ExecutionCapability(ExecutionCapabilityOpV1 {
    operation: ExecutionCapabilityOperationV1::WorkgroupDerive { ... },
    ...
})
OperationKind::ExecutionCapability(ExecutionCapabilityOpV1 {
    operation: ExecutionCapabilityOperationV1::LdsAllocate { ... },
    ...
})
OperationKind::ExecutionCapability(ExecutionCapabilityOpV1 {
    operation: ExecutionCapabilityOperationV1::WorkgroupBarrier { ... },
    ...
})
OperationKind::ExecutionCapability(ExecutionCapabilityOpV1 {
    operation: ExecutionCapabilityOperationV1::MatrixAccess { ... },
    ...
})
OperationKind::Matrix(MatrixOperation { ... })
OperationKind::GuardedStore { pointer, predicate, value, access }`;

const w4Obligations: CapabilityObligation[] = [
  {
    name: "CanonicalTyping",
    question: "Is every V13 operation, value, type, root, and edge structurally valid?",
    gemmApplication: "Reject malformed capability SSA, matrix operands, or CFG/phi transport.",
  },
  {
    name: "CapabilityProvenance",
    question: "Did each authority value descend from the authenticated kernel context?",
    gemmApplication: "Bind lane, tile, LDS, matrix, and output authority to the same kernel root.",
  },
  {
    name: "ResourceLegality",
    question: "Can the declared launch and static resources fit the selected profile?",
    gemmApplication: "Check Wave64, one workgroup wave, and 2 KiB of static LDS.",
  },
  {
    name: "Uniformity",
    question: "Which values and branches are uniform at each execution scope?",
    gemmApplication: "Establish a workgroup-uniform K loop around synchronization.",
  },
  {
    name: "TensorLayout",
    question: "Do fragment shape, element type, lane mapping, and layout compose?",
    gemmApplication: "Match BF16 A/B fragments and FP32 accumulators to the 16x16x16 operation.",
  },
  {
    name: "MemoryBounds",
    question: "Is every executed address within its authenticated physical extent?",
    gemmApplication: "Check strided A/B reads and edge-clipped C writes for dynamic M/N/K.",
  },
  {
    name: "AtomicLegality",
    question: "Are atomic type, address space, scope, and order legal?",
    gemmApplication: "Vacuous for this GEMM unless an epilogue introduces atomics.",
  },
  {
    name: "HappensBefore",
    question: "Does each inter-invocation read have a required ordering path?",
    gemmApplication: "Order all LDS writes before fragment consumption.",
  },
  {
    name: "RaceFreedom",
    question: "Can conflicting accesses occur without legal synchronization?",
    gemmApplication: "Exclude LDS phase races and conflicting C writes.",
  },
  {
    name: "HierarchicalOwnership",
    question: "Do lanes, subgroups, workgroups, and the grid own disjoint regions?",
    gemmApplication: "Show each lane owns four outputs and each workgroup owns one tile.",
  },
  {
    name: "BarrierConvergence",
    question: "Do all required participants reach every dynamic barrier instance?",
    gemmApplication: "Reject varying exits or trip counts around tile publication.",
  },
  {
    name: "BarrierOrder",
    question: "Do participants encounter barriers in one compatible order?",
    gemmApplication: "Keep stage, publish, consume, and reuse phases aligned across lanes.",
  },
  {
    name: "PipelineProtocol",
    question: "Is every staged slot committed, waited, consumed, and released legally?",
    gemmApplication: "Validate the modulo-two double-buffer lifecycle for every K phase.",
  },
  {
    name: "Initialization",
    question: "Is each value initialized before every reachable read?",
    gemmApplication: "Require complete tile writes or explicit zero padding before LDS reads.",
  },
  {
    name: "MemoryVisibility",
    question: "Do fences and barriers publish the writes a later phase consumes?",
    gemmApplication: "Carry LDS visibility from producer lanes to MFMA consumer lanes.",
  },
  {
    name: "WorkgroupMemoryEpochs",
    question: "Does each LDS handle belong to the current synchronization epoch?",
    gemmApplication: "Prevent a phase from reusing a slot or handle from an earlier epoch.",
  },
  {
    name: "CollectiveParticipation",
    question: "Do exactly the required lanes participate in each collective operation?",
    gemmApplication: "Require the complete Wave64 participant set for cooperative matrix work.",
  },
  {
    name: "EffectRefinement",
    question: "Do final-graph reads, writes, barriers, and atomics match declared effects?",
    gemmApplication: "Retain only A/B reads, LDS effects, and owned C writes.",
  },
  {
    name: "SemanticRefinement",
    question: "Does the final graph preserve the admitted source-level operation relation?",
    gemmApplication: "Relate the transformed loop and epilogue to the admitted GEMM semantics.",
  },
];

export const gpuCapabilitiesPage = deepFreeze({
  reviewedOn: "2026-09-10",
  issue: 272,
  title: "GPU capability pipeline",
  summary:
    "fe2o3 expresses GPU execution authority with Rust values, carries that authority into canonical KIR V13, and requires every later claim to stay bound to the exact optimized graph, target, artifact, and launch.",
  status: {
    contract: "Normative V1 architecture using canonical KIR V13",
    milestone: "Issue #272 remains in migration until the corpus promotion gate passes",
    corpus: `${countBy(manifest.capabilityKernels, (kernel) => kernel.capabilityClosure.status === "capability-complete")} of ${manifest.capabilityKernels.length} compiler fixtures have complete capability closure`,
    boundary:
      "The September 10 source sweep of compiler revision 75a5778ed attempted all 47 fixtures. Every export still rejected before a complete bundle; no protected GPU run occurred. Nine fixtures reached later compiler gates after collection. Closure custody, bounded core adapters, and constant-loop lowering have new regression coverage, but none of this is end-to-end qualification. Historical compiler, simulator, and GPU results remain explicitly legacy-only.",
  },
  manifest: {
    schema: manifest.schema,
    baselineStatus: manifest.baseline.status,
    compilerCommit: manifest.baseline.compilerCommit,
    lessons: manifest.entries.length,
    fixtures: manifest.compilerFixtures.length,
    completeClosures: countBy(
      manifest.capabilityKernels,
      (kernel) => kernel.capabilityClosure.status === "capability-complete",
    ),
    canonicalPaths: countBy(
      manifest.capabilityKernels,
      (kernel) => kernel.productionCapabilityPath.path === "canonical-capability",
    ),
    pendingHardware: countBy(
      manifest.capabilityKernels,
      (kernel) => kernel.hardwareCommand.status === "available-authenticated-unobserved",
    ),
    qualifiedSimulator: countBy(
      manifest.capabilityKernels,
      (kernel) => kernel.simulatorCommand.status === "capability-path-qualified",
    ),
  },
  pipeline: [
    {
      id: "source",
      label: "Attributed safe Rust",
      owner: "rustc + fe2o3-device",
      disposition: "implemented-contract",
      current:
        "Private constructors, moves, borrows, brands, typestate, and attributed roots make execution roles compiler-issued rather than caller-forged.",
      gate:
        "The latest sweep first rejects 29 fixtures at unreviewed core helpers, including Result residual conversion and checked arithmetic. Each helper needs exact source authentication and semantic lowering; unknown terminals fail closed.",
    },
    {
      id: "semantic-mir",
      label: "Authenticated Semantic MIR",
      owner: "rustc-codegen-fe2o3 frontend",
      disposition: "component-only",
      current:
        "Source and monomorphization identities describe the exact collected kernel closure and its logical argument roles. Device closure transport retains caller, operand, callee, MIR, ABI, and target custody. Authenticated FnOnce adapters and RustCall source tuples stay explicit in semantic MIR.",
      gate:
        "All advanced hierarchy, LDS, collective, matrix, and memory operations must survive one workload-neutral importer. Mutable-load correlation currently handles initial memory or one preceding store at the same invocation index; conflicting joins, aliases, barriers, and loop-carried state remain unsupported.",
    },
    {
      id: "execution-view",
      label: "Checked calls + SSA",
      owner: "fe2o3-mir-model + fe2o3-pliron",
      disposition: "component-only",
      current:
        "Supported direct Rust calls expand into one bounded execution view shared by ranked analysis and KIR lowering. Original MIR stays unchanged; each call instance retains its arguments, local and block origins, and return path. Authenticated workgroup scopes initialize at each call's frame-entry marker, not at root entry. Recursion and unsupported call contracts reject.",
      gate:
        "V6 correspondence replays original source, expanded calls, per-root induction, SSA, and exact KIR. Helper-loop bounds accept exact u32 constants or unchanged parent arguments; reassignment, ordinary aliases, and unsupported shapes reject. Original-coordinate V1 and V4/V5 evidence cannot carry expanded coordinates. Deterministic replay is not a semantic-equivalence proof.",
    },
    {
      id: "canonical-kir",
      label: "Canonical KIR V13",
      owner: "fe2o3-kernel-ir",
      disposition: "component-only",
      current:
        "V13 has a closed execution-capability graph plus exact codecs and structural verification for context, global memory, hierarchy, synchronization, collectives, atomics, matrices, and target requirements.",
      gate:
        "Typed vecadd now passes local CPU/GPU reference-proof execution and import through the root-protected runtime on mi350 in an isolated environment. Extraction next stops at dynamic-launch ownership: guard-aware output coverage and an authenticated launch-to-output extent relationship remain required. A production-runtime test imports matching integer and IEEE operator-congruence proofs and rejects wrong operators. Memory safety does not imply equivalent outputs, and operator congruence is not full IEEE value equivalence. No tutorial fixture publishes a complete source-to-final-V13 identity through this path.",
    },
    {
      id: "final-graph",
      label: "Optimization + exact W4",
      owner: "optimizer V6 + kernel analysis",
      disposition: "component-only",
      current:
        "The frozen 19-obligation schedule binds fresh analysis to canonical bytes, graph epoch, live PLIRON structure, target, launch, and closure identities.",
      gate:
        "Every applicable obligation must complete for the exact final graph; stale, unsupported, incomplete, and rejected evidence stops compilation.",
    },
    {
      id: "target",
      label: "Target requirement closure",
      owner: "target-neutral query + target adapter",
      disposition: "component-only",
      current:
        "Requirements are derived from final KIR rather than a kernel name, then answered by an exact synthetic, gfx942, or gfx950 profile.",
      gate:
        "The manifest records no evaluated neutral closure or target decision for tiled GEMM on the capability path.",
    },
    {
      id: "lowering",
      label: "Target lowering + artifact",
      owner: "AMDGPU model + LLVM/LLD + finalizer",
      disposition: "component-only",
      current:
        "Native V13 KIR-to-LLVM replay passes the independent receipt verifier for gfx942 and gfx950 in component tests, including source, target, and final-graph substitution rejection. This uses the existing generic receipt boundary; it is not machine-code execution or a hardware result.",
      gate:
        "A component test is not a fixture publication; the exact artifact chain must appear in the compiler-produced manifest evidence.",
    },
    {
      id: "machine",
      label: "Machine-refinement boundary",
      owner: "#107/#214 target machine checkers",
      disposition: "component-only",
      current:
        "Target-specific checkers decode bounded machine forms and compare effects, synchronization, memory, and selected instruction semantics to frozen target KIR.",
      gate:
        "Opt-in worker requests can retain bounded raw LLVM checkpoints and require exact bootstrap/replay agreement. Content custody is not machine equivalence: pass occurrence, instruction-selection correspondence, and durable capture replay remain incomplete. Unmodeled instructions, numerical modes, or protocol steps remain unsupported; no tiled-GEMM capability-path machine receipt is published.",
    },
    {
      id: "launch",
      label: "Protected host admission",
      owner: "generated host + sealed #213 verifier",
      disposition: "unavailable",
      current:
        "The manifest registers authenticated gfx942 hardware transport, but no signed target-matched observation or complete V13 capability association is published for tiled GEMM.",
      gate:
        "Static evidence, current artifact custody, dynamic buffer and launch facts, and completion ownership must join without fallback.",
    },
  ] satisfies CapabilityPipelineStage[],
  workedExample: {
    lessonId: "gemm-tiling",
    operatorId: "gemm",
    fixtureId: tiledGemm.fixtureId,
    title: "Tiled GEMM: follow one tile through the capability pipeline",
    equation: "C[row, col] = alpha * sum_k(A[row, k] * B[k, col]) + beta * C[row, col]",
    summary:
      "The checked-in example maps one Wave64 workgroup to a 16x16 output tile, stages BF16 fragments through two LDS buffers, accumulates in FP32, and gives each lane four disjoint stores. Its CPU tests and gfx942 runner are concrete; authenticated hardware transport remains unobserved for issue #272.",
    runContracts: [
      {
        label: "CPU reference and source tests",
        command:
          "cargo test --locked --manifest-path examples/tiled_gemm_general_v1/Cargo.toml",
        boundary:
          "Runs host tests and the independent safe Rust reference. It does not compile or dispatch the GPU kernel.",
      },
      {
        label: "gfx942 authenticated runner",
        command: "FE2O3_TUTORIAL_HARDWARE_PROTOCOL=authenticated-v1 bash examples/tiled_gemm_general_v1/run-gfx942.sh",
        boundary:
          "The manifest records available-authenticated-unobserved transport. The qualification orchestrator must supply the prepared compiler transaction and hardware request; this command alone does not establish a GPU result, proof, or qualification.",
      },
    ],
    sourceExcerpt: tiledGemmKernel,
    sourceNote:
      "This is the exact checked-in safe Rust kernel, imported directly rather than copied into page content. The current runnable source uses compatibility APIs such as thread::index_1d and WorkgroupPipeline. The V13 migration must authenticate their compiler-issued meaning; documentation does not pretend the legacy runner already exercised that path.",
    sourcePaths: [
      "examples/tiled_gemm_general_v1/src/kernel.rs",
      "examples/tiled_gemm_general_v1/src/reference.rs",
      "examples/tiled_gemm_general_v1/src/main.rs",
      "examples/tiled_gemm_general_v1/run-gfx942.sh",
      "crates/fe2o3-kernel-ir/src/execution_capability_v1.rs",
      "crates/fe2o3-kernel-analysis/src/production_capability_schedule.rs",
    ],
    typeFacts: [
      {
        capability: "DisjointSlice<f32, Tiled2D<Index1D, 64, 16, 16, 4>>",
        meaning:
          "The writable output role is coupled to the lane-to-tile mapping used to justify non-overlapping stores.",
      },
      {
        capability: "WaveLane<Wave64>",
        meaning:
          "Lane authority carries the exact subgroup width required by the matrix profile.",
      },
      {
        capability: "WorkgroupPipeline<Fragment, 2, 64, 1>",
        meaning:
          "A two-slot LDS protocol makes phase state and the participant count explicit in ordinary Rust.",
      },
      {
        capability: "Matrix",
        meaning:
          "A target-neutral matrix operation is requested in source; the target adapter must separately prove an exact supported shape and numerical mode.",
      },
      {
        capability: "KernelContext -> KIR V13 provenance",
        meaning:
          "The compiler, not the host ABI, creates the logical kernel/workgroup/subgroup brands retained in canonical IR.",
      },
    ],
    kirExcerpt,
    kirNote:
      "These are exact V13 enum names, shown as a readable operation vocabulary rather than serialized KIR. The compiler must emit the complete operands, result types, brands, extents, epochs, and requirements from authenticated Semantic MIR; a matching text fragment has no authority.",
    identityFacts: [
      "Canonical V13 byte digest and byte length",
      "pre-optimization and final graph identities",
      "optimizer policy, transformation transcript, and monotonic graph epoch",
      "live PLIRON structural identity and mutation epoch for every function",
      "kernel root, entry, source map, target, launch, and closure identities",
      "ordered W4 checker schedule and independently replayed raw-IR evidence",
    ],
    requirements: [...tiledGemm.capabilityClosure.requirements],
    manifestState: {
      closure: tiledGemm.capabilityClosure.status,
      productionPath: `${tiledGemm.productionCapabilityPath.status} (${tiledGemm.productionCapabilityPath.path})`,
      proof: tiledGemm.proofRequirements.status,
      neutralTarget:
        tiledGemm.targetMatrix.find((entry) => entry.kind === "neutral")?.status ?? "missing",
      backendTarget:
        tiledGemm.targetMatrix.find((entry) => entry.kind === "backend")?.status ?? "missing",
      simulator: tiledGemm.simulatorCommand.status,
      hardware: tiledGemm.hardwareCommand.status,
      negatives: tiledGemm.negativeFixtureCoverage.status,
    },
  },
  obligations: w4Obligations,
  assurance: [
    {
      term: "Clean",
      producer: "one bounded W4 analysis",
      establishes:
        "The checker discharged its documented job for one exact graph, epoch, policy, and analysis context.",
      doesNotEstablish:
        "No property class or launch authority follows from Clean alone.",
    },
    {
      term: "Checked",
      producer: "protected capability composition",
      establishes:
        "A property allowed to use static analysis is bound to the exact W4 report, checker, V13 graph, and epochs.",
      doesNotEstablish:
        "Checked is not silently equivalent to Proven, validated hardware, or a general theorem.",
    },
    {
      term: "Proven",
      producer: "an accepted proof with a named theorem domain",
      establishes:
        "Only the exact proposition, assumptions, subject, and scope carried by that proof evidence.",
      doesNotEstablish:
        "A clean analysis must never be relabeled Proven; proof also does not authenticate LLVM, LLD, runtime, or hardware.",
    },
    {
      term: "Refinement receipt",
      producer: "source-to-KIR or target-machine refinement owner",
      establishes:
        "The named relation between exact stage endpoints under its explicit model and trusted base.",
      doesNotEstablish:
        "It says nothing about properties outside that relation or a different source, graph, target, or artifact.",
    },
    {
      term: "Simulator observation",
      producer: "deterministic supported-semantics runner",
      establishes:
        "Observed behavior for the recorded inputs and schedules in the simulator's supported subset.",
      doesNotEstablish:
        "Universal correctness, real GPU execution, or performance.",
    },
    {
      term: "Hardware observation",
      producer: "target-matched runner",
      establishes:
        "Observed output and canary behavior for one exact artifact, device, launch, and input matrix.",
      doesNotEstablish:
        "All inputs, all schedules, semantic equivalence, or qualification of another compiler path.",
    },
  ] satisfies AssuranceLayer[],
  targetFlow: [
    "Derive transitive requirements from final KIR V13 and the launch contract; kernel names do not select capabilities.",
    "Evaluate the neutral model first, then require one exact target profile to answer every requirement without fallback.",
    "Lower only the admitted final graph and bind the V13 input, optimizer replay, target identity, and emitted LLVM bytes.",
    "Finalize raw object bytes into HSACO, then inspect entry, ABI, descriptor, resources, symbols, and executable sections.",
    "Run target-specific machine refinement over decoded instructions and protocol steps. Unsupported instructions fail closed.",
    "Keep machine refinement separate from simulator and hardware observations; each has a different subject and claim.",
  ],
  safeLaunch: [
    "Generated host code accepts ordinary buffers and scalar problem data; callers never manufacture KernelContext or proof records.",
    "Preparation validates dimensions, checked extents, allocation ranges, alias rules, geometry, target/device identity, and dynamic resources before GPU side effects.",
    "Static capability evidence must name the exact final V13 graph, target decision, final HSACO, kernel entry, ABI, resources, source refinement, and machine refinement required by policy.",
    "Per-dispatch evidence binds dynamic buffer ranges, launch dimensions, and resources to that same static association and current artifact.",
    "Only the sealed #213 verifier consumes the complete move-only receipt set and may admit publication, load, or launch; a public digest or boolean cannot.",
    "The asynchronous completion owner retains all borrowed buffers and runtime resources until completion or typed failure.",
  ],
  unavailableJoins: [
    `The manifest baseline is ${manifest.baseline.status}; ${manifest.capabilityKernels.length} of ${manifest.capabilityKernels.length} capability closures are still not produced.`,
    "Tiled GEMM has no published source-to-final-KIR V13 capability-path association.",
    "Its neutral target closure is not evaluated and its gfx942 target decision remains legacy-only.",
    "Its required source, functional, and machine refinement evidence is still marked missing.",
    "No capability-path simulator command is published for tiled GEMM.",
    "The gfx942 command is registered as available-authenticated-unobserved; no signed target-matched hardware result is published.",
    "Capability-path negative-fixture coverage for this fixture is still marked missing.",
    "Complete BF16 conversion, MFMA contraction order, exceptional-value, and finite-error equivalence remain outside the published compile-time proof claim.",
  ],
  links: [
    {
      label: "Normative GPU capability contract",
      href: "https://github.com/harsh-nod/fe2o3/blob/main/docs/gpu-execution-capabilities-v1.md",
    },
    {
      label: "Implementation issue #272",
      href: "https://github.com/harsh-nod/fe2o3/issues/272",
    },
    {
      label: "Tutorial capability manifest",
      href: "https://github.com/harsh-nod/fe2o3-kernels/blob/main/config/tutorial-kernel-manifest-v1.json",
    },
  ],
});
