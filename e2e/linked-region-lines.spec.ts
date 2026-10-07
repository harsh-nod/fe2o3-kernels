import { expect, test, type Page, type Locator } from "@playwright/test";
test("retained whole-region lines remain separate and read-only on desktop and mobile", async ({ page }) => {
  const mutations: string[] = [], commands: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET") mutations.push(request.method() + " " + request.url());
    if (/\/(?:compile|run|launch|resume)(?:[/?#]|$)/u.test(request.url())) commands.push(request.url());
  });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await page.goto("./#/debugger/source-isa-agent");
    await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
    const old = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
    await old.getByRole("button", { name: "Inspect edited O3", exact: true }).click();
    await page.getByRole("button", { name: "Open whole-region linked lines", exact: true }).click();
    const lines = page.getByRole("region", { name: "Retained whole-region linked lines", exact: true });
    await expect(lines.getByRole("table", { name: "Retained linked-line cases", exact: true }).locator("tbody tr")).toHaveCount(2);
    for (const level of ["O0", "O3"]) {
      const button = lines.getByRole("button", { name: "Inspect linked lines " + level, exact: true });
      await button.focus(); await page.keyboard.press("Space");
      await expect(button).toHaveAttribute("aria-pressed", "true");
      const coverage = lines.getByRole("table", { name: "Whole-region line coverage", exact: true });
      await expect(coverage.locator("tbody tr")).toHaveCount(1);
      await expect(coverage).toContainText("7:20");
      await lines.getByText("Exact retained source and selected whole region", { exact: true }).click();
      await expect(lines.getByLabel("Retained linked-line source", { exact: true }).locator("mark")).toContainText("amdgpu_ordered_program");
      await expect(lines.getByRole("button", { name: /compile|run|launch|resume/iu })).toHaveCount(0);
      await expect(old.getByRole("button", { name: "Inspect edited O3", exact: true })).toHaveAttribute("aria-pressed", "true");
    }
    await page.getByRole("button", { name: "Close whole-region linked lines", exact: true }).click();
    await expect(lines).toHaveCount(0);
    await expect(old.getByRole("table", { name: "Exact native instruction bytes", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close final native comparison", exact: true }).click();
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

test("linked lines have contained keyboard disclosures and isolated reopen state on the narrow route", async ({ page }, info) => {
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
    // Establish the unrelated sibling state first; subsequent actions are keyboard-only.
    await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
    const old = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
    await old.getByRole("button", { name: "Inspect edited O3", exact: true }).click();
    const toggle = page.getByRole("button", { name: "Open whole-region linked lines", exact: true });
    await toggle.focus(); await page.keyboard.press("Enter");
    const lines = page.getByRole("region", { name: "Retained whole-region linked lines", exact: true });
    await expect(lines.getByRole("table", { name: "Retained linked-line cases" }).locator("tbody tr")).toHaveCount(2);
    const o3 = lines.getByRole("button", { name: "Inspect linked lines O3", exact: true });
    await tabTo(page, o3); await visibleFocus(o3); await page.keyboard.press("Space");
    await expect(o3).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); await visibleFocus(o3);
    const sourceSummary = lines.locator("summary").filter({ hasText: "Exact retained source and selected whole region" });
    await tabTo(page, sourceSummary); await visibleFocus(sourceSummary); await page.keyboard.press("Enter");
    const source = lines.getByLabel("Retained linked-line source", { exact: true });
    await expect(source).toContainText("λ"); await expect(source.locator("mark")).toContainText("amdgpu_ordered_program");
    const identities = lines.locator("summary").filter({ hasText: "Exact source and artifact identities" });
    await tabTo(page, identities); await visibleFocus(identities); await page.keyboard.press("Enter");
    const selected = lines.getByRole("region", { name: "Selected whole-region linked lines", exact: true });
    await expect(selected.getByRole("heading")).toContainText("O3:");
    await expect(selected.getByRole("table", { name: "Whole-region line coverage" })).toContainText("7:20");
    await expect(selected.getByText("Selected full ELF SHA-256", { exact: true }).locator("..").locator("dd code")).toHaveText("aca8c4b3fa9665ae3adb7744ea3fccb056ec5298c232634223e10f304f0f42e1");
    for (const scroll of await lines.locator(".linked-lines-scroll").all()) await boundedOverflow(scroll);
    await boundedOverflow(source);
    await lines.screenshot({ path: info.outputPath("linked-keyboard-narrow-" + theme + ".png") });
    const close = page.getByRole("button", { name: "Close whole-region linked lines", exact: true });
    await tabTo(page, close, "Shift+Tab"); await page.keyboard.press("Enter"); await expect(lines).toHaveCount(0);
    const reopen = page.getByRole("button", { name: "Open whole-region linked lines", exact: true });
    await expect(reopen).toBeFocused(); await expect(reopen).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(lines.getByRole("button", { name: "Inspect linked lines O0", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(o3).toHaveAttribute("aria-pressed", "false");
    await expect(selected.getByRole("heading")).toContainText("O0:");
    await expect(source).not.toBeVisible();
    await expect(old.getByRole("button", { name: "Inspect edited O3", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  expect(errors).toEqual([]); expect(mutations).toEqual([]); expect(commands).toEqual([]);
  if (process.env.FE2O3_E2E_PREVIEW === "1") {
    expect(assets.some(path => path.startsWith("/fe2o3-kernels/assets/") && path.endsWith(".js"))).toBe(true);
    expect(assets.some(path => /\/@vite\/client|\/@react-refresh|\/src\/|\/node_modules\/\.vite\//u.test(path))).toBe(false);
  }
});
