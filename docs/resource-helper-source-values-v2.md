# Lab: record source variables inside an ordinary Rust helper

The [source-variable guide](resource-source-values-v2.md) starts with one root
frame. This follow-on uses the existing ordinary `debug_helper` Rust fixture and
public CPU debugger queries to record a complete root/helper stack. The current
helper is frame 2; frame 1 is its suspended caller. The site opens paired local
files, not a live debugger connection.

This is separate from ordered instruction authoring. It does not supply
named-variable maps for the diagnostic ordered-program KIR17 path.

## Recorded qualification: 2026-09-22

The actual CPU capture passed on mi350. The reviewed
[retained example](../examples/helper-source-variable-resource-v2/README.md),
[original receipt](../examples/helper-source-variable-resource-v2/receipt.json)
and [byte provenance](../examples/helper-source-variable-resource-v2/provenance.json)
identify the exact observation. Site validation passed 909 unit tests and 21
Node controls; all 142 desktop/mobile browser tests passed with no skips,
flakes or retries. See the [qualification record](helper-instruction-qualification-20260922.md).
These finite checks do not complete all debugger milestones.

The compiler candidate had base commit
`dc48d876cd5434e5d8e409a53177f8d43fe5a839` and a dirty-source census of
6,542 files / 99,469,985 bytes, SHA-256
`6723b922a0e1b0263b85cfd2854bef067e186f7b07ba74132c1817de0c06f5e7`.
The census was unchanged before and after capture. It identifies this retained
candidate, not automatically a later compiler commit. The toolchain was
`nightly-2026-04-03-x86_64-unknown-linux-gnu`; the tools came from
`target-milestones-phase19-r3/debug`. The source fixture SHA-256 was
`1c34832c031f2e84f27f022ccdea6b9cdf7966dfc1bbf186f441a236bc068425`.

The original capture receipt remains at
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr/logs/phase19-helper-source-values-r2/receipt.json`:
12,567 bytes, SHA-256
`aae1d08b4666a7d516afdb94d08edf6421d1de569333a3a9d9b1e7f7786f2350`.
Its outer command receipt at
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr/logs/phase19-helper-source-capture-r2/receipt.json`
is 36,573 bytes, SHA-256
`d1c91e5d426fb48f8d397fc5b63a9d9b5f7a27f6ec6aef7a93c8851a6fb679d7`.
The outer command passed with exit 0, no signal, no abandoned stream drain and
no recorded errors. It ran a matched direct-rustc normal consumer before the
capture script. An earlier failed Cargo-client dylib-collision attempt supplied
none of these capture observations.

The retained successful request excerpt is 3,047 bytes, SHA-256
`e1af7f06a1a5dc2529eb26cbbaae5583fad2795ba0d27f74847f62c3e884e60a`;
the response excerpt is 26,766 bytes, SHA-256
`36ac595290e317f8710b5f3822e5d3a768b29f62834910e4d55bf72c6a3314f9`.
Both preserve original lines and final newlines. Hashes identify bytes, not an
authenticated producer.

## 1. Read the fixture and make a fresh recording

The compiler fixture
`crates/rustc-codegen-fe2o3/tests/fixtures/production-ranked-bounds-device/src/lib.rs`
has this helper under feature `debug_helper`:

~~~rust
#[inline(never)]
fn debug_helper_add_one(value: f32) -> f32 {
    let adjusted = value + 1.0;
    adjusted
}
~~~

Its `debug_helper` kernel calls this helper and writes the result through the
existing checked output-slice branch. Keep the complete fixture, imports,
signature and required/maximum 64x1x1 launch bounds; the excerpt is not an
independent kernel.

From the matching compiler checkout, use the pinned toolchain and current
`fe2o3-rustc-extract`, `fe2o3-export-sim`, `fe2o3-author`, `fe2o3-kir-sim`
and `fe2o3-debug` builds. Set `CARGO_TARGET_DIR` to their actual build target
if it is not the default `target`; the script uses its `debug` directory.
Retain the exporter/backend, extraction binary, Cargo/rustc/sysroot, lockfiles
and loader libraries in the enclosing build/qualification records.

