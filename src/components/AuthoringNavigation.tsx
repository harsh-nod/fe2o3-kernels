import { useEffect, useState } from 'react';
import { navigationCoordinateKey, navigationOccurrences, projectAuthoringNavigation, type NavigationInput, type NavigationProjection, type NavigationView, type NavigationOperation } from '../content/authoring-navigation.mjs';
import './AuthoringNavigation.css';

function SourceText({ view, operation }: { view: NavigationView; operation: NavigationOperation | undefined }) {
  const ranges = operation ? view.attributions.filter(row => navigationCoordinateKey(row.coordinate) === navigationCoordinateKey(operation.coordinate)) : [];
  const endpoints = [...new Set([0, view.source.bytes, ...ranges.flatMap(row => [row.byte_start, row.byte_end])])].sort((a, b) => a - b);
  const bytes = new TextEncoder().encode(view.source.utf8), decoder = new TextDecoder('utf-8', { fatal: true });
  return <pre aria-label="Retained ordinary Rust source"><code>{endpoints.slice(0, -1).map((start, index) => {
    const end = endpoints[index + 1], content = decoder.decode(bytes.slice(start, end));
    return ranges.some(row => row.byte_start < end && start < row.byte_end) ? <mark key={start}>{content}</mark> : <span key={start}>{content}</span>;
  })}</code></pre>;
}
function OperationFacts({ operation, view }: { operation: NavigationOperation; view: NavigationView }) {
  const hasBoundary = navigationCoordinateKey(operation.coordinate) === navigationCoordinateKey(view.selector.operations[0]);
  return <section aria-label="Selected KIR operation">
    <h4>Occurrence {navigationCoordinateKey(operation.coordinate)} — {operation.semantic_detail ?? operation.kind}</h4>
    <p>Source attribution: {operation.source_spans.length ? `${operation.source_spans.length} retained range(s), highlighted above` : 'Unavailable: no source origin'}. This is not ownership of a Rust variable or expression.</p>
    <p>Inputs: {operation.inputs.map(value => `%${value.value}: ${value.ty}`).join(', ') || 'None declared'}. Results: {operation.results.map(value => `%${value.value}: ${value.ty}`).join(', ') || 'None declared'}.</p>
    <p>Local memory effects: {operation.local_memory_effects.join(', ') || 'No listed effects'}. Local summary complete: {String(operation.complete_local_effect_summary)}.</p>
    <p>Traps: {operation.traps}. Convergence: {operation.convergence}. Physical resources: unavailable.</p>
    {hasBoundary ? <section aria-label="Retained structural boundary"><h5>Exact retained structural boundary</h5>
      <p>Live-in: {view.region.live_in.map(value => `%${value.value}: ${value.ty}`).join(', ')}.</p>
      <p>Live-out: {view.region.live_out.map(value => `%${value.value}: ${value.ty}`).join(', ')}.</p>
      <p>{view.region.structural_boundary}</p>
      <p>Source insertion: {view.region.source_insertion_boundary}. No editable source boundary is granted.</p>
    </section> : <p role="status">Boundary unavailable for this occurrence: no matching select response was retained. Inputs/results alone are not a region live-in/live-out analysis.</p>}
  </section>;
}
function NavigationReady({ projection }: { projection: Extract<NavigationProjection, { status: 'ready' }> }) {
  const view = projection.navigation;
  const [selection, setSelection] = useState<{ range: { start: number; end: number } | null; operation: string | null }>({ range: null, operation: null });
  const operation = view.operations.find(row => navigationCoordinateKey(row.coordinate) === selection.operation);
  const uniqueRanges = [...new Map(view.attributions.filter(row => row.byte_start < row.byte_end).map(row => [`${row.byte_start}:${row.byte_end}`, row])).values()].sort((a, b) => a.byte_start - b.byte_start || a.byte_end - b.byte_end);
  const candidates = selection.range ? navigationOccurrences(view, selection.range.start, selection.range.end) : [];
  const sourceBytes = new TextEncoder().encode(view.source.utf8);
  const button = (row: NavigationOperation) => <button type="button" key={navigationCoordinateKey(row.coordinate)} aria-pressed={selection.operation === navigationCoordinateKey(row.coordinate)} onClick={() => setSelection(previous => ({ ...previous, operation: navigationCoordinateKey(row.coordinate) }))}>
    {navigationCoordinateKey(row.coordinate)} {row.semantic_detail ?? row.kind}
  </button>;
  return <>
    <p role="status">{projection.kind === 'synthetic_test_only' ? 'Synthetic test-only navigation. Not source or compiler evidence.' : 'Retained ordinary-source navigation; diagnostic attribution, not authenticated source ownership.'}</p>
    <div className="authoring-navigation-columns"><section aria-label="Source attribution navigation"><h4>Ordinary Rust text</h4>
      <SourceText view={view} operation={operation} />
      <p>Select a half-open UTF-8 byte range to list every overlapping operation. Equal spans are not merged into one occurrence.</p>
      <ul aria-label="Attributed source ranges">{uniqueRanges.map(row => <li key={`${row.byte_start}:${row.byte_end}`}><button type="button"
        aria-pressed={selection.range?.start === row.byte_start && selection.range.end === row.byte_end}
        onClick={() => setSelection({ range: { start: row.byte_start, end: row.byte_end }, operation: null })}>
        Bytes {row.byte_start}–{row.byte_end}: {new TextDecoder().decode(sourceBytes.slice(row.byte_start, row.byte_end))}
      </button></li>)}</ul>
      {selection.range && <section aria-label="Source attribution candidates"><p role="status">{candidates.length > 1 ? `Ambiguous attribution: ${candidates.length} distinct operation occurrences. Choose one explicitly.` : `${candidates.length} attributed occurrence(s); no operation selected automatically.`}</p>
        <ul>{candidates.map(row => <li key={navigationCoordinateKey(row.coordinate)}>{button(row)}</li>)}</ul>
      </section>}
    </section><section aria-label="Canonical KIR navigation"><h4>Canonical SIMT KIR V11</h4>
      <p>Exact roster ordinals, not rustc local IDs or cross-build identities.</p>
      <ol aria-label="KIR operation occurrences">{view.operations.map(row => <li key={navigationCoordinateKey(row.coordinate)}>{button(row)}</li>)}</ol>
      {operation ? <OperationFacts operation={operation} view={view} /> : <p>Select an explicit operation occurrence to inspect its retained facts.</p>}
    </section></div>
    <section aria-label="Stage availability"><h4>Available levels and explicit gaps</h4><dl>
      <dt>Rust text</dt><dd>Retained bytes joined to a same-run diagnostic source census; typed HIR unavailable.</dd>
      <dt>Canonical KIR V11</dt><dd>Retained operations and one validated structural region boundary; not an editable compiler owner.</dd>
      <dt>Semantic MIR</dt><dd>Identity only; body navigation unavailable.</dd>
      <dt>Scheduled/tile Rust and separate neutral/target lineage</dt><dd>Unavailable: no separate retained snapshots.</dd>
      <dt>LLVM</dt><dd>Unavailable: compiler-handoff text not retained.</dd>
      <dt>Final ISA</dt><dd>Unavailable: this export precedes the final artifact.</dd>
      <dt>Physical registers, lifetimes and selected runtime values</dt><dd>Unavailable: no physical-resource or selected-value observation.</dd>
    </dl></section>
    <details><summary>Exact retained identities and availability</summary>
      <p>Target: {view.summary.target}; bundle: <code>{view.summary.bundle_identity}</code>; KIR: <code>{view.summary.canonical_kir_digest}</code>.</p>
      <p>Source bytes SHA-256: <code>{view.source.sha256}</code>; census file identity: <code>{view.source_file_identity}</code>. These identities have different meanings.</p>
      <p>Semantic MIR identity: <code>{view.summary.semantic_mir_identity}</code>; retained capture SHA-256: <code>{projection.sourceCaptureSha256}</code>.</p>
      <dl>{Object.entries(view.availability).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
    </details>
  </>;
}
export function AuthoringNavigation({ input }: { input: NavigationInput | null }) {
  const [completed, setCompleted] = useState<{ input: NavigationInput | null; projection: NavigationProjection } | null>(null);
  useEffect(() => { let current = true; void projectAuthoringNavigation(input).then(projection => { if (current) setCompleted({ input, projection }); }); return () => { current = false; }; }, [input]);
  const projection = completed !== null && completed.input === input ? completed.projection : null;
  return <section className="authoring-navigation" aria-label="Read-only authoring navigation">
    <h3>Ordinary source ↔ canonical KIR attribution</h3>
    <p>Immutable display only. No fetch, edit, materialize, compile, simulate, launch or resume actions. Hash checks establish byte consistency, not proof or authenticated compiler execution.</p>
    {projection === null ? <p role="status">Checking retained navigation bytes; previous selections are hidden.</p> : projection.status === 'ready' ? <NavigationReady key={projection.captureKey} projection={projection} /> : <p role="status" data-state={projection.status}>{projection.detail}</p>}
  </section>;
}
