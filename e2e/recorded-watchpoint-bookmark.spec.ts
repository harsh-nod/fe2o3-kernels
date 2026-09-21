import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
const requests = readFileSync("tests/fixtures/recorded-watchpoint-requests.jsonl");
const responses = readFileSync("tests/fixtures/recorded-watchpoint-responses.jsonl");
async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open recorded watchpoint", exact: true }).click();
  const panel = page.getByRole("region", { name: "Local recorded watchpoint observation", exact: true });
  await expect(panel).toBeVisible();
  const network: string[] = []; page.on("request", request => network.push(request.url()));
  const storage = await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]);
  await panel.getByLabel("Watchpoint requests JSONL", { exact: true }).setInputFiles({ name: "requests.jsonl", mimeType: "application/x-ndjson", buffer: requests });
  await panel.getByLabel("Watchpoint responses JSONL", { exact: true }).setInputFiles({ name: "responses.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await panel.getByRole("button", { name: "Import watchpoint observation", exact: true }).click();
  await expect(panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true })).toBeChecked();
  return { panel, network, storage };
}
async function download(page: Page, panel: Locator) {
  const pending = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Download moment bookmark", exact: true }).click();
  const item = await pending; expect(item.suggestedFilename()).toBe("fe2o3-watchpoint-moment.bookmark.json");
  const file = await item.path(); expect(file).not.toBeNull();
  const bytes = readFileSync(file!); expect(bytes.byteLength).toBeLessThanOrEqual(16 * 1024);
  return bytes;
}
async function choose(panel: Locator, bytes: Buffer) {
  await panel.getByLabel("Watchpoint moment bookmark JSON", { exact: true }).setInputFiles({ name: "moment.json", mimeType: "application/json", buffer: bytes });
}
async function reopen(panel: Locator, bytes: Buffer) {
  await choose(panel, bytes);
  await panel.getByRole("button", { name: "Reopen moment bookmark", exact: true }).click();
}
async function screenshot(page: Page, panel: Locator, info: TestInfo, theme: "light" | "dark") {
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  const target = panel.getByRole("region", { name: "Recorded watchpoint moment bookmark", exact: true });
  await target.evaluate(async node => {
    for (let i = 0; i < 24; i++) {
      const header = document.querySelector("header")!;
      window.scrollBy({ top: node.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 16, behavior: "instant" });
      await new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done())));
      const box = node.getBoundingClientRect(), top = header.getBoundingClientRect().bottom;
      if (box.top >= top && box.bottom <= innerHeight) return;
    }
  });
  const geometry = await target.evaluate(node => {
    const box = node.getBoundingClientRect(), header = document.querySelector("header")!.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, header: header.bottom,
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.header);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);
  expect(geometry.left).toBeGreaterThanOrEqual(0); expect(geometry.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  await expect(target.getByRole("button", { name: "Download moment bookmark", exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath("watchpoint-bookmark-" + theme + ".jpg"), type: "jpeg", quality: 60, fullPage: false, scale: "css" });
}
test("moment bookmarks round-trip all three moments and reset unsaved same-moment views", async ({ page }, info) => {
  const { panel, network, storage } = await open(page);
  await screenshot(page, panel, info, "light"); await screenshot(page, panel, info, "dark");
  const stop = await download(page, panel);
  await panel.getByRole("radio", { name: "Separate later checkpoint and memory", exact: true }).check();
  const later = await download(page, panel);
  await panel.getByRole("combobox", { name: "Memory cell size", exact: true }).selectOption("4");
  await panel.getByRole("button", { name: "Show selected moment's original pairs", exact: true }).click();
  await panel.getByRole("combobox", { name: "Selected moment original pair", exact: true }).selectOption("1");
  await reopen(panel, later);
  await expect(panel.getByRole("status", { name: "Restored watchpoint moment", exact: true })).toBeVisible();
  await expect(panel.getByRole("combobox", { name: "Memory cell size", exact: true })).toHaveValue("1");
  await expect(panel.getByRole("combobox", { name: "Selected moment original pair", exact: true })).toHaveCount(0);
  await reopen(panel, stop);
  await expect(panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true })).toBeChecked();
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  await panel.getByRole("radio", { name: "Registration and earlier inventory", exact: true }).check();
  const registration = await download(page, panel);
  await panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true }).check();
  await reopen(panel, registration);
  await expect(panel.getByRole("region", { name: "Recorded watchpoint registration", exact: true })).toBeVisible();
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)])).toEqual(storage);
  expect(network).toEqual([]);
});
test("stale bookmarks and a cancelled held local read cannot select later memory", async ({ page }) => {
  const { panel, network } = await open(page);
  await panel.getByRole("radio", { name: "Separate later checkpoint and memory", exact: true }).check();
  const later = await download(page, panel);
  await panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true }).check();
  const stale = later.toString().replace("f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c", "a".repeat(64));
  expect(stale).not.toBe(later.toString()); await reopen(panel, Buffer.from(stale));
  await expect(panel.getByRole("alert")).toContainText("No saved selection applied");
  await expect(panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true })).toBeChecked();
  await choose(panel, later);
  const held = await page.evaluateHandle(() => {
    const original = FileReader.prototype.readAsArrayBuffer, pending: { reader: FileReader; blob: Blob }[] = [];
    FileReader.prototype.readAsArrayBuffer = function (blob: Blob) { pending.push({ reader: this, blob }); };
    return { count: () => pending.length, restore: () => { FileReader.prototype.readAsArrayBuffer = original; },
      release: async () => {
        FileReader.prototype.readAsArrayBuffer = original;
        await Promise.all(pending.splice(0).map(({ reader, blob }) => new Promise<void>((resolve, reject) => {
          reader.addEventListener("loadend", () => resolve(), { once: true });
          try { original.call(reader, blob); } catch (error) { reject(error); }
        })));
      } };
  });
  try {
    await panel.getByRole("button", { name: "Reopen moment bookmark", exact: true }).click();
    await expect.poll(() => held.evaluate(value => value.count())).toBe(1);
    await panel.getByRole("button", { name: "Cancel moment bookmark", exact: true }).click();
    await held.evaluate(value => value.release());
    await expect(panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true })).toBeChecked();
    await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  } finally { await held.evaluate(value => value.restore()); await held.dispose(); }
  expect(network).toEqual([]);
});
