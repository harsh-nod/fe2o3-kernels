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
  await expect(page.getByText("Design only", { exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Verus proof" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Invariant(t)");
  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();

  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("tiled GEMM shows canonical attributed source without production promotion", async ({
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
    "#[kernel] is the canonical user form",
  );
  await expect(page.getByText(/Reviewed attributed source excerpt\./)).toContainText(
    "No final HSACO, protected load, launch, hardware execution, or production proof-certificate authority is claimed",
  );
  await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3/blob/7337a2b87dffa0845d092c13399b012f884de90b/examples/tiled_gemm_v1/src/kernel.rs",
  );
  await page.getByRole("tab", { name: "Expected result" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "No rustc/LLVM/machine refinement or production source execution is claimed",
  );
  await expect(page.getByRole("tabpanel")).toContainText("#85");
  await expect(page.getByRole("tabpanel")).toContainText("#90");
  await expect(page.getByRole("tabpanel")).toContainText("#94");
  for (const issue of [85, 86, 87, 88, 89, 90]) {
    await expect(
      page.getByRole("link", { name: new RegExp(`#${String(issue)} `, "u") }),
    ).toHaveAttribute(
      "href",
      `https://github.com/harsh-nod/fe2o3/issues/${String(issue)}`,
    );
  }
  await expect(
    page.getByRole("link", { name: /fe2o3-kernels #1/ }),
  ).toHaveAttribute(
    "href",
    "https://github.com/harsh-nod/fe2o3-kernels/issues/1",
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
