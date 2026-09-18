import { expect, test } from "@playwright/test";

test("assembly source inventory, access and bytes share one real retained checkpoint", async ({ page }) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const example = page.getByTestId("assembly-resource-example");
  await expect(example.getByRole("table")).toHaveCount(0);
  await example.getByRole("button", { name: "Open assembly resource example" }).click();
  await expect(example.getByRole("table", { name: "Captured allocation inventory" })).toContainText("24");
  await expect(example.getByRole("table", { name: "Captured memory access occurrences" })).toContainText("write committed");
  await example.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  const cells = example.getByRole("group", { name: "Captured memory cells" });
  await expect(cells.getByRole("button")).toHaveCount(6);
  await expect(cells).toContainText("d5010000");
  await expect(example).toContainText("More backend pages exist");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await example.getByRole("button", { name: "Close assembly resource example" }).click();
  await expect(cells).toHaveCount(0);
  await expect(example.getByRole("table")).toHaveCount(0);
});

test("resource bytes stay bound to the retained lane and checkpoint", async ({ page }) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const workbench = page.getByRole("region", { name: "Inspect one deterministic semantic trace" });
  await workbench.getByRole("button", { name: /#9 ·/u }).click();
  const cells = workbench.getByRole("group", { name: "Captured memory cells" });
  await expect(cells.getByRole("button")).toHaveCount(4);
  await workbench.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  await expect(cells.getByRole("button")).toHaveCount(1);
  await expect(cells).toContainText("11000000");
  await workbench.getByRole("button", { name: "Lane 1 active", exact: true }).click();
  await expect(cells).toHaveCount(0);
  await expect(workbench.getByTestId("resource-checkpoint-unavailable")).toBeVisible();
  await workbench.getByRole("button", { name: "Lane 0 active", exact: true }).click();
  await expect(cells).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await workbench.getByRole("button", { name: "Reverse one semantic event" }).click();
  await expect(cells).toHaveCount(0);
});
