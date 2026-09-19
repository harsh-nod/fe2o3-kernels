import { useEffect, useId, useRef, useState } from "react";
import {
  importResourceRecording, readResourceImportFile, RESOURCE_IMPORT_LIMITS,
  type ImportedResourceCheckpoint, type ImportedResourceRecording,
} from "../content/recorded-resource-import";
import { ResourceAccessView } from "./ResourceAccessView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import "./RecordedResourceImport.css";

function CheckpointViews({ checkpoint, recording }: {
  checkpoint: ImportedResourceCheckpoint; recording: ImportedResourceRecording;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const page = checkpoint.pages[pageIndex], memory = checkpoint.memories[memoryIndex];
  return <>
    <p>Independent checkpoint: request {checkpoint.control.requestId}, event {checkpoint.anchor.cursor.event_sequence},
      revision {checkpoint.anchor.cursor.state_revision}. Selecting retained data sends no debugger command.</p>
    {checkpoint.pages.length > 0 ? <section aria-label="Imported resource pages">
      <label>Recorded resource page
        <select aria-label="Recorded resource page" value={pageIndex}
          onChange={event => setPageIndex(Number(event.target.value))}>
          {checkpoint.pages.map((pair, index) => <option key={pair.requestId} value={index}>
            Request {pair.requestId} — {pair.kind} ({pair.rowCount} rows)
          </option>)}
        </select>
      </label>
      <ResourceAccessView key={page.requestId} response={page.response} expectedRequest={page.request}
        expectedSnapshot={checkpoint.anchor} context={recording.context} responseContext={recording.context}
        title="Caller-supplied resource page" />
    </section> : <p>No allocation or access page was retained at this checkpoint.</p>}
    {checkpoint.memories.length > 0 ? <section aria-label="Imported memory windows">
      <label>Recorded memory window
        <select aria-label="Recorded memory window" value={memoryIndex}
          onChange={event => setMemoryIndex(Number(event.target.value))}>
          {checkpoint.memories.map((pair, index) => <option key={pair.requestId} value={index}>
            Request {pair.requestId} — read_memory
          </option>)}
        </select>
      </label>
      <ResourceMemoryView key={memory.requestId} response={memory.response}
        expectedSnapshot={checkpoint.anchor} title="Caller-supplied captured bytes" />
    </section> : <p>No memory window was retained at this checkpoint.</p>}
  </>;
}

function ImportedViews({ recording, names }: { recording: ImportedResourceRecording; names: [string, string] }) {
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [showRaw, setShowRaw] = useState(false);
  const [pairIndex, setPairIndex] = useState(0);
  const checkpoint = recording.checkpoints[checkpointIndex], pair = recording.pairs[pairIndex];
  const rawId = useId();
  return <div className="recorded-resource-import-result">
    <p className="recorded-resource-import-boundary">
      Caller-supplied / unverified. Consistency checks passed for this presentation subset;
      producer, source, bundle, target and execution claims are not authenticated.
      A recorded compiler_bundle_bound label remains an unverified input claim.
    </p>
    <dl aria-label="Local recording byte provenance">
      <dt>Requests</dt><dd>{names[0]} — {recording.requestBytes} bytes<br /><code>{recording.requestSha256}</code></dd>
      <dt>Responses</dt><dd>{names[1]} — {recording.responseBytes} bytes<br /><code>{recording.responseSha256}</code></dd>
    </dl>
    <p>SHA-256 values describe the selected file bytes, not producer authentication.
      {recording.pairs.length} original pairs; {recording.checkpoints.length} retained checkpoints.
      Original line text and IDs are preserved. Control values are retained but not interpreted.</p>
    <label>Imported checkpoint
      <select aria-label="Imported checkpoint" value={checkpointIndex}
        onChange={event => setCheckpointIndex(Number(event.target.value))}>
        {recording.checkpoints.map((item, index) => <option key={item.anchorKey} value={index}>
          Request {item.control.requestId} — event {item.anchor.cursor.event_sequence}, revision {item.anchor.cursor.state_revision}
        </option>)}
      </select>
    </label>
    <CheckpointViews key={checkpoint.anchorKey} checkpoint={checkpoint} recording={recording} />
    <button type="button" aria-expanded={showRaw} aria-controls={rawId}
      onClick={() => setShowRaw(value => !value)}>
      {showRaw ? "Hide original paired lines" : "Show original paired lines"}
    </button>
    <div id={rawId}>
      {showRaw && <section aria-label="Original imported request and response">
        <p>These are original local-file lines, including their LF, not generated commands.
          Do not replay their revisions, allocation identities or tokens in another session.</p>
        <label>Original pair
          <select aria-label="Original pair" value={pairIndex}
            onChange={event => setPairIndex(Number(event.target.value))}>
            {recording.pairs.map((item, index) => <option key={item.requestId} value={index}>
              Line {item.line}, request {item.requestId} — {item.kind}
            </option>)}
          </select>
        </label>
        <pre tabIndex={0} aria-label="Original request line"><code>{pair.requestUtf8}</code></pre>
        <pre tabIndex={0} aria-label="Original response line"><code>{pair.responseUtf8}</code></pre>
      </section>}
    </div>
  </div>;
}

export function RecordedResourceImport() {
  const id = useId();
  const requestInput = useRef<HTMLInputElement>(null), responseInput = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null), generation = useRef(0);
  const [files, setFiles] = useState<[File | null, File | null]>([null, null]);
  const [result, setResult] = useState<{ recording: ImportedResourceRecording; names: [string, string] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("Choose paired local JSONL files. Nothing has been imported.");
  useEffect(() => () => { generation.current++; active.current?.abort(); }, []);

  function clearPending() {
    generation.current++;
    active.current?.abort();
    active.current = null;
    setBusy(false); setResult(null); setError(false);
  }
  function choose(index: 0 | 1, file: File | null) {
    clearPending();
    setFiles(previous => index === 0 ? [file, previous[1]] : [previous[0], file]);
    setMessage("File selection changed. Previous data cleared; import the selected pair to inspect it.");
  }
  function cancel() {
    clearPending();
    setMessage("Import cancelled. No imported data is displayed.");
  }
  function reset() {
    clearPending(); setFiles([null, null]);
    if (requestInput.current) requestInput.current.value = "";
    if (responseInput.current) responseInput.current.value = "";
    setMessage("Reset complete. Local file selections and imported data were cleared.");
    requestInput.current?.focus();
  }
  async function startImport() {
    if (!files[0] || !files[1]) return;
    clearPending();
    const selected: [File, File] = [files[0], files[1]];
    const controller = new AbortController(), ticket = generation.current;
    active.current = controller;
    setBusy(true); setMessage("Reading and checking local recording…");
    try {
      // Sequential capped readers: never more than one live FileReader.
      const requests = await readResourceImportFile(selected[0], controller.signal);
      const responses = await readResourceImportFile(selected[1], controller.signal);
      const recording = await importResourceRecording(requests, responses, controller.signal);
      if (controller.signal.aborted || ticket !== generation.current) return;
      const names: [string, string] = [selected[0].name.slice(0, 120), selected[1].name.slice(0, 120)];
      setResult({ recording, names });
      setMessage("Imported locally. Caller-supplied / unverified recording.");
    } catch (failure) {
      if (controller.signal.aborted || ticket !== generation.current) return;
      setError(true);
      setMessage("Import refused. " + (failure instanceof Error ? failure.message.slice(0, 384) : "Unsupported recording."));
    } finally {
      if (ticket === generation.current) { active.current = null; setBusy(false); }
    }
  }
  return <section className="recorded-resource-import" aria-label="Local resource recording import" aria-busy={busy}>
    <h3>Inspect your recorded CPU resource queries</h3>
    <p>Select a request JSONL file and its paired response JSONL file. Files stay in this page&apos;s memory:
      no upload, network request, storage write, debugger command, compiler action or GPU execution is performed by the importer.</p>
    <p>Supported excerpts contain successful captured forward/reverse operation-step checkpoints followed by
      query_allocations, query_memory_accesses or read_memory pairs. Keep their original order, IDs and bytes.
      Complete sessions containing setup, termination, errors or other commands are not supported.</p>
    <p>Limits: {RESOURCE_IMPORT_LIMITS.fileBytes / 1024} KiB per file, 64 KiB per line, 128 pairs,
      32 checkpoints. Memory windows are at most 4096 bytes, with 256 visible bytes;
      resource pages contain at most 256 rows, with 64 visible rows. Missing data stays missing.</p>
    <div className="recorded-resource-import-files">
      <label htmlFor={id + "-requests"}>Requests JSONL
        <input ref={requestInput} id={id + "-requests"} type="file" accept=".jsonl,.ndjson,application/x-ndjson,application/json"
          onChange={event => choose(0, event.target.files?.[0] ?? null)} />
      </label>
      <label htmlFor={id + "-responses"}>Responses JSONL
        <input ref={responseInput} id={id + "-responses"} type="file" accept=".jsonl,.ndjson,application/x-ndjson,application/json"
          onChange={event => choose(1, event.target.files?.[0] ?? null)} />
      </label>
    </div>
    <div className="recorded-resource-import-actions">
      <button type="button" disabled={busy || !files[0] || !files[1]} onClick={() => void startImport()}>Import local recording</button>
      <button type="button" disabled={!busy} onClick={cancel}>Cancel import</button>
      <button type="button" onClick={reset}>Reset local recording</button>
    </div>
    <p role={error ? "alert" : "status"}>{message}</p>
    {result && <ImportedViews key={result.recording.requestSha256 + result.recording.responseSha256}
      recording={result.recording} names={result.names} />}
    <p>Logical CPU observations only. Physical registers, allocation release/reuse, live memory,
      GPU timing, source authentication and compilation-resume authority remain unavailable.
      Wide allocation ranges remain decimal strings; inexact numeric renderer metadata is refused, including some Wave64 masks.
      Same claimed identities do not authenticate two files as one genuine execution.</p>
    <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/recorded-resource-import-v1.md">
      Prepare a bounded recording and follow the local import walkthrough
    </a></p>
  </section>;
}
