import { useEffect, useId, useRef, useState } from "react";
import { projectPhysicalDebugV20, PHYSICAL_DEBUG_SELECTOR_V20,
  type PhysicalDebugInputV20, type PhysicalProjectionV20, type PhysicalRecordingV20 } from "../content/physical-entry-debug-v20";
import { PHYSICAL_DEBUG_RETAINED_V20 } from "../content/physical-entry-debug-v20-retained";
import { readResourceImportFile } from "../content/recorded-resource-import";
import { ResourceCheckpointValueRows } from "./ResourceCheckpointValuesView";
import "./PhysicalEntryDebugV20.css";

function Recording({ recording }: { recording: PhysicalRecordingV20 }) {
  const [at, setAt] = useState(0), selected = recording.records[at];
  return <>
    <p role="status">V20 presentation checks passed. Browsing recorded observations; no live debugger is connected.</p>
    <label>Recorded V20 observation <select aria-label="Recorded V20 observation" value={at} onChange={event => setAt(Number(event.target.value))}>
      {recording.records.map((item, index) => <option key={item.requestId} value={index}>
        {index + 1}. {item.label} — {item.status}, event {item.event}, revision {item.revision}
      </option>)}
    </select></label>
    <div className="physical-debug-v20-controls" role="group" aria-label="Browse recorded observations">
      <button type="button" disabled={at === 0} onClick={() => setAt(n => n - 1)}>Previous recorded observation</button>
      <button type="button" disabled={at + 1 === recording.records.length} onClick={() => setAt(n => n + 1)}>Next recorded observation</button>
    </div>
    <p aria-live="polite">Observation {at + 1} of {recording.records.length}: request {selected.requestId}, {selected.label}.
      Recorded event {selected.event}, revision {selected.revision}, session {selected.state}.</p>
    <p role="status" data-recorded-status={selected.status}>{selected.detail}</p>
    <p>The buttons browse response order only. Recorded forward/reverse/seek commands navigated immutable CPU observations;
      neither these buttons nor imported commands execute, rewind, or resume a kernel.</p>
    {selected.anchor ? <section aria-label="V20 selected logical checkpoint">
      <h4>Selected recorded KIR site</h4>
      <p>Function 0, block {selected.anchor.block}, operation {selected.anchor.operation}.
        Logical workgroup [{selected.anchor.workgroup.join(", ")}], wave 0, lane {selected.anchor.lane};
        global workitem [{selected.anchor.global.join(", ")}].</p>
      <p>Resident logical wave mask: <code>{selected.anchor.activeMask.toString()}</code>.
        This is not physical EXEC. Block IDs and observed sites do not reconstruct CFG edges or untaken paths.</p>
    </section> : <p>No snapshot in this response. Previous checkpoint, SSA and memory views are not reused.</p>}
    {selected.values !== null ? <section aria-label="V20 recorded SSA page">
      <h4>Selected recorded SSA page</h4>
      <p>Positions {selected.page!.start} through {selected.page!.start + selected.values.length} (exclusive).
        {selected.page!.next === null ? " No continuation cursor in this response." : " More bindings exist; next recorded page position " + selected.page!.next + "."}
        The browser does not fetch missing pages.</p>
      <p>Symbolic pointer halves, carries and other nonnumeric bindings retain <code>not_represented</code>.
        Their numerical values and symbolic subtype are unavailable in this protocol—not zero, redacted bits, or hardware registers.</p>
      <ResourceCheckpointValueRows rows={selected.values} />
    </section> : <p>SSA values unavailable in this response. No table is carried over from another query.</p>}
    {selected.memory ? <section aria-label="V20 recorded logical memory">
      <h4>Read-only logical memory observation</h4>
      <p>Allocation {selected.memory.allocation}, generation 0; byte offset {selected.memory.offset}.
        Allocation-relative coordinates are not device addresses. No input buffer or allocation permissions are inferred.</p>
      <div className="physical-debug-v20-scroll" tabIndex={0} role="region" aria-label="Scrollable recorded memory bytes">
        <table aria-label="Selected V20 recorded memory bytes">
          <thead><tr><th scope="col">Byte offset</th><th scope="col">Stored byte</th><th scope="col">Initialization</th></tr></thead>
          <tbody>{selected.memory.cells.map((cell, i) => <tr key={i}>
            <th scope="row">{selected.memory!.offset + i}</th><td><code>0x{cell.byte}</code></td>
            <td>{cell.initialized ? "Initialized observed byte" : "Uninitialized storage — not a valid value"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p>Uninitialized backing bytes are shown only as storage observations, never interpreted as a valid scalar.</p>
    </section> : <p>Logical memory unavailable in this response; no previous bytes are shown.</p>}
    <section aria-label="V20 unavailable authority">
      <h4>Unavailable views and authority</h4>
      <p>Source maps and source-variable values require an authenticated map. Physical registers, native addresses, hardware wave state,
        watchpoints and resumable execution are not provided. V21 recordings are unsupported by this viewer.</p>
      <p>The qualified V20 examples use one output allocation and four scalar arguments.
        The recording is not an ABI descriptor and does not establish allocation ownership or alias safety.</p>
    </section>
    <details><summary>Selected original JSONL pair and byte hashes</summary>
      <p>Declared configuration: <code>{recording.configuration}</code>.</p>
      <p>Requests SHA-256: <code>{recording.requestSha256}</code>.</p>
      <p>Responses SHA-256: <code>{recording.responseSha256}</code>.</p>
      <p>Hashes identify these bytes, not their producer, source custody, executable admission, hardware behavior or proof.</p>
      <pre aria-label="Original V20 request">{selected.requestUtf8}</pre>
      <pre aria-label="Original V20 response">{selected.responseUtf8}</pre>
    </details>
  </>;
}
export function PhysicalEntryDebugObservationV20({ input }: { input: PhysicalDebugInputV20 | null }) {
  const [completed, setCompleted] = useState<{ input: PhysicalDebugInputV20 | null; value: PhysicalProjectionV20 } | null>(null);
  useEffect(() => {
    let current = true;
    void projectPhysicalDebugV20(input).then(value => { if (current) setCompleted({ input, value }); });
    return () => { current = false; };
  }, [input]);
  const value = completed !== null && completed.input === input ? completed.value : null;
  return <section aria-label="V20 recorded CPU observation">
    <p>Local, read-only presentation. No imported command is executed or uploaded. Bytes cannot supply source custody,
      simulator admission, compiler continuation, hardware capture, deterministic replay or launch authority.</p>
    {value === null ? <p role="status">Checking current V20 bytes; no previous values are shown.</p>
      : value.status !== "ready" ? <p role="status" data-state={value.status}>{value.detail}</p>
        : <Recording key={value.key} recording={value} />}
  </section>;
}
export function PhysicalEntryDebugWorkbenchV20() {
  const heading = useId(), [choice, setChoice] = useState("0");
  const [input, setInput] = useState<PhysicalDebugInputV20 | null>(PHYSICAL_DEBUG_RETAINED_V20[0].input);
  const [files, setFiles] = useState<{ requests?: File; responses?: File }>({});
  const [explicit, setExplicit] = useState(false), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Bundled actual retained CPU command output; no new execution.");
  const generation = useRef(0), reading = useRef<AbortController | null>(null);
  useEffect(() => () => { generation.current++; reading.current?.abort(); }, []);
  function clear() { generation.current++; reading.current?.abort(); reading.current = null; setBusy(false); setInput(null); }
  function file(role: keyof typeof files, selected?: File) {
    clear(); setFiles(previous => ({ ...previous, [role]: selected })); setChoice("local");
    setNotice("Caller-supplied local files are unverified. Explicitly read them to replace the cleared observation.");
  }
  async function read() {
    clear();
    if (!explicit || !files.requests || !files.responses) { setNotice("Select --diagnostic-kir-v20 explicitly and choose both JSONL files."); return; }
    const current = generation.current, controller = new AbortController(); reading.current = controller; setBusy(true);
    setNotice("Reading bounded local bytes, without a network request or debugger command.");
    try {
      const [requestsUtf8, responsesUtf8] = await Promise.all([
        readResourceImportFile(files.requests, controller.signal), readResourceImportFile(files.responses, controller.signal),
      ]);
      if (current === generation.current) {
        setInput({ selector: PHYSICAL_DEBUG_SELECTOR_V20, requestsUtf8, responsesUtf8 });
        setNotice("Caller-supplied / unverified recording. The explicit version label is not canonical admission or producer authentication.");
      }
    } catch (error) {
      controller.abort();
      if (current === generation.current) setNotice(error instanceof Error ? error.message.slice(0, 240) : "Local file read refused.");
    } finally { if (current === generation.current) { reading.current = null; setBusy(false); } }
  }
  return <section className="physical-debug-v20" aria-labelledby={heading}>
    <h3 id={heading}>Physical-entry V20: recorded CPU observations</h3>
    <label>Retained V20 command session <select aria-label="Retained V20 command session" value={choice}
      onChange={event => { clear(); const next = event.target.value; setChoice(next);
        if (next !== "local") { setInput(PHYSICAL_DEBUG_RETAINED_V20[Number(next)].input);
          setNotice("Bundled actual retained CPU command output; no new execution."); } }}>
      {PHYSICAL_DEBUG_RETAINED_V20.map((item, i) => <option key={item.label} value={i}>{item.label}</option>)}
      <option value="local">Local unverified files</option>
    </select></label>
    <p>The four retained sessions cover one block, both diamond selectors, and a register-edited source.
      Their recorded sites and bytes are observations, not an inferred CFG or a Rust source map.</p>
    <details><summary>Display your own complete V20 recording</summary>
      <form onSubmit={event => { event.preventDefault(); void read(); }}>
        <label><input type="checkbox" checked={explicit} onChange={event => { clear(); setExplicit(event.target.checked); }} />
          I selected --diagnostic-kir-v20 in the debugger command</label>
        <label>V20 request JSONL<input type="file" accept=".jsonl,.txt" onChange={event => file("requests", event.target.files?.[0])} /></label>
        <label>V20 response JSONL<input type="file" accept=".jsonl,.stdout,.txt" onChange={event => file("responses", event.target.files?.[0])} /></label>
        <p>Two files, at most 256 KiB each and 256 paired responses. Requires initial capability discovery,
          a recorded completed cursor, a V20-named refusal and final termination. Unsupported or truncated subsets fail closed.
          No binary KIR, source map or hardware-register uploads.</p>
        <button type="submit" disabled={busy}>Read local V20 recording</button>
        <button type="button" onClick={() => { clear(); setChoice("local"); setNotice("V20 recording cleared; no values retained for display."); }}>Clear V20 recording</button>
      </form>
    </details>
    <p role="status">{notice}</p>
    <PhysicalEntryDebugObservationV20 input={input} />
    <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/physical-entry-cpu-viewer-v20.md">Recording format, commands and evidence limits</a>.
      This viewer does not change compiler pins or broader debugger milestone maturity.</p>
  </section>;
}
