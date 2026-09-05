import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifestDocument from "../config/tutorial-kernel-manifest-v1.json";
import { lessons } from "../src/content/curriculum";
import { operatorCookbook } from "../src/content/operator-cookbook";
import { semanticCorrectnessMilestone } from "../src/content/semantic-correctness-milestone";

const manifest = manifestDocument as {
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
  entries: {
    lessonId: string;
    siteEvidenceKind: string;
    classification: string;
    packageManifest: string;
    sourcePaths: string[];
    targets: string[];
    requiredGates: string[];
    qualificationStatus: "pending" | "qualified";
  }[];
};

describe("production compiler tutorial corpus", () => {
  it("is content-addressed and bound to the compiler roadmap", () => {
    const path = resolve("config/tutorial-kernel-manifest-v1.json");
    const digestRecord = readFileSync(
      resolve("config/tutorial-kernel-manifest-v1.sha256"),
      "ascii",
    ).trimEnd();
    const [expectedDigest, recordedPath] = digestRecord.split("  ");

    expect(recordedPath).toBe("config/tutorial-kernel-manifest-v1.json");
    expect(
      createHash("sha256").update(readFileSync(path)).digest("hex"),
    ).toBe(expectedDigest);
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
        entry.lessonId + ": " + entry.siteEvidenceKind,
      ).toBe(true);
    }
  });

  it("cannot classify an attributed tutorial kernel out of production", () => {
    for (const entry of manifest.entries) {
      expect(entry.classification, entry.lessonId).toBe("compiler-produced");
      expect(entry.requiredGates, entry.lessonId).toContain("production-compile");
      expect(entry.packageManifest, entry.lessonId).toMatch(
        /^examples\/[^/]+\/Cargo\.toml$/u,
      );
      expect(entry.sourcePaths.length, entry.lessonId).toBeGreaterThan(0);
      expect(
        entry.sourcePaths.every((path) => /^examples\/[^/]+\/src\/.+\.rs$/u.test(path)),
        entry.lessonId,
      ).toBe(true);
    }
  });

  it("requires one closed optimized and finally verified production route", () => {
    expect(manifest.productionContract).toEqual({
      pipelineEntry: "rustc-codegen-fe2o3::production_pipeline",
      requiredPolicyVersion: 3,
      requiresFinalOptimizedGraphVerification: true,
      allowsPipelineSelection: false,
      allowsFallback: false,
    });
    if (manifest.baseline.status === "qualified") {
      expect(
        manifest.entries.every(
          (entry) => entry.qualificationStatus === "qualified",
        ),
      ).toBe(true);
    }
  });
});
