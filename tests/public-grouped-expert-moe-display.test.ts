import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import { currentGroupedExpertMoeKernelTab, sourceAssociationRecord } from "../src/content/current-kernel-sources";
import { validateCurriculum } from "../src/content/validate";

describe("public grouped-expert MoE display and preserved history", () => {
  it("binds the complete public source while retaining historical proof and GPU pins", () => {
    const source = readFileSync("examples/moe_grouped_expert_general_v1/src/kernel_current.rs");
    const historical = readFileSync("examples/moe_grouped_expert_general_v1/src/kernel.rs");
    const lesson = lessons.find((item) => item.id === "moe-expert-compute")!;
    expect(lesson.tabs).toHaveLength(6);
    expect(lesson.tabs[0]).toEqual(currentGroupedExpertMoeKernelTab);
    expect(source.byteLength).toBe(11320);
    expect(source.toString()).toBe(currentGroupedExpertMoeKernelTab.code);
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "9e31980d48320d2978823af76465f882a99263137ba828261f605e74afc110a7",
    );
    expect(currentGroupedExpertMoeKernelTab.sourceCommit).toBe("d558aa97758cf553c956c5ce92178eac96bd2461");
    expect(sourceAssociationRecord("grouped-expert-moe-current-source-v1").authority)
      .toBe("source-association-only");
    expect(currentGroupedExpertMoeKernelTab.notice).toContain("qualifies no SIMT/tile pair");
    expect(historical.byteLength).toBe(6578);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(
      "a4af47e5ab3cad6a16d4b0cd2fc9028d0660469a75914474a7fc0d984934bd0a",
    );
    const gpu = lesson.claims.find((claim) => claim.kind === "gpu-observed")!;
    expect(gpu.reference?.commit).toBe("af0fd523e3b774377a9c5192cf0511e34fa19735");
    expect(gpu.detail).toContain("does not qualify the current Kernel tab");
    expect(lesson.tabs[1].sourceCommit).toBe("308d8fa00fa41e098b2a1a47bbfea1bc29735464");
    expect(lesson.tabs[3].sourceCommit).toBe("308d8fa00fa41e098b2a1a47bbfea1bc29735464");
    expect(lesson.tabs[4].sourceCommit).toBe("af0fd523e3b774377a9c5192cf0511e34fa19735");
    expect(source.toString()).toContain("fn checked_extent_add(");
    expect(source.toString()).toContain("fn checked_extent_add_matches_independent_u128_oracle(");
  });

  it.each(["sourceCommit", "sourceSha256"] as const)("rejects changed current %s", (field) => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons)
      .find((item) => item.id === "moe-expert-compute")!;
    lesson.tabs[0][field] = "f".repeat(field === "sourceCommit" ? 40 : 64);
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "code tab does not match its exact source-only association",
    }));
  });
});
