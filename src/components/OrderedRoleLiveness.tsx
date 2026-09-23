import { useState } from "react";
import type { OrderedLogicalValue, OrderedRoleLiveness as Model } from "../content/ordered-role-liveness.mjs";
import "./OrderedRoleLiveness.css";

function label(value: OrderedLogicalValue) {
  return value.definitionStep === null ? value.role + " entry" : value.role + " after instruction " + (value.definitionStep + 1);
}
type Props = {
  model: Model; selectionIdentity: string; caseLabel: string;
};
function RoleView({ model, selectionIdentity, caseLabel }: Props) {
  const [selection, setSelection] = useState<{ model: Model; identity: string; key: string } | null>(null);
  const selected = selection?.model === model && selection.identity === selectionIdentity
    ? model.values.find(value => value.key === selection.key) : undefined;
  const names = (keys: readonly string[]) => keys.length ? keys.map(key => label(model.values.find(value => value.key === key)!)).join("; ") : "None in this region";
  return <section className="ordered-role-liveness" aria-label="Finite-region logical liveness">
    <h4>Logical def/use intervals: {caseLabel}</h4>
    <p>Derived from the selected retained KIR region descriptors, not from register-count metadata.
      Each write creates an analysis-only logical version. Only the three entry inputs and the returned output
      have the exact canonical SSA IDs retained by the inspector; intermediate labels are not canonical SSA.</p>
    <p>Static KIR roster coordinate: <code>{model.coordinate.join("/")}</code>; raw block <code>{model.rawBlockId}</code>.
      This is one static operation, not a dynamic invocation or replay cursor.</p>
    <dl className="ordered-role-metrics">
      <div><dt>Peak boundary live values</dt><dd data-testid="logical-boundary-peak">{model.peakBoundaryLive}</dd></div>
      <div><dt>Peak read/write transient footprint</dt><dd data-testid="logical-transient-peak">{model.peakTransient}</dd></div>
      <div><dt>Live-in to this region</dt><dd>{names(model.liveIn)}</dd></div>
      <div><dt>Live-out from this region</dt><dd>{names(model.liveOut)}</dd></div>
    </dl>
    <p>Units are logical 32-bit values. Boundary B0 is before instruction 1; Bk is after instruction k.
      A live interval [start, end) covers boundary indices, not GPU cycles or physical allocation time.
      All declared reads count, including reads whose later result is unused; no dead-code elimination is performed.</p>
    <p className="ordered-role-scroll-hint">Scroll each table horizontally, or focus its scroll area and use the Left/Right arrow keys.</p>
    <div className="ordered-role-scroll" role="region" aria-label="Logical version table scroll area" tabIndex={0}><table aria-label="Logical version lifetimes and uses">
      <thead><tr><th scope="col">Logical version</th><th scope="col">Exact SSA mapping</th>
        <th scope="col">Live boundaries</th><th scope="col">Last read / overwrite</th><th scope="col">Disposition</th></tr></thead>
      <tbody>{model.values.map(value => <tr key={value.key} data-selected={selected?.key === value.key}>
        <th scope="row"><button type="button" aria-pressed={selected?.key === value.key}
          aria-label={"Inspect logical " + label(value)}
          onClick={() => setSelection(selected?.key === value.key ? null : { model, identity: selectionIdentity, key: value.key })}>
          {label(value)}</button></th>
        <td>{value.canonicalInputSsa !== null ? "Input %" + value.canonicalInputSsa :
          value.canonicalResultSsa !== null ? "Result %" + value.canonicalResultSsa : "Unavailable — analysis version only"}</td>
        <td>{value.unused ? "Empty" : "[" + value.bornBoundary + ", " + value.endBoundaryExclusive + ")"}</td>
        <td>{value.lastReadStep === null ? "No instruction read" : "Last read: instruction " + (value.lastReadStep + 1)}
          <br />{value.overwrittenAtStep === null ? "Not overwritten in region" : "Overwritten: instruction " + (value.overwrittenAtStep + 1)}</td>
        <td>{value.returned ? "Region result" : value.unused
          ? value.definitionStep === null ? "Unused region input" : "Unused definition" : "Read in region"}</td>
      </tr>)}</tbody>
    </table></div>
    <div className="ordered-role-boundaries" aria-label="Logical boundary pressure">
      {model.boundaries.map(row => <div key={row.boundary} data-boundary={row.boundary}
        data-live-count={row.count} data-selected-live={selected ? row.live.includes(selected.key) : false}>
        <span>B{row.boundary}</span><span className="ordered-role-count" aria-hidden="true">{"■".repeat(row.count)}</span>
        <span>{row.count} live</span>
      </div>)}
    </div>
    {selected && <section aria-label="Selected logical value">
      <h5>{label(selected)}</h5>
      <p>Exact read operands: {selected.readOperands.length
        ? selected.readOperands.map(read => "instruction " + (read.step + 1) + ", operand " + (read.operand + 1)).join("; ")
        : "No declared instruction reads"}.</p>
      <p>{selected.returned ? "This final role version supplies the retained KIR result %" + selected.canonicalResultSsa + "."
        : "No returned KIR result mapping belongs to this version."}</p>
    </section>}
    <details><summary>Read-before-write and transient accounting</summary>
      <p>All source operands resolve before the instruction writes its destination. Duplicate operands remain visible
        but one logical value counts once. The transient footprint is the union of live-before, live-after, all read
        values and the newly written value, even when that write is unused. It is not a minimum register requirement;
        target instructions may overlap source and destination storage.</p>
      <div className="ordered-role-scroll" role="region" aria-label="Logical instruction table scroll area" tabIndex={0}><table aria-label="Logical instruction reads and writes">
        <thead><tr><th scope="col">Instruction</th><th scope="col">Read versions, in operand order</th>
          <th scope="col">Written version</th><th scope="col">Operand/write count</th><th scope="col">Transient count</th></tr></thead>
        <tbody>{model.steps.map(step => <tr key={step.step}><th scope="row">{step.step + 1}: {step.opcode}</th>
          <td>{names(step.reads)}</td><td>{names([step.writes])}</td>
          <td>{step.operandWriteCount}</td><td>{step.transientCount}</td></tr>)}</tbody>
      </table></div>
    </details>
    <p>No intermediate values are executed or inferred. These intervals are not physical VGPR lifetimes, allocation/free/reuse,
      occupancy, timing, a surrounding-function live set, or a source-to-register lifetime proof.</p>
    <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/ordered-role-liveness-v1.md">
      Logical def/use intervals and their limits
    </a></p>
  </section>;
}

export function OrderedRoleLiveness(props: Props) {
  return <RoleView key={props.selectionIdentity} {...props} />;
}
