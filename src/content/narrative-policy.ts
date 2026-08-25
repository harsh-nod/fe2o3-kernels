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
  "compiler-checks/v7-simulation",
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
  "contributing-kernel/review",
  "read-the-evidence/semantic-correctness-milestone",
  "gfx942-setup/semantic-gates",
  "first-fill/total-output-coverage",
  "typed-vecadd/typed-arithmetic-contract",
  "cpu-semantic-simulation/testing-is-not-proof",
  "verus-contracts/compositional-reference",
  "memory-race-proof/finality-and-frame",
  "compiler-checks/complete-correctness-catalog",
  "reductions-scans/contribution-domain",
  "lds-barriers-atomics/final-observable-effect",
  "gemm-tiling/composed-reference",
  "gemm-proof-plan/total-correctness-boundary",
  "softmax-invariant/composed-reference",
  "flash-attention/composed-reference",
  "moe-routing/composed-reference",
  "moe-expert-compute/composed-reference",
  "evidence-pipeline/total-correctness-receipt",
  "what-verus-proves/total-correctness-boundary",
  "evidence-archive/non-retroactive-milestone",
  "exercise-ladder/semantic-correctness",
  "contributing-kernel/semantic-contract-checklist"
] as const);

export type NarrativeId = (typeof narrativeIds)[number];

