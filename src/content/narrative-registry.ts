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
import { semanticMilestoneBoundary } from "./semantic-correctness-milestone";

export interface NarrativeRegistryEntry {
  sectionId: string;
  title: string;
  blocks: LessonBlock[];
}

function milestoneCallout(text: string): LessonBlock {
  return {
    type: "callout",
    tone: "boundary",
    title: "Semantic-correctness milestone",
    text: `${semanticMilestoneBoundary} ${text}`,
  };
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
        "text": "#[kernel] is the canonical fe2o3 user form: a procedural attribute marks an ordinary Rust function for the kernel frontend and generated typed API. macro_rules! is optional declarative compile-time token expansion; vecadd uses it to share a small body with a Verus model, but it adds no runtime behavior and proves nothing by itself. Production kernel algorithms should remain readable in the attributed function and its reachable MIR. LDS Slice 1 follows that shape without a macro_rules! body; its exact source now reaches canonical V5 Kernel IR, an exact compiler descriptor, an inert final HSACO receipt through direct LLVM/LLD APIs, exact generated host preparation, and a private one-shot Joined -> Loaded -> Completed -> Unloaded implementation with exact context, resource, ABI, completion, cancellation, and terminal-unload checks. In addition to fake-adapter substitution and terminal tests, one exact protected route passed on mi300x gfx942 over 256 outputs. That bounded run is not compiler-origin authentication, certificate consumption, compiler refinement, or generalized safety authority."
      }
    ]
  },
  "read-the-evidence/compiler-refactor": {
    "sectionId": "compiler-refactor",
    "title": "Read the Pliron ownership checkpoint as infrastructure",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The public checkpoint at commit 2f7c4fd1dfef7b9056caab0880700e3da7eeef03, tree 96d4275e7efde8ef594ef34b1c28f95d3000c8dc, hardens Pliron context ownership, the exact-byte KIR bridge, and detached lowering services while extending the pure-Rust KFD/runtime foundation through checked gfx942 device identity. Both public main refs resolved to this exact publication target at that checkpoint. It does not promote any kernel claim."
      },
      {
        "type": "table",
        "headers": [
          "Boundary",
          "What landed",
          "What remains outside the claim"
        ],
        "rows": [
          [
            "Canonical models and contracts",
            "Pliron-independent MIR and AMDGCN models plus bounded compiler, proof, service, and host contracts use stable identities and validation boundaries.",
            "The records do not authenticate inputs, prove lowering, or grant publication, runtime, or GPU authority."
          ],
          [
            "Pinned Pliron D0",
            "A private process-local identity anchor registers and verifies contexts against upstream Pliron v0.17.0 commit 2610651306ea3ba670f68d5d8b1e1159bcd521ed. The bounded PassPlan is non-executing.",
            "Generic pass execution is deliberately withheld until issue #140 provides owner-aware upstream handles. D0 has no pliron-llvm path and does not select the production compiler."
          ],
          [
            "Target-neutral dialect shells",
            "Kernel, tile, schedule, autotune, dispatch, GPU, and proof dialect shells register explicitly; the real MIR shell is opt-in behind the dialect-mir pliron feature.",
            "These shells are not a complete MIR pipeline, target backend, or executable kernel path."
          ],
          [
            "Context-bound KIR V1-V5 envelope",
            "The opaque bridge preserves canonical KIR bytes unchanged, binds the envelope to the originating Pliron context, and verifies ownership before any operation dereference.",
            "Same-slot foreign contexts, transplanted markers, stale handles, substitution, and erased state are rejected. The projection remains an inert index, not a second KIR serialization, semantic lowering, proof, target selection, or artifact authority."
          ],
          [
            "Detached MIR and GPU lowerers",
            "MIR-to-kernel and kernel-to-GPU are context-bound services rather than Pliron Pass implementations. Each result retains the originating context identity, and stale or erased source handles produce terminal typed errors.",
            "The narrow mappings remain non-executable infrastructure. There is no fallback and no result after failure; no general rustc MIR import, AMDGCN selection, or executable path is claimed."
          ],
          [
            "Compiler selector isolation",
            "Legacy, PlironShadow, and PlironV1 occupy separate driver slots; exactly one selected backend runs, failures do not fall back, and the shadow slot cannot return an executable candidate.",
            "No production selector switches to Pliron at this checkpoint."
          ],
          [
            "Host and persistent-service boundaries",
            "Authority-free contracts and typestates retain structural, causal, generation, and borrow relationships across compile/load/dispatch/wait and service lifecycle descriptions.",
            "They do not compile, authenticate, load, dispatch, wait, execute, attest quiescence, or release runtime authority."
          ],
          [
            "Checked gfx942 device identity",
            "Pure-Rust KFD 1.18 and reviewed DRM UAPI bindings, strict sysfs topology discovery, exact partition and firmware observations, and device-generation Verus models now admit the checked MI300X identity.",
            "The concrete observation is not sealed or authenticated runtime authority, does not detect GPU reset, and does not provide production queues, persistent execution, a HIP/HSA replacement, load, launch, GPU, or parity authority."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Issues and kernel labels remain open",
        "text": "This infrastructure does not complete issue #134, #135, or #140, change a run/verify/evidence gate, make any explanatory lesson kernel functional, establish performance, add GPU evidence, or promote cuda-oxide parity. Historical lesson evidence and source pins remain unchanged."
      },
      {
        "type": "paragraph",
        "text": "Device-code finalization remains directed through pinned upstream LLVM target-machine APIs plus in-process LLD. No COMGR path is introduced."
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
        "text": "The checked-in publication gate requires compiler commit 1f05db4d308f65af28953264bfe0d4aacf93fe35 and tree ff8f57223c23efd4cabede73c28a86b934d4daef on both public main refs. Historical proof, compiler, finalizer, runtime, and MI300X records remain pinned to their own immutable commits and do not transfer authority to this gate. The aggregate gate proves non-vacuous total-output refinement for its admitted finite subset and binds the exact MIR subjects, canonical natural loops, collectives, effects, and complete live PLIRON graph. It does not prove arbitrary source extraction or reference programs, unsupported loop forms, target IEEE values, LLVM-or-later refinement, artifact publication, launch behavior, hardware execution, or universal kernel correctness."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Accepted identity foundation, no execution authority",
        "text": "Independent review accepts the external-anchor protocol only as an inert AUTHORITY=none model. Commit bf3f471a97a0e64c74f5e9b13821e455c8fe2e53, tree 6636f342efa8d2caf40a9bed253330972090326f, additionally provides an accepted point-in-time process-leader pidfd identity foundation: 46 unit tests and six compile-fail doctests pass, with three privileged or helper fixtures ignored. Commit 091bf3c080a516396a24650f52c8e41fddf699f6, tree ae42880843e34564fbbe408ddb5f05eab029783c, freezes independently reconstructed cross-implementation vectors for both 184-byte challenges and all four 288-byte observations, plus a bounded domain-separated transaction digest over caller-canonical bytes. Commit d9ae1e95957d28a17afdcfa1a5173d40b89e65a6, tree a7a5fe7a94331a1354679eea1977b1fa3d0c1218, adds an accepted typed/cooperative lifecycle that binds a move-only link permit, reservation and fresh W0 request nonce, PID plus start time, V4 transcript, admitted host output, anchor transaction, and publication plan. Linux 6.12 thread-pidfd and Linux 6.13 PIDFD_GET_INFO runtime paths remain unexecuted on available Linux 6.6/6.8 hosts, procfs fallback and start-time capture require a compatible trusted mount for the active PID namespace, and callers still own canonical transaction encoding. These foundations provide no durable uniqueness, real anti-rollback, persistence, atomic disk publication, hostile-process enforcement, continuous liveness, loading, launch, runtime, GPU, or parity authority."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Wave 0 starting checkpoint",
        "text": "Public commit 86c4ca67a673bfec966f79e6c701104db872d8ea, tree 28f0ef6525290eb1be2ddcad72a785816502f547, integrates 34 descendants of the generic-sharding checkpoint. It canonicalizes provider identities and paths, completes Wave64 and workgroup MIR V3 inputs, repins the exact FlashAttention and MoE MIR closures, reconciles architecture and evidence boundaries, makes stale-artifact cleanup ownership-aware, rebuilds ROCm examples before artifact checks, gives the hosted row-softmax lineage test complete checkout history, and repins the authenticated-Verus fixture closure after the ordinary row-softmax source changed its owning verifier package. The final commits isolate temporary clean-CLI projects from a workflow-wide CARGO_TARGET_DIR while retaining an explicit environment-target test, then give an already-killed orphan a bounded host-reaping interval before requiring ESRCH; a still-live descendant remains a hard failure. It also starts issue #134 Wave 0 with a normative Rust-first Pliron architecture/proof-boundary decision, fixed-width Pliron-independent KernelItemId and KernelInstId V1 records, and frozen Kernel IR V1-V5 compatibility guards. The exact clean generic-core gate passed on MI300X, as did all 18 runnable tests in the affected control-flow target and a 100-run stress loop for the timeout case; the ancestor release candidate's gfx942 ROCm compile/artifact lanes also passed there. All 14 debug and 13 release reviewed-host tests passed serially with the new exact fixture, runtime-closure, and executable-page identities; 44 contract tests plus one doctest and six new plus 67 existing wire-focused tests passed for the Wave 0 additions. No Pliron dependency, production selector, executable Pliron lowering, or #135 persistent-service implementation is claimed. These changes establish no parity promotion, source-to-machine refinement, generalized memory safety or race freedom, protected runtime authority, or new GPU result."
      }
    ]
  },
  "read-the-evidence/moe-bounded-evidence": {
    "sectionId": "moe-bounded-evidence",
    "title": "Read bounded MoE evidence by layer",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The bounded MoE V2 work below is integrated at the publication-gated fe2o3 checkpoint. Integration changes availability, not authority: each row states only the layer that was exercised, every relevant delivery row remains Partial, and none is a functional router or expert GPU result."
      },
      {
        "type": "table",
        "headers": [
          "Evidence",
          "What was checked",
          "Open boundary"
        ],
        "rows": [
          [
            "Compact-plan model",
            "For exactly E4/C4/routes16/width16/tile256, Verus discharged 19 obligations, seven expected-failure mutations were rejected, and the Rust checker exhaustively accepted all 625 count vectors.",
            "This is fixed-profile Verus and CPU evidence. It provides no authenticated proof receipt, compiler/finalizer binding, artifact, dispatch, expert GPU result, or performance claim."
          ],
          [
            "Host routing bridge",
            "The bridge checks internal consistency of caller-supplied top2 experts, requested and admitted counts, offsets, route slots, permutation, and inverse. It uploads offsets and inverse together, retains both device regions, and passed gfx942 upload/readback.",
            "It authenticates neither router execution nor readback provenance, top2 selection from logits, route weights, packed activations, compiler/finalizer output, dispatch, or expert execution. Rechecking caller-supplied input can reconstruct equivalent evidence, so it carries no freshness or replay authority."
          ],
          [
            "Expert GPU result",
            "No expert GEMM or combine kernel was dispatched by this evidence slice.",
            "Functional GPU output, GPU/oracle comparison, numerical refinement, and performance remain open."
          ]
        ]
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
  "cpu-semantic-simulation/pipeline": {
    "sectionId": "pipeline",
    "title": "Execute the compiler's semantic representation",
    "blocks": [
      {
        "type": "paragraph",
        "text": "cargo fe2o3 simulate starts from the ordinary attributed Rust crate. The compiler collects the selected typed kernel, lowers its semantic MIR through the general frontend, verifies canonical Kernel IR V7, admits its formal-memory model, and hands the exact canonical bytes to the bounded CPU executor. The kernel body is not compiled as an ordinary host Rust function, and no algorithm-specific CPU implementation stands beside it."
      },
      {
        "type": "table",
        "headers": [
          "Boundary",
          "What crosses it",
          "Failure behavior"
        ],
        "rows": [
          [
            "Source to semantic MIR",
            "One selected ordinary safe Rust #[kernel(typed)] body, its authenticated required/max WG64 launch contract, and authenticated device operations.",
            "Ambiguous kernels, unsupported source forms, and invalid typed operations fail closed."
          ],
          [
            "Semantic MIR to KIR V7",
            "Typed control flow, integer values, launch queries, calls, and memory operations in the canonical versioned representation.",
            "Verification precedes execution; malformed or unsupported KIR is never simulated."
          ],
          [
            "Formal memory to CPU execution",
            "Virtual allocations retain element type, extent, alignment, access, initialization, and provenance.",
            "The executor reports typed faults without dereferencing device addresses as host pointers."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Scope the no-hardware claim",
        "text": "The fe2o3 simulation path links and initializes no GPU runtime and performs no GPU enumeration. Ordinary project Cargo build scripts remain trusted, unsandboxed host code and can independently access hardware. hardware_observed: false describes fe2o3's simulator result; it does not attest arbitrary build-script behavior."
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "Same target, fresh simulation state",
        "text": "Every source-simulation attempt uses a fresh ephemeral generation and removes that generation after success or failure. A retry may reuse the same Cargo target directory without reusing an earlier simulation handoff or result."
      }
    ]
  },
  "cpu-semantic-simulation/evidence-boundary": {
    "sectionId": "evidence-boundary",
    "title": "Read the result as a simulated observation",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The V1 result binds the positive bounded length of the exact canonical KIR and reports its profile-specific SHA-256 as 64 lowercase hexadecimal digits, together with scalar target-profile identity, cooperative scheduler identity, launch hierarchy counts, and the typed output snapshot. The displayed command does not bind every compiler-profile input, so this tutorial does not pin one digest or byte length. The request uses one authenticated WG64 with four live logical invocations and 60 inactive scheduled slots. All four u32 elements become 17, encoded as four little-endian 0x11000000 values."
      },
      {
        "type": "table",
        "headers": [
          "Result field",
          "Meaning"
        ],
        "rows": [
          [
            "simulated: true",
            "The canonical KIR executed in the bounded CPU semantic model."
          ],
          [
            "hardware_observed: false",
            "No physical GPU execution was observed."
          ],
          [
            "hardware_validation: false",
            "The result does not validate LLVM, ISA, HSACO, or GPU equivalence."
          ],
          [
            "performance_prediction: false",
            "CPU duration and deterministic schedule are not GPU timing, occupancy, or overlap estimates."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Current supported slice",
        "text": "The published milestone covers bounded scalar control flow and calls, integers, launch queries, typed global memory, static scalar workgroup memory, and convergent workgroup barriers. Unsupported operations return structured errors. Wave collectives, generic barriers, atomics and fences, dynamic or non-scalar workgroup memory, matrix operations, floating-point target contracts, seeded schedule exploration, replay, and a virtual host runtime are not claimed by this lesson."
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
  "compiler-checks/catalog": {
    "sectionId": "compiler-checks-catalog",
    "title": "Compile-time kernel diagnostics",
    "blocks": [
      {
        "type": "paragraph",
        "text": "fe2o3 separates ordinary Rust UI errors from target-neutral kernel verification. Rust rejects local type, borrowing, ownership, privacy, and typestate misuse inside one invocation. The compiler then analyzes structured operations, SSA, control flow, indexed memory effects, cross-invocation ownership, atomics, barriers, workgroup-memory epochs, and explicitly declared semantic-equivalence obligations. These checks consume workload-neutral Kernel IR or ranked PLIRON: none recognizes GEMM names, tile sizes, or schedules."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Ordinary kernels are safe Rust",
        "text": "An ordinary #[kernel] function has a safe signature and body. Unsafe functions, unsafe blocks, and inline assembly are rejected at the source boundary, including reachable device helpers. The explicitly separate unsafe_asm profile is the low-level provider and test escape hatch; selecting it does not weaken, discharge, or bypass any verifier obligation for an ordinary kernel. Trusted device APIs may contain narrowly reviewed unsafe implementation code behind safe surfaces. The compiler recognizes a capability terminal only after matching its exact diagnostic item and canonical DefPath, authenticating its reviewed provider identity, verifying rustc's compiled SourceFileHash against the reviewed source root, and matching the pinned source digest. A crate name or same-named replacement is not sufficient."
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "One Rust type system, extended to GPU facts",
        "text": "Fe2O3 does not implement a second borrow checker. rustc remains authoritative for moves, borrows, lifetimes, visibility, and local typestate. Fe2O3's sealed non-Clone values carry those affine rules into GPU concepts such as invocation ownership, subgroup participation, LDS initialization epochs, matrix contexts, and launch-scoped resources. Ranked PLIRON and Kernel IR passes then verify cross-invocation facts that ordinary Rust cannot observe, including disjoint writes and convergent barriers."
      },
      {
        "type": "table",
        "headers": [
          "Rust form",
          "GPU meaning",
          "Enforced by"
        ],
        "rows": [
          ["&T and &mut T", "Shared reads and unique mutation remain lifetime-bound through typed host preparation and safe device views.", "rustc plus typed host/device APIs"],
          ["non-Copy, non-Clone capability", "An invocation, tile, LDS epoch, or synchronization permission cannot be duplicated or forged in safe source.", "rustc plus authenticated constructors"],
          ["Option and checked_*", "Dynamic shape and arithmetic checks produce ordinary enum control flow instead of magic verifier syntax.", "rustc MIR plus generic enum and bounds analysis"],
          ["KernelResult and ?", "A failed checked operation returns from the current invocation through ordinary Rust control flow.", "rustc, the #[kernel] wrapper, and convergence verification"],
          ["unsafe", "Ordinary kernels cannot delegate proof obligations to unchecked source; low-level providers use a separate reviewed profile.", "source-boundary admission"]
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "MFMA identity lives in the types",
        "text": "A typed BF16 MFMA fragment carries a wave lifetime, operand role A or B, instruction profile, register distribution, and lane width. Swapping A and B, mixing instruction profiles, changing the register distribution, retaining a fragment beyond its wave, copying a move-only fragment, or constructing its private representation is a rustc error. These types prevent local misuse; the tensor-layout pass separately proves that the compiler IR describes the required lane-to-matrix map and that all participating lanes execute the collective."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Typed fragments survive loops",
        "text": "When a fragment or accumulator crosses a branch or loop backedge, semantic lowering gives the destination block typed SSA components plus a compiler-owned binding descriptor. Each incoming edge must supply the same fragment kind, instruction contract, and current-wave association; an ordinary four-float aggregate cannot stand in for that typed value. The descriptor restores wave provenance without transporting a forgeable phi token, and none of this requires recognizing a GEMM loop."
      },
      {
        "type": "table",
        "headers": [
          "MFMA fact",
          "Where it belongs",
          "Why it is separate"
        ],
        "rows": [
          ["A, B, or accumulator role", "Rust fragment type and authenticated terminal", "Operand order is rejected before an instruction contract is formed."],
          ["Instruction profile and register distribution", "Rust type plus tensor-layout contract", "A valid value representation must also match the target instruction lane/component map."],
          ["direct global, row-major LDS, or XOR4 LDS", "Independent storage provenance for each operand", "Storage swizzling describes addresses before a load. It is not an MFMA register distribution, and A and B need not use the same storage transform."],
          ["edge or K-tail behavior", "Exact-tile or authenticated zero-fill policy in the tensor-layout contract", "A fragment can have the correct register type while still reading an invalid physical edge or supplying undefined inactive components."],
          ["active wave participation", "Uniformity and CFG dataflow at the actual collective site", "A textual uniform attribute is only a claim. The verifier derives control dependence and rejects lane-varying participation or order."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "What KernelResult means",
        "text": "KernelResult<T> is the ordinary Result<T, KernelError> shape used inside the kernel. The attribute macro emits a private helper with that return type and a physical unit-return GPU entry wrapper that calls it. The compiler keeps both functions, follows Ok and Err payloads through generic enum dominance, and verifies every reachable path. Err is not a host-visible error payload: it ends only the current invocation. A lane-varying ? before a required workgroup barrier is still rejected by barrier convergence analysis."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Checked arithmetic stays explicit",
        "text": "Rust checked add, subtract, and multiply remain two-result operations, value plus overflow, through semantic MIR and canonical Kernel IR V7. Compiler-generated unchecked add, subtract, or multiply is admitted only when the exact matching checked operation uses the same operands and its zero-overflow edge dominates the unchecked operation. This is workload-neutral control-flow proof, not an algorithm recognizer. V7 carries the tensor contract; frozen V5 and V6 decoders cannot reconstruct missing tensor authority."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Where Verus fits",
        "text": "Verus is a separate proof layer for named MIR/effect or mathematical-model properties such as functional equality, ownership mappings, recurrence correspondence, and numerical preconditions. It does not replace rustc's borrow checker or the mandatory compiler verifiers. The V2 functional-refinement path authenticates one exact retained Verus/Z3 execution and consumes its signed MIR-bound result; it still does not establish a general Rust-source-to-Kernel-IR-to-machine refinement theorem or independently grant artifact or launch authority."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Bind the reference as ordinary Rust",
        "text": "The user writes #[kernel(typed, reference = cpu_reference, ...)]. The path must resolve to exactly one local safe Rust function in the same compiler session; no source-written hash or proof identity is trusted. The collector resolves the concrete monomorphized kernel and reference Instances, records their canonical identities and exact rustc MIR body SHA-256 values, and translates the admitted reference MIR into bounded ReferenceEffectIrV1. Leading usize parameters name logical point axes; a following &mut scalar names one observable output at that point. This is workload-neutral MIR handling: no pass recognizes a GEMM, softmax, attention, routing, expert, or other algorithm name."
      },
      {
        "type": "table",
        "headers": [
          "Reference-effect V1 rule",
          "Accepted now",
          "Fail-closed result"
        ],
        "rows": [
          ["Safety and ABI", "One local safe, non-variadic Rust-ABI function with unit return, up to three leading usize logical point axes, admitted scalar/shared-slice inputs, and bounded direct point-output effects.", "Unsafe references or bodies, nonlocal functions, wrong return type, indirect output, or logical ABI mismatch stop before proof import."],
          ["Control flow", "Bounded typed branches, canonical finite natural loops, and independently lowered direct local safe scalar helpers.", "Unbounded, overlapping/nested, or noncanonical loops, unresolved assertions, indirect/unsafe calls, and unsupported CFG fail closed with a precise reference-effect diagnostic."],
          ["Effect normalization", "Closed typed scalar expressions, guards, point coordinates, and output effects are derived from MIR and reconciled with live GPU effects.", "Vec/slice value reads still require an independently bound GPU-load symbol; opaque memory, unsupported expressions, atomics, or unmatched effects fail before proof execution."],
          ["Dynamic ownership", "ExactEffectDomain can admit a structurally bounds-guarded dynamic point write after clean bounds and race reports; TotalView is required for complete output coverage.", "A point effect alone does not claim the whole runtime view is written; unresolved bounds, collisions, missing output identities, or duplicate sites remain non-clean and emit no artifact."],
          ["Observable outputs", "Independent reference and GPU effect sets must form an exact output, point-coordinate, guard, and RHS bijection before the proof request is constructed.", "Missing, extra, ambiguous, duplicate, mismatched, or unmodeled writes stop before Verus or lowering."]
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Compare the admitted GPU effect to safe Rust",
        "text": "The private join converts each correlated admitted store into a compiler-owned value-carrying ranked recipe operation and creates RequestEffectRefinement with the exact GPU and reference sites, view, indices, logical coordinates, domains, preconditions, and typed values. ExactEffectDomain proves only the modeled point effect; TotalView and output-specific hierarchy evidence are separate requirements for total coverage. The same compiler session derives and reconciles the semantic and strict parallel contracts, runs a generated Verus conditional-lemma checker, then binds its result and retained receipts in the production report outside the lemma before KIR lowering."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Authenticate the proof execution and every input",
        "text": "A fixed-width domain-separated Ed25519 V2 receipt binds the safe-reference identity and MIR, kernel subject and MIR, full live PLIRON obligation, generated composition source, output and schedule relations, hierarchy and numerical policies, Verus/Z3 identities, retained runtime closure, exact execution identity and Proved result, SafeReferenceMirToLivePliron boundary, and compiler-policy signer. The retained controller bounds the exact rust_verify, internal verifier, and Z3 descendant topology, executable mappings, inherited files, resources, output, timeout, and cleanup. Import rejects stale, mismatched, duplicate, non-Proved, wrong-boundary, or missing evidence; generated identity comments are binding inputs, not Verus premises."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "The authenticated boundary is deliberately narrow",
        "text": "The generated Verus program checks generic conditional lemmas over the admitted relation shape. Exact contracts and retained effect receipts are cryptographically bound by the production report outside those lemmas; the receipts are not logical premises in one whole-kernel Verus theorem. This does not bind arbitrary Vec/slice loads, prove dynamic reference-loop ranges, derive claim-specific tensor summaries, identify multiple output views, prove error bounds or reassociation, establish compiler extraction/projection and pass soundness, or grant LLVM+, artifact, launch, runtime, or hardware authority. Advanced GEMM, softmax, FlashAttention, routing, and grouped-expert references remain Incomplete."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Kernel tabs are current safe source",
        "text": "Every attributed Rust Kernel tab is byte-pinned to the current dual-repository compiler main and contains no unsafe block. Compiler-issued capabilities provide lane, ownership, LDS, barrier, atomic, matrix, and math access through safe surfaces. Historical proof, HSACO, host, and GPU observations retain their original commits and do not transfer authority to a repinned source merely because the algorithm is related."
      },
      {
        "type": "table",
        "headers": [
          "Guarantee layer",
          "What may be claimed",
          "What remains outside that claim"
        ],
        "rows": [
          ["Rust types, borrowing, and wave lifetimes", "Well-typed local use of references, affine capabilities, MFMA roles, profiles, and phase transitions.", "Cross-invocation races, collective convergence, numerical intent, and generated machine behavior."],
          ["Mandatory generic PLIRON verification", "Clean results for declared tensor layout, bounds, atomics, races, hierarchy ownership, barriers, LDS epochs, semantic expressions, and reference effects in the supported bounded model.", "An unmodeled effect, unresolved dynamic fact, or exhausted budget is Incomplete and emits no artifact."],
          ["Verus named proofs", "The explicitly stated functional, ownership, recurrence, or numerical theorem holds for its versioned model and assumptions.", "Verus does not silently prove compiler refinement, target lowering, runtime inputs, or properties omitted from the theorem."],
          ["Source-to-machine refinement", "When separately established, each authenticated compiler stage preserves the named source and IR properties into the selected target artifact.", "A passing verifier or GPU sample alone is not this refinement theorem."],
          ["Runtime launch admission", "Dynamic dimensions, strides, allocations, alias promises, target profile, resources, and launch geometry satisfy recorded artifact preconditions.", "Host checks cannot repair an invalid or unproved device access."],
          ["Observed hardware tests", "The pinned artifact produced the expected outputs for the recorded cases on the recorded device.", "Testing is not universal correctness and does not quantify over all inputs or executions."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Correct relative to explicit contracts, never universally correct",
        "text": "Fe2O3 can guarantee only the named properties whose assumptions, target profile, dynamic preconditions, verifier model, proof artifacts, compiler refinement, and launch authority are all bound together. It cannot infer full programmer intent or promise universal numerical, liveness, performance, or hardware correctness. A missing layer is reported as a boundary, Rejected, or Incomplete rather than converted into a broader claim."
      },
      {
        "type": "table",
        "headers": [
          "Layer",
          "What it establishes",
          "Representative form"
        ],
        "rows": [
          ["Rust within one invocation", "Borrows, moves, lifetimes, visibility, and local typestate transitions.", "&mut T, non-Copy guards, safe methods"],
          ["Compiler-issued index ownership", "A non-forgeable invocation identity and, for the supported mapping subset below, its shifted, grid-exclusive, or blocked write partition.", "DisjointIndex, Shifted, GridExclusive, Blocked, DisjointBlock"],
          ["Compiler-issued execution capabilities", "The current authenticated wave, collective participant set, LDS allocation and epoch, or matrix-instruction context.", "current wave/collective/LDS/matrix capabilities"],
          ["Typed global atomic view", "The safe API retains the pointee type and lifetime without exposing a safe non-atomic dereference. Its four compiler terminals are authenticated, but ordinary Rust core atomic operations are not imported yet.", "DeviceGlobalMutPtr<T>::as_atomic()"],
          ["Generic verifier passes", "Bounds, ownership, synchronization, atomic, and semantic facts that no local Rust borrow can establish across GPU invocations.", "ranked PLIRON plus launch and target facts"]
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Supported safe ownership mappings",
        "text": "The production importer preserves each authenticated mapping identity and its const parameters into semantic MIR and ranked PLIRON. Supported safe accessors then enter the same generic bounds and race pipeline as every other ranked memory access. The compiler never silently substitutes a different mapping or treats an unsupported mapping as Clean."
      },
      {
        "type": "table",
        "headers": [
          "Safe ownership form",
          "Current production state",
          "Fail-closed behavior"
        ],
        "rows": [
          ["thread::index_1d() with DisjointSlice::get_mut", "Supported", "The authenticated base invocation index reaches general bounds and race verification."],
          ["Shifted<Index1D, N>", "Supported for one shift layer", "The exact N is retained. Nested Shifted<Shifted<...>> is rejected during authenticated mapping/type validation because normalization is not implemented."],
          ["GridExclusive with a constant leader index", "Supported", "A dynamic or unresolved leader index is Incomplete in ranked projection and emits no artifact."],
          ["Blocked<Index1D, 1, E> with DisjointBlock", "Supported for nonzero E and a constant component", "The compiler retains E, checks arithmetic and slice extent guards, and lowers raw_index * E + component into the generic bounds and race pipeline."],
          ["Blocked<Index1D, L, E> where L > 1", "Incomplete", "The semantic mapping is retained, but ranked projection stops until bounded quotient/remainder facts are available."],
          ["Malformed or substituted ownership mapping", "Rejected", "Wrong marker identity, mismatched block/slice parameters, zero dimensions, or overflowing L * E cannot cross the safe-kernel compiler boundary."]
        ]
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "Generic does not mean automatically provable",
        "text": "Tensor-layout, bounds, atomic, race, hierarchy-ownership, barrier, workgroup-memory, semantic, and reference-effect checks apply to any kernel represented with the supported target-neutral operations, address spaces, index expressions, execution layouts, target facts, and CFG. They do not depend on GEMM, attention, softmax, MoE, tile-size, or schedule recognition. A kernel or safe ownership mapping outside that analyzable subset is not treated as safe: the compiler reports Rejected for a concrete invalid contract or Incomplete for an unresolved proof obligation, and the strict pre-lowering route fails closed. Semantic and effect refinement are also workload-neutral, but they check only explicit compiler-derived contracts; without a bound safe reference, the compiler does not invent programmer intent."
      },
      {
        "type": "paragraph",
        "text": "PLIRON dialect and structural verification is the prerequisite. The mandatory ranked-PLIRON order is tensor layout, ranked bounds, atomic legality, race freedom, hierarchy ownership, barrier convergence, workgroup memory, then semantic refinement with effect refinement inside that final stage. No lowering pass may run between these eight checks. Every analysis has explicit operation, fact, trace, finding, or work-unit limits; exhausting one returns Incomplete and emits no artifact."
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "One bounded analysis context per run",
        "text": "The production pipeline owns one ephemeral analysis manager over one immutable ranked-PLIRON function. Its three bounded cache roots hold sparse index results, execution layout, and exact invocation traces, so passes that need the same facts compute each root once. The manager is discarded before any second validation or changed function is checked, which prevents stale facts from crossing a revalidation boundary while keeping each pass result independently reportable."
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "Sparse facts meet at typed CFG edges",
        "text": "Sparse index dataflow treats block arguments as real SSA definitions. Only reachable predecessor edges contribute; a not-yet-seen input is Pending, an unsupported or conflicting input is Unknown, identical incoming facts remain precise, and Unknown is absorbing. Unconditional, less-than, and equality branches type-check their carried operands before the incoming facts meet. Value, use, edge, iteration, and work-unit budgets make cyclic or oversized analysis return Incomplete instead of guessing."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "A proof stays with one access",
        "text": "For each retained UnsupportedIndexExpression obligation, semantic, ranked-PLIRON, KIR, and formal-memory owners jointly bind one access. The source record identifies the semantic block, statement or terminator, access ordinal, ranked block, and ranked operation; the compiler then rederives and compares the allocation origin, access kind, memory space, selected index, GEP, and unique consuming KIR access. Moving a GEP, changing its index, reusing one proof for two loads, swapping an allocation, or changing Read to Write fails closed. This is bounded compiler-internal custody for one access, not a general dynamic-bounds proof, hostile-caller authentication, or artifact and launch authority."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Workgroup identity is an exact quotient",
        "text": "For a bound launch contract, global_index(axis) divided by the exact nonzero workgroup extent on the same axis is the workgroup index and is uniform within that workgroup. The theorem requires every kernel record for the entry to agree on the workgroup dimensions and accepts only direct constants or proved value-preserving constant casts. A wrong divisor, cross-axis divisor, narrowing or sign-changing cast, remainder, missing contract, or inconsistent duplicate entry remains varying or unsupported. This rule names launch arithmetic, not a workload."
      },
      {
        "type": "table",
        "headers": [
          "Outcome",
          "Meaning",
          "Production consequence"
        ],
        "rows": [
          ["Clean", "Every obligation handled by that pass was discharged.", "The next mandatory pass may run."],
          ["Rejected", "The compiler found a concrete invalid IR condition or a conflicting execution witness.", "Compilation stops before lowering or artifact emission."],
          ["Incomplete", "Safety could not be proved because a fact is dynamic, an effect or index is unresolved, or a bounded analysis limit was reached.", "The strict production route also stops; Incomplete does not claim that a concrete bug was proved."]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Separate general Kernel IR check ID",
          "Kernel-general responsibility",
          "Representative failure"
        ],
        "rows": [
          ["kernel-structural-v1", "Verify module, function, kernel, SSA, type, operation, memory, synchronization, launch, and capability invariants in the general Kernel IR pipeline.", "Invalid or duplicate identities; bad entry/signature; undefined or non-dominating values; type/result errors; illegal cast kind, category, signedness, or width; invalid memory, barrier, atomic, fence, convergence, workgroup, wave, float, inline-assembly, or terminator operations; resource limits."],
          ["kernel-control-flow-v1", "Build and validate the closed kernel CFG before dataflow facts are trusted.", "Declaration or empty body; duplicate block; missing terminator; unknown successor; irreducible control flow; bounded-analysis resource exhaustion."]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Analysis ID",
          "Kernel-general responsibility",
          "Representative non-clean findings"
        ],
        "rows": [
          ["kernel-tensor-layout-v1", "Validate each tensor instruction profile, A/B/accumulator role, element packing, register distribution, lane/component map, independent operand storage transform, edge policy, and derived collective participation.", "Wrong transpose or lane map; accumulator permutation; unsupported storage transform; missing tail policy; inactive or invocation-divergent collective; unresolved map or convergence; analysis limit."],
          ["kernel-memory-bounds-v1", "Prove every indexed read, write, and atomic access lies within every ranked extent.", "Static out-of-bounds witness; unresolved dynamic bound; unsupported index, CFG, or operation; analysis limit."],
          ["kernel-atomic-legality-v1", "Require a legal atomic kind, explicit ordering and scope, ranked-view provenance, supported element width/address space, bound target capability, and system-coherent allocation evidence.", "Missing or invalid ordering/scope; private-memory atomic; unavailable provenance or target capability; unauthenticated system coherence; analysis limit."],
          ["kernel-race-freedom-v1", "Prove incompatible effects from concurrent invocations address disjoint coordinates, accounting for compatible atomics.", "Read/write or write/write conflict witness; unresolved dynamic launch, index, or alias relation; analysis limit."],
          ["kernel-hierarchy-ownership-v1", "Reconstruct each logical coordinate owner across invocation, lane, subgroup, workgroup, and grid, then require the declared coverage and density policy.", "Out-of-range owner; duplicate owner; grid coverage hole; non-rectangular subgroup or workgroup tile; runtime-only unresolved ownership; analysis limit."],
          ["kernel-barrier-convergence-v1", "Prove every participating invocation reaches the same collective barriers in the same order.", "Divergent barrier trace; dynamic launch or branch trace that cannot be resolved; unsupported CFG or trace limit."],
          ["kernel-workgroup-memory-v1", "Run must-initialization dataflow and track publication, compatible atomics, conflicts, and reuse by convergent barrier epoch.", "Read before initialization/publication; conflicting same-epoch effects; stale or unresolved epoch/trace; analysis limit."],
          ["kernel-semantic-refinement-v1", "Compare declared target-neutral expressions, then join each bound safe-reference effect to one real GPU write, exact hierarchy ownership, and MIR-bound authenticated proof evidence rather than guessing intent.", "Formula, domain, precondition, or value mismatch; missing, stale, duplicate, or invalid proof evidence; orphan, ambiguous, duplicate, or unmodeled write; unresolved ownership/expression/trace; analysis limit."],
          ["pliron-sparse-index-v1 (shared analysis)", "Propagate bounded sparse affine and remainder facts through values, reachable CFG edges, and block arguments so bounds and ownership passes compare invocation-indexed coordinates without duplicating expression recognition.", "Conflicting incoming facts; unknown or unsupported expression; inconsistent launch extent; overflow; SSA value, use, edge, iteration, or work-unit limit."],
          ["bounded resources (cross-cutting)", "Bound verifier memory and time through explicit operation, value, invocation, trace, effect, finding, and work-unit ceilings.", "Any exhausted budget is Incomplete, never Clean and never permission to continue lowering."]
        ]
      },
      {
        "type": "compile-failures",
        "heading": "Twenty-three representative compile-time failures",
        "intro": "The first card is a local Rust type error. The remaining cards sample the fixed workload-neutral PLIRON verifier sequence and the compiler-owned semantic/parallel composition gate: tensor layout first, then bounds, atomics, races, barriers, workgroup-memory epochs, declared semantic refinement, strict parallel derivation, and per-compilation Verus composition. Text snippets are compact schematic semantic IR or compiler-derived report state; they do not imply that users write a separate kernel DSL, and the named compiler tests contain the exact inputs. Every displayed FE2O3 code, status, and owner follows the current stable diagnostics. These cards are representative rather than an exhaustive list of every source-admission, structural, lowering, or target failure. Rejected and Incomplete both stop before KIR or target lowering and artifact emission.",
        "examples": [
          {
            "id": "mfma_operand_roles",
            "title": "Swapped MFMA operand roles",
            "language": "rust",
            "source": "fn reject_swapped_roles<'wave>(\n    matrix: &DeviceMatrix,\n    lhs: Bf16MfmaBFragment<'wave>,\n    rhs: Bf16MfmaAFragment<'wave>,\n    accumulator: F32AccumulatorFragment<'wave>,\n) {\n    let _ = matrix.multiply_accumulate(lhs, rhs, accumulator);\n}",
            "diagnostic": "error[E0308]: arguments to this method are incorrect\nexpected Bf16MfmaFragment<'_, MfmaOperandA, Bf16F32M16N16K16, MfmaRegisterTile16x16, Wave64>\n   found Bf16MfmaFragment<'_, MfmaOperandB, Bf16F32M16N16K16, MfmaRegisterTile16x16, Wave64>\nexpected Bf16MfmaFragment<'_, MfmaOperandB, Bf16F32M16N16K16, MfmaRegisterTile16x16, Wave64>\n   found Bf16MfmaFragment<'_, MfmaOperandA, Bf16F32M16N16K16, MfmaRegisterTile16x16, Wave64>\nhelp: swap these arguments\n  matrix.multiply_accumulate(rhs, lhs, accumulator)",
            "property": "TypedMfmaRoles",
            "stage": "rustc type checking",
            "code": "E0308",
            "enforcement": "Safe Rust device API compile-fail test",
            "caught": "A and B are different sealed fragment roles, even though both carry four BF16 register values. The method signature requires A then B for one instruction profile and wave lifetime, so invalid operand order never reaches PLIRON. The same type boundary rejects a wrong profile or unsupported register distribution."
          },
          {
            "id": "tensor_wrong_b_map",
            "title": "B fragment uses the wrong transpose",
            "language": "text",
            "source": "kernel.tensor_layout profile = m16n16k16_bf16\n  a.map = (lane % 16, 4 * (lane / 16) + component)\n  b.map = (lane % 16, 4 * (lane / 16) + component)  // should be (k, column)",
            "diagnostic": "error[FE2O3-TENSOR-LAYOUT-001]: tensor layout rejected at block 0 op 2: tensor B lane/component mapping does not match the target operand profile",
            "property": "TensorOperandMap",
            "stage": "generic PLIRON pass 1/8",
            "code": "FE2O3-TENSOR-LAYOUT-001",
            "enforcement": "Tensor-layout PLIRON lit; mandatory production pass",
            "caught": "The verifier compares the bounded lane/component affine map for role B with the selected instruction profile. This detects a structurally valid fragment whose registers name the wrong matrix coordinates, without recognizing GEMM or any other workload."
          },
          {
            "id": "tensor_accumulator_permutation",
            "title": "Accumulator components are permuted",
            "language": "text",
            "source": "kernel.tensor_layout profile = m16n16k16_bf16\n  accumulator.map = (4 * (lane / 16) + (3 - component), lane % 16)",
            "diagnostic": "error[FE2O3-TENSOR-LAYOUT-001]: tensor layout rejected at block 0 op 2: tensor Accumulator lane/component mapping does not match the target operand profile",
            "property": "TensorAccumulatorMap",
            "stage": "generic PLIRON pass 1/8",
            "code": "FE2O3-TENSOR-LAYOUT-001",
            "enforcement": "Tensor-layout PLIRON lit; mandatory production pass",
            "caught": "Every coordinate can remain in bounds while component order is wrong. Exhaustive bounded coverage and multiplicity checks compare accumulator coordinates across every active lane and component, so an in-bounds permutation is still a compile-time error."
          },
          {
            "id": "tensor_storage_transform",
            "title": "Unsupported operand storage transform",
            "language": "text",
            "source": "kernel.tensor_layout profile = m16n16k16_bf16\n  a.register_distribution = canonical\n  a.storage = lds_xor8\n  b.register_distribution = canonical\n  b.storage = direct",
            "diagnostic": "error[FE2O3-TENSOR-LAYOUT-001]: tensor layout rejected at block 0 op 2: tensor A LDS swizzle is incompatible with its layout",
            "property": "TensorStorageLayout",
            "stage": "generic PLIRON pass 1/8",
            "code": "FE2O3-TENSOR-LAYOUT-001",
            "enforcement": "Tensor-layout Kernel IR unit; shared mandatory production verifier",
            "caught": "Register distribution and storage provenance are checked independently. A direct B fragment may legally meet an XOR4-staged A fragment after both loads produce the canonical register map; an unsupported transform on either operand is rejected on its own evidence."
          },
          {
            "id": "tensor_missing_tail_policy",
            "title": "Partial tile has no edge policy",
            "language": "text",
            "source": "kernel.tensor_layout profile = m16n16k16_bf16\n  logical_extent = [%m, %n, %k]\n  physical_tile = [16, 16, 16]\n  tail_policy = missing",
            "diagnostic": "error[FE2O3-TENSOR-LAYOUT-001]: tensor layout rejected at block 0 op 2: tensor instruction tail-mask contract is incompatible with the exact-tile profile",
            "property": "TensorTailSafety",
            "stage": "generic PLIRON pass 1/8",
            "code": "FE2O3-TENSOR-LAYOUT-001",
            "enforcement": "Tensor-layout PLIRON lit; mandatory production pass",
            "caught": "Dynamic shapes do not turn an unguarded edge into a runtime permission. The current profile admits an exact physical tile or authenticated zero-filled predicate inputs. Missing, raw predicate-mask, and unsupported tail claims are Rejected and compilation stops."
          },
          {
            "id": "tensor_divergent_collective",
            "title": "MFMA appears under lane-varying control",
            "language": "rust",
            "source": "let lane = WaveLane::<Wave64>::current();\nif lane.get() < 32 {\n    acc = matrix.multiply_accumulate(lhs, rhs, acc);\n}",
            "diagnostic": "error[FE2O3-TENSOR-LAYOUT-001]: divergent tensor-instruction trace; invocation [0, 0, 0] executes [(1, 0)], while invocation [32, 0, 0] executes []; every subgroup participant must execute the same tensor instructions in the same order",
            "property": "TensorConvergence",
            "stage": "generic PLIRON pass 1/8",
            "code": "FE2O3-TENSOR-LAYOUT-001",
            "enforcement": "Schematic Rust source; tensor-layout PLIRON lit",
            "caught": "This Rust-shaped snippet illustrates the source condition; the exact regression starts from projected PLIRON. The verifier derives control uniformity at the actual instruction block rather than trusting a uniform annotation. A lane-dependent branch lets half the wave execute a collective that requires the full recorded participant set, so the IR is rejected."
          },
          {
            "id": "race_alias_views",
            "title": "Different views still alias one allocation",
            "language": "text",
            "source": "gpu.execution_layout global = [128, 1, 1], workgroup = [64, 1, 1]\n%left  = kernel.ranked_view origin = 7, alias_class = 3\n%right = kernel.ranked_view origin = 7, alias_class = 3\nkernel.access Write %left[%tid]\nkernel.access Write %right[%tid + 1]",
            "diagnostic": "error[FE2O3-RACE-001]: potentially conflicting incompatible Write/Write effects on a may-alias coordinate\nfailed proof: distinct concurrent invocations do not imply disjoint memory coordinates",
            "property": "AliasAwareRaceFreedom",
            "stage": "generic PLIRON pass 4/8",
            "code": "FE2O3-RACE-001",
            "enforcement": "Multiview race unit; mandatory production pass",
            "caught": "Race keys use authenticated allocation origin and alias class, not the SSA name of a view. Renaming or slicing one allocation cannot hide a collision; distinct nonzero no-alias classes can establish disjointness, while unknown provenance fails closed."
          },
          {
            "id": "race_multidimensional_constant_write",
            "title": "A 2D launch writes one shared coordinate",
            "language": "text",
            "source": "gpu.execution_layout global = [2, 2, 1], workgroup = [2, 2, 1]\n%zero = kernel.index_constant 0\nkernel.access Write %output[%zero]  // no invocation identity in the address",
            "diagnostic": "error[FE2O3-RACE-001]: potentially conflicting incompatible Write/Write effects on output[0]\nfirst writer/reader: invocation [0, 0, 0]\nsecond writer/reader: invocation [0, 1, 0]",
            "property": "MultidimensionalRaceFreedom",
            "stage": "generic PLIRON pass 4/8",
            "code": "FE2O3-RACE-001",
            "enforcement": "Multidimensional execution-layout race unit; mandatory production pass",
            "caught": "The execution layout defines the invocation domain even when the program never requests an invocation-index value. Componentwise X/Y/Z identities expose the constant-address collision instead of allowing a missing index operation to erase concurrent work-items."
          },
          {
            "id": "atomic_scope_too_narrow",
            "title": "Atomic scope is narrower than the conflict",
            "language": "text",
            "source": "gpu.execution_layout global = [128, 1, 1], workgroup = [64, 1, 1]\nkernel.access AtomicRmw %counter[0] <ordering = AcqRel, scope = Workgroup>",
            "diagnostic": "error[FE2O3-RACE-004]: overlapping atomic effects use scopes Workgroup/Workgroup that do not cover the concurrent invocations\nfailed proof: cross-workgroup overlap requires compatible device-scope atomics",
            "property": "AtomicScope",
            "stage": "generic PLIRON pass 4/8",
            "code": "FE2O3-RACE-004",
            "enforcement": "Atomic/race PLIRON lit; mandatory production passes",
            "caught": "Atomic syntax alone does not make a grid-wide update race-free. The legality and race passes retain the exact address space, ordering, and scope and compare them with the independently declared multidimensional execution domain."
          },
          {
            "id": "barrier_partial_workgroup",
            "title": "Rounded 2D launch creates a partial workgroup",
            "language": "text",
            "source": "gpu.execution_layout global = [65, 64, 1], workgroup = [64, 1, 1]\nkernel.barrier <scope = Workgroup, ordering = AcqRel>",
            "diagnostic": "error[FE2O3-BARRIER-002]: cannot prove barrier convergence: Workgroup barrier has global extent 65 on axis 0, which is not a multiple of workgroup extent 64; rounded physical lanes and their activity paths are not represented",
            "property": "WorkgroupParticipation",
            "stage": "generic PLIRON pass 6/8",
            "code": "FE2O3-BARRIER-002",
            "enforcement": "Multidimensional barrier unit; mandatory production pass",
            "caught": "Global and workgroup extents are independent componentwise facts. The pass checks every axis rather than multiplying them into one scalar, so a partial workgroup cannot be hidden by a divisible total invocation count."
          },
          {
            "id": "workgroup_missing_publish",
            "title": "A peer reads LDS before publication",
            "language": "text",
            "source": "gpu.execution_layout global = [4, 1, 1], workgroup = [4, 1, 1]\n%lds = kernel.ranked_view <32, true, [4], Workgroup>\n%tid = kernel.invocation_index <0, 4>\nkernel.access Write %lds[%tid]\nkernel.access Read %lds[0]  // no workgroup acquire-release barrier",
            "diagnostic": "error[FE2O3-WORKGROUP-001]: invocation [1, 0, 0] reads uninitialized workgroup address [0] at block 0 op 4\nfailed proof: the address is not initialized by this invocation and no convergent workgroup-memory barrier published a prior write\nhelp: initialize the address and publish it with a workgroup acquire-release barrier before the read",
            "property": "WorkgroupPublication",
            "stage": "generic PLIRON pass 7/8",
            "code": "FE2O3-WORKGROUP-001",
            "enforcement": "Workgroup-memory PLIRON lit; mandatory production pass",
            "caught": "An address initialized by one invocation is not automatically published to its peers. Must-initialization dataflow tracks writers, readers, epochs, and a convergent publication barrier before admitting the peer read."
          },
          {
            "id": "grid_barrier_unsupported",
            "title": "Kernel asks for an unsupported grid barrier",
            "language": "text",
            "source": "gpu.execution_layout global = [8, 8, 1], workgroup = [8, 8, 1]\nkernel.barrier <scope = Grid, ordering = AcqRel>",
            "diagnostic": "error[FE2O3-BARRIER-002]: cannot prove barrier convergence: ordinary grid-wide barriers are unsupported at block 0 op 2; use disjoint workgroup ownership or legal device-scope atomics",
            "property": "GridSynchronization",
            "stage": "generic PLIRON pass 6/8",
            "code": "FE2O3-BARRIER-002",
            "enforcement": "Barrier PLIRON lit; strict production pass",
            "caught": "Ordinary workgroup synchronization cannot prove that all workgroups are resident or make progress together. Until an authenticated cooperative-launch model supplies those facts, grid barriers and spin-based global synchronization fail closed."
          },
          {
            "id": "bounds_static_oob",
            "title": "Static out-of-bounds access",
            "source": "#[kernel(typed)]\n#[allow(unconditional_panic)]\nfn out_of_bounds(value: f32, mut output: DisjointSlice<f32>) {\n    let input = [value; 64];\n    let selected = input[64];\n    if let Some(element) = output.get_mut(thread::index_1d()) {\n        *element = selected;\n    }\n}",
            "diagnostic": "error[FE2O3-BOUNDS-001]: statically out-of-bounds Read at block 2 op 0; access: v5 dimension 0; required: 64 < 64\n  --> Rust source ...:65:20\n  = ranked PLIRON before rejected lowering\n  = lowering stopped before target IR or artifact emission",
            "property": "MemoryBounds",
            "stage": "generic PLIRON pass 2/8",
            "code": "FE2O3-BOUNDS-001",
            "enforcement": "Rust production route and textual PLIRON lit",
            "caught": "The frontend preserves the array extent and constant index in ranked PLIRON. The bounds pass compares index 64 with extent 64, names the failed dimension and exact relation, maps it back to the Rust span, and terminates compilation."
          },
          {
            "id": "atomic_invalid_ordering",
            "title": "Illegal atomic ordering",
            "language": "text",
            "source": "%target = kernel.ranked_view <32, true, [1], Global>\n%zero = kernel.index_constant 0\nkernel.access AtomicRead %target[%zero] <ordering = Release, scope = System>",
            "diagnostic": "error[FE2O3-ATOMIC-001]: invalid Release ordering for AtomicRead at block 0 op 2; atomic loads cannot release and atomic stores cannot acquire\nhelp: retain a source ordering legal for the exact atomic operation",
            "property": "AtomicLegality",
            "stage": "generic PLIRON pass 3/8",
            "code": "FE2O3-ATOMIC-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "Semantic atomic IR retains operation kind, ordering, scope, element width, address space, and view provenance as structured attributes. A release-only load is invalid independently of the kernel algorithm, so compilation stops before target selection or emission. This card starts from textual PLIRON; it does not claim ordinary Rust atomic terminal import."
          },
          {
            "id": "race_duplicate_output",
            "title": "Cross-invocation write race",
            "language": "text",
            "source": "%tid = kernel.invocation_index <0, 64>\n%zero = kernel.index_constant 0\nkernel.access Write %output[%zero]",
            "diagnostic": "error[FE2O3-RACE-001]: potentially conflicting incompatible Write/Write effects on %output[0]\nfirst writer/reader: invocation [0]\nsecond writer/reader: invocation [1]\nfailed proof: distinct concurrent invocations do not imply disjoint memory coordinates\nhelp: include an invocation-owned coordinate, use a disjoint view, or use a compatible atomic operation",
            "property": "RaceFreedom",
            "stage": "generic PLIRON pass 4/8",
            "code": "FE2O3-RACE-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "Every invocation writes coordinate zero. Sparse affine analysis cannot prove the output map injective, and exact bounded witness enumeration reports the first conflicting invocation pair. CUDA or HIP would normally compile this race."
          },
          {
            "id": "barrier_divergent",
            "title": "Invocation-divergent barrier",
            "source": "#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]\nfn divergent_barrier(mut output: DisjointSlice<f32, GridExclusive>) {\n    if let Some(leader) = thread::grid_leader() {\n        sync::syncthreads();\n        if let Some(element) = output.get_mut_exclusive(&leader, 0) {\n            *element = 1.0;\n        }\n    }\n}",
            "diagnostic": "error[FE2O3-BARRIER-001]: divergent collective barrier trace; invocation [0] executes one workgroup barrier, while invocation [2] executes no barriers\nfailed proof: every participating invocation reaches the same barriers in the same order\nhelp: move the barrier out of invocation-varying control flow",
            "property": "BarrierConvergence",
            "stage": "generic PLIRON pass 6/8",
            "code": "FE2O3-BARRIER-001",
            "enforcement": "Rust production route and textual PLIRON lit",
            "caught": "The frontend authenticates the safe syncthreads terminal, preserves it as a workgroup barrier in the semantic CFG, and retains the leader-dependent branch. The pass derives per-invocation traces and compares collective barrier identities and order. One invocation reaches the barrier while peers bypass it, so lowering is rejected before a possible GPU deadlock."
          },
          {
            "id": "workgroup_uninitialized",
            "title": "Workgroup read before initialization",
            "language": "text",
            "source": "%lds = kernel.ranked_view <32, true, [64], Workgroup>\n%tid = kernel.invocation_index <0, 8>\nkernel.access Read %lds[%tid]",
            "diagnostic": "error[FE2O3-WORKGROUP-001]: invocation [0] reads uninitialized workgroup address [0] at block 0 op 2\nfailed proof: the address is not initialized by this invocation and no convergent workgroup-memory barrier published a prior write\nhelp: initialize the address and publish it with a workgroup acquire-release barrier before the read",
            "property": "WorkgroupMemory",
            "stage": "generic PLIRON pass 7/8",
            "code": "FE2O3-WORKGROUP-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "The epoch analysis tracks writes, compatible atomics, and convergent workgroup publication. This read has neither a same-invocation initializer nor a published prior write, so the pass reports its invocation and address."
          },
          {
            "id": "semantic_mismatch",
            "title": "Declared formula mismatch",
            "language": "text",
            "source": "%actual = kernel.semantic_add (%alpha * %acc), %initial\n%required = kernel.semantic_add (%alpha * %acc), (%beta * %initial)\nkernel.require_equivalent %actual, %required",
            "diagnostic": "error[FE2O3-SEMANTIC-001]: declared semantic refinement failed at block 0 op 8\nactual expression `add(mul(s0,s1),s3)` is not equivalent to required expression `add(mul(s0,s1),mul(s2,s3))`\nhelp: preserve the frontend-declared target-neutral semantic formula",
            "property": "SemanticRefinement",
            "stage": "generic PLIRON pass 8/8",
            "code": "FE2O3-SEMANTIC-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "The pass hash-conses the target-neutral expression DAG, normalizes commutative operand order without reassociating floating-point operations, and finds that beta times the prior value is missing."
          },
          {
            "id": "hierarchy_coverage_hole",
            "title": "The grid leaves one output coordinate unwritten",
            "language": "text",
            "source": "gpu.execution_layout global = [64, 1, 1], workgroup = [32, 1, 1], subgroup = 16\n%output = kernel.ranked_view <32, true, [128], Global>\nkernel.ownership_contract %output <ExactView, ExactSets>\n%tid = kernel.invocation_index <0, 64>\n%two = kernel.index_constant 2\n%even = kernel.index_binary Multiply %tid, %two\nkernel.access Write %output[%even]",
            "diagnostic": "error[FE2O3-OWN-006]: exact ownership of %output has a hole at logical coordinate [1] within extents [128]; no invocation, subgroup, or workgroup owns that element",
            "property": "GridCoverage",
            "stage": "generic PLIRON pass 5/8",
            "code": "FE2O3-OWN-006",
            "enforcement": "Production ranked recipe plus hierarchy-ownership PLIRON pass",
            "caught": "The pass derives actual writes, maps each invocation to lane, subgroup, and workgroup, and compares the union with the declared logical view. It reports the first missing coordinate without knowing what workload produced the write."
          },
          {
            "id": "reference_evidence_missing",
            "title": "A CPU-reference effect has no authenticated proof",
            "language": "text",
            "source": "proof.obligation <id = 4a.., property = FunctionalRefinement, subject = kernel_mir.., model = reference_mir..>\nproof.require_effect_refinement %output[%index], %gpu_domain, %reference_domain, %gpu_precondition, %reference_precondition, %gpu_value, %reference_value",
            "diagnostic": "error[FE2O3-SEMANTIC-003]: functional-reference obligation <obligation-id> is incomplete at block 0 op 2: the exact proof.evidence_ref record is missing\nclassification: Incomplete",
            "property": "FunctionalRefinementEvidence",
            "stage": "generic PLIRON pass 8/8",
            "code": "FE2O3-SEMANTIC-003",
            "enforcement": "Proof dialect verifier, semantic-refinement prerequisite, and authenticated V2 receipt import",
            "caught": "This is the direct PLIRON pass diagnostic, parameterized by the obligation identity and operation location. Equal expressions do not authenticate a proof run. The compiler requires exact reference/kernel MIR and effect identities plus one policy-signed V2 receipt for a verified Proved execution at the MIR boundary; missing, stale, forged, wrong-toolchain, wrong-boundary, and duplicate receipts fail closed."
          },
          {
            "id": "reference_expression_mismatch",
            "title": "The GPU write disagrees with the CPU reference",
            "language": "text",
            "source": "%gpu = kernel.semantic_constant 17\n%cpu = kernel.semantic_constant 18\nproof.require_effect_refinement %output[%index], %gpu_domain, %cpu_domain, %gpu_precondition, %cpu_precondition, %gpu, %cpu",
            "diagnostic": "error[FE2O3-EFFECT-001]: value mismatch for %output at block 2 op 0; GPU `17` is not equivalent to sequential reference `18`\nclassification: Rejected",
            "property": "FunctionalRefinementExpression",
            "stage": "generic PLIRON pass 8/8",
            "code": "FE2O3-EFFECT-001",
            "enforcement": "Production reference-effect recipe inside the semantic-refinement stage",
            "caught": "This is the direct PLIRON pass diagnostic shape; operand names and locations come from the rejected IR. ExactView inputs may append a bounded hierarchy witness when one was constructed. The current source subset rejects a 17-to-18 mutation earlier in the compiler-private effect bijection, before Verus, with exact reference and GPU sites but no invented FE2O3 pass code."
          },
          {
            "id": "parallel_multi_output_identity",
            "title": "Multiple output views lack hierarchy identities",
            "language": "text",
            "source": "compiler-derived parallel contract\n  total_output_views = 2\n  hierarchy_report.stable_ranked_view_identities = unavailable",
            "diagnostic": "error[FE2O3-PARALLEL-016]: the current hierarchy report cannot bind 2 output views independently; production rejects multi-output hierarchy composition until the report carries stable ranked-view identities\nclassification: Incomplete",
            "property": "OutputSpecificHierarchy",
            "stage": "compiler-owned strict parallel derivation",
            "code": "FE2O3-PARALLEL-016",
            "enforcement": "Production parallel-reference contract derivation and middle-end tests",
            "caught": "A union-wide hierarchy count cannot prove which live output view each owner covers. The compiler refuses to compose two outputs until the hierarchy report carries stable ranked-view identities; no candidate declaration can supply the missing evidence."
          },
          {
            "id": "parallel_contract_construction",
            "title": "Compiler-derived parallel contract is invalid",
            "language": "text",
            "source": "compiler-derived relation\n  output = live ranked view\n  schedule = derived live collective\n  validate() = invalid",
            "diagnostic": "error[FE2O3-PARALLEL-017]: compiler-derived parallel contract was invalid: <exact contract construction error>\nclassification: Rejected",
            "property": "CompilerDerivedParallelContract",
            "stage": "compiler-owned strict parallel derivation",
            "code": "FE2O3-PARALLEL-017",
            "enforcement": "Production parallel-reference contract constructor and negative tests",
            "caught": "The compiler constructs the strongest supported pointwise, permutation, fold, or recurrence relation from live semantic and hierarchy evidence, then validates it independently. If its own constructed contract is inconsistent, compilation stops instead of trusting a source or caller assertion."
          }
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Stable pass diagnostic catalog",
        "text": "Tensor and multidimensional execution diagnostics identify the failed semantic contract rather than a workload name. The first table summarizes important semantic categories. The second table records every stable tensor-layout, bounds, atomic, race, hierarchical-ownership, barrier, workgroup-memory, and declared-semantic FE2O3 pass code plus the two newest compiler-owned parallel derivation outcomes. The effect table records implemented code classes and their Rejected or Incomplete outcomes; direct PLIRON diagnostics carry stable codes, while source-join failures currently use precise rustc diagnostics without inventing a pass code. Other compiler boundaries reject additional invalid programs without inventing an eight-pass code. Prerequisite and Incomplete results are terminal proof failures, not permission to continue lowering."
      },
      {
        "type": "table",
        "headers": [
          "Semantic diagnostic category",
          "Rejected condition",
          "Incomplete condition"
        ],
        "rows": [
          ["tensor instruction identity", "Operand role, instruction profile, element type, packing, wave width, or register distribution disagrees with the typed instruction.", "Target instruction/profile evidence is missing or unsupported."],
          ["tensor operand/register map", "A, B, or accumulator lane/component coordinates, multiplicity, bounds, or coverage disagree with the instruction profile.", "A map is opaque or exceeds bounded analysis."],
          ["tensor storage layout", "An operand uses an unsupported direct/LDS transform or the declared transform does not produce its required register map.", "Storage provenance or transform evidence is unresolved."],
          ["tensor edge policy", "The exact-tile or authenticated zero-fill contract is inconsistent with the physical fragment.", "The frontend cannot establish one of the current profile's accepted edge policies."],
          ["tensor convergence", "Participating lanes execute different tensor-instruction sites or orders.", "Control uniformity, active participants, or a cyclic trace cannot be resolved."],
          ["execution layout", "Global, workgroup, subgroup, or lane identities contradict one another; a per-axis partial workgroup violates a collective contract.", "A required dynamic extent or participant relation is unresolved."],
          ["allocation provenance and alias", "Two may-alias views expose an incompatible concrete concurrent effect.", "Allocation origin or alias class is unknown where disjointness is required."],
          ["synchronization scope", "An atomic or barrier scope is narrower than the participating conflict domain.", "Grid progress or cooperative-launch evidence is absent."]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Diagnostic",
          "Class",
          "Exact condition reported"
        ],
        "rows": [
          ["FE2O3-TENSOR-LAYOUT-001", "Rejected", "A tensor contract is malformed or disagrees with the instruction profile, including operand roles, width, packing, register maps, coordinate coverage, storage transform, tail policy, active lanes, or an exact divergent trace."],
          ["FE2O3-TENSOR-LAYOUT-002", "Incomplete", "Tensor layout or convergence cannot be proved, including an opaque lane map or unresolved cyclic control flow."],
          ["FE2O3-TENSOR-LAYOUT-003", "Incomplete", "Tensor verification exceeded an explicit operation, map, trace, finding, or work-unit limit."],
          ["FE2O3-BOUNDS-000", "Prerequisite", "PLIRON structural verification failed before ranked bounds analysis."],
          ["FE2O3-BOUNDS-001", "Rejected", "A read, write, or atomic index is statically outside a ranked extent; the diagnostic names the view, dimension, index, and required index < extent relation."],
          ["FE2O3-BOUNDS-002", "Incomplete", "The compiler cannot prove index < extent on every path; add a dominating guard or use an explicitly checked access."],
          ["FE2O3-BOUNDS-003", "Incomplete", "Bounds analysis encountered an unreachable block, unsupported terminator or operation, sparse-index failure, or bounded resource limit."],
          ["FE2O3-ATOMIC-001", "Rejected", "An atomic access is malformed, lacks explicit ordering or scope, uses an ordering illegal for its kind, or names a scope illegal for its address space."],
          ["FE2O3-ATOMIC-002", "Incomplete", "View provenance, target width/address-space/scope capability, or authenticated coherent-allocation evidence for system scope is unavailable."],
          ["FE2O3-ATOMIC-003", "Incomplete", "Atomic legality exceeded its bounded operation or finding budget."],
          ["FE2O3-RACE-000", "Prerequisite", "Ranked bounds verification failed before race analysis."],
          ["FE2O3-RACE-001", "Rejected", "Two concrete concurrent invocations have incompatible effects at the same coordinate; the diagnostic names both invocation and operation witnesses."],
          ["FE2O3-RACE-002", "Incomplete", "Race freedom cannot be proved because a launch, indexed coordinate, allocation/alias contract, or required happens-before relation is unresolved."],
          ["FE2O3-RACE-003", "Incomplete", "Sparse-index analysis failed or the exact invocation, effect-instance, or finding bound was exceeded."],
          ["FE2O3-RACE-004", "Rejected", "Overlapping atomic effects use scopes that do not cover the concrete concurrent invocations; cross-workgroup overlap requires compatible device-scope atomics."],
          ["FE2O3-OWN-001", "Rejected", "An ownership contract is duplicated or is not unconditional entry-block metadata."],
          ["FE2O3-OWN-002", "Incomplete", "The execution layout, dynamic extent, sparse coordinate, or exact guarded trace required for ownership cannot be resolved."],
          ["FE2O3-OWN-003", "Incomplete", "The bounded ownership contract or exact domain limit was exceeded."],
          ["FE2O3-OWN-004", "Rejected", "A concrete invocation owns a coordinate outside the contracted logical extent."],
          ["FE2O3-OWN-005", "Rejected", "Two concrete hierarchy owners claim the same coordinate; the diagnostic names both invocations, workgroups, subgroups, lanes, and operations."],
          ["FE2O3-OWN-006", "Rejected", "Exact grid coverage has a hole; the diagnostic names the first uncovered logical coordinate."],
          ["FE2O3-OWN-007", "Rejected", "A requested dense subgroup or workgroup tile has a hole inside its bounding rectangle."],
          ["FE2O3-BARRIER-000", "Prerequisite", "Bounds verification failed before barrier-convergence analysis."],
          ["FE2O3-BARRIER-001", "Rejected", "Two participating invocations execute different collective barrier identities or orders."],
          ["FE2O3-BARRIER-002", "Incomplete", "Barrier convergence cannot be proved because the launch, branch, terminator, CFG, or bounded trace is unresolved or unsupported."],
          ["FE2O3-WORKGROUP-000", "Prerequisite", "Bounds or barrier-convergence verification failed before workgroup-memory analysis."],
          ["FE2O3-WORKGROUP-001", "Rejected", "An invocation reads a workgroup address without same-invocation initialization or a convergent acquire-release publication of a prior write."],
          ["FE2O3-WORKGROUP-002", "Rejected", "Concurrent invocations perform incompatible workgroup-memory effects at the same address in one barrier epoch."],
          ["FE2O3-WORKGROUP-003", "Incomplete", "Workgroup-memory safety cannot be proved because a trace or effect is unsupported or a finding/resource limit was reached."],
          ["FE2O3-SEMANTIC-000", "Prerequisite", "Bounds verification failed before declared semantic refinement."],
          ["FE2O3-SEMANTIC-001", "Rejected", "The actual expression is not equivalent to the explicitly declared required expression."],
          ["FE2O3-SEMANTIC-002", "Incomplete", "A declared semantic expression cannot be resolved or the semantic-analysis resource limit was exceeded."],
          ["FE2O3-SEMANTIC-003", "Incomplete", "A functional-reference obligation is missing exact Proved MIR-bound evidence or carries a non-Proved status or wrong boundary."],
          ["FE2O3-SEMANTIC-004", "Rejected", "A functional-reference obligation or evidence record is duplicated, mismatched, malformed, wrong-property, or orphaned."],
          ["FE2O3-PARALLEL-016", "Incomplete", "Multiple live output views cannot be bound independently because the hierarchy report lacks stable ranked-view identities."],
          ["FE2O3-PARALLEL-017", "Rejected", "The workload-neutral parallel contract constructed from compiler-owned live evidence fails its independent contract validation."]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Effect diagnostic",
          "Outcome",
          "Exact condition reported"
        ],
        "rows": [
          ["FE2O3-EFFECT-001", "Rejected", "GPU and sequential-reference domain, precondition, or value expressions differ; block and operation are always reported, and an ExactView bounded trace may add a hierarchy witness."],
          ["FE2O3-EFFECT-002", "Incomplete", "The output view has no exact hierarchy-ownership contract."],
          ["FE2O3-EFFECT-003", "Incomplete", "Under ExactView, dynamic ownership, guarded effect tracing, or a prerequisite ownership proof is unresolved; ExactEffectDomain deliberately checks only the modeled static write domain."],
          ["FE2O3-EFFECT-004", "Rejected", "The hierarchy-ownership contract used by the effect statement is concretely invalid."],
          ["FE2O3-EFFECT-005", "Rejected", "An effect contract is orphaned, matches multiple writes, or duplicates another contract for one write."],
          ["FE2O3-EFFECT-006", "Incomplete", "A concrete GPU write has no modeled sequential-reference effect; a full hierarchy owner is included only when a bounded ExactView trace supplied one."],
          ["FE2O3-EFFECT-007", "Rejected or Incomplete", "The exact MIR FunctionalRefinement evidence is invalid, or required Proved MIR-bound evidence is unavailable."],
          ["FE2O3-EFFECT-008", "Incomplete", "A domain, precondition, or value expression is outside the bounded normalization subset."],
          ["FE2O3-EFFECT-009", "Incomplete", "The function exceeds the explicit effect-contract resource limit."]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Other compile-time boundary",
          "Representative failure",
          "Diagnostic ownership"
        ],
        "rows": [
          ["rustc and kernel macro", "Rust type, move, borrow, lifetime, visibility, attribute, signature, unsafe-body, or inline-assembly violation.", "rustc or source-admission diagnostic; not a PLIRON pass code."],
          ["semantic MIR import", "Unsupported terminal, ownership mapping, effect, call, or control-flow projection.", "Frontend Rejected or Incomplete diagnostic before ranked PLIRON authority."],
          ["dialect and structural verification", "Malformed operation, type, SSA use, dominance, region, terminator, capability, or execution-layout contract; Kernel IR also rejects an illegal cast kind, scalar category, signedness, or width as InvalidCast.", "Structural diagnostic at the owning IR boundary; this is not an invented eight-pass code."],
          ["checked lowering and Kernel IR verification", "A verified PLIRON fact cannot be represented faithfully in canonical KIR V7, or canonical KIR semantic verification fails.", "Lowering or KIR verification diagnostic; no target artifact is emitted."],
          ["formal memory admission", "A guarded non-private load does not bind data, length, selected index, and predicate to the same allocation, or its selected false address offset is not literal zero.", "Formal-memory rejection after KIR verification and before target lowering."],
          ["target and production boundary", "Unsupported target operation or profile, compiler invocation or closure mismatch, finalization failure, or artifact contract mismatch.", "Owning target, invocation, worker, or finalizer diagnostic; never a fabricated safety-pass code."]
        ]
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "Static and dynamic shapes have different proof outcomes",
        "text": "A static extent and static index can produce a concrete Rejected witness such as 64 < 64. A dynamic extent is not deferred automatically to an unchecked runtime access. A dominating guard or explicitly checked access carries the path fact needed to make the dynamic access provable; otherwise the strict compiler reports FE2O3-BOUNDS-002 Incomplete and emits no artifact. Host prepare checks validate launch-time extents and aliases, but they do not convert an unproved device access into a safe kernel."
      },
      {
        "type": "table",
        "headers": [
          "Kernel shape",
          "Available fact",
          "Strict compiler result"
        ],
        "rows": [
          ["[T; 64] with index 64", "The extent and invalid index are static.", "Rejected with FE2O3-BOUNDS-001 and the failed 64 < 64 relation."],
          ["&[T] with a dominating index < len guard", "Every path to the access carries the required dynamic bound.", "Clean when sparse-index analysis proves the guard dominates the access."],
          ["&[T] with an unresolved index", "The compiler cannot establish index < extent on every path.", "Incomplete with FE2O3-BOUNDS-002; no target lowering or runtime artifact."],
          ["Dynamic checked-tile ownership", "An authenticated checked-tile witness preserves an exact zero-offset, unit coordinate embedding for every active launch axis.", "The generic race pass can prove injectivity without enumerating the runtime grid."],
          ["Ordinary dynamic affine write", "The address is dynamic but has no authenticated total ownership embedding.", "FE2O3-RACE-002 Incomplete; an expression that merely looks affine is not accepted as a partition."],
          ["Potentially overflowing affine map", "A multiply or add is not proved total over the admitted launch domain.", "Race proof is Incomplete even if the mathematical, unbounded-integer formula would be injective."],
          ["Dynamic launch or alias relation", "Concurrency or disjointness cannot be resolved in the bounded model.", "The corresponding race or barrier pass reports Incomplete and compilation stops."]
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "A guarded load is a structural proof obligation",
        "text": "For each non-private guarded load, formal-memory admission follows a bounded SSA def-use chain and requires one allocation throughout: slice data, slice length, the selected address, and the index in index < length must all agree. Its selected false offset is literal zero, and a false guard returns the fallback without a memory access. A similar-looking predicate over another slice, a detached length, a missing definition, a cycle, or an exhausted budget fails closed."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Bounds do not erase aliasing",
        "text": "A guard proves that one access is within one recorded allocation; it does not prove that two views are disjoint. Race analysis keeps allocation origin and alias class, and remains conservative when relative slice offsets or provenance cannot establish separation. Safe DisjointSlice mappings can discharge that obligation because the compiler authenticates their ownership identity and exact coordinate transform; an ordinary may-alias slice cannot acquire that fact from a bounds predicate."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Cross-wave and cross-workgroup claims have explicit scope",
        "text": "Within a workgroup, the verifier can relate multiple waves through LDS effects, initialization epochs, and convergent workgroup barriers. Across workgroups, it can prove disjoint global effects or compatible atomics from the execution layout and provenance. It does not assume simultaneous residency, forward progress, a grid-wide barrier, or coherent system allocation; those require separate authenticated launch and target contracts, otherwise compilation is Incomplete."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Ordinary Rust atomic terminals are explicitly unsupported",
        "text": "The compiler authenticates and reserves the four DeviceGlobalMutPtr<T>::as_atomic() terminals for u32, i32, u64, and i64, but the ordinary Rust source route is rejected until core Atomic<T> operation terminals are modeled. Rust Ordering does not imply a GPU memory scope, so the compiler does not invent one. For semantic AtomicAccess already present in IR, projection preserves the exact operation kind, ordering, and scope. The generic atomic pass then reports FE2O3-ATOMIC-002 Incomplete when exact target width/address-space/scope capability or, for system scope, authenticated coherent-allocation evidence is absent. No non-clean report grants lowering, artifact, or launch authority."
      }
    ]
  },
  "compiler-checks/production-path": {
    "sectionId": "compiler-checks-production-path",
    "title": "How a rejection reaches the Rust user",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "rustc preserves supported semantic MIR, source spans, ranked extents, checked branches, and memory effects.",
          "For reference = path, the collector resolves one local safe Rust function and the exact monomorphized kernel/reference Instances in the same session, then records compiler-derived identities and MIR body SHA-256 values; source cannot supply them. Leading usize reference arguments are logical point axes, followed by direct mutable scalar outputs.",
          "ReferenceEffectIrV1 derives bounded typed outputs, logical points, guards, expressions, canonical finite loops, and direct safe local scalar-helper summaries from safe Rust MIR. Separately, ranked GPU projection derives live outputs and expressions. A strict bijection rejects missing, extra, ambiguous, or mismatched effects; unbound Vec/slice reads and unsupported CFG or expressions fail Incomplete before proof execution.",
          "The ordinary-kernel source contract rejects unsafe signatures, unsafe bodies, inline assembly, and reachable unsafe device functions; only the separate unsafe_asm profile admits the low-level escape.",
          "Every compiler-recognized device capability must match its exact diagnostic item and canonical DefPath, an authenticated reviewed provider identity, the compiled SourceFileHash under the reviewed source root, and the pinned provider source digest.",
          "Supported safe ownership mappings retain their genuine marker identity and const parameters; malformed, substituted, or unsupported forms stop as Rejected or Incomplete before they can become memory effects.",
          "The frontend constructs context-owned ranked PLIRON and runs dialect verification before any safety analysis.",
          "One ephemeral analysis manager caches sparse facts, execution layout, and exact bounded traces for the immutable function; reachable typed CFG edges are part of sparse propagation, and no cache survives mutation or revalidation.",
          "The eight mandatory workload-neutral passes consume those shared facts in fixed order: tensor layout, bounds, atomic legality, race freedom, hierarchical ownership, barrier convergence, workgroup memory, and semantic refinement. Effect refinement executes inside the final stage after hierarchy ownership. Every report returns Clean, Rejected, or Incomplete.",
          "For each paired effect in the admitted point-output subset, the private compiler carries exact GPU and reference sites, memory indices, logical coordinates, domains, preconditions, and typed formulas into the value-carrying ranked recipe. It does not invent lane, subgroup, workgroup, or output-view witnesses.",
          "The normalized obligation binds the full validated ranked CFG, every operation and terminator, execution layout, real value-carrying access, view and allocation, ownership contract, exact reference site, formulas, and same-session MIR subjects. Only request-to-require normalization is excluded from the digest.",
          "When the exact fixed runtime closure is installed, the workload-neutral controller supervises pinned rust_verify, its retained internal verifier child, and Z3 as one bounded descendant tree. Executable mappings, inherited files, process topology, resources, timeout, and cleanup fail closed. Cached template/generated-fixture checks pass, but mi300x lacks the root-owned fixed /opt runtime, so no referenced production compilation has completed the aggregate gate.",
          "Production derives and reconciles the compiler-owned semantic contract, derives and independently validates the strict compiler-owned parallel contract, then runs a generated workload-neutral Verus conditional-lemma checker. The report cryptographically binds the check and retained receipts outside the lemma. These stages run in order before KIR lowering; this is not a whole-kernel theorem, and candidate declarations are not evidence.",
          "The compiler imports one move-only Ed25519 V2 proof only after the exact MIR, live PLIRON, relation, hierarchy, numerical-policy, retained-effect, tool, execution, signer, and SafeReferenceMirToLivePliron identities match. Public receipt inspection exposes signature-and-policy verification, not compiler authority.",
          "A non-clean finding carries a stable FE2O3 code, failed relation or witness, IR operation, and Rust source location when that projection exists.",
          "One move-only compiler-owned ranked-verification input retains the eight ordered live reports through checked lowering; no caller can reconstruct it from booleans or diagnostics. The historical inert V4 evidence wire format still serializes its original seven reports and explicitly does not claim the new hierarchy report.",
          "Protected production additionally admits a sealed V3 rustc-invocation descriptor against the live argv, cwd, complete environment, target, rustc image, backend image, and full compiler closure. Worker V3 inputs are preflighted before transaction consumption, and finalization binds the exact invocation, closure, transaction, link plan, measured worker response, raw HSACO, descriptor source, and finalized bytes.",
          "The production transaction stops before target IR, finalization, or artifact publication on every Rejected or Incomplete result."
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Current end-to-end boundary",
        "text": "The production contract places tensor-layout verification first, before bounds, atomics, races, hierarchy ownership, barriers, workgroup memory, and semantic refinement. For a reference-bound compilation, compiler-owned semantic derivation reconciles safe-reference MIR, kernel MIR, admitted effects, typed roots, canonical loops, collectives, TotalView, and live PLIRON identity. Strict parallel derivation constructs and validates the strongest supported pointwise, permutation, fold, or recurrence relation. A generated Verus program then checks generic conditional lemmas; the production report binds the exact instantiation and retained receipts outside the lemmas before KIR lowering. The point-output subset does not bind Vec/slice loads or unsupported dynamic reference loops. Tensor/MFMA calls still need claim-specific summaries, multiple outputs need stable hierarchy identities, and non-exact schedules need error-bound/reassociation proofs. mi300x lacks the required root-owned /opt runtime. Compiler extraction/projection and pass soundness, LLVM+, artifacts, launch, hardware, and performance remain outside the receipt."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "What remains trusted",
        "text": "Verus proves equality of the formulas generated for the paired effect. The rustc MIR collector, safe-reference extractor, GPU projection, bounds-only control validator, effect bijection, ranked-recipe construction, and transcript construction remain in the compiler trusted computing base. This path does not prove rustc source-to-MIR correctness, compiler extraction correctness, ranked-IR-to-ISA refinement, or hardware execution."
      }
    ]
  },
  "compiler-checks/v7-simulation": {
    "sectionId": "v7-simulation",
    "title": "Debug exact V7 without upgrading observation into proof",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The bounded deterministic CPU simulator consumes an exact VerifiedCanonicalKernelIrV7 owner. Its current subset executes integer and boolean scalar operations, structured control flow, internal calls, private and global buffers or views, ordinary or guarded scalar loads, and D1-D3 invocation identities. The standalone Linux boundary is fe2o3-kir-sim --kir-v7 kernel.kir --request request.json. Raw in-memory modules and older wire versions are not execution inputs."
      },
      {
        "type": "table",
        "headers": [
          "V7 observation surface",
          "Current behavior",
          "Boundary"
        ],
        "rows": [
          ["Schedule", "Workgroups and local slots are created in canonical Z/Y/X order; live invocations advance cooperatively and yield at convergent workgroup barriers.", "This is deterministic CPU execution, not a GPU scheduler or progress model."],
          ["Guarded scalar load", "A false predicate returns the fallback without validating the pointer, touching memory, or emitting a read event.", "The simulator observes already-verified KIR behavior; it does not establish source-to-KIR refinement."],
          ["Memory conflicts", "The result contains a bounded byte-level cross-invocation global-memory conflict assessment.", "Clean is not a race-freedom proof; conflict and incomplete outcomes remain observations."],
          ["Semantic trace V1", "A separate in-process adapter maps simulator events to bounded observation-only trace records.", "Trace KIR identity and site ordinals are untrusted claims until rebound to an independently owned exact V7 module."],
          ["Workgroup cooperation", "Static scalar workgroup memory and convergent workgroup barriers model initialization, cross-lane publication, and one allocation per workgroup.", "Generic barriers, dynamic or non-scalar workgroup memory, and physical wave behavior are outside this profile."],
          ["Unsupported operations", "Floating point, external calls, generic barriers, atomics, fences, dynamic or non-scalar workgroup memory, wave and matrix operations, memory intrinsics, and inline assembly are rejected.", "The current GEMM, softmax, attention, and MoE tutorial kernels cannot run in this simulator profile."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "A debugger observation grants no execution authority",
        "text": "Simulation results and semantic traces establish no race freedom, proof discharge, source-to-KIR or GPU equivalence, artifact identity, load or launch authority, timing, performance, or performance prediction. The CLI emits copied results and the conflict assessment. Semantic trace capture is a separate in-process adapter; the CLI does not silently promote a trace into verified evidence."
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
        "text": "The Kernel tab is the pinned safe Wave64 source milestone at af0fd523e3b774377a9c5192cf0511e34fa19735. Its checked CPU oracle, mutation tests, and bounded Verus model retain source/model-only authority. Historical compiler, finalizer, runtime, and protected gfx942 observations remain separately pinned and do not prove source-to-machine refinement for that source."
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
        "text": "Atomic validity is a tuple of operation, scalar type, success/failure ordering, synchronization scope, address space, and allocation coherence. The separate exact scoped_atomic.rs source uses DeviceGlobalMutPtr to state global address-space identity, while generated host admission requires one exclusively borrowed GlobalMut region. Those types do not establish that a runtime allocation is eligible for system scope or that the source has entered compiler lowering."
      },
      {
        "type": "bullets",
        "items": [
          "Use workgroup scope only for workgroup communication.",
          "Require coherent allocation evidence for device/system interactions.",
          "Reject mixed atomic and non-atomic overlap unless the model orders it explicitly."
        ]
      },
      {
        "type": "links",
        "items": [
          {
            "label": "Exact separate scoped_atomic.rs source",
            "href": "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/workgroup_sync_v1/src/scoped_atomic.rs"
          }
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
        "text": "LDS Slice 1 remains a bounded chain rather than a production kernel. Commit 4c79c58de1da19d9b7a22cba906f301e347c8f7c seals the fixed two-tile Kernel IR; 97373b781ac3643b1de61b4572894f7028b565b0 verifies its separate exact-real source model; ee76cedcdc4126c69bc486a5ac12900c1c5485b1 introduces the ordinary #[kernel(typed, ...)] source; and 50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2 inspects canonical-IR-derived upstream LLVM/LLD output. Commit dc31f23eb2decaa91eb2f9d72ae4c70e94766564 then authenticates the exact attributed source and reviewed reachable MIR to select only the verified canonical IR with two compiler-derived 512-byte LDS tiles. That receipt stops before descriptor construction and Worker V2 and is not compiler refinement or source-to-machine evidence."
      },
      {
        "type": "paragraph",
        "text": "Commit 5a45239aeeda3ca64cf16beb7fb1d3589e649bfe adds bounded identity-bound Slice 1 source/model correspondence. Verus reports 96 verified and 0 errors for exact source-profile lengths, same-epoch LDS initialization, converged publish ordering, unique C ownership, and correspondence identities; four targeted mutations are rejected. Clean mi300x validation passed 76 debug tests, 76 release tests, 7 doctests in each lane, strict Clippy, six positive proof groups, and 21 expected rejections. This does not establish rustc/LLVM/machine refinement, descriptor or Worker V2 integrity, certificate consumption, loading, or launch authority. Production certificate consumption is tracked in #91, K-phase/grid/edge proof extension in #92, and semantic MIR-to-Kernel-IR refinement in #106."
      },
      {
        "type": "paragraph",
        "text": "Slice 2 adds proof/model depth without upgrading execution. Commit aba53376b4825c730ca9e9685e274e0c334e0e32 verifies one through four complete K phases with 196 verified and 0 errors, rejects missing-reuse and accumulator-reset mutations, and exhaustively runs integer event models for 1, 2, and 4 phases. That record is not an attributed multi-phase GPU kernel, backend result, HSACO, or hardware observation."
      },
      {
        "type": "paragraph",
        "text": "A separate Slice 1 hardware increment at 79ad2298619baa4138b5edbf55e0d8044295bec2 generated HSACO from canonical Kernel IR with SHA-pinned upstream LLVM 22 llc, ld.lld, and llvm-objdump, without COMGR. On MI300X, six cases checked 1,536 outputs, unchanged A/B values, and allocation canaries; one ignored hardware test passed in 33.72 seconds. This is observational IR-derived evidence only, not Rust-source correspondence, Verus proof, Worker V2, publisher, or protected-launch authority."
      },
      {
        "type": "paragraph",
        "text": "Commit b94bd7d78604a6b7fe12f571f84cfc5f5b29eaba adds independent K32 Slice 2 backend evidence: a real two-trip SSA loop with carried FP32 accumulators, two physical barriers, reused 1,024-byte LDS, and one static loop-body BF16 MFMA. The upstream LLVM 22 final-artifact machine test passed, the full dialect suite passed 120 tests, and strict Clippy passed. This is not attributed-source, hardware-execution, protected-authority, or LLVM-refinement evidence."
      },
      {
        "type": "paragraph",
        "text": "Commit 280995762fce8a97f72fc2acb53c0d7effd2109f makes the exact WG64 launch contract macro-owned for general typed #[kernel] functions. Required-only WG64 and WG256 remain compatible, fixed WG256 profiles reject WG64, and tiled Slice 1 has no handwritten frontend sidecar. Commit dc31f23eb2decaa91eb2f9d72ae4c70e94766564 authenticates the exact source to canonical Kernel IR and derives its LDS metadata. Commit 1429ed6ae70dcd218376b777e0fef7db4413efdb adds canonical matrix Kernel IR V5 bytes, and 7337a2b87dffa0845d092c13399b012f884de90b closes #85 by joining the source receipt to an exact compiler-owned descriptor and single-use inert Worker V2 handoff. The handoff grants no finalization, load, launch, hardware, or proof-certificate authority."
      },
      {
        "type": "paragraph",
        "text": "Commit 89ebe69bb3daf8262a485463c5fdf04cf095346f closes #96 with stable, disjoint Slice 1, K-phase, Grid, and Edges registry slots. Only exact M16 N16 K16 Slice 1 is enabled; the other slots fail closed as reserved. Admission reconstructs canonical Kernel IR V5, independently re-lowers through upstream dialect-amdgcn, and requires exact LLVM, descriptor, source-authority, resource-transcript, target, COV6, ABI 48/304/8, grid 1, WG64, 1,024-byte LDS, typed effect, and role-separated length bindings. The retained import is non-Clone and grants no compiler-origin, finalizer, Worker V2, linker, publication, load, launch, hardware, numerical, or Verus proof authority."
      },
      {
        "type": "paragraph",
        "text": "Commits 6a3f7afe944dce87f355e11cba45dbb5f857dcf5, bb2c2100f7be30d7676eaf3b02952052db216404, and bfe9dfeeff4b7efdc0aee3af8748e84eae5acb28 complete #97 by implementing, admitting, and integrating the exact Slice 1 upstream LLVM target-machine plus LLD library API Worker V2 finalizer. There is no COMGR, shell llc, or shell ld.lld escape hatch. The path closes exact gfx942:xnack- COV6 WG64 symbol, ABI, 1,024-byte LDS, zero-private-segment, and relocation requirements with deterministic lineage. Its inert finalized receipt authenticates no compiler origin, proves no Verus or compiler/LLVM/machine refinement, and grants no publication, protected-load, dispatch, or launch authority."
      },
      {
        "type": "paragraph",
        "text": "Commit 278a41afb98684e1c1e60b4fb1d474c1fd5f44d8 completes #99 with the generated exact BF16/F32 Slice 1 host adapter. A and B are 256-element u16 BF16-bit shared read views, C is a 256-element f32 unique read/write view, A/B overlap is allowed, and C overlap is rejected. It prepares the exact 48-byte explicit and 304-byte complete COV6 ABI, copies the sealed import/profile/contract/descriptor/length identities, releases the compiler-import borrow for finalization consumption, and keeps all buffers borrowed. It exposes no raw launch. Protected implementation checkpoint c4fcb4d9 contains the #97 and #99 increments; final public-main documentation commit cfcb579e2 is its docs-only descendant."
      },
      {
        "type": "paragraph",
        "text": "Commit c4fcb4d980cf979c0527dfa135a7b9f4fe72a811, tree c65c6ab567409afaaef6ea39c8befcac21d47119, is the completed exact protected Slice 1 checkpoint. #100's private non-Clone states consume ownership as Joined -> Loaded -> Completed -> Unloaded. Join reconciles the exact #97 artifact and #99 import, profile, contract, descriptor, buffer, and length identities before supplying runtime authority. Load requires the same retained context, physical device and agent, HIP ordinal, runtime instance, gfx942:xnack- target, executable, tiled_gemm_lds_v1 symbol, 1,024-byte static LDS, zero private and dynamic segments, grid 1, WG64/wave64, and the 48-byte explicit plus 256-byte implicit, 304-byte complete COV6 ABI. The artifact and borrowed A/B/C views remain owned through synchronous dispatch and validated completion; Completed retains only one terminal unload and Unloaded is inert."
      },
      {
        "type": "paragraph",
        "text": "The #100 terminal policy cancels a prepared dispatch and releases its queue and kernarg before executable unload when failure occurs before packet publication. Failures after proven quiescence and Loaded or Completed drop perform one checked unload. Adapter unwind, unload error, or ambiguous unload observation aborts. A post-submit queue error or completion deadline is process-terminal and retains submitted resources because GPU quiescence is unknown. FakeAdapter coverage for substitutions, cleanup, and process-terminal paths now lives in crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs."
      },
      {
        "type": "paragraph",
        "text": "The actual public protected route passed 1/1 in 14.36 seconds on mi300x gfx942 with HSA_XNACK=0, Worker ID fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db, and LLVM build upstream-llvmorg-22.1.8-ca7933e47d3a3451d81e72ac174dcb5aa28b59d1. It compared all 256 output bit patterns with the CPU reference, required A and B to remain unchanged, and checked all A/B/C guard canaries. The marker was FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0 finalizer=078e9b523164b679ff7af3b4e819ad041713c53c6841399ac7cea95090f09774 unload=df2f77ee798444a9e1fe5e27f219bdf720386eb8603a9a74fccc0df8efb3921c."
      },
      {
        "type": "paragraph",
        "text": "This is one exact bounded Slice 1 protected hardware observation, not compiler-origin authentication, Verus certificate consumption, MIR-to-Kernel-IR or Kernel-IR-to-LLVM/ISA refinement, a general proof of illegal-access or race freedom, generalized GEMM, or protected Slice 3/4 execution. The earlier observational IR-derived MI300X run remains a separate evidence layer."
      },
      {
        "type": "paragraph",
        "text": "Slice 3 begins at 5bc57587b458da6a77a0f1063e4697f846cc0946 with a fixed-K16 grid/stride source model. Verus reports 101 verified and 0 errors for padded lda/ldb/ldc bounds, injective workgroup-to-tile mapping, bounded lane stores, and global C ownership. Commit f38fe82ca574eff0eb273d5a793f04b0df3e00e1 separately lowers the exact M=64, N=48, K=16, lda=33, ldb=79, ldc=96, 3x4-grid graph through upstream LLVM 22. Its mi300x final-object inspection observes gfx942:xnack- COV6, WG64, workgroup X/Y, 1,024-byte LDS, one barrier, one BF16 MFMA, and no spills, scratch, calls, atomics, or COMGR. This remains IR-derived machine-shape evidence, not protected execution, hardware numerics, or compiler refinement."
      },
      {
        "type": "paragraph",
        "text": "Slice 4 at f24063534fd9c69d8c595608c75213db0570aa5e seals one exact tail-safe M=17, N=19, K=18 Kernel IR graph over a 2x2 WG64 grid. Two K16 phases zero-fill BF16 tails into reused XOR4 LDS, carry FP32 accumulators, use unconditional publish and reuse barriers, and predicate C reads and writes for alpha=2.0 and beta=-1.0. Commit 35575cc32cde9744078a3026b14c5e0e0066157f lowers only that graph through upstream LLVM 22. Clean mi300x inspection passed gfx942:xnack- COV6 with WG64, 1,024-byte LDS, zero private segment and spills, two static barriers, one static loop-body BF16 MFMA, and no scratch, calls, atomics, or COMGR. This is IR-derived machine shape, not attributed-source lowering, protected execution, hardware numerics, or compiler refinement."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Bounded execution is not production authority",
        "text": "Exact Slice 4 upstream LLVM/COV6 inspection (#86), canonical matrix Kernel IR V5 (#93), the attributed Slice 1 source-to-exact-descriptor/Worker-V2 boundary (#85), and the sealed authority-free exact-profile registry (#96) are complete. Exact direct LLVM/LLD API finalization (#97), exact generated host preparation (#99), and the one-shot Joined -> Loaded -> Completed -> Unloaded implementation (#100) are also complete. #100 now has both fake-adapter adversarial coverage and one exact protected mi300x measurement. Production certificate consumption (#91), K-phase/grid/edge proof extension (#92), semantic MIR-to-Kernel-IR refinement (#106), and Kernel-IR-to-LLVM/ISA safety correspondence (#107) remain open; protected Slice 3 and Slice 4 execution remains open in #88 and #89; and generalized dimensions, strides, tails, and coefficients remain open in #90 and #101 through #104. Evidence-site synchronization is tracked in fe2o3-kernels #2. Neither the protected Slice 1 measurement nor the separate IR-derived observation proves compiler origin, general illegal-access safety, race freedom, or source-to-machine refinement. The shared IEEE BF16/F32 numerical contract and oracle were completed in #109; authenticated compiler, proof, and machine refinement remain separate open obligations. No production source execution is claimed. No production source-to-HSACO or Verus authority is claimed."
      },
      {
        "type": "links",
        "items": [
          { "label": "#85 Source receipt to inert descriptor and Worker V2 (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/85" },
          { "label": "#86 Exact Slice 4 lowering (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/86" },
          { "label": "#87 Refinement and certificate consumption", "href": "https://github.com/harsh-nod/fe2o3/issues/87" },
          { "label": "#88 Protected Slice 3 execution", "href": "https://github.com/harsh-nod/fe2o3/issues/88" },
          { "label": "#89 Protected Slice 4 execution", "href": "https://github.com/harsh-nod/fe2o3/issues/89" },
          { "label": "#90 Generalized GEMM", "href": "https://github.com/harsh-nod/fe2o3/issues/90" },
          { "label": "#91 Production proof-certificate consumption", "href": "https://github.com/harsh-nod/fe2o3/issues/91" },
          { "label": "#92 K-phase, grid, and edge proof certificates", "href": "https://github.com/harsh-nod/fe2o3/issues/92" },
          { "label": "#93 Canonical matrix Kernel IR V5 (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/93" },
          { "label": "#94 Shared protected execution substrate (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/94" },
          { "label": "#96 Sealed exact-profile registry (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/96" },
          { "label": "#97 Exact direct LLVM/LLD finalizer (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/97" },
          { "label": "#99 Exact generated host adapter (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/99" },
          { "label": "#100 Protected lifecycle integration (closed)", "href": "https://github.com/harsh-nod/fe2o3/issues/100" },
          { "label": "fe2o3-kernels #2 Sealed-registry synchronization", "href": "https://github.com/harsh-nod/fe2o3-kernels/issues/2" }
        ]
      }
    ]
  },
  "gemm-tiling/general-contract": {
    "sectionId": "general-contract",
    "title": "Optimizing the executable baseline",
    "blocks": [
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Generic PLIRON safety passes are mandatory before lowering",
        "text": "The executable MFMA kernel constructs target-neutral ranked PLIRON and runs the mandatory workload-neutral safety sequence before Kernel IR lowering: tensor-layout and collective-participation verification, memory bounds, atomic legality, global race freedom, complete hierarchy ownership, barrier convergence, workgroup-memory must-initialization/publication by epoch, and declared semantic refinement. The implementation uses dialect operations, bounded sparse affine index dataflow, CFG traces, and memory effects; it contains no GEMM names, tile-size tests, or schedule recognizers. ThreadIndex/DisjointSlice dynamic access, runtime slice bounds, loops, branches, Tiled2D ownership, and matrix terminals are connected from ordinary safe Rust through LLVM and qualification launch. Unsupported effects and ownership forms still fail closed."
      },
      {
        "type": "paragraph",
        "text": "The current kernel already uses BF16/F32 MFMA with dynamic M/N/K, checked lda/ldb/ldc, runtime alpha/beta, multiple workgroups, a K loop, and edge handling. The remaining schedule optimization is cooperative LDS staging. Its compiler support must remain workload-neutral: generic effects, ownership, convergence, initialization, and bounds facts must justify LDS publication and reuse without recognizing matrix multiplication."
      },
      {
        "type": "table",
        "headers": [
          "Contract part",
          "Required rule"
        ],
        "rows": [
          [
            "Host preparation",
            "Use checked arithmetic. For nonempty regions require (M-1)*lda+(K-1) < len(A), (K-1)*ldb+(N-1) < len(B), and (M-1)*ldc+(N-1) < len(C), with lda >= K, ldb >= N, ldc >= N, valid aliases, and launch limits. Invalid dynamic values fail prepare() before launch; they are not Rust compile errors."
          ],
          [
            "Workgroup ownership",
            "Workgroup (gx,gy) owns rows 16*gy through 16*gy+15 and columns 16*gx through 16*gx+15 of C. Edge coordinates are inactive, and no two admitted workgroups may own the same active C element."
          ],
          [
            "Lane ownership",
            "For lane l in 0..64 and component c in 0..4, the MFMA C/D coordinate is local row 4*(l/16)+c and local column l%16. Equality of active store coordinates must imply the same workgroup, lane, and component."
          ],
          [
            "K phases",
            "The checked phase count is ceil_div(K,16). In phase p, lane l and component c own A(global row=16*gy+l%16, depth=16*p+4*(l/16)+c) and B(depth=16*p+4*(l/16)+c, global column=16*gx+l%16) load slots. Accumulators carry across every phase and are never reset inside the loop."
          ],
          [
            "Tails and initialization",
            "Every lane writes each owned LDS slot in every phase. An in-range global coordinate contributes its BF16 value; an out-of-range M, N, or K coordinate contributes defined BF16 +0. This makes all MFMA fragment reads initialized without issuing an out-of-bounds global access."
          ],
          [
            "Synchronization",
            "All 64 lanes execute an unconditional publish barrier after staging and an unconditional reuse barrier after consuming the phase. No lane-varying branch, early return, or expired LDS epoch may bypass either dynamic barrier instance."
          ],
          [
            "Epilogue",
            "Each active owner writes C[m,n] = alpha*acc[m,n] + beta*C[m,n] using the declared BF16/F32 numerical policy. M=0 or N=0 performs no dispatch; K=0 has an empty product and applies the checked beta*C epilogue to active outputs."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Keep the optimized source safe Rust",
        "text": "The optimization design uses compiler-issued lane/workgroup identities, global views, LDS phase states, barriers, MFMA fragments, and disjoint stores behind sealed linear capabilities. Ten safe UI fixtures attempt invalid uses and fail under rustc. Type, move, or visibility errors establish only the local API restriction; they are not fe2o3 semantic proof diagnostics and carry no 0x464701xx proof authority. Compiler and runtime internals may use narrowly scoped unsafe behind sealed capabilities, but unsafe never discharges or bypasses a verifier obligation."
      },
      {
        "type": "table",
        "headers": [
          "Branch property spelling",
          "Stable code",
          "What must be established independently"
        ],
        "rows": [
          ["memory_safe", "0x46470101", "Global and LDS accesses retain valid regions, provenance, alignment, lifetimes, and admitted alias relationships."],
          ["bounds_safe", "0x46470102", "Every executed A/B/C and LDS address is inside its recorded allocation or tile extent under its exact predicate."],
          ["initialized", "0x46470103", "Every global or LDS read observes a value initialized in the admitted phase and epoch."],
          ["race_free", "0x46470104", "Unordered conflicting accesses cannot overlap across workgroups, lanes, fragments, or LDS writers."],
          ["barrier_convergent", "0x46470105", "Every required workgroup participant reaches the same publish and reuse barrier instances."],
          ["output_region_injective", "0x46470106", "Each active C coordinate has exactly one workgroup/lane/component writer."],
          ["lds_epoch_correct", "0x46470107", "Publish orders current-phase reads and reuse orders next-phase overwrites; capabilities cannot outlive their epoch."],
          ["accumulator_phase_refinement", "0x46470108", "The accumulator covers exactly the completed K intervals and reaches the full mathematical product."],
          ["tail_refinement", "0x46470109", "M/N stores are predicated and invalid A/B/K loads become defined zero contributions."],
          ["epilogue_refinement", "0x4647010a", "The active store implements the recorded alpha/beta equation, including zero K."],
          ["numerical_contract", "0x4647010b", "BF16 conversion, FP32 MFMA accumulation order, rounding, exceptional values, and comparison policy are explicit."],
          ["machine_refinement_boundary", "0x4647010c", "The final covered LLVM/ISA boundary preserves the exact proven effects; source proof alone cannot promote it."]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Report/inventory code",
          "Implemented structural rejection"
        ],
        "rows": [
          ["0x46470001", "The report names a different obligation-set commitment."],
          ["0x46470002", "The report duplicates an aggregate or unsafe obligation."],
          ["0x46470003", "An unsafe-source obligation remains unresolved."],
          ["0x46470004", "Proof evaluation failed to return a complete bounded report."],
          ["0x46470005", "Reported unsafe findings do not match the compiler-owned inventory."],
          ["0x46470006", "Compiler-owned requirements do not bind the active request."]
        ]
      },
      {
        "type": "links",
        "items": [
          {
            "label": "#138 General tiled GEMM and semantic compile-fail corpus",
            "href": "https://github.com/harsh-nod/fe2o3/issues/138"
          },
          {
            "label": "#134 Rust-first Pliron compiler and proof architecture",
            "href": "https://github.com/harsh-nod/fe2o3/issues/134"
          }
        ]
      }
    ]
  },
  "gemm-tiling/mutation-diagnostics": {
    "sectionId": "mutation-diagnostics",
    "title": "Optimized schedule mutation diagnostics",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Canonical mutation",
          "Source enforcement",
          "Structured-KIR result",
          "Stage / code"
        ],
        "rows": [
          ["unguarded_a_tail_load", "Verifier-only; remains well-typed", "bounds_safe", "tile / 0x46470102"],
          ["unguarded_b_tail_load", "Verifier-only; remains well-typed", "bounds_safe", "tile / 0x46470102"],
          ["unguarded_c_tail_store", "Sealed-surface UI plus verifier", "bounds_safe", "tile / 0x46470102"],
          ["duplicate_lane_c_write", "Sealed-surface UI plus verifier", "output_region_injective", "tile / 0x46470106"],
          ["overlapping_workgroup_c_tile", "Sealed-surface UI plus verifier", "output_region_injective", "tile / 0x46470106"],
          ["duplicate_lds_write", "Sealed-surface UI plus verifier", "race_free", "gpu / 0x46470104"],
          ["lds_read_before_initialization", "Sealed-surface UI plus verifier", "initialized", "gpu / 0x46470103"],
          ["missing_publish_barrier", "Rust typestate UI", "initialized", "gpu / 0x46470103"],
          ["divergent_barrier", "Verifier-only; remains well-typed", "barrier_convergent", "gpu / 0x46470105"],
          ["missing_reuse_barrier", "Rust typestate UI", "lds_epoch_correct", "gpu / 0x46470107"],
          ["expired_lds_epoch", "Rust typestate UI", "lds_epoch_correct", "gpu / 0x46470107"],
          ["staged_read_before_wait", "Sealed-surface UI plus verifier", "initialized", "gpu / 0x46470103"],
          ["accumulator_reset", "Sealed-surface UI plus verifier", "accumulator_phase_refinement", "kernel / 0x46470108"],
          ["incorrect_k_tail_zero_fill", "Verifier-only; remains well-typed", "tail_refinement", "kernel / 0x46470109"],
          ["incorrect_alpha_beta_epilogue", "Verifier-only; remains well-typed", "epilogue_refinement", "kernel / 0x4647010a"]
        ]
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "A rustc UI error is not a proof diagnostic",
        "text": "All 10 companion UI fixtures use safe Rust. Three demonstrate that an invalid local phase transition is unrepresentable through the typestate API. Seven demonstrate that safe code cannot directly forge or duplicate a sealed capability, but each still names a remaining verifier obligation. These rustc type, move, or privacy diagnostics do not carry a fe2o3 0x464701xx property result and do not prove distributed bounds, initialization, injectivity, race freedom, or phase refinement."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "All 15 are rejected as structured KIR",
        "text": "Independently of the source UI tests, the canonical bounded structured-KIR suite constructs each of the 15 hostile schedules and rejects it with the exact property, owning stage, and code shown above. The proof-required compiler driver consumes those findings through its no-artifact transaction gate. This establishes structured-IR verification and driver gating, not authenticated source derivation of all 15 graphs."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "All 15 exact safe source mutations are diagnostic",
        "text": "The authenticated mutation-oracle corpus is a separate source layer. Each file forbids unsafe code, retains the valid_proof_sensitive root, and is byte-identical to the full baseline after reversing its one named edit. On MI300X, each individual managed release build reached optimized-MIR admission and failed at compiler preflight with the expected property, stage, 0x464701xx code, source span, terminal spans, reachable call chain, and an empty artifact directory. This is source-to-diagnostic evidence for the exact mutation corpus, not a proof result for the positive kernel."
      },
      {
        "type": "table",
        "headers": [
          "Owner-retaining layer",
          "Implemented result",
          "Authority boundary"
        ],
        "rows": [
          ["Executable direct-global MFMA source", "Compiles through ranked PLIRON, Kernel IR, gfx942 LLVM, HSACO, and qualification launch", "Four MI300X correctness cases pass and a matched HIP result is published; protected publication and complete refinement remain separate."],
          ["Cooperative-LDS positive source", "Runs canonical optimized-MIR structural analysis without issuing a positive receipt or frontend correspondence", "The historical selector exists for the proposed LDS schedule, but analysis fails closed until a closed verifier covers that safe-code root and reachable helper MIR."],
          ["Private final pair join", "Compiles and checks the source owner against verifier and post-link machine owners for the ordered reference and vectorized schedules", "It is unreachable because positive analysis stops before receipt, correspondence, configuration, and proof; public identities cannot reconstruct it."],
          ["Verus runtime closure", "Implements exact pinning and retention for the reviewed root-owned closure across the qualification boundaries", "It remains a second downstream blocker, but the current positive route never reaches configuration or proof execution."],
          ["Current MFMA qualification", "The safe direct-global MFMA kernel builds and passes four MI300X numerical cases", "This grants qualification evidence only; protected publication and cooperative LDS execution remain separate."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Historical LDS-family flags remain false",
        "text": "TILED_SOURCE_TO_IR=false, TILED_LOWERING=false, and TILED_PROTECTED_EXECUTION=false describe the historical cooperative-LDS source family in this mutation archive. They do not describe the current direct-global MFMA kernel, which compiles and runs. The mutation oracle remains useful negative evidence but does not transfer protected publication or LDS execution authority."
      },
      {
        "type": "paragraph",
        "text": "Dynamic values are not static compile-time facts. The current MFMA kernel validates strides and extents before any access, zero-fills edge fragments, and suppresses out-of-range stores; a protected host adapter should reject invalid preparation before launch. These runtime checks are distinct from rustc typestate errors and static fe2o3 diagnostics."
      }
    ]
  },
  "gemm-tiling/mapping": {
    "sectionId": "mapping",
    "title": "Map a wave to a tile",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Each 64-thread workgroup owns one 16x16 C tile. Lane l receives four BF16 A values and four BF16 B values from role-typed matrix views, then owns output rows 4*(l/16)+component at column l%16. The Tiled2D witness carries that unique workgroup, lane, and component mapping into every checked store."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Fallible views, total edge loads",
        "text": "Bf16MfmaAMatrix::row_major and Bf16MfmaBMatrix::row_major return Result because invalid offsets, extents, or strides cannot form a matrix view; ordinary kernel code propagates that boundary with ?. Once the view exists, load_m16k16 and load_k16n16 return role-typed fragments directly. A logical out-of-bounds coordinate or checked coordinate/address overflow contributes defined BF16 zero, so absence is data rather than an Option control-flow path. Kernel IR V7 still emits four exact guarded loads per fragment. Formal-memory admission proves that each true edge uses the same slice data, slice length, selected index, and index < length predicate; the selected false address offset is zero and supplies zero without a memory access."
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
            "16x16 C tile",
            "one workgroup",
            "the 2D grid maps each tile coordinate once"
          ],
          [
            "Four output elements",
            "one lane",
            "lane and component select unique local rows and one column"
          ],
          [
            "M, N, or K tail",
            "checked access",
            "loads become BF16 zero; stores outside logical C return None"
          ],
          [
            "Mutable C region",
            "Tiled2D witness",
            "generic race analysis proves disjoint physical addresses"
          ]
        ]
      }
    ]
  },
  "gemm-tiling/loop-proof": {
    "sectionId": "loop-proof",
    "title": "Walk the MFMA K loop",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Validate lda, ldb, ldc and the maximum addressed extent, then construct fallible row-major A and B views.",
          "Derive the workgroup tile; each role-typed view and the wave-lane capability determine the lane's four fragment coordinates.",
          "For each 16-wide K phase, directly receive A and B fragments whose guarded in-range reads supply BF16 values and whose false edges supply zero.",
          "Call the Matrix capability's multiply_accumulate method uniformly across the wave; the loop backedge carries typed FP32 components while a compiler-owned descriptor retains the exact instruction contract and current-wave provenance.",
          "Advance the phase by 16 until every dynamic K element is covered.",
          "Apply alpha * accumulator + beta * C once through each checked Tiled2D output witness."
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The mandatory safety pipeline does not recognize GEMM",
        "text": "The eight production ranked passes reason about tensor layout, bounds, atomics, race freedom, complete hierarchy ownership, barrier convergence, workgroup-memory epochs, and declared semantic refinement. One ephemeral manager shares sparse results, execution layout, and bounded traces across that ordered sequence. The same machinery analyzes softmax, attention, MoE, reductions, and any kernel expressible in the supported target-neutral operation and effect subset; unsupported or unresolved forms stop as Incomplete. Historical fixtures and qualification oracles may still describe specific workloads, but they grant no production safety authority. Matrix lowering only selects the target instruction after the generic obligations pass."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Why the dynamic tile is provable",
        "text": "Tiled2D is a compiler-authenticated ownership mapping, not a GEMM hint. Its checked witness embeds every active launch axis as an exact unit coordinate before applying the tile and lane transform, so the generic race pass can prove disjoint outputs for a runtime grid. An ordinary dynamic affine pointer expression gets no such exception, and any coordinate multiply or add that may overflow remains Incomplete."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The loop contract binds live CFG, not a workload name",
        "text": "The MIR/PLIRON gate enumerates every reachable natural backedge and requires one exact contract for each. The supported form has a unique preheader, an IndexLessThan header, a matching latch update, a distinct exit, and an exact transition identity that includes the complete ranked kernel. Static trip counts are recomputed. A dynamic loop needs the full u64 type bound and constant unit step; a narrower claimed bound is rejected until a production range receipt proves it. This establishes finite canonical control flow, not the GEMM product recurrence."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Numerical contract required",
        "text": "The qualification cases are exact for their chosen BF16 inputs, but they are not a universal numerical theorem. Production use still needs a stated input conversion, MFMA accumulation order, rounding and exceptional-value policy, and error bound."
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
        "text": "The bounded Slice 1 and Slice 2 models now cover bounds, current-epoch initialization, barrier participation, LDS ownership, disjoint stores, accumulator preservation, and exact-real products. Those results remain separate from the attributed source, inert final-HSACO, generated host-preparation, and runtime records. Completing #97, #99, and #100, including one exact protected Slice 1 measurement, does not join those layers. Closure still requires authenticated compiler origin, proof-certificate consumption, multi-phase source-to-machine derivation, machine-level illegal-access and race evidence, protected Slice 3/4 execution, and IEEE numerical refinement."
      }
    ]
  },
  "softmax-invariant/spec": {
    "sectionId": "spec",
    "title": "One wave owns one dynamic row",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The current safe Rust kernel maps one 64-lane wave to each row. Lane l owns columns l + 64 * iteration, so every lane participates in the maximum and sum reductions while output writes remain disjoint. Rows, logical columns, and both strides are runtime values, with a checked maximum logical width of 4,096 elements. Fallback loads supply negative infinity outside the logical row and checked row-striped stores leave output padding untouched."
      },
      {
        "type": "bullets",
        "items": [
          "Gfx942Collectives::subgroup_reduce_max_f32 and subgroup_reduce_sum_f32 lower to generic lane shuffles; softmax does not use MFMA because it contains no matrix contraction.",
          "RowStriped2D output ownership and ranked dynamic-index facts let the compiler admit bounds and disjoint writes without unsafe kernel code.",
          "DeviceMath::exp_f32 is collected and lowered as an ordinary device math operation in the same semantic pipeline.",
          "The current contract rejects empty rows and requires at least one finite active input; full NaN, infinity, subnormal, and all-masked semantics remain explicit numerical-policy work."
        ]
      }
    ]
  },
  "softmax-invariant/proof": {
    "sectionId": "proof",
    "title": "What the generic pipeline establishes",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Layer",
          "Claim"
        ],
        "rows": [
          [
            "Rust typing",
            "read-only input, disjoint row-striped output capability, checked stripe construction, and no unsafe kernel block"
          ],
          [
            "PLIRON verification",
            "ranked bounds, disjoint stores, uniform collective participation, and fail-closed unsupported effects"
          ],
          [
            "Lowering",
            "generic control flow, device math, and subgroup operations lower to gfx942 LLVM and HSACO"
          ],
          [
            "Qualification host",
            "four dynamic cases launch on MI300X, compare with an independent CPU oracle, and check untouched output padding"
          ],
          [
            "Remaining boundary",
            "the observations are not a universal numerical proof, complete IEEE/OCML refinement, or a performance result"
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "The compiler does not know this is softmax",
        "text": "The pipeline reasons about typed capabilities, ranked indices, effects, control flow, collective convergence, and target-neutral operations. It never matches a softmax name or loop pattern. The same checks therefore apply to any kernel expressible in the supported target-neutral subset; unsupported or unresolved forms stop as Incomplete. Numerical policy remains visible in ordinary Rust source and explicit input contracts."
      }
    ]
  },
  "flash-attention/online": {
    "sectionId": "online",
    "title": "Fuse scores without materializing them",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Each wave produces a 16-query tile. Target-neutral BF16 fragments contract Q with transposed K in 16-key tiles, and the gfx942 backend lowers those matrix operations to V_MFMA_F32_16X16X16_BF16. In one pass over key tiles, the kernel applies the additive mask and advances the stable online maximum, denominator, and V-weighted numerator. It writes FP32 output without recomputing or storing the score matrix."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Numerical invariant",
        "text": "For every active query row, each new tile maximum rescales the accumulated denominator and numerator before adding the current tile. Both states therefore range over the identical key prefix admitted by the additive mask. The final output is the masked weighted numerator divided by the masked exponential sum. Padding keys carry negative infinity in the mask and zero in K and V."
      }
    ]
  },
  "flash-attention/effects": {
    "sectionId": "effects",
    "title": "Separate matrix work from reductions",
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
            "QK tile",
            "BF16 fragments and MFMA accumulators",
            "dynamic depth tails contribute zero"
          ],
          [
            "Mask",
            "FP32 global read",
            "causal and padding policy is additive data, not compiler knowledge"
          ],
          [
            "Row maximum",
            "16-lane subgroup max",
            "all participating lanes execute the same collective"
          ],
          [
            "PV numerator",
            "scalar V loads and 16-lane sums",
            "current value dimension is runtime-bounded to 16"
          ],
          [
            "Output",
            "Tiled2D disjoint capability",
            "one owner per active query/output element and untouched stride padding"
          ]
        ]
      },
      {
        "type": "paragraph",
        "text": "Batch-head count, padded query and key lengths, depth, strides, scale, and additive mask are runtime values. The compiler verifies their generic indexed effects; it does not contain an attention recognizer. Grouped-query layouts, dropout, backward propagation, wider V tiles, and a matrix-accelerated PV contraction remain separate algorithm work."
      }
    ]
  },
  "flash-attention/closure": {
    "sectionId": "closure",
    "title": "What the MI300X qualification covers",
    "blocks": [
      {
        "type": "bullets",
        "items": [
          "Two cases cover key and query tails, multi-head and multi-tile launch geometry, non-multiple-of-16 depth, runtime strides, causal masks, and value widths 7 and 16.",
          "An explicitly selected FlashAttention qualification oracle performs source collection, generic PLIRON safety verification, Kernel IR lowering, gfx942 LLVM emission, HSACO finalization, host launch, and CPU-oracle comparison; its capability cannot complete or publish the production transaction.",
          "Disassembly confirms MFMA score contractions and subgroup shuffle reductions; no global score matrix is allocated.",
          "The result does not establish complete IEEE/OCML refinement, every legal shape, all-masked-row behavior, or performance parity with tuned FlashAttention libraries."
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
    "title": "One kernel serves every expert group",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The host packs each expert's selected token routes into a 16-row-padded matrix and launches the same safe Rust kernel for every nonempty group. Runtime arguments supply padded rows, reduction depth, output columns, all matrix strides, expert ID, and expert count. The expert ID selects a strided weight and bias region; it does not select a compiler path."
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "MFMA is an operation, not a workload label",
        "text": "Target-neutral matrix fragments express the token-by-weight contraction. The gfx942 backend selects V_MFMA_F32_16X16X16_BF16, while generic ranked bounds, sparse index facts, race analysis, and edge predicates verify the surrounding dynamic code. No pass recognizes GEMM or MoE."
      }
    ]
  },
  "moe-expert-compute/combine": {
    "sectionId": "combine",
    "title": "Apply the epilogue and return to token order",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The kernel computes gate * (projection + expert_bias) for every routed row. The host retains the route-to-token mapping, reads each expert result, and accumulates the two weighted routes into one token output in deterministic route order. Qualification uses 41 tokens, 4 experts, 82 routes, K=35, and N in {1, 15, 16, 17, 33}, covering partial and exact output tiles on both sides of the 16-column boundary."
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
            "stable host-owned packed row"
          ],
          [
            "Expert GEMM",
            "expert ID, packed row",
            "dynamic dimension, stride, and weight-region binding"
          ],
          [
            "Inverse",
            "slot to token/rank",
            "recover original token for each routed result"
          ],
          [
            "Combine",
            "token and ordered routes",
            "deterministic gate-weighted accumulation"
          ]
        ]
      }
    ]
  },
  "moe-expert-compute/bounded-evidence": {
    "sectionId": "bounded-evidence",
    "title": "Correctness and remaining limits",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The explicitly selected, nonpublishing grouped-expert qualification oracle collected the dynamic expert kernel, discharged 17 ranked index obligations, emitted gfx942 LLVM and HSACO, and executed the top-2 case on MI300X. Its capability cannot complete the production transaction. Every combined output matched an independent BF16-input/FP32-accumulation CPU oracle exactly, and output stride padding retained its sentinel."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Host scheduling is still explicit",
        "text": "The current example qualifies deterministic host-scheduled top-2 routing and one kernel launch per expert. It does not implement a device router, capacity overflow policy, persistent expert queue, fairness or liveness guarantees, or a performance comparison. The historical Verus tab remains useful for fixed-profile ownership obligations, but it is not presented as a proof of this dynamic executable kernel."
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
            "Which sequential Rust program is the reference?",
            "reference = path plus same-session monomorphized MIR identity"
          ],
          [
            "Do all owned GPU writes match its effects?",
            "proof.require_effect_refinement; ExactView may add hierarchy witnesses"
          ],
          [
            "Did the pinned Verus/Z3 closure prove this exact statement?",
            "policy-signed Ed25519 V2 execution receipt"
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
        "text": "CUDA and HIP can be checked by sanitizers, static analyzers, symbolic executors, model checkers, and external proof developments. fe2o3's design goal is a Rust-native single-source path where a safe Rust reference is selected by an ordinary function path, rustc supplies exact MIR identity, workload-neutral effects and hierarchy ownership are checked in the compiler, and proof, artifact, and runtime evidence carry explicit identities and fail closed when a join is missing."
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "No proof by branding",
        "text": "A Rust type, compiler attribute, manifest, signature, test, sanitizer result, or proof record is evidence at one boundary. A valid V2 signature authenticates an exact MIR/effect proof result; it does not prove later compiler stages or GPU execution. None alone establishes the complete kernel claim."
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
  },
  "read-the-evidence/semantic-correctness-milestone": {
    sectionId: "semantic-correctness-milestone",
    title: "Read the next theorem as a composition",
    blocks: [
      milestoneCallout(
        "The current aggregate gate combines non-vacuous output coverage, per-effect value equivalence, closed typed scalar semantics, exact canonical-loop structure, finite collective value contracts, retained proof evidence, and the complete live PLIRON identity. It does not prove arbitrary reference extraction, unsupported loop forms, target arithmetic, LLVM-or-later refinement, or runtime admission.",
      ),
      {
        type: "table",
        headers: ["Layer", "Question", "Fail-closed result"],
        rows: [
          ["Coverage", "Was every required output written exactly once as the final observable effect?", "Rejected hole, duplicate, overwrite, or unmodeled write; Incomplete unresolved domain"],
          ["Value", "Does each final value equal the safe Rust reference expression?", "Rejected typed-expression mismatch; Incomplete unsupported expression"],
          ["Composition", "Do reductions, recurrences, permutations, and collectives cover their declared domains?", "Rejected missing or duplicate contribution; Incomplete unsupported relation"],
          ["Loops", "Does every reachable backedge have one canonical finite induction contract?", "Rejected substituted bound, step, transition, or exit; Incomplete unsupported CFG or dynamic range"],
          ["Evidence", "Did the retained Verus run prove the exact compiler-derived obligation?", "Incomplete missing, stale, or wrong-boundary receipt"],
          ["Per-compilation composition", "Were generic conditional lemmas checked and their exact MIR, live PLIRON, relation, hierarchy, policy, receipt, and tool identities bound by production?", "Integrated before KIR lowering, but not a whole-kernel theorem; Incomplete when the subset, derived contract, evidence, or retained runtime is unavailable"],
        ],
      },
    ],
  },
  "gfx942-setup/semantic-gates": {
    sectionId: "semantic-gates",
    title: "Run semantic gates before target gates",
    blocks: [
      milestoneCallout(
        "The publication pin names the exact mandatory pre-lowering report, V5 evidence, aggregate report, and consumed functional proof. Target compilation and hardware qualification remain later, separate gates.",
      ),
      {
        type: "steps",
        items: [
          "Run generic positive, negative, and mutation suites without a GPU.",
          "Require every unsupported domain, expression, or collective relation to report Incomplete before lowering.",
          "Run the retained Verus runtime against the exact compiler-generated obligation.",
          "Only then run gfx942 compile, inspection, and hardware qualification as separate evidence layers.",
        ],
      },
    ],
  },
  "first-fill/total-output-coverage": {
    sectionId: "total-output-coverage",
    title: "From a safe write to a complete output",
    blocks: [
      milestoneCallout(
        "Fill is the smallest total-view example: the logical output domain must map onto all required coordinates, each coordinate must have one owner and one final write, and no other observable global write may escape the model.",
      ),
      {
        type: "paragraph",
        text: "Bounds proves that an executed access is inside an allocation. Race freedom proves that conflicting invocations do not overlap. Total coverage adds surjectivity: every required coordinate has an executed owner. Finality adds that the modeled value is not overwritten later. These are independent obligations.",
      },
    ],
  },
  "typed-vecadd/typed-arithmetic-contract": {
    sectionId: "typed-arithmetic-contract",
    title: "Type the expression and the numeric policy",
    blocks: [
      milestoneCallout(
        "Closed typed SSA preserves scalar type, signedness, width, operation, cast, comparison, select, overflow mode, definedness, and floating-point policy. The mandatory pass reconstructs and hashes the tree; a textual formula or opaque digest match is not enough.",
      ),
      {
        type: "table",
        headers: ["Contract", "Admitted meaning", "Still separate"],
        rows: [
          ["Exact bit-vector", "The same fixed-width integer expression under the named wrapping or checked-overflow policy", "Source-to-ISA preservation"],
          ["Checked arithmetic", "Overflow, division-by-zero, signed division overflow, invalid remainder, shift-range, and narrowing-cast preconditions are explicit", "A matching expression does not prove a trap is unreachable"],
          ["Exact IEEE-754", "The same typed floating operator symbols, rounding mode, and exceptional-value policy", "Operator congruence alone proves neither IEEE values nor target instructions"],
          ["Relaxed or error-bounded", "Only a proved tolerance relation", "No tolerance is inferred from a passing test"],
        ],
      },
    ],
  },
  "cpu-semantic-simulation/testing-is-not-proof": {
    sectionId: "testing-is-not-proof",
    title: "Use simulation as a counterexample tool",
    blocks: [
      milestoneCallout(
        "CPU semantic simulation can exercise domains and expose counterexamples, but it cannot establish universal coverage, arithmetic equivalence, or GPU refinement. The proof obligation remains quantified over the declared logical domain.",
      ),
      {
        type: "paragraph",
        text: "A useful workflow runs generated edge cases through the simulator and safe Rust reference before proof. A mismatch blocks the candidate immediately. Matching finite cases improve confidence in the specification and fixtures; only the compiler and Verus layers can discharge the universal obligation they explicitly model.",
      },
    ],
  },
  "verus-contracts/compositional-reference": {
    sectionId: "compositional-reference",
    title: "Prove reusable contracts, then compose them",
    blocks: [
      milestoneCallout(
        "The safe Rust reference owns workload intent. Verus proves workload lemmas over generic compiler facts such as total views, contribution sets, folds, recurrences, and permutations; compiler passes never recognize an algorithm name.",
      ),
      {
        type: "bullets",
        items: [
          "A pointwise lemma relates one final effect to one reference point.",
          "A coverage lemma lifts pointwise equality to the complete output domain.",
          "A fold or recurrence lemma relates parallel intermediate states to the sequential reference state.",
          "A permutation lemma carries identity through packing and inverse scatter.",
          "A numeric lemma states exact or bounded arithmetic semantics explicitly.",
        ],
      },
    ],
  },
  "memory-race-proof/finality-and-frame": {
    sectionId: "finality-and-frame",
    title: "Add finality and a complete frame condition",
    blocks: [
      milestoneCallout(
        "A total-output theorem must reject a correct intermediate write that is overwritten, an extra global write absent from the reference, and a required output that is never written, even when every individual access is in bounds and race-free.",
      ),
      {
        type: "table",
        headers: ["Property", "Positive fact", "Representative failure"],
        rows: [
          ["Uniqueness", "One final owner per coordinate", "Two invocations write the same output"],
          ["Surjectivity", "Every required coordinate has an owner", "Rounded grid omits a tail coordinate"],
          ["Finality", "The matched effect is the last observable write", "A later store replaces the proved value"],
          ["Frame", "All observable global writes are modeled", "A debug or scratch write escapes the declared effect set"],
        ],
      },
    ],
  },
  "compiler-checks/complete-correctness-catalog": {
    sectionId: "complete-correctness-catalog",
    title: "The additional generic rejection classes",
    blocks: [
      milestoneCallout(
        "These checks are in the mandatory workload-neutral PLIRON sequence; they are not optional GEMM helpers. Concrete violations are Rejected. Unsupported dynamic domains, source expressions, or proof relations are Incomplete and emit no lowering input.",
      ),
      {
        type: "table",
        headers: ["Generic check", "Rejects", "Needs a proof contract for"],
        rows: [
          ["Total view", "Coverage holes, duplicate final owners, overwritten matches, unmodeled global writes", "Symbolic or unbounded domains"],
          ["Typed expression", "Type, operator, cast, overflow, rounding, or exceptional-policy mismatch", "Unsupported calls, loops, or relaxed relations"],
          ["Arithmetic definedness", "A checked-overflow trap or invalid div, rem, shift, or cast precondition", "Symbolic preconditions outside the supported solver model"],
          ["Contribution domain", "Missing, duplicate, non-atomic, or out-of-domain contributions", "Reduction operator and final fold value"],
          ["Recurrence/permutation", "Wrong phase transition or non-bijective identity mapping", "Workload recurrence and permutation semantics"],
        ],
      },
    ],
  },
  "reductions-scans/contribution-domain": {
    sectionId: "contribution-domain",
    title: "Separate participation from reduction meaning",
    blocks: [
      milestoneCallout(
        "A generic contribution pass can prove that every declared participant contributes exactly once through a legal operation. The user specification must still name the operator, identity, order policy, and sequential fold it is meant to refine.",
      ),
      {
        type: "paragraph",
        text: "For associative exact arithmetic, a multiset contract may permit tree reordering. For floating point, order changes values, so the numeric contract must either retain the exact reduction tree or prove an explicit error bound. Atomic legality alone proves neither coverage nor the final reduced value.",
      },
    ],
  },
  "lds-barriers-atomics/final-observable-effect": {
    sectionId: "final-observable-effect",
    title: "Track epochs to the final observable effect",
    blocks: [
      milestoneCallout(
        "LDS initialization, publication, and barriers prove that intermediate reads are legal. Functional correctness additionally relates the final global effect to the reference and rejects later overwrites or unmodeled global effects.",
      ),
      {
        type: "paragraph",
        text: "Workgroup-local scratch is usually internal to the refinement boundary. Its epochs still matter because a bad publication can corrupt the final value. Global atomics require a declared contribution contract: exact participation, legal scope and ordering, a reduction relation, and a finalization policy are separate facts.",
      },
    ],
  },
  "gemm-tiling/composed-reference": {
    sectionId: "composed-reference",
    title: "Compose GEMM from workload-neutral contracts",
    blocks: [
      milestoneCallout(
        "The Sequential semantics tab states the desired safe Rust result. The compiler-facing vocabulary is workload-neutral: exact live loop and PLIRON identities, total outputs, typed roots, finite folds, hierarchy relations, final effects, and numerical policy. This reference remains Incomplete until those facts are admitted and joined for one compilation.",
      ),
      {
        type: "steps",
        items: [
          "Prove the workgroup, wave, lane, and fragment map is a bijection onto the active output tile.",
          "Relate each loop or MFMA phase to a prefix of the declared contribution fold.",
          "Relate the alpha/beta epilogue to the safe Rust point function.",
          "Lift point equality through total-view coverage and the no-unmodeled-effect frame.",
          "Bind any floating-point claim to the exact MFMA and epilogue numeric contract.",
        ],
      },
    ],
  },
  "gemm-proof-plan/total-correctness-boundary": {
    sectionId: "total-correctness-boundary",
    title: "What closes the functional theorem",
    blocks: [
      milestoneCallout(
        "Memory safety plus a per-effect equality theorem is not full functional correctness. The proof closes only when coverage, phase semantics, epilogue semantics, numeric policy, and complete observable frame are joined to the same kernel and reference identities.",
      ),
      {
        type: "bullets",
        items: [
          "The canonical finite-loop pass proves the supported phase-count structure; other loop forms still require a separate termination proof.",
          "MFMA layout proof relates lane fragments to a logical contraction; it does not name GEMM.",
          "The workload proof instantiates that contraction inside the K-fold.",
          "Source-to-Kernel-IR and Kernel-IR-to-ISA preservation remain separate authenticated refinements.",
        ],
      },
    ],
  },
  "softmax-invariant/composed-reference": {
    sectionId: "composed-reference",
    title: "Compose softmax from two reductions and a map",
    blocks: [
      milestoneCallout(
        "The Sequential semantics tab states the safe Rust result. The generic compiler vocabulary covers active-column contributions, max and sum folds, recurrences, hierarchy coverage, total output effects, and numerical policy without recognizing softmax. The current reference remains Incomplete.",
      ),
      {
        type: "paragraph",
        text: "The proof needs a max-reduction relation, a denominator-reduction relation, a nonzero or all-masked policy, and pointwise normalization. For exact IEEE claims it must retain operation order and exceptional behavior. For tolerant claims it needs a proved bound, not a hard-coded test epsilon.",
      },
    ],
  },
  "flash-attention/composed-reference": {
    sectionId: "composed-reference",
    title: "Treat online attention as a recurrence",
    blocks: [
      milestoneCallout(
        "The Sequential semantics tab states the safe Rust transition. Production can compose compiler-derived recurrence, typed-root, domain, hierarchy, effect, and output-frame facts without recognizing attention, but this reference remains Incomplete on slice reads, tensor summaries, hierarchy identities, and error-bound/reassociation evidence before its per-compilation proof can run.",
      ),
      {
        type: "steps",
        items: [
          "Define the safe Rust score, mask, online maximum, normalization sum, and value-accumulator transition.",
          "Prove each GPU phase consumes exactly the declared key tile and preserves the recurrence invariant.",
          "Prove the final normalized state equals the sequential reference row.",
          "Use total-view coverage for every query, head, and output component, with no unmodeled global write.",
        ],
      },
    ],
  },
  "moe-routing/composed-reference": {
    sectionId: "composed-reference",
    title: "Make routing a proved permutation contract",
    blocks: [
      milestoneCallout(
        "MoE routing math belongs in the safe Rust and Verus specification. The compiler only needs a generic relation proving that accepted route identities map bijectively to compact slots and that inverse scatter restores the declared token and route coordinates.",
      ),
      {
        type: "paragraph",
        text: "Top-k order, ties, capacity, dropped routes, sentinels, and stable rank are workload policies. Once specified, generic range, uniqueness, surjectivity, and inverse laws can be reused for sorting, transposes, sparse layouts, and other permutations.",
      },
    ],
  },
  "moe-expert-compute/composed-reference": {
    sectionId: "composed-reference",
    title: "Compose routing, expert folds, and combine",
    blocks: [
      milestoneCallout(
        "The Sequential semantics tab states the safe Rust composition. Grouped expert correctness needs generic routing permutation, canonical loops, per-expert folds, hierarchy coverage, total expert outputs, inverse scatter, ordered weighted combine, and total token outputs. No compiler pass recognizes MoE, and this reference remains Incomplete.",
      ),
      {
        type: "table",
        headers: ["Stage", "Generic compiler fact", "User theorem"],
        rows: [
          ["Pack", "Permutation is bounded and bijective", "Stable routing policy selects these routes"],
          ["Expert", "Each compact output has one final owner and matching fold", "Fold is the expert transformation"],
          ["Scatter", "Inverse mapping restores route identity", "Route belongs to the original token and rank"],
          ["Combine", "Each token output is final and total", "Ordered weighted sum matches safe Rust"],
        ],
      },
    ],
  },
  "evidence-pipeline/total-correctness-receipt": {
    sectionId: "total-correctness-receipt",
    title: "Retain the complete obligation through lowering",
    blocks: [
      milestoneCallout(
        "A clean helper result is insufficient. The mandatory report must retain coverage and semantic facts in the non-Clone lowering input, and the proof receipt must bind the exact normalized obligation, compiler subjects, tools, policy, and execution result.",
      ),
      {
        type: "steps",
        items: [
          "Construct coverage, expression, contribution, recurrence, and permutation obligations from authenticated IR.",
          "Fail closed before target lowering on Rejected or Incomplete results.",
          "Generate and retain the exact Verus obligation under bounded process control.",
          "Consume the receipt only in the originating compiler session.",
          "Carry the admitted report into lowering and bind later artifact and runtime evidence separately.",
        ],
      },
    ],
  },
  "what-verus-proves/total-correctness-boundary": {
    sectionId: "total-correctness-boundary",
    title: "State the theorem and its trusted joins",
    blocks: [
      milestoneCallout(
        "Verus can prove the generated mathematical obligation, including quantified coverage and compositional workload lemmas. It does not by itself prove that rustc extraction, PLIRON construction, target lowering, hardware arithmetic, or runtime inputs implement that obligation.",
      ),
      {
        type: "paragraph",
        text: "A defensible guarantee names the theorem, domain, numeric model, termination assumptions, extraction and lowering trust, proof toolchain, artifact identity, and runtime preconditions. The word arbitrary means arbitrary kernels expressible in the supported generic contracts, not arbitrary Rust or unbounded undecidable programs.",
      },
    ],
  },
  "evidence-archive/non-retroactive-milestone": {
    sectionId: "non-retroactive-milestone",
    title: "New proofs do not upgrade old evidence",
    blocks: [
      milestoneCallout(
        "Historical source, model, machine, and GPU records keep their original authority. A new total-correctness report or receipt cannot retroactively promote an artifact unless every required identity is joined and revalidated.",
      ),
      {
        type: "paragraph",
        text: "Keep historical records useful by treating them as bounded regression evidence. Publication of this milestone requires new exact compiler pins, proof identities, mutation results, and site evidence rather than rewriting the meaning of an earlier commit.",
      },
    ],
  },
  "exercise-ladder/semantic-correctness": {
    sectionId: "semantic-correctness",
    title: "Exercise the proof composition",
    blocks: [
      milestoneCallout(
        "Each exercise should name one generic compiler fact, one workload lemma, one negative mutation, and the remaining trusted boundary.",
      ),
      {
        type: "steps",
        items: [
          "Prove total fill coverage, then reject one missing tail owner and one later overwrite.",
          "Prove an exact wrapping-integer map, then reject a signedness or overflow-policy mismatch.",
          "Prove a reduction contribution domain, then add the fold theorem and mutate one duplicate contribution.",
          "Prove a bounded recurrence and mutate one phase transition.",
          "Prove a permutation and inverse, then compose it with a total output theorem.",
        ],
      },
    ],
  },
  "contributing-kernel/semantic-contract-checklist": {
    sectionId: "semantic-contract-checklist",
    title: "Add the semantic contract to every contribution",
    blocks: [
      milestoneCallout(
        "The exact manifest pin and mandatory diagnostics are now part of the acceptance gate. Contributors must also state which source, termination, numerical, lowering, artifact, runtime, and hardware boundaries remain unproved.",
      ),
      {
        type: "steps",
        items: [
          "Provide a local safe Rust CPU reference with an explicit logical domain and observable outputs.",
          "Declare exact bit-vector, exact IEEE-754, relaxed, or error-bounded numeric semantics without an implicit default.",
          "Prove loop termination and every checked-overflow, div, rem, shift, cast, indexing, and trap precondition required by the total-program claim.",
          "Describe reductions, recurrences, permutations, and collectives through generic contracts.",
          "Require total output coverage, unique final owners, finality, and a complete observable frame.",
          "Add positive proofs plus holes, duplicates, overwrites, unmodeled effects, arithmetic mismatches, and missing-receipt mutations.",
          "Record exact compiler report, receipt, source, proof, artifact, target, and runtime identities.",
        ],
      },
    ],
  }
} satisfies Record<NarrativeId, NarrativeRegistryEntry>);

