// Routed synthetic browser checks only; no real bridge, debugger, source export or GPU.
import { expect, test, type Page } from "@playwright/test";
import { SYNTHETIC_ENDPOINT, SYNTHETIC_SECRET } from "../tests/fixtures/cpu-debug-bridge";
import { syntheticQueryBridge, type QueryMock } from "../tests/fixtures/cpu-live-query";
const ORIGIN = "http://127.0.0.1:4173";
async function routeQueries(page: Page, mock: QueryMock,
  pause?: (command: string) => Promise<void>, settled?: (command: string) => void) {
  await page.route(SYNTHETIC_ENDPOINT + "/**", async route => {
    const request = route.request(), headers = {
      "Access-Control-Allow-Origin": ORIGIN, "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "content-type,x-fe2o3-bridge-token",
      "Content-Type": "application/json; charset=utf-8",
    };
    if (request.method() === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    const body = request.postData() ?? "", command = String((JSON.parse(body) as { command?: string }).command ?? "");
    const response = await mock.fetch(request.url(), { method: request.method(), body, headers: request.headers() });
    await pause?.(command);
    try { await route.fulfill({ status: response.status, headers, body: await response.text() }); }
    catch (error) { if (request.failure()?.errorText !== "net::ERR_ABORTED") throw error; }
    finally { settled?.(command); }
  });
}
async function openConnected(page: Page, mock: QueryMock) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open live CPU debugger", exact: true }).click();
  const panel = page.getByRole("region", { name: "Live local CPU debugger", exact: true });
  const dashboard = page.getByRole("region", { name: "Live CPU checkpoint dashboard", exact: true });
  expect(mock.bridge.calls).toHaveLength(0);
  await expect(dashboard.getByRole("table")).toHaveCount(0);
  await panel.getByLabel("Local CPU bridge address", { exact: true }).fill(SYNTHETIC_ENDPOINT);
  await panel.getByLabel("Bridge secret", { exact: true }).fill(SYNTHETIC_SECRET);
  await panel.getByLabel("Bridge secret", { exact: true }).press("Enter");
  await expect(panel.getByRole("region", { name: "Current validated CPU response", exact: true })).toBeVisible();
  await expect(dashboard.getByRole("button", { name: "Refresh source and inventory", exact: true })).toHaveCount(0);
  await panel.getByRole("button", { name: "Step CPU forward", exact: true }).click();
  await expect(dashboard.getByRole("button", { name: "Refresh source and inventory", exact: true })).toBeVisible();
  return { panel, dashboard };
}
test("mock live dashboard explicitly joins source, SSA and memory and clears changed selections", async ({ page }, testInfo) => {
  const mock = syntheticQueryBridge(); await routeQueries(page, mock);
  const { panel, dashboard } = await openConnected(page, mock);
  const storage = await page.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }));
  const refresh = dashboard.getByRole("button", { name: "Refresh source and inventory", exact: true });
  await refresh.focus(); await refresh.press("Enter");
  const source = dashboard.getByRole("table", { name: "Live checkpoint source-variable table", exact: true });
  const ssa = dashboard.getByRole("table", { name: "Live checkpoint SSA table", exact: true });
  await expect(source).toBeVisible(); await expect(ssa).toBeVisible();
  await expect(source.getByRole("row")).toHaveCount(5);
  await expect(ssa.getByRole("row")).toHaveCount(3);
  expect(mock.bridge.calls.slice(-3).map(call => call.body.command)).toEqual(["stack", "variables 1", "allocations"]);
  await dashboard.getByRole("combobox", { name: "Live CPU allocation", exact: true }).selectOption("1");
  await dashboard.getByRole("textbox", { name: "Live CPU byte length", exact: true }).fill("4");
  await dashboard.getByRole("button", { name: "Read selected allocation", exact: true }).click();
  const cells = dashboard.getByRole("group", { name: "Captured memory cells", exact: true });
  await expect(cells).toBeVisible();
  await expect(cells.getByRole("button", { name: "Byte offset 0, 1 byte, 0xa5, initialized", exact: true })).toBeVisible();
  expect(mock.bridge.calls.slice(-5).map(call => call.body.command)).toEqual(
    ["stack", "variables 1", "allocations", "accesses 1 0", "memory 1 0 0 4"]);
  const count = mock.bridge.calls.length;
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await cells.scrollIntoViewIfNeeded();
    const width = await dashboard.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
    await page.screenshot({ path: testInfo.outputPath("mock-live-dashboard-" + theme + ".png"), fullPage: false });
  }
  await dashboard.getByRole("textbox", { name: "Live CPU byte offset", exact: true }).fill("1");
  await expect(cells).toHaveCount(0); await expect(source).toBeVisible();
  expect(mock.bridge.calls).toHaveLength(count);
  await panel.getByRole("button", { name: "Step CPU forward", exact: true }).click();
  await expect(dashboard.getByRole("table")).toHaveCount(0);
  await expect(refresh).toBeVisible();
  await refresh.click(); await expect(source).toBeVisible();
  await panel.getByLabel("Local CPU bridge address", { exact: true }).fill("http://127.0.0.1:48762");
  await expect(dashboard.getByRole("table")).toHaveCount(0); await expect(refresh).toHaveCount(0);
  await panel.getByRole("button", { name: "Disconnect CPU debugger", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("bridge confirmed cleanup");
  expect(mock.bridge.calls.at(-1)?.url).toBe(SYNTHETIC_ENDPOINT + "/v1/disconnect");
  expect(await page.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), session: Object.entries(sessionStorage) }))).toBe(storage);
  expect(page.url()).not.toContain(SYNTHETIC_SECRET);
  await expect(dashboard).not.toContainText(SYNTHETIC_SECRET);
});
test("mock delayed dashboard collection cannot restore values after disconnect", async ({ page }) => {
  const mock = syntheticQueryBridge(); let release!: () => void, finish!: () => void, waiting = false;
  const held = new Promise<void>(resolve => { release = resolve; });
  const completed = new Promise<void>(resolve => { finish = resolve; });
  await routeQueries(page, mock, async command => {
    if (command === "stack") { waiting = true; await held; }
  }, command => { if (command === "stack") finish(); });
  const { panel, dashboard } = await openConnected(page, mock);
  try {
    await dashboard.getByRole("button", { name: "Refresh source and inventory", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await expect(dashboard.getByRole("table")).toHaveCount(0);
    await panel.getByRole("button", { name: "Disconnect CPU debugger", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("bridge confirmed cleanup");
    release(); await completed;
    await expect(dashboard.getByRole("table")).toHaveCount(0);
    await expect(dashboard.getByRole("button", { name: "Refresh source and inventory", exact: true })).toHaveCount(0);
    expect(mock.bridge.calls.some(call => call.body.command === "variables 1" || call.body.command === "allocations")).toBe(false);
    const sent = mock.bridge.calls.length;
    await page.getByRole("button", { name: "Open recorded fault/source replay", exact: true }).click();
    await expect(page.getByRole("region", { name: "Recorded fault and prior-checkpoint replay", exact: true })).toBeVisible();
    expect(mock.bridge.calls).toHaveLength(sent);
  } finally { release(); }
});
