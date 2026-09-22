# Lab: turn a Rust bitselect into an editable ordered assembly expression

This lab follows one bounded authoring path: start with Rust, publish a distinct
Rust candidate containing an ordered assembly expression, edit its register
bindings, and compile the actual edited source afresh. The public entry is
`run_bitselect_source_promotion_driver_v1`, an experimental Linux Rust API.
It is not a general source-to-assembly converter or a new command-line tool.

The steps below describe expected observations and acceptance requirements, not
a claim that a particular run passed. Publishing this lab requires fresh
qualification of the normal API call, unedited and edited source compilation,
independent simulation, and the resulting native artifacts. Historical private
prototype receipts are not substitutes.

Read the compiler's [bounded source-promotion contract][contract] alongside
this lab. Use one consistent fe2o3 source revision for the API, provider,
consumer and acceptance harness.

## 1. Start with the supported Rust kernel

The [actual input fixture][original] contains this kernel, using its
`source-bitselect-feasibility` feature:

```rust
use fe2o3_device::{DisjointSlice, kernel, thread};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn choose_bits(mut output: DisjointSlice<u32>, a: u32, b: u32, mask: u32) {
    let selected = b ^ ((a ^ b) & mask);
    let index = thread::index_1d();
    if let Some(slot) = output.get_mut(index) {
        *slot = selected;
    }
}
```

The selected profile is exactly `gfx942:xnack-`, wave64, with required and
maximum launch bounds `[64, 1, 1]`. The kernel must be the sole sealed,
local, nongeneric root. Its sole eligible top-level immutable initializer must be the
direct typed-`u32` expression shown above, reading three distinct immutable
formal parameters at ordinals 1, 2 and 3.

The compiler identifies that initializer through genuine current typed HIR and
its semantic/Kernel IR checks. Passing a matching string, source range, old
compiler snapshot or hand-written identity record does not select a region.
Aliases, multiple eligible initializers, unsupported effects and ambiguous
source attribution are refused. This lab does not broaden support to gfx950
or arbitrary expressions.

### Optional: preserve a live Rust prefix

The selected initializer need not be the first statement. For a bounded
surrounding-source exercise, keep the same kernel signature and attributes and
use this body:

```rust
let tag = a | mask;
let selected = b ^ ((a ^ b) & mask);
let index = thread::index_1d();
if let Some(slot) = output.get_mut(index) {
    *slot = selected ^ tag;
}
```

Only the `selected` initializer is replaced. The live `tag` computation and
checked output path remain ordinary Rust, with their original bytes preserved
outside the replacement. The later register-only edit must preserve those same
prefix and suffix bytes as well.

At most eight preceding immutable, plain `u32` bindings are eligible. Each must
be one direct AND, OR or XOR of the original immutable formal operands `a`,
`b`, and `mask`; no operand may depend on an earlier local. Binding names
cannot shadow any formal, another prefix binding, or the selected result.
Aliases, nested prefix expressions, mutable bindings, calls, macros, branches,
memory effects, source normalization and a second eligible bitselect remain
outside this profile. The current semantic/Kernel IR join must still identify
exactly the three selected contiguous operations in the entry block.

This HIR grammar is necessary, not sufficient. Optimized MIR can reuse an
earlier identical expression such as `a ^ b`, removing the selected inner
operator's exact source attribution. The bounded publisher then refuses with
`source-boundary exact HIR operator/semantic span absent` during eligibility,
before publication is attempted. Matching values, a similar instruction, or a
hand-written source location cannot replace the missing join. Keep the failure
and original source; do not weaken attribution checks to force a candidate.
The eight-binding limit is a source boundary, not a promise that eight machine
instructions survive optimization.

## 2. Ask the public Rust API to publish a candidate

Use the repository's pinned `nightly-2026-04-03` toolchain and required
`rustc-dev`/`rust-src` components. The backend uses rustc-private interfaces;
an unrelated stable toolchain or another nightly is not interchangeable.
The checked-in [normal-dependency consumer][consumer] has
`#![feature(rustc_private)]`, explicit normal dependencies on
`rustc-codegen-fe2o3` and `fe2o3-kernel-ir`, and its own workspace boundary.

The following is an integration excerpt, not a complete provider invocation.
The caller supplies the SHA256 of the exact original bytes and the complete
current targeted rustc arguments obtained through the existing provider:

