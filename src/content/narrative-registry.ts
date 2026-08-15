import type { LessonBlock, NarrativeLessonSection } from "./model";
import { narrativeFingerprint } from "./narrative-fingerprint";
import {
  narrativeFingerprints,
  narrativeIds,
  narrativeOrderByLesson,
  stagedEvidenceLessonIds,
  type NarrativeId,
} from "./narrative-policy";
import { deepFreeze, hasOwn, type DeepReadonly } from "./registry";

export interface NarrativeRegistryEntry {
  sectionId: string;
  title: string;
  blocks: LessonBlock[];
}

const narrativeRegistry = deepFreeze({
  "read-the-evidence/labels": {
    "sectionId": "labels",
    "title": "One kernel, several independent questions",
    "blocks": [
      {
        "type": "paragraph",
        "text": "A kernel can have a checked Rust shape, a successful Verus model, valid AMDGPU LLVM, an inspected HSACO, and a passing GPU run while still lacking a production authority chain that binds all five facts together. This guide reports those facts independently."
      },
      {
        "type": "table",
        "headers": [
          "Label",
          "What it establishes",
          "What it does not"
        ],
        "rows": [
          [
            "Runnable now",
            "A current fe2o3 command executes",
            "Formal correctness"
          ],
          [
            "Verus model",
            "Named properties hold in a versioned model",
            "LLVM or GPU refinement"
          ],
          [
            "HSACO mechanics",
            "Compiler or code-object checks pass",
            "Runtime semantics"
          ],
          [
            "GPU observed",
            "A pinned hardware campaign passed",
            "Universal correctness"
          ],
          [
            "Design only",
            "A concrete algorithm and proof plan",
            "A compilable fe2o3 kernel"
          ]
        ]
      }
    ]
  },
  "read-the-evidence/differentiator": {
    "sectionId": "differentiator",
    "title": "The verification claim, stated precisely",
    "blocks": [
      {
        "type": "callout",
        "tone": "boundary",
        "title": "No exclusivity claim",
        "text": "CUDA and HIP kernels can be analyzed by external verifiers, model checkers, sanitizers, and proof systems. fe2o3's intended differentiator is one Rust kernel body plus explicit, versioned proof and evidence binding across compiler and runtime boundaries."
      },
      {
        "type": "paragraph",
        "text": "Verus proves Rust-level specifications. Kernel IR checks modeled effects. Artifact inspection checks code-object facts. Runtime admission checks dynamic allocations and launch geometry. No single layer is allowed to mint a safe launch on its own."
      },
      {
        "type": "paragraph",
        "text": "macro_rules! and #[kernel] serve different purposes. macro_rules! is declarative compile-time token expansion; vecadd uses it to share a small body with a Verus model, but it neither marks a GPU kernel nor provides runtime behavior or proof. #[kernel] is a procedural attribute that marks an ordinary Rust function for fe2o3's kernel frontend and generated typed API. Production kernel bodies should be ordinary attributed Rust. The LDS Slice 1 source follows that shape and contains no macro_rules! body, although its unsupported frontend operations still fail closed."
      }
    ]
  },
  "read-the-evidence/scalar-gemm-checkpoint": {
    "sectionId": "scalar-gemm-checkpoint",
    "title": "Read the scalar GEMM checkpoint by layer",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Layer",
          "Observed at the public checkpoint",
          "Open boundary"
        ],
        "rows": [
          [
            "Proof profile",
            "Nine focused tests pin the exact proof source and bind its target, properties, tools, transcript, caller-supplied freshness, and artifact digest.",
            "The profile is inert review evidence. It does not execute Verus or grant authority."
          ],
          [
            "Physical-effect profile",
            "Four upstream LLVM 22 MC analyzer tests passed on mi300x for the exact artifact: 60 opcodes, one function, zero calls, two constrained backward loops, and 19 ordered physical effect sites matching the Rust profile. No COMGR is used.",
            "This is static, inert evidence only. It provides no compiler or address refinement and no proof of memory safety, bounds safety, race freedom, or launch correctness; downstream authenticated evidence must bind the changed analyzer identity."
          ],
          [
            "MI300X observation",
            "All HARDWARE_CASES cases passed in 1.41 seconds for the 10,128-byte gfx942:xnack- artifact, including zero-output no-dispatch, k=0 +0, bitwise oracle, input buffers remained bitwise unchanged, canaries, and unload.",
            "The raw HSA smoke bypasses production prerequisite authentication and grants no protected evidence."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Newer progress, unchanged lesson pin",
        "text": "The progress dashboard tracks a separately gated eventual public target, while lesson claim badges remain pinned to the older audited FE2O3_PIN until a separate baseline audit. This site revision must not be published until both harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main resolve exactly to that target. The typed staged records below close useful interfaces, but they do not combine source proof, compiler refinement, final machine semantics, and protected execution into one authority chain."
      }
    ]
  },
  "gfx942-setup/toolchain": {
    "sectionId": "toolchain",
    "title": "Pinned inputs",
    "blocks": [
      {
        "type": "bullets",
        "items": [
          "Rust channel: nightly-2026-04-03.",
          "Tutorial lesson evidence baseline: acb3d2752e4e50e4f4a99ebfc4b180eb79160930.",
          "Primary target: gfx942:xnack-; do not infer feature state from the processor name alone.",
          "ROCm tools must be discoverable by cargo-fe2o3 doctor."
        ]
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "Target text is not attestation",
        "text": "Parsing gfx942:xnack- does not prove that the selected device or code object has that identity. The runtime and artifact layers must observe and bind those facts separately."
      }
    ]
  },
  "gfx942-setup/sequence": {
    "sectionId": "sequence",
    "title": "Run narrow gates first",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Run generic validation without ROCm to check the repository and evidence policy.",
          "Run cargo-fe2o3 doctor and the ROCm compile lane with an explicit target.",
          "Inspect the generated HSACO before dispatch.",
          "Opt into hardware smoke only on the intended device host."
        ]
      }
    ]
  },
  "first-fill/kernel-shape": {
    "sectionId": "kernel-shape",
    "title": "The guarded write is the algorithm",
    "blocks": [
      {
        "type": "paragraph",
        "text": "thread::index_1d returns the current logical index witness. DisjointSlice::get_mut consumes the matching index-space witness and returns None for rounded-up launch lanes outside the output extent. Keeping the write inside this guard makes the bounds argument visible to both compiler analysis and the Verus model."
      },
      {
        "type": "bullets",
        "items": [
          "Index identity, not an arbitrary usize, drives safe mutable access.",
          "Distinct active identities select distinct output elements.",
          "Rounded tail threads perform no write."
        ]
      }
    ]
  },
  "first-fill/trust": {
    "sectionId": "trust",
    "title": "What remains trusted",
    "blocks": [
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Model-to-machine gap",
        "text": "The fill model has an external hardware_thread_id boundary. The theorem is conditional on that contract and does not prove that the AMDGPU intrinsic or loaded HSACO refines it."
      },
      {
        "type": "paragraph",
        "text": "The current fill example also loads a path-selected HSACO and packs its argument through an unsafe launch macro. It is runnable evidence, not a safe generated launch authority."
      }
    ]
  },
  "typed-vecadd/same-body": {
    "sectionId": "same-body",
    "title": "Share control and memory shape",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The shared macro contains thread identity, guard, reads, addition call site, and write exactly once. Production Rust supplies the device intrinsic and f32 addition; Verus supplies modeled adapters. The adapters are explicit boundaries, not hidden claims of equivalence."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Proved here",
        "text": "For an in-range identity, both input reads and the output write are in bounds; distinct identities own distinct outputs; the guarded update preserves every other element."
      }
    ]
  },
  "typed-vecadd/typed-host": {
    "sectionId": "typed-host",
    "title": "Generated host ownership",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Kernel::load binds the embedded artifact profile. prepare checks equal nonempty f32 buffers, context, geometry, and aliases while retaining borrows. Prepared::launch keeps resources alive through synchronous dispatch. This profile is exact and narrow; arbitrary signatures do not receive this authority."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Arithmetic remains abstract",
        "text": "The real-body Verus proof deliberately does not claim IEEE-754 f32 addition, NaN behavior, signed zero, contraction, or operation ordering. GPU and CPU result checks are valuable empirical evidence, not a universal numerical theorem."
      }
    ]
  },
  "verus-contracts/contract-shape": {
    "sectionId": "contract-shape",
    "title": "State assumptions where they enter",
    "blocks": [
      {
        "type": "paragraph",
        "text": "A bounds theorem should require the allocation extent, element width, and active index. A race-freedom theorem should require distinct invocation identities and prove distinct regions. Initialization should be a named capability or premise, not inferred from the existence of a Rust reference."
      },
      {
        "type": "bullets",
        "items": [
          "Use nat or int for mathematical arithmetic, then prove machine representability.",
          "Expose hardware identity and allocation provenance as refinement obligations.",
          "Keep functional arithmetic separate from memory-safety arithmetic."
        ]
      }
    ]
  },
  "verus-contracts/negative": {
    "sectionId": "negative",
    "title": "Mutation tests guard the theorem",
    "blocks": [
      {
        "type": "paragraph",
        "text": "A positive proof can become vacuous after a mistaken premise or abstraction change. The fe2o3 runner pairs each important theorem with a mutation and requires Verus to fail at the expected function and proof obligation. Parse errors and unrelated failures do not count."
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "Verification is scoped",
        "text": "A theorem proves exactly its specification in its model. It does not automatically validate source sharing, compiler translation, artifact identity, or runtime arguments."
      }
    ]
  },
  "memory-race-proof/regions": {
    "sectionId": "regions",
    "title": "Prove byte regions, not pointer stories",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Model an access as allocation identity plus byte offset and length. Bounds prove the entire half-open region lies in the allocation and address space. Provenance distinguishes equal numeric addresses from the same authorized allocation. Alignment is a separate layout fact."
      },
      {
        "type": "table",
        "headers": [
          "Property",
          "Typical premise",
          "Result"
        ],
        "rows": [
          [
            "Bounds",
            "i < len; len * width representable",
            "end <= allocation end"
          ],
          [
            "Initialization",
            "shared-read capability is initialized",
            "read is defined in model"
          ],
          [
            "Race freedom",
            "different IDs map injectively",
            "write regions do not overlap"
          ],
          [
            "Frame",
            "one owned output region",
            "all other elements unchanged"
          ]
        ]
      }
    ]
  },
  "memory-race-proof/dynamic-join": {
    "sectionId": "dynamic-join",
    "title": "Static proof meets dynamic launch",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The runtime must still authenticate the actual allocation IDs, extents, aliases, context, launch geometry, and artifact identity. Ghost facts supplied by a proof harness cannot be treated as observations of those values."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Current boundary",
        "text": "At the pinned commit, these proof records are evidence but do not by themselves create Verified launch authority. The production prerequisite authenticator for the general typed path remains absent."
      }
    ]
  },
  "reductions-scans/scope": {
    "sectionId": "scope",
    "title": "Scope is part of the operation",
    "blocks": [
      {
        "type": "paragraph",
        "text": "A wave reduction communicates only among participating lanes in one wave. A workgroup reduction composes wave results through LDS and at least one workgroup barrier. Treating the two as interchangeable loses both the participation set and the memory-ordering proof."
      },
      {
        "type": "table",
        "headers": [
          "Layer",
          "State",
          "Proof focus"
        ],
        "rows": [
          [
            "Wave",
            "registers and active mask",
            "inactive lanes do not contribute"
          ],
          [
            "Cross-wave",
            "one partial per wave in LDS",
            "one writer per slot"
          ],
          [
            "Workgroup",
            "final partials",
            "barrier order and initialized reads"
          ]
        ]
      }
    ]
  },
  "reductions-scans/scan": {
    "sectionId": "scan",
    "title": "A scan exposes more ownership",
    "blocks": [
      {
        "type": "paragraph",
        "text": "An inclusive scan returns one prefix per active lane. Besides proving the algebraic prefix result, prove that every lane receives one output slot and that inactive lanes cannot affect active prefixes. For a workgroup scan, carry the per-wave offset and epoch explicitly."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Current maturity",
        "text": "The APIs, model, IR operations, and lowering slices are real. This lesson does not present a generally runnable Rust reduction kernel because the production source-to-IR path does not yet cover that surface end to end."
      }
    ]
  },
  "lds-barriers-atomics/epochs": {
    "sectionId": "epochs",
    "title": "Initialization crosses a scoped epoch",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Assign disjoint LDS write regions to participating lanes.",
          "Prove every later-read region is initialized by the write phase.",
          "Require every workgroup participant to reach the same barrier instance in the same order.",
          "Transfer only the memory and participant scope covered by that barrier."
        ]
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "Convergent is not a proof",
        "text": "An LLVM convergent attribute preserves a convergence fact established earlier. It cannot prove that a source-level branch sends every required participant through the same barrier."
      }
    ]
  },
  "lds-barriers-atomics/atomics": {
    "sectionId": "atomics",
    "title": "Atomics need a complete tuple",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Atomic validity is a tuple of operation, scalar type, success/failure ordering, synchronization scope, address space, and allocation coherence. A target capability says a tuple can be legalized; it does not establish that a particular runtime allocation is eligible for system scope."
      },
      {
        "type": "bullets",
        "items": [
          "Use workgroup scope only for workgroup communication.",
          "Require coherent allocation evidence for device/system interactions.",
          "Reject mixed atomic and non-atomic overlap unless the model orders it explicitly."
        ]
      }
    ]
  },
  "gemm-tiling/public-layout-proof": {
    "sectionId": "public-layout-proof",
    "title": "Read the public layout proof narrowly",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Public fe2o3 commit 027ab901bef7007d0e8da3370470556ed28baad1 pins the executable Rust register maps below to AMD Matrix Instruction Calculator commit 2ef91896bcdc4d26624f952e5c905c787cd9bc9e for gfx942 V_MFMA_F32_16X16X16_BF16. Golden tests exhaust all 64 lanes and four components for each official A/B/C/D table."
      },
      {
        "type": "table",
        "headers": [
          "Fragment",
          "Logical coordinate for lane l, component c"
        ],
        "rows": [
          [
            "A / Src0",
            "row = l % 16, depth = 4 * (l / 16) + c"
          ],
          [
            "B / Src1",
            "depth = 4 * (l / 16) + c, column = l % 16"
          ],
          [
            "C / Src2",
            "row = 4 * (l / 16) + c, column = l % 16"
          ],
          [
            "D / Vdst",
            "row = 4 * (l / 16) + c, column = l % 16"
          ]
        ]
      },
      {
        "type": "paragraph",
        "text": "The separate executable XOR4 LDS map stages A as (row, depth) and B in transposed logical order as (column, depth). An ordinary Rust test parses the exact Verus A/B/C and nested XOR formula bodies and exhaustively compares both staging compositions. The runner pins the Verus executable bytes; 23 public proof functions discharge 73 obligations, and five mutations of A, B, C, row-major XOR4, and the inner two-bit permutation are rejected at their intended correspondence theorems."
      },
      {
        "type": "paragraph",
        "text": "Public descendants f8a66d3babf764a6f064189e4634da9ee0cb046a and abe9fdca21579017a1d346fcfa66552bc81308f4 distinguish block counts [N/16,M/16,1] from the [64,1,1] workgroup and derived AQL work-item dimensions, then add a sealed target-neutral one-wave 16x16x16 Kernel IR graph. The graph has 12 direct global reads, one BF16/BF16/F32 MFMA, four observable F32 stores, exact 256-element profiles, and exhaustive lane/output ownership tests. It deliberately contains no LDS operations yet."
      },
      {
        "type": "paragraph",
        "text": "Frontend checkpoint 286331aab8639dd3707e55cdf51a83f8854d26a5 adds separate build-scoped in-process Rust frontend/provider/ABI evidence. Same-name external providers and copied markers are rejected. Observed layouts, FnAbi, and provider facts are canonicalized and digested through Kernel IR; the WG64 fragment probe carries 8 BF16 plus 4 F32 values in 32 explicit bytes followed by 256 implicit bytes, 288 total. This remains a distinct fragment-level evidence profile, not the later four-slice kernel ABI or the independent WG256/384-byte mutation."
      },
      {
        "type": "paragraph",
        "text": "Four pre-execution public increments define LDS Slice 1 without promoting it to functional status. Commit 4c79c58de1da19d9b7a22cba906f301e347c8f7c seals the fixed two-tile LDS Kernel IR. Commit 97373b781ac3643b1de61b4572894f7028b565b0 verifies the separate exact-real source model and targeted mutations. Commit ee76cedcdc4126c69bc486a5ac12900c1c5485b1 adds the ordinary #[kernel(typed, ...)] Rust body and deliberately traps at unsupported LDS acquisition. Commit 50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2 lowers the canonical IR through upstream LLVM/LLD and inspects the final HSACO machine shape. The typed evidence table states the exact authority boundary for each increment."
      },
      {
        "type": "paragraph",
        "text": "Slice 2 adds proof/model depth without upgrading execution. Commit aba53376b4825c730ca9e9685e274e0c334e0e32 verifies one through four complete K phases with 196 verified and 0 errors, rejects missing-reuse and accumulator-reset mutations, and exhaustively runs integer event models for 1, 2, and 4 phases. This is not an attributed multi-phase GPU kernel, backend result, HSACO, or hardware observation."
      },
      {
        "type": "paragraph",
        "text": "A separate Slice 1 hardware increment at 79ad2298619baa4138b5edbf55e0d8044295bec2 generated HSACO from canonical Kernel IR with SHA-pinned upstream LLVM 22 llc, ld.lld, and llvm-objdump, without COMGR. On MI300X, six cases checked 1,536 outputs, unchanged A/B values, and allocation canaries; one ignored hardware test passed in 33.72 seconds. This is observational IR-derived evidence only, not Rust-source correspondence, Verus proof, Worker V2, publisher, or protected-launch authority."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Bounded increments are not a functional kernel",
        "text": "An attributed multi-phase source, source-to-LDS-Kernel-IR collection, and #[kernel] WG64 contract integration remain open. The observed Slice 1 final HSACO begins from the separate canonical IR and is not carried through protected publisher, load, and launch authority. Its canaries do not prove general illegal-access or race freedom. Slice 2 adds no backend or hardware claim. Compiler and Verus-to-machine refinement plus an IEEE BF16/F32 numerical contract also remain open. The lesson dependency pin remains at the older audited baseline."
      }
    ]
  },
  "gemm-tiling/mapping": {
    "sectionId": "mapping",
    "title": "Freeze the coordinate map",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Choose BLOCK_M, BLOCK_N, BLOCK_K, workgroup dimensions, and the lane-to-fragment map as contract parameters. For each active output coordinate (m,n), prove m < M and n < N before writing C. For A and B edge loads, either prove the coordinate in range or write a defined zero into the owned LDS slot."
      },
      {
        "type": "table",
        "headers": [
          "Object",
          "Owner",
          "Invariant"
        ],
        "rows": [
          [
            "C tile",
            "one workgroup",
            "different groups write disjoint global tiles"
          ],
          [
            "A LDS tile",
            "cooperative lanes",
            "one writer per slot per phase"
          ],
          [
            "B LDS tile",
            "cooperative lanes",
            "edge slots initialized to value or zero"
          ],
          [
            "Accumulator",
            "lane fragment",
            "sum covers exactly completed K phases"
          ]
        ]
      }
    ]
  },
  "gemm-tiling/loop-proof": {
    "sectionId": "loop-proof",
    "title": "Decompose the K loop",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Prove phase * BLOCK_K does not overflow and identifies the next K interval.",
          "Prove cooperative loads initialize all tile elements before the first barrier.",
          "Prove MFMA consumes only initialized fragments and extends the accumulator invariant.",
          "Prove the second barrier prevents overwrite while peers still read the phase.",
          "After all phases, prove guarded stores are injective and in bounds."
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Numerical contract required",
        "text": "A real BF16/F32 GEMM theorem must state input conversion, accumulation order, rounding, exceptional values, and an error bound or exact reference relation. Integer algebra over an abstract multiply-add is not that theorem."
      }
    ]
  },
  "gemm-proof-plan/proof-ledger": {
    "sectionId": "proof-ledger",
    "title": "Property ledger",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Property",
          "Positive proof",
          "Mutation"
        ],
        "rows": [
          [
            "Bounds",
            "all global/LDS regions bounded",
            "drop edge predicate"
          ],
          [
            "Initialization",
            "phase writes dominate reads",
            "read before barrier"
          ],
          [
            "Race freedom",
            "global and LDS writes injective",
            "duplicate lane owner"
          ],
          [
            "Convergence",
            "all participants reach two barriers",
            "varying early return"
          ],
          [
            "Function",
            "phase invariant reaches A x B",
            "skip final K phase"
          ],
          [
            "Numerics",
            "error within stated bound",
            "change accumulation order/model"
          ]
        ]
      }
    ]
  },
  "gemm-proof-plan/evidence": {
    "sectionId": "evidence",
    "title": "Artifact-level closure",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Compile the exact shared Rust body through rustc and canonical Kernel IR.",
          "Bind the Verus model and theorem identities to source and semantic contract hashes.",
          "Link with measured LLVM/LLD inputs and inspect target, kernarg ABI, LDS, barriers, MFMA, and exports.",
          "Run edge dimensions and adversarial aliases on gfx942 against an independent high-precision oracle.",
          "Sign the result set and obtain independent review before any Complete promotion."
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The model ledger is stronger but still unjoined",
        "text": "The bounded Slice 1 and Slice 2 models now cover bounds, current-epoch initialization, barrier participation, LDS ownership, disjoint stores, accumulator preservation, and exact-real products. Those results remain separate from the attributed source, compiler, artifact, and runtime records. Closure still requires multi-phase source-to-machine derivation, protected publication and launch, machine-level race evidence, and IEEE numerical refinement."
      }
    ]
  },
  "softmax-invariant/spec": {
    "sectionId": "spec",
    "title": "Define the row contract",
    "blocks": [
      {
        "type": "paragraph",
        "text": "For each unmasked score x_i, define p_i = exp(x_i - m) / sum_j exp(x_j - m), where m is the maximum unmasked score. Require p_i >= 0, masked outputs equal the chosen sentinel behavior, and the unmasked sum approximates one under a stated error model."
      },
      {
        "type": "bullets",
        "items": [
          "Specify NaN and infinity policy rather than inheriting an accidental backend choice.",
          "Give all-masked rows an explicit output and denominator contract.",
          "Bind the exp approximation and reduction order into numerical evidence."
        ]
      }
    ]
  },
  "softmax-invariant/proof": {
    "sectionId": "proof",
    "title": "Proof layers",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Layer",
          "Claim"
        ],
        "rows": [
          [
            "Real model",
            "max subtraction preserves exact softmax"
          ],
          [
            "Finite arithmetic",
            "running max/sum stay representable under premises"
          ],
          [
            "Approximation",
            "exp and reduction error remain within epsilon"
          ],
          [
            "Memory",
            "row loads and output writes are bounded and race-free"
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Device math is a separate dependency",
        "text": "A device-library exp call needs a linked symbol, target implementation, and numerical contract. The current narrow OCML linking slice does not turn an arbitrary softmax into a verified kernel."
      }
    ]
  },
  "flash-attention/online": {
    "sectionId": "online",
    "title": "Carry a normalized row state",
    "blocks": [
      {
        "type": "paragraph",
        "text": "After processing key tiles 0..t, keep running_max m_t, running_sum l_t measured in the m_t frame, and output numerator o_t in the same frame. When a new tile raises the maximum, multiply both old l and old o by exp(m_old - m_new) before adding the new tile contributions."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Central invariant",
        "text": "l_t equals the sum of exp(score - m_t) over exactly the processed, unmasked keys, and o_t equals the correspondingly weighted sum of V. Final output is o_t / l_t under the row-validity policy."
      }
    ]
  },
  "flash-attention/effects": {
    "sectionId": "effects",
    "title": "Machine effects are part of the proof",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Phase",
          "Memory",
          "Required fact"
        ],
        "rows": [
          [
            "Q residency",
            "register/LDS",
            "row fragment initialized and stable"
          ],
          [
            "K/V load",
            "global to LDS",
            "edge and causal predicates dominate reads"
          ],
          [
            "Score tile",
            "MFMA accumulators",
            "layout matches lane fragments"
          ],
          [
            "Online update",
            "wave/workgroup reductions",
            "same active mask and order"
          ],
          [
            "Output",
            "global",
            "one owner per query/output element"
          ]
        ]
      },
      {
        "type": "paragraph",
        "text": "Causal masking, variable sequence lengths, head strides, grouped-query layouts, dropout, and backward propagation each change the specification. Introduce them as separate versioned profiles rather than optional booleans inside one unreviewed theorem."
      }
    ]
  },
  "flash-attention/closure": {
    "sectionId": "closure",
    "title": "What hardware evidence must inspect",
    "blocks": [
      {
        "type": "bullets",
        "items": [
          "Exact gfx942 target, wave64 contract, kernarg ABI, LDS bytes, barriers, and MFMA forms.",
          "Boundary sequence lengths, causal corners, all-masked policy, and canary regions.",
          "Numerical comparison against an independent high-precision implementation with a stated tolerance envelope.",
          "Identity binding from source and proofs through direct LLVM/LLD output and the loaded code object."
        ]
      }
    ]
  },
  "moe-routing/assumptions": {
    "sectionId": "assumptions",
    "title": "Make router policy total",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Define how NaNs compare, how equal logits break ties, whether duplicate expert IDs are possible, and whether top-k order matters. A stable policy should produce the same ordered expert choices for the same input bits and model version."
      },
      {
        "type": "bullets",
        "items": [
          "0 < K <= expert_count.",
          "Every selected expert ID is in range and unique for one token.",
          "Capacity and token_count * K arithmetic are checked before allocation.",
          "Overflow policy is explicit: drop, reroute, or spill."
        ]
      }
    ]
  },
  "moe-routing/permutation": {
    "sectionId": "permutation",
    "title": "Counts, scans, and stable rank",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Count accepted routes per expert under the capacity policy.",
          "Exclusive-scan counts to obtain disjoint expert output ranges.",
          "Give each token/expert pair a stable rank among earlier accepted routes.",
          "Prove base[expert] + rank is in that expert's range and globally unique.",
          "Write the inverse map needed to combine expert outputs back into token order."
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Race-freedom hinge",
        "text": "The permutation write is race-free only if stable_rank is injective among accepted routes for one expert and the exclusive-scan ranges for different experts are disjoint."
      }
    ]
  },
  "moe-expert-compute/composition": {
    "sectionId": "composition",
    "title": "Range proofs become GEMM dimensions",
    "blocks": [
      {
        "type": "paragraph",
        "text": "For expert e, the scan establishes a compact range [base_e, base_e + count_e). Use count_e as M for that expert's token-by-weight GEMM. The weight tensor supplies K and N. The GEMM admission proof must bind these dimensions, layouts, and exact expert weight identity."
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "Dynamic scheduling changes the proof surface",
        "text": "A persistent kernel or device work queue introduces atomics, liveness, and fairness assumptions. Begin with a deterministic host-scheduled expert order before adding that separate profile."
      }
    ]
  },
  "moe-expert-compute/combine": {
    "sectionId": "combine",
    "title": "Return to token order",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The inverse map ties every expert output row back to one original token and route rank. The combine writes one final token vector from its K routed results. Avoid cross-token races by assigning one owner to each final token; define route-weight normalization and accumulation order for numerical reproducibility."
      },
      {
        "type": "table",
        "headers": [
          "Stage",
          "Identity carried",
          "Primary obligation"
        ],
        "rows": [
          [
            "Route",
            "token, expert, rank",
            "unique bounded slot"
          ],
          [
            "Expert GEMM",
            "expert, compact row",
            "dimension/layout binding"
          ],
          [
            "Inverse",
            "slot to token/rank",
            "bijection on accepted routes"
          ],
          [
            "Combine",
            "token and ordered routes",
            "one writer; stated reduction order"
          ]
        ]
      }
    ]
  },
  "evidence-pipeline/chain": {
    "sectionId": "chain",
    "title": "No layer self-certifies",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "rustc collects the exact monomorphized kernel and emits canonical semantic records.",
          "Kernel IR records types, control flow, regions, effects, barriers, atomics, and target capabilities.",
          "Verus checks versioned source-model properties and emits identity-bound evidence inputs.",
          "A measured worker links canonical LLVM modules with direct LLVM/LLD APIs and emits HSACO.",
          "Independent inspection binds ELF target, symbols, descriptors, kernarg ABI, resources, and machine effects.",
          "Runtime admission joins the loaded artifact with actual context, allocations, aliases, geometry, and lifetimes.",
          "Protected policy verifies signed result sets and independent review before promotion."
        ]
      }
    ]
  },
  "evidence-pipeline/why-direct": {
    "sectionId": "why-direct",
    "title": "Why direct LLVM/LLD linking",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Direct APIs expose the exact module, target-machine, linker, diagnostics, and output bytes that fe2o3 needs to measure and bind. It avoids granting a second opaque linking authority through COMGR. The worker is still a trusted native component whose executable, LLVM build, inputs, limits, and output must be measured."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Inspection is not execution proof",
        "text": "Seeing an MFMA, barrier, or kernarg record in HSACO establishes a machine-code fact. It does not prove source refinement, functional correctness, race freedom, or that a later runtime loaded those exact bytes."
      }
    ]
  },
  "what-verus-proves/proved": {
    "sectionId": "proved",
    "title": "A theorem has a model and premises",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Question",
          "Primary mechanism"
        ],
        "rows": [
          [
            "Are modeled accesses in bounds?",
            "Verus and Kernel IR obligations"
          ],
          [
            "Do compiled effects match the model?",
            "translation validation and machine inspection"
          ],
          [
            "Are actual buffers disjoint and alive?",
            "runtime admission and Rust lifetimes"
          ],
          [
            "Does f32 match the abstract operation?",
            "versioned numerical refinement"
          ],
          [
            "Did this GPU execute these bytes correctly?",
            "pinned hardware evidence and oracle"
          ]
        ]
      }
    ]
  },
  "what-verus-proves/ecosystem": {
    "sectionId": "ecosystem",
    "title": "The differentiator is composition",
    "blocks": [
      {
        "type": "paragraph",
        "text": "CUDA and HIP can be checked by sanitizers, static analyzers, symbolic executors, model checkers, and external proof developments. fe2o3's design goal is a Rust-native single-source path where proof properties and artifact/runtime evidence carry explicit identities and fail closed when a join is missing."
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "No proof by branding",
        "text": "A Rust type, compiler attribute, manifest, signature, test, sanitizer result, or proof record is evidence at one boundary. None alone establishes the complete kernel claim."
      }
    ]
  },
  "exercise-ladder/beginner": {
    "sectionId": "beginner",
    "title": "Beginner to intermediate",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Add a typed scalar-map profile with guarded writes and a CPU oracle.",
          "Prove a widening integer affine map with no-overflow arithmetic.",
          "Add a paired mutation that moves an input read above the output guard.",
          "Implement one bounded wave reduction profile with inactive-lane semantics.",
          "Compose a workgroup reduction using owned LDS slots and two explicit epochs."
        ]
      }
    ]
  },
  "exercise-ladder/advanced": {
    "sectionId": "advanced",
    "title": "Advanced vertical slices",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Land a scalar reference GEMM before introducing LDS or MFMA.",
          "Add one fixed gfx942 BF16 tile profile with a phase invariant and canaries.",
          "Build row softmax with an explicit all-masked and numerical-error policy.",
          "Add one fixed-shape forward attention profile and bind machine effects.",
          "Implement deterministic top-2 routing, then compose one fixed expert GEMM profile."
        ]
      }
    ]
  },
  "contributing-kernel/checklist": {
    "sectionId": "checklist",
    "title": "Kernel contribution checklist",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Add one shared executable body and a CPU oracle with edge dimensions.",
          "Declare target, ABI, layout, launch, effect, synchronization, and numerical contracts.",
          "Add positive Verus properties and one targeted expected-negative fixture per property.",
          "Reject unsupported source shapes and remove stale outputs transactionally.",
          "Inspect LLVM/HSACO target, symbols, descriptors, kernarg layout, resources, and relevant instructions.",
          "Run gfx942 with independent expected results, boundary sizes, aliases, and canary memory.",
          "Record exact commit, tree, tools, command, target, artifact digests, logs, and limitations."
        ]
      }
    ]
  },
  "contributing-kernel/review": {
    "sectionId": "review",
    "title": "Promotion requires independent review",
    "blocks": [
      {
        "type": "paragraph",
        "text": "A green candidate-owned test suite is not promotion authority. fe2o3's signed-evidence design takes verifier, row policy, trust policy, and keys from a protected base and requires a separate reviewer signature over an exact evidence set for Complete."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Zero Missing is not parity",
        "text": "At this tutorial baseline the dashboard has no Complete rows. A Partial row may contain substantial implementation and tests while still lacking one acceptance class or authenticated join."
      }
    ]
  }
} satisfies Record<NarrativeId, NarrativeRegistryEntry>);

