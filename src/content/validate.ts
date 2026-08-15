import {
  FE2O3_PIN,
  type CurriculumModule,
  type Lesson,
} from "./model";
import {
  isNarrativeId,
  resolveNarrativeOrder,
  stagedEvidenceLessonIds,
  validateNarrativeRegistry,
} from "./narrative-registry";
import {
  isStagedEvidenceId,
  stagedEvidenceDetail,
  stagedEvidenceOrder,
  stagedEvidenceRecord,
  stagedEvidenceReference,
  validateStagedEvidenceCatalog,
} from "./staged-evidence";

const exactObjectName = /^[0-9a-f]{40}$/;
const stagedAuthorities = new Set([
  "source-admission-only",
  "harness-only",
  "structural-admission-only",
  "kernel-ir-admission-only",
  "source-model-only",
  "source-shape-only",
  "machine-inspection-only",
]);
const narrativeSectionKeys = ["kind", "narrativeId"];
const stagedSectionKeys = ["evidenceIds", "kind"];
function hasExactSequence(left: readonly unknown[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateCurriculum(
  modules: CurriculumModule[],
  narratives?: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [
    ...validateStagedEvidenceCatalog().map((message) => ({
      path: "stagedEvidence",
      message,
    })),
    ...validateNarrativeRegistry(narratives).map((message) => ({
      path: "narrativeRegistry",
      message,
    })),
  ];
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

  const stagedSections = lesson.sections.filter(
    (section) => section.kind === "staged-evidence",
  );
  const narrativeSections = lesson.sections.filter(
    (section) => section.kind === "narrative",
  );
  const expectedNarratives = resolveNarrativeOrder(lesson.id);
  const actualNarratives = narrativeSections.map(
    (section) => section.narrativeId,
  );
  if (
    !expectedNarratives ||
    !hasExactSequence(actualNarratives, expectedNarratives)
  ) {
    issues.push({
      path,
      message: "lesson does not contain its exact canonical narrative ID order",
    });
  }
  const hasStagedClaims = lesson.claims.some(
    (claim) => claim.reference?.scope === "staged-progress",
  );
  if (
    (stagedEvidenceLessonIds.some((id) => id === lesson.id) ||
      hasStagedClaims) &&
    stagedSections.length !== 1
  ) {
    issues.push({
      path,
      message: "lesson must contain exactly one canonical staged evidence section",
    });
  }
  for (const [sectionIndex, section] of lesson.sections.entries()) {
    const sectionPath = `${path}.sections[${sectionIndex}]`;
    if (section.kind === "narrative") {
      if (
        !hasExactSequence(Object.keys(section).sort(), narrativeSectionKeys)
      ) {
        issues.push({
          path: sectionPath,
          message: "narrative section accepts only one canonical narrative ID",
        });
      }
      if (!isNarrativeId(section.narrativeId)) {
        issues.push({
          path: sectionPath,
          message: `unknown narrative id ${String(section.narrativeId)}`,
        });
      }
      continue;
    }
    if (section.kind !== "staged-evidence") {
      issues.push({
        path: sectionPath,
        message: "lesson section has no recognized closed render kind",
      });
      continue;
    }
    if (
      !hasExactSequence(Object.keys(section).sort(), stagedSectionKeys)
    ) {
      issues.push({
        path: sectionPath,
        message: "staged evidence section accepts only canonical evidence IDs",
      });
    }
    const evidenceIds = Array.isArray(section.evidenceIds)
      ? section.evidenceIds
      : [];
    for (const evidenceId of evidenceIds) {
      if (!isStagedEvidenceId(evidenceId)) {
        issues.push({
          path: sectionPath,
          message: `unknown staged evidence id ${String(evidenceId)}`,
        });
      }
    }
    if (!hasExactSequence(evidenceIds, stagedEvidenceOrder)) {
      issues.push({
        path: sectionPath,
        message: "staged evidence section must contain the complete canonical ID sequence",
      });
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
      if (!isStagedEvidenceId(reference.evidenceId)) {
        issues.push({
          path: claimPath,
          message: "staged reference has no recognized evidence id",
        });
      } else {
        const record = stagedEvidenceRecord(reference.evidenceId);
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
