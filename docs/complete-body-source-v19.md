# Author a bounded complete-body Rust kernel

**Source and public-command qualification retained.** The
[2026-09-24 record](complete-body-source-qualification-20260924.md) passed the
actual Rust-source ladder (21 sessions, 384 CPU cases and 15 exact refusals),
all seven public source commands, and both public source-debug commands.
This qualifies these bounded examples, not general assembly or whole milestones.
Native functional execution remains unqualified. Four separate O0/O3
native-prefix checks are retained in the record. No GPU execution or hardware
register capture is claimed. See the [published implementation commit](https://github.com/harsh-nod/fe2o3/commit/76fe660d9ef27961ec764c5cec1b7b79e6321a33).

The [pending qualification fields](complete-body-v19-qualification-pending.json)
are retained only as a null-valued non-evidence template for future runs, not
the current status record. Do not populate it from synthetic tests or earlier
V17/native-fixture observations. FE2O3_PIN, curriculum routes and maturity
labels remain unchanged.

Read this beside the [const metadata builder](complete-body-const-builder-v1.md),
the separate [native ABI fixture](complete-body-native-abi-v1.md), and the
[new logical-debugging recipe](complete-body-debug-v19.md). Those tutorials cover
different owners and evidence; their older successes do not qualify this route.

## Exact source profile

This experimental exact profile lets Rust kernel authors supply a bounded
instruction body while the compiler owns the ABI boundary, uniform selector,
guarded global output store and termination. It currently accepts one authored
block or a four-block selector diamond, on `gfx942:xnack-`, Wave64, required
**and** maximum workgroup 64×1×1, and an explicit finite source max_grid. The
examples declare max_grid=[2,1,1], so the retained analysis envelope is at most
128 lanes; smaller full-workgroup launches remain within that envelope. Omitting
max_grid retains a dynamic envelope and is refused, never replaced by a guessed
128-lane launch. It is not a general assembler or completion
of the full authoring milestones.

The [actual compiler fixture](https://github.com/harsh-nod/fe2o3/blob/76fe660d9ef27961ec764c5cec1b7b79e6321a33/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/complete_body_v19.rs)
contains both positive kernels and five independent refusal cases:

```rust,ignore
use fe2o3_device::diagnostics::__amdgpu_complete_body_gfx942_v1 as body;
use fe2o3_device::{DisjointSlice, kernel};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1], max_grid = [2, 1, 1]))]
pub fn assembly_one(output: DisjointSlice<u32>, a: u32, b: u32, c: u32, selector: u32) {
    // Label 255: mov(out, input0); guarded store/end.
    body::<1, 1, 0x41ff, 0, 0, 0, 0x0008, 0, 0, 0>(
        output, a, b, c, selector, 32, 33, 34, 35, 36,
    );
}
```

The hidden diagnostic marker is the current experimental frontend spelling,
not a stable ergonomic macro. Its ten const arguments are two counts followed
by four block words and four instruction words. These are checked format
records, **not AMD instruction encodings**. The five final literal arguments
bind scratch, output and three inputs to distinct `v8..v63`; `v0..v7` belong
to the compiler. The marker is never executed on the host.

For the four-block example, use:

```rust,ignore
body::<4, 2, 0x0002_0111_0108_a0f0, 0x0000_4004_0002_0102, 0, 0, 0x0018_0008, 0, 0, 0>(
    output, a, b, c, selector, 32, 33, 34, 35, 36,
);
```

This describes `240: selector == 0 ? 17 : 2`, `17: out = input0; jump 4`,
`2: out = input1; jump 4`, `4: guarded store/end`. Labels identify authored
blocks, not workgroups, source identities or GPU addresses. Every incoming
path must define output before the terminal.

## Ordinary Cargo command

Use the checkout's pinned `nightly-2026-04-03` compiler, cached dependencies,
`rustc-dev` and `rust-src`. Set `RUSTC` to the **absolute** installed compiler
binary; the script never installs a toolchain. Build the normal extractor and
backend together under your usual serialized build/resource controls:

```sh
cargo build --offline --locked -p rustc-codegen-fe2o3 \
  --lib --bin fe2o3-rustc-extract

node scripts/complete-body-source-v19.mjs one /absolute/new-one-output
node scripts/complete-body-source-v19.mjs diamond /absolute/new-diamond-output
```

`CARGO_TARGET_DIR` selects matching debug binaries. For an already built
binary directory set `FE2O3_COMPLETE_BODY_BIN_DIR_V19` to its absolute path.
Each output directory must not exist. The script uses fresh Cargo targets,
the existing `fe2o3-rustc-extract` workspace wrapper and normal LLVM/handoff
extraction routes. Authors do not implement private rustc callbacks.

If qualification succeeds, positive runs retain `canonical.ll`, `handoff-v2.bin`, input hashes,
bounded process logs and `receipt.json`. The handoff embeds the same executable
LLVM followed by its compiler descriptor section. Both outputs are inert.
The script checks the executable-text relation; the Rust qualification below
also strictly decodes canonical handoff and descriptor bytes.

No GPU is required or used. This command does **not** run CPU simulation,
LLVM machine-code generation, a native worker, protected finalization or a
runtime. It neither loads nor launches the kernel. Fresh output has an
observed-size limit of 1 GiB/100,000 entries; each child has a 300-second and
16-MiB log limit. These are stop bounds, not disk reservations or RSS claims.

## Exact source refusals

Run each case with a different new directory:

```sh
node scripts/complete-body-source-v19.mjs wrong-launch /absolute/new-wrong-launch
node scripts/complete-body-source-v19.mjs reserved-register /absolute/new-reserved
node scripts/complete-body-source-v19.mjs foreign-input /absolute/new-foreign
node scripts/complete-body-source-v19.mjs undefined-merge /absolute/new-undefined
node scripts/complete-body-source-v19.mjs dynamic-grid /absolute/new-dynamic
```

| Case | Deliberate source edit | Required failure |
| --- | --- | --- |
| Wrong launch | Required and maximum both 128×1×1 (valid general typed launch) | Exact 64×1×1 complete-body profile mismatch |
| Reserved register | Scratch uses `v7` | Compiler-owned boundary register refusal |
| Foreign input | Pass `b` in `a`'s slot without an extra call | Exact argument transport mismatch |
| Undefined merge | Only the zero arm defines output | Output undefined at label 4 |
| Dynamic grid | Omit the finite source max_grid | Exact source envelope remains dynamic and is refused |

A negative counts only when the correct diagnostic is present and no output
exists. Generic failures, timeouts, crashes or later unsupported operations
do not satisfy the case.

## Qualify the actual-source CPU and worker continuation

With `RUSTC` still pointing at the pinned binary and Cargo serialized:

```sh
FE2O3_TEST_COMPLETE_BODY_OUTPUT_V19=/absolute/new-qualification-output \
cargo test --offline --locked -p rustc-codegen-fe2o3 --lib \
  production_rustc_driver_v1::gfx942_complete_body_qualification_v19_tests::actual_complete_body_source_ladder \
  -- --exact --ignored --nocapture
```

This opt-in maintainer qualification is designed to prepare fresh device/core metadata,
verify current fixture bytes and invocation bindings, and run 21 isolated
real-source sessions: seven cases across observation, normal LLVM export and
normal handoff export. Positive observation borrows the genuine checked target
for CPU simulation, then consumes that same owner through normal descriptor/
worker preparation. It never rebuilds source custody from serialized bytes.

The retained source ladder passed 384 CPU cases across the two kernels; a rerun
must repeat the same checks: distinct
inputs; selectors 0, 1 and `u32::MAX`; grids 64/128; lengths
0/1/63/64/65/127/128/129. Independent Rust expectations check both branches,
written values, initialized bytes, two-sided canaries, untouched in-view
elements beyond the grid and immutable requests. Public-driver outputs must
match same-source observation bytes exactly. Fifteen negative sessions passed their exact refusal checks; a rerun must
fail at those same specific source boundaries.

CPU tail protection is separate from formal launch eligibility. Formal
analysis conservatively retains `LaunchEnvelope` extent requirements:
128 invocations require 512 output bytes. A shorter CPU slice with a guarded
store does **not** relax that condition or authorize a shorter-buffer launch.

## Compilation and custody boundaries

Actual Rust/typed launch and trusted marker → authenticated semantic MIR36 →
semantic SSA → exact KIR19 → existing ranked safety checks plus typed formal
memory obligations → checked canonical LLVM → inert worker handoff/descriptor.

The LLVM module contains the bounded authored body as an inline-assembly unit;
this route does not bypass LLVM IR. KIR19 exposes authored steps as SSA
operations and uses the existing CFG, merge and guarded-store simulator.
Declared VGPR bindings are not captured physical register contents.

Only actual frontend collection establishes source custody. Exported KIR,
LLVM, descriptors and handoff bytes remain observations, not authority to
resume protected compilation, link, load or launch. General assembly-to-Rust
decompilation, mutable resume, physical-resource visualization, `gfx950`,
broader instruction/memory vocabularies, descriptor-bearing worker-module native
qualification and GPU execution remain
outside this bounded increment.

## Implementation references

The [source command](https://github.com/harsh-nod/fe2o3/blob/76fe660d9ef27961ec764c5cec1b7b79e6321a33/scripts/complete-body-source-v19.mjs),
[compiler walkthrough](https://github.com/harsh-nod/fe2o3/blob/76fe660d9ef27961ec764c5cec1b7b79e6321a33/docs/complete-body-source-v19.md)
and [fixture manifest](https://github.com/harsh-nod/fe2o3/blob/76fe660d9ef27961ec764c5cec1b7b79e6321a33/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/Cargo.toml)
pin the published implementation. Earlier working-tree qualification and later
merged-tree regression scopes are retained separately in the dated record.
The script must fail rather than report success if these files or the matching
backend/wrapper are absent. Keep every failure and its exact phase.
