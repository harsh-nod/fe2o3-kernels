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
          Current compiler capability and immutable historical lesson evidence
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
            ["Compiler analyses", "Run the seven ordered tensor, bounds, atomic, race, barrier, workgroup-memory, and semantic checks; an ephemeral manager shares sparse, layout, and trace facts only within one validation."],
            ["Verus", "Proves named source or model properties; it neither replaces rustc nor currently proves full source-to-machine refinement."],
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
        <p className="section-kicker">Current implementation</p>
        <h2>Compiler main at {currentState.compilerShortCommit}</h2>
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
          The generic safety sequence is active and mandatory before lowering.
          Fe2O3 does not contain a second Rust borrow checker: rustc owns local
          language semantics, while sealed types and compiler passes cover GPU
          facts that Rust alone cannot observe. Current Partial capabilities still grant no generalized
          source-to-machine refinement, protected launch authority, complete
          persistent execution, universal functional or numerical correctness,
          or automatic parity promotion.
        </p>
        <a
          className="source-button"
          href={`https://github.com/harsh-nod/fe2o3/tree/${currentState.compilerCommit}`}
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open current compiler source <ExternalLink size={14} />
        </a>
      </section>

      <section>
        <p className="section-kicker">Historical lesson evidence</p>
        <h2>Immutable audit coordinates</h2>
        <p>
          Lessons keep their reproduced commit until their commands, source,
          and claims are audited again. This pin is evidence history, not the
          current compiler capability snapshot above.
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
