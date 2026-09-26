# Observe a real Rust BF16 helper across CPU call frames

This is a **compiler-developer qualification tutorial**, not a public authoring
CLI or GPU launch workflow. It follows a genuine Rust helper through source
analysis, retained kernel IR Call/Return, and the existing CPU execution engine.
The completed R19 `compiler-bf16-helper-source-cpu-r1` gate qualifies two
bounded source variants: Identity and Swap01.

Compiler implementation: [b629317dc3288c9393a9a515d60b58535bf5ba2b](https://github.com/harsh-nod/fe2o3/commit/b629317dc3288c9393a9a515d60b58535bf5ba2b).

The earlier [root-only BF16 CPU observation](bf16-source-cpu-observation-v1.md)
remains separate historical evidence. This gate adds a real helper frame; it
does not turn either result into normal compilation or hardware qualification.

## 1. Start with the actual helper fixture

Read the compiler fixture
[`bf16-tile-promotion-v1/src/lib.rs`](https://github.com/harsh-nod/fe2o3/blob/b629317dc3288c9393a9a515d60b58535bf5ba2b/crates/rustc-codegen-fe2o3/tests/fixtures/bf16-tile-promotion-v1/src/lib.rs).
The recorded source is 1,999 bytes, SHA-256
`fdfbc3e66a7aefac5e9d25f9e60c7fb25b8e4daa0fff4db48ee063fe994a76f9`.
It is hand-authored Rust, not source regenerated from a detached recording.

Its source-local helper is:

~~~rust
#[inline(never)]
fn __fe2o3_bf16_tile<'wave>(
    matrix: &DeviceMatrix,
    lhs: Bf16MfmaAFragment<'wave>,
    rhs: Bf16MfmaBFragment<'wave>,
    accumulator: F32AccumulatorFragment<'wave>,
) -> [f32; 4] {
    let values = matrix
        .multiply_accumulate(lhs, rhs, accumulator)
        .into_values();
    #[cfg(feature = "swap01")]
    {
        [values[1], values[0], values[2], values[3]]
    }
    #[cfg(not(feature = "swap01"))]
    {
        [values[0], values[1], values[2], values[3]]
    }
}
~~~

The surrounding kernel obtains a Wave64 lane, loads two row-major 16-by-16
BF16 matrices from readonly `&[u16]` slices, and initializes the F32 accumulator
to zero. It calls the helper and stores only returned component 0:

~~~rust
let result = __fe2o3_bf16_tile(&matrix, lhs, rhs, accumulator);
if let Some(output) = out.get_mut(thread::index_1d()) {
    *output = result[0];
}
~~~

Identity returns components `[0, 1, 2, 3]`; Swap01 returns `[1, 0, 2, 3]`.
Thus Swap01 changes which matrix component reaches the source-authored store.
Neither variant stores an entire GEMM result: the qualifier does not invent
stores for the three other components.

The positive source features require `[64, 1, 1]` threads, the same maximum
workgroup size, and `max_grid = [1, 1, 1]`. The separate `wrong-launch` feature
changes the source maximum grid to `[2, 1, 1]` and must be refused.

The numerical profile remains gfx942 BF16/F32 m16n16k16 Wave64, with integral
A/B values in `[-16, 16]` and this fixture's zero accumulator. This is not
general BF16 rounding, arbitrary helper bodies, or gfx950 numerical support.

## 2. Follow the source-owned graph, not an uploaded recording

The live rustc callback obtains the genuine source relation, including source,
MIR, source-signature and actual rustc FnABI identities. The emitted owner
retains a distinct root and helper, one Call, the helper's MFMA, and four returned
F32 components. Both recorded variants have 8,533 canonical bytes.

The source relation and emission must borrow the same semantic SSA owner.
Verification reconstructs the relation under the original ledger; it does not
accept copied digests as source authority. CPU admission then borrows the
verified executable owner, and observation uses that same graph and ledger.

The helper's logical scalar components are not physical VGPR assignments or
a replacement for its actual Rust ABI. The compiler's closed CPU observer is
not a new source-authoring API. Decoding the report cannot create a source owner,
authorize an LLVM handoff, or launch a kernel.

For implementation detail, the relevant compiler sources are:

- `crates/rustc-codegen-fe2o3/src/production_rustc_driver_v1/gfx942_bf16_call_source_cpu_qualification_v1_tests.rs`:
  genuine-source parent/children and acceptance checks.
- `crates/rustc-codegen-fe2o3/src/production_rustc_driver_v1/gfx942_bf16_call_source_cpu_observation_v1_tests.rs`:
  original-owner admission, numerical attempts and callback accounting.
- `crates/rustc-codegen-fe2o3/src/production_rustc_driver_v1/gfx942_bf16_call_source_cpu_capture_v1_tests.rs`:
  actual frame, SSA and memory observations.
- `crates/rustc-codegen-fe2o3/src/production_rustc_driver_v1/gfx942_tiled_region_cpu_oracle_v1_tests.rs`:
  independent dense integer oracle and finite input corpus.
- `crates/fe2o3-kir-sim/src/budgeted_v12_bf16_call_observation_v1.rs`:
  the distinct bounded two-frame CPU observer; the older root-only profile stays unchanged.

## 3. Reproduce the contributor gate

Use a clean compiler checkout of the implementation above, on its supported
Linux contributor setup. Provision `nightly-2026-04-03` with `rustc-dev`,
`rust-src` and the offline dependency cache first. Run from the compiler
repository root, not this tutorial repository.

~~~bash
BF16_HELPER_SYSROOT="$(rustup run nightly-2026-04-03 rustc --print sysroot)"
export RUSTC="$BF16_HELPER_SYSROOT/bin/rustc"
export LD_LIBRARY_PATH="$BF16_HELPER_SYSROOT/lib"

"$BF16_HELPER_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib gfx942_bf16_call_source_cpu \
  -- --nocapture

BF16_HELPER_WORK="$(mktemp -d /tmp/fe2o3-bf16-helper-cpu.XXXXXX)"
export FE2O3_TEST_BF16_CALL_CPU_OUTPUT_V1="$BF16_HELPER_WORK/fresh"

"$BF16_HELPER_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib \
  production_rustc_driver_v1::gfx942_bf16_call_source_cpu_qualification_v1_tests::actual_bf16_call_source_cpu_ladder \
  -- --exact --ignored --nocapture
~~~

The first command passed four focused controls and intentionally skipped two
ignored entrypoints in the recorded run. It is not live-source qualification.
The second runs the parent, builds one fresh device dependency tree, and starts
five separate actual rustc sessions. Each must reach exactly one source-analysis
callback. No debugger or GPU is invoked.

| Session | Required outcome |
| --- | --- |
| Identity | 18 positive CPU runs, 16 request refusals, then the unchanged normal-route refusal |
| Swap01 | 18 positive CPU runs, 16 request refusals, then the unchanged normal-route refusal |
| Wrong source launch | Refusal before the nominal observation callback |
| Observer error | One completed positive CPU run, then deliberate callback error with accounting preserved |
| Observer panic | One completed positive CPU run, then deliberate callback panic with accounting preserved |

That is 36 positive runs and 32 request refusals across the two qualified source
variants, plus two completed numerical runs inside callback-failure controls.
Those controls are not additional qualified source variants.

The final output directory must not already exist and must be outside the
compiler checkout. Preserve failed outputs and use a new `mktemp` parent for
each attempt. Bounds are 300 seconds per child and 1,200 seconds for the original
parent, including rechecks and publication. Cleanup uses the existing bounded
direct-child/process-group helper, not whole-family supervision.

## 4. Check both frames and the actual output backing

Each variant runs six patterns: zero, identity, dense mixed signs, positive
extrema, negative extrema and exact cancellation. Each uses output lengths
64, 13 and 0, giving 18 positive runs.

| Observation point | Required observation |
| --- | --- |
| After the helper MFMA | Two frames: suspended root at depth 0 and active helper at depth 1; all four F32 components in all 64 lanes |
| After the root Call returns | One active root frame; all four returned components in all 64 lanes, including the selected permutation |
| Source-authored Store | Correct root operation, actual output allocation, 4-byte value, lane-relative offset, and ordering after Call completion |
| Complete output backing | All 272 bytes: 8-byte leading canary, 256-byte payload, 8-byte trailing canary; unwritten payload unchanged |
| Input backings | Both 512-byte inputs remain byte-exact and initialized |

For lane `l` and helper component `c`, the dense matrix coordinate is
`row = 4 * (l / 16) + c`, `column = l % 16`. The caller component selects
the helper component through `[0, 1, 2, 3]` or `[1, 0, 2, 3]`.

The oracle independently multiplies dense signed-integer matrices and encodes
the exact F32 bits using integer arithmetic; it does not execute KIR or call the
engine's matrix evaluator. Every reported helper/caller word is retained only
after the corresponding actual debug scalar's type and bits match that oracle.
Absent, duplicate, truncated or wrong-frame observations fail the capture.

Read `helper_values_row_major_le_hex`,
`caller_values_row_major_le_hex` and `output_with_canaries_le_hex` together.
The output field copies the actual backing after its full byte comparison.
Only 64, 13 or 0 source stores are committed; the canary word is `0x7f123456`.
Even length 0 requires complete helper and caller observations and valid input
reads for all 64 lanes.

The capture also checks three distinct actual engine allocation identities.
Request backing IDs 11/12/13 are not those engine identities. Coordinates and
IDs in this historical report must not be reused as live handles.

Preserve u64 masks losslessly: the full-wave decimal token is
`18446744073709551615`, the 13-lane store mask is `8191`, and the empty store
mask is `0`. Use an exact integer decoder, not JavaScript `Number` or a plain
JSON roundtrip that rounds large integers.

## 5. Understand what failures this catches

Each positive source variant also exercises these 16 negative requests:

- Uninitialized A and B reads at byte offset 510, width 2.
- Negative zero A/B, fractional A/B, subnormal A, infinite B and out-of-domain A;
  numerical refusals must identify the correct operand, lane 63 and component 3.
- A one-step limit, a one-record limit, stopped debug delivery and an event-sink error.
- Grid extents 63 and 65, and Wave32 instead of the required Wave64.

The exact refusal category matters. An unrelated preflight failure does not
satisfy an expected numerical-domain refusal. Every negative restores the
incoming attempt's storage floor and reports no delivered helper/caller
completion or global-write observations.

For record-limit and debug-stop controls, **delivery can stop while the engine
continues**. Missing records do not prove cancellation, no side effects, or
rollback. The bounded observer rejects an incomplete observation rather than
calling it successful execution.

The frame/value/output checks would expose a wrong return permutation, dropped
component, wrong call result, wrong frame, misplaced source store, mismapped
allocation or corrupted output canary for this corpus. These checks are finite
CPU observations, not a proof for every input, an arbitrary-program race
detector, or evidence about hardware scheduling and physical registers.

## 6. Read the resource and compilation boundaries correctly

Source materialization, same-owner reconstruction and CPU observation consume
the original cumulative work/storage ledger. Reconstruction temporarily keeps
the retained owner and its second verification envelope alive together.

The recorded `phase_peak_storage` and `reverification_peak_storage` are both
**1,632,943,151 logical bytes**, below the unchanged 2 GiB limit
(2,147,483,648 bytes). This includes the co-live envelopes for the actual fixture;
it is not an estimate from a small synthetic graph. It is also **not measured
RSS**, a whole-process memory limit, or a wall-time guarantee.

Each numerical attempt restored its incoming storage floor. Before the
normal-consumer handoff, the two positive sessions recorded 816,393,748 logical
bytes, including retained owners and a 94,992-byte copied observation
reservation. This is not post-normal-teardown storage. No sticky work/storage
denial was recorded at that snapshot.
Error and panic sessions dropped their source/emission owners while preserving
the separately charged copied summary and 23-byte callback reservation:
95,015 logical bytes remained. Work charges are cumulative; cleanup does not
reset them. These are observations of this run, not promised future constants.

After successful CPU observation, Identity and Swap01 deliberately continue far
enough to confirm the existing refusal:

~~~text
BF16 nominal source-ranked projection does not yet support checked source-local helpers
~~~

This gate therefore intersects the pipeline after actual Rust analysis and
retained KIR emission, before successful normal ranked/formal/target handoff.
It does not qualify LLVM IR generation, inline-assembly lowering, register
allocation, native compilation or a GPU launch for these helpers. Numerical CPU
success must not be reported as ordinary compilation success.

## 7. Keep the completed evidence together

Read each `CASE.observed.json`, `CASE.accepted.json`, the child's terminal
stdout/stderr and the completed parent `observation.json` together. The raw
observed file deliberately retains `accepted: false`; a completed parent must
recheck the actual invocation, source/dependency snapshots, numerical values,
refusal classes, accounting and child success.

The parent report schema is `fe2o3-test-bf16-call-source-cpu-ladder-v1`.
The first completed R19 run is bound to:

- Root receipt: 28,865 bytes, SHA-256
  `da556f800684969893fc669ba24bcf9481ea3ebe22ed10e36cf4198167104da8`.
- Parent report: 281,023 bytes, SHA-256
  `b353f15ce346e3c8f8e2d0ec2f8d64f3ca4108925c05dd0ff20b3cff32a06a8b`.
- Executed compiler source census: 8,239 files / 118,213,547 bytes /
  `09518d427c19ecdb01986df0427527e1bbfd3b9089786dcc7507f29fc1c7001e`.

The completed gate qualifies emitted-helper and numerical CPU behavior for this
source/profile/corpus. `normal_qualified`, hardware observation, native execution
and artifact/launch authority remain false. Copied inner source snapshots also
remain non-authoritative; their flags must not be rewritten to manufacture a
new qualification.

These historical pins are not automatically evidence for a later merged tree.
This lesson changes no global compiler pin, route, lab maturity, public API or
milestone acceptance by itself.

## Later routing and capability checkpoint (2026-09-26)

The implementation at [123a2c59c759e506215e091162352975a75ca0e7](https://github.com/harsh-nod/fe2o3/commit/123a2c59c759e506215e091162352975a75ca0e7)
adds source-bound nominal helper routing and two capability prerequisites.
This appendix does not rewrite the first R19 qualification above or move the
site's global compiler pin.

The normal defined-call resolver now distinguishes the authenticated tensor
helper from a scalar helper, even when its physical effect set is empty.
The real sparse facts, source call, canonical owner and inventory stay together
under the original ledger. Six whole-route boundary probes and four isolated
custody probes exercise the genuine Identity/Swap01 frontend path. Normal
helper continuation still stops at an explicit incomplete-capability refusal.

Caller authentication (C1) shares the direct-MFMA operand matcher and checks the
original context, A, B and input-accumulator origins. Return association (C3)
keeps the actual caller Call, helper Matrix and helper Return together with
four function-qualified component rows. A transported Return operand need not
have the raw Matrix result's value ID. The returned **[f32; 4] array** does not
acquire accumulator provenance.

The fresh R6 genuine helper report is 281,039 bytes, SHA-256
`424d6190de69162cdb8a01058ca2c17f0d3df22cd616da2956f44101faa2243c`.
It retains 18 numerical positives and 16 request refusals for each source
variant. A lossless comparison with the preceding N2a report found only
83,943,541 additional work units in affected sessions; numerical bytes, masks,
refusals and the 1,632,943,151-byte logical peak were unchanged. The actual
source run qualifies routing and real-facts construction, **not a genuine
combined C1/C2/C3 positive**. The C1/C3 additions separately passed synthetic
origin, mapping and accounting controls within 2,381 backend test executions;
189 ignored tests were not run by that backend command.

Read the [compiler checkpoint and completed receipt pins](https://github.com/harsh-nod/fe2o3/blob/123a2c59c759e506215e091162352975a75ca0e7/docs/bf16-helper-routing-capability-qualification-20260926.md)
before attributing evidence to a source version. Its gates bind their exact
recorded source censuses, not an arbitrary later checkout. The latest genuine
source run preceded C1/C3 integration.

Remaining implementation is metered source-derived preparation, dense
capability propagation and final replay (C2), genuine combined and mutated-source
controls (C4), then ranked custody and formal/target continuation (N3).
Source-level Move operands must be consumed only once after a complete checked
call, and an ordinary array result must not inherit the input accumulator's
capability. LLVM emission, native helper execution and physical register
capture remain unqualified. Accepted broad exits remain
**M1/V1/V2/U1/U2/U3 (6/18)**; this appendix closes no milestone.
