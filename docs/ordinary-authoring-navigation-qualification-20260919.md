# Ordinary-source navigation qualification — 2026-09-19 UTC

This record covers #282 U1's bounded read/select/view exit, not source editing,
complete stage coverage, compilation from a snapshot, or the whole umbrella.
One real ordinary Rust kernel can be navigated between retained source and KIR;
the exact selected structural boundary is retained. Missing stages, source
insertion ownership and physical resources remain explicitly unavailable.

## Actual compiler capture

The source runner passed on clean compiler commit
`70b3fe0057e18e16eaa568301d2743b1ca6c252a`, now published on both compiler
repositories' main branches. Its before/after full tracked/untracked input
census was unchanged: 5,838 files, 90,347,980 bytes, SHA-256
`8ca5122a57e848c63350e83abcac24822e796a16fe501103e650d35ddc69ebd4`.
The exact selected nightly commit is
`55e86c996809902e8bbad512cfb4d2c18be446d9`.

The fresh ordinary source export completed in 23,605 ms. Independent existing
headless inspect/operations/select calls took 11/8/8 ms in this one run; these
are single-run observations, not warmed percentiles or performance promises.
Compiler-side capture/parser/process controls pass 34 tests.

The same-run diagnostic census binds the retained original bytes to the
source-file domain identity used by the operation spans. Twelve actual KIR V11
operations are retained. Bytes325..334 (`low | 256`) map to the separate
constant0:0:3 and OR0:0:4 occurrences. Only the OR has a retained selection:
u32 live-ins14/15, live-out16, complete empty local-memory effects, with traps
and convergence still not analyzed. Semantic MIR is identity-only.

Private capture SHA-256:
`14d3f430b9d6a394de4874d02142c33c1edc29e4ba8fa338f8c424fd85aa0556`.
The 18,050-byte [display projection](../examples/ordinary_authoring_navigation_v1.json)
has SHA-256
`957b7a0ece3aaea5e474c3124bced44e28a73b616e8cddd0e663a8fa7380d6c1`.
It contains observations, not an executable bundle or authenticated owner.

## Viewer and validation

The existing cross-layer inspection page lazily opens the read-only component.
It does not combine this real source capture with the separate synthetic
Characteristic archive or borrow missing LLVM/ISA data from another example.
Range selection lists all overlapping occurrences; exact operation selection
highlights its retained source ranges. No click edits, recompiles or launches.
New inputs hide old state immediately, including late asynchronous projections.

Before/after website implementation-and-tutorial input census for every gate:
487 files, 14,199,016 bytes, SHA-256
`3e360ca32deab154d92f35b8a4cd1570b086b8404968e4902728af0f9503014e`.
This evidence-only Markdown record was added afterward; it is not included in
that fingerprint.

- Focused projection controls: **32 passed**, including the real capture,
  synthetic ambiguity, stale identity, target, malformed/pin/byte bounds and
  unavailable-input cases; 179 ms aggregate command.
- Full site validation: lint, TypeScript, **388 unit tests**, and production
  build passed; 32,061 ms aggregate command.
- Existing evidence validation passed; 5,984 ms.
- Full desktop/mobile browser suite: **72 passed**; 47,624 ms aggregate command.
  Actual and synthetic cases remain separately labelled. Both themes preserve
  keyboard selection and no horizontal overflow. Desktop-light/mobile-dark
  actual-view screenshots were manually inspected.

All gates ran on mi350-2. Combined task caches and callback outputs stayed below
20 GiB with 40 GiB disk and 64 GiB available-RAM floors. No hardware execution
occurred. Renderer memory/load/interaction percentiles are not inferred from
functional suite times. Broader V0 budget review and V2/V3/U2/U3/U4 work remain
separate; the main curriculum pin, required lesson inventory and maturity labels
are unchanged.

See the [navigation tutorial](ordinary-authoring-navigation-v1.md) for commands,
byte pins and data boundaries. This establishes the implemented U1 exit only;
it does not supply the remaining M0/V0/U0 owner agreements or close #282.
