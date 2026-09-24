import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { projectLdsRecording, type LdsRecording } from "../content/physical-lds-debug-v22";
import { readLdsFile } from "../content/physical-lds-debug-v22-framing";
import { type LdsInput } from "../content/physical-lds-debug-v22-input";
import { loadLdsRecording } from "../content/physical-lds-debug-v22-load";
import { LDS_COMPILER_COMMIT, LDS_RECORDING_EVIDENCE, LDS_RECORDINGS } from "../content/physical-lds-debug-v22-recordings";
import { LdsRecordingView } from "./LdsRecordingView";
import "./PhysicalLdsRecordingPage.css";
type FileKind = "index" | "document" | "requests" | "responses";
const kinds: readonly FileKind[] = ["index", "document", "requests", "responses"];
export function PhysicalLdsRecordingPage() {
  const [recording, setRecording] = useState<LdsRecording | null>(null);
  const [message, setMessage] = useState("Choose a retained recording or four local files. No prior values are displayed.");
  const [busy, setBusy] = useState(false), [files, setFiles] = useState<Partial<Record<FileKind, File>>>({});
  const [inputReset, setInputReset] = useState(0);
  const generation = useRef(0), controller = useRef<AbortController | null>(null);
  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);
  function invalidate() {
    generation.current++; controller.current?.abort(); controller.current = null;
    setRecording(null); setBusy(false);
  }
  async function load(input: (signal: AbortSignal) => Promise<LdsInput>) {
    invalidate(); const current = generation.current, own = new AbortController(); controller.current = own;
    setBusy(true); setMessage("Reading and checking bounded recording bytes…");
    try {
      const candidate = await input(own.signal);
      if (generation.current !== current || own.signal.aborted) return;
      const result = await projectLdsRecording(candidate, own.signal);
      if (generation.current !== current || own.signal.aborted) return;
      setRecording(result); setMessage("Recorded CPU observations checked for internal consistency. This is not source authentication or execution.");
    } catch (error) {
      if (generation.current !== current || own.signal.aborted) return;
      setRecording(null); setMessage("Recording refused; no partial or previous values displayed. " +
        (error instanceof Error ? error.message.slice(0, 200) : "Invalid recording."));
    } finally { if (generation.current === current && !own.signal.aborted) setBusy(false); }
  }
  async function local(signal: AbortSignal): Promise<LdsInput> {
    const selected = kinds.map(kind => files[kind]);
    if (selected.some(file => !file)) throw new Error("Select all four files.");
    const texts: string[] = [];
    for (let i = 0; i < selected.length; i++)
      texts.push(await readLdsFile(selected[i]!, i === 0 ? "index" : i === 1 ? "document" : "jsonl", signal));
    return { indexUtf8: texts[0], documentUtf8: texts[1], requestsUtf8: texts[2], responsesUtf8: texts[3] };
  }
  return <article className="lds-recording">
    <p><Link to="/debugger/source-isa-agent">Source / ISA inspection</Link></p>
    <h1>Two-wave LDS exchange · recorded CPU debugger</h1>
    <p>Inspect actual retained V22 CPU observations: two logical waves, three allocation identities, a128-participant barrier,
      and opaque pending reads becoming ready. This page never runs a kernel or sends debugger commands.</p>
    <p>Physical registers, physical EXEC, source-variable maps, pending-store queues, publication bitmaps and hardware observations are unavailable.
      A logical full-lane mask is not a physical EXEC capture. The index records barrier phase0; the authored publication epoch is1.</p>
    <section aria-label="Select recorded input">
      <h2>Retained examples</h2>
      <p>These recordings came from actual source R7 exports and the passed public CLI R3 qualification, not the later fresh wrapper run.
        Uploaded bytes carry no source, runtime, host or protected authority.</p>
      <div className="lds-actions">{LDS_RECORDINGS.map(entry => <button key={entry.id} type="button"
        onClick={() => void load(signal => loadLdsRecording(entry.id, signal))}>{entry.title}</button>)}</div>
      <h2>Read local files without executing them</h2>
      <p>Index:8MiB expanded /1MiB gzip; request document:16KiB; each JSONL:1MiB. Gzip requires streaming decompression support.</p>
      <div className="lds-files">{kinds.map(kind => <label key={kind}>{kind}
        <input key={kind + ":" + inputReset} type="file" aria-label={"V22 " + kind + " file"} accept={kind === "index" ? ".json,.gz,.gzip" : kind === "document" ? ".json" : ".jsonl"}
          onChange={event => { const file = event.currentTarget.files?.[0]; invalidate();
            setFiles(old => ({ ...old, [kind]: file })); setMessage("Input replaced. Select all four files, then read them; previous values cleared."); }} />
      </label>)}</div>
      <button type="button" disabled={kinds.some(kind => !files[kind])} onClick={() => void load(local)}>Read selected files</button>
      <button type="button" onClick={() => { invalidate(); setFiles({}); setInputReset(n => n + 1);
        setMessage("Selection cleared. No previous values displayed."); }}>Clear / cancel</button>
      <p role="status" aria-live="polite">{busy ? "Loading. " : ""}{message}</p>
    </section>
    {recording && <LdsRecordingView key={recording.context.index.rawDigest + recording.context.responsesDigest} recording={recording} />}
    <section aria-label="Recording evidence">
      <h2>Evidence and limits</h2>
      <p>Public CLI qualification:6 sessions,96 transactional refusals,13 bootstrap refusals,8 byte-exact V20/V21 replays.
        Whole-family cleanup, GPU execution and hardware capture were not claimed by this recording runner.</p>
      <p>R3 report SHA-256: <code>{LDS_RECORDING_EVIDENCE.report.sha256}</code></p>
      <p>Source R7 observation SHA-256: <code>{LDS_RECORDING_EVIDENCE.sourceR7.sha256}</code></p>
      {LDS_COMPILER_COMMIT ? <p><a href={"https://github.com/harsh-nod/fe2o3/tree/" + LDS_COMPILER_COMMIT}>Dedicated compiler implementation commit</a></p>
        : <p>Dedicated compiler publication link is pending. No global site pin or maturity level is promoted.</p>}
    </section>
  </article>;
}
