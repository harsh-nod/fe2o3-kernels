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

The implementation-status snapshot is pinned to fe2o3 commit
`50902b6fc4e861f4b93c40f13fb2e808b2bdc0c2`, tree
`4bc6c5a4f46a0c7cb86cbd5542ff20f170b3f940`. **The publication workflow must
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

The missing production chain is still material. Source-to-LDS-Kernel-IR
collection and `#[kernel]` WG64 contract integration remain open. The inspected
HSACO begins from the separate canonical IR and is not carried through the
protected publisher, load, and launch path. No LDS functional hardware result
has been recorded. Compiler and Verus-to-machine refinement and an IEEE
BF16/F32 numerical contract also remain open.

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
- LDS Slice 1 now has separate canonical Kernel IR, Verus source-model,
  attributed Rust source, LLVM lowering, and final-HSACO machine-shape evidence.
  The Rust function is deliberately fail-closed before output mutation. It is
  not source-collected into that LDS IR and has no protected or functional GPU
  execution evidence.
- `macro_rules!` is declarative compile-time token expansion. Vecadd uses it to
  share a small body with Verus; it is not the GPU kernel marker. `#[kernel]` is
  the procedural attribute that marks an ordinary Rust function for fe2o3's
  frontend and generated typed API. Production kernel bodies should be ordinary
  attributed Rust and do not require `macro_rules!`.
- Tiled GEMM remains a design-level curriculum despite its bounded Slice 1
  increments. Softmax, flash attention, and mixture-of-experts remain
  design-only. Their snippets are not programs users should expect to run today.
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
