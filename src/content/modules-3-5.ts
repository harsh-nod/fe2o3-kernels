import flashDesign from "../../examples/flash_attention_design.rs?raw";
import gemmDesign from "../../examples/gemm_design.rs?raw";
import {
  FE2O3_PIN,
  pinnedReference,
  type CurriculumModule,
  type Lesson,
} from "./model";
import { completeTabs, noHost, noProof, resultText } from "./shared";

const verusCommand =
  "VERUS=/absolute/path/to/verus examples/verus_vecadd/run-verus.sh --require";

const collectives: Lesson = {
  id: "reductions-scans",
  module: 3,
  order: 0,
  title: "Reductions and scans by scope",
  summary:
    "Build reductions from active-lane semantics, then make workgroup composition and scratch ownership explicit.",
  duration: "42 min",
  prerequisites: ["Memory and race proofs", "Associative operations"],
  objectives: [
    "Distinguish wave and workgroup collectives.",
    "State how inactive lanes affect a reduction or scan.",
    "Separate bounded API/lowering profiles from general source integration.",
  ],
  claims: [
    {
      kind: "source-model-verified",
      label: "Wave and LDS model",
      detail:
        "The Verus suite checks active-value reduction determinism, disjoint scan outputs, bounded LDS writes, and paired inactive-lane and LDS mutations.",
      reference: pinnedReference(
        [verusCommand],
        [
          "examples/verus_vecadd/verus/wave_lds.rs",
          "examples/verus_vecadd/verus/negative/wave_inactive_lane_contributes.rs",
          "examples/verus_vecadd/verus/negative/lds_duplicate_writer.rs",
        ],
      ),
    },
    {
      kind: "compiler-hsaco-observed",
      label: "Bounded collective foundations",
      detail:
        "Kernel IR, AMD lowering, and fe2o3-device contain target-gated wave and workgroup collective profiles, but general Rust source-to-collective execution is not complete.",
      reference: pinnedReference(
        [
          "cargo +nightly-2026-04-03 test --locked -p fe2o3-device -p fe2o3-kernel-ir -p dialect-amdgcn",
        ],
        [
          "crates/fe2o3-device/src/collective.rs",
          "crates/fe2o3-device/src/wave.rs",
          "crates/fe2o3-kernel-ir/src/verify.rs",
          "crates/dialect-amdgcn/src/lib.rs",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    {
      id: "scope",
      title: "Scope is part of the operation",
      blocks: [
        {
          type: "paragraph",
          text: "A wave reduction communicates only among participating lanes in one wave. A workgroup reduction composes wave results through LDS and at least one workgroup barrier. Treating the two as interchangeable loses both the participation set and the memory-ordering proof.",
        },
        {
          type: "table",
          headers: ["Layer", "State", "Proof focus"],
          rows: [
            ["Wave", "registers and active mask", "inactive lanes do not contribute"],
            ["Cross-wave", "one partial per wave in LDS", "one writer per slot"],
            ["Workgroup", "final partials", "barrier order and initialized reads"],
          ],
        },
      ],
    },
    {
      id: "scan",
      title: "A scan exposes more ownership",
      blocks: [
        {
          type: "paragraph",
          text: "An inclusive scan returns one prefix per active lane. Besides proving the algebraic prefix result, prove that every lane receives one output slot and that inactive lanes cannot affect active prefixes. For a workgroup scan, carry the per-wave offset and epoch explicitly.",
        },
        {
          type: "callout",
          tone: "boundary",
          title: "Current maturity",
          text: "The APIs, model, IR operations, and lowering slices are real. This lesson does not present a generally runnable Rust reduction kernel because the production source-to-IR path does not yet cover that surface end to end.",
        },
      ],
    },
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: `// BOUNDED API SHAPE; not a general runnable source path.\nlet lane = WaveLane::<Wave64>::current();\nlet partial = wave.reduce_sum(active_group, value);\nlet prefix = wave.inclusive_scan(active_group, value);`,
      explanatory: true,
    },
    {
      language: "text",
      code: `active_values_determine_reduction\ndistinct_active_lanes_have_disjoint_scan_outputs\nmutated_inactive_lane_contributes  // expected rejection`,
      sourcePath: "examples/verus_vecadd/verus/wave_lds.rs",
    },
    { language: "bash", code: verusCommand },
    {
      language: "text",
      code: resultText(
        "source-model-verified",
        "Proof/model and lowering foundations pass independently. No general reduction HSACO dispatch is claimed.",
      ),
    },
  ),
  diagram: "reduction",
  exercises: [
    {
      prompt: "Specify an exclusive scan for a partially active wave64.",
      hint: "Define the active-order prefix, not a physical-lane prefix with garbage values.",
      acceptance: "Inactive lanes contribute no value and every active result contains only earlier active lanes.",
    },
  ],
  glossary: ["wave64", "active mask", "reduction", "scan", "participation scope"],
};

const synchronization: Lesson = {
  id: "lds-barriers-atomics",
  module: 3,
  order: 1,
  title: "LDS, barriers, and atomics",
  summary:
    "Track initialization by epoch and use target-gated synchronization rather than treating a barrier as a universal fence.",
  duration: "45 min",
  prerequisites: ["Reductions and scans", "Memory ordering basics"],
  objectives: [
    "Model an LDS write phase and read phase as separate epochs.",
    "Reject divergent workgroup barriers.",
    "Match atomic ordering, scope, address space, and allocation eligibility.",
  ],
  claims: [
    {
      kind: "compiler-hsaco-observed",
      label: "Target-gated lowering",
      detail:
        "The experimental AMD lowering emits LDS, scoped integer atomics, fences, workgroup barriers, and bounded wave operations with focused tests.",
      reference: pinnedReference(
        [
          "cargo +nightly-2026-04-03 test --locked -p fe2o3-kernel-ir -p dialect-amdgcn -p fe2o3-amd-target",
        ],
        [
          "crates/fe2o3-kernel-ir/src/standard_atomics.rs",
          "crates/fe2o3-kernel-ir/src/verify.rs",
          "crates/dialect-amdgcn/src/lib.rs",
          "crates/fe2o3-amd-target/src/lib.rs",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
    {
      kind: "source-model-verified",
      label: "Barrier and LDS model",
      detail:
        "The Verus fixture suite rejects duplicate LDS writers, reads before the barrier, and out-of-bounds LDS reads.",
      reference: pinnedReference(
        [verusCommand],
        [
          "examples/verus_vecadd/verus/wave_lds.rs",
          "examples/verus_vecadd/verus/negative/lds_read_before_barrier.rs",
          "examples/verus_vecadd/verus/negative/lds_out_of_bounds_read.rs",
        ],
      ),
    },
  ],
  sections: [
    {
      id: "epochs",
      title: "Initialization crosses a scoped epoch",
      blocks: [
        {
          type: "steps",
          items: [
            "Assign disjoint LDS write regions to participating lanes.",
            "Prove every later-read region is initialized by the write phase.",
            "Require every workgroup participant to reach the same barrier instance in the same order.",
            "Transfer only the memory and participant scope covered by that barrier.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Convergent is not a proof",
          text: "An LLVM convergent attribute preserves a convergence fact established earlier. It cannot prove that a source-level branch sends every required participant through the same barrier.",
        },
      ],
    },
    {
      id: "atomics",
      title: "Atomics need a complete tuple",
      blocks: [
        {
          type: "paragraph",
          text: "Atomic validity is a tuple of operation, scalar type, success/failure ordering, synchronization scope, address space, and allocation coherence. A target capability says a tuple can be legalized; it does not establish that a particular runtime allocation is eligible for system scope.",
        },
        {
          type: "bullets",
          items: [
            "Use workgroup scope only for workgroup communication.",
            "Require coherent allocation evidence for device/system interactions.",
            "Reject mixed atomic and non-atomic overlap unless the model orders it explicitly.",
          ],
        },
      ],
    },
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: `// BOUNDED PROFILE, not a generally runnable kernel.\nlds.write_owned(lane, value)?;\nworkgroup.barrier(GroupMemorySpace::Lds)?;\nlet peer = lds.read_initialized(peer_lane)?;`,
      explanatory: true,
    },
    {
      language: "text",
      code: `owned_lds_write_is_in_bounds_and_framed\nmutated_read_before_barrier_is_legal  // expected rejection\nmutated_duplicate_lds_writers_are_race_free  // expected rejection`,
    },
    {
      language: "bash",
      code: "cargo +nightly-2026-04-03 test --locked -p fe2o3-kernel-ir -p dialect-amdgcn -p fe2o3-amd-target",
    },
    {
      language: "text",
      code: resultText(
        "compiler-hsaco-observed",
        "Static model and lowering tests pass. Dynamic-LDS launch plumbing and broad source integration remain incomplete.",
      ),
    },
  ),
  diagram: "memory",
  exercises: [
    {
      prompt: "Construct a branch that makes a workgroup barrier illegal.",
      hint: "Branch on a varying lane predicate before the barrier.",
      acceptance: "At least one required participant can skip the dynamic barrier instance.",
    },
  ],
  glossary: ["LDS", "epoch", "barrier convergence", "atomic scope", "ordering"],
};

const gemmMapping: Lesson = {
  id: "gemm-tiling",
  module: 4,
  order: 0,
  title: "Tiled GEMM: map ownership first",
  summary:
    "Design a workgroup tile by fixing global output ownership, cooperative loads, and boundary predicates before optimizing math.",
  duration: "55 min",
  prerequisites: ["LDS and barriers", "Matrix multiplication"],
  objectives: [
    "Map each workgroup to one C tile and each lane to disjoint output fragments.",
    "Prove cooperative A/B loads stay in bounds at edge tiles.",
    "State a loop invariant over completed K phases.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Full GEMM roadmap",
      detail:
        "fe2o3 at this pin does not expose a generally runnable, source-verified GEMM kernel. The lesson is a concrete implementation and proof decomposition.",
    },
    {
      kind: "compiler-hsaco-observed",
      label: "Reusable MFMA/LDS mechanics",
      detail:
        "A narrow gfx942 BF16 16x16x16 MFMA and XOR4 LDS tile/stream contract exists in the device, Kernel IR, target, and lowering layers.",
      reference: pinnedReference(
        [
          "cargo +nightly-2026-04-03 test --locked -p fe2o3-device -p fe2o3-kernel-ir -p dialect-amdgcn",
        ],
        [
          "crates/fe2o3-device/src/tensor.rs",
          "crates/fe2o3-kernel-ir/src/matrix.rs",
          "crates/dialect-amdgcn/src/lib.rs",
        ],
        { target: FE2O3_PIN.target },
      ),
    },
  ],
  sections: [
    {
      id: "public-layout-proof",
      title: "Read the public layout proof narrowly",
      blocks: [
        {
          type: "paragraph",
          text: "Public fe2o3 commit 027ab901bef7007d0e8da3370470556ed28baad1 pins the executable Rust register maps below to AMD Matrix Instruction Calculator commit 2ef91896bcdc4d26624f952e5c905c787cd9bc9e for gfx942 V_MFMA_F32_16X16X16_BF16. Golden tests exhaust all 64 lanes and four components for each official A/B/C/D table.",
        },
        {
          type: "table",
          headers: ["Fragment", "Logical coordinate for lane l, component c"],
          rows: [
            ["A / Src0", "row = l % 16, depth = 4 * (l / 16) + c"],
            ["B / Src1", "depth = 4 * (l / 16) + c, column = l % 16"],
            ["C / Src2", "row = 4 * (l / 16) + c, column = l % 16"],
            ["D / Vdst", "row = 4 * (l / 16) + c, column = l % 16"],
          ],
        },
        {
          type: "paragraph",
          text: "The separate executable XOR4 LDS map stages A as (row, depth) and B in transposed logical order as (column, depth). An ordinary Rust test parses the exact Verus A/B/C and nested XOR formula bodies and exhaustively compares both staging compositions. The runner pins the Verus executable bytes; 23 public proof functions discharge 73 obligations, and five mutations of A, B, C, row-major XOR4, and the inner two-bit permutation are rejected at their intended correspondence theorems.",
        },
        {
          type: "paragraph",
          text: "Public descendants f8a66d3babf764a6f064189e4634da9ee0cb046a and abe9fdca21579017a1d346fcfa66552bc81308f4 distinguish block counts [N/16,M/16,1] from the [64,1,1] workgroup and derived AQL work-item dimensions, then add a sealed target-neutral one-wave 16x16x16 Kernel IR graph. The graph has 12 direct global reads, one BF16/BF16/F32 MFMA, four observable F32 stores, exact 256-element profiles, and exhaustive lane/output ownership tests. It deliberately contains no LDS operations yet.",
        },
        {
          type: "paragraph",
          text: "Frontend checkpoint 286331aab8639dd3707e55cdf51a83f8854d26a5 adds separate build-scoped in-process Rust frontend/provider/ABI evidence. Same-name external providers and copied markers are rejected. Observed layouts, FnAbi, and provider facts are canonicalized and digested through Kernel IR; the WG64 fragment probe carries 8 BF16 plus 4 F32 values in 32 explicit bytes followed by 256 implicit bytes, 288 total. This remains a distinct fragment-level evidence profile, not the later four-slice kernel ABI or the independent WG256/384-byte mutation.",
        },
        {
          type: "paragraph",
          text: "Source-bridge commit fb75e19a73ec0a9acebb203bd9821190b0592c82 admits one exact collected root with signature A:&[u16], B:&[u16], C:&[f32], D:DisjointSlice<f32>. It binds exact layouts, rustc FnAbi, portable-MIR identity, compiler settings, gfx942:xnack-, COV6, WG64, zero LDS, and 64 explicit plus 256 implicit kernarg bytes. Consuming a private single-use receipt selects the canonical direct-global module: eight BF16 loads, four f32 loads, one BF16 MFMA, and four f32 stores. AMDGCN lowering represents the BF16 carriers with i16 loads. Commit b904f5b648c7eb249d32d73db427abe72970315a normalizes only Cargo-generated metadata in the semantic commitment while full observed argv and metadata remain receipt-bound. Commit 51bd129c31b08b636545f12229f34aaa431321f2 normalizes only the Cargo-generated root shape while the full observed root remains receipt-bound. This is source-to-canonical lowering under a reviewed correspondence contract, not a compiler refinement proof. Its Worker V2 handoff is inert and grants no final-HSACO, publication, load, or launch authority.",
        },
        {
          type: "paragraph",
          text: "Guarded-hardware commit b825661ac3f7e332d2cc9723ed1efbb54869fa33 adds an ignored one-tile gfx942:xnack- harness for exact externally supplied digest-pinned bytes and a digest-pinned observed LLVM 22 objdump. It enforces the 320-byte metadata and entry range, one retained BF16 MFMA, a global store, and forbidden instruction checks. If run, it checks a bitwise dyadic 16x16 oracle, that A/B/C inputs remained bitwise unchanged, adjacent canaries, synchronous completion, executable identity, and unload. The commit contains no run receipt, so exact hardware execution remains uncommitted and non-authoritative. The harness bypasses production prerequisites and does not authenticate the producer.",
        },
        {
          type: "paragraph",
          text: "Structural-admission commit d43f11c86196e4f01c9ee305ea8d19f6d8c17672 inspects and canonically finalizes exactly one gfx942:xnack- COV6 tiled_gemm_v1 descriptor with four slices, 64 explicit plus 256 implicit bytes, WG64, wave64, and zero LDS. It separately rejects the WG64/288-byte fragment probe and independent WG256 and 384-byte mutations, plus other structural drift. Adversarial tests intentionally admit arbitrary .text, making the limit concrete: this gate checks metadata and descriptors, not machine-body semantics, BF16/MFMA behavior, compiler origin, or Verus results. It adds no COMGR path and grants no publication, load, or launch authority.",
        },
        {
          type: "callout",
          tone: "boundary",
          title: "Three green stages are not one authority chain",
          text: "Worker V2 still does not produce an authority-bearing final HSACO from the source-authenticated canonical module, nor carry that exact identity through protected publication, loading, and launch. Machine-body semantic admission, compiler and Verus-to-machine refinement, production XOR4 LDS tiling, bounds and initialization proofs, and race freedom remain open. The lesson dependency pin remains at the older audited baseline.",
        },
      ],
    },
    {
      id: "mapping",
      title: "Freeze the coordinate map",
      blocks: [
        {
          type: "paragraph",
          text: "Choose BLOCK_M, BLOCK_N, BLOCK_K, workgroup dimensions, and the lane-to-fragment map as contract parameters. For each active output coordinate (m,n), prove m < M and n < N before writing C. For A and B edge loads, either prove the coordinate in range or write a defined zero into the owned LDS slot.",
        },
        {
          type: "table",
          headers: ["Object", "Owner", "Invariant"],
          rows: [
            ["C tile", "one workgroup", "different groups write disjoint global tiles"],
            ["A LDS tile", "cooperative lanes", "one writer per slot per phase"],
            ["B LDS tile", "cooperative lanes", "edge slots initialized to value or zero"],
            ["Accumulator", "lane fragment", "sum covers exactly completed K phases"],
          ],
        },
      ],
    },
    {
      id: "loop-proof",
      title: "Decompose the K loop",
      blocks: [
        {
          type: "steps",
          items: [
            "Prove phase * BLOCK_K does not overflow and identifies the next K interval.",
            "Prove cooperative loads initialize all tile elements before the first barrier.",
            "Prove MFMA consumes only initialized fragments and extends the accumulator invariant.",
            "Prove the second barrier prevents overwrite while peers still read the phase.",
            "After all phases, prove guarded stores are injective and in bounds.",
          ],
        },
        {
          type: "callout",
          tone: "boundary",
          title: "Numerical contract required",
          text: "A real BF16/F32 GEMM theorem must state input conversion, accumulation order, rounding, exceptional values, and an error bound or exact reference relation. Integer algebra over an abstract multiply-add is not that theorem.",
        },
      ],
    },
  ],
  tabs: completeTabs(
    { language: "rust", code: gemmDesign, explanatory: true },
    {
      language: "text",
      code: `Invariant after phase p:\n  acc[m,n] = sum(k=0..p*TILE_K) model_mul(A[m,k], B[k,n])\n\nPlus: every LDS read is initialized in the current epoch; output fragments are pairwise disjoint.`,
      explanatory: true,
    },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "A guarded one-tile gfx942 harness exists, but no exact hardware run receipt is committed. No source-derived, authority-bearing final HSACO or production LDS-tiled GEMM is claimed.",
      ),
    },
  ),
  diagram: "gemm",
  exercises: [
    {
      prompt: "Prove the C stores for a 16x16 workgroup tile are injective.",
      hint: "Factor the map into a unique lane fragment and unique element within that fragment.",
      acceptance: "Equal output coordinates imply equal workgroup, lane, and fragment element identities.",
    },
  ],
  glossary: ["GEMM", "tile", "MFMA", "accumulator invariant", "edge predicate"],
};

const gemmProof: Lesson = {
  id: "gemm-proof-plan",
  module: 4,
  order: 1,
  title: "GEMM proof and evidence plan",
  summary:
    "Turn the tiled algorithm into independent proof obligations and define the evidence needed before calling it complete.",
  duration: "38 min",
  prerequisites: ["Tiled GEMM mapping"],
  objectives: [
    "Partition GEMM assurance into memory, synchronization, function, and numerical properties.",
    "Pair every positive theorem with a targeted mutation.",
    "Define compiler, HSACO, and gfx942 observations for the same artifact identity.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Acceptance plan",
      detail:
        "The staged checkpoint authenticates an exact Rust root into canonical direct-global Kernel IR, defines a guarded gfx942 harness for separately supplied bytes, and structurally admits the exact four-slice Worker V2 artifact profile. Source-to-canonical lowering is not compiler refinement, exact hardware execution remains uncommitted and non-authoritative, and structural admission does not inspect machine-body semantics. Source-derived final HSACO/load/launch authority, production LDS tiling, and memory and race proofs remain future gates.",
    },
  ],
  sections: [
    {
      id: "proof-ledger",
      title: "Property ledger",
      blocks: [
        {
          type: "table",
          headers: ["Property", "Positive proof", "Mutation"],
          rows: [
            ["Bounds", "all global/LDS regions bounded", "drop edge predicate"],
            ["Initialization", "phase writes dominate reads", "read before barrier"],
            ["Race freedom", "global and LDS writes injective", "duplicate lane owner"],
            ["Convergence", "all participants reach two barriers", "varying early return"],
            ["Function", "phase invariant reaches A x B", "skip final K phase"],
            ["Numerics", "error within stated bound", "change accumulation order/model"],
          ],
        },
      ],
    },
    {
      id: "evidence",
      title: "Artifact-level closure",
      blocks: [
        {
          type: "steps",
          items: [
            "Compile the exact shared Rust body through rustc and canonical Kernel IR.",
            "Bind the Verus model and theorem identities to source and semantic contract hashes.",
            "Link with measured LLVM/LLD inputs and inspect target, kernarg ABI, LDS, barriers, MFMA, and exports.",
            "Run edge dimensions and adversarial aliases on gfx942 against an independent high-precision oracle.",
            "Sign the result set and obtain independent review before any Complete promotion.",
          ],
        },
        {
          type: "callout",
          tone: "proof",
          title: "Three ledger rows are concrete but unjoined",
          text: "Commit fb75e19a authenticates the exact source profile and selects canonical Kernel IR; b825661a defines a guarded one-tile gfx942 harness but commits no execution receipt; d43f11c8 admits and canonically finalizes the exact structural artifact profile. None proves that the Worker V2 machine body was derived from that source, and none grants protected publication, loading, or launch authority. The remaining proof ledger must also cover bounds, initialization, barriers, LDS ownership, race freedom, and numerical refinement.",
        },
      ],
    },
  ],
  tabs: completeTabs(
    { language: "rust", code: gemmDesign, explanatory: true },
    { language: "rust", code: noProof, explanatory: true },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "Source selection, structural artifact checks, and a hardware harness now exist as separate stages. The harness carries no committed run receipt. Completion still requires one identity-bound source/proof/compiler/machine/runtime authority chain.",
      ),
    },
  ),
  diagram: "evidence",
  exercises: [
    {
      prompt: "Design one negative test for each row in the property ledger.",
      hint: "The mutation must fail at the named property, not during parsing.",
      acceptance: "Six well-scoped mutations with stable expected diagnostics or failed clauses.",
    },
  ],
  glossary: ["property ledger", "translation validation", "numerical oracle"],
};

