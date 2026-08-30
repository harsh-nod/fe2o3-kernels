export const advancedProductionTarget = "gfx950:xnack-";
export const advancedHarnessPath =
  "crates/fe2o3-hsa-runtime/tests/gfx950_advanced_hardware.rs";

export interface AdvancedKernelContract {
  label: string;
  symbol: string;
  runnerPath: string;
  hardwareTest: string;
  requiredIsa: readonly string[];
  kernargBytes: number;
  workgroupSize: number;
  ldsBytes?: number;
}

export interface PendingAdvancedRustEvidence extends AdvancedKernelContract {
  status: "pending-mi350";
  ldsBytes: number;
}

export interface ObservedAdvancedRustEvidence extends AdvancedKernelContract {
  status: "observed";
  ldsBytes: number;
  sourceCommit: string;
  sourceTree: string;
  namespace: string;
  llvmSha256: string;
  hsacoSha256: string;
  numericalResult: string;
  tolerance: string;
  runtimeObservation: string;
}

export type AdvancedRustEvidence =
  | PendingAdvancedRustEvidence
  | ObservedAdvancedRustEvidence;

export interface AdvancedMeasurement {
  sourceCommit: string;
  sourceTree: string;
  namespace: string;
  llvmSha256: string;
  hsacoSha256: string;
  numericalResult: string;
  tolerance: string;
  runtimeObservation: string;
}

const canonicalDigest = /^[0-9a-f]{64}$/u;
const canonicalGitObject = /^[0-9a-f]{40}$/u;

function checkedContract(
  contract: AdvancedKernelContract,
): AdvancedKernelContract & { ldsBytes: number } {
  const ldsBytes = contract.ldsBytes ?? 0;
  if (
    !contract.symbol.startsWith("gfx950_") ||
    !contract.runnerPath.startsWith("examples/gfx950_") ||
    !contract.runnerPath.endsWith("-gfx950.sh") ||
    !contract.hardwareTest.endsWith("_rust_cov6_matches_cpu_reference") ||
    contract.requiredIsa.length === 0 ||
    !Number.isSafeInteger(contract.kernargBytes) ||
    contract.kernargBytes <= 0 ||
    !Number.isSafeInteger(contract.workgroupSize) ||
    contract.workgroupSize <= 0 ||
    !Number.isSafeInteger(ldsBytes) ||
    ldsBytes < 0
  ) {
    throw new Error(`Invalid advanced kernel contract for ${contract.symbol}`);
  }
  return {
    ...contract,
    requiredIsa: Object.freeze([...contract.requiredIsa]),
    ldsBytes,
  };
}

export function pendingAdvancedEvidence(
  contract: AdvancedKernelContract,
): PendingAdvancedRustEvidence {
  return Object.freeze({
    ...checkedContract(contract),
    status: "pending-mi350" as const,
  });
}

// Use this constructor only after the exact wrapper completed on mi350 and the
// namespace and digests were copied from that retained run record.
export function observedAdvancedEvidence(
  contract: AdvancedKernelContract,
  measurement: AdvancedMeasurement,
): ObservedAdvancedRustEvidence {
  for (const [field, value] of [
    ["source commit", measurement.sourceCommit],
    ["source tree", measurement.sourceTree],
  ] as const) {
    if (!canonicalGitObject.test(value)) {
      throw new Error(`${contract.symbol} has a noncanonical ${field}`);
    }
  }
  for (const [field, value] of [
    ["namespace", measurement.namespace],
    ["LLVM SHA-256", measurement.llvmSha256],
    ["HSACO SHA-256", measurement.hsacoSha256],
  ] as const) {
    if (!canonicalDigest.test(value)) {
      throw new Error(`${contract.symbol} has a noncanonical ${field}`);
    }
  }
  for (const [field, value] of [
    ["numerical result", measurement.numericalResult],
    ["tolerance", measurement.tolerance],
    ["runtime observation", measurement.runtimeObservation],
  ] as const) {
    if (value.trim().length === 0 || /\bpending\b/iu.test(value)) {
      throw new Error(`${contract.symbol} has an incomplete ${field}`);
    }
  }
  return Object.freeze({
    ...checkedContract(contract),
    ...measurement,
    status: "observed" as const,
  });
}

