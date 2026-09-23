// Synthetic HTTP/component layout regression only; no actual debugger, process or GPU evidence.
import { expect, test } from "@playwright/test";
import { SyntheticObservedBridge } from "../tests/fixtures/cpu-observed-bridge";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "../tests/fixtures/cpu-debug-bridge";

test("observed runtime and selected storage remain usable in a narrow viewport", async ({ page }) => {
  const bridge = new SyntheticObservedBridge();
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route(SYNTHETIC_ENDPOINT + "/**", async route => {
    const request = route.request();
    const headers = {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "content-type,x-fe2o3-bridge-token",
      "Content-Type": "application/json; charset=utf-8",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const reply = await bridge.fetch(request.url(), {
      method: request.method(), body: request.postData() ?? "", headers: request.headers(),
    });
    await route.fulfill({ status: reply.status, headers, body: await reply.text() });
  });
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open live CPU debugger", exact: true }).click();
  const panel = page.getByRole("region", { name: "Live local CPU debugger", exact: true });
  await panel.getByLabel("Local CPU bridge address", { exact: true }).fill(SYNTHETIC_ENDPOINT);
  await panel.getByLabel("Bridge secret", { exact: true }).fill(SYNTHETIC_SECRET);
  await panel.getByLabel("Bridge secret", { exact: true }).press("Enter");
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toBeVisible();
  await panel.getByRole("button", { name: "Step CPU forward", exact: true }).click();
  const observed = page.getByRole("region", { name: "Live CPU runtime and storage observations", exact: true });
  await observed.getByRole("button", { name: "Refresh runtime and storage", exact: true }).click();
  const allocation = observed.getByRole("combobox", { name: "Observed storage allocation", exact: true });
  await expect(allocation).toBeVisible();
  await allocation.selectOption({ label: "Allocation 3 / slot 2 / generation 2" });
  await observed.getByRole("textbox", { name: "Observed byte length", exact: true }).fill("4");
  await observed.getByRole("button", { name: "Read observed storage", exact: true }).click();
  await expect(observed.getByRole("region", { name: "Observed storage bytes", exact: true })).toContainText("0x12121212");
  await expect(observed.getByRole("region", { name: "Actual allocation lifecycle", exact: true })).toContainText("release");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const layout = await observed.evaluate(node => {
      const root = node.getBoundingClientRect();
      const elements = [...node.querySelectorAll("button,fieldset,legend,label,input,select,table")];
      return {
        scroll: node.scrollWidth, client: node.clientWidth,
        controls: elements.map(element => {
          const box = element.getBoundingClientRect();
          return { left: box.left - root.left, right: box.right - root.right };
        }),
        tables: [...node.querySelectorAll("table")].map(table => getComputedStyle(table).overflowX),
      };
    });
    expect(layout.scroll).toBeLessThanOrEqual(layout.client + 1);
    for (const control of layout.controls) {
      expect(control.left).toBeGreaterThanOrEqual(-1);
      expect(control.right).toBeLessThanOrEqual(1);
    }
    expect(layout.tables.length).toBeGreaterThan(0);
    expect(layout.tables.every(overflow => overflow === "auto")).toBe(true);
  }
  await panel.getByRole("button", { name: "Disconnect CPU debugger", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("bridge confirmed cleanup");
});
