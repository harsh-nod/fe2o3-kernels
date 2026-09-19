# Lab: author, inspect, change one instruction, and check again

This Linux/Node.js 22 lab uses existing public diagnostic tools to compile an
actual Rust instruction program, inspect its declared registers/instructions,
check every output and guard, make a real source edit, and repeat the normal
frontend path. No GPU is required. The compiler baseline is
[0b0e6c0d22f4aa5b10ddae702575eb85c7250ca7](https://github.com/harsh-nod/fe2o3/commit/0b0e6c0d22f4aa5b10ddae702575eb85c7250ca7).

A [current-host qualification](public-authoring-inspector-lab-qualification-20260919.md)
passed all 36 stages using current measured host tools and public-baseline source.
The clean-baseline host build shown below has not been independently reproduced
by that run; do not confuse those revision domains. Related captures are in the
[program authoring](ordered-program-authoring-v1.md) and
[logical debugger](ordered-program-debugger-v1.md) guides. This is not a complete
curriculum release and changes no publication pin or maturity label.

The small [lab helper](../examples/public-authoring-inspector/lab.mjs) creates
six ordinary simulation requests and checks local outputs using independent
BigInt arithmetic. It does not run a compiler/debugger, read private receipts,
construct Kernel IR, authenticate a producer or produce a new capture schema.
Its result checks join canonical identities to inspection; the separate KIR
file check is length-only, not a canonical digest check. Keep each export,
inspection and result together; same-size file substitution needs additional
byte pinning such as the retained qualification runner performs.

## 1. Understand the complete kernel

Use the complete committed
[source fixture](https://github.com/harsh-nod/fe2o3/blob/0b0e6c0d22f4aa5b10ddae702575eb85c7250ca7/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/ordered_program_v32.rs)
with feature `ordered-program-v32`. Its active compute path is:

```rust
let a = amdgpu_asm!(v_mov_b32(a));
let region_value = amdgpu_ordered_program! {
    gfx942_xnack_off_wave64;
    scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;
    xor(scratch, input0, input1);
    and(scratch, scratch, input2);
    xor(out, input1, scratch);
};
```

This excerpt is not the whole kernel. Keep the fixture's imports,
`ordered_u32_program` signature, `#[kernel(typed, launch(...))]`, required/max
64×1×1 launch and checked output-slice write. Its normal Rust store writes the
region result to each logical invocation's output element.

The result is `b ^ ((a ^ b) & c)`: bits selected by `c` come from `a`,
the other bits from `b`. Scratch/output begin undefined; inputs are read-only.
Explicit VGPR numbers describe five distinct bindings in v0..v63, not five
captured physical values or the entire kernel's allocation.

## 2. Create fresh source/build/output directories

Use a dedicated shell with `set -e`, or check each command before continuing.
Retain stdout and stderr from builds/exports so setup failures remain visible.
Do not reuse failed output paths as successful evidence.

Start in the website checkout containing this guide and its helper. Use an
existing compiler Git checkout as `lab_git` and an existing absolute storage
directory as `lab_storage`. The commands create two source worktrees, one host
build and separate device outputs. They do not alter your original source
checkout. Keep the worktrees and failed outputs until you have reviewed them.

```sh
lab_site=$(pwd -P)
lab_helper="$lab_site/examples/public-authoring-inspector/lab.mjs"
lab_commit=0b0e6c0d22f4aa5b10ddae702575eb85c7250ca7
lab_git=/absolute/existing/fe2o3
lab_storage=/absolute/existing/qualification-storage
lab_root=$(mktemp -d -p "$lab_storage" fe2o3-authoring-lab.XXXXXXXX)
git -C "$lab_git" worktree add --detach "$lab_root/compiler" "$lab_commit"
lab_repo="$lab_root/compiler"
node "$lab_helper" prepare "$lab_root/cases"
```

Use the existing `nightly-2026-04-03` toolchain with its required `rustc-dev`
and `rust-src` components, offline Cargo dependencies, and normal compiler build
prerequisites. Install missing prerequisites separately; do not mistake a setup
failure for a negative compiler test. Use a clean shell without compiler
wrappers, injected `RUSTFLAGS` or task-specific `FE2O3_*` settings. These builds
can be large: serialize them and reserve at least 40 GiB free disk plus build
space and 64 GiB available RAM for this reviewed reproduction profile.

```sh
export RUSTUP_TOOLCHAIN=nightly-2026-04-03
export RUSTC=$(rustup which --toolchain nightly-2026-04-03 rustc)
export CARGO=$(rustup which --toolchain nightly-2026-04-03 cargo)
export CARGO_TARGET_DIR="$lab_root/host-target"
export CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
lab_sysroot=$("$RUSTC" --print sysroot)
export LD_LIBRARY_PATH="$lab_sysroot/lib"
"$RUSTC" -vV
cd "$lab_repo"

"$CARGO" build --locked --offline -p rustc-codegen-fe2o3 --lib \
  --bin fe2o3-rustc-extract --bin fe2o3-export-sim
"$CARGO" build --locked --offline \
  -p fe2o3-kir-sim-cli --bin fe2o3-kir-sim \
  --example inspect_diagnostic_ordered_program_v17 \
  -p fe2o3-debug-cli --bin fe2o3-debug \
  -p fe2o3-amdgcn-model --example lower_diagnostic_ordered_program_v17
lab_bin="$CARGO_TARGET_DIR/debug"
```

The pinned rustc reports `1.96.0-nightly` and commit
`55e86c996809902e8bbad512cfb4d2c18be446d9`. Stop on a mismatch. The toolchain
name/commit alone does not attest a compiler closure. The inspector here is the
already committed example executable, not an assumed installed inspector command.

Use `set -e` in a dedicated shell/script, or check each command's exit status.
For stdout reports below, `set -C` prevents accidentally overwriting a retained
file. Compiler/simulator output arguments are create-new paths as well.

## 3. Export real source, inspect it and simulate six cases

```sh
set -e
set -C
lab_fixture=crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device
"$lab_bin/fe2o3-export-sim" --diagnostic-kir-v17 \
  --crate fe2o3_production_extraction_fixture \
  --output "$lab_root/original.kir" --target gfx942 \
  --target-dir "$lab_root/device-original" -- \
  --manifest-path "$lab_repo/$lab_fixture/Cargo.toml" \
  -p fe2o3-production-extraction-fixture --lib --no-default-features \
  --features ordered-program-v32 --offline

"$lab_bin/examples/inspect_diagnostic_ordered_program_v17" \
  "$lab_root/original.kir" "$lab_root/cases/case-6.json" \
  > "$lab_root/original-inspection.json"
for lab_case in 1 2 3 4 5 6; do
  "$lab_bin/fe2o3-kir-sim" --diagnostic-kir-v17 "$lab_root/original.kir" \
    --request "$lab_root/cases/case-$lab_case.json" \
    --output "$lab_root/original-case-$lab_case.json"
done
node "$lab_helper" check original "$lab_root"
```

Exporter `--diagnostic-kir-v17` is valueless; simulator/debugger
`--diagnostic-kir-v17 PATH` takes the canonical file. Do not combine it with
bundle or other KIR selectors.

Read `original-inspection.json`. Its current `coordinate`, three
`input_value_ids` and `result_value_id` come from the admitted immutable owner.
The roster block ordinal is not `raw_block_id`. Read the declared program,
exact padded descriptors and register plan rather than borrowing old SSA IDs.
The expected active descriptors are `133,307,413`; high-water 37 describes
bindings v32..v36, not actual whole-kernel VGPR usage.

The inspector performs admission and CPU preflight, not execution. The following
simulator commands perform the CPU executions. Each request has 64 outputs,
four guard bytes on each side, all 264 initial bytes `a5` and initially clear
initialization bits. The checker compares all 64 words, every guard byte and
every initialization bit for each of six scalar cases. It also joins the result
to the selected inspection's canonical identity and checks copied arguments.

For case 6, inputs are `(19,23,42)` and every output must be 23. The guards
remain `a5` and uninitialized. Checking data and initialization separately
detects unintended writes even when a store leaves the same byte pattern.
Six broadcast-input cases are not all-input equivalence or lane-varying coverage.
The helper's scalar target summary is not gfx942 hardware observation.

## 4. Change one real source instruction and repeat the frontend

Create a second pinned worktree and apply the
[single-instruction source patch](../examples/public-authoring-inspector/edit-first-instruction.patch).
It changes only the active three-step branch's first `xor` to `or`:

```sh
git -C "$lab_git" worktree add --detach "$lab_root/edited-source" "$lab_commit"
lab_edited="$lab_root/edited-source"
git -C "$lab_edited" apply "$lab_site/examples/public-authoring-inspector/edit-first-instruction.patch"
git -C "$lab_edited" diff -- "$lab_fixture/src/ordered_program_v32.rs"

"$lab_bin/fe2o3-export-sim" --diagnostic-kir-v17 \
  --crate fe2o3_production_extraction_fixture \
  --output "$lab_root/edited.kir" --target gfx942 \
  --target-dir "$lab_root/device-edited" -- \
  --manifest-path "$lab_edited/$lab_fixture/Cargo.toml" \
  -p fe2o3-production-extraction-fixture --lib --no-default-features \
  --features ordered-program-v32 --offline

"$lab_bin/examples/inspect_diagnostic_ordered_program_v17" \
  "$lab_root/edited.kir" "$lab_root/cases/case-6.json" \
  > "$lab_root/edited-inspection.json"
for lab_case in 1 2 3 4 5 6; do
  "$lab_bin/fe2o3-kir-sim" --diagnostic-kir-v17 "$lab_root/edited.kir" \
    --request "$lab_root/cases/case-$lab_case.json" \
    --output "$lab_root/edited-case-$lab_case.json"
done
node "$lab_helper" check edited "$lab_root"
node "$lab_helper" compare "$lab_root"
```

This changes the algorithm to `b ^ ((a | b) & c)`; it is not a schedule-only
optimization. Case 6 now expects 21, not 23. The active descriptors are
`132,307,413` and the first declared opcode is `v_or_b32_e32`. Both variants
must pass their own independent arithmetic oracle with a fresh canonical
identity. A changed digest by itself does not prove a correct edit or source
custody. This lab edits source and recompiles; it does not mutate KIR bytes or
resume a saved compiler object.

## 5. See the LLVM boundary, without calling it final machine proof

```sh
for lab_variant in original edited; do
  "$lab_bin/examples/lower_diagnostic_ordered_program_v17" \
    "$lab_root/$lab_variant.kir" "$lab_root/$lab_variant.ll" \
    > "$lab_root/$lab_variant-lowering.json"
done
```

Inspect the unchanged emitted `.ll` files. The authored instructions occur in
one constrained `asm sideeffect` unit; surrounding Rust still lowers normally:

```text
Rust source + typed macro
  -> typed frontend / semantic MIR32 -> semantic SSA -> diagnostic canonical KIR17
                                                    |-> CPU simulation / debugger
                                                    '-> LLVM IR (one authored asm unit)
                                                         -> native backend, separately qualified
```

LLVM IR is **not bypassed**, and the whole kernel is not a single giant inline
assembly string. The region carries fixed bindings, early-clobber output,
scratch clobber and implicit EXEC read under a NoMemory contract. Compiler-owned
boundary copies are not authored instructions. Internal order is not a memory
fence or control over unrelated LLVM scheduling.

This public lowering example is a diagnostic text observation. It requires
secure Linux filesystem support and must refuse unavailable facilities without
a weaker fallback. It does not create a protected code object, prove final
register allocation, decode final ISA or run hardware. Do not invoke private
native prototypes or turn this `.ll` into an alternate production artifact path.

## 6. Debug both variants with fresh IDs

The existing public smoke script consumes each current export/request, performs
fresh CPU debugger sessions and retains actual JSONL. It does not compile source
or authenticate the source declarations supplied here:

```sh
for lab_variant in original edited; do
  lab_ids=$(node "$lab_helper" ids "$lab_variant" "$lab_root")
  case "$lab_variant" in
    original) lab_descriptors=133,307,413 ;;
    edited) lab_descriptors=132,307,413 ;;
  esac
  node "$lab_repo/scripts/ordered-program-debugger-smoke.mjs" \
    --debugger "$lab_bin/fe2o3-debug" \
    --inspector "$lab_bin/examples/inspect_diagnostic_ordered_program_v17" \
    --kir "$lab_root/$lab_variant.kir" \
    --request "$lab_root/cases/case-6.json" \
    --output "$lab_root/$lab_variant-debugger" \
    --result-mode used --operand-order 0,1,2 --register-plan 32,33,34,35,36 \
    --descriptors "$lab_descriptors" --source-ids "$lab_ids"
done
```

Paths must be direct absolute regular-file paths; output directories must be
new. The script enforces its own command/input/output bounds and 40 GiB disk
reserve plus output headroom. Keep stderr, failures, `smoke.json`, inspection
and session streams. Do not label an incomplete run as a capture.

The three instruction rows remain **one whole-program CPU operation**. Observe
lane-zero inputs before it, the result after it, reverse-restored inputs and a
repeated result with the new revision. The smoke separately checks every output
word, initialization, guards and recorded write history. It does not inspect
physical registers or give instruction-level scratch microsteps.

For visual orientation, the website's **Open recorded program tutorial** shows
an existing separately pinned capture, not these new runs. Its export path
requires a qualified multi-session batch; do not silently replace that input
with one local session. The resource JSONL importer is a different bounded
subset and cannot display this Wave64 program's full logical value transcript.

## What incorrect behavior does this catch?

| Check | Concrete bug/refusal in this profile | Not established |
| --- | --- | --- |
| Macro and independently checked frontend | Read-before-definition, missing output, illegal opcode/arity, write to an input role, aliased/out-of-range/dynamic bindings, unsupported placement or launch | General arbitrary assembly safety |
| Canonical admission and inspection | Wrong wire/profile, malformed descriptors/padding, inconsistent typed roles; the actual current operation/register declaration | Source authentication or final machine bytes |
| Independent six-case CPU oracle | Wrong formula/instruction choice, incorrect output, damaged guards, missing or extra initialized bytes | All-input proof, hardware equivalence, races outside this kernel |
| Ordinary simulator preflight | Wrong request types or required workgroup, unsupported operation/schedule selector | A GPU launch contract bypass |
| Public debugger smoke | Current-state/value disagreement, stale revision/token use, wrong selected identity, incorrect reverse/repeated observations for this run | Allocation reuse/lifecycle, arbitrary helper histories, per-instruction register states |
| LLVM text observation | Which constrained instruction unit and boundary is emitted for each variant | Native encoding, final resources, occupancy or GPU timing |

Try one intended compiler negative independently: export feature
`ordered-program-alias-v32` to a new output and device-target path instead of
`ordered-program-v32`. Require failure with
`ordered program physical roles must be distinct v0..v63` and no successful
canonical output. The analogous `ordered-program-wrong-launch-v32` must report
`ordered program requires required and maximum 64x1x1 workgroup bounds`.
A timeout, crash, missing dependency or unrelated syntax error is not a passing
negative. Preserve stderr and do not fall back to a different canonical route.

## Multiple abstraction levels: what round-trips today?

You can keep ordinary Rust algorithms, inspect genuinely available lowered
stages, choose a bounded authored representation, edit its real Rust macro, and
compile again. This is valuable for reviewing a specific instruction choice
while leaving the rest of the kernel in ordinary typed Rust.

The public `fe2o3-author` Bundle V6 inspection/materialization examples are a
separate supported profile; their selectors are not V17 compiler-resume handles.
Read [ordinary source navigation](ordinary-authoring-navigation-v1.md) for
many-to-many source attribution: a source span can name multiple operations and
does not own an automatically replaceable expression.

This lab begins with authored Rust. It does **not** implement arbitrary
Rust→assembly extraction, safe automatic source replacement, assembly→arbitrary
Rust decompilation, lossless bidirectional editing, persistent schedule replay,
or continuation from raw LLVM/KIR files. Returning to a saved high-level source
copy is useful, but it does not merge later assembly edits automatically. Every
actual source change needs fresh frontend checks and applicable evidence;
an old capture or proof is not valid merely because line numbers look similar.

Authored memory/barriers, labels/branches, SGPR/AGPR, matrix operations, gfx950,
general whole-body assembly, live resource lifetimes and final production
qualification remain outside this closed tutorial. It contributes a reproducible
small-kernel exercise toward #280 M6/#281 V5/#282 U4, without completing their
broader operation matrices, tiled example, production dependencies or agreed
performance/publication gates.
