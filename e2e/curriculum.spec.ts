import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

interface ExactDebuggerResponse {
  request_id: number;
  session: { cursor: { event_sequence: number } };
}

interface ExactDebuggerProjection {
  breakpoint_stop: ExactDebuggerResponse;
  watchpoint_stop: ExactDebuggerResponse;
  memory: ExactDebuggerResponse & Record<string, unknown>;
}

const exactDebuggerProjection = JSON.parse(
  readFileSync(
    new URL("../examples/debugger_workbench_v1.json", import.meta.url),
    "utf8",
  ),
) as ExactDebuggerProjection;
const exactDebuggerRequests = readFileSync(
  new URL("../examples/debugger_requests_v1.jsonl", import.meta.url),
  "utf8",
)
  .trimEnd()
  .split("\n")
  .map((line) => JSON.parse(line) as Record<string, unknown>);

test("curriculum is responsive, navigable, and visually nonempty", async ({
  page,
}, testInfo) => {
  await page.goto("./#/lesson/typed-vecadd");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Vecadd: the current typed vertical slice",
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Read and write region ownership"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show proof details" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Verus proof" })).toHaveCount(0);
  await expect(
    page.getByLabel("Evidence for this lesson").locator("details"),
  ).not.toHaveAttribute("open");
  await expect(
    page.getByLabel("Correctness contract").locator("details"),
  ).not.toHaveAttribute("open");

  const codePanel = page.getByRole("tabpanel");
  await expect(codePanel.locator("code.language-rust")).toBeVisible();
  await expect(codePanel.locator(".token.keyword").first()).toBeVisible();
  const syntaxColors = await codePanel
    .locator(".token.keyword, .token.function, .token.string")
    .evaluateAll((tokens) =>
      tokens.map((token) => getComputedStyle(token).color),
    );
  expect(syntaxColors.length).toBeGreaterThan(2);
  expect(new Set(syntaxColors).size).toBeGreaterThan(1);
  await codePanel.screenshot({
    path: testInfo.outputPath("syntax-highlighting.png"),
    animations: "disabled",
  });

  const isMobile = testInfo.project.name === "mobile";
  if (isMobile) {
    await page.getByRole("button", { name: "Open curriculum" }).click();
    await expect(
      page.getByRole("dialog", { name: "Curriculum navigation" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("mobile-drawer.png"),
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Close curriculum" }).click();
  } else {
    await expect(
      page.getByRole("complementary", { name: "Curriculum" }),
    ).toBeVisible();
  }

  const viewportScreenshot = testInfo.outputPath("viewport.png");
  await page.screenshot({ path: viewportScreenshot, animations: "disabled" });

  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    diagrams: document.querySelectorAll("figure.diagram").length,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.diagrams).toBeGreaterThan(0);
});

test("source-to-bundle CPU simulation keeps its evidence boundary visible", async ({
  page,
}, testInfo) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Export and debug Rust without a GPU",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Keep one production lowering",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Read the result as an exact observation",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/accepts an ordinary attributed Rust crate/u),
  ).toBeVisible();
  await expect(
    page.getByText(/does not add a second importer or lowerer/u),
  ).toBeVisible();
  await expect(
    page.getByText(/compiler_bundle_bound means the exact source map/u),
  ).toBeVisible();
  await expect(
    page.getByLabel("Attributed Rust to authority-free bundle and deterministic CPU replay"),
  ).toContainText("0x3f800000");
  const codePanel = page.locator("#lesson-code-panel");
  await expect(codePanel).toContainText("pub fn barrier_before_access");
  await expect(codePanel).toContainText("syncthreads");
  await expect(page.getByText(/Exact excerpt from the ordinary attributed Rust crate/u)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    /crates\/rustc-codegen-fe2o3\/tests\/fixtures\/production-ranked-bounds-device\/src\/lib\.rs$/u,
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(codePanel).toContainText("fe2o3-simulation-request-v1");
  await expect(codePanel).toContainText(
    "./target/debug/fe2o3-export-sim --crate",
  );
  await expect(codePanel).toContainText("--record-canonical-schedule");
  await expect(codePanel).toContainText("--replay-schedule");
  await expect(codePanel).toContainText("fe2o3-debug sim --bundle");

  await page.getByRole("tab", { name: "Source debug JSONL" }).click();
  await expect(codePanel).toContainText('"operation":"resolve_source"');
  await expect(codePanel).toContainText('"provenance":"compiler_bundle_bound"');
  await expect(codePanel).toContainText('"result":"stack"');
  await expect(codePanel).toContainText('"values":{"status":"captured"');

  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(codePanel).toContainText('"canonical_bytes":1187');
  await expect(codePanel).toContainText('"hardware_observed":false');
  await expect(codePanel).toContainText('"performance_prediction":false');
  await expect(codePanel).toContainText('"barrier_releases":1');
  await expect(codePanel).toContainText('"record_sha256"');

  const semanticEvidence = page.getByRole("region", {
    name: "Explore, retain, and replay a CPU counterexample",
  });
  await expect(semanticEvidence).toBeVisible();
  await expect(
    semanticEvidence.getByRole("heading", { name: "Inspect exact V2 source variables on CPU" }),
  ).toBeVisible();
  const sourceVariables = semanticEvidence.getByRole("table", {
    name: "Source Map V2 variables",
  });
  await expect(sourceVariables.getByText("0x3f800000")).toBeVisible();
  await expect(sourceVariables.getByText("simulated observation").first()).toBeVisible();
  await expect(sourceVariables.getByText("not represented").first()).toBeVisible();
  const raceTabs = semanticEvidence.getByRole("tablist", {
    name: "Race evidence outcome",
  });
  await expect(semanticEvidence.getByText("alloc#1 +0").last()).toBeVisible();
  await raceTabs.getByRole("tab", { name: "No race observed" }).click();
  await expect(semanticEvidence.getByText(/Other schedules were not exhausted/u)).toBeVisible();
  await raceTabs.getByRole("tab", { name: "Assessment incomplete" }).click();
  await expect(semanticEvidence.getByText(/stays typed incomplete/u)).toBeVisible();

  const waveTabs = semanticEvidence.getByRole("tablist", {
    name: "Logical wave width",
  });
  await waveTabs.getByRole("tab", { name: "Wave64" }).click();
  await expect(semanticEvidence.getByText("0x0000000000000001")).toBeVisible();
  await expect(semanticEvidence.getByText("execution_incomplete_wave")).toBeVisible();

  await expect(semanticEvidence.getByText("Counter Capture V2 importer regression")).toBeVisible();
  const pcTabs = semanticEvidence.getByRole("tablist", {
    name: "PC sample evidence",
  });
  await pcTabs.getByRole("tab", { name: "Samples" }).click();
  await expect(
    semanticEvidence.locator("dd").getByText("5380230786023534", { exact: true }),
  ).toBeVisible();
  await pcTabs.getByRole("tab", { name: "Hotspots" }).click();
  await expect(semanticEvidence.getByText(/not instruction counts/u)).toBeVisible();

  await semanticEvidence.screenshot({
    path: testInfo.outputPath("semantic-evidence-workbench.png"),
    animations: "disabled",
  });
  const semanticBounds = await semanticEvidence.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
    clippedText: Array.from(element.querySelectorAll<HTMLElement>("h2, h3, p, code, strong, small"))
      .filter((candidate) => candidate.offsetParent !== null)
      .some(
        (candidate) =>
          candidate.scrollWidth > candidate.clientWidth + 1 &&
          getComputedStyle(candidate).overflowX === "visible",
      ),
  }));
  expect(semanticBounds.scrollWidth).toBeLessThanOrEqual(semanticBounds.width);
  expect(semanticBounds.clippedText).toBe(false);

  const workbench = page.getByRole("region", {
    name: "Inspect one deterministic semantic trace",
  });
  await expect(workbench).toBeVisible();
  const truth = workbench.getByLabel("Session provenance and truth");
  await expect(truth).toContainText("Simulated semantic observation");
  await expect(truth).toContainText("simulatedtrue");
  await expect(truth).toContainText("hardware observedfalse");
  await expect(truth).toContainText("performance predictionfalse");
  await expect(truth).toContainText("wave modellogical only");
  for (const label of [
    "simulated",
    "hardware observed",
    "performance prediction",
    "wave model",
  ]) {
    await expect(truth.getByText(label, { exact: true })).toBeVisible();
  }
  const truthBounds = await truth.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(truthBounds.scrollWidth).toBeLessThanOrEqual(truthBounds.width);

  const hierarchy = workbench.getByLabel(
    "Workgroup logical wave and lane hierarchy",
  );
  await expect(hierarchy.getByText("Logical wave 0")).toBeVisible();
  await expect(
    hierarchy.getByRole("button", { name: "Lane 0 active" }),
  ).toBeEnabled();
  const finalLane = hierarchy.getByRole("button", { name: "Lane 63 inactive" });
  await expect(finalLane).toBeVisible();
  await expect(finalLane).toBeDisabled();
  const hierarchyBounds = await hierarchy.evaluate((element) => ({
    width: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(hierarchyBounds.scrollWidth).toBeLessThanOrEqual(
    hierarchyBounds.width,
  );

  const breakpointCursor =
    exactDebuggerProjection.breakpoint_stop.session.cursor.event_sequence;
  await workbench
    .getByRole("button", { name: new RegExp(`#${breakpointCursor} ·`, "u") })
    .click();
  await expect(workbench.getByText("breakpoint hit")).toBeVisible();

  const watchpointCursor =
    exactDebuggerProjection.watchpoint_stop.session.cursor.event_sequence;
  await workbench
    .getByRole("button", { name: new RegExp(`#${watchpointCursor} ·`, "u") })
    .click();
  await expect(workbench.getByText("watchpoint hit")).toBeVisible();

  const memoryCursor =
    exactDebuggerProjection.memory.session.cursor.event_sequence;
  await workbench
    .getByRole("button", { name: new RegExp(`#${memoryCursor} ·`, "u") })
    .click();
  const inspectorTabs = workbench.getByRole("tablist", {
    name: "State inspector",
  });
  await inspectorTabs.getByRole("tab", { name: "Memory" }).click();
  await expect(workbench.getByText("0x11000000")).toBeVisible();

  const agentTabs = workbench.getByRole("tablist", { name: "Agent operation" });
  await agentTabs.getByRole("tab", { name: "Memory" }).click();
  const exactMemoryRequest = exactDebuggerRequests.find(
    (request) =>
      request.request_id === exactDebuggerProjection.memory.request_id,
  );
  if (!exactMemoryRequest) throw new Error("exact memory request is missing");
  await expect(workbench.getByTestId("debug-agent-request")).toHaveText(
    JSON.stringify(exactMemoryRequest),
  );
  await expect(workbench.getByTestId("debug-agent-response")).toHaveText(
    JSON.stringify(exactDebuggerProjection.memory),
  );

  await workbench.screenshot({
    path: testInfo.outputPath("debugger-workbench.png"),
    animations: "disabled",
  });
  await page.evaluate(async () => {
    const workbenchElement =
      document.querySelector<HTMLElement>(".debugger-tutorial");
    const topbar = document.querySelector<HTMLElement>(".topbar");
    if (!workbenchElement) throw new Error("debugger workbench is missing");
    document.documentElement.style.scrollBehavior = "auto";
    const topbarHeight = topbar?.getBoundingClientRect().height ?? 0;
    const workbenchTop =
      workbenchElement.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, workbenchTop - topbarHeight - 12));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  });
  await page.screenshot({
    path: testInfo.outputPath("debugger-workbench-viewport.png"),
    animations: "disabled",
  });

  const screenshot = testInfo.outputPath("cpu-semantic-simulation.png");
  await page.screenshot({
    path: screenshot,
    animations: "disabled",
    fullPage: true,
  });
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    workbenchWidth:
      document.querySelector(".debugger-tutorial")?.scrollWidth ?? 0,
    workbenchViewport:
      document.querySelector(".debugger-tutorial")?.clientWidth ?? 0,
    semanticWidth:
      document.querySelector(".semantic-evidence-workbench")?.scrollWidth ?? 0,
    semanticViewport:
      document.querySelector(".semantic-evidence-workbench")?.clientWidth ?? 0,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.workbenchWidth).toBeLessThanOrEqual(
    dimensions.workbenchViewport,
  );
  expect(dimensions.semanticWidth).toBeLessThanOrEqual(
    dimensions.semanticViewport,
  );
});

