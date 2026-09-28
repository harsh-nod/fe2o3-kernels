# Current UI route measurements — 2026-09-26

All eight fixed production-route cells completed on mi350: 280 raw sample pairs, including 40 calibration and 240 measured pairs. The root independently checked the completed outer receipt, all input/stream hashes, each cell report, source/tool/dist before/after records, normal browser exits and owned preview cleanup. This is a measured baseline, not acceptance of performance budgets or completion of V0/V3/V4/V5.

## Results

Latency is action to the exact expected DOM state plus two animation frames, **not paint**. Each cell uses 30 measured samples after five calibration samples. Values below are nearest-rank p95 milliseconds.

| Cell | First open | Warm open | Interaction |
| --- | ---: | ---: | ---: |
| navigation-desktop | 348.0 | 49.2 | 49.0 |
| navigation-narrow | 348.2 | 49.2 | 49.0 |
| program-desktop | 381.4 | 49.2 | 47.3 |
| program-narrow | 381.6 | 81.9 | 48.2 |
| v22-one-desktop | 314.7 | 282.4 | 49.4 |
| v22-one-narrow | 298.2 | 282.2 | 49.1 |
| v22-registers-desktop | 298.2 | 281.9 | 49.2 |
| v22-registers-narrow | 298.1 | 282.5 | 49.1 |

The [machine-readable summary](evidence/ui-route-performance-20260926.json) retains p50/p95/max values, per-cell report hashes and signed CDP used-heap checkpoint deltas. Negative deltas are preserved; these checkpoints are not peak heap or RSS measurements.

## Reproduction boundary

The measured site revision is `36e8e130b07fef92f7a2b1e1f47642f8814775dd`. Its fresh TypeScript/Vite production build passed before measurement. Runtime tools were Node 22.22.3, Playwright 1.62.1, Chromium 151.0.7922.34 and Vite 8.2.1. Desktop was 1280×800 and narrow was 390×844, both scale 1 and light theme. The pinned 130-file production distribution was served only from loopback, with no install or build during timing. HTTP caching was disabled; fresh contexts still shared browser/OS/server caches, and warm repeats reused same-page modules.

The bounded harness used eight serial cells, 240 seconds per cell, 260-second external child limits, 15-second cleanup and a 2,250,000 ms campaign bound. Per-cell network ceilings remained 128 MiB, 4 MiB per response and 4,096 requests. The root paused its own builds/native work; host-global quietness and whole-family cleanup were not proved.

The retained V22 CPU recordings expand to approximately 3.6 and 3.55 MB. They are genuine historical CPU recordings, not fresh kernel runs, hardware capture or the full 11 MiB worst-case import class. Isolated parser timing, broader import/paging/reverse budgets, capture overhead and GPU performance remain separate work.

## Retained evidence and failures

The private root packet is `phase28-drafts/current-site-ui-v22-measurement-bound-v1-r6`; all 47 pure controls passed before launch. The complete measurement took 338.875 seconds under the outer runner. The outer receipt is 1,441,073 bytes, SHA-256 `2d9cce57577ac918a561590ef40e76cd05c83b6bde40c2ae15aa035381acacf8`; the campaign report is 33,930 bytes, SHA-256 `223df7e9d7f377dbd76a5707503abc06f0f70c7fe30fee8d3d908849117a9bff`. Exact remote paths and report pins are retained in the linked summary. The harness is host-bound qualification tooling, not a portable benchmark command.

The earlier R2 campaign failed after two navigation cells because its namespace TCP census exhausted the old 64 KiB allowance. R4 introduced a reviewed bounded streaming census; R5 controls then caught a stale midnight assertion. R6 corrected that assertion and used fresh paths and scheduling scope. Earlier failures remain retained and are not counted as successful campaigns. No UI timing or HTTP byte/request cap was relaxed after failure; the TCP-census allowance changed as described above.
