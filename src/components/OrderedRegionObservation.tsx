import { useEffect, useId, useState } from "react";
import { projectOrderedRegionObservation, type OrderedRegionObservationInput, type OrderedRegionObservationProjection, type OrderedRegionVariant, type OrderedRegionCpuCase } from "../content/ordered-region-observation";
import "./OrderedRegionObservation.css";

export interface OrderedRegionObservationProps { input: OrderedRegionObservationInput | null }
type Ready = Extract<OrderedRegionObservationProjection, { status: "ready" }>;
function u32(value: number): string { return `0x${value.toString(16).padStart(8, "0")} (${value})`; }

function LogicalCase({ variant, observed, caseIndex }: { variant: OrderedRegionVariant; observed: OrderedRegionCpuCase; caseIndex: number }) {
  const [lane, setLane] = useState(0), [phase, setPhase] = useState<0 | 1>(0), phaseId = useId();
  const indices = observed.recordIndices[lane];
  return <section className="ordered-region-logical" aria-label="Recorded logical SSA values">
    <h4>CPU logical values — not physical register contents</h4>
    <div className="ordered-region-controls">
      <label>Retained logical lane index
        <select aria-label="Retained logical lane index" value={lane} onChange={event => { setLane(Number(event.target.value)); setPhase(0); }}>
          {observed.afterResults.map((_, index) => <option key={index} value={index}>Lane index {index} of 64</option>)}
        </select>
      </label>
      <fieldset><legend>Whole-region checkpoint</legend>
        <label><input type="radio" name={phaseId} checked={phase === 0} onChange={() => setPhase(0)} />Before whole region</label>
        <label><input type="radio" name={phaseId} checked={phase === 1} onChange={() => setPhase(1)} />After whole region</label>
      </fieldset>
    </div>
    <div aria-live="polite" aria-atomic="true" data-testid="ordered-region-logical-selection">
      <p>Case {caseIndex + 1} · logical lane index {lane} · {phase === 0 ? "before" : "after"} the entire region.
        Retained record index <strong>{indices[phase]}</strong> of {observed.records} records.</p>
      <div className="ordered-region-table-wrap"><table aria-label="Selected logical SSA checkpoint values">
        <thead><tr><th scope="col">Logical role</th><th scope="col">SSA value ID</th><th scope="col">Recorded u32 observation</th></tr></thead>
        <tbody>
          {variant.inputIds.map((id, index) => <tr key={index}><th scope="row">Input {"ABC"[index]}</th><td>%{id}</td>
            <td>{phase === 0 ? <code>{u32(observed.beforeInputs[index])}</code> : "Not retained separately for this phase"}</td></tr>)}
          <tr><th scope="row">Region result</th><td>%{variant.resultId}</td>
            <td>{phase === 1 ? <code>{u32(observed.afterResults[lane])}</code> : "Not provided for this phase"}</td></tr>
        </tbody>
      </table></div>
    </div>
    <p>Zero is a captured logical value, not missing data. Before-input values are explicitly reported as the same for all 64 logical lanes.
      After-result values are retained per lane. A region result is not the kernel&apos;s output-buffer contents.</p>
    <p>Only this before/after pair is available. It brackets one atomic CPU operation; no XOR/ADD instruction microsteps,
      intermediate scratch values, workgroup/wave coordinates, or protocol cursor revisions are supplied by the sidecar.</p>
    <details><summary>This retained request case</summary>
      <p>Arguments: {observed.arguments.map(u32).join("; ")}. Record pair: [{indices.join(", ")}].</p>
      <p>Schedule transcript identity: <code>{observed.scheduleIdentity}</code>. This hash alone is not an immutable request identity.</p>
      <p>Producer reports complete capture, independent-oracle agreement and unchanged canaries for this case.
        Buffer bytes and negative-control transcripts are not retained in this sidecar.</p>
    </details>
  </section>;
}

