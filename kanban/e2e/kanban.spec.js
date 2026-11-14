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

// Drags a card with the mouse and releases it on the upper half of another
// card, which puts it just above that card.
const dragAbove = (card, target) => card.dragTo(target, { targetPosition: { x: 10, y: 5 } });

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

  // The stub draws the cards at once: after a reload, the board shows what the
  // server kept.
  await page.reload();
  await expect(column(page, 'To do').locator('.card')).toHaveText(['Write the changelog']);
  await expect(column(page, 'Doing').locator('.card')).toHaveText(['Review PRs', 'Tag the release', 'Announce it']);
});

test('a card can be dragged to another column', async ({ page }) => {
  await createBoard(page, 'Drag test');
  await addCard(page, 'To do', 'Fix the build');

  await column(page, 'To do').locator('.card', { hasText: 'Fix the build' }).dragTo(column(page, 'Doing'));
  await expect(column(page, 'Doing').locator('.card', { hasText: 'Fix the build' })).toBeVisible();

  await page.reload();
  await expect(column(page, 'Doing').locator('.card')).toHaveText(['Fix the build']);
  await expect(column(page, 'To do').locator('.card')).toHaveCount(0);
});

test('cards can be reordered inside a column', async ({ page }) => {
  await createBoard(page, 'Reorder test');
  for (const title of ['A', 'B', 'C']) await addCard(page, 'To do', title);
  const cards = column(page, 'To do').locator('.card');

  // Released on the column's title, above every card: C goes first.
  await cards.nth(2).dragTo(column(page, 'To do').getByRole('heading'));
  await expect(cards).toHaveText(['C', 'A', 'B']);
  await dragAbove(cards.nth(2), cards.nth(1));
  await expect(cards).toHaveText(['C', 'B', 'A']);

  await page.reload();
  await expect(cards).toHaveText(['C', 'B', 'A']);
});

test('a link dropped on a column is not taken for a card', async ({ page }) => {
  await createBoard(page, 'Link drop test');
  await addCard(page, 'To do', 'Fix the build');

  await page.getByRole('link', { name: 'Kanban' }).dragTo(column(page, 'Doing'));
  // A card moved after it: had the link been taken for a card, its "No such
  // card" notice would be up by now.
  await column(page, 'To do').locator('.card').dragTo(column(page, 'Doing'));
  await expect(column(page, 'Doing').locator('.card')).toHaveText(['Fix the build']);
  await expect(page.locator('.toast')).toBeEmpty();
});

test('a card deleted in another tab while it is dragged is reported, not thrown', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await createBoard(page, 'Deleted card test');
  await addCard(page, 'To do', 'Gone soon');
  const otherTab = await context.newPage();
  await otherTab.goto(page.url());

  // Picked up and held over Doing while the other tab deletes it.
  await column(page, 'To do').locator('.card').hover();
  await page.mouse.down();
  await column(page, 'Doing').hover();
  await otherTab.locator('.card', { hasText: 'Gone soon' }).click();
  await otherTab.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.card')).toHaveCount(0);
  await page.mouse.up();

  await expect(page.locator('.toast')).toHaveText('No such card');
  // By the time the notice goes, an unhandled rejection would have been reported.
  await expect(page.locator('.toast')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a column renumbered after many moves keeps its order', async ({ page }) => {
  await createBoard(page, 'Renumber test');
  for (const title of ['A', 'B', 'C', 'D']) await addCard(page, 'To do', title);
  const cards = column(page, 'To do').locator('.card');
  await dragAbove(cards.nth(3), cards.nth(0));
  await expect(cards).toHaveText(['D', 'A', 'B', 'C']);

  // Each swap of A and B halves the gap below D, until the 21st makes
  // cards.move renumber the column, in the stub as on the server.
  for (let move = 1; move <= 21; move += 1) {
    await dragAbove(cards.nth(2), cards.nth(1));
    await expect(cards).toHaveText(move % 2 ? ['D', 'B', 'A', 'C'] : ['D', 'A', 'B', 'C']);
  }
  await page.reload();
  await expect(cards).toHaveText(['D', 'B', 'A', 'C']);
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
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/#card=/);
});

test('Enter in the Title field saves the card', async ({ page }) => {
  await createBoard(page, 'Enter test');
  await addCard(page, 'To do', 'Draft');

  await page.locator('.card', { hasText: 'Draft' }).click();
  const dialog = page.locator('dialog.card-editor');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title').fill('Saved with Enter');
  await dialog.getByLabel('Title').press('Enter');

  await expect(dialog).toBeHidden();
  await expect(page.locator('.card')).toHaveText(['Saved with Enter']);
});

test('the editor moves a card to another column without a drag', async ({ page }) => {
  await createBoard(page, 'Keyboard move test');
  await addCard(page, 'Done', 'Shipped');
  await addCard(page, 'Doing', 'Moved');

  await page.locator('.card', { hasText: 'Moved' }).press('Enter');
  const dialog = page.locator('dialog.card-editor');
  await expect(dialog).toBeVisible();
  // The field starts on the card's own column, or a plain save would move it.
  await expect(dialog.getByLabel('Column').locator('option:checked')).toHaveText('Doing');
  await dialog.getByLabel('Column').selectOption({ label: 'Done' });
  await dialog.getByLabel('Title').press('Enter');

  await expect(dialog).toBeHidden();
  await expect(column(page, 'Done').locator('.card')).toHaveText(['Shipped', 'Moved']);
  await expect(column(page, 'Done').locator('.card', { hasText: 'Moved' })).toBeFocused();
  await page.reload();
  await expect(column(page, 'Done').locator('.card')).toHaveText(['Shipped', 'Moved']);
  await expect(column(page, 'Doing').locator('.card')).toHaveCount(0);
});

