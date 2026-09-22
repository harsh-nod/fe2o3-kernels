# Lab: specialize a typed scalar assembly helper with a const u32

This workflow turns one retained scalar bitwise operation into a small Rust
helper with a `const C0: u32` parameter. You can keep its original specialization,
change the constant in a new source file, or instantiate it twice in one kernel.
The helper still uses compiler-owned scalar values: `v14` below is a generated
Rust identifier, **not VGPR 14**.

This is separate from the [fixed-register ordered-program lab](ordered-program-authoring-v1.md)
and the [bitselect source-promotion lab](source-promotion-lab-v1.md). It follows
the ordinary Rust/KIR boundary shown by [ordinary source navigation](ordinary-authoring-navigation-v1.md),
but requires a fresh compiler export; that viewer's historical capture is not
an input to the new compilation.

## 1. Inspect the actual ordinary Rust operation

Start from the unchanged compiler fixture:

```text
crates/rustc-codegen-fe2o3/tests/fixtures/ordinary-bitwise-promotion-v1
```

Its relevant source is:

```rust
let low = (a ^ b) & 255;
let result = low | 256;
```

Export the fixture through the normal `fe2o3-export-sim` Bundle V6 path for
`gfx942`, using the matching pinned compiler, its `nightly-2026-04-03` toolchain
and offline dependency/lockfile setup. The effective profile is `gfx942:xnack-`.
Do not edit the fixture or import a hand-written KIR operation.

Feed those exact bundle bytes to `fe2o3-author inspect`, then obtain the complete
`operations` roster with the returned bundle identity. Continue paging until
`next_start` is null; a source range can identify both a constant and its OR,
so do not select solely by the displayed text `low | 256`.

The selector has the existing exact shape:

```json
{
  "bundle_identity": "CURRENT_BUNDLE_IDENTITY",
  "canonical_kir_digest": "CURRENT_CANONICAL_KIR_DIGEST",
  "target": "gfx942:xnack-",
  "operations": [{ "function": 0, "block": 0, "operation": 4 }]
}
```

The uppercase strings are replacement slots, not valid digests. The coordinate
`0:0:4` was observed in the recorded baseline below; discover the actual
coordinate again for your new export. Select the single ordinary `BitOr`, not
the earlier constant or a multi-operation region.

## 2. Ask for a const-specialized helper draft

The additive Rust method is:

```rust
snapshot.materialize_const_u32_helper_v1(&selector, "specialized_or")
```

`snapshot` is an `AuthoringSnapshotV1` created from the exact verified Bundle V6.
The equivalent normal CLI takes the selector JSON as one argument and reads
the bundle from stdin:

```text
fe2o3-author materialize-const-u32 --selector SELECTOR_JSON --helper specialized_or
```

The supported selection is exactly one ordinary or already validated scalar
`u32` AND, OR or XOR, with two distinct inputs and one live result. Exactly one
input must be defined directly by an earlier `Constant::U32` operation in the
same function and block. The retained owner supplies its bits; neither the
selector nor CLI accepts an asserted constant value.

The materializer does not follow copies, casts, block arguments or computed
aliases to discover a constant. Such an input may be an ordinary runtime input,
but is not accepted as the specialized constant. Two direct constants, no
direct constant, a cross-block constant, unsupported types/effects/target, or
a larger selection are refused. Generated source is bounded to 4 KiB.

The actual recorded response produced this exact helper:

```rust
// Diagnostic scalar helper draft; fresh source readmission required.
// gfx942:xnack-; physical allocation remains compiler-owned.
#[inline(never)]
pub fn specialized_or<const C0: u32>(v14: u32) -> (u32,) {
    let v16: u32 = fe2o3_device::amdgpu_asm!(v_or_b32(v14, C0));
    (v16,)
}
```

The response distinguishes the original region's two live-ins from the generated
signature's one runtime parameter and one const parameter. It retains the
constant's definition coordinate and observed original value, `256` in this
capture. Its `original_call_template` is `specialized_or::<256u32>(v14)`.
That `v14` is not an authenticated name in your original Rust source.

This JSON is a diagnostic source draft, not automatic source application.
`frontend_readmission` remains
`not_performed_requires_fresh_source_compilation`; `source_application` remains
`unavailable_requires_explicit_new_source_and_normal_frontend`.

