import systemsKernel from "../../examples/gfx950_advanced_systems/src/kernel_current.rs?raw";
import attentionKernel from "../../examples/gfx950_advanced_attention/src/kernel_current.rs?raw";
import lowPrecisionKernel from "../../examples/gfx950_low_precision/src/kernel_current.rs?raw";
import gptKernel from "../../examples/gfx950_gpt_oss_decode/src/kernel_current.rs?raw";

const sources = {
  systems: {
    code: systemsKernel,
    path: "examples/gfx950_advanced_systems/src/kernel.rs",
    commit: "6fa38652e105b16a83dcd5e800c91d3ae42a9781",
  },
  attention: {
    code: attentionKernel,
    path: "examples/gfx950_advanced_attention/src/kernel.rs",
    commit: "154a8c08c9995efffd56894768d04f0b91124e62",
  },
  lowp: {
    code: lowPrecisionKernel,
    path: "examples/gfx950_low_precision/src/kernel.rs",
    commit: "34aa704c5bc3e3c84ad904dfcf7f044374e7dcd8",
  },
  gpt: {
    code: gptKernel,
    path: "examples/gfx950_gpt_oss_decode/src/kernel.rs",
    commit: "d670b3cfc3a04f39dcf37bd9e6b3d3bf1a9bbfba",
  },
} as const;

const sourceBySymbol: Record<string, keyof typeof sources> = {
  gfx950_moe_route_fp4_t16_e4_k2_v1: "systems",
  gfx950_moe_expert_rank_fp4_fp8_v1: "systems",
  gfx950_combine_expert_ranks_v1: "systems",
  gfx950_speculative_transaction_v1: "systems",
  gfx950_qwen_ngram_gather_v1: "systems",
  gfx950_stage_gradient_shard_v1: "systems",
  gfx950_muon_update_4x4_v1: "systems",
  gfx950_content_sparse_attention: "attention",
  gfx950_compressed_hybrid_attention: "attention",
  gfx950_fp8_attention_rust: "lowp",
  gfx950_gpt_oss_120b_decode_megakernel_v1: "gpt",
};

export function currentGfx950ExcerptSource(symbol: string) {
  const key = sourceBySymbol[symbol];
  return key === undefined ? undefined : sources[key];
}

export const currentGfx950ExcerptNotice =
  "Current-source association only. Historical compiler, GPU correctness, and performance claims retain their original source and artifact bindings and do not qualify this displayed revision. No new execution, timing, or SIMT/tile pair qualification is claimed.";