export const narrativeOrderByLesson = deepFreeze({
  "read-the-evidence": [
    "read-the-evidence/labels",
    "read-the-evidence/differentiator",
    "read-the-evidence/semantic-correctness-milestone"
  ],
  "gfx942-setup": [
    "gfx942-setup/toolchain",
    "gfx942-setup/sequence",
    "gfx942-setup/semantic-gates"
  ],
  "first-fill": [
    "first-fill/kernel-shape",
    "first-fill/trust",
    "first-fill/total-output-coverage"
  ],
  "typed-vecadd": [
    "typed-vecadd/same-body",
    "typed-vecadd/typed-host",
    "typed-vecadd/typed-arithmetic-contract"
  ],
  "cpu-semantic-simulation": [
    "cpu-semantic-simulation/pipeline",
    "cpu-semantic-simulation/evidence-boundary",
    "cpu-semantic-simulation/testing-is-not-proof"
  ],
  "verus-contracts": [
    "verus-contracts/contract-shape",
    "verus-contracts/negative",
    "verus-contracts/compositional-reference"
  ],
  "memory-race-proof": [
    "memory-race-proof/regions",
    "memory-race-proof/dynamic-join",
    "memory-race-proof/finality-and-frame"
  ],
  "compiler-checks": [
    "compiler-checks/catalog",
    "compiler-checks/production-path",
    "compiler-checks/v7-simulation",
    "compiler-checks/complete-correctness-catalog"
  ],
  "reductions-scans": [
    "reductions-scans/scope",
    "reductions-scans/scan",
    "reductions-scans/contribution-domain"
  ],
  "lds-barriers-atomics": [
    "lds-barriers-atomics/epochs",
    "lds-barriers-atomics/atomics",
    "lds-barriers-atomics/final-observable-effect"
  ],
  "gemm-tiling": [
    "gemm-tiling/mapping",
    "gemm-tiling/loop-proof",
    "gemm-tiling/composed-reference"
  ],
  "gemm-proof-plan": [
    "gemm-proof-plan/proof-ledger",
    "gemm-tiling/general-contract",
    "gemm-tiling/mutation-diagnostics",
    "gemm-tiling/public-layout-proof",
    "gemm-proof-plan/evidence",
    "gemm-proof-plan/total-correctness-boundary"
  ],
  "softmax-invariant": [
    "softmax-invariant/spec",
    "softmax-invariant/proof",
    "softmax-invariant/composed-reference"
  ],
  "flash-attention": [
    "flash-attention/online",
    "flash-attention/effects",
    "flash-attention/closure",
    "flash-attention/composed-reference"
  ],
  "moe-routing": [
    "moe-routing/assumptions",
    "moe-routing/permutation",
    "moe-routing/composed-reference"
  ],
  "moe-expert-compute": [
    "moe-expert-compute/composition",
    "moe-expert-compute/combine",
    "moe-expert-compute/bounded-evidence",
    "moe-expert-compute/composed-reference"
  ],
  "evidence-pipeline": [
    "evidence-pipeline/chain",
    "evidence-pipeline/why-direct",
    "evidence-pipeline/total-correctness-receipt"
  ],
  "what-verus-proves": [
    "what-verus-proves/proved",
    "what-verus-proves/ecosystem",
    "what-verus-proves/total-correctness-boundary"
  ],
  "evidence-archive": [
    "read-the-evidence/compiler-refactor",
    "read-the-evidence/scalar-gemm-checkpoint",
    "read-the-evidence/moe-bounded-evidence",
    "evidence-archive/non-retroactive-milestone"
  ],
  "exercise-ladder": [
    "exercise-ladder/beginner",
    "exercise-ladder/advanced",
    "exercise-ladder/semantic-correctness"
  ],
  "contributing-kernel": [
    "contributing-kernel/checklist",
    "contributing-kernel/review",
    "contributing-kernel/semantic-contract-checklist"
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
  "read-the-evidence/scalar-gemm-checkpoint": "3072ec53df686c6132605876c78cc03a14ab02951a1dbd53f89864c25f433352",
  "read-the-evidence/moe-bounded-evidence": "dbd3365e78d1b08d60b330328166e39fe46b1d7174d6ec0ca46811542757e361",
  "gfx942-setup/toolchain": "bde4a23bc51376d828c8b910ab8048c988c7f838736f1d309bea0294fde84ef3",
  "gfx942-setup/sequence": "00a0689fb93a27622076f9bd21c5fb8c0b78c57d88d79dc8db0bfb86596315da",
  "first-fill/kernel-shape": "ad9c0b9744f9494313d2fcc88dfb1aee778c732acc2f2414f7f2712ac27cea6f",
  "first-fill/trust": "e8e35a73d58e59831b23c8bf97cc3b80fe539740444c0146995c3564699cd594",
  "typed-vecadd/same-body": "f13736ba4fb9726a65f1637d6658ce4ef5cdf9676ceeec1ebdea5a8728b629f8",
  "typed-vecadd/typed-host": "4533c94d3bacd2f8e2adcd64f6d534d594564ab81a4b8f6b6f628d2d22dbbe70",
  "cpu-semantic-simulation/pipeline": "f7d61991560285f13300f0b306706cad46b1fc6a5282aa5c394737fdd5d1f00e",
  "cpu-semantic-simulation/evidence-boundary": "b5b24011b7e8a35fe0c545a3b4a7594acad0ade957e44dd881ffb71251d57a5d",
  "verus-contracts/contract-shape": "6f0bce0ee5e7ee41dc19f9f0ed3b59e2c2238562ceac22380381454002d86ad1",
  "verus-contracts/negative": "38875c71f6dd93237a558f59db083e9eb48b93d9407fa23f210d3dfd14c379ca",
  "memory-race-proof/regions": "e197e757e5e41a147309534e0659e257209745bcef5c6e11fa89d61947111835",
  "memory-race-proof/dynamic-join": "105fe75c7294f57013c1f2c1403a985908580947f9aa2b96095de318ea0cc392",
  "compiler-checks/catalog": "3356005cf81e432257158ef5ed8816af2bf36eaa9f1cf6eb9ba5807e0c374001",
  "compiler-checks/production-path": "565a195b23db4fc609b1c386f1b4b13b0f58ebfd7a172a442412a689f572b26c",
  "compiler-checks/v7-simulation": "1648884b36e18ba54e8066ef32a7c3d59c48b01de54fd6610695074b1fdc46a4",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "fb4f1ffb04804cbf182657612798edb05be441d3cd56f9c5b6b8a4fbab8e7df1",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "c4ca748c38ac5e5e4e5b3054265b25bda631c86ebb74348dacf69d074bf96bd5",
  "gemm-tiling/public-layout-proof": "1f78d8b76a7323822d77b025a919a44fb29e64dfcd1e19c5b0d1b0776cb8bc39",
  "gemm-tiling/general-contract": "2ff980b2d8e8185fe599886cb1a3beba7faae104037af9d130d4c5bdaa92484b",
  "gemm-tiling/mutation-diagnostics": "06343229f4fecd3339bd8a41cbaa0ab46215d527feca7b6b473131a696a43e56",
  "gemm-tiling/mapping": "2bc58458be611f511a12565f65b6b6db7270fa7d7b58022b75f476a569bd2c86",
  "gemm-tiling/loop-proof": "a7af9d2844e7656d6a467090c72e8a72d2d44ed557b31fcb1e9f97f1c744784b",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "f0dbe006815f0933162a243dd2f0a83e014a73444615e9e90e2501b6d9646ba5",
  "softmax-invariant/spec": "6b1ebe428fb51c5c9f2c7897a8d89681bb4c8111070069c57e3554e2561c07c5",
  "softmax-invariant/proof": "95a1cfcc9018d7f93c2e56f64f1b8a18a091844ddb5950877e8a2081915fecab",
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
  "contributing-kernel/review": "9b62429c8ac23851756fdbe8c218b7e32a2e86cceaf21380cdd53182b467a856",
  "read-the-evidence/semantic-correctness-milestone": "ae51f5154d70d19de88b9d5a0db74e9d7c39af380dfef380db639ec2051fd0a0",
  "gfx942-setup/semantic-gates": "b65f1b6c2f70c70f481c2b86c98c5c92ed9cef24c97dbc63d1db748c90435d80",
  "first-fill/total-output-coverage": "543d10ba05354550e0c9063735ff1b4999e7c1ccf74e7ab5a48828cf4b46fce1",
  "typed-vecadd/typed-arithmetic-contract": "2f492bd62b19c1e202f111190348225fd68873c24a45c6c7256f12f7b88ed283",
  "cpu-semantic-simulation/testing-is-not-proof": "9baad287fd8d5771ef30300d7d1b044d4765d9ade6c978f94cbca07afb4b957f",
  "verus-contracts/compositional-reference": "c7e6d36d1046bf88076e175e25147159ac46c2d57b5881baf5c1e6afaa3b2886",
  "memory-race-proof/finality-and-frame": "f5c59fd30aac73b3ae279d9df51f15028e41f9f14f7bae19db5e3ee21a3abb11",
  "compiler-checks/complete-correctness-catalog": "7a9078955ccf1ba1f8440dfbc11d74b658a434856501b57d10cd12c98aee61d7",
  "reductions-scans/contribution-domain": "04dbadb90742a8825e880dff08b651cc835fc085151691cee4e64ba4e017cdd0",
  "lds-barriers-atomics/final-observable-effect": "4de012198138923a2d79b9acf27fd04a9cef51e8e66b01c0f27a08af573f8943",
  "gemm-tiling/composed-reference": "18decab718ae71a20cd2bc6da7897f1a5aad757cc2048296838c5308e8fe4ccc",
  "gemm-proof-plan/total-correctness-boundary": "e74f95ef710a1794284689e99e3a62f69bb4ee3c5f43627d14d187592429eab1",
  "softmax-invariant/composed-reference": "78ea1fb2160b9f139880e4cafc27e8efa01dbf42b51738fc8984b0b762d71bfa",
  "flash-attention/composed-reference": "9ed52018a2113df23d487ea18a370616a4f1b3d86b0dbd064c15a96ab396b1b0",
  "moe-routing/composed-reference": "e8fc5c3fd9b649a8f2b032540b5e55cdaea14600328ec219cb88646f3811737f",
  "moe-expert-compute/composed-reference": "099ee4e7213595da819ae470005779fce974434088a2d93680a12813be87e9d9",
  "evidence-pipeline/total-correctness-receipt": "6a8678871544f56e2671827ee3b4e7f2fb4f3bd84d05e69dd9c1c80f7f0f2896",
  "what-verus-proves/total-correctness-boundary": "0e04626af07d9e18571a6bbcf118fcad06b8ebed634b8d8a29ea6b3cbaf2d101",
  "evidence-archive/non-retroactive-milestone": "f5cb79ea08291dbc034f336fb6435efa92de19835bfe281b57e3f025b7c25fc2",
  "exercise-ladder/semantic-correctness": "8f5b517f46812b8dcf393dfed67072051d558af7485692cf40cef43f2eabfda1",
  "contributing-kernel/semantic-contract-checklist": "cd5ad9c75bfa355ed004bf0deb0fb21ddc515e913e9445c6adbeee9895473d7f"
} satisfies Record<NarrativeId, string>);
