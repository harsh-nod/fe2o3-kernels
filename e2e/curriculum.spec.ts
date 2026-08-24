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
  const lessonEvidence = page.getByLabel("Evidence for this lesson");
  await expect(
    lessonEvidence.getByText("GPU observed", { exact: true }),
  ).toBeVisible();
  await expect(
    lessonEvidence.getByText("Verus model", { exact: true }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "exact_evidence_identity_is_admitted_v1",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ae312f421872e1eb9885217888548d74f79c3357/examples/flash_attention_v1/verus/flash_attention_v1.rs",
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
    "https://github.com/harsh-nod/fe2o3/blob/c88681a356516982bdb96496ac5f9839d0e91bd7/examples/tiled_gemm_general_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Equivalent HIP" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "__builtin_amdgcn_mfma_f32_16x16x16bf16_1k",
  );
  await expect(page.getByRole("tabpanel").locator("code.language-cpp")).toBeVisible();
  await expect(page.getByRole("tabpanel").locator(".token.keyword").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/c88681a356516982bdb96496ac5f9839d0e91bd7/examples/tiled_gemm_general_v1/benchmark_hip.cpp",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "multi-workgroup-dynamic-k",
  );
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/c88681a356516982bdb96496ac5f9839d0e91bd7/examples/tiled_gemm_general_v1/src/main.rs",
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

  await page.goto("./#/lesson/gemm-proof-plan");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Optimizing the executable baseline",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Generic PLIRON safety passes are mandatory before lowering"),
  ).toBeVisible();
  await page.goto("./#/lesson/compiler-checks");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Compiler checks: reject invalid kernels",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Eighteen representative compile-time failures",
    }),
  ).toBeVisible();
  const failureGallery = page.locator(".compile-failure-gallery");
  await expect(failureGallery.getByText("Swapped MFMA operand roles")).toBeVisible();
  await expect(failureGallery.getByText("B fragment uses the wrong transpose")).toBeVisible();
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
  await expect(failureGallery.getByText("FE2O3-BOUNDS-001", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("E0308", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-TENSOR-LAYOUT-001", { exact: true }).first()).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-ATOMIC-001", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-RACE-001", { exact: true }).first()).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-BARRIER-001", { exact: true })).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-WORKGROUP-001", { exact: true }).first()).toBeVisible();
  await expect(failureGallery.getByText("FE2O3-SEMANTIC-001", { exact: true })).toBeVisible();
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
  await expect(page.getByRole("cell", { name: "FE2O3-BARRIER-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-WORKGROUP-002", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "FE2O3-SEMANTIC-002", exact: true })).toBeVisible();
  await page
    .getByRole("heading", {
      level: 3,
      name: "Eighteen representative compile-time failures",
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
    "https://github.com/harsh-nod/fe2o3/blob/c88681a356516982bdb96496ac5f9839d0e91bd7/examples/row_softmax_general_v1/src/kernel.rs",
  );
  await expect(page.getByText(/One wave owns one dynamic row/u)).toBeVisible();

  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "separate_input_and_output_accesses_do_not_alias_v1",
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
    "https://github.com/harsh-nod/fe2o3/blob/ae312f421872e1eb9885217888548d74f79c3357/examples/wave64_collectives_v1/src/kernel.rs",
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
    "https://github.com/harsh-nod/fe2o3/blob/ae312f421872e1eb9885217888548d74f79c3357/examples/workgroup_sync_v1/src/kernel.rs",
  );
  await expect(
    page.getByRole("link", { name: "Exact separate scoped_atomic.rs source" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ae312f421872e1eb9885217888548d74f79c3357/examples/workgroup_sync_v1/src/scoped_atomic.rs",
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
    "https://github.com/harsh-nod/fe2o3/blob/c88681a356516982bdb96496ac5f9839d0e91bd7/examples/moe_grouped_expert_general_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Verus" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub proof fn host_schedule_phase_order_is_exact_v1",
  );
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ae312f421872e1eb9885217888548d74f79c3357/examples/moe_expert_v1/verus/moe_expert_memory_v1.rs",
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

test("every internal curriculum route resolves without page overflow", async ({
  page,
}) => {
  await page.goto("./#/lesson/read-the-evidence");
  const routeLinks = page.locator(".app-shell > .sidebar .tree-link");
  await expect(routeLinks).toHaveCount(20);
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
      name: "Compiler main at c88681a356",
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
