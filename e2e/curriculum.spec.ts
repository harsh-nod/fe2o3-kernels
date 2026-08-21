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

test("runtime milestone exposes a safe runnable example and evidence boundary", async ({
  page,
}, testInfo) => {
  await page.goto("./#/runtime");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "From one packet to a production runtime",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "One runtime ownership pipeline" }),
  ).toBeVisible();
  await expect(page.getByText("Implementation checked", { exact: true })).toHaveCount(4);
  await expect(page.getByText("Run locally (CPU-safe)")).toHaveCount(5);
  await expect(page.getByText(/cargo test -p fe2o3-runtime-model/u)).toBeVisible();
  await expect(page.getByText(/not yet been re-observed on MI300X/u)).toBeVisible();
  await expect(page.getByText(/FE2O3_RUN/u)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Public one-shot synchronous vecadd API" }),
  ).toBeVisible();
  await expect(page.getByText("Exactly three ownership outcomes")).toBeVisible();
  await expect(page.getByText("DefinitelyNotPublished", { exact: true })).toBeVisible();
  await expect(page.getByText("RetainedTerminal")).toBeVisible();
  await expect(page.getByText(/released12 and retained0/u)).toBeVisible();
  await expect(page.getByText(/implementation-checked and unmeasured/u)).toHaveCount(3);
  await expect(page.getByText(/MI300X required; the browser only copies/u)).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Copy hardware command" })).toHaveCount(2);
  await expect(
    page.getByRole("heading", {
      name: "One bounded MI300X current-V2 requalification",
    }),
  ).toBeVisible();
  await expect(page.getByText("Evidence reviewed", { exact: true })).toBeVisible();
  await expect(page.getByText("Bounded MI300X observation")).toBeVisible();
  await expect(page.getByText(/group_status=1 afterward/u)).toBeVisible();
  await expect(page.getByText(/actual2\/expected1 defect remains open/u)).toBeVisible();
  await expect(page.getByText(/No rerun was performed/u)).toBeVisible();
  await expect(page.getByText("7324c8a8457c20298ccac1b7791fe219cf72d83dd982aea145c5b730fa19d6c3")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Compiler-to-KFD compatibility leaf" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /deliberately rejected before bridge-owned VM, memory, queue, or packet work/u,
    ),
  ).toBeVisible();
  await expect(page.getByText(/556f97ee4e509b4c/u)).toBeVisible();
  await expect(page.getByText(/RequiredWorkgroupSize \{ actual: None \}/u)).toBeVisible();
  await expect(page.getByText(/zero opens of \/dev\/kfd or \/dev\/dri/u)).toBeVisible();
  await expect(page.getByText(/one-bit payload substitution fails closed/u)).toBeVisible();
  const convergenceHeading = page.getByRole("heading", {
    name: "Exact Kernel IR V1 compiler convergence",
  });
  await expect(convergenceHeading).toBeVisible();
  await expect(
    page.getByText("08af31846f37d715cfde9af67c843761a78c2b71"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /kernel_ir_v1_vecadd_cov6_llc_o2.rs/u }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/08af31846f37d715cfde9af67c843761a78c2b71/crates/rustc-codegen-fe2o3/src/kernel_ir_v1_vecadd_cov6_llc_o2.rs",
  );
  await expect(page.getByText(/ec153356f5bd021b5d9a9dd6809eaa53/u)).toHaveCount(2);
  await expect(page.getByText(/8ade5e0e3807c7ceed3ffbbe8b1d12c4/u)).toHaveCount(2);
  await expect(page.getByText(/c4547fe045f839711f1f022a485f50c7/u)).toHaveCount(3);
  await expect(
    page.getByText(/zero \/dev\/kfd or \/dev\/dri opens and zero ioctl calls/u),
  ).toBeVisible();
  await expect(page.getByText(/legacy-clang route only when its untyped fill facts/u)).toBeVisible();
  await expect(page.getByText(/no GPU execution, hardware result, numerical result/u)).toBeVisible();
  await expect(page.getByText("Freeze and review the joined compiler path")).toBeVisible();
  await expect(page.getByText("Run one bounded compiler-generated MI300X attempt")).toBeVisible();
  await expect(
    page.getByText("1c694eed427526dc507a129a721237613bafe094"),
  ).toBeVisible();
  await expect(
    page.getByText("83cb7fb98519f1934af7f263f823363668c41ba7"),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({
    path: `/tmp/fe2o3-kernels-runtime-top-${testInfo.project.name}.png`,
    animations: "disabled",
  });
  await convergenceHeading.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `/tmp/fe2o3-kernels-runtime-convergence-${testInfo.project.name}.png`,
    animations: "disabled",
  });
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
}, testInfo) => {
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
    page.getByText("All 15 fail at compile time, no general execution"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "Five kernels that never become GPU artifacts",
    }),
  ).toBeVisible();
  const failureGallery = page.locator(".compile-failure-gallery");
  await expect(failureGallery.getByText("Out-of-bounds global load")).toBeVisible();
  await expect(failureGallery.getByText("Duplicate output ownership")).toBeVisible();
  await expect(failureGallery.getByText("Lane-divergent barrier")).toBeVisible();
  await expect(failureGallery.getByText("LDS read before initialization")).toBeVisible();
  await expect(failureGallery.getByText("Incorrect alpha/beta epilogue")).toBeVisible();
  await expect(failureGallery.getByText("0x46470102")).toBeVisible();
  await expect(failureGallery.getByText("0x46470106")).toBeVisible();
  await expect(failureGallery.getByText("0x46470105")).toBeVisible();
  await expect(failureGallery.getByText("0x46470103")).toBeVisible();
  await expect(failureGallery.getByText("0x4647010a")).toBeVisible();
  await expect(
    failureGallery.getByLabel("Compile-time rejection path"),
  ).toContainText("No artifact");
  await expect(
    failureGallery.getByText(/exact safe-Rust mutation/u),
  ).toBeVisible();
  await page
    .getByRole("heading", {
      level: 3,
      name: "Five kernels that never become GPU artifacts",
    })
    .scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -72));
  await page.screenshot({
    path: `/tmp/fe2o3-kernels-compile-errors-${testInfo.project.name}.png`,
    animations: "disabled",
  });
  await expect(
    page.getByText("Rust UI and semantic proof are different"),
  ).toBeVisible();
  await expect(page.getByText("0x46470101", { exact: true })).toBeVisible();
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
    page.getByText("Complete-family flags remain false"),
  ).toBeVisible();
  await expect(page.getByText("Positive production source", { exact: true })).toBeVisible();
  await expect(page.getByText("Private final pair join", { exact: true })).toBeVisible();
  await expect(page.getByText("Verus runtime closure", { exact: true })).toBeVisible();
  await expect(page.getByText("Protected hardware", { exact: true })).toBeVisible();
  await expect(page.getByText(/collected-general-gemm-v1 selector exists/u).first()).toBeVisible();
  await expect(page.getByText(/before any positive receipt, frontend correspondence/u).first()).toBeVisible();
  await expect(page.getByText(/independent second downstream blocker/u).first()).toBeVisible();
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
