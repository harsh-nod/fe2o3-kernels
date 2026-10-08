import { useEffect, useState } from "react";
import { selectedDemandBoundaries, type NativeInstructionSelection, type SelectedDemandBoundaries } from "../content/native-resource-selection.mjs";
import { projectAuthoredDemand, type AuthoredDemandProjection, type AuthoredDemandCase } from "../content/authored-register-demand.mjs";
import "./AuthoredRegisterDemand.css";

export interface AuthoredDemandEvidence { evidence: unknown; expectedSha256: string }
interface Props {
  nativeEvidence: unknown; expectedNativeJoin: string; demand: AuthoredDemandEvidence;
  profile: "default" | "edited"; optimization: "O0" | "O3";
  instructionSelection?: NativeInstructionSelection | null;
}
const CELL_LABEL: Readonly<Record<string, string>> = {
  D: "Definition", r: "Operand read", R: "Region result", "-": "Declared demand", x: "Overwritten", ".": "No declared demand",
};
function DemandReady({ model, optimization, boundaries }: {
  model: AuthoredDemandCase; optimization: Props["optimization"]; boundaries: SelectedDemandBoundaries | null;
}) {
  const [selection, setSelection] = useState<{ model: AuthoredDemandCase; id: number } | null>(null);
  const selected = selection?.model === model ? model.values.find(row => row.id === selection.id) : undefined;
  return <>
    <p>{model.profile} / {optimization}: the same source-authored plan applies to either optimization level.
      These columns are logical declaration boundaries, not native instruction times or LLVM allocation events.</p>
    <p>At boundary 0 inputs are available; instruction i reads at 2*i+1 and writes at 2*i+2;
      boundary {model.plan.result_boundary} hands off the region result, even if surrounding KIR does not use it.</p>
    <div className="authored-demand-scroll"><table aria-label="Authored value demand by logical boundary">
      <caption>Versioned declared values, not physical-register live ranges</caption>
      <thead><tr><th scope="col">Authored value</th>{model.boundaries.map(at => <th key={at} scope="col" data-static-selected={boundaries?.read === at || boundaries?.write === at}>Boundary {at}
        {boundaries?.read === at && <span className="static-selection-label">Selected read boundary</span>}
        {boundaries?.write === at && <span className="static-selection-label">Selected write boundary</span>}</th>)}</tr></thead>
      <tbody>{model.values.map(row => <tr key={row.id} data-selected={selected?.id === row.id}>
        <th scope="row"><button type="button" aria-pressed={selected?.id === row.id}
          aria-label={"Inspect authored value " + row.id + " " + row.role}
          onClick={() => setSelection(selected?.id === row.id ? null : { model, id: row.id })}>
          #{row.id} <code>v{row.binding}</code> {row.role}
        </button></th>
        {row.cells.map((cell, at) => <td key={at} data-demand={cell}
          data-static-selected={(boundaries?.read === at && boundaries.readValueIds.includes(row.id)) ||
            (boundaries?.write === at && boundaries.writeValueIds.includes(row.id))}
          aria-label={CELL_LABEL[cell] + " at boundary " + at}>
          <span aria-hidden="true">{cell}</span><span className="authored-demand-cell-label">{CELL_LABEL[cell]}</span>
        </td>)}
      </tr>)}</tbody>
    </table></div>
    {boundaries && <p aria-label="Selected authored boundary identities">Static selection joins capsule <code>{boundaries.capsuleSha256}</code>
      and exact report <code>{boundaries.reportSha256}</code>. Only the declared operand reads at {boundaries.read} and
      definition at {boundaries.write} are highlighted, not the entire live interval.</p>}
    <p aria-live="polite" className="authored-demand-selection">{selected
      ? "Authored value #" + selected.id + ": defined at " + selected.def +
        (selected.last_use === null ? "; no declared use" : "; last declared use at " + selected.last_use) +
        (selected.overwritten === null ? "; not overwritten in this region." : "; overwritten at " + selected.overwritten + ".")
      : "Select an authored value for its declared interval."}</p>
    <details><summary>Accessible authored-demand ASCII</summary>
      <pre aria-label="Authored-demand ASCII"><code>{model.ascii}</code></pre>
    </details>
    <p>Overwritten does not mean freed. A blank demand cell does not prove dead, free, or uninitialized.
      This plan does not establish physical allocation, physical values, microsteps, occupancy, or register-lifetime safety.</p>
    <details><summary>Authored-demand identity</summary>
      <p>Canonical KIR: <code>{model.canonicalSha256}</code>. Exact CLI report: <code>{model.reportSha256}</code>.</p>
      <p>The browser independently replays all definition/use rows from the checked retained instruction report;
        hashes establish byte consistency, not trusted source/compiler provenance.</p>
    </details>
  </>;
}

export function AuthoredRegisterDemand({ nativeEvidence, expectedNativeJoin, demand, profile, optimization, instructionSelection = null }: Props) {
  const [completed, setCompleted] = useState<{
    nativeEvidence: unknown; expectedNativeJoin: string; evidence: unknown; expectedSha256: string;
    result: AuthoredDemandProjection;
  } | null>(null);
  useEffect(() => {
    let active = true;
    void projectAuthoredDemand(nativeEvidence, expectedNativeJoin, demand.evidence, demand.expectedSha256)
      .then(result => { if (active) setCompleted({ nativeEvidence, expectedNativeJoin,
        evidence: demand.evidence, expectedSha256: demand.expectedSha256, result }); });
    return () => { active = false; };
  }, [nativeEvidence, expectedNativeJoin, demand.evidence, demand.expectedSha256]);
  const result = completed !== null && completed.nativeEvidence === nativeEvidence && completed.expectedNativeJoin === expectedNativeJoin &&
    completed.evidence === demand.evidence && completed.expectedSha256 === demand.expectedSha256 ? completed.result : null;
  const model = result?.status === "ready" ? result.cases.find(row => row.profile === profile) : undefined;
  return <section className="authored-register-demand" aria-label="Authored declared-register demand">
    <p className="authored-demand-title">Authored demand, separate from final native resources</p>
    {result === null ? <p role="status">Checking authored-demand evidence; no previous demand is shown.</p>
      : result.status !== "ready" ? <p role="status" data-state={result.status}>{result.detail}</p>
        : model ? <DemandReady key={profile + "-" + optimization} model={model} optimization={optimization}
          boundaries={selectedDemandBoundaries(instructionSelection, result, model)} />
          : <p role="status" data-state="invalid">Selected authored profile unavailable.</p>}
    <p>No source mutation, compiler request, native execution, or hardware action is supplied by this view.</p>
  </section>;
}
