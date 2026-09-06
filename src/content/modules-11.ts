import lowPrecisionSource from "../../examples/gfx950_low_precision/src/kernel.rs?raw";
import attentionSource from "../../examples/gfx950_advanced_attention/src/kernel.rs?raw";
import systemsSource from "../../examples/gfx950_advanced_systems/src/kernel.rs?raw";
import gptOssSource from "../../examples/gfx950_gpt_oss_decode/src/kernel.rs?raw";
import { narrativeSection } from "./narrative-registry";
import { historicalReference, type CurriculumModule, type DiagramKind, type Lesson } from "./model";
import type { NarrativeId } from "./narrative-policy";

const sourceCommit = "3d10825df93a86644cc5a5b006cadd45f71afb91";
const sourceTree = "84cdb971391617f1809cee08b706ba56dad40fd4";
const target = "gfx950:xnack- on AMD Instinct MI350X";

const sources = {
  lowp: {
    text: lowPrecisionSource,
    path: "examples/gfx950_low_precision/src/kernel.rs",
    sha256: "feebb7e80801c6b5323d19bcdb7908b93a5159c26fe2aa8181fb2de623bf6a5d",
    command: "bash perf-evidence/run-gfx950-lowp-performance.sh",
    evidence: "perf-evidence/gfx950-lowp-performance-v1.json",
  },
  attention: {
    text: attentionSource,
    path: "examples/gfx950_advanced_attention/src/kernel.rs",
    sha256: "b37d2717079a596f0efac2de38bf670e96364f931b01622fc59b5e2506f11240",
    command: "bash examples/gfx950_advanced_attention/run-performance-audit-gfx950.sh",
    evidence: "examples/gfx950_advanced_attention/performance-audit-mi350-gpu4-v1.json",
  },
  systems: {
    text: systemsSource,
    path: "examples/gfx950_advanced_systems/src/kernel.rs",
    sha256: "0211e451f562b961eea723fd4d5a6c5b188cfaab83ae2354ff8bcf36dd5056d6",
    command: "bash examples/gfx950_advanced_systems/run-ablation-gfx950.sh",
    evidence: "examples/gfx950_advanced_systems/sota-performance-audit-v1.json",
  },
  gpt: {
    text: gptOssSource,
    path: "examples/gfx950_gpt_oss_decode/src/kernel.rs",
    sha256: "e731c38f983434aace7b4a89c17e176a058dab8eea9f05e7223e4cb097997423",
    command: "bash perf-evidence/run-gpt-oss-performance.sh",
    evidence: "examples/gfx950_advanced_systems/sota-performance-audit-v1.json",
  },
} as const;

const excerptSha256BySymbol: Record<string, string> = {
  gfx950_fp4_gemm_rust:
    "ac5be683ac389935a0e71508b41462d66f51b384d5accb26f00a698c184afd17",
  gfx950_fp8_gemm_rust:
    "0fb92d0182ef585cf4f3ff0327069b825e909a00f5c006cabb59f631ff9e9cf9",
  gfx950_fp4_attention_rust:
    "8ec06528968a2357e0aa9c597cde4e926fea7a0d9c0e04a47d0b81ef2eacef89",
  gfx950_fp8_attention_rust:
    "0a06ba5894d9afa1504dd036f9a0c8a4b3deb242156f37d5930f047d5ec1d5f1",
  gfx950_kda_decode:
    "d345800b6cd83b88452a85f4b99cfbb8f0a2093e05542ad6c3a3add2dcf7cb04",
  gfx950_kda_chunkwise_prefill:
    "6eb55c61d75d233f08d31f766ede17b1fe45c5a7116893bbe33050124dcedc4c",
  gfx950_content_sparse_attention:
    "8af6b4374d55d1cda9a8c5b8488df3b29dd280690fcf5f643d0d3a7776fd21bd",
  gfx950_deepseek_sparse_attention:
    "6af51078d2c1b7bcf8949937dc843c0eeba408dff16ad7c552ec89bf8917845f",
  gfx950_compressed_hybrid_attention:
    "f1d09336b950f0a71e8fc81beeff438ce19ba045c46d6865db833175fba0b1e1",
  gfx950_attnres_aggregate:
    "af9ec1ae0600335d6f7ba05fb87dd022ed319b7cf42872cab631a418c1bbf2df",
  gfx950_four_branch_residual:
    "75e9278e39c6356069391b266fefa82086c37f43c90539dbd01ee398c345543d",
  gfx950_mhc_sinkhorn_mix:
    "55b47101b8965c4516713f5953152a6b51c14a218bb5fc022611b9d76ea4620c",
  gfx950_moe_route_fp4_t16_e4_k2_v1:
    "cce2f0b75d205c2a11e199e813dda79521cd9000ec5d589de7dae045c7e42ca2",
  gfx950_moe_expert_rank_fp4_fp8_v1:
    "14021f7543d77ecf1d5aaba727d996a8553c8ea0bc034145862757db68f84e89",
  gfx950_combine_expert_ranks_v1:
    "11cdfd804fea2b5f981f3b8b35826730df57bf89e1166cfba0133195dd6811f8",
  gfx950_speculative_transaction_v1:
    "2730064fc70eca25fc1f18933ac2d71899f48a4467338a49cd9800e9fa2a5fcd",
  gfx950_qwen_ngram_gather_v1:
    "ec93dc1a8b806b1c777a846517b42319b5dcfb5cc86d1fff4dda1b87d7d91b9c",
  gfx950_stage_gradient_shard_v1:
    "b94ce8b5548c59ee9a661e6e36184e0b8049f0635581d5c8753265defa8b90c9",
  gfx950_muon_update_4x4_v1:
    "9a692941b8c346bf79b88287202cd9ee7803be9ac45218c083427df396b8938b",
  gfx950_gpt_oss_120b_decode_megakernel_v1:
    "fdc428f33edbcebe6ca7764c537db58e68009115d740fc21a8252253db8d4081",
};

