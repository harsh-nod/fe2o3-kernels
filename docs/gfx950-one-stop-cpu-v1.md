# Inspect the gfx950 one-stop target without running it

This contributor lesson follows the [empty-queue lifecycle](gfx950-empty-queue-lifecycle-v1.md)
with a separate, packet-capable ownership path. **CPU/static qualification only:
the one-stop target was NOT RUN.** No GPU stop, physical sample or launch
permission follows from this lesson.

Compiler implementation commit: `a9b636ec4475a15e13187d78d53692d7e6b834e4`.
Read the pinned [compiler qualification note](https://github.com/harsh-nod/fe2o3/blob/a9b636ec4475a15e13187d78d53692d7e6b834e4/docs/gfx950-debug-one-stop-cpu-qualification-20260924.md)
for the exact source snapshots and completed root receipts. The earlier native
empty-queue run had zero publications and zero dispatches; its acceptance does
not transfer to this target or a new debugger executable.

## 1. Follow ownership, not a JSON state machine

The implemented path consumes the original cold owner into a privately boxed
fixed preparation, the same prepared packet, one in-flight owner and local
completion. It cannot be reconstructed from JSON, caller addresses, Booleans
or an empty-queue owner.

The fixed artifact is checked against its whole bytes, descriptor, ABI, segments
and 84-byte instruction sequence. A ninth allocation is intended to hold a
272-byte logical output: eight leading canary bytes, 64 u32 XOR lane results and
eight trailing canary bytes. Those are an implemented contract and oracle,
**not observed GPU output**.

The publication path is one-shot: release-publish the packet, then perform one
doorbell store. The original 60-second deadline includes the checkpoint,
debugger pauses, completion, ordered retirement and final descriptor close.
CPU tests exercise these rules; they do not show that these native operations
ran. Failure retains unresolved native custody and possible-publication facts.
Drop is not native cleanup, and cleanup is not rollback.

## 2. Identify the checkpoint's limits

The same preparation owns a 776-byte checkpoint at
`fe2o3_gfx950_one_stop_prepublication_checkpoint_v1`. Its bytes describe
the retained resources; **checkpoint bytes are not runtime authority**.
The signal base and its atomic value at base+8 remain distinct.

Before any publication effect, unsafe callers must independently establish
actual same-client pre-runtime attachment, LoadedSuccess and sole ACK,
reviewed trap/CWSR/TTMP setup, sampler exclusion, exact source/PC/resource joins
and consumed native pre-resume gates. A successful CPU test, parsed report or
breakpoint symbol does not establish those prerequisites.

This lesson supplies **no native replay command**. The future target must not
be invoked until the separately reviewed debugger, lifetime and owned-family
qualification is complete. There is no environment or JSON switch that turns
historical evidence into permission.

## 3. Read what actually passed

| Completed gate | Observed scope | Root receipt SHA-256 |
| --- | --- | --- |
| Combined CPU/static R3 | 2,057 test executions across 18 Rust result groups, selected strict Clippy and unsafe-source inventory; configurations overlap | `5b40adfaf8c6b68c7e6da997d7ac3b536c339e8ab39e36dc0d56d81624b20a54` |
| Private observer CPU R1 | 21 Rust controls, 12 Node controls, strict Clippy, CPU build and readelf checks | `7261b67fece74456763f360a16b88e12a9486d5fad0938ec56054536cbab6531` |

Both the actual first-main entry symbol and the real target-owned checkpoint
were present in the observer ELF, without dummy or dead-code substitutes.
The 4,162,064-byte PIE has SHA-256
`1ec72e9d53df21a510089951a6bba9a0167d8b7e2323e3dcd1d1ec5add3f3bdb`.
Symbol offsets are ELF observations, not runtime addresses or a ready debugger
profile. **The executable, debugger and scope were not invoked by that gate.**

The observer's build snapshot predates two unrelated Rust test-only lint fixes;
the combined gate retains its separate later snapshot. The implementation pin
does not retroactively relabel either historical build.

## 4. Keep the next exit separate

The same-client native producer still needs integration and fresh qualification:
real breakpoint retirement, bounded API queries, resume gates, actual identity
joins, loader/currentness checks and owned-family cleanup. A source-placement
or owner-state CPU test is not an actual DEBUG_TRAP observation.

No physical register or memory sample, visualization recording, new live route
or importer is provided here. For usable logical CPU recordings, see the
[separate LDS recorded debugger](physical-lds-recorded-debug-v22.md); those are
not gfx950 hardware samples. **V4 remains open** and accepted exits remain
**M1/V1/V2/U1/U2/U3 (6/18)**. No global `FE2O3_PIN`, maturity level or support
claim changes.

The [source-owned tiled inspection checkpoint](tiled-region-inspection-checkpoint-v1.md)
separates the newer source-role, static transport and disabled debugger-package
results from still-unqualified tiled and live-GPU workflows.

## 5. Separate startup inputs from captured debugger state

The newer [startup input-closure qualification](https://github.com/harsh-nod/fe2o3/blob/a2663d4116357c94078a42ecd20fd0ddfe5028b5/docs/debugger-startup-input-closure-qualification-20260928.md)
has passed on mi350. It does **not** establish debugger startup, a loaded-file
closure, physical lane/register values, or a visualization recording.

Its fresh generation passed 28 graph and 88 selector/reader controls, rebuilt
three helpers, and passed 55 supervisor tests, 16 process-census tests, 277
JavaScript tests and 16 Python tests. Five benign supervision cases exercised
normal completion, timeout, double-fork descendants, stdout held by a descendant,
and failed execution. Root checked all 60 request/ownership/release/cleanup
records; all five owned cgroups were absent afterward.

The complete input check read and revalidated 1,024 named files with all 879
duties retained. Three exact symlink rules fix the prior refusal without
allowing arbitrary aliases. Selected payloads totaled 1,798,580,929 bytes;
the separate outer ledger charged 1,801,031,093 inclusive bytes and 29,285
calls. This does not change the inner 512 MiB artifact bound or measure total
process RSS.

For a review exercise, distinguish these three questions:

1. Did every selected input match its complete pinned content and identity?
2. Which files did the actual debugger load during a separately qualified start?
3. Which stopped-wave registers and memory did the same-client adapter actually
   capture, and how are those samples tied to the source and program counter?

Only the first question is established by this checkpoint. A file list or
successful CPU test cannot populate a physical register heatmap. Similarly,
a manager reporting cleanup is not proof that child processes were reaped;
the supervision records check those facts separately.

Complete-selection receipt:
`c1a155f7ba8afc3138e323f3c96231efabdd519ceeb76f0f0fd58ec0885c2ec6`.
No GDB, attach, inferior, dispatch or physical sampler ran in these gates.
The associated coordination expires at 2026-09-28 21:30 UTC; these historical
receipts do not extend it. This lesson adds no native replay command.
V4 remains open, and accepted exits remain M1/V1/V2/U1/U2/U3 (6/18).

## 6. Inspect an actual supervised debugger startup

The separate [supervised startup checkpoint](https://github.com/harsh-nod/fe2o3/blob/a8bbcf6165c41c71368ded8cadb7f071b16537ab/docs/debugger-supervised-startup-qualification-20260928.md)
did run the custom GDB through its fixed MI2 startup and exit. It did not attach
to an inferior, launch a kernel, dispatch GPU work or sample physical state.
Earlier input-only statements above remain the boundaries of their own gates.

The first native attempt started and exited GDB, but failed its outer
post-process census at the unchanged inspected-byte limit. Its failure remains
preserved and is not accepted startup evidence. A fresh coordinated SSH-quiet
retry passed without widening limits or stopping unrelated processes.
Process churn is a possible explanation for the first refusal, not an
attributed or proven cause.

The accepted retry joined the actual owner, release, child reaping, stream EOF
and cgroup cleanup records. It observed 193 named file entries: 170 present
files totaling 398,626,885 bytes and 23 absent paths. Complete present-file bytes
and identity were revalidated. It saw 104 initial Python modules and 50 mapped
ELF paths, with 123 newly observed files relative to the static candidates and
37 static candidates not observed.

For an inspection exercise, distinguish a module's source path, its cache path
and a mapped ELF object. Preserve aliases and absent entries in the review.
A cache filename does not prove execution of that cache, and a startup
snapshot is not complete import history. A static candidate that was not
observed must not silently disappear from its independent input duties.

Accepted startup receipt:
`f5bafcaf01ad08faadf40985059a20773de65447ffbae57369d160f9801f82e7`.
Failed first-attempt receipt:
`ee1b7a38bd83cee5d0fa7eed55d31556eb9903c91c2adced5f5109538c85205d`.

Loaded-file profile review and separately qualified same-client physical capture
remain open. Startup success does not populate register heatmaps, LDS bank
views or a visualization recording. Runtime acceptance and physical capture
remain false. This historical run does not extend its finite coordination
window; this lesson supplies no native replay command. V4 remains open and
accepted exits remain M1/V1/V2/U1/U2/U3 (6/18).

## 7. Review loaded-file records without replaying startup

The inert loaded-file review component first passed 173 CPU controls against
the complete retained records of section 6. Its portable review APIs and
selection planner are now [published in the compiler repository](https://github.com/harsh-nod/fe2o3/tree/ce1ec08a9420c2e923fac7ed42960a4cd8586192/tools/debugger/loaded-profile).
The pinned [publication qualification note](https://github.com/harsh-nod/fe2o3/blob/ce1ec08a9420c2e923fac7ed42960a4cd8586192/docs/portable-loaded-debugger-review-qualification-20260929.md)
records 32 fixture-free API/admission controls and the preserved 173 profile
and 77 planner historical controls. This remains a historical, read-only review
profile, not a live debugger adapter or permission to repeat the native startup.

From the fe2o3 repository root, run the fixture-free API/admission checks:

~~~sh
node --test tools/debugger/loaded-profile/portable-api.test.mjs
~~~

Those 32 controls require no historical archive and do not claim historical
startup semantic coverage. To run the preserved historical suites, supply an
explicit manifest for all 76 complete source-pinned fixture files:

~~~sh
FE2O3_LOADED_REVIEW_FIXTURES=/absolute/path/fixtures.json \
  node --test tools/debugger/loaded-profile/historical-profile-controls.mjs \
  tools/debugger/loaded-profile/historical-selection-controls.mjs
~~~

The [pinned fixture contract](https://github.com/harsh-nod/fe2o3/blob/ce1ec08a9420c2e923fac7ed42960a4cd8586192/tools/debugger/loaded-profile/README.md)
defines the exact ordered roles, immutable content pins and bounded fixture reader.
Missing fixtures fail; there is no silent skip or fallback to historical host
paths, and no raw host archive is bundled in the repository. The 76 fixture
contents are hash-checked; the supplied manifest is bounded, parsed and
identity-checked rather than source-hash-checked by the fixture reader.
Both commands are CPU-only controls, not a startup replay or physical capture.
Earlier stage limits and the expired native coordination remain unchanged.

For a kernel author, the useful question is: "Which recorded source, cache and
mapped-library paths were associated with this debugger startup?" Answering it
helps separate an artifact-selection problem from a kernel-state question.
It cannot tell you the value of a VGPR, which lane diverged, whether an LDS bank
conflict occurred, or what a stopped wave would do next.

The pure entry consumes 72 complete, individually pinned retained records,
including both successful gate observations and the preserved failed-attempt
readback. It also checks the complete original 1,024 before/after selected
identities; it does not replace the 879 historical duties. No operational file
is opened by the pure checker. A successful review says the supplied historical
bytes and their joins were accepted, not that the files are still unchanged now.

This API sketch describes an owned-buffer review, not an installed CLI or a
filesystem reader:

~~~javascript
const profile = reviewLoadedStartup(retainedInputBuffers);

// Each named role keeps its full observation and all module/map references.
const cacheAbsences = profile.rows.filter(row => !row.observation.exists);
const namedAliases = profile.named_aliases;

console.assert(cacheAbsences.length === 23);
console.assert(namedAliases.length === 1);
console.assert(profile.physical_files_reread === false);
console.assert(profile.limitations.runtime_acceptance === false);
console.assert(profile.limitations.physical_capture === false);
~~~

The accepted historical profile retains 193 named file roles: 170 present,
23 absent, and 398,626,885 present-file bytes. It preserves 104 initial Python
modules, 50 mapped ELF paths, all initial/collection/final map references,
123 newly observed present files relative to static candidates, and 37 static
candidates not observed. Those 37 candidates retain their independent duties;
absence from this particular startup is not permission to delete them.

For a review exercise, pick a module with a source path and a cached path.
Follow each named path back to its module references, then distinguish any
mapped ELF references. An absent cache path remains an absence observation,
not a zero-byte readable file. A present cache path does not prove that its
bytecode executed. A module snapshot does not establish complete import
history. Likewise, retain the named sitecustomize alias and its recorded target
identity; do not silently collapse it into a different selected input.

The checker refuses incomplete rosters, changed complete pins, inconsistent
pre/post records, unrecognized alias identities, broken module/map/cache
lineage and attempts to promote startup evidence to runtime acceptance.
A pin refusal alone does not identify which deeper semantic check would also
fail. The negative controls establish refusal, not exhaustive branch coverage.

Pure-review qualification receipt:

~~~text
7269304a46332efe72bdc176aad4feccceb8c1035dd5bd19fc7c2720beb8ea22
~~~

The failed first startup remains failed; the accepted retry does not erase it.
Reviewing retained bytes does not extend the expired startup coordination or
perform a fresh native action. Integrating observed files into a future input
selection must preserve every old duty and count all added readable, absent,
alias, source and reader roles under a separately reviewed finite gate. This
lesson changes no input limit and provides no native replay command.

Complete import history, cache-execution provenance, runtime acceptance and
physical capture remain false. There is no physical register heatmap, LDS bank
view or new visualization recording. V4 remains open and accepted exits remain
M1/V1/V2/U1/U2/U3 (6/18).
