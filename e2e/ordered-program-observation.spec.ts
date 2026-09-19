import { expect, test } from '@playwright/test';

test('retained real capture supports fixed-lane replay selection in the development preview', async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
  await page.goto('./drafts/ordered-program-observation.html');
  await expect(page.getByText('Retained public diagnostic CPU observations; not a qualified compiler release.')).toBeVisible();
  await expect(page.getByText(/Synthetic test-only input/u)).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Recorded program variant' }).selectOption('4');
  await page.getByRole('combobox', { name: 'Recorded program request case' }).selectOption('5');
  await expect(page.getByRole('list', { name: 'Declared instruction sequence' }).getByRole('listitem')).toHaveCount(16);
  const phase = page.getByRole('combobox', { name: 'Recorded whole-program checkpoint' });
  const values = page.getByRole('table', { name: 'Recorded program logical values' });
  await expect(values).toContainText('0x00000013 (19)');
  await phase.focus(); await phase.press('ArrowDown'); await phase.press('Enter');
  await expect(phase).toHaveValue('1'); await expect(phase).toBeFocused();
  await expect(values).toContainText('0x0000000c (12)');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.program-observation-scroll').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`ordered-program-retained-${theme}.png`), fullPage: true });
  }
  await phase.selectOption('2'); await expect(values).toContainText('0x00000013 (19)');
  await phase.selectOption('3'); await expect(values).toContainText('0x0000000c (12)');
  await page.getByRole('combobox', { name: 'Recorded program request case' }).selectOption('0');
  await expect(phase).toHaveValue('0');
  await expect(page.getByRole('combobox', { name: /lane/iu })).toHaveCount(0);
  expect(mutations).toEqual([]);
});
test('synthetic layout control preserves fixed lane, keyboard selection and both themes', async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
  await page.goto('./tests/performance/ordered-program-observation-harness.html');
  await expect(page.getByText('Synthetic test-only input. This is not execution evidence.')).toBeVisible();
  await page.getByRole('combobox', { name: 'Recorded program variant' }).selectOption('4');
  await expect(page.getByRole('list', { name: 'Declared instruction sequence' }).getByRole('listitem')).toHaveCount(16);
  const phase = page.getByRole('combobox', { name: 'Recorded whole-program checkpoint' });
  await phase.focus(); await phase.press('ArrowDown'); await phase.press('Enter');
  await expect(phase).toHaveValue('1'); await expect(phase).toBeFocused();
  await expect(page.getByRole('table', { name: 'Recorded program logical values' }).getByText('Not queried at this checkpoint')).toHaveCount(3);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.program-observation-scroll').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`ordered-program-synthetic-${theme}.png`), fullPage: true });
  }
  await page.getByRole('combobox', { name: 'Recorded program request case' }).selectOption('5');
  await expect(phase).toHaveValue('0');
  expect(mutations).toEqual([]);
});
