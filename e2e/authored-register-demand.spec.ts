import { expect, test } from "@playwright/test";
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
