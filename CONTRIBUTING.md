# Contributing

Contributions should improve a kernel lesson without weakening the distinction
between proof, compiler evidence, and runtime observation.

## Before editing content

1. Check out the fe2o3 commit named in `FE2O3_PIN`.
2. Read the implementation, tests, and relevant documentation at that commit.
3. Reproduce every command you intend to cite.
4. Choose the narrowest maturity label supported by the evidence.
5. Record what is proved, trusted, and not proved in the lesson.

Do not update `FE2O3_PIN` as part of an unrelated lesson change. A baseline
update is its own review and must re-audit all non-design claims.

## Adding a kernel lesson

Add reusable snippets under `examples/` and import them into structured content
rather than duplicating large code blocks. A complete evidence packet contains:

- kernel source and an independent host-side oracle;
- positive tests plus boundary, aliasing, and canary cases;
- expected-negative compiler or verifier fixtures;
- Verus specifications with assumptions and trusted boundaries;
- compiler and Kernel IR checks for the intended operations;
- linked HSACO metadata and machine-effect inspection;
- exact target-specific hardware commands and observed `gfx942:xnack-` or
  `gfx950:xnack-` identity, when that hardware gate is required; and
- an immutable binding among source, proof, toolchain, artifact, and result.

Only include the pieces that exist. Missing evidence belongs in the lesson's
"not proved" section, not behind a stronger badge.

## Status review

Use these promotion rules:

- Promote to **Runnable now** only when the current frontend builds and executes
  the exact source path with the cited command.
- Add **Verus model** only when the checked property and expected-negative cases
  are explicit. Describe source-model results as source-model results.
- Add **HSACO mechanics** for focused compiler, linker, ABI, metadata, or
  machine-effect evidence. Do not use it as an execution badge.
- Add **GPU observed** only with a target-specific campaign and independent
  result check.
- Keep **Design only** until the claimed capability is present. Design-only
claims intentionally have no execution reference in the schema.

## Compiler corpus qualification

`config/tutorial-kernel-manifest-v1.json` is shared with the compiler repository
and is the only registry for tutorial lesson IDs, compiler fixture/test IDs,
targets, and required gates. Do not add a second kernel or target list to site
code or CI. A compiler-produced entry must resolve at least one registered
fixture and require `production-compile`; a source-model-only or design-only
entry must not claim a compiler fixture.

The current manifest is a migration contract, not a qualified baseline. It
requires the closed target-neutral optimizer policy V4, final optimized-graph
verification, and no pipeline selection or fallback. Do not pin a new compiler
commit or mark an entry `qualified` until a clean-tree measured report covers
its exact fixture and all required semantic and hardware gates.

The raw manifest SHA-256 records exact historical bytes. The stable
domain-separated corpus digest canonicalizes the manifest while excluding only
top-level `baseline`; reports must bind
`{path, sha256, corpusContractSha256}`. A report's measured compiler identity is
not required to equal mutable baseline publication metadata. The baseline pin
is advanced only after the complete evidence set has been reviewed.

Each qualified compile must retain the primary LLVM `.ll` output and the exact
adjacent `<primary.ll>.fe2o3-compiler-inspection-v2` sidecar. The sidecar must
start with `F2KIRP02`, match the report's SHA-256, and decode successfully with:

```bash
cargo fe2o3 inspect --format compiler-inspection-v2 \
  <primary.ll.fe2o3-compiler-inspection-v2>
```

The decoder must report neutral policy V4, AMD target policy V2, AMD cost-model
revision V2, AMD resource-model revision V3, the exact three canonical KIR V12
snapshots, and all 16 ordered pass remarks. Current AMD target reconstruction is
replay evidence V9. Its local transform subset is zero-offset address folding,
integer multiply-by-two reduction, proved scalar-copy vector packing,
redundant LDS-load removal, vector-layout removal/store folding, and MFMA
accumulator scheduling. Wave handling is Wave64 legality/preservation; MFMA
selection maps an already-attached tensor profile and does not promote LDS or
synthesize a profile. Unsupported cases fail closed. This record is
inspection-only; it grants no publication, load, launch, hardware, numerical,
performance, or formal compiler-correctness authority.

The measured report must also retain peak RSS, diagnostic bytes, optimizer pass
work and graph growth, KIR/LLVM/HSACO sizes, and HSACO register, spill, LDS,
private-segment, workgroup, wavefront, and occupancy metadata. Record absent
occupancy as `unavailable-not-emitted` with both occupancy values `null`.
Compile-only runtime is `not-run-compile-only` with a `null` duration; never
convert either unavailable result to zero.

For a required gfx942 hardware gate, seal a completed run with the compiler's
`tutorial-gfx942-hardware-evidence-schema-v1.json` contract and validate its
retained directory with `npm run validate:gfx942-hardware-evidence --
--evidence ... --artifact-root ...`. Target, corpus, fixture, command, result,
inspection, LLVM, HSACO, resource-summary, metadata, and host-log identities
must all match. Do not create placeholder or inferred release evidence.

Derive reviewed compile-time, size, resource, and work margins from a real
baseline, then run the compiler-owned regression checker. It must bind the
exact baseline report, compiler tree, and manifest and reject missing, extra,
or duplicate fixtures; policy, target, semantic-outcome, or occupancy drift;
and any measured ceiling regression. Runtime becomes enforceable only after an
execution report provides a real target-matched measurement.

## Validation

```bash
npm ci
npx playwright install chromium
npm run validate:compiler-corpus
npm run test:all
```

Inspect the Playwright desktop and mobile screenshots when changing layout,
diagrams, long commands, navigation, or status labels. Check both themes and
keyboard focus. No page should acquire horizontal overflow.

Commits should be small and explain one content, implementation, or evidence
change. Do not combine a baseline upgrade with unrelated visual work.
