import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  ServerCog,
  TerminalSquare,
} from "lucide-react";
import { runtimeMilestones } from "../content/runtime-milestones";
import { sourceUrl } from "../content/model";

function HardwareCommand({ command, requirement }: {
  command: string;
  requirement: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="runtime-hardware-command">
      <div className="runtime-hardware-heading">
        <ServerCog size={18} aria-hidden="true" />
        <div>
          <p className="section-kicker">Opt-in hardware example</p>
          <h3>MI300X required; the browser only copies this command</h3>
        </div>
      </div>
      <div className="runtime-command-row">
        <code>{command}</code>
        <button
          className="icon-button"
          type="button"
          onClick={() => void copy()}
          aria-label="Copy hardware command"
          title="Copy hardware command"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      <p>{requirement}</p>
    </div>
  );
}

export function RuntimeMilestonesPage() {
  return (
    <article className="reference-page runtime-milestones-page">
      <header className="reference-header">
        <p className="lesson-breadcrumb">Reference / runtime milestones</p>
        <h1>From one packet to a production runtime</h1>
        <p>
          Each completed milestone records the exact implementation, why the
          boundary matters, what it unlocks, and CPU-safe checks you can run
          yourself. Hardware commands are separated and labeled as copy-only.
          GPU observations appear only after an independently retained
          target-specific run. This browser page does not execute Rust, KFD, or
          GPU work.
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
              <div className="runtime-statuses" aria-label="Milestone status">
                <span className="runtime-status-badge">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {milestone.status === "evidence-reviewed"
                    ? "Evidence reviewed"
                    : "Implementation checked"}
                </span>
                <span
                  className={`runtime-status-badge ${
                    milestone.measurement === "unmeasured"
                      ? "runtime-status-unmeasured"
                      : "runtime-status-measured"
                  }`}
                >
                  {milestone.measurement === "unmeasured"
                    ? "Unmeasured"
                    : "Bounded MI300X observation"}
                </span>
              </div>
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

            {milestone.pipeline && (
              <div className="runtime-pipeline" aria-label="Canonical launch pipeline">
                <div className="runtime-pipeline-heading">
                  <p className="section-kicker">One canonical core</p>
                  <h3>Nine resources, PM4 predecessor, dispatch, then exact teardown</h3>
                </div>
                <ol>
                  {milestone.pipeline.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            )}

            {milestone.outcomes && (
              <div className="runtime-outcomes">
                <p className="section-kicker">Closed ordinary result</p>
                <h3>Exactly three ownership outcomes</h3>
                <dl>
                  {milestone.outcomes.map((outcome) => (
                    <div key={outcome.name}>
                      <dt>{outcome.name}</dt>
                      <dd>{outcome.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

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

            {milestone.hardwareExample && (
              <HardwareCommand {...milestone.hardwareExample} />
            )}

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
                {milestone.manifest && (
                  <>
                    <span>Core manifest SHA-256</span>
                    <code>{milestone.manifest}</code>
                  </>
                )}
                {milestone.evidenceRecord && (
                  <>
                    <span>Evidence record SHA-256</span>
                    <code>{milestone.evidenceRecord.sha256}</code>
                    <span>Record classification</span>
                    <code>{milestone.evidenceRecord.classification}</code>
                  </>
                )}
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
        <h2>Hardware evidence and longer-lived execution</h2>
        <p>
          The public one-shot boundary remains implementation-checked and
          unmeasured as an API. One separate bounded MI300X requalification is
          now retained, with no authority beyond its exact evidence record.
          Publication remains on hold while the launcher validator defect and
          longer-lived execution designs stay open.
        </p>
        <div className="runtime-next-row">
          <span>01</span>
          <div>
            <strong>Repair the post-success validator</strong>
            <p>Distinguish the harmless preflight and core-completion lines instead of expecting one ordered-gate match.</p>
          </div>
        </div>
        <div className="runtime-next-row">
          <span>02</span>
          <div>
            <strong>Add the compiler leaf bridge</strong>
            <p>Join compiler-issued artifact authority to the facade without adding a fe2o3-host dependency to KFD.</p>
          </div>
        </div>
        <div className="runtime-next-row">
          <span>03</span>
          <div>
            <strong>Design for repeated work</strong>
            <p>Persistent contexts, batching, cancellation policy, and asynchronous progress remain separate designs.</p>
          </div>
        </div>
      </section>
    </article>
  );
}
