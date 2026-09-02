import {
  ArrowRight,
  ExternalLink,
  GitCompareArrows,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { currentSourceUrl } from "../content/current-state";
import { advancedRustEvidence, isObservedAdvancedEvidence } from "../content/gfx950-advanced-evidence";
import { semanticEquivalencePage } from "../content/semantic-equivalence";
import { operatorCookbookEntry } from "../content/operator-cookbook";
import { HighlightedCode } from "./HighlightedCode";
import { EvidenceBadge } from "./EvidenceBadge";

export function SemanticEquivalencePage() {
  const example = semanticEquivalencePage.workedExample;
  const operator = operatorCookbookEntry(example.operatorId);
  const evidenceRows = [
    { label: "Decode", record: advancedRustEvidence.gfx950_kda_decode },
    {
      label: "Chunkwise prefill",
      record: advancedRustEvidence.gfx950_kda_chunkwise_prefill,
    },
  ];

  return (
    <article className="reference-page semantic-equivalence-page">
      <header className="reference-header semantic-equivalence-header">
        <p className="lesson-breadcrumb">Reference / semantic equivalence</p>
        <h1>CPU reference to GPU kernel equivalence</h1>
        <p>
          fe2o3 treats a safe Rust CPU reference as the semantic authority, then
          admits only the GPU effects that can be matched, checked, and proved
          against that reference under a declared operator contract.
        </p>
      </header>

      <section>
        <p className="section-kicker">Current status</p>
        <h2>What is real today, and what the compiler must still promote</h2>
        <div className="semantic-status-grid">
          <article>
            <strong>Today</strong>
            <p>{semanticEquivalencePage.status.today}</p>
          </article>
          <article>
            <strong>Target</strong>
            <p>{semanticEquivalencePage.status.target}</p>
          </article>
          <article>
            <strong>Boundary</strong>
            <p>{semanticEquivalencePage.status.boundary}</p>
          </article>
        </div>
      </section>

      <section>
        <p className="section-kicker">Compiler pipeline</p>
        <h2>The proof is over effects, domains, guards, and values</h2>
        <div className="semantic-pipeline">
          {semanticEquivalencePage.stages.map((stage, index) => (
            <article key={stage.id}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stage.label}</strong>
              </header>
              <p>{stage.summary}</p>
              <dl>
                <dt>Current implementation</dt>
                <dd>{stage.currentImplementation}</dd>
                <dt>Compile-time failure</dt>
                <dd>{stage.compileTimeFailure}</dd>
              </dl>
              <div className="semantic-source-links">
                {stage.sourcePaths.map((path) => (
                  <a
                    href={currentSourceUrl(path)}
                    key={path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {path} <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="section-kicker">Worked advanced tutorial</p>
        <h2>{example.title}</h2>
        <div className="semantic-example-layout">
          <div className="semantic-example-main">
            <p>{example.summary}</p>
            <p>{example.whyThisFirst}</p>
            <div className="semantic-example-actions">
              <Link to={`/lesson/${example.lessonId}`}>
                Open tutorial <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link to={`/operators#${example.operatorId}`}>
                Open operator contract <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <aside className="semantic-example-facts" aria-label="KDA evidence facts">
            <strong>{operator.title}</strong>
            <EvidenceBadge kind={operator.status} />
            <span>{operator.implementedShape}</span>
            <code>{operator.runner}</code>
            {evidenceRows.map(({ label, record }) =>
              isObservedAdvancedEvidence(record) ? (
                <span className="semantic-evidence-result" key={record.symbol}>
                  <b>{label}</b>
                  {record.numericalResult}
                  <small>{record.tolerance}</small>
                </span>
              ) : null,
            )}
          </aside>
        </div>
        <ul className="semantic-shape-list" aria-label="KDA fixed shape">
          {example.shape.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="section-kicker">Reference and kernel</p>
        <h2>The CPU spec and GPU implementation are not matched by text</h2>
        <div className="semantic-code-grid">
          {example.snippets.map((snippet) => (
            <article key={snippet.label}>
              <header>
                <strong>{snippet.label}</strong>
                <a
                  href={currentSourceUrl(snippet.sourcePath)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source <ExternalLink size={12} aria-hidden="true" />
                </a>
              </header>
              <pre>
                <HighlightedCode code={snippet.code} language={snippet.language} />
              </pre>
            </article>
          ))}
        </div>
        <p className="status-boundary">
          The CPU reference is translated into observable logical effects. The
          GPU kernel is translated independently into lane-indexed effects.
          Equivalence is established only when the compiler can prove the same
          output coordinates, same guards, same input-derived value formulas,
          clean ownership coverage, and no extra observable writes.
        </p>
      </section>

      <section>
        <p className="section-kicker">Invariants</p>
        <h2>What the KDA promotion must prove</h2>
        <div className="table-scroll">
          <table
            className="semantic-invariant-table"
            aria-label="KDA promotion invariants"
          >
            <thead>
              <tr>
                <th>Invariant</th>
                <th>Obligation</th>
                <th>KDA application</th>
                <th>Rejected mutation</th>
              </tr>
            </thead>
            <tbody>
              {example.invariants.map((invariant) => (
                <tr key={invariant.id}>
                  <th>{invariant.label}</th>
                  <td>{invariant.obligation}</td>
                  <td>{invariant.application}</td>
                  <td>{invariant.failureMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p className="section-kicker">Implementation work</p>
        <h2>How this becomes compile-time authority</h2>
        <div className="contributor-checklist semantic-promotion-list">
          {example.promotionSteps.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>
                  <ListChecks size={13} aria-hidden="true" />
                  Promotion gate
                </strong>
                <p>{step}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="section-kicker">Non-claims</p>
        <h2>Unsupported semantics still fail closed</h2>
        <ul className="semantic-nonclaims">
          {example.nonClaims.map((claim) => (
            <li key={claim}>{claim}</li>
          ))}
        </ul>
        <a
          className="source-button"
          href="https://github.com/harsh-nod/fe2o3"
          target="_blank"
          rel="noreferrer"
        >
          <ShieldCheck size={17} /> Open fe2o3 source <ExternalLink size={14} />
        </a>
        <Link className="source-button semantic-secondary-button" to="/architecture">
          <GitCompareArrows size={17} /> See authority boundaries
        </Link>
      </section>
    </article>
  );
}
