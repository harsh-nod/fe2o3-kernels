import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import {
  authorFacingCode,
  projectKernelAuthoringSource,
} from "../src/lib/kernel-authoring";

describe("kernel authoring projection", () => {
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
