import type { ImportedResourceCheckpoint } from "../content/recorded-resource-import";
import { projectResourceCheckpointValues } from "../content/resource-checkpoint-values";
import "./ResourceCheckpointValuesView.css";

export function ResourceCheckpointValuesView({ checkpoint }: { checkpoint: ImportedResourceCheckpoint }) {
  const projection = projectResourceCheckpointValues(checkpoint);
  return <section className="resource-checkpoint-values" aria-label="Imported checkpoint SSA and source" data-state={projection.status}>
    <h4>Checkpoint SSA values and source</h4>
    <p>Caller-supplied / unverified CPU recording. These values belong to the selected checkpoint,
      not to a selected historical access. Recorded source and simulated_observation labels do not authenticate their producer.</p>
    {projection.status !== "ready" ? <p role="status">{projection.detail} The original recording remains unchanged.</p> : <>
      <p data-testid="checkpoint-values-anchor">Request {projection.requestId}: event {projection.anchor.cursor.event_sequence},
        revision {projection.anchor.cursor.state_revision}. Logical {projection.anchor.scope.level} scope
        {"workgroup" in projection.anchor.scope && `; workgroup [${projection.anchor.scope.workgroup.join(", ")}]`}
        {"wave" in projection.anchor.scope && `; wave ${projection.anchor.scope.wave}, lane ${projection.anchor.scope.lane ?? "not supplied"}`}.</p>
      <details>
        <summary>Recorded source and snapshot identity</summary>
        <dl>
          <dt>Configuration</dt><dd><code>{projection.anchor.cursor.configuration_identity}</code></dd>
          <dt>Snapshot frame / occurrence</dt><dd>{projection.anchor.frame ?? "Not represented"} / {projection.anchor.occurrence ?? "Not represented"}</dd>
          <dt>KIR site</dt><dd>{projection.anchor.site ? <>
            Function {projection.anchor.site.kir.function_ordinal}, block {projection.anchor.site.kir.block_ordinal},
            {" "}{projection.anchor.site.kir.point.kind}
            {projection.anchor.site.kir.point.kind === "operation" && ` ${projection.anchor.site.kir.point.operation_ordinal}`}
          </> : "Not supplied"}</dd>
          <dt>Source location</dt><dd>{projection.anchor.site?.source.status === "resolved" ? <>
            Recorded {projection.anchor.site.source.location.provenance} claim, unverified.<br />
            Map: <code>{projection.anchor.site.source.location.map_identity}</code><br />
            File: <code>{projection.anchor.site.source.location.file_identity}</code><br />
            Byte span [{projection.anchor.site.source.location.byte_start}, {projection.anchor.site.source.location.byte_end}).
            Source text and variable names are not supplied.
          </> : `Unavailable: ${projection.anchor.site?.source.status === "unavailable" ? projection.anchor.site.source.reason : "not supplied"}`}</dd>
        </dl>
      </details>
      {projection.rows.length === 0 ? <p role="status">No value rows were retained at this checkpoint; this does not establish that no values exist.</p>
        : <div className="resource-checkpoint-values-table"><table aria-label="Selected checkpoint SSA values">
          <thead><tr><th scope="col">Recorded SSA identity</th><th scope="col">Type / availability</th><th scope="col">Recorded representation / interpretation</th></tr></thead>
          <tbody>{projection.rows.map(row => <tr key={row.key}>
            <th scope="row">Function {row.functionOrdinal}<br />Frame {row.frame}<br />Value %{row.valueOrdinal}</th>
            <td>{row.typeLabel}<br />{row.status}</td>
            <td><code>{row.representation}</code><br />{row.interpretation}</td>
          </tr>)}</tbody>
        </table></div>}
    </>}
    <p>At most 64 whole SSA values, scalar bit widths at most 64. Unsupported rows make this table unavailable;
      no rows are silently dropped. A recorded frame number is not an authenticated dynamic helper activation.
      No variable-name mapping, physical registers, dereference, new memory read or execution is inferred.</p>
  </section>;
}