test('a card link opens the editor, Back and Forward switch pages', async ({ page, context }) => {
  await createBoard(page, 'Link test');
  await addCard(page, 'To do', 'Linked');
  await page.locator('.card', { hasText: 'Linked' }).click();
  await expect(page.locator('dialog.card-editor')).toBeVisible();
  await expect(page).toHaveURL(/#card=[A-Za-z0-9]+$/);

  const otherTab = await context.newPage();
  await otherTab.goto(page.url());
  await expect(otherTab.locator('dialog.card-editor').getByLabel('Title')).toHaveValue('Linked');

  await page.keyboard.press('Escape');
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Create a board' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Link test');
});

test('a notice is not shown again when the board comes back', async ({ page }) => {
  await createBoard(page, 'Notice test');
  // A blank title gets past `required`, and the Method refuses it.
  await page.getByLabel('New card in To do').fill(' ');
  await page.getByLabel('New card in To do').press('Enter');
  await expect(page.locator('.toast')).toHaveText('A card needs a title');

  await page.goBack();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notice test');
  await expect(page.locator('.toast')).toBeEmpty();
});

test('each column menu opens under its own button', async ({ page }) => {
  await createBoard(page, 'Menu test');
  for (const title of ['To do', 'Doing', 'Done']) {
    const button = page.getByRole('button', { name: `Menu for ${title}` });
    await button.click();
    const menu = column(page, title).locator('.menu');
    await expect(menu).toBeVisible();
    const buttonBox = await button.boundingBox();
    const menuBox = await menu.boundingBox();
    // Below the button, and across its middle.
    expect(menuBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);
    expect(menuBox.x).toBeLessThan(buttonBox.x + buttonBox.width / 2);
    expect(menuBox.x + menuBox.width).toBeGreaterThan(buttonBox.x + buttonBox.width / 2);
    await page.keyboard.press('Escape');
  }

  await page.getByRole('button', { name: 'Menu for Doing' }).click();
  // A popover takes the browser's text colour unless the menu sets the page's.
  const textColour = await page.getByRole('heading', { level: 1 }).evaluate((heading) => getComputedStyle(heading).color);
  await expect(page.getByRole('button', { name: 'Rename' })).toHaveCSS('color', textColour);
  await page.getByRole('button', { name: 'Rename' }).click();
  const titleInput = page.getByLabel('Column title', { exact: true });
  await titleInput.fill('In progress');
  await titleInput.press('Enter');
  await expect(page.locator('.column h2')).toHaveText([/To do/, /In progress/, /Done/]);
});

test('a column menu at the left edge of a narrow screen opens on it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createBoard(page, 'Narrow screen test');
  const button = page.getByRole('button', { name: 'Menu for Doing' });
  // The board scrolled until the button touches the left edge of the screen.
  await button.evaluate((element) => element.scrollIntoView({ block: 'nearest', inline: 'start' }));
  await button.click();

  // No room on the left of the button: the menu hangs from its left edge.
  const buttonBox = await button.boundingBox();
  const menuBox = await column(page, 'Doing').locator('.menu').boundingBox();
  expect(menuBox.x).toBeGreaterThanOrEqual(buttonBox.x);
  expect(menuBox.x).toBeLessThan(buttonBox.x + buttonBox.width / 2);
});

test('deleting a column leaves what is typed in the next one', async ({ page }) => {
  await createBoard(page, 'Delete column test');
  await page.getByLabel('New card in Doing').fill('Half typed');
  await page.getByRole('button', { name: 'Menu for To do' }).click();
  await page.getByRole('button', { name: 'Delete column' }).click();

  await expect(page.locator('.column h2')).toHaveText([/Doing/, /Done/]);
  await expect(page.getByLabel('New card in Doing')).toHaveValue('Half typed');
});

test('a card added to a new column before the server answers is kept', async ({ page }) => {
  // A slow network: whatever the server sends over a WebSocket arrives 300 ms late.
  await page.routeWebSocket('**/websocket', (socket) => {
    const server = socket.connectToServer();
    server.onMessage((message) => setTimeout(() => socket.send(message), 300));
  });
  await createBoard(page, 'New column test');
  await page.getByLabel('New column title').fill('Blocked');
  await page.getByLabel('New column title').press('Enter');
  // The card goes to the id the stub gave the column, which must be the one the
  // server stored.
  await addCard(page, 'Blocked', 'Waiting on legal');

  await page.reload();
  await expect(column(page, 'Blocked').locator('.card')).toHaveText(['Waiting on legal']);
});

test('Copy link copies the board address without a card in it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await createBoard(page, 'Copy test');
  const boardUrl = page.url();
  // A link to a card deleted since: the fragment stays in the address bar.
  await page.goto(`${boardUrl}#card=gone`);
  await page.getByRole('button', { name: 'Copy link' }).click();

  await expect(page.locator('.toast')).toHaveText('Board link copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(boardUrl);
});

test('Copy link says so when the page cannot use the clipboard', async ({ page }) => {
  // Plain HTTP from another host is not a secure context: there is no
  // `navigator.clipboard` at all.
  await page.addInitScript(() => delete Navigator.prototype.clipboard);
  await createBoard(page, 'No clipboard test');
  await page.getByRole('button', { name: 'Copy link' }).click();

  await expect(page.locator('.toast')).toHaveText('Copying needs HTTPS or localhost');
});

test('another tab sees the board change live', async ({ page, context }) => {
  await createBoard(page, 'Live test');
  const otherTab = await context.newPage();
  await otherTab.goto(page.url());
  await expect(otherTab.getByRole('heading', { level: 1 })).toHaveText('Live test');

  await addCard(page, 'Done', 'Shipped');
  await expect(column(otherTab, 'Done').locator('.card', { hasText: 'Shipped' })).toBeVisible();
});
