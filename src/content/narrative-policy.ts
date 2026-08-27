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
  "read-the-evidence/scalar-gemm-checkpoint": "7e4b9c243318864a09d706e6724b9f985855b03477542d4eec5440dba0cb61e6",
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
  "compiler-checks/catalog": "6912859cea389afc2917307ebb61c2c843073e4f3aa6c64ea4ef5e6f450c39a7",
  "compiler-checks/production-path": "8a4d405bd70d30ca0abfa9ba75c075c62aa9ad1c6890859fe870d9bc77a1310d",
  "compiler-checks/v7-simulation": "898a468386559cbe68838e52818e018378e26d0211fd568a946c298507b3d251",
  "reductions-scans/scope": "5a38b3d1c24f74c6ffe39078b8e8b26d2fc1d12547e452fa420355bc5dd25152",
  "reductions-scans/scan": "60963f040ac2f5145bc906991ff12bbd2af10cdfc83bc74bce24f5b0c66ba4a8",
  "lds-barriers-atomics/epochs": "79bc337dc6efcb64d133f32f91c37d07fa7d67f4d122395fe85c038d4c3ad441",
  "lds-barriers-atomics/atomics": "631bbb237c96f3dcc586e4a7c7a0d092a15f9e4e4466138bb57dda2ea25638a5",
  "gemm-tiling/public-layout-proof": "9cb4be57e0aff451d0e72b0129e2f1698fee55680e48d72e545bf06a8443d4d9",
  "gemm-tiling/general-contract": "61a6ca9ecff6e73815f5f3e83ef4c35eb4d813d1caea2892a254231c4189f3a2",
  "gemm-tiling/mutation-diagnostics": "dfde97043d0ada591298d108a96ec048067a576fde51473c011ab8ffbc44e687",
  "gemm-tiling/mapping": "8b444ef89d0b6dc7c7c794da439308e8db4faa249b79f6190f72f51402db28d5",
  "gemm-tiling/loop-proof": "168a461fc201f1a04961ea8e312a3e15074a170e92c1524223a32e1b654a6a33",
  "gemm-proof-plan/proof-ledger": "635b84e78c427a7c59e189832896c38d0e3f50ba0249e203c3c1ab186daa77c2",
  "gemm-proof-plan/evidence": "961353dad93a62fb2d79e63b2f0d738b7e37814346ab4d5f9113656a9c9edbff",
  "softmax-invariant/spec": "33a9d720feac88f1e243fa8a9ba2f0338ca9296a6e5fbbbc404488111b8fd45f",
  "softmax-invariant/proof": "dd78a39bb530df4def497bbe7fa702256075f9f5a827ca0178f3946e27369e5f",
  "flash-attention/online": "535b3c1727e15ba539d244fe050a67d1a15ac6666e9e94e3814424895ee46f25",
  "flash-attention/effects": "ec15395097e778b86abc4dcfa34f19f6569a7c56ce4d7824e14a90cd3819ddde",
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
  "read-the-evidence/semantic-correctness-milestone": "fbf54068a348ca0acc4760122b7fe41d63c7395aeae568d4e433e12436199852",
  "gfx942-setup/semantic-gates": "3cc78eb02095b55723de34c9d213cfb46fcaee1a39042ce5108a50e5fe620a1e",
  "first-fill/total-output-coverage": "a46bd2288c7e75cb0638002d4299cf51c80c96e03c896bf3dc95a1609f51c95b",
  "typed-vecadd/typed-arithmetic-contract": "9f175780055bbf259d2deb2c7bb586f1f5df0d2c945b82a5ed282d483e50ca86",
  "cpu-semantic-simulation/testing-is-not-proof": "d2a3e7b778402ab74e9fb7f6ba366d4cb04e58fcbc45af42212b46633de42a38",
  "verus-contracts/compositional-reference": "8c8f91e10ac723f936176502e9be855dad22974a2a0e47eee20185fdf7e76a4c",
  "memory-race-proof/finality-and-frame": "e559f11755174f8d89ad19354b44d11bb03ceb7d1c77a90491b6d676b5211a68",
  "compiler-checks/complete-correctness-catalog": "c2ca319f9534ae863fc2bc081a488900403b7572a4d2a02dc5956289e2f3e139",
  "reductions-scans/contribution-domain": "4a8da21a200a77ac94f6bfdb3d4fd04355435debf1486ddb12f10407141b099b",
  "lds-barriers-atomics/final-observable-effect": "dc63ecf712bd136de54690c439a9f02fffbb05a332af41e69e694e468b2e5e93",
  "gemm-tiling/composed-reference": "b126cdc89f4b4d93ada388e079adca56f3d5be5e83b054c4a2b0ef14bd702908",
  "gemm-proof-plan/total-correctness-boundary": "dd02e54b09dfa21b5ebb903b3f193bed8caf1fb4ca150b589d051b2c2e15d6de",
  "softmax-invariant/composed-reference": "c07256dfbccff867bce868ba1a6234da72417280303753412b21fc0a1d378883",
  "flash-attention/composed-reference": "49a411ba714b674b8d3f0a32f035f3f5ab41fc302a66e6a737d6f06ffb44a52f",
  "moe-routing/composed-reference": "53d8cb255455257b903f0d165636bceaeef6b90ae99b1dd0c8851877f3f52b5a",
  "moe-expert-compute/composed-reference": "a0e933ca9aaae85f253a5a513d73475453ea5709ff34b160ae7138bea04b771b",
  "evidence-pipeline/total-correctness-receipt": "3c8b09050739b8cfdc67f3e0107f62aa8f3d177fb3037b7ff1cde53aaf3e1a6e",
  "what-verus-proves/total-correctness-boundary": "033f8e6af1daf2ee6fce8441ecdd96804d0d057c1bd4785c76721f18ec1ab2bb",
  "evidence-archive/non-retroactive-milestone": "7923159b43189082a959d4e7b2bf97d465b68fb4c229c0475b79ad42193e9af3",
  "exercise-ladder/semantic-correctness": "927f4d0cd2dee77184f04c057114fafce66c1b0ee9e639b3a281d32a20a181e7",
  "contributing-kernel/semantic-contract-checklist": "d897128d20c89a45b24e3beca5a407c769461010fa8091a220482700af2812a1",
  "gfx950-fp4-gemm/prerequisites": "b571cc2040ec1c5012b19ed11d33f4339c17bba66756077573bbe4f3912e1ddd",
  "gfx950-fp4-gemm/tile-accumulator": "8917b56e48bf58d33aa5fcbf03185874d5c0820a67a27cd49f4e7edbf010510a",
  "gfx950-fp8-gemm/format-layout": "3de4658022686d85f6e5eb33f5a462f84de1675113c5fb04ff49374a4608084b",
  "gfx950-fp8-gemm/tile-accumulator": "170e86a95052ec6c9c426c00435efad97c6c094b3c7ca88710de6e690da6eee4",
  "gfx950-fp4-attention/transpose-pipeline": "e871bf0ff76650aa86985caf73263c1080f471a27e540ff14e684f7003505c7e",
  "gfx950-fp4-attention/online-softmax": "69a4f4b885d0730a563eb5e6f0cdcfb095b655811637eec01f36714d8a344a52",
  "gfx950-fp8-attention/transpose-pipeline": "887d8b077d8ce021dc65d2cf79a3c8bde81cdd0017a132bbf1e1feb881e9bbfd",
  "gfx950-fp8-attention/evidence-boundary": "b5da3cf78d18ab26f29efb81f8a04aac3944299bdeeec76d63b1b73f856d7f01",
  "gfx950-advanced-moe/fixed-pipeline": "03558053c18a32924d4c4732123b6de56da9cfc699bd94bb956644df3c4c4475",
  "gfx950-advanced-moe/scope-evidence": "fcd2e20c417674a70bfd4334d8da1eb4c3bfba2724d29c032857846c541fc046",
  "gfx950-kda-gdn-linear-attention/recurrence": "40770fe318b15ba2549dac18e7b5c57fb9fc3c6b8baf87b0d222b8ae5898ad47",
  "gfx950-kda-gdn-linear-attention/scope-evidence": "135ab358c9658bd110b93a71529ae3af634701e12d29165cd1f67343aad0c87f",
  "gfx950-indexed-sparse-attention/index-contract": "dea1a54cde93fbec18cfe7482ae18e391f0d74064c5f7c81bc3f169644eb6afd",
  "gfx950-indexed-sparse-attention/scope-evidence": "1e23dcfedbd817e2dc3abdb15db2a26e9d715e00aed3da1f6fa113672639966f",
  "gfx950-compressed-hybrid-attention/fusion-contract": "ef840e4a3e22aa5d13916c95de62f1b8f348c0b1dc723457180bbaa5e6350b1f",
  "gfx950-compressed-hybrid-attention/scope-evidence": "e50858f3ddd0856bc947a9b03465cddc6442dd36dedb0f1dedd440b8f184086d",
  "gfx950-attnres-gr-mhc/mixing-contract": "256492d391ed3e36f51e986e76d3a159f3be4c87c82adbadef4bc09a15f3c7c1",
  "gfx950-attnres-gr-mhc/scope-evidence": "a3494a3c54790cc6be6499e6e21f0274fa7c7c0fb1f8c04e406412745724c687",
  "gfx950-speculative-mtp-verification/prefix-contract": "df9aec9a9826fcd76b9a01b4440ef4e8d7e88e30ff7dd8c3d9ea5dbd3e423a13",
  "gfx950-speculative-mtp-verification/scope-evidence": "8f99af3f4b737443c6988ddab1f1d5e6d5f50679469471f103caae3256976aed",
  "gfx950-ngram-embedding-gather/gather-contract": "db4a533e14d8a8f5c22faa4fc90498f803da170da3547d6ec0ff9b4c5532e23e",
  "gfx950-ngram-embedding-gather/scope-evidence": "31cd903dc0cbe5d87041b7ee97f50ced1ee76fa8a3c4a2a54ac9204cbc8dfe0a",
  "gfx950-muon-optimizer/update-contract": "3f3750b43448b83ccfdad8e5f556a414bb090056828f433cf5c39231d50e1a57",
  "gfx950-muon-optimizer/scope-evidence": "9d1eab8b64e9399c9ab2bb9254bfaca788316dc66e8c06769aa13ab45d741c99"
} satisfies Record<NarrativeId, string>);
