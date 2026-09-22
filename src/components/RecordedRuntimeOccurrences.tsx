import { useEffect, useId, useRef, useState } from "react";
import {
  importRecordedRuntimeOccurrences, RUNTIME_OCCURRENCE_LIMITS,
  type RecordedRuntimeOccurrences as Recording, type RuntimeOccurrenceCase,
  type RuntimeOccurrenceCoordinate, type RuntimeOccurrenceRow, type RuntimeOccurrencePhase,
} from "../content/recorded-runtime-occurrences";
import { RUNTIME_OCCURRENCE_REFERENCE } from "../content/recorded-runtime-occurrence-reference";
import "./RecordedRuntimeOccurrences.css";

function readLocalReport(file: File, signal: AbortSignal): Promise<string> {
  if (signal.aborted) return Promise.reject(new DOMException("Import cancelled.", "AbortError"));
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > RUNTIME_OCCURRENCE_LIMITS.reportBytes)
    return Promise.reject(new Error("The nonempty report must be at most 512 KiB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let finished = false;
    function cleanup() {
      signal.removeEventListener("abort", cancel);
      reader.onload = reader.onerror = reader.onabort = null;
    }
    function fail(error: unknown) {
      if (!finished) { finished = true; cleanup(); reject(error); }
    }
    function cancel() {
      fail(new DOMException("Import cancelled.", "AbortError"));
      if (reader.readyState === FileReader.LOADING) reader.abort();
    }
    reader.onerror = () => fail(new Error("The local report could not be read."));
    reader.onabort = () => fail(new DOMException("Import cancelled.", "AbortError"));
    reader.onload = () => {
      try {
        if (signal.aborted) throw new DOMException("Import cancelled.", "AbortError");
        if (!(reader.result instanceof ArrayBuffer) || reader.result.byteLength !== file.size)
          throw new Error("The report was not read completely.");
        const bytes = new Uint8Array(reader.result);
        if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
          throw new Error("A UTF-8 BOM is unsupported.");
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        if (new TextEncoder().encode(text).byteLength !== file.size)
          throw new Error("The UTF-8 bytes did not round-trip.");
        finished = true; cleanup(); resolve(text);
      } catch (error) { fail(error); }
    };
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    try { reader.readAsArrayBuffer(file); } catch (error) { fail(error); }
  });
}
const coordinate = (site: RuntimeOccurrenceCoordinate) => site.join(" / ");
const hex = (value: number) => "0x" + value.toString(16).padStart(8, "0");
const phaseName: Record<RuntimeOccurrencePhase, string> = {
  before_operation: "Before operation", after_operation: "After operation", write_committed: "Write committed",
};
function authoringCoordinate(recording: Recording, row: RuntimeOccurrenceRow) {
  const same = (site: RuntimeOccurrenceCoordinate) => site.every((value, index) => value === row.site[index]);
  if (same(recording.topology.callSite)) return recording.topology.callAuthoringCoordinate;
  const helper = recording.topology.helperSites.findIndex(same);
  return helper < 0 ? null : recording.topology.helperAuthoringCoordinates[helper];
}

