import { lessons } from "./curriculum";
import { currentState } from "./current-state";
import { semanticCorrectnessMilestone } from "./semantic-correctness-milestone";

export interface GitEvidenceObject {
  label: string;
  commit: string;
  tree?: string;
  sourcePaths: string[];
}

export interface GitEvidenceSource {
  label: string;
  commit: string;
  sourcePath: string;
  sha256?: string;
}

const claims: GitEvidenceObject[] = lessons.flatMap((lesson) =>
  lesson.claims.flatMap((claim) =>
    claim.reference
      ? [{
          label: `${lesson.id}: ${claim.label}`,
          commit: claim.reference.commit,
          tree: claim.reference.tree,
          sourcePaths: [...claim.reference.sourcePaths],
        }]
      : [],
  ),
);

const tabs: GitEvidenceSource[] = lessons.flatMap((lesson) =>
  lesson.tabs.flatMap((tab) =>
    tab.sourcePath && tab.sourceCommit
      ? [{
          label: `${lesson.id}: ${tab.label}`,
          commit: tab.sourceCommit,
          sourcePath: tab.sourcePath,
          ...(tab.sourceSha256 ? { sha256: tab.sourceSha256 } : {}),
        }]
      : [],
  ),
);

const currentSources: GitEvidenceObject = {
  label: "current compiler capability manifest",
  commit: currentState.compilerCommit,
  tree: currentState.compilerTree,
  sourcePaths: currentState.capabilities.flatMap((capability) => [
    ...capability.sourcePaths,
  ]),
};

const semanticCorrectnessSources: GitEvidenceObject = {
  label: "MIR/PLIRON semantic-correctness milestone",
  commit: semanticCorrectnessMilestone.compilerCommit!,
  tree: semanticCorrectnessMilestone.compilerTree!,
  sourcePaths: semanticCorrectnessMilestone.mechanisms.flatMap((mechanism) => [
    ...mechanism.evidence,
  ]),
};

export const evidenceCatalog = {
  gitObjects: [...claims, currentSources, semanticCorrectnessSources],
  sources: tabs,
  issues: currentState.issues.map((issue) => ({
    number: issue.number,
    state: issue.state,
  })),
};
