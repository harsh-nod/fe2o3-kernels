import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { parseProgramJson } from "../src/content/ordered-program-observation.mjs";
import type { MutableResourceControl } from "../tests/fixtures/recorded-resource-import";

// Actual retained positive captures only. Missing files or changed byte pins
// fail at load time, never skip or fall back to synthetic helper responses.
function capture(directory: string, prefix: string) {
  const read = (name: string) => {
    let bytes: Buffer;
    try { bytes = readFileSync(resolve(directory, name)); }
    catch { throw new Error("Missing actual retained recording: " + directory + "/" + name); }
    if (!bytes.length || bytes.length > 256 * 1024) throw new Error("Retained fixture byte limit: " + name);
    return bytes;
  };
  const provenance = parseProgramJson(read("provenance.json").toString("utf8"), 256 * 1024) as MutableResourceControl;
  const pinned = (name: string) => {
    const bytes = read(name), pins = provenance.retained_files?.filter((pin: MutableResourceControl) => pin.path === name);
    if (!Array.isArray(pins) || pins.length !== 1 || pins[0].bytes !== bytes.length ||
        pins[0].sha256 !== createHash("sha256").update(bytes).digest("hex")) {
      throw new Error("Retained fixture differs from its recorded provenance: " + name);
    }
    return bytes;
  };
  const receipt = parseProgramJson(pinned("receipt.json").toString("utf8"), 256 * 1024) as MutableResourceControl;
  const excerpt = (side: "requests" | "responses") => {
    const name = prefix + "." + side + ".jsonl", bytes = pinned(name);
    const pins = receipt.excerpts?.filter((pin: MutableResourceControl) => pin.path === name);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!Array.isArray(pins) || pins.length !== 1 || pins[0].bytes !== bytes.length ||
        pins[0].sha256 !== createHash("sha256").update(bytes).digest("hex") ||
        !text.endsWith("\n") || text.includes("\r") || text.charCodeAt(0) === 0xfeff || Buffer.byteLength(text) !== bytes.length) {
      throw new Error("Retained excerpt differs from the actual capture receipt: " + name);
    }
    return { bytes, lines: text.slice(0, -1).split("\n") };
  };
  const requests = excerpt("requests"), responses = excerpt("responses");
  const requestRows = requests.lines.map(line => parseProgramJson(line, 65536) as MutableResourceControl);
  const responseRows = responses.lines.map(line => parseProgramJson(line, 65536) as MutableResourceControl);
  if (requestRows.length !== responseRows.length || requestRows.length > 128 || requestRows.some((row, index) =>
    row.request_id !== responseRows[index].request_id || row.operation !== responseRows[index].operation || responseRows[index].status !== "ok")) {
    throw new Error("Expected bounded, exact paired successful capture lines.");
  }
  return { receipt, requests, responses, requestRows, responseRows };
}
const actual = capture("examples/helper-source-variable-resource-v2", "resource-helper-source-values");
const root = capture("examples/source-variable-resource-v2", "resource-source-values");
const { receipt } = actual;
if (receipt.status !== "passed" || receipt.purpose !== "existing-public-ordinary-helper-source-variable-resource-qualification" ||
    receipt.stack_profile !== "exact_two_frames_selected_current_helper_frame2_all_frame_ssa" ||
    receipt.source_variable_paging !== "complete_limit1" || receipt.raw_line_preservation !== true ||
    receipt.source_authentication !== false || receipt.hardware_observed !== false || receipt.performance_prediction !== false ||
    receipt.source_to_ssa_mapping !== "not_supplied" || receipt.dynamic_helper_activation !== "not_represented" ||
    receipt.allocation_reuse !== "not_represented" || !Array.isArray(receipt.checkpoints) || receipt.checkpoints.length !== 3) {
  throw new Error("Expected the separately qualified ordinary-helper capture contract.");
}
const groups = (receipt.checkpoints as MutableResourceControl[]).map(checkpoint => {
  const index = actual.requestRows.findIndex(row => row.request_id === checkpoint.control_request_id);
  if (index < 0 || actual.requestRows[index].operation !== "step") throw new Error("Actual checkpoint control pair is missing.");
  const following = actual.requestRows.findIndex((row, position) => position > index && row.operation === "step");
  const end = following < 0 ? actual.requestRows.length : following;
  const positions = Array.from({ length: end - index - 1 }, (_, offset) => index + offset + 1);
  const stacks = positions.filter(position => actual.requestRows[position].operation === "inspect_stack");
  const pages = positions.filter(position => actual.requestRows[position].operation === "inspect_source_variables");
  const memories = positions.filter(position => actual.requestRows[position].operation === "read_memory");
  if (stacks.length !== 1 || memories.length !== 1 || pages.length < 2 || pages.length > 32 ||
      pages.length !== checkpoint.source_variable_request_ids.length || pages.some((position, page) =>
        actual.requestRows[position].request_id !== checkpoint.source_variable_request_ids[page])) {
    throw new Error("Actual helper group must retain its complete stack/source/memory roster.");
  }
  return { checkpoint, index, stackIndex: stacks[0], pageIndices: pages,
    control: actual.responseRows[index], stack: actual.responseRows[stacks[0]],
    values: actual.responseRows[index].result.snapshot.snapshot.values as MutableResourceControl[],
    sourceValues: pages.flatMap(position => actual.responseRows[position].values as MutableResourceControl[]),
    memory: actual.responseRows[memories[0]].result.memory,
  };
});
const [forward, reverse, repeat] = groups;
const cursor = (group: typeof forward) => group.checkpoint.checkpoint_anchor.cursor;
if (cursor(reverse).event_sequence >= cursor(forward).event_sequence ||
    cursor(repeat).event_sequence !== cursor(forward).event_sequence ||
    cursor(reverse).state_revision !== cursor(forward).state_revision + 1 ||
    cursor(repeat).state_revision !== cursor(reverse).state_revision + 1) {
  throw new Error("Actual helper event/revision sequence is not forward/reverse/repeat.");
}
async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local resource recording" }).click();
  const panel = page.getByRole("region", { name: "Local resource recording import" });
  // Finish lazy loading before checking read-only import side effects.
  await expect(panel.getByLabel("Requests JSONL")).toBeVisible();
  return panel;
}
async function upload(panel: Locator, requests = actual.requests.bytes, responses = actual.responses.bytes) {
  await panel.getByLabel("Requests JSONL").setInputFiles({ name: "retained-requests.jsonl", mimeType: "application/x-ndjson", buffer: requests });
  await panel.getByLabel("Responses JSONL").setInputFiles({ name: "retained-responses.jsonl", mimeType: "application/x-ndjson", buffer: responses });
  await expect(panel.getByRole("region", { name: "Imported checkpoint source variables" })).toHaveCount(0);
  await expect(panel.getByRole("region", { name: "Imported checkpoint SSA and source" })).toHaveCount(0);
  await panel.getByRole("button", { name: "Import local recording" }).click();
}
const storage = (page: Page) => page.evaluate(() => JSON.stringify({
  local: Object.entries(localStorage), session: Object.entries(sessionStorage),
}));
const frameText = (table: Locator, frame: number) => table.locator("tbody tr").evaluateAll((rows, selectedFrame) => rows
  .filter(row => row.querySelector("th[scope=row]")?.textContent?.match(/Frame\s+(\d+)/u)?.[1] === String(selectedFrame))
  .map(row => row.textContent ?? ""), frame);

