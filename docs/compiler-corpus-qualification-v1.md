# Tutorial Compiler Corpus Qualification V1

`config/tutorial-kernel-manifest-v1.json` is byte-for-byte synchronized with
the compiler corpus contract. Its raw SHA-256 in
`config/tutorial-kernel-manifest-v1.sha256` is a historical observation of
those exact bytes. Qualification additionally binds the stable
`corpusContractSha256`: SHA-256 over the ASCII canonical JSON document, with
sorted keys and no whitespace, after excluding only the top-level `baseline`,
prefixed by `fe2o3-tutorial-kernel-corpus-contract-v1\0`. Fixture, source,
gate, qualification-suite, or production-contract changes therefore change
the corpus identity; publishing a final baseline commit does not. Reports bind
all three of `{path, sha256, corpusContractSha256}`. The manifest, not a site
component or shell list, owns every lesson-to-fixture mapping and target
requirement.

The current state is `migration`. It contains 25 tutorial entries and 46
compiler fixtures: 9 for `gfx942` and 37 for `gfx950`. Twenty-four entries are
compiler-produced. `moe-routing` remains design-only and source-model-verified;
it has no compiler fixture because authenticated production MIR-to-KIR lowering
for that source is unavailable. All entries remain pending.

## Required production transaction

Qualification requires target-neutral policy V4 in this exact order:

1. initial scalar/CFG cleanup;
2. private SROA;
3. global value numbering;
4. interprocedural optimization;
5. post-interprocedural scalar/CFG cleanup;
6. loop canonicalization;
7. memory and guard optimization;
8. bounded unrolling; and
9. final scalar/CFG cleanup.

The independent V4 verifier re-executes that complete transaction from the
original KIR and requires the exact policy, limits, phase order, input/output
identities, mutation epochs, resource accounting, affected-analysis replay,
legality receipts, report, and output. AMD target policy V2 then admits only
zero-offset address folding, integer multiply-by-two strength reduction,
proved scalar-copy vector packing, redundant LDS-load removal, redundant
vector-layout removal or store folding, and dependency-safe MFMA accumulator
scheduling. Closed loop unrolling and generated specialization use separate
evidence. Wave handling checks and preserves Wave64; an MFMA decision maps an
already-attached tensor profile to a target instruction. It does not rewrite
wave operations, promote or tile LDS, synthesize a tensor profile, or create an
MFMA operation. Replay evidence V9 revalidates the complete target transaction,
and the final target module is admitted as canonical KIR V12 before LLVM
emission. Unsupported profiles, aliases, effects, resource facts, or replay
shapes remain unchanged with a typed disposition or fail closed.

The deterministic AMD V2 cost model uses integer add/multiply/address costs of
`1/4/2` for `gfx942` and `1/3/1` for `gfx950`, scalar-memory/matrix costs of
`8/16` and `7/8`, maximum vector accesses of 16 and 32 bytes, and preferred
unroll factors of 4 and 8. Both use 32 four-byte LDS banks and a 65,536-byte
static-LDS limit. Resource model V3 recomputes SSA liveness with 8-dword VGPR
and 16-dword SGPR allocation granules, no-spill admission, and occupancy; total
LDS per CU is 65,536 bytes on `gfx942` and 163,840 bytes on `gfx950`. Dynamic
LDS makes only the LDS occupancy component unknown and the receipt incomplete.
It may not block a mutation proved resource-neutral, but any transformation
that needs a bounded LDS fact fails closed as resource-guarded.

These are executable independent checkers, not a mechanized proof that every
optimization preserves Rust semantics. They do not verify LLVM or machine-code
refinement.

## Inspection sidecar

Each measured compile must retain exactly one primary LLVM `.ll` output and the
canonical inspection record at:

```text
<primary.ll>.fe2o3-compiler-inspection-v2
```

