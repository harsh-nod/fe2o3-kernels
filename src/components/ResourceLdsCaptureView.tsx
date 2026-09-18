import { useEffect, useId, useState } from "react";
import { projectResourceLdsCapture, type ResourceLdsCaptureProjection, type RetainedLdsCheckpoint } from "../content/resource-lds-capture";
import type { ResourceMemoryContext } from "../lib/resource-memory-controller";
import { ResourceAccessView } from "./ResourceAccessView";
import { ResourceMemoryView } from "./ResourceMemoryView";
import "./ResourceLdsCaptureView.css";

export interface ResourceLdsCaptureViewProps {
  retainedUtf8: string;
  /** Independent retained-byte display pin, not compiler or launch authority. */
  expectedSha256: string;
}
type Ready = Extract<ResourceLdsCaptureProjection, { status: "ready" }>;

function CheckpointPanels({ checkpoint, context }: { checkpoint: RetainedLdsCheckpoint; context: ResourceMemoryContext }) {
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [accessIndex, setAccessIndex] = useState(0);
  const memory = checkpoint.memories[memoryIndex];
  const access = checkpoint.accessPages[accessIndex];
  const missing = ["workgroup", "global"].filter((space) => !checkpoint.memories.some((window) => window.addressSpace === space));
  return <div className="resource-lds-panels">
    <p>Exact captured cursor / revision: <strong>{checkpoint.expectedSnapshot.cursor.event_sequence} / {checkpoint.expectedSnapshot.cursor.state_revision}</strong>.
      All panels below are bound to that full anchor, including logical scope and source association.</p>
    {checkpoint.id === "final" && <p className="resource-lds-notice">This is the last captured operation, not a post-release snapshot.
      Allocation release, reuse, and lifetime are not established.</p>}
    <ResourceAccessView title="LDS example allocation inventory" {...checkpoint.inventory}
      expectedRequest={checkpoint.inventory.request} expectedSnapshot={checkpoint.expectedSnapshot}
      context={context} responseContext={context} />
    <label className="resource-lds-selector">Captured byte window
      <select aria-label="Captured LDS example byte window" value={memoryIndex}
        onChange={(event) => setMemoryIndex(Number(event.target.value))}>
        {checkpoint.memories.map((window, index) => <option key={window.addressSpace} value={index}>
          {window.addressSpace === "workgroup" ? "Workgroup / LDS" : "Global output"} — request {String(window.request.request_id)}
        </option>)}
      </select>
    </label>
    {missing.length > 0 && <p>{missing.join(" and ")} byte window not retained at this checkpoint. No other checkpoint's bytes are substituted.</p>}
    <p>The 256-byte LDS window fits one byte viewport. Select “Dword (4 bytes)” for 64 byte groups; these are storage bytes, not decoded program values.
      Global output has a separate trailing window for its canary bytes.</p>
    <ResourceMemoryView key={String(memory.request.request_id)}
      title={memory.addressSpace === "workgroup" ? "Captured workgroup / LDS bytes" : "Captured global output bytes"}
      response={memory.response} expectedSnapshot={checkpoint.expectedSnapshot} />
    {access ? <>
      <label className="resource-lds-selector">Captured access page
        <select aria-label="Captured LDS example access page" value={accessIndex}
          onChange={(event) => setAccessIndex(Number(event.target.value))}>
          {checkpoint.accessPages.map((page, index) => <option key={page.addressSpace} value={index}>
            {page.addressSpace === "workgroup" ? "Workgroup / LDS" : "Global output"} — request {String(page.request.request_id)}
          </option>)}
        </select>
      </label>
      <p>One unchanged backend page is shown, at most 64 rows at once. It may start after a retained continuation token.
        Earlier and later pages are not loaded here; local filtering is not an all-history or backend query.</p>
      <ResourceAccessView key={String(access.request.request_id)} title="LDS example captured access page" {...access}
        expectedRequest={access.request} expectedSnapshot={checkpoint.expectedSnapshot}
        context={context} responseContext={context} />
    </> : <p role="status">No access page was retained for this checkpoint.</p>}
  </div>;
}

function CapturedLds({ projection }: { projection: Ready }) {
  const [index, setIndex] = useState(0);
  const checkpoint = projection.checkpoints[index];
  return <>
    <p>Actual retained source-produced V5 CPU observations from <code>workgroup_reduce_u32</code>:
      64 workitems in one workgroup, displayed as two logical waves of width 32. These labels do not describe physical GPU waves or EXEC.</p>
    <p>Read-only retained checkpoints: selecting one does not step a debugger, query a backend, compile, launch, or change source.
      This example is independent of any raw-KIR timeline and the separate global assembly example.</p>
    <label className="resource-lds-selector">Retained checkpoint
      <select aria-label="Retained LDS checkpoint" value={index} onChange={(event) => setIndex(Number(event.target.value))}>
        {projection.checkpoints.map((item, position) => <option key={item.id} value={position}>{item.label}</option>)}
      </select>
    </label>
    <CheckpointPanels key={checkpoint.anchorKey + checkpoint.id} checkpoint={checkpoint} context={projection.context} />
    <details className="resource-lds-identities"><summary>Retained-byte identities and unavailable authority</summary>
      <dl>
        <dt>Display envelope SHA-256</dt><dd><code>{projection.sha256}</code></dd>
        <dt>Original receipt SHA-256</dt><dd><code>{projection.receiptSha256}</code></dd>
        <dt>Source file SHA-256</dt><dd><code>{projection.sourceSha256}</code></dd>
        <dt>Bundle FILE SHA-256</dt><dd><code>{projection.bundleFileSha256}</code> — not an admitted bundle subject identity</dd>
        <dt>Full response transcript SHA-256</dt><dd><code>{projection.context.captureIdentity}</code></dd>
        <dt>Caller-owned connection label</dt><dd>{projection.context.connectionId} — not a live backend identity</dd>
      </dl>
      <p>Hash checks establish retained-byte consistency, not producer authentication. Compiler closure attestation and a qualified release pin are unavailable.
        This display adds no curriculum publication, protected admission, load, launch, or resume authority.</p>
    </details>
    <p className="resource-lds-notice">Allocation generation zero is a producer profile, not lifecycle evidence.
      Owning scope, allocation lifetime/reuse, physical LDS base/layout, physical registers, per-access source association,
      bank conflicts, GPU execution, and GPU timing remain unavailable.</p>
  </>;
}

export function ResourceLdsCaptureView({ retainedUtf8, expectedSha256 }: ResourceLdsCaptureViewProps) {
  const headingId = useId();
  const [completed, setCompleted] = useState<{
    raw: string; pin: string; projection: ResourceLdsCaptureProjection;
  } | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    void projectResourceLdsCapture(retainedUtf8, expectedSha256, abort.signal).then((projection) => {
      if (!abort.signal.aborted) setCompleted({ raw: retainedUtf8, pin: expectedSha256, projection });
    });
    return () => { abort.abort(); };
  }, [retainedUtf8, expectedSha256]);
  // Hide prior values during the render that changes either fence, before the
  // next effect starts. Aborting invalidates completion; WebCrypto is not stopped.
  const projection = completed?.raw === retainedUtf8 && completed.pin === expectedSha256 ? completed.projection : null;
  return <section className="resource-lds-capture" aria-labelledby={headingId} data-testid="retained-lds-resource-example">
    <h3 id={headingId}>Source-produced global and LDS checkpoints</h3>
    {projection === null ? <p role="status">Checking retained byte integrity; no prior checkpoint is shown.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No retained resource values are shown.</p>
        : <CapturedLds key={projection.sha256} projection={projection} />}
  </section>;
}
