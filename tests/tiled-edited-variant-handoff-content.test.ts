import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const lesson = readFileSync("docs/tiled-edited-variant-handoff-v1.md", "utf8");
const text = lesson.replace(/\s+/g, " ");
const site = "https://github.com/harsh-nod/fe2o3-kernels/blob/" +
  "6d5232d9675dbf346e740480712e2c1eb3ed24b0/docs/";
const compiler = "https://github.com/harsh-nod/fe2o3/blob/";

describe("tiled edited-variant handoff guidance", () => {
  it("stays explanatory without inventing an executable producer", () => {
    for (const value of [
      "contract and navigation guidance, not a runnable edited-tile workflow",
      "no command, wire schema, identifier allocation or source authority",
      "row labels are explanatory categories, not a new wire format",
      "not instructions for a currently available tiled materializer",
      "no new public tiled command",
    ]) expect(text).toContain(value);
    expect(lesson).not.toMatch(/(?:cargo|npm|npx) (?:run|test|exec)/);
    expect(lesson).not.toContain("/home/harmenon");
  });

  it("links exact genuine source lessons and bounded compiler prerequisites", () => {
    for (const path of [
      "tiled-region-normal-continuation-v1.md",
      "bf16-helper-source-cpu-observation-v1.md",
    ]) expect(lesson).toContain(site + path);
    for (const path of [
      "2af2a8d7dc75d8edac3da50325c91ea1911f8324/crates/rustc-codegen-fe2o3/tests/fixtures/tiled-region-inspection-v1/src/lib.rs",
      "b629317dc3288c9393a9a515d60b58535bf5ba2b/crates/rustc-codegen-fe2o3/tests/fixtures/bf16-tile-promotion-v1/src/lib.rs",
      "4fb8ae500e38ad22475861aae7c3b3ef238068f6/docs/retained-shared-source-engine-qualification-20260929.md",
      "4fb8ae500e38ad22475861aae7c3b3ef238068f6/docs/genuine-capability-prefix-qualification-20260929.md",
    ]) expect(lesson).toContain(compiler + path);
    expect(lesson).not.toMatch(/github\.com\/[^\s)]+\/blob\/(?:main|master)\//);
  });

  it("does not combine different fixtures or call an algorithm edit equivalent", () => {
    for (const value of [
      "Identity returns components `[0, 1, 2, 3]`",
      "Swap01 returns `[1, 0, 2, 3]`",
      "caller stores returned component 0",
      "not a demonstration of generated tiled-source promotion or equivalent schedules",
      "normal fixture and helper fixture are different subjects",
      "cannot be joined into one successful source-to-GPU result",
      "one runtime bounds requirement and two runtime alias requirements",
      "not general BF16 arithmetic or gfx950 qualification",
    ]) expect(text).toContain(value);
  });

  it("keeps the original and edited evidence categories distinct", () => {
    for (const value of [
      "| Evidence | Original variant | Edited variant |",
      "| Source and helper closure |",
      "| Selected region |",
      "| Recipe and target |",
      "| Numerical observations |",
      "| Resources |",
      "| Artifact and instruction map |",
      "| Capture and selection |",
      "logical components are not physical VGPR assignments",
      "never relabel the original recording",
      "An unavailable field stays unavailable",
      "an expected value is not an observation",
    ]) expect(text).toContain(value);
  });

  it("preserves fresh source admission and stale or unavailable outcomes", () => {
    for (const value of [
      "create-new typed Rust candidate",
      "ordinary frontend and fixed compilation policy",
      "do not resume a detached snapshot",
      "Restoring the original Rust is not semantic lifting",
      "old selection must refuse",
      "Pair edited source with the original capture",
      "checked replay or explicit rebinding",
      "preserving an invalid-precondition refusal",
      "preserve ambiguity",
      "display unavailable, not zero registers",
    ]) expect(text).toContain(value);
  });

  it("leaves curriculum, compiler and execution authority unchanged", () => {
    for (const value of [
      "not claims that new tests or kernel executions ran",
      "Passing documentation checks cannot establish",
      "does not mutate compiler state",
      "additional to the required SIMT/tile pair",
      "changes no global `FE2O3_PIN`, route, lab maturity or milestone acceptance",
      "claims no GPU execution, physical capture or performance improvement",
      "[#280 M5]", "[#281 V3]", "[#282 U4]",
    ]) expect(text).toContain(value);
  });
});