const softmax: Lesson = {
  id: "softmax-invariant",
  module: 5,
  order: 0,
  title: "Softmax: specify stability first",
  summary:
    "Derive a numerically stable row softmax and make masking, empty rows, and approximation error explicit.",
  duration: "42 min",
  prerequisites: ["Reductions", "Floating-point error basics"],
  objectives: [
    "State the max-subtracted softmax specification.",
    "Handle all-masked rows without undefined division.",
    "Separate real-number identities from target math-library behavior.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Softmax roadmap",
      detail:
        "No current fe2o3 source-to-HSACO softmax kernel is claimed. The lesson prepares the contracts required by flash attention.",
    },
  ],
  sections: [
    {
      id: "spec",
      title: "Define the row contract",
      blocks: [
        {
          type: "paragraph",
          text: "For each unmasked score x_i, define p_i = exp(x_i - m) / sum_j exp(x_j - m), where m is the maximum unmasked score. Require p_i >= 0, masked outputs equal the chosen sentinel behavior, and the unmasked sum approximates one under a stated error model.",
        },
        {
          type: "bullets",
          items: [
            "Specify NaN and infinity policy rather than inheriting an accidental backend choice.",
            "Give all-masked rows an explicit output and denominator contract.",
            "Bind the exp approximation and reduction order into numerical evidence.",
          ],
        },
      ],
    },
    {
      id: "proof",
      title: "Proof layers",
      blocks: [
        {
          type: "table",
          headers: ["Layer", "Claim"],
          rows: [
            ["Real model", "max subtraction preserves exact softmax"],
            ["Finite arithmetic", "running max/sum stay representable under premises"],
            ["Approximation", "exp and reduction error remain within epsilon"],
            ["Memory", "row loads and output writes are bounded and race-free"],
          ],
        },
        {
          type: "callout",
          tone: "boundary",
          title: "Device math is a separate dependency",
          text: "A device-library exp call needs a linked symbol, target implementation, and numerical contract. The current narrow OCML linking slice does not turn an arbitrary softmax into a verified kernel.",
        },
      ],
    },
  ],
  tabs: completeTabs(
    {
      language: "rust",
      code: `// DESIGN ONLY\nlet m = reduce_max(active_scores);\nlet weights = map(active_scores, |x| exp(x - m));\nlet z = reduce_sum(weights);\nwrite_row(map(weights, |w| w / z));`,
      explanatory: true,
    },
    {
      language: "text",
      code: `ensures unmasked_sum(output) ~= 1\nensures masked(i) ==> output[i] == 0\nensures finite_inputs && nonempty_active ==> denominator > 0`,
      explanatory: true,
    },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "The output contract and error budget are ready to instantiate once source lowering, device math, and reduction execution are connected.",
      ),
    },
  ),
  diagram: "reduction",
  exercises: [
    {
      prompt: "Define the all-masked row behavior for your application.",
      hint: "Avoid a zero denominator and state whether the output is zero, NaN, or an error.",
      acceptance: "One explicit behavior appears in both the functional spec and host admission policy.",
    },
  ],
  glossary: ["softmax", "max subtraction", "error budget", "masking"],
};

