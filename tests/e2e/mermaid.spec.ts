import { expect, test } from '@playwright/test';

test('renders valid diagrams and falls back to source for a broken one', async ({ page }) => {
  await page.goto('./writing/designing-for-failure/');
  const panels = page.locator('figure.mermaid-panel');
  await expect(panels.nth(0)).toHaveClass(/is-rendered/);
  await expect(panels.nth(0).locator('svg')).toBeVisible();
  await expect(panels.nth(1)).toHaveClass(/is-error/);
  await expect(panels.nth(1).locator('.mermaid-note')).toContainText("couldn't be drawn");
  await expect(panels.nth(1).locator('pre.mermaid-src')).toContainText('A -->');
});

test('re-renders diagrams when the theme changes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./writing/designing-for-failure/');
  const svg = page.locator('figure.mermaid-panel.is-rendered svg').first();
  await expect(svg).toBeVisible();
  const before = await svg.getAttribute('id');
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect.poll(() => svg.getAttribute('id')).not.toBe(before);
});

test('does not download Mermaid on pages without diagrams', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('./notes/dataclass-slots/');
  await page.waitForLoadState('networkidle');
  expect(requests.filter((u) => /mermaid\.core/i.test(u))).toEqual([]);
});
