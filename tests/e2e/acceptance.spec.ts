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
