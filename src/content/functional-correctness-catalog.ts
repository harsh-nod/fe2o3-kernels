import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";
import {
  proofTimeSourceModelGate,
  runtimeCpuOracleGate,
  validateFunctionalReferenceGate,
  type FunctionalReferenceGate,
} from "./functional-gates";
import { semanticCorrectnessMilestone } from "./semantic-correctness-milestone";

export type FunctionalRelation =
  | "pointwise"
  | "permutation"
  | "fold"
  | "bounded recurrence";

export type FunctionalCorrectnessDisposition =
  | "model-only"
  | "observation-only"
  | "incomplete";

export interface FunctionalCorrectnessCatalogEntry {
  lessonId: string;
  kernel: string;
  referenceSourcePath: string;
  referenceContract: string;
  admittedMirSubset: string;
  outputRelations: FunctionalRelation[];
  scheduleRelations: FunctionalRelation[];
  numericalPolicy: string;
  cooperativeTensor?: string;
  hierarchyCoverage: string;
  functionalGate: FunctionalReferenceGate;
  productionPipeline: string;
  perCompilationVerus: string;
  disposition: FunctionalCorrectnessDisposition;
  boundary: string;
}

const productionGate =
  "For an admitted reference-bound compilation, production derives and reconciles the compiler-owned semantic contract, derives and validates the strict parallel contract, then runs one generated per-compilation Verus checker before KIR lowering. For exact pointwise integer and compiler-side IEEE operator-DAG congruence, that checker replays each compiler-derived domain, precondition, coordinate, and value formula directly; it does not assume a generic relation premise. PLIRON separately proves and reconciles total coverage, allocation separation, frames, schedules, and ordered-product identity. Candidate declarations and status-Checked per-output policy staging are never authority by themselves; the private move-only join is the admission authority and requires matching structural and formula results.";

const noCompilationReceipt =
  "The compiler gate is integrated, but no generated Verus report is bound to this lesson's exact compilation. Its generated formula-replay source and result, status-Checked policy staging, PLIRON structural reports, tool identity, and SafeReferenceMirToLivePliron boundary must bind one compilation at the private move-only join. Staging grants no authority alone. mi300x lacks the root-owned /opt/fe2o3/verus-runtime-v2/functional-refinement-0.2026.08.02-b677dd5 runtime, so no referenced production compile has completed the gate; cached Verus fixtures pass and there is no fallback.";

const referenceMemoryAndLoopGate =
  "The compiler retains the exact assertion for a safe one-dimensional input[index] read and matches the live ranked GPU read by scalar, view, index, allocation origin, and stride. It discharges the full-domain bound only from an identical symbolic ranked extent or an overflow-checked bounded static affine interval; unrelated dynamic extents, missing or unused assertions, unsafe intervals, and overflow fail closed. The Rust assertion is matched but is not itself the proof. Canonical dynamic unit-step loops carry the exact finite-domain symbol, full u64 machine bound, transition, termination variant, maximum-step identity, and an overflow-safe final latch. Noncanonical loops produce an exact SCC invariant/variant proof request, but an imported answer cannot yet grant formula authority.";

const unsupportedReferenceBody =
  referenceMemoryAndLoopGate +
  " This exact safe reference still uses broader iterators, range slices, nested or noncanonical control flow, Vec allocation/return, composite effects, or helpers outside that admitted subset. The compiler reports Incomplete instead of replacing them with workload-specific summaries.";

const numericalRefinementGate =
  "The compiler binds ErrorBounded sites to actual and reference scalar roots, Boolean domain and precondition roots, finite nonnegative absolute/relative f64-bit bounds, the exact ranked graph, and MIR subjects. Finite-error-formula replay is not implemented, so ErrorBounded requests fail closed instead of gaining authority from staging or a test epsilon. Reassociation, transcendental semantics, target IEEE values, and LLVM-or-later arithmetic are not claimed.";

const multiOutputGate =
  "Multiple separated point outputs use one compiler-derived status-Checked policy-staging record per output. PLIRON independently proves and reconciles distinct views, allocation separation, output-specific TotalView and hierarchy facts, frames, schedules, and ordered-product identity. One generated Verus run replays each supported exact formula, but does not prove the separated product. Staging grants no authority alone, and the private move-only join is the admission authority requiring both result classes. Duplicate views, unproved disjointness, output-specific coverage mismatch, and product-order mismatch fail closed.";

