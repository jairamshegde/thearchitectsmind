import { expect, test } from '@playwright/test';

test('About in the nav goes to the about page', async ({ page }) => {
  await page.goto('./notes/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
});

test('Notes in the nav goes straight to the notes index from other pages', async ({ page }) => {
  await page.goto('./about/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Notes' }).click();
  await expect(page).toHaveURL(/\/notes\/$/);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('keeps only Blog, the theme toggle and Contact in the bar', async ({ page }) => {
    await page.goto('./');
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const name of ['Projects', 'Notes', 'About']) await expect(nav.getByRole('link', { name, exact: true })).toBeHidden();
    await expect(nav.getByRole('link', { name: 'Blog', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
    await expect(page.locator('[data-theme-toggle]')).toBeVisible();
  });
});