## 3. Put the helper in a new Rust source file

Preserve the original file. For this known fixture, explicitly replace only
`let result = low | 256;` with:

```rust
let result = specialized_or::<256u32>(low).0;
```

Append the exact generated helper. The surrounding kernel remains ordinary Rust:

```rust
#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn bitwise_chain(mut out: DisjointSlice<u32>, a: u32, b: u32) {
    let low = (a ^ b) & 255;
    let result = specialized_or::<256u32>(low).0;
    let index = thread::index_1d();
    if let Some(output) = out.get_mut(index) {
        *output = result;
    }
}
```

Keep the fixture's `#![no_std]`, imports, manifest dependencies and lockfile.
The `.0` extracts the helper's one-element tuple result. Choosing `low` as the
runtime argument is an explicit source edit for this fixture, not a source-name
mapping granted by the materializer.

Compile that new file normally into a fresh Bundle V6 and extraction target.
Do not feed the diagnostic JSON back as an executable, compiler owner or
resume token. Existing `preview-helper-insertion`/`create-source-candidate`
commands are separate contracts; this new method does not extend them to
apply const-specialized helpers.

## 4. Change the specialization and update the oracle

In a separate source copy, keep the helper unchanged and call:

```rust
let result = specialized_or::<512u32>(low).0;
```

This intentionally changes the result, so the original oracle is no longer
correct. Export this source afresh, then repeat the exact edited source using
another fresh target and output bundle.

| Source variant | Independent u32 formula |
| --- | --- |
| Ordinary baseline / helper `<256u32>` | `((a ^ b) & 255) \| 256` |
| Helper `<512u32>` / unchanged repeat | `((a ^ b) & 255) \| 512` |

For `a = 0xfffffff0` and `b = 0x25`, the mathematical results are `469` and
`725`, respectively. Check the entire output backing, initialization bits, both
surrounding guards, unchanged scalar arguments and actual invocation count.
A matching first element alone is insufficient.

Finally, use two specializations in one new kernel source:

```rust
let result = specialized_or::<256u32>(low).0
    ^ specialized_or::<512u32>(a).0;
```

The independent formula becomes
`((((a ^ b) & 255) | 256) ^ (a | 512)) & 0xffffffff`.
The retained public observations must show two distinct scalar helper function
instances, each with its own direct typed `256` or `512` operand—not just two
display names or two call-site strings.

Current public `Call` observations project inputs but not their exact callee
targets. Therefore `exact_kernel_to_helper_call_edges` remains
`unavailable_in_current_public_operation_projection`. Distinct function
instances and finite whole-kernel results do not fill that missing edge.

## 5. Keep compilation and identity boundaries explicit

```text
ordinary Rust -> fresh typed/semantic/KIR extraction -> bounded diagnostic helper text
  -> explicit new Rust source -> fresh normal compilation -> new Bundle V6 -> CPU checks
```

This does not bypass LLVM or create a new machine-code backend. Normal GPU
compilation retains its existing LLVM/native pipeline; the qualification below
stops at source extraction and CPU KIR simulation. The scalar marker chooses
an instruction, not a physical register plan. `#[inline(never)]` is not an
authored physical helper ABI, register-save convention or final machine-call
guarantee.

A changed source specialization needs a fresh source/semantic/KIR observation.
An old selector is bound to its old bundle, canonical digest and target; it
cannot select from the edited snapshot. Repeated edited source is checked
against its new identities. Inventory receipts describe retained identities,
not a generic body hash or proof of equivalence.

Stale diagnostic identity refusal is not protected-proof invalidation.
Neither this materializer nor its reports authenticate source, carry a reusable
compiler owner, grant proof/resume/load/launch authority, or establish
arbitrary source↔assembly round trips.

## Reproduce the bounded source acceptance

Work in the matching compiler checkout, not this documentation repository.
Build normal, non-test versions of `fe2o3-author`, `fe2o3-export-sim`,
`fe2o3-rustc-extract`, `librustc_codegen_fe2o3.so` and `fe2o3-kir-sim` in the
same measured binary directory. Use direct pinned Cargo/rustc binaries,
not an unpinned rustup shim. Retain the fixture lockfile and offline build-std
dependencies.

