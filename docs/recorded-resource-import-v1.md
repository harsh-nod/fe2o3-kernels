# Inspect your recorded resource queries locally

The source/ISA inspector's **Open local resource recording** panel displays
your own bounded CPU debugger request/response excerpts using the existing
allocation, access and memory views. It does not connect to a debugger or execute
any imported command. File bytes stay in page memory; reset or closing the panel
discards its references. No upload, persistent storage, new capture schema,
curriculum release, maturity change or `FE2O3_PIN` update is involved.

All imports are **caller-supplied / unverified**, including files whose embedded
source label says `compiler_bundle_bound`. File digests describe bytes, not who
produced them. Browser consistency checks do not replace Rust admission,
authenticate source or execution, prove native correctness or grant GPU access.

## Try unchanged lines from an actual recording

From this site's checkout, select the original request and response lines below.
The source transcripts are the existing
[actual source-produced resource capture](../examples/resource-query-v6/README.md),
not synthetic JSON. The first operation-step pair independently records event
33, revision 4; queries 7–10 retain their original page-token chain; request 11
reads the 24-byte output allocation. Requests 14–17 retain the reverse checkpoint
at event 31, revision 5; 18 and 21 retain event 33 again at revision 6.

```sh
import_example=$(mktemp -d)
sed -n '6,11p;14,18p;21p' \
  examples/resource-query-v6/debug-requests.jsonl \
  > "$import_example/requests.jsonl"
sed -n '6,11p;14,18p;21p' \
  examples/resource-query-v6/debug-responses.jsonl \
  > "$import_example/responses.jsonl"
```

These line numbers apply only to this checked-in recording. The original line
text, IDs and final LF remain unchanged; no response fields are reserialized.
Do not reuse these line numbers to select a different run without inspecting it.
Keep the full original files separately. The complete example transcript also
contains deliberate stale-query failures, setup and termination; this importer
refuses it instead of silently skipping those records.

1. Open `#/debugger/source-isa-agent` and **Open local resource recording**.
2. Select `requests.jsonl` in **Requests JSONL** and `responses.jsonl` in
   **Responses JSONL**, then **Import local recording**.
3. Check the caller-supplied warning, file byte counts and SHA-256 values.
   **Recorded resource page** initially shows request 7's allocation inventory.
   Select request 9 for the recorded committed write. Request 8 is an actual
   empty scanned page, not evidence that the history is empty.
4. Inspect the first captured bytes `d5 01 00 00` (little-endian 469). The last
   eight bytes are the retained canary `de ad be ef ca fe ba be`. This is imported
   CPU storage, not a new host-oracle check or physical GPU memory observation.
   Selecting an access also marks its byte-range intersection with the selected
   checkpoint memory window. The historical write is not a time-travel command:
   bytes and initialization still belong to event 33, revision 4. Selecting an
   allocation inventory or empty access page clears the access markers.
5. Choose the reverse checkpoint: the first byte returns to `a5`. Choose the
   repeated event: it is event 33 with revision 6, not revision 4. Missing pages
   remain missing; browsing does not replay the debugger.
6. **Show original paired lines** preserves the exact request/response text.
   Tokens shown here are inert; do not use them in another process or session.
7. **Reset local recording** clears data and file selection. Selecting either
   replacement file also clears old data immediately. **Cancel import** stops
   the active file reader; a late hash/parser completion cannot replace a newer
   selection or restore cancelled data.

## Inspect checkpoint SSA values and their recorded source location

**Checkpoint SSA values and source** displays values already retained inside
the selected operation-step response. Its checkpoint is the same one used by
the memory windows; selecting a historical access does not move these values
back to that access. The separate panel checks the exact control response,
session, full anchor and each supported value before displaying any rows.

To include an earlier checkpoint with fewer values, retain these unchanged
lines from the same source-produced recording:

```sh
value_import=$(mktemp -d)
sed -n '1p;3p;6,11p;14,18p;21p' \
  examples/resource-query-v6/debug-requests.jsonl > "$value_import/requests.jsonl"
sed -n '1p;3p;6,11p;14,18p;21p' \
  examples/resource-query-v6/debug-responses.jsonl > "$value_import/responses.jsonl"
```

Request 1 has three retained SSA values. Choose request 6's checkpoint to see
18: function 0 / frame 1 / value `%24` contains u32 `0x000001d5` (469), `%25`
is index64 zero, and `%27` is Boolean `0x1` (true). A pointer is displayed as
an allocation identity plus byte offset, never as a native address. Open
**Recorded source and snapshot identity** to inspect the recorded map/file
identities and byte span `[931, 947)`. No source text or variable names are
inferred from those hashes, and `compiler_bundle_bound` remains an unverified
imported claim.

Select request 14, then request 18. Their event/revision pairs are `(31, 5)`
and `(33, 6)`; the repeated event does not reuse revision 4. These particular
checkpoints retain equal SSA values even though the earlier memory exercise
shows different storage. Missing rows never mean zero, dead values, or absent
execution. A recorded SSA frame number does not establish an authenticated
dynamic helper activation, allocation generation, or physical register mapping.