test("actual helper source selection retains both SSA frames, truthful reverse state, raw lines and read-only mobile presentation", async ({ page }, testInfo) => {
  const panel = await open(page), network: string[] = [], storageBefore = await storage(page);
  page.on("request", request => network.push(request.method() + " " + request.url()));
  await upload(panel);
  const source = panel.getByRole("region", { name: "Imported checkpoint source variables" });
  const ssa = panel.getByRole("region", { name: "Imported checkpoint SSA and source" });
  const sourceTable = source.getByRole("table", { name: "Selected checkpoint source variables" });
  const ssaTable = ssa.getByRole("table", { name: "Selected checkpoint SSA values" });
  const cells = panel.getByRole("group", { name: "Captured memory cells" }).getByRole("button");
  await expect(source).toHaveAttribute("data-state", "ready"); await expect(ssa).toHaveAttribute("data-state", "ready");
  const forwardSource = await sourceTable.textContent(), forwardCaller = await frameText(ssaTable, 1);
  const forwardHelper = await frameText(ssaTable, 2), forwardWhole = await ssaTable.textContent();
  const forwardMemory = await cells.allTextContents();
  expect(forwardCaller.length).toBeGreaterThan(0); expect(forwardHelper.length).toBeGreaterThan(0);
  await expect(source).toContainText("Caller-supplied / unverified");
  await expect(source).toContainText("Matching values or names are not a source-to-SSA mapping");
  await expect(source).toContainText("not identical to the unframed checkpoint anchor");
  await expect(source).toContainText("Legacy occurrence 1 is not a dynamic helper activation");
  await expect(source.locator("button,input,select,textarea,[contenteditable=true]")).toHaveCount(0);
  const summary = source.getByText("Recorded source-variable selection and identity", { exact: true });
  await summary.focus(); await summary.press("Enter");
  await expect(source).toContainText("2 frames; selected current frame 2");
  await expect(source).toContainText("The separate SSA table retains all frames");
  const checkpoints = panel.getByRole("combobox", { name: "Imported checkpoint" });
  for (const [index, group] of groups.entries()) {
    await checkpoints.selectOption(String(index));
    const selected = cursor(group), frames = group.stack.result.frames as MutableResourceControl[];
    await expect(source.getByTestId("source-values-anchor")).toContainText(`event ${selected.event_sequence}, revision ${selected.state_revision}`);
    await expect(ssa.getByTestId("checkpoint-values-anchor")).toContainText(`event ${selected.event_sequence}, revision ${selected.state_revision}`);
    await expect(source.getByTestId("source-values-anchor")).toContainText("source-variable frame 2, legacy occurrence 1");
    await expect(sourceTable.locator("tbody tr")).toHaveCount(group.sourceValues.length);
    await expect(ssaTable.locator("tbody tr")).toHaveCount(group.values.length);
    expect(await frameText(ssaTable, 1)).toHaveLength(frames[0].values.value_count);
    expect(await frameText(ssaTable, 2)).toHaveLength(frames[1].values.value_count);
    expect(await frameText(ssaTable, 1)).toEqual(forwardCaller);
    if (index === 1) expect(await frameText(ssaTable, 2)).not.toEqual(forwardHelper);
    if (index === 2) expect(await ssaTable.textContent()).toBe(forwardWhole);
    expect(await sourceTable.textContent()).toBe(forwardSource);
    await expect(cells).toHaveCount(group.memory.returned_bytes);
    expect(await cells.allTextContents()).toEqual(forwardMemory);
    for (const value of group.sourceValues) {
      await expect(sourceTable).toContainText(value.name);
      const availability = value.availability.value;
      if (availability?.status === "captured") await expect(sourceTable).toContainText(availability.value.bits);
      if (availability?.status === "unavailable") await expect(sourceTable).toContainText(availability.reason);
    }
  }
  await expect(sourceTable).toContainText("Raw bits only; floating-point decoding is not inferred");
  if (testInfo.project.name === "mobile") {
    const row = sourceTable.locator("tbody tr").first(), rowBox = await row.boundingBox(), cellBox = await row.locator("td").first().boundingBox();
    if (!rowBox || !cellBox) throw new Error("Selected helper row has no readable bounds.");
    expect(cellBox.width).toBeGreaterThan(rowBox.width * .9);
    for (const label of ["Scope / generation", "Type / availability", "Retained representation / interpretation"]) {
      await expect(row.getByText(label, { exact: true })).toBeVisible();
    }
  }
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const bounds = await panel.boundingBox(); if (!bounds) throw new Error("Helper panel has no bounds.");
    for (const element of [source, sourceTable]) {
      const box = await element.boundingBox(); if (!box) throw new Error("Helper view has no visible bounds.");
      expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1); expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      const width = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
    }
    await source.screenshot({ path: testInfo.outputPath("helper-source-values-" + theme + ".png") });
  }
  await panel.getByRole("button", { name: "Show original paired lines" }).click();
  for (const index of [repeat.stackIndex, repeat.pageIndices[0]]) {
    await panel.getByRole("combobox", { name: "Original pair" }).selectOption(String(index));
    expect(await panel.getByLabel("Original request line").textContent()).toBe(actual.requests.lines[index] + "\n");
    expect(await panel.getByLabel("Original response line").textContent()).toBe(actual.responses.lines[index] + "\n");
  }
  await panel.getByRole("button", { name: "Reset local recording" }).click();
  await expect(source).toHaveCount(0); await expect(ssa).toHaveCount(0);
  await expect(panel.getByLabel("Requests JSONL")).toBeFocused();
  expect(network).toEqual([]); expect(await storage(page)).toBe(storageBefore);
});

