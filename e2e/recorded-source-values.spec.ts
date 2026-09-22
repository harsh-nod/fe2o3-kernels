import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Actual retained capture only. Missing files or hash mismatches must fail;
// do not replace them with generated responses or skip this evidence test.
const directory = "examples/source-variable-resource-v2";
interface Cursor { event_sequence: number; state_revision: number }
interface Receipt {
  status: string; purpose: string; source_authentication: boolean; hardware_observed: boolean;
  performance_prediction: boolean; source_to_ssa_mapping: string; dynamic_helper_activation: string;
  raw_line_preservation: boolean;
  checkpoints: { control_request_id: number; source_variable_request_ids: number[];
    checkpoint_anchor: { cursor: Cursor }; source_variable_anchor: { frame: number; occurrence: number } }[];
  excerpts: { path: string; bytes: number; sha256: string }[];
}
const receipt = JSON.parse(readFileSync(resolve(directory, "receipt.json"), "utf8")) as Receipt;
if (receipt.status !== "passed" || receipt.purpose !== "existing-public-source-variable-resource-checkpoint-qualification" ||
    receipt.source_authentication !== false || receipt.hardware_observed !== false ||
    receipt.performance_prediction !== false || receipt.source_to_ssa_mapping !== "not_supplied" ||
    receipt.dynamic_helper_activation !== "not_represented" || receipt.raw_line_preservation !== true ||
    receipt.checkpoints.length !== 3) throw new Error("Expected the exact actual source-variable capture profile.");
function retained(side: "requests" | "responses") {
  const name = `resource-source-values.${side}.jsonl`, bytes = readFileSync(resolve(directory, name));
  const pins = receipt.excerpts.filter(pin => pin.path === name);
  if (pins.length !== 1 || pins[0].bytes !== bytes.length || bytes.length > 256 * 1024 ||
      pins[0].sha256 !== createHash("sha256").update(bytes).digest("hex") ||
      !bytes.toString("utf8").endsWith("\n")) throw new Error("Retained source-value file differs from its actual capture receipt.");
  return bytes;
}
const requests = retained("requests"), responses = retained("responses");
const requestLines = requests.toString("utf8").trimEnd().split("\n");
const responseLines = responses.toString("utf8").trimEnd().split("\n");
if (requestLines.length !== responseLines.length) throw new Error("Actual source-variable excerpt is not paired.");
const [forward, reverse, repeat] = receipt.checkpoints.map(value => value.checkpoint_anchor.cursor);
if (forward.event_sequence !== repeat.event_sequence || reverse.event_sequence >= forward.event_sequence ||
    reverse.state_revision !== forward.state_revision + 1 || repeat.state_revision !== reverse.state_revision + 1) {
  throw new Error("Expected actual forward/reverse/repeat identities, not repeated UI labels.");
}
async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  // Finish loading the lazy panel before observing local-import side effects.
  await expect(panel.getByLabel("Requests JSONL")).toBeVisible();
  return panel;
}
async function upload(panel: Locator, requestBytes = requests, responseBytes = responses) {
  await panel.getByLabel("Requests JSONL").setInputFiles({
    name: "resource-source-values.requests.jsonl", mimeType: "application/x-ndjson", buffer: requestBytes,
  });
  await panel.getByLabel("Responses JSONL").setInputFiles({
    name: "resource-source-values.responses.jsonl", mimeType: "application/x-ndjson", buffer: responseBytes,
  });
  const start = await panel.evaluate(() => performance.now());
  await panel.getByRole("button", { name: "Import local recording" }).click();
  return start;
}
const storage = (page: Page) => page.evaluate(() => JSON.stringify({
  local: Object.entries(localStorage), session: Object.entries(sessionStorage),
}));

