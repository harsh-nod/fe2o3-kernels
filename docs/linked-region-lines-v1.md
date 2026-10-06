# Source lines and a whole linked region

Open **Debugger → Cross-layer inspection → Open whole-region linked lines**.
This independent example consumes a retained CPU-linked M5 observation. It does
not replace or extend the older fourteen-artifact source/native comparison.

1. Select O0, then O3. Both identify the same source byte span at line 7, column 20,
   but their linked-image addresses and ELF file offsets differ.
2. Compare the original line-table row with its intersection with the selected
   three-instruction region. A row extends beyond that region; the display must
   not attribute each surrounding instruction to the authored expression.
3. Expand the source and identity panels. The compiler file identity is not the
   source-content hash. The source, LLVM, sidecar coordinate, canonical KIR
   identity, full ELF, and acceptance record must agree.
4. Interpret the absence: this panel supplies no runtime GPU address, physical
   allocation lifetime, macro/inline stack, live value, or execution permission.

| Case | Region linked VA (half-open) | ELF file offsets | Original line row |
| --- | --- | --- | --- |
| O0 | [0x1a84, 0x1a90) | [2692, 2704) | [0x1a0c, 0x1a9c) |
| O3 | [0x192c, 0x1938) | [2348, 2360) | [0x1900, 0x1958) |

## Exact evidence, not fabricated rows

The separate capsule retains sixteen artifacts: original accepted JSON, exact
source, emitted LLVM, source sidecar, pair export record, native observer report,
and each optimization's complete ELF and four verifier/line stdout/stderr streams.
The four empty stderr files remain explicit EOF duties. Its selected inner pin is
`7f8d78c87c7e191d2185fc5b8bc36d7d000e067800c9bb1392b4e31f323c4db5`.
The inner JSON is 75,504 bytes; all sixteen decoded payloads total 54,763 bytes.

The browser hashes private copies, replays the retained checker against exact ELF
sections/symbols/instruction encodings and line-table intervals, and compares its
complete result with the original accepted record. The UTF-8 source byte span is
also joined to the line/column. That is consistency checking of retained evidence,
not authentication of the producer or reconstruction of historical process
custody. The browser does not execute LLVM, LLD, llvm-dwarfdump, or a GPU program.
It reads retained verifier output; full DWARF verification remains an original
CPU-tool observation. Paths are display-only, never fetched.

The canonical KIR is represented by the exact joined identity in the source
sidecar/pair observation, not by an additional KIR payload. No KIR content replay
is claimed. This edited scenario is distinct from the older comparison's edited
scenario; no match is inferred from the shared label.

## Closed and bounded display

Admission requires the caller-selected capsule digest and exactly sixteen roles
in their defined order. Unknown/duplicate capsule keys, missing duties, malformed
UTF-8/hex, stale hashes, changed source/coordinates, swapped ELF cases, invalid
ELF extents, incomplete line coverage, diagnostic stderr, and mismatched retained
acceptance are refused. Previous rows disappear as soon as input or selected pin
changes; late old completions cannot overwrite the current selection.

The capsule limit is 256 KiB, summed decoded raw payload limit 128 KiB, each ELF
32 KiB, source 128 KiB, and other textual roles/LLVM 64 KiB. The reused checker
has stricter internal limits for some roles (including the 16 KiB sidecar).
The capsule grammar also bounds depth, node/member counts and string sizes.
These are admitted logical input/structure limits, not a browser heap/RSS quota.
O0/O3 are the only cases. Missing WebCrypto means unavailable, never synthetic
substitution. No network, build, load, launch, resume, or source edit is offered.

## Validation after integration

Run the site’s existing normal validation, then its browser tests:

```sh
npm run validate
npm run test:e2e -- e2e/linked-region-lines.spec.ts e2e/authored-register-demand.spec.ts
```

Focused unit files are `tests/linked-region-lines.test.ts` and
`tests/linked-region-lines.test.tsx`. They use genuine retained bytes plus
repinned negative mutations and cover adapter offsets, identities, EOF duties,
geometry, async replacement, unavailable crypto, keyboard selection and
independence from the old comparison. Source authoring itself runs no candidate,
test, compiler, debugger or GPU.