~~~sh
helper_values_storage=/absolute/existing/qualification-storage
helper_values_run=$(mktemp -d -p "$helper_values_storage" fe2o3-helper-values.XXXXXXXX)
node scripts/resource-helper-source-values-v2-smoke.mjs \
  "$(pwd -P)" "$helper_values_run/queries"
~~~

Replace the storage path first. Run from the compiler checkout; the two script
arguments are `REPOSITORY_DIRECTORY` and `NEW_OUTPUT_DIRECTORY`. The child
`queries` directory must be absent. Use external process-tree/resource
supervision; per-command timeouts and selected stream/file caps are not a
whole-build memory/storage bound. Preserve failures rather than overwriting
their directories.

The script exports a fresh Bundle V6 with canonical KIR11 using the ordinary
exporter, target `gfx942` and `debug_helper` feature. It then checks a complete
CPU execution before recording any selected debugger checkpoints. The request
uses grid `[4, 1, 1]`, workgroup `[64, 1, 1]` and fixed f32 input 1. The
independent source-level oracle is f32(1)+f32(1)=f32(2); the script requires four
executed invocations, four output words with bits `0x40000000`, complete
initialization and unchanged eight-byte tail canaries. This is CPU simulation,
not GPU execution.

It then starts `fe2o3-debug sim --bundle-v6` with logical display width 32.
The width labels the visualization; it does not change or demonstrate physical
Wave64 execution. Bounded discovery must find a real queryable two-frame helper
checkpoint. One further operation step must yield an adjacent distinct helper
SSA state without leaving the selected scope/function. If current producer
behavior cannot expose these observations, retain the refusal instead of
synthesizing a `next_operation`, stack frame or variable value. A fresh run must
qualify its own observations; do not force the historical IDs below onto it.

## 2. Inspect the helper without confusing it with its caller

The retained example contains three groups. Each has an actual control response,
a complete stack, two source-variable pages (limit 1, two rows total) and a
same-stop 24-byte memory response: five successful pairs per group.

| Stop | Event / revision | Control ID | Caller / helper / all SSA rows | Helper next operation |
| --- | --- | --- | --- | --- |
| Forward | 3 / 3 | 9 | 2 / 2 / 4 | 1 |
| Reverse | 2 / 4 | 17 | 2 / 1 / 3 | 0 |
| Repeated forward | 3 / 5 | 24 | 2 / 2 / 4 | 1 |

The complete stack is caller frame1/function0 and current helper
frame2/function1. Caller `next_operation: 0` is present in this recording.
All three checkpoint anchors name helper function1/block0/operation0; the event
and revision distinguish the retained states. The stack's next operation and
the checkpoint's recorded operation are different fields.

The source pages contain `adjusted` first, explicitly
`unavailable: not_represented` at generation 0, then parameter `value`,
captured f32 raw bits `0x3f800000` at represented storage generation 1.
Both source rows remain identical at all three stops. Unrepresented does not
mean zero.

Reversing removes one helper SSA row; the suspended caller's two SSA rows remain
identical. Repeated forward restores all four SSA rows, the recorded stack and
source/KIR site, with a new revision. A caller-only SSA difference cannot pass
the capture checks. This recording changes the helper's SSA row set, not the
captured parameter's bits. The local remains unavailable; equal names or bits
do not justify copying SSA values into its source-variable row.

The browser displays floating-point scalars as exact raw bits. The independent
source-level oracle does not license guessing a displayed decimal value,
source-to-SSA correspondence or physical register location.

Keep the two anchors distinct. Stack/control/memory use the unframed checkpoint
anchor. Helper variable pages use the same cursor, logical scope and source/KIR
site, plus explicit `frame: 2` and legacy `occurrence: 1`. This is an explicit
refinement, not anchor equality. The occurrence does not identify a dynamic call
activation, loop iteration, recursion identity or allocation generation.

## 3. Retain complete pages and exact refusals

The helper source query selects `all`, frame 2, dispatch scope and page limit 1.
Retain every continuation through the final response without `next_cursor`.
Names are not stable identity keys; keep variable identities and complete query
metadata. The complete stack must account for every retained SSA row, including
the caller's. Do not export only helper rows as though they were the original
complete checkpoint.

The actual full interaction contains five deliberate refusals, each retaining
the exact preceding stopped session:

