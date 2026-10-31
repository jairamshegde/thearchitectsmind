import { expect, test } from '@playwright/test';

test('more projects shows 5 per page, and a tag filter pages through its matches', async ({ page }) => {
  await page.goto('projects/');
  const cards = page.locator('.proj-card');
  const visible = page.locator('.proj-card:visible');
  const total = await cards.count();
  await expect(visible).toHaveCount(Math.min(total, 5));

  const nav = page.locator('.more-projects .pagination');
  if (total > 5) {
    await expect(nav.locator('[aria-current="page"]')).toHaveText('1');
    const first = await visible.first().locator('h3').textContent();
    await nav.getByRole('button', { name: 'Page 2' }).click();
    await expect(nav.locator('[aria-current="page"]')).toHaveText('2');
    await expect(visible.first().locator('h3')).not.toHaveText(first!);
  } else {
    await expect(nav).toBeHidden();
  }

  const filter = page.locator('.more-projects .tag-filter button').nth(1);
  const tag = (await filter.getAttribute('data-tag'))!;
  await filter.click();
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  for (const tags of await visible.evaluateAll((els) => els.map((el) => JSON.parse((el as HTMLElement).dataset.tags!)))) {
    expect(tags).toContain(tag);
  }
});
