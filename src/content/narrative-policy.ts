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
  "gfx950-compressed-hybrid-attention/fusion-contract",
  "gfx950-compressed-hybrid-attention/scope-evidence",
  "gfx950-attnres-gr-mhc/mixing-contract",
  "gfx950-attnres-gr-mhc/scope-evidence",
  "gfx950-speculative-mtp-verification/prefix-contract",
  "gfx950-speculative-mtp-verification/scope-evidence",
  "gfx950-ngram-embedding-gather/gather-contract",
  "gfx950-ngram-embedding-gather/scope-evidence",
  "gfx950-muon-optimizer/update-contract",
  "gfx950-muon-optimizer/scope-evidence"
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
  "read-the-evidence/scalar-gemm-checkpoint": "c4235a24fc832dcbfbfa58166a8e0692fc365e59dc391829174200dc9a6bffe9",
  "read-the-evidence/moe-bounded-evidence": "dbd3365e78d1b08d60b330328166e39fe46b1d7174d6ec0ca46811542757e361",
  "gfx942-setup/toolchain": "bde4a23bc51376d828c8b910ab8048c988c7f838736f1d309bea0294fde84ef3",
  "gfx942-setup/sequence": "00a0689fb93a27622076f9bd21c5fb8c0b78c57d88d79dc8db0bfb86596315da",
  "first-fill/kernel-shape": "ad9c0b9744f9494313d2fcc88dfb1aee778c732acc2f2414f7f2712ac27cea6f",
  "first-fill/trust": "e8e35a73d58e59831b23c8bf97cc3b80fe539740444c0146995c3564699cd594",
  "typed-vecadd/same-body": "f13736ba4fb9726a65f1637d6658ce4ef5cdf9676ceeec1ebdea5a8728b629f8",
  "typed-vecadd/typed-host": "4533c94d3bacd2f8e2adcd64f6d534d594564ab81a4b8f6b6f628d2d22dbbe70",
  "cpu-semantic-simulation/pipeline": "ffd7202c68f5c2349d24738746669c6b058f643d5bb263ead587c4c70bc98630",
  "cpu-semantic-simulation/evidence-boundary": "88a16857d2e7f5dadc1aade3fa47dd13cbfdb0455de21ca0802a9f0f92cbb2de",
  "verus-contracts/contract-shape": "6f0bce0ee5e7ee41dc19f9f0ed3b59e2c2238562ceac22380381454002d86ad1",
  "verus-contracts/negative": "38875c71f6dd93237a558f59db083e9eb48b93d9407fa23f210d3dfd14c379ca",
  "memory-race-proof/regions": "e197e757e5e41a147309534e0659e257209745bcef5c6e11fa89d61947111835",
  "memory-race-proof/dynamic-join": "105fe75c7294f57013c1f2c1403a985908580947f9aa2b96095de318ea0cc392",
  "compiler-checks/catalog": "e42c165f5d93b33f0201fa3733841555437b92a408e77c25cfddd012f8ae4df4",
  "compiler-checks/production-path": "86b7410544e40ae0e01fceccd4069198ba562221410b03a0a93745ec4c43f812",
  "compiler-checks/v7-simulation": "135c2345c09eb57e6e1005c651d714b1552eb9ddcf000aba978358ab0e928727",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "60963f040ac2f5145bc906991ff12bbd2af10cdfc83bc74bce24f5b0c66ba4a8",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "631bbb237c96f3dcc586e4a7c7a0d092a15f9e4e4466138bb57dda2ea25638a5",
  "gemm-tiling/public-layout-proof": "98667d62b4ca5d5d174eb06f5d9a1ea412d8ac241977309a9227f8c17368553c",
  "gemm-tiling/general-contract": "64c994eb82c52312a5160e1ce8cc713e1d0bcb2316f59814b39eeb57b0a42bf8",
  "gemm-tiling/mutation-diagnostics": "b9db69f87e53e57e2fbed2ca69b38762682c2eda94b391f6e5c178c7084bd7f4",
  "gemm-tiling/mapping": "622e3d262e7935105df3d172c29b2599c1754c727be30d66340b4c0d5b38610f",
  "gemm-tiling/loop-proof": "7a158358ac5dd465bd5c1a80e27b29ba5b030a3a370336f1bbdd1b73cba9ef7b",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "961353dad93a62fb2d79e63b2f0d738b7e37814346ab4d5f9113656a9c9edbff",
  "softmax-invariant/spec": "922e9a25df40b9632ef9c3a0254585c2b475e470f1a3075e9b450b729a55d0b0",
  "softmax-invariant/proof": "6fcff1234f551a0354ece1c3eb7e984ffcae193ce864181fbe739f8170a1865a",
  "flash-attention/online": "b19178ad285f184e0f9000c72dcb94ca4cc0a3fdcb675a34e0931bf92a17a63d",
  "flash-attention/effects": "e57fea1b41057f73962835017ec7e9d73f2fd6c7cd42c4783ff9cbcf09abe89e",
  "flash-attention/closure": "61d99bb719bfa6059bba9c4d0e0f1104ceef1825a357385a31f048acb34609c5",
  "moe-routing/assumptions": "3aa6bdd2cb216abb606346fcc769e518a94b9f36e8952d20bd4306165acaa8f4",
  "moe-routing/permutation": "59d0d30d3a7d631aa2722d78639c0c1d69fc8f619c0d7eb96bb3ea5a5e7dae56",
  "moe-expert-compute/composition": "0f8c40def484485e5095ad8926cd6b763b5252fd131bd70b3cb8743083cd57a6",
  "moe-expert-compute/combine": "e46d0eac09365c544ad435866f3003cf59715f5c7e4041d0ff9665dcd50e0ce6",
  "moe-expert-compute/bounded-evidence": "6d46d43f8d95de36aabef885c300b70f35f4289909669a6d32c1b41991891368",
  "evidence-pipeline/chain": "621e2f455016f7893d96eeb3a77d61136532c2c6acca35fc701123831221b320",
  "evidence-pipeline/why-direct": "f18b5450d768ca8aa846f5d5a02a9b9a46eeba5ead79253b0c7aa682de66d947",
  "what-verus-proves/proved": "2a78c253e95cbf6826428001cad64656d80dff375f62e471810ec1cbb0ae5876",
  "what-verus-proves/ecosystem": "75fb0827e574d4ee621bd93e00ac330f5f1903686447fddb000abfede72d1750",
  "exercise-ladder/beginner": "8bf6d0afffdeb372df635265ab58dc5618ed72ae3c36840210665ae6dc12af67",
  "exercise-ladder/advanced": "9ab054160ebcd2cc8b3a744686102c9e0d62da2bcebad1fb3155639e16ffd16a",
  "contributing-kernel/checklist": "3655a026b9d3851266779266faf0ab4d405fc00172e4e6cdeb3424381ed08b02",
  "contributing-kernel/review": "9b62429c8ac23851756fdbe8c218b7e32a2e86cceaf21380cdd53182b467a856",
  "read-the-evidence/semantic-correctness-milestone": "766c87b4d404c958b3ca4acf5c91863e1f8809bc341618faca583a2bee685c6f",
  "gfx942-setup/semantic-gates": "1302420e92130d7f94a0b80122de58417a2407228f324dd6fc619bafc9a5ab0a",
  "first-fill/total-output-coverage": "d45d0497bc0cb82bd5393b57ee396fdebb8f3be60e6453eb3732ad786f4c8996",
  "typed-vecadd/typed-arithmetic-contract": "2140e894ff8ba95c1b71912f889ae50c77b0f046289c83768690b4a9c55f259b",
  "cpu-semantic-simulation/testing-is-not-proof": "39061d7148f536e8e0f216578d84f174fa0ee260a06fd7252141d3c1aca76a11",
  "verus-contracts/compositional-reference": "9206977e950c4cc2c938a987b6e0054f094d6a475d464861a85b766b611dbb78",
  "memory-race-proof/finality-and-frame": "dcf83a782e61cedb78bb7ae7c85ef049a02a684c382394e5129e7fa42d7a77f5",
  "compiler-checks/complete-correctness-catalog": "91f4fcddd84d6413828749f52d1c85daa7bd3978a840b1b1a7b10300af5fbe60",
  "reductions-scans/contribution-domain": "1a3b92354c19e4d7f608f6a255195cd68e617b41307f025db205a491639745f8",
  "lds-barriers-atomics/final-observable-effect": "6258d9b8645518ed196e3b6f54d694fedb420445685c51be607229892b5f38c2",
  "gemm-tiling/composed-reference": "9dba3b1a0ad6886d48cd9e45b08443c1c28b3bf1c0d3406f0f7cb4bb319a222e",
  "gemm-proof-plan/total-correctness-boundary": "184e3b49c3e3c73aa9a03545f54ccc8ecb3c4971f8eb35998d5f26f93c0036b2",
  "softmax-invariant/composed-reference": "a30340d58104f980fde2001739d8734524858b6e90c0a785e70174e5ed1e3415",
  "flash-attention/composed-reference": "1f22e80af6e2976744a3d8489d3e3fcda1817e0d04b379bae7673a69096b4c9b",
  "moe-routing/composed-reference": "3f68184098dd3e400cf43f91f52523564d816976956b76ede6ec0c949b969fe2",
  "moe-expert-compute/composed-reference": "88a1adae0c3c3cfa4e6181c9ade197f3a42ff80dab7da9c3297bafc3bb713a81",
  "evidence-pipeline/total-correctness-receipt": "af0e60b8fc6c56c4f82c32cdbefe006241d5af48408243b4a5b2430575077b5c",
  "what-verus-proves/total-correctness-boundary": "a910b78872774e1a6f22f487c220be2256c051f2dfcff765fcd6d7e52288ada0",
  "evidence-archive/non-retroactive-milestone": "9c0ecbcbeeb13a5f5361873895ee1443246886f44b2408d8387403da3a49396b",
  "exercise-ladder/semantic-correctness": "0776d71cfb96546d0fe8ccfd925ef55ca2baa09908623f78320b00aeb9d96038",
  "contributing-kernel/semantic-contract-checklist": "f3541b0e99cc52dde16e2621f5b5e55e3120b64e1f979ffa14b1820e0fad4fa1",
  "gfx950-fp4-gemm/prerequisites": "2b76dab96a0e003d1070a62ecea19b2a686d718591a9376dc4cc06a2db481408",
  "gfx950-fp4-gemm/tile-accumulator": "8917b56e48bf58d33aa5fcbf03185874d5c0820a67a27cd49f4e7edbf010510a",
  "gfx950-fp8-gemm/format-layout": "ac76cd151cd7a2d42dea4d3b914af4942d83caeadbcace507d9ea2902ec73fd2",
  "gfx950-fp8-gemm/tile-accumulator": "170e86a95052ec6c9c426c00435efad97c6c094b3c7ca88710de6e690da6eee4",
  "gfx950-fp4-attention/transpose-pipeline": "6539b54aa4b4c8d47aba97d94e9e09dac7cd5ea44d12611835d298bcfe971072",
  "gfx950-fp4-attention/online-softmax": "69a4f4b885d0730a563eb5e6f0cdcfb095b655811637eec01f36714d8a344a52",
  "gfx950-fp8-attention/transpose-pipeline": "8df078b2fdfd8d63efc7aca0f5e14d314c1a45854701c06cb83b154a5d0c3bd7",
  "gfx950-fp8-attention/evidence-boundary": "b5da3cf78d18ab26f29efb81f8a04aac3944299bdeeec76d63b1b73f856d7f01",
  "gfx950-advanced-moe/fixed-pipeline": "c08b49657eb3b23e1fa420296180049c975114ee7da03cb19b817d11003d71bb",
  "gfx950-advanced-moe/scope-evidence": "b34d37b6742f992fbbeeea7ad063558a632f3def9461349797a78c0b55d042a8",
  "gfx950-kda-gdn-linear-attention/recurrence": "40770fe318b15ba2549dac18e7b5c57fb9fc3c6b8baf87b0d222b8ae5898ad47",
  "gfx950-kda-gdn-linear-attention/scope-evidence": "aa9a127ddee2fbc12c1599b51b56cf2fdb6b5691ee72cb2dc3c0ec6e18991b47",
  "gfx950-indexed-sparse-attention/index-contract": "dea1a54cde93fbec18cfe7482ae18e391f0d74064c5f7c81bc3f169644eb6afd",
  "gfx950-indexed-sparse-attention/scope-evidence": "a91efd0f3b418a8a12f8ac9e9c7548dca859a1420f3b687451d18e0c358e7478",
  "gfx950-compressed-hybrid-attention/fusion-contract": "ef840e4a3e22aa5d13916c95de62f1b8f348c0b1dc723457180bbaa5e6350b1f",
  "gfx950-compressed-hybrid-attention/scope-evidence": "87e3eee19a4ec901c848ecbbc38799bb9083cc853ecd7dc574365193a6d6218c",
  "gfx950-attnres-gr-mhc/mixing-contract": "256492d391ed3e36f51e986e76d3a159f3be4c87c82adbadef4bc09a15f3c7c1",
  "gfx950-attnres-gr-mhc/scope-evidence": "f37ccb927f7db9cfea83024c68136362cac8caa041553e2606364320f87c0bef",
  "gfx950-speculative-mtp-verification/prefix-contract": "df9aec9a9826fcd76b9a01b4440ef4e8d7e88e30ff7dd8c3d9ea5dbd3e423a13",
  "gfx950-speculative-mtp-verification/scope-evidence": "84dc5ac2357d1d063b9dfc25135f031ca879a5c464aa922f3d8d731c6b3ff995",
  "gfx950-ngram-embedding-gather/gather-contract": "db4a533e14d8a8f5c22faa4fc90498f803da170da3547d6ec0ff9b4c5532e23e",
  "gfx950-ngram-embedding-gather/scope-evidence": "7b317f9d994dad800e3dca8651ba3b1006ff4b9180850933f7c827da05b226ab",
  "gfx950-muon-optimizer/update-contract": "3f3750b43448b83ccfdad8e5f556a414bb090056828f433cf5c39231d50e1a57",
  "gfx950-muon-optimizer/scope-evidence": "4a2332292ad4ae556b49f31bacc776a087d66d6e11bd2e690b205cc5fcc50a7a"
} satisfies Record<NarrativeId, string>);
