import { expect, test } from '@playwright/test';

test('renders every diagram in the post, including the computational graph', async ({ page }) => {
  await page.goto('./writing/designing-for-failure/');
  const panels = page.locator('figure.mermaid-panel');
  await expect(panels).toHaveCount(2);
  for (const i of [0, 1]) {
    await expect(panels.nth(i)).toHaveClass(/is-rendered/);
    await expect(panels.nth(i).locator('svg')).toBeVisible();
  }
  await expect(panels.nth(1).locator('svg')).toContainText('f = 196');
});

test('falls back to the source when a diagram has a syntax error', async ({ page }) => {
  // Inject a broken diagram into the served HTML so published content never has to contain one.
  await page.route(/\/writing\/designing-for-failure\/(index\.html)?$/, async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      '<div class="prose">',
      '<div class="prose"><figure class="mermaid-panel" data-mermaid=""><pre class="mermaid-src">graph LR\n  A --></pre></figure>',
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('./writing/designing-for-failure/');
  const broken = page.locator('figure.mermaid-panel').first();
  await expect(broken).toHaveClass(/is-error/);
  await expect(broken.locator('.mermaid-note')).toContainText("couldn't be drawn");
  await expect(broken.locator('pre.mermaid-src')).toContainText('A -->');
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
