# Lab: compose ordered regions, promote a helper, and compile fresh source

This lab connects **authored ordered assembly regions** with a bounded,
explicit source-edit workflow. It is separate from the
[ordinary Rust bitselect publisher](source-promotion-lab-v1.md) and the
[scalar const-u32 helper materializer](const-u32-helper-promotion-v1.md).
Their earlier observations do not qualify this new path.

Compiler implementation commit: `634ec52439fb6ae8329d0cc6ba52be41fdee3739`.
Recorded qualification: **source publisher, public library driver, actual extractor
binary and ordinary finite-grid LLVM/handoff passed their separate gates**.
The source copies below are exact fixtures; their hashes alone are not receipts.
No browser source write, new UI route or automatic compiler command is added.

## 1. Compose small authored regions with ordinary Rust

The [full composition fixture](../examples/ordered-composition/composition.rs)
uses the existing ordered-u32 macro on `gfx942:xnack-`, Wave64. It keeps ordinary
Rust scalar operations outside the authored instruction sequence. Here is its
actual retained helper:

<!-- exact-helper -->
```rust
#[inline(never)]
fn helper(a: u32, b: u32, c: u32) -> u32 {
    let first = region!(a, b, c);
    // Ordinary Rust transport/arithmetic is outside the assembly marker.
    (first ^ b) | c
}
```

The `ordered-composition-two-calls` variant calls the same helper twice:

<!-- exact-calls -->
```rust
    #[cfg(feature = "ordered-composition-two-calls")]
    let value = {
        let first = helper(a, b, c);
        helper(first ^ c, b, a)
    };
```

The compiler keeps **definitions, call sites and execution occurrences**
distinct. Calling one helper twice does not create two source definitions.
Each root-qualified occurrence retains its actual call-site relation. A
matching helper name or instruction string cannot replace that relation.

The current composition profile permits at most two helpers, eight direct root
call sites, eight region definitions, eight expanded occurrences and 128 expanded
authored instructions. Each ordered program still has its existing 1–16
instruction limit. Supported helper interfaces are direct `(u32,u32,u32)->u32`;
the source and canonical owners separately check actual Rust ABI and logical
types. Calls from helpers, conditional helper calls, dynamic register roles,
foreign markers and mixed unsupported marker families are refused.

Composition retains supported const-monomorphized helper instances and supported
ordinary scalar operations. This does **not** mean arbitrary helper bodies,
physical machine-call ABIs, recursion, arbitrary memory effects or general
control flow are admitted. Physical input/scratch/output roles belong to each
authored region; compiler-owned surrounding code and helper lowering still
participate in the pipeline. MIR32/KIR17 are reused, not new wire versions.

## 2. Start the narrower root-region promotion exercise

The [full promotion fixture](../examples/ordered-composition/publish.rs) has
five feature-selected cases. Use `ordered-composition-publish-direct` alone for
the positive exercise. The other four cases deliberately test HIR collision,
constant capture, local operand capture and wrapper-macro refusal.

The actual direct region is:

<!-- exact-region -->
```rust
    #[cfg(any(feature = "ordered-composition-publish-direct", feature = "ordered-composition-publish-collision"))]
    let value = fe2o3_device::amdgpu_ordered_program! {
        gfx942_xnack_off_wave64;
        scratch(8); out(9); in(10) = a; in(11) = b; in(12) = c;
        xor(scratch, input0, input1);
        and(out, scratch, input2);
    };
```

Its unchanged output tail is:

<!-- exact-tail -->
```rust
    let index = thread::index_1d();
    if let Some(element) = output.get_mut(index) {
        *element = value;
    }
```

The result is `(a ^ b) & c`. The source kernel takes an exclusive output slice
and three u32 scalars. Its required and maximum workgroup are `[64,1,1]`.

This first publisher is narrower than composition admission. It only selects a
direct, flat macro in the kernel root, using three direct u32 formal arguments.
Authenticated HIR and expansion provenance supply the replacement span and the
enclosing body's helper-insertion point. Wrapper macros, local/constant operand
captures, generic/const captures and promoting a region inside an existing helper
are refused. Hashes, rendered text or caller-supplied offsets are not source
authority.

The promotion fixture has **no finite maximum grid**. Its diagnostic and CPU
exercise is not a normal ranked/formal handoff success. The separate composition
fixture has an explicit `ordered-composition-finite-grid` option with
`max_grid = [2,1,1]`; that normal path needs its own source, conditional-memory
and driver qualification. Do not infer a finite grid from this lab's CPU cases.

