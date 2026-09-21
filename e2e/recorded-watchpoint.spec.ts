import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

// Exact original lines from the published-source CPU smoke, not invented positive responses.
const ids = [1, 2, 4, 5, 6, 7, 12];
function fixture(side: "requests" | "responses", sha256: string) {
  const bytes = readFileSync(resolve("tests/fixtures/recorded-watchpoint-" + side + ".jsonl"));
  if (createHash("sha256").update(bytes).digest("hex") !== sha256) throw Error("Retained watchpoint fixture changed.");
  const raw = bytes.toString("utf8"), lines = raw.split("\n");
  if (lines.pop() !== "" || JSON.stringify(lines.map(line => JSON.parse(line).request_id)) !== JSON.stringify(ids)) {
    throw Error("Original seven-pair roster or final LF changed.");
  }
  return { bytes, lines: lines.map(line => line + "\n") };
}
const requests = fixture("requests", "f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c");
const responses = fixture("responses", "4529a8186678df97fb6df4d0f306da8b93a0223d71d54600863f26a1b4dfce3f");
const laterSource = "d005a00f139d93fd7e2bdd577b636e3c709e5d66cc1df13dc6dd0e5100d1d543";

async function open(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  const toggle = page.getByRole("button", { name: "Open recorded watchpoint", exact: true });
  await toggle.focus(); await toggle.press("Enter");
  const panel = page.getByRole("region", { name: "Local recorded watchpoint observation", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Import watchpoint observation", exact: true })).toBeDisabled();
  // Wait for the complete lazy panel first; do not filter any later feature requests.
  const network: string[] = [];
  page.on("request", request => network.push(request.method() + " " + request.url()));
  return { panel, network };
}
async function choose(panel: Locator, responseBytes = responses.bytes) {
  await panel.getByLabel("Watchpoint requests JSONL", { exact: true }).setInputFiles({
    name: "watchpoint-requests.jsonl", mimeType: "application/x-ndjson", buffer: requests.bytes,
  });
  await panel.getByLabel("Watchpoint responses JSONL", { exact: true }).setInputFiles({
    name: "watchpoint-responses.jsonl", mimeType: "application/x-ndjson", buffer: responseBytes,
  });
}
async function importPair(panel: Locator) {
  await panel.getByRole("button", { name: "Import watchpoint observation", exact: true }).click();
  await expect(panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true })).toBeChecked();
}
async function stopOnly(panel: Locator) {
  const stop = panel.getByRole("region", { name: "Uncaptured watchpoint stop", exact: true });
  await expect(stop).toBeVisible();
  await expect(stop).toContainText("Request 6 reports watchpoint 1 at event 32, revision 3.");
  await expect(stop).toContainText("Snapshot: unavailable / not_captured");
  const tableFrame = stop.getByLabel("Watch-stop unavailable fields", { exact: true });
  await expect.poll(() => tableFrame.evaluate(node => node.scrollWidth <= node.clientWidth),
    { message: "Both watch-stop columns must fit without horizontal scrolling" }).toBe(true);
  await expect.poll(() => tableFrame.locator("th, td").evaluateAll(cells => cells.every(cell => {
    const box = cell.getBoundingClientRect();
    const text = document.createRange();
    text.selectNodeContents(cell);
    return Array.from(text.getClientRects()).every(rect =>
      rect.left >= box.left && rect.right <= box.right && rect.top >= box.top && rect.bottom <= box.bottom);
  })), { message: "Every watch-stop label must stay inside its own cell" }).toBe(true);
  await expect(stop.getByRole("table", { name: "Unavailable at the watchpoint stop" })
    .getByRole("cell", { name: "Unavailable — not captured", exact: true })).toHaveCount(6);
  await expect(panel.getByRole("region", { name: "Separate later captured checkpoint", exact: true })).toHaveCount(0);
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  await expect(panel.getByRole("region", { name: "Selected dword interpretation", exact: true })).toHaveCount(0);
  await expect(panel.getByText(laterSource, { exact: false })).toHaveCount(0);
  await expect(panel.getByText("compiler_bundle_bound; byte range [931, 947)", { exact: false })).toHaveCount(0);
  return stop;
}
async function rawPair(panel: Locator, id: number) {
  const index = ids.indexOf(id);
  if (index < 0) throw Error("Expected original pair missing.");
  // textContent equality retains every original byte representable in the UTF-8 DOM, including LF.
  await expect.poll(() => panel.getByLabel("Original watchpoint request line", { exact: true }).textContent())
    .toBe(requests.lines[index]);
  await expect.poll(() => panel.getByLabel("Original watchpoint response line", { exact: true }).textContent())
    .toBe(responses.lines[index]);
}
async function viewportShot(page: Page, target: Locator, witness: Locator,
  theme: "light" | "dark", info: TestInfo, stage: "stop" | "later") {
  // Four actual viewport frames per project: two stages by two themes. The later
  // frame shows the real facts block and scalar, not an entire tall mobile inspector.
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  // A prior keyboard/focus scroll can advance after an instant scroll. Observe
  // actual geometry across frames and reposition within a fixed bound; never
  // hide the header, change layout, or relax the final visibility checks.
  const framing = await target.evaluate(async node => {
    const header = document.querySelector(".topbar");
    if (!header) throw Error("The real page header is required for viewport framing.");
    function snapshot() {
      const box = node.getBoundingClientRect(), headerBox = header!.getBoundingClientRect();
      return { scroll_y: window.scrollY, target_top: box.top, target_bottom: box.bottom,
        header_bottom: headerBox.bottom, viewport_height: innerHeight };
    }
    const frames = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const samples: { attempt: number; requested_scroll_y: number;
      before: ReturnType<typeof snapshot>; first: ReturnType<typeof snapshot>; second: ReturnType<typeof snapshot>;
      positioned: boolean; stable: boolean }[] = [];
    for (let attempt = 1; attempt <= 24; attempt++) {
      if (!node.isConnected || !header.isConnected) throw Error("Viewport framing target detached.");
      const before = snapshot(), requested_scroll_y = before.scroll_y + before.target_top - before.header_bottom - 16;
      window.scrollTo({ left: 0, top: requested_scroll_y, behavior: "instant" });
      await frames(); const first = snapshot();
      await frames(); const second = snapshot();
      const positioned = Math.abs(second.target_top - second.header_bottom - 16) <= 1 &&
        second.target_top >= second.header_bottom && second.target_top < second.viewport_height;
      const stable = Math.abs(first.scroll_y - second.scroll_y) <= 0.5 &&
        Math.abs(first.target_top - second.target_top) <= 0.5 &&
        Math.abs(first.target_bottom - second.target_bottom) <= 0.5 &&
        Math.abs(first.header_bottom - second.header_bottom) <= 0.5;
      samples.push({ attempt, requested_scroll_y, before, first, second, positioned, stable });
      if (positioned && stable) return { settled: true, maximum_attempts: 24, samples };
    }
    return { settled: false, maximum_attempts: 24, samples };
  });
  const header = page.locator(".topbar");
  const brand = header.getByRole("link", { name: "fe2o3 kernels overview", exact: true });
  async function measure(locator: Locator) {
    return locator.evaluate(node => {
      const box = node.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left,
        width: box.width, height: box.height, text: node.textContent?.trim().slice(0, 256) ?? "",
        hit: hit !== null && (node === hit || node.contains(hit)) };
    });
  }
  const headerBox = await header.evaluate(node => {
    const box = node.getBoundingClientRect();
    return { top: box.top, right: box.right, bottom: box.bottom, left: box.left,
      width: box.width, height: box.height, position: getComputedStyle(node).position };
  });
  const targetBox = await measure(target), witnessBox = await measure(witness), brandBox = await measure(brand);
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight,
    scrollX, scrollY, pageScrollWidth: document.documentElement.scrollWidth,
    theme: document.documentElement.dataset.theme }));
  const checks = {
    theme_applied: viewport.theme === theme,
    header_fixed_or_sticky: headerBox.position === "fixed" || headerBox.position === "sticky",
    header_fully_visible: headerBox.width > 0 && headerBox.height > 0 && headerBox.left >= 0 &&
      headerBox.top >= 0 && headerBox.right <= viewport.width && headerBox.bottom <= viewport.height,
    header_brand_hit: brandBox.hit,
    target_clear_of_header: targetBox.top >= headerBox.bottom && targetBox.top < viewport.height,
    target_within_horizontal_viewport: targetBox.left >= 0 && targetBox.right <= viewport.width,
    witness_fully_visible: witnessBox.width > 0 && witnessBox.height > 0 && witnessBox.left >= 0 &&
      witnessBox.top >= headerBox.bottom && witnessBox.right <= viewport.width && witnessBox.bottom <= viewport.height,
    witness_hit: witnessBox.hit,
    no_horizontal_page_overflow: viewport.pageScrollWidth <= viewport.width,
  };
  // Retain bounded geometry even when an assertion fails; all writes remain in
  // this attempt's artifact directory, never in source or a previous run.
  const diagnostic = JSON.stringify({ schema: "task-watchpoint-framing-v1", project: info.project.name,
    retry: info.retry, stage, theme, framing, viewport,
    geometry: { header: headerBox, header_brand: brandBox, target: targetBox, witness: witnessBox }, checks }, null, 2) + "\n";
  expect(Buffer.byteLength(diagnostic)).toBeLessThanOrEqual(64 * 1024);
  writeFileSync(info.outputPath("recorded-watchpoint-" + stage + "-" + theme + "-framing.json"),
    diagnostic, { flag: "wx" });
  expect(framing.settled, stage + "/" + theme + ": bounded viewport framing settled").toBe(true);
  await expect(header).toBeVisible(); await expect(brand).toBeInViewport({ ratio: 1 });
  await expect(witness).toBeInViewport({ ratio: 1 });
  for (const [name, passed] of Object.entries(checks)) expect(passed, stage + "/" + theme + ": " + name).toBe(true);
  const file = "recorded-watchpoint-" + stage + "-" + theme + ".jpg";
  const bytes = await page.screenshot({
    path: info.outputPath(file),
    type: "jpeg", quality: 60, fullPage: false, scale: "css",
  });
  return { file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
    stage, theme, frame: stage === "stop" ? "uncaptured-stop-section" : "later-interpretation-facts",
    full_page: false, scale: "css", quality: 60, viewport, framing,
    geometry: { header: headerBox, header_brand: brandBox, target: targetBox, witness: witnessBox }, checks };
}

