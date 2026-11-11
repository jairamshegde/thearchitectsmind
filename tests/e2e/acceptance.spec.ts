import { expect, test } from '@playwright/test';

const ROUTES = ['./', './writing/', './writing/mingraph/', './writing/mingraph/phase-0-oop-finally-clicked/', './notes/', './notes/dataclass-slots/', './projects/', './projects/mingraph-langchain-and-langgraph-building-blocks-rebuilt-from-scratch-to-learn-object-oriented-design-and-design-patterns-in-python./', './about/', './404.html'];

for (const route of ROUTES) {
  test(`${route}: nothing scrolls sideways at 390px, and the right fonts load`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const font = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(await font('h1')).toMatch(/^"?Funnel Display/);
    expect(await font('body')).toMatch(/^"?Inter Tight/);
  });
}

test('with reduced motion, nothing animates on the homepage or a post', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['./', './writing/mingraph/phase-0-oop-finally-clicked/']) {
    await page.goto(route);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running, route).toBe(0);
  }
});

test.describe('review fixes', () => {
  const clipped = (el: Element) => [...el.querySelectorAll('.mask')].some((m) => m.scrollWidth > m.clientWidth + 1);

  test('a longer hero lead wraps instead of being cut off on phones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('./');
    const h1 = page.locator('#hero h1');
    await h1.locator('.mask').first().locator('span').evaluate((el) => (el.textContent = 'In search of better'));
    expect(await h1.evaluate(clipped)).toBe(false);
  });

  test('a post title with a long code word wraps instead of being cut off on phones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('./writing/mingraph/phase-0-oop-finally-clicked/');
    const h1 = page.locator('h1.post-title');
    await h1.locator('.mask').first().locator('span').evaluate((el) => (el.textContent = 'Building ConversationSummaryBufferMemory'));
    expect(await h1.evaluate(clipped)).toBe(false);
  });

  test('the header fits a 320px phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('./');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('three Pico notes in a row stack in the margin without overlapping', async ({ page }) => {
    await page.setViewportSize({ width: 1700, height: 1000 });
    await page.goto('./writing/mingraph/phase-0-oop-finally-clicked/');
    const row = page.locator('.pico-row').first();
    await row.evaluate((el) => { const a = el.querySelector('aside.pico')!; el.append(a.cloneNode(true), a.cloneNode(true)); });
    const boxes = await row.locator('aside.pico').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: r.top, bottom: r.bottom })));
    expect(boxes).toHaveLength(3);
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
  });

  test('Cmd/Ctrl-click on the header Notes link leaves the homepage tabs alone', async ({ page, context }) => {
    await page.goto('./');
    const opened = context.waitForEvent('page');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Notes', exact: true }).click({ modifiers: ['ControlOrMeta'] });
    await opened;
    await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'false');
  });
});

for (const route of ['./projects/', './notes/', './writing/']) {
  test(`${route}: the page title sits on one line at 1440px, no larger than a post title, with the subtitle below`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);
    const h1 = page.locator('h1.page-title');
    const { height, size } = await h1.evaluate((el) => ({ height: el.getBoundingClientRect().height, size: parseFloat(getComputedStyle(el).fontSize) }));
    expect(height).toBeLessThan(size * 1.5);
    expect(size).toBeLessThanOrEqual(52);
    const title = (await h1.boundingBox())!;
    const intro = (await page.locator('.page-intro').boundingBox())!;
    expect(intro.y).toBeGreaterThan(title.y + title.height);
  });
}

test('section headings are at most 40px and sections sit closer together at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  const size = (sel: string) => page.locator(sel).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await size('#projects .sec-top h2')).toBeLessThanOrEqual(40);
  expect(await size('#writing [role="tab"]')).toBeLessThanOrEqual(40);
  const pad = (sel: string, side: string) => page.locator(sel).first().evaluate((el, s) => parseFloat(getComputedStyle(el).getPropertyValue(s)), side);
  expect(await pad('#hero', 'padding-bottom')).toBeLessThanOrEqual(100);
  expect(await pad('#projects', 'padding-bottom')).toBeLessThanOrEqual(104);
  expect(await pad('#writing > .wrap', 'padding-top')).toBeLessThanOrEqual(92);
});
