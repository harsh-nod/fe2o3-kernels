# Watchpoints and source replay: keep every checkpoint honest

A recorded watch stop can be exact without containing source variables or memory.
This walkthrough uses a real assembly-authoring kernel and keeps the unavailable stop,
a later memory checkpoint and source-queryable checkpoints visibly distinct.

Start with [source-variable inspection](resource-source-values-v2.md); see
[ordinary helper frames](resource-helper-source-values-v2.md) for a separate two-frame
profile. This tutorial is the root-frame cross-invocation profile, not helper activation
tracking.

## The authored kernel

The capture uses the existing compiler fixture
`crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs`,
function `assembly_chain`. Its instruction sequence is:

```rust
let moved = amdgpu_asm!(v_mov_b32(a));
let moved_again = amdgpu_asm!(v_mov_b32(moved));
let sum = amdgpu_asm!(v_add_u32(moved_again, b));
let difference = amdgpu_asm!(v_sub_u32(sum, b));
let toggled = amdgpu_asm!(v_xor_b32(difference, b));
let low = amdgpu_asm!(v_and_b32(toggled, 255));
let result = amdgpu_asm!(v_or_b32(low, 256));
```

This excerpt is the base feature branch, not a complete standalone kernel. The
original fixture uses a typed kernel, a disjoint output slice, `thread::index_1d()`
and a checked mutable element before storing `result`. It is normally exported by
the existing compiler pipeline; no hand-built KIR is substituted for this capture.

The recorded CPU request has four logical work-items, workgroup [64,1,1], parameter
bits `a=0xfffffff0`, `b=0x00000025`, and a 24-byte output buffer: four prefilled
u32 words plus an eight-byte canary. The independent full simulation observed four
469 results and an unchanged canary. This is CPU simulation, not a GPU run.

## Open the original recording

Use the local **Recorded watchpoint and source replay** panel on
`#/debugger/source-isa-agent`, opened by **Open recorded watch/source replay**.
Select the seven original files from
[examples/watch-source-replay-v2](../examples/watch-source-replay-v2/README.md):

| Picker | Original file |
| --- | --- |
| Capture receipt JSON | `receipt.json` |
| Full session requests / responses JSONL | `debug-requests.jsonl`, `debug-responses.jsonl` |
| Seven-pair watchpoint requests / responses JSONL | `watchpoint.requests.jsonl`, `watchpoint.responses.jsonl` |
| Cross-invocation source requests / responses JSONL | `resource-watch-source-values.requests.jsonl`, `resource-watch-source-values.responses.jsonl` |

Click **Import watch/source recording**. No file is uploaded, no receipt path is fetched,
no debugger request runs and no import is persisted. The panel verifies byte hashes,
the exact full-session sequence and original excerpt lines. The old seven-pair importer
is unchanged and can still open its own two-file excerpt independently.

## Read the five moments

1. **Uncaptured watch stop.** Request 5 stopped at event 32 / revision 3.
   Source query 6 returned `unavailable / checkpoint_not_captured`. Source, SSA,
   memory, frame, location and logical lane are unavailable here. The panel does not
   guess lane 0 from nearby observations.
2. **Immediate post-write checkpoint.** One forward operation step reached lane 0,
   event 33 / revision 4. It has 18 SSA rows and its own memory, but the captured stack
   has no `next_operation`. Source query 9 also returned `checkpoint_not_captured`.
   The absence of a source table is intentional; SSA values are not renamed locals.
3. **Later source checkpoint.** A further forward count 1 reached lane 1, event 34 /
   revision 5, before that logical invocation's first operation. Its three SSA rows,
   stack and six source pages belong to this new checkpoint. Global memory still
   contains only the earlier lane-0 write.
4. **Reverse pre-write checkpoint.** Reverse count 2 reached lane 0, event 31 /
   revision 6, before its store. There are 18 SSA rows; the first output word is restored
   to its prefill. This explicitly crosses the immediate post-write checkpoint.
5. **Repeated later source checkpoint.** Forward count 2 returned to lane 1, event 34 /
   revision 7. Source rows, SSA rows and memory repeat the earlier lane-1 observation;
   the state revision is new.

Radio selection only changes the displayed recording. It does not move a live debugger.
Use keyboard radio navigation and native details summaries to inspect original paired
lines. Their LF and original request IDs are retained; do not replay those session-local
identifiers in another run.

## What the source table means

