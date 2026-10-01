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