const flash: Lesson = {
  id: "flash-attention",
  module: 5,
  order: 1,
  title: "Flash attention: online invariant",
  summary:
    "Fuse tiled QK, online softmax, and V accumulation around one row-state invariant without claiming a current executable kernel.",
  duration: "65 min",
  prerequisites: ["GEMM proof plan", "Softmax invariant"],
  objectives: [
    "Derive the online max, normalization sum, and output correction invariant.",
    "Track Q, K, V, score, and output tiles through distinct memory epochs.",
    "List masking, precision, and machine-effect evidence required for closure.",
  ],
  claims: [
    {
      kind: "design-only",
      label: "Flash attention roadmap",
      detail:
        "The algorithm, invariants, and evidence plan are educational design material. fe2o3 at this pin cannot compile or run this complete kernel.",
    },
  ],
  sections: [
    {
      id: "online",
      title: "Carry a normalized row state",
      blocks: [
        {
          type: "paragraph",
          text: "After processing key tiles 0..t, keep running_max m_t, running_sum l_t measured in the m_t frame, and output numerator o_t in the same frame. When a new tile raises the maximum, multiply both old l and old o by exp(m_old - m_new) before adding the new tile contributions.",
        },
        {
          type: "callout",
          tone: "proof",
          title: "Central invariant",
          text: "l_t equals the sum of exp(score - m_t) over exactly the processed, unmasked keys, and o_t equals the correspondingly weighted sum of V. Final output is o_t / l_t under the row-validity policy.",
        },
      ],
    },
    {
      id: "effects",
      title: "Machine effects are part of the proof",
      blocks: [
        {
          type: "table",
          headers: ["Phase", "Memory", "Required fact"],
          rows: [
            ["Q residency", "register/LDS", "row fragment initialized and stable"],
            ["K/V load", "global to LDS", "edge and causal predicates dominate reads"],
            ["Score tile", "MFMA accumulators", "layout matches lane fragments"],
            ["Online update", "wave/workgroup reductions", "same active mask and order"],
            ["Output", "global", "one owner per query/output element"],
          ],
        },
        {
          type: "paragraph",
          text: "Causal masking, variable sequence lengths, head strides, grouped-query layouts, dropout, and backward propagation each change the specification. Introduce them as separate versioned profiles rather than optional booleans inside one unreviewed theorem.",
        },
      ],
    },
    {
      id: "closure",
      title: "What hardware evidence must inspect",
      blocks: [
        {
          type: "bullets",
          items: [
            "Exact gfx942 target, wave64 contract, kernarg ABI, LDS bytes, barriers, and MFMA forms.",
            "Boundary sequence lengths, causal corners, all-masked policy, and canary regions.",
            "Numerical comparison against an independent high-precision implementation with a stated tolerance envelope.",
            "Identity binding from source and proofs through direct LLVM/LLD output and the loaded code object.",
          ],
        },
      ],
    },
  ],
  tabs: completeTabs(
    { language: "rust", code: flashDesign, explanatory: true },
    {
      language: "text",
      code: `Invariant(t):\n  m = max(scores over processed unmasked keys)\n  l = sum(exp(score - m)) over the same keys\n  o = sum(exp(score - m) * V) over the same keys\n\nFinal: output = o / l`,
      explanatory: true,
    },
    { language: "bash", code: noHost, explanatory: true },
    {
      language: "text",
      code: resultText(
        "design-only",
        "No compile, HSACO, dispatch, or Verus result is claimed for the complete flash-attention pseudocode.",
      ),
    },
  ),
  diagram: "attention",
  exercises: [
    {
      prompt: "Extend the online invariant with a causal mask.",
      hint: "Quantify only keys whose absolute position does not exceed the query position.",
      acceptance: "The processed set, maximum, sum, and numerator all use the identical masked domain.",
    },
  ],
  glossary: ["flash attention", "online softmax", "causal mask", "numerical refinement"],
};

export const modules3to5: CurriculumModule[] = [
  {
    number: 3,
    title: "Collectives and synchronization",
    summary: "Reason about scope, participation, epochs, and target gates.",
    lessons: [collectives, synchronization],
  },
  {
    number: 4,
    title: "Tiled GEMM",
    summary: "Design tile ownership and decompose the proof before optimization.",
    lessons: [gemmMapping, gemmProof],
  },
  {
    number: 5,
    title: "Softmax and attention",
    summary: "State online numerical invariants and fused memory effects.",
    lessons: [softmax, flash],
  },
];