test("GPU debugger profiler workbench keeps backend authority distinct", async ({
  page,
}, testInfo) => {
  await page.goto("./#/debugger/live-kfd");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "GPU debugger + profiler workbench",
    }),
  ).toBeVisible();
  await expect(page.getByText("Scopes are separate")).toBeVisible();
  await expect(page.getByTestId("gpu-workbench-record")).toContainText(
    "WaveRecordLayoutNotInKfdUapi",
  );

  const backends = page.getByRole("tablist", { name: "Evidence backend" });
  await backends.getByRole("tab", { name: "ROCgdb / MI" }).click();
  await expect(page.getByTestId("gpu-workbench-record")).toContainText(
    '"live_gpu_stop_validated": false',
  );
  await expect(
    page.getByRole("gridcell", {
      name: /GPU wave unavailable, lane 0, unavailable/u,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("rocgdb-mi-workbench.png"),
    animations: "disabled",
    fullPage: true,
  });
  await backends.getByRole("tab", { name: "Profiler V4" }).click();
  await expect(page.getByTestId("gpu-workbench-record")).toContainText(
    "plan_next_capture",
  );
  await expect(page.getByTestId("gpu-workbench-record")).toContainText(
    "wait_events",
  );
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Semantic evidence composition across complementary tools",
    }),
  ).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("live-kfd-debugger.png"),
    animations: "disabled",
    fullPage: true,
  });
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    consoleWidth: document.querySelector(".gpu-workbench")?.scrollWidth ?? 0,
    consoleViewport: document.querySelector(".gpu-workbench")?.clientWidth ?? 0,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.consoleWidth).toBeLessThanOrEqual(dimensions.consoleViewport);
});

