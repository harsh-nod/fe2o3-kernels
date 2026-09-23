# Lab: choose an instruction sequence at compile time

Use const_if when a choice is known at compilation time but you want both
instruction alternatives written together. Unlike a runtime if statement,
it selects one complete flat program before the ordinary compiler processes
the existing instruction marker. It emits no GPU branch for that choice.

This follows the [flat-program lab](ordered-program-authoring-v1.md) and
[literal-repeat lab](ordered-program-repeat-v1.md). Fresh normal-source/CPU
qualification for selection passed independently in both compiler forks; the
[dated compiler report](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-select-source-20260923.md)
records the exact inputs, receipts and limits. This Markdown lab does not add
an independently qualified curriculum lesson or change its compiler evidence
pin. Earlier repeat, LLVM and native results do not qualify this different kernel.

## Write both alternatives

In a separate task-owned copy of an admitted kernel package, use this library
body. Keep its reviewed manifest, dependency roots and lockfile. Do not replace
the original source or treat this block as a standalone Cargo project.

~~~rust
#![no_std]
use fe2o3_device::{DisjointSlice, amdgpu_ordered_program, kernel, thread};

const SELECT: bool = 3_u32 < 4;

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn ordered_select_u32(
    mut output: DisjointSlice<u32>,
    a: u32,
    b: u32,
    c: u32,
) {
    let result = amdgpu_ordered_program! {
        gfx942_xnack_off_wave64;
        scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;
        const_if(SELECT) {
            mov(out, input0);
            add(out, out, input1);
        } else {
            mov(out, input0);
            add(out, out, input1);
            add(out, out, input1);
        }
    };
    if let Some(element) = output.get_mut(thread::index_1d()) {
        *element = result;
    }
}
~~~

With SELECT true, the list is MOV then ADD: the expected result is
(a + b) modulo 2^32. Change the constant to 4_u32 < 3 and the list becomes
MOV then two ADDs: (a + 2*b) modulo 2^32. For 19 and 23, the independent expected
answers are 42 and 65. These are arithmetic expectations, not recorded values.

The three input expressions evaluate once, in order, before the one marker
call. Two ADDs do not evaluate b twice. The third input and scratch still
belong to the five-role contract even when unused. The output slice check
and store remain ordinary Rust.

The predicate can be a bool literal, a named concrete bool const or a concrete
constant bool expression. It cannot depend on a runtime input, and this spelling
does not accept an outer generic parameter or enable general const-generic
kernel specialization.

## An inactive arm still has to be valid

Each alternative needs 1 through 16 flat instructions, must define its own
output, and may read only values already defined in that same alternative.
Input0/input1/input2 start defined; out and scratch do not. One arm cannot
initialize the other's state.

This fragment is intentionally invalid:

~~~rust
const_if(true) {
    mov(out, input0);
} else {
    add(out, out, input1); // out starts undefined in this alternative
}
~~~

Selecting the valid first arm does not hide the invalid second one.
An inactive empty block, unknown opcode or seventeenth instruction is also
refused. Both complete lists are checked before selecting their count/packed
descriptors. The limit is sixteen per arm, not sixteen across both arms.

Keep the arms flat. There is no nested const_if, init/repeat block, authored
helper body, branch, label or authored memory instruction. The operations
remain MOV, wrapping ADD/SUB, AND/OR/XOR. Only scratch and out are writable.
All five roles must be distinct literal registers in v0..v63.

The normal source profile remains one unconditional, acyclic ordered program
in one direct kernel root, gfx942:xnack-, wave64 and required/maximum workgroup
64x1x1. Checked Rust output access is not an authored assembly memory operation.

## What still passes through the compiler

~~~text
Rust + concrete const_if -> checked selected flat program
  -> normal semantic/KIR extraction -> one LLVM inline-assembly unit
  -> separately checked native compilation
~~~

LLVM IR is not bypassed. Surrounding Rust lowers normally, while the selected
instruction list uses the existing constrained ordered unit. The frontend
still checks actual placement, marker instance, constants, roles, target and
launch. Editing source requires a fresh export; detached KIR is not a mutable
compilation-resume token.

