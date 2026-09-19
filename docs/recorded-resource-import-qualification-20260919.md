# Local resource-import qualification — 2026-09-19

The local paired-JSONL importer was qualified on mi350-2 against unchanged
original resource-query-v6 lines. It is a read-only presentation surface:
caller-supplied/unverified files stay in browser memory; no imported command
is executed. Source, producer, bundle and hardware claims are not authenticated.

## Passed gates

| Gate | Result | Retained receipt SHA-256 |
| --- | --- | --- |
| Site validate r7 | Lint, types, 415 tests and production build passed | `47eded4a55a58181cd59a6afbdbd8ad261f02bb1fd942a52ecf828e0e0f758f1` |
| Evidence r8 | Existing pinned evidence validation passed | `a2ee5db3d157713fb4053ca2c9ede17165df7fa0ac2aa3db1409e685fb106134` |
| Import-scoped r1 | Six desktop/mobile checks passed | `bc47cb470ac623c8c02715adefacb073545295686c86265351c81f4b4d75b3bd` |
| Full E2E r6 | 82 tests passed with two workers | `a4adcacb4c1f42c74a35aa4acfa2f8c7c19f08188cf3680a3877727540237347` |

All four measured the same before/after site census: 503 files, 14,370,615 bytes,
SHA-256 `9969dea9357c25f231452df5691a31fa57de63438e8e2fdabbdb061f0f1be06c`.
Receipts are `logs/phase11-site-{validate-r7,evidence-r8,import-scoped-r1,e2e-r6}.json`
under `/home/harmenon/fe2o3-authoring-280-282.FEW3gj`.
This report was added afterwards; its bytes are not included in that census.

The browser checks exercised original file bytes, keyboard memory selection,
forward/reverse/repeated checkpoint identity, page/raw-pair selection, reset,
replacement failure, cancellation and late-result rejection. Import-time
network activity was empty after the lazy module loaded. Both themes captured
screenshots and passed horizontal-overflow checks on desktop and mobile.
The primary visually inspected the desktop/light result; the automated tests
cover the other layouts. These are not new timing or approved SLO measurements.

Resource limits remain 256 KiB per file, 64 KiB per line, 128 pairs and
32 checkpoints. Existing memory/access projection limits remain unchanged.
Browser output is retained under charged cache; full-suite combined charged
storage stayed below 15.46 GB against the unchanged 20 GiB cap.

## Boundaries

The supported excerpt starts each checkpoint with an independently retained
successful exact active operation-step response. Query responses cannot create
their own anchor. Stale IDs/revisions, mixed configurations/source associations,
range/generation mismatches, duplicate JSON keys and orphan/reused page tokens
refuse the import. Full sessions, errors and unsupported operations are not
silently skipped. Control values are retained but not interpreted.

See [the runnable import walkthrough](recorded-resource-import-v1.md).
No capture schema, curriculum inventory, release pin or maturity label changed.
Physical registers, actual storage reuse/generations, hardware timing and
compilation-resume authority remain unavailable. V2/V3/V5 are not complete.

