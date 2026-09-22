import { useEffect, useState } from "react";
import { HighlightedCode } from "./HighlightedCode";
import { projectFinalNativeComparison, type FinalNativeProjection } from "../content/final-native-comparison.mjs";
import "./FinalNativeComparison.css";

export interface FinalNativeComparisonProps {
  evidence: unknown;
  /** Caller-selected display-integrity pin; never a trusted compiler identity. */
  expectedJoinSha256: string;
}
type Ready = Extract<FinalNativeProjection, { status: "ready" }>;

function NativeReady({ projection }: { projection: Ready }) {
  const [selected, setSelected] = useState(0);
  const current = projection.cases[selected];
  return <>
    <p className="final-native-boundary">
      {projection.kind === "synthetic_test_only" ? "Synthetic test data. " : "Retained source and compiled code-object observations. "}
      Hashes check retained-byte consistency, not trusted compiler provenance. No GPU execution is performed or established.
    </p>
    <p>Capture: <code>{projection.captureName}</code>. Checked here: {projection.checkedArtifacts} retained artifacts,
      including all four complete HSACO payloads. Source exports and CPU simulations are reported by the retained strict join;
      this view does not rerun those checks.</p>
    <p>Default uses XOR / AND / XOR. The edited final instruction is OR, changing the result from bitselect to
      <code> b | (a &amp; mask)</code>. This is an intentional semantic change, not an equivalence claim.</p>
    <div className="final-native-scroll"><table aria-label="Declared and encoded native resources">
      <thead><tr><th scope="col">Retained case</th><th scope="col">Declared VGPR high-water</th>
        <th scope="col">Encoded VGPR capacity</th><th scope="col">Architected boundary</th>
        <th scope="col">Complete HSACO bytes</th></tr></thead>
      <tbody>{projection.cases.map((item, index) => <tr key={item.id}>
        <th scope="row"><button type="button" aria-pressed={selected === index}
          aria-label={"Inspect " + item.profile + " " + item.optimization} onClick={() => setSelected(index)}>
          {item.profile} {item.optimization}</button></th>
        <td>{item.declaredVgprHighWater}</td><td>{item.encodedVgprCapacity}</td>
        <td>{item.architectedVgprBoundary}</td><td>{item.hsacoBytes}</td>
      </tr>)}</tbody>
    </table></div>
    <p>Capacity is decoded from retained descriptor words; it is not measured register usage, occupancy, performance,
      runtime physical values, or a register-lifetime proof. Offsets below address the complete payload, not a section.</p>
    <section aria-label="Selected final-native case" key={current.id}>
      <h4>{current.profile} {current.optimization}: declared instruction → observed encoding</h4>
      <div className="final-native-scroll"><table aria-label="Exact native instruction bytes">
        <thead><tr><th scope="col">Declared instruction</th><th scope="col">Reported machine opcode</th>
          <th scope="col">Exact bytes</th><th scope="col">Register operands</th><th scope="col">Payload offset</th></tr></thead>
        <tbody>{current.program.map((instruction) => <tr key={instruction.fileOffset}>
          <th scope="row"><code>{instruction.declaredInstruction}</code></th>
          <td><code>{instruction.opcode}</code></td><td><code>{instruction.bytesHex}</code></td>
          <td><code>{instruction.registers.join(", ")}</code></td><td>{instruction.fileOffset}</td>
        </tr>)}</tbody>
      </table></div>
      <p>All three contiguous slices match their reported full-file offsets. Reported implicit reads: EXEC;
        no implicit writes. This is byte consistency against a retained observer report, not new disassembly.</p>
      <p>Descriptor: 64 bytes at payload offset {current.descriptorOffset}. Resource words:
        <code> compute_pgm_rsrc1=0x{current.resource1.toString(16)}</code>,
        <code> compute_pgm_rsrc3=0x{current.resource3.toString(16)}</code>.</p>
      <details><summary>Exact retained source for {current.profile}</summary>
        <pre aria-label={current.profile + " retained source"}><HighlightedCode code={current.source} language="rust" /></pre>
      </details>
      <details><summary>Exact retained LLVM input</summary><pre><code>{current.llvm}</code></pre></details>
      <details><summary>Exact identities and untrusted build claims</summary><dl>
        {([
          ["Source SHA-256", current.sourceSha256], ["Semantic MIR identity", current.semanticSha256],
          ["Canonical KIR identity", current.canonicalKirSha256], ["LLVM SHA-256", current.llvmSha256],
          ["Complete HSACO SHA-256", current.hsacoSha256], ["Descriptor SHA-256", current.descriptorSha256],
          ["LLVM build claim", current.llvmBuildClaim], ["Worker build claim", current.workerBuildClaim],
        ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><code>{value}</code></dd></div>)}
      </dl></details>
    </section>
    <details><summary>Comparison integrity and limitations</summary>
      <p>Selected join SHA-256: <code>{projection.joinSha256}</code>. Source receipt SHA-256:
        <code> {projection.sourceReceiptSha256}</code>.</p>
      <p>Repeated edited source identities were retained; no separate repeat native compilation is claimed.
        Dependency and runtime files named in the original join are not fetched or authenticated by this view.</p>
      <ul>{projection.unavailable.map((item) => <li key={item}>{item}: unavailable / not established.</li>)}</ul>
    </details>
    <p className="final-native-boundary">Read-only: no source edit, compiler invocation, native execution, load, launch, network request,
      or production-resume action. The CPU-only source comparison remains a separate evidence profile.</p>
  </>;
}

export function FinalNativeComparison({ evidence, expectedJoinSha256 }: FinalNativeComparisonProps) {
  const [completed, setCompleted] = useState<{
    evidence: unknown; expected: string; projection: FinalNativeProjection;
  } | null>(null);
  useEffect(() => {
    let current = true;
    void projectFinalNativeComparison(evidence, expectedJoinSha256).then((projection) => {
      if (current) setCompleted({ evidence, expected: expectedJoinSha256, projection });
    });
    return () => { current = false; };
  }, [evidence, expectedJoinSha256]);
  const projection = completed !== null && completed.evidence === evidence && completed.expected === expectedJoinSha256
    ? completed.projection : null;
  return <section className="final-native-comparison" aria-label="Source and final-native comparison">
    <h3>Source instruction edit → retained final-native bytes</h3>
    {projection === null ? <p role="status">Checking whole-payload integrity; no previous native case is shown.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No native comparison is shown.</p>
        : <NativeReady key={projection.joinSha256} projection={projection} />}
  </section>;
}
