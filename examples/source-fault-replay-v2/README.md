# Historical ordinary-source fault/source replay files

These four original files belong to the **canonical historical R3 CPU capture**
of 2026-09-22, retained as logs/phase22w2-fault-source-actual-r3. They are not
a W4 capture, a new-current-build result, a synthetic positive recording, or
a GPU/native execution. The normal producer exported unchanged ordinary Rust
examples/vecadd to Bundle V6, exercised an explicit input-initialization bit,
and retained a separate public debugger session.

See the published compiler evidence's
[ordinary-source fault and prior checkpoint section](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-fault-20260922.md#ordinary-source-fault-and-prior-checkpoint)
and the [source and reproduction walkthrough](../../docs/ordinary-source-fault-replay-v1.md).
That dated record supplies the historical producer qualification and its limits;
these four selected files do not reproduce or authenticate its full build/run.

## Original files

Open each relative file link and use Raw/Download to save its original bytes.
Do not copy rendered JSON, pretty-print it, change LF line endings, or mix files
from another capture. The receipt and both JSONL streams must remain paired.

| Local file / browser input | Bytes | SHA-256 |
| --- | ---: | --- |
| [receipt.json](receipt.json) — Fault capture receipt JSON | 19683 | c60587e9d5d47d689efecb020133b4d670da2f620780e37644fd9738c6af9488 |
| [debug-requests.jsonl](debug-requests.jsonl) — Fault session requests JSONL | 10184 | 0f9ad2fdd8b084504a022ce859e308d9e6579be03ad12b1eecf01f78a0668e1e |
| [debug-responses.jsonl](debug-responses.jsonl) — Fault session responses JSONL | 69406 | 9c569caee68dd88d42aa12f36c5ea8a011cf5a4d034d8d6640addc423cdd5c22 |
| [uninitialized.stderr](uninitialized.stderr) — Standalone uninitialized diagnostic | 504 | 91c3b2ba7237afca178616723db569e901b5eecee342dca86c1e19d81d71684f |

The historical outer supervisor receipt is
logs/phase22w2-fault-source-r3/receipt.json, 34027 bytes, SHA-256
0e85f6c1b30f3f1940a2b617459aa5db7ce2d096b89dca81af757ef7bdb3eb03.
It is a separate retained qualification artifact, not a fifth browser input.
The example retains those exact original bytes. The separate
[viewer qualification](../../docs/evidence/fault-source-viewer-20260923.md)
records browser and import checks; it does not authenticate the full producer
run or establish that a particular public deployment contains the viewer.

## Browser exercise

Use a checkout/deployment that actually contains the optional
Recorded fault and prior-checkpoint replay panel. The route is the
[Source/ISA agent page](https://harsh-nod.github.io/fe2o3-kernels/#/debugger/source-isa-agent),
or #/debugger/source-isa-agent on your local site. If the new control is absent,
the UI addition is not present in that build; do not feed this full session to
an older resource/helper/watchpoint importer.

1. Open **Open recorded fault/source replay**. Download the four original files
   above and select each in its corresponding labeled input. Press
   **Import fault/source recording**. Nothing is uploaded, fetched, persisted,
   compiled or executed. File size, strict UTF-8 and exact retained-file joins
   are checked locally.
2. The default **Terminal fault — values unavailable** selection shows the
   historical Fault / Failed event 22, revision 2. Stack, SSA and memory are
   not_captured; source variables are checkpoint_not_captured. There must be no
   substituted prior table, memory cells, source location, lane or fault range.
3. Select **Prior captured checkpoint**: event 21, revision 3. The source panel
   has six rows: captured pointer bindings a/b and four not_represented rows.
   The separate SSA panel has 13 rows. No source-name-to-SSA association is
   inferred, and no Rust source body is included or fetched.
4. **Memory window at selected checkpoint** selects three original windows:
   requests 15/16/17, capacities 16/16/24 bytes. For request 15, set
   **Memory cell size** to **Byte**. Its first byte is uninitialized even though
   raw storage is retained. Other windows retain the second input and unwritten
   output/canary storage. These are earlier checkpoint bytes, not terminal
   fault memory or a typed failed-access range.
5. A **Show retained byte for SSA ...** pointer button selects only a byte in
   an already-retained window at that same checkpoint. It is not a dereference,
   new query, fault attribution, argument-name lookup or physical address.
6. Select **Repeated prior checkpoint**: the same event 21 at revision 5.
   Source, SSA, stack and all three memory windows agree with the first visit.
   The original stale-revision SSA request is shown as a refusal with no state
   change or values. For memory request 30, select request 15 in
   **Baseline retained memory window**. The complete matching 16-byte windows
   show zero storage-byte and zero initialization differences; their revisions
   remain distinct.
7. Select **Final failed completion — values unavailable**. Event 22 is now
   revision 7, Completed / Failed: zero advanced events, not successful kernel
   completion. Prior tables, cells, pointer focus and comparison must disappear.
   Return to **Terminal fault — values unavailable** to inspect the original
   fault stop without resurrecting earlier values.
8. **Selected moment original pairs** exposes original request/response lines,
   including their LF. **Original standalone diagnostic** belongs to a
   separate execution. Finish with **Reset fault/source files**; all selected
   files and displayed values clear.

The numeric IDs/events above describe only this pinned historical recording.
They are not commands or selectors to reuse in a new live session. The adapter
is a closed 44-pair R3 profile, not a generic JSON-RPC debugger importer; its
resource panels receive exactly 18 unchanged original successful pairs.

## What is and is not checked

The four-file join establishes selected-file consistency and bounded structure.
The receipt is caller-supplied. Source files/body, bundle/KIR, request inputs,
positive simulator output, tools, compiler/dependency closure, scratch and other
stage outputs are not imported or independently verified by this panel. Hashes
do not authenticate a producer or confer execution, resume, proof or admission
authority. The original historical positive result is documented separately.

The standalone stderr has typed kind execution_uninitialized_read. It is a
different execution from the JSONL debugger. Its prose is not converted into
an allocation range, and its raw block ordinal is not equated with canonical
debugger block numbering. The debugger's terminal supplies generic Fault /
Failed and explicit unavailability, not a structured typed terminal range.

Source spans and bindings stay separate from SSA; not_represented is not zero.
Frame 1 means static stack depth, not dynamic activation. Source-binding value
generations are distinct from resource allocation generation zero. No allocation
lifetime/reuse, terminal snapshot, failed-read event, writer causality, physical
register, native/GPU result or performance prediction is supplied.

Import role limits are 64 KiB receipt, 256 KiB requests, 256 KiB responses and
4 KiB standalone diagnostic, total at most 1 MiB; individual JSONL lines are
at most 64 KiB. File replacement, cancellation and reset discard old state.
These browser bounds do not alter the compiler producer's capture limits.
This fixture/viewer slice does not close broad debugger milestone V2.
