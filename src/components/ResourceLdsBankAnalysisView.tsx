import { useId, useState } from "react";
import { ldsBankProfile } from "../content/lds-bank-model";
import { projectSelectedLdsBankAnalysis } from "../content/resource-lds-bank-analysis";
import type { ResourceAccessProjection } from "../content/resource-access-view";
import { resourceAccessPageKey, type ResourceAccessSelection } from "../content/resource-access-navigation";
import "./ResourceLdsBankAnalysisView.css";

interface Props {
  projection: Extract<ResourceAccessProjection, { status: "ready"; kind: "memory_accesses" }>;
  selection: ResourceAccessSelection | null;
}

function SelectedRangeModel({ projection, selection }: Props) {
  const inputId = useId(), explanationId = useId();
  const [base, setBase] = useState("0");
  const profile = ldsBankProfile(projection.context.target);
  const analysis = projectSelectedLdsBankAnalysis(projection, selection, base);
  return <details className="resource-lds-bank-analysis" data-testid="selected-lds-bank-analysis">
    <summary>LDS address-pattern model — assumed layout</summary>
    <p id={explanationId}>This is arithmetic for one selected retained byte range, not a GPU observation.
      The allocation base residue is assumed; its actual physical base and alignment are unavailable.
      No other access, allocation, workgroup, wave or event is grouped with this range.</p>
    <p>Target: <code>{projection.context.target ?? "unavailable"}</code> — caller-owned context, not backend-attested.
      {profile && (" " + profile.architecture + " geometry: " + profile.bankCount + " banks × 4 bytes; " + profile.periodBytes + "-byte interleave period.")}</p>
    {profile && <label htmlFor={inputId}>Assumed allocation-base residue (bytes, 0–{profile.periodBytes - 1})
      <input id={inputId} type="text" inputMode="numeric" maxLength={20} value={base} aria-describedby={explanationId}
        onChange={(event) => setBase(event.target.value.length <= 20 ? event.target.value : "")} />
    </label>}
    {analysis.status === "modeled" ? <>
      <p>Selected event {analysis.selected.occurrence.event_sequence}; alloc#{analysis.selected.allocation.ordinal}:g{analysis.selected.allocation.generation}.
        {" "}Captured offset {analysis.model.byteOffset}, length {analysis.model.byteLength} bytes.
        {" "}Modeled normalized address range [{analysis.model.normalizedStart}, {analysis.model.normalizedEnd}) under assumed base residue {base}.
        {" "}The selected checkpoint remains {analysis.checkpointEvent}, revision {analysis.checkpointRevision}.</p>
      <p>Model rule: floor((assumed base residue + byte offset) / 4) modulo {analysis.model.profile.bankCount}.
        {" "}These indices name modeled banks only. Changing the assumption changes no captured data.</p>
      <ul className="resource-lds-bank-grid" aria-label="Modeled LDS bank footprint">
        {analysis.model.banks.map((bank) => <li key={bank.bank} data-touched={bank.byteCount !== 0 ? "true" : "false"}>
          <span>Bank {bank.bank}</span><span>{bank.distinctWords} words · {bank.byteCount} bytes</span>
        </li>)}
      </ul>
      <p>{analysis.model.words.length} distinct modeled dwords touched; at most 65 for the 256-byte range cap.
        Several distinct words may map to one modeled bank; this is not a measured or predicted conflict.</p>
      {(analysis.partialCapture || analysis.morePages) && <p className="resource-lds-bank-notice">
        {analysis.partialCapture && "The retained capture is partial. "}
        {analysis.morePages && "More backend pages exist. "}
        This model covers only the selected row; missing accesses are not inactivity.
      </p>}
    </> : <p role="status" data-state={analysis.status}>{analysis.detail} No prior modeled banks are shown.</p>}
    <p className="resource-lds-bank-notice">Native instruction, participating hardware lanes, transaction phases,
      multicast behavior, conflict count and GPU timing are unavailable. A logical CPU wave is not a hardware issue group.
      This view does not fetch, attach, step, compile or launch.</p>
    <p>Bound: one complete access of at most 256 bytes, at most 65 words and 64 modeled banks.
      Larger ranges are unavailable, not silently truncated. This is not a native LDS bounds check.</p>
  </details>;
}

export function ResourceLdsBankAnalysisView(props: Props) {
  // Reset the local assumption synchronously on every complete page/row identity
  // change, including a changed target or revision. No effect/late-result window.
  const key = JSON.stringify([resourceAccessPageKey(props.projection), props.selection]);
  return <SelectedRangeModel key={key} {...props} />;
}
