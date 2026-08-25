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
   `ImportedFunctionalRefinementProofV2` boundary. The next publication must
   additionally pin the exact per-compilation conditional-composition report,
   generated source, retained Verus receipt, policy, and tool identities.
3. Each `published-current` mechanism names exact compiler source and test
   paths. Finite fold, bounded recurrence, and permutation-gather contracts
   are mandatory semantic-pass inputs, not optional workload helpers.
4. The `generic-safety` and `functional-reference` entries in
   `config/current-state.json` state the exact theorem. Total-view coverage
   is not termination, arithmetic definedness, reduction-value correctness,
   floating-point value correctness, or source-to-machine refinement.
5. Repin `config/functional-refinement-publication.json` whenever the
   report, obligation, receipt, runtime, or consumption boundary changes.
6. Historical shared-theorem tests remain build evidence only. Production
   functional authority requires a fresh workload-neutral composition
   obligation for each compilation. It must bind the exact safe-reference MIR,
   kernel MIR, live PLIRON graph, output and schedule relations, hierarchy
   facts, numerical policy, retained effect receipts, tool identity, and
   execution result. Missing support or evidence is `Incomplete` before
   lowering.
7. After the compiler integration lands, repin this site to the exact
   `ProductionParallelReferenceContractReportV1` and
   `ProductionMirPlironPerCompilationVerusReportV1` source and test paths.
   Publish `FE2O3-PARALLEL-001` through `FE2O3-PARALLEL-015` as the
   fail-closed diagnostics for semantic identity, coverage, hierarchy,
   schedules, dynamic bounds, numerical policies, calls, and tensor sites.

## Kernel lesson checklist

`config/semantic-correctness-milestone.json` names every executable kernel
lesson. `src/content/functional-correctness-catalog.ts` must contain the same
ordered set. The UI renders each entry next to its lesson and reports:

- the exact safe Rust reference;
- the admitted MIR subset;
- pointwise, permutation, fold, or bounded-recurrence output and schedule
  relations;
- numerical policy and GPU hierarchy coverage;
- per-compilation Verus evidence; and
- every Incomplete or trusted boundary.

The catalog covers fill, vecadd, CPU semantic simulation, Wave64 collectives,
workgroup synchronization, GEMM, softmax, FlashAttention, top-2 routing, and
grouped-expert compute. Advanced Vec/slice-reading references remain
`Incomplete`: runtime CPU oracles, source models, GPU comparisons, and
historical build-time theorems do not authenticate a per-compilation
reference-MIR to PLIRON refinement.

The compiler contract vocabulary remains workload-neutral. Safe Rust names the
sequential behavior; generic pointwise/permutation/fold/recurrence and
hierarchy relations describe its parallel implementation. No pass recognizes
GEMM, softmax, attention, routing, or MoE.

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
