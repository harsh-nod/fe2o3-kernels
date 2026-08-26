# Semantic-correctness tutorial publication

The exact compiler commit and tree in
`config/semantic-correctness-milestone.json` identify the currently published
baseline. Mechanisms marked `implemented-unpinned` describe the integrated
completeness work awaiting a refreshed publication pin; they are not attributed
to that older compiler object. The aggregate status remains `partial-current`:
the authenticated receipt ends at `SafeReferenceMirToLivePliron` for the
admitted subset.

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
   generates and runs one workload-neutral Verus checker before KIR lowering.
   Exact pointwise integer and compiler-side IEEE operator-DAG congruence replay
   the compiler-derived coordinate, domain, precondition, and value formulas.
   They do not assume a generic relation premise. The report binds the exact
   instantiation, tool run, and retained receipts to the compilation.
7. Keep this site pinned to the final integrated compiler commit and tree.
   Publish the stable `FE2O3-PARALLEL` diagnostics through
   `FE2O3-PARALLEL-026` without treating source declarations as evidence.
8. A safe CPU `input[index]` read retains its exact bounds condition and joins
   only to a ranked GPU load with the same view, index, scalar, allocation
   origin, and stride. Dynamic reads still fail closed until a compiler-owned
   extent implication proves the condition over the complete output domain.
   A syntactic Rust assertion is not proof of that implication.
9. Canonical dynamic unit-step loops bind the compiler-derived finite-domain
   symbol, full u64 bound, transition, termination variant, maximum-step
   identity, and an overflow-safe final latch. Noncanonical loops produce an
   exact SCC request containing entries, backedges, exits, guards, transitions,
   and carried values. Imported invariant/variant answers do not yet compose
   with the aggregate theorem and therefore cannot grant authority.
10. Multiple separated point outputs use one compiler-derived receipt per
    output and one aggregate compilation proof. Distinct allocation origins
    and nonzero noalias classes prove separation; every output retains its own
    TotalView, hierarchy identity, frame, and schedule. Duplicate, overlapping,
    coverage-mismatched, or reordered products fail closed.
11. Cooperative-tensor checks validate target-owned fragment layout, lane
    coordinates, convergence, tail policy, staging/swizzle, and publication.
    Typed tensor result components also bind the exact scalar policy and output
    store at the claim boundary. Aggregate tensor-component theorem replay is
    not implemented, so these claims remain fail closed.
12. ErrorBounded sites bind exact roots, formulas, finite bounds, graph, and MIR
    identities, but aggregate finite-error-formula replay is not implemented.
    Test epsilons, reassociation assumptions, and receipts cannot substitute for
    that theorem. The milestone claims neither target IEEE values nor LLVM,
    target-instruction, artifact, launch, or hardware arithmetic refinement.
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
grouped-expert compute. The generic compiler can replay exact pointwise
formulas, prove canonical unit-step dynamic-loop termination with an
overflow-safe final latch, and aggregate separated point outputs. Dynamic
safe-slice reads remain `Incomplete` without a compiler-owned full-domain
extent implication. Noncanonical-loop, tensor-component, and ErrorBounded
requests retain exact claim data but cannot yet compose with aggregate
authority. MFMA layout and claim-site binding do not establish the contraction
value. Runtime CPU
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
termination variant, maximum-step identity, and checked final-latch increment;
stale, narrowed, or overflowing mutations are rejected. This proves termination
only for that exact form. Other SCCs receive an exact proof request, not an
aggregate theorem assumption.
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
