# Inspect a historical hardware resource capture

This optional panel displays one bounded, caller-supplied file from the explicit
ROCgdb/KFD resource-capture profile. It is not a live debugger connection.
A structurally valid file, an `observed` label or a matching SHA-256 does not
authenticate the producer, prove a real GPU observation, or restore a current
stopped-process owner.

The [live CPU runtime/storage lab](runtime-observations-source-lab-v1.md) and
[declared-target bank lab](declared-target-bank-lab-v1.md) are separate paths.
This importer does not convert hardware claims into CPU captures or reuse a CPU
bridge session.

## Producer path and its limits

In a compiler build that includes the explicit command below,
`capture-rocgdb-kfd-resources-v1` opts into a historical output envelope.
It uses the existing V5 launcher/admission path and the checked
gfx942:xnack- Wave64 resource producer. It does not add an arbitrary GPU target,
new MI inspection commands, a serialized-owner import, or a browser launch API.

The implementation is defined by the compiler's
[one-shot launcher](https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-debug-cli/src/live_rocgdb_kfd_v4.rs),
[hardware resource owner](https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-debug-cli/src/rocgdb_hardware_stop_resources_v1.rs),
[historical adapter](https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-debug-cli/src/live_rocgdb_hardware_capture_v1.rs)
and [closed output DTO/writer](https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-debug-protocol/src/rocgdb_hardware_capture_v1.rs).
These source contracts explain the route; they are not a receipt that a native
capture succeeded on your machine.

The selected program must already implement the launcher's cooperative V2
declaration/publication contract. Choose the real ROCgdb binary, exact HSACO,
kernel, admitted load base and authorization identity using that launcher
workflow; do not invent them from this tutorial or an uploaded file.
The command runs a target program and attempts real debugger/device operations.
Run it only as an explicitly selected local workflow; the site never runs it.

The exact grammar is:

```text
fe2o3-debug capture-rocgdb-kfd-resources-v1
  --rocgdb ABS_PATH
  --authorization 64LOWERHEX
  --hsaco ABS_PATH
  --load-base 0xHEX
  --kernel NAME
  [--device-unique-id DECIMAL]
  [--protocol jsonl]
  [--wave-width 32|64]
  [--timeout-ms 1..60000]
  -- ABS_PROGRAM [ARG...]
```

The shared launcher accepts the listed wave-width syntax, but this capture
projection is specifically gfx942:xnack- Wave64; choosing another option does
not widen that profile. Preserve the exact stdout JSON record and its final LF
in a fresh local file. Keep stderr separate. Do not concatenate records or
pretty-print the output for this importer.

The producer transfers the retained projection only after its final same-stop
check and successful final locals inspection, or an explicit unsupported-locals
path. Output is emitted after the existing process owner's teardown path has
returned. That ordering is not a new confirmed-reaping or escaped-descendant
cleanup guarantee. Copies and serialized output are historical data, never
control/device/allocation capabilities.

A normal unavailable result is useful information, not a reason to fabricate
registers. Its stage is `native_capture`, `register_inspection`,
`locals_inspection` or `projection_not_retained`, with the closed reason
where that stage supplies one. A nonzero command exit or malformed/truncated
output is not a valid capture to import.

## Open the local historical view

1. Open **Debugger → Hardware + profiles** and click **Open historical hardware capture**.
2. Select the one-record local JSON file. Merely selecting it clears previous
   data; it does not start a capture.
3. Click **Import historical hardware capture**. The file is checked locally.
   No HTTP request, upload, storage write, debugger command, compiler action or
   GPU execution is performed by importing it.
4. Read the persistent historical/untrusted warning and exact file byte count
   and SHA-256. The hash identifies bytes, not an authenticated producer.
5. For a captured projection, inspect the reported target, full session/stop,
   association, process, queue occurrence, dispatch, artifact and wave identities.
   Open a register's detail to see its exact register/evidence identities.
