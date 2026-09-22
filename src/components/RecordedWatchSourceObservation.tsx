import { useEffect, useId, useRef, useState } from "react";
import {
  importWatchSourceObservation, readWatchSourceFile, WATCH_SOURCE_FILES, WATCH_SOURCE_LIMITS,
  type WatchSourceFileRole, type WatchSourceFiles, type WatchSourceMoment, type WatchSourceObservation,
} from "../content/recorded-watch-source-observation";
import { ResourceCheckpointValuesView } from "./ResourceCheckpointValuesView";
import { ResourceSourceValuesView } from "./ResourceSourceValuesView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import "./RecordedWatchSourceObservation.css";

const MOMENTS: readonly { value: WatchSourceMoment; label: string }[] = [
  { value: "stop", label: "Uncaptured watch stop — scope unavailable" },
  { value: "immediate", label: "Immediate post-write checkpoint — lane 0, source unavailable" },
  { value: "post", label: "Later source checkpoint — lane 1" },
  { value: "reverse", label: "Reverse pre-write checkpoint — lane 0" },
  { value: "repeat", label: "Repeated later source checkpoint — lane 1" },
];
function SelectedMoment({ observation, moment }: { observation: WatchSourceObservation; moment: WatchSourceMoment }) {
  const [pairIndex, setPairIndex] = useState(0);
  const pairs = observation.momentPairs[moment], pair = pairs[pairIndex] ?? pairs[0];
  const index = moment === "post" ? 0 : moment === "reverse" ? 1 : 2;
  const checkpoint = moment === "stop" ? null : moment === "immediate" ? observation.immediate : observation.source.checkpoints[index];
  const memory = moment === "immediate" ? observation.watchpoint.memory.pair : checkpoint?.memories[0];
  const sessionCursor = moment === "stop" ? observation.watchpoint.stop.cursor : checkpoint!.anchor.cursor;
  return <section className="watch-source-moment" aria-label="Selected watch/source moment" data-moment={moment}>
    <h4>{MOMENTS.find(item => item.value === moment)!.label}</h4>
    <p data-testid="watch-source-selected-anchor">Event {sessionCursor.event_sequence}; revision {sessionCursor.state_revision}.
      {checkpoint?.anchor.scope.level === "lane" && <> Logical lane {checkpoint.anchor.scope.lane};
        work-item [{checkpoint.anchor.scope.logical_workitem?.join(", ") ?? "unavailable"}].</>}</p>
    {moment === "stop" ? <>
      <p>Watchpoint request {observation.watchpoint.stop.pair.requestId} stopped exactly, but its snapshot was not captured.
        Source query {observation.watchSourceRefusal.requestId}: unavailable / checkpoint_not_captured.</p>
      <p className="watch-source-boundary">Source variables, SSA values, memory, source location, frame and logical scope
        are unavailable at this stop. No lane or values are inferred from adjacent checkpoints.</p>
    </> : <>
      {moment === "immediate" ? <>
        <p>One recorded forward operation step reached this distinct lane-0 checkpoint.
          Source query {observation.immediateSourceRefusal.requestId}: unavailable / checkpoint_not_captured.
          Its retained stack has no next_operation; no source-variable table can be supplied.</p>
        <p>SSA and memory below belong only to this immediate captured checkpoint, not to the uncaptured watch stop.</p>
      </> : <>
        <p>{moment === "post" ? "One recorded forward operation step" : moment === "reverse"
          ? "Two recorded reverse operation steps" : "Two recorded forward operation steps"} reached this independent checkpoint.
          These controls are retained evidence; selecting a radio button does not execute them.</p>
        <p>{moment === "reverse" ? "This lane-0 pre-write memory window precedes the watched write."
          : "This is the next logical invocation, lane 1, before its first operation. The global memory window still contains only the earlier lane-0 write."}
          {" "}This is not a shared checkpoint with the watch stop or immediate post-write moment.</p>
        <ResourceSourceValuesView checkpoint={checkpoint!} stackPair={checkpoint!.sourceStack ?? null}
          sourcePages={checkpoint!.sourceVariables ?? []} />
      </>}
      <ResourceCheckpointValuesView checkpoint={checkpoint!} />
      {memory && <ResourceMemoryView response={memory.response} expectedSnapshot={checkpoint!.anchor}
        memoryContext={moment === "immediate" ? observation.watchpoint.context : observation.source.context}
        title="Global bytes at this selected checkpoint only" />}
      <p>Source names and SSA ordinals are separate observations; equal scalar bits do not establish a mapping.
        Frame 1 is static stack depth, not a dynamic activation identifier. The retained occurrence value is not an invocation counter.</p>
    </>}
    <details>
      <summary>Selected moment original pairs</summary>
      <p>Original local-file lines, with their LF preserved. They are not executable controls or reusable session handles.</p>
      <label>Original pair for selected moment
        <select aria-label="Original pair for selected moment" value={pairIndex}
          onChange={event => setPairIndex(Number(event.target.value))}>
          {pairs.map((p, i) => <option value={i} key={p.requestId}>Request {p.requestId} — {String(p.request.operation)}</option>)}
        </select>
      </label>
      <pre tabIndex={0} aria-label="Original watch/source request line">{pair.requestUtf8}</pre>
      <pre tabIndex={0} aria-label="Original watch/source response line">{pair.responseUtf8}</pre>
    </details>
  </section>;
}
function Imported({ observation }: { observation: WatchSourceObservation }) {
  const [moment, setMoment] = useState<WatchSourceMoment>("stop"), group = useId();
  return <div className="watch-source-result">
    <p className="watch-source-boundary">Caller-supplied / unverified. Hashes and exact transcript joins establish local-file consistency only,
      not producer or source authentication, runtime closure, proof admission or execution authority.
      CPU simulation only; no hardware observation or performance prediction.</p>
    <p>Two source refusals and three distinct source checkpoints share one retained full session.
      The seven-pair watchpoint profile is unchanged. Frame depth is not dynamic identity; allocation reuse and source-to-SSA mapping are not supplied.</p>
    <fieldset><legend>Select one recorded moment — no debugger action</legend>
      {MOMENTS.map(item => <label key={item.value}><input type="radio" name={group} value={item.value}
        checked={moment === item.value} onChange={() => setMoment(item.value)} />{item.label}</label>)}
    </fieldset>
    <SelectedMoment key={moment} observation={observation} moment={moment} />
    <details><summary>Selected file hashes and receipt</summary>
      <dl className="watch-source-file-facts">{observation.files.map(file => <div key={file.role}>
        <dt>{WATCH_SOURCE_FILES.find(f => f.role === file.role)!.label}</dt>
        <dd>{file.leaf}; {file.bytes} bytes<br /><code>{file.sha256}</code></dd>
      </div>)}</dl>
      <p>The receipt itself is caller-supplied. Its independent-result, selected-input and stage-output claims are not verified
        by this panel; those referenced artifacts were not imported. No paths are fetched or commands executed.</p>
      <pre tabIndex={0} aria-label="Original watch/source receipt">{observation.receiptUtf8}</pre>
    </details>
  </div>;
}
export function RecordedWatchSourceObservation() {
  const [files, setFiles] = useState<Partial<Record<WatchSourceFileRole, File>>>({});
  const [observation, setObservation] = useState<WatchSourceObservation | null>(null);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null), generation = useRef(0);
  const inputs = useRef<Partial<Record<WatchSourceFileRole, HTMLInputElement | null>>>({});
  const heading = useId();
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  function clearResult() {
    generation.current++; controller.current?.abort(); controller.current = null;
    setBusy(false); setObservation(null); setNotice("");
  }
  function replace(role: WatchSourceFileRole, file?: File) {
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
      const selected = WATCH_SOURCE_FILES.map(spec => ({ spec, file: files[spec.role] }));
      if (selected.some(({ spec, file }) => !file || file.size < 1 || file.size > spec.limit) ||
        selected.reduce((sum, { file }) => sum + (file?.size ?? 0), 0) > WATCH_SOURCE_LIMITS.totalBytes)
        throw new Error("Select all seven bounded files; the complete selection must be at most 8 MiB.");
      const contents = {} as Record<WatchSourceFileRole, string>;
      for (const { spec, file } of selected) contents[spec.role] = await readWatchSourceFile(file!, spec.role, aborter.signal);
      const imported = await importWatchSourceObservation(contents as WatchSourceFiles, aborter.signal);
      if (current === generation.current && !aborter.signal.aborted) {
        setObservation(imported); setNotice("Imported consistent local files; all provenance remains unverified.");
      }
    } catch (error) {
      if (current === generation.current && !aborter.signal.aborted)
        setNotice(error instanceof Error ? error.message : "Could not import this local recording.");
    } finally {
      if (current === generation.current) { setBusy(false); controller.current = null; }
    }
  }
  function cancel() { clearResult(); setNotice("Import cancelled. No prior values remain displayed."); }
  return <section className="recorded-watch-source" aria-labelledby={heading}>
    <h3 id={heading}>Recorded watchpoint and source replay</h3>
    <p>Import seven local R2 files from one recorded CPU-debugger session. Nothing is uploaded, fetched, persisted or executed.
      Files must retain their exact original UTF-8 bytes. This separate profile does not change the existing watchpoint importer.</p>
    <div className="watch-source-inputs">{WATCH_SOURCE_FILES.map(spec => <label key={spec.role}>
      {spec.label}<input type="file" accept=".json,.jsonl,application/json,application/x-ndjson,text/plain"
        ref={node => { inputs.current[spec.role] = node; }}
        onChange={event => replace(spec.role, event.target.files?.[0])} />
      <small>At most {spec.limit / 1024} KiB.</small>
    </label>)}</div>
    <div className="watch-source-actions">
      <button type="button" onClick={() => void importFiles()} disabled={busy || WATCH_SOURCE_FILES.some(f => !files[f.role])}>
        Import watch/source recording</button>
      <button type="button" onClick={cancel} disabled={!busy}>Cancel watch/source import</button>
      <button type="button" onClick={reset}>Reset watch/source files</button>
    </div>
    <p role="status" aria-live="polite">{busy ? "Reading and validating bounded local files…" : notice}</p>
    {observation && <Imported observation={observation} />}
  </section>;
}
