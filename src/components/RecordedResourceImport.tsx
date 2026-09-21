import { useEffect, useId, useRef, useState } from "react";
import {
  importResourceRecording, readResourceImportFile, RESOURCE_IMPORT_LIMITS,
  type ImportedResourceCheckpoint, type ImportedResourceRecording,
} from "../content/recorded-resource-import";
import { ResourceAccessView } from "./ResourceAccessView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import { ResourceMemoryComparisonView } from "./ResourceMemoryComparisonView";
import { ResourceCheckpointValuesView } from "./ResourceCheckpointValuesView";
import type { ResourceAccessSelection } from "../content/resource-access-navigation";
import type { LdsTargetAssumption } from "../content/resource-lds-bank-analysis";
import { projectResourcePointerMemoryNavigation } from "../content/resource-pointer-memory-navigation";
import { ResourceSelectionBookmark } from "./ResourceSelectionBookmark";
import type { ResourceBookmarkSelection } from "../content/resource-selection-bookmark";
import { resourceMemoryComparisonReference } from "../content/resource-memory-comparison";
import "./RecordedResourceImport.css";

function CheckpointViews({ checkpoint, recording, viewSelection, onViewSelection }: {
  checkpoint: ImportedResourceCheckpoint; recording: ImportedResourceRecording;
  viewSelection: ResourceBookmarkSelection; onViewSelection: (selection: ResourceBookmarkSelection) => void;
}) {
  const pageIndex = checkpoint.pages.findIndex(pair => pair.requestId === viewSelection.pageRequestId);
  const memoryIndex = checkpoint.memories.findIndex(pair => pair.requestId === viewSelection.memoryRequestId);
  const [selection, setSelection] = useState<ResourceAccessSelection | null>(null);
  const [targetAssumption, setTargetAssumption] = useState<LdsTargetAssumption>(null);
  const [pointerSelection, setPointerSelection] = useState<{
    valueKey: string; selectionKey: number; memoryRequestId?: number;
  } | null>(null);
  const pointerSequence = useRef(0);
  const assumptionId = useId();
  // Store a selection, not an old projection. Revalidate the exact current
  // checkpoint, context and complete memory bytes on every render.
  const navigation = pointerSelection ? projectResourcePointerMemoryNavigation(recording, checkpoint,
    pointerSelection.valueKey, pointerSelection.selectionKey, pointerSelection.memoryRequestId) : null;
  const displayedMemoryIndex = navigation?.status === "ready" ? navigation.memoryIndex : memoryIndex;
  const page = checkpoint.pages[pageIndex], memory = checkpoint.memories[displayedMemoryIndex];
  const chooseMemory = (requestId: number) => onViewSelection({ ...viewSelection, memoryRequestId: requestId,
    baseline: requestId === viewSelection.memoryRequestId ? viewSelection.baseline : null });
  const selectPointer = (valueKey: string, memoryRequestId?: number) => {
    const selectionKey = ++pointerSequence.current;
    const next = projectResourcePointerMemoryNavigation(recording, checkpoint, valueKey, selectionKey, memoryRequestId);
    if (next.status === "ready") chooseMemory(next.focus.requestId);
    setPointerSelection({ valueKey, memoryRequestId, selectionKey });
  };
  const baselineCheckpoint = viewSelection.baseline
    ? recording.checkpoints.find(item => item.control.requestId === viewSelection.baseline!.checkpointRequestId) : undefined;
  const baselineMemory = baselineCheckpoint?.memories.find(item => item.requestId === viewSelection.baseline!.memoryRequestId);
  const baseline = baselineCheckpoint && baselineMemory
    ? resourceMemoryComparisonReference(recording, baselineCheckpoint, baselineMemory) : null;
  const access = page ? { response: page.response, expectedRequest: page.request,
    expectedSnapshot: checkpoint.anchor, context: recording.context, responseContext: recording.context } : null;
  const accessOverlay = page?.kind === "memory_accesses" && access ? {
    access, selection, memoryContext: recording.context,
  } : undefined;
  return <>
    <p>Independent checkpoint: request {checkpoint.control.requestId}, event {checkpoint.anchor.cursor.event_sequence},
      revision {checkpoint.anchor.cursor.state_revision}. Selecting retained data sends no debugger command.</p>
    <ResourceCheckpointValuesView checkpoint={checkpoint} onPointerSelect={selectPointer} />
    {navigation && <section aria-label="Pointer retained-memory navigation" data-state={navigation.status}>
      <h4>Current SSA pointer to retained bytes</h4>
      <p>Caller-supplied / unverified. This selects a byte already retained at this exact checkpoint,
        not a dereference, bounds or lifetime check. Missing or uninitialized storage is not a value.</p>
      <p role="status">{navigation.status === "ready"
        ? `Retained request ${navigation.focus.requestId}, allocation ${navigation.focus.allocationOrdinal}:g${navigation.focus.generation}, byte offset ${navigation.focus.byteOffset}.`
        : navigation.detail}</p>
      {navigation.status === "ambiguous" && navigation.windows.map(window => <button type="button" key={window.requestId}
        onClick={() => selectPointer(pointerSelection!.valueKey, window.requestId)}>Use retained request {window.requestId}</button>)}
      <button type="button" onClick={() => { if (memory) chooseMemory(memory.requestId); setPointerSelection(null); }}>Clear pointer selection</button>
    </section>}
    {checkpoint.pages.length > 0 ? <section aria-label="Imported resource pages">
      <label>Hypothetical target for LDS model
        <select aria-label="Hypothetical target for LDS model" aria-describedby={assumptionId}
          value={targetAssumption ?? "unknown"} onChange={event => {
            const value = event.target.value;
            setTargetAssumption(value === "gfx942" || value === "gfx950" ? value : null);
            setSelection(null);
          }}>
          <option value="unknown">Unknown — no target assumption</option>
          <option value="gfx942">Assume gfx942 (CDNA3, 32 banks)</option>
          <option value="gfx950">Assume gfx950 (CDNA4, 64 banks)</option>
        </select>
      </label>
      <p id={assumptionId}>User hypothesis / unverified. The imported target remains unavailable.
        This optional choice changes only LDS arithmetic, not the recording, selected checkpoint or memory bytes.
        It resets on checkpoint or import replacement. No GPU execution or target legality is established.</p>
      <label>Recorded resource page
        <select aria-label="Recorded resource page" value={pageIndex}
          onChange={event => {
            const selected = checkpoint.pages[Number(event.target.value)];
            if (selected) onViewSelection({ ...viewSelection, pageRequestId: selected.requestId });
            setSelection(null);
          }}>
          {checkpoint.pages.map((pair, index) => <option key={pair.requestId} value={index}>
            Request {pair.requestId} — {pair.kind} ({pair.rowCount} rows)
          </option>)}
        </select>
      </label>
      <ResourceAccessView key={JSON.stringify([page.requestId, targetAssumption])} {...access!}
        selection={selection} onSelectionChange={setSelection} ldsTargetAssumption={targetAssumption}
        title="Caller-supplied resource page" />
    </section> : <p>No allocation or access page was retained at this checkpoint.</p>}
    {checkpoint.memories.length > 0 ? <section aria-label="Imported memory windows">
      <label>Recorded memory window
        <select aria-label="Recorded memory window" value={displayedMemoryIndex}
          onChange={event => {
            const selected = checkpoint.memories[Number(event.target.value)];
            if (selected) chooseMemory(selected.requestId);
            setPointerSelection(null);
          }}>
          {checkpoint.memories.map((pair, index) => <option key={pair.requestId} value={index}>
            Request {pair.requestId} — read_memory
          </option>)}
        </select>
      </label>
      {!navigation || navigation.status === "ready" ? <>
        <ResourceMemoryView key={JSON.stringify([memory.requestId, pointerSelection?.selectionKey ?? null])} response={memory.response}
          expectedSnapshot={checkpoint.anchor} accessOverlay={accessOverlay} title="Caller-supplied captured bytes"
          navigationFocus={navigation?.status === "ready" ? navigation.focus : undefined} memoryContext={recording.context} />
        <ResourceMemoryComparisonView recording={recording} checkpoint={checkpoint} memory={memory}
          baselineSelection={{ value: baseline, onChange: reference => onViewSelection({ ...viewSelection,
            baseline: reference ? { checkpointRequestId: reference.checkpointRequestId, memoryRequestId: reference.memoryRequestId } : null }) }} />
      </> : <p>No pointer-selected memory is displayed. Choose a matching request or clear the pointer selection to browse retained windows.</p>}
    </section> : <p>No memory window was retained at this checkpoint.</p>}
  </>;
}

