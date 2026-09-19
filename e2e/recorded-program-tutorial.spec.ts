import { expect, test } from "@playwright/test";

test("published inspector opens a bounded real program tutorial with keyboard replay browsing", async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") mutations.push(request.url()); });
  await page.goto("./#/debugger/source-isa-agent");
  const tutorial = page.getByRole("region", { name: "Guided instruction-program tutorial" });
  await expect(tutorial).toHaveCount(0);
  const open = page.getByRole("button", { name: "Open recorded program tutorial" });
  await open.focus();
  await open.press("Enter");
  await expect(page.getByRole("button", { name: "Close recorded program tutorial" })).toHaveAttribute("aria-expanded", "true");
  await expect(tutorial.getByText("Retained public diagnostic CPU observations; not a qualified compiler release.")).toBeVisible();
  await tutorial.getByRole("combobox", { name: "Recorded program variant" }).selectOption("2");
  await tutorial.getByRole("combobox", { name: "Recorded program request case" }).selectOption("5");
  const phase = tutorial.getByRole("combobox", { name: "Recorded whole-program checkpoint" });
  const values = tutorial.getByRole("table", { name: "Recorded program logical values" });
  await expect(values).toContainText("Unavailable: not_in_scope");
  await phase.focus();
  await phase.press("ArrowDown");
  await phase.press("Enter");
  await expect(phase).toHaveValue("1");
  await expect(phase).toBeFocused();
  await expect(values).toContainText("0x00000017 (23)");
  await phase.selectOption("2");
  await expect(values).toContainText("0x00000013 (19)");
  await phase.selectOption("3");
  await expect(values).toContainText("0x00000017 (23)");

  await tutorial.getByRole("combobox", { name: "Recorded program variant" }).selectOption("5");
  await expect(phase).toHaveValue("0");
  await tutorial.getByRole("combobox", { name: "Recorded program request case" }).selectOption("5");
  await phase.selectOption("1");
  await expect(values).toContainText("0x0000000c (12)");
  await expect(tutorial.getByRole("list", { name: "Declared instruction sequence" }).getByRole("listitem")).toHaveCount(16);
  await expect(tutorial.getByRole("combobox", { name: /lane/iu })).toHaveCount(0);
  const answers = tutorial.getByText("Expected arithmetic answers", { exact: true });
  await answers.focus();
  await answers.press("Enter");
  await expect(tutorial.getByRole("table", { name: "Independent arithmetic expectations" })).toBeVisible();
  await expect(answers).toBeFocused();
  expect(await tutorial.locator("*").count()).toBeLessThan(800);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await tutorial.locator(".recorded-program-tutorial-table, .program-observation-scroll")
      .evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
    await tutorial.screenshot({ path: testInfo.outputPath("recorded-program-tutorial-" + theme + ".png") });
  }
  await page.getByRole("button", { name: "Close recorded program tutorial" }).click();
  await expect(tutorial).toHaveCount(0);
  await page.getByRole("button", { name: "Open recorded program tutorial" }).click();
  await expect(tutorial.getByRole("combobox", { name: "Recorded program variant" })).toHaveValue("0");
  await expect(tutorial.getByRole("combobox", { name: "Recorded whole-program checkpoint" })).toHaveValue("0");
  expect(mutations).toEqual([]);
});

test("ordinary source navigation remains a separate capture while the program tutorial changes", async ({ page }) => {
  await page.goto("./#/debugger/source-isa-agent");
  await page.getByRole("button", { name: "Open ordinary source navigation" }).click();
  const navigation = page.getByRole("region", { name: "Read-only authoring navigation" });
  await navigation.getByRole("button", { name: "Bytes 325–334: low | 256" }).click();
  await navigation.getByRole("region", { name: "Source attribution candidates" })
    .getByRole("button", { name: "0:0:4 BitOr" }).click();
  const boundary = navigation.getByRole("region", { name: "Retained structural boundary" });
  await expect(boundary).toContainText("%16: Scalar(U32)");
  await page.getByRole("button", { name: "Open recorded program tutorial" }).click();
  const tutorial = page.getByRole("region", { name: "Guided instruction-program tutorial" });
  await tutorial.getByRole("combobox", { name: "Recorded program variant" }).selectOption("4");
  await tutorial.getByRole("combobox", { name: "Recorded program request case" }).selectOption("5");
  await tutorial.getByRole("combobox", { name: "Recorded whole-program checkpoint" }).selectOption("1");
  await expect(boundary).toContainText("%16: Scalar(U32)");
  await expect(navigation.getByLabel("Retained ordinary Rust source").locator("mark")).toHaveText("low | 256");
  await expect(tutorial.getByRole("region", { name: "Retained structural boundary" })).toHaveCount(0);
  await expect(tutorial.getByText(/Source association unavailable: requires_authenticated_map/u)).toHaveCount(1);
  await page.getByRole("button", { name: "Close recorded program tutorial" }).click();
  await expect(boundary).toBeVisible();
});
