import { ArrowRight, ExternalLink, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import {
  gpuCapabilitiesPage,
  type CapabilityAvailability,
} from "../content/gpu-capabilities";
import { HighlightedCode } from "./HighlightedCode";
import "./GpuCapabilitiesPage.css";

const compilerSourceRoot = "https://github.com/harsh-nod/fe2o3/blob/main/";

const availabilityLabels: Record<CapabilityAvailability, string> = {
  "implemented-contract": "Implemented interface",
  "component-only": "Component evidence",
  unavailable: "Not qualified",
};

const manifestLabels: Record<string, string> = {
  closure: "Capability closure",
  productionPath: "Production path",
  proof: "Proof requirements",
  neutralTarget: "Neutral target",
  backendTarget: "gfx942 target",
  simulator: "Simulator",
  hardware: "Hardware command",
  negatives: "Negative fixtures",
};

export function GpuCapabilitiesPage() {
  const page = gpuCapabilitiesPage;
  const example = page.workedExample;

  return (
    <article className="reference-page gpu-capabilities-page">
      <header className="reference-header gpu-capabilities-header">
        <p className="lesson-breadcrumb">Reference / Issue #{page.issue}</p>
        <h1>GPU authority expressed as ordinary Rust</h1>
        <p>{page.summary}</p>
        <p className="gpu-capabilities-boundary">
          <strong>Publication boundary:</strong> {page.status.boundary}
        </p>
      </header>

      <nav className="gpu-capabilities-toc" aria-label="GPU capabilities topics">
        <Link to="/gpu-capabilities#pipeline">Pipeline</Link>
        <Link to="/gpu-capabilities#gemm">Tiled GEMM</Link>
        <Link to="/gpu-capabilities#kir">KIR V13</Link>
        <Link to="/gpu-capabilities#w4">Exact W4</Link>
        <Link to="/gpu-capabilities#evidence">Checked vs Proven</Link>
        <Link to="/gpu-capabilities#target">Target and machine</Link>
        <Link to="/gpu-capabilities#launch">Safe launch</Link>
        <Link to="/gpu-capabilities#migration">Manifest state</Link>
      </nav>

      <section id="pipeline">
        <p className="section-kicker">One production route</p>
        <h2>Authority stays attached to its exact subject</h2>
        <p>
          The author writes a typed Rust kernel. The compiler owns every transition
          from source identity to executable bytes; no workload selector, fallback,
          caller-built digest, or mutable verified flag can skip a stage.
        </p>
        <dl className="gpu-capabilities-status" aria-label="Issue 272 status">
          <div>
            <dt>Contract</dt>
            <dd>{page.status.contract}</dd>
          </div>
          <div>
            <dt>Milestone</dt>
            <dd>{page.status.milestone}</dd>
          </div>
          <div>
            <dt>Published corpus</dt>
            <dd>{page.status.corpus}</dd>
          </div>
        </dl>

        <ol className="gpu-capabilities-pipeline" aria-label="GPU capability production pipeline">
          {page.pipeline.map((stage, index) => (
            <li key={stage.id}>
              <span className="gpu-capabilities-stage-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <header>
                  <h3>{stage.label}</h3>
                  <span className={`gpu-capabilities-state ${stage.disposition}`}>
                    {availabilityLabels[stage.disposition]}
                  </span>
                </header>
                <p>{stage.current}</p>
                <p className="gpu-capabilities-gate">
                  <strong>Required join</strong> {stage.gate}
                </p>
                <small>{stage.owner}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="gemm">
        <p className="section-kicker">Worked advanced tutorial</p>
        <h2>{example.title}</h2>
        <p>{example.summary}</p>
        <p className="gpu-capabilities-equation"><code>{example.equation}</code></p>
        <div className="gpu-capabilities-actions">
          <Link to={`/lesson/${example.lessonId}`}>
            Open tiled GEMM lesson <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <Link to={`/operators#${example.operatorId}`}>
            Open GEMM operator contract <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="gpu-capabilities-runs" aria-label="Tiled GEMM run contracts">
          {example.runContracts.map((run) => (
            <section key={run.label}>
              <h3>{run.label}</h3>
              <p className="gpu-capabilities-command">
                <Terminal size={14} aria-hidden="true" />
                <code>{run.command}</code>
              </p>
              <p>{run.boundary}</p>
            </section>
          ))}
        </div>

        <div className="gpu-capabilities-code">
          <header>
            <h3>Ordinary Rust kernel shape</h3>
            <span>Exact checked-in runnable legacy-path source</span>
          </header>
          <pre tabIndex={0} aria-label="Tiled GEMM ordinary Rust excerpt">
            <HighlightedCode code={example.sourceExcerpt} language="rust" />
          </pre>
          <p>{example.sourceNote}</p>
        </div>

        <div className="gpu-capabilities-type-list">
          <h3>What the source roles mean</h3>
          <dl>
            {example.typeFacts.map((fact) => (
              <div key={fact.capability}>
                <dt><code>{fact.capability}</code></dt>
                <dd>{fact.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="kir">
        <p className="section-kicker">Canonical compiler subject</p>
        <h2>KIR V13 makes execution capabilities explicit</h2>
        <p>
          KIR V13 is not a textual echo of Rust. It is a bounded canonical graph
          whose typed SSA values retain provenance, role, workgroup brand, epoch,
          memory access, and target requirements.
        </p>
        <div className="gpu-capabilities-code">
          <header>
            <h3>V13 operation vocabulary</h3>
            <span>Exact enum names, illustrative order</span>
          </header>
          <pre tabIndex={0} aria-label="Canonical KIR V13 capability operations">
            <HighlightedCode code={example.kirExcerpt} language="rust" />
          </pre>
          <p>{example.kirNote}</p>
        </div>
        <div className="gpu-capabilities-ledger">
          <h3>What identifies the exact final graph</h3>
          <ol>
            {example.identityFacts.map((fact, index) => (
              <li key={fact}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <p>{fact}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="w4">
        <p className="section-kicker">Final-graph reasoning</p>
        <h2>The exact W4 schedule has 19 obligations</h2>
        <p>
          The order below is immutable production policy. Each checker rereads the
          live final graph and binds its evidence to the V13 digest, graph epoch,
          PLIRON structural identity, target, launch, and checker identity. A graph
          mutation invalidates affected evidence instead of inheriting a result by name.
        </p>
        <div
          className="gpu-capabilities-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Exact W4 obligation schedule"
        >
          <table className="gpu-capabilities-table gpu-capabilities-w4-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Obligation</th>
                <th scope="col">Question</th>
                <th scope="col">Tiled GEMM application</th>
              </tr>
            </thead>
            <tbody>
              {page.obligations.map((obligation, index) => (
                <tr key={obligation.name}>
                  <td><code>{String(index + 1).padStart(2, "0")}</code></td>
                  <th scope="row"><code>{obligation.name}</code></th>
                  <td>{obligation.question}</td>
                  <td>{obligation.gemmApplication}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="evidence">
        <p className="section-kicker">Evidence is not an assurance ladder</p>
        <h2>Clean, Checked, and Proven are different claims</h2>
        <p>
          fe2o3 deliberately has no rule that upgrades one word into another. The
          protected composition checks whether a property permits a particular
          evidence class and rejects substitutions, missing evidence, and stale subjects.
        </p>
        <div className="gpu-capabilities-assurance">
          {page.assurance.map((layer) => (
            <section key={layer.term}>
              <div>
                <h3>{layer.term}</h3>
                <small>{layer.producer}</small>
              </div>
              <dl>
                <div>
                  <dt>Establishes</dt>
                  <dd>{layer.establishes}</dd>
                </div>
                <div>
                  <dt>Does not establish</dt>
                  <dd>{layer.doesNotEstablish}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      </section>

      <section id="target">
        <p className="section-kicker">Backend boundary</p>
        <h2>Target lowering is not machine refinement</h2>
        <ol className="gpu-capabilities-ledger gpu-capabilities-target-flow">
          {page.targetFlow.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <div className="gpu-capabilities-requirements">
          <h3>Tiled GEMM target requirements from the manifest</h3>
          <ul aria-label="Tiled GEMM target requirements">
            {example.requirements.map((requirement) => (
              <li key={requirement}><code>{requirement}</code></li>
            ))}
          </ul>
        </div>
        <p className="gpu-capabilities-boundary">
          <strong>Boundary:</strong> lowering shows what LLVM and LLD emitted for
          an admitted graph. Machine refinement checks a bounded relation between
          frozen target KIR and decoded instructions. Simulation and a GPU run then
          provide observations for exact inputs; neither repairs a missing refinement.
        </p>
      </section>

      <section id="launch">
        <p className="section-kicker">Safe host launch</p>
        <h2>The host supplies facts compilation cannot know</h2>
        <ol className="gpu-capabilities-launch">
          {page.safeLaunch.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <p className="gpu-capabilities-boundary">
          <strong>Unavailable for this fixture today:</strong> the complete V13
          capability launch chain is not published. The runnable legacy gfx942
          command remains useful hardware evidence for its own path only.
        </p>
      </section>

      <section id="migration">
        <p className="section-kicker">Machine-readable publication state</p>
        <h2>The manifest, not this prose, decides qualification</h2>
        <p>
          This page reads the checked-in manifest directly. At the {page.reviewedOn}
          review, it records {page.manifest.lessons} lessons and {page.manifest.fixtures}
          compiler fixtures at baseline <code>{page.manifest.compilerCommit.slice(0, 12)}</code>.
        </p>
        <dl className="gpu-capabilities-status gpu-capabilities-manifest-summary" aria-label="Capability manifest summary">
          <div>
            <dt>Baseline</dt>
            <dd>{page.manifest.baselineStatus}</dd>
          </div>
          <div>
            <dt>Complete closures</dt>
            <dd>{page.manifest.completeClosures} / {page.manifest.fixtures}</dd>
          </div>
          <div>
            <dt>Canonical paths</dt>
            <dd>{page.manifest.canonicalPaths} / {page.manifest.fixtures}</dd>
          </div>
          <div>
            <dt>Legacy simulator</dt>
            <dd>{page.manifest.legacySimulator} / {page.manifest.fixtures}</dd>
          </div>
          <div>
            <dt>Legacy hardware</dt>
            <dd>{page.manifest.legacyHardware} / {page.manifest.fixtures}</dd>
          </div>
        </dl>

        <div className="gpu-capabilities-example-state">
          <h3><code>{example.fixtureId}</code></h3>
          <dl>
            {Object.entries(example.manifestState).map(([key, value]) => (
              <div key={key}>
                <dt>{manifestLabels[key] ?? key}</dt>
                <dd><code>{value}</code></dd>
              </div>
            ))}
          </dl>
        </div>

        <h3 className="gpu-capabilities-gaps-heading">Unsupported and incomplete boundaries</h3>
        <ul className="gpu-capabilities-unavailable">
          {page.unavailableJoins.map((join) => <li key={join}>{join}</li>)}
        </ul>
        <div className="gpu-capabilities-sources" aria-label="Worked example sources">
          {example.sourcePaths.map((path) => (
            <a
              href={`${compilerSourceRoot}${path}`}
              key={path}
              target="_blank"
              rel="noreferrer"
            >
              <code>{path}</code>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
        <div className="gpu-capabilities-actions">
          {page.links.map((link) => (
            <a href={link.href} key={link.href} target="_blank" rel="noreferrer">
              {link.label} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
