import { useId, useState } from "react";
import {
  projectResourceAccessResponse, resourceAccessRangeLabel, resourceAccessScopeLabel,
  RESOURCE_ACCESS_VISIBLE_ROWS, type ResourceAccessProjection, type ResourceAccessProjectionInput,
} from "../content/resource-access-view";
import { resourceAccessNavigation, resourceAccessPageKey, type ResourceAccessSelection } from "../content/resource-access-navigation";
import "./ResourceAccessView.css";

export interface ResourceAccessViewProps extends ResourceAccessProjectionInput {
  title?: string;
}

type Ready = Extract<ResourceAccessProjection, { status: "ready" }>;

function CapturedResourcePage({ projection }: { projection: Ready }) {
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState<ResourceAccessSelection | null>(null);
  const navigation = projection.kind === "memory_accesses" ? resourceAccessNavigation(projection, selection) : null;
  const rows = navigation?.rows ?? projection.rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / RESOURCE_ACCESS_VISIBLE_ROWS));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * RESOURCE_ACCESS_VISIBLE_ROWS;
  const end = Math.min(start + RESOURCE_ACCESS_VISIBLE_ROWS, rows.length);
  const completeness = projection.completeness;
  function selectEvent(eventSequence: number) {
    if (!navigation) return;
    const index = navigation.rows.findIndex((row) => row.occurrence.event_sequence === eventSequence);
    if (index < 0) return;
    setSelection({ ...navigation.selection, eventSequence });
    setPage(Math.floor(index / RESOURCE_ACCESS_VISIBLE_ROWS));
  }
  return <>
    <p className="resource-access-summary">
      Cursor {projection.anchor.cursor.event_sequence} · revision {projection.anchor.cursor.state_revision} · request {projection.requestId}
      <br />{resourceAccessScopeLabel(projection.anchor.scope)}
      <br />This response scanned {projection.scanned} of {projection.sourceCount} raw source entries and returned {projection.rows.length} rows.
      Raw source entries are not the count of matching accesses.
    </p>
    {completeness.status === "truncated" ? <p className="resource-access-notice" role="status">
      Partial retained capture: {completeness.reason}. {completeness.emitted_events} emitted events;
      {completeness.dropped_events === undefined ? " dropped count unavailable" : ` ${completeness.dropped_events} dropped events`}.
      Missing accesses must not be interpreted as no activity.
    </p> : <p>Retained capture: complete. This response remains one bounded query page.</p>}
    {projection.hasMorePages && <p className="resource-access-notice" role="status">
      More backend pages exist. This read-only view does not fetch them; an empty page does not mean the history is empty.
    </p>}
    {navigation && <div className="resource-access-navigation">
      <label className="resource-access-filter">Logical wave in this captured page
        <select aria-label="Filter captured access rows by logical wave" value={navigation.selection.waveKey ?? "all"}
          onChange={(event) => { setSelection({ ...navigation.selection, waveKey: event.target.value === "all" ? null : event.target.value, scopeKey: null, eventSequence: null }); setPage(0); }}>
          <option value="all">All observed waves and scopes</option>
          {navigation.waveOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
      <label className="resource-access-filter">Logical lane / scope in selected wave
        <select aria-label="Filter captured access rows by logical scope" value={navigation.selection.scopeKey ?? "all"}
          onChange={(event) => { setSelection({ ...navigation.selection, scopeKey: event.target.value === "all" ? null : event.target.value, eventSequence: null }); setPage(0); }}>
          <option value="all">All scopes in this captured page</option>
          {navigation.scopeOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
      <p>Only scopes occurring in this retained page are selectable. A missing lane is not evidence of inactivity.
        Wave and lane numbers are logical; workgroup and wave width remain part of the selection.</p>
      <div className="resource-access-pagination" aria-label="Retained access event navigation">
        <button type="button" disabled={navigation.selectedIndex <= 0}
          onClick={() => selectEvent(navigation.rows[navigation.selectedIndex - 1].occurrence.event_sequence)}>Previous retained access</button>
        <label className="resource-access-filter">Selected retained access
          <select aria-label="Selected retained access event" value={navigation.selected?.occurrence.event_sequence ?? "none"} disabled={navigation.rows.length === 0}
            onChange={(event) => selectEvent(Number(event.target.value))}>
            {!navigation.selected && <option value="none">No selected retained access</option>}
            {navigation.rows.map((row) => <option key={row.occurrence.event_sequence} value={row.occurrence.event_sequence}>
              Event {row.occurrence.event_sequence} — {resourceAccessScopeLabel(row.occurrence.scope)}
            </option>)}
          </select>
        </label>
        <button type="button" disabled={navigation.rows.length === 0 || navigation.selectedIndex + 1 >= navigation.rows.length}
          onClick={() => selectEvent(navigation.rows[navigation.selectedIndex + 1].occurrence.event_sequence)}>Next retained access</button>
      </div>
      <div className="resource-access-selected" aria-live="polite" aria-atomic="true" data-testid="selected-retained-access">
        {navigation.selected ? <p>Selected retained event <strong>{navigation.selected.occurrence.event_sequence}</strong>:
          {" "}{resourceAccessScopeLabel(navigation.selected.occurrence.scope)}; {navigation.selected.access.replaceAll("_", " ")};
          {" "}alloc#{navigation.selected.allocation.ordinal}:g{navigation.selected.allocation.generation}; byte range {resourceAccessRangeLabel(navigation.selected)}.</p>
          : <p>No retained access is selected in this page.</p>}
        <p>The selected checkpoint remains cursor {projection.anchor.cursor.event_sequence}, revision {projection.anchor.cursor.state_revision}.
          Selecting an access does not restore its event, change this snapshot, or show memory bytes at that access.
          Intermediate events and per-access source associations are unavailable here.</p>
      </div>
    </div>}
    <div className="resource-access-pagination" aria-label="Captured resource row pagination">
      <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous rows</button>
      <span aria-live="polite">Rows {rows.length === 0 ? 0 : start + 1}–{end} of {rows.length} in this captured page</span>
      <button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next rows</button>
    </div>
    {rows.length === 0 ? <p role="status">No matching rows in this captured page. No claim is made about other pages or uncaptured activity.</p> : <div className="resource-access-table-wrap">
      {projection.kind === "allocations" ? <table aria-label="Captured allocation inventory">
        <thead><tr><th scope="col">Allocation</th><th scope="col">Address space</th><th scope="col">Permission</th><th scope="col">Capacity (bytes)</th><th scope="col">Alignment (bytes)</th><th scope="col">Checkpoint capture</th></tr></thead>
        <tbody>{projection.rows.slice(start, end).map((row) => <tr key={row.allocation.ordinal}>
          <th scope="row">alloc#{row.allocation.ordinal}:g{row.allocation.generation}</th>
          <td>{row.address_space}</td><td>{row.access.replaceAll("_", " ")}</td><td><code>{row.capacity_bytes}</code></td><td>{row.alignment}</td>
          <td>Bytes and initialization captured; query byte ranges separately</td>
        </tr>)}</tbody>
      </table> : <table aria-label="Captured memory access occurrences">
        <thead><tr><th scope="col">Event / ordinal</th><th scope="col">Logical scope</th><th scope="col">Access</th><th scope="col">Allocation</th><th scope="col">Byte range [start, end)</th><th scope="col">KIR site</th><th scope="col">CPU schedule</th></tr></thead>
        <tbody>{navigation!.rows.slice(start, end).map((row) => <tr key={row.occurrence.event_sequence} aria-current={navigation!.selected === row ? "true" : undefined}>
          <th scope="row"><button type="button" aria-label={`Select retained access event ${row.occurrence.event_sequence}`}
            onClick={() => selectEvent(row.occurrence.event_sequence)}>{row.occurrence.event_sequence} / {row.occurrence.record_ordinal}</button></th>
          <td>{resourceAccessScopeLabel(row.occurrence.scope)}</td><td>{row.access.replaceAll("_", " ")}</td>
          <td>alloc#{row.allocation.ordinal}:g{row.allocation.generation}<br />{row.address_space}</td>
          <td><code>{resourceAccessRangeLabel(row)}</code><br />{row.range.byte_len} bytes</td>
          <td>function {row.occurrence.site.function_ordinal}, block {row.occurrence.site.block_ordinal}, {row.occurrence.site.point.kind === "operation" ? `operation ${row.occurrence.site.point.operation_ordinal}` : row.occurrence.site.point.kind}</td>
          <td>{row.occurrence.schedule.identity}<br />Decision {row.occurrence.schedule.decision_ordinal}</td>
        </tr>)}</tbody>
      </table>}
    </div>}
    <p className="resource-access-boundary">
      Allocation generation 0 is this CPU producer&apos;s profile, not evidence of a lifecycle.
      Owning scope, allocation lifetime, physical LDS base, physical registers, bank conflicts, and GPU timing are unavailable.
      {projection.kind === "memory_accesses" && " Each row is a retained simulator access occurrence, not a physical transaction; its call frame, operation occurrence, and source association are unavailable."}
    </p>
    <details className="resource-access-provenance"><summary>Selection and provenance</summary>
      <dl>
        <dt>Configuration</dt><dd><code>{projection.anchor.cursor.configuration_identity}</code></dd>
        <dt>Selected checkpoint source</dt><dd>{projection.anchor.site?.source.status === "resolved"
          ? `${projection.anchor.site.source.location.provenance}; source bytes [${projection.anchor.site.source.location.byte_start}, ${projection.anchor.site.source.location.byte_end})`
          : "unavailable"}. This is a checkpoint association, not source attribution for every access row.</dd>
        <dt>Caller-owned context</dt><dd>{projection.context.connectionId}; target {projection.context.target ?? "unavailable"}. Context fields are stale-state fences, not backend attestations.</dd>
      </dl>
    </details>
  </>;
}

export function ResourceAccessView({ title = "Captured resource observations", ...input }: ResourceAccessViewProps) {
  const headingId = useId();
  const projection = projectResourceAccessResponse(input);
  return <section className="resource-access-view" aria-labelledby={headingId}>
    <h3 id={headingId}>{title}</h3>
    <p className="resource-access-provenance-label">CPU replay · simulated observation · read-only captured page</p>
    {projection.status === "ready" ? <CapturedResourcePage
      key={resourceAccessPageKey(projection)}
      projection={projection}
    /> : <p role="status" data-state={projection.status}>{projection.detail} No prior resource rows are shown.</p>}
  </section>;
}
