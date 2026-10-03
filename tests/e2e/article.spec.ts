import { expect, test } from '@playwright/test';

const POST = './writing/designing-for-failure/';

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('rail marks the current section while scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    const rail = page.getByRole('navigation', { name: 'Contents' });
    await expect(rail.locator('a').first()).toHaveAttribute('aria-current', 'location');
    await page.locator('#comparing-strategies').evaluate((el) => el.scrollIntoView());
    await expect(rail.locator('a[data-toc-link="comparing-strategies"]')).toHaveAttribute('aria-current', 'location');
  });

  test('rail reveals heading text on hover and jumps on click', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    const text = page.locator('nav.toc .toc-text').first();
    await expect(text).toHaveCSS('opacity', '0');
    await page.locator('nav.toc').hover();
    await expect(text).toHaveCSS('opacity', '1');
    await page.locator('nav.toc').getByText('Retries without regret').click();
    await expect(page).toHaveURL(/#retries-without-regret$/);
    await expect(page.locator('#retries-without-regret')).toBeInViewport();
  });

  test('copy button copies the code', async ({ page }) => {
    await page.goto(POST);
    const frame = page.locator('figure.code-frame').first();
    await frame.getByRole('button', { name: 'Copy' }).click();
    await expect(frame.getByRole('button', { name: 'Copied' })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('def retry[T]');
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('shows the Contents panel instead of the rail, with no horizontal scroll', async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator('nav.toc')).toBeHidden();
    await page.getByText('Contents', { exact: true }).click();
    await expect(page.locator('details.toc-inline a').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