type SourceKey = keyof typeof sources;

interface PerformanceSpec {
  id: string;
  title: string;
  source: SourceKey;
  symbol: string;
  shape: string;
  precision: string;
  measured: string;
  optimization: string;
  ablation: string;
  pipeline: string;
  bound: string;
  comparator: string;
  comparatorUrl: string;
  verdict: string;
  modelTarget: string;
  modelSource: string;
  modelImpact: string;
  narratives: [NarrativeId, NarrativeId];
  diagram: DiagramKind;
}

function functionExcerpt(source: string, symbol: string): string {
  const position = source.indexOf(`pub fn ${symbol}(`);
  const attribute = source.lastIndexOf("#[kernel(", position);
  const doc = source.lastIndexOf("///", position);
  const start = Math.max(attribute, doc, 0);
  const open = source.indexOf("{", position);
  if (position < 0 || open < 0) throw new Error(`Missing Rust kernel ${symbol}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unclosed Rust kernel ${symbol}`);
}

function performanceText(spec: PerformanceSpec): string {
  return [
    "MEASURED TEACHING CONTRACT",
    `Shape: ${spec.shape}`,
    `Precision: ${spec.precision}`,
    `Result: ${spec.measured}`,
    "",
    "ABLATION",
    `Retained optimization: ${spec.optimization}`,
    `Measured contribution: ${spec.ablation}`,
    `Software pipeline / multibuffer / tile study: ${spec.pipeline}`,
    "",
    "THEORETICAL FLOOR",
    spec.bound,
    "The floor is max(compulsory bytes / 8 TB/s, FP32 work / 144.2 TFLOP/s, admitted low-precision work / the relevant MI350X peak). It excludes launch latency, dependencies, cache-line amplification, scalar or transcendental work, and occupancy loss, so it is not an attainable promise for a tiny tile.",
    "",
    "BEST-KNOWN PUBLIC CANDIDATE",
    `${spec.comparator}: ${spec.comparatorUrl}`,
    `Fair-comparison verdict: ${spec.verdict}`,
    "",
    "MODEL-DERIVED TARGET",
    spec.modelTarget,
    `Pinned model source: ${spec.modelSource}`,
    `Model impact: ${spec.modelImpact}`,
    "A model-level speedup is not inferred from a teaching tile. For an exact production replacement with operator fraction f and measured operator speedup s, the upper-bound model speedup is 1 / ((1 - f) + f / s); f must come from an end-to-end profile of the named model.",
  ].join("\n");
}

function lesson(spec: PerformanceSpec, order: number): Lesson {
  const source = sources[spec.source];
  const excerpt = functionExcerpt(source.text, spec.symbol);
  const excerptSha256 = excerptSha256BySymbol[spec.symbol];
  if (excerptSha256 === undefined) {
    throw new Error(`Missing excerpt digest for ${spec.symbol}`);
  }
  return {
    id: spec.id,
    module: 11,
    order,
    title: spec.title,
    summary: `Measured MI350X optimization lab for ${spec.symbol}, including comparator eligibility, ablations, an architecture floor, and a model-derived production target.`,
    duration: "35 min",
    prerequisites: ["gfx950 advanced operator kernels", "ROCr dispatch timestamps", "Independent CPU numerical oracle"],
    objectives: [
      "Reproduce the exact teaching-shape measurement and attribute only stable, correctness-preserving optimization gains.",
      "Audit whether the public candidate is semantically eligible before making a performance claim.",
      "Translate the teaching result into a model-derived production benchmark without claiming unmeasured model throughput.",
    ],
    claims: [
      {
        kind: "gpu-observed",
        label: `MI350X performance audit: ${spec.symbol}`,
        detail: `${spec.measured} ${spec.verdict} The archived campaign includes numerical-oracle and canary checks; it is not a whole-model result.`,
        reference: historicalReference(
          sourceCommit,
          sourceTree,
          [source.command],
          [source.path, source.evidence],
          {
            target,
            note: "Archived MI350X performance evidence; scope is the exact teaching contract and excludes unmatched external or whole-model claims.",
          },
        ),
      },
    ],
    sections: [narrativeSection(spec.narratives[0]), narrativeSection(spec.narratives[1])],
    tabs: [
      {
        kind: "kernel",
        label: "fe2o3 Rust kernel",
        language: "rust",
        code: excerpt,
        sourcePath: source.path,
        sourceCommit,
        sourceSha256: excerptSha256,
        sourceDigestScope: "displayed",
        sourceFragments: [excerpt],
        explanatory: false,
        notice: "The displayed function is extracted from the exact pinned file; the digest covers this displayed excerpt.",
      },
      {
        kind: "verus",
        label: "Correctness boundary",
        language: "text",
        code: "The timed artifact must first pass its independent CPU oracle, immutable-input checks, output canaries, and source-to-gfx950 artifact checks. This campaign does not claim a formal source-to-machine refinement theorem.",
        explanatory: true,
      },
      {
        kind: "host",
        label: "Reproduce on MI350X",
        language: "bash",
        code: `git checkout ${sourceCommit}\nexport ROCR_VISIBLE_DEVICES=<physical-gpu>\n${source.command}`,
        explanatory: true,
      },
      {
        kind: "result",
        label: "Observed result",
        language: "text",
        code: `${spec.measured}\n\nEvidence: ${source.evidence}\nTarget: ${target}\n\n${spec.verdict}`,
        explanatory: true,
      },
      {
        kind: "performance",
        label: "Ablation and model target",
        language: "text",
        code: performanceText(spec),
        explanatory: true,
      },
    ],
    diagram: spec.diagram,
    exercises: [
      {
        prompt: "Make the public candidate eligible for a direct comparison.",
        hint: "Match shape, precision, layout, fused semantics, cache regime, correctness policy, and timer before comparing medians.",
        acceptance: "The report either presents a matched confidence interval or records the exact exclusion reason and makes no fastest claim.",
      },
    ],
    glossary: ["gfx950", "tile", "MFMA"],
  };
}

