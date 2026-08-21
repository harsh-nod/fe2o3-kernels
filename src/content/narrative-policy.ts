import { deepFreeze } from "./registry";

// Registry additions require an explicit ID, lesson-order entry, and reviewed SHA-256.
export const narrativeIds = deepFreeze([
  "read-the-evidence/labels",
  "read-the-evidence/differentiator",
  "read-the-evidence/compiler-refactor",
  "read-the-evidence/scalar-gemm-checkpoint",
  "read-the-evidence/moe-bounded-evidence",
  "gfx942-setup/toolchain",
  "gfx942-setup/sequence",
  "first-fill/kernel-shape",
  "first-fill/trust",
  "typed-vecadd/same-body",
  "typed-vecadd/typed-host",
  "verus-contracts/contract-shape",
  "verus-contracts/negative",
  "memory-race-proof/regions",
  "memory-race-proof/dynamic-join",
  "reductions-scans/scope",
  "reductions-scans/scan",
  "lds-barriers-atomics/epochs",
  "lds-barriers-atomics/atomics",
  "gemm-tiling/public-layout-proof",
  "gemm-tiling/general-contract",
  "gemm-tiling/semantic-failures",
  "gemm-tiling/mapping",
  "gemm-tiling/loop-proof",
  "gemm-proof-plan/proof-ledger",
  "gemm-proof-plan/evidence",
  "softmax-invariant/spec",
  "softmax-invariant/proof",
  "flash-attention/online",
  "flash-attention/effects",
  "flash-attention/closure",
  "moe-routing/assumptions",
  "moe-routing/permutation",
  "moe-expert-compute/composition",
  "moe-expert-compute/combine",
  "moe-expert-compute/bounded-evidence",
  "evidence-pipeline/chain",
  "evidence-pipeline/why-direct",
  "what-verus-proves/proved",
  "what-verus-proves/ecosystem",
  "exercise-ladder/beginner",
  "exercise-ladder/advanced",
  "contributing-kernel/checklist",
  "contributing-kernel/review"
] as const);

export type NarrativeId = (typeof narrativeIds)[number];

export const narrativeOrderByLesson = deepFreeze({
  "read-the-evidence": [
    "read-the-evidence/labels",
    "read-the-evidence/differentiator",
    "read-the-evidence/compiler-refactor",
    "read-the-evidence/scalar-gemm-checkpoint",
    "read-the-evidence/moe-bounded-evidence"
  ],
  "gfx942-setup": [
    "gfx942-setup/toolchain",
    "gfx942-setup/sequence"
  ],
  "first-fill": [
    "first-fill/kernel-shape",
    "first-fill/trust"
  ],
  "typed-vecadd": [
    "typed-vecadd/same-body",
    "typed-vecadd/typed-host"
  ],
  "verus-contracts": [
    "verus-contracts/contract-shape",
    "verus-contracts/negative"
  ],
  "memory-race-proof": [
    "memory-race-proof/regions",
    "memory-race-proof/dynamic-join"
  ],
  "reductions-scans": [
    "reductions-scans/scope",
    "reductions-scans/scan"
  ],
  "lds-barriers-atomics": [
    "lds-barriers-atomics/epochs",
    "lds-barriers-atomics/atomics"
  ],
  "gemm-tiling": [
    "gemm-tiling/public-layout-proof",
    "gemm-tiling/general-contract",
    "gemm-tiling/semantic-failures",
    "gemm-tiling/mapping",
    "gemm-tiling/loop-proof"
  ],
  "gemm-proof-plan": [
    "gemm-proof-plan/proof-ledger",
    "gemm-proof-plan/evidence"
  ],
  "softmax-invariant": [
    "softmax-invariant/spec",
    "softmax-invariant/proof"
  ],
  "flash-attention": [
    "flash-attention/online",
    "flash-attention/effects",
    "flash-attention/closure"
  ],
  "moe-routing": [
    "moe-routing/assumptions",
    "moe-routing/permutation"
  ],
  "moe-expert-compute": [
    "moe-expert-compute/composition",
    "moe-expert-compute/combine",
    "moe-expert-compute/bounded-evidence"
  ],
  "evidence-pipeline": [
    "evidence-pipeline/chain",
    "evidence-pipeline/why-direct"
  ],
  "what-verus-proves": [
    "what-verus-proves/proved",
    "what-verus-proves/ecosystem"
  ],
  "exercise-ladder": [
    "exercise-ladder/beginner",
    "exercise-ladder/advanced"
  ],
  "contributing-kernel": [
    "contributing-kernel/checklist",
    "contributing-kernel/review"
  ]
} satisfies Record<string, readonly NarrativeId[]>);

export const stagedEvidenceLessonIds = deepFreeze([
  "read-the-evidence",
  "gemm-tiling",
] as const);

