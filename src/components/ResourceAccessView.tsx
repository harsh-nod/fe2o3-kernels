import { useId, useState } from "react";
import {
  projectResourceAccessResponse, resourceAccessRangeLabel, resourceAccessScopeLabel,
  RESOURCE_ACCESS_VISIBLE_ROWS, type ResourceAccessProjection, type ResourceAccessProjectionInput,
} from "../content/resource-access-view";
import "./ResourceAccessView.css";

export interface ResourceAccessViewProps extends ResourceAccessProjectionInput {
  title?: string;
}

type Ready = Extract<ResourceAccessProjection, { status: "ready" }>;

function CapturedResourcePage({ projection }: { projection: Ready }) {
  const [page, setPage] = useState(0);
  const [scopeFilter, setScopeFilter] = useState("all");
  const scopeLabels = projection.kind === "memory_accesses"
    ? [...new Set(projection.rows.map((row) => resourceAccessScopeLabel(row.occurrence.scope)))] : [];
  const rows = projection.kind === "memory_accesses"
    ? projection.rows.filter((row) => scopeFilter === "all" || resourceAccessScopeLabel(row.occurrence.scope) === scopeFilter)
    : projection.rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / RESOURCE_ACCESS_VISIBLE_ROWS));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * RESOURCE_ACCESS_VISIBLE_ROWS;
  const end = Math.min(start + RESOURCE_ACCESS_VISIBLE_ROWS, rows.length);
  const completeness = projection.completeness;
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
    {projection.kind === "memory_accesses" && <label className="resource-access-filter">
      Filter this captured page by logical scope
      <select aria-label="Filter captured access rows by logical scope" value={scopeFilter} onChange={(event) => { setScopeFilter(event.target.value); setPage(0); }}>
        <option value="all">All scopes in this captured page</option>
        {scopeLabels.map((scope) => <option key={scope} value={scope}>{scope}</option>)}
      </select>
    </label>}
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
        <tbody>{projection.rows.filter((row) => scopeFilter === "all" || resourceAccessScopeLabel(row.occurrence.scope) === scopeFilter).slice(start, end).map((row) => <tr key={row.occurrence.event_sequence}>
          <th scope="row">{row.occurrence.event_sequence} / {row.occurrence.record_ordinal}</th>
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
      key={`${projection.anchorKey}:${projection.contextKey}:${projection.requestId}:${projection.kind}`}
      projection={projection}
    /> : <p role="status" data-state={projection.status}>{projection.detail} No prior resource rows are shown.</p>}
  </section>;
}
