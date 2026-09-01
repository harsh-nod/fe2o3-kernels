import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileCode2,
  Gauge,
  MemoryStick,
  ShieldAlert,
  Terminal,
  Workflow,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  gettingStartedBoundaries,
  gettingStartedBinding,
  gettingStartedCommands,
  gettingStartedDifferentiators,
  gettingStartedFixture,
  gettingStartedHierarchy,
  gettingStartedResult,
  gettingStartedTimeline,
} from "../content/getting-started";

const resultRows = [
  ["schema", gettingStartedResult.schema],
  ["status", gettingStartedResult.status],
  ["authority", gettingStartedResult.authority],
  ["simulated", String(gettingStartedResult.simulated)],
  ["hardware_observed", String(gettingStartedResult.hardware_observed)],
  ["hardware_validation", String(gettingStartedResult.hardware_validation)],
  ["performance_prediction", String(gettingStartedResult.performance_prediction)],
] as const;

const liveWorkItems = Array.from(
  { length: gettingStartedResult.liveInvocations },
  (_, index) => index,
);

const doctorOutput = `# KFD-first diagnostic from this checkout
${gettingStartedCommands.doctor}

# Schematic output shape; host-specific states are alternatives
fe2o3 doctor v1
runtime: direct-kfd
platform: ready linux-x86_64 | unavailable requires-linux-x86_64
kfd-interface: admitted | unavailable <reason>
kfd-topology: observed <devices> | unavailable <reason>
direct-kfd-preflight: ready | unavailable
compiler-tools: present-unvalidated <paths> | unavailable <reason>
debugger-rocgdb: optional-present-unvalidated <path> | optional-unavailable
profiler-rocprofv3: optional-present-unvalidated <path> | optional-unavailable
runtime-libraries: HIP/HSA not-required-or-loaded
cpu-source-check: available; cpu-simulation: available; source-export: extraction-only
application-execution: unavailable worker-v3-application-route-unwired
overall: diagnostics-complete`;

