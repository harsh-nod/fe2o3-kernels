import { useEffect, useId, useRef, useState } from "react";
import { projectCompleteBodyDebugV19, COMPLETE_BODY_DEBUG_SELECTOR_V19, COMPLETE_BODY_DEBUG_LIMITS_V19,
  type CompleteBodyDebugInputV19, type CompleteBodyDebugProjectionV19, type CompleteBodyDebugRecordingV19 } from "../content/complete-body-debug-v19";
import { COMPLETE_BODY_DEBUG_RETAINED_V19 } from "../content/complete-body-debug-v19-retained";
import { readResourceImportFile } from "../content/recorded-resource-import";
import { ResourceCheckpointValueRows } from "./ResourceCheckpointValuesView";
import "./CompleteBodyDebugV19.css";

function Recording({ recording }: { recording: CompleteBodyDebugRecordingV19 }) {
  const [at, setAt] = useState(0), selected = recording.checkpoints[at];
  return <>
    <p role="status">Presentation checks passed. This is recorded CPU data, not a live connection or authenticated source.</p>
    <label>Recorded V19 checkpoint <select aria-label="Recorded V19 checkpoint" value={at}
      onChange={event => setAt(Number(event.target.value))}>
      {recording.checkpoints.map((checkpoint, index) => <option key={checkpoint.requestId} value={index}>
        {checkpoint.label} — event {checkpoint.event}, revision {checkpoint.revision}
      </option>)}
    </select></label>
    <p aria-live="polite">Request {selected.requestId}: {selected.label}. Event {selected.event}, revision {selected.revision}.</p>
    <ol aria-label="Recorded V19 event sequence">
      {recording.checkpoints.map(item => <li key={item.requestId}>{item.label}: event {item.event}, revision {item.revision}
        {item.observed ? " — observed KIR function 0 / block 0 / operation 0" : " — snapshot not captured"}</li>)}
    </ol>
    <p>This is an observed cursor sequence, not a reconstructed CFG. It does not show the diamond branch,
      full authored-program stepping, a declaration/instruction mapping, or untaken edges.</p>
    {selected.observed ? <section aria-label="V19 first-event logical snapshot">
      <h4>Retained first-event SSA rows</h4>
      <p>Logical workgroup [0, 0, 0], wave 0, lane 0; active mask <code>{selected.observed.activeMask.toString()}</code>.
        This is not physical EXEC. KIR function 0, block 0, operation 0 are protocol roster ordinals.</p>
      <ResourceCheckpointValueRows rows={selected.observed.rows} />
    </section> : <p role="status">Snapshot unavailable: not_captured. No previous values are reused; unavailable is not zero.</p>}
    <section aria-label="V19 source and CFG availability">
      <h4>Source and CFG boundaries</h4>
      <p>Source location and source-variable maps: unavailable — requires_authenticated_map.
        Full CFG and source-origin-to-instruction mapping: unavailable in this transcript.
        Physical registers and hardware wave state: unavailable. No hardware register capture.</p>
      {recording.metadata ? <details><summary>Optional unverified export declarations</summary>
        <p>Declared kernel: <code>{recording.metadata.kernel}</code>.</p>
        <p>Declared canonical identity: <code>{recording.metadata.canonicalIdentity}</code> ({recording.metadata.canonicalBytes} bytes).</p>
        <p>Declared semantic MIR36 identity: <code>{recording.metadata.semanticMirIdentity}</code>.</p>
        <p>These strings are not joined to this debugger session or original source by the browser.
          Canonical identity is not a file SHA-256. Metadata is optional and cannot grant source custody.</p>
      </details> : <p>No export metadata supplied. Source and canonical declarations remain unavailable; protocol display does not require them.</p>}
    </section>
    <details><summary>Selected original JSONL pair and local byte hashes</summary>
      <p>Configuration: <code>{recording.configuration}</code>.</p>
      <p>Requests SHA-256: <code>{recording.requestSha256}</code>.</p>
      <p>Responses SHA-256: <code>{recording.responseSha256}</code>.</p>
      {recording.metadataSha256 && <p>Metadata SHA-256: <code>{recording.metadataSha256}</code>.</p>}
      <p>Hashes describe retained bytes, not producer authentication, KIR admission or compiler execution.</p>
      <pre aria-label="Original V19 request">{selected.requestUtf8}</pre>
      <pre aria-label="Original V19 response">{selected.responseUtf8}</pre>
    </details>
  </>;
}
export function CompleteBodyDebugObservationV19({ input }: { input: CompleteBodyDebugInputV19 | null }) {
  const [completed, setCompleted] = useState<{ input: CompleteBodyDebugInputV19 | null; value: CompleteBodyDebugProjectionV19 } | null>(null);
  useEffect(() => {
    let current = true;
    void projectCompleteBodyDebugV19(input).then(value => { if (current) setCompleted({ input, value }); });
    return () => { current = false; };
  }, [input]);
  const value = completed !== null && completed.input === input ? completed.value : null;
  return <section aria-label="V19 recorded CPU observation">
    <p>Entry / one logical event / restore only. Read-only display; no source custody, proof, compilation resume,
      artifact or launch authority is imported. No command is executed and no file is uploaded.</p>
    {value === null ? <p role="status">Checking current bytes; no previous values are shown.</p>
      : value.status !== "ready" ? <p role="status" data-state={value.status}>{value.detail}</p>
        : <Recording key={value.key} recording={value} />}
  </section>;
}
export function CompleteBodyDebugWorkbenchV19() {
  const heading = useId(), [choice, setChoice] = useState("0");
  const [input, setInput] = useState<CompleteBodyDebugInputV19 | null>(COMPLETE_BODY_DEBUG_RETAINED_V19[0].input);
  const [files, setFiles] = useState<{ requests?: File; responses?: File; metadata?: File }>({});
  const [explicit, setExplicit] = useState(false), [notice, setNotice] = useState("Bundled recorded public command output; no new execution.");
  const [busy, setBusy] = useState(false), generation = useRef(0), reading = useRef<AbortController | null>(null);
  useEffect(() => () => { generation.current++; reading.current?.abort(); }, []);
  function clear() { generation.current++; reading.current?.abort(); reading.current = null; setBusy(false); setInput(null); }
  function file(role: keyof typeof files, selected?: File) {
    clear(); setFiles(previous => ({ ...previous, [role]: selected })); setChoice("local");
    setNotice("Local files are caller-supplied / unverified. Read them explicitly; no previous observation is displayed.");
  }
  async function load() {
    clear();
    if (!explicit || !files.requests || !files.responses) { setNotice("Select --diagnostic-kir-v19 explicitly and choose both JSONL files."); return; }
    if (files.metadata && files.metadata.size > COMPLETE_BODY_DEBUG_LIMITS_V19.metadataBytes) {
      setNotice("Optional export metadata exceeds 8192 bytes."); return;
    }
    const current = generation.current, controller = new AbortController(); reading.current = controller; setBusy(true);
    setNotice("Reading bounded local files; no network request or debugger command.");
    try {
      const [requestsUtf8, responsesUtf8, metadataUtf8] = await Promise.all([
        readResourceImportFile(files.requests, controller.signal), readResourceImportFile(files.responses, controller.signal),
        files.metadata ? readResourceImportFile(files.metadata, controller.signal) : Promise.resolve(undefined),
      ]);
      if (current === generation.current) {
        setInput({ selector: COMPLETE_BODY_DEBUG_SELECTOR_V19, requestsUtf8, responsesUtf8,
          ...(metadataUtf8 === undefined ? {} : { metadataUtf8 }) });
        setNotice("Caller-supplied / unverified local recording. Version selection is a claim, not canonical byte admission.");
      }
    } catch (error) {
      controller.abort();
      if (current === generation.current) setNotice(error instanceof Error ? error.message.slice(0, 240) : "Local read refused.");
    } finally { if (current === generation.current) { reading.current = null; setBusy(false); } }
  }
  return <section className="complete-body-debug-v19" aria-labelledby={heading}>
    <h3 id={heading}>Complete-body V19: recorded CPU checkpoints</h3>
    <p>Use the ordinary <code>scripts/complete-body-debug-source-v19.mjs</code> command first.
      Its debugger input is explicitly <code>--diagnostic-kir-v19</code>; older bundles are not automatically relabeled.</p>
    <label>Retained V19 command session <select aria-label="Retained V19 command session" value={choice}
      onChange={event => { clear(); const next = event.target.value; setChoice(next);
        if (next !== "local") { setInput(COMPLETE_BODY_DEBUG_RETAINED_V19[Number(next)].input);
          setNotice("Bundled recorded public command output; no new execution."); } }}>
      {COMPLETE_BODY_DEBUG_RETAINED_V19.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
      <option value="local">Local unverified files</option>
    </select></label>
    <p>The six bundled sessions were retained by the public one/diamond commands. They show only entry,
      first event and restore—not both branch outcomes, instruction microsteps or complete execution.</p>
    <details><summary>Display your own five-pair recording</summary>
      <form onSubmit={event => { event.preventDefault(); void load(); }}>
        <label><input type="checkbox" checked={explicit} onChange={event => { clear(); setExplicit(event.target.checked); }} />
          I selected --diagnostic-kir-v19 in the debugger command</label>
        <label>V19 request JSONL<input type="file" accept=".jsonl,.txt" onChange={event => file("requests", event.target.files?.[0])} /></label>
        <label>V19 response JSONL<input type="file" accept=".jsonl,.stdout,.txt" onChange={event => file("responses", event.target.files?.[0])} /></label>
        <label>Optional export-observation.json<input type="file" accept=".json" onChange={event => file("metadata", event.target.files?.[0])} /></label>
        <p>Two JSONL files, at most 256 KiB each; exactly five pairs. Metadata is optional, at most 8192 bytes.
          Unsupported sessions are refused, not truncated or converted. Binary KIR uploads are not accepted.</p>
        <button type="submit" disabled={busy}>Read local V19 recording</button>
        <button type="button" onClick={() => { clear(); setChoice("local"); setNotice("Recording cleared. No values retained for display."); }}>Clear V19 recording</button>
      </form>
    </details>
    <p role="status">{notice}</p>
    <CompleteBodyDebugObservationV19 input={input} />
    <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/complete-body-cpu-viewer-v19.md">Commands, supported transcript and evidence limits</a>.
      This adapter does not promote compiler pins or close V3/V5 or broader debugger milestones.</p>
  </section>;
}