function Variant({ variant }: { variant: OrderedRegionVariant }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const rows = [
    { role: "Scratch", register: variant.roles.scratch, logical: "No intermediate SSA checkpoint supplied" },
    { role: "Output", register: variant.roles.output, logical: `Region result %${variant.resultId}` },
    ...variant.roles.inputs.map((register, index) => ({ role: `Input ${"ABC"[index]}`, register, logical: `SSA value %${variant.inputIds[index]}` })),
  ];
  return <>
    <p><strong>{variant.label}</strong> · feature <code>{variant.feature}</code>. Used/unused are distinct compilations, even though they share the same whole source-file hash.</p>
    <label className="ordered-region-case">Retained CPU request case
      <select aria-label="Retained CPU request case" value={caseIndex} onChange={event => setCaseIndex(Number(event.target.value))}>
        {variant.cases.map((observed, index) => <option key={index} value={index}>Case {index + 1}: {observed.arguments.map(value => `0x${value.toString(16)}`).join(", ")}</option>)}
      </select>
    </label>
    <div className="ordered-region-panels">
      <section aria-label="Authored fixed-register plan">
        <h4>Authored fixed-register plan</h4>
        <p>Declared <code>gfx942:xnack-</code>, wave width 64. These are region-local bindings from the retained compiler inspection,
          not observed hardware registers or a whole-kernel allocation map.</p>
        <div className="ordered-region-table-wrap"><table aria-label="Authored physical role bindings">
          <thead><tr><th scope="col">Authored role</th><th scope="col">Declared VGPR</th><th scope="col">Logical binding, not contents</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.role}><th scope="row">{row.role}</th><td><code>v{row.register}</code></td><td>{row.logical}</td></tr>)}</tbody>
        </table></div>
        <p className="ordered-region-unavailable">Physical VGPR/SGPR/AGPR values, scratch contents, EXEC values, live ranges, occupancy
          and final-artifact mapping: <strong>unavailable</strong>. No intermediate scratch value is calculated for display.</p>
      </section>
      <LogicalCase key={caseIndex} variant={variant} observed={variant.cases[caseIndex]} caseIndex={caseIndex} />
    </div>
    <details><summary>Exact retained variant and source associations</summary>
      <dl>
        <dt>Sidecar SHA-256</dt><dd><code>{variant.sidecarSha256}</code></dd>
        <dt>Canonical V16 identity / byte length</dt><dd><code>{variant.canonicalIdentity}</code> / {variant.canonicalLength}</dd>
        <dt>Canonical bytes SHA-256</dt><dd><code>{variant.canonicalBytesSha256}</code></dd>
        <dt>Semantic MIR identity</dt><dd><code>{variant.semanticSha256}</code></dd>
        <dt>Whole source-file SHA-256</dt><dd><code>{variant.sourceSha256}</code></dd>
        <dt>Canonical roster coordinate</dt><dd>{variant.coordinate.join(":")}; raw KIR block ID {variant.rawBlock} is a separate identifier.</dd>
        <dt>Semantic coordinate</dt><dd>{variant.semanticCoordinate.join(":")}</dd>
        <dt>Source expansion / call-site presence</dt><dd>{variant.expansionAvailable ? "Reported present" : "Reported unavailable"} / {variant.callSiteAvailable ? "reported present" : "reported unavailable"}.
          Exact source-span coordinates and macro text are not retained here; no line highlight is inferred.</dd>
        <dt>Source IDs (unit, function, contract, statement)</dt><dd>{variant.sourceIds.map(id => <code key={id}>{id}<br /></code>)}</dd>
        <dt>Inventory / preflight identities</dt><dd><code>{variant.inventorySha256}</code><br /><code>{variant.preflightSha256}</code></dd>
      </dl>
      <p>Matching coordinates in another variant are not a correspondence. Source IDs and hashes are retained metadata,
        not compiler authentication, proof, helper materialization or source-insertion authority.</p>
    </details>
  </>;
}

function ReadyObservation({ projection }: { projection: Ready }) {
  const [variantIndex, setVariantIndex] = useState(0), variant = projection.variants[variantIndex];
  return <>
    <p>Retained actual-source test observations · CPU logical values · working-tree development capture, not a qualified release.</p>
    <label className="ordered-region-case">Source compilation feature
      <select aria-label="Source compilation feature" value={variantIndex} onChange={event => setVariantIndex(Number(event.target.value))}>
        {projection.variants.map((item, index) => <option key={item.feature} value={index}>{item.label}</option>)}
      </select>
    </label>
    <Variant key={`${variant.sidecarSha256}:${variant.feature}:${variant.canonicalIdentity}:${variant.canonicalLength}`} variant={variant} />
    <p>Six request cases per variant, 64 logical lanes per case. The producer separately checked another same-KIR request,
      incompatible index/wave settings, record-limit truncation and value-limit unavailability. Those control summaries do not supply additional displayable snapshots.</p>
    <p>Source ladder SHA-256: <code>{projection.ladderSha256}</code>.</p>
  </>;
}

export function OrderedRegionObservation({ input }: OrderedRegionObservationProps) {
  const [completed, setCompleted] = useState<{ input: OrderedRegionObservationInput | null; projection: OrderedRegionObservationProjection } | null>(null);
  useEffect(() => {
    let current = true;
    void projectOrderedRegionObservation(input).then(projection => { if (current) setCompleted({ input, projection }); });
    return () => { current = false; };
  }, [input]);
  const projection = completed !== null && completed.input === input ? completed.projection : null;
  return <section className="ordered-region-observation" aria-label="Authored plan and recorded logical observation">
    <h3>Authored register roles and recorded CPU values</h3>
    <p className="ordered-region-boundary">Read-only retained display. Hash joins check byte consistency; they cannot recreate the private compiler-owner
      and immutable-request borrows. This is not detached-transcript admission, physical GPU state, a debugger connection, or production authority.</p>
    {projection === null ? <p role="status">Checking retained byte integrity; no prior plan or logical values are shown.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No prior plan or logical values are shown.</p>
        : <ReadyObservation key={projection.captureKey} projection={projection} />}
    <p>Selecting a variant, case, lane or phase only browses retained data. It never compiles, launches, resumes, edits source,
      fetches another capture, restores memory, or navigates an existing debugger session.</p>
  </section>;
}
