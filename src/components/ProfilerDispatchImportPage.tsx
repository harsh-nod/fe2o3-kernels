import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  HardDrive,
  LockKeyhole,
  Network,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import {
  profilerImportBundleProjection,
  profilerImportCommands,
  profilerImportDialectPlanes,
  profilerImportDialectProjection,
  profilerImportExecutionImages,
  profilerImportFixtureDirectory,
  profilerImportManifest,
  profilerImportMilestone,
  profilerImportPublicationStages,
  profilerPhysicalDifferentialMilestone,
  profilerImportRequests,
  profilerImportResponses,
  profilerImportSources,
  profilerImportSourceUrl,
  profilerImportTruthRows,
  profilerRuntimeCausalityMilestone,
} from "../content/profiler-dispatch-import";

function exactJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "null";
}

function schematicLabel(value: unknown): string {
  return typeof value === "string" && value.startsWith("schematic:")
    ? value
    : "unavailable";
}

function moveTabFocus(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  count: number,
  select: (next: number) => void,
) {
  let next: number | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    next = (index + 1) % count;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    next = (index - 1 + count) % count;
  } else if (event.key === "Home") {
    next = 0;
  } else if (event.key === "End") {
    next = count - 1;
  }
  if (next === null) return;
  event.preventDefault();
  select(next);
  event.currentTarget.parentElement
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    .item(next)
    .focus();
}

type Binding = {
  process_index: number;
  source_process_id: number;
  opaque_agent_handle: number;
  direct_kfd_node: number;
  family: string;
  wave_width: number;
};