test("recorded watchpoint stages isolate an uncaptured stop from explicit later bytes and selected original pairs", async ({ page }, info) => {
  const { panel, network } = await open(page);
  const storage = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const sessionStorageBefore = await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage)));
  const screenshots: Awaited<ReturnType<typeof viewportShot>>[] = [];
  await choose(panel); await importPair(panel);
  await expect(panel).toContainText("Caller-supplied / unverified");
  const stop = await stopOnly(panel);
  await panel.getByRole("button", { name: "Show selected moment's original pairs", exact: true }).click();
  const raw = panel.getByRole("combobox", { name: "Selected moment original pair", exact: true });
  await expect(raw.locator("option")).toHaveCount(1); await rawPair(panel, 6);
  await panel.getByRole("button", { name: "Hide selected moment's original pairs", exact: true }).click();
  for (const theme of ["light", "dark"] as const) {
    screenshots.push(await viewportShot(page, stop, stop.getByRole("heading").first(), theme, info, "stop"));
  }

  await panel.getByRole("radio", { name: "Registration and earlier inventory", exact: true }).check();
  const registration = panel.getByRole("region", { name: "Recorded watchpoint registration", exact: true });
  await expect(registration).toContainText("Request 4 registers the watchpoint; request 5 lists it.");
  await expect(registration).toContainText("source-first-write");
  await expect(registration).toContainText("alloc#1:g0");
  await expect(registration).toContainText("Offset 0; length 4 bytes");
  await expect(registration).toContainText("write / after_commit");
  await expect(registration).toContainText("24 bytes · global");
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  await panel.getByRole("button", { name: "Show selected moment's original pairs", exact: true }).click();
  await expect(raw.locator("option")).toHaveCount(4);
  await raw.selectOption("2"); await rawPair(panel, 4);
  await raw.selectOption("3"); await rawPair(panel, 5);

  const stopChoice = panel.getByRole("radio", { name: "Uncaptured watch stop", exact: true });
  await stopChoice.check(); await stopChoice.focus(); await stopChoice.press("ArrowRight");
  await expect(panel.getByRole("radio", { name: "Separate later checkpoint and memory", exact: true })).toBeChecked();
  const later = panel.getByRole("region", { name: "Separate later captured checkpoint", exact: true });
  await expect(later).toContainText("Selected request 7: event 33, revision 4.");
  await expect(later).toContainText("Memory request 12 belongs only to this later checkpoint.");
  await expect(later).toContainText("Frame: unavailable; occurrence: unavailable.");
  const memory = later.getByRole("region", { name: "Bytes from the separate later checkpoint", exact: true });
  await expect(memory).toContainText("compiler_bundle_bound; byte range [931, 947)");
  await expect(memory).toContainText(laterSource);
  const cells = memory.getByRole("group", { name: "Captured memory cells", exact: true }).getByRole("button");
  await expect(cells).toHaveCount(24);
  await expect(cells.first()).toHaveAccessibleName("Byte offset 0, 1 byte, 0xd5, initialized");
  await expect(cells.nth(1)).toHaveAccessibleName("Byte offset 1, 1 byte, 0x01, initialized");
  await cells.first().focus(); await cells.first().press("ArrowRight");
  await expect(cells.nth(1)).toBeFocused(); await cells.nth(1).press("Home");
  const inspector = memory.getByRole("region", { name: "Selected dword interpretation", exact: true });
  await expect(inspector.getByRole("combobox", { name: "Value interpretation", exact: true })).toHaveValue("raw");
  await expect(inspector.getByRole("combobox", { name: "Interpretation byte order", exact: true })).toHaveValue("unknown");
  await expect(inspector.getByLabel("Interpreted scalar", { exact: true })).toHaveCount(0);
  await memory.getByRole("combobox", { name: "Memory cell size", exact: true }).selectOption("4");
  await inspector.getByRole("combobox", { name: "Value interpretation", exact: true }).selectOption("u32");
  await expect(inspector.getByLabel("Memory interpretation status", { exact: true })).toHaveAttribute("data-state", "needs-order");
  await inspector.getByRole("combobox", { name: "Interpretation byte order", exact: true }).selectOption("little");
  await expect(inspector.getByLabel("Interpreted scalar", { exact: true })).toHaveText("469");
  await expect(inspector).toContainText("0xd5010000"); await expect(inspector).toContainText("0x000001d5");
  for (const theme of ["light", "dark"] as const) {
    screenshots.push(await viewportShot(page, inspector.getByLabel("Selected dword interpretation facts", { exact: true }),
      inspector.getByLabel("Interpreted scalar", { exact: true }), theme, info, "later"));
  }

  await panel.getByRole("button", { name: "Show selected moment's original pairs", exact: true }).click();
  await expect(raw.locator("option")).toHaveCount(2); await rawPair(panel, 7);
  await raw.selectOption("1"); await rawPair(panel, 12);
  await stopChoice.check(); await stopOnly(panel);
  await expect(raw).toHaveCount(0);
  await expect(panel.getByLabel("Interpreted scalar", { exact: true })).toHaveCount(0);
  await panel.getByRole("radio", { name: "Separate later checkpoint and memory", exact: true }).check();
  await expect(inspector.getByRole("combobox", { name: "Value interpretation", exact: true })).toHaveValue("raw");
  await expect(inspector.getByRole("combobox", { name: "Interpretation byte order", exact: true })).toHaveValue("unknown");
  await expect(cells).toHaveCount(24); await expect(raw).toHaveCount(0);
  const local_storage_unchanged = await page.evaluate(() => JSON.stringify(Object.entries(localStorage))) === storage;
  const session_storage_unchanged = await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage))) === sessionStorageBefore;
  expect(local_storage_unchanged).toBe(true); expect(session_storage_unchanged).toBe(true);
  expect(network).toEqual([]);
  // Only test artifacts are written. No repository source, fixture or input is changed.
  writeFileSync(info.outputPath("recorded-watchpoint-viewport-qa.json"), JSON.stringify({
    schema: "task-recorded-watchpoint-viewport-v1", project: info.project.name, retry: info.retry,
    request_sha256: "f7184765621758f4e57a82ff603093c1d53474b8dc68eddf69debbaf2afc608c",
    response_sha256: "4529a8186678df97fb6df4d0f306da8b93a0223d71d54600863f26a1b4dfce3f",
    screenshots, network, local_storage_unchanged, session_storage_unchanged,
  }, null, 2) + "\n", { flag: "wx" });
});

