import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
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
import manifestDocument from "../config/tutorial-kernel-manifest-v1.json";
import { tutorialCorpusContractSha256 } from "../scripts/tutorial-corpus-contract.mjs";
import { lessons } from "../src/content/curriculum";
import { operatorCookbook } from "../src/content/operator-cookbook";
import { semanticCorrectnessMilestone } from "../src/content/semantic-correctness-milestone";

type Fixture = {
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
  qualificationStatus: "pending" | "qualified";
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
  qualification: unknown;
  compilerFixtures: Fixture[];
  entries: Entry[];
};

const manifest = manifestDocument as Manifest;
const validator = resolve("scripts/validate-tutorial-compiler-corpus.mjs");

function digest(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function withTemporaryCorpus(
  mutate: (document: Manifest, directory: string) => string[],
) {
  const directory = mkdtempSync(resolve(tmpdir(), "fe2o3-site-corpus-"));
  try {
    const document = structuredClone(manifest);
    const extraArguments = mutate(document, directory);
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
        ...extraArguments,
      ],
      { encoding: "utf8" },
    );
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

function qualifyTypedVecadd(
  document: Manifest,
  directory: string,
  sidecarBytes?: Buffer,
  mutation?: "missing-compiler-metrics" | "fabricated-runtime" | "forged-occupancy" | "independent-compiler" | "retired-amd" | "forged-resource-occupancy" | "wrong-corpus-digest",
) {
  const entry = document.entries.find((candidate) => candidate.lessonId === "typed-vecadd");
  if (!entry) throw new Error("typed-vecadd manifest entry is missing");
  entry.qualificationStatus = "qualified";
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
      "62faa6f1c0204aaf456a99aa7eab85f006179d3fd59f3dd8fa50e6fec828fcd6",
    );
    expect(manifest.schema).toBe("fe2o3-tutorial-kernel-manifest-v1");
    expect(manifest.roadmapIssue).toBe(
      "https://github.com/harsh-nod/fe2o3/issues/271",
    );
  });

  it("uses the compiler's stable domain-separated corpus identity", () => {
    expect(tutorialCorpusContractSha256(manifest)).toBe(
      "0b8c030e4604b9a1dd9f7dd13ab8e9ded6283571a6e2b310cf42619dcd8161ad",
    );
    const publicationChange = structuredClone(manifest);
    publicationChange.baseline.compilerCommit = "f".repeat(40);
    publicationChange.baseline.status = "qualified";
    expect(tutorialCorpusContractSha256(publicationChange)).toBe(
      tutorialCorpusContractSha256(manifest),
    );
    const corpusChange = structuredClone(manifest);
    corpusChange.compilerFixtures[0].testPath += ".hostile";
    expect(tutorialCorpusContractSha256(corpusChange)).not.toBe(
      tutorialCorpusContractSha256(manifest),
    );
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
        lesson?.claims.some((claim) => claim.kind === entry.siteEvidenceKind),
        `${entry.lessonId}: ${entry.siteEvidenceKind}`,
      ).toBe(true);
    }
  });

  it("resolves every compiler-produced lesson through the shared fixture registry", () => {
    const fixtures = new Map(
      manifest.compilerFixtures.map((fixture) => [fixture.fixtureId, fixture]),
    );
    const referenced = new Set<string>();
    expect(fixtures.size).toBe(46);
    for (const entry of manifest.entries) {
      if (entry.classification === "compiler-produced") {
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
      siteEvidenceKind: "source-model-verified",
      classification: "design-only",
      compilerFixtureIds: [],
      requiredGates: ["cpu-reference"],
    });
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
    expect(manifest.entries.every((entry) => entry.qualificationStatus === "pending"))
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
        summaryFieldCount: { const: 52 },
      });

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
    expect(stale.stderr).toContain("stale compiler fixture IDs");

    const nonresolving = withTemporaryCorpus((document) => {
      const entry = document.entries.find((candidate) => candidate.lessonId === "typed-vecadd")!;
      entry.compilerFixtureIds = ["gfx942-does-not-exist"];
      return [];
    });
    expect(nonresolving.status).toBe(1);
    expect(nonresolving.stderr).toContain("non-resolving fixture ID");
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
    expect(result.stderr).toContain("cannot downgrade gpu-observed out of compiler coverage");
  });

  it("rejects a qualified classification with a missing inspection sidecar", () => {
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
    expect(result.stderr).toContain("missing its inspection sidecar");
  });

  it("does not recursively require the measured compiler to equal publication metadata", () => {
    const result = withTemporaryCorpus((document, directory) => {
      const qualification = qualifyTypedVecadd(document, directory, undefined, "independent-compiler");
      return ["--baseline-report", qualification.reportPath, "--inspector", process.execPath];
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("missing its inspection sidecar");
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

  it("rejects forged inspection framing before invoking the compiler decoder", () => {
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
    expect(result.stderr).toContain("forged magic");
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
