import { useEffect, useId, useRef, useState } from "react";
import type { RecordedWatchpointObservation } from "../content/recorded-watchpoint-observation";
import { readWatchpointFile } from "../content/recorded-watchpoint-observation";
import { WATCHPOINT_BOOKMARK_MAX_BYTES, serializeWatchpointMomentBookmark, restoreWatchpointMomentBookmark,
  type WatchpointBookmarkMoment } from "../content/watchpoint-moment-bookmark";
import "./RecordedWatchpointBookmark.css";

interface Props {
  recording: RecordedWatchpointObservation;
  moment: WatchpointBookmarkMoment;
  onRestore: (moment: WatchpointBookmarkMoment) => void;
}
function Controls({ recording, moment, onRestore }: Props) {
  const id = useId(), active = useRef<AbortController | null>(null), generation = useRef(0);
  const download = useRef<{ url: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false);
  const [error, setError] = useState(false), [message, setMessage] = useState("No moment bookmark has been reopened.");
  function revoke() {
    if (download.current) {
      clearTimeout(download.current.timer); URL.revokeObjectURL(download.current.url); download.current = null;
    }
  }
  useEffect(() => () => {
    generation.current++; active.current?.abort();
    if (download.current) {
      clearTimeout(download.current.timer); URL.revokeObjectURL(download.current.url); download.current = null;
    }
  }, []);
  function cancel() {
    generation.current++; active.current?.abort(); active.current = null; setBusy(false);
  }
  async function perform(kind: "save" | "reopen") {
    if (kind === "reopen" && !file) return;
    cancel();
    const controller = new AbortController(), ticket = generation.current;
    const current = () => !controller.signal.aborted && ticket === generation.current;
    active.current = controller; setBusy(true); setError(false);
    setMessage(kind === "save" ? "Checking the recorded moment…" : "Reading the local moment bookmark…");
    let created: string | null = null;
    try {
      if (kind === "save") {
        const text = await serializeWatchpointMomentBookmark(recording, moment, controller.signal);
        if (!current()) return;
        revoke();
        created = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = created; link.download = "fe2o3-watchpoint-moment.bookmark.json";
        document.body.append(link);
        try { link.click(); } finally { link.remove(); }
        download.current = { url: created, timer: setTimeout(revoke, 1000) }; created = null;
        setMessage("Moment bookmark downloaded. Keep both original recording files separately.");
      } else {
        if (!file || file.size === 0 || file.size > WATCHPOINT_BOOKMARK_MAX_BYTES) throw new Error("Bookmark must be nonempty and at most 16 KiB.");
        const raw = await readWatchpointFile(file, controller.signal);
        if (!current()) return;
        if (new TextEncoder().encode(raw).byteLength > WATCHPOINT_BOOKMARK_MAX_BYTES) throw new Error("Bookmark exceeds 16 KiB.");
        const restored = await restoreWatchpointMomentBookmark(recording, raw, controller.signal);
        if (!current()) return;
        setMessage("Exact saved moment reopened. Unsaved viewer choices reset.");
        onRestore(restored);
      }
    } catch (failure) {
      if (created !== null) URL.revokeObjectURL(created);
      if (!current()) return;
      setError(true);
      setMessage("Moment bookmark refused. No saved selection applied. " +
        (failure instanceof Error ? failure.message.slice(0, 256) : "Unsupported bookmark."));
    } finally {
      if (current()) { active.current = null; setBusy(false); }
    }
  }
  return <section className="recorded-watchpoint-bookmark" aria-label="Recorded watchpoint moment bookmark" aria-busy={busy}>
    <h4>Save or reopen this recorded moment</h4>
    <p>Viewer-only selection, not a capture or debugger command. Reopen requires the exact paired recording files
      already imported here; an uncaptured stop remains uncaptured.</p>
    <div className="recorded-watchpoint-bookmark-controls">
      <button type="button" disabled={busy} onClick={() => void perform("save")}>Download moment bookmark</button>
      <label htmlFor={id}>Watchpoint moment bookmark JSON
        <input id={id} type="file" accept=".json,application/json" onChange={event => {
          cancel(); setFile(event.target.files?.[0] ?? null); setError(false);
          setMessage("Bookmark selection changed. Reopen explicitly to check it against this recording.");
        }} />
      </label>
      <button type="button" disabled={busy || !file} onClick={() => void perform("reopen")}>Reopen moment bookmark</button>
      <button type="button" disabled={!busy} onClick={() => {
        cancel(); setError(false); setMessage("Moment bookmark operation cancelled. No saved selection applied.");
      }}>Cancel moment bookmark</button>
    </div>
    <p role={error ? "alert" : "status"}>{message}</p>
    <p>At most 16 KiB. Only the moment is saved: raw-pair selection, memory cell size, interpretation and viewport
      choices reset on reopen. Matching hashes do not authenticate a producer or source.
      Only the explicit download writes a local file; no upload, browser storage, live query, compilation or GPU action.</p>
  </section>;
}
export function RecordedWatchpointBookmark(props: Props) {
  // A reader must not outlive the imported recording or the user's explicit moment choice.
  const [owner, setOwner] = useState({ recording: props.recording, moment: props.moment, epoch: 0 });
  if (owner.recording !== props.recording || owner.moment !== props.moment) {
    setOwner({ recording: props.recording, moment: props.moment, epoch: owner.epoch + 1 });
  }
  return <Controls key={owner.epoch} {...props} />;
}
