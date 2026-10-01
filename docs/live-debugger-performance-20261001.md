# Live debugger measurement — 2026-10-01

The CPU-simulation debugger completed a fresh seven-batch browser campaign for reverse stepping and reading restored memory. Across 30 measured observations per cell, p95 click-to-correlated-visible-response time ranged from 48.3 to 49.1 ms.

These are observations of this fixture and harness, not an accepted live end-to-end latency SLA. The separate 100 ms rendering target is **not** a live-operation budget. This result does not close the whole debugger milestone.

## Results

| Viewport | Operation | Measured samples | p50 (ms) | p95 (ms) | Maximum (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| Desktop, 1280 × 800 | Reverse one operation | 30 | 48.7 | 48.9 | 48.9 |
| Desktop, 1280 × 800 | Read restored memory | 30 | 48.1 | 48.5 | 48.6 |
| Mobile, 390 × 844 | Reverse one operation | 30 | 48.6 | 49.1 | 49.2 |
| Mobile, 390 × 844 | Read restored memory | 30 | 47.6 | 48.3 | 48.5 |

Quantiles use nearest rank over measured observations only: for 30 samples, p50 selects the 15th sorted value and p95 the 29th. The table rounds to one decimal place; the [evidence file](evidence/live-debugger-performance-20261001.json) retains every original numeric observation.

## What was measured

The timer starts at the actual target-button click. It ends when the exact newly correlated response and its visible semantic facts or memory values are ready and remain consistent through two `requestAnimationFrame` callbacks. The response is joined to the expected request, sequence, configuration, revision and cursor; an unrelated or stale response is not a valid endpoint. Memory-field entry happens before the click and is excluded. Polling and later replay checks do not define the measured interval.

This combines the local browser, HTTP bridge, CPU simulation and UI response path. It is not isolated backend, query, transport or rendering time. Two animation-frame callbacks establish this DOM-readiness endpoint, not proof that pixels reached a display.

There were seven fresh batches, each with both viewports and five cycles per viewport. Each cycle stepped forward, read the changed memory, reversed one operation, and read the restored memory. Only the reverse and restored-memory actions were timed. Batch 0 supplied 20 calibration observations; batches 1–6 supplied 120 measured observations. All 140 observations and all seven batches are retained, with no replacement samples or retries inside the successful campaign. Both viewports used device scale factor 1 and a light color scheme.

Replay checked 420 request/response pairs across 14 browser/CPU sessions. The byte oracle checked the complete 24-byte allocation: four output-word slots, eight guard bytes, and initialization state. These repeated first-write/reverse cycles did not complete all four output words in the browser. The separate current HTTP functional audit did check four words equal to 469 and the unchanged `deadbeefcafebabe` guard pattern; its 69 requests are not part of this timing sample set.

The owner-side audit checked that all 14 owned CPU process identities were gone after cleanup. A browser disconnect acknowledgement alone was not treated as process-cleanup evidence.

## The first campaign failed and remains retained

An earlier campaign completed its calibration batch, then failed with `server_unexpected_exit`: the next batch's bridge exited before browser launch. That incomplete campaign is retained as a failure, including its completed calibration receipt and failure receipt. No samples were carried into the fresh campaign reported above.

Port restart contention, including `TIME_WAIT` after the first batch, is a plausible explanation, not a confirmed cause: the underlying error number was not retained. The later successful campaign does not retroactively turn the first attempt into a pass.

## Scope and evidence

This is one bounded CPU-simulation fixture and two fixed browser viewports, not a mobile-device benchmark, network-load study, concurrency test, GPU measurement or performance prediction. It does not establish peak memory usage, allocation-reuse behavior, a complete transitive runtime dependency closure, source authentication or execution authority. Repeated operations within a session are not independent trials; no confidence interval is claimed. No live latency budget was accepted.

The companion JSON includes all raw timings, unrounded summaries, the 167 selected binding pins, all seven batch receipt pins, both browser-observation pins per batch, and pins for the successful summary and retained first failure. Compiler and site baseline revisions are recorded separately from their audited source-tree identities; a baseline revision alone does not identify an overlaid working tree. Paths use repository roles or evidence-relative identifiers instead of private workspace paths. Tokens and raw HTTP headers are not published.

These hashes identify retained evidence and checked bytes. They are not independent execution authentication. Further coverage and an explicitly agreed live-operation budget are required before making a broader performance or milestone-completion claim.
