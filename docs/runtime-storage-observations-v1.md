# Inspect actual CPU activations and storage incarnations

The **Live CPU runtime and storage observations** panel answers: which
invocation and operation attempt produced this record, which function calls
are actually active, and which allocation owns a particular reusable storage
slot now?

This is an opt-in extension of the
[live CPU debugger](live-cpu-debugger-v1.md). The existing
[checkpoint dashboard](live-checkpoint-dashboard-v1.md), recorded viewers and
default debugger behavior remain separate. This guide describes the bounded
interface; it is not a qualification receipt or a claim that all debugger
milestones are complete.

## 1. Select the owner-controlled profile

Follow the basic guide to prepare matching compiler/debugger tools, export an
ordinary source kernel, select its simulation request, review the byte sizes
and SHA-256 identities, and create a new private bridge-token file. You can
start with the assembly-chain export in the checkpoint dashboard guide. It
does not necessarily produce nested calls or storage reuse: those require
actual corresponding operations in the selected program and execution.

The local bridge owner adds `--runtime-observations v1` at launch. Using the
basic guide's reviewed paths and replacing every SIZE/SHA placeholder:

~~~sh
cd "$cpu_bridge_repo"
python3 -B scripts/debug-session-bridge/fe2o3_debug_bridge.py \
  --binary "$cpu_bridge_tools/fe2o3-debug" \
  --binary-bytes DEBUGGER_BYTES --binary-sha256 DEBUGGER_SHA256 \
  --kind bundle-v6 --input "$cpu_bridge_run/assembly-chain-v6.fe2sim" \
  --input-bytes BUNDLE_BYTES --input-sha256 BUNDLE_SHA256 \
  --request "$cpu_bridge_run/request.json" \
  --request-bytes REQUEST_BYTES --request-sha256 REQUEST_SHA256 \
  --wave-width 32 --runtime-observations v1 \
  --token-file "$cpu_bridge_run/bridge-token" \
  --port 8741 --origin http://127.0.0.1:5173
~~~

Select the input kind matching your actual exported artifact; this is not a
conversion switch. The bridge forwards the same observation flag to its
selected CPU debugger child. Without the flag, the existing launch and command
profile remain unchanged. The browser cannot enable this profile, choose
executable paths or arguments, change the request, or enlarge capture limits.

Keep the bridge and website on the basic guide's exact loopback origin.
Keep the secret out of URLs, logs, screenshots, repository files and browser
storage. Use the existing explicit disconnect/cleanup workflow; an uncertain
reply is not permission to retry or create a replacement session silently.

## 2. Select a record and refresh explicitly

Open the Source/ISA agent page, choose **Open live CPU debugger**, and connect.
Step to a real operation checkpoint with **Step CPU forward**. Then choose
**Refresh runtime and storage** in the new panel.

A refresh makes at most four sequential read-only bridge commands:

~~~text
state
runtime
lifecycle
storage
~~~

`state` confirms the current complete session/cursor. `runtime` discovers or
rechecks the capture owner and actual metadata for the selected record.
`lifecycle` reads the literal first retained transition page; `storage`
reads current live allocations. A typed unavailable/error response stops the
remaining dependent queries. Before execution or at a terminal position there
may be no selected record; that is displayed, not replaced with an old stop.

Nothing is queried when this panel merely mounts. There are no background
polls, retries or automatic continuation requests. Every paged request asks
for at most 16 rows and 64 scanned source entries. A returned continuation
token means more entries were omitted; the panel never follows it.

## 3. Read operation and frame identities

The panel displays the full global/workgroup/local invocation coordinates,
workgroup dimensions and launch extent, plus the current operation origin.
Three distinctions matter:

| Identity | Meaning |
| --- | --- |
| Activation | One actual entry into a function, not its stack depth or function ordinal. |
| Attempt | One actual operation attempt within that activation, not an instruction index. |
| Site | The static function/raw block/operation coordinate associated with that attempt. |
| Caller link | The actual parent activation, suspended call attempt and call site. |

Repeated loop visits can share a static site while having different attempts.
Repeated calls can share a function and stack depth while having different
activations. `ready`, `active_operation` and `suspended` describe actual
frame state. A frame's next-operation field is not substituted for its pending
or completed operation origin.

For a nested call, inspect **Actual runtime frames**. The suspended caller and
current callee are separate sections. Their SSA values are shown only when
an actual captured checkpoint belongs to the same accepted connection and
full cursor, and its frame/function coordinates match. Otherwise the panel
says no matching checkpoint values are available. It does not invent values
from an activation number.

