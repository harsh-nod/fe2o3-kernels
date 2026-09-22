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
  await expect(panel.getByRole("group", { name: "Recorded helper/caller boundary navigation", exact: true })).toHaveCount(0);
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

async function boundaryViewportFrame(page: Page, navigation: Locator, info: TestInfo,
  theme: "light" | "dark", activation: number) {
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  const framing = await navigation.evaluate(async node => {
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
        return { settled: true, attempts: attempt, targetTop: second, headerBottom: header.getBoundingClientRect().bottom };
    }
    return { settled: false, attempts: 24, targetTop: node.getBoundingClientRect().top, headerBottom: header.getBoundingClientRect().bottom };
  });
  const geometry = await navigation.evaluate(node => {
    const box = node.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom,
      right: box.right, viewportWidth: innerWidth, viewportHeight: innerHeight,
      scrollWidth: node.scrollWidth, clientWidth: node.clientWidth,
      pageScrollWidth: document.documentElement.scrollWidth };
  });
  expect(framing.settled).toBe(true);
  await expect(page.locator(".topbar").getByRole("link", { name: "fe2o3 kernels overview", exact: true })).toBeInViewport({ ratio: 1 });
  await expect(navigation).toBeInViewport({ ratio: 1 });
  expect(geometry.x).toBeGreaterThanOrEqual(0);
  expect(geometry.y).toBeGreaterThanOrEqual(framing.headerBottom);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  expect(geometry.pageScrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  await expect(navigation).toContainText("helper activation " + activation + ", case 5");
  await expect(navigation).toContainText("logical invocation 3");
  const buttons = navigation.getByRole("button");
  await expect(buttons).toHaveCount(4);
  const hitTargets = [];
  for (const button of await buttons.all()) {
    await expect(button).toBeEnabled(); await expect(button).toBeInViewport({ ratio: 1 });
    const target = await button.evaluate(node => {
      const box = node.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { label: node.textContent, width: box.width, height: box.height,
        hit: hit === node || (hit !== null && node.contains(hit)) };
    });
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.hit).toBe(true); hitTargets.push(target);
  }
  const screenshot = await page.screenshot({ path: info.outputPath("runtime-occurrence-navigation-" + theme + ".jpg"),
    type: "jpeg", quality: 60, fullPage: false, scale: "css", animations: "disabled" });
  expect(screenshot.length).toBeLessThanOrEqual(1024 * 1024);
  const receipt = JSON.stringify({ schema: "task-runtime-occurrence-navigation-viewport-v1", project: info.project.name,
    retry: info.retry, theme, frame: "recorded-helper-caller-boundaries", caseIndex: 5, invocation: 3, activation,
    reportSha256: REPORT_SHA256, bundleSha256: BUNDLE_SHA256, fullPage: false, framing, geometry, hitTargets,
    screenshotBytes: screenshot.length, screenshotSha256: createHash("sha256").update(screenshot).digest("hex") }, null, 2) + "\n";
  expect(Buffer.byteLength(receipt)).toBeLessThanOrEqual(32768);
  writeFileSync(info.outputPath("runtime-occurrence-navigation-" + theme + ".json"), receipt, { flag: "wx" });
}

