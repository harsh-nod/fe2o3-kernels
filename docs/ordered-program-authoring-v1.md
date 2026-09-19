# Draft: write a bounded instruction program inside a Rust kernel

This experimental walkthrough complements the [fixed-region tutorial](ordered-region-authoring-v1.md)
and [recorded logical-debugging tutorial](ordered-program-debugger-v1.md). It is
not a published curriculum lesson, a qualified release, or protected
source-to-GPU admission. `FE2O3_PIN` and the site's maturity labels are unchanged.

Use the matching [compiler implementation](https://github.com/harsh-nod/fe2o3/tree/f5e81f985ff3e2771ad0f132d483f5cf74976ad6),
its [authoring contract](https://github.com/harsh-nod/fe2o3/blob/f5e81f985ff3e2771ad0f132d483f5cf74976ad6/docs/ordered-program-authoring-v1.md),
and its pinned toolchain, not the site's older lesson baseline. The recipes below
are draft reproduction instructions, not a claim that every printed command
was rerun verbatim. The maintained source qualification passed six ordinary
exports, eight expected source refusals, 36 CPU simulations and 15 CLI refusal
controls. A separate 36-session public debugger batch supplies the
[retained logical observations](ordered-program-debugger-v1.md#retained-qualification-and-byte-pins).
These bounded observations do not promote this draft or qualify a release;
earlier fixed-pair observations remain separate.

## Start with the complete source fixture

Open [ordered_program_v32.rs](https://github.com/harsh-nod/fe2o3/blob/f5e81f985ff3e2771ad0f132d483f5cf74976ad6/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/ordered_program_v32.rs).
Keep its manifest and root module. Its three-step positive branch is equivalent
to this complete kernel:

```rust
use fe2o3_device::{DisjointSlice, amdgpu_asm, amdgpu_ordered_program, kernel, thread};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn ordered_u32_program(mut output: DisjointSlice<u32>, a: u32, b: u32, c: u32) {
    let a = amdgpu_asm!(v_mov_b32(a));
    let value = amdgpu_ordered_program! {
        gfx942_xnack_off_wave64;
        scratch(32); out(33);
        in(34) = a; in(35) = b; in(36) = c;
        xor(scratch, input0, input1);
        and(scratch, scratch, input2);
        xor(out, input1, scratch);
    };
    let index = thread::index_1d();
    if let Some(element) = output.get_mut(index) {
        *element = value;
    }
}
```

The program computes `b ^ ((a ^ b) & c)`: set bits of `c` select bits from `a`,
and clear bits select from `b`. For `(19, 23, 42)`, the independent expected result
is 23. That arithmetic expectation is not a recorded debugger result.

The five bindings are local roles within this one program. `input0`, `input1`
and `input2` are read-only `u32` inputs. `scratch` and `out` start undefined and
are the only writable roles. A step reads its sources before writing its
destination; therefore `mov(out, out)` needs an earlier definition of `out`.
Output must be defined at program exit. Each data expression is evaluated once.
Calling the marker directly on the host panics; use the diagnostic CPU route
below to observe its logical semantics.

| Macro operation | Declared instruction | Logical effect |
| --- | --- | --- |
| `mov(dst, src)` | `v_mov_b32_e32` | Copy 32 bits |
| `add(dst, left, right)` | `v_add_u32_e32` | Wrapping `u32` addition |
| `sub(dst, left, right)` | `v_sub_u32_e32` | Wrapping `u32` subtraction |
| `and(dst, left, right)` | `v_and_b32_e32` | Bitwise AND |
| `or(dst, left, right)` | `v_or_b32_e32` | Bitwise OR |
| `xor(dst, left, right)` | `v_xor_b32_e32` | Bitwise XOR |

All five register numbers must be distinct literals in `v0..v63`, including
unused roles. The closed profile permits one unconditional, acyclic occurrence
in one direct kernel root, `gfx942:xnack-`, wave64, and required and maximum
workgroup `64x1x1`. The established scalar prefix above does not permit arbitrary
pre-program calls, authored memory accesses, helpers, loops or divergent placement.

## Change the authored sequence

For a one-step program, replace only the macro body after the bindings with:

```rust
mov(out, input0);
```

The fixture already provides this as `ordered-program-one-v32`; the expected
result for the same inputs is 19. Its `ordered-program-sixteen-v32` branch uses
the following sixteen steps with the same bindings:

```rust
mov(scratch, input0);
xor(out, input0, input1);
and(scratch, out, input2);
or(out, scratch, input1);
add(scratch, out, input2);
sub(out, scratch, input0);
mov(scratch, out);
xor(scratch, scratch, input1);
or(out, scratch, input0);
and(out, out, input2);
add(out, out, input0);
sub(scratch, out, input1);
mov(out, scratch);
xor(out, out, input2);
mov(scratch, input1);
mov(out, out);
```

Its independently expected result is 12. The dead final scratch write and output
self-move remain authored steps; logical output equality alone does not check
their native retention. In each profile, add `ordered-program-unused-v32` to
store the original first scalar argument instead of the program's result.
The program and its logical result must still be retained. For this request,
all unused-result kernels store 19 even when their program result is 23 or 12.

Edit a separate source copy and re-export to fresh paths when experimenting.
Do not patch serialized canonical bytes and call that a Rust source edit.
New source, crate names and paths may change identities; old SSA IDs and
debugger cursors do not carry over to the new export.

## Build the ordinary diagnostic tools

These are draft reproduction commands, not a claim that this Markdown recipe
has passed. Run on Linux from the matching compiler checkout with cached
dependencies and the required `nightly-2026-04-03` components. Serialize Cargo
work and leave at least 40 GiB free plus host/device build and output room.
Use an existing qualification-storage directory in place of the placeholder.
Start without compiler wrappers or custom extraction environment variables.

```sh
program_repo=$(pwd -P)
program_run=$(mktemp -d -p /absolute/qualification-storage fe2o3-program.XXXXXXXX)
export RUSTUP_TOOLCHAIN=nightly-2026-04-03
export RUSTC=$(rustup which --toolchain nightly-2026-04-03 rustc)
export CARGO=$(rustup which --toolchain nightly-2026-04-03 cargo)
export CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
export CARGO_TARGET_DIR="$program_run/host-target"
"$RUSTC" -vV

"$CARGO" build --locked --offline \
  -p rustc-codegen-fe2o3 -p fe2o3-kir-sim-cli -p fe2o3-debug-cli \
  -p fe2o3-amdgcn-model --lib \
  --bin fe2o3-rustc-extract --bin fe2o3-export-sim \
  --bin fe2o3-kir-sim --bin fe2o3-debug \
  --example inspect_diagnostic_ordered_program_v17 \
  --example lower_diagnostic_ordered_program_v17
program_bin="$CARGO_TARGET_DIR/debug"
```

Check release `1.96.0-nightly` and rustc commit
`55e86c996809902e8bbad512cfb4d2c18be446d9`; the toolchain name alone is not a
compiler-closure attestation. Run selected Rust tests before this final normal
build. Repeat the build if later tests replace the backend shared library.

Export all six source variants with ordinary dispatch:

```sh
for program_profile in one three sixteen; do
  case "$program_profile" in
    one) program_feature=ordered-program-one-v32 ;;
    three) program_feature=ordered-program-v32 ;;
    sixteen) program_feature=ordered-program-sixteen-v32 ;;
  esac
  for program_mode in used unused; do
    program_features="$program_feature"
    if [ "$program_mode" = unused ]; then
      program_features="$program_features,ordered-program-unused-v32"
    fi
    "$program_bin/fe2o3-export-sim" --diagnostic-kir-v17 \
      --crate fe2o3_production_extraction_fixture \
      --output "$program_run/$program_profile-$program_mode.kir" --target gfx942 \
      --target-dir "$program_run/device-$program_profile-$program_mode" -- \
      --manifest-path "$program_repo/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/Cargo.toml" \
      -p fe2o3-production-extraction-fixture --lib --no-default-features \
      --features "$program_features" --offline
  done
done
```

Exporter `--diagnostic-kir-v17` is valueless. The simulator and debugger instead
take `--diagnostic-kir-v17 PATH`. Do not combine it with another canonical/bundle
selector or turn a diagnostic refusal into a production fallback.

## Check an independent CPU expectation

The ABI is output slice followed by three scalars. Create a fresh request with
64 outputs, two four-byte guards and all backing bytes initially uninitialized:

```sh
node --input-type=module - "$program_run" <<'JS'
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const request = {
  schema: 'fe2o3-simulation-request-v1', kernel: 'ordered_u32_program',
  grid: [64, 1, 1], workgroup: [64, 1, 1],
  arguments: [
    { kind: 'buffer_view', backing: 1, element: 'u32', access: 'read_write',
      alignment: 4, byte_offset: 4, elements: 64 },
    { kind: 'scalar', type: 'u32', bits: '0x00000013' },
    { kind: 'scalar', type: 'u32', bits: '0x00000017' },
    { kind: 'scalar', type: 'u32', bits: '0x0000002a' },
  ],
  shared_buffers: [{ id: 1, element: 'u32', access: 'read_write', alignment: 4,
    bytes: '0x' + 'a5'.repeat(264), initialized: '0x' + '00'.repeat(33) }],
};
writeFileSync(join(process.argv[2], 'request.json'), JSON.stringify(request) + '\n',
  { flag: 'wx', mode: 0o600 });
JS

for program_profile in one three sixteen; do
  for program_mode in used unused; do
    "$program_bin/fe2o3-kir-sim" \
      --diagnostic-kir-v17 "$program_run/$program_profile-$program_mode.kir" \
      --request "$program_run/request.json" \
      --output "$program_run/$program_profile-$program_mode-result.json"
  done
done
```

Independently check every output word, initialization bit and unchanged guard:

```sh
node --input-type=module - "$program_run" <<'JS'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const u32 = value => BigInt.asUintN(32, value);
const [a, b, c] = [19n, 23n, 42n];
function sixteen() {
  let out = a ^ b;
  let scratch = out & c;
  out = scratch | b;
  scratch = u32(out + c);
  out = u32(scratch - a);
  scratch = out ^ b;
  out = (scratch | a) & c;
  out = u32(out + a);
  scratch = u32(out - b);
  return scratch ^ c;
}
const results = { one: a, three: b ^ ((a ^ b) & c), sixteen: sixteen() };
assert.deepEqual(Object.values(results), [19n, 23n, 12n]);
for (const profile of Object.keys(results)) for (const mode of ['used', 'unused']) {
  const result = JSON.parse(readFileSync(join(process.argv[2], `${profile}-${mode}-result.json`), 'utf8'));
  assert.equal(result.status, 'ok'); assert.equal(result.authority, 'observation_only');
  assert.equal(result.simulated, true); assert.equal(result.hardware_observed, false);
  assert.equal(result.counts.invocations_executed, 64);
  assert.equal(result.counts.workgroups_visited, 1);
  assert.equal(result.shared_buffers.length, 1); assert.equal(result.shared_buffers[0].id, 1);
  const expected = Buffer.alloc(264, 0xa5);
  const value = Number(mode === 'used' ? results[profile] : a);
  for (let lane = 0; lane < 64; lane++) expected.writeUInt32LE(value, 4 + 4 * lane);
  const actual = result.shared_buffers[0].buffer;
  assert.equal(actual.bytes, '0x' + expected.toString('hex'));
  assert.equal(actual.initialized, '0xf0' + 'ff'.repeat(31) + '0f');
}
console.log('All six CPU results, initialization maps and guards agree');
JS
```

The shortened sixteen-step oracle checks the final logical result, not native
instruction retention. Broadcast scalars exercise 64 logical invocations; this
is not a lane-varying load test or a GPU wave observation. Extend independent
expectations to zero, wraparound and bit-pattern inputs before claiming boundary
coverage. Keep the exact source, requests, outputs and failed attempts.

## Inspect and lower without confusing authority levels

Run the current-owner inspector with this exact KIR/request pair:

```sh
"$program_bin/examples/inspect_diagnostic_ordered_program_v17" \
  "$program_run/three-used.kir" "$program_run/request.json" \
  > "$program_run/three-used-inspection.json"

"$program_bin/examples/lower_diagnostic_ordered_program_v17" \
  "$program_run/three-used.kir" "$program_run/three-used.ll" \
  > "$program_run/three-used-lowering.json"
```

Keep output paths new. The inspector performs bounded admission and CPU
preflight, not execution. It supplies the current canonical digest, operation
roster coordinate, input/result SSA IDs, count and padded descriptors, declared
instruction rows and register plan. The canonical digest is not file SHA-256;
the raw block ID is not the roster block ordinal. Declared source IDs are not a
source map or authentication.

The lowering example is Linux-only, uses bounded immutable input and
create-new output, and may refuse missing secure filesystem support. It is a
raw diagnostic observer, not a protected artifact pipeline. Do not rewrite its
LLVM output to satisfy a native observer.

```text
Rust + typed instruction macro -> semantic MIR32 -> canonical KIR17
                                                   |-> diagnostic CPU / JSONL debugger
                                                   `-> LLVM IR -> native observation
```

LLVM IR is not bypassed. One `asm sideeffect` unit contains the authored sequence,
fixed inputs, early-clobber output and scratch clobber. Surrounding Rust lowers
normally. Compiler-owned boundary copies are not authored steps. The program is
NoMemory, internally ordered and reads implicit EXEC; it is not a fence or a
promise about unrelated instructions. Binding high-water 37 for `v32..v36` is
not total kernel VGPR usage, descriptor capacity, occupancy or a lifetime proof.

Native O0/O3 instruction-byte and retention checks are separate from CPU result
checks. Neither is GPU execution, source authentication, proof, protected
publication, artifact/launch authority or permission to resume compilation from
a detached KIR file. Continue with the [logical debugger tutorial](ordered-program-debugger-v1.md).

## Understand refusals and remaining work

This closed grammar catches read-before-definition, missing output, invalid
opcode/arity, writes to input roles, aliased/out-of-range/dynamic bindings,
invalid count or descriptor padding, and unsupported source/target/launch
placement. For example, first-step `add(out, scratch, input0)` is undefined;
`mov(input0, input1)` has an invalid destination; `scratch(32); out(32);` aliases
roles. A seventeenth step is rejected, not silently split into another region.

The fixture includes eight refusal features: `ordered-program-alias-v32`,
`ordered-program-dynamic-v32`, `ordered-program-divergent-v32`,
`ordered-program-wrong-launch-v32`, `ordered-program-invalid-count-v32`,
`ordered-program-invalid-opcode-v32`, `ordered-program-read-before-init-v32`, and
`ordered-program-padding-v32`. Export each separately to a new path and check its
intended diagnostic plus absence of a successful artifact. A crash, timeout or
unrelated error is not a passing negative case. Some use the internal marker
deliberately to test backend refusal; kernel authors should use the macro.

Authored memory/synchronization, SGPR/AGPR, EXEC writes, carry, labels/branches,
matrix operations, gfx950, partial waves and general whole-kernel assembly are
outside this tutorial. Editing Rust and re-exporting is not arbitrary
Rust-to-assembly materialization, reverse decompilation or a lossless roundtrip.
The existing checked local bit-select planner has narrower caller-asserted
source boundaries; it is not authenticated automatic source replacement.

The original milestones in [#280](https://github.com/harsh-nod/fe2o3/issues/280),
[#281](https://github.com/harsh-nod/fe2o3/issues/281), and
[#282](https://github.com/harsh-nod/fe2o3/issues/282) remain broader than this draft.
No milestone or maturity level is promoted by adding these instructions.
