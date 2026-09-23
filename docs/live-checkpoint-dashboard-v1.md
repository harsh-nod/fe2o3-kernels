# Read source values and memory together at a live CPU checkpoint

Use the **Live CPU checkpoint dashboard** to answer three practical questions:
which named values were retained, which logical allocations exist, and what
bytes are initialized at this particular stop?

The dashboard adds explicit read-only queries to the
[live local CPU debugger](live-cpu-debugger-v1.md). It does not replace that
guide's safe setup, secret handling, basic execution controls or cleanup.
Recorded viewers remain separate.

Fresh normal-source/CPU, live HTTP checks in both compiler forks, and separate
actual desktop/mobile dashboard sessions passed for this bounded profile.
The [dated qualification](live-checkpoint-dashboard-qualification-20260923.md)
records exact input/runtime pins, test results and preserved failures. Unit and
routed browser controls remain separate from real debugger sessions. This does
not close the complete debugger V2 milestone.

## 1. Start with an ordinary source kernel

Use the compiler's existing fixture:

~~~text
crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/src/lib.rs
~~~

Its base-feature kernel is ordinary Rust containing typed assembly operations:

~~~rust
#[kernel(typed, launch(required = [64, 1, 1], max = [64, 1, 1]))]
pub fn assembly_chain(mut out: DisjointSlice<u32>, a: u32, b: u32) {
    let moved = amdgpu_asm!(v_mov_b32(a));
    let moved_again = amdgpu_asm!(v_mov_b32(moved));
    let sum = amdgpu_asm!(v_add_u32(moved_again, b));
    let difference = amdgpu_asm!(v_sub_u32(sum, b));
    let toggled = amdgpu_asm!(v_xor_b32(difference, b));
    let low = amdgpu_asm!(v_and_b32(toggled, 255));
    let result = amdgpu_asm!(v_or_b32(low, 256));
    let index = thread::index_1d();
    if let Some(output) = out.get_mut(index) {
        *output = result;
    }
}
~~~

This excerpt shows the base feature choice. Use the actual fixture rather than
overwriting it with the excerpt: the file contains imports, no_std, and an
alternate edited feature that this exercise does not enable.

