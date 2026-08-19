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
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Issue #138: the general safe-Rust contract",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Current layers, no general execution"),
  ).toBeVisible();
  await expect(
    page.getByText("Rust UI and semantic proof are different"),
  ).toBeVisible();
  await expect(page.getByText("0x46470101", { exact: true })).toBeVisible();
  await expect(page.getByText("0x46470006", { exact: true })).toBeVisible();
  await expect(page.getByText("unguarded_a_tail_load", { exact: true })).toBeVisible();
  await expect(page.getByText("missing_publish_barrier", { exact: true })).toBeVisible();
  await expect(
    page.getByText("duplicate_lane_c_write", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("A rustc UI error is not a proof diagnostic"),
  ).toBeVisible();
  await expect(
    page.getByText("All 15 are rejected as structured KIR"),
  ).toBeVisible();
  await expect(
    page.getByText("Complete-family flags remain false"),
  ).toBeVisible();
  await expect(page.getByText("missing-publish", { exact: true })).toBeVisible();
  await expect(page.getByText("duplicate-store", { exact: true })).toBeVisible();
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

test("row softmax separates real source from pending and GPU evidence", async ({
  page,
}) => {
  await page.goto("./#/lesson/softmax-invariant");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Softmax: one fixed row, six evidence layers",
    }),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel")).toContainText(
    "pub fn row_softmax_v1",
  );
  await expect(page.getByText(/Explanatory source/u)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/86c4ca67a673bfec966f79e6c701104db872d8ea/examples/row_softmax_v1/src/kernel.rs",
  );
  await expect(page.getByText(/complete syn AST structural admission/u)).toBeVisible();

  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "separate_input_and_output_accesses_do_not_alias_v1",
  );
  await expect(
    page.getByText("Address separation is an obligation, not end-to-end race freedom"),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Host" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "JoinedProtectedRowSoftmaxV1",
  );
  await expect(
    page.getByText(/production authority still failing closed before HSA load/u),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Two fresh complete MI300X runs passed",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "independent review accepted the evidence package",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "no protected dispatch and no numerical GPU result",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "does not justify a cuda-oxide parity promotion",
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
  await expect(page.getByRole("tabpanel")).toContainText(
    "scripts/test-moe-expert-compact-plan-verus.sh",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "gfx942_routing_bridge_upload_readback_and_denial_are_exact",
  );
  await expect(
    page.getByText(/The upload fixture dispatches no kernel/u),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "No functional expert GPU result or performance result is claimed",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "No expert kernel was dispatched",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "no freshness or replay authority",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Grouped or persistent expert scheduling is still separate future work",
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
      name: "Pliron ownership and device identity at 2f7c4fd1d",
    }),
  ).toBeVisible();
  await expect(page.getByText(/These services, models, and contracts do not complete/)).toContainText(
    "make an explanatory lesson kernel functional",
  );
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
