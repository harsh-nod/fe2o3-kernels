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
  "read-the-evidence/scalar-gemm-checkpoint": "304cfd8dc175bbd5492eed543a8e427fd03b2c1d0bfc5d4c9568f7195df69d2f",
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
  "read-the-evidence/semantic-correctness-milestone": "762c1b3c8d2de76adbc654c8f99f13a0f06aa0213c27aaf5416daf11565de327",
  "gfx942-setup/semantic-gates": "40e9f4d2a522a1d4a44cb575e9ad0c06af729e33d35b7bd29e007ec40b03757e",
  "first-fill/total-output-coverage": "3d9f62a5b903cc8750007208b0401978aee5198cc1498f8f9569e6f224761817",
  "typed-vecadd/typed-arithmetic-contract": "b810aa13d511040920ab2259bf32c578f7e95d9a5698395e8f154ff95db12666",
  "cpu-semantic-simulation/testing-is-not-proof": "d16ccc24e910a91d6f5586010f6e58af2b4db3ad4c90d3cbf2a4c78ec9399300",
  "verus-contracts/compositional-reference": "431af39b01bd12b8294c03859259fc0eaff8f6951876a856b09c5030e95438b8",
  "memory-race-proof/finality-and-frame": "5e6e9c6b34e14e7576719e721323247762812044404cab3a2742c37627ed2781",
  "compiler-checks/complete-correctness-catalog": "d25e7e7b83bc040cfc2d2896b70af90a1fe1c10063b9cd2da3727a301eeaa466",
  "reductions-scans/contribution-domain": "dd63519f6822ffb13291f36d597a80ad09c9920a76c12515e1da4612af03e84c",
  "lds-barriers-atomics/final-observable-effect": "7a35e41fe020f5c3a9f8a8ce500a87c7a4e8d661361a28f6842245c7291b5678",
  "gemm-tiling/composed-reference": "100026eba8b22b2fad08fa6b9230a6e0d549ef13e28257f58ce729435cd2b19b",
  "gemm-proof-plan/total-correctness-boundary": "acf8883d2972d89dc46c53959503f38575d5cb0e258a1f2b7b1255834938b17f",
  "softmax-invariant/composed-reference": "3751e6570bdd634a4f340fd31d7a0bcab0ad7755c0e4b9e18acd29bcece69678",
  "flash-attention/composed-reference": "6952c78b9f5928ad26d762310c329595ec24259472a92904788f2d059e733bca",
  "moe-routing/composed-reference": "894815ba82ea809dfecd2daca7a503c4a74e89ae364773f6019a976f14a95150",
  "moe-expert-compute/composed-reference": "512bb53c712c9c7ccd96f2038b9ec0a49c40ccf2d91901ee58d2e3947a1d20ba",
  "evidence-pipeline/total-correctness-receipt": "2b69dd66c7d680368b8e5b6a4b9e6e820b5a471a0ae502e4e4e89c0429aa91e3",
  "what-verus-proves/total-correctness-boundary": "ed83bb948f1f0391f9aa8dfc5b6919f3b279b31c49acb9338f2e8d661827f0f3",
  "evidence-archive/non-retroactive-milestone": "b95153121a2d018de62d31944559bf78777c325799006826ec313c32700dafcb",
  "exercise-ladder/semantic-correctness": "64093130b5884baa0ab7b4bc5c5feeaabe3aa728f1b8fcb1095f0fcc1235eaf3",
  "contributing-kernel/semantic-contract-checklist": "413ef11c78d6aedbab83e7c4ab81b87cda8a3bdbe01e40043e95baa910ea9b44",
  "gfx950-fp4-gemm/prerequisites": "c283e084ba552fb74cfcde1e519efad73592d7fefbb248021ce3480a478f8e4b",
  "gfx950-fp4-gemm/tile-accumulator": "8917b56e48bf58d33aa5fcbf03185874d5c0820a67a27cd49f4e7edbf010510a",
  "gfx950-fp8-gemm/format-layout": "005f677144bf9296b4b434a30a10a8d94bec847f83c11a60ff5d05e11a5cac80",
  "gfx950-fp8-gemm/tile-accumulator": "170e86a95052ec6c9c426c00435efad97c6c094b3c7ca88710de6e690da6eee4",
  "gfx950-fp4-attention/transpose-pipeline": "b1b21fa0102d2534605ca90d556a14f49b8c7f01b14bfe64718b2d52ca82c26c",
  "gfx950-fp4-attention/online-softmax": "2bdb7d2911231e2f84aff1f430e57cbd04457218edc686adcac375790bd4ab72",
  "gfx950-fp8-attention/transpose-pipeline": "51866a37f65cbe58ada347dd3cc625bc28dd0e28686465ff0f59a681453c02b6",
  "gfx950-fp8-attention/evidence-boundary": "e4727cade386fa749cb74e305b5ccc136dc378f13cdc93f26892149a19b29bdb",
  "gfx950-advanced-moe/fixed-pipeline": "c08b49657eb3b23e1fa420296180049c975114ee7da03cb19b817d11003d71bb",
  "gfx950-advanced-moe/scope-evidence": "937c4e2d6e06cb3bfc91a8883f14b885ac8376f94ff52c29f1cd0bc1f0b0a91f",
  "gfx950-kda-gdn-linear-attention/recurrence": "68517f13331db6304f50f0c96261d52be95af7d7660324ddf75a109cf55cf3ef",
  "gfx950-kda-gdn-linear-attention/scope-evidence": "b05d3fdd7c35a2be8f174967007bcab5d78522aed2fa0505aa5caec8f3ed6614",
  "gfx950-indexed-sparse-attention/index-contract": "dea1a54cde93fbec18cfe7482ae18e391f0d74064c5f7c81bc3f169644eb6afd",
  "gfx950-indexed-sparse-attention/scope-evidence": "3a8e0ab7752bd6841e441d36d5ac799ca60e5b888377db1cf29f5348e6b3cc20",
  "gfx950-deepseek-sparse-attention/selected-domain": "f4c08bc1072e7d1fff38a3e25a86bae7f26dc0405d3185bd463c3303ad0f569d",
  "gfx950-deepseek-sparse-attention/scope-evidence": "64880394b10d960c3d3253b9807883465ecec37e1e1e28211211e2f351628cd0",
  "gfx950-compressed-hybrid-attention/fusion-contract": "ef840e4a3e22aa5d13916c95de62f1b8f348c0b1dc723457180bbaa5e6350b1f",
  "gfx950-compressed-hybrid-attention/scope-evidence": "923fd72f3f7c952410ac0c3138991e9f5accdc8cf67998b90947299f89d26b7b",
  "gfx950-attnres-gr-mhc/mixing-contract": "256492d391ed3e36f51e986e76d3a159f3be4c87c82adbadef4bc09a15f3c7c1",
  "gfx950-attnres-gr-mhc/scope-evidence": "1f4c1735a7f6b58417f216386e3c1a39fb5302f19b706edee8ec1c22a4e44240",
  "gfx950-speculative-mtp-verification/prefix-contract": "df9aec9a9826fcd76b9a01b4440ef4e8d7e88e30ff7dd8c3d9ea5dbd3e423a13",
  "gfx950-speculative-mtp-verification/scope-evidence": "1afcc7c4dc47e772c90803c9d466d3bb66c16c5f0a6623f9c8937c0f3cb0f4df",
  "gfx950-ngram-embedding-gather/gather-contract": "db4a533e14d8a8f5c22faa4fc90498f803da170da3547d6ec0ff9b4c5532e23e",
  "gfx950-ngram-embedding-gather/scope-evidence": "982e9c5cb66d39d4d3cfbed233cf3576f79a0deb0faaa87c89abf71ea3caa2e9",
  "gfx950-muon-optimizer/update-contract": "3f3750b43448b83ccfdad8e5f556a414bb090056828f433cf5c39231d50e1a57",
  "gfx950-muon-optimizer/scope-evidence": "34408a2c73518f0ad4ab049410714ea319b1488a160becfb9c83754cb8fbe9aa",
  "gfx950-gpt-oss-120b-megakernel/layer-tile-contract": "7657de384b9861955c299f6c3292dd85ab71258932eb974054c0b2b1cdd082a0",
  "gfx950-gpt-oss-120b-megakernel/performance-boundary": "8132b66c82fded391a7656be179293a8d883c0d36588948b51e9abad6226f65c"
} satisfies Record<NarrativeId, string>);
