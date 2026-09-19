import { useEffect, useState } from 'react';
import { projectOrderedProgramObservation, type OrderedProgramObservationInput, type ProgramProjection, type ProgramVariant, type ProgramCase } from '../content/ordered-program-observation.mjs';
import './OrderedProgramObservation.css';

function CaseView({ variant, observed }: { variant: ProgramVariant; observed: ProgramCase }) {
  const [phase, setPhase] = useState(0), selected = observed.checkpoints[phase];
  const logicalRoles = [...variant.inputIds.map((id, index) => ({ id, label: `Input ${'ABC'[index]}` })), { id: variant.resultId, label: 'Program result' }];
  return <section aria-label="Recorded lane zero values">
    <h4>Logical lane 0 — whole-program checkpoints</h4>
    <label>Recorded checkpoint <select aria-label="Recorded whole-program checkpoint" value={phase} onChange={event => setPhase(Number(event.target.value))}>
      {observed.checkpoints.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
    </select></label>
    <p aria-live="polite">{selected.label}: event {selected.anchor.cursor.event_sequence}, revision {selected.anchor.cursor.state_revision}. Workgroup [0, 0, 0], logical wave 0, lane 0.</p>
    <div className="program-observation-scroll"><table aria-label="Recorded program logical values"><thead><tr><th>Logical role</th><th>SSA ID</th><th>Retained observation</th></tr></thead><tbody>
      {logicalRoles.map(role => {
        const value = selected.values.find(item => item.id === role.id);
        return <tr key={role.id}><th scope="row">{role.label}</th><td>%{role.id}</td><td>{!value ? 'Not queried at this checkpoint' : value.status === 'unavailable' ? `Unavailable: ${value.reason}` : <code>{value.bits} ({Number(BigInt(value.bits!))})</code>}</td></tr>;
      })}
    </tbody></table></div>
    <p>Only lane 0 SSA values are retained here. A zero value is captured data. Program results are not output-buffer observations; unused-result variants still compute a logical result.</p>
    <details><summary>Exact checkpoint identity</summary><p>Configuration: <code>{observed.configurationIdentity}</code></p>
      <p>Simulation-request SHA-256: <code>{observed.simulationRequestSha256}</code></p>
      <p>Logical active mask: <code>{selected.anchor.scope.active_mask.toString()}</code> (not physical EXEC).</p>
      <p>Source association unavailable: requires_authenticated_map. Matching source IDs do not grant source authentication.</p>
    </details>
  </section>;
}
function VariantView({ variant }: { variant: ProgramVariant }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const roles = [{ label: 'Scratch', register: variant.roles.scratch, logical: 'No intermediate SSA value supplied' }, { label: 'Output', register: variant.roles.output, logical: `Program result %${variant.resultId}` }, ...variant.roles.inputs.map((register, index) => ({ label: `Input ${'ABC'[index]}`, register, logical: `SSA %${variant.inputIds[index]}` }))];
  return <>
    <p>{variant.steps.length} declared instructions; result {variant.resultMode}. Declared gfx942:xnack-, wave width 64.</p>
    <label>Request case <select aria-label="Recorded program request case" value={caseIndex} onChange={event => setCaseIndex(Number(event.target.value))}>
      {variant.cases.map(item => <option key={item.index} value={item.index}>Case {item.index + 1}</option>)}
    </select></label>
    <div className="program-observation-panels"><section aria-label="Declared program plan"><h4>Declared registers and instruction text</h4>
      <div className="program-observation-scroll"><table aria-label="Declared program register roles"><thead><tr><th>Role</th><th>Declared VGPR</th><th>Logical binding, not contents</th></tr></thead><tbody>
        {roles.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>v{row.register}</td><td>{row.logical}</td></tr>)}
      </tbody></table></div>
      <ol aria-label="Declared instruction sequence">{variant.steps.map((step, index) => <li key={index}><code>{step.instruction} v{step.output}, {step.inputs.map(input => `v${input}`).join(', ')}</code></li>)}</ol>
      <p>The sequence preserves repeated and unused steps. Its rows are declarations, not instruction execution stops. No intermediate values are calculated for display.</p>
      <p>Physical VGPR/SGPR/AGPR values, scratch contents, EXEC contents, live ranges, occupancy and final-artifact mapping: unavailable.</p>
    </section><CaseView key={`${variant.canonical.sha256}:${variant.cases[caseIndex].configurationIdentity}:${variant.cases[caseIndex].simulationRequestSha256}`} variant={variant} observed={variant.cases[caseIndex]} /></div>
    <details><summary>Canonical owner declarations</summary><p>V17: <code>{variant.canonical.sha256}</code> / {variant.canonical.bytes} bytes.</p>
      <p>Roster coordinate {variant.coordinate.function_ordinal}:{variant.coordinate.block_ordinal}:{variant.coordinate.operation_ordinal}; raw block ID {variant.rawBlockId} is a separate identifier.</p>
      <p>Declared VGPR high-water {variant.roles.vgpr_high_water}, not final whole-kernel register usage.</p>
      <p>Declared source IDs: {Object.entries(variant.sourceIds).map(([name, id]) => <span key={name}>{name}: <code>{id}</code><br /></span>)}</p>
    </details>
  </>;
}
function Ready({ projection }: { projection: Extract<ProgramProjection, { status: 'ready' }> }) {
  const [variantIndex, setVariantIndex] = useState(0), variant = projection.variants[variantIndex];
  return <>
    <p role="status">{projection.kind === 'synthetic_test_only' ? 'Synthetic test-only input. This is not execution evidence.' : 'Retained public diagnostic CPU observations; not a qualified compiler release.'}</p>
    <label>Program variant <select aria-label="Recorded program variant" value={variantIndex} onChange={event => setVariantIndex(Number(event.target.value))}>
      {projection.variants.map((item, index) => <option key={item.name} value={index}>{item.profile} / {item.resultMode}</option>)}
    </select></label>
    <VariantView key={`${projection.captureKey}:${variant.name}:${variant.canonical.sha256}`} variant={variant} />
  </>;
}
export function OrderedProgramObservation({ input }: { input: OrderedProgramObservationInput | null }) {
  const [completed, setCompleted] = useState<{ input: OrderedProgramObservationInput | null; projection: ProgramProjection } | null>(null);
  useEffect(() => { let current = true; void projectOrderedProgramObservation(input).then(projection => { if (current) setCompleted({ input, projection }); }); return () => { current = false; }; }, [input]);
  const projection = completed !== null && completed.input === input ? completed.projection : null;
  return <section className="program-observation" aria-label="Recorded ordered-program observations">
    <h3>Declared program plan and recorded logical values</h3>
    <p>Read-only display. Hash joins check retained-byte consistency, not source custody, proof, artifact admission, compilation resume or GPU execution. No live debugger is connected.</p>
    {projection === null ? <p role="status">Checking retained bytes; no previous values are shown.</p> : projection.status !== 'ready' ? <p role="status" data-state={projection.status}>{projection.detail}</p> : <Ready key={projection.captureKey} projection={projection} />}
    <p>Selections only browse retained whole-program checkpoints. They never fetch data, edit source, compile, launch, restore memory, or step physical instructions.</p>
  </section>;
}
