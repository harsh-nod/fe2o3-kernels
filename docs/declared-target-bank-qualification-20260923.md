# Declared-target LDS actual-browser qualification — 2026-09-23

The [declared-target bank lab](declared-target-bank-lab-v1.md) passed a separate
actual desktop/mobile browser gate over the real local CPU debugger bridge.
This qualifies the bounded same-stop declaration and one-access arithmetic
adapter, not a GPU debugger or hardware bank-conflict detector. It does not
accept V3/V4 or change the original milestone ledger.

The [compiler report](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/declared-target-debugger-20260923.md)
retains the earlier CLI/HTTP checks and their separate histories. The
[September 20 selected-access model qualification](lds-bank-analysis-qualification-20260920.md)
also remains unchanged: its caller-selected target and synthetic/retained
model controls are not retroactively relabeled as this live target-bound gate.

## Actual run and selected inputs

Execution was on SSH host `mi350`. Desktop and mobile ran sequentially with
one worker and zero retries. Each project created a fresh browser session and
a new real CPU debugger child, with 56 POSTs, eight collection groups,
five explicit target queries and 23 DOM snapshots. Both children were observed
and reaped by their exact PID/start identities. Total: 112 POSTs, two sessions,
two debugger children, 46 snapshots.

The browser used the actual 14-module bridge and the frozen post-flush debugger,
not mocked transport or replayed HTTP responses. It reused the retained
ordinary-source `workgroup_reduce_u32` V5 export, grid 128 / workgroup 64 /
scalar 2. It performed no new source export and did not relabel historical
admissions as executions of the newly selected debugger.

