import { useEffect, useId, useRef, useState } from "react";
import { CpuBridgeError, CpuDebugSession, type CpuBridgeReply, type CpuFetch } from "../lib/cpu-debug-session";
import type { CpuLiveQueryCollection, CpuLiveQuerySelection } from "../lib/cpu-live-query-collection";
import { LiveCpuCheckpointDashboard } from "./LiveCpuCheckpointDashboard";
import { LiveCpuObservedPanel } from "./LiveCpuObservedPanel";
import type { CpuObservedCollection, CpuObservedSelection } from "../lib/cpu-observed-collection";
import "./LiveCpuDebuggerWorkbench.css";

type Fields = Record<"function" | "block" | "operation" | "allocation" | "generation" | "offset" | "length" | "breakId" | "watchId", string>;
const EMPTY_FIELDS: Fields = { function: "", block: "", operation: "", allocation: "", generation: "",
  offset: "", length: "", breakId: "", watchId: "" };
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function decimal(value: unknown): string {
  return typeof value === "bigint" || (typeof value === "number" && Number.isSafeInteger(value)) ? value.toString() : "unavailable";
}
function Reply({ reply }: { reply: CpuBridgeReply }) {
  const result = object(reply.response.result), memory = object(result?.memory);
  const availability = object(memory?.availability), stack = result?.frames;
  return <section className="live-cpu-reply" aria-label="Current validated CPU response">
    <h4>Latest correlated CPU response</h4>
    <dl className="live-cpu-facts">
      <div><dt>Configuration</dt><dd>{reply.session.configuration_identity}</dd></div>
      <div><dt>Bridge sequence</dt><dd>{reply.sequence}</dd></div>
      <div><dt>State revision</dt><dd>{reply.session.revision}</dd></div>
      <div><dt>Event sequence</dt><dd>{reply.session.cursor.event_sequence}</dd></div>
      <div><dt>Session state</dt><dd>{reply.session.state}</dd></div>
      <div><dt>Backend response status</dt><dd>{String(reply.response.status)}</dd></div>
    </dl>
    {reply.response.status !== "ok" && <p className="live-cpu-boundary">
      The backend returned {String(reply.response.status)} without changing the checked session.
      No previous values are substituted. Its exact refusal is retained below.
    </p>}
    {result?.result === "acknowledged" && <p>The backend acknowledged one filter change.
      Use the corresponding List button to inspect backend-assigned IDs; no local filter is invented.</p>}
    {result?.result === "source" && <p>Source resolution applies only to the exact requested KIR site.
      No source body is read or fetched, and no source-variable or SSA correspondence is inferred.</p>}
    {result?.result === "stack" && Array.isArray(stack) && <p>Returned {stack.length} stack rows, at most 16.
      A next_cursor in the response means additional rows are omitted. Frame depth is not a dynamic activation ID.</p>}
    {(result?.result === "breakpoints" || result?.result === "watchpoints") && <p>This is the backend's bounded first page,
      not a locally simulated list. A next_cursor means more entries are omitted; this panel does not traverse pages.</p>}
    {result?.result === "memory" && memory && availability && <section className="live-cpu-memory" aria-label="Current CPU memory window">
      <h5>Allocation-relative memory observation</h5>
      <p>Offset {decimal(memory.byte_offset)}; requested {decimal(memory.requested_bytes)} bytes;
        returned {decimal(memory.returned_bytes)} bytes; availability {String(availability.status)}.</p>
      {availability.status === "captured" ? <>
        <p>Byte storage: <code>{String(availability.bytes)}</code></p>
        <p>Initialization mask: <code>{String(availability.initialized)}</code></p>
        <p>Uninitialized bytes are not valid program values. This is not a typed dereference,
          allocation-reuse proof or physical device-memory read.</p>
      </> : <p>No captured memory bytes are displayed. Unavailable/redacted reasons remain in the response.</p>}
    </section>}
    {(result?.result === "control" || result?.result === "state") && <p>
      Snapshot availability and any captured logical values are exactly those returned below.
      Uncaptured terminal stops do not inherit earlier memory, source or SSA values.</p>}
    <details open><summary>Lossless bridge response JSON</summary>
      <p>This bounded protocol object was losslessly re-encoded by the local bridge.
        It is not the original wire byte stream or a capture receipt. Correlation and selected
        cursor/source/memory joins are checked; this panel is not a complete Rust payload validator.</p>
      <pre tabIndex={0} aria-label="Lossless CPU protocol response">{reply.responseJson}</pre>
    </details>
  </section>;
}
export function LiveCpuDebuggerWorkbench({ fetcher }: { fetcher?: CpuFetch } = {}) {
  const [client] = useState(() => new CpuDebugSession(fetcher));
  const [endpoint, setEndpoint] = useState(""), [reply, setReply] = useState<CpuBridgeReply | null>(null);
  const [queryCollection, setQueryCollection] = useState<CpuLiveQueryCollection | null>(null);
  const [observedCollection, setObservedCollection] = useState<CpuObservedCollection | null>(null);
  const [fields, setFields] = useState<Fields>({ ...EMPTY_FIELDS });
  const [count, setCount] = useState("1"), [budget, setBudget] = useState("1024");
  const [phase, setPhase] = useState("before"), [access, setAccess] = useState("write");
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState("Disconnected. No debugger request has been sent.");
  const password = useRef<HTMLInputElement | null>(null), endpointInput = useRef<HTMLInputElement | null>(null);
  const generation = useRef(0), heading = useId();
  useEffect(() => () => { generation.current++; client.dispose(); }, [client]);
  function clearVisible() { generation.current++; setReply(null); setQueryCollection(null); setObservedCollection(null); setBusy(false); }
  function replaceConnection() {
    clearVisible(); client.invalidate();
    setNotice(client.needsCleanup
      ? "Connection input changed. Live values cleared; Disconnect still targets the captured old connection. Cleanup is required before reconnecting."
      : "Connection input changed. No debugger request has been sent.");
  }
  function editField(name: keyof Fields, value: string) { setReply(null); setQueryCollection(null); setObservedCollection(null); setFields(previous => ({ ...previous, [name]: value })); }
  function fail(error: unknown) {
    const failure = error instanceof CpuBridgeError ? error : new CpuBridgeError("transport_failed", "unknown");
    setNotice(failure.code + ": " + failure.message);
  }
  async function connect() {
    clearVisible(); const current = generation.current;
    setBusy(true); setNotice("Connecting to the explicitly selected local CPU bridge…");
    const secret = password.current?.value ?? "";
    if (password.current) password.current.value = "";
    try {
      const next = await client.connect(endpoint, secret);
      if (current === generation.current) { setReply(next); setNotice("Connected to a CPU-only debugger. No GPU execution or performance prediction."); }
    } catch (error) { if (current === generation.current) fail(error); }
    finally { if (current === generation.current) setBusy(false); }
  }
  async function send(command: string) {
    clearVisible(); const current = generation.current;
    setBusy(true); setNotice("Waiting for one correlated CPU debugger reply. Prior values are cleared.");
    try {
      const next = await client.command(command);
      if (current === generation.current) { setReply(next); setNotice("Validated reply received. Backend unavailable/error facts remain explicit."); }
    } catch (error) { if (current === generation.current) fail(error); }
    finally { if (current === generation.current) setBusy(false); }
  }
  async function collectQueries(selection?: CpuLiveQuerySelection) {
    clearVisible(); const current = generation.current;
    setBusy(true); setNotice("Collecting one bounded live CPU checkpoint view. No execution or filter mutation.");
    try {
      const next = await client.collectQueries(selection);
      if (current === generation.current) {
        setQueryCollection(next); setReply(next.replies.at(-1) ?? null);
        setNotice("Bounded checkpoint queries completed. Availability and omitted pages remain explicit.");
      }
    } catch (error) { if (current === generation.current) fail(error); }
    finally { if (current === generation.current) setBusy(false); }
  }
  async function collectObserved(selection?: CpuObservedSelection) {
    clearVisible(); const current = generation.current;
    setBusy(true); setNotice("Collecting actual CPU runtime and allocator observations. No execution or filter mutation.");
    try {
      const next = await client.collectObserved(selection);
      if (current === generation.current) {
        setObservedCollection(next); setReply(next.replies.at(-1) ?? null);
        setNotice("Bounded runtime/storage collection received. Independent coverage and omitted pages remain explicit.");
      }
    } catch (error) { if (current === generation.current) fail(error); }
    finally { if (current === generation.current) setBusy(false); }
  }
  async function disconnect() {
    clearVisible(); const current = generation.current;
    setBusy(true); setNotice("Live state cleared. Requesting bounded cleanup of the captured connection…");
    if (password.current) password.current.value = "";
    try {
      await client.disconnect();
      if (current === generation.current) {
        setNotice("Disconnected. The bridge confirmed cleanup; this is not a backend terminate-command acknowledgement.");
        setFields({ ...EMPTY_FIELDS }); endpointInput.current?.focus();
      }
    } catch (error) { if (current === generation.current) fail(error); }
    finally { if (current === generation.current) setBusy(false); }
  }
  const enabled = client.ready && !busy;
  const site = [fields.function, fields.block, fields.operation].join(" ");
  const range = [fields.allocation, fields.generation, fields.offset, fields.length].join(" ");
  function field(name: keyof Fields, label: string) {
    return <label>{label}<input inputMode="numeric" autoComplete="off" maxLength={20} value={fields[name]}
      onChange={event => editField(name, event.target.value)} /></label>;
  }
  return <><section className="live-cpu-debugger" aria-labelledby={heading}>
    <h3 id={heading}>Live local CPU debugger</h3>
    <p className="live-cpu-boundary">Opt-in connection to a separately started local CPU bridge.
      These controls send real bounded debugger requests; the recorded examples elsewhere remain independent.
      No GPU, source edits, executable paths, shell commands or environment input is accepted.</p>
    <form className="live-cpu-connect" onSubmit={event => { event.preventDefault(); void connect(); }}>
      <label>Local CPU bridge address<input ref={endpointInput} value={endpoint} maxLength={128}
        placeholder="http://127.0.0.1:PORT" autoComplete="off" spellCheck={false}
        onChange={event => { replaceConnection(); setEndpoint(event.target.value); }} /></label>
      <label>Bridge secret<input ref={password} type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={64}
        onChange={replaceConnection} /></label>
      <p>The 64-character lowercase hex secret is kept only in memory, sent only in its header,
        never in a URL or browser storage. The bridge address must be exactly http://127.0.0.1:PORT.
        No network request occurs merely by opening this panel.</p>
      <div className="live-cpu-actions">
        <button type="submit" disabled={busy || client.needsCleanup}>Connect CPU debugger</button>
        <button type="button" disabled={!client.needsCleanup} onClick={() => void disconnect()}>Disconnect CPU debugger</button>
      </div>
    </form>
    <p role="status" aria-live="polite">{notice}</p>
    <p>One request at a time, no automatic retries. A timeout or interrupted mutation may have an unknown outcome.
      Changing connection inputs immediately drops live values but never redirects cleanup to a new address/token.
      Disconnect before reconnecting or closing this panel; closing attempts bounded cleanup without claiming success.</p>
    <fieldset disabled={!enabled} className="live-cpu-controls">
      <legend>Live CPU execution controls</legend>
      <div className="live-cpu-fields">
        <label>Operation step count<input inputMode="numeric" maxLength={2} value={count}
          onChange={event => { setReply(null); setQueryCollection(null); setObservedCollection(null); setCount(event.target.value); }} /></label>
        <label>Continue event budget<input inputMode="numeric" maxLength={5} value={budget}
          onChange={event => { setReply(null); setQueryCollection(null); setObservedCollection(null); setBudget(event.target.value); }} /></label>
      </div>
      <p>Steps are operation-granularity (1..64); continue is bounded to 1..65536 events.
        Logical CPU state is not a hardware wave/register observation.</p>
      <div className="live-cpu-actions">
        <button type="button" onClick={() => void send("state")}>Read CPU state</button>
        <button type="button" onClick={() => void send("step " + count)}>Step CPU forward</button>
        <button type="button" onClick={() => void send("reverse " + count)}>Step CPU reverse</button>
        <button type="button" onClick={() => void send("continue " + budget)}>Continue CPU execution</button>
        <button type="button" onClick={() => void send("stack")}>Read CPU stack</button>
      </div>
    </fieldset>
    <fieldset disabled={!enabled}>
      <legend>Exact source site and breakpoint controls</legend>
      <p>Enter current protocol roster ordinals, not a raw KIR BlockId. Empty fields are not inferred from a fixture.
        Source resolves a location only; it does not read source files or query source variables.</p>
      <div className="live-cpu-fields">{field("function", "Function ordinal")}{field("block", "Block roster ordinal")}
        {field("operation", "Operation ordinal")}
        <label>Breakpoint phase<select value={phase} onChange={event => { setReply(null); setQueryCollection(null); setObservedCollection(null); setPhase(event.target.value); }}>
          <option value="before">Before operation</option><option value="after">After operation</option></select></label>
        {field("breakId", "Breakpoint ID to remove")}
      </div>
      <div className="live-cpu-actions">
        <button type="button" onClick={() => void send("source " + site)}>Resolve CPU source site</button>
        <button type="button" onClick={() => void send("break add " + site + " " + phase)}>Set CPU breakpoint</button>
        <button type="button" onClick={() => void send("break list")}>List CPU breakpoints</button>
        <button type="button" onClick={() => void send("break remove " + fields.breakId)}>Remove CPU breakpoint</button>
      </div>
    </fieldset>
    <fieldset disabled={!enabled}>
      <legend>Allocation-relative memory and watchpoint controls</legend>
      <p>Use the allocation ID and generation returned for this session. Generation is explicit; zero does not mean reuse.
        Offset is allocation-relative, length is 1..4096 bytes, and watch timing is after_commit.</p>
      <div className="live-cpu-fields">{field("allocation", "Allocation ordinal")}{field("generation", "Allocation generation")}
        {field("offset", "Allocation byte offset")}{field("length", "Memory byte length")}
        <label>Watchpoint access<select value={access} onChange={event => { setReply(null); setQueryCollection(null); setObservedCollection(null); setAccess(event.target.value); }}>
          {["read", "write", "atomic", "any"].map(value => <option key={value}>{value}</option>)}</select></label>
        {field("watchId", "Watchpoint ID to remove")}
      </div>
      <div className="live-cpu-actions">
        <button type="button" onClick={() => void send("memory " + range)}>Read CPU memory</button>
        <button type="button" onClick={() => void send("watch add " + range + " " + access)}>Set CPU watchpoint</button>
        <button type="button" onClick={() => void send("watch list")}>List CPU watchpoints</button>
        <button type="button" onClick={() => void send("watch remove " + fields.watchId)}>Remove CPU watchpoint</button>
      </div>
    </fieldset>
    <p>Lists and stack return at most 16 rows. This first-page panel does not infer omitted entries or traverse opaque cursors.
      Source, stack, memory and snapshot unavailability remain backend-owned facts. These legacy replies do not establish
      source-to-SSA mappings, actual activations or storage reuse; the separate observed panel reports only its own captured facts.
      Neither panel grants protected-proof or compiler-authentication authority.</p>
    {reply && <Reply reply={reply} />}
  </section><LiveCpuCheckpointDashboard checkpoint={client.queryCheckpoint} collection={queryCollection}
    busy={busy} remainingCommands={client.remainingCommands} onRefresh={selection => void collectQueries(selection)} />
    <LiveCpuObservedPanel collection={observedCollection === client.observationCollection ? observedCollection : null}
      checkpoint={client.queryCheckpoint} busy={busy} enabled={enabled} remainingCommands={client.remainingCommands}
      onRefresh={selection => void collectObserved(selection)} /></>;
}
