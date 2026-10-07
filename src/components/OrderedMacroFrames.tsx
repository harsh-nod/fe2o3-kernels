import { useEffect, useState } from 'react';
import { projectOrderedMacroFrames, type MacroFramesInput, type MacroFramesProjection, type MacroLocation } from '../content/ordered-macro-frames.mjs';

function Location({ name, value }: { name: string; value: MacroLocation }) {
  return <section aria-label={name}>
    <h5>{name}</h5>
    <p>Compiler file identity: <code>{value.fileIdentity}</code> (not a source-byte hash).</p>
    <p>Bytes [{value.start}, {value.end}); line {value.lineStart}:{value.columnStart} to {value.lineEnd}:{value.columnEnd}.</p>
    {value.excerpt === null ? <p>Source bytes unavailable; no file name or source text inferred.</p> : <>
      <p>Selected file: <code>{value.path}</code></p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><code>{value.excerpt}</code></pre>
    </>}
  </section>;
}
function Ready({ value }: { value: Extract<MacroFramesProjection, { status: 'ready' }> }) {
  const [index, setIndex] = useState(0), frame = value.frames[index];
  return <>
    <p role="status">Retained compiler diagnostic frames. Integrity checked; compiler execution and source authority are not authenticated by this display.</p>
    <label>Expansion frame <select aria-label="Expansion frame" value={index} onChange={event => setIndex(Number(event.target.value))}>
      {value.frames.map(row => <option key={row.expansionIdentity} value={row.ordinal}>{row.ordinal}: {row.name}</option>)}
    </select></label>
    <p>Innermost to outermost; {value.frames.length} actual retained frames. Whole ordered region only.</p>
    <h4>{frame.name}</h4>
    <p>Expansion identity: <code>{frame.expansionIdentity}</code></p>
    <Location name="Call site" value={frame.callSite} />
    <Location name="Definition site" value={frame.definitionSite} />
    <Location name="Expansion origin" value={frame.expansion} />
    <details><summary>Exact selected variant and baseline</summary>
      <p>Report SHA-256: <code>{value.reportSha256}</code></p>
      <p>Source-byte SHA-256: <code>{value.sourceSha256}</code></p>
      <p>Canonical V17 identity: <code>{value.canonicalSha256}</code></p>
      <p>Canonical bytes: {value.canonicalBytes}; byte SHA-256: <code>{value.canonicalBytesSha256}</code>.</p>
      <p>Independent original baseline record: <code>{value.baselineSha256}</code>.</p>
      <p>Expansion chain: <code>{value.expansionChainSha256}</code>.</p>
      <p>Target {value.target}, wave width {value.waveWidth}; roster coordinate {value.coordinate.join(':')}.</p>
      <dl>{Object.entries(value.sourceIds).map(([name, id]) => <div key={name}><dt>{name}</dt><dd><code>{id}</code></dd></div>)}</dl>
    </details>
    <p>Final artifact association, physical register values and allocation lifetimes: unavailable. These macro frames are not an LLVM inline stack or individual instruction stops.</p>
  </>;
}
/** Caller supplies a separately selected exact identity; no route, fetch, compiler,
 * source mutation, debugger session or browser-owned admission is created. */
export function OrderedMacroFrames({ input }: { input: MacroFramesInput | null }) {
  const [complete, setComplete] = useState<{ input: MacroFramesInput | null; value: MacroFramesProjection } | null>(null);
  useEffect(() => {
    let current = true;
    void projectOrderedMacroFrames(input).then(value => { if (current) setComplete({ input, value }); });
    return () => { current = false; };
  }, [input]);
  const value = complete !== null && complete.input === input ? complete.value : null;
  return <section aria-label="Ordered-program macro origins">
    <h3>Compiler macro expansion origins</h3>
    <p>Read-only whole-region source observations. Changing this selection never edits, compiles or executes a kernel.</p>
    {value === null ? <p role="status">Checking selected capture; no previous frames are shown.</p>
      : value.status === 'ready' ? <Ready key={value.captureKey} value={value} />
        : <p role="status" data-state={value.status}>{value.detail}</p>}
  </section>;
}
