# Semantic-correctness tutorial publication

The workload-neutral compiler mechanisms in this milestone are published at
the exact compiler commit and tree in
`config/semantic-correctness-milestone.json`. The aggregate status remains
`partial-current`: the authenticated receipt ends at
`SafeReferenceMirToLivePliron` for the admitted subset.

## Compiler integration checklist

1. `config/publication-gate.json` pins both public compiler main refs to the
   same exact commit and tree.
2. `config/semantic-correctness-milestone.json` pins
   `ProductionPlironPreloweringReportV2`, `ProductionMiddleEndEvidenceV5`,
   `ProductionTotalOutputRefinementReportV2`,
   `ProductionMirPlironSemanticContractReportV1`,
   `ProductionParallelReferenceContractReportV1`,
   `ProductionMirPlironPerCompilationVerusReportV1`, and the consumed
   `ImportedFunctionalRefinementProofV2` at
   `SafeReferenceMirToLivePliron`.
3. Each `published-current` mechanism names exact compiler source and test
   paths. Finite fold, bounded recurrence, and permutation-gather contracts
   are mandatory semantic-pass inputs, not optional workload helpers.
4. The `generic-safety` and `functional-reference` entries in
   `config/current-state.json` state the exact theorem. Total-view coverage
   is not termination, arithmetic definedness, reduction-value correctness,
   floating-point value correctness, or source-to-machine refinement.
5. Repin `config/functional-refinement-publication.json` whenever the
   report, obligation, receipt, runtime, or consumption boundary changes.
6. Production derives and reconciles the compiler-owned semantic contract,
   strictly derives and validates the compiler-owned parallel contract, then
   generates and runs one workload-neutral Verus conditional-lemma checker
   before KIR lowering. The production report cryptographically binds the
   exact instantiation, tool run, and retained receipts outside the lemma;
   receipts are not logical premises in one whole-kernel theorem. Candidate
   declarations and generated identity comments are not premises.
7. Repin this site to the final integrated compiler commit and tree. Publish
   `FE2O3-PARALLEL-001` through `FE2O3-PARALLEL-017` as the
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
`Incomplete`: slice-read binding, claim-specific tensor/MFMA summaries,
stable ranked-view identities for multiple outputs, error-bound/reassociation
proofs, and fixed retained `/opt` runtime support are not generally available.
Runtime CPU oracles, source models, and GPU comparisons do not substitute for
the exact per-compilation reference-MIR to live-PLIRON receipt.

The root-owned retained runtime is not installed on mi300x, so no referenced
production compilation has completed the aggregate gate there. Cached Verus
template/generated-fixture checks pass; they demonstrate the conditional
lemmas and generator, not a completed lesson-kernel receipt.

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