const kimi = "Kimi-K3 revision f831ab66814297da540d832a5235f8e904f29d06: https://huggingface.co/moonshotai/Kimi-K3/blob/f831ab66814297da540d832a5235f8e904f29d06/config.json";
const deepseek = "DeepSeek-V4-Pro-0813 revision 72e1d3230f6c080a530b0a1d46f8eb4602340597: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/blob/72e1d3230f6c080a530b0a1d46f8eb4602340597/config.json";
const glm = "GLM-5.3 revision aca966e4e02791568aa6a4ced368624b3d897f42: https://huggingface.co/zai-org/GLM-5.3/blob/aca966e4e02791568aa6a4ced368624b3d897f42/config.json";
const gpt = "GPT-OSS official repository revision 7b583341fe16729127f6d5b94a7b09ccae97e1a1: https://github.com/openai/gpt-oss/tree/7b583341fe16729127f6d5b94a7b09ccae97e1a1";
const aiter = "https://github.com/ROCm/aiter/tree/ad70d0880f3ec7d84f0ca4aa9bdfa48ad00d3c29";
const fla = "https://github.com/fla-org/flash-linear-attention/tree/64efbae863fdaf76fa5359e517b31cf1d72525a1";
const vllm = "https://github.com/vllm-project/vllm/tree/96242aa50d196993735854f03bd717496e88b7c3";

