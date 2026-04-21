import { test, expect } from '@playwright/test';

const uid = () => Math.random().toString(36).slice(2, 8);

test.describe('Notes Offline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the app with empty state', async ({ page }) => {
    await expect(page.getByText('Your notes, always available')).toBeVisible();
    await expect(
      page.getByText('Select a note from the sidebar or create a new one')
    ).toBeVisible();
  });

  test('should create a new note with the button', async ({ page }) => {
    await page.getByRole('button', { name: 'New note' }).click();

    // Note editor should appear with title input
    await expect(page.getByPlaceholder('Note title')).toBeVisible();
    await expect(page.getByPlaceholder('Start writing... (supports Markdown)')).toBeVisible();
  });

  test('should create a new note with keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Alt+n');

    await expect(page.getByPlaceholder('Note title')).toBeVisible();
  });

  test('should edit note title and body', async ({ page }) => {
    const title = `Note ${uid()}`;
    await page.getByRole('button', { name: 'New note' }).click();

    await page.getByPlaceholder('Note title').fill(title);

    // Wait for title debounce (500ms) to flush before filling body,
    // otherwise the body save replaces the pending title save
    const sidebar = page.locator('.mantine-AppShell-navbar');
    await expect(sidebar.getByText(title)).toBeVisible({ timeout: 5000 });

    const body = `Body ${uid()}`;
    await page.getByPlaceholder('Start writing... (supports Markdown)').fill(body);

    await expect(sidebar.getByText(body)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should add and remove tags', async ({ page }) => {
    const tag = `tag-${uid()}`;
    await page.getByRole('button', { name: 'New note' }).click();

    // Add a tag
    await page.getByPlaceholder('Add tag...').fill(tag);
    await page.getByPlaceholder('Add tag...').press('Enter');

    await expect(page.getByLabel(`Remove tag ${tag}`)).toBeVisible();

    // Remove the tag
    await page.getByLabel(`Remove tag ${tag}`).click();

    await expect(page.getByLabel(`Remove tag ${tag}`)).not.toBeVisible();
  });

  test('should pin a note and it floats to top', async ({ page }) => {
    // Create first note
    await page.getByRole('button', { name: 'New note' }).click();
    const firstTitle = `First ${uid()}`;
    await page.getByPlaceholder('Note title').fill(firstTitle);

    // Wait for debounce
    const sidebar = page.locator('.mantine-AppShell-navbar');
    await expect(sidebar.getByText(firstTitle)).toBeVisible({ timeout: 3000 });

    // Deselect and create second note
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'New note' }).click();
    const secondTitle = `Second ${uid()}`;
    await page.getByPlaceholder('Note title').fill(secondTitle);
    await expect(sidebar.getByText(secondTitle)).toBeVisible({ timeout: 3000 });

    // Deselect, then select first note and pin it
    await page.keyboard.press('Escape');
    await sidebar.getByText(firstTitle).click();

    // Click the pin button in the toolbar
    await page
      .locator('button')
      .filter({ has: page.locator('[class*="tabler-icon-pin"]') })
      .first()
      .click();

    // First note should now be at the top of the list
    const noteCards = sidebar.locator('.mantine-Card-root');
    await expect(noteCards.first()).toContainText(firstTitle);
  });

  test('should search notes', async ({ page }) => {
    const sidebar = page.locator('.mantine-AppShell-navbar');
    const appleTitle = `Apple ${uid()}`;
    const bananaTitle = `Banana ${uid()}`;

    // Create two notes
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByPlaceholder('Note title').fill(appleTitle);
    await expect(sidebar.getByText(appleTitle)).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByPlaceholder('Note title').fill(bananaTitle);
    await expect(sidebar.getByText(bananaTitle)).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');

    // Search for the apple note's unique suffix
    const appleUid = appleTitle.split(' ')[1];
    await page.getByPlaceholder('Search notes...').fill(appleUid);

    await expect(sidebar.getByText(appleTitle)).toBeVisible();
    await expect(sidebar.getByText(bananaTitle)).not.toBeVisible();

    // Clear search
    await page.getByPlaceholder('Search notes...').clear();

    await expect(sidebar.getByText(bananaTitle)).toBeVisible();
  });

  test('should delete a note and find it in trash', async ({ page }) => {
    const sidebar = page.locator('.mantine-AppShell-navbar');
    const title = `Trash ${uid()}`;

    // Create a note
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByPlaceholder('Note title').fill(title);
    await expect(sidebar.getByText(title)).toBeVisible({ timeout: 3000 });

    // Delete it
    await page.getByLabel('Delete note').click();

    // Note should be gone from main list
    await expect(sidebar.getByText(title)).not.toBeVisible();

    // Open trash view
    await page.getByLabel('View trash').click();
    await expect(page.getByText('Trash', { exact: true })).toBeVisible();
    await expect(sidebar.getByText(title)).toBeVisible();
  });

  test('should recover a note from trash', async ({ page }) => {
    const sidebar = page.locator('.mantine-AppShell-navbar');

    // Create and delete a note
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByLabel('Delete note').click();

    // Go to trash. Should have at least one note
    await page.getByLabel('View trash').click();
    await expect(page.getByText('Trash', { exact: true })).toBeVisible();
    const trashCountBefore = await sidebar.locator('.mantine-Card-root').count();
    expect(trashCountBefore).toBeGreaterThan(0);

    // Recover the first note
    await page.getByLabel('Recover note').first().click();

    // Trash count should decrease
    await expect(sidebar.locator('.mantine-Card-root')).toHaveCount(trashCountBefore - 1);

    // Go back to notes view. Recovered note should be there
    await page.getByLabel('Back to notes').click();
    await expect(page.getByText('Notes', { exact: true })).toBeVisible();
  });

  test('should toggle dark and light mode', async ({ page }) => {
    // Click the theme toggle (sun/moon icon)
    const themeToggle = page.locator('button').filter({
      has: page.locator('[class*="tabler-icon-sun"], [class*="tabler-icon-moon"]'),
    });

    const initialColorScheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-mantine-color-scheme')
    );

    await themeToggle.first().click();

    const newColorScheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-mantine-color-scheme')
    );

    expect(newColorScheme).not.toBe(initialColorScheme);
  });

  test('should toggle between edit and preview mode', async ({ page }) => {
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByPlaceholder('Start writing... (supports Markdown)').fill('**Bold text**');

    // Switch to preview mode
    await page.getByText('Preview').click();

    // Should render markdown
    await expect(page.locator('strong').getByText('Bold text')).toBeVisible();

    // Switch back to edit mode
    await page.getByText('Edit').click();

    await expect(page.getByPlaceholder('Start writing... (supports Markdown)')).toBeVisible();
  });

  test('notes are isolated per device (different ownerIds)', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    try {
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      await pageA.goto('/');
      await pageA.waitForLoadState('networkidle');
      await pageB.goto('/');
      await pageB.waitForLoadState('networkidle');

      const ownerA = await pageA.evaluate(() => localStorage.getItem('notes-offline.ownerId'));
      const ownerB = await pageB.evaluate(() => localStorage.getItem('notes-offline.ownerId'));
      expect(ownerA).toBeTruthy();
      expect(ownerB).toBeTruthy();
      expect(ownerA).not.toBe(ownerB);

      const secretTitle = `Secret ${uid()}`;
      await pageA.getByRole('button', { name: 'New note' }).click();
      await pageA.getByPlaceholder('Note title').fill(secretTitle);

      const sidebarA = pageA.locator('.mantine-AppShell-navbar');
      await expect(sidebarA.getByText(secretTitle)).toBeVisible({ timeout: 5000 });

      // Give server-side sync time to settle, then refresh context B
      await pageB.waitForTimeout(500);
      await pageB.reload();
      await pageB.waitForLoadState('networkidle');

      const sidebarB = pageB.locator('.mantine-AppShell-navbar');
      await expect(sidebarB.getByText(secretTitle)).not.toBeVisible();
      await expect(sidebarB.getByText('No notes yet. Create one!')).toBeVisible();
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('should switch language and translate UI strings', async ({ page }) => {
    const sidebar = page.locator('.mantine-AppShell-navbar');

    // Default locale is English; header shows "Notes"
    await expect(sidebar.getByText('Notes', { exact: true })).toBeVisible();

    // Switch to Spanish via the language menu in the sidebar header
    await sidebar.getByLabel('Language').click();
    await page.getByRole('menuitem', { name: 'ES' }).click();

    // Header should now show the Spanish translation
    await expect(sidebar.getByText('Notas', { exact: true })).toBeVisible();

    // Placeholder in the search input should also be translated
    await expect(page.getByPlaceholder('Buscar notas...')).toBeVisible();

    // Choice should persist in localStorage
    const stored = await page.evaluate(() => localStorage.getItem('notes-offline.locale'));
    expect(stored).toBe('es');
  });
});
