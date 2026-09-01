import {
  ArrowRight,
  ExternalLink,
  FileCode2,
  Play,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  operatorCategories,
  operatorCookbook,
  type OperatorCookbookEntry,
} from "../content/operator-cookbook";
import { EvidenceBadge } from "./EvidenceBadge";

function groupedOperators(): Array<[
  OperatorCookbookEntry["category"],
  OperatorCookbookEntry[],
]> {
  return (Object.keys(operatorCategories) as OperatorCookbookEntry["category"][])
    .map((category) => [
      category,
      operatorCookbook.filter((entry) => entry.category === category),
    ]);
}

export function OperatorCookbookPage() {
  return (
    <article className="reference-page operator-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / operators</p>
        <h1>Operator cookbook</h1>
        <p>
          A launch index for the kernels and model slices in this guide. Each
          entry names the compute contract, current implementation shape,
          source and reference paths, exact runner, expected result, and
          non-claims.
        </p>
      </header>

      <section>
        <p className="section-kicker">Index</p>
        <h2>Find an implemented slice</h2>
        <div className="operator-index">
          {operatorCookbook.map((entry) => (
            <a href={`#${entry.id}`} key={entry.id}>
              <span>{entry.title}</span>
              <EvidenceBadge kind={entry.status} />
            </a>
          ))}
        </div>
      </section>

      {groupedOperators().map(([category, entries]) => (
        <section key={category}>
          <p className="section-kicker">{operatorCategories[category]}</p>
          <h2>{operatorCategories[category]}</h2>
          <div className="operator-list">
            {entries.map((entry) => (
              <article className="operator-row" id={entry.id} key={entry.id}>
                <header>
                  <div>
                    <h3>{entry.title}</h3>
                    <EvidenceBadge kind={entry.status} />
                  </div>
                  <Link to={`/lesson/${entry.lessonId}`}>
                    Open lesson <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </header>

                <div className="operator-facts">
                  <div>
                    <strong><FileCode2 size={14} aria-hidden="true" /> Computes</strong>
                    <p>{entry.computes}</p>
                  </div>
                  <div>
                    <strong><ShieldAlert size={14} aria-hidden="true" /> Implemented shape</strong>
                    <p>{entry.implementedShape}</p>
                  </div>
                  <div>
                    <strong><Play size={14} aria-hidden="true" /> Runner</strong>
                    <code>{entry.runner}</code>
                    <p>{entry.expected}</p>
                  </div>
                </div>

                <div className="operator-paths">
                  <div>
                    <strong>Source paths</strong>
                    {entry.sourcePaths.map((path) => (
                      <code key={path}>{path}</code>
                    ))}
                  </div>
                  <div>
                    <strong>Reference paths</strong>
                    {entry.referencePaths.map((path) => (
                      <code key={path}>{path}</code>
                    ))}
                  </div>
                </div>

                <details className="operator-nonclaims">
                  <summary>Non-claims</summary>
                  <ul>
                    {entry.nonClaims.map((claim) => (
                      <li key={claim}>{claim}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section>
        <p className="section-kicker">Source</p>
        <h2>Authoritative code remains in fe2o3</h2>
        <p>
          The cookbook is a navigation layer over pinned lesson evidence. Source
          links and commands point back to the exact fe2o3 paths named by each
          lesson.
        </p>
        <a
          className="source-button"
          href="https://github.com/harsh-nod/fe2o3"
          target="_blank"
          rel="noreferrer"
        >
          Open fe2o3 source <ExternalLink size={14} aria-hidden="true" />
        </a>
      </section>
    </article>
  );
}