test("search traps focus and restores its trigger", async ({ page }) => {
  await page.goto("./#/");
  await expect(
    page.getByRole("heading", { level: 1, name: "fe2o3 kernels" }),
  ).toBeVisible();

  const trigger = page.getByRole("button", { name: /Search/u });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Search all lesson content",
  });
  const input = dialog.getByRole("combobox", {
    name: "Search all lesson content",
  });
  await expect(input).toBeFocused();

  const lastOption = dialog.getByRole("option").last();
  await page.keyboard.press("Shift+Tab");
  await expect(lastOption).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("search, theme, tabs, and progress work together", async ({ page }) => {
  await page.goto("./#/lesson/evidence-archive");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Historical evidence archive",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Read bounded MoE evidence by layer",
    }),
  ).toBeVisible();
  await expect(page.getByText(/19 obligations/u)).toBeVisible();
  await expect(page.getByText(/all 625 count vectors/u)).toBeVisible();
  await expect(
    page.getByText(/no freshness or replay authority/u),
  ).toBeVisible();
  await page.keyboard.press("Control+K");
  const search = page.getByRole("combobox", {
    name: "Search all lesson content",
  });
  await expect(search).toBeFocused();
  await search.fill("flash attention");
  await page.locator("#lesson-flash-attention").click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Dynamic FlashAttention with MFMA",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "A future matrix PV phase must accept the QK result layout",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  const lessonEvidence = page.getByLabel("Evidence for this lesson");
  await lessonEvidence.locator("summary").click();
  await expect(
    lessonEvidence.getByText("GPU observed", { exact: true }),
  ).toBeVisible();
  await expect(
    lessonEvidence.getByText("Verus model", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Show proof details" }).click();
  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/verus_vecadd/verus/reference_refinement_v1.rs",
  );
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("dynamic GEMM shows safe MFMA source and an equivalent HIP comparison", async ({
  page,
}, testInfo) => {
  await page.goto("./#/lesson/gemm-tiling");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Dynamic GEMM end to end",
    }),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Safe Rust qualification kernel for dynamic strided matrix multiplication",
  );
  await expect(page.getByRole("tabpanel")).toContainText("-> KernelResult");
  await expect(page.getByRole("tabpanel")).toContainText(
    "Bf16MfmaAMatrix::row_major(a, 0, m as usize, k as usize, lda as usize)?",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "WorkgroupPipeline::<Bf16MfmaAFragment",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "lhs_pipeline.discard(phase_count)",
  );
  await expect(
    page.getByRole("tabpanel").locator(".token.keyword").first(),
  ).toBeVisible();
  await expect(
    page.getByLabel("Dynamic GEMM wave tile ownership"),
  ).toContainText("BF16 fragments → MFMA");
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e/examples/tiled_gemm_general_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "#![forbid(unsafe_code)]",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn evaluate_reference_v1",
  );

  await page.getByRole("button", { name: "Show proof details" }).click();
  await page.getByRole("tab", { name: "Sequential semantics" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "WORKLOAD SPECIFICATION",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "arithmetic_is_defined",
  );
  await expect(
    page.locator(".code-status").filter({
      hasText:
        /workload-neutral compiler replays eligible exact point formulas/u,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "Verus refinement" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
  );

  await page.getByRole("tab", { name: "Equivalent HIP" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "__builtin_amdgcn_mfma_f32_16x16x16bf16_1k",
  );
  await expect(
    page.getByRole("tabpanel").locator("code.language-cpp"),
  ).toBeVisible();
  await expect(
    page.getByRole("tabpanel").locator(".token.keyword").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/tiled_gemm_general_v1/benchmark_hip.cpp",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "grid_dim: (tile_rows * tile_columns, 1, 1)",
  );
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/1dd61a018bd58c4eb0a2f1d7a35ee9e453fd529e/examples/tiled_gemm_general_v1/src/main.rs",
  );

  await page.getByRole("tab", { name: "MI300X result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "110 correspondence blocks",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS tiled_gemm_general_v1: 19x21x23",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "4 x s_barrier",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "functional qualification, not a performance claim",
  );
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Map a wave to a tile",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Walk the MFMA K loop",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Optimizing the executable baseline",
    }),
  ).toHaveCount(0);

  await page.evaluate(() => {
    window.location.hash = "/lesson/gemm-proof-plan";
  });
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Historical executable baseline and current gate",
    }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(
      "Generic PLIRON safety passes are mandatory before lowering",
    ),
  ).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = "/lesson/compiler-checks";
  });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Compiler checks: one path, explicit boundaries",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Representative compile-time rejections",
    }),
  ).toBeVisible();
  const failureGallery = page.locator(".compile-failure-gallery");
  await expect(
    failureGallery.getByText("Static out-of-bounds access"),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("Cross-invocation write race"),
  ).toBeVisible();
  await expect(
    failureGallery.getByText(
      "Incompatible tensor producer and consumer layouts",
    ),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("FE2O3-BOUNDS-001", { exact: true }),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("FE2O3-TENSOR-LAYOUT-005", { exact: true }),
  ).toBeVisible();
  await expect(failureGallery.getByText("Pipeline read before consume")).toBeVisible();
  await expect(
    failureGallery.getByText("Dynamic pipeline loop without a drain"),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("Workgroup pipeline with a divergent trip count"),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("FE2O3-RACE-001", { exact: true }),
  ).toBeVisible();
  await expect(
    failureGallery.getByLabel("Compile-time rejection path"),
  ).toContainText("No lowering or artifact");
  await expect(failureGallery.getByText(/requires 64 < 64/u)).toBeVisible();
  await expect(
    page.getByText("One completed witness is not universal correctness"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "One production path, with explicit proof boundaries",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Current end-to-end boundary", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "What is complete today",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Complete is relation-specific", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Show proof details" }).click();
  await page.getByRole("tab", { name: "Static bounds" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "let selected = input[64]",
  );
  await page.getByRole("tab", { name: "Checked fold" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "kernel.index_constant 12",
  );
  await page.getByRole("tab", { name: "Where Verus fits" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "You do not need to write a Verus proof to read a compiler diagnostic",
  );
  await page.getByRole("tab", { name: "Witness boundary" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "owner-custodied semantic MIR correspondence",
  );
  await page.getByRole("tab", { name: "Run checks" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "cargo test --locked -p fe2o3-kernel-analysis --test pliron_lit",
  );
  await page
    .getByRole("heading", {
      level: 3,
      name: "Representative compile-time rejections",
    })
    .scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -72));
  await page.screenshot({
    path: testInfo.outputPath("compile-errors.png"),
    animations: "disabled",
  });
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Debug the verified bundle without upgrading observation into proof",
    }),
  ).toBeVisible();
  await page.goto("./#/lesson/gemm-proof-plan");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Proving and extending the MFMA kernel",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Property ledger" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Historical executable baseline and current gate",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Generic PLIRON safety passes are mandatory before lowering",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Optimized schedule mutation diagnostics",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Artifact-level closure" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "What closes the functional theorem",
    }),
  ).toBeVisible();
});