| Request ID | Request mismatch | Actual outcome |
| --- | --- | --- |
| 14 | Select frame 3 | `unavailable: frame_unavailable` |
| 15 | Reuse helper page cursor with frame 1 | `error: invalid_cursor` |
| 16 | Change to name selector `value` with the old cursor | `error: invalid_cursor` |
| 22 | Reuse expected revision 3 after reverse to revision 4 | `error: stale_revision` |
| 23 | Reuse the earlier page cursor at the new revision | `error: invalid_cursor` |

The caller is queryable in this recording, so ID 15 reaches cursor validation.
The script also handles a producer that omits the caller's next operation by
requiring its different `checkpoint_not_captured` outcome; that alternative was
not observed here and must not replace the recorded error.

Matching event numbers after repeated forward do not revive an old revision or
cursor. These checks establish debugger query rejection, not compiler
analysis-cache or proof invalidation. Browser malformed-import controls are
separate synthetic negatives, not additional producer observations.

The early memory windows are identical: allocation1/generation0, offset 0,
24 initialized bytes containing four `a5a5a5a5` words and
`deadbeefcafebabe` canaries. They do not attribute a write, demonstrate
allocation reuse or show final-kernel completion. The complete CPU simulation
is separate evidence, not reconstruction of memory at these earlier stops.

## 4. Open only the successful paired excerpt

On success, the script retains:

- `debug-requests.jsonl` and `debug-responses.jsonl`: full original interaction,
  including setup/discovery, deliberate refusals and termination.
- `resource-helper-source-values.requests.jsonl` and
  `resource-helper-source-values.responses.jsonl`: successful checkpoint groups
  selected from original lines without renumbering or rewriting.
- `observations.json`, `independent-result.json` and `receipt.json`: derived
  checks and selected identities, not replacement source provenance.
- `helper-request.json`, `helper-v6.fe2sim`, and stage stdout/stderr: retained
  execution inputs and raw tool results.

This actual full interaction has 29 pairs. The 15-pair browser excerpt selects
IDs 9–13, 17–21 and 24–28, totaling 29,813 bytes across both files. The earlier
discovery/entry group, five refusals and termination remain in the full
transcripts. The excerpt is not a standalone command script.

At `#/debugger/source-isa-agent`, choose **Open local resource recording**,
select the two `resource-helper-source-values` files, then choose **Import local
recording**. Do not import the full transcript containing unsupported setup/error
pairs. Open **Recorded source-variable selection and identity** to inspect
**Complete captured stack**, selected current frame 2, selected-versus-total SSA
counts, both anchor descriptions and the actual next operation. Use **Show
original paired lines** to inspect unchanged requests and responses.

Navigate all three **Imported checkpoint** entries and compare them with the
table above. This browses saved responses; it does not step a debugger or query
a suspended frame. Source variables, whole SSA values and captured memory remain
separate observations. Replacing a file or resetting must clear old tables
immediately. A malformed or partial helper group must refuse rather than retain
a table from a previous import.

These steps passed in the retained desktop/mobile browser run, including
replacement/reset clearing and root-frame compatibility. The six actual-helper
cases ran across both projects; the complete suite passed all 142 tests.

## Limits that remain visible

The importer accepts the existing single root frame or exactly one nonrecursive
current helper with its root caller. Deeper stacks, repeated same-function
frames, arbitrary frame selection and dynamic call-history reconstruction are
outside this profile. The selected current frame needs a real next operation;
the suspended caller may lack one, although it has one in this capture.

Existing import caps remain: 256 KiB per file, 64 KiB per line, 128 pairs,
32 checkpoints, at most 64 complete scalar source rows over 32 pages, and at
most 64 complete SSA rows across both frames together, not 64 per frame.
The capture's fixed page limit 1 also limits its selected source rows to the
32-page bound. A partial page chain is not a reduced view. Storage generation,
allocation generation and source occurrence remain distinct.

Imports are always caller-supplied/unverified. A `compiler_bundle_bound` label
and file SHA-256 identify retained claims/bytes, not authenticated source or
build ancestry. CPU replay, source visibility and cursor rejection do not grant
hardware, load/launch, proof, or compiler-resume authority. No physical register
lifetime or performance claim follows. Keep partial failure artifacts; never
substitute synthetic fixture data for an actual capture.
