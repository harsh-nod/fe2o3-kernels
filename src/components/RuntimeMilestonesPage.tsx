import { CheckCircle2, ExternalLink, TerminalSquare } from "lucide-react";
import { runtimeMilestones } from "../content/runtime-milestones";
import { sourceUrl } from "../content/model";

export function RuntimeMilestonesPage() {
  return (
    <article className="reference-page runtime-milestones-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / runtime milestones</p>
        <h1>From one packet to a production runtime</h1>
        <p>
          Each completed milestone records the exact implementation, why the
          boundary matters, what it unlocks, and a hardware-safe command you can
          run yourself. GPU observations appear only after an independently
          retained target-specific run. This browser page documents and copies
          commands; it does not execute Rust, KFD, or GPU work.
        </p>
      </header>

      <div className="runtime-milestone-list">
        {runtimeMilestones.map((milestone) => (
          <section className="runtime-milestone" key={milestone.id}>
            <div className="runtime-milestone-heading">
              <span className="runtime-milestone-number">{milestone.number}</span>
              <div>
                <p className="section-kicker">Completed runtime milestone</p>
                <h2>{milestone.title}</h2>
                <p>{milestone.summary}</p>
              </div>
              <span className="runtime-status-badge">
                <CheckCircle2 size={14} aria-hidden="true" /> Implementation checked
              </span>
            </div>

            <div className="runtime-milestone-columns">
              <div>
                <h3>Why this matters</h3>
                <ul>
                  {milestone.why.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3>What it enables</h3>
                <ul>
                  {milestone.enables.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="runtime-try-it">
              <div className="runtime-try-it-heading">
                <TerminalSquare size={18} aria-hidden="true" />
                <div>
                  <p className="section-kicker">Run locally (CPU-safe)</p>
                  <h3>Exercise the ownership pipeline from a fe2o3 checkout</h3>
                </div>
              </div>
              <pre><code>{milestone.commands.join("\n")}</code></pre>
              <ul className="runtime-expected-list">
                {milestone.expected.map((item) => (
                  <li key={item}><CheckCircle2 size={15} aria-hidden="true" /> {item}</li>
                ))}
              </ul>
            </div>

            <div className="runtime-evidence-boundary">
              <div>
                <p className="section-kicker">Evidence boundary</p>
                <h3>What this does not claim</h3>
                <ul>
                  {milestone.limitations.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="runtime-source-links">
                <span>Commit</span>
                <code>{milestone.commit}</code>
                <span>Tree</span>
                <code>{milestone.tree}</code>
                {milestone.sourcePaths.map((path) => (
                  <a
                    href={sourceUrl(path, milestone.commit)}
                    key={path}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {path.split("/").at(-1)} <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="runtime-next-boundary">
        <p className="section-kicker">Next boundary</p>
        <h2>Current V2 hardware requalification</h2>
        <p>
          The next section will be added only after one reviewed MI300X run
          binds the refactored V2 manifests to PM4 completion, kernel output,
          and exact canary verification. This diagnostic remains
          process-terminal and retains its resources; it does not establish
          in-process teardown. Until then it is a planned gate, not a
          GPU-observed milestone.
        </p>
        <div className="runtime-next-row">
          <span>01</span>
          <div>
            <strong>Requalify PM4 + dispatch</strong>
            <p>One reviewed gfx942 run, exact output and canaries, process-terminal retention.</p>
          </div>
        </div>
        <div className="runtime-next-row">
          <span>02</span>
          <div>
            <strong>Publish synchronous launch</strong>
            <p>Generated artifact authority, caller inputs, exact completion, release, FIFO retirement, destroy, and resource release.</p>
          </div>
        </div>
      </section>
    </article>
  );
}
