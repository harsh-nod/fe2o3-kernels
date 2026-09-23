import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const LABELS = ["one", "two", "fifteen", "repeat"] as const;
const CAPSULE_SHA = "da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d";
const ORIGIN_PINS = [
  [3035, "e833f05554e9973f911324fe62c34114dc1b5ec82ddcb4726c594d7b39e9b0ed"],
  [3115, "91c5efeaef9b07fbe537aa1f170a0998b43db8de32d7f02d237c72dfb3ae8c56"],
  [4161, "bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a"],
  [4161, "bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a"],
] as const;
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

test("actual same-export origin reports join eight native cases and clear on mismatched replacement", async ({ page }) => {
  test.setTimeout(60_000);
  const capsuleBytes = readFileSync("examples/source_repeat_native_origin_comparison_v1.json");
  expect(capsuleBytes.length).toBe(1105533); expect(hash(capsuleBytes)).toBe(CAPSULE_SHA);
  const originBytes = LABELS.map((label, index) => {
    const bytes = readFileSync("examples/source_repeat_origin_" + label + "_v1.json");
    expect(bytes.length).toBe(ORIGIN_PINS[index][0]); expect(hash(bytes)).toBe(ORIGIN_PINS[index][1]);
    return bytes;
  });
  const origins = originBytes.map(bytes => JSON.parse(bytes.toString("utf8")));
  const capsule = JSON.parse(capsuleBytes.toString("utf8")) as { artifacts: Array<{ role: string; chunks: string[] }> };
  const source = JSON.parse(capsule.artifacts.find(item => item.role === "sourceReceipt")!.chunks.join(""));
  // Independent actual-receipt oracle, without constructing matching positive observations.
  for (const [index, variant] of source.variants.entries()) {
    const origin = origins[index];
    expect(variant.exported.canonical_sha256).toBe(origin.canonical_sha256);
    expect(variant.exported.semantic_identity).toBe(origin.semantic_sha256);
    expect(variant.exported.retained_source_inventory).toBe(origin.source_inventory_sha256);
    expect(variant.exported.retained_source_preflight).toBe(origin.source_preflight_sha256);
    expect(variant.inspection.declared_source_ids).toEqual(origin.declared_source_ids);
    expect(variant.inspection.canonical.bytes).toBe(origin.canonical_bytes);
    expect(variant.inspection.declared_program.descriptors.slice(0, variant.inspection.declared_program.count))
      .toEqual(origin.declared_instructions.map((item: { descriptor: number }) => item.descriptor));
  }
  await page.goto("./#/debugger/source-isa-agent");
  const section = page.getByRole("region", { name: "Compare same-export origin and native captures", exact: true });
  await section.getByRole("button", { name: "Open same-export origin/native preview", exact: true }).click();
  const importer = section.getByRole("region", { name: "Local repeat-native capsule import", exact: true });
  await expect(importer.getByText("7c93ef31321a2b47d470724ecc982e35571981bf3f6eef9c00861a20fb85d115", { exact: true })).toBeVisible();
  const uploadNative = importer.getByLabel("Repeat-native capsule (local JSON)", { exact: true });
  await page.waitForLoadState("networkidle");
  await uploadNative.setInputFiles({ name: "same-export.json", mimeType: "application/json", buffer: capsuleBytes });
  const viewer = importer.getByRole("region", { name: "Bounded repeat-native comparison", exact: true });
  await expect(viewer.getByRole("table", { name: "Repeat-native cases and resources", exact: true }).locator("tbody tr")).toHaveCount(8);
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });
  const originImporter = viewer.getByRole("region", { name: "Optional ordered-origin import", exact: true });
  const uploadOrigin = originImporter.getByLabel("Ordered-origin report (local JSON)", { exact: true });
  const report = originImporter.getByRole("region", { name: "Imported whole-region origin", exact: true });
  const originFile = (index: number) => ({ name: LABELS[index] + ".origin.json", mimeType: "application/json", buffer: originBytes[index] });

  for (const [index, label] of LABELS.entries()) for (const optimization of ["O0", "O3"] as const) {
    await viewer.getByRole("button", { name: "Inspect " + label + " " + optimization, exact: true }).click();
    await expect(report).toHaveCount(0);
    await expect(originImporter.getByText("No ordered-origin report selected.", { exact: true })).toBeVisible();
    await expect(viewer.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true })).toHaveAttribute("aria-pressed", "false");
    await uploadOrigin.setInputFiles(originFile(index));
    await expect(report.getByRole("status")).toHaveAttribute("data-state", "matching_reported_identities");
    await expect(report.getByRole("list", { name: "Origin identity mismatches", exact: true })).toHaveCount(0);
    await expect(report.getByText(/consistency only, not authenticated provenance/u)).toBeVisible();
    const expected = origins[index];
    const call = report.getByRole("region", { name: "Source call-site span", exact: true });
    await expect(call.getByText(expected.call_site.byte_start + ".." + expected.call_site.byte_end, { exact: true })).toBeVisible();
    const expansion = report.getByRole("region", { name: "Macro expansion span", exact: true });
    await expect(expansion.getByText(expected.expansion.file_identity, { exact: true })).toBeVisible();
    await expect(report.getByText(expected.expansion_chain_sha256, { exact: true })).toBeVisible();
    await expect(report.getByText(expected.declared_instructions.map((item: { descriptor: number }) => item.descriptor).join(", "), { exact: true })).toBeVisible();
    await expect(viewer.getByRole("table", { name: "Repeat-native exact instruction bytes", exact: true }).locator("tbody tr"))
      .toHaveCount([2, 3, 16, 16][index]);
    await expect(report.getByText(/Unavailable: per-instruction source spans/u)).toBeVisible();
    await expect(report.getByRole("link")).toHaveCount(0);

    await uploadOrigin.setInputFiles(originFile(index === 0 ? 1 : 0));
    await expect(report.getByRole("status")).toHaveAttribute("data-state", "mismatch");
    await expect(report.getByRole("list", { name: "Origin identity mismatches", exact: true })
      .getByText("Canonical KIR identity", { exact: true })).toBeVisible();
    await uploadOrigin.setInputFiles(originFile(index));
    await expect(report.getByRole("status")).toHaveAttribute("data-state", "matching_reported_identities");
    await viewer.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true }).click();
    await expect(viewer.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await originImporter.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }

  await uploadOrigin.setInputFiles({ name: "bad-origin.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await expect(originImporter.getByText(/Ordered-origin report refused/u)).toBeVisible();
  await expect(report).toHaveCount(0);
  await uploadOrigin.setInputFiles(originFile(3));
  await expect(report.getByRole("status")).toHaveAttribute("data-state", "matching_reported_identities");
  await originImporter.getByRole("button", { name: "Clear ordered-origin import", exact: true }).click();
  await expect(report).toHaveCount(0);

  // Correct historical file, wrong application-selected join: no old case survives.
  const historical = readFileSync("examples/source_repeat_native_comparison_v1.json");
  expect(hash(historical)).toBe("366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578");
  await uploadNative.setInputFiles({ name: "historical-wrong-capture.json", mimeType: "application/json", buffer: historical });
  await expect(viewer.locator('[data-state="invalid"]')).toBeVisible();
  await expect(originImporter).toHaveCount(0);
  await uploadNative.setInputFiles({ name: "same-export.json", mimeType: "application/json", buffer: capsuleBytes });
  await expect(viewer.getByRole("button", { name: "Inspect one O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(originImporter.getByText("No ordered-origin report selected.", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "Close same-export origin/native preview", exact: true }).click();
  await expect(importer).toHaveCount(0);
  expect(requests).toEqual([]);
});
