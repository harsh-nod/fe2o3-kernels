# Inspect source variables at a retained resource checkpoint

The existing **Open local resource recording** panel can display optional
Source Variable V2 queries alongside its checkpoint SSA values and memory
windows. It reads paired local JSONL files; it does not connect to a debugger,
execute imported requests, or reconstruct locals from assembly instructions.
This tutorial describes the supported workflow and acceptance checks, not a
claim that a particular capture or qualification run has passed.

For a complete root-plus-current-helper stack, use the separate
[ordinary helper lab](resource-helper-source-values-v2.md). It retains source
variables for helper frame 2 and SSA values for both frames. The commands below
remain the original single-root-frame exercise; do not substitute a helper
recording for its source fixture or expected values.

Every browser import remains **caller-supplied / unverified**. A retained
`compiler_bundle_bound` source label is an input claim, not browser-authenticated
source provenance. SHA-256 values identify selected file bytes, not their
producer. There is no new wire schema, public debugger service, curriculum
release, publication-pin change, or hardware capability in this walkthrough.

## 1. Produce fresh source and debugger evidence

Use the companion fe2o3 compiler checkout with its pinned toolchain and tools
built from the same source revision. The build prerequisites are described in
[Inspect the real lowering of a Rust kernel](inspect-lowered-kernels.md).
The required binaries are `fe2o3-rustc-extract`, `fe2o3-export-sim`,
`fe2o3-author`, `fe2o3-kir-sim`, and `fe2o3-debug`. The scripts use
`CARGO_TARGET_DIR/debug` when that variable is set, otherwise `target/debug`.
Run these commands from the compiler checkout, not the site checkout:

```sh
source_values_run=$(mktemp -d)
node scripts/assembly-authoring-v30-smoke.mjs "$source_values_run/source"
node scripts/resource-source-values-v2-smoke.mjs \
  "$source_values_run/source" "$source_values_run/queries"
```

The second command's arguments are `SOURCE_ASSEMBLY_SMOKE_DIRECTORY` and
`NEW_OUTPUT_DIRECTORY`. Both child directories above must be new; neither
script overwrites a prior run. Do not create those two child directories first.

The first script freshly compiles the real
`crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs`
fixture, exporting its baseline and explicitly edited Rust variants. It checks
their independent wrapping-u32 output oracles and canaries in CPU simulation.
The second script consumes the baseline `base-v6.fe2sim`, `base-request.json`,
and `receipt.json` from that exact source run. It checks their retained
identities against the current source and admits the bundle through the public
tools before starting `fe2o3-debug sim --bundle-v6` with logical wave width 32.
That display width is not a claim about executed hardware waves.

For this fixture, each typed-instruction marker is a single-operation block.
The source-value script first establishes a captured checkpoint and discovers
the output allocation. Its retained forward, reverse, and repeated-forward
groups then each use `step` with `granularity: "operation"` and **`count: 2`**.
This crosses the single-operation block's after-operation checkpoint to a
before-operation stop with an available frame. Replacing the trio with
single-step requests can land at an unsupported frame boundary. Do not add a
missing `next_operation`, rewrite a snapshot, or invent a source value to make
that stop displayable. Use the actual returned response or report the refusal.

A successful run is expected to create these separate artifacts:

- `debug-requests.jsonl` and `debug-responses.jsonl`: the complete original
  interaction, including setup, deliberate refusal checks, and termination.
- `resource-source-values.requests.jsonl` and
  `resource-source-values.responses.jsonl`: the importable successful
  checkpoint/stack/source-page/memory groups, selected from the original lines
  without reserialization, field changes, or renumbering.
- `observations.json` and `receipt.json`: the script's derived checks and byte
  identities. They are not substitutes for the original paired lines or proof
  of producer authenticity.

The script requires actual wrong-frame, changed-selector cursor, stale-revision,
and old-cursor refusals without a changed stopped session. A failed run retains
failure/partial evidence instead of manufacturing successful observations.
Inspect the actual exit status and artifacts before describing a run as passed;
the [retained example](../examples/source-variable-resource-v2/README.md) records
one separately observed successful run with exact byte identities. Its local
receipt does not authenticate the producer or qualify a new browser import.

## 2. Open the paired excerpt in the existing importer

1. Open `#/debugger/source-isa-agent`, then **Open local resource recording**.
2. Select `resource-source-values.requests.jsonl` in **Requests JSONL** and
   `resource-source-values.responses.jsonl` in **Responses JSONL**. Choose
   **Import local recording**. Do not import the full debug transcripts: their
   setup, termination, and expected-error pairs are outside this importer.
3. Check the caller-supplied warning, file byte counts, SHA-256 values, and
   **Imported checkpoint** event/revision labels. The new
   **Source variables at this recorded checkpoint** panel is separate from
   **Checkpoint SSA values and source** and the memory window.
4. Open **Recorded source-variable selection and identity**. Inspect the actual
   stack/page request IDs, function, block, next operation, and both anchors.
   Do not substitute hard-coded event numbers from another run.
5. Choose each of the forward, reverse, and repeated-forward checkpoints.
   Reverse moves to an earlier event while the state revision increases.
   Repeated forward returns to the same event as the first retained group with
   another revision. A matching event number does not make old queries current.
   Changing the selection only browses retained data; it does not replay a
   debugger or issue a new source-variable query.
6. Choose **Show original paired lines**, then a stack or source-variable
   **Original pair**. The displayed lines retain the original IDs and final LF.
   Revisions, allocation identities, and page cursors are inert recorded data,
   not commands or tokens for another session.
7. Replace either selected file or use **Reset local recording**. Old data must
   clear immediately. A missing, stale, malformed, or unsupported source query
   must never leave the previous checkpoint's named-variable table on screen.

