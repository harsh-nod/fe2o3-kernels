# Local whole-region origin comparison

The optional origin importer displays a separate, bounded compiler diagnostic
report beside a selected case in the
[repeat-native viewer](repeat-native-comparison-v1.md). It is a local read-only
view, not a compiler, proof checker, source authenticator or GPU debugger.

See the [dated qualification](ordered-origin-viewer-qualification-20260923.md)
for actual mismatch controls, browser coverage and exact input identities.

## Try the actual retained mismatch

1. Open the source/ISA debugger lab and choose **Open local repeat-native preview**.
2. Select [the retained native capsule](../examples/source_repeat_native_comparison_v1.json).
3. In the selected native case, import
   [the separate origin report](../examples/ordered_program_origin_v1.json).
4. Inspect the mismatch list, whole-region call site, expansion span and actual
   observed macro depth. Switch native case or O0/O3: the origin report clears.

The public origin fixture is the fresh one-copy compiler report followed by one
explicit text-file LF: 3,036 bytes, SHA-256
`35ad08b390e5bf30c7ffc0eedbac0dfae58c996bb920b07e597dfa730a4a0f24`.
Removing exactly that framing LF gives the original report qualified on
2026-09-23: 3,035 bytes, SHA-256
`ea02e063945404c28615f38049e7656ed5a5b0c9072ca58261742ea80359ee00`.
Its canonical KIR identity is
`b25ca769210fea7002cbed1011c4597a3e52c726b081fc1580af6887c70495cb`.
The historical one-copy native case has canonical identity
`243a10974becf41a02bbc07625805eeda634190f52a63e65edf7b924488cc703`.
Although their source-file bytes match, their canonical, semantic, inventory,
preflight and declared source identities do not. **This mismatch is expected;
these captures must not be joined.** The report is also mismatched with the
other seven historical cases.

The report's actual macro depth is 1, its source call site is line 12:18 through 17:6,
and its expansion span is line 285:9 through 291:68. These are whole-region
compiler observations; the display does not infer a filename from either
compiler file identity or assign a span to an individual instruction.
See the [compiler qualification](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/ordered-program-origin-20260923.md)
and [origin-export lab](ordered-program-origin-lab-v1.md).

## Exact joins, explicit limits

A “reported identities match” result requires exact canonical and semantic
identities, source inventory and preflight identities, and all four declared
source IDs. It also checks canonical byte length, target/wave, KIR roster
coordinate/raw block, ordered descriptors and register roles. Matching is
content consistency only: an uploaded report can be fabricated, and no signature,
producer authentication or compiler-execution authentication is supplied.
The positive join controls in the unit suite deliberately use synthetic subjects;
they are not a qualified native capture.

Import accepts one nonempty exact UTF-8 file up to 16 KiB before reading or JSON
allocation. The parser rejects BOMs, invalid Unicode, duplicate or unknown keys,
wrong profiles, invalid spans, substituted availability/authority claims, and
out-of-range fields. There are at most 16 descriptors and 256 observed macro
parents. Existing native capsule profiles and their 14/23-artifact caps are
unchanged. These are import/profile bounds, not a process-memory limit.

Replacing an origin report hides the previous metadata immediately. Refusal,
clear, a native case change (including O0/O3), capsule replacement, or closing
the preview cannot reuse an old asynchronous read. Ordinary case changes also
clear the existing register-role selection. No metadata is automatically fetched,
no compiler file path is followed and no imported data triggers execution.

## What remains unavailable

Fine-step source spans and full macro frames are not retained. A chain digest is
not an expansion tree; descriptor order and repetition count are not expansion
ancestry. This report also leaves source-map identity, compiler-policy identity,
edit epoch, schedule identity, native-artifact binding, physical values and
physical lifetimes unavailable.

This addition does not attach fresh origins to historical native payloads, does
not establish physical register liveness and does not close V3/M5. A positive
real origin/native comparison requires matching captures with the exact shared
bindings, not relabeling this example.