test("actual source-variable pages share each retained stop without inventing source-to-SSA correspondence", async ({ page }, testInfo) => {
  const panel = await open(page), network: string[] = [], storageBefore = await storage(page);
  page.on("request", request => network.push(request.method() + " " + request.url()));
  const importStart = await upload(panel);
  const source = panel.getByRole("region", { name: "Imported checkpoint source variables" });
  const ssa = panel.getByRole("region", { name: "Imported checkpoint SSA and source" });
  const sourceTable = source.getByRole("table", { name: "Selected checkpoint source variables" });
  const ssaTable = ssa.getByRole("table", { name: "Selected checkpoint SSA values" });
  await expect(source).toHaveAttribute("data-state", "ready");
  await expect(ssa).toHaveAttribute("data-state", "ready");
  const importReady = await page.evaluate(() => performance.now());
  const sourceRows = await sourceTable.locator("tbody tr").count();
  await testInfo.attach("actual-source-values-browser-import-diagnostic.json", {
    contentType: "application/json",
    body: JSON.stringify({
      classification: "local_browser_tooling_diagnostic_not_GPU_performance",
      sample_count: 1, warm_panel_click_to_both_tables_ready_ms: importReady - importStart,
      timing_semantics: "Includes Playwright dispatch/observation overhead, FileReader, hashing, validation and React DOM readiness; not isolated parser CPU or guaranteed paint",
      timing_gate: false, percentile_claim: "none", project: testInfo.project.name,
      viewport: page.viewportSize(), browser: page.context().browser()?.version() ?? "unavailable",
      actual_input_bytes: requests.length + responses.length,
      actual_excerpts: receipt.excerpts, retained_checkpoints: receipt.checkpoints.length,
      first_checkpoint_source_rows: sourceRows,
      first_checkpoint_source_pages: receipt.checkpoints[0].source_variable_request_ids.length,
      source_row_limit: 64, complete_source_page_limit: 32,
      hardware_observed: false, performance_prediction: false, source_authenticated: false,
      narrow_viewport_is_mobile_hardware: false,
    }, null, 2) + "\n",
  });
  await expect(sourceTable).toContainText("0xfffffff0");
  await expect(sourceTable).toContainText("0x00000025");
  await expect(sourceTable).toContainText("not_represented");
  if (testInfo.project.name === "mobile") {
    // No-overflow alone allowed unreadable four-column compression. Require
    // the stacked fields to use the available row width and show their labels.
    const row = sourceTable.locator("tbody tr").first();
    const rowBounds = await row.boundingBox();
    const cellBounds = await row.locator("td").first().boundingBox();
    if (!rowBounds || !cellBounds) throw new Error("Source variable row has no readable bounds.");
    expect(cellBounds.width).toBeGreaterThan(rowBounds.width * .9);
    await expect(row.getByText("Scope / generation", { exact: true })).toBeVisible();
    await expect(row.getByText("Type / availability", { exact: true })).toBeVisible();
    await expect(row.getByText("Retained representation / interpretation", { exact: true })).toBeVisible();
  }
  await expect(source).toContainText("Matching values or names are not a source-to-SSA mapping");
  await expect(source).toContainText("not identical to the unframed checkpoint anchor");
  await expect(source).toContainText("Legacy occurrence 1 is not a dynamic helper activation");
  // Disclosure summaries remain keyboard-accessible; no execution/editor inputs.
  await expect(source.locator("button,input,select,textarea,[contenteditable=true]")).toHaveCount(0);
  await expect(panel.getByRole("group", { name: "Captured memory cells" }).getByRole("button")).toHaveCount(24);
  const checkpoints = panel.getByRole("combobox", { name: "Imported checkpoint" });
  const sourceText = await sourceTable.textContent(), forwardSsa = await ssaTable.textContent();
  const provenance = await panel.getByLabel("Local recording byte provenance").textContent();
  for (const index of [0, 1, 2]) {
    await checkpoints.selectOption(String(index));
    const checkpoint = receipt.checkpoints[index], cursor = checkpoint.checkpoint_anchor.cursor;
    await expect(source.getByTestId("source-values-anchor")).toContainText(
      `event ${cursor.event_sequence}, revision ${cursor.state_revision}`);
    await expect(ssa.getByTestId("checkpoint-values-anchor")).toContainText(
      `event ${cursor.event_sequence}, revision ${cursor.state_revision}`);
    expect(await sourceTable.textContent()).toBe(sourceText);
    const selected = JSON.parse(responseLines[requestLines.findIndex(line =>
      JSON.parse(line).request_id === checkpoint.control_request_id)]);
    await expect(ssaTable.getByRole("row")).toHaveCount(selected.result.snapshot.snapshot.values.length + 1);
    if (index === 1) expect(await ssaTable.textContent()).not.toBe(forwardSsa);
  }
  expect(await ssaTable.textContent()).toBe(forwardSsa);
  const summary = source.getByText("Recorded source-variable selection and identity", { exact: true });
  await summary.focus(); await summary.press("Enter");
  await expect(source).toContainText("Checkpoint frame / occurrence");
  await expect(source).toContainText("Not represented / not represented");
  await expect(source).toContainText("Source-variable frame / occurrence");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const bounds = await panel.boundingBox();
    if (!bounds) throw new Error("Source import panel has no visible bounds.");
    for (const [name, element] of [["source", source], ["source table", sourceTable], ["identity summary", summary]] as const) {
      const box = await element.boundingBox();
      if (!box) throw new Error(name + " has no visible bounds.");
      expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      const width = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(width.scroll, theme + " " + name + " overflow").toBeLessThanOrEqual(width.client + 1);
    }
    await source.screenshot({ path: testInfo.outputPath("source-values-" + theme + ".png") });
  }
  await panel.getByRole("button", { name: "Show original paired lines" }).click();
  const originalIndex = requestLines.findIndex(line =>
    JSON.parse(line).request_id === receipt.checkpoints[2].source_variable_request_ids[0]);
  expect(originalIndex).toBeGreaterThanOrEqual(0);
  await panel.getByRole("combobox", { name: "Original pair" }).selectOption(String(originalIndex));
  expect(await panel.getByLabel("Original request line").textContent()).toBe(requestLines[originalIndex] + "\n");
  expect(await panel.getByLabel("Original response line").textContent()).toBe(responseLines[originalIndex] + "\n");
  expect(await panel.getByLabel("Local recording byte provenance").textContent()).toBe(provenance);
  await panel.getByLabel("Responses JSONL").setInputFiles({
    name: "same-recording-new-file.jsonl", mimeType: "application/x-ndjson", buffer: responses,
  });
  await expect(source).toHaveCount(0); await expect(ssa).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(checkpoints).toHaveValue("0");
  await expect(source.getByTestId("source-values-anchor")).toContainText(
    `event ${forward.event_sequence}, revision ${forward.state_revision}`);
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(source).toHaveCount(0); await expect(ssa).toHaveCount(0);
  await expect(panel.getByLabel("Requests JSONL")).toBeFocused();
  expect(network).toEqual([]); expect(await storage(page)).toBe(storageBefore);
});

