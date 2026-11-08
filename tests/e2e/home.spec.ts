import { expect, test } from '@playwright/test';

test('keeps a side gutter on phones (hero, sections, contact band)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  for (const sel of ['#hero h1', '#projects h2', '#writing h2', '#contact .band-big']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box!.x, sel).toBeGreaterThanOrEqual(16);
  }
});

test('hero title is at most 112px at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const px = await page.locator('#hero h1').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(px).toBeLessThanOrEqual(112);
  expect(px).toBeGreaterThan(90);
});

for (const width of [1440, 1024, 390]) {
  test(`hero: each title line stays on one line and nothing scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    for (const line of await page.locator('#hero h1 .mask').all()) {
      const { height, lineHeight } = await line.evaluate((el) => ({ height: el.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(el).fontSize) * 0.95 }));
      expect(Math.round(height / lineHeight)).toBe(1);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('hero: reduced motion shows the title in place immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const t = await page.locator('#hero h1 .mask > span').first().evaluate((el) => getComputedStyle(el).transform);
  expect(t).toBe('none');
});

test('pixel field: only the accent square follows the pointer, and it returns to the centre', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const field = page.locator('#hero [data-pf]');
  const sq = field.locator('[data-pf-sq]');
  const cellTransforms = () => field.locator('i').evaluateAll((els) => els.map((e) => getComputedStyle(e).transform).join());
  const before = await cellTransforms();
  const box = (await field.boundingBox())!;
  // centre cell is (15, 11) with a 20px pitch; aim at the middle of cell (18, 9)
  await page.mouse.move(box.x + 18 * 20 + 7, box.y + 9 * 20 + 7);
  await expect.poll(() => sq.evaluate((el) => el.style.transform)).toBe('translate(60px, -40px)');
  expect(await cellTransforms()).toBe(before);
  await page.mouse.move(box.x - 50, box.y - 50);
  await expect.poll(() => sq.evaluate((el) => el.style.transform)).toBe('');
});

test('about page: Pico’s welcome note writes itself in on load', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  await expect.poll(() => page.locator('.about-head .about-pico-note').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('writing: hovering or focusing a post shows its details', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const items = page.locator('#writing .viewer-item');
  const details = page.locator('#writing .viewer-detail');
  await expect(details.nth(0)).toBeVisible();
  await items.nth(2).hover();
  await expect(items.nth(2)).toHaveClass(/sel/);
  await expect(details.nth(2)).toBeVisible();
  await expect(details.nth(0)).toBeHidden();
  await items.nth(1).focus();
  await expect(details.nth(1)).toBeVisible();
  await expect(details.nth(2)).toBeHidden();
});

test('writing: phones show the plain list without the details panel', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  await expect(page.locator('#writing .viewer-details')).toBeHidden();
  await expect(page.locator('#writing .viewer-item').first()).toBeVisible();
});

test('about page: one column on phones, Pico above the name, nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./about/');
  const pico = (await page.locator('.about-head .about-pico img').boundingBox())!;
  const name = (await page.locator('.about-head h1').boundingBox())!;
  expect(pico.y + pico.height).toBeLessThanOrEqual(name.y + 2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