export function GettingStartedPage() {
  return (
    <article className="lesson-page getting-started-page">
      <header className="lesson-header getting-started-header">
        <p className="lesson-breadcrumb">
          Developer preview <span>/</span> Getting started
        </p>
        <div className="lesson-title-row">
          <div>
            <h1>Run a Rust kernel without a GPU</h1>
            <p className="lesson-summary">
              Export an ordinary <code>#[kernel]</code> function through the
              production source, MIR, and KIR path, execute its temporary bundle
              on the CPU, then read the retained validation projection at
              work-item, logical-wave, and workgroup scope.
            </p>
          </div>
          <span className="getting-started-version">
            <Braces size={16} aria-hidden="true" /> Source to KIR V7
          </span>
        </div>
        <div className="getting-started-contract">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            <strong>Semantic observation, not hardware evidence</strong>
            This path is useful for correctness diagnosis and deterministic
            replay. It does not load a GPU, validate GPU equivalence, or predict
            performance.
          </span>
        </div>
      </header>

      <section className="getting-started-run" aria-labelledby="getting-started-run-heading">
        <div>
          <p className="section-kicker">First execution</p>
          <h2 id="getting-started-run-heading">One command from a clean checkout</h2>
          <p>
            The script builds the pinned workspace tools, exports
            <code> examples/fill</code>, runs the resulting bundle, and removes
            its private temporary directory on success or failure. Every Cargo
            child explicitly disables the legacy HIP and HSA runtime features.
          </p>
          <div className="getting-started-requirements" aria-label="Quick start requirements">
            <span><CheckCircle2 size={15} aria-hidden="true" /> Linux x86-64</span>
            <span><CheckCircle2 size={15} aria-hidden="true" /> Git + rustup</span>
            <span><CheckCircle2 size={15} aria-hidden="true" /> Bash + GNU realpath</span>
            <span><CheckCircle2 size={15} aria-hidden="true" /> Rust compiler workspace build space</span>
            <span><XCircle size={15} aria-hidden="true" /> GPU not required</span>
          </div>
        </div>
        <div className="getting-started-terminal" aria-label="No-GPU quick start commands">
          <span><Terminal size={14} aria-hidden="true" /> Terminal</span>
          <pre><code>{`${gettingStartedCommands.clone.join("\n")}\n${gettingStartedCommands.noGpu}`}</code></pre>
        </div>
      </section>

      <section className="getting-started-result" aria-labelledby="getting-started-result-heading">
        <header>
          <p className="section-kicker">Validation projection</p>
          <h2 id="getting-started-result-heading">Typed result, explicit authority</h2>
          <p>
            The retained validation fixture states what a successful run must
            return; it is not an execution capture. The four copied-back
            <code> f32</code> elements contain little-endian bytes
            <code> {gettingStartedResult.littleEndianBytes}</code>, or
            <code> {gettingStartedResult.value}</code> each.
          </p>
        </header>
        <dl className="getting-started-result-grid" aria-label="Typed simulation result">
          {resultRows.map(([label, value]) => (
            <div className={value === "false" ? "boundary" : "observed"} key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="getting-started-debug" aria-labelledby="getting-started-debug-heading">
        <header>
          <p className="section-kicker">Semantic debugger</p>
          <h2 id="getting-started-debug-heading">See the same event at every execution level</h2>
          <p>
            fe2o3 keeps compiler meaning attached to execution. Selectors are
            logical simulator identities: they do not claim physical GPU waves,
            registers, or scheduler placement. This diagram is the fixture's
            expected semantic projection, not a screenshot of a live session.
          </p>
        </header>

        <div className="getting-started-debugger" aria-label="Debugger hierarchy and semantic state">
          <div className="getting-started-hierarchy">
            {gettingStartedHierarchy.map((item, index) => (
              <div key={item.level}>
                <span>{index + 1}</span>
                <div>
                  <small>{item.level}</small>
                  <strong>{item.identity}</strong>
                  <p>{item.detail}</p>
                </div>
                <em>{item.state}</em>
              </div>
            ))}
            <div className="getting-started-work-items">
              <span>4</span>
              <div>
                <small>Work-items / scheduled slots</small>
                <strong>
                  0..{gettingStartedResult.liveInvocations - 1} live;{" "}
                  {gettingStartedResult.liveInvocations}..{gettingStartedResult.scheduledSlots - 1} masked
                </strong>
                <div className="getting-started-lanes" aria-label="Work-item activity">
                  {liveWorkItems.map((lane) => (
                    <b className="active" key={lane} title={`Work-item ${lane}: stores ${gettingStartedResult.value}`}>
                      {lane}
                    </b>
                  ))}
                  <b
                    className="inactive"
                    title={`Scheduled slots ${gettingStartedResult.liveInvocations} through ${gettingStartedResult.scheduledSlots - 1}: outside the grid and not invoked`}
                  >
                    {gettingStartedResult.liveInvocations}..{gettingStartedResult.scheduledSlots - 1}
                  </b>
                </div>
              </div>
              <em>grid masked</em>
            </div>
          </div>

          <div className="getting-started-inspector">
            <div className="getting-started-inspector-title">
              <Workflow size={17} aria-hidden="true" />
              <span>
                <small>Selected work-item</small>
                <strong>item {gettingStartedFixture.debugger_projection.selected_work_item[0]}</strong>
              </span>
            </div>
            <ol>
              {gettingStartedTimeline.map((event) => (
                <li key={event.operation}>
                  <FileCode2 size={15} aria-hidden="true" />
                  <span><code>{event.operation}</code><small>{event.source}</small></span>
                  <em>{event.state}</em>
                </li>
              ))}
            </ol>
            <div className="getting-started-memory">
              <MemoryStick size={16} aria-hidden="true" />
              <span>
                <small>Allocation-relative memory</small>
                <strong>out + {gettingStartedFixture.debugger_projection.selected_memory.offset}</strong>
              </span>
              <code>{gettingStartedFixture.debugger_projection.selected_memory.bytes.slice(2)}</code>
            </div>
          </div>
        </div>

        <div className="getting-started-debug-links">
          <Link to="/lesson/cpu-semantic-simulation">
            Open the interactive simulator debugger <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <a
            href="https://github.com/harsh-nod/fe2o3/blob/main/crates/fe2o3-debug-cli/README.md"
            rel="noreferrer"
            target="_blank"
          >
            Debugger protocol reference <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="getting-started-difference" aria-labelledby="getting-started-difference-heading">
        <header>
          <p className="section-kicker">Why this debugger is different</p>
          <h2 id="getting-started-difference-heading">Language semantics remain queryable</h2>
          <p>
            The differentiator is not a replacement for ROCgdb or rocprof. It is
            the ability to carry fe2o3 source and KIR semantics into deterministic
            replay and agent-facing queries, while those platform tools retain
            authority over live machine state and performance evidence.
          </p>
        </header>
        <div className="table-scroll">
          <table aria-label="Semantic debugger differentiators">
            <thead>
              <tr><th>Surface</th><th>fe2o3 semantic debugger</th><th>Platform debugger / profiler</th></tr>
            </thead>
            <tbody>
              {gettingStartedDifferentiators.map((row) => (
                <tr key={row.surface}>
                  <th>{row.surface}</th><td>{row.fe2o3}</td><td>{row.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="getting-started-doctor" aria-labelledby="getting-started-doctor-heading">
        <div>
          <p className="section-kicker">Optional GPU diagnostics</p>
          <h2 id="getting-started-doctor-heading">Inspect KFD before attempting hardware work</h2>
          <p>
            Use <code>{gettingStartedCommands.doctor}</code> so the same wrapper
            sets <code> FE2O3_HIP_SYS_DISABLE={gettingStartedBinding.cargoChildEnvironment.FE2O3_HIP_SYS_DISABLE}</code>
            and <code> FE2O3_HSA_RUNTIME_DISABLE={gettingStartedBinding.cargoChildEnvironment.FE2O3_HSA_RUNTIME_DISABLE}</code>
            for its Cargo child. The report starts with the direct-KFD interface
            and topology. ROCgdb and rocprofv3 remain optional tools; HIP and HSA
            runtime libraries are not linked or loaded. The console block is a
            schematic output shape; actual availability states are host-specific.
          </p>
        </div>
        <pre><code>{doctorOutput}</code></pre>
      </section>

      <section className="getting-started-gpu-boundary" aria-labelledby="getting-started-gpu-heading">
        <div>
          <Gauge size={20} aria-hidden="true" />
          <span>
            <p className="section-kicker">Fail-closed gfx942 preflight</p>
            <h2 id="getting-started-gpu-heading">A diagnostic, not a GPU quick start</h2>
          </span>
        </div>
        <p>
          On a gfx942 machine, <code>{gettingStartedCommands.gfx942Preflight}</code>
          first requires an admitted direct-KFD device and Wave64 topology. It
          then intentionally exits nonzero because the production Worker V3
          application route is not wired. A detected GPU must not be mistaken
          for a supported source-to-GPU application path.
        </p>
        <div className="getting-started-boundaries" aria-label="No-GPU workflow non-claims">
          {gettingStartedBoundaries.map((boundary) => (
            <span key={boundary}><XCircle size={15} aria-hidden="true" /> {boundary}</span>
          ))}
        </div>
      </section>

      <footer className="getting-started-next">
        <Cpu size={19} aria-hidden="true" />
        <p>
          Continue with the full simulator lesson for schedule exploration,
          reverse replay, source variables, memory conflicts, logical Wave32 and
          Wave64 views, and versioned agent JSONL requests.
        </p>
        <Link to="/lesson/cpu-semantic-simulation">
          Continue <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
