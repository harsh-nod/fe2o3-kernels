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

## Preserved peer main and composite rerun

Publication precheck detected newer site main `b829beaaf52fe99fbaabc97a1b0fcb1c0bbaffe2`.
It was normally merged, preserving the peer's first-fill complete-source
binding and curriculum-contract pin. Composite code commit
`510dcb8396cdc5a267a62035219e60102ca8be90` then passed 32 focused controls,
lint/types/build, **390 unit tests**, existing evidence validation and
**72 desktop/mobile browser tests**. Their unchanged input census was 488 files,
14,204,002 bytes, SHA-256
`b94cf1bcebe485855a11b98e05f74ac29c09f5b01455f4187b555a56e4f26f43`.
This paragraph is a later evidence-only update, outside that fingerprint.

The first composite evidence run refused because its newly pinned compiler
object was absent locally. Fetching exact public commit
`1c0e99b1405896a8d0a5792bba0f592c9584a04c` and checking its required tree
`ec1eb25df2acd00e51473bd5dab7f17c84daa2ac` resolved that setup failure.
The peer pin and all validation predicates were preserved. The failed gate is
retained separately; it is not reported as a passed test.

## Peer deployment revert and final composite

A second publication precheck detected the peer's deliberate reverts
`0e7b18d` and `7014d7e`: the new curriculum pin was not on compiler main and
therefore did not meet the deployed site's publication gate. Those reverts were
normally merged as `1cb78140ffed6f4c702c818d59dad5a3838bd6e7`. The original
curriculum source contract remains intact; none of the navigation implementation
or its actual capture was reverted.

The final composite rerun passes **32 focused controls, 388 unit tests,
lint/types/build, evidence validation and 72 desktop/mobile browser tests**.
The four gates retain identical before/after input census: 488 files,
14,204,143 bytes, SHA-256
`2978fbe096f77faa9fe119f956a270e731a05fce0fbd1d52e8699f202c467346`.
Aggregate command times are 195 / 32,652 / 6,000 / 46,763 ms respectively,
not performance percentiles. This evidence-only appendix follows those runs.
Both intervening failed publication prechecks occurred before any push; no
force push or validation relaxation was used.
