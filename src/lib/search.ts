import type { GlossaryEntry, Lesson } from "../content/model";

export interface SearchResult {
  id: string;
  kind: "lesson" | "glossary";
  title: string;
  context: string;
  lessonId: string;
}

export function searchCatalog(
  query: string,
  lessons: Lesson[],
  glossary: GlossaryEntry[],
  limit = 12,
): SearchResult[] {
  const terms = query
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return lessons.slice(0, Math.min(limit, 6)).map((lesson) => ({
      id: `lesson-${lesson.id}`,
      kind: "lesson",
      title: lesson.title,
      context: `Module ${lesson.module} · ${lesson.summary}`,
      lessonId: lesson.id,
    }));
  }

  const results: Array<SearchResult & { score: number }> = [];
  for (const lesson of lessons) {
    const title = lesson.title.toLocaleLowerCase();
    const body = [
      lesson.summary,
      ...lesson.objectives,
      ...lesson.glossary,
      ...lesson.sections.map((section) => section.title),
    ]
      .join(" ")
      .toLocaleLowerCase();
    if (terms.every((term) => title.includes(term) || body.includes(term))) {
      results.push({
        id: `lesson-${lesson.id}`,
        kind: "lesson",
        title: lesson.title,
        context: `Module ${lesson.module} · ${lesson.summary}`,
        lessonId: lesson.id,
        score: terms.reduce(
          (score, term) => score + (title.includes(term) ? 4 : 1),
          0,
        ),
      });
    }
  }

  for (const entry of glossary) {
    const term = entry.term.toLocaleLowerCase();
    const definition = entry.definition.toLocaleLowerCase();
    if (
      terms.every(
        (queryTerm) =>
          term.includes(queryTerm) || definition.includes(queryTerm),
      )
    ) {
      results.push({
        id: `glossary-${entry.term}`,
        kind: "glossary",
        title: entry.term,
        context: entry.definition,
        lessonId: entry.lessonId,
        score: terms.reduce(
          (score, queryTerm) => score + (term.includes(queryTerm) ? 3 : 1),
          0,
        ),
      });
    }
  }

  return results
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, limit)
    .map((result) => ({
      id: result.id,
      kind: result.kind,
      title: result.title,
      context: result.context,
      lessonId: result.lessonId,
    }));
}
