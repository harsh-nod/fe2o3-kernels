# Recorded fault/source viewer qualification — 2026-09-23

Site-only increment from base `d929b25e85740303c1075ea2beac7898bc8923d9`,
under [#281's bounded scope](https://github.com/harsh-nod/fe2o3/issues/281#issuecomment-5786509482).
All five functional gates below passed, including the full desktop/mobile
browser suite and three actual retained-capture imports. Publication policy,
documentation census, commit and main readback are tracked separately.

## Implemented boundary

The optional, lazy-loaded Source/ISA agent panel locally imports four original
files through `importFaultSourceReplay`. A closed 44-pair adapter validates exact
session/revision/control/terminal/stale-query relationships and lends exactly
18 unchanged successful pairs to the existing resource importer. That importer,
compiler/runtime producers and public debugger schemas are unchanged.

Terminal Fault/Failed and final Completed/Failed show explicit unavailable
source, stack, SSA and memory. Selecting prior/repeated checkpoints shows
separate source bindings and SSA, original stack and three retained memory
windows. Pointer navigation selects an already-retained byte; it does not
dereference, issue a query, infer a failed range or map a source name to SSA.
Moment changes clear pointer/comparison/raw selection. File replacement, reset,
cancel and late asynchronous completion cannot restore obsolete results.

All four primitive strings are copied and bounded before asynchronous hashing;
the returned observation is frozen. Strict UTF-8/JSON, original LF preservation,
exact file hashes, complete pages, source/frame/SSA joins and raw-line display
remain mandatory. Limits are 64 KiB receipt, 256 KiB each request/response stream,
4 KiB diagnostic, 1 MiB total and 64 KiB per JSONL line. Nothing is uploaded,
fetched, persisted, compiled or executed by the panel.

This is **caller-supplied/unverified four-file consistency**, not authentication
of the receipt's full run. Bundle/KIR, source body, request inputs, positive output,
compiler/tools and other stage artifacts are not imported or independently
verified. The standalone typed uninitialized-read diagnostic is a separate
execution; its prose/raw block ID cannot supply a typed debugger fault range or
canonical-block correspondence. Frame 1 is static depth, source-binding
generation is not allocation generation, and generation zero proves no reuse.

## Original historical fixture

The checked-in example is canonical **historical R3**, not a final W4 capture or
new execution: `phase22w2-fault-source-actual-r3`. At each of its two prior visits
there are six source rows (two captured pointers, four not represented),
13 SSA rows and 16/16/24-byte windows. Terminal values remain uncaptured.
The existing [compiler evidence](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-fault-20260922.md)
separately qualifies the original producer; this panel does not rerun it.

| Original file in examples/source-fault-replay-v2/ | Bytes | SHA-256 |
| --- | ---: | --- |
| receipt.json | 19683 | c60587e9d5d47d689efecb020133b4d670da2f620780e37644fd9738c6af9488 |
| debug-requests.jsonl | 10184 | 0f9ad2fdd8b084504a022ce859e308d9e6579be03ad12b1eecf01f78a0668e1e |
| debug-responses.jsonl | 69406 | 9c569caee68dd88d42aa12f36c5ea8a011cf5a4d034d8d6640addc423cdd5c22 |
| uninitialized.stderr | 504 | 91c3b2ba7237afca178616723db569e901b5eecee342dca86c1e19d81d71684f |

## Recorded site qualification

Closed successful gates preserved the functional source census:
666 files / 16742769 bytes / SHA-256
`7f87812d5573a6e67aef37aba30bdb54c0133e9477dd8081b5070d057150f8b8`.
This is not the later report/publication census. Receipts are relative to
`logs/` under the retained mi350 task root
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr`.

| Gate | Result | Receipt | Bytes / SHA-256 |
| --- | --- | --- | --- |
| Focused R2 | Lint/typecheck; 38 adapter + 10 UI tests passed | phase23-site-fault-focused-r2/receipt.json | 29476 / e5b029658f3573f246b3f4e5e361aad36948cec52afc7c2704d919f1f0aba7e3 |
| Full validation R1 | 1033 unit tests in 73 files; 21 lab controls; lint/typecheck/production build and evidence validation passed | phase23-site-full-validation-r1/receipt.json | 30953 / 13b44e9290e9e4ddea690e0aa56be1d812750a9955974e083ebc2817ae3faa6e |
| Focused browser R1 | 6 desktop/mobile expected, 0 unexpected/skipped/flaky; reported 20.647672 seconds | phase23-site-fault-browser-r1/receipt.json | 29969 / b7c9810905a490f743da94aa32d4496711cfc32129f108f3bef3e53148d0d990 |
| Full browser R1 | 158 desktop/mobile expected, 0 unexpected/skipped/flaky, no reported errors; 253.823558 seconds | phase23-site-full-browser-r1/receipt.json | 34262 / 820a240cb86c4822441c4303a5416191ae622652c96844ded9484c9c4a339f28 |
| Cross-capture R1 | Historical canonical R3 plus canonical/mirror final W4 imported; each 44 original pairs, 18 unchanged successful pairs and 2 captured checkpoints | phase23-site-cross-capture-r1/receipt.json | 46025 / f88ebf652f68d17fb1fe0f5e619125cab06a3b5c04bfd6c6e0ee834a3a16e4e7 |

The 48 focused tests are included in the 1033, not added again. Evidence
validation reports 44 commits, 109 records, 112 source tabs, 7 local artifacts,
14 getting-started source bindings, 23 debug/simulator artifacts and 3 source/ISA
characteristic artifacts; this is site evidence validation, not new execution.
The production build retains its pre-existing greater-than-500-KB chunk warning;
this report does not claim warning-free builds. Browser durations are test
observations, not kernel-performance measurements or a visual-review claim.
Desktop/mobile interaction and horizontal-containment checks passed. The
retained long-element screenshots can include the existing viewport-fixed
header/skip-link within the document crop; they do not establish unobscured
viewport rendering or pixel-clean visual acceptance.
Controls cover fabricated terminal values, wrong identities/frames/pages,
stale/reordered/lossy records, changed raw bytes, unsupported authority, malformed
UTF-8, cancellation and deferred-hash input/state races.

Focused R1 failed after lint at TypeScript checking: Testing Library's
`getByRole` options do not accept `exact`. Only that unsupported test option
was removed; production validation was not relaxed. Preserve the failed
`phase23-site-fault-focused-r1/receipt.json`, 17710 bytes, SHA-256
`053130b86eae7a8bfc6ddd1d11126368adf9a142e18c9e0618789143ec87a485`.
It is not a passing test run or relabeled R2 result.

Cross-capture loaded the current adapter through unchanged Vite SSR, checked
four original files per group and rechecked byte custody. Both final W4 groups
retain their own configuration identities; the historical example is unchanged.
Its stdout is 1488 bytes / SHA-256
`0426b57535c85aa0804d123a23accbdfd1073a845347af18fc1d878c74ea7b74`;
full-browser JSON stdout is 183556 bytes / SHA-256
`4d9fb993fda8be038115e7ef151a6435cce7cbd3c1fdfa9fd8cc31c7b6ba5a5a`.
There were **zero new kernel executions**; full-run verification and source
authentication remain false. Owner-produced terminal snapshots,
allocation reuse/lifetime and live debugger transport remain outside this slice.
No GPU/native/proof/performance authority or broad V2 closure follows.
**M1/V1/U1 remain the accepted 3/18 milestones.**
