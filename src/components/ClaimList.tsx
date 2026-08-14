import { ExternalLink, Terminal } from "lucide-react";
import { sourceUrl, type Claim } from "../content/model";
import { EvidenceBadge } from "./EvidenceBadge";

export function ClaimList({ claims }: { claims: Claim[] }) {
  return (
    <section className="claim-list" aria-labelledby="evidence-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Maturity</p>
          <h2 id="evidence-heading">Evidence for this lesson</h2>
        </div>
        <code>per-claim pins</code>
      </div>
      <div className="claim-rows">
        {claims.map((claim) => {
          const reference = claim.reference;
          return (
            <article className="claim-row" key={`${claim.kind}-${claim.label}`}>
              <div className="claim-summary">
                <EvidenceBadge kind={claim.kind} />
                <h3>{claim.label}</h3>
                <p>{claim.detail}</p>
              </div>
              {reference ? (
                <div className="claim-evidence">
                  <div className="claim-command">
                    <Terminal size={15} aria-hidden="true" />
                    <code>{reference.commands[0]}</code>
                  </div>
                  <div className="claim-sources">
                    {reference.sourcePaths.slice(0, 3).map((path) => (
                      <a
                        href={sourceUrl(path, reference.commit)}
                        key={path}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {path}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    ))}
                    {reference.sourcePaths.length > 3 && (
                      <span>+{reference.sourcePaths.length - 3} sources</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="claim-no-evidence">
                  No execution or proof evidence is claimed.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
