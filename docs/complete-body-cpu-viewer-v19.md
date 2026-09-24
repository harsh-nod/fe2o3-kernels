# Display recorded complete-body V19 CPU checkpoints

Open `#/debugger/source-isa-agent` and choose **Open V19 recorded CPU viewer**.
This is a read-only adapter for the ordinary public command's five-pair
entry → first logical event → reverse-restored entry transcript. It does not
connect to a debugger, compile source, execute imported commands or upload files.

## Produce your own recording

In the compiler checkout, follow [the source/debug command prerequisites](complete-body-debug-v19.md),
then run either command with a new absolute output directory:

~~~sh
node scripts/complete-body-debug-source-v19.mjs one /absolute/new-one-debug
node scripts/complete-body-debug-source-v19.mjs diamond /absolute/new-diamond-debug
~~~

The underlying debugger must use the explicit selector, without version fallback:

~~~sh
fe2o3-debug sim \
  --diagnostic-kir-v19 /absolute/new-diamond-debug/diagnostic-v19.kir \
  --request /absolute/new-diamond-debug/selector-1-request.json \
  --protocol jsonl --wave-width 64 \
  < /absolute/new-diamond-debug/selector-1-debug-requests.jsonl \
  > /absolute/new-diamond-debug/selector-1-viewer.responses.jsonl
~~~

Choose **Display your own five-pair recording**, explicitly select the V19
input profile, and open the request JSONL plus the corresponding debugger
stdout (or the newly retained response file above). Export metadata
`export-observation.json` is optional. It is not required for protocol display.

Only the script's exact five-operation pattern is supported: capabilities,
entry state, one forward event, one reverse event, restored state. Each JSONL
file is at most 256 KiB, each line at most 64 KiB; optional metadata is at most
8192 bytes. More advanced sessions, extra operations or unsupported fields
are refused without slicing or synthesizing a successful recording.

## What the viewer actually shows

- Four recorded cursor checkpoints and the exact request/response lines.
- Only the first logical event's observed KIR function/block/operation site.
- The retained lane-0 SSA scalar bits and allocation-relative pointer.
- The exact 64-bit logical active mask, without JavaScript-number rounding.
- Explicit missing snapshots at entry and after reverse. Missing values are not zero.

These streams do **not** observe the complete authored body or diamond branch.
The sequence is not a full CFG; no untaken edges or per-instruction origins are
invented. No second interpreter calculates new values. Output buffers and
canaries checked by the separate public CPU run are not memory observations
displayed here.

Source location and source-variable maps remain unavailable:
`requires_authenticated_map`. Physical registers, hardware wave state and
hardware register capture remain unavailable. A logical active mask is not
physical EXEC. Optional canonical/source identity strings are independent,
unverified export declarations; the browser does not join them to the session
or original Rust. A canonical identity is not a file SHA-256.

## Retained data and limits

The six bundled recordings in
[examples/complete-body-debug-v19](../examples/complete-body-debug-v19)
are unchanged stdout/request/export-metadata bytes from the public one/diamond
commands run on 2026-09-24 UTC, selectors 0, 1 and u32::MAX.
`provenance.json` records their exact file pins and the parent public-command
receipt hash. They qualify only the recorded entry/one-event/restore observations;
the separate [viewer qualification record](complete-body-cpu-viewer-qualification-20260924.md)
records the later unit/site/browser checks of this adapter.

Local recordings are caller-supplied / unverified. Hashes check byte consistency,
not producer authenticity or typed canonical admission. No raw KIR file is
loaded, decoded or granted compiler/source custody by this adapter. No proof,
resume, artifact, load or launch authority crosses this boundary.

The existing operation-step resource importer and its source-map checks remain
unchanged. This V19 adapter shares the existing closed scalar-row rendering,
not an altered legacy session contract. Its hook stays inside the existing
source/ISA page; curriculum pins, maturity labels and V3/V5 completion are not
promoted. This does not complete the broader authoring or debugger milestones.
