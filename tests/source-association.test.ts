import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import {
  currentMoeKernelTab,
  currentVecaddKernelSource,
  currentVecaddKernelTab,
  currentWaveKernelTab,
  currentWorkgroupKernelTab,
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

const cases = [
  {
    id: "wave64-collectives-current-source-v1",
    lessonId: "reductions-scans",
    tab: currentWaveKernelTab,
    example: "wave64_collectives_v1",
    size: 2384,
    historicalId: "wave64-collectives-source-v1",
    historicalLabel: "Historical masked Wave64 source and model",
    historicalSize: 2400,
    historicalDigest: "7c6ead1e7c01a61a8f31a010c9e8cb9bd1c21a905ba61e9d90c6c077c748ffd4",
    claim: "source-model-verified",
    authority: "source-model-only",
  },
  {
    id: "workgroup-sync-current-source-v1",
    lessonId: "lds-barriers-atomics",
    tab: currentWorkgroupKernelTab,
    example: "workgroup_sync_v1",
    size: 2626,
    historicalId: "workgroup-sync-source-v1",
    historicalLabel: "Historical LDS and scoped-atomic sources and model",
    historicalSize: 2832,
    historicalDigest: "991542b783a144598be967ae1671609b2a02a812ca084c3bf6358a9f70968105",
    claim: "source-model-verified",
    authority: "source-model-only",
  },
  {
    id: "moe-top2-current-source-v1",
    lessonId: "moe-routing",
    tab: currentMoeKernelTab,
    example: "moe_top2_v1",
    size: 7332,
    historicalId: "moe-top2-source-v1",
    historicalLabel: "Historical deterministic MoE top-2 source",
    historicalSize: 7364,
    historicalDigest: "0e4570bd52866dd23b8b00d83983aadc818c77580de8f7f5e2982e12a57e20e2",
    claim: "source-tested",
    authority: "source-tested-only",
  },
] as const;
const historicalCommit = "af0fd523e3b774377a9c5192cf0511e34fa19735";
const associationIssue = "code tab does not match its exact source-only association";

it("uses the exact current vecadd source for both positive kernel displays", () => {
  const lesson = lessons.find((entry) => entry.id === "typed-vecadd")!;
  const bytes = readFileSync("examples/vecadd/src/lib_current.rs");
  expect(lesson.tabs).toHaveLength(6);
  expect(lesson.tabs[0]).toEqual({ kind: "kernel", label: "Kernel", ...currentVecaddKernelSource });
  expect(lesson.tabs[5]).toEqual(currentVecaddKernelTab);
  for (const tab of [lesson.tabs[0], lesson.tabs[5]]) {
    expect(Buffer.from(tab.code).equals(bytes)).toBe(true);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(tab.sourceSha256);
    expect(tab.sourcePath).toBe("examples/vecadd/src/lib.rs");
    expect(tab.sourceDigestScope).toBe("file");
    expect(tab.sourceFragments).toBeUndefined();
    expect(tab.code).toContain('include!("vecadd_body.rs")');
    expect(tab.notice).toContain("qualifies no SIMT/tile pair");
    expect(tab.notice).toContain("remain pending");
  }
  expect(lesson.tabs[3].kind).toBe("host");
  expect(lesson.tabs[3].sourcePath).toBe("examples/vecadd/src/main.rs");
});

function changedKernel(lessonId: string, mutate: (tab: CodeTab) => void) {
  const changed = structuredClone(curriculum);
  const lesson = changed.flatMap((module) => module.lessons)
    .find((entry) => entry.id === lessonId)!;
  mutate(lesson.tabs[0]);
  return validateCurriculum(changed);
}

describe.each(cases)("source-only tab association: $lessonId", (entry) => {
  it("reuses the immutable exact tab identity without execution authority", () => {
    const association = sourceAssociationRecord(entry.id);
    expect(association.source).toBe(entry.tab);
    expect(association.lessonId).toBe(entry.lessonId);
    expect(association.authority).toBe("source-association-only");
    expect(Object.isFrozen(association)).toBe(true);
    expect(Object.isFrozen(association.source)).toBe(true);
    expect(isSourceAssociationId(entry.id)).toBe(true);
    expect(isSourceAssociationId("toString")).toBe(false);
    expect(isSourceMilestoneId(entry.id)).toBe(false);
    expect(validateCurriculum(curriculum)).toEqual([]);

    const bytes = readFileSync(`examples/${entry.example}/src/kernel_current.rs`);
    expect(Buffer.byteLength(bytes)).toBe(entry.size);
    expect(Buffer.from(association.source.code).equals(bytes)).toBe(true);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      association.source.sourceSha256,
    );
    expect(association.source.notice).toContain("qualifies no SIMT/tile pair");
    expect(association.source.notice).toContain("remain pending");

    const historical = readFileSync(`examples/${entry.example}/src/kernel.rs`);
    expect(historical.byteLength).toBe(entry.historicalSize);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(entry.historicalDigest);
    const record = sourceMilestoneRecord(entry.historicalId);
    expect(record).toMatchObject({
      claim: entry.claim,
      authority: entry.authority,
      commit: historicalCommit,
      tree: "37ec6083aba26f3057bb21f3a51c619c17bceb49",
      primarySourcePath: `examples/${entry.example}/src/kernel.rs`,
      primarySourceSha256: entry.historicalDigest,
    });
    expect(record.claimLabel).toBe(entry.historicalLabel);
    expect(record.detail).toContain("no longer the active instructional Kernel tab");
    expect(record.detail).toContain("inherits no execution evidence");
    const lesson = lessons.find((lesson) => lesson.id === entry.lessonId)!;
    expect(lesson.tabs[0]).toEqual(entry.tab);
    expect(lesson.tabs).toHaveLength(5);
    expect(lesson.tabs.filter((tab) => tab.kind === "kernel")).toEqual([entry.tab]);
    expect(lesson.tabs.some((tab) => tab.code === historical.toString())).toBe(false);
    expect(lesson.claims.find((claim) =>
      claim.reference?.scope === "source-milestone"
      && claim.reference.evidenceId === entry.historicalId,
    )?.reference?.commit).toBe(historicalCommit);
    expect(lesson.tabs.find((tab) => tab.kind === "result")?.code).toContain(
      "no fresh execution or completed SIMT/tile pair is claimed",
    );
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
    expect(changedKernel(entry.lessonId, mutate)).toContainEqual(
      expect.objectContaining({ message: associationIssue }),
    );
  });

  it("requires the association and rejects historical evidence substitution", () => {
    expect(changedKernel(entry.lessonId, (tab) => { delete tab.evidenceId; }))
      .toContainEqual(expect.objectContaining({
        message: "promoted algorithm kernel lacks exact source provenance",
      }));
    expect(changedKernel(entry.lessonId, (tab) => {
      tab.evidenceId = entry.historicalId;
    })).toContainEqual(expect.objectContaining({
      message: "code tab source commit does not match its evidence",
    }));
  });

  it("rejects another lesson's otherwise valid source-only identity", () => {
    for (const other of cases.filter((candidate) => candidate.id !== entry.id)) {
      expect(changedKernel(entry.lessonId, (tab) => {
        Object.assign(tab, other.tab);
      })).toContainEqual(expect.objectContaining({ message: associationIssue }));
    }
  });

  it.each(["source-tested", "source-model-verified", "gpu-observed"] as const)(
    "rejects promotion of a source-only ID to a %s claim",
    (kind) => {
      const changed = structuredClone(curriculum);
      const lesson = changed.flatMap((module) => module.lessons)
        .find((lesson) => lesson.id === entry.lessonId)!;
      const forged = structuredClone(lesson.claims[0]) as Claim;
      forged.kind = kind;
      const reference = forged.reference as unknown as Record<string, unknown>;
      reference.evidenceId = entry.id;
      reference.claim = kind;
      reference.authority = "source-association-only";
      reference.commit = entry.tab.sourceCommit;
      lesson.claims.push(forged);
      expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
        message: "source milestone has no recognized evidence id",
      }));
    },
  );

  it("checks displayed bytes against the source blob even with unchanged pins", () => {
    const pinned = readFileSync(`examples/${entry.example}/src/kernel_current.rs`);
    const changed = { ...entry.tab, code: entry.tab.code + "\n" };
    const source = tabEvidenceSource(entry.lessonId, changed)!;
    expect(() => validateSourceEvidence(source, pinned)).toThrow(
      "displayed whole file differs from the pinned source file",
    );
  });
});
