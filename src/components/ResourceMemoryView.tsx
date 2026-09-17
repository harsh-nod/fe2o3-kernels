import { useId, useState, type KeyboardEvent } from "react";
import {
  projectResourceMemoryResponse,
  resourceMemoryCells,
  RESOURCE_MEMORY_VISIBLE_BYTES,
  type ResourceMemoryCell,
  type ResourceMemoryProjection,
  type ResourceSnapshotAnchor,
} from "../content/resource-memory-view";
import "./ResourceMemoryView.css";

export interface ResourceMemoryViewProps {
  response: unknown;
  expectedSnapshot: unknown;
  title?: string;
}

function initializationLabel(cell: ResourceMemoryCell): string {
  const count = cell.initialized.filter(Boolean).length;
  if (count === cell.byteLength) return "initialized";
  if (count === 0) return "uninitialized";
  return `partially initialized (${count}/${cell.byteLength})`;
}

function scopeLabel(scope: ResourceSnapshotAnchor["scope"]): string {
  if (scope.level === "dispatch") return "Dispatch";
  const workgroup = `Workgroup [${scope.workgroup.join(", ")}]`;
  if (scope.level === "workgroup") return workgroup;
  return `${workgroup}, logical wave ${scope.wave}${scope.level === "lane" ? `, lane ${scope.lane}` : ""}; wave width ${scope.wave_width}`;
}

function SnapshotDetails({ anchor }: { anchor: ResourceSnapshotAnchor }) {
  const site = anchor.site;
  return (
    <dl className="resource-memory-facts">
      <div><dt>Cursor / revision</dt><dd>{anchor.cursor.event_sequence} / {anchor.cursor.state_revision}</dd></div>
      <div><dt>Scope</dt><dd>{scopeLabel(anchor.scope)}</dd></div>
      {(anchor.scope.level === "wave" || anchor.scope.level === "lane") && (
        <div><dt>Logical active mask</dt><dd><code>0x{anchor.scope.active_mask.toString(16)}</code> · physical EXEC unavailable</dd></div>
      )}
      <div><dt>Frame / occurrence</dt><dd>{anchor.frame === undefined ? "unavailable" : `${anchor.frame} / ${anchor.occurrence}`}</dd></div>
      <div><dt>KIR site</dt><dd>{site ? (
        <code>function {site.kir.function_ordinal}, block {site.kir.block_ordinal}, {site.kir.point.kind === "operation" ? `operation ${site.kir.point.operation_ordinal}` : site.kir.point.kind}</code>
      ) : "unavailable"}</dd></div>
      <div><dt>Source association</dt><dd>{site?.source.status === "resolved" ? (
        <>
          {site.source.location.provenance}; byte range [{site.source.location.byte_start}, {site.source.location.byte_end})
          <br /><code>file {site.source.location.file_identity}</code>
          <br /><code>map {site.source.location.map_identity}</code>
          <br />Content association; protected compiler authentication is not established by this response.
        </>
      ) : `unavailable · ${site?.source.status === "unavailable" ? site.source.reason : "not captured"}`}</dd></div>
      <div><dt>Configuration</dt><dd><code>{anchor.cursor.configuration_identity}</code></dd></div>
    </dl>
  );
}