Prepare the matching tools, repository, local site and a **new private run
directory** as in
[steps 1–2 of the basic guide](live-cpu-debugger-v1.md#1-prepare-matching-tools-and-a-private-run-directory).
Reuse its cpu_bridge_repo, cpu_bridge_tools, cpu_bridge_cargo, cpu_bridge_rustc,
cpu_bridge_site and cpu_bridge_run variables, with your own reviewed paths.
Export this fixture instead of vecadd:

~~~sh
cd "$cpu_bridge_repo"

CARGO="$cpu_bridge_cargo" RUSTC="$cpu_bridge_rustc" \
CARGO_NET_OFFLINE=true CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 \
"$cpu_bridge_tools/fe2o3-export-sim" \
  --crate fe2o3_assembly_authoring_v30_fixture \
  --output "$cpu_bridge_run/assembly-chain-v6.fe2sim" \
  --bundle-version 6 --target gfx942 \
  --target-dir "$cpu_bridge_run/export-target" \
  -- --manifest-path "$cpu_bridge_repo/crates/rustc-codegen-fe2o3/tests/fixtures/assembly-authoring-v30/Cargo.toml" \
  --lib --offline
~~~

The normal exporter enforces Cargo `--locked`. Offline dependencies and the
matching selected backend must already exist. Do not add `--features edited`;
that changes the final operand and this exercise's expected result.
An export failure is not permission to hand-write a replacement bundle or map.

## 2. Choose a small input and predict its answer

Save this complete request as a new `request.json` in your private run directory:

~~~json
{
  "schema": "fe2o3-simulation-request-v1",
  "kernel": "assembly_chain",
  "grid": [
    4,
    1,
    1
  ],
  "workgroup": [
    64,
    1,
    1
  ],
  "arguments": [
    {
      "kind": "buffer",
      "element": "u32",
      "access": "read_write",
      "alignment": 4,
      "bytes": "0xa5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5deadbeefcafebabe"
    },
    {
      "kind": "scalar",
      "type": "u32",
      "bits": "0xfffffff0"
    },
    {
      "kind": "scalar",
      "type": "u32",
      "bits": "0x00000025"
    }
  ]
}
~~~

This is the same JSON value as the selected 528-byte base request. That exact
retained formatting, including its final LF, has SHA-256
1440cebfd18d500152090639c34021b319a75114b5af00f5faf1e9918f97369a.
If your editor changes formatting, review and pin your own bytes; do not reuse
the reference digest for a different file.

The buffer contains four initial output words plus eight canary bytes. Omitted
`initialized` means all supplied bytes are initialized in this request format;
the complete 24-byte window therefore has mask `0xffffff`. This is not the
separate explicit-uninitialized-input fault exercise.

For each logical work-item, compute with `u32` wrapping:

~~~text
a = 0xfffffff0
b = 0x00000025
sum        = (a + b) mod 2^32 = 0x00000015
difference = (sum - b) mod 2^32 = 0xfffffff0
result     = ((difference XOR b) AND 255) OR 256 = 469
~~~

Little-endian 469 is d5 01 00 00. These are predictions to check, not values
already observed in the debugger:

| Point in the exercise | Expected complete 24-byte storage |
| --- | --- |
| Before any store | 0xa5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5deadbeefcafebabe |
| After only the first store | 0xd5010000a5a5a5a5a5a5a5a5a5a5a5a5deadbeefcafebabe |
| After all four stores | 0xd5010000d5010000d5010000d5010000deadbeefcafebabe |

Run the standalone CPU simulator first, using non-overwriting output files:

~~~sh
(
  set -C
  "$cpu_bridge_tools/fe2o3-kir-sim" \
    --bundle-v6 "$cpu_bridge_run/assembly-chain-v6.fe2sim" \
    --request "$cpu_bridge_run/request.json" \
    > "$cpu_bridge_run/positive.stdout" \
    2> "$cpu_bridge_run/positive.stderr"
)
~~~

Check the actual result status, all four words, initialization and all eight
canaries. A standalone success is separate from the debugger session: Connect
starts again from the original request, not the simulator's final buffer.

Follow
[the basic guide's byte pinning, secret, local startup and Connect steps](live-cpu-debugger-v1.md#4-record-the-three-selected-byte-identities),
using assembly-chain-v6.fe2sim instead of its vecadd bundle. Keep logical wave
width 32. This fixture's required workgroup is 64; do not copy the vecadd
workgroup 256 into this request. Keep the bridge and website on the explicitly
selected loopback ports/origin, and never put the secret in URLs, storage,
logs, screenshots or this document.

## 3. Select a real operation checkpoint

Open the Source/ISA agent page and choose **Open live CPU debugger**. Connect
explicitly. Capability discovery or **Read CPU state** alone does not select
a dashboard checkpoint.

Set **Operation step count** to 1 and choose **Step CPU forward**. The dashboard
requires a successful, stopped, exact operation-step response with an actual
captured snapshot. It displays that event, revision and original control
request ID. The source map/file identities and byte span are available under
**Live checkpoint and source identity**; the panel does not fetch Rust source.

Choose **Refresh source and inventory**.

This sends at most three sequential read-only commands:

1. Inspect the current stack.
2. Query source variables at frame 1 only if a complete supported stack has
   a present `next_operation`.
3. Read the first global allocation-inventory page.

The source query is skipped if that stack prerequisite is absent, so the
refresh can use two calls. It does not step, retry, poll or fetch another page.
The UI reserves the three-call maximum before starting; a small remaining
budget is not permission to exceed the shared connection cap.

## 4. Read the source and SSA tables separately

**Source variables** reports named bindings from SourceVariableV2.
For the normal base fixture, inspect the actual `a` and `b` rows: their captured
u32 bits should match the explicit inputs. Other locals can legitimately be
`not_represented`. An unavailable `out` binding must not be replaced with an SSA
pointer merely because the kernel has an output buffer.

**SSA values** reports whole values from the captured control snapshot, using
function/frame/value identities rather than Rust names. These are separate
queries and identities. Equal bits, similar names or adjacent positions do
not establish a source-to-SSA mapping.

The source table explicitly refines the unframed checkpoint with frame 1 and
legacy occurrence 1. Those fields do not identify a dynamic helper activation.
The binding generation shown in this table is not an allocation generation.

Availability is part of the result:

- Captured means this producer supplied a value with the reported type.
- Unavailable, redacted and ambiguous remain different states, never zero or
  a guessed choice.
- A complete stack or captured SSA value does not imply a source variable is
  represented.
- A returned source cursor means more source rows exist. This initial profile
  does not follow it or present that partial page as a complete source table.

The source page is bounded to 16 rows. The SSA panel supports at most 64 whole
rows and scalar widths up to 64 bits. Safe integer presentation checks may
refuse large metadata; IDs must never be rounded into a different identity.

## 5. Choose an observed allocation and read its bytes

The **Live allocation inventory** comes from a ResourceV1 query at that exact
checkpoint. Read the actual ordinal, permission, capacity, alignment and
availability. The generation 0 profile is not evidence of allocation reuse or
a proved lifetime.

This input supplies one 24-byte global read/write buffer. Select its actual
returned row in **Live CPU allocation**. Do not copy an ordinal from another
run or invent an identity from the source variable name.

Set **Live CPU byte offset** to 0 and **Live CPU byte length** to 24, then choose
**Read selected allocation**. This explicitly refreshes stack/source/inventory
and, after rechecking the selected row, queries retained accesses and memory.
It uses at most five calls, or four when source inspection is skipped.
Offset/length must fit the actual returned capacity, with length 1..4096.
The displayed defaults 0/1 are input choices, not captured facts.

Inspect **Live checkpoint memory grid**:

- The initial 24 bytes should match the request, including all canaries.
- The initialization marker belongs to each byte. A clear bit means its stored
  bits are not an initialized program value.
- Cell-size controls change presentation, not the capture or the memory range.
- A range edit hides access/memory views that no longer match it. It neither
  sends a request nor discards otherwise-current source/SSA observations.

The inventory and access pages admit at most 16 returned rows and scan at most 64
source records. A returned opaque resource token means additional backend
pages exist; this UI neither follows it nor treats missing rows as inactivity.
Only returned allocation rows can be selected.

## 6. Observe the first store, then refresh at a later checkpoint

Use the basic live controls to add a write watch over offset 0, length 4 of the
actual selected allocation, generation 0. These are the basic fields
**Allocation ordinal**, **Allocation generation**, **Allocation byte offset**
and **Memory byte length**, separate from the dashboard's byte-window fields.

Choose **Set CPU watchpoint**, then **List CPU watchpoints**. Verify the
returned spec and use its real watchpoint ID. Setting a filter changes the
revision and clears the dashboard selection; registration is not a hit.

Choose **Continue CPU execution** with a bounded budget. Only a returned
watchpoint stop with that same ID establishes the observed hit.

The write watch is `after_commit`. In this current CPU profile, the watch stop
can have no captured snapshot. Its source/SSA/memory dashboard must be empty.
Do not keep an earlier table and label it “at the watchpoint.”

Now choose **Step CPU forward** once to a distinct captured operation
checkpoint, and refresh the dashboard there. For this ordinary-source profile,
the immediate lane 0 post-store stack has no `next_operation`. You can observe:

- The new event/revision and its available SSA snapshot.
- Current inventory and the one retained committed-write occurrence.
- The 24-byte current memory window with exactly the first word changed.
- An explicit source-unavailable notice, with no SourceVariableV2 call or old
  source rows substituted.

That source notice is a client prerequisite result. It is not a fabricated
SourceVariableV2 `checkpoint_not_captured` reply. A different actual producer
unavailable/error response keeps its own original schema and reason.

**Live retained memory accesses** shows historical occurrences in the selected
prefix. The row's own event, logical lane, operation site and byte range are
not the current checkpoint's event or an authenticated Rust-variable link.
Call-frame, dynamic occurrence and per-access source association remain
`not_represented`.

You may select an actual row and enable **Overlay selected historical access
range**. The overlay marks that range over the current checkpoint's bytes.
It does not restore event-time memory or claim those bytes were captured at
the access event. Turning it on performs no backend request.

## 7. Reverse and repeat without reusing old revisions

From the immediate post-store checkpoint, leave step count 1 and choose
**Step CPU reverse**. Refresh source/inventory, select the actual allocation
again, and read 0..24.

The earlier retained prewrite checkpoint should have the original a5 bytes and
unchanged canaries. Its access prefix precedes the first committed write.
Inspect its actual stack: where `next_operation` is present and the producer can
answer, the separate source table can return again.

Choose **Step CPU forward** once, then explicitly refresh/read again. Compare
the returned site, scope, event and values with the previous post-store stop.
Revisiting the event must still use the new accepted revision; neither the UI
nor this guide restores an old protocol cursor.

The immediate post-store source absence should remain absence on repeat.
To examine a later source-queryable point, make another explicit forward step
and inspect the newly reported scope. In this fixture that can enter the next
logical work-item; those source values belong to that new checkpoint, not to
the preceding lane's write or uncaptured watch stop.

After any ordinary command, filter mutation, connection replacement or
uncertainty, refresh from the currently accepted state. A timeout may have
occurred after dispatch: never retry a mutation automatically. Use the
[basic guide's explicit cleanup workflow](live-cpu-debugger-v1.md#12-finish-and-clean-up-deliberately).
Disconnect clears the dashboard and requests cleanup of the original captured
connection; confirm the actual response rather than assuming a closed tab
reaped the child.

## What this adds—and what it does not

This is live, explicit, same-session consumption of existing public CPU
resource and source-variable queries. The unchanged V1, ResourceV1 and
SourceVariableV2 replies share one correlated command ledger while retaining
their own schemas. The collector retains at most 2 MiB of HTTP response text
per collection and allows at most five commands.

It does not add Rust source editing, source-body fetching, automatic paging,
dynamic call identities, true allocation lifetime/reuse, physical VGPR/LDS
state, terminal fault snapshots, GPU execution, performance prediction,
authenticated source or protected proof/production authority.

The [recorded source-variable lesson](resource-source-values-v2.md),
[recorded watch/source replay](resource-watch-source-replay-v2.md) and
[ordinary-source fault replay](ordinary-source-fault-replay-v1.md) remain
independent imported examples. Their file controls do not advance this live
session, and a live HTTP envelope is not an accepted recorded JSONL fixture.

## Qualification

The [September 23 report](live-checkpoint-dashboard-qualification-20260923.md)
records 105 actual HTTP exchanges and five source/resource collections in each
fork, then two separate browser sessions with 55 POSTs and eight dashboard
collections each. Initial/reverse source tables were captured; postwrite/repeat
source absence was explicit. The full four-word result belongs to the separate
HTTP experiment, while each browser checks only the first write and canaries.

Keep failed attempts and distinguish unit/routed-browser controls from real
sockets and debugger children. A passing first-write browser exercise does
not establish whole-kernel completion; standalone CPU or separate HTTP
completion must retain its own evidence. No broad milestone completion is
claimed by this tutorial.
