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
  "contributing-kernel/semantic-contract-checklist",
  "gfx950-fp4-gemm/prerequisites",
  "gfx950-fp4-gemm/tile-accumulator",
  "gfx950-fp8-gemm/format-layout",
  "gfx950-fp8-gemm/tile-accumulator",
  "gfx950-fp4-attention/transpose-pipeline",
  "gfx950-fp4-attention/online-softmax",
  "gfx950-fp8-attention/transpose-pipeline",
  "gfx950-fp8-attention/evidence-boundary",
  "gfx950-advanced-moe/fixed-pipeline",
  "gfx950-advanced-moe/scope-evidence",
  "gfx950-kda-gdn-linear-attention/recurrence",
  "gfx950-kda-gdn-linear-attention/scope-evidence",
  "gfx950-indexed-sparse-attention/index-contract",
  "gfx950-indexed-sparse-attention/scope-evidence",
  "gfx950-deepseek-sparse-attention/selected-domain",
  "gfx950-deepseek-sparse-attention/scope-evidence",
  "gfx950-compressed-hybrid-attention/fusion-contract",
  "gfx950-compressed-hybrid-attention/scope-evidence",
  "gfx950-attnres-gr-mhc/mixing-contract",
  "gfx950-attnres-gr-mhc/scope-evidence",
  "gfx950-speculative-mtp-verification/prefix-contract",
  "gfx950-speculative-mtp-verification/scope-evidence",
  "gfx950-ngram-embedding-gather/gather-contract",
  "gfx950-ngram-embedding-gather/scope-evidence",
  "gfx950-muon-optimizer/update-contract",
  "gfx950-muon-optimizer/scope-evidence",
  "gfx950-gpt-oss-120b-megakernel/layer-tile-contract",
  "gfx950-gpt-oss-120b-megakernel/performance-boundary"
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
  ],
  "gfx950-fp4-gemm": [
    "gfx950-fp4-gemm/prerequisites",
    "gfx950-fp4-gemm/tile-accumulator"
  ],
  "gfx950-fp8-gemm": [
    "gfx950-fp8-gemm/format-layout",
    "gfx950-fp8-gemm/tile-accumulator"
  ],
  "gfx950-fp4-attention": [
    "gfx950-fp4-attention/transpose-pipeline",
    "gfx950-fp4-attention/online-softmax"
  ],
  "gfx950-fp8-attention": [
    "gfx950-fp8-attention/transpose-pipeline",
    "gfx950-fp8-attention/evidence-boundary"
  ],
  "gfx950-advanced-moe": [
    "gfx950-advanced-moe/fixed-pipeline",
    "gfx950-advanced-moe/scope-evidence"
  ],
  "gfx950-kda-gdn-linear-attention": [
    "gfx950-kda-gdn-linear-attention/recurrence",
    "gfx950-kda-gdn-linear-attention/scope-evidence"
  ],
  "gfx950-indexed-sparse-attention": [
    "gfx950-indexed-sparse-attention/index-contract",
    "gfx950-indexed-sparse-attention/scope-evidence"
  ],
  "gfx950-deepseek-sparse-attention": [
    "gfx950-deepseek-sparse-attention/selected-domain",
    "gfx950-deepseek-sparse-attention/scope-evidence"
  ],
  "gfx950-compressed-hybrid-attention": [
    "gfx950-compressed-hybrid-attention/fusion-contract",
    "gfx950-compressed-hybrid-attention/scope-evidence"
  ],
  "gfx950-attnres-gr-mhc": [
    "gfx950-attnres-gr-mhc/mixing-contract",
    "gfx950-attnres-gr-mhc/scope-evidence"
  ],
  "gfx950-speculative-mtp-verification": [
    "gfx950-speculative-mtp-verification/prefix-contract",
    "gfx950-speculative-mtp-verification/scope-evidence"
  ],
  "gfx950-ngram-embedding-gather": [
    "gfx950-ngram-embedding-gather/gather-contract",
    "gfx950-ngram-embedding-gather/scope-evidence"
  ],
  "gfx950-muon-optimizer": [
    "gfx950-muon-optimizer/update-contract",
    "gfx950-muon-optimizer/scope-evidence"
  ],
  "gfx950-gpt-oss-120b-megakernel": [
    "gfx950-gpt-oss-120b-megakernel/layer-tile-contract",
    "gfx950-gpt-oss-120b-megakernel/performance-boundary"
  ]
} satisfies Record<string, readonly NarrativeId[]>);