test("row softmax shows dynamic source and GPU qualification", async ({
  page,
}) => {
  await page.goto("./#/lesson/softmax-invariant");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Dynamic row softmax",
    }),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn row_softmax_general_v1",
  );
  await expect(page.getByText(/Explanatory source/u)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ecf7b17f819021708d9c59ebe39a4daf9eb2562c/examples/row_softmax_general_v1/src/kernel.rs",
  );
  await expect(page.getByText(/One wave owns one dynamic row/u)).toBeVisible();

  await page.getByRole("button", { name: "Show proof details" }).click();
  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
  );
  await expect(
    page.getByText("The compiler does not know this is softmax"),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("fn launch_case");
  await expect(page.getByText(/ordinary host FFI boundaries/u)).toBeVisible();
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("PASS single-column");
  await expect(page.getByRole("tabpanel")).toContainText("PASS maximum-width");
  await expect(page.getByRole("tabpanel")).toContainText(
    "lane shuffles and no MFMA",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "not a proof for every input or a performance claim",
  );
});

test("Wave 2 lessons expose exact source and bounded latest status", async ({
  page,
}, testInfo) => {
  await page.goto("./#/lesson/reductions-scans");
  const scheduleHeading = page.getByRole("heading", {
    level: 2,
    name: "Inspect the generated WG64 schedule",
  });
  await expect(scheduleHeading).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "2-6", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "27-31", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "33", exact: true })).toBeVisible();
  await expect(
    page.getByText("Deliberately absent", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Compiler schedule, not an execution result", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/not GPU execution/u)).toBeVisible();
  await expect(
    page.getByText(/protected source-to-HSACO publication/u),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.locator(".topbar, .skip-link").evaluateAll((elements) => {
    for (const element of elements) {
      (element as HTMLElement).style.visibility = "hidden";
    }
  });
  await scheduleHeading.locator("..").screenshot({
    path: testInfo.outputPath("wg64-generated-effect-schedule.png"),
    animations: "disabled",
  });
  await page.locator(".topbar, .skip-link").evaluateAll((elements) => {
    for (const element of elements) {
      (element as HTMLElement).style.visibility = "";
    }
  });
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn wave64_collectives_v1",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/wave64_collectives_v1/src/kernel.rs",
  );
  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "No host launch is available for this design lesson",
  );
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "protected four-mask gfx942 observation",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "do not transfer hardware authority to the current source",
  );

  await page.goto("./#/lesson/lds-barriers-atomics");
  await page.getByRole("tab", { name: "Kernel" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn lds_publish_read_reduce_i32_v1",
  );
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/workgroup_sync_v1/src/kernel.rs",
  );
  await expect(
    page.getByRole("link", { name: "Exact separate scoped_atomic.rs source" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/workgroup_sync_v1/src/scoped_atomic.rs",
  );
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "opaque direct upstream LLVM/LLD finalizer receipts",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "bounded protected MI300X observation",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact-profile evidence only",
  );
});

