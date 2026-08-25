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
  "read-the-evidence/semantic-correctness-milestone": "e5fd730b9da56bbc41b7267746f8e94db0f7dfdadded96f28e420c1f89132bb1",
  "gfx942-setup/semantic-gates": "56feff127c2bca6896ebf7671d9f15570d11fce910bdc9fef43920d98fd04242",
  "first-fill/total-output-coverage": "6910fb57d2546350d84fec24f32e4377e2d757432ab8b014a1bae26a4b2ac515",
  "typed-vecadd/typed-arithmetic-contract": "f6b60735f8bdcb2e5e703c9147bafde93c4ff822a388502cbca14fc5f199b71e",
  "cpu-semantic-simulation/testing-is-not-proof": "18846a9284030dca1554c510c1bdba8998754887a0ed877695572727573a0ede",
  "verus-contracts/compositional-reference": "fcdb7c12aa55a1ba095d8f5588ddd9845df20b3ce9ff2b3d75faf4842b28f90f",
  "memory-race-proof/finality-and-frame": "ec44033afef900cf14d269cdf935ff6f9c26be0906ed48223a00fd728400cc9c",
  "compiler-checks/complete-correctness-catalog": "79553c984d147eaa10302376a3b30d6ae6c54e1937420938bbda522b0805e5ee",
  "reductions-scans/contribution-domain": "5db301562810d21036f39d26eea5afc0fec5aa5ba67420225a9f29c412516950",
  "lds-barriers-atomics/final-observable-effect": "38b62b5c26737af0ae9ab6424d15152e09cde81dd35031410b399e386ace4002",
  "gemm-tiling/composed-reference": "5036e2bddd4d1a17d395f3c9bff4c4a03f6a1383d05564d0cd1fb65358b0ea1c",
  "gemm-proof-plan/total-correctness-boundary": "3665466f9a47eeca3d0a6f41ffa1028118f867351fc08b75e318e8bd2c307be9",
  "softmax-invariant/composed-reference": "8245df0a06b3f754645f9b5a7dda6c9d503c61e9c30c6a71c278112ff877d4b9",
  "flash-attention/composed-reference": "d4f034c3f9112502c93fd60405e5cc6ccfde5b2ebd884efa9546faef27b48a4b",
  "moe-routing/composed-reference": "6706bc5368e23d71c209d8442b6a8dad98bc00d51d6e743aeada8318af193c55",
  "moe-expert-compute/composed-reference": "9ce9e8a20b3fcd373e4ad32bee8c8c97f174aa951b4be0c96c9700e29a1c7181",
  "evidence-pipeline/total-correctness-receipt": "4a40a0f2dd6a8ecc65ccc2853fcbff42580dec89134aae9d3fad7c6ae3e840ea",
  "what-verus-proves/total-correctness-boundary": "1bf489ee112e464b12fa4da3c394df473234771e4ca09a4d076002b4d6024dc0",
  "evidence-archive/non-retroactive-milestone": "0eb725b9dc6716f6c75b850a247d308917ebeef850bb02f8369b4f2868cf8a92",
  "exercise-ladder/semantic-correctness": "3e04dc90a00e9acaac4391f257286320e6f131bfacf331e183f93815cecc8569",
  "contributing-kernel/semantic-contract-checklist": "e94cfd0166d360b7ea89e76a00abc54b182b8d893ec385b850a655e11520ba04"
} satisfies Record<NarrativeId, string>);
