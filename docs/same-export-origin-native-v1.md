# Same-export whole-region origin and native comparison

This is a separate retained capture for the existing local repeat/native viewer. The historical example and its fixed join remain unchanged. The new capture keeps the same 23-artifact capsule; four compiler-origin reports are separate uploads, not a new capsule schema.

## Try the capture

1. Open the source/ISA page and choose **Open same-export origin/native preview**.
2. Save [the capsule](../examples/source_repeat_native_origin_comparison_v1.json) locally and select it in **Repeat-native capsule (local JSON)**. Nothing is fetched automatically.
3. Select one of the eight cases: one, two, fifteen or repeat, each at O0/O3.
4. Save that case label’s origin below and select it in **Ordered-origin report (local JSON)**. Both optimization cases use the corresponding source-origin report.

| Source label | Separate origin | Exact bytes | SHA-256 |
| --- | --- | ---: | --- |
| one | [one origin](../examples/source_repeat_origin_one_v1.json) | 3035 | `e833f05554e9973f911324fe62c34114dc1b5ec82ddcb4726c594d7b39e9b0ed` |
| two | [two origin](../examples/source_repeat_origin_two_v1.json) | 3115 | `91c5efeaef9b07fbe537aa1f170a0998b43db8de32d7f02d237c72dfb3ae8c56` |
| fifteen | [fifteen origin](../examples/source_repeat_origin_fifteen_v1.json) | 4161 | `bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a` |
| repeat | [repeat origin](../examples/source_repeat_origin_repeat_v1.json) | 4161 | `bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a` |

The independently selected join is `7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115`. The capsule is 1,105,533 bytes, SHA-256 `da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d`. The UI pin is application-selected, never supplied by the uploaded capsule. Pins check content consistency; they do not authenticate a producer.

All four origins came from the same normal exporter invocation as their own raw KIR output. The source receipt joins those outputs to the actual inspector, then retained LLVM/native receipts join each label to complete O0/O3 payloads. A successful local comparison checks exact canonical/semantic/source-inventory/source-preflight identities, declared source IDs, target/wave, structural KIR coordinates, descriptor order and register roles. Its status remains **matching reported identities**, not authenticated provenance.

One/two/fifteen have distinct current compiler subjects. Fifteen and repeat legitimately have identical origin bytes and reported subjects from separate repeated captures. Their case labels, report paths and native payload paths remain separate; a matching origin is not a unique-session identifier. The historical capsule has different compiler-source bindings and must not be joined merely because native bytes or Rust text happen to agree.

## What remains unavailable

The origin associates each descriptor only with the whole ordered region. It reports a macro call-site span, expansion span, chain digest and depth, not per-instruction source ancestry or a full macro frame list. Compiler file identities are not filenames. Native rows show exact retained instruction byte slices and descriptor capacities, not dynamic stepping, physical register values/lifetimes, occupancy or performance.

Switching native case (including O0/O3), replacing/clearing the capsule, or closing the panel clears the imported origin. A wrong-count origin yields an explicit mismatch; malformed replacement hides the old report. The panel invokes no compiler, debugger, native code, GPU, proof or production-resume action. It does not replay the source/CPU/native producer qualification.

Bounds are unchanged: one capsule ≤4 MiB, exactly 23 artifacts ≤2 MiB decoded, eight complete HSACO payloads, each sidecar ≤16 KiB, and ≤16 declared instructions. These are parser/import limits, not RSS or combined allocation claims.

The separate [dated qualification](same-export-origin-native-qualification-20260923.md) records fresh source/LLVM/native stages and the passing 1,382-unit/180-browser full site gate. These remain separate observations; they do not imply GPU execution or complete milestone acceptance.
