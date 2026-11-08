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
      await page.goto('./#writing');
      const nav = await navBottom(page);
      const heading = (await page.locator('#writing [role="tablist"]').boundingBox())!;
      expect(heading.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    });
  });
}

test.describe('article page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TOC jumps land below the nav and the rail sits below it too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./writing/mingraph/phase-7-state-pattern-and-agent-loop/');
    await page.locator('nav.toc').hover();
    await page.locator('nav.toc').getByText('The run that got Tokyo wrong').click();
    const nav = await navBottom(page);
    const heading = (await page.locator('#the-run-that-got-tokyo-wrong').boundingBox())!;
    expect(heading.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    const rail = (await page.locator('nav.toc').boundingBox())!;
    expect(rail.y).toBeGreaterThanOrEqual(nav.y + nav.height);
  });
});

test('the header gains a bottom border once the page scrolls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./writing/mingraph/phase-0-oop-finally-clicked/');
  const header = page.locator('header.site-header');
  await expect(header).not.toHaveClass(/scrolled/);
  await page.mouse.wheel(0, 40);
  await expect(header).toHaveClass(/scrolled/);
  expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
});
