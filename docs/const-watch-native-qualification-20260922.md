# Const helpers, watch/source replay and final-native comparison: qualification

This 2026-09-22 increment advances the authoring/debugger work tracked in
[compiler #280](https://github.com/harsh-nod/fe2o3/issues/280),
[#281](https://github.com/harsh-nod/fe2o3/issues/281) and
[#282](https://github.com/harsh-nod/fe2o3/issues/282).
It does not close M2, V2/V3/V5 or U2/U4. The accepted milestone count remains
M1/V1/U1, **3/18**. The shared 56-lesson/306-code-tab curriculum remains pending;
its compiler pin, evidence manifest and maturity labels were not changed.

## Shipped author workflow and views

- [Const-u32 helper promotion](const-u32-helper-promotion-v1.md): obtain one
  retained same-block u32 constant from the verified owner, materialize a typed
  Rust helper, edit a concrete specialization and recompile normally. LLVM IR
  remains in the pipeline. A Rust identifier such as v14 is not physical VGPR 14.
- [Watchpoint/source replay](resource-watch-source-replay-v2.md): import seven
  original local files from a real CPU capture. Five moments remain distinct,
  including the uncaptured watch stop and the immediate checkpoint without
  source values. Reverse/repeat source, separate SSA and memory observations
  keep their actual event/revision/lane identities.
- [Final-native comparison](final-native-comparison-v1.md): import the retained
  original Phase19 capsule, compare full default/edited payloads and exact
  selected instruction/descriptor file offsets, and distinguish declared
  VGPR high-water from encoded capacity. This is not GPU execution or ELF decoding.

The two new panels are lazy, local, read-only imports under the existing
source/ISA inspector. They do not run compiler/debugger commands, fetch artifacts,
persist imported data, authenticate a producer or establish protected admission.
Imported byte consistency is not source authenticity.

## Actual artifacts

The watch recording is a fresh Phase20 normal-source CPU capture: 41 full pairs,
the preserved seven-pair watchpoint excerpt, and a disjoint 27-pair source excerpt.
Its original receipt is 22064 bytes with SHA256
`d6d58a1d6acf73921e7b475d8e24fef8eea6ce55a90c0982d30243156fbdb6a1`.
All seven [retained files](../examples/watch-source-replay-v2/README.md) are
byte-identical to their originals; the [provenance](../examples/watch-source-replay-v2/provenance.json)
records original paths, source/bundle and tool-run boundaries.

The native [example capsule](../examples/source_instruction_native_comparison_v1.json)
is 503416 bytes, SHA256
`0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04`.
Its 14 artifacts contain 440737 decoded bytes from the **historical Phase19** join
`5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162`.
The compiler's separate fresh Phase20 native run is not substituted for that
historical capsule.

## Site qualification on mi350

The candidate starts at site base
`e91a2a57aaffc9c4f1104ab4c33ce003e353b7a1`; the base alone does not contain
this increment. Executable validation used recorded dirty source censuses:

| Gate | Source census SHA256 | Result |
| --- | --- | --- |
| Full actual-data site validation | `5fbb7038a6bdffcbc5cb46a03239896ccd18f7a6ac0054e19086ea8b1d0299a1` | 985 Vitest tests in 71 files, 21 Node controls; lint, TypeScript, production build and evidence checks passed |
| Corrected new actual replay browser cases | `55a169dea25d77918913be899083d5d6519795d8de7bc824a246ade51a1ad705` | Four desktop/mobile cases passed |
| Final complete browser suite | `55a169dea25d77918913be899083d5d6519795d8de7bc824a246ade51a1ad705` | 152 desktop/mobile cases passed; zero skipped, unexpected, flaky or retried cases |

The first census has 651 files / 16486602 bytes; the corrected browser census
has 651 files / 16486628 bytes. Their only difference is exact-name matching in
two new test locators. Subsequent qualification/crosslink/provenance edits are
documentation metadata, separately censused for publication, not a claim that
the earlier executable tests ran against future documentation bytes.

The complete validation receipt is 44043 bytes, SHA256
`e26a96c4b014a4a5b510ceca8a47a6edda43e65af7e4020823404b982cc2e0f2`.
The focused corrected browser receipt is 45501 bytes,
`39fce8d53f6e71ad82da32ac2698201a797de39bece0a06f0d8add4ff043be8d`.
Final full-browser receipt: 49554 bytes, SHA256
`7483dc75afe8f60cb17e2373a031fbcbb401e8f361fde757a522f2dad76ee633`.

Actual-data tests fail on missing or changed fixtures rather than replacing them
with generated positives. Browser checks cover five moments, exact original JSONL,
source/SSA separation, reverse/repeat memory, keyboard navigation, replacement/reset,
no new network/storage activity, both themes and bounded desktop/mobile layout.
The desktop light/dark source screenshots were visually inspected. They show
readable source tables and explicit unavailable values; the tall element captures
include the existing sticky application header. Mobile layout is checked by
browser geometry/assertions, not claimed as a separate manual visual audit.
A successful browser run does not establish general accessibility compliance.

The new importer copies all seven primitive input strings synchronously before
awaiting digests. Deferred-hash regression tests ensure caller replacement/deletion
cannot change what was validated. Existing resource/watchpoint/source importers
and their original profiles are unchanged.

## Compiler qualification and limits

The [companion compiler record](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-const-watch-native-20260922.md)
contains the exact source/tool/native pins and retained failures. Each fork passed
145 authoring tests, five const-helper source exports, 169 stages and 150 complete
CPU result/canary checks. Backend regressions passed 1711 canonical / 1710 mirror
tests, with 110 ignored each. Authoring library/CLI strict Clippy and formatting
passed; this is not a claim that all backend lint is clean.

A separate fresh instruction-edit ladder passed 100 stages / 90 CPU checks.
The portable native observer built with explicit unchanged external worker sources
and reviewed static LLVM/LLD components; all four default/edit O0/O3 objects joined
to exact source/LLVM evidence. Twelve configure-only refusal controls preserved
the original inputs. No native execution, hardware result, physical helper ABI,
general control/memory/matrix closure or protected proof admission is claimed.

## Retained failures

All failed attempts remain in the task workspace. In particular, the first new
actual browser run retained 148 passes and four failures: substring radio matching
ambiguously selected both later and repeated-later labels. The test now uses the
exact accessible name. The focused and final suite reruns use new output paths;
the failed receipt `54753da93c4455bcb1d7ae35b7baca02822d5ec01157f898cb3615c46e2f311a`
was not overwritten. Earlier failures and their corrections include a test-only
readonly TypeScript deletion and the native capsule exporter's prototype-only
object equality check; neither weakened production admission.

The task envelope is 112 GiB total retained storage, at least 40 GiB free disk,
64 GiB available RAM, serialized gates, two build jobs, pinned tools and bounded
commands. It is sampled task supervision, not hard process-memory enforcement
or complete transitive toolchain attestation.

Allocation lifecycle/reuse, dynamic activation identity, same-fault terminal values,
physical registers and whole-kernel correctness remain explicit gaps.
