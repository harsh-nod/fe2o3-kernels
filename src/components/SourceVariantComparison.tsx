import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { HighlightedCode } from "./HighlightedCode";
import { projectSourceVariantComparison, type SourceVariantCase, type SourceVariantComparisonProjection } from "../content/source-variant-comparison";
import { coordinateKey } from "../content/source-variant-comparison-shape";
import "./SourceVariantComparison.css";

export interface SourceVariantComparisonProps {
  evidence: unknown;
  /** Independent caller-selected observation receipt, not an authority token. */
  expectedReceiptSha256: string;
}
type Ready = Extract<SourceVariantComparisonProjection, { status: "ready" }>;

function VariantDetails({ variant }: { variant: SourceVariantCase }) {
  const [selected, setSelected] = useState<number | null>(null);
  const operation = selected === null ? null : variant.operations[selected];
  return <>
    <h4>Exact retained source</h4>
    <p>No author-facing namespace rewrite is applied. This text was separately exported from the WIP compiler build.</p>
    <pre aria-label={`${variant.label} exact source`}><HighlightedCode code={variant.source} language="rust" /></pre>
    {variant.helper !== null && <details>
      <summary>Exact appended helper source</summary>
      <pre><HighlightedCode code={variant.helper} language="rust" /></pre>
      <p>Helper SHA-256: <code>{variant.helperSha256}</code></p>
    </details>}
    <h4>Operations in this variant only</h4>
    <p>Coordinates are local to this snapshot. A row in another variant with the same numbers is not a correspondence.
      The operation DTO reports a call but does not expose its callee target; no call-edge mapping is inferred here.</p>
    <div className="source-variant-table-scroll">
      <table aria-label={`${variant.label} retained operations`}>
        <thead><tr><th scope="col">Snapshot coordinate</th><th scope="col">Kind</th><th scope="col">Scalar detail / instruction</th><th scope="col">Inputs → results</th></tr></thead>
        <tbody>{variant.operations.map((row, index) => <tr key={coordinateKey(row.coordinate)}>
          <th scope="row"><button type="button" aria-pressed={selected === index}
            aria-label={`Inspect operation ${coordinateKey(row.coordinate)}`} onClick={() => setSelected(index)}>
            {coordinateKey(row.coordinate)}</button></th>
          <td>{row.kind}</td><td>{row.mnemonic ?? row.detail ?? "not reported"}</td>
          <td>{row.inputs.map((value) => `v${value.value}`).join(", ") || "none"} → {row.results.map((value) => `v${value.value}`).join(", ") || "none"}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {operation === null ? <p role="status">No operation selected in this variant.</p> : <section aria-label="Selected operation detail" className="source-variant-operation">
      <h4>Selected operation {coordinateKey(operation.coordinate)}</h4>
      <p>Function label: <code>{operation.functionName}</code></p>
      <p>Kind: <code>{operation.kind}</code>; instruction: <code>{operation.mnemonic ?? "unavailable — not an assembly operation"}</code>.</p>
      <p>Inputs: {operation.inputs.map((value) => `v${value.value}: ${value.ty}`).join(", ") || "none"}.
        Results: {operation.results.map((value) => `v${value.value}: ${value.ty}`).join(", ") || "none"}.</p>
      {operation.sourceReferences === null ? <p>Assembly source references: unavailable for this ordinary operation.</p> : <dl>
        {Object.entries(operation.sourceReferences).map(([key, value]) => <div key={key}><dt>{key}</dt><dd><code>{value}</code></dd></div>)}
      </dl>}
      <p>Retained source-map labels (not file-content authentication): {operation.sourceSpans.map((span) =>
        `${span.displayPath} [${span.byteStart}, ${span.byteEnd})`).join("; ") || "unavailable"}.</p>
      <p>Physical registers and exact machine encoding are unavailable. Traps and convergence are not analyzed by this view.</p>
    </section>}
    <details><summary>Exact retained operation response</summary><pre><code>{variant.operationsJson}</code></pre></details>
    <details><summary>Exact CPU result bytes and initialization</summary>
      <p>Output storage: <code>{variant.bytes}</code>; initialization: <code>{variant.initialized}</code>.</p>
      <pre><code>{variant.simulationJson}</code></pre>
    </details>
  </>;
}

function ComparisonReady({ projection }: { projection: Ready }) {
  const [active, setActive] = useState(0);
  const prefix = useId();
  const selected = projection.variants[active];
  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    if (event.key === "ArrowLeft") next = (active + 2) % 3;
    else if (event.key === "ArrowRight") next = (active + 1) % 3;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 2;
    else return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`${prefix}-variant-${next}`)?.focus();
  }
  return <>
    <p className="source-variant-boundary">Actual retained source-export and CPU-case observations. The exporter build was work in progress;
      its compiler commit pin and qualified release pin are unavailable. Hash checks establish retained-byte consistency, not producer authentication.</p>
    <p>Source fixture: <code>{projection.sourcePath}</code>. Capture: <code>{projection.captureName}</code>.</p>
    <p>Receipt SHA-256: <code>{projection.receiptSha256}</code>. Original selection: <code>{coordinateKey(projection.originalSelection)}</code>.</p>
    <div className="source-variant-table-scroll">
      <table aria-label="Independent CPU case comparison">
        <thead><tr><th scope="col">Actual source variant</th><th scope="col">Four output words</th><th scope="col">Two trailing canary words</th></tr></thead>
        <tbody>{projection.variants.map((variant) => <tr key={variant.id}><th scope="row">{variant.label}</th>
          <td>{variant.expectedWord} each</td><td><code>deadbeefcafebabe</code> unchanged</td></tr>)}</tbody>
      </table>
    </div>
    <p>Inputs: <code>a = 0xfffffff0</code>, <code>b = 0x25</code>. This is one independent differential CPU case.
      The edited output intentionally changes from 469 to 0; it is not a semantics-preserving optimization claim.</p>
    <details><summary>Fresh source and executable identities</summary>
      <div className="source-variant-table-scroll"><table aria-label="Exact variant identities">
        <thead><tr><th scope="col">Identity</th>{projection.variants.map((variant) => <th scope="col" key={variant.id}>{variant.label}</th>)}</tr></thead>
        <tbody>{([
          ["Source SHA-256", "sourceSha256"], ["Bundle file SHA-256", "bundleSha256"], ["Bundle identity", "bundleIdentity"],
          ["Canonical KIR", "kirDigest"], ["Semantic MIR", "semanticMirIdentity"], ["Preflight receipt", "preflightIdentity"],
        ] as const).map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{projection.variants.map((variant) => <td key={variant.id}><code>{variant[key]}</code></td>)}</tr>)}</tbody>
      </table></div>
    </details>
    <details><summary>Original materializer draft</summary>
      <p>Generating this draft did not itself compile or admit it. The two concrete source candidates were freshly exported later.
        Draft SHA-256: <code>{projection.generatedHelperSha256}</code>.</p>
      <pre><HighlightedCode code={projection.generatedHelper} language="rust" /></pre>
    </details>
    <div role="tablist" aria-label="Retained source variant" className="source-variant-tabs" onKeyDown={handleKeys}>
      {projection.variants.map((variant, index) => <button type="button" role="tab" key={variant.id}
        id={`${prefix}-variant-${index}`} aria-selected={active === index} aria-controls={`${prefix}-panel`}
        tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}>{variant.label}</button>)}
    </div>
    <div role="tabpanel" id={`${prefix}-panel`} aria-labelledby={`${prefix}-variant-${active}`}>
      <VariantDetails key={selected.bundleIdentity} variant={selected} />
    </div>
    <p className="source-variant-boundary">Read-only retained comparison: no source editor, compiler, execution, schedule recipe, or launch action.
      Universal equivalence, final ranked verification, protected artifact admission, physical machine state, hardware execution,
      and performance are not established. Displayed source references grant no authentication or production-resume authority.</p>
  </>;
}

export function SourceVariantComparison({ evidence, expectedReceiptSha256 }: SourceVariantComparisonProps) {
  const [completed, setCompleted] = useState<{
    evidence: unknown; expected: string; projection: SourceVariantComparisonProjection;
  } | null>(null);
  useEffect(() => {
    let current = true;
    void projectSourceVariantComparison(evidence, expectedReceiptSha256).then((projection) => {
      if (current) setCompleted({ evidence, expected: expectedReceiptSha256, projection });
    });
    return () => { current = false; };
  }, [evidence, expectedReceiptSha256]);
  // A changed input hides old rows immediately, before its effect/hash work runs.
  const projection = completed !== null && completed.evidence === evidence && completed.expected === expectedReceiptSha256 ? completed.projection : null;
  return <section className="source-variant-comparison" aria-label="Actual source variant comparison">
    <h3>Ordinary Rust → generated helper → explicit instruction edit</h3>
    {projection === null ? <p role="status">Checking retained byte integrity; no prior source or operation selection is shown.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No source comparison is shown.</p>
        : <ComparisonReady key={projection.receiptSha256} projection={projection} />}
  </section>;
}
