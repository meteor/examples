const { expect, test } = require('@playwright/test');

async function openApp(page, { testMode = false } = {}) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(testMode ? '/?testMode=1' : '/');
  await expect(page.getByRole('heading', { name: 'Meteor Drop' })).toBeVisible();
}

test('opens on an instantly understandable mobile game home', async ({ page }) => {
  await openApp(page);

  await expect(page.getByText('Connect four meteors before your rival.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play vs CPU' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Live Match' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join Live Match' })).toBeVisible();

  const actions = page.locator('.play-home__actions button');
  for (let index = 0; index < (await actions.count()); index += 1) {
    expect((await actions.nth(index).boundingBox()).height).toBeGreaterThanOrEqual(48);
  }
});

test('wins accelerated CPU match with one obvious column tap', async ({ page }) => {
  await openApp(page, { testMode: true });
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  await expect(page.getByRole('heading', { name: 'Your turn' })).toBeVisible();
  await expect(page.getByRole('grid', { name: 'Meteor Drop board' })).toBeVisible();
  await expect(page.locator('.meteor-board__cell')).toHaveCount(42);
  await page.getByRole('button', { name: 'Drop meteor in column 4' }).click();

  await expect(page.getByRole('heading', { name: 'Four connected!' })).toBeVisible();
  await expect(page.getByText('You win')).toBeVisible();
  await expect(
    page
      .getByRole('dialog', { name: 'Four connected!' })
      .getByText('7 moves'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Close result' }).click();
  await expect(page.getByRole('button', { name: 'View result' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Match home' })).toBeVisible();
});

test('shows CPU move through reactive game state', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Play vs CPU' }).click();
  await page.getByRole('button', { name: 'Drop meteor in column 4' }).click();

  await expect(page.getByRole('heading', { name: 'CPU thinking' })).toBeVisible();
  await expect(page.locator('.meteor-board__cell[data-marker="rival"]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Your turn' })).toBeVisible();
  await expect(page.locator('.meteor-board__cell[data-marker="player"]')).toHaveCount(1);
});

test('keeps every column touch target reachable on narrow phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  const board = page.getByRole('grid', { name: 'Meteor Drop board' });
  const boardBox = await board.boundingBox();
  expect(boardBox.x).toBeGreaterThanOrEqual(0);
  expect(boardBox.x + boardBox.width).toBeLessThanOrEqual(320);

  const columns = page.locator('.meteor-board__column-target');
  await expect(columns).toHaveCount(7);
  for (let index = 0; index < 7; index += 1) {
    const box = await columns.nth(index).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});

test('centers board without losing native character on tablet', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  const boardBox = await page
    .getByRole('grid', { name: 'Meteor Drop board' })
    .boundingBox();
  expect(boardBox.width).toBeLessThanOrEqual(560);
  expect(boardBox.x).toBeGreaterThan(90);
  expect(boardBox.x + boardBox.width).toBeLessThan(678);
});

test('validates live match room code in mobile sheet', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Join Live Match' }).click();

  await expect(page.getByRole('dialog', { name: 'Join Live Match' })).toBeVisible();
  const input = page.getByLabel('Room code');
  await input.fill('ABC');
  await input.blur();
  await expect(page.getByText('Enter a six-character room code.')).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
});

test('keeps technical controls on System screen with HCP review flow', async ({ page }) => {
  await openApp(page);
  await page.getByRole('link', { name: 'System' }).click();

  await expect(page.getByRole('heading', { name: 'System information' })).toBeVisible();
  await expect(page.getByLabel(/Meteor\.isCapacitor/)).toBeVisible();
  await expect(page.getByText(/DDP/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Preview HCP update' }).click();
  await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByText('Update ready')).toBeVisible();
});
