import { useEffect, useId, useRef, useState } from "react";
import {
  importRecordedWatchpoint, readWatchpointFile, WATCHPOINT_IMPORT_LIMITS,
  type RecordedWatchpointObservation as RecordedWatchpointData,
} from "../content/recorded-watchpoint-observation";
import { ResourceMemoryView } from "./ResourceMemoryView";
import "./RecordedWatchpointObservation.css";

type Moment = "registration" | "stop" | "checkpoint";

function SelectedMoment({ recording, moment }: { recording: RecordedWatchpointData; moment: Moment }) {
  const [showRaw, setShowRaw] = useState(false), [pairIndex, setPairIndex] = useState(0);
  const rawId = useId();
  const { registration, stop, checkpoint, memory } = recording;
  const excluded = [stop.pair.requestId, checkpoint.pair.requestId, memory.pair.requestId];
  const pairs = moment === "stop" ? [stop.pair] : moment === "checkpoint"
    ? [checkpoint.pair, memory.pair] : recording.pairs.filter(pair => !excluded.includes(pair.requestId));
  const pair = pairs[pairIndex] ?? pairs[0];
  return <div className="recorded-watchpoint-moment" data-testid="recorded-watchpoint-moment" data-moment={moment}>
    {moment === "registration" ? <section aria-label="Recorded watchpoint registration">
      <h4>Registration — a recorded request, not a new watchpoint</h4>
      <p>Request {registration.pair.requestId} registers the watchpoint; request {registration.listingPair.requestId} lists it.
        The earlier captured checkpoint is request {recording.initial.pair.requestId},
        event {recording.initial.anchor.cursor.event_sequence}, revision {recording.initial.anchor.cursor.state_revision}.
        Its allocation inventory is not a watch-stop snapshot.</p>
      <dl className="recorded-watchpoint-facts">
        <div><dt>Recorded watchpoint ID</dt><dd>{registration.watchpointId}</dd></div>
        <div><dt>Client label</dt><dd>{registration.spec.client_label}</dd></div>
        <div><dt>Enabled</dt><dd>{registration.spec.enabled ? "Yes" : "No"}</dd></div>
        <div><dt>Logical allocation</dt><dd>alloc#{registration.spec.allocation.ordinal}:g{registration.spec.allocation.generation}</dd></div>
        <div><dt>Requested byte range</dt><dd>Offset {registration.spec.byte_offset}; length {registration.spec.byte_len} bytes</dd></div>
        <div><dt>Requested access / timing</dt><dd>{registration.spec.access} / {registration.spec.timing}</dd></div>
        <div><dt>Earlier inventory capacity</dt><dd>{registration.inventoryRow.capacity_bytes} bytes · {registration.inventoryRow.address_space}</dd></div>
      </dl>
      <p>These identities and ranges are local-recording claims. They are not reusable handles, a physical address,
        an allocation-lifetime guarantee, or evidence of bytes at a future stop.</p>
    </section> : moment === "stop" ? <section aria-label="Uncaptured watchpoint stop">
      <h4>Watchpoint stop — snapshot not captured</h4>
      <p>Request {stop.pair.requestId} reports watchpoint {stop.watchpointId} at event {stop.cursor.event_sequence},
        revision {stop.cursor.state_revision}. Outcome: {stop.outcome}; exact stop: {stop.exact ? "yes" : "no"}.
        Events advanced: {stop.eventsAdvanced}.</p>
      <p className="recorded-watchpoint-boundary">Exact stop does not mean captured state.
        Snapshot: {stop.snapshot.status} / {stop.snapshot.reason}. No later checkpoint is displayed as this stop.</p>
      <div className="recorded-watchpoint-table-wrap" tabIndex={0} aria-label="Watch-stop unavailable fields">
        <table aria-label="Unavailable at the watchpoint stop">
          <thead><tr><th scope="col">Observation</th><th scope="col">Availability</th></tr></thead>
          <tbody>{[
            "Source location and origin", "KIR site", "Logical scope and lane",
            "Frame and occurrence", "Logical SSA values", "Memory bytes and initialization",
          ].map(name => <tr key={name}><th scope="row">{name}</th><td>Unavailable — not captured</td></tr>)}</tbody>
        </table>
      </div>
      <p>Choose the separate later checkpoint explicitly to browse its own captured bytes.
        Neither those bytes nor its source association establish the state or origin of this uncaptured stop.</p>
    </section> : <section aria-label="Separate later captured checkpoint">
      <h4>Later checkpoint — separate from the watchpoint stop</h4>
      <p>Selected request {checkpoint.pair.requestId}: event {checkpoint.anchor.cursor.event_sequence},
        revision {checkpoint.anchor.cursor.state_revision}. The uncaptured stop remains a different moment.
        Memory request {memory.pair.requestId} belongs only to this later checkpoint.</p>
      <p>{checkpoint.values.length} retained logical values are present in this checkpoint&apos;s original response.
        Their exact raw representation is available below; this panel does not infer instruction microsteps,
        physical register contents, or missing values.</p>
      <p>Frame: {checkpoint.anchor.frame ?? "unavailable"}; occurrence: {checkpoint.anchor.occurrence ?? "unavailable"}.
        The memory view below labels this checkpoint&apos;s actual recorded scope and source association,
        not the watch-stop origin.</p>
      <ResourceMemoryView response={memory.pair.response} expectedSnapshot={checkpoint.anchor}
        memoryContext={recording.context} title="Bytes from the separate later checkpoint" />
    </section>}
    <button type="button" aria-expanded={showRaw} aria-controls={rawId}
      onClick={() => setShowRaw(value => !value)}>
      {showRaw ? "Hide selected moment's original pairs" : "Show selected moment's original pairs"}
    </button>
    <div id={rawId}>
      {showRaw && <section aria-label="Selected moment original paired evidence">
        <p>Exact original local-file lines, including their LF; not generated debugger commands.
          This list is limited to the selected moment. Do not replay identifiers or revisions in another session.</p>
        <label>Selected moment original pair
          <select aria-label="Selected moment original pair" value={pairIndex}
            onChange={event => setPairIndex(Number(event.target.value))}>
            {pairs.map((item, index) => <option key={item.requestId} value={index}>
              Line {item.line}, request {item.requestId} — {item.role}
            </option>)}
          </select>
        </label>
        <pre tabIndex={0} aria-label="Original watchpoint request line"><code>{pair.requestUtf8}</code></pre>
        <pre tabIndex={0} aria-label="Original watchpoint response line"><code>{pair.responseUtf8}</code></pre>
      </section>}
    </div>
  </div>;
}

