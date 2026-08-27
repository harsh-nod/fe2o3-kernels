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
  "read-the-evidence/scalar-gemm-checkpoint": "0e807fbc05d8f5d4e0b0add23ccc064467db9319f7439180e181da8068b25e67",
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
  "read-the-evidence/semantic-correctness-milestone": "183bf4707027957c50f0e1d8083f87b45cb9e269c29015484e2013e5a2404f1d",
  "gfx942-setup/semantic-gates": "92504bc2febe61685ab61756b934207d0b7fcbac6f332a06002a7eaf539b138f",
  "first-fill/total-output-coverage": "b9fc0c714e88f297655fcc09787e3e8bb094384451a5ccc7cea0509bc01437da",
  "typed-vecadd/typed-arithmetic-contract": "f63fbc3f56e17beaee3c92e0dfc54efab8e3841bef146a1c3923332873878fec",
  "cpu-semantic-simulation/testing-is-not-proof": "5a142f576f5fdb1867d27057582a6a2323977f6f74d41159b1396e88506821f7",
  "verus-contracts/compositional-reference": "4d46ba3b6d5e037e0412caa9d9af255aae2c07dc36644b6dd04364f0dfb478f2",
  "memory-race-proof/finality-and-frame": "98efed32d8208b23dbb9f0f38ae759bd86a0ef413a4ce51137d0e60b4c462410",
  "compiler-checks/complete-correctness-catalog": "e9e67ae8106415ca8cafdc3335700d4c544290b123329e7e9134234f2576d31e",
  "reductions-scans/contribution-domain": "612283ada764c6be3741b9fe669f99f09543e014b6a9e0e4a76f5da5ba29d175",
  "lds-barriers-atomics/final-observable-effect": "b65e9201299842ff0dfafbd344b36b7df74d6e082f6ef65e82b07d4d04194237",
  "gemm-tiling/composed-reference": "6cf5a763ed34a0c7977549e76bfe842d4944f72bbf1c44ede110278b0b7b3c70",
  "gemm-proof-plan/total-correctness-boundary": "11a40899fd7221904d97da339d6d58cf5cdd68ac98f90a4d49c5e6d9122c3ea4",
  "softmax-invariant/composed-reference": "93bf6d6a405665cbb6baf39d1776d7ef8d2b0d87986b15c1a7e1c707bf7203ca",
  "flash-attention/composed-reference": "13c75226fc6afeb01e9ad714060f38ab368c50ac81e15fcf4bed33e940cffcf7",
  "moe-routing/composed-reference": "5dd2485f86b4500a273404e67ecada465fe3d59857e61488d45a109e8d5d4a3d",
  "moe-expert-compute/composed-reference": "e840529905f8a489b4693c138bca170ac273478647da5479c17a70407cae5340",
  "evidence-pipeline/total-correctness-receipt": "afc0428fe9a7ea65150caf3aa6f0d726059d7f22a3076e77d57d8ce9cd178440",
  "what-verus-proves/total-correctness-boundary": "3f5c3dca33242ad36a1015e64e801f0e3d08c7c4fd99b27780cd245f8dd28328",
  "evidence-archive/non-retroactive-milestone": "5d6f98ce4b52583684a176c2712fc9779d4ddd01784dcca085f999d34e01ec5d",
  "exercise-ladder/semantic-correctness": "f0bf3f1bd3a4da9191926cfbb060797b52b5ab6a971d64c31d4880d734fa0e0b",
  "contributing-kernel/semantic-contract-checklist": "d4912b62aef3e7bf724de2ecd709d926c526cea87b5d6007d880237b6ca58c2b",
  "gfx950-fp4-gemm/prerequisites": "1a29d5fe5383d7c202db6b085a47b39fd26cb70e940b1497f614ca8c391aeba0",
  "gfx950-fp4-gemm/tile-accumulator": "8917b56e48bf58d33aa5fcbf03185874d5c0820a67a27cd49f4e7edbf010510a",
  "gfx950-fp8-gemm/format-layout": "c73b9fce188a01fae3c6d6d4bc3c3f77533c09e9d253ff8c2aa0dddabb4f4d7e",
  "gfx950-fp8-gemm/tile-accumulator": "170e86a95052ec6c9c426c00435efad97c6c094b3c7ca88710de6e690da6eee4",
  "gfx950-fp4-attention/transpose-pipeline": "1ef2f3a1e3990837960cc3292c7ac5d0ecb1807efc3d94a77485bde1dcc31b33",
  "gfx950-fp4-attention/online-softmax": "69a4f4b885d0730a563eb5e6f0cdcfb095b655811637eec01f36714d8a344a52",
  "gfx950-fp8-attention/transpose-pipeline": "2d606d3b8850d34a315cbc345e1a97693f3433b6c6e4f982accaa1a32bbc6434",
  "gfx950-fp8-attention/evidence-boundary": "b5da3cf78d18ab26f29efb81f8a04aac3944299bdeeec76d63b1b73f856d7f01",
  "gfx950-advanced-moe/fixed-pipeline": "c08b49657eb3b23e1fa420296180049c975114ee7da03cb19b817d11003d71bb",
  "gfx950-advanced-moe/scope-evidence": "f4e7ef77d704fe879912ccbcb5d212c3cfde6d2c217aa3663c5d5dceefe711c4",
  "gfx950-kda-gdn-linear-attention/recurrence": "40770fe318b15ba2549dac18e7b5c57fb9fc3c6b8baf87b0d222b8ae5898ad47",
  "gfx950-kda-gdn-linear-attention/scope-evidence": "18fd707dfaeec8c8c22d63e83ab4e7b060d2bbd90fe6130aac4fc5893b705509",
  "gfx950-indexed-sparse-attention/index-contract": "dea1a54cde93fbec18cfe7482ae18e391f0d74064c5f7c81bc3f169644eb6afd",
  "gfx950-indexed-sparse-attention/scope-evidence": "e7de30d963d25680c9d1423517c65d2b774cd196e0c46dcefedf92caf8c13be5",
  "gfx950-compressed-hybrid-attention/fusion-contract": "ef840e4a3e22aa5d13916c95de62f1b8f348c0b1dc723457180bbaa5e6350b1f",
  "gfx950-compressed-hybrid-attention/scope-evidence": "14a7d4c29b632b64736437231d6953300dea6cf00e6ba70ecb9ff2ca01dd72d3",
  "gfx950-attnres-gr-mhc/mixing-contract": "256492d391ed3e36f51e986e76d3a159f3be4c87c82adbadef4bc09a15f3c7c1",
  "gfx950-attnres-gr-mhc/scope-evidence": "cce954d8ba99a855c676c08ab8f73ac02b0aaec8164764b68c5f555d1176dab9",
  "gfx950-speculative-mtp-verification/prefix-contract": "df9aec9a9826fcd76b9a01b4440ef4e8d7e88e30ff7dd8c3d9ea5dbd3e423a13",
  "gfx950-speculative-mtp-verification/scope-evidence": "8824fcc182bad13984fe30ed8a3c3df568915c0c222dd7c36aaffa339b706b9f",
  "gfx950-ngram-embedding-gather/gather-contract": "db4a533e14d8a8f5c22faa4fc90498f803da170da3547d6ec0ff9b4c5532e23e",
  "gfx950-ngram-embedding-gather/scope-evidence": "14a762320f5d9c0e242d543728d8682b4d8a2818eaaf66925c7bccc8bdde5653",
  "gfx950-muon-optimizer/update-contract": "3f3750b43448b83ccfdad8e5f556a414bb090056828f433cf5c39231d50e1a57",
  "gfx950-muon-optimizer/scope-evidence": "4e0edc22415db7139ccc0f88e19ad1f5f754a29755534a107126d669c7752452"
} satisfies Record<NarrativeId, string>);
