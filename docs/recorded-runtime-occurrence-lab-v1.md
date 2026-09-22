# Follow repeated operations and helper calls

This lab browses an actual retained ordinary-Rust CPU execution. It is a separate diagnostic recording, not a live debugger connection, GPU trace, portable debugger session or assembly-to-Rust lifting feature.

## Open the retained recording

1. Download [recorded-runtime-occurrences.json](../tests/fixtures/recorded-runtime-occurrences.json) as raw bytes, without reformatting it.
2. Open the site's **Debugger → Cross-layer inspection** page and choose **Open recorded occurrences**.
3. Choose the downloaded file, then import it. The browser hashes the report bytes and checks the report's recorded bundle SHA against the reference. The binary bundle is not imported or rehashed by the browser. No file is uploaded, no command executes, and no selection is saved to browser storage.
4. Select one of six cases: rounds 0, 1 or 3, each with canonical or seeded-71 CPU scheduling. Select logical invocation 0–3, then an observed helper activation or an operation phase. Use previous/next to move through the filtered recorded rows.
5. Reset or replace the recording. Case, invocation and row selections must reset, including when replacing it with identical bytes.

The importer is deliberately a fixed retained-lab profile. Another well-formed recording, or this one reformatted as JSON, is refused because its byte identity differs. Generalized session import is not implemented here.

## Predict what the loop does

The [provenance fixture](../tests/fixtures/recorded-runtime-occurrences-provenance.json) contains the exact 718-byte Rust source, its hash, selected measured tool hashes and the capture receipt hash. The important part is:

```rust
#[inline(never)]
fn mix(value: u32, salt: u32) -> u32 {
    (value ^ salt) & 0xffff
}

// Inside the typed kernel, with a declared maximum of three loop iterations:
let trips = rounds % 4;
let mut iteration = 0_u32;
let mut value = seed;
while iteration < trips {
    value = mix(value, salt ^ iteration);
    iteration += 1;
}
```

The full kernel writes through a checked `DisjointSlice<u32>`; it is ordinary Rust, not an authored assembly kernel. For the retained seed/salt inputs, predict final values `0xabcd1234`, `0x0000479e` and `0x0000479d` for rounds 0, 1 and 3. The producer compared all four output words and the surrounding `0xdeadbeef`/`0xcafebabe` canaries.

| Cases | Recorded rows per case | Helper activations per case |
| --- | ---: | ---: |
| rounds 0, either schedule | 116 | 0 |
| rounds 1, either schedule | 180 | 4 |
| rounds 3, either schedule | 308 | 12 |

There are 1,208 rows and 32 helper activations total. Each invocation has exactly the chosen number of helper occurrences. The rounds-0 case must show **no helper**, not a fabricated activation.

## Read an occurrence correctly

An operation is not identified by its static instruction coordinate alone. Select the recording, case, logical invocation, activation token and attempt together. Repeated execution of the same operation has distinct attempts. Helper rows join to the recorded caller's before/after interval; an activation number from another case or invocation is not the same occurrence.

The runtime call coordinate is `[0, 1, 1]`: function index, raw runtime BlockId, operation index. The separate authoring-list coordinate is `[0, 3, 1]`: its block component is a roster position. **Raw BlockId 1 is not authoring position 1.** Neither coordinate is a source line or physical program counter.

A row is before-operation, after-operation or write-committed. Only a write-committed row contains an observed allocation, byte offset and u32 bit value. Those facts are not a reconstructed memory buffer. Before/after does not imply that memory or registers were captured.

A schedule decision ordinal orders recorded CPU decisions; it is not a timestamp or GPU cycle count. An activation token is not a complete call stack, source iteration variable or authenticated debugger frame ID. Logical invocation indices here do not describe physical lanes or wave residency.

## Navigate a helper's caller boundary

Choose the rounds-3 canonical case and logical invocation 0, then select an observed helper activation. The **Recorded helper/caller boundary navigation** group identifies that helper activation, case and invocation. It also appears when the selected row belongs to that helper or is its exact recorded caller-before/after row.

