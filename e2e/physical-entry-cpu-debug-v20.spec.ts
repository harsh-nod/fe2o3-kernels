import { expect, test } from "@playwright/test";
for (const theme of ["light", "dark"]) {
  test("recorded V20 logical observations remain read-only in " + theme, async ({ page }) => {
    const writes: string[] = [], errors: string[] = [];
    page.on("request", request => { if (request.method() !== "GET") writes.push(request.method() + " " + request.url()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(value => { localStorage.setItem("fe2o3-kernels-theme", value); }, theme);
    await page.goto("./#/debugger/source-isa-agent");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const open = page.getByRole("button", { name: "Open V20 recorded CPU viewer" });
    await open.focus(); await page.keyboard.press("Enter");
    const selector = page.getByRole("combobox", { name: "Recorded V20 observation" });
    await expect(selector).toBeVisible();
    await selector.selectOption("86");
    await expect(page.getByRole("table", { name: "Selected checkpoint SSA values" })).toBeVisible();
    await expect(page.getByText("not_represented", { exact: true }).first()).toBeVisible();
    await selector.selectOption("7");
    await expect(page.getByRole("table", { name: "Selected V20 recorded memory bytes" })).toBeVisible();
    await expect(page.getByText("Uninitialized storage — not a valid value").first()).toBeVisible();
    await selector.selectOption("94");
    await expect(page.getByText("Recorded unavailable: kir_ssa_values / outside_capture_scope. State unchanged.")).toBeVisible();
    await expect(page.getByRole("table", { name: "Selected checkpoint SSA values" })).toHaveCount(0);
    await expect(page.getByRole("table", { name: "Selected V20 recorded memory bytes" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: test.info().outputPath("v20-recorded-" + theme + ".png"), fullPage: true });
    expect(writes).toEqual([]); expect(errors).toEqual([]);
  });
}
