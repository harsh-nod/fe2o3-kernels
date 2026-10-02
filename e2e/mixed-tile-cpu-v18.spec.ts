import { expect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../examples/mixed_tile_u32.rs", import.meta.url), "utf8");
const oracle = readFileSync(new URL("../examples/mixed_tile_oracle.rs", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../examples/mixed-tile-cpu-v18/workflow.sh", import.meta.url), "utf8");
const revision = "fed6998b1a5eaf2530e94664a1ede650382a8990";

function viewportWidth(page: Page) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("A configured CSS viewport is required");
  return viewport.width;
}
async function withinViewportWidth(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewportWidth(page));
}
async function orderedChildren(locator: Locator) {
  const failures = await locator.evaluate((element) => {
    const items = Array.from(element.children).map((child) => child.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    return items.slice(1).filter((rect, index) => rect.top + 1 < items[index].bottom).length;
  });
  expect(failures).toBe(0);
}

async function inspectCodePanel(page: Page, panel: Locator) {
  const viewport = viewportWidth(page);
  return panel.evaluate((element, viewport) => {
    const originalLeft = element.scrollLeft;
    const originalText = element.textContent;
    const bounds = element.getBoundingClientRect();
    const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
    const overflowX = getComputedStyle(element).overflowX;
    element.scrollLeft = maximum;
    const rightmost = element.scrollLeft;
    element.scrollLeft = originalLeft;
    return {
      boundsWithinViewport: bounds.width > 0 && bounds.left >= -1 && bounds.right <= viewport + 1,
      pageFitsViewport: document.documentElement.scrollWidth <= viewport,
      scrollableWhenNeeded: maximum === 0 || ["auto", "scroll"].includes(overflowX),
      endReachable: maximum === 0 || (rightmost > 0 && Math.abs(rightmost - maximum) <= 1),
      restored: Math.abs(element.scrollLeft - originalLeft) <= 1,
      bytesUnchanged: element.textContent === originalText,
      viewport, innerWidth: window.innerWidth, layoutViewport: document.documentElement.clientWidth,
      clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      overflowX, originalLeft, maximum, rightmost,
    };
  }, viewport);
}
function assertCodePanel(report: Awaited<ReturnType<typeof inspectCodePanel>>) {
  for (const property of [
    "boundsWithinViewport", "pageFitsViewport", "scrollableWhenNeeded",
    "endReachable", "restored", "bytesUnchanged",
  ] as const) expect(report[property], property).toBe(true);
}
async function checkScrollDetectorControls(page: Page) {
  const probe = page.locator("[data-code-scroll-probe]");
  await page.evaluate(() => {
    const element = document.createElement("pre");
    element.dataset.codeScrollProbe = "";
    element.style.cssText = "position:fixed;left:0;top:0;width:min(240px,100vw);height:20px;margin:0;overflow:auto;white-space:pre";
    element.textContent = "x".repeat(4096);
    document.body.append(element);
  });
  try {
    const baseline = await inspectCodePanel(page, probe);
    expect(baseline.maximum).toBeGreaterThan(0);
    assertCodePanel(baseline);
    await probe.evaluate((element) => { element.style.overflow = "clip"; });
    const clipped = await inspectCodePanel(page, probe);
    expect(clipped.scrollableWhenNeeded).toBe(false);
    expect(clipped.endReachable).toBe(false);
    await probe.evaluate((element) => { element.style.overflow = "auto"; });
    await page.evaluate((width) => {
      const element = document.createElement("div");
      element.dataset.pageOverflowProbe = "";
      element.style.cssText = `position:absolute;left:0;top:0;width:${width + 64}px;height:1px`;
      document.body.append(element);
    }, viewportWidth(page));
    expect((await inspectCodePanel(page, probe)).pageFitsViewport).toBe(false);
    await page.locator("[data-page-overflow-probe]").evaluate((element) => element.remove());
    assertCodePanel(await inspectCodePanel(page, probe));
  } finally {
    await page.evaluate(() => {
      document.querySelector("[data-page-overflow-probe]")?.remove();
      document.querySelector("[data-code-scroll-probe]")?.remove();
    });
  }
}

test("ordinary mixed tile tutorial binds source, checked CLI results and logical debugger limits", async ({ page, context }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect(createHash("sha256").update(source).digest("hex")).toBe("e8aad7f11d63371e7d97e915dcbb5e35a6f44b885750a621696895f7d8810ee5");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/lesson/cpu-semantic-simulation#mixed-tile-v18");
  const section = page.locator("#mixed-tile-v18");
  const heading = section.getByRole("heading", { name: "A masked tile with ordinary per-lane Rust", exact: true });
  await expect(heading).toBeInViewport();
  await expect(section).toContainText("52 exact-byte/initialization simulations");
  await expect(section).toContainText("pending curriculum binding");
  await expect(section).toContainText("0xffffffcc");
  await expect(section).toContainText("0x0000158c");
  await orderedChildren(section);
  await withinViewportWidth(page);
  await page.screenshot({ path: testInfo.outputPath("mixed-tile-anchor-viewport.png") });
  await section.screenshot({ path: testInfo.outputPath("mixed-tile-narrative.png") });
  await page.screenshot({ path: testInfo.outputPath("mixed-tile-viewport.png") });

  const lessonCode = page.getByLabel("Lesson code", { exact: true });
  for (const [label, expected, filename] of [
    ["Mixed tile source", source, "source"],
    ["Mixed tile oracle", oracle, "oracle"],
    ["Public CLI workflow", workflow, "workflow"],
    ["Recorded mixed CPU observations", null, "observations"],
  ] as const) {
    await lessonCode.getByRole("tab", { name: label, exact: true }).click();
    const panel = lessonCode.getByRole("tabpanel");
    await expect(panel).toBeVisible();
    const code = panel.locator("code");
    if (expected !== null) {
      expect(await code.textContent()).toBe(expected);
      await lessonCode.getByRole("button", { name: "Copy code", exact: true }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    } else {
      await expect(code).toContainText("active_mask=18446744073709551615");
      await expect(code).toContainText("hardware_observed=false");
      await expect(code).toContainText("state=terminated");
    }
    if (label === "Mixed tile source") {
      await expect(lessonCode.locator(".code-status")).toContainText("Pinned published WIP revision, not compiler main.");
      await expect(lessonCode.getByRole("link", { name: "Source", exact: true })).toHaveAttribute("href",
        "https://github.com/harsh-nod/fe2o3/blob/" + revision + "/examples/workgroup_sync_v1/src/kernel_mixed_tile_u32.rs");
      await expect(lessonCode.locator(".code-status")).toContainText("Native artifact, KFD execution");
    }
    await withinViewportWidth(page);
    const panelReport = await inspectCodePanel(page, panel);
    await testInfo.attach("code-panel-" + filename + ".json", {
      body: Buffer.from(JSON.stringify(panelReport, null, 2)), contentType: "application/json",
    });
    assertCodePanel(panelReport);
    await lessonCode.screenshot({ path: testInfo.outputPath("mixed-tile-" + filename + ".png") });
  }
  const evidence = page.getByLabel("Evidence for this lesson");
  await evidence.locator("summary").click();
  const claim = evidence.locator("article").filter({
    has: page.getByRole("heading", { name: "Mixed tile/SIMT source in the CPU simulator and debugger", exact: true }),
  });
  await expect(claim).toBeVisible();
  await expect(claim).toContainText("Native SIMT/tile pairs remain pending");
  await expect(claim.getByRole("link", { name: "examples/workgroup_sync_v1/src/kernel_mixed_tile_u32.rs", exact: true }))
    .toHaveAttribute("href", "https://github.com/harsh-nod/fe2o3/blob/" + revision + "/examples/workgroup_sync_v1/src/kernel_mixed_tile_u32.rs");
  expect(await claim.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await withinViewportWidth(page);
  await claim.screenshot({ path: testInfo.outputPath("mixed-tile-evidence.png") });
  await checkScrollDetectorControls(page);
  await withinViewportWidth(page);
  expect(errors).toEqual([]);
});