Each successful checkpoint returns 12 named bindings in six complete pages. Parameters
`a` and `b` are captured u32 values with generation 1. All ten other bindings have
generation 0 and `not_represented`, including intermediates and `result`.
That is not zero, an uninitialized scalar, a missing page or a recovered local value.

The separate SSA table can contain more values and allocation-relative pointers.
Source-variable identities, lexical scope identities, SSA ordinals and equal bits
are not interchangeable. There is no guessed source-to-SSA link. Source queries refine
the selected checkpoint with explicit frame 1 and legacy occurrence 1; that anchor is
not identical to the unframed memory/SSA checkpoint. Frame 1 means static stack depth,
not the same dynamic invocation across lane 0 and lane 1.

The memory view is global allocation storage at the selected checkpoint. Its first
word is `d5 01 00 00` after the write (469 in little-endian u32), reverts to `a5`
prefill on reverse, and returns on repeat. Other words and the canary remain unchanged
at these intermediate points. This is not physical VGPR/EXEC state or a wave timing model.

## Errors and incorrect behavior this slice can reveal

The fresh capture includes five genuine refusals: two unavailable source queries,
a selector-incompatible cursor, a stale revision and a cursor from an older checkpoint.
They leave the debugger session unchanged. The importer additionally rejects altered
bytes, mixed sessions/stops, incomplete pages, wrong frame/scope/count, changed repeat
state and invented authority fields; it clears old values on replacement or failure.

The fixed qualification checks expected scalar inputs, first-write memory,
reverse/repeat restoration, final output words and the canary. A mismatch can reveal
a wrong result, incorrect store, failure to restore retained memory or stale inspection.
It is not a general race detector, proof of memory safety, full local reconstruction,
allocation reuse tracking, general reverse execution or hardware-equivalence proof.

## Capture your own fresh instance of this bounded profile

Use the current normal export/assembly-authoring smoke to create a fresh successful
`assembly-authoring-v30` baseline and its original receipt, bundle and request. Use
matching freshly built `fe2o3-author`, `fe2o3-kir-sim` and `fe2o3-debug` tools from
the same compiler checkout and pinned offline/locked build environment. Preserve the
full source/toolchain/dependency closure and process/resource supervision separately.

With literal canonical paths assigned to these task-specific variables:

```sh
node scripts/resource-watch-source-values-v2-smoke.mjs \
  "$FE2O3_CHECKOUT" "$FE2O3_BASELINE_OUTPUT" "$FE2O3_NEW_CAPTURE_OUTPUT"
```

The third path must be new, outside input trees; the driver will not overwrite an
existing recording. `CARGO_TARGET_DIR`, when used, must select those matching fresh
tools. The driver independently runs the full CPU result check, exercises the public
debugger queries, pins inputs, preserves original lines and refuses a changed profile.
Do not repair raw transcripts, invent a successful source response or use an old
receipt as evidence for a new build. Keep failures for diagnosis.

This fixed profile uses at most 128 full pairs, 64 KiB per line, 32 source pages and
64 source/SSA rows per checkpoint. Its retained total is capped at 8 MiB; the local
panel accepts the receipt at 1 MiB, full responses at 4 MiB and each other stream at
256 KiB. These are profile/import bounds, not general backend capture limits.

## Exact qualification recorded here

The actual capture passed on mi350 on 2026-09-22:
41 full pairs, seven old watchpoint pairs, 27 source pairs and five refusals.
The [recording provenance](../examples/watch-source-replay-v2/provenance.json) pins
all seven original files, original paths, compiler base plus dirty source census,
baseline receipt and the passed outer capture receipt. Its original capture receipt
SHA-256 is `d6d58a1d6acf73921e7b475d8e24fef8eea6ce55a90c0982d30243156fbdb6a1`.

The complete actual-data site suite passed 985 Vitest tests and 21 Node controls,
lint, TypeScript, build and evidence checks. The final browser run passed all 152
desktop/mobile cases with zero skipped, unexpected, flaky or retried cases.
Desktop light/dark source screenshots were inspected; mobile layout was checked
by browser assertions. See the [exact validation record](const-watch-native-qualification-20260922.md)
for source censuses, receipts and retained failed attempts.
The panel always says caller-supplied/unverified: hashes and
recorded `compiler_bundle_bound` labels do not authenticate source, runtime closure,
producer identity or protected proof admission. This tutorial claims no hardware
execution, performance prediction or completion of all debugger V2 milestones.
