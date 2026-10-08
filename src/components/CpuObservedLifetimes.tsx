import { useId } from "react";
import type { CpuObservedCollection } from "../lib/cpu-observed-collection";
import { projectCpuObservedLifetimes, type CpuObservedLifetimes } from "../lib/cpu-observed-lifetimes";


export function CpuObservedLifetimesView({ collection }: { collection: CpuObservedCollection }) {
  const heading = useId();
  let view: CpuObservedLifetimes;
  try { view = projectCpuObservedLifetimes(collection); }
  catch { view = { status: "unavailable", reason: "Invalid or incompatible lifecycle observations; no prior derived values are substituted." }; }
  return <section aria-labelledby={heading}>
    <h4 id={heading}>Logical storage lifetimes and byte demand</h4>
    <p>Derived from retained CPU allocation transitions, in sequence order—not GPU time.
      Byte demand is the sum of live logical allocation lengths, not allocator capacity,
      cached pool storage, RSS, physical LDS layout or register pressure.</p>
    {view.status === "unavailable" ? <p role="status">{view.reason}</p> : <>
      <p>{view.completeThroughSelection
        ? `Complete lifecycle prefix through selected watermark ${view.selectedThrough}.`
        : `Partial lifecycle prefix: observed through ${view.observedThrough} of selected watermark ${view.selectedThrough}. Current live bytes are unavailable; later creates, releases and peaks are unknown.`}
        {" "}Metadata coverage: {view.metadataCoverage}. Legacy capture: {view.captureComplete ? "complete" : "truncated"}.
        Neither status establishes a complete execution or a whole-run peak.</p>
      <p>Workgroups and invocations remain separate exact scopes. Reuse of one storage slot does not
        merge allocation identities or their scopes. Preexisting allocations have unknown creation times.</p>
      {view.groups.length === 0 ? <p>No allocation transitions in this retained prefix.</p> :
        <table tabIndex={0}>
          <caption>Logical byte demand by address space and exact owning scope</caption>
          <thead><tr><th scope="col">Space / scope</th><th scope="col">Live bytes {view.completeThroughSelection ? "at selection" : "at prefix end"}</th>
            <th scope="col">Peak bytes in retained prefix</th><th scope="col">First positive peak sequence</th><th scope="col">Live allocations at prefix end</th></tr></thead>
          <tbody>{view.groups.map((group, index) => <tr key={group.key}>
            <th scope="row">Group {index + 1}: {group.addressSpace}<br /><code>{JSON.stringify(group.scope, (_, value: unknown) => typeof value === "bigint" ? value.toString() : value)}</code></th>
            <td>{group.prefixLiveBytes}</td><td>{group.prefixPeakBytes}{!view.completeThroughSelection && " (lower bound through selection)"}</td>
            <td>{group.peakSequence ?? "No positive byte demand"}</td><td>{group.prefixLiveAllocations}</td>
          </tr>)}</tbody>
        </table>}
      {view.lifetimes.length > 0 && <table tabIndex={0}>
        <caption>Allocation lifetimes; release is the exclusive end boundary</caption>
        <thead><tr><th scope="col">Allocation / slot / generation</th><th scope="col">Scope group / bytes</th>
          <th scope="col">Observed beginning</th><th scope="col">End / retained status</th><th scope="col">Actual reused predecessor</th></tr></thead>
        <tbody>{view.lifetimes.map(lifetime => <tr key={lifetime.allocation}>
          <th scope="row">{lifetime.allocation} / {lifetime.storageSlot} / {lifetime.generation}</th>
          <td>Group {view.groups.findIndex(group => group.key === lifetime.groupKey) + 1}; {lifetime.bytes} bytes</td>
          <td>{lifetime.createdSequence === null
            ? `Preexisting; first observed at ${lifetime.firstObservedSequence}; creation unknown`
            : `Created at ${lifetime.createdSequence}`}</td>
          <td>{lifetime.releasedSequence !== null ? `Released at ${lifetime.releasedSequence} (exclusive)`
            : view.completeThroughSelection ? `Live through selected watermark ${view.selectedThrough}; later release unknown`
              : `Open at prefix ${view.observedThrough}; state at selection unknown`}</td>
          <td>{lifetime.previousAllocation ?? "None observed"}</td>
        </tr>)}</tbody>
      </table>}
      <p>These tables issue no requests and follow no pagination tokens. Change the debugger cursor
        and refresh explicitly to select another observation; no terminal release is invented.</p>
    </>}
  </section>;
}
