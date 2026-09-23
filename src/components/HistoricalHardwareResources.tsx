import { useEffect, useId, useRef, useState } from "react";
import { HARDWARE_RESOURCE_LIMITS, parseHardwareResourceCapture, type HardwareCapture,
  type HardwareProjection, type HardwareRegister } from "../content/hardware-resource-capture";
import { readHardwareResourceFile } from "../content/hardware-resource-file";
import { programSha256 } from "../content/ordered-program-observation.mjs";
import "./HistoricalHardwareResources.css";

function RegisterRows({ projection }: { projection: HardwareProjection }) {
  const [page, setPage] = useState(0), [selected, setSelected] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(projection.registers.length / HARDWARE_RESOURCE_LIMITS.visibleRows));
  const start = page * HARDWARE_RESOURCE_LIMITS.visibleRows;
  const visible = projection.registers.slice(start, start + HARDWARE_RESOURCE_LIMITS.visibleRows);
  const chosen = visible.find(row => row.identity === selected);
  const select = (row: HardwareRegister) => setSelected(old => old === row.identity ? null : row.identity);
  return <section aria-label="Historical wave register rows">
    <h4>Reported wave-scoped registers</h4>
    <p>Reported scalar/predicate values belong to this historical wave, not to 64 invented lane cells.
      A value marked observed in the file remains an unverified uploaded claim.</p>
    <label>Historical register page
      <select aria-label="Historical register page" value={page} onChange={event => {
        setSelected(null); const next = Number(event.target.value);
        if (Number.isInteger(next) && next >= 0 && next < pages) setPage(next);
      }}>
        {Array.from({ length: pages }, (_, index) => <option key={index} value={index}>
          Page {index + 1} of {pages}
        </option>)}
      </select>
    </label>
    <p>{projection.registers.length} checked rows; at most 64 displayed per page. Missing rows do not establish absence.</p>
    {visible.length === 0 ? <p role="status">No register rows were retained.</p> :
      <div className="historical-hardware-table"><table aria-label="Historical hardware register values">
        <thead><tr><th scope="col">Register / class</th><th scope="col">Reported value / availability</th><th scope="col">Selection</th></tr></thead>
        <tbody>{visible.map(row => <tr key={row.identity}>
          <th scope="row">{row.name}<br />{row.registerClass}</th>
          <td><code>{row.representation}</code><br />{row.status}
            {row.bitWidth !== null && <><br />{row.bitWidth}-bit opaque unsigned integer</>}
            {row.reason && <><br />{row.reason}</>}</td>
          <td><button type="button" aria-pressed={selected === row.identity}
            onClick={() => select(row)}>Inspect register {row.name}</button></td>
        </tr>)}</tbody>
      </table></div>}
    {chosen && <section aria-label="Selected historical register">
      <p>{chosen.name}: <code>{chosen.representation}</code> — {chosen.status}</p>
      <dl>
        <dt>Reported register identity</dt><dd><code>{chosen.identity}</code></dd>
        <dt>Reported evidence identity</dt><dd><code>{chosen.evidenceIdentity ?? "Unavailable — no observation claimed"}</code></dd>
      </dl>
      <p>No pointer dereference, writable register, lane inference or continuation authority is supplied.</p>
    </section>}
  </section>;
}

function CaptureView({ capture, sha256 }: { capture: HardwareCapture; sha256: string }) {
  const projection = capture.status === "captured" ? capture.projection : null;
  return <div className="historical-hardware-result">
    <p className="historical-hardware-boundary">Historical / caller-supplied / untrusted.
      Structural consistency is not producer authentication. No uploaded data is a live debugger owner.</p>
    <dl aria-label="Historical file byte identity">
      <dt>Exact selected file</dt><dd>{capture.bytes} bytes</dd>
      <dt>SHA-256 (content integrity only)</dt><dd><code>{sha256}</code></dd>
    </dl>
    <p>Matching file hashes or reported identities do not prove a hardware observation or that a stop is still current.</p>
    <details><summary>Reported command-registry probes</summary>
      <dl>{Object.entries({ ...capture.probe, ...capture.inspectionProbe }).map(([name, value]) =>
        <div key={name}><dt>{name}</dt><dd>{value ? "Reported supported" : "Reported unavailable"}</dd></div>)}</dl>
      <p>Registry discovery does not establish that an inspection succeeded. Disassembly and memory remain unavailable here.</p>
    </details>
    {capture.status === "unavailable" ? <p role="status">
      Historical capture unavailable: {capture.stage} / {capture.reason}. No register or target projection is displayed.
    </p> : projection && <>
      <section aria-label="Historical target and stop binding">
        <h4>Reported target and stopped scope</h4>
        <dl>
          <dt>Checked-target claim</dt><dd>gfx942:xnack- / Wave64</dd>
          <dt>Stop revision</dt><dd>{projection.stopRevision}</dd>
          <dt>Grid / workgroup extent</dt><dd>[{projection.grid.join(", ")}] / [{projection.workgroup.join(", ")}]</dd>
          <dt>Workgroup coordinate / wave ordinal</dt><dd>[{projection.coordinate.join(", ")}] / {projection.waveInWorkgroup}</dd>
          <dt>Locals command completion</dt><dd>{capture.localsCompletion}; no locals values are supplied by this profile</dd>
        </dl>
        <details><summary>Exact reported artifact and stop identities</summary>
          <dl>
            <dt>Artifact digest</dt><dd><code>{projection.artifact.digest}</code></dd>
            <dt>Artifact canonical bytes</dt><dd>{projection.artifact.canonicalBytes}</dd>
            <dt>Session</dt><dd><code>{projection.sessionIdentity}</code></dd>
            <dt>Stop</dt><dd><code>{projection.scope.stopIdentity}</code></dd>
            <dt>Association</dt><dd><code>{projection.associationIdentity}</code></dd>
            <dt>Queue occurrence</dt><dd><code>{projection.queueOccurrenceIdentity}</code></dd>
            <dt>Process instance</dt><dd><code>{projection.processInstanceIdentity}</code></dd>
            <dt>Dispatch</dt><dd><code>{projection.dispatchIdentity}</code></dd>
            <dt>Thread</dt><dd><code>{projection.scope.threadIdentity}</code></dd>
            <dt>Wave</dt><dd><code>{projection.scope.waveIdentity}</code></dd>
            <dt>Register evidence</dt><dd><code>{projection.registerEvidenceIdentity}</code></dd>
          </dl>
        </details>
      </section>
      <RegisterRows key={sha256 + projection.bindingKey} projection={projection} />
      <section aria-label="Unavailable hardware capture fields">
        <h4>Unavailable stays unavailable</h4>
        <dl>
          <dt>Source</dt><dd>requires_authenticated_source_map</dd>
          <dt>ISA</dt><dd>requires_artifact_relative_instruction_binding</dd>
          <dt>Memory</dt><dd>requires_allocation_relative_authority</dd>
        </dl>
        <p>Per-lane VGPR values, memory/LDS windows, instruction origins, register lifetimes, native issue phases,
          bank-conflict/multicast counts, timing and performance are not supplied. PC locations stay redacted or unavailable.</p>
      </section>
    </>}
  </div>;
}