## 3. Select from an actual fresh diagnostic

Work in the matching compiler checkout with the pinned
`nightly-2026-04-03` toolchain, genuine package metadata, current provider and
bounded isolated process supervision. Do not invent a minimal rustc argument
list or reuse another package's metadata binding.

The diagnostic library entry is
`run_diagnostic_ordered_composition_extraction_driver_v1(args, output_dir)`.
It starts the actual source frontend and exports the original owner's
`canonical-v17.bin`, `canonical.ll` and `observation.json` to a new directory.
It does not publish source.

Select an actual root-region definition from that report's `definitions`
roster. Record its ordinal, `semantic_identity`, `canonical_identity` and the
SHA-256 of the original source bytes. Those are **selectors for a new live
callback**, not a serialized source seed or a way to resume the old owner.

## 4. Request a create-new helper candidate

The public Linux library action is:

```text
run_ordered_composition_source_promotion_driver_v1(
    actual_rustc_args, new_diagnostic_directory, request_file
)
```

The request is closed JSON of at most 8192 bytes in a regular non-symlink file.
Unknown/duplicate fields refuse. The following is a template, not runnable input:

```json
{
  "schema": "fe2o3-ordered-composition-source-promotion-request-v1",
  "semantic_sha256": "<current 64 lowercase nonzero hex digits>",
  "canonical_sha256": "<current 64 lowercase nonzero hex digits>",
  "definition_ordinal": 0,
  "original_path": "src/kernel.rs",
  "original_sha256": "<current source SHA-256>",
  "candidate_path": "src/kernel_candidate.rs",
  "helper_name": "__fe2o3_region_0123456789abcdef"
}
```

Use the actual selected ordinal, not an assumed zero from this illustration.
Both source paths obey the bounded relative `.rs` grammar; their parent
directories must already exist. The candidate must be distinct and absent.
The helper name is exactly `__fe2o3_region_` plus sixteen lowercase hexadecimal
digits. A valid name still undergoes the actual HIR namespace collision check.

With `edit` omitted (or null), the publisher copies the typed program/register
roles into a body-local `#[inline(never)]` helper and replaces the selected
occurrence with a call. The helper takes three u32 inputs and returns one u32.
It preserves the original file and creates a separate candidate. The attribute
is a source instruction, not a promise of a particular final native call.

The extractor binary exposes the same explicit action via
`FE2O3_EXTRACT_ORDERED_COMPOSITION_PROMOTION_REQUEST_V1`, only together with
`FE2O3_EXTRACT_DIAGNOSTIC_ORDERED_COMPOSITION_DIRECTORY_V1`. Merely selecting
diagnostics does not write source. Empty requests, a request in another output
mode and conflicting diagnostic selectors refuse. **Library-driver and actual
extractor-binary qualifications are separate**; neither is asserted passed here.

## 5. Choose an intentional typed edit

An optional `edit` object supplies five registers in input0, input1, input2,
scratch, output order, plus 1–16 typed instructions. This object preserves the
fixture's program exactly:

```json
{
  "registers": [10, 11, 12, 8, 9],
  "instructions": [
    {"kind":"binary","opcode":"xor","destination":"scratch","left":"input0","right":"input1"},
    {"kind":"binary","opcode":"and","destination":"output","left":"scratch","right":"input2"}
  ]
}
```

Insert it as the request's `edit` field. To change behavior intentionally,
make a separate request with a different absent candidate path and this edit:

```json
{
  "registers": [10, 11, 12, 8, 9],
  "instructions": [
    {"kind":"move","destination":"output","source":"input2"}
  ]
}
```

Binary operations are add, subtract, and, or and xor. Destinations are only
scratch/output; inputs are read-only. Register aliasing/out-of-range roles,
unsupported instruction forms and reads before definition are rejected.
There is no arbitrary Rust or assembly-string escape.

`program_edited` describes a changed typed representation, **not an equivalence
proof**. The copy/preserving candidate's oracle remains `(a ^ b) & c`; the
behavior-changing candidate's oracle is `c`.

## 6. Compile each generated source afresh

A publication report requires `fresh_compilation_required: true` and records
`fresh_compilation_observed: false`. Obtain real package metadata for the actual
candidate, then run a **fresh frontend** over its bytes. The old source owner
cannot stand in for it. Keep each new source/semantic/canonical identity separate.

