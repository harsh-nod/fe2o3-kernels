import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import { currentGemmKernelTab, sourceAssociationRecord } from "../src/content/current-kernel-sources";
import { sourceMilestoneRecord } from "../src/content/source-milestones";
import { validateCurriculum } from "../src/content/validate";

describe("public current GEMM display and retained history", () => {
  it("authenticates the exact public source without transferring historical qualification", () => {
    const source = readFileSync("examples/tiled_gemm_general_v1/src/kernel_current.rs");
    const historical = readFileSync("examples/tiled_gemm_general_v1/src/kernel.rs");
    const lesson = lessons.find((item) => item.id === "gemm-tiling")!;
    expect(lesson.tabs[0]).toBe(currentGemmKernelTab);
    expect(source.byteLength).toBe(7111);
    expect(source.toString()).toBe(currentGemmKernelTab.code);
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "ef3bbea31da5311bfb5bfb9edb9f43569e602501c079bebb16eb5f0c6b5973b4",
    );
    expect(currentGemmKernelTab.sourceCommit).toBe("0e0963df4f230bf728a7b4605677c0ff09624adf");
    expect(sourceAssociationRecord("tiled-gemm-current-source-v1").authority)
      .toBe("source-association-only");
    expect(currentGemmKernelTab.notice).toContain("qualifies no SIMT/tile pair");
    expect(currentGemmKernelTab.notice).toContain("remain pending");
    expect(historical.byteLength).toBe(6703);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(
      "a898a078ac411b17764d87c0b06681045ddccc83ea8d4314fd2a48b59e8462cd",
    );
    expect(sourceMilestoneRecord("workgroup-pipeline-source-v1").commit)
      .toBe("9006001157e2c3062e44088634e467b0f8963ee0");
    const retained = lesson.claims.filter((claim) => claim.reference?.scope === "qualification-evidence");
    expect(retained).toHaveLength(2);
    expect(retained.every((claim) => claim.reference?.commit === "9006001157e2c3062e44088634e467b0f8963ee0")).toBe(true);
    expect(retained.find((claim) => claim.kind === "gpu-observed")?.detail)
      .toContain("does not qualify the current Kernel tab");
    expect(lesson.tabs[3].kind).toBe("verus");
    expect(lesson.tabs[5].sourceCommit).toBe("9006001157e2c3062e44088634e467b0f8963ee0");
  });

  it.each(["sourceCommit", "sourceSha256"] as const)("rejects changed current %s", (field) => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons)
      .find((item) => item.id === "gemm-tiling")!;
    lesson.tabs[0][field] = "f".repeat(field === "sourceCommit" ? 40 : 64);
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "code tab does not match its exact source-only association",
    }));
  });
});
