import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../examples/row_affine_u32.rs", import.meta.url), "utf8");
const revision = "2f4adb9f41317bfa647b0c96d8f12b13d0830aba";
const qualificationRevision = "2f4adb9f41317bfa647b0c96d8f12b13d0830aba";
const command = "cargo test --locked -p rustc-codegen-fe2o3 --test production_neutral_workgroup_reduce_driver_v1 ordinary_row_affine_source_matches_oracle_and_replay -- --ignored --exact --test-threads=1";
const paths = [
  "examples/workgroup_sync_v1/README.md",
  "examples/workgroup_sync_v1/src/kernel_row_affine_u32.rs",
  "examples/workgroup_sync_v1/src/row_affine_oracle.rs"
];

test("row source and CPU replay evidence retain exact qualification boundaries", async ({ page, context }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect(Buffer.byteLength(source)).toBe(2668);
  expect(createHash("sha256").update(source).digest("hex"))
    .toBe("07adc0c50f24e51cb3d6c6bcb6cc1c8c6ff2a772c45ee2153435601eca2f39df");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const lessonCode = page.getByLabel("Lesson code");
  await lessonCode.getByRole("tab", { name: "SIMT row", exact: true }).click();
  const code = lessonCode.getByRole("tabpanel").locator("code");
  await expect(code).toBeVisible();
  expect(await code.textContent()).toBe(source);
  await expect(lessonCode.getByRole("link", { name: "Source", exact: true }))
    .toHaveAttribute("href", `https://github.com/harsh-nod/fe2o3/blob/${revision}/${paths[1]}`);
  await expect(lessonCode.locator(".code-status")).toContainText("native/KFD GPU validation remain pending");
  await lessonCode.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);

  const evidence = page.getByLabel("Evidence for this lesson");
  await evidence.locator("summary").click();
  const claim = evidence.locator("article").filter({
    has: page.getByRole("heading", { name: "SIMT row affine reduction and CPU replay", exact: true }),
  });
  await expect(claim).toBeVisible();
  for (const text of [
    "86 cases", "688 successful runs", "20 simulator refusal checks",
    "2 stale schedule-binding checks", "gfx942/mi300x and gfx950/mi350",
    "does not qualify row Trace V2 or debugger CLI execution", "or predict performance",
  ]) {
    await expect(claim).toContainText(text);
  }
  await expect(claim.locator(".claim-command code")).toHaveText(command);
  for (const path of paths) {
    await expect(claim.getByRole("link", { name: path, exact: true }))
      .toHaveAttribute("href", `https://github.com/harsh-nod/fe2o3/blob/${qualificationRevision}/${path}`);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await claim.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
  await lessonCode.screenshot({ path: testInfo.outputPath("row-affine-source.png") });
  await claim.screenshot({ path: testInfo.outputPath("row-affine-evidence.png") });
  await page.screenshot({ path: testInfo.outputPath("row-affine-cpu.png"), fullPage: true });
});