test("MoE expert lesson exposes dynamic MFMA source and qualification evidence", async ({
  page,
}) => {
  await page.goto("./#/lesson/moe-expert-compute");
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn moe_grouped_expert_general_v1",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "matrix.multiply_accumulate(lhs, rhs, accumulator)",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ecf7b17f819021708d9c59ebe39a4daf9eb2562c/examples/moe_grouped_expert_general_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "#![forbid(unsafe_code)]",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn evaluate_reference_v1",
  );

  await page.getByRole("button", { name: "Show proof details" }).click();
  await page.getByRole("tab", { name: "Verus" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
  );
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ecf7b17f819021708d9c59ebe39a4daf9eb2562c/examples/verus_vecadd/verus/reference_refinement_v1.rs",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("fn launch_expert");
  await expect(page.getByRole("tabpanel")).toContainText(
    "routes[(token % EXPERTS)",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS top2-routed-moe",
  );
  await expect(
    page.getByText(/launches the same generated kernel/u),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "17 ranked dynamic-index obligations",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "no GEMM, attention, routing, or MoE recognizer",
  );
  await expect(
    page.getByText(/one direct grouped-expert qualification launch/u),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "not a current launch path, routing proof, persistent scheduling implementation, or performance result",
  );

  await page.goto("./#/status");
  const checkpoint = page
    .getByRole("heading", {
      level: 3,
      name: "MoE expert bounded V2 integrated checkpoint",
    })
    .locator("../..");
  await expect(checkpoint).toContainText("public");
  await expect(checkpoint).toContainText("19 verified obligations");
  await expect(checkpoint).toContainText(
    "all seven expected-failure mutations",
  );
  await expect(checkpoint).toContainText("all 625 count vectors");
  await expect(checkpoint).toContainText(
    "does not authenticate router execution or device readback provenance",
  );
  await expect(checkpoint).toContainText(
    "upload/readback test is no kernel dispatch",
  );
  const expertRow = page
    .getByRole("row")
    .filter({ hasText: "MoE expert GEMM and combine" });
  await expect(expertRow).toContainText("Partial");
  await expect(expertRow).toContainText(
    "authenticated router completion and device readback provenance",
  );
  await expect(expertRow).toContainText("freshness and replay authority");
});

