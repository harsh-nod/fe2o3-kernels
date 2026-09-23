import { useId, useState } from "react";
import type { CpuLiveCheckpoint, CpuLiveQueryCollection, CpuLiveQuerySelection } from "../lib/cpu-live-query-collection";
import type { ResourceAccessSelection } from "../content/resource-access-navigation";
import { resourceSnapshotAnchorKey } from "../content/resource-memory-view";
import { ResourceAccessView } from "./ResourceAccessView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import "./LiveCpuCheckpointDashboard.css";

export interface LiveCpuCheckpointDashboardProps {
  checkpoint: CpuLiveCheckpoint | null;
  collection: CpuLiveQueryCollection | null;
  busy: boolean;
  remainingCommands: number;
  onRefresh: (selection?: CpuLiveQuerySelection) => void;
}
const U64 = 0xffffffffffffffffn;
function decimal(value: string): bigint | null {
  return /^(0|[1-9][0-9]{0,19})$/u.test(value) && BigInt(value) <= U64 ? BigInt(value) : null;
}
function sameCheckpoint(left: CpuLiveCheckpoint, right: CpuLiveCheckpoint): boolean {
  return left.anchorKey === right.anchorKey && resourceSnapshotAnchorKey(left.anchor) === left.anchorKey &&
    resourceSnapshotAnchorKey(right.anchor) === left.anchorKey && left.control.requestId === right.control.requestId &&
    (["connectionId", "captureIdentity", "target", "variantIdentity"] as const)
      .every(field => left.context[field] === right.context[field]);
}
function sameSelection(left: CpuLiveQuerySelection | null, right: CpuLiveQuerySelection | null): boolean {
  return left !== null && right !== null && left.ordinal === right.ordinal &&
    left.generation === right.generation && left.byteOffset === right.byteOffset && left.byteLength === right.byteLength;
}
function SourceValues({ collection }: { collection: CpuLiveQueryCollection }) {
  const projection = collection.source;
  return <section aria-label="Live source variables" className="live-cpu-query-table">
    <h4>Source variables</h4>
    <p>These named bindings are separate from SSA identities. Equal names or bits do not establish a mapping.</p>
    {projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No prior source rows are substituted.</p> : <>
      <p>Source-variable frame {projection.stackFrame.frame}, legacy occurrence 1. This explicitly refines the unframed
        checkpoint; it is not the same anchor or a dynamic invocation identity.</p>
      <p>Function {projection.stackFrame.functionOrdinal}, block {projection.stackFrame.blockOrdinal},
        next operation {projection.stackFrame.nextOperation}. Binding generation below is not allocation generation.</p>
      {projection.rows.length === 0 ? <p role="status">No source rows in the complete selected response; this does not prove the source has no variables.</p> :
        <table aria-label="Live checkpoint source-variable table">
          <thead><tr><th scope="col">Variable</th><th scope="col">Binding</th><th scope="col">Availability</th><th scope="col">Representation</th></tr></thead>
          <tbody>{projection.rows.map(row => <tr key={row.identity}>
            <th scope="row">{row.name}<details><summary>Source binding identity</summary><code>{row.identity}</code></details></th>
            <td><span className="live-cpu-query-field" aria-hidden="true">Binding</span>
              Function {row.functionOrdinal}; lexical depth {row.scopeDepth}; binding generation {row.generation}
              <details><summary>Lexical scope identity</summary><code>{row.scopeIdentity}</code></details></td>
            <td><span className="live-cpu-query-field" aria-hidden="true">Availability</span>{row.typeLabel}<br />{row.status}</td>
            <td><span className="live-cpu-query-field" aria-hidden="true">Representation</span><code>{row.representation}</code><br />{row.interpretation}</td>
          </tr>)}</tbody>
        </table>}
    </>}
    <p>One source page of at most 16 rows is requested. A cursor means the table is incomplete and is not displayed
      as a complete source view. Unsupported locals, ambiguous bindings and redacted values remain distinct.</p>
  </section>;
}
function SsaValues({ collection }: { collection: CpuLiveQueryCollection }) {
  const projection = collection.values;
  return <section aria-label="Live SSA values" className="live-cpu-query-table">
    <h4>SSA values</h4>
    <p>Whole SSA values from the exact selected control snapshot, not values at a selected historical memory access.</p>
    {projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No earlier SSA table is retained.</p> :
      projection.rows.length === 0 ? <p role="status">No retained SSA rows; absence here does not establish that no values exist.</p> :
        <table aria-label="Live checkpoint SSA table">
          <thead><tr><th scope="col">SSA identity</th><th scope="col">Availability</th><th scope="col">Representation</th></tr></thead>
          <tbody>{projection.rows.map(row => <tr key={row.key}>
            <th scope="row">Function {row.functionOrdinal}; frame {row.frame}; value %{row.valueOrdinal}</th>
            <td><span className="live-cpu-query-field" aria-hidden="true">Availability</span>{row.typeLabel}<br />{row.status}</td>
            <td><span className="live-cpu-query-field" aria-hidden="true">Representation</span><code>{row.representation}</code><br />{row.interpretation}</td>
          </tr>)}</tbody>
        </table>}
    <p>At most 64 whole SSA rows and scalar widths up to 64 bits. Pointer text is allocation-relative,
      not a native address, dereference or inferred named-variable correspondence.</p>
  </section>;
}
function SelectedCheckpoint({ checkpoint, collection, busy, remainingCommands, onRefresh }: LiveCpuCheckpointDashboardProps & {
  checkpoint: CpuLiveCheckpoint;
}) {
  const [ordinal, setOrdinal] = useState(""), [byteOffset, setByteOffset] = useState("0"), [byteLength, setByteLength] = useState("1");
  const [selectedAccess, setSelectedAccess] = useState<ResourceAccessSelection | null>(null), [showOverlay, setShowOverlay] = useState(false);
  const current = !busy && collection && sameCheckpoint(checkpoint, collection.checkpoint) ? collection : null;
  const sourceCurrent = !current || current.source.status !== "ready" ||
    resourceSnapshotAnchorKey(current.source.checkpointAnchor) === checkpoint.anchorKey;
  const valuesCurrent = !current || current.values.status !== "ready" ||
    resourceSnapshotAnchorKey(current.values.anchor) === checkpoint.anchorKey;
  const resourcesCurrent = [current?.allocations, current?.accesses, current?.memory].every(projection =>
    !projection || projection.status !== "ready" || projection.anchorKey === checkpoint.anchorKey);
  const visible = sourceCurrent && valuesCurrent && resourcesCurrent ? current : null;
  const rows = visible?.allocations?.status === "ready" && visible.allocations.kind === "allocations" ? visible.allocations.rows : [];
  const allocation = rows.find(row => String(row.allocation.ordinal) === ordinal && row.allocation.generation === 0);
  const offset = decimal(byteOffset), length = decimal(byteLength), capacity = allocation ? decimal(allocation.capacity_bytes) : null;
  const selection: CpuLiveQuerySelection | null = allocation && offset !== null && length !== null && capacity !== null &&
    length >= 1n && length <= 4096n && offset + length <= capacity && offset + length <= U64
    ? { ordinal, generation: "0", byteOffset, byteLength } : null;
  const rangeCurrent = visible !== null && sameSelection(selection, visible.selection);
  function resetAccess() { setSelectedAccess(null); setShowOverlay(false); }
  function refresh(selected?: CpuLiveQuerySelection) { resetAccess(); onRefresh(selected); }
  const anchor = checkpoint.anchor, source = anchor.site?.source;
  return <>
    <p data-testid="live-query-checkpoint">Event {anchor.cursor.event_sequence}; revision {anchor.cursor.state_revision};
      control request {checkpoint.control.requestId}. All displayed tables are fenced to this checkpoint and connection.</p>
    <details><summary>Live checkpoint and source identity</summary><dl>
      <dt>Configuration</dt><dd><code>{anchor.cursor.configuration_identity}</code></dd>
      <dt>KIR site</dt><dd>{anchor.site ? <>Function {anchor.site.kir.function_ordinal}, block {anchor.site.kir.block_ordinal},
        {anchor.site.kir.point.kind}{anchor.site.kir.point.kind === "operation" ? " " + anchor.site.kir.point.operation_ordinal : ""}</> : "Unavailable"}</dd>
      <dt>Source location</dt><dd>{source?.status === "resolved" ? <>
        Backend-reported {source.location.provenance}; not source authentication.<br />
        Map <code>{source.location.map_identity}</code><br />File <code>{source.location.file_identity}</code><br />
        Byte span [{source.location.byte_start}, {source.location.byte_end}).
      </> : source?.status === "unavailable" ? source.reason : "Unavailable"}</dd>
      <dt>Unframed checkpoint</dt><dd>No frame or dynamic activation is inferred. Source text is not fetched.</dd>
    </dl></details>
    <button type="button" disabled={busy || remainingCommands < 3} onClick={() => refresh()}>Refresh source and inventory</button>
    <p>Explicit refresh uses at most 3 read-only commands for stack, source variables and the first allocation page.
      It does not step, mutate filters, traverse pages or poll in the background.</p>
    {busy ? <p role="status">Collecting one bounded checkpoint view. Previous query tables are cleared.</p> : !visible ?
      <p role="status">No synchronized dashboard is available for this checkpoint. Use explicit refresh; stale or mismatched collections are not displayed.</p> : <>
        <p role="status">{visible.detail}</p>
        <SourceValues collection={visible} /><SsaValues collection={visible} />
        {visible.allocationsInput ? <ResourceAccessView {...visible.allocationsInput} title="Live allocation inventory" /> :
          <p role="status">Allocation inventory unavailable at this checkpoint.</p>}
        <fieldset disabled={busy} className="live-cpu-query-selection">
          <legend>Choose a retained allocation and byte window</legend>
          <label>Live CPU allocation<select aria-label="Live CPU allocation" value={allocation ? ordinal : ""}
            onChange={event => { setOrdinal(event.target.value); resetAccess(); }}>
            <option value="">Select an allocation from this actual page</option>
            {rows.map(row => <option key={row.allocation.ordinal} value={String(row.allocation.ordinal)}>
              alloc#{row.allocation.ordinal}:g0 — {row.capacity_bytes} bytes
            </option>)}
          </select></label>
          <label>Live CPU byte offset<input aria-label="Live CPU byte offset" inputMode="numeric" autoComplete="off" maxLength={20}
            value={byteOffset} onChange={event => { setByteOffset(event.target.value); resetAccess(); }} /></label>
          <label>Live CPU byte length<input aria-label="Live CPU byte length" inputMode="numeric" autoComplete="off" maxLength={4}
            value={byteLength} onChange={event => { setByteLength(event.target.value); resetAccess(); }} /></label>
          <button type="button" disabled={!selection || remainingCommands < 5} onClick={() => { if (selection) refresh(selection); }}>Read selected allocation</button>
          <p>The selected allocation must occur in this inventory page; generation is exactly 0. Offset and length are
            decimal bytes within its reported capacity, length 1..4096. Defaults are query inputs, not observed values.
            This refresh rechecks the inventory and uses at most 5 read-only commands in total.</p>
        </fieldset>
        {!rangeCurrent ? <p role="status">No current memory/access view matches these selection fields. Read the selected allocation explicitly.</p> : <>
          {visible.accessesInput ? <ResourceAccessView {...visible.accessesInput} title="Live retained memory accesses"
            selection={selectedAccess} onSelectionChange={setSelectedAccess} /> :
            <p role="status">Retained accesses unavailable for the selected allocation.</p>}
          <label className="live-cpu-query-overlay"><input type="checkbox" checked={showOverlay}
            disabled={!visible.accessesInput || !visible.memoryInput}
            onChange={event => setShowOverlay(event.target.checked)} />Overlay selected historical access range</label>
          <p>A selected access is historical. Its range may be marked over current checkpoint storage; it does not restore
            the access event or supply its event-time bytes, source binding, call frame or dynamic occurrence.</p>
          {visible.memoryInput ? <ResourceMemoryView {...visible.memoryInput} title="Live checkpoint memory grid"
            memoryContext={checkpoint.context}
            accessOverlay={showOverlay && visible.accessesInput ? {
              access: visible.accessesInput, selection: selectedAccess, memoryContext: checkpoint.context,
            } : undefined} /> : <p role="status">No memory window was returned for this selection.</p>}
        </>}
        <p>Retained {visible.replies.length} correlated replies ({visible.responseBytes} HTTP response bytes).
          The collector keeps at most 2 MiB; these are losslessly re-encoded protocol facts, not original JSONL or a capture receipt.</p>
      </>}
  </>;
}
export function LiveCpuCheckpointDashboard(props: LiveCpuCheckpointDashboardProps) {
  const heading = useId();
  const checkpoint = props.checkpoint && resourceSnapshotAnchorKey(props.checkpoint.anchor) === props.checkpoint.anchorKey
    ? props.checkpoint : null;
  const key = checkpoint ? checkpoint.anchorKey + ":" + checkpoint.context.connectionId + ":" + checkpoint.control.requestId : "unavailable";
  return <section className="live-cpu-checkpoint-dashboard" aria-labelledby={heading}>
    <h3 id={heading}>Live CPU checkpoint dashboard</h3>
    <p>Source variables, SSA values, resource inventory and initialized bytes come from separate validated queries.
      They are synchronized only by the exact selected session and cursor; no values are guessed.</p>
    <p>{props.remainingCommands} commands remain in this connection&apos;s shared budget.</p>
    {checkpoint ? <SelectedCheckpoint key={key} {...props} checkpoint={checkpoint} /> :
      <p>No supported captured operation-step checkpoint is selected. Step explicitly to a captured checkpoint.
        Uncaptured watchpoint or terminal stops have no dashboard values; earlier rows are never carried forward.</p>}
    <p>No GPU, physical register, allocation lifetime/reuse, general local-variable reconstruction, authenticated source,
      proof or performance claim is made. Inexact integer metadata is refused by the presentation layer, never rounded.
      Recorded resource examples and their controls remain separate.</p>
  </section>;
}