export function HistoricalHardwareResources() {
  const id = useId(), input = useRef<HTMLInputElement>(null), generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ capture: HardwareCapture; sha256: string; ticket: number } | null>(null);
  const [message, setMessage] = useState("No historical hardware capture selected."), [error, setError] = useState(false);
  useEffect(() => () => { generation.current++; active.current?.abort(); }, []);
  function clear() {
    generation.current++; active.current?.abort(); active.current = null;
    setResult(null); setBusy(false); setError(false);
  }
  function choose(selected: File | null) {
    clear(); setFile(selected);
    setMessage(selected ? "Selection changed. Import the selected file to inspect its historical claims." : "No historical hardware capture selected.");
  }
  function cancel() { clear(); setMessage("Import cancelled. No historical data is displayed."); }
  function reset() {
    clear(); setFile(null); if (input.current) input.current.value = "";
    setMessage("No historical hardware capture selected."); input.current?.focus();
  }
  async function start() {
    if (!file) return;
    clear(); const ticket = generation.current, controller = new AbortController(); active.current = controller;
    setBusy(true); setMessage("Reading and checking historical capture…");
    try {
      const raw = await readHardwareResourceFile(file, controller.signal);
      if (controller.signal.aborted || ticket !== generation.current) return;
      const capture = parseHardwareResourceCapture(raw);
      const sha256 = await programSha256(raw);
      if (controller.signal.aborted || ticket !== generation.current) return;
      setResult({ capture, sha256, ticket }); setMessage("Imported locally. Historical claims remain untrusted.");
    } catch {
      if (controller.signal.aborted || ticket !== generation.current) return;
      setError(true); setMessage("Historical capture refused. Expected the bounded closed V1 one-record profile.");
    } finally {
      if (ticket === generation.current) { active.current = null; setBusy(false); }
    }
  }
  return <section className="historical-hardware" aria-label="Historical hardware resource import" aria-busy={busy}>
    <h3>Inspect a historical hardware resource capture</h3>
    <p>This separate local-file view never connects to a debugger. It sends no upload, HTTP request,
      compiler command or GPU execution; importing a claimed observation does not reproduce or qualify a hardware capture.</p>
    <label htmlFor={id}>Historical hardware capture (local JSON)
      <input ref={input} id={id} type="file" accept=".json,.jsonl,application/json,application/x-ndjson"
        onChange={event => choose(event.target.files?.[0] ?? null)} />
    </label>
    <div className="historical-hardware-actions">
      <button type="button" disabled={!file || busy} onClick={() => void start()}>Import historical hardware capture</button>
      <button type="button" disabled={!busy} onClick={cancel}>Cancel historical import</button>
      <button type="button" onClick={reset}>Reset historical hardware import</button>
    </div>
    <p role={error ? "alert" : "status"}>{message}</p>
    <p>Closed V1 JSON plus final LF: at most 2 MiB, 1,024 checked register rows, 64 displayed rows per page.
      Available scalar/predicate values are at most 64 bits; no wide values are truncated.</p>
    {result && <CaptureView key={result.ticket + ":" + result.sha256} capture={result.capture} sha256={result.sha256} />}
    <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/historical-hardware-resource-capture-v1.md">
      Historical capture format and limits
    </a></p>
  </section>;
}