```rust
use fe2o3_kernel_ir::Gfx942OrderedProgramRegistersV1;
use rustc_codegen_fe2o3::{
    BitselectPromotionFailureV1, BitselectPromotionRequestV1,
    PublishedBitselectCandidateV1, run_bitselect_source_promotion_driver_v1,
};

fn promote(
    rustc_args: &[String],
    original_sha256: [u8; 32],
) -> Result<PublishedBitselectCandidateV1, BitselectPromotionFailureV1> {
    let registers = Gfx942OrderedProgramRegistersV1::new(4, 5, [0, 1, 2])
        .expect("five distinct register roles below 64");
    let request = BitselectPromotionRequestV1::new(
        "src/original.rs",
        "src/candidate.rs",
        original_sha256,
        registers,
    )?;
    let attempt = run_bitselect_source_promotion_driver_v1(rustc_args, request);
    let (_original_request, result) = attempt.into_parts();
    result
}
```

Here the constructor arguments are scratch VGPR 4, output VGPR 5, and input
VGPRs 0, 1 and 2. All five register roles must be distinct and below 64.

The source SHA is a revision-conflict precondition, not authentication of the
source or its dependencies. Keep the provider metadata, original file, working
directory, environment and targeted invocation consistent. The driver also
checks the canonical overflow-check setting and live target/closure; a made-up
argument list containing only a GPU target flag is insufficient. Own the
external deadline and use an isolated invocation, not concurrent in-process
rustc sessions or global-environment changes.

Both paths must obey the existing relative `.rs` path policy and be distinct.
The candidate destination must be absent. Success publishes a private
mode-0600 candidate without replacing an existing destination and preserves the
surrounding Rust. The result's `original_sha256()`, `candidate_sha256()`,
`candidate_bytes()` and `registers()` describe that publication observation.
They do not grant permission to compile, resume a session or launch a kernel.

This call does not automatically compile the candidate or simulate it. Its live
compiler owner is consumed internally; it is not returned to the caller.

## 3. Read the generated expression

For that register plan, the generated initializer is:

```rust
let selected = fe2o3_device::amdgpu_ordered_program! {
    gfx942_xnack_off_wave64;
    scratch(4); out(5);
    in(0) = a;
    in(1) = b;
    in(2) = mask;
    xor(scratch, input0, input1);
    and(scratch, scratch, input2);
    xor(out, input1, scratch);
};
```

The three ordered operations implement the original bitselect. The rest of the
kernel still computes the thread index and writes `selected` through the
original checked output path. In the optional prefix example, that unchanged
path instead writes `selected ^ tag`; the promotion does not discard the prefix
effect. This is a Rust source file containing a typed ordered region, not a
detached machine-code blob.

First compile the unedited candidate through the existing ordinary source-input
path. This establishes a new typed/semantic/Kernel IR ownership chain from the
actual bytes read. Do not treat the publication result or an old observation
JSON as the input to compiler admission.

## 4. Make the supported register-only edit

Keep the original and first candidate. Create a distinct edited source file,
and change only these five bindings:

```rust
let selected = fe2o3_device::amdgpu_ordered_program! {
    gfx942_xnack_off_wave64;
    scratch(32); out(33);
    in(34) = a;
    in(35) = b;
    in(36) = mask;
    xor(scratch, input0, input1);
    and(scratch, scratch, input2);
    xor(out, input1, scratch);
};
```

The matching checked plan is
`Gfx942OrderedProgramRegistersV1::new(32, 33, [34, 35, 36])`.
The arithmetic and parameter meanings are unchanged. This exercise does not
qualify arbitrary instruction replacement, aliased registers or another target.

Compile the edited file in a fresh session, then repeat that compilation in
another fresh session. Editing changes the source identity; the old candidate
SHA cannot authorize the edited file. The acceptance harness requires default
and edited source/semantic/Kernel IR/LLVM identities to differ, edited/repeat
observations to agree, and the kernel interface descriptors to remain equal.

## 5. Check the whole kernel and resulting machine code

The checked-in [normal-entry machine ladder][machine] provides the concrete
default/edit/repeat exercise. A successful execution must record one external
normal-library publication, six fresh source callbacks, three successful fresh
compilations and three specific refusals. These are assertions to verify in
new results, not counts supplied by this document.

For each successful compilation, the current ladder runs 30 whole-kernel
simulations: five input triples, lengths 0/1/65 and two replays. Across default,
edited and repeat this is 90 runs. Its independent oracle is:

```rust
(a & mask) | (b & !mask)
```

Checks include output values, initialization, surrounding canaries, request
immutability and repeat identities. Do not report the simulator's incomplete
conflict coverage as complete race-freedom proof, or simulation as GPU execution.

Next, native checks must consume the actual newly emitted `positive/default.ll`
and `positive/edited.ll` from that run. At O0 and O3, inspect the resulting
target/export/undefined-symbol/metadata boundaries, exact contiguous
XOR/AND/XOR instructions and physical operands, result use, and descriptor
capacity. The low plan needs coverage through VGPR 5 (high water 6); the high
plan needs coverage through VGPR 36 (high water 37). Encoded whole-kernel
capacity can be larger and differ across optimization levels.

