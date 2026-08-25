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
   `ProductionTotalOutputRefinementReportV2`,
   `ProductionMirPlironSemanticContractReportV1`, the consumed
   `ImportedFunctionalRefinementProofV2` boundary, and the exact shared Verus
   theorem and tool identities.
3. Each `published-current` mechanism names exact compiler source and test
   paths. Finite fold, bounded recurrence, and permutation-gather contracts
   are mandatory semantic-pass inputs, not optional workload helpers.
4. The `generic-safety` and `functional-reference` entries in
   `config/current-state.json` state the exact theorem. Total-view coverage
   is not termination, arithmetic definedness, reduction-value correctness,
   floating-point value correctness, or source-to-machine refinement.
5. Repin `config/functional-refinement-publication.json` whenever the
   report, obligation, receipt, runtime, or consumption boundary changes.
6. `scripts/test-mir-pliron-semantic-refinement-verus.sh` requires the pinned
   Verus executable, verifies eight positive obligations, and requires four
   targeted workload mutations to fail. The compiler gate pins this theorem;
   it does not execute the shared source again for each compilation.

## Workload lesson checklist

The explanatory files under `examples/semantic_reference_vnext` are imported
by these exact lesson tabs:

- `src/content/modules-3-5.ts`: `gemm-tiling`, `softmax-invariant`, and
  `flash-attention`
- `src/content/modules-6-8.ts`: `moe-expert-compute`

The four workload contract tabs remain workload-specific specifications. The
compiler owns the generic contract vocabulary and exactly joins live typed
roots, canonical natural loops, finite collectives, effects, ownership, and
retained MIR-bound proof receipts. It does not yet synthesize each complete
GEMM, softmax, attention, or MoE theorem from arbitrary Rust loops, calls,
loads, and multi-effect bodies. Workload mathematics stays in the safe Rust
and Verus specification; compiler mechanisms remain workload-neutral.

The current canonical loop subset is an increasing `IndexLessThan` induction
with one preheader, one matching latch update, and an exact exit. Static trip
counts are recomputed. Dynamic loops require the full `u64` type bound and a
constant unit step; a claimed narrower bound is rejected until a production
range receipt can prove it. Irreducible or otherwise unsupported CFGs fail
closed.

Changing the milestone status changes every canonical milestone callout. The
changed reviewed entries in `src/content/narrative-policy.ts` must be
recomputed, then validated with:

```bash
npm run validate
npm run validate:evidence -- --repository /path/to/fe2o3
npm run test:e2e
```

The final publication review must continue to state any remaining unsupported
loop shapes, narrow dynamic-range proofs, checked-overflow/trap,
div/rem/shift/cast, IEEE-value,
target-instruction, lowering, artifact, runtime, and hardware boundaries.
