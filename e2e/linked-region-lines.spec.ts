import { expect, test } from "@playwright/test";
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
