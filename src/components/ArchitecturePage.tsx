import { ExternalLink, ShieldCheck } from "lucide-react";
import {
  currentSourceUrl,
  currentState,
} from "../content/current-state";
import { FE2O3_PIN } from "../content/model";
import { LessonDiagram } from "../diagrams/LessonDiagram";

export function ArchitecturePage() {
  return (
    <article className="reference-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / architecture</p>
        <h1>Evidence pipeline and authority boundaries</h1>
        <p>
          The published compiler baseline and immutable historical lesson evidence
          are shown separately. Neither status is inferred from the other.
        </p>
      </header>

      <LessonDiagram kind="evidence" />

      <section>
        <p className="section-kicker">Authority rule</p>
        <h2>No single layer declares a launch safe</h2>
        <div className="architecture-rows">
          {[
            ["rustc", "Enforces Rust moves, borrows, lifetimes, visibility, local typestate, and Result control flow."],
            ["Fe2O3 capabilities", "Extend affine ownership to invocation partitions, subgroup participation, LDS epochs, matrix contexts, and launch-scoped resources."],
            ["Kernel IR", "Records types, regions, effects, synchronization, and unsupported obligations."],
            ["Historical V7 simulator", "Retains bounded observation tooling for an already verified KIR subset; it is not a current source compiler, GPU execution, or proof."],
            ["Compiler analyses", "Run the fixed eight ordered tensor, bounds, atomic, race, hierarchy-ownership, barrier, workgroup-memory, and semantic checks. Only the admitted static bounded-access fragment has Complete independent raw replay; nonempty tensor flow and every other current stage witness remain Incomplete."],
            ["Checked ranked transform", "Folds exact preceding index constants with checked u64 semantics before every downstream consumer. A separate exact typed structural replay admits only the same-site result; every other transformation is unsupported."],
            ["Verus", "After compiler-owned semantic and strict parallel derivation, one generated checker independently replays each supported exact pointwise integer or compiler-side IEEE operator-DAG formula. Status-Checked policy staging grants no authority. PLIRON separately proves structural coverage, separation, and ordered-product identity; the private move-only join is the admission authority and requires both structural and formula results."],
            ["LLVM / LLD", "Produces measured AMDGPU output through the direct-link worker."],
            ["HSACO inspection", "Binds target, symbols, descriptors, ABI, resources, and machine effects."],
            ["Runtime", "Checks actual context, allocations, aliases, geometry, and lifetimes."],
            ["Protected evidence", "Validates signed results and independent review before promotion."],
          ].map(([name, detail], index) => (
            <div className="architecture-row" key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{name}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="section-kicker">Published implementation baseline</p>
        <h2>Compiler baseline at {currentState.compilerShortCommit}</h2>
        <div className="pin-details">
          <div><span>Commit</span><code>{currentState.compilerCommit}</code></div>
          <div><span>Tree</span><code>{currentState.compilerTree}</code></div>
          <div><span>Pliron</span><code>{currentState.plironCommit}</code></div>
          <div><span>Reviewed</span><code>{currentState.reviewedOn}</code></div>
        </div>
        <div className="architecture-rows">
          {currentState.capabilities.map((capability, index) => (
            <div className="architecture-row" key={capability.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{capability.label}</strong>
              <p>
                <span className={`capability-state capability-state-${capability.status}`}>
                  {capability.status}
                </span>
                {capability.detail}
                {" "}
                <a
                  className="inline-source-link"
                  href={currentSourceUrl(capability.sourcePaths[0])}
                  target="_blank"
                  rel="noreferrer"
                >
                  source <ExternalLink size={12} aria-hidden="true" />
                </a>
              </p>
            </div>
          ))}
        </div>
        <div className="tracked-issues" aria-label="Tracked compiler issues">
          {currentState.issues.map((issue) => (
            <a
              href={`https://github.com/harsh-nod/fe2o3/issues/${issue.number}`}
              key={issue.number}
              target="_blank"
              rel="noreferrer"
            >
              <span>#{issue.number}</span>
              <strong>{issue.label}</strong>
              <small className={`issue-state issue-state-${issue.state}`}>
                {issue.state}
              </small>
            </a>
          ))}
        </div>
        <p className="status-boundary">
          One production route carries supported Rust MIR into ranked PLIRON,
          runs the sealed checked index constant fold, verifies the fixed eight
          workload-neutral stages, and only then constructs KIR lowering input.
          Analysis-only stages are protected by a monotonic mutation-attempt
          epoch, exact structural checkpoints, and sealed report custody. Those
          mechanisms detect compiler mutation and report substitution; they do
          not prove report semantics. Independent raw replay is Complete only
          for the documented static bounded-access fragment. Nonempty tensor
          flow remains Incomplete until external roots are tied to operational
          SSA values. Checked tiled and row-striped recipes now carry a
          structural index, checked-success capability, and physical extent;
          typed live validation checks pairing, shape, substitution, and use
          discipline. That carrier does not establish source-semantic custody,
          so raw, textual, and public recipes still fail closed at
          FE2O3-RACE-002. Explicit affine or Presburger maps may separately prove
          supported relations. The progress checker
          accepts canonical single-entry multi-block forwarding loops with a
          positive constant step only when source-width and u64 updates cannot
          wrap. The constant-fold validator keeps one exact typed input clone,
          replays the structural relation, and moves the validated output through
          its private receipt. Canonical hashes remain diagnostic labels rather
          than acceptance authority. These specific guarantees do not
          establish compiler extraction, source-to-KIR refinement, numerical
          intent, LLVM or ISA correctness, artifact identity, launch admission,
          persistent execution, performance, or universal kernel correctness.
        </p>
        <a
          className="source-button"
          href={`https://github.com/harsh-nod/fe2o3/tree/${currentState.compilerCommit}`}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open pinned compiler source <ExternalLink size={14} />
        </a>
      </section>

      <section>
        <p className="section-kicker">Historical lesson evidence</p>
        <h2>Immutable audit coordinates</h2>
        <p>
          Lessons keep their reproduced commit until their commands, source,
          and claims are audited again. This pin is evidence history, not the
          published compiler capability baseline above.
        </p>
        <div className="pin-details">
          <div><span>Commit</span><code>{FE2O3_PIN.commit}</code></div>
          <div><span>Tree</span><code>{FE2O3_PIN.tree}</code></div>
          <div><span>Rust</span><code>{FE2O3_PIN.rustToolchain}</code></div>
          <div><span>Primary target</span><code>{FE2O3_PIN.target}</code></div>
        </div>
        <a
          className="source-button"
          href={`${FE2O3_PIN.repository}/tree/${FE2O3_PIN.commit}`}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open historical lesson source <ExternalLink size={14} />
        </a>
      </section>
    </article>
  );
}
