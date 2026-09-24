import { expect, test } from "@playwright/test";
for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  for (const theme of ["light", "dark"]) {
    test("recorded V21 readiness and allocation roles " + viewport.name + " " + theme, async ({ page }) => {
      const writes: string[] = [], errors: string[] = [];
      page.on("request", r => { if (r.method() !== "GET") writes.push(r.method() + " " + r.url()); });
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.addInitScript(value => { localStorage.setItem("fe2o3-kernels-theme", value); }, theme);
      await page.goto("./#/debugger/source-isa-agent");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const open = page.getByRole("button", { name: "Open V21 recorded CPU viewer", exact: true });
      await open.focus(); await page.keyboard.press("Enter");
      await expect(page.getByRole("combobox", { name: "Recorded V21 observation", exact: true })).toBeVisible();
      const pending = page.getByRole("button", { name: "Recorded pending value", exact: true });
      await pending.focus(); await page.keyboard.press("Enter");
      await expect(page.getByLabel("Selected V21 loaded SSA readiness")).toContainText("Unavailable — not_represented");
      await page.getByRole("button", { name: "Recorded ready value", exact: true }).click();
      await expect(page.getByLabel("Selected V21 loaded SSA readiness")).toContainText("Captured u32 0x80000001");
      await page.getByRole("button", { name: "Recorded reverse to pending", exact: true }).click();
      await expect(page.getByLabel("Selected V21 loaded SSA readiness")).toContainText("Unavailable — not_represented");
      await page.getByRole("button", { name: "Recorded final input", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Read-only input observation" })).toBeVisible();
      await page.getByRole("button", { name: "Recorded final output", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Writable output observation" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Read-only input observation" })).toHaveCount(0);
      await page.getByRole("combobox", { name: "Recorded V21 observation", exact: true }).selectOption("31");
      await expect(page.getByText("Recorded unavailable: kir_ssa_values / outside_capture_scope. State unchanged.")).toBeVisible();
      await expect(page.getByRole("table", { name: "Selected V21 recorded memory bytes" })).toHaveCount(0);
      await expect(page.getByRole("table", { name: "Selected checkpoint SSA values" })).toHaveCount(0);
      await page.getByRole("combobox", { name: "Retained V21 command session", exact: true }).selectOption("3");
      await expect(page.getByRole("region", { name: "V21 declared recording origin" })).toContainText("physical-global-copy-registers-v21");
      await page.getByRole("button", { name: "Recorded ready value", exact: true }).click();
      await expect(page.getByLabel("Selected V21 loaded SSA readiness")).toContainText("Captured u32 0x80000001");
      await page.getByRole("combobox", { name: "Retained V21 command session", exact: true }).selectOption("4");
      await expect(page.getByRole("region", { name: "V21 independently checked recording facts" })).toContainText("0 copied words");
      const premise = page.getByRole("region", { name: "V21 declared profile premise" });
      await expect(premise).toContainText("declared V21 profile requires all 128 resident logical lanes");
      await expect(premise).toContainText("does not observe an access trace for every lane");
      await expect(page.getByRole("region", { name: "V21 independently checked recording facts" }))
        .not.toContainText("all 128 resident logical lanes");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: test.info().outputPath("v21-recorded-" + viewport.name + "-" + theme + ".png"), fullPage: true });
      expect(writes).toEqual([]); expect(errors).toEqual([]);
    });
  }
}
