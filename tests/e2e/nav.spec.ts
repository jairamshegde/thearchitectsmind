import { expect, test } from '@playwright/test';

test('Projects in the nav goes from another page to the home Featured projects section', async ({ page }) => {
  await page.goto('./notes/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.locator('#projects')).toBeInViewport();
});

test('Notes in the nav goes straight to the notes index', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Notes' }).click();
  await expect(page).toHaveURL(/\/notes\/$/);
});
