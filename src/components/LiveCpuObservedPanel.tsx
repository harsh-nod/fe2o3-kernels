import { useId, useState } from "react";
import type { CpuBridgeReply } from "../lib/cpu-debug-session";
import type { CpuLiveCheckpoint } from "../lib/cpu-live-query-collection";
import { observedCollectionKey, validateObservedSelection, type CpuObservedCollection, type CpuObservedSelection } from "../lib/cpu-observed-collection";
import { stable, uint, type ObservedRow } from "../lib/cpu-observed-validation";
import "./LiveCpuObservedPanel.css";

export interface LiveCpuObservedPanelProps {
  collection: CpuObservedCollection | null;
  checkpoint: CpuLiveCheckpoint | null;
  enabled: boolean;
  busy: boolean;
  remainingCommands: number;
  onRefresh: (selection?: CpuObservedSelection) => void;
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "bigint" || typeof value === "number") return String(value);
  return JSON.stringify(value, (_, v: unknown) => typeof v === "bigint" ? v.toString() : v) ?? "unavailable";
}
function record(value: unknown): ObservedRow { return value as ObservedRow; }
function availability(reply: CpuBridgeReply | null): string {
  if (!reply) return "Not queried; no earlier reply is substituted.";
  return reply.response.status === "ok" ? "Available at this exact cursor." :
    reply.response.status === "unavailable" ? "Unavailable: " + String(reply.response.reason) :
      "The current query was refused; no earlier rows are substituted.";
}
function paging(reply: CpuBridgeReply | null): string {
  if (reply?.response.status !== "ok" || !reply.response.page) return "";
  const page = record(reply.response.page);
  return "Examined " + text(page.scanned) + " of " + text(page.source_count) +
    " retained source entries. " + (page.next_token ? "More entries omitted; this panel does not follow cursors." : "End of this retained prefix.");
}
function checkpointMatches(checkpoint: CpuLiveCheckpoint | null, collection: CpuObservedCollection): checkpoint is CpuLiveCheckpoint {
  if (!checkpoint || collection.runtime.response.status !== "ok" || checkpoint.values.status !== "ready") return false;
  try {
    const bound = record(collection.runtime.response.binding), cursor = record(bound.cursor);
    return checkpoint.context.connectionId === collection.runtime.connectionId &&
      checkpoint.context.captureIdentity === collection.runtime.session.configuration_identity &&
      checkpoint.anchor.cursor.configuration_identity === cursor.configuration_identity &&
      uint(checkpoint.anchor.cursor.event_sequence) === uint(cursor.event_sequence) &&
      uint(checkpoint.anchor.cursor.state_revision) === uint(cursor.state_revision);
  } catch { return false; }
}
function Frames({ collection, checkpoint }: { collection: CpuObservedCollection; checkpoint: CpuLiveCheckpoint | null }) {
  const runtime = collection.runtime.response, frames = collection.frames;
  const values = checkpointMatches(checkpoint, collection) && checkpoint.values.status === "ready" ? checkpoint.values.rows : null;
  return <section aria-label="Actual runtime frames"><h4>Actual frame activations</h4>
    <p>These identities come from actual simulator calls. Depth is only a same-checkpoint join coordinate.</p>
    {frames.length === 0 ? <p role="status">No actual frame roster: {text(record(runtime.frames ?? {}).reason ?? runtime.reason ?? runtime.status)}.
      Memory-watch and terminal records never inherit a prior checkpoint stack.</p> :
      frames.map(frame => {
        const operation = record(frame.operation), parent = record(frame.parent);
        const rows = values?.filter(value => value.frame === String(uint(frame.legacy_depth) + 1n) &&
          value.functionOrdinal === frame.function_ordinal) ?? null;
        return <section key={String(frame.activation)} aria-label={"Activation " + text(frame.activation)}>
          <h5>Activation {text(frame.activation)} — {text(operation.state)}</h5>
          <p>Function {text(frame.function_ordinal)}; raw block ID {text(frame.block)}; legacy depth {text(frame.legacy_depth)};
            next operation {frame.next_operation === undefined ? "absent" : text(frame.next_operation)}.
            {operation.attempt !== undefined && <> Actual attempt {text(operation.attempt)} at operation {text(record(operation.site).operation)}.</>}</p>
          <p>{parent.parent === "root" ? "Root activation." :
            <>Caller activation {text(parent.activation)}, call attempt {text(parent.attempt)}, site {text(parent.call_site)}.</>}</p>
          <p>SSA context for this exact {operation.state === "suspended" ? "suspended caller" : "current frame"}:</p>
          {rows === null ? <p role="status">No matching real checkpoint values are available. Identities do not manufacture values.</p> :
            rows.length === 0 ? <p>No retained whole SSA rows for this frame.</p> :
              <table><thead><tr><th scope="col">SSA value</th><th scope="col">Availability</th><th scope="col">Representation</th></tr></thead>
                <tbody>{rows.map(row => <tr key={row.key}><th scope="row">%{row.valueOrdinal}</th>
                  <td>{row.typeLabel}; {row.status}</td><td><code>{row.representation}</code></td></tr>)}</tbody></table>}
        </section>;
      })}
    <p>Named source bindings remain separate. No name-to-SSA correspondence or physical register mapping is inferred.</p>
  </section>;
}
function Collected({ collection, checkpoint, enabled, busy, remainingCommands, onRefresh }: LiveCpuObservedPanelProps & { collection: CpuObservedCollection }) {
  const previous = collection.selection;
  const [selected, setSelected] = useState(() => previous ? stable({ allocation: previous.allocation,
    storage_slot: previous.storageSlot, generation: previous.generation }) : "");
  const [offset, setOffset] = useState(previous?.byteOffset ?? "0"), [length, setLength] = useState(previous?.byteLength ?? "1");
  const runtime = collection.runtime.response;
  const allocation = collection.allocations.find(row => stable(record(row.descriptor).identity) === selected);
  let selection: CpuObservedSelection | null = null;
  try {
    if (allocation) {
      const descriptor = record(allocation.descriptor), identity = record(descriptor.identity);
      const parsed = validateObservedSelection({ allocation: String(identity.allocation), storageSlot: String(identity.storage_slot),
        generation: String(identity.generation), byteOffset: offset, byteLength: length });
      if (BigInt(parsed.byteOffset) + BigInt(parsed.byteLength) <= BigInt(String(descriptor.byte_len))) selection = parsed;
    }
  } catch { /* Invalid fields never authorize a request or show old bytes. */ }
  const selectedData = selection !== null && stable(selection) === stable(collection.selection);
  const lifecycle = collection.lifecycle?.response.status === "ok" ? record(collection.lifecycle.response.result).transitions : null;
  const accesses = selectedData && collection.accesses?.response.status === "ok" ? record(collection.accesses.response.result).accesses : null;
  const memory = selectedData && collection.memory?.response.status === "ok" ? record(record(collection.memory.response.result).memory) : null;
  return <>
    <p>Event {collection.runtime.session.cursor.event_sequence}; revision {collection.runtime.session.revision}.
      The owner, full cursor, accepted connection and bridge session fence every table.</p>
    {runtime.status !== "ok" ? <p role="status">{availability(collection.runtime)}</p> : <>
      <dl className="live-cpu-observed-facts">
        <dt>Capture owner</dt><dd>{text(record(runtime.binding).owner)}</dd>
        <dt>Full invocation</dt><dd>{text(runtime.invocation)}</dd>
        <dt>Current operation origin</dt><dd>{text(runtime.origin)}</dd>
        <dt>Legacy capture completeness</dt><dd>{text(runtime.completeness)}</dd>
        <dt>Operation metadata coverage</dt><dd>{text(runtime.origin_coverage)}</dd>
        <dt>Frame metadata coverage</dt><dd>{text(runtime.frame_coverage)}</dd>
        <dt>Allocation metadata coverage</dt><dd>{text(runtime.lifecycle_coverage)}</dd>
        <dt>Actual allocation watermark</dt><dd>{text(runtime.allocation_watermark)}</dd>
      </dl>
      <Frames collection={collection} checkpoint={checkpoint} />
    </>}
    <section aria-label="Current storage incarnations"><h4>Current storage incarnations</h4>
      <p>{availability(collection.inventory)} {paging(collection.inventory)}</p>
      {collection.allocations.length > 0 && <table><thead><tr><th scope="col">Semantic allocation</th><th scope="col">Storage slot</th>
        <th scope="col">Generation</th><th scope="col">Space / size</th><th scope="col">Actual creation scope</th></tr></thead>
        <tbody>{collection.allocations.map(row => { const descriptor = record(row.descriptor), id = record(descriptor.identity);
          return <tr key={stable(id)}><th scope="row">{text(id.allocation)}</th><td>{text(id.storage_slot)}</td><td>{text(id.generation)}</td>
            <td>{text(descriptor.address_space)} / {text(descriptor.byte_len)} bytes</td><td>{text(descriptor.owning_scope)}</td></tr>; })}</tbody></table>}
      <fieldset disabled={!enabled || busy}><legend>Read one exact observed storage incarnation</legend>
        <label>Observed storage allocation<select value={selected} onChange={event => setSelected(event.target.value)}>
          <option value="">Select from this actual inventory page</option>
          {collection.allocations.map(row => { const id = record(record(row.descriptor).identity);
            return <option key={stable(id)} value={stable(id)}>Allocation {text(id.allocation)} / slot {text(id.storage_slot)} / generation {text(id.generation)}</option>; })}
        </select></label>
        <label>Observed byte offset<input value={offset} inputMode="numeric" maxLength={20} onChange={event => setOffset(event.target.value)} /></label>
        <label>Observed byte length<input value={length} inputMode="numeric" maxLength={4} onChange={event => setLength(event.target.value)} /></label>
        <button type="button" disabled={!selection || remainingCommands < 6} onClick={() => { if (selection) onRefresh(selection); }}>Read observed storage</button>
      </fieldset>
      <p>All three allocation/slot/generation fields must match a newly checked inventory. Length is 1..4096 bytes.
        Editing any selection field immediately hides prior memory and access rows.</p>
    </section>
    <section aria-label="Actual allocation lifecycle"><h4>Actual allocation lifecycle</h4>
      <p>{availability(collection.lifecycle)} {paging(collection.lifecycle)}</p>
      {Array.isArray(lifecycle) && lifecycle.length > 0 && <table><thead><tr><th scope="col">Sequence</th><th scope="col">Transition</th>
        <th scope="col">Allocation / slot / generation</th><th scope="col">Actual predecessor</th></tr></thead><tbody>
        {lifecycle.map(item => { const row = record(item), descriptor = record(row.descriptor), id = record(descriptor.identity), kind = record(row.kind);
          return <tr key={String(row.sequence)}><th scope="row">{text(row.sequence)}</th><td>{text(kind.transition)}</td>
            <td>{text(id.allocation)} / {text(id.storage_slot)} / {text(id.generation)}</td><td>{text(kind.previous_allocation ?? "none")}</td></tr>; })}
      </tbody></table>}
      <p>Release contains no bytes. A predecessor is reported only for an actual allocator pool hit; a reused slot is not a physical GPU address.</p>
    </section>
    {!selectedData ? <p role="status">No memory/access result matches the current selection fields.</p> : <>
      <section aria-label="Observed storage accesses"><h4>Retained accesses for this exact incarnation</h4>
        <p>{availability(collection.accesses)} {paging(collection.accesses)}</p>
        {Array.isArray(accesses) && accesses.length > 0 && <table><thead><tr><th scope="col">Event</th><th scope="col">Access / range</th>
          <th scope="col">Actual operation origin</th></tr></thead><tbody>{accesses.map(item => { const row = record(item), occurrence = record(row.occurrence);
            return <tr key={String(occurrence.event_sequence)}><th scope="row">{text(occurrence.event_sequence)}</th>
              <td>{text(row.access)} {text(row.range)}</td><td>{text(row.origin)}</td></tr>; })}</tbody></table>}
      </section>
      <section aria-label="Observed storage bytes"><h4>Exact current memory window</h4><p>{availability(collection.memory)}</p>
        {memory && <><p>Bytes <code>{text(memory.bytes)}</code></p><p>Initialization mask <code>{text(memory.initialized)}</code></p>
          <p>Uninitialized bytes are not valid values. These are current checkpoint bytes, not bytes reconstructed at a historical access.</p></>}
      </section>
    </>}
    <p>{collection.replies.length} read-only replies; {collection.responseBytes} actual HTTP response bytes, bounded to 2 MiB.
      No cursor traversal, automatic retries or background polling.</p>
  </>;
}
export function LiveCpuObservedPanel(props: LiveCpuObservedPanelProps) {
  const heading = useId();
  const collection = !props.busy && props.collection && props.collection.key === observedCollectionKey(props.collection.runtime)
    ? props.collection : null;
  return <section className="live-cpu-observed-panel" aria-labelledby={heading}>
    <h3 id={heading}>Live CPU runtime and storage observations</h3>
    <p>Requires the bridge owner&apos;s explicit runtime-observations profile. The browser cannot choose executable paths,
      arguments, capture limits or allocation policy. Legacy debugging remains separate.</p>
    <button type="button" disabled={!props.enabled || props.busy || props.remainingCommands < 4}
      onClick={() => props.onRefresh()}>Refresh runtime and storage</button>
    <p>Explicit refresh uses at most four read-only requests; selected storage uses at most six. First pages only: 16 rows / 64 scanned entries.</p>
    {collection ? <Collected key={collection.key} {...props} collection={collection} /> :
      <p role="status">{props.busy ? "Collecting current observations. Previous tables are hidden." :
        "No synchronized observed collection is selected. Refresh explicitly; prior activations and generations are never substituted."}</p>}
    <p>These are CPU semantic observations, not hardware waves, physical registers, native memory addresses, source authentication,
      protected proof or performance predictions. Complete capture metadata does not prove kernel correctness or successful execution.</p>
  </section>;
}
