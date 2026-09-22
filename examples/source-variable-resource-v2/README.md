# Recorded source variables, SSA and memory

These are actual paired CPU-debugger responses captured on mi350 on 2026-09-22,
not generated presentation fixtures. They belong to the retained compiler
candidate state identified by the base commit and exact dirty-source census in
[provenance.json](provenance.json), not automatically to a later compiler
revision. The preserved [receipt.json](receipt.json) is a historical local
observation, not authentication or production authority.

Import the two `resource-source-values.*.jsonl` files through **Open local
resource recording** at `#/debugger/source-isa-agent`. Follow the
[source-variable walkthrough](../../docs/resource-source-values-v2.md).

All 27 successful request/response pairs retain original bytes, IDs and final
newlines. They are an excerpt of a larger retained interaction, not a standalone
command script. Setup, four deliberate refusals and termination remain in the
remote full transcripts identified by provenance; the browser does not execute
any request. SHA-256 identifies bytes, not their producer.

| Stop | Event / revision | Source pages / rows | Whole SSA values |
| --- | --- | --- | --- |
| Forward | 3 / 2 | 6 / 12 | 4 |
| Reverse | 1 / 3 | 6 / 12 | 3 |
| Repeated forward | 3 / 4 | 6 / 12 | 4 |

At each stop, `a` and `b` are captured u32 parameters (generation 1); the other
ten variables, including `out` and `result`, are explicitly not represented
(generation 0). They are not zero, and equal SSA bits do not map those source
names to SSA values. The original source-query anchor explicitly selects frame1
and legacy occurrence1; it refines, but is not identical to, the independent
unframed control/stack/memory anchor. It is not a dynamic helper activation.

Each memory window contains the same 24 initialized bytes: four initial
`a5a5a5a5` words and `deadbeefcafebabe` canaries. This early-stop trio does not
attribute a store or demonstrate allocation reuse, register lifetimes, complete
source-local reconstruction, protected compilation, or GPU execution. A separate
source smoke checks final outputs; it cannot supply values at these earlier stops.

The browser displays the import as caller-supplied / unverified even for these
files. Its separate synthetic rejection tests are not additional producer evidence.
