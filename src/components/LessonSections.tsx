import { AlertTriangle, CircleHelp, Info, ShieldCheck } from "lucide-react";
import type { CalloutTone, LessonBlock, LessonSection } from "../content/model";
import { narrativeEntry } from "../content/narrative-registry";
import { stagedEvidenceRows } from "../content/staged-evidence";

const calloutIcons = {
  info: Info,
  proof: ShieldCheck,
  warning: AlertTriangle,
  boundary: CircleHelp,
} satisfies Record<CalloutTone, typeof Info>;

function NarrativeBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === "paragraph") {
      return <p key={index}>{block.text}</p>;
    }
    if (block.type === "bullets") {
      return (
        <ul key={index}>
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    }
    if (block.type === "steps") {
      return (
        <ol className="lesson-steps" key={index}>
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ol>
      );
    }
    if (block.type === "table") {
      return (
        <div className="table-scroll" key={index}>
          <table>
            <thead>
              <tr>
                {block.headers.map((header) => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    const Icon = calloutIcons[block.tone];
    return (
      <aside className={`callout callout-${block.tone}`} key={index}>
        <Icon size={19} aria-hidden="true" />
        <div>
          <strong>{block.title}</strong>
          <p>{block.text}</p>
        </div>
      </aside>
    );
  });
}

export function LessonSections({ sections }: { sections: LessonSection[] }) {
  return (
    <div className="lesson-sections">
      {sections.map((section) => {
        if (section.kind === "narrative") {
          const entry = narrativeEntry(section.narrativeId);
          return (
            <section id={entry.sectionId} key={section.narrativeId}>
              <h2>{entry.title}</h2>
              <NarrativeBlocks blocks={entry.blocks} />
            </section>
          );
        }
        return (
          <section id="staged-tiled-evidence" key="staged-tiled-evidence">
            <h2>Staged tiled GEMM evidence</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Staged evidence</th>
                    <th>Atomic assertions</th>
                    <th>Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {stagedEvidenceRows(section.evidenceIds).map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => <td key={cell}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