For the bounded exercise, compare outputs against the appropriate independent
oracle across scalar values, output lengths and grid sizes. Check the whole
offset view, initialization and surrounding canaries, not just one element.
Inspect the actual new helper definition/call relation. CPU observations are
not GPU execution, race-freedom proof or physical-register samples.

The ordinary native pipeline still uses LLVM IR, with constrained inline
assembly for authored regions and compiler-owned surrounding code. This lab
does not bypass LLVM, invert arbitrary machine code into Rust, establish an
arbitrary lossless round trip, or qualify a physical helper register-save ABI.

## 7. Preserve failure evidence

An action may write the original owner's two inert diagnostic files before
refusing the requested edit. Successful publication followed by a later failure
may leave a candidate without a final report. Preserve the first failure and
inspect existing outputs before deciding how to continue.

- `NotAttempted` means the publisher did not attempt create-new publication;
  it is not a claim that no unrelated file existed already.
- `MayHaveCreatedCandidate` conservatively includes an attempted no-replace
  publication. An existing-candidate refusal can have that effect without
  creating another file.

No automatic overwrite, rollback, retry, recompile or launch occurs. A crash,
timeout, arbitrary compiler failure or absent final JSON is not a passing
negative control. A historical receipt alone is not source custody, compiler
custody, proof, protected artifact or launch authority.

## Exact source copies and dated qualification

These two files are copied byte for byte, including their feature-selected
negative cases, from the compiler fixture directory at the implementation commit above:

| Retained source | Bytes | SHA-256 |
| --- | ---: | --- |
| `examples/ordered-composition/publish.rs` | 2050 | `c32ebad7546176aa8e1317d473eff387f94eaa5f87b4074d60a3f7832d058fcb` |
| `examples/ordered-composition/composition.rs` | 5334 | `03f54f05cd0f0666a1740dbd2fbaae1e705ede2511fd7349e22be0122d238915` |

These source hashes establish retained bytes only. The dated
[compiler qualification report](https://github.com/harsh-nod/fe2o3/blob/634ec52439fb6ae8329d0cc6ba52be41fdee3739/docs/ordered-composition-qualification-20260924.md)
records the separate producers and retained evidence. This lesson does not embed
the raw root receipts or confer authority through their hashes.

| Completed gate | Observed scope | Root receipt SHA-256 |
| --- | --- | --- |
| Source publisher R7 | 9 sessions, 3 publications, 2 fresh compilations and 128 CPU invocations | `2108c7a836295fc3d554b08b360eec8fa091983d016d897751f106f1d56122bf` |
| Public library action R1 | 17 children, 3 fresh callbacks and 96 CPU invocations | `993251eaa4307c1ebe842c79727f09eec59721917eb557d79c7a7602ec44b700` |
| Actual extractor CLI R2 | 17 binary invocations plus 3 fresh callbacks, 96 CPU invocations | `7f4852d86291905c11c4fc93805bfdb94301e199970a0c5e2b6fe144db706579` |
| Ordinary normal path R6 | 36 real rustc sessions, 7 finite variants, 21 descriptor mutations | `b1d52c1ca5cc7a2a5a9b8784f70624768b8c76b3ecc51db9a4967ba468b23805` |

Fresh callback identities were observed live; separately retained fresh
canonical files are not claimed. These are historical gates on their recorded
source snapshots, not a claim that every gate used the final publication commit.
The merged-source regression also passed; its boundaries are recorded in the
[implementation status](https://github.com/harsh-nod/fe2o3/blob/634ec52439fb6ae8329d0cc6ba52be41fdee3739/docs/assembly-authoring-implementation-status.md).

The static native matrix was incomplete: 13 of 14 cases joined authored
instruction intervals, while two calls to one helper at O0 hit a duplicate-edge
refusal. That failed gate remains evidence, not a pass. Freshly promoted source
has not yet passed a fresh ordinary native matrix. Normal LLVM/handoff, static
native analysis and hardware execution remain separate; **no GPU execution is
claimed by this lesson**.

This is a bounded authoring/composition/source-edit slice. M2/M3/M6/U4 and the
broader milestone exits are not closed by this lesson. Accepted exits remain
**6/18**; no `FE2O3_PIN` or maturity level is changed.
