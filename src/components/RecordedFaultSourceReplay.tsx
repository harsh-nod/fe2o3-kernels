import { useEffect, useId, useRef, useState } from "react";
import { FAULT_SOURCE_FILES, FAULT_SOURCE_LIMITS, importFaultSourceReplay,
  type FaultSourceFileRole, type FaultSourceFiles, type FaultSourceMoment, type FaultSourceReplay } from "../content/recorded-fault-source-replay";
import { readResourceImportFile } from "../content/recorded-resource-import";
import { projectResourcePointerMemoryNavigation, type ResourcePointerMemoryFocus } from "../content/resource-pointer-memory-navigation";
import { ResourceCheckpointValuesView } from "./ResourceCheckpointValuesView";
import { ResourceSourceValuesView } from "./ResourceSourceValuesView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import { ResourceMemoryComparisonView } from "./ResourceMemoryComparisonView";
import "./RecordedFaultSourceReplay.css";

const MOMENTS: readonly { value: FaultSourceMoment; label: string }[] = [
  { value: "fault", label: "Terminal fault — values unavailable" },
  { value: "prior", label: "Prior captured checkpoint" },
  { value: "repeat", label: "Repeated prior checkpoint" },
  { value: "completed", label: "Final failed completion — values unavailable" },
];
function SelectedMoment({ replay, moment }: { replay: FaultSourceReplay; moment: FaultSourceMoment }) {
  const [rawIndex, setRawIndex] = useState(0), [memoryIndex, setMemoryIndex] = useState(0);
  const [focus, setFocus] = useState<ResourcePointerMemoryFocus | null>(null), [pointerNotice, setPointerNotice] = useState("");
  const selection = useRef(0);
  const pairs = replay.momentPairs[moment], pair = pairs[rawIndex] ?? pairs[0];
  const checkpoint = moment === "prior" ? replay.recording.checkpoints[0]
    : moment === "repeat" ? replay.recording.checkpoints[1] : null;
  const session = pairs[0].response.session as { cursor: { event_sequence: number; state_revision: number } };
  const memory = checkpoint?.memories[memoryIndex];
  function selectPointer(valueKey: string) {
    if (!checkpoint) return;
    const result = projectResourcePointerMemoryNavigation(replay.recording, checkpoint, valueKey, ++selection.current);
    setFocus(null);
    if (result.status === "ready") {
      setMemoryIndex(result.memoryIndex); setFocus(result.focus);
      setPointerNotice("Selected the already-retained byte at this exact checkpoint. This is not a dereference or fault-range attribution.");
    } else setPointerNotice(result.detail);
  }
  return <section className="fault-source-moment" aria-label="Selected fault/source moment" data-moment={moment}>
    <h4>{MOMENTS.find(item => item.value === moment)!.label}</h4>
    <p data-testid="fault-source-selected-anchor">Event {session.cursor.event_sequence}; revision {session.cursor.state_revision}.
      {checkpoint && <> Logical lane 0; work-item [0, 0, 0].</>}</p>
    {!checkpoint ? <>
      <p>{moment === "fault" ? "The debugger recorded an exact Fault / Failed stop."
        : "A recorded continue at the same terminal event changed the stop to Completed / Failed with a new revision and zero advanced events."}</p>
      <p className="fault-source-boundary">Source variables, SSA values, stack and memory are unavailable at this terminal cursor.
        No prior values, source location, lane, failed-read range or memory snapshot are substituted.</p>
      <ul><li>Stack: unavailable / not_captured.</li><li>SSA: unavailable / not_captured.</li>
        <li>Source variables: unavailable / checkpoint_not_captured.</li><li>Memory: unavailable / not_captured.</li></ul>
    </> : <>
      <p>A retained reverse operation step reached this earlier captured checkpoint.
        Selecting this radio does not execute a debugger command.
        {moment === "repeat" && <> Its event, source span, source rows, SSA rows, stack and all three memory windows
          match the first retained checkpoint; its revision is fresh and each opaque source-page cursor remains exactly as recorded.</>}</p>
      <p>The source span and bindings are retained observations. No Rust source body was imported or fetched.
        This panel cannot independently establish the operation kind from these four files.</p>
      <ResourceSourceValuesView checkpoint={checkpoint} stackPair={checkpoint.sourceStack ?? null} sourcePages={checkpoint.sourceVariables ?? []} />
      <ResourceCheckpointValuesView checkpoint={checkpoint} onPointerSelect={selectPointer} />
      <p>Source names and SSA ordinals are separate; no name-to-SSA mapping is inferred.
        Source-binding value generations are not allocation lifetime generations.
        Frame 1 is static stack depth, not a dynamic activation identifier; resource generation zero does not establish reuse.</p>
      <label>Memory window at selected checkpoint
        <select aria-label="Memory window at selected checkpoint" value={memoryIndex}
          onChange={event => { setMemoryIndex(Number(event.target.value)); setFocus(null); setPointerNotice(""); }}>
          {checkpoint.memories.map((item, index) => <option key={item.requestId} value={index}>Retained memory request {item.requestId}</option>)}
        </select>
      </label>
      <p role="status" aria-live="polite">{pointerNotice}</p>
      {memory && <>
        <ResourceMemoryView key={memory.requestId} response={memory.response} expectedSnapshot={checkpoint.anchor}
          memoryContext={replay.recording.context} navigationFocus={focus ?? undefined}
          title="Prior-checkpoint storage and initialization only" />
        <ResourceMemoryComparisonView recording={replay.recording} checkpoint={checkpoint} memory={memory} />
      </>}
      <p>Initialization bits describe retained storage, not a typed terminal fault range.
        The uninitialized byte is not a valid program value. No failed-read event or writer attribution is invented.</p>
      {moment === "repeat" && <p>Retained stale SSA request {replay.stalePair.requestId} used the first checkpoint revision:
        error / stale_revision, state_changed=false. It supplied no values and left this repeated checkpoint unchanged.</p>}
    </>}
    <details><summary>Selected moment original pairs</summary>
      <p>Exact original local JSONL lines including LF. These are read-only records, not reusable session handles.</p>
      <label>Original pair for selected fault moment
        <select aria-label="Original pair for selected fault moment" value={rawIndex} onChange={event => setRawIndex(Number(event.target.value))}>
          {pairs.map((item, index) => <option key={item.requestId} value={index}>Request {item.requestId} — {String(item.request.operation)}</option>)}
        </select>
      </label>
      <pre tabIndex={0} aria-label="Original fault/source request line">{pair.requestUtf8}</pre>
      <pre tabIndex={0} aria-label="Original fault/source response line">{pair.responseUtf8}</pre>
    </details>
  </section>;
}
function Imported({ replay }: { replay: FaultSourceReplay }) {
  const [moment, setMoment] = useState<FaultSourceMoment>("fault"), group = useId();
  return <div className="fault-source-result">
    <p className="fault-source-boundary">Caller-supplied / unverified. This panel checks four selected files and a structurally
      validated retained subset, not the complete capture run, source authenticity, compiler closure, proof admission or execution authority.
      CPU observations only; no hardware execution or performance prediction.</p>
    <section aria-label="Separate standalone diagnostic" className="fault-source-diagnostic">
      <h4>Separate standalone execution</h4>
      <p>The simulator diagnostic has kind execution_uninitialized_read. Its original stderr bytes match the selected receipt,
        but it came from a separate execution, not this debugger terminal query.
        Its raw block ordinal is not equated with canonical debugger block numbering.</p>
      <p>No structured terminal allocation range is supplied. The prose message is not parsed into a memory selection or overlay.</p>
      <details><summary>Original standalone diagnostic</summary>
        <pre tabIndex={0} aria-label="Original standalone diagnostic bytes">{replay.diagnosticUtf8}</pre>
      </details>
    </section>
    <fieldset><legend>Select one retained moment — no debugger action</legend>
      {MOMENTS.map(item => <label key={item.value}><input type="radio" name={group} checked={moment === item.value}
        value={item.value} onChange={() => setMoment(item.value)} />{item.label}</label>)}
    </fieldset>
    <SelectedMoment key={moment} replay={replay} moment={moment} />
    <details><summary>Selected file hashes and receipt</summary>
      <dl className="fault-source-file-facts">{replay.files.map(file => <div key={file.role}>
        <dt>{FAULT_SOURCE_FILES.find(spec => spec.role === file.role)!.label}</dt>
        <dd>{file.leaf}; {file.bytes} bytes<br /><code>{file.sha256}</code></dd>
      </div>)}</dl>
      <p>The receipt is caller-supplied. Its positive-result, bundle, source, request-input, tool, compiler-scratch and other stage-output
        claims are not independently verified here: those artifacts were not imported. Consistent hashes do not authenticate their producer.
        No referenced paths are fetched or commands executed.</p>
      <p>All 44 original pairs are validated. The resource views receive exactly 18 original successful pairs; the existing importer
        is unchanged. All terminal refusals, repeated terminal transitions and the stale query remain checked in the full-session adapter.</p>
      <pre tabIndex={0} aria-label="Original fault/source receipt">{replay.receiptUtf8}</pre>
    </details>
  </div>;
}
export function RecordedFaultSourceReplay() {
  const [files, setFiles] = useState<Partial<Record<FaultSourceFileRole, File>>>({});
  const [replay, setReplay] = useState<FaultSourceReplay | null>(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null), generation = useRef(0);
  const inputs = useRef<Partial<Record<FaultSourceFileRole, HTMLInputElement | null>>>({});
  const heading = useId();
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  function clearResult() {
    generation.current++; controller.current?.abort(); controller.current = null;
    setReplay(null); setBusy(false); setNotice("");
  }
  function replace(role: FaultSourceFileRole, file?: File) {
    clearResult(); setFiles(previous => ({ ...previous, [role]: file }));
  }
  function reset() {
    clearResult(); setFiles({});
    Object.values(inputs.current).forEach(input => { if (input) input.value = ""; });
    inputs.current.receipt?.focus();
  }
  async function importFiles() {
    clearResult();
    const current = generation.current, aborter = new AbortController(); controller.current = aborter;
    setBusy(true);
    try {
      const selected = FAULT_SOURCE_FILES.map(spec => ({ spec, file: files[spec.role] }));
      if (selected.some(({ spec, file }) => !file || file.size < 1 || file.size > spec.limit) ||
        selected.reduce((sum, { file }) => sum + (file?.size ?? 0), 0) > FAULT_SOURCE_LIMITS.totalBytes)
        throw new Error("Select all four bounded files; the complete selection must be at most 1 MiB.");
      const contents = {} as Record<FaultSourceFileRole, string>;
      for (const { spec, file } of selected) contents[spec.role] = await readResourceImportFile(file!, aborter.signal);
      const result = await importFaultSourceReplay(contents as FaultSourceFiles, aborter.signal);
      if (current === generation.current && !aborter.signal.aborted) {
        setReplay(result); setNotice("Imported consistent retained files; full-run claims and provenance remain unverified.");
      }
    } catch (error) {
      if (current === generation.current && !aborter.signal.aborted)
        setNotice(error instanceof Error ? error.message : "Could not import this local recording.");
    } finally {
      if (current === generation.current) { setBusy(false); controller.current = null; }
    }
  }
  function cancel() { clearResult(); setNotice("Import cancelled. No prior values remain displayed."); }
  return <section className="recorded-fault-source" aria-labelledby={heading}>
    <h3 id={heading}>Recorded fault and prior-checkpoint replay</h3>
    <p>Import four original R3-profile files. Nothing is uploaded, fetched, persisted or executed.
      This local view keeps an uncaptured terminal separate from earlier captured source, SSA and storage.</p>
    <div className="fault-source-inputs">{FAULT_SOURCE_FILES.map(spec => <label key={spec.role}>
      {spec.label}<input type="file" accept=".json,.jsonl,.stderr,application/json,application/x-ndjson,text/plain"
        ref={node => { inputs.current[spec.role] = node; }} onChange={event => replace(spec.role, event.target.files?.[0])} />
      <small>At most {spec.limit / 1024} KiB.</small>
    </label>)}</div>
    <div className="fault-source-actions">
      <button type="button" onClick={() => void importFiles()} disabled={busy || FAULT_SOURCE_FILES.some(spec => !files[spec.role])}>Import fault/source recording</button>
      <button type="button" onClick={cancel} disabled={!busy}>Cancel fault/source import</button>
      <button type="button" onClick={reset}>Reset fault/source files</button>
    </div>
    <p role="status" aria-live="polite">{busy ? "Reading and validating bounded local files…" : notice}</p>
    {replay && <Imported replay={replay} />}
  </section>;
}
