# Lab: a first-write watchpoint without an invented snapshot

This reference lab presents an unchanged seven-pair excerpt of a
source-produced **CPU debugger** recording. It is not a live debugger,
capture-admission API, portable capture exporter or GPU observation.

Open `#/debugger/source-isa-agent`, then **Open recorded watchpoint**.
Download the two fixture files from this same website revision:

- [Watchpoint requests JSONL](../tests/fixtures/recorded-watchpoint-requests.jsonl):
  1,862 bytes, SHA-256
  `f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c`.
- [Watchpoint responses JSONL](../tests/fixtures/recorded-watchpoint-responses.jsonl):
  14,117 bytes, SHA-256
  `4529a8186678df97fb6df4d0f306da8b93a0223d71d54600863f26a1b4dfce3f`.

Use GitHub's raw-file download or the unchanged files from a site checkout,
not the HTML page. Preserve UTF-8, LF endings and final LF. The original
request IDs **1, 2, 4, 5, 6, 7, 12** intentionally retain gaps; the importer
does not invent missing pairs or renumber the originals.

## 1. Predict what an exact stop tells you

The recorded watchpoint requests the first four bytes of logical allocation
`alloc#1:g0`, access `write`, timing `after_commit`. Before importing,
ask: does an exact watchpoint stop also guarantee a captured memory snapshot?

Choose the two files at **Watchpoint requests JSONL** and **Watchpoint responses
JSONL**, then **Import watchpoint observation**. The default selection is
**Uncaptured watch stop**. It reports an exact active watchpoint stop, but
snapshot availability is **unavailable / not_captured**.

| Selected moment | Event / revision | What the recording actually supplies |
| --- | --- | --- |
| Earlier step and inventory, requests 1 and 2 | 1 / 1 | Captured initial anchor and allocation inventory |
| Registration and listing, requests 4 and 5 | 1 / 2 | Accepted specification and actual watchpoint ID 1 |
| Watchpoint stop, request 6 | 32 / 3 | Exact stop after 31 events; no captured snapshot |
| Separate later step, request 7 | 33 / 4 | A different captured checkpoint with its own anchor |
| Memory read, request 12 | 33 / 4 | 24 bytes joined to that later checkpoint |

At the uncaptured stop, source origin, KIR site, scope/lane, frame/occurrence,
logical values and memory/initialization remain unavailable. Neither the
earlier anchor nor the later anchor fills these holes.

Select **Show selected moment's original pairs**. Only request 6 and its
original response are available here. This is evidence browsing, not a
command to replay in another debugger session.

## 2. Inspect registration separately

Select **Registration and earlier inventory**. Check the client label
`source-first-write`, enabled state, logical allocation, offset 0, length 4,
`write / after_commit`, and the earlier inventory's 24-byte capacity.

The inventory establishes only what that earlier recorded response says.
It is not a physical address, allocation-lifetime proof, or the bytes at
the watchpoint stop. The selected raw-pair list now exposes the initial step,
inventory, registration and listing, not the later memory response.

## 3. Explicitly select the later bytes

Select **Separate later checkpoint and memory**. Only now is a captured-memory
view mounted. It belongs to **event 33, revision 4**, not event 32, revision 3.

The unchanged retained memory is:

```text
d5 01 00 00  a5 a5 a5 a5  a5 a5 a5 a5  a5 a5 a5 a5
de ad be ef  ca fe ba be
```

The initialization mask is `0xffffff`: all 24 returned bytes are marked
initialized in this recorded response. Bytes 4–15 retain their `a5` sentinel;
the final eight bytes retain the canary. Interpreting the first four bytes
as a **little-endian u32** gives `0x000001d5`, or **469**. This is an explicit
interpretation of this later window, not a value observed at the uncaptured
stop and not proof about every write in the execution.

The memory view supports its existing bounded byte/dword inspection.
Choose **Dword (4 bytes)**, offset 0, **u32**, and **Assume little-endian** to
inspect that interpretation. Raw storage and unknown byte order remain the
initial choices; the viewer does not infer a source type.

This later checkpoint has its own recorded source association and logical
values. The raw-pair selector contains only requests 7 and 12. The
`compiler_bundle_bound` label is an input claim, not source authentication.

Return to **Uncaptured watch stop**: the later memory, its source association
and its raw lines disappear. Selecting the later moment again starts a new
memory view; unsaved interpretation and focus choices are not a bookmark.

## 4. Exercise refusal and stale-result boundaries

Work on copies if you want to try negative examples:

- Change only the memory response's event or revision to the stop's: import
  must refuse; it must not attach those bytes to an uncaptured stop.
- Change the registered/listed/stop watchpoint IDs inconsistently: import must
  refuse, not choose a nearby matching entry.
- Duplicate a JSON property, remove a final LF, add an eighth pair or change
  one configuration identity: the bounded subset refuses the file.
- Replace either selected file after a successful import: the old observation
  clears immediately. It remains absent if the replacement fails.
- Use **Cancel watchpoint import** while reading, or **Reset watchpoint
  observation**: a late completion must not restore an earlier observation.

