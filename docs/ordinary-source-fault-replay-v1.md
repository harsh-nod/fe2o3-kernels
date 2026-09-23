# Diagnose an explicit uninitialized input and replay the prior checkpoint

The bounded R3 CPU capture passed on independent canonical and mirror compiler
builds on 2026-09-22. This walkthrough describes that finite observation, not a
new published curriculum lesson, browser importer, native/GPU result or proof.
Use the [dated compiler evidence record](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-fault-20260922.md#final-publication-qualification)
for exact source/build versions, original receipts and retained failed attempts,
and the [compiler capture contract](https://github.com/harsh-nod/fe2o3/blob/main/docs/resource-source-fault-replay-v2.md)
for implementation details. The site's curriculum pin and maturity labels are
unchanged; an arbitrary compiler checkout is not qualified by these results.

The exercise changes one bit in the CPU simulator's explicit input
initialization model. Rust source and input bytes remain unchanged. It asks:

- Does a standalone simulation diagnose that uninitialized input?
- Can a separate debugger session revisit the actual prior checkpoint while
  keeping the uncaptured terminal stop unavailable?

Existing, separately qualified recordings are described in
[source-variable checkpoints](resource-source-values-v2.md),
[helper frames](resource-helper-source-values-v2.md), and
[watchpoint/source replay](resource-watch-source-replay-v2.md).
Their receipts do not qualify this fault profile.

## Start with ordinary Rust

The fixture is the existing compiler file examples/vecadd/src/lib.rs and its
included vecadd_body.rs. Its actual typed kernel entry is:

~~~rust
#[kernel(typed)]
pub fn vecadd(a: &[f32], b: &[f32], mut c: DisjointSlice<f32>) {
    vecadd_kernel_body!(thread, (), production_f32_add, a, b, c);
}
~~~

This is an excerpt, not a replacement standalone source file. The included
macro obtains the global index, checks a mutable output element, then adds the
corresponding inputs. The production adapter performs f32 addition. The driver
exports these unchanged files normally; it does not author KIR or source maps.

The fresh normal Bundle V6 and ordinary author-inspection roster are
simulation/debug input, not a GPU code object or protected compilation-resume
authorization.

## Predict the positive result

The requests use four logical work-items, grid [4,1,1], workgroup [256,1,1], and
three direct, four-byte-aligned f32 buffers:

| Buffer | Initial content | Access |
| --- | --- | --- |
| A | [1, 2, 4, 8] | Read-only |
| B | [0.5, 1.5, 2.5, 3.5] | Read-only |
| Output | Four 0xa5a5a5a5 words followed by eight canary bytes | Read-write |

The unchanged typed vecadd profile requires 256x1x1. An earlier fresh capture
exported successfully but its 64x1x1 request failed at preflight with
preflight_workgroup_mismatch; no positive or fault replay passed in that run.
The corrected request follows the existing kernel metadata, without changing
source or weakening preflight. The simulator visits all 256 local slots but
runs only the four inside this grid. Both corrected R3 captures passed with
fresh exports. An earlier different-parent output-path attempt also failed its
setup guard before export; the dated evidence retains both failed attempts.

Independently expect [1.5, 3.5, 6.5, 11.5]. These are exactly representable
dyadic f32 values; this finite case needs no numerical tolerance. The canary
must stay de ad be ef ca fe ba be. There are six f32-sized output slots but
only four global invocations.

Initially every byte is marked initialized. For the second request, only A's
explicit initialization mask changes:

~~~json
{"initialized":"0xffff"}
~~~

becomes:

~~~json
{"initialized":"0xfeff"}
~~~

These are field excerpts, not complete requests or recorded responses. The
packed mask has one bit per byte. Clearing bit zero says A's first byte is
uninitialized in the simulator model. Its actual bytes remain
0x0000803f000000400000804000000041. B, output, kernel selection, geometry,
buffer lengths and access modes stay identical.

This exercises an explicit model. It does not read uninitialized host memory
or execute undefined host/GPU behavior.

## Reproduce with matching compiler tools

The driver is fe2o3/scripts/resource-source-fault-replay-v2-smoke.mjs.
Use the reviewed compiler/source and normal toolchain combination in the dated
evidence, including matching imported helper scripts. Fresh output and source
qualification are still required when that combination changes.

Run from the compiler repository on mi350 under the maintainer's bounded
process/resource supervisor. Replace all /ABSOLUTE/... placeholders with
literal canonical paths from that approved build. Both output paths must be
new, distinct siblings outside every source/tool input tree.

~~~sh
node scripts/resource-source-fault-replay-v2-smoke.mjs \
  --repo /ABSOLUTE/APPROVED/COMPILER \
  --bin-dir /ABSOLUTE/FRESH/NORMAL/TOOLS/debug \
  --cargo /ABSOLUTE/PINNED/TOOLCHAIN/bin/cargo \
  --rustc /ABSOLUTE/PINNED/TOOLCHAIN/bin/rustc \
  --export-target /ABSOLUTE/TASK/RUNS/vecadd-export-target-r1 \
  --output /ABSOLUTE/TASK/RUNS/vecadd-fault-observation-r1
~~~

The driver performs a fresh ordinary export itself. Do not populate either
directory first. Its exporter stage is:

~~~sh
fe2o3-export-sim --crate fe2o3_vecadd \
  --output /ABSOLUTE/TASK/RUNS/vecadd-fault-observation-r1/vecadd-v6.fe2sim \
  --bundle-version 6 --target gfx942 \
  --target-dir /ABSOLUTE/TASK/RUNS/vecadd-export-target-r1 \
  -- --manifest-path /ABSOLUTE/APPROVED/COMPILER/examples/vecadd/Cargo.toml \
  --lib --offline
~~~

The second block explains the stage, not a command to repeat into an existing
output directory. The exporter already enforces Cargo --locked. The driver
also sets offline mode, explicit pinned Cargo/rustc, two jobs and no incremental
compilation. The maintainer retains normal build receipts, the complete source
census and compiler/dependency closure; selected driver hashes do not attest
that whole closure.

An export refusal or incompatible operation/source profile remains a failure.
Do not switch to synthetic KIR, transplant an older bundle, rewrite source
maps or repair raw responses to make the exercise pass.

## Read the standalone diagnostic separately

First, the driver runs the standalone simulator with the positive request.
It requires four correct words, the full unchanged canary and inputs,
matching canonical KIR identity, complete bounded schedule coverage and no
observed conflicts. This is a finite CPU observation, not proof for all inputs
or schedules.

It then runs the same simulator with the explicit-uninitialized request.
Acceptance requires exit code 1, empty stdout and a structured stderr document:

| Field | Required meaning |
| --- | --- |
| schema | fe2o3-simulation-error-v1 |
| status / stage | error / execution |
| kind | execution_uninitialized_read |
| invocation | The actual failing logical invocation |
| site | The actual function and raw KIR site from that execution |
| message | Original diagnostic text, not a source for invented typed fields |

No example function, block, operation, event or allocation ID is invented.
The current error has no typed allocation-relative fault range for this kind.
Do not parse its prose into a fabricated allocation/range record.

## What the fresh captures actually recorded

Each fork completed five normal command stages and 44 debugger request/response
pairs. The standalone positive result checked all four output words, all eight
canary bytes and unchanged inputs; 21 pure control groups were tested separately.
The expected explicit-uninitialized diagnostic is not successful kernel
execution: its exit code is 1, while the complete acceptance harness passes.

At each of the two prior-load visits, the recorded stack contained one frame.
Separate queries supplied 13 SSA rows, three memory windows totaling 56 bytes,
and six source rows in three pages. Only a and b were captured allocation-relative pointer
bindings; c, idx, i and out were not_represented. These source rows remain
separate from SSA and are not a general variable-to-allocation map.

The mirror's raw bytes, configuration identity, source-row order and standalone
raw block ID differ from the canonical run. Both pass their own exact joins;
do not merge them or treat event numbers as reusable protocol selectors.

## Follow the separate JSONL session

The driver starts the public debugger with that same pinned bundle and
explicit-uninitialized request:

~~~text
fe2o3-debug sim --bundle-v6 <same-bundle> --request <same-request> --wave-width 32
~~~

This is a separate CPU execution/session, not the standalone simulator's
event stream. Wave width describes logical visualization, not physical GPU
waves. The driver retains original JSONL and discovers actual selectors from
returned records, rather than copying old IDs into another run.

The retained canonical sequence was:

| Moment / navigation | Event / revision | Captured state |
| --- | --- | --- |
| Forward one operation | 1 / 1 | Initial checkpoint and complete allocation inventory |
| Continue | 22 / 2 | Fault/Failed, no captured values |
| Reverse one operation | 21 / 3 | Prior load, stack, SSA, source rows and three memory windows |
| Forward one operation | 22 / 4 | Fault/Failed, still unavailable |
| Reverse one operation | 21 / 5 | Same earlier state with a fresh revision/anchor |
| Query with old revision | 21 / 5 unchanged | stale_revision; no session change |
| Forward one operation | 22 / 6 | Fault/Failed, unavailable |
| Continue, then terminate | 22 / 7, then 8 | Completed/Failed, then clean termination |

Completed/Failed is not successful kernel completion. Continuing at this
terminal advanced zero events but changed the visible stop and revision.

The complete ordinary inspection roster supplies canonical operation ordinals.
The reversed checkpoint must join one actual load, with the captured stack's
next_operation identifying that before-load operation. A raw block ID in the
standalone error is not a canonical debugger block ordinal.

At the prior checkpoint, all queried SSA rows must match its control snapshot.
The driver queries all three observed allocations, not assumed argument IDs,
and matches each window by complete bytes, mask, capacity and access mode.
No output store should yet be visible. This fixed model comparison is not a
general variable/argument-to-allocation map.

## An exact fault stop is not a snapshot

At every terminal fault and the final Completed/Failed end, the driver queries
stack, SSA, source variables and an earlier-observed allocation window.
It requires explicit unavailability, never a nearby checkpoint's values.

Stack, SSA and memory return not_captured without changing session state.
Source V2 may return checkpoint_not_captured, source_map_v2_required or
variables_not_captured: source metadata is checked before the current captured
checkpoint. None of these refusals supplies source values. The actual R3
terminal source responses were checkpoint_not_captured in both captures.

The simulator diagnoses this load before emitting a successful read event.
This profile supplies neither a failed-read event nor a new structured debugger
fault descriptor. Prior bytes are not “memory at the fault.” Do not infer a
terminal source frame, lane or location from adjacent records, and do not invent
a terminal allocation range.

## Reverse state, not revision history

Reverse navigation selects an earlier retained operation checkpoint. It does
not roll the protocol revision backwards. Revisiting the same event produces
a new revision and a new original cursor/anchor.

Compare event, configuration, scope, source/KIR site, stack and queried values
while preserving each response's own revision. Use the latest revision for the
next request. The deliberately stale query must fail without changing any
current session field.

Source-variable pages stay separate from SSA. An explicit frame-one,
occurrence-one source anchor refines the unframed checkpoint; it is not
literally the same anchor. Frame one means static stack depth, not a dynamic
activation or allocation lifetime. A not_represented row is not zero. If source
variables cannot be queried, keep the refusal; do not rename SSA rows as locals
or infer links from matching names/bits.

## Inspect retained evidence, not an invented browser import

A successful capture retains:

- vecadd-v6.fe2sim, the ordinary fresh bundle;
- positive-request.json and uninitialized-request.json;
- inspection.stdout and complete operations-*.stdout roster pages;
- positive.stdout and original uninitialized.stderr;
- debug-requests.jsonl, debug-responses.jsonl and debug-stderr.txt;
- observations.json and the completed receipt.json.

Stage streams remain on failure. A failure.json marks an unsuccessful run
and warns that raw streams may be partial. Preserve the failed observation
directory and its separate Cargo target. Use fresh names for a rerun.

This capture adds no site import control, site fixture, browser validation,
upload, live connection or GPU result. Existing resource/helper/watchpoint
importers accept their own bounded profiles. Do not feed this whole fault
session to them or weaken their validation. No Phase22 UI/browser rerun is
claimed for these Markdown-only additions.

## Optional browser exercise for the historical R3 recording

The sections above describe the Phase22 producer/Markdown-only increment.
This later additive exercise applies only to a site checkout/deployment that
contains the new optional fault/source panel. The separate
[viewer qualification](evidence/fault-source-viewer-20260923.md) records its
browser and import checks; it does not establish a public deployment or relabel
historical R3 evidence as a W4 or current-build capture.

Use the [historical canonical four-file example](../examples/source-fault-replay-v2/README.md)
and its exact hashes. Its producer evidence is the dated compiler record's
[ordinary-source fault and prior checkpoint section](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-fault-20260922.md#ordinary-source-fault-and-prior-checkpoint).
Download original raw files, not rendered/pretty-printed copies:

- [receipt.json](../examples/source-fault-replay-v2/receipt.json)
- [debug-requests.jsonl](../examples/source-fault-replay-v2/debug-requests.jsonl)
- [debug-responses.jsonl](../examples/source-fault-replay-v2/debug-responses.jsonl)
- [uninitialized.stderr](../examples/source-fault-replay-v2/uninitialized.stderr)

Preserve their exact bytes and LF endings. Do not combine the canonical and
mirror runs. Open the Source/ISA agent page at
#/debugger/source-isa-agent, then **Open recorded fault/source replay**. If that
control is absent, this optional viewer is not in the selected build; the
existing resource/helper/watchpoint importers must not be broadened to accept
this full terminal session.

Select the four files in **Fault capture receipt JSON**,
**Fault session requests JSONL**, **Fault session responses JSONL**, and
**Standalone uninitialized diagnostic**. Press **Import fault/source recording**.
This is local file inspection only: no upload, network fetch, persistence,
compiler invocation, debugger action or GPU execution.

1. Keep **Terminal fault — values unavailable** selected first. In this
   historical recording it is event 22 / revision 2, Fault / Failed.
   Source, SSA, stack and memory remain unavailable. No prior values, source
   location, lane or typed fault range should appear at the terminal.
2. Select **Prior captured checkpoint**, event 21 / revision 3. Inspect the
   separate source-variable table (six rows: a/b captured pointer bindings,
   four not_represented) and SSA table (13 rows). Source spans/bindings are
   retained; a Rust source body is not among these four files and is not fetched.
   Equal names or scalar bits do not create a source-to-SSA mapping.
3. Use **Memory window at selected checkpoint** for the three original
   16/16/24-byte windows. On retained memory request 15, choose **Byte** in
   **Memory cell size** to see the first uninitialized byte. Stored bytes are
   not valid program values when their initialization bit is clear.
   These windows belong to the earlier checkpoint, never the terminal fault.
4. An SSA pointer's **Show retained byte for SSA ...** button selects an
   already-retained byte at the same checkpoint. It does not dereference,
   issue another query, infer a variable/argument mapping or identify the
   failed range.
5. Select **Repeated prior checkpoint**, still event 21 but revision 5.
   The exact source/SSA/stack/memory contents agree; the original cursors and
   revision remain distinct records. The old-revision SSA query is
   stale_revision with state_changed=false and no values. With current memory
   request 30, choose request 15 in **Baseline retained memory window**:
   the complete matching 16-byte windows have zero storage and initialization
   differences. This compares retained facts, not allocation lifetime or
   execution causality.
6. Select **Final failed completion — values unavailable**. Event 22 /
   revision 7 is Completed / Failed, not successful completion. Prior tables,
   memory cells, pointer selection and comparison clear. Return to
   **Terminal fault — values unavailable** to inspect the original fault stop
   with no earlier values substituted.
7. Inspect **Selected moment original pairs** and the separate
   **Original standalone diagnostic** if desired, then press
   **Reset fault/source files**. All imported files and values clear.
   File replacement and cancellation also discard old display state.

The example's numeric request/event IDs are historical observations, not live
selectors. This is a closed 44-pair R3 profile; it reuses exactly 18 original
successful resource pairs without weakening the existing importer. All terminal
refusals and the stale query remain separately checked.

This four-file join validates selected bytes and bounded structure, not the
complete capture run or source authentication. Bundle, source body, request
inputs, positive result, tools, compiler closure and other stage artifacts
are not imported or independently checked here. The standalone typed
execution_uninitialized_read error belongs to a separate execution; neither
its prose nor raw block ordinal supplies a canonical typed debugger fault
range. Frame one is static depth, source-binding generations are not resource
generations, and recorded allocation generation zero establishes no reuse.
No terminal snapshot, dynamic activation, native result, proof or performance
claim is added; broad V2 remains open.

## Bounds and fresh-reproduction requirements

The driver bounds the capture to five minutes, at most 128 public pairs,
64 KiB per JSONL line, 256 KiB requests, 8 MiB responses and 64 KiB debugger
stderr. Source queries have at most 32 pages and 64 rows; selected SSA has at
most 64 rows. Three memory windows total 56 bytes. Existing producer-internal
capture limits are unchanged.

Observation files, including bundle and streams, have a cooperative 64 MiB
allowance. Fresh Cargo scratch is separate and not included. The outer
supervisor must reserve/monitor it, retain failures, enforce descendant/deadline
bounds and preserve the 40 GiB free-disk and 64 GiB available-RAM floors.
This is not a filesystem quota or an increase to the task's whole-root budget.

For every fresh reproduction, retain and review:

1. The exact compiler base/source census, normal toolchain/build receipts,
   driver/test hashes and unchanged source/dependency custody.
2. Passing pure controls and a fresh ordinary export, positive result,
   explicit-uninitialized standalone diagnostic and complete debugger replay.
3. Actual command counts, load/source/SSA/allocation observations and source
   availability, original raw-file hashes and the outer passed receipt.
4. Failed attempts and explicit limits: no terminal snapshot, allocation reuse,
   dynamic activation, hardware behavior, source authentication, protected
   compilation admission or performance claim.

Allocation lifecycle/reuse and owner-produced terminal snapshots remain
separate work. This tutorial alone does not close broader debugger milestones.
