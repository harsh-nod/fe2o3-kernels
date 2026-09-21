import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Download } from "@playwright/test";

function excerpt(kind: "global" | "lds", side: "requests" | "responses") {
  const ids = kind === "global" ? [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21] : [11, 12, 13, 14, 15, 16, 17, 18];
  const file = kind === "global" ? `examples/resource-query-v6/debug-${side}.jsonl` : `examples/source_lds_resource_v1.${side}.jsonl`;
  const lines = readFileSync(resolve(file), "utf8").trimEnd().split("\n").filter(line => ids.includes(JSON.parse(line).request_id));
  if (lines.length !== ids.length) throw new Error("Bookmark retained-pair roster changed.");
  return Buffer.from(lines.join("\n") + "\n");
}
async function downloadedBytes(download: Download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error("Actual bookmark download is unavailable.");
  const chunks: Buffer[] = []; let bytes = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.from(chunk); bytes += buffer.length;
    if (bytes > 16384) throw new Error("Bookmark download exceeds its bound.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

for (const kind of ["global", "lds"] as const) {
  test(`${kind} retained-view bookmark restores exact requests and resets unsaved presentation locally`, async ({ page }, testInfo) => {
    await page.goto("./#/debugger/source-isa-agent");
    await page.getByRole("button", { name: "Open local resource recording" }).click();
    const panel = page.getByRole("region", { name: "Local resource recording import" });
    await expect(panel).toBeVisible();
    const network: string[] = [];
    page.on("request", request => network.push(request.method() + " " + request.url()));
    async function importPair(selected: "global" | "lds") {
      for (const side of ["requests", "responses"] as const) {
        await panel.getByLabel(side === "requests" ? "Requests JSONL" : "Responses JSONL").setInputFiles({
          name: `${selected}.${side}.jsonl`, mimeType: "application/x-ndjson", buffer: excerpt(selected, side),
        });
      }
      await panel.getByRole("button", { name: "Import local recording" }).click();
      await expect(panel.getByRole("combobox", { name: "Imported checkpoint" })).toBeVisible();
    }
    await importPair(kind);
    const provenance = panel.getByLabel("Local recording byte provenance");
    const originalProvenance = await provenance.textContent();
    const pages = panel.getByRole("combobox", { name: "Recorded resource page" });
    const chosenPage = String((await pages.locator("option").count()) - 1);
    await pages.selectOption(chosenPage);
    const baselineId = kind === "global" ? "21" : "17";
    await panel.getByRole("combobox", { name: "Baseline retained memory window" }).selectOption(baselineId);
    await panel.getByRole("combobox", { name: "Hypothetical target for LDS model" }).selectOption("gfx942");
    await panel.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
    const interpretation = panel.getByRole("region", { name: "Selected dword interpretation" });
    await interpretation.getByRole("combobox", { name: "Value interpretation" }).selectOption("u32");
    await interpretation.getByRole("combobox", { name: "Interpretation byte order" }).selectOption("little");
    if (kind === "global") {
      await panel.getByRole("button", { name: "Show retained byte for SSA %12, function 0, frame 1" }).click();
    }
    const bookmark = panel.getByRole("region", { name: "Retained view bookmark" });
    const downloadPromise = page.waitForEvent("download");
    const save = bookmark.getByRole("button", { name: "Download view bookmark" });
    await save.focus(); await save.press("Enter");
    const bytes = await downloadedBytes(await downloadPromise);
    expect(bytes.length).toBeGreaterThan(0);
    // A reverse/repeated event is still a different revision and selection.
    await panel.getByRole("combobox", { name: "Imported checkpoint" }).selectOption(kind === "global" ? "2" : "1");
    await expect(panel.getByRole("combobox", { name: "Baseline retained memory window" })).toHaveValue("");
    await bookmark.getByLabel("View bookmark JSON").setInputFiles({ name: "retained-view.json", mimeType: "application/json", buffer: bytes });
    await bookmark.getByRole("button", { name: "Reopen view bookmark" }).click();
    await expect(panel.getByRole("combobox", { name: "Imported checkpoint" })).toHaveValue("0");
    await expect(pages).toHaveValue(chosenPage);
    await expect(panel.getByRole("combobox", { name: "Recorded memory window" })).toHaveValue("0");
    await expect(panel.getByRole("combobox", { name: "Baseline retained memory window" })).toHaveValue(baselineId);
    await expect(panel.getByRole("combobox", { name: "Hypothetical target for LDS model" })).toHaveValue("unknown");
    await expect(panel.getByRole("region", { name: "Pointer retained-memory navigation" })).toHaveCount(0);
    await expect(panel.getByRole("combobox", { name: "Memory cell size" })).toHaveValue("1");
    await panel.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
    await expect(interpretation.getByRole("combobox", { name: "Value interpretation" })).toHaveValue("raw");
    await expect(interpretation.getByRole("combobox", { name: "Interpretation byte order" })).toHaveValue("unknown");
    expect(await provenance.textContent()).toBe(originalProvenance);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await bookmark.evaluate(node => node.scrollIntoView({ block: "center" }));
      const widths = await bookmark.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
      await bookmark.screenshot({ path: testInfo.outputPath(`bookmark-${kind}-${theme}.png`) });
    }
    // Exact file-byte identities bind the saved selection. No checkpoint fallback.
    await importPair(kind === "global" ? "lds" : "global");
    const before = await panel.getByRole("combobox", { name: "Imported checkpoint" }).inputValue();
    await bookmark.getByLabel("View bookmark JSON").setInputFiles({ name: "other-recording.json", mimeType: "application/json", buffer: bytes });
    await bookmark.getByRole("button", { name: "Reopen view bookmark" }).click();
    await expect(bookmark.getByRole("alert")).toBeVisible();
    await expect(panel.getByRole("combobox", { name: "Imported checkpoint" })).toHaveValue(before);
    await expect(panel.getByRole("combobox", { name: "Baseline retained memory window" })).toHaveValue("");
    expect(network).toEqual([]);
  });
}

