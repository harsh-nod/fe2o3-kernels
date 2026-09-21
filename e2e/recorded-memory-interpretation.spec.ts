import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { recordedMemoryExercises, type RecordedMemoryExercise } from "../src/content/recorded-memory-tutorial";

function excerpt(exercise: RecordedMemoryExercise, side: "requests" | "responses") {
  const lines = readFileSync(resolve(exercise[side]), "utf8").split("\n");
  if (lines.pop() !== "") throw Error("Original final LF missing");
  const selected = lines.filter(line => (exercise.ids as readonly number[]).includes(JSON.parse(line).request_id));
  if (selected.length !== exercise.ids.length) throw Error("Original excerpt roster changed");
  return Buffer.from(selected.join("\n") + "\n");
}
async function load(page: Page, exercise: RecordedMemoryExercise) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const importer = page.getByRole("region", { name: "Local resource recording import" });
  for (const side of ["requests", "responses"] as const) {
    await importer.getByLabel(side === "requests" ? "Requests JSONL" : "Responses JSONL").setInputFiles({
      name: exercise.id + "." + side + ".jsonl", mimeType: "application/x-ndjson", buffer: excerpt(exercise, side),
    });
  }
  await importer.getByRole("button", { name: "Import local recording" }).click();
  await expect(importer).toContainText(exercise.requestSha256);
  await expect(importer).toContainText(exercise.responseSha256);
  const memory = importer.getByRole("region", { name: "Caller-supplied captured bytes" });
  const inspector = memory.getByRole("region", { name: "Selected dword interpretation" });
  await expect(inspector).toBeVisible();
  // Observe only interactions with the fully loaded local feature, not the route's lazy module load.
  const network: string[] = [];
  page.on("request", request => network.push(request.method() + " " + request.url()));
  return { importer, memory, inspector, network };
}
async function choose(memory: Locator, inspector: Locator) {
  await memory.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  const format = inspector.getByRole("combobox", { name: "Value interpretation" });
  await format.focus(); await format.press("ArrowDown"); await format.press("Enter");
  await expect(format).toHaveValue("u32");
  await expect(inspector.getByLabel("Memory interpretation status")).toHaveAttribute("data-state", "needs-order");
  const order = inspector.getByRole("combobox", { name: "Interpretation byte order" });
  await order.focus(); await order.press("ArrowDown"); await order.press("Enter");
  await expect(order).toHaveValue("little");
}
async function inspect(page: Page, inspector: Locator, info: TestInfo, id: string) {
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const outer = await inspector.boundingBox();
    if (!outer) throw Error("Inspector bounds absent");
    const viewport = page.viewportSize();
    if (!viewport) throw Error("Viewport absent");
    expect(outer.x).toBeGreaterThanOrEqual(-1);
    expect(outer.x + outer.width).toBeLessThanOrEqual(viewport.width + 1);
    const elements = [inspector, ...await inspector.locator("p, label, select, dl, dl > div, dt, dd").all()];
    for (const element of elements) {
      const box = await element.boundingBox(); if (!box) throw Error("Inspector child bounds absent");
      expect(box.x).toBeGreaterThanOrEqual(outer.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(outer.x + outer.width + 1);
      const widths = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(widths.scroll, theme + " " + await element.evaluate(node => node.tagName) + " " + JSON.stringify(widths))
        .toBeLessThanOrEqual(widths.client + 1);
    }
    await inspector.screenshot({ path: info.outputPath("memory-interpretation-" + id + "-" + theme + ".png") });
  }
}

