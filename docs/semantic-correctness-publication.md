# Semantic-correctness tutorial publication

The tutorial content introduced by this milestone is deliberately
non-authoritative while
`config/semantic-correctness-milestone.json.status` is
`integration-pending`.

## Compiler integration checklist

1. Update `config/publication-gate.json` only after both public compiler main
   refs resolve to the same exact commit and tree.
2. In `config/semantic-correctness-milestone.json`, set `compilerCommit`,
   `compilerTree`, `preloweringReportVersion`, and `functionalReceiptVersion`.
   Set the aggregate status to `partial-current` unless every listed mechanism
   is published.
3. Change a mechanism to `published-current` only with nonempty exact compiler
   source paths in its `evidence` list. Keep generic fold, recurrence,
   permutation, and collective semantic refinement `planned` unless those
   contracts are part of the mandatory retained compiler report.
4. Update the `generic-safety` and `functional-reference` entries in
   `config/current-state.json` to match the exact theorem. Total-view coverage
   is not termination, arithmetic definedness, reduction-value correctness,
   floating-point value correctness, or source-to-machine refinement.
5. Version and repin `config/functional-refinement-publication.json` if the
   report, obligation, receipt, runtime, or consumption boundary changes.

## Workload lesson checklist

The explanatory files under `examples/semantic_reference_vnext` are imported
by these exact lesson tabs:

- `src/content/modules-3-5.ts`: `gemm-tiling`, `softmax-invariant`, and
  `flash-attention`
- `src/content/modules-6-8.ts`: `moe-expert-compute`

Replace an explanatory tab with exact compiler-owned source only after adding
its source path, compiler commit, SHA-256, evidence record, positive proof, and
negative mutations. Workload mathematics stays in the safe Rust and Verus
specification; compiler mechanisms remain workload-neutral.

Changing the milestone status changes every canonical milestone callout.
Recompute the 21 reviewed entries in `src/content/narrative-policy.ts`, then run:

```bash
npm run validate
npm run validate:evidence -- --repository /path/to/fe2o3
npm run test:e2e
```

The final publication review must continue to state any remaining loop
termination, checked-overflow/trap, div/rem/shift/cast, IEEE-value,
target-instruction, lowering, artifact, runtime, and hardware boundaries.
