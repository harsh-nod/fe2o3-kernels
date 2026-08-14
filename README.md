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

## Audited baseline

All implementation and proof claims are based on one immutable fe2o3 snapshot:

| Field | Value |
| --- | --- |
| Repository | `harsh-nod/fe2o3` |
| Commit | `acb3d2752e4e50e4f4a99ebfc4b180eb79160930` |
| Tree | `f53fdf76950e392d74c17c20e0999a7727305d49` |
| Rust toolchain | `nightly-2026-04-03` |
| Primary target | `gfx942:xnack-` |

The baseline was audited from source, documentation, test fixtures, Verus
runners, compiler tests, direct-link tooling, and the signed evidence model.
Commands shown in lessons that exercise fe2o3 are run from a checkout of that
exact commit, not from this documentation repository.

The deployed workbench also has an **Implementation status** reference page.
It reports the newer public `fe2o3` main revision, private acceptance candidates,
known blockers, and separate run/verify/evidence gates for every kernel in the
curriculum. That progress view does not silently repin or upgrade lesson claims.

The current public progress head is fe2o3 commit
`96b9890c3ad33ad8c6b4239a9b567728a176d65f`, tree
`f911f0c693238830ad6070b2674fb863857bfec1`. It retains the production S09
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

The tiled-GEMM descendants separate block counts, wave64 workgroup
dimensions, and derived AQL work-item dimensions in the checked host contract.
They also add a sealed, target-neutral one-wave `16x16x16` Kernel IR graph with
12 direct global reads, one BF16/BF16/F32 MFMA, four observable F32 stores, and
exhaustive 64-lane ownership tests. The new public frontend checkpoint adds
build-scoped, in-process Rust provider and ABI evidence. It rejects same-name
external providers and copied markers; canonicalizes and digests observed
layouts, `FnAbi`, and provider facts through Kernel IR; projects 8 BF16 plus 4
F32 values into 32 explicit bytes plus a 256-byte implicit suffix (288 bytes
total); and binds `gfx942:xnack-`, wave64, and strict floating-point behavior.
Genuine LLVM contains the MFMA before final probe compilation. An opt-in ROCm
7.2.4 test passed on MI300X and validates final HSACO metadata only, not retained
MFMA execution or numerical behavior.

This frontend provenance is intentionally build-scoped. Hostile layout and
`FnAbi` fixtures currently reject earlier at source-root binding, and the
structured matrix evidence has no actual matrix Kernel IR wire payload. The
checkpoint therefore does not establish that this frontend emits the canonical
graph. There is still no dedicated canonical tiled lowering, functional final
HSACO with audited retained MFMA and stores, hardware numerical execution, LDS
composition, memory or race proof, or protected authority.

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
remains source-level evidence; the newer build-scoped frontend checkpoint does
not establish compiler refinement, MFMA numerical equivalence, functional
HSACO or hardware execution, machine memory safety, race freedom, or protected
authority.

## Maturity labels

Every technical claim uses one of five labels. A non-design claim is invalid
unless it includes the exact fe2o3 commit, at least one command, and at least one
source path. Runtime claims also require a target identity.

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
- The public tiled-GEMM checkpoint now has unambiguous block/workgroup/AQL
  geometry, a canonical direct-global one-tile Kernel IR graph, and separate
  build-scoped Rust frontend/provider/ABI evidence. Dedicated canonical tiled
  lowering, result-retaining functional HSACO, LDS composition, numerical GPU
  execution, memory and race proofs, and protected authority are still open.
- Tiled GEMM, softmax, flash attention, and mixture-of-experts are design-only
  curricula. Their snippets decompose the implementation and proof work; they
  are not fe2o3 programs users should expect to compile today.
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

GitHub Actions builds the static app and deploys `dist/` to GitHub Pages on each
push to `main`. Workflow permissions are scoped per job, deployment is
serialized, and third-party actions are pinned to immutable commit SHAs.

Pull requests and pushes also run lint, type checking, unit tests, the production
build, and Chromium browser tests. A green site build is not evidence that a GPU
claim is true; the content evidence rules remain a separate gate.

## Honesty policy

1. Never infer a stronger status from a weaker one. A passing Verus model is not
   a GPU run; an HSACO inspection is not a source proof.
2. Never label an example runnable without an exact command, immutable fe2o3
   commit, source paths, and target where execution is involved.
3. Keep expected-negative verification tests next to positive proof claims.
4. State assumptions, trusted components, and unproved obligations in the
   lesson itself.
5. Downgrade stale claims when the pinned source or command can no longer be
   reproduced. Do not silently move the baseline.
6. Treat design code as explanatory material until a real frontend path,
   compiler test, code-object check, and appropriate hardware test exist.

## License

This tutorial site is available under the [MIT License](LICENSE). Source links
and evidence references point to fe2o3, which retains its own licensing and
copyright notices.
