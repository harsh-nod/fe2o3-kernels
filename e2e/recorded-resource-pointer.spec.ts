import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

// Original, unchanged lines from a real CPU capture. No generated positive DTOs.
function excerpt(side: "requests" | "responses") {
  const ids = [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21];
  const lines = readFileSync(resolve(`examples/resource-query-v6/debug-${side}.jsonl`), "utf8")
    .trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
  if (lines.length !== ids.length) throw new Error("Pointer retained-pair roster changed.");
  return Buffer.from(lines.join("\n") + "\n");
}

test("current SSA pointer selects retained bytes locally and resets across checkpoint and file replacement", async ({ page }, testInfo) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  // Finish loading the lazy importer before observing its local-only actions.
  await expect(panel).toBeVisible();
  const network: string[] = []; page.on("request", request => network.push(request.method() + " " + request.url()));
  for (const side of ["requests", "responses"] as const) {
    await panel.getByLabel(side === "requests" ? "Requests JSONL" : "Responses JSONL").setInputFiles({
      name: `${side}.jsonl`, mimeType: "application/x-ndjson", buffer: excerpt(side),
    });
  }
  await panel.getByRole("button", { name: "Import local recording" }).click();
  const action = panel.getByRole("button", { name: "Show retained byte for SSA %12, function 0, frame 1" });
  await expect(action).toBeVisible(); await action.focus(); await action.press("Enter");
  const navigation = panel.getByRole("region", { name: "Pointer retained-memory navigation" });
  await expect(navigation).toHaveAttribute("data-state", "ready");
  await expect(navigation).toContainText("Retained request 11,");
  const grid = panel.getByRole("group", { name: "Captured memory cells" });
  const first = grid.getByRole("button", { name: /^Byte offset 0,/u });
  await expect(first).toHaveAttribute("aria-pressed", "true"); await expect(first).toBeFocused();
  await first.press("ArrowRight"); await expect(grid.getByRole("button", { name: /^Byte offset 1,/u })).toBeFocused();
  await action.click(); await expect(first).toBeFocused();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    for (const element of [navigation, action, panel.getByRole("table", { name: "Selected checkpoint SSA values" })]) {
      const widths = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    }
    await navigation.screenshot({ path: testInfo.outputPath(`pointer-navigation-${theme}.png`) });
  }
  for (const [index, request] of [["1", 15], ["2", 21]] as const) {
    await panel.getByRole("combobox", { name: "Imported checkpoint" }).selectOption(index);
    await expect(navigation).toHaveCount(0);
    await action.click(); await expect(navigation).toContainText(`Retained request ${request},`);
    await expect(first).toBeFocused();
  }
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "replacement.jsonl", mimeType: "application/x-ndjson", buffer: excerpt("responses") });
  await expect(navigation).toHaveCount(0); await expect(grid).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(action).toBeVisible(); await expect(navigation).toHaveCount(0);
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(action).toHaveCount(0); expect(network).toEqual([]);
});
