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

### Actual retained-input root prefix and indices: one assembly owner

The [actual root-prefix checkpoint](https://github.com/harsh-nod/fe2o3/blob/897b9915ccbc310831af08d45f56f956ed0ac78e/docs/bf16-actual-root-prefix-indices-qualification-20260926.md)
adds a private connector for the prefix and invocation/index stages described
above. This later checkpoint does not retroactively turn the earlier UNJOINED
component into a root recipe. It is compiler-internal work, not a new runnable
kernel-authoring syntax, public API or assembly launch command.

#### Connect actual retained inputs, not matching copies

A non-cloneable borrowed view carries the actual retained owner, ranked inputs
and reference bindings. Its lifetime-bound callback keeps that view from
escaping. The preparation factory checks the owner against both retained
canonical facts and checked emission data, then checks the complete selected
source/launch/kernel-binding roster.

Equal-valued cloned inputs can satisfy an isolated content-validation control,
but cannot construct or replace this private input view. The constructor is
owned by the pipeline and currently reached through genuine test routing;
there is no ordinary nominal-helper admission route.

The pending assembly owns the real operation stream and value-ID allocator.
Layout and reference-prefix operations are prepared first; the shared
invocation seed and index propagation then append in that same namespace.
No zero-based UNJOINED component is spliced, renumbered or promoted into it.
The ordinary extraction preserves source-rank order, constant/axis order and
the existing partial-emission/refusal ordering.

This non-executable sketch describes the current actual observation, not a
source API, Rust program or launch command:

```text
actual retained inputs -> ExecutionLayout; next_value = 0
same pending assembly  -> InvocationIndex %0; next_value = 1
observed result        -> 2 operations, 1 assigned local, 1 FIFO entry
still missing         -> actual guarded accesses and the complete root recipe
```

The current source graph can contain alias edges without an alias being
traversed from this particular invocation seed. The observed zero processed
index edges is not a claim that the complete source graph has no aliases.

#### Keep ownership and accounting attached

Prefix operations, reference-value IDs, rank scratch, index tables and consumed
FIFO entries remain in an outer pending owner across all nested callbacks and
postflights. The independent oracle's scratch is outer-owned too. Successful,
partial-error and panic paths must dispose of payloads before releasing only
their accepted credits; occupied owners and foreign ledgers refuse.

Work and storage stay on the original ledger. The genuine oracle independently
rescans the supported-profile source graph and checks every prefix operation,
value ID, index row and FIFO entry without invoking the shared emitter,
seeding, propagation or assignment routines. Summary counts alone do not
establish those joins. This is logical resource accounting, not native
allocator, RSS or machine-stack enforcement.

Fourteen new unit controls cover the shared prefix, actual namespace and
connector. Nonempty references are covered by inert component fixtures only.
The actual frontend still refuses nonempty reference bindings before retained
source preparation. Error and panic lifetime injections occur after complete
prefix/index preparation; they do not cover every possible allocation point.

#### Separate actual observations from remaining qualification

The regression passed 331 model tests and 2,631 backend tests, with 189 ignored,
plus backend/extractor build. Five fresh actual Rust sessions cover Identity,
Swap01, wrong launch, callback error and callback panic.

Each of the four prepared cases reports one root, zero references and reserved
reference values, two operations, next value ID one, 31 locals, one assignment,
zero processed index edges and one FIFO entry. Wrong launch refuses before
this preparation and emits no root-prefix diagnostic. These sessions do not
admit or execute the nominal helper as a GPU kernel.

Nine preparation/control runs consume 1,911,195 logical work units for
Identity/error/panic and 1,911,519 for Swap01. Accepted handoff frames add
15,040 work/storage units: 10,832 for the consuming continuation and 4,208 for
the borrowed-input view. These are measured logical debits, not GPU timings
or a performance improvement.

The consuming frame is retained during materialization and reverification;
the view frame begins after the retained owner exists. Original-ledger and
separately prepaid boundary-probe ledgers have different peak scopes.
Comparison must join each scope separately; a single blanket peak offset
would be incorrect.

All 38 ordinary sessions passed: 36 composition and two direct-BF16 sessions. Their 38 observation bodies and 52 artifacts are byte-identical to the preceding S2 checkpoint. This is preservation of existing ordinary routes, not admission of the nominal helper.

All 88 comparison controls and the separate cumulative R16-to-R21 and direct R20-to-R21 lossless comparisons passed. The checker reread all three 459-file dependency closures (352,670,356 bytes each), the complete 8,461-file compiled-source roster, and all 350 genuine-session request inputs. Both comparisons observe 232 differences within the exact 238-path policy; numerical results, masks, refusals and admission fields remain unchanged. Direct measured work increases are 1,926,235 for Identity/error/panic and 1,926,559 for Swap01; cumulative increases are 61,838,764 and 61,839,459. Callback floors increase by both accepted frames (15,040), while original-ledger replay peaks increase only by the consuming frame (10,832), from 1,632,943,151 to 1,632,953,983. The three separately prepaid graph probes retain their historical peaks of 817,434,912 or 817,435,488. All other storage remains exact; no blanket peak override is accepted.

| Evidence | Receipt SHA-256 |
| --- | --- |
| Actual-prefix regression | `2f43d6fdaf60ceb36172b132d44d46d59854877c5fc182501da98d5caa5948ad` |
| Five fresh source sessions | `550250c21fa206a282751939568af57a70bd9b43b65513d9fc2b7f634b269be8` |
| Ordinary preservation | `c86648d9c895d53f92861d4e239e8810a463d5328d98ba6538b957a31bfa88f9` |
| Strict comparison | `fa0374eab14def6cdd586765ba74c37b77ad6015aaf87bc720a5a7c77cd691bd` |

For kernel authors, this work can catch value-ID collisions or resets, lost
prefix operations, reordered FIFO propagation, stale/foreign owner joins,
incorrect reference-input associations and premature resource refunds.
It does not independently prove the shared algorithms, complete nominal-kernel
memory safety or native correctness.

Actual guarded-access appends, reference origins and dereference sites,
CFG/assertion handling, complete Final effects, bounds/reference-write checks,
launch/placement and mandatory verification still need one complete unverified
root recipe. Normal helper admission remains refused.

This checkpoint does not add public source-custody or ready-token authority,
detached/edited-input promotion, nominal LLVM continuation, GPU execution,
launch authority or debugger capture. The global compiler pin and route
maturity are unchanged. Accepted broad exits remain
M1/V1/V2/U1/U2/U3 (6/18).

### Actual guarded-access preparation: preserve the same assembly

The [guarded-access checkpoint](https://github.com/harsh-nod/fe2o3/blob/13a86af6283a24f9b78a844fd84fd0cac6a5a89a/docs/bf16-actual-guarded-access-qualification-20260926.md)
continues the private actual-input connector above through the existing
identity mutable-access operation. It is not a new source API, runnable
assembly syntax or launch command. The complete nominal-helper route remains
refused; the global compiler pin and route maturity are unchanged.

#### Follow the authored access without losing its owner

The real BF16 fixture contains `out.get_mut(thread::index_1d())` followed by a
conditional store through the returned reference. At this checkpoint the
compiler prepares the accessor's view, index and predicate data. It has not
yet joined the later store's semantic use site.

This non-executable sketch describes the measured intermediate state:

```text
same actual retained owner
  -> ExecutionLayout; InvocationIndex %0
  -> ViewInSpace %1; next_value = 2
  -> one cached view, one guarded-access template, one predicate
  -> reference origins and actual dereference/store sites still pending
```

The operations and IDs belong to the same pending assembly and original work
ledger. No independently prepared zero-based graph is promoted or renumbered
into it. Only the existing identity accessor is supported here; other producer
families have not been enabled by this checkpoint.

The accessor call and the memory-use site are different. The template keeps
`semantic_site = None` until the real dereference/store is projected.
Its proposed output extent is not whole-slice equivalence. Counts, copied
inputs and matching values cannot establish source custody or readiness.

#### Refusal and lifetime checks

The paid path keeps incomplete operations, cached views, comparisons, indices
and predicates in the outer pending owner through postflights. It drops those
payloads before releasing their accepted storage credits. Occupied payloads
including nonzero capacity, foreign ledgers and retries refuse.

The shared ordinary path preserves its existing allocation, diagnostic,
partial-emission and late-refusal ordering. New component tests cover short
work/storage budgets, cache conflicts, writable-access metadata and late
destination failures. They do not inject allocator/OOM failures. Genuine
callback error/panic controls occur after completed preparation, not at every
allocation point.

An independent genuine-source oracle rescans actual calls and compares every
access/cache/predicate field and the emitted operation/ID sequence without
calling the shared normalizer or emission helpers. Summary counts alone are
not this verification.

#### Read the evidence at its actual scope

The regression passed 331 model tests and 2,654 backend tests (189 ignored),
plus a backend/extractor build. Eighteen new component tests and five new
genuine-observer tests accompany five fresh actual Rust sessions.

Prepared cases contain three operations, next value ID two, one view, one
guarded access and one predicate. Wrong launch refuses before preparation.
Nine guarded-access observation/control runs debit 2,026,119 logical work
units, or 2,026,443 for Swap01. These are accounting measurements, not GPU
timings or a performance improvement.

All 141 comparison controls passed. The cumulative R16 and direct R20
comparisons each observe 232 changed fields; the separate direct R21 comparison
observes 132, within the unchanged 238-path policy. Numerical results, masks,
refusals and admission fields remain unchanged; direct R21 storage is exact.

Independently measured accepted-frame changes explain the entire S3 increase:
six times (1,648 + 16 + 16), or 10,080. Direct R21 work increases by 2,036,199
for Identity/error/panic and 2,036,523 for Swap01. Canonical calibration changes
only qualified provenance, including five metadata digests derived from two
fixed Cargo cache fields. No source-path, numerical or arbitrary hash override
is accepted.

The comparisons rehash the complete 8,465-file source roster and all 389
genuine-session inputs, plus three complete dependency closures for cumulative
checking and two for direct R21. Each closure contains 459 files and
352,670,356 bytes. Cumulative checking uses 10,435 reads and 1,243,303,089
content-plus-EOF bytes; direct R21 uses 9,963 reads and 890,579,220 bytes.
Both fit their unchanged 11,000-read / 1,280 MiB limits.

All 38 ordinary sessions passed: 36 composition and two direct-BF16 sessions.
All 38 observation bodies and 52 artifacts are byte-identical to S3.
This preserves ordinary routes; it does not admit the nominal helper.

| Completed evidence | SHA-256 |
| --- | --- |
| Ordinary ladders | `05ea729725cd2be5277d091bcc1a007abdd8b8816015221c4a4c706992ba18a5` |
| Comparison controls | `71fe3ba0e2b8077e07fcc682539b5b75243825ca3bc183444c9c96b6442dc19d` |
| Cumulative R16 / direct R20 | `dc519fc3a8ed4cb95b8ba5738ccbb8fbd50066eb8c9b546a435962ff9b35b418` |
| Direct R21 | `6ffc8bee869451f22124add1b172cd24133da580fa0471ebecd7f0c902b01d28` |

Reference-origin joins, actual memory-use sites, guards/CFG/assertions,
complete effects, bounds/reference-write checks and launch/placement still
need one complete unverified root recipe and mandatory verification.
There is no new public source-custody or ready-token authority, detached-input
promotion, nominal LLVM continuation, GPU launch or debugger capture.
Accepted broad exits remain M1/V1/V2/U1/U2/U3 (6/18).

### Actual reference origins: preserve the source-call association

The [source-origin checkpoint](https://github.com/harsh-nod/fe2o3/blob/e9f8ff94ca3b5664d4a9c8e4c15a8c117dfe310d/docs/bf16-actual-root-reference-origins-qualification-20260926.md)
continues the same private actual-input connector. This is not a new authoring
API, executable assembly syntax or launch command. The global compiler pin and
route maturity are unchanged, and the complete nominal-helper route remains refused.

#### Follow a reference, not a count

The real fixture's out.get_mut(thread::index_1d()) creates an accessor result.
A later conditional store uses a reference obtained from that result. The new
stage retains which actual source call produced each guard and propagates that
origin through the source's reference-flow graph.

This non-executable sketch separates source identities from later use sites:

~~~text
same retained source/input owner and original ledger
  -> existing prefix, index, cached view and guarded-access template
  -> source Call ordinal + block + callee + destination + guard index
  -> shared-borrow seeds first, then checked-call seeds
  -> original ordered reference-origin FIFO
  -> later dereference/store use-site projection is still pending
~~~

The source-call ordinal counts all Call terminators, not only accessors.
An intervening unrelated call advances the source ordinal without advancing
the guard's vector index. Counts, copied inputs and equal guard payloads are not source
custody. Associations and origin rows stay in the same pending assembly rather
than being reconstructed or spliced from another owner.

An accessor's source block is not the later store's semantic use site.
semantic_site remains None, and there is no operation insertion cursor here.
The next stage must project actual statement/terminator memory uses; complete
bounds/effects, guards/CFG/assertions and one unverified root recipe still need
mandatory verification before ordinary nominal-helper admission.

#### What the new checks catch

Component controls reject missing, duplicated, reordered and mismatched
associations, including equal-count source substitutions. They distinguish an
accessor's source ordinal from its guard index, refuse unavailable Some values
and multiply defined seeds, reject excluded accessor families, and preserve
foreign-ledger and occupied-owner refusals. These inert controls do not
establish new nominal source admission.

The genuine oracle independently rescans real source calls and definitions,
checks every association and propagated origin, and compares the exact FIFO
order. It does not invoke the production association or origin helpers.
Shared-borrow seeds precede checked-call seeds. Partial associations, nested
tables and consumed FIFO entries remain outer-owned through postflights;
payloads are dropped before accepted credits are refunded.

Logical short-budget controls are not injected allocator/OOM failures.
Genuine callback error/panic controls happen after preparation, not at every
allocation point.

#### Keep the measurements at their actual scope

The regression passed 331 model tests and 2,683 backend tests (189 ignored),
plus the backend/extractor build. Five current actual Rust sessions cover
Identity, Swap01, wrong launch and callback error/panic. Positive cases contain
one association, two origins and two FIFO entries from one seed. Wrong launch
emits no new preparation or accepted-frame rows.

Fixed test-only telemetry measures three accepted frame classes independently
for each S3, S4 and S5A observer. It changes no runtime layout or closure capture.
The historical S4 probe measures its own S4 graph frames; old S3 frame values
cannot stand in for that different scope. Every current positive case has
77 telemetry rows; historical S4 has 56. The new five-run origin work is
1,550,028 logical units for Identity/error/panic or 1,550,208 for Swap01.
These are not GPU timings or a performance improvement.

All 181 comparison controls passed. The direct R22-to-R23 comparison changes 132 fields within its strict 138-path policy: 96 work fields and 36 provenance fields. Every old storage/peak, kernel numerical result, mask, refusal and admission field remains exact. Independently measured same-scope frame differences explain 3,120 added S3 work units; S4 adds 4,608 from its own frame differences and the complete source-call association pass. Adding the measured five-run origin work gives 1,557,756 additional units for Identity/error/panic, or 1,557,936 for Swap01. No unexplained residual is accepted.

Historical zero-work calibration has 47 changes within the separate fixed-cache 143-path policy, including a measured 1,116 dependency-byte increase and five metadata digests derived from two fixed Cargo cache fields. Its kernel numerical, work and storage results are unchanged. The full comparison rehashes all three complete 459-file dependency trees, all 455 current selected inputs and the complete 8,468-file current source roster. Its actual schedule is 10,484 reads and 1,237,630,855 content-plus-EOF bytes, within unchanged 11,000-read /1,280 MiB limits.

All 38 ordinary observation bodies and 52 artifacts are byte-identical to S4.
This preserves ordinary routes; it does not admit the nominal helper.

| Completed evidence | SHA-256 |
| --- | --- |
| Current genuine source | d8ebc77107c608c49e6d6be40f415ffd5819868586339c6eab6eb955902a0c0c |
| Historical scoped source | 5f7f6b467b0194e08e3049d205d26615f66fccf9588f889105132ac1adc76aef |
| Full source restoration | 80eb53e87b6f9acae152a2ef49b0540b97ce777b4b3a33f2e163be299f3fb83f |
| 181 comparison controls | 498cd797b2ffff7fc79390136b6032bb710c926c024e794668c3ffb18669f52a |
| Ordinary ladders | 25deb1df8462f16d5984a035bd0b9c2daaba1970cf3036aab2919d3b28d809d7 |
| Direct/historical lossless comparison | 60a71385c4f75a9ce6718b7016f501694e8c8741fda2e7500a00d9ed03a92da0 |

No public source-custody or ready-token authority, checked memory-use sites,
complete nominal recipe, edited-input promotion, nominal LLVM continuation,
GPU launch or debugger capture is supplied. Accepted broad exits remain
M1/V1/V2/U1/U2/U3 (6/18).

### Source-use and borrowed-local components: what is still pending

The [component checkpoint](https://github.com/harsh-nod/fe2o3/blob/8b20da0620702352275371526d80e588f2ba8aa2/docs/bf16-source-use-local-contract-components-20260926.md)
adds private source-occurrence selection and borrowed local contracts on the
original ledger. This is compiler infrastructure, not a new authoring API or
an executable assembly tutorial.

A source occurrence is identified by its block, statement or terminator, and
operand ordinal. It is not an emitted operation index. The selector preserves
the real access kind, atomic contract and source provenance. Borrowed local
decisions retain the ordinary immutable predicate: non-entry local, exactly one
definition, an available assignment, and no escape. Allocation and provenance
fallback order remain unchanged.

Each new factory extends a single-visit pending assembly. The factories are
separate paths; they must not be called sequentially on the same started owner.
A missing origin is data, not proof of a checked access. Guard semantic sites
remain unassigned, and calls, tail calls and drops remain incomplete here.
Paid emit/bind helpers do not yet form a complete actual-source operation stream.

The completed component qualification passed 331 model tests and 2,723 backend
tests, with 189 ignored, plus builds and 17 existing telemetry controls.
All 38 ordinary observation bodies and 52 artifacts are byte-identical to the
published source-origin checkpoint. These tests preserve ordinary behavior;
the new actual-source factories still require separate real-source qualification.
The independent source oracle and its actual per-scope measurements are pending,
not inferred from the component or ordinary-path tests.

Completed regression receipt:
`5425d43b6fc3cfca6e625e9bd04b83102d7a9baf53d55b816a7f2eb11593796f`.
Ordinary-ladder receipt:
`841e2202810a80be75fb38cd4c9bea44996e6860a24f8e26293b81c80560f941`.
Lossless ordinary readback:
`016005cc76a6aee210dcbb2f998bcc0fd057b03908f95fc0164d45e35611a403`.

In the debugger lane, the private diagnostic build/static checks and 153
captured-evidence decoder controls passed. No debugger startup, target execution
or new physical capture is claimed. Helper profiles, operational controls,
startup/loaded-closure observation and a bounded native attempt remain pending.

The global compiler pin and route maturity are unchanged. Complete block
emission, defined-call routing, mandatory verification and normal nominal-helper
continuation remain open. No ready-token authority or public capture gate is
added. Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Actual source-use qualification: distinguish data from a compiled kernel

The [actual-source checkpoint](https://github.com/harsh-nod/fe2o3/blob/fa631dba8bfabac97b113c97973faebdc077201a/docs/bf16-actual-source-use-qualification-20260926.md)
supersedes the earlier checkpoint's pending real-source observer qualification.
The older section remains historical evidence. This is still private compiler
infrastructure, not a new public authoring command.

#### Inspect the source occurrence and its owner

Five fresh Rust sessions now enter the source-use and borrowed-local factories
through actual retained owners. The independent source oracle checks occurrences
and local decisions. It does not substitute aggregate counts for full comparison.

Keep the source block, statement or terminator, and operand ordinal together.
Those coordinates are not emitted operation indices. A missing reference origin
is still data, not proof that an access is checked. The two factories use separate
single-visit assemblies; do not chain them on one started owner.

These checks can catch substituted source occurrences, changed local decisions,
stale or foreign owners, unpaid preparation and incorrect cleanup. They do not
establish complete bounds, race freedom, a complete kernel recipe or GPU behavior.
Guard semantic sites and the real operation cursor still need implementation.

#### Understand an explained diagnostic peak

The test-only rich-lifetime trace records entry, accepted header, callback,
physical drops and refund boundaries. The comparison derives the complete
same-generic-instance header sizes from source and checks which interval
dominates the peak. It checks the outside intervals too.

Three inherited initial-graph diagnostic peak pairs per reached case differ by
16 bytes. That difference is explained by the source-derived live-header formula;
it is not an arbitrary tolerance. Every report storage/peak field and all other
inherited diagnostics remain exact. The report peak is 1,632,953,983 logical
bytes, not measured RSS. Historical headers are reconstructed from the same
generic-instance formula, not represented as newly observed historical events.

The host test ABI is distinct from the GPU target. The same pinned toolchain and
selected configuration are checked, without claiming a hermetic Cargo environment.
A trace line alone is not a completed qualification receipt.

#### Read the completed checks

The regression passed 331 model tests and 2,780 backend tests, with 189 ignored.
All 306 comparison controls, five real Rust sessions and strict actual comparison
passed. All 38 ordinary observation bodies and 52 artifacts remain byte-identical
to the previous qualified normal checkpoint.

The comparison rehashes both full 459-file dependency trees, all 714 selected
inputs and the 8,479-file implementation snapshot. The complete 8,478-file parent
aggregate is reconstructed independently. No unrelated whole historical source
inverse is claimed. The unchanged strict 138-field policy allows only documented
provenance/work changes; the new diagnostic relation grants no admission.

Completed strict comparison:
`cd8fc5439b107f0cf41ad654efcc6c64f7f3bd5badace6826ee87c1e39e94481`.
Completed ordinary comparison:
`5de5a0a1e20bdb71602cb2bf77136ed6ed7e34690406283a20190243215d7858`.

#### Keep debugger startup separate from visualization capture

The parallel private debugger startup passed two commands and 14 records without
starting an inferior. Process census and cleanup checks passed; controller CPU
checks passed 151 tests, strict Clippy and build. This is not a stopped-wave
capture, target dispatch or successful full native command sequence.

The historical-evidence adapter and complete current dependency revalidation,
native family build/replay and a fresh bounded native attempt remain pending.
No public capture gate, global compiler pin or route maturity changes here.

Source-bound bounds preparation, authentic producer state, complete block
emission, source-to-ranked correspondence and mandatory verification/normal
continuation remain open. No new nominal LLVM continuation, GPU execution,
edited-source promotion or ready-token authority is supplied.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Bounds preparation: exact source guards before continuation

The [bounds component checkpoint](https://github.com/harsh-nod/fe2o3/blob/da9793fe559f7de56d32c78e077037639e0a4455/docs/bf16-bounds-components-qualification-20260926.md)
adds private source scanning, extent tracking and fixed-array guard sessions.
These are compiler components, not a new public authoring API.

#### Read a guard from its actual source

A fixed-array query selects the original BoundsCheck Assert by source block.
It does not accept a caller-supplied replacement index, bound or condition.
The existing exact unsigned index < nonzero literal-extent comparison, stable
definition, dominance and address-escape checks still apply. Swapped operands,
late or duplicate definitions, escaped values and mismatched messages refuse.

Matching the helper is only one step. The surrounding collector still checks
the unique success predecessor and rejects an entry-block success target.
Do not treat a helper result as proof of a complete safe memory access.

Source coordinates remain distinct from emitted operation indices. Equal-content
foreign source/type/graph loans and foreign resource ledgers are not interchangeable.
A failed prepared guard session cannot be retried as a fresh successful session.

#### Preserve state even when an expression refuses

Suppose the left operand of a comparison materializes an argument slot or a
constant operation, but the right operand is unsupported. The original compiler
may retain that left-side mutation. Resuming with empty slots, a reset value
counter or a guessed next argument would change compilation.

The extent component therefore takes authentic producer state rather than
inventing an empty roster. Wiring the complete source-ordered producer into the
actual bounds factory remains work in progress. The eager fixed-guard component
also still needs the collector's lazy first-use event and joint ownership of its
proof, extent and operation storage.

#### Exercise refusals and resource limits

The new controls cover changed source occurrences, stale loans, wrong bounds
messages, duplicate/late/escaped definitions, projection/equality precharges,
one-short work/storage budgets, sticky failure and drop-before-refund cleanup.
Their independent oracle is the frozen original helper, not the new implementation.

Thirty source-scan, 34 extent and 21 fixed-guard controls passed: 85 new tests.
The full suite passed 331 model and 2,865 backend tests, with 189 ignored.
All 38 normal observation bodies and 52 artifacts were unchanged.
These logical resource checks do not measure process RSS or GPU performance.

Regression receipt:
`048bbef5179abe42c9ae65ccce21a8a29d1cf82cdd1d6c2559d71832e932e161`.
Normal comparison receipt: `b6410a81a846e5e4d946e609a468a9830bfb285026ca29243d292bfd7658756e`.

The historical debugger-evidence adapter has separately passed 107 controls and
an actual retained-evidence run. It does not prove current target execution or
stopped-wave capture. The current-build consumer has now passed 59 focused CPU controls and its
full source inverse. Current family composition, replay and native qualification
remain separate work; no public capture gate changes here.

Complete bounds-factory admission, full operation streams and mandatory normal
continuation are still pending. No global compiler pin or route maturity changes.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Operand preparation: preserve changes made before refusal

The [uniform operand checkpoint](https://github.com/harsh-nod/fe2o3/blob/541c1c4d7d52e8711b5aee28943fe6bb4072a6e0/docs/bf16-uniform-operand-qualification-20260926.md)
shares the existing operand decisions with a private metered component. It does
not add a new public authoring API or admit complete kernels by itself.

When a left operand assigns an argument slot or emits a constant operation,
a later unsupported right operand does not undo that earlier change. Likewise,
a successful operation-vector reservation remains owned if SSA allocation then
fails. Resetting the counter or rebuilding empty slots would change the compiler's
behavior. The component therefore borrows the caller's actual slots, counter,
operation vector and SSA allocator.

Constant lookup still occurs first. Projection work is prepaid only when that
lookup misses. New argument conversion, counter advancement and slot installation
are prepaid together. The outer caller retains partial physical state and accepted
credits through postflight, then drops payloads before refunding storage.

Thirteen new controls passed, including an independent frozen original-helper
oracle, one-short work/storage limits, malformed origins, partial mutations and
unwind cleanup. Independent review corrected the separate nested constant-helper
frame accounting before qualification. These are logical source-resource checks,
not measurements of native stack, RSS or GPU performance.

Full regression passed 331 model and 2,878 backend tests (189 ignored), build
and 83 JavaScript controls. Both ordinary-source ladders passed, with all
38 observation bodies and 52 artifacts unchanged.
Regression receipt:
`69fb48571ca1641f97f323df12a1eb7ca5958cc6a106255b64fe8d2eb4563441`.
Normal comparison:
`b7df8a534a4702f22898ed39ebd19054955674d733de2db727ff292378e1769d`.

The complete current debugger family has separately passed 33 Rust and 299 Node
CPU controls. Its first run exposed a stale expected startup digest; a test-only
correction replaced that digest, preserved every runtime byte and reran the
complete suite. Three historical startup suites remain explicitly historical.
CPU receipt: `86e8c6482b2ad7625621c7fdc5d986794fedab87664d0e25c6652f9056a1acfd`.
CPU qualification is not a native build, stopped-wave capture or visualization
execution. Build, deployment, replay and native qualification remain separate.

Authentic preceding and later argument producers, the final extent-count rule,
lazy joint ownership, complete operation streams and mandatory continuation remain
unfinished. The separate preparation-policy refactor is not in this checkpoint.
No global compiler pin, public capture gate or route maturity changes.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Shared preparation policy and retained direct comparisons

The [policy/comparison checkpoint](https://github.com/harsh-nod/fe2o3/blob/b53cce7fee8c0cdaa9f6c6b7f453d702944dcfae/docs/bf16-policy-direct-comparison-qualification-20260926.md)
adds private components for allocation policy and source-ordered comparison
preparation. It does not complete whole-kernel admission or add a public API.

The shared allocation policy preserves the ordinary method bodies through item
macros, without adding runtime wrapper calls to their existing callers.
Checked length, fitting capacity, debit order and reservation behavior remain
unchanged. Ordinary growth stays amortized; paid growth stays exact. The sealed
assertion adapter adds its own strict-owner and denial checks. Future callers
must still admit their concrete generic frames.

Direct comparisons visit actual blocks and statements in source order, then
evaluate the left operand before the right. Earlier argument slots, counter
advances, operations and SSA changes remain when a later step refuses.
Duplicate predicates retain both physical payloads. Conflicting predicates and
allocation failures retain their pending candidate, and the owner becomes
terminal. The enclosing factory must keep these buffers through postflight,
then drop payloads before refunding credits.

Thirteen policy controls and twenty-five comparison controls passed. The full
regression passed 331 model and 2,916 backend tests (189 ignored), build and
83 JavaScript controls. Both ordinary compilation ladders passed: all
38 lossless observation bodies and 52 artifacts match the preceding checkpoint.
Regression receipt:
`f17410b02a30ff6d0d3e65891e12a012dcb06bbccca5a396127892cdd645a970`.
Normal comparison:
`eed65c7bf4f9f19e965d823a3fd11619eee8b713d5b563c6877701ebdb3f4687`.

These are selected-source logical work/storage checks, not native stack, RSS or
GPU measurements. The successful component view is DATA, not an authenticated
all-producer continuation. Function and budget/work identity alone do not
authenticate a supplied owned-credit counter or every input roster.

The debugger's separate staged path has now passed 39 controls and actual
admission over all 184 CPU-qualified input roles. Its scope owner and 26 companion
modules were built and deployed with exact copy checks: 27 products total.
Build receipt:
`e0bbbeb63445bc1c5a43b73533a48a94273e3c9614e11677112ff2f035f8583f`.
The actual read/copy debit was 283,603,604 bytes under the unchanged 536,870,912-byte
cap. No scope owner, launcher, debugger, target or GPU dispatch was invoked.
Read-only replay and fresh native capture remain separate, pending qualifications.

Lazy proof ownership, one joint bounds driver, remaining argument producers,
authentic handoff and production routing remain open. No global compiler pin,
public capture gate or route-maturity change is made here.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Lazy first-use proofs and read-only debugger replay

The [lazy-proof checkpoint](https://github.com/harsh-nod/fe2o3/blob/03ad28883fa8bd615baf71c54fe88508a5752ce3/docs/bf16-lazy-fixed-proof-qualification-20260926.md)
keeps proof construction at the first fixed-bound event. Literal and non-fixed
cases do not eagerly build it. Canonical shape and length checks precede index
lookup, and the original preparation loan is consumed once.

Pending, Building and Ready states retain partial proof buffers and candidates
across later refusal. The retained-push adapter admits frame, work and exact
reservation before moving the caller's candidate. A failed component cannot
restart. A successful guard view is DATA, not a complete bounds operation or
authenticated whole-kernel continuation.

Twenty-six new controls passed. Full regression passed 331 model and 2,942
backend tests (189 ignored), backend build and 83 JavaScript controls. Both
ordinary ladders passed; all 38 lossless observation bodies and 52 artifacts
match the previous checkpoint exactly. Regression receipt:
`b6e603ed3582f5a4f0780839843f60c3a44dfb863ee237323351c7535f8277e3`.
Normal comparison:
`6dcd44c2f2fcc07c8f6faeee3fd3efe5e59962f8a2793f58cb700690cac31e45`.

The [debugger deployment replay](https://github.com/harsh-nod/fe2o3/blob/03ad28883fa8bd615baf71c54fe88508a5752ce3/docs/debugger-readonly-replay-qualification-20260926.md)
has now passed 30 controls and actual read-only validation of 27 products,
38 runtime sources and 16 startup import modules. It accepted 93 benign records
and 310 startup records. Replay receipt:
`83a84030a13676d2c36793c980325b25f4201d078aba492bf649c34ef0b7b70f`.

The explicit driver charged 14,029,167 bytes and 526 reads including EOF under
its unchanged limits. Other validators retain separate original ledgers;
this is not a combined 512 MiB claim. Module-loader I/O is separate, and
cooperative deadline checks still need the finite outer supervisor.

No scope owner, controller, debugger, target or GPU was invoked. The replay did
not create a current process census, native lease or physical capture. A fresh
native run still needs coordinated writer quiescence, exact process-generation
binding, cleanup acknowledgement and accepted postflight.

The enclosing compiler factory still needs physical proof-payload retention
through postflight and drop before refund. Authentic argument initialization,
earlier producer chronology, the joint bounds driver, remaining writers and
production routing remain open. This checkpoint adds no public authoring API,
global compiler pin or public capture gate.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Authentic argument initialization and loaded-runtime commit diagnosis

The [argument-initialization checkpoint](https://github.com/harsh-nod/fe2o3/blob/88d3df97ec0cde7047e03f9fa3f56c9cb97fe7b1/docs/bf16-root-argument-initialization-qualification-20260927.md)
uses the original root source, owner, graph and recipe-credit counter. The same
pending prefix initializes index slots, then slice slots, then the argument
counter. Refusal or unwind leaves a terminal owner; initialization cannot restart.

Fifteen new controls passed. Full regression passed 331 model and 2,957 backend
tests (189 ignored), backend build and 83 JavaScript controls. The genuine-source
CPU ladder passed five actual rustc sessions and 36 positive numerical runs.
Identity, swapped-input, error and panic sessions each produced the actual
initialization marker once, before later writers.

Both ordinary ladders passed; all 38 lossless observation bodies and 52 artifacts
match the preceding checkpoint exactly. Regression receipt:
`730715d7b653bbdf4cd4579f5353733acfd48e5b66a5ec7bdf9cd518b9791ca2`.
Genuine-source receipt:
`9ac648203bdbb3a6e1a507c8adccd70ed4cd422c30cfd8e64a205e0376e10615`.
Normal comparison:
`784ee5b801c1cdae3ce0420587a9cb5c5f0258753001886b849f9f7254b5a8d1`.

This is internal preparation DATA, not a public authoring API or full production
route. It does not establish that the ordinary Option-first prelude or later
writers ran. Physical retention through factory postflight, drop before refund,
the joint bounds driver and final mandatory verification remain open.

The [fresh debugger attempt](https://github.com/harsh-nod/fe2o3/blob/88d3df97ec0cde7047e03f9fa3f56c9cb97fe7b1/docs/debugger-commit-boundary-diagnosis-20260927.md)
refused at commit-site 7 after the runtime loaded. No stopped-wave capture was
accepted. GDB issued a maintenance commit after the loaded ACK retired the
unloaded-entry epoch. That commit has real forward-progress effects; the guard
must not be skipped or the old epoch rearmed. A separately authenticated
loaded-host maintenance transition is being implemented.

Selected-family cleanup passed: the four selected process generations and owned
cgroup were absent. Root separately verified the unchanged source and 1,009
input/17 tool bindings. This is manual postflight evidence, not a passed native
receipt, global quiescence or reusable capture authority. Failed native receipt:
`a3c5de301d7c2e052205f38d04af7bd56ad2dda572ca90f98da626c7d9f187b3`.

A successor still needs actual-body controls, full debugger build and layout
checks, deployment/replay binding, a fresh coordinated bounded attempt and
accepted cleanup/postflight. The public capture gate and global compiler pin
remain unchanged. Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Retained analysis and proof payloads before factory integration

The [retention checkpoint](https://github.com/harsh-nod/fe2o3/blob/20fa1338ce815a4dde2ee33c4a13931780ebbd47/docs/bf16-retained-payload-prerequisites-qualification-20260927.md)
provides three opaque model-preparation owners and a lifetime-free lazy-proof
retirement bridge. This is internal compiler groundwork, not a new public
authoring API or a complete production route.

The preparation owners retain intermediate vectors and staged boxes through
refusal or unwind. Their private fields cannot be cloned, reset or extracted.
Only completed DATA can be borrowed; retry closes that borrow while retaining
the physical payload. Original returning APIs and dynamic debit order are
unchanged. The fixed-storage inventory follows the existing model policy;
it does not claim a new native-stack bound or per-instruction work proof.

The retirement bridge moves checked rows, cache storage and side tables into an
opaque payload without keeping source/resource loans. It installs that payload
before returning an error or resuming the same panic object. The caller still
must retain the owner and accepted credits through postflight, drop the owner,
then refund. These components alone do not authenticate that enclosing lifecycle.

All 48 new controls passed: 25 retained-model and 23 retirement controls.
Full regression passed 356 model and 2,980 backend tests (189 ignored), backend
build and 83 JavaScript controls. Both ordinary compilation ladders passed;
all 38 lossless observation bodies and 52 artifacts match the preceding
argument-initialization checkpoint exactly.

Regression receipt:
`5d56ce6638ca1c3ef7b4b1406e17a76e229276da6aa92ff72ec1650fcacd730b`.
Normal-comparison receipt:
`baec6bb9110ca2f6e56a90bcd835b33cd3b651c8c49dc2fde6566b4119ac5f5b`.

The same-pending authentic factory connection and genuine observation are still
being implemented. An independent fixed-query oracle must retain its own partial
storage; missing fixed-query coverage is a gap, not successful proof coverage.
The original Option-first prelude, remaining writers, joint bounds driver,
mandatory verification and production routing remain open. Component fixtures
are not whole-factory qualification or native GPU evidence.

The public capture gate and global compiler pin remain unchanged.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Authentic source-factory proof retirement

The [authentic retirement checkpoint](https://github.com/harsh-nod/fe2o3/blob/a1ec243fa821d1028e78b1b87da3d5030783a323/docs/bf16-authentic-proof-retirement-qualification-20260927.md)
connects the proof payload to the original pending owner. It uses the actual root
CFG, canonical facts, recipe context and original Budget, preserving the existing
callback interface. This is internal compiler groundwork, not a new public API
or a complete ordinary compilation route.

The payload is installed before return/error or resuming the same panic object.
It survives nested source/context postflights and the pending-credit check.
The pending owner is then dropped before refund to the original counter.
An occupied slot fails before admission; it cannot be silently replaced.

Five genuine observer modes cover Empty, Error, Panic, Reentry and Prefix.
The prefix oracle independently classifies source terminators and records source
coordinates. It stops BEFORE visit at the first unsupported fixed-query candidate.
That is a coverage boundary, not a successful fixed proof or a fixed-query
refusal. Genuine nonempty/partial proof coverage remains open; component fixtures
do not establish that whole-factory behavior.

All 30 new controls passed. Full regression passed 356 model and 3,010 backend
tests (189 ignored), backend build and 83 JavaScript controls. Five genuine
compilation sessions passed the numerical and refusal checks. Both ordinary
compilation ladders passed: 38 lossless observation bodies and 52 artifacts
match the preceding retained-payload checkpoint exactly.

Accepted frame accounting records the checked 101,516-byte total, while the
direct whole-observer work measurement includes entry prework. Inner callback
counters are not substituted for the whole measurement. These are logical
resource policies, not native stack/RSS or native GPU measurements.

Regression receipt:
`57a30bccca8122f61532e7a6a4ff685c4028ffc5f25192b09fdb0b9addb4109b`.
Genuine-source receipt:
`ececc3c4d997af10d24f1eab430ae18219759ff8dd08e927d3ab4a05759271dd`.
Normal-comparison receipt:
`46700cb6e94958bafbca110293bf6d1e3c127484eff2c5ed1df7cbd389322c8f`.

The independent original fixed-query oracle, Option-first prelude, later writers,
joint bounds driver, mandatory verification and production routing remain open.
The public capture gate and global compiler pin remain unchanged.
Accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Independent original constructor retention

The [original-constructor checkpoint](https://github.com/harsh-nod/fe2o3/blob/11e43b08c68dd1efc4acb246124218669770d31c/docs/original-fixed-constructor-retention-qualification-20260927.md)
adds test-only retained construction for the independent original fixed-proof
oracle. It leaves the production constructor unchanged. Original constructor
and debit-sequence copies provide the expectation; candidate lazy-owner output
does not provide expected data.

Partial checked-row storage and caches remain owned before each later fallible
checkpoint. Retirement preserves them through postflight, before destruction
and refund to the original Budget. Error and same-Box panic paths follow that
ordering. Occupied slots refuse without replacement; repeated preparation is
terminal.

All ten new controls passed, including each positive original debit with a
one-short budget, exact refusal priority and closed checkpoint panic custody.
Full regression passed 356 model and 3,020 backend tests (189 ignored), plus
backend/extractor build. Root verified seven original inverses, three additive
registration inverses and 56 source spans.

Regression receipt:
`1532dee9a08a6a5b352723e0e95bc222f8e718f18cfe53ad65116d16d95f576c`.
Publication receipt:
`80a3c7bb23dd46ca66392d5ef6199952cd2e421931e45eff69cedb580017992c`.

This is constructor coverage with empty query caches, not original query
execution or genuine nonempty proof comparison. Separate component comparison
budgets must not be described as one authentic Budget. Checkpoint panics do not
cover arbitrary meter unwind or allocator overcapacity. Logical typed frame
charges do not measure physical stack or RSS.

Next come original query-driver controls, exact nonempty cache/checked-row DATA
and then the same-source/Budget genuine connector. Later production stages
remain open. No public capture gate or global compiler pin change is made;
accepted broad exits remain M1/V1/V2/U1/U2/U3 (6/18).

### Independent original fixed-query execution

The [query-driver checkpoint](https://github.com/harsh-nod/fe2o3/blob/648a4885ad84817ea4e157bf72edb9668673cfc7/docs/original-fixed-query-driver-qualification-20260927.md)
adds test-only original query execution and retained nonempty payloads. Production
routing remains unchanged. Closed schedules admit at most 32 query ordinals:
empty schedules do not prepare, the first query constructs once, and later
queries reuse the caches.

All 13 controls passed, including repeated query results, original source
identity, exact unsigned width/extent data, original-discovered one-short debit
refusals, and same-Box post-query panic retention. A source-rejected argument
overwrite is checked before the rich callback; a separate temporary-local late
definition reaches and tests the query rejection. Full regression passed 356
model and 3,033 backend tests (189 ignored), plus backend/extractor build.

Regression receipt:
`e0631416e4fd17e3a6dd681fc66a2075cf0dde028c6ead22a6433e063f1edb34`.
Publication receipt:
`9bced215c5070113a49740b9f0dd60e717b7aa642e947ed577c5df3cf6f59fa4`.

These are synthetic component schedules, not the authentic source-classifier
connector. Allocation identity snapshots are not complete cache contents.
Separate comparison budgets are not one authentic Budget. Exact bounded
nonempty DATA and allocation preservation are next, then the authentic
source/Budget connector and later production stages. Logical accounting is not
physical stack or RSS. No public capture activation or global compiler pin
change; accepted broad exits remain M1/V1/V2/U1/U2/U3 (6/18).

### Complete bounded original-query DATA

The [complete-content checkpoint](https://github.com/harsh-nod/fe2o3/blob/bd10f4032fdd864207a6c6226e0d7b1f6a833fbc/docs/original-fixed-query-content-qualification-20260927.md)
adds test-only comparisons of full checked rows and cache keys, values and
insertion order. Production routing remains unchanged. The closed observation
admits at most 32 checked rows and 128 total checked entries, plus 128 entries
per strict cache. Oversized, legacy and owned-side contents refuse explicitly;
matching refusals never establish DATA equality.

All 21 new controls passed. Live, retired and final postflight content reads
preserve the same owned allocations, saved errors and same-Box panic payloads
until postflight completes. Destruction precedes credit refund. Full regression
passed 356 model and 3,054 backend tests (189 ignored), plus backend/extractor
build. The 34 added accounting rows are source-logical, not physical stack or RSS.

Regression receipt:
`25cc97d2c25a6ad46be34683bc608d85bc5a82c0b2e3b1d86620d0ffcb797e06`.
Publication receipt:
`f32c6d1ac775edc0912ed512313605455bb1c95209619c91e86047f9fc1f5d17`.

Independent component runs still use separate budgets. The authentic
same-source/shared-Budget connector remains open, as do later production stages.
Unavailable constructor-partial state is not reconstructed. Real fixed-query
zero-cache contents are currently empty; seeded storage controls do not establish
real query coverage. No public capture activation or global compiler pin change;
accepted broad exits remain M1/V1/V2/U1/U2/U3 (6/18).

### Authentic same-source fixed-query comparison

The [genuine comparison checkpoint](https://github.com/harsh-nod/fe2o3/blob/2ef4196907c0e80f912d5318a9ea1eb3a884c961/docs/original-fixed-query-genuine-qualification-20260928.md)
connects independent original queries and the candidate to the same authenticated
source and original resource Budget. The original owner stays alive while the
candidate runs. Complete bounded checked rows and ordered cache data remain
observable through postflight; payload destruction precedes credit refund.
Unavailable or refused data is not equality.

All 15 new controls passed, alongside 356 model / 3,174 backend tests and
backend/extractor builds. Five genuine Rust compilation sessions passed; the
identity and swapped-return cases completed 36 positive numerical CPU runs.
These source prefixes contain zero Fixed queries. The original-query-panic
observation therefore skips, and this does not qualify genuine nonempty proof
comparison. An additional Rust array-bounds fixture was rejected with
`BF16 semantic Assert is unavailable` before nominal-owner materialization.
It remains a failed experiment, not a positive proof or emitted-kernel test.

This is useful when reading compiler diagnostics: distinguish a source that
reaches a checker from a source rejected before that checker. Passing an empty
query set cannot establish behavior for nonempty queries. Likewise, independent
helper CPU results are not ordinary production admission or GPU observations.

Regression receipt:
`1990b8b3081201061f4414f7892e6c21f016c44c6d80445bf49ae78a351be799`.
Genuine-source receipt:
`6201a5c2880b4b9f036e40df65a86e9d79991f67a28a5a06eb1bec713bdb7390`.
Fresh integration qualification on the concurrently updated main passed 356 model
and 3,184 backend tests, builds and the five-session ladder:
`eff86f458e847e6d93bb0f227987497995ec70deec6f03c7f047baeab6f4e581`.

The Option-first prelude, later writers, joint bounds driver and ordinary
production route remain open. Logical resource accounting does not measure
physical stack or RSS. Public capture and the global compiler pin are unchanged;
accepted broad exits remain **M1/V1/V2/U1/U2/U3 (6/18)**.

### Source-ordered Option preparation before enum analysis

The next private compiler checkpoint retains Option producers and dominance on
the same authenticated source and original resource Budget, stopping at
`BeforeEnumV1`. Read the
[pinned implementation and qualification](https://github.com/harsh-nod/fe2o3/blob/f47a7a8ad5365cd50249dc60a58e4f930a1447b2/docs/option-first-preparation-qualification-20260928.md).
This is an internal compiler checkpoint, not a new public kernel-authoring API.

Inside this intrinsic-analysis suffix, the order is retired intrinsic prefix,
index/leader/predicate/edge preparation, Option producers, and Option dominance.
The pending owner retains partial and completed model allocations through
postflight. Destruction precedes refund to the original budget. Immutable views
cannot escape as owned proof, and sticky resource denials remain denials.

All 12 new controls passed, along with 356 model and 3,196 backend tests
(197 ignored), builds and five actual Rust-source sessions. The two positive
sources completed 36 numerical helper runs. Every eligible session compared
nonempty Option data against the unchanged original APIs in Compare,
CallbackError and CallbackPanic modes: one producer, one authenticated
Some-region/block pair, and positive dominance work. The real invalid-caller
control refused before callback entry. Wrong launch did not enter this hook.

The full regression/source receipt is
`3acb9662acf50ca4a960c2e5492503c2c507b276296358956ddd1a911be3ff8f`;
the complete source report is
`07419034ac2c045d5dce3209ee8bbf2c814dbf6bae049301192a669a8880774f`.

This is not the complete outer root chronology. Earlier constants/entry-prefix
work, retained enum/scalar continuation, later argument writers, joint bounds,
genuine nonempty Fixed proofs and production routing remain open. No native
capture or public gate is enabled; accepted exits remain
M1/V1/V2/U1/U2/U3 (6/18).

### Following enum, scalar and origin-analysis preparation

These stages explain how the compiler checks Rust-derived information before
a later assembly-authoring continuation can rely on it. They are private
implementation checkpoints, not additional public authoring APIs.

The qualified source-ordered checkpoint now reaches `BeforeScalarV1`:
Option preparation runs first, then retained enum analysis. The same pending
owner keeps partial and completed allocations through checked postflight;
destruction happens before resource credits are refunded. Read the
[pinned enum implementation and qualification](https://github.com/harsh-nod/fe2o3/blob/c23ae965b1d7d35376a6c0cb075d05d9a489eace/docs/option-enum-preparation-qualification-20260928.md).

All 13 enum controls passed, with 356 model and 3,209 backend tests
(197 ignored), builds and five actual Rust-source sessions. Eligible sessions
executed the real enum analyzer in Compare, CallbackError and CallbackPanic
modes and compared complete data against unchanged original APIs. The two
positive sources completed 36 numerical helper runs. Analyzer invocation does
not establish genuine nonempty enum availability; that remains separate work.

The next two dependencies are qualified as isolated components:

- [Retained scalar inventory](https://github.com/harsh-nod/fe2o3/blob/5d05fe941523d4ccb82ae1f1976f8f6a3d82eeda/docs/retained-scalar-inventory-qualification-20260928.md)
  keeps definition counts, block assignments, address-escape information and
  partial candidates attached on failure. All 13 controls passed; full regression
  passed 356 model and 3,222 backend tests (197 ignored), plus builds.
- [Retained exact-origin FIFO worklist](https://github.com/harsh-nod/fe2o3/blob/43edfa3bf5587dbf145f2dc85f409e4ebd5bc787/docs/retained-origin-worklist-qualification-20260928.md)
  preserves original queue order, successor order, conflicts and partial updates.
  All 11 controls passed; full regression passed 356 model and 3,233 backend tests
  (197 ignored), plus builds. Its origins and edges remain caller-owned.

Neither component yet establishes the genuine continuation that joins it to the
authenticated source. Lexical address/ledger checks are not durable authority.
Logical resource accounting is not measured native stack, allocator capacity or
RSS. No GPU execution or native debugger capture is established by these tests.

For a code-reading exercise, follow an Option-producing call through the pinned
enum checkpoint, then inspect the scalar and FIFO failure controls. Distinguish
three outcomes: a semantic conflict, an exhausted resource budget, and callback
failure after successful preparation. Check that partial allocations remain
owned until postflight in each case. A positive component test is not permission
to feed arbitrary edited intermediate data into a production compilation route.

Qualification receipts, respectively:

- Enum: `48468d97aac89ebcf2030f693789c2ad25a8913155febf11028f47c1bb1570a6`.
- Scalar: `2e33325b3fd92bf966024543f4ac208801ea1c0a70bf25d141efd0480774aaca`.
- FIFO: `3b78019f35bfc8fa5ffc70469b80e27e87de06380a9e533c0688dbf37118dea5`.

Earlier root constants/entry work, carrier/provenance and capability integration,
genuine nonempty Fixed coverage, argument writers, joint bounds and production
admission remain open. Public gates and the global compiler pin are unchanged;
accepted exits remain M1/V1/V2/U1/U2/U3 (6/18).
