import { expect, test, type Page } from '@playwright/test';

const navBottom = async (page: Page) => (await page.locator('header.site-header').boundingBox())!;

for (const width of [1440, 375]) {
  test.describe(`sticky nav at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('stays pinned to the top while scrolling', async ({ page }) => {
      await page.goto('./');
      await page.mouse.wheel(0, 2500);
      await expect.poll(async () => (await navBottom(page)).y).toBe(0);
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeInViewport();
    });

    test('jumping to a section does not hide it under the nav', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('./');
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
      await expect(page).toHaveURL(/#about$/);
      const nav = await navBottom(page);
      const heading = (await page.locator('#about h2').boundingBox())!;
      expect(heading.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    });
  });
}

test.describe('article page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TOC jumps land below the nav and the rail sits below it too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./writing/designing-for-failure/');
    await page.locator('nav.toc').hover();
    await page.locator('nav.toc').getByText('Comparing strategies').click();
    const nav = await navBottom(page);
    const heading = (await page.locator('#comparing-strategies').boundingBox())!;
    expect(heading.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    const rail = (await page.locator('nav.toc').boundingBox())!;
    expect(rail.y).toBeGreaterThanOrEqual(nav.y + nav.height);
  });
});

test('the projects stage sticks below the nav, not under it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./projects/');
  const nav = (await page.locator('header.site-header').boundingBox())!;
  const top = await page.locator('.stage').evaluate((el) => parseFloat(getComputedStyle(el).top));
  expect(top).toBeGreaterThanOrEqual(nav.height);
});
