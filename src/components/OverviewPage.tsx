import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Braces,
  History,
  Network,
} from "lucide-react";
import { Link } from "react-router-dom";
import { currentState } from "../content/current-state";

const paths = [
  {
    label: "Start with a kernel",
    detail: "Set up gfx942, run Fill, then follow the typed Vecadd vertical slice.",
    to: "/lesson/gfx942-setup",
  },
  {
    label: "Study compiler checks",
    detail: "Trace static and dynamic bounds, races, barriers, LDS publication, and fail-closed diagnostics.",
    to: "/lesson/compiler-checks",
  },
  {
    label: "Audit production evidence",
    detail: "Separate current compiler capability from immutable historical evidence records.",
    to: "/lesson/evidence-pipeline",
  },
] as const;

export function OverviewPage() {
  const active = currentState.capabilities.filter(
    (capability) => capability.status === "active",
  ).length;

  return (
    <article className="overview-page">
      <header className="overview-header">
        <p className="lesson-breadcrumb">Current field guide</p>
        <h1>fe2o3 kernels</h1>
        <p>
          Rust GPU kernels, workload-neutral compiler checks, source-model
          proofs, gfx942 execution, and the evidence boundaries between them.
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
        <Link to="/lesson/compiler-checks">
          <Braces size={19} aria-hidden="true" />
          <span><strong>Compiler checks</strong><small>Complete diagnostic catalog</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/status">
          <Activity size={19} aria-hidden="true" />
          <span><strong>Implementation status</strong><small>Kernel and delivery gates</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/architecture">
          <Network size={19} aria-hidden="true" />
          <span><strong>Architecture</strong><small>Current authority boundaries</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/lesson/evidence-archive">
          <History size={19} aria-hidden="true" />
          <span><strong>Evidence archive</strong><small>Immutable historical records</small></span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </nav>

      <section className="overview-section">
        <div>
          <p className="section-kicker">Choose a path</p>
          <h2>Move from code to evidence</h2>
        </div>
        <div className="overview-paths">
          {paths.map((path, index) => (
            <Link to={path.to} key={path.to}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{path.label}</strong><p>{path.detail}</p></div>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
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
      </footer>
    </article>
  );
}
