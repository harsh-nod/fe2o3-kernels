import { useEffect, useRef, useState } from "react";
import { compareOrderedOrigin, parseOrderedOriginJson, type OrderedOriginSubject,
  type OrderedOriginView, type OrderedOriginSpan } from "../content/ordered-origin-observation.mjs";
import { readOrderedOriginFile } from "../content/ordered-origin-file";
import "./OrderedOriginImport.css";

export interface OrderedOriginImportProps {
  /** Include native variant identity; selecting O0/O3 must not retain old origin metadata. */
  selectionIdentity: string;
  caseLabel: string;
  selected: OrderedOriginSubject;
  synthetic: boolean;
}
type State = { status: "empty" | "reading" | "refused" } | { status: "ready"; origin: OrderedOriginView };

function Span({ label, value }: { label: string; value: OrderedOriginSpan }) {
  return <section aria-label={label}>
    <h5>{label}</h5>
    <dl>
      <div><dt>Compiler file identity (not a path)</dt><dd><code>{value.file_identity}</code></dd></div>
      <div><dt>Byte span</dt><dd>{value.byte_start}..{value.byte_end}</dd></div>
      <div><dt>Reported line and column span</dt><dd>{value.line_start}:{value.column_start} through {value.line_end}:{value.column_end}</dd></div>
    </dl>
  </section>;
}
function Origin({ origin, selected, synthetic }: { origin: OrderedOriginView; selected: OrderedOriginSubject; synthetic: boolean }) {
  const comparison = compareOrderedOrigin(origin, selected);
  return <section aria-label="Imported whole-region origin">
    <p role="status" data-state={comparison.status}>{comparison.status === "mismatch"
      ? "Origin does not match the selected native case. These reports must not be joined."
      : "Reported identities match the selected native case; this is consistency only, not authenticated provenance."}</p>
    {comparison.status === "mismatch" && <ul aria-label="Origin identity mismatches">
      {comparison.mismatches.map(label => <li key={label}>{label}</li>)}
    </ul>}
    {synthetic && <p>Selected comparison is synthetic test data, not native qualification.</p>}
    <p>Imported metadata is untrusted diagnostic JSON. Matching hashes do not authenticate its producer or source.
      Every declared instruction is associated only with the whole ordered region.</p>
    <Span label="Source call-site span" value={origin.callSite} />
    <Span label="Macro expansion span" value={origin.expansion} />
    <dl>
      <div><dt>Observed macro depth</dt><dd>{origin.expansionDepth}</dd></div>
      <div><dt>Expansion-chain digest (not a frame list)</dt><dd><code>{origin.expansionChainSha256}</code></dd></div>
      <div><dt>Declared descriptors in order</dt><dd><code>{origin.declaredDescriptors.join(", ")}</code></dd></div>
      <div><dt>Target / wave width</dt><dd>{origin.target} / {origin.waveWidth}</dd></div>
      <div><dt>Raw rustc MIR block</dt><dd>{origin.rustcMirBlock}</dd></div>
      <div><dt>Semantic function / block</dt><dd>{origin.semanticFunction} / {origin.semanticBlock}</dd></div>
      <div><dt>KIR roster coordinate / raw block</dt><dd>{origin.coordinate.join(", ")} / {origin.rawBlock}</dd></div>
      <div><dt>Source reobservation work reported</dt><dd>{origin.workUsed} / 1048576</dd></div>
    </dl>
    <details><summary>Imported compiler identity bindings</summary><dl>
      {([
        ["Canonical KIR identity", origin.canonicalSha256], ["Semantic MIR identity", origin.semanticSha256],
        ["Source inventory identity", origin.sourceInventorySha256], ["Source preflight identity", origin.sourcePreflightSha256],
        ["Root function identity", origin.rootFunctionSha256], ["Root monomorphization identity", origin.rootMonomorphizationSha256],
        ["Complete rustc MIR body identity", origin.rustcMirBodySha256], ["Semantic block identity", origin.semanticBlockIdentity],
        ...Object.entries(origin.declaredSourceIds).map(([label, value]) => ["Declared source " + label, value]),
      ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><code>{value}</code></dd></div>)}
    </dl></details>
    <p>Unavailable: per-instruction source spans, full macro expansion frames, source-map identity,
      compiler-policy identity, edit epoch, schedule identity, native-artifact binding in this report,
      physical register values and physical register lifetimes.</p>
    <p>No filename is inferred from a compiler file identity. Descriptor order is not macro ancestry,
      instruction execution, or a physical register lifetime.</p>
  </section>;
}
function SelectedOriginImport({ selected, caseLabel, synthetic }: OrderedOriginImportProps) {
  const [state, setState] = useState<State>({ status: "empty" });
  const pending = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);
  const clear = () => {
    pending.current?.abort(); pending.current = null; setState({ status: "empty" });
    if (input.current) input.current.value = "";
  };
  const choose = (file: File | undefined) => {
    pending.current?.abort(); pending.current = null;
    if (!file) { setState({ status: "empty" }); return; }
    const controller = new AbortController(); pending.current = controller;
    setState({ status: "reading" });
    void readOrderedOriginFile(file, controller.signal).then(raw => {
      if (controller.signal.aborted || pending.current !== controller) return;
      const origin = parseOrderedOriginJson(raw);
      pending.current = null; setState({ status: "ready", origin });
    }).catch(() => {
      if (!controller.signal.aborted && pending.current === controller) {
        pending.current = null; setState({ status: "refused" });
      }
    });
  };
  return <section className="ordered-origin-import" aria-label="Optional ordered-origin import">
    <h4>Optional whole-region source origin for {caseLabel}</h4>
    <p>Select a separate report for this exact native variant. Switching case or replacing the native capsule
      clears the report; no origin is loaded automatically.</p>
    <label>Ordered-origin report (local JSON)
      <input ref={input} type="file" accept=".json,application/json"
        onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; choose(file); }} />
    </label>
    <button type="button" onClick={clear}>Clear ordered-origin import</button>
    <p>Import bound: one nonempty exact UTF-8 report up to 16 KiB, at most 16 declared instructions and
      256 observed macro parents. This is not a process-memory bound. No file path is followed,
      source compiled, native code executed, network request made, or proof/resume authority granted.</p>
    {state.status === "ready" ? <Origin origin={state.origin} selected={selected} synthetic={synthetic} />
      : <p role="status">{state.status === "empty" ? "No ordered-origin report selected."
        : state.status === "reading" ? "Reading the bounded origin report; previous origin metadata is cleared."
          : "Ordered-origin report refused. Use the closed whole-region schema and a nonempty exact UTF-8 file up to 16 KiB. No previous origin metadata is shown."}</p>}
  </section>;
}
export function OrderedOriginImport(props: OrderedOriginImportProps) {
  return <SelectedOriginImport key={props.selectionIdentity} {...props} />;
}
