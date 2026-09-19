import type { OrderedProgramObservationInput } from "../content/ordered-program-observation.mjs";
import { ORDERED_PROGRAM_RETAINED_INPUT } from "../content/ordered-program-retained-input";
import { OrderedProgramObservation } from "./OrderedProgramObservation";
import "./RecordedProgramTutorial.css";

const compilerCommit = "f5e81f985ff3e2771ad0f132d483f5cf74976ad6";
const compilerSource = "https://github.com/harsh-nod/fe2o3/blob/" + compilerCommit;
const tutorialDocs = "https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs";
const computeExcerpt = [
  "let region_value = amdgpu_ordered_program! {",
  "    gfx942_xnack_off_wave64;",
  "    scratch(32); out(33); in(34) = a; in(35) = b; in(36) = c;",
  "    xor(scratch, input0, input1);",
  "    and(scratch, scratch, input2);",
  "    xor(out, input1, scratch);",
  "};",
].join("\n");

interface RecordedProgramTutorialProps {
  input?: OrderedProgramObservationInput | null;
}

export function RecordedProgramTutorial({
  input = ORDERED_PROGRAM_RETAINED_INPUT,
}: RecordedProgramTutorialProps) {
  return (
    <section className="recorded-program-tutorial" aria-label="Guided instruction-program tutorial">
      <header>
        <h3>Write a bounded program; inspect recorded CPU values</h3>
        <p>
          This reference exercise uses an existing retained CPU debugger capture.
          It does not edit or compile source, connect to a debugger, or execute a GPU.
          The separate compiler pin below does not change the curriculum baseline or maturity labels.
        </p>
      </header>

      <div className="recorded-program-tutorial-columns">
        <section aria-label="Bounded source authoring">
          <h4>Read the three-instruction source</h4>
          <p>
            This compute excerpt is from the reviewed three-step branch, not a complete kernel.
            Keep the complete fixture&apos;s imports, scalar prefix, launch contract and checked output write.
            The surrounding Rust supplies <code>a</code>, <code>b</code> and <code>c</code>.
          </p>
          <pre aria-label="Three-instruction source excerpt"><code>{computeExcerpt}</code></pre>
          <p>
            The expression is <code>b ^ ((a ^ b) &amp; c)</code>. Bits set in <code>c</code> select
            from <code>a</code>; other bits select from <code>b</code>.
            Inputs are read-only. Scratch and output must be defined before they are read.
          </p>
          <p>
            This profile admits one unconditional, acyclic program in a direct kernel root: 1–16 move, add, sub,
            AND, OR or XOR instructions on u32 values; add/sub wrap. It uses five distinct
            literal VGPR bindings in v0..v63.
            It requires gfx942:xnack-, Wave64 and a required/maximum workgroup of 64×1×1.
            The host marker itself panics; it is not a host implementation.
          </p>
          <ul aria-label="Pinned authoring references">
            <li><a href={compilerSource + "/crates/rustc-codegen-fe2o3/tests/fixtures/production-extraction-device/src/ordered_program_v32.rs"}>Complete source fixture at the qualified compiler pin</a></li>
            <li><a href={compilerSource + "/docs/ordered-program-authoring-v1.md"}>Bounded instruction-program compiler contract</a></li>
            <li><a href={tutorialDocs + "/ordered-program-authoring-v1.md"}>Source export, independent CPU checks and refusal exercises</a></li>
          </ul>
          <p>Compiler pin: <code>{compilerCommit}</code>. No new compilation is performed by this page.</p>
        </section>

        <section aria-label="Guided recorded-program exercises">
          <h4>Predict, then inspect the retained observations</h4>
          <ol>
            <li>
              Choose <strong>three / used</strong> and <strong>Case 6</strong> below.
              Before the program, read inputs 19, 23 and 42. The result is not in scope;
              that is not the number zero.
            </li>
            <li>
              Choose <strong>After whole program</strong>. Compare the logical result with your arithmetic.
              Inputs not queried at this checkpoint stay unqueried. The three declared instruction
              rows are not three debugger stops.
            </li>
            <li>
              Choose <strong>Reverse-restored before</strong>, then <strong>Repeated after</strong>.
              Compare event and revision: an event can repeat with a new revision.
              You are browsing retained checkpoints, not issuing reverse-execution commands.
            </li>
            <li>
              Compare <strong>three / unused</strong> and <strong>sixteen / unused</strong>,
              selecting Case 6 again after each variant change. An unused result is still a
              logical result; the sixteen instruction rows still cross one whole-program CPU operation.
            </li>
          </ol>
          <details>
            <summary>Expected arithmetic answers</summary>
            <p>
              These independent expectations are not calculated from the displayed capture.
              The output-store columns are source expectations, not memory queried by this viewer.
            </p>
            <div className="recorded-program-tutorial-table">
              <table aria-label="Independent arithmetic expectations">
                <caption>For source inputs (19, 23, 42); not a memory-observation table</caption>
                <thead><tr><th scope="col">Program</th><th scope="col">Logical result</th><th scope="col">Used store</th><th scope="col">Unused store</th></tr></thead>
                <tbody>
                  <tr><th scope="row">One instruction</th><td>19</td><td>19</td><td>19</td></tr>
                  <tr><th scope="row">Three instructions</th><td>23</td><td>23</td><td>19</td></tr>
                  <tr><th scope="row">Sixteen instructions</th><td>12</td><td>12</td><td>19</td></tr>
                </tbody>
              </table>
            </div>
          </details>
          <p>
            Changing a variant or request resets the checkpoint. This view retains lane 0 only.
            Output-memory and canary checks belong to the separate source/debugger qualification,
            not additional observations rendered here.
          </p>
        </section>
      </div>

      <OrderedProgramObservation input={input} />

      <section className="recorded-program-tutorial-boundary" aria-label="CPU and native evidence boundaries">
        <h4>Keep source, logical values and native evidence separate</h4>
        <p>
          Rust lowers through semantic MIR32 and canonical KIR17; LLVM IR is not bypassed.
          One side-effecting inline-assembly unit carries the authored sequence.
          The surrounding Rust still lowers normally. Declared VGPR numbers are bindings,
          not captured physical contents or a whole-kernel register-usage measurement.
          The program is NoMemory and reads implicit EXEC; its internal order is not a memory fence.
        </p>
        <p>
          Native instruction decoding is a separate qualification. This viewer does not show final
          machine bytes, physical registers, intermediate scratch values, instruction microsteps,
          register lifetimes, occupancy or GPU timing. CPU results do not prove native encodings,
          GPU execution, a protected artifact or compilation-resume authority.
        </p>
        <p>
          Authored memory, barriers, branches, matrix instructions, gfx950 and general whole-kernel
          assembly are outside this closed profile. To experiment, edit a separate complete Rust
          source copy and export it again using the linked walkthrough. Old SSA IDs and cursors
          are not reusable source-edit or compilation handles.
        </p>
        <ul>
          <li><a href={tutorialDocs + "/ordered-program-debugger-v1.md"}>Debugger workflow, retained byte pins and exact limitations</a></li>
          <li><a href={tutorialDocs + "/ordinary-authoring-navigation-v1.md"}>Separate ordinary Rust/KIR navigation example</a> — source attribution is not source ownership.</li>
          <li><a href="#/lesson/cpu-semantic-simulation">CPU semantic simulation resource examples</a> — independently retained global/LDS captures, not memory from this program.</li>
        </ul>
        <p>
          Capture validation and synthetic controls remain separate. Missing or invalid input never
          falls back to invented execution data. This exercise does not complete the broader
          authoring, debugger or curriculum milestones.
        </p>
      </section>
    </section>
  );
}
