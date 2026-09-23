// Browser controls against a synthetic routed HTTP transport only.
// This is NOT actual bridge/process qualification and runs no GPU/debugger.
import { expect, test, type Page, type Route } from "@playwright/test";
import { SyntheticCpuBridge, SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "../tests/fixtures/cpu-debug-bridge";
const ORIGIN = "http://127.0.0.1:4173";
async function routeBridge(page: Page, bridge: SyntheticCpuBridge, pause?: (route: Route) => Promise<void>,
  settled?: (route: Route) => void) {
  await page.route(SYNTHETIC_ENDPOINT + "/**", async route => {
    const request = route.request();
    const headers = { "Access-Control-Allow-Origin": ORIGIN, "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "content-type,x-fe2o3-bridge-token", "Content-Type": "application/json; charset=utf-8" };
    if (request.method() === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    const response = await bridge.fetch(request.url(), { method: request.method(), body: request.postData() ?? "",
      headers: request.headers() });
    if (pause) await pause(route);
    try {
      await route.fulfill({ status: response.status, headers, body: await response.text() });
    } catch (error) {
      // A deliberately held command may already have been aborted by Disconnect.
      // Do not swallow unrelated route errors or page-teardown failures.
      if (request.failure()?.errorText !== "net::ERR_ABORTED") throw error;
    } finally { settled?.(route); }
  });
}
async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open live CPU debugger", exact: true }).click();
  const panel = page.getByRole("region", { name: "Live local CPU debugger", exact: true });
  await expect(panel.getByLabel("Bridge secret", { exact: true })).toBeVisible();
  return panel;
}
async function connect(page: Page) {
  const panel = page.getByRole("region", { name: "Live local CPU debugger", exact: true });
  await panel.getByLabel("Local CPU bridge address", { exact: true }).fill(SYNTHETIC_ENDPOINT);
  await panel.getByLabel("Bridge secret", { exact: true }).fill(SYNTHETIC_SECRET);
  await panel.getByLabel("Bridge secret", { exact: true }).press("Enter");
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toBeVisible();
  return panel;
}
test("mock CPU transport stays opt-in, lossless, keyboard accessible and responsive", async ({ page }, testInfo) => {
  const bridge = new SyntheticCpuBridge(); await routeBridge(page, bridge);
  const panel = await open(page); expect(bridge.calls).toHaveLength(0);
  const beforeStorage = await page.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }));
  await connect(page); await expect(panel.getByLabel("Bridge secret", { exact: true })).toHaveValue("");
  for (const name of ["Step CPU forward", "Step CPU reverse", "Continue CPU execution", "Read CPU stack"]) {
    const button = panel.getByRole("button", { name, exact: true });
    await button.focus(); await button.press("Enter");
    await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toBeVisible();
  }
  for (const [label, value] of [["Function ordinal", "9007199254740993"], ["Block roster ordinal", "2"], ["Operation ordinal", "3"]])
    await panel.getByLabel(label, { exact: true }).fill(value);
  await panel.getByRole("button", { name: "Resolve CPU source site", exact: true }).click();
  await expect(panel.getByLabel("Lossless CPU protocol response")).toContainText("9007199254740993");
  await panel.getByRole("button", { name: "Set CPU breakpoint", exact: true }).click();
  await expect(panel.getByText(/backend acknowledged one filter change/)).toBeVisible();
  await panel.getByRole("button", { name: "List CPU breakpoints", exact: true }).click();
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toBeVisible();
  for (const [label, value] of [["Allocation ordinal", "1"], ["Allocation generation", "0"], ["Allocation byte offset", "0"], ["Memory byte length", "4"]])
    await panel.getByLabel(label, { exact: true }).fill(value);
  await panel.getByRole("button", { name: "Read CPU memory", exact: true }).click();
  await expect(panel.getByRole("region", { name: "Current CPU memory window" })).toContainText("0xa5a5a5a5");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const box = await panel.boundingBox(); if (!box) throw new Error("Mock CPU panel missing");
    for (const locator of [panel.getByLabel("Local CPU bridge address"), panel.getByLabel("Lossless CPU protocol response")]) {
      const child = await locator.boundingBox(); if (!child) throw new Error("Mock CPU control missing");
      expect(child.x).toBeGreaterThanOrEqual(box.x - 1); expect(child.x + child.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
    const width = await panel.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
    await panel.screenshot({ path: testInfo.outputPath("mock-live-cpu-" + theme + ".png") });
  }
  expect(await page.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }))).toBe(beforeStorage);
  expect(page.url()).not.toContain(SYNTHETIC_SECRET); await expect(panel).not.toContainText(SYNTHETIC_SECRET);
  for (const call of bridge.calls) {
    expect(call.url).not.toContain(SYNTHETIC_SECRET); expect(String(call.init.body)).not.toContain(SYNTHETIC_SECRET);
    expect(new Headers(call.init.headers).get("x-fe2o3-bridge-token")).toBe(SYNTHETIC_SECRET);
  }
  await panel.getByRole("button", { name: "Disconnect CPU debugger", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("bridge confirmed cleanup");
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toHaveCount(0);
  await expect(panel.getByLabel("Local CPU bridge address")).toBeFocused();
});
test("mock delayed command is discarded after disconnect and recorded viewers stay independent", async ({ page }) => {
  const bridge = new SyntheticCpuBridge(); let release!: () => void, finished!: () => void, waiting = false;
  const held = new Promise<void>(resolve => { release = resolve; });
  const lateRouteSettled = new Promise<void>(resolve => { finished = resolve; });
  await routeBridge(page, bridge,
    async route => { if (route.request().url().endsWith("/v1/command")) { waiting = true; await held; } },
    route => { if (route.request().url().endsWith("/v1/command")) finished(); });
  const panel = await open(page); await connect(page);
  await panel.getByRole("button", { name: "Step CPU forward", exact: true }).click();
  await expect.poll(() => waiting).toBe(true);
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Disconnect CPU debugger", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("bridge confirmed cleanup");
  release(); await lateRouteSettled;
  await expect(panel.getByRole("region", { name: "Current validated CPU response" })).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Read CPU memory", exact: true })).toBeDisabled();
  const sent = bridge.calls.length;
  await page.getByRole("button", { name: "Open recorded fault/source replay", exact: true }).click();
  await expect(page.getByRole("region", { name: "Recorded fault and prior-checkpoint replay", exact: true })).toBeVisible();
  expect(bridge.calls).toHaveLength(sent);
});