export const narrativeFingerprints = deepFreeze({
  "read-the-evidence/labels": "ba7a316b9d4c6be7eeeb9bfbe48b6e9580a20f12d9fd934ab5d2a6fc7b74b8bb",
  "read-the-evidence/differentiator": "7d4f9897c50993ecbe6e8d9f94162e6cf649f669f1f555627f9d2df5cb0147d7",
  "read-the-evidence/compiler-refactor": "b9b2de157842c4626cf236431e29e677d316ec7156189d507330891db4d409df",
  "read-the-evidence/scalar-gemm-checkpoint": "2cd7ff10ea3cd570f50cb6b5c65474c64beca952a298244a68e530233413e585",
  "read-the-evidence/moe-bounded-evidence": "dbd3365e78d1b08d60b330328166e39fe46b1d7174d6ec0ca46811542757e361",
  "gfx942-setup/toolchain": "bde4a23bc51376d828c8b910ab8048c988c7f838736f1d309bea0294fde84ef3",
  "gfx942-setup/sequence": "00a0689fb93a27622076f9bd21c5fb8c0b78c57d88d79dc8db0bfb86596315da",
  "first-fill/kernel-shape": "ad9c0b9744f9494313d2fcc88dfb1aee778c732acc2f2414f7f2712ac27cea6f",
  "first-fill/trust": "e8e35a73d58e59831b23c8bf97cc3b80fe539740444c0146995c3564699cd594",
  "typed-vecadd/same-body": "f13736ba4fb9726a65f1637d6658ce4ef5cdf9676ceeec1ebdea5a8728b629f8",
  "typed-vecadd/typed-host": "4533c94d3bacd2f8e2adcd64f6d534d594564ab81a4b8f6b6f628d2d22dbbe70",
  "verus-contracts/contract-shape": "6f0bce0ee5e7ee41dc19f9f0ed3b59e2c2238562ceac22380381454002d86ad1",
  "verus-contracts/negative": "38875c71f6dd93237a558f59db083e9eb48b93d9407fa23f210d3dfd14c379ca",
  "memory-race-proof/regions": "e197e757e5e41a147309534e0659e257209745bcef5c6e11fa89d61947111835",
  "memory-race-proof/dynamic-join": "105fe75c7294f57013c1f2c1403a985908580947f9aa2b96095de318ea0cc392",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "df55d3ca07a0baaeeabc318fd03122faf68c296fd94438781a95e2549af3d6e2",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "5f9311c3a1e2b97d5be96f4fd5a3bd25535e27586bbb0949391e889e21324582",
  "gemm-tiling/public-layout-proof": "1f78d8b76a7323822d77b025a919a44fb29e64dfcd1e19c5b0d1b0776cb8bc39",
  "gemm-tiling/general-contract": "fea50ac7ad00b7cebe61da4a990b64b9d9daffbf63a19cb357ea6f919517f2a9",
  "gemm-tiling/semantic-failures": "8deb7ef41b629fa6038f06223d90d2b7cf9dd15d74119aadaa5a59579aa3820a",
  "gemm-tiling/mapping": "c2b015fa509dd2976748c2de7de3a0e5165ab33e3c83e3948700ce2f49654cf0",
  "gemm-tiling/loop-proof": "7c87b0639046276d51e796d2ea61e72401c97dbd89043505de446adb6a6d2d05",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "f0dbe006815f0933162a243dd2f0a83e014a73444615e9e90e2501b6d9646ba5",
  "softmax-invariant/spec": "940ca431bc57781cf80ebe66e07018cff25ca57628d123827b1e9763af982482",
  "softmax-invariant/proof": "4a3721707b2c4fb2a50fee5a5e7f0a6e5dccf47eeb629d3bccfd80efcb4116a1",
  "flash-attention/online": "9aff5030cf5ec22e10819e5fcec50a5fe42dd1deb00e43e73eaaeb5f48e414c1",
  "flash-attention/effects": "19ade582a57bbd297d0cf364fbc74512368dcada7947a951a872d83194db8d43",
  "flash-attention/closure": "9dd3ddfcf762e212a980f1fc08dc0e60b90ed02433cb1ffbfc68105f78f0ae3c",
  "moe-routing/assumptions": "3aa6bdd2cb216abb606346fcc769e518a94b9f36e8952d20bd4306165acaa8f4",
  "moe-routing/permutation": "59d0d30d3a7d631aa2722d78639c0c1d69fc8f619c0d7eb96bb3ea5a5e7dae56",
  "moe-expert-compute/composition": "9aab7c463171447c8f914db0df7e2444361a11942f1d47b817aeea0977575c32",
  "moe-expert-compute/combine": "697de91306b180d91e1eb672ff3bc28c9ce4f02c5542d4fa6f2a1ce7820e6ad6",
  "moe-expert-compute/bounded-evidence": "2dc95c2f5f1d5be75efb5bd95b440f3fe487a9438c49f2ecaf6f7bab7f6900fb",
  "evidence-pipeline/chain": "621e2f455016f7893d96eeb3a77d61136532c2c6acca35fc701123831221b320",
  "evidence-pipeline/why-direct": "f18b5450d768ca8aa846f5d5a02a9b9a46eeba5ead79253b0c7aa682de66d947",
  "what-verus-proves/proved": "5d3d102e616652b33c16f41ee786a5806cb89f12b99db5483372c714023dc857",
  "what-verus-proves/ecosystem": "2e3820af5e94075d1cb666d85e12cea3990aa9009a81494e1d5769bad4e8d9b3",
  "exercise-ladder/beginner": "8bf6d0afffdeb372df635265ab58dc5618ed72ae3c36840210665ae6dc12af67",
  "exercise-ladder/advanced": "9ab054160ebcd2cc8b3a744686102c9e0d62da2bcebad1fb3155639e16ffd16a",
  "contributing-kernel/checklist": "3655a026b9d3851266779266faf0ab4d405fc00172e4e6cdeb3424381ed08b02",
  "contributing-kernel/review": "9b62429c8ac23851756fdbe8c218b7e32a2e86cceaf21380cdd53182b467a856"
} satisfies Record<NarrativeId, string>);
