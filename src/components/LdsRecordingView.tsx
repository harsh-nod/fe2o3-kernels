import { useState } from "react";
import { type LdsRecording } from "../content/physical-lds-debug-v22";
import { type LdsIndexRow } from "../content/physical-lds-debug-v22-index";
import { type Row } from "../content/physical-entry-debug-v20-shapes";
import { ResourceCheckpointValueRows } from "./ResourceCheckpointValuesView";
function description(row: LdsIndexRow): string {
  const p = row.payload;
  if (p.kind === "checkpoint") return p.phase + (p.pending.length ? " · pending SSA " + p.pending.map(p => p.value + ":" + p.kind).join(", ") : " · no pending-read entries");
  if (p.kind === "barrier") return "barrier " + p.action + " · phase " + p.phase + " · participants " + p.participants;
  return p.access + " · " + p.space + " allocation " + p.allocation + " +" + p.offset + " (" + p.bytes + "B)";
}
export function LdsRecordingView({ recording }: { recording: LdsRecording }) {
  const { context, observations } = recording, index = context.index;
  const [event, setEvent] = useState(1), [page, setPage] = useState(0), [observation, setObservation] = useState(0);
  const selected = index.records[event - 1], query = observations[observation];
  function select(sequence: number) { setEvent(sequence); setPage(Math.floor((sequence - 1) / 64)); }
  return <section aria-label="Checked recorded CPU observations">
    <h2>{context.entry}: {index.records.length} indexed events, {observations.length} recorded protocol pairs</h2>
    <p>The complete index contains scope/site/event metadata only. SSA values and memory bytes appear only in the selected sparse JSONL query.
      Selecting an index row does not create an uncaptured snapshot, rerun instructions or resume execution.</p>
    <details><summary>Distinct content identities</summary>
      <dl><dt>Raw index file SHA-256</dt><dd><code>{index.rawDigest}</code></dd>
        <dt>Domain-separated index payload identity</dt><dd><code>{index.payloadDigest}</code></dd>
        <dt>Declared structured canonical identity (not raw file hash)</dt><dd><code>{index.canonicalIdentity}</code></dd>
        <dt>Request document SHA-256</dt><dd><code>{context.documentDigest}</code></dd>
        <dt>CLI configuration identity</dt><dd><code>{index.configuration}</code></dd></dl>
      <p>These are byte/record consistency joins, not source ownership or hardware provenance.</p>
    </details>
    <h3>Allocation lifetimes</h3>
    <table><thead><tr><th>Role joined to recorded root SSA</th><th>Allocation / generation</th><th>Bytes</th><th>First captured checkpoint</th></tr></thead>
      <tbody>{index.allocations.map(a => <tr key={a.ordinal}><td>{a.ordinal === recording.inputAllocation ? "Input · read only" :
        a.ordinal === recording.outputAllocation ? "Output · guarded stores" : "Workgroup LDS"}</td><td>{a.ordinal} /0</td><td>{a.bytes}</td>
        <td><button type="button" onClick={() => select(a.first)}>{a.first}</button></td></tr>)}</tbody></table>
    <p>LDS is absent before its declaration executes. Its first captured bytes are zero-storage but uninitialized, not initialized zeros.</p>
    <h3>Barrier phase0 · event {event}</h3>
    <p>{index.arrivals.filter(s => s <= event).length} /128 arrivals observed by this event.
      {event >= index.release ? " The recorded release has occurred." : " Release has not yet been observed."}
      {" "}Authored publication epoch1 is a separate concept; no publication bitmap is exposed.</p>
    <div className="lds-waves">{[0, 1].map(wave => <section key={wave} aria-label={"Logical wave " + wave}>
      <h4>Logical wave{wave} · local X {wave * 64}–{wave * 64 + 63}</h4>
      <div className="lds-lanes">{Array.from({ length: 64 }, (_, lane) => {
        const local = wave * 64 + lane, arrived = index.arrivals[local] <= event;
        return <button key={lane} type="button" className={arrived ? "lds-arrived" : ""} aria-pressed={selected.local === local}
          title={"local " + local + ", lane " + lane + ", arrival event " + index.arrivals[local] + (arrived ? " observed" : " not yet observed")}
          onClick={() => select(index.arrivals[local])}>{lane}</button>;
      })}</div></section>)}</div>
    <p>Local X={selected.local}, logical wave={selected.wave}, lane={selected.lane}; wave=⌊local X/64⌋, lane=local X mod64.
      These are logical workitems, not a captured hardware wave.</p>
    <div className="lds-actions"><button type="button" onClick={() => select(index.release)}>Jump to recorded release</button>
      <button type="button" onClick={() => select(recording.finalMemoryEvent)}>Jump to final memory checkpoint</button></div>
    <h3>Bounded index page {page + 1} /{Math.ceil(index.records.length / 64)}</h3>
    <div className="lds-actions"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous index page</button>
      <button type="button" disabled={(page + 1) * 64 >= index.records.length} onClick={() => setPage(page + 1)}>Next index page</button></div>
    <div className="lds-table-scroll"><table><thead><tr><th>Sequence</th><th>Local /wave /lane</th><th>Actual KIR site</th><th>Recorded event</th></tr></thead>
      <tbody>{index.records.slice(page * 64, page * 64 + 64).map(row => <tr key={row.sequence} aria-selected={row.sequence === event}>
        <td><button type="button" onClick={() => select(row.sequence)}>{row.sequence}</button></td>
        <td>{row.local} /{row.wave} /{row.lane}</td><td>f{String(row.site.function_ordinal)}:b{String(row.site.block_ordinal)}:op{String((row.site.point as Row).operation_ordinal)}</td>
        <td>{description(row)}</td></tr>)}</tbody></table></div>
    <h3>Observed pending → ready → reverse-pending relations</h3>
    <ul>{recording.transitions.map(t => <li key={t.local + t.kind}>Local{t.local}, SSA{t.value}, {t.kind}:{" "}
      <button type="button" onClick={() => select(t.pending)}>pending event{t.pending}</button>{" → "}
      <button type="button" onClick={() => select(t.ready)}>same-site wait completion{t.ready}</button>.
      Numeric content is unavailable until the actual recorded ready query.</li>)}</ul>
    <h3>Sparse recorded protocol query</h3>
    <label>Recorded request <select value={observation} onChange={e => setObservation(Number(e.target.value))}>
      {observations.map((o, i) => <option key={o.id} value={i}>#{o.id} {o.operation} · event{o.event} · {o.status}</option>)}
    </select></label>
    <p>Revision{query.revision}; event{query.event}. {query.detail}</p>
    {query.anchor ? <p>Snapshot local{query.anchor.local}, wave{query.anchor.wave}, lane{query.anchor.lane}.{" "}
      <button type="button" onClick={() => select(query.event)}>Show this actual indexed checkpoint</button></p> : <p>No snapshot for this selected response. Previous values are not carried forward.</p>}
    {query.values ? <><p>Only this recorded page is shown; no implicit fetch. Pending and symbolic NotRepresented values are opaque.</p>
      <ResourceCheckpointValueRows rows={query.values} /></> : <p>No SSA page captured in this response.</p>}
    {query.memory ? <><h4>{query.memory.space} allocation{query.memory.allocation} · offset{query.memory.offset}</h4>
      <div className="lds-memory">{query.memory.cells.map((c, i) => <span key={i} title={"byte +" + (query.memory!.offset + i) + (c.initialized ? " initialized" : " uninitialized storage")}
        className={c.initialized ? "" : "lds-uninitialized"}>{c.initialized ? c.byte : "??"}</span>)}</div>
      <p>?? denotes uninitialized storage; raw storage bytes remain in the exact response below.</p></> : <p>No memory page captured in this response.</p>}
    <details><summary>Exact selected request and response (not executable)</summary><pre>{query.requestUtf8}</pre><pre>{query.responseUtf8}</pre></details>
  </section>;
}
