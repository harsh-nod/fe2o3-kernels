import {
  Braces,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  debuggerComparisonLinks,
  debuggerComparisonRows,
  type DebuggerAgentOperation,
  type DebuggerEventFixture,
  type DebuggerWorkbenchFixture,
} from "../content/debugger-workbench";

type HierarchyMode = "thread" | "wave" | "workgroup";
type InspectorMode = "ssa" | "memory";

interface BreakpointState {
  id: number;
  enabled: boolean;
  kind: "kir_site";
  block: number;
  operation: number;
  point: string;
}

interface WatchpointState {
  id: number;
  enabled: boolean;
  allocation: { ordinal: number; generation: number };
  byte_offset: number;
  byte_len: number;
  access: "read" | "write" | "read_write";
}

function json(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="debug-status-pill">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function Inspector({
  event,
  limitations,
  mode,
  onMode,
}: {
  event: DebuggerEventFixture;
  limitations: DebuggerWorkbenchFixture["limitations"];
  mode: InspectorMode;
  onMode: (mode: InspectorMode) => void;
}) {
  return (
    <section className="debug-inspector" aria-labelledby="debug-inspector-heading">
      <header>
        <div>
          <p className="debug-label">State inspector</p>
          <h3 id="debug-inspector-heading">Cursor {event.cursor}</h3>
        </div>
        <div className="debug-segments compact" role="tablist" aria-label="State inspector">
          {(["ssa", "memory"] as const).map((candidate) => (
            <button
              aria-selected={mode === candidate}
              className={mode === candidate ? "active" : ""}
              key={candidate}
              onClick={() => onMode(candidate)}
              role="tab"
              type="button"
            >
              {candidate === "ssa" ? "SSA values" : candidate[0].toUpperCase() + candidate.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="debug-inspector-body" role="tabpanel">
        {mode === "ssa" && (
          <div className="debug-values">
            {event.ssa.map((value) => (
              <div key={value.name}>
                <code>{value.name}</code>
                <span>{value.type}</span>
                {value.availability === "captured" ? (
                  <strong>{value.value}</strong>
                ) : (
                  <strong className="debug-unavailable">
                    unavailable · {value.reason}
                  </strong>
                )}
              </div>
            ))}
            {limitations
              .filter((limitation) => limitation.capability === "register_values")
              .map((limitation) => (
                <div key={limitation.capability} title={limitation.detail}>
                  <code>{limitation.capability}</code>
                  <span>capability</span>
                  <strong className="debug-unavailable">
                    unavailable · {limitation.reason}
                  </strong>
                </div>
              ))}
          </div>
        )}
        {mode === "memory" && (
          event.memory.length > 0 ? (
            <div className="debug-memory-list">
              {event.memory.map((memory) => (
                <div key={`${memory.allocation.ordinal}-${memory.byte_offset}-${memory.access}`}>
                  <span className={`debug-access ${memory.access}`}>{memory.access}</span>
                  <code>
                    alloc#{memory.allocation.ordinal}:g{memory.allocation.generation}
                    +{memory.byte_offset}
                  </code>
                  <strong>{memory.bytes}</strong>
                  <small>init {memory.initialized}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="debug-empty">No memory effect at this semantic event.</p>
          )
        )}
      </div>
    </section>
  );
}

function BreakWatchEditor({
  event,
  breakpoints,
  watchpoints,
  onBreakpoints,
  onWatchpoints,
}: {
  event: DebuggerEventFixture;
  breakpoints: BreakpointState[];
  watchpoints: WatchpointState[];
  onBreakpoints: (value: BreakpointState[]) => void;
  onWatchpoints: (value: WatchpointState[]) => void;
}) {
  const [watchOffset, setWatchOffset] = useState(0);
  const [watchLength, setWatchLength] = useState(4);
  const defaultAllocation =
    event.memory[0]?.allocation ??
    watchpoints[0]?.allocation ?? { ordinal: 0, generation: 0 };

  const addBreakpoint = () => {
    const site = event.site.kir;
    if (
      breakpoints.some(
        (entry) =>
          entry.block === site.block &&
          entry.operation === site.operation &&
          entry.point === site.point,
      )
    ) {
      return;
    }
    onBreakpoints([
      ...breakpoints,
      {
        id: Math.max(0, ...breakpoints.map((entry) => entry.id)) + 1,
        enabled: true,
        kind: "kir_site",
        block: site.block,
        operation: site.operation,
        point: site.point,
      },
    ]);
  };

  const addWatchpoint = () => {
    if (watchLength < 1) return;
    onWatchpoints([
      ...watchpoints,
      {
        id: Math.max(0, ...watchpoints.map((entry) => entry.id)) + 1,
        enabled: true,
        allocation: { ...defaultAllocation },
        byte_offset: watchOffset,
        byte_len: watchLength,
        access: "write",
      },
    ]);
  };

  return (
    <section className="debug-editor" aria-labelledby="debug-editor-heading">
      <header>
        <div>
          <p className="debug-label">Stop policy</p>
          <h3 id="debug-editor-heading">Breakpoints and watchpoints</h3>
        </div>
      </header>
      <div className="debug-editor-columns">
        <div>
          <div className="debug-editor-title">
            <strong>KIR breakpoints</strong>
            <button
              aria-label="Add breakpoint at current KIR site"
              className="debug-icon-button"
              onClick={addBreakpoint}
              title="Add breakpoint at current KIR site"
              type="button"
            >
              <Plus size={15} />
            </button>
          </div>
          <ul className="debug-policy-list">
            {breakpoints.map((breakpoint) => (
              <li key={breakpoint.id}>
                <input
                  aria-label={`Enable breakpoint ${breakpoint.id}`}
                  checked={breakpoint.enabled}
                  onChange={() =>
                    onBreakpoints(
                      breakpoints.map((entry) =>
                        entry.id === breakpoint.id
                          ? { ...entry, enabled: !entry.enabled }
                          : entry,
                      ),
                    )
                  }
                  type="checkbox"
                />
                <code>b{breakpoint.block}:op{breakpoint.operation}:{breakpoint.point}</code>
                <button
                  aria-label={`Remove breakpoint ${breakpoint.id}`}
                  className="debug-icon-button"
                  onClick={() =>
                    onBreakpoints(breakpoints.filter((entry) => entry.id !== breakpoint.id))
                  }
                  title="Remove breakpoint"
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="debug-editor-title">
            <strong>Allocation watchpoints</strong>
          </div>
          <div className="debug-watch-controls">
            <label>
              <span>Offset</span>
              <input
                min={0}
                onChange={(event) => setWatchOffset(Math.max(0, event.currentTarget.valueAsNumber || 0))}
                type="number"
                value={watchOffset}
              />
            </label>
            <label>
              <span>Bytes</span>
              <input
                min={1}
                onChange={(event) => setWatchLength(Math.max(1, event.currentTarget.valueAsNumber || 1))}
                type="number"
                value={watchLength}
              />
            </label>
            <button
              aria-label="Add allocation watchpoint"
              className="debug-icon-button"
              onClick={addWatchpoint}
              title="Add allocation watchpoint"
              type="button"
            >
              <Plus size={15} />
            </button>
          </div>
          <ul className="debug-policy-list">
            {watchpoints.map((watchpoint) => (
              <li key={watchpoint.id}>
                <input
                  aria-label={`Enable watchpoint ${watchpoint.id}`}
                  checked={watchpoint.enabled}
                  onChange={() =>
                    onWatchpoints(
                      watchpoints.map((entry) =>
                        entry.id === watchpoint.id
                          ? { ...entry, enabled: !entry.enabled }
                          : entry,
                      ),
                    )
                  }
                  type="checkbox"
                />
                <code>
                  alloc#{watchpoint.allocation.ordinal}:g{watchpoint.allocation.generation}
                  +{watchpoint.byte_offset}..+{watchpoint.byte_offset + watchpoint.byte_len}
                </code>
                <button
                  aria-label={`Remove watchpoint ${watchpoint.id}`}
                  className="debug-icon-button"
                  onClick={() =>
                    onWatchpoints(watchpoints.filter((entry) => entry.id !== watchpoint.id))
                  }
                  title="Remove watchpoint"
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function DebuggerWorkbench({ fixture }: { fixture: DebuggerWorkbenchFixture }) {
  const [eventIndex, setEventIndex] = useState(0);
  const [selectedLane, setSelectedLane] = useState(fixture.events[0].scope.lane);
  const [hierarchyMode, setHierarchyMode] = useState<HierarchyMode>("thread");
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>("ssa");
  const [agentOperation, setAgentOperation] =
    useState<DebuggerAgentOperation>("values");
  const [breakpoints, setBreakpoints] = useState<BreakpointState[]>(() =>
    fixture.breakpoints.map((entry) => ({ ...entry })),
  );
  const [watchpoints, setWatchpoints] = useState<WatchpointState[]>(() =>
    fixture.watchpoints.map((entry) => ({
      ...entry,
      allocation: { ...entry.allocation },
    })),
  );

  const event = fixture.events[eventIndex];
  const waveCount = fixture.launch.scheduled_lane_count / fixture.launch.logical_wave_size;
  const hitBreakpoint =
    event.cursor === fixture.breakpoint_stop_cursor ||
    breakpoints.some(
      (entry) =>
        entry.enabled &&
        entry.block === event.site.kir.block &&
        entry.operation === event.site.kir.operation &&
        entry.point === event.site.kir.point,
    );
  const hitWatchpoint = event.cursor === fixture.watchpoint_stop_cursor;

  const selectEvent = (index: number) => {
    const next = fixture.events[index];
    setEventIndex(index);
    setSelectedLane(next.scope.lane);
  };

  const continueExecution = () => {
    const nextStop = fixture.events.findIndex(
      (candidate, index) => index > eventIndex && candidate.stopped,
    );
    selectEvent(nextStop >= 0 ? nextStop : fixture.events.length - 1);
  };

  const reset = () => {
    setEventIndex(0);
    setSelectedLane(fixture.events[0].scope.lane);
    setHierarchyMode("thread");
    setInspectorMode("ssa");
    setAgentOperation("values");
    setBreakpoints(fixture.breakpoints.map((entry) => ({ ...entry })));
    setWatchpoints(
      fixture.watchpoints.map((entry) => ({
        ...entry,
        allocation: { ...entry.allocation },
      })),
    );
  };

  const agentPair = fixture.agent_pairs[agentOperation];

  return (
    <section className="debugger-tutorial" aria-labelledby="debugger-workbench-heading">
      <header className="debugger-tutorial-header">
        <div>
          <p className="section-kicker">Raw-KIR companion session</p>
          <h2 id="debugger-workbench-heading">Inspect one deterministic semantic trace</h2>
          <p>
            This interactive raw-KIR fixture has no source map, so source is explicitly unavailable.
            The exact bundle transcript below demonstrates source debugging separately. Logical
            waves are not decoded hardware wavefronts or performance measurements.
          </p>
        </div>
        <span className="debug-schema"><Braces size={15} /> {fixture.schema}</span>
      </header>

      <div className="debug-truth-toolbar" aria-label="Session provenance and truth">
        <div className="debug-truth-primary">
          <Cpu size={18} aria-hidden="true" />
          <span>
            <small>Backend</small>
            <strong>{fixture.session.truth_label}</strong>
          </span>
        </div>
        <StatusPill label="simulated" value="true" />
        <StatusPill label="hardware observed" value="false" />
        <StatusPill label="performance prediction" value="false" />
        <StatusPill label="wave model" value="logical only" />
      </div>

      <div className="debug-commandbar">
        <div className="debug-transport" aria-label="Execution controls">
          <button
            aria-label="Reverse one semantic event"
            disabled={eventIndex === 0}
            onClick={() => selectEvent(eventIndex - 1)}
            title="Reverse one semantic event"
            type="button"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            aria-label="Forward one semantic event"
            disabled={eventIndex === fixture.events.length - 1}
            onClick={() => selectEvent(eventIndex + 1)}
            title="Forward one semantic event"
            type="button"
          >
            <ChevronRight size={17} />
          </button>
          <button
            aria-label="Continue to next stop"
            disabled={eventIndex === fixture.events.length - 1}
            onClick={continueExecution}
            title="Continue to next stop"
            type="button"
          >
            <Play size={16} />
          </button>
          <button aria-label="Reset debug session" onClick={reset} title="Reset debug session" type="button">
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="debug-cursor-status" aria-live="polite">
          <span>cursor {event.cursor}/{fixture.events.at(-1)?.cursor}</span>
          <strong>{event.label}</strong>
          {hitBreakpoint && <em>breakpoint hit</em>}
          {hitWatchpoint && <em>watchpoint hit</em>}
        </div>
        <div className="debug-segments" role="tablist" aria-label="Execution hierarchy">
          {([
            ["thread", "Thread"],
            ["wave", "Logical wave"],
            ["workgroup", "Workgroup"],
          ] as const).map(([value, label]) => (
            <button
              aria-selected={hierarchyMode === value}
              className={hierarchyMode === value ? "active" : ""}
              key={value}
              onClick={() => setHierarchyMode(value)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-hierarchy" aria-label="Workgroup logical wave and lane hierarchy">
        <div className={`debug-workgroup-node${hierarchyMode === "workgroup" ? " selected" : ""}`}>
          <span>WG</span>
          <strong>[{fixture.launch.workgroup.join(", ")}]</strong>
          <small>{fixture.launch.scheduled_lane_count} scheduled slots</small>
        </div>
        <div className="debug-wave-list">
          {Array.from({ length: waveCount }, (_, wave) => (
            <section
              className={`debug-wave${hierarchyMode === "wave" && event.scope.wave === wave ? " selected" : ""}`}
              key={wave}
            >
              <header>
                <span>Logical wave {wave}</span>
                <small>{fixture.launch.logical_wave_size} lanes · simulated visualization</small>
              </header>
              <div
                className="debug-lane-grid"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(8, fixture.launch.logical_wave_size)}, minmax(24px, 1fr))`,
                }}
              >
                {Array.from({ length: fixture.launch.logical_wave_size }, (_, laneInWave) => {
                  const lane = wave * fixture.launch.logical_wave_size + laneInWave;
                  const active = lane < fixture.launch.active_lane_count;
                  const selected = active && lane === selectedLane;
                  return (
                    <button
                      aria-label={`Lane ${lane} ${active ? "active" : "inactive"}`}
                      aria-pressed={selected}
                      className={`${active ? "active" : "inactive"}${selected ? " selected" : ""}`}
                      disabled={!active}
                      key={lane}
                      onClick={() => {
                        setSelectedLane(lane);
                        setHierarchyMode("thread");
                      }}
                      title={active ? `Lane ${lane}` : `Lane ${lane}: inactive padding`}
                      type="button"
                    >
                      {lane}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="debug-timeline" aria-labelledby="debug-timeline-heading">
        <header>
          <p className="debug-label">Linked semantic events</p>
          <h3 id="debug-timeline-heading">Event timeline</h3>
        </header>
        <div className="debug-timeline-track">
          {fixture.events.map((candidate, index) => (
            <button
              aria-current={index === eventIndex ? "step" : undefined}
              className={index === eventIndex ? "selected" : ""}
              key={candidate.id}
              onClick={() => selectEvent(index)}
              type="button"
            >
              <span>{candidate.cursor}</span>
              <small>{candidate.kind}</small>
              <strong>{candidate.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="debug-site-strip" aria-label="Semantic site availability">
        <div>
          <small>KIR site · captured</small>
          <code>
            block{event.site.kir.block}:op{event.site.kir.operation}:{event.site.kir.point}
          </code>
        </div>
        <div>
          <small>Source site in this raw-KIR capture · {event.site.source.availability}</small>
          <code className="debug-unavailable">{event.site.source.reason}</code>
        </div>
      </section>

      <div className="debug-two-column">
        <Inspector
          event={event}
          limitations={fixture.limitations}
          mode={inspectorMode}
          onMode={setInspectorMode}
        />
        <BreakWatchEditor
          breakpoints={breakpoints}
          event={event}
          onBreakpoints={setBreakpoints}
          onWatchpoints={setWatchpoints}
          watchpoints={watchpoints}
        />
      </div>

      <section className="debug-agent-panel" aria-labelledby="debug-agent-heading">
        <header>
          <div>
            <p className="debug-label">Agent-native contract</p>
            <h3 id="debug-agent-heading">Bounded JSON request and response</h3>
          </div>
          <div className="debug-segments compact" role="tablist" aria-label="Agent operation">
            {([
              ["hierarchy", "Hierarchy"],
              ["values", "Values"],
              ["memory", "Memory"],
              ["events", "Events"],
            ] as const).map(([value, label]) => (
              <button
                aria-selected={agentOperation === value}
                className={agentOperation === value ? "active" : ""}
                key={value}
                onClick={() => setAgentOperation(value)}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        <div className="debug-json-grid">
          <div>
            <span>request.jsonl</span>
            <pre data-testid="debug-agent-request">{json(agentPair.request)}</pre>
          </div>
          <div>
            <span>response.jsonl</span>
            <pre data-testid="debug-agent-response">{json(agentPair.response)}</pre>
          </div>
        </div>
      </section>

      <section className="debug-comparison" aria-labelledby="debug-comparison-heading">
        <header>
          <p className="section-kicker">Complementary evidence</p>
          <h2 id="debug-comparison-heading">Where each tool has authority</h2>
          <p>
            The semantic workbench does not replace live hardware debugging or profiling. It adds
            deterministic KIR state, explicit unavailable values, and a bounded agent contract.
          </p>
        </header>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Evidence surface</th>
                <th>fe2o3 semantic debugger</th>
                <th>ROCgdb</th>
                <th>rocprofv3 / ATT / Compute Viewer</th>
                <th>Mojo debug</th>
              </tr>
            </thead>
            <tbody>
              {debuggerComparisonRows.map((row) => (
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
    </section>
  );
}