test("selected recorded dword requires explicit choices and clears them on checkpoint/import replacement", async ({ page }, info) => {
  const exercise = recordedMemoryExercises[0];
  const { importer, memory, inspector, network } = await load(page, exercise);
  const storage = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const format = inspector.getByRole("combobox", { name: "Value interpretation" });
  const order = inspector.getByRole("combobox", { name: "Interpretation byte order" });
  await expect(format).toHaveValue("raw"); await expect(order).toHaveValue("unknown");
  await expect(inspector.getByLabel("Interpreted scalar")).toHaveCount(0);
  await choose(memory, inspector);
  await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("469");
  await expect(inspector).toContainText("0xd5010000"); await expect(inspector).toContainText("0x000001d5");
  await inspect(page, inspector, info, "global");
  await order.selectOption("big"); await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("3573612544");
  await order.selectOption("unknown"); await expect(inspector.getByLabel("Interpreted scalar")).toHaveCount(0);
  await order.selectOption("little");
  const cells = memory.getByRole("group", { name: "Captured memory cells" }).getByRole("button");
  await expect(cells).toHaveCount(6);
  await cells.first().focus(); await page.keyboard.press("ArrowRight"); await expect(cells.nth(1)).toBeFocused();
  await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("2779096485");
  await page.keyboard.press("Home"); await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("469");
  await importer.getByRole("combobox", { name: "Imported checkpoint" }).selectOption("2");
  await expect(format).toHaveValue("raw"); await expect(order).toHaveValue("unknown");
  await expect(inspector.getByLabel("Interpreted scalar")).toHaveCount(0);
  await choose(memory, inspector); await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("469");
  await importer.getByLabel("Responses JSONL").setInputFiles({
    name: "same.responses.jsonl", mimeType: "application/x-ndjson", buffer: excerpt(exercise, "responses"),
  });
  await expect(inspector).toHaveCount(0);
  await importer.getByRole("button", { name: "Import local recording" }).click();
  await expect(format).toHaveValue("raw"); await expect(order).toHaveValue("unknown");
  await expect(importer).toContainText(exercise.requestSha256); await expect(importer).toContainText(exercise.responseSha256);
  expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))).toBe(storage);
  expect(network).toEqual([]);
});

test("selected LDS dword does not turn uninitialized zero storage into a scalar", async ({ page }, info) => {
  const { importer, memory, inspector, network } = await load(page, recordedMemoryExercises[1]);
  await choose(memory, inspector); await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("2");
  await inspect(page, inspector, info, "lds");
  const cells = memory.getByRole("group", { name: "Captured memory cells" }).getByRole("button");
  await expect(cells).toHaveCount(64);
  await cells.first().focus(); await page.keyboard.press("ArrowRight"); await expect(cells.nth(1)).toBeFocused();
  await expect(inspector.getByLabel("Memory interpretation status")).toHaveAttribute("data-state", "uninitialized");
  await expect(inspector).toContainText("0/4 selected bytes are initialized");
  await expect(inspector.getByLabel("Interpreted scalar")).toHaveCount(0);
  await expect(cells.nth(1)).toContainText("00000000"); await expect(cells.nth(1)).toContainText("U");
  await page.keyboard.press("Home"); await expect(inspector.getByLabel("Interpreted scalar")).toHaveText("2");
  await importer.getByRole("combobox", { name: "Imported checkpoint" }).selectOption("1");
  await expect(inspector.getByRole("combobox", { name: "Value interpretation" })).toHaveValue("raw");
  await expect(inspector.getByRole("combobox", { name: "Interpretation byte order" })).toHaveValue("unknown");
  await memory.getByRole("combobox", { name: "Memory cell size" }).selectOption("4");
  await inspector.getByRole("combobox", { name: "Value interpretation" }).selectOption("u32");
  await inspector.getByRole("combobox", { name: "Interpretation byte order" }).selectOption("little");
  await expect(inspector.getByLabel("Memory interpretation status")).toHaveAttribute("data-state", "uninitialized");
  await expect(inspector.getByLabel("Interpreted scalar")).toHaveCount(0);
  await inspector.screenshot({ path: info.outputPath("memory-interpretation-uninitialized.png") });
  expect(network).toEqual([]);
});

