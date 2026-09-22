# Draft: view logical before, after and reverse observations

First follow [bounded instruction-program authoring](ordered-program-authoring-v1.md).
This companion explains the ordinary CPU debugger and a separate display-only
recorded viewer. It does not add a curriculum route or change `FE2O3_PIN`.
The viewer now includes selected observations from a passing 36-session public
V17 debugger batch. The standalone commands below remain draft reproduction
instructions; synthetic controls and browser layout tests are separate from
the retained source/debugger observations.

For a separate ordinary-Rust profile, see the
[explicit-initialization fault/replay lab](ordinary-source-fault-replay-v1.md).
Its bounded CPU qualification is recorded there; terminal values remain unavailable
and its full-session transcript is not input for this recorded program viewer.

Use the matching [compiler checkout](https://github.com/harsh-nod/fe2o3/tree/f5e81f985ff3e2771ad0f132d483f5cf74976ad6),
[V17 smoke driver](https://github.com/harsh-nod/fe2o3/blob/f5e81f985ff3e2771ad0f132d483f5cf74976ad6/scripts/ordered-program-debugger-smoke.mjs),
and [JSONL protocol](https://github.com/harsh-nod/fe2o3/blob/f5e81f985ff3e2771ad0f132d483f5cf74976ad6/crates/fe2o3-debug-protocol/README.md).
The older fixed-pair V16 client and retained viewer remain separate.

## Retained qualification and byte pins

The maintainer's retained source batch `phase9-ordinary-source-r1` passed six
exports, eight intended source refusals, 36 independent CPU result checks and
15 CLI refusal controls. `phase9-public-debugger-r1` consumed those same exports
and passed 36 fresh debugger sessions with 1,224 commands: one/three/sixteen-step
programs, used/unused results, and six scalar-input cases per variant. It checked
lane-0 logical values and, separately, all 64 output words and write histories.
It did not inspect logical SSA values for all 64 lanes or test foreign-session
tokens. Compiler implementation links are pinned to the qualified source commit
`f5e81f985ff3e2771ad0f132d483f5cf74976ad6`, independently of `FE2O3_PIN`.

The [checked-in display input](../examples/ordered_program_observation_v1.json)
contains 941,567 bytes. It preserves nine selected original request/response
pairs per session for four whole-program checkpoints, plus current-owner
declarations; it is not the complete execution transcript.

| Retained item | SHA-256 |
| --- | --- |
| Display input | `6ae5be6ed1843aff7c84ab9d57cb5bee740d44c5f2ec254baa5270eb46fce468` |
| Maintainer source receipt | `e0efff8694beb6e9decebe3f95f5ba0940aecdc63e06dc58941ef985401dde9f` |
| Maintainer public-debugger receipt | `7b61dfb1f581830779da2352afbcf3589b437f6d62dd3653abf7809201167893` |

The full receipts and original streams remain in the maintainer's retained
qualification directories, not this display input. Their hashes are content
references, not signatures or independently authenticated compiler custody.
No GPU execution, physical-register contents, instruction microsteps, register
lifetimes, live connection or protected compilation-resume authority is supplied.

## Separate declared instructions from observed values

One authored sequence of one to sixteen instructions is one logical CPU
operation. The inspector supplies its declared instruction/register plan.
Debugger responses supply actual logical SSA observations at whole-program
checkpoints for one selected simulated invocation.

| Checkpoint or row | What the view can show | What it cannot establish |
| --- | --- | --- |
| Before whole program | Three queried input values; result explicitly not in scope | Initialized physical scratch/output |
| After whole program | Queried logical result | Per-instruction or intermediate scratch states |
| Reverse-restored before | Queried inputs at the new revision | Reusing an old cursor or resuming compilation |
| Repeated after | Queried result after another forward step | A second GPU execution |
| Declared instruction row | Opcode, order and bound register roles | A physical instruction stop or physical register value |

Only logical lane 0, workgroup `[0,0,0]`, wave 0 is selected by this retained
viewer. There is no lane selector or claim of all-lane SSA inspection. The
ordinary smoke session separately checks all 64 output words and write records.
Those memory observations are not additional program-result checkpoints.

For inputs `(19, 23, 42)`, independently expect results 19, 23 and 12 for the
one-, three- and sixteen-step programs. Unused-result variants still expose
those logical results while storing 19. Never infer the program result from
output memory alone or fill an unavailable scratch value with zero.

## Start a fresh ordinary JSONL session

Keep `program_repo`, `program_bin` and `program_run` from the authoring recipe.
Inspect each new KIR/request pair, using a fresh report path, before debugging:

```sh
"$program_bin/examples/inspect_diagnostic_ordered_program_v17" \
  "$program_run/three-used.kir" "$program_run/request.json" \
  > "$program_run/three-used-debug-inspection.json"

"$program_bin/fe2o3-debug" sim \
  --diagnostic-kir-v17 "$program_run/three-used.kir" \
  --request "$program_run/request.json" --wave-width 64 --protocol jsonl
```

Send one request per line. Start with discovery:

```json
{"schema":"fe2o3-debug-request-v1","request_id":1,"expected_revision":0,"operation":"discover_capabilities"}
```

Discovery alone tests no values. Build subsequent requests using the protocol
types and the new inspector's `coordinate`, `input_value_ids` and
`result_value_id`; do not paste identities from a previous compilation.

1. Set a `site` breakpoint at this operation's `before_operation`, scoped to
   logical workgroup `[0,0,0]`, wave 0, lane 0. Use roster block ordinal, not
   `raw_block_id`.
2. Continue to it and retain the complete returned snapshot anchor. Query the
   three current input SSA values and compare with 19, 23 and 42. Query the
   result and require `not_in_scope`, not zero.
3. Step forward one event, check the same operation's after checkpoint, and
   inspect the result. The three-step example should agree with independently
   expected 23. Sixteen declared steps still cross one whole-program operation;
   they do not produce sixteen instruction-step observations.
4. Reverse one event and query the restored inputs; step forward again and
   query the repeated result. Event positions may repeat while revisions change.
   Always use the latest revision and complete matching anchor.
5. Continue to completion. Separately verify the 264-byte backing, initialization
   bits, unchanged/uninitialized guards and all 64 four-byte writes at offsets
   `4 + 4*lane`. This is all-output memory coverage, not all-lane SSA coverage.
6. Check explicit physical/source unavailability and retain the exact
   request/response streams and stderr before terminating the session.

Resource queries bind the current configuration, snapshot and cursor. Their
page tokens are session-local and single-use. A wave64 active mask can be
`18446744073709551615`, larger than JavaScript's safe integer range. Preserve
raw JSONL and use lossless integer parsing; a `Number` roundtrip corrupts it.
Declared source identities do not authenticate source spans. The current
frame selector is stack-depth based and its occurrence field is `1`; neither
is a dynamic helper-call identity or loop-iteration counter. This closed
single-occurrence program does not qualify those broader debugger capabilities.

## Run the bounded public exercise

The V17 smoke driver consumes a current export and request; it does not build or
export source. Use Linux and Node.js 22, direct absolute regular-file paths,
a new output directory, and at least 40 GiB free plus 10 MiB output headroom.

The explicit descriptors for the three reviewed source branches are:

| Profile | Active descriptors, not machine encodings |
| --- | --- |
| One | `8` |
| Three | `133,307,413` |
| Sixteen | `0,141,323,188,321,58,64,181,60,331,73,194,56,333,16,72` |

For the three-step used-result example, read the current inspector's four
declared IDs. This merely supplies matching declarations to the driver; it is
not an independent source-custody check. Do not copy old fixture IDs.

```sh
program_source_ids=$(node --input-type=module - "$program_run/three-used-debug-inspection.json" <<'JS'
import { readFileSync } from 'node:fs';
const inspection = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const ids = inspection.declared_source_ids;
console.log([ids.frontend_unit, ids.function, ids.contract, ids.statement].join(','));
JS
)

node "$program_repo/scripts/ordered-program-debugger-smoke.mjs" \
  --debugger "$(realpath "$program_bin/fe2o3-debug")" \
  --inspector "$(realpath "$program_bin/examples/inspect_diagnostic_ordered_program_v17")" \
  --kir "$(realpath "$program_run/three-used.kir")" \
  --request "$(realpath "$program_run/request.json")" \
  --output "$program_run/three-used-debugger-smoke" \
  --result-mode used --operand-order 0,1,2 --register-plan 32,33,34,35,36 \
  --descriptors 133,307,413 --source-ids "$program_source_ids"
```

For another profile, use its own KIR, fresh inspection/IDs, matching descriptors
and a new output directory. For an unused-result kernel use `--result-mode unused`.
The driver independently derives arithmetic expectations from the explicit
descriptors/request rather than treating debugger results as its oracle.

Inspect `smoke.json`, `inspection.stdout`, `inspection.stderr`, retained file
pins, and `session/` request/response streams. The exercise checks selected-lane
before/after, reverse/repeat, stale-state refusals, bounded resource pagination,
consumed-token refusal, all final output bytes/init/guards and write history.
An unsuccessful or truncated run is not a capture to publish. Keep failures.

Wave32, mixed canonical selectors, source-map overrides and persisted schedule
replay are refused. Diagnosis V2 reports `unsupported_schema` for V17; ordinary
logical value/resource queries remain separate. Do not relabel this as another
canonical version or bundle format.

## Open the recorded-viewer tutorial

In the website, choose **Debugger → Cross-layer inspection → Open recorded
program tutorial**. The existing inspector lazy-loads the guided exercise and
the same pinned observations described above. Read the source excerpt, predict
Case 6 independently, then browse before/after/reverse/repeat checkpoints.
The arithmetic answer table is an independent source expectation, not a new
memory capture. Closing and reopening the tutorial clears its local selections.
This reference-page integration adds no curriculum lesson or maturity promotion.

### Separate development entry

From this website checkout, install the locked dependencies with `npm ci`, then
start `npm run dev -- --host 127.0.0.1`. Open
`http://127.0.0.1:5173/fe2o3-kernels/drafts/ordered-program-observation.html`,
using the actual port printed by Vite. This development-only HTML entry is not
a normal production-build entry or published curriculum route.

The retained-input module imports the pinned display input above. Missing,
changed or incompatible input produces an unavailable/invalid state instead of
a synthetic fallback. Browse the recorded observations as follows:

1. Choose the one-, three- or sixteen-step used/unused variant and request case.
   Those are distinct canonical/session identities, not a live debugger switch.
2. Read the five declared VGPR roles and instruction rows in order. Repeated,
   overwritten and dead writes stay visible, but contain no invented physical
   values. A register high-water is a binding extent, not allocator usage.
3. Choose before, after, reverse-restored before or repeated after. Only values
   actually queried in the retained response appear. A value not queried at that
   phase stays unqueried; a result before execution stays not in scope.
4. Compare event and revision alongside the configuration identity. Changing
   variant or request resets checkpoint selection instead of retaining stale
   values from the old identity.

The [presentation exporter](../scripts/export-ordered-program-observation.mjs)
accepts only a complete, passing six-variant by six-request retained batch:

```sh
node scripts/export-ordered-program-observation.mjs \
  /absolute/passing-retained-batch /absolute/new-ordered-program-capture.json
```

This is a maintainer presentation-export command, not a way to generate a batch
from a single smoke session. The required batch receipt and retained input
roster are specific to the reviewed qualification harness. The exporter
preserves original selected request/response JSON strings, checks receipt/file
joins and refuses missing, changed, redirected, truncated or mismatched inputs.
Output is create-new only. A failed write can leave an incomplete new output;
do not label it a passing capture or overwrite retained evidence.

The display adapter bounds inputs to 3 MiB and parses wave64 integers losslessly.
It validates the declared program, canonical/configuration/site identities,
whole-program checkpoints and value availability. File hashes detect changes
relative to supplied expectations; they do not authenticate a producer or
restore private compiler ownership. The page neither fetches data nor sends
debugger commands, compiles, launches or resumes anything.

## What remains unavailable

Physical VGPR/SGPR/AGPR values, scratch intermediates, physical EXEC, per-instruction
stops, live register lifetimes, occupancy, GPU memory and authenticated source or
final-machine mappings remain unavailable. An authored instruction row is not a
debugger cursor; a reverse checkpoint is not a mutable compiler snapshot.
Final output-memory observations must not be presented as an extra lane-zero
program checkpoint.

The inspector's canonical-size/structure bounds, CPU preflight accounting,
debugger retained-state bounds and browser/exporter bounds are separate limits,
not one combined allocator or RSS guarantee. Missing/truncated values must stay
unavailable. Pure synthetic controls and browser tests establish adapter behavior,
not actual source execution or real-capture qualification.

Every replacement capture must repeat the actual-source one/three/sixteen
used/unused exports and independent boundary requests, fresh ordinary JSONL
sessions and exact capture export. Publication also requires separate
both-theme desktop/mobile keyboard and full-site gates; debugger success alone
does not establish those checks. Keep source/compiler/tool/request/receipt
identities and selected-lane versus all-output coverage explicit. Earlier V16
captures remain unchanged and cannot be relabeled as V17. These drafts advance narrow parts of
[#280](https://github.com/harsh-nod/fe2o3/issues/280),
[#281](https://github.com/harsh-nod/fe2o3/issues/281), and
[#282](https://github.com/harsh-nod/fe2o3/issues/282), not their full milestones.
