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
  namespace: string;
  llvmSha256: string;
  hsacoSha256: string;
  numericalResult: string;
  tolerance: string;
  runtimeObservation: string;
}

const canonicalDigest = /^[0-9a-f]{64}$/u;

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

const finalMi350Runtime =
  "observed 2026-08-29 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; fe2o3 compiler commit c1383e97db732f9f1ff8105f10d5c2b5971143e1 tree 42385e6464ca40318fc70ae104845d3997844140; digest-pinned COV6 HSA harness PASS";

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
      namespace: "e889654ad32a788ce48bde79cfdaea178a36ea3a152838739f4cb3b68fa0ac74",
      llvmSha256: "32731b06f2908b8092dc626cbdf7b91891eec30478e5fef7bd916196e4582100",
      hsacoSha256: "5a16d32486c6a424c680ec200a8fcc6941115f3a2953ec6a7fad0e383ce4a6d5",
      numericalResult: "state_output max_absolute_error=7.450580597e-8; normalized_output max_absolute_error=4.172325134e-7",
      tolerance: "absolute tolerance 3.0e-3 for both FP32 outputs; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "cd3e02ed84a8aa33b86dbff7f78b04ca4f454df507d15d78a2ff86de83e72706",
      llvmSha256: "fa025f5990902219221f4390818c9632bd900002540dafe84ef29431c7662194",
      hsacoSha256: "58536eb9abf290821b3d85d39c262ed5b49ac8d835ee959b2c36fa9446998bfa",
      numericalResult: "final_state max_absolute_error=7.450580597e-8; normalized_output_first max_absolute_error=8.642673492e-7; normalized_output_second max_absolute_error=1.072883606e-6",
      tolerance: "absolute tolerance 3.0e-3 for all three FP32 outputs; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "1ad77b6d88884cb5768cc3b9f3527c5b83fe5f1c04e3fc2823f2f8c0167e058a",
      llvmSha256: "9034334afb83a2f073d2572443e3ddea10ffe2edeccf1bad106564a8d6ad3124",
      hsacoSha256: "6ed1c00a4509c0ed7d277e78dcc81c1bfd831da7dfc09f3091d9363ce520cd54",
      numericalResult: "output max_absolute_error=0.000000000e0; selected_output exact_u32_outputs=3",
      tolerance: "output absolute tolerance 5.0e-3 with finite values; selected IDs exact",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "8fa973d4231e28e54ecbd607f539aaba65a895db610f15d56a698336b119f65a",
      llvmSha256: "33775e207659202573cdf9915660b02e26bdaa3955103ed091b351ef12f783ee",
      hsacoSha256: "6c6addf04c745ad6560e45d2896725adbb8d87952cd49c6f710fde6e5011d823",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 5.0e-3; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "e71b4250d8eb3fd5371802ed2141e5a0fb880b6a79c48d7b928a8cde0ae0e0de",
      llvmSha256: "ec09f9a9843f3790cebadbb32012138d09efda5cfd229270c6dabd1e01d8533c",
      hsacoSha256: "f3ab4ebd7b8f2310918eada0d8b90efd57c281914bbac91499040417f5c4a2e6",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "a6d721410f3856c46249fb8b78604d6a1f0caf5b050dd6f3a160ab8c40e51583",
      llvmSha256: "0fea6c0aea1dc4346dcfbd1258088ee54ec96e68692462c9ee03d8752a6e4211",
      hsacoSha256: "190ce48f1172f15b3827b1220ad6ee190087ad4be52892946eff26cfea168ec0",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "f93558928ce6e41a2fe8d78cfb28aa199dae54059fc9b7599a4348f4ad73c966",
      llvmSha256: "fd54ec9287f330300e3beaa1493142354003523256e9033c6ac6d67df27b7990",
      hsacoSha256: "f463b05e53db65c4e9ea73a0d33ce1398c85bcc8b5aab64788fdeb7858c9fdcc",
      numericalResult: "output max_absolute_error=5.960464478e-8",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "5f88dd0eb7d763b42a77dce26f06a50c315730e6a77414e64480fd94f7e9e690",
      llvmSha256: "8f600f96024522f5f85893b1f3a4bfb3f786cd36b7f2bd55e8f92727e2a0a9c3",
      hsacoSha256: "31f1f76bda88c340bcb9dcbba4323a3ea5a996ceba27d5fe9e6f2f43da826deb",
      numericalResult: "top_experts exact_u32_outputs=32; top_weights max_absolute_error=0.000000000e0; expert_counts exact_u32_outputs=4; dispatch exact_i32_outputs=128",
      tolerance: "top_weights absolute tolerance 2.0e-6; route IDs, counts, and dispatch exact",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "95964e6517ecad06b1b825cf64c29fb20fe9ec054dd551dfdc55f2e73c261dfc",
      llvmSha256: "5903f6fe753a7155fca13512ff952dcab7538fa8f98c0b4c612bd5307513890a",
      hsacoSha256: "7e8e1cb59473e52949ded2e6d5e737d3b7e4cc27a834052da01d4e41cddeb504",
      numericalResult: "rank 0 output max_absolute_error=1.490116119e-8; rank 1 output max_absolute_error=4.768371582e-7",
      tolerance: "absolute tolerance 3.0e-3 for both rank outputs; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "a27beaf1c7c14d2129a2efc9bd9802fba895073515686b9a81495afe4b65047b",
      llvmSha256: "d981ec0cbda322a74691c681ac93bd629d2fae612317c1026835a42e12cc4676",
      hsacoSha256: "aa5aa7fa613ae8f439dcf8b626ce18b7560f9705453bd3b9f0ddbc936501166e",
      numericalResult: "output max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "56cb0ca1edf995cb22811650289af395e5932a3dcb3eaeadd64139781ad8e1fa",
      llvmSha256: "665eded9144ce80080613325c3ab9503d97513c7820cfaf2608439829c7fce0e",
      hsacoSha256: "5074044f3b46e0b04d24b066cfc23877df312d093dec151c75e3d126d36bbfde",
      numericalResult: "accepted_steps exact_u32_outputs=8; committed exact_u32_outputs=8; output_state max_absolute_error=2.980232239e-8",
      tolerance: "output state absolute tolerance 1.0e-7; 48 rollback lanes bitwise exact; metadata exact",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "759fc11ede4636245a173107a33f25014d4f8f0f29f1710bf9b9396aeda69ee9",
      llvmSha256: "8ddcd27e580629472d698c6f4081aba9996b0bac999563eeb78b1a164c9cbff2",
      hsacoSha256: "870afb85c86525288e1695d9764fd84180b62d20388c2678ef96ab318987699b",
      numericalResult: "output exact_i32_outputs=8",
      tolerance: "all eight gathered values exact",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "eecf6b35ad78d15ed59c50e42bb156b24bc9977508e57b67c71c449c6486a336",
      llvmSha256: "41c5e9ebc965455b1d0e42b5d69f450af7428ce939b16c7a9e5af597b83b4513",
      hsacoSha256: "ac52b38973af23d63dbb05f6edd0ceea5caa92f1f331318d95fe7d62d5b251ce",
      numericalResult: "two shard launches; output outputs=16 max_absolute_error=0.000000000e0 for each launch",
      tolerance: "all 32 staged FP32 elements bitwise exact",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "62b82262b6a906c5c4bc76bdf41008abdb45f2c4d9830734cd05ae65520150e2",
      llvmSha256: "980b871e55312eec64161e554ae28f6357d23df921de26eb5657e1c45c01f713",
      hsacoSha256: "bb6e61181e05244a71b6475bcc34a6a0c62d94147bbe27304287f71d8181fe5d",
      numericalResult: "output max_absolute_error=7.450580597e-9; output_norm max_absolute_error=0.000000000e0",
      tolerance: "absolute tolerance 2.0e-6 for update and norm; finite values required",
      runtimeObservation: finalMi350Runtime,
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
      namespace: "af2c0007439bbc767bc23b4fd2c13af8df1c38719d3f82c7d422c6cf955aa08e",
      llvmSha256: "7d28da46358c29ce8f3c12fecce42f491cef490f098fdb1602923ffdfc7947b3",
      hsacoSha256: "066056a1fb2228c9043474d1746a7555ac31c0ca559d678844dc9e89d601f212",
      numericalResult: "attention max_absolute_error=8.940696716e-8; expert exact; packed top-4 exact",
      tolerance: "attention absolute tolerance 3.0e-3 with finite values; expert and packed top-4 exact",
      runtimeObservation: finalMi350Runtime,
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
