import { expect, test } from '@playwright/test';

test('theme toggle flips the theme and remembers it after reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme', /.+/);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('starts dark when the system prefers dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute('aria-pressed', 'true');
});

test('a saved dark choice wins over a light system setting from the first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./', { waitUntil: 'commit' });
  await page.waitForSelector('body');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(20, 20, 19)');
});

test('still toggles when localStorage is blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('orange buttons have no border in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  for (const sel of ['#contact a.cta', 'a.contact-pill']) {
    expect(await page.locator(sel).evaluate((el) => getComputedStyle(el).borderTopWidth), sel).toBe('0px');
  }
});

test('the theme switch is a slider with sun and moon icons whose thumb moves to the moon in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('./');
  const sw = page.locator('[data-theme-toggle]');
  await expect(sw.locator('.ts-sun')).toHaveCount(1);
  await expect(sw.locator('.ts-moon')).toHaveCount(1);
  const thumbX = () => sw.locator('.ts-thumb').evaluate((el) => el.getBoundingClientRect().left);
  const light = await thumbX();
  await sw.click();
  await expect.poll(thumbX).toBeGreaterThan(light + 10);
  expect((await sw.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
