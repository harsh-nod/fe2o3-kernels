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
  "cpu-semantic-simulation/pipeline",
  "cpu-semantic-simulation/evidence-boundary",
  "verus-contracts/contract-shape",
  "verus-contracts/negative",
  "memory-race-proof/regions",
  "memory-race-proof/dynamic-join",
  "compiler-checks/catalog",
  "compiler-checks/production-path",
  "reductions-scans/scope",
  "reductions-scans/scan",
  "lds-barriers-atomics/epochs",
  "lds-barriers-atomics/atomics",
  "gemm-tiling/public-layout-proof",
  "gemm-tiling/general-contract",
  "gemm-tiling/mutation-diagnostics",
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
    "read-the-evidence/differentiator"
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
  "cpu-semantic-simulation": [
    "cpu-semantic-simulation/pipeline",
    "cpu-semantic-simulation/evidence-boundary"
  ],
  "verus-contracts": [
    "verus-contracts/contract-shape",
    "verus-contracts/negative"
  ],
  "memory-race-proof": [
    "memory-race-proof/regions",
    "memory-race-proof/dynamic-join"
  ],
  "compiler-checks": [
    "compiler-checks/catalog",
    "compiler-checks/production-path"
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
    "gemm-tiling/mapping",
    "gemm-tiling/loop-proof"
  ],
  "gemm-proof-plan": [
    "gemm-proof-plan/proof-ledger",
    "gemm-tiling/general-contract",
    "gemm-tiling/mutation-diagnostics",
    "gemm-tiling/public-layout-proof",
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
  "evidence-archive": [
    "read-the-evidence/compiler-refactor",
    "read-the-evidence/scalar-gemm-checkpoint",
    "read-the-evidence/moe-bounded-evidence"
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
  "evidence-archive",
  "gemm-proof-plan",
] as const);

