import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import baselineSchemaDocument from "../config/tutorial-compiler-baseline-report-schema-v1.json";
import thresholdSchemaDocument from "../config/tutorial-compiler-no-regression-threshold-schema-v1.json";
import hardwareSchemaDocument from "../config/tutorial-gfx942-hardware-evidence-schema-v1.json";
import qualificationRecordSchemaDocument from "../config/tutorial-compiler-qualification-record-schema-v1.json";
import manifestSchemaDocument from "../config/tutorial-kernel-manifest-schema-v1.json";
import capabilityBatchSchemaDocument from "../config/tutorial-capability-qualification-batch-schema-v1.json";
import manifestDocument from "../config/tutorial-kernel-manifest-v1.json";
import { tutorialCorpusContractSha256 } from "../scripts/tutorial-corpus-contract.mjs";
import { lessons } from "../src/content/curriculum";
import { operatorCookbook } from "../src/content/operator-cookbook";
import { semanticCorrectnessMilestone } from "../src/content/semantic-correctness-milestone";

type Fixture = {
  compilerInput: unknown;
  fixtureId: string;
  testId: string;
  testPath: string;
  target: string;
  matrix: {
    caseId: string;
    runnerPath: string;
    artifactName: string;
    runnerArguments: string[];
    environment: string[];
  } | null;
};

type Entry = {
  lessonId: string;
  siteEvidenceKind: string;
  classification: string;
  packageManifest: string;
  sourcePaths: string[];
  compilerFixtureIds: string[];
  requiredGates: string[];
};

type CapabilityKernel = {
  fixtureId: string;
  kernelSymbol: string;
  lessonIds: string[];
  capabilityClosure: {
    requirements: string[];
    sha256: string | null;
    status: "complete" | "incomplete" | "not-produced" | "unsupported";
  };
  productionCapabilityPath: {
    evidence: Record<string, string> | null;
    path: "canonical-capability" | "legacy" | "none" | string;
    status: "complete" | "incomplete" | "legacy-only" | "unsupported" | string;
  };
  proofRequirements: {
    checkerSha256: string | null;
    evidenceSha256: string | null;
    obligationSetSha256: string | null;
    properties: string[];
    status: "complete" | "missing" | "unsupported" | string;
  };
  requiredProperties: string[];
  targetMatrix: Array<Record<string, unknown>>;
  simulatorCommand: Record<string, unknown>;
  hardwareCommand: Record<string, unknown>;
  negativeFixtureCoverage: { cases: unknown[]; status: string };
};

type Manifest = {
  schema: string;
  roadmapIssue: string;
  baseline: {
    compilerCommit: string;
    compilerTree: string;
    status: "migration" | "qualified";
  };
  productionContract: {
    pipelineEntry: string;
    requiredPolicyVersion: number;
    requiresFinalOptimizedGraphVerification: boolean;
    allowsPipelineSelection: boolean;
    allowsFallback: boolean;
  };
  capabilityContract: {
    roadmapIssue: string;
    status: "migration" | "qualified";
    allowsExactProfileFallback: boolean;
    allowsLegacyFallback: boolean;
  };
  capabilityKernels: CapabilityKernel[];
  qualification: {
    evidenceSchemaPath: string;
    hardwareTargets: Array<Record<string, unknown>>;
    suites: Array<{
      suiteId: string;
      gate: string;
      availability: string;
      command: unknown;
      unavailableReason: string | null;
      coverage: Array<{ fixtureIds: string[]; lessonId: string }>;
    }>;
  };
  compilerFixtures: Fixture[];
  entries: Entry[];
};

const manifest = manifestDocument as Manifest;
const validator = resolve("scripts/validate-tutorial-compiler-corpus.mjs");
const sharedSchemaNames = [
  "tutorial-kernel-manifest-schema-v1.json",
  "tutorial-semantic-expectation-schema-v1.json",
  "tutorial-semantic-qualification-evidence-schema-v1.json",
  "tutorial-capability-qualification-batch-schema-v1.json",
];
const isolatedEnvironment = { ...process.env, FE2O3_COMPILER_REPOSITORY: "" };
const sourceIsaV2Implementation = {
  collectionBytes: 4797,
  collectionSha256: "0a5627abbf4550e209adb923f873caa68065237e21ee5219fba9272647891072",
  fixturePath: "crates/fe2o3-hsaco-finalize/tests/fixtures/production-v12-source-isa-characteristic-v2.json",
  schema: "fe2o3-source-isa-characteristic-v2",
  status: "admitted-production-shaped-worker-v3-v12",
  targetProfile: "gfx942:xnack-",
};
const sourceIsaV2Unavailable = {
  collectionBytes: 0,
  collectionSha256: null,
  inspectionStatus: "not-contained-pre-finalization",
  status: "unavailable-direct-link-no-protected-finalizer",
};

