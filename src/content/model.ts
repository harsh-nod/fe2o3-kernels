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

export interface EvidenceReference {
  commit: string;
  commands: string[];
  sourcePaths: string[];
  target?: string;
  note?: string;
}

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
  | { type: "callout"; tone: CalloutTone; title: string; text: string }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    };

export interface LessonSection {
  id: string;
  title: string;
  blocks: LessonBlock[];
}

export type CodeTabKind = "kernel" | "verus" | "host" | "result";

export interface CodeTab {
  kind: CodeTabKind;
  label: string;
  language: "rust" | "bash" | "text";
  code: string;
  sourcePath?: string;
  explanatory?: boolean;
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

export function sourceUrl(path: string): string {
  return `${FE2O3_PIN.repository}/blob/${FE2O3_PIN.commit}/${path}`;
}

export function pinnedReference(
  commands: string[],
  sourcePaths: string[],
  options: Pick<EvidenceReference, "target" | "note"> = {},
): EvidenceReference {
  return {
    commit: FE2O3_PIN.commit,
    commands,
    sourcePaths,
    ...options,
  };
}
