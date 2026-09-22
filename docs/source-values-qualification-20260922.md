# Recorded source-value qualification — 2026-09-22

This is the dated evidence companion to the
[source-variable walkthrough](resource-source-values-v2.md) and
[Rust-to-assembly promotion lab](source-promotion-lab-v1.md). It separates the
retained CPU recording, current browser validation and pending curriculum gate.

## Recording, not a live or authenticated session

The [retained example](../examples/source-variable-resource-v2/README.md) contains
27 successful pairs / 60,542 JSONL bytes / three selected checkpoints. Its
[provenance](../examples/source-variable-resource-v2/provenance.json) records
compiler base `431fa35b6795e5170ae74858da8b2416002a8717` and exact historical
dirty-source census
`1572a464d3b0065ae6a7ef49f74fa0ed3d2e34e9901cbe2b06023a7a295e4920`.
It is not a recording from a later compiler revision.

The original six-page chains retain 12 source variables at every checkpoint:
two captured parameters and ten explicitly unrepresented variables. Source,
SSA and memory observations stay separate; equal bits or names establish no
mapping. Original lines, IDs and distinct framed/unframed anchors are preserved.
The browser performs local read-only import and continues to label this example
caller-supplied/unverified.

## Site validation

The completed site source census is 605 files / 15,374,766 bytes:
`4ea010c0b594c0224aa536e0b3250d2b97e797bc32ab510b5763219717f7a026`.

- Site lint, type checking and production build passed.
- Vitest: 870 tests across 61 files.
- Node authoring tests: 21.
- Playwright: 136 tests, zero skipped and zero flaky, with retries disabled.
- Evidence audit: 44 referenced commits, 109 records, 112 tabs, seven artifacts,
  14 bindings, 23 debug-simulation entries and three source-ISA entries.
  Zero issue-state entries were imported; this is not a milestone-status update.

Receipts remain operator-retained on mi350 under
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr/logs/`.
Each label denotes `phase18-LABEL/receipt.json`.

| Receipt label | SHA-256 |
| --- | --- |
| `site-validate-r3` | `fd8b74c37f518cd1ee36666cea03d6ce9bacdc5d94c016dd07caf6e7bf278819` |
| `site-e2e-r4` | `a330d4fa65ec0dcc69657d46aa16cfe05a78d90464248cfa6284424c6f1079a9` |
| `site-evidence-r3` | `6f40eac273659d3d45e95b3efc18f41f5c328eacbd7f63800c0bdf5723666e78` |

The 56-lesson / 306-tab compiler-curriculum gate remains pending.
Its coverage differs from the 112 evidence-audited tabs; neither site test
success nor evidence inventory substitutes for compilation of the curriculum.

## Timing observations, not an accepted latency gate

| Measurement | Observation | Limitation |
| --- | --- | --- |
| Node import, five warmups / 30 samples | p50 2.124387 ms; p95 2.910843 ms | The 27-pair retained import only; not browser rendering or hardware performance. |
| Desktop browser import-to-render | 91.1 ms | One sample; not a p95. |
| Emulated-mobile browser import-to-render | 89 ms | One sample; not a real mobile-device result or a p95. |

No new browser latency threshold or performance gate is accepted by these
observations. Node receipt `source-values-metrics-r3`:
`c7d8582ed28c99993b04abddbe83d00c4b91807797d8ef33cf57815f61749f9f`.
The browser samples above come from `site-e2e-r4`, not the earlier focused
metrics run. They measure one import click until both panels are DOM-ready
(including Playwright, FileReader, hashing, validation and React updates), not
paint completion or isolated CPU time. Chromium 151.0.7922.34 ran at
1280 x 720 and an emulated 412 x 839 viewport. Node 22.22.3 measurements used
the host AMD EPYC 9575F CPU, not the GPU.

## Compiler and milestone boundaries

The separate [compiler evidence record](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-source-values-20260922.md)
tracks normal publication, fresh compiler/mirror ladders and selected native
reports. Those results do not make this browser a producer-authentication,
proof, compiler-resume or hardware interface.

This work adds a recorded-source-variable view, not arbitrary locals, dynamic
helper activations, physical register values or a new curriculum release.
Milestone acceptance remains 3 of 18; this phase does not close #280/#281/#282.
Private later inspection/helper-capture drafts are not included in this record.

This dated record and the README clarification were added after the tested
code snapshot above. Publication commit identities and remote-main verification
are recorded in the #281 handoff; no historical capture identity is advanced.
The full curriculum and its compiler publication pin remain pending.
