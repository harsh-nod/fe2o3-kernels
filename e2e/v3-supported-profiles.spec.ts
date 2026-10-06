import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Independent retained-file pins, not recomputed matching positive observations.
const FIXTURES = {
  cpu: ["examples/ordinary_bitwise_promotion_v1.json", 69861, "92194476568e2f6abef0264d4ae8580515ac71189c4381a6c8cead3f19d791ed"],
  final: ["examples/source_instruction_native_comparison_v1.json", 503416, "0b4a9689524965929d1e9b102d7802e737e068293f74fa28d0148ab49238cc04"],
  same: ["examples/source_repeat_native_origin_comparison_v1.json", 1105533, "da03af2e891ce46a15ded574cf374a453df64404199770d9c1ba11890f67ad0d"],
  historical: ["examples/source_repeat_native_comparison_v1.json", 1122815, "366fec40482151396b5328818b30a1c00258872323ff6c9bd99ba4d1670e2578"],
  one: ["examples/source_repeat_origin_one_v1.json", 3035, "e833f05554e9973f911324fe62c34114dc1b5ec82ddcb4726c594d7b39e9b0ed"],
  two: ["examples/source_repeat_origin_two_v1.json", 3115, "91c5efeaef9b07fbe537aa1f170a0998b43db8de32d7f02d237c72dfb3ae8c56"],
  fifteen: ["examples/source_repeat_origin_fifteen_v1.json", 4161, "bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a"],
  repeat: ["examples/source_repeat_origin_repeat_v1.json", 4161, "bb17f1b6803615664d1aa22941e8d807aaebf083aeb1eefe227f4f08f1afd03a"],
} as const;
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
function retained(key: keyof typeof FIXTURES) {
  const [path, bytes, sha256] = FIXTURES[key];
  const body = readFileSync(path);
  expect(body.length).toBe(bytes);
  expect(hash(body)).toBe(sha256);
  return body;
}
const upload = (name: string, buffer: Buffer) => ({ name, mimeType: "application/json", buffer });