The revised macro introduces no named const items or local bindings that could
collide with the caller. Five direct eager-helper projections supply the
existing constants: count plus four packed descriptor words. There is one
terminal134 call, with three u32 data operands and five u8 role literals.
The words describe source instructions; they are not machine bytes.

Both arms require at most 32 descriptor checks per helper call, hence at most
160 across the five syntactic projections. This local bound is not a bound on
predicate evaluation, all rustc const evaluation or compiler memory.
Compilation still needs independent resource supervision.

The declared v32..v36 roles have high-water 37. That is not observed final VGPR
usage, occupancy, descriptor capacity or a register-lifetime proof.
Existing logical debugging treats the whole unit as one operation. Selection
adds no physical-register trace, per-step source spans, microsteps or debugger
view. See the separate [logical debugger lab](ordered-program-debugger-v1.md).

## Exercise the ordinary source route

Use the current implementation and freshly built matching normal tools,
not the older flat-program compiler pin or a shared stale backend DSO.
The [compiler selection guide](https://github.com/harsh-nod/fe2o3/blob/main/docs/ordered-program-select-source-v1.md)
lists the eleven exact Rust fixture pins, custody, commands and limits.

This is a placeholder command template, not a claim that these paths exist.
Use reviewed matching inputs and qualify device controls, current source/
provider checks and the normal tools before capturing:

~~~sh
/ABS_NODE /CANONICAL_REPO/scripts/ordered-program-select-source-smoke.mjs \
  --repo /CANONICAL_REPO \
  --bin-dir /MATCHING_FRESH_NORMAL_TOOL_DIRECTORY \
  --cargo /EXACT_RUST_TOOLCHAIN/bin/cargo \
  --rustc /EXACT_RUST_TOOLCHAIN/bin/rustc \
  --output /CURRENT_SCOPED_ROOT/logs/NEW_ORDERED_SELECT_OUTPUT
~~~

Use that compiler checkout's own script and a new output path. The driver uses
ordinary diagnostic KIR V17 export, program inspection and CPU simulation,
with locked/offline dependencies and fresh extraction targets. It does not
create hand-written KIR, execute the host marker, launch a GPU or run in the
browser.

The qualified exports are literal true, named const true, named const false
and another export of the identical false source. Inspection must show
counts 2/2/3/3 and selected MOV/ADD order. Named/literal true have different
source bytes; their semantic identities must be observed, not assumed from
that spelling. The exact false-source repeat needs its own retained record.

Compute the answer independently:

~~~js
const expected =
  (BigInt(a) + (selectedCondition ? 1n : 2n) * BigInt(b)) & 0xffffffffn;
~~~

The qualified matrix has five scalar triples, output lengths 0/1/65 and two
replays: 30 CPU cases per export, 120 total. Check every output word,
initialization bit and unchanged guard byte, including empty output.
Together with four inspections and eight frontend refusals, the source
capture passed all 136 stages separately in each fork. These finite captures
do not establish hardware execution or universal correctness.

The eight refusal fixtures cover dynamic and non-bool predicates, nesting,
missing else, unknown opcode, inactive undefined out, an inactive
seventeen-step arm and aliased roles. Each must fail for the intended cause
through the normal exporter. Timeout, stale tools, missing dependencies and
unrelated errors are not success. Check the revised macro's actual diagnostic
multiplicity; do not replace exact validation with “any error is fine.”

## What this gives you—and what it does not

Concrete selection keeps two bounded implementation choices together and
validates both before compilation proceeds. It is useful for fixed
source-level choices without a runtime conditional.

It does not transform a Rust runtime branch, generate a schedule, create a
general helper ABI, add nesting, prove equivalence between these different
arithmetic results or provide lossless Rust/assembly roundtripping.
The changed formula is an intentional edit, not an equivalence claim.

CPU results, LLVM text and final native bytes are separate evidence categories.
The repeat-native observer was qualified for another kernel/source profile;
do not relabel its receipts even when a short instruction list looks identical.
New selection LLVM/native observations, hardware execution, performance and
protected proof remain separate work.

This Markdown lab leaves curriculum pins, maturity labels and existing lesson
claims unchanged. It does not close the broad assembly-authoring, visualization
or multilevel-compilation milestones.