6. Page through the checked register roster, at most 64 rows at a time.
   Changing the page clears its prior selected register. Replacing the file,
   resetting, cancelling or closing the panel clears the appropriate previous
   data; late reads/digests cannot restore a replaced selection.

The panel keeps exact large stop revisions and artifact lengths as decimal
strings, without converting them to imprecise JavaScript numbers.
The file identity and every reported stop/artifact/scope binding participate
in display selection lifetime. Internally inconsistent nested scopes or
register evidence identities refuse the entire file. Consistently forged
identities remain untrusted claims; a parser cannot authenticate them.

## Supported and unavailable cells

This profile presents wave-scoped scalar registers and the `exec`, `vcc`
and `scc` predicates when their reported values have the supported class,
bit width and exact observation reference. Available values are opaque
unsigned bit strings of at most 64 bits, not inferred pointers or per-lane
registers. No 64-column lane grid is invented from one wave scalar.

Unsupported vector/special values remain explicitly unavailable. PC locations
remain redacted or unavailable. Other retained unavailable reasons are shown,
not converted into zeros or omitted. An empty roster does not establish that
the wave had no registers.

The three fixed missing-resource boundaries remain:

| Field | Required unavailable reason |
| --- | --- |
| Source | `requires_authenticated_source_map` |
| ISA | `requires_artifact_relative_instruction_binding` |
| Memory | `requires_allocation_relative_authority` |

The locals-completion field reports whether the command completed or was
unsupported. It does not export locals values, source-variable mappings or
a source map. Registry probes for disassembly/memory are not successful
observations of those resources.

## Bounds and qualification status

The closed schema is `fe2o3-rocgdb-kfd-resource-capture-v1`, with
`observation_lifetime: "historical_same_stop_capture"`. Input is exactly one
JSON record and one final LF, at most 2,097,152 UTF-8 bytes including that LF.
The file-size gate precedes reading; raw text is byte-counted before encoding
or JSON allocation. BOMs, invalid Unicode, duplicate/unknown keys, unsupported
versions, inexact/wide values, substituted nested bindings and contradictory
probe/completion states refuse.

All at most 1,024 register rows are checked before display, not only the visible
page. Names are at most 128 UTF-8 bytes; values are at most 64 bits. Existing
shared JSON graph/depth limits remain unchanged. These are input/parser and
display bounds, not universal heap/RSS guarantees. Reads can be aborted; a
WebCrypto digest already in progress is not abortable, but its late result is
discarded after replacement, cancellation or unmount.

The checked-in fixture and parser/component/browser controls for this feature
are explicitly synthetic presentation tests. No successful GPU capture is
recorded by this tutorial. A separately retained real producer run is required
before claiming a hardware capture was observed; opening this viewer does not
supply that qualification.

No physical-register lifetimes, instruction/macro lineage, memory/LDS window,
bank-conflict/multicast count, native issue-phase grouping, timing, performance,
source authentication, proof/resume authority or V3/V4 milestone acceptance
is supplied by this historical importer.

## Retained actual unavailable example

[Download the exact unavailable record](https://github.com/harsh-nod/fe2o3-kernels/blob/main/examples/hardware_resource_unavailable_v1.jsonl)
and import it using the steps above. This is real command output from a
deliberately non-launching MI350 qualification, not a fabricated register capture.
It is 486 bytes including LF, SHA-256
`1c0cfc1cf252216e8b5a91c8603552521b97a68dc8e7ede3f3002147d26988d6`.

With eight GPU nodes and no selected device, the existing launcher refused
before KFD admission or target launch. The HSACO and target-program paths were
deliberately absent. Expect `native_capture / direct_kfd_device_unavailable`,
no target or register table, and literal registry-probe flags. This generic
selector refusal does not qualify a gfx950-specific rejection or any successful
hardware capture. The file remains untrusted when imported.

The [dated qualification](historical-hardware-resource-qualification-20260923.md)
separates this actual negative transport from synthetic positive rendering.