test("synthetic missing-page and failed-response mutations never retain a previous actual table", async ({ page }) => {
  const panel = await open(page);
  await upload(panel);
  const table = panel.getByRole("table", { name: "Selected checkpoint source variables" });
  await expect(table).toBeVisible();
  const lastPageId = receipt.checkpoints[0].source_variable_request_ids.at(-1);
  if (lastPageId === undefined) throw new Error("Actual source-variable page roster is absent.");
  const keep = (line: string) => JSON.parse(line).request_id !== lastPageId;
  // Negative excerpt preserves remaining actual lines but is explicitly incomplete.
  await upload(panel, Buffer.from(requestLines.filter(keep).join("\n") + "\n"),
    Buffer.from(responseLines.filter(keep).join("\n") + "\n"));
  await expect(panel.getByRole("alert")).toContainText("source_values_refused");
  await expect(table).toHaveCount(0);
  // This response mutation is a rejection control, not additional observed evidence.
  const failed = responseLines.map(line => {
    const value = JSON.parse(line);
    return value.request_id === lastPageId ? JSON.stringify({ ...value, status: "error" }) : line;
  }).join("\n") + "\n";
  await upload(panel, requests, Buffer.from(failed));
  await expect(panel.getByRole("alert")).toContainText("response_refused");
  await expect(table).toHaveCount(0);
});
