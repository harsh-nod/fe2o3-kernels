# Build bounded complete-body metadata in `no_std` Rust

Use this experimental API to prepare a small, inspectable block graph at compile time,
without a heap or a compiler-crate dependency in device code. It is useful for sharing
one bounded description with host tooling and checking numeric-format compatibility.
It does **not** create a kernel: there is no complete-body source marker, normal-source
admission, renderer, simulator, LLVM continuation, or launch API for these packed values.
For a source kernel you can export and observe today, use the separate
[ordered-program tutorial](ordered-program-authoring-v1.md) or
[literal-repeat lab](ordered-program-repeat-v1.md), with their own compiler pins and limits.

## The supported vocabulary

| Item | Bound or meaning |
| --- | --- |
| Blocks | 1–8 in authored order; an individual block may be empty |
| Arithmetic steps | 1–16 **total across the body**, not 16 per block |
| Logical roles | Read-only `input0`, `input1`, `input2`; writable `scratch`, `out` |
| Operations | `mov`, wrapping `u32` `add`/`sub`, bitwise `and`/`or`/`xor` |
| Terminators | Jump to a label; branch on a uniform selector being zero; guarded output-store-and-end intent |
| Labels | Body-local `u8` names; neither source identities nor GPU addresses |

This is not general assembly. There are no text instructions, arbitrary memory
accesses, calls, external labels, authored SGPRs, or divergent predicates. The
numeric words are format records, **not AMD instruction encodings**. Packing does
not assign physical registers or associate the input roles with runtime values.

## Construct a three-block constant

The function and constant below are copied from the compiler repository's
[normal-dependency parity fixture][parity]. The imports are narrowed for a
`no_std` consumer. The hidden step-descriptor macro is the same helper that fixture
uses; it is an experimental descriptor spelling, not a complete-body kernel macro.

```rust
#![no_std]

use fe2o3_device::complete_body_packing_v1::{
    Gfx942CompleteBodyBlockV1 as DBlock,
    Gfx942CompleteBodyBuilderV1 as DBuilder,
    Gfx942CompleteBodyInstructionV1 as DInstruction,
    Gfx942CompleteBodyLabelV1 as DLabel,
    Gfx942CompleteBodyPackedV1 as DPacked,
    Gfx942CompleteBodyPackingErrorV1 as DError,
    Gfx942CompleteBodyTerminatorV1 as DTerm,
};

const fn const_example() -> Result<DPacked, DError> {
    let first = match DInstruction::from_descriptor(fe2o3_device::__fe2o3_ordered_program_step_v1!(
        mov(scratch, input0)
    )) {
        Ok(value) => value,
        Err(error) => {
            return Err(DError::Instruction {
                instruction: 0,
                error,
            });
        }
    };
    let second = match DInstruction::from_descriptor(
        fe2o3_device::__fe2o3_ordered_program_step_v1!(xor(out, scratch, input1)),
    ) {
        Ok(value) => value,
        Err(error) => {
            return Err(DError::Instruction {
                instruction: 1,
                error,
            });
        }
    };
    let mut builder = DBuilder::new();
    if let Err(error) = builder.push_block(DBlock {
        label: DLabel(3),
        instructions: &[first],
        terminator: DTerm::BranchSelectorZero {
            zero: DLabel(8),
            nonzero: DLabel(9),
        },
    }) {
        return Err(error);
    }
    if let Err(error) = builder.push_block(DBlock {
        label: DLabel(8),
        instructions: &[],
        terminator: DTerm::Jump(DLabel(9)),
    }) {
        return Err(error);
    }
    if let Err(error) = builder.push_block(DBlock {
        label: DLabel(9),
        instructions: &[second],
        terminator: DTerm::GuardedStoreOutputAndEnd,
    }) {
        return Err(error);
    }
    builder.finish()
}
const CONST_EXAMPLE: Result<DPacked, DError> = const_example();
```

`CONST_EXAMPLE` holds `Ok` with three blocks and two arithmetic instructions.
`block_count()`, `instruction_count()`, `block_words()` and `instruction_words()`
let a consumer inspect the result. The two word arrays each contain four `u64`s;
unused slots must be zero. Their numeric layout is independent of host endianness;
serializing those integers into bytes still needs an explicitly chosen byte order.
`push_block` performs its fallible checks before writes, so an error leaves the
builder unchanged. `finish` validates the packed grammar and returns `Result`;
it is not a semantic admission token.

## Reason about every incoming path

The example's intended control flow is:

```text
3: scratch = input0
   ├─ selector == 0 ──> 8: no arithmetic ─┐
   └─ selector != 0 ─────────────────────┴─> 9: out = scratch XOR input1;
                                               guarded store/end intent
```

The inputs start defined. `scratch` is written before either branch, so both
routes into block 9 provide its value. Block 9 defines `out` before the terminal.
If the `mov` is moved from block 3 into block 8, the nonzero route reaches block 9
without defining `scratch`. The packed grammar can represent that edit, but the
separate compiler-side model rejects its read-before-definition.

That model intersects the defined-role sets of **all** incoming predecessors;
being defined on just one path is insufficient. Reads happen before the write
of the same instruction, so `mov(out, out)` cannot initialize an undefined
`out`. Every guarded terminal needs a defined output. Its CFG checks separately
require unique, present labels, reachable blocks, distinct branch targets and
strictly forward edges in authored order; loops and implicit fallthrough are
outside the profile. These checks are not performed by this device builder.

## A block graph is not a launch grid

The labels 3, 8 and 9 name control-flow blocks, not threads, lanes or workgroups.
The packed value contains no launch grid, buffer extent, pointer provenance or
proof that the selector is uniform. The separate provisional compiler model
describes `gfx942:xnack-`, Wave64 and a required/maximum workgroup of 64×1×1,
with a guarded global `u32` output write. Those are model requirements, not
observed prologue, EXEC restoration, store completion, or native execution.
The builder does not establish them or permit launching a chosen grid.

## Check the format with the existing fixture

From a compiler checkout containing this API, use its pinned Rust toolchain and
cached dependencies to run the existing normal consumer:

```sh
cargo test --offline --locked \
  --manifest-path crates/fe2o3-device/tests/fixtures/complete-body-packing-consumer/Cargo.toml
```

The fixture compares the device and compiler formats through ordinary library
dependencies. It includes the constant above, all `u16` descriptor encodings,
count/slot limits, padding errors and exact error precedence. It does not
authenticate a source marker, export executable KIR, or run a GPU kernel.
The `fe2o3-device` API itself remains `no_std`; only the separate host parity
fixture depends on compiler-side types.

Keep the layers distinct: packed grammar → separate CFG/initialization/resource
model → **not yet an admitted complete-body source kernel**. A successful
packing result is useful data, not permission to resume compilation from it.
There is no arbitrary ISA-to-Rust round trip, physical-lifetime observation,
protected proof, or native/performance qualification implied by this tutorial.

[parity]: https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-device/tests/fixtures/complete-body-packing-consumer/tests/parity.rs