function RowView({ recording, selected, row }: {
  recording: Recording; selected: RuntimeOccurrenceCase; row: RuntimeOccurrenceRow;
}) {
  const [projection, setProjection] = useState(false);
  const id = useId(), mapped = authoringCoordinate(recording, row);
  return <section className="runtime-occurrence-row" aria-label="Selected recorded row">
    <h4>Selected recorded row</h4>
    <p>Case {selected.index} · rounds {selected.rounds} · {selected.schedule}. Report-local coordinates only.</p>
    <dl className="runtime-occurrence-facts" aria-label="Selected row facts">
      <div><dt>Original row ordinal</dt><dd>{row.ordinal}</dd></div>
      <div><dt>Phase</dt><dd>{phaseName[row.phase]}</dd></div>
      <div><dt>Logical invocation</dt><dd>{row.invocation} — not a physical lane</dd></div>
      <div><dt>Schedule decision</dt><dd>{row.decision} — not GPU time</dd></div>
      <div><dt>Activation / attempt</dt><dd>{row.activation} / {row.attempt}</dd></div>
      <div><dt>Runtime coordinate</dt><dd>{coordinate(row.site)}<br />function / raw BlockId / operation</dd></div>
      <div><dt>Authoring roster coordinate</dt><dd>{mapped ? coordinate(mapped) : "Unavailable — no recorded site mapping"}
        <br />function / block-roster index / operation</dd></div>
      <div><dt>Committed write scalar</dt><dd>{row.committedWrite
        ? hex(row.committedWrite.u32Bits) + " at allocation " + row.committedWrite.allocation +
          ", byte offset " + row.committedWrite.byteOffset
        : "Unavailable for this phase — no write row"}</dd></div>
    </dl>
    <p className="runtime-occurrence-boundary">A write scalar is not a checkpoint or memory snapshot.
      Source spans, full call stacks and physical registers are unavailable.</p>
    <button type="button" aria-expanded={projection} aria-controls={id}
      onClick={() => setProjection(value => !value)}>
      {projection ? "Hide selected row projection" : "Show selected row projection"}
    </button>
    <div id={id}>{projection && <>
      <p>Generated selected-row projection, not the original file bytes or a debugger command.</p>
      <pre tabIndex={0} aria-label="Selected row projection"><code>{JSON.stringify({
        caseIndex: selected.index, rounds: selected.rounds, schedule: selected.schedule,
        row, authoringRosterCoordinate: mapped,
      }, null, 2)}</code></pre>
    </>}</div>
  </section>;
}

