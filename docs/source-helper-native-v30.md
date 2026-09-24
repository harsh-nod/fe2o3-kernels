# Lab: continue an edited scalar helper through native compilation

Start with the [const-u32 helper lab](const-u32-helper-promotion-v1.md).
Keep its original fixture and create fresh default256, edited512, repeat and
two-specialization Rust sources. The generated helper still uses compiler-owned
scalar values; a Rust identifier such as v14 is not a physical VGPR assignment.

This follow-on is qualified against compiler commit
[ed69ea8c845a5d13adbaceedf1b6b3321217d6ed](https://github.com/harsh-nod/fe2o3/commit/ed69ea8c845a5d13adbaceedf1b6b3321217d6ed).
It adds actual normal-driver and native-worker observations. It does not change
the historical CPU-only receipt, curriculum pin, maturity labels or accepted
milestone ledger.

## 1. Re-export the new Rust and check its meaning

Run the existing public source-smoke driver from the matching compiler checkout.
Keep all original arguments, launch annotations, dependencies and lockfile.
The fresh 2026-09-24 run passed five normal source exports, 150 whole-buffer CPU
replays and three exact CLI refusal controls.

The default and edited formulas remain:

- default256: `((a ^ b) & 255) | 256`
- edited512 and repeat: `((a ^ b) & 255) | 512`
- two: `(((a ^ b) & 255) | 256) ^ (a | 512)`

Changing the constant changes meaning; update the independent oracle.
Check initialization, guards and the entire output backing, not only its first
element. An old selector or a diagnostic materialization JSON is not a compiler
owner or a resume token.

## 2. Continue through the normal LLVM and descriptor path

From the compiler checkout, use its explicitly opt-in qualification ladder:

```text
FE2O3_TEST_HELPER_GENERATED_INPUT_V30=ABS_FRESH_PUBLIC_SMOKE_OUTPUT
FE2O3_TEST_HELPER_GENERATED_OUTPUT_V30=ABS_NEW_LADDER_OUTPUT
PINNED_CARGO test --offline --locked -p rustc-codegen-fe2o3 --lib
  production_rustc_driver_v1::helper_generated_source_qualification_v30_tests::actual_generated_helper_source_ladder
  -- --ignored --exact --nocapture --test-threads=1
```

The first two lines denote environment settings for that command; replace the
uppercase slots with reviewed absolute paths. The ladder is a test harness,
not a new production launcher. Use the pinned nightly-2026-04-03 rustc and
existing external resource/process supervisor.

It runs normal LLVM emission and normal inert worker handoff for each of four
source variants. Its eight successful runs join the actual source invocation,
unchanged LLVM prefix, canonical descriptor suffix and exact symbol/ABI roster.
The kernel retains four physical components: output pointer, length, a and b.

The compiler now retains the actual fixed-policy optimizer result through
descriptor construction. Mandatory ranked/formal checks still apply. Only
source-owned internal helpers in the closed six-u32 NoMemory profile can
project their structural assembly capability into runtime requirements.
A raw module, cloned graph, foreign source owner or capability string alone
does not gain that permission.

## 3. Observe ordinary LLVM/object/LLD output

Build the compiler's
[helper-source-abi fixture](https://github.com/harsh-nod/fe2o3/tree/ed69ea8c845a5d13adbaceedf1b6b3321217d6ed/tools/fe2o3-llvm-link-worker/tests/helper-source-abi)
using its pinned worker and SDK procedure. Supply the exact successful ladder
observation.json and its SHA-256:

```text
helper-source-native-observer ABS_LADDER_JSON SHA256 default256 O0 ABS_NEW_OUTPUT
```

Repeat for default256, edited512, repeat and two at both O0 and O3, always
using a new output directory and an external timeout. The observer consumes
unchanged emitted LLVM, not a rewritten assembly sample. It checks helper call,
argument, VOR and return structure, runs the ordinary worker, and retains exact
linked bytes and bounded decoded instructions/call targets.

| Variant | O0 functions / calls / HSACO bytes | O3 functions / calls / HSACO bytes |
| --- | --- | --- |
| default256 | 2 / 1 / 6616 | 1 / 0 / 5408 |
| edited512 | 2 / 1 / 6616 | 1 / 0 / 5408 |
| repeat | 2 / 1 / 6616 | 1 / 0 / 5408 |
| two | 3 / 2 / 6992 | 1 / 0 / 5408 |

O0 retained helper calls; O3 inlined them. Rust inline(never) is not currently
propagated as LLVM noinline in this route. Do not infer a physical helper ABI or
a guarantee of a final machine call from the source attribute. Repeated edited
source produced identical HSACO bytes at each optimization level.

## 4. Read evidence without upgrading its authority

The [retained evidence index](evidence/source-helper-native-v30-20260924/index.json)
pins the fresh public receipt, normal-driver observation and all eight corrected
native reports. Native report bytes are unchanged; any appended final newline
in a Rust JSON record is explicitly recorded with both original and retained
hashes. These documentation copies are inert observations, not source custody,
executable payloads, finalizer receipts or browser-importable debug captures.

The first observer reports had a borrowed-string lifetime defect and are
excluded. The corrected observer owns LLVM names, checks exact retained helper
and intrinsic rosters after module destruction and native compilation, and
includes mutation controls. Only the fresh r2 native reports are copied here.

The [compiler qualification](https://github.com/harsh-nod/fe2o3/blob/ed69ea8c845a5d13adbaceedf1b6b3321217d6ed/docs/source-helper-native-qualification-20260924.md)
records all gates and the remaining scope. These four actual-source examples
use VOR; six-operation inert controls are not six native source qualifications.

## What remains unchecked

The compiler can refuse stale/mismatched source ownership, incorrect SSA use,
unsupported instruction/type/effect combinations, hidden memory effects and
wrong target/ABI/launch relations. CPU replay checks the chosen finite inputs.

Native opcode presence and call counts do not prove physical argument/result
flow, register preservation, complete root-expression/guard/store refinement,
memory safety or race freedom. Those native semantic qualification flags remain
false. Protected finalizer/host execution, GPU correctness and live register
capture remain unqualified. M2/M6/U4 are not closed by this lesson.

This continues Rust source through the existing LLVM pipeline; it neither
bypasses LLVM IR nor supplies an assembly-to-Rust decompiler. For the separate
CPU debugging experience, see the
[recorded complete-body debugger lesson](complete-body-cpu-viewer-v19.md);
its logical SSA views are not captured physical register values.

For explicit physical registers and the complete instruction body, continue to
the [physical-entry source lab](physical-entry-source-v20.md). That profile has
its own source, CPU and native-static checks; helper evidence does not qualify it.
