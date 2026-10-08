# Read recipe reports and debug changed source outcomes

Use `create-json` and `replay-json` to inspect one ordinary compiler result,
then diagnose whether a saved recipe can be rebound after a real Rust edit.
This follow-on to [Save and replay a local-order recipe from Rust](saved-local-order-recipes-v1.md)
is an authoring and debugging exercise, not a GPU benchmark. Keep that lab's
prepared compiler environment, complete observed rustc arguments, supported
gfx942 wave64 expression and create-new output rules.

The nine ordinary example processes, seven accepted results and two
designated refusals cover the commands below. A separate six-child campaign
checks the changed-source outcomes and 70 repeated calls. The dated evidence
at the end distinguishes the original candidate from the newer-main candidate;
neither checkpoint silently updates the site's global compiler pin. Use a
compiler checkout containing these exact commands and the outcome parser,
and record its revision with your own source and output evidence.

Do not copy the older positive-Replay timing numbers into either changed-source
workload. U4 completion, retained-owner memory and cancellation remain separate
acceptance obligations.

The command implementation is available in compiler commit
`5654782a316526aef9bb76602343a9a6a903e44d`, published to both compiler
repositories. The dated measurements below identify its exact pre-commit source
candidate; later documentation is not part of that measured source census.

## 1. Pick the right record

| Record | Purpose | What it cannot do |
| --- | --- | --- |
| Saved `fe2o3-source-local-order-recipe-v1` | Bounded order intent for a fresh compilation. | Resume a compiler owner or authenticate the current source. |
| `FE2O3_SOURCE_LOCAL_ORDER_REPORT_V1` | Diagnostic projection of one ordinary command's returned result. | Grant proof, artifact or launch authority; prove later file currentness. |
| `FE2O3_RECIPE_OUTCOME_V1` | Ordinary changed-source outcome used as a repeated-series oracle. | Replace the source/command receipts or supply an ordinary CLI report. |

The ordinary example calls `run_source_local_order_recipe_driver_v1`.
The changed-source test adapter uses the same consuming
`compile_source_local_order_recipe_v1` route, but is not the ordinary example.
Neither record is an importable compiler owner. Do not convert one JSON shape
into another merely because both describe the same edit.

## 2. Capture one ordinary JSON Create

Reuse the previous lab's measured `recipe_tool`, `source_rel`,
`current_source_sha` and complete `rustc_argv` array. The two new command
names are `create-json` and `replay-json`; there is no general `--json` flag.
Their positional arguments are exactly the legacy commands' arguments.

The following paths are deliberately invalid placeholders. Replace them with
fresh absolute output paths under a directory you own; neither recipe nor LLVM
output may already exist.

```bash
"$recipe_tool" create-json "$source_rel" "$current_source_sha" \
  reverse-ready or-before-xor exact exact-revision \
  /ABSOLUTE_NEW_OUTPUT/exact.recipe.json \
  /ABSOLUTE_NEW_OUTPUT/exact.ll -- "${rustc_argv[@]}" \
  > /ABSOLUTE_NEW_OUTPUT/create.stdout \
  2> /ABSOLUTE_NEW_OUTPUT/create.stderr
```

Preserve the real exit status as well as both raw streams. A completed report is
one LF-terminated line with prefix `FE2O3_SOURCE_LOCAL_ORDER_REPORT_V1 ` and
schema `fe2o3-source-local-order-report-v1`. Other compiler stdout can surround
it. Missing, duplicate, truncated or conflicting records are failures, not
permission to choose the most convenient line. Keep strict UTF-8 and the original
newline; don't repair the stream before inspecting it.

For this accepted command, require exit zero, `result.status = "accepted"`,
`publication.status = "completed"`, and both callback counts equal to one.
Check the actual relation `or_before_xor`, exact constraint honored, and the
source-binding mode `exact_revision`. Preserve all five instance axes and the
complete original/input/output digest-and-length pairs (the original N, checked
prefix I and actual current L); a digest alone is not the complete identity.

Reread and hash the published recipe and LLVM. Compare the retained bytes with
the report's `recipe_returned` and `llvm_returned` byte counts and SHA-256
arrays. Source bytes must match accepted `evidence.source_sha256`, not merely
the caller's `request.expected_current_source_sha256` predicate. The command's
report itself does not perform this independent later reread.