export const narrativeFingerprints = deepFreeze({
  "read-the-evidence/labels": "ba7a316b9d4c6be7eeeb9bfbe48b6e9580a20f12d9fd934ab5d2a6fc7b74b8bb",
  "read-the-evidence/differentiator": "7d4f9897c50993ecbe6e8d9f94162e6cf649f669f1f555627f9d2df5cb0147d7",
  "read-the-evidence/compiler-refactor": "b9b2de157842c4626cf236431e29e677d316ec7156189d507330891db4d409df",
  "read-the-evidence/scalar-gemm-checkpoint": "90f1ecc37ead2d31a57772152ae4beb7f144b9f9f1eceb8551313eb902de6700",
  "read-the-evidence/moe-bounded-evidence": "dbd3365e78d1b08d60b330328166e39fe46b1d7174d6ec0ca46811542757e361",
  "gfx942-setup/toolchain": "bde4a23bc51376d828c8b910ab8048c988c7f838736f1d309bea0294fde84ef3",
  "gfx942-setup/sequence": "00a0689fb93a27622076f9bd21c5fb8c0b78c57d88d79dc8db0bfb86596315da",
  "first-fill/kernel-shape": "ad9c0b9744f9494313d2fcc88dfb1aee778c732acc2f2414f7f2712ac27cea6f",
  "first-fill/trust": "e8e35a73d58e59831b23c8bf97cc3b80fe539740444c0146995c3564699cd594",
  "typed-vecadd/same-body": "f13736ba4fb9726a65f1637d6658ce4ef5cdf9676ceeec1ebdea5a8728b629f8",
  "typed-vecadd/typed-host": "4533c94d3bacd2f8e2adcd64f6d534d594564ab81a4b8f6b6f628d2d22dbbe70",
  "cpu-semantic-simulation/pipeline": "5966b94d4d6f4c0b1bd86f237576ff5ccc7bfa26a4c46416c88475ea98724c77",
  "cpu-semantic-simulation/evidence-boundary": "4351299d848e5e09fb4146616ed7a4c56e51cfaf90e993526c1b4284da44e70b",
  "verus-contracts/contract-shape": "6f0bce0ee5e7ee41dc19f9f0ed3b59e2c2238562ceac22380381454002d86ad1",
  "verus-contracts/negative": "38875c71f6dd93237a558f59db083e9eb48b93d9407fa23f210d3dfd14c379ca",
  "memory-race-proof/regions": "e197e757e5e41a147309534e0659e257209745bcef5c6e11fa89d61947111835",
  "memory-race-proof/dynamic-join": "105fe75c7294f57013c1f2c1403a985908580947f9aa2b96095de318ea0cc392",
  "compiler-checks/catalog": "115a2e6d454d9f1ff1fbe8c238730430dc77fd003d2b4bc5e6a4436d37e66f51",
  "compiler-checks/production-path": "5e440854810d095cff825de887bfd5189363295bbbb62d73359165739279731e",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "2694b624faa9d51616967d5e54166dede88ebc26408b5fff1dd570387228536b",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "d684bb507dfe7c741681705c4f5de5d145b49b0ec3dea7a7ac3e30a16b5cb19a",
  "gemm-tiling/public-layout-proof": "1f78d8b76a7323822d77b025a919a44fb29e64dfcd1e19c5b0d1b0776cb8bc39",
  "gemm-tiling/general-contract": "e1fdaa939306dfa48e7bbc8f373a1c6e6be97e46043551f86d8f2a7df8ca8811",
  "gemm-tiling/mutation-diagnostics": "06343229f4fecd3339bd8a41cbaa0ab46215d527feca7b6b473131a696a43e56",
  "gemm-tiling/mapping": "b6b2139de40ddeb7fd5248e47e1b539dc0639fc8996e1f4b514e702b081c103f",
  "gemm-tiling/loop-proof": "56dc6529a608573071ac53444a7f68552e3ae559ac472c1d8fc8e6bae7308cd4",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "f0dbe006815f0933162a243dd2f0a83e014a73444615e9e90e2501b6d9646ba5",
  "softmax-invariant/spec": "6b1ebe428fb51c5c9f2c7897a8d89681bb4c8111070069c57e3554e2561c07c5",
  "softmax-invariant/proof": "e93c7bf421b973986f40ccfd6442640be17c7636e3328a327a9c1664d1c2d44a",
  "flash-attention/online": "42b54d5b9dade5a14e708a3d3db9179b9cddccd3fe1c63b8eb1774d0cc9cccab",
  "flash-attention/effects": "dec7a14c01e1f27c8cdae8f2bca1670775a4ee2fbcb4a50dfc0846b89d4f99d3",
  "flash-attention/closure": "d448209dc48bd0bfbaa296e9ec316810f0131c4bd129be23d3c18ad41a4f5a6b",
  "moe-routing/assumptions": "3aa6bdd2cb216abb606346fcc769e518a94b9f36e8952d20bd4306165acaa8f4",
  "moe-routing/permutation": "59d0d30d3a7d631aa2722d78639c0c1d69fc8f619c0d7eb96bb3ea5a5e7dae56",
  "moe-expert-compute/composition": "426c9e94f9db311393d9189ba9e2730c60565470433b57e5b43575362032cb90",
  "moe-expert-compute/combine": "6f7b4e46fed58b0f9eeb32c438047ae6d1ada44a948cf87bbd7e856d47b80610",
  "moe-expert-compute/bounded-evidence": "c6409baed064b195da4e6091d260830d5ae58de8d0f358dabd1cb716e71104d6",
  "evidence-pipeline/chain": "621e2f455016f7893d96eeb3a77d61136532c2c6acca35fc701123831221b320",
  "evidence-pipeline/why-direct": "f18b5450d768ca8aa846f5d5a02a9b9a46eeba5ead79253b0c7aa682de66d947",
  "what-verus-proves/proved": "5d3d102e616652b33c16f41ee786a5806cb89f12b99db5483372c714023dc857",
  "what-verus-proves/ecosystem": "2e3820af5e94075d1cb666d85e12cea3990aa9009a81494e1d5769bad4e8d9b3",
  "exercise-ladder/beginner": "8bf6d0afffdeb372df635265ab58dc5618ed72ae3c36840210665ae6dc12af67",
  "exercise-ladder/advanced": "9ab054160ebcd2cc8b3a744686102c9e0d62da2bcebad1fb3155639e16ffd16a",
  "contributing-kernel/checklist": "3655a026b9d3851266779266faf0ab4d405fc00172e4e6cdeb3424381ed08b02",
  "contributing-kernel/review": "9b62429c8ac23851756fdbe8c218b7e32a2e86cceaf21380cdd53182b467a856"
} satisfies Record<NarrativeId, string>);
