const { test, expect } = require('@playwright/test');

test('opens on understandable mobile game home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await expect(page.getByText('Charge warp before shields fail')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quick Mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Crew Mission' })).toBeVisible();
});

test('keeps mobile controls inside narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
