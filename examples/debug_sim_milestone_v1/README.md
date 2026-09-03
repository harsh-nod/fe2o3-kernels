# Debugger and simulator milestone V1

This directory contains exact, bounded outputs consumed by the CPU semantic
simulation lesson. The website never synthesizes a debugger receipt in the
browser. Its content validator admits these closed schemas and the evidence
gate checks the whole-file digests below.

The artifacts were regenerated from compiler commit
`db36030a9605465082c696210ccb71b1195a6b5f`, tree
`4c8228139562148b34531439b658a2805028066f`. The race, fence, and wave inputs are exact canonical KIR V7 documents emitted
with `VerifiedCanonicalKernelIrV7::from_module` from the generalized builders
exercised in `crates/fe2o3-kir-sim-cli/tests/command.rs` and
`crates/fe2o3-kir-sim/tests/simulation.rs`. They begin at KIR and have no source
association. `no_race.kir` and its request are the checked-in `fill-v1` CLI
fixture. These inputs are not evidence that ordinary Rust produced the bytes.

The additive portable workgroup-reduction walkthrough is pinned separately to
compiler commit `9176b9c27696ac3c86814dea60ef9ecc12f10539`, tree
`780acf707a4d83658a2a94a575c18e707e5a7214`. Its exact multi-root semantic
custody comes from the preceding commit
`e55a0117d76866b66f8ca5d157c9e03e0c69bbb6`, tree
`6be940b7574ba5f9a0ab49ea9d866b5c26fe2d3c`. The production regression exports
ordinary attributed Rust `u32`, `i32`, and `f32` reductions into Bundle V5,
executes their same-module KIR V10 bodies through both `fe2o3-debug` and
`SimRuntimeBackendV1`, and checks all 64 output lanes. The checked-in
`workgroup_reduce_queries_v1.jsonl` is the exact bounded five-request sequence
used to inspect the completed workgroup, logical wave, memory events, and
operation events. It is an input fixture, not a retained debugger response.

`debug_scalar_v2.fe2sim` is different: it is the exact binary produced by the
production ordinary Rust -> semantic MIR -> ranked PLIRON -> KIR exporter with
`--bundle-version 2`. `debug_scalar_source_map_v2.json` is the verified embedded
map, extracted through `VerifiedSimulationBundleV2`; it is not a hand-authored
map. `debug_scalar_source_variables_v2.jsonl` is the exact `fe2o3-debug` response
from stepping and querying that same bundle on the CPU simulator. The exporter
receipt binds the bundle subject and states that compiler, hardware, load,
launch, proof, and artifact authority are false.

Run the production CLI from the pinned compiler checkout:

```bash
cargo +nightly-2026-04-03 build --locked \
  -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim \
  -p fe2o3-semantic-import --bin fe2o3-trace-import \
  -p fe2o3-semantic-query --bin fe2o3-pc-sample-query \
  -p fe2o3-debug-cli --bin fe2o3-debug \
  -p rustc-codegen-fe2o3 --bin fe2o3-export-sim \
  -p rustc-codegen-fe2o3 --bin fe2o3-rustc-extract

SIM=./target/debug/fe2o3-kir-sim
IMPORT=./target/debug/fe2o3-trace-import
PC_QUERY=./target/debug/fe2o3-pc-sample-query
DEBUG=./target/debug/fe2o3-debug
EXPORT=./target/debug/fe2o3-export-sim

"$EXPORT" \
  --crate fe2o3_production_ranked_bounds_fixture \
  --output debug_scalar_v2.fe2sim \
  --target gfx942 --bundle-version 2 \
  --target-dir ./target/debug-scalar-export -- \
  --package fe2o3-production-ranked-bounds-fixture \
  --features debug_scalar --lib

printf '%s\n%s\n' \
  '{"operation":"step","schema":"fe2o3-debug-request-v1","request_id":1,"expected_revision":0,"direction":"forward","granularity":"operation","count":1}' \
  '{"operation":"inspect_source_variables","schema":"fe2o3-debug-source-variable-request-v2","request_id":2,"expected_revision":1,"scope":{"level":"dispatch"},"frame":1,"selector":{"selector":"all"},"page":{"limit":64}}' \
  | "$DEBUG" sim --bundle-v2 debug_scalar_v2.fe2sim \
      --request debug_scalar_request_v1.json \
      --protocol jsonl --wave-width 64 \
  > debug_scalar_source_variables_v2.jsonl

"$SIM" \
  --kir-v7 race.kir \
  --request conflict_request.json \
  --explore-seeded-schedules 3 \
  --schedule-seed 41 \
  --schedule-max-decisions 16 \
  --exploration-max-retained-decisions 16 \
  --output exploration_race_v1.json

"$SIM" \
  --kir-v7 race.kir \
  --request conflict_request.json \
  --replay-schedule race_replay_schedule_v1.json \
  --race-evidence \
  --output race_replay_result_v1.json

"$IMPORT" rocprofv3-counter-capture \
  --kir-sha256 0101010101010101010101010101010101010101010101010101010101010101 \
  --kir-len 97 --wave-width 64 \
  < rocprofv3_1_1_counter_collection.json > counter_capture_v2.json

"$IMPORT" rocprofv3-pc-sample-capture \
  --kir-sha256 0101010101010101010101010101010101010101010101010101010101010101 \
  --kir-len 97 --wave-width 64 --sampling-interval-cycles 1048576 \
  < rocprofv3_1_1_stochastic_pc_sampling.json > pc_sample_capture_v3.json

"$PC_QUERY" open \
  < pc_sample_capture_v3.json > pc_sample_open_v3.json
"$PC_QUERY" list-samples --limit 2 \
  < pc_sample_capture_v3.json > pc_sample_page_v3.json
"$PC_QUERY" pc-hotspots --limit 8 \
  < pc_sample_capture_v3.json > pc_hotspots_v3.json
"$PC_QUERY" capabilities \
  < pc_sample_capture_v3.json > pc_capabilities_v3.json
```

