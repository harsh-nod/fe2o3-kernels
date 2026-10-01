import { expect, test } from "@playwright/test";
import { hardwareCaptureJson, hardwareId, syntheticHardwareCapture,
  syntheticHardwareUnavailable } from "../tests/fixtures/synthetic-hardware-resource-capture";

test("historical EXEC bits remain exact, passive and unavailable-aware in the browser", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const diagnostics: string[] = [];
  page.on("pageerror", error => diagnostics.push(error.message));
  page.on("console", message => { if (message.type() === "error") diagnostics.push(message.text()); });
  await page.goto("./#/debugger/live-kfd");
  await page.getByRole("button", { name: "Open historical hardware capture", exact: true }).click();
  const importer = page.getByRole("region", { name: "Historical hardware resource import", exact: true });
  await expect(importer).toBeVisible();
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => requests.push(request.method() + " " + request.url()));
  const input = importer.getByLabel("Historical hardware capture (local JSON)", { exact: true });
  const panel = importer.getByRole("region", { name: "Historical reported EXEC mask", exact: true });
  const bits = panel.getByRole("list", { name: "Historical reported EXEC bits", exact: true });
  const upload = async (value: unknown, name: string) => {
    await input.setInputFiles({ name, mimeType: "application/json", buffer: Buffer.from(hardwareCaptureJson(value)) });
    await expect(panel).toHaveCount(0);
    await importer.getByRole("button", { name: "Import historical hardware capture", exact: true }).click();
  };
  // Synthetic presentation input only; this is not a hardware capture.
  const capture = syntheticHardwareCapture(70);
  const rows = capture.result.projection.registers.registers;
  const [exec] = rows.splice(1, 1);
  exec.value.value!.bits = "8000000000000001";
  rows.push(exec); // A complete-roster lookup, beyond the first 64 displayed registers.
  await upload(capture, "synthetic-exec-high-low.json");
  await expect(bits.getByRole("listitem")).toHaveCount(64);
  await expect(bits.getByRole("listitem", { name: "Lane 0: EXEC bit set (1)", exact: true })).toBeVisible();
  await expect(bits.getByRole("listitem", { name: "Lane 63: EXEC bit set (1)", exact: true })).toBeVisible();
  await expect(bits.getByRole("listitem", { name: "Lane 1: EXEC bit clear (0)", exact: true })).toBeVisible();
  await expect(panel.getByText(/2 of 64 EXEC bits set/u)).toBeVisible();
  await expect(panel.getByText(/Historical EXEC claim \/ caller-supplied \/ untrusted/u)).toBeVisible();
  await expect(bits.getByRole("button")).toHaveCount(0);
  await expect(bits.locator("[tabindex]")).toHaveCount(0);
  await expect(importer.getByRole("table").locator("tbody tr")).toHaveCount(64);
  expect(await bits.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await panel.scrollIntoViewIfNeeded();
  await panel.screenshot({ path: testInfo.outputPath("synthetic-historical-exec-bits.png") });

  const zero = structuredClone(capture);
  zero.result.projection.registers.registers.at(-1)!.value.value!.bits = "0000000000000000";
  await upload(zero, "synthetic-exec-zero.json");
  await expect(bits.getByRole("listitem")).toHaveCount(64);
  await expect(bits.locator('[data-enabled="true"]')).toHaveCount(0);
  await expect(bits.locator('[data-enabled="false"]')).toHaveCount(64);
  await expect(panel.getByText(/0 of 64 EXEC bits set/u)).toBeVisible();

  const ambiguous = structuredClone(capture);
  ambiguous.result.projection.registers.registers.push({ ...structuredClone(exec), register_identity: hardwareId(900) });
  await upload(ambiguous, "synthetic-exec-ambiguous.json");
  await expect(panel.getByRole("status")).toContainText("ambiguous_exec");
  await expect(bits).toHaveCount(0);
  await expect(importer.getByRole("table")).toHaveCount(1);

  await upload(syntheticHardwareUnavailable(), "synthetic-hardware-unavailable.json");
  await expect(importer.getByText(/Historical capture unavailable: native_capture \/ rocgdb_spawn_failed/u)).toBeVisible();
  await expect(panel).toHaveCount(0);
  await expect(importer.getByRole("table")).toHaveCount(0);
  await upload(capture, "synthetic-exec-replacement.json");
  await expect(bits.getByRole("listitem")).toHaveCount(64);
  await importer.getByRole("button", { name: "Reset historical hardware import", exact: true }).click();
  await expect(panel).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(diagnostics).toEqual([]);
});
