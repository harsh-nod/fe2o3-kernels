import { expect, test, type Page, type Locator } from "@playwright/test";
test("genuine authored-demand grid and ASCII remain separate and read-only on desktop/mobile", async ({ page }) => {
  const mutations: string[] = [], commands: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET") mutations.push(request.method() + " " + request.url());
    if (/\/(?:compile|run|launch|resume)(?:[/?#]|$)/u.test(request.url())) commands.push(request.url());
  });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await page.goto("./#/debugger/source-isa-agent");
    await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
    const final = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
    for (const [profile, optimization] of [["default", "O0"], ["default", "O3"], ["edited", "O0"], ["edited", "O3"]]) {
      await final.getByRole("button", { name: "Inspect " + profile + " " + optimization, exact: true }).click();
      const demand = final.getByRole("region", { name: "Authored declared-register demand", exact: true });
      const table = demand.getByRole("table", { name: "Authored value demand by logical boundary", exact: true });
      await expect(table.locator("tbody tr")).toHaveCount(6);
      const value = demand.getByRole("button", { name: "Inspect authored value 3 scratch", exact: true });
      await expect(value).toHaveAttribute("aria-pressed", "false"); await value.focus(); await page.keyboard.press("Space");
      await expect(value).toHaveAttribute("aria-pressed", "true");
      await demand.getByText("Accessible authored-demand ASCII", { exact: true }).click();
      await expect(demand.getByLabel("Authored-demand ASCII", { exact: true })).toContainText("NOT physical allocation");
      await expect(demand.getByText(/not native instruction times or LLVM allocation/u)).toBeVisible();
      await expect(demand.getByRole("button", { name: /compile|run|launch|resume/iu })).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Close final native comparison", exact: true }).click();
    await expect(final).toHaveCount(0);
  }
  expect(mutations).toEqual([]); expect(commands).toEqual([]);
});

async function tabTo(page: Page, target: Locator, key: "Tab" | "Shift+Tab" = "Tab") {
  // Focus is anchored at the route disclosure once; targets must be reachable
  // through the real DOM tab order, not a programmatic target.focus().
  for (let step = 0; step < 32; step++) {
    await page.keyboard.press(key);
    if (await target.evaluate(element => element === document.activeElement)) return;
  }
  throw new Error("panel control unreachable within fixed tab budget");
}
async function visibleFocus(target: Locator) {
  // Keyboard focus may start native smooth scrolling. Observe the same bounds
  // until settled; do not force scrolling or weaken the containment predicate.
  await expect(async () => {
    await expect(target).toBeFocused();
    const state = await target.evaluate(element => {
      const box = element.getBoundingClientRect(), style = getComputedStyle(element);
      const scroll = element.closest(".authored-demand-scroll, .linked-lines-scroll");
      const outer = scroll?.getBoundingClientRect();
      return { visible: element.matches(":focus-visible"), outline: parseFloat(style.outlineWidth),
        outlineStyle: style.outlineStyle, left: box.left, right: box.right, top: box.top, bottom: box.bottom,
        width: innerWidth, height: innerHeight, contained: !outer || (box.left >= outer.left && box.right <= outer.right) };
    });
    expect(state.visible).toBe(true); expect(state.outline).toBeGreaterThan(0);
    expect(state.outlineStyle).not.toBe("none"); expect(state.contained).toBe(true);
    expect(state.left).toBeGreaterThanOrEqual(0); expect(state.right).toBeLessThanOrEqual(state.width);
    expect(state.top).toBeGreaterThanOrEqual(0); expect(state.bottom).toBeLessThanOrEqual(state.height);
  }).toPass({ timeout: 10000, intervals: [50, 100, 250] });
}
async function boundedOverflow(target: Locator) {
  const state = await target.evaluate(element => {
    const node = element as HTMLElement, text = node.textContent, left = node.scrollLeft;
    const box = node.getBoundingClientRect(), maximum = Math.max(0, node.scrollWidth - node.clientWidth);
    node.scrollLeft = maximum;
    const end = node.scrollLeft;
    node.scrollLeft = left;
    return { contained: box.width > 0 && box.left >= -1 && box.right <= innerWidth + 1,
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      overflow: getComputedStyle(node).overflowX, maximum, end,
      restored: Math.abs(node.scrollLeft - left) <= 1, unchanged: node.textContent === text };
  });
  expect(state.contained).toBe(true); expect(state.pageFits).toBe(true);
  if (state.maximum > 0) {
    expect(["auto", "scroll"]).toContain(state.overflow);
    expect(Math.abs(state.end - state.maximum)).toBeLessThanOrEqual(1);
  }
  expect(state.restored).toBe(true); expect(state.unchanged).toBe(true);
  return state;
}

test("authored demand has contained keyboard disclosure and fresh reopen state on the narrow route", async ({ page }, info) => {
  test.setTimeout(60000);
  const errors: string[] = [], mutations: string[] = [], commands: string[] = [], assets: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    assets.push(new URL(request.url()).pathname);
    if (request.method() !== "GET") mutations.push(request.method() + " " + request.url());
    if (/\/(?:compile|run|launch|resume)(?:[/?#]|$)/u.test(request.url())) commands.push(request.url());
  });
  for (const theme of ["light", "dark"] as const) {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto("./#/debugger/source-isa-agent");
    // A same-hash goto retains React state; each theme starts from a new document.
    await page.reload();
    // Match the existing final-native theme exercise without accumulating init scripts.
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const toggle = page.getByRole("button", { name: "Open final native comparison", exact: true });
    await toggle.focus(); await page.keyboard.press("Enter");
    const final = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
    await expect(final.getByRole("table", { name: "Declared and encoded native resources" })).toBeVisible();
    const edited = final.getByRole("button", { name: "Inspect edited O3", exact: true });
    await tabTo(page, edited); await page.keyboard.press("Space"); await visibleFocus(edited);
    const demand = final.getByRole("region", { name: "Authored declared-register demand", exact: true });
    const scratch = demand.getByRole("button", { name: "Inspect authored value 3 scratch", exact: true });
    await expect(demand.getByRole("table", { name: "Authored value demand by logical boundary" }).locator("tbody tr")).toHaveCount(6);
    await tabTo(page, scratch); await visibleFocus(scratch); await page.keyboard.press("Space");
    await expect(scratch).toHaveAttribute("aria-pressed", "true");
    await expect(demand.locator(".authored-demand-selection")).toContainText("Authored value #3:");
    await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); await visibleFocus(scratch);
    const summary = demand.locator("summary").filter({ hasText: "Accessible authored-demand ASCII" });
    await tabTo(page, summary); await visibleFocus(summary); await page.keyboard.press("Enter");
    const ascii = demand.getByLabel("Authored-demand ASCII", { exact: true });
    await expect(ascii).toBeVisible(); await expect(ascii).toContainText("NOT physical allocation");
    const grid = await boundedOverflow(demand.locator(".authored-demand-scroll"));
    expect(grid.maximum).toBeGreaterThan(0); await boundedOverflow(ascii);
    await demand.screenshot({ path: info.outputPath("authored-keyboard-narrow-" + theme + ".png") });
    const close = page.getByRole("button", { name: "Close final native comparison", exact: true });
    await tabTo(page, close, "Shift+Tab"); await page.keyboard.press("Enter");
    await expect(final).toHaveCount(0);
    const reopen = page.getByRole("button", { name: "Open final native comparison", exact: true });
    await expect(reopen).toBeFocused(); await expect(reopen).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(final.getByRole("button", { name: "Inspect default O0", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(scratch).toHaveAttribute("aria-pressed", "false");
    await expect(demand.locator(".authored-demand-selection")).toHaveText("Select an authored value for its declared interval.");
    await expect(ascii).not.toBeVisible();
    await expect(final.getByRole("region", { name: "Selected final-native case", exact: true }).getByRole("heading")).toContainText("default O0");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  expect(errors).toEqual([]); expect(mutations).toEqual([]); expect(commands).toEqual([]);
  if (process.env.FE2O3_E2E_PREVIEW === "1") {
    expect(assets.some(path => path.startsWith("/fe2o3-kernels/assets/") && path.endsWith(".js"))).toBe(true);
    expect(assets.some(path => /\/@vite\/client|\/@react-refresh|\/src\/|\/node_modules\/\.vite\//u.test(path))).toBe(false);
  }
});
