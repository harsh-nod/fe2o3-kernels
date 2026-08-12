import { describe, expect, it } from "vitest";
import { curriculum, glossary, lessons } from "../src/content/curriculum";
import { FE2O3_PIN, evidenceLabels } from "../src/content/model";
import { validateCurriculum } from "../src/content/validate";

describe("curriculum integrity", () => {
  it("covers modules zero through eight in order", () => {
    expect(curriculum.map((module) => module.number)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(lessons).toHaveLength(18);
    expect(validateCurriculum(curriculum)).toEqual([]);
  });

  it("uses every evidence label", () => {
    const kinds = new Set(
      lessons.flatMap((lesson) => lesson.claims.map((claim) => claim.kind)),
    );
    expect(kinds).toEqual(new Set(Object.keys(evidenceLabels)));
  });

  it("pins every evidenced claim to exact source and commands", () => {
    for (const lesson of lessons) {
      for (const claim of lesson.claims) {
        if (claim.kind === "design-only") {
          expect(claim.reference).toBeUndefined();
          continue;
        }

        expect(claim.reference?.commit).toBe(FE2O3_PIN.commit);
        expect(claim.reference?.commands.length).toBeGreaterThan(0);
        expect(claim.reference?.sourcePaths.length).toBeGreaterThan(0);
        for (const path of claim.reference?.sourcePaths ?? []) {
          expect(path).not.toMatch(/^\//);
          expect(path).not.toContain("..");
        }
      }
    }
  });

  it("makes every glossary item searchable and navigable", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    expect(glossary.length).toBeGreaterThan(50);
    for (const entry of glossary) {
      expect(entry.term.trim()).not.toBe("");
      expect(entry.definition.length).toBeGreaterThan(20);
      expect(lessonIds.has(entry.lessonId)).toBe(true);
    }
  });

  it("labels advanced source snippets as explanatory", () => {
    for (const lesson of lessons.filter((entry) => entry.module >= 4)) {
      const runnable = lesson.claims.some(
        (claim) => claim.kind === "runnable-now",
      );
      expect(runnable).toBe(false);
      expect(lesson.tabs.find((tab) => tab.kind === "kernel")?.explanatory).toBe(
        true,
      );
    }
  });
});