The checked-in driver accepts this argv template:

```text
PINNED_NODE scripts/const-u32-helper-source-smoke.mjs
  --repo ABSOLUTE_CURRENT_COMPILER_CHECKOUT
  --bin-dir ABSOLUTE_CURRENT_NORMAL_BIN_DIRECTORY
  --cargo ABSOLUTE_PINNED_TOOLCHAIN/bin/cargo
  --rustc ABSOLUTE_PINNED_TOOLCHAIN/bin/rustc
  --output NEW_ABSOLUTE_TASK_OWNED_DIRECTORY
```

The output parent must already exist; the output itself must be absent and
outside the repository and binary directory. The driver preserves original
fixture bytes, creates separate source copies, pages actual operations, invokes
the real materializer, and exports baseline/default256/edited512/repeat/two
through the normal frontend. No private owner, hand-written KIR, nongeneric
fallback or skipped refusal substitutes for a failed compilation.

It records the finite input matrix before executing it: five input pairs,
lengths 0/1/65 and two CPU replays per export. It also requires exact CLI
refusals for an added `--const-value` argument, an injected selector
`constant_value` field, and a stale canonical digest.

Keep the external supervisor receipt as well as the driver's receipt. The
driver bounds source, streams, child stages and selected input pins; the
supervisor owns whole-task storage, process/resource and wall-clock limits.
Failure retains its first diagnosis and may leave partial task-owned outputs;
it does not imply rollback or permission to overwrite an earlier run.

## Recorded canonical qualification: 2026-09-22

The completed canonical run passed five actual normal exports, 150 independent
whole-kernel CPU simulations and three exact CLI refusals, over 169 child
stages. The receipt retains 455 file pins totaling 434,867,120 bytes. Its
external supervisor also completed successfully with unchanged before/after
compiler source census:

```text
6549 files / 99636015 bytes
dca5d12d17f6dde9cb2d758d986fb0a8a2e9d836e8d5ce3d1d074c3f36178534
```

Retained paths below are relative to the qualification root
`/home/harmenon/fe2o3-authoring-280-282-mi350.4VZ42zNr` on mi350;
they are evidence identifiers, not browser fetch URLs.

| Record | Bytes | SHA-256 |
| --- | ---: | --- |
| `logs/phase20-const-u32-source-r1/receipt.json` — external supervisor | 32627 | `d24521e0b3b592ffdea82ce67975bb4a8bc1bc87ceb2fe55a74f58aa770a45b9` |
| `logs/phase20-const-u32-source-actual-r1/receipt.json` — actual source acceptance | 417970 | `8c6411c8d2d91fb406607312aba1095a2d2b5cf787c4eb3bc365cccca4261fda` |
| `logs/phase20-const-u32-source-actual-r1/materialized.json` | 3800 | `4b18297be43cc71172437f9598ff0c2e438b2a718781fddd483432767cc089c0` |
| `logs/phase20-const-u32-source-actual-r1/generated-helper.rs` | 286 | `4dd20e259361cf6fb79352afc010e9761a3c68f43ddb5ab4e788311383a3f266` |

The two-specialization export retains scalar instructions at `1:0:1` and
`2:0:1`, each using its own `%3` defined at operation zero of its function.
The observed const values are `256` and `512`. Their inert source-function
identities are respectively:

```text
256: 922ca87e08af2b0da6601adaad230ed1dd21e13b11f0a18c0c95412eea9da711
512: f9dfdc3b55b2cabd56eefc5fb81c3387d3abf9534d4ca549dd8018417377c1b0
```

These agree with the corresponding single-specialization function identities.
The repeat reproduces the edited source, bundle, complete summary and observed
instances. Coordinates, SSA IDs and identity values belong to this capture;
they are not selectors for an unrelated run and do not authenticate its producer.

This record covers the canonical compiler run only, not an independent mirror
run, full site qualification or publication. The source census is not a
published commit pin. Native qualification, hardware execution, source/compiler
closure authentication, protected proof, physical-register/helper-ABI
qualification and milestone completion are all explicitly false in the report.
This advances scalar helper authoring; M2's physical helper/control-flow/ABI/
resource acceptance remains open. No curriculum pin or maturity label changes
merely by adding this tutorial.
