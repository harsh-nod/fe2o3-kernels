import { describe, expect, it } from "vitest";
import { lessons } from "../src/content/curriculum";
import { currentState } from "../src/content/current-state";
import { learningHub, validateLearningHub } from "../src/content/learning-hub";
import {
  functionalGateModeLabels,
  validateFunctionalReferenceGate,
} from "../src/content/functional-gates";
import { evidenceLabels, FE2O3_PIN } from "../src/content/model";
import {
  operatorCategories,
  operatorCookbook,
  operatorCookbookEntries,
} from "../src/content/operator-cookbook";

describe("learning hub launch model", () => {
  it("is internally valid", () => {
    expect(validateLearningHub(learningHub)).toEqual([]);
    expect(learningHub.defaultCommit).toBe(currentState.compilerCommit);
    expect(learningHub.defaultTree).toBe(currentState.compilerTree);
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
    const cpuCommands = cpu?.commands
      .map((command) => command.command)
      .join("\n");
    expect(cpuCommands).toContain(
      `git checkout --detach ${currentState.compilerCommit}`,
    );
    expect(cpuCommands).toContain("bash scripts/quickstart.sh no-gpu");
    expect(cpu?.doesNotProve).toContain("GPU execution");

    const gfx942 = learningHub.setupPaths.find(
      (path) => path.id === "mi300x-gfx942",
    );
    expect(gfx942?.commands.map((command) => command.command)).toContain(
      "FE2O3_TARGET=gfx942 scripts/ci-local.sh rocm-compile",
    );
    expect(gfx942?.commands.map((command) => command.command)).toContain(
      "FE2O3_TARGET=gfx942 FE2O3_ALLOW_GPU_SMOKE=1 scripts/ci-local.sh hardware-smoke",
    );
    expect(gfx942?.doesNotProve).toContain(
      "application packet submission or kernel dispatch",
    );
    expect(gfx942?.commands.at(-1)?.expected).toContain(
      "without submitting a packet",
    );

    const gfx950 = learningHub.setupPaths.find(
      (path) => path.id === "mi350-gfx950",
    );
    expect(gfx950?.commands.map((command) => command.command).join("\n")).toContain(
      "run-kda-decode-gfx950.sh",
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

    const kda = learningHub.runMatrix.find(
      (row) => row.id === "gfx950-kda-gdn",
    );
    expect(kda).toMatchObject({
      operator: "gfx950 Kimi Delta Attention decode and chunkwise prefill",
      primaryLessonId: "gfx950-kda-gdn-linear-attention",
      setupPathId: "mi350-gfx950",
      status: "gpu-observed",
    });
    expect(kda?.commands.map((command) => command.command)).toContain(
      "bash examples/gfx950_advanced_attention/run-kda-chunkwise-prefill-gfx950.sh",
    );
    expect(kda?.expectedOutput).toContain("Decode final_state");
    expect(kda?.limitations.join(" ")).toContain("No full Kimi K3 layer");
    expect(kda?.limitations.join(" ")).toContain("performance");

    const fill = learningHub.runMatrix.find(
      (row) => row.id === "fill-source-to-cpu",
    );
    expect(fill).toMatchObject({
      hardware: "Linux CPU host",
      setupPathId: "cpu-only",
      status: "runnable-now",
    });
    expect(fill?.commands.map((command) => command.command).join("\n"))
      .toContain("bash scripts/quickstart.sh no-gpu");
    expect(fill?.sourcePaths).toContain("examples/fill/src/lib.rs");
    expect(fill?.limitations.join(" ")).toContain("No GPU module");

    const vecadd = learningHub.runMatrix.find(
      (row) => row.id === "vecadd-source-check",
    );
    expect(vecadd).toMatchObject({
      hardware: "Linux CPU build host",
      setupPathId: "cpu-only",
      status: "compiler-checked",
    });
    expect(vecadd?.commands.map((command) => command.command).join("\n"))
      .toContain(
        "bash scripts/quickstart.sh source-check examples/vecadd/Cargo.toml",
      );
    expect(vecadd?.expectedOutput).toContain("Unsupported");

    const currentOnboarding = learningHub.runMatrix
      .filter((row) => [
        "generic-ci-gate",
        "cpu-semantic-simulation",
        "fill-source-to-cpu",
        "vecadd-source-check",
      ].includes(row.id))
      .flatMap((row) => row.commands.map((command) => command.command))
      .join("\n");
    expect(currentOnboarding).toContain(
      `git checkout --detach ${currentState.compilerCommit}`,
    );
    expect(currentOnboarding).not.toMatch(
      /cargo .* run -p fe2o3-(?:fill|vecadd)/u,
    );

    const historicalGemm = learningHub.runMatrix.find(
      (row) => row.id === "dynamic-gemm-gfx942",
    );
    expect(
      historicalGemm?.commands.map((command) => command.command).join("\n"),
    ).toContain(`git checkout --detach ${FE2O3_PIN.commit}`);

    expect(
      learningHub.runMatrix.map((row) => row.primaryLessonId),
    ).toEqual(
      expect.arrayContaining([
        "gfx950-indexed-sparse-attention",
        "gfx950-deepseek-sparse-attention",
        "gfx950-compressed-hybrid-attention",
        "gfx950-attnres-gr-mhc",
        "gfx950-speculative-mtp-verification",
        "gfx950-ngram-embedding-gather",
        "gfx950-muon-optimizer",
      ]),
    );
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
      "sparse-attention",
      "compressed-hybrid-attention",
      "residual-mixing",
      "speculative-mtp",
      "ngram-gather",
      "muon-update",
      "gpt-oss-layer-tile",
    ]);

    for (const entry of operatorCookbook) {
      expect(operatorCategories[entry.category], entry.id).toBeDefined();
      expect(lessonIds.has(entry.lessonId), entry.id).toBe(true);
      expect(evidenceLabels[entry.status], entry.id).toBeDefined();
      expect(entry.computes.length, entry.id).toBeGreaterThan(40);
      expect(entry.implementedShape.length, entry.id).toBeGreaterThan(30);
      expect(entry.runner.length, entry.id).toBeGreaterThan(10);
      expect(functionalGateModeLabels[entry.functionalGate.mode], entry.id).toBeDefined();
      expect(validateFunctionalReferenceGate(entry.functionalGate), entry.id).toEqual([]);
      expect(entry.functionalGate.mismatchBehavior, entry.id).toMatch(
        /mismatch/iu,
      );
      expect(entry.functionalGate.compileTimePromotion, entry.id).toMatch(
        /SafeReferenceMirToLivePliron.*before KIR|fail closed.*before KIR/iu,
      );
      expect(entry.sourcePaths.length, entry.id).toBeGreaterThan(0);
      expect(entry.referencePaths.length, entry.id).toBeGreaterThan(0);
      expect(entry.paths.runner.length, entry.id).toBeGreaterThan(0);
      expect(entry.paths.evidence.length, entry.id).toBeGreaterThan(0);
      expect(entry.nonClaims.length, entry.id).toBeGreaterThan(0);
      expect(entry.sourcePaths.join(" "), entry.id).not.toContain("..");
      expect(entry.referencePaths.join(" "), entry.id).not.toContain("..");
      expect(entry.paths.runner.join(" "), entry.id).not.toContain("..");
      expect(entry.paths.evidence.join(" "), entry.id).not.toContain("..");
    }

    const kda = operatorCookbook.find((entry) => entry.id === "kda-gdn");
    expect(kda?.runner).toBe(
      "bash examples/gfx950_advanced_attention/run-kda-decode-gfx950.sh",
    );
    expect(kda?.functionalGate.mode).toBe("runtime-cpu-oracle");
    expect(kda?.functionalGate.mismatchBehavior).toContain(
      "safe CPU reference",
    );
    expect(kda?.implementedShape).toContain("K=16");
    expect(kda?.nonClaims.join(" ")).toContain("No full Kimi K3 layer");

    const fill = operatorCookbook.find((entry) => entry.id === "fill");
    expect(fill).toMatchObject({
      status: "runnable-now",
      runner: "bash scripts/quickstart.sh no-gpu",
    });
    expect(fill?.sourcePaths).toEqual(["examples/fill/src/lib.rs"]);
    expect(fill?.run.target).toBe("Linux CPU (semantic simulation)");
    expect(fill?.nonClaims.join(" ")).toContain("not a GPU load");

    const vecadd = operatorCookbook.find((entry) => entry.id === "vecadd");
    expect(vecadd).toMatchObject({
      status: "compiler-checked",
      runner:
        "bash scripts/quickstart.sh source-check examples/vecadd/Cargo.toml",
    });
    expect(vecadd?.run.status).toContain("fail closed");
    expect(vecadd?.nonClaims.join(" ")).toContain("historical evidence");
    expect(vecadd?.paths.evidence).toContain("benchmarks/vecadd_hip/README.md");

    const sparse = operatorCookbook.find(
      (entry) => entry.id === "sparse-attention",
    );
    expect(sparse?.lessonIds).toEqual([
      "gfx950-indexed-sparse-attention",
      "gfx950-deepseek-sparse-attention",
    ]);
  });

  it("keeps rich cookbook records available behind the flattened UI shape", () => {
    const flash = operatorCookbookEntries.find(
      (entry) => entry.id === "flash-attention",
    );
    expect(flash?.variants?.map((variant) => variant.lessonId)).toEqual([
      "gfx950-fp4-attention",
      "gfx950-fp8-attention",
    ]);

    const sparse = operatorCookbookEntries.find(
      (entry) => entry.id === "sparse-attention",
    );
    expect(sparse?.variants?.map((variant) => variant.lessonId)).toEqual([
      "gfx950-indexed-sparse-attention",
      "gfx950-deepseek-sparse-attention",
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
