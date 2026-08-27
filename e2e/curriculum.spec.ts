import { expect, test } from "@playwright/test";

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
  await expect(page.getByLabel("Read and write region ownership")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show proof details" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Verus proof" }),
  ).toHaveCount(0);
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

test("retired CPU semantic simulation keeps its evidence boundary visible", async ({
  page,
}, testInfo) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Review the retired CPU simulator",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Why the alternate simulator was retired",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Read the archived result as an observation",
    }),
  ).toBeVisible();
  await expect(page.getByText("performance_prediction: false")).toBeVisible();
  await expect(page.getByText(/Current main removed that alternate Cargo simulation route/u)).toBeVisible();
  await expect(
    page.getByText(/trusted, unsandboxed host code/u),
  ).toBeVisible();
  await expect(
    page.getByText(/does not attest arbitrary build-script behavior/u),
  ).toBeVisible();
  await expect(
    page.getByText(/fresh ephemeral generation/u),
  ).toBeVisible();
  await expect(
    page.getByLabel("CPU semantic simulation of one authenticated WG64"),
  ).toContainText("60 inactive slots");
  await expect(page.getByRole("tabpanel")).toContainText("pub fn fill");
  await expect(page.getByText(/Explanatory source/u)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    /crates\/cargo-fe2o3\/tests\/fixtures\/simulation-source-fill\/src\/lib\.rs$/u,
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "fe2o3-simulation-request-v1",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "cargo fe2o3 simulate",
  );
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "availability: retired_from_current_main",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "hardware_observed: false",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "0x11000000110000001100000011000000",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "counts.workgroups_visited: 1",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "counts.scheduled_slots_visited: 64",
  );

  const screenshot = testInfo.outputPath("cpu-semantic-simulation.png");
  await page.screenshot({
    path: screenshot,
    animations: "disabled",
    fullPage: true,
  });
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
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
  await expect(page.getByText(/no freshness or replay authority/u)).toBeVisible();
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
    page.getByText("A future matrix PV phase must accept the QK result layout", {
      exact: true,
    }),
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
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
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
    ".ok_or(KernelError::OutOfBounds)?",
  );
  await expect(
    page.getByRole("tabpanel").locator(".token.keyword").first(),
  ).toBeVisible();
  await expect(
    page.getByLabel("Dynamic GEMM wave tile ownership"),
  ).toContainText("BF16 fragments → MFMA");
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/tiled_gemm_general_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("#![forbid(unsafe_code)]");
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
    page
      .locator(".code-status")
      .filter({ hasText: /workload-neutral compiler replays eligible exact point formulas/u }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: "Verus refinement" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact_hierarchy_writes_refine_safe_cpu_reference_v1",
  );

  await page.getByRole("tab", { name: "Equivalent HIP" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "__builtin_amdgcn_mfma_f32_16x16x16bf16_1k",
  );
  await expect(page.getByRole("tabpanel").locator("code.language-cpp")).toBeVisible();
  await expect(page.getByRole("tabpanel").locator(".token.keyword").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/tiled_gemm_general_v1/benchmark_hip.cpp",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "multi-workgroup-dynamic-k",
  );
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/af0fd523e3b774377a9c5192cf0511e34fa19735/examples/tiled_gemm_general_v1/src/main.rs",
  );

  await page.getByRole("tab", { name: "MI300X result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "81 correspondence blocks",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS strided-all-tails",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS multi-workgroup-dynamic-k",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS zero-k-epilogue",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "not faster than HIP yet",
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
      name: "Optimizing the executable baseline",
    }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText("Generic PLIRON safety passes are mandatory before lowering"),
  ).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = "/lesson/compiler-checks";
  });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Compiler checks: reject invalid kernels",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Twenty-six representative compile-time failures",
    }),
  ).toBeVisible();
  const failureGallery = page.locator(".compile-failure-gallery");
  await expect(failureGallery.getByText("Swapped MFMA operand roles")).toBeVisible();
  await expect(failureGallery.getByText("B fragment uses the wrong transpose")).toBeVisible();
  await expect(
    failureGallery.getByText("PV MFMA consumes the wrong QK layout"),
  ).toBeVisible();
  await expect(failureGallery.getByText("Partial tile has no edge policy")).toBeVisible();
  await expect(failureGallery.getByText("Different views still alias one allocation")).toBeVisible();
  await expect(failureGallery.getByText("Rounded 2D launch creates a partial workgroup")).toBeVisible();
  await expect(failureGallery.getByText("Kernel asks for an unsupported grid barrier")).toBeVisible();
  await expect(failureGallery.getByText("Static out-of-bounds access")).toBeVisible();
  await expect(failureGallery.getByText("Illegal atomic ordering")).toBeVisible();
  await expect(failureGallery.getByText("Cross-invocation write race")).toBeVisible();
  await expect(failureGallery.getByText("Invocation-divergent barrier")).toBeVisible();
  await expect(failureGallery.getByText("Workgroup read before initialization")).toBeVisible();
  await expect(failureGallery.getByText("Declared formula mismatch")).toBeVisible();
  await expect(
    failureGallery.getByText("The grid leaves one output coordinate unwritten"),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("A CPU-reference effect has no policy-checked staging"),
  ).toBeVisible();
  await expect(
    failureGallery.getByText("The GPU write disagrees with the CPU reference"),
  ).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-BOUNDS-001", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("E0308", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-TENSOR-LAYOUT-001", { exact: true }).first()).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-TENSOR-LAYOUT-005", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-ATOMIC-001", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-RACE-001", { exact: true }).first()).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-BARRIER-001", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-WORKGROUP-001", { exact: true }).first()).toBeVisible();
  await expect(
    failureGallery.getByText("FE2O3-SEMANTIC-001", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    failureGallery.getByLabel("Compile-time rejection path"),
  ).toContainText("No lowering or artifact");
  await expect(
    failureGallery.getByText(/tensor layout first/u),
  ).toBeVisible();
  await expect(
    failureGallery.getByText(/required: 64 < 64/u),
  ).toBeVisible();
  await expect(
    failureGallery.getByText(/second writer\/reader: invocation \[1\]/u),
  ).toBeVisible();
  await expect(
    page.getByText("Generic does not mean automatically provable"),
  ).toBeVisible();
  await expect(
    page.getByText("One Rust type system, extended to GPU facts", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("What KernelResult means", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Where Verus fits", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("The CPU reference closes semantics, not hardware layout", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Production errors include a repair contract", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Supported safe ownership mappings", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Shifted<Index1D, N>", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Blocked<Index1D, L, E> where L > 1", exact: true })).toBeVisible();
  await expect(
    page.getByText("Ordinary Rust atomic terminals are explicitly unsupported"),
  ).toBeVisible();
  await expect(
    page.getByText("Stable pass diagnostic catalog"),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "kernel-structural-v1" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "kernel-tensor-layout-v1" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-TENSOR-LAYOUT-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-BOUNDS-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-ATOMIC-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-RACE-003", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-RACE-004", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-OWN-006", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-BARRIER-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-WORKGROUP-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-PARALLEL-010", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-PARALLEL-013", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-PARALLEL-023", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-PARALLEL-026", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-PARALLEL-027", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-PARALLEL-031", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-SEMANTIC-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-SEMANTIC-003", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-EFFECT-001", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-EFFECT-008", exact: true })).toBeVisible();
  await expect(page.getByText("Bind the reference as ordinary Rust", { exact: true })).toBeVisible();
  await expect(page.getByText("Bind proof execution without trusting staging", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      /The generated Verus checker replays supported exact pointwise integer and compiler-side IEEE operator-DAG formulas/u,
    ),
  ).toBeVisible();

  await page.getByRole("button", { name: "Show proof details" }).click();
  await page.getByRole("tab", { name: "Reference-bound kernel" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("reference = cpu_reference");
  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "fn cpu_reference(_point: usize, output: &mut u32)",
  );
  await page.getByRole("tab", { name: "Production proof gate" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("proof.require_effect_refinement");
  await expect(page.getByRole("tabpanel")).toContainText("SafeReferenceMirToLivePliron");
  await expect(page.getByRole("tabpanel")).toContainText(
    "proved_source_to_isa = false",
  );
  await page.getByRole("tab", { name: "Bounds fixture" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("let selected = input[64]");
  await page.getByRole("tab", { name: "Reference diagnostics" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("required: 64 < 64");
  await page
    .getByRole("heading", {
      level: 3,
      name: "Twenty-six representative compile-time failures",
    })
    .scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -72));
  await page.screenshot({
    path: testInfo.outputPath("compile-errors.png"),
    animations: "disabled",
  });
  await expect(
    page.getByText("Compile-time kernel diagnostics"),
  ).toBeVisible();
  await expect(
    page.getByText("Debug exact V7 without upgrading observation into proof"),
  ).toBeVisible();
  await expect(page.getByText(/fe2o3-kir-sim --kir-v7/u)).toBeVisible();
  await page.goto("./#/lesson/gemm-proof-plan");
  await expect(page.getByText("0x46470006", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "unguarded_a_tail_load" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "missing_publish_barrier" })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "duplicate_lane_c_write" }),
  ).toBeVisible();
  await expect(
    page.getByText("A rustc UI error is not a proof diagnostic"),
  ).toBeVisible();
  await expect(
    page.getByText("All 15 are rejected as structured KIR"),
  ).toBeVisible();
  await expect(
    page.getByText("All 15 exact safe source mutations are diagnostic"),
  ).toBeVisible();
  await expect(
    page.getByText("Historical LDS-family flags remain false"),
  ).toBeVisible();
  await expect(page.getByText("Executable direct-global MFMA source", { exact: true })).toBeVisible();
  await expect(page.getByText("Cooperative-LDS positive source", { exact: true })).toBeVisible();
  await expect(page.getByText("Private final pair join", { exact: true })).toBeVisible();
  await expect(page.getByText("Verus runtime closure", { exact: true })).toBeVisible();
  await expect(page.getByText("Current MFMA qualification", { exact: true })).toBeVisible();
  await expect(page.getByText(/historical selector exists for the proposed LDS schedule/u).first()).toBeVisible();
  await expect(
    page.getByText(/before receipt, correspondence, configuration, and proof/u).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/It is unreachable because positive analysis stops/u).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /#138 General tiled GEMM/ }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/issues/138",
  );
  for (const issue of [85, 86, 87, 88, 89, 90, 96, 97, 99, 100]) {
    await expect(
      page.getByRole("link", { name: new RegExp(`#${String(issue)} `, "u") }),
    ).toHaveAttribute(
      "href",
      `https://github.com/harsh-nod/fe2o3/issues/${String(issue)}`,
    );
  }
  await expect(
    page.getByRole("link", { name: /fe2o3-kernels #2/ }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3-kernels/issues/2",
  );
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
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333/examples/row_softmax_general_v1/src/kernel.rs",
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
  await expect(page.getByRole("tabpanel")).toContainText(
    "fn launch_case",
  );
  await expect(
    page.getByText(/ordinary host FFI boundaries/u),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS single-column",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "PASS maximum-width",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "lane shuffles and no MFMA",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "not a proof for every input or a performance claim",
  );
});

test("Wave 2 lessons expose exact source and bounded latest status", async ({
  page,
}) => {
  await page.goto("./#/lesson/reductions-scans");
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn wave64_collectives_v1",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
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
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
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
    "https://github.com/harsh-nod/fe2o3/blob/d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333/examples/moe_grouped_expert_general_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("#![forbid(unsafe_code)]");
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
    "https://github.com/harsh-nod/fe2o3/blob/d570d61d67fa5ae6fe3e2778f473b8ba5d5f9333/examples/verus_vecadd/verus/reference_refinement_v1.rs",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "fn launch_expert",
  );
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
    "not a routing proof, persistent scheduling implementation, or performance result",
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
  await expect(checkpoint).toContainText("all seven expected-failure mutations");
  await expect(checkpoint).toContainText("all 625 count vectors");
  await expect(checkpoint).toContainText(
    "does not authenticate router execution or device readback provenance",
  );
  await expect(checkpoint).toContainText("upload/readback test is no kernel dispatch");
  const expertRow = page
    .getByRole("row")
    .filter({ hasText: "MoE expert GEMM and combine" });
  await expect(expertRow).toContainText("Partial");
  await expect(expertRow).toContainText(
    "authenticated router completion and device readback provenance",
  );
  await expect(expertRow).toContainText("freshness and replay authority");
});

test("gfx950 lessons expose source, ISA, and external runtime evidence", async ({
  page,
}) => {
  await page.goto("./#/lesson/gfx950-fp4-attention");
  await expect(page.getByText("Loading content...", { exact: true })).toBeHidden({
    timeout: 120_000,
  });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "gfx950 FP4 flash attention",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Source example", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "gfx950_fp4_attention_rust",
  );

  await page.getByRole("tab", { name: "Safe CPU reference" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("attention_reference");
  await page.getByRole("tab", { name: "Equivalent HIP" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("gfx950_fp4_flash_attention");
  await page.getByRole("tab", { name: "Run and inspect" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("ds_read_b64_tr_b4");
  await expect(page.getByRole("tabpanel")).toContainText(
    "v_mfma_f32_16x16x128_f8f6f4",
  );

  await page.getByRole("tab", { name: "Evidence record" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Rust gfx950 lowering supported: false",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "FP4 attention max_error=2.38419e-07",
  );

  await page.goto("./#/lesson/gfx950-fp8-attention");
  await expect(page.getByText("Loading content...", { exact: true })).toBeHidden({
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

test("every gfx950 low-precision lesson opens its Rust kernel", async ({ page }) => {
  const lessons = [
    ["gfx950-fp4-gemm", "gfx950 FP4 GEMM", "gfx950_fp4_gemm_rust"],
    ["gfx950-fp8-gemm", "gfx950 FP8 GEMM", "gfx950_fp8_gemm_rust"],
    ["gfx950-fp4-attention", "gfx950 FP4 flash attention", "gfx950_fp4_attention_rust"],
    ["gfx950-fp8-attention", "gfx950 FP8 flash attention", "gfx950_fp8_attention_rust"],
  ] as const;

  for (const [lessonId, title, symbol] of lessons) {
    await page.goto(`./#/lesson/${lessonId}`);
    await expect(page.getByText("Loading content...", { exact: true })).toBeHidden({
      timeout: 120_000,
    });
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Rust kernel" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tabpanel")).toContainText(symbol);
    await expect(page.getByRole("tabpanel")).toContainText("rust");
    await expect(
      page.getByRole("link", { name: "Source", exact: true }),
    ).toHaveAttribute(
      "href",
      /\/blob\/91e3cf2b4d8145d8c269ea3f783da53f90c568f4\/examples\/gfx950_low_precision\/src\/kernel\.rs$/,
    );
  }
});

test("advanced gfx950 source-example lessons render on desktop and mobile", async ({
  page,
}, testInfo) => {
  const routes = [
    ["gfx950-advanced-moe", "gfx950 advanced MoE pipeline", "gfx950_moe_route_fp4_t16_e4_k2_v1"],
    ["gfx950-kda-gdn-linear-attention", "gfx950 KDA/GDN linear attention", "gfx950_kda_gdn_decode"],
    ["gfx950-indexed-sparse-attention", "gfx950 indexed sparse attention", "gfx950_content_sparse_attention"],
    ["gfx950-compressed-hybrid-attention", "gfx950 compressed hybrid attention", "gfx950_compressed_hybrid_attention"],
    ["gfx950-attnres-gr-mhc", "gfx950 AttnRes, GR, and mHC mixing", "gfx950_attnres_aggregate"],
    ["gfx950-speculative-mtp-verification", "gfx950 speculative and MTP verification", "gfx950_speculative_transaction_v1"],
    ["gfx950-ngram-embedding-gather", "gfx950 N-gram hash-table gather", "gfx950_qwen_ngram_gather_v1"],
    ["gfx950-muon-optimizer", "gfx950 Muon polar update", "gfx950_muon_update_4x4_v1"],
  ] as const;

  expect(["desktop", "mobile"]).toContain(testInfo.project.name);
  for (const [lessonId, title, symbol] of routes) {
    await page.goto(`./#/lesson/${lessonId}`);
    await expect(page.getByText("Loading content...", { exact: true })).toBeHidden({
      timeout: 120_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expect(
      page.getByText("Source example", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("tabpanel")).toContainText(
      symbol,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
      `${testInfo.project.name}:${lessonId}`,
    ).toBe(false);
  }

  await page.getByRole("tab", { name: "Evidence record" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "eight visible AMD Instinct MI350X devices",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "reduced norm max_error=0 with norm=0.614919",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Rust-produced HSACO: none",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Formal proof: not claimed",
  );
});

test("every internal curriculum route resolves without page overflow", async ({
  page,
}) => {
  await page.goto("./#/lesson/read-the-evidence");
  await expect(page.getByText("Loading content...", { exact: true })).toBeHidden({
    timeout: 120_000,
  });
  const routeLinks = page.locator(".app-shell > .sidebar .tree-link");
  await expect(routeLinks).toHaveCount(33);
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
      name: "Compiler baseline at d570d61d67",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/generic safety sequence is active and mandatory before lowering/u),
  ).toBeVisible();
  await expect(
    page.getByText(/does not contain a second Rust borrow checker/u),
  ).toBeVisible();
  await page.goto("./#/status");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Kernel delivery and verification progress",
    }),
  ).toBeVisible();
  await expect(page.getByRole("table", { name: "Kernel implementation status" })).toBeVisible();
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
      title: "Compiler checks: reject invalid kernels",
      target: "Stable pass diagnostic catalog",
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
          Boolean(sidebarRect && mainRect && sidebar!.getClientRects().length) &&
          sidebarRect!.right > mainRect!.left + 0.5,
      };
    });
    expect(shellLayout.horizontalOverflow, route.id).toBe(false);
    expect(shellLayout.topbarOverlap, route.id).toBe(false);
    expect(shellLayout.sidebarOverlap, route.id).toBe(false);

    const target = page.getByText(route.target, { exact: true }).first();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeVisible();
    if (route.target === "Correctness contract") {
      await page
        .getByLabel("Correctness contract")
        .locator("summary")
        .click();
    }

    const contentLayout = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(
        ".functional-correctness-panel",
      );
      const headingItems = panel
        ? [...panel.querySelectorAll<HTMLElement>(".section-heading-row > *")]
        : [];
      const rows = panel
        ? [...panel.querySelectorAll<HTMLElement>(".functional-contract-rows > div")]
        : [];
      const intersects = (left: DOMRect, right: DOMRect) =>
        Math.min(left.right, right.right) - Math.max(left.left, right.left) > 0.5 &&
        Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 0.5;
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