function ImportedObservation({ recording, names }: { recording: RecordedWatchpointData; names: [string, string] }) {
  const [moment, setMoment] = useState<Moment>("stop"), group = useId();
  return <div className="recorded-watchpoint-result">
    <p className="recorded-watchpoint-boundary">Caller-supplied / unverified. Bounded consistency checks are for presentation only,
      not capture admission, producer authentication, source authentication or execution authority.
      A recorded compiler_bundle_bound label remains an unverified input claim.</p>
    <dl className="recorded-watchpoint-facts" aria-label="Watchpoint recording byte provenance">
      <div><dt>Requests</dt><dd>{names[0]} · {recording.requestBytes} bytes<br /><code>{recording.requestSha256}</code></dd></div>
      <div><dt>Responses</dt><dd>{names[1]} · {recording.responseBytes} bytes<br /><code>{recording.responseSha256}</code></dd></div>
    </dl>
    <p>The SHA-256 values describe selected file bytes, not provenance authentication.
      All {recording.pairs.length} original pairs are retained; gaps between request IDs are not filled with invented events.</p>
    <fieldset className="recorded-watchpoint-selector">
      <legend>Select a recorded moment — no debugger action</legend>
      <ol>
        <li><label><input type="radio" name={group} value="registration" checked={moment === "registration"}
          onChange={() => setMoment("registration")} />Registration and earlier inventory</label></li>
        <li><label><input type="radio" name={group} value="stop" checked={moment === "stop"}
          onChange={() => setMoment("stop")} />Uncaptured watch stop</label></li>
        <li><label><input type="radio" name={group} value="checkpoint" checked={moment === "checkpoint"}
          onChange={() => setMoment("checkpoint")} />Separate later checkpoint and memory</label></li>
      </ol>
    </fieldset>
    <SelectedMoment key={moment} recording={recording} moment={moment} />
  </div>;
}

