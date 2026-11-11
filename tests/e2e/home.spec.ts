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

test.describe('hero: the full stop is the missing piece', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const brightest = (page: import('@playwright/test').Page) =>
    page.locator('#hero [data-pf] i.pf-s').evaluateAll((els) => Math.max(...els.map((e) => Number(getComputedStyle(e).opacity))));

  test('at rest the full stop sits after "intuition" and the spark is dim', async ({ page }) => {
    await page.goto('./');
    await page.waitForTimeout(2200); // load reveal
    await expect(page.locator('[data-hero-dot]')).toBeVisible();
    expect(await page.locator('[data-hero-sq]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    expect(await brightest(page)).toBeLessThan(0.4);
  });

  test('on hover the full stop flies into the spark, which lights up, and the text stays', async ({ page }) => {
    await page.goto('./');
    await page.waitForTimeout(2200);
    const hero = (await page.locator('#hero').boundingBox())!;
    await page.mouse.move(hero.x + 300, hero.y + 300);
    await page.mouse.move(hero.x + 310, hero.y + 305);
    await expect(page.locator('#hero')).toHaveClass(/lit/, { timeout: 3000 });
    const field = (await page.locator('#hero [data-pf]').boundingBox())!;
    await expect.poll(async () => {
      const sq = (await page.locator('[data-hero-sq]').boundingBox())!;
      return [Math.round(sq.x - field.x), Math.round(sq.y - field.y)];
    }).toEqual([15 * 20, 11 * 20]);
    await expect.poll(() => brightest(page)).toBeGreaterThan(0.8);
    await expect(page.locator('[data-hero-dot]')).toBeHidden();
    expect(await page.locator('#hero h1').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('over the pattern the square follows the cursor, leaves a fading trail, and flies home on leave', async ({ page }) => {
    await page.goto('./');
    await page.waitForTimeout(2200);
    const hero = (await page.locator('#hero').boundingBox())!;
    await page.mouse.move(hero.x + 300, hero.y + 300);
    await page.mouse.move(hero.x + 310, hero.y + 305);
    await expect(page.locator('#hero')).toHaveClass(/lit/, { timeout: 3000 });
    const field = (await page.locator('#hero [data-pf]').boundingBox())!;
    await page.mouse.move(field.x + 18 * 20 + 7, field.y + 9 * 20 + 7);
    await expect.poll(async () => {
      const sq = (await page.locator('[data-hero-sq]').boundingBox())!;
      return [Math.round(sq.x - field.x), Math.round(sq.y - field.y)];
    }).toEqual([18 * 20, 9 * 20]);
    expect(await page.locator('#hero .pf-ghost').count()).toBeGreaterThan(0);
    await page.mouse.move(5, hero.y + hero.height + 200);
    await expect(page.locator('#hero')).not.toHaveClass(/lit/);
    await expect(page.locator('[data-hero-dot]')).toBeVisible({ timeout: 3000 });
    expect(await page.locator('[data-hero-sq]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  });

  test('a cursor resting on the hero at load does nothing until it moves', async ({ page }) => {
    await page.mouse.move(400, 400);
    await page.goto('./');
    await page.waitForTimeout(1200);
    await expect(page.locator('#hero')).not.toHaveClass(/lit/);
  });

  test('with reduced motion the spark is lit, the full stop stays put, and hover does nothing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await expect(page.locator('#hero')).toHaveClass(/lit/);
    const hero = (await page.locator('#hero').boundingBox())!;
    await page.mouse.move(hero.x + 300, hero.y + 300);
    await page.mouse.move(hero.x + 310, hero.y + 305);
    await page.waitForTimeout(800);
    await expect(page.locator('[data-hero-dot]')).toBeVisible();
    expect(await brightest(page)).toBeGreaterThan(0.8);
  });
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

for (const width of [1440, 1024, 390]) {
  test(`about page: the social icons sit in one row and are at least 56px at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./about/');
    const boxes = await page.locator('ul.socials a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.left, y: r.top, w: r.width })));
    expect(boxes).toHaveLength(3);
    for (const b of boxes) {
      expect(Math.round(b.y)).toBe(Math.round(boxes[0].y));
      expect(b.w).toBeGreaterThanOrEqual(56);
    }
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
    expect(boxes[2].x).toBeGreaterThan(boxes[1].x);
  });
}

test('the footer heading runs through the topics once, then rests on "anything"', async ({ page }) => {
  await page.goto('./notes/');
  const word = page.locator('[data-footer-word]');
  await expect(word).toHaveText('anything');
  await word.scrollIntoViewIfNeeded();
  for (const topic of ['AI agents', 'RAG pipelines', 'evals', 'observability', 'anything']) {
    await expect(word).toHaveText(topic);
  }
  await page.waitForTimeout(2000);
  await expect(word).toHaveText('anything');
});

test('the footer heading stays still with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./notes/');
  const word = page.locator('[data-footer-word]');
  await word.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await expect(word).toHaveText('anything');
});

test('band: the blog list has no rule of its own above the first row', async ({ page }) => {
  await page.goto('./');
  const border = await page.locator('#panel-blog .rows').evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(border).toBe('0px');
  await page.setViewportSize({ width: 1440, height: 900 });
  const desc = (await page.locator('#panel-blog .panel-desc').boundingBox())!;
  const title = (await page.locator('#panel-blog .row-title').first().boundingBox())!;
  expect(Math.abs(title.y - desc.y)).toBeLessThanOrEqual(4);
});

test('about page: the stack graph draws, hides an area, and shows "Used together" on demand', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  const canvas = page.locator('[data-stack] canvas');
  await canvas.scrollIntoViewIfNeeded();
  const inked = () => canvas.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
  await expect.poll(inked).toBeGreaterThan(1000);
  const area = page.locator('.stack-legend button', { hasText: 'Classical ML' });
  await area.click();
  await expect(area).toHaveAttribute('aria-pressed', 'false');
  const cross = page.locator('.stack-box [data-cross]');
  await expect(cross).toHaveAttribute('aria-pressed', 'false');
  await cross.click();
  await expect(cross).toHaveAttribute('aria-pressed', 'true');
});

test('about page: the salt link reveals the count, and the number flips to pi and back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./about/');
  const num = page.locator('[data-salt-num]');
  const line = page.locator('[data-salt-end]');
  await expect(num).toBeHidden();
  await page.locator('[data-salt-link]').click();
  await expect(num).toBeVisible();
  await expect(num).toHaveText('3.1,459');
  await expect(line).toHaveCSS('opacity', '0');
  await num.click();
  await expect(num).toHaveClass(/\bpi\b/);
  await expect(line).toHaveCSS('opacity', '1');
  await num.click();
  await expect(num).not.toHaveClass(/\bpi\b/);
  await expect(line).toHaveCSS('opacity', '0');
});