function ImportedViews({ recording, names }: { recording: ImportedResourceRecording; names: [string, string] }) {
  const initialSelection = (checkpoint: ImportedResourceCheckpoint): ResourceBookmarkSelection => ({
    checkpointRequestId: checkpoint.control.requestId, pageRequestId: checkpoint.pages[0]?.requestId ?? null,
    memoryRequestId: checkpoint.memories[0]?.requestId ?? null, baseline: null,
  });
  const [viewSelection, setViewSelection] = useState<ResourceBookmarkSelection>(() => initialSelection(recording.checkpoints[0]));
  const [restoreEpoch, setRestoreEpoch] = useState(0);
  const checkpointIndex = recording.checkpoints.findIndex(item => item.control.requestId === viewSelection.checkpointRequestId);
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
      Original line text and IDs are preserved. A separate bounded panel checks supported checkpoint values for display.</p>
    <ResourceSelectionBookmark recording={recording} selection={viewSelection} onRestore={restored => {
      // The bookmark component validates every ID/anchor against this recording
      // before this single atomic selection update. Never restore by index.
      setViewSelection(restored); setRestoreEpoch(epoch => epoch + 1);
      setShowRaw(false); setPairIndex(0);
    }} />
    <label>Imported checkpoint
      <select aria-label="Imported checkpoint" value={checkpointIndex}
        onChange={event => {
          const selected = recording.checkpoints[Number(event.target.value)];
          if (selected) setViewSelection(initialSelection(selected));
        }}>
        {recording.checkpoints.map((item, index) => <option key={item.anchorKey} value={index}>
          Request {item.control.requestId} — event {item.anchor.cursor.event_sequence}, revision {item.anchor.cursor.state_revision}
        </option>)}
      </select>
    </label>
    <CheckpointViews key={JSON.stringify([checkpoint.anchorKey, recording.context, restoreEpoch])}
      checkpoint={checkpoint} recording={recording} viewSelection={viewSelection} onViewSelection={setViewSelection} />
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
    <p>Select a request JSONL file and its paired response JSONL file. Imported files stay in this page&apos;s memory:
      no upload, network request, automatic storage write, debugger command, compiler action or GPU execution is performed.
      After import, the separate bookmark download is an explicit local file save of selection metadata only.</p>
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
