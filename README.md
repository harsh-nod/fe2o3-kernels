# fe2o3 kernels

**[Open the live curriculum](https://harsh-nod.github.io/fe2o3-kernels/)**
| **[Follow the GPU capability pipeline](https://harsh-nod.github.io/fe2o3-kernels/#/gpu-capabilities)**
| [Implementation status](https://harsh-nod.github.io/fe2o3-kernels/#/status)

fe2o3-kernels is the executable curriculum and example corpus for
[fe2o3](https://github.com/harsh-nod/fe2o3), a Rust GPU kernel compiler. It
teaches kernel construction from indexing and ownership through workgroup
coordination, tiled matrix operations, attention, and mixture of experts while
keeping source, reference behavior, compiler fixtures, and evidence boundaries
visible.

This repository contains the learning site, ordinary Rust kernel examples,
independent CPU references or semantic simulations, tests, and the shared
tutorial compiler-corpus contract. The compiler and runtime live in the
[fe2o3 repository](https://github.com/harsh-nod/fe2o3).

## Runnable and bindable examples

Every tutorial kernel is presented as a runnable, bindable example rather than
detached pseudocode:

- **Runnable** means the lesson names a concrete operation that exercises the
  example through a CPU reference, semantic simulator, production compile,
  and/or target-specific hardware runner.
- **Bindable** means the kernel has an identified package and source boundary
  mapped to exact compiler fixture IDs and required gates in the shared
  manifest.
- **Evidence-specific** means a CPU run, compiler result, artifact inspection,
  and hardware observation remain different claims. A runnable example is not
  automatically hardware-qualified or proven correct.

Use the exact command and compiler revision shown by a lesson. Some examples
run without a GPU; others require the matching fe2o3 checkout, ROCm environment,
and GPU target.

## Current qualification status

The checked-in manifest is in **migration**, not capability-qualified production:

| Contract fact | Current value |
| --- | --- |
| Tutorial entries | 25 |
| Compiler fixtures | 47 |
| Target split | 10 gfx942, 37 gfx950 |
| Current classification | 25 legacy-compiler-produced entries |
| Issue #272 capability closure | not-produced for all 47 kernels |
| Production capability path/backend | legacy-only |
| Production capability negative coverage | missing |
| Legacy fallback | forbidden |

Existing simulator and hardware commands are recorded as
available-legacy-only. They remain useful evidence, but they do not establish
the new typed capability path. The reserved compiler-produced classification
requires a complete final KIR V13 capability closure, exact W4 final-graph analysis,
target decision, artifact inspection, simulator evidence, target-matched
hardware evidence where required, and negative fixtures. Qualification is
atomic across the corpus.

The [GPU capabilities page](https://harsh-nod.github.io/fe2o3-kernels/#/gpu-capabilities)
follows the runnable tiled GEMM example from ordinary Rust through canonical KIR
V13, the exact 19-obligation W4 schedule, target lowering, machine refinement,
simulator and hardware evidence, and safe host launch. It explains why a clean
analysis may support `Checked` evidence but must never be relabeled `Proven`.
Every currently unsupported or unpublished join remains visible.

## Quick start

Prerequisites: Node.js 22.22.1 or newer and npm.

~~~bash
git clone https://github.com/harsh-nod/fe2o3-kernels.git
cd fe2o3-kernels
nvm use
npm ci
npm run dev
~~~

Vite prints the local curriculum URL. Start with
[Getting Started](https://harsh-nod.github.io/fe2o3-kernels/#/getting-started)
for an authority-free CPU semantic-simulation path, or select a kernel in the
curriculum and follow its exact run contract.

Run the repository validation gate:

~~~bash
npm run validate
~~~

For browser coverage, install Chromium once and run the desktop and mobile
suite:

~~~bash
npx playwright install chromium
npm run test:e2e
~~~

`npm run validate` checks the compiler corpus, lint, TypeScript, unit tests, and
the production site build. It validates documentation and metadata; it does not
compile or dispatch every GPU kernel.

## Learning path

1. **Evidence and setup:** learn what source checks, proofs, compiler evidence,
   simulation, artifact inspection, and GPU observations each establish.
2. **Kernel basics:** run fill and typed vector addition; understand launch
   shape, indexing, bounds, and disjoint writes.
3. **Parallel execution:** work with subgroups, reductions, scans, LDS,
   barriers, epochs, atomics, and convergence.
4. **Tiled compute:** derive a GEMM mapping, stage tiles through LDS, accumulate
   with matrix operations, and reason about edge predicates and injective
   stores.
5. **Attention:** progress from row softmax to FlashAttention, Kimi Delta
   Attention (KDA), sparse attention, and compressed hybrid attention.
6. **Mixture of experts:** implement top-k routing, capacity and permutation,
   grouped expert GEMM, expert-rank execution, and deterministic combine.
7. **Production evidence:** inspect canonical KIR, optimization and target
   decisions, LLVM/HSACO artifacts, host admission, and target-specific results.

### Advanced areas

- **GEMM:** [tiled GEMM](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gemm-tiling),
  dynamic shapes, LDS staging, MFMA, and FP4/FP8 paths.
- **Attention and KDA:** [KDA/GDN linear attention](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/gfx950-kda-gdn-linear-attention),
  recurrent decode, chunkwise prefill, FlashAttention, and sparse/hybrid
  variants.
- **MoE:** [top-2 routing](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/moe-routing),
  [expert compute](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/moe-expert-compute),
  expert-rank routing/combine, and sharded execution.
- **gfx950:** low-precision GEMM/attention, advanced model operators, and the
  GPT-OSS decode layer-tile example.

The [operator cookbook](https://harsh-nod.github.io/fe2o3-kernels/#/operators)
is the shortest route from an operator name to its lesson, source, reference,
run boundary, and evidence.

## Machine-readable corpus

The site does not maintain a second hand-written kernel inventory:

- [Tutorial kernel manifest](config/tutorial-kernel-manifest-v1.json) owns
  lesson-to-fixture mappings, targets, gates, and migration state.
- [Manifest schema](config/tutorial-kernel-manifest-schema-v1.json) is the
  closed Draft 2020-12 shape contract.
- [Manifest digest](config/tutorial-kernel-manifest-v1.sha256) and
  [schema digest](config/tutorial-kernel-manifest-schema-v1.sha256) bind the
  exact checked-in bytes.
- [Compiler corpus qualification](docs/compiler-corpus-qualification-v1.md)
  defines inspection sidecars, measured baselines, regression gates, and
  target-specific evidence.
- [Semantic correctness publication](docs/semantic-correctness-publication.md)
  defines the bounded semantic-reference publication contract.

Validate the closed-world corpus contract with
`npm run validate:compiler-corpus`.

## Add a kernel

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[contribution lesson](https://harsh-nod.github.io/fe2o3-kernels/#/lesson/contributing-kernel)
before changing evidence or maturity labels.

A kernel contribution should:

1. Add ordinary attributed Rust source and an independent safe Rust CPU
   reference or supported semantic model.
2. Add positive tests plus relevant bounds, aliasing, mutation, canary, and
   expected-negative cases.
3. Register the package, source, exact fixture IDs, target, and required gates
   in the shared manifest as a synchronized compiler/site change.
4. Record only evidence that exists. State missing proof, compiler, artifact,
   launch, hardware, numerical, and performance joins explicitly.
5. Keep reusable source in `examples/` and structured lesson content in
   `src/content/`; do not duplicate generated tables or long command logs.
6. Run `npm run validate` and `npm run test:e2e`.

Promotion to capability-qualified compiler-produced must satisfy the whole
manifest contract. A local compile or successful GPU run cannot promote an
entry by itself.

## Project links

- [Live curriculum](https://harsh-nod.github.io/fe2o3-kernels/)
- [Implementation status](https://harsh-nod.github.io/fe2o3-kernels/#/status)
- [fe2o3 compiler and runtime](https://github.com/harsh-nod/fe2o3)
- [Compiler corpus roadmap #271](https://github.com/harsh-nod/fe2o3/issues/271)
- [GPU capability roadmap #272](https://github.com/harsh-nod/fe2o3/issues/272)
- [CI workflows](https://github.com/harsh-nod/fe2o3-kernels/actions)
- [MIT License](LICENSE)

The site is MIT licensed. Linked fe2o3 source and external evidence retain their
own licensing and copyright terms.
