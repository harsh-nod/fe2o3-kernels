# Read logical lifetimes inside a retained assembly region

This read-only view answers a narrow practical question: **which logical values must survive across each instruction in this finite region?** It complements the existing instruction-byte table and declared-register-use grid. It neither runs the kernel nor predicts the physical register allocator.

Open the source/ISA workbench, expand **Compare same-export origin and native captures**, and select the repository's [same-export retained capsule](../examples/source_repeat_native_origin_comparison_v1.json). Its independently selected join is `7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115`. The 23-artifact file is unchanged; the logical analysis uses the already checked source inspector's declared descriptors, input/result SSA IDs and exact KIR operation coordinate.

Choose one of the eight `one/two/fifteen/repeat × O0/O3` cases, then inspect **Logical def/use intervals**. The repeat label is a separately retained export/native observation, not a dynamic loop iteration. Equal programs do not merge their selectable case identities. Changing case, optimization, capture or checked bindings clears the logical selection.

## What the finite repeat example teaches

Its source initializes the output from the first input, then adds the second input 1, 2 or 15 times. Each write has its own analysis version:

- `input0 entry` is read by the initial move.
- `input1 entry` remains needed through the final add.
- `input2 entry` is an unused **region input**. This does not establish that its declared physical register is free.
- Each intermediate output version is read by the next add before being overwritten.
- The final output version supplies the actual retained KIR result SSA ID.

For these specific descriptors, two logical values are live at the peak instruction boundary. The read/write transient footprint is three: the input carried through, the previous output, and the newly written output. These are distinct measurements with different definitions. A real instruction can overwrite its source's storage, so the transient count is not a minimum physical-register requirement.

The number of sequential adds grows from 1 to 15 without increasing this boundary count. That shows why instruction count, logical live values, declared VGPR high-water, encoded descriptor capacity and actual occupancy must not be treated as synonyms.

## Exact semantics and limits

B0 is before the first instruction; Bk is after instruction k. Intervals are half-open over those **boundary indices**: `[start, end)`. An empty interval means the version has no later declared instruction read and is not the region result. Unused writes are still shown and still count in their instruction's transient footprint.

All read operands resolve before the instruction writes its destination. A self-read uses the previous version, not the newly written result. Repeated operand slots stay visible in the details, but one value counts once in a live set. This is syntactic use analysis: reads feeding later-unused writes are retained, and no dead-code elimination is performed.

The boundary count is the number of versions needed at that boundary. The transient footprint is the union of live-before, live-after, all read values and the new write. A separate operand/write count excludes unrelated values merely carried across the instruction.

The model permits at most 16 closed-profile instructions, 19 versions (three initial inputs plus 16 writes), 17 boundary columns and 32 read-operand slots. Only the selected case is rendered. All values have the selected region's u32 logical type; no value bits are evaluated or displayed.

## Identities and unavailable information

The enclosing importer first verifies the independent join pin, retained source/LLVM/native reports, complete payload bytes and exact per-case bindings. The logical view retains the inspector's function/block/operation roster coordinate and raw block ID. That is a **static operation identity**, not a runtime invocation, source line or replay event.

Only the three entry inputs and returned output have retained canonical SSA IDs. Intermediate versions are analysis labels created by this view; they are not new canonical KIR SSA definitions. No per-instruction source span, macro-frame ancestry or surrounding function/caller liveness is inferred.

The static instruction offsets remain in the neighboring existing byte table; selecting a logical version does not grant stepping or physical-register inspection. No GPU capture, allocator free/reuse replay, physical lifetime safety, source authentication, occupancy, timing, performance, proof or production authority is established.

This slice supports the compiler resource-view work; it does not by itself close #281 V3 or #280 M5. Existing [same-export origin/native](same-export-origin-native-v1.md) and [ordered-origin](ordered-program-origin-lab-v1.md) limitations continue to apply.

## Qualification boundary

The unit/browser tests distinguish synthetic analysis edge cases from the byte-pinned actual retained source/native capsule. The [dated qualification](ordered-role-liveness-qualification-20260923.md) records the full site gate and subsequent mobile-scroll correction checks. Importing the capsule does not re-export Rust, rerun its reported CPU simulations, disassemble a new artifact or execute hardware.
