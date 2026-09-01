import {
  ArrowRight,
  Bot,
  Braces,
  CircleDashed,
  ExternalLink,
  FileCode2,
  Fingerprint,
  GitBranch,
  Layers3,
  ScanLine,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import {
  sourceIsaCharacteristicCommands,
  sourceIsaCharacteristicDuplicateFacts,
  sourceIsaCharacteristicFixtureDirectory,
  sourceIsaCharacteristicFixtureReady,
  sourceIsaCharacteristicIntervals,
  sourceIsaCharacteristicLineage,
  sourceIsaCharacteristicMemoryTarget,
  sourceIsaCharacteristicMilestone,
  sourceIsaCharacteristicPlanes,
  sourceIsaCharacteristicSources,
  sourceIsaCharacteristicSourceUrl,
  sourceIsaCharacteristicStructuralTarget,
} from "../content/source-isa-agent";

const truthRows = [
  ["Fixture provenance", "synthetic / self-claimed", "The archive demonstrates the protocol; it was not produced by a protected compiler run."],
  ["Archive authenticity", "false", "Canonical structure and identity do not authenticate who produced the archive."],
  ["Compiler authority", "false", "Inspection cannot publish, bless, or reconstruct compiler custody."],
  ["Hardware executed", "false", "Sparse final-HSACO anchors are synthetic compiler-lineage records, not an observed GPU execution."],
  ["Decoded ISA", "false", "Intervals identify byte ranges; they do not assert opcode semantics or a schedule."],
  ["Protected 3x2 matrix", "not run", "This tutorial must not stand in for the protected family-by-target acceptance."],
] as const;

const comparisonRows = [
  [
    "Compiler lineage",
    "Typed source, MIR, neutral KIR, target KIR, semantic-op, LLVM-handoff, and sparse-ISA coordinates with explicit absence.",
    "Consumes available debug information for live inspection; it does not preserve this fe2o3 compiler lineage contract.",
    "Correlates measured dispatch and trace records; source attribution depends on the collected artifacts and decoder.",
  ],
  [
    "Machine state",
    "Reports unavailable unless an authenticated hardware backend supplies it.",
    "Remains the live stopped-state tool for machine threads, registers, memory, and control.",
    "Measures hardware activity rather than providing an interactive stop-and-inspect session.",
  ],
  [
    "Trace evidence",
    "Keeps trace evidence separate and binds imported claims to stable identities.",
    "Can inspect a stopped process but is not the primary measured-trace collector.",
    "rocprofv3 and ATT remain the measured counter, sampling, and thread-trace path.",
  ],
  [
    "Agent access",
    "Canonical JSONL, typed absence, stable occurrence identities, hard bounds, and collection-bound pagination.",
    "Structured adapters can automate it, while native output and availability remain debugger-specific.",
    "Structured outputs are available; fe2o3 adds cross-layer identity and conservative evidence composition around them.",
  ],
] as const;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function shortIdentity(value: unknown): string {
  return typeof value === "string" && value.length >= 20
    ? `${value.slice(0, 12)}...${value.slice(-6)}`
    : "awaiting exact fixture";
}

function targetKind(target: unknown): string {
  const kind = record(record(target)?.kind);
  const memoryForm = record(kind?.memory_form);
  const label = typeof kind?.label === "string" ? kind.label : "pending exact kind";
  return typeof memoryForm?.label === "string" ? `${label} / ${memoryForm.label}` : label;
}

function occurrenceIdentity(fact: unknown): string {
  return shortIdentity(record(fact)?.occurrence_identity);
}

function exactJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "null";
}

