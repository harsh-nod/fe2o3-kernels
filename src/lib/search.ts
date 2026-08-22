import type {
  GlossaryEntry,
  Lesson,
  LessonBlock,
} from "../content/model";
import { narrativeEntry } from "../content/narrative-registry";

export interface SearchResult {
  id: string;
  kind: "lesson" | "section" | "diagnostic" | "glossary";
  title: string;
  context: string;
  lessonId: string;
  hash?: string;
}

function blockText(block: LessonBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text;
    case "bullets":
    case "steps":
      return block.items.join(" ");
    case "links":
      return block.items.map((item) => `${item.label} ${item.href}`).join(" ");
    case "callout":
      return `${block.title} ${block.text}`;
    case "table":
      return [...block.headers, ...block.rows.flat()].join(" ");
    case "compile-failures":
      return [
        block.heading,
        block.intro,
        ...block.examples.flatMap((example) => [
          example.id,
          example.title,
          example.source,
          example.diagnostic,
          example.property,
          example.stage,
          example.code,
          example.enforcement,
          example.caught,
        ]),
      ].join(" ");
  }
}

function matchScore(
  terms: string[],
  title: string,
  body: string,
): number | null {
  const normalizedTitle = title.toLocaleLowerCase();
  const normalizedBody = body.toLocaleLowerCase();
  if (!terms.every((term) =>
    normalizedTitle.includes(term) || normalizedBody.includes(term)
  )) return null;
  return terms.reduce(
    (score, term) =>
      score +
      (normalizedTitle === term ? 8 : normalizedTitle.includes(term) ? 4 : 1),
    0,
  );
}

export function searchCatalog(
  query: string,
  lessons: Lesson[],
  glossary: GlossaryEntry[],
  limit = 12,
): SearchResult[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    const featured = ["compiler-checks", "gfx942-setup", "typed-vecadd"];
    return featured
      .map((id) => lessons.find((lesson) => lesson.id === id))
      .filter((lesson): lesson is Lesson => Boolean(lesson))
      .slice(0, limit)
      .map((lesson) => ({
        id: `lesson-${lesson.id}`,
        kind: "lesson",
        title: lesson.title,
        context: `Module ${lesson.module} | ${lesson.summary}`,
        lessonId: lesson.id,
      }));
  }

  const results: Array<SearchResult & { score: number }> = [];
  for (const lesson of lessons) {
    const claimText = lesson.claims.flatMap((claim) => [
      claim.label,
      claim.detail,
      ...(claim.reference?.commands ?? []),
      ...(claim.reference?.sourcePaths ?? []),
    ]).join(" ");
    const tabText = lesson.tabs.flatMap((tab) => [
      tab.label,
      tab.code,
      tab.notice ?? "",
      tab.sourcePath ?? "",
    ]).join(" ");
    const lessonScore = matchScore(
      terms,
      lesson.title,
      [lesson.summary, ...lesson.objectives, ...lesson.glossary, claimText, tabText].join(" "),
    );
    if (lessonScore !== null) {
      results.push({
        id: `lesson-${lesson.id}`,
        kind: "lesson",
        title: lesson.title,
        context: `Module ${lesson.module} | ${lesson.summary}`,
        lessonId: lesson.id,
        score: lessonScore + 2,
      });
    }

    for (const section of lesson.sections) {
      if (section.kind !== "narrative") continue;
      const entry = narrativeEntry(section.narrativeId);
      const sectionBody = entry.blocks
        .map((block) => blockText(block as LessonBlock))
        .join(" ");
      const sectionScore = matchScore(terms, entry.title, sectionBody);
      if (sectionScore !== null) {
        results.push({
          id: `section-${section.narrativeId}`,
          kind: "section",
          title: entry.title,
          context: lesson.title,
          lessonId: lesson.id,
          hash: entry.sectionId,
          score: sectionScore + 1,
        });
      }

      for (const block of entry.blocks) {
        if (block.type !== "compile-failures") continue;
        for (const example of block.examples) {
          const body = [
            example.id,
            example.diagnostic,
            example.property,
            example.stage,
            example.code,
            example.enforcement,
            example.caught,
          ].join(" ");
          const diagnosticScore = matchScore(terms, example.title, body);
          if (diagnosticScore !== null) {
            results.push({
              id: `diagnostic-${example.id}`,
              kind: "diagnostic",
              title: `${example.id}: ${example.title}`,
              context: `${lesson.title} | ${example.property}`,
              lessonId: lesson.id,
              hash: entry.sectionId,
              score: diagnosticScore + 3,
            });
          }
        }
      }
    }
  }

  for (const entry of glossary) {
    const score = matchScore(terms, entry.term, entry.definition);
    if (score !== null) {
      results.push({
        id: `glossary-${entry.term}`,
        kind: "glossary",
        title: entry.term,
        context: entry.definition,
        lessonId: entry.lessonId,
        score,
      });
    }
  }

  return results
    .sort((left, right) =>
      right.score - left.score || left.title.localeCompare(right.title)
    )
    .slice(0, limit)
    .map((result) => ({
      id: result.id,
      kind: result.kind,
      title: result.title,
      context: result.context,
      lessonId: result.lessonId,
      ...(result.hash ? { hash: result.hash } : {}),
    }));
}
