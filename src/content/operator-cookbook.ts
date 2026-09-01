import type { EvidenceKind } from "./model";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export type OperatorCookbookId =
  | "fill"
  | "vecadd"
  | "row-softmax"
  | "flash-attention"
  | "gemm"
  | "moe"
  | "kda-gdn"
  | "kimi-k3-kda"
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
    title: "KDA/GDN Linear Attention",
    family: "attention",
    lessonIds: ["gfx950-kda-gdn-linear-attention"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Maintain a recurrent linear-attention state, apply gated decay, produce a normalized output, and preserve token order for decode and prefill paths.",
    implementedShape:
      "gfx950 teaching shape: 16 channels, three-tap decode, and eight-token prefill processed as two ordered four-token chunks.",
    run: {
      label: "Run the gfx950 KDA/GDN decode kernel",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
      status:
        "MI350X-observed production Rust decode and prefill teaching kernels; prefill has its own runner.",
    },
    paths: {
      source: ["examples/gfx950_advanced_attention/src/kernel.rs"],
      reference: ["examples/gfx950_advanced_attention/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
        "examples/gfx950_advanced_attention/run-kda-prefill-gfx950.sh",
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
        label: "KDA/GDN prefill",
        lessonId: "gfx950-kda-gdn-linear-attention",
        evidenceKind: "gpu-observed",
        implementedShape:
          "Eight-token prefill with carried recurrent state and two ordered four-token chunks.",
        commandOrStatus:
          "bash examples/gfx950_advanced_attention/run-kda-prefill-gfx950.sh",
      },
    ],
    nonClaims: [
      "No full model layer or serving backend is claimed.",
      "The source does not claim arbitrary channel counts, arbitrary sequence partitioning, or a formal recurrence proof.",
      "No performance result or protected publication authority is claimed.",
    ],
  },
  {
    id: "kimi-k3-kda",
    title: "Kimi K3 KDA Decode Core",
    family: "model-kernel",
    lessonIds: ["gfx950-kimi-k3-kda-decode"],
    evidenceKind: "gpu-observed",
    learningLevel: "advanced-kernel",
    computeContract:
      "Perform one fused-recurrent Kimi Delta Attention decode step: q/k L2 normalization, beta sigmoid, safe-gate decay, V-first recurrent-state correction, updated state, and scaled-q output accumulation.",
    implementedShape:
      "Single-head f32 Kimi K3-shaped core with K=128, V=128, lower_bound=-5, 128 output values split into two 64-value tiles, and first-row state tile publication. Model constants record 96 KDA heads, 69 KDA layers, 24 gated-MLA layers, four-token short convolution, and 1,048,576-token context, but those are outside the implemented slice.",
    run: {
      label: "Run the MI350X Kimi K3 KDA decode-core slice",
      evidenceKind: "gpu-observed",
      target: gfx950,
      command:
        "bash examples/gfx950_advanced_attention/run-kimi-k3-kda-decode-gfx950.sh",
      status:
        "Observed on mi350 / smci350-rck-g03-b19-03 at commit a89e593e11e70f5d7604c08b94ef3fd153ede556.",
    },
    paths: {
      source: [
        "examples/gfx950_advanced_attention/src/kernel.rs",
        "examples/gfx950_advanced_attention/src/lib.rs",
      ],
      reference: ["examples/gfx950_advanced_attention/src/reference.rs"],
      runner: [
        "examples/gfx950_advanced_attention/run-kimi-k3-kda-decode-gfx950.sh",
        "examples/gfx950_advanced_attention/run-gfx950.sh",
      ],
      evidence: [
        "examples/gfx950_advanced_attention/tests/kernel_source.rs",
        "examples/gfx950_advanced_attention/tests/reference.rs",
        "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs",
      ],
    },
    nonClaims: [
      "No chunk_kda prefill implementation is claimed for Kimi K3.",
      "No 96-head batching, BF16/MX formats, convolution fusion, RMS output gating, or KDA-aware cache plumbing is claimed.",
      "No full Kimi K3 serving path, full-model equivalence, performance result, formal source-to-machine proof, or protected publication authority is claimed.",
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
