import { expect, test } from "@playwright/test";

test("actual source variants retain exact code, distinct results and reset local selections", async ({ page }) => {
  await page.goto("./#/debugger/source-isa-agent");
  const example = page.getByTestId("recorded-source-promotion");
  await expect(example.getByRole("table")).toHaveCount(0);
  await example.getByRole("button", { name: "Open actual source comparison" }).click();
  const results = example.getByRole("table", { name: "Independent CPU case comparison" });
  await expect(results).toBeVisible();
  await expect(results).toContainText("469 each");
  await expect(results).toContainText("0 each");
  await expect(example.getByRole("tab", { name: "Original ordinary Rust" })).toHaveAttribute("aria-selected", "true");
  await example.getByRole("button", { name: /Inspect operation/u }).first().click();
  await expect(example.getByRole("region", { name: "Selected operation detail" })).toBeVisible();
  await example.getByRole("tab", { name: "Unchanged generated helper" }).click();
  await expect(example.getByRole("region", { name: "Selected operation detail" })).toHaveCount(0);
  await expect(example.getByRole("tabpanel").locator("pre[aria-label]")).toContainText("v_or_b32");
  await example.getByRole("tab", { name: "Edited OR to AND helper" }).click();
  await expect(example.getByRole("tabpanel").locator("pre[aria-label]")).toContainText("v_and_b32");
  await example.getByText("Fresh source and executable identities", { exact: true }).click();
  await expect(example.getByRole("table", { name: "Exact variant identities" })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await example.getByRole("button", { name: "Close actual source comparison" }).click();
  await expect(results).toHaveCount(0);
});
