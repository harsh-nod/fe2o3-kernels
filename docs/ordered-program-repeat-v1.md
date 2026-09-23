# Lab: repeat a bounded instruction block at compile time

This follow-on to the [flat instruction-program lab](ordered-program-authoring-v1.md)
adds a shorter source spelling for repeated instructions. It does not add a GPU
loop, branch instruction or scheduling pass.

The bounded normal-source/CPU and ordinary LLVM acceptance runs passed in both
compiler forks. These results cover the profile below, not general control-flow
authoring or final native execution. Use matching tools built from source
containing this syntax; the historical compiler pin and recordings in the
flat-program lab do not qualify this extension. Exact run identities are in the
[compiler qualification evidence](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-fault-20260922.md#final-publication-qualification).

## Write initialization once and repeat one block

In a fresh, task-owned source copy of an admitted kernel package, use this body:

```rust
#![no_std]
use fe2o3_device::{DisjointSlice, amdgpu_ordered_program, kernel, thread};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn ordered_repeat_u32(
    mut output: DisjointSlice<u32>,
    a: u32,
    b: u32,
    c: u32,
) {
    let result = amdgpu_ordered_program! {
        gfx942_xnack_off_wave64;
        scratch(32); out(33);
        in(34) = a; in(35) = b; in(36) = c;
        init { mov(out, input0); }
        repeat(2) { add(out, out, input1); }
    };
    if let Some(element) = output.get_mut(thread::index_1d()) {
        *element = result;
    }
}
```

Preserve the package's reviewed manifest, dependency roots and lockfile; this is
a library body, not a standalone Cargo project. Do not overwrite the original
source. The surrounding typed kernel, checked output access and launch contract
remain ordinary Rust.

The instruction body expands to the existing flat spelling:

```rust
mov(out, input0);
add(out, out, input1);
add(out, out, input1);
```

Its independent mathematical result is `(a + 2*b) mod 2^32`. All three data
expressions are evaluated once, left to right, before the marker call—not once
per repeated instruction. The unused `input2` and scratch bindings still belong
to the existing five-role contract.

Initialization runs once. Each instruction reads its sources before writing
its destination, and scratch/output state continues across repetitions.
For example, `init { mov(scratch, input0); }` followed by
`repeat(2) { add(out, out, input1); }` is invalid: the first ADD reads an
undefined output. Later writes cannot repair that earlier read.

## Stay inside the literal and expanded-size bounds

There is exactly one nonempty `init` block and one nonempty, nonnested `repeat`
block. The count is an integer literal from 1 through 15, and:

```text
initial instruction count + repeat count * repeated-block instruction count <= 16
```

For the one-MOV/one-ADD example:

| Literal count | Expanded sequence | Total instructions |
| --- | --- | ---: |
| `1` | MOV, ADD | 2 |
| `2` | MOV, ADD, ADD | 3 |
| `15` | MOV followed by fifteen ADDs | 16 |

Zero and counts 16 or larger are refused. Even a locally legal count can exceed
the total: one initialization instruction plus `repeat(8)` containing two
instructions produces 17 and is refused. No truncation or second region is
created.

A runtime variable, const identifier or const-generic parameter is not an
accepted count in this spelling. Nested repetition, empty blocks, labels,
branches, memory operations, helper bodies and different target profiles are
not added. Existing opcode/arity/role checks remain: MOV, wrapping ADD/SUB,
AND/OR/XOR; writes only to scratch/output; output defined at exit.

The helper checks sizes/count before copying and delegates the flattened
descriptors to the existing validator. Its fixed local payload is bounded,
but this is not a bound on source-token parsing, all rustc const evaluation
or process memory. Keep compilation under separate resource supervision.

## Understand what compilation still owns

There is no new executable representation. The source macro produces the same
single diagnostic marker with the same five typed constants: a u8 instruction
count and four packed u64 descriptor words. Those words are source descriptors,
not AMD machine-instruction bytes. Runtime arguments remain three u32 inputs
and five u8 register-role literals. The existing flat macro syntax is unchanged.

The normal compiler still resolves the actual marker instance and independently
checks its constants, register roles, target, source occurrence and launch
contract. This syntax does not bypass those checks or allow resuming from edited
descriptor JSON. The source profile still requires one unconditional, acyclic
occurrence in one direct kernel root with no helper bodies, exact
`gfx942:xnack-` / wave64, and required/maximum workgroup `64x1x1`.

LLVM IR remains in the compilation path:

```text
Rust + literal repeat -> const-expanded flat marker -> normal semantic/KIR extraction
  -> one ordered LLVM inline-assembly unit -> existing native compilation path
```

The surrounding Rust continues through ordinary lowering. This is not a direct
machine-code emitter or a whole-kernel LLVM bypass. The actual repeat-source
LLVM observations checked the existing single `asm sideeffect` unit, exact
MOV/ADD sequence, constraints, direct inputs and result-to-store use for all
four exports. This is an exact observer of the known emitter spelling, not a
general LLVM verifier or evidence that native compilation ran.

Unlike scalar helper variable names, `scratch(32)`, `out(33)` and the input
bindings explicitly request physical VGPR roles for this one instruction unit.
They must all be distinct literals in v0..v63. Nevertheless, an inspector's
declared roles are **not an observation of final allocation**. Their declared
high-water 37 is not total kernel VGPR usage, encoded descriptor capacity,
occupancy or a lifetime proof. Boundary copies and surrounding allocations
remain compiler work; fresh native bytes must be inspected separately.

This syntax only duplicates authored source instructions before compilation.
It does not recognize a Rust runtime loop, prove that loop's bounds/dependencies,
or perform an owner-qualified schedule/unroll transformation. It creates no
schedule recipe or protected continuation and does not complete U3.

Source/debugger attribution remains that of the one existing ordered region.
No new per-expanded-step source spans, physical-register values or instruction
microsteps are supplied. The [logical debugger lab](ordered-program-debugger-v1.md)
explains that separate whole-region observation boundary.

## Qualify fresh source, not just the expansion helper

To reproduce the acceptance, build the device crate and matching normal tools
with pinned, locked/offline dependencies, preserve source/tool inputs and use
fresh output paths. A host marker call intentionally panics; it is not a CPU
implementation of the kernel. Follow the compiler's
[source acceptance guide](https://github.com/harsh-nod/fe2o3/blob/main/docs/ordered-repeat-source-acceptance-v1.md)
for exact commands, input custody, limits and refusal predicates.

The source ladder exports repeat1, repeat2, repeat15 and a fresh export of the
unchanged repeat15 source through the ordinary diagnostic KIR V17 exporter.
The last export reuses the exact source/manifest paths with a fresh extraction
target. Inspect each actual program: one region, exact counts 2/3/16, the expected
MOV/ADD order, zero descriptor padding and the unchanged register contract.
A repeated source build needs its own record; do not infer cross-build identities
from local SSA labels or assume every inventory receipt changes with the count.

For each source, independently compute:

```js
const expected = (BigInt(a) + BigInt(repetitions) * BigInt(b)) & 0xffffffffn;
```

Use wraparound and bit-pattern inputs, empty/one-element/boundary-length outputs,
and deterministic repeat requests. Check every output word, initialization bit,
guard byte and unchanged scalar argument, not just the first result. The passed
captures used this independent arithmetic oracle for five input triples,
lengths 0/1/65 and two replays: 30 simulations for each of the four exports.

The eight passed normal-source refusals cover zero, sixteen, a huge literal,
expanded length 17, a dynamic count, an undefined-output initialization, nested
repetition and aliased physical roles. Keep existing launch checks and their
separate regressions intact. A no-kernel, loader, dependency, timeout or unrelated
compiler failure is not a passing negative. Plain compile-refusal snippets only
qualify their compile-time guards; normal source refusals must run inside the
admitted attributed-kernel package.

Each compiler fork's actual source capture passed four exports, 120 CPU
simulations and eight exact refusals across 136 stages. The separate
[LLVM observation guide](https://github.com/harsh-nod/fe2o3/blob/main/docs/ordered-repeat-llvm-observation-v1.md)
describes the next bounded check: each fork performed four fresh lowerer calls,
revalidated the 120 retained CPU results and eight refusals, and ran zero new
simulations. Both runs required unchanged selected inputs. The source and LLVM
pure suites passed 23 and 22 control groups respectively in each fork; synthetic
controls are not extra kernel executions.

The [dated evidence](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-fault-20260922.md#final-publication-qualification)
holds exact receipt/tool/input pins. Results for other authoring features must
not be counted as repeat evidence. That original source/LLVM report makes no
native-inspection claim; the separate dated native observation is described
below. GPU execution and performance remain unqualified.

No new source/proof authentication, physical helper ABI, general control-flow
or memory support, protected publication or milestone completion follows from
this bounded acceptance. General M2 and U2 acceptance remain open. Curriculum
pins and maturity labels remain unchanged.

## Follow the repeated program into final native instructions

The source and LLVM results above remain their original bounded qualification.
A separate [repeat-native workflow](https://github.com/harsh-nod/fe2o3/blob/main/docs/ordered-repeat-native-observation-v1.md)
adds final-machine inspection without changing the source macro, normal emitter
or protected worker. The separate
[dated native qualification](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/authoring-repeat-native-20260923.md)
records actual build/run identities, passed checks and their limits.

Start with a complete successful source-acceptance capture and its matching
four-output LLVM observation. Preserve their exact original repository,
receipt, source/tool and output paths. The native driver must live in that
original repository's `scripts/`; copying receipts to another worktree or
rewriting paths is not supported. A new checkout must first produce new matching
source and LLVM captures. Keep canonical and mirror observations separate.

Follow the compiler guide to configure the standalone observer with its
allowlisted worker, explicit LLVM22/static LLD SDK and independently reviewed
claims. Build the separate `ordered-repeat-source-candidate` target in a new
directory, run its shape controls, and independently pin the resulting binary.
Then invoke `scripts/ordered-repeat-native-observation.mjs` with both original
receipt paths/hashes/sizes, the original repository, selected observer
path/hash/size, reviewed build claims and a fresh output directory. The compiler
guide lists the complete 13-flag command; no browser action runs it.

The source-to-native driver rechecks the previous 120 complete CPU results and
eight frontend refusals, but does not run new simulations. It makes four real
native invocations for one, two, fifteen and repeated fifteen; each builds O0
and O3 and retains a complete HSACO. Successful observation therefore requires
eight native compilation cases, not eight GPU executions.

Inspect each count as a single ordered assembly unit:

| Count | Exact authored final sequence | Expected e32 little-endian bytes |
| --- | --- | --- |
| 1 | MOV, ADD | `2203427e`, `21474268` |
| 2 | MOV, ADD, ADD | `2203427e`, twice `21474268` |
| 15 | MOV followed by fifteen ADDs | `2203427e`, fifteen times `21474268` |

These are independent expected literals, not a claim about unobserved output.
The decoder must actually report MOV operands VGPR33/VGPR34, ADD operands
VGPR33/VGPR33/VGPR35, exact contiguous four-byte sites and a unique sequence.
The join checks their bytes at the decoder's ELF file offsets in each complete
retained payload. Extra ADDs, gaps, duplicates, wrong counts/registers/constraints
or wide encodings cannot silently match.

The final descriptor must cover declared high-water 37. Its encoded capacity
and architected boundary are not an exact 37-register usage claim, occupancy
estimate, physical value trace or proof of register lifetime. The surrounding
Rust's store/indexing still passes through LLVM; matching instructions is not
independent proof of the whole compiled kernel or memory-address calculation.

The repeated fifteen case must genuinely compile again and match its prior
same-optimization whole payload. This finite equality is not a general
determinism promise. The native lane adds neither runtime loops/scheduling nor
per-instruction debugger snapshots, source-to-SSA links, GPU results, protected
proof, production resume or blanket milestone completion. Keep the original
CPU, LLVM, native-codegen and hardware evidence categories distinct.