export function ProfilerDispatchImportPage() {
  const [activeDialect, setActiveDialect] = useState(0);
  const [activeQuery, setActiveQuery] = useState(0);
  const selectedDialect = profilerImportDialectPlanes[activeDialect];
  const selectedRequest = profilerImportRequests[activeQuery];
  const selectedResponse = profilerImportResponses[activeQuery];
  const bindings = profilerImportDialectProjection.json_process_local_bindings as Binding[];
  const boundedCheckpointQualified =
    profilerImportMilestone.status === "implemented-qualified-bounded-checkpoint";

  return (
    <article className="lesson-page profiler-import-page">
      <header className="lesson-header profiler-import-header">
        <p className="lesson-breadcrumb">
          Debugger <span>/</span> Profiler import
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>In-process profiler import</h1>
            <p className="lesson-summary">
              Turn strict rocprof dispatch records into a durable, queryable
              evidence chain while keeping execution, compiler, ATT, and
              performance authority explicit.
            </p>
          </div>
          <span className="profiler-import-version">
            <Braces size={16} aria-hidden="true" /> Bundle V4 · receipt V1
          </span>
        </div>
        <div className="profiler-import-boundary">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            <strong>Synthetic import, bounded checkpoint qualified</strong>
            The tutorial records are deterministic schematic projections and
            unexecuted. At the exact bound MI300X checkpoint, focused checks and
            generic-core passed, and a Python target observed sealed target, SDK
            core, and SDK tool mappings with no role leakage. This qualifies only
            the bounded importer/sealed-loader checkpoint, not T3 overall or a
            real GPU-dispatch rocprofv3-to-import roundtrip.
          </span>
        </div>
      </header>

      <section className="profiler-import-authorize" aria-labelledby="profiler-authorize-heading">
        <div>
          <p className="section-kicker">Two-step collection</p>
          <h2 id="profiler-authorize-heading">Dry-run before state changes</h2>
          <p>
            Planning is inert: it resolves, measures, and binds the exact
            interpreter, collector, target, argv, KIR, KFD topology, limits,
            output path, and environment. Collection starts only when the
            caller returns the exact plan identity.
          </p>
        </div>
        <pre><code>{profilerImportCommands.join("\n")}</code></pre>
      </section>

      <section className="profiler-import-dialects" aria-labelledby="profiler-dialects-heading">
        <header>
          <p className="section-kicker">Strict source admission</p>
          <h2 id="profiler-dialects-heading">Three reviewed dialects, no heuristic fallback</h2>
          <p>
            Every size-eligible artifact is parsed before device compatibility
            is considered. Zero or multiple valid projection envelopes fail
            closed; a filename or convenient KFD match cannot break ambiguity.
          </p>
        </header>
        <div className="profiler-import-tabs" role="tablist" aria-label="rocprof source dialect">
          {profilerImportDialectPlanes.map((plane, index) => (
            <button
              aria-controls="profiler-import-dialect-panel"
              aria-selected={activeDialect === index}
              id={`profiler-import-dialect-tab-${plane.id}`}
              key={plane.id}
              onClick={() => setActiveDialect(index)}
              onKeyDown={(event) =>
                moveTabFocus(
                  event,
                  index,
                  profilerImportDialectPlanes.length,
                  setActiveDialect,
                )}
              role="tab"
              tabIndex={activeDialect === index ? 0 : -1}
              type="button"
            >
              {plane.label}
            </button>
          ))}
        </div>
        <div
          aria-labelledby={`profiler-import-dialect-tab-${selectedDialect.id}`}
          className="profiler-import-dialect-panel"
          id="profiler-import-dialect-panel"
          role="tabpanel"
        >
          <div>
            <strong>{selectedDialect.label}</strong>
            <p>{selectedDialect.summary}</p>
          </div>
          <pre><code>{selectedDialect.evidence}</code></pre>
        </div>
      </section>

      <section className="profiler-import-binding" aria-labelledby="profiler-binding-heading">
        <header>
          <p className="section-kicker">Device identity</p>
          <h2 id="profiler-binding-heading">Opaque handles are process-local</h2>
          <p>
            The synthetic fixture repeats handle <code>7001</code>. Its full
            JSON key includes the process index and source PID, then maps by
            exact agent metadata to a direct-KFD node. CSV instead names the
            canonical decimal KFD node directly.
          </p>
        </header>
        <div className="table-scroll">
          <table aria-label="Process-local profiler agent mapping">
            <thead>
              <tr>
                <th>Process</th>
                <th>Source PID</th>
                <th>Opaque handle</th>
                <th>KFD node</th>
                <th>Admitted target</th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((binding) => (
                <tr key={`${binding.process_index}:${binding.source_process_id}`}>
                  <td>{binding.process_index}</td>
                  <td>{binding.source_process_id}</td>
                  <td><code>{binding.opaque_agent_handle}</code></td>
                  <td>{binding.direct_kfd_node}</td>
                  <td>{binding.family} · Wave{binding.wave_width}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="profiler-import-kir">
          <FileCheck2 size={20} aria-hidden="true" />
          <span>
            <strong>Exact KIR V7 admission</strong>
            The importer retains canonical verified module bytes and unions
            module, function, and kernel capabilities. A legacy scalar hash,
            length, or wave-width declaration cannot authorize production import.
          </span>
        </aside>
      </section>

      <section className="profiler-import-sealed" aria-labelledby="profiler-sealed-heading">
        <header>
          <p className="section-kicker">Mutation-resistant launch</p>
          <h2 id="profiler-sealed-heading">Execute content, retain paths as provenance</h2>
          <p>
            The installed-collector adapter and loaded entry images are copied
            into read-only sealed images before launch. Original absolute paths
            are repeatedly checked for provenance, but mutable path bytes are
            not the execution source.
          </p>
        </header>
        <div className="profiler-import-image-strip" aria-label="Collector execution images">
          {profilerImportExecutionImages.map((image) => (
            <div className={image.state} key={image.label}>
              {image.state === "sealed"
                ? <LockKeyhole size={17} aria-hidden="true" />
                : <TriangleAlert size={17} aria-hidden="true" />}
              <strong>{image.label}</strong>
              <span>{image.state}</span>
              <p>{image.detail}</p>
            </div>
          ))}
        </div>
        <div className="profiler-import-observation">
          <CheckCircle2 size={20} aria-hidden="true" />
          <span>
            <strong>MI300X bounded importer checkpoint qualified</strong>
            The installed test observed sealed target, SDK core, and SDK tool
            mappings with no internal role-variable leakage. It did not directly
            observe interpreter, bootstrap, or adapter mappings. {boundedCheckpointQualified
              ? `The bounded checkpoint is qualified at ${profilerImportMilestone.compilerRevision.split(":")[0].slice(0, 10)}; T3 remains open.`
              : "The bounded checkpoint is not qualified."}
          </span>
          <code>{profilerImportMilestone.liveValidation.test}</code>
        </div>
        <details className="profiler-import-qualification">
          <summary>Read the exact bounded qualification results</summary>
          <ul>
            {profilerImportMilestone.qualification.focusedResults.map((result) => (
              <li key={result.command}>
                <code>{result.command}</code>
                <span>{result.result}</span>
              </li>
            ))}
          </ul>
          <p>
            Revision <code>{profilerImportMilestone.compilerRevision}</code>;{" "}
            <code>{profilerImportMilestone.qualification.genericCore.command}</code>
            <strong>{profilerImportMilestone.qualification.genericCore.result}</strong>
            with soft <code>nofile={profilerImportMilestone.qualification.genericCore.softNofile}</code>;
            {" "}{profilerImportMilestone.qualification.genericCore.summaries.join("; ")}.
          </p>
        </details>
      </section>

      <section className="profiler-import-publication" aria-labelledby="profiler-publication-heading">
        <header>
          <p className="section-kicker">Schematic publication relation</p>
          <h2 id="profiler-publication-heading">The manifest is the commit marker</h2>
          <p>
            The labels below explain ordering; they are not content identities or
            compiler-emitted records. In production, Capture is embedded in
            Bundle, not published as a separate file.
            Receipt binds the re-encoded Capture identity. After durable writes
            and rereads, the complete tuple is regenerated and compared before
            one final input revalidation publishes the manifest last.
          </p>
        </header>
        <div className="profiler-import-chain" aria-label="Profiler publication order">
          {profilerImportPublicationStages.map((stage, index) => (
            <div key={stage.label}>
              {index === 0 ? <Database size={18} aria-hidden="true" /> : null}
              {index === 1 ? <Network size={18} aria-hidden="true" /> : null}
              {index === 2 ? <HardDrive size={18} aria-hidden="true" /> : null}
              {index === 3 ? <Fingerprint size={18} aria-hidden="true" /> : null}
              {index === 4 ? <FileCheck2 size={18} aria-hidden="true" /> : null}
              {index === 5 ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
              <small>{index + 1}</small>
              <strong>{stage.label}</strong>
              <code>{stage.identity}</code>
              <p>{stage.detail}</p>
            </div>
          ))}
        </div>
        <details className="profiler-import-manifest">
          <summary>Read the manifest-last tutorial projection</summary>
          <pre><code>{profilerImportManifest}</code></pre>
        </details>
      </section>

      <section className="profiler-import-agent" aria-labelledby="profiler-agent-heading">
        <header>
          <div>
            <p className="section-kicker">Illustrative query exercise</p>
            <h2 id="profiler-agent-heading">Explore typed absence without a service claim</h2>
            <p>
              These deterministic non-wire, non-authoritative examples show how an agent could
              explain a mapping or publication step. They are not a production
              protocol or service endpoint, and do not claim any operation is
              available. Missing ATT, execution, or performance evidence remains
              typed absence, never an inferred zero.
            </p>
          </div>
          <Bot size={24} aria-hidden="true" />
        </header>
        <div
          aria-label="Illustrative profiler query exercise"
          className="profiler-import-query-tabs"
          role="tablist"
        >
          {profilerImportRequests.map((request, index) => (
            <button
              aria-controls="profiler-import-query-panel"
              aria-selected={activeQuery === index}
              id={`profiler-import-query-tab-${index}`}
              key={String(request.request_id)}
              onClick={() => setActiveQuery(index)}
              onKeyDown={(event) =>
                moveTabFocus(
                  event,
                  index,
                  profilerImportRequests.length,
                  setActiveQuery,
                )}
              role="tab"
              tabIndex={activeQuery === index ? 0 : -1}
              type="button"
            >
              {String(request.operation).replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <div
          aria-labelledby={`profiler-import-query-tab-${activeQuery}`}
          className="profiler-import-query-panel"
          id="profiler-import-query-panel"
          role="tabpanel"
        >
          <div>
            <span>Request</span>
            <pre><code>{exactJson(selectedRequest)}</code></pre>
          </div>
          <div>
            <span>Response · {String(selectedResponse.status)}</span>
            <pre><code>{exactJson(selectedResponse)}</code></pre>
          </div>
        </div>
      </section>

      <section className="profiler-import-truth" aria-labelledby="profiler-truth-heading">
        <header>
          <p className="section-kicker">Typed truth and nonclaims</p>
          <h2 id="profiler-truth-heading">Identity is not authority</h2>
        </header>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Profiler import truth and nonclaims</caption>
            <thead><tr><th>Surface</th><th>State</th><th>Exact boundary</th></tr></thead>
            <tbody>
              {profilerImportTruthRows.map(([surface, state, boundary]) => (
                <tr key={surface}><th>{surface}</th><td><code>{state}</code></td><td>{boundary}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="profiler-import-nonclaims">
          Schematic Bundle label {schematicLabel(profilerImportBundleProjection.bundle_identity)} grants no
          compiler, runtime, artifact, source-map, kernel-symbol, source/ISA,
          ATT, performance, or GPU-execution authority, and carries no producer
          attestation.
        </p>
      </section>

      <section className="profiler-import-truth" aria-labelledby="profiler-kfd-evidence-heading">
        <header>
          <p className="section-kicker">Direct-KFD evidence joins</p>
          <h2 id="profiler-kfd-evidence-heading">Separate executable bridges from missing observations</h2>
          <p>
            Package isolation began at <code>{profilerPhysicalDifferentialMilestone.packageIsolationCommit.slice(0, 10)}</code>.
            The protected bridge at <code>{profilerPhysicalDifferentialMilestone.commit.slice(0, 10)}</code> accepts only an
            already-authenticated generated Worker V3 invocation and consumes it once.
          </p>
        </header>
        <div className="table-scroll">
          <table aria-label="Direct-KFD differential and causality status">
            <thead><tr><th>Surface</th><th>State</th><th>Exact boundary</th></tr></thead>
            <tbody>
              <tr><th>Physical differential</th><td><code>0 hardware / 0 parity</code></td><td>The V2 qualification lists {profilerPhysicalDifferentialMilestone.prerequisiteCount} protected prerequisites. Backend, trust, rollback, and refinement producers remain unprovisioned.</td></tr>
              <tr><th>Evidence minting</th><td><code>fail closed</code></td><td>Synthetic, stale, runtime-failed, or ambiguous completion cannot mint a hardware observation or physical comparison report.</td></tr>
              <tr><th>Runtime lifecycle</th><td><code>capture-local</code></td><td>At {profilerRuntimeCausalityMilestone.commit.slice(0, 10)}, exact event identities support only schema-required local lifecycle edges.</td></tr>
              <tr><th>Dispatch / clock join</th><td><code>unavailable</code></td><td>Direct-KFD/rocprof dispatch identity, clock correlation, device-copy producers, and dependency producers are absent.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="profiler-import-evidence" aria-labelledby="profiler-evidence-heading">
        <header>
          <p className="section-kicker">Auditable boundary</p>
          <h2 id="profiler-evidence-heading">Evidence and owning code</h2>
          <p>
            Deterministic schematic projections live in <code>{profilerImportFixtureDirectory}</code>.
            They are not compiler-emitted evidence. Compiler links bind the exact
            commit-and-tree revision in the milestone config. Focused checks and
            generic-core qualify only the bounded importer/sealed-loader checkpoint;
            the protected 3x2 source/ISA matrix is unrun, T3 remains open, and T5
            remains blocked on the issue #182 typed producer.
          </p>
        </header>
        <div>
          {profilerImportSources.map((source) => {
            const url = profilerImportSourceUrl(source.path);
            return url ? (
              <a href={url} key={source.path} rel="noreferrer" target="_blank">
                <span>{source.label}</span><code>{source.path}</code>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : (
              <div className="profiler-import-source-pending" key={source.path}>
                <span>{source.label}</span><code>{source.path}</code>
                <LockKeyhole size={14} aria-hidden="true" />
              </div>
            );
          })}
        </div>
        <a className="profiler-import-live-link" href="#/debugger/live-kfd">
          Return to the composite GPU debugger workbench
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </section>
    </article>
  );
}