test("gfx950 lessons expose production Rust source, ISA, and runtime evidence", async ({
  page,
}) => {
  await page.goto("./#/lesson/gfx950-fp4-attention");
  await expect(
    page.getByText("Loading content...", { exact: true }),
  ).toBeHidden({
    timeout: 120_000,
  });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "gfx950 FP4 flash attention",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("GPU observed", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "gfx950_fp4_attention_rust",
  );

  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("attention_reference");
  await page.getByRole("tab", { name: "Equivalent HIP" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "gfx950_fp4_flash_attention",
  );
  await page.getByRole("tab", { name: "Run and inspect" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("ds_read_b64_tr_b4");
  await expect(page.getByRole("tabpanel")).toContainText(
    "v_mfma_f32_16x16x128_f8f6f4",
  );

  await page.getByRole("tab", { name: "Evidence record" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Portable namespace: a9a878f0e2fc3a42ad17edf0a326a89695398bb6d7460eaf278ea3e8c53f4cf5",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Rust-produced HSACO SHA-256: 90d8f5e0b1b058c96a0b855893f20d3c4a3adc86fe72fe4b9a0de9652eef122b",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Rust numerical result: max_absolute_error=2.235174179e-8",
  );

  await page.goto("./#/lesson/gfx950-fp8-attention");
  await expect(
    page.getByText("Loading content...", { exact: true }),
  ).toBeHidden({
    timeout: 120_000,
  });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "gfx950 FP8 flash attention",
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Run and inspect" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("ds_read_b64_tr_b8");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
});

test("every gfx950 low-precision lesson opens its production Rust evidence", async ({
  page,
}) => {
  const lessons = [
    [
      "gfx950-fp4-gemm",
      "gfx950 FP4 GEMM",
      "gfx950_fp4_gemm_rust",
      "1308d41a97d523d2e77ad15e16a3292e9d5a75e2f4eedf53f9e1008c481ca750",
      "max_absolute_error=0",
    ],
    [
      "gfx950-fp8-gemm",
      "gfx950 FP8 GEMM",
      "gfx950_fp8_gemm_rust",
      "701a0a4ef137173ba9563dfe8b3b1f916d3d57dca0063d393d8e81c671e4dd2b",
      "max_absolute_error=0",
    ],
    [
      "gfx950-fp4-attention",
      "gfx950 FP4 flash attention",
      "gfx950_fp4_attention_rust",
      "90d8f5e0b1b058c96a0b855893f20d3c4a3adc86fe72fe4b9a0de9652eef122b",
      "max_absolute_error=2.235174179e-8",
    ],
    [
      "gfx950-fp8-attention",
      "gfx950 FP8 flash attention",
      "gfx950_fp8_attention_rust",
      "9208b439a4fbd1a987ea3cca19c01cac79e69e00b021ccb54f09f440d11f6294",
      "max_absolute_error=5.960464478e-8",
    ],
  ] as const;

  for (const [
    lessonId,
    title,
    symbol,
    hsacoSha256,
    numericalResult,
  ] of lessons) {
    await page.goto(`./#/lesson/${lessonId}`);
    await expect(
      page.getByText("Loading content...", { exact: true }),
    ).toBeHidden({
      timeout: 120_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expect(
      page.getByText("GPU observed", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Rust kernel" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(symbol);
    await expect(page.getByRole("tabpanel")).toContainText("rust");
    await expect(
      page.getByRole("link", { name: "Source", exact: true }),
    ).toHaveAttribute(
      "href",
      /\/blob\/c1383e97db732f9f1ff8105f10d5c2b5971143e1\/examples\/gfx950_low_precision\/src\/kernel\.rs$/,
    );
    await page.getByRole("tab", { name: "Evidence record" }).click();
    await expect(page.getByRole("tabpanel")).toContainText(
      `Rust-produced HSACO SHA-256: ${hsacoSha256}`,
    );
    await expect(page.getByRole("tabpanel")).toContainText(
      `Rust numerical result: ${numericalResult}`,
    );
  }
});

test("advanced gfx950 production Rust lessons render on desktop and mobile", async ({
  page,
}, testInfo) => {
  const routes = [
    [
      "gfx950-advanced-moe",
      "gfx950 advanced MoE pipeline",
      "gfx950_moe_route_fp4_t16_e4_k2_v1",
    ],
    [
      "gfx950-kda-gdn-linear-attention",
      "gfx950 KDA/GDN linear attention",
      "gfx950_kda_gdn_decode",
    ],
    [
      "gfx950-indexed-sparse-attention",
      "gfx950 indexed sparse attention",
      "gfx950_content_sparse_attention",
    ],
    [
      "gfx950-deepseek-sparse-attention",
      "gfx950 DeepSeek sparse attention",
      "gfx950_deepseek_sparse_attention",
    ],
    [
      "gfx950-compressed-hybrid-attention",
      "gfx950 compressed hybrid attention",
      "gfx950_compressed_hybrid_attention",
    ],
    [
      "gfx950-attnres-gr-mhc",
      "gfx950 AttnRes, GR, and mHC mixing",
      "gfx950_attnres_aggregate",
    ],
    [
      "gfx950-speculative-mtp-verification",
      "gfx950 speculative and MTP verification",
      "gfx950_speculative_transaction_v1",
    ],
    [
      "gfx950-ngram-embedding-gather",
      "gfx950 N-gram hash-table gather",
      "gfx950_qwen_ngram_gather_v1",
    ],
    [
      "gfx950-muon-optimizer",
      "gfx950 Muon polar update",
      "gfx950_muon_update_4x4_v1",
    ],
    [
      "gfx950-gpt-oss-120b-megakernel",
      "gpt-oss-120b batch-1 layer-tile megakernel",
      "gfx950_gpt_oss_120b_decode_megakernel_v1",
    ],
  ] as const;
  const performanceLessonIds = new Set(
    routes
      .map(([lessonId]) => lessonId)
      .filter((lessonId) => lessonId !== "gfx950-deepseek-sparse-attention"),
  );

  expect(["desktop", "mobile"]).toContain(testInfo.project.name);
  for (const [lessonId, title, symbol] of routes) {
    await page.goto(`./#/lesson/${lessonId}`);
    await expect(
      page.getByText("Loading content...", { exact: true }),
    ).toBeHidden({
      timeout: 120_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expect(
      page.getByText(/^(?:Source example|GPU observed|Design only)$/u).first(),
    ).toBeVisible();
    await expect(page.getByRole("tabpanel")).toContainText(symbol);
    const performanceTab = page.getByRole("tab", { name: "Performance" });
    if (performanceLessonIds.has(lessonId)) {
      await performanceTab.click();
      await expect(page.getByRole("tabpanel")).toContainText(
        "FE2O3 GFX950 BOUNDED PERFORMANCE EVIDENCE",
      );
      await expect(page.getByRole("tabpanel")).toContainText(
        "not universal state-of-the-art claims",
      );
      await expect(page.getByRole("tabpanel")).toContainText(
        /(?:Contribution breakdown|CONTRIBUTION BREAKDOWN|OPTIMIZATION STACK AND CONTRIBUTION)/u,
      );
      await expect(page.getByRole("tabpanel")).toContainText(
        /(?:Theoretical bound|THEORETICAL RESOURCE FLOOR)/u,
      );
      const tabLayout = await page.locator(".code-tabs").evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        height: element.clientHeight,
      }));
      expect(tabLayout.clientWidth).toBeGreaterThan(0);
      expect(tabLayout.scrollWidth).toBeGreaterThanOrEqual(
        tabLayout.clientWidth,
      );
      expect(tabLayout.height).toBeGreaterThanOrEqual(42);
      await page.locator(".code-tool").screenshot({
        path: testInfo.outputPath(`${lessonId}-performance.png`),
        animations: "disabled",
      });
    } else {
      await expect(performanceTab).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
      `${testInfo.project.name}:${lessonId}`,
    ).toBe(false);
  }

  await page.goto("./#/lesson/gfx950-deepseek-sparse-attention");
  await page.getByRole("tab", { name: "Rust kernel" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn gfx950_deepseek_sparse_attention(",
  );
  await expect(page.getByRole("tab", { name: "Equivalent HIP" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Evidence record" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "NO COMPARISON-ONLY HIP LANE",
  );
  await page.screenshot({
    path: testInfo.outputPath("gfx950-deepseek-sparse-attention-evidence.png"),
    animations: "disabled",
  });

  await page.goto("./#/lesson/gfx950-gpt-oss-120b-megakernel");
  await expect(page.getByText("GPU observed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Design only", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Rust kernel" }).click();
  await expect(page.getByRole("tab", { name: "Rust kernel" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn gfx950_gpt_oss_120b_decode_megakernel_v1(",
  );
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/f7f13a0a687d58039d0573abc3e2eed792bff5f0/examples/gfx950_gpt_oss_decode/src/kernel.rs",
  );
  await page.getByRole("tab", { name: "Performance" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "optimized full kernel 1.065004 ms",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "component-materialization ablation measured component sum 1.251325 ms -> fused 1.065004 ms",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "14.8899% reduction",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "State-of-the-art claim: not claimed",
  );
  await page.goto("./#/lesson/gfx950-muon-optimizer");
  await page.getByRole("tab", { name: "Evidence record" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "eight visible AMD Instinct MI350X devices",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "reduced norm max_error=0 with norm=0.614919",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Rust-produced HSACO SHA-256: bb6e61181e05244a71b6475bcc34a6a0c62d94147bbe27304287f71d8181fe5d",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Evidence status: observed",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Formal source-to-machine proof: not claimed",
  );
});

test("every internal curriculum route resolves without page overflow", async ({
  page,
}) => {
  await page.goto("./#/lesson/read-the-evidence");
  await expect(
    page.getByText("Loading content...", { exact: true }),
  ).toBeHidden({
    timeout: 120_000,
  });
  const routeLinks = page.locator(".app-shell > .sidebar .tree-link");
  await expect(routeLinks).toHaveCount(35);
  const routes = await routeLinks.evaluateAll((links) =>
    links.map((link) => ({
      href: (link as HTMLAnchorElement).href,
      title: link.textContent?.trim() ?? "",
    })),
  );

  for (const route of routes) {
    await page.goto(route.href);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows, `page overflowed at ${route.href}`).toBe(false);
  }

  await page.goto("./#/architecture");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Evidence pipeline and authority boundaries",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Compiler baseline at ecf7b17f81",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/fixed nine-pass workload-neutral pre-lowering sequence/u),
  ).toBeVisible();
  await expect(
    page.getByText(/rustc remains the only Rust borrow checker/u),
  ).toBeVisible();
  await page.goto("./#/status");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Kernel delivery and verification progress",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Kernel implementation status" }),
  ).toBeVisible();
  await page.goto("./#/glossary");
  await expect(
    page.getByRole("heading", { level: 1, name: "Glossary and API index" }),
  ).toBeVisible();
});

test("correctness catalog and advanced lessons stay visually coherent", async ({
  page,
}, testInfo) => {
  const browserFailures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserFailures.push(message.text());
  });
  page.on("pageerror", (error) => browserFailures.push(error.message));

  const routes = [
    {
      id: "correctness-catalog",
      lesson: "compiler-checks",
      title: "Compiler checks: one path, explicit boundaries",
      target: "Representative compile-time rejections",
    },
    {
      id: "gemm",
      lesson: "gemm-tiling",
      title: "Dynamic GEMM end to end",
      target: "Correctness contract",
    },
    {
      id: "softmax",
      lesson: "softmax-invariant",
      title: "Dynamic row softmax",
      target: "Correctness contract",
    },
    {
      id: "attention",
      lesson: "flash-attention",
      title: "Dynamic FlashAttention with MFMA",
      target: "Correctness contract",
    },
    {
      id: "moe",
      lesson: "moe-expert-compute",
      title: "Dynamic grouped-expert MoE with MFMA",
      target: "Correctness contract",
    },
  ] as const;

  for (const route of routes) {
    await page.goto(`./#/lesson/${route.lesson}`);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();

    const shellLayout = await page.evaluate(() => {
      const topbar = document.querySelector<HTMLElement>(".topbar");
      const firstContent = document.querySelector<HTMLElement>(
        ".lesson-page > .lesson-header",
      );
      const sidebar = document.querySelector<HTMLElement>(
        ".app-shell > .sidebar",
      );
      const main = document.querySelector<HTMLElement>(".main-content");
      const topbarRect = topbar?.getBoundingClientRect();
      const firstRect = firstContent?.getBoundingClientRect();
      const sidebarRect = sidebar?.getBoundingClientRect();
      const mainRect = main?.getBoundingClientRect();
      return {
        horizontalOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        topbarOverlap:
          Boolean(topbarRect && firstRect) &&
          topbarRect!.bottom > firstRect!.top + 0.5,
        sidebarOverlap:
          Boolean(
            sidebarRect && mainRect && sidebar!.getClientRects().length,
          ) && sidebarRect!.right > mainRect!.left + 0.5,
      };
    });
    expect(shellLayout.horizontalOverflow, route.id).toBe(false);
    expect(shellLayout.topbarOverlap, route.id).toBe(false);
    expect(shellLayout.sidebarOverlap, route.id).toBe(false);

    const target = page.getByText(route.target, { exact: true }).first();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeVisible();
    if (route.target === "Correctness contract") {
      await page.getByLabel("Correctness contract").locator("summary").click();
    }

    const contentLayout = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(
        ".functional-correctness-panel",
      );
      const headingItems = panel
        ? [...panel.querySelectorAll<HTMLElement>(".section-heading-row > *")]
        : [];
      const rows = panel
        ? [
            ...panel.querySelectorAll<HTMLElement>(
              ".functional-contract-rows > div",
            ),
          ]
        : [];
      const intersects = (left: DOMRect, right: DOMRect) =>
        Math.min(left.right, right.right) - Math.max(left.left, right.left) >
          0.5 &&
        Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) >
          0.5;
      return {
        panelOverflow: panel ? panel.scrollWidth > panel.clientWidth : false,
        headingOverlap:
          headingItems.length === 2 &&
          intersects(
            headingItems[0].getBoundingClientRect(),
            headingItems[1].getBoundingClientRect(),
          ),
        rowOverlap: rows.some((row, index) =>
          index > 0
            ? row.getBoundingClientRect().top <
              rows[index - 1].getBoundingClientRect().bottom - 0.5
            : false,
        ),
      };
    });
    expect(contentLayout.panelOverflow, route.id).toBe(false);
    expect(contentLayout.headingOverlap, route.id).toBe(false);
    expect(contentLayout.rowOverlap, route.id).toBe(false);

    await page.screenshot({
      path: testInfo.outputPath(`${route.id}-viewport.png`),
      animations: "disabled",
    });
  }

  expect(browserFailures).toEqual([]);
});