export function isObservedAdvancedEvidence(
  evidence: AdvancedRustEvidence,
): evidence is ObservedAdvancedRustEvidence {
  return evidence.status === "observed";
}

const finalMi350Campaign = Object.freeze({
  sourceCommit: "da6c108d162bac8afd79e789ccf9b36ef8eb97a4",
  sourceTree: "745526b462feb2fcc7a45716382c7db86480cb2d",
  runtimeObservation:
    "observed 2026-08-29 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; advanced-ablation-final-da6c108d-gpu6 digest-pinned COV6 HSA harness PASS",
});

const compressedHybridPromotionCampaign = Object.freeze({
  sourceCommit: "4f9b2bf09db41e6ef38db1bb926c2fa7989d8e1f",
  sourceTree: "7b1d5209142d1fe8dfbf39158337cad0df734f1b",
  runtimeObservation:
    "observed 2026-08-29 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; compressed-hybrid-promotion-4f9b2bf0-gpu6 digest-pinned COV6 HSA harness PASS",
});

export const advancedRustEvidence = Object.freeze({
  gfx950_kda_gdn_decode: observedAdvancedEvidence(
    {
      label: "KDA/GDN decode",
      symbol: "gfx950_kda_gdn_decode",
      runnerPath: "examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
      hardwareTest: "gfx950_kda_gdn_decode_rust_cov6_matches_cpu_reference",
      requiredIsa: ["no MFMA or transpose instructions"],
      kernargBytes: 96,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "32d98826b8e7144ccd84186aef763064c4d6f7fca5631c29314047ad462fd257",
      llvmSha256: "37efa347c1e135787dcf526bae0aa08c6f7cba6f0ed5462161aad3464603f591",
      hsacoSha256: "5a16d32486c6a424c680ec200a8fcc6941115f3a2953ec6a7fad0e383ce4a6d5",
      numericalResult: "state_output max_absolute_error=7.450580597e-8; normalized_output max_absolute_error=4.172325134e-7",
      tolerance: "absolute tolerance 3.0e-3 for both FP32 outputs; finite values required",
    },
  ),
  gfx950_kda_gdn_prefill: observedAdvancedEvidence(
    {
      label: "KDA/GDN prefill",
      symbol: "gfx950_kda_gdn_prefill",
      runnerPath: "examples/gfx950_advanced_attention/run-kda-prefill-gfx950.sh",
      hardwareTest: "gfx950_kda_gdn_prefill_rust_cov6_matches_cpu_reference",
      requiredIsa: ["no MFMA or transpose instructions"],
      kernargBytes: 112,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "aaa9f9d6d19739146cfa7a4c759dfc76f8b0930b9bfd4a6dbbb3ee367d6baa30",
      llvmSha256: "2a326a372023d6b30f02553dad8f70338c73ecf552d94ebf0d14e0a12da53c09",
      hsacoSha256: "58536eb9abf290821b3d85d39c262ed5b49ac8d835ee959b2c36fa9446998bfa",
      numericalResult: "final_state max_absolute_error=7.450580597e-8; normalized_output_first max_absolute_error=8.642673492e-7; normalized_output_second max_absolute_error=1.072883606e-6",
      tolerance: "absolute tolerance 3.0e-3 for all three FP32 outputs; finite values required",
    },
  ),
  gfx950_content_sparse_attention: observedAdvancedEvidence(
    {
      label: "content sparse attention",
      symbol: "gfx950_content_sparse_attention",
      runnerPath: "examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh",
      hardwareTest: "gfx950_content_sparse_attention_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly four ds_read_b64_tr_b8",
        "exactly one v_mfma_f32_16x16x128_f8f6f4 with E4M3 selectors",
      ],
      kernargBytes: 96,
      workgroupSize: 64,
      ldsBytes: 2048,
    },
    {
      ...finalMi350Campaign,
      namespace: "9173ef11ab9a528cd764e5d7c8aea5347f72eb3b8d84aec7e9cbca5510ed8b49",
      llvmSha256: "cb9d81661add21f299c4d596b76bd27f5acff8b1faad17ed6b6c75d8d7aedb75",
      hsacoSha256: "7142719bf138b739e6ce00ecba664068a7074642eba307bfd9ee54b83a4cdc49",
      numericalResult: "output max_absolute_error=0.000000000e0; selected_output exact_u32_outputs=3",
      tolerance: "output absolute tolerance 5.0e-3 with finite values; selected IDs exact",
    },
  ),
  gfx950_compressed_hybrid_attention: observedAdvancedEvidence(
    {
      label: "compressed hybrid attention",
      symbol: "gfx950_compressed_hybrid_attention",
      runnerPath: "examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
      hardwareTest: "gfx950_compressed_hybrid_attention_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly four ds_read_b64_tr_b8",
        "exactly one v_mfma_f32_16x16x128_f8f6f4 with E4M3 selectors",
      ],
      kernargBytes: 80,
      workgroupSize: 64,
      ldsBytes: 2048,
    },
    {
      ...compressedHybridPromotionCampaign,
      namespace: "c8cf1919826911b62fad830db644250616be68fd3aa252db280fb6cbf9157d3b",
      llvmSha256: "2c3dc19fb71c4f2915b142d57333e8928c08fedcb3cba5b8fc6c329ebf275990",
      hsacoSha256: "3cf9a73d1c684fc1f9f93c556eaa4772be0c250bd4d6d1f1b3241adbd5c5ef03",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 5.0e-3; finite values required",
    },
  ),
  gfx950_attnres_aggregate: observedAdvancedEvidence(
    {
      label: "AttnRes aggregate",
      symbol: "gfx950_attnres_aggregate",
      runnerPath: "examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh",
      hardwareTest: "gfx950_attnres_aggregate_rust_cov6_matches_cpu_reference",
      requiredIsa: ["v_exp_f32"],
      kernargBytes: 48,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "8ce6f447416acb25d3708e21b8f1b1ac79e9d3a40350d54c07492e082df0230c",
      llvmSha256: "e3682835d7ed66754c58182830e810952f9b7f9c6e86d6c70392ab1a854bfaa6",
      hsacoSha256: "f3ab4ebd7b8f2310918eada0d8b90efd57c281914bbac91499040417f5c4a2e6",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_four_branch_residual: observedAdvancedEvidence(
    {
      label: "four-branch residual",
      symbol: "gfx950_four_branch_residual",
      runnerPath: "examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh",
      hardwareTest: "gfx950_four_branch_residual_rust_cov6_matches_cpu_reference",
      requiredIsa: ["v_exp_f32"],
      kernargBytes: 64,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "d6335f62afe3df03ec2466b441ea5dd82b55a87b6899f9c95722fb86b5907cd8",
      llvmSha256: "3e144f4cca2860778a7d6dfe6f536a7a800114b6213a03c7b928bd2134a49cdb",
      hsacoSha256: "190ce48f1172f15b3827b1220ad6ee190087ad4be52892946eff26cfea168ec0",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_mhc_sinkhorn_mix: observedAdvancedEvidence(
    {
      label: "mHC Sinkhorn mix",
      symbol: "gfx950_mhc_sinkhorn_mix",
      runnerPath: "examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
      hardwareTest: "gfx950_mhc_sinkhorn_mix_rust_cov6_matches_cpu_reference",
      requiredIsa: ["v_exp_f32"],
      kernargBytes: 48,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "febc97fab4675a82add36de7ba400c3aef06fe5c788fc6083712033260b9c10c",
      llvmSha256: "f46689bb42eab2e0995a0190390ca72006556ba2be3d93c634b942ac46a2141b",
      hsacoSha256: "f463b05e53db65c4e9ea73a0d33ce1398c85bcc8b5aab64788fdeb7858c9fdcc",
      numericalResult: "output max_absolute_error=5.960464478e-8",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_moe_route_fp4_t16_e4_k2_v1: observedAdvancedEvidence(
    {
      label: "MoE route",
      symbol: "gfx950_moe_route_fp4_t16_e4_k2_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-moe-route-gfx950.sh",
      hardwareTest: "gfx950_moe_route_rust_cov6_matches_cpu_reference",
      requiredIsa: ["gfx950_moe_route_fp4_t16_e4_k2_v1 symbol", "no MFMA or transpose instructions"],
      kernargBytes: 96,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace: "bb933fcd1e3f8124227991b6743de97b6fa108551cc44c617d9450933ad98170",
      llvmSha256: "ebd55425a148533449bb4ca896d0ea9f0a7223dadc3a812e2810639e64ba48dc",
      hsacoSha256: "c58e8782753fa049617d082376bc915e4c68ace2f00dcd232dfda110ce9db273",
      numericalResult: "top_experts exact_u32_outputs=32; top_weights max_absolute_error=0.000000000e0; expert_counts exact_u32_outputs=4; dispatch exact_i32_outputs=128",
      tolerance: "top_weights absolute tolerance 2.0e-6; route IDs, counts, and dispatch exact",
    },
  ),
  gfx950_moe_expert_rank_fp4_fp8_v1: observedAdvancedEvidence(
    {
      label: "MoE FP4/FP8 expert rank",
      symbol: "gfx950_moe_expert_rank_fp4_fp8_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-moe-expert-rank-gfx950.sh",
      hardwareTest: "gfx950_moe_expert_rank_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly three v_mfma_f32_16x16x128_f8f6f4",
        "FP4-A/FP8-B selectors (cbsz:4)",
        "no transpose instructions",
      ],
      kernargBytes: 88,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "dad4ffb4c5c270c853b36fbb21ecc1095dcf33cf74d9585029fdce96e90d38e2",
      llvmSha256: "95a9e9183455b947f5f7792d5d7ba8e07b97a7c8ca030ecf375091a05e864e3e",
      hsacoSha256: "5ae3155e21e8b7b1789507fb1c2948b814fe71edf3c250fe4988ad327bd27eb0",
      numericalResult: "rank 0 output max_absolute_error=1.490116119e-8; rank 1 output max_absolute_error=4.768371582e-7",
      tolerance: "absolute tolerance 3.0e-3 for both rank outputs; finite values required",
    },
  ),
  gfx950_combine_expert_ranks_v1: observedAdvancedEvidence(
    {
      label: "MoE rank combine",
      symbol: "gfx950_combine_expert_ranks_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-combine-expert-ranks-gfx950.sh",
      hardwareTest: "gfx950_combine_expert_ranks_rust_cov6_matches_cpu_reference",
      requiredIsa: ["gfx950_combine_expert_ranks_v1 symbol", "no MFMA or transpose instructions"],
      kernargBytes: 48,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace: "75b93b89a635855d620e2974e64c7ad6299d75329410616cdceaaabe02db89ae",
      llvmSha256: "5f1704cddb239b2aaba7ce81cb1e59eb35972a71dbb21de8984eb21863338fb5",
      hsacoSha256: "fdd9cc5f181800f7e68ca05ddb93031a851a567955a35909daee72fbe99a64f5",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_speculative_transaction_v1: observedAdvancedEvidence(
    {
      label: "speculative transaction",
      symbol: "gfx950_speculative_transaction_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
      hardwareTest: "gfx950_speculative_transaction_rust_cov6_matches_cpu_reference",
      requiredIsa: ["gfx950_speculative_transaction_v1 symbol", "no MFMA or transpose instructions"],
      kernargBytes: 144,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "712bf821d681a74855c892c7f02fb02b2c64fe36617092999f673a1531777f8b",
      llvmSha256: "a08e6bb039985ed95b80bc23fd926864c2ee6ad16c744f523efd6fe75255125a",
      hsacoSha256: "5074044f3b46e0b04d24b066cfc23877df312d093dec151c75e3d126d36bbfde",
      numericalResult: "accepted_steps exact_u32_outputs=8; committed exact_u32_outputs=8; output_state max_absolute_error=2.980232239e-8",
      tolerance: "output state absolute tolerance 1.0e-7; 48 rollback lanes bitwise exact; metadata exact",
    },
  ),
  gfx950_qwen_ngram_gather_v1: observedAdvancedEvidence(
    {
      label: "N-gram gather",
      symbol: "gfx950_qwen_ngram_gather_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
      hardwareTest: "gfx950_qwen_ngram_gather_rust_cov6_matches_cpu_reference",
      requiredIsa: ["gfx950_qwen_ngram_gather_v1 symbol", "no MFMA or transpose instructions"],
      kernargBytes: 96,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "a9bf254981d5af7855538f611e59b2a273ed274201689cd16443b7279c327175",
      llvmSha256: "7cb0b517c74fe4dc2eda1568905be7bdbe2bc9c84b56138a5835612085a9c376",
      hsacoSha256: "870afb85c86525288e1695d9764fd84180b62d20388c2678ef96ab318987699b",
      numericalResult: "output exact_i32_outputs=8",
      tolerance: "all eight gathered values exact",
    },
  ),
  gfx950_stage_gradient_shard_v1: observedAdvancedEvidence(
    {
      label: "gradient shard staging",
      symbol: "gfx950_stage_gradient_shard_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh",
      hardwareTest: "gfx950_stage_gradient_shard_rust_cov6_matches_cpu_reference",
      requiredIsa: ["gfx950_stage_gradient_shard_v1 symbol", "no MFMA or transpose instructions"],
      kernargBytes: 32,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "487472b4b767bb11afc7a2d5bb85795b2b538c040432da4c0d5755900dd4867e",
      llvmSha256: "3684a2523050984025cdaff77af04176c8b3e751f57644bed325ae92260d182c",
      hsacoSha256: "ac52b38973af23d63dbb05f6edd0ceea5caa92f1f331318d95fe7d62d5b251ce",
      numericalResult: "two shard launches; output outputs=16 max_absolute_error=0.000000000e0 for each launch",
      tolerance: "all 32 staged FP32 elements bitwise exact",
    },
  ),
  gfx950_muon_update_4x4_v1: observedAdvancedEvidence(
    {
      label: "Muon 4x4 update",
      symbol: "gfx950_muon_update_4x4_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-muon-update-gfx950.sh",
      hardwareTest: "gfx950_muon_update_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "gfx950_muon_update_4x4_v1 symbol",
        "native llvm.sqrt lowering and no constrained-sqrt reference",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 48,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "9640ccf630920dc28c840f4d796dab11ddd9cebf804b0315b877e0c048eb7829",
      llvmSha256: "610e682295d73dd9791b5320cff6cd121b1abc7e654b794c7f510ad722d1f78e",
      hsacoSha256: "bb6e61181e05244a71b6475bcc34a6a0c62d94147bbe27304287f71d8181fe5d",
      numericalResult: "output max_absolute_error=7.450580597e-9; output_norm max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 2.0e-6 for update and norm; finite values required",
    },
  ),
  gfx950_gpt_oss_120b_decode_megakernel_v1: observedAdvancedEvidence(
    {
      label: "gpt-oss-120b batch-1 layer-tile megakernel",
      symbol: "gfx950_gpt_oss_120b_decode_megakernel_v1",
      runnerPath: "examples/gfx950_gpt_oss_decode/run-gfx950.sh",
      hardwareTest: "gfx950_gpt_oss_layer_tile_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly four v_mfma_f32_16x16x16_bf16",
        "exactly four v_mfma_f32_16x16x128_f8f6f4 with FP4 selectors",
        "no transpose instructions",
      ],
      kernargBytes: 208,
      workgroupSize: 64,
    },
    {
      ...finalMi350Campaign,
      namespace: "0739c8414cc87e4bd943b2d563152bbb25abc619847f75f405c6dadb154858d9",
      llvmSha256: "b5e3ad3e6b0d638cfa45a3bb1a1f28b479dd20a2313aefde7a4607c6f750cb59",
      hsacoSha256: "016d57b87e0655f0b04e67a9fe43be5af884d7324e5d74354d151b5f095071d2",
      numericalResult: "attention max_absolute_error=8.940696716e-8; expert exact; packed top-4 exact",
      tolerance: "attention absolute tolerance 3.0e-3 with finite values; expert and packed top-4 exact",
    },
  ),
} satisfies Record<string, AdvancedRustEvidence>);

export type AdvancedKernelSymbol = keyof typeof advancedRustEvidence;

export function advancedEvidenceFor(
  symbols: readonly string[],
): AdvancedRustEvidence[] {
  return symbols.map((symbol) => {
    const evidence = advancedRustEvidence[symbol as AdvancedKernelSymbol];
    if (!evidence) {
      throw new Error(`Missing production evidence record for ${symbol}`);
    }
    return evidence;
  });
}
