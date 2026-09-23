import { useEffect, useState } from "react";
import { HighlightedCode } from "./HighlightedCode";
import { FinalNativeRegisterRoles } from "./FinalNativeRegisterRoles";
import { projectRepeatNativeComparison, type RepeatNativeProjection } from "../content/repeat-native-comparison.mjs";
import "./FinalNativeComparison.css";

export interface RepeatNativeComparisonProps {
  evidence: unknown;
  /** Independently selected content-integrity pin, not producer authentication. */
  expectedJoinSha256: string;
}
type Ready = Extract<RepeatNativeProjection, { status: "ready" }>;

function RepeatReady({ projection }: { projection: Ready }) {
  const [selected, setSelected] = useState(0);
  const current = projection.cases[selected];
  return <>
    <p className="final-native-boundary">
      {projection.kind === "synthetic_test_only" ? "Synthetic test data. " : "Retained source and native code-object observations. "}
      Content hashes are not producer authentication. No GPU execution is performed or established.
    </p>
    <p>Capture: <code>{projection.captureName}</code>. Checked here: {projection.checkedArtifacts} retained artifacts,
      including eight complete HSACO payloads. The receipts report {projection.sourceExportsReported} source exports and
      {" "}{projection.cpuSimulationsReported} CPU simulations; this viewer does not rerun or independently replay them.</p>
    <p>Each region initializes output from input0, then adds input1 exactly 1, 2, or 15 times.
      The result is <code>a + N × b</code> modulo 2³². The repeat case is a separate retained export and native
      observation of the 15-add source, not another runtime loop or an equivalence claim across different counts.</p>
    <div className="final-native-scroll"><table aria-label="Repeat-native cases and resources">
      <thead><tr><th scope="col">Retained case</th><th scope="col">Declared instructions</th>
        <th scope="col">Declared VGPR high-water</th><th scope="col">Encoded VGPR capacity</th>
        <th scope="col">Architected boundary</th><th scope="col">Complete HSACO bytes</th></tr></thead>
      <tbody>{projection.cases.map((item, index) => <tr key={item.id}>
        <th scope="row"><button type="button" aria-pressed={selected === index}
          aria-label={"Inspect " + item.label + " " + item.optimization}
          onClick={() => setSelected(index)}>{item.label} {item.optimization}</button></th>
        <td>{item.program.length}</td><td>{item.declaredVgprHighWater}</td>
        <td>{item.encodedVgprCapacity}</td><td>{item.architectedVgprBoundary}</td><td>{item.hsacoBytes}</td>
      </tr>)}</tbody>
    </table></div>
    <p>Capacity is decoded from retained descriptor words, not measured register usage, occupancy, performance,
      physical values, or a register-lifetime proof. All file offsets address complete payload bytes.</p>
    <section aria-label="Selected repeat-native case" key={current.id}>
      <h4>{current.label} {current.optimization}: {current.repetitions} adds, {current.program.length} declared instructions</h4>
      <div className="final-native-scroll"><table aria-label="Repeat-native exact instruction bytes">
        <thead><tr><th scope="col">Declared instruction</th><th scope="col">Reported machine opcode</th>
          <th scope="col">Exact bytes</th><th scope="col">Register operands</th><th scope="col">Payload offset</th></tr></thead>
        <tbody>{current.program.map(instruction => <tr key={instruction.fileOffset}>
          <th scope="row"><code>{instruction.declaredInstruction}</code></th>
          <td><code>{instruction.opcode}</code></td><td><code>{instruction.bytesHex}</code></td>
          <td><code>{instruction.registers.join(", ")}</code></td><td>{instruction.fileOffset}</td>
        </tr>)}</tbody>
      </table></div>
      <p>All {current.program.length} contiguous instruction slices match their reported full-file offsets.
        This is retained-byte consistency, not fresh disassembly or dynamic instruction stepping.</p>
      <p>The retained report lists {current.staticInstructions} static instructions in the whole entry.
        That larger entry is not fully redecoded here; the table covers only the declared region.</p>
      <FinalNativeRegisterRoles grid={current.registerGrid} />
      <p>Descriptor: 64 bytes at payload offset {current.descriptorOffset}. Resource words:
        <code> compute_pgm_rsrc1=0x{current.resource1.toString(16)}</code>,
        <code> compute_pgm_rsrc3=0x{current.resource3.toString(16)}</code>.</p>
      <details><summary>Exact retained source for {current.label}</summary>
        <pre aria-label={current.label + " repeat-native source"}><HighlightedCode code={current.source} language="rust" /></pre>
      </details>
      <details><summary>Exact retained LLVM input</summary><pre><code>{current.llvm}</code></pre></details>
      <details><summary>Distinct case identities and untrusted build claims</summary><dl>
        {([
          ["Source SHA-256", current.sourceSha256], ["Semantic MIR identity", current.semanticSha256],
          ["Canonical KIR identity", current.canonicalKirSha256], ["KIR file SHA-256", current.kirFileSha256],
          ["LLVM SHA-256", current.llvmSha256], ["Native report SHA-256", current.reportSha256],
          ["Retained payload path (not fetched)", current.payloadPath], ["Complete HSACO SHA-256", current.hsacoSha256],
          ["Descriptor SHA-256", current.descriptorSha256], ["LLVM build claim", current.llvmBuildClaim],
          ["Worker build claim", current.workerBuildClaim],
        ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><code>{value}</code></dd></div>)}
      </dl></details>
    </section>
    <details><summary>Repeat comparison integrity and limitations</summary>
      <p>Independently selected join SHA-256: <code>{projection.joinSha256}</code>.</p>
      <p>Source receipt SHA-256: <code>{projection.sourceReceiptSha256}</code>.
        LLVM receipt SHA-256: <code>{projection.llvmReceiptSha256}</code>.</p>
      <p>Fifteen and repeat retain distinct case identities, reports, and payload paths even when their byte
        hashes agree. Files merely named in the receipts are not fetched, authenticated, or replayed.</p>
      <ul>{projection.unavailable.map(item => <li key={item}>{item}: unavailable / not established.</li>)}</ul>
    </details>
    <p className="final-native-boundary">Read-only local display: no source edit, compiler invocation, native execution,
      load, launch, network request, protected proof, or production-resume action.</p>
  </>;
}

export function RepeatNativeComparison({ evidence, expectedJoinSha256 }: RepeatNativeComparisonProps) {
  const [completed, setCompleted] = useState<{
    evidence: unknown; expected: string; projection: RepeatNativeProjection;
  } | null>(null);
  useEffect(() => {
    let current = true;
    void projectRepeatNativeComparison(evidence, expectedJoinSha256).then(projection => {
      if (current) setCompleted({ evidence, expected: expectedJoinSha256, projection });
    }, () => {
      if (current) setCompleted({ evidence, expected: expectedJoinSha256,
        projection: { status: "unavailable", detail: "The local integrity check could not finish." } });
    });
    return () => { current = false; };
  }, [evidence, expectedJoinSha256]);
  const projection = completed !== null && completed.evidence === evidence && completed.expected === expectedJoinSha256
    ? completed.projection : null;
  return <section className="final-native-comparison" aria-label="Bounded repeat-native comparison">
    <h3>Declared repeat region → retained final-native bytes</h3>
    {projection === null ? <p role="status">Checking all 23 artifacts; no previous case is shown.</p>
      : projection.status !== "ready" ? <p role="status" data-state={projection.status}>{projection.detail} No repeat-native case is shown.</p>
        : <RepeatReady key={projection.joinSha256} projection={projection} />}
  </section>;
}
