import { test, expect } from '@playwright/test';

test('adding a task shows it in the list', async ({ page }) => {
  await page.goto('/');
  const text = `Write the report ${Date.now()}`;
  await page.getByLabel('New task').fill(text);
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('.task-list .text', { hasText: text })).toBeVisible();
});

test('the admin dashboard reflects generated traffic', async ({ page }) => {
  await page.goto('/admin');
  const newestEvent = page.locator('.events .inspect').first();
  await expect(newestEvent).toBeVisible({ timeout: 15000 });
  const newestBefore = await newestEvent.textContent();

  await page.getByRole('button', { name: 'Generate sample traffic' }).click();

  // The window slides, so older calls may leave it meanwhile: check what the
  // click adds rather than a difference of totals.
  await expect(newestEvent).not.toHaveText(newestBefore, { timeout: 15000 });
  const calls = page.locator('[data-tile="calls"]');
  await expect.poll(async () => Number(await calls.textContent()), { timeout: 15000 })
    .toBeGreaterThanOrEqual(20);
  const errorRow = page.locator('.events .inspect[data-type="method.error"]').first();
  await expect(errorRow).toBeVisible();

  await errorRow.click();
  const inspector = page.locator('dialog.inspector');
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText('empty-task');
  await inspector.getByRole('button', { name: 'Close' }).click();
  await expect(inspector).toBeHidden();
});
