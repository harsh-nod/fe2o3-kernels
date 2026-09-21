import { useId, useState } from "react";
import {
  interpretResourceMemoryCell,
  type MemoryByteOrder,
  type MemoryCellSelection,
  type MemoryValueFormat,
} from "../content/resource-memory-interpretation";
import type { ResourceMemoryProjection } from "../content/resource-memory-view";
import "./ResourceMemoryInterpretationView.css";

export interface ResourceMemoryInterpretationViewProps {
  projection: ResourceMemoryProjection;
  selection: MemoryCellSelection | null;
}

function CurrentInterpretation({ projection, selection }: ResourceMemoryInterpretationViewProps) {
  const id = useId();
  const [format, setFormat] = useState<MemoryValueFormat>("raw");
  const [byteOrder, setByteOrder] = useState<MemoryByteOrder>("unknown");
  const result = interpretResourceMemoryCell(projection, selection, format, byteOrder);
  return <section className="resource-memory-interpretation" aria-labelledby={id + "-heading"}>
    <h4 id={id + "-heading"}>Selected dword interpretation</h4>
    <p id={id + "-boundary"}>User-chosen interpretation of recorded storage; not a captured source type.
      Byte order is unknown until you choose it. No target, alignment, source variable, physical register
      or live GPU value is inferred. Changing these choices never changes bytes or sends a debugger command.</p>
    <div className="resource-memory-interpretation-controls">
      <label>Value interpretation
        <select aria-label="Value interpretation" aria-describedby={id + "-boundary"}
          value={format} onChange={event => {
            const value = event.target.value;
            setFormat(value === "u32" || value === "i32" || value === "f32" ? value : "raw");
          }}>
          <option value="raw">Raw storage only</option>
          <option value="u32">u32 — unsigned integer</option>
          <option value="i32">i32 — signed integer</option>
          <option value="f32">f32 — IEEE 754 binary32</option>
        </select>
      </label>
      <label>Interpretation byte order
        <select aria-label="Interpretation byte order" aria-describedby={id + "-boundary"}
          value={byteOrder} onChange={event => {
            const value = event.target.value;
            setByteOrder(value === "little" || value === "big" ? value : "unknown");
          }}>
          <option value="unknown">Unknown — no assumption</option>
          <option value="little">Assume little-endian</option>
          <option value="big">Assume big-endian</option>
        </select>
      </label>
    </div>
    <p aria-label="Memory interpretation status" data-state={result.status} aria-live="polite" aria-atomic="true">{result.detail}</p>
    {result.status === "ready" && <>
      <dl aria-label="Selected dword interpretation facts">
        <div><dt>Allocation-relative bytes</dt><dd>[{result.byteOffset}, {result.byteOffset + 4})</dd></div>
        <div><dt>Storage bytes, increasing offset</dt><dd><code>{result.bytes}</code></dd></div>
        <div><dt>Chosen interpretation</dt><dd>{result.format}, {result.byteOrder}-endian assumption</dd></div>
        <div><dt>Bits under chosen byte order</dt><dd><code>{result.bits}</code></dd></div>
        <div><dt>Interpreted scalar</dt><dd><output aria-label="Interpreted scalar">{result.value}</output></dd></div>
        {result.floatClass && <div><dt>Binary32 classification</dt><dd>{result.floatClass}</dd></div>}
      </dl>
      {result.floatClass === "NaN" && <p>NaN has no numeric value. The exact sign and payload bits remain in the displayed bit pattern;
        browser interpretation does not establish signaling behavior, exceptions or GPU arithmetic.</p>}
      {result.partialWindow && <p>The selected four bytes are complete; the surrounding requested memory window is partial.
        Unreturned bytes remain unavailable.</p>}
    </>}
    <p className="resource-memory-interpretation-notice">Choices reset when the response, checkpoint or allocation changes.
      Within the same retained response, including its viewport pages, they follow the selected cell;
      uninitialized storage is never decoded as a scalar.
      Producer and source claims remain unauthenticated.</p>
  </section>;
}

/** Identity-keyed subtree clears interpretation choices synchronously, not in a later effect. */
export function ResourceMemoryInterpretationView(props: ResourceMemoryInterpretationViewProps) {
  const { projection } = props;
  const key = projection.status === "ready"
    ? JSON.stringify([projection.anchorKey, projection.requestId, projection.memory])
    : JSON.stringify([projection.status, projection.detail]);
  return <CurrentInterpretation key={key} {...props} />;
}