Named Rust bindings remain a separate SourceVariable query. Matching names,
bits, ordinal numbers or table positions do not establish a name-to-SSA
mapping or a physical VGPR mapping.

## 4. Inspect allocation lifetime and current bytes

**Current storage incarnations** reports the exact triple:

~~~text
semantic allocation / storage slot / generation
~~~

A semantic allocation identifies one lifetime. A storage slot identifies an
actual reusable CPU backing-store slot. Generation distinguishes successive
uses of that slot. Never identify memory using only one of these fields.

**Actual allocation lifecycle** shows a literal retained prefix:
`preexisting` dispatch allocations, dynamic `create`, and `release`.
A create reports a predecessor only for an actual allocator reuse event.
A release carries no memory bytes. A later incarnation does not inherit the
previous allocation's initialization or semantic identity. A first page that
ends before a create cannot establish that create's history.

Choose **Observed storage allocation** from the returned inventory, then set
**Observed byte offset** and **Observed byte length**. Choose
**Read observed storage**. The client first repeats the four read-only refresh
commands to recheck the current inventory, then issues at most:

~~~text
storageaccess ALLOCATION SLOT GENERATION
storagememory ALLOCATION SLOT GENERATION OFFSET LENGTH
~~~

The uppercase fields are placeholders: the actual command uses canonical
decimal strings copied from the newly returned inventory. The UI handles
this selection for you. These are closed bridge commands, not arbitrary
backend JSON or command-line arguments. Memory requests require captured
bytes and initialization data, fit the allocation, and contain 1–4096 bytes.

Access rows belong to the selected complete triple and retained historical
record prefix. Their invocation and operation-origin metadata describe those
actual access records. An empty first page does not prove no later retained
access exists. Memory bytes are the current checkpoint window, not bytes
reconstructed at the time of each historical access. Each low-order bit in
the initialization mask describes the corresponding byte; an unset bit means
the byte is not a valid initialized value.

Editing the allocation, offset or length immediately hides earlier memory
and access results. A control/filter change, revision change, reconnect or
uncertain transport invalidates derived selections. Different generations
are never combined. The selected refresh reserves six commands; the basic
refresh reserves four. Both share the connection command allowance and a
2 MiB total HTTP response-text budget.

## 5. Distinguish unavailable metadata from incomplete execution

A real memory-watch stop can have an operation origin and a lifecycle
watermark without being a checkpoint. At that stop, the panel must not carry
forward the previous stack or SSA values; current inventory/bytes can be
unavailable. Step to an actual captured operation checkpoint before expecting
checkpoint values again.

Read these reports independently:

- **Legacy capture completeness**: whether the legacy debug record stream was
  retained completely or cut off.
- **Operation metadata coverage** and **Frame metadata coverage**: whether
  their separately bounded observations were retained.
- **Allocation metadata coverage** and **Actual allocation watermark**: which
  exact lifecycle prefix is available at this record.

A retained prefix can cover the current record even if later metadata was
truncated. Conversely, complete legacy records do not imply that every
metadata family was captured. Disabled, invalid-join, work-limit and other
unavailable states are not aliases for an empty valid result. Complete capture
metadata does not mean the kernel completed successfully or is correct.

The query binding contains a backend-session label, capture-instance label
and full cursor (configuration identity, event sequence and state revision).
The bridge/client also bind it to the accepted transport connection and bridge
session. The labels are process-local lifetime identities, not globally unique
IDs or credentials; they can recur after process replacement and must never
be reused across connections. The first runtime query may discover the owner;
later refreshes must match it. Configuration identity alone is insufficient.

## 6. Use the observations within their limits

These views can help locate wrong logical-work-item attribution, repeated
operation/call confusion, stale-lifetime memory selection, unexpected committed
accesses and uninitialized bytes. The simulator's existing checks remain
responsible for semantic faults; the observation panel does not create a new
proof that all faults were caught. Failed accesses are not invented as
successful committed writes.

The data describes CPU execution of the exported semantic program. It does
not observe native GPU instruction scheduling, physical registers, cache
behavior, native addresses or performance. Storage-slot reuse is real CPU
allocator reuse, not a GPU-address claim. Source hashes and names are not
source authentication, protected execution evidence or compiler-correctness
proofs.

Legacy ResourceV1 generation-zero identities and SourceVariableV2 frame
occurrence-one identities keep their original meaning. Do not substitute new
storage generations or activation IDs into those older command formats.
