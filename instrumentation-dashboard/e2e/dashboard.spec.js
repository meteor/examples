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

// gridstack animates moves: grab a panel's title once it has stopped.
async function dragServersLeft(page) {
  const title = page.locator('.panel[data-panel="instances"] .panel-title');
  let box;
  for (let previous = null; ; previous = box) {
    box = await title.boundingBox();
    if (previous && previous.x === box.x && previous.y === box.y) break;
    await page.waitForTimeout(200);
  }
  await page.mouse.move(box.x + 20, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x - 700, box.y + 10, { steps: 12 });
  await page.mouse.up();
}

test('a panel moved on one dashboard moves on the others, until the layout is reset', async ({ browser }) => {
  const pages = [];
  for (let index = 0; index < 2; index += 1) {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
    await page.goto('/admin');
    await expect(page.locator('.panel[data-panel="instances"]')).toBeVisible();
    pages.push(page);
  }
  const [mover, watcher] = pages;
  await mover.getByRole('button', { name: 'Reset layout' }).click();
  const column = (page) => page.locator('.grid-stack-item[gs-id="instances"]');
  await expect(column(watcher)).toHaveAttribute('gs-x', '8');

  await expect(column(mover)).toHaveAttribute('gs-x', '8');
  // Drag the Servers panel by its title to the left edge.
  await dragServersLeft(mover);
  await expect(column(mover)).toHaveAttribute('gs-x', '0');
  await expect(column(watcher)).toHaveAttribute('gs-x', '0');

  await watcher.getByRole('button', { name: 'Reset layout' }).click();
  await expect(column(mover)).toHaveAttribute('gs-x', '8');
  await Promise.all(pages.map((page) => page.context().close()));
});

test('a narrow screen neither saves its one column nor brings back an old layout when it widens', async ({ browser }) => {
  const wide = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  await wide.goto('/admin');
  await wide.getByRole('button', { name: 'Reset layout' }).click();
  const servers = (page) => page.locator('.grid-stack-item[gs-id="instances"]');
  await expect(servers(wide)).toHaveAttribute('gs-x', '8');
  await dragServersLeft(wide);
  await expect(servers(wide)).toHaveAttribute('gs-x', '0');

  // A phone opens the dashboard, then turns to landscape.
  const phone = await (await browser.newContext({ viewport: { width: 400, height: 900 } })).newPage();
  await phone.goto('/admin');
  await expect(phone.locator('.grid-stack.gs-1')).toBeVisible();
  await phone.setViewportSize({ width: 1280, height: 900 });
  await expect(phone.locator('.grid-stack.gs-12')).toBeVisible();
  await expect(servers(phone)).toHaveAttribute('gs-x', '0');
  // Give a stray save the time to reach the other dashboard.
  await wide.waitForTimeout(1000);
  await expect(servers(wide)).toHaveAttribute('gs-x', '0');
  await Promise.all([wide, phone].map((page) => page.context().close()));
});
