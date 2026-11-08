import { expect, test } from '@playwright/test';

// A real series post: 13 sections, code blocks and tables. The sample posts were deleted from the CMS.
const POST = './writing/mingraph/phase-7-state-pattern-and-agent-loop/';

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('"On this page" marks the current section while scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc.locator('a').first()).toHaveClass(/is-active/);
    await page.locator('#the-run-that-got-tokyo-wrong').evaluate((el) => el.scrollIntoView());
    const link = toc.locator('a[data-toc-link="the-run-that-got-tokyo-wrong"]');
    await expect(link).toHaveClass(/is-active/);
    await expect(link).toHaveAttribute('aria-current', 'true');
    await expect(toc.locator('a.is-active')).toHaveCount(1);
  });

  test('"On this page" jumps to a section on click', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(POST);
    await page.getByRole('navigation', { name: 'On this page' }).getByText('The run that got Tokyo wrong').click();
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
    await expect(frame.getByRole('button', { name: 'Copy', exact: true })).toBeVisible({ timeout: 3000 });
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('hides the table of contents, with no horizontal scroll', async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator('nav.toc')).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('reading width', () => {
  test('body text is 860px wide with the table of contents to its left at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(POST);
    const para = (await page.locator('.prose > p').first().boundingBox())!;
    const toc = (await page.locator('nav.toc').boundingBox())!;
    expect(Math.round(para.width)).toBe(860);
    expect(toc.x + toc.width).toBeLessThanOrEqual(para.x - 40);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('body text starts at the same place with or without a table of contents', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST);
    const withToc = (await page.locator('.prose').boundingBox())!.x;
    await page.goto('./notes/dataclass-slots/');
    await expect(page.locator('nav.toc')).toHaveCount(0);
    const withoutToc = (await page.locator('.prose').boundingBox())!.x;
    expect(withoutToc).toBe(withToc);
  });

  test('body text spans the container under 1100px', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.goto(POST);
    const prose = (await page.locator('.prose').boundingBox())!;
    expect(Math.round(prose.x)).toBe(40);
  });
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

for (const [width, px] of [[1440, '17px'], [390, '16px']] as const) {
  test(`body text is ${px} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(POST);
    expect(await page.locator('.prose > p').first().evaluate((el) => getComputedStyle(el).fontSize)).toBe(px);
  });
}

for (const route of [POST, './notes/dataclass-slots/', './projects/mingraph-langchain-and-langgraph-building-blocks-rebuilt-from-scratch-to-learn-object-oriented-design-and-design-patterns-in-python./']) {
  test(`${route}: the title can use the full width at 1440px`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);
    const css = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).maxWidth);
    expect(css).toBe('none');
  });
}

test('the progress bar stays empty on a note too short to scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 2000 });
  await page.goto('./notes/dataclass-slots/');
  const scale = await page.locator('.progress > i').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
  expect(scale).toBe(0);
});
