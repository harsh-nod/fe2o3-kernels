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
import {
  semanticMilestoneBoundary,
  semanticMilestoneLessonBoundary,
} from "./semantic-correctness-milestone";

export interface NarrativeRegistryEntry {
  sectionId: string;
  title: string;
  blocks: LessonBlock[];
}

function milestoneCallout(text: string, fullBoundary = false): LessonBlock {
  return {
    type: "callout",
    tone: "boundary",
    title: "Semantic-correctness milestone",
    text: `${fullBoundary ? semanticMilestoneBoundary : semanticMilestoneLessonBoundary} ${text}`,
  };
}

function advancedScope(
  sectionId: string,
  title: string,
  sourcePath: string,
  familyBoundary: string,
): NarrativeRegistryEntry {
  return {
    sectionId,
    title,
    blocks: [
      {
        type: "table",
        headers: ["Integration field", "Current record", "Promotion requirement"],
        rows: [
          ["Rust source", `${sourcePath} and its independent safe Rust reference are mirrored exactly; the pinned commit and both SHA-256 values are recorded.`, "Identifies the exact source and oracle; it does not by itself establish lowering, execution, proof, or model equivalence."],
          ["Fixed shape", "Every extent and operator stage is copied from the final teaching suite.", "No dynamic-shape or production generalization."],
          ["Compiler and ISA", "Every Rust kernel has a dedicated runner for production extraction, authenticated Kernel IR, gfx950 LLVM, COV6 finalization, and symbol-scoped ISA inspection.", "A measured claim requires the runner's exact namespace plus LLVM and HSACO digests; the comparison-only HIP object grants no Rust authority."],
          ["Oracle and runtime", "Every Rust kernel has a named digest-pinned HSA harness test against an independent safe CPU reference, with poison, canary, immutability, metadata, and finite-output checks.", "GPU-observed authority exists only when the evidence record names the mi350 environment, numerical result, and tolerance for that exact Rust HSACO."],
        ],
      },
      {
        type: "callout",
        tone: "boundary",
        title: "Fixed-shape teaching boundary",
        text: `This lesson covers only the source-declared fixed shape after mirroring. ${familyBoundary} It makes no production serving, full distributed collective, formal-proof, performance, convergence, training-quality, or full-model-equivalence claim.`,
      },
      milestoneCallout(
        "This lesson exposes the ordinary Rust source, its independent safe CPU reference, and the per-kernel production Rust-to-gfx950 runner. Treat a kernel as GPU-observed only when its evidence record contains the exact namespace, LLVM and HSACO digests, ISA requirements, mi350 runtime observation, numerical result, and tolerance. No formal compiler-refinement receipt, performance label, protected publication authority, or full-model result is implied; HIP remains comparison-only.",
      ),
    ],
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
        "title": "Published semantic-correctness baseline",
        "text": "The checked-in publication gate pins compiler commit 308d8fa00fa41e098b2a1a47bbfea1bc29735464 and tree aee01674fefa733731db35eae1a1705b3286179e. Both public main refs must contain that exact commit, and the commit must resolve to that exact tree; deleted, rewritten, or divergent histories fail closed. Historical proof, compiler, finalizer, runtime, and MI300X records remain pinned to their own immutable commits and do not transfer authority to this gate. For its admitted finite subset, PLIRON proves and reconciles non-vacuous total coverage, separation, frames, schedules, and ordered-product identity; one generated Verus run separately replays each supported exact formula, and the private move-only join binds both to the exact MIR subjects and complete live PLIRON graph. It does not prove arbitrary source extraction or reference programs, unsupported loop forms, target IEEE values, LLVM-or-later refinement, artifact publication, launch behavior, hardware execution, or universal kernel correctness."
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
          "The KFD-first quickstart doctor reports direct-KFD topology; AMDGPU compiler tools and ROCgdb/rocprofv3 are separate optional facts."
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
          "Run bash scripts/quickstart.sh doctor, then run the ROCm compile lane with FE2O3_TARGET=gfx942.",
          "Inspect generated HSACO independently; artifact inspection is not application dispatch.",
          "Opt into hardware smoke only on the intended device host; this lane observes bounded KFD foundations and does not dispatch an application kernel."
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
        "text": "The current fill kernel is an ordinary no_std #[kernel] library target. The no-GPU quickstart exports it to an authority-free simulation bundle and executes that bundle on the CPU; the separate application stub fails closed before Worker V3 load or dispatch."
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
        "text": "The typed macro generates one lifetime-bound direct-KFD Arguments profile for the three f32 slices. The example test constructs GeneratedKfdReadSlice and GeneratedKfdReadWriteSlice capabilities from retained host borrows; the default fe2o3-host closure excludes fe2o3-core, HIP, HSA, and Worker V2 dependencies, while the deprecated HIP-buffer and HSA-lifecycle surface is qualification-only behind qualification-legacy-hip-hsa. The application entry point returns Unsupported because the production Worker V3 verifier is not wired; this binding evidence grants no artifact, load, or dispatch authority."
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
    "title": "Keep one production lowering",
    "blocks": [
      {
        "type": "paragraph",
        "text": "fe2o3-export-sim accepts an ordinary attributed Rust crate and reuses the sole production source, semantic MIR, ranked PLIRON, and target-neutral KIR stages. Extraction consumes that transaction immediately after exact KIR verification and publishes one private .fe2sim; it does not add a second importer or lowerer and never falls back from a hardware launch. fe2o3-kir-sim and fe2o3-debug then consume the exact embedded KIR and compiler-bound debug map without recompiling."
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
            "Production extraction",
            "Ordinary #[kernel] Rust, live rustc spans, semantic MIR ownership, ranked generic checks, and the same-session target-neutral KIR lowering.",
            "Unsupported source, checks, KIR V7 projection, multiple bodies, or source-map function identity fail before publication."
          ],
          [
            ".fe2sim admission",
            "One content-addressed bundle with exact extraction identities, target, KIR V8/V7 identities, kernel ABI, and optional bounded source map, plus one strict request.",
            "Symlinks, special files, mutation, oversize, duplicate or unknown fields, stale subjects, stale KIR, and map substitution fail closed."
          ],
          [
            "Semantic execution and replay",
            "Formal memory, exact scalar bits, cooperative barriers, integer atomics and fences, and a bounded runnable-invocation decision record.",
            "Unsupported operations, unavailable decisions, changed request or artifact custody, transcript drift, and every resource-limit violation fail before replay is accepted."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Bundle-bound is not compiler-authenticated",
        "text": "compiler_bundle_bound means the exact source map is committed to the verified bundle subject and canonical KIR identity. The extraction bundle explicitly records compiler_execution_binding=extraction_only_unavailable and authenticates_compiler_execution=false. It grants no proof, artifact, compiler, hardware, load, or launch authority; display paths are inert labels and source files are not reopened."
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "Persist the schedule, then replay it",
        "text": "The canonical or seeded schedule document binds exact KIR and bundle custody, request bytes, target, every simulator limit, context, transcript, coverage, seed, and each runnable local selection. Replay validates each decision against current semantic state. This makes the CPU counterexample reproducible; it neither describes nor predicts GPU wave, workgroup, queue, or compute-unit scheduling."
      }
    ]
  },
  "cpu-semantic-simulation/evidence-boundary": {
    "sectionId": "evidence-boundary",
    "title": "Read the result as an exact observation",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The checked-in production capture starts from barrier_before_access in an ordinary attributed Rust crate. Its bundle contains KIR identity 33d3bc2d6bdc307283bb148c726cd20ccbdd38ed78e265a1d96bad290a158edc over 1,187 canonical bytes. The request visits one WG64, crosses one barrier release, commits one f32 value as exact bits 0x3f800000, and records two runnable selections. Canonical record and replay produced byte-identical result JSON."
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
        "title": "Observation begins at KIR",
        "text": "The .fe2sim commits the compiler-emitted source map and exact KIR into one local content identity, so the debugger can associate source and KIR sites without reopening source files. The simulator's behavioral observation still begins at verified KIR: bundle association provides local source/KIR correlation but no source-to-KIR refinement, compiler-correctness proof, race-freedom proof, LLVM or ISA validation, GPU equivalence, timing, profiling, or performance prediction."
      },
      {
        "type": "table",
        "headers": [
          "Debugger surface",
          "Implemented now",
          "Typed boundary"
        ],
        "rows": [
          [
            "CPU semantic session",
            "Thread, logical Wave32/Wave64, workgroup and dispatch hierarchy; KIR/source breakpoints; allocation watchpoints; SSA and memory; captured stacks; source resolution and stepping; exact schedule replay.",
            "Logical waves are visual partitions, not decoded hardware wavefronts. Raw-KIR sessions correctly report source as unavailable."
          ],
          [
            "Direct-KFD hardware V3",
            "ptrace/pidfd target ownership, redacted generation-aware device and queue snapshots, bounded runtime/exception events, suspend, address-free stopped-queue envelope capture, resume and terminate. The MI300X path observes eight sequential gfx942 XCC CPU-shadow headers while retaining suspension.",
            "The headers are not one atomic checkpoint. Inner hardware wave/lane state, native registers, CWSR record decoding, target memory, source/KIR stepping and hardware replay remain unavailable."
          ],
          [
            "Agent contract",
            "Strict bounded versioned JSONL, revision and configuration identities, pagination generations, explicit effect classes and unavailable responses without eval strings or raw GPU addresses. The composite workbench keeps direct-KFD, generic ROCgdb/MI and Profiler Bundle V4 evidence separate. Seeded simulation retains canonical replay schedules and byte-level race, no-race, or incomplete evidence.",
            "Authenticated GPU wave identity, ATT decoding, source/ISA correlation, complete hardware timelines and automated causal diagnosis remain open work."
          ]
        ]
      },
      {
        "type": "table",
        "headers": [
          "Workflow",
          "What it is strongest at",
          "How fe2o3 differs today"
        ],
        "rows": [
          [
            "fe2o3 semantic debugger",
            "Deterministic no-GPU execution, exact schedule replay, logical thread/wave/workgroup hierarchy, compiler-bundle-bound source/KIR sites, allocation-relative state, and bounded evidence-linked JSONL.",
            "The distinctive value is retained compiler semantics and agent-readable counterexamples. Direct KFD now adds bounded outer stopped-queue evidence, but authenticated native wave/register state remains unavailable."
          ],
          [
            "ROCgdb",
            "Stopped physical GPU state, native wavefronts, registers, memory, source breakpoints, and target execution control where supported.",
            "ROCgdb remains the hardware-debugging substrate. The current strict MI integration admits generic threads and process control without treating target text as GPU-wave proof; future trusted correlation must preserve both evidence origins."
          ],
          [
            "rocprofv3 and compute viewer",
            "Measured runtime traces, counters, PC samples, ATT/thread trace, ISA correlation, and performance timelines.",
            "Those tools remain the profiling substrate. fe2o3 now orchestrates bounded authorized rocprofv3 capture and strictly imports dispatch metadata plus ATT references into Profiler Bundle V4, preserving observed, declared, inferred, and unavailable origins. It does not yet authenticate source/ISA correlation or decode ATT timelines."
          ],
          [
            "Native HIP or Mojo workflow",
            "The language and vendor toolchain's supported compile, launch, debugger, and profiler path on physical hardware.",
            "fe2o3 currently exposes source/KIR/schedule identities and deterministic CPU replay as first-class bounded records. Comparable toolchains can add similar metadata, so broader superiority is not claimed."
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "info",
        "title": "Current milestone: replayable interleavings, logical waves, and exact scalar bits",
        "text": "The simulator covers bounded structured scalar control flow and internal calls; booleans and fixed-width integers; D1-D3 launch queries; private, typed global, and static scalar workgroup memory; cooperative barriers; admitted integer atomic kinds, legal orderings and scopes; and explicit fence order points. Seeded exploration sweeps an explicit schedule budget and retains at most one canonical replay witness for race, no-race, and incomplete outcomes without claiming schedule-space exhaustion. Full-active logical Wave32/Wave64 lane ID, ballot, any, all, and integer shuffle-index collectives are exact; partial or divergent participation fails with structured masks and KIR sites. F16, BF16, F32, and F64 constants, memory, arithmetic, comparisons, selects, casts, integer conversions, fused multiply-add, rounding, and BF16x2 use pinned software floating-point semantics and preserve exact bits rather than host floating arithmetic."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Unsupported semantics fail closed",
        "text": "Unsupported scalar math such as sqrt, sin, cos, exp and log, float atomics, wave reductions/scans and matrix operations, dynamic or non-scalar workgroup memory, gfx950 LDS transpose, unresolved external calls, memory intrinsics, and inline assembly remain typed unsupported. Explicit Source Map V2 export retains exact unchanged KIR parameters; moved, mutated, dropped, storage-reset, mutably aliased, projected, local, and composite values stay typed unrepresented. Default and explicit V1 remain byte-compatible and do not inspect V2 metadata. V1 emits the final rustc call site rather than a macro expansion stack; synthetic KIR has no fabricated source; helper or multi-body maps fail until correspondence carries exact KIR function identity. No result establishes source-to-KIR refinement, compiler correctness, race freedom, LLVM or ISA behavior, GPU equivalence, timing, profiling, or performance prediction."
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
    "title": "From safe Rust to checked Kernel IR",
    "blocks": [
      {
        "type": "paragraph",
        "text": "fe2o3 keeps one workload-neutral route: rustc checks ordinary safe Rust and retains semantic MIR, the compiler projects a typed ranked PLIRON function, checked normalization and the fixed nine-pass verifier sequence run there, and only the admitted result can become canonical Kernel IR. ProductionMiddleEndEvidenceV5 is the sole live middle-end evidence producer. The retired standalone lowering and bridge packages are deleted rather than dormant. No pass recognizes GEMM, softmax, attention, routing, or another workload name."
      },
      {
        "type": "steps",
        "items": [
          "rustc enforces local types, borrows, moves, lifetimes, visibility, and the safe kernel boundary while preserving checked control flow and source locations in MIR.",
          "The frontend projects structured CFG, typed values, ranked views, allocation provenance, index expressions, memory effects, tensor contracts, and synchronization into ranked PLIRON.",
          "Target-aware validation first performs a bounded structural preflight. It accounts the closed ranked function before recursive PLIRON verification, contains verifier failures, and reports malformed, nested, or resource-exhausting input as FE2O3-TARGET-000 before scanning launch-contract facts.",
          "The ranked constructor folds only checked index Add, Multiply, Divide, and Remainder when both operands are exact preceding index constants. An independent exact typed structural replay accepts only the same-site IndexBinary to IndexConstant rewrite with the same result identity and checked u64 value.",
          "After structural and target preconditions, the fixed nine analysis stages check tensor layout, bounds, atomics, races, hierarchy ownership, barriers, staged pipeline protocol, workgroup memory, and declared semantic refinement.",
          "KIR lowering consumes the normalized ranked recipe and its checked reports. Rejected and Incomplete results stop before KIR. The retired standalone AMDGCN/PLIRON-to-LLVM and KIR/PLIRON bridge packages are absent, so no alternate host, lowering, or simulation route bypasses this sequence."
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "One live evidence version",
        "text": "V5 is the sole live middle-end evidence producer and records the fixed nine-pass result. The pipeline-protocol report is ordered after barrier convergence and before workgroup-memory verification. The V4 decoder is archival-only: it can validate the canonical shape of historical bytes but cannot create live evidence or grant refinement, lowering, artifact, or launch authority. The caller-declared ProductionReferenceProofV1 and RequireReferenceEquivalent API has been removed; a declaration can no longer masquerade as an authenticated refinement result."
      },
      {
        "type": "paragraph",
        "text": "Same-TyCtxt descriptor identity hardens substitution checks. For authenticated production projection, checked tiled and row-striped operations now retain their source-derived index, success path, receiver extent, dominance, provenance, and launch-coordinate relation into live race analysis and KIR lowering. Hand-authored raw or textual carriers without that custody still fail closed."
      },
      {
        "type": "table",
        "headers": ["Compiler result", "What it means", "Current boundary"],
        "rows": [
          ["Rejected", "The compiler reconstructed a concrete contradiction, such as a static out-of-bounds index, incompatible tensor layout, collision, or divergent collective.", "The diagnostic names the failed relation and proposes a source-level repair; no KIR lowering input is issued."],
          ["Incomplete", "The bounded analysis cannot prove or refute the required property, or its independent witness replay does not support that shape.", "Compilation fails closed. Missing evidence is never treated as a runtime check or a Clean result."],
          ["Clean report", "The policy pass found no failure in its supported model.", "Report integrity alone is not semantic authority. The matching independent witness must also be Complete where the production gate requires it."],
          ["Complete raw replay", "A separate checker rebuilt the supported obligation directly from the exact live PLIRON and matched the sealed report.", "Today this is only the single-block static bounded-access fragment with finite unique invocation dimensions and exact agreement with any retained execution layout. Nonempty tensor and all other pass witnesses remain Incomplete."],
          ["Checked transform", "The before and after typed recipes satisfy the independently replayed constant-fold relation.", "One exact input clone and the moved receipt-owned output provide private typed custody. Canonical hashes are labels only."]
        ]
      },
      {
        "type": "table",
        "headers": ["Example", "Current compiler reasoning", "Fail-closed edge"],
        "rows": [
          ["Static bounds", "A single-block finite launch replays every supported index from its unique invocation dimensions and checks any retained execution layout against that complete inventory.", "Dynamic or duplicate dimensions, layout mismatch, missing active axes, unsupported arithmetic, machine overflow, or an exhausted replay cap is Incomplete."],
          ["Dynamic race freedom", "Explicit affine maps and bounded Presburger replay prove nonintersection. Authenticated checked tiled and row-striped recipes additionally bind the index, success path, physical extent, provenance, dominance, and launch coordinates needed to prove active stores injective.", "Unknown aliases, unsupported maps, missing custody, malformed pairing, or exhausted resource bounds fail closed before KIR."],
          ["Tensor flow", "The policy pass can reject incompatible wave64 producer and consumer layouts.", "Every nonempty independent tensor replay is Incomplete until external roots have explicit operational-SSA provenance."],
          ["Loop progress", "The checker supports canonical single-entry multi-block forwarding SCCs with i < bound and one positive constant latch step.", "The exact source integer width and the ranked u64 update must both be nonwrapping; other SCC shapes remain Incomplete and concrete nontermination is Rejected."],
          ["Staged workgroup pipelines", "A generic epoch summary proves stage, commit, wait, consume or discard, release, modulo ring-slot selection, and release-before-reuse across dynamic prologue, steady-state, and drain regions.", "Unknown aliases, nonuniform bounds, crossing loops, wrong epochs or slots, early reads, late writes, and incomplete drains are Rejected or fail closed as Incomplete."],
          ["Constant folding", "5 + 7 and a later checked multiply can fold to exact constants in one forward fixed point before every verifier and proof digest.", "Overflow and zero divisors stay unfurled and fail existing verification; no reassociation, cross-block definition, or dynamic propagation is authorized."],
          ["GFX950 collectives", "Semantic MIR V6 and Kernel IR V9 selection follows live collective and LDS-transpose operations. Under the exact gfx950:xnack- full-active Wave64 profile, FP32 reductions accept every nonzero power-of-two tile width through 64.", "Unsupported widths, targets, profiles, and dynamic broadcast source lanes fail closed. Successful target selection or lowering grants no source-to-KIR refinement, artifact, launch, or numerical authority."]
        ]
      },
      {
        "type": "compile-failures",
        "heading": "Representative compile-time rejections",
        "intro": "Each example is workload-neutral and stops before KIR. The repair is a source change, never an automatic semantic rewrite. Pipeline diagnostics use the same safe Rust API in GEMM, attention, or any other staged kernel.",
        "examples": [
          {
            "id": "static_oob",
            "title": "Static out-of-bounds access",
            "language": "rust",
            "source": "let value = input[64]; // input: &[f32; 64]",
            "diagnostic": "error[FE2O3-BOUNDS-001]: access dimension 0 requires 64 < 64; help: use an index below 64 or change the declared extent",
            "property": "RankedBounds",
            "stage": "kernel-memory-bounds-v1",
            "code": "FE2O3-BOUNDS-001",
            "enforcement": "static bounded raw replay and ranked-bounds policy",
            "caught": "The exact constant index and extent contradict the required bound, so the compiler reports the failed relation at the access."
          },
          {
            "id": "dynamic_collision",
            "title": "Cross-invocation write race",
            "language": "text",
            "source": "two active invocations write output[0]",
            "diagnostic": "error[FE2O3-RACE-001]: incompatible writes collide at coordinate [0]; help: use a compiler-authenticated injective ownership mapping",
            "property": "CrossInvocationRaceFreedom",
            "stage": "kernel-race-freedom-v1",
            "code": "FE2O3-RACE-001",
            "enforcement": "generic Presburger relation and bounded counterexample replay",
            "caught": "The race pass reconstructs the conflicting invocation pair. An explicit affine or bounded Presburger map can prove injectivity; authenticated checked tiled and row-striped maps use the same generic relation with source-derived success, extent, provenance, and launch facts."
          },
          {
            "id": "tensor_layout_flow",
            "title": "Incompatible tensor producer and consumer layouts",
            "language": "text",
            "source": "a rooted tensor result is consumed with a different role or register map",
            "diagnostic": "error[FE2O3-TENSOR-LAYOUT-005]: result-root layout is incompatible with the consumer; help: select a compatible instruction or add an authenticated conversion",
            "property": "TensorLayoutDataflow",
            "stage": "kernel-tensor-layout-v1",
            "code": "FE2O3-TENSOR-LAYOUT-005",
            "enforcement": "rooted tensor-layout policy dataflow; independent nonempty replay remains Incomplete",
            "caught": "The compiler follows the exact result root and rejects a consumer contract that disagrees with its producer."
          },
          {
            "id": "pipeline_read_before_consume",
            "title": "Pipeline read before consume",
            "language": "rust",
            "source": "pipeline.stage(epoch);\npipeline.write(epoch, lane, value);\npipeline.commit(epoch);\npipeline.wait(epoch);\nlet value = pipeline.read(epoch, lane); // missing consume(epoch)",
            "diagnostic": "error[FE2O3-PIPELINE-001]: Read access occurs while the epoch is Ready; help: call consume(epoch) after wait(epoch) and before reading",
            "property": "PipelineProtocol",
            "stage": "kernel-pipeline-protocol-v1",
            "code": "FE2O3-PIPELINE-001",
            "enforcement": "generic pipeline lifecycle and ranked-access correlation",
            "caught": "The pass correlates each workgroup-memory read with its owning pipeline and requires the epoch to be in its consuming window."
          },
          {
            "id": "pipeline_missing_drain",
            "title": "Dynamic pipeline loop without a drain",
            "language": "rust",
            "source": "pipeline.stage(0);\npipeline.write(0, lane, first);\npipeline.commit(0);\nfor epoch in 0..tiles {\n    pipeline.stage(epoch + 1);\n    pipeline.write(epoch + 1, lane, next);\n    pipeline.commit(epoch + 1);\n    // consume and release epoch\n}\n// missing wait/discard/release for the speculative final epoch",
            "diagnostic": "error[FE2O3-PIPELINE-001]: dynamic schedule is missing its required drain events; help: wait, discard, and release every speculative epoch after the loop",
            "property": "PipelineProtocol",
            "stage": "kernel-pipeline-protocol-v1",
            "code": "FE2O3-PIPELINE-001",
            "enforcement": "epoch-aware canonical-loop summary across prologue, steady-state, and drain blocks",
            "caught": "The compiler summarizes the dynamic loop instead of unrolling it, then proves that every primed or prefetched epoch reaches exactly one terminal release."
          },
          {
            "id": "pipeline_nonuniform_bound",
            "title": "Workgroup pipeline with a divergent trip count",
            "language": "rust",
            "source": "let tiles = thread::index_1d().get();\nfor epoch in 0..tiles {\n    // workgroup-wide stage, commit, wait, consume, release\n}",
            "diagnostic": "error[FE2O3-PIPELINE-001]: runtime loop bound is not proved workgroup-uniform; help: derive the trip count from a uniform kernel argument or move lane-varying work outside the collective pipeline",
            "property": "PipelineProtocol",
            "stage": "kernel-pipeline-protocol-v1",
            "code": "FE2O3-PIPELINE-001",
            "enforcement": "uniformity dataflow joined with the epoch-aware loop summary",
            "caught": "A workgroup pipeline is collective. Different lanes cannot execute different epoch counts, so the shared uniformity analysis rejects a lane-derived bound."
          }
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "One completed witness is not universal correctness",
        "text": "Each completed analysis validates one exact ranked function and checkpoint. It does not by itself prove arbitrary MIR projection, numerical intent, LLVM or ISA semantics, protected artifact identity, or universal hardware behavior. The qualified GEMM and attention results compose the supported compiler checks with one actual code-object build, launch, and CPU-oracle comparison; unsupported witnesses remain explicitly Incomplete."
      }
    ]
  },
  "compiler-checks/production-path": {
    "sectionId": "compiler-checks-production-path",
    "title": "One production path, with explicit proof boundaries",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "The Rust frontend retains the supported MIR body, checked branches, source spans, and authenticated safe device capabilities.",
          "Projection constructs one bounded ranked PLIRON CFG with typed SSA values, views, indices, effects, execution layout, tensor roots, and proof requests. Checked tiled and row-striped recipes include a produced index, checked-success capability, and destination physical extent. After authenticating and replaying an exact unsigned MIR range and recurrence, projection may emit a value-producing kernel.index_unsigned_cast whose conversion is value-preserving over that range.",
          "ProductionRankedKernelV1 performs the sealed checked constant fold. The independent validator compares the exact typed input and output, permits only same-site constant rewrites, and moves the accepted output through a private receipt.",
          "For each target-aware entry point, a bounded structural preflight accounts blocks, operations, values, operands, successors, attributes, and nesting before invoking recursive PLIRON verification. Unsupported nesting, malformed operations, verifier failure, and exhausted limits stop as FE2O3-TARGET-000 before target facts are scanned.",
          "After those structural and target preconditions, a context mutation-attempt epoch and exact structural checkpoints require all nine analysis stages to remain read-only.",
          "The fixed stages run in order: tensor layout, bounds, atomic legality, race freedom, hierarchy ownership, barrier convergence, pipeline protocol, workgroup memory, and semantic refinement.",
          "The compiler seals each report and independently replays its witness. Only the admitted static bounded-access fragment can be Complete; nonempty tensor and every other current independent stage witness remain Incomplete even when a policy report is Clean.",
          "ProductionMiddleEndEvidenceV5 is the only live producer for that ordered result. The strict V4 decoder remains only for immutable historical bytes, and the removed V1 declarative refinement API cannot be used as an alternate admission route.",
          "Only the normalized ranked recipe and admitted reports can proceed to KIR. Typed live validation checks pairing, shape, substitution resistance, predicated use, and source-derived index, extent, dominance, provenance, and launch-coordinate relations. Supported authenticated tiled and row-striped maps proceed to retained KIR; raw or textual recipes missing that custody fail closed. KIR admission still does not grant protected publication, general LLVM/ISA refinement, or universal functional correctness."
        ]
      },
      {
        "type": "table",
        "headers": ["Boundary", "What it catches", "What it does not prove"],
        "rows": [
          ["Mutation epoch and exact snapshots", "Direct mutation, mutate-then-restore, failed mutable-borrow attempts, and retained changes during an analysis-only stage.", "That the analysis report itself is semantically correct."],
          ["Bounded target preflight", "Malformed or unsupported ranked structure, nested regions, verifier failure, and exact resource-limit exhaustion before launch-contract scanning.", "Target feasibility, source-to-IR refinement, launch admission, or hardware execution."],
          ["V5 evidence custody", "The exact fixed nine-pass order and its retained live production record; V4 bytes decode only as inert historical data.", "That a Clean report is independently correct, or that an archived V4 record is fresh or authoritative."],
          ["Sealed report custody", "Omission, duplication, reordering, replay, stale checkpoints, and payload or status substitution.", "That a Clean payload follows from the live IR."],
          ["Independent raw replay", "Exact supported static bounds reconstructed from live PLIRON rather than from report success bits.", "Nonempty tensor flow and every other pass or shape; those remain Incomplete."],
          ["Independent transform replay", "The exact checked IndexBinary to IndexConstant relation, value, position, result identity, CFG, types, effects, and proof sites.", "Any other optimization, algebraic equivalence, or semantic preservation theorem."],
          ["KIR custody", "Downstream lowering receives the transformed ranked recipe rather than the stale pre-transform form.", "KIR-to-LLVM, LLVM-to-ISA, artifact, launch, or hardware correctness."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Current end-to-end boundary",
        "text": "The compiler has one checked transformation and relation-specific replay for supported bounds and ownership forms. Authenticated checked tiled and row-striped mappings can now produce a Clean dynamic race result and retained KIR when their source-derived success, extent, dominance, provenance, and launch facts are complete. Raw or textual carriers without those facts, unknown aliases, unsupported maps, malformed SCCs, and source-width or u64 no-wrap gaps fail closed."
      }
    ]
  },
  "compiler-checks/v7-simulation": {
    "sectionId": "v7-simulation",
    "title": "Debug the verified bundle without upgrading observation into proof",
    "blocks": [
      {
        "type": "paragraph",
        "text": "fe2o3-export-sim extracts a content-addressed .fe2sim from the live production source-to-KIR transaction. fe2o3-kir-sim consumes that bundle directly, or an exact canonical KIR V7 file for a source-unavailable raw-KIR session. Both routes verify and preflight before bounded deterministic execution; neither authenticates compiler execution or grants proof, artifact, load, launch, or hardware authority."
      },
      {
        "type": "table",
        "headers": [
          "Semantic observation surface",
          "Current behavior",
          "Boundary"
        ],
        "rows": [
          ["Schedule and replay", "Canonical or seeded execution records every runnable local selection, binds the exact request, bundle or KIR custody, limits and target, then checks each decision during replay.", "This is deterministic CPU execution, not a GPU scheduler, timing model or performance prediction."],
          ["Guarded scalar load", "A false predicate returns the fallback without validating the pointer, touching memory, or emitting a read event.", "The simulator observes already-verified KIR behavior; it does not establish source-to-KIR refinement."],
          ["Memory conflicts", "The result contains a bounded byte-level cross-invocation global-memory conflict assessment.", "Clean is not a race-freedom proof; conflict and incomplete outcomes remain observations."],
          ["Source debugger", "A compiler-bound map resolves KIR sites to source spans, breakpoints and captured frames; source and KIR stepping share the same deterministic session. Explicit V2 export also binds exact unchanged parameters to KIR values.", "Bundle-bound is not compiler-execution-authenticated, source files are not reopened, and moved, mutated, projected, aliased, storage-reset, local, or composite variables remain typed unrepresented. Default and explicit V1 remain byte-compatible."],
          ["Workgroup cooperation", "Static scalar workgroup memory and convergent workgroup barriers model initialization, cross-lane publication, and one allocation per workgroup.", "Generic barriers, dynamic or non-scalar workgroup memory, and physical wave behavior are outside this profile."],
          ["Scalar and logical-wave semantics", "Booleans, fixed-width integers, legal integer atomics and fences, exact software F16, BF16, F32 and F64 bits, and full-active logical Wave32/Wave64 lane ID, ballot, any, all, and integer shuffle-index execute without host floating arithmetic.", "Unsupported scalar math, float atomics, partial or divergent wave collectives, wave reductions and scans, matrix operations, dynamic or non-scalar workgroup memory, unresolved external calls, memory intrinsics and inline assembly fail closed."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "A debugger observation grants no execution authority",
        "text": "Simulation results, schedules, debug maps and transcripts establish no race freedom, proof discharge, source-to-KIR or GPU equivalence, artifact identity, load or launch authority, timing, profiling, performance, or performance prediction. The KFD-only hardware V2 surface independently exposes owned device, queue and event state plus suspend, resume and terminate; hardware wave/lane state, registers, CWSR, memory, source/KIR stepping and replay remain typed unavailable."
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
        "text": "At the pinned #100 checkpoint, the terminal policy canceled a prepared dispatch and released its queue and kernarg before executable unload when failure occurred before packet publication. Failures after proven quiescence and Loaded or Completed drop performed one checked unload. Adapter unwind, unload error, or ambiguous unload observation aborted. A post-submit queue error or completion deadline was process-terminal and retained submitted resources because GPU quiescence was unknown. Its FakeAdapter coverage lived in crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs at that historical commit; the workload-specific host lifecycle and test were later removed and are not current source paths."
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
        "title": "Historical bounded execution is not current production authority",
        "text": "Within the pinned historical exact route, Slice 4 upstream LLVM/COV6 inspection (#86), canonical matrix Kernel IR V5 (#93), the attributed Slice 1 source-to-exact-descriptor/Worker-V2 boundary (#85), the sealed authority-free exact-profile registry (#96), direct LLVM/LLD finalization (#97), generated host preparation (#99), and the one-shot lifecycle (#100) were recorded complete. That workload-specific selector, registry, finalizer, host lifecycle, and Worker V2 ownership API were later deleted from the unified compiler tree. Their exact commit remains bounded historical evidence only. The new dynamic WorkgroupPipeline route reaches KIR, LLVM, HSACO, and MI300X qualification through generic operations and analyses; it does not inherit protected publication or general refinement authority from the retired route."
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
    "title": "Historical executable baseline and current gate",
    "blocks": [
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Generic PLIRON safety passes are mandatory before lowering",
        "text": "The compiler constructs target-neutral ranked PLIRON and runs the mandatory workload-neutral safety sequence before Kernel IR lowering: tensor layout, memory bounds, atomic legality, global race freedom, complete hierarchy ownership, barrier convergence, pipeline protocol, workgroup-memory initialization/publication, and declared semantic refinement. The implementation uses dialect operations, sparse affine index dataflow, CFG traces, and memory effects; it contains no GEMM names, tile-size tests, or schedule recognizers. For the displayed dynamic MFMA source, authenticated projection retains the checked index, success path, extent, dominance, provenance, launch mapping, and pipeline events needed to pass those generic checks and proceed through KIR, LLVM, HSACO, and qualification launch."
      },
      {
        "type": "paragraph",
        "text": "The current kernel uses BF16/F32 MFMA with dynamic M/N/K, checked lda/ldb/ldc, runtime alpha/beta, multiple workgroups, a K loop, edge handling, and compiler-owned double-buffered LDS staging. Generic effects, ownership, convergence, initialization, epoch, and bounds facts justify publication and reuse without recognizing matrix multiplication. Remaining work is protected publication, broader refinement, and measured schedule tuning rather than a missing executable lowering."
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
          ["Historical direct-global MFMA route", "At its pinned commit, compiled through ranked PLIRON, Kernel IR, gfx942 LLVM, HSACO, and qualification launch", "The selector and alternate host route are retired; four MI300X cases and the HIP comparison remain historical observations only."],
          ["Historical cooperative-LDS route", "Retains archived source, structural diagnostics, and exact evidence records", "Its collected-source selector, exact profile registry, and workload finalizer were deleted from current production."],
          ["Current generic compiler transaction", "Proves the supported checked tiled mapping, dynamic loop, tensor, barrier, epoch, initialization, and reuse obligations, then lowers the exact qualified sources through KIR and gfx942 LLVM", "The qualification runner can execute the resulting HSACO, but protected Worker V3 publication and general source-to-machine refinement remain separate."],
          ["Current Worker V3 path", "Retains generic target finalization and publication mechanics", "No workload selector or Worker V2 ownership API can bypass the incomplete generic proof."],
          ["Tutorial workload sources", "Remain readable safe Rust examples with pinned historical results", "They are not current launch commands, production proof receipts, or source-to-machine authority."]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Historical LDS-family routes are retired",
        "text": "TILED_SOURCE_TO_IR=false, TILED_LOWERING=false, and TILED_PROTECTED_EXECUTION=false describe the retired fixed Slice 1 source family in this mutation archive. They do not describe the dynamic WorkgroupPipeline kernel displayed in the preceding lesson. At compiler commit 1dd61a01, that exact safe source passes the generic checks, lowers through KIR and gfx942 LLVM, emits HSACO, and executes under the qualification runner. Protected Worker V3 publication remains separate."
      },
      {
        "type": "paragraph",
        "text": "Dynamic values are not static compile-time facts. The safe Rust MFMA kernel checks strides and extents before access, zero-fills edge fragments, and uses Option-controlled stores to suppress out-of-range writes. The compiler proves that every memory operation is dominated by the matching checked-success path and that the tiled address map is injective over active workgroups, lanes, and components. The actual sizes remain runtime inputs; violating the kernel precondition traps rather than becoming an unchecked access."
      }
    ]
  },
  "gemm-tiling/mapping": {
    "sectionId": "mapping",
    "title": "Map a wave to a tile",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Each 64-thread workgroup owns one 16x16 C tile. Lane l receives four BF16 A values and four BF16 B values from role-typed matrix views, then selects output rows 4*(l/16)+component at column l%16. Tiled2D expresses that mapping in safe Rust. The generic race pass combines its checked index, success capability, physical extent, launch geometry, and invocation coordinates to prove the active store map is injective."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Fallible views, total edge loads",
        "text": "Bf16MfmaAMatrix::row_major and Bf16MfmaBMatrix::row_major return Result because invalid offsets, extents, or strides cannot form a matrix view; ordinary kernel code propagates that runtime boundary with ?. Once the view exists, load_m16k16 and load_k16n16 return role-typed fragments directly. A logical out-of-bounds coordinate or checked coordinate/address overflow contributes defined BF16 zero. In the qualified compilation, KIR retains those predicated reads and formal-memory admission checks every selected edge before LLVM emission."
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
            "the authenticated projection binds source success paths, extent, uses, dominance, provenance, and the injective invocation map before KIR lowering"
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
          "Prime epoch 0 by loading zero-filled A and B fragments, opening each compiler-owned workgroup ring with stage, writing the lane-owned element, and publishing it with commit.",
          "For each dynamic K phase, stage and commit epoch i + 1 before waiting for epoch i; then consume and read the current typed fragments, execute multiply_accumulate uniformly across the wave, and release both ring slots.",
          "After the loop, wait for the speculative final epoch, discard it, and release both slots. This explicit drain makes every dynamic trip count follow the same finite lifecycle.",
          "Apply alpha * accumulator + beta * C through each runtime-checked Tiled2D output path; the compiler proves the active store map before lowering."
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The pipeline is safe Rust and compiler-owned",
        "text": "WorkgroupPipeline<T, 2, 64, 1> exposes no LDS pointer or reference. Rust keeps the scope, typed MFMA payload, lifetime brand, and non-Send/non-Sync ownership local. During source projection, the compiler creates a disjoint ranked Workgroup view, derives slot = epoch % 2, and emits workload-neutral pipeline events and ranked reads/writes. The protocol pass checks order, initialization coordinates, alias provenance, release-before-reuse, uniform dynamic bounds, and the complete prologue/steady-state/drain schedule without unrolling the runtime loop."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "The staged source executes end to end",
        "text": "At compiler commit 1dd61a01, the exact displayed source reaches semantic MIR and ranked PLIRON with typed MFMA values preserved through workgroup storage. Checked tiled ownership and the double-buffer protocol pass, KIR allocates the two 1,024-byte workgroup rings, gfx942 LLVM lowers the MFMA and barriers, and the resulting HSACO matches the CPU oracle on MI300X."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The mandatory safety pipeline does not recognize GEMM",
        "text": "The nine production ranked passes reason about tensor layout, bounds, atomics, race freedom, complete hierarchy ownership, barrier convergence, pipeline epochs, workgroup-memory initialization, and declared semantic refinement. One analysis manager shares sparse results, execution layout, bounded traces, tensor-layout dataflow, and resource-bounded Presburger relations across that sequence. The same machinery analyzes any kernel expressible in the supported target-neutral operation and effect subset; there is no GEMM or attention selector. Unsupported or unresolved forms stop as Incomplete before matrix lowering."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "What the dynamic tile proof establishes",
        "text": "Tiled2D is workload-neutral type intent, not a GEMM hint or proof exception. Its obligation carrier ties the produced index and checked-success capability to the destination physical extent. Authenticated projection and live validation bind the receiver extent, success paths, allowed uses, CFG dominance, allocation provenance, and injective workgroup/lane/component map. Substitution, malformed shape, unpaired index use, repeated predication, or a colliding map is a compile-time error."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The loop contract binds live CFG, not a workload name",
        "text": "The MIR/PLIRON gate enumerates every reachable natural backedge. A canonical dynamic unit-step loop carries the compiler-derived finite-domain symbol, full u64 machine bound, exact transition, termination variant, and maximum-step identity; stale or narrowed mutations are rejected. This proves termination for that exact form, not the loop-carried product recurrence. Non-unit/eventful/noncanonical loops, extra recurrence, arbitrary break/continue, and loops without termination evidence remain Incomplete."
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
        "text": "The current safe Rust kernel intends one 64-lane wave to own each row. Lane l selects columns l + 64 * iteration, so every lane participates in the maximum and sum reductions while the source mapping assigns distinct output positions. Rows, logical columns, and both strides are runtime values, with a checked maximum logical width of 4,096 elements. Fallback loads supply negative infinity outside the logical row, and runtime checked row-striped stores leave output padding untouched. This describes program behavior and type intent, not an admitted compiler race proof."
      },
      {
        "type": "bullets",
        "items": [
          "The generic gfx942 target lowering maps admitted subgroup_reduce_max_f32 and subgroup_reduce_sum_f32 operations to lane shuffles. The current public softmax recipe stops before target lowering; its algorithm contains no matrix contraction or MFMA.",
          "RowStriped2D removes unsafe from the source and expresses a mapping supported by the generic checked row-striped race proof. This softmax source has not been requalified at compiler commit 1dd61a01, so the lesson retains no current end-to-end execution claim.",
          "DeviceMath::exp_f32 has target-neutral collection and lowering support for admitted recipes; the current softmax recipe does not reach that stage.",
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
            "read-only input, row-striped output type intent, runtime checked stripe construction, and no unsafe kernel block; these Rust facts do not prove cross-invocation race freedom"
          ],
          [
            "PLIRON verification",
            "the generic compiler supports authenticated checked row-striped ownership, but this exact softmax source has not been rerun through the 1dd61a01 end-to-end qualification"
          ],
          [
            "Lowering",
            "no current KIR or gfx942 result is claimed for this exact source until it is rerun through the same end-to-end qualification"
          ],
          [
            "Qualification host",
            "at the pinned retired qualification commit, four dynamic cases launched on MI300X, compared with an independent CPU oracle, and checked untouched output padding"
          ],
          [
            "Remaining boundary",
            "the historical observations do not transfer to compiler commit 1dd61a01; a fresh source-to-HSACO run and CPU-oracle comparison are required before promotion"
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "The compiler does not know this is softmax",
        "text": "The pipeline reasons about typed capabilities, ranked indices, effects, control flow, collective convergence, and target-neutral operations. It never matches a softmax name or loop pattern. The same structural carrier checks therefore apply to any kernel in the supported target-neutral subset, while missing semantic custody stops as Incomplete. Numerical policy remains visible in ordinary Rust source and explicit input contracts; neither the carrier nor a Clean result for another relation proves softmax semantics."
      }
    ]
  },
  "flash-attention/online": {
    "sectionId": "online",
    "title": "Fuse scores without materializing them",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Each wave produces a 16-query tile. Target-neutral BF16 fragments express Q contracted with transposed K in 16-key tiles, and two compiler-owned workgroup rings double-buffer those role-typed fragments across the dynamic depth loop. The admitted target operation lowers to V_MFMA_F32_16X16X16_BF16. The source then applies the additive mask and advances the stable online maximum, denominator, and V-weighted numerator without materializing the score matrix."
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
            "two BF16 WorkgroupPipeline rings and MFMA accumulators",
            "dynamic depth tails contribute zero; every staged epoch is committed, consumed or discarded, and released"
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
            "Tiled2D output capability",
            "checked tiled ownership; the active workgroup/lane/component store map is proved injective before lowering"
          ]
        ]
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "Nested loops use the same generic protocol",
        "text": "The attention source reuses the same WorkgroupPipeline API as GEMM inside an outer dynamic key-tile loop. The compiler does not identify attention: it follows pipeline ownership through Rust aliases, preserves the MFMA A/B payload contracts across writes and reads, selects the innermost canonical dynamic loop, and summarizes its linear prologue and drain even when those regions span multiple basic blocks. Invalid slots, early reads, late writes, missing drains, nonuniform bounds, and overlapping pipeline storage are compile-time errors with source repair guidance."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "The nested pipeline executes end to end",
        "text": "At compiler commit 1dd61a01, the exact displayed nested attention source passes ranked PLIRON, lowers through KIR and a 210,815-byte gfx942 LLVM module, emits HSACO, and executes four workgroups on MI300X. The result tab records the exact shape, zero-error CPU comparison, LDS size, barriers, memory instructions, and MFMA instruction."
      },
      {
        "type": "paragraph",
        "text": "Batch-head count, padded query and key lengths, depth, strides, scale, and additive mask are runtime values. The checked-access proof validates the index, success path, physical extent, and injective store map without recognizing attention. Grouped-query layouts, dropout, backward propagation, wider V tiles, and a matrix-accelerated PV contraction remain separate end-to-end implementation work."
      },
      {
        "type": "callout",
        "tone": "proof",
        "title": "A future matrix PV phase must accept the QK result layout",
        "text": "The displayed attention kernel uses scalar V loads and subgroup sums for PV. If that phase is replaced by a second MFMA, the first MFMA's exact result root flows into the second site. FE2O3 accepts different instruction profiles only when their physical fragment ABIs are compatible; otherwise FE2O3-TENSOR-LAYOUT-005 stops before lowering and proposes a compatible consumer or an explicit checked conversion. The pass sees two tensor sites and one value root, not QK, PV, or attention."
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
          "One adversarial case covers two heads, query and key tails, multi-workgroup launch geometry, non-multiple-of-16 depth, runtime strides, finite and negative-infinity additive masks, one fully masked row, value-width tails, and untouched output padding.",
          "The exact safe Rust source passed source collection, generic PLIRON safety verification, Kernel IR lowering, gfx942 LLVM emission, HSACO finalization, host launch, and CPU-oracle comparison at compiler commit 1dd61a01.",
          "Disassembly confirms one MFMA score contraction, four barriers, and LDS reads and writes; no global score matrix is allocated.",
          "The result does not establish protected publication, complete IEEE/OCML refinement, every legal shape, universal functional correctness, or performance parity with tuned FlashAttention libraries."
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
        "text": "The tutorial host packs each expert group into a 16-row-padded matrix, and the pinned retired qualification route launched the same safe Rust kernel for every nonempty group. Runtime arguments supply padded rows, reduction depth, output columns, all matrix strides, expert ID, and expert count. The expert ID selects a strided weight and bias region; it does not select a compiler path. This exact MoE source has not been requalified at compiler commit 1dd61a01, so it retains historical evidence only."
      },
      {
        "type": "callout",
        "tone": "warning",
        "title": "MFMA is an operation, not a workload label",
        "text": "Target-neutral matrix fragments express the token-by-weight contraction without a GEMM or MoE recognizer. The generic compiler can prove supported checked tiled mappings, but no KIR, MFMA lowering, launch, or hardware result is claimed for this exact MoE source until it passes a fresh end-to-end qualification."
      }
    ]
  },
  "moe-expert-compute/combine": {
    "sectionId": "combine",
    "title": "Apply the epilogue and return to token order",
    "blocks": [
      {
        "type": "paragraph",
        "text": "The kernel computes gate * (projection + expert_bias) for every routed row. The host retains the route-to-token mapping, reads each expert result, and accumulates the two weighted routes into one token output in deterministic route order. The pinned historical qualification used 41 tokens, 4 experts, 82 routes, K=35, and N in {1, 15, 16, 17, 33}, covering partial and exact output tiles on both sides of the 16-column boundary."
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
        "text": "At the pinned historical commit, the explicitly selected nonpublishing grouped-expert qualification oracle collected the dynamic expert kernel, discharged 17 ranked index obligations, emitted gfx942 LLVM and HSACO, and executed the top-2 case on MI300X. That workload selector is retired and cannot complete the current production transaction. Every combined output matched an independent BF16-input/FP32-accumulation CPU oracle exactly, and output stride padding retained its sentinel."
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
          "Run the opt-in gfx942 hardware lane only for its documented KFD identity, memory, queue, and debug-control scope.",
          "Do not record application GPU output unless a separate exact qualification route actually dispatches it and checks an independent oracle.",
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
        "The current private join combines PLIRON-proved non-vacuous output coverage, separation, frames, schedules, and ordered-product identity with one generated run that replays each supported exact point formula. Finite fold, recurrence, and permutation contracts are structurally validated but their final-value formulas remain unsupported. It does not prove arbitrary reference extraction, unsupported loop forms, target arithmetic, LLVM-or-later refinement, or runtime admission.",
        true,
      ),
      {
        type: "table",
        headers: ["Layer", "Question", "Fail-closed result"],
        rows: [
          ["Coverage", "Was every required output written exactly once as the final observable effect?", "Rejected hole, duplicate, overwrite, or unmodeled write; Incomplete unresolved domain"],
          ["Value", "Does each final value equal the safe Rust reference expression?", "Rejected typed-expression mismatch; Incomplete unsupported expression"],
          ["Composition", "Do reductions, recurrences, permutations, and collectives cover their declared domains?", "Rejected missing or duplicate contribution; Incomplete unsupported relation"],
          ["Loops", "Does every reachable backedge have one canonical finite induction contract?", "Rejected substituted bound, step, transition, or exit; Incomplete unsupported CFG or dynamic range"],
          ["Evidence", "Did private generated execution replay the exact compiler-derived formulas?", "Incomplete missing runtime, failed execution, or mismatched formula report; Checked staging alone is inert"],
          ["Per-compilation composition", "Did PLIRON reconcile structural coverage and the ordered output product, did one generated checker replay every supported exact formula, and did the private move-only join bind both to the same MIR and live PLIRON?", "Integrated before KIR lowering for exact point formulas; unsupported replay roles or an unavailable retained runtime fail closed, and no LLVM-or-later authority is granted"],
        ],
      },
    ],
  },
  "gfx942-setup/semantic-gates": {
    sectionId: "semantic-gates",
    title: "Run semantic gates before target gates",
    blocks: [
      milestoneCallout(
        "The publication pin names the exact mandatory pre-lowering report, V5 evidence, total-output staging type, per-compilation formula report, and private joined boundary. Target compilation and hardware qualification remain later, separate gates.",
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
        "Fill is the smallest total-view example: the logical output domain must map onto all required coordinates, each coordinate must have one owner and one final write, and no other observable global write may escape the model. The ownership verifier records these structural facts, while the inert total-output staging report grants no refinement authority until aggregate replay.",
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
        "CPU semantic simulation can expose counterexamples in exact bundle-bound KIR and relate observed sites to the bundle's compiler-emitted map, but it cannot authenticate compiler execution or establish source-to-KIR refinement, universal coverage, race freedom, or GPU refinement. Those obligations remain separate and quantified over their declared domains.",
      ),
      {
        type: "paragraph",
        text: "Where an independent sequential oracle exists, run the same typed inputs through it and the exact bundle. A mismatch blocks the candidate immediately. Matching finite cases improve confidence in the request, oracle, bundle, and source map, but compiler-bundle binding alone does not prove protected compiler execution or discharge any universal compiler or Verus obligation.",
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
    title: "What is complete today",
    blocks: [
      {
        type: "callout",
        tone: "boundary",
        title: "Complete is relation-specific",
        text: "Complete below means that an independent checker replayed one documented relation for one exact PLIRON checkpoint. It is not a claim that the whole kernel, compiler, numerical result, artifact, or hardware execution is correct.",
      },
      {
        type: "table",
        headers: ["Relation", "Current status", "Exact boundary"],
        rows: [
          ["Static bounded ranked access witness", "Complete for the admitted raw-replay fragment", "One block, finite unique invocation dimensions, at most one well-formed execution layout with exact active-axis agreement, static ranked extents, supported index producers, checked u64 evaluation, and the replay resource cap."],
          ["Nonempty tensor-layout witness", "Incomplete", "Policy diagnostics can reject incompatible layouts, but external roots are not yet bound to operational SSA provenance. No nonempty tensor inventory receives Complete replay."],
          ["Bounds outside the raw fragment", "Incomplete", "Dynamic launch dimensions, unsupported maps, exhausted enumeration, malformed inventory, and any possible machine overflow fail closed."],
          ["Race and ownership policy", "Clean for supported authenticated relations", "Injective affine maps and bounded Presburger noncollision can be Clean. Authenticated checked tiled and row-striped maps additionally bind success, extent, dominance, provenance, and launch coordinates; raw or textual carriers without that custody fail closed."],
          ["Loop progress policy", "Clean for the canonical committed form; independent witness remains Incomplete", "Canonical single-entry multi-block forwarding SCCs need i < bound, one positive constant latch step, and both source-width and ranked u64 no-wrap proofs."],
          ["Barrier, atomic, workgroup-memory, hierarchy, and semantic witnesses", "Incomplete", "Their reports can reject concrete errors, but a Clean report has no independent Complete replay yet."],
          ["Checked index constant fold", "Applied or NotApplicable after exact typed replay", "Only exact preceding same-block IndexConstant operands, checked Add or Multiply, and nonzero Divide or Remainder. One input clone is replayed against the moved receipt-owned output; unrelated CFG, values, types, effects, and proof sites remain identical."],
          ["Any other transformation", "Unsupported", "No callback, pass name, digest match, or final structural equality can authorize another rewrite."]
        ],
      },
      {
        type: "callout",
        tone: "proof",
        title: "Why the narrow result still matters",
        text: "The architecture separates policy analysis, immutable-pass enforcement, report custody, independent witness replay, and checked transformation replay. That makes unsupported reasoning visible instead of converting it into a broad success claim, while allowing each workload-neutral relation to grow behind the same Rust MIR to ranked PLIRON to KIR path.",
      },
    ],
  },
  "reductions-scans/contribution-domain": {
    sectionId: "contribution-domain",
    title: "Inspect the generated WG64 schedule",
    blocks: [
      {
        type: "paragraph",
        text: "At compiler commit d4a87f9d38b2b373929847e0eb149cb505b0cd6f, one target-neutral NeutralWorkgroupReduceSum consuming exact DynamicLds authority produces a stable generated-effect stream. For a 64-invocation workgroup, 4 + 5 x log2(64) gives exactly 34 effects: 20 LDS memory effects and 14 workgroup acquire-release barriers.",
      },
      {
        type: "table",
        headers: ["Effect ordinal", "Reduction phase", "Exact generated effects"],
        rows: [
          ["0", "Publish", "LDS write: scratch[local X invocation index] = input"],
          ["1", "Publish", "Acquire-release workgroup barrier over LDS"],
          ["2-6", "Offset 32", "LDS read self; LDS read safe partner; barrier; LDS write selected sum; barrier"],
          ["7-11", "Offset 16", "LDS read self; LDS read safe partner; barrier; LDS write selected sum; barrier"],
          ["12-16", "Offset 8", "LDS read self; LDS read safe partner; barrier; LDS write selected sum; barrier"],
          ["17-21", "Offset 4", "LDS read self; LDS read safe partner; barrier; LDS write selected sum; barrier"],
          ["22-26", "Offset 2", "LDS read self; LDS read safe partner; barrier; LDS write selected sum; barrier"],
          ["27-31", "Offset 1", "LDS read self; LDS read safe partner; barrier; LDS write selected sum; barrier"],
          ["32", "Result", "LDS read: scratch[0]"],
          ["33", "Release", "Final acquire-release workgroup barrier before scratch reuse"],
        ],
      },
      {
        type: "table",
        headers: ["Debugger field", "What the compiler retains", "What it means"],
        rows: [
          ["Semantic origin", "GeneratedFromSemanticTerminator plus the exact consumer semantic block", "The NeutralWorkgroupReduceSum terminator is parent provenance for the generated stream."],
          ["Effect ordinal", "One stable value from 0 through 33", "A mismatch reports the first changed, deleted, duplicated, reordered, or trailing executable effect."],
          ["Ranked location", "The exact (ranked block, ranked operation) pair for every effect", "The 34 pairs must form one ordered contiguous interval in the consumer's ranked block and must name an LDS effect or barrier of the expected kind."],
          ["Recipe identity", "One nonzero domain-separated SHA-256 shared by the stream", "It binds recipe-v1, function identity, producer and consumer blocks, DynamicLds and element types, element count, and scalar kind."],
          ["Direct source span", "Deliberately absent", "The semantic terminator span is parent provenance only. The compiler does not fabricate a direct Rust span for an LDS access or barrier introduced by lowering."],
        ],
      },
      {
        type: "callout",
        tone: "proof",
        title: "Why this is useful to a debugger",
        text: "An agent can name the failing semantic block and effect ordinal, recover the exact ranked operation, compare the recipe identity, and explain the enclosing reduction phase without pretending that a compiler-generated barrier was written at a Rust source location. Exact KIR replay rejects substituted types, allocation identity, address space, alignment, volatility, barrier scope or ordering, operands, result custody, and schedule shape.",
      },
      milestoneCallout(
        "A generic contribution pass can prove that every declared participant contributes exactly once through a legal operation. The user specification must still name the operator, identity, order policy, and sequential fold it is meant to refine.",
      ),
      {
        type: "paragraph",
        text: "For associative exact arithmetic, a multiset contract may permit tree reordering. For floating point, order changes values, so the numeric contract must either retain the exact reduction tree or prove an explicit error bound. Atomic legality alone proves neither coverage nor the final reduced value.",
      },
      {
        type: "callout",
        tone: "boundary",
        title: "Compiler schedule, not an execution result",
        text: "This milestone is compiler-checked semantic-to-ranked and exact-KIR correlation only. It is not GPU execution, a numerical result, a hardware thread or wave trace, profiling or timing, protected source-to-HSACO publication, source-to-machine refinement, or proof that every reduction kernel uses this recipe.",
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
        "The Sequential semantics tab states the desired safe Rust result. The workload-neutral compiler replays eligible exact point formulas and canonical loop termination. This reference's independent slice extents, multidimensional reads, nested recurrence, and Vec allocation remain outside the bounds subset. MFMA components bind exact result roots to stores without naming GEMM, but tensor-component and BF16/F32 error-bound formula replay remain unsupported.",
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
        "The Sequential semantics tab states the safe Rust result. The generic compiler replays eligible exact point formulas and canonical loops without recognizing softmax. Dynamic extent implication and this oracle's range slice, iterator folds, Vec allocation, recurrence, and exp semantics exceed that subset. ErrorBounded aggregate formula replay is not implemented; no receipt or test epsilon can supply the missing theorem.",
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
        "The Sequential semantics tab states the safe Rust transition. Production can replay eligible exact point formulas and canonical loops without recognizing attention; PLIRON structurally reconciles separated outputs. This oracle's independent extents, multidimensional reads, Vec score allocation, nested recurrence, and exp semantics remain outside that subset. MFMA result/store binding is exact at the claim boundary, but tensor-component and numerical-error replay remain unsupported.",
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
        "A clean helper result is insufficient. The mandatory non-Clone lowering input must retain PLIRON coverage, separation, frame, schedule, and product facts plus the private generated formula report. Policy-checked staging binds inputs but grants no authority; the move-only join must bind the exact normalized obligation, compiler subjects, tools, execution result, and structural reports.",
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
        "The exact manifest paths, digests, report type, and mandatory diagnostics are now part of the acceptance gate. Contributors must also state which source, termination, numerical, lowering, artifact, runtime, and hardware boundaries remain unproved.",
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
  },
  "gfx950-fp4-gemm/prerequisites": {
    sectionId: "gfx950-prerequisites",
    title: "Qualify the gfx950 toolchain before reading results",
    blocks: [
      {
        type: "table",
        headers: ["Check", "Command", "Required observation"],
        rows: [
          ["Device", "rocminfo | grep -i 'Name:.*gfx950'", "At least one gfx950 agent for an execution claim."],
          ["Compiler", "/opt/rocm/llvm/bin/clang++ --version", "A ROCm LLVM build whose AMDGPU backend accepts --offload-arch=gfx950."],
          ["Disassembler", "/opt/rocm/llvm/bin/llvm-objdump --version", "AMDGPU is a registered target; use the same ROCm toolchain that produced the object."],
          ["fe2o3", "git rev-parse HEAD && git status --short", "Record the exact source commit and every local modification before attaching evidence."],
        ],
      },
      {
        type: "callout",
        tone: "proof",
        title: "Exact Rust artifacts reached the recorded hardware",
        text: "At fe2o3 core commit c1383e97db732f9f1ff8105f10d5c2b5971143e1 with tree 42385e6464ca40318fc70ae104845d3997844140, the four exact Rust low-precision kernels lowered to gfx950 HSACO. On 2026-08-29, those Rust-origin artifacts were numerically observed on ssh host mi350 with GEMM max_absolute_error=0, FP4 attention max_absolute_error=2.235174179e-8, and FP8 attention max_absolute_error=5.960464478e-8 under ROCm 7.2.1.",
      },
      milestoneCallout(
        "The recorded lowering and mi350 cases establish exact artifact and bounded execution observations, not a source-to-machine proof, universal numerical theorem, or performance result. The protected Worker V3 native-build route and its measured provider/finalizer transcript remain a separate boundary.",
      ),
    ],
  },
  "gfx950-fp4-gemm/tile-accumulator": {
    sectionId: "fp4-gemm-tile-accumulator",
    title: "Map packed FP4 into one wave64 accumulator tile",
    blocks: [
      {
        type: "paragraph",
        text: "The exact attributed Rust expresses one wave computing a 16 x 16 output tile with one fixed K=128 phase through typed gfx950 device terminals. Eight E2M1 values occupy each packed word. At the pinned core commit and tree, that Rust kernel lowers to gfx950 HSACO with identity-scale operands encoded as constants and no runtime E8M0 scale arrays; its mi350 comparison reported max_error=0.",
      },
      {
        type: "table",
        headers: ["Object", "Logical shape", "Lane-local responsibility"],
        rows: [
          ["A fragment", "16 x 128 FP4 E2M1", "Packed source tuple selected as FP4 for matrix A."],
          ["B fragment", "128 x 16 FP4 E2M1", "Packed source tuple selected as FP4 for matrix B."],
          ["Accumulator", "16 x 16 FP32", "Four FP32 components per lane across wave64; initialize once and carry through every K phase."],
          ["Output", "16 x 16 FP32", "Store only the lane's four coordinates, with edge predicates for partial M or N tiles."],
        ],
      },
      {
        type: "callout",
        tone: "boundary",
        title: "Inspect the machine instruction, not the intrinsic spelling",
        text: "The exact Rust-origin gfx950 disassembly prints v_mfma_f32_16x16x128_f8f6f4, and the FP4 acceptance check inspects cbsz:4 blgp:4. That establishes an instruction fact for the pinned artifact, not semantic refinement, a performance claim, or completion of the protected Worker V3 native-build route. Runtime block scales are a future extension.",
      },
    ],
  },
  "gfx950-fp8-gemm/format-layout": {
    sectionId: "fp8-format-layout",
    title: "Keep FP8 format and scale metadata visible",
    blocks: [
      {
        type: "paragraph",
        text: "The unified gfx950 f8f6f4 MFMA opcode selects its A and B element formats through instruction operands. This lesson uses E4M3 for both matrices and FP32 accumulation. Four FP8 values occupy each packed 32-bit word. Mixed E4M3, E5M2, FP6, or FP4 variants require different selector contracts even when the printed opcode is unchanged.",
      },
      {
        type: "bullets",
        items: [
          "Record the A and B format selectors independently; an opcode grep cannot prove their values.",
          "Keep the current identity-scale constants visible. If runtime E8M0 scale arrays are added, associate each scale with an exact packed block and reject a shifted index.",
          "Define saturation, NaN, infinity, signed-zero, and accumulation-error policies before comparing with a CPU reference.",
          "The current source is fixed at K=128 with no tail. A dynamic extension must pad to 128-element phases and guard logical tails during packing.",
        ],
      },
      milestoneCallout(
        "The exact Rust FP8 GEMM now lowers to gfx950 HSACO and its mi350 comparison reported max_error=0. That recorded case and ISA presence do not prove the quantization relation, source-to-machine refinement, performance, or a protected Worker V3 native build; broader claims still need the bound safe reference and exact format/scale policy.",
      ),
    ],
  },
  "gfx950-fp8-gemm/tile-accumulator": {
    sectionId: "fp8-gemm-tile-accumulator",
    title: "Walk the FP8 K loop without losing accumulator ownership",
    blocks: [
      {
        type: "steps",
        items: [
          "Choose one 16 x 16 output tile per wave64 and zero four FP32 accumulator components per lane.",
          "Load the lane's packed E4M3 A and B fragments for the current 128-element K phase.",
          "Pass the current identity-scale constants and issue the single gfx950 low-precision MFMA for K=128.",
          "Retain the returned FP32 fragment. A multi-phase extension must carry it as SrcC rather than reinitializing it.",
          "Convert lane/component coordinates to four unique fixed 16 x 16 output positions. Dynamic M/N edge predicates are an extension.",
        ],
      },
      {
        type: "callout",
        tone: "proof",
        title: "Accumulator invariant",
        text: "For the current single phase, each lane component represents its four output coordinates accumulated over exactly 128 E4M3 elements with identity scale and FP32 accumulation. The exact Rust kernel lowered to gfx950 HSACO and reported max_error=0 on mi350, but that observation is not a proof or performance result and does not complete the protected Worker V3 native-build route. For an extension with p phases, the invariant must cover exactly min(p * 128, logical K) elements and name the runtime scale and tail-zero policies.",
      },
    ],
  },
  "gfx950-fp4-attention/transpose-pipeline": {
    sectionId: "fp4-attention-transpose",
    title: "Transpose packed FP4 in LDS before QK",
    blocks: [
      {
        type: "paragraph",
        text: "Flash attention needs K in the matrix-B register orientation while retaining coalesced packed storage. The exact Rust FP4 attention kernel now lowers through the gfx950 tr4/MFMA route: its format-specific K read emits ds_read_b64_tr_b4, and the resulting fragments feed v_mfma_f32_16x16x128_f8f6f4 for QK score tiles. A generic LDS load followed by scalar repacking does not satisfy this lesson's ISA contract.",
      },
      {
        type: "table",
        headers: ["Stage", "Tile", "Required machine family"],
        rows: [
          ["Q fragment", "16 queries x 128 depth, packed E2M1", "Packed directly from global input with constant identity-scale operands."],
          ["K transpose read", "16 keys x 128 depth, packed E2M1", "ds_read_b64_tr_b4"],
          ["QK contraction", "16 queries x 16 keys", "v_mfma_f32_16x16x128_f8f6f4 with FP32 accumulator."],
          ["PV accumulation", "16 queries x 16 values", "Current source decodes FP4 V and accumulates a scalar FP32 loop; a second MFMA is only a future extension."],
        ],
      },
      milestoneCallout(
        "The exact Rust-origin HSACO using tr4 plus MFMA reported attention max_absolute_error=2.235174179e-8 on mi350. The opcodes and recorded case remain target-machine and bounded execution facts only: they do not prove the Q/K layout, online-softmax recurrence, numerical policy, final O stores, performance, or the protected Worker V3 native-build route.",
      ),
    ],
  },
  "gfx950-fp4-attention/online-softmax": {
    sectionId: "fp4-attention-online-softmax",
    title: "Bound the one-tile softmax, then define the online extension",
    blocks: [
      {
        type: "paragraph",
        text: "Packed Q, K, and V reduce bandwidth, but the score accumulator, row maximum, denominator, and scalar PV numerator remain FP32. The exact Rust kernel lowers to gfx950 HSACO and its mi350 comparison reported max_absolute_error=2.235174179e-8 for the current fixed, unmasked 16-key tile. It computes the maximum and denominator, then decodes V and accumulates PV in a scalar FP32 loop. Multi-tile online rescaling, causal masks, and tail keys are extensions.",
      },
      {
        type: "callout",
        tone: "proof",
        title: "Per-row recurrence",
        text: "The current one-tile result covers exactly 16 unmasked keys. For a multi-tile extension, after tile t, (m, l, numerator) must represent exactly the active, unmasked keys in tiles [0, t), and the previous state must be rescaled when the maximum changes.",
      },
      {
        type: "bullets",
        items: [
          "A causal or padding-mask extension must place excluded keys outside the logical score domain before max reduction.",
          "The current source uses identity-scale constants. A runtime-scale extension must bind Q, K, and V scale indices independently.",
          "Inspect both ds_read_b64_tr_b4 and v_mfma_f32_16x16x128_f8f6f4 in the final code object.",
          "The recorded numerical case is not a recurrence proof or performance result, and it does not establish a protected Worker V3 native build.",
        ],
      },
    ],
  },
  "gfx950-fp8-attention/transpose-pipeline": {
    sectionId: "fp8-attention-transpose",
    title: "Use the FP8 transpose-load contract",
    blocks: [
      {
        type: "paragraph",
        text: "The exact Rust FP8 attention kernel packs four E4M3 values per dword and lowers K through the gfx950 ds_read_b64_tr_b8 matrix-B path. V does not use a transpose read: the current kernel loads and decodes V for scalar FP32 PV accumulation. The K transpose opcode is format-specific; ds_read_b64_tr_b4 is not interchangeable with ds_read_b64_tr_b8.",
      },
      {
        type: "steps",
        items: [
          "Pack fixed E4M3 Q/K blocks for one K=128 phase; the current builtin call uses identity-scale constants rather than runtime scale arrays.",
          "Read the matrix-B fragment through ds_read_b64_tr_b8 and wait for LDS completion before use.",
          "Issue v_mfma_f32_16x16x128_f8f6f4 with E4M3 selectors and carry the FP32 score fragment.",
          "Compute one unmasked 16-key softmax tile in FP32, then load and decode V without a transpose instruction and accumulate PV through the current scalar FP32 loop.",
          "Write the fixed 16 x 16 O tile. Masking, edge predicates, multi-tile recurrence, and MFMA-accelerated PV are extensions.",
        ],
      },
      milestoneCallout(
        "The exact Rust kernel lowered to gfx950 HSACO with tr8 only on K, MFMA for QK, and scalar PV from V; its mi350 comparison reported max_absolute_error=5.960464478e-8. This is a bounded execution observation, not a proof, performance label, or completed protected Worker V3 native build.",
      ),
    ],
  },
  "gfx950-fp8-attention/evidence-boundary": {
    sectionId: "fp8-attention-evidence",
    title: "Record compiler, ISA, and hardware evidence separately",
    blocks: [
      {
        type: "table",
        headers: ["Evidence field", "Required record", "Claim limit"],
        rows: [
          ["Source", "Core commit c1383e97db732f9f1ff8105f10d5c2b5971143e1, tree 42385e6464ca40318fc70ae104845d3997844140, source SHA-256, compiler command", "Identifies the exact Rust inputs; does not prove semantic refinement."],
          ["Code object", "Rust-origin gfx950 HSACO SHA-256, target ID, symbol and metadata inspection", "Establishes lowering and object identity/ABI facts only; protected Worker V3 native-build evidence remains separate."],
          ["ISA", "Saved llvm-objdump output containing QK MFMA and the format-specific K transpose mnemonic", "Establishes instruction presence; V remains a load/decode plus scalar PV path in FP8 attention."],
          ["Execution", "mi350 gfx950 identity, exact Rust-artifact launch command, oracle cases, tolerances, output and canaries", "Establishes only the recorded cases on the recorded device, not proof or performance."],
        ],
      },
      {
        type: "callout",
        tone: "boundary",
        title: "Keep external observations distinct",
        text: "The 2026-08-29 mi350 run records an MI350X gfx950 identity for the exact Rust-origin HSACOs, with GEMM max_absolute_error=0, FP4 attention max_absolute_error=2.235174179e-8, and FP8 attention max_absolute_error=5.960464478e-8. Keep the pinned Rust source, lowering transcript, final artifact hashes, runtime observation, still-pending performance field, proof obligations, and protected Worker V3 native-build/provider transcript as separate evidence layers; do not promote a broader claim from the numerical cases alone.",
      },
    ],
  },
  "gfx950-advanced-moe/fixed-pipeline": {
    sectionId: "advanced-moe-fixed-pipeline",
    title: "Treat the local MoE stages as separate contracts",
    blocks: [
      {
        type: "table",
        headers: ["Stage", "Fixed-shape contract", "Failure to expose"],
        rows: [
          ["Route metadata", "Sixteen tokens choose two of four routed experts with lower-ID tie-breaking; all 32 routes receive compact slots.", "A reordered or duplicated route hidden by later combine."],
          ["Expert-major dispatch", "One deterministic compact slot for every accepted token-route pair.", "Atomic arrival order silently becoming route order."],
          ["Expert compute", "Five MFMA waves compute every routed and shared expert for all 16 tokens; dispatch metadata does not sparsify this fixed kernel.", "Claiming token dispatch avoided the unselected expert tiles."],
          ["Combine", "Apply SiLU, top-2 softmax weights, and a 0.25 shared-expert contribution at the original token coordinate.", "Missing, repeated, or misweighted contributions."],
        ],
      },
      {
        type: "paragraph",
        text: "The teaching pipeline keeps route IDs, compact slots, expert IDs, dense expert tiles, and token output coordinates distinct. The separate rank kernel reads its assigned two-expert partition, while a separate combine kernel merges rank partials. The production evidence is recorded per kernel and per exact Rust HSACO; it is not evidence of a device collective, communication library, or production expert-parallel transport.",
      },
    ],
  },
  "gfx950-advanced-moe/scope-evidence": advancedScope(
    "advanced-moe-scope-evidence",
    "Stop at the bounded two-rank teaching pipeline",
    "examples/gfx950_advanced_systems/src/kernel.rs",
    "It does not include route dropping, expert-parallel all-to-all, a device collective, capacity balancing across devices, a serving router, or end-to-end model execution.",
  ),
  "gfx950-kda-gdn-linear-attention/recurrence": {
    sectionId: "kda-gdn-recurrence",
    title: "Relate exact decode to the WY/UT chunk transform",
    blocks: [
      {
        type: "table",
        headers: ["Stage", "Exact one-token equation", "Fixed gfx950 mapping"],
        rows: [
          ["Decay", "D_t = diag(alpha_t) S_(t-1)", "Lane (v,k) owns H[v,k] = S[k,v] and multiplies by alpha_t[k]."],
          ["Delta error", "e_t = v_t - k_t^T D_t", "Each Wave16 group reduces the 16 key products for one value column."],
          ["Rank-one update", "S_t = D_t + beta_t k_t e_t^T", "Each lane updates one matrix element; no atomic or cross-value exchange is needed."],
          ["Output", "o_t = S_t^T (q_t / sqrt(16))", "A second Wave16 reduction produces one logical value output, replicated over its 16 key lanes by the checked output policy."],
        ],
      },
      {
        type: "steps",
        items: [
          "Within each four-token chunk, form cumulative per-key decay products so every token is expressed relative to the state entering the chunk.",
          "Build the strictly lower-triangular interaction coefficients L_ji = beta_j * k_j^T diag(product_(r=i+1..j) alpha_r) k_i for i < j.",
          "Solve the unit-lower system by forward substitution: z_0=b_0, z_1=b_1-L_10 z_0, z_2=b_2-L_20 z_0-L_21 z_1, and z_3=b_3-L_30 z_0-L_31 z_1-L_32 z_2.",
          "Use the solved z vectors in the matching query interactions to emit all four outputs, then apply the four decays and four rank-one terms once to produce the chunk state.",
          "Carry that exact state into the second C=4 invocation. The CPU oracle does not use these equations; it executes eight scalar f64 recurrence steps and captures the token-three state independently.",
        ],
      },
      {
        type: "paragraph",
        text: "The equations follow Kimi Linear, arXiv:2510.26692, equations 1 and 6-9 (https://arxiv.org/abs/2510.26692). Flash Linear Attention's KDA layer and fused recurrent implementation provide an independent implementation reference (https://github.com/fla-org/flash-linear-attention/blob/main/fla/layers/kda.py and https://github.com/fla-org/flash-linear-attention/blob/main/fla/ops/kda/fused_recurrent.py). The tutorial's numerical oracle is still the locally published scalar f64 code, not either external implementation.",
      },
      {
        type: "callout",
        tone: "boundary",
        title: "The kernel boundary starts after model-side transforms",
        text: "The inputs are post-projection, L2-normalized q and k plus already activated alpha in (0,1] and beta in [0,1]. The fixed kernel applies q/sqrt(16). It deliberately excludes learned projections, the surrounding width-four convolution, alpha/beta parameterization, RMS/output gating, and output projection. Logical state is S[K,V]; production memory stores H[V,K].",
      },
    ],
  },
  "gfx950-kda-gdn-linear-attention/scope-evidence": advancedScope(
    "kda-gdn-scope-evidence",
    "Bound the matrix recurrence and its evidence",
    "examples/gfx950_advanced_attention/src/kernel.rs",
    "It does not cover dynamic dimensions, multiple heads, persistent state across requests, learned projection or convolution stages, output gating, or equivalence to a complete Kimi Linear model layer. Physical outputs are replicated to satisfy the current checked Index1D ownership surface; the runtime validates every replica.",
  ),
  "gfx950-indexed-sparse-attention/index-contract": {
    sectionId: "indexed-sparse-index-contract",
    title: "An index table changes the attention domain",
    blocks: [
      {
        type: "table",
        headers: ["Selection stage", "Fixed source behavior", "Oracle check"],
        rows: [
          ["Block rank", "Rank four four-token blocks by each block's maximum content score; retain two.", "Ties preserve the source-defined earlier block order."],
          ["Token rank", "Rank the eight retained-block tokens by content score; retain three unique IDs.", "The output ID triplet exactly matches the independent selector."],
          ["QK score", "Compute a 16-token FP8 score tile, then activate only the three selected token IDs.", "Unselected lanes become negative infinity before max reduction."],
          ["PV output", "Normalize over exactly the selected IDs and use their matching V rows.", "No unselected token changes max, denominator, or numerator."],
        ],
      },
      {
        type: "paragraph",
        text: "Content rank, selected token ID order, packed fragment order, and logical attention order are separate mappings. The fixed source emits three selected IDs; it does not accept a caller-provided sparse-index table.",
      },
    ],
  },
  "gfx950-indexed-sparse-attention/scope-evidence": advancedScope(
    "indexed-sparse-scope-evidence",
    "Do not infer a production sparse-attention stack",
    "examples/gfx950_advanced_attention/src/kernel.rs",
    "It does not provide caller-supplied indices, dynamic sparse widths, a paged KV cache, block scheduling, cross-device KV exchange, or arbitrary mask support.",
  ),
  "gfx950-deepseek-sparse-attention/selected-domain": {
    sectionId: "deepseek-sparse-selected-domain",
    title: "The Lightning Indexer and sparse attention are separate operators",
    blocks: [
      {
        type: "table",
        headers: ["Stage", "Fixed Rust implementation", "Correctness and optimization consequence"],
        rows: [
          ["Selection boundary", "The caller supplies four scalar token IDs produced upstream; any value outside 0..16 is an invalid sentinel.", "The kernel does not pretend to implement or validate the learned Lightning Indexer."],
          ["Sparse QK", "Each Wave16 lane reads eight query/key depths for each valid token and reduces 128 products only across that subgroup.", "Twelve unselected KV rows perform no QK arithmetic; structured 2D views make every dynamic token/depth access explicit to the compiler."],
          ["Stable softmax", "The four selected scores share one maximum; invalid slots receive zero weight after max subtraction.", "The selected domain alone determines the maximum and normalizer, avoiding dense-mask work and preserving numerical stability."],
          ["Sparse PV", "The first 16 workitems accumulate one value channel from only the valid selected rows.", "Subgroup 0 owns the 16 output stores; workitem 0 alone emits the maximum and normalizer."],
        ],
      },
      {
        type: "steps",
        items: [
          "Pass the four top-k IDs as scalar kernargs so the current semantic importer sees a bounded ABI instead of an opaque dynamically indexed slice.",
          "Map each Wave16 lane to one value channel and eight depth positions, explicitly unrolling the 128-wide dot product to expose a fixed schedule.",
          "Use Wave16 subgroup reductions for the four selected dot products, then compute one max-subtracted selected-domain softmax.",
          "Reuse the validated token IDs for value gathers and give subgroup 0 exclusive output ownership.",
          "Return both softmax maximum and normalizer; log-sum-exp is maximum + ln(normalizer) when a caller needs it.",
        ],
      },
      {
        type: "callout",
        tone: "boundary",
        title: "Why this sparse profile does not use dense MFMA or transpose loads",
        text: "A 16-row dense MFMA tile would compute all token scores and then mask twelve of them, defeating this top-4 profile's selected-only arithmetic contract. The emitted scalar/vector path therefore intentionally contains no MFMA or LDS transpose instruction. All four Wave16 subgroups currently repeat the selected score calculation so no cross-subgroup synchronization or LDS exchange is required; only subgroup 0 commits outputs. That redundancy is an explicit fixed-profile limitation, not a performance claim.",
      },
      {
        type: "paragraph",
        text: "The operator boundary follows the public DeepSeek-V3.2-Exp and FlashMLA sparse-attention split: learned index generation is upstream, while sparse attention consumes explicit indices and ignores invalid entries. This lesson narrows that interface to one deterministic FP32 query, 16 KV rows, top-k 4, and 16 value channels so the complete Rust-to-HSACO and numerical path remains inspectable.",
      },
    ],
  },
  "gfx950-deepseek-sparse-attention/scope-evidence": advancedScope(
    "deepseek-sparse-scope-evidence",
    "Keep the DeepSeek operator boundary exact",
    "examples/gfx950_advanced_attention/src/kernel.rs",
    "It consumes top-k token IDs but does not implement the learned Lightning Indexer, dynamic top-k, causal or paged-cache scheduling, production FP8/BF16 KV layouts, multiple heads, variable sequence lengths, or a complete DeepSeek model layer.",
  ),
  "gfx950-compressed-hybrid-attention/fusion-contract": {
    sectionId: "compressed-hybrid-fusion-contract",
    title: "Verify each branch before the hybrid fusion",
    blocks: [
      {
        type: "steps",
        items: [
          "Define the fixed input domain summarized by the compressed-state branch and initialize every state element.",
          "Define the separate fixed key domain and mask used by the direct-attention branch.",
          "Map both branch outputs to identical logical query, head, and component coordinates.",
          "Apply the source-declared coefficients, normalization, accumulator type, and operation order.",
          "Store every fixed output coordinate once and retain isolated-branch oracle cases.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "A plausible fusion is not the source contract",
        text: "Do not infer concatenation or a different normalization from the hybrid label. The mirrored source uses three compressed four-token blocks, a local window at tokens 12-15, and sigmoid(score[0] * 0.01) to mix global and local outputs.",
      },
    ],
  },
  "gfx950-compressed-hybrid-attention/scope-evidence": advancedScope(
    "compressed-hybrid-scope-evidence",
    "Keep branch evidence and model claims separate",
    "examples/gfx950_advanced_attention/src/kernel.rs",
    "It does not establish state quality across layers, long-context accuracy, cache compression quality, or equivalence to a complete hybrid-attention architecture.",
  ),
  "gfx950-attnres-gr-mhc/mixing-contract": {
    sectionId: "attnres-gr-mhc-mixing-contract",
    title: "Name every residual stream and mixing coefficient",
    blocks: [
      {
        type: "table",
        headers: ["Concern", "Review question", "Required negative case"],
        rows: [
          ["Stream identity", "Which input stream supplies each output term?", "Swap two equal-shaped streams."],
          ["Gate or matrix", "Is the transform elementwise, per-stream, or a full mixing matrix?", "Transpose or broadcast coefficients incorrectly."],
          ["Operation order", "Does normalization happen before or after mixing and residual addition?", "Move normalization across the mix."],
          ["Aliasing", "Can output overlap an input without destroying a later read?", "Use an unsupported in-place buffer."],
        ],
      },
      {
        type: "paragraph",
        text: "AttnRes, GR, and mHC remain three source-defined contracts. Similar shapes do not justify sharing an oracle equation, coefficient interpretation, or in-place policy.",
      },
    ],
  },
  "gfx950-attnres-gr-mhc/scope-evidence": advancedScope(
    "attnres-gr-mhc-scope-evidence",
    "Limit residual mixing to the exact local transform",
    "examples/gfx950_advanced_attention/src/kernel.rs",
    "It does not validate a network topology, residual-state lifetime across layers, training dynamics, or the architectural claims associated with AttnRes, GR, or mHC papers.",
  ),
  "gfx950-speculative-mtp-verification/prefix-contract": {
    sectionId: "speculative-mtp-prefix-contract",
    title: "Acceptance is a prefix, not a set of positions",
    blocks: [
      {
        type: "steps",
        items: [
          "Gather the source-declared fixed-width candidate block and corresponding target values in range.",
          "Compute the exact per-position acceptance predicate under the source-defined deterministic policy.",
          "Find the first rejection; positions after it cannot extend the accepted prefix even if their local predicate is true.",
          "Write the accepted length and any source-defined replacement output through one final owner.",
        ],
      },
      {
        type: "table",
        headers: ["Boundary case", "Expected prefix property"],
        rows: [
          ["First candidate rejected", "Accepted length is zero."],
          ["Interior candidate rejected", "Only the consecutive earlier candidates are accepted."],
          ["Last candidate rejected", "Accepted length is fixed width minus one."],
          ["All accepted", "Accepted length is exactly the fixed candidate width."],
        ],
      },
    ],
  },
  "gfx950-speculative-mtp-verification/scope-evidence": advancedScope(
    "speculative-mtp-scope-evidence",
    "Verification is not a decoder or serving loop",
    "examples/gfx950_advanced_systems/src/kernel.rs",
    "It checks byte-identical rollback to one fixed base state, but does not provide draft generation, probabilistic sampling, a real KV cache, request scheduling, batching, or end-to-end decoding correctness.",
  ),
  "gfx950-ngram-embedding-gather/gather-contract": {
    sectionId: "ngram-embedding-gather-contract",
    title: "Bound lookup arithmetic before touching the table",
    blocks: [
      {
        type: "table",
        headers: ["Phase", "Fixed-shape obligation", "Common error"],
        rows: [
          ["Window", "Admit only token positions with the source-declared N-gram context or apply its boundary policy.", "Reading before sequence start."],
          ["Identifier", "Construct the lookup key without overflow in the admitted integer type.", "Wrapped multiplication or offset."],
          ["Resolve", "Probe all 16 slots, require both the 64-bit hash and all three tokens to match, then choose greatest priority and lowest slot on a tie.", "Treating a hash collision as an exact key match."],
          ["Gather", "Return the selected slot's integer table value, or -1 when no exact key matches.", "Claiming an embedding-vector load that the source does not perform."],
        ],
      },
      {
        type: "paragraph",
        text: "The current source uses eight queries, three tokens per N-gram, FNV-style 64-bit hashing, 16 slots, integer priorities, integer table values, and -1 for a miss. An embedding-vector gather is a future extension, not current behavior.",
      },
    ],
  },
  "gfx950-ngram-embedding-gather/scope-evidence": advancedScope(
    "ngram-gather-scope-evidence",
    "Keep table lookup local and fixed",
    "examples/gfx950_advanced_systems/src/kernel.rs",
    "It does not load embedding vectors and does not cover dynamic hash-table construction, vocabulary updates, distributed embedding tables, caching, sharding, or a full embedding subsystem.",
  ),
  "gfx950-muon-optimizer/update-contract": {
    sectionId: "muon-update-contract",
    title: "Pin one optimizer step and its working precision",
    blocks: [
      {
        type: "steps",
        items: [
          "Stage two 4 x 4 FP32 gradient shards and reduce them in fixed rank order into one matrix.",
          "Compute the Frobenius norm and divide every element by norm + 1e-6.",
          "Execute five source-declared Newton-Schulz-like updates X = 1.5 X - 0.5 (X X^T) X in order.",
          "Scale the 16 output elements by -0.05 and write the reduced norm separately.",
          "Leave parameter application, momentum, and persistent optimizer state outside this kernel.",
        ],
      },
      {
        type: "callout",
        tone: "boundary",
        title: "A step oracle is not optimizer convergence",
        text: "A CPU comparison can check the two-shard reduction, norm, five fixed iterations, and emitted update for selected matrices. It cannot establish convergence, orthogonality for all inputs, training quality, stability, or throughput.",
      },
    ],
  },
  "gfx950-muon-optimizer/scope-evidence": advancedScope(
    "muon-scope-evidence",
    "Stop at one local fixed-shape update",
    "examples/gfx950_advanced_systems/src/kernel.rs",
    "It does not apply parameters or momentum and does not include a device collective, parameter sharding, master-weight management, checkpointing, loss scaling, or optimizer convergence.",
  ),
  "gfx950-gpt-oss-120b-megakernel/layer-tile-contract": {
    "sectionId": "gpt-oss-layer-tile-contract",
    "title": "Trace the fused layer tile",
    "blocks": [
      {
        "type": "table",
        "headers": [
          "Boundary",
          "Implemented fixed contract",
          "Not implied"
        ],
        "rows": [
          [
            "Model scope",
            "One gpt-oss-120b batch-1 Wave64 tile: full 128-expert routing, one eight-head by 16-token attention tile, and one selected 16-column expert tile.",
            "A complete transformer layer, all GQA groups, all expert outputs, or whole-model inference."
          ],
          [
            "Fusion",
            "The Rust kernel retains route state, BF16 attention fragments, and sequential MXFP4 expert fragments within one dispatch.",
            "That one dispatch is faster than exact separate dispatches."
          ],
          [
            "Native ISA",
            "The retained artifact has four BF16 MFMAs and four FP4 MFMAs. Its depth-major K input requires no transpose instruction.",
            "A transpose claim for this fixed interface or peak device utilization from one Wave64."
          ],
          [
            "Evidence identity",
            "The exact c1383e97 campaign pins the displayed kernel and oracle together with namespace, LLVM, HSACO, ABI, ISA, and numerical output.",
            "A complete-layer or whole-model result, source-to-machine proof, fastest claim, or state-of-the-art result."
          ]
        ]
      },
      {
        "type": "paragraph",
        "text": "The ordinary safe Rust computes two router logits per lane, merges all 128 candidates into a stable lower-ID-first top-4, forms sink-softmax attention with four BF16 MFMAs, and consumes four scaled MXFP4 expert fragments sequentially before disjoint final stores. The safe CPU oracle independently reconstructs every admitted output."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "A layer tile is not the model",
        "text": "QKV projection, RoPE, RMSNorm, the remaining GQA groups and value columns, four complete routed experts, SwiGLU, MLP2, residuals, cache management, and every other layer remain outside this tutorial."
      }
    ]
  },
  "gfx950-gpt-oss-120b-megakernel/performance-boundary": {
    "sectionId": "gpt-oss-performance-boundary",
    "title": "Read the loss and the bound together",
    "blocks": [
      {
        "type": "steps",
        "items": [
          "Run examples/gfx950_gpt_oss_decode/run-gfx950.sh to build the ordinary Rust source through gfx950 COV6 HSACO, inspect its symbol-scoped ISA, and execute the independent HSA oracle.",
          "Run examples/gfx950_gpt_oss_decode/run-unfused-gfx950.sh for the archived c138 HIP three-dispatch router, attention, and expert comparator using the same deterministic fixture.",
          "Run perf-evidence/run-gpt-oss-performance.sh for five fresh processes per variant in alternating AB/BA order and retain all artifact and raw-record digests.",
          "Compare the archived c138 fused median of 1.064644 ms with its HIP three-dispatch median of 0.780362 ms, then derive the 188.7465 ns resource floor from 1,509,972 compulsory bytes and the audited operation ledger."
        ]
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Fusion lost for this admitted tile",
        "text": "In the archived c138 HIP comparison, the fused kernel is 1.3643x slower than the three-dispatch comparator. Sequential MXFP4 fragment consumption still improves that fused implementation by 14.1268% and removes 44 VGPRs, but that ablation does not reverse the archived comparator result. The newer da6 exact Rust component-materialization ablation is a separate campaign. No fastest or state-of-the-art claim is made."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Final integrated artifact",
        "text": "The successful MI350X campaign used the exact displayed source at commit c1383e97db732f9f1ff8105f10d5c2b5971143e1 and tree 42385e6464ca40318fc70ae104845d3997844140. The campaign binds namespace, LLVM, HSACO, ISA, ABI, correctness, and dispatch timing for this fixed tile; it does not widen the result to a complete layer, whole model, fastest claim, or state of the art."
      },
      {
        "type": "callout",
        "tone": "boundary",
        "title": "Semantic-correctness milestone",
        "text": "Milestone status: partial-current at compiler 308d8fa00fa41e098b2a1a47bbfea1bc29735464. Read the capability below together with its explicit fail-closed boundary. This lesson adds no formal compiler-refinement receipt, protected publication authority, whole-model equivalence, or universal performance result."
      }
    ]
  }
} satisfies Record<NarrativeId, NarrativeRegistryEntry>);

// The policy manifest is the single reviewed source for canonical fingerprints.
const reviewedNarrativeFingerprints = narrativeFingerprints;

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
