# Carry a borrowed BF16 region into the normal compiler path

This is a **compiler-developer qualification tutorial**, not a public tiled-kernel
CLI. At compiler commit
[2af2a8d7dc75d8edac3da50325c91ea1911f8324](https://github.com/harsh-nod/fe2o3/commit/2af2a8d7dc75d8edac3da50325c91ea1911f8324),
the finite BF16 inspection fixture continues through the mandatory normal
compiler stages in the **same compilation**. The two-session gate passed direct
compilation and an early wrong-launch refusal. It does not execute a GPU kernel.

The [earlier inspection checkpoint](tiled-region-inspection-checkpoint-v1.md)
remains historical at `1b2e5dd364e63c5d107115f379e9c21a6a84236e`.
Its four-session core measured inspection, launch refusal, callback error and
callback panic. The normal continuation described here is a separate later gate;
it does not retroactively turn the earlier source-only observation into a normal
handoff.

## 1. Start with the exact finite Rust fixture

Read the pinned
[fixture](https://github.com/harsh-nod/fe2o3/blob/2af2a8d7dc75d8edac3da50325c91ea1911f8324/crates/rustc-codegen-fe2o3/tests/fixtures/tiled-region-inspection-v1/src/lib.rs).
It takes two readonly `&[u16]` inputs, one `DisjointSlice<f32, Index1D>`
output and a scalar selector. The direct feature declares WG64 and
`max_grid = [1, 1, 1]`. It creates the actual A/B BF16 fragments and a zero
F32 accumulator, then uses this body excerpt:

```rust
let result = matrix
    .multiply_accumulate(lhs, rhs, accumulator)
    .into_values();
if let Some(output) = out.get_mut(thread::index_1d()) {
    *output = result[0];
}
```

Only one result component is stored. This is not a complete GEMM or a numerical
correctness result. The `wrong-launch` feature changes the authored maximum
grid to `[2, 1, 1]`; the inspection profile refuses it before its callback.
The gate does not replace that declaration with a synthetic one-workgroup bound.

## 2. Follow the live owner across the boundary

The inspection callback borrows the actual source spans, nominal values, SSA
producers and emission correspondence. When it returns, the same materialized
owner is consumed through ranked checks, target-neutral attachment,
formal-memory admission, target lowering and the existing inert V2 worker
handoff. The normal path is not reconstructed from the copied inspection JSON.

Before target consumption, the test compares the **full original V12 identity**,
including canonical byte length. The target's reported canonical version is 8;
it is a separate normal-target observation, not a replacement identity for the
original V12 owner. The first materialization phase retains its original
cumulative ledger. Later stages retain their existing accounting; this is not
one compiler-wide meter.

## 3. Run the contributor gate, not a public CLI

Use a clean compiler checkout of the commit above, on the compiler's supported
Linux contributor setup. Install the repository's pinned
`nightly-2026-04-03` toolchain with `rustc-dev` and `rust-src` beforehand,
and provision its offline dependency cache. These commands compile tests and
a fresh device dependency tree; they do not install tools, invoke a debugger,
launch a kernel or promote a tiled source. They are not a browser/lab command.

Run from the compiler repository root, not this tutorial site:

```bash
BF16_SYSROOT="$(rustup run nightly-2026-04-03 rustc --print sysroot)"
export RUSTC="$BF16_SYSROOT/bin/rustc"
export LD_LIBRARY_PATH="$BF16_SYSROOT/lib"

"$BF16_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib \
  gfx942_tiled_region_qualification_v1_tests::observation::normal \
  -- --nocapture

BF16_QUAL_WORK="$(mktemp -d /tmp/fe2o3-bf16-normal.XXXXXX)"
export FE2O3_TEST_TILED_REGION_OUTPUT_V1="$BF16_QUAL_WORK/normal"

"$BF16_SYSROOT/bin/cargo" test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib \
  production_rustc_driver_v1::gfx942_tiled_region_qualification_v1_tests::observation::normal::actual_bf16_normal_ladder \
  -- --exact --ignored --nocapture
```

The first command runs four active observation controls and skips the two
ignored entrypoints. The second runs the parent ladder, which starts exactly
two actual rustc sessions and requires one genuine callback per session. Its
original limits remain 300 seconds per child and 1,200 seconds for the parent,
including rechecks and publication. Cleanup observations cover the existing
direct-child/process-group helper, not whole-family supervision.

The output directory must not already exist and must be outside the compiler
checkout. A rerun needs a new `mktemp` parent; retain a failed run's diagnostics.
A partial output or JSON `qualified` field is not success: require the parent
test to finish successfully, and preserve its terminal stdout/stderr.

## 4. Read three separate artifacts and the remaining obligations

The successful direct case retains and reads back:

| Artifact | Observed bytes | Meaning |
| --- | ---: | --- |
| `direct.normal.ll` | 52,795 | Ordinary compiler LLVM, with one expected MFMA intrinsic call |
| `direct.worker.ll` | 61,355 | The same LLVM prefix plus compiler descriptor assembly |
| `direct.handoff-v2.bin` | 61,654 | Inert V2 envelope carrying exactly the worker LLVM |

These byte counts identify the retained qualified run, not a promise that every
future compiler produces identical text. The parent joins each digest and
readback before accepting the union, including a recheck after the wrong-launch
child. The V2 handoff grants no compiler, worker or launch authority. Neither
its decoder nor a digest recreates the live source owner.

Open `observation.json` and compare `direct.accepted.json` with the raw
`direct.observed.json` and terminal stream. The raw observation deliberately
remains `accepted: false`: acceptance requires the completed parent.
The direct target reports twenty correspondence blocks, three formal
allocations, nine accesses and eight ranked discharged bounds.
**One runtime bounds requirement and two runtime alias requirements remain.**
They were not discharged by a host launch. Wrong-launch must have no inspection
snapshot, no original-owner identity and no output-publication attempt.

The retained run's source census is
`1d72adaf5ee7ff6da050aa8e856ee5ce8480ecb41d8776aab1968dbd13884659`;
its 180,348-byte completed root receipt has SHA-256
`ce2b72e8d05a6d5850e91bc39ee6912448cf78603d33dabe96cd892de3ad181e`.
The 26,791-byte report has SHA-256
`9ba72e9b492666b3be9dea5c490710b5f9d988a1821dc92aa19efd76bfc60cd7`.
The [published compiler record](https://github.com/harsh-nod/fe2o3/blob/2af2a8d7dc75d8edac3da50325c91ea1911f8324/docs/source-transport-tiled-debugger-qualification-20260924.md#same-owner-bf16-normal-continuation)
attributes that gate to its own source snapshot, not automatically to every
byte of the later publication commit. These hashes are locators, not authority.

## 5. Keep the next steps separate

There is **no public tiled CLI or tiled profile promotion** in this checkpoint.
Numerical CPU qualification is false; native execution is false. An emitted MFMA
call alone proves neither numerical behavior nor final-machine equivalence.
The failed alias-shape gate is still failed; alias/phi/loop/retained-memory
coverage, tiled editing and fresh edited-tile qualification remain unfinished.

Accepted exits remain **M1/V1/V2/U1/U2/U3 (6/18)**; **M2/U4/V4 remain open**.
This extension changes no `FE2O3_PIN`, live route or lab maturity.
