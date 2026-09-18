# Inspect a retained memory window

This is an implementation-preview walkthrough for the resource panel in the
existing CPU semantic simulation lesson. It documents one retained CPU debugger
checkpoint. It does not add a curriculum evidence manifest, change a publication
pin, or promote the lesson's maturity. The interactive timeline below starts
from hand-built KIR; it is not evidence that ordinary Rust produced that kernel
or that a GPU executed it. The separate source-produced Bundle V6 query capture
later in this walkthrough has its own checkpoint, identities and evidence.

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

## Query allocations and accesses from actual Rust source

The companion compiler also has an independently exercised resource-query smoke
over the real typed-instruction Rust fixture, not the raw-KIR timeline above.
Build the tools using [Inspect the real lowering of a Rust kernel](inspect-lowered-kernels.md),
then run from that compiler checkout:

```sh
resource_run=$(mktemp -d)
node scripts/assembly-authoring-v30-smoke.mjs "$resource_run/source"
node scripts/resource-query-v6-smoke.mjs \
  "$resource_run/source" "$resource_run/queries"
```

Both output directories must be new. The first command freshly exports the
complete `assembly-authoring-v30` source fixture. The second admits its exact
baseline Bundle V6 through `fe2o3-debug sim --bundle-v6`, validates its retained
source and bundle hashes, and issues bounded `query_allocations` and
`query_memory_accesses` requests. It does not manufacture a replacement kernel,
edit source, or claim that its receipt authenticates compiler execution.

This actual-source run has passed the independent four-word 469 oracle and
untouched canary checks. It verifies bytes before and after the first committed
write, initialization, one 24-byte global allocation, the four final committed
access ranges, reverse-to-prewrite restoration and exclusion of future access
records. Returning forward reaches the same event cursor with a new revision;
stale revisions, source anchors and page tokens must reject without changing
state. These checks cover this retained CPU history, not arbitrary replay
histories or hardware memory behavior.

Review `debug-requests.jsonl`, `debug-responses.jsonl`,
`resource-query-results.json`, `resource-checkpoint.json` and `receipt.json`.
The full transcript and its hashes are retained separately from the bounded
pages displayed by the site. In the CPU semantic simulation lesson, choose
**Open assembly resource example** in the separate **Assembly kernel resource
observations** section. Opening it issues no compiler, debugger or launch request.
The site's selected responses are in
[`examples/resource_query_v6.json`](../examples/resource_query_v6.json), under
**Source-produced allocation inventory** and **Source-produced access page**.
They use an independent control response as the expected checkpoint: cursor 33,
revision 4, logical lane 0, after the first output write. Do not substitute the
raw-KIR cursor 9/revision 6 or the separate fill-source checkpoint for this anchor.

The allocation view shows exact allocation identity, address space, permissions,
capacity and alignment. The access view shows retained event/record ordinals,
logical scope, committed access kind, allocation-relative byte range, KIR site
and CPU schedule occurrence. The first displayed write is event 32/record 31 at
`[0, 4)`. Wide byte capacities and ranges remain decimal strings. The checkpoint's
resolved source location is not source attribution for every access row.

Page counts distinguish raw entries scanned from rows returned. The view's row
pagination and logical-scope filter only browse the captured page; they do not
fetch remaining backend pages. An empty page or truncated capture does not mean
there was no activity. Request identity, full checkpoint and caller-owned
connection/capture/variant context fence stale presentation; they are not
backend attestations or authority to load or launch a kernel.

Allocation owning scope, lifetime, physical base/LDS layout, bank conflicts,
physical registers, GPU timing, occupancy and performance remain unavailable.
Generation 0 is the current CPU profile, not evidence of an allocation lifecycle.
Access-row source association, call frame and operation occurrence also remain
explicitly unavailable; a retained simulator access is not a physical memory
transaction. This source query capture and the raw-KIR memory window remain
separate draft teaching observations with no publication-pin change.

## What this window cannot establish

The byte-window response alone establishes bytes and initialization only for
the returned range at its exact checkpoint. It does not establish the full allocation extent,
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

## Bounded CPU and browser diagnostic measurements

The resource-query and presentation paths also have reproducible diagnostic
scripts. These measure local CPU tooling and browser layout, not kernel GPU
latency, bandwidth, occupancy, bank conflicts or performance prediction. They do
not install dependencies, compile source, change the original capture, alter
curriculum publication pins or request a GPU launch.

From the companion compiler checkout, reuse an already exported source-smoke
directory and an already built debugger:

```sh
measurement_run=$(mktemp -d)
CARGO_TARGET_DIR=/path/to/existing/target \
  node scripts/resource-query-scale.mjs \
  /path/to/existing/source-smoke "$measurement_run/query-scale"
node --test scripts/resource-query-scale.test.mjs
```

The script requires the exact fixture source and canonical KIR hashes used by
its profile. It admits the unchanged Bundle V6 for 4, 64 and 128 invocations,
changing only the simulation request's grid and initialized output buffer.
Each run independently checks every result word against 469, untouched canaries,
initialization and every committed access range. It retains the independent
checkpoint and exact JSONL requests/responses outside the checkout.

