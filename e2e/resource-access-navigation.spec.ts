import { expect, test } from "@playwright/test";

test("recorded lane and event navigation preserves exact checkpoint bytes and revisions", async ({ page }) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const example = page.getByTestId("lds-multi-resource-example");
  await example.getByRole("button", { name: "Open two-workgroup LDS example" }).click();
  const checkpoints = example.getByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
  await expect(checkpoints).toHaveValue("0");
  await expect(example.getByRole("button", { name: "Previous retained checkpoint" })).toBeDisabled();
  const next = example.getByRole("button", { name: "Next retained checkpoint" });
  for (const identity of ["16079 / 10", "16080 / 11", "16078 / 13", "16080 / 15"]) {
    await next.focus(); await next.press("Enter");
    await expect(example).toContainText(identity);
  }
  const cells = example.getByRole("group", { name: "Captured memory cells" }), before = await cells.textContent();
  const selected = example.getByTestId("selected-retained-access");
  await expect(selected).toContainText("Selected retained event 12");
  const wave = example.getByRole("combobox", { name: "Filter captured access rows by logical wave" });
  await expect(wave.getByRole("option")).toHaveCount(2);
  await wave.selectOption({ index: 1 });
  const lane = example.getByRole("combobox", { name: "Filter captured access rows by logical scope" });
  await lane.selectOption({ label: "Workgroup [0, 0, 0], logical wave 0, lane 1" });
  await expect(selected).toContainText("Selected retained event 28");
  await expect(example.getByRole("button", { name: "Next retained access" })).toBeDisabled();
  await lane.selectOption("all");
  const nextAccess = example.getByRole("button", { name: "Next retained access" });
  await nextAccess.focus(); await nextAccess.press("Enter");
  await expect(selected).toContainText("Selected retained event 28");
  const events = example.getByRole("combobox", { name: "Selected retained access event" });
  await events.focus(); await events.press("ArrowDown"); await events.press("Enter");
  await expect(events).toHaveValue("44");
  await expect(example.locator('tr[aria-current="true"]')).toContainText("44 / 43");
  await expect(selected).toContainText("cursor 16080, revision 15");
  expect(await cells.textContent()).toBe(before);
  const accessPage = example.getByRole("combobox", { name: "Two-workgroup retained access page" });
  await accessPage.selectOption("1");
  await expect(events).toBeDisabled();
  await expect(selected).toContainText("No retained access is selected");
  await expect(example.getByTestId("lds-multi-history")).toContainText("continuation token");
  await accessPage.selectOption("0");
  await expect(events).toHaveValue("12");
  await expect(wave).toHaveValue("all");
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await example.getByRole("button", { name: "Close two-workgroup LDS example" }).click();
  await example.getByRole("button", { name: "Open two-workgroup LDS example" }).click();
  await expect(checkpoints).toHaveValue("0");
  await expect(selected).toHaveCount(0);
});