test("watchpoint replacement, refusal, reset and reopening never retain an old later checkpoint", async ({ page }) => {
  const { panel, network } = await open(page);
  await choose(panel); await importPair(panel);
  await panel.getByRole("radio", { name: "Separate later checkpoint and memory", exact: true }).check();
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toBeVisible();
  await panel.getByLabel("Watchpoint responses JSONL", { exact: true }).setInputFiles({
    name: "incomplete.jsonl", mimeType: "application/x-ndjson", buffer: Buffer.from("{}\n"),
  });
  await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  await panel.getByRole("button", { name: "Import watchpoint observation", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("pair_count");
  await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
  await choose(panel); await importPair(panel); await stopOnly(panel);
  await panel.getByRole("radio", { name: "Separate later checkpoint and memory", exact: true }).check();
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toBeVisible();
  // Synthetic negative only: preserve every other original line, including the
  // revision-4 request/session, but relabel the memory anchor with stop revision 3.
  const wrongAnchor = JSON.parse(responses.lines[6]);
  expect(wrongAnchor.result.snapshot.cursor.state_revision).toBe(4);
  wrongAnchor.result.snapshot.cursor.state_revision = 3;
  await panel.getByLabel("Watchpoint responses JSONL", { exact: true }).setInputFiles({
    name: "wrong-memory-anchor.jsonl", mimeType: "application/x-ndjson",
    buffer: Buffer.from(responses.lines.slice(0, 6).join("") + JSON.stringify(wrongAnchor) + "\n"),
  });
  await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
  await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
  await panel.getByRole("button", { name: "Import watchpoint observation", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("memory: Memory must match the complete later checkpoint anchor.");
  await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
  await expect(panel.getByRole("region", { name: "Separate later captured checkpoint", exact: true })).toHaveCount(0);
  await expect(panel.getByText(laterSource, { exact: false })).toHaveCount(0);
  await choose(panel); await importPair(panel); await stopOnly(panel);
  await panel.getByRole("button", { name: "Reset watchpoint observation", exact: true }).click();
  await expect(panel.getByLabel("Watchpoint requests JSONL", { exact: true })).toBeFocused();
  await expect(panel.getByLabel("Watchpoint requests JSONL", { exact: true })).toHaveValue("");
  await expect(panel.getByLabel("Watchpoint responses JSONL", { exact: true })).toHaveValue("");
  await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
  await page.getByRole("button", { name: "Close recorded watchpoint", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "Open recorded watchpoint", exact: true }).click();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Import watchpoint observation", exact: true })).toBeDisabled();
  await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
  expect(network).toEqual([]);
});

test("cancelling a held browser read prevents late watchpoint installation and permits a fresh import", async ({ page }) => {
  const { panel, network } = await open(page);
  await choose(panel);
  // Hold only delivery of the browser file read, retaining the real positive bytes.
  // Release explicitly after cancellation, rather than relying on a timing race.
  const held = await page.evaluateHandle(() => {
    const original = FileReader.prototype.readAsArrayBuffer;
    const pending: { reader: FileReader; blob: Blob }[] = [];
    FileReader.prototype.readAsArrayBuffer = function (blob: Blob) { pending.push({ reader: this, blob }); };
    return {
      count: () => pending.length,
      restore: () => { FileReader.prototype.readAsArrayBuffer = original; },
      release: async () => {
        FileReader.prototype.readAsArrayBuffer = original;
        await Promise.all(pending.splice(0).map(({ reader, blob }) => new Promise<void>((resolve, reject) => {
          reader.addEventListener("loadend", () => resolve(), { once: true });
          try { original.call(reader, blob); } catch (error) { reject(error); }
        })));
      },
    };
  });
  try {
    await panel.getByRole("button", { name: "Import watchpoint observation", exact: true }).click();
    await expect.poll(() => held.evaluate(value => value.count())).toBe(1);
    await expect(panel.getByRole("button", { name: "Cancel watchpoint import", exact: true })).toBeEnabled();
    await panel.getByRole("button", { name: "Cancel watchpoint import", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("Import cancelled");
    await held.evaluate(value => value.release());
    await expect(panel.getByTestId("recorded-watchpoint-moment")).toHaveCount(0);
    await expect(panel.getByRole("group", { name: "Captured memory cells", exact: true })).toHaveCount(0);
    await expect(panel).toHaveAttribute("aria-busy", "false");
    await importPair(panel); await stopOnly(panel);
  } finally {
    await held.evaluate(value => value.restore()); await held.dispose();
  }
  expect(network).toEqual([]);
});