Bounds are 256 KiB per file, 64 KiB per line and exactly seven paired lines.
Other command sequences and whole-session transcripts are deliberately
unsupported. A consistent alteration to all matching fields or to recorded
bytes is **not authentication**: such caller-supplied data can still pass
presentation checks. The UI labels this limitation rather than pretending
that file hashes prove the producer or source.

No imported request is executed. Selecting a moment, reading raw lines,
resetting and cancelling perform no upload, debugger action, source edit,
compilation, GPU work or browser-storage write.

## Where the observation came from

The [fixture provenance record](../tests/fixtures/recorded-watchpoint-provenance.json)
pins the exact excerpt and original full-transcript byte hashes. The
source-backed producer is published in compiler commit
[`ecdbf612265e81395531184063c2bb33b3f6062b`][compiler].
The actual retained run tested the same script postimages on parent
`c60cd746e63b34b9072a493744d73b87ed1defc3` with the three script changes
uncommitted; it was not a clean build of the later commit. Its source census
and retained receipt are identified separately in the provenance record.

The [ordinary Rust fixture][source] is exported and admitted through the
existing compiler/debugger path. The [source smoke script][source-smoke]
produces its admitted bundle and simulation request; the
[resource smoke script][resource-smoke] records the actual paired responses
and checks the distinct watchpoint and memory events. The
[watchpoint checker and controls][checker] check those retained joins.
No synthetic success capture is substituted.

For contributors who already have a correctly configured pinned compiler
checkout, its binaries and loader/toolchain prerequisites, these are the
producer entry points; each output argument must name a **new, absent**
directory:

```sh
node --test scripts/resource-query-v6-watchpoint.test.mjs
node scripts/assembly-authoring-v30-smoke.mjs NEW_SOURCE_OUTPUT_DIRECTORY
node scripts/resource-query-v6-smoke.mjs NEW_SOURCE_OUTPUT_DIRECTORY NEW_RESOURCE_OUTPUT_DIRECTORY
```

The second command supplies the source output consumed by the third. The
third writes full `debug-requests.jsonl` and `debug-responses.jsonl`; those
whole sessions are not this viewer's seven-pair input. The committed excerpt
retains the original lines with the seven IDs listed above. This is not a
complete fresh-machine installation recipe, nor a reason to reuse these IDs,
handles or expected revisions in a new live session.

For the separate authoring/build tutorial, see the
section below on saving a recorded moment, then the
[guarded assembly-body lab](guarded-assembly-body-lab-v1.md). For explicit
comparison of captured windows, see the
[retained-memory comparison lab](recorded-memory-comparison-lab-v1.md).
These views do not establish hardware timing, physical-register contents,
allocation lifetime, complete compiler/protected/target qualification or
completion of the broader debugger milestones.

## Save and reopen an exact recorded moment

After importing the two fixture files, use **Download moment bookmark**.
The downloaded JSON is a viewer-only selection, not a capture, a debugger
request, or an executable recipe. Keep the original request and response
files separately; the bookmark does not contain their recording bytes.

1. Save the uncaptured stop, then select the later checkpoint and save it too.
2. Change the memory cell size and open a different original pair.
3. Select the later bookmark under **Watchpoint moment bookmark JSON** and
   choose **Reopen moment bookmark**. The same checkpoint is selected, but
   unsaved cell, interpretation, raw-pair and viewport choices reset.
4. Reopen the stop bookmark. All six unavailable fields stay unavailable;
   no memory or source from the later checkpoint appears as stop state.
5. Save/reopen registration separately. Its earlier captured anchor remains
   earlier inventory, never a snapshot of the watchpoint stop.
6. Change a recording digest in a copy of the bookmark and reopen it.
   The viewer refuses it without applying the saved selection. Oversized,
   malformed and unsupported bookmarks also refuse. Cancelled or superseded
   reads must not install a late selection.

Bookmarks are at most 16 KiB and bind both exact file digests and byte counts,
the local recording context and the selected moment's retained identities.
The separate moment format does not extend the captured-resource bookmark
format. Reopening rechecks against the recording already imported here.
Only explicit download writes a local file; there is no upload, browser
storage, live query, source edit, compilation or GPU action. Matching hashes
remain byte-consistency observations, not producer or source authentication.

[compiler]: https://github.com/harsh-nod/fe2o3/commit/ecdbf612265e81395531184063c2bb33b3f6062b
[source]: https://github.com/harsh-nod/fe2o3/blob/ecdbf612265e81395531184063c2bb33b3f6062b/crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs
[source-smoke]: https://github.com/harsh-nod/fe2o3/blob/ecdbf612265e81395531184063c2bb33b3f6062b/scripts/assembly-authoring-v30-smoke.mjs
[resource-smoke]: https://github.com/harsh-nod/fe2o3/blob/ecdbf612265e81395531184063c2bb33b3f6062b/scripts/resource-query-v6-smoke.mjs
[checker]: https://github.com/harsh-nod/fe2o3/blob/ecdbf612265e81395531184063c2bb33b3f6062b/scripts/resource-query-v6-watchpoint.test.mjs