const specs: PerformanceSpec[] = [
  {
    id: "gfx950-fp4-gemm-performance-lab",
    title: "FP4 GEMM performance lab",
    source: "lowp",
    symbol: "gfx950_fp4_gemm_rust",
    shape: "batch=16, M=16, N=16, K=128",
    precision: "logical-byte E2M1 x E2M1 -> FP32",
    measured: "7.400 us median, 0 error; 19.401 -> 7.400 us (2.6218x)",
    optimization: "A proof of exact row-major tile bounds removes 32 guarded fragment loads while retaining guards for tail tiles.",
    ablation: "12.001 us saved, 61.86% lower median latency.",
    pipeline: "WG256/grid4 retained. WG128 failed barrier-convergence proof, WG512 exceeds the typed limit, double buffering is inapplicable to one K=128 phase, and an 8 KiB LDS transpose regressed to 21.001 us.",
    bound: "10.24 ns optimistic HBM floor; measured/floor = 722.7x.",
    comparator: "hipBLASLt rocRoller MXFP4 and AITER/Gluon FP4 GEMM",
    comparatorUrl: aiter,
    verdict: "No exact winner: hipBLASLt accepts only batch=1 packed block-scaled MXFP4 for this shape, which differs from the fe2o3 input contract.",
    modelTarget: "Kimi-K3 routed expert projection: hidden 7168, expert intermediate 3072, latent 3584, MXFP4 weights with group size 32 and MXFP8 activations. Benchmark M from decode batch/token count rather than extrapolating this M16 tile.",
    modelSource: kimi,
    modelImpact: "The compiler optimization is demonstrated only on exact K128 teaching tiles; production Kimi GEMMs require tiled K=7168/3584 and have not been benchmarked.",
    narratives: ["gfx950-fp4-gemm/prerequisites", "gfx950-fp4-gemm/tile-accumulator"],
    diagram: "gemm",
  },
  {
    id: "gfx950-fp8-gemm-performance-lab",
    title: "FP8 GEMM performance lab",
    source: "lowp",
    symbol: "gfx950_fp8_gemm_rust",
    shape: "batch=16, M=16, N=16, K=128",
    precision: "E4M3 x E4M3 -> FP32",
    measured: "6.800 us median, 0 error; 17.320 -> 6.800 us (2.5471x)",
    optimization: "The exact-tile checked-view proof selects direct global fragment loads instead of per-element guarded loads.",
    ablation: "10.520 us saved, 60.74% lower median latency.",
    pipeline: "Four Wave64 waves per workgroup and four workgroups are retained; the pretransposed 8 KiB LDS path was exact but 3.0884x slower, and one K phase leaves no load/compute phase to double-buffer.",
    bound: "10.24 ns optimistic HBM floor; measured/floor = 664.1x.",
    comparator: "hipBLASLt exhaustive E4M3 winner, solution 458459",
    comparatorUrl: "https://github.com/ROCm/hipBLASLt",
    verdict: "Exact eligible comparator: hipBLASLt is faster at 4.72681 us; fe2o3 is 1.4386x slower, so this is explicitly not a fastest claim.",
    modelTarget: "GLM-5.3 hidden 6144 and expert intermediate 2048 with E4M3 block size 128; DeepSeek-V4-Pro hidden 7168 and expert intermediate 3072 with FP8 expert compute.",
    modelSource: `${glm}; ${deepseek}`,
    modelImpact: "No model improvement is established. The next gate is parity with hipBLASLt on model-sized M/N/K before integration into either model.",
    narratives: ["gfx950-fp8-gemm/format-layout", "gfx950-fp8-gemm/tile-accumulator"],
    diagram: "gemm",
  },
  {
    id: "gfx950-fp4-attention-performance-lab",
    title: "FP4 flash-attention performance lab",
    source: "lowp",
    symbol: "gfx950_fp4_attention_rust",
    shape: "batch=16, Q=16, K=16, D=128, Dv=16",
    precision: "logical-byte E2M1 Q/K/V with FP32 online softmax",
    measured: "37.920 us median, max error 1.1921e-7; 39.280 -> 37.920 us (1.0359x)",
    optimization: "WG256/grid4 parallel ownership and the existing gfx950 MFMA/transpose pipeline are retained.",
    ablation: "1.360 us saved, 3.46%; the exact-GEMM load proof is a control because this attention view does not satisfy it.",
    pipeline: "No new software-pipeline contribution was isolated. A future study must vary Q/K tiles and LDS stages independently at model dimensions.",
    bound: "10.752 ns optimistic HBM floor; measured/floor = 3526.7x.",
    comparator: "AITER FlashAttention v4 / SageAttention MXFP4",
    comparatorUrl: aiter,
    verdict: "Excluded: no public candidate matched the logical-byte E2M1 layout, Dv16 boundary, fusion, and HSA timestamp protocol.",
    modelTarget: "DeepSeek-V4-Pro sparse indexer attention uses FP4; production comparison must use its 64 index heads x 128 index dimension and top-k 1024 rather than this dense Q16 teaching tile.",
    modelSource: deepseek,
    modelImpact: "The 3.46% microkernel change is not transferred to DeepSeek because its operator and shape differ.",
    narratives: ["gfx950-fp4-attention/transpose-pipeline", "gfx950-fp4-attention/online-softmax"],
    diagram: "attention",
  },
  {
    id: "gfx950-fp8-attention-performance-lab",
    title: "FP8 flash-attention performance lab",
    source: "lowp",
    symbol: "gfx950_fp8_attention_rust",
    shape: "batch=16, Q=16, K=16, D=128, Dv=16",
    precision: "E4M3 Q/K/V with FP32 online softmax",
    measured: "27.240 us median, max error 5.9605e-8; 27.400 -> 27.240 us (1.0059x)",
    optimization: "Four workgroups with four Wave64 waves each retain independent batch ownership.",
    ablation: "0.160 us saved, 0.58%; too small to attribute beyond this campaign.",
    pipeline: "No isolated multibuffer or tile-size gain is claimed; those experiments require multi-block production sequence lengths.",
    bound: "10.752 ns optimistic HBM floor; measured/floor = 2533.5x.",
    comparator: "AITER FMHA v3/v4",
    comparatorUrl: aiter,
    verdict: "Excluded: current ABI, Dv16 teaching shape, layout, and timer do not match AITER's production attention contracts.",
    modelTarget: "GLM-5.3 attention has 64 heads, qk/v head dimension 256 and query LoRA rank 2048 using E4M3 block-128 quantization; DeepSeek-V4-Pro sparse output groups are 16 with head dimension 512.",
    modelSource: `${glm}; ${deepseek}`,
    modelImpact: "No production attention or model-level gain is established from the 0.58% teaching-shape movement.",
    narratives: ["gfx950-fp8-attention/transpose-pipeline", "gfx950-fp8-attention/evidence-boundary"],
    diagram: "attention",
  },
  {
    id: "gfx950-kda-decode-performance-lab",
    title: "KDA decode performance lab",
    source: "attention",
    symbol: "gfx950_kda_decode",
    shape: "FP32 B=4, H=1, T=1, K=16, V=16",
    precision: "FP32 state and output",
    measured: "6.920 us median; state error 2.9802e-8, output error 7.4506e-9",
    optimization: "Wave16 reductions parallelize both matrix-vector products across the 256-thread state tile.",
    ablation: "Sequential 7.960 -> wave-parallel 6.920 us (1.1570x), 13.57% lower latency, 95% paired-bootstrap CI [1.1552, 1.1610].",
    pipeline: "The one-step decode recurrence has no next time tile to multibuffer; state locality and production d128 tile decomposition remain open tuning dimensions.",
    bound: "1.666 ns resource floor; measured/floor = 4153.7x.",
    comparator: "FLA fused_recurrent_kda",
    comparatorUrl: fla,
    verdict: "Excluded: retained FLA campaign is B=1 with a different timing boundary; no cross-library fastest claim.",
    modelTarget: "Kimi-K3 decode: 96 KDA heads, key/value dimensions 128, convolution width 4, BF16 activations and FP32 recurrent state.",
    modelSource: kimi,
    modelImpact: "The 1.1570x operator gain is measured only at K=V=16. Kimi impact remains unmeasured until d128 and the full head batch are implemented.",
    narratives: ["gfx950-kda-gdn-linear-attention/recurrence", "gfx950-kda-gdn-linear-attention/scope-evidence"],
    diagram: "attention",
  },
  {
    id: "gfx950-kda-prefill-performance-lab",
    title: "KDA chunkwise-prefill performance lab",
    source: "attention",
    symbol: "gfx950_kda_chunkwise_prefill",
    shape: "FP32 B=4, H=1, T=8, K=16, V=16, two C=4 chunks",
    precision: "FP32 state and output",
    measured: "14.160 us median; state error 1.4901e-8, chunk error 7.4506e-9",
    optimization: "WY/UT C4 chunk algebra reuses a register-carried matrix state and wave reductions.",
    ablation: "Sequential 17.880 -> chunkwise 14.160 us (1.2626x), 20.80% lower latency, CI [1.2606, 1.2642].",
    pipeline: "Two ordered chunks expose a software-pipeline opportunity, but no asynchronous LDS multibuffer result is claimed in this artifact.",
    bound: "3.088 ns resource floor; measured/floor = 4585.5x.",
    comparator: "FLA chunk_kda and recurrent KDA",
    comparatorUrl: fla,
    verdict: "Excluded: batching and timer granularity differ from the public candidate.",
    modelTarget: "Kimi-K3 prefill: 96 KDA heads with K=V=128, convolution width 4, BF16 activations and FP32 state; sweep chunk lengths used by serving rather than fixing C4.",
    modelSource: kimi,
    modelImpact: "The measured 1.2626x teaching-kernel gain is a hypothesis for production KDA, not a Kimi-K3 throughput result.",
    narratives: ["gfx950-kda-gdn-linear-attention/recurrence", "gfx950-kda-gdn-linear-attention/scope-evidence"],
    diagram: "attention",
  },
  {
    id: "gfx950-content-sparse-performance-lab",
    title: "Content-sparse attention performance lab",
    source: "attention",
    symbol: "gfx950_content_sparse_attention",
    shape: "E4M3 B=16, T=16, K=128, V=16, top-2 blocks and top-3 tokens",
    precision: "E4M3 inputs, FP32 selection and softmax",
    measured: "30.080 us median, output error 5.8208e-11, selected IDs exact",
    optimization: "Fused hierarchical selection, selected-only softmax, and PV avoid a materialized dense score matrix.",
    ablation: "Reciprocal alternative measured 29.920 us but changed sign versus the earlier campaign; no promotion or stable contribution.",
    pipeline: "Tile selection is fixed; multi-stage LDS prefetch is unmeasured and should be tested only after expanding the token domain.",
    bound: "8.984 ns resource floor; fastest measured/floor = 3330.4x.",
    comparator: "FlashAttention / CK dense or block-sparse attention",
    comparatorUrl: aiter,
    verdict: "Excluded: public candidates do not fuse the same block selection, top-3 selection, gated softmax, and PV contract.",
    modelTarget: "GLM-5.3 DSA target: 32 index heads x 128 index dimension, top-k 2048, 64 attention heads and qk/v dimension 256.",
    modelSource: glm,
    modelImpact: "No GLM-5.3 gain is claimed; its top-k/domain must replace the synthetic top-3 teaching selection first.",
    narratives: ["gfx950-indexed-sparse-attention/index-contract", "gfx950-indexed-sparse-attention/scope-evidence"],
    diagram: "attention",
  },
  {
    id: "gfx950-deepseek-sparse-performance-lab",
    title: "DeepSeek sparse-attention performance lab",
    source: "attention",
    symbol: "gfx950_deepseek_sparse_attention",
    shape: "FP32 B=64, T=16, top-k=4, K=128, V=16",
    precision: "FP32 selected QK, softmax, and PV",
    measured: "13.480 us median; output error 5.2154e-8 and normalizer error 4.7684e-7",
    optimization: "Lane-parallel exponentiation keeps selected-row work distributed across Wave16 lanes.",
    ablation: "Leader-exp broadcast was 13.400 us forward and tied at 13.080 us in reverse order; rejected as order-sensitive.",
    pipeline: "Selected K/V tiles are too small for a demonstrated multibuffer benefit; top-k and dimension tuning remain production work.",
    bound: "24.064 ns resource floor; fastest measured/floor = 540.2x.",
    comparator: "AITER FlashAttention v4 / DeepSeek sparse-attention implementations",
    comparatorUrl: aiter,
    verdict: "Excluded: tutorial top-4 over 16 rows does not reproduce the production index domain or scheduler.",
    modelTarget: "DeepSeek-V4-Pro: 64 index heads x 128 dimensions, top-k 1024, attention head dimension 512, 16 output groups and FP4 indexer attention. GLM-5.3 uses 32x128 and top-k 2048.",
    modelSource: `${deepseek}; ${glm}`,
    modelImpact: "No DeepSeek or GLM latency improvement is established at the teaching top-k=4 domain.",
    narratives: ["gfx950-deepseek-sparse-attention/selected-domain", "gfx950-deepseek-sparse-attention/scope-evidence"],
    diagram: "attention",
  },
  {
    id: "gfx950-compressed-hybrid-performance-lab",
    title: "Compressed hybrid-attention performance lab",
    source: "attention",
    symbol: "gfx950_compressed_hybrid_attention",
    shape: "E4M3 B=16, T=16, K=128, V=16, three compressed blocks plus local-4",
    precision: "E4M3 inputs with FP32 dual softmax and learned gate",
    measured: "28.000 us median, max output error 5.9605e-8",
    optimization: "Fuses compressed/global and local branches with one final gate and output store.",
    ablation: "Division baseline was 27.600 us in the retained order; reciprocal candidate regressed 1.45% and was not promoted.",
    pipeline: "No stable LDS multibuffer or tile-size gain was isolated; branch overlap is a future experiment.",
    bound: "8.960 ns resource floor; fastest measured/floor = 3080.4x.",
    comparator: "FlashAttention sliding-window / block-sparse attention",
    comparatorUrl: aiter,
    verdict: "Excluded: no candidate matches two separately normalized branches plus the learned gate.",
    modelTarget: "DeepSeek-V4-Pro sparse attention exposes head dimension 512 and local window 128; use those dimensions to evaluate a hybrid branch rather than inferring from T16/local-4.",
    modelSource: deepseek,
    modelImpact: "The current ablation is a regression and therefore provides no model speedup claim.",
    narratives: ["gfx950-compressed-hybrid-attention/fusion-contract", "gfx950-compressed-hybrid-attention/scope-evidence"],
    diagram: "attention",
  },
  {
    id: "gfx950-attnres-performance-lab",
    title: "AttnRes aggregation performance lab",
    source: "attention",
    symbol: "gfx950_attnres_aggregate",
    shape: "FP32 B=64, depths=4, channels=16",
    precision: "FP32 residual streams and weights",
    measured: "5.560 us median, max output error 4.4703e-8",
    optimization: "Compact fixed-depth loop keeps four weighted residual streams in registers.",
    ablation: "Explicitly unrolled alternative measured 5.600 us; 0.7% difference is treated as a tie.",
    pipeline: "There is no reusable LDS tile at C16; production C7168 needs a vector-width and workgroup sweep.",
    bound: "4.608 ns resource floor; measured/floor = 1206.6x.",
    comparator: "Compiler-generated fused elementwise reduction",
    comparatorUrl: aiter,
    verdict: "No exact standalone public kernel with the same four-depth ABI and timer was identified.",
    modelTarget: "Kimi-K3 applies AttnRes every 12 layers across hidden size 7168; production tests must cover that channel extent and real stream count.",
    modelSource: kimi,
    modelImpact: "No Kimi-K3 improvement is inferred from the C16 tie.",
    narratives: ["gfx950-attnres-gr-mhc/mixing-contract", "gfx950-attnres-gr-mhc/scope-evidence"],
    diagram: "reduction",
  },
  {
    id: "gfx950-four-branch-residual-performance-lab",
    title: "Four-branch residual performance lab",
    source: "attention",
    symbol: "gfx950_four_branch_residual",
    shape: "FP32 B=64, branches=4, channels=16",
    precision: "FP32 branch values, gates, and output",
    measured: "5.720 us median, max output error 1.4901e-8",
    optimization: "One fused loop applies branch gates and emits one coalesced result.",
    ablation: "Explicit branch form measured 5.640 us and tied in the earlier campaign; no stable gain is assigned.",
    pipeline: "C16 has no demonstrated software-pipeline or multibuffer opportunity; model-width vectorization is unmeasured.",
    bound: "5.120 ns resource floor; fastest measured/floor = 1101.6x.",
    comparator: "Compiler-generated fused elementwise kernel",
    comparatorUrl: aiter,
    verdict: "No exact public artifact with matching branch order, inputs, and timestamp protocol.",
    modelTarget: "DeepSeek-V4-Pro mHC uses four residual streams at hidden size 7168; this generic branch primitive is only a component, not an mHC replacement.",
    modelSource: deepseek,
    modelImpact: "No model gain is reported because the measured variants are statistically unresolved and C16 is not C7168.",
    narratives: ["gfx950-attnres-gr-mhc/mixing-contract", "gfx950-attnres-gr-mhc/scope-evidence"],
    diagram: "reduction",
  },
  {
    id: "gfx950-mhc-performance-lab",
    title: "mHC Sinkhorn-mix performance lab",
    source: "attention",
    symbol: "gfx950_mhc_sinkhorn_mix",
    shape: "FP32 B=16, streams=4, channels=16, 4x4 matrix, three Sinkhorn iterations",
    precision: "FP32 normalization and stream mixing",
    measured: "6.880 us median, max output error 6.7055e-8",
    optimization: "Wave16 reductions parallelize Sinkhorn row/column normalizers and stream mixing.",
    ablation: "Scalar 9.760 -> wave-parallel 6.880 us (1.4186x), 29.51% lower latency, CI [1.4162, 1.4211].",
    pipeline: "The 4x4 matrix remains register resident; LDS multibuffering is inapplicable at this teaching size, while C7168 output tiling remains open.",
    bound: "1.152 ns resource floor; measured/floor = 5972.2x.",
    comparator: "AITER mHC benchmark/kernel family",
    comparatorUrl: aiter,
    verdict: "Excluded: no artifact matched C16, three Sinkhorn iterations, 4x4 mix ABI, and timing protocol.",
    modelTarget: "DeepSeek-V4-Pro uses four mHC streams, hidden size 7168, and 20 Sinkhorn iterations.",
    modelSource: deepseek,
    modelImpact: "The 1.4186x gain is real for the teaching operator but cannot be converted into DeepSeek-V4-Pro improvement before C7168/20 is measured.",
    narratives: ["gfx950-attnres-gr-mhc/mixing-contract", "gfx950-attnres-gr-mhc/scope-evidence"],
    diagram: "reduction",
  },
  {
    id: "gfx950-moe-route-performance-lab",
    title: "MoE routing performance lab",
    source: "systems",
    symbol: "gfx950_moe_route_fp4_t16_e4_k2_v1",
    shape: "16 batches x T16 x H128 x E4 x top-2",
    precision: "FP4 activations/weights with FP32 routing accumulation",
    measured: "17.320 us median; IDs/counts/dispatch exact and weight error 2.9802e-8",
    optimization: "Four-lane depth striping removes four-way redundant activation/router traffic; uniform broadcasts merge partial sums.",
    ablation: "Redundant-lane 21.120 -> striped 17.320 us (1.2194x), 17.99% lower latency and 3.800 us saved.",
    pipeline: "WG256/grid4 is retained. Router depth tiling is distributed rather than LDS-double-buffered at K128; production H6144/H7168 needs a tile sweep.",
    bound: "9.760 ns resource floor; measured/floor = 1774.6x.",
    comparator: "AITER fused MoE routing family",
    comparatorUrl: aiter,
    verdict: "Excluded: AITER does not expose this E4/top-2/K128/N16 routing-only contract.",
    modelTarget: "Kimi-K3 E896/top-16 plus two shared experts; DeepSeek-V4-Pro E384+1/top-6; GLM-5.3 E256+1/top-8. Hidden sizes are 7168, 7168, and 6144 respectively.",
    modelSource: `${kimi}; ${deepseek}; ${glm}`,
    modelImpact: "The 1.2194x route-only speedup is not a model result. Production routing must cover each model's expert count, top-k, and hidden width.",
    narratives: ["gfx950-advanced-moe/fixed-pipeline", "gfx950-advanced-moe/scope-evidence"],
    diagram: "moe",
  },
  {
    id: "gfx950-moe-expert-performance-lab",
    title: "Mixed FP4/FP8 expert performance lab",
    source: "systems",
    symbol: "gfx950_moe_expert_rank_fp4_fp8_v1",
    shape: "16 batches x M16 x N16 x K128, two routed plus one shared expert",
    precision: "native gfx950 mixed FP4/FP8 MFMA -> FP32",
    measured: "55.440/55.621 us canonical rank medians; max output error 9.5367e-7",
    optimization: "Eager independent MFMA scheduling is retained to expose rank-local work.",
    ablation: "Serial ranks measured 58.660/53.260 us; rank-dependent reversal makes the campaign inconclusive.",
    pipeline: "One K128 phase prevents a measured double buffer; production K dimensions require LDS stage-count and wave-tile tuning.",
    bound: "18.944 ns resource floor; measured/floor = 2926.5-2936.1x.",
    comparator: "AITER fused MoE and CK grouped low-precision GEMM",
    comparatorUrl: aiter,
    verdict: "Excluded: expert selection, activation, shape, rank boundary, and output semantics differ.",
    modelTarget: "Kimi-K3 experts use intermediate 3072 and latent 3584 with MXFP4/MXFP8; DeepSeek-V4-Pro experts use intermediate 3072; GLM-5.3 experts use intermediate 2048 with E4M3 block-128.",
    modelSource: `${kimi}; ${deepseek}; ${glm}`,
    modelImpact: "No gain is claimed from an inconclusive rank ablation or from the M16/N16/K128 proxy.",
    narratives: ["gfx950-advanced-moe/fixed-pipeline", "gfx950-advanced-moe/scope-evidence"],
    diagram: "moe",
  },
  {
    id: "gfx950-expert-combine-performance-lab",
    title: "Expert-rank combine performance lab",
    source: "systems",
    symbol: "gfx950_combine_expert_ranks_v1",
    shape: "four batches x two rank partials x 16x16",
    precision: "FP32 fixed-order addition",
    measured: "5.400 us median, all outputs exact",
    optimization: "Direct coalesced fixed-order addition with disjoint batch ownership.",
    ablation: "The transpose candidate was verifier-rejected, so it has no valid latency contribution.",
    pipeline: "There is no reuse to amortize LDS staging for two inputs; production expert-parallel collectives need a distinct communication benchmark.",
    bound: "1.536 ns resource floor; measured/floor = 3515.6x.",
    comparator: "Framework-specific fused-MoE reductions",
    comparatorUrl: aiter,
    verdict: "No exact public comparator matches this two-rank local-memory boundary.",
    modelTarget: "Evaluate post-all-to-all combine for Kimi-K3 top-16, DeepSeek-V4-Pro top-6, and GLM-5.3 top-8 at their hidden widths.",
    modelSource: `${kimi}; ${deepseek}; ${glm}`,
    modelImpact: "This local two-rank microkernel does not include communication and cannot predict model latency.",
    narratives: ["gfx950-advanced-moe/fixed-pipeline", "gfx950-advanced-moe/scope-evidence"],
    diagram: "moe",
  },
  {
    id: "gfx950-speculative-performance-lab",
    title: "Speculative transaction performance lab",
    source: "systems",
    symbol: "gfx950_speculative_transaction_v1",
    shape: "16 batches x eight candidates x four draft steps x state width eight",
    precision: "integer acceptance with FP32 state",
    measured: "11.120 us median; status exact and state error 1.1921e-7",
    optimization: "Wave broadcast reuses the accepted prefix and state update within each transaction.",
    ablation: "Recompute-prefix measured 10.960 us in this process, reversing earlier evidence; no stable gain is assigned.",
    pipeline: "The dependency chain is sequential in draft position; candidate batching and persistent scheduling are unmeasured.",
    bound: "1.792 ns resource floor; measured/floor = 6205.4x.",
    comparator: "vLLM/SGLang speculative verification",
    comparatorUrl: vllm,
    verdict: "Excluded: batching, cache ownership, acceptance semantics, and outputs differ.",
    modelTarget: "DeepSeek-V4-Pro and GLM-5.3 each configure one MTP layer; benchmark the framework's actual draft width, KV cache, sampler, and acceptance transaction.",
    modelSource: `${deepseek}; ${glm}`,
    modelImpact: "No model improvement is reported because the ablation is unstable and serving semantics are absent.",
    narratives: ["gfx950-speculative-mtp-verification/prefix-contract", "gfx950-speculative-mtp-verification/scope-evidence"],
    diagram: "reduction",
  },
  {
    id: "gfx950-ngram-performance-lab",
    title: "N-gram gather performance lab",
    source: "systems",
    symbol: "gfx950_qwen_ngram_gather_v1",
    shape: "16 batches x eight queries x 3-gram x 16 table slots",
    precision: "integer keys, indices, and gathered values",
    measured: "12.880 us median, every gathered result exact",
    optimization: "Ascending probe order matches insertion order while preserving full-key collision checks and duplicate priority.",
    ablation: "Reverse probe 15.160 -> ascending 12.880 us (1.1770x), 15.04% lower latency and 2.280 us saved.",
    pipeline: "This hash lookup is latency/control bound; LDS multibuffering is not demonstrated. Table sizing and persistent request scheduling are future axes.",
    bound: "1.152 ns resource floor; measured/floor = 11180.6x.",
    comparator: "vLLM N-gram proposer",
    comparatorUrl: vllm,
    verdict: "Excluded: table layout, batching, cache/state ownership, and returned values differ.",
    modelTarget: "Use as a framework-level proposer beside GLM-5.3 or DeepSeek-V4-Pro; N-gram lookup is not an architectural layer in their pinned configs.",
    modelSource: `${glm}; ${deepseek}`,
    modelImpact: "The 1.1770x lookup gain does not imply decode speedup until proposer hit rate and end-to-end draft overhead are profiled.",
    narratives: ["gfx950-ngram-embedding-gather/gather-contract", "gfx950-ngram-embedding-gather/scope-evidence"],
    diagram: "memory",
  },
  {
    id: "gfx950-gradient-stage-performance-lab",
    title: "Gradient-shard staging performance lab",
    source: "systems",
    symbol: "gfx950_stage_gradient_shard_v1",
    shape: "16 batches x 16 FP32 elements, two shards measured separately",
    precision: "FP32 copy",
    measured: "5.480 us median per shard, both outputs exact",
    optimization: "Direct coalesced copy with disjoint wave ownership.",
    ablation: "Tile/broadcast candidate was verifier-rejected; no numerical or timing result is admitted.",
    pipeline: "No reuse exists at 16 elements. Production overlap must be measured with actual collective transport and optimizer work.",
    bound: "0.256 ns resource floor; measured/floor = 21406.2x.",
    comparator: "HIP copy and collective staging primitives",
    comparatorUrl: "https://rocm.docs.amd.com/projects/rccl/en/latest/",
    verdict: "Excluded: this kernel does not include a matching collective or transport boundary.",
    modelTarget: "Training-side study for Kimi-K3, DeepSeek-V4-Pro, or GLM-5.3 parameter shards at their real matrix extents; it is not an inference kernel.",
    modelSource: `${kimi}; ${deepseek}; ${glm}`,
    modelImpact: "No model training throughput claim is made from a 16-element local copy.",
    narratives: ["gfx950-muon-optimizer/update-contract", "gfx950-muon-optimizer/scope-evidence"],
    diagram: "memory",
  },
  {
    id: "gfx950-muon-performance-lab",
    title: "Muon update performance lab",
    source: "systems",
    symbol: "gfx950_muon_update_4x4_v1",
    shape: "16 batches x two 4x4 FP32 shards x five Newton-Schulz iterations",
    precision: "FP32 norm and polar iterations",
    measured: "6.800 us median; update error 7.4506e-9 and norm error 5.9605e-8",
    optimization: "Wave64 reduction and register-resident 4x4 Newton-Schulz iterations.",
    ablation: "Wave16 broadcast alternative also measured 6.800 us; contribution is 0% at timer resolution.",
    pipeline: "Register-resident 4x4 work has no LDS stage; production optimizer matrices need block-size, iteration-count, and communication sweeps.",
    bound: "0.392 ns resource floor; measured/floor = 17346.9x.",
    comparator: "Distributed Muon implementations",
    comparatorUrl: "https://github.com/pytorch/pytorch",
    verdict: "Excluded: production Muon includes larger matrices, momentum, parameter application, and distributed reduction.",
    modelTarget: "Training experiment at Kimi-K3/DeepSeek-V4-Pro hidden 7168 or GLM-5.3 hidden 6144, including optimizer state and sharded communication.",
    modelSource: `${kimi}; ${deepseek}; ${glm}`,
    modelImpact: "No training speedup is claimed; the only valid ablation is a tie on a 4x4 teaching update.",
    narratives: ["gfx950-muon-optimizer/update-contract", "gfx950-muon-optimizer/scope-evidence"],
    diagram: "gemm",
  },
  {
    id: "gfx950-gpt-oss-megakernel-performance-lab",
    title: "GPT-OSS-120B megakernel performance lab",
    source: "gpt",
    symbol: "gfx950_gpt_oss_120b_decode_megakernel_v1",
    shape: "16 independent batch-1 bounded layer tiles: H2880, E128/top-4, GQA 8:1, context 16, one MXFP4 M16N16K128 expert tile",
    precision: "BF16 attention, MXFP4 expert weights, FP32 routing/accumulation",
    measured: "1.075164 ms median; attention error 1.1921e-7, expert and route outputs exact",
    optimization: "Two experts per Wave64 lane, sequential fragment construction, grouped stores, and router-attention-expert fusion.",
    ablation: "Serial router 60.398x; held fragments 1.00443x; interleaved stores 1.00461x; fusion vs component-median sum 1.00617x.",
    pipeline: "A BF16 LDS two-stage candidate was compiler-rejected and has no timing. Current sequential fragment consumption wins over holding all fragments.",
    bound: "3019.944 ns resource floor; measured/floor = 356.0x.",
    comparator: "Official GPT-OSS Triton components and AITER operator families",
    comparatorUrl: gpt,
    verdict: "Excluded: no public artifact matches this bounded fused layer-tile boundary; this is not a full layer or tokens/s comparison.",
    modelTarget: "The teaching tile pins GPT-OSS-120B H2880, E128/top-4 and GQA 8:1. Complete the full projections, expert dimensions, KV cache, sampling, and model loop for a low-batch serving comparison.",
    modelSource: gpt,
    modelImpact: "Fusion is 1.00617x versus the sum of matching fe2o3 component medians, but no end-to-end GPT-OSS throughput or SOTA claim is made.",
    narratives: ["gfx950-gpt-oss-120b-megakernel/layer-tile-contract", "gfx950-gpt-oss-120b-megakernel/performance-boundary"],
    diagram: "moe",
  },
];

export const modules11: CurriculumModule[] = [
  {
    number: 11,
    title: "gfx950 performance labs",
    summary: "Per-kernel MI350X optimization records with exact fe2o3 Rust source, ablations, theoretical resource floors, public-candidate eligibility, and model-derived production benchmark targets.",
    lessons: specs.map(lesson),
  },
];
