import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { FAULT_SOURCE_FILES, type FaultSourceFileRole } from "../src/content/recorded-fault-source-replay";

// Immutable canonical R3 originals: logs/phase22w2-fault-source-actual-r3.
// Root must stage these exact bytes. Missing/changed fixtures fail; no skip,
// generated positive, network fetch, exporter, or debugger process is allowed.
const PINS: Readonly<Record<FaultSourceFileRole, readonly [number, string]>> = {
  receipt: [19683, "c60587e9d5d47d689efecb020133b4d670da2f620780e37644fd9738c6af9488"],
  requests: [10184, "0f9ad2fdd8b084504a022ce859e308d9e6579be03ad12b1eecf01f78a0668e1e"],
  responses: [69406, "9c569caee68dd88d42aa12f36c5ea8a011cf5a4d034d8d6640addc423cdd5c22"],
  diagnostic: [504, "91c3b2ba7237afca178616723db569e901b5eecee342dca86c1e19d81d71684f"],
};
const buffers = {} as Record<FaultSourceFileRole, Buffer>;
const actual = {} as Record<FaultSourceFileRole, string>;
for (const spec of FAULT_SOURCE_FILES) {
  const bytes = readFileSync(resolve("examples/source-fault-replay-v2", spec.leaf));
  expect(bytes.length, spec.leaf).toBe(PINS[spec.role][0]);
  expect(createHash("sha256").update(bytes).digest("hex"), spec.leaf).toBe(PINS[spec.role][1]);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  expect(Buffer.from(text, "utf8"), spec.leaf).toEqual(bytes);
  buffers[spec.role] = bytes; actual[spec.role] = text;
}
for (const role of ["requests", "responses"] as const) {
  expect(actual[role].split("\n")).toHaveLength(45);
  expect(actual[role].endsWith("\n")).toBe(true);
}
const rawLine = (role: "requests" | "responses", id: number) => actual[role].split("\n")[id - 1] + "\n";
const SUCCESS = "Imported consistent retained files; full-run claims and provenance remain unverified.";
const moments = {
  fault: "Terminal fault — values unavailable",
  prior: "Prior captured checkpoint",
  repeat: "Repeated prior checkpoint",
  completed: "Final failed completion — values unavailable",
} as const;
async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open recorded fault/source replay", exact: true }).click();
  const panel = page.getByRole("region", { name: "Recorded fault and prior-checkpoint replay", exact: true });
  // Wait for lazy code loading before observing import-related requests.
  for (const spec of FAULT_SOURCE_FILES) await expect(panel.getByLabel(spec.label, { exact: false })).toBeVisible();
  return panel;
}
async function selectFiles(panel: Locator) {
  for (const spec of FAULT_SOURCE_FILES) await panel.getByLabel(spec.label, { exact: false }).setInputFiles({
    name: spec.leaf, mimeType: "text/plain", buffer: buffers[spec.role],
  });
}
async function upload(panel: Locator) {
  await selectFiles(panel);
  await panel.getByRole("button", { name: "Import fault/source recording", exact: true }).click();
  await expect(panel.getByText(SUCCESS, { exact: true })).toBeVisible();
}
const selected = (panel: Locator) => panel.getByRole("region", { name: "Selected fault/source moment", exact: true });
async function terminalHasNoValues(panel: Locator, moment: "fault" | "completed", revision: number) {
  const view = selected(panel);
  await expect(view).toHaveAttribute("data-moment", moment);
  await expect(view.getByTestId("fault-source-selected-anchor")).toContainText("Event 22; revision " + revision);
  await expect(view.getByTestId("fault-source-selected-anchor")).not.toContainText("Logical lane");
  await expect(view.getByRole("table")).toHaveCount(0);
  for (const name of ["Captured memory cells", "Compared memory cells"])
    await expect(view.getByRole("group", { name, exact: true })).toHaveCount(0);
  for (const name of ["Imported checkpoint source variables", "Imported checkpoint SSA and source"])
    await expect(view.getByRole("region", { name, exact: true })).toHaveCount(0);
  await expect(view.getByLabel("Memory window at selected checkpoint", { exact: true })).toHaveCount(0);
  await expect(view).toContainText("No prior values, source location, lane, failed-read range or memory snapshot are substituted.");
}
type DigestGate = { started: number; finished: number; release: () => void; restore: () => void };
type FaultTestWindow = Window & { __faultReplayStorageWrites?: number; __faultReplayDigest?: DigestGate };
const storageSnapshot = (page: Page) => page.evaluate(() => JSON.stringify({
  local: Object.entries(localStorage), session: Object.entries(sessionStorage),
}));
async function localOnlyObserver(page: Page) {
  const requests: string[] = [], before = await storageSnapshot(page);
  page.on("request", request => requests.push(request.method() + " " + request.url()));
  await page.evaluate(() => {
    const state = window as FaultTestWindow; state.__faultReplayStorageWrites = 0;
    for (const method of ["setItem", "removeItem", "clear"] as const) {
      const original = Storage.prototype[method];
      Object.defineProperty(Storage.prototype, method, { configurable: true, writable: true,
        value: function(this: Storage, ...args: string[]) {
          state.__faultReplayStorageWrites = (state.__faultReplayStorageWrites ?? 0) + 1;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
  return async () => {
    expect(requests).toEqual([]);
    expect(await storageSnapshot(page)).toBe(before);
    expect(await page.evaluate(() => (window as FaultTestWindow).__faultReplayStorageWrites)).toBe(0);
  };
}

test("actual R3 fault replay separates terminal/source/SSA/storage and retains keyboard-readable original evidence", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const panel = await open(page), assertLocalOnly = await localOnlyObserver(page);
  await upload(panel);
  const view = selected(panel);
  await terminalHasNoValues(panel, "fault", 2);
  await expect(panel).toContainText("Caller-supplied / unverified");
  const diagnostic = panel.getByRole("region", { name: "Separate standalone diagnostic", exact: true });
  await expect(diagnostic).toContainText("separate execution, not this debugger terminal query");
  await diagnostic.getByText("Original standalone diagnostic", { exact: true }).click();
  expect(await diagnostic.getByLabel("Original standalone diagnostic bytes", { exact: true }).textContent()).toBe(actual.diagnostic);
  await view.getByText("Selected moment original pairs", { exact: true }).click();
  expect(await view.getByLabel("Original fault/source request line", { exact: true }).textContent()).toBe(rawLine("requests", 3));
  await view.getByLabel("Original pair for selected fault moment", { exact: true }).selectOption("4");
  expect(await view.getByLabel("Original fault/source response line", { exact: true }).textContent()).toBe(rawLine("responses", 7));

  const source = view.getByRole("region", { name: "Imported checkpoint source variables", exact: true });
  const ssa = view.getByRole("region", { name: "Imported checkpoint SSA and source", exact: true });
  const sourceTable = source.getByRole("table", { name: "Selected checkpoint source variables", exact: true });
  const ssaTable = ssa.getByRole("table", { name: "Selected checkpoint SSA values", exact: true });
  const cells = view.getByRole("group", { name: "Captured memory cells", exact: true }).getByRole("button");
  const priorMemory: string[][] = [];
  let priorSource = "", priorSsa = "";
  for (const [index, moment] of (["prior", "repeat"] as const).entries()) {
    const radio = panel.getByRole("radio", { name: moments[moment], exact: true });
    await radio.focus(); await radio.press("Space"); await expect(radio).toBeChecked();
    await expect(view).toHaveAttribute("data-moment", moment);
    await expect(view.getByTestId("fault-source-selected-anchor")).toContainText("Event 21; revision " + (index === 0 ? 3 : 5));
    await expect(view.getByTestId("fault-source-selected-anchor")).toContainText("Logical lane 0; work-item [0, 0, 0]");
    await expect(source).toHaveAttribute("data-state", "ready"); await expect(ssa).toHaveAttribute("data-state", "ready");
    await expect(sourceTable.locator("tbody tr")).toHaveCount(6);
    await expect(ssaTable.locator("tbody tr")).toHaveCount(13);
    await expect(source.getByRole("region", { name: "Imported checkpoint SSA and source", exact: true })).toHaveCount(0);
    await expect(source.getByText("not_represented", { exact: true })).toHaveCount(4);
    await expect(source.locator("button,input,select,textarea,[contenteditable=true]")).toHaveCount(0);
    await expect(source).toContainText("Matching values or names are not a source-to-SSA mapping");
    await expect(view).toContainText("No Rust source body was imported or fetched");
    await expect(view).toContainText("cannot independently establish the operation kind");
    await expect(view).toContainText("Frame 1 is static stack depth");
    await expect(view.getByLabel("Memory window at selected checkpoint", { exact: true })).toHaveValue("0");
    await expect(view.getByText(/Selected the already-retained byte/)).toHaveCount(0);
    if (index === 0) {
      priorSource = (await sourceTable.textContent())!; priorSsa = (await ssaTable.textContent())!;
    } else {
      expect(await sourceTable.textContent()).toBe(priorSource); expect(await ssaTable.textContent()).toBe(priorSsa);
    }
    for (const [windowIndex, count] of [16, 16, 24].entries()) {
      await view.getByLabel("Memory window at selected checkpoint", { exact: true }).selectOption(String(windowIndex));
      await view.getByLabel("Memory cell size", { exact: true }).selectOption("1");
      await expect(cells).toHaveCount(count);
      const labels = await cells.evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")!));
      if (index === 0) priorMemory[windowIndex] = labels;
      else expect(labels).toEqual(priorMemory[windowIndex]);
      expect(labels.filter(label => label.endsWith(", uninitialized"))).toHaveLength(windowIndex === 0 ? 1 : 0);
      if (windowIndex === 0) expect(labels[0]).toMatch(/^Byte offset 0, 1 byte, .*uninitialized$/);
    }
    await ssa.getByRole("button", { name: /^Show retained byte for SSA/ }).first().click();
    await expect(view.getByText(/not a dereference or fault-range attribution/)).toBeVisible();
    await expect(view.getByTestId("historical-access-overlay")).toHaveCount(0);
    await view.getByLabel("Memory window at selected checkpoint", { exact: true }).selectOption("0");
    await view.getByLabel("Memory cell size", { exact: true }).selectOption("1");
    await cells.first().focus(); await cells.first().press("ArrowRight"); await expect(cells.nth(1)).toBeFocused();
    await view.getByText("Selected moment original pairs", { exact: true }).click();
    await expect(view.getByLabel("Original pair for selected fault moment", { exact: true })).toHaveValue("0");
    expect(await view.getByLabel("Original fault/source request line", { exact: true }).textContent()).toBe(rawLine("requests", index === 0 ? 8 : 23));
    expect(await view.getByLabel("Original fault/source response line", { exact: true }).textContent()).toBe(rawLine("responses", index === 0 ? 8 : 23));
  }
  await expect(view).toContainText("error / stale_revision, state_changed=false");
  await view.getByLabel("Original pair for selected fault moment", { exact: true }).selectOption("10");
  expect(await view.getByLabel("Original fault/source response line", { exact: true }).textContent()).toBe(rawLine("responses", 33));
  await view.getByLabel("Baseline retained memory window", { exact: true }).selectOption("15");
  const comparison = view.getByRole("region", { name: "Retained memory checkpoint comparison", exact: true });
  await expect(comparison).toContainText("0 storage-byte differences; 0 initialization differences");
  await comparison.getByLabel("Comparison cell size", { exact: true }).selectOption("1");
  const compared = comparison.getByRole("group", { name: "Compared memory cells", exact: true }).getByRole("button");
  await expect(compared).toHaveCount(16);
  await compared.first().focus(); await compared.first().press("ArrowRight"); await expect(compared.nth(1)).toBeFocused();

  if (testInfo.project.name === "mobile") {
    const row = sourceTable.locator("tbody tr").first(), rowBox = await row.boundingBox(), cellBox = await row.locator("td").first().boundingBox();
    if (!rowBox || !cellBox) throw new Error("Actual source row has no readable bounds.");
    expect(cellBox.width).toBeGreaterThan(rowBox.width * .9);
    for (const field of ["Scope / generation", "Type / availability", "Retained representation / interpretation"])
      await expect(row.getByText(field, { exact: true })).toBeVisible();
  }
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const bounds = await panel.boundingBox(); if (!bounds) throw new Error("Fault/source panel has no bounds.");
    for (const element of [source, sourceTable, view.getByLabel("Original fault/source response line", { exact: true })]) {
      const box = await element.boundingBox(); if (!box) throw new Error("Selected retained view has no bounds.");
      expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1); expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      const width = await element.evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
      expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
    }
    await source.screenshot({ path: testInfo.outputPath("fault-source-replay-" + theme + ".png") });
  }
  for (const [moment, revision] of [["fault", 2], ["completed", 7]] as const) {
    const radio = panel.getByRole("radio", { name: moments[moment], exact: true });
    await radio.focus(); await radio.press("Space"); await expect(radio).toBeChecked();
    await terminalHasNoValues(panel, moment, revision);
  }
  await expect(view).toContainText("Completed / Failed");
  await panel.getByText("Selected file hashes and receipt", { exact: true }).click();
  expect(await panel.getByLabel("Original fault/source receipt", { exact: true }).textContent()).toBe(actual.receipt);
  await expect(panel).toContainText("All 44 original pairs are validated");
  await expect(panel).toContainText("exactly 18 original successful pairs");
  await expect(panel).toContainText("claims are not independently verified here");
  await panel.getByRole("button", { name: "Reset fault/source files", exact: true }).click();
  await expect(view).toHaveCount(0);
  await expect(panel.getByLabel("Fault capture receipt JSON", { exact: false })).toBeFocused();
  for (const spec of FAULT_SOURCE_FILES) await expect(panel.getByLabel(spec.label, { exact: false })).toHaveValue("");
  await expect(panel.getByRole("button", { name: "Import fault/source recording", exact: true })).toBeDisabled();
  await assertLocalOnly();
});

test("replacing actual fault files removes old values before refusal and permits an explicit fresh import", async ({ page }) => {
  const panel = await open(page), assertLocalOnly = await localOnlyObserver(page);
  await upload(panel); await panel.getByRole("radio", { name: moments.prior, exact: true }).check();
  await expect(panel.getByRole("table", { name: "Selected checkpoint source variables", exact: true })).toBeVisible();
  await panel.getByLabel("Fault capture receipt JSON", { exact: false }).setInputFiles({
    name: "synthetic-invalid-receipt.json", mimeType: "application/json", buffer: Buffer.from("{}"),
  });
  await expect(selected(panel)).toHaveCount(0);
  await panel.getByRole("button", { name: "Import fault/source recording", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Missing or unsupported fields");
  await expect(panel.getByRole("table")).toHaveCount(0);
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  await panel.getByRole("button", { name: "Reset fault/source files", exact: true }).click();
  await expect(panel.getByLabel("Fault capture receipt JSON", { exact: false })).toBeFocused();
  await upload(panel); await terminalHasNoValues(panel, "fault", 2);
  await assertLocalOnly();
});

// Delay real browser SHA-256 completion, not capture contents or validator results.
// Each action must invalidate the in-flight generation; the four real digests are
// then delivered and drained before absence is asserted. Unit tests separately
// cover a cancelled FileReader callback and malformed UTF-8.
test("late real digest delivery cannot resurrect fault values after reset, cancel or replacement", async ({ page }) => {
  test.setTimeout(60_000);
  const panel = await open(page), assertLocalOnly = await localOnlyObserver(page);
  for (const action of ["reset", "cancel", "replace"] as const) {
    await selectFiles(panel);
    await page.evaluate(() => {
      const state = window as FaultTestWindow, subtle = crypto.subtle;
      const descriptor = Object.getOwnPropertyDescriptor(subtle, "digest"), original = subtle.digest.bind(subtle);
      let release!: () => void;
      const pending = new Promise<void>(resolve => { release = resolve; });
      const gate: DigestGate = { started: 0, finished: 0, release, restore: () => {
        if (descriptor) Object.defineProperty(subtle, "digest", descriptor);
        else Reflect.deleteProperty(subtle, "digest");
      } };
      state.__faultReplayDigest = gate;
      Object.defineProperty(subtle, "digest", { configurable: true, writable: true,
        value: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
          gate.started++; await pending;
          try { return await original(algorithm, data); } finally { gate.finished++; }
        },
      });
    });
    try {
      await panel.getByRole("button", { name: "Import fault/source recording", exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as FaultTestWindow).__faultReplayDigest?.started)).toBe(4);
      await expect(panel.getByRole("button", { name: "Cancel fault/source import", exact: true })).toBeEnabled();
      if (action === "replace") await panel.getByLabel("Fault capture receipt JSON", { exact: false }).setInputFiles({
        name: "replacement-actual-receipt.json", mimeType: "application/json", buffer: buffers.receipt,
      });
      else await panel.getByRole("button", { name: action === "reset" ? "Reset fault/source files" : "Cancel fault/source import", exact: true }).click();
      await expect(selected(panel)).toHaveCount(0);
      if (action === "reset") await expect(panel.getByLabel("Fault capture receipt JSON", { exact: false })).toBeFocused();
      await page.evaluate(() => (window as FaultTestWindow).__faultReplayDigest!.release());
      await expect.poll(() => page.evaluate(() => (window as FaultTestWindow).__faultReplayDigest?.finished)).toBe(4);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(selected(panel)).toHaveCount(0);
      await expect(panel.getByText(SUCCESS, { exact: true })).toHaveCount(0);
      await expect(panel.getByRole("table")).toHaveCount(0);
      await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
      await expect(panel.getByRole("button", { name: "Cancel fault/source import", exact: true })).toBeDisabled();
      if (action === "cancel") await expect(panel.getByRole("status")).toContainText("Import cancelled. No prior values remain displayed.");
    } finally {
      await page.evaluate(() => {
        const state = window as FaultTestWindow, gate = state.__faultReplayDigest;
        gate?.release(); gate?.restore(); delete state.__faultReplayDigest;
      });
    }
    await panel.getByRole("button", { name: "Reset fault/source files", exact: true }).click();
  }
  await upload(panel); await terminalHasNoValues(panel, "fault", 2);
  await assertLocalOnly();
});
