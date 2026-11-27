import { expect, test } from '@playwright/test';

test('keeps a side gutter on phones (hero, sections, contact band)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  for (const sel of ['#hero h1', '#projects h2', '#writing [role="tablist"]', '#contact .band-big']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box!.x, sel).toBeGreaterThanOrEqual(16);
  }
});

test('hero headline word is at most 112px at 1440px, the muted lead above it smaller', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const size = (sel: string) => page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const px = await size('#hero h1 .word');
  expect(await size('#hero h1 .lead')).toBeLessThan(px / 2);
  expect(px).toBeLessThanOrEqual(112);
  expect(px).toBeGreaterThan(90);
});

for (const width of [1440, 1024, 390]) {
  test(`hero: each title line stays on one line and nothing scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    for (const line of await page.locator('#hero h1 .mask').all()) {
      const { height, lineHeight } = await line.evaluate((el) => ({ height: el.firstElementChild!.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(el.firstElementChild!).fontSize) * 0.95 }));
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
  // true when "intuition" is drawn in the full stop's orange
  const wordIsAccent = (page: import('@playwright/test').Page) =>
    page.locator('#hero h1 .word').evaluate((el) => getComputedStyle(el).color === getComputedStyle(el.querySelector('.accent-dot')!).backgroundColor);

  test('at rest the full stop sits after "intuition" and the spark is dim', async ({ page }) => {
    await page.goto('./');
    await page.waitForTimeout(2200); // load reveal
    await expect(page.locator('[data-hero-dot]')).toBeVisible();
    expect(await page.locator('[data-hero-sq]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    expect(await brightest(page)).toBeLessThan(0.4);
    expect(await wordIsAccent(page)).toBe(false);
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
    await expect.poll(() => wordIsAccent(page)).toBe(true);
  });

  // hover until the full stop has landed in the spark
  const arm = async (page: import('@playwright/test').Page) => {
    await page.goto('./');
    await page.waitForTimeout(2200);
    const hero = (await page.locator('#hero').boundingBox())!;
    await page.mouse.move(hero.x + 300, hero.y + 300);
    await page.mouse.move(hero.x + 310, hero.y + 305);
    await expect(page.locator('#hero')).toHaveClass(/lit/, { timeout: 3000 });
    await expect(page.locator('[data-hero-score]')).toContainText('Three flicks');
    return { hero, field: (await page.locator('#hero [data-pf]').boundingBox())! };
  };
  const knockedOut = (page: import('@playwright/test').Page) =>
    page.locator('#hero [data-pf] i.pf-n').evaluateAll((els) => els.filter((e) => (e as HTMLElement).style.filter).length);
  const flick = async (page: import('@playwright/test').Page, x: number, y: number) => {
    await page.mouse.click(x, y);
    await expect(page.locator('#hero')).not.toHaveClass(/flung/, { timeout: 5000 });
  };

  test('the full stop stays put while the cursor moves over the pattern', async ({ page }) => {
    const { field } = await arm(page);
    await page.mouse.move(field.x + 18 * 20 + 7, field.y + 9 * 20 + 7);
    await page.waitForTimeout(500);
    const sq = (await page.locator('[data-hero-sq]').boundingBox())!;
    expect([Math.round(sq.x - field.x), Math.round(sq.y - field.y)]).toEqual([15 * 20, 11 * 20]);
  });

  test('a click flicks the full stop towards it, knocking noise out and counting it', async ({ page }) => {
    const { field } = await arm(page);
    await flick(page, field.x + 20, field.y + 20);
    const sq = (await page.locator('[data-hero-sq]').boundingBox())!;
    expect([Math.round(sq.x - field.x), Math.round(sq.y - field.y)]).not.toEqual([15 * 20, 11 * 20]);
    const out = await knockedOut(page);
    expect(out).toBeGreaterThan(0);
    await expect(page.locator('[data-hero-score]')).toHaveText(`${out} cleared · 2 flicks left`);
  });

  test('after three flicks the score is final, the best is kept, and a click starts over', async ({ page }) => {
    const { field } = await arm(page);
    await flick(page, field.x + 20, field.y + 20);
    await flick(page, field.x + field.width - 20, field.y + field.height - 20);
    await flick(page, field.x + 20, field.y + field.height - 20);
    const out = await knockedOut(page);
    await expect(page.locator('[data-hero-score]')).toHaveText(new RegExp(`^${out} of \\d+ cleared · new best\\. Click to go again\\.$`));
    expect(await page.evaluate(() => localStorage.getItem('hero-flicks-best'))).toBe(String(out));
    await page.mouse.click(field.x + 40, field.y + 40);
    await expect(page.locator('[data-hero-score]')).toHaveText('Three flicks. Go.');
    await expect.poll(() => knockedOut(page)).toBe(0);
  });

  test('on leave the full stop flies home, the noise comes back and the score hides', async ({ page }) => {
    const { hero, field } = await arm(page);
    await page.mouse.click(field.x + 20, field.y + 20);
    await expect.poll(() => page.locator('#hero .pf-ghost').count()).toBeGreaterThan(0);
    await expect(page.locator('#hero')).not.toHaveClass(/flung/, { timeout: 5000 });
    await page.mouse.move(5, hero.y + hero.height + 200);
    await expect.poll(() => knockedOut(page)).toBe(0);
    await expect(page.locator('[data-hero-score]')).toHaveCSS('opacity', '0');
    await expect(page.locator('#hero')).not.toHaveClass(/lit/);
    await expect(page.locator('[data-hero-dot]')).toBeVisible({ timeout: 3000 });
    expect(await page.locator('[data-hero-sq]').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    await expect.poll(() => wordIsAccent(page)).toBe(false);
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
    expect(await wordIsAccent(page)).toBe(false);
  });
});

test('band: Notes tab swaps the list and the link without leaving the page', async ({ page }) => {
  await page.goto('./');
  const all = page.locator('#writing a[data-all]');
  await page.getByRole('tab', { name: 'Notes' }).click();
  await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-notes')).toBeVisible();
  await expect(page.locator('#panel-writing')).toBeHidden();
  await expect(all).toHaveText('All notes');
  await expect(all).toHaveAttribute('href', /\/notes\/$/);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('band: arrow keys move between tabs', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('tab', { name: 'Writing' }).focus();
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

test('band: Writing in the header selects Writing after Notes was picked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('tab', { name: 'Notes' }).click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Writing' })).toHaveAttribute('aria-selected', 'true');
});

test('about page: the profile column stays put on desktop while the sections scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./about/');
  expect(await page.locator('aside.about-side').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
});

test('about page: one column on phones, Pico below the name, nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./about/');
  const name = (await page.locator('.about-side h1').boundingBox())!;
  const pico = (await page.locator('.about-side [data-pico-btn]').boundingBox())!;
  const main = (await page.locator('.about-main').boundingBox())!;
  expect(pico.y).toBeGreaterThan(name.y + name.height);
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

test('band: the writing list has no rule and spans the full width', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const border = await page.locator('#panel-writing .rows').evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(border).toBe('0px');
  const top = (await page.locator('#writing .sec-top').boundingBox())!;
  const row = (await page.locator('#panel-writing .row').first().boundingBox())!;
  expect(Math.abs(row.x - top.x)).toBeLessThanOrEqual(1);
  expect(row.width).toBeGreaterThanOrEqual(1200);
});

test('series: the parts list has no rule above Part 1 and gets the wide column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const parts = page.locator('#series .parts').first();
  expect(await parts.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('0px');
  expect((await parts.boundingBox())!.width).toBeGreaterThanOrEqual(780);
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
