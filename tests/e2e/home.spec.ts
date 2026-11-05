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

for (const width of [1920, 1440, 1024, 375]) {
  test(`footer statement is exactly two lines, one per sentence, at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await expect(page.locator('.foot .big .big-line')).toHaveText(['Draw the boxes first.', 'Then argue about the arrows.']);
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
  const note = page.locator('.md-split:has(img[src*="pico-builder"]) .md-note-text');
  expect(await note.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
  await page.locator('.md-split:has(img[src*="pico-builder"]) .md-split-media').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => note.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
});

for (const width of [1920, 1440, 1180, 1024, 800]) {
  test(`about page: “What I do” note sits on the outer side at ${width}px — on Pico, clear of the text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./about/');
    await page.locator('.md-split:has(img[src*="pico-builder"])').scrollIntoViewIfNeeded();
    const img = (await page.locator('.md-split:has(img[src*="pico-builder"]) .md-split-media img').boundingBox())!;
    const arrow = (await page.locator('.md-split:has(img[src*="pico-builder"]) .md-note-arrow').boundingBox())!;
    const note = (await page.locator('.md-split:has(img[src*="pico-builder"]) .md-note-text').boundingBox())!;
    const text = (await page.locator('.md-split:has(img[src*="pico-builder"]) .md-split-text').boundingBox())!;
    const article = (await page.locator('article.article').boundingBox())!;
    // Image on the left: note above-left, arrow tip (bottom-right corner) on Pico's head.
    const tipX = (arrow.x + arrow.width - img.x) / img.width;
    const tipY = (arrow.y + arrow.height - img.y) / img.height;
    expect(tipX).toBeGreaterThan(0.5);
    expect(tipX).toBeLessThan(0.6);
    expect(tipY).toBeGreaterThan(0);
    expect(tipY).toBeLessThan(0.14);
    expect(note.x + note.width).toBeLessThanOrEqual(arrow.x + 2); // note is left of the arrow
    expect(note.x + note.width).toBeLessThan(text.x); // never runs into the text column
    expect(note.x).toBeGreaterThanOrEqual(article.x - 2); // stays inside the article (clear of the TOC rail)
  });
}

test('about page: notes reveal one section at a time, not all at once on a tall screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  const opacity = (sel: string) => page.locator(sel).evaluate((el) => Number(getComputedStyle(el).opacity));
  await expect.poll(() => opacity('.about-welcome .about-pico-note')).toBe(1);
  await page.waitForTimeout(1500);
  expect(await opacity('.md-split:has(img[src*="pico-builder"]) .md-note-text')).toBe(0); // “What I do” is only peeking in: not yet
  await page.locator('.md-split:has(img[src*="pico-builder"])').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect.poll(() => opacity('.md-split:has(img[src*="pico-builder"]) .md-note-text')).toBe(1);
});

for (const width of [1920, 1440, 1180, 1024, 800]) {
  test(`about page: “Why I enjoy it” note sits above-right at ${width}px — arrow on the board, clear of the text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./about/');
    const split = page.locator('.md-split:has(img[src*="pico-whiteboard"])');
    await split.locator('.md-split-media').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const img = (await split.locator('.md-split-media img').boundingBox())!;
    const arrow = (await split.locator('.md-note-arrow').boundingBox())!;
    const note = (await split.locator('.md-note-text').boundingBox())!;
    const text = (await split.locator('.md-split-text').boundingBox())!;
    // Image on the right: note above-right, mirrored arrow whose tip is its bottom-left corner.
    const tipX = (arrow.x - img.x) / img.width;
    const tipY = (arrow.y + arrow.height - img.y) / img.height;
    expect(tipX).toBeGreaterThan(0.5);
    expect(tipX).toBeLessThan(0.6);
    expect(tipY).toBeGreaterThan(0);
    expect(tipY).toBeLessThan(0.14);
    expect(note.x).toBeGreaterThanOrEqual(arrow.x + arrow.width - 2); // note is right of the arrow
    expect(note.x).toBeGreaterThan(text.x + text.width); // never runs into the text column
    // The right margin has no TOC rail, so the note may use a little of it — but must stay well on screen.
    expect(note.x + note.width).toBeLessThanOrEqual(width - 12);
    await expect.poll(() => split.locator('.md-note-text').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  });
}

for (const width of [1920, 1440, 1024, 800]) {
  test(`about page: “How I learn” thought bubble floats above Pico at ${width}px, clear of the text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./about/');
    const split = page.locator('.md-split', { has: page.locator('.md-thought') });
    await split.locator('.md-split-media').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const img = (await split.locator('.md-split-media img').boundingBox())!;
    const bubble = (await split.locator('.md-thought-text').boundingBox())!;
    const text = (await split.locator('.md-split-text').boundingBox())!;
    const article = (await page.locator('article.article').boundingBox())!;
    expect(bubble.y + bubble.height).toBeLessThanOrEqual(img.y + 4); // sits above the image
    expect(bubble.x + bubble.width).toBeLessThan(text.x); // never touches the text column
    expect(bubble.x).toBeGreaterThanOrEqual(article.x - 2);
    const centre = (bubble.x + bubble.width / 2 - img.x) / img.width;
    expect(centre).toBeGreaterThan(0.5); // over the right part of Pico's head, clear of the lightbulb
    expect(centre).toBeLessThan(0.85);
    await expect.poll(() => split.locator('.md-thought').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  });
}

for (const width of [1920, 1440, 1024, 800]) {
  test(`about page: “And Pico?” handwritten note sits above the image at ${width}px, clear of the text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./about/');
    const split = page.locator('.md-split:has(img[src*="pico-companion"])');
    await split.locator('.md-split-media').evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const img = (await split.locator('.md-split-media img').boundingBox())!;
    const note = (await split.locator('.md-note-text').boundingBox())!;
    const text = (await split.locator('.md-split-text').boundingBox())!;
    expect(note.y + note.height).toBeLessThanOrEqual(img.y + 4); // above the image
    expect(note.x).toBeGreaterThan(text.x + text.width); // never touches the text column
    expect(note.x + note.width).toBeLessThanOrEqual(width - 12); // on screen
    await expect.poll(() => split.locator('.md-note-text').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
  });
}

test('footer: Pico sits to the right of the statement on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const big = (await page.locator('.foot .big').boundingBox())!;
  const pico = (await page.locator('.foot-pico img').boundingBox())!;
  expect(pico.x).toBeGreaterThan(big.x + big.width);
  expect(Math.abs(pico.y + pico.height / 2 - (big.y + big.height / 2))).toBeLessThan(big.height / 2); // vertically aligned
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('footer: Pico sits above the statement on phones', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  const big = (await page.locator('.foot .big').boundingBox())!;
  const pico = (await page.locator('.foot-pico img').boundingBox())!;
  expect(pico.y + pico.height).toBeLessThanOrEqual(big.y + 2);
});
