import { useEffect, useId, useRef, useState } from "react";
import type { ImportedResourceRecording } from "../content/recorded-resource-import";
import { readResourceBookmarkFile, restoreResourceSelectionBookmark, serializeResourceSelectionBookmark,
  type ResourceBookmarkSelection } from "../content/resource-selection-bookmark";
import "./ResourceSelectionBookmark.css";

export interface ResourceSelectionBookmarkProps {
  recording: ImportedResourceRecording;
  selection: ResourceBookmarkSelection;
  onRestore: (selection: ResourceBookmarkSelection) => void;
}
function BookmarkControls({ recording, selection, onRestore }: ResourceSelectionBookmarkProps) {
  const inputId = useId(), noticeId = useId();
  const input = useRef<HTMLInputElement>(null);
  const active = useRef<AbortController | null>(null), generation = useRef(0);
  const download = useRef<{ url: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("No saved view has been reopened.");
  function revokeDownload() {
    if (download.current) {
      clearTimeout(download.current.timer);
      URL.revokeObjectURL(download.current.url);
      download.current = null;
    }
  }
  useEffect(() => () => {
    generation.current++; active.current?.abort();
    if (download.current) {
      clearTimeout(download.current.timer); URL.revokeObjectURL(download.current.url);
      download.current = null;
    }
  }, []);
  function cancelRead() {
    generation.current++; active.current?.abort(); active.current = null;
    setBusy(false);
  }
  function choose(next: File | null) {
    cancelRead(); setFile(next); setError(false);
    setMessage("Bookmark file selection changed. Reopen explicitly to check it against the current recording.");
  }
  function save() {
    let url: string | null = null;
    try {
      const text = serializeResourceSelectionBookmark(recording, selection);
      revokeDownload();
      url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = "fe2o3-retained-view.bookmark.json";
      document.body.append(link);
      try { link.click(); } finally { link.remove(); }
      download.current = { url, timer: setTimeout(revokeDownload, 1000) };
      setError(false); setMessage("View bookmark downloaded. Keep the original paired recording files separately.");
    } catch (failure) {
      if (url !== null) URL.revokeObjectURL(url);
      setError(true); setMessage("Bookmark download refused. " + detail(failure));
    }
  }
  async function reopen() {
    if (!file) return;
    cancelRead();
    const controller = new AbortController(), ticket = generation.current;
    active.current = controller;
    setBusy(true); setError(false); setMessage("Reading the local view bookmark…");
    try {
      const raw = await readResourceBookmarkFile(file, controller.signal);
      if (controller.signal.aborted || ticket !== generation.current) return;
      const restored = restoreResourceSelectionBookmark(recording, raw);
      if (controller.signal.aborted || ticket !== generation.current) return;
      setMessage("Exact saved view reopened. Unsaved viewer choices reset; no debugger command was sent.");
      onRestore(restored);
    } catch (failure) {
      if (controller.signal.aborted || ticket !== generation.current) return;
      setError(true); setMessage("Bookmark reopen refused. No saved selection applied. " + detail(failure));
    } finally {
      if (ticket === generation.current) { active.current = null; setBusy(false); }
    }
  }
  return <section className="resource-selection-bookmark" aria-label="Retained view bookmark" aria-busy={busy}>
    <h4>Save or reopen this retained view</h4>
    <p id={noticeId}>Viewer-only bookmark, not a capture or debugger command. It saves the selected checkpoint,
      resource page, memory window and explicit comparison baseline. Keep both original JSONL files:
      reopen requires their exact SHA-256 values, byte counts, context, request IDs and full recorded anchors.</p>
    <div className="resource-selection-bookmark-controls">
      <button type="button" disabled={busy} onClick={save}>Download view bookmark</button>
      <label htmlFor={inputId}>View bookmark JSON
        <input ref={input} id={inputId} type="file" accept=".json,application/json" aria-describedby={noticeId}
          onChange={event => choose(event.target.files?.[0] ?? null)} />
      </label>
      <button type="button" disabled={busy || !file} onClick={() => void reopen()}>Reopen view bookmark</button>
      <button type="button" disabled={!busy} onClick={() => {
        cancelRead(); setError(false); setMessage("Bookmark reopen cancelled. No saved selection applied.");
      }}>Cancel bookmark reopen</button>
    </div>
    <p role={error ? "alert" : "status"}>{message}</p>
    <p>At most 16 KiB. The bookmark contains selection metadata, not recording bytes, source text or credentials.
      Matching byte hashes do not authenticate source, producer, compiler, target or execution.
      Pointer focus, access filters, hypothetical LDS target/base, byte interpretation and viewport choices are not saved;
      they reset on reopen. A retained unavailable or incompatible comparison remains unavailable or incompatible.</p>
    <p>Only the explicit download writes a local file. Reopen uses the recording already imported here.
      No upload, fetch, browser storage, live query, compilation or GPU action.</p>
  </section>;
}
function detail(failure: unknown): string {
  return failure instanceof Error ? failure.message.slice(0, 256) : "Unsupported view bookmark.";
}
export function ResourceSelectionBookmark(props: ResourceSelectionBookmarkProps) {
  // Reset synchronously even when a new imported object contains identical
  // bytes. A pending reader from the previous import must never restore it.
  const [owner, setOwner] = useState({ recording: props.recording, epoch: 0 });
  if (owner.recording !== props.recording) setOwner({ recording: props.recording, epoch: owner.epoch + 1 });
  return <BookmarkControls key={owner.epoch} {...props} />;
}
