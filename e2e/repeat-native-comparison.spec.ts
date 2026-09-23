import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const JOIN = "7b13ad313fc51715c45f387ea1258e85365a2a526b66ba88002350fea04c4661";
const CAPSULE = "366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578";
const CASES = [
  { label: "one", opt: "O0", adds: 1, capacity: 56, bytes: 6224, staticCount: 104 },
  { label: "one", opt: "O3", adds: 1, capacity: 40, bytes: 5456, staticCount: 19 },
  { label: "two", opt: "O0", adds: 2, capacity: 56, bytes: 6224, staticCount: 105 },
  { label: "two", opt: "O3", adds: 2, capacity: 40, bytes: 5456, staticCount: 20 },
  { label: "fifteen", opt: "O0", adds: 15, capacity: 56, bytes: 6288, staticCount: 118 },
  { label: "fifteen", opt: "O3", adds: 15, capacity: 40, bytes: 5520, staticCount: 33 },
  { label: "repeat", opt: "O0", adds: 15, capacity: 56, bytes: 6288, staticCount: 118 },
  { label: "repeat", opt: "O3", adds: 15, capacity: 40, bytes: 5520, staticCount: 33 },
] as const;

test("retained repeat-native example displays all eight local cases and clears invalid or replaced selections", async ({ page }) => {
  test.setTimeout(60_000);
  const capsule = readFileSync("examples/source_repeat_native_comparison_v1.json");
  expect(capsule.length).toBe(1122815);
  expect(createHash("sha256").update(capsule).digest("hex")).toBe(CAPSULE);
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open local repeat-native preview", exact: true }).click();
  const importer = page.getByRole("region", { name: "Local repeat-native capsule import", exact: true });
  const viewer = importer.getByRole("region", { name: "Bounded repeat-native comparison", exact: true });
  const upload = importer.getByLabel("Repeat-native capsule (local JSON)", { exact: true });
  await expect(importer.getByText("No local repeat-native capsule selected.", { exact: true })).toBeVisible();
  await expect(viewer).toHaveCount(0);
  await expect(importer.getByText(JOIN, { exact: true })).toBeVisible();
  // Finish the ordinary route/lazy-module load before observing import behavior.
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });
  const file = { name: "source_repeat_native_comparison_v1.json", mimeType: "application/json", buffer: capsule };
  await upload.setInputFiles(file);
  const resources = viewer.getByRole("table", { name: "Repeat-native cases and resources", exact: true });
  await expect(resources.locator("tbody tr")).toHaveCount(8);
  await expect(viewer.getByText(/Retained source and native code-object observations/u)).toBeVisible();
  await expect(viewer.getByText(/Content hashes are not producer authentication/u)).toBeVisible();

  for (const [index, current] of CASES.entries()) {
    const button = viewer.getByRole("button", { name: "Inspect " + current.label + " " + current.opt, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(resources.locator("tbody tr").nth(index).getByRole("cell"))
      .toHaveText([String(current.adds + 1), "37", String(current.capacity), "40", String(current.bytes)]);
    const selected = viewer.getByRole("region", { name: "Selected repeat-native case", exact: true });
    await expect(selected.getByRole("heading")).toHaveText(
      current.label + " " + current.opt + ": " + current.adds + " adds, " + (current.adds + 1) + " declared instructions");
    const instructions = selected.getByRole("table", { name: "Repeat-native exact instruction bytes", exact: true });
    await expect(instructions.locator("tbody tr")).toHaveCount(current.adds + 1);
    const first = current.opt === "O3" ? 2348 : 2692;
    expect(await instructions.locator("tbody tr").evaluateAll(rows => rows.map(row =>
      Array.from(row.querySelectorAll("td"), cell => cell.textContent))))
      .toEqual(Array.from({ length: current.adds + 1 }, (_, at) => [
        at === 0 ? "V_MOV_B32_e32_vi" : "V_ADD_U32_e32_gfx9",
        at === 0 ? "2203427e" : "21474268",
        at === 0 ? "VGPR33, VGPR34" : "VGPR33, VGPR33, VGPR35", String(first + 4 * at),
      ]));
    await expect(selected.getByText("The retained report lists " + current.staticCount +
      " static instructions in the whole entry.", { exact: false })).toBeVisible();
    await expect(selected.getByText("Descriptor: 64 bytes at payload offset " +
      (current.opt === "O3" ? 2112 : 2368) + ".", { exact: false })).toBeVisible();
    const roles = selected.getByRole("table", { name: "Declared VGPR roles by retained instruction", exact: true });
    await expect(roles.locator("tbody tr")).toHaveCount(5);
    expect(await roles.locator("tbody tr").evaluateAll(rows => rows.map(row =>
      Array.from(row.querySelectorAll("td"), cell => cell.textContent))))
      .toEqual([
        Array(current.adds + 1).fill("No explicit use"), ["Write", ...Array(current.adds).fill("Read + write")],
        ["Read", ...Array(current.adds).fill("No explicit use")], ["No explicit use", ...Array(current.adds).fill("Read")],
        Array(current.adds + 1).fill("No explicit use"),
      ]);
    for (const [register, role] of [[32, "scratch"], [36, "input2"]] as const) {
      const roleButton = roles.getByRole("button", { name: "Inspect VGPR" + register + " " + role, exact: true });
      await roleButton.click();
      await expect(roleButton).toHaveAttribute("aria-pressed", "true");
      await expect(selected.getByText("declared, with no explicit uses in this selected region.", { exact: false })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await expect(viewer.getByText(/No explicit use does not mean free, dead, or uninitialized/u)).toBeVisible();
  await importer.getByRole("button", { name: "Clear repeat-native import", exact: true }).click();
  await expect(viewer).toHaveCount(0);
  await expect(importer.getByText("No local repeat-native capsule selected.", { exact: true })).toBeVisible();
  await upload.setInputFiles(file);
  await expect(resources.locator("tbody tr")).toHaveCount(8);
  await expect(viewer.getByRole("button", { name: "Inspect one O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(viewer.getByRole("button", { name: "Inspect VGPR36 input2", exact: true })).toHaveAttribute("aria-pressed", "false");

  // Rehash an altered real join: upload-provided digests cannot replace the independent app pin.
  const changed = JSON.parse(capsule.toString("utf8")) as {
    artifacts: Array<{ role: string; bytes: number; sha256: string; chunks: string[] }>;
  };
  const join = changed.artifacts.find(item => item.role === "join")!;
  const changedJoin = join.chunks.join("").replace('"status": "passed"', '"status": "failed"');
  expect(changedJoin).not.toBe(join.chunks.join(""));
  join.bytes = Buffer.byteLength(changedJoin);
  join.sha256 = createHash("sha256").update(changedJoin).digest("hex");
  join.chunks = Array.from({ length: Math.ceil(changedJoin.length / 65536) }, (_, i) =>
    changedJoin.slice(i * 65536, (i + 1) * 65536));
  await upload.setInputFiles({ name: "wrong-join.json", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(changed)) });
  await expect(viewer.locator('[role="status"][data-state="invalid"]')).toBeVisible();
  await expect(resources).toHaveCount(0);
  await expect(viewer.getByRole("region", { name: "Selected repeat-native case", exact: true })).toHaveCount(0);
  await upload.setInputFiles(file);
  await expect(resources.locator("tbody tr")).toHaveCount(8);
  await expect(viewer.getByRole("button", { name: "Inspect one O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Close local repeat-native preview", exact: true }).click();
  await expect(importer).toHaveCount(0);
  expect(requests).toEqual([]);
});
