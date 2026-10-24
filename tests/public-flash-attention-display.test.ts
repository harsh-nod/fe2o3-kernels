import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { curriculum, lessons } from "../src/content/curriculum";
import { currentFlashAttentionKernelTab, sourceAssociationRecord } from "../src/content/current-kernel-sources";
import { validateCurriculum } from "../src/content/validate";

describe("public FlashAttention display and preserved history", () => {
  it("binds the full current source without transferring historical evidence", () => {
    const source = readFileSync("examples/flash_attention_general_v1/src/kernel_current.rs");
    const historical = readFileSync("examples/flash_attention_general_v1/src/kernel.rs");
    const lesson = lessons.find((item) => item.id === "flash-attention")!;
    expect(lesson.tabs[0]).toEqual(currentFlashAttentionKernelTab);
    expect(source.byteLength).toBe(34804);
    expect(source.toString()).toBe(currentFlashAttentionKernelTab.code);
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "72fd0148eb5a29c0747ec6b96616eeb4aed15939b365890846c49e1c1d0fbc50",
    );
    expect(currentFlashAttentionKernelTab.sourceCommit).toBe("055ffa8dccc70fccc7675721f98f2b096abd68e7");
    expect(sourceAssociationRecord("flash-attention-current-source-v1").authority).toBe("source-association-only");
    expect(currentFlashAttentionKernelTab.notice).toContain("qualifies no SIMT/tile pair");
    expect(historical.byteLength).toBe(16061);
    expect(createHash("sha256").update(historical).digest("hex")).toBe(
      "f160e1391e1b354657049b5b11d745428fbbfb8fb6e5e2fceb4143ac93e7b00b",
    );
    for (const kind of ["compiler-checked", "gpu-observed"] as const) {
      const claim = lesson.claims.find((item) => item.kind === kind)!;
      expect(claim.reference?.commit).toBe("9006001157e2c3062e44088634e467b0f8963ee0");
      expect(claim.detail).toContain("does not qualify the current Kernel tab");
    }
  });

  it.each(["sourceCommit", "sourceSha256", "code"] as const)("rejects changed current %s", (field) => {
    const changed = structuredClone(curriculum);
    const lesson = changed.flatMap((module) => module.lessons).find((item) => item.id === "flash-attention")!;
    lesson.tabs[0][field] += "0";
    expect(validateCurriculum(changed)).toContainEqual(expect.objectContaining({
      message: "code tab does not match its exact source-only association",
    }));
  });
});
