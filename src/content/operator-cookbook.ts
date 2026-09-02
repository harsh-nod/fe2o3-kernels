import type { EvidenceKind } from "./model";
import {
  proofTimeSourceModelGate,
  runtimeCpuOracleGate,
  type FunctionalReferenceGate,
} from "./functional-gates";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export type OperatorCookbookId =
  | "fill"
  | "vecadd"
  | "row-softmax"
  | "flash-attention"
  | "gemm"
  | "moe"
  | "kda-gdn"
  | "sparse-attention"
  | "compressed-hybrid-attention"
  | "residual-mixing"
  | "speculative-mtp"
  | "ngram-gather"
  | "muon-update"
  | "gpt-oss-layer-tile";

export type OperatorCookbookFamily =
  "starter" | "reduction" | "attention" | "matrix" | "moe" | "model-kernel";

export interface OperatorCookbookRun {
  label: string;
  evidenceKind: EvidenceKind;
  target: string;
  command?: string;
  status: string;
}

export interface OperatorCookbookPaths {
  source: readonly string[];
  reference: readonly string[];
  runner: readonly string[];
  evidence: readonly string[];
}

export interface OperatorCookbookVariant {
  label: string;
  lessonId: string;
  evidenceKind: EvidenceKind;
  implementedShape: string;
  commandOrStatus: string;
}

export interface OperatorCookbookRecord {
  id: OperatorCookbookId;
  title: string;
  family: OperatorCookbookFamily;
  lessonIds: readonly string[];
  evidenceKind: EvidenceKind;
  learningLevel: "first-kernel" | "core-kernel" | "advanced-kernel";
  computeContract: string;
  implementedShape: string;
  run: OperatorCookbookRun;
  functionalGate: FunctionalReferenceGate;
  paths: OperatorCookbookPaths;
  variants?: readonly OperatorCookbookVariant[];
  nonClaims: readonly string[];
}

export interface OperatorCookbookEntry extends OperatorCookbookRecord {
  category: OperatorCookbookFamily;
  status: EvidenceKind;
  lessonId: string;
  computes: string;
  runner: string;
  expected: string;
  sourcePaths: readonly string[];
  referencePaths: readonly string[];
}

const rustToolchain = "nightly-2026-04-03";
const gfx942 = "gfx942:xnack-";
const gfx950 = "gfx950:xnack-";

