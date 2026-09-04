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
  isaSha256: string;
  numericalResult: string;
  tolerance: string;
  runtimeObservation: string;
}

export type AdvancedRustEvidence =
  PendingAdvancedRustEvidence | ObservedAdvancedRustEvidence;

export interface AdvancedMeasurement {
  sourceCommit: string;
  sourceTree: string;
  namespace: string;
  llvmSha256: string;
  hsacoSha256: string;
  isaSha256: string;
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
// Compiler-derived binding and digests were copied from that retained run record.
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
    ["ISA SHA-256", measurement.isaSha256],
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
  sourceCommit: "65ddfd76c4fe276dedcb5046d592d50b4bf921ac",
  sourceTree: "dfcc77d91ea992dd07a67ed268f69553efc0774c",
  runtimeObservation:
    "observed 2026-09-03 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; WG256/grid4 production COV6 HSA correctness campaign PASS",
});

const attentionMultiGridCampaign = Object.freeze({
  sourceCommit: finalMi350Campaign.sourceCommit,
  sourceTree: finalMi350Campaign.sourceTree,
  runtimeObservation:
    "observed 2026-09-03 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; WG256/grid4 production COV6 HSA correctness campaign PASS",
});

// The compiler binding below authenticates the exact validated source closure;
// do not substitute the former single-wave artifact digests.
const gptOssMultiGridCampaign = Object.freeze({
  sourceCommit: finalMi350Campaign.sourceCommit,
  sourceTree: finalMi350Campaign.sourceTree,
  runtimeObservation:
    "observed 2026-09-03 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 7 (ROCR_VISIBLE_DEVICES=7, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; WG256/grid4 production COV6 HSA correctness campaign PASS",
});