The retained paths below are relative to
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr`, not repository files.

| Selected input | Bytes | SHA-256 |
| --- | ---: | --- |
| `target-milestones-phase28-debug-tools-r2/fe2o3-debug` | 61138376 | `41c5075e3de0404f7e18ca1ef0da8c7441adb2527c3a1eba4d45d126b36b84b9` |
| `logs/phase28-observed-source-resident-fix-r1/workgroup-reduce-v5.fe2sim` | 55978 | `170bdbdfe01e3d7b9c44ce72891f4bdf41b68a1602b0602dc7a6a204662a2f7e` |
| `logs/phase28-observed-source-resident-fix-r1/requests/workgroup-reduce.json` | 1427 | `df6cd6378da88695ac179d0be45c8d2429681a1c3dd8d26eab94c767a7c307b9` |
| `logs/phase28-observed-source-resident-fix-r1/receipt.json` | 702370 | `551a826f4ce70923c1e40b56b39ffe043d7a98e1f413a7c07aa6da4c11cc9e2a` |
| `logs/phase28-declared-target-http-workgroup-r1/receipt.json` | 108495 | `bcc18fd7181a13a90f89129d8533193746eb89eeb69a7415fe8e93c29f7c34a7` |

The source receipt and prior HTTP receipt supply independently retained
source/export and target/module expectations. The new browser gate obtains
its own actual runtime/session identities and compares its current replies;
the prior receipt is not a substitute backend.

The site run was based on `429d11e4b6e80914ebd822f1ebe005c20f983c28`.
Its complete before/after source census was unchanged: 770 files,
19,735,408 bytes, SHA-256
`4b442ed35d4fb6930390b664d3cf8543c29d071f638c12c19b4aaa248d833b0d`.
This report and its links were added afterward, not counted in that census.

## What the real browser checked

The selected 256-byte workgroup allocation had allocation/storage-slot/generation
2/2/1, alignment 4, and owning workgroup (0,0,0). The first access page scanned
13 records and returned one committed write without a continuation token.
The exact retained producer was activation 1 / attempt 6 / raw operation site
(function 0, block 5, operation 2), at event 12 and record ordinal 11.
The roster coordinate was function 0 / block ordinal 3 / operation 2; it was
not confused with raw block ID 5.

The write was offset 0, length 4, for full global/local invocation (0,0,0),
workgroup size (64,1,1), workgroup count (2,1,1), launch extent (128,1,1).
The memory view showed little-endian word 2 and an initialization mask with
only its first four byte bits set. The remaining 252 bytes were zero but
uninitialized; this is not a claim that the complete allocation contained
initialized zeros.

The exact target reply was `gfx942:xnack-`, original V5 envelope
`8e6e6e08dbe29622e9f8fcd06ee361ce72a48bb3765502897d0d5a3f5e39f32d`,
subject `22641035e0d5c45462188abd0762af6e9ab9814587bf6996f25d7365e7b8a977`,
and admitted V10 module of 2,681 canonical bytes with SHA-256
`27343d9b962b1afbeb49390b4aa3b2c94a46eee3e8261bf54fb7d0e855773b04`.
Its logical CPU wave width 32 was displayed separately, not used to infer the
target. The browser supplied no target override.

| Check | Actual result |
| --- | --- |
| Assumed allocation-base residue 0 | Exactly bank 0 touched, one dword / four bytes |
| Assumed residue 4 | Exactly bank 1 touched, one dword / four bytes |
| Invalid residue 128 | No grid and no stale preceding footprint |
| Forward / reverse / repeat | Events 13 → 14 → 13 → 14, revisions 3 → 4 → 5 → 6 |
| Selection and control clearing | Range edits, new target reply, step/reverse/repeat, breakpoint removal and disconnect cleared the appropriate previous state |
| Local model changes | Zero HTTP requests; no execution or memory mutation |
| Responsive panel | Bank client/scroll widths agreed: desktop 856/856, mobile 342/342 |

The independent owner checked all four bytes against its arithmetic oracle and
joined the complete DOM selection key, allocation triple, invocation, producer,
target, connection/session and full cursor to the retained real replies.
The event-12 row stayed explicitly historical at later stops; it did not become
an inferred shared native transaction or a claim about the next instruction.
After each control, the four-call inventory and six-call memory collection
remained unchanged. Target readback was a separate explicit command, never
an automatically added seventh collection call.

## Retained receipts and display evidence

| Receipt | Bytes | SHA-256 |
| --- | ---: | --- |
| `logs/phase28-declared-target-browser-r1/receipt.json` | 23512 | `98572d7ee89335576b47726600a0cc965c1bbd41396d7a7ad05685cd98167c34` |
| `logs/phase28-resume-r4-site-declared-target-browser-actual-r1/receipt.json` | 21989 | `ba52da4c883ff8686a6e5879e399da53ac3695daa1105056e25c53b1d4fd010b` |

Artifacts below are under `logs/phase28-declared-target-browser-r1/`.
The owner validated DOM/wire joins and responsive dimensions. Light/dark
images were retained after the credential field was emptied; no visual pixel
review is claimed.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `desktop-observation.json` | 362498 | `02d4e05c1fc40485efe23680893e65832da8b483c74eeaf74bfe5552f7262102` |
| `mobile-observation.json` | 362497 | `310de1e5d72b5e65104260aca58796c78b2d19431877be273f6a32a2b1912173` |
| `desktop-actual-runtime-light.png` | 198982 | `bca352da40721281b424965776677a1c5e05916fbe944b08e15c4e737ef2a2b7` |
| `desktop-actual-runtime-dark.png` | 198799 | `7a0e980722757980268bd249a32a5e888cf830b7962aec5a34daeffa255bb17a` |
| `mobile-actual-runtime-light.png` | 329970 | `a8fe6c3ff7e6f8c24843889a5fed33c31a23db9d0ad27d5ec377e25b9e91ae65` |
| `mobile-actual-runtime-dark.png` | 332835 | `076e41808612f38af149d785e2c95772678879cec780ddb58bc0063e41459fa3` |

The collector observed bounded clones of actual native fetch responses and
joined them to browser request/response metadata; it did not change the
application's original response. The retained HTTP bodies are not original
debugger JSONL bytes, raw network packets or retained authorization headers.

## Boundaries that remain

The selected profile kept the 4,096-byte target-family inner/outer limits,
16 returned rows / 64 scanned records with no automatic continuation, and
one complete modeled access of at most 256 bytes / 65 dwords / 64 banks.
The browser gate allowed at most 100 POSTs per project, 1 MiB per response,
4 MiB retained observation per project and 1 MiB per image; the owner had
a 600-second wall bound. These are parser/profile bounds, not universal
allocator/RSS or escaped-descendant guarantees. Its fresh runner-owned immutable
config/token scope is not a hostile concurrent-file-growth qualification.

This was a stopped early workgroup observation, not complete-kernel output
qualification, all-workgroup coverage, new allocation-reuse qualification or a
loop-source LDS witness. The prior ordinary-source output/guard checks and
runtime reuse gate remain separate. Idle-session expiry and uncertain
mutating-abort behavior were not exercised here.

No physical base address, native lane/issue-phase grouping, hardware bank
observation, conflict/multicast count, GPU timing, performance prediction,
physical register lifetime, source authentication, protected proof authority
or full transitive execution attestation follows. The existing synthetic
target transport controls and earlier 180-test site browser regression retain
their own scopes; these two actual projects do not retroactively change them.
V3/V4 remain unaccepted.
