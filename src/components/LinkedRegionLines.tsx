import { useEffect, useState } from "react";
import { projectLinkedRegionLines, type LinkedLineProjection, type LinkedLineReady } from "../content/linked-region-lines.mjs";
import "./LinkedRegionLines.css";

export interface LinkedRegionLinesProps {
  evidence: unknown;
  /** Caller-selected retained display pin, not compiler provenance or authority. */
  expectedCapsuleSha256: string;
}
const hex = (value: number) => "0x" + value.toString(16);
function Ready({ value }: { value: LinkedLineReady }) {
  const [selection, setSelection] = useState(0);
  const current = value.cases[selection], region = current.region;
  const bytes = new TextEncoder().encode(value.source), decoder = new TextDecoder("utf-8", { fatal: true });
  const before = decoder.decode(bytes.subarray(0, value.span.byte_start));
  const selected = decoder.decode(bytes.subarray(value.span.byte_start, value.span.byte_end));
  const after = decoder.decode(bytes.subarray(value.span.byte_end));
  return <>
    <p className="linked-lines-boundary">Retained CPU compilation and linking only. Linked-image virtual addresses are
      not runtime GPU addresses. This is whole-region coverage, not per-instruction source attribution.</p>
    <p>Separate edited-source observation on <code>{value.target}</code>. All {value.checkedArtifacts} retained
      artifacts are hash-checked; ELF sections/symbols and DWARF line intervals are joined again in this browser.
      No relationship to the older fourteen-artifact comparison is inferred.</p>
    <div className="linked-lines-scroll"><table aria-label="Retained linked-line cases">
      <thead><tr><th scope="col">Optimization</th><th scope="col">Full ELF bytes</th>
        <th scope="col">Region linked VA, half-open</th><th scope="col">Region file offsets, half-open</th></tr></thead>
      <tbody>{value.cases.map((item, index) => <tr key={item.optimization}>
        <th scope="row"><button type="button" aria-pressed={selection === index}
          aria-label={"Inspect linked lines " + item.optimization} onClick={() => setSelection(index)}>{item.optimization}</button></th>
        <td>{item.payload.bytes}</td><td><code>[{hex(item.region.begin_va)}, {hex(item.region.end_va)})</code></td>
        <td><code>[{item.region.begin_file_offset}, {item.region.end_file_offset})</code></td>
      </tr>)}</tbody>
    </table></div>
    <section aria-label="Selected whole-region linked lines" key={current.optimization}>
      <h4>{current.optimization}: {region.symbol}, line {value.span.line}, column {value.span.column}</h4>
      <p>The independently located {region.instruction_count}-instruction region is {region.end_va - region.begin_va} bytes.
        A line-table row can cover surrounding instructions too; clipped coverage below does not narrow the original row.</p>
      <div className="linked-lines-scroll"><table aria-label="Whole-region line coverage">
        <thead><tr><th scope="col">Source location</th><th scope="col">Original row linked VA</th>
          <th scope="col">Intersection with region</th><th scope="col">Discriminator</th></tr></thead>
        <tbody>{current.coverage.map((row, index) => <tr key={index}>
          <th scope="row">{row.line}:{row.column}</th>
          <td><code>[{hex(row.row_begin_va)}, {hex(row.row_end_va)})</code></td>
          <td><code>[{hex(row.begin_va)}, {hex(row.end_va)})</code></td><td>{row.discriminator}</td>
        </tr>)}</tbody>
      </table></div>
      <details><summary>Exact retained source and selected whole region</summary>
        <p>Display path only, never fetched: <code>{value.span.display_path}</code>.</p>
        <pre aria-label="Retained linked-line source"><code>{before}<mark>{selected}</mark>{after}</code></pre>
      </details>
      <details><summary>Exact source and artifact identities</summary><dl>
        {([
          ["Source SHA-256", value.sourceSha256], ["Canonical KIR SHA-256", value.canonical.sha256],
          ["LLVM SHA-256", value.llvmSha256], ["Selected full ELF SHA-256", current.payload.sha256],
          ["Compiler file identity (not source hash)", value.span.file_identity],
          ["Selected capsule SHA-256", value.capsuleSha256],
          ...Object.entries(value.sourceIdentity),
          ["KIR coordinate", JSON.stringify(value.coordinate)],
        ] as [string, string][]).map(([name, content]) => <div key={name}><dt>{name}</dt><dd><code>{content}</code></dd></div>)}
      </dl></details>
    </section>
    <p className="linked-lines-boundary">Retained-byte consistency is not authenticated compiler provenance.
      Macro/inline stacks, physical allocator lifetimes and runtime values remain unavailable here.
      No source edit, build, debugger command, load, launch or resume is performed or authorized.</p>
  </>;
}

export function LinkedRegionLines({ evidence, expectedCapsuleSha256 }: LinkedRegionLinesProps) {
  const [completed, setCompleted] = useState<{
    input: unknown; selected: string; projection: LinkedLineProjection;
  } | null>(null);
  useEffect(() => {
    let current = true;
    void projectLinkedRegionLines(evidence, expectedCapsuleSha256).then(projection => {
      if (current) setCompleted({ input: evidence, selected: expectedCapsuleSha256, projection });
    });
    return () => { current = false; };
  }, [evidence, expectedCapsuleSha256]);
  const projection = completed !== null && completed.input === evidence && completed.selected === expectedCapsuleSha256 ? completed.projection : null;
  return <section className="linked-region-lines" aria-label="Retained whole-region linked lines">
    <h3>Source line → whole linked region</h3>
    {projection === null ? <p role="status">Checking selected linked-line evidence; previous rows are hidden.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail}</p>
        : <Ready key={projection.capsuleSha256} value={projection} />}
  </section>;
}
