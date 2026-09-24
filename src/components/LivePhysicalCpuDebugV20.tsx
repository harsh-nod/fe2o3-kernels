import { useEffect, useId, useRef, useState } from "react";
import { PhysicalBridgeErrorV20, PhysicalCpuSessionV20, type PhysicalFetchV20 } from "../lib/physical-cpu-v20-session";
import type { PhysicalObservationV20 } from "../content/physical-entry-debug-v20-shapes";
import { ResourceCheckpointValueRows } from "./ResourceCheckpointValuesView";
import "./PhysicalEntryDebugV20.css";

/** Explicit connection only; opening this component does not contact a bridge. */
export function LivePhysicalCpuDebugV20({ fetcher }: { fetcher?: PhysicalFetchV20 } = {}) {
  const [client] = useState(() => new PhysicalCpuSessionV20(fetcher));
  const [url, setUrl] = useState(""), [explicit, setExplicit] = useState(false);
  const [count, setCount] = useState("1"), [seek, setSeek] = useState("0");
  const [limit, setLimit] = useState("16"), [offset, setOffset] = useState("0"), [length, setLength] = useState("16");
  const [reply, setReply] = useState<PhysicalObservationV20 | null>(null), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Disconnected. No request has been sent.");
  const password = useRef<HTMLInputElement | null>(null), epoch = useRef(0), heading = useId();
  useEffect(() => () => { epoch.current++; client.dispose(); }, [client]);
  function clear() { epoch.current++; setReply(null); setBusy(false); }
  function replace() {
    clear(); client.invalidate();
    setNotice(client.needsCleanup ? "Connection input changed. Disconnect the captured old connection before reconnecting."
      : "Connection input changed. No request has been sent.");
  }
  async function perform(kind: "connect" | "disconnect" | "command", command = "") {
    clear(); const current = epoch.current; setBusy(true);
    setNotice("Waiting for one bounded V20 reply; prior values are cleared.");
    const secret = kind === "connect" ? password.current?.value ?? "" : "";
    if (kind === "connect" && password.current) password.current.value = "";
    try {
      const value = kind === "connect" ? await client.connect(url, secret)
        : kind === "disconnect" ? await client.disconnect() : await client.command(command);
      if (current === epoch.current) {
        setReply(value ?? null); setNotice(value ? value.detail : "Disconnected after owned bridge cleanup.");
      }
    } catch (error) {
      if (current === epoch.current) {
        const failure = error instanceof PhysicalBridgeErrorV20 ? error : new PhysicalBridgeErrorV20("unknown");
        setNotice(failure.message);
      }
    } finally { if (current === epoch.current) setBusy(false); }
  }
  const enabled = !busy && client.ready, query = enabled && client.hasCheckpoint;
  return <section className="physical-debug-v20" aria-labelledby={heading}>
    <h3 id={heading}>Live connection to V20 CPU observations</h3>
    <p>This separate local bridge must be launched with <code>--kind diagnostic-kir-v20</code>.
      It navigates immutable same-engine CPU observations; it does not execute, rewind or resume a kernel.
      The legacy live debugger and the recorded-file viewer are separate routes.</p>
    <p>Local profile: one logical output allocation, ordinal 1/generation 0. No second input buffer, native address,
      physical-register capture, authenticated Rust mapping, hardware or launch authority is inferred.</p>
    <form onSubmit={event => { event.preventDefault(); if (explicit) void perform("connect"); }}>
      <label>V20 bridge endpoint<input aria-label="V20 bridge endpoint" value={url} autoComplete="off"
        placeholder="http://127.0.0.1:8742" onChange={event => { replace(); setUrl(event.target.value); }} /></label>
      <label>V20 bridge token<input aria-label="V20 bridge token" ref={password} type="password" autoComplete="off"
        onChange={replace} /></label>
      <label><input type="checkbox" checked={explicit} onChange={event => { replace(); setExplicit(event.target.checked); }} />
        I selected the local diagnostic-kir-v20 bridge profile</label>
      <button type="submit" disabled={busy || !explicit || client.needsCleanup}>Connect V20 CPU bridge</button>
      <button type="button" disabled={!client.needsCleanup} onClick={() => void perform("disconnect")}>
        Disconnect V20 CPU bridge</button>
    </form>
    <p role="status" aria-live="polite">{notice}</p>
    <p>One request at a time; at most 255 commands per connection. Unknown outcomes clear all views and require cleanup,
      with no automatic retry. This panel never starts a server, compiler or GPU.</p>
    <fieldset disabled={!enabled}>
      <legend>Navigate recorded CPU observations</legend>
      <label>Event count<input aria-label="V20 event count" inputMode="numeric" value={count}
        onChange={event => { setReply(null); setCount(event.target.value); }} /></label>
      <button type="button" onClick={() => void perform("command", "step " + count)}>Forward V20 events</button>
      <button type="button" onClick={() => void perform("command", "reverse " + count)}>Reverse V20 events</button>
      <label>Event cursor<input aria-label="V20 event cursor" inputMode="numeric" value={seek}
        onChange={event => { setReply(null); setSeek(event.target.value); }} /></label>
      <button type="button" onClick={() => void perform("command", "seek " + seek)}>Seek V20 observation</button>
      <button type="button" onClick={() => void perform("command", "state")}>Read V20 state</button>
    </fieldset>
    <fieldset disabled={!query}>
      <legend>Read current logical checkpoint</legend>
      <label>SSA page size<input aria-label="V20 SSA page size" inputMode="numeric" value={limit}
        onChange={event => { setReply(null); setLimit(event.target.value); }} /></label>
      <button type="button" onClick={() => void perform("command", "values " + limit)}>Read V20 SSA values</button>
      <button type="button" disabled={!query || !client.hasNextPage}
        onClick={() => void perform("command", "values next")}>Next V20 SSA page</button>
      <label>Output byte offset<input aria-label="V20 output byte offset" inputMode="numeric" value={offset}
        onChange={event => { setReply(null); setOffset(event.target.value); }} /></label>
      <label>Output byte count<input aria-label="V20 output byte count" inputMode="numeric" value={length}
        onChange={event => { setReply(null); setLength(event.target.value); }} /></label>
      <button type="button" onClick={() => void perform("command", "memory " + offset + " " + length)}>Read V20 output bytes</button>
    </fieldset>
    {reply ? <section aria-label="Current V20 live CPU observation">
      <p>Request {reply.requestId}; event {reply.event}; revision {reply.revision}; {reply.status}. Remaining commands: {client.remaining}.</p>
      {reply.anchor ? <p>KIR function 0, block {reply.anchor.block}, operation {reply.anchor.operation}.
        Logical workgroup [{reply.anchor.workgroup.join(", ")}], wave 0, lane {reply.anchor.lane}.
        Resident mask {reply.anchor.activeMask.toString()} is not authored physical EXEC.</p>
        : <p>No captured checkpoint in this reply. Previous sites, values and bytes are not reused.</p>}
      {reply.values !== null ? <section aria-label="Current V20 live SSA page">
        <h4>SSA observations, not physical registers</h4>
        <p>Page starts at {reply.page!.start}; {reply.values.length} bindings.
          {reply.page!.next === null ? " No next page." : " More bindings are available at the current revision."}</p>
        <p>Symbolic pointer halves and carries remain not_represented, never invented numeric bits or addresses.</p>
        <ResourceCheckpointValueRows rows={reply.values} />
      </section> : <p>No SSA values in this response.</p>}
      {reply.memory ? <section aria-label="Current V20 live logical output">
        <h4>Read-only output storage observation</h4>
        <div className="physical-debug-v20-scroll" tabIndex={0} role="region" aria-label="Scrollable live V20 output bytes">
          <table aria-label="Current V20 output bytes"><thead><tr><th scope="col">Offset</th>
            <th scope="col">Stored byte</th><th scope="col">Initialization</th></tr></thead>
            <tbody>{reply.memory.cells.map((cell, index) => <tr key={index}>
              <th scope="row">{reply.memory!.offset + index}</th><td><code>0x{cell.byte}</code></td>
              <td>{cell.initialized ? "Initialized observed byte" : "Uninitialized storage — not a valid value"}</td>
            </tr>)}</tbody></table>
        </div>
      </section> : <p>No memory bytes in this response.</p>}
      <details><summary>Bounded re-encoded inner CLI response</summary>
        <p>The bridge re-encodes this response. It is not an original byte-stream recording, source receipt or hardware evidence.</p>
        <pre aria-label="V20 live inner response">{reply.responseUtf8}</pre>
      </details>
    </section> : <p>No current V20 observation is displayed.</p>}
    <p>Source variables, physical registers, hardware state, watchpoints, resumable execution and V21 pending-load views
      are not exposed by this route. Unavailable/error responses are not successful execution or proof.</p>
  </section>;
}
