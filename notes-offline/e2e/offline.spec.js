import { test, expect } from '@playwright/test';

test('saved notes survive an offline page reload', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New note' }).click();
  const title = `Offline ${Date.now()}`;
  const body = 'Available without the server';
  const sidebar = page.locator('.mantine-AppShell-navbar');
  await page.getByPlaceholder('Note title').fill(title);
  await expect(sidebar.getByText(title)).toBeVisible();
  await page.getByPlaceholder('Start writing... (supports Markdown)').fill(body);
  await expect(sidebar.getByText(body)).toBeVisible();

  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // Load once under service worker control to cache the page and its bundles.
  await page.reload();
  await expect(sidebar.getByText(title)).toBeVisible();
  await page.waitForLoadState('networkidle');

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sidebar.getByText(title).click();
  await expect(page.getByPlaceholder('Note title')).toHaveValue(title);
  await expect(page.getByPlaceholder('Start writing... (supports Markdown)')).toHaveValue(body);
});
