import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import { learningHub, validateLearningHub } from "../src/content/learning-hub";
import { evidenceLabels } from "../src/content/model";
import {
  operatorCategories,
  operatorCookbook,
  operatorCookbookEntries,
} from "../src/content/operator-cookbook";

describe("learning hub launch model", () => {
  it("is internally valid", () => {
    expect(validateLearningHub(learningHub)).toEqual([]);
  });

  it("links launch tracks, setup paths, and run matrix rows to existing lessons", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));

    for (const track of learningHub.startHereTracks) {
      expect(track.lessonIds.length, track.id).toBeGreaterThan(0);
      for (const lessonId of track.lessonIds) {
        expect(lessonIds.has(lessonId), `${track.id}: ${lessonId}`).toBe(true);
      }
    }

    for (const setup of learningHub.setupPaths) {
      for (const lessonId of setup.firstLessonIds) {
        expect(lessonIds.has(lessonId), `${setup.id}: ${lessonId}`).toBe(true);
      }
    }

    for (const row of learningHub.runMatrix) {
      expect(lessonIds.has(row.primaryLessonId), row.id).toBe(true);
      expect(evidenceLabels[row.status], row.id).toBeDefined();
    }
  });

  it("models the launch entry points users need before reading deep evidence", () => {
    expect(learningHub.startHereTracks.map((track) => track.id)).toEqual([
      "run-something",
      "write-a-kernel",
      "verify-the-boundary",
      "contribute-a-slice",
    ]);

    const cpu = learningHub.setupPaths.find((path) => path.id === "cpu-only");
    expect(cpu?.commands.map((command) => command.command).join("\n")).toContain(
      "fe2o3-kir-sim",
    );
    expect(cpu?.doesNotProve).toContain("GPU execution");

    const gfx942 = learningHub.setupPaths.find(
      (path) => path.id === "mi300x-gfx942",
    );
    expect(gfx942?.commands.map((command) => command.command)).toContain(
      "FE2O3_TARGET=gfx942:xnack- scripts/ci-local.sh rocm-compile",
    );
    expect(gfx942?.commands.map((command) => command.command)).toContain(
      "FE2O3_TARGET=gfx942:xnack- FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke",
    );

    const gfx950 = learningHub.setupPaths.find(
      (path) => path.id === "mi350-gfx950",
    );
    expect(gfx950?.commands.map((command) => command.command).join("\n")).toContain(
      "run-kimi-k3-kda-decode-gfx950.sh",
    );
    expect(gfx950?.doesNotProve).toContain("whole-model equivalence");
  });

  it("keeps run matrix evidence boundaries explicit", () => {
    expect(learningHub.runMatrix.length).toBeGreaterThanOrEqual(10);

    for (const row of learningHub.runMatrix) {
      expect(row.commands.length, row.id).toBeGreaterThan(0);
      expect(row.limitations.length, row.id).toBeGreaterThan(0);
      expect(
        `${row.expectedOutput} ${row.limitations.join(" ")}`,
        row.id,
      ).toMatch(/\b(?:not|without|does not|bounded|historical|fixed)\b/iu);
    }

    const k3 = learningHub.runMatrix.find(
      (row) => row.id === "gfx950-kimi-k3-kda-decode-core",
    );
    expect(k3).toMatchObject({
      operator: "Kimi K3 KDA decode core",
      primaryLessonId: "gfx950-kimi-k3-kda-decode",
      setupPathId: "mi350-gfx950",
      status: "gpu-observed",
    });
    expect(k3?.commands.map((command) => command.command)).toContain(
      "bash examples/gfx950_advanced_attention/run-kimi-k3-kda-decode-gfx950.sh",
    );
    expect(k3?.expectedOutput).toContain("output_first64");
    expect(k3?.limitations.join(" ")).toContain("Not full Kimi K3 serving");
    expect(k3?.limitations.join(" ")).toContain("performance");
  });

  it("turns contribution policy into a launch checklist", () => {
    const requiredItems = learningHub.contributorWorkflow.flatMap((phase) =>
      phase.checklist.filter((item) => item.required).map((item) => item.id),
    );

    expect(requiredItems).toEqual(
      expect.arrayContaining([
        "choose-smallest-slice",
        "pick-initial-status",
        "kernel-source",
        "safe-reference",
        "record-command",
        "bind-digests",
        "update-hub",
        "validate-site",
      ]),
    );

    expect(learningHub.promotionRules.map((rule) => rule.status)).toEqual(
      expect.arrayContaining([
        "design-only",
        "source-example",
        "source-tested",
        "source-model-verified",
        "compiler-checked",
        "gpu-observed",
      ]),
    );

    const gpuRule = learningHub.promotionRules.find(
      (rule) => rule.status === "gpu-observed",
    );
    expect(gpuRule?.requirement).toContain("concrete target");
    expect(gpuRule?.disallowedShortcut).toContain("full-model equivalence");
  });

  it("publishes a complete operator cookbook for launch users", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id));
    expect(operatorCookbook.map((entry) => entry.id)).toEqual([
      "fill",
      "vecadd",
      "row-softmax",
      "flash-attention",
      "gemm",
      "moe",
      "kda-gdn",
      "kimi-k3-kda",
      "gpt-oss-layer-tile",
    ]);

    for (const entry of operatorCookbook) {
      expect(operatorCategories[entry.category], entry.id).toBeDefined();
      expect(lessonIds.has(entry.lessonId), entry.id).toBe(true);
      expect(evidenceLabels[entry.status], entry.id).toBeDefined();
      expect(entry.computes.length, entry.id).toBeGreaterThan(40);
      expect(entry.implementedShape.length, entry.id).toBeGreaterThan(30);
      expect(entry.runner.length, entry.id).toBeGreaterThan(10);
      expect(entry.sourcePaths.length, entry.id).toBeGreaterThan(0);
      expect(entry.referencePaths.length, entry.id).toBeGreaterThan(0);
      expect(entry.nonClaims.length, entry.id).toBeGreaterThan(0);
      expect(entry.sourcePaths.join(" "), entry.id).not.toContain("..");
      expect(entry.referencePaths.join(" "), entry.id).not.toContain("..");
    }

    const k3 = operatorCookbook.find((entry) => entry.id === "kimi-k3-kda");
    expect(k3?.runner).toBe(
      "bash examples/gfx950_advanced_attention/run-kimi-k3-kda-decode-gfx950.sh",
    );
    expect(k3?.implementedShape).toContain("Single-head f32");
    expect(k3?.nonClaims.join(" ")).toContain("chunk_kda prefill");
    expect(k3?.nonClaims.join(" ")).toContain("full Kimi K3 serving");
  });

  it("keeps rich cookbook records available behind the flattened UI shape", () => {
    const flash = operatorCookbookEntries.find(
      (entry) => entry.id === "flash-attention",
    );
    expect(flash?.variants?.map((variant) => variant.lessonId)).toEqual([
      "gfx950-fp4-attention",
      "gfx950-fp8-attention",
    ]);

    const gptOss = operatorCookbookEntries.find(
      (entry) => entry.id === "gpt-oss-layer-tile",
    );
    expect(gptOss?.paths.evidence).toContain(
      "perf-evidence/gpt-oss-layer-tile-evidence-v1.json",
    );
    expect(gptOss?.nonClaims.join(" ")).toContain(
      "No complete GPT-OSS layer",
    );
  });
});
