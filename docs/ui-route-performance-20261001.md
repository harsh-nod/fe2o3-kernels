# Recorded viewer performance October 1 2026

The current production build completed eight recorded-viewer measurements on
mi350: four workloads at desktop and narrow widths. All measured p95 latencies
meet the named regression targets adopted below by the root integrator
for the viewer implementation. This is a scoped regression baseline, not a
universal latency or memory guarantee.

This is fresh browser measurement of retained CPU recordings, not fresh kernel
execution. It does not complete M0, V0, U0 or V5. The accepted ledger remains 6/18:
M1, V1, V2, U1, U2 and U3. The [September 26 baseline](ui-route-performance-20260926.md)
and its original claim flags remain unchanged.

## Source and method

Measured site commit: `0e4569be83163b25a290d3ccb5e7945cf4997245`.
The complete source census contains 1,075 files and 25,327,528 bytes, SHA-256
`9a64929e4025df7da3b5474fee4d29b15f0395153a1f296a56a3299e86f5a846`.
The preceding full validation/evidence/build passed 2,118 unit tests in
177 files and 21 authoring-lab tests. Its curriculum source-obligation message
still labels the 56 lessons and 307 code tabs pending; it is not tutorial closure.

Headless Chromium 151.0.7922.34 used the built production preview,
with GPU disabled, light theme and device scale factor 1. Desktop is
1280×800; narrow is 390×844. Each cell retained five calibration pairs and
30 measured pairs, each in a fresh browser context: 280 raw pairs and
240 measured pairs overall. Each pair measures first open/import, one named
interaction, and warm reopen/reimport. Percentiles use nearest rank.

Timing begins at the real click/change capture listener and ends when the
expected identity-bound semantic DOM is present followed by two animation
frames. It is not a paint measurement. The route shell is loaded first.
V22 files are already selected before timing; first and repeat import measure
the complete UI operation, not an isolated parsing stage. Warm measurements
follow close/clear and, for V22, restaging in the same context.

The navigation fixture is 18,050 bytes and the recorded-program fixture
941,567 bytes. The exact V22 workloads are `one-output129`
(3,605,669 expanded aggregate bytes, 8,833 index rows) and
`registers-output13` (3,554,682 bytes, 8,718 rows); each has 88 protocol pairs.
They are genuine retained recordings, not maximum-size importer fixtures.

## Latency results

Each entry is **p50 / p95 / maximum**, in milliseconds, rounded to 0.1 ms.
The [evidence JSON](evidence/ui-route-performance-20261001.json) retains the
unrounded values, fixture hashes and receipt pins for all eight cells.

| Cell | First open or import | Warm reopen or reimport | Named interaction |
| --- | --- | --- | --- |
| navigation-desktop | 347.9 / 348.1 / 348.2 | 49.0 / 49.2 / 49.3 | 48.8 / 49.0 / 49.0 |
| navigation-narrow | 347.8 / 348.1 / 348.1 | 49.0 / 49.2 / 49.2 | 48.9 / 49.0 / 49.1 |
| program-desktop | 381.2 / 381.4 / 381.5 | 49.0 / 97.9 / 98.0 | 46.4 / 47.4 / 47.6 |
| program-narrow | 381.3 / 398.2 / 431.4 | 49.0 / 82.1 / 98.4 | 47.3 / 48.6 / 48.6 |
| v22-one-desktop | 281.4 / 298.3 / 312.2 | 265.5 / 282.0 / 282.3 | 49.0 / 49.2 / 49.3 |
| v22-one-narrow | 281.6 / 314.8 / 328.1 | 265.7 / 282.4 / 284.1 | 48.9 / 49.1 / 49.2 |
| v22-registers-desktop | 281.5 / 298.3 / 299.1 | 251.0 / 265.7 / 301.6 | 49.0 / 49.2 / 49.3 |
| v22-registers-narrow | 281.6 / 298.3 / 298.7 | 265.7 / 282.3 / 282.5 | 48.9 / 49.1 / 49.2 |

The navigation interaction selects the exact retained BitOr attribution.
The program interaction selects a retained checkpoint showing 19 after a
checkpoint showing 23. The V22 interaction opens index rows 65–128 after
rows 1–64. These are recorded-view interactions, not reverse execution.

## Signed heap checkpoints

