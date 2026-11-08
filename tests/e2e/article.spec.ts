import { expect, test } from '@playwright/test';

// A real series post: 13 sections, code blocks and tables. The sample posts were deleted from the CMS.
const POST = './writing/mingraph/phase-7-state-pattern-and-agent-loop/';

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('rail marks the current section while scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    const rail = page.getByRole('navigation', { name: 'Contents' });
    await expect(rail.locator('a').first()).toHaveAttribute('aria-current', 'location');
    await page.locator('#the-run-that-got-tokyo-wrong').evaluate((el) => el.scrollIntoView());
    await expect(rail.locator('a[data-toc-link="the-run-that-got-tokyo-wrong"]')).toHaveAttribute('aria-current', 'location');
  });

  test('rail reveals heading text on hover and jumps on click', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    const text = page.locator('nav.toc .toc-text').first();
    await expect(text).toHaveCSS('opacity', '0');
    await page.locator('nav.toc').hover();
    await expect(text).toHaveCSS('opacity', '1');
    await page.locator('nav.toc').getByText('The run that got Tokyo wrong').click();
    await expect(page).toHaveURL(/#the-run-that-got-tokyo-wrong$/);
    await expect(page.locator('#the-run-that-got-tokyo-wrong')).toBeInViewport();
  });

  test('copy button copies the code', async ({ page }) => {
    await page.goto(POST);
    const frame = page.locator('figure.code-frame').first();
    await frame.getByRole('button', { name: 'Copy' }).click();
    await expect(frame.getByRole('button', { name: 'Copied' })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.trim()).toBe((await frame.locator('pre').innerText()).trim());
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

test.describe('reading width', () => {
  for (const width of [1440, 1100]) {
    test(`article column is wide, rail stays beside it, no overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(POST);
      const article = (await page.locator('.article-shell .article').boundingBox())!;
      const rail = (await page.locator('nav.toc').boundingBox())!;
      expect(article.width).toBeGreaterThanOrEqual(width === 1440 ? 820 : 700);
      expect(rail.x + rail.width).toBeLessThanOrEqual(article.x);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test('reading progress fills as the article is read', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(POST);
  const bar = page.locator('.progress > i');
  const scale = () => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
  expect(await scale()).toBeLessThan(0.05);
  await page.locator('[data-article-end]').evaluate((el) => el.scrollIntoView({ block: 'end' }));
  await expect.poll(scale).toBeGreaterThan(0.95);
});

test('a phone shows the post title without sideways scrolling and hides the pixel field', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(POST);
  await expect(page.locator('.post-head [data-pf]')).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
