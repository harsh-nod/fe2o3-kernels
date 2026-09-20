import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

// Whole unchanged lines from the actual CPU producer, not generated responses.
function excerpt(side: "requests" | "responses") {
  const raw = readFileSync(resolve("examples/source_lds_resource_v1." + side + ".jsonl"), "utf8");
  const lines = raw.trimEnd().split("\n").filter(line => {
    const id: number = JSON.parse(line).request_id;
    return id >= 11 && id <= 18;
  });
  if (lines.length !== 8) throw new Error("Exact original LDS excerpt roster changed.");
  return Buffer.from(lines.join("\n") + "\n");
}
const requests = excerpt("requests"), responses = excerpt("responses");

test("imported LDS access links storage and a separate keyboard-selected hypothetical model", async ({ page }, testInfo) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  // Opening the lazy panel loads its application modules. Observe network
  // effects of file import only after the unloaded panel has become ready.
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Import local recording" })).toBeDisabled();
  const network: string[] = [];
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await panel.getByLabel("Requests JSONL").setInputFiles({ name: "lds-requests.jsonl", mimeType: "application/x-ndjson", buffer: requests });
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "lds-responses.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await panel.getByRole("button", { name: "Import local recording" }).click();
  const target = panel.getByRole("combobox", { name: "Hypothetical target for LDS model" });
  await expect(target).toHaveValue("unknown");
  await expect(target).toHaveAccessibleDescription(/User hypothesis \/ unverified/u);
  const pages = panel.getByRole("combobox", { name: "Recorded resource page" });
  await pages.selectOption("1");
  const select = panel.getByRole("button", { name: "Select retained access event 12" });
  await select.focus(); await select.press("Enter");
  const overlay = panel.getByTestId("historical-access-overlay");
  await expect(overlay).toHaveAttribute("data-state", "ready");
  await expect(overlay).toContainText("Historical event 12: write committed [0, 4)");
  await expect(overlay).toContainText("cursor 13, revision 5");
  const cells = panel.getByRole("group", { name: "Captured memory cells" });
  await expect(cells.getByRole("button")).toHaveCount(256);
  await expect(cells.locator('[data-access-marker="W"]')).toHaveCount(4);
  await expect(cells.getByRole("button").first()).toHaveAccessibleName("Byte offset 0, 1 byte, 0x02, initialized");
  const model = panel.getByTestId("selected-lds-bank-analysis");
  const openModel = async () => {
    if (await model.getAttribute("open") === null) await model.locator("summary").click();
  };
  await openModel();
  await expect(model.getByRole("list")).toHaveCount(0);
  await target.focus(); await target.press("ArrowDown"); await target.press("Enter");
  await expect(target).toHaveValue("gfx942");
  await openModel();
  await expect(model.getByRole("listitem")).toHaveCount(32);
  await expect(model).toContainText("user hypothesis / unverified; not a target recorded by this capture");
  await expect(model).toContainText("Original caller-owned target remains unavailable");
  await model.getByRole("textbox", { name: /Assumed allocation-base residue/u }).fill("1");
  await expect(model.getByRole("listitem").nth(0)).toContainText("1 words · 3 bytes");
  await expect(model.getByRole("listitem").nth(1)).toContainText("1 words · 1 bytes");
  await target.selectOption("gfx950"); await openModel();
  await expect(model.getByRole("textbox")).toHaveValue("0");
  await expect(model.getByRole("listitem")).toHaveCount(64);
  await expect(overlay).toHaveAttribute("data-state", "ready");
  await expect(cells.getByRole("button").first()).toHaveAccessibleName("Byte offset 0, 1 byte, 0x02, initialized");
  await panel.getByRole("button", { name: "Show original paired lines" }).click();
  await panel.getByRole("combobox", { name: "Original pair" }).selectOption("3");
  await expect(panel.getByLabel("Original response line")).toHaveText(responses.toString("utf8").split("\n")[3] + "\n");
  expect(await panel.locator("*").count()).toBeLessThan(3000);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await panel.screenshot({ path: testInfo.outputPath("imported-lds-selection-" + theme + ".png") });
  }
  await pages.selectOption("2"); await openModel();
  await expect(overlay).toHaveAttribute("data-state", "no_selection");
  await expect(overlay).toContainText("More backend pages exist");
  await expect(cells.locator("[data-access-marker]")).toHaveCount(0);
  await expect(model.getByRole("list")).toHaveCount(0);
  await panel.getByRole("combobox", { name: "Imported checkpoint" }).selectOption("1");
  await expect(target).toHaveValue("unknown");
  await expect(overlay).toContainText("cursor 11, revision 6");
  await expect(cells.getByRole("button").first()).toHaveAccessibleName("Byte offset 0, 1 byte, 0x00, uninitialized");
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "same-bytes.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await expect(model).toHaveCount(0); await expect(overlay).toHaveCount(0); await expect(target).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
  await expect(target).toHaveValue("unknown"); await expect(pages).toHaveValue("0");
  await expect(overlay).toHaveCount(0);
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(target).toHaveCount(0); await expect(cells).toHaveCount(0);
  await expect(panel.getByLabel("Requests JSONL")).toBeFocused();
  expect(network).toEqual([]);
});
