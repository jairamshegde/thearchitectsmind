import { expect, test } from '@playwright/test';

test('hovering a project row shows its stage panel', async ({ page }) => {
  await page.goto('./');
  const rows = page.locator('#projects .proj-row');
  await expect(rows.first()).toHaveClass(/is-active/);
  await rows.nth(1).hover();
  await expect(rows.nth(1)).toHaveClass(/is-active/);
  await expect(page.locator('#projects [data-stage-panel="1"]')).toBeVisible();
  await expect(page.locator('#projects [data-stage-panel="0"]')).toBeHidden();
});

test('keeps a side gutter on phones (hero, sections, footer)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  for (const sel of ['.hero .hl', '#projects h2', '#writing h2', '#about h2', '.foot .sig']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box!.x, sel).toBeGreaterThanOrEqual(16);
  }
});

// Pico's head centre and the sparkle beside it, as fractions of the hero image (measured from the PNG).
const PICO_HEAD = { x: 0.778, y: 0.031 };
const SPARKLE = { x1: 0.734, x2: 0.750, y1: 0.019, y2: 0.049 };

for (const width of [1920, 1440, 1024]) {
  test(`hero arrow points at the centre of Pico's head, clear of the sparkle, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const img = (await page.locator('.hero-figure img').boundingBox())!;
    const arrow = (await page.locator('.hero-arrow').boundingBox())!;
    const tipX = (arrow.x + arrow.width - img.x) / img.width;
    const tipY = (arrow.y + arrow.height - img.y) / img.height;
    expect(Math.abs(tipX - PICO_HEAD.x)).toBeLessThan(0.012);
    // The tip stops just above the top of the head (head top ≈ 0.3% down), so the arrowhead stays visible.
    expect(tipY).toBeGreaterThan(-0.03);
    expect(tipY).toBeLessThan(0.01);
    // …and is drawn above the image, not hidden behind Pico.
    const z = await page.locator('.hero-note').evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(z)).toBeGreaterThan(0);
    // Sample the drawn curve and make sure no point crosses the sparkle (with a small margin).
    const points = await page.locator('.hero-arrow path').first().evaluate((path: SVGPathElement) => {
      const len = path.getTotalLength(); const m = path.getScreenCTM()!;
      return Array.from({ length: 60 }, (_, k) => { const p = path.getPointAtLength((len * k) / 59).matrixTransform(m); return { x: p.x, y: p.y }; });
    });
    for (const p of points) {
      const fx = (p.x - img.x) / img.width, fy = (p.y - img.y) / img.height;
      const inside = fx > SPARKLE.x1 - 0.01 && fx < SPARKLE.x2 + 0.01 && fy > SPARKLE.y1 - 0.02 && fy < SPARKLE.y2 + 0.02;
      expect(inside, `arrow point at ${fx.toFixed(3)},${fy.toFixed(3)}`).toBe(false);
    }
  });

  test(`hero headline is exactly two lines, one per sentence, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const lines = page.locator('.hero .hl .hl-line');
    await expect(lines).toHaveText(['I make computers do interesting things.', 'Then I get suspicious.']);
    const h1 = page.locator('.hero .hl');
    const { height, lineHeight, overflow } = await h1.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(el).lineHeight),
      overflow: el.scrollWidth - el.clientWidth,
    }));
    expect(Math.round(height / lineHeight)).toBe(2);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('hero note sits above the image without an arrow on phones', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  await expect(page.locator('.hero-note-text')).toBeVisible();
  await expect(page.locator('.hero-arrow')).toBeHidden();
});

test('hero headline and subtext sizes on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('./');
  const px = (sel: string) => page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await px('.hero .hl')).toBeLessThanOrEqual(60);
  expect(await px('.hero .hl')).toBeGreaterThanOrEqual(44);
  expect(await px('.hero .hero-sub')).toBeLessThanOrEqual(19);
});

test.describe('about Pico note', () => {
  const opacity = (page: import('@playwright/test').Page) =>
    page.locator('.about-pico-note').evaluate((el) => Number(getComputedStyle(el).opacity));

  test('is hidden at the top of the page and appears when jumping to About from the nav', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('./');
    expect(await opacity(page)).toBe(0);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
    await expect.poll(() => opacity(page)).toBe(1);
  });

  test('appears when scrolled into view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('./');
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(page)).toBe(1);
  });

  test('is visible straight away when opening /#about directly', async ({ page }) => {
    await page.goto('./#about');
    await expect.poll(() => opacity(page)).toBe(1);
  });
});

for (const width of [1920, 1440, 1024, 375]) {
  test(`footer statement is exactly two lines, one per sentence, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await expect(page.locator('.foot .big .big-line')).toHaveText(['Every system has a story.', 'The fun is finding it.']);
    const { height, lineHeight, overflow } = await page.locator('.foot .big').evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(el).lineHeight),
      overflow: el.scrollWidth - el.clientWidth,
    }));
    expect(Math.round(height / lineHeight)).toBe(2);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('about page: Pico’s welcome note writes itself in on load', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  await expect.poll(() => page.locator('.about-welcome .about-pico-note').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('about page: the “What I do” note and arrow appear when scrolled into view, arrow on Pico', async ({ page }) => {
  // Short viewport so the section starts below the fold.
  await page.setViewportSize({ width: 1440, height: 480 });
  await page.goto('./about/');
  const note = page.locator('.md-split .md-note-text');
  expect(await note.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
  await page.locator('.md-split').scrollIntoViewIfNeeded();
  await expect.poll(() => note.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  const img = (await page.locator('.md-split-media img').boundingBox())!;
  const arrow = (await page.locator('.md-note-arrow').boundingBox())!;
  // Image on the left: the note sits above-right and the (mirrored) arrow's tip is its bottom-left corner.
  const tipX = (arrow.x - img.x) / img.width;
  const tipY = (arrow.y + arrow.height - img.y) / img.height;
  expect(tipX).toBeGreaterThan(0.5);
  expect(tipX).toBeLessThan(0.6);
  expect(tipY).toBeGreaterThan(0);
  expect(tipY).toBeLessThan(0.14);
});