The inspector supports at most 64 complete scalar SSA rows. Booleans, integers
of 1–64 bits and index32/index64 keep exact hexadecimal bits and use lossless
integer interpretation; f16/f32/f64 show raw bits only. Allocation-relative
pointers retain exact unsigned 64-bit identities/offsets, with generation zero
only. Redacted and unavailable values retain their distinct recorded reasons.
Other roots, subpaths, aggregates, wider integers, non-simulator provenance and
larger tables are locally unsupported, not silently truncated. Malformed
value payloads refuse this panel without changing the original importer’s
acceptance, file hashes, raw lines or other valid panels. No previous table is
retained after refusal, checkpoint replacement or reset.

This is a useful recorded V2/V5 slice, not completion of either milestone or
a new debugger service, live replay, watchpoint, producer-authentication or
hardware capability.

## Compare two retained memory checkpoints

Below the currently selected memory window, **Compare retained memory
checkpoints** starts with **No baseline selected**. Choose another retained
window explicitly. The current side remains the checkpoint and memory selection
above; the baseline never follows a historical access, target hypothesis or
nearby event automatically. Changing the current checkpoint/window, replacing
either import file or resetting clears the baseline synchronously.

Use the unchanged global excerpt from the first exercise:

1. At checkpoint request 6, select baseline memory request 15. The current
   memory request 11 is event 33/revision 4; baseline 15 is event 31/revision 5.
   Exactly four storage bytes differ, offsets 0–3: `a5 a5 a5 a5` versus
   `d5 01 00 00`. All 24 bytes are initialized on both sides. The eight canary
   bytes at offsets 16–23 remain unchanged.
2. Select baseline memory request 21. Its event is also 33, but revision 6.
   All 24 recorded bytes and initialization bits match request 11. This shows
   equality of these retained windows, not a new debugger replay or a proof
   about unretained events, other allocations or GPU execution.
3. Use arrow keys, Home and End on the compared cells. The details table keeps
   baseline/current storage and initialization separate. `B` means raw storage
   differs, `I` means initialization differs, `=` means both recorded facts
   match, and `?` means a byte was not captured on both sides. Color is not
   required. Dwords group bytes; they are not decoded scalar program values.

For the unchanged LDS excerpt in the next section, keep current memory request
13 and choose baseline 17. Both request `[0,256)` of recorded allocation `2:g0`
in the same logical scope. Storage differs only at byte 0 (`00` versus `02`),
but initialization differs at bytes 0–3. Bytes 1–3 therefore show an
initialization change despite equal zero storage. The remaining 252 bytes are
uninitialized on both sides; matching storage there is not an initialized
program value or evidence of no access.

Each response must independently match its full retained checkpoint. This
initial comparison requires the same recording/context, configuration,
logical scope and mask, source/site, represented frame/occurrence, allocation,
address space and exact requested offset/length. Only cursor event/revision
may differ. Mismatches are unavailable, not silently aligned by address, source
line or capture order. Generation zero and matching imported identities do not
establish lifetime, allocation reuse or producer authentication.

Inputs retain the existing 4096-byte bound. At most 256 requested bytes appear
per comparison viewport, with explicit paging and partial final cells. Only
bytes returned by both responses contribute comparisons; missing/redacted/
unavailable storage is never replaced with zero. Counts describe the visible
viewport only, and partial/truncated captures never establish complete-window
equality. Original JSONL bytes, hashes, importer acceptance and access/memory
limits are unchanged. No new backend query, download, compiler action or
execution occurs. This advances recorded V2/V5 inspection only; live replay,
watchpoints, real allocation reuse, compiler-variant comparisons and the full
milestone exits remain separate work.

## Model one imported LDS range under an explicit assumption

The importer never infers a target from filenames, source labels or file digests.
**Hypothetical target for LDS model** starts at **Unknown**. You may choose
`gfx942` (32 banks) or `gfx950` (64 banks) for an arithmetic scenario; both use
4-byte words. This is a **user hypothesis / unverified**, not a target observed
by the CPU recording. Original request/response text, hashes and the unknown
imported target remain unchanged. Global/private accesses never become LDS.

Try unchanged lines 11–18 of the site's existing single-workgroup LDS transcript:

```sh
lds_import=$(mktemp -d)
sed -n '11,18p' examples/source_lds_resource_v1.requests.jsonl > "$lds_import/requests.jsonl"
sed -n '11,18p' examples/source_lds_resource_v1.responses.jsonl > "$lds_import/responses.jsonl"
```

Import that pair and select request 14 in **Recorded resource page**. The one
retained write is event 12, allocation `2:g0`, range `[0, 4)`. Its four `W`
markers overlay storage at event 13, revision 5; only those first four bytes are
initialized. Unmarked or uninitialized bytes do not establish missing activity.
Choose a hypothetical target and open **LDS address-pattern model — assumed
layout**. With base residue `0`, this range touches bank 0 with four bytes. With
residue `1`, it touches bank 0 with three bytes and bank 1 with one byte. These
are modeled byte intersections, not physical addresses or measured conflicts.

