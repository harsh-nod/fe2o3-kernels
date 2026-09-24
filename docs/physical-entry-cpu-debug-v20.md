# Inspect an authored entry with the CPU debugger

Compiler publication: [dbfb61e7](https://github.com/harsh-nod/fe2o3/commit/dbfb61e7186e5fa37dd9d544d85de29c7a1080eb),
also published to powderluv/fe2o3 main. Focused typed V20 CPU-debugger tests
and separate actual-source CLI qualification passed on the retained snapshots.
No native or hardware execution is claimed by this debugger lesson.
The existing [V19 CPU viewer](complete-body-cpu-viewer-v19.md) remains a separate
profile; this lesson does not add a V20 browser adapter.

The debugger executes the admitted canonical V20 body in the existing CPU
engine once, captures bounded observations, and navigates those records.
Forward/reverse navigation does not resume execution, undo a running GPU or
reconstruct a hardware register capture.

## 1. Supply exact canonical input and a simulation request

Start with the unchanged `canonical-v20.bin` from the
[physical-entry source lesson](physical-entry-source-v20.md), not V21 global-copy
bytes. Supply a strict `fe2o3-simulation-request-v1` request for that exact
kernel symbol, its output buffer and four scalar arguments. Keep the source
producer's records separately if you need to establish where the bytes came
from: this loader cannot authenticate source custody from a file.

The [qualified request example](../examples/physical-entry-cpu-debug-v20-request.json)
is the unchanged request used for `physical_one`: 64 invocations, a 528-byte
canary allocation and scalar values 19, 23, 42 and 0. Use it only with that
matching entry. Other kernels need their own matching symbol and arguments;
this request is not a source binding or launch authorization.

```sh
fe2o3-debug sim \
  --diagnostic-kir-v20 /absolute/canonical-v20.bin \
  --request /absolute/physical-entry-request.json \
  --protocol jsonl --wave-width 64
```

This Linux path uses bounded regular-file loading, the real move-only verified
V20 owner and a same-owner budgeted inert CPU view. No fabricated source marker,
shadow assembly interpreter or serialized transcript supplies execution
authority. V21, other wave widths and incompatible request fields are refused.

The interface bounds are 128 KiB canonical input, 16 KiB request, at most 128
invocations in full Wave64 workgroups, and 8,192 captured records. Protocol
bounds are 8 KiB per input line, 64 KiB per response, 64 values per page,
256 bytes per memory read and 4,096 commands. A cumulative work budget may refuse
earlier. Input, capture and protocol scratch use the same owned ledger with
512 MiB logical storage and 2^29 work units; these are not process RSS limits.

## 2. Navigate observations, not execution

The [example request stream](../examples/physical-entry-cpu-debug-v20.jsonl)
contains client requests only, not a captured response or evidence packet.
It asks for capabilities, advances one event, reverses one event, and terminates.
Read actual replies and carry their revision and configuration identifiers into
later requests. A refused request does not imply the next revision succeeded.

Only unfocused event stepping is supported. State, capabilities, same-session
seek, selected-checkpoint lane SSA inspection and allocation-relative memory
reads are available. Source-line/instruction stepping, breakpoints,
watchpoints, continue/pause, persisted replay and hardware/register queries are
not supported by this adapter.

Use the selected record's scope and current revision when asking for values.
SSA inspection supports all values or one SSA root; the frame and page cursor
must belong to that selected checkpoint. Do not reuse stale pages after moving
the cursor. Memory reads name an allocation and byte offset, not an absolute
machine address. Non-checkpoint events may not supply a memory/SSA snapshot.

A useful exercise is to locate the before-store and after-store checkpoints for
lane zero, inspect four output bytes and initialization bits, return to the
before-store record, and compare again. This shows retained CPU state:
reverse selection restores the earlier observation, not a new execution.
The focused tests use shared inert canonical fixtures. The separate
actual-source qualification below loads unchanged Rust-produced artifacts
for the one-block body, both diamond branches and the edited-register body.

## 3. Interpret unavailable values honestly

Pointer halves and provenance-bearing carries remain exact symbolic bindings
inside the same-engine capture. The existing public protocol cannot encode
their symbolic representation, so each affected SSA binding stays present as
`Unavailable { reason: NotRepresented }`. It is not silently removed or
converted into a guessed `ScalarBits` address. This is a representation limit,
not an assertion that the source never defined the register.

Numeric scalar SSA values can be inspected where represented. A wave's public
`active_mask` describes resident lanes, not physical EXEC. The authored EXEC
mask is a separate SSA binding. Do not label either as sampled hardware state
or use it to infer performance.

The library keeps symbolic provenance and snapshot accounting for the whole
capture lifetime. Its read-only projections do not expose a cloneable raw
snapshot or a mutable ledger. Legacy unbudgeted APIs are distinct and cannot
admit this typed physical capture.

## 4. Recognize refusals and capture limits

Stale revisions, foreign configuration cursors and stale pages refuse without
moving the session. Responses are encoded within their bounds before a new
cursor/revision is committed. A transport failure ends the session; it is not
a transactional rollback guarantee for bytes already sent.

A completed CPU run can still have truncated capture. Reaching the capture
limit does not manufacture a completed End record, and omitted records cannot
be selected. Preflight or execution failure initially refuses the CLI session;
this adapter does not publish a partially failed execution for navigation.
A library forward-step at End is a free no-op, but the CLI still charges its
bounded command/query allowance.

CPU capture establishes neither source-variable mapping nor a device memory
snapshot. It does not discharge host buffer, alias or launch obligations, admit
a protected artifact, or establish hardware time travel. V21 pending-load
debug support remains refused. These limits apply even when source and native
static qualification for a kernel have separately succeeded.

## 5. Read the focused qualification separately from source extraction

The [focused evidence](evidence/physical-entry-cpu-debug-v20-20260924/index.json)
pins the original test stdout and gate summary: three exact-owner Reader tests,
three budgeted admission tests, 11 CLI tests and four debugger session tests
passed. These include exact/one-short resource limits with a nonzero prior
floor, symbolic unavailable SSA, before/after-store memory navigation,
stale identifiers, bounded response failure, V21 refusal and terminal charging.

The actual-source-input qualifier was explicitly ignored in this gate. The
later qualification below is a separate run, not a reinterpretation of that
ignored result. Content tests protect the lesson and request example; they
are not a substitute for compiler behavioral tests.

## 6. Follow the actual-source CLI exercise

The [actual-input evidence](evidence/physical-entry-cpu-debug-actual-v20-20260924/index.json)
records four typed-loader sessions and four public JSONL sessions over the
unchanged source artifacts: one-block copy, selector-zero and selector-one
diamond paths, and the edited-register diamond. Input bytes join the earlier
[checked source campaign](evidence/physical-entry-checked-v20-20260924/index.json);
raw file hashes and domain-separated canonical identities remain distinct.
The CLI still acquires no source custody from those bytes.

Each session used 64 invocations and a 528-byte output allocation initially
filled with 0xa5 but marked uninitialized. The inspected lane-zero store
changed four bytes from the canary to the expected 19 or 23 and marked them
initialized. Selecting the preceding checkpoint recovered the original bytes
and initialization bits. At the final captured lane-63 checkpoint, exactly
64 output words were written and the remaining 272 bytes retained the canary
and their uninitialized state. Both diamond paths matched the actual CFG.

The qualifier located checkpoints from actual captured sites, then independently
checked public lane, operation and memory replies. It did not assume a store
occurs within the first few records: the cooperative engine can advance other
lanes before the wave rendezvous. These are observed session coordinates,
not a promise that future captures reuse the same record indexes.

All four sessions retained 11 symbolic bindings as unavailable. Forty
transactional refusals preserved the current session; five startup refusals
covered V21 bytes, source-map and register-map options, Wave32, and a request
trying to carry authority. The same gate passed six pure qualifier controls
and 11 ordinary CLI tests. No GPU execution, hardware observation, protected
artifact admission or resumable replay is established by this exercise.

The published tree passed a merged compiler regression and another actual-source
CLI run. Their original historical evidence above is not relabeled as a new run.
Neither these tests nor a later CLI input run close a hardware-debugger
milestone or broaden the admitted V20 profile.
