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
  "read-the-evidence/differentiator": "e1873a4af9a5be85a19c85076924f286aa92a189ba6d15c00f95289e8f90ee5b",
  "read-the-evidence/compiler-refactor": "b9b2de157842c4626cf236431e29e677d316ec7156189d507330891db4d409df",
  "read-the-evidence/scalar-gemm-checkpoint": "13ce5ff5cbf97c36ccf8e70a2f5216aa5f27e57e24b771ab45cc3288072a7e2b",
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
  "compiler-checks/catalog": "0d0b699879b84c5a0e43cc67fa47dd94f579dfd79c7254eba36b1b0a43495d08",
  "compiler-checks/production-path": "8deb48064d52b1a91411bddedc77fa31ace2b4929306fcb10f7a0c7b7eded5d6",
  "compiler-checks/v7-simulation": "898a468386559cbe68838e52818e018378e26d0211fd568a946c298507b3d251",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "60963f040ac2f5145bc906991ff12bbd2af10cdfc83bc74bce24f5b0c66ba4a8",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "631bbb237c96f3dcc586e4a7c7a0d092a15f9e4e4466138bb57dda2ea25638a5",
  "gemm-tiling/public-layout-proof": "9cb4be57e0aff451d0e72b0129e2f1698fee55680e48d72e545bf06a8443d4d9",
  "gemm-tiling/general-contract": "61a6ca9ecff6e73815f5f3e83ef4c35eb4d813d1caea2892a254231c4189f3a2",
  "gemm-tiling/mutation-diagnostics": "dfde97043d0ada591298d108a96ec048067a576fde51473c011ab8ffbc44e687",
  "gemm-tiling/mapping": "8b444ef89d0b6dc7c7c794da439308e8db4faa249b79f6190f72f51402db28d5",
  "gemm-tiling/loop-proof": "e2831c8b61cf91ea7e720c8ccb87efa2a0b47d8c4040fa39e450a4087a2477f8",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "961353dad93a62fb2d79e63b2f0d738b7e37814346ab4d5f9113656a9c9edbff",
  "softmax-invariant/spec": "33a9d720feac88f1e243fa8a9ba2f0338ca9296a6e5fbbbc404488111b8fd45f",
  "softmax-invariant/proof": "dd78a39bb530df4def497bbe7fa702256075f9f5a827ca0178f3946e27369e5f",
  "flash-attention/online": "535b3c1727e15ba539d244fe050a67d1a15ac6666e9e94e3814424895ee46f25",
  "flash-attention/effects": "dec7a14c01e1f27c8cdae8f2bca1670775a4ee2fbcb4a50dfc0846b89d4f99d3",
  "flash-attention/closure": "e2e278769f7ce11dbd7757806c13d4d7422200b8c863382f44b40e72e5304362",
  "moe-routing/assumptions": "3aa6bdd2cb216abb606346fcc769e518a94b9f36e8952d20bd4306165acaa8f4",
  "moe-routing/permutation": "59d0d30d3a7d631aa2722d78639c0c1d69fc8f619c0d7eb96bb3ea5a5e7dae56",
  "moe-expert-compute/composition": "426c9e94f9db311393d9189ba9e2730c60565470433b57e5b43575362032cb90",
  "moe-expert-compute/combine": "a34ce5fab5137ded8844cddd4a3efe522a96b1bed4638791c017b618def489c1",
  "moe-expert-compute/bounded-evidence": "f487bf7cb22e04e2a77c0591b65c9e104d552b0bc0e3282cb988456f51eead01",
  "evidence-pipeline/chain": "621e2f455016f7893d96eeb3a77d61136532c2c6acca35fc701123831221b320",
  "evidence-pipeline/why-direct": "f18b5450d768ca8aa846f5d5a02a9b9a46eeba5ead79253b0c7aa682de66d947",
  "what-verus-proves/proved": "2a78c253e95cbf6826428001cad64656d80dff375f62e471810ec1cbb0ae5876",
  "what-verus-proves/ecosystem": "75fb0827e574d4ee621bd93e00ac330f5f1903686447fddb000abfede72d1750",
  "exercise-ladder/beginner": "8bf6d0afffdeb372df635265ab58dc5618ed72ae3c36840210665ae6dc12af67",
  "exercise-ladder/advanced": "9ab054160ebcd2cc8b3a744686102c9e0d62da2bcebad1fb3155639e16ffd16a",
  "contributing-kernel/checklist": "3655a026b9d3851266779266faf0ab4d405fc00172e4e6cdeb3424381ed08b02",
  "contributing-kernel/review": "9b62429c8ac23851756fdbe8c218b7e32a2e86cceaf21380cdd53182b467a856",
  "read-the-evidence/semantic-correctness-milestone": "8eb06804225187d36260aebecad9860f2fca4ba47b914e996eba047f33cb9447",
  "gfx942-setup/semantic-gates": "e61c4cccd51cc4e07be708f29ff4cb129c2640515247c73b1c9424bf82d539c5",
  "first-fill/total-output-coverage": "b7ad749b51361b4e7b76ba0ea79198c837dfb80f7ea0c5fb38ba89e3863964d7",
  "typed-vecadd/typed-arithmetic-contract": "2e3bfae6b9b310519aa8333d6d8c560e23bc09fc5784bbf86b460d3388e71051",
  "cpu-semantic-simulation/testing-is-not-proof": "f0ea8ab0b5da35eb59535613ec2868277beb37be54a2899e2274115d39b0788b",
  "verus-contracts/compositional-reference": "7bd88dd528bd44b2366f88e0469eab2e4053745bd09d992718f5012558cc7a86",
  "memory-race-proof/finality-and-frame": "a52e4e4b4216324fb2df7dc3716fabc4b6aa1bb8a773910a7e6e2bfa3ca293b4",
  "compiler-checks/complete-correctness-catalog": "c16f8d59161fbb5d103567b2bdfe3537e911576223a21fccb952815c0dc2077b",
  "reductions-scans/contribution-domain": "7e362547dc6bb7fe361b8fd6049f0ddabd7a6d9f1d161fc391d671a01ed3b994",
  "lds-barriers-atomics/final-observable-effect": "c39ebb9f369a9fc978f1a1310d7cf3603af0febd4504c60f367d961b49e2d5b8",
  "gemm-tiling/composed-reference": "701c7797a76bd2769f78452a3c052f8b498a97a896db46d5fff1ae5cb7339576",
  "gemm-proof-plan/total-correctness-boundary": "43fbb8fbf97cc745970e1f9a55e53d4a631eee2bdd63850b5372350441cfcaec",
  "softmax-invariant/composed-reference": "5da7102aaf4dfed998d56a3168738ca57e48e7717e2557d7e8138da7c8c1723d",
  "flash-attention/composed-reference": "355708ce372062804217ff030e457b7923f7ba7e192405b51fdc2957fc90acef",
  "moe-routing/composed-reference": "45d70319428e1c41ce7b2ffb8677073c47a44c967340b7ec33486e2bbbb3d45e",
  "moe-expert-compute/composed-reference": "df999e10d525db783c1acc45ac5ddc4c4e2e989f848de8fa13dfc0cfa816de56",
  "evidence-pipeline/total-correctness-receipt": "bf4c279fe0d4ce9b92031c6a01ec748fdb690246c9c7e44861b7d09da80a2bc0",
  "what-verus-proves/total-correctness-boundary": "64ef3b55f634da169841fa8534c498f3e80cc3b88e6daa79e39ce253fb545b77",
  "evidence-archive/non-retroactive-milestone": "07e5186bc322368db1b4d24d0d3b866471bbe67472bbef76fb275530a1388e9d",
  "exercise-ladder/semantic-correctness": "0a5da1b9acc47970ceb99654fb86eb89200ae0abc45003e597ea7c1f04ec29a1",
  "contributing-kernel/semantic-contract-checklist": "d532d75b5167ede2c4956272e9a1c23592455fc7f15e618f3fdb3193dd333b5b"
} satisfies Record<NarrativeId, string>);