Exercise: change only the final byte of a *separate copy* of the LLVM output.
Your external byte comparison must fail even though the original stdout still
looks successful. Do not modify the retained accepted output or rewrite its
receipt.

## 3. Replay, edit and explain the refusal

Measure the original recipe's SHA-256 and Replay it to a new LLVM path:

```bash
"$recipe_tool" replay-json "$source_rel" "$current_source_sha" \
  /ABSOLUTE_RETAINED_OUTPUT/exact.recipe.json "$recipe_sha" \
  /ABSOLUTE_NEW_OUTPUT/replay.ll -- "${rustc_argv[@]}" \
  > /ABSOLUTE_NEW_OUTPUT/replay.stdout \
  2> /ABSOLUTE_NEW_OUTPUT/replay.stderr
```

Replay leaves the original recipe untouched; `recipe_returned` is null.
Compare its recipe identity, all five instance axes and full N/I/L identities
with the appropriate original observation. Do not treat a saved result as a new
source compilation.

Now create a *different* recipe using `rebind-current`. Retain the original
source and recipe. Rename formal `a` and its use to `renamed_a`, and add a
comment. Measure the changed source, preserve the new source separately and use
its complete current invocation. Replay each saved mode against that same edit.

| Saved mode | Expected ordinary command | Required explanation |
| --- | --- | --- |
| `rebind-current` | Accepted, exit 0. | Fresh source hash and initializer coordinates; same five instance axes and same saved recipe bytes. |
| `exact-revision` | Refused, exit 1. | `result.failure.phase = "recipe_binding"`, diagnostic `local-order recipe source revision changed`, `compiler_fatal = false`. |

For the typed refusal, `publication.status` is `not_attempted`; success
evidence and returned recipe/LLVM descriptions are null. No new LLVM output is
accepted. This is not a timeout, missing-report error or arbitrary compilation
failure. Updating the command's current-source hash does not relax the saved
exact-revision predicate. Never retry by silently switching its mode.

A compatible rename can preserve semantic graph hashes. The exercise therefore
requires fresh source and coordinate observations, not an invented requirement
that every N/I/L hash change. Renaming the function itself changes item identity:
create a new recipe explicitly instead of expecting either mode to accept it.

## 4. Distinguish a preference from a hard constraint

Repeat Create with fresh paths, `source-order or-before-xor advisory`.
The actual XOR-before-OR result is accepted but the constraint is
`not_honored`; it is not secretly transformed into OR-before-XOR.
Repeat with `exact`: require exit 1, typed `constraint` refusal and diagnostic
`local-order recipe exact canonical constraint not honored`.

The completed nine-process campaign covered legacy Create/Replay, JSON exact
Create/Replay, JSON rebind Create and edited Replay, edited exact refusal,
advisory mismatch and exact mismatch. It did not add simulation counts: the
separate original-source ladder supplied its own 28 driver attempts and 450
whole-kernel CPU simulations. Keep those two evidence classes separate.

## 5. Follow the changed-source series without inventing an oracle

The two closed workloads are `checked_rebind` and
`exact_revision_refusal`. For each, the source producer requires this chain:

1. Run the original, non-measured ordinary **Create test driver** on the original
   source, with that workload's actual binding mode. Retain the exact
   `FE2O3_RECIPE_NORMAL_V1` JSON payload **plus LF**, and the exact returned
   recipe byte array. This is not the ordinary example's JSON report.
2. Run the outcome adapter in `ordinary` mode on the real renamed source.
   Retain its exact `FE2O3_RECIPE_OUTCOME_V1` payload **plus LF** as the
   independent ordinary oracle. Join source, origin, recipe, initializer and
   all five instance axes. A checked rebind is accepted; the designated exact
   refusal uses original phase `RecipeBinding`, the exact diagnostic above
   and no compiler fatal.
3. Run `series` with that same actual invocation, recipe and origin. Change
   only the top-level mode and the pinned ordinary-oracle field. The nested
   invocation stays `ordinary` with replay intent.
4. Feed both pairs of unmodified raw streams to the existing compiler parser:

```sh
node scripts/recipe-outcome-series-v1.mjs \
  /ACTUAL_ORDINARY.stdout /ACTUAL_ORDINARY.stderr \
  /ACTUAL_SERIES.stdout /ACTUAL_SERIES.stderr
```

