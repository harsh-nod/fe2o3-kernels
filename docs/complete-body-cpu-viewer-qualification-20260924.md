# Recorded V19 CPU viewer qualification — 2026-09-24 UTC

The browser adapter passed its own unit, site-wide and desktop/mobile browser
checks on mi350. This is a read-only presentation of the six retained public CPU
debugger recordings, not live debugging, source authentication, physical register
capture or an additional milestone exit.

## Checked scope

The exact five request/response pairs retain configuration, revisions, event
sequence, first logical KIR site, scalar bit patterns, allocation-relative
pointers and the lossless full Wave64 logical mask. Entry/restored snapshots
remain unavailable; changing a recording clears the previous displayed values.
Optional export metadata stays unverified and unjoined. Local files are bounded,
read locally and not uploaded or executed. Legacy operation-step importer and
source-map checks remain unchanged.

The viewer shows only entry, first event and restore. It does not reconstruct a
CFG, infer branch outcomes or provide full-program instruction stepping. Logical
mask and SSA rows are not physical EXEC or register observations.

## Reproducible gates

Before and after both gates the site was HEAD
94793acee824d178c85d859e2ba995c93785c5c4 plus the adapter working tree:
842 source files, 20,284,061 bytes, SHA-256
74c0f2d6c2c9d28e2f611609656265c740759734d914a28ff542a803dcbbc52e.
This publication document and its documentation link were added after those
gates; they are not retroactively included in the tested census.

The unit gate ran the three new test leaves and three existing scalar/session
regressions (130 tests, including 50 new cases), then npm run validate:
1,589 unit tests in 110 files, 21 authoring-lab tests, lint, typecheck and build
all passed. Focused tests overlap the full suite and are not additional unique
tests. The existing large-bundle warning remained; it was not suppressed.

Receipt: logs/phase28-resume-r8-site-cpu-viewer-v19-unit-r1/receipt.json,
20,954 bytes, SHA-256
d83d28a2b553bb3b54619bddd00c4bce28f8583466c67dc5025fd1efa0a6f3ae.

The browser gate used the new complete-body viewer test and existing recorded
resource import/value tests, two workers, zero retries, in both configured
desktop and mobile projects: **10/10 passed**. This includes keyboard opening,
first-event rows, exact mask, restored-state clearing, recording-switch reset,
close/reopen reset, no page errors and no non-GET requests in the new viewer
test. It is a targeted browser gate, not the entire browser suite.

Receipt: logs/phase28-resume-r8-site-cpu-viewer-v19-browser-r1/receipt.json,
20,678 bytes, SHA-256
1c352ba622310a3a8c03f331540e25951b660050cebee6d07a79bb243eb1fe00.
Screenshots are retained in phase28-site-cpu-viewer-v19-browser-r1. Mobile
first-event screenshot was also visually reviewed; the shared scalar table
keeps its horizontal-scroll presentation.

## Evidence boundaries

The nine bundled source files remain byte-exact public command outputs; their
provenance JSON records the earlier capture/donor state, including the historical
site_adapter_tests_executed=false field. The separate gates above are the new
viewer evidence; the original provenance file was not rewritten to imply that
its source command tested the browser.

[Viewer instructions](complete-body-cpu-viewer-v19.md) and
[source/debug tutorials](complete-body-debug-v19.md) describe the user workflow.
No compiler curriculum pin or maturity label changes. V3/V5 and the broader
hardware and authoring milestones remain open.
