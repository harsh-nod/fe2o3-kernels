# Inspect bounded repeated instruction regions

The separate [source-origin lab](ordered-program-origin-lab-v1.md) explains
new whole-region compiler reports. Those captures are not automatically joined
to this retained native profile; matching source bytes alone are insufficient.

This optional local developer preview is a separate **23-artifact** profile. It
does not change the existing 14-artifact, four-case source/native comparison.
No example is loaded automatically, and opening the panel does not compile,
fetch a capsule, load a code object, or run a GPU.

## 1. Read the source shape

The selected profile describes this instruction region inside an ordinary Rust
kernel:

```rust
let result = amdgpu_ordered_program! {
    gfx942_xnack_off_wave64;
    scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;
    init { mov(out, input0); }
    repeat(15) { add(out, out, input1); }
};
```

This is a source-shape excerpt, not a standalone build recipe or a new execution
receipt. The complete retained source is shown in each admitted case. For this
profile, one initialization MOV followed by N ADD instructions yields
`a.wrapping_add(b.wrapping_mul(N))`. The selected counts are 1, 2, and 15:
2, 3, and 16 declared instructions, respectively. `repeat` is bounded source
expansion, not a runtime loop or a debugger instruction-step control.

The compiler path represented by the retained records is Rust source →
diagnostic canonical KIR V17 → LLVM inline assembly → native code object.
The LLVM region uses explicit bindings and side effects; this does not bypass
LLVM or give this viewer source-edit or compilation authority. CPU observations
apply to the whole ordered region before/after, not physical instruction
microsteps.

## 2. Select an independently pinned capsule

Open the optional repeat-native preview in the source/ISA inspection page, then
choose one local JSON capsule that was prepared separately. The page's fixed
historical expected join SHA-256 is:

```text
7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661
```

That value is selected in application code independently of the uploaded
capsule. It checks content consistency only: it is not a signature, producer
authentication, release qualification, or evidence that the current checkout
produced the files. Uploading a digest alongside a file would not establish
independence, so this panel offers no editable expected-digest field.

Download the checked-in
[retained repeat-native example](https://github.com/harsh-nod/fe2o3-kernels/blob/main/examples/source_repeat_native_comparison_v1.json)
using GitHub's **Download raw file** action, then choose that saved JSON file
under **Repeat-native capsule (local JSON)**. The example is not loaded or
fetched automatically. It contains the actual retained historical artifacts,
not synthetic test data; importing it performs local integrity checks, not
fresh source compilation, native compilation, or execution.

The complete example is 1,122,815 bytes with SHA-256:

```text
366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578
```

This whole-file pin is distinct from the independently selected join pin
above. Historical filesystem paths inside the capsule are inert provenance
text and are never opened or fetched. **Clear repeat-native import** removes
the selected case and role; selecting the saved file again starts at `one O0`.
A changed or wrong-join file shows a refusal with no previous case. This
tutorial does not assert a new execution. See the separate
[desktop/mobile qualification](repeat-native-qualification-20260923.md) for
the fresh browser checks against these retained artifacts.

The importer rejects an empty file or more than 4 MiB before reading it. It
requires exact UTF-8, rejects a BOM, and passes the raw string to the dedicated
profile validator. The validator requires exactly 23 artifacts, at most 2 MiB
of decoded artifact bytes, and eight complete HSACO payloads:

| Artifact kind | Count | Per-artifact bound |
| --- | ---: | --- |
| Source receipt, LLVM receipt, and strict join | 3 | 512 KiB, at most 8 chunks each |
| Source files, LLVM files, and native reports | 12 | 64 KiB each |
| Whole HSACO payloads | 8 | 64 KiB decoded each |

Each chunk is at most 64 KiB of text; payload hex must be even-length lowercase
hex, with at most two chunks per payload. All artifacts are checked before a
case is displayed. These are import/profile bounds, not a combined allocator,
RSS, compiler-work, or producer-capture budget. Named paths are displayed as
text only; no path, URL, continuation token, or dependency is followed.

## 3. Compare the eight distinct cases

Use the native buttons, including keyboard activation, to select `one`,
`two`, `fifteen`, or `repeat`, each at O0 and O3. `repeat` is a separately
retained observation of the fifteen-add source. Its report, case identity,
and payload path remain distinct even if its payload bytes match `fifteen`.
Changing the count changes semantics; this is not a claim that all counts are
equivalent.

The case table separates declared high-water 37 from descriptor-encoded
capacity 56 at O0 or 40 at O3, and the architected boundary 40. Capacity is not
measured register use, occupancy, performance, or a register-lifetime proof.
The instruction table checks contiguous four-byte slices against whole-file
payload offsets and the retained observer report; it is not fresh disassembly.

Select a row in the shared five-role VGPR grid. The profile declares scratch
v32, output v33, input0 v34, input1 v35, and input2 v36. Scratch and input2 stay
visible even though this region has no explicit uses of them. “No explicit
use” does not mean free, dead, or uninitialized. Gaps below the high-water mark
have no allocation status here. EXEC is a reported implicit read; no runtime
mask or physical register value is supplied.

## 4. Keep evidence and selection boundaries visible

The panel identifies synthetic test data separately from retained source/native
observations. A retained provenance label is itself unauthenticated. Receipts
report four source exports and 120 CPU simulations, but this view neither
reruns nor independently replays those executions. Raw source-export outputs,
CPU output streams, compiler/runtime closure, and files only named in receipts
are not added to the selected artifact set.

Choosing another file clears the prior case and register-role selection before
the new file is read. Clearing the import aborts its pending FileReader.
Changing the application-selected pin resets the import. Late old file reads
or hash completions cannot restore an earlier selection. Invalid or unavailable
evidence shows a refusal, never a synthetic fallback.

This view does not establish native whole-kernel correctness, physical
register values or lifetimes, GPU execution, performance, protected admission,
or production resume. See the existing
[14-artifact comparison](final-native-comparison-v1.md) for its separate
profile and retained qualification; none of those qualification claims are
transferred to this optional preview.
