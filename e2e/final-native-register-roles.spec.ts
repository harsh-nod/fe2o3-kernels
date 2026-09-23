import { expect, test } from "@playwright/test";

test("retained native register roles remain static and follow the selected exact case", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") mutations.push(request.url()); });
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
  const viewer = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
  const roles = viewer.getByRole("region", { name: "Declared register roles and static uses", exact: true });
  const table = roles.getByRole("table", { name: "Declared VGPR roles by retained instruction", exact: true });
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await expect(table.getByText("Payload offset 2692", { exact: true })).toBeVisible();
  await expect(table.locator("tbody tr").nth(0).getByRole("cell")).toHaveText(["Write", "Read + write", "Read"]);
  const scratch = roles.getByRole("button", { name: "Inspect VGPR4 scratch", exact: true });
  await scratch.focus(); await scratch.press("Space");
  await expect(scratch).toBeFocused(); await expect(scratch).toHaveAttribute("aria-pressed", "true");
  await expect(roles.getByText(/instruction 2: read \+ write/u)).toBeVisible();
  await viewer.getByRole("button", { name: "Inspect edited O3", exact: true }).click();
  await expect(table.getByText("Payload offset 2340", { exact: true })).toBeVisible();
  await expect(table.getByText("Payload offset 2692", { exact: true })).toHaveCount(0);
  await expect(scratch).toHaveAttribute("aria-pressed", "false");
  await expect(viewer.getByRole("table", { name: "Exact native instruction bytes" })).toContainText("V_OR_B32_e32_vi");
  await expect(roles.getByText(/No explicit use does not mean free/u)).toBeVisible();
  await expect(roles.getByText(/do not establish live ranges/u)).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Close final native comparison", exact: true }).click();
  await expect(roles).toHaveCount(0);
  expect(mutations).toEqual([]);
});
