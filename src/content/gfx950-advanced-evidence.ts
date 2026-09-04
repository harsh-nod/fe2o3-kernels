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
  sourceCommit: "9006001157e2c3062e44088634e467b0f8963ee0",
  sourceTree: "874a9a250f904e3229410e0d620cfcecaab3f49d",
  runtimeObservation:
    "observed 2026-09-04 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; WG256/grid4 production COV6 HSA correctness campaign PASS",
});

const attentionMultiGridCampaign = Object.freeze({
  sourceCommit: finalMi350Campaign.sourceCommit,
  sourceTree: finalMi350Campaign.sourceTree,
  runtimeObservation:
    "observed 2026-09-04 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; WG256/grid4 production COV6 HSA correctness campaign PASS",
});

// The compiler binding below authenticates the exact validated source closure;
// do not substitute the former single-wave artifact digests.
const gptOssMultiGridCampaign = Object.freeze({
  sourceCommit: finalMi350Campaign.sourceCommit,
  sourceTree: finalMi350Campaign.sourceTree,
  runtimeObservation:
    "observed 2026-09-04 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; WG256/grid4 production COV6 HSA correctness campaign PASS",
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
        "70ae8bfa1fb598c2bffdc7fda3ed924d3b1cc3f91bb4ba632324c88e45423dc3",
      hsacoSha256:
        "b28749b42385f3c08e4b8f6707cafe7f970e0ca5c7b1140741d5bd0f2a98d421",
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
        "64dff8a0d79ce14b253cc633d875a9575b3e19f8f57fba75c64d479587dc7090",
      hsacoSha256:
        "940ee8123dae9187eabb7fcc97eec6d8d9fcc63b1e78a49eb20e98421cf2e523",
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
        "4faf344e5de16a696cea4727e618e798e5e2407f02ef2dfd26781dabcf0890bc",
      hsacoSha256:
        "c97643db6675b1a771750a8d795223892ceb23df87e5a7fadea7c11d9350c139",
      isaSha256:
        "4b2919d194a1a74daafeb9b1618121f08755d9b7d28828027c340a5dc1eefab5",
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
        "e4db5c905c08f3c3a8c1dc3092d3c91b577e11685a43b4733ec9dfbcd48041a4",
      hsacoSha256:
        "7990cb59896ec32b75ebce009ec72cbf023f9ae3b673b9cc07edcf68abdf933e",
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
        "84ab660c38dcdc8b9931d4c6cdbc77c532aad3883911dbb3e3955395e85a3411",
      hsacoSha256:
        "200307b6a81f6e87c0808da7060eefb154c775c703537fabb9123b5e4aeafba3",
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
        "6adb23264b8886906b93415d3e5cf22c4e45a508ad6d914fbac129ef83a830e3",
      hsacoSha256:
        "63fed3f7542dd1f2fc392f67ee9e65c9536cc7a740f7a2f33a02a2b46837380b",
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
        "ec6a7e752985f1759e6b245d63fd521b52583b57613ebf0e2f301c101b59571c",
      hsacoSha256:
        "056fb9b88560acc5e947cfc7e6642543aa78c248d57634d127dae292b06eed46",
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
        "1327ed86eddeebbd1dac1f4f14a133a76aff8c1abfd1f20f52669be49b92cb2f",
      hsacoSha256:
        "9fc74c6174d0649aa25e46f01f4a49e96563ab2128c94490a8052e40f6385340",
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
        "b58ddffb7254f3150c5503627379b4d0a8ba68c16cf0b7b1e786a5cf008e8d94",
      hsacoSha256:
        "56633ed87ab9d74755a74f633d22bcac14abfbe6a20abbe76623b143cedf3883",
      isaSha256:
        "36a71407c4b0a429b9991980ea68e860ee8282b0cac05f05ed1850fab4d8c6fc",
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
        "7d58ec15ccfc401b717c8b8092fba69917502cdb54d263b3a7307f19b21d0420",
      hsacoSha256:
        "832457cffd1808683a4c31f126fe1aad2173e59580ab473e7be29beae28272a7",
      isaSha256:
        "9d0c9a56424e0bb04f5ec34ef8fdfad5938a75d4a3327fa193e8df5785863c4e",
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
        "7c09340baf27809f598a1806c0a22c2a3860c547eca3574aca20bbbaf9d23fcd",
      hsacoSha256:
        "cd75fbc78f6c6f0ac0baf01b9fd8674ab214d91ccc204d28fa7bd9c11203e8ef",
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
        "48b89db6afe29cffc42d3aeed7e2b1d2b0b59ca5d950e8c465b1091eb4a2f517",
      hsacoSha256:
        "fdcf54fa359091b31a7cb5e773ac0e1f0ee03ff7d0ec41ff0ff3a453eb4fdbfa",
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
        "5c554c79bd5677c6addbe122e8e959e82944c8d510319706ee2a11bdd89c63df",
      hsacoSha256:
        "8a287e4cd2f443a09c20b0c8880d99fd344df24220bdf8957f04b599b9e9ab12",
      isaSha256:
        "cf6767941d8bb3a5b21608ac653397a997ed8ba2d6a20e1432bb8f07ace0ed84",
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
        "259f2b83554f5ecab7a1e2325038475cff164f7414bd1b0ab20441724f679c55",
      hsacoSha256:
        "592c3672416d8e26ea14ff668964cb93cc00f399c7a3580c8b80ccdb7804f6e9",
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
        "424a843b2cfd51f689e2e0d793c351118f4321568394f9abf9cf2d1d55a02ead",
      hsacoSha256:
        "7511daf2e49b86fd6b6074e8f4d2f7ea0cd9ccefe49926df73ec33621438fa38",
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
        "bd012d9791b503c2fce15f033065f302c8ed3bcbf424e9bdba77dd8f47688d60",
      hsacoSha256:
        "638bfae059a6904ec8877c9d6fa83c3949e1a195ea4f02992deccd94ec1c45aa",
      isaSha256:
        "bd77ec1c3baa9401add71b6817cdf01276f89c2b62764b2b286b7cf33cb09509",
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
