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
import manifestDocument from "../config/tutorial-kernel-manifest-v1.json";
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
    "vecadd.ll.fe2o3-compiler-inspection-v1",
  );
  const inspectionSha256 = digest(sidecarBytes ?? Buffer.from("F2KIRP01missing", "ascii"));
  const reportPath = resolve(directory, "gfx942-report.json");
  const prospectiveManifest = `${JSON.stringify(document, null, 2)}\n`;
  writeFileSync(
    reportPath,
    `${JSON.stringify({
      schema: "fe2o3-tutorial-compiler-baseline-report-v1",
      manifest: {
        path: "config/tutorial-kernel-manifest-v1.json",
        sha256: digest(prospectiveManifest),
      },
      compiler: {
        commit: document.baseline.compilerCommit,
        tree: document.baseline.compilerTree,
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
            canonicalKirBytes: 1,
            llvmIrBytes: 1,
            llvmIrFileCount: 1,
            hsacoBytes: 1,
          },
          pipelineOutcome: {
            compileOnly: "passed",
            policyVersionObserved: 4,
            amdPolicyVersionObserved: 1,
            amdCostModelRevisionObserved: 1,
            inspectionRecordSha256: inspectionSha256,
            finalTargetKirSha256: "1".repeat(64),
            finalVerifiedV11Sha256: "2".repeat(64),
            finalOptimizedGraphVerificationObserved: true,
          },
          semanticOutcome: { simulator: "not-required", reference: "passed" },
        },
      ],
    }, null, 2)}\n`,
  );
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
      "c3530c2646ad0c587869e4e642e61c4032703471683dcca95087adebf6913a51",
    );
    expect(manifest.schema).toBe("fe2o3-tutorial-kernel-manifest-v1");
    expect(manifest.roadmapIssue).toBe(
      "https://github.com/harsh-nod/fe2o3/issues/271",
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
    expect(baselineSchemaDocument.properties.cases.items.properties.pipelineOutcome.required)
      .toEqual(expect.arrayContaining([
        "policyVersionObserved",
        "amdPolicyVersionObserved",
        "amdCostModelRevisionObserved",
        "inspectionRecordSha256",
        "finalTargetKirSha256",
        "finalVerifiedV11Sha256",
        "finalOptimizedGraphVerificationObserved",
      ]));
    expect(thresholdSchemaDocument.title).toContain("no-regression thresholds v1");
    expect(thresholdSchemaDocument.properties.families.items.properties.requiredPipeline.required)
      .toEqual(expect.arrayContaining([
        "neutralPolicyVersion",
        "amdPolicyVersion",
        "amdCostModelRevision",
        "finalOptimizedGraphVerification",
      ]));
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
});
