import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Exact original pairs from real source-produced recordings, not regenerated DTOs.
function excerpt(kind: "global" | "lds", side: "requests" | "responses") {
  const ids = kind === "global" ? [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21] : [11, 12, 13, 14, 15, 16, 17, 18];
  const file = kind === "global" ? `examples/resource-query-v6/debug-${side}.jsonl` : `examples/source_lds_resource_v1.${side}.jsonl`;
  const lines = readFileSync(resolve(file), "utf8").trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
  if (lines.length !== ids.length) throw Error("Original comparison pair roster changed.");
  return Buffer.from(lines.join("\n") + "\n");
}
async function load(page: Page, kind: "global" | "lds") {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  // Finish the lazy application's module loading before observing file-import
  // effects. All import, comparison and reset actions below remain network-free.
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Import local recording" })).toBeDisabled();
  const network: string[] = []; page.on("request", request => network.push(request.method() + " " + request.url()));
  const requests = excerpt(kind, "requests"), responses = excerpt(kind, "responses");
  await panel.getByLabel("Requests JSONL").setInputFiles({ name: "requests.jsonl", mimeType: "application/x-ndjson", buffer: requests });
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "responses.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await panel.getByRole("button", { name: "Import local recording" }).click();
  const comparison = panel.getByRole("region", { name: "Retained memory checkpoint comparison" });
  await expect(comparison).toHaveAttribute("data-state", "idle");
  await expect(panel).toContainText(createHash("sha256").update(requests).digest("hex"));
  await expect(panel).toContainText(createHash("sha256").update(responses).digest("hex"));
  return { panel, comparison, network, requests, responses };
}
async function inspectLayout(page: Page, panel: Locator, comparison: Locator, info: TestInfo, name: string) {
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const outer = await panel.boundingBox(); if (!outer) throw Error("Importer bounds absent");
    for (const [label, element] of [["comparison", comparison], ["selector", comparison.getByRole("combobox", { name: "Baseline retained memory window" })],
      ["grid", comparison.getByRole("group", { name: "Compared memory cells" })], ["table", comparison.getByRole("table")]] as const) {
      const box = await element.boundingBox(); if (!box) throw Error("Comparison bounds absent: " + label);
      expect(box.x, `${theme} ${label} left`).toBeGreaterThanOrEqual(outer.x - 1);
      expect(box.x + box.width, `${theme} ${label} right`).toBeLessThanOrEqual(outer.x + outer.width + 1);
      const widths = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(widths.scroll, `${theme} ${label} overflow ${JSON.stringify(widths)}`).toBeLessThanOrEqual(widths.client + 1);
    }
    const widths = await comparison.locator("th,td").evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, scroll: node.scrollWidth, client: node.clientWidth })));
    for (const cell of widths) expect(cell.scroll, `${theme} cell ${JSON.stringify(cell)}`).toBeLessThanOrEqual(cell.client + 1);
    expect(await comparison.getByRole("group", { name: "Compared memory cells" }).getByRole("button").count()).toBeLessThanOrEqual(256);
    await comparison.screenshot({ path: info.outputPath(name + "-" + theme + ".png") });
    await comparison.getByRole("table").scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(name + "-" + theme + "-details-viewport.png") });
  }
}

test("actual global checkpoint comparison preserves reverse/repeat identity and resets with selection/import", async ({ page }, info) => {
  const { panel, comparison, network, responses } = await load(page, "global");
  const baseline = comparison.getByRole("combobox", { name: "Baseline retained memory window" });
  await expect(baseline).toHaveValue(""); await baseline.focus(); await baseline.press("ArrowDown"); await baseline.press("Enter");
  await expect(baseline).toHaveValue("15"); await expect(comparison).toHaveAttribute("data-state", "ready");
  await expect(comparison.getByRole("status")).toContainText("4 storage-byte differences; 0 initialization differences");
  const cells = comparison.getByRole("group", { name: "Compared memory cells" }).getByRole("button");
  await cells.first().focus(); await page.keyboard.press("ArrowRight"); await expect(cells.nth(1)).toBeFocused();
  await page.keyboard.press("Home"); await expect(cells.first()).toBeFocused();
  await expect(comparison.getByRole("table")).toContainText("0xa5"); await expect(comparison.getByRole("table")).toContainText("0xd5");
  await inspectLayout(page, panel, comparison, info, "global-memory-comparison");
  await baseline.selectOption("21");
  await expect(comparison.getByRole("status")).toContainText("0 storage-byte differences; 0 initialization differences");
  await expect(comparison).toContainText("event 33, revision 6"); await expect(comparison).toContainText("event 33, revision 4");
  await panel.getByRole("combobox", { name: "Recorded resource page" }).selectOption("2");
  await expect(baseline).toHaveValue("21"); // Historical page selection never changes compared state.
  await panel.getByRole("combobox", { name: "Imported checkpoint" }).selectOption("1");
  await expect(baseline).toHaveValue(""); await expect(comparison).toHaveAttribute("data-state", "idle");
  await baseline.selectOption("11"); await expect(comparison.getByRole("status")).toContainText("4 storage-byte differences");
  await panel.getByRole("button", { name: "Show original paired lines" }).click();
  await expect(panel.getByLabel("Original response line")).toHaveText(responses.toString("utf8").split("\n")[0] + "\n");
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "same-bytes.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await expect(comparison).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(baseline).toHaveValue("");
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(comparison).toHaveCount(0); await expect(panel.getByLabel("Requests JSONL")).toBeFocused();
  expect(network).toEqual([]);
});
test("actual LDS comparison separates storage and initialization with bounded non-color cells", async ({ page }, info) => {
  const { panel, comparison, network } = await load(page, "lds");
  await comparison.getByRole("combobox", { name: "Baseline retained memory window" }).selectOption("17");
  await expect(comparison.getByRole("status")).toContainText("1 storage-byte differences; 4 initialization differences");
  await expect(comparison.getByRole("table")).toContainText("Storage equal; initialization differs");
  await expect(comparison.getByRole("table")).toContainText("uninitialized storage; not a program value");
  await comparison.getByRole("combobox", { name: "Comparison cell size" }).selectOption("1");
  const cells = comparison.getByRole("group", { name: "Compared memory cells" }).getByRole("button");
  await expect(cells).toHaveCount(256); await expect(cells.nth(1)).toHaveAttribute("data-marker", "I");
  await comparison.getByRole("combobox", { name: "Comparison cell size" }).selectOption("4");
  await inspectLayout(page, panel, comparison, info, "lds-memory-comparison");
  await panel.getByRole("combobox", { name: "Hypothetical target for LDS model" }).selectOption("gfx950");
  await expect(comparison.getByRole("combobox", { name: "Baseline retained memory window" })).toHaveValue("17");
  await expect(comparison.getByRole("status")).toContainText("1 storage-byte differences; 4 initialization differences");
  expect(network).toEqual([]);
});
