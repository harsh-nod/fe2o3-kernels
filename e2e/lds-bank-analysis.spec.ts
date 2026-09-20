import { expect, test } from "@playwright/test";

test("selected actual LDS range has bounded assumed-layout analysis without capture mutation", async ({ page }, testInfo) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const example = page.getByTestId("lds-multi-resource-example");
  await example.getByRole("button", { name: "Open two-workgroup LDS example" }).click();
  const checkpoint = example.getByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
  await checkpoint.selectOption("4");
  const model = example.getByTestId("selected-lds-bank-analysis");
  const summary = model.locator("summary");
  await summary.focus(); await summary.press("Enter");
  const base = model.getByRole("textbox", { name: /Assumed allocation-base residue/u });
  await expect(base).toHaveValue("0");
  await expect(model).toContainText("Selected event 12; alloc#2:g0");
  await expect(model.getByRole("listitem")).toHaveCount(32);
  const network: string[] = [];
  page.on("request", request => network.push(request.url()));
  await base.fill("1");
  await expect(model.getByRole("listitem").nth(0)).toContainText("1 words · 3 bytes");
  await expect(model.getByRole("listitem").nth(1)).toContainText("1 words · 1 bytes");
  await expect(checkpoint).toHaveValue("4");
  await expect(model).toContainText("selected checkpoint remains 16080, revision 15");
  await base.fill("128");
  await expect(model.getByRole("list")).toHaveCount(0);
  await expect(model.getByRole("status")).toContainText("No prior modeled banks");
  await base.fill("127");
  await example.getByRole("button", { name: "Next retained access" }).click();
  await model.locator("summary").click();
  await expect(base).toHaveValue("0");
  await expect(model).toContainText("Selected event 28;");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await model.screenshot({ path: testInfo.outputPath("lds-bank-model-" + theme + ".png") });
  }
  expect(network).toEqual([]);
  expect(await model.locator("*").count()).toBeLessThan(240);
});

test("empty continuation and checkpoint replacement never carry prior modeled banks", async ({ page }) => {
  await page.goto("./#/lesson/cpu-semantic-simulation");
  const example = page.getByTestId("lds-multi-resource-example");
  await example.getByRole("button", { name: "Open two-workgroup LDS example" }).click();
  const checkpoint = example.getByRole("combobox", { name: "Retained two-workgroup LDS checkpoint" });
  await checkpoint.selectOption("4");
  let model = example.getByTestId("selected-lds-bank-analysis");
  await model.locator("summary").click();
  await model.getByRole("textbox").fill("1");
  await example.getByRole("combobox", { name: "Two-workgroup retained access page" }).selectOption("1");
  model = example.getByTestId("selected-lds-bank-analysis");
  await model.locator("summary").click();
  await expect(model.getByRole("list")).toHaveCount(0);
  await expect(model.getByRole("status")).toContainText("No exact retained access");
  await expect(example).toContainText("empty page does not establish empty access history");
  await checkpoint.selectOption("5");
  model = example.getByTestId("selected-lds-bank-analysis");
  await model.locator("summary").click();
  await expect(model.getByRole("textbox")).toHaveValue("0");
  await expect(model).toContainText("selected checkpoint remains 31211, revision 19");
  await expect(model).toContainText("caller-owned context, not backend-attested");
  await example.getByRole("button", { name: "Close two-workgroup LDS example" }).click();
  await expect(example.getByTestId("selected-lds-bank-analysis")).toHaveCount(0);
});
