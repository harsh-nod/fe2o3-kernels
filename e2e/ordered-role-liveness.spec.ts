import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
const CAPSULE_SHA = "da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d";
const LABELS = ["one", "two", "fifteen", "repeat"] as const;
test("actual retained source/native cases expose bounded logical lifetimes without replay or requests", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const bytes = readFileSync("examples/source_repeat_native_origin_comparison_v1.json");
  expect(bytes.length).toBe(1105533);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(CAPSULE_SHA);
  await page.goto("./#/debugger/source-isa-agent");
  const section = page.getByRole("region", { name: "Compare same-export origin and native captures", exact: true });
  await section.getByRole("button", { name: "Open same-export origin/native preview", exact: true }).click();
  const importer = section.getByRole("region", { name: "Local repeat-native capsule import", exact: true });
  await expect(importer.getByText("7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115", { exact: true })).toBeVisible();
  // Initial navigation and the already-loaded lazy component graph are not import requests.
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });
  const upload = importer.getByLabel("Repeat-native capsule (local JSON)", { exact: true });
  const file = { name: "actual-same-export-capsule.json", mimeType: "application/json", buffer: bytes };
  await upload.setInputFiles(file);
  const viewer = importer.getByRole("region", { name: "Bounded repeat-native comparison", exact: true });
  const panel = viewer.getByRole("region", { name: "Finite-region logical liveness", exact: true });
  await expect(panel).toBeVisible();
  for (const [group, label] of LABELS.entries()) for (const optimization of ["O0", "O3"] as const) {
    const n = [1, 2, 15, 15][group];
    await viewer.getByRole("button", { name: "Inspect " + label + " " + optimization, exact: true }).click();
    await expect(panel.getByRole("heading", { name: "Logical def/use intervals: " + label + " " + optimization, exact: true })).toBeVisible();
    await expect(panel.getByRole("region", { name: "Selected logical value", exact: true })).toHaveCount(0);
    const values = panel.getByRole("table", { name: "Logical version lifetimes and uses", exact: true });
    await expect(values.locator("tbody tr")).toHaveCount(n + 4);
    await expect(panel.getByTestId("logical-boundary-peak")).toHaveText("2");
    await expect(panel.getByTestId("logical-transient-peak")).toHaveText("3");
    const boundaries = panel.locator("[data-boundary]");
    await expect(boundaries).toHaveCount(n + 2);
    await expect(boundaries.first()).toHaveAttribute("data-live-count", "2");
    await expect(boundaries.last()).toHaveAttribute("data-live-count", "1");
    for (const id of [[0, 4, 5], [10, 7, 6], [1, 9, 10], [1, 9, 10]][group])
      await expect(values.getByRole("cell", { name: "Input %" + id, exact: true })).toBeVisible();
    await expect(values.getByRole("cell", { name: "Result %11", exact: true })).toBeVisible();
    await expect(values.getByRole("cell", { name: "Unused region input", exact: true })).toBeVisible();
    await expect(panel.getByText(/not physical VGPR lifetimes/u)).toBeVisible();
    await panel.getByRole("button", { name: "Inspect logical output after instruction 1", exact: true }).click();
    const selected = panel.getByRole("region", { name: "Selected logical value", exact: true });
    await expect(selected).toContainText("instruction 2, operand 1");
    await expect(panel.locator('[data-selected-live="true"]')).toHaveCount(1);
    await expect(panel.locator('[data-boundary="1"]')).toHaveAttribute("data-selected-live", "true");
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const scrollArea = panel.getByRole("region", { name: "Logical version table scroll area", exact: true });
  await expect(scrollArea).toHaveAttribute("tabindex", "0");
  if (await scrollArea.evaluate(element => element.scrollWidth > element.clientWidth + 1)) {
    await scrollArea.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => scrollArea.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    await scrollArea.evaluate(element => { element.scrollLeft = 0; });
  }
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("retained-logical-liveness.png"), fullPage: false });
  // Return to the same retained case: do not revive the earlier selection.
  await viewer.getByRole("button", { name: "Inspect one O0", exact: true }).click();
  await expect(panel.getByRole("region", { name: "Selected logical value", exact: true })).toHaveCount(0);
  await upload.setInputFiles({ name: "invalid-replacement.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await expect(viewer.locator('[data-state="invalid"]')).toBeVisible();
  await expect(panel).toHaveCount(0);
  await upload.setInputFiles(file);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("region", { name: "Selected logical value", exact: true })).toHaveCount(0);
  await importer.getByRole("button", { name: "Clear repeat-native import", exact: true }).click();
  await expect(panel).toHaveCount(0);
  expect(requests).toEqual([]);
});