test("replacing the actual helper capture preserves the root-only profile and source-absent resource format", async ({ page }) => {
  const panel = await open(page), source = panel.getByRole("region", { name: "Imported checkpoint source variables" });
  await upload(panel); await expect(source.getByTestId("source-values-anchor")).toContainText("source-variable frame 2");
  await upload(panel, root.requests.bytes, root.responses.bytes);
  await expect(source).toHaveAttribute("data-state", "ready");
  await expect(source.getByTestId("source-values-anchor")).toContainText("source-variable frame 1");
  // Original successful root lines selected without source-query groups, not
  // new producer observations or synthetic positive response fields.
  const keep = root.requestRows.map(row => !["inspect_stack", "inspect_source_variables"].includes(row.operation));
  await upload(panel, Buffer.from(root.requests.lines.filter((_, index) => keep[index]).join("\n") + "\n"),
    Buffer.from(root.responses.lines.filter((_, index) => keep[index]).join("\n") + "\n"));
  await expect(source).toHaveAttribute("data-state", "unavailable");
  await expect(source.getByRole("table")).toHaveCount(0);
  await expect(source.getByRole("status")).toContainText("No source-variable query was retained");
  await expect(panel.getByRole("table", { name: "Selected checkpoint SSA values" })).toBeVisible();
  await expect(panel.getByRole("group", { name: "Captured memory cells" })).toBeVisible();
});

