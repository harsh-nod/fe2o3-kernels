# Publish BF16 helper source and verify a fresh compilation

Follow one Rust matrix expression into a compiler-published helper, then check
that helper in a fresh Rust compilation. Identity preserves the returned
component order; Swap01 deliberately changes it. The CPU comparison checks
that difference.

The [compiler implementation](https://github.com/harsh-nod/fe2o3/commit/254eb55f43aabc40b627d5dca2e80725b52ac599)
contains the adapters. The completed campaign covered a specific recorded
source tree, not every later checkout. This is CPU-only qualification, not a
public authoring command or a successful normal BF16 compilation.

## Compare the three source files

Read [original.rs](../examples/bf16-generated-source/original.rs),
[identity.rs](../examples/bf16-generated-source/identity.rs) and
[swap01.rs](../examples/bf16-generated-source/swap01.rs). They are exact copies
of the original and the two compiler-published candidates, not reconstructed
examples. The adjacent content tests pin all three complete files by SHA-256.

The original kernel loads two row-major 16-by-16 BF16 matrices from readonly
`&[u16]` inputs, uses a zero F32 accumulator, and evaluates:

~~~rust
let result = matrix
    .multiply_accumulate(lhs, rhs, accumulator)
    .into_values();
~~~

The published Identity candidate moves that expression into this nested helper:

~~~rust
#[inline(never)]
fn __fe2o3_bf16_tile_identity<'wave>(
    matrix: &::fe2o3_device::DeviceMatrix,
    lhs: ::fe2o3_device::Bf16MfmaAFragment<'wave>,
    rhs: ::fe2o3_device::Bf16MfmaBFragment<'wave>,
    accumulator: ::fe2o3_device::F32AccumulatorFragment<'wave>,
) -> [f32; 4] {
    let values = matrix.multiply_accumulate(lhs, rhs, accumulator).into_values();
    [values[0], values[1], values[2], values[3]]
}
~~~

The caller passes `&matrix, lhs, rhs, accumulator`. Swap01 uses its own helper
name and returns `[values[1], values[0], values[2], values[3]]`.
Neither change alters the matrix operation itself.

All three kernels retain the guarded `*output = result[0]` store. Identity
therefore stores matrix component 0; Swap01 stores matrix component 1 through
returned component 0. These are logical values, not physical VGPR assignments.
The fixture is not a complete GEMM output kernel: components 1–3 are observed,
but no additional stores are invented.

## Follow the ownership boundary

The publisher borrows the actual compiler-owned source, MIR and verified kernel
IR under the original resource ledger. It authenticates the selected expression
before creating a separate source file. A filename, hash or exported report
cannot substitute for that owner.

A separate package and compiler invocation then read the published candidate.
They establish a fresh source owner, helper signature, actual Rust ABI and
kernel IR Call/Return association. The original owner is not reused as proof
that the edited source is valid.

| Session | Source being executed | Expected CPU component order |
| --- | --- | --- |
| Original publishing Identity | Original expression | Identity |
| Fresh Identity | Published Identity helper | Identity |
| Original publishing Swap01 | Original expression | Identity |
| Fresh Swap01 | Published Swap01 helper | Swap01 |

Publishing Swap01 does not retroactively modify the original execution.
Nonsymmetric inputs distinguish the two fresh results.

## Understand the completed CPU checks

The audited campaign completed 12 supervised child processes and four actual
compiler sessions, with two publications and two fresh candidates. Each session
ran six integer-valued matrix patterns at output lengths 64, 13 and 0:
18 positive requests and 16 expected refusals, totaling 72 positives and
64 refusals.

Four complete 105,440-byte binary records retain the actual matrix and
caller-visible values for all 64 lanes, allocation identities, input/output
backings, initialization bits and ordered stores. An independent dense oracle
checks every value, both 512-byte input backings, and the complete 272-byte
output backing, including canaries and unwritten bytes. Even output length zero
still requires the matrix computation.

This is the bounded gfx942 BF16/F32 m16n16k16 Wave64 profile with integer inputs
in `[-16, 16]` and zero accumulator—not general BF16 rounding or hardware
execution. The unchanged source requires a single `[64, 1, 1]` workgroup and
`max_grid = [1, 1, 1]`. Disabled alternate-source features in the copied files
were not additional qualified variants.

## Check the lesson without claiming a replay

From this tutorial repository, using its supported Node version:

~~~bash
node --test examples/bf16-generated-source/tutorial.test.mjs
~~~

These are inert content and pin tests. They do not compile Rust or replay the
numerical campaign.

In a provisioned Linux compiler checkout at the linked revision, a focused
unit-only command is:

~~~bash
cargo +nightly-2026-04-03 test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib gfx942_bf16_generated \
  -- --nocapture
~~~

Use the compiler's existing Linux setup, including nightly components,
`rustc-dev`, `rust-src`, library paths and offline cache. The command omits `--ignored`; genuine frontend entrypoints remain skipped.

The successful campaign used a private supervised parent that is not yet a
committed, publicly reproducible CLI. A public end-to-end driver remains a gap;
there is no equivalent invocation to copy from this lesson.

Fresh helper observation still reaches the explicit normal-route refusal
`BF16 nominal source-ranked projection`. CPU success does not establish LLVM
emission, native execution, GPU launch, whole-action memory bounds or milestone
completion. See the separate
[earlier helper observation lesson](bf16-helper-source-cpu-observation-v1.md)
for its historical evidence; this example does not replace it.