export function RecordedWatchpointObservation() {
  const id = useId();
  const requestInput = useRef<HTMLInputElement>(null), responseInput = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null), generation = useRef(0);
  const [files, setFiles] = useState<[File | null, File | null]>([null, null]);
  const [result, setResult] = useState<{ recording: RecordedWatchpointData; names: [string, string]; ticket: number } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const [message, setMessage] = useState("Choose paired local JSONL files. No watchpoint observation is displayed.");
  useEffect(() => () => { generation.current++; active.current?.abort(); }, []);

  function clearPending() {
    generation.current++; active.current?.abort(); active.current = null;
    setResult(null); setBusy(false); setError(false);
  }
  function choose(index: 0 | 1, file: File | null) {
    clearPending();
    setFiles(previous => index === 0 ? [file, previous[1]] : [previous[0], file]);
    setMessage("File selection changed. Previous observation cleared; import the selected pair.");
  }
  function cancel() {
    clearPending(); setMessage("Import cancelled. No prior observation is displayed.");
  }
  function reset() {
    clearPending(); setFiles([null, null]);
    if (requestInput.current) requestInput.current.value = "";
    if (responseInput.current) responseInput.current.value = "";
    setMessage("Reset complete. Local selections and observations were cleared.");
    requestInput.current?.focus();
  }
  async function startImport() {
    if (!files[0] || !files[1]) return;
    clearPending();
    const selected: [File, File] = [files[0], files[1]];
    const controller = new AbortController(), ticket = generation.current;
    active.current = controller; setBusy(true); setMessage("Reading and checking local watchpoint pairs…");
    try {
      const requests = await readWatchpointFile(selected[0], controller.signal);
      const responses = await readWatchpointFile(selected[1], controller.signal);
      const recording = await importRecordedWatchpoint(requests, responses, controller.signal);
      if (controller.signal.aborted || ticket !== generation.current) return;
      setResult({ recording, names: [selected[0].name.slice(0, 120), selected[1].name.slice(0, 120)], ticket });
      setMessage("Imported locally. Select each recorded moment explicitly; no debugger commands are sent.");
    } catch (failure) {
      if (controller.signal.aborted || ticket !== generation.current) return;
      setError(true);
      setMessage("Import refused. " + (failure instanceof Error ? failure.message.slice(0, 384) : "Unsupported recording."));
    } finally {
      if (ticket === generation.current) { active.current = null; setBusy(false); }
    }
  }
  return <section className="recorded-watchpoint-observation" aria-label="Local recorded watchpoint observation" aria-busy={busy}>
    <h3>Inspect a recorded watchpoint stop</h3>
    <p>Select paired local JSONL files. Files stay in page memory: no upload, network request, storage write,
      debugger command, compiler action or GPU execution is performed.</p>
    <p>This bounded seven-pair excerpt records registration, an uncaptured watch stop and a separate later captured checkpoint.
      A stop can be exact while its bytes, scope and source remain unavailable.</p>
    <p>Limits: {WATCHPOINT_IMPORT_LIMITS.fileBytes / 1024} KiB per file,
      {" "}{WATCHPOINT_IMPORT_LIMITS.lineBytes / 1024} KiB per line and exactly {WATCHPOINT_IMPORT_LIMITS.pairs} pairs.
      Full sessions and other command sequences are not supported.</p>
    <div className="recorded-watchpoint-files">
      <label htmlFor={id + "-requests"}>Watchpoint requests JSONL
        <input ref={requestInput} id={id + "-requests"} type="file" accept=".jsonl,.ndjson,application/x-ndjson,application/json"
          onChange={event => choose(0, event.target.files?.[0] ?? null)} />
      </label>
      <label htmlFor={id + "-responses"}>Watchpoint responses JSONL
        <input ref={responseInput} id={id + "-responses"} type="file" accept=".jsonl,.ndjson,application/x-ndjson,application/json"
          onChange={event => choose(1, event.target.files?.[0] ?? null)} />
      </label>
    </div>
    <div className="recorded-watchpoint-actions">
      <button type="button" disabled={busy || !files[0] || !files[1]} onClick={() => void startImport()}>Import watchpoint observation</button>
      <button type="button" disabled={!busy} onClick={cancel}>Cancel watchpoint import</button>
      <button type="button" onClick={reset}>Reset watchpoint observation</button>
    </div>
    <p role={error ? "alert" : "status"}>{message}</p>
    {result && <ImportedObservation key={result.ticket} recording={result.recording} names={result.names} />}
    <p>Logical CPU observations only. Physical registers, live memory, GPU timing and performance prediction remain unavailable.
      Browsing a recorded moment never resumes a debugger, registers a watchpoint, reads live memory, or edits source.</p>
  </section>;
}