const entries = [
  {
    id: "fill",
    title: "Fill",
    family: "starter",
    lessonIds: ["first-fill"],
    evidenceKind: "runnable-now",
    learningLevel: "first-kernel",
    computeContract:
      "Map each in-range logical thread to one output element and write the same scalar value. The output guard dominates the write, so rounded tail lanes do not touch memory.",
    implementedShape:
      "1024 f32 outputs in the introductory runner; CPU check expects every value to equal 42.5 within 1e-5.",
    run: {
      label: "Run the typed fill example",
      evidenceKind: "runnable-now",
      target: gfx942,
      command: `FE2O3_TARGET=${gfx942} cargo +${rustToolchain} run --locked -p cargo-fe2o3 -- run -p fe2o3-fill`,
      status:
        "Runnable tutorial path; also tied to the source-model fill proof in examples/verus_vecadd.",
    },
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/verus_vecadd/run-verus.sh --require",
      mismatchBehavior:
        "A modeled fill mismatch in value, coverage, bounds, or frame behavior is rejected by Verus before the runnable GPU path is promoted.",
      supportedSubset:
        "Safe CPU reference/model for scalar fill, guarded one-dimensional output writes, and explicit frame obligations.",
    }),
    paths: {
      source: ["examples/fill/src/main.rs"],
      reference: ["examples/verus_vecadd/src/reference.rs"],
      runner: [
        "examples/fill/src/main.rs",
        "examples/regression-manifest-v1.txt",
        "scripts/ci-local.sh",
      ],
      evidence: ["examples/verus_vecadd/verus/fill.rs"],
    },
    nonClaims: [
      "No general scatter or aliasing support is claimed.",
      "No performance result is claimed.",
      "The legacy host launch is a compatibility path, not the final protected evidence pipeline.",
    ],
  },
  {
    id: "vecadd",
    title: "Vecadd",
    family: "starter",
    lessonIds: ["typed-vecadd"],
    evidenceKind: "gpu-observed",
    learningLevel: "first-kernel",
    computeContract:
      "Read two f32 input slices at the guarded output index, add the values, and write one f32 result through the typed kernel API.",
    implementedShape:
      "Three-slice f32 profile. The tutorial run uses the generated Kernel and Prepared host types; the MI300X observation validated 16,777,216 outputs.",
    run: {
      label: "Run the typed vecadd example",
      evidenceKind: "runnable-now",
      target: gfx942,
      command: `FE2O3_TARGET=${gfx942} cargo +${rustToolchain} run --locked -p cargo-fe2o3 -- run -p fe2o3-vecadd`,
      status:
        "Runnable typed vertical slice; separate MI300X benchmark evidence reports GPU correctness and HIP comparison.",
    },
    functionalGate: proofTimeSourceModelGate({
      command:
        "VERUS=/absolute/path/to/pinned/verus examples/verus_vecadd/run-verus.sh --require",
      mismatchBehavior:
        "A modeled vecadd mismatch in the output equation, ownership, bounds, or unchanged-input frame is rejected by the Verus refinement fixtures before hardware evidence is trusted.",
      supportedSubset:
        "Safe CPU reference/model for one-dimensional pointwise vecadd and checked slice reads.",
    }),
    paths: {
      source: ["examples/vecadd/src/vecadd_body.rs"],
      reference: ["examples/verus_vecadd/src/reference.rs"],
      runner: [
        "examples/vecadd/src/main.rs",
        "benchmarks/vecadd_hip/profile-mi300x.sh",
      ],
      evidence: [
        "examples/verus_vecadd/verus/vecadd.rs",
        "examples/verus_vecadd/verus/reference_refinement_v1.rs",
        "benchmarks/vecadd_hip/README.md",
      ],
    },
    nonClaims: [
      "The source-model proof covers memory, bounds, and frame facts; it does not prove IEEE f32 arithmetic semantics.",
      "The host-path benchmark includes synchronous safe launch policy overhead.",
      "The HIP comparison is not a general performance claim for all vecadd sizes or hosts.",
    ],
  },
  {
    id: "row-softmax",
    title: "Dynamic Row Softmax",
    family: "reduction",
    lessonIds: ["softmax-invariant"],
    evidenceKind: "gpu-observed",
    learningLevel: "core-kernel",
    computeContract:
      "For each row, subtract the row maximum, exponentiate finite active columns, reduce the denominator, and write normalized probabilities while preserving output padding.",
    implementedShape:
      "Historical dynamic qualification covered rows/columns/strides including 3x1, 5x63, 7x257, and 2x4096 cases on gfx942.",
    run: {
      label: "Replay the historical gfx942 qualification",
      evidenceKind: "gpu-observed",
      target: gfx942,
      command: "examples/row_softmax_general_v1/run-gfx942.sh",
      status:
        "Historical qualification path; the retired workload-selecting route is not the current production transaction.",
    },
    functionalGate: runtimeCpuOracleGate({
      command: "examples/row_softmax_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded row-softmax output or padding mismatch against the safe CPU reference fails the qualification runner; exp and numerical-refinement authority are not compile-time claims yet.",
      supportedSubset:
        "Safe CPU reference/oracle for dynamic rows, columns, strides, finite active columns, tails, and padding.",
    }),
    paths: {
      source: ["examples/row_softmax_general_v1/src/kernel.rs"],
      reference: ["examples/row_softmax_general_v1/src/reference.rs"],
      runner: [
        "examples/row_softmax_general_v1/src/main.rs",
        "examples/row_softmax_general_v1/run-gfx942.sh",
      ],
      evidence: [
        "examples/semantic_reference_vnext/softmax_verus.rs",
        "examples/verus_vecadd/verus/reference_refinement_v1.rs",
      ],
    },
    nonClaims: [
      "No current protected production launch path is claimed for the historical row-softmax route.",
      "The listed cases are CPU-oracle qualifications, not a proof for every shape or input.",
      "No MFMA or matrix-contraction behavior is claimed; this is a reduction workload.",
      "No performance result is claimed.",
    ],
  },
  {
    id: "flash-attention",
    title: "FlashAttention",
    family: "attention",
    lessonIds: [
      "flash-attention",
      "gfx950-fp4-attention",
      "gfx950-fp8-attention",
    ],
    evidenceKind: "gpu-observed",
    learningLevel: "core-kernel",
    computeContract:
      "Fuse QK score tiles, masking, online softmax max/sum state, and PV accumulation without materializing the full score matrix.",
    implementedShape:
      "Dynamic gfx942 qualification: 2 heads, 19 query rows, 21 key rows, depth 23, value dimension 13, four workgroups. Source-model variant: exact B=1, H=1, N=8, D=16 causal FP32 recurrence.",
    run: {
      label: "Run the dynamic gfx942 attention qualification",
      evidenceKind: "gpu-observed",
      target: gfx942,
      command: "examples/flash_attention_general_v1/run-gfx942.sh",
      status:
        "Historical dynamic GPU qualification plus current source/model coverage for the smaller causal teaching operator.",
    },
    functionalGate: runtimeCpuOracleGate({
      command: "examples/flash_attention_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded attention-output mismatch against the safe CPU oracle fails the GPU runner; the smaller causal model also rejects source-model mutations, but full recurrence and exp semantics are not compile-time authority yet.",
      supportedSubset:
        "Safe CPU reference/oracle for bounded FlashAttention fixtures plus a separate proof-facing causal source model.",
    }),
    paths: {
      source: [
        "examples/flash_attention_general_v1/src/kernel.rs",
        "examples/flash_attention_v1/src/kernel.rs",
      ],
      reference: [
        "examples/flash_attention_general_v1/src/reference.rs",
        "examples/flash_attention_v1/src/oracle.rs",
      ],
      runner: [
        "examples/flash_attention_general_v1/src/main.rs",
        "examples/flash_attention_general_v1/run-gfx942.sh",
        "examples/flash_attention_v1/run-verus.sh",
      ],
      evidence: [
        "examples/semantic_reference_vnext/flash_attention_verus.rs",
        "examples/flash_attention_v1/verus/flash_attention_v1.rs",
        "examples/gfx950_low_precision/run-fp4-attention-gfx950.sh",
        "examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
        "crates/fe2o3-hsa-runtime/tests/gfx950_attention_hardware.rs",
      ],
    },
    variants: [
      {
        label: "gfx950 FP4 flash attention",
        lessonId: "gfx950-fp4-attention",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Packed E2M1 K fragments, B4 LDS transpose load, one low-precision MFMA score tile, FP32 softmax state.",
        commandOrStatus:
          "bash examples/gfx950_low_precision/run-fp4-attention-gfx950.sh",
      },
      {
        label: "gfx950 FP8 flash attention",
        lessonId: "gfx950-fp8-attention",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Packed E4M3 Q/K fragments, B8 LDS transpose load, one low-precision MFMA score tile, FP32 softmax state.",
        commandOrStatus:
          "bash examples/gfx950_low_precision/run-fp8-attention-gfx950.sh",
      },
    ],
    nonClaims: [
      "The dynamic gfx942 result is functional qualification, not a tuned-library performance claim.",
      "The causal source-model theorem does not prove OCML exponential behavior, IEEE FP32, compiler lowering, machine safety, or GPU execution.",
      "The low-precision gfx950 lessons are bounded hardware observations, not full transformer attention layers.",
    ],
  },
  {
    id: "gemm",
    title: "GEMM",
    family: "matrix",
    lessonIds: [
      "gemm-tiling",
      "gemm-proof-plan",
      "gfx950-fp4-gemm",
      "gfx950-fp8-gemm",
    ],
    evidenceKind: "gpu-observed",
    learningLevel: "core-kernel",
    computeContract:
      "Tile matrix multiplication into wave64-owned fragments, carry an FP32 accumulator through the K loop, and store each output element through disjoint ownership.",
    implementedShape:
      "Dynamic gfx942 BF16/F32 qualification: 19x21x23 GEMM, four workgroups, 16x16 output tiles, runtime M/N/K/strides/alpha/beta. Historical protected Slice 1 covers one exact 16x16x16 tile.",
    run: {
      label: "Run the dynamic gfx942 GEMM qualification",
      evidenceKind: "gpu-observed",
      target: gfx942,
      command: "examples/tiled_gemm_general_v1/run-gfx942.sh",
      status:
        "GPU-observed functional qualification; protected Worker V3 publication and complete source-to-machine refinement remain separate.",
    },
    functionalGate: runtimeCpuOracleGate({
      command: "examples/tiled_gemm_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded GEMM output, edge, or padding mismatch against the safe CPU reference fails the GPU qualification run; nested reductions, MFMA tensor components, and finite-error replay remain fail-closed for compile-time authority.",
      supportedSubset:
        "Safe CPU reference/oracle for dynamic M/N/K, independent strides, ordered K reduction, alpha/beta epilogue, edges, and padding.",
    }),
    paths: {
      source: [
        "examples/tiled_gemm_general_v1/src/kernel.rs",
        "examples/tiled_gemm_v1/src/kernel.rs",
        "examples/gfx950_low_precision/src/kernel.rs",
      ],
      reference: [
        "examples/tiled_gemm_general_v1/src/reference.rs",
        "examples/gfx950_low_precision/src/reference.rs",
      ],
      runner: [
        "examples/tiled_gemm_general_v1/src/main.rs",
        "examples/tiled_gemm_general_v1/run-gfx942.sh",
        "examples/tiled_gemm_general_v1/run-benchmark.sh",
        "examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
        "examples/gfx950_low_precision/run-fp8-gemm-gfx950.sh",
      ],
      evidence: [
        "examples/semantic_reference_vnext/gemm_verus.rs",
        "examples/tiled_gemm_v1/verus/lds_tiled_slice1_source_refinement.rs",
        "crates/fe2o3-hsa-runtime/tests/tiled_gemm_lds_slice1_worker_v2_hardware.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_fp4_gemm_hardware.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_fp8_gemm_hardware.rs",
      ],
    },
    variants: [
      {
        label: "gfx950 FP4 GEMM",
        lessonId: "gfx950-fp4-gemm",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Packed E2M1 16x16x128 wave64 GEMM with gfx950 low-precision MFMA and FP32 accumulator.",
        commandOrStatus:
          "bash examples/gfx950_low_precision/run-fp4-gemm-gfx950.sh",
      },
      {
        label: "gfx950 FP8 GEMM",
        lessonId: "gfx950-fp8-gemm",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Packed E4M3 16x16x128 wave64 GEMM through the unified f8f6f4 MFMA path.",
        commandOrStatus:
          "bash examples/gfx950_low_precision/run-fp8-gemm-gfx950.sh",
      },
    ],
    nonClaims: [
      "The current dynamic GEMM result is functional qualification, not a performance promotion.",
      "The protected Slice 1 evidence is historical and does not transfer to every current source tab.",
      "The gfx950 FP4/FP8 kernels are fixed-tile bounded observations, not general GEMM libraries.",
      "Complete source-to-machine refinement remains unclaimed.",
    ],
  },
  {
    id: "moe",
    title: "Mixture-of-Experts Routing and Expert Compute",
    family: "moe",
    lessonIds: ["moe-routing", "moe-expert-compute", "gfx950-advanced-moe"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Select deterministic top-k experts, apply capacity and stable compact slots, run routed expert projections, and combine weighted route outputs back to token order.",
    implementedShape:
      "Routing source model: T8/E4/K2/C4 finite-FP32 top-2 with lower-expert tie breaking. Historical grouped expert qualification: 41 tokens, four experts, 82 routes, K=35, N in {1,15,16,17,33}. gfx950 advanced slice: 16 tokens, hidden 128, output 16, four routed experts plus one shared expert, top-2 routing.",
    run: {
      label: "Run the grouped-expert gfx942 qualification",
      evidenceKind: "gpu-observed",
      target: gfx942,
      command: "examples/moe_grouped_expert_general_v1/run-gfx942.sh",
      status:
        "Historical grouped-expert GPU qualification; current deterministic top-2 routing is source/model evidence, and gfx950 advanced MoE has bounded MI350X observations.",
    },
    functionalGate: runtimeCpuOracleGate({
      command: "examples/moe_grouped_expert_general_v1/run-gfx942.sh",
      mismatchBehavior:
        "A bounded routed-expert output, padding, or combine mismatch against the safe CPU reference fails the GPU runner; top-2 routing mutations are separately rejected by the source-model proof.",
      supportedSubset:
        "Safe CPU reference/oracle for routing metadata, expert selection, dynamic expert GEMM, weighted combine, and bounded output padding.",
    }),
    paths: {
      source: [
        "examples/moe_top2_v1/src/kernel.rs",
        "examples/moe_grouped_expert_general_v1/src/kernel.rs",
        "examples/gfx950_advanced_systems/src/kernel.rs",
      ],
      reference: [
        "examples/moe_top2_v1/src/oracle.rs",
        "examples/moe_grouped_expert_general_v1/src/reference.rs",
        "examples/gfx950_advanced_systems/src/reference.rs",
      ],
      runner: [
        "examples/moe_top2_v1/run-memory-verus.sh",
        "examples/moe_grouped_expert_general_v1/src/main.rs",
        "examples/moe_grouped_expert_general_v1/run-gfx942.sh",
        "examples/gfx950_advanced_systems/run-moe-route-gfx950.sh",
        "examples/gfx950_advanced_systems/run-moe-expert-rank-gfx950.sh",
        "examples/gfx950_advanced_systems/run-combine-expert-ranks-gfx950.sh",
      ],
      evidence: [
        "examples/moe_top2_v1/verus/moe_top2_v1.rs",
        "examples/semantic_reference_vnext/moe_verus.rs",
        "crates/fe2o3-hsa-runtime/tests/moe_top2_v1_hardware.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    variants: [
      {
        label: "gfx950 route metadata",
        lessonId: "gfx950-advanced-moe",
        evidenceKind: "gpu-observed",
        implementedShape:
          "16-token top-2 route metadata with exact expert IDs, weights, counts, and dispatch table.",
        commandOrStatus:
          "bash examples/gfx950_advanced_systems/run-moe-route-gfx950.sh",
      },
      {
        label: "gfx950 expert rank",
        lessonId: "gfx950-advanced-moe",
        evidenceKind: "gpu-observed",
        implementedShape:
          "FP4/FP8 expert-rank tile with three gfx950 f8f6f4 MFMA instructions.",
        commandOrStatus:
          "bash examples/gfx950_advanced_systems/run-moe-expert-rank-gfx950.sh",
      },
      {
        label: "gfx950 rank combine",
        lessonId: "gfx950-advanced-moe",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Weighted rank-combine output over the bounded expert-rank fixture.",
        commandOrStatus:
          "bash examples/gfx950_advanced_systems/run-combine-expert-ranks-gfx950.sh",
      },
    ],
    nonClaims: [
      "No production serving scheduler or persistent expert-parallel runtime is claimed.",
      "The top-2 source-model proof does not establish compiled Rust or machine semantics.",
      "Historical grouped-expert qualification does not transfer to the current production transaction.",
      "The gfx950 advanced MoE lessons are bounded teaching kernels, not a complete model MoE stack.",
    ],
  },
  {
    id: "kda-gdn",
    title: "Kimi Delta Attention Decode/Prefill",
    family: "attention",
    lessonIds: ["gfx950-kda-gdn-linear-attention"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Maintain the FP32 matrix-state Kimi Delta Attention recurrence, apply decayed state updates, project the scaled query output, and batch prefill through two ordered WY/UT chunks.",
    implementedShape:
      "One head with K=16, V=16, FP32 16x16 matrix state, decode T=1, and prefill T=8 as two ordered C=4 WY/UT chunks.",
    run: {
      label: "Run the gfx950 KDA decode kernel",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
      status:
        "MI350X-observed production Rust matrix-state decode and chunkwise prefill teaching kernels; prefill has its own runner.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
      mismatchBehavior:
        "A bounded KDA decode or chunkwise-prefill state/output mismatch against the safe CPU reference fails the MI350X runner; the matrix recurrence is not yet a compile-time refinement receipt.",
      supportedSubset:
        "Safe CPU reference/oracle for one bounded matrix-state KDA teaching shape, recurrent state, WY/UT chunk transform, finite gates, and replicated outputs.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_attention/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_attention/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
        "examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
        "examples/gfx950_advanced_attention/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_attention/src/lib.rs",
        "examples/gfx950_advanced_attention/tests/kernel_source.rs",
        "examples/gfx950_advanced_attention/tests/reference.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    variants: [
      {
        label: "KDA chunkwise prefill",
        lessonId: "gfx950-kda-gdn-linear-attention",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Eight-token prefill with carried 16x16 recurrent state and two ordered C=4 WY/UT chunks.",
        commandOrStatus:
          "bash examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
      },
    ],
    nonClaims: [
      "No full Kimi K3 layer, all-head serving backend, or cache-management path is claimed.",
      "The source does not claim arbitrary channel counts, arbitrary sequence partitioning, or a formal recurrence proof.",
      "No performance result or protected publication authority is claimed.",
    ],
  },
  {
    id: "sparse-attention",
    title: "Sparse Attention",
    family: "attention",
    lessonIds: [
      "gfx950-indexed-sparse-attention",
      "gfx950-deepseek-sparse-attention",
    ],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Select bounded key/value rows, reject invalid sparse domains, evaluate only the selected rows, and expose stable softmax output/state against a CPU oracle.",
    implementedShape:
      "Content sparse attention uses 16 tokens, head dimension 128, 16 value channels, top two four-token blocks, then top three tokens. DeepSeek sparse attention consumes four caller-provided top-k slots over 16 KV rows.",
    run: {
      label: "Run the gfx950 DeepSeek sparse-attention slice",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
      status:
        "MI350X-observed content-indexed and DeepSeek sparse-attention teaching kernels with CPU-reference output/state checks.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
      mismatchBehavior:
        "A bounded sparse-attention selected-ID, output, maximum, normalizer, or invalid-domain mismatch against the safe CPU reference fails the MI350X runner; learned indexer behavior is not a compile-time claim.",
      supportedSubset:
        "Safe CPU reference/oracle for fixed selected-token domains, stable selected softmax, invalid sentinels, duplicate rejection, and selected-only value accumulation.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_attention/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_attention/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh",
        "examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
        "examples/gfx950_advanced_attention/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_attention/src/lib.rs",
        "examples/gfx950_advanced_attention/tests/kernel_source.rs",
        "examples/gfx950_advanced_attention/tests/reference.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    variants: [
      {
        label: "content indexed sparse attention",
        lessonId: "gfx950-indexed-sparse-attention",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Top-two block selection followed by top-three token selection for one fixed 16-token attention tile.",
        commandOrStatus:
          "bash examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh",
      },
      {
        label: "DeepSeek sparse attention",
        lessonId: "gfx950-deepseek-sparse-attention",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Four scalar top-k index slots drive selected-only QK, stable softmax, and selected-PV output/state.",
        commandOrStatus:
          "bash examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
      },
    ],
    nonClaims: [
      "The Lightning Indexer or content scorer is a caller/input contract, not a learned component proved by these kernels.",
      "No arbitrary sparse policy, dynamic sequence length, full DeepSeek serving path, or model-quality claim is made.",
      "No formal source-to-machine proof, protected publication authority, or performance result is claimed.",
    ],
  },
  {
    id: "compressed-hybrid-attention",
    title: "Compressed Hybrid Attention",
    family: "attention",
    lessonIds: ["gfx950-compressed-hybrid-attention"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Fuse a bounded compressed-state branch with a bounded direct-attention branch under an explicit fixed coefficient rule.",
    implementedShape:
      "16 tokens, head dimension 128, 16 value channels, three compressed four-token blocks, and tokens 12-15 as the local direct window.",
    run: {
      label: "Run compressed hybrid attention",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
      status:
        "MI350X-observed fixed hybrid-attention teaching kernel with CPU-reference branch/fusion checks.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
      mismatchBehavior:
        "A bounded compressed-branch, direct-branch, fusion-order, or output mismatch against the safe CPU reference fails the MI350X runner; end-to-end hybrid-model equivalence is not a compile-time claim.",
      supportedSubset:
        "Safe CPU reference/oracle for fixed compressed/direct domains, branch coefficients, FP32 accumulation, and final output ownership.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_attention/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_attention/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
        "examples/gfx950_advanced_attention/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_attention/src/lib.rs",
        "examples/gfx950_advanced_attention/tests/kernel_source.rs",
        "examples/gfx950_advanced_attention/tests/reference.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    nonClaims: [
      "No generalized compressed-attention backend or dynamic branch policy is claimed.",
      "No full model equivalence, protected publication authority, or performance result is claimed.",
    ],
  },
  {
    id: "residual-mixing",
    title: "AttnRes, GR, and mHC Mixing",
    family: "attention",
    lessonIds: ["gfx950-attnres-gr-mhc"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Apply bounded residual-stream aggregation, four-branch gating, and mHC Sinkhorn mixing as separate explicit tensor transforms.",
    implementedShape:
      "16 channels across four AttnRes depths, four gated residual branches, and four mHC streams with three Sinkhorn iterations.",
    run: {
      label: "Run mHC Sinkhorn mix",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
      status:
        "MI350X-observed residual-mixing teaching kernels with separate CPU references for AttnRes, GR, and mHC.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
      mismatchBehavior:
        "A bounded AttnRes, gated-residual, mHC/Sinkhorn, aliasing, or output mismatch against the safe CPU reference fails the MI350X runner; full residual-stream optimization is not a compile-time claim.",
      supportedSubset:
        "Safe CPU reference/oracle for fixed stream coefficients, elementwise gates, Sinkhorn iterations, alias-safe reads, and final stores.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_attention/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_attention/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh",
        "examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh",
        "examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
        "examples/gfx950_advanced_attention/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_attention/src/lib.rs",
        "examples/gfx950_advanced_attention/src/ablation.rs",
        "examples/gfx950_advanced_attention/tests/kernel_source.rs",
        "examples/gfx950_advanced_attention/tests/reference.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    variants: [
      {
        label: "AttnRes aggregate",
        lessonId: "gfx950-attnres-gr-mhc",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Four-depth residual aggregation with exact output coefficients.",
        commandOrStatus:
          "bash examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh",
      },
      {
        label: "four-branch residual",
        lessonId: "gfx950-attnres-gr-mhc",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Four gated residual branches over one fixed 16-channel vector.",
        commandOrStatus:
          "bash examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh",
      },
    ],
    nonClaims: [
      "No general residual-stream optimizer, in-place aliasing proof, or model integration is claimed.",
      "No protected publication authority or performance result is claimed.",
    ],
  },
  {
    id: "speculative-mtp",
    title: "Speculative and MTP Verification",
    family: "model-kernel",
    lessonIds: ["gfx950-speculative-mtp-verification"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Verify one fixed-width candidate block, compute the accepted prefix, and commit state only through the declared deterministic policy.",
    implementedShape:
      "Eight candidates, four draft steps, eight state elements, exact accepted-step metadata, and rollback lanes that preserve the base state.",
    run: {
      label: "Run speculative transaction",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
      status:
        "MI350X-observed decode-verification teaching kernel with CPU-reference prefix and rollback checks.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
      mismatchBehavior:
        "A bounded accepted-prefix, commit flag, rollback, or output-state mismatch against the safe CPU reference fails the MI350X runner; serving-scheduler behavior is not a compile-time claim.",
      supportedSubset:
        "Safe CPU reference/oracle for fixed candidate count, deterministic acceptance predicate, first-rejection rule, metadata, and state update.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_systems/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_systems/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
        "examples/gfx950_advanced_systems/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_systems/src/lib.rs",
        "examples/gfx950_advanced_systems/tests/source.rs",
        "examples/gfx950_advanced_systems/tests/references.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    nonClaims: [
      "No production serving scheduler, sampler, model-quality result, or full decoder is claimed.",
      "No arbitrary token policy, protected publication authority, or performance result is claimed.",
    ],
  },
  {
    id: "ngram-gather",
    title: "N-gram Hash-Table Gather",
    family: "model-kernel",
    lessonIds: ["gfx950-ngram-embedding-gather"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Resolve fixed-order N-gram identifiers through a bounded priority table and return one deterministic integer table value per query.",
    implementedShape:
      "Eight queries, three tokens per N-gram, 16 table slots, exact hit/miss outputs, and deterministic duplicate-key tie behavior.",
    run: {
      label: "Run N-gram gather",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
      status:
        "MI350X-observed integer gather teaching kernel with exact CPU-reference comparison.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
      mismatchBehavior:
        "A bounded hash-collision, lookup-miss, priority-tie, or integer-output mismatch against the safe CPU reference fails the MI350X runner; embedding-vector semantics are not a compile-time claim.",
      supportedSubset:
        "Safe CPU reference/oracle for fixed N-gram width, bounded table slots, exact-key matching, miss values, and priority ties.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_systems/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_systems/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
        "examples/gfx950_advanced_systems/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_systems/src/lib.rs",
        "examples/gfx950_advanced_systems/tests/source.rs",
        "examples/gfx950_advanced_systems/tests/references.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    nonClaims: [
      "The current output is an integer table value, not a vector embedding lookup.",
      "No arbitrary table size, learned cache policy, protected publication authority, or performance result is claimed.",
    ],
  },
  {
    id: "muon-update",
    title: "Muon Polar Update",
    family: "model-kernel",
    lessonIds: ["gfx950-muon-optimizer"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Stage two gradient shards, reduce them in rank order, normalize one 4x4 matrix, run five polar iterations, and emit a scaled update.",
    implementedShape:
      "Two host-staged shards reduced into one 4x4 FP32 matrix, five fixed polar iterations, learning-rate scale 0.05, and exact reduced-norm reporting.",
    run: {
      label: "Run Muon update",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_systems/run-muon-update-gfx950.sh",
      status:
        "MI350X-observed optimizer-step teaching kernels with shard staging and CPU-reference update/norm checks.",
    },
    functionalGate: runtimeCpuOracleGate({
      command:
        "bash examples/gfx950_advanced_systems/run-muon-update-gfx950.sh",
      mismatchBehavior:
        "A bounded shard-staging, rank-order reduction, norm, iteration, or update mismatch against the safe CPU reference fails the MI350X runner; convergence and training quality are not compile-time claims.",
      supportedSubset:
        "Safe CPU reference/oracle for fixed 4x4 FP32 matrix normalization, five polar iterations, shard order, output update, and norm reporting.",
    }),
    paths: {
      source: ["examples/gfx950_advanced_systems/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_systems/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh",
        "examples/gfx950_advanced_systems/run-muon-update-gfx950.sh",
        "examples/gfx950_advanced_systems/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_systems/src/lib.rs",
        "examples/gfx950_advanced_systems/tests/source.rs",
        "examples/gfx950_advanced_systems/tests/references.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    variants: [
      {
        label: "gradient shard staging",
        lessonId: "gfx950-muon-optimizer",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Two shard launches stage 32 FP32 elements exactly before the update step.",
        commandOrStatus:
          "bash examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh",
      },
    ],
    nonClaims: [
      "No training convergence, model-quality result, or general optimizer library is claimed.",
      "No distributed optimizer runtime, protected publication authority, or performance result is claimed.",
    ],
  },
  {
    id: "gpt-oss-layer-tile",
    title: "GPT-OSS-120B Layer-Tile Megakernel",
    family: "model-kernel",
    lessonIds: ["gfx950-gpt-oss-120b-megakernel"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Fuse one batch-1 layer tile containing stable top-4 routing, one sink-softmax grouped-query attention tile, and one dynamically selected MXFP4 expert projection into a single Wave64 dispatch.",
    implementedShape:
      "One fixed Wave64 layer tile: 128 router logits, top-4 packed IDs, 256 attention outputs, 256 expert outputs, four BF16 MFMA instructions, four FP4 f8f6f4 MFMA instructions, kernarg=208 bytes, and static LDS=0.",
    run: {
      label: "Run the promoted gfx950 megakernel compatibility wrapper",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command: "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
      status:
        "Final promoted-source compatibility passed as one case in the 32/32 MI350X matrix; separate c138 performance archive measured this fused artifact slower than the HIP three-dispatch comparator.",
    },
    functionalGate: runtimeCpuOracleGate({
      command: "bash examples/gfx950_gpt_oss_decode/run-gfx950.sh",
      mismatchBehavior:
        "A bounded layer-tile output, router, attention, or expert mismatch against the independent safe CPU reference fails the compatibility runner; whole-layer and whole-model equivalence are not compile-time claims.",
      supportedSubset:
        "Safe CPU reference/oracle for one fixed Wave64 GPT-OSS-style layer tile with router logits, sink-softmax attention tile, selected MXFP4 expert projection, and packed outputs.",
    }),
    paths: {
      source: [
        "examples/gfx950_gpt_oss_decode/src/kernel.rs",
        "examples/gfx950_gpt_oss_decode/src/kernel_router_serial.rs",
        "examples/gfx950_gpt_oss_decode/src/kernel_components.rs",
      ],
      reference: ["examples/gfx950_gpt_oss_decode/src/reference.rs"],
      runner: [
        "examples/gfx950_gpt_oss_decode/run-gfx950.sh",
        "examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh",
        "perf-evidence/run-gpt-oss-performance.sh",
      ],
      evidence: [
        "examples/gfx950_gpt_oss_decode/README.md",
        "examples/gfx950_gpt_oss_decode/gpt_oss_unfused.hip",
        "examples/gfx950_gpt_oss_decode/ablation-variants-v1.json",
        "perf-evidence/gpt-oss-layer-tile-evidence-v1.json",
        "perf-evidence/gfx950-integrated-compatibility-v1.json",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    nonClaims: [
      "No complete GPT-OSS layer, whole-model decode, fastest result, or state-of-the-art claim is made.",
      "The final compatibility record and historical performance archive are separate evidence campaigns.",
      "No formal source-to-machine proof or whole-model equivalence is claimed.",
      "The fused tile was measured slower than the archived HIP three-dispatch comparator.",
    ],
  },
] as const satisfies readonly OperatorCookbookRecord[];

export const operatorCookbookEntries = deepFreeze(entries);

export const operatorCategories = deepFreeze({
  starter: "First kernels",
  reduction: "Reductions",
  attention: "Attention",
  matrix: "Matrix kernels",
  moe: "Mixture-of-experts",
  "model-kernel": "Model-facing slices",
} satisfies Record<OperatorCookbookFamily, string>);

function primaryLessonId(entry: OperatorCookbookRecord): string {
  const [lessonId] = entry.lessonIds;
  if (lessonId === undefined) {
    throw new Error(`Operator cookbook entry ${entry.id} has no lesson`);
  }
  return lessonId;
}

function flattenEntry(entry: OperatorCookbookRecord): OperatorCookbookEntry {
  return {
    ...entry,
    category: entry.family,
    status: entry.evidenceKind,
    lessonId: primaryLessonId(entry),
    computes: entry.computeContract,
    runner: entry.run.command ?? entry.run.status,
    expected: entry.run.status,
    sourcePaths: entry.paths.source,
    referencePaths: entry.paths.reference,
  };
}

export const operatorCookbook = deepFreeze(entries.map(flattenEntry));

export const operatorCookbookById = deepFreeze(
  Object.fromEntries(operatorCookbook.map((entry) => [entry.id, entry])),
) as DeepReadonly<Record<OperatorCookbookId, OperatorCookbookEntry>>;

export function isOperatorCookbookId(id: string): id is OperatorCookbookId {
  return hasOwn(operatorCookbookById, id);
}

export function operatorCookbookEntry(
  id: OperatorCookbookId,
): DeepReadonly<OperatorCookbookEntry> {
  return operatorCookbookById[id];
}
