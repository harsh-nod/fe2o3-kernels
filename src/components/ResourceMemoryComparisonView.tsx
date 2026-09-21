import { useId, useState, type KeyboardEvent } from "react";
import type { ImportedResourceCheckpoint, ImportedResourcePair, ImportedResourceRecording } from "../content/recorded-resource-import";
import { projectResourceMemoryComparison, resourceMemoryComparisonOptions, resourceMemoryComparisonRecordingKey,
  resourceMemoryComparisonReference, type ComparedStorageByte, type ResourceMemoryComparisonReference } from "../content/resource-memory-comparison";
import "./ResourceMemoryComparisonView.css";

interface Props {
  recording: ImportedResourceRecording; checkpoint: ImportedResourceCheckpoint; memory: ImportedResourcePair;
  baselineSelection?: {
    value: ResourceMemoryComparisonReference | null;
    onChange: (reference: ResourceMemoryComparisonReference | null) => void;
  };
}
function stored(byte: ComparedStorageByte | null): string {
  return byte ? `${byte.hex} · ${byte.initialized ? "initialized" : "uninitialized storage; not a program value"}` : "Not captured";
}
function Comparison({ recording, checkpoint, memory, baselineSelection }: Props) {
  const [localBaseline, setLocalBaseline] = useState<ResourceMemoryComparisonReference | null>(null);
  const baseline = baselineSelection ? baselineSelection.value : localBaseline;
  const setBaseline = baselineSelection ? baselineSelection.onChange : setLocalBaseline;
  const [page, setPage] = useState(0), [cellBytes, setCellBytes] = useState<1 | 4>(4), [selectedIndex, setSelectedIndex] = useState(0);
  const noticeId = useId();
  const current = resourceMemoryComparisonReference(recording, checkpoint, memory);
  const projection = projectResourceMemoryComparison(recording, current, baseline, page, cellBytes);
  const options = resourceMemoryComparisonOptions(recording).filter(option => option.memory.requestId !== memory.requestId);
  const selected = projection.status === "ready" ? projection.cells[selectedIndex] : undefined;
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (projection.status !== "ready") return;
    const columns = Number.parseInt(getComputedStyle(event.currentTarget.parentElement!).getPropertyValue("--comparison-columns"), 10) || 2;
    const movement: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
    const next = event.key === "Home" ? 0 : event.key === "End" ? projection.cells.length - 1
      : Object.hasOwn(movement, event.key) ? Math.max(0, Math.min(projection.cells.length - 1, index + movement[event.key])) : null;
    if (next === null) return;
    event.preventDefault(); setSelectedIndex(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }
  return <section className="resource-memory-comparison" aria-label="Retained memory checkpoint comparison" data-state={projection.status}>
    <h4>Compare retained memory checkpoints</h4>
    <p id={noticeId}>Caller-supplied / unverified CPU storage. Compare two independently anchored windows;
      this does not replay execution, identify the writer, prove allocation lifetime/reuse or authenticate a capture.
      The current side remains the memory window selected above, not a historical access.</p>
    <label>Baseline retained memory window
      <select aria-label="Baseline retained memory window" aria-describedby={noticeId} value={baseline?.memoryRequestId ?? ""}
        onChange={event => {
          const option = options.find(item => String(item.memory.requestId) === event.target.value);
          setBaseline(option ? resourceMemoryComparisonReference(recording, option.checkpoint, option.memory) : null);
          setPage(0); setSelectedIndex(0);
        }}>
        <option value="">No baseline selected</option>
        {options.map(option => <option key={option.memory.requestId} value={option.memory.requestId}>
          Request {option.memory.requestId} — checkpoint {option.checkpoint.control.requestId}, event {option.checkpoint.anchor.cursor.event_sequence}, revision {option.checkpoint.anchor.cursor.state_revision}
        </option>)}
      </select>
    </label>
    {projection.status !== "ready" ? <p role="status">{projection.detail}</p> : <>
      <dl className="resource-memory-comparison-anchors">
        <div><dt>Baseline</dt><dd>Request {projection.baseline.requestId}: event {projection.baseline.anchor.cursor.event_sequence}, revision {projection.baseline.anchor.cursor.state_revision}.</dd></div>
        <div><dt>Current</dt><dd>Request {projection.current.requestId}: event {projection.current.anchor.cursor.event_sequence}, revision {projection.current.anchor.cursor.state_revision}.</dd></div>
      </dl>
      <p>Recorded allocation {projection.current.memory.allocation.ordinal}:g0, requested [{projection.current.memory.byte_offset}, {projection.current.memory.byte_offset + projection.current.memory.requested_bytes}).
        Generation zero is a recorded identity, not evidence of physical memory reuse.</p>
      {!projection.completeWindows && <p role="status">Partial or truncated capture. Only bytes returned on both sides can be compared; equal visible storage does not establish complete-window equality.</p>}
      <div className="resource-memory-comparison-controls">
        <label>Comparison cell size <select aria-label="Comparison cell size" value={cellBytes}
          onChange={event => { setCellBytes(event.target.value === "1" ? 1 : 4); setSelectedIndex(0); }}>
          <option value="4">Dword byte group</option><option value="1">Byte</option>
        </select></label>
        <div aria-label="Comparison viewport navigation">
          <button type="button" disabled={page === 0} onClick={() => { setPage(page - 1); setSelectedIndex(0); }}>Previous comparison window</button>
          <span>Window {page + 1} of {projection.pageCount}</span>
          <button type="button" disabled={page + 1 >= projection.pageCount} onClick={() => { setPage(page + 1); setSelectedIndex(0); }}>Next comparison window</button>
        </div>
      </div>
      <p className="resource-memory-comparison-summary" role="status">Visible [{projection.visibleStart}, {projection.visibleEnd}): {projection.comparedBytes} compared bytes;
        {" "}{projection.storageChanges} storage-byte differences; {projection.initializationChanges} initialization differences;
        {" "}{projection.unavailableBytes} bytes not captured on both sides. Counts describe this viewport only.</p>
      <p>B = raw storage differs · I = initialization differs · = = both recorded facts equal · ? = not captured on both sides.
        Initialization and byte differences are independent. Equal bytes may still differ in initialization; uninitialized bytes are not program values.</p>
      <div className="resource-memory-comparison-grid" role="group" aria-label="Compared memory cells">
        {projection.cells.map((cell, index) => <button type="button" key={cell.byteOffset}
          className="resource-memory-comparison-cell" data-marker={cell.marker}
          aria-label={`Comparison byte offset ${cell.byteOffset}, ${cell.bytes.length} bytes, ${cell.marker}`}
          aria-pressed={index === selectedIndex} tabIndex={index === selectedIndex ? 0 : -1}
          onClick={() => setSelectedIndex(index)} onKeyDown={event => navigate(event, index)}>
          <span>+{cell.byteOffset} · {cell.bytes.length} B</span><strong>{cell.marker}</strong>
          <code>Base {cell.bytes.map(byte => byte.baseline?.hex.slice(2) ?? "??").join(" ")}</code>
          <code>Current {cell.bytes.map(byte => byte.current?.hex.slice(2) ?? "??").join(" ")}</code>
        </button>)}
      </div>
      {selected && <div className="resource-memory-comparison-table"><table aria-label="Selected compared byte details">
        <thead><tr><th scope="col">Offset</th><th scope="col">Baseline storage</th><th scope="col">Current storage</th><th scope="col">Difference</th></tr></thead>
        <tbody>{selected.bytes.map(byte => <tr key={byte.byteOffset}>
          <th scope="row">+{byte.byteOffset}</th><td>{stored(byte.baseline)}</td><td>{stored(byte.current)}</td>
          <td>{byte.storageChanged === null ? "Unavailable" : `${byte.storageChanged ? "Storage differs" : "Storage equal"}; ${byte.initializationChanged ? "initialization differs" : "initialization equal"}`}</td>
        </tr>)}</tbody>
      </table></div>}
      <details><summary>Exact comparison anchors and recorded-file identities</summary>
        <pre>{JSON.stringify({ requests_sha256: recording.requestSha256, responses_sha256: recording.responseSha256,
          baseline_request: projection.baseline.requestId, baseline: projection.baseline.anchor,
          current_request: projection.current.requestId, current: projection.current.anchor }, null, 2)}</pre>
      </details>
    </>}
    <p>Only matching recorded scope/mask, source/site, frame/occurrence, allocation and requested range are compared;
      cursor event/revision may differ. No cross-recording or compiler-variant comparison, access-causality inference,
      new query, physical address or GPU observation. At most 4096 bytes per input and 256 visible bytes.</p>
  </section>;
}
export function ResourceMemoryComparisonView(props: Props) {
  // Synchronous remount, not an effect: stale baseline/page/cell state never
  // appears on a new recording, context, checkpoint or selected memory pair.
  return <Comparison key={JSON.stringify([resourceMemoryComparisonRecordingKey(props.recording), props.checkpoint.anchorKey,
    props.checkpoint.control.requestId, props.memory.requestId])} {...props} />;
}
