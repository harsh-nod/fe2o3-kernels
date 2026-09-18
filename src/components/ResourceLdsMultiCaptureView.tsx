import { useEffect, useId, useState } from "react";
import { projectResourceLdsMultiCapture, type ResourceLdsMultiCaptureProjection, type RetainedLdsMultiCheckpoint } from "../content/resource-lds-multi-capture";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";
import { ResourceAccessView } from "./ResourceAccessView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import "./ResourceLdsMultiCaptureView.css";

export interface ResourceLdsMultiCaptureViewProps {
  retainedUtf8: string;
  /** Independent retained-byte pin, not source/compiler/launch authority. */
  expectedSha256: string;
}
type Ready = Extract<ResourceLdsMultiCaptureProjection, { status: "ready" }>;

function CheckpointPanels({ checkpoint, context }: { checkpoint: RetainedLdsMultiCheckpoint; context: ResourceMemoryContext }) {
  const [memoryIndex, setMemoryIndex] = useState(0), [accessIndex, setAccessIndex] = useState(0);
  const memory = checkpoint.memories[memoryIndex], access = checkpoint.accessPages[accessIndex];
  const absent = checkpoint.unavailableWindows[0];
  return <div className="resource-lds-multi-panels">
    <p>Exact captured cursor / revision: <strong>{checkpoint.expectedSnapshot.cursor.event_sequence} / {checkpoint.expectedSnapshot.cursor.state_revision}</strong>.
      Inventory and byte windows use this full anchor. Access pages are filtered history through this cursor, not a list of currently present allocations.</p>
    {checkpoint.id === "wg1_global_only" && <p className="resource-lds-multi-notice" data-testid="lds-multi-global-only">
      No LDS allocation appears in this checkpoint inventory. The recorded query for the earlier allocation returned no bytes.
      This is not an allocation-release event or a lifetime proof.</p>}
    {(checkpoint.id === "reverse_wg0" || checkpoint.id === "forward_wg1") && <p className="resource-lds-multi-notice">
      A restored cursor has its own newer revision. These are retained historical bytes, not current hardware state or physical-memory reuse.</p>}
    {checkpoint.id === "final" && <p className="resource-lds-multi-notice">This is the last captured operation, not a post-release snapshot.
      The inventory still contains LDS, but no LDS byte window was retained at this stop.</p>}
    <ResourceAccessView title="Current checkpoint allocations" {...checkpoint.inventory} expectedRequest={checkpoint.inventory.request}
      expectedSnapshot={checkpoint.expectedSnapshot} context={context} responseContext={context} />
    {memory ? <div data-testid="lds-multi-current-window">
      <label className="resource-lds-multi-selector">Current captured byte window
        <select aria-label="Two-workgroup captured byte window" value={memoryIndex} onChange={(event) => setMemoryIndex(Number(event.target.value))}>
          {checkpoint.memories.map((window, index) => <option key={String(window.request.request_id)} value={index}>
            {window.addressSpace === "global" ? "Global output" : "Workgroup / LDS"} — {window.allocationLabel}
          </option>)}
        </select>
      </label>
      <p>LDS has 256 captured bytes. Global output has 520 bytes: two 256-byte output viewports and an 8-byte canary viewport.
        Dwords group storage bytes; uninitialized storage does not establish program values.</p>
      <ResourceMemoryView key={String(memory.request.request_id)} title="Current captured byte window"
        response={memory.response} expectedSnapshot={checkpoint.expectedSnapshot} />
    </div> : <p role="status">No current byte window was retained at this checkpoint. No other stop&apos;s bytes are substituted.</p>}
    {absent && <div className="resource-lds-multi-absent" data-testid="lds-multi-unavailable-window">
      <h4>Unavailable window at this checkpoint</h4>
      <p>{absent.allocationLabel} is absent from this exact inventory. Its independently paired memory query returned zero bytes.
        Absence here does not establish owning scope, a release event, or lifetime.</p>
      <ResourceMemoryView title="Recorded unavailable byte window" response={absent.response} expectedSnapshot={checkpoint.expectedSnapshot} />
    </div>}
    {access ? <div className="resource-lds-multi-history" data-testid="lds-multi-history">
      <label className="resource-lds-multi-selector">Historical access page through selected cursor
        <select aria-label="Two-workgroup retained access page" value={accessIndex} onChange={(event) => setAccessIndex(Number(event.target.value))}>
          {checkpoint.accessPages.map((page, index) => <option key={String(page.request.request_id)} value={index}>
            WG{page.filterWorkgroup} filter — {page.allocationLabel} — request {String(page.request.request_id)}
          </option>)}
        </select>
      </label>
      <p>Recorded page filter: WG{access.filterWorkgroup}, {access.allocationLabel}.
        {access.allocationPresent ? " This allocation is present in the current inventory; the rows still describe history."
          : " This allocation is absent from the current inventory. Historical rows do not make it currently present."}</p>
      <p>One unchanged backend page is retained here; at most 64 rows are rendered at once. Earlier or later pages are not loaded.
        Local filtering is not a backend or all-history query. Continuation tokens remain inert evidence.</p>
      {access.rows === 0 && <p className="resource-lds-multi-notice">This retained page contains zero matching rows.
        {access.hasMorePages ? " It has a continuation token, so this empty page does not establish empty access history." : " This is a page result, not an allocation-lifetime fact."}</p>}
      <ResourceAccessView key={String(access.request.request_id)} title="Retained historical access page" {...access}
        expectedRequest={access.request} expectedSnapshot={checkpoint.expectedSnapshot} context={context} responseContext={context} />
    </div> : <p role="status">No access page was retained for this checkpoint; access history is not inferred from its inventory.</p>}
  </div>;
}

