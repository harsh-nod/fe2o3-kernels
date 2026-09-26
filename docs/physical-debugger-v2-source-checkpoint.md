# Inspect the disabled physical-debugger V2 packages

This is a compiler/debugger contributor tutorial, not a live-debugging command.
The source packages are implemented and CPU/static-qualified; they cannot yet
capture a GPU wave. Keep that distinction when building visualizations.

Compiler implementation: [955d05b09bc0d94a615f4fd20b3071ef1ca559fc](https://github.com/harsh-nod/fe2o3/commit/955d05b09bc0d94a615f4fd20b3071ef1ca559fc).

## What the visualizer can eventually consume

A same-stop V2 record describes either four actual register bytes plus 272
actual output/canary bytes, or typed unavailability. The consumer checks the
real MI thread and frame PC against the producer's stop tuple. Register and
memory bytes stay provisional until currentness and breakpoint-retirement
checks finish. The expected-value oracle never supplies missing sample bytes.

For the fixed contributor fixture, the 272-byte view has two eight-byte
canaries around 64 four-byte lane words. The selected scalar register is s12;
the real producer resolves it using architecture/DWARF register information.
This is not arbitrary register access or a complete physical-memory inspector.
The target's later 4,096-byte backing validation is a separate observation,
not another 4,096-byte debugger capture.

A future UI can display the checked register word, lane-indexed words,
canaries, unavailable reason and exact stop identity. It must label these as
retained observations, not current live handles or resumable source authority.
Unsigned 64-bit selectors must be decoded losslessly, never through JavaScript
Number. Existing recorded CPU views are not evidence that these physical
bytes were captured on hardware.

## 1. Check the separate Rust controller sources

From the compiler checkout pinned above:

~~~bash
cd tools/gfx950-one-stop-controller-v1/physical-v2
node verify-source.mjs
node --test tests/package-files-tests.mjs
cargo test --offline --locked --all-targets
cargo clippy --offline --locked --all-targets -- -D warnings
~~~

Provision the compiler's pinned toolchain and offline dependencies first.
These commands check source selection, parsers and inert transport behavior.
They do not start the controller executable or a debugger. The source checker
does not prove the complete build/dependency/loaded-library closure.

The root qualification passed 22 new Node controls, 58 Rust library tests
and 30 transport tests. The separate historical V1 consumer rejected a full
V2 transcript; V1 may ignore an unfamiliar asynchronous row before ultimately
refusing the incompatible transcript. Do not describe that as immediate
rejection of every unknown row.

The controller's compiled PROFILE is None and runtime bindings are null.
Editing a JSON file or setting an environment variable does not enable it.
This tutorial supplies no command to start it.

## 2. Check the separate GPL producer

The producer remains under its own GPL license and does not become a core
Rust dependency. Its [source contract](https://github.com/harsh-nod/fe2o3/blob/955d05b09bc0d94a615f4fd20b3071ef1ca559fc/tools/rocgdb-one-stop-native-adapters-v1/physical-v2/SOURCE-CONTRACT.md)
pins the exact upstream source and predecessor layers. Start with that exact
disabled R4 source projection. Apply the two listed patches in order to a new
copy, retaining failed attempts and verifying each stage; do not patch an
unrelated debugger installation.

From the compiler checkout, after preparing that exact final source:

~~~bash
DEBUG_SOURCE=/absolute/path/to/the/exact/final/disabled/source
DEBUG_PACKAGE=tools/rocgdb-one-stop-native-adapters-v1/physical-v2

node "$DEBUG_PACKAGE/verify-source.mjs" "$DEBUG_SOURCE" physical-publication-disabled-v2
node --test "$DEBUG_PACKAGE/tests/source-files-tests.mjs"

FE2O3_ROCGDB_TEST_SOURCE="$DEBUG_SOURCE" node --test \
  "$DEBUG_PACKAGE/tests/output-placement-tests.mjs" \
  "$DEBUG_PACKAGE/tests/publication-placement-tests.mjs" \
  "$DEBUG_PACKAGE/tests/initialization-tests.mjs"
~~~

The final verifier checks 60 selected files and 2,162,093 bytes within a
2,112-KiB source-check cap. This is not a complete-checkout attestation or
a native runtime cap. Selection, capture and publication gates must all be
false. The unchanged V1 verifier accepts its own baseline and refuses the
new V2 projection.

Root qualification applied both exact patches to a fresh copy and passed
14 metadata plus 20 source-placement controls. Strict C++17 builds/runs passed
16 formatter, 12 output and four resource groups. The output tests use
/dev/full only to exercise CPU stdio errors; no GPU, debugger or dbgapi call
is involved.

The corrected output path checks the exact MI stdio chain and sticky error
state around one submission and one flush. Failures poison/revoke without
retry. The saved raw stdout member is explicitly initialized. Successful
checked submission does not prove downstream delivery or acceptance.

## 3. Keep source, build and live evidence separate

The separate private R9 debugger build passed full compilation and 53
actual-source/static controls, but that debugger was not executed. Its
selection flag differs from the public all-false projection; its build result
cannot qualify a different source configuration.

Before any real physical observation, the final private source needs a fresh
build and layout checks, exact-build MI2 startup, independent loaded-file
review, a source-bound controller profile and the owned target/family chain.
Attach-before-runtime, actual trap/CWSR/TTMP state, sampling exclusion,
same-client event acknowledgment and timely retirement/EOF/reaping remain
separate prerequisites. A typed unavailable result is useful diagnostics,
not a successful physical-byte observation.

Read the [compiler qualification record](https://github.com/harsh-nod/fe2o3/blob/955d05b09bc0d94a615f4fd20b3071ef1ca559fc/docs/physical-debugger-v2-qualification-20260925.md)
for the exact completed package/build receipt pins and limitations.

This tutorial adds no activation, GPU-observed badge, live UI route or global
FE2O3_PIN change. Accepted exits remain M1/V1/V2/U1/U2/U3 (6/18);
V4 and the full tiled/physical curriculum remain open.

## Later private attempt: startup refusal, not capture (2026-09-26)

A later exact private debugger build passed MI2 startup and loaded-file review.
Its controller and owned process-scope helpers passed separate CPU and benign
process qualifications. Those prerequisites permitted one bounded native
attempt; they did not predict a successful physical observation.

That attempt **failed during debugger setup** with `Changed`. The controller
had spawned its debugger child but had not sent any MI command. Source review
narrows the refusal to child/executable identity, scope membership or exact
argument checks. The retained diagnostic does not identify which check failed.
Do not label it a GPU trap failure or invent a specific startup race.

The controller produced no capture report. Its subsequent empty-report framing
error is secondary to the setup refusal. A missing record cannot be rendered as
zero register values, empty memory, a passed canary check or a captured wave.
The fixed expected-value oracle remains separate from actual sample bytes.

Cleanup must also be read at the correct level. The controller reported
incomplete stream cleanup because the failure occurred before reader startup;
no reader could deliver the required EOF events. Independent inner and outer
scope receipts nevertheless establish that the owned family was reaped and
the exact scope disappeared. Root independently rechecked the three recorded
process identities, retained receipts and file pins. This proves cleanup of
that attempt, **not physical capture success** or host-global absence of GPU
activity. Conservative unknown native-attempt/GPU-dispatch fields stay unknown.

Retained evidence:

- Failed root receipt: 95,650 bytes, SHA-256
  `43199b35fdddcdb93b439ef1396999a502eca6c2d1b9a84d1be1c99ae5fce447`.
- Same-generation wrapper audit: 17,052 bytes, SHA-256
  `9d840563a780e7a17620a3f0e28e37d6dd2d1701013e0dd270f5b6ddd5df555f`.
- Independent root cleanup audit: 1,275 bytes, SHA-256
  `13803ed2bc6e89b6d43ac28304bf1743e1aa628a4df9cb6778842a1781499306`.

The next implementation step is fixed stage/substage diagnostics that preserve
the original refusal and already-observed facts. Missing startup evidence is
not a reason to disable identity checks, increase timeouts or automatically
retry. Any changed controller requires its own source/build/process
qualification. The public package remains disabled; this appendix enables no
capture command, live UI, runtime binding or new milestone acceptance.

## Later readiness attempt: report-publication deadline (2026-09-26)

The [published compiler record](https://github.com/harsh-nod/fe2o3/blob/db351c0df32173d2423235eab2812bac5ccf50a6/docs/physical-debugger-publication-deadline-20260926.md)
records a fresh private attempt after bounded initial command-line readiness
and independently qualified controller/family prerequisites. It failed during
raw-report publication with Deadline and produced zero capture-report bytes.
This does not prove the earlier setup refusal repeated; the original protocol
result was not retained by that publication-error path.

For a visualizer, missing capture bytes must remain unavailable, not zero
registers, an empty memory image or passed canaries. Producer capture and
GPU dispatch remain unknown. A publication failure cannot authorize reuse of
historical bytes under a new stop identity.

Root independently rejoined the complete owned-family cleanup receipts and
terminal acknowledgement, then verified the scope and all five retained
process IDs were absent. The family owner reaped an adopted inferior that the
controller did not claim to reap. This is cleanup, not physical capture or
rollback. The failed attempt was preserved without automatic retry.

Native receipt: 232,123 bytes, SHA-256
`9663f1bad0e4ceff58d9c28fba39d5337756b4fb5ecfc77afb7dfce81e57eeb1`.
Independent cleanup: 699 bytes, SHA-256
`f26693798f4ae476d4c85caf817c20d84df5acd615c181cbaab6671cbe99d2c7`.

The next diagnostic fix retains a bounded failure-only description when normal
publication fails, without resetting the positive deadline, accepting a partial
report or issuing another target command. It still needs separate qualification.
Public capture stays disabled. This adds no live route, activation command,
global compiler pin change or milestone exit; accepted broad exits remain 6/18.

## Later qualified diagnostic: preserve publication failures (2026-09-26)

The [qualified compiler checkpoint e934c1437457efc01c0c311e73026e862943041a](https://github.com/harsh-nod/fe2o3/blob/e934c1437457efc01c0c311e73026e862943041a/docs/physical-debugger-publication-deadline-20260926.md)
adds the failure-only diagnostic proposed above. It passed 141 Rust tests
(58 library and 83 controller), 35 Node controls (31 public-package and four
source-preservation checks), strict package Clippy and build. This is historical
CPU package qualification, not a successful physical capture.

If normal report publication fails, the diagnostic preserves the original
fixed refusal/status, already-retained command/record counts, stream completion
and bounded hexadecimal suffixes. Its fixed 4,096-byte stack buffer permits at
most 4,097 bytes including the line ending, with at most 256 retained bytes
from each stdout/stderr/command suffix. Arbitrary bytes are hex-encoded, not
rendered as terminal control sequences; checked growth has a fixed fallback.

The failure branch performs no new child reads, process queries, hashing,
parsing, debugger commands, spawning or teardown. The successful publication
path, original deadlines, cleanup protocol and public-disabled state are
unchanged. Bounded content is not a global stderr write-latency guarantee.

CPU qualification receipt: 100,865 bytes, SHA-256
`9d48d01aa078c9dd555163ac5ca14e66bc72b4f254d57f7672aba59b39ccd3e6`.
That CPU change alone established no new native attempt or captured bytes.
The earlier attempt's producer capture and GPU dispatch remain unknown;
independent cleanup is still not capture success.

### Fresh bounded attempt: a retained refusal, not a capture

The later [compiler native diagnostic record](https://github.com/harsh-nod/fe2o3/blob/27ba44e2616945481557f4555f67327aabbab043/docs/gfx950-publication-diagnostic-native-observation-20260926.md)
records a separately coordinated single attempt. Normal report publication
again failed with `Deadline` and emitted zero capture-report bytes. This time
the bounded diagnostic retained `original_protocol_result=refused(Incomplete)`.
Its retained stdout suffix includes
`fixed owned one-stop native relation refused (15)`.

This is additional failure evidence, not a diagnosis of the compiler, controller,
debugger or GPU cause. The retained suffix is truncated; a consumed command is
not proof of command completion. Do not infer successful capture from the
relation number, record count or zero-valued unavailable fields. No accepted
physical observation or GPU dispatch success is established; producer capture
and GPU dispatch remain unknown.

Root independently rejoined the owned-family receipts and terminal
acknowledgement, then verified all five retained process IDs and the exact
scope were absent. The family owner reaped the adopted inferior; controller-side
reaping was not claimed. This establishes cleanup of that attempt, not rollback,
physical capture or host-global GPU quiescence.

| Retained artifact | Bytes | SHA-256 |
| --- | --- | --- |
| Failed native receipt | 272,124 | `81e881850e7843dc83ef04b530317c8fd4369a609a991343f06c0bc62d35ba1c` |
| Same-generation terminal audit | 17,437 | `2f21c44121a459e8e54ab54f1ec1c8f9a90ae0b6635393c83075024384317a99` |
| Independent cleanup audit | 670 | `fa609a6bdb32972f5ba695b8b364edff570b063c32cc81f91d5c055522476fea` |
| Retained controller stderr | 2,206 | `dd607bf9ca059ea92e633d563c6c48b5ab197a5bddf91737b05eb068ff00b121` |

Visualizers must retain unavailable state instead of zero-filled registers,
fabricated memory, passed canaries or historical bytes rebound to a new stop
identity. The expected-value oracle never fills missing actual sample bytes.
The next step is source-bound diagnosis of this retained refusal, with fresh
qualification for any implementation change; there is no automatic retry or
public capture activation. This appendix adds no live route, GPU-observed badge
or global compiler pin change. Accepted exits remain
M1/V1/V2/U1/U2/U3 (6/18).
