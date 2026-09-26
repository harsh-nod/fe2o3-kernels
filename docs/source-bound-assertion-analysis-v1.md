# Inspect source-bound assertion analysis without overclaiming safety

This contributor lesson follows [compiler checkpoint db351c0df32173d2423235eab2812bac5ccf50a6](https://github.com/harsh-nod/fe2o3/blob/db351c0df32173d2423235eab2812bac5ccf50a6/docs/bf16-helper-root-assertion-qualification-20260926.md).
It is not a new public kernel-authoring command or a GPU launch workflow.
Start with the [real Rust BF16 helper lesson](bf16-helper-source-cpu-observation-v1.md)
for the source fixture, toolchain and fresh-output qualification commands.

## 1. Follow one source owner through preparation

The retained caller, rich Option/scalar/provenance tables, actual control-flow
graph and assertion decisions must belong to the same immutable source.
Matching copied hashes or an equal separately allocated graph is insufficient.
The observer borrows the complete decision mask; it cannot detach that mask
and reuse it as permission to compile an edited kernel.

Strict and legacy modes use the same assertion/range evaluator. The strict
mode pays for scans, payload clones, collection growth and typed recursive
frames on the original work/storage ledger. Additional resource charges do
not replace the evaluator's existing logical-work counter or alter its
legacy refusal order.

| Check | Incorrect behavior it can expose | What it does not establish |
| --- | --- | --- |
| Exact source/function/graph/type joins | Reusing stale decisions after replacing the source or mixing owners | That every program assertion is true |
| Whole decision-mask parity | Dropped decisions, changed range-analysis results or changed legacy work counts | Independent mathematical proof of the shared algorithm |
| Exact and one-short resource controls | Unpaid growth, late ignored denial, refunding another owner or leaking temporary credit | Native RSS, allocator or machine-stack limits |
| Error/panic cleanup controls | Returning partial analysis, escaping borrowed state or losing callback-owned reservations | GPU rollback or absence of prior kernel side effects |

The existing BoundsCheck decision convention is not a standalone memory-safety
certificate. Canonical access matching, complete root memory/bounds projection
and later formal/target checks are still required.

## 2. Read the actual assertion counts

The fresh R14 parent completed five real Rust sessions: Identity, Swap01,
wrong launch, callback error and callback panic. The two positive variants
retain 36 numerical CPU cases and 32 request refusals.

Actual diagnostics report 19 root blocks and **zero assertion terminators**,
zero true decisions and zero evaluator logical work. Identity/error/panic use
call block 17 and permutation [0, 1, 2, 3]; Swap01 uses block 14 and
[1, 0, 2, 3]. Four repeated diagnostic rows are retained for each affected
case; wrong launch has none. Those rows are not four distinct source owners
or positive assertion coverage.

Thus the genuine fixture validates source/owner/accounting integration, not
a nonzero assertion proof. Positive and hostile assertion cases are exercised
by separate component tests. Zero evaluator logical work also does not mean
zero preparation work on the shared ledger.

## 3. Read qualification, not just a printed line

All 331 model and 2,536 backend tests passed, as did backend/extractor build
and the five-session genuine parent. The latter's report is 281,064 bytes,
SHA-256 `14a20812c89575654866900c96254f0388ec74152fa6fecad0e3a76492e9d7c7`.
Its completed receipt is
`982d6fb4c72e95035589c14cdc0ed9e5e781587a6d72b3d51b783c49479af14c`.
A diagnostic line alone is not whole-gate success.

The independently gated comparison passed all 18 checker controls and rehashed
both 459-file dependency trees. Numerical results, masks, refusals, storage
and peaks remain unchanged; no peak override exists. The logical peak remains
1,632,943,151 bytes under the unchanged 2 GiB limit. These are not RSS figures.

Only exact generation paths/digests and reviewed cumulative-work fields change:
+8,535,477 for Identity/error/panic and +8,535,647 for Swap01. This includes
prepaid negative controls, not slower GPU execution. The comparison report
SHA-256 is `fa79dd458a3deb0269fdd0397f2c15f068f2cbac233295607649729dd5ab7854`.
Its parser preserves numeric lexemes, including u64 masks above JavaScript's
safe-integer range. Never normalize such evidence through JavaScript Number.

## 4. Keep the compilation boundary visible

Normal helper compilation still refuses. The next connected implementation
must retain the root's actual input reads, Option-guarded output write, guards
and source maps alongside the helper's component association. A tensor row or
an assertion mask is not a complete kernel recipe.

The prepared base mask must remain immutable when separate authenticated
induction decisions are added. Ranked expansion must record its real generated
coordinates, not reuse source block numbers as if they were unchanged.

Complete root recipe/resource retention, source-to-ranked correspondence,
attachment and formal/target/LLVM continuation remain open. This checkpoint
does not qualify inline assembly, physical register allocation, native helper
execution, edited-source promotion or GPU execution. No public debugger
activation, route maturity or global compiler pin changes. Accepted broad
exits remain M1/V1/V2/U1/U2/U3 (6/18).
