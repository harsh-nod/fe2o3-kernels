import { lessons } from "./curriculum";
import { currentState } from "./current-state";
import {
  functionalRefinementPublication,
  functionalRefinementPublicationSources,
} from "./functional-refinement-publication";
import { semanticCorrectnessMilestone } from "./semantic-correctness-milestone";
import {
  profilerImportFixtureDirectory,
  profilerImportMilestone,
  profilerImportSources,
} from "./profiler-dispatch-import";
import {
  sourceIsaCharacteristicMilestone,
  sourceIsaCharacteristicSources,
  sourceIsaAgentMilestone,
  sourceIsaAgentSources,
} from "./source-isa-agent";

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
  fileSha256?: string;
  displayedSha256?: string;
  displayedSource?: string;
  displayedFragments?: string[];
}

export interface LocalEvidenceArtifact {
  label: string;
  path: string;
  sha256: string;
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
          ...(tab.sourceSha256 && tab.sourceDigestScope === "displayed"
            ? {
                displayedSha256: tab.sourceSha256,
                displayedSource: tab.code,
                displayedFragments: tab.sourceFragments ?? [tab.code],
              }
            : tab.sourceSha256
              ? { fileSha256: tab.sourceSha256 }
              : {}),
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
  sourcePaths: semanticCorrectnessMilestone.mechanisms
    .filter((mechanism) =>
      mechanism.status === "published-current" ||
      mechanism.status === "implemented-unpinned"
    )
    .flatMap((mechanism) => [...mechanism.evidence]),
};

const semanticCorrectnessDigests: GitEvidenceSource[] = [
  {
    label: "per-compilation Verus template",
    commit: semanticCorrectnessMilestone.compilerCommit!,
    sourcePath: semanticCorrectnessMilestone.perCompilationTemplatePath!,
    fileSha256: semanticCorrectnessMilestone.perCompilationTemplateSha256!,
  },
  {
    label: "generated single-output Verus fixture",
    commit: semanticCorrectnessMilestone.compilerCommit!,
    sourcePath:
      semanticCorrectnessMilestone.perCompilationGeneratedFixturePath!,
    fileSha256:
      semanticCorrectnessMilestone.perCompilationGeneratedFixtureSha256!,
  },
  {
    label: "generated multi-output formula-replay Verus fixture",
    commit: semanticCorrectnessMilestone.compilerCommit!,
    sourcePath:
      semanticCorrectnessMilestone.perCompilationMultiOutputFixturePath!,
    fileSha256:
      semanticCorrectnessMilestone.perCompilationMultiOutputFixtureSha256!,
  },
  {
    label: "multi-output formula-substitution negative Verus fixture",
    commit: semanticCorrectnessMilestone.compilerCommit!,
    sourcePath:
      semanticCorrectnessMilestone
        .perCompilationMultiOutputSubstitutionFixturePath!,
    fileSha256:
      semanticCorrectnessMilestone
        .perCompilationMultiOutputSubstitutionFixtureSha256!,
  },
];

const functionalRefinementSources: GitEvidenceObject = {
  label: "functional-refinement publication manifest",
  commit: functionalRefinementPublication.compilerCommit,
  tree: functionalRefinementPublication.compilerTree,
  sourcePaths: functionalRefinementPublicationSources.map(
    (source) => source.sourcePath,
  ),
};

const functionalRefinementDigests: GitEvidenceSource[] =
  functionalRefinementPublicationSources.map((source) => ({
    label: source.label,
    commit: functionalRefinementPublication.compilerCommit,
    sourcePath: source.sourcePath,
    fileSha256: source.sha256,
  }));

const sourceIsaAgentEvidence: GitEvidenceObject = {
  label: "agent-native source/ISA inspection milestone",
  commit: sourceIsaAgentMilestone.compilerCommit,
  tree: sourceIsaAgentMilestone.compilerTree,
  sourcePaths: sourceIsaAgentSources.map((source) => source.path),
};

const sourceIsaCharacteristicEvidence: GitEvidenceObject = {
  label: "source/ISA characteristic tutorial fixture",
  commit: sourceIsaCharacteristicMilestone.compilerCommit!,
  tree: sourceIsaCharacteristicMilestone.compilerTree!,
  sourcePaths: sourceIsaCharacteristicSources.map((source) => source.path),
};

const profilerRevision = profilerImportMilestone.compilerRevision.split(":");
const profilerImportEvidence: GitEvidenceObject[] =
  profilerRevision.length === 2 && profilerRevision.every((part) => /^[0-9a-f]{40}$/u.test(part))
    ? [{
        label: "in-process profiler dispatch import milestone",
        commit: profilerRevision[0],
        tree: profilerRevision[1],
        sourcePaths: profilerImportSources.map((source) => source.path),
      }]
    : [];

const profilerImportLocalArtifacts: LocalEvidenceArtifact[] = [
  ["profiler dialect projection", "dialects.json", profilerImportMilestone.fixtureSha256.dialects],
  ["embedded Capture projection", "capture-projection.json", profilerImportMilestone.fixtureSha256.capture],
  ["Profiler Bundle V4 projection", "bundle-v4-projection.json", profilerImportMilestone.fixtureSha256.bundle],
  ["dispatch import receipt projection", "receipt-v1-projection.json", profilerImportMilestone.fixtureSha256.receipt],
  ["manifest-last projection", "publication-manifest.txt", profilerImportMilestone.fixtureSha256.manifest],
  ["illustrative profiler query requests", "agent-requests.jsonl", profilerImportMilestone.fixtureSha256.requests],
  ["illustrative profiler query responses", "agent-responses.jsonl", profilerImportMilestone.fixtureSha256.responses],
].map(([label, file, sha256]) => ({
  label,
  path: `${profilerImportFixtureDirectory}/${file}`,
  sha256,
}));

export const evidenceCatalog = {
  gitObjects: [
    ...claims,
    currentSources,
    semanticCorrectnessSources,
    functionalRefinementSources,
    sourceIsaAgentEvidence,
    sourceIsaCharacteristicEvidence,
    ...profilerImportEvidence,
  ],
  localArtifacts: profilerImportLocalArtifacts,
  sources: [
    ...tabs,
    ...semanticCorrectnessDigests,
    ...functionalRefinementDigests,
  ],
  issues: currentState.issues.map((issue) => ({
    number: issue.number,
    state: issue.state,
  })),
};
