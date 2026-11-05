import { expect, test } from '@playwright/test';

test('About in the nav goes to the about page', async ({ page }) => {
  await page.goto('./notes/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
});

test('Notes in the nav goes straight to the notes index', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Notes' }).click();
  await expect(page).toHaveURL(/\/notes\/$/);
});