export function narrativeSection(narrativeId: NarrativeId): NarrativeLessonSection {
  return { kind: "narrative", narrativeId };
}

export function isNarrativeId(value: unknown): value is NarrativeId {
  return (
    typeof value === "string" &&
    hasOwn(narrativeRegistry, value)
  );
}

export function resolveNarrativeEntry(
  value: unknown,
): DeepReadonly<NarrativeRegistryEntry> | undefined {
  if (!isNarrativeId(value)) return undefined;
  const entry = narrativeRegistry[value];
  return narrativeFingerprint(entry) === narrativeFingerprints[value]
    ? entry
    : undefined;
}

export function narrativeEntry(
  id: NarrativeId,
): DeepReadonly<NarrativeRegistryEntry> {
  const entry = resolveNarrativeEntry(id);
  if (!entry) throw new Error("Canonical narrative registry failure");
  return entry;
}

export function narrativeRegistrySnapshot(): Record<
  string,
  NarrativeRegistryEntry
> {
  return structuredClone(narrativeRegistry) as unknown as Record<
    string,
    NarrativeRegistryEntry
  >;
}

export function resolveNarrativeOrder(
  lessonId: string,
): readonly NarrativeId[] | undefined {
  return hasOwn(narrativeOrderByLesson, lessonId)
    ? narrativeOrderByLesson[
        lessonId as keyof typeof narrativeOrderByLesson
      ]
    : undefined;
}

export function validateNarrativeRegistry(
  candidate: Record<string, unknown> = narrativeRegistry,
): string[] {
  const issues: string[] = [];
  const actualIds = Object.keys(candidate);
  if (
    actualIds.length !== narrativeIds.length ||
    actualIds.some((id, index) => id !== narrativeIds[index])
  ) {
    issues.push("registry does not contain the exact canonical narrative ID order");
  }

  for (const id of narrativeIds) {
    if (!hasOwn(candidate, id)) {
      issues.push(`${id}: missing canonical narrative entry`);
      continue;
    }
    if (narrativeFingerprint(candidate[id]) !== narrativeFingerprints[id]) {
      issues.push(`${id}: canonical narrative text drift`);
    }
  }
  return issues;
}

export { narrativeIds, narrativeOrderByLesson, stagedEvidenceLessonIds };
