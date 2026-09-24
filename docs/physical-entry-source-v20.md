# Lab: author the complete physical instruction body

This experimental lesson is tied to compiler commit
[90de8eaf2ef445e0d470793fb2a74169eec9175b](https://github.com/harsh-nod/fe2o3/commit/90de8eaf2ef445e0d470793fb2a74169eec9175b),
not the site's older curriculum baseline. It does not change FE2O3_PIN,
maturity labels or the accepted milestone ledger.

Start with [the complete scalar-fill source](../examples/physical-entry-v20.rs).
Unlike the [scalar-helper lesson](source-helper-native-v30.md), v(8) really
selects a physical VGPR. The author also supplies kernarg loads, index and
pointer arithmetic, carry, bounds masking, store, waits, EXEC restoration and
termination. The fixture fills output with a; it is not a two-buffer copy.

## 1. Export from actual Rust source

In the matching compiler checkout, build its public extraction wrapper/backend
with pinned nightly-2026-04-03. Use fresh absolute output directories:

```sh
export RUSTC=/absolute/pinned/nightly/bin/rustc
export FE2O3_PHYSICAL_ENTRY_BIN_DIR_V20=/absolute/build/debug
node scripts/physical-entry-source-v20.mjs one /absolute/new-one
node scripts/physical-entry-source-v20.mjs diamond /absolute/new-diamond
node scripts/physical-entry-source-v20.mjs registers /absolute/new-registers
```

These commands were observed through actual Cargo and the public rustc wrapper.
They export canonical-v20.bin, canonical.ll and native-observation-input-v20.txt.
They do not invoke a native compiler, GPU or CPU simulator. The exact fixture
source is retained in the compiler's production-extraction-device test package;
the linked example is its unchanged one-body function without feature gating.

The declared profile is gfx942:xnack-, Wave64, workgroup [64,1,1], maximum grid
[2,1,1], at most four blocks, 64 native instructions and 73 source occurrences.
Rust owns five logical arguments. The ordinary LLVM function owns six ABI
slots: output pointer/length and a/b/c/selector. Its explicit kernarg extent
is 32 bytes; the final COV6 metadata additionally includes hidden arguments.

## 2. Change registers and test incorrect edits

The diamond chooses a for selector zero and b otherwise. The registers fixture
changes both branch definitions and the final store from v8 to v22. Changing
only one branch leaves the merged register undefined and must be rejected.

The five expected-negative fixtures are:

| Command argument | Expected refusal |
| --- | --- |
| wrong-launch | Workgroup must be 64 with maximum grid 2 |
| foreign-input | Marker argument no longer matches its source argument |
| undefined-merge | Physical register undefined on a CFG predecessor |
| missing-wait | Kernarg load used before its LGKM wait |
| wrong-carry | Address high half does not match the pointer origin |

Run each with the same script and a fresh directory. The script requires the
specific refusal and no diagnostic outputs; a crash is not success.
These are bounded structural checks, not a general race detector.

## 3. Replay the source in the CPU simulator

The public command above only exports. The compiler's opt-in source ladder
performs separate simulation:

```text
FE2O3_TEST_PHYSICAL_ENTRY_OUTPUT_V20=ABS_NEW_LADDER
PINNED_CARGO test --offline --locked -p rustc-codegen-fe2o3 --lib
  production_rustc_driver_v1::gfx942_physical_entry_qualification_v20_tests::actual_physical_entry_source_ladder
  -- --exact --ignored --nocapture --test-threads=1
```

The first line denotes an environment setting. Retain the repository's bounded
external supervisor and pinned backend/toolchain environment.

The observed ladder ran 16 isolated source sessions, with 576 CPU cases
across three positives and ten exact negative refusals. It checks grids64/128,
lengths0/1/63/64/65/127/128/129, selector0/1/u32::MAX, extreme scalar values,
view offsets, canaries and inactive lanes. Use an independent fill/selector
oracle and check the entire backing allocation. Symbolic pointer halves are
not sampled GPU pointer values.

## 4. Inspect unchanged LLVM through the ordinary worker

The authored body is one side-effecting inline-assembly statement followed by
unreachable in LLVM IR. LLVM still produces the descriptor and metadata:
this is not an LLVM bypass or an assembly-to-Rust decompiler.

Build the compiler's
[independent physical-entry checker](https://github.com/harsh-nod/fe2o3/tree/90de8eaf2ef445e0d470793fb2a74169eec9175b/tools/fe2o3-llvm-link-worker/tests/physical-entry-abi)
using its documented pinned SDK and ordinary worker. For each successful
ladder export, run:

```text
physical-entry-canonical-candidate ABS_CANONICAL_LL ABS_SAME_OWNER_SIDECAR O0 ABS_NEW_OUTPUT
```

Repeat with O3 and fresh directories. Join the sidecar and LLVM hashes to the
same live source observation. A copied sidecar is an inert expectation, not
a reconstructed compiler owner.

| Source | Instructions / blocks | Entry bytes | HSACO bytes | Required / allocated VGPRs |
| --- | --- | --- | --- | --- |
| one | 21 / 1 | 116 | 5400 | 9 / 16 |
| diamond | 25 / 4 | 132 | 5504 | 9 / 16 |
| registers | 25 / 4 | 132 | 5520 | 23 / 24 |

All six native inspections passed; O0/O3 bytes matched within each source.
No extra prologue/tail was observed. The checker also rejected 246 native
mutations, 66 sidecar mutations and 12 worker-input mutations across those runs.

## Evidence and what remains unchecked

The [15-record index](evidence/physical-entry-source-v20-20260924/index.json)
pins the source ladder, eight public receipts and six native reports. Native
records are exact framed slices of the retained matrix stdout, not regenerated
JSON; the index records the aggregate source hash and individual slice hashes.
Any final-newline normalization is explicit. The public Cargo invocation and
the source ladder have distinct canonical identities even where LLVM matches.

The snapshots are inert documentation, not browser-importable captures,
source custody, protected artifacts or launch authority. Native compilation
and full instruction inspection are not native functional execution.

This snapshot still lacks normal production ranked/formal descriptor
continuation, protected finalization and host/runtime proof discharge. General
global input loads, loops, LDS, barriers, atomics and matrix instructions are
outside this V20 profile. CPU tests do not establish arbitrary memory safety,
race freedom, occupancy/performance or GPU correctness. M2/M3/M6/U4 are not
closed by these results.

For debugger visualizations use the separate
[complete-body CPU viewer lesson](complete-body-cpu-viewer-v19.md).
V20 files currently refuse debugger loading; do not reinterpret them as V19,
invent physical register captures from logical SSA, or claim hardware stepping.
