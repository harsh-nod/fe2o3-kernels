import {
  ArrowRight,
  Braces,
  Cpu,
  ExternalLink,
  Eye,
  Radio,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { debuggerComparisonLinks } from "../content/debugger-workbench";
import {
  liveKfdCommand,
  liveKfdComparisonRows,
  liveKfdCurrentImplementationPaths,
  liveKfdMilestone,
  liveKfdPublication,
  liveKfdSourceUrl,
  liveKfdSources,
  liveKfdUnsupported,
} from "../content/live-kfd-debugger";
import { currentSourceUrl, currentState } from "../content/current-state";
import { GpuDebugProfilerWorkbench } from "./GpuDebugProfilerWorkbench";

const truthIcons = {
  declared: ShieldCheck,
  observed: Eye,
  inferred: Cpu,
  unavailable: TriangleAlert,
} as const;

export function LiveKfdDebuggerPage() {
  return (
    <article className="lesson-page live-kfd-page">
      <header className="lesson-header live-kfd-header">
        <p className="lesson-breadcrumb">
          Debugger <span>/</span> Hardware + profiles
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>GPU debugger + profiler workbench</h1>
            <p className="lesson-summary">
              Inspect direct-KFD queue-suspension evidence, generic ROCgdb/MI threads,
              and content-addressed rocprof evidence without merging their
              distinct authority or validation scopes.
            </p>
          </div>
          <span className="live-kfd-version">
            <Braces size={16} aria-hidden="true" /> V3 debug · V4 profile
          </span>
        </div>
        <div className="live-kfd-validation">
          <Radio size={17} aria-hidden="true" />
          <span>
            <strong>Scopes are separate</strong>
            Direct-KFD stopped-queue headers are sequentially MI300X-observed,
            not one atomic checkpoint. ROCgdb fixtures admit generic MI threads,
            and Profiler V4 is queried from canonical fixtures; none claims a
            validated live GPU wave stop.
          </span>
        </div>
      </header>

      <section
        className="live-kfd-truth-band"
        aria-labelledby="live-kfd-truth-heading"
      >
        <header>
          <p className="section-kicker">What the tools know</p>
          <h2 id="live-kfd-truth-heading">Truth stays attached to its source</h2>
          <p>
            Matching identities enable composition. They do not upgrade a
            declared compiler binding, admitted generic MI thread, or ATT reference
            into an independently observed live-machine fact.
          </p>
        </header>
        <div className="live-kfd-truth-grid">
          {liveKfdMilestone.map((item) => {
            const Icon = truthIcons[item.truth];
            return (
              <div className={`live-kfd-truth ${item.truth}`} key={item.label}>
                <Icon size={17} aria-hidden="true" />
                <span>
                  <small>{item.truth}</small>
                  <strong>{item.label}</strong>
                  <em>{item.state}</em>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="live-kfd-launch" aria-labelledby="live-kfd-launch-heading">
        <div>
          <p className="section-kicker">Launch contract</p>
          <h2 id="live-kfd-launch-heading">Exact inputs, backend-selected ownership</h2>
          <p>
            The launcher rejects symlinks, hard links, role aliases, changing
            files, invalid HSACO, and an unexecutable target before it acquires
            live debugger state. Direct KFD and ROCgdb debug-trap ownership are
            mutually selected backends, never simultaneous controllers.
          </p>
        </div>
        <pre><code>{liveKfdCommand}</code></pre>
      </section>

      <section
        className="live-kfd-flow"
        aria-label="Live KFD evidence flow"
      >
        <div>
          <ShieldCheck size={19} aria-hidden="true" />
          <span><small>1</small><strong>Bind evidence</strong></span>
          <p>Compiler, artifact, environment, tool, configuration</p>
        </div>
        <div>
          <Terminal size={19} aria-hidden="true" />
          <span><small>2</small><strong>Select backend</strong></span>
          <p>Direct KFD, ROCgdb / MI, or profiler capture</p>
        </div>
        <div>
          <Radio size={19} aria-hidden="true" />
          <span><small>3</small><strong>Retain origin</strong></span>
          <p>Declared, observed, inferred, unavailable</p>
        </div>
        <div>
          <Cpu size={19} aria-hidden="true" />
          <span><small>4</small><strong>Query safely</strong></span>
          <p>Logical IDs, evidence links, bounded plans</p>
        </div>
      </section>

      <GpuDebugProfilerWorkbench />

      <section className="live-kfd-limits" aria-labelledby="live-kfd-limits-heading">
        <header>
          <TriangleAlert size={20} aria-hidden="true" />
          <div>
            <p className="section-kicker">Current boundary</p>
            <h2 id="live-kfd-limits-heading">Unavailable means unavailable</h2>
          </div>
        </header>
        <ul>
          {liveKfdUnsupported.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>
          CPU simulator debugging is a separate deterministic semantic replay
          over supported KIR. It can provide thread,
          logical-wave, workgroup, KIR, SSA, and allocation-relative state.
          Neither live debug backend nor Profiler V4 presents those simulator
          facts as live GPU wave state, GPU equivalence, timing, or CPU
          performance prediction.
        </p>
        <a className="source-isa-agent-live-link" href="#/debugger/source-isa-agent">
          Inspect compile-time source/ISA observations as typed JSONL
          <ArrowRight size={15} aria-hidden="true" />
        </a>
        <a className="source-isa-agent-live-link" href="#/debugger/profiler-import">
          Follow strict rocprof import through durable publication
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </section>

      <section className="debug-comparison live-kfd-comparison" aria-labelledby="live-kfd-comparison-heading">
        <header>
          <p className="section-kicker">Exact differentiator and gaps</p>
          <h2 id="live-kfd-comparison-heading">Semantic evidence composition across complementary tools</h2>
          <p>
            fe2o3 adds content identity, truth origin, typed absence, and bounded
            agent queries across compiler, debugger, simulator, and profiler
            evidence. ROCgdb remains the mature live machine debugger; rocprof
            remains the collector and ATT decode path; Mojo delegates its debug
            workflow to platform tools.
          </p>
        </header>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Evidence surface</th>
                <th>fe2o3 composite</th>
                <th>ROCgdb</th>
                <th>rocprofv3 / ATT</th>
                <th>Mojo debug</th>
              </tr>
            </thead>
            <tbody>
              {liveKfdComparisonRows.map((row) => (
                <tr key={row.surface}>
                  <th>{row.surface}</th>
                  <td>{row.fe2o3}</td>
                  <td>{row.rocgdb}</td>
                  <td>{row.rocprof}</td>
                  <td>{row.mojo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="debug-source-links" aria-label="Official comparison sources">
          {debuggerComparisonLinks.map((link) => (
            <a href={link.href} key={link.href} rel="noreferrer" target="_blank">
              {link.label} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="live-kfd-evidence" aria-labelledby="live-kfd-evidence-heading">
        <header>
          <p className="section-kicker">Auditable implementation</p>
          <h2 id="live-kfd-evidence-heading">Read the owning boundaries</h2>
          <p>
            Source links are pinned to compiler commit {liveKfdPublication.compilerCommit.slice(0, 10)}.
          </p>
        </header>
        <div>
          {liveKfdSources.map((source) => (
            <a href={liveKfdSourceUrl(source.path)} key={source.path} rel="noreferrer" target="_blank">
              <span>{source.label}</span>
              <code>{source.path}</code>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
        <aside className="live-kfd-current-paths">
          <strong>Owning implementation paths</strong>
          <p>
            Current implementation links are pinned to publication evidence
            commit {currentState.compilerShortCommit}. V3 cleanup finishes KFD
            state before forcibly terminating and boundedly reaping the direct
            leader; pidfd and leader-only PTRACE_O_EXITKILL do not contain
            descendants or provide graceful target queue/runtime shutdown.
          </p>
          <div>
            {liveKfdCurrentImplementationPaths.map((path) => (
              <a href={currentSourceUrl(path)} key={path} rel="noreferrer" target="_blank">
                <code>{path}</code>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
        </aside>
      </section>
    </article>
  );
}
