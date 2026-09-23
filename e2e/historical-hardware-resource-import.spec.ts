import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { hardwareCaptureJson, hardwareId, syntheticHardwareCapture,
  syntheticHardwareUnavailable } from "../tests/fixtures/synthetic-hardware-resource-capture";

test("synthetic historical hardware import stays local, unavailable-aware and separate from live owners", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("./#/debugger/live-kfd");
  await page.getByRole("button", { name: "Open historical hardware capture", exact: true }).click();
  const importer = page.getByRole("region", { name: "Historical hardware resource import", exact: true });
  await expect(importer).toBeVisible();
  // Initial navigation and the fixed lazy module fetch are outside this local-action assertion.
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });
  const input = importer.getByLabel("Historical hardware capture (local JSON)", { exact: true });
  const upload = async (value: unknown, name = "synthetic-hardware-capture.json") => {
    await input.setInputFiles({ name, mimeType: "application/json", buffer: Buffer.from(hardwareCaptureJson(value)) });
    await expect(importer.getByRole("table")).toHaveCount(0);
    await importer.getByRole("button", { name: "Import historical hardware capture", exact: true }).click();
  };
  const fixture = syntheticHardwareCapture(70);
  await upload(fixture);
  const table = importer.getByRole("table", { name: "Historical hardware register values", exact: true });
  await expect(table.locator("tbody tr")).toHaveCount(64);
  await expect(importer.getByText(/Historical \/ caller-supplied \/ untrusted/u)).toBeVisible();
  await expect(importer.getByText("gfx942:xnack- / Wave64", { exact: true })).toBeVisible();
  await expect(table.getByText("0xffffffffffffffff", { exact: true })).toBeVisible();
  await expect(table.getByText("Redacted", { exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: /^Unavailable\s*unavailable\s*unsupported$/u })).toBeVisible();
  await expect(importer.getByRole("region", { name: "Unavailable hardware capture fields", exact: true }))
    .toContainText("requires_allocation_relative_authority");
  await importer.getByText("Exact reported artifact and stop identities", { exact: true }).click();
  const binding = importer.getByRole("region", { name: "Historical target and stop binding", exact: true });
  await expect(binding.getByText(hardwareId(9), { exact: true })).toBeVisible();
  await expect(binding.getByText(hardwareId(3), { exact: true })).toBeVisible();
  await expect(binding.getByText(hardwareId(4), { exact: true })).toBeVisible();
  await importer.getByRole("button", { name: "Inspect register s4", exact: true }).click();
  await expect(importer.getByRole("region", { name: "Selected historical register", exact: true })).toBeVisible();
  await importer.getByRole("combobox", { name: "Historical register page", exact: true }).selectOption("1");
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await expect(importer.getByRole("region", { name: "Selected historical register", exact: true })).toHaveCount(0);
  await importer.getByRole("combobox", { name: "Historical register page", exact: true }).selectOption("0");
  expect(await importer.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await importer.evaluate(element => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: testInfo.outputPath("historical-hardware-synthetic.png"), fullPage: false });

  const stale = syntheticHardwareCapture(); stale.result.projection.registers.scope.stop_identity = hardwareId(99);
  await upload(stale, "synthetic-stale-scope.json");
  await expect(importer.getByRole("alert")).toContainText("Historical capture refused");
  await expect(table).toHaveCount(0);
  await upload(syntheticHardwareUnavailable(), "synthetic-unavailable.json");
  await expect(importer.getByText(/Historical capture unavailable: native_capture \/ rocgdb_spawn_failed/u)).toBeVisible();
  await expect(binding).toHaveCount(0);
  await upload(fixture);
  await expect(table.locator("tbody tr")).toHaveCount(64);
  await expect(importer.getByRole("button", { name: "Inspect register s4", exact: true })).toHaveAttribute("aria-pressed", "false");
  await importer.getByRole("button", { name: "Reset historical hardware import", exact: true }).click();
  await expect(table).toHaveCount(0);
  await page.getByRole("button", { name: "Close historical hardware capture", exact: true }).click();
  await expect(importer).toHaveCount(0);
  await page.getByRole("button", { name: "Open historical hardware capture", exact: true }).click();
  await expect(importer.getByText("No historical hardware capture selected.", { exact: true })).toBeVisible();
  expect(requests).toEqual([]);
});

test("actual retained nonlaunch refusal imports without inventing hardware rows", async ({ page }, testInfo) => {
  const bytes = readFileSync("examples/hardware_resource_unavailable_v1.jsonl");
  const digest = "1c0cfc1cf252216e8b5a91c8603552521b97a68dc8e7ede3f3002147d26988d6";
  expect(bytes.length).toBe(486);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(digest);
  await page.goto("./#/debugger/live-kfd");
  await page.getByRole("button", { name: "Open historical hardware capture", exact: true }).click();
  const importer = page.getByRole("region", { name: "Historical hardware resource import", exact: true });
  await expect(importer).toBeVisible();
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });
  await importer.getByLabel("Historical hardware capture (local JSON)", { exact: true }).setInputFiles({
    name: "actual-nonlaunch-unavailable.jsonl", mimeType: "application/x-ndjson", buffer: bytes,
  });
  await expect(importer.getByText("486 bytes", { exact: true })).toHaveCount(0);
  await importer.getByRole("button", { name: "Import historical hardware capture", exact: true }).click();
  await expect(importer.getByText(/Historical capture unavailable: native_capture \/ direct_kfd_device_unavailable/u)).toBeVisible();
  await expect(importer.getByText("486 bytes", { exact: true })).toBeVisible();
  await expect(importer.getByText(digest, { exact: true })).toBeVisible();
  await expect(importer.getByRole("table")).toHaveCount(0);
  await expect(importer.getByRole("region", { name: "Historical target and stop binding", exact: true })).toHaveCount(0);
  await importer.getByText("Reported command-registry probes", { exact: true }).click();
  const probes = importer.locator("details").filter({ has: page.getByText("Reported command-registry probes", { exact: true }) });
  await expect(probes.locator("dd")).toHaveText([
    "Reported supported", "Reported unavailable", "Reported unavailable", "Reported unavailable",
    "Reported supported", "Reported supported", "Reported supported", "Reported supported", "Reported supported",
  ]);
  await expect(probes).toContainText("Registry discovery does not establish that an inspection succeeded.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await importer.screenshot({ path: testInfo.outputPath("actual-nonlaunch-unavailable.png") });
  await importer.getByRole("button", { name: "Reset historical hardware import", exact: true }).click();
  await expect(importer.getByText(digest, { exact: true })).toHaveCount(0);
  expect(requests).toEqual([]);
});