// Keep reviewed narrative deltas explicit without repinning unchanged lessons.
const reviewedNarrativeFingerprints = deepFreeze({
  ...narrativeFingerprints,
  "read-the-evidence/differentiator":
    "e1873a4af9a5be85a19c85076924f286aa92a189ba6d15c00f95289e8f90ee5b",
  "read-the-evidence/scalar-gemm-checkpoint":
    "803a477c1d4b543fd6ed0336f1fcfd452b368ded53b05a6beddad1436fc70f87",
  "compiler-checks/catalog":
    "78088987ceb9742a9f82258471d599f3eaca34eb95200e043d0c67de55a397ea",
  "compiler-checks/production-path":
    "326e2d76dee5da308f46bc68551eeb0e8075f4d483885d42ed9c516550a3f53e",
  "what-verus-proves/proved":
    "2a78c253e95cbf6826428001cad64656d80dff375f62e471810ec1cbb0ae5876",
  "what-verus-proves/ecosystem":
    "75fb0827e574d4ee621bd93e00ac330f5f1903686447fddb000abfede72d1750",
  "compiler-checks/v7-simulation":
    "898a468386559cbe68838e52818e018378e26d0211fd568a946c298507b3d251",
  "gemm-tiling/public-layout-proof":
    "9cb4be57e0aff451d0e72b0129e2f1698fee55680e48d72e545bf06a8443d4d9",
  "gemm-tiling/mutation-diagnostics":
    "dfde97043d0ada591298d108a96ec048067a576fde51473c011ab8ffbc44e687",
  "gemm-tiling/mapping":
    "8b444ef89d0b6dc7c7c794da439308e8db4faa249b79f6190f72f51402db28d5",
  "gemm-tiling/general-contract":
    "61a6ca9ecff6e73815f5f3e83ef4c35eb4d813d1caea2892a254231c4189f3a2",
  "gemm-tiling/loop-proof":
    "0be13df58c55fda5a85306e39b36db21d83c3bfd67dcc4eff887cd50a4a6c25e",
  "gemm-proof-plan/evidence":
    "961353dad93a62fb2d79e63b2f0d738b7e37814346ab4d5f9113656a9c9edbff",
  "reductions-scans/scan":
    "60963f040ac2f5145bc906991ff12bbd2af10cdfc83bc74bce24f5b0c66ba4a8",
  "lds-barriers-atomics/atomics":
    "631bbb237c96f3dcc586e4a7c7a0d092a15f9e4e4466138bb57dda2ea25638a5",
  "softmax-invariant/spec":
    "33a9d720feac88f1e243fa8a9ba2f0338ca9296a6e5fbbbc404488111b8fd45f",
  "softmax-invariant/proof":
    "dd78a39bb530df4def497bbe7fa702256075f9f5a827ca0178f3946e27369e5f",
  "flash-attention/online":
    "535b3c1727e15ba539d244fe050a67d1a15ac6666e9e94e3814424895ee46f25",
  "moe-expert-compute/combine":
    "a34ce5fab5137ded8844cddd4a3efe522a96b1bed4638791c017b618def489c1",
  "read-the-evidence/semantic-correctness-milestone":
    "4fc9798f49d2817a03fa90607a78c02cb716b0ac5868d1491b910dfb30d6d3e6",
  "gfx942-setup/semantic-gates":
    "f1ac24d35d3d43cd9a0d05fa509238b90e3253fca570e601a30d8fe38ee951bd",
  "first-fill/total-output-coverage":
    "3b423a538424e662f2fa991cf545508d82cf187d9c860938e1c4a30aadf7ac52",
  "typed-vecadd/typed-arithmetic-contract":
    "25e05add778b293d17f6999b917dfe94bb13b42e76c83104bb1ffb4b9508e38c",
  "cpu-semantic-simulation/testing-is-not-proof":
    "fc5896fe3113629f2988ad8ea2e2f295746ec9d1367876513399d78d2bd30d4a",
  "verus-contracts/compositional-reference":
    "8b1e6427e413bb950e98672d916c92641a4a7e9c1021505c75e72299a2137ad5",
  "memory-race-proof/finality-and-frame":
    "e4749ba6bd05abfab2579068295a8334d365a1244b4b2c0aae292a9a0dcef8db",
  "compiler-checks/complete-correctness-catalog":
    "c344a2b21c92d01e260119a4f5f1bd2ced85f01a896ff96ea465ba1c6d6f6395",
  "reductions-scans/contribution-domain":
    "bb1264d027c8a474d28601b99cd940673dd515c5cdad71f50315c0d54b4311d4",
  "lds-barriers-atomics/final-observable-effect":
    "5086c1ffd515fe32d4208e45b72f9a18fd79f513ff6e2e6aad37f05429448cc9",
  "gemm-tiling/composed-reference":
    "100631f796f419ed42713b4004d787640239ce25f0e0f75b9e00896c3e55d561",
  "gemm-proof-plan/total-correctness-boundary":
    "204bf79168b536387c63919fcec3e493c4e07ea8fd1e2b258a9ad088ad753876",
  "softmax-invariant/composed-reference":
    "61260f61e0acc2560a1f85dd7e727956b65e3086bb916fcde9cade1c2991f28f",
  "flash-attention/composed-reference":
    "88f1f92e2cc025479a61c65b0939be82ccfc862288d30265a2fe5ae5862e5783",
  "moe-routing/composed-reference":
    "6156b1b7c4a938380085924d547c91301da9c4357e584cdedf9a8b48ad055f17",
  "moe-expert-compute/composed-reference":
    "0db8155428e7c12248fbb83042670258f6d5146bed45e8118a8896c09130237d",
  "evidence-pipeline/total-correctness-receipt":
    "9640393dfd64c4aee551e8d6936b24de8f78eefb9cf316782c618bbf84ab802f",
  "what-verus-proves/total-correctness-boundary":
    "3324c6fdabfe209d100933b67093c07d7f412b7061b3cfd1297d5a3340273491",
  "evidence-archive/non-retroactive-milestone":
    "3b59a16272edd3130789980f4507d09f27c981bc100814b9db3316d2b19961de",
  "exercise-ladder/semantic-correctness":
    "e25ae4e00e07f506abd32662b9f3ee57b2bdbfbc66e8ec5e725ab0ed8acc8bfb",
  "contributing-kernel/semantic-contract-checklist":
    "c49ff34b14b0f8072b5bebfa4322c0f099f93885fabef706c5c57a60ef84c275",
  "flash-attention/closure":
    "e2e278769f7ce11dbd7757806c13d4d7422200b8c863382f44b40e72e5304362",
  "moe-expert-compute/bounded-evidence":
    "f487bf7cb22e04e2a77c0591b65c9e104d552b0bc0e3282cb988456f51eead01",
} satisfies Record<NarrativeId, string>);

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
  return narrativeFingerprint(entry) === reviewedNarrativeFingerprints[value]
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
    if (
      narrativeFingerprint(candidate[id]) !== reviewedNarrativeFingerprints[id]
    ) {
      issues.push(`${id}: canonical narrative text drift`);
    }
  }
  return issues;
}

export { narrativeIds, narrativeOrderByLesson, stagedEvidenceLessonIds };
