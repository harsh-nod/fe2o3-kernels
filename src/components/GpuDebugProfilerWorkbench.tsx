import {
  Activity,
  Braces,
  Check,
  CircleOff,
  Database,
  Gauge,
  Radio,
} from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import {
  liveWorkbenchBackends,
  type LiveWorkbenchBackendId,
  type LiveWorkbenchCell,
  type LiveWorkbenchTruthOrigin,
} from "../content/live-kfd-debugger";

const backendIcons = {
  "direct-kfd": Radio,
  "rocgdb-mi": Activity,
  "profiler-v4": Gauge,
} as const;

function shortIdentity(identity?: string): string {
  return identity ? `${identity.slice(0, 8)}…${identity.slice(-6)}` : "none";
}

function Origin({ value }: { value: LiveWorkbenchTruthOrigin }) {
  return <span className={`workbench-origin ${value}`}>{value}</span>;
}

export function GpuDebugProfilerWorkbench() {
  const [backendId, setBackendId] =
    useState<LiveWorkbenchBackendId>("direct-kfd");
  const [selection, setSelection] = useState({ row: 0, lane: 0 });
  const backendTabs = useRef<Array<HTMLButtonElement | null>>([]);
  const laneCells = useRef<Array<Array<HTMLButtonElement | null>>>([]);
  const backend = liveWorkbenchBackends.find((item) => item.id === backendId)!;
  const selectedCell: LiveWorkbenchCell =
    backend.waveRows[selection.row]?.cells[selection.lane] ??
    backend.waveRows[0].cells[0];

  const selectBackend = (id: LiveWorkbenchBackendId) => {
    setBackendId(id);
    setSelection({ row: 0, lane: 0 });
  };

  const selectAdjacentBackend = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const lastIndex = liveWorkbenchBackends.length - 1;
    const nextIndex =
      event.key === "ArrowRight"
        ? index === lastIndex
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? lastIndex
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;
    if (nextIndex === null) return;
    event.preventDefault();
    selectBackend(liveWorkbenchBackends[nextIndex].id);
    backendTabs.current[nextIndex]?.focus();
  };

  const selectAdjacentLane = (
    event: KeyboardEvent<HTMLButtonElement>,
    rowIndex: number,
    cellIndex: number,
  ) => {
    const lastRow = backend.waveRows.length - 1;
    const lastCell = backend.waveRows[rowIndex].cells.length - 1;
    let nextRow = rowIndex;
    let nextCell: number;

    if (event.key === "ArrowRight") {
      nextCell = Math.min(cellIndex + 1, lastCell);
    } else if (event.key === "ArrowLeft") {
      nextCell = Math.max(cellIndex - 1, 0);
    } else if (event.key === "ArrowDown") {
      nextRow = Math.min(rowIndex + 1, lastRow);
      nextCell = Math.min(cellIndex, backend.waveRows[nextRow].cells.length - 1);
    } else if (event.key === "ArrowUp") {
      nextRow = Math.max(rowIndex - 1, 0);
      nextCell = Math.min(cellIndex, backend.waveRows[nextRow].cells.length - 1);
    } else {
      return;
    }

    event.preventDefault();
    const next = backend.waveRows[nextRow].cells[nextCell];
    setSelection({ row: nextRow, lane: next.lane });
    laneCells.current[nextRow]?.[nextCell]?.focus();
  };

  return (
    <section
      className="gpu-workbench"
      aria-labelledby="gpu-workbench-heading"
    >
      <header className="gpu-workbench-header">
        <div>
          <p className="section-kicker">Composite evidence workbench</p>
          <h2 id="gpu-workbench-heading">One view, three authority boundaries</h2>
          <p>
            Select a backend to inspect exactly what its admitted evidence can
            establish. Cells and panels keep unavailable facts visible.
          </p>
        </div>
        <div
          className="gpu-backend-tabs"
          role="tablist"
          aria-label="Evidence backend"
        >
          {liveWorkbenchBackends.map((item, index) => {
            const Icon = backendIcons[item.id];
            return (
              <button
                aria-controls="gpu-workbench-panel"
                aria-selected={item.id === backendId}
                className={item.id === backendId ? "active" : ""}
                key={item.id}
                onClick={() => selectBackend(item.id)}
                onKeyDown={(event) => selectAdjacentBackend(event, index)}
                ref={(element) => {
                  backendTabs.current[index] = element;
                }}
                role="tab"
                tabIndex={item.id === backendId ? 0 : -1}
                type="button"
              >
                <Icon size={15} aria-hidden="true" />
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      </header>

      <div
        aria-live="polite"
        className="gpu-workbench-status"
        id="gpu-workbench-panel"
        role="tabpanel"
      >
        <div>
          <Origin value={backend.origin} />
          <strong>{backend.status}</strong>
          <span>{backend.scope}</span>
        </div>
        <code title={backend.evidenceId}>
          evidence {shortIdentity(backend.evidenceId)}
        </code>
      </div>
      <p className="gpu-workbench-summary">{backend.summary}</p>

      {backend.checkpoint && (
        <section
          className="gpu-checkpoint-summary"
          aria-label="Active direct KFD opaque checkpoint"
        >
          <header>
            <div>
              <span><Origin value="observed" /> complete capture</span>
              <h3>{backend.checkpoint.label}</h3>
            </div>
            <dl>
              <div>
                <dt>target</dt>
                <dd>{backend.checkpoint.target}</dd>
              </div>
              <div>
                <dt>logical width</dt>
                <dd>Wave{backend.checkpoint.waveWidth}</dd>
              </div>
              <div>
                <dt>opaque bytes</dt>
                <dd>{backend.checkpoint.capturedBytes.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>segments</dt>
                <dd>{backend.checkpoint.segments.length}</dd>
              </div>
            </dl>
          </header>
          <div className="table-scroll">
            <table aria-label="Opaque checkpoint segment ranges">
              <thead>
                <tr>
                  <th>Public header range</th>
                  <th>Relative offset</th>
                  <th>Opaque bytes</th>
                </tr>
              </thead>
              <tbody>
                {backend.checkpoint.segments.map((segment) => (
                  <tr key={segment.kind}>
                    <th>{segment.kind.replaceAll("_", " ")}</th>
                    <td><code>{segment.offset.toLocaleString("en-US")}</code></td>
                    <td><code>{segment.bytes.toLocaleString("en-US")}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="gpu-checkpoint-contract" aria-label="Checkpoint evidence limits">
            <p><strong>Temporal scope</strong>{backend.checkpoint.readContract}</p>
            <p><strong>Read custody</strong>{backend.checkpoint.custody}</p>
            <p><strong>Artifact scope</strong>{backend.checkpoint.artifactBoundary}</p>
          </div>
        </section>
      )}

      <div className="gpu-matrix-shell">
        <header>
          <div>
            <h3>Waves × lanes</h3>
            <p>{backend.matrixNote}</p>
          </div>
          <div className="gpu-matrix-legend" aria-label="Lane state legend">
            <span><i className="active" />active</span>
            <span><i className="inactive" />inactive</span>
            <span><i className="unavailable" />unavailable</span>
          </div>
        </header>
        <div className="gpu-matrix-scroll">
          <div
            className="gpu-lane-matrix"
            role="grid"
            aria-label={backend.matrixLabel}
          >
            <div className="gpu-lane-axis" aria-hidden="true">
              <span />
              {Array.from({ length: 8 }, (_, group) => (
                <b key={group}>{group * 8}</b>
              ))}
            </div>
            {backend.waveRows.map((row, rowIndex) => (
              <div className="gpu-wave-row" role="row" key={row.id}>
                <span role="rowheader">{row.label}</span>
                <div>
                  {row.cells.map((cell, cellIndex) => {
                    const selected =
                      selection.row === rowIndex && selection.lane === cell.lane;
                    return (
                      <button
                        aria-label={`${row.label}, lane ${cell.lane}, ${cell.state}, ${cell.detail}`}
                        aria-selected={selected}
                        className={`${cell.state}${selected ? " selected" : ""}`}
                        key={cell.lane}
                        onClick={() =>
                          setSelection({ row: rowIndex, lane: cell.lane })
                        }
                        onKeyDown={(event) =>
                          selectAdjacentLane(event, rowIndex, cellIndex)
                        }
                        ref={(element) => {
                          laneCells.current[rowIndex] ??= [];
                          laneCells.current[rowIndex][cellIndex] = element;
                        }}
                        role="gridcell"
                        tabIndex={selected ? 0 : -1}
                        title={`lane ${cell.lane}: ${cell.detail}`}
                        type="button"
                      >
                        {cell.lane}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="gpu-cell-inspector" aria-live="polite">
          <div>
            {selectedCell.state === "active" ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <CircleOff size={16} aria-hidden="true" />
            )}
            <span>
              <small>selected cell</small>
              <strong>
                {backend.waveRows[selection.row]?.label ?? backend.waveRows[0].label}
                {" · lane "}{selectedCell.lane}
              </strong>
            </span>
          </div>
          <Origin value={selectedCell.origin} />
          <p>{selectedCell.detail}</p>
          <code title={selectedCell.evidenceId}>
            {selectedCell.evidenceId
              ? `evidence ${shortIdentity(selectedCell.evidenceId)}`
              : "evidence unavailable"}
          </code>
        </div>
      </div>

      <div className="gpu-detail-grid" aria-label="Source IR ISA and allocation correlation">
        {backend.panels.map((panel) => (
          <section key={panel.label}>
            <header>
              <span>{panel.label}</span>
              <Origin value={panel.origin} />
            </header>
            <p>{panel.value}</p>
            <code title={panel.evidenceId}>
              {panel.evidenceId
                ? shortIdentity(panel.evidenceId)
                : "no evidence identity"}
            </code>
          </section>
        ))}
      </div>

      <div className="gpu-workbench-lower">
        <section className="gpu-capabilities" aria-labelledby="gpu-capabilities-heading">
          <header>
            <Database size={16} aria-hidden="true" />
            <h3 id="gpu-capabilities-heading">Capability ledger</h3>
          </header>
          <ul>
            {backend.capabilities.map((capability) => (
              <li key={capability.label}>
                <span className={capability.state}>{capability.state}</span>
                <div>
                  <strong>{capability.label}</strong>
                  <p>{capability.detail}</p>
                </div>
                <Origin value={capability.origin} />
              </li>
            ))}
          </ul>
        </section>
        <section className="gpu-agent-record" aria-labelledby="gpu-agent-record-heading">
          <header>
            <Braces size={16} aria-hidden="true" />
            <h3 id="gpu-agent-record-heading">Illustrative evidence summary</h3>
          </header>
          <p>
            Tutorial projection only. This JSON is not a protocol wire record.
          </p>
          <pre data-testid="gpu-workbench-record">
            <code>{`${JSON.stringify(backend.record, null, 2)}\n`}</code>
          </pre>
        </section>
      </div>
    </section>
  );
}
