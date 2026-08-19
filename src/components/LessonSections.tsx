import { AlertTriangle, CircleHelp, ExternalLink, Info, ShieldCheck } from "lucide-react";
import { CompileFailureGallery } from "./CompileFailureGallery";
import type { CalloutTone, LessonBlock, LessonSection } from "../content/model";
import {
  resolveNarrativeEntry,
  resolveNarrativeOrder,
  stagedEvidenceLessonIds,
  type NarrativeRegistryEntry,
} from "../content/narrative-registry";
import type { DeepReadonly } from "../content/registry";
import {
  isStagedEvidenceId,
  stagedEvidenceOrder,
  stagedEvidenceRows,
} from "../content/staged-evidence";

const calloutIcons = {
  info: Info,
  proof: ShieldCheck,
  warning: AlertTriangle,
  boundary: CircleHelp,
} satisfies Record<CalloutTone, typeof Info>;

const narrativeSectionKeys = ["kind", "narrativeId"];
const stagedSectionKeys = ["evidenceIds", "kind"];

type ResolvedLessonSection =
  | {
      kind: "narrative";
      narrativeId: string;
      entry: DeepReadonly<NarrativeRegistryEntry>;
    }
  | {
      kind: "staged-evidence";
      rows: string[][];
    };

function hasExactSequence(
  left: readonly unknown[],
  right: readonly unknown[],
): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

function resolveLessonSections(
  lessonId: string,
  sections: unknown,
): ResolvedLessonSection[] | undefined {
  const expectedNarratives = resolveNarrativeOrder(lessonId);
  if (!expectedNarratives || !Array.isArray(sections)) {
    return undefined;
  }
  const expectsStagedEvidence = stagedEvidenceLessonIds.some(
    (candidate) => candidate === lessonId,
  );
  const resolved: ResolvedLessonSection[] = [];
  let narrativeIndex = 0;
  let stagedCount = 0;

  for (const candidate of sections) {
    if (!candidate || typeof candidate !== "object") return undefined;
    const section = candidate as Record<string, unknown>;
    switch (section.kind) {
      case "narrative": {
        if (
          !hasExactSequence(Object.keys(section).sort(), narrativeSectionKeys) ||
          section.narrativeId !== expectedNarratives[narrativeIndex]
        ) {
          return undefined;
        }
        const entry = resolveNarrativeEntry(section.narrativeId);
        if (!entry) return undefined;
        resolved.push({
          kind: "narrative",
          narrativeId: expectedNarratives[narrativeIndex],
          entry,
        });
        narrativeIndex += 1;
        break;
      }
      case "staged-evidence": {
        if (
          !expectsStagedEvidence ||
          stagedCount !== 0 ||
          !hasExactSequence(Object.keys(section).sort(), stagedSectionKeys) ||
          !Array.isArray(section.evidenceIds) ||
          !hasExactSequence(section.evidenceIds, stagedEvidenceOrder) ||
          !section.evidenceIds.every(isStagedEvidenceId)
        ) {
          return undefined;
        }
        resolved.push({
          kind: "staged-evidence",
          rows: stagedEvidenceRows(section.evidenceIds),
        });
        stagedCount += 1;
        break;
      }
      default:
        return undefined;
    }
  }

  if (
    narrativeIndex !== expectedNarratives.length ||
    stagedCount !== (expectsStagedEvidence ? 1 : 0)
  ) {
    return undefined;
  }
  return resolved;
}

function NarrativeBlocks({
  blocks,
}: {
  blocks: DeepReadonly<LessonBlock[]>;
}) {
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
    if (block.type === "links") {
      return (
        <ul className="issue-links" key={index}>
          {block.items.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.label} <ExternalLink size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
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
    if (block.type === "compile-failures") {
      return (
        <CompileFailureGallery
          heading={block.heading}
          intro={block.intro}
          examples={block.examples}
          key={index}
        />
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

export function LessonSections({
  lessonId,
  sections,
}: {
  lessonId: string;
  sections: readonly LessonSection[];
}) {
  const resolved = resolveLessonSections(lessonId, sections);
  if (!resolved) {
    return (
      <div className="lesson-sections" role="alert">
        <section>
          <h2>Lesson content unavailable</h2>
          <p>This lesson section failed its content policy.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="lesson-sections">
      {resolved.map((section) => {
        switch (section.kind) {
          case "narrative":
            return (
              <section id={section.entry.sectionId} key={section.narrativeId}>
                <h2>{section.entry.title}</h2>
                <NarrativeBlocks blocks={section.entry.blocks} />
              </section>
            );
          case "staged-evidence":
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
                      {section.rows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell) => <td key={cell}>{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
        }
      })}
    </div>
  );
}
