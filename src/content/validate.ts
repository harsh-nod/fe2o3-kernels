import {
  FE2O3_PIN,
  type CurriculumModule,
  type Lesson,
  type LessonBlock,
} from "./model";
import {
  stagedEvidenceDetail,
  stagedEvidenceOrder,
  stagedEvidenceRecords,
  stagedEvidenceReference,
  validateStagedEvidenceCatalog,
} from "./staged-evidence";

const exactObjectName = /^[0-9a-f]{40}$/;
const stagedAuthorities = new Set([
  "source-admission-only",
  "harness-only",
  "structural-admission-only",
]);
const stagedEvidenceMarkers = stagedEvidenceOrder.flatMap((id) => {
  const commit = stagedEvidenceRecords[id].commit;
  return [commit, commit.slice(0, 8)];
});

function unboundBlockText(block: LessonBlock): string[] {
  if (block.type === "staged-evidence") return [];
  if (block.type === "paragraph" || block.type === "callout") {
    return [block.text];
  }
  if (block.type === "bullets" || block.type === "steps") return block.items;
  return [block.headers, ...block.rows].flat();
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateCurriculum(
  modules: CurriculumModule[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = validateStagedEvidenceCatalog().map(
    (message) => ({ path: "stagedEvidence", message }),
  );
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

  for (const [sectionIndex, section] of lesson.sections.entries()) {
    for (const [blockIndex, block] of section.blocks.entries()) {
      if (block.type !== "staged-evidence") continue;
      const blockPath = `${path}.sections[${sectionIndex}].blocks[${blockIndex}]`;
      if (block.evidenceIds.length === 0) {
        issues.push({ path: blockPath, message: "empty staged evidence block" });
      }
      for (const evidenceId of block.evidenceIds) {
        if (!stagedEvidenceRecords[evidenceId]) {
          issues.push({
            path: blockPath,
            message: `unknown staged evidence id ${evidenceId}`,
          });
        }
      }
    }
  }

  const unboundStagedMarker = [
    ...lesson.claims
      .filter((claim) => claim.reference?.scope !== "staged-progress")
      .flatMap((claim) => [claim.label, claim.detail]),
    ...lesson.sections.flatMap((section) =>
      section.blocks.flatMap(unboundBlockText),
    ),
    ...lesson.tabs.map((tab) => tab.code),
  ].find((text) => stagedEvidenceMarkers.some((marker) => text.includes(marker)));
  if (unboundStagedMarker) {
    issues.push({
      path,
      message: "detailed staged prose must be rendered from an evidence record",
    });
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
    if (!exactObjectName.test(reference.commit)) {
      issues.push({ path: claimPath, message: "claim has no exact commit" });
    }
    if (!exactObjectName.test(reference.tree)) {
      issues.push({ path: claimPath, message: "claim has no exact tree" });
    }
    if (reference.scope === "lesson-evidence") {
      if (
        reference.commit !== FE2O3_PIN.commit ||
        reference.tree !== FE2O3_PIN.tree
      ) {
        issues.push({
          path: claimPath,
          message: "lesson claim is not pinned to the lesson evidence tree",
        });
      }
    } else {
      const record = stagedEvidenceRecords[reference.evidenceId];
      if (!record) {
        issues.push({
          path: claimPath,
          message: "staged reference has no recognized evidence id",
        });
      } else {
        const expectedReference = stagedEvidenceReference(record.id);
        if (
          claim.label !== record.claimLabel ||
          claim.detail !== stagedEvidenceDetail([record.id]) ||
          JSON.stringify(reference) !== JSON.stringify(expectedReference)
        ) {
          issues.push({
            path: claimPath,
            message: "staged claim is not derived from its atomic evidence record",
          });
        }
      }
      if (reference.claim !== claim.kind) {
        issues.push({
          path: claimPath,
          message: "staged reference claim label does not match its claim",
        });
      }
      if (!stagedAuthorities.has(reference.authority)) {
        issues.push({
          path: claimPath,
          message: "staged reference has no recognized authority label",
        });
      }
    }
    if (
      reference.commands.length === 0 ||
      reference.commands.some((command) => command.trim().length === 0)
    ) {
      issues.push({ path: claimPath, message: "claim has no exact command" });
    }
    if (
      reference.sourcePaths.length === 0 ||
      reference.sourcePaths.some(
        (sourcePath) =>
          sourcePath.length === 0 ||
          sourcePath.startsWith("/") ||
          sourcePath.split("/").includes(".."),
      )
    ) {
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
