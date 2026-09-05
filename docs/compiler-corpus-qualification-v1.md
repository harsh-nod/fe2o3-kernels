# Tutorial Compiler Corpus Qualification V1

`config/tutorial-kernel-manifest-v1.json` is byte-for-byte synchronized with
the compiler corpus contract. Its SHA-256 is recorded in
`config/tutorial-kernel-manifest-v1.sha256`. The manifest, not a site component
or shell list, owns every lesson-to-fixture mapping and target requirement.

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
identities, mutation epochs, resource accounting, report, and output. The AMD
target policy V1 then runs address reduction, integer strength reduction,
vector access packing, LDS layout, wave/MFMA selection, unrolling/scheduling,
and guarded specialization. Its exact target report is replayed and the final
target module is admitted as canonical KIR V11 before LLVM emission.

These are executable independent checkers, not a mechanized proof that every
optimization preserves Rust semantics. They do not verify LLVM or machine-code
refinement.

## Inspection sidecar

Each measured compile must retain exactly one primary LLVM `.ll` output and the
canonical inspection record at:

```text
<primary.ll>.fe2o3-compiler-inspection-v1
```

The bounded binary record starts with `F2KIRP01`. It binds the exact target,
neutral policy V4, AMD target policy V1, AMD cost-model revision V1, the
before-neutral, after-neutral, and final target canonical KIR V11 snapshots,
and the closed 16-pass remark sequence. Decode it with the compiler, not with a
site-authored parser:

```bash
cargo fe2o3 inspect --format compiler-inspection-v1 \
  <primary.ll.fe2o3-compiler-inspection-v1>
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
and HSACO sizes; neutral and target optimizer work; candidate and applied
counts; neutral and target graph growth; and HSACO AGPR, SGPR, VGPR, spill, LDS,
private-segment, workgroup, wavefront, and occupancy metadata. It also retains
the exact pipeline identities and semantic outcomes.

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
the exact baseline report SHA-256, compiler commit/tree, and manifest SHA-256.
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

Run the site-side closed-world checks with:

```bash
npm run validate:compiler-corpus
```
