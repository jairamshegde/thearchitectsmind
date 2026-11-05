import { expect, test, type Page } from '@playwright/test';

// No published post has a diagram right now, so these tests inject Mermaid panels into a real post's
// HTML (the same markup the markdown pipeline emits, see tests/unit/markdown.test.ts).
const POST = './writing/mingraph/phase-7-state-pattern-and-agent-loop/';
const POST_URL = /\/writing\/mingraph\/phase-7-state-pattern-and-agent-loop\/(index\.html)?$/;
const panel = (src: string) => `<figure class="mermaid-panel" data-mermaid=""><pre class="mermaid-src">${src}</pre></figure>`;

async function withPanels(page: Page, ...sources: string[]) {
  await page.route(POST_URL, async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace('<div class="prose">', `<div class="prose">${sources.map(panel).join('')}`);
    await route.fulfill({ response, body: html });
  });
}

test('renders every diagram in the post', async ({ page }) => {
  await withPanels(page, 'graph LR\n  A[question] --> B[answer]', 'graph TD\n  x[x = 4] --> f[f = 196]');
  await page.goto(POST);
  const panels = page.locator('figure.mermaid-panel');
  await expect(panels).toHaveCount(2);
  for (const i of [0, 1]) {
    await expect(panels.nth(i)).toHaveClass(/is-rendered/);
    await expect(panels.nth(i).locator('svg')).toBeVisible();
  }
  await expect(panels.nth(1).locator('svg')).toContainText('f = 196');
});

test('falls back to the source when a diagram has a syntax error', async ({ page }) => {
  await withPanels(page, 'graph LR\n  A --&gt;');
  await page.goto(POST);
  const broken = page.locator('figure.mermaid-panel').first();
  await expect(broken).toHaveClass(/is-error/);
  await expect(broken.locator('.mermaid-note')).toContainText("couldn't be drawn");
  await expect(broken.locator('pre.mermaid-src')).toContainText('A -->');
});

test('re-renders diagrams when the theme changes', async ({ page }) => {
  await withPanels(page, 'graph LR\n  A[question] --> B[answer]');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(POST);
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
