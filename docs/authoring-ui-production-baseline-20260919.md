# Authoring viewer production-build measurements (2026-09-19)

This is a measured local production-preview baseline for V0/U0 review, not an
accepted latency budget or milestone closure. No source, capture, or UI behavior
was changed to obtain these observations.

## Scope

Clean measured site commit: `b3272c21347fbdc2ce2550c49d9e285d875a754b`.
All work ran on SSH host `mi350-2`. Node 22.22.3, Playwright 1.62.1,
headless Chromium build 1234, GPU disabled. Existing Vite production build and
preview server; no installed dependencies or downloaded browsers were changed.

The fresh build contains 78 regular files, 4,502,618 bytes. Asset-census SHA256:
`e30fe32ca3b7119ab999e3d2e609c154093aada217eb135e8e6cbe2e3123a8b1`.
Both retained real inputs total 959,617 bytes. Source census:
493 files, 14,231,371 bytes, SHA256
`55b61c48aace404b3c79e21a9d2bb1eaa9b6eacb61f95669fc549814053ce253`.

Twenty sequential fresh contexts cover five repetitions of two workflows at
1280×800 and 390×844, both DPR1. HTTP cache is disabled; OS/server caches are not
flushed. One browser is shared. The narrow viewport is not mobile hardware.

## Observed opening latency

Milliseconds from action to expected DOM readiness plus two animation frames.
First open includes lazy-chunk load, validation, parsing and rendering; it is not
isolated parser CPU. Warm reopen reuses modules. Two frames do not prove paint
completion. With five samples, nearest-rank p95 is simply the observed maximum.

| Workflow / viewport | First-open p50 / p95 | Warm-reopen p50 / p95 |
| --- | ---: | ---: |
| Source navigation / desktop | 350.0 / 356.0 | 30.7 / 34.3 |
| Recorded program / desktop | 433.3 / 437.7 | 64.4 / 69.4 |
| Source navigation / narrow | 334.5 / 351.2 | 29.8 / 30.3 |
| Recorded program / narrow | 434.2 / 451.5 | 65.9 / 73.4 |

[Retained numerical summary](evidence/authoring-ui-production-baseline-20260919.json)
includes all action samples, including source selection and recorded-program
before/after/reverse/repeat. Those are selection latency, not debugger execution
or replay performance.

At first-open readiness, renderer-isolate used-heap medians were 8,359,792 /
9,652,584 bytes for desktop source/program and 8,340,344 / 9,739,360 bytes for
narrow source/program. These are checkpoints, not peaks, with no forced GC.
Separate process-tree RSS snapshots can double-count shared pages and are not
page-exclusive memory.

## Guarded results and retained failures

Campaign finished in 28.878 seconds including cleanup: 650 admitted requests,
53,865,360 decoded body bytes, 10,751,460 encoded transfer bytes, zero network
violations. Exact asset sizes, server identity, input pins, implementation and
source census remained unchanged. Owned Chromium processes exited and the
temporary short-path symlink was removed; build/output/browser artifacts remain.
The root stopped its exact preview server afterward and verified port 4173 idle.

Unchanged caps: 4 MiB per response, 128 MiB aggregate network, one context/page,
16 observed browser processes, 240-second campaign plus 15-second browser cleanup,
1 MiB report, 20 GiB combined task cache/output, 40 GiB free disk and 64 GiB RAM.
Process and resource checks are detection/abort or pre/post observations, not
OS-enforced allocation guarantees. The inherited subprocess timeout requests
termination; it is not itself a guaranteed drain/reap completion deadline.

The development-profile attempts remain failures: short Chromium socket-path
setup, missing exact dev-path allowance, then the 4 MiB response bound. No
development samples are included. Production benchmark r1 failed before browser
launch because the preview command used a relative entrypoint; r2 used the exact
absolute existing entrypoint, without changing the measured helpers or limits.

Twelve pure synthetic helper controls passed; they are not performance evidence.
Full retained task receipts:

- Build r1: 28,314 bytes, SHA256
  `3403a78853a1dac6bce407bdf23dd688844d1154ae1364dabce74abdceca9ff5`.
- Browser r2: 459,495 bytes, SHA256
  `8f6d43b46cc03cf9175db6d87aac9940c5107fdd042d2de8de9694f1b7148bd3`.

## Remaining decisions

Owners still need to accept applicable fixtures and import/render/replay budgets.
This profile is not deployed CDN/traffic, GPU execution, live debugger timing,
physical-register/lifetime observation, producer authentication, compiler resume,
or an end-to-end source-edit proof. It closes none of V0/U0 by itself.