test("V3 supported profiles keep their own origins, variants and native resources without authority", async ({ page }) => {
  test.setTimeout(60_000);
  retained("cpu"); retained("final");
  const same = retained("same");
  const mutations: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET") mutations.push(request.method() + " " + request.url());
  });
  await page.goto("./#/debugger/source-isa-agent");

  const cpu = page.getByTestId("recorded-source-promotion");
  await cpu.getByRole("button", { name: "Open actual source comparison", exact: true }).click();
  const cpuRows = cpu.getByRole("table", { name: "Independent CPU case comparison", exact: true });
  await expect(cpuRows.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
  const final = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
  const resources = final.getByRole("table", { name: "Declared and encoded native resources", exact: true });
  await expect(resources.locator("tbody tr")).toHaveCount(4);
  const sameSection = page.getByRole("region", { name: "Compare same-export origin and native captures", exact: true });
  await sameSection.getByRole("button", { name: "Open same-export origin/native preview", exact: true }).click();
  const importer = sameSection.getByRole("region", { name: "Local repeat-native capsule import", exact: true });
  const nativeInput = importer.getByLabel("Repeat-native capsule (local JSON)", { exact: true });
  await nativeInput.setInputFiles(upload("same-export.json", same));
  const repeated = importer.getByRole("region", { name: "Bounded repeat-native comparison", exact: true });
  await expect(repeated.getByRole("table", { name: "Repeat-native cases and resources", exact: true }).locator("tbody tr")).toHaveCount(8);
  // Navigation/lazy module loads precede this boundary. All subsequent inspection,
  // local imports, refusal, clearing and reopening must make zero requests.
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", request => { requests.push(request.method() + " " + request.url()); });

  for (const [index, name, source] of [
    [0, "Original ordinary Rust", null],
    [1, "Unchanged generated helper", "v_or_b32"],
    [2, "Edited OR to AND helper", "v_and_b32"],
  ] as const) {
    const tab = cpu.getByRole("tab", { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(cpu.getByRole("region", { name: "Selected operation detail", exact: true })).toHaveCount(0);
    await expect(cpuRows.locator("tbody tr").nth(index).getByRole("cell").first()).toHaveText(index === 2 ? "0 each" : "469 each");
    if (source !== null) await expect(cpu.getByRole("tabpanel").locator("pre[aria-label]")).toContainText(source);
    await cpu.getByRole("button", { name: /Inspect operation/u }).first().click();
    await expect(cpu.getByRole("region", { name: "Selected operation detail", exact: true }))
      .toContainText("Physical registers and exact machine encoding are unavailable.");
  }
  await expect(cpu.getByText(/Coordinates are local to this snapshot/u)).toBeVisible();
  await cpu.getByText("Fresh source and executable identities", { exact: true }).click();
  await expect(cpu.getByRole("table", { name: "Exact variant identities", exact: true }).locator("tbody tr")).toHaveCount(6);

  // This is a different retained source: XOR→OR, not the CPU example's OR→AND.
  const nativeCases = [
    ["default", "O0", "24", "6152", "2692", "01090a2a", "0786de8ada4300d144018ac871fe384065b0f225b8e25dc423bc6c8a3454ba41"],
    ["default", "O3", "8", "5384", "2340", "01090a2a", "9484ee4d7f5f75730367a49ed960e4608ce07fb76c3415bb91e302f1ddea49c7"],
    ["edited", "O0", "24", "6152", "2692", "01090a28", "f39f619d9db7dc56f72b31dae527b926f9cf65004c2dd8e92092e77331f11a04"],
    ["edited", "O3", "8", "5384", "2340", "01090a28", "e37254dc428d1bdb680fccd3c3f52769caa6b85d24e070aba0d4935c780709cd"],
  ] as const;
  for (const [index, [profile, optimization, capacity, bytes, offset, last, sha256]] of nativeCases.entries()) {
    await final.getByRole("button", { name: "Inspect " + profile + " " + optimization, exact: true }).click();
    await expect(resources.locator("tbody tr").nth(index).getByRole("cell")).toHaveText(["6", capacity, "8", bytes]);
    const selected = final.getByRole("region", { name: "Selected final-native case", exact: true });
    const rows = selected.getByRole("table", { name: "Exact native instruction bytes", exact: true }).locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.first().getByRole("cell").nth(3)).toHaveText(offset);
    await expect(rows.last().getByRole("cell").nth(1)).toHaveText(last);
    const scratch = selected.getByRole("button", { name: "Inspect VGPR4 scratch", exact: true });
    await expect(scratch).toHaveAttribute("aria-pressed", "false");
    await scratch.click();
    await expect(scratch).toHaveAttribute("aria-pressed", "true");
    await selected.getByText("Exact identities and untrusted build claims", { exact: true }).click();
    await expect(selected.getByText(sha256, { exact: true })).toBeVisible();
    await expect(cpu.getByRole("tab", { name: "Edited OR to AND helper", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(cpu.getByRole("region", { name: "Selected operation detail", exact: true })).toBeVisible();
  }
  for (const label of ["Declared VGPR high-water", "Encoded VGPR capacity", "Architected boundary"])
    await expect(resources.getByRole("columnheader", { name: label, exact: true })).toBeVisible();
  await expect(final.getByText(/not measured register usage, occupancy, performance/u)).toBeVisible();
  await expect(final.getByText(/No explicit use does not mean free/u)).toBeVisible();
  await expect(final.getByText(/do not establish live ranges/u)).toBeVisible();
  await final.getByText("Comparison integrity and limitations", { exact: true }).click();
  await expect(final.getByText("5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162", { exact: true })).toBeVisible();
  await expect(final.getByText(/register lifetime or allocation proof: unavailable/u)).toBeVisible();

  const originImporter = repeated.getByRole("region", { name: "Optional ordered-origin import", exact: true });
  const originInput = originImporter.getByLabel("Ordered-origin report (local JSON)", { exact: true });
  const origin = originImporter.getByRole("region", { name: "Imported whole-region origin", exact: true });
  const liveness = repeated.getByRole("region", { name: "Finite-region logical liveness", exact: true });
  for (const [index, label] of (["one", "two", "fifteen", "repeat"] as const).entries()) {
    for (const optimization of ["O0", "O3"] as const) {
      await repeated.getByRole("button", { name: "Inspect " + label + " " + optimization, exact: true }).click();
      await expect(origin).toHaveCount(0);
      await expect(liveness.getByRole("region", { name: "Selected logical value", exact: true })).toHaveCount(0);
      await expect(repeated.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true })).toHaveAttribute("aria-pressed", "false");
      await originInput.setInputFiles(upload(label + ".origin.json", retained(label)));
      await expect(origin.getByRole("status")).toHaveAttribute("data-state", "matching_reported_identities");
      await expect(origin.getByText(/consistency only, not authenticated provenance/u)).toBeVisible();
      await expect(origin.getByRole("region", { name: "Source call-site span", exact: true })).toBeVisible();
      await expect(origin.getByRole("region", { name: "Macro expansion span", exact: true })).toBeVisible();
      await expect(origin.getByText(/Unavailable: per-instruction source spans/u)).toBeVisible();
      await expect(origin.getByRole("link")).toHaveCount(0);
      await expect(liveness.getByRole("table", { name: "Logical version lifetimes and uses", exact: true }).locator("tbody tr")).toHaveCount([5, 6, 19, 19][index]);
      await expect(liveness.getByTestId("logical-boundary-peak")).toHaveText("2");
      await expect(liveness.getByTestId("logical-transient-peak")).toHaveText("3");
      await expect(liveness.getByText(/not physical VGPR lifetimes/u)).toBeVisible();
      await liveness.getByRole("button", { name: "Inspect logical output after instruction 1", exact: true }).click();
      await expect(liveness.getByRole("region", { name: "Selected logical value", exact: true })).toBeVisible();
      await repeated.getByRole("button", { name: "Inspect VGPR32 scratch", exact: true }).click();
    }
  }

  // Valid report from another actual export is not joined to the selected repeat.
  await originInput.setInputFiles(upload("wrong-actual-origin.json", retained("one")));
  await expect(origin.getByRole("status")).toHaveAttribute("data-state", "mismatch");
  await expect(origin.getByRole("list", { name: "Origin identity mismatches", exact: true }))
    .toContainText("Canonical KIR identity");
  await originInput.setInputFiles(upload("malformed-origin.json", Buffer.from("{}")));
  await expect(originImporter.getByText(/Ordered-origin report refused/u)).toBeVisible();
  await expect(origin).toHaveCount(0);

  // Neither refusal nor replacement may mutate the two unrelated selected views.
  const otherSelections = async () => {
    await expect(cpu.getByRole("tab", { name: "Edited OR to AND helper", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(cpu.getByRole("tabpanel").locator("pre[aria-label]")).toContainText("v_and_b32");
    await expect(final.getByRole("button", { name: "Inspect edited O3", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(final.getByRole("button", { name: "Inspect VGPR4 scratch", exact: true })).toHaveAttribute("aria-pressed", "true");
  };
  await otherSelections();
  await nativeInput.setInputFiles(upload("historical-wrong-capture.json", retained("historical")));
  await expect(repeated.locator('[data-state="invalid"]')).toBeVisible();
  await expect(liveness).toHaveCount(0);
  await expect(originImporter).toHaveCount(0);
  await otherSelections();

  // Negative only: a changed join rehashed internally cannot change the route's
  // independent selected pin. Positive cases above never reconstruct evidence.
  const changed = JSON.parse(same.toString("utf8")) as {
    artifacts: Array<{ role: string; bytes: number; sha256: string; chunks: string[] }>;
  };
  const join = changed.artifacts.find(artifact => artifact.role === "join")!;
  const oldJoin = join.chunks.join("");
  expect(oldJoin).toContain('"status": "passed"');
  const changedJoin = oldJoin.replace('"status": "passed"', '"status": "failed"');
  const changedBytes = Buffer.from(changedJoin);
  join.bytes = changedBytes.length;
  join.sha256 = hash(changedBytes);
  join.chunks = [];
  for (let at = 0; at < changedJoin.length; at += 65536) join.chunks.push(changedJoin.slice(at, at + 65536));
  await nativeInput.setInputFiles(upload("repinned-wrong-join.json", Buffer.from(JSON.stringify(changed))));
  await expect(repeated.locator('[data-state="invalid"]')).toBeVisible();
  await expect(liveness).toHaveCount(0);
  await otherSelections();

  await nativeInput.setInputFiles(upload("same-export-restored.json", same));
  await expect(repeated.getByRole("button", { name: "Inspect one O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(origin).toHaveCount(0);
  await expect(liveness.getByRole("region", { name: "Selected logical value", exact: true })).toHaveCount(0);
  await otherSelections();
  await importer.getByRole("button", { name: "Clear repeat-native import", exact: true }).click();
  await expect(liveness).toHaveCount(0);
  await sameSection.getByRole("button", { name: "Close same-export origin/native preview", exact: true }).click();
  await expect(importer).toHaveCount(0);
  await page.getByRole("button", { name: "Close final native comparison", exact: true }).click();
  await expect(final).toHaveCount(0);
  await expect(cpu.getByRole("region", { name: "Selected operation detail", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
  await expect(final.getByRole("button", { name: "Inspect default O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(final.getByRole("button", { name: "Inspect VGPR4 scratch", exact: true })).toHaveAttribute("aria-pressed", "false");
  await cpu.getByRole("button", { name: "Close actual source comparison", exact: true }).click();
  await cpu.getByRole("button", { name: "Open actual source comparison", exact: true }).click();
  await expect(cpu.getByRole("tab", { name: "Original ordinary Rust", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(cpu.getByRole("region", { name: "Selected operation detail", exact: true })).toHaveCount(0);
  for (const panel of [cpu, final])
    await expect(panel.getByRole("button", { name: /compile|run|load|launch|resume|step|continue/iu })).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(mutations).toEqual([]);
});

// An explicit unsupported browser capability is a negative control only. It must
// not fabricate source/native rows or silently use an unchecked fallback.
test("V3 unavailable integrity capability shows no source, native or lifetime rows", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, "subtle", { configurable: true, value: undefined });
  });
  const mutations: string[] = [];
  page.on("request", request => {
    if (request.method() !== "GET") mutations.push(request.method() + " " + request.url());
  });
  await page.goto("./#/debugger/source-isa-agent");
  const cpu = page.getByTestId("recorded-source-promotion");
  await cpu.getByRole("button", { name: "Open actual source comparison", exact: true }).click();
  const cpuView = cpu.getByRole("region", { name: "Actual source variant comparison", exact: true });
  await expect(cpuView.locator('[data-state="unavailable"]')).toBeVisible();
  await expect(cpuView.getByRole("table")).toHaveCount(0);
  await expect(cpuView.getByRole("region", { name: "Selected operation detail", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
  const final = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
  await expect(final.locator('[data-state="unavailable"]')).toBeVisible();
  await expect(final.getByRole("table")).toHaveCount(0);
  const section = page.getByRole("region", { name: "Compare same-export origin and native captures", exact: true });
  await section.getByRole("button", { name: "Open same-export origin/native preview", exact: true }).click();
  const importer = section.getByRole("region", { name: "Local repeat-native capsule import", exact: true });
  await importer.getByLabel("Repeat-native capsule (local JSON)", { exact: true })
    .setInputFiles(upload("actual-but-uncheckable.json", retained("same")));
  const repeated = importer.getByRole("region", { name: "Bounded repeat-native comparison", exact: true });
  await expect(repeated.locator('[data-state="unavailable"]')).toBeVisible();
  await expect(repeated.getByRole("table")).toHaveCount(0);
  await expect(repeated.getByRole("region", { name: "Finite-region logical liveness", exact: true })).toHaveCount(0);
  await expect(repeated.getByRole("region", { name: "Optional ordered-origin import", exact: true })).toHaveCount(0);
  expect(mutations).toEqual([]);
});
