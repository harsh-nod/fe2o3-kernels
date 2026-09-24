import { useEffect, useId, useRef, useState } from "react";
import { projectPhysicalCopyDebugV21, type PhysicalCopyInputV21,
  type PhysicalCopyProjectionV21, type PhysicalCopyRecordingV21 } from "../content/physical-global-copy-debug-v21";
import { PHYSICAL_COPY_RETAINED_V21 } from "../content/physical-global-copy-debug-v21-retained";
import { PHYSICAL_COPY_LIMITS_V21 } from "../content/physical-global-copy-debug-v21-input";
import { readResourceImportFile } from "../content/recorded-resource-import";
import { ResourceCheckpointValueRows } from "./ResourceCheckpointValuesView";
import "./PhysicalEntryDebugV20.css";

function Recording({ recording }: { recording: PhysicalCopyRecordingV21 }) {
  const [at, setAt] = useState(0), row = recording.records[at], { context, facts } = recording;
  const role = row.memory ? context.allocations.find(a => a.allocation === row.memory!.allocation)! : null;
  const loaded = row.values?.find(value => value.valueOrdinal === String(context.loadedValue));
  return <>
    <p role="status">V21 presentation checks passed. This is a recording, not a live debugger connection.</p>
    <section aria-label="V21 declared recording origin">
      <h4>Declared origin — not source authentication</h4>
      <p>Source label <code>{context.feature}</code>, entry <code>{context.entry}</code>;
        claimed canonical identity <code>{context.canonicalIdentity}</code> ({context.canonicalBytes} bytes).
        A register-edited source label does not expose physical registers.</p>
      <p>The configuration digest joins that claimed identity and the exact simulation request to the recorded session.
        It does not prove source custody, canonical admission, native ABI binding or a trusted producer.</p>
    </section>
    <section aria-label="V21 independently checked recording facts">
      <h4>Facts checked across the recorded observations</h4>
      <p>The same SSA root 0:1:{context.loadedValue} is unavailable, then a captured u32, then unavailable again after recorded reverse navigation.
        Declared load/wait labels are joined to actual KIR sites and event indexes; these labels are not an authenticated source map.</p>
      <p>Final recorded input: {facts.inputUnchangedBytes} bytes unchanged.
        Output: {facts.copiedWords} copied words and {facts.outputCanaryBytes} unchanged bytes outside that write extent.</p>
    </section>
    <section aria-label="V21 declared profile premise">
      <h4>Declared profile requirement — not an all-lane access trace</h4>
      <p>The declared V21 profile requires all {context.grid} resident logical lanes to read input before the output mask.
        The viewer checks the declared input prerequisites, selected first-lane readiness observations and final bytes;
        it does not observe an access trace for every lane.
        A zero or partial output extent does not make missing or uninitialized input reads valid.
        This viewer compares recorded data; it never executes a load or checks a host dispatch.</p>
    </section>
    <label>Recorded V21 observation <select aria-label="Recorded V21 observation" value={at}
      onChange={event => setAt(Number(event.target.value))}>
      {recording.records.map((item, index) => <option key={item.requestId} value={index}>
        {index + 1}. {item.label} — {item.status}, event {item.event}, revision {item.revision}
      </option>)}
    </select></label>
    <div className="physical-debug-v20-controls" role="group" aria-label="Browse V21 recorded observations">
      <button type="button" disabled={at === 0} onClick={() => setAt(n => n - 1)}>Previous V21 observation</button>
      <button type="button" disabled={at + 1 === recording.records.length} onClick={() => setAt(n => n + 1)}>Next V21 observation</button>
      <button type="button" onClick={() => setAt(facts.pendingQuery)}>Recorded pending value</button>
      <button type="button" onClick={() => setAt(facts.readyQuery)}>Recorded ready value</button>
      <button type="button" onClick={() => setAt(facts.reversePendingQuery)}>Recorded reverse to pending</button>
      <button type="button" onClick={() => setAt(facts.finalInputQueries[0])}>Recorded final input</button>
      <button type="button" onClick={() => setAt(facts.finalOutputQueries[0])}>Recorded final output</button>
    </div>
    <p aria-live="polite">Observation {at + 1} of {recording.records.length}: request {row.requestId}, {row.label}.
      Recorded event {row.event}, revision {row.revision}, session {row.state}.</p>
    <p role="status" data-recorded-status={row.status}>{row.detail}</p>
    <p>Navigation browses stored responses only. No imported command is sent and no kernel is rewound, resumed or re-executed.</p>
    {row.anchor ? <section aria-label="V21 selected logical checkpoint">
      <h4>Selected recorded KIR site</h4>
      <p>Function 0, block {row.anchor.block}, operation {row.anchor.operation};
        logical workgroup [{row.anchor.workgroup.join(", ")}], wave 0, lane {row.anchor.lane},
        global workitem [{row.anchor.global.join(", ")}].</p>
      <p>Logical resident mask <code>{row.anchor.activeMask.toString()}</code> is not physical EXEC.
        Hardware wave state and physical-register values are unavailable.</p>
    </section> : <p>No captured checkpoint in this response; no previous checkpoint is carried forward.</p>}
    {row.values !== null ? <section aria-label="V21 recorded SSA page">
      <h4>Selected recorded SSA page</h4>
      <p>Page positions {row.page!.start} through {row.page!.start + row.values.length} (exclusive).
        {row.page!.next === null ? " No continuation in this response." : " Next recorded position " + row.page!.next + "."}
        The browser does not fetch absent pages.</p>
      {loaded ? <p aria-label="Selected V21 loaded SSA readiness">SSA 0:1:{context.loadedValue}: {loaded.status === "captured"
        ? "Captured u32 " + loaded.representation : "Unavailable — " + loaded.representation}.
        Pending or symbolic values are not zero and are not native address bits.</p>
        : <p>The declared loaded SSA is not in this selected page; no value from another page is substituted.</p>}
      <ResourceCheckpointValueRows rows={row.values} />
    </section> : <p>SSA unavailable in this response; no previous SSA table is shown.</p>}
    {row.memory && role ? <section aria-label="V21 recorded allocation memory">
      <h4>{role.name === "input" ? "Read-only input observation" : "Writable output observation"}</h4>
      <p>Allocation {role.allocation}, generation 0; byte offset {row.memory.offset}.
        The {role.access} role is declared by the simulation request and joined to observed root SSA {role.parameter}.
        Allocation-relative coordinates are not native addresses or host ownership proof.</p>
      <div className="physical-debug-v20-scroll" tabIndex={0} role="region" aria-label="Scrollable V21 memory bytes">
        <table aria-label="Selected V21 recorded memory bytes">
          <thead><tr><th scope="col">Byte offset</th><th scope="col">Stored byte</th><th scope="col">Initialization</th></tr></thead>
          <tbody>{row.memory.cells.map((cell, i) => <tr key={i}>
            <th scope="row">{row.memory!.offset + i}</th><td><code>0x{cell.byte}</code></td>
            <td>{cell.initialized ? "Initialized observed byte" : "Uninitialized storage — not a valid value"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p>Use subsequent recorded memory queries to inspect later pages. Uninitialized storage bytes are not interpreted as scalars.</p>
    </section> : <p>Memory unavailable in this response; neither input nor output bytes are carried over.</p>}
    <section aria-label="V21 unavailable authority">
      <h4>Unavailable authority and views</h4>
      <p>Source maps, source variables, hardware registers, native addresses, host alias/bounds discharge,
        GPU dispatch, protected execution and resumable state are unavailable.
        There is no V21 live bridge or deterministic replay in this viewer.</p>
    </section>
    <details><summary>Selected original V21 pair and byte identities</summary>
      <p>Container SHA-256 <code>{context.containerSha256}</code>.</p>
      <p>Simulation-request SHA-256 <code>{context.simulationRequestSha256}</code>.</p>
      <p>Request/response SHA-256 <code>{recording.requestSha256}</code> / <code>{recording.responseSha256}</code>.</p>
      <p>These hashes identify bytes, not their origin or authority.</p>
      <pre aria-label="Original V21 request">{row.requestUtf8}</pre>
      <pre aria-label="Original V21 response">{row.responseUtf8}</pre>
    </details>
  </>;
}
export function PhysicalGlobalCopyObservationV21({ input }: { input: PhysicalCopyInputV21 | null }) {
  const [completed, setCompleted] = useState<{ input: PhysicalCopyInputV21 | null; value: PhysicalCopyProjectionV21 } | null>(null);
  useEffect(() => {
    let current = true;
    void projectPhysicalCopyDebugV21(input).then(value => { if (current) setCompleted({ input, value }); });
    return () => { current = false; };
  }, [input]);
  const value = completed !== null && completed.input === input ? completed.value : null;
  return <section aria-label="V21 recorded CPU observation">
    <p>Local read-only presentation. Imported data is not uploaded or executed and cannot supply source or hardware authority.</p>
    {value === null ? <p role="status">Checking current V21 bytes; no previous data displayed.</p>
      : value.status !== "ready" ? <p role="status" data-state={value.status}>{value.detail}</p>
        : <Recording key={value.key} recording={value} />}
  </section>;
}
export function PhysicalGlobalCopyWorkbenchV21() {
  const heading = useId(), [choice, setChoice] = useState("0");
  const [input, setInput] = useState<PhysicalCopyInputV21 | null>(PHYSICAL_COPY_RETAINED_V21[0].input);
  const [file, setFile] = useState<File | null>(null), [explicit, setExplicit] = useState(false), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Bundled actual qualified CLI output. No new kernel execution.");
  const generation = useRef(0), reading = useRef<AbortController | null>(null);
  useEffect(() => () => { generation.current++; reading.current?.abort(); }, []);
  function clear() { generation.current++; reading.current?.abort(); reading.current = null; setBusy(false); setInput(null); }
  async function read() {
    clear(); setChoice("local");
    if (!explicit || !file) { setNotice("Choose a file and explicitly select --diagnostic-kir-v21."); return; }
    if (file.size <= 0 || file.size > PHYSICAL_COPY_LIMITS_V21.fileBytes) {
      setNotice("V21 container refused before reading: at most 256 KiB."); return;
    }
    setNotice("Reading local unverified recording; previous values cleared.");
    const current = generation.current, controller = new AbortController(); reading.current = controller; setBusy(true);
    try {
      const containerUtf8 = await readResourceImportFile(file, controller.signal);
      if (current === generation.current) {
        setInput({ containerUtf8 });
        setNotice("Caller-supplied / unverified recording. Declared source and locator metadata are not authenticated.");
      }
    } catch (error) {
      controller.abort();
      if (current === generation.current) setNotice(error instanceof Error ? error.message.slice(0, 200) : "Local V21 file refused.");
    } finally { if (current === generation.current) { reading.current = null; setBusy(false); } }
  }
  return <section className="physical-debug-v20" aria-labelledby={heading}>
    <h3 id={heading}>Global-copy V21: recorded input, readiness and output</h3>
    <label>Retained V21 command session <select aria-label="Retained V21 command session" value={choice}
      onChange={event => { clear(); const next = event.target.value; setChoice(next);
        if (next !== "local") { setInput(PHYSICAL_COPY_RETAINED_V21[Number(next)].input);
          setNotice("Bundled actual qualified CLI output. No new kernel execution."); }
        else setNotice("Local unverified container selected; no recording loaded."); }}>
      {PHYSICAL_COPY_RETAINED_V21.map((item, i) => <option key={item.label} value={i}>{item.label}</option>)}
      <option value="local">Local unverified container</option>
    </select></label>
    <p>Six retained sessions cover original/register-edited source, 64/128 workitems, and zero/partial output extents.
      They are CPU observations; no native-register capture is inferred.</p>
    <details><summary>Display your own complete V21 recording</summary>
      <form onSubmit={event => { event.preventDefault(); void read(); }}>
        <label><input type="checkbox" checked={explicit} onChange={event => { clear(); setExplicit(event.target.checked); }} />
          I selected --diagnostic-kir-v21 and understand this is an unverified recording</label>
        <label>V21 recording container<input type="file" accept=".json" onChange={event => {
          clear(); setFile(event.target.files?.[0] ?? null); setChoice("local");
          setNotice("Local file selected; previous values cleared.");
        }} /></label>
        <p>One nonempty file at most 256 KiB, checked before reading. The closed schema requires exact request text,
          complete paired JSONL and declared locator metadata. No arbitrary source, KIR or hardware-register import.</p>
        <button type="submit" disabled={busy}>Read local V21 recording</button>
        <button type="button" onClick={() => { clear(); setChoice("local"); setNotice("V21 recording cleared."); }}>Clear V21 recording</button>
      </form>
    </details>
    <p role="status">{notice}</p>
    <PhysicalGlobalCopyObservationV21 input={input} />
    <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/physical-global-copy-recorded-viewer-v21.md">
      V21 recording tutorial, format and limits</a>. Compiler pins and milestone maturity are unchanged.</p>
  </section>;
}
