import { expect, test } from "@playwright/test";

test("actual LDS checkpoints retain distinct initialization, reduction, and canaries", async ({ page }) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const example = page.getByTestId("lds-resource-example");
  await expect(example.getByRole("table")).toHaveCount(0);
  await example.getByRole("button", { name: "Open LDS resource example" }).click();
  const checkpoint = example.getByRole("combobox", { name: "Retained LDS checkpoint" });
  await expect(checkpoint).toHaveValue("0");
  await expect(example).toContainText("2 / 2");
  await example.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  const cells = example.getByRole("group", { name: "Captured memory cells" });
  await expect(cells.getByRole("button")).toHaveCount(64);
  await expect(cells.getByRole("button").first()).toHaveAccessibleName(/uninitialized/u);

  await checkpoint.selectOption("1");
  await expect(example).toContainText("13 / 5");
  await expect(example).toContainText("global byte window not retained");
  await example.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  await expect(cells.getByRole("button").first()).toHaveAccessibleName(/0x02000000, initialized/u);
  await expect(cells.getByRole("button").nth(1)).toHaveAccessibleName(/uninitialized/u);

  await checkpoint.selectOption("2");
  await expect(example).toContainText("15133 / 11");
  await example.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  await expect(cells.getByRole("button").first()).toHaveAccessibleName(/0x80000000, initialized/u);
  await expect(example.getByRole("table", { name: "Captured memory access occurrences" })).toContainText("write committed");
  await example.getByRole("combobox", { name: "Captured LDS example byte window" }).selectOption("1");
  await example.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  await expect(cells.getByRole("button").first()).toHaveAccessibleName(/0x80000000, initialized/u);
  await expect(cells.getByRole("button").nth(1)).toHaveAccessibleName(/0xa5a5a5a5, initialized/u);

  await checkpoint.selectOption("3");
  await expect(example).toContainText("16078 / 14");
  await expect(example).toContainText("not a post-release snapshot");
  await example.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  await expect(cells.getByRole("button")).toHaveCount(64);
  await expect(cells.getByRole("button").last()).toHaveAccessibleName(/0x80000000, initialized/u);
  await example.getByRole("button", { name: "Next window" }).click();
  await expect(cells.getByRole("button")).toHaveCount(2);
  await expect(cells).toContainText("deadbeef");
  await expect(cells).toContainText("cafebabe");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await example.getByRole("button", { name: "Close LDS resource example" }).click();
  await expect(cells).toHaveCount(0);
  await example.getByRole("button", { name: "Open LDS resource example" }).click();
  await expect(checkpoint).toHaveValue("0");
});

test("LDS retained selection is isolated from both other debugger examples", async ({ page }) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const lds = page.getByTestId("lds-resource-example");
  await lds.getByRole("button", { name: "Open LDS resource example" }).click();
  const checkpoint = lds.getByRole("combobox", { name: "Retained LDS checkpoint" });
  await checkpoint.selectOption("2");
  const retained = await lds.textContent();
  const assembly = page.getByTestId("assembly-resource-example");
  await assembly.getByRole("button", { name: "Open assembly resource example" }).click();
  const workbench = page.getByRole("region", { name: "Inspect one deterministic semantic trace" });
  await workbench.getByRole("button", { name: /#9 ·/u }).click();
  await workbench.getByRole("button", { name: "Lane 1 active", exact: true }).click();
  await workbench.getByRole("button", { name: "Reverse one semantic event" }).click();
  expect(await lds.textContent()).toBe(retained);
  await expect(checkpoint).toHaveValue("2");
  await expect(assembly.getByRole("group", { name: "Captured memory cells" })).toContainText("d5");
});

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
