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
  "observed 2026-08-27 on ssh mi350 / smci350-rck-g03-b19-03; ROCm 7.2.1; eight MI350X devices visible; gfx950:xnack-; Wave64; digest-pinned COV6 HSA harness PASS";

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
      namespace: "e2036047357df97405feba4d64aa7e95868109636c92a6f6853119580fd72fe4",
      llvmSha256: "910ba94711e2c76e5aa0b992d3a7a9a819d9ddcdf0764c742ff3a24540989a5d",
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
      kernargBytes: 96,
      workgroupSize: 64,
    },
    {
      namespace: "5348fe56c1135474870729b49de57ae9150bdd6ecfb682da5c8ed03b73ccb98e",
      llvmSha256: "612fb2f8d75f859a61fdb370e63663d88e8af5d6b5313b79304474d1fd411e32",
      hsacoSha256: "8f83d5b995b4e60cca869e6f86dfb0b40234af3c80e311559dcd405e2392076e",
      numericalResult: "final_state max_absolute_error=7.450580597e-8; normalized_output max_absolute_error=1.072883606e-6",
      tolerance: "absolute tolerance 3.0e-3 for both FP32 outputs; finite values required",
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
      namespace: "4eb73f6d2e84dc00a2f62f794f44dc346ec7f413e975999a7bb1eda506a601e5",
      llvmSha256: "f1c39e4c2234d8b094482a73e822e8614456395d063d4cff1efa5597bfc3a4b3",
      hsacoSha256: "a3c6c2510d457206fe859ee80a97eda7283a6890a5dd98dc80a38fc26f3ca881",
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
      namespace: "385748dbb7bdd90c5273ed179062a78b392e297bbeff9833a4df11b446088b44",
      llvmSha256: "040d21c84e121ea828a79846ca7fa5576be637c2b6d6e43f66fcf385b731a4f2",
      hsacoSha256: "cc967d889fdc2e09e4021f814e9522382f416ce0d14167e43ce39849ee55dca2",
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
      namespace: "a65038e3cb567081a97476ed759abecdcf789e1607626117c929491ce0edffe7",
      llvmSha256: "f7449b90468e73a30b15985adbe2e3a92be809156af154ac0590dfa1663f2f0d",
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
      namespace: "632e4eb1a578d4a75b833c6bececaa239cb7f754e8999cb3513690a4b0badc12",
      llvmSha256: "d552fd07bb7400a8ea7417d25793ca16c46178100314535eed65b5ca194a3f86",
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
      llvmSha256: "17dcdc08dca1508a16001caa32d56f0b956c14c9a9a280807ca86925263ca569",
      hsacoSha256: "f463b05e53db65c4e9ea73a0d33ce1398c85bcc8b5aab64788fdeb7858c9fdcc",
      numericalResult: "output max_absolute_error=5.960464478e-8",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
      runtimeObservation: "historical optimized-candidate campaign observed 2026-08-29 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6; ROCm 7.2.1; gfx950:xnack-; the displayed final mHC function is byte-identical",
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
      llvmSha256: "ecfe0e0d8a68ff9dee31d52a426c3e43f9bb3633f5f71e78281346c04faa7f83",
      hsacoSha256: "40075649a8639b0b09a82c22e23bff61502d2f7401eb024591176cdc93f16f54",
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
      workgroupSize: 256,
    },
    {
      namespace: "95964e6517ecad06b1b825cf64c29fb20fe9ec054dd551dfdc55f2e73c261dfc",
      llvmSha256: "3f1b51472afc0161f981e78cd0dfbb87acd00a0601e91d7cb7720b6243816631",
      hsacoSha256: "aee58f04073aafeaeaa576fbafee5be62934092a052f40f0eab92cf3e7a780b0",
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
      llvmSha256: "ab54ab1a65d81a89a99ca000f91f970714884e187a0adbe77ceba606189cbb74",
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
      llvmSha256: "21f7bf5c531ba45c672070865e33bdeff359b4534079aa935788c843d49cd176",
      hsacoSha256: "b0ba51564d60b788a019266d6dcad78f404d30fde54684e4416829504795b34b",
      numericalResult: "accepted_steps exact_u32_outputs=8; committed exact_u32_outputs=8; output_state max_absolute_error=2.980232239e-8",
      tolerance: "output state absolute tolerance 1.0e-7; rollback lanes bitwise exact; metadata exact",
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
      llvmSha256: "d135b5230e275d545a58490a69c1e84647d0cd773aa03004dbd1dfa9c0c12e59",
      hsacoSha256: "d7b772700078ab05a9fc1563c80ce107d111a24fd05003c212a9011e8efaebc1",
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
      llvmSha256: "afe7914067dae310e40837ee632f7e9820b44917b017a4ae0b4c404a1505a6d9",
      hsacoSha256: "ac52b38973af23d63dbb05f6edd0ceea5caa92f1f331318d95fe7d62d5b251ce",
      numericalResult: "four shard launches; output outputs=16 max_absolute_error=0.000000000e0 for each launch",
      tolerance: "all 64 staged FP32 elements bitwise exact",
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
      llvmSha256: "3037c717956fe261953757d587081f9a12f20e863bf792a998c1076f3c7984a7",
      hsacoSha256: "e36673b4eeb8eea0563a3b7141eee99da52843e53f967c53db56a8987e6f1a31",
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
      llvmSha256: "28cd79e8d79c6bddc79a72aba64bff84ea2fc5f5fd7b7ad851bdcb64f14f20ba",
      hsacoSha256: "1e7d249dc0c11c412d2bf2d5c4755cc16e145fedea72046b26dc09a3d1656ad2",
      numericalResult: "attention max_absolute_error=8.940696716e-8; expert exact; packed top-4 exact",
      tolerance: "attention absolute tolerance 3.0e-3 with finite values; expert and packed top-4 exact",
      runtimeObservation: "historical campaign observed 2026-08-29 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6; ROCm 7.2.1; gfx950:xnack-; byte-identical final kernel and oracle; final a542 full-crate wrapper has not completed",
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
