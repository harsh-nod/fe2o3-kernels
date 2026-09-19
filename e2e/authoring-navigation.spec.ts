import { expect, test } from '@playwright/test';

test('existing source viewer opens exact actual-source navigation without editing', async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
  await page.goto('./#/debugger/source-isa-agent');
  await page.getByRole('button', { name: 'Open ordinary source navigation' }).click();
  const viewer = page.getByRole('region', { name: 'Read-only authoring navigation' });
  await expect(viewer.getByText(/Retained ordinary-source navigation; diagnostic/u)).toBeVisible();
  const range = viewer.getByRole('button', { name: 'Bytes 325–334: low | 256' });
  await range.focus(); await range.press('Enter'); await expect(range).toBeFocused();
  const candidates = viewer.getByRole('region', { name: 'Source attribution candidates' });
  await expect(candidates.getByRole('button')).toHaveCount(2);
  await candidates.getByRole('button', { name: '0:0:3 U32(256)' }).click();
  await expect(viewer.getByText(/Boundary unavailable for this occurrence/u)).toBeVisible();
  await candidates.getByRole('button', { name: '0:0:4 BitOr' }).click();
  await expect(viewer.getByRole('region', { name: 'Retained structural boundary' })).toContainText('%16: Scalar(U32)');
  await expect(viewer.getByLabel('Retained ordinary Rust source').locator('mark')).toHaveText('low | 256');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await viewer.screenshot({ path: testInfo.outputPath(`authoring-navigation-actual-${theme}.png`) });
  }
  expect(mutations).toEqual([]);
  await page.getByRole('button', { name: 'Close ordinary source navigation' }).click();
  await expect(viewer).toHaveCount(0);
});
test('synthetic navigation preserves ambiguity, keyboard selection and explicit unavailable stages', async ({ page }, testInfo) => {
  const mutations: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') mutations.push(request.url()); });
  await page.goto('./tests/performance/authoring-navigation-harness.html');
  await expect(page.getByText('Synthetic test-only navigation. Not source or compiler evidence.')).toBeVisible();
  const range = page.getByRole('button', { name: /Bytes.*low \| 256/u });
  await range.focus(); await range.press('Enter'); await expect(range).toBeFocused();
  await expect(page.getByText(/Ambiguous attribution: 2 distinct/u)).toBeVisible();
  const candidates = page.getByRole('region', { name: 'Source attribution candidates' });
  await expect(candidates.getByRole('button')).toHaveCount(2);
  await candidates.getByRole('button', { name: '0:0:0 U32(256)' }).click();
  await expect(page.getByText(/Boundary unavailable for this occurrence/u)).toBeVisible();
  const selected = candidates.getByRole('button', { name: '0:0:1 BitOr' });
  await selected.focus(); await selected.press('Enter'); await expect(selected).toBeFocused();
  await expect(page.getByRole('region', { name: 'Retained structural boundary' })).toContainText('%16: Scalar(U32)');
  await expect(page.getByLabel('Retained ordinary Rust source').locator('mark')).toHaveText('low | 256');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`authoring-navigation-synthetic-${theme}.png`), fullPage: true });
  }
  await expect(page.getByText('Unavailable: compiler-handoff text not retained.')).toBeVisible();
  await expect(page.getByText('Unavailable: this export precedes the final artifact.')).toBeVisible();
  await range.click(); await expect(page.getByRole('region', { name: 'Retained structural boundary' })).toHaveCount(0);
  expect(mutations).toEqual([]);
});
