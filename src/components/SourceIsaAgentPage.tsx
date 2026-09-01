import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  CircleOff,
  ExternalLink,
  FileJson2,
  Fingerprint,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import {
  sourceIsaAgentCommands,
  sourceIsaAgentMilestone,
  sourceIsaAgentRequests,
  sourceIsaAgentResponses,
  sourceIsaAgentSources,
  sourceIsaAgentSourceUrl,
} from "../content/source-isa-agent";

const views = [
  {
    id: "capability",
    label: "Capability",
    summary: "Two operations, explicit hard limits, zero implicit authority.",
    state: "available",
  },
  {
    id: "collection",
    label: "Collection",
    summary: "A canonical collection can report an incomplete transport without losing identity.",
    state: "incomplete",
  },
  {
    id: "failure",
    label: "Failure",
    summary: "Malformed collection bytes become a typed, correlated, nonterminal error.",
    state: "invalid_collection",
  },
] as const;

const truthRows = [
  ["Observation", "true", "The decoder reports only what the canonical collection contains."],
  ["Compiler authority", "false", "Inspection cannot publish or bless compiler output."],
  ["Runtime authority", "false", "Inspection cannot load, launch, stop, or resume a GPU."],
  ["Hardware observed", "false", "The tutorial fixture is synthetic and never executed."],
  ["Semantic refinement", "false", "A source/ISA association is not a compiler-correctness proof."],
] as const;

const comparisonRows = [
  ["Automation surface", "Versioned request and response schemas", "Human output or adapter-specific parsing"],
  ["Absence", "Typed missing, unavailable, and error states", "Often inferred from omitted text or command failure"],
  ["Identity", "Collection digest, canonical length, unit identity, revision", "Usually assembled by the caller"],
  ["Pagination", "Bounded and collection-bound cursor", "Tool or wrapper convention"],
  ["Authority", "Every response repeats what it cannot prove", "Typically outside the debugger data model"],
] as const;

