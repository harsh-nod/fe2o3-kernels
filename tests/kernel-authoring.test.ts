import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import {
  authorFacingCode,
  projectKernelAuthoringSource,
} from "../src/lib/kernel-authoring";

describe("kernel authoring projection", () => {
  it("pins first-fill to the complete published source without a display rewrite", () => {
    const tab = lessons.find((lesson) => lesson.id === "first-fill")!.tabs[0];
    expect(tab).toMatchObject({
      kind: "kernel",
      language: "rust",
      sourcePath: "examples/fill/src/lib.rs",
      sourceCommit: "a58e4bc7da39c22de24881229315418e1217039b",
      sourceSha256: "827ea368df5dd7f429792e0f8a21df79d4d5508525061a844c190da25de54213",
      sourceDigestScope: "file",
      explanatory: false,
    });
    expect(tab.sourceFragments).toBeUndefined();
    expect(authorFacingCode(tab)).toEqual({ code: tab.code, removedNamespaceCount: 0 });
    const bytes = Buffer.from(tab.code, "utf8");
    expect(bytes.length).toBe(308);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(tab.sourceSha256);
    expect(bytes.subarray(148, 152).toString("utf8")).toBe("fill");
  });

  it("removes only legacy namespace arguments from kernel attributes", () => {
    const source = `#[kernel(
    typed,
    namespace = "${"a".repeat(64)}",
    launch(required = [64, 1, 1])
)]
pub fn fill() {}`;

    expect(projectKernelAuthoringSource(source)).toEqual({
      code: `#[kernel(
    typed,
    launch(required = [64, 1, 1])
)]
pub fn fill() {}`,
      removedNamespaceCount: 1,
    });
  });

  it("fails closed on an unrecognized authored namespace form", () => {
    const source = `#[kernel(typed, namespace = "${"b".repeat(64)}")]
pub fn fill() {}`;
    expect(() => projectKernelAuthoringSource(source)).toThrow(
      "unsupported legacy kernel namespace syntax",
    );
  });

  it("exposes namespace-free authoring code for every Rust kernel tab", () => {
    let projected = 0;
    for (const lesson of lessons) {
      for (const tab of lesson.tabs.filter(
        (candidate) => candidate.kind === "kernel" && candidate.language === "rust",
      )) {
        if (/\bnamespace\s*=\s*"[0-9a-f]{64}"/u.test(tab.code)) {
          expect(tab.code, `${lesson.id}: ${tab.label}`).toContain("kernel(");
        }
        const authoring = authorFacingCode(tab);
        projected += authoring.removedNamespaceCount;
        expect(authoring.code, `${lesson.id}: ${tab.label}`).not.toMatch(
          /\bnamespace\s*=/u,
        );
      }
    }
    expect(projected).toBeGreaterThan(0);
  });
});
