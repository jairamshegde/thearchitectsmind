import { expect, test } from '@playwright/test';

test('keeps a side gutter on phones (hero, sections, contact band)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  for (const sel of ['#hero h1', '#projects h2', '#writing [role="tablist"]', '#contact .band-big']) {
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

test('band: Notes tab swaps the list and the link without leaving the page', async ({ page }) => {
  await page.goto('./');
  const all = page.locator('#writing a[data-all]');
  await page.getByRole('tab', { name: 'Notes' }).click();
  await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-notes')).toBeVisible();
  await expect(page.locator('#panel-blog')).toBeHidden();
  await expect(all).toHaveText('All notes');
  await expect(all).toHaveAttribute('href', /\/notes\/$/);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('band: arrow keys move between tabs', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('tab', { name: 'Blog' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Notes' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
});

test('band: Notes in the header selects the Notes tab and scrolls to the band on the homepage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#writing [role="tablist"]')).toBeInViewport();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('band: "Read the blog" in the hero selects Blog after Notes was picked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('tab', { name: 'Notes' }).click();
  await page.locator('#hero').getByRole('link', { name: 'Read the blog' }).click();
  await expect(page.getByRole('tab', { name: 'Blog' })).toHaveAttribute('aria-selected', 'true');
});

test('about page: the profile column stays put on desktop while the sections scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  expect(await page.locator('aside.about-side').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
});

test('about page: one column on phones, Pico above the name, nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./about/');
  const pico = (await page.locator('.about-side .about-pico img').boundingBox())!;
  const name = (await page.locator('.about-side h1').boundingBox())!;
  const main = (await page.locator('.about-main').boundingBox())!;
  expect(pico.y + pico.height).toBeLessThanOrEqual(name.y + 2);
  expect(main.y).toBeGreaterThan(name.y);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