The script's source checks require captured u32 parameters `a` and `b` with
bits `0xfffffff0` and `0x00000025` and represented storage generation 1.
These are genuine source-variable query results to inspect in a successful
recording, not names inferred by matching equal SSA bits. The output parameter
`out` and local `result` are required to remain `unavailable: not_represented`
with generation 0 in this profile. This does not mean that the output allocation
or computation is absent. General local-variable reconstruction is not supplied.

The retained early memory windows should still contain four initialized
`a5 a5 a5 a5` words followed by `de ad be ef ca fe ba be`. This source-value
trio does not attribute an output write or demonstrate final-kernel completion.
The preceding source-authoring smoke separately checks the completed kernel's
output; do not turn that separate result into a value at an earlier stop.

## 3. Keep the anchors distinct and the page chain complete

The supported refinement is deliberately narrow:

| Retained observation | Anchor relationship |
| --- | --- |
| Independent successful operation-step control | Original unframed cursor, logical scope, KIR site, and source association |
| Complete stack and memory query | Exactly the same unframed checkpoint anchor |
| Source Variable V2 pages selecting frame 1 | The same cursor, scope, site, and source association, plus explicit `frame: 1` and legacy `occurrence: 1` |
| Separate helper lab, selecting current frame 2 | The same unframed checkpoint relationship, plus explicit `frame: 2` and legacy `occurrence: 1`; complete stack/SSA data still includes the suspended caller |

The source anchor is not identical to the unframed control anchor. Neither is
modified or stripped to force equality. Legacy occurrence 1 is not an
authenticated dynamic helper activation, recursion identity, or allocation
generation. The stack's `next_operation` can differ from the checkpoint's
recorded operation; both recorded values stay visible rather than being
normalized into one coordinate.

For each checkpoint group, retain successful pairs from the same stopped CPU
session in their original, strictly increasing request-ID order:

- The independent V1 `step` control pair must provide the exact active captured
  logical-lane checkpoint, with resolved `compiler_bundle_bound` source data and
  a KIR operation site. Do not take the source query's own anchor as independent
  evidence of the selected checkpoint.
- V1 `inspect_stack` uses dispatch selection and one complete page. This
  single-frame exercise selects frame 1 in the checkpoint's function and block,
  with an available next operation. Its captured value count and every retained
  checkpoint SSA root's function/frame must agree. The separate helper exercise
  permits exactly the root plus one nonrecursive current helper and accounts for
  every frame's SSA rows; only current helper frame 2 supplies named variables.
  Partial stacks, deeper/repeated-function stacks and arbitrary frame selection
  remain unsupported.
- V2 `inspect_source_variables` uses dispatch selection, explicit frame 1,
  `selector: { selector: "all" }`, and the exact stopped revision. The script
  uses page limit 2. Keep that limit fixed and retain every response and every
  continuation request through the response without `next_cursor`.
- Each continuation must use the preceding returned cursor with the same query
  identity and exact accumulated row position. Cursor-following pages cannot
  be empty; an initially empty complete query remains distinct from a missing
  query and does not prove the source has no variables. Variable identities
  cannot repeat across pages. Changed selectors, omitted pages, extra pages
  after completion, or changed frame/session/snapshot metadata are refused.
- Include at least one supported resource response or memory response per
  checkpoint, as required by the existing importer. This workflow supplies the
  same-stop 24-byte V1 `read_memory` pair. Stack/source pages alone are not a
  standalone recording format for this panel.

The stack/control/memory requests and responses use the existing
`fe2o3-debug-request-v1` / `fe2o3-debug-response-v1` envelopes. Source queries use
`fe2o3-debug-source-variable-request-v2` /
`fe2o3-debug-source-variable-response-v2`. Do not relabel one schema as another.
An optional stack/source group must be complete and valid: a partial or
inconsistent group refuses the import, rather than silently disappearing.
Older otherwise valid resource recordings with no source group still import;
their source-variable panel explicitly reports that no query was retained.

## Display limits and evidence boundaries

The importer retains its limits of 256 KiB per file, 64 KiB per line, 128 paired
lines, and 32 checkpoints. Use strict UTF-8, LF endings with a final LF, and no
BOM. The source panel supports at most 64 complete variable rows across 32
pages, page limits 1–64, and names of at most 4096 UTF-8 bytes. It refuses a
larger or incomplete table instead of displaying a misleading prefix.

Scalar display supports bool, signed/unsigned integers of 1–64 bits, and
index32/index64 with exact bits and lossless integer interpretation. f16/f32/f64
remain raw bits, not guessed floating-point values. Allocation-relative
pointers keep exact unsigned 64-bit allocation identities and byte offsets;
only allocation generation zero is supported here. A source variable's storage
generation is separate metadata, not that allocation generation. Pointers are
not dereferenced, converted to native addresses, or treated as lifetime proof.

Unavailable, redacted, and ambiguous bindings retain their distinct status and
reason. They never become zero, false, or a guessed same-name value. Equal
names, equal bits, or adjacent rows do not establish source-variable-to-SSA
correspondence. Aggregates, wider integers, general locals, physical register
state, dynamic helper activations, source authentication, and hardware values
remain outside this scalar recorded profile.

The importer preserves the original raw paired lines and freezes its retained
objects. Presentation does not edit source files or a compiler bundle, upload
files, persist a debugger session, or grant proof/load/launch authority. CPU
recordings are neither hardware observations nor performance predictions.
See the [recorded-resource importer guide](recorded-resource-import-v1.md) for
the existing memory/access views and their separate restrictions.


Dated test results and their limits are recorded in the
[September 22 qualification](source-values-qualification-20260922.md).