The following values are bytes from discrete Chromium
`Runtime.getHeapUsage.usedSize` readings. They are signed differences,
not peak heap or process RSS. “Staged to warm” uses the new warm-stage
reading after close/clear; it does not reuse the first-stage baseline.

| Cell | Staged to first maximum | Staged to warm minimum to maximum | Shell to first maximum | Shell to final clear maximum |
| --- | --- | --- | --- | --- |
| navigation-desktop | 5,927,572 | -2,362,760 to 1,302,700 | 5,927,572 | 6,547,744 |
| navigation-narrow | 5,062,028 | 1,263,784 to 1,306,912 | 5,062,028 | 6,151,100 |
| program-desktop | 10,575,728 | -1,546,360 to 5,271,616 | 10,575,728 | 14,377,676 |
| program-narrow | 10,447,700 | -1,426,588 to 1,820,412 | 10,447,700 | 13,417,756 |
| v22-one-desktop | 22,388,156 | 18,762,848 to 23,195,828 | 28,106,876 | 52,940,684 |
| v22-one-narrow | 21,982,944 | -20,946,452 to 19,932,988 | 27,637,820 | 48,325,984 |
| v22-registers-desktop | 26,073,416 | -12,987,112 to 18,340,796 | 31,679,260 | 46,279,184 |
| v22-registers-narrow | 26,045,196 | -20,044,480 to 22,452,428 | 31,685,844 | 51,103,856 |

The largest reported difference is 52,940,684 bytes. All four difference
series have 30 measured readings per cell. There are 25 negative warm-stage
differences, including −20,946,452 bytes; they remain signed rather than
clamped to zero. These readings do not establish peak usage, memory
reclamation, leak-freedom or a hard resource cap. The JSON retains the
minimum, p50, p95, maximum and negative-sample count for every series.

## Adopted named viewer regression targets

The root integrator adopts these targets in its compiler-integration and
viewer-implementation roles only, at `2026-10-01T00:58:12.206Z`. This is not
agreement on behalf of other issue owners. Scope is limited to these exact
fixtures, current source, viewports and method.

| Named operation | Adopted target |
| --- | --- |
| Small navigation/program first open | p95 500 ms |
| Small navigation/program warm reopen | p95 100 ms |
| Named navigation/program interaction | p95 100 ms |
| Exact V22 whole first import and repeat import | p95 1,000 ms each |
| Exact V22 next index page | p95 100 ms |
| Each published signed heap checkpoint difference | Each signed checkpoint delta ≤128 MiB |

Every reported cell meets these named targets on the measured build.
Adoption is recorded after measurement: the existing small-fixture targets
are retained, and the separately named V22 whole-import target is an additive
initial regression baseline. It does not establish a universal guarantee.

The V22 1,000 ms target is a new, separately named whole-import/reimport
budget. It neither replaces the earlier isolated-parser target nor
reinterprets the 100 ms bounded-page target as a whole-import limit.
The 128 MiB target applies to the four named checkpoint differences,
not total heap, peak heap, RSS or absolute values of negative readings.
This dated adoption leaves all historical evidence flags and broader
contract decisions unchanged.

## Evidence and remaining coverage

The measured campaign took 339.247083425 seconds and accounted for 8,470
requests without a recorded network refusal. Root's audit records all eight
direct browser identities and the owned preview identity absent afterward.
That is not complete process-family or escaped-descendant cleanup, and the
owned-job check is not host-global quiescence.

The root-audited current campaign receipt is 1,449,982 bytes, SHA-256
`80fdba739a635865b86a71418c37e15e08107cd6533340082d3754b939ef99ae`.
Its campaign summary is 33,984 bytes, SHA-256
`8b51a786810a2cd870cf225d27a14540fd57c6e9902ae6b7cd449917f71a77ba`.
The companion JSON supplies the current build, profile, per-cell report and
audit pins; private custody paths are not public download URLs.

Still unmeasured are actual reverse replay and live memory-query latency,
isolated parsing/decompression, the maximum valid or worst-cap importer
workload, peak heap/RSS, hardware behavior and full accessibility/route
coverage. These results support only the named recorded-viewer workload.
V0 owner/contract decisions and remaining V5 scope stay open.

## Later-panel inventory (separate diagnostic suite)