// Separate browser cases keep eight jumps within each unchanged 30-second budget.
for (const [caseIndex, invocation] of [[4, 0], [4, 3], [5, 0], [5, 3]] as const) {
  test(`recorded helper boundary jumps retain case ${caseIndex} invocation ${invocation} without live effects`, async ({ page }, info) => {
    const panel = await open(page), network: string[] = [];
    const initialStorage = await storageState(page);
    page.on("request", request => network.push(request.method() + " " + request.url()));
    await importFile(panel);
    const cases = panel.getByRole("combobox", { name: "Recorded occurrence case", exact: true });
    const invocations = panel.getByRole("combobox", { name: "Logical invocation (report-local)", exact: true });
    const navigation = panel.getByRole("group", { name: "Recorded helper/caller boundary navigation", exact: true });
    await expect(navigation).toHaveCount(0);
    let finalActivation = 0;
    await cases.selectOption(String(caseIndex));
    await invocations.selectOption(String(invocation));
    const localRows = report.cases[caseIndex].observation.rows.filter(item => item[2] === invocation);
    const afterRows = localRows.filter(item => item[4] === 1);
    expect(afterRows.some((item, index) => index > 0 && item[0] > afterRows[index - 1][0] + 1)).toBe(true);
    if (caseIndex === 5) expect(localRows[0][0]).toBeGreaterThan(0);
    const activations = [...new Set(localRows.filter(item => item[3][0] === 1).map(item => item[5]))];
    expect(activations).toHaveLength(3);
    for (const activation of [activations[0], activations[2]]) {
      const helperRows = localRows.filter(item => item[3][0] === 1 && item[5] === activation);
      const first = helperRows[0], last = helperRows[helperRows.length - 1];
      if (!first || !last) throw new Error("Actual helper rows are required.");
      const callers = localRows.filter(item => item[4] === 0 && JSON.stringify(item[3]) === "[0,1,1]")
        .map(before => ({ before, after: localRows.find(item => item[4] === 1 && item[5] === before[5] &&
          item[6] === before[6] && JSON.stringify(item[3]) === "[0,1,1]") }))
        .filter(pair => pair.after && pair.before[0] < first[0] && last[0] < pair.after[0]);
      expect(callers).toHaveLength(1);
      const before = callers[0].before, after = callers[0].after!;
      await panel.getByRole("combobox", { name: "Activation (report-local)", exact: true }).selectOption(String(activation));
      await panel.getByRole("combobox", { name: "Recorded row phase", exact: true }).selectOption("after_operation");
      const targets = [
        ["Jump to recorded caller before", before],
        ["Jump to recorded helper last", last],
        ["Jump to recorded caller after", after],
        ["Jump to recorded helper first", first],
      ] as const;
      for (const [label, expected] of targets) {
        await expect(navigation).toContainText("helper activation " + activation + ", case " + caseIndex);
        await expect(navigation).toContainText("logical invocation " + invocation);
        await expect(navigation).toContainText("Each jump clears the activation, operation-attempt and phase filters");
        const button = navigation.getByRole("button", { name: label, exact: true });
        await button.focus(); await page.keyboard.press("Enter");
        await expect(cases).toHaveValue(String(caseIndex));
        await expect(invocations).toHaveValue(String(invocation));
        for (const name of ["Activation (report-local)", "Operation attempt (report-local)", "Recorded row phase"])
          await expect(panel.getByRole("combobox", { name, exact: true })).toHaveValue("all");
        const position = localRows.findIndex(item => item[0] === expected[0]);
        expect(position).toBeGreaterThanOrEqual(0);
        await expect(panel.getByLabel("Filtered row count", { exact: true })).toHaveText(
          "Filtered row " + (position + 1) + " of " + localRows.length + "; original ordinal " + expected[0] + ".");
        await expect(panel.getByLabel("Filtered row position", { exact: true })).toHaveValue(String(position));
        await expect(navigation).toContainText("helper activation " + activation + ", case " + caseIndex);
        await expect(panel.getByLabel("Selected row projection", { exact: true })).toHaveCount(0);
        await panel.getByRole("button", { name: "Show selected row projection", exact: true }).click();
        const projection = JSON.parse(await panel.getByLabel("Selected row projection", { exact: true }).textContent() ?? "null");
        expect(projection.caseIndex).toBe(caseIndex);
        expect(projection.row).toMatchObject({ ordinal: expected[0], decision: expected[1], invocation,
          site: expected[3], phase: expected[4] === 0 ? "before_operation" : "after_operation",
          activation: expected[5], attempt: expected[6], committedWrite: null });
      }
      finalActivation = activation;
    }
    if (caseIndex === 5 && invocation === 3) {
      for (const theme of ["light", "dark"] as const) await boundaryViewportFrame(page, navigation, info, theme, finalActivation);
    }
    await panel.getByLabel("Occurrence report JSON", { exact: true }).setInputFiles({
      name: "same-boundary-recording.json", mimeType: "application/json", buffer: bytes,
    });
    await expect(navigation).toHaveCount(0);
    await panel.getByRole("button", { name: "Import recorded occurrences", exact: true }).click();
    await expect(cases).toHaveValue("0"); await expect(navigation).toHaveCount(0);
    await cases.selectOption("1"); await expect(navigation).toHaveCount(0);
    await panel.getByRole("button", { name: "Reset recorded occurrences", exact: true }).click();
    await expect(navigation).toHaveCount(0); await expect(cases).toHaveCount(0);
    expect(network).toEqual([]);
    expect(await storageState(page)).toEqual(initialStorage);
  });
}