These paths are inputs from a bounded compiler qualification campaign, not files
to synthesize for this reading exercise. The existing adapter contract and
full config grammar live in the compiler's `docs/recipe-outcome-series-v1.md`;
the report grammar lives in `docs/authoring/source-local-order-report-v1.md`.
No second codec, private callback or made-up minimal rustc argv is needed here.

The exact test selector is
`production_rustc_driver_v1::source_local_order_recipe_driver_v1::warm_series::outcome_series::actual_source_local_order_recipe_outcome_series_v1`.
Discover it in the actual qualified backend test ELF before any run; selector
text alone is not discovery evidence. Unlike the ordinary example's exit-1
typed refusal, the test child exits zero when the designated refusal was
correctly observed. A passing harness terminal must still be joined to the
typed outcome; exit zero alone is not enough.

Each complete series contains 35 ordered calls: first 5 calibration, then
30 measured calls. All calls use fresh transactions within one active frontend.
Sort only the 30 retained durations and recompute nearest ranks 15, 29 and 30.
Never drop outliers, mix the two workloads, include calibration or substitute
the earlier positive-Replay percentile. The timer covers transaction creation
through the original recipe return, not process startup, source admission,
oracle comparison or the entire CLI invocation.

Exercise: in a separate copy of actual raw evidence, remove sample 6, change
the failure phase, or splice an ordinary oracle from the other workload.
The existing parser must reject each copy. This checks parser consistency,
not execution authenticity. Preserve the untouched raw evidence for comparison.

## 6. Debug the boundary, not just the number

| Observation | Next check |
| --- | --- |
| No complete report or nonzero exit without typed report | Argument, file custody, publication, compiler or stream failure; preserve raw diagnostics instead of inventing a phase. |
| Report accepted but output hash differs | Retained-file substitution or later change; do not call the file current. |
| Changed-source rebind has different instance axes | Wrong item/profile; retain refusal and create a new recipe only when explicitly intended. |
| Series has fewer than 35 samples or more than one terminal | Incomplete/conflicting evidence; no percentile qualification. |
| Process killed at a deadline | Process-control result, not a compiler cancellation result. |

Publication remains **non-transactional**. An earlier recipe may remain after
LLVM publication fails; both outputs may remain after stdout fails. Record what
was created; do not assume rollback or delete files that you do not own.
`publication.output_file_currentness_authenticated`,
`execution_authenticated_by_report`, proof/artifact/launch authority are false.
Timing and complete-owner memory in the ordinary report remain null, not zero.
The series parser likewise has `execution_authenticated = false`,
`budget_accepted = false` and `retained_logical_bytes = null`.

A 60-second between-call check is not in-flight compiler cancellation.
The named retained-owner target is still not qualified by a recipe's size,
a returned LLVM buffer, RSS, a process timeout or a percentile. This tutorial
does not complete U4, native/GPU execution, general edited-Rust support or a
performance SLO. Its acceptance exercise is the exact source/recipe/result join
and honest diagnosis of the designated failures.

## 7. Read the historical outcome checkpoint without promoting it

The original ordinary nine-case campaign used base
`d6653c608210d84f8bde4d7c781492d01357d818` plus the report/outcome changes,
source census `2fc6f59808a2de903a9272aa58090e8050d22dc0eaeca2f3431d77837efd1653`.
Its normal receipt SHA-256 was
`112036274cac35af53fcadfb9919918057c21a97215851074b272accefda830e`.
That observation is only for that older candidate.

On 2026-10-08 UTC, that candidate completed a separate bounded campaign with
**six child processes: two Create, two ordinary outcomes and two series**. The series performed **70 original consuming API
calls in total**, with 5 calibration and 30 measured calls per workload.
All 35 outcomes in each series exactly matched its own ordinary oracle.
The selected 238-input byte identities and whole source census matched before
and after. This is functional and timing evidence for the exact candidate,
not current-main requalification.

