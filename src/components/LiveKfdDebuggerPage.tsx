import {
  Braces,
  Cpu,
  ExternalLink,
  Eye,
  Pause,
  Radio,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { debuggerComparisonLinks } from "../content/debugger-workbench";
import {
  liveKfdCommand,
  liveKfdComparisonRows,
  liveKfdMilestone,
  liveKfdOperations,
  liveKfdPublication,
  liveKfdSourceUrl,
  liveKfdSources,
  liveKfdUnsupported,
  type LiveKfdOperationId,
} from "../content/live-kfd-debugger";

function pretty(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const truthIcons = {
  declared: ShieldCheck,
  observed: Eye,
  unavailable: TriangleAlert,
} as const;

export function LiveKfdDebuggerPage() {
  const [operationId, setOperationId] =
    useState<LiveKfdOperationId>("binding");
  const operation = liveKfdOperations.find(
    (candidate) => candidate.id === operationId,
  )!;

  return (
    <article className="lesson-page live-kfd-page">
      <header className="lesson-header live-kfd-header">
        <p className="lesson-breadcrumb">
          Debugger <span>/</span> MI300X milestone
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>Live KFD debugger</h1>
            <p className="lesson-summary">
              Correlate exact fe2o3 semantic inputs with a launch-owned process,
              cooperative target declarations, and independently observed KFD
              queue state through one bounded agent protocol.
            </p>
          </div>
          <span className="live-kfd-version">
            <Braces size={16} aria-hidden="true" /> V3 JSONL
          </span>
        </div>
        <div className="live-kfd-validation">
          <Radio size={17} aria-hidden="true" />
          <span>
            <strong>Observed on MI300X</strong>
            Real runtime transition, queue snapshot, suspend revision 1, resume
            revision 2, and clean termination.
          </span>
        </div>
      </header>

      <section
        className="live-kfd-truth-band"
        aria-labelledby="live-kfd-truth-heading"
      >
        <header>
          <p className="section-kicker">What the session knows</p>
          <h2 id="live-kfd-truth-heading">Truth stays attached to its source</h2>
          <p>
            Matching digests are useful correlation. They do not silently turn
            target declarations into KFD observations or execution evidence.
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
          <h2 id="live-kfd-launch-heading">Four exact files, one retained process</h2>
          <p>
            The launcher rejects symlinks, hard links, role aliases, changing
            files, invalid HSACO, and an unexecutable target before it acquires
            live debugger state.
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
          <span><small>1</small><strong>Admit exact bytes</strong></span>
          <p>Bundle V2, request, COV6 HSACO, executable</p>
        </div>
        <div>
          <Terminal size={19} aria-hidden="true" />
          <span><small>2</small><strong>Own launch</strong></span>
          <p>Retained descriptor, exec stop, process instance</p>
        </div>
        <div>
          <Radio size={19} aria-hidden="true" />
          <span><small>3</small><strong>Join evidence</strong></span>
          <p>Target declarations beside KFD observations</p>
        </div>
        <div>
          <Cpu size={19} aria-hidden="true" />
          <span><small>4</small><strong>Query safely</strong></span>
          <p>Logical IDs, revisions, bounded JSONL</p>
        </div>
      </section>

      <section className="live-kfd-console" aria-labelledby="live-kfd-console-heading">
        <header>
          <div>
            <p className="section-kicker">Agent-native session</p>
            <h2 id="live-kfd-console-heading">Inspect the exact protocol shape</h2>
            <p>{operation.summary}</p>
          </div>
          <div className="debug-segments" role="tablist" aria-label="Live KFD operation">
            {liveKfdOperations.map((candidate) => (
              <button
                aria-selected={operationId === candidate.id}
                className={operationId === candidate.id ? "active" : ""}
                key={candidate.id}
                onClick={() => setOperationId(candidate.id)}
                role="tab"
                type="button"
              >
                {candidate.label}
              </button>
            ))}
          </div>
        </header>
        <div className="debug-json-grid" role="tabpanel">
          <div>
            <span>request.jsonl</span>
            <pre data-testid="live-kfd-request">{pretty(operation.request)}</pre>
          </div>
          <div>
            <span>response.jsonl</span>
            <pre data-testid="live-kfd-response">{pretty(operation.response)}</pre>
          </div>
        </div>
      </section>

      <section className="live-kfd-limits" aria-labelledby="live-kfd-limits-heading">
        <header>
          <Pause size={20} aria-hidden="true" />
          <div>
            <p className="section-kicker">Current boundary</p>
            <h2 id="live-kfd-limits-heading">Unavailable means unavailable</h2>
          </div>
        </header>
        <ul>
          {liveKfdUnsupported.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>
          The CPU semantic debugger can replay thread, logical-wave, workgroup,
          KIR, SSA, and allocation-relative state under the same exact input
          identities. V3 does not present those simulator facts as live GPU
          wave state.
        </p>
      </section>

      <section className="debug-comparison live-kfd-comparison" aria-labelledby="live-kfd-comparison-heading">
        <header>
          <p className="section-kicker">Differentiator and gaps</p>
          <h2 id="live-kfd-comparison-heading">Better evidence composition, not yet deeper machine control</h2>
          <p>
            fe2o3's unique surface is exact compiler/simulator/runtime identity
            and typed provenance in an agent protocol. ROCgdb and rocprof remain
            stronger for several live-machine and performance workflows today.
          </p>
        </header>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Evidence surface</th>
                <th>fe2o3 V3</th>
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
      </section>
    </article>
  );
}
