# Recorded helper source variables, caller SSA and memory

These are actual paired CPU-debugger responses captured on mi350 on 2026-09-22
from an ordinary Rust helper exported with the `debug_helper` feature. They are
not generated presentation fixtures. The base commit and exact dirty-source
census in [provenance.json](provenance.json) identify the retained compiler
candidate, not automatically a later compiler revision. The original
[receipt.json](receipt.json) records a local observation; it does not authenticate
the producer or authorize production compilation.

Import `resource-helper-source-values.requests.jsonl` and
`resource-helper-source-values.responses.jsonl` through **Open local resource
recording** at `#/debugger/source-isa-agent`. The
[source-variable walkthrough](../../docs/resource-source-values-v2.md) explains
the panels; unlike its [frame1 example](../source-variable-resource-v2/README.md),
this recording selects current helper frame2 while retaining SSA values from
both the suspended caller and helper.

All 15 successful pairs retain their exact original lines, IDs and final
newlines: request IDs 9–13, 17–21 and 24–28 from the 29-pair full interaction.
Each stop has one control response, one stack response, two complete source
pages (limit 1), and one memory response. The two excerpt files total 29,813
bytes. Setup, five deliberate read-only refusals and termination remain in the
remote transcripts identified by provenance. This excerpt is not a standalone
command script, and importing it does not execute its requests.

| Stop | Event / revision | Selected source frame / function | Caller / helper / all SSA rows | Control ID |
| --- | --- | --- | --- | --- |
| Forward | 3 / 3 | 2 / 1 | 2 / 2 / 4 | 9 |
| Reverse | 2 / 4 | 2 / 1 | 2 / 1 / 3 | 17 |
| Repeated forward | 3 / 5 | 2 / 1 | 2 / 2 / 4 | 24 |

At every stop, the stack contains caller frame1/function0 and current helper
frame2/function1. Reversing removes one helper SSA row while both caller rows
remain identical. Repeating forward restores all four SSA rows exactly.
This is a change in the recorded helper SSA row set, not a change in the
captured parameter's bits.

The selected source pages contain `adjusted`, explicitly unavailable because it
is not represented (generation 0), and parameter `value`, captured as f32 raw
bits `0x3f800000` (generation 1). These source rows remain identical at all three
stops. An unrepresented local is not zero. Matching source and SSA bits do not
establish a source-name-to-SSA mapping.

The source-query anchor retains the checkpoint cursor, logical scope and source
site, with explicit frame2 and legacy occurrence1. It refines, but is not
identical to, the independent unframed control/stack/memory anchor. The legacy
occurrence field does not identify a dynamic helper activation, loop iteration
or repeated call. All three anchors name helper operation0; their event/revision
coordinates distinguish the retained states.

The full interaction observed frame3 unavailable (ID 14), a helper page cursor
reused with frame1 rejected (ID 15), a changed selector with that cursor rejected
(ID 16), a stale expected revision rejected (ID 22), and a prior-stop page cursor
rejected (ID 23). Each refusal retained the exact preceding session state.
These are actual backend observations, separate from the browser's synthetic
malformed-import tests.

Each memory window contains the same 24 initialized bytes in allocation1,
generation0: four initial `a5a5a5a5` words followed by `deadbeefcafebabe` canaries.
No output store or allocation reuse is attributed to these early stops. Before
debug capture, a separate complete CPU simulation checked four f32 outputs with
bits `0x40000000` and unchanged tail canaries against the independent
`f32(1) + f32(1) = f32(2)` expectation. Its retained result and raw simulation
output are pinned by provenance; they do not reconstruct values at earlier stops.

The browser presents these files as caller-supplied / unverified and keeps source
variables separate from SSA observations. SHA-256 identifies bytes, not their
producer. This recording does not demonstrate general local reconstruction,
dynamic helper activation tracking, register lifetimes, GPU execution, protected
compilation or performance. Browser qualification is a separate site-test gate,
not a consequence of the capture receipt.
