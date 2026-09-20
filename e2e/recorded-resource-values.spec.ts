import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

// Original pairs from a real source-produced capture; no response reserialization.
function excerpt(side: "requests" | "responses") {
  const ids = [1, 3, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21];
  const lines = readFileSync(resolve("examples/resource-query-v6/debug-" + side + ".jsonl"), "utf8")
    .trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
  if (lines.length !== ids.length) throw new Error("Retained value checkpoint roster changed.");
  return Buffer.from(lines.join("\n") + "\n");
}
const requests = excerpt("requests"), responses = excerpt("responses");

test("imported SSA values follow exact checkpoint selection without following historical accesses", async ({ page }, testInfo) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Import local recording" })).toBeDisabled();
  const network: string[] = [];
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await panel.getByLabel("Requests JSONL").setInputFiles({ name: "requests.jsonl", mimeType: "application/x-ndjson", buffer: requests });
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "responses.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await panel.getByRole("button", { name: "Import local recording" }).click();
  const inspector = panel.getByRole("region", { name: "Imported checkpoint SSA and source" });
  const table = inspector.getByRole("table", { name: "Selected checkpoint SSA values" });
  await expect(inspector).toHaveAttribute("data-state", "ready");
  await expect(table.getByRole("row")).toHaveCount(4);
  const checkpoints = panel.getByRole("combobox", { name: "Imported checkpoint" });
  await checkpoints.focus(); await checkpoints.press("ArrowDown"); await checkpoints.press("Enter");
  await expect(checkpoints).toHaveValue("1");
  await expect(table.getByRole("row")).toHaveCount(19);
  await expect(table).toContainText("0x000001d5"); await expect(table).toContainText("469");
  const summary = inspector.locator("summary");
  await summary.focus(); await summary.press("Enter");
  await expect(inspector).toContainText("Byte span [931, 947)");
  await expect(inspector).toContainText("compiler_bundle_bound claim, unverified");
  const values = await table.textContent();
  await panel.getByRole("combobox", { name: "Recorded resource page" }).selectOption("2");
  await panel.getByRole("button", { name: /Select retained access event/u }).click();
  expect(await table.textContent()).toBe(values);
  await expect(inspector.getByTestId("checkpoint-values-anchor")).toContainText("event 33, revision 4");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const bounds = await panel.boundingBox();
    if (!bounds) throw new Error("Imported panel has no visible bounds.");
    for (const [label, element] of [["inspector", inspector], ["table", table], ["summary", summary]] as const) {
      const box = await element.boundingBox();
      if (!box) throw new Error(`Checkpoint ${label} has no visible bounds.`);
      expect(box.x, `${theme} ${label} left bound`).toBeGreaterThanOrEqual(bounds.x - 1);
      expect(box.x + box.width, `${theme} ${label} right bound`).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      const widths = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(widths.scroll, `${theme} ${label} horizontal overflow: ${JSON.stringify(widths)}`).toBeLessThanOrEqual(widths.client + 1);
    }
    const headers = await table.locator("th").evaluateAll(nodes => nodes.map(node => ({
      text: node.textContent, scroll: node.scrollWidth, client: node.clientWidth,
    })));
    expect(headers).toHaveLength(21);
    for (const header of headers) {
      expect(header.scroll, `${theme} header overflow: ${JSON.stringify(header)}`).toBeLessThanOrEqual(header.client + 1);
    }
    await inspector.screenshot({ path: testInfo.outputPath("checkpoint-values-" + theme + ".png") });
  }
  await checkpoints.selectOption("2");
  await expect(inspector.getByTestId("checkpoint-values-anchor")).toContainText("event 31, revision 5");
  await checkpoints.selectOption("3");
  await expect(inspector.getByTestId("checkpoint-values-anchor")).toContainText("event 33, revision 6");
  expect(await table.textContent()).toBe(values);
  await panel.getByRole("button", { name: "Show original paired lines" }).click();
  await expect(panel.getByLabel("Original response line")).toHaveText(responses.toString("utf8").split("\n")[0] + "\n");
  expect(await inspector.locator("tbody tr").count()).toBeLessThanOrEqual(64);
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "same-bytes.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await expect(inspector).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(checkpoints).toHaveValue("0"); await expect(table.getByRole("row")).toHaveCount(4);
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(inspector).toHaveCount(0); await expect(panel.getByLabel("Requests JSONL")).toBeFocused();
  expect(network).toEqual([]);
});
