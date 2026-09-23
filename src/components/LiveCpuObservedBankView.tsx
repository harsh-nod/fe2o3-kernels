import { useId, useState } from "react";
import type { CpuBridgeReply } from "../lib/cpu-debug-session";
import type { CpuObservedCollection } from "../lib/cpu-observed-collection";
import { joinDeclaredTarget } from "../lib/cpu-declared-target";
import { observedBankRows, projectObservedBankRange, type ObservedBankRow } from "../lib/cpu-observed-bank";
import { ldsBankProfile } from "../content/lds-bank-model";
import { stable, type ObservedRow } from "../lib/cpu-observed-validation";
import { LdsBankFootprint } from "./LdsBankFootprint";
import "./ResourceLdsBankAnalysisView.css";
import "./LiveCpuObservedBankView.css";
export interface LiveCpuObservedBankProps {
  collection: CpuObservedCollection;
  targetReply: CpuBridgeReply | null;
  enabled: boolean;
  remainingCommands: number;
  onInspectTarget: (collection: CpuObservedCollection) => void;
}
function Range({ collection, targetReply, selected }: LiveCpuObservedBankProps & { selected: ObservedBankRow }) {
  const [base, setBase] = useState("0"), inputId = useId();
  const model = projectObservedBankRange(collection, targetReply, selected.key, base);
  let target: ObservedRow | null = null;
  try { if (targetReply) target = joinDeclaredTarget(collection, targetReply); } catch { /* No stale target. */ }
  const profile = ldsBankProfile(target?.target);
  return <>
    {profile && <label htmlFor={inputId}>Assumed allocation-base residue (bytes, 0–{profile.periodBytes - 1})
      <input id={inputId} value={base} inputMode="numeric" maxLength={20}
        onChange={event => setBase(event.target.value.length <= 20 ? event.target.value : "")} />
    </label>}
    <p>Selected retained access: {selected.label}. Its full invocation and actual operation site are part of the selection key.
      This historical row is not reconstructed memory or the current instruction.</p>
    {model.status === "modeled" ? <>
      <p>Captured relative offset {model.byteOffset}, complete length {model.byteLength} bytes.
        Modeled range [{model.normalizedStart}, {model.normalizedEnd}) under assumed base residue {model.assumedBaseResidue}.
        Rule: floor((assumed base residue + byte offset) / 4) modulo {model.profile.bankCount}.</p>
      <LdsBankFootprint banks={model.banks} />
      <p>{model.words.length} modeled dwords; {model.profile.bankCount} modeled banks.
        The assumption changes no captured values or target declaration.</p>
    </> : <p role="status">{model.detail} No prior modeled banks are shown.</p>}
  </>;
}
function SelectedView(props: LiveCpuObservedBankProps) {
  const [selectedKey, setSelectedKey] = useState(""), id = useId();
  const rows = observedBankRows(props.collection), selected = rows.find(row => row.key === selectedKey);
  let target: ObservedRow | null = null;
  try { if (props.targetReply) target = joinDeclaredTarget(props.collection, props.targetReply); } catch { /* Refuse old bindings. */ }
  return <section className="resource-lds-bank-analysis live-cpu-observed-bank" aria-label="Same-stop declared-target bank model">
    <h4>Same-stop declared target and one retained LDS access</h4>
    <button type="button" disabled={!props.enabled || props.remainingCommands < 1}
      onClick={() => props.onInspectTarget(props.collection)}>Read bundle-declared target</button>
    <p>This separate explicit command reads one owner-bound declaration. The existing four/six-request storage collection is unchanged.
      It neither steps nor launches a GPU. Each target response, including its HTTP wrapper, is capped at 4096 bytes.</p>
    {target?.availability === "declared" ? <>
      <p>Bundle-declared target: <code>{String(target.target)}</code>. Verified simulation-bundle content,
        not hardware detection, producer authentication or evidence that this machine has that GPU.
        Logical CPU wave width: {String(props.targetReply?.response.logical_wave_width)}.</p>
      <dl><dt>Original envelope version / identity</dt><dd>{String(target.envelope_version)} / {String(target.envelope_identity)}</dd>
        <dt>Original subject identity</dt><dd>{String(target.subject_identity)}</dd>
        <dt>Admitted module</dt><dd>{stable(target.admitted_module)}</dd></dl>
    </> : <p role="status">{target ? "Raw input has no declared GPU target." :
      "No matching explicit target reply is selected. No target is inferred from the simulation profile or editable here."}</p>}
    <label htmlFor={id}>Observed workgroup access<select id={id} value={selectedKey} disabled={!props.enabled}
      onChange={event => setSelectedKey(event.target.value)}>
      <option value="">Select one retained access with an actual producer identity</option>
      {rows.map(row => <option key={row.key} value={row.key}>{row.label}</option>)}
    </select></label>
    {selected ? <Range key={selected.key + "/" + (target ? stable(target) : "unavailable")} {...props} selected={selected} /> :
      <p role="status">No access selected. First-page omissions and unavailable producer identities are not inactivity.</p>}
    <p>One complete access of at most 256 bytes, 65 dwords and 64 banks; larger accesses are unavailable, not truncated.
      The physical base is unavailable and its residue is explicitly assumed. No other access, allocation, workgroup or event is grouped.
      Native instruction transactions, participating hardware lanes, multicast, conflicts and timing are unavailable.
      A logical CPU wave is not a hardware issue group.</p>
  </section>;
}
export function LiveCpuObservedBankView(props: LiveCpuObservedBankProps) {
  // Any collection, generation, range or accepted target change resets the row
  // and base synchronously; no effect can expose an old selection for one render.
  const key = props.collection.key + "/" + stable(props.collection.selection) + "/" +
    (props.targetReply ? stable(props.targetReply.response) : "unqueried");
  return <SelectedView key={key} {...props} />;
}