The experiment's precheck allows at most 8,192 estimated records and 64 MiB of
estimated capture storage. Its padded formula is `34 * invocations + 64`
records, each charged an 8,192-byte metadata allowance plus a full output-buffer
checkpoint. This is a fixture-specific estimate, **not** a new runtime capture
budget, allocation guarantee or measured memory size. The existing CLI retains
its separate hard capture limits of 1,000,000 records and 256 MiB resident total.
The 256-invocation case is reported as `not_run_budget_exceeded` before execution:
its estimate is 8,768 records. It has no measured result. Each executed case has
a 120-second deadline, at most 1,024 commands, 1 MiB request lines, 2 MiB response
lines and a 32 MiB response-transcript bound. Every page independently caps raw
scans and returned entries at 256, including pages whose filter matches no rows.

For browser measurements, from this site checkout with its existing dependencies
and installed Playwright browser cache:

```sh
PLAYWRIGHT_BROWSERS_PATH=/path/to/existing/playwright-cache \
  node scripts/resource-view-performance.mjs "$measurement_run/resource-view"
node --test scripts/resource-view-performance.test.mjs
```

The isolated test harness opens no application route and sends no backend query.
It measures the actual allocation and access pages in the 29,971-byte retained
`resource_query_v6.json` fixture (SHA-256
`95f70ed65afa35480a5af8dc7ade1e75b745f02eebfa56cb36fddb5c99e8d91d`).
A separate, explicitly synthetic 256-row presentation-only input exercises the
64-rendered-row limit; those invented rows are not execution or capture evidence.
Inputs are capped at 512 KiB and the browser measurement at 120 seconds.

On 2026-09-17, the remote `mi350-2` container reported an AMD EPYC 9534 CPU,
128 logical CPUs, Linux 5.15.160+, Node 22.22.3 and Chromium 151.0.7922.34. The
browser used a 1280×800 viewport, warmed development-mode Vite modules and no
React StrictMode. These environment-specific observations are not release-mode
capacity claims or cross-machine thresholds.

| Actual source invocations | Retained records / writes | Pages per sweep | Global page roundtrip p95 | Global full sweep p95 | Whole debugger process peak RSS |
| --- | --- | --- | --- | --- | --- |
| 4 | 132 / 4 | 1 | 0.581 ms | 0.715 ms | 16.10 MiB |
| 64 | 2,112 / 64 | 9 | 0.664 ms | 6.404 ms | 20.67 MiB |
| 128 | 4,224 / 128 | 17 | 0.652 ms | 12.691 ms | 27.27 MiB |

There were 20 measured complete sweeps after 3 warmups for each scale and filter.
The second filter selected workgroup-address-space accesses and returned zero
rows while still scanning the full selected prefix; its full-sweep p95 values
were 0.242, 2.987 and 5.675 ms. Page roundtrip includes local JSONL transport,
backend projection and JSON parsing; the sweep also includes validation.
Measured peak RSS is Linux `/proc` `VmHWM` for the whole child debugger process,
not capture-only bytes. Startup/admission/eager-capture observations and all raw
timing samples remain in the receipts; startup was not repeated enough to claim
a startup-time distribution.

| Browser input | Rows rendered | JSON decode p95 | Guard/projection p95 | Mount, commit and synchronous layout p95 |
| --- | --- | --- | --- | --- |
| Actual allocation page | 1 | 0.1 ms | 0.4 ms | 4.2 ms |
| Actual access page | 1 | 0.1 ms | 0.4 ms | 5.0 ms |
| Synthetic presentation-only 256-row input | 64 | 0.7 ms | 4.6 ms | 26.0 ms |

Browser figures use 30 measured samples after 5 warmups. Decode covers the exact
paired page input, excluding network/module loading. Render timing includes the
component's own projection and synchronous layout, not asynchronous paint or GPU
work. Browser clock quantization can produce zero-duration decode samples; that
does not mean zero cost. Advisory p95 budgets are 25 ms per query page, 250 ms
per complete query sweep, 25 ms for presentation guards, 100 ms to render an
actual page and 250 ms for the synthetic layout case. All passed in this run;
these are diagnostic budgets, not flaky timing gates in the unit-test suite.

The retained session artifacts are `resource-query-scale-r2/receipt.json` and
`resource-view-performance-r3/receipt.json`, beneath the remote authoring run
directory `/home/harmenon/fe2o3-authoring-280-282.FEW3gj`. Their SHA-256 values are
`62b66ef05e4664a3cf4caf213f1d047431bdf2131c03c55e0dd441f42b278ef8` and
`cb17fb9ecb648857aebc73a0a550ed1cba2276e420b5646b90e44b4ee2f60cca` respectively.
Receipts also retain script, fixture/bundle and debugger-binary hashes where
applicable. These are local diagnostic artifacts, not public release pins.
Larger histories, many allocations, alternate capture profiles, physical
registers/LDS and actual GPU performance remain unmeasured by this experiment.
