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
  await page.getByRole("button", { name: "Open retained memory reference lab" }).click();
  const guide = page.getByRole("region", { name: "Guided retained-memory reference lab" });
  await expect(guide).toBeVisible();
  const lesson = guide.getByRole("region", { name: exercise.title });
  const prepare = lesson.getByText("Prepare " + exercise.id + " excerpt and check byte identities");
  await prepare.focus(); await prepare.press("Enter");
  await expect(lesson.getByLabel(exercise.id + " excerpt commands")).toBeVisible();
  await expect(lesson.getByLabel(exercise.id + " excerpt byte identities")).toContainText(exercise.responseSha256);
  const answer = lesson.getByText("Check predictions: " + exercise.id);
  await expect(answer.locator("..")).not.toHaveAttribute("open");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const importer = page.getByRole("region", { name: "Local resource recording import" });
  await expect(importer.getByRole("button", { name: "Import local recording" })).toBeDisabled();
  const network: string[] = []; page.on("request", request => network.push(request.method() + " " + request.url()));
  for (const side of ["requests", "responses"] as const)
    await importer.getByLabel(side === "requests" ? "Requests JSONL" : "Responses JSONL").setInputFiles({
      name: exercise.id + "." + side + ".jsonl", mimeType: "application/x-ndjson", buffer: excerpt(exercise, side),
    });
  await importer.getByRole("button", { name: "Import local recording" }).click();
  await expect(importer).toContainText(exercise.requestSha256); await expect(importer).toContainText(exercise.responseSha256);
  const comparison = importer.getByRole("region", { name: "Retained memory checkpoint comparison" });
  await expect(comparison).toHaveAttribute("data-state", "idle");
  await expect(comparison.getByRole("combobox", { name: "Baseline retained memory window" })).toHaveValue("");
  return { guide, lesson, answer, importer, comparison, network };
}
async function inspect(page: Page, guide: Locator, lesson: Locator, info: TestInfo, id: string) {
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const outer = await guide.boundingBox(); if (!outer) throw Error("Guide bounds absent");
    for (const element of [lesson, lesson.getByLabel(id + " excerpt commands"), lesson.getByLabel(id + " excerpt byte identities"),
      lesson.getByLabel(id + " observation steps"), lesson.getByLabel(id + " expected observations")]) {
      const box = await element.boundingBox(); if (!box) throw Error("Lesson bounds absent");
      expect(box.x).toBeGreaterThanOrEqual(outer.x - 1); expect(box.x + box.width).toBeLessThanOrEqual(outer.x + outer.width + 1);
      const widths = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(widths.scroll, theme + " " + JSON.stringify(widths)).toBeLessThanOrEqual(widths.client + 1);
    }
    await lesson.screenshot({ path: info.outputPath("recorded-memory-lab-" + id + "-" + theme + ".png") });
  }
}

test("guided global exercise preserves explicit baseline and repeated event/revision", async ({ page }, info) => {
  const exercise = recordedMemoryExercises[0];
  const { guide, lesson, answer, importer, comparison, network } = await load(page, exercise);
  const baseline = comparison.getByRole("combobox", { name: "Baseline retained memory window" });
  await baseline.focus(); await baseline.press("ArrowDown"); await baseline.press("Enter");
  await expect(baseline).toHaveValue("15");
  await expect(comparison.getByRole("status")).toContainText("4 storage-byte differences; 0 initialization differences");
  await baseline.selectOption("21");
  await expect(comparison.getByRole("status")).toContainText("0 storage-byte differences; 0 initialization differences");
  await expect(comparison).toContainText("event 33, revision 4"); await expect(comparison).toContainText("event 33, revision 6");
  await importer.getByRole("combobox", { name: "Imported checkpoint" }).selectOption("1");
  await expect(baseline).toHaveValue("");
  await baseline.selectOption("11"); await expect(comparison).toHaveAttribute("data-state", "ready");
  await importer.getByLabel("Responses JSONL").setInputFiles({
    name: "same.responses.jsonl", mimeType: "application/x-ndjson", buffer: excerpt(exercise, "responses"),
  });
  await expect(comparison).toHaveCount(0);
  await importer.getByRole("button", { name: "Import local recording" }).click(); await expect(baseline).toHaveValue("");
  await answer.click(); await expect(lesson.getByLabel("global expected observations")).toContainText("4 storage-byte differences");
  await inspect(page, guide, lesson, info, "global");
  expect(network).toEqual([]);
});

test("guided LDS exercise explains initialization independently of raw bytes and color", async ({ page }, info) => {
  const { guide, lesson, answer, comparison, network } = await load(page, recordedMemoryExercises[1]);
  await comparison.getByRole("combobox", { name: "Baseline retained memory window" }).selectOption("17");
  await expect(comparison.getByRole("status")).toContainText("1 storage-byte differences; 4 initialization differences");
  await comparison.getByRole("combobox", { name: "Comparison cell size" }).selectOption("1");
  const cells = comparison.getByRole("group", { name: "Compared memory cells" }).getByRole("button");
  await expect(cells).toHaveCount(256);
  await cells.first().focus(); await page.keyboard.press("ArrowRight"); await expect(cells.nth(1)).toBeFocused();
  await expect(cells.nth(1)).toHaveAttribute("data-marker", "I");
  await expect(comparison.getByRole("table")).toContainText("Storage equal; initialization differs");
  await expect(comparison.getByRole("table")).toContainText("uninitialized storage; not a program value");
  await answer.click(); await expect(lesson.getByLabel("lds expected observations")).toContainText("not 252 meaningful zero-valued program bytes");
  await inspect(page, guide, lesson, info, "lds");
  expect(network).toEqual([]);
});

test("guided actual missing-memory exercise preserves unavailable and incompatible states", async ({ page }, info) => {
  const { guide, lesson, answer, importer, comparison, network } = await load(page, recordedMemoryExercises[2]);
  const checkpoint = importer.getByRole("combobox", { name: "Imported checkpoint" });
  const baseline = comparison.getByRole("combobox", { name: "Baseline retained memory window" });
  await checkpoint.selectOption("1"); await expect(baseline).toHaveValue("");
  await baseline.selectOption("89"); await expect(comparison).toHaveAttribute("data-state", "unavailable");
  await expect(comparison.getByRole("status")).toContainText("Baseline unavailable: not_represented; current unavailable: not_represented");
  await expect(comparison.getByRole("group", { name: "Compared memory cells" })).toHaveCount(0);
  await baseline.selectOption("81"); await expect(comparison).toHaveAttribute("data-state", "incompatible");
  await expect(comparison.getByRole("status")).toContainText("logical scope/mask, source/site");
  await checkpoint.selectOption("2"); await expect(baseline).toHaveValue("");
  await expect(importer.getByRole("combobox", { name: "Recorded memory window" })).toHaveValue("0");
  await baseline.selectOption("85"); await expect(comparison).toHaveAttribute("data-state", "incompatible");
  await expect(comparison.getByRole("status")).toContainText("same recorded generation-zero allocation");
  await importer.getByRole("combobox", { name: "Recorded memory window" }).selectOption("1");
  await expect(baseline).toHaveValue("");
  await baseline.selectOption("85"); await expect(comparison).toHaveAttribute("data-state", "unavailable");
  await answer.click(); await expect(lesson.getByLabel("scope expected observations")).toContainText("do not establish equality");
  await inspect(page, guide, lesson, info, "scope");
  expect(network).toEqual([]);
});
