import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const ORIGIN_SHA = "ea02e063945404c28615f38049e7656ed5a5b0c9072ca58261742ea80359ee00";
const CAPSULE_SHA = "366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578";
const LABELS = ["one", "two", "fifteen", "repeat"] as const;

test("actual fresh whole-region origin stays mismatched with historical native cases and clears on replacement", async ({ page }) => {
  test.setTimeout(60_000);
  const framedOrigin = readFileSync("examples/ordered_program_origin_v1.json");
  expect(framedOrigin.length).toBe(3036); expect(framedOrigin.at(-1)).toBe(10);
  expect(createHash("sha256").update(framedOrigin).digest("hex")).toBe("35ad08b390e5bf30c7ffc0eedbac0dfae58c996bb920b07e597dfa730a4a0f24");
  // Strip only the independently pinned file's single framing LF, not arbitrary whitespace.
  const originBytes = framedOrigin.subarray(0, framedOrigin.length - 1);
  const capsuleBytes = readFileSync("examples/source_repeat_native_comparison_v1.json");
  expect(originBytes.length).toBe(3035); expect(capsuleBytes.length).toBe(1122815);
  expect(createHash("sha256").update(originBytes).digest("hex")).toBe(ORIGIN_SHA);
  expect(createHash("sha256").update(capsuleBytes).digest("hex")).toBe(CAPSULE_SHA);
  const origin = JSON.parse(originBytes.toString("utf8"));
  const capsule = JSON.parse(capsuleBytes.toString("utf8")) as { artifacts: Array<{ role: string; chunks: string[] }> };
  const sourceArtifact = capsule.artifacts.find(item => item.role === "sourceReceipt")!;
  const source = JSON.parse(sourceArtifact.chunks.join(""));
  // Independent actual-data mismatch oracle; equal source bytes do not establish origin custody.
  for (const variant of source.variants) {
    expect(variant.exported.canonical_sha256).not.toBe(origin.canonical_sha256);
    expect(variant.exported.semantic_identity).not.toBe(origin.semantic_sha256);
    expect(variant.exported.retained_source_inventory).not.toBe(origin.source_inventory_sha256);
    expect(variant.exported.retained_source_preflight).not.toBe(origin.source_preflight_sha256);
    expect(variant.inspection.declared_source_ids).not.toEqual(origin.declared_source_ids);
  }
  expect(source.variants[0].source_sha256).toBe("fa7634a5a1bc841db4b2a8ed5240b0184dfce8c79259fad6e04e60c66f5d08af");
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local repeat-native preview", exact: true }).click();
  const nativeImport = page.getByRole("region", { name: "Local repeat-native capsule import", exact: true });
  const nativeUpload = nativeImport.getByLabel("Repeat-native capsule (local JSON)", { exact: true });
  await page.waitForLoadState("networkidle");
  await nativeUpload.setInputFiles({ name: "retained-native.json", mimeType: "application/json", buffer: capsuleBytes });
  const viewer = nativeImport.getByRole("region", { name: "Bounded repeat-native comparison", exact: true });
  await expect(viewer.getByRole("table", { name: "Repeat-native cases and resources", exact: true }).locator("tbody tr")).toHaveCount(8);
  // Finish the initial lazy native-viewer load before observing origin-only actions.
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });
  const importer = viewer.getByRole("region", { name: "Optional ordered-origin import", exact: true });
  const upload = importer.getByLabel("Ordered-origin report (local JSON)", { exact: true });
  const report = importer.getByRole("region", { name: "Imported whole-region origin", exact: true });
  const originFile = { name: "actual-fresh-origin.json", mimeType: "application/json", buffer: originBytes };

  for (const label of LABELS) for (const optimization of ["O0", "O3"] as const) {
    await viewer.getByRole("button", { name: "Inspect " + label + " " + optimization, exact: true }).click();
    await expect(report).toHaveCount(0);
    await expect(importer.getByText("No ordered-origin report selected.", { exact: true })).toBeVisible();
    await expect(viewer.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true })).toHaveAttribute("aria-pressed", "false");
    await upload.setInputFiles(originFile);
    await expect(report.getByRole("status")).toHaveAttribute("data-state", "mismatch");
    await expect(report.getByText("These reports must not be joined.", { exact: false })).toBeVisible();
    const mismatches = report.getByRole("list", { name: "Origin identity mismatches", exact: true });
    for (const field of ["Canonical KIR identity", "Semantic MIR identity", "Source inventory identity", "Source preflight identity", "Declared source IDs"])
      await expect(mismatches.getByText(field, { exact: true })).toBeVisible();
    const callSite = report.getByRole("region", { name: "Source call-site span", exact: true });
    await expect(callSite.getByText("351..561", { exact: true })).toBeVisible();
    await expect(callSite.getByText("12:18 through 17:6", { exact: true })).toBeVisible();
    const expansion = report.getByRole("region", { name: "Macro expansion span", exact: true });
    await expect(expansion.getByText("9789..10074", { exact: true })).toBeVisible();
    await expect(expansion.getByText(origin.expansion.file_identity, { exact: true })).toBeVisible();
    expect(await report.locator("dl > div").evaluateAll(rows => rows.filter(row =>
      row.querySelector("dt")?.textContent === "Observed macro depth").map(row => row.querySelector("dd")?.textContent))).toEqual(["1"]);
    await expect(report.getByText(/Unavailable: per-instruction source spans/u)).toBeVisible();
    await expect(report.getByRole("link")).toHaveCount(0);
    await expect(report.locator('[data-state="matching_reported_identities"]')).toHaveCount(0);
    await viewer.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true }).click();
    await expect(viewer.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await importer.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }

  await upload.setInputFiles({ name: "invalid-replacement.json", mimeType: "application/json",
    buffer: Buffer.from(originBytes.toString("utf8").replace('"diagnostic_only":true', '"diagnostic_only":true, "diagnostic_only":true')) });
  await expect(importer.getByText(/Ordered-origin report refused/u)).toBeVisible();
  await expect(report).toHaveCount(0);
  await expect(viewer.getByRole("table", { name: "Repeat-native cases and resources", exact: true }).locator("tbody tr")).toHaveCount(8);
  await upload.setInputFiles(originFile); await expect(report.getByRole("status")).toHaveAttribute("data-state", "mismatch");
  await importer.getByRole("button", { name: "Clear ordered-origin import", exact: true }).click();
  await expect(report).toHaveCount(0);
  await upload.setInputFiles(originFile); await expect(report).toBeVisible();
  await nativeImport.getByRole("button", { name: "Clear repeat-native import", exact: true }).click();
  await expect(importer).toHaveCount(0);
  await nativeUpload.setInputFiles({ name: "retained-native.json", mimeType: "application/json", buffer: capsuleBytes });
  await expect(importer.getByText("No ordered-origin report selected.", { exact: true })).toBeVisible();
  await expect(viewer.getByRole("button", { name: "Inspect one O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close local repeat-native preview", exact: true }).click();
  await expect(nativeImport).toHaveCount(0);
  expect(requests).toEqual([]);
});
