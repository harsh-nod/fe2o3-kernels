# Publish BF16 helper source and verify a fresh compilation

Status update, 2026-10-01: bounded basic assembly authoring (M2) is accepted in the
[compiler acceptance crosswalk](https://github.com/harsh-nod/fe2o3/blob/8b382d7c4c812b3fcfcbd70191ee401cc1905132/docs/evidence/basic-assembly-m2-acceptance-20261001.md).
The shared ledger is now **7/18: M1, M2, V1, V2, U1, U2, U3**. Older status
counts below describe their recorded checkpoints. This acceptance does not
qualify normal BF16 compilation, protected production publication, general
instruction coverage or physical debugger capture. This lesson's source,
compiler and evidence pins remain unchanged.

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


## Run the five-action Cargo workflow

The [public Cargo implementation](https://github.com/harsh-nod/fe2o3/commit/d125dd02b91f60756c052f5d9f734d24731765cc)
adds a complete public source-action sequence: one original inspection, two
source publications, and two fresh generated-source inspections. It uses real
Cargo wrapper invocations; you do not reconstruct rustc arguments or set
Cargo's primary-package marker.

Follow the [Cargo setup and workflow guide](https://github.com/harsh-nod/fe2o3/blob/d125dd02b91f60756c052f5d9f734d24731765cc/docs/bf16-cargo-source-workflow.md)
in the compiler repository first. It covers the pinned nightly, rustc-dev,
rust-src, matching extractor/backend libraries, and dependency provisioning.
The workflow is offline after that setup; this is not evidence of an
unprovisioned clean-checkout build.

With the guide's `BF16_REPO`, `BF16_EXTRACTOR`, `BF16_CARGO`, `BF16_RUSTC`
and `BF16_SYSROOT` set to your actual checkout and matching build, run:

~~~bash
BF16_RUN_PARENT="$(mktemp -d)"
BF16_DEADLINE="$(date -u -d '+25 minutes' +%Y-%m-%dT%H:%M:%S.000Z)"

LD_LIBRARY_PATH="$BF16_REPO/target/release:$BF16_SYSROOT/lib" \
node "$BF16_REPO/scripts/bf16-source-workflow.mjs" \
  --repo "$BF16_REPO" \
  --extractor "$BF16_EXTRACTOR" \
  --cargo "$BF16_CARGO" \
  --rustc "$BF16_RUSTC" \
  --work "$BF16_RUN_PARENT/run" \
  --deadline "$BF16_DEADLINE"
~~~

Use an outer supervisor that owns the inherited process group for
qualification, as required by the compiler guide. The helper alone does not
guarantee descendant cleanup after parent death. It retains failure records
and never retries, overwrites a candidate, or deletes an earlier attempt.

The script creates an original package plus separate Identity and Swap01
packages under the new work directory. A single fresh Cargo target directory
is shared by all five actions. Every action must produce a previously absent
report; a cached action that skips its callback fails the workflow.
Generated candidates must match their publication's complete bytes, length,
device and inode, then their fresh admission must match the requested order.

This workflow constructs requests relative to the original package's working
directory: `original_path: "src/lib.rs"` and
`candidate_path: "identity/src/lib.rs"` or `"swap01/src/lib.rs"`.
The earlier lesson's manual request helper uses a different working directory
and `original/src/lib.rs`; do not mix those request layouts.

Two separately retained runs completed all five actual Cargo actions on
MI350. The second run qualified the published code after a non-overlapping
documentation update. It observed Identity `[0, 1, 2, 3]` and Swap01
`[1, 0, 2, 3]`, each through its own fresh frontend. The
[Cargo evidence summary](../examples/bf16-generated-source/cargo-evidence.json)
pins that exact tested source census and retained reports. The qualified
extractor was a debug build; the commands above document how to build and
select a matching release extractor, not a separate release-executable replay.

Read `PASSED.json` only after the command exits zero. The two
`admit-*/observation.json` reports have
`status: "nominal_source_admitted_normal_ranked_refused"`:
fresh source was admitted and a nominal pre-ranked representation materialized,
but normal compilation still refused at
`BF16 nominal source-ranked projection`. This workflow performs no CPU
numerical replay, produces no kernel artifact, and launches no GPU kernel.
It does not replace the earlier independent CPU campaigns or close any
milestone. Canonical identities in the reports are diagnostic copies, not
reusable compiler ownership or SHA-256 hashes of serialized IR.

The source/report/request caps are 64 KiB/16 KiB/8 KiB. There are at most five
direct Cargo actions, five minutes per action, 30 minutes total, an explicit
absolute deadline, 8 MiB per stream, 128 MiB of non-target evidence and a
separate 500 MiB target tree. These sampled bounds are not filesystem quotas,
whole-compiler memory limits, or a complete dependency/runtime inventory.

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

## Later private engineering result — 2026-10-06

A separate bounded engineering campaign now reaches the existing ordinary-v2
Worker from two fresh real-rustc frontends: Identity and Swap01, with two Worker
calls each. Each frontend completed the same-owner checked-output → LLVM →
descriptor → handoff chain, complete retained-byte replay, mandatory source-first
refusals and owner cleanup. The two exact 44-field reports joined their raw
stdout bytes. The enclosing task-local family also completed its terminal
acknowledgement and cleanup; the exact cgroup was subsequently observed absent.

This result is narrower than normal compilation. The word “ordinary” refers
to the Worker entrypoint, not public BF16 admission. The commands above remain
unchanged and still end at the documented normal-ranked refusal. The private
ignored test is not a new tutorial command or permission to reuse its scope.
Raw formal analysis still retains eight guarded-access reasons, one bounds
requirement and two alias duties per frontend. No numerical replay, GPU run,
artifact publication, load or launch was qualified by this campaign; its
reported HSACO identities are not independently retained artifact bytes.

The selected historical compiler ELF SHA256 is
`43f202092d7a77ddca73a476490a622e9757669b9c589fc2cccc17eeea7deec2`.
The complete raw-evidence manifest is
`bf16-engineering-pair-complete-actual-root-r75-r9`, SHA256
`2870b2b3f21e3786fc0058af9602c84ba618d6ec9912938e2fa73055f09ba8c4`;
the independent readback is SHA256
`69c3f0e9b6900939ab8de0ce49e9449272cfcd4cc8012a1336c830f7aaba40d8`.
Production integration and exact target/layout/resource/ISA and numerical
qualification remain separate, including authored gfx950 support. This
private observation does not close M4 or the broader tutorial milestone.

## Private non-test connector checkpoint — 2026-10-07

A later private integration candidate contains the crate-private
`bf16_same_owner_handoff_v1` connector as non-test compiler code. It carries
the actual source owner and original resource account through checked lowering
to an opaque typed handoff; this is distinct from the earlier private Worker
campaign above.

Four fresh compiler observations used matching, freshly prepared dependency
metadata and invocation records. Identity session 1 and Swap01 session 3 each
completed that connector and dropped the handoff. A separate wrong-return
observation for each source required the exact typed source-profile refusal.
Each case entered one real compiler callback.

The public source and Cargo commands in this lesson remain unchanged and still
end at the documented normal-ranked refusal. The private ignored test is not a
new tutorial command. No Worker ran in these four observations; normal/formal
admission, artifact/launch authority and GPU observation all remained false.
This does not qualify numerical results or close M4/U4.

The [compiler checkpoint](https://github.com/harsh-nod/fe2o3/blob/main/docs/generated-bf16-source-and-bindings-qualification-20261001.md#private-non-test-connector-checkpoint--2026-10-07)
records the exact candidate source and ELF, not a blanket claim about later
public merges. Its four-case aggregate SHA-256 is
`14cec9fc3cb545530bf70de26a7878162280bb4e6ad163c0e171aff3333064b7`.
