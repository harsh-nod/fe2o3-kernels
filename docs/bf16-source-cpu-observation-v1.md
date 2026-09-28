# Observe the actual Rust BF16 graph on the CPU

This is a **compiler-developer qualification tutorial**, not a public tiled CLI.
It follows the unchanged Rust fixture through its live source owner into the
existing CPU engine. The first passing source-CPU gate, R4 on 2026-09-25, checks
a closed exact-integer BF16/F32 profile; it does not execute a GPU kernel.

Compiler implementation: [955d05b09bc0d94a615f4fd20b3071ef1ca559fc](https://github.com/harsh-nod/fe2o3/commit/955d05b09bc0d94a615f4fd20b3071ef1ca559fc).

The [inspection checkpoint](tiled-region-inspection-checkpoint-v1.md) and
[normal continuation](tiled-region-normal-continuation-v1.md) keep their own
historical results. The latter checks ordinary compilation and an inert handoff,
not this numerical execution. This new CPU gate stops after source analysis;
it does not emit or launch a final artifact.

## 1. Begin with the genuine source

Read `crates/rustc-codegen-fe2o3/tests/fixtures/tiled-region-inspection-v1/src/lib.rs`
in the compiler checkout. This is the same 3,950-byte fixture, SHA-256
`fcb26135ad4f931bb8dda63d631639a34dd8461e7801c22a1f6a383e0e735a3e`.
Its arguments are two readonly `&[u16]` inputs, one exclusive
`DisjointSlice<f32, Index1D>` output and a `u32` selector. The direct feature
declares WG64 and `max_grid = [1, 1, 1]`.

The source obtains `WaveLane::<Wave64>::current()`, loads the A/B fragments,
uses `F32AccumulatorFragment::zero(&lane)`, and then executes this excerpt:

~~~rust
let result = matrix
    .multiply_accumulate(lhs, rhs, accumulator)
    .into_values();
if let Some(output) = out.get_mut(thread::index_1d()) {
    *output = result[0];
}
~~~

Only component 0 is stored. This fixture is not a complete GEMM output
implementation, and the qualifier does not add stores for the other components.

The admitted numerical profile is gfx942 BF16/F32 m16n16k16 Wave64:
integral A/B inputs in `[-16, 16]`, integral F32 accumulators of magnitude at
most `2^20`, and positive zero. This source uses an accumulator of zero.
Fractions, negative zero, subnormals, nonfinite values and out-of-domain values
are refused. This is not general BF16 rounding support or gfx950 numerical
qualification.

## 2. Keep the original owner and ledger

Inside the actual rustc callback,
`view.emission().original().executable()` yields the borrowed verified V12
owner. `AdmittedSimulationModuleV1::admit_v12_with_verification_budget`
produces its same-owner CPU view and a retained-storage receipt. That receipt
is reserved on the original materialization `Budget`.

`V12CpuObservationInputV1::new(&typed_owner, &request)` and
`with_v12_cpu_observation_v1` use that owner, request and original ledger.
The engine executes the whole unchanged graph, not a replacement matrix-only
kernel. The observed graph has 8,049 canonical bytes, 20 blocks and 323 operations.
A canonical-file digest, copied JSON or uploaded recording cannot recreate
source authority.

The result callback borrows a
`Result<&SimulationExecutionV1, &SimulationErrorV1>`.
An `Ok(callback_value)` alone is not execution success: the callback must
inspect the borrowed execution result. Its return/error types are
`Copy + 'static`; it cannot return a borrowed execution. The result and
temporary snapshots drop before their prepaid scope is released, including
error and unwind paths. Later compiler phases retain their own accounting;
this is not one compiler-wide meter.

## 3. Run the existing contributor commands

Use a clean compiler checkout of the implementation above, on its supported
Linux contributor setup. Provision `nightly-2026-04-03` with `rustc-dev`,
`rust-src` and the offline dependency cache beforehand. Run from the compiler
repository root, not this site.

~~~bash
BF16_SYSROOT="$(rustup run nightly-2026-04-03 rustc --print sysroot)"
export RUSTC="$BF16_SYSROOT/bin/rustc"
export LD_LIBRARY_PATH="$BF16_SYSROOT/lib"

"$BF16_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p fe2o3-kir-sim --test budgeted_v12_observation

"$BF16_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib \
  gfx942_tiled_region_qualification_v1_tests::observation::cpu \
  -- --nocapture

BF16_CPU_WORK="$(mktemp -d /tmp/fe2o3-bf16-cpu.XXXXXX)"
export FE2O3_TEST_TILED_CPU_OUTPUT_V1="$BF16_CPU_WORK/fresh"

"$BF16_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib \
  production_rustc_driver_v1::gfx942_tiled_region_qualification_v1_tests::observation::cpu::actual_bf16_source_cpu_ladder \
  -- --exact --ignored --nocapture
~~~

The first command checks inert library controls; it is not live-source evidence.
The second runs focused backend controls and skips the ignored entrypoints.
The final command runs the parent ladder with four actual rustc children:
direct execution, wrong source launch, observer error and observer panic.
It compiles a fresh device dependency tree. It invokes no debugger or GPU.

The output directory must not already exist and must be outside the compiler
checkout. Keep failed outputs and use a new `mktemp` parent for each attempt.
Bounds are 300 seconds per child and 1,200 seconds for the original parent,
including rechecks and publication. Cleanup uses the existing bounded
direct-child/process-group helper, not whole-family supervision.

## 4. Compare SSA values with the actual memory sink

The direct child performs six input patterns: zero, identity, dense mixed signs,
positive extrema, negative extrema and exact cancellation. Each runs with
output lengths 64, 13 and 0: **18 positive runs**.

| Observation | What is actually checked |
| --- | --- |
| Matrix SSA | All 256 results: four components in each of 64 lanes |
| Source-authored memory | Component 0 only: 64, 13 or 0 committed stores |
| Output backing | All 272 bytes: 8-byte leading canary, 256-byte payload, 8-byte trailing canary; unwritten tail unchanged |
| Inputs | Both 512-byte input backings remain byte-exact and initialized |

For lane `l` and component `c`, the result corresponds to
`row = 4 * (l / 16) + c`, `column = l % 16`.
The retained `values_row_major_le_hex` contains the actual captured SSA bits;
`output_with_canaries_le_hex` contains the actual output backing.
The independent oracle uses dense signed-integer matrix multiplication and an
integer F32 bit encoder, not the engine's numerical evaluator. Expected data
is an oracle, never a substitute for absent observations.

Even output length 0 requires valid A/B input for all 64 lanes and complete
Matrix execution. An output guard does not excuse an uninitialized input read.
Request backing IDs 11/12/13 are not Engine allocation identities; the capture
checks the actual three distinct allocation identities and the original
Store site, lane-relative offset, width and data.

Full-wave masks must remain lossless. The exact decimal u64 token is
`18446744073709551615`; the 13-lane mask is `8191`. Use an exact integer
decoder or preserve the raw decimal token. Do not coerce these masks through
JavaScript `Number` or a vanilla JSON roundtrip. Allocation IDs and work counters
also require lossless handling; a rendered decimal is not a live handle.

## 5. Read refusals and resource observations correctly

The direct child also runs **16 request refusals**:

- Uninitialized A and B: offset 510, width 2.
- Negative zero A/B, fractional A/B, subnormal A, infinite B and out-of-domain A:
  exact numerical role, lane 63, component 3.
- Step limit, record limit, stopped debug delivery and failing event sink.
- Grid 63, grid 65 and Wave32.

The separate wrong-launch child changes the real source maximum grid to
`[2, 1, 1]` and must refuse before inspection. Observer error and panic
exercise the original callback's cleanup/accounting path, not numerical success.

For RecordLimit and DebugStop, zero DELIVERED Matrix-completion/global-write
observations are asserted. **The engine may continue after delivery stops.**
Missing records do not prove engine cancellation, absence of effects or rollback.
A stopped/incomplete capture cannot become a successful complete observation.

Two source-backed mismatches were fixed before the successful run:
the profile now admits only exact full-Wave64 LaneId using the existing engine;
the call-depth collector excludes the exact zero-argument builtin Trap, matching
the executor's terminating Trap path. Wrong arity, near names and real helper
or recursive calls keep their prior handling. The call-depth cap remains 1.
Fixed-size preflight summaries preserve the real refusal category; do not treat
an unrelated preflight error as an expected numerical refusal.

The facade caps execution at 131,072 steps and 65,536 debug deliveries, with
one WG64, 1,024 operations, 32 blocks, 512 SSA definitions, 16 KiB canonical
bytes, 128 allocations, 4,096 bytes per allocation and 65,536 total memory bytes.
Its 64 MiB resident limit is covered by a 128 MiB logical prepayment including
bounded transient observations. These are logical bounds, **not measured RSS**
or a wall-time promise. Options can lower limits, not raise them.

Default per-attempt work is 141,130,665,200,160 logical units, including the full
`4 * 65536 * 4096 = 2^30` memory term plus other work. The existing `2^54`
ceiling is unchanged. The original source/admission work also consumes it;
no sibling meter resets that budget. Caller request/oracle data and retained
copied summaries are separately prepaid.

In R4, all positive attempts restored storage floor 875,607, with final
source-phase work 4,798,397,636,508,952 and no sticky work/storage denial.
Error and panic paths retained their separately charged 63,600-byte copied
summary while unwinding the original source/materializer. These counters are
observations of that run, not guaranteed future measurements.

## 6. Bind the result to its completed run

Read `direct.cpu-observed.json`, `direct.cpu-accepted.json`, the child's
terminal stdout/stderr and the completed parent `observation.json` together.
The raw file deliberately retains `accepted: false`. The parent rechecks
source/dependency snapshots, the real invocation, actual values and output,
and child completion. A report Boolean, partial/null run or expected-error
substring by itself is not qualification.

The report schema is `fe2o3-gfx942-bf16-source-cpu-observation-v1`.
The first successful R4 evidence is:

- Completed root receipt: 93,791 bytes, SHA-256
  `b7d726d610e312694b1137359c26b588618d77430193f619469dd293f7c2512f`.
- Parent report: 100,796 bytes, SHA-256
  `38a6527d121e4cb9db2555aa8d64a8a29e64907c28e8fceb2e07ae3ad2d196fa`.
- Executed source census: 8,028 files / 115,915,064 bytes /
  `9ff9f2ed9bb8de48f140c1f9ad3de64597666d9a03a532359bff891c4635f351`.

Seventeen preflight tests and six backend controls passed before that parent;
the four actual children are separate from those unit-test counts.
Earlier R1–R3 attempts remain failed evidence. These R4 pins are not automatically
evidence for a later merged tree or publication commit.

Numerical CPU qualification is true only for this bounded source/profile/corpus.
Normal ranked/formal/target handoff and native execution remain false in this
report. Existing runtime bounds/alias obligations from the separate normal
continuation are not discharged by CPU simulation. There is no physical
register capture, gfx950 numerical claim, edited-tile promotion, arbitrary
BF16 support, GPU observation or hardware-performance result here.

Accepted exits remain **M1/V1/V2/U1/U2/U3 (6/18)**; **M2/U4/V4 remain open**.
This lesson changes no global `FE2O3_PIN`, route, lab maturity or source authority.

## Later merged qualification

The separately completed R5 run used the same canonical graph and again passed
18 positives and 16 request refusals, after integration with prepared conditional
Vecadd and the disabled debugger packages. Its 100,796-byte report SHA-256 is
`15e996f1fe49adfeb8d25c1c6fbd0295e51d2e8c83a2547f262b45ca182b3844`.
The merged gate recorded 7,249 passing test executions, zero failures and 286
intentionally ignored entries. Fresh inspection and normal-compilation ladders
also passed, in distinct invocations. R4 evidence above is retained unchanged.

See the [compiler qualification record](https://github.com/harsh-nod/fe2o3/blob/955d05b09bc0d94a615f4fd20b3071ef1ca559fc/docs/bf16-source-cpu-qualification-20260925.md)
for exact run/source pins and the two unchanged repository-wide preflight
failures. This is not a claim of a passing complete generic CI or GPU execution.

For the separate later helper-frame profile, see
[Observe a real Rust BF16 helper across CPU call frames](bf16-helper-source-cpu-observation-v1.md).
Its genuine helper evidence does not rewrite the root-only qualifications above.
