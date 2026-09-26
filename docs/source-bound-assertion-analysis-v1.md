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

## Later development seam: complete root preparation and retained effects (2026-09-26)

The [shared ordinary preparation checkpoint ebc14db4b3c0227dbc2be8d0b82052abc84e2e84](https://github.com/harsh-nod/fe2o3/blob/ebc14db4b3c0227dbc2be8d0b82052abc84e2e84/docs/bf16-shared-root-recipe-qualification-20260926.md)
and [retained-effects checkpoint 1d8ef2462d141ad257e59807ab8727fc297ed1c5](https://github.com/harsh-nod/fe2o3/blob/1d8ef2462d141ad257e59807ab8727fc297ed1c5/docs/bf16-helper-retained-effects-qualification-20260926.md)
are qualified CPU implementation steps, not nominal normal admission.
Earlier qualified assertion results above remain historical evidence; the
fresh R15 evidence below qualifies the retained-effects implementation.

### Follow the complete source table, not just one tensor operation

The existing final candidate ties the actual helper Call, Matrix, Return and
four scalar components to one immutable source owner. It is a tensor-only
candidate, not the surrounding kernel's complete memory behavior.

The distinct retained-effects entry follows the same actual source preparation,
canonical facts, real consumer and three-pass dense driver. It copies every
source-indexed row from that driver's completed Final table into prepaid outer
storage. The driver, facts and source scopes finish their postflights; the exact
candidate must be rejoined before the observer receives a borrowed view of the
function, candidate and complete effects table. The enclosing entry postflight
still follows the external callback.

| Final field | What the retained view contains | What it does not grant |
| --- | --- | --- |
| `layout` | The actual optional fixed tensor layout and binding | A complete root recipe or detached tensor authority |
| `global_read` | The actual optional allocation contract for a source read | Independently proved bounds or a ready-to-use access certificate |
| `transpose_workgroup` | The actual optional workgroup transpose access and format | Evidence that a GPU executed a transpose |
| `read_view` | The actual optional view, row and column payload | Permission to invent missing reads or bypass source access matching |

Absent fields and default/unreached rows remain present as rows. The closed
copy accepts only the current fixed tensor-layout variant, refusing an
unsupported layout representation instead of cloning an arbitrary payload.
Source block indices are not ranked coordinates: CFG expansion can create
different blocks and operations, so later source-to-ranked correspondence must
record the actual generated positions.

The original work/storage ledger pays for the retained table, checked capacity,
copy work and scoped frames before allocation or reconstruction. A replacement
ledger, eroded retained-owner floor or ignored sticky denial must refuse.
Partial tables, callback captures and panic payloads drop before only the scope's
own storage is refunded; callback-owned surplus must survive. These qualified
logical-accounting checks are not guarantees about allocator overhead, RSS or
native machine-stack limits.

### Keep the two kinds of test evidence separate

The genuine observer derives the two BF16 fragment-load blocks from the actual
Identity/Swap01 source intrinsics. It checks `global_read` presence/absence at
those exact source rows, plus the source owner, function, Call/Matrix/Return and
component associations. It does not independently compare the allocation-contract
payload against a separately derived source contract. The actual fixture has
zero layout, transpose and read-view entries.

Synthetic controls compare equality of all four copied payload fields,
including nonempty `read_view` and `transpose_workgroup` values. They also
exercise wrong shapes, incomplete/repeated capture, capacity/resource shortfalls,
sticky denials, foreign ledgers and error/panic cleanup. Synthetic payload
equality is not positive genuine read-view or transpose coverage.
A printed observer line cannot replace a completed fresh qualification gate.

### Prepare a root recipe, then verify it

The shared ordinary-path core now splits complete root preparation from
verification. Preparation retains the existing input reads, conditional output
writes, guards, source rows, reference expressions and expanded CFG in an
explicitly **unverified prepared recipe**. The ordinary wrapper immediately
continues through its existing verifier, keeping preparation locals alive
through that continuation. Moving this boundary does not skip verification.

The source-bound prepared assertion mask keeps the actual function/type
association, moves its allocation and retains the established refusal order.
Authenticated induction decisions must not silently rewrite the nominal
observer's immutable base mask. A future strict adapter needs separately paid
overlay storage and source-bound inputs.

This ordinary preparation core is not an original-meter nominal recipe driver.
The retained Final table is not already connected to that core. A safe next
implementation must account all root/CFG allocations and connect rich Option
dominance, checked references, complete conditional writes and the actual
candidate placement. Do not invoke an unmetered legacy path behind a metered
facade, fabricate memory/access certificates or treat matching block numbers
as source correspondence.

For this R15 checkpoint, a subsequent actual-facts reservation-context hook remains unqualified. R15
does not qualify that new seam, an authenticated checked-reference graph,
the full nominal root recipe or normal helper admission.

### Read the completed gates and their limits

The ordinary preparation checkpoint passed 331 model and 2,544 backend tests
and backend/extractor build. Its fresh 36-session normal-composition ladder
retained seven finite checked owners, seven public LLVM sessions, seven inert
handoffs, seven dynamic-source refusals and eight invalid-source refusals.
A separate two-session direct-BF16 ladder retained normal handoff and wrong-launch
refusal. These 36+2 sessions qualify ordinary behavior, not nominal helper
compilation. The source-ladder receipt is 80,228 bytes, SHA-256
`6c434dfccb9c18e4b31db6415262f94694b10527c604b4d9c15d2a74053e90a1`.

The retained-effects regression passed 331 model and 2,557 backend tests,
with 189 ignored, plus backend/extractor build. Its receipt is 50,796 bytes,
SHA-256 `54181d44d9ebff7a89f61a3e4daa82dc41ad9d62315037d0c5449259b1a9f508`.
This is not a whole-backend strict-Clippy claim.

R15 completed five fresh actual Rust sessions: Identity, Swap01, wrong launch,
callback error and callback panic. The two positive variants retain 36 positive
CPU numerical cases, 32 request refusals and two unchanged normal refusals;
the other sessions retain the two callback controls and wrong-launch refusal.
Its completed receipt is 271,741 bytes, SHA-256
`b7d6f6e11b995dd3ac55d1d078048b281f40c0aefba0b8785884a9fb96e96298`.
The observation is 281,064 bytes, SHA-256
`82c289410d064875b6a00a17aa308422144cceee74a32ad2701b9255a194e25f`.

The lossless R14-to-R15 comparison passed 28 controls and exactly 132 allowlisted
changes: 96 cumulative-work fields, 25 generation paths, six dependency digests
and five artifact digests. Its receipt is 91,670 bytes, SHA-256
`c1f5b7d8af43aad8c224b1a805a2a9769d47cba3f0c24cd4f41b8cbe4aafec75`.
Both complete 459-file dependency directories were enumerated and all 918 files
rehashed. Numeric lexemes, masks, refusal payloads, normal/authority flags,
storage and peak fields remain unchanged. The logical peak is still
1,632,943,151 bytes; no storage/peak override or resource-cap increase exists.

Each affected stderr retains four assertion rows at lines 17/41/43/45 and five
retained-effect rows at 16/40/42/44/46. Four pairs are followed by exactly one
retained-only row; wrong launch has neither. Source ordering identifies the
last row with the one-short-storage probe: the early retention observer finishes,
but a later stage refuses before assertion output. The parent requires a storage
error, no work denial and incoming-floor restoration. The exact later failing
allocation was not instrumented. Duplicate rows are preserved, not collapsed
into extra successful sessions. The 19-block roots still have zero assertions;
this is not positive actual assertion coverage.

Cumulative work increases by 25,727,151 for Identity/error/panic and 25,727,219
for Swap01, including prepaid negative controls. These are accounting deltas,
not GPU timings. Per-entry costs derived by subtracting the source-level
precharges are consistency inferences, not instrumented measurements.

These checks can expose stale or foreign source associations, omitted effect
fields, changed ordinary refusal behavior and incorrect resource ownership.
They do not establish nominal normal admission, formal memory safety, nominal
LLVM continuation, native helper execution, GPU execution or edited-source
promotion. Normal helper compilation remains refused until the missing
connections and checks are implemented and qualified.

No activation, public authoring command, global compiler pin or route maturity
changes are part of this tutorial. Accepted broad exits remain
M1/V1/V2/U1/U2/U3 (6/18).

### Later original-ledger context checkpoint

The [separate recipe-context checkpoint 27ba44e2616945481557f4555f67327aabbab043](https://github.com/harsh-nod/fe2o3/blob/27ba44e2616945481557f4555f67327aabbab043/docs/bf16-recipe-resource-context-qualification-20260926.md)
qualifies the later context with fresh R16 evidence, not by reusing R15.
It passed 331 model tests, 2,572 backend tests, build, five real-source sessions,
36+2 normal-compilation sessions and 40 lossless-comparison controls.
All 38 normal observation bodies and 52 output artifacts match the preceding
ordinary compiler checkpoint exactly.

The context borrows actual canonical facts and the original ledger. It does not
refund storage: the outer owner drops retained payloads after nested postflights,
then releases only its own credits. Callback surplus survives; foreign ledgers,
masked facts and lost custody refuse. Actual materialization observations cover
19 source blocks, not a checked-reference certificate or assertion mask.

No checked-origin graph or complete nominal kernel recipe is supplied by this
context. Normal helper admission, source-to-ranked placement and the remaining
formal/target/LLVM connections stay open. Accepted broad exits remain 6/18.

### Later initial-graph and reference-origin checkpoint

The [source-bound graph/origin checkpoint](https://github.com/harsh-nod/fe2o3/blob/660c2b41aa69295e174141f0d9dc81c856bce36a/docs/bf16-initial-graph-reference-origin-qualification-20260926.md)
qualifies the next preparation stages with fresh R18 evidence. The initial
capability graph borrows the actual source owner, inventory, checked call,
rich tables and canonical facts on the original ledger. Graph storage stays
in an outer pending owner through error, panic and enclosing postflights;
cleanup releases only its own credits.

The reference-origin algorithm is shared with the ordinary path, preserving
shared-borrow seed order, guarded-call order, definition/Option checks and
FIFO propagation. Its paid result is still UNJOINED intermediate data.
A guard count, matching source coordinates or a graph observation cannot
authenticate the actual guarded-access vector. There is no ready constructor.

Qualification passed 331 model tests, 2,598 backend tests (189 ignored),
backend/extractor build, five actual Rust sessions and 55 comparison controls.
The separate ordinary ladders passed 38 sessions; all 38 observation bodies
and 52 artifacts match the preceding checkpoint exactly.
The lossless R16-to-R18 comparison rehashed both 459-file dependency closures.
Exactly 132 report fields changed: 96 work fields, 25 generation paths,
six dependency digests and five artifact digests. Numerical results, masks,
refusals, storage and peaks are unchanged. Logical work increases include
prepaid negative controls; they are not GPU timings.

| Completed evidence | SHA-256 |
| --- | --- |
| Merged regression | `f9543053b78616b3f91b81cfe6ce7ff57afec7bdd026b888b0fad9c864d6e5d5` |
| Five fresh Rust sessions | `033aee8a73f182d6c8920e012589cd6cf88ea4ed35a1ebdbf1b504801d0291bf` |
| Normal ladders | `3cee55d18cbc785903adfc1e0d4763ead462cbd852678069061f6f004685d644` |
| Lossless comparison | `a19c066c5c61cc3d094f8323eb47938489224b30474d3d593fb9b75e85b4a070` |

For authors, these checks catch stale source associations, graph-order changes,
wrong origin propagation and incorrect resource ownership. They do not yet
establish complete nominal-kernel memory safety or native correctness.
The actual fixtures have ten alias edges and zero enum edges; they do not
provide positive enum or actual assertion coverage.

The remaining connection must bind each actual successful access append to
its exact source call/destination, share index/value/operation ownership,
and join real dereference sites, Final effects, expanded CFG and placement
in one complete unverified root recipe before verification.
Normal helper admission remains refused. This does not add nominal LLVM
continuation, edited-source promotion, a new public command or a global
compiler pin change. Accepted exits remain M1/V1/V2/U1/U2/U3 (6/18).

### Complete graph for the supported source profile

The [supported-profile checkpoint](https://github.com/harsh-nod/fe2o3/blob/cc69a2e09c867a30990e48f8d7005db67bec0f80/docs/bf16-complete-profile-graph-qualification-20260926.md)
adds a private immutable completion loan. It rejoins the actual function,
callable inventory and checked source call by identity. Completeness applies
only to the unchanged closed profile: general GridLeader recovery is still
refused. A cloned owner, row count or caller boolean cannot construct the loan.

The completion wrapper and both lexical views are prepaid on the original
ledger. A separate 64-unit rejoin charge applies; retained payloads and credits
survive error, unwind and all enclosing postflights. Conservative overlapping
frame charges are intentional, not a peak-budget relaxation.

Qualification passed 331 model tests, 2,605 backend tests (189 ignored), build,
five fresh actual Rust sessions and 38 normal sessions. All 38 observation
bodies and 52 artifacts remain byte-identical. The lossless R16–R19 comparison
rehashes both 459-file dependency closures and changes exactly 132 report
fields under the existing policy. Actual graph semantics, positions and peaks
match R18. Owned credits are 33,912; total added logical work is 59,912,529 for
Identity/error/panic and 59,912,900 for Swap01. These include prepaid negative
controls and are not GPU timings.

Normal helper admission remains refused. Actual index/value namespace,
guarded-access appends, checked origins and semantic sites must still join the
complete unverified root recipe before mandatory verification. This completion
loan alone grants no launch, edited-source promotion or nominal LLVM
continuation. Actual fixtures still contain zero enum edges and no positive
assertion examples. Broad accepted exits remain M1/V1/V2/U1/U2/U3 (6/18).

Retained normal receipt:
`e332e21c16a2ea93930050b9886b941f45c2f373028f802d1fbc6006647910cb`.
Retained lossless comparison:
`652a436c781ffe80b408a3c8a514c3a1734ff0dffbd7da9c6cc1c2245ac3097d`.
The global compiler pin is unchanged; this is an explicitly linked later
checkpoint, not a silent replacement of earlier tutorial evidence.

### Shared invocation and index preparation: preserve the real namespace

The [shared invocation/index checkpoint](https://github.com/harsh-nod/fe2o3/blob/6588fd2c56c9996f18d0c80ec4a61e87adeadc73/docs/bf16-shared-invocation-index-qualification-20260926.md)
shares the ordinary invocation-seeding and index-propagation algorithms.
This is a compiler-internal development checkpoint, not a new runnable
kernel-authoring syntax or a public API.

#### Follow the existing operation stream

The ordinary helper borrows the actual operation stream and actual
`next_value`, including operations already emitted by earlier strided reads.
It does not reset, copy or rebase that namespace. Source-block seed order,
FIFO edge order, diagnostic text and the established refusal points remain
part of the behavior being preserved.

This internal model illustrates the existing nonzero-namespace component
control; it is not executable Rust, assembly or a launch command:

```text
before:       existing %80 = IndexConstant 17; next_value = 81
ThreadIndex:  append InvocationIndex %81;       next_value = 82
alias edges:  reuse %81 at each destination;    next_value = 82
after:        keep %80 and %81 in order;        next_value = 82
```

Aliases reuse the same value; they do not allocate another SSA identifier.
Equal duplicate capabilities do not enqueue again, while conflicting
capabilities refuse. The shared ordinary path preserves the real nonzero
namespace, not just the number of resulting rows.

The order of partial effects matters. For an invocation seed, operation
reservation, value allocation, operation append and diagnostic emission
precede scalar-custody refusal. A later failure can therefore leave an
already-emitted operation and diagnostic in the partial state. Checked
transforms likewise emit their operations and diagnostics before a duplicate
checked-predicate refusal or a destination-capability conflict. Extraction
must not move those refusals earlier or erase the partial state. Existing
alias-cycle and conflict regressions still call the same shared assignment
implementation through a test-only adapter.

#### Keep local paid data separate from root authority

The paid component produces **UNJOINED local component data** with a separate
operation stream beginning at value zero and launch extent zero. Those IDs
are not IDs in the actual root namespace. Do not splice that local stream
into the ordinary stream or turn its rows into an access witness.

This narrow component supports ThreadIndex seeds, aliases and authenticated
enum-payload edge data. It rejects GridLeader seeds and the other transform
families; their existing ordinary behavior is not removed. Its raw
function, scalar, dominance and edge inputs do not authenticate a matching
source owner, complete graph or guarded-access vector. A completion bit
describes local data completion only. There is no public ready constructor,
detached authority token, access certificate or root admission.

Work and storage are charged on the original ledger before bounded scans,
table growth and FIFO growth. An outer pending owner is installed before
fallible preparation and retains partial rows, emitted operations and
consumed FIFO entries. Retry, owner replacement, foreign ledgers and sticky
denial cannot be used to discard accounting history. Component controls keep
that owner alive across injected error and panic; payload disposal precedes
release of only its accepted credits. This is logical accounting, not native
allocator, RSS or machine-stack enforcement.

A future root connector must keep the actual operation allocator, source
owner and retained payload joined through every enclosing postflight.
The component controls do not claim that this production connector already
exists. The actual guarded-access appends, reference origins, semantic
dereference sites, retained Final effects and ranked placement still need
one complete unverified root recipe before mandatory verification.

#### Read the separate kinds of evidence

The regression passed 331 model tests and 2,617 backend tests, with 189 ignored,
plus backend/extractor build. Its 12 new component tests compare shared
ordinary behavior against frozen original algorithms and exercise the narrow
paid-data path. They are not twelve compiled or launched kernels.

R20 completed five actual Rust sessions: Identity, Swap01, wrong launch,
callback error and callback panic. They preserve the established source
observation route; this is **not a new S2 genuine hook** and does not exercise
the paid local component as an admitted root. The source fixture still has
zero enum edges and zero assertion terminators. Positive component controls
must not be presented as positive genuine coverage of those features.

The required publication checks comprise 67 strict comparison controls and
38 normal sessions, covering all 38 observation bodies and 52 artifacts.
Counts alone are not qualification; read the completed preservation evidence:

The completed run passed all 67 comparison controls. The strict R19-to-R20 parity gate reread both 459-file dependency closures (352,670,356 bytes each) and compared 2,868 report leaves. Exactly 36 fields changed: 25 generation paths, six dependency digests and five artifact digests. Work, numeric lexemes, masks, refusals, storage, peaks and all 372 graph rows/positions remain unchanged.

All 38 normal sessions completed: all 38 observation bodies and 52 artifacts match the predecessor byte-for-byte. The closed artifact roster contains 45 report-bound outputs and seven additional worker files. These are existing ordinary composition and direct-BF16 ladders, not admission of the nominal BF16 helper root.

| Evidence | Receipt SHA-256 |
| --- | --- |
| Shared-index regression | `a2b923ac90c5bb14761a01c4a2897243bc3b2b2a3ddf8bc011284ba9516b4a69` |
| Five fresh source sessions | `1ba149efa0ee6a85af79591a897db79269977edca808f16929d49215ff6fb5eb` |
| Strict R19-to-R20 parity | `38e20b32ce23cba4c11d9e351569a99a98ef7cc50d5b3439a7a4c3e78df85ce3` |
| Ordinary normal ladders | `d76b915291e3ee9c77892409c04757b14ca194a31cd4cd89fd222984cf34c351` |

These controls can catch value-ID collisions or renumbering, reordered
propagation, changed partial-emission/refusal behavior, and lost or
misattributed resource ownership. They do not independently prove the shared
algorithm, complete nominal-kernel memory safety or native correctness.

Normal helper admission remains refused. No public ready constructor,
detached authority token, access certificate or root admission is added.
This checkpoint adds no nominal LLVM continuation, edited-source promotion,
GPU execution, launch authority or debugger capability. The global compiler
pin and route maturity are unchanged; this is an explicitly linked later
checkpoint. Accepted broad exits remain M1/V1/V2/U1/U2/U3 (6/18).
