# Inspect a retained memory window

This is an implementation-preview walkthrough for the resource panel in the
existing CPU semantic simulation lesson. It documents one retained CPU debugger
checkpoint. It does not add a curriculum evidence manifest, change a publication
pin, or promote the lesson's maturity. The input starts from hand-built KIR; it
is not evidence that ordinary Rust produced that kernel or that a GPU executed
it. A source-produced Bundle V6 resource fixture is not established by this
walkthrough.

## Open the captured checkpoint

In the implementation build, open the **CPU semantic simulation** lesson
(`/lesson/cpu-semantic-simulation`) and find **Inspect one deterministic semantic
trace**, the raw-KIR companion session. Select timeline event **#9** and keep
**Lane 0 active** selected. The **Captured allocation bytes** panel displays the
window below.

| Retained fact | Value |
| --- | --- |
| Backend | CPU KIR simulator; simulated observation |
| Cursor / state revision | 9 / 6 |
| Workgroup / logical wave / lane | `[0, 0, 0]` / 0 / 0 |
| KIR site | Function 0, block 0, operation 3 |
| Allocation identity | Ordinal 1, generation 0 |
| Allocation-relative byte range | `[0, 4)` |
| Captured bytes | `0x11000000` |
| Initialization bitmap | `0x0f` |
| Source association | Unavailable: `requires_authenticated_map` |

The retained input is
[`examples/debugger_workbench_v1.json`](../examples/debugger_workbench_v1.json).
Its `memory` field is the existing `read_memory` response, request 12. The
independent `post_write_step` control response supplies the expected snapshot
anchor. The exact request stream is
[`examples/debugger_requests_v1.jsonl`](../examples/debugger_requests_v1.jsonl).
The fixture records the response-stream SHA-256
`7283e69ea847b73d03df389afa315f015b2044119cf1a19ba72b7a3b5fdf7c18`.

The workbench gates this panel on that retained response-stream identity,
event cursor, selected lane, event workgroup/wave/lane, and KIR site. It does
not substitute a new lane into the captured anchor. The global allocation is
shown at the selected lane's checkpoint; this does not make the allocation
private to that lane.

## Read bytes and initialization separately

Use **Cell size** to switch between individual bytes and four-byte dword groups.
Both modes keep increasing allocation-relative byte order. The dword cell
`11000000` is a group of four stored bytes, not a decoded integer or floating
point value. A partial final dword retains its actual byte count.

Initialization has an independent non-color marker: **I** means all bytes in
the cell are initialized, **U** means none are initialized, and **M** means the
cell is mixed. Bitmap bit `i` describes byte `i`, with the least-significant
bit first within each bitmap byte. Thus `0x0f` marks the four returned bytes
initialized. A stored `00` can be initialized; zero does not mean missing.
When captured storage is uninitialized, its hex byte is still labeled as
storage and is not presented as a program value.

Select a cell to inspect its exact offsets, stored bytes and initialization in
the details table. Tab enters the cell selection; arrow keys move between
cells, and Home/End select the first/last cell in the current window. Expand
**Exact snapshot and memory facts** to inspect the underlying anchor and
memory result.

The presentation accepts at most 4096 requested bytes and renders at most
256 bytes per window. Larger accepted windows expose **Previous window** and
**Next window** controls. This retained fixture has only four bytes, so it does
not exercise large-window paging. Numeric metadata that cannot be represented
exactly in JavaScript is rejected rather than rounded. This includes some
Wave64 active masks; it is an explicit current presentation limitation.

## Exercise: reject a stale selection

1. At event #9, inspect the four captured bytes and the `9 / 6` cursor/revision.
2. Select **Lane 1 active**. The resource panel must report that bytes are
   unavailable for this selection. Lane 0's response must not become lane 1
   evidence merely because the allocation is global.
3. Select **Lane 0 active** again. The retained memory window returns.
4. Move forward or backward to another timeline event. Resource bytes must
   become unavailable again, even if the nearby event uses the same KIR site
   or allocation.
5. Return to event #9 and lane 0. Inspect the same exact retained bytes.

These controls browse retained events and checkpoints. This exercise does not
launch a kernel, request a new capture, or establish simulator forward/reverse
replay equality for arbitrary histories.

## The independent anchor contract

The reusable component accepts an existing debugger response and an expected
full snapshot anchor:

```tsx
<ResourceMemoryView
  response={fixture.memory}
  expectedSnapshot={fixture.post_write_step.result.snapshot.snapshot.anchor}
/>
```

The adapter checks the stopped session, configuration identity, event sequence,
state revision, workgroup/wave/lane, KIR site and source association. Frame and
occurrence are compared whenever present; absent fields remain absent. The
returned memory snapshot must match the complete expected anchor. A source
line, allocation name, or event sequence by itself is insufficient.

The expected anchor comes from the separate retained control response, not by
copying the memory response's own anchor and declaring it selected. For the
interactive workbench, the selection gates above must also pass. A future
connected-session adapter must additionally bind responses to the active
request ID or request generation: two different allocation/range requests
can share one snapshot. The current component does not provide that transport
or import arbitrary captures.

Rust backend admission remains the protocol authority. These browser guards
are bounded presentation checks; they do not authenticate a producer or grant
compiler, proof, load, launch, or hardware authority. Unknown fields, malformed
hex/initialization payloads, inconsistent snapshots and inexact metadata are
rejected. An unavailable or redacted memory result renders no fabricated zero
bytes. A partial result leaves unreturned bytes unavailable.

## What this window cannot establish

The response establishes bytes and initialization only for the returned range
at its exact checkpoint. It does not establish the full allocation extent,
allocation lifetime or reuse history, a physical LDS layout, bank conflicts,
access trails, physical SGPR/VGPR/AGPR contents, GPU timing, occupancy, or
performance. Logical wave membership and active masks are not physical EXEC.
Capture completeness outside the returned memory window remains unavailable.

The adapter and component checks are in
[`tests/resource-memory-view-content.test.ts`](../tests/resource-memory-view-content.test.ts)
and [`tests/resource-memory-view.test.tsx`](../tests/resource-memory-view.test.tsx).
They reuse the actual retained response; synthetic larger windows and altered
identities test layout and rejection behavior, not execution qualification.

For the companion compiler boundaries, see
[Assembly authoring: first implementation slice](https://github.com/harsh-nod/fe2o3/blob/codex/assembly-authoring-swarm-20260917/docs/assembly-authoring-first-slice.md).
That link names the implementation branch, not a released or immutable
publication pin. It distinguishes immutable inspection and CPU observations
from source admission, final machine resources and the remaining #280/#281/#282
milestones.
