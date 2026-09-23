# Whole-region origin viewer qualification — 2026-09-23

This records a bounded read-only viewer addition, not completion of V3/M5.
The [viewer guide](ordered-origin-viewer-v1.md) describes its supported fields,
exact consistency checks and unavailable capabilities.

## Qualified behavior

The optional 16 KiB origin importer retains the compiler's whole-region
call-site and expansion spans, macro depth and reported identities. It compares
them with the selected native case without modifying either input. A case,
O0/O3, capsule or file change clears prior metadata and invalidates pending reads.
Duplicate keys, invalid UTF-8, unknown fields and unsupported profiles refuse.

The real source-origin report and the historical native capsule are deliberately
different subjects. All eight native cases refuse this join on desktop and mobile,
even where source-file bytes match. The test independently compares the raw
identities and checks the displayed spans/depth. It also exercises role selection,
invalid replacement, clear/reimport, closing and narrow layouts. No requests
occur during the origin import/selection workflow after the native viewer's
initial lazy application load. Positive join tests use explicitly synthetic
subjects; this batch supplies no positive real origin/native capture.

The existing 14/23-artifact native profiles, capsule bytes, default importer
behavior and compiler inspection format are unchanged. There is no compiler
execution, uploaded-path traversal, hardware observation, source authentication,
proof authority or physical-register lifetime inference.

## Validation

On SSH host `mi350`, against tutorial base
`299f1b824ff7fa92693ad0017d6de611aa7282c3` and compiler base
`d7ad909960cbfa71ab272a73bc2548ab6e5c8d1e`:

- 1,270 Vitest tests in 94 files passed.
- ESLint, TypeScript and the production Vite build passed.
- 21 public-authoring/guarded-body lab controls passed.
- Evidence validation passed: 45 commits, 109 records, 112 source tabs,
  7 local artifacts, 14 getting-started bindings, 23 debugger/simulator artifacts
  and 3 source/ISA characteristic artifacts.
- All 176 Playwright tests passed, desktop and mobile, with two workers,
  retries disabled and no skipped tests. Reported browser duration: 5.0 minutes.

The full gate used Node 22.22.3 and the existing pinned frontend/browser inputs.
Its before/after source census is 746 files, 18,506,302 bytes, SHA-256
`8ca5dc978e0e85280e8ce52bc3836dbf9776668e8c533338de76b2a1b3b67cfb`.
The retained receipt is
`logs/phase28-resume-r3-site-ordered-origin-full-r2/receipt.json`,
28,374 bytes, SHA-256
`3dafb5239069dbb7315a91ebd7900061d928c92f4bf5a35546b189ecb2130aef`.
These task-local receipt paths are not public downloads. This report and final
documentation/one-line test-indentation cleanup postdate that census; final
publication checks are recorded separately in the issue handoff.

The first full run passed all non-browser gates but stopped at the new desktop
network assertion because it included the native viewer's lazy module loads.
The listener was moved after that initial load, before all origin actions;
no request filtering or retry was added. The rerun above passed the complete
suite. The build's existing large-chunk advisory is not a failed lint/build gate.

## Exact real inputs

- Public origin example: 3,036 bytes, SHA-256
  `35ad08b390e5bf30c7ffc0eedbac0dfae58c996bb920b07e597dfa730a4a0f24`.
  Its only framing addition is one final LF; the original 3,035-byte report is
  `ea02e063945404c28615f38049e7656ed5a5b0c9072ca58261742ea80359ee00`.
- Historical native capsule: 1,122,815 bytes, SHA-256
  `366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578`.
  Its independent fixed join remains
  `7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661`.

A future positive real join must produce compatible origin and native observations
from the same fresh subject; labels, equal source text and synthetic unit controls
cannot supply that evidence.
