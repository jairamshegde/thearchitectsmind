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

for (const width of [1440, 1024]) {
  test(`hero arrow tip lands on Pico at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const img = (await page.locator('.hero-figure img').boundingBox())!;
    const arrow = (await page.locator('.hero-arrow').boundingBox())!;
    // Pico's head sits at roughly 75–80% across and the top ~8% of the image.
    const tipX = (arrow.x + arrow.width - img.x) / img.width;
    const tipY = (arrow.y + arrow.height - img.y) / img.height;
    expect(tipX).toBeGreaterThan(0.72);
    expect(tipX).toBeLessThan(0.78);
    expect(tipY).toBeGreaterThan(-0.02);
    expect(tipY).toBeLessThan(0.1);
  });
}

test('hero note sits above the image without an arrow on phones', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./');
  await expect(page.locator('.hero-note-text')).toBeVisible();
  await expect(page.locator('.hero-arrow')).toBeHidden();
});

test('hero headline stays at a readable size on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('./');
  const size = await page.locator('.hero .hl').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeLessThanOrEqual(60);
  expect(size).toBeGreaterThanOrEqual(50);
});