export const stagedEvidenceLessonIds = deepFreeze([
  "evidence-archive",
  "gemm-proof-plan",
] as const);

export const narrativeFingerprints = deepFreeze({
  "read-the-evidence/labels": "ba7a316b9d4c6be7eeeb9bfbe48b6e9580a20f12d9fd934ab5d2a6fc7b74b8bb",
  "read-the-evidence/differentiator": "e1873a4af9a5be85a19c85076924f286aa92a189ba6d15c00f95289e8f90ee5b",
  "read-the-evidence/compiler-refactor": "b9b2de157842c4626cf236431e29e677d316ec7156189d507330891db4d409df",
  "read-the-evidence/scalar-gemm-checkpoint": "525728531781deaeac2fb4d4cb25528e36f62cc2ef63e896714434334886100f",
  "read-the-evidence/moe-bounded-evidence": "dbd3365e78d1b08d60b330328166e39fe46b1d7174d6ec0ca46811542757e361",
  "gfx942-setup/toolchain": "177abb6646e1e8fece6f1c44328f67895a04e319e154b1fc50b10d92ff035292",
  "gfx942-setup/sequence": "d9f07ff469172b9d109a70144b390c0e60dd6794cb572b21277ec8547f33202b",
  "first-fill/kernel-shape": "ad9c0b9744f9494313d2fcc88dfb1aee778c732acc2f2414f7f2712ac27cea6f",
  "first-fill/trust": "53e785e3a4b30002ce0149a1190627aefab3923621442d274f317134e6b72a80",
  "typed-vecadd/same-body": "f13736ba4fb9726a65f1637d6658ce4ef5cdf9676ceeec1ebdea5a8728b629f8",
  "typed-vecadd/typed-host": "ff066ea1d248c592326ae6f85394a074420e735063dc73892f03e0b627e9d199",
  "cpu-semantic-simulation/pipeline": "74e50738e39425d3542c9461ad3ecc8001d506ce9bc6367ccac50a8b7d6c65c0",
  "cpu-semantic-simulation/evidence-boundary": "cbe29579d8d1b0f67e4292b3f82a88c75734d5bbd512f4594e8e8ba66273641c",
  "verus-contracts/contract-shape": "6f0bce0ee5e7ee41dc19f9f0ed3b59e2c2238562ceac22380381454002d86ad1",
  "verus-contracts/negative": "38875c71f6dd93237a558f59db083e9eb48b93d9407fa23f210d3dfd14c379ca",
  "memory-race-proof/regions": "e197e757e5e41a147309534e0659e257209745bcef5c6e11fa89d61947111835",
  "memory-race-proof/dynamic-join": "105fe75c7294f57013c1f2c1403a985908580947f9aa2b96095de318ea0cc392",
  "compiler-checks/catalog": "9e1b84fb0ec7c366d5db5af3c75076f4eda4059a33e45e995c685866d55e33d0",
  "compiler-checks/production-path": "25ccbc8d8921282ff8834af0d02ff1fdddb97f5c17ea93bccd620417f7aeddd0",
  "compiler-checks/v7-simulation": "51b77d6b117dde2b5ebb17614a74716205097d536e8992fb79244ff152af89d9",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "60963f040ac2f5145bc906991ff12bbd2af10cdfc83bc74bce24f5b0c66ba4a8",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "631bbb237c96f3dcc586e4a7c7a0d092a15f9e4e4466138bb57dda2ea25638a5",
  "gemm-tiling/public-layout-proof": "8707731332384b01039f6ea68098d9f953e7227877e750e0c4e694435cfb9997",
  "gemm-tiling/general-contract": "1b8f0e8def6ed25694e5b738f5d68bffdc97d3f72047e8bb4e549e78d29f8f8b",
  "gemm-tiling/mutation-diagnostics": "dd1fd63513d410713d5eb07248a20d32d15068894a9483a71cdbf2041f0401b2",
  "gemm-tiling/mapping": "85b8ba447e710e6bd25790156a46ee0fe717f63f251bf509cd6df233a9068b4f",
  "gemm-tiling/loop-proof": "68315eb03fd0c542ca1a68286daa841c8b6ba6302d9b41cb2c4ac114f7c1ee3d",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "961353dad93a62fb2d79e63b2f0d738b7e37814346ab4d5f9113656a9c9edbff",
  "softmax-invariant/spec": "493bdb99522133b45ed61ff2bc2d57c67ad5b730c1ee6118bde29be1c910f931",
  "softmax-invariant/proof": "1fcdc8b212488687151af2eebe67cddc47e709f751a0a302a4bc51d0bbee05f2",
  "flash-attention/online": "dcdb5fba5b78b8bef5efa9da5d2c2d8fbc56ba667460efc5869e189ef21cfcdc",
  "flash-attention/effects": "53e3d093b582cd50e04ed1b1f2c2b48591c21f36b430ced353a324cc181e3991",
  "flash-attention/closure": "f98d441b8e6107cce2e5d17964dcfdca9fd4e27674c3bd1f68b7077a8a27b182",
  "moe-routing/assumptions": "3aa6bdd2cb216abb606346fcc769e518a94b9f36e8952d20bd4306165acaa8f4",
  "moe-routing/permutation": "59d0d30d3a7d631aa2722d78639c0c1d69fc8f619c0d7eb96bb3ea5a5e7dae56",
  "moe-expert-compute/composition": "6877cfb113dfe36e7bdd01d176b7a2f57f2d56756bf60021f7f0e52265e25936",
  "moe-expert-compute/combine": "e46d0eac09365c544ad435866f3003cf59715f5c7e4041d0ff9665dcd50e0ce6",
  "moe-expert-compute/bounded-evidence": "6d46d43f8d95de36aabef885c300b70f35f4289909669a6d32c1b41991891368",
  "evidence-pipeline/chain": "621e2f455016f7893d96eeb3a77d61136532c2c6acca35fc701123831221b320",
  "evidence-pipeline/why-direct": "f18b5450d768ca8aa846f5d5a02a9b9a46eeba5ead79253b0c7aa682de66d947",
  "what-verus-proves/proved": "2a78c253e95cbf6826428001cad64656d80dff375f62e471810ec1cbb0ae5876",
  "what-verus-proves/ecosystem": "75fb0827e574d4ee621bd93e00ac330f5f1903686447fddb000abfede72d1750",
  "exercise-ladder/beginner": "8bf6d0afffdeb372df635265ab58dc5618ed72ae3c36840210665ae6dc12af67",
  "exercise-ladder/advanced": "9ab054160ebcd2cc8b3a744686102c9e0d62da2bcebad1fb3155639e16ffd16a",
  "contributing-kernel/checklist": "b8f1c1c57e8728d2cac5beb102be2c84e5a1da4c54e67e4d210bdde8ee9e4e30",
  "contributing-kernel/review": "9b62429c8ac23851756fdbe8c218b7e32a2e86cceaf21380cdd53182b467a856",
  "read-the-evidence/semantic-correctness-milestone": "f4b16a497e85dd331d159f99b4f9e8c4e31611ed19c71e8123793c179a3b29fe",
  "gfx942-setup/semantic-gates": "63b42dabd7d649a30c2b6b947787f3a9f5ff2ba8503d6884b6c2bc8107d5d45c",
  "first-fill/total-output-coverage": "04066d2033298b66a37c8297b795d41554b13dbfc9ebcbb6a53acebbfa5c4386",
  "typed-vecadd/typed-arithmetic-contract": "2e1cbce20be6ab29aef81d39d2aa105c008c0b783f501294ac9f445672bca9ee",
  "cpu-semantic-simulation/testing-is-not-proof": "3001f95740ca692514a05faafff5f3046dd49087882b911b3e5e933e5bfc0561",
  "verus-contracts/compositional-reference": "84e726aec44eb7761685df1cecefc3488d8dc7afbafea7640060426813ce7fb5",
  "memory-race-proof/finality-and-frame": "1c75cdaf49cd265272b85c08b4ef829967edbe5dc8dc6435a7fcacec36cc9e92",
  "compiler-checks/complete-correctness-catalog": "d25e7e7b83bc040cfc2d2896b70af90a1fe1c10063b9cd2da3727a301eeaa466",
  "reductions-scans/contribution-domain": "0ccd291c294b09d2e354a21cba5886d9e88a9d94b391921ae3c57db9136d43d9",
  "lds-barriers-atomics/final-observable-effect": "140cc15a0862d9af394d103efcddf8a569210e9b6c61c0f0226dcd5e4d3bb148",
  "gemm-tiling/composed-reference": "025380847137a56034578c0ebe347716977e866511bb189877255d6f8a5e30d7",
  "gemm-proof-plan/total-correctness-boundary": "80372fc7b7ccfbf5870e337dde563abef220af8a5465832822cf2b91d4fd232a",
  "softmax-invariant/composed-reference": "fcf1c49ac994b7193cbdb1c4200c958e2eaabc21be8b3cede94d22cbb7df0534",
  "flash-attention/composed-reference": "7a44d488d5146951042174a07ba3f6ca3d6cafbdcf105ca9aad6020d52e6c1ff",
  "moe-routing/composed-reference": "278f91b1cb39b941c1d9a282873722a5bc384490c46e08fd86351f007157261c",
  "moe-expert-compute/composed-reference": "30e2da37eee20c0d9f8cb817080a7cc1d51acde9c6c705af629da514c8fdb145",
  "evidence-pipeline/total-correctness-receipt": "a92dfa9329471bb35545dbb7649c67802737bc3f3a6ac2bbdffcd80bdb2d2403",
  "what-verus-proves/total-correctness-boundary": "9770408871ff12b503d1bcc96c3885986270d01374f8ac689a17ff9065420991",
  "evidence-archive/non-retroactive-milestone": "d84949070e4374bc50fcc8a169e6a39d10f878b3af2919f2d0c0bc9bdf5cfc58",
  "exercise-ladder/semantic-correctness": "0c7f91ba416b44f65a19e62acaaeca4ec153f095d30ce8e90dfc9d83433fef1a",
  "contributing-kernel/semantic-contract-checklist": "e3f0e7ee228de4744bc720d2eb045af82936738e1e9f155816b304cd3bf88a6e",
  "gfx950-fp4-gemm/prerequisites": "87ff107f09d96c5469a5851ff02f43e6579dfac43765eb432c06f14431e35d49",
  "gfx950-fp4-gemm/tile-accumulator": "8917b56e48bf58d33aa5fcbf03185874d5c0820a67a27cd49f4e7edbf010510a",
  "gfx950-fp8-gemm/format-layout": "15df0a8ff35c6bdd8e5c8e8fe854f7bddac259434c66bc75437cce8cbcb122f7",
  "gfx950-fp8-gemm/tile-accumulator": "170e86a95052ec6c9c426c00435efad97c6c094b3c7ca88710de6e690da6eee4",
  "gfx950-fp4-attention/transpose-pipeline": "5c02c1757092839feb4394d9e0d4f1216d9981e127d31b29e787a445e29f499c",
  "gfx950-fp4-attention/online-softmax": "2bdb7d2911231e2f84aff1f430e57cbd04457218edc686adcac375790bd4ab72",
  "gfx950-fp8-attention/transpose-pipeline": "0dbeef829d1da9439ffe77ca8f1fb5ae160d7584e2a7d9702c7ebf939f9f506c",
  "gfx950-fp8-attention/evidence-boundary": "e4727cade386fa749cb74e305b5ccc136dc378f13cdc93f26892149a19b29bdb",
  "gfx950-advanced-moe/fixed-pipeline": "c08b49657eb3b23e1fa420296180049c975114ee7da03cb19b817d11003d71bb",
  "gfx950-advanced-moe/scope-evidence": "0be0ac95ea221506c2b6e4f3f0f883f284a108337589c0616a56eadc3f858f53",
  "gfx950-kda-gdn-linear-attention/recurrence": "68517f13331db6304f50f0c96261d52be95af7d7660324ddf75a109cf55cf3ef",
  "gfx950-kda-gdn-linear-attention/scope-evidence": "436c86560134314117a7bad522750cdc961f632c14625e6bc3192d8028fa37fd",
  "gfx950-indexed-sparse-attention/index-contract": "dea1a54cde93fbec18cfe7482ae18e391f0d74064c5f7c81bc3f169644eb6afd",
  "gfx950-indexed-sparse-attention/scope-evidence": "acb5692f82256fca6f6b693714cf25359045f34b2b08cdbd007c2e749b33b26c",
  "gfx950-deepseek-sparse-attention/selected-domain": "f4c08bc1072e7d1fff38a3e25a86bae7f26dc0405d3185bd463c3303ad0f569d",
  "gfx950-deepseek-sparse-attention/scope-evidence": "4b824735b1dec69dcedf97f53696313c90359fa893eb0b7fec996d4be352d299",
  "gfx950-compressed-hybrid-attention/fusion-contract": "ef840e4a3e22aa5d13916c95de62f1b8f348c0b1dc723457180bbaa5e6350b1f",
  "gfx950-compressed-hybrid-attention/scope-evidence": "2b8f957a2b7948dde628e308649c1a266f7b07190b5396b051f58417fccc9481",
  "gfx950-attnres-gr-mhc/mixing-contract": "256492d391ed3e36f51e986e76d3a159f3be4c87c82adbadef4bc09a15f3c7c1",
  "gfx950-attnres-gr-mhc/scope-evidence": "213a6712aefef57ed91e5b56ec4f83a8f6f24384c7e8be7f3928ac114185edd7",
  "gfx950-speculative-mtp-verification/prefix-contract": "df9aec9a9826fcd76b9a01b4440ef4e8d7e88e30ff7dd8c3d9ea5dbd3e423a13",
  "gfx950-speculative-mtp-verification/scope-evidence": "0627eca4baa84963d6618672093189035ab0679b0d5cbcf667de6717f11a52ee",
  "gfx950-ngram-embedding-gather/gather-contract": "db4a533e14d8a8f5c22faa4fc90498f803da170da3547d6ec0ff9b4c5532e23e",
  "gfx950-ngram-embedding-gather/scope-evidence": "5aeceaaf54eb80ae29c48f5475ab21eaf9d8c1c512383ea48c3db3abbe34f278",
  "gfx950-muon-optimizer/update-contract": "3f3750b43448b83ccfdad8e5f556a414bb090056828f433cf5c39231d50e1a57",
  "gfx950-muon-optimizer/scope-evidence": "8982ac1429cc1217787962c5e97ee88959c84e9437d263b6f15434c71dcb10c6",
  "gfx950-gpt-oss-120b-megakernel/layer-tile-contract": "7657de384b9861955c299f6c3292dd85ab71258932eb974054c0b2b1cdd082a0",
  "gfx950-gpt-oss-120b-megakernel/performance-boundary": "13286f14eeca3b83f8e37062a0207a537b0b0493fa6a681e5562b26c0959f16d"
} satisfies Record<NarrativeId, string>);
