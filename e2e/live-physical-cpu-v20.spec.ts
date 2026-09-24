import { expect, test } from "@playwright/test";
for (const theme of ["light", "dark"]) {
  test("V20 live workbench is separately opt-in and empty in " + theme, async ({ page }) => {
    const writes: string[] = [], errors: string[] = [];
    page.on("request", request => { if (request.method() !== "GET") writes.push(request.url()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(value => { localStorage.setItem("fe2o3-kernels-theme", value); }, theme);
    await page.goto("./#/debugger/source-isa-agent");
    const open = page.getByRole("button", { name: "Open V20 live CPU workbench" });
    await open.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Live connection to V20 CPU observations" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect V20 CPU bridge", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Read V20 output bytes" })).toBeDisabled();
    await expect(page.getByLabel("V20 bridge token")).toHaveAttribute("type", "password");
    await expect(page.getByText("No current V20 observation is displayed.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open V20 recorded CPU viewer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open live CPU debugger", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: test.info().outputPath("v20-live-empty-" + theme + ".png"), fullPage: true });
    expect(writes).toEqual([]); expect(errors).toEqual([]);
  });
}
