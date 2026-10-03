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
