# Save and replay a local-order recipe from Rust

This lab uses the Linux release API and the ordinary
`source_local_order_recipe_v1` Cargo example. It is a small, explicit authoring
workflow: retain Rust as the source of meaning, save a bounded order preference,
and compile that preference against the current source again.

The [dated compiler qualification](https://github.com/harsh-nod/fe2o3/blob/main/docs/evidence/source-local-order-recipes-20260923.md)
records 28 fresh compiler callbacks, 450 whole-kernel CPU simulations, and eight
separate ordinary example processes (five successes, three exact refusals).
These qualify this bounded recipe entry point, not native or GPU execution.

## What you can control

The supported source expression has two independent `u32` operations followed
by their shared consumer:

```rust
#![no_std]
use fe2o3_device::{DisjointSlice, kernel, thread};

#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn choose_order(
    mut output: DisjointSlice<u32>,
    a: u32,
    b: u32,
    c: u32,
    d: u32,
) {
    let result = (a ^ b) & (c | d);
    let index = thread::index_1d();
    if let Some(slot) = output.get_mut(index) {
        *slot = result;
    }
}
```

The XOR and OR can be placed in either supported local order; the AND still
depends on both. The full kernel, including its guarded output store, remains
part of the current compiler-owned program.

This closed profile requires `gfx942`, XNACK off, wave64, required and maximum
workgroup dimensions `[64, 1, 1]`, and four distinct formal `u32` parameters.
It selects one unambiguous `(a ^ b) & (c | d)` initializer. A local alias,
different operator, duplicated input binding, changed target/launch contract or
ambiguous second matching initializer is not silently generalized.

This is canonical KIR ordering, not a promise about final machine instruction
order, physical VGPR assignments or performance.

## Where the recipe fits

```text
current Rust → fresh original N → fixed Policy6 prefix I → chosen current L → LLVM
                    ↑                       ↑
               fresh source join      saved inert recipe intent
```

`N` is the original admitted executable representation. `I` is the result of
the fixed checked prefix. `L` is the actual current program after the requested
local-order continuation. The named composition is
`source-local-order-policy6-v1`; this interface does not accept an arbitrary
pass list.

**Create** runs that whole path and returns both a new recipe and LLVM emitted
from actual `L`. It is not a compiler session paused on disk at `I`.

**Replay** reads the saved intent, enters a fresh source compilation, obtains
fresh `N` and `I`, binds the recipe to that current program, checks the actual
`I → L` continuation, and emits current-`L` LLVM. It never imports an old
compiler owner or treats a saved digest as permission to resume.

You are not bypassing LLVM IR here. The output is LLVM text from the newly
checked canonical program. This is also not an inline-assembly authoring entry:
the example starts with ordinary Rust integer operations.

## Build the ordinary example

Use the repository's matching pinned Rust toolchain, backend build environment,
sysroot and LLVM loader setup. In that already prepared environment:

```sh
cargo build --offline --locked -p rustc-codegen-fe2o3 \
  --example source_local_order_recipe_v1
```

The binary is a normal dependency consumer of
`run_source_local_order_recipe_driver_v1`, not an ignored compiler test.
It runs the source driver in-process. It does not choose your toolchain, change
your working directory or spawn another compiler process for you.

Its command grammar is exact:

```text
source_local_order_recipe_v1 create SOURCE_REL SOURCE_SHA ORDER RELATION STRENGTH BINDING RECIPE_OUT LLVM_OUT -- RUSTC_ARGV...
source_local_order_recipe_v1 replay SOURCE_REL SOURCE_SHA RECIPE_IN RECIPE_SHA LLVM_OUT -- RUSTC_ARGV...
```

`SOURCE_REL` is relative to the compiler invocation's working directory.
`SOURCE_SHA` is the measured SHA-256 of those current source bytes, supplied on
every attempt. The complete observed source-profile `RUSTC_ARGV` must include
its `argv[0]`, selected sysroot, target, dependency paths and existing required
compiler options. Preserve the matching source-profile environment and compiler
bindings too; do not substitute an invented minimal `rustc source.rs` command.

Recipe and LLVM file paths must be absolute, with existing canonical parents.
Outputs must not exist. The example refuses to overwrite them.

The following shell templates use deliberately invalid placeholders until you
replace them with your measured source/tool paths, digests and complete current
compiler arguments:

```bash
recipe_tool='/ABSOLUTE_BUILD/debug/examples/source_local_order_recipe_v1'
source_rel='RELATIVE_SOURCE/choose_order.rs'
current_source_sha='REPLACE_WITH_64_LOWERCASE_HEX'
rustc_argv=(
  '/ABSOLUTE_PINNED_TOOLCHAIN/bin/rustc'
  'REPLACE_WITH_THE_COMPLETE_OBSERVED_ARGUMENTS'
)
```

Do not pass the literal placeholder array. A complete observed argument vector
and its source-profile environment are inputs to this lab, not something the
recipe can reconstruct.

## Create and replay an exact-revision recipe

Choose reverse-ready ordering and require the OR to precede the XOR:

```bash
"$recipe_tool" create "$source_rel" "$current_source_sha" \
  reverse-ready or-before-xor exact exact-revision \
  /ABSOLUTE_NEW_OUTPUT/reverse-exact.json \
  /ABSOLUTE_NEW_OUTPUT/reverse-exact.ll -- "${rustc_argv[@]}"
```

After a successful Create, retain the generated recipe and measure its exact
file SHA-256. Replay it to a different, absent LLVM path:

```bash
recipe_sha='REPLACE_WITH_MEASURED_RECIPE_SHA256'
"$recipe_tool" replay "$source_rel" "$current_source_sha" \
  /ABSOLUTE_NEW_OUTPUT/reverse-exact.json "$recipe_sha" \
  /ABSOLUTE_NEW_OUTPUT/replayed-exact.ll -- "${rustc_argv[@]}"
```

Replay never rewrites or regenerates the recipe. Exact-revision requires the
saved source SHA and both full current `N`/`I` canonical digest-and-length
predicates to match. Updating only the command's current source SHA after a
source edit does not weaken those saved predicates.

## Edit intent, not compiler ownership

A generated recipe is bounded JSON with schema
`fe2o3-source-local-order-recipe-v1`. Work on a separate copy so the original
record and its hash remain available.

For example, these are editable intent fields **within** a generated record,
not a complete recipe:

```json
{
  "preference": "reverse_ready",
  "constraint": {
    "relation": "or_before_xor",
    "strength": "exact"
  }
}
```

JSON enum spellings use underscores; command-line choices use hyphens.
Keep the remaining generated fields intact. Recompute the edited file's SHA
before Replay. Unknown or duplicate fields, unsupported enum values and
oversized records are refused.

The record's item/instance binding, historical origin annotations and canonical
identity predicates are not executable code, compiler owners, source
authentication or reusable analysis/proof receipts. Do not hand-invent them to
make a rejected source appear compatible. Explicitly create a new recipe when
the source item or supported profile changes.

## Source edits: exact-revision versus rebind-current

| Saved mode | What a new attempt checks |
| --- | --- |
| `exact-revision` | Same current source SHA and full `N`/`I` identities, in addition to the current item/profile checks. |
| `rebind-current` | Fresh current source and graph admission, fresh coordinates and continuation; no requirement to reuse the old source or `N`/`I` digest. |

Both modes preserve the five instance axes: function, item, monomorphization,
generic types and const arguments. Both still check the target, launch contract
and supported expression shape. Rebind-current is not “accept any edited Rust.”

To deliberately allow compatible source edits, create a distinct recipe with
that choice:

```bash
"$recipe_tool" create "$source_rel" "$current_source_sha" \
  reverse-ready or-before-xor exact rebind-current \
  /ABSOLUTE_NEW_OUTPUT/reverse-rebind.json \
  /ABSOLUTE_NEW_OUTPUT/reverse-rebind.ll -- "${rustc_argv[@]}"
```

A useful edit exercise is renaming formal `a` to `renamed_a`, changing its use
in the initializer, and adding a comment. Measure the new source SHA, keep the
appropriate current compiler arguments/environment, and Replay the saved
rebind-current recipe. Fresh source coordinates are derived; old byte offsets
are not replayed. Such an edit may preserve semantic graph hashes, so do not
require a fabricated hash change as evidence of revalidation.

The corresponding exact-revision recipe should refuse that changed file.
Renaming the function to a different item is a different case: both modes retain
the item binding, so explicitly Create a new recipe for the new item. There is
no automatic exact-to-rebind conversion or fallback after a refusal.

## Preference and constraint are separate

`ORDER` chooses `source-order` or `reverse-ready`.
`RELATION` asks for `xor-before-or` or `or-before-xor`.
`STRENGTH` decides how a mismatch is handled:

- `exact`: a mismatched actual canonical relation refuses the attempt; no
  successful recipe result or LLVM is returned.
- `advisory`: return the chosen program and explicitly report
  `NotHonored { requested, actual }` when it differs. Do not silently transform
  it again or relabel the result as honored.

For example, deliberately request source order while asking for the opposite
relation:

```bash
"$recipe_tool" create "$source_rel" "$current_source_sha" \
  source-order or-before-xor advisory exact-revision \
  /ABSOLUTE_NEW_OUTPUT/advisory.json \
  /ABSOLUTE_NEW_OUTPUT/advisory.ll -- "${rustc_argv[@]}"
```

Read the printed actual relation and constraint outcome. The intended control
is an actual XOR-before-OR result with an explicit not-honored OR-before-XOR
request, not a second reverse-ready compilation. Repeat with `exact` and fresh
output paths to exercise refusal. Both outcomes passed in the actual-source
campaign and the separate ordinary-example qualification.

## What to inspect and what this does not prove

The public result exposes LLVM plus fixed evidence: current source and
initializer bounds, instance identities, full `N`/`I`/`L` digest/lengths,
requested and actual order, constraint outcome, current region/result IDs,
fresh transition/formal observations and LLVM/descriptor/recipe hashes. The
normal example prints only a short actual-order/outcome summary; a consumer can
inspect the public evidence getters for the rest.

The library owns immutable recipe bytes, not a live recipe file. The example
adds its own bounded no-follow file retention and checks its identity, metadata
and bytes around the driver. Source retention remains associated with the live
compiler callback and is rechecked before exposing a result. A repeated callback
or compiler fatal invalidates an earlier success.

Bounds include an 8 KiB recipe, 64 KiB retained source, 48 KiB LLVM and a 1 KiB
relative source path. Existing canonical work/storage accounting remains active;
it is not a whole-process RSS or wall-time guarantee.

The example publishes create-new mode-0600 outputs **non-transactionally**. If a
later write fails, an earlier new recipe file may remain. Inspect the reported
files; do not assume a failed invocation created nothing.

This workflow does not decompile arbitrary ISA back into Rust. You can edit the
Rust you own and reapply a supported recipe to a fresh compilation. It is not a
lossless Rust/LLVM/assembly round-trip, a register-lifetime editor, or a native
scheduling/performance guarantee. Returned LLVM does not by itself grant
protected proof, production artifact publication, GPU load or launch authority.

The separate acceptance report retains exact source/tool/output pins and
distinguishes ordinary example execution from the test-only actual-`L` observer.
The eight ordinary processes add no simulation or proof counts. Historical
feasibility results are not reused as qualification for this release entry point.