function InvocationView({ recording, selected, invocation }: {
  recording: Recording; selected: RuntimeOccurrenceCase; invocation: number;
}) {
  const [activation, setActivation] = useState("all"), [attempt, setAttempt] = useState("all");
  const [phase, setPhase] = useState("all"), [position, setPosition] = useState(0);
  const helpers = selected.helpers.filter(item => item.invocation === invocation);
  const helper = helpers.find(item => String(item.activation) === activation);
  const attempts = selected.attempts.filter(item => item.invocation === invocation &&
    (activation === "all" || item.activation === Number(activation)));
  const chosenAttempt = attempts.find(item => item.key === attempt);
  const rows = selected.rows.filter(row => row.invocation === invocation &&
    (activation === "all" || row.activation === Number(activation)) &&
    (attempt === "all" || (chosenAttempt && row.activation === chosenAttempt.activation && row.attempt === chosenAttempt.attempt)) &&
    (phase === "all" || row.phase === phase));
  const row = rows[position];
  return <div className="runtime-occurrence-selection">
    <p aria-label="Helper occurrence count">{helpers.length} helper activations for this invocation.
      {helpers.length === 0 && " No helper activation was recorded in this zero-round case."}</p>
    {helper && <p aria-label="Selected helper caller interval">Helper activation {helper.activation} occupies
      recorded rows {helper.firstRow} through {helper.lastRow}, inside caller rows {helper.callBeforeRow} through {helper.callAfterRow}.
      This recorded interval is not a full call stack or an authenticated frame ID.</p>}
    <div className="runtime-occurrence-controls">
      <label>Activation (report-local)
        <select value={activation} onChange={event => { setActivation(event.target.value); setAttempt("all"); setPosition(0); }}>
          <option value="all">All recorded activations</option>
          <option value="1">Root activation 1</option>
          {helpers.map(helper => <option key={helper.key} value={helper.activation}>
            Helper activation {helper.activation}
          </option>)}
        </select>
      </label>
      <label>Operation attempt (report-local)
        <select value={attempt} onChange={event => { setAttempt(event.target.value); setPosition(0); }}>
          <option value="all">All recorded attempts</option>
          {attempts.map(item => <option key={item.key} value={item.key}>
            Activation {item.activation}, attempt {item.attempt} — {coordinate(item.site)}
          </option>)}
        </select>
      </label>
      <label>Recorded row phase
        <select value={phase} onChange={event => { setPhase(event.target.value); setPosition(0); }}>
          <option value="all">All recorded phases</option>
          {Object.entries(phaseName).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </div>
    <div className="runtime-occurrence-actions" aria-label="Recorded row scrubber">
      <button type="button" disabled={!row || position === 0} onClick={() => setPosition(value => value - 1)}>Previous recorded row</button>
      <button type="button" disabled={!row || position + 1 >= rows.length} onClick={() => setPosition(value => value + 1)}>Next recorded row</button>
    </div>
    <p aria-live="polite" aria-label="Filtered row count">{rows.length === 0 ? "No recorded row matches these exact filters."
      : "Filtered row " + (position + 1) + " of " + rows.length + "; original ordinal " + row.ordinal + "."}</p>
    {rows.length > 0 && <label>Filtered row position
      <input type="range" min={0} max={rows.length - 1} value={position}
        onChange={event => setPosition(Number(event.target.value))} />
    </label>}
    {row && <RowView key={row.key} recording={recording} selected={selected} row={row} />}
  </div>;
}
function CaseView({ recording, selected }: { recording: Recording; selected: RuntimeOccurrenceCase }) {
  const [invocation, setInvocation] = useState(0);
  return <section className="runtime-occurrence-case" aria-label="Selected recorded case">
    <h4>Case {selected.index}: rounds {selected.rounds}, {selected.schedule}</h4>
    <p>{selected.rows.length} recorded rows; {selected.helpers.length} helper activations across four logical invocations.
      Reported final expected word: {hex(selected.expectedWord)}. This is not the value of every row.</p>
    <label>Logical invocation (report-local)
      <select value={invocation} onChange={event => setInvocation(Number(event.target.value))}>
        {[0, 1, 2, 3].map(value => <option key={value} value={value}>Logical invocation {value}</option>)}
      </select>
    </label>
    <InvocationView key={invocation} recording={recording} selected={selected} invocation={invocation} />
  </section>;
}
function ImportedRecording({ recording, name }: { recording: Recording; name: string }) {
  const [caseIndex, setCaseIndex] = useState(0), [raw, setRaw] = useState(false);
  const rawId = useId(), selected = recording.cases[caseIndex];
  return <div className="runtime-occurrence-result">
    <p className="runtime-occurrence-boundary">Caller-supplied / unverified. Exact file-byte agreement is not source authentication,
      replay, debugger-session identity, compiler-resume permission or hardware qualification.</p>
    <dl className="runtime-occurrence-provenance" aria-label="Runtime occurrence byte provenance">
      <div><dt>Selected file</dt><dd>{name} · {recording.reportBytes} bytes</dd></div>
      <div><dt>Report SHA-256</dt><dd><code>{recording.reportSha256}</code></dd></div>
      <div><dt>Referenced bundle SHA-256</dt><dd><code>{recording.bundleSha256}</code></dd></div>
    </dl>
    <p>Runtime call coordinate: <strong>{coordinate(recording.topology.callSite)}</strong> (function / raw BlockId / operation).
      Authoring call coordinate: <strong>{coordinate(recording.topology.callAuthoringCoordinate)}</strong> (function / block-roster index / operation).
      These domains are distinct, not source spans.</p>
    <label>Recorded occurrence case
      <select value={caseIndex} onChange={event => { setCaseIndex(Number(event.target.value)); setRaw(false); }}>
        {recording.cases.map(item => <option key={item.key} value={item.index}>
          Case {item.index}: rounds {item.rounds}, {item.schedule}
        </option>)}
      </select>
    </label>
    <CaseView key={selected.key} recording={recording} selected={selected} />
    <section aria-label="Unavailable occurrence facts" className="runtime-occurrence-boundary">
      <h4>Unavailable, not inferred</h4>
      <p>Source spans; source-to-SSA ownership; full call stacks; checkpoint bytes; complete memory snapshots;
        physical lanes and registers; GPU time; performance predictions; authenticated session IDs.</p>
      <p>Opt-out equality is a producer-reported claim only. Opt-out rows are absent; this viewer does not replay
        execution or independently verify that comparison.</p>
    </section>
    <button type="button" aria-expanded={raw} aria-controls={rawId} onClick={() => setRaw(value => !value)}>
      {raw ? "Hide original occurrence report" : "Show original occurrence report"}
    </button>
    <div id={rawId}>{raw && <section aria-label="Original occurrence report bytes">
      <p>Full original local JSON text, including its retained whitespace. Not a generated projection or replay input.</p>
      <pre tabIndex={0} aria-label="Original occurrence report"><code>{recording.rawUtf8}</code></pre>
    </section>}</div>
  </div>;
}

export function RecordedRuntimeOccurrences() {
  const id = useId(), input = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null), generation = useRef(0);
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("Choose a local JSON report. No runtime occurrence is displayed.");
  const [result, setResult] = useState<{ recording: Recording; name: string; ticket: number } | null>(null);
  useEffect(() => () => { generation.current++; active.current?.abort(); }, []);
  function clear() {
    generation.current++; active.current?.abort(); active.current = null;
    setResult(null); setBusy(false); setError(false);
  }
  function reset() {
    clear(); setFile(null); if (input.current) input.current.value = "";
    setMessage("Reset complete. Local selections and occurrences were cleared."); input.current?.focus();
  }
  async function startImport() {
    if (!file) return;
    const selected = file;
    clear();
    const controller = new AbortController(), ticket = generation.current;
    active.current = controller; setBusy(true); setMessage("Reading and checking the local occurrence report…");
    try {
      const text = await readLocalReport(selected, controller.signal);
      const recording = await importRecordedRuntimeOccurrences(text, RUNTIME_OCCURRENCE_REFERENCE, controller.signal);
      if (controller.signal.aborted || ticket !== generation.current) return;
      setResult({ recording, name: selected.name.slice(0, 120), ticket });
      setMessage("Imported locally. Browsing recorded rows sends no debugger commands.");
    } catch (failure) {
      if (controller.signal.aborted || ticket !== generation.current) return;
      setError(true);
      setMessage("Import refused. " + (failure instanceof Error ? failure.message.slice(0, 384) : "Unsupported report."));
    } finally {
      if (ticket === generation.current) { active.current = null; setBusy(false); }
    }
  }
  return <section className="recorded-runtime-occurrences" aria-label="Local recorded runtime occurrences" aria-busy={busy}>
    <h3>Inspect recorded runtime occurrences</h3>
    <p>One retained six-case CPU lab profile: rounds 0, 1 and 3 under canonical and seeded_71 schedules.
      Select its local JSON report, at most 512 KiB. Other reports are not supported.</p>
    <p>Files stay in page memory. No network request, storage write, live debugger command, compilation or GPU execution occurs.</p>
    <label htmlFor={id}>Occurrence report JSON
      <input id={id} ref={input} type="file" accept=".json,application/json"
        onChange={event => { clear(); setFile(event.target.files?.[0] ?? null);
          setMessage("Selection changed. Previous occurrences cleared; import the selected report."); }} />
    </label>
    <div className="runtime-occurrence-actions">
      <button type="button" disabled={busy || !file} onClick={() => void startImport()}>Import recorded occurrences</button>
      <button type="button" disabled={!busy} onClick={() => { clear(); setMessage("Import cancelled. No prior occurrence is displayed."); }}>Cancel occurrence import</button>
      <button type="button" onClick={reset}>Reset recorded occurrences</button>
    </div>
    <p role={error ? "alert" : "status"}>{message}</p>
    {result && <ImportedRecording key={result.ticket} recording={result.recording} name={result.name} />}
  </section>;
}
