import { expect, test } from "@playwright/test";

test("GPU capability reference is truthful and responsive", async ({ page }) => {
  await page.goto("./#/gpu-capabilities");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "GPU authority expressed as ordinary Rust",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("list", { name: "GPU capability production pipeline" })
      .getByRole("listitem"),
  ).toHaveCount(9);
  await expect(
    page.getByText("Issue #272 remains in migration until the corpus promotion gate passes", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Exact W4 obligation schedule",
    }),
  ).toContainText("SemanticRefinement");
  await expect(
    page.getByRole("heading", { name: "Clean, Checked, and Proven are different claims" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Target lowering is not machine refinement" }),
  ).toBeVisible();
  await expect(page.getByText("available-legacy-only", { exact: true })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
