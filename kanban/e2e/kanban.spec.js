import { test, expect } from '@playwright/test';

const createBoard = async (page, title) => {
  await page.goto('/');
  await page.getByLabel('Board title').fill(title);
  await page.getByRole('button', { name: 'Create a board' }).click();
  await expect(page).toHaveURL(/\/b\/[A-Za-z0-9]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
};

const column = (page, title) => page.locator('.column', { has: page.getByRole('heading', { name: title }) });

const addCard = async (page, columnTitle, title) => {
  await page.getByLabel(`New card in ${columnTitle}`).fill(title);
  await page.getByLabel(`New card in ${columnTitle}`).press('Enter');
  await expect(column(page, columnTitle).locator('.card', { hasText: title })).toBeVisible();
};

test('a new board has three columns', async ({ page }) => {
  await createBoard(page, 'Release 3.1');
  await expect(page.locator('.column h2')).toHaveText([/To do/, /Doing/, /Done/]);
});

test('typing adds one card, pasting a list adds several', async ({ page }) => {
  await createBoard(page, 'Paste test');
  await addCard(page, 'To do', 'Write the changelog');

  const input = page.getByLabel('New card in Doing');
  await input.focus();
  await input.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', '- Review PRs\n- Tag the release\n- Announce it');
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
  });
  await expect(column(page, 'Doing').locator('.card')).toHaveText(['Review PRs', 'Tag the release', 'Announce it']);
});

test('a card can be dragged to another column', async ({ page }) => {
  await createBoard(page, 'Drag test');
  await addCard(page, 'To do', 'Fix the build');

  const card = column(page, 'To do').locator('.card', { hasText: 'Fix the build' });
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await card.dispatchEvent('dragstart', { dataTransfer });
  await column(page, 'Doing').locator('.cards').dispatchEvent('drop', { dataTransfer });

  await expect(column(page, 'Doing').locator('.card', { hasText: 'Fix the build' })).toBeVisible();
  await expect(column(page, 'To do').locator('.card')).toHaveCount(0);
});

test('the editor dialog saves a card and closes', async ({ page }) => {
  await createBoard(page, 'Editor test');
  await addCard(page, 'To do', 'Draft');

  await page.locator('.card', { hasText: 'Draft' }).click();
  const dialog = page.locator('dialog.card-editor');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title').fill('Draft the release notes');
  await dialog.getByLabel('Description').fill('Mention the async helpers.');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.locator('.card', { hasText: 'Draft the release notes' })).toBeVisible();
  await expect(page.locator('.card .has-description')).toBeVisible();

  await page.locator('.card', { hasText: 'Draft the release notes' }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('another tab sees the board change live', async ({ page, context }) => {
  await createBoard(page, 'Live test');
  const otherTab = await context.newPage();
  await otherTab.goto(page.url());
  await expect(otherTab.getByRole('heading', { level: 1 })).toHaveText('Live test');

  await addCard(page, 'Done', 'Shipped');
  await expect(column(otherTab, 'Done').locator('.card', { hasText: 'Shipped' })).toBeVisible();
});