The original eight cells above do not include the subsequently added
`AuthoredRegisterDemand` or `LinkedRegionLines` panels. The existing
`scripts/resource-view-performance.mjs NEW_OUTPUT_DIRECTORY` suite now includes
four real authored-demand profile/optimization cells and one linked-line cell
that switches O0 → O3 → O0, alongside its three original resource-view cases.
It uses the exact retained native comparison, authored-demand capsule and
sixteen-artifact linked-line capsule; same-size byte substitution fails.

For each new cell the suite runs five warmups and retains 30 measured observations
at 1280×800: JSON decode, awaited real validation/projection, component mount
through independently validated semantic DOM plus layout, and a selection/reset
round trip. Each sample starts from an empty component baseline. Modules and
browser caches stay warm. Async polling time is included; these are not paint,
cold-load, production-route, GPU or independently authenticated capture timings.
The development-Vite result schema is v2; original synchronous resource-view
timings remain separately named and are not merged with the async metrics.

The fixed input ceiling remains 512 KiB per cell; real panel readiness has a
10-second/600-frame refusal limit within the existing 120-second browser timeout.
Failure to validate, render the expected rows or show the exact selected identity
fails the diagnostic instead of publishing a timing for a refusal state.
Panel latency targets are not adopted by this change. Running the command
produces fresh `samples.json` and `receipt.json`; adding the inventory alone
does not assert measured results.

This addresses a concrete measurement-inventory gap, not completion of V5 or
U4. Maximum-valid/worst-case imports, narrow/production-route coverage for these
panels, peak heap/RSS, broad accessibility, live/reverse operations and explicitly
agreed panel budgets remain separate. Existing tutorial and public admission
limitations are unchanged.

### October 7 standalone-panel observation

The source-aware normal `repo=site` gate passed on mi350 at
`2026-10-07T03:25:25.584Z`, Chromium `151.0.7922.34`, Node `22.22.3`,
AMD EPYC 9575F, 1280×800. The following values are p95 milliseconds; the
[raw evidence](evidence/panel-performance-20261007.json) retains all 240 measured
samples across the five panel and three original cases, unrounded distributions,
fixture pins and environment. Forty warmup iterations were executed but their
timings were not retained.

| Actual retained panel cell | Async projection | Mount → ready/layout | Selection/reset round trip |
| --- | ---: | ---: | ---: |
| Authored default / O0 | 23.1 | 24.9 | 29.5 |
| Authored default / O3 | 21.8 | 25.0 | 29.7 |
| Authored edited / O0 | 21.8 | 26.7 | 30.1 |
| Authored edited / O3 | 21.1 | 24.4 | 30.1 |
| Linked lines O0 → O3 → O0 | 3.0 | 14.7 | 33.0 |

Authored cases render six rows; linked cases render two case rows and one
coverage row. The input byte counts are 510,581 and 80,466 respectively.
Projection and component mount each perform validation independently, so their
timings are separate stages rather than an end-to-end production-route sum.
Round trips contain two UI actions and must not be compared directly with the
October 1 single-action targets.

The normal receipt is 33,103 bytes,
SHA-256 `f762343f1ce40118f255ac0035922f906c29f3631ebea50fe8e410b01f6fcb0e`.
Its pre/post site census is 1,169 files / 26,391,355 bytes,
SHA-256 `c70d5fff2df93f3930f60f3f4132f1aecbdec068549174c3aa16a36f303d4f35`,
based on `7663838260764e3572bf673c14e52ac64ef20e99` plus the four scoped
measurement/doc edits. This results note and its evidence file were added
afterward; they are not relabeled as measured source. The run establishes no
new SLO, full browser/runtime dependency attestation, V5 or U4 completion.

## October 8 current-build production-route baseline (R87)

A fresh production build of clean site commit
`29b2a93272e9abd4dc2f7c2d04e72cfa1c191edc` completed the same eight cells on
mi350 during 2026-10-08 10:14:15–10:20:49 UTC. The complete before/after source
census is 1,187 files / 26,696,448 bytes, SHA-256
`f7f6026d49b797fc700c082cd2751eb4348607fd090809d8596dc8fee75908df`.
Later V3 shared static-instruction selection changes were integrated only
afterward. Those changes and the standalone panels above are not included in
these eight measured routes. This adds a dated observation, not replacement
of earlier results or a new acceptance of their targets.