From the newer workgroup-reduction compiler checkout, run the complete
ordinary-source production regression:

```bash
cargo +nightly-2026-04-03 test --locked \
  -p rustc-codegen-fe2o3 \
  --test production_ranked_bounds_driver_v1 \
  ordinary_rust_workgroup_reductions_export_v5_and_execute_every_cpu_path \
  -- --ignored --exact
```

That regression checks the exact results `u32(2) -> 128`, `i32(-3) -> -192`,
and `f32(1.5) -> 96.0` (`0x42c00000`) in every lane, plus canonical and seeded
schedules, persisted Bundle V5 replay, the normal virtual runtime adapter, and
typed rejection of a substituted bundle or `[32, 1, 1]` roster. The tutorial's
five JSONL requests can then be piped into `fe2o3-debug sim --bundle-v5` for the
exported `workgroup_reduce_u32` bundle.

This is differentiated from a text log by exact, machine-queryable custody:
each retained site is qualified by correspondence owner, semantic function,
role, symbol, and absolute KIR ordinal. At public compiler commit
`2df6130c5f897b5120cdf6ade44d53030690fa8b`, tree
`1ddc7aec95db753ab54ff472e9457b0e6609d0f6`, an owner-qualified occurrence
sidecar distinguishes shared-helper instances while preserving one physical
KIR helper node. Source Map V2 and independent finalizer replay reject
ambiguous, reordered, or substituted associations. A persisted
schedule binds the Bundle V5 subject and body as well as request, target,
limits, context, transcript, and runnable decisions, so an agent gets a typed
binding error rather than silently replaying against different code. The
ordinary protected-production proof still requires external verifier and
rust-src inputs that were not provisioned for this milestone.

`workgroup_scan_matrix_v1.json` is a tutorial evidence index, not a protocol
capture. It transcribes exact oracles and boundaries from the pinned public
tests while preserving the distinction among six ordinary Rust API compile
contracts, three attributed production kernel representatives, six direct KIR
V10 semantic simulations, and zero retained ordinary scan Bundle executions.
The semantic tests cover inclusive and exclusive `u32`, `i32`, and strict
`f32` under canonical, seed `0x5ca1`, and exact replay schedules. A separate
seed `0xd38` debugger test retains logical coordinates, exact KIR sites, typed
LDS accesses, barrier phase and eight participants, schedule identity, and
decision ordinal. Semantic Trace V2 additively admits exact canonical KIR V9
or V10 after independent adapter validation; Trace V1 stays exact KIR V7 and
the two envelopes do not cross-decode.

The repeated `01` KIR digest is a declared test binding, not authenticated
source, ISA, or hardware correlation. Counter and PC inputs are exact structured
rocprofv3 regression fixtures, not live tutorial measurements. PC timestamps
remain opaque collector ticks, loss is unknown, execution masks do not prove
per-lane sampled-instruction execution, and hotspot counts are inferred sample
groupings rather than instruction counts or time attribution.

