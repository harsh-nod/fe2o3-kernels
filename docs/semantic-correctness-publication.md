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
   The evidence validator resolves every named path from the exact integrated
   compiler commit and rejects a missing object, tree, or path.
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
7. Keep this site pinned to the final integrated compiler commit and tree.
   Publish the stable `FE2O3-PARALLEL` diagnostics through
   `FE2O3-PARALLEL-026` without treating source declarations as evidence.
8. A safe CPU `input[index]` read joins only to an independently
   reconciled typed ranked GPU load with the same view, index, scalar,
   allocation origin, and stride. Canonical dynamic unit-step loops bind the
   compiler-derived finite-domain symbol, full u64 bound, transition,
   termination variant, and maximum-step identity. Multidimensional or raw
   reads and noncanonical loops fail closed.
9. ErrorBounded authority requires an independently imported claim-specific
   receipt and canonical-true domain and precondition roots covering the
   complete output. Automatic numerical proof requests, partial domains,
   reassociation without that receipt, and unsupported transcendental claims
   fail closed with `FE2O3-PARALLEL-010`. Unmatched numerical sites fail at
   `FE2O3-PARALLEL-023`, ambiguous sites at `FE2O3-PARALLEL-024`,
   duplicate sites for one output at `FE2O3-PARALLEL-025`, and a domain or
   precondition that is not canonical true over the complete output at
   `FE2O3-PARALLEL-026`.
10. Multiple distinct outputs compose as an ordered product only when
    compiler-derived allocation origins and distinct nonzero noalias classes
    prove separation. Each output retains its own TotalView, hierarchy
    identity, frame, receipt, and schedule. `FE2O3-PARALLEL-018` through
    `FE2O3-PARALLEL-021` reject duplicate, overlapping, unclassified,
    coverage-mismatched, or reordered products.
11. Cooperative-tensor checks validate target-owned fragment layout, lane
    coordinates, convergence, tail policy, staging/swizzle, and dominating
    publication barriers for supported live sites. They do not prove tensor
    arithmetic. `FE2O3-PARALLEL-013` fails closed until typed tensor SSA
    def-use and result-to-output bindings plus claim-specific receipts exist.
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
grouped-expert compute. The generic compiler can prove direct one-dimensional
safe-slice reads, canonical unit-step dynamic-loop termination, and separated
multiple-output products. Individual advanced references remain `Incomplete`
when they use Vec allocation/return, multidimensional reads, range slices,
nested or eventful recurrence, rich helper control flow, unsupported tensor
arithmetic, or lack a claim-specific numerical receipt. MFMA layout and
convergence checks do not establish the contraction value. Runtime CPU
oracles, source models, and GPU comparisons do not substitute for the exact
per-compilation reference-MIR to live-PLIRON receipt.
The root-owned retained runtime is not installed on mi300x, so no referenced
production compilation has completed the aggregate gate there. Cached Verus
template/generated-fixture checks pass; they demonstrate the conditional
lemmas and generator, not a completed lesson-kernel receipt.

The compiler contract vocabulary remains workload-neutral. Safe Rust names the
sequential behavior; generic pointwise/permutation/fold/recurrence and
hierarchy relations describe its parallel implementation. No pass recognizes
GEMM, softmax, attention, routing, or MoE.

The current canonical dynamic-loop subset is a compiler-derived unit-step
induction with exact finite-domain symbol, full u64 machine bound, transition,
termination variant, and maximum-step identity; stale or narrowed mutations are
rejected. This proves termination only for that exact form. Non-unit, eventful,
or noncanonical loops, additional loop-carried recurrence, arbitrary
break/continue, and loops without a termination proof remain fail closed.
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
