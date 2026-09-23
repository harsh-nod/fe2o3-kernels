// Synthetic routed browser regression only, NOT real source/bridge/GPU qualification.
// Standard desktop and mobile projects both run this same bounded command roster.
import { expect, test } from "@playwright/test";
import { SyntheticTargetBridge } from "../tests/fixtures/cpu-declared-target";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "../tests/fixtures/cpu-debug-bridge";
test("explicit declared target fences one selected observed LDS access", async ({ page }) => {
  const bridge = new SyntheticTargetBridge();
  await page.route(SYNTHETIC_ENDPOINT + "/**", async route => {
    const request = route.request(), headers = { "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
      "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type,x-fe2o3-bridge-token",
      "Content-Type": "application/json; charset=utf-8" };
    if (request.method() === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    const reply = await bridge.fetch(request.url(), { method: request.method(), body: request.postData() ?? "", headers: request.headers() });
    await route.fulfill({ status: reply.status, headers, body: await reply.text() });
  });
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open live CPU debugger", exact: true }).click();
  const panel = page.getByRole("region", { name: "Live local CPU debugger", exact: true });
  await panel.getByLabel("Local CPU bridge address", { exact: true }).fill(SYNTHETIC_ENDPOINT);
  await panel.getByLabel("Bridge secret", { exact: true }).fill(SYNTHETIC_SECRET);
  await panel.getByLabel("Bridge secret", { exact: true }).press("Enter");
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toBeVisible();
  // Four actual mock steps make both explicitly synthetic retained access events in range.
  for (let index = 0; index < 4; index++) {
    await panel.getByRole("button", { name: "Step CPU forward", exact: true }).click();
    await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toBeVisible();
  }
  const observed = page.getByRole("region", { name: "Live CPU runtime and storage observations", exact: true });
  await observed.getByRole("button", { name: "Refresh runtime and storage", exact: true }).click();
  await observed.getByRole("combobox", { name: "Observed storage allocation", exact: true })
    .selectOption({ label: "Allocation 3 / slot 2 / generation 2" });
  await observed.getByRole("textbox", { name: "Observed byte length", exact: true }).fill("4");
  await observed.getByRole("button", { name: "Read observed storage", exact: true }).click();
  await expect(observed.getByRole("region", { name: "Observed storage bytes" })).toContainText("0x12121212");
  expect(bridge.commands).not.toContain("target");
  expect(bridge.commands.slice(-6)).toEqual(["state", "runtime", "lifecycle", "storage", "storageaccess 3 2 2", "storagememory 3 2 2 0 4"]);
  const before = bridge.commands.length;
  await observed.getByRole("button", { name: "Read bundle-declared target", exact: true }).click();
  const model = observed.getByRole("region", { name: "Same-stop declared-target bank model", exact: true });
  await expect(model).toContainText("gfx942:xnack-"); expect(bridge.commands.slice(before)).toEqual(["target"]);
  const select = model.getByRole("combobox", { name: "Observed workgroup access", exact: true });
  await select.selectOption({ index: 1 });
  await expect(model.getByRole("list", { name: "Modeled LDS bank footprint" }).getByRole("listitem")).toHaveCount(32);
  const residue = model.getByRole("textbox", { name: /Assumed allocation-base residue/ });
  await residue.fill("4"); await select.selectOption({ index: 2 }); await expect(residue).toHaveValue("0");
  expect(bridge.commands.slice(before)).toEqual(["target"]);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const dimensions = await model.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  }
  await observed.getByRole("textbox", { name: "Observed byte offset", exact: true }).fill("1");
  await expect(model).toHaveCount(0);
  await panel.getByRole("button", { name: "Disconnect CPU debugger", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("bridge confirmed cleanup");
  await expect(observed.getByRole("list", { name: "Modeled LDS bank footprint" })).toHaveCount(0);
  expect(bridge.commands.filter(command => command === "target")).toHaveLength(1);
});