function CapturedWindow({ projection }: { projection: Extract<ResourceMemoryProjection, { status: "ready" }> }) {
  const { memory } = projection;
  const [page, setPage] = useState(0);
  const [cellBytes, setCellBytes] = useState<1 | 4>(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cells = resourceMemoryCells(memory, page, cellBytes);
  const selected = cells[selectedIndex] ?? cells[0];
  const pageCount = Math.max(1, Math.ceil(memory.returned_bytes / RESOURCE_MEMORY_VISIBLE_BYTES));
  const visibleStart = memory.byte_offset + page * RESOURCE_MEMORY_VISIBLE_BYTES;
  const visibleEnd = Math.min(memory.byte_offset + memory.returned_bytes, visibleStart + RESOURCE_MEMORY_VISIBLE_BYTES);
  const availability = memory.availability;

  const changePage = (next: number) => {
    setPage(next);
    setSelectedIndex(0);
  };

  const navigateCell = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const directions: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    const parent = event.currentTarget.parentElement;
    const columns = parent ? Number.parseInt(getComputedStyle(parent).getPropertyValue("--resource-columns"), 10) || 8 : 8;
    directions.ArrowUp = -columns;
    directions.ArrowDown = columns;
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = cells.length - 1;
    else if (Object.hasOwn(directions, event.key)) next = Math.max(0, Math.min(cells.length - 1, index + directions[event.key]));
    else return;
    event.preventDefault();
    setSelectedIndex(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <>
      <p className="resource-memory-window-summary">
        <strong>alloc#{memory.allocation.ordinal}:g{memory.allocation.generation}</strong>
        {availability.status === "captured" && <> · {availability.address_space} memory</>}
        <br />Requested [{memory.byte_offset}, {memory.byte_offset + memory.requested_bytes}) bytes; returned {memory.returned_bytes} of {memory.requested_bytes} bytes.
      </p>
      {availability.status !== "captured" ? (
        <p role="status">Memory {availability.status}: {availability.reason}. No byte values are available.</p>
      ) : (
        <>
          {(availability.truncated || memory.returned_bytes < memory.requested_bytes) && (
            <p className="resource-memory-notice" role="status">Partial memory response. Unreturned bytes remain unavailable; the visible window is not the full allocation.</p>
          )}
          {memory.returned_bytes === 0 ? <p role="status">No captured bytes were returned.</p> : (
            <>
              <div className="resource-memory-controls">
                <label>Cell size <select
                  aria-label="Memory cell size"
                  value={cellBytes}
                  onChange={(event) => { setCellBytes(event.target.value === "4" ? 4 : 1); setSelectedIndex(0); }}
                >
                  <option value="1">Byte</option>
                  <option value="4">Dword (4 bytes)</option>
                </select></label>
                <div className="resource-memory-pagination" aria-label="Memory window pagination">
                  <button type="button" disabled={page === 0} onClick={() => changePage(page - 1)}>Previous window</button>
                  <span aria-live="polite">Window {page + 1} of {pageCount}</span>
                  <button type="button" disabled={page + 1 >= pageCount} onClick={() => changePage(page + 1)}>Next window</button>
                </div>
              </div>
              <p className="resource-memory-legend">
                <strong>I</strong> initialized · <strong>U</strong> uninitialized · <strong>M</strong> mixed.
                Bytes appear in increasing offset order; dwords are byte groups, not decoded scalar values.
              </p>
              <p aria-live="polite">Visible allocation-relative byte range [{visibleStart}, {visibleEnd}).</p>
              <div className="resource-memory-grid" role="group" aria-label="Captured memory cells">
                {cells.map((cell, index) => {
                  const state = initializationLabel(cell);
                  const marker = cell.initialized.every(Boolean) ? "I" : cell.initialized.some(Boolean) ? "M" : "U";
                  return (
                    <button
                      type="button"
                      key={cell.byteOffset}
                      className={`resource-memory-cell state-${marker.toLowerCase()}`}
                      aria-label={`Byte offset ${cell.byteOffset}, ${cell.byteLength} ${cell.byteLength === 1 ? "byte" : "bytes"}, ${cell.bytes}, ${state}`}
                      aria-pressed={index === selectedIndex}
                      tabIndex={index === selectedIndex ? 0 : -1}
                      onClick={() => setSelectedIndex(index)}
                      onKeyDown={(event) => navigateCell(event, index)}
                    >
                      <small>+{cell.byteOffset}</small><code>{cell.bytes.slice(2)}</code><span>{marker}{cell.byteLength < cellBytes ? ` · ${cell.byteLength} B` : ""}</span>
                    </button>
                  );
                })}
              </div>
              {selected && (
                <div className="resource-memory-table-wrap">
                  <table aria-label="Selected memory cell details">
                    <thead><tr><th scope="col">Byte offset</th><th scope="col">Captured storage byte</th><th scope="col">Initialization</th></tr></thead>
                    <tbody>{selected.initialized.map((initialized, index) => (
                      <tr key={selected.byteOffset + index}>
                        <th scope="row">+{selected.byteOffset + index}</th>
                        <td><code>0x{selected.bytes.slice(2 + index * 2, 4 + index * 2)}</code></td>
                        <td>{initialized ? "Initialized" : "Uninitialized · not a program value"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
      <SnapshotDetails anchor={projection.anchor} />
      <p className="resource-memory-boundaries">
        Allocation extent, lifecycle, physical LDS layout, access history and physical registers are unavailable from this memory response.
        Capture completeness beyond the returned memory window is unavailable. Uninitialized storage bytes do not establish program values.
      </p>
      <details className="resource-memory-evidence">
        <summary>Exact snapshot and memory facts</summary>
        <pre>{JSON.stringify({ request_id: projection.requestId, snapshot: projection.anchor, memory }, null, 2)}</pre>
      </details>
    </>
  );
}

export function ResourceMemoryView({ response, expectedSnapshot, title = "Snapshot memory window" }: ResourceMemoryViewProps) {
  const headingId = useId();
  const projection = projectResourceMemoryResponse(response, expectedSnapshot);
  return (
    <section className="resource-memory-view" aria-labelledby={headingId}>
      <header>
        <p className="resource-memory-eyebrow">{projection.status === "ready" || projection.status === "unavailable"
          ? "CPU replay · simulated observation" : "Memory observation · unavailable"}</p>
        <h3 id={headingId}>{title}</h3>
        <p>This read-only view displays an existing debugger response. Browser checks do not authenticate producer claims.</p>
      </header>
      {projection.status === "ready" ? (
        <CapturedWindow
          key={`${projection.anchorKey}:${JSON.stringify(projection.memory)}`}
          projection={projection}
        />
      ) : (
        <p className="resource-memory-notice" role="status" data-state={projection.status}>{projection.detail}</p>
      )}
    </section>
  );
}
