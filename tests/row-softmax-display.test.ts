import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import { currentRowSoftmaxKernelTab, sourceAssociationRecord } from "../src/content/current-kernel-sources";
import { validateCurriculum } from "../src/content/validate";

describe("current row-softmax display and retained history", () => {
  it("authenticates the complete current source without transferring historical qualification", () => {
    const source = readFileSync("examples/row_softmax_general_v1/src/kernel_current.rs");
    const historical = readFileSync("examples/row_softmax_general_v1/src/kernel.rs");
    const lesson = lessons.find((item) => item.id === "softmax-invariant")!;
    expect(lesson.tabs).toHaveLength(6);
    expect(lesson.tabs[0]).toEqual(currentRowSoftmaxKernelTab);
    expect(source.byteLength).toBe(4483);
    expect(source.toString()).toBe(currentRowSoftmaxKernelTab.code);
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "06896717d72deee6e52f957979c796a19ebb22146e9512abf7fdd3c5de366ba8",
    );
    expect(currentRowSoftmaxKernelTab.sourceCommit).toBe("044b85871308076c7a15d1c20c7794069fd73bb2");
    expect(sourceAssociationRecord("row-softmax-current-source-v1").authority)
      .toBe("source-association-only");
    expect(currentRowSoftmaxKernelTab.notice).toContain("qualifies no SIMT/tile pair");
    expect(historical.byteLength).toBe(3979);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(
      "b7f65c16395ea89c590aaee800167a9dceea620e55765044f423eadf9360e04d",
    );
    const gpu = lesson.claims.find((claim) => claim.kind === "gpu-observed")!;
    expect(gpu.reference?.commit).toBe("af0fd523e3b774377a9c5192cf0511e34fa19735");
    expect(gpu.detail).toContain("does not qualify the current Kernel tab");
    expect(lesson.tabs[1].sourceCommit).toBe("308d8fa00fa41e098b2a1a47bbfea1bc29735464");
    expect(lesson.tabs[3].sourceCommit).toBe("af0fd523e3b774377a9c5192cf0511e34fa19735");
    expect(lesson.tabs[4].sourceCommit).toBe("af0fd523e3b774377a9c5192cf0511e34fa19735");
    expect(lesson.tabs[5].code).toContain("Historical dynamic row softmax qualification");
    expect(source.toString()).toContain("let Ok(input) = StridedReadView2D::from_shared_slice(");
    expect(source.toString()).toContain("let Some(output_stripe) = thread_index.checked_row_striped_2d::<64, 64>() else {");
    expect(source.toString()).toContain("return Err(KernelError::OutOfBounds);");
  });

  it.each(["sourceCommit", "sourceSha256"] as const)("rejects changed current %s", (field) => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons)
      .find((item) => item.id === "softmax-invariant")!;
    lesson.tabs[0][field] = "f".repeat(field === "sourceCommit" ? 40 : 64);
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "code tab does not match its exact source-only association",
    }));
  });
});
