import { ExternalLink, Terminal } from "lucide-react";
import { FE2O3_PIN, sourceUrl, type Claim } from "../content/model";
import { EvidenceBadge } from "./EvidenceBadge";

export function ClaimList({ claims }: { claims: Claim[] }) {
  return (
    <section className="claim-list" aria-labelledby="evidence-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Maturity</p>
          <h2 id="evidence-heading">Evidence for this lesson</h2>
        </div>
        <code>{FE2O3_PIN.shortCommit}</code>
      </div>
      <div className="claim-rows">
        {claims.map((claim) => (
          <article className="claim-row" key={`${claim.kind}-${claim.label}`}>
            <div className="claim-summary">
              <EvidenceBadge kind={claim.kind} />
              <h3>{claim.label}</h3>
              <p>{claim.detail}</p>
            </div>
            {claim.reference ? (
              <div className="claim-evidence">
                <div className="claim-command">
                  <Terminal size={15} aria-hidden="true" />
                  <code>{claim.reference.commands[0]}</code>
                </div>
                <div className="claim-sources">
                  {claim.reference.sourcePaths.slice(0, 3).map((path) => (
                    <a
                      href={sourceUrl(path)}
                      key={path}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {path}
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ))}
                  {claim.reference.sourcePaths.length > 3 && (
                    <span>+{claim.reference.sourcePaths.length - 3} sources</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="claim-no-evidence">
                No execution or proof evidence is claimed.
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
