import publicationData from "../../config/functional-refinement-publication.json";
import publicationGate from "../../config/publication-gate.json";
import { deepFreeze } from "./registry";
import { semanticCorrectnessMilestone } from "./semantic-correctness-milestone";

interface FunctionalRefinementPublicationManifest {
  schema: string;
  status: string;
  compilerCommit: string;
  compilerTree: string;
  fixtureSourcePath: string;
  fixtureSourceSha256: string;
  receiptFixturePath: string;
  receiptFixtureSha256: string;
  runtimeControllerPath: string;
  runtimeControllerSha256: string;
  effectDiagnosticFixturePath: string;
  effectDiagnosticFixtureSha256: string;
  authorityNegativeFixturePath: string;
  authorityNegativeFixtureSha256: string;
  dynamicBoundsSourcePath: string;
  dynamicBoundsSourceSha256: string;
  referenceCompilerCommand: string;
  validationCommands: string[];
}

const manifest =
  publicationData as unknown as FunctionalRefinementPublicationManifest;
const exactObject = /^[0-9a-f]{40}$/u;
const exactSha256 = /^[0-9a-f]{64}$/u;

function isRepositoryPath(path: unknown): path is string {
  return typeof path === "string" &&
    path.trim().length > 0 &&
    !path.startsWith("/") &&
    !path.split("/").includes("..");
}

function validateFunctionalRefinementPublication(): void {
  const sources = [
    [manifest.fixtureSourcePath, manifest.fixtureSourceSha256],
    [manifest.receiptFixturePath, manifest.receiptFixtureSha256],
    [manifest.runtimeControllerPath, manifest.runtimeControllerSha256],
    [
      manifest.effectDiagnosticFixturePath,
      manifest.effectDiagnosticFixtureSha256,
    ],
    [
      manifest.authorityNegativeFixturePath,
      manifest.authorityNegativeFixtureSha256,
    ],
    [manifest.dynamicBoundsSourcePath, manifest.dynamicBoundsSourceSha256],
  ] as const;

  if (
    manifest.schema !==
      "fe2o3-functional-refinement-tutorial-publication-v1" ||
    manifest.status !== "published-current" ||
    !exactObject.test(manifest.compilerCommit) ||
    !exactObject.test(manifest.compilerTree) ||
    sources.some(
      ([path, sha256]) =>
        !isRepositoryPath(path) || !exactSha256.test(sha256),
    ) ||
    manifest.validationCommands.length === 0 ||
    manifest.validationCommands.some(
      (command) => typeof command !== "string" || command.trim().length === 0,
    )
  ) {
    throw new Error("functional-refinement publication manifest is malformed");
  }

  if (
    manifest.compilerCommit !== publicationGate.requiredCommit ||
    manifest.compilerTree !== publicationGate.requiredTree ||
    manifest.compilerCommit !== semanticCorrectnessMilestone.compilerCommit ||
    manifest.compilerTree !== semanticCorrectnessMilestone.compilerTree
  ) {
    throw new Error(
      "functional-refinement, semantic milestone, and publication gate pins differ",
    );
  }

  const referenceCommands = [
    manifest.referenceCompilerCommand,
    ...manifest.validationCommands.filter((command) =>
      command.includes("--test reference_binding_v1"),
    ),
  ];
  if (
    referenceCommands.length < 2 ||
    referenceCommands.some(
      (command) =>
        !command.includes("--features qualification-oracles-test-only"),
    )
  ) {
    throw new Error(
      "reference_binding_v1 publication commands require the qualification oracle feature",
    );
  }
}

validateFunctionalRefinementPublication();

export const functionalRefinementPublication = deepFreeze(manifest);

export const functionalRefinementPublicationSources = deepFreeze([
  {
    label: "functional-reference source fixture",
    sourcePath: manifest.fixtureSourcePath,
    sha256: manifest.fixtureSourceSha256,
  },
  {
    label: "functional-refinement receipt implementation",
    sourcePath: manifest.receiptFixturePath,
    sha256: manifest.receiptFixtureSha256,
  },
  {
    label: "retained proof runtime controller",
    sourcePath: manifest.runtimeControllerPath,
    sha256: manifest.runtimeControllerSha256,
  },
  {
    label: "ranked effect diagnostic fixture",
    sourcePath: manifest.effectDiagnosticFixturePath,
    sha256: manifest.effectDiagnosticFixtureSha256,
  },
  {
    label: "non-authoritative receipt staging negative fixture",
    sourcePath: manifest.authorityNegativeFixturePath,
    sha256: manifest.authorityNegativeFixtureSha256,
  },
  {
    label: "compiler-owned reference bounds discharge",
    sourcePath: manifest.dynamicBoundsSourcePath,
    sha256: manifest.dynamicBoundsSourceSha256,
  },
]);