The normal receipt is 411,665 bytes, SHA-256
`ef4471d8a0f43b01ece6904acad4b063f04c430ae3f77d9b7038f95cf454d075`.
Its campaign result is 163,068 bytes, SHA-256
`743506c50331616c2448f9e7c7ec5371c695476f6c40a4ef3bd61e517dbda0ec`.
Both bind base `d6653c608210d84f8bde4d7c781492d01357d818` plus the ten
report/outcome leaves and source census
`2fc6f59808a2de903a9272aa58090e8050d22dc0eaeca2f3431d77837efd1653`.
These digests identify retained evidence; the lesson does not treat a digest
or its JSON text as a new execution.

The following integer nanosecond values were recomputed from each retained
series stderr's 30 measured samples, using ranks 15, 29 and 30:

| Older-candidate workload | p50 (ns) | p95 (ns) | Maximum (ns) |
| --- | ---: | ---: | ---: |
| `checked_rebind` | 166372867 | 166581289 | 167012793 |
| `exact_revision_refusal` | 15397677 | 15504636 | 15516243 |

The corresponding raw series stderr SHA-256 values are
`f4acf224389c1843ab1a3504510c69fd256911fc859c55d4ce7ffeecc7c01429`
and `616c7e8e06f21cd604418e28357356dabca073ff9d3a6eb8296a3ee3147670e2`,
respectively. Recompute rather than copying the table into another run.

These are different outcomes with different work: a faster designated refusal
is not a speedup for successful rebind. Neither row measures cold load,
frontend admission, complete command latency, owner memory or cancellation.
The frontend is reused; an admitted compiler owner is not reused between the
fresh transactions. The timer scope remains the one in section 5, and
`budget_accepted = false` remains unchanged.

The newer-main checkpoint below has separate build, loader, source,
ordinary-oracle and series receipts. Do not relabel this checkpoint with the
newer compiler revision or merge its samples with a later campaign. These
compiler measurements do not measure the tutorial's browser or content tests.

## 8. Compare the newer-main checkpoint without mixing runs

A second, independent CPU campaign on `mi350-2` tested base
`73dacccba6eebdd74e6b9b0ed92e76e338c58d51` plus the same ten report/outcome
source leaves. Its complete before/after source census was 15,375 files /
221,500,471 bytes, SHA-256
`0e94deab4c89f7ae3b8296f0c7da5e6e1bc5f6b617fabf1cfa5e823746a3e843`.
This identifies the tested candidate, not an arbitrary later checkout.

The ordinary campaign again completed all nine cases: seven accepted commands
and two designated typed refusals. Its normal receipt is 442,922 bytes,
SHA-256 `84eccde2ee6dceea35bbc977e54e6ed5e4595da46f8943f93bdc2cb351ff75d6`;
its result is 265,828 bytes,
`b98d8167712940e6b6d3682d1f0cb58d7f7a71e6d5a5b962c1886b43702aa6f5`.
The initial configuration attempt was retained as a failure before this fresh
R2 passed; its installed startup list needed the original exact sorted order,
not a relaxed validator.

The changed-source campaign separately completed two Create calls, two ordinary
oracles and two series: 70 fresh consuming calls, 5 calibration and 30 measured
calls per workload. All 35 outcomes per workload matched its own ordinary
oracle. Its normal receipt is 427,327 bytes,
`9a63d4e394db83ad84a357dadb282fd6a29b0df0e9e74990a94caf233663d1cc`;
its result is 169,477 bytes,
`0bd18808137c32c0446ee1b8a2c195804ff168f789a467ff95924ddb29965391`.

| Newer-main-candidate workload | p50 (ns) | p95 (ns) | Maximum (ns) |
| --- | ---: | ---: | ---: |
| `checked_rebind` | 168237386 | 168552778 | 168646367 |
| `exact_revision_refusal` | 15954744 | 16136026 | 16151498 |

The raw series stderr hashes are
`5c84115acd592f677d79933e885e618dc0d44ac411a6781a259abd485ac0448e`
and `a395004a4f23f119dd89f0e838907ddcc4a9d8656079681f8a4188c9025b30f8`.
Each table was recomputed from its own thirty retained samples. Neither the
difference between runs nor the faster refusal is an optimization result or
accepted latency target. Source admission and cold startup remain outside
the measured interval; complete-owner memory and cancellation remain unmeasured.

Use the exact source/recipe/oracle chain above to diagnose your own result.
A successful checkpoint does not authorize a different source edit, prove
whole-backend correctness, or complete U4. Keep all failed attempts and the
separate historical measurements instead of selecting the most favorable row.
