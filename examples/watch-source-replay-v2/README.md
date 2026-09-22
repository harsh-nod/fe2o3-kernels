# Actual watchpoint/source replay recording

These seven files are original outputs from the fresh CPU-only R2 capture on
`mi350`, 2026-09-22. They are not generated browser fixtures. Preserve their exact
bytes, request IDs and LF endings. See [provenance.json](provenance.json) for all
seven byte counts and SHA-256 pins, and [the tutorial](../../docs/resource-watch-source-replay-v2.md).

The original capture is
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr/logs/phase20-watch-source-capture-actual-r1`.
Its 22,064-byte receipt SHA-256 is
`d6d58a1d6acf73921e7b475d8e24fef8eea6ce55a90c0982d30243156fbdb6a1`.
The separate passed supervisor receipt is `logs/phase20-watch-source-capture-r1/receipt.json`,
36,572 bytes, SHA-256
`1d69ab267ecd033a76789d0058c6db11854abf4d65c04f692e8b3629d92977b9`.
Compiler base `bcb4dbb77cd4d944feec1d215c4b2963f6fabb73` plus the observed source
census of 6,561 files / 99,789,345 bytes,
`e1d48a1a29dc3c44e1746deae2db4032ede02ae330017284ab3378e0ab1fdaa6`,
identifies the actual dirty candidate used; the base commit alone does not.

## What was observed

The full session contains 41 original pairs. The unchanged watchpoint excerpt has
seven pairs; the successful source excerpt has 27. Their request-ID sets are disjoint;
the receipt and complete original session establish the presentation join.

| Moment | Request | Event / revision | Scope | Source rows | SSA rows |
| --- | --- | --- | --- | --- | --- |
| Exact watch stop | 5 | 32 / 3 | Uncaptured | Unavailable (query 6) | Unavailable |
| Immediate post-write | 7 | 33 / 4 | lane 0 | Unavailable (query 9) | 18 |
| Later, before next invocation's first operation | 11 | 34 / 5 | lane 1 | 12 | 3 |
| Reverse, before lane-0 store | 21 | 31 / 6 | lane 0 | 12 | 18 |
| Repeated later point | 32 | 34 / 7 | lane 1 | 12 | 3 |

The immediate checkpoint has one frame but no `next_operation`; it is captured for
SSA/memory, not queryable for source variables. Both source refusals are original
`checkpoint_not_captured` responses. No adjacent state is substituted at either stop.

Each successful source query has six complete pages of two rows. Only parameters
`a` and `b` are represented scalar values (generation 1). The ten remaining named
bindings, including `out`, `result` and intermediates, remain generation-0
`not_represented`. Equal bits in the separate SSA table do not establish a mapping.

Forward count 1 reaches lane 1; reverse count 2 reaches lane 0 before the store;
forward count 2 repeats lane 1 at a new revision. The 24-byte global window changes
from first-word `d5 01 00 00` back to its `a5` prefill and then repeats the first
write. The remaining three words and eight-byte `deadbeefcafebabe` canary are
unchanged at those intermediate checkpoints. Lane-1 scope does not mean lane 1 wrote
the displayed bytes. A separate full CPU simulation verified all four final words
equal 469 and the canary was preserved.

The session also retains original `invalid_cursor` (request 20),
`stale_revision` (30), and `invalid_cursor` (31) refusals with unchanged sessions.
The browser does not execute any of these requests.

## Qualification boundary

Capture and actual-data site qualification passed: 985 Vitest tests, 21 Node
controls and 152 desktop/mobile browser cases, with no skipped, unexpected, flaky
or retried browser cases. Desktop light/dark source screenshots were inspected;
mobile layout was checked by browser assertions. The
[exact validation record](../../docs/const-watch-native-qualification-20260922.md)
keeps tested source censuses, receipt pins and retained failures separate.

The panel treats every imported file as caller-supplied/unverified. These recorded
pins are reproducibility evidence, not source authentication, production proof
admission, hardware evidence, performance prediction, allocation lifetime/reuse,
or dynamic activation identity. Frame 1 is static depth; occurrence 1 is not a
cross-invocation counter. The panel imports neither the referenced source/tools nor
stage-output artifacts, so it does not independently authenticate those receipt claims.
