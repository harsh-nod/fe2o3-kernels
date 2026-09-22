import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

const bytes = readFileSync(resolve("tests/fixtures/recorded-runtime-occurrences.json"));
const REPORT_SHA256 = "e0ab244eaf7fb0667b635dbe48408c1c51226ae5c38eb7766f1eab8aceb55c5c";
const BUNDLE_SHA256 = "73bd318be3af7bf1b98d093fc4bf95ca98ec4055b168b696d0a7a7abc5a57c75";
if (bytes.length < 1 || bytes.length > 512 * 1024 ||
  createHash("sha256").update(bytes).digest("hex") !== REPORT_SHA256)
  throw new Error("The exact bounded retained occurrence fixture is required.");
type CompactRow = [number, number, number, [number, number, number], number, number, number, number, number, number];
const report = JSON.parse(bytes.toString("utf8")) as {
  bundle_sha256: string;
  cases: { observation: { rows: CompactRow[] } }[];
};
if (report.bundle_sha256 !== BUNDLE_SHA256) throw new Error("The recorded bundle reference changed.");

async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open recorded occurrences", exact: true }).click();
  const panel = page.getByRole("region", { name: "Local recorded runtime occurrences" });
  await expect(panel).toBeVisible();
  return panel;
}
async function importFile(panel: Locator, name = "recorded-runtime-occurrences.json", buffer = bytes) {
  await panel.getByLabel("Occurrence report JSON", { exact: true }).setInputFiles({ name, mimeType: "application/json", buffer });
  await panel.getByRole("button", { name: "Import recorded occurrences", exact: true }).click();
  await expect(panel.getByRole("combobox", { name: "Recorded occurrence case", exact: true })).toBeVisible();
}
async function storageState(page: Page) {
  // Before/after equality checks retained state, not storage reads or transient writes.
  return page.evaluate(() => {
    const entries = (storage: Storage) => Object.keys(storage).sort().map(key => [key, storage.getItem(key)]);
    return { local: entries(localStorage), session: entries(sessionStorage) };
  });
}
async function viewportFrame(page: Page, row: Locator, info: TestInfo, theme: "light" | "dark") {
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  // Retain the real site header and layout. Settle actual browser geometry with
  // bounded frame observations, not a hidden header or a synthetic screenshot.
  const framing = await row.evaluate(async node => {
    const header = document.querySelector(".topbar");
    if (!header) throw new Error("The real site header is required.");
    const frames = () => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done())));
    for (let attempt = 1; attempt <= 24; attempt++) {
      const headerBottom = header.getBoundingClientRect().bottom;
      window.scrollTo({ left: 0, top: window.scrollY + node.getBoundingClientRect().top - headerBottom - 12, behavior: "instant" });
      await frames(); const first = node.getBoundingClientRect().top;
      await frames(); const second = node.getBoundingClientRect().top;
      if (Math.abs(first - second) <= .5 &&
        Math.abs(second - header.getBoundingClientRect().bottom - 12) <= 1)
        return { settled: true, attempts: attempt, rowTop: second, headerBottom: header.getBoundingClientRect().bottom };
    }
    return { settled: false, attempts: 24, rowTop: node.getBoundingClientRect().top, headerBottom: header.getBoundingClientRect().bottom };
  });
  const facts = row.getByLabel("Selected row facts", { exact: true });
  const geometry = await facts.evaluate(node => {
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom,
      right: box.right, viewportWidth: innerWidth, viewportHeight: innerHeight,
      scrollWidth: node.scrollWidth, clientWidth: node.clientWidth,
      pageScrollWidth: document.documentElement.scrollWidth };
  });
  expect(framing.settled).toBe(true);
  await expect(page.locator(".topbar").getByRole("link", { name: "fe2o3 kernels overview", exact: true })).toBeInViewport({ ratio: 1 });
  await expect(row.getByRole("heading", { name: "Selected recorded row", exact: true })).toBeInViewport({ ratio: 1 });
  await expect(facts).toBeInViewport({ ratio: 1 });
  expect(geometry.x).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  expect(geometry.pageScrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  await expect(facts).toContainText("0 / 1 / 1");
  await expect(facts).toContainText("0 / 3 / 1");
  const screenshot = await page.screenshot({ path: info.outputPath("runtime-occurrences-" + theme + ".jpg"),
    type: "jpeg", quality: 60, fullPage: false, scale: "css", animations: "disabled" });
  expect(screenshot.length).toBeLessThanOrEqual(1024 * 1024);
  const receipt = JSON.stringify({ schema: "task-runtime-occurrence-viewport-v1", project: info.project.name,
    theme, frame: "selected-call-row-facts", caseIndex: 4, invocation: 0, reportSha256: REPORT_SHA256,
    bundleSha256: BUNDLE_SHA256, fullPage: false, framing, geometry,
    screenshotBytes: screenshot.length, screenshotSha256: createHash("sha256").update(screenshot).digest("hex") }, null, 2) + "\n";
  expect(Buffer.byteLength(receipt)).toBeLessThanOrEqual(32768);
  writeFileSync(info.outputPath("runtime-occurrences-" + theme + ".json"), receipt, { flag: "wx" });
}

