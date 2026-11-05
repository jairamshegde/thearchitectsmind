import { expect, test } from '@playwright/test';

test('keeps a side gutter on phones (hero, sections, footer)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  for (const sel of ['.hero .hl', '#projects h2', '#writing h2', '.foot .sig']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box!.x, sel).toBeGreaterThanOrEqual(16);
  }
});

test('hero headline and subtext sizes on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('./');
  const px = (sel: string) => page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await px('.hero .hl')).toBeLessThanOrEqual(60);
  expect(await px('.hero .hl')).toBeGreaterThanOrEqual(44);
  expect(await px('.hero .hero-sub')).toBeLessThanOrEqual(19);
});

test('hero: Pico’s note writes itself in on load', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await expect.poll(() => page.locator('.hero-pico .about-pico-note').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
});

for (const width of [1920, 1440, 1024]) {
  test(`footer statement keeps each sentence on one line at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const lines = page.locator('.foot .big .big-line');
    await expect(lines).toHaveText(['Every hard problem has a simple shape.', 'Finding it is the job.']);
    for (const line of await lines.all()) {
      const { height, lineHeight } = await line.evaluate((el) => ({ height: el.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(el).lineHeight) }));
      expect(Math.round(height / lineHeight)).toBe(1);
    }
  });
}

test('about page: Pico’s welcome note writes itself in on load', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  await expect.poll(() => page.locator('.about-welcome .about-pico-note').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('footer: the statement sits left, Pico and the links right, on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const big = (await page.locator('.foot .big').boundingBox())!;
  const pico = (await page.locator('.foot-pico img').boundingBox())!;
  const gh = (await page.locator('.foot .links a').first().boundingBox())!;
  expect(pico.x).toBeGreaterThan(big.x + big.width);
  expect(gh.x).toBeGreaterThan(big.x + big.width);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('footer: one left-aligned column on phones, statement first', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  const big = (await page.locator('.foot .big').boundingBox())!;
  const pico = (await page.locator('.foot-pico img').boundingBox())!;
  expect(pico.y).toBeGreaterThanOrEqual(big.y + big.height);
  expect(Math.abs(pico.x - big.x)).toBeLessThan(4);
});
