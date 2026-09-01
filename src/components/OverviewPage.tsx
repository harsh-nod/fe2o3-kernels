import {
  Activity,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Braces,
  CircuitBoard,
  Cpu,
  GitPullRequest,
  ListChecks,
  Network,
  Rows3,
  TerminalSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import { currentState } from "../content/current-state";
import {
  contributorWorkflow,
  learningTracks,
  runTodayMatrix,
  setupPaths,
} from "../content/learning-hub";
import { EvidenceBadge } from "./EvidenceBadge";

export function OverviewPage() {
  const active = currentState.capabilities.filter(
    (capability) => capability.status === "active",
  ).length;

  return (
    <article className="overview-page">
      <header className="overview-header">
        <p className="lesson-breadcrumb">Community launch guide</p>
        <h1>fe2o3 kernels</h1>
        <p>
          Write safe Rust GPU kernels, run the current CPU-first workflows, and
          inspect the evidence behind every claim before hardware execution.
        </p>
        <div className="overview-snapshot" aria-label="Current compiler snapshot">
          <div>
            <span>Compiler main</span>
            <code>{currentState.compilerShortCommit}</code>
          </div>
          <div>
            <span>Reviewed</span>
            <code>{currentState.reviewedOn}</code>
          </div>
          <div>
            <span>Capabilities</span>
            <strong>{active} active / {currentState.capabilities.length - active} partial</strong>
          </div>
        </div>
      </header>

      <nav className="overview-actions" aria-label="Primary destinations">
        <Link to="/getting-started">
          <BookOpen size={19} aria-hidden="true" />
          <span><strong>Start tutorial</strong><small>Rust source to CPU replay</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <a href="#run-today">
          <TerminalSquare size={19} aria-hidden="true" />
          <span><strong>Run today</strong><small>Commands with boundaries</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </a>
        <Link to="/operators">
          <Rows3 size={19} aria-hidden="true" />
          <span><strong>Operator cookbook</strong><small>Contracts and sources</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/lesson/compiler-checks">
          <Braces size={19} aria-hidden="true" />
          <span><strong>Compiler checks</strong><small>Complete diagnostic catalog</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </nav>

      <section className="overview-section">
        <div>
          <p className="section-kicker">Choose a path</p>
          <h2>Start from your job</h2>
        </div>
        <div className="launch-track-grid">
          {learningTracks.map((path, index) => (
            <Link to={path.startHref} key={path.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{path.title}</strong>
                <small>{path.audience}</small>
                <p>{path.summary}</p>
              </div>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="overview-section" id="run-today">
        <div>
          <p className="section-kicker">Run today</p>
          <h2>Commands with exact boundaries</h2>
          <Link className="overview-inline-link" to="/operators">
            Compare operator contracts <ArrowRight size={14} />
          </Link>
        </div>
        <div className="run-matrix" role="table" aria-label="What can I run today">
          <div className="run-matrix-head" role="row">
            <span role="columnheader">Operator</span>
            <span role="columnheader">Environment</span>
            <span role="columnheader">Status</span>
          </div>
          {runTodayMatrix.map((row) => (
            <article role="row" key={row.id}>
              <div className="run-matrix-main" role="cell">
                <Link to={row.href}>{row.operator}</Link>
                <code>{row.command}</code>
                <p>{row.expected}</p>
                <small>{row.boundary}</small>
              </div>
              <span role="cell">{row.environment}</span>
              <span role="cell"><EvidenceBadge kind={row.status} /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div>
          <p className="section-kicker">Setup</p>
          <h2>Pick the narrowest environment</h2>
        </div>
        <div className="setup-paths">
          {setupPaths.map((path) => {
            const Icon = path.id === "cpu" ? Cpu : CircuitBoard;
            return (
              <article key={path.id}>
                <Icon size={18} aria-hidden="true" />
                <div>
                  <strong>{path.title}</strong>
                  <small>{path.environment}</small>
                  <code>{path.command}</code>
                  <p>{path.expected}</p>
                  <p>{path.boundary}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overview-section">
        <div>
          <p className="section-kicker">Contribute</p>
          <h2>Evidence-first PR shape</h2>
          <Link className="overview-inline-link" to="/lesson/contributing-kernel">
            Open contributor lesson <ArrowRight size={14} />
          </Link>
        </div>
        <div className="contributor-checklist">
          {contributorWorkflow.map((step, index) => (
            <article key={step.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
                <small><ListChecks size={13} aria-hidden="true" /> {step.check}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div>
          <p className="section-kicker">Current compiler</p>
          <h2>What production main enforces</h2>
          <Link className="overview-inline-link" to="/architecture">
            Inspect sources and tracked issues <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overview-capabilities">
          {currentState.capabilities.map((capability) => (
            <div key={capability.id}>
              <span className={`capability-state capability-state-${capability.status}`}>
                {capability.status}
              </span>
              <strong>{capability.label}</strong>
              <p>{capability.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="overview-footer">
        <BookOpenCheck size={18} aria-hidden="true" />
        <p>
          Lesson claims retain their own exact evidence pins. Current compiler
          status is sourced from the reviewed manifest and never inferred from
          historical tutorial results.
        </p>
        <Link className="overview-inline-link" to="/status">
          <Activity size={14} /> Implementation status
        </Link>
        <Link className="overview-inline-link" to="/architecture">
          <Network size={14} /> Architecture
        </Link>
        <Link className="overview-inline-link" to="/lesson/contributing-kernel">
          <GitPullRequest size={14} /> Contribute
        </Link>
      </footer>
    </article>
  );
}
