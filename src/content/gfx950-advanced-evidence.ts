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
  | PendingAdvancedRustEvidence
  | ObservedAdvancedRustEvidence;

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
  sourceCommit: "c766ca761c492c4cd188047a497664f6b2ade278",
  sourceTree: "cbda6eba10b34acb3eec93c6e504462fca3c8705",
  runtimeObservation:
    "observed 2026-08-30 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; gfx950-final-compatibility-c766ca761-gpu6 digest-pinned COV6 HSA harness PASS",
});

const compressedHybridPromotionCampaign = Object.freeze({
  ...finalMi350Campaign,
});

const kdaMi350Campaign = Object.freeze({
  sourceCommit: "c17b33fa7555048bd31e16d417e10f3800fa5f27",
  sourceTree: "a055ee9847dbe04bed5c81295a4da6021c14c831",
  runtimeObservation:
    "observed 2026-09-01 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; committed-source production COV6 HSA wrapper PASS",
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
      ...kdaMi350Campaign,
      namespace: "d1782f1adc5ab27a123e99a81db150a6062c28f6404804282ed7210b350c8498",
      llvmSha256: "a1d364a790b3fb8f7bb34b20b0fee237779d40ef4fce96b36c18685e5dc74b67",
      hsacoSha256: "5c67a10f5f4ad82fa99c31dd4179c7758c691dd147750e28e27f1ddfa9ce2ee7",
      isaSha256: "d147fad6526fd92c9c89e331f6f4dcc4f252ff1550745150f15addb54e08c9e1",
      numericalResult: "final_state_value_major max_absolute_error=1.490116119e-8; output_replicated max_absolute_error=3.725290298e-9",
      tolerance: "absolute tolerance 2.0e-5 for all 256 state elements and all 256 output replicas; finite values required; immutable inputs and guard canaries exact",
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
      ...kdaMi350Campaign,
      namespace: "4888a0b175bcc5b2897ba0594f0641acd700468c5302376a24463ba56eb49a56",
      llvmSha256: "7db53eedb191a5e8d23ae8a6829d9544a53ae81d2c8e5471addb89c28e66639d",
      hsacoSha256: "608d9758e1ed9470356b7e9f8b08eb2494b43a19293878277bf7740af43ff711",
      isaSha256: "9991efdf3b25819e6bc4e594f7292629a53fdebc0b7501f40b1485e75244cc44",
      numericalResult: "final_state_value_major max_absolute_error=2.980232239e-8; output_chunk0_replicated max_absolute_error=7.450580597e-9; output_chunk1_replicated max_absolute_error=7.450580597e-9",
      tolerance: "absolute tolerance 2.0e-4 for all 256 state elements and both 256-element output-replica buffers; finite values required; immutable inputs and guard canaries exact",
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
      namespace: "8e4b6794b9080758a96900d9f3bedc81f043b9c733ce0348fd3d56ab46e4ccf7",
      llvmSha256: "2ff295eec904f464d0379dc7c5ba1a0223c32689fc9699745cab969c3f4f89e7",
      hsacoSha256: "be4eb0216b5f0a8d431e4b07a61f7ab0e99dadfbaf7eca60c067088a54110a24",
      isaSha256: "af1d6c6c51d5c68d4efd50a81776e2d9a706b49485b18009bb46423c8f14c6a7",
      numericalResult: "output max_absolute_error=0.000000000e0; selected_output exact_u32_outputs=3",
      tolerance: "output absolute tolerance 5.0e-3 with finite values; selected IDs exact",
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
      workgroupSize: 64,
      ldsBytes: 0,
    },
    {
      sourceCommit: "6157061b827ed98db96722cb2fca988016fbb2ee",
      sourceTree: "32a26b37092af3cbde6552011b61df409df4c830",
      namespace: "62a1ee5804a9926ebb929061195f2229630ebdaf5a13a19d17ce7ddb4fcbbbe3",
      llvmSha256: "0767554b7997f42b4e2fb85271779ca29182ec241b07cc162cb9185cac41362c",
      hsacoSha256: "c5f5465c405306d6df944df4f02066f75b94295b7e91b8c8cf73bc16482ed930",
      isaSha256: "fa54e785c34d2ec26e94dad04a8f63ef2a68485ad9190a0ca747999216d5237a",
      numericalResult: "output max_absolute_error=2.980232239e-8; softmax_maximum max_absolute_error=2.980232239e-8; softmax_normalizer max_absolute_error=2.384185791e-7",
      tolerance: "absolute tolerance 5.0e-3 for output, maximum, and normalizer; finite values required; valid selected IDs unique and all-invalid domains rejected",
      runtimeObservation: "observed 2026-08-31 on ssh mi350 / smci350-rck-g03-b19-03 physical GPU 6 (ROCR_VISIBLE_DEVICES=6, HIP_VISIBLE_DEVICES unset); ROCm 7.2.1; Rust nightly-2026-04-03; gfx950:xnack-; Wave64; production COV6 HSA wrapper PASS",
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
      llvmSha256: "1b37ee1c28c98fa0e74c6712cf8f70eea5d39edc55ac4c97595fc2218e93aa30",
      hsacoSha256: "86cf8a4b14d4d40a241c22a0cf4488c5ce8684ecea1a4dd3ca4d70f53cc15e1a",
      isaSha256: "c671acf65d5893189a084e2bf4b0a016bee658dd380f727055c730eee79f5d56",
      numericalResult: "output max_absolute_error=5.960464478e-8",
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
      namespace: "0f1b91664465bf059b47aa1fda8168a1cb4901cbfb81fd4dc770184520fca412",
      llvmSha256: "7752d78ffeb52c737ce52b46ab0c2d457fc66dfa642f2d7916465b21cbf32249",
      hsacoSha256: "f3ab4ebd7b8f2310918eada0d8b90efd57c281914bbac91499040417f5c4a2e6",
      isaSha256: "c135a286829e0513f6b10815b63616e6770d89dadf6b16bf0864f2cf8bcda6b6",
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
      namespace: "5a21124887ab5e89f2893f9a688ddc75efe2cf1c40dfda56be36acb530d69326",
      llvmSha256: "aa9fc3a4fb302c7e8f9f2ec00fb122f98216357957ed2bf914a51b1ee15d8ec7",
      hsacoSha256: "190ce48f1172f15b3827b1220ad6ee190087ad4be52892946eff26cfea168ec0",
      isaSha256: "d3641b00c44748decbb0d53a83018b9f4f2e1c88b89b23adf644dc6ce972a431",
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
      namespace: "e2bce999a5fa1929fa89c847d6dade5511566efd3cffca3003a77d00e870fdbf",
      llvmSha256: "7a9095ce73e881ca4199f5b95bfdb55feb64845664435716343b26af11682cdb",
      hsacoSha256: "f463b05e53db65c4e9ea73a0d33ce1398c85bcc8b5aab64788fdeb7858c9fdcc",
      isaSha256: "c063e5fba4347499a02c9c3197fee427beaea07e910bf39e698f51a53e6da236",
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
      llvmSha256: "236742e3c269b84917ef8538f2a2364e391a718404bf18affbabd337127cd3da",
      hsacoSha256: "6d766905e6a7acbd7587a9b0c1bdf120db7e0ae7c765c567f4be9c4deedef0fe",
      isaSha256: "1713fc61f132a45a580973476fa864197ed355466a3a5b3ff94bd119c4ba22a3",
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
      llvmSha256: "25546d6c8107e1d554146247bc38612d74c2eb15918c7b4ec79c89485320584f",
      hsacoSha256: "9e875ff1940dbac2839270faf219c8781e168559f6520071f7ec6f9714fea1ca",
      isaSha256: "b9860d8a74f01f7490381c715719e17ae6e742295bf19dd9ccf946708cb41bd9",
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
      llvmSha256: "4e33fea0a38b028bc1e3804f8abb7d54ccd125fd6b539c6d74633a07f90763ca",
      hsacoSha256: "fdd9cc5f181800f7e68ca05ddb93031a851a567955a35909daee72fbe99a64f5",
      isaSha256: "c5f1c6260a1515294413ad53d44b795ece43ad362d96a1c74f3a0a168aaf4f1a",
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
      llvmSha256: "0cad13668a48fdae5b06c3fb7ad222651b8625955c1f8af3b764b5b9a7f8e9bb",
      hsacoSha256: "5074044f3b46e0b04d24b066cfc23877df312d093dec151c75e3d126d36bbfde",
      isaSha256: "40fb5eff8d22c9f34f7ef9354e35b7392900c3b81871f11795eebf0f989a9da3",
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
      llvmSha256: "892ce3aec5a1c825b9857411e9380e6f86af22c53a13ed14e131a451f67d7441",
      hsacoSha256: "98c846c2fdf20cdc935d955f5b14253e878e1c4b1ee1ef1c2bf772470a13a8c4",
      isaSha256: "3a2812cbd9f684d28adcf0a09cb15ad98b423ca8df43afccdd7da0e2ddb530fd",
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
      llvmSha256: "13f588dd88d76ea8053aaf9848e7ad073264233b471c735f1a31268c0ef16b63",
      hsacoSha256: "ac52b38973af23d63dbb05f6edd0ceea5caa92f1f331318d95fe7d62d5b251ce",
      isaSha256: "cd61a1115bcba6e465bd77ab9ce291fe2e5a157c7e4567f4ae617ba2161e85f0",
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
      llvmSha256: "eaa43985cf60aa4f220f86d2f762364a02185a9b544e6d1e6dec77f8a024da91",
      hsacoSha256: "bb6e61181e05244a71b6475bcc34a6a0c62d94147bbe27304287f71d8181fe5d",
      isaSha256: "a37e7395089d1c94a884506af9fd388fa0566ee516f681af9f85eb78c01338da",
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
      llvmSha256: "827dd2a5e614efccd5fd9c75a3a51dcd380ad3b2315a2852ce90c3d9e8e5ce79",
      hsacoSha256: "b021635066f0a41c62e81da95225d245e5ba9d0f87b5c49d376d880c506f90bc",
      isaSha256: "c166782bcef26c424822b97ea3feae707a0b629d4ee2488e7b24671e81275b55",
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
