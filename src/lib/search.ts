import type {
  GlossaryEntry,
  Lesson,
  LessonBlock,
} from "../content/model";
import {
  contributorWorkflow,
  learningTracks,
  runTodayMatrix,
  setupPaths,
} from "../content/learning-hub";
import { narrativeEntry } from "../content/narrative-registry";
import { operatorCookbook } from "../content/operator-cookbook";

export interface SearchResult {
  id: string;
  kind: "page" | "operator" | "lesson" | "section" | "diagnostic" | "glossary";
  title: string;
  context: string;
  href: string;
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
        href: `/lesson/${lesson.id}`,
        lessonId: lesson.id,
      }));
  }

  const results: Array<SearchResult & { score: number }> = [];
  const launchPageBody = [
    "start here run today hardware smoke learning tracks setup paths contribution workflow",
    ...learningTracks.flatMap((track) => [
      track.title,
      track.audience,
      track.summary,
      ...track.steps.flatMap((step) => [step.label, step.outcome]),
    ]),
    ...setupPaths.flatMap((path) => [
      path.title,
      path.environment,
      path.command,
      path.expected,
      path.boundary,
    ]),
    ...runTodayMatrix.flatMap((row) => [
      row.operator,
      row.environment,
      row.command,
      row.expected,
      row.boundary,
    ]),
    ...contributorWorkflow.flatMap((step) => [
      step.label,
      step.detail,
      step.check,
    ]),
  ].join(" ");
  const launchScore = matchScore(terms, "Start here", launchPageBody);
  if (launchScore !== null) {
    results.push({
      id: "page-start-here",
      kind: "page",
      title: "Start here",
      context: "Learning tracks, setup paths, runnable commands, and contribution workflow",
      href: "/",
      lessonId: "read-the-evidence",
      score: launchScore + 2,
    });
  }

  const cookbookBody = operatorCookbook.flatMap((entry) => [
    entry.title,
    entry.category,
    entry.computes,
    entry.implementedShape,
    entry.runner,
    entry.expected,
    ...entry.sourcePaths,
    ...entry.referencePaths,
    ...entry.nonClaims,
  ]).join(" ");
  const cookbookScore = matchScore(terms, "Operator cookbook", cookbookBody);
  if (cookbookScore !== null) {
    results.push({
      id: "page-operator-cookbook",
      kind: "page",
      title: "Operator cookbook",
      context: "Compute contracts, source paths, runners, expected results, and non-claims",
      href: "/operators",
      lessonId: "read-the-evidence",
      score: cookbookScore + 2,
    });
  }

  for (const entry of operatorCookbook) {
    const operatorScore = matchScore(
      terms,
      entry.title,
      [
        entry.category,
        entry.computes,
        entry.implementedShape,
        entry.runner,
        entry.expected,
        ...entry.sourcePaths,
        ...entry.referencePaths,
        ...entry.nonClaims,
      ].join(" "),
    );
    if (operatorScore !== null) {
      results.push({
        id: `operator-${entry.id}`,
        kind: "operator",
        title: entry.title,
        context: `${entry.implementedShape} | ${entry.runner}`,
        href: `/operators#${entry.id}`,
        lessonId: entry.lessonId,
        hash: entry.id,
        score: operatorScore + 1,
      });
    }
  }

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
        href: `/lesson/${lesson.id}`,
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
          href: `/lesson/${lesson.id}#${entry.sectionId}`,
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
              href: `/lesson/${lesson.id}#${entry.sectionId}`,
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
        href: `/lesson/${entry.lessonId}`,
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
      href: result.href,
      lessonId: result.lessonId,
      ...(result.hash ? { hash: result.hash } : {}),
    }));
}
