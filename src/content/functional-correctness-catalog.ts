import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";
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
  productionPipeline: string;
  perCompilationVerus: string;
  disposition: FunctionalCorrectnessDisposition;
  boundary: string;
}

const productionGate =
  "For an admitted reference-bound compilation, production derives and reconciles the compiler-owned semantic contract, derives and validates the strict parallel contract, then runs a generated per-compilation Verus conditional-lemma checker before KIR lowering. The production report cryptographically binds the exact check and retained receipts outside the lemma; this is not one whole-kernel theorem, and candidate declarations are never evidence. Ranked safe-reference loads, canonical dynamic-loop refinement, output numerical refinement, cooperative-tensor structural validation, and multiple-output refinement are published at the exact final compiler commit and tree.";

const noCompilationReceipt =
  "The compiler gate is integrated, but no generated Verus report is bound to this lesson's exact compilation. Its generated source, conditional-lemma result, retained effect receipts, tool identity, and SafeReferenceMirToLivePliron boundary must all authenticate outside the lemma. mi300x lacks the root-owned /opt/fe2o3/verus-runtime-v2/functional-refinement-0.2026.08.02-b677dd5 runtime, so no referenced production compile has completed the gate; cached Verus fixtures pass and there is no fallback.";

const referenceMemoryAndLoopGate =
  "The compiler-owned published subset joins a safe one-dimensional input[index] only when the live ranked GPU read independently matches its typed scalar, view, index, allocation origin, and stride. Canonical dynamic unit-step loops carry an exact finite-domain symbol, full u64 machine bound, transition, termination variant, and maximum-step identity. Raw-pointer or multidimensional CPU reads, unresolved load symbols, non-unit or eventful loops, additional loop-carried recurrence, arbitrary break/continue, and loops without termination evidence fail closed.";

const unsupportedReferenceBody =
  referenceMemoryAndLoopGate +
  " This exact safe reference still uses broader iterators, range slices, nested or noncanonical control flow, Vec allocation/return, composite effects, or helpers outside that admitted subset. The compiler reports Incomplete instead of replacing them with workload-specific summaries.";

const numericalRefinementGate =
  "The generic ErrorBounded relation binds actual and reference scalar roots, Boolean domain and precondition roots, finite nonnegative absolute/relative f64-bit bounds, the exact ranked graph, MIR subjects, and an authenticated receipt. Numerical authority requires an independently imported claim-specific receipt and canonical-true domain and precondition roots covering the complete output. Automatic numerical proof requests and unsupported reassociation or transcendental claims fail closed with FE2O3-PARALLEL-010; unmatched, ambiguous, duplicate, and non-total numerical sites fail with FE2O3-PARALLEL-023 through FE2O3-PARALLEL-026.";

const multiOutputGate =
  "Multiple distinct outputs compose as an ordered product only when compiler-derived allocation origins and distinct nonzero noalias classes prove separation, and each output has its own TotalView, hierarchy identity, frame, receipt, and schedule. FE2O3-PARALLEL-018/019/020/021 reject duplicate views, unproved disjointness, output-specific coverage mismatch, or product-order mismatch.";

const cooperativeTensorGate =
  "The generic cooperative-tensor checks validate live ranked sites against target-owned instruction data, exact fragment roles and lane coordinates, subgroup convergence, tail policy, staging swizzle, and dominating workgroup publication barriers. Current target data covers gfx942 BF16/F32 m16n16k16 Wave64. These are structural checks, not a functional tensor-arithmetic theorem: FE2O3-PARALLEL-013 fails closed until typed tensor SSA def-use and result-to-output binding plus claim-specific receipts exist.";
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The ranked-load mechanism covers direct one-dimensional input[index], but this iterator/closure reference is not that admitted form. The shared-body memory proof and MI300X comparison remain independent evidence; compiler extraction/projection soundness and this exact reference-to-live-PLIRON join are unproved.",
  },
  {
    lessonId: "cpu-semantic-simulation",
    kernel: "Simulated typed fill",
    referenceSourcePath: "examples/verus_vecadd/src/reference.rs",
    referenceContract:
      "Safe Rust fill_reference is the sequential oracle for the bounded u32 fill request.",
    admittedMirSubset:
      "The simulator executes verified canonical KIR for a bounded scalar profile; it does not run or prove a reference-MIR equivalence obligation.",
    outputRelations: ["pointwise"],
    scheduleRelations: ["pointwise"],
    numericalPolicy: "Exact u32 bit-vector assignment.",
    hierarchyCoverage:
      "Only the deterministic serial simulator schedule is observed. GPU wave, workgroup, grid, and machine schedules are not established.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "observation-only",
    boundary:
      "Simulation is trusted unsandboxed host execution and debugging evidence, not GPU execution, translation validation, or performance evidence.",
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The pinned Verus model proves the bounded collective model. Direct one-dimensional reads, canonical loop termination, and separated output products now have generic compiler mechanisms, but this oracle's arrays, helper control flow, collective value proof, and exact output bindings are not a generated lesson receipt. A claim-specific numerical receipt, retained runtime, compiler projection, and GPU execution remain outside the claim.",
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Direct one-dimensional safe reads and canonical unit-step loop termination are implemented generically, but this Vec-returning reference uses multidimensional affine reads, nested reductions, richer recurrence, and allocation outside that subset. MFMA layout and convergence are structurally checked; functional tensor arithmetic stops at FE2O3-PARALLEL-013. The non-exact BF16/F32 relation needs an independently imported claim-specific numerical receipt with canonical-true full coverage. Retained runtime, compiler projection, LLVM+, hardware, and performance stay separate.",
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Layout, source-model, machine, and hardware records remain separate. The generic compiler proves only eligible one-dimensional reads, canonical loop termination, and MFMA structure here; typed tensor SSA-to-output arithmetic composition still stops at FE2O3-PARALLEL-013. This reference's nested affine reads and recurrence, an independently imported full-domain numerical receipt, and the retained runtime are still required.",
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Direct one-dimensional reads, canonical unit-step loop termination, and separated output products now have workload-neutral mechanisms. This reference still uses range slicing, iterators, Vec allocation, richer reduction control, and exponential semantics outside that subset. An independently imported claim-specific softmax receipt with canonical-true full coverage and retained runtime support remain unproved.",
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The generic tensor pass validates MFMA layout and convergence, but functional tensor arithmetic stops at FE2O3-PARALLEL-013. The current oracle's multidimensional reads, Vec score allocation, nested/eventful recurrence, and transcendental operations exceed the admitted read/loop subset. Multiple separated outputs are supported generically, but this exact product still needs its compiler-derived bindings. An independently imported full-domain attention receipt, retained runtime, compiler projection, and LLVM+ remain separate.",
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
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Five passing MI300X shapes are qualification evidence. Direct one-dimensional reads, canonical loops, and separated output products have generic compiler mechanisms, but this reference uses multidimensional affine reads, nested recurrence, Vec return, and routed composition outside that subset. MFMA structure is checked while arithmetic composition stops at FE2O3-PARALLEL-013. An independently imported full-domain numerical receipt, retained runtime, compiler refinement, hardware, and performance remain outside the claim.",
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
      )
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
