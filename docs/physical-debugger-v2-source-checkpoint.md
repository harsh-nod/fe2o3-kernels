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
