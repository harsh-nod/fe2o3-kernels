import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const base = resolve("public/diagnostics/physical-lds-v22");
const file = (name: string) => resolve(base, name);
const responses = readFileSync(file("one-output129.responses.jsonl"), "utf8").trimEnd().split("\n").map(line => JSON.parse(line));
const value = (row: (typeof responses)[number], id: number) =>
  row.result?.values?.find((v: { path: { root: { value_ordinal: number } } }) => v.path.root.value_ordinal === id)?.availability;
const pending = responses.findIndex(r => r.result?.snapshot?.scope?.logical_workitem?.[0] === 64 && value(r, 26)?.status === "unavailable");
const ready = responses.findIndex((r, i) => i > pending && r.result?.snapshot?.scope?.logical_workitem?.[0] === 64 && value(r, 26)?.status === "captured");
const refusal = responses.findIndex(r => r.status === "unavailable");
const memory = responses.findIndex(r => r.result?.memory?.availability?.address_space === "workgroup");
for (const theme of ["light", "dark"]) {
  test("real LDS recordings and keyboard navigation " + theme, async ({ page }) => {
    const errors: string[] = [], writes: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("request", r => { if (r.method() !== "GET") writes.push(r.method()); });
    await page.addInitScript(t => localStorage.setItem("fe2o3-kernels-theme", t), theme);
    await page.goto("./#/debugger/source-isa-agent");
    await page.getByRole("link", { name: "Recorded two-wave LDS CPU debugger (V22)" }).click();
    await expect(page).toHaveTitle("Recorded two-wave LDS CPU debugger | fe2o3 kernels");
    const load = page.getByRole("button", { name: /Original registers/ });
    await load.focus(); await page.keyboard.press("Enter");
    const view = page.getByRole("region", { name: "Checked recorded CPU observations" });
    await expect(view).toBeVisible();
    await expect(view).toContainText("8833 indexed events, 88 recorded protocol pairs");
    await expect(page.getByRole("region", { name: "Logical wave 0" }).getByRole("button")).toHaveCount(64);
    await expect(page.getByRole("region", { name: "Logical wave 1" }).getByRole("button")).toHaveCount(64);
    await page.getByRole("region", { name: "Logical wave 1" }).getByRole("button", { name: "0", exact: true }).click();
    await expect(view).toContainText("Local X=64, logical wave=1, lane=0");
    await page.getByRole("button", { name: "Jump to recorded release" }).click();
    await expect(view).toContainText("128 /128 arrivals observed");
    const query = page.getByRole("combobox", { name: "Recorded request" });
    expect(pending).toBeGreaterThan(0); expect(ready).toBeGreaterThan(pending);
    await query.selectOption(String(pending));
    const values = page.getByRole("table", { name: "Selected checkpoint SSA values" });
    await expect(values).toContainText("not_represented");
    await query.selectOption(String(ready)); await expect(values).toContainText(value(responses[ready], 26).value.bits);
    await query.selectOption(String(memory)); await expect(page.locator(".lds-memory")).toContainText("??");
    await expect(values).toHaveCount(0);
    await query.selectOption(String(refusal)); await expect(page.locator(".lds-memory")).toHaveCount(0);
    await expect(values).toHaveCount(0); await expect(view).toContainText("Previous values are not carried forward");
    const next = page.getByRole("button", { name: "Next index page" });
    await next.focus(); await page.keyboard.press("Enter");
    await expect(page.locator(".lds-table-scroll tbody tr")).toHaveCount(64);
    await page.getByRole("button", { name: /Edited registers/ }).click();
    await expect(view).toContainText("8718 indexed events, 88 recorded protocol pairs");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: test.info().outputPath("lds-" + theme + ".png"), fullPage: true });
    expect(writes).toEqual([]); expect(errors).toEqual([]);
  });
}
test("local replacement, exact files and clear remove previous values", async ({ page }) => {
  await page.goto("./#/debugger/lds-cpu-recording-v22");
  await page.getByRole("button", { name: /Original registers/ }).click();
  const view = page.getByRole("region", { name: "Checked recorded CPU observations" });
  await expect(view).toBeVisible();
  await page.getByLabel("V22 index file").setInputFiles(file("one-output129.index.gzip"));
  await expect(view).toHaveCount(0);
  for (const [kind, suffix] of [["document", "request.json"], ["requests", "requests.jsonl"], ["responses", "responses.jsonl"]])
    await page.getByLabel("V22 " + kind + " file").setInputFiles(file("one-output129." + suffix));
  await page.getByRole("button", { name: "Read selected files" }).click(); await expect(view).toBeVisible();
  await page.getByLabel("V22 index file").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await expect(view).toHaveCount(0);
  await page.getByRole("button", { name: "Read selected files" }).click();
  await expect(page.getByRole("region", { name: "Select recorded input" }).getByRole("status")).toContainText("Recording refused");
  await page.getByRole("button", { name: "Clear / cancel" }).click();
  await expect(page.getByRole("button", { name: "Read selected files" })).toBeDisabled();
  await expect(page.getByLabel("V22 index file")).toHaveValue("");
  await expect(view).toHaveCount(0);
});
test("missing streaming gzip refuses without fallback or partial values", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(globalThis, "DecompressionStream", { value: undefined }));
  await page.goto("./#/debugger/lds-cpu-recording-v22");
  await page.getByRole("button", { name: /Original registers/ }).click();
  await expect(page.getByRole("region", { name: "Select recorded input" }).getByRole("status")).toContainText("Gzip decompression is unavailable");
  await expect(page.getByRole("region", { name: "Checked recorded CPU observations" })).toHaveCount(0);
});
