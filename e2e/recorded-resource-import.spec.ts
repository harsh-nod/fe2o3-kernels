import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator } from "@playwright/test";

// Whole original lines from the checked-in actual CPU recording; no invented positive responses.
const ids = [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21];
function excerpt(name: string): Buffer {
  const raw = readFileSync(resolve("examples/resource-query-v6", name), "utf8");
  const lines = raw.trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
  if (lines.length !== ids.length) throw new Error("Exact retained request/response roster changed.");
  return Buffer.from(lines.join("\n") + "\n");
}
const requests = excerpt("debug-requests.jsonl"), responses = excerpt("debug-responses.jsonl");
async function choose(panel: Locator, responseBytes = responses) {
  await panel.getByLabel("Requests JSONL").setInputFiles({ name: "requests.jsonl", mimeType: "application/x-ndjson", buffer: requests });
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "responses.jsonl", mimeType: "application/x-ndjson", buffer: responseBytes });
}

test("local recorded resource import supports keyboard, checkpoints, raw pairs and reset without network activity", async ({ page }, testInfo) => {
  await page.goto("./#/debugger/source-isa-agent");
  const open = page.getByRole("button", { name: "Open local resource recording" });
  await open.focus(); await open.press("Enter");
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Import local recording" })).toBeDisabled();
  const network: string[] = [];
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await choose(panel);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  const checkpoint = panel.getByRole("combobox", { name: "Imported checkpoint" });
  await expect(checkpoint).toHaveValue("0");
  await expect(panel.getByText(/producer, source, bundle, target and execution claims are not authenticated/u)).toBeVisible();
  await expect(panel.getByRole("table", { name: "Captured allocation inventory" })).toBeVisible();
  const cells = panel.getByRole("group", { name: "Captured memory cells" }).getByRole("button");
  await expect(cells).toHaveCount(24);
  await expect(cells.first()).toHaveAccessibleName("Byte offset 0, 1 byte, 0xd5, initialized");
  await cells.first().focus(); await cells.first().press("ArrowRight");
  await expect(cells.nth(1)).toBeFocused();
  await panel.getByRole("combobox", { name: "Recorded resource page" }).selectOption("2");
  await expect(panel.getByRole("table", { name: "Captured memory access occurrences" })).toContainText("write committed");
  await panel.getByRole("button", { name: "Show original paired lines" }).click();
  await panel.getByRole("combobox", { name: "Original pair" }).selectOption("5");
  await expect(panel.getByLabel("Original request line")).toHaveText(requests.toString("utf8").split("\n")[5] + "\n");
  expect(await panel.locator("*").count()).toBeLessThan(1600);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await panel.screenshot({ path: testInfo.outputPath("local-resource-import-" + theme + ".png") });
  }
  await checkpoint.selectOption("1");
  await expect(panel.getByRole("combobox", { name: "Recorded resource page" })).toHaveValue("0");
  await expect(cells.first()).toHaveAccessibleName("Byte offset 0, 1 byte, 0xa5, initialized");
  await checkpoint.selectOption("2");
  await expect(panel.getByText(/request 18, event 33, revision 6/u)).toBeVisible();
  await expect(panel.getByRole("combobox", { name: "Recorded resource page" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(panel.getByRole("table")).toHaveCount(0);
  await expect(panel.getByLabel("Requests JSONL")).toBeFocused();
  await expect(panel.getByLabel("Requests JSONL")).toHaveValue("");
  await expect(panel.getByLabel("Responses JSONL")).toHaveValue("");
  expect(network).toEqual([]);
});

test("a replacement failure never leaves old captured bytes and reopening starts empty", async ({ page }) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  await choose(panel); await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(panel.getByRole("combobox", { name: "Imported checkpoint" })).toBeVisible();
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "unpaired.jsonl", mimeType: "application/x-ndjson", buffer: Buffer.from("{}\n") });
  await expect(panel.getByRole("table")).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(panel.getByRole("alert")).toContainText("unpaired");
  await expect(panel.getByRole("group", { name: "Captured memory cells" })).toHaveCount(0);
  await page.getByRole("button", { name: "Close local resource recording" }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  await expect(panel.getByLabel("Requests JSONL")).toHaveValue("");
  await expect(panel.getByRole("table")).toHaveCount(0);
});

test("pending browser file reads are cancelled and cannot install late observations", async ({ page }) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  await choose(panel);
  // Delay only the browser read callback; retained positive bytes remain unchanged.
  await page.evaluate(() => {
    const original = FileReader.prototype.readAsArrayBuffer;
    FileReader.prototype.readAsArrayBuffer = function (blob: Blob) {
      setTimeout(() => original.call(this, blob), 500);
    };
  });
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(panel.getByRole("button", { name: "Cancel import" })).toBeEnabled();
  await panel.getByRole("button", { name: "Cancel import" }).click();
  await expect(panel.getByText(/Import cancelled/u)).toBeVisible();
  await page.waitForTimeout(600); // Bounded delayed-read negative, not a latency measurement.
  await expect(panel.getByRole("table")).toHaveCount(0);
  await expect(panel.getByRole("combobox", { name: "Imported checkpoint" })).toHaveCount(0);
});
