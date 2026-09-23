import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../examples/fill_kernel.rs", import.meta.url), "utf8");
const revision = "7a536e0a001202ac0bb9d8647c5395661f8fa1ec";

test("fill preserves exact source and historical execution boundaries", async ({ page, context }, testInfo) => {
  expect(Buffer.byteLength(source)).toBe(308);
  expect(createHash("sha256").update(source).digest("hex"))
    .toBe("827ea368df5dd7f429792e0f8a21df79d4d5508525061a844c190da25de54213");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/lesson/first-fill");
  const code = page.getByRole("tabpanel").locator("code");
  await expect(code).toBeVisible();
  expect(await code.textContent()).toBe(source);
  await expect(page.locator(".code-status")).toContainText(
    "The recorded no-GPU execution remains pinned to its historical revision",
  );
  await expect(page.locator(".code-status")).not.toContainText("Current authoring syntax.");
  await expect(page.getByRole("link", { name: "Source", exact: true }))
    .toHaveAttribute("href", `https://github.com/harsh-nod/fe2o3/blob/${revision}/examples/fill/src/lib.rs`);
  await expect(page.getByRole("link", { name: "Source", exact: true }))
    .toHaveAttribute("title", "Open pinned source");
  const evidence = page.getByLabel("Evidence for this lesson");
  await evidence.locator("summary").click();
  await expect(evidence.getByRole("link", { name: "examples/fill/src/lib.rs", exact: true }))
    .toHaveAttribute("href", "https://github.com/harsh-nod/fe2o3/blob/308d8fa00fa41e098b2a1a47bbfea1bc29735464/examples/fill/src/lib.rs");
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
  await page.getByRole("tab", { name: "Safe CPU reference", exact: true }).click();
  await expect(code).not.toHaveText(source);
  await page.getByRole("button", { name: "Show proof details", exact: true }).click();
  await page.getByRole("tab", { name: "Verus proof", exact: true }).click();
  await page.getByRole("button", { name: "Hide proof details", exact: true }).click();
  expect(await code.textContent()).toBe(source);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("first-fill-source.png"), fullPage: true });

  await page.goto("./#/lesson/verus-contracts");
  await expect(code).toBeVisible();
  expect(await code.textContent()).toBe(source);
  await expect(page.locator(".code-status")).toContainText("Explanatory source.");
  await expect(page.locator(".code-status")).not.toContainText("Current authoring syntax.");
  await expect(page.getByLabel("Lesson code").getByRole("link", { name: "Source", exact: true }))
    .toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