Source Map V2 is intentionally conservative. Only unchanged parameters with an
exact one-to-one KIR binding are captured. The example exposes `value` as exact
FP32 bits and `input` as an allocation-relative pointer; `output`, `element`,
and `_input_extent` remain typed `not_represented`. It does not expose native
addresses or claim source-to-KIR refinement, compiler authentication, hardware
replay, performance prediction, or CPU support for every kernel.

The workgroup milestone is also CPU semantic evidence only. It does not observe
GPU workgroups, waves, timing, or performance; it does not add performance
prediction or prove all schedules. Explicit active-mask operations and
unsupported pointer, enum, needs-drop, adjusted, and complex-cast shapes remain
typed unavailable.

| Artifact | SHA-256 |
| --- | --- |
| `exploration_race_v1.json` | `17c625d55de788311500dd3185fe796c1e318111d4b871ac571106d6c1c1085a` |
| `exploration_no_race_v1.json` | `1c04b7ba45a9988fc71dd9d32ec28c94966361be775acf5adc057857f8f22732` |
| `exploration_incomplete_v1.json` | `48e3a401f3512013318abed932b903834e75d43be244231e4f0d0fbc7f1212ba` |
| `race_replay_schedule_v1.json` | `28f9d9776509701316cfcd5d5e751f5ce7f8885cb49c4294b29f1d126eae313d` |
| `race_replay_result_v1.json` | `5ff1433e20e9e204c7c847845779cf0955a7be19fc38f7160d7acdd7016dd9c9` |
| `wave32_collectives_result_v1.json` | `ec856159689ad4aa2672587be7005965fa76216f7e3adf140a50e54f01c00334` |
| `wave64_collectives_result_v1.json` | `8cd9fcddf8835683093f5bd6e39bfbd7a2b2871665f069f635634841adc56305` |
| `partial_wave32_error_v1.json` | `2c628028033d57cfcdf0802d838aab999d7f68d9939975cdfe5840b1f66d5388` |
| `partial_wave64_error_v1.json` | `18d8c638646f0a89a9060f020dfafdd110ca16e03392f0bb06d7cf7aa16f0ecb` |
| `counter_capture_v2.json` | `1f2e723df8b213c111461cafd05b28697216e8b0daecca439de04c1329e17799` |
| `debug_scalar_v2.fe2sim` | `bff1002631396413057ca42b1bca59874ba66bd919422bfa581381aa9b971b8e` |
| `debug_scalar_export_receipt_v2.txt` | `a5f560a1f19e04c80e50c65df5972fb529d473cb7fee7b947fd548aad9e5bc00` |
| `debug_scalar_request_v1.json` | `473aa538acbfa3a28f5319acb3672402379d3d3216026d8341bebb3d87d8f35f` |
| `debug_scalar_source_map_v2.json` | `1edf534631d7d52dedc892f5c3a2275d987f19590791942dc7bbe51aa430262a` |
| `debug_scalar_source_variables_v2.jsonl` | `4624cb972baee136553b54d347483c15314df841f79730f5c9554e6d0a18d658` |
| `pc_sample_capture_v3.json` | `c6bf5099ea7fd4f6c2a4d7660fbec9198f9ea53f45d14462edd61022450bf2a4` |
| `pc_sample_open_v3.json` | `5a16c04424cc4b539d051464c29507b0c431dc26e94b2634296fd9807b472360` |
| `pc_sample_page_v3.json` | `30ac9350588adba6a6a02982233d1ac392c93548a53ed803b0b662b2000c6e09` |
| `pc_hotspots_v3.json` | `113d6df2e0e9a5d74a2f3a3dcbbf7f7aac3ab23aeee04e9c02aad6e5323a512c` |
| `pc_capabilities_v3.json` | `a1a4b3819815b4879c2fc1b8eccf1c28f967d83784356131ba40ff93739736ed` |
| `workgroup_reduce_queries_v1.jsonl` | `3426bc52547f2989d5b9476552dda58759800cb5364075a3a967a88e730f4410` |
| `workgroup_scan_matrix_v1.json` | `ef1eec8c96f26f8ad3bf6327ffb405c1c5f8748b2e6d6b63899f78e7ffc33736` |
