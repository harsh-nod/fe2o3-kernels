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

  const isMobile = testInfo.project.name === "mobile";
  if (isMobile) {
    await page.getByRole("button", { name: "Open curriculum" }).click();
    await expect(
      page.getByRole("dialog", { name: "Curriculum navigation" }),
    ).toBeVisible();
    await page.screenshot({
      path: "/tmp/fe2o3-kernels-mobile-drawer.png",
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Close curriculum" }).click();
  } else {
    await expect(
      page.getByRole("complementary", { name: "Curriculum" }),
    ).toBeVisible();
  }

  const viewportScreenshot = `/tmp/fe2o3-kernels-${testInfo.project.name}.png`;
  await page.screenshot({ path: viewportScreenshot, animations: "disabled" });

  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    diagrams: document.querySelectorAll("figure.diagram").length,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.diagrams).toBeGreaterThan(0);
});

test("search, theme, tabs, and progress work together", async ({ page }) => {
  await page.goto("./#/lesson/read-the-evidence");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Read the evidence before the code",
    }),
  ).toBeVisible();
  await page.keyboard.press("Control+K");
  const search = page.getByRole("textbox", {
    name: "Search lessons and glossary",
  });
  await expect(search).toBeFocused();
  await search.fill("flash attention");
  await page
    .getByRole("option", { name: /Flash attention: online invariant/ })
    .click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Flash attention: online invariant",
    }),
  ).toBeVisible();
  const lessonEvidence = page.getByLabel("Evidence for this lesson");
  await expect(
    lessonEvidence.getByText("Source tested", { exact: true }),
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
    "https://github.com/harsh-nod/fe2o3/blob/5c25611adbd99e807957dfc9a0a6a63e83a9e099/examples/flash_attention_v1/verus/flash_attention_v1.rs",
  );
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("tiled GEMM shows exact source, proof, host, and bounded result", async ({
  page,
}) => {
  await page.goto("./#/lesson/gemm-tiling");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Tiled GEMM: map ownership first",
    }),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Ordinary Rust source for the fixed Slice 1 LDS tiled GEMM",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/c4fcb4d980cf979c0527dfa135a7b9f4fe72a811/examples/tiled_gemm_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "--test lds_source_refinement",
  );
  await expect(page.getByText(/Real pinned command and bounded Verus source/)).toContainText(
    "96 obligations verify",
  );
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/5a45239aeeda3ca64cf16beb7fb1d3589e649bfe/examples/tiled_gemm_v1/verus/lds_tiled_slice1_source_refinement.rs",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "FE2O3_RUN_GFX942_TILED_GEMM_LDS_SLICE1_WORKER_V2_HARDWARE=1",
  );
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/c4fcb4d980cf979c0527dfa135a7b9f4fe72a811/crates/fe2o3-hsa-runtime/tests/tiled_gemm_lds_slice1_worker_v2_hardware.rs",
  );

  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "FE2O3_PROTECTED_SLICE1_WORKER_V2_OK outputs=256 max_abs_error=0",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "all 256 output bit patterns",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "A and B remained bitwise unchanged",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "1/1 passed in 14.36 seconds",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "not generalized GEMM",
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
    "https://github.com/harsh-nod/fe2o3/blob/d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8/examples/wave64_collectives_v1/src/kernel.rs",
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
    "historical source-model record itself grants no hardware authority",
  );

  await page.goto("./#/lesson/lds-barriers-atomics");
  await page.getByRole("tab", { name: "Kernel" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn lds_publish_read_reduce_i32_v1",
  );
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8/examples/workgroup_sync_v1/src/kernel.rs",
  );
  await expect(
    page.getByRole("link", { name: "Exact separate scoped_atomic.rs source" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/d592ecee1154ca39daf1f9b1c2e02ab462e6c5f8/examples/workgroup_sync_v1/src/scoped_atomic.rs",
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

test("MoE expert lesson exposes attributed kernels and bounded proof evidence", async ({
  page,
}) => {
  await page.goto("./#/lesson/moe-expert-compute");
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn moe_expert_gemm_bf16_m16_n16_k16_v1",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn moe_expert_combine_f32_t8_k2_o16_v1",
  );
  await expect(page.getByText(/Explanatory source/)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/b35c7ceff5b99494fcef2f419a4351dd5fb591cc/examples/moe_expert_v1/src/kernel.rs",
  );

  await page.getByRole("tab", { name: "Verus" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub proof fn host_schedule_phase_order_is_exact_v1",
  );
  await expect(
    page.getByRole("link", { name: "Source", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/ff0c08a5bdca2568178f690c04c0b0c6bfa6febe/examples/moe_expert_v1/verus/moe_expert_memory_v1.rs",
  );

  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "examples/moe_expert_v1/run-verus.sh",
  );
  await expect(
    page.getByText(/They do not dispatch a GPU kernel\./u),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "No functional hardware result is claimed",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Grouped or persistent expert scheduling is still separate future work",
  );
});

test("every internal curriculum route resolves without page overflow", async ({
  page,
}) => {
  await page.goto("./#/lesson/read-the-evidence");
  const routes = await page
    .locator(".app-shell > .sidebar .tree-link")
    .evaluateAll((links) =>
      links.map((link) => ({
        href: (link as HTMLAnchorElement).href,
        title: link.textContent?.trim() ?? "",
      })),
    );
  expect(routes).toHaveLength(18);

  for (const route of routes) {
    await page.goto(route.href);
    await expect(
      page.getByRole("heading", { level: 1, name: route.title }),
    ).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
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
