import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import { currentGptScalarAttentionKernelTab, sourceAssociationRecord } from "../src/content/current-kernel-sources";
import { validateCurriculum } from "../src/content/validate";

describe("GPT scalar current source and retained historical rejection", () => {
  it("keeps the existing negative role while authenticating only the current snapshot", () => {
    const source = readFileSync("examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention_current.rs");
    const historical = readFileSync("examples/gfx950_gpt_oss_decode/src/kernel_scalar_attention.rs");
    const lesson = lessons.find((item) => item.id === "gfx950-gpt-oss-120b-megakernel")!;
    expect(lesson.tabs).toHaveLength(13);
    expect(lesson.tabs[6]).toBe(currentGptScalarAttentionKernelTab);
    expect(lesson.tabs[6].label).toBe("Scalar attention [COMPILER-REJECTED]");
    expect(source.byteLength).toBe(24772);
    expect(source.toString()).toBe(lesson.tabs[6].code);
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "7acece0280e117d64cfe28b673413535fb35ad5f94afd092208173cc051ff0f9",
    );
    expect(historical.byteLength).toBe(22857);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(
      "e2e326a500c92bf1cbd33acb364f707bf339a54ee3259b79875c079a9f967c96",
    );
    expect(sourceAssociationRecord("gpt-scalar-attention-current-source-v1").authority)
      .toBe("source-association-only");
    expect(lesson.tabs[6].notice).toContain("3d10825df93a86644cc5a5b006cadd45f71afb91");
    expect(lesson.tabs[6].notice).toContain("does not establish acceptance or rejection");
    expect(lesson.tabs[5].label).toBe("BF16 LDS pipeline [COMPILER-REJECTED]");
    expect(lesson.tabs[5].sourceCommit).toBe("3d10825df93a86644cc5a5b006cadd45f71afb91");
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