test("recorded occurrences distinguish zero/repeated calls and exact coordinate domains without live commands", async ({ page }, info) => {
  const panel = await open(page), network: string[] = [];
  const initialStorage = await storageState(page);
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await importFile(panel);
  const cases = panel.getByRole("combobox", { name: "Recorded occurrence case", exact: true });
  await expect(cases).toHaveValue("0");
  await expect(cases.locator("option")).toHaveCount(6);
  await expect(panel.getByLabel("Helper occurrence count", { exact: true })).toContainText("No helper activation was recorded");
  let row = panel.getByRole("region", { name: "Selected recorded row", exact: true });
  await expect(row).toContainText("Before operation");
  await panel.getByRole("button", { name: "Next recorded row", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(row).toContainText("After operation");
  await panel.getByRole("button", { name: "Previous recorded row", exact: true }).click();
  await expect(row).toContainText("Before operation");
  await cases.selectOption("4");
  await expect(panel.getByLabel("Helper occurrence count", { exact: true })).toContainText("3 helper activations");
  await panel.getByRole("combobox", { name: "Activation (report-local)", exact: true }).selectOption("2");
  const attempt = panel.getByRole("combobox", { name: "Operation attempt (report-local)", exact: true });
  await attempt.selectOption({ label: "Activation 2, attempt 1 — 1 / 0 / 0" });
  await expect(panel.getByLabel("Filtered row count", { exact: true })).toContainText("Filtered row 1 of 2");
  await panel.getByRole("button", { name: "Next recorded row", exact: true }).click();
  await expect(row).toContainText("After operation");
  await panel.getByRole("combobox", { name: "Recorded row phase", exact: true }).selectOption("write_committed");
  await expect(row).toHaveCount(0);
  await expect(panel.getByLabel("Filtered row count", { exact: true })).toContainText("No recorded row matches");
  await panel.getByRole("combobox", { name: "Recorded row phase", exact: true }).selectOption("all");
  await panel.getByRole("combobox", { name: "Activation (report-local)", exact: true }).selectOption("1");
  const call = report.cases[4].observation.rows.find(item =>
    item[2] === 0 && JSON.stringify(item[3]) === "[0,1,1]" && item[4] === 0);
  if (!call) throw new Error("The retained call-before row is required.");
  await attempt.selectOption({ label: "Activation 1, attempt " + call[6] + " — 0 / 1 / 1" });
  row = panel.getByRole("region", { name: "Selected recorded row", exact: true });
  await expect(panel.getByLabel("Filtered row count", { exact: true })).toContainText("original ordinal " + call[0]);
  for (const theme of ["light", "dark"] as const) await viewportFrame(page, row, info, theme);
  await panel.getByRole("button", { name: "Show selected row projection", exact: true }).click();
  const projection = JSON.parse(await panel.getByLabel("Selected row projection", { exact: true }).textContent() ?? "null");
  expect(projection.row.site).toEqual([0, 1, 1]);
  expect(projection.authoringRosterCoordinate).toEqual([0, 3, 1]);
  await expect(panel.getByRole("region", { name: "Unavailable occurrence facts", exact: true })).toContainText("producer-reported claim only");
  expect(network).toEqual([]);
  expect(await storageState(page)).toEqual(initialStorage);
});

test("recorded occurrence reimport and refusal clear stale case, raw bytes and write selection", async ({ page }) => {
  const panel = await open(page), network: string[] = [];
  const initialStorage = await storageState(page);
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await importFile(panel);
  const cases = panel.getByRole("combobox", { name: "Recorded occurrence case", exact: true });
  await cases.selectOption("5");
  await panel.getByRole("combobox", { name: "Logical invocation (report-local)", exact: true }).selectOption("3");
  await panel.getByRole("combobox", { name: "Recorded row phase", exact: true }).selectOption("write_committed");
  const row = panel.getByRole("region", { name: "Selected recorded row", exact: true });
  await expect(row).toContainText("0x0000479d");
  await expect(row).toContainText("byte offset 16");
  await expect(row).toContainText("not a checkpoint or memory snapshot");
  await panel.getByRole("button", { name: "Show original occurrence report", exact: true }).click();
  expect(await panel.getByLabel("Original occurrence report", { exact: true }).textContent()).toBe(bytes.toString("utf8"));
  await panel.getByLabel("Occurrence report JSON", { exact: true }).setInputFiles({
    name: "same-bytes.json", mimeType: "application/json", buffer: bytes,
  });
  await expect(cases).toHaveCount(0);
  await expect(panel.getByLabel("Original occurrence report", { exact: true })).toHaveCount(0);
  await panel.getByRole("button", { name: "Import recorded occurrences", exact: true }).click();
  await expect(cases).toHaveValue("0");
  await expect(panel.getByRole("combobox", { name: "Logical invocation (report-local)", exact: true })).toHaveValue("0");
  await expect(panel.getByRole("combobox", { name: "Recorded row phase", exact: true })).toHaveValue("all");
  await panel.getByLabel("Occurrence report JSON", { exact: true }).setInputFiles({
    name: "wrong.json", mimeType: "application/json", buffer: Buffer.from("{}\n"),
  });
  await expect(row).toHaveCount(0);
  await panel.getByRole("button", { name: "Import recorded occurrences", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("Import refused");
  await expect(cases).toHaveCount(0);
  await panel.getByRole("button", { name: "Reset recorded occurrences", exact: true }).click();
  await expect(panel.getByLabel("Occurrence report JSON", { exact: true })).toHaveValue("");
  await expect(panel.getByLabel("Occurrence report JSON", { exact: true })).toBeFocused();
  await expect(panel.getByRole("button", { name: "Import recorded occurrences", exact: true })).toBeDisabled();
  expect(network).toEqual([]);
  expect(await storageState(page)).toEqual(initialStorage);
});
