import { expect, test, type Page } from "@playwright/test";

async function openComparison(page: Page) {
  await page.goto("./#/debugger/source-isa-agent");
  const open = page.getByRole("button", { name: "Open final native comparison", exact: true });
  await open.focus(); await open.press("Enter");
  await expect(page.getByRole("heading", { name: "Compare source with final native bytes", exact: true })).toBeVisible();
  const viewer = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
  await expect(viewer.getByRole("table", { name: "Declared and encoded native resources" })).toBeVisible();
  return viewer;
}

test("actual final-native cases keep source, exact bytes, offsets and resource quantities together", async ({ page }) => {
  const mutations: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") mutations.push(request.url()); });
  const viewer = await openComparison(page);
  await expect(viewer.getByText(/Retained source and compiled code-object observations/u)).toBeVisible();
  await expect(viewer.getByText(/Hashes check retained-byte consistency, not trusted compiler provenance/u)).toBeVisible();
  await expect(viewer.getByText(/not measured register usage, occupancy, performance/u)).toBeVisible();
  const resources = viewer.getByRole("table", { name: "Declared and encoded native resources" });
  const cases = [
    { profile: "default", opt: "O0", capacity: "24", bytes: "6152", offsets: ["2692", "2696", "2700"], descriptor: "2368",
      last: "01090a2a", sha: "0786de8ada4300d144018ac871fe384065b0f225b8e25dc423bc6c8a3454ba41" },
    { profile: "default", opt: "O3", capacity: "8", bytes: "5384", offsets: ["2340", "2344", "2348"], descriptor: "2048",
      last: "01090a2a", sha: "9484ee4d7f5f75730367a49ed960e4608ce07fb76c3415bb91e302f1ddea49c7" },
    { profile: "edited", opt: "O0", capacity: "24", bytes: "6152", offsets: ["2692", "2696", "2700"], descriptor: "2368",
      last: "01090a28", sha: "f39f619d9db7dc56f72b31dae527b926f9cf65004c2dd8e92092e77331f11a04" },
    { profile: "edited", opt: "O3", capacity: "8", bytes: "5384", offsets: ["2340", "2344", "2348"], descriptor: "2048",
      last: "01090a28", sha: "e37254dc428d1bdb680fccd3c3f52769caa6b85d24e070aba0d4935c780709cd" },
  ];
  await expect(resources.locator("tbody tr")).toHaveCount(4);
  for (const [index, current] of cases.entries()) {
    const button = viewer.getByRole("button", { name: "Inspect " + current.profile + " " + current.opt, exact: true });
    await button.click(); await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(resources.locator("tbody tr").nth(index).getByRole("cell")).toHaveText(["6", current.capacity, "8", current.bytes]);
    const selected = viewer.getByRole("region", { name: "Selected final-native case", exact: true });
    await expect(selected.getByRole("heading")).toContainText(current.profile + " " + current.opt);
    const instructions = selected.getByRole("table", { name: "Exact native instruction bytes" });
    await expect(instructions.locator("tbody tr")).toHaveCount(3);
    for (const [at, expected] of ["0003082a", "04050826", current.last].entries()) {
      const row = instructions.locator("tbody tr").nth(at);
      await expect(row.getByRole("cell").nth(1)).toHaveText(expected);
      await expect(row.getByRole("cell").nth(3)).toHaveText(current.offsets[at]);
    }
    await expect(selected.getByText("Descriptor: 64 bytes at payload offset " + current.descriptor + ".", { exact: false })).toBeVisible();
    await selected.getByText("Exact retained source for " + current.profile, { exact: true }).click();
    const source = selected.getByLabel(current.profile + " retained source", { exact: true });
    await expect(source).toBeVisible();
    await expect(source).toContainText(current.profile === "default" ? "xor(out, input1, scratch);" : "or(out, input1, scratch);");
    await selected.getByText("Exact identities and untrusted build claims", { exact: true }).click();
    await expect(selected.getByText(current.sha, { exact: true })).toBeVisible();
  }
  await viewer.getByText("Comparison integrity and limitations", { exact: true }).click();
  await expect(viewer.getByText("5230415719fa0c7c81473d5fea338d5f3a85c7a3a9a91fd55c3900e20165d162", { exact: true })).toBeVisible();
  await expect(viewer.getByText(/native whole-kernel correctness: unavailable/u)).toBeVisible();
  await expect(viewer.getByRole("button", { name: /compile|run|load|launch|resume|step|continue/iu })).toHaveCount(0);
  expect(mutations).toEqual([]);
});

test("actual final-native comparison supports keyboard selection, both themes and close/reopen clearing", async ({ page }, testInfo) => {
  const viewer = await openComparison(page);
  const edited = viewer.getByRole("button", { name: "Inspect edited O3", exact: true });
  await edited.focus(); await edited.press("Space");
  await expect(edited).toBeFocused(); await expect(edited).toHaveAttribute("aria-pressed", "true");
  const selected = viewer.getByRole("region", { name: "Selected final-native case", exact: true });
  await expect(selected.getByRole("heading")).toContainText("edited O3");
  await selected.getByText("Exact retained source for edited", { exact: true }).click();
  await selected.getByText("Exact retained LLVM input", { exact: true }).click();
  await selected.getByText("Exact identities and untrusted build claims", { exact: true }).click();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await viewer.screenshot({ path: testInfo.outputPath("final-native-actual-" + theme + ".png") });
  }
  await page.getByRole("button", { name: "Close final native comparison", exact: true }).click();
  await expect(viewer).toHaveCount(0);
  await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
  await expect(viewer.getByRole("button", { name: "Inspect default O0", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(viewer.getByRole("region", { name: "Selected final-native case" }).getByRole("heading")).toContainText("default O0");
  await expect(viewer.getByLabel("edited retained source", { exact: true })).toHaveCount(0);
});

test("opening final-native evidence does not replace or mutate the existing CPU-only comparison", async ({ page }) => {
  await page.goto("./#/debugger/source-isa-agent");
  const cpu = page.getByTestId("recorded-source-promotion");
  await cpu.getByRole("button", { name: "Open actual source comparison", exact: true }).click();
  await expect(cpu.getByRole("table", { name: "Independent CPU case comparison" })).toBeVisible();
  await cpu.getByRole("tab", { name: "Edited OR to AND helper", exact: true }).click();
  await expect(cpu.getByRole("tabpanel").locator("pre[aria-label]")).toContainText("v_and_b32");
  await page.getByRole("button", { name: "Open final native comparison", exact: true }).click();
  const native = page.getByRole("region", { name: "Source and final-native comparison", exact: true });
  await native.getByRole("button", { name: "Inspect edited O3", exact: true }).click();
  await expect(native.getByRole("table", { name: "Exact native instruction bytes" })).toContainText("V_OR_B32_e32_vi");
  await expect(cpu.getByRole("tab", { name: "Edited OR to AND helper", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(cpu.getByRole("tabpanel").locator("pre[aria-label]")).toContainText("v_and_b32");
  await expect(cpu.getByRole("table", { name: "Independent CPU case comparison" })).toContainText("0 each");
  await page.getByRole("button", { name: "Close final native comparison", exact: true }).click();
  await expect(native).toHaveCount(0);
  await expect(cpu.getByRole("table", { name: "Independent CPU case comparison" })).toBeVisible();
});