Selecting request 15 demonstrates an actual empty scanned page with more backend
pages: no previous footprint or marker is retained. The reverse checkpoint
(request 16) has event 11, revision 6, uninitialized storage and no retained
access. Switching checkpoints resets the hypothesis to Unknown; replacing either
file clears all old data immediately, even when the replacement has identical
bytes. Changing the hypothesis resets access selection to that page's visible
default and the modeled base to zero; it sends no debugger command.

The memory overlay requires the same complete checkpoint, context, allocation,
generation and address space. It uses only the selected access page and visible
memory window; it does not search other pages for matching ranges. Different
allocations and off-window ranges remain explicitly unpainted. Wave/scope filters
are logical retained-data filters, not hardware lane or transaction groups.
The model still covers one complete range of at most 256 bytes, at most 65 dwords
and 64 banks. Actual allocation placement/alignment, native instructions,
transaction phases, multicast, bank conflicts and GPU timing remain unavailable;
this does not certify native LDS bounds or target legality. See the
[selected LDS address-pattern model](lds-bank-analysis-v1.md) for its
geometry sources and limitations.

## Record your own supported excerpt

Use already-built compiler tools and the existing real-source workflows described
in [resource memory windows](resource-memory-windows.md). From the compiler
checkout, the current source/query workflow is:

```sh
resource_run=$(mktemp -d)
node scripts/assembly-authoring-v30-smoke.mjs "$resource_run/source"
node scripts/resource-query-v6-smoke.mjs \
  "$resource_run/source" "$resource_run/queries"
```

Both child directories must be new. These are existing compiler scripts, not
commands executed by the web page. The query script starts the public CLI as
`fe2o3-debug sim --bundle-v6 BUNDLE --request REQUEST --wave-width 32`, records
the actual JSONL request/response pairs, and separately checks results and
expected refusals. Follow the linked build/toolchain prerequisites; this guide
does not claim a new compiler qualification or build receipt.

For your own client, retain the original bytes of successful pairs from the same
session in increasing request-ID order, starting each checkpoint group with:

- `fe2o3-debug-request-v1` `step` with `direction` forward or reverse,
  `granularity: "operation"`, and a positive bounded `count`. Its successful
  `fe2o3-debug-response-v1` control result must contain an exact active captured
  logical-lane snapshot, supplied independently of the resource response.
- `fe2o3-debug-resource-request-v1` `query_allocations` or
  `query_memory_accesses`, with the exact `expected_revision`,
  `expected_snapshot` and bounded `page` from that stopped checkpoint.
  Access queries include the existing `filter`. Their response schema is
  `fe2o3-debug-resource-response-v1`. Keep preceding pages when a request uses a
  `token`; token chains are checked against the same query and checkpoint.
- `fe2o3-debug-request-v1` `read_memory`, with the stopped `expected_revision`,
  exact `allocation: { ordinal, generation }`, `byte_offset` and `byte_len`.
  The response schema is `fe2o3-debug-response-v1`. Keep its separate step anchor.

Copy the actual checkpoint and returned token from your current session, never
from this walkthrough. Each request and response occupies the same numbered
line in the two excerpt files. Do not concatenate different sessions, substitute
anchors or rewrite IDs. Multiple retained checkpoints are supported, including
reverse movement, but revisions must increase. Excerpts are not a claim of
complete execution history. No independent cryptographic session authenticity
can be inferred when two files claim the same identities.

## Supported subset and refusals

Each file is at most 256 KiB, each line 64 KiB, with at most 128 paired lines
and 32 checkpoints. Use strict UTF-8, no BOM, LF line endings and a final LF.
Parsing preserves unsigned u64 values losslessly; duplicate keys, unknown
envelope fields, floats, negative numeric literals, over-deep/large JSON,
unpaired/reordered/duplicate IDs, mismatched configurations/source-map anchors,
stale revisions, mismatched allocation/ranges and unpaired/reused page tokens
refuse the whole import. Import acceptance retains original control values
uninterpreted; the separate checkpoint-value panel checks only its bounded
presentation subset and may refuse it without rejecting the import.

Only generation-zero CPU resource observations and successful exact active
operation-step checkpoints are supported. Setup, continue, termination,
watchpoint/fault stops, errors and unavailable control snapshots are not
silently accepted. Large full LDS transcripts must be reduced to valid
unchanged checkpoint excerpts; their file size is not a reason to raise limits.
Unavailable/redacted storage inside an otherwise valid memory response remains
unavailable; missing bytes never become zero.

Existing views accept at most 4096 requested memory bytes (256 visible at once)
and 256 resource rows (64 visible). They reject inexact numeric metadata,
including some Wave64 masks; decimal-string allocation capacities/ranges remain
exact. Their filters browse only retained rows and cannot fetch backend pages.
The importer preserves partial-capture/completeness indications.

Physical registers, allocation release/reuse, register lifetimes, live hardware,
GPU timing, protected compilation and resume authority remain unavailable.
This usable local presentation slice does not complete the broader visualization
or authoring tutorial milestones.
