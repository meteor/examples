import { expect, test, type PlaywrightOptions } from '@rstest/playwright';

import { completeGame, failureScreenshotPath, requireBaseUrl } from './helpers';

const headed = process.env.SHOWCASE_HEADED === '1';
const e2e = test.extend({
  playwright: {
    launchOptions: { headless: !headed, slowMo: headed ? 100 : 0 },
    trace: 'retain-on-failure',
  } satisfies PlaywrightOptions,
});

e2e('completed game appears reactively in second browser context', async ({
  browser,
  onTestFailed,
  page,
  request,
}) => {
  onTestFailed(async ({ task }) => {
    await page.screenshot({ fullPage: true, path: failureScreenshotPath(task.id) });
  });

  const seed = 'e2e-showcase';
  const url = requireBaseUrl();
  const health = await request.get(new URL('/health', url).toString());
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ ok: true, mongo: 'ready' });

  const observerContext = await browser.newContext();
  const observer = await observerContext.newPage();
  try {
    await observer.goto(url);
    await expect(observer.getByText('No completed games yet.'))
      .toBeVisible({ timeout: 15_000 });

    await page.goto(`${url}?seed=${seed}`);
    await expect(page).toHaveTitle(/Memory Match.*Meteor Rstest Showcase/i);
    await expect(page.getByRole('heading', { name: 'Memory Match' })).toBeVisible();
    await expect(page.getByLabel('Player name')).toBeVisible();
    await page.getByLabel('Player name').fill('E2E Ada');
    await page.getByRole('button', { name: 'Start game' }).click();
    await expect(page.getByRole('grid', { name: 'Memory cards' })).toBeVisible();

    await completeGame(page, seed);
    await expect(page.getByRole('status')).toContainText('Game completed');
    await expect(page.getByRole('status')).toContainText('8 moves');
    await expect(observer.getByRole('listitem').filter({ hasText: 'E2E Ada' }))
      .toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'New game' }).click();
    await page.getByLabel('Player name').fill('E2E Grace');
    await page.getByRole('button', { name: 'Start game' }).click();
    await expect(page.getByRole('heading', { name: "E2E Grace's board" })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Moves: 0');
    await expect(page.getByRole('button', { name: /^Hidden card/ })).toHaveCount(16);
  } finally {
    await observerContext.close();
  }
});
