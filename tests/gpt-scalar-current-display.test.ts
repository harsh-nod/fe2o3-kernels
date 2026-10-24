import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import { currentGptScalarAttentionKernelTab, sourceAssociationRecord } from "../src/content/current-kernel-sources";
import { tabEvidenceSource } from "../src/content/evidence-catalog";
import { validateSourceEvidence } from "../scripts/source-evidence";
import { validateCurriculum } from "../src/content/validate";

describe("GPT scalar current source and retained historical rejection", () => {
  // These values were checked against the nine exact Git blobs at d670b3c.
  // File and displayed-function contracts intentionally have separate digests.
  const currentViews = [
  {
    "ordinal": 0,
    "bytes": 21538,
    "sha256": "4fbd84c0a5d264256f6058acc838007033fea20b01f19ae03a46e80c36522c27",
    "fileSha256": "bb825281caa03f0d35fa8e84b524ea15ff4e6c8b7628da4709f6a66abe0da3d5"
  },
  {
    "ordinal": 1,
    "bytes": 18791,
    "sha256": "85a5282cbbb5d4efeda4d317d20dda257e65eaa12fb5d959aa6de0d01e960d5f",
    "fileSha256": "85a5282cbbb5d4efeda4d317d20dda257e65eaa12fb5d959aa6de0d01e960d5f"
  },
  {
    "ordinal": 2,
    "bytes": 21995,
    "sha256": "7e660694fd103f66e0ce478765f537ef70ee2f39aaa90dfe8d66fd65f5bb0125",
    "fileSha256": "7e660694fd103f66e0ce478765f537ef70ee2f39aaa90dfe8d66fd65f5bb0125"
  },
  {
    "ordinal": 3,
    "bytes": 22141,
    "sha256": "b824977e006449ae3ff21b82bc76b15a287621ffc581ae7ab39a9c74e42805dc",
    "fileSha256": "b824977e006449ae3ff21b82bc76b15a287621ffc581ae7ab39a9c74e42805dc"
  },
  {
    "ordinal": 4,
    "bytes": 24864,
    "sha256": "72bb8858eec772eb4a68a28a9ac6a36b23e0c6ae40fc5c640484700244d144ab",
    "fileSha256": "72bb8858eec772eb4a68a28a9ac6a36b23e0c6ae40fc5c640484700244d144ab"
  },
  {
    "ordinal": 5,
    "bytes": 24164,
    "sha256": "15798c5d8dc2089fd05b9234ab9153faa10ed20cd88f59c54fde88f0a45ac502",
    "fileSha256": "15798c5d8dc2089fd05b9234ab9153faa10ed20cd88f59c54fde88f0a45ac502"
  },
  {
    "ordinal": 6,
    "bytes": 25577,
    "sha256": "5531e12d47e1d3c39c6b56a01335f97fd669fa4d0b8b709633a53cccab4d5a9d",
    "fileSha256": "5531e12d47e1d3c39c6b56a01335f97fd669fa4d0b8b709633a53cccab4d5a9d"
  },
  {
    "ordinal": 7,
    "bytes": 2632,
    "sha256": "f4f361e44d8cf56348d1189aa012ebeb2a83efc1833eaa110ea4f095ce22bd84",
    "fileSha256": "7dbb9ace1ae62e6b5296de0da640e2afff50626b8a2105cdfc3224073030c8d6"
  },
  {
    "ordinal": 8,
    "bytes": 5508,
    "sha256": "af497bc07612baab01054194c727a399fca037a9a8d2db70a337c7f606af9c92",
    "fileSha256": "af497bc07612baab01054194c727a399fca037a9a8d2db70a337c7f606af9c92"
  }
] as const;
  it.each(currentViews)("authenticates current GPT tab $ordinal and rejects byte substitution", (entry) => {
    const lesson = lessons.find((item) => item.id === "gfx950-gpt-oss-120b-megakernel")!;
    const tab = lesson.tabs[entry.ordinal];
    const path = tab.sourcePath!.replace(/(\.[^.]+)$/u, "_current$1");
    const file = readFileSync(path);
    expect(createHash("sha256").update(file).digest("hex")).toBe(entry.fileSha256);
    expect(tab.sourceCommit).toBe("d670b3cfc3a04f39dcf37bd9e6b3d3bf1a9bbfba");
    expect(Buffer.byteLength(tab.code)).toBe(entry.bytes);
    expect(createHash("sha256").update(tab.code).digest("hex")).toBe(entry.sha256);
    expect(tab.sourceSha256).toBe(entry.sha256);
    const source = tabEvidenceSource(lesson.id, tab)!;
    expect(() => validateSourceEvidence(source, file)).not.toThrow();
    // The source guard must still reject a forged file or displayed excerpt.
    const changed = { ...tab, code: tab.code + "\n// substituted source\n" };
    expect(() => validateSourceEvidence(source, Buffer.from("substituted source"))).toThrow();
    if (!tab.explanatory) {
      expect(() => validateSourceEvidence(tabEvidenceSource(lesson.id, changed)!, file)).toThrow();
    }
  });

  it("reports current paired results while retaining the historical rejection", () => {
    const source = readFileSync("examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention_current.rs");
    const historical = readFileSync("examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs");
    const lesson = lessons.find((item) => item.id === "gfx950-gpt-oss-120b-megakernel")!;
    expect(lesson.tabs).toHaveLength(13);
    expect(lesson.tabs[6]).toBe(currentGptScalarAttentionKernelTab);
    expect(lesson.tabs[6].label).toBe("Scalar attention");
    expect(source.byteLength).toBe(25577);
    expect(lesson.tabs[6].sourceCommit).toBe("d670b3cfc3a04f39dcf37bd9e6b3d3bf1a9bbfba");
    expect(source.toString()).toBe(lesson.tabs[6].code);
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "5531e12d47e1d3c39c6b56a01335f97fd669fa4d0b8b709633a53cccab4d5a9d",
    );
    expect(historical.byteLength).toBe(22857);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(
      "e2e326a500c92bf1cbd33acb364f707bf339a54ee3259b79875c079a9f967c96",
    );
    expect(sourceAssociationRecord("gpt-scalar-attention-current-source-v1").authority)
      .toBe("source-association-only");
    expect(lesson.tabs[6].notice).toContain("3d10825df93a86644cc5a5b006cadd45f71afb91");
    expect(lesson.tabs[6].notice).toContain("do not transfer");
    expect(lesson.tabs[5].label).toBe("BF16 LDS pipeline");
    expect(lesson.tabs[5].sourceCommit).toBe("d670b3cfc3a04f39dcf37bd9e6b3d3bf1a9bbfba");
    expect(lesson.tabs[5].notice).toContain("full HSA numerical oracle");
    expect(lesson.tabs[6].notice).toContain("The paired source is public");
    expect(lesson.tabs[6].notice).toContain("No formal qualification");
    expect(lesson.tabs.find((tab) => tab.kind === "verus")?.code)
      .toContain("NO VERUS RESULT IS CLAIMED FOR THIS RUST SOURCE.");
    expect(lesson.tabs.find((tab) => tab.kind === "result")?.code)
      .toContain("3d10825df93a86644cc5a5b006cadd45f71afb91");
  });

  it("rejects moving the exact current scalar view to another tab", () => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons)
      .find((item) => item.id === "gfx950-gpt-oss-120b-megakernel")!;
    [lesson.tabs[5], lesson.tabs[6]] = [lesson.tabs[6], lesson.tabs[5]];
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "code tab does not match its exact source-only association",
    }));
  });

  it("keeps exact primary-kernel provenance required for existing primary associations", () => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons)
      .find((item) => item.id === "gemm-tiling")!;
    delete lesson.tabs[0].evidenceId;
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "promoted algorithm kernel lacks exact source provenance",
    }));
  });

  it.each(["sourceCommit", "sourceSha256"] as const)("rejects changed current %s", (field) => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons)
      .find((item) => item.id === "gfx950-gpt-oss-120b-megakernel")!;
    lesson.tabs[6][field] = "f".repeat(field === "sourceCommit" ? 40 : 64);
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "code tab does not match its exact source-only association",
    }));
  });
});
