import { expect, test } from "@playwright/test";

test("published macro tutorial uses keyboard selection and wraps exact historical identities in both themes", async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") mutations.push(request.url()); });
  for (const theme of ["light", "dark"]) {
    await page.goto("./#/debugger/source-isa-agent");
    // The same hash can retain React state; each theme starts from a fresh document.
    await page.reload();
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const tutorial = page.getByRole("region", { name: "Trace retained whole-region macro origins" });
    const frames = tutorial.getByRole("region", { name: "Ordered-program macro origins" });
    await expect(frames).toHaveCount(0);
    const open = tutorial.getByRole("button", { name: "Open retained macro frames" });
    await expect(open).toHaveAttribute("aria-expanded", "false");
    await open.focus();
    await open.press("Enter");
    await expect(tutorial.getByRole("button", { name: "Close retained macro frames" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect(tutorial).toContainText("historical compiler capture");
    await expect(tutorial).toContainText("not a run of current main");
    await expect(frames).toContainText("2 actual retained frames. Whole ordered region only.");
    const frame = frames.getByRole("combobox", { name: "Expansion frame" });
    await expect(frame).toHaveValue("0");
    await frame.focus();
    await frame.press("ArrowDown");
    await frame.press("Enter");
    await expect(frame).toHaveValue("1");
    await expect(frame).toBeFocused();
    await expect(frames.getByRole("heading", { level: 4 })).toHaveText("ordered_program_wrapper");
    await expect(frames.getByRole("region", { name: "Call site" }))
      .toContainText("ordered_program_wrapper!(a, b, c)");
    const definition = frames.getByRole("region", { name: "Definition site" });
    await expect(definition).toContainText("Bytes [290, 558)");
    await expect(definition).toContainText("amdgpu_ordered_program!");
    const identities = frames.getByText("Exact selected variant and baseline", { exact: true });
    await identities.focus();
    await identities.press("Enter");
    await expect(frames.locator("details")).toHaveAttribute("open", "");
    await expect(frames.getByText("6f519171ce7ff382a27ed6ef3f260aa190ecb9f888a2ddebf29d7aa5cac1aed6", { exact: true })).toBeVisible();
    await expect(frames.getByText("c9722c19fe89dd4edb097bb05362ad1e1185db5fad60172ca65da2e832f5bd53", { exact: true })).toBeVisible();
    await expect(frames).toContainText("physical register values and allocation lifetimes: unavailable");
    await expect(frames).toContainText("not an LLVM inline stack or individual instruction stops");
    await expect(frames.getByRole("button", { name: /compile|launch|connect|run/iu })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await tutorial.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await frames.locator("pre").evaluateAll(nodes =>
      nodes.length > 0 && nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
    expect(await frames.locator("code").evaluateAll(nodes => nodes.every(node =>
      Array.from(node.getClientRects()).every(rect => rect.left >= 0 && rect.right <= innerWidth)))).toBe(true);
    await tutorial.screenshot({ path: testInfo.outputPath("ordered-macro-frames-" + theme + ".png") });
    const close = tutorial.getByRole("button", { name: "Close retained macro frames" });
    await close.focus();
    await close.press("Enter");
    await expect(frames).toHaveCount(0);
    await expect(tutorial.getByRole("button", { name: "Open retained macro frames" })).toBeFocused();
    await tutorial.getByRole("button", { name: "Open retained macro frames" }).press("Enter");
    await expect(frame).toHaveValue("0");
  }
  expect(mutations).toEqual([]);
});

test("macro navigation leaves the ordinary-source capture and selection intact", async ({ page }) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open ordinary source navigation" }).click();
  const navigation = page.getByRole("region", { name: "Read-only authoring navigation" });
  await navigation.getByRole("button", { name: "Bytes 325–334: low | 256" }).click();
  await navigation.getByRole("region", { name: "Source attribution candidates" })
    .getByRole("button", { name: "0:0:4 BitOr" }).click();
  const boundary = navigation.getByRole("region", { name: "Retained structural boundary" });
  await expect(boundary).toContainText("%16: Scalar(U32)");
  await page.getByRole("button", { name: "Open retained macro frames" }).click();
  const frames = page.getByRole("region", { name: "Ordered-program macro origins" });
  await frames.getByRole("combobox", { name: "Expansion frame" }).selectOption("1");
  await expect(boundary).toContainText("%16: Scalar(U32)");
  await expect(navigation.getByLabel("Retained ordinary Rust source").locator("mark")).toHaveText("low | 256");
  await expect(frames.getByRole("region", { name: "Retained structural boundary" })).toHaveCount(0);
  await page.getByRole("button", { name: "Close retained macro frames" }).click();
  await expect(boundary).toBeVisible();
});