const cooperativeTensorGate =
  "The generic cooperative-tensor checks validate live ranked sites against target-owned instruction data, exact fragment roles and lane coordinates, subgroup convergence, tail policy, staging swizzle, and dominating workgroup publication barriers. A typed result component now binds the tensor result root, component ordinal, scalar policy, and exact output store at the claim boundary. Tensor-component formula replay is not implemented, so this exact claim still fails closed; no tensor arithmetic, target instruction, LLVM, or hardware value theorem is implied.";
export const functionalCorrectnessCatalog = deepFreeze([
  {
    lessonId: "first-fill",
    kernel: "Guarded fill",
    referenceSourcePath: "examples/verus_vecadd/src/reference.rs",
    referenceContract:
      "Safe Rust fill_reference defines one final value for every output coordinate and no other observable mutation.",
    admittedMirSubset:
      "A scalar point write and its exact constant/value identity fit the narrow effect model, but this generic slice fill helper is not authenticated as the local reference of the lesson's pinned kernel compilation.",
    outputRelations: ["pointwise"],
    scheduleRelations: ["pointwise"],
    numericalPolicy:
      "Exact copied f32 bit pattern; no floating-point arithmetic theorem is needed.",
    hierarchyCoverage:
      "The required relation is a grid-to-output bijection through workgroup and invocation coordinates. The lesson's separate ownership model is not a per-compilation functional receipt.",
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/verus_vecadd/run-verus.sh --require",
      mismatchBehavior:
        "A modeled mismatch in fill value, owner coverage, bounds, disjoint writes, or frame facts is rejected by Verus before any GPU run; source extraction and launch mismatches remain outside this lesson's current compiler claim.",
      supportedSubset:
        "Safe CPU reference/model for scalar fill, one-dimensional output ownership, guarded writes, and frame obligations.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "model-only",
    boundary:
      "The Verus fill model proves named source properties. It does not authenticate source extraction, compiler projection, LLVM+, launch, or hardware.",
  },
  {
    lessonId: "typed-vecadd",
    kernel: "Typed vector addition",
    referenceSourcePath: "examples/verus_vecadd/src/reference.rs",
    referenceContract:
      "Safe Rust vecadd_reference defines output[i] as left[i] + right[i] for the complete shared extent.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise"],
    scheduleRelations: ["pointwise"],
    numericalPolicy:
      "IEEE operator congruence is the relevant compiler policy. It does not prove target IEEE values or an error bound. " +
      numericalRefinementGate,
    hierarchyCoverage:
      "The intended proof maps each grid invocation to exactly one final coordinate; no cross-wave communication is required.",
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/verus_vecadd/run-verus.sh --require",
      mismatchBehavior:
        "A modeled mismatch in the vecadd value equation, duplicate ownership, missing coverage, bounds, or frame behavior is rejected by the Verus negative fixtures before the GPU path is treated as evidence.",
      supportedSubset:
        "Safe CPU reference/model for one-dimensional pointwise vecadd, checked index reads, one owner per output, and unchanged inputs.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The ranked-load mechanism proves direct one-dimensional input[index] identities only with identical symbolic ranked extents or safe overflow-checked static affine intervals. This iterator/closure reference uses independent lengths and remains outside the admitted form. The shared-body memory proof and MI300X comparison remain independent evidence; compiler extraction/projection soundness and this exact reference-to-live-PLIRON join are unproved.",
  },
  {
    lessonId: "cpu-semantic-simulation",
    kernel: "Compiler-exported barrier-before-access bundle",
    referenceSourcePath: "examples/verus_vecadd/src/reference.rs",
    referenceContract:
      "The independent safe reference illustrates a sequential oracle shape; it is not a proved functional reference for the compiler-exported barrier kernel.",
    admittedMirSubset:
      "fe2o3-export-sim accepts ordinary attributed Rust through the sole production semantic MIR, ranked PLIRON, and target-neutral KIR stages, then publishes one authority-free bundle. The embedded map binds exact source locations to exact KIR content but does not authenticate compiler execution or prove reference equivalence.",
    outputRelations: ["pointwise"],
    scheduleRelations: ["pointwise"],
    numericalPolicy:
      "The observed f32 store is represented by exact software bits. This finite simulation does not prove target IEEE values or compiler arithmetic refinement.",
    hierarchyCoverage:
      "The exact bounded runnable-invocation schedule is persisted and replayed. GPU wave, workgroup, queue, compute-unit, and machine schedules are not established or predicted.",
    functionalGate: runtimeCpuOracleGate({
      command:
        './target/debug/fe2o3-kir-sim --bundle "$PWD/barrier-before-access.fe2sim" --request "$PWD/barrier-before-access-request.json"',
      mismatchBehavior:
        "A bounded replay mismatch is reported by the CPU simulator against the exported KIR bundle; this does not authenticate source-to-GPU refinement or hardware behavior.",
      supportedSubset:
        "Authority-free CPU simulation over compiler-exported KIR with a safe CPU reference/oracle shape for the bounded schedule.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "observation-only",
    boundary:
      "Simulation and compiler-bundle-bound debugging are bounded host observations, not protected compiler authentication, source-to-KIR refinement, race-freedom proof, GPU execution, translation validation, timing, profiling, performance prediction, or performance evidence.",
  },
  {
    lessonId: "reductions-scans",
    kernel: "Masked Wave64 reduction and scans",
    referenceSourcePath: "examples/wave64_collectives_v1/src/oracle.rs",
    referenceContract:
      "The safe oracle fixes the active mask, exact XOR reduction tree, ordered inclusive scan, exclusive shift, and inactive-lane outputs.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["fold", "bounded recurrence"],
    numericalPolicy:
      "Exact binary32 only for the bounded integer corpus and the named operation tree. A changed reduction tree needs an exact matching numerical receipt. " +
      numericalRefinementGate,
    hierarchyCoverage:
      "The relation spans lane and Wave64 participation. Workgroup composition, multiple waves, and grid coverage need separate live hierarchy facts. " +
      multiOutputGate,
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/wave64_collectives_v1/run-verus.sh",
      mismatchBehavior:
        "A modeled mismatch in the active mask, reduction tree, scan order, inactive-lane output, or mutation corpus is rejected by the Verus runner; the generated compiler reference/effect join is still absent for this lesson.",
      supportedSubset:
        "Safe CPU oracle/model for a bounded Wave64 collective with fixed masks, exact integer values, and explicit output relations.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The pinned Verus model proves the bounded collective model. Exact point formulas, canonical loop termination, and PLIRON structural separated-output reconciliation have generic compiler mechanisms, but this oracle's arrays and helper control flow, the collective value proof, and exact output bindings are not a generated lesson report. Its independent slice lengths also lack an exact ranked extent relation. Numerical-error replay, the retained runtime, compiler projection, and GPU execution remain outside the claim.",
  },
  {
    lessonId: "lds-barriers-atomics",
    kernel: "LDS reduction and scoped atomic",
    referenceSourcePath: "examples/workgroup_sync_v1/src/contract.rs",
    referenceContract:
      "Safe Rust validates each lane's publish/read epochs, matching barriers, sole final owner, and the atomic contribution policy before updating output.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["fold", "bounded recurrence"],
    numericalPolicy:
      "Exact mathematical i32 sum only under the oracle's no-overflow precondition; atomic contribution coverage alone proves no final value.",
    hierarchyCoverage:
      "Lane-to-workgroup ownership and epoch convergence are required. Device/system atomic visibility and finalization remain distinct obligations. " +
      multiOutputGate,
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/workgroup_sync_v1/run-verus.sh",
      mismatchBehavior:
        "A modeled mismatch in barrier epochs, LDS publication, final-owner selection, or atomic contribution policy is rejected by the Verus runner; the full reduction value theorem is not promoted to the compiler gate.",
      supportedSubset:
        "Safe CPU reference/contract model for bounded workgroup synchronization, lane epochs, checked finalization, and no-overflow integer contributions.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Barrier and atomic legality do not imply the reduction theorem. The generic load, canonical-loop, and separated-output mechanisms do not admit this oracle's trace iteration, rich Result control flow, atomic value theorem, or grid-visible finalization. Retained runtime support remains outside this exact compilation.",
  },
  {
    lessonId: "gemm-tiling",
    kernel: "Dynamic tiled MFMA GEMM",
    referenceSourcePath: "examples/tiled_gemm_general_v1/src/reference.rs",
    referenceContract:
      "Safe Rust specifies dynamic M/N/K, independent strides, the ordered K reduction, alpha/beta epilogue, edge behavior, and preserved padding.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["bounded recurrence"],
    numericalPolicy:
      "A complete claim needs the exact BF16 conversion, MFMA contraction order, f32 epilogue policy, exceptional values, and either target-value authority or an exact matching output-refinement receipt. " +
      numericalRefinementGate,
    cooperativeTensor: cooperativeTensorGate,
    hierarchyCoverage:
      "Invocation fragments must cover each wave tile, waves each workgroup tile, and workgroups the dynamic output grid exactly once, including edges.",
    functionalGate: runtimeCpuOracleGate({
      command: "examples/tiled_gemm_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded output mismatch against the safe CPU reference fails the GPU qualification run; compiler-time formula authority still fails closed for nested reductions, tensor components, and finite-error replay.",
      supportedSubset:
        "Safe CPU reference/oracle for dynamic GEMM shapes, strides, ordered K reduction, alpha/beta epilogue, edges, and padding.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Canonical unit-step loop termination is implemented generically, including the final-latch overflow check, but this Vec-returning reference's independent dynamic slice extents, multidimensional affine reads, nested reductions, recurrence, and allocation remain unsupported. The MFMA result component and output store are bound exactly at the claim boundary; tensor-component formula replay still fails closed. BF16/F32 error-bound replay, the retained runtime, compiler projection, LLVM+, hardware, and performance stay separate.",
  },
  {
    lessonId: "gemm-proof-plan",
    kernel: "MFMA GEMM proof extension",
    referenceSourcePath: "examples/tiled_gemm_general_v1/src/reference.rs",
    referenceContract:
      "The same safe sequential GEMM reference supplies the desired complete output relation while this lesson decomposes the proof obligations.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["bounded recurrence"],
    numericalPolicy:
      "The proof plan must select exact operator congruence or an authenticated output-refinement contract; test epsilon is not proof evidence. " +
      numericalRefinementGate,
    cooperativeTensor: cooperativeTensorGate,
    hierarchyCoverage:
      "The plan requires fragment-to-wave, wave-to-workgroup, and workgroup-to-grid coverage plus final observable-frame facts.",
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/scalar_gemm_v1/run-verus.sh",
      mismatchBehavior:
        "A modeled mismatch in the scalar GEMM equation, loop-carried accumulator, or bounded memory relation is rejected in the proof-facing runner; this is the proof plan input, not a generated per-compilation receipt.",
      supportedSubset:
        "Safe CPU reference/model for the bounded GEMM proof decomposition over explicit loops, ownership, and reduction obligations.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Layout, source-model, machine, and hardware records remain separate. The generic compiler replays eligible exact point formulas and proves canonical loop termination. It binds typed MFMA result components to exact stores, but tensor-component formula replay still fails closed. This reference's independent extents, nested affine reads and recurrence, numerical-error replay, and the retained runtime are still required.",
  },
  {
    lessonId: "softmax-invariant",
    kernel: "Dynamic row softmax",
    referenceSourcePath: "examples/row_softmax_general_v1/src/reference.rs",
    referenceContract:
      "Safe Rust specifies dynamic rows and columns, strides, stable maximum subtraction, denominator, normalization, tails, and padding.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["fold", "bounded recurrence"],
    numericalPolicy:
      "IEEE operator congruence alone does not establish exp, denominator, or final target values. The generic output-refinement contract can express an independently imported bound, but no automatic request synthesizes transcendental semantics or a nonzero bound. " +
      numericalRefinementGate,
    hierarchyCoverage:
      "Each output row needs complete column contributions, a legal reduction schedule within its wave/workgroup, and total grid coverage.",
    functionalGate: runtimeCpuOracleGate({
      command: "examples/row_softmax_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded softmax output or padding mismatch against the safe CPU reference fails the historical GPU qualification run; exp semantics, numerical bounds, and reference-MIR replay remain fail-closed for compile-time authority.",
      supportedSubset:
        "Safe CPU reference/oracle for dynamic rows, columns, strides, stable max subtraction, denominator, normalization, tails, and padding.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Exact point formulas, canonical unit-step termination, and PLIRON structural separated-output reconciliation have workload-neutral mechanisms. This reference's independent slice extents, range slicing, iterators, Vec allocation, richer reduction control, and exponential semantics remain outside the admitted subset. Numerical-error theorem replay and the retained runtime remain unavailable.",
  },
  {
    lessonId: "flash-attention",
    kernel: "Dynamic MFMA FlashAttention",
    referenceSourcePath: "examples/flash_attention_general_v1/src/reference.rs",
    referenceContract:
      "Safe Rust specifies heads, sequence domains, strides, masks, score contraction, online maximum/sum/value state, normalization, tails, and padding.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["bounded recurrence"],
    numericalPolicy:
      "A verified output-refinement receipt is required for MFMA, exp, rescaling, and normalization. No target IEEE-value or transcendental-library authority is claimed. " +
      numericalRefinementGate,
    cooperativeTensor: cooperativeTensorGate,
    hierarchyCoverage:
      "Fragment ownership must compose through wave and workgroup tiles to every head/query/output coordinate; masked key phases form the recurrence domain. " +
      multiOutputGate,
    functionalGate: runtimeCpuOracleGate({
      command: "examples/flash_attention_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded attention output mismatch against the safe CPU reference fails the GPU qualification run; recurrence, tensor-component replay, exp semantics, and finite-error authority still fail closed at compile time.",
      supportedSubset:
        "Safe CPU reference/oracle for dynamic heads, sequence domains, masks, score contraction, online softmax state, value accumulation, tails, and padding.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The generic tensor path validates MFMA layout and convergence and binds typed result components to exact output stores. Tensor-component formula replay still fails closed. The current oracle's independent and multidimensional reads, Vec score allocation, nested/eventful recurrence, and transcendental operations exceed the admitted subset. PLIRON supports separated point-output structure generically, but this exact product still needs its compiler-derived bindings. Numerical-error replay, the retained runtime, compiler projection, and LLVM+ remain separate.",
  },
  {
    lessonId: "moe-routing",
    kernel: "Deterministic top-2 routing",
    referenceSourcePath: "examples/moe_top2_v1/src/oracle.rs",
    referenceContract:
      "Safe Rust defines top-2 tie breaking, capacity, counts, exclusive-scan offsets, compact slots, inverse permutation, and sentinel behavior.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "permutation", "fold"],
    scheduleRelations: ["permutation", "fold"],
    numericalPolicy:
      "Routing order needs an exact total-order policy for logits, including NaN and ties. An absolute/relative output bound does not establish that control-flow ordering. The published model does not prove target FP32 comparison values.",
    hierarchyCoverage:
      "Token/expert contributions must compose from invocations through workgroups to one grid-wide stable permutation and inverse. " +
      multiOutputGate,
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/moe_top2_v1/run-verus.sh",
      mismatchBehavior:
        "A modeled mismatch in top-2 choice, tie breaking, capacity, counts, compact slots, inverse permutation, or sentinel behavior is rejected by the source-model fixtures before promotion.",
      supportedSubset:
        "Safe CPU oracle/model for bounded deterministic top-2 routing, finite logits, capacity, stable permutation, and inverse mapping.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The source model, bounded corpus, typed ownership, and fail-closed protected path are not this compilation's generated receipt. The compiler can compose multiple outputs with independently proven separation, but this returned composite structure lacks the required distinct allocation-origin/noalias product bindings. Its helper sorting, array mutation, comparison policy, retained runtime, compiler projection, and grid-wide machine execution remain outside the claim.",
  },
  {
    lessonId: "moe-expert-compute",
    kernel: "Dynamic grouped-expert MFMA",
    referenceSourcePath: "examples/moe_grouped_expert_general_v1/src/reference.rs",
    referenceContract:
      "Safe Rust specifies routed rows, expert selection, dynamic K/N, independent strides, contraction, bias, gate, weighted combine, edges, and padding.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "permutation", "fold"],
    scheduleRelations: ["permutation", "bounded recurrence"],
    numericalPolicy:
      "A complete policy must cover BF16 conversion, MFMA and f32 accumulation, bias, gate, route weights, combine order, exceptional values, and an authenticated output-refinement contract when not exact. " +
      numericalRefinementGate,
    cooperativeTensor: cooperativeTensorGate,
    hierarchyCoverage:
      "Route permutation and inverse span the grid; each expert contraction composes fragment, wave, workgroup, and grid ownership before deterministic combine. " +
      multiOutputGate,
    functionalGate: runtimeCpuOracleGate({
      command: "examples/moe_grouped_expert_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded routed-expert output, padding, or combine mismatch against the safe CPU reference fails the GPU qualification run; routed composition and numerical replay remain fail-closed for compiler-time authority.",
      supportedSubset:
        "Safe CPU reference/oracle for routed rows, expert selection, dynamic K/N, strides, contraction, bias, gate, weighted combine, edges, and padding.",
    }),
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Five passing MI300X shapes are qualification evidence. Exact point formulas, canonical loops, and PLIRON structural separated-output reconciliation have generic compiler mechanisms, but this reference's independent slice extents, multidimensional affine reads, nested recurrence, Vec return, and routed composition remain outside that subset. The MFMA component/store claim is exact while tensor-component formula replay still fails closed. Numerical-error replay, the retained runtime, compiler refinement, hardware, and performance remain outside the claim.",
  },
] satisfies FunctionalCorrectnessCatalogEntry[]);

const allowedRelations = new Set<FunctionalRelation>([
  "pointwise",
  "permutation",
  "fold",
  "bounded recurrence",
]);

function validateCatalog(): void {
  if (
    functionalCorrectnessCatalog.length !==
      semanticCorrectnessMilestone.kernelLessons.length ||
    functionalCorrectnessCatalog.some(
      (entry, index) =>
        entry.lessonId !== semanticCorrectnessMilestone.kernelLessons[index],
    )
  ) {
    throw new Error("functional-correctness catalog must cover every kernel lesson");
  }

  const ids = new Set<string>();
  for (const entry of functionalCorrectnessCatalog) {
    const textFields = [
      entry.kernel,
      entry.referenceContract,
      entry.admittedMirSubset,
      entry.numericalPolicy,
      entry.hierarchyCoverage,
      entry.functionalGate.label,
      entry.functionalGate.command,
      entry.functionalGate.mismatchBehavior,
      entry.functionalGate.supportedSubset,
      entry.functionalGate.compileTimePromotion,
      entry.productionPipeline,
      entry.perCompilationVerus,
      entry.boundary,
    ];
    if (
      ids.has(entry.lessonId) ||
      textFields.some((field) => field.trim().length === 0) ||
      entry.referenceSourcePath.startsWith("/") ||
      entry.referenceSourcePath.split("/").includes("..") ||
      entry.outputRelations.length === 0 ||
      entry.scheduleRelations.length === 0 ||
      [...entry.outputRelations, ...entry.scheduleRelations].some(
        (relation) => !allowedRelations.has(relation),
      ) ||
      validateFunctionalReferenceGate(entry.functionalGate).length > 0
    ) {
      throw new Error("functional-correctness catalog entry is malformed");
    }
    ids.add(entry.lessonId);
  }
}

validateCatalog();

const catalogByLessonId = deepFreeze(
  Object.fromEntries(
    functionalCorrectnessCatalog.map((entry) => [entry.lessonId, entry]),
  ),
) as DeepReadonly<Record<string, FunctionalCorrectnessCatalogEntry>>;

export function functionalCorrectnessEntry(
  lessonId: string,
): DeepReadonly<FunctionalCorrectnessCatalogEntry> | undefined {
  return hasOwn(catalogByLessonId, lessonId)
    ? catalogByLessonId[lessonId]
    : undefined;
}
