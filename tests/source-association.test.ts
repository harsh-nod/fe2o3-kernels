import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import {
  currentWaveKernelTab,
  isSourceAssociationId,
  sourceAssociationRecord,
} from "../src/content/current-kernel-sources";
import { tabEvidenceSource } from "../src/content/evidence-catalog";
import type { Claim, CodeTab } from "../src/content/model";
import {
  isSourceMilestoneId,
  sourceMilestoneRecord,
} from "../src/content/source-milestones";
import { validateCurriculum } from "../src/content/validate";
import { validateSourceEvidence } from "../scripts/source-evidence";

const id = "wave64-collectives-current-source-v1";
const associationIssue = "code tab does not match its exact source-only association";

function changedKernel(mutate: (tab: CodeTab) => void) {
  const changed = structuredClone(curriculum);
  const lesson = changed.flatMap((module) => module.lessons)
    .find((entry) => entry.id === "reductions-scans")!;
  mutate(lesson.tabs[0]);
  return validateCurriculum(changed);
}

describe("source-only tab associations", () => {
  it("reuses the immutable exact tab identity without execution authority", () => {
    const association = sourceAssociationRecord(id);
    expect(association.source).toBe(currentWaveKernelTab);
    expect(association.authority).toBe("source-association-only");
    expect(Object.isFrozen(association)).toBe(true);
    expect(Object.isFrozen(association.source)).toBe(true);
    expect(isSourceAssociationId(id)).toBe(true);
    expect(isSourceAssociationId("toString")).toBe(false);
    expect(isSourceMilestoneId(id)).toBe(false);
    expect(validateCurriculum(curriculum)).toEqual([]);

    const bytes = readFileSync("examples/wave64_collectives_v1/src/kernel_current.rs");
    expect(Buffer.byteLength(bytes)).toBe(2384);
    expect(Buffer.from(association.source.code).equals(bytes)).toBe(true);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      association.source.sourceSha256,
    );
    expect(association.source.notice).toContain("qualifies no SIMT/tile pair");
    expect(association.source.notice).toContain("remain pending");
    expect(sourceMilestoneRecord("wave64-collectives-source-v1")).toMatchObject({
      claim: "source-model-verified",
      authority: "source-model-only",
      commit: "af0fd523e3b774377a9c5192cf0511e34fa19735",
      primarySourceSha256: "7c6ead1e7c01a61a8f31a010c9e8cb9bd1c21a905ba61e9d90c6c077c748ffd4",
    });
    const lesson = lessons.find((entry) => entry.id === "reductions-scans")!;
    expect(lesson.tabs[0]).toEqual(currentWaveKernelTab);
    expect(lesson.claims.find((claim) =>
      claim.reference?.scope === "source-milestone",
    )?.reference?.commit).toBe("af0fd523e3b774377a9c5192cf0511e34fa19735");
  });

  it.each([
    ["commit", (tab: CodeTab) => { tab.sourceCommit = "0".repeat(40); }],
    ["path", (tab: CodeTab) => { tab.sourcePath = "examples/vecadd/src/lib.rs"; }],
    ["digest", (tab: CodeTab) => { tab.sourceSha256 = "0".repeat(64); }],
    ["bytes", (tab: CodeTab) => { tab.code += "\n// substituted source\n"; }],
    ["scope", (tab: CodeTab) => { tab.sourceDigestScope = "displayed"; }],
    ["fragment", (tab: CodeTab) => { tab.sourceFragments = [tab.code]; }],
    ["explanatory", (tab: CodeTab) => { tab.explanatory = true; }],
  ] as const)("rejects changed source association %s", (_name, mutate) => {
    expect(changedKernel(mutate)).toContainEqual(
      expect.objectContaining({ message: associationIssue }),
    );
  });

  it("requires the association and rejects historical evidence substitution", () => {
    expect(changedKernel((tab) => { delete tab.evidenceId; })).toContainEqual(
      expect.objectContaining({
        message: "promoted algorithm kernel lacks exact source provenance",
      }),
    );
    expect(changedKernel((tab) => {
      tab.evidenceId = "wave64-collectives-source-v1";
    })).toContainEqual(expect.objectContaining({
      message: "code tab source commit does not match its evidence",
    }));
  });

  it.each(["source-tested", "source-model-verified", "gpu-observed"] as const)(
    "rejects promotion of a source-only ID to a %s claim",
    (kind) => {
      const changed = structuredClone(curriculum);
      const lesson = changed.flatMap((module) => module.lessons)
        .find((entry) => entry.id === "reductions-scans")!;
      const forged = structuredClone(lesson.claims[0]) as Claim;
      forged.kind = kind;
      const reference = forged.reference as unknown as Record<string, unknown>;
      reference.evidenceId = id;
      reference.claim = kind;
      reference.authority = "source-association-only";
      reference.commit = currentWaveKernelTab.sourceCommit;
      lesson.claims.push(forged);
      expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
        message: "source milestone has no recognized evidence id",
      }));
    },
  );

  it("checks displayed bytes against the source blob even with unchanged pins", () => {
    const pinned = readFileSync("examples/wave64_collectives_v1/src/kernel_current.rs");
    const changed = { ...currentWaveKernelTab, code: currentWaveKernelTab.code + "\n" };
    const source = tabEvidenceSource("reductions-scans", changed)!;
    expect(() => validateSourceEvidence(source, pinned)).toThrow(
      "displayed whole file differs from the pinned source file",
    );
  });
});