Follow the four recorded boundaries:

1. **Jump to recorded caller before** selects the caller's before-operation row for this helper occurrence.
2. **Jump to recorded helper first** selects this helper activation's first recorded row.
3. **Jump to recorded helper last** selects this helper activation's last recorded row.
4. **Jump to recorded caller after** selects the matching caller after-operation row.

Each jump clears the activation, operation-attempt and phase filters, but stays in the same case and logical invocation. The selected row's original ordinal is preserved; it is not renumbered to its position in a filtered list. The resulting row retains the same helper-instance navigation, so you can move between these boundaries without reconstructing the relationship yourself.

Repeat with another helper activation and with the seeded-71 case. The seeded recording can place an invocation's rows at a nonzero original ordinal. Filtered views can leave gaps between displayed ordinals; neither fact means events were invented or lost. Return to rounds 0: it has no helper activation and must not display a helper/caller navigation group. Unrelated root rows also have no such group.

These buttons change only the displayed recorded row. They do not run code, step a live process, create a checkpoint, recover a full call stack or map the raw runtime BlockId to an authoring roster position. Use the raw-file view to inspect the unchanged recording and the selected-row projection to inspect the current occurrence.

## What the lab can and cannot tell you

The importer rejects malformed or duplicate-key JSON, wrong hashes, missing/extra cases, out-of-order attempts, mismatched before/after sites, ambiguous helper/caller joins, missing helper operations and inconsistent committed writes. These are recording-consistency checks, not proof that arbitrary kernels are correct.

The actual retained execution also checked known outputs and canaries. Those checks can expose wrong results or writes in the tested cases; they do not prove all inputs or schedules safe.

The producer ran six observation-disabled comparisons and reported equal results/counts. Their event rows are absent. The viewer labels that as a **producer-reported comparison**, not another displayed trace or an independently replayed execution.

Unavailable here: checkpoint memory, source maps for runtime rows, full stacks, physical VGPR/SGPR maps, hardware timing, reverse execution and compiler-resume authority. The same-run static operation page is retained as provenance; it does not fill these gaps.

## Reproduction and evidence boundaries

The capture used fe2o3's diagnostic `debug-runtime-origin-source-v1-smoke.mjs` workflow and `observe_runtime_origin_source_v1` example with compatible, already-retained compiler executables on mi350. It exported a fresh bundle, ran the six contextual and six opt-out CPU cases, and retained a same-run source census, inspection and operation page.

The runner/source dependency checkout was `9d4387d2e30a92e9c2d0eea1117f1986d1dd16cf`. **The retained executables were not freshly rebuilt from that checkout.** Their bytes were measured before and after; this is not an authenticated build/runtime closure. The provenance JSON records those selected pins and all 12 successful capture stages. It is a summary, not a signature; the complete receipt and binary bundle remain on the capture host.

Report: 39,809 bytes, SHA256 `e0ab244eaf7fb0667b635dbe48408c1c51226ae5c38eb7766f1eab8aceb55c5c`.

Bundle: 38,358 bytes, SHA256 `73bd318be3af7bf1b98d093fc4bf95ca98ec4055b168b696d0a7a7abc5a57c75`.

Receipt: 220,199 bytes, SHA256 `85c967336810e178817fb4ed80419a81b741201ba65cc8d5ea246c642747df10`.

The browser accepts at most 512 KiB, six cases, 1,024 rows per case and 4,096 total rows. It displays one selected row at a time. Matching hashes establish byte consistency, not who produced a file or whether it is trusted.

This is a bounded loop/helper visualization increment toward V2/V5. It does not complete the full replay, hardware or curriculum milestones.

## Related authoring lab

The [source-promotion lab](source-promotion-lab-v1.md) covers a separate bounded
Rust-to-ordered-assembly authoring workflow. This viewer's loop/helper recording
is not a trace of that bitselect kernel, and navigation never compiles it.