Headless Chromium 151.0.7922.34 served the fresh 138-file production distribution
from loopback with GPU disabled, light theme and device scale 1. Desktop is
1280×800; narrow is 390×844, not mobile hardware. Each cell has exactly five
calibration pairs and 30 retained pairs: 280 raw pairs, 240 retained, with
720 retained first/warm/interaction timings and no recorded failed pair.
All 24 p50/p95/maximum distributions were independently recomputed.

Values below are nearest-rank p95 milliseconds, rounded to 0.1 ms.
Timing remains the actual click/change capture listener to the exact expected
semantic DOM plus two animation frames, not paint. The shell is already loaded
and V22 files already selected; first/repeat import is a whole UI operation,
not isolated parsing/decompression. HTTP caching is disabled; fresh contexts
share browser/OS/server caches, and warm repeats reuse the same page.

| Cell | First open/import | Warm reopen/reimport | Named interaction |
| --- | ---: | ---: | ---: |
| navigation-desktop | 359.7 | 48.9 | 48.5 |
| navigation-narrow | 357.3 | 48.8 | 48.9 |
| program-desktop | 429.0 | 67.8 | 47.8 |
| program-narrow | 428.7 | 81.0 | 44.8 |
| v22-one-desktop | 363.2 | 281.1 | 51.3 |
| v22-one-narrow | 361.4 | 272.8 | 50.4 |
| v22-registers-desktop | 334.7 | 272.1 | 51.9 |
| v22-registers-narrow | 329.2 | 273.0 | 50.4 |

Interactions are unchanged: exact BitOr attribution, retained whole-program
checkpoint 23→19, and V22 index rows 65–128 after 1–64. None is execution stepping
or reverse replay. The unchanged V22 recordings contain 8,833 and 8,718 index
rows, 88 protocol pairs each, and 3,605,669 / 3,554,682 expanded aggregate bytes.
Their original byte identities and counts were rechecked; these are historical
CPU observations, not fresh kernel execution or the worst 11 MiB import class.

Seven `Runtime.getHeapUsage.usedSize` checkpoints per pair and four signed
delta series remain available without forced GC. Across 1,680 retained
checkpoints, observed used heap ranges from 2,173,624 to 64,642,040 bytes:
sampled values, not a measured peak. Forty-one retained warm-stage deltas are
negative and remain signed. This campaign measures no RSS, peak heap,
owner-attributed memory, leak-freedom or exit reclamation.

Original limits remain: 240-second cell, 260-second external child,
15-second cleanup, 2,250-second campaign; per cell, 4 MiB per response,
128 MiB aggregate network and 4,096 requests. All 8,470 requests completed
without a recorded network refusal. Every cell matched its 975 selected inputs
(483,214,604 bytes) before/after; these pins also join the normal receipt's
1,011 selected rows and unchanged source census.

Separate service cleanup recorded launcher exit 0, inactive/dead state,
MainPID 0 and a removed/empty cgroup. All 320 distinct browser PID/start
identities sampled across the cells appear in CPU10–11 service observations.
This is evidence for the named owned service, not global quiescence, proof
that no process escaped or transitive tool/future-dlopen attestation.
Individual reports keep their false qualification/whole-family claim flags;
outer receipt and cleanup are separate evidence, not rewritten reports.

Private retained evidence (custody records, not public download URLs):

- Normal receipt: 1,538,614 bytes, SHA-256
  `f28124a4ed30948a13986bb92be946513168c9e5bbb337182fd047918ff0c4c0`.
- Eight-cell summary: 19,019 bytes, SHA-256
  `515b80feb52ca4bde9d804966b6be6c1796dca3f26b2e6e01acc18c30629a6d7`.
- Named-service cleanup: 129,400 bytes, SHA-256
  `32bed6043c557a41e79817f7cc41d40d0b11952ca26bda9beeec2af14a79f920`.
- Independent raw-sample/binding audit: 21,997 bytes, SHA-256
  `c8b160f01965e4aa490d01aafea9a02f99c52a5eab1167b6f9fa9866d3fefb8d`.

The first three records are under
`logs/phase28-resume-r87-site-v0-eight-cells-r1/`; exact reports remain under
`phase28-site-ui-performance-r87-r1/cells/`. No new SLO or memory budget is
adopted. Isolated transport/query/projection/render timing, live/reverse
operations, maximum-valid/oversize workloads, later-panel production routes,
peak heap/RSS and broader accessibility remain separate. This observation
does not close V0 or any other milestone.