export function SourceIsaAgentPage() {
  const [activeView, setActiveView] = useState(0);
  const selected = sourceIsaCharacteristicPlanes[activeView];

  return (
    <article className="lesson-page source-isa-agent-page">
      <header className="lesson-header source-isa-agent-header">
        <p className="lesson-breadcrumb">
          Debugger <span>/</span> Cross-layer inspection
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>Agent-native source/ISA inspection</h1>
            <p className="lesson-summary">
              Follow one compiler fact across semantic layers without turning
              sparse correlation into machine-state or execution authority.
            </p>
          </div>
          <span className="source-isa-agent-version">
            <Braces size={16} aria-hidden="true" /> Characteristic V1
          </span>
        </div>
        <div className="source-isa-agent-boundary">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            <strong>
              {sourceIsaCharacteristicFixtureReady
                ? "Exact authority-free archive"
                : "Exact fixture integration pending"}
            </strong>
            {sourceIsaCharacteristicFixtureReady
              ? "The checked-in synthetic transcript is byte-exact, canonical, self-claimed, unexecuted, and unauthenticated. Its digest and collection identity do not attest a producer."
              : "The four-plane UI and admission checks are ready. Coordinates, identities, and compiler pins stay empty until the qualified T4 transcript arrives."}
          </span>
        </div>
      </header>

      <section className="source-isa-agent-flow" aria-label="Characteristic query planes">
        {sourceIsaCharacteristicPlanes.map((plane, index) => (
          <div key={plane.id}>
            {index === 0 ? <Bot size={19} aria-hidden="true" /> : null}
            {index === 1 ? <Layers3 size={19} aria-hidden="true" /> : null}
            {index === 2 ? <GitBranch size={19} aria-hidden="true" /> : null}
            {index === 3 ? <ScanLine size={19} aria-hidden="true" /> : null}
            <span><small>{index + 1}</small><strong>{plane.label}</strong></span>
            <p>{plane.summary}</p>
          </div>
        ))}
      </section>

      <section className="source-isa-agent-run" aria-labelledby="source-isa-run-heading">
        <header>
          <p className="section-kicker">Replay boundary</p>
          <h2 id="source-isa-run-heading">
            {sourceIsaCharacteristicFixtureReady ? "Replay the exact archive" : "Reserved for the exact archive"}
          </h2>
          <p>
            The fixture boundary is localized at <code>{sourceIsaCharacteristicFixtureDirectory}</code>.
            {sourceIsaCharacteristicFixtureReady && sourceIsaCharacteristicMilestone.compilerCommit
              ? ` It freezes ${String(sourceIsaCharacteristicMilestone.fixtureCanonicalBytes)} raw canonical bytes from compiler commit ${sourceIsaCharacteristicMilestone.compilerCommit.slice(0, 10)} and reproduces four exact JSONL responses.`
              : " The command shape is stable; the archive and JSONL records are intentionally pending."}
          </p>
        </header>
        <pre><code>{sourceIsaCharacteristicCommands.join("\n")}</code></pre>
      </section>

      <section className="source-isa-agent-console" aria-labelledby="source-isa-console-heading">
        <header>
          <div>
            <p className="section-kicker">Four-plane workbench</p>
            <h2 id="source-isa-console-heading">Move from structure to sparse machine anchors</h2>
          </div>
          <span className={`source-isa-agent-state ${selected.state}`}>{selected.state}</span>
        </header>
        <div className="source-isa-agent-tabs" role="tablist" aria-label="Characteristic query plane">
          {sourceIsaCharacteristicPlanes.map((plane, index) => (
            <button
              aria-controls="source-isa-agent-panel"
              aria-selected={activeView === index}
              key={plane.id}
              onClick={() => setActiveView(index)}
              role="tab"
              type="button"
            >
              {plane.label}
            </button>
          ))}
        </div>
        <p className="source-isa-agent-summary">{selected.summary}</p>
        <div className="source-isa-agent-contract" aria-label={`${selected.label} contract`}>
          {selected.contract.map((item) => <span key={item}>{item}</span>)}
        </div>
        <div
          className="source-isa-agent-json"
          id="source-isa-agent-panel"
          role="tabpanel"
        >
          {selected.request && selected.response ? (
            <>
              <div>
                <span><Terminal size={15} aria-hidden="true" /> Request</span>
                <pre><code>{exactJson(selected.request)}</code></pre>
              </div>
              <div>
                <span><Fingerprint size={15} aria-hidden="true" /> Response</span>
                <pre><code>{exactJson(selected.response)}</code></pre>
              </div>
            </>
          ) : (
            <div className="source-isa-agent-pending">
              <CircleDashed size={22} aria-hidden="true" />
              <div>
                <strong>{selected.operation}</strong>
                <p>Awaiting the exact canonical request and response from the final compiler fixture.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="source-isa-lineage" aria-labelledby="source-isa-lineage-heading">
        <header>
          <p className="section-kicker">Correlation, not inference</p>
          <h2 id="source-isa-lineage-heading">One fact across seven compiler coordinates</h2>
          <p>
            A source-anchored fact retains each producer axis separately. Missing
            provenance and backend elimination use typed shapes instead of guessed links.
          </p>
        </header>
        <div className="source-isa-lineage-track" aria-label="Source to sparse ISA lineage">
          {sourceIsaCharacteristicLineage.map((stage, index) => (
            <div className={`source-isa-lineage-stage ${stage.status}`} key={stage.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.label}</strong>
              <code>{stage.value ?? "pending exact fixture"}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="source-isa-occurrences" aria-labelledby="source-isa-occurrences-heading">
        <header>
          <p className="section-kicker">Multiplicity and absence</p>
          <h2 id="source-isa-occurrences-heading">Keep structure visible when correlations differ</h2>
          <p>
            Target occurrences and catalog facts are separate planes. A structural
            target survives with zero facts, while exact duplicate facts keep distinct identities.
          </p>
        </header>
        <div className="source-isa-occurrence-grid">
          <section aria-labelledby="memory-form-heading">
            <h3 id="memory-form-heading">Exact memory form</h3>
            <strong>{targetKind(sourceIsaCharacteristicMemoryTarget)}</strong>
            <p>Family and form stay separate: plain, guarded, and matrix-tile are not collapsed.</p>
          </section>
          <section aria-labelledby="structural-target-heading">
            <h3 id="structural-target-heading">Structural-only target</h3>
            <strong>
              {sourceIsaCharacteristicStructuralTarget
                ? `${shortIdentity(record(sourceIsaCharacteristicStructuralTarget)?.occurrence_identity)} / correlation_count 0`
                : "awaiting exact zero-correlation target"}
            </strong>
            <p>No synthetic source, LLVM coordinate, transformation, or ISA fact is added.</p>
          </section>
          <section aria-labelledby="duplicate-facts-heading">
            <h3 id="duplicate-facts-heading">Duplicate occurrences</h3>
            <div className="source-isa-duplicate-identities">
              <code>{sourceIsaCharacteristicDuplicateFacts ? occurrenceIdentity(sourceIsaCharacteristicDuplicateFacts[0]) : "occurrence A pending"}</code>
              <code>{sourceIsaCharacteristicDuplicateFacts ? occurrenceIdentity(sourceIsaCharacteristicDuplicateFacts[1]) : "occurrence B pending"}</code>
            </div>
            <p>Equal correlation payloads remain two facts through stable catalog ordinals.</p>
          </section>
          <section aria-labelledby="interval-page-heading">
            <h3 id="interval-page-heading">Fact-bound intervals</h3>
            <strong>
              {sourceIsaCharacteristicIntervals.length > 0
                ? `${sourceIsaCharacteristicIntervals.length} interval records on this page`
                : "awaiting exact sparse interval page"}
            </strong>
            <p>Intervals paginate independently so a fact page never embeds an unbounded vector.</p>
          </section>
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="source-isa-truth-heading">
        <header>
          <p className="section-kicker">Stable truth boundary</p>
          <h2 id="source-isa-truth-heading">What the archive does not establish</h2>
          <p>
            The public digest checks content equality. It is not a signature,
            authenticated producer evidence, protected execution evidence, final opcode
            classification, or a hardware timeline.
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
          <p className="section-kicker">Complementary evidence planes</p>
          <h2 id="source-isa-difference-heading">Use each tool for the state it actually owns</h2>
          <p>
            This fe2o3 view adds typed compiler lineage, absence, occurrence identity, and pagination.
            ROCgdb remains the live machine-state debugger. rocprofv3 and ATT remain the measured trace path.
          </p>
        </header>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Question</th><th>fe2o3</th><th>ROCgdb</th><th>rocprofv3 / ATT</th></tr></thead>
            <tbody>
              {comparisonRows.map(([surface, fe2o3, rocgdb, rocprof]) => (
                <tr key={surface}><th>{surface}</th><td>{fe2o3}</td><td>{rocgdb}</td><td>{rocprof}</td></tr>
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
          <p className="section-kicker">Implementation boundary</p>
          <h2 id="source-isa-evidence-heading">Audit the schema before trusting a view</h2>
          <p>
            {sourceIsaCharacteristicFixtureReady && sourceIsaCharacteristicMilestone.compilerCommit
              ? `Links resolve against exact compiler commit ${sourceIsaCharacteristicMilestone.compilerCommit.slice(0, 10)}.`
              : "Source links activate only after the exact final compiler commit is pinned."}
            {" "}Issue #215 remains open.
          </p>
        </header>
        <div>
          {sourceIsaCharacteristicSources.map((source) => {
            const href = sourceIsaCharacteristicSourceUrl(source.path);
            return href ? (
              <a href={href} key={source.path} rel="noreferrer" target="_blank">
                <span>{source.label}</span>
                <code>{source.path}</code>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : (
              <div className="source-isa-agent-source-pending" key={source.path}>
                <span>{source.label}</span>
                <code>{source.path}</code>
                <FileCode2 size={14} aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}