Use the bitselect-specific native acceptance route. The repository's generic
two-operation XOR/ADD source checker is not a substitute for this three-op
program. Retain the new LLVM, selected tools and native reports, including code-object
hashes and selected instruction bytes. The retained checker CLIs report these
observations but do not persist complete code objects; do not claim full-object
retention from their JSON. If a separately supported route exports the code
object, retain it as well. Never relabel an old producer's results as checks of
the current candidate. Native inspection is not a proof of physical register
lifetimes, protected finalizer admission or hardware correctness.

### Qualify the optional prefix separately

The prefix ladder must obtain its initial candidate through the same separately
built normal-library consumer. It then compiles default, register-edited and
repeated candidates in three fresh callbacks. Its expected 90 whole-kernel
simulations use this independent oracle, not the prefix-free result above:

```rust
((a & mask) | (b & !mask)) ^ (a | mask)
```

Require complete outputs, initialization, canaries, unchanged inputs, and exact
prefix/suffix source retention. The ladder also has 17 direct public-API control
sessions: one eight-binding publication and 16 specific refusals, including the
nine-binding limit and a retained attribution-collision case. Those controls
run in the backend test process; they are not 17 external normal-consumer runs.
The eight-binding positive checks publication only, not a fresh compilation or
native qualification of that particular eight-binding kernel.

Native checks for the live-prefix candidates must consume that run's
`positive/prefix-default.ll` and `positive/prefix-edited.ll` at O0 and O3.
Do not substitute the prefix-free LLVM or historical reports. These are
acceptance requirements; this tutorial does not assert that the new prefix
ladder, its controls, or its native artifacts have passed qualification.

For recorded helper/caller navigation, see the separate
[recorded occurrence lab](recorded-runtime-occurrence-lab-v1.md). Its loop/helper
recording is a different fixture, not an execution trace of this bitselect.

## Where this sits in the compilation pipeline

```text
original Rust
  -> fresh typed HIR and semantic/Kernel IR checks
  -> distinct generated Rust candidate
  -> optional supported register edit
  -> separate fresh source compilation
  -> typed ordered region in constrained LLVM inline assembly
  -> normal native compilation and final-artifact inspection
```

The promotion operation uses the existing transaction, semantic middle end,
SSA/materialization and general kernel checks before its narrow eligibility
join and publication. It does not create an alternate unchecked compiler.

LLVM IR is not bypassed. The ordered region lowers to constrained inline
assembly; LLVM continues handling the surrounding kernel. Register/instruction
choices inside that region do not control the entire final machine program.

You can manually replace this expression with equivalent Rust and compile
again. There is no general inverse lift from arbitrary assembly to Rust, no
guaranteed round trip preserving arbitrary edits, and no ability to resume a
historical compiler owner at another abstraction level.

## Reproduce the focused acceptance path

Work from the matching fe2o3 checkout, not this website repository. The ordinary
external package manifest is:

```text
crates/rustc-codegen-fe2o3/tests/fixtures/source-bitselect-headless-consumer/Cargo.toml
```

Its `fe2o3-source-bitselect-headless-consumer` binary only checks inert request
handling, pre-file/pre-compiler refusal and boxed standard-error propagation.
That smoke is not a successful source promotion. Its separate
`fe2o3-source-bitselect-promote-once` binary is the fixed-profile positive
[consumer fixture][positive-consumer], not a supported product CLI. The
machine ladder obtains authentic current provider arguments and invokes this
normal binary; callers should not invent or replay the argument records.

Build the backend and consumer normally, without `--cfg test` or backend
dev-dependency assistance. Select their real output paths from current Cargo
artifact records. Generate the independent consumer lock offline only as an
explicit first-time setup step when absent; subsequent builds use the retained
lock with `--offline --locked`. Keep a pinned runtime loader environment,
bounded process supervision and fresh, task-owned output paths. Never replace
missing dependency metadata with fabricated observations.

The backend harness selector prefix is exactly:

```text
production_rustc_driver_v1::source_bitselect_feasibility_v1_tests::roundtrip
```

Append `::` and one suffix below. Each is an ignored parent test intentionally
selected for actual execution using `--exact`, `--ignored`, `--nocapture`
and `--test-threads=1` on the freshly built, measured backend test harness.