The bounded binary record starts with `F2KIRP02`. It binds the exact target,
neutral policy V4, AMD target policy V2, AMD cost-model revision V2, resource
model revision V3, the before-neutral, after-neutral, and final target canonical
KIR V12 snapshots, and the closed 16-pass remark sequence. The current decoder
uses replay evidence V9 and emits inspection format V2. Decode the record with
the compiler, not with a site-authored parser:

```bash
cargo fe2o3 inspect --format compiler-inspection-v2 \
  <primary.ll.fe2o3-compiler-inspection-v2>
```

Site qualification rejects a missing sidecar, wrong suffix, symlink, empty or
oversized file, bad magic, report digest mismatch, decoder failure, policy
drift, missing KIR snapshot, or changed pass sequence. The sidecar remains
inspection-only. It grants no compiler occurrence, publication, load, launch,
hardware, numerical, or performance authority.

## Measured baseline

`config/tutorial-compiler-baseline-report-schema-v1.json` defines the measured
compile time and peak resident set size; bounded diagnostic, sidecar, and
inspection-record bytes; input-neutral, optimized-neutral, target KIR, LLVM IR,
and HSACO sizes; neutral and target pass counts and optimizer work; candidate
and applied counts; neutral and target graph growth; replayed V3 compiler
resource estimates; and HSACO AGPR, SGPR, VGPR, spill, LDS, private-segment,
workgroup, wavefront, and occupancy metadata. It also retains the exact
pipeline identities, complete final verification, and semantic outcomes.

Missing occupancy metadata is represented only as
`occupancyStatus: unavailable-not-emitted` with both waves-per-execution-unit
fields `null`. A compile-only campaign records
`runtimeMetrics.status: not-run-compile-only` and a `null` runtime. Neither
absence is inferred as zero, and compilation or simulation is not relabeled as
hardware timing.

`config/tutorial-compiler-no-regression-threshold-schema-v1.json` defines
reviewed integer-ceiling margins independently for compile time, byte sizes,
resources, and optimizer work. The derivation keeps spill ceilings exact,
preserves unavailable occupancy and runtime as `null`, and binds the result to
the exact baseline report SHA-256, compiler commit/tree, raw manifest SHA-256,
and stable corpus-contract SHA-256.
Neither schema contains invented measurements.

The compiler-owned regression checker compares a candidate report with that
exact baseline and threshold record:

```text
scripts/check-tutorial-compiler-regressions.py \
  --baseline /path/to/reviewed-baseline.json \
  --thresholds /path/to/reviewed-thresholds.json \
  --candidate /path/to/candidate-report.json
```

It rejects baseline-binding or manifest drift, extra, missing, or duplicate
fixtures, target or production-policy drift, semantic outcomes below their
required status, changed occupancy metadata, and every measured ceiling
regression. Runtime is checked only when the reviewed threshold contains a real
runtime ceiling; a compile-only `null` does not silently become a performance
budget.

A final compiler commit and tree may be pinned only after a clean-tree campaign
covers every exact fixture, required simulator and CPU-reference gate, and the
target-specific hardware lanes. Historical MI300X or MI350X observations do
not automatically qualify the new V4 corpus.

## gfx942 hardware evidence

`config/tutorial-gfx942-hardware-evidence-schema-v1.json` is the exact
compiler-owned schema for one completed `gfx942:xnack-` run. The site validator
requires every manifest matrix case in order and cross-binds the target,
compiler identity, raw and stable corpus identities, production contract,
fixture/test/case tuple, retained command and result records, inspection V2,
LLVM, HSACO, compiler-model summary, HSACO metadata summary, host log, build
logs, and `rocminfo`. Compiler resource estimates and HSACO metadata remain
explicitly non-hardware observations. Only the per-case host execution is
hardware-observed. None of those records grants compiler, publication, load,
or launch authority.

No release evidence is checked in during migration. Validate a real completed
run only after the compiler pin and artifacts exist:

```bash
npm run validate:gfx942-hardware-evidence -- \
  --evidence /path/to/evidence.json \
  --artifact-root /path/to/completed-run
```

Run the site-side closed-world checks with:

```bash
npm run validate:compiler-corpus
```
