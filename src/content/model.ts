import type { NarrativeId } from "./narrative-policy";

export const FE2O3_PIN = {
  commit: "acb3d2752e4e50e4f4a99ebfc4b180eb79160930",
  shortCommit: "acb3d275",
  tree: "f53fdf76950e392d74c17c20e0999a7727305d49",
  rustToolchain: "nightly-2026-04-03",
  target: "gfx942:xnack-",
  repository: "https://github.com/harsh-nod/fe2o3",
} as const;

export type EvidenceKind =
  | "runnable-now"
  | "source-model-verified"
  | "compiler-hsaco-observed"
  | "gpu-observed"
  | "design-only";

interface EvidenceReferenceBase {
  commit: string;
  tree: string;
  commands: string[];
  sourcePaths: string[];
  target?: string;
  note?: string;
}

export interface LessonEvidenceReference extends EvidenceReferenceBase {
  scope: "lesson-evidence";
}

export type StagedEvidenceAuthority =
  | "source-admission-only"
  | "harness-only"
  | "structural-admission-only"
  | "kernel-ir-admission-only"
  | "source-model-only"
  | "source-shape-only"
  | "machine-inspection-only"
  | "wire-format-only"
  | "inert-worker-handoff-only"
  | "sealed-profile-registry-only";

export type StagedEvidenceId =
  | "tiled-source-bridge-v1"
  | "tiled-cargo-metadata-v1"
  | "tiled-cargo-root-v1"
  | "tiled-hardware-harness-v1"
  | "tiled-structural-admission-v1"
  | "tiled-lds-kernel-ir-v1"
  | "tiled-lds-verus-v1"
  | "tiled-lds-attributed-source-v1"
  | "tiled-lds-machine-inspection-v1"
  | "tiled-lds-kphase-model-v2"
  | "tiled-lds-hardware-observation-v1"
  | "tiled-lds-k32-machine-inspection-v2"
  | "tiled-lds-wg64-contract-v1"
  | "tiled-lds-grid-stride-model-v3"
  | "tiled-lds-source-ir-correspondence-v1"
  | "tiled-lds-grid-machine-inspection-v3"
  | "tiled-lds-edge-kernel-ir-v4"
  | "tiled-lds-edge-machine-inspection-v4"
  | "tiled-lds-source-model-correspondence-v1"
  | "tiled-lds-matrix-wire-v5"
  | "tiled-lds-inert-worker-handoff-v1"
  | "tiled-lds-sealed-profile-registry-v1";

export type CompletedIssue94IncrementId =
  | "tiled-lds-direct-finalization-v1"
  | "tiled-lds-host-adapter-v1"
  | "tiled-lds-protected-lifecycle-v1";

export type SourceMilestoneId =
  | "wave64-collectives-source-v1"
  | "workgroup-sync-source-v1";

export type CodeTabEvidenceId =
  | StagedEvidenceId
  | CompletedIssue94IncrementId
  | SourceMilestoneId;

export interface StagedEvidenceReference extends EvidenceReferenceBase {
  scope: "staged-progress";
  evidenceId: StagedEvidenceId;
  claim: EvidenceKind;
  authority: StagedEvidenceAuthority;
}

export interface SourceMilestoneEvidenceReference
  extends EvidenceReferenceBase {
  scope: "source-milestone";
  evidenceId: SourceMilestoneId;
  claim: "source-model-verified";
  authority: "source-model-only";
}

export type EvidenceReference =
  | LessonEvidenceReference
  | StagedEvidenceReference
  | SourceMilestoneEvidenceReference;

export interface Claim {
  kind: EvidenceKind;
  label: string;
  detail: string;
  reference?: EvidenceReference;
}

export type CalloutTone = "info" | "proof" | "warning" | "boundary";

export type LessonBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "links"; items: { label: string; href: string }[] }
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

export interface NarrativeLessonSection {
  kind: "narrative";
  narrativeId: NarrativeId;
}

export interface StagedEvidenceLessonSection {
  kind: "staged-evidence";
  evidenceIds: StagedEvidenceId[];
}

export type LessonSection =
  | NarrativeLessonSection
  | StagedEvidenceLessonSection;

export type CodeTabKind = "kernel" | "verus" | "host" | "result";

export interface CodeTab {
  kind: CodeTabKind;
  label: string;
  language: "rust" | "bash" | "text";
  code: string;
  sourcePath?: string;
  sourceCommit?: string;
  sourceSha256?: string;
  evidenceId?: CodeTabEvidenceId;
  explanatory?: boolean;
  notice?: string;
}

export type DiagramKind =
  | "evidence"
  | "indexing"
  | "memory"
  | "reduction"
  | "gemm"
  | "attention"
  | "moe";

export interface Exercise {
  prompt: string;
  hint: string;
  acceptance: string;
}

export interface Lesson {
  id: string;
  module: number;
  order: number;
  title: string;
  summary: string;
  duration: string;
  prerequisites: string[];
  objectives: string[];
  claims: Claim[];
  sections: LessonSection[];
  tabs: CodeTab[];
  diagram?: DiagramKind;
  exercises: Exercise[];
  glossary: string[];
}

export interface CurriculumModule {
  number: number;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  lessonId: string;
}

export const evidenceLabels: Record<
  EvidenceKind,
  { short: string; description: string }
> = {
  "runnable-now": {
    short: "Runnable now",
    description: "An exact current fe2o3 path builds and executes this kernel.",
  },
  "source-model-verified": {
    short: "Verus model",
    description:
      "Verus checks a source or source-model property; machine refinement is separate.",
  },
  "compiler-hsaco-observed": {
    short: "HSACO mechanics",
    description:
      "Compiler, LLVM, linker, or code-object mechanics have focused tests.",
  },
  "gpu-observed": {
    short: "GPU observed",
    description:
      "A documented hardware run exists for a pinned target and command.",
  },
  "design-only": {
    short: "Design only",
    description:
      "The lesson is an implementation and proof plan, not a runnable fe2o3 kernel.",
  },
};

export function sourceUrl(
  path: string,
  commit: string = FE2O3_PIN.commit,
): string {
  return `${FE2O3_PIN.repository}/blob/${commit}/${path}`;
}

export function pinnedReference(
  commands: string[],
  sourcePaths: string[],
  options: Pick<LessonEvidenceReference, "target" | "note"> = {},
): LessonEvidenceReference {
  return {
    scope: "lesson-evidence",
    commit: FE2O3_PIN.commit,
    tree: FE2O3_PIN.tree,
    commands,
    sourcePaths,
    ...options,
  };
}

export function stagedReference(
  reference: Omit<StagedEvidenceReference, "scope">,
): StagedEvidenceReference {
  return { scope: "staged-progress", ...reference };
}