| Selector suffix | Required fresh-output environment | Intended coverage |
| --- | --- | --- |
| `headless::actual_source_bitselect_headless_ladder` | `FE2O3_TEST_SOURCE_BITSELECT_ROUNDTRIP_OUTPUT` | Five promotion cases and a separate fresh positive callback. |
| `machine::headless_machine::actual_source_headless_machine_ladder` | `FE2O3_TEST_SOURCE_HEADLESS_MACHINE_OUTPUT`, plus `FE2O3_TEST_SOURCE_HEADLESS_CONSUMER` pointing to the new normal positive consumer | Normal public entry, default/edit/repeat, independent simulator and three refusals. |
| `machine::headless_machine::prefix::actual_source_headless_prefix_ladder` | `FE2O3_TEST_SOURCE_HEADLESS_PREFIX_OUTPUT`, plus `FE2O3_TEST_SOURCE_HEADLESS_CONSUMER` pointing to the new normal positive consumer | Live prefix, normal publication, three fresh candidates/90 simulations, and 17 direct public-API controls. |
| `headless::live_failures::actual_source_bitselect_live_failure_ladder` | `FE2O3_TEST_SOURCE_HEADLESS_LIVE_OUTPUT` | Test-only repeated-callback and postpublication source-change controls. |
| `headless::live_failures::actual_source_bitselect_post_callback_fatal_ladder` | `FE2O3_TEST_SOURCE_HEADLESS_FATAL_OUTPUT` | Two genuine rustc fatal outcomes after inner callbacks. |

Output directories must be fresh absolute paths satisfying the harness's
existing path guards. Use separate directories for separate ladders and retain
failed runs. The parent prepares its actual source/provider inputs; do not
invoke unprepared child selectors directly. One passed parent and zero ignored
is necessary but insufficient: also inspect its actual callback/case counts,
source joins and retained artifacts. An empty filter result is not a pass.

Unit filters `source_bitselect_promotion_v1::tests::`, `source_boundary_`
and `source_candidate_` cover narrower contracts; they cannot substitute for
the normal external process, fresh-source ladder or native checks. Callback
fault probes are absent from normal builds and are not public author controls.

## What refusals mean for an author

| Observation | Where it is checked |
| --- | --- |
| Duplicate/out-of-range register roles or invalid/same source paths | Checked plan/request construction. |
| Wrong target/launch, ambiguous initializer or stale original | Actual source eligibility and retained-source checks. |
| More than eight prefix bindings, an unsupported prefix, or selected operator attribution lost during optimization | Typed-HIR eligibility and the current source/semantic/Kernel IR join, before publication. |
| Mismatched register plan, wrong output or stale edited file | Fresh candidate checks and independent whole-kernel oracle. |
| Unexpected native instructions, physical operands or insufficient descriptor capacity | Separate inspection of the actual new native artifact. |
| Existing candidate, late source mutation or caught rustc fatal | Typed publication/failure handling; inspect retained files. |

Inspect a failure's `phase()`, `publication()` and `compiler_fatal()`.
`Display` and `std::error::Error` expose the same bounded diagnostic.
`NotAttempted` means this attempt did not reach publication; it does not mean
the destination was absent beforehand. `MayHaveCreatedCandidate` is
conservative: publication was invoked, or an entered callback did not finish.
An existing-destination refusal can therefore have that state without creating
a new file.

Publication can succeed before a later recheck or fatal refusal. Preserve the
first diagnostic, inspect the actual retained original/candidate and decide
explicitly what to do next. Do not blindly retry, overwrite or delete a candidate
on error. Ordinary panics, aborts and crashes are not guaranteed typed outcomes;
there is no rollback or crash-cleanup promise.

The injected directory-sync refusal is dependency-local component coverage, not
an observed OS failure through the public entry. Neither this authoring path
nor its diagnostic reports provide live-debugger command authority, snapshot
resume, automatic kernel launch or evidence of a hardware run.

[contract]: https://github.com/harsh-nod/fe2o3/blob/main/docs/source-bitselect-promotion-v1.md
[original]: https://github.com/harsh-nod/fe2o3/blob/main/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/source_bitselect_feasibility.rs
[consumer]: https://github.com/harsh-nod/fe2o3/tree/main/crates/rustc-codegen-fe2o3/tests/fixtures/source-bitselect-headless-consumer
[positive-consumer]: https://github.com/harsh-nod/fe2o3/blob/main/crates/rustc-codegen-fe2o3/tests/fixtures/source-bitselect-headless-consumer/src/bin/promote_once.rs
[machine]: https://github.com/harsh-nod/fe2o3/blob/main/crates/rustc-codegen-fe2o3/src/production_rustc_driver_v1/source_bitselect_headless_machine_v1_tests.rs


Dated test results and their limits are recorded in the
[September 22 qualification](source-values-qualification-20260922.md).
