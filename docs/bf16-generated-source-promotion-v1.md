# Publish BF16 helper source and verify a fresh compilation

Follow one Rust matrix expression into a compiler-published helper, then check
that helper in a fresh Rust compilation. Identity preserves the returned
component order; Swap01 deliberately changes it. The CPU comparison checks
that difference.

The [compiler implementation](https://github.com/harsh-nod/fe2o3/commit/254eb55f43aabc40b627d5dca2e80725b52ac599)
contains the adapters. The completed campaign covered a specific recorded
source tree, not every later checkout. The earlier campaign is CPU-only qualification, not a successful normal BF16
compilation. A later [public source-only driver](https://github.com/harsh-nod/fe2o3/commit/89e06d9619ef89302e1399906b293a86f6f4d6ad)
now supports inspection and explicit publication through the actual extractor
binary. These remain separate from fresh-candidate CPU qualification.

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

## Understand the earlier CPU checks

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

## Use the public source action

The [compiler guide](https://github.com/harsh-nod/fe2o3/blob/main/docs/bf16-source-authoring.md)
documents the actual `fe2o3-rustc-extract` interface and defines
`bf16_source_action`, a local Bash function over that public binary.
It starts with a provisioned Linux compiler, a matching dynamic backend/runtime,
and the complete current rustc argument array for your package. It is not a
clean-checkout setup or a qualification of the full Cargo wrapper pipeline.

Use the exact original fixture at `original/src/lib.rs` under your own task
directory. Bind `BF16_WORK`, `BF16_EXTRACTOR`, `BF16_RUSTC_ARGS` and
`BF16_TUTORIAL` as described in the guide; the latter points to this tutorial
checkout. Do not copy historical artifact paths or invocation salts.
After defining the guide's function and changing to `BF16_WORK`:

~~~bash
bf16_source_action "$BF16_WORK/inspect"

mkdir -p identity/src swap01/src

node "$BF16_TUTORIAL/examples/bf16-generated-source/make-request.mjs" \
  "$BF16_WORK/inspect/observation.json" identity \
  "$BF16_WORK/identity.request.json"

bf16_source_action "$BF16_WORK/publish-identity" \
  "$BF16_WORK/identity.request.json"

node "$BF16_TUTORIAL/examples/bf16-generated-source/make-request.mjs" \
  "$BF16_WORK/inspect/observation.json" swap01 \
  "$BF16_WORK/swap01.request.json"

bf16_source_action "$BF16_WORK/publish-swap01" \
  "$BF16_WORK/swap01.request.json"
~~~

Stop on every nonzero exit. The public inspection uses
`FE2O3_EXTRACT_BF16_TILE_SOURCE_DIRECTORY_V1`; publication additionally requires
`FE2O3_EXTRACT_BF16_TILE_PROMOTION_REQUEST_V1`. The output directory, request and
candidate names must be new. The source action never overwrites the original.

The [request helper](../examples/bf16-generated-source/make-request.mjs) only
copies the four fresh inspection selectors into a bounded request for this
lesson. It does not invoke a compiler, validate source authenticity or grant
permission to resume an IR object. The public publisher rechecks the selected
live source. In particular, `canonical_sha256` is the compiler identity, not
SHA-256 of serialized kernel IR.

Read the [inspection example](../examples/bf16-generated-source/public-inspection.example.json)
and the [Identity](../examples/bf16-generated-source/public-identity-request.example.json)
and [Swap01](../examples/bf16-generated-source/public-swap01-request.example.json)
request examples to understand the fields. They are pretty-printed historical
data, not reusable current requests. Regenerate selectors from your own
successful inspection; never submit an example file as current authority.

Success requires process exit zero plus the report's
`status: "candidate_created"` and `source_postflight_ok: true`.
The publication still says `candidate_compiled: false` and
`fresh_compilation_required: true`. It is not a public CPU replay command.
Preserve every candidate and diagnostic after failure: a report can retain
`may_have_created_candidate` even when the operation failed, and a missing
report after an abort or kill does not prove rollback.

## Distinguish the public qualification

A later, separately audited campaign invoked the actual public binary:
13 supervised processes covered one inspection, two publications and two
fresh-candidate compiler sessions, plus preparation. Those fresh sessions
produced 36 positive CPU requests and 32 expected CPU refusals, with two
105,440-byte sidecars. This is separate from the earlier 72-positive,
64-refusal campaign above; the public source commands do not themselves run
those CPU requests.

A second nine-process cohort verified malformed JSON, stale MIR selection,
an existing candidate path and a request without source-output mode.
The existing file retained its bytes and inode. Its failure conservatively
reported `may_have_created_candidate`. The
[public evidence summary](../examples/bf16-generated-source/public-evidence.json)
records the exact audit and receipt hashes, tested source census and limits.

## Check the lesson without claiming a replay

From this tutorial repository, using its supported Node version:

~~~bash
node --test examples/bf16-generated-source/tutorial.test.mjs
~~~

These are inert content, request-construction and bounded file-I/O tests.
They do not compile Rust or replay a numerical campaign.

In a provisioned Linux compiler checkout, this focused unit-only command remains
useful:

~~~bash
cargo +nightly-2026-04-03 test --offline --locked -j2 \
  -p rustc-codegen-fe2o3 --lib gfx942_bf16_generated \
  -- --nocapture
~~~

Use the compiler's existing Linux setup, including nightly components,
`rustc-dev`, `rust-src`, library paths and offline cache. The command omits
`--ignored`; genuine frontend entrypoints remain skipped. The private supervised
parent is qualification tooling, not a user-facing reproduction command.

At the qualified revision, fresh helper observation still reaches the explicit normal-route refusal
`BF16 nominal source-ranked projection`. CPU success does not establish LLVM
emission, native execution, GPU launch, whole-action memory bounds or milestone
completion. See the separate
[earlier helper observation lesson](bf16-helper-source-cpu-observation-v1.md)
for its historical evidence; this example does not replace it.