function CapturedMulti({ projection }: { projection: Ready }) {
  const [index, setIndex] = useState(0), checkpoint = projection.checkpoints[index];
  return <>
    <p>Actual source-produced V5 CPU observations of <code>workgroup_reduce_u32</code>: 128 workitems in two workgroups of 64,
      shown with logical wave width 32. These are not physical GPU waves or EXEC observations.</p>
    <p>Selecting a retained checkpoint does not step a debugger, query a backend, compile, launch, or change source.
      This example is independent of the raw-KIR timeline, old one-workgroup LDS example, and global assembly example.</p>
    <label className="resource-lds-multi-selector">Retained checkpoint
      <select aria-label="Retained two-workgroup LDS checkpoint" value={index} onChange={(event) => setIndex(Number(event.target.value))}>
        {projection.checkpoints.map((item, position) => <option key={item.id} value={position}>{item.label}</option>)}
      </select>
    </label>
    <CheckpointPanels key={checkpoint.anchorKey + checkpoint.id} checkpoint={checkpoint} context={projection.context} />
    <details className="resource-lds-multi-identities"><summary>Retained-byte identities and unavailable authority</summary>
      <dl>
        <dt>Display envelope SHA-256</dt><dd><code>{projection.sha256}</code></dd>
        <dt>Original receipt SHA-256</dt><dd><code>{projection.receiptSha256}</code></dd>
        <dt>Source file SHA-256</dt><dd><code>{projection.sourceSha256}</code></dd>
        <dt>Bundle FILE SHA-256</dt><dd><code>{projection.bundleFileSha256}</code> — not an admitted bundle subject identity</dd>
        <dt>Full response transcript SHA-256</dt><dd><code>{projection.context.captureIdentity}</code></dd>
        <dt>Caller-owned connection label</dt><dd>{projection.context.connectionId} — not a live backend identity</dd>
      </dl>
      <p>Hashes establish retained-byte consistency, not producer authentication. Compiler closure attestation and a qualified release pin remain unavailable.
        No curriculum publication, protected admission, load, launch, or resume authority is added.</p>
    </details>
    <p className="resource-lds-multi-notice">Distinct observed allocation IDs and generation zero do not establish owning scope, lifetime, allocation release,
      physical LDS base/layout/reuse, physical registers, source helper/loop qualification, per-access source association, bank conflicts, GPU execution, or GPU timing.</p>
  </>;
}

export function ResourceLdsMultiCaptureView({ retainedUtf8, expectedSha256 }: ResourceLdsMultiCaptureViewProps) {
  const headingId = useId();
  const [completed, setCompleted] = useState<{ raw: string; pin: string; projection: ResourceLdsMultiCaptureProjection } | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    void projectResourceLdsMultiCapture(retainedUtf8, expectedSha256, abort.signal).then((projection) => {
      if (!abort.signal.aborted) setCompleted({ raw: retainedUtf8, pin: expectedSha256, projection });
    });
    return () => { abort.abort(); };
  }, [retainedUtf8, expectedSha256]);
  // The render-time fence hides old values before replacement effects complete.
  // Abort cancels selection; WebCrypto itself may finish but cannot publish late.
  const projection = completed?.raw === retainedUtf8 && completed.pin === expectedSha256 ? completed.projection : null;
  return <section className="resource-lds-multi-capture" aria-labelledby={headingId} data-testid="retained-lds-multi-workgroup-example">
    <h3 id={headingId}>Two-workgroup source-produced LDS observation</h3>
    {projection === null ? <p role="status">Checking retained byte integrity; no prior checkpoint is shown.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No retained resource values are shown.</p>
        : <CapturedMulti key={projection.sha256} projection={projection} />}
  </section>;
}