function git(directory: string, ...arguments_: string[]) {
  const result = spawnSync("git", ["-C", directory, ...arguments_], {
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) {
    throw new Error(`git ${arguments_.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trimEnd();
}

function writeCompilerManifestHistory(
  document: Manifest,
  directory: string,
  mutateBaseline?: (document: Manifest) => void,
) {
  const repository = resolve(directory, "compiler");
  mkdirSync(repository);
  git(repository, "init", "--quiet");
  git(repository, "config", "user.name", "Corpus Test");
  git(repository, "config", "user.email", "corpus@example.invalid");
  writeFileSync(resolve(repository, "candidate-a.txt"), "measured candidate\n");
  git(repository, "add", "candidate-a.txt");
  git(repository, "commit", "--quiet", "-m", "candidate A");
  document.baseline = {
    compilerCommit: git(repository, "rev-parse", "HEAD"),
    compilerTree: git(repository, "rev-parse", "HEAD^{tree}"),
    status: "migration",
  };
  mutateBaseline?.(document);
  mkdirSync(resolve(repository, "config"));
  for (const name of sharedSchemaNames) {
    for (const file of [name, name.replace(/\.json$/u, ".sha256")]) {
      writeFileSync(resolve(repository, "config", file), readFileSync(resolve("config", file)));
    }
  }
  const bytes = `${JSON.stringify(document, null, 2)}\n`;
  writeFileSync(resolve(repository, "config/tutorial-kernel-manifest-v1.json"), bytes);
  writeFileSync(
    resolve(repository, "config/tutorial-kernel-manifest-v1.sha256"),
    `${digest(bytes)}  ${relative(resolve("."), resolve(directory, "tutorial-kernel-manifest-v1.json"))}\n`,
  );
  git(repository, "add", "config");
  git(repository, "commit", "--quiet", "-m", "candidate B");
  return repository;
}

function digest(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalValue(item)]),
    );
  }
  return value;
}

function writeQualificationRecord(document: Manifest, directory: string) {
  const candidate = { commit: "1".repeat(40), tree: "2".repeat(40), worktreeClean: true };
  document.baseline = { compilerCommit: candidate.commit, compilerTree: candidate.tree, status: "qualified" };
  prepareSyntheticQualifiedCorpus(document);
  const requirements = new Map(
    document.compilerFixtures.map((fixture) => [
      fixture.fixtureId,
      { hardware: false, reference: false, simulator: false },
    ]),
  );
  for (const entry of document.entries) {
    for (const fixtureId of entry.compilerFixtureIds) {
      const required = requirements.get(fixtureId)!;
      required.hardware ||= entry.requiredGates.includes("hardware");
      required.reference ||= entry.requiredGates.includes("cpu-reference");
      required.simulator ||= entry.requiredGates.includes("semantic-simulation");
    }
  }
  const targets = Array.from(new Set(document.compilerFixtures.map((fixture) => fixture.target))).sort();
  const hardwareTargets = Array.from(new Set(
    document.compilerFixtures
      .filter((fixture) => requirements.get(fixture.fixtureId)!.hardware)
      .map((fixture) => fixture.target),
  )).sort();
  const semanticSha = "3".repeat(64);
  const hardwareSha = new Map(hardwareTargets.map((target, index) => [target, String(index + 4).repeat(64)]));
  const baselineReports = targets.map((target, index) => ({
    bytes: 1,
    schema: "fe2o3-tutorial-compiler-baseline-report-v1",
    sha256: String(index + 6).repeat(64),
    target,
  }));
  const candidateManifestBytes = `${JSON.stringify(document, null, 2)}\n`;
  const record = {
    schema: "fe2o3-tutorial-compiler-qualification-record-v1",
    roadmapIssue: "https://github.com/harsh-nod/fe2o3/issues/271",
    authority: {
      compilerAuthority: false,
      hardwareAuthority: false,
      launchAuthority: false,
      loadAuthority: false,
      publicationAuthority: false,
    },
    candidate,
    sourceIsaCharacteristicV2: structuredClone(sourceIsaV2Implementation),
    contracts: {
      amdCostModelRevision: 2,
      amdPolicyVersion: 2,
      amdResourceModelRevision: 3,
      canonicalKirVersion: 12,
      finalOptimizedGraphVerification: true,
      inspectionFormatVersion: 2,
      neutralPolicyVersion: 4,
      pipelineEntry: "rustc-codegen-fe2o3::production_pipeline",
      targetReplayEvidenceVersion: 9,
    },
    evidence: {
      baselineReports,
      hardware: hardwareTargets.map((target) => ({
        bytes: 1,
        schema: `fe2o3-tutorial-${target}-hardware-evidence-v1`,
        sha256: hardwareSha.get(target),
        target,
      })),
      semantic: {
        bytes: 1,
        schema: "fe2o3-tutorial-semantic-qualification-evidence-v1",
        sha256: semanticSha,
      },
      thresholds: baselineReports.map((baseline, index) => ({
        baselineReportSha256: baseline.sha256,
        bytes: 1,
        schema: "fe2o3-tutorial-compiler-no-regression-thresholds-v1",
        selfGate: "passed",
        sha256: String(index + 8).repeat(64),
        target: baseline.target,
      })),
    },
    fixtures: [...document.compilerFixtures]
      .sort((left, right) => left.fixtureId.localeCompare(right.fixtureId))
      .map((fixture) => {
        const required = requirements.get(fixture.fixtureId)!;
        const inspection = digest(`inspection:${fixture.fixtureId}`);
        return {
          fixtureId: fixture.fixtureId,
          target: fixture.target,
          testId: fixture.testId,
          productionCompile: {
            finalTargetKirSha256: digest(`target:${fixture.fixtureId}`),
            finalVerifiedKirSha256: digest(`verified:${fixture.fixtureId}`),
            inspectionRecordSha256: inspection,
            sourceIsaCharacteristicV2: structuredClone(sourceIsaV2Unavailable),
            status: "passed",
          },
          semantic: {
            evidenceSha256: semanticSha,
            reference: required.reference ? "passed" : "not-required",
            referenceSuiteIds: required.reference ? ["cpu-reference-suite"] : [],
            simulator: required.simulator ? "passed" : "not-required",
            simulatorSuiteIds: required.simulator ? ["semantic-simulation-suite"] : [],
          },
          hardware: required.hardware ? {
            caseId: fixture.matrix?.caseId ?? fixture.fixtureId,
            compilerInspectionSha256: inspection,
            evidenceSha256: hardwareSha.get(fixture.target),
            hostLogSha256: digest(`host:${fixture.fixtureId}`),
            hsacoSha256: digest(`hsaco:${fixture.fixtureId}`),
            llvmIrSha256: digest(`llvm:${fixture.fixtureId}`),
            required: true,
            status: "passed",
          } : {
            caseId: null,
            compilerInspectionSha256: null,
            evidenceSha256: null,
            hostLogSha256: null,
            hsacoSha256: null,
            llvmIrSha256: null,
            required: false,
            status: "not-required",
          },
        };
      }),
    measuredCorpus: {
      corpusContractSha256: tutorialCorpusContractSha256(document),
      manifestBytes: Buffer.byteLength(candidateManifestBytes),
      manifestPath: "config/tutorial-kernel-manifest-v1.json",
      rawManifestSha256: digest(candidateManifestBytes),
    },
  };
  const recordPath = resolve(directory, "tutorial-compiler-qualification-record-v1.json");
  const digestPath = resolve(directory, "tutorial-compiler-qualification-record-v1.sha256");
  const bytes = `${JSON.stringify(canonicalValue(record), null, 2)}\n`;
  writeFileSync(recordPath, bytes);
  writeFileSync(digestPath, `${digest(bytes)}  tutorial-compiler-qualification-record-v1.json\n`);
  document.baseline = {
    compilerCommit: candidate.commit,
    compilerTree: candidate.tree,
    status: "qualified",
  };
  return { record, recordPath, digestPath };
}

function withTemporaryCorpus(
  mutate: (document: Manifest, directory: string) => string[],
) {
  const directory = mkdtempSync(resolve(tmpdir(), "fe2o3-site-corpus-"));
  try {
    const document = structuredClone(manifest);
    const extraArguments = mutate(document, directory);
    const rawMode = extraArguments.some((argument) =>
      ["--baseline-report", "--inspector", "--sidecar"].includes(argument));
    const manifestPath = resolve(directory, "tutorial-kernel-manifest-v1.json");
    const digestPath = resolve(directory, "tutorial-kernel-manifest-v1.sha256");
    const bytes = `${JSON.stringify(document, null, 2)}\n`;
    writeFileSync(manifestPath, bytes);
    writeFileSync(
      digestPath,
      `${digest(bytes)}  ${relative(resolve("."), manifestPath)}\n`,
    );
    return spawnSync(
      process.execPath,
      [
        validator,
        "--manifest",
        manifestPath,
        "--digest",
        digestPath,
        ...(rawMode ? ["--raw-artifacts"] : []),
        ...extraArguments,
      ],
      { encoding: "utf8", env: isolatedEnvironment },
    );
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

function capabilityRecordDigest(domain: string, value: unknown) {
  return createHash("sha256")
    .update(Buffer.from(`${domain}\0`, "ascii"))
    .update(JSON.stringify(canonicalValue(value)), "ascii")
    .digest("hex");
}

function prepareCapabilityPromotion(
  document: Manifest,
  fixtureId = "gfx942-fill-simulation",
) {
  const fixture = document.compilerFixtures.find(
    (candidate) => candidate.fixtureId === fixtureId,
  );
  const kernel = document.capabilityKernels.find(
    (candidate) => candidate.fixtureId === fixtureId,
  );
  if (!fixture || !kernel) throw new Error(`missing capability fixture ${fixtureId}`);

  for (const entry of document.entries.filter((candidate) =>
    candidate.compilerFixtureIds.includes(fixtureId))) {
    entry.classification = "compiler-produced";
    entry.requiredGates = Array.from(new Set([
      ...entry.requiredGates,
      "hardware",
      "production-compile",
      "semantic-simulation",
    ]));
  }

  const identity = (name: string) => digest(`capability:${fixtureId}:${name}`);
  const closureSha256 = identity("closure");
  const finalOptimizedKirSha256 = identity("final-kir");
  const artifactSha256 = identity("artifact");
  const targetCapabilityDecisionSha256 = identity("target-decision");
  const targetIdentitySha256 = identity("target-identity");
  const proofProperties = [
    "capability-provenance",
    "functional-refinement",
    "machine-refinement",
    "source-mir-kir-refinement",
  ];
  const proofObligationSetSha256 = identity("typed-proof-obligation-set");
  const proofCheckerSha256 = identity("proof-checker");
  const proofEvidenceSha256 = identity("proof-evidence");
  const negativeCategories = [
    "abi",
    "alias",
    "bounds",
    "capability-forgery",
    "capability-substitution",
    "evidence",
    "host-invocation",
    "initialization",
    "launch",
    "raw-pointer",
    "stale-output",
    "synchronization",
    "target",
    "unsupported-operation",
  ];
  const negativeCases = negativeCategories.map((category, index) => ({
    category,
    diagnosticCode: `FE2O3-CAP-${String(index + 1).padStart(3, "0")}`,
    failureStage: "static-analysis",
    fixtureId: `capability-negative-${index + 1}`,
    testPath: `tests/capability-negative/${category}.rs`,
  }));
  const negativeFixtureSetSha256 = capabilityRecordDigest(
    "fe2o3-tutorial-capability-negative-fixtures-v1",
    { cases: negativeCases, fixtureId },
  );

  kernel.capabilityClosure = {
    ...kernel.capabilityClosure,
    sha256: closureSha256,
    status: "complete",
  };
  kernel.proofRequirements = {
    checkerSha256: proofCheckerSha256,
    evidenceSha256: proofEvidenceSha256,
    obligationSetSha256: proofObligationSetSha256,
    properties: proofProperties,
    status: "complete",
  };
  kernel.targetMatrix[0].status = "requirements-derived";
  Object.assign(kernel.targetMatrix[1], {
    capabilityDecisionSha256: targetCapabilityDecisionSha256,
    status: "capability-complete",
    targetIdentitySha256,
  });
  const simulatorEvidenceSha256 = identity("simulator-evidence");
  Object.assign(kernel.simulatorCommand, {
    command: structuredClone(document.qualification.suites.find((suite) =>
      suite.gate === "semantic-simulation" && suite.availability === "available" &&
      suite.coverage.some((coverage) => coverage.fixtureIds.includes(fixtureId)))!.command),
    evidenceSha256: simulatorEvidenceSha256,
    reasonCode: null,
    status: "capability-path-qualified",
    subjectSha256: finalOptimizedKirSha256,
    target: fixture.target,
  });
  const hardwareEvidenceSha256 = identity("hardware-evidence");
  Object.assign(kernel.hardwareCommand, {
    evidenceSha256: hardwareEvidenceSha256,
    reasonCode: null,
    status: "capability-path-qualified",
    subjectSha256: artifactSha256,
    target: fixture.target,
  });
  kernel.negativeFixtureCoverage = {
    cases: negativeCases,
    status: "complete",
  };
  kernel.productionCapabilityPath = {
    path: "canonical-capability",
    status: "complete",
    evidence: {
      artifactSha256,
      artifactInspectionSha256: identity("artifact-inspection"),
      capabilityAnalysisSha256: identity("capability-analysis"),
      capabilityClosureSha256: closureSha256,
      compilerCommit: document.baseline.compilerCommit,
      compilerPolicySha256: identity("compiler-policy"),
      compilerTree: document.baseline.compilerTree,
      finalOptimizedKirSha256,
      hardwareEvidenceSha256,
      hostAdmissionSha256: identity("host-admission"),
      launchContractSha256: identity("launch-contract"),
      loweringIdentitySha256: identity("lowering"),
      machineRefinementSha256: identity("machine-refinement"),
      negativeFixtureSetSha256,
      numericalPolicySha256: identity("numerical-policy"),
      proofCheckerSha256,
      proofEvidenceSha256,
      proofObligationSetSha256,
      simulatorEvidenceSha256,
      sourceMirIdentitySha256: identity("source-mir"),
      sourceMirToKirRefinementSha256: identity("source-mir-kir-refinement"),
      targetCapabilityDecisionSha256,
      targetIdentitySha256,
    },
  };
  return kernel;
}

function prepareSyntheticQualifiedCorpus(document: Manifest) {
  // Synthetic records exercise validation only; they are never release evidence.
  document.baseline.status = "qualified";
  document.capabilityContract.status = "qualified";
  document.qualification.hardwareTargets = document.qualification.hardwareTargets.map(({ target }) => ({
    target, status: "required-qualified", lane: `synthetic-${target}`,
  }));
  for (const fixture of document.compilerFixtures) prepareCapabilityPromotion(document, fixture.fixtureId);
}

function qualifyTypedVecadd(
  document: Manifest,
  directory: string,
  sidecarBytes?: Buffer,
  mutation?: "missing-compiler-metrics" | "fabricated-runtime" | "forged-occupancy" | "independent-compiler" | "retired-amd" | "forged-resource-occupancy" | "wrong-corpus-digest",
) {
  const entry = document.entries.find((candidate) => candidate.lessonId === "typed-vecadd");
  if (!entry) throw new Error("typed-vecadd manifest entry is missing");
  prepareSyntheticQualifiedCorpus(document);
  const fixtureId = entry.compilerFixtureIds[0];
  const fixture = document.compilerFixtures.find(
    (candidate) => candidate.fixtureId === fixtureId,
  );
  if (!fixture) throw new Error("typed-vecadd fixture is missing");
  const sidecarPath = resolve(
    directory,
    "vecadd.ll.fe2o3-compiler-inspection-v2",
  );
  const expectedSidecar = sidecarBytes ?? Buffer.from("F2KIRP02missing", "ascii");
  const inspectionSha256 = digest(expectedSidecar);
  const reportPath = resolve(directory, "gfx942-report.json");
  const prospectiveManifest = `${JSON.stringify(document, null, 2)}\n`;
  const report = {
      schema: "fe2o3-tutorial-compiler-baseline-report-v1",
      sourceIsaCharacteristicV2: structuredClone(sourceIsaV2Implementation),
      manifest: {
        path: "config/tutorial-kernel-manifest-v1.json",
        sha256: digest(prospectiveManifest),
        corpusContractSha256: tutorialCorpusContractSha256(document),
      },
      compiler: {
        commit: mutation === "independent-compiler" ? "d".repeat(40) : document.baseline.compilerCommit,
        tree: mutation === "independent-compiler" ? "e".repeat(40) : document.baseline.compilerTree,
        worktreeClean: true,
      },
      measurement: {
        command: "scripts/kernel-compile-matrix.sh --baseline-report <report.json> gfx942",
        target: "gfx942",
        toolchain: "nightly-2026-04-03",
        measuredAtUtc: "2026-09-04T00:00:00Z",
        durationClock: "CLOCK_MONOTONIC",
      },
      pipelineContract: {
        entry: document.productionContract.pipelineEntry,
        requiredPolicyVersion: 4,
        requiredCanonicalKirVersion: 12,
        requiredAmdPolicyVersion: 2,
        requiredAmdCostModelRevision: 2,
        requiredAmdResourceModelRevision: 3,
        requiresFinalOptimizedGraphVerification: true,
      },
      cases: [
        {
          fixtureId,
          testId: fixture.testId,
          familyIds: [entry.lessonId],
          target: fixture.target,
          compileTimeNanoseconds: 1,
          irSizes: {
            inputNeutralKirBytes: 1,
            optimizedNeutralKirBytes: 1,
            canonicalKirBytes: 1,
            llvmIrBytes: 1,
            llvmIrFileCount: 1,
            hsacoBytes: 1,
          },
          pipelineOutcome: {
            compileOnly: "passed",
            policyVersionObserved: 4,
            amdPolicyVersionObserved: 2,
            amdCostModelRevisionObserved: 2,
            amdResourceModelRevisionObserved: 3,
            canonicalKirVersionObserved: 12,
            inspectionRecordSha256: inspectionSha256,
            finalTargetKirSha256: "1".repeat(64),
            finalVerifiedKirSha256: "2".repeat(64),
            finalOptimizedGraphVerificationObserved: true,
            sourceIsaCharacteristicV2: structuredClone(sourceIsaV2Unavailable),
          },
          compilerMetrics: {
            peakResidentSetBytes: 1,
            diagnosticBytes: 0,
            inspectionSidecarBytes: expectedSidecar.length,
            inspectionRecordBytes: expectedSidecar.length,
            neutralPassCount: 9,
            targetPassCount: 7,
            neutralPassWork: 0,
            targetPassWork: 0,
            optimizerCandidates: 0,
            optimizerApplied: 0,
            neutralGraphGrowthBytes: 0,
            targetBindingAndOptimizationGrowthBytes: 0,
            targetResourceModelV3: {
              modelRevision: 3,
              vgprAllocationGranuleDwordsPerLane: 8,
              sgprAllocationGranuleDwordsPerWave: 16,
              input: {
                livenessValues: 0,
                livenessWorkUnits: 0,
                peakLiveVgprDwordsPerLane: 0,
                peakLiveVgprFunction: 0,
                peakLiveSgprDwordsPerWave: 0,
                peakLiveSgprFunction: 0,
                allocatedVgprDwordsPerLane: 0,
                allocatedSgprDwordsPerWave: 0,
                requiredVgprSpillDwordsPerLane: 0,
                requiredSgprSpillDwordsPerWave: 0,
                vgprLimitedWavesPerExecutionUnit: 1,
                sgprLimitedWavesPerExecutionUnit: 1,
                ldsLimitedWavesPerExecutionUnit: null,
                estimatedWavesPerExecutionUnit: 1,
                occupancyComplete: false,
                spillAdmissible: true,
              },
              output: {
                livenessValues: 0,
                livenessWorkUnits: 0,
                peakLiveVgprDwordsPerLane: 0,
                peakLiveVgprFunction: 0,
                peakLiveSgprDwordsPerWave: 0,
                peakLiveSgprFunction: 0,
                allocatedVgprDwordsPerLane: 0,
                allocatedSgprDwordsPerWave: 0,
                requiredVgprSpillDwordsPerLane: 0,
                requiredSgprSpillDwordsPerWave: 0,
                vgprLimitedWavesPerExecutionUnit: 1,
                sgprLimitedWavesPerExecutionUnit: 1,
                ldsLimitedWavesPerExecutionUnit: null,
                estimatedWavesPerExecutionUnit: 1,
                occupancyComplete: false,
                spillAdmissible: true,
              },
              hardwareObserved: false,
              comparisonPolicy: "compiler-policy-identity-only",
              comparisonRationale: "replay-validated compiler estimates are policy evidence, not hardware observations",
            },
          },
          artifactResources: {
            agprCount: 0,
            sgprCount: 0,
            vgprCount: 0,
            sgprSpillCount: 0,
            vgprSpillCount: 0,
            ldsBytes: 0,
            privateSegmentBytes: 0,
            maxFlatWorkgroupSize: 64,
            wavefrontSize: 64,
            minimumWavesPerExecutionUnit: null,
            maximumWavesPerExecutionUnit: null,
            occupancyStatus: "unavailable-not-emitted",
          },
          runtimeMetrics: {
            status: "not-run-compile-only",
            runtimeNanoseconds: null,
          },
          semanticOutcome: { simulator: "not-required", reference: "passed" },
        },
      ],
    };
  const reportCase = report.cases[0] as Record<string, unknown>;
  if (mutation === "wrong-corpus-digest") {
    report.manifest.corpusContractSha256 = "0".repeat(64);
  } else if (mutation === "missing-compiler-metrics") {
    delete reportCase.compilerMetrics;
  } else if (mutation === "fabricated-runtime") {
    reportCase.runtimeMetrics = {
      status: "not-run-compile-only",
      runtimeNanoseconds: 1,
    };
  } else if (mutation === "forged-occupancy") {
    reportCase.artifactResources = {
      ...report.cases[0].artifactResources,
      minimumWavesPerExecutionUnit: 1,
      maximumWavesPerExecutionUnit: 2,
      occupancyStatus: "unavailable-not-emitted",
    };
  } else if (mutation === "retired-amd") {
    report.cases[0].pipelineOutcome.amdPolicyVersionObserved = 1;
  } else if (mutation === "forged-resource-occupancy") {
    report.cases[0].compilerMetrics.targetResourceModelV3.output.occupancyComplete = true;
  }
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (sidecarBytes) writeFileSync(sidecarPath, sidecarBytes);
  return { fixtureId, reportPath, sidecarPath };
}

describe("production compiler tutorial corpus", () => {
  it("is content-addressed and bound to the compiler roadmap", () => {
    const path = resolve("config/tutorial-kernel-manifest-v1.json");
    const digestRecord = readFileSync(
      resolve("config/tutorial-kernel-manifest-v1.sha256"),
      "ascii",
    ).trimEnd();
    const [expectedDigest, recordedPath] = digestRecord.split("  ");

    expect(recordedPath).toBe("config/tutorial-kernel-manifest-v1.json");
    expect(digest(readFileSync(path))).toBe(expectedDigest);
    expect(expectedDigest).toBe(
      "5c59716d406d29ffca814dca917f13d886900c97e31f1f7e23166b62012510ce",
    );
    expect(manifest.schema).toBe("fe2o3-tutorial-kernel-manifest-v1");
    expect(manifest.roadmapIssue).toBe(
      "https://github.com/harsh-nod/fe2o3/issues/271",
    );

    const schemaPath = resolve("config/tutorial-kernel-manifest-schema-v1.json");
    const [schemaDigest, recordedSchemaPath] = readFileSync(
      resolve("config/tutorial-kernel-manifest-schema-v1.sha256"),
      "ascii",
    ).trimEnd().split("  ");
    expect(recordedSchemaPath).toBe("config/tutorial-kernel-manifest-schema-v1.json");
    expect(digest(readFileSync(schemaPath))).toBe(schemaDigest);
    expect(schemaDigest).toBe(
      "1f630842f53aa5a34c4339d0f7b7b5438c164281d4ef8f941567ef0d6f502e73",
    );
  });

  it("uses the compiler's stable domain-separated corpus identity", () => {
    expect(tutorialCorpusContractSha256(manifest)).toBe(
      "878e12ff3af757ac658c3f7b8058278a962893aeb2639e46405f6844f04b7d95",
    );
    const publicationChange = structuredClone(manifest);
    publicationChange.baseline.compilerCommit = "f".repeat(40);
    publicationChange.baseline.compilerTree = "e".repeat(40);
    publicationChange.baseline.status = "qualified";
    expect(tutorialCorpusContractSha256(publicationChange)).toBe(
      tutorialCorpusContractSha256(manifest),
    );
    expect(digest(JSON.stringify(publicationChange))).not.toBe(digest(JSON.stringify(manifest)));
    expect(tutorialCorpusContractSha256(manifest)).not.toBe(
      digest(readFileSync(resolve("config/tutorial-kernel-manifest-v1.json"))),
    );
    const corpusChange = structuredClone(manifest);
    corpusChange.compilerFixtures[0].testPath += ".hostile";
    expect(tutorialCorpusContractSha256(corpusChange)).not.toBe(
      tutorialCorpusContractSha256(manifest),
    );
  });

  it("requires byte-identical compiler-owned manifest state when a compiler checkout is supplied", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const repository = writeCompilerManifestHistory(document, directory);
      return ["--compiler-repository", repository];
    });
    expect(result.status, result.stderr).toBe(0);
  });

  it("rejects canonical-contract hashes and malformed sidecars in place of raw manifest hashes", () => {
    for (const mutation of ["contract-hash", "extra-newline", "wrong-path", "high-bit-byte"] as const) {
      const result = withTemporaryCorpus((document, directory) => {
        const bytes = `${JSON.stringify(document, null, 2)}\n`;
        const manifestPath = resolve(directory, "tutorial-kernel-manifest-v1.json");
        const recordPath = mutation === "wrong-path" ? "config/another-manifest.json" : relative(resolve("."), manifestPath);
        const hash = mutation === "contract-hash" ? tutorialCorpusContractSha256(document) : digest(bytes);
        const digestPath = resolve(directory, "substituted.sha256");
        const record = Buffer.from(`${hash}  ${recordPath}\n${mutation === "extra-newline" ? "\n" : ""}`, "ascii");
        if (mutation === "high-bit-byte") record[0] |= 0x80;
        writeFileSync(digestPath, record);
        return ["--digest", digestPath];
      });
      expect(result.status, mutation).toBe(1);
      expect(result.stderr, mutation).toContain("manifest digest mismatch or noncanonical digest record");
    }
  });

  it("does not let a self-hashed site schema override the compiler's committed schema", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const repository = writeCompilerManifestHistory(document, directory);
      const changed = structuredClone(manifestSchemaDocument);
      changed.required = changed.required.filter((key) => key !== "capabilityKernels");
      const schemaPath = resolve(directory, "tutorial-kernel-manifest-schema-v1.json");
      const digestPath = schemaPath.replace(/\.json$/u, ".sha256");
      const bytes = `${JSON.stringify(changed, null, 2)}\n`;
      writeFileSync(schemaPath, bytes);
      writeFileSync(digestPath, `${digest(bytes)}  ${relative(resolve("."), schemaPath)}\n`);
      return ["--compiler-repository", repository, "--manifest-schema", schemaPath, "--manifest-schema-digest", digestPath];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("config/tutorial-kernel-manifest-schema-v1.json differs byte-for-byte from compiler");
  });

  it("rejects site-only manifest drift against the compiler checkout", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const repository = writeCompilerManifestHistory(document, directory);
      document.entries[0].requiredGates = ["production-compile"];
      return ["--compiler-repository", repository];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("differs byte-for-byte from compiler");
  });

  it("checks every shared schema and digest in committed HEAD, not repaired worktree bytes", () => {
    for (const name of sharedSchemaNames.flatMap((name) => [name, name.replace(/\.json$/u, ".sha256")])) {
      const result = withTemporaryCorpus((document, directory) => {
        const repository = writeCompilerManifestHistory(document, directory);
        const path = resolve(repository, "config", name);
        const original = readFileSync(path);
        writeFileSync(path, Buffer.concat([original, Buffer.from("\n")]));
        git(repository, "add", "config");
        git(repository, "commit", "--quiet", "-m", "drift committed contract");
        writeFileSync(path, original);
        return ["--compiler-repository", repository];
      });
      expect(result.status, name).toBe(1);
      expect(result.stderr, name).toContain(`config/${name} differs byte-for-byte from compiler`);
    }
  }, 15_000);

  it("rejects missing shared contracts without any legacy schema fallback", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const repository = writeCompilerManifestHistory(document, directory);
      git(repository, "rm", "config/tutorial-capability-qualification-batch-schema-v1.json");
      git(repository, "commit", "--quiet", "-m", "omit batch schema");
      return ["--compiler-repository", repository];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("cannot resolve config/tutorial-capability-qualification-batch-schema-v1.json");
  });

  it("requires a real baseline commit owning its tree and ancestral to the selected HEAD", () => {
    for (const mutation of ["missing-commit", "wrong-tree", "non-ancestor"] as const) {
      const result = withTemporaryCorpus((document, directory) => {
        const repository = writeCompilerManifestHistory(document, directory, (candidate) => {
          if (mutation === "missing-commit") candidate.baseline.compilerCommit = "f".repeat(40);
          if (mutation === "wrong-tree") candidate.baseline.compilerTree = "e".repeat(40);
        });
        if (mutation === "non-ancestor") {
          git(repository, "checkout", "--quiet", "--orphan", "independent");
          git(repository, "commit", "--quiet", "-m", "independent snapshot");
        }
        return ["--compiler-repository", repository];
      });
      expect(result.status, mutation).toBe(1);
      expect(result.stderr, mutation).toContain({
        "missing-commit": "cannot resolve measured compiler tree",
        "wrong-tree": "baseline compiler tree differs",
        "non-ancestor": "does not contain the measured baseline commit",
      }[mutation]);
    }
  });

  it("distinguishes available authenticated transport from actual qualification for all fixtures", () => {
    for (const fixture of manifest.compilerFixtures) {
      expect(fixture.matrix?.environment).toContain("FE2O3_TUTORIAL_HARDWARE_PROTOCOL=authenticated-v1");
      const kernel = manifest.capabilityKernels.find((kernel) => kernel.fixtureId === fixture.fixtureId)!;
      expect(kernel.hardwareCommand).toMatchObject({
        status: "available-authenticated-unobserved",
        reasonCode: "awaiting-signed-target-matched-hardware-observation",
        evidenceSha256: null,
        subjectSha256: null,
      });
      expect(kernel.simulatorCommand).toMatchObject({
        status: "unavailable", command: null, evidenceSha256: null, subjectSha256: null,
      });
    }
    for (const mutation of ["reason", "evidence", "subject", "protocol"] as const) {
      const result = withTemporaryCorpus((document) => {
        const record = document.capabilityKernels[0].hardwareCommand;
        if (mutation === "reason") record.reasonCode = "claimed-hardware-run";
        if (mutation === "evidence") record.evidenceSha256 = "a".repeat(64);
        if (mutation === "subject") record.subjectSha256 = "b".repeat(64);
        if (mutation === "protocol") (record.command as { environment: string[] }).environment = [];
        return [];
      });
      expect(result.status, mutation).toBe(1);
      expect(result.stderr, mutation).toContain({
        reason: "invalid authenticated-unobserved reason",
        evidence: "unqualified status cannot carry",
        subject: "unqualified status cannot carry",
        protocol: "bypasses the authenticated hardware protocol",
      }[mutation]);
    }
  });

  it("does not admit a qualified baseline backed by migration or legacy capability records", () => {
    const result = withTemporaryCorpus((document) => {
      document.baseline.status = "qualified";
      return [];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("legacy fallback is forbidden");
  });

  it("validates closed qualification targets and exact lesson/fixture coverage", () => {
    for (const mutation of ["extra-key", "target", "ownership", "duplicate", "omission"] as const) {
      const result = withTemporaryCorpus((document) => {
        const qualification = document.qualification;
        if (mutation === "extra-key") Object.assign(qualification, { qualified: true });
        if (mutation === "target") qualification.hardwareTargets.pop();
        if (mutation === "ownership") qualification.suites[0].coverage[0].lessonId = "typed-vecadd";
        if (mutation === "duplicate") qualification.suites[0].coverage.push(structuredClone(qualification.suites[0].coverage[0]));
        if (mutation === "omission") qualification.suites = qualification.suites.filter((suite) =>
          suite.gate !== "semantic-simulation" || !suite.coverage.some((coverage) => coverage.fixtureIds.includes("gfx942-fill-simulation")));
        return [];
      });
      expect(result.status, mutation).toBe(1);
      expect(result.stderr, mutation).toContain({
        "extra-key": "qualification keys differ",
        target: "hardware targets differ",
        ownership: "crosses fixture lesson ownership",
        duplicate: "duplicates qualification coverage",
        omission: "omits semantic-simulation coverage",
      }[mutation]);
    }
  });

  it("retains every closed shared schema and its exact raw-byte digest", () => {
    for (const name of sharedSchemaNames) {
      const bytes = readFileSync(resolve("config", name));
      const record = readFileSync(resolve("config", name.replace(/\.json$/u, ".sha256")), "ascii");
      expect(record).toBe(`${digest(bytes)}  config/${name}\n`);
      expect(JSON.parse(bytes.toString("utf8"))).toMatchObject({
        $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", additionalProperties: false,
      });
    }
    expect(manifestSchemaDocument.$defs.qualification.properties.suites.items.$ref).toBe("#/$defs/qualificationSuite");
    expect(manifestSchemaDocument.$defs.qualification.properties.hardwareTargets.items.$ref).toBe("#/$defs/qualificationHardwareTarget");
    expect(capabilityBatchSchemaDocument.properties.manifest.required).toEqual(["corpusContractSha256", "path", "rawSha256"]);
    expect(manifestSchemaDocument.$defs.productionEvidence.properties.proofObligationSetSha256.description)
      .toContain("not the raw archive-object SHA-256 or property-list digest");
  });

  it("covers the complete semantic and operator lesson union", () => {
    const expectedLessonIds = Array.from(
      new Set([
        ...semanticCorrectnessMilestone.kernelLessons,
        ...operatorCookbook.flatMap((entry) => entry.lessonIds),
      ]),
    ).sort();
    const actualLessonIds = manifest.entries.map((entry) => entry.lessonId);

    expect(actualLessonIds).toEqual(expectedLessonIds);
    expect(actualLessonIds).toHaveLength(25);
    for (const entry of manifest.entries) {
      const lesson = lessons.find((candidate) => candidate.id === entry.lessonId);
      expect(lesson, entry.lessonId).toBeDefined();
      expect(
        lesson?.claims.some((claim) =>
          claim.kind === entry.siteEvidenceKind ||
          (
            entry.siteEvidenceKind === "compiler-checked" &&
            ["compiler-hsaco-observed", "gpu-observed", "runnable-now"].includes(claim.kind)
          )),
        `${entry.lessonId}: ${entry.siteEvidenceKind}`,
      ).toBe(true);
    }
  });

  it("keeps every pre-capability compiler lesson explicit as legacy coverage", () => {
    const fixtures = new Map(
      manifest.compilerFixtures.map((fixture) => [fixture.fixtureId, fixture]),
    );
    const referenced = new Set<string>();
    expect(fixtures.size).toBe(47);
    for (const entry of manifest.entries) {
      if (["compiler-produced", "legacy-compiler-produced"].includes(entry.classification)) {
        expect(entry.compilerFixtureIds.length, entry.lessonId).toBeGreaterThan(0);
        expect(entry.requiredGates, entry.lessonId).toContain("production-compile");
      } else {
        expect(entry.compilerFixtureIds, entry.lessonId).toEqual([]);
        expect(entry.requiredGates, entry.lessonId).not.toContain("production-compile");
      }
      for (const fixtureId of entry.compilerFixtureIds) {
        expect(fixtures.has(fixtureId), `${entry.lessonId}: ${fixtureId}`).toBe(true);
        referenced.add(fixtureId);
      }
    }
    expect(referenced).toEqual(new Set(fixtures.keys()));
    expect(
      manifest.entries.find((entry) => entry.lessonId === "moe-routing"),
    ).toMatchObject({
      siteEvidenceKind: "compiler-checked",
      classification: "legacy-compiler-produced",
      compilerFixtureIds: ["gfx942-moe-top2"],
      requiredGates: ["cpu-reference", "hardware", "production-compile", "semantic-simulation"],
    });
  });

  it("publishes the closed issue #272 capability schema without fallback", () => {
    expect(manifest.capabilityContract).toMatchObject({
      roadmapIssue: "https://github.com/harsh-nod/fe2o3/issues/272",
      status: "migration",
      allowsExactProfileFallback: false,
      allowsLegacyFallback: false,
    });
    expect(manifestSchemaDocument.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(manifestSchemaDocument.additionalProperties).toBe(false);
    expect(manifestSchemaDocument.required).toEqual(
      expect.arrayContaining(["capabilityContract", "capabilityKernels"]),
    );
    expect(manifest.capabilityKernels).toHaveLength(manifest.compilerFixtures.length);
    expect(manifest.entries.every((entry) => entry.classification === "legacy-compiler-produced"))
      .toBe(true);
    expect(manifest.capabilityKernels.every((kernel) =>
      kernel.capabilityClosure.status === "not-produced" &&
      kernel.proofRequirements.status === "missing" &&
      kernel.productionCapabilityPath.path === "legacy" &&
      kernel.productionCapabilityPath.status === "legacy-only" &&
      kernel.negativeFixtureCoverage.status === "missing"))
      .toBe(true);
  });

  it("requires the exact closed V4 optimized production route", () => {
    expect(manifest.productionContract).toEqual({
      pipelineEntry: "rustc-codegen-fe2o3::production_pipeline",
      requiredPolicyVersion: 4,
      requiresFinalOptimizedGraphVerification: true,
      allowsPipelineSelection: false,
      allowsFallback: false,
    });
    expect(manifest.baseline.status).toBe("migration");
    expect(manifest.entries.every((entry) => !("qualificationStatus" in entry)))
      .toBe(true);
  });

  it("syncs measured report and no-regression schemas without measurements", () => {
    expect(baselineSchemaDocument.title).toContain("measured baseline report v1");
    expect(baselineSchemaDocument.properties.cases.items.required).toEqual(
      expect.arrayContaining([
        "compilerMetrics",
        "artifactResources",
        "runtimeMetrics",
      ]),
    );
    expect(baselineSchemaDocument.properties.cases.items.properties.irSizes.required)
      .toEqual(expect.arrayContaining([
        "inputNeutralKirBytes",
        "optimizedNeutralKirBytes",
        "canonicalKirBytes",
        "llvmIrBytes",
        "hsacoBytes",
      ]));
    expect(baselineSchemaDocument.properties.cases.items.properties.pipelineOutcome.required)
      .toEqual(expect.arrayContaining([
        "policyVersionObserved",
        "amdPolicyVersionObserved",
        "amdCostModelRevisionObserved",
        "amdResourceModelRevisionObserved",
        "canonicalKirVersionObserved",
        "inspectionRecordSha256",
        "finalTargetKirSha256",
        "finalVerifiedKirSha256",
        "finalOptimizedGraphVerificationObserved",
      ]));
    expect(baselineSchemaDocument.properties.cases.items.properties.compilerMetrics.required)
      .toEqual(expect.arrayContaining([
        "peakResidentSetBytes",
        "diagnosticBytes",
        "neutralPassCount",
        "targetPassCount",
        "neutralPassWork",
        "targetPassWork",
        "optimizerCandidates",
        "optimizerApplied",
        "neutralGraphGrowthBytes",
        "targetBindingAndOptimizationGrowthBytes",
        "targetResourceModelV3",
      ]));
    expect(baselineSchemaDocument.properties.cases.items.properties.artifactResources.required)
      .toEqual(expect.arrayContaining([
        "agprCount",
        "sgprCount",
        "vgprCount",
        "sgprSpillCount",
        "vgprSpillCount",
        "ldsBytes",
        "privateSegmentBytes",
        "minimumWavesPerExecutionUnit",
        "maximumWavesPerExecutionUnit",
        "occupancyStatus",
      ]));
    expect(baselineSchemaDocument.properties.cases.items.properties.runtimeMetrics.properties.status.enum)
      .toEqual(["measured", "not-run-compile-only", "unavailable"]);
    expect(thresholdSchemaDocument.title).toContain("no-regression thresholds v1");
    expect(thresholdSchemaDocument.properties.derivation.required).toEqual([
      "maxCompileTimeRegressionBasisPoints",
      "maxSizeRegressionBasisPoints",
      "maxResourceRegressionBasisPoints",
      "maxWorkRegressionBasisPoints",
      "rounding",
    ]);
    expect(thresholdSchemaDocument.properties.families.items.properties.fixtures.items.required)
      .toEqual(expect.arrayContaining([
        "maxPeakResidentSetBytes",
        "maxDiagnosticBytes",
        "maxNeutralPassWork",
        "maxTargetPassWork",
        "maxNeutralGraphGrowthBytes",
        "maxTargetBindingAndOptimizationGrowthBytes",
        "maxAgprCount",
        "maxSgprCount",
        "maxVgprCount",
        "maxLdsBytes",
        "maxPrivateSegmentBytes",
        "minimumMinimumWavesPerExecutionUnit",
        "minimumMaximumWavesPerExecutionUnit",
        "maxRuntimeNanoseconds",
      ]));
    expect(thresholdSchemaDocument.properties.families.items.properties.requiredPipeline.required)
      .toEqual(expect.arrayContaining([
        "neutralPolicyVersion",
        "amdPolicyVersion",
        "amdCostModelRevision",
        "amdResourceModelRevision",
        "canonicalKirVersion",
        "finalOptimizedGraphVerification",
    ]));
    expect(hardwareSchemaDocument.properties.target.properties.profile.const).toBe(
      "gfx942:xnack-",
    );
    expect(hardwareSchemaDocument.properties.cases.items.properties.observations.properties.compilerModel.properties)
      .toMatchObject({
        canonicalKirVersion: { const: 12 },
        summaryFieldCount: { const: 55 },
      });
    expect(baselineSchemaDocument.properties.sourceIsaCharacteristicV2.$ref)
      .toBe("#/$defs/sourceIsaV2ImplementationEvidence");
    expect(hardwareSchemaDocument.properties.sourceIsaCharacteristicV2.$ref)
      .toBe("#/$defs/sourceIsaV2ImplementationEvidence");
    expect(qualificationRecordSchemaDocument.properties.schema.const).toBe(
      "fe2o3-tutorial-compiler-qualification-record-v1",
    );
    expect(qualificationRecordSchemaDocument.properties.authority.properties)
      .toMatchObject({
        compilerAuthority: { const: false },
        hardwareAuthority: { const: false },
        publicationAuthority: { const: false },
      });
    expect(qualificationRecordSchemaDocument.properties.evidence.required)
      .toContain("thresholds");

    const documentation = readFileSync(
      resolve("docs/compiler-corpus-qualification-v1.md"),
      "utf8",
    );
    for (const contract of [
      "peak resident set size",
      "optimizer work",
      "unavailable-not-emitted",
      "not-run-compile-only",
      "integer-ceiling margins",
      "extra, missing, or duplicate",
      "changed occupancy metadata",
      "runtime ceiling; a compile-only `null`",
    ]) {
      expect(documentation).toContain(contract);
    }
  });

  it("rejects byte-level drift in every shared M9 schema", () => {
    const baseline = withTemporaryCorpus((_document, directory) => {
      const changed = structuredClone(baselineSchemaDocument);
      changed.properties.cases.items.required = changed.properties.cases.items.required
        .filter((field) => field !== "compilerMetrics");
      const schemaPath = resolve(directory, "tutorial-compiler-baseline-report-schema-v1.json");
      writeFileSync(schemaPath, `${JSON.stringify(changed, null, 2)}\n`);
      return ["--baseline-schema", schemaPath];
    });
    expect(baseline.status).toBe(1);
    expect(baseline.stderr).toContain("differs from the compiler M9 contract");

    const thresholds = withTemporaryCorpus((_document, directory) => {
      const changed = structuredClone(thresholdSchemaDocument);
      changed.properties.derivation.required = changed.properties.derivation.required
        .filter((field) => field !== "maxWorkRegressionBasisPoints");
      const schemaPath = resolve(
        directory,
        "tutorial-compiler-no-regression-threshold-schema-v1.json",
      );
      writeFileSync(schemaPath, `${JSON.stringify(changed, null, 2)}\n`);
      return ["--threshold-schema", schemaPath];
    });
    expect(thresholds.status).toBe(1);
    expect(thresholds.stderr).toContain("differs from the compiler M9 contract");

    const hardware = withTemporaryCorpus((_document, directory) => {
      const changed = structuredClone(hardwareSchemaDocument);
      changed.properties.target.properties.profile.const = "gfx950:xnack-";
      const schemaPath = resolve(directory, "tutorial-gfx942-hardware-evidence-schema-v1.json");
      writeFileSync(schemaPath, `${JSON.stringify(changed, null, 2)}\n`);
      return ["--hardware-schema", schemaPath];
    });
    expect(hardware.status).toBe(1);
    expect(hardware.stderr).toContain("differs from the compiler M9 contract");

    const qualificationRecord = withTemporaryCorpus((_document, directory) => {
      const changed = structuredClone(qualificationRecordSchemaDocument);
      changed.properties.authority.required = changed.properties.authority.required
        .filter((field) => field !== "publicationAuthority");
      const schemaPath = resolve(directory, "tutorial-compiler-qualification-record-schema-v1.json");
      writeFileSync(schemaPath, `${JSON.stringify(changed, null, 2)}\n`);
      return ["--qualification-schema", schemaPath];
    });
    expect(qualificationRecord.status).toBe(1);
    expect(qualificationRecord.stderr).toContain("differs from the compiler M9 contract");
  });

  it("rejects byte drift in the protected Worker V3/V12 Source/ISA fixture", () => {
    const result = withTemporaryCorpus((_document, directory) => {
      const fixturePath = resolve(directory, "source-isa-v2.json");
      const bytes = readFileSync(sourceIsaV2Implementation.fixturePath);
      writeFileSync(fixturePath, Buffer.concat([bytes, Buffer.from("\n")]));
      return ["--source-isa-v2-fixture", fixturePath];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Source/ISA V2 fixture");
  });

  it("validates the tracked Candidate A record offline across the Candidate B publication edit", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = writeQualificationRecord(document, directory);
      return [
        "--qualification-record",
        qualification.recordPath,
        "--qualification-record-digest",
        qualification.digestPath,
      ];
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("validated tutorial compiler corpus");
  });

  it("rejects hostile offline record authority, join, pin, and digest mutations", () => {
    for (const mutation of [
      "authority",
      "semantic-join",
      "hardware-join",
      "inspection-join",
      "threshold-join",
      "threshold-self-gate",
      "candidate-pin",
      "source-isa-fixture",
      "source-isa-observation",
      "digest",
    ] as const) {
      const result = withTemporaryCorpus((document, directory) => {
        const qualification = writeQualificationRecord(document, directory);
        if (mutation === "digest") {
          writeFileSync(qualification.digestPath, `${"0".repeat(64)}  tutorial-compiler-qualification-record-v1.json\n`);
        } else {
          const changed = structuredClone(qualification.record);
          if (mutation === "authority") changed.authority.publicationAuthority = true;
          if (mutation === "semantic-join") changed.fixtures[0].semantic.evidenceSha256 = "f".repeat(64);
          if (mutation === "hardware-join") {
            const hardwareFixture = changed.fixtures.find((fixture) => fixture.hardware.required)!;
            hardwareFixture.hardware.evidenceSha256 = "f".repeat(64);
          }
          if (mutation === "inspection-join") {
            const hardwareFixture = changed.fixtures.find((fixture) => fixture.hardware.required)!;
            hardwareFixture.hardware.compilerInspectionSha256 = "f".repeat(64);
          }
          if (mutation === "threshold-join") {
            changed.evidence.thresholds[0].baselineReportSha256 = "f".repeat(64);
          }
          if (mutation === "threshold-self-gate") changed.evidence.thresholds[0].selfGate = "failed";
          if (mutation === "candidate-pin") changed.candidate.commit = "f".repeat(40);
          if (mutation === "source-isa-fixture") {
            changed.sourceIsaCharacteristicV2.collectionSha256 = "f".repeat(64);
          }
          if (mutation === "source-isa-observation") {
            changed.fixtures[0].productionCompile.sourceIsaCharacteristicV2.status = "passed";
          }
          const bytes = `${JSON.stringify(canonicalValue(changed), null, 2)}\n`;
          writeFileSync(qualification.recordPath, bytes);
          writeFileSync(
            qualification.digestPath,
            `${digest(bytes)}  tutorial-compiler-qualification-record-v1.json\n`,
          );
        }
        return [
          "--qualification-record",
          qualification.recordPath,
          "--qualification-record-digest",
          qualification.digestPath,
        ];
      });
      expect(result.status, mutation).toBe(1);
    }
  }, 15_000);

  it("keeps raw artifact reproduction behind an explicit mode", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "fe2o3-site-corpus-raw-mode-"));
    try {
      const manifestPath = resolve(directory, "tutorial-kernel-manifest-v1.json");
      const digestPath = resolve(directory, "tutorial-kernel-manifest-v1.sha256");
      const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
      writeFileSync(manifestPath, bytes);
      writeFileSync(digestPath, `${digest(bytes)}  ${relative(resolve("."), manifestPath)}\n`);
      const result = spawnSync(process.execPath, [
        validator,
        "--manifest",
        manifestPath,
        "--digest",
        digestPath,
        "--baseline-report",
        resolve(directory, "raw-report.json"),
      ], { encoding: "utf8", env: isolatedEnvironment });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("requires explicit --raw-artifacts");
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("rejects missing, duplicate, stale, and non-resolving fixture IDs", () => {
    const missing = withTemporaryCorpus((document) => {
      document.compilerFixtures.splice(0, 1);
      return [];
    });
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("non-resolving fixture ID");

    const duplicate = withTemporaryCorpus((document) => {
      document.compilerFixtures.splice(1, 0, structuredClone(document.compilerFixtures[0]));
      return [];
    });
    expect(duplicate.status).toBe(1);
    expect(duplicate.stderr).toContain("duplicate fixtureId");

    const stale = withTemporaryCorpus((document) => {
      const fixture = structuredClone(document.compilerFixtures.at(-1)!);
      fixture.fixtureId = "zz-unreferenced";
      fixture.testId = "kernel-compile-matrix/gfx950/zz-unreferenced";
      if (!fixture.matrix) throw new Error("expected matrix fixture");
      fixture.matrix.caseId = "zz-unreferenced";
      document.compilerFixtures.push(fixture);
      return [];
    });
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain("compilerInput.contractSha256 is stale");

    const nonresolving = withTemporaryCorpus((document) => {
      const entry = document.entries.find((candidate) => candidate.lessonId === "typed-vecadd")!;
      entry.compilerFixtureIds = ["gfx942-does-not-exist"];
      return [];
    });
    expect(nonresolving.status).toBe(1);
    expect(nonresolving.stderr).toContain("non-resolving fixture ID");
  });

  it("rejects omitted and stale per-kernel capability status", () => {
    const omitted = withTemporaryCorpus((document) => {
      document.capabilityKernels.splice(0, 1);
      return [];
    });
    expect(omitted.status).toBe(1);
    expect(omitted.stderr).toContain("missing capability status");

    const stale = withTemporaryCorpus((document) => {
      document.capabilityKernels[0].capabilityClosure.status = "complete";
      return [];
    });
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain("status and identity are stale");

    const invalid = withTemporaryCorpus((document) => {
      document.capabilityKernels[0].productionCapabilityPath.status = "passed";
      return [];
    });
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("productionCapabilityPath.status is unsupported");
  });

  it("rejects deletion of every issue 272 promotion axis and exact evidence identity", () => {
    for (const axis of [
      "capabilityClosure",
      "productionCapabilityPath",
      "proofRequirements",
      "requiredProperties",
      "targetMatrix",
      "simulatorCommand",
      "hardwareCommand",
      "negativeFixtureCoverage",
    ]) {
      const result = withTemporaryCorpus((document) => {
        delete (document.capabilityKernels[0] as unknown as Record<string, unknown>)[axis];
        return [];
      });
      expect(result.status, axis).toBe(1);
      expect(result.stderr, axis).toContain("keys differ");
    }

    const evidenceKeys = [
      "artifactSha256",
      "artifactInspectionSha256",
      "capabilityAnalysisSha256",
      "capabilityClosureSha256",
      "compilerCommit",
      "compilerPolicySha256",
      "compilerTree",
      "finalOptimizedKirSha256",
      "hardwareEvidenceSha256",
      "hostAdmissionSha256",
      "launchContractSha256",
      "loweringIdentitySha256",
      "machineRefinementSha256",
      "negativeFixtureSetSha256",
      "numericalPolicySha256",
      "proofCheckerSha256",
      "proofEvidenceSha256",
      "proofObligationSetSha256",
      "simulatorEvidenceSha256",
      "sourceMirIdentitySha256",
      "sourceMirToKirRefinementSha256",
      "targetCapabilityDecisionSha256",
      "targetIdentitySha256",
    ];
    for (const key of evidenceKeys) {
      const result = withTemporaryCorpus((document) => {
        const kernel = prepareCapabilityPromotion(document);
        delete (kernel.productionCapabilityPath.evidence as Record<string, string>)[key];
        return [];
      });
      expect(result.status, key).toBe(1);
      expect(result.stderr, key).toContain("productionCapabilityPath.evidence keys differ");
    }
  }, 30_000);

  it("rejects hostile substitutions across every issue 272 promotion axis", () => {
    const mutations: Array<{
      expected: string;
      name: string;
      mutate: (kernel: CapabilityKernel) => void;
    }> = [
      {
        name: "empty capability closure",
        expected: "capabilityClosure.requirements must be a nonempty array",
        mutate: (kernel) => { kernel.capabilityClosure.requirements = []; },
      },
      {
        name: "exact-profile fallback",
        expected: "productionCapabilityPath path and status disagree",
        mutate: (kernel) => { kernel.productionCapabilityPath.path = "exact-profile"; },
      },
      {
        name: "empty proof requirements",
        expected: "proofRequirements.properties must be a nonempty array",
        mutate: (kernel) => { kernel.proofRequirements.properties = []; },
      },
      {
        name: "substituted proof evidence",
        expected: "proofRequirements identities are stale",
        mutate: (kernel) => { kernel.proofRequirements.evidenceSha256 = "f".repeat(64); },
      },
      {
        name: "substituted backend target",
        expected: "does not match the compiler fixture target",
        mutate: (kernel) => { kernel.targetMatrix[1].target = "gfx950"; },
      },
      {
        name: "substituted target identity",
        expected: "decision is stale against production evidence",
        mutate: (kernel) => { kernel.targetMatrix[1].targetIdentitySha256 = "f".repeat(64); },
      },
      {
        name: "substituted simulator command",
        expected: "simulatorCommand is stale against qualification.suites",
        mutate: (kernel) => {
          const command = kernel.simulatorCommand.command as { arguments: string[] };
          command.arguments.push("--hostile");
        },
      },
      {
        name: "substituted simulator target",
        expected: "simulatorCommand target does not match",
        mutate: (kernel) => { kernel.simulatorCommand.target = "gfx950"; },
      },
      {
        name: "substituted simulator evidence",
        expected: "command evidence is stale against production evidence",
        mutate: (kernel) => { kernel.simulatorCommand.evidenceSha256 = "f".repeat(64); },
      },
      {
        name: "substituted simulator subject",
        expected: "command evidence is stale against production evidence",
        mutate: (kernel) => { kernel.simulatorCommand.subjectSha256 = "f".repeat(64); },
      },
      {
        name: "substituted hardware command",
        expected: "hardwareCommand is stale against the compiler fixture matrix",
        mutate: (kernel) => {
          const command = kernel.hardwareCommand.command as { executable: string };
          command.executable = "examples/hostile/run-gfx942.sh";
        },
      },
      {
        name: "substituted hardware target",
        expected: "hardwareCommand target does not match",
        mutate: (kernel) => { kernel.hardwareCommand.target = "gfx950"; },
      },
      {
        name: "substituted hardware evidence",
        expected: "command evidence is stale against production evidence",
        mutate: (kernel) => { kernel.hardwareCommand.evidenceSha256 = "f".repeat(64); },
      },
      {
        name: "substituted hardware artifact",
        expected: "command evidence is stale against production evidence",
        mutate: (kernel) => { kernel.hardwareCommand.subjectSha256 = "f".repeat(64); },
      },
      {
        name: "empty negative coverage",
        expected: "complete status requires negative fixtures",
        mutate: (kernel) => { kernel.negativeFixtureCoverage.cases = []; },
      },
      {
        name: "incomplete negative categories",
        expected: "complete negative coverage omits target",
        mutate: (kernel) => {
          kernel.negativeFixtureCoverage.cases = kernel.negativeFixtureCoverage.cases.filter(
            (item) => (item as { category: string }).category !== "target",
          );
        },
      },
      {
        name: "substituted closure identity",
        expected: "evidence is stale against the manifest baseline or closure",
        mutate: (kernel) => {
          (kernel.productionCapabilityPath.evidence as Record<string, string>)
            .capabilityClosureSha256 = "f".repeat(64);
        },
      },
    ];

    for (const mutation of mutations) {
      const result = withTemporaryCorpus((document) => {
        const kernel = prepareCapabilityPromotion(document);
        mutation.mutate(kernel);
        return [];
      });
      expect(result.status, mutation.name).toBe(1);
      expect(result.stderr, mutation.name).toContain(mutation.expected);
    }
  }, 30_000);

  it("rejects partial promotion and every fallback switch", () => {
    const partial = withTemporaryCorpus((document) => {
      prepareCapabilityPromotion(document);
      return [];
    });
    expect(partial.status).toBe(1);
    expect(partial.stderr).toContain(
      "migration capability contract cannot publish compiler-produced entries",
    );

    for (const field of ["allowsLegacyFallback", "allowsExactProfileFallback"] as const) {
      const result = withTemporaryCorpus((document) => {
        document.capabilityContract[field] = true;
        return [];
      });
      expect(result.status, field).toBe(1);
      expect(result.stderr, field).toContain("closed no-fallback classification contract");
    }

    const genericFallback = withTemporaryCorpus((document) => {
      document.productionContract.allowsFallback = true;
      return [];
    });
    expect(genericFallback.status).toBe(1);
    expect(genericFallback.stderr).toContain("pipeline selection and fallback must remain forbidden");
  }, 10_000);

  it("rejects backend assumptions in target-neutral requirements", () => {
    const result = withTemporaryCorpus((document) => {
      const kernel = document.capabilityKernels[0];
      kernel.capabilityClosure.requirements = [
        ...kernel.capabilityClosure.requirements,
        "amd.wave64",
      ].sort();
      kernel.targetMatrix[0].requirements = kernel.capabilityClosure.requirements;
      return [];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("neutral capability requirements contain an AMD assumption");
  });

  it("rejects compiler-produced classification without complete issue #272 evidence", () => {
    const result = withTemporaryCorpus((document) => {
      const entry = document.entries.find((candidate) => candidate.lessonId === "typed-vecadd")!;
      entry.classification = "compiler-produced";
      return [];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("compiler-produced entry lacks required production capability evidence");
  });

  it("rejects forged evidence classifications", () => {
    const result = withTemporaryCorpus((document) => {
      const entry = document.entries.find((candidate) => candidate.lessonId === "gfx950-fp4-gemm")!;
      entry.classification = "design-only";
      entry.compilerFixtureIds = [];
      entry.requiredGates = ["cpu-reference"];
      return [];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("cannot downgrade compiler-checked out of compiler coverage");
  });

  it("requires complete measured coverage once the top-level baseline is qualified", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory);
      return [
        "--baseline-report",
        qualification.reportPath,
        "--inspector",
        process.execPath,
      ];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is missing a measured report");
  });

  it("does not recursively require the measured compiler to equal publication metadata", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory, undefined, "independent-compiler");
      return ["--baseline-report", qualification.reportPath, "--inspector", process.execPath];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is missing a measured report");
    expect(result.stderr).not.toContain("manifest compiler commit and tree");
  });

  it("rejects a report bound only to stale or substituted corpus semantics", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory, undefined, "wrong-corpus-digest");
      return ["--baseline-report", qualification.reportPath, "--inspector", process.execPath];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not bind the exact tutorial manifest");
  });

  it("rejects retired AMD policy and inconsistent dynamic-LDS resource evidence", () => {
    const retired = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory, undefined, "retired-amd");
      return ["--baseline-report", qualification.reportPath, "--inspector", process.execPath];
    });
    expect(retired.status).toBe(1);
    expect(retired.stderr).toContain("V4/AMD V2/resource V3");

    const occupancy = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory, undefined, "forged-resource-occupancy");
      return ["--baseline-report", qualification.reportPath, "--inspector", process.execPath];
    });
    expect(occupancy.status).toBe(1);
    expect(occupancy.stderr).toContain("dynamic LDS conservatively");
  });

  it("does not let a single forged sidecar bypass complete corpus coverage", () => {
    const forged = Buffer.from("NOTAUTHENTICATED", "ascii");
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory, forged);
      return [
        "--baseline-report",
        qualification.reportPath,
        "--inspector",
        process.execPath,
        "--sidecar",
        `${qualification.fixtureId}=${qualification.sidecarPath}`,
      ];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is missing a measured report");
  });

  it("rejects missing M9 compiler resource metrics", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(
        document,
        directory,
        undefined,
        "missing-compiler-metrics",
      );
      return [
        "--baseline-report",
        qualification.reportPath,
        "--inspector",
        process.execPath,
      ];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("keys differ");
    expect(result.stderr).toContain("cases[0]");
  });

  it("rejects invented compile-only runtime and unavailable occupancy", () => {
    const runtime = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(
        document,
        directory,
        undefined,
        "fabricated-runtime",
      );
      return [
        "--baseline-report",
        qualification.reportPath,
        "--inspector",
        process.execPath,
      ];
    });
    expect(runtime.status).toBe(1);
    expect(runtime.stderr).toContain("invents a runtime measurement");

    const occupancy = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(
        document,
        directory,
        undefined,
        "forged-occupancy",
      );
      return [
        "--baseline-report",
        qualification.reportPath,
        "--inspector",
        process.execPath,
      ];
    });
    expect(occupancy.status).toBe(1);
    expect(occupancy.stderr).toContain("invents occupancy");
  });
});
