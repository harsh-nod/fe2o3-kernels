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
        "text": "The checked-in publication gate requires commit 2039d269eb104527ff01b7345b67631bac860338, tree 5ac4ac7385bf9018efeadfb6cd231167b9259e08. Deployment remains gated until both harsh-nod/fe2o3@refs/heads/main and powderluv/fe2o3@refs/heads/main resolve to that exact commit and tree. Historical lesson evidence remains independently pinned: protected GEMM stays at c4fcb4d980cf979c0527dfa135a7b9f4fe72a811, tree c65c6ab567409afaaef6ea39c8befcac21d47119; Wave64 and synchronization Phase A source stay at d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8, tree cdec8448a300aa71d17565ca50fd4d893932f602; and 96b9890c3ad33ad8c6b4239a9b567728a176d65f, tree f911f0c693238830ad6070b2674fb863857bfec1, remains a historical audited public baseline rather than the current tip. The integrated checkpoint retains the bounded protected GEMM, Wave64, and workgroup-synchronization observations and the fixed row-softmax, FlashAttention, and MoE source, proof, compiler, finalizer, and typed-runtime layers under each layer's existing limits. Accepted W0 ancestor 9f40bbff39156f8b5f05868377ee12a2c4f74207, tree fd05530d3728aa928090b8e7beb372eaaf22b477, adds descriptor-sealed HostLinkClosureV1 and a genuinely static host LLD built from pinned upstream LLVM/LLD archives. Two fresh guarded MI300X builds produced the same 85,597,472-byte tool with SHA-256 7c1a7429e93896393eb743ed54ead78ec6d492e3ed887183e67737b3872d7bf9. This is measured/no-authority evidence: it grants no protected publication, broker or durable artifact handoff, runtime, load, launch, GPU, memory-safety, race-freedom, source-to-machine, or Verus-to-machine authority. Ancestor 66393d3ca7a6805633ed94e12c707a6d22bdf1ad adds only an inert Broker V4 protocol foundation. Every V4 value reports AUTHORITY=none; no production durable replay registry or runtime-owned session capability exists. W1 durability mechanics now have a bounded foundation, but durable anti-rollback and production authority remain open. Commit 43bd2a602b2ceb5a7079f85445dacd6dc8fe73c4 adds bounded source-model-to-canonical-Kernel-IR correspondence for the exact Wave64 profile: 38 tests pass with one existing hardware test ignored, Verus discharges 22 positive obligations, all eight expected-negative fixtures are rejected, and the checker records 4,359 deterministic mask observations. Its receipt omits the oracle and refinement-code hashes, KIR order is validated rather than operationally executed, and Verus relates internal mathematical definitions without computing SHA-256. It grants no source-to-model, compiler, LLVM/ISA, GPU, generalized safety or race-freedom, or parity authority. Commit b8daeb2bc953924a424542820bed566e52d57290 adds only an inert protected-service descriptor-admission foundation with AUTHORITY=none. Its 27 unit tests and two compile-fail doctests pass; two privileged/root-only positives remain ignored and unexecuted. It establishes no liveness, PID-reuse protection, endpoint exclusivity, storage provenance or anti-rollback, replay, host-link, publication, load, launch, runtime, or GPU authority. Commit e874da2083c2a1eb192048ea5f88a053c28d0ee2 adds accepted reviewed attributed-source structural correspondence for the exact Wave64 kernel: an exact syn AST gate precedes a fixed reviewed interpreter, 17,436 observations pass, and Verus adds 13 positive obligations plus six expected-negative fixtures. Both paths report proves_source_to_model_refinement=false. Independent review limits this to structural and model-internal/definitional correspondence: constants are not a verified SHA computation, the interpreter is fixed after AST admission rather than derived from source semantics, and no operational Rust semantics is proved. It grants no compiler, LLVM/ISA, artifact, GPU, generalized safety or race-freedom, protected-execution, or parity authority. Ancestor commit 4aed8d4d394783362e289a558b6d94cc28ecda36 adds the accepted static pre-exec containment foundation with AUTHORITY=none: a freestanding syscall-only _start, exact descriptor-object and process-control revalidation, exact descriptor closure, empty target environment, fixed one-element argv, and post-exec PDEATHSIG(SIGKILL) coverage. Fourteen tests and Cargo integration pass; three builds produced the same 17,488-byte static executable with SHA-256 db65ee057a8a9d10f8c8e54087e46c4d34c7040b5b34e1732c42da2872b91c52. The boundary still trusts the supervisor and inherited process state: a preattached ptrace tracer, CAP_SYS_PTRACE, or inherited seccomp user notification can invalidate checks; descriptor state is coarse rather than complete open-file-description or socket authority; parent-start provenance relies on trusted procfs mount state; and ordinary target exec resets dumpability. It grants no broker session or replay, publication, link, load, launch, runtime, GPU, or parity authority. Commit 4639ff36c8651a859495da86ea2c75e735377440, tree f0d91caaf705a7542135226c20cdb794dbc4f542, adds only the bounded external anti-rollback anchor protocol with AUTHORITY=none. Its canonical fixed-width advance and recovery challenges, strict Ed25519 verification against a caller-pinned key, and move-only state transitions make a commit observation constructible only after a valid signed proposed-head observation. It does not provide key provenance, durable nonce freshness, transport, persistence, a monotonic anchor implementation, protected-service integration, or atomic publication, and it promotes no parity or lesson evidence. Commit c703eaa271040b7c297e0d3b9ea8cc9fa470f327, tree c75b6cb9d70c6984bb375d09f095580eb2f7581a, isolates production-deadline Worker V2 ACK fixtures behind one exclusive process lane; this is a test-only determinism repair. Commit f4dcafb8b95345a5203a7f2c9886f9600345405f, tree 9eae0bfcbe6017fd16a02acdcb7b401f1dbd80df, makes examples/row_softmax_v1/src/kernel.rs the sole ordinary example-owned attributed source and adds complete syn AST structural admission before a fixed reviewed interpreter/model with digest and certificate binding. This is not Rust semantic refinement and grants no compiler/GPU causality, OCML/IEEE, runtime, memory/race, protected-dispatch, or parity authority. Commit 7139ccfd01e0ab8b0fc521613ac4356134d2e0c5, tree aef7f32c4dc3fe0087006e880cb535d8c8adaf1a, adds descriptor-relative durable prepared-session consume and recovery with AUTHORITY=none; anti-rollback, key provenance, hostile same-UID resistance, multiwriter coordination, cross-system atomicity, publication, runtime, and GPU authority remain absent. Commit 5a3f057b915b0cb21c3a0ac54094fd7e5e5ce6a4, tree 37dc2765f30c50f99a3fb3f5b8e56d03a511c33e, adds eight metadata-authoritative rustc-codegen shards covering all 19 current Cargo test targets exactly once plus a fail-closed aggregate. Local policy and isolated MI300X runs passed; at the then-current public tip 86c4ca67a673bfec966f79e6c701104db872d8ea, the complete powderluv/fe2o3 GitHub-hosted generic run, including all eight shards and the fail-closed aggregate, passed. The device code-object path remains pinned to upstream LLVM target-machine APIs plus in-process LLD, with no COMGR or shell GPU linker. The matrix remains 0 Complete / 97 Partial / 0 Missing / 12 N/A, with normative 0/82/0/12 and supplemental 0/15/0. No tutorial run/verify/evidence status or unrelated explanatory-source label changes, and Zero Missing records inventory coverage rather than cuda-oxide parity."
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
        "text": "Public commit d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8 contains the exact ordinary attributed source shown in the Kernel tab plus its CPU oracle, mutation tests, and bounded Verus model. Compiler collector/lowering, profile/descriptor construction, finalization, generated host/runtime launch, and protected gfx942 execution remain open, so this source-only milestone is not a functional hardware claim."
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
            "href": "https://github.com/harsh-nod/fe2o3/blob/d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8/examples/workgroup_sync_v1/src/scoped_atomic.rs"
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
        "text": "Exact Slice 4 upstream LLVM/COV6 inspection (#86), canonical matrix Kernel IR V5 (#93), the attributed Slice 1 source-to-exact-descriptor/Worker-V2 boundary (#85), and the sealed authority-free exact-profile registry (#96) are complete. Exact direct LLVM/LLD API finalization (#97), exact generated host preparation (#99), and the one-shot Joined -> Loaded -> Completed -> Unloaded implementation (#100) are also complete. #100 now has both fake-adapter adversarial coverage and one exact protected mi300x measurement. Production certificate consumption (#91), K-phase/grid/edge proof extension (#92), semantic MIR-to-Kernel-IR refinement (#106), and Kernel-IR-to-LLVM/ISA safety correspondence (#107) remain open; protected Slice 3 and Slice 4 execution remains open in #88 and #89; and generalized dimensions, strides, tails, and coefficients remain open in #90 and #101 through #104. Evidence-site synchronization is tracked in fe2o3-kernels #2. Neither the protected Slice 1 measurement nor the separate IR-derived observation proves compiler origin, general illegal-access safety, race freedom, or source-to-machine refinement. The shared IEEE BF16/F32 numerical contract remains open in #109. No production source execution is claimed. No production source-to-HSACO or Verus authority is claimed."
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
    "title": "Issue #138: the general safe-Rust contract",
    "blocks": [
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Generic PLIRON safety passes are mandatory before lowering",
        "text": "The production semantic-MIR route now constructs target-neutral ranked PLIRON and runs one fixed sequence before Kernel IR lowering: memory bounds, global race freedom, barrier convergence, workgroup-memory initialization/publication, and declared semantic refinement. These checks use dialect operations, bounded sparse index dataflow, CFG traces, and memory effects; they contain no GEMM names or schedule recognizers. Static ranked access and the checked ThreadIndex/DisjointSlice dynamic-access contract are connected from ordinary Rust through this verifier. Exact Rust CFG projection for barriers, workgroup memory, other dynamic pointer provenance, and source-declared equivalence remains fail-closed, so the corresponding examples below are honest textual PLIRON lit cases rather than claims of completed Rust source projection. Separately, the 15-case general-GEMM mutation oracle remains diagnostic-only and canonical positive GEMM correspondence remains blocked before receipt, proof, Worker, publication, or launch. SOURCE_TO_IR=false, LOWERING=false, and PROTECTED_EXECUTION=false remain the complete-family GEMM status."
      },
      {
        "type": "paragraph",
        "text": "The target is one ordinary #[kernel] Rust body for row-major BF16 A and B, FP32 accumulation and C, dynamic M/N/K, checked lda/ldb/ldc, runtime alpha/beta, multiple output workgroups, multiple K phases, and M/N/K tails. The first schedule stays conservative: gfx942:xnack-, wave64, one workgroup per 16x16 C tile, one 16x16x16 BF16 MFMA per K phase, single-buffered XOR4 LDS, and no vectorized, prefetched, double-buffered, or autotuned path."
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
        "title": "Safe source, sealed implementation",
        "text": "The #138 reference source uses safe Rust at the user boundary: compiler-issued lane/workgroup identities, global views, LDS phase states, barriers, MFMA fragments, and disjoint stores are exposed by a sealed linear companion surface. Ten safe UI fixtures attempt invalid uses of that surface and fail under rustc. Those type, move, or visibility errors establish only the local API restriction; they are not fe2o3 semantic proof diagnostics and carry no 0x464701xx proof authority. Compiler and runtime internals may still use narrowly scoped unsafe behind sealed capabilities, but unsafe never discharges or bypasses a verifier obligation."
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
  "gemm-tiling/semantic-failures": {
    "sectionId": "semantic-failures",
    "title": "Rust UI and semantic proof are different",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The safe companion contract assigns one honest source-enforcement owner to each canonical mutation. Three local lifecycle mistakes are fully rejected by Rust typestate. Seven more have safe rustc UI tests that reject attempts to escape the sealed surface, but those UI failures leave dynamic or cross-invocation verifier obligations. The remaining five are verifier-only: ordinary safe Rust can express them, so they must stay well-typed and reach proof-required compiler analysis."
      },
      {
        "type": "compile-failures",
        "heading": "Five generic compiler passes that stop unsafe IR",
        "intro": "Every example enters the same fixed workload-neutral PLIRON verifier sequence and stops before target lowering or artifact emission. The bounds example is exercised end to end from ordinary Rust semantic MIR: a checked dynamic access passes, while the static index 64 into extent 64 produces the diagnostic shown here. Race, barrier, workgroup-memory, and semantic-refinement examples are parsed textual PLIRON lit fixtures that exercise the mandatory production passes directly. Their Rust barrier/workgroup/semantic CFG projection is still deliberately fail-closed; the site does not claim those four source forms are connected end to end yet.",
        "examples": [
          {
            "id": "bounds_static_oob",
            "title": "Static out-of-bounds access",
            "source": "#[kernel]\nfn out_of_bounds(values: &mut [u32; 64]) {\n    values[64] = 1;\n}",
            "diagnostic": "error[FE2O3-BOUNDS-001]: statically out-of-bounds Write at block 0 op 2; access: %0 dimension 0; required: 64 < 64\n  --> Rust source ...:26:20\n  = ranked PLIRON before rejected lowering\n  = lowering stopped before target IR or artifact emission",
            "property": "MemoryBounds",
            "stage": "generic PLIRON pass 1/5",
            "code": "FE2O3-BOUNDS-001",
            "enforcement": "Rust production route and textual PLIRON lit",
            "caught": "The frontend preserves the array extent and constant index in ranked PLIRON. The bounds pass compares index 64 with extent 64, names the failed dimension and exact relation, maps it back to the Rust span, and terminates compilation."
          },
          {
            "id": "race_duplicate_output",
            "title": "Cross-invocation write race",
            "source": "%tid = kernel.invocation_index <0, 64>\n%zero = kernel.index_constant 0\nkernel.access Write %output[%zero]",
            "diagnostic": "error[FE2O3-RACE-001]: potentially conflicting incompatible Write/Write effects on %output[0]\nfirst writer/reader: invocation [0]\nsecond writer/reader: invocation [1]\nfailed proof: distinct concurrent invocations do not imply disjoint memory coordinates\nhelp: include an invocation-owned coordinate, use a disjoint view, or use a compatible atomic operation",
            "property": "RaceFreedom",
            "stage": "generic PLIRON pass 2/5",
            "code": "FE2O3-RACE-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "Every invocation writes coordinate zero. Sparse affine analysis cannot prove the output map injective, and exact bounded witness enumeration reports the first conflicting invocation pair. CUDA or HIP would normally compile this race."
          },
          {
            "id": "barrier_divergent",
            "title": "Invocation-divergent barrier",
            "source": "%tid = kernel.invocation_index <0, 4>\nkernel.cond_br %tid < 2, ^sync, ^exit\n^sync:\n  gpu.barrier Workgroup AcquireRelease",
            "diagnostic": "error[FE2O3-BARRIER-001]: divergent collective barrier trace; invocation [0] executes one workgroup barrier, while invocation [2] executes no barriers\nfailed proof: every participating invocation reaches the same barriers in the same order\nhelp: move the barrier out of invocation-varying control flow",
            "property": "BarrierConvergence",
            "stage": "generic PLIRON pass 3/5",
            "code": "FE2O3-BARRIER-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "The pass derives per-invocation CFG traces and compares collective barrier identities and order. Half the launch reaches the barrier and half bypasses it, so lowering is rejected before a possible GPU deadlock."
          },
          {
            "id": "workgroup_uninitialized",
            "title": "Workgroup read before initialization",
            "source": "%lds = kernel.ranked_view <32, true, [64], Workgroup>\n%tid = kernel.invocation_index <0, 8>\nkernel.access Read %lds[%tid]",
            "diagnostic": "error[FE2O3-WORKGROUP-001]: invocation [0] reads uninitialized workgroup address [0] at block 0 op 2\nfailed proof: the address is not initialized by this invocation and no convergent workgroup-memory barrier published a prior write\nhelp: initialize the address and publish it with a workgroup acquire-release barrier before the read",
            "property": "WorkgroupMemory",
            "stage": "generic PLIRON pass 4/5",
            "code": "FE2O3-WORKGROUP-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "The epoch analysis tracks writes, compatible atomics, and convergent workgroup publication. This read has neither a same-invocation initializer nor a published prior write, so the pass reports its invocation and address."
          },
          {
            "id": "semantic_mismatch",
            "title": "Declared formula mismatch",
            "source": "%actual = kernel.semantic_add (%alpha * %acc), %initial\n%required = kernel.semantic_add (%alpha * %acc), (%beta * %initial)\nkernel.require_equivalent %actual, %required",
            "diagnostic": "error[FE2O3-SEMANTIC-001]: declared semantic refinement failed at block 0 op 8\nactual expression `add(mul(s0,s1),s3)` is not equivalent to required expression `add(mul(s0,s1),mul(s2,s3))`\nhelp: preserve the frontend-declared target-neutral semantic formula",
            "property": "SemanticRefinement",
            "stage": "generic PLIRON pass 5/5",
            "code": "FE2O3-SEMANTIC-001",
            "enforcement": "Textual PLIRON lit; mandatory production pass",
            "caught": "The pass hash-conses the target-neutral expression DAG, normalizes commutative operand order without reassociating floating-point operations, and finds that beta times the prior value is missing."
          }
        ]
      },
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
          ["Positive production source", "Runs canonical optimized-MIR structural analysis without issuing a positive receipt or frontend correspondence", "The collected-general-gemm-v1 selector exists, but analysis always fails closed until a closed verifier covers the safe-code root and reachable helper MIR."],
          ["Private final pair join", "Compiles and checks the source owner against verifier and post-link machine owners for the ordered reference and vectorized schedules", "It is unreachable because positive analysis stops before receipt, correspondence, configuration, and proof; public identities cannot reconstruct it."],
          ["Verus runtime closure", "Implements exact pinning and retention for the reviewed root-owned closure across the qualification boundaries", "It remains a second downstream blocker, but the current positive route never reaches configuration or proof execution."],
          ["Protected hardware", "No qualified general-GEMM launch", "There is no protected dispatch, numerical GPU result, or production execution authority for the general kernel."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Complete-family flags remain false",
        "text": "Authenticated mutation-oracle compile-time rejection of all 15 exact source edits does not establish positive source-to-IR semantic refinement. SOURCE_TO_IR=false, LOWERING=false, and PROTECTED_EXECUTION=false remain the honest complete-family status. Canonical positive structural analysis fails before receipt or correspondence, and the downstream private final join remains unreachable; neither grants proof, artifact, publication, load, launch, numerical, performance, or GPU authority."
      },
      {
        "type": "paragraph",
        "text": "Dynamic dimensions, lengths, strides, aliases, or launch limits remain a third boundary: invalid host values fail checked prepare() under compiler-recorded preconditions. They are neither rustc typestate errors nor proof diagnostics for a static source mutation."
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
        "text": "The bounded Slice 1 and Slice 2 models now cover bounds, current-epoch initialization, barrier participation, LDS ownership, disjoint stores, accumulator preservation, and exact-real products. Those results remain separate from the attributed source, inert final-HSACO, generated host-preparation, and runtime records. Completing #97, #99, and #100, including one exact protected Slice 1 measurement, does not join those layers. Closure still requires authenticated compiler origin, proof-certificate consumption, multi-phase source-to-machine derivation, machine-level illegal-access and race evidence, protected Slice 3/4 execution, and IEEE numerical refinement."
      }
    ]
  },
  "softmax-invariant/spec": {
    "sectionId": "spec",
    "title": "Start from the attributed fixed row",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The sole ordinary example-owned source is examples/row_softmax_v1/src/kernel.rs at commit 86c4ca67a673bfec966f79e6c701104db872d8ea. The attributed V1 Rust kernel accepts one separate input and output, each exactly 64 f32 elements. Lane zero performs a 64-step maximum scan, a 64-step sum of DeviceMath::exp_f32(input[i] - maximum), and a 64-step normalization pass. V1 is unmasked and nonempty by construction; masking, batches, striding, and variable widths are different profiles, not implied features."
      },
      {
        "type": "bullets",
        "items": [
          "Source evidence fixes the complete ordinary #[kernel] body, typed slices, WG64 launch, and three bounded loops through exact syn AST structural admission.",
          "A fixed reviewed interpreter/model and digest/certificate bindings cover the admitted source and exact 64-element memory preconditions; they do not assign operational Rust semantics or observe a runtime launch.",
          "CPU evidence checks an independent finite reference and comparison policy; it does not execute HSACO.",
          "Numerical closure still requires explicit NaN, infinity, subnormal, OCML approximation, reduction-order, and error-bound semantics."
        ]
      }
    ]
  },
  "softmax-invariant/proof": {
    "sectionId": "proof",
    "title": "Keep the evidence layers separate",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Layer",
          "Claim"
        ],
        "rows": [
          [
            "Source/model review",
            "complete syn AST structural admission followed by a fixed reviewed interpreter/model and digest/certificate binding; no Rust semantic refinement"
          ],
          [
            "Verus",
            "mathematical and address-set obligations under explicit premises; no concrete memory-event model"
          ],
          [
            "Compiler/code object",
            "focused source-admission, direct upstream LLVM/LLD, and inspection mechanics; the pending release manifest and two-run gate are not published here"
          ],
          [
            "Typed host",
            "disjoint input/output leases and a linear Joined -> Loaded -> Completed -> Unloaded API, with production authority still failing closed before HSA load"
          ],
          [
            "GPU",
            "no protected dispatch and no numerical GPU result"
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Address separation is an obligation, not end-to-end race freedom",
        "text": "The structural gate and fixed interpreter/model bind reviewed syntax and a bounded abstract trace; they do not prove Rust semantic refinement. The Verus model proves bounded indices, checked row extents, and conditional distinct addresses, but it does not model the attributed source's concrete memory events, AMDGPU scheduling, visibility, or emitted machine accesses. DeviceMath::exp_f32 remains a separate OCML and IEEE numerical obligation. Compiler and GPU causality, runtime execution and precondition satisfaction, generalized memory safety and race freedom, protected dispatch, and cuda-oxide parity promotion all remain unproved."
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
  "moe-expert-compute/bounded-evidence": {
    "sectionId": "bounded-evidence",
    "title": "The bounded compact-plan and host bridge",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The exact E4/C4/routes16/width16/tile256 compact-plan model turns monotone expert offsets into bounded source and destination ranges, pairwise disjoint ordered destination ranges, an accepted-prefix union, and a defined zero tail. Verus reports 19 verified obligations, all seven expected-failure mutations are rejected, and a Rust checker exhaustively covers all 625 possible expert-count vectors."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "A consistent host snapshot is not router provenance",
        "text": "The host bridge validates the internal relation among caller-supplied top2 experts, requested and admitted counts, offsets, route slots, permutation, and inverse. It synchronously uploads offsets and inverse together and retains both immutable device regions; a gfx942 fixture read both arrays back exactly. It does not authenticate router completion or device readback, prove top2 selection from logits, bind route weights or packed activations, or grant compiler, finalizer, artifact, copy, load, dispatch, or expert GPU authority. The caller-supplied candidate can be checked again, so the resulting evidence has no freshness or replay authority."
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

// Keep progress-only narrative review deltas explicit without repinning lessons.
const reviewedNarrativeFingerprints = deepFreeze({
  ...narrativeFingerprints,
  "read-the-evidence/differentiator":
    "e1873a4af9a5be85a19c85076924f286aa92a189ba6d15c00f95289e8f90ee5b",
  "reductions-scans/scan":
    "dab200f8280efee5db8af14b89533457ca7fb2bddc77f0e3f69a0f3fdc59843a",
  "lds-barriers-atomics/atomics":
    "3d19c81e59e9d80814ce7a5792ae8bd281a6360d8bfbb28e07948e13106eca03",
  "gemm-tiling/public-layout-proof":
    "cb55340b23fed8480e93460f7ef6160258ed1e709a9688f214b54c989d248d0e",
  "gemm-proof-plan/evidence":
    "961353dad93a62fb2d79e63b2f0d738b7e37814346ab4d5f9113656a9c9edbff",
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
