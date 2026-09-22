import type { ImportedResourceCheckpoint } from "../content/recorded-resource-import";
import { projectResourceSourceValues, type ResourceSourceValuePair } from "../content/resource-source-values";
import "./ResourceSourceValuesView.css";

export function ResourceSourceValuesView({ checkpoint, stackPair, sourcePages }: {
  checkpoint: ImportedResourceCheckpoint;
  stackPair: ResourceSourceValuePair | null;
  sourcePages: readonly ResourceSourceValuePair[];
}) {
  const projection = projectResourceSourceValues(checkpoint, stackPair, sourcePages);
  return <section className="resource-source-values" aria-label="Imported checkpoint source variables" data-state={projection.status}>
    <h4>Source variables at this recorded checkpoint</h4>
    <p>Caller-supplied / unverified CPU recording. This panel presents source-variable queries from the selected stop,
      alongside its separate SSA and memory observations. Matching values or names are not a source-to-SSA mapping.</p>
    {projection.status !== "ready" ? <p role="status">{projection.detail} No previous source-variable table is retained.</p> : <>
      <p data-testid="source-values-anchor">Checkpoint request {projection.checkpointRequestId}: event {projection.checkpointAnchor.cursor.event_sequence},
        revision {projection.checkpointAnchor.cursor.state_revision}; source-variable frame {projection.stackFrame.frame}, legacy occurrence 1.</p>
      <p>The source-variable anchor refines the same stop with an explicitly selected frame.
        It is not identical to the unframed checkpoint anchor. Legacy occurrence 1 is not a dynamic helper activation.</p>
      <details>
        <summary>Recorded source-variable selection and identity</summary>
        <dl>
          <dt>Configuration</dt><dd><code>{projection.checkpointAnchor.cursor.configuration_identity}</code></dd>
          <dt>Original request IDs</dt><dd>Stack {projection.stackRequestId}; source-variable pages {projection.sourceRequestIds.join(", ")}.</dd>
          <dt>Selected stack frame</dt><dd>Frame {projection.stackFrame.frame}, function {projection.stackFrame.functionOrdinal},
            block {projection.stackFrame.blockOrdinal}, next operation {projection.stackFrame.nextOperation}.</dd>
          <dt>Recorded operation</dt><dd>Function {projection.checkpointAnchor.site?.kir.function_ordinal},
            block {projection.checkpointAnchor.site?.kir.block_ordinal},
            operation {projection.checkpointAnchor.site?.kir.point.kind === "operation" ? projection.checkpointAnchor.site.kir.point.operation_ordinal : "unavailable"}.
            The stack&apos;s next operation can differ from this recorded operation.</dd>
          <dt>Checkpoint frame / occurrence</dt><dd>Not represented / not represented.</dd>
          <dt>Source-variable frame / occurrence</dt><dd>{projection.sourceAnchor.frame} / {projection.sourceAnchor.occurrence}.</dd>
          <dt>Complete captured stack</dt><dd>{projection.stackFrameCount} frame{projection.stackFrameCount === 1 ? "" : "s"}; selected current frame {projection.stackFrame.frame}.
            Source variables belong only to this explicitly selected frame.</dd>
          <dt>SSA value count</dt><dd>{projection.stackFrame.valueCount} retained whole SSA values in the selected frame;
            {projection.totalSsaValueCount} across the complete captured stack. The separate SSA table retains all frames;
            no named-variable correspondence inferred.</dd>
        </dl>
      </details>
      {projection.rows.length === 0 ? <p role="status">No source-variable rows were returned by the complete retained query. This is not evidence that the source has no variables.</p>
        : <div className="resource-source-values-scroll"><table aria-label="Selected checkpoint source variables">
          <thead><tr><th scope="col">Source variable / exact identity</th><th scope="col">Scope / generation</th>
            <th scope="col">Type / availability</th><th scope="col">Retained representation / interpretation</th></tr></thead>
          <tbody>{projection.rows.map(row => <tr key={row.identity}>
            <th scope="row">{row.name}<details><summary>Variable identity</summary><code>{row.identity}</code></details></th>
            <td><span className="source-value-field-label" aria-hidden="true">Scope / generation</span>
              Function {row.functionOrdinal}<br />Depth {row.scopeDepth}<br />Generation {row.generation}
              <details><summary>Lexical scope identity</summary><code>{row.scopeIdentity}</code></details></td>
            <td><span className="source-value-field-label" aria-hidden="true">Type / availability</span>
              {row.typeLabel}<br />{row.status}</td>
            <td><span className="source-value-field-label" aria-hidden="true">Retained representation / interpretation</span>
              <code>{row.representation}</code><br />{row.interpretation}</td>
          </tr>)}</tbody>
        </table></div>}
    </>}
    <p>At most 64 variables and 32 complete pages. Captured parameters, unsupported locals, redacted data and ambiguous
      bindings stay distinct. Source text, general local-variable reconstruction, physical registers and dynamic call occurrences
      are not supplied by this panel. No memory read, debugger command or execution is performed.</p>
  </section>;
}
