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
  hierarchyCoverage: string;
  productionPipeline: string;
  perCompilationVerus: string;
  disposition: FunctionalCorrectnessDisposition;
  boundary: string;
}

const productionGate =
  "For an admitted reference-bound compilation, production derives and reconciles the compiler-owned semantic contract, derives and validates the strict parallel contract, then runs a generated per-compilation Verus conditional-lemma checker before KIR lowering. The production report cryptographically binds the exact check and retained receipts outside the lemma; this is not one whole-kernel theorem, and candidate declarations are never evidence.";

const noCompilationReceipt =
  "The compiler gate is integrated, but no generated Verus report is bound to this lesson's exact compilation. Its generated source, conditional-lemma result, retained effect receipts, tool identity, and SafeReferenceMirToLivePliron boundary must all authenticate outside the lemma. mi300x lacks the root-owned /opt/fe2o3/verus-runtime-v2/functional-refinement-0.2026.08.02-b677dd5 runtime, so no referenced production compile has completed the gate; cached Verus fixtures pass and there is no fallback.";

const unsupportedReferenceBody =
  "The safe reference uses unbound Vec/slice reads and, depending on the lesson, dynamic loops without compiler range evidence, richer helpers, allocations, or multiple effects. Those constructs are outside the compiler-bound admitted point-output subset and return Incomplete; they are never replaced by opaque or workload-specific summaries.";

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
      "IEEE operator congruence is the relevant compiler policy. It does not prove target IEEE values, OCML behavior, or an error bound.",
    hierarchyCoverage:
      "The intended proof maps each grid invocation to exactly one final coordinate; no cross-wave communication is required.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The shared-body memory proof and MI300X comparison are independent evidence. Safe slice-read binding, compiler extraction/projection soundness, and this exact reference-to-live-PLIRON join remain unproved.",
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
      "Exact binary32 only for the bounded integer corpus and the named operation tree; reassociation or general IEEE values are outside the claim.",
    hierarchyCoverage:
      "The relation spans lane and Wave64 participation. Workgroup composition, multiple waves, and grid coverage need separate live hierarchy facts.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The pinned Verus model proves the bounded collective model, not safe slice-read binding, output-specific hierarchy identities for multiple views, reassociation/error bounds, retained runtime availability, compiler projection, or GPU execution.",
  },
  {
    lessonId: "lds-barriers-atomics",
    kernel: "LDS reduction and scoped atomic",
    referenceSourcePath: "examples/workgroup_sync_v1/src/reference.rs",
    referenceContract:
      "Safe Rust validates each lane's publish/read epochs, matching barriers, sole final owner, and the atomic contribution policy before updating output.",
    admittedMirSubset: unsupportedReferenceBody,
    outputRelations: ["pointwise", "fold"],
    scheduleRelations: ["fold", "bounded recurrence"],
    numericalPolicy:
      "Exact mathematical i32 sum only under the oracle's no-overflow precondition; atomic contribution coverage alone proves no final value.",
    hierarchyCoverage:
      "Lane-to-workgroup ownership and epoch convergence are required. Device/system atomic visibility and finalization remain distinct obligations.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Barrier and atomic legality do not imply the reduction theorem. Slice reads, rich Result control flow, multiple output/effect identities, grid-visible finalization, and retained runtime support remain outside this exact admitted compilation.",
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
      "A complete claim needs the exact BF16 conversion, MFMA contraction order, f32 epilogue policy, exceptional values, and either target-value authority or a proved error bound.",
    hierarchyCoverage:
      "Invocation fragments must cover each wave tile, waves each workgroup tile, and workgroups the dynamic output grid exactly once, including edges.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The Vec-returning reference and arbitrary slice loads are runtime-oracle evidence. Live MFMA sites still need claim-specific tensor summaries; the numerical contract still needs reassociation/error proof, and retained runtime, compiler projection, LLVM+, hardware, and performance stay separate.",
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
      "The proof plan must select exact operator congruence or a proved error-bounded policy; test epsilon is not proof evidence.",
    hierarchyCoverage:
      "The plan requires fragment-to-wave, wave-to-workgroup, and workgroup-to-grid coverage plus final observable-frame facts.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Layout, source-model, machine, and hardware records remain separate. Slice-read binding, claim-specific MFMA summaries, hierarchy identities, numerical proof, and the retained runtime are still required for an exact per-compilation receipt.",
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
      "Error-bounded transcendental refinement is required but not admitted. IEEE operator congruence alone does not establish exp, denominator, or final target values.",
    hierarchyCoverage:
      "Each output row needs complete column contributions, a legal reduction schedule within its wave/workgroup, and total grid coverage.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Vec allocation, slice-read binding, exponential semantics, narrow dynamic bounds, output-specific hierarchy identities where multiple views are live, error-bound/reassociation proof, and retained runtime support remain unproved.",
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
      "A proved error-bounded policy is required for MFMA, exp, rescaling, and normalization. No target IEEE-value or OCML authority is claimed.",
    hierarchyCoverage:
      "Fragment ownership must compose through wave and workgroup tiles to every head/query/output coordinate; masked key phases form the recurrence domain.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The current oracle and GPU comparisons do not authenticate slice reads, claim-specific tensor/MFMA summaries, multi-output hierarchy identities, error-bound/reassociation proof, retained runtime availability, compiler projection, or LLVM+.",
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
      "Routing order needs an exact total-order policy for logits, including NaN and ties. The published model does not prove target FP32 comparison values.",
    hierarchyCoverage:
      "Token/expert contributions must compose from invocations through workgroups to one grid-wide stable permutation and inverse.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "The source model, bounded corpus, typed ownership, and fail-closed protected path do not bind slice reads, stable ranked-view identities for multiple outputs (FE2O3-PARALLEL-016), an exact routing numerical/order policy, retained runtime availability, compiler projection, or grid-wide machine execution.",
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
      "A complete policy must cover BF16 conversion, MFMA and f32 accumulation, bias, gate, route weights, combine order, exceptional values, and a proved bound when not exact.",
    hierarchyCoverage:
      "Route permutation and inverse span the grid; each expert contraction composes fragment, wave, workgroup, and grid ownership before deterministic combine.",
    productionPipeline: productionGate,
    perCompilationVerus: noCompilationReceipt,
    disposition: "incomplete",
    boundary:
      "Five passing MI300X shapes are qualification evidence. Slice-read binding, claim-specific tensor/MFMA summaries, stable identities for multiple output views, error-bound/reassociation proof, retained runtime support, compiler refinement, hardware, and performance remain outside the claim.",
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