export const advancedRustEvidence = Object.freeze({
  gfx950_kda_decode: observedAdvancedEvidence(
    {
      label: "Kimi Delta Attention matrix-state decode",
      symbol: "gfx950_kda_decode",
      runnerPath: "examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
      hardwareTest: "gfx950_kda_decode_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "ds_bpermute_b32 Wave16 reductions",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 128,
      workgroupSize: 256,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "3f3221a3dc1c1c8e1cca65e0751b34f6829d93c98c5414cf9a4ef53b36863b0d",
      llvmSha256:
        "ba9eb84c44468f8b4d657f05c7524a4600641cf75d8b3dfefa258ea89669b5a7",
      hsacoSha256:
        "11af04ea552ea1e7c2a7bcad2a3dd26222ced4ffac39148015bb90b578c3f7b0",
      isaSha256:
        "8b5340ee348631beb84ccdbf7718625454e97180755dc061b157ecbc204a64ee",
      numericalResult:
        "four problems; final_state_value_major outputs=1024 max_absolute_error=2.980232239e-8; output_replicated outputs=1024 max_absolute_error=7.450580597e-9",
      tolerance:
        "absolute tolerance 2.0e-5 for all 1,024 state elements and all 1,024 output replicas; finite values required; immutable inputs and guard canaries exact",
    },
  ),
  gfx950_kda_chunkwise_prefill: observedAdvancedEvidence(
    {
      label: "Kimi Delta Attention WY/UT chunkwise prefill",
      symbol: "gfx950_kda_chunkwise_prefill",
      runnerPath:
        "examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
      hardwareTest:
        "gfx950_kda_chunkwise_prefill_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "ds_bpermute_b32 Wave16 reductions",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 144,
      workgroupSize: 256,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "842f02aba09789e97545e7ad82c183ca22968209ae9a4e5f4013500969e705a0",
      llvmSha256:
        "86f0b6f1cd7b4df2e5c6748a3213fc3547c83f7af884d1a49b896efebfcf0969",
      hsacoSha256:
        "dcb9f8cc55339234e05ac814536fd8b98b2d34f8c41de9c76c6baa475edaea9c",
      isaSha256:
        "5dd677c827b5bbda813de61b42d3709949258f203f426e83c2e78e79568ec7a5",
      numericalResult:
        "four problems; final_state_value_major outputs=1024 max_absolute_error=1.490116119e-8; output_chunk0_replicated outputs=1024 max_absolute_error=7.450580597e-9; output_chunk1_replicated outputs=1024 max_absolute_error=7.450580597e-9",
      tolerance:
        "absolute tolerance 2.0e-4 for all 1,024 state elements and both 1,024-element output-replica buffers; finite values required; immutable inputs and guard canaries exact",
    },
  ),
  gfx950_content_sparse_attention: observedAdvancedEvidence(
    {
      label: "content sparse attention",
      symbol: "gfx950_content_sparse_attention",
      runnerPath:
        "examples/gfx950_advanced_attention/run-content-sparse-attention-gfx950.sh",
      hardwareTest:
        "gfx950_content_sparse_attention_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly four ds_read_b64_tr_b8",
        "exactly one v_mfma_f32_16x16x128_f8f6f4 with E4M3 selectors",
      ],
      kernargBytes: 96,
      workgroupSize: 256,
      ldsBytes: 8192,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "41184ff7591988ce338b0c66adc81694015c4ec76e5d0905d7079a02a9ff3515",
      llvmSha256:
        "7eb0a0fde72b8a0eac77a42f7481b98ed42cdd1a6d0775b30d4c55cb075f987b",
      hsacoSha256:
        "d609377c0e56d3589f88fb0a850c39c60a3e34cac3d53ad8f3dfcf0159d02d9d",
      isaSha256:
        "3af0fafe421feab37339cad81588d441ba2f8c32b8a0e7029834595592cab5a7",
      numericalResult:
        "16 Wave64 heads; output outputs=256 max_absolute_error=5.820766091e-11; selected_output exact_u32_outputs=48",
      tolerance:
        "output absolute tolerance 5.0e-3 with finite values; selected IDs exact",
    },
  ),
  gfx950_deepseek_sparse_attention: observedAdvancedEvidence(
    {
      label: "DeepSeek sparse attention",
      symbol: "gfx950_deepseek_sparse_attention",
      runnerPath:
        "examples/gfx950_advanced_attention/run-deepseek-sparse-attention-gfx950.sh",
      hardwareTest:
        "gfx950_deepseek_sparse_attention_rust_cov6_matches_cpu_reference",
      requiredIsa: ["no MFMA or transpose instructions"],
      kernargBytes: 112,
      workgroupSize: 256,
      ldsBytes: 0,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "00b4df99b377546bde34c7c368996cee85a2aa746e712d15d4a147906ec79890",
      llvmSha256:
        "bddff7bd7f10232ad71a9d159d119f58e86b74e1e66ddbef02a9265b2d35ca6e",
      hsacoSha256:
        "1d55054669d735190e1747c2e16f510455ae89a623d93b1fb66c2037676f9437",
      isaSha256:
        "1605051d5b24425899e104f279cffe61f9144e053c94496afdac373c8129d958",
      numericalResult:
        "64 Wave16 heads; output outputs=1024 max_absolute_error=5.215406418e-8; softmax_maximum max_absolute_error=1.490116119e-7; softmax_normalizer max_absolute_error=4.768371582e-7",
      tolerance:
        "absolute tolerance 5.0e-3 for output, maximum, and normalizer; finite values required; valid selected IDs unique and all-invalid domains rejected",
    },
  ),
  gfx950_compressed_hybrid_attention: observedAdvancedEvidence(
    {
      label: "compressed hybrid attention",
      symbol: "gfx950_compressed_hybrid_attention",
      runnerPath:
        "examples/gfx950_advanced_attention/run-compressed-hybrid-attention-gfx950.sh",
      hardwareTest:
        "gfx950_compressed_hybrid_attention_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly four ds_read_b64_tr_b8",
        "exactly one v_mfma_f32_16x16x128_f8f6f4 with E4M3 selectors",
      ],
      kernargBytes: 80,
      workgroupSize: 256,
      ldsBytes: 8192,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "0b0ef0cc765b333ea46bf5c8b395b117726baf1df45cb30a36f3b5b366b9cd90",
      llvmSha256:
        "148e9b8b02a47015e4c2d43e018e6559b39ebbbc1fbf83978ef78aaa35c93029",
      hsacoSha256:
        "314ed596839d1aa04557ca26b18f9a4a2356ad67e767a3865e40a7bc0bf6a90d",
      isaSha256:
        "ff983971927d64f7917b95a7d898bbed6bc9ec1cd088c766ab5d98e9d180c950",
      numericalResult: "output max_absolute_error=5.960464478e-8",
      tolerance: "absolute tolerance 5.0e-3; finite values required",
    },
  ),
  gfx950_attnres_aggregate: observedAdvancedEvidence(
    {
      label: "AttnRes aggregate",
      symbol: "gfx950_attnres_aggregate",
      runnerPath:
        "examples/gfx950_advanced_attention/run-attnres-aggregate-gfx950.sh",
      hardwareTest: "gfx950_attnres_aggregate_rust_cov6_matches_cpu_reference",
      requiredIsa: ["v_exp_f32"],
      kernargBytes: 48,
      workgroupSize: 256,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "d8d15c9cc317ecf7ea18134dc1bf20e7118d57c18484633343737e26b34b1e8b",
      llvmSha256:
        "1eff7b8b8a41a87d4b095a11935b5754b297eaa8cc7d7bf427215f9ef7746ccf",
      hsacoSha256:
        "8622031a6d857b060b8b036e99d8e2f91068904f075fa54d7c1b88b40d6c96b3",
      isaSha256:
        "24a639b63b9f14ba08b1a57ab0afecae8513895beb04a0ac5e819ffe16860ea1",
      numericalResult:
        "64 Wave16 items; output outputs=1024 max_absolute_error=4.470348358e-8",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_four_branch_residual: observedAdvancedEvidence(
    {
      label: "four-branch residual",
      symbol: "gfx950_four_branch_residual",
      runnerPath:
        "examples/gfx950_advanced_attention/run-four-branch-residual-gfx950.sh",
      hardwareTest:
        "gfx950_four_branch_residual_rust_cov6_matches_cpu_reference",
      requiredIsa: ["v_exp_f32"],
      kernargBytes: 64,
      workgroupSize: 256,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "8cb728188775d6d83180232142d7257b544fa7d47d370df4cd9f47341a98ec4f",
      llvmSha256:
        "d47ec7f57f4cf9b5a2f0f2057c41196f217415e2767bc8cf2fc01c13009c8dbf",
      hsacoSha256:
        "fd77ba3f34568aa95b7b59ebe9fc71506e317d7ac6090e3439601512fd46acdd",
      isaSha256:
        "410363e17ce2b22943fedeea66b87ad0c08880a2bf49a786e0514b13094ba6af",
      numericalResult:
        "64 Wave16 items; output outputs=1024 max_absolute_error=1.490116119e-8",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_mhc_sinkhorn_mix: observedAdvancedEvidence(
    {
      label: "mHC Sinkhorn mix",
      symbol: "gfx950_mhc_sinkhorn_mix",
      runnerPath:
        "examples/gfx950_advanced_attention/run-mhc-sinkhorn-mix-gfx950.sh",
      hardwareTest: "gfx950_mhc_sinkhorn_mix_rust_cov6_matches_cpu_reference",
      requiredIsa: ["v_exp_f32"],
      kernargBytes: 48,
      workgroupSize: 256,
    },
    {
      ...attentionMultiGridCampaign,
      namespace:
        "73f4092c29d502123674e2db869cecad075cb0986ffd1455c03e83169f5ac9d3",
      llvmSha256:
        "67d374f7132bbbfad2955b21637eb6b115e58a0e4f5f15df0a3233edd8028468",
      hsacoSha256:
        "e441bf98aec02fc596f55e00477ab2f647dd776bb8756099c6168802b16b6a13",
      isaSha256:
        "452a8595fd4a5ee9a058937f420c78a57132dda0789f9da5b90ca432617211cd",
      numericalResult:
        "16 Wave64 items; output outputs=1024 max_absolute_error=6.705522537e-8",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_moe_route_fp4_t16_e4_k2_v1: observedAdvancedEvidence(
    {
      label: "MoE route",
      symbol: "gfx950_moe_route_fp4_t16_e4_k2_v1",
      runnerPath: "examples/gfx950_advanced_systems/run-moe-route-gfx950.sh",
      hardwareTest: "gfx950_moe_route_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "gfx950_moe_route_fp4_t16_e4_k2_v1 symbol",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 96,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace:
        "344537929cdf16d940f1b7244b0efa12b6e6c00704c6431889fb9baebf23c80e",
      llvmSha256:
        "6a64d962f587529532c950ffd753eaa987083633ead2c19ec17b6ccbb6972bb1",
      hsacoSha256:
        "c353b9dc394efbfbc87fb8f9c295e5d23b701d7b1c4c517e04c0a4f71953ee11",
      isaSha256:
        "7ec3d71ffcf424f6267499137ae2e2311c48c1e15d5800ae2567345f447e5268",
      numericalResult:
        "top_experts exact_u32_outputs=512; top_weights max_absolute_error=2.980232239e-8; expert_counts exact_u32_outputs=64; dispatch exact_i32_outputs=2048",
      tolerance:
        "top_weights absolute tolerance 2.0e-6; route IDs, counts, and dispatch exact",
    },
  ),
  gfx950_moe_expert_rank_fp4_fp8_v1: observedAdvancedEvidence(
    {
      label: "MoE FP4/FP8 expert rank",
      symbol: "gfx950_moe_expert_rank_fp4_fp8_v1",
      runnerPath:
        "examples/gfx950_advanced_systems/run-moe-expert-rank-gfx950.sh",
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
      ...finalMi350Campaign,
      namespace:
        "3b0b091c97e08d3fba5fc96a824eedb40391e561f60cb6bd48102ee48ec69a39",
      llvmSha256:
        "978c80d8d1a661cc587ad106a9c23bf6aa9ef8fa211bd32af6ee70d8e88735ef",
      hsacoSha256:
        "a221d2678c133346dbcef0faa106c896c7fdf22f57735232fa31c3275e915f7c",
      isaSha256:
        "4c9ef1b6028511ab28656aa2e0cd9e72a9f96827da6db295f12751fbf8b5e633",
      numericalResult:
        "four plans with 4096 outputs each; max_absolute_error=[9.536743164e-7, 4.768371582e-7, 0, 0]",
      tolerance:
        "absolute tolerance 3.0e-3 for both rank outputs; finite values required",
    },
  ),
  gfx950_combine_expert_ranks_v1: observedAdvancedEvidence(
    {
      label: "MoE rank combine",
      symbol: "gfx950_combine_expert_ranks_v1",
      runnerPath:
        "examples/gfx950_advanced_systems/run-combine-expert-ranks-gfx950.sh",
      hardwareTest:
        "gfx950_combine_expert_ranks_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "gfx950_combine_expert_ranks_v1 symbol",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 48,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace:
        "12dcf936e1fed25f6498ecb2235b729a973b127c900adc02bdcad1e6a8f8f178",
      llvmSha256:
        "1f8592cb1d0021d2a5d2d5ee3a3b51b5b5561c22adfc290e11bc3afc8ec98618",
      hsacoSha256:
        "2ea273809becd4d9502ed6296aed3345ea95fe3292421016103a5098cb6340f1",
      isaSha256:
        "9723bee66c08727aaefc44deb98e5eb0d5d122dbd023a6d00cf755fe888149ca",
      numericalResult: "output outputs=1024 max_absolute_error=0",
      tolerance: "absolute tolerance 3.0e-3; finite values required",
    },
  ),
  gfx950_speculative_transaction_v1: observedAdvancedEvidence(
    {
      label: "speculative transaction",
      symbol: "gfx950_speculative_transaction_v1",
      runnerPath:
        "examples/gfx950_advanced_systems/run-speculative-transaction-gfx950.sh",
      hardwareTest:
        "gfx950_speculative_transaction_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "gfx950_speculative_transaction_v1 symbol",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 144,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace:
        "7437746e7fe0f2a2bd080266dbd8044f22f282b0365a91246578026ba8dc2de9",
      llvmSha256:
        "af3a3db876ab1199d190a3ddee5a78bc21f02127572049e6368d182fdf71152f",
      hsacoSha256:
        "7e853da0e9694dc99cebdea7248ce8175743309c10592452d05e79932716a922",
      isaSha256:
        "2785ba133d868cb0413f44859a0da6e3022fab8f186bbf977252be181d91a9e7",
      numericalResult:
        "accepted_steps exact_u32_outputs=128; committed exact_u32_outputs=128; output_state outputs=1024 max_absolute_error=1.192092896e-7",
      tolerance:
        "output state absolute tolerance 2.0e-7; zero-commit state lanes bitwise exact; metadata exact",
    },
  ),
  gfx950_qwen_ngram_gather_v1: observedAdvancedEvidence(
    {
      label: "N-gram gather",
      symbol: "gfx950_qwen_ngram_gather_v1",
      runnerPath:
        "examples/gfx950_advanced_systems/run-qwen-ngram-gather-gfx950.sh",
      hardwareTest: "gfx950_qwen_ngram_gather_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "gfx950_qwen_ngram_gather_v1 symbol",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 96,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace:
        "cf9e82fc336e94af81b661021e263aa3bd44bc00c07f543790f14573c331f063",
      llvmSha256:
        "929721470d4ae8afa4b98c5b87583707b6c8e49df1f16606233f8b6ffc4b12af",
      hsacoSha256:
        "f948126ccf46e8b0a7fca47c126a13966b9f70b63e68ed5a00ee94284bc623b2",
      isaSha256:
        "139e6854065e4042576a14595f4fd0681147a7b74061c3eff0a4e6fde41825a9",
      numericalResult: "output exact_i32_outputs=128",
      tolerance: "all 128 gathered values exact",
    },
  ),
  gfx950_stage_gradient_shard_v1: observedAdvancedEvidence(
    {
      label: "gradient shard staging",
      symbol: "gfx950_stage_gradient_shard_v1",
      runnerPath:
        "examples/gfx950_advanced_systems/run-stage-gradient-shard-gfx950.sh",
      hardwareTest:
        "gfx950_stage_gradient_shard_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "gfx950_stage_gradient_shard_v1 symbol",
        "no MFMA or transpose instructions",
      ],
      kernargBytes: 32,
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace:
        "e762db1956bdf059b71cd68c7ccc7b6821626733e2a1c0dba04a9d9497c72ee4",
      llvmSha256:
        "bdcf61c21fdf363c5306c2ceaf0b0c492504375a13e83069acfe2bd13ff4da9d",
      hsacoSha256:
        "b095c06802edc03bf5a42ae4ac7f1f71173add1990120c047bd80c50e4021a3b",
      isaSha256:
        "e635a9427aba19635c1284dfa0a30e768cf1f2ee5958e8ff0c5a9a629ad39bc8",
      numericalResult:
        "two shard launches; output outputs=256 max_absolute_error=0 for each launch",
      tolerance: "all 512 staged FP32 elements bitwise exact",
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
      workgroupSize: 256,
    },
    {
      ...finalMi350Campaign,
      namespace:
        "4f0a63ee8c2945bec7e91a08246dc084e4c914358ed436fd50b8cf0c1ae65c09",
      llvmSha256:
        "6b4ec355f71143806d26f2d4eb4ce19b3601764b0475fabfd0dedea3f1dc037f",
      hsacoSha256:
        "b32da414bc18cfa84aa725b691d445d3a919d9758f6cd5846f02704ee8f1fe83",
      isaSha256:
        "a43edf458b9ab7da395544ef9b1b05361170fa7ad8ac70974eb1e83cc634bac2",
      numericalResult:
        "output outputs=256 max_absolute_error=7.450580597e-9; output_norm outputs=16 max_absolute_error=5.960464478e-8",
      tolerance:
        "absolute tolerance 2.0e-6 for update and norm; finite values required",
    },
  ),
  gfx950_gpt_oss_120b_decode_megakernel_v1: observedAdvancedEvidence(
    {
      label: "gpt-oss-120b 16-item layer-tile megakernel",
      symbol: "gfx950_gpt_oss_120b_decode_megakernel_v1",
      runnerPath: "examples/gfx950_gpt_oss_decode/run-gfx950.sh",
      hardwareTest: "gfx950_gpt_oss_layer_tile_rust_cov6_matches_cpu_reference",
      requiredIsa: [
        "exactly four v_mfma_f32_16x16x16_bf16",
        "exactly four v_mfma_f32_16x16x128_f8f6f4 with FP4 selectors",
        "no transpose instructions",
      ],
      kernargBytes: 208,
      workgroupSize: 256,
    },
    {
      ...gptOssMultiGridCampaign,
      namespace:
        "7194a44ee0231763c5f1e345dcb682beb0922ede14a8ce1899d41b44b2b053d0",
      llvmSha256:
        "ae9301289f784ed43a906b8e5c2165176deca52b0d629445726e9128b94c3e12",
      hsacoSha256:
        "d6b2f1b54b0398cceb751d4e4a70a42b74efe368e9fbc892283a72952013daec",
      isaSha256:
        "f52d49e23917bc11ac4b2ea1f3d8205d200b9d6ed7365350fc1189392ee837d5",
      numericalResult:
        "attention outputs=4096 max_absolute_error=1.192092896e-7; expert outputs=4096 exact; packed top-4 exact_u32_outputs=1024",
      tolerance:
        "attention absolute tolerance 3.0e-3 with finite values; expert and packed top-4 exact",
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
