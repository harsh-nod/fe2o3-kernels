# Debug an ordinary Rust kernel through a live local CPU session

This walkthrough connects the Source/ISA agent page to a separately started
CPU debugger. You export ordinary Rust once, choose that exact bundle and
simulation request on the host, and then step through its **CPU simulation**
from the browser. The browser does not compile or edit your Rust, choose a
program to execute, or launch a GPU.

**Qualification:** the [dated report](live-cpu-debugger-qualification-20260923.md)
records fresh source/CPU preparation for the exact vecadd example below and
separate real HTTP/browser checks using an assembly_chain u32 kernel. The
vecadd-specific live breakpoint/watchpoint exercise remains a manual,
implementation-matched walkthrough, not a retained passing vecadd browser
transcript. See [qualification and remaining coverage](#qualification-and-remaining-coverage)
for the exact distinction. Use matching compiler/site checkouts; an older
recorded viewer is not an equivalent live connection.

## What runs where?

| Part | Its job |
| --- | --- |
| Your Rust source and normal exporter | Produce the supported simulation bundle before debugging |
| The host's CPU debugger | Simulate that fixed bundle with the fixed request |
| A separately launched loopback bridge | Own one debugger child and relay a small checked command set |
| The local browser panel | Send explicit commands and display the latest correlated reply |
| Existing recorded resource viewers | Inspect their own retained files; remain independent of the live session |

This is useful for understanding logical control flow, inspecting available
allocation-relative bytes, stopping at an exact operation or observed memory
access, and revisiting earlier captured checkpoints. It does not expose physical
VGPRs, per-ISA-instruction execution, GPU memory, native timing or general
Rust-source-variable evaluation.

Start with a small kernel and a result you can predict. For this exercise, use
the compiler's unchanged `examples/vecadd/src/lib.rs` and its included
`vecadd_body.rs`. The actual kernel entry is:

~~~rust
#[kernel(typed)]
pub fn vecadd(a: &[f32], b: &[f32], mut c: DisjointSlice<f32>) {
    vecadd_kernel_body!(thread, (), production_f32_add, a, b, c);
}
~~~

This is an excerpt from the existing source, not a complete replacement file.
The included body obtains the global index, gets a disjoint output element and
stores the sum of the corresponding input elements.

## 1. Prepare matching tools and a private run directory

You need Linux/POSIX, Python 3.11+, a trusted matching compiler/toolchain build,
and a local `fe2o3-kernels` checkout containing the optional live panel.
The website's Node requirement is currently 22.22.1 or later. These instructions
do not install dependencies or build a compiler automatically.

Use the exact build environment and source revision selected for your run.
Keep `fe2o3-export-sim`, its sibling `fe2o3-rustc-extract` and matching backend,
`fe2o3-kir-sim`, and `fe2o3-debug` together. Do not combine a newly edited
source tree with an unrelated older backend or silently substitute libraries
after a loader error. The bridge itself also requires the unchanged neighboring
`scripts/debug-console/` modules.

The examples use task-specific shell variables. Replace every absolute path
before running them; none is a supplied qualified artifact:

~~~sh
cpu_bridge_repo=/ABSOLUTE/TRUSTED/fe2o3
cpu_bridge_tools=/ABSOLUTE/MATCHING/TOOLS/debug
cpu_bridge_cargo=/ABSOLUTE/PINNED/TOOLCHAIN/bin/cargo
cpu_bridge_rustc=/ABSOLUTE/PINNED/TOOLCHAIN/bin/rustc
cpu_bridge_site=/ABSOLUTE/MATCHING/fe2o3-kernels

umask 077
cpu_bridge_run=$(mktemp -d /ABSOLUTE/OWNER/RUNS/live-cpu-bridge.XXXXXXXX)
~~~

Use an existing owner-controlled canonical parent directory outside the source
and tool trees. Keep this new run directory and any failed attempts; do not
overwrite an earlier bundle, request, response or evidence directory.
The token created later must remain private, not become a public evidence file.

In a maintainer environment, run the exporter, simulation, bridge and site
under the owner's applicable wall-time, storage and process supervision.
The bridge's internal byte and cooperative timeout limits are not a complete
host resource sandbox.

## 2. Export ordinary Rust normally

Run in the prepared, matching toolchain environment:

~~~sh
cd "$cpu_bridge_repo"

CARGO="$cpu_bridge_cargo" RUSTC="$cpu_bridge_rustc" \
CARGO_NET_OFFLINE=true CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 \
"$cpu_bridge_tools/fe2o3-export-sim" \
  --crate fe2o3_vecadd \
  --output "$cpu_bridge_run/vecadd-v6.fe2sim" \
  --bundle-version 6 --target gfx942 \
  --target-dir "$cpu_bridge_run/export-target" \
  -- --manifest-path "$cpu_bridge_repo/examples/vecadd/Cargo.toml" \
  --lib --offline
~~~

The exporter invokes the normal Rust frontend and enforces Cargo `--locked`.
The explicit offline flags require dependencies already available to the
selected toolchain. This is a normal source-produced Bundle V6, not hand-written
KIR, a GPU code object, a proof certificate or a compilation-resume token.

If export fails, keep the failure and fix the selected build/input mismatch
before debugging. Do not replace the bundle with a synthetic success, edit its
source map or reuse an unrelated capture. A future source edit requires another
fresh export and another set of selected byte identities.

## 3. Give the simulator a small explicit input

Create a **new** `request.json` in the private run directory, using your editor,
with this complete request:

~~~json
{
  "schema": "fe2o3-simulation-request-v1",
  "kernel": "vecadd",
  "grid": [4, 1, 1],
  "workgroup": [256, 1, 1],
  "arguments": [
    {
      "kind": "buffer",
      "element": "f32",
      "access": "read_only",
      "alignment": 4,
      "bytes": "0x0000803f000000400000804000000041",
      "initialized": "0xffff"
    },
    {
      "kind": "buffer",
      "element": "f32",
      "access": "read_only",
      "alignment": 4,
      "bytes": "0x0000003f0000c03f0000204000006040",
      "initialized": "0xffff"
    },
    {
      "kind": "buffer",
      "element": "f32",
      "access": "read_write",
      "alignment": 4,
      "bytes": "0xa5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5deadbeefcafebabe",
      "initialized": "0xffffff"
    }
  ]
}
~~~

The current unchanged typed vecadd metadata requires a 256x1x1 workgroup;
do not replace that with 64 because it is a familiar wave/workgroup number.
The grid contains only four logical work-items. Logical wave width, selected
later for visualization, is a separate setting.

The inputs represent A = [1, 2, 4, 8] and B = [0.5, 1.5, 2.5, 3.5].
Predict [1.5, 3.5, 6.5, 11.5] independently. The output contains four initial
0xa5a5a5a5 words followed by eight canary bytes, de ad be ef ca fe ba be.
The expected complete output byte string is:

~~~text
0x0000c03f000060400000d04000003841deadbeefcafebabe
~~~

These are chosen inputs and an arithmetic expectation, not recorded debugger
values or reusable allocation IDs. The initialization masks have one bit per
byte. This positive request marks all bytes initialized.

Run the standalone CPU simulator first, retaining new output files:

~~~sh
(
  set -C
  "$cpu_bridge_tools/fe2o3-kir-sim" \
    --bundle-v6 "$cpu_bridge_run/vecadd-v6.fe2sim" \
    --request "$cpu_bridge_run/request.json" \
    > "$cpu_bridge_run/positive.stdout" \
    2> "$cpu_bridge_run/positive.stderr"
)
~~~

`set -C` prevents those redirections from replacing existing files.
Check the process exit, result status and complete output argument in
`positive.stdout`, including its initialization mask and all eight canary
bytes. Check that the two input buffers remain unchanged. A status label
alone is not an independent result comparison. Stop on disagreement or a
structured refusal; do not label a partial result successful.

This standalone run is **separate** from the debugger execution started by
Connect. Its outputs do not become the debugger's starting memory: the debugger
will use the original fixed request again.

For the separately qualified explicit-uninitialized-input exercise, see
[the ordinary-source fault/replay lab](ordinary-source-fault-replay-v1.md).
That older producer/recording evidence does not qualify this new bridge.

## 4. Record the three selected byte identities

Before starting the bridge, review and record exact sizes and SHA-256s for:

- The trusted `fe2o3-debug` executable you intend to launch.
- The fresh `vecadd-v6.fe2sim` bundle.
- The unchanged `request.json`.

For example, these read-only commands report the selected files, not the secret:

~~~sh
wc -c "$cpu_bridge_tools/fe2o3-debug" \
  "$cpu_bridge_run/vecadd-v6.fe2sim" "$cpu_bridge_run/request.json"

sha256sum "$cpu_bridge_tools/fe2o3-debug" \
  "$cpu_bridge_run/vecadd-v6.fe2sim" "$cpu_bridge_run/request.json"
~~~

Copy the reviewed values into the startup placeholders below. Do not refresh
the expected hashes automatically after an unexpected file change just to
make a custody check pass. Keep the compiler/source version, normal build
receipt, launch environment and relevant script versions in your own run
record as well.

Hashes identify selected bytes relative to your expectations; they do not
authenticate a compiler, source provenance or dynamic dependencies. The
bridge retains file descriptors and checks file metadata/identities, but its
child still opens selected paths. A trusted immutable input set and launcher
are part of this profile, not an arbitrary hostile-filesystem sandbox.

## 5. Create a random, owner-only bridge secret

Use a new secret file in the private canonical run directory. This command
generates 32 random bytes as lowercase hex and refuses an existing path:

~~~sh
python3 -B -c 'import os,secrets,sys; p=sys.argv[1]; fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600); os.write(fd,secrets.token_hex(32).encode("ascii")+b"\n"); os.close(fd)' \
  "$cpu_bridge_run/bridge-token"
~~~

The bridge requires your UID, a non-symlink regular file, exact mode 0600,
one hard link, and 64 lowercase hex characters with an optional final LF.
Do not use a sample token, an all-zero value, a checked-in fixture or a
predictable password. Shape and mode checks alone cannot prove randomness.

Use your own trusted local clipboard workflow to copy the token's contents to
the browser password field later. Do not print it into retained logs, put it
in a command argument or URL, paste it into chat, include it in screenshots,
or commit it. Do not edit or replace the token file while the service is
running: token custody changes stop the service and trigger cleanup attempts.

## 6. Start the local website and bridge

The example uses **5173 for the website** and **8741 for the bridge**.
They are distinct listeners. Keep both bound to 127.0.0.1.

In a separate terminal in the site checkout:

~~~sh
cd "$cpu_bridge_site"
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
~~~

`npm ci` installs the existing lockfile; it does not upgrade dependencies.
Use the owner's already-provisioned dependency environment where appropriate.
With `--strictPort`, an occupied site port is a refusal, not a silent move
that would change the origin.

In the trusted compiler terminal, replace all six SIZE/SHA placeholders with
the reviewed numbers and lowercase hashes from step 4:

~~~sh
cd "$cpu_bridge_repo"
python3 -B scripts/debug-session-bridge/fe2o3_debug_bridge.py \
  --binary "$cpu_bridge_tools/fe2o3-debug" \
  --binary-bytes DEBUGGER_BYTES --binary-sha256 DEBUGGER_SHA256 \
  --kind bundle-v6 --input "$cpu_bridge_run/vecadd-v6.fe2sim" \
  --input-bytes BUNDLE_BYTES --input-sha256 BUNDLE_SHA256 \
  --request "$cpu_bridge_run/request.json" \
  --request-bytes REQUEST_BYTES --request-sha256 REQUEST_SHA256 \
  --wave-width 32 \
  --token-file "$cpu_bridge_run/bridge-token" \
  --port 8741 --origin http://127.0.0.1:5173
~~~

Use ordinary trusted Python script execution, not `python -I`, because the
bridge imports its repository-local neighboring modules. The selected tool
environment is trusted; the browser cannot change it.

Open:

~~~text
http://127.0.0.1:5173/fe2o3-kernels/#/debugger/source-isa-agent
~~~

The origin is only `http://127.0.0.1:5173`: no page path or hash.
`localhost` is not interchangeable with the explicitly admitted 127.0.0.1
origin. This initial profile does not admit the publicly hosted HTTPS website,
wildcard listeners or a remote bridge URL.

If the owner runs everything on mi350 and uses a browser on another machine,
the owner may separately choose loopback-only SSH forwarding for both ports.
For that arrangement, a workstation command template is:

~~~sh
ssh -N \
  -L 127.0.0.1:5173:127.0.0.1:5173 \
  -L 127.0.0.1:8741:127.0.0.1:8741 \
  mi350
~~~

Keep the same numerical ports on both sides so the exact Host and Origin
checks remain correct. Do not substitute wildcard binds, open a firewall or
expose the bridge on the network. Forwarding is a separately selected transport
arrangement, not evidence that this tutorial's browser connection has passed.

## 7. Connect explicitly and read the first response

On the Source/ISA agent page, choose **Open live CPU debugger**.
Opening the panel alone sends no debugger request.

1. In **Local CPU bridge address**, enter `http://127.0.0.1:8741`, without
   a trailing slash, page path or query.
2. Paste the secret into **Bridge secret**.
3. Press **Connect CPU debugger**, or Enter from the connection form.
4. Wait for **Current validated CPU response**.

The password field clears after submission. The secret remains only in the
client's memory for the selected connection and authenticated cleanup; it is
not saved in local/session storage.

Connect starts a new CPU debugger child and performs capability discovery.
Discovery alone is not evidence of successful kernel execution or that every query is
available. Read the displayed configuration, bridge sequence, state revision,
event sequence and backend status. **Lossless CPU protocol response** contains
the bounded backend object re-encoded by the bridge, not original wire bytes
or a capture receipt.

Validation checks correlation, session/cursor transitions and selected
source/memory joins, not every rule of the full Rust payload schema. Other
returned details remain backend-reported facts, not independent proof. Copy
IDs as their exact decimal text; a JavaScript Number conversion can round a
valid u64 and turn it into another identity.

There is one request at a time and no automatic retry. Wait for each reply.
The UI deliberately clears old values while a new command is pending rather
than leaving an earlier checkpoint looking current.

## 8. Step, inspect a source site and reverse

Press **Read CPU state**. If the snapshot is unavailable before execution,
that is an explicit state, not missing bytes to fill with zeros.

Set **Operation step count** to 1 and press **Step CPU forward**. Examine the
returned stop and snapshot. Operation-granularity stepping is a logical KIR
operation, not a Rust line, assembly instruction or physical GPU cycle.
A control's `events_advanced` is the actual event-cursor distance, not
necessarily the requested operation count.

At a captured stop:

- A state/control reply's snapshot is under
  `result.snapshot.snapshot` only when `result.snapshot.status` is
  `captured`. Its `anchor` carries the current cursor and execution scope.
- A source site, when present, is `anchor.site.kir`. Copy its
  `function_ordinal`, `block_ordinal`, and
  `point.operation_ordinal` only when `point.kind` is `operation`.
- **Read CPU stack** can provide `result.frames`. A row's
  `function_ordinal`, `block_ordinal` and present `next_operation`
  identify that row's next operation. An omitted next_operation is not zero.

Fill **Function ordinal**, **Block roster ordinal** and **Operation ordinal**
from one such actual current record, then choose **Resolve CPU source site**.
Do not mix fields from different records or paste IDs from this document,
a prior build or a retained example. Block roster ordinal is not a raw KIR
BlockId. Editing a query field clears the previous displayed response;
it does not advance execution.

A resolved source location may report file/map identities and byte ranges.
The panel does not fetch that file or authenticate the mapping, and this
operation does not query Source Variable V2. An unavailable source reason stays
unavailable. Stack frame depth is not a dynamic helper invocation identity.
A next_cursor means more rows exist beyond the bounded page, not that you have
seen the complete stack.

Now press **Step CPU reverse**, inspect the new event and revision, then step
forward again. Reverse selects earlier retained logical state; it does not
restore an old protocol revision. Revisiting the same event can produce a new
revision and cursor. The client uses the newest accepted revision
automatically—do not manually reuse an old one.

If reverse is unavailable, at the beginning, or outside retained history,
keep that refusal. It does not authorize reconstructing prior values.

## 9. Inspect an actual allocation-relative pointer

The live panel has no allocation-inventory query or automatic name-to-pointer
resolver. Use a pointer actually present in a current captured state/control
snapshot's `values`, rather than assuming that allocation 1 is A or 3 is C.

For a value whose `availability.status` is `captured` and whose
`availability.value.encoding` is `allocation_relative_pointer`, the
following are meaningful coordinates:

| Returned field | Browser field |
| --- | --- |
| availability.value.allocation.ordinal | Allocation ordinal |
| availability.value.allocation.generation | Allocation generation |
| availability.value.byte_offset | Allocation byte offset |

This is a logical allocation-relative pointer, not a native address.
Its presence alone does not supply the allocation's full capacity or prove
that it corresponds to a particular Rust variable. Do not infer a variable
mapping from coincident names or bytes.

For a first bounded query, use **Memory byte length** 1 at a returned offset
known to be inside the selected input's valid range. If range/availability is
not established, leave the exercise unavailable rather than invent a length.
A pointer can be one-past-end; its existence is not permission to read it.
After obtaining a valid small window, request a larger range only within
known bounds and the 1..4096-byte limit.

Press **Read CPU memory**. The response must refer to the requested allocation,
generation, offset and byte count, with an anchor matching its current session.
The panel shows returned storage bytes and the initialization mask, or an
explicit unavailable/redacted result. A clear initialization bit means those
stored byte bits are **not a valid initialized program value**. Never decode
such bytes as an observed float or integer.

If the current snapshot has no captured allocation-relative pointer, this
small panel cannot discover one by guessing. Step to another actual captured
operation if appropriate, or use the existing separately documented public
debugger/resource workflow. There is no hidden fallback in this UI.

## 10. Register a breakpoint, then check whether it really stopped

A breakpoint registration is not a breakpoint hit.

1. Obtain an actual operation coordinate as in step 8. Enter its three
   ordinals and select **Breakpoint phase** Before operation or After operation.
2. Press **Set CPU breakpoint**. A successful reply acknowledges one filter
   change; it does not invent a local ID.
3. Press **List CPU breakpoints**. Find the actual matching spec and copy its
   `breakpoint_id`. Lists contain at most 16 rows; do not assume an omitted
   page is empty.
4. Set a small **Continue event budget**, such as 32, and press
   **Continue CPU execution**.
5. Call it a breakpoint stop only if the actual returned stop has reason
   `breakpoint` and its `breakpoint_id` matches the listed filter.

A site already passed may not be encountered again; a bounded continue may
stop for another reason or reach the end. Inspect what happened instead of
claiming success because setting the filter succeeded. The fixed vecadd input
has multiple logical invocations, but the number or order of stops is not
hardcoded into this guide.

To remove the filter, paste its exact ID into **Breakpoint ID to remove** and
press **Remove CPU breakpoint**. List again if you need to verify the resulting
backend page. Keep decimal IDs intact, including values larger than
JavaScript's safe-number range.

## 11. Observe a watchpoint without inventing memory at its stop

Use an actual allocation/generation/range established in step 9. Choose
**Watchpoint access** to match the access you want to observe: read, write,
atomic or any. For a write exercise, select a range that actual program
evidence shows will be written; do not rename an arbitrary pointer as output.

1. Fill the allocation, generation, offset and byte-length fields explicitly.
2. Press **Set CPU watchpoint**, then **List CPU watchpoints**.
3. Copy the backend's matching `watchpoint_id` and check its range/access.
4. Continue with a bounded budget and inspect the returned stop.
5. Claim a hit only for reason `watchpoint` with that same actual ID.

Watch timing is `after_commit`: it observes the matched modeled access after
commit, not a watch that prevents the access. A filter may never hit if the
selected access is not executed. Registration, a committed hit, and a
captured memory checkpoint are three different facts.

In particular, an exact watchpoint stop can have no captured snapshot.
If **Read CPU memory** or **Read CPU stack** then returns not_captured, do not
show an earlier window as “memory at the watchpoint.” You may make a new
explicit step to a captured checkpoint and query there, but that has its own
event/revision/scope and must be described as a later observation. Logical lane
or invocation may also differ.

Paste the listed ID into **Watchpoint ID to remove** and use
**Remove CPU watchpoint** when finished. If you reverse and repeat an access,
compare the actual stops and revisions; do not assume old hit counts, cursors
or values are restored automatically.

The [recorded watchpoint/source replay lesson](resource-watch-source-replay-v2.md)
shows why stop versus checkpoint separation matters. That recording remains an
independent example, not live data from this connection.

## 12. Finish and clean up deliberately

Press **Disconnect CPU debugger** before closing the panel or replacing the
program. Live values clear immediately. The client sends cleanup for the
original captured connection ID using its original endpoint and secret.

Only the displayed confirmation that the bridge completed cleanup establishes
that response. It means the bridge observed its owned child leader reaped; it
does not mean a backend terminate command was acknowledged or prove that every
possible descendant/effect has disappeared.

Changing the address or password during a request invalidates live values and
aborts/discards late replies. It does **not** transfer the old child to the new
address or automatically connect to a new program. Disconnect still targets
the old captured connection. Reconnect is blocked until known cleanup.

If a request times out or its response is lost, it may already have changed
the debugger state. Do not retry the mutation. Use explicit cleanup; if cleanup
cannot be confirmed, the owner must investigate/stop that particular bridge
and child using the existing bounded supervisor, not infer success from a
closed browser tab. Closing the panel attempts bounded cleanup but provides
no success confirmation. Losing the whole browser page also loses its
memory-only cleanup handle; the service's independent expiry/owner supervision
remain important.

Once the child is closed, the owner can stop the bridge normally (Ctrl-C in its
own terminal) and stop the local site/tunnel they started. Keep failure records
and nonsecret artifact pins according to the owner's retention policy. Do not
publish the private token.

## How to interpret refusals

| What you see | What to do |
| --- | --- |
| Snapshot, stack, source or memory unavailable | Preserve the reason; do not substitute zeros, old values or guessed source |
| Inner backend error/unavailable with a checked unchanged session | Read that refusal; it is not successful execution of the requested query |
| Invalid/malformed reply or a transport timeout | Treat live state as unknown, clear it and request cleanup; never retry a mutation automatically |
| stale_session, stale_sequence or stale_revision | Do not rewrite or replay counters to force acceptance; clean up the original connection and start a genuinely fresh one |
| source location missing or next_operation omitted | Do not infer a source variable, operation zero or a dynamic frame |
| completed with outcome failed | The run ended unsuccessfully; “completed” alone does not mean correct output |
| resource_limit or expired service | Retain the refusal and use the owner's fresh bounded-run workflow, not a cap increase inside the browser |

The bridge admits one active child and one in-flight backend operation.
Its child lifetime is 900 seconds; service lifetime 1800 seconds, at most four
distinct connections and 1024 accepted sockets. A child gets discovery plus
at most 254 commands. The browser's conservative 35-second request deadline
can expire before a slow but otherwise valid exchange finishes.

The response body cap is 1 MiB, with a 256 KiB re-encoded inner object.
Memory/watch requests are 1..4096 bytes; stack and filter lists are bounded to
16 rows with no automatic pagination. Parser graph limits may refuse a large
reply below the byte cap. These are explicit cooperative bounds, not total
process-RSS, hard-real-time, hostile-code or escaped-descendant guarantees.

## Recorded visualizations remain separate

The live controls do not feed or rewrite the existing resource/source/helper/
watch/fault viewers. Those importers accept their own exact retained profiles,
with their own fixtures and provenance boundaries. Do not paste a live bridge
HTTP envelope into a recorded JSONL importer or weaken an importer to accept it.

Conversely, moving a recorded-viewer slider does not advance the live CPU
session. Neither a recorded snapshot nor a losslessly re-encoded live response
is original full-run/source authentication. This initial live panel has no
capture-export button, Source Variable V2 query, source-body fetch, automatic
SSA/source linkage, allocation-reuse proof or dynamic activation identity.

See the [recorded debugger guide](ordered-program-debugger-v1.md),
[source-variable checkpoint lesson](resource-source-values-v2.md) and
[resource import contract](recorded-resource-import-v1.md) for those separate
workflows.

## Qualification and remaining coverage

The [dated qualification report](live-cpu-debugger-qualification-20260923.md)
retains exact tool/source/input/receipt pins, regression results, independent
reviews and failed attempts. These are separate profiles:

| Profile | Observed coverage |
| --- | --- |
| This ordinary Rust vecadd example, f32 / workgroup 256 | Fresh normal Bundle V6 export and standalone CPU simulation; four independent float results, unchanged inputs, initialization and all eight canary bytes |
| assembly_chain typed assembly source, u32 / workgroup 64 | Fresh source/CPU checks and real HTTP-to-debugger sessions independently in both compiler forks; genuine break/watch stops, source/stack/memory, reverse/repeat and observed child cleanup |
| Actual desktop/mobile browser sessions over the selected assembly_chain bundle | Two real Chromium sessions, 27 HTTP exchanges each; source/stack, five 24-byte windows plus two one-byte windows, real AFTER breakpoint/write-watch stop, explicit unavailable snapshot, first-write reverse/repeat and two observed child reaps; not full-kernel completion |
| Mocked frontend and process controls | Input replacement, stale/late replies, validation and cleanup failures; separate from actual-session evidence |

The first profile validates this guide's preparation and arithmetic, not every
vecadd-specific live step below. Filter/allocation/source IDs must still come
from the current run; no concrete transcript IDs are supplied as a shortcut.
The actual HTTP/browser runs do not establish real 900-second idle expiry,
uncertain-mutation abort or response-backpressure behavior. Related mock
controls are not a substitute for those remaining real-session tests.

These finite observations do not close the complete debugger V2 milestone.
Terminal fault capture before unwind, actual allocation lifetime/reuse,
richer linked source/resource values, protected production/proof continuation,
physical GPU execution and performance remain distinct owner-scoped work.
