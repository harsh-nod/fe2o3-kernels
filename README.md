# fe2o3 kernels curriculum

A technical tutorial workbench for writing Rust GPU kernels with
[fe2o3](https://github.com/harsh-nod/fe2o3) and reasoning about their source
models with Verus. The curriculum starts with scalar fill and vector addition,
then develops the contracts needed for collectives, tiled GEMM, online softmax,
flash attention, and mixture-of-experts routing.

This site is evidence-led. It distinguishes what the current stack runs from
what it verifies, what it observes in compiler or hardware tests, and what is
still a design. It does not present advanced tutorial pseudocode as a working
kernel.

## Audited lesson baseline

Lesson evidence claims are based on one immutable fe2o3 snapshot. This pin does
not cover the separately gated implementation-progress snapshot described
below:

| Field | Value |
| --- | --- |
| Repository | `harsh-nod/fe2o3` |
| Commit | `acb3d2752e4e50e4f4a99ebfc4b180eb79160930` |
| Tree | `f53fdf76950e392d74c17c20e0999a7727305d49` |
| Rust toolchain | `nightly-2026-04-03` |
| Primary target | `gfx942:xnack-` |

The lesson baseline was audited from source, documentation, test fixtures, Verus
runners, compiler tests, direct-link tooling, and the signed evidence model.
Commands shown in lessons that exercise fe2o3 are run from a checkout of that
exact commit, not from this documentation repository.

The deployed workbench also has an **Implementation status** reference page.
It reports a last-audited public baseline, implementation checkpoints, a
publication-gated snapshot, known blockers, and separate run/verify/evidence gates
for every kernel in the curriculum. That progress view does not silently repin
or upgrade lesson claims.

The checked-in publication gate is pinned to final public-main documentation
commit `fda1aa874dc51dfa7491cdb75f289c4277dce513`, tree
`1c51ae0849216a58e4ba34064dab670ee545c14e`. Both
`harsh-nod/fe2o3@refs/heads/main` and `powderluv/fe2o3@refs/heads/main` resolve
to that commit. This docs-only descendant contains the exact protected Slice 1
implementation and measured evidence pinned to commit
`c4fcb4d980cf979c0527dfa135a7b9f4fe72a811`, tree
`c65c6ab567409afaaef6ea39c8befcac21d47119`: attributed source-to-IR
correspondence, canonical matrix Kernel IR V5 bytes, an exact compiler-owned
descriptor and single-use inert Worker V2 handoff, an authority-free sealed
exact-profile import, direct LLVM/LLD API finalization, generated borrowed host
preparation, the one-shot protected lifecycle, and one bounded protected mi300x
measurement. It also retains the separate Slice 3 and Slice 4 upstream
LLVM/COV6 inspections and bounded Slice 1 source/model correspondence. The
newer snapshot also adds source/oracle/formal Phase A packages for masked
Wave64 collectives and workgroup synchronization. The latter now uses a typed
`DeviceGlobalMutPtr` kernel argument, an exclusive generated `GlobalMut` host
capability, and an exact linear `DynamicLds` capability. These source-level
types do not grant compiler collector/lowering, profile/descriptor, finalizer,
generated host/runtime launch, or protected gfx942 execution authority. The
lesson snapshots for those source-only milestones remain byte-pinned to commit
`d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8`, tree
`cdec8448a300aa71d17565ca50fd4d893932f602`, rather than silently following the
newer publication gate. The snapshot also carries the row-softmax V1 inert
verification certificate: 18
Verus obligations and seven named negative fixtures bind exact reviewed source,
policy, proof, compiler-profile, Kernel IR, target, and tool identities. The
certificate itself grants no compiler, artifact, launch, or hardware authority. The
public snapshot also isolates the 64-connection broker-capacity test from the
separate concurrent executable-authentication and descriptor-transfer test, so
hosted CI exercises each bounded property without coupling their deadlines. The
publication workflow continues to require both public refs to resolve exactly
to the gated commit before deployment. The last audited public baseline remains
`96b9890c3ad33ad8c6b4239a9b567728a176d65f`, tree
`f911f0c693238830ad6070b2674fb863857bfec1`.

The pinned snapshot retains the production S09
checkpoint that canonically captures the
production rustc invocation descriptor, admits exactly
`/proc/./self/fd/198` as the backend capability, and enforces one final managed
codegen-backend selector. A real `cargo-fe2o3`/Worker test published a COV6
`gfx942:xnack-` HSACO containing exactly `alpha`, decoded and bound its durable
publication record to the inspected bytes, and retained a reproducible mi300x
observation. These are inert observations: they prove no compiler origin and
grant no loading, execution, or verification authority. Canonical cwd pathname
capture does not bind that pathname to the separately pinned cwd object, and
the scalar profile establishes no general source or output-object association.

The staged tiled-GEMM facts are defined once as atomic, typed evidence records
in [`src/content/staged-evidence.ts`](src/content/staged-evidence.ts). Claims,
lesson tables, progress checkpoints, exact commands, source paths, and limited
authority labels are rendered from those records and rejected if they drift.
The earlier hardware entry records one bounded observation through a raw
harness; it is not protected execution evidence or a source-to-HSACO result.
The later #100 entry is a distinct bounded protected route measurement and does
not retroactively strengthen that earlier record.

The previous WG64/288-byte build-scoped fragment probe remains separate from
both the 320-byte four-slice direct-global profile and the independent
WG256/384-byte mutation. Four newer commits add bounded LDS Slice 1 evidence:
canonical two-tile Kernel IR at `4c79c58de`, a Verus model reporting 93
verified and 0 errors at
`97373b781`, fail-closed ordinary `#[kernel(typed, ...)]` Rust source at
`ee76cedcd`, and upstream LLVM/LLD plus final-HSACO machine inspection at
`50902b6fc`. These are separate records, not a functional or production kernel.

Slice 2 at `aba53376b` verifies one through four complete K phases with 196
verified and 0 errors, rejects missing-reuse and accumulator-reset mutations,
and exhaustively runs integer event models for 1, 2, and 4 phases. This is
proof/model evidence only. It establishes no attributed multi-phase GPU source,
protected runtime, or hardware result, and grants no authority to the later
backend artifact.

Slice 1 hardware evidence at `79ad22986` is a separate observation. An ignored
opt-in harness generated HSACO from the canonical Kernel IR using SHA-pinned
upstream LLVM 22 `llc`, `ld.lld`, and `llvm-objdump`, without COMGR. On MI300X,
six cases checked 1,536 outputs, unchanged A/B values, and prefix/suffix
canaries around A, B, and C; one hardware test passed in 33.72 seconds. This
does not bind the IR to attributed Rust source or Verus proofs, grant publisher
or protected launch authority, or prove general memory safety or race freedom.

K32 Slice 2 backend evidence at `b94bd7d78` lowers the canonical graph to a
real two-trip SSA loop with carried FP32 accumulators, two barriers, reused
1,024-byte LDS, and one static loop-body BF16 MFMA. Its upstream LLVM 22 final
artifact machine test passed; the full dialect suite passed 120 tests and
strict Clippy passed. This remains backend and machine-shape evidence only: it
has no attributed multi-phase source, hardware run, protected authority, or
LLVM refinement proof.

Commit `280995762` moves the exact WG64 launch contract into the general typed
`#[kernel]` macro path. Required-only WG64 and WG256 remain compatible while
fixed WG256 profiles reject WG64, and tiled Slice 1 no longer contains a
handwritten frontend sidecar. Commit `dc31f23eb` then authenticates the exact
ordinary attributed source, reachable portable MIR, trusted device items,
FnAbi, launch contract, target, and compiler-derived 1,024-byte LDS profile to
select only the verified canonical Slice 1 Kernel IR. Removed-barrier,
A-index-drift, and same-spelling-helper mutations fail before selection. At
that commit this was reviewed source-to-IR correspondence, not compiler
refinement, and the receipt deliberately stopped before descriptor construction
and Worker V2.

Commit `1429ed6ae` adds canonical Kernel IR V5 bytes for every current matrix
operand and profile field while leaving V1 through V4 frozen. Commit
`7337a2b87` then carries the original source-authenticated pre-section LLVM body
through an exact compiler descriptor into one single-use inert Worker V2
handoff. The handoff binds source authority, V5 Kernel IR, descriptor, resources,
LLVM body, symbol manifest, target, COV6, and envelope. It authenticates no
compiler origin and grants no worker, linker, final-HSACO, loading, launch,
hardware-execution, or production proof-certificate authority.

Commit `89ebe69bb` adds a stable closed registry with distinct Slice 1,
K-phase, Grid, and Edges slots. Only exact M16 N16 K16 Slice 1 admission is
enabled; the other three slots fail closed as reserved. Slice 1 reconstructs
canonical Kernel IR V5, independently re-lowers it with upstream
`dialect-amdgcn`, and requires exact LLVM, descriptor, source-authority,
resource-transcript, target, COV6, ABI, grid, WG64, 1,024-byte LDS, typed effect,
and role-separated length bindings. The retained compiler import is non-Clone
and authority-free: it grants no compiler-origin, finalizer, Worker V2, linker,
publication, load, launch, hardware, numerical, or Verus proof authority.

Commits `6a3f7afe9`, `bb2c2100f`, and `bfe9dfeef` complete #97 by
implementing, admitting, and integrating the exact Slice 1 upstream LLVM
target-machine plus LLD library API Worker V2 finalizer. The public API has no
COMGR, shell `llc`, or shell `ld.lld` escape hatch. It closes the exact
`gfx942:xnack-` COV6 WG64 symbol, 48-byte explicit and 304-byte complete ABI,
1,024-byte LDS, zero-private-segment, and relocation-free artifact profile while
retaining deterministic compiler-handoff, worker, LLVM, descriptor, and output
lineage. The finalized receipt remains inert: it authenticates no compiler
origin, proves no Verus or compiler/LLVM/machine refinement result, and grants no
publication, protected load, dispatch, or launch authority.

Commit `278a41afb` completes #99 with the generated exact BF16/F32 Slice 1
host adapter. A and B are 256-element `u16` BF16-bit shared read views, C is a
256-element `f32` unique read/write view, A/B overlap is allowed, and any C
overlap is rejected. Preparation constructs the exact 48-byte explicit and
304-byte complete COV6 ABI and copies the sealed import, profile, contract,
descriptor, and role-separated length identities. It then releases the compiler
import borrow so finalization can consume that non-Clone import while all three
device buffers remain borrowed by the adapter. The adapter exposes no raw
kernarg or launch operation. The final gated snapshot contains both the #97 and
#99 increments. Subsequent runtime feature-gating maintenance makes default and
`hardware-test-hooks` strict all-target runtime Clippy pass and adds no
functional claim by itself.

The protected implementation checkpoint at
`c4fcb4d980cf979c0527dfa135a7b9f4fe72a811`
completes #100 resource observation, production-adapter integration, metadata
hardening, and protected hardware validation. Private, non-Clone states consume
ownership in the fixed `Joined -> Loaded -> Completed -> Unloaded` order. The
join consumes the #97 finalized artifact and #99 borrowed adapter, and no state
exposes finalized bytes, native handles, or a generic or raw launch operation.

Admission checks the exact retained context identity and the physical device,
agent, HIP ordinal, runtime instance, `gfx942:xnack-` target, executable, and
`tiled_gemm_lds_v1` kernel identities. It also checks the exact grid 1,
WG64/wave64 geometry, 1,024-byte static LDS, zero private and dynamic segments,
the 48-byte explicit plus 256-byte implicit 304-byte complete COV6 ABI, and the
descriptor and HSA staging alignments. The finalized artifact and borrowed
A/B/C views remain owned through the single synchronous dispatch; only a
validated completion releases those borrows, leaving `Completed` with terminal
unload authority and `Unloaded` as an inert identity receipt.

On failure before packet publication, the production adapter cancels the
prepared dispatch and releases its queue and kernarg before the selected kernel
is released and the executable is unloaded. Failures after proven quiescence
and dropping `Loaded` or `Completed` also perform one checked unload. Adapter
unwind, unload failure, or ambiguous unload observation aborts. A post-submit
queue error or
completion deadline is process-terminal: submitted resources are retained
because GPU quiescence is unknown, and the process aborts instead of returning
or attempting an ordinary unload. Fake-adapter tests, now in
`crates/fe2o3-host/src/generated_lds_gemm_lifecycle_tests.rs`, continue to cover
substitution, cleanup, and terminal paths.

The actual public protected route passed 1/1 in 14.36 seconds on mi300x gfx942
with `HSA_XNACK=0`. It used Worker ID
`fe2o3-worker-v1-sha256-6c3dfd5f784b3babe140006aba57a214a897b171860928440184fa201b6f96db`
and LLVM build
`upstream-llvmorg-22.1.8-ca7933e47d3a3451d81e72ac174dcb5aa28b59d1`.
The test compared all 256 output bit patterns with the CPU reference, required A
and B to remain unchanged, and checked all A/B/C guard canaries. It emitted:

```text
FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0 finalizer=078e9b523164b679ff7af3b4e819ad041713c53c6841399ac7cea95090f09774 unload=df2f77ee798444a9e1fe5e27f219bdf720386eb8603a9a74fccc0df8efb3921c
```

The `gemm-tiling` and `gemm-proof-plan` lessons now expose that bounded Slice 1
increment directly. Their Kernel tabs reproduce the complete ordinary
`#[kernel(typed, ...)]` file from `examples/tiled_gemm_v1/src/kernel.rs` at
`c4fcb4d980cf979c0527dfa135a7b9f4fe72a811` byte for byte. Their Verus tabs
link the exact bounded source/model proof at `5a45239ae` and show its pinned
replay command. Their Host tabs link and show the protected Worker V2 hardware
test command at `c4fcb4d9`; the Result tabs record the exact marker, worker and
LLVM identities, 256 bitwise oracle matches, immutable A/B checks, all A/B/C
guard canaries, and the 14.36-second result. This is a real fixed-shape source
and measured route, not tutorial pseudocode. Each promoted Kernel, Verus, and
Host tab also names the canonical evidence record that covers its exact source
path and commit; curriculum validation rejects missing or mismatched links.

This is one exact bounded Slice 1 protected hardware observation. It does not
authenticate compiler origin, consume a Verus certificate, establish
MIR-to-Kernel-IR or Kernel-IR-to-LLVM/ISA refinement, generally prove
illegal-access or race freedom, generalize GEMM, or cover protected Slice 3 or
Slice 4. The earlier observational MI300X tiled-GEMM run remains separate.

Commit `5a45239ae` adds a bounded Verus relation for the exact Slice 1 source
model. It reports 96 verified and 0 errors for exact lengths, same-epoch LDS
initialization, publish-barrier ordering, unique C ownership, and correspondence
among the attributed profile, portable-MIR receipt, reviewed correspondence,
and canonical module identities. Four targeted mutations are rejected. Clean
MI300X validation passed 76 debug tests, 76 release tests, 7 doctests in each
lane, strict Clippy, all six positive proof groups, and all 21 expected
rejections. This is identity-bound source/model correspondence only. It does
not prove rustc/MIR-to-IR semantics, LLVM, linking, emitted machine behavior,
Worker V2 integrity, certificate consumption, loading, or launch authority.

Slice 3 at `5bc57587b` adds a fixed-K16 grid/stride source model for positive
tile-aligned M and N. Verus reports 101 verified and 0 errors for padded
lda/ldb/ldc bounds, exact and injective workgroup-to-tile mapping, four bounded
stores per lane, and global disjointness of C ownership. The aggregate runner
now checks positive summaries of 73, 93, 196, and 101 obligations and requires
12 expected negative rejections. Ordinary models exhaust 1x1 through 3x3 grids
with representative padding and a 64x48 case with lda=33, ldb=79, and ldc=96.
Commit `f38fe82ca` separately lowers the exact M=64, N=48, K=16, lda=33,
ldb=79, ldc=96, 3x4-grid graph through upstream LLVM 22. The final-object test
observes gfx942:xnack- COV6, WG64, workgroup X/Y, 1,024-byte LDS, one barrier,
one BF16 MFMA, and no spills, scratch, calls, atomics, or COMGR. This is exact
IR-derived machine-shape evidence, not protected execution, hardware numerics,
or compiler refinement.

Slice 4 at `f24063534` seals an exact M=17, N=19, K=18 Kernel IR graph over a
2x2 WG64 grid. It carries FP32 accumulators across two K16 phases, zero-fills
BF16 tails into reusable XOR4 LDS, uses unconditional publish and reuse
barriers, and predicates C reads and writes for alpha=2 and beta=-1. Nine tests
exhaust the valid/tail coordinate and ownership domains and reject barrier,
access, phase, accumulator, coefficient, target, resource, and layout drift.
Commit `35575cc32` lowers only that exact graph through upstream LLVM 22 and
passes final gfx942:xnack- COV6 machine inspection. The object has WG64/wave64,
1,024-byte fixed LDS, zero private segment and spills, LDS traffic, two static
barriers, one static loop-body BF16 MFMA, and no scratch, calls, atomics, or
COMGR. Clean current-main validation passed 5 active focused tests with 1
intentional ignore, the exact ignored machine test, 129 active dialect tests
with 23 intentional ignores, strict Clippy, and 362 active Kernel IR tests with
1 intentional ignore. This remains IR-derived machine-shape evidence, not
attributed-source lowering, protected execution, hardware numerics, or compiler
refinement.

The missing production chain is still material. Source receipt to the inert
descriptor and Worker V2 boundary is complete in closed
[`#85`](https://github.com/harsh-nod/fe2o3/issues/85), and canonical matrix wire
V5 is complete in closed [`#93`](https://github.com/harsh-nod/fe2o3/issues/93).
The sealed exact-profile registry in
[`#96`](https://github.com/harsh-nod/fe2o3/issues/96), direct LLVM/LLD API
finalizer in [`#97`](https://github.com/harsh-nod/fe2o3/issues/97), and generated
host adapter in [`#99`](https://github.com/harsh-nod/fe2o3/issues/99) are
complete. Under [`#94`](https://github.com/harsh-nod/fe2o3/issues/94), the exact
one-shot `Joined -> Loaded -> Completed -> Unloaded` implementation in
[`#100`](https://github.com/harsh-nod/fe2o3/issues/100) is also complete. Its
fake-adapter suite is joined by one exact protected mi300x hardware measurement.
That bounded result is not compiler-origin authentication, source-to-HSACO or
Verus authority, general illegal-access or race-freedom proof, generalized
GEMM, or protected Slice 3/4 execution.
Exact Slice 4 lowering is complete and
[#86](https://github.com/harsh-nod/fe2o3/issues/86) is closed. Protected Slice
3 and Slice 4 execution remain open in
[#88](https://github.com/harsh-nod/fe2o3/issues/88) and
[#89](https://github.com/harsh-nod/fe2o3/issues/89), and generalized dimensions,
strides, tails, and coefficients in
[#90](https://github.com/harsh-nod/fe2o3/issues/90). Bounded #87 groundwork is
integrated, but production certificate consumption remains open in
[#91](https://github.com/harsh-nod/fe2o3/issues/91), relation extension through
K-phase, grid, and edge profiles in [#92](https://github.com/harsh-nod/fe2o3/issues/92),
and MIR-to-Kernel-IR semantic refinement in
[#106](https://github.com/harsh-nod/fe2o3/issues/106). This synchronization pass
is tracked in
[`fe2o3-kernels#2`](https://github.com/harsh-nod/fe2o3-kernels/issues/2).
Compiler and Verus-to-machine refinement and an IEEE BF16/F32 numerical
contract also remain open. No production LDS GEMM source execution is claimed.

The latest head also adds authenticated Verus execution V2 for Linux x86_64
against pinned local runtime and tool snapshots. It uses `clone3` pidfds and
ptrace-unresumable checkpoints, denies process creation with seccomp, compares
the live executable to its backing, pins the runtime closure, baseline, and
vDSO, and returns immutable sealed results. Its artifact policy rejects
compressed and alternate debug sections. Package-scoped debug stripping makes
the debug artifact reproducible, with a bounded two-root SHA-256, size, and
Build-ID gate. On the pinned local host, debug V2 integration passed 14/14,
release passed 13/13, and the full verifier debug/release suites plus 22 doctests
passed. The same run on MI300X correctly failed closed against a different vDSO
and runtime baseline.

Authenticated V2 does not integrate stock Verus or Z3, establish semantic proof
validity, guarantee exclusive measured-image execution between checkpoints,
prove compiler refinement, or grant GPU authority.

Earlier commit `027ab901bef7007d0e8da3370470556ed28baad1` remains the source
of the exact official gfx942 A/B/C/D register maps pinned to AMD Matrix
Instruction Calculator commit
`2ef91896bcdc4d26624f952e5c905c787cd9bc9e`, executable XOR4 A and
transposed-B staging, exhaustive 64-lane x 4-component goldens, exact
source-level Rust-Verus correspondence, pinned Verus executable bytes, 23
public proof functions covering 73 obligations, and five rejected formula
mutations. Workflow-only descendant
`a51c78322e264c06abdb6dc21817aced09653830` installs Rust 1.97.1 for the
hosted Verus job and changes no proof or kernel semantics. The layout packet
remains source-level evidence. Later tiled checkpoints and their authority
limits are intentionally not restated here; the typed staged-evidence records
are the canonical source rendered by the site.

## Maturity labels

Every technical claim uses one of five labels. A non-design claim is invalid
unless it includes the exact fe2o3 commit and tree, at least one command, and at
least one source path. Staged progress references additionally require explicit
claim and limited-authority labels. Runtime claims also require a target
identity.

| Label | Meaning | Does not imply |
| --- | --- | --- |
| Runnable now | A current fe2o3 path builds and executes the named kernel. | Formal correctness or a fully safe host ABI. |
| Verus model | Verus checks a source or source-model property. | Refinement from Rust/MIR through the emitted machine code. |
| HSACO mechanics | A compiler, LLVM, linker, or code-object mechanism has focused tests. | End-to-end kernel correctness on hardware. |
| GPU observed | A documented hardware campaign ran a pinned target and command. | A proof for all inputs, targets, or compiler versions. |
| Design only | The lesson is an implementation and proof plan. | Compilability or runtime support in the audited stack. |

The schema enforcing these rules lives in
[`src/content/model.ts`](src/content/model.ts) and
[`src/content/validate.ts`](src/content/validate.ts). Unit tests reject missing
evidence and advanced lessons that claim runnable status.

## Current boundary

At the audited pin:

- Scalar fill is runnable, with a legacy raw launch boundary called out in the
  lesson.
- Typed vector addition is the strongest current single-source runnable path.
- The associated Verus models cover bounds, initialization, overflow
  obligations, and injective ownership arguments at the modeled source level.
- Exact ordinary attributed Rust sources now exist for one masked Wave64
  reduction/scan profile, one LDS reduction, and a separate scoped atomic add.
  Their CPU oracles, mutation suites, and Verus models are public. The atomic
  source carries global address-space identity through `DeviceGlobalMutPtr`,
  generated host admission uses an exclusive `GlobalMut`, and LDS scratch
  consumes an exact linear `DynamicLds` capability. Compiler collector/lowering,
  profile/descriptor construction, finalization, generated host/runtime launch,
  and protected gfx942 execution remain open, so these are source/model
  milestones rather than functional hardware kernels.
- The tiled-GEMM checkpoint now has source-authenticated selection of the
  canonical direct-global one-tile Kernel IR, a guarded gfx942 hardware harness
  for separately supplied bytes, and structural Worker V2 artifact admission.
  One exact externally supplied 6,672-byte artifact has now passed the guarded
  MI300X run, bitwise oracle, A/B/C unchanged-value comparison, adjacent
  canaries, and unload checks. The observation is non-authoritative and does not
  join the Rust source to those bytes.
- LDS Slice 1 now has canonical Kernel IR and V5 matrix wire bytes, a separate
  Verus source model, authenticated attributed Rust source-to-IR correspondence,
  bounded identity-bound source/model proof, an exact compiler-owned descriptor,
  a single-use Worker V2 handoff, exact direct LLVM/LLD API finalization, an
  inert generated host adapter, a one-shot `Joined -> Loaded -> Completed ->
  Unloaded` lifecycle implementation, LLVM lowering, and final-HSACO
  machine-shape evidence. The exact production route also has one bounded
  protected mi300x run over 256 outputs with unchanged A/B values, A/B/C guard
  canaries, bitwise CPU-reference agreement, and terminal unload identity.
  An independent six-case MI300X run observed the IR-derived HSACO over 1,536
  outputs with allocation canaries. That hardware run remains independent of the
  source-bound finalization and host-preparation records, so it is neither
  protected source execution nor a source-to-hardware refinement result.
- LDS Slice 2 has a bounded exact-real K-phase Verus model, executable integer
  event models for 1, 2, and 4 phases, and an independent K32 backend/final
  machine-shape record. It has no attributed multi-phase GPU source, runtime
  hardware execution, protected authority, or LLVM refinement proof.
- LDS Slice 3 has a bounded fixed-K16 Verus grid/stride model plus exact
  upstream LLVM/LLD and COV6 machine-shape inspection for one padded 3x4 grid.
  It has no attributed source, protected execution, hardware numerical, or
  refinement result.
- LDS Slice 4 has exact tail-safe two-phase Kernel IR and upstream LLVM/COV6
  machine-shape inspection for one 17x19x18 profile, including alpha/beta and
  predicated edge access. It has no attributed source, protected runtime or
  hardware numerical execution, compiler refinement, or general profile.
- `#[kernel]` is the canonical user form. The procedural attribute marks an
  ordinary Rust function for fe2o3's frontend and generated typed API, including
  exact WG64/WG256 launch contracts. Slice 1 now reaches canonical Kernel IR, an
  exact descriptor, a one-shot inert final HSACO receipt, and generated typed
  host preparation, then enters a fixed one-shot lifecycle with exact context,
  resource, ABI, completion, and terminal-unload checks. This implementation
  exposes no generic or raw launch. One exact bounded protected Slice 1 run has
  passed; it does not authenticate compiler origin or establish source-to-HSACO,
  Verus, compiler-refinement, generalized-safety, or generalized-GEMM authority.
- `macro_rules!` is optional declarative compile-time token expansion. Vecadd
  uses it to share a small body with Verus; it is not the GPU kernel marker,
  creates no runtime mechanism, and proves nothing by itself. Production kernel
  algorithms should remain ordinary attributed Rust and do not require it.
- Tiled GEMM's exact fixed `16x16x16` Slice 1 Kernel, Host, and Result tabs are
  real and pinned. Its generalized dimensions, K phases, grids, tails,
  coefficients, and complete authority chain remain a design-level curriculum.
  Softmax, flash attention, and mixture-of-experts remain design-only; their
  snippets are not programs users should expect to run today.
- The production path described by the audited repository is Rust to Kernel IR
  to direct LLVM/LLD to HSACO, followed by machine-effect inspection and
  protected evidence. The #97 path uses direct LLVM target-machine and LLD
  library APIs, never COMGR linking.

Verus proves the specifications encoded in its source models under their stated
assumptions. It does not by itself prove LLVM lowering, linker behavior, the
HSACO machine effects, the ROCm runtime, numerical error beyond the stated
model, or physical hardware. Those gaps require compiler validation,
code-object inspection, differential tests, canaries, and target-specific GPU
evidence.

CUDA and HIP kernels can also be analyzed or verified with external tools. The
fe2o3 direction explored here is different: keep the kernel in Rust and bind
explicit source proof, compiler evidence, artifact identity, and hardware
observations to the same reviewed unit. This repository makes no claim that
other GPU languages are inherently unverifiable.

## Curriculum

The documentation app contains 18 lessons across nine modules:

0. Evidence orientation and an MI300X/gfx942 setup.
1. Fill, typed vector addition, indexing, `DisjointSlice`, and launch shape.
2. Verus contracts, negative tests, overflow freedom, initialization, and
   injective writes.
3. Bounded reduction/scan semantics, wave64, barriers, atomics, and LDS.
4. Tiled GEMM invariants, phase ownership, numerical specifications, and proof
   decomposition.
5. Softmax and flash-attention design with online invariants, masking, and
   numerical contracts.
6. MoE top-k assumptions, scans, permutation, capacity bounds, expert GEMM, and
   deterministic dispatch.
7. Rust-to-HSACO evidence, machine-effect checks, protected evidence, and the
   Verus trust boundary.
8. Exercises and the contribution evidence packet for a new kernel.

The first screen is the tutorial workbench: desktop curriculum tree or mobile
drawer, lesson progress, evidence labels, four code tabs, exercises, glossary,
search, architecture view, and light/dark themes.

## Local development

Prerequisites are Node.js `22.22.1` or newer and npm. Dependencies are locked in
`package-lock.json`.

```bash
nvm use
npm ci
npm run dev
```

Vite prints the local URL. The production build uses the GitHub Pages base path
`/fe2o3-kernels/` and hash routes so lesson links work from a static host.

## Tests

Install the Playwright Chromium binary once, then run the complete suite:

```bash
npx playwright install chromium
npm run test:all
```

The gates are also available separately:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Vitest validates the content schema, status labels, evidence pins, glossary,
search, navigation, tabs, copy behavior, theme, and progress state. Playwright
checks every internal lesson route plus the glossary and architecture pages,
desktop and mobile navigation, keyboard search, code tabs, persisted progress,
theme behavior, screenshots, and page-level horizontal overflow.

Tutorial snippets live in `examples/`. Runnable-looking advanced snippets carry
an explicit `DESIGN ONLY` marker. They are not compiled against fe2o3 because
the audited frontend does not expose those end-to-end source paths; treating
them as compile tests would create false authority.

## Content structure

```text
examples/                 Snippet sources imported into lessons
src/content/model.ts      Evidence and lesson schema
src/content/validate.ts   Runtime schema validation
src/content/modules-*.ts  Structured lesson content
src/components/           Tutorial workbench views
src/diagrams/             Code-native technical diagrams
tests/                    Schema and interaction tests
e2e/                      Responsive route and browser tests
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before adding a lesson or changing a
maturity label.

## Deployment

On a push to `main`, GitHub Actions builds and deploys `dist/` only after
authenticated Git resolution confirms that both required fe2o3 public refs
equal the checked-in publication target. Workflow permissions are scoped per
job, deployment is serialized, and actions are pinned to immutable commit SHAs.

Pull requests and pushes also run lint, type checking, unit tests, the production
build, and Chromium browser tests. A green site build is not evidence that a GPU
claim is true; the content evidence rules remain a separate gate.

## Honesty policy

1. Never infer a stronger status from a weaker one. A passing Verus model is not
   a GPU run; an HSACO inspection is not a source proof.
2. Never label an example runnable without an exact command, immutable fe2o3
   commit and tree, source paths, and target where execution is involved.
3. Keep expected-negative verification tests next to positive proof claims.
4. State assumptions, trusted components, and unproved obligations in the
   lesson itself.
5. Downgrade stale claims when the pinned source or command can no longer be
   reproduced. Do not silently move the lesson evidence baseline.
6. Treat design code as explanatory material until a real frontend path,
   compiler test, code-object check, and appropriate hardware test exist.

## License

This tutorial site is available under the [MIT License](LICENSE). Source links
and evidence references point to fe2o3, which retains its own licensing and
copyright notices.
