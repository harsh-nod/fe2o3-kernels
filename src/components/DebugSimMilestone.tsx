import {
  Activity,
  Braces,
  Crosshair,
  Cpu,
  Fingerprint,
  Gauge,
  GitCommitHorizontal,
  MapPinned,
  Network,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import {
  debugSimCounterFixture,
  debugSimExplorationFixtures,
  debugSimPcSampleFixture,
  debugSimSourceVariableFixture,
  debugSimWaveFixtures,
  debugSimWorkgroupReductionFixture,
  debugSimWorkgroupScanFixture,
  type ExplorationEvidenceId,
  type LogicalWaveWidth,
} from "../content/debug-sim-milestone";

type JsonObject = Record<string, unknown>;
type PcEvidenceMode = "open" | "samples" | "hotspots";

function record(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function field(value: unknown, key: string): unknown {
  return record(value) ? value[key] : undefined;
}

function stringField(value: unknown, key: string): string {
  const candidate = field(value, key);
  return typeof candidate === "string" ? candidate : "unavailable";
}

function numberField(value: unknown, key: string): number {
  const candidate = field(value, key);
  return typeof candidate === "number" ? candidate : 0;
}

function shortIdentity(identity: unknown): string {
  return typeof identity === "string" && identity.length > 18
    ? `${identity.slice(0, 10)}…${identity.slice(-8)}`
    : String(identity);
}

function localCoordinate(value: unknown): string {
  const coordinate = field(value, "local");
  return Array.isArray(coordinate) ? `[${coordinate.join(", ")}]` : "unavailable";
}

function TruthCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="semantic-evidence-truth-cell">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function SourceVariablePanel() {
  const fixture = debugSimSourceVariableFixture;
  return (
    <div className="semantic-source-body">
      <div className="semantic-source-lineage">
        <span>
          <GitCommitHorizontal size={15} aria-hidden="true" /> compiler commit
          <a
            href={`https://github.com/harsh-nod/fe2o3/commit/${fixture.compiler.commit}`}
            rel="noreferrer"
            target="_blank"
            title={fixture.compiler.commit}
          >
            <code>{shortIdentity(fixture.compiler.commit)}</code>
          </a>
        </span>
        <span>
          tree
          <code title={fixture.compiler.tree}>{shortIdentity(fixture.compiler.tree)}</code>
        </span>
        <span>
          bundle subject
          <code title={fixture.bundleSubject}>{shortIdentity(fixture.bundleSubject)}</code>
        </span>
        <span>
          canonical KIR
          <code title={fixture.canonicalKir}>{shortIdentity(fixture.canonicalKir)}</code>
        </span>
      </div>

      <div className="semantic-source-variables" role="table" aria-label="Source Map V2 variables">
        <div role="row">
          <span role="columnheader">source variable</span>
          <span role="columnheader">scope / generation</span>
          <span role="columnheader">map fallback</span>
          <span role="columnheader">debugger value</span>
          <span role="columnheader">origin</span>
        </div>
        {fixture.variables.map((variable) => (
          <div key={variable.identity} role="row">
            <strong role="cell" title={variable.identity}>{variable.name}</strong>
            <code role="cell">depth {variable.scopeDepth} / gen {variable.generation}</code>
            <span role="cell">{variable.fallback.replaceAll("_", " ")}</span>
            <code role="cell">{variable.displayValue}</code>
            <span className={`semantic-source-status ${variable.status}`} role="cell">
              {variable.provenance?.replaceAll("_", " ") ?? variable.reason?.replaceAll("_", " ")}
            </span>
          </div>
        ))}
      </div>

      <p className="semantic-boundary-note">
        <ShieldAlert size={15} aria-hidden="true" />
        <span>
          V2 binds only exact unchanged KIR parameters. Moved, mutated, projected, aliased,
          storage-reset, local, and composite values remain typed <code>not_represented</code>;
          pointer values are allocation-relative, never native addresses. Bundle-bound source is
          not protected compiler authentication.
        </span>
      </p>

      <div className="semantic-source-raw">
        <details className="semantic-raw-evidence">
          <summary>
            <Braces size={15} aria-hidden="true" /> Exact production exporter receipt
          </summary>
          <pre data-testid="source-export-receipt-v2">{fixture.raw.exportReceipt}</pre>
        </details>
        <details className="semantic-raw-evidence">
          <summary>
            <Braces size={15} aria-hidden="true" /> Exact compiler-produced Source Map V2
          </summary>
          <pre data-testid="source-map-v2-json">{fixture.raw.map}</pre>
        </details>
        <details className="semantic-raw-evidence">
          <summary>
            <Braces size={15} aria-hidden="true" /> Exact source-variable query JSONL
          </summary>
          <pre data-testid="source-variables-v2-jsonl">{fixture.raw.response}</pre>
        </details>
      </div>
    </div>
  );
}

function WorkgroupReductionPanel() {
  const fixture = debugSimWorkgroupReductionFixture;
  return (
    <div className="semantic-reduction-body">
      <div className="semantic-source-lineage">
        <span>
          <GitCommitHorizontal size={15} aria-hidden="true" /> reduction compiler
          <a
            href={`https://github.com/harsh-nod/fe2o3/commit/${fixture.compiler.commit}`}
            rel="noreferrer"
            target="_blank"
            title={fixture.compiler.commit}
          >
            <code>{shortIdentity(fixture.compiler.commit)}</code>
          </a>
        </span>
        <span>
          multi-root custody
          <a
            href={`https://github.com/harsh-nod/fe2o3/commit/${fixture.correspondence.commit}`}
            rel="noreferrer"
            target="_blank"
            title={fixture.correspondence.commit}
          >
            <code>{shortIdentity(fixture.correspondence.commit)}</code>
          </a>
        </span>
        <span>
          exact executable body
          <code>Bundle V5 / KIR V10</code>
        </span>
        <span>
          persisted custody
          <code>{fixture.compiler.scheduleArtifact}</code>
        </span>
      </div>

      <div className="semantic-evidence-metrics" aria-label="Workgroup reduction contract">
        <TruthCell label="logical lanes" value={String(fixture.outputLanes)} />
        <TruthCell
          label="workgroup"
          value={`[${fixture.compiler.workgroup.join(", ")}]`}
        />
        <TruthCell
          label="static LDS"
          value={`${fixture.compiler.staticSharedMemoryBytes} bytes`}
        />
        <TruthCell label="barriers" value={String(fixture.compiler.workgroupBarriers)} />
        <TruthCell label="runtime adapter" value={fixture.compiler.runtimeBackend} />
      </div>

      <div className="semantic-reduction-grid">
        <section aria-labelledby="semantic-reduction-results-heading">
          <p className="debug-label">Exact output bytes</p>
          <h4 id="semantic-reduction-results-heading">Every lane receives the workgroup sum</h4>
          <div
            className="semantic-reduction-results"
            role="table"
            aria-label="Portable workgroup reduction results"
          >
            <div role="row">
              <span role="columnheader">type</span>
              <span role="columnheader">lane input</span>
              <span role="columnheader">64-lane result</span>
              <span role="columnheader">exact bits</span>
            </div>
            {fixture.cases.map((testCase) => (
              <div key={testCase.scalar} role="row">
                <strong role="cell">{testCase.scalar}</strong>
                <code role="cell">{testCase.input}</code>
                <code role="cell">{testCase.expected}</code>
                <code role="cell">{testCase.exactBits}</code>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="semantic-reduction-query-heading">
          <p className="debug-label">Agent-native JSONL</p>
          <h4 id="semantic-reduction-query-heading">Ask for hierarchy and events, not logs</h4>
          <pre aria-label="Workgroup reduction debugger queries">
            {fixture.queriesRaw}
          </pre>
        </section>
      </div>

      <div className="semantic-witness-grid semantic-reduction-differentiators">
        <section>
          <header>
            <div>
              <p className="debug-label">Exact correspondence</p>
              <h3>One owner for each source and KIR site</h3>
            </div>
            <Network size={17} aria-hidden="true" />
          </header>
          <p>
            Entry and helper bodies use the exact correspondence owner, semantic function, role,
            symbol, and absolute KIR ordinal. Instance-qualified root occurrences survive Source
            Map V2, protected lineage, and independent finalizer replay; duplicate, reordered,
            ambiguous, or substituted records fail closed without duplicating a shared helper body.
          </p>
        </section>
        <section>
          <header>
            <div>
              <p className="debug-label">Replay for agents</p>
              <h3>The schedule cannot drift to another bundle</h3>
            </div>
            <RotateCcw size={17} aria-hidden="true" />
          </header>
          <p>
            Canonical and seeded runs persist Bundle V5 subject and body identities with the
            request, target, limits, context, transcript, and runnable decisions. A debugger or
            agent can replay the same semantic observation and gets a typed binding mismatch for
            a substituted bundle.
          </p>
        </section>
      </div>

      <p className="semantic-boundary-note">
        <ShieldAlert size={15} aria-hidden="true" />
        <span>
          This is bounded CPU semantics for the admitted production KIR, not GPU execution,
          timing, or performance prediction. A 32-lane launch is a typed workgroup mismatch.
          Workgroup scans are documented separately below; explicit active-mask operations and
          unsupported pointer, enum, needs-drop, adjusted, or complex-cast shapes remain
          unavailable.
        </span>
      </p>
    </div>
  );
}

function WorkgroupScanPanel() {
  const fixture = debugSimWorkgroupScanFixture;
  const layers = fixture.evidence.evidence_layers;
  const arbitrary = fixture.arbitraryExtents;
  const extentRows = arbitrary.representativeExtents.map((extent) => {
    const rounds = Math.ceil(Math.log2(extent));
    const fullWaves = Math.floor(extent / 64);
    const remainder = extent % 64;
    const waveParts = [
      ...Array.from({ length: fullWaves }, () => "64"),
      ...(remainder === 0 ? [] : [String(remainder)]),
    ];
    return {
      extent,
      rounds,
      memoryEffects: 3 * rounds + 2,
      barriers: 2 * rounds + 2,
      waveLayout: `${waveParts.join(" + ")} active`,
    };
  });
  return (
    <div className="semantic-scan-body">
      <div className="semantic-source-lineage">
        <span>
          <GitCommitHorizontal size={15} aria-hidden="true" /> base compiler milestone
          <a
            href={`https://github.com/harsh-nod/fe2o3/commit/${fixture.compiler.commit}`}
            rel="noreferrer"
            target="_blank"
            title={fixture.compiler.commit}
          >
            <code>{shortIdentity(fixture.compiler.commit)}</code>
          </a>
        </span>
        <span>
          semantic lowering
          <code>MIR V{fixture.compiler.semanticMirVersion} / KIR V{fixture.compiler.simulationKirVersion}</code>
        </span>
        <span>
          tested schedules
          <code>canonical / seeded / replay</code>
        </span>
        <span>
          debugger seed
          <code>0x{fixture.compiler.debuggerSchedule.toString(16)}</code>
        </span>
      </div>

      <div className="semantic-scan-layers" aria-label="Workgroup scan evidence layers">
        <TruthCell label="ordinary API pairs" value={String(layers.ordinary_api_compile_contracts)} />
        <TruthCell label="production examples" value={String(layers.ordinary_production_kernel_examples)} />
        <TruthCell label="semantic CPU cases" value={String(layers.direct_kir_semantic_simulations)} />
        <TruthCell label="retained ordinary bundles" value={String(layers.retained_ordinary_bundle_executions)} />
      </div>

      <section className="semantic-scan-extents" aria-labelledby="semantic-scan-extents-heading">
        <header>
          <div>
            <p className="debug-label">Current compiler extension</p>
            <h4 id="semantic-scan-extents-heading">Every exact 1D extent from 1 through 256</h4>
          </div>
          <a
            href={`https://github.com/harsh-nod/fe2o3/blob/${arbitrary.commit}/docs/target-neutral-workgroup-scan-v1.md`}
            rel="noreferrer"
            target="_blank"
            title={arbitrary.commit}
          >
            <code>{shortIdentity(arbitrary.commit)}</code>
          </a>
        </header>
        <p>
          Odd extents and partial final Wave64 groups use the same target-neutral
          inclusive/exclusive contract. For N lanes, the compiler records
          <code>{arbitrary.memoryEffectFormula}</code> memory effects and
          <code>{arbitrary.barrierFormula}</code> barriers, then replays the exact expansion.
        </p>
        <div role="table" aria-label="Arbitrary workgroup scan extent counts">
          <div role="row">
            <span role="columnheader">N</span>
            <span role="columnheader">ceil(log2 N)</span>
            <span role="columnheader">memory effects</span>
            <span role="columnheader">barriers</span>
            <span role="columnheader">Wave64 layout</span>
          </div>
          {extentRows.map((row) => (
            <div role="row" key={row.extent}>
              <code role="cell">{row.extent}</code>
              <code role="cell">{row.rounds}</code>
              <code role="cell">{row.memoryEffects}</code>
              <code role="cell">{row.barriers}</code>
              <span role="cell">{row.waveLayout}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="semantic-scan-grid">
        <section aria-labelledby="semantic-scan-matrix-heading">
          <p className="debug-label">Six exact prefix oracles</p>
          <h4 id="semantic-scan-matrix-heading">Type and mode stay visible at every lane</h4>
          <div className="semantic-scan-matrix" role="table" aria-label="Workgroup scan semantic results">
            <div role="row">
              <span role="columnheader">mode</span>
              <span role="columnheader">type</span>
              <span role="columnheader">input lanes</span>
              <span role="columnheader">output prefixes</span>
            </div>
            {fixture.cases.map((testCase) => (
              <div key={`${testCase.mode}-${testCase.scalar}`} role="row">
                <strong role="cell">{testCase.mode}</strong>
                <code role="cell">{testCase.scalar}</code>
                <code role="cell">[{testCase.input.join(", ")}]</code>
                <code role="cell">[{testCase.output.join(", ")}]</code>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="semantic-scan-evidence-heading">
          <p className="debug-label">Debugger event custody</p>
          <h4 id="semantic-scan-evidence-heading">One decision links a lane, KIR site, LDS epoch, and barrier</h4>
          <ol className="semantic-scan-events">
            {fixture.evidence.debugger_evidence.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </li>
            ))}
          </ol>
          <div className="semantic-scan-schedules" aria-label="Scan schedule checks">
            <span><small>canonical</small><strong>prefix oracle matches</strong></span>
            <span><small>seed 0x5ca1</small><strong>same exact arguments</strong></span>
            <span><small>persisted replay</small><strong>same exact arguments</strong></span>
            <span><small>changed input</small><strong>binding mismatch</strong></span>
          </div>
        </section>
      </div>

      <div className="semantic-scan-custody">
        <section aria-labelledby="semantic-trace-version-heading">
          <p className="debug-label">Additive trace versioning</p>
          <h4 id="semantic-trace-version-heading">Semantic Trace V2 admits exact KIR V9 or V10</h4>
          <div className="semantic-trace-versions" role="table" aria-label="Semantic Trace version custody">
            <div role="row"><strong role="cell">V1</strong><code role="cell">exact KIR V7</code><span role="cell">unchanged</span></div>
            <div role="row"><strong role="cell">V2</strong><code role="cell">exact KIR V9 or V10</code><span role="cell">canonical bytes revalidated</span></div>
            <div role="row"><strong role="cell">projection</strong><code role="cell">none</code><span role="cell">versions never cross-decode</span></div>
          </div>
        </section>
        <section aria-labelledby="semantic-shared-helper-heading">
          <p className="debug-label">Shared physical helper</p>
          <h4 id="semantic-shared-helper-heading">One body, instance-qualified source custody</h4>
          <div className="semantic-helper-custody" aria-label="Shared helper instance custody">
            <span><small>root A occurrence</small><code>owner A + instance 0</code></span>
            <Network size={17} aria-hidden="true" />
            <span className="physical"><small>physical helper</small><code>one KIR node</code></span>
            <Network size={17} aria-hidden="true" />
            <span><small>root B occurrence</small><code>owner B + instance 0</code></span>
          </div>
          <p>
            The occurrence sidecar keeps forward and reverse owner queries exact without
            duplicating the shared physical function. Admission still requires byte-identical
            helper semantics, body, bindings, spans, role, and symbol.
          </p>
        </section>
      </div>

      <div className="semantic-scan-sources" aria-label="Pinned workgroup scan sources">
        {fixture.sources.map((source) => (
          <a href={source.href} key={`${source.label}:${source.path}`} rel="noreferrer" target="_blank">
            <span>{source.label}</span>
            <code>{source.path}</code>
          </a>
        ))}
      </div>

      <details className="semantic-raw-evidence semantic-scan-raw">
        <summary><Braces size={15} aria-hidden="true" /> Exact tutorial evidence index</summary>
        <pre data-testid="workgroup-scan-evidence-v1">{fixture.raw}</pre>
      </details>

      <p className="semantic-boundary-note">
        <ShieldAlert size={15} aria-hidden="true" />
        <span>
          The base six ordinary API combinations are compile contracts; the current extension
          admits each exact N in 1..=256 and tests 3, 65, and 255 across every supported type and
          mode. The displayed eight-lane results remain direct KIR V10 semantic fixtures. No
          ordinary scan Bundle V5 execution is retained. The external protected-production proof
          environment remains unavailable, and none of this is GPU, hardware-validation,
          all-schedule, timing, or performance evidence.
        </span>
      </p>
    </div>
  );
}

function ExplorationPanel({ selected }: { selected: ExplorationEvidenceId }) {
  const fixture = debugSimExplorationFixtures.find((entry) => entry.id === selected)!;
  const exploration = field(fixture.capture, "exploration");
  const input = field(fixture.capture, "input");
  const witnesses = field(fixture.capture, "witnesses");
  const witness = field(witnesses, fixture.witnessKey);
  const assessment = field(witness, "assessment");
  const replay = field(witness, "replay_schedule");
  const first = field(assessment, "first");
  const conflict = field(first, "conflict");
  const status = stringField(assessment, "status");

  return (
    <div className="semantic-exploration-body">
      <div className="semantic-evidence-metrics" aria-label="Exploration bounds and result">
        <TruthCell label="seed interval" value={`41..${41 + numberField(exploration, "attempted") - 1}`} />
        <TruthCell
          label="completed"
          value={`${numberField(exploration, "completed")}/${numberField(exploration, "requested_schedules")}`}
        />
        <TruthCell
          label="decision bound"
          value={String(numberField(exploration, "max_decisions_per_schedule"))}
        />
        <TruthCell label="assessment" value={status.replaceAll("_", " ")} />
        <TruthCell label="schedule space exhausted" value="false" />
      </div>

      <div className="semantic-witness-grid">
        <section aria-labelledby="semantic-witness-heading">
          <header>
            <div>
              <p className="debug-label">First retained witness</p>
              <h3 id="semantic-witness-heading">{fixture.label}</h3>
            </div>
            <span className={`semantic-assessment ${fixture.id}`}>{status}</span>
          </header>
          <p>{fixture.description}</p>
          {record(conflict) ? (
            <dl className="semantic-conflict-detail">
              <div>
                <dt>allocation + byte</dt>
                <dd>
                  alloc#{numberField(conflict, "allocation")} +{numberField(conflict, "offset")}
                </dd>
              </div>
              <div>
                <dt>earlier local</dt>
                <dd>{localCoordinate(field(conflict, "earlier"))}</dd>
              </div>
              <div>
                <dt>later local</dt>
                <dd>{localCoordinate(field(conflict, "later"))}</dd>
              </div>
              <div>
                <dt>KIR sites</dt>
                <dd>
                  bb{numberField(field(conflict, "earlier_site"), "block")}:op
                  {numberField(field(conflict, "earlier_site"), "operation")} → bb
                  {numberField(field(conflict, "later_site"), "block")}:op
                  {numberField(field(conflict, "later_site"), "operation")}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="semantic-no-conflict">
              No conflicting byte was retained in these three completed schedules. Other schedules
              were not exhausted.
            </p>
          )}
          {fixture.id === "incomplete" && (
            <p className="semantic-boundary-note">
              <ShieldAlert size={15} aria-hidden="true" />
              Fence or atomic happens-before effects are not fully modeled, so this stays typed
              incomplete even though conflicting bytes were observed.
            </p>
          )}
        </section>

        <section aria-labelledby="semantic-replay-heading">
          <header>
            <div>
              <p className="debug-label">Replay identity chain</p>
              <h3 id="semantic-replay-heading">Canonical witness artifact</h3>
            </div>
            <RotateCcw size={17} aria-hidden="true" />
          </header>
          <dl className="semantic-identity-chain">
            <div>
              <dt>KIR</dt>
              <dd title={stringField(input, "kir_sha256")}>
                {shortIdentity(field(input, "kir_sha256"))}
              </dd>
            </div>
            <div>
              <dt>request</dt>
              <dd title={stringField(input, "request_sha256")}>
                {shortIdentity(field(input, "request_sha256"))}
              </dd>
            </div>
            <div>
              <dt>schedule</dt>
              <dd title={stringField(replay, "sha256")}>{shortIdentity(field(replay, "sha256"))}</dd>
            </div>
            <div>
              <dt>canonical bytes</dt>
              <dd>{numberField(replay, "bytes")}</dd>
            </div>
          </dl>
          <p>
            The embedded schedule binds the input, request, target, limits, transcript, seed, and
            runnable-local decisions. Replaying its UTF-8 bytes reproduces this assessment; it does
            not reproduce GPU scheduling.
          </p>
        </section>
      </div>

      <details className="semantic-raw-evidence">
        <summary>
          <Braces size={15} aria-hidden="true" /> Exact exploration JSON
        </summary>
        <pre data-testid={`exploration-${fixture.id}-json`}>{fixture.raw}</pre>
      </details>
    </div>
  );
}

function WavePanel({ width }: { width: LogicalWaveWidth }) {
  const fixture = debugSimWaveFixtures[width];
  const counts = field(fixture.result, "counts");
  const kir = field(fixture.result, "kir");
  const schedule = field(fixture.result, "schedule");
  const detail = field(fixture.failure, "detail");
  const fullMask = width === 32 ? "0xffffffff" : "0xffffffffffffffff";

  return (
    <div className="semantic-wave-body">
      <div className="semantic-wave-summary">
        <div>
          <span>full active mask</span>
          <code>{fullMask}</code>
        </div>
        <div>
          <span>logical invocations</span>
          <strong>{numberField(counts, "invocations_executed")}</strong>
        </div>
        <div>
          <span>KIR identity</span>
          <code title={stringField(kir, "sha256")}>{shortIdentity(field(kir, "sha256"))}</code>
        </div>
        <div>
          <span>transcript</span>
          <code title={stringField(schedule, "transcript_sha256")}>
            {shortIdentity(field(schedule, "transcript_sha256"))}
          </code>
        </div>
      </div>

      <div className="semantic-wave-operations" aria-label={`Wave${width} collective outcomes`}>
        {[
          ["lane_id", "0, 1, 2, …", "u32 per logical lane"],
          ["ballot(lane == 0)", "0x1", width === 32 ? "u32 mask" : "u64 mask"],
          ["any(lane == 0)", "true", "all participating lanes"],
          ["all(lane == 0)", "false", "all participating lanes"],
          ["shuffle_index(lane, 0, 8)", "0, 0, …, 8, 8, …", "integer tile width 8"],
        ].map(([operation, value, scope]) => (
          <div key={operation}>
            <code>{operation}</code>
            <strong>{value}</strong>
            <small>{scope}</small>
          </div>
        ))}
      </div>

      <section className="semantic-wave-failure" aria-labelledby={`wave-${width}-failure-heading`}>
        <header>
          <div>
            <p className="debug-label">Structured failure</p>
            <h3 id={`wave-${width}-failure-heading`}>Partial Wave{width} is rejected</h3>
          </div>
          <span>{stringField(fixture.failure, "kind")}</span>
        </header>
        <div>
          <span>active</span>
          <code>{stringField(detail, "active_mask")}</code>
          <span>required</span>
          <code>{stringField(detail, "required_mask")}</code>
          <span>site</span>
          <code>
            bb{numberField(field(fixture.failure, "site"), "block")}:op
            {numberField(field(fixture.failure, "site"), "operation")}
          </code>
        </div>
      </section>
    </div>
  );
}

function CounterPanel() {
  const definitionById = new Map(
    debugSimCounterFixture.definitions.map((definition) => [definition.identity, definition.name]),
  );
  return (
    <div className="semantic-counter-body">
      <div className="semantic-counter-boundary">
        <Gauge size={19} aria-hidden="true" />
        <div>
          <strong>Counter Capture V2 importer regression</strong>
          <p>
            This exact fixture exercises the rocprofv3 1.1 structured input adapter. It is not a
            live MI300X tutorial measurement; its KIR claim is declared, source/ISA correlation is
            unavailable, and collector loss is unknown.
          </p>
        </div>
      </div>
      <div className="semantic-counter-dispatches">
        {debugSimCounterFixture.dispatches.map((dispatch) => (
          <section key={dispatch.identity}>
            <header>
              <div>
                <span>collection {dispatch.collection}</span>
                <strong title={dispatch.identity}>{shortIdentity(dispatch.identity)}</strong>
              </div>
              <small>{dispatch.durationTicks} observed source ticks</small>
            </header>
            <div>
              {dispatch.values.map((value, index) => (
                <div key={`${value.counterIdentity}-${index}`}>
                  <code>{definitionById.get(value.counterIdentity)}</code>
                  <strong>{value.value}</strong>
                  <small>{value.exactBits}</small>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="semantic-counter-status">
        <span>
          <Fingerprint size={14} aria-hidden="true" /> source/ISA correlation
          <strong>unavailable</strong>
        </span>
        <span>
          <Network size={14} aria-hidden="true" /> dimension correlation
          <strong>unavailable</strong>
        </span>
        <span>
          <Activity size={14} aria-hidden="true" /> loss accounting
          <strong>{debugSimCounterFixture.loss}</strong>
        </span>
      </div>
      <details className="semantic-raw-evidence">
        <summary>
          <Braces size={15} aria-hidden="true" /> Exact Counter Capture V2 JSON
        </summary>
        <pre data-testid="counter-capture-v2-json">{debugSimCounterFixture.raw}</pre>
      </details>
    </div>
  );
}

function PcSamplePanel({ mode }: { mode: PcEvidenceMode }) {
  const fixture = debugSimPcSampleFixture;
  return (
    <div className="semantic-pc-body">
      {mode === "open" && (
        <div className="semantic-pc-open">
          <div className="semantic-evidence-metrics">
            <TruthCell label="dispatches" value={String(fixture.open.dispatches)} />
            <TruthCell label="raw samples" value={String(fixture.open.samples)} />
            <TruthCell label="relative PC unavailable" value={String(fixture.open.unavailableRelativePc)} />
            <TruthCell label="collector interval" value={`${fixture.open.interval} declared cycles`} />
            <TruthCell label="loss" value={fixture.open.loss} />
          </div>
          <p className="semantic-boundary-note">
            <ShieldAlert size={15} aria-hidden="true" />
            <span>
              The execution mask means <code>{fixture.open.execMaskMeaning}</code>. It does not
              prove that every set lane executed the sampled instruction.
            </span>
          </p>
        </div>
      )}
      {mode === "samples" && (
        <div className="semantic-pc-samples">
          {fixture.samples.map((sample) => (
            <section key={sample.identity}>
              <header>
                <span>{sample.instructionType.replaceAll("_", " ")}</span>
                <code title={sample.identity}>{shortIdentity(sample.identity)}</code>
              </header>
              <dl>
                <div>
                  <dt>relative PC</dt>
                  <dd>+0x{sample.codeObjectOffset.toString(16)}</dd>
                </div>
                <div>
                  <dt>exec mask</dt>
                  <dd>{sample.execMask}</dd>
                </div>
                <div>
                  <dt>wave location</dt>
                  <dd>
                    WG[{sample.workgroup.join(",")}] wave {sample.waveInGroup} · CU/WGP {sample.cuOrWgp} · SIMD {sample.simd}
                  </dd>
                </div>
                <div>
                  <dt>opaque ticks</dt>
                  <dd>{sample.timestamp}</dd>
                </div>
              </dl>
            </section>
          ))}
          <p className="semantic-cursor-note">
            <Fingerprint size={14} aria-hidden="true" /> next cursor binding
            <code title={fixture.sampleCursor}>{shortIdentity(fixture.sampleCursor)}:2</code>
          </p>
        </div>
      )}
      {mode === "hotspots" && (
        <div className="semantic-pc-hotspots">
          <header>
            <span>rank</span>
            <span>relative PC</span>
            <span>type</span>
            <span>sample count</span>
            <span>origin</span>
          </header>
          {fixture.hotspots.map((hotspot) => (
            <div key={`${hotspot.dispatchIdentity}-${hotspot.codeObjectOffset}`}>
              <strong>{hotspot.rank}</strong>
              <code>+0x{hotspot.codeObjectOffset.toString(16)}</code>
              <span>{hotspot.instructionType}</span>
              <span>{hotspot.count}</span>
              <span>{hotspot.origin}</span>
            </div>
          ))}
          <p>
            Hotspots infer counts of stochastic records by dispatch, code object, relative PC, and
            instruction type. They are not instruction counts, time attribution, or complete
            execution coverage.
          </p>
        </div>
      )}
      <details className="semantic-raw-evidence">
        <summary>
          <Braces size={15} aria-hidden="true" /> Exact PC Sample V3 {mode} JSON
        </summary>
        <pre data-testid={`pc-sample-${mode}-json`}>
          {mode === "open"
            ? fixture.open.raw
            : mode === "samples"
              ? fixture.raw.samples
              : fixture.raw.hotspots}
        </pre>
      </details>
    </div>
  );
}

export function DebugSimMilestone() {
  const [selectedExploration, setSelectedExploration] =
    useState<ExplorationEvidenceId>("race");
  const [waveWidth, setWaveWidth] = useState<LogicalWaveWidth>(32);
  const [pcMode, setPcMode] = useState<PcEvidenceMode>("open");

  return (
    <section className="semantic-evidence-workbench" aria-labelledby="semantic-evidence-heading">
      <header className="semantic-evidence-header">
        <div>
          <p className="section-kicker">Bounded semantic evidence</p>
          <h2 id="semantic-evidence-heading">Explore, retain, and replay a CPU counterexample</h2>
          <p>
            The simulator emits closed JSON with explicit budgets, stable KIR/request/schedule
            identities, byte-level conflict sites, and typed uncertainty. These records complement
            hardware debuggers and profilers; they do not decode ISA state or claim performance.
          </p>
        </div>
        <span className="debug-schema">
          <Braces size={15} /> fe2o3-simulation-exploration-v1
        </span>
      </header>

      <div className="semantic-evidence-truth" aria-label="Exploration truth classification">
        <span>
          <Cpu size={18} aria-hidden="true" /> CPU KIR semantic model
        </span>
        <TruthCell label="authority" value="observation only" />
        <TruthCell label="hardware observed" value="false" />
        <TruthCell label="performance prediction" value="false" />
        <TruthCell label="race-freedom proof" value="false" />
      </div>

      <section className="semantic-evidence-band" aria-labelledby="source-variable-evidence-heading">
        <header>
          <div>
            <p className="debug-label">Ordinary Rust, production exporter</p>
            <h3 id="source-variable-evidence-heading">Inspect exact V2 source variables on CPU</h3>
          </div>
          <span className="debug-schema">
            <MapPinned size={15} /> fe2o3-debug-source-map-v2
          </span>
        </header>
        <SourceVariablePanel />
      </section>

      <section className="semantic-evidence-band" aria-labelledby="workgroup-reduction-heading">
        <header>
          <div>
            <p className="debug-label">Ordinary Rust, Bundle V5</p>
            <h3 id="workgroup-reduction-heading">
              Debug a portable workgroup reduction end to end
            </h3>
          </div>
          <span className="debug-schema">
            <MapPinned size={15} /> exact correspondence + replay
          </span>
        </header>
        <WorkgroupReductionPanel />
      </section>

      <section className="semantic-evidence-band" aria-labelledby="workgroup-scan-heading">
        <header>
          <div>
            <p className="debug-label">Ordinary Rust API + direct KIR semantics</p>
            <h3 id="workgroup-scan-heading">Debug arbitrary 1D prefix contracts at KIR V10</h3>
          </div>
          <span className="debug-schema">
            <MapPinned size={15} /> exact lanes + LDS + barriers
          </span>
        </header>
        <WorkgroupScanPanel />
      </section>

      <section className="semantic-evidence-band" aria-labelledby="exploration-heading">
        <header>
          <div>
            <p className="debug-label">Seeded interleaving exploration</p>
            <h3 id="exploration-heading">One schema, three honest outcomes</h3>
          </div>
          <div className="debug-segments" role="tablist" aria-label="Race evidence outcome">
            {debugSimExplorationFixtures.map((fixture) => (
              <button
                aria-selected={selectedExploration === fixture.id}
                className={selectedExploration === fixture.id ? "active" : ""}
                key={fixture.id}
                onClick={() => setSelectedExploration(fixture.id)}
                role="tab"
                type="button"
              >
                {fixture.label}
              </button>
            ))}
          </div>
        </header>
        <ExplorationPanel selected={selectedExploration} />
      </section>

      <section className="semantic-evidence-band" aria-labelledby="wave-evidence-heading">
        <header>
          <div>
            <p className="debug-label">Exact logical collectives</p>
            <h3 id="wave-evidence-heading">Wave32 and Wave64 semantic state</h3>
          </div>
          <div className="debug-segments" role="tablist" aria-label="Logical wave width">
            {([32, 64] as const).map((width) => (
              <button
                aria-selected={waveWidth === width}
                className={waveWidth === width ? "active" : ""}
                key={width}
                onClick={() => setWaveWidth(width)}
                role="tab"
                type="button"
              >
                Wave{width}
              </button>
            ))}
          </div>
        </header>
        <WavePanel width={waveWidth} />
        <p className="semantic-evidence-footnote">
          Lane ID, ballot, any, all, and integer shuffle-index operate on exact full-active logical
          masks. They are not AMD EXEC, CWSR, register, or hardware-wave observations.
        </p>
      </section>

      <section className="semantic-evidence-band" aria-labelledby="counter-evidence-heading">
        <header>
          <div>
            <p className="debug-label">Imported profiler evidence</p>
            <h3 id="counter-evidence-heading">Preserve counter truth without inventing correlation</h3>
          </div>
          <span className="debug-schema">SemanticCounterCaptureV2</span>
        </header>
        <CounterPanel />
      </section>

      <section className="semantic-evidence-band" aria-labelledby="pc-evidence-heading">
        <header>
          <div>
            <p className="debug-label">Stochastic hardware samples</p>
            <h3 id="pc-evidence-heading">Query raw PC evidence without upgrading its meaning</h3>
          </div>
          <div className="debug-segments" role="tablist" aria-label="PC sample evidence">
            {(["open", "samples", "hotspots"] as const).map((candidate) => (
              <button
                aria-selected={pcMode === candidate}
                className={pcMode === candidate ? "active" : ""}
                key={candidate}
                onClick={() => setPcMode(candidate)}
                role="tab"
                type="button"
              >
                {candidate === "open" ? "Coverage" : candidate[0].toUpperCase() + candidate.slice(1)}
              </button>
            ))}
          </div>
        </header>
        <div className="semantic-pc-identity">
          <Crosshair size={17} aria-hidden="true" />
          <span>PC Sample Capture V3</span>
          <code title={debugSimPcSampleFixture.identity}>
            {shortIdentity(debugSimPcSampleFixture.identity)}
          </code>
        </div>
        <PcSamplePanel mode={pcMode} />
        <p className="semantic-evidence-footnote">
          PCs are code-object relative when available. Timestamps are opaque collector ticks;
          source/ISA correlation, clock conversion, ATT wave timelines, and complete instruction
          history remain explicitly unavailable.
        </p>
      </section>
    </section>
  );
}
