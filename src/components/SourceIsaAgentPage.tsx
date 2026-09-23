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
import { lazy, Suspense, useState } from "react";
import {
  decodedAttSourceIsaMilestone,
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

const RecordedSourceComparison = lazy(async () => {
  const [{ SourceVariantComparison }, { default: evidence }] = await Promise.all([
    import("./SourceVariantComparison"),
    import("../../examples/ordinary_bitwise_promotion_v1.json"),
  ]);
  return {
    default: function RetainedSourceComparison() {
      return <SourceVariantComparison evidence={evidence}
        expectedReceiptSha256="908100a406d336cfc5bc28b6c584e5830293a951cf7b3e8f9245130520603142" />;
    },
  };
});

const RecordedFinalNativeComparison = lazy(async () => {
  const [{ FinalNativeComparison }, { default: evidence }] = await Promise.all([
    import("./FinalNativeComparison"),
    import("../../examples/source_instruction_native_comparison_v1.json"),
  ]);
  return {
    default: function RetainedFinalNativeComparison() {
      return <FinalNativeComparison evidence={evidence}
        expectedJoinSha256="5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162" />;
    },
  };
});

const RecordedAuthoringNavigation = lazy(async () => {
  const [{ AuthoringNavigation }, { AUTHORING_NAVIGATION_RETAINED_INPUT }] = await Promise.all([
    import("./AuthoringNavigation"),
    import("../content/authoring-navigation-retained-input"),
  ]);
  return {
    default: function RetainedAuthoringNavigation() {
      return <AuthoringNavigation input={AUTHORING_NAVIGATION_RETAINED_INPUT} />;
    },
  };
});

const RecordedProgramGuide = lazy(() =>
  import("./RecordedProgramTutorial").then((module) => ({
    default: module.RecordedProgramTutorial,
  })),
);

const LocalRecordedResourceImport = lazy(() =>
  import("./RecordedResourceImport").then((module) => ({
    default: module.RecordedResourceImport,
  })),
);

const RecordedMemoryGuide = lazy(() =>
  import("./RecordedMemoryTutorial").then((module) => ({
    default: module.RecordedMemoryTutorial,
  })),
);

const LocalRecordedWatchpoint = lazy(() =>
  import("./RecordedWatchpointObservation").then((module) => ({
    default: module.RecordedWatchpointObservation,
  })),
);

const LocalRecordedOccurrences = lazy(() =>
  import("./RecordedRuntimeOccurrences").then((module) => ({
    default: module.RecordedRuntimeOccurrences,
  })),
);

const LocalRecordedWatchSource = lazy(() =>
  import("./RecordedWatchSourceObservation").then((module) => ({
    default: module.RecordedWatchSourceObservation,
  })),
);

const LocalRecordedFaultSource = lazy(() =>
  import("./RecordedFaultSourceReplay").then((module) => ({
    default: module.RecordedFaultSourceReplay,
  })),
);

const LocalLiveCpuDebugger = lazy(() =>
  import("./LiveCpuDebuggerWorkbench").then((module) => ({
    default: module.LiveCpuDebuggerWorkbench,
  })),
);

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
  const [showSourceComparison, setShowSourceComparison] = useState(false);
  const [showFinalNativeComparison, setShowFinalNativeComparison] = useState(false);
  const [showAuthoringNavigation, setShowAuthoringNavigation] = useState(false);
  const [showProgramTutorial, setShowProgramTutorial] = useState(false);
  const [showResourceImport, setShowResourceImport] = useState(false);
  const [showMemoryTutorial, setShowMemoryTutorial] = useState(false);
  const [showWatchpoint, setShowWatchpoint] = useState(false);
  const [showWatchSource, setShowWatchSource] = useState(false);
  const [showFaultSource, setShowFaultSource] = useState(false);
  const [showLiveCpu, setShowLiveCpu] = useState(false);
  const [showOccurrences, setShowOccurrences] = useState(false);
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

      <section className="source-isa-agent-truth" aria-labelledby="recorded-source-promotion-heading"
        data-testid="recorded-source-promotion">
        <header>
          <p className="section-kicker">Separate actual source example</p>
          <h2 id="recorded-source-promotion-heading">Inspect an actual Rust-to-assembly promotion</h2>
          <p>
            Compare original Rust, its generated instruction helper, and an intentional instruction edit.
            These real source-export and CPU-case observations are separate from the synthetic
            Characteristic archive. They do not establish a protected artifact or GPU execution.
          </p>
        </header>
        <button type="button" aria-expanded={showSourceComparison}
          aria-controls="recorded-source-promotion-content"
          onClick={() => setShowSourceComparison((open) => !open)}>
          {showSourceComparison ? "Close actual source comparison" : "Open actual source comparison"}
        </button>
        <div id="recorded-source-promotion-content">
          {showSourceComparison && <Suspense fallback={<p role="status">Loading retained source comparison…</p>}>
            <RecordedSourceComparison />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="final-native-comparison-heading">
        <h2 id="final-native-comparison-heading">Compare source with final native bytes</h2>
        <p>Inspect retained source, LLVM, and complete native payloads for an intentional XOR-to-OR edit
          at O0 and O3. Declared registers and encoded descriptor capacity are separate observations,
          not runtime register values, hardware execution, or a correctness proof.</p>
        <button type="button" aria-expanded={showFinalNativeComparison}
          aria-controls="final-native-comparison-content"
          onClick={() => setShowFinalNativeComparison((open) => !open)}>
          {showFinalNativeComparison ? "Close final native comparison" : "Open final native comparison"}
        </button>
        <div id="final-native-comparison-content">
          {showFinalNativeComparison && <Suspense fallback={<p role="status">Checking retained native bytes…</p>}>
            <RecordedFinalNativeComparison />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="ordinary-source-navigation-heading">
        <h2 id="ordinary-source-navigation-heading">Navigate ordinary Rust and canonical KIR</h2>
        <p>A separate actual-source capture lists every source-attributed operation and one exact
          structural selection. It does not grant an editable source boundary or supply missing stages.</p>
        <button type="button" aria-expanded={showAuthoringNavigation}
          aria-controls="ordinary-source-navigation-content"
          onClick={() => setShowAuthoringNavigation((open) => !open)}>
          {showAuthoringNavigation ? "Close ordinary source navigation" : "Open ordinary source navigation"}
        </button>
        <div id="ordinary-source-navigation-content">
          {showAuthoringNavigation && <Suspense fallback={<p role="status">Loading retained navigation…</p>}>
            <RecordedAuthoringNavigation />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="recorded-program-tutorial-heading">
        <h2 id="recorded-program-tutorial-heading">Author an instruction program and inspect recorded values</h2>
        <p>Read the bounded Rust source shape, predict independent results, and browse retained
          lane-zero CPU checkpoints. This separate example has no live debugger or GPU connection.</p>
        <button type="button" aria-expanded={showProgramTutorial}
          aria-controls="recorded-program-tutorial-content"
          onClick={() => setShowProgramTutorial((open) => !open)}>
          {showProgramTutorial ? "Close recorded program tutorial" : "Open recorded program tutorial"}
        </button>
        <div id="recorded-program-tutorial-content">
          {showProgramTutorial && <Suspense fallback={<p role="status">Loading recorded program tutorial…</p>}>
            <RecordedProgramGuide />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="recorded-memory-tutorial-heading">
        <h2 id="recorded-memory-tutorial-heading">Compare bytes, initialization, and missing memory</h2>
        <p>Prepare exact retained CPU excerpts, predict changes and inspect them with the local importer.
          Missing memory and incompatible selections remain explicit; no live command is issued.</p>
        <button type="button" aria-expanded={showMemoryTutorial}
          aria-controls="recorded-memory-tutorial-content"
          onClick={() => setShowMemoryTutorial(open => !open)}>
          {showMemoryTutorial ? "Close retained memory reference lab" : "Open retained memory reference lab"}
        </button>
        <div id="recorded-memory-tutorial-content">
          {showMemoryTutorial && <Suspense fallback={<p role="status">Loading retained memory reference lab…</p>}>
            <RecordedMemoryGuide />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="local-resource-import-heading">
        <h2 id="local-resource-import-heading">Inspect your own recorded resource queries</h2>
        <p>Open paired local JSONL excerpts in bounded allocation, access and memory views.
          Caller-supplied files remain unverified; no imported command is executed or uploaded.</p>
        <button type="button" aria-expanded={showResourceImport}
          aria-controls="local-resource-import-content"
          onClick={() => setShowResourceImport((open) => !open)}>
          {showResourceImport ? "Close local resource recording" : "Open local resource recording"}
        </button>
        <div id="local-resource-import-content">
          {showResourceImport && <Suspense fallback={<p role="status">Loading local resource importer…</p>}>
            <LocalRecordedResourceImport />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="recorded-watchpoint-heading">
        <h2 id="recorded-watchpoint-heading">Separate a watchpoint stop from a later memory snapshot</h2>
        <p>Inspect a retained first-write watchpoint observation. An uncaptured stop has no
          observed memory or source location; a later checkpoint is a different selection.
          Local files remain unverified and no imported debugger command is executed.</p>
        <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/recorded-watchpoint-lab-v1.md"
          target="_blank" rel="noreferrer">First-write watchpoint lab and exact retained files</a></p>
        <button type="button" aria-expanded={showWatchpoint}
          aria-controls="recorded-watchpoint-content"
          onClick={() => setShowWatchpoint(open => !open)}>
          {showWatchpoint ? "Close recorded watchpoint" : "Open recorded watchpoint"}
        </button>
        <div id="recorded-watchpoint-content">
          {showWatchpoint && <Suspense fallback={<p role="status">Loading recorded watchpoint viewer…</p>}>
            <LocalRecordedWatchpoint />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="recorded-watch-source-heading">
        <h2 id="recorded-watch-source-heading">Follow source values across a watchpoint replay</h2>
        <p>Keep the uncaptured watch stop, immediate post-write state and later source
          checkpoints distinct. Imported CPU observations do not execute debugger controls
          or establish source-to-SSA, physical-register or dynamic-activation identities.</p>
        <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/resource-watch-source-replay-v2.md"
          target="_blank" rel="noreferrer">Watchpoint and source replay lab with exact retained files</a></p>
        <button type="button" aria-expanded={showWatchSource}
          aria-controls="recorded-watch-source-content"
          onClick={() => setShowWatchSource(open => !open)}>
          {showWatchSource ? "Close recorded watch/source replay" : "Open recorded watch/source replay"}
        </button>
        <div id="recorded-watch-source-content">
          {showWatchSource && <Suspense fallback={<p role="status">Loading recorded watch/source replay…</p>}>
            <LocalRecordedWatchSource />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="recorded-fault-source-heading">
        <h2 id="recorded-fault-source-heading">Inspect an uncaptured fault and its prior checkpoint</h2>
        <p>Keep terminal source, SSA and memory unavailable while exploring separately retained
          earlier source bindings and initialized storage. The standalone simulator diagnostic
          belongs to a separate execution; selecting recorded moments runs no debugger command.</p>
        <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/ordinary-source-fault-replay-v1.md"
          target="_blank" rel="noreferrer">Ordinary-source initializedness and reverse-replay lab</a></p>
        <button type="button" aria-expanded={showFaultSource}
          aria-controls="recorded-fault-source-content"
          onClick={() => setShowFaultSource(open => !open)}>
          {showFaultSource ? "Close recorded fault/source replay" : "Open recorded fault/source replay"}
        </button>
        <div id="recorded-fault-source-content">
          {showFaultSource && <Suspense fallback={<p role="status">Loading recorded fault/source replay…</p>}>
            <LocalRecordedFaultSource />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="live-cpu-heading">
        <h2 id="live-cpu-heading">Connect a separate local CPU debugger</h2>
        <p>This opt-in panel sends real bounded requests only after an explicit connection
          to your separately started loopback bridge. Recorded examples remain local,
          immutable and independent. No GPU or source-edit route is added.</p>
        <button type="button" aria-expanded={showLiveCpu} aria-controls="live-cpu-content"
          onClick={() => setShowLiveCpu(open => !open)}>
          {showLiveCpu ? "Close live CPU debugger" : "Open live CPU debugger"}
        </button>
        <div id="live-cpu-content">
          {showLiveCpu && <Suspense fallback={<p role="status">Loading opt-in CPU debugger…</p>}>
            <LocalLiveCpuDebugger />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="recorded-occurrences-heading">
        <h2 id="recorded-occurrences-heading">Follow repeated operations and helper calls</h2>
        <p>Browse actual retained CPU rows from an ordinary Rust loop. Keep cases, logical
          invocations, activations and operation attempts distinct. These rows do not
          contain checkpoint memory, physical registers or a live debugger connection.</p>
        <p><a href="https://github.com/harsh-nod/fe2o3-kernels/blob/main/docs/recorded-runtime-occurrence-lab-v1.md"
          target="_blank" rel="noreferrer">Loop and helper occurrence lab and exact retained file</a></p>
        <button type="button" aria-expanded={showOccurrences}
          aria-controls="recorded-occurrences-content"
          onClick={() => setShowOccurrences(open => !open)}>
          {showOccurrences ? "Close recorded occurrences" : "Open recorded occurrences"}
        </button>
        <div id="recorded-occurrences-content">
          {showOccurrences && <Suspense fallback={<p role="status">Loading recorded occurrences…</p>}>
            <LocalRecordedOccurrences />
          </Suspense>}
        </div>
      </section>

      <section className="source-isa-agent-truth" aria-labelledby="decoded-att-correlation-heading">
        <header>
          <p className="section-kicker">Decoded ATT correlation</p>
          <h2 id="decoded-att-correlation-heading">Bind an exact HSACO symbol before attributing a PC</h2>
          <p>
            At <code>{decodedAttSourceIsaMilestone.commit.slice(0, 10)}</code>, the read-only
            service accepts already-decoded ATT V1, one exact code-object identity,
            the claimed HSACO bytes, and Characteristic V1. It authenticates the
            load span, metadata, kernel descriptor, and ELF symbol before returning
            an opaque symbol identity, symbol-relative PC, and every exact
            Rust/MIR/KIR/LLVM/ISA interval occurrence present in the archive.
          </p>
        </header>
        <div className="table-scroll">
          <table aria-label="Decoded ATT source correlation boundary">
            <thead><tr><th>Evidence</th><th>State</th><th>Boundary</th></tr></thead>
            <tbody>
              <tr><th>Exact artifact relation</th><td><code>implemented</code></td><td>Artifact digest, load span, metadata, descriptor, ELF symbol, and symbol-relative PC are checked.</td></tr>
              <tr><th>Characteristic lineage</th><td><code>preserved</code></td><td>Only coordinates present in the supplied archive are returned; duplicate and ambiguous occurrences remain distinct.</td></tr>
              <tr><th>Loss and completeness</th><td><code>preserved</code></td><td>Decoded ATT loss, incomplete wave inputs, and raw-decode origin stay attached to every result.</td></tr>
              <tr><th>Live capture / decoder run</th><td><code>not observed</code></td><td>No live ATT capture or decoder execution was performed, and neither input authenticates its producer.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

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