export function SourceIsaAgentPage() {
  const [activeView, setActiveView] = useState(0);
  const selected = views[activeView];
  const request = JSON.stringify(sourceIsaAgentRequests[activeView], null, 2);
  const response = JSON.stringify(sourceIsaAgentResponses[activeView], null, 2);

  return (
    <article className="lesson-page source-isa-agent-page">
      <header className="lesson-header source-isa-agent-header">
        <p className="lesson-breadcrumb">
          Debugger <span>/</span> Agent protocol
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>Agent-native source/ISA inspection</h1>
            <p className="lesson-summary">
              Query canonical compiler observations through typed, bounded JSONL
              while keeping evidence identity, absence, and authority intact.
            </p>
          </div>
          <span className="source-isa-agent-version">
            <Braces size={16} aria-hidden="true" /> Agent JSON V1
          </span>
        </div>
        <div className="source-isa-agent-boundary">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            <strong>Synthetic canonical fixture</strong>
            The protected 3x2 source-to-ISA matrix has not run. This page
            demonstrates protocol behavior, not GPU execution or complete
            source-to-machine evidence.
          </span>
        </div>
      </header>

      <section className="source-isa-agent-flow" aria-label="Observation inspection flow">
        <div>
          <Fingerprint size={19} aria-hidden="true" />
          <span><small>1</small><strong>Retain identity</strong></span>
          <p>Canonical bytes bind configuration, session, units, and transport state.</p>
        </div>
        <div>
          <FileJson2 size={19} aria-hidden="true" />
          <span><small>2</small><strong>Decode once</strong></span>
          <p>Human and agent views share the same strict observation decoder.</p>
        </div>
        <div>
          <Bot size={19} aria-hidden="true" />
          <span><small>3</small><strong>Query safely</strong></span>
          <p>Fresh request IDs, monotonic revisions, and bounded pages drive automation.</p>
        </div>
        <div>
          <CircleOff size={19} aria-hidden="true" />
          <span><small>4</small><strong>Refuse elevation</strong></span>
          <p>Inspection never grants compiler, artifact, runtime, or hardware authority.</p>
        </div>
      </section>

      <section className="source-isa-agent-run" aria-labelledby="source-isa-run-heading">
        <header>
          <p className="section-kicker">Exact transcript</p>
          <h2 id="source-isa-run-heading">Run the frozen fixture</h2>
          <p>
            These commands consume the checked-in 144-byte canonical collection.
            The responses below were generated on MI300X from compiler commit {sourceIsaAgentMilestone.compilerCommit.slice(0, 10)}.
          </p>
        </header>
        <pre><code>{sourceIsaAgentCommands.join("\n")}</code></pre>
      </section>

      <section className="source-isa-agent-console" aria-labelledby="source-isa-console-heading">
        <header>
          <div>
            <p className="section-kicker">Protocol workbench</p>
            <h2 id="source-isa-console-heading">Correlate every answer</h2>
          </div>
          <span className={`source-isa-agent-state ${selected.id}`}>{selected.state}</span>
        </header>
        <div className="source-isa-agent-tabs" role="tablist" aria-label="Agent protocol example">
          {views.map((view, index) => (
            <button
              aria-controls="source-isa-agent-panel"
              aria-selected={activeView === index}
              key={view.id}
              onClick={() => setActiveView(index)}
              role="tab"
              type="button"
            >
              {view.label}
            </button>
          ))}
        </div>
        <p className="source-isa-agent-summary">{selected.summary}</p>
        <div
          className="source-isa-agent-json"
          id="source-isa-agent-panel"
          role="tabpanel"
        >
          <div>
            <span><Terminal size={15} aria-hidden="true" /> Request</span>
            <pre><code>{request}</code></pre>
          </div>
          <div>
            <span><CheckCircle2 size={15} aria-hidden="true" /> Response</span>
            <pre><code>{response}</code></pre>
          </div>
        </div>
        <p className="source-isa-agent-exit-note">
          A typed invalid collection is returned with <code>status: error</code>
          on a successful process exit. Agent clients must inspect the response
          envelope, not only the shell status.
        </p>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="source-isa-truth-heading">
        <header>
          <p className="section-kicker">Stable truth boundary</p>
          <h2 id="source-isa-truth-heading">What this response establishes</h2>
          <p>
            Pagination completion and observation completeness are independent.
            This fixture exhausts its one-item page while remaining incomplete
            because a selected unit is missing.
          </p>
        </header>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Claim</th><th>Value</th><th>Meaning</th></tr></thead>
            <tbody>
              {truthRows.map(([claim, value, meaning]) => (
                <tr key={claim}><th>{claim}</th><td><code>{value}</code></td><td>{meaning}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="source-isa-agent-difference" aria-labelledby="source-isa-difference-heading">
        <header>
          <p className="section-kicker">Practical differentiator</p>
          <h2 id="source-isa-difference-heading">Evidence designed for agents</h2>
          <p>
            The advantage is not a new hardware stop mechanism. It is a strict
            semantic envelope that agents can validate without scraping a human
            presentation. ROCgdb remains the richer live machine debugger, and
            rocprof with ATT remains the hardware collection and decode path.
          </p>
        </header>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Surface</th><th>fe2o3 protocol</th><th>Conventional wrapper</th></tr></thead>
            <tbody>
              {comparisonRows.map(([surface, fe2o3, conventional]) => (
                <tr key={surface}><th>{surface}</th><td>{fe2o3}</td><td>{conventional}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <a className="source-isa-agent-live-link" href="#/debugger/live-kfd">
          Open the live KFD, ROCgdb, and profiler workbench <ArrowRight size={15} aria-hidden="true" />
        </a>
      </section>

      <section className="source-isa-agent-evidence" aria-labelledby="source-isa-evidence-heading">
        <header>
          <p className="section-kicker">Pinned implementation</p>
          <h2 id="source-isa-evidence-heading">Audit the protocol boundary</h2>
          <p>
            Source links resolve against commit {sourceIsaAgentMilestone.compilerCommit.slice(0, 10)},
            tree {sourceIsaAgentMilestone.compilerTree.slice(0, 10)}. Issue #215 remains open.
          </p>
        </header>
        <div>
          {sourceIsaAgentSources.map((source) => (
            <a href={sourceIsaAgentSourceUrl(source.path)} key={source.path} rel="noreferrer" target="_blank">
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
