# Semantic-correctness tutorial publication

The workload-neutral compiler mechanisms in this milestone are published at
the exact compiler commit and tree in
`config/semantic-correctness-milestone.json`. The aggregate status remains
`partial-current`: the theorem ends at the safe-reference-MIR to kernel-MIR
boundary for the admitted subset.

## Compiler integration checklist

1. `config/publication-gate.json` pins both public compiler main refs to the
   same exact commit and tree.
2. `config/semantic-correctness-milestone.json` pins
   `ProductionPlironPreloweringReportV2`, `ProductionMiddleEndEvidenceV5`,
   `ProductionTotalOutputRefinementReportV2`, and the consumed
   `ImportedFunctionalRefinementProofV2` boundary.
3. Each `published-current` mechanism names exact compiler source and test
   paths. Finite fold, bounded recurrence, and permutation-gather contracts
   are mandatory semantic-pass inputs, not optional workload helpers.
4. The `generic-safety` and `functional-reference` entries in
   `config/current-state.json` state the exact theorem. Total-view coverage
   is not termination, arithmetic definedness, reduction-value correctness,
   floating-point value correctness, or source-to-machine refinement.
5. Repin `config/functional-refinement-publication.json` whenever the
   report, obligation, receipt, runtime, or consumption boundary changes.

## Workload lesson checklist

The explanatory files under `examples/semantic_reference_vnext` are imported
by these exact lesson tabs:

- `src/content/modules-3-5.ts`: `gemm-tiling`, `softmax-invariant`, and
  `flash-attention`
- `src/content/modules-6-8.ts`: `moe-expert-compute`

The four workload contract tabs remain explanatory. The compiler now owns the
generic contract vocabulary and validates its PLIRON representation, but it
does not yet synthesize complete GEMM, softmax, attention, or MoE semantic
contracts from arbitrary Rust loops, calls, loads, and multi-effect bodies.
Workload mathematics stays in the safe Rust and Verus specification; compiler
mechanisms remain workload-neutral.

Changing the milestone status changes every canonical milestone callout. The
21 reviewed entries in `src/content/narrative-policy.ts` must be recomputed,
then validated with:

```bash
npm run validate
npm run validate:evidence -- --repository /path/to/fe2o3
npm run test:e2e
```

The final publication review must continue to state any remaining loop
termination, checked-overflow/trap, div/rem/shift/cast, IEEE-value,
target-instruction, lowering, artifact, runtime, and hardware boundaries.
