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

The publication-gated repository snapshot is pinned to fe2o3 commit
`89ebe69bb3daf8262a485463c5fdf04cf095346f`, tree
`c2604487ec76f337d7ada2c0319fffd02b3ce8c9`. It includes exact Slice 1
attributed source-to-IR correspondence, canonical matrix Kernel IR V5 bytes,
an exact compiler-owned descriptor and single-use inert Worker V2 handoff, an
authority-free sealed exact-profile import, Slice 3 and Slice 4 upstream
LLVM/COV6 inspection, and bounded identity-bound Slice 1 source/model
correspondence. These records remain separate from final HSACO publication,
protected loading, launch, hardware execution, and production proof-certificate
authority. **The publication workflow must
not deploy this site revision until both `harsh-nod/fe2o3@refs/heads/main` and
`powderluv/fe2o3@refs/heads/main` resolve exactly to that commit.** The last
audited public baseline remains
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
The hardware entry records one bounded hardware observation through that harness;
it is not protected execution evidence or a source-to-HSACO result.

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
The shared finalizer, host adapter, and protected runtime substrate remain open
in [`#94`](https://github.com/harsh-nod/fe2o3/issues/94). The sealed exact-profile
registry in [`#96`](https://github.com/harsh-nod/fe2o3/issues/96) is complete;
the finalizer in [`#97`](https://github.com/harsh-nod/fe2o3/issues/97) and host
adapter in [`#99`](https://github.com/harsh-nod/fe2o3/issues/99) are now
independently claimable, with protected runtime integration in
[`#100`](https://github.com/harsh-nod/fe2o3/issues/100) downstream.
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
- Bounded wave64 collectives, LDS/barrier/atomic contracts, target gates, and a
  narrow MFMA tile profile exist in APIs, models, Kernel IR, or lowering tests.
  The site labels those focused mechanics separately from runnable kernels.
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
  a single-use inert Worker V2 handoff, LLVM lowering, and final-HSACO
  machine-shape evidence.
  An independent six-case MI300X run observed the IR-derived HSACO over 1,536
  outputs with allocation canaries. That hardware run remains independent of the
  source-bound inert handoff, so it is neither protected source execution nor a
  source-to-hardware refinement result.
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
  exact descriptor, and an inert Worker V2 handoff, then fails closed before
  finalization, protected loading, or launch.
- `macro_rules!` is optional declarative compile-time token expansion. Vecadd
  uses it to share a small body with Verus; it is not the GPU kernel marker,
  creates no runtime mechanism, and proves nothing by itself. Production kernel
  algorithms should remain ordinary attributed Rust and do not require it.
- Tiled GEMM remains a design-level curriculum despite its bounded Slice 1
  through Slice 4 increments. Softmax, flash attention, and
  mixture-of-experts remain design-only. Their snippets are not programs users
  should expect to run today.
- The production path described by the audited repository is Rust to Kernel IR
  to direct LLVM/LLD to HSACO, followed by machine-effect inspection and
  protected evidence. Linking is described through LLVM/LLD APIs, not COMGR.

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
