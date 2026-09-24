# Browse recorded physical-entry V20 CPU sessions

Open **Debugger → Cross-layer inspection → Open V20 recorded CPU viewer**. The route is
`#/debugger/source-isa-agent`. This is a read-only recording viewer. It does not connect to the local
debugger bridge, send protocol commands, execute a simulator or compile source.

The adjacent V19 viewer and the existing live bridge remain separate and unchanged.
The viewer does not change the site's compiler pin, maturity labels or milestone exits.

## What is actually retained

The four bundled recordings are the unchanged request/response JSONL files from the
qualified public V20 CLI sessions: one-selector0, diamond-selector0, diamond-selector1
and registers-selector1. The one-block session has 103 pairs; each other session has
107. The complete bytes, sizes and SHA-256 hashes are in
[provenance.json](../examples/physical-entry-debug-v20/provenance.json).

The source qualification report is 33,470 bytes with SHA-256
`74f10e8bf82fd91219da6f2453976e9823bce8afdaf44130d3d272d2fe44ed11`.
Its retained copy and qualification limits are described in the
[V20 CPU-debug lesson](physical-entry-cpu-debug-v20.md). The browser is not that
qualification process: it checks the bundled byte pins and bounded presentation
relations only. Local files remain caller-supplied and unverified. A configuration
identity identifies a declared session; it does not authenticate source or an owner.

These V20 examples have one output allocation plus four scalar arguments.
They do **not** have the separate read-only input allocation used by V21 global-copy.
No buffer, allocation permission, ownership, kernel ABI or host alias condition is
inferred from a memory query.

## Reading the viewer

Choose a retained session, then a recorded observation. Previous/next buttons browse
response order, not event number. A recorded reverse or seek command can move the
event number backwards while advancing the recorded session revision. The browser
does not repeat that command, restore an execution engine or resume a kernel.

The selected response may display:

- A logical workgroup/lane and KIR function/block/operation site. The U64 resident
  logical wave mask is preserved exactly; it is **not physical EXEC**. Recorded
  block visits do not establish untaken CFG edges, source lines or an instruction map.
- A page of whole SSA bindings. Scalar bits retain their declared simulated-observation
  provenance. Logical pointers are allocation-relative coordinates, never invented
  native addresses. Symbolic pointer halves/carries remain **not_represented**,
  with no fabricated zero or numeric representation. Their symbolic subtype is not
  exported by this wire protocol.
- At most 256 recorded memory bytes, with initialization shown separately for each
  byte. An A5 backing-storage byte marked uninitialized is not a valid scalar value.
  Bytes are read-only; the viewer cannot write or dereference memory.
- A recorded refusal. Stale revision, foreign cursor, stale page, unavailable source
  map and unsupported physical-register queries remain visible and transactional.
  Refused responses show no prior snapshot, values or bytes.

SSA pages are never silently concatenated. The display names the requested page
range and whether the response included a continuation cursor; absent pages stay
absent. Successful page cursors are joined to the exact configuration, event and
revision using the existing V20 query-identity rule. Changing revision invalidates
the earlier page even if the event number is unchanged.

## Importing local files

First create a session using the existing [typed V20 CLI instructions](physical-entry-cpu-debug-v20.md).
Retain its request and response JSONL streams unchanged. Open **Display your own
complete V20 recording**, select both files, explicitly acknowledge the
`--diagnostic-kir-v20` selector, then choose **Read local V20 recording**.
No file is uploaded. Clear removes the current display and cancels any pending local read.
A later asynchronous result from a replaced input cannot repopulate the view.

This first browser subset requires:

- Initial successful capability discovery at created/event 0/revision 0.
- A consistent recorded completed cursor, followed eventually by successful termination.
- At least one V20-named error or unavailable response, as present in the retained
  transactional-refusal examples. V1 JSONL has no version-authentication field:
  these literal profile markers and explicit selection are still untrusted declarations,
  not a way to prove which executable produced caller-supplied bytes.
- At most 256 pairs, 256 KiB per file, 8 KiB/request and 64 KiB/response.
- LF-terminated UTF-8 JSONL, no duplicate JSON keys or blank frames, lossless unsigned
  integers and bounded nesting/arrays from the existing parser.
- The exact V20 CPU capability roster and closed operation subset: discovery,
  get-state, event step, seek, SSA values, logical memory, resolve-source refusal
  and termination. Operation-step, arbitrary commands, binary KIR and V21 are refused.
- Exact request IDs, configuration/revision/cursor/scope joins, unchanged state on
  refusals, valid page identities and consistent repeated event/SSA/memory observations.

Unsupported, incomplete, oversized or inconsistent input refuses the entire display.
Nothing is truncated to make it fit, and no previous recording's data is substituted.
A passing presentation check is not canonical decoding or typed simulator admission.
The browser cannot establish the truth of arbitrary imported observations.

## Boundaries and verification

Source and source-variable maps require authenticated compiler data. Physical register
capture, hardware wave state, watchpoints, deterministic replay and resumable execution
are unavailable here. CPU reverse observation is not hardware reverse execution.
This UI grants no source custody, proof, artifact, compilation-resume or launch authority.

The adapter uses new V20-only leaves and the existing scalar-row table. Existing V19
and live-session implementations are not broadened. Tests include byte-pinned actual
recordings, explicit synthetic mutation controls, stale asynchronous results, empty
views, uninitialized memory, keyboard navigation, narrow-screen layout and both themes.
Synthetic test mutations are not reported as live sessions.

Qualification commands:

```sh
npm run test -- tests/physical-entry-debug-v20.test.ts tests/physical-entry-debug-v20-view.test.tsx tests/physical-entry-debug-v20-content.test.ts
npm run lint
npm run typecheck
npm run build
npm run test:e2e -- e2e/physical-entry-cpu-debug-v20.spec.ts
```

Focused adapter/view/content tests, lint, typecheck and the production build passed
on the integrated snapshot. Browser qualification is recorded separately; none of
these checks establishes GPU execution or source authentication.
