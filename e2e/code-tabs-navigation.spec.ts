import { expect, test, type Locator, type Page } from "@playwright/test";

async function assertSelectedTab(page: Page, list: Locator, index: number, previousY: number, focusTarget?: Locator) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("A configured CSS viewport is required");
  const tab = list.getByRole("tab").nth(index);
  await expect(focusTarget ?? tab).toBeFocused();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  const state = await tab.evaluate((element) => {
    const list = element.parentElement!;
    const bounds = element.getBoundingClientRect();
    const start = list.getBoundingClientRect().left + list.clientLeft;
    const end = start + list.clientWidth;
    return {
      contained: bounds.width <= list.clientWidth
        ? bounds.left >= start - 1 && bounds.right <= end + 1
        : Math.abs(bounds.left - start) <= 1,
      oversized: bounds.width > list.clientWidth,
      width: bounds.width, listWidth: list.clientWidth, left: bounds.left, start,
      focused: document.activeElement?.matches(":focus-visible"),
      outline: document.activeElement ? getComputedStyle(document.activeElement).outlineWidth : "0px",
      outlineOffset: document.activeElement ? getComputedStyle(document.activeElement).outlineOffset : "0px",
      scrollY: window.scrollY, pageWidth: document.documentElement.scrollWidth,
    };
  });
  expect(state.contained, JSON.stringify(state)).toBe(true);
  expect(state.focused).toBe(true);
  expect(Number.parseFloat(state.outline)).toBeGreaterThan(0);
  if (!focusTarget) {
    expect(Number.parseFloat(state.outline) + Number.parseFloat(state.outlineOffset)).toBeLessThanOrEqual(0);
  }
  expect(state.scrollY).toBe(previousY);
  expect(state.pageWidth).toBeLessThanOrEqual(viewport.width);
}

for (const theme of ["light", "dark"] as const) {
  test("code tabs reveal keyboard selection completely in " + theme + " theme", async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((theme) => localStorage.setItem("fe2o3-kernels-theme", theme), theme);
    for (const lesson of ["cpu-semantic-simulation", "gemm-tiling"]) {
      await page.goto("./#/lesson/" + lesson);
      await expect(page.locator("main")).toBeFocused();
      const code = page.getByLabel("Lesson code", { exact: true });
      const list = code.getByRole("tablist");
      const ordinaryIds = await list.getByRole("tab").evaluateAll((tabs) => tabs.map((tab) => tab.id));
      let proofId = "";
      for (const proofDetails of [false, true]) {
        if (proofDetails) await code.getByRole("button", { name: "Show proof details", exact: true }).click();
        const tabs = list.getByRole("tab");
        const count = await tabs.count();
        expect(count).toBeGreaterThan(1);
        if (proofDetails) {
          const ids = await tabs.evaluateAll((tabs) => tabs.map((tab) => tab.id));
          proofId = ids.find((id) => !ordinaryIds.includes(id)) ?? "";
          expect(proofId).not.toBe("");
        }
        await tabs.first().click();
        let index = 0;
        for (const [key, delta] of [["ArrowRight", 1], ["ArrowLeft", -1]] as const) {
          for (let step = 0; step < count; step++) {
            const previousY = await page.evaluate(() => window.scrollY);
            await page.keyboard.press(key);
            index = (index + delta + count) % count;
            await assertSelectedTab(page, list, index, previousY);
          }
        }
        await code.screenshot({ path: testInfo.outputPath(`${lesson}-${theme}-${proofDetails ? "proof" : "ordinary"}-tabs.png`) });
      }
      await list.locator("#" + ordinaryIds.at(-1)).click();
      let toggle = code.getByRole("button", { name: "Hide proof details", exact: true });
      await toggle.focus();
      let previousY = await page.evaluate(() => window.scrollY);
      await toggle.press("Enter");
      toggle = code.getByRole("button", { name: "Show proof details", exact: true });
      await assertSelectedTab(page, list, ordinaryIds.length - 1, previousY, toggle);

      await toggle.press("Enter");
      await list.locator("#" + proofId).click();
      toggle = code.getByRole("button", { name: "Hide proof details", exact: true });
      await toggle.focus();
      previousY = await page.evaluate(() => window.scrollY);
      await toggle.press("Enter");
      toggle = code.getByRole("button", { name: "Show proof details", exact: true });
      await assertSelectedTab(page, list, 0, previousY, toggle);
    }
    expect(errors).toEqual([]);
  });
}