// Explicitly synthetic rejection controls, never additional producer evidence.
function syntheticJson(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return "[" + value.map(syntheticJson).join(",") + "]";
  if (value !== null && typeof value === "object") return "{" + Object.entries(value)
    .map(([key, entry]) => JSON.stringify(key) + ":" + syntheticJson(entry)).join(",") + "}";
  return JSON.stringify(value)!;
}
function mutate(side: "requests" | "responses", index: number, edit: (row: MutableResourceControl) => void) {
  return Buffer.from(actual[side].lines.map((line, position) => {
    if (position !== index) return line;
    const value = parseProgramJson(line, 65536) as MutableResourceControl; edit(value); return syntheticJson(value);
  }).join("\n") + "\n");
}
test("incomplete, wrong-frame, stale and incomplete-caller replacements clear previously visible actual helper tables", async ({ page }) => {
  const panel = await open(page), firstPage = forward.pageIndices[0], lastPage = forward.pageIndices.at(-1)!;
  const source = panel.getByRole("region", { name: "Imported checkpoint source variables" });
  const mutations: [Buffer, Buffer, string][] = [
    [Buffer.from(actual.requests.lines.filter((_, index) => index !== lastPage).join("\n") + "\n"),
      Buffer.from(actual.responses.lines.filter((_, index) => index !== lastPage).join("\n") + "\n"), "source_values_refused"],
    [mutate("requests", firstPage, row => { row.frame = 1; }), actual.responses.bytes, "source_values_refused"],
    [mutate("requests", firstPage, row => { row.expected_revision--; }), actual.responses.bytes, "stale_request"],
    [actual.requests.bytes, mutate("responses", forward.stackIndex, row => { row.result.frames[0].values.value_count++; }), "source_values_refused"],
  ];
  for (const [requests, responses, reason] of mutations) {
    await upload(panel); await expect(source).toHaveAttribute("data-state", "ready");
    await upload(panel, requests, responses);
    await expect(panel.getByRole("alert")).toContainText(reason);
    await expect(source).toHaveCount(0);
    await expect(panel.getByRole("region", { name: "Imported checkpoint SSA and source" })).toHaveCount(0);
    await expect(panel.getByRole("group", { name: "Captured memory cells" })).toHaveCount(0);
  }
});
