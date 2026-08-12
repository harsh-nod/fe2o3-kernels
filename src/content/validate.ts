import { FE2O3_PIN, type CurriculumModule, type Lesson } from "./model";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateCurriculum(
  modules: CurriculumModule[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lessonIds = new Set<string>();
  const moduleNumbers = new Set<number>();

  for (const module of modules) {
    const modulePath = `module[${module.number}]`;
    if (moduleNumbers.has(module.number)) {
      issues.push({ path: modulePath, message: "duplicate module number" });
    }
    moduleNumbers.add(module.number);
    if (module.lessons.length === 0) {
      issues.push({ path: modulePath, message: "module has no lessons" });
    }

    for (const lesson of module.lessons) {
      validateLesson(lesson, module.number, lessonIds, issues);
    }
  }

  return issues;
}

function validateLesson(
  lesson: Lesson,
  moduleNumber: number,
  lessonIds: Set<string>,
  issues: ValidationIssue[],
): void {
  const path = `lesson[${lesson.id}]`;
  if (lessonIds.has(lesson.id)) {
    issues.push({ path, message: "duplicate lesson id" });
  }
  lessonIds.add(lesson.id);
  if (lesson.module !== moduleNumber) {
    issues.push({ path, message: "lesson module does not match its parent" });
  }
  if (lesson.objectives.length < 2 || lesson.sections.length < 2) {
    issues.push({ path, message: "lesson lacks substantive structure" });
  }
  if (lesson.tabs.length !== 4) {
    issues.push({ path, message: "lesson must expose all four code tabs" });
  }
  const tabKinds = new Set(lesson.tabs.map((tab) => tab.kind));
  for (const kind of ["kernel", "verus", "host", "result"] as const) {
    if (!tabKinds.has(kind)) {
      issues.push({ path, message: `missing ${kind} tab` });
    }
  }

  for (const [index, claim] of lesson.claims.entries()) {
    const claimPath = `${path}.claims[${index}]`;
    if (claim.kind === "design-only") {
      if (claim.reference) {
        issues.push({
          path: claimPath,
          message: "design-only claims must not cite execution evidence",
        });
      }
      continue;
    }

    const reference = claim.reference;
    if (!reference) {
      issues.push({ path: claimPath, message: "evidenced claim lacks reference" });
      continue;
    }
    if (reference.commit !== FE2O3_PIN.commit) {
      issues.push({ path: claimPath, message: "claim is not pinned to fe2o3" });
    }
    if (reference.commands.length === 0) {
      issues.push({ path: claimPath, message: "claim has no exact command" });
    }
    if (reference.sourcePaths.length === 0) {
      issues.push({ path: claimPath, message: "claim has no source path" });
    }
    if (
      (claim.kind === "runnable-now" || claim.kind === "gpu-observed") &&
      !reference.target
    ) {
      issues.push({ path: claimPath, message: "runtime claim has no target" });
    }
  }
}
