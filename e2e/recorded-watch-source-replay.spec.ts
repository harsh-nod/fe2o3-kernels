import { expect, test, type Locator, type Page } from "@playwright/test";
import { WATCH_SOURCE_FILES } from "../src/content/recorded-watch-source-observation";
import { readActualWatchSourceCapture } from "../tests/fixtures/actual-watch-source-capture";

// Fail on absent/changed actual fixtures; never skip or replace them with generated positives.
const actual = readActualWatchSourceCapture();
const names = ["Later source checkpoint — lane 1", "Reverse pre-write checkpoint — lane 0", "Repeated later source checkpoint — lane 1"];
async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open recorded watch/source replay" }).click();
  const panel = page.getByRole("region", { name: "Recorded watchpoint and source replay" });
  // Finish lazy module loading before asserting that imports do not make network requests.
  for (const spec of WATCH_SOURCE_FILES) await expect(panel.getByLabel(spec.label, { exact: false })).toBeVisible();
  return panel;
}
async function upload(panel: Locator) {
  for (const spec of WATCH_SOURCE_FILES) await panel.getByLabel(spec.label, { exact: false }).setInputFiles({
    name: spec.leaf, mimeType: spec.role === "receipt" ? "application/json" : "application/x-ndjson", buffer: actual.buffers[spec.role],
  });
  await panel.getByRole("button", { name: "Import watch/source recording" }).click();
  await expect(panel.getByText("Imported consistent local files; all provenance remains unverified.")).toBeVisible();
}
const storage = (page: Page) => page.evaluate(() => JSON.stringify({
  local: Object.entries(localStorage), session: Object.entries(sessionStorage),
}));
test("actual watch/source replay keeps five moments separate, original lines, and readable read-only source/SSA views", async ({ page }, testInfo) => {
  const panel = await open(page), network: string[] = [], beforeStorage = await storage(page);
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await upload(panel);
  const selected = panel.getByRole("region", { name: "Selected watch/source moment" });
  const source = selected.getByRole("region", { name: "Imported checkpoint source variables" });
  const ssa = selected.getByRole("region", { name: "Imported checkpoint SSA and source" });
  const sourceTable = source.getByRole("table", { name: "Selected checkpoint source variables" });
  const ssaTable = ssa.getByRole("table", { name: "Selected checkpoint SSA values" });
  const cells = selected.getByRole("group", { name: "Captured memory cells" }).getByRole("button");
  await expect(selected).toHaveAttribute("data-moment", "stop");
  await expect(selected.getByRole("table")).toHaveCount(0);
  await expect(cells).toHaveCount(0);
  await expect(selected.getByTestId("watch-source-selected-anchor")).not.toContainText("Logical lane");
  await expect(selected).toContainText("No lane or values are inferred from adjacent checkpoints.");
  await selected.getByText("Selected moment original pairs", { exact: true }).click();
  expect(await selected.getByLabel("Original watch/source request line").textContent()).toBe(actual.watch.requestUtf8);
  const watchRefusal = actual.byId(actual.receipt.watchpoint_source_query_request_id);
  await selected.getByLabel("Original pair for selected moment").selectOption("1");
  expect(await selected.getByLabel("Original watch/source response line").textContent()).toBe(watchRefusal.responseUtf8);

  await panel.getByRole("radio", { name: "Immediate post-write checkpoint — lane 0, source unavailable" }).check();
  await expect(selected).toHaveAttribute("data-moment", "immediate");
  await expect(source).toHaveCount(0);
  await expect(ssaTable.locator("tbody tr")).toHaveCount(actual.immediate.response.result.snapshot.snapshot.values.length);
  await expect(selected).toContainText("Its retained stack has no next_operation");
  await expect(cells).toHaveCount(24);
  const afterMemory = await cells.allTextContents();
  let laterSource = "", laterSsa = "";
  for (const [i, group] of actual.groups.entries()) {
    await panel.getByRole("radio", { name: names[i], exact: true }).check();
    const a = group.summary.checkpoint_anchor, cursor = a.cursor;
    await expect(selected.getByTestId("watch-source-selected-anchor")).toContainText("Event " + cursor.event_sequence + "; revision " + cursor.state_revision);
    await expect(selected.getByTestId("watch-source-selected-anchor")).toContainText("Logical lane " + a.scope.lane);
    await expect(source).toHaveAttribute("data-state", "ready"); await expect(ssa).toHaveAttribute("data-state", "ready");
    await expect(sourceTable.locator("tbody tr")).toHaveCount(group.sourceRows.length);
    await expect(ssaTable.locator("tbody tr")).toHaveCount(group.ssaRows.length);
    await expect(source.getByTestId("source-values-anchor")).toContainText("event " + cursor.event_sequence + ", revision " + cursor.state_revision);
    await expect(source.locator("button,input,select,textarea,[contenteditable=true]")).toHaveCount(0);
    await expect(source).toContainText("Matching values or names are not a source-to-SSA mapping");
    await expect(selected).toContainText("Frame 1 is static stack depth");
    for (const row of group.sourceRows) {
      await expect(sourceTable).toContainText(row.name);
      await expect(sourceTable).toContainText(row.availability.value.status === "captured"
        ? row.availability.value.value.bits : row.availability.value.reason);
    }
    if (i === 0) { laterSource = (await sourceTable.textContent())!; laterSsa = (await ssaTable.textContent())!; }
    expect(await sourceTable.textContent()).toBe(laterSource);
    if (i === 1) {
      expect(await ssaTable.textContent()).not.toBe(laterSsa);
      expect(await cells.allTextContents()).not.toEqual(afterMemory);
    } else {
      expect(await ssaTable.textContent()).toBe(laterSsa);
      expect(await cells.allTextContents()).toEqual(afterMemory);
    }
    await selected.getByText("Selected moment original pairs", { exact: true }).click();
    await expect(selected.getByLabel("Original pair for selected moment")).toHaveValue("0");
    expect(await selected.getByLabel("Original watch/source request line").textContent()).toBe(group.control.requestUtf8);
    expect(await selected.getByLabel("Original watch/source response line").textContent()).toBe(group.control.responseUtf8);
    await selected.getByLabel("Original pair for selected moment").selectOption("2");
    expect(await selected.getByLabel("Original watch/source response line").textContent()).toBe(group.pages[0].responseUtf8);
  }
  await cells.first().focus(); await cells.first().press("ArrowRight"); await expect(cells.nth(1)).toBeFocused();
  if (testInfo.project.name === "mobile") {
    const row = sourceTable.locator("tbody tr").first(), rowBox = await row.boundingBox(), cellBox = await row.locator("td").first().boundingBox();
    if (!rowBox || !cellBox) throw new Error("Actual source row has no readable bounds.");
    expect(cellBox.width).toBeGreaterThan(rowBox.width * .9);
    for (const field of ["Scope / generation", "Type / availability", "Retained representation / interpretation"])
      await expect(row.getByText(field, { exact: true })).toBeVisible();
  }
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const bounds = await panel.boundingBox(); if (!bounds) throw new Error("Watch/source panel has no bounds.");
    for (const element of [source, sourceTable]) {
      const box = await element.boundingBox(); if (!box) throw new Error("Selected source view has no bounds.");
      expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1); expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      const width = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
    }
    const raw = selected.getByLabel("Original watch/source response line"), rawBox = await raw.boundingBox();
    if (!rawBox) throw new Error("Original line view has no bounds.");
    expect(rawBox.x + rawBox.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    await source.screenshot({ path: testInfo.outputPath("watch-source-replay-" + theme + ".png") });
  }
  const stopRadio = panel.getByRole("radio", { name: "Uncaptured watch stop — scope unavailable" });
  await stopRadio.focus(); await stopRadio.press("Space"); await expect(stopRadio).toBeChecked();
  await expect(source).toHaveCount(0); await expect(ssa).toHaveCount(0); await expect(cells).toHaveCount(0);
  await panel.getByRole("button", { name: "Reset watch/source files" }).click();
  await expect(selected).toHaveCount(0); await expect(panel.getByLabel("Capture receipt JSON", { exact: false })).toBeFocused();
  expect(network).toEqual([]); expect(await storage(page)).toBe(beforeStorage);
});

test("replacing a real recording with invalid bytes clears all prior values", async ({ page }) => {
  const panel = await open(page); await upload(panel);
  await panel.getByRole("radio", { name: names[0], exact: true }).check();
  await expect(panel.getByRole("table", { name: "Selected checkpoint source variables" })).toBeVisible();
  await panel.getByLabel("Full session responses JSONL", { exact: false }).setInputFiles({
    name: "synthetic-invalid.jsonl", mimeType: "application/x-ndjson", buffer: Buffer.from("{}\n"),
  });
  await expect(panel.getByRole("region", { name: "Selected watch/source moment" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Import watch/source recording" }).click();
  await expect(panel.getByRole("status")).toContainText("file_hash");
  await expect(panel.getByRole("table", { name: "Selected checkpoint source variables" })).toHaveCount(0);
  await expect(panel.getByRole("group", { name: "Captured memory cells" })).toHaveCount(0);
  // The shared legacy importer's positive behavior is also checked by the actual
  // unit test. Existing legacy UI/browser cases remain unmodified in the suite.
});
