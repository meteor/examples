import { test, expect } from '@playwright/test';

// Each test gets a unique user to avoid cross-test state issues
let userCounter = 0;
function uniqueUser() {
  userCounter++;
  return {
    email: `test-${Date.now()}-${userCounter}@example.com`,
    password: 'password123',
  };
}

async function registerAndLogin(page, { email, password }) {
  await page.goto('/');
  await expect(page.getByTestId('login-submit')).toBeVisible({ timeout: 15000 });

  // Switch to register mode
  await page.getByTestId('login-toggle').click();

  await page.getByTestId('login-email').locator('input').fill(email);
  await page.getByTestId('login-password').locator('input').fill(password);
  await page.getByTestId('login-submit').click();

  // Wait for contacts page
  await expect(page.getByTestId('add-contact-fab')).toBeVisible({ timeout: 15000 });
}

async function addContact(page, { firstName, lastName, phone, email, company }) {
  await page.getByTestId('add-contact-fab').click();
  await expect(page.getByTestId('contact-form-page')).toBeVisible({ timeout: 5000 });

  await page.getByTestId('input-firstName').locator('input').fill(firstName);
  if (lastName) await page.getByTestId('input-lastName').locator('input').fill(lastName);
  if (phone) await page.getByTestId('input-phone').locator('input').fill(phone);
  if (email) await page.getByTestId('input-email').locator('input').fill(email);
  if (company) await page.getByTestId('input-company').locator('input').fill(company);
  await page.getByTestId('save-btn').click();

  await expect(page.getByText(`${firstName} ${lastName || ''}`.trim())).toBeVisible({ timeout: 5000 });
}

test.describe('Contacts App', () => {
  test('shows login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-submit')).toBeVisible({ timeout: 15000 });
  });

  test('can register and see empty contacts page', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    // Should see the empty state or the fab
    await expect(page.getByTestId('add-contact-fab')).toBeVisible();
  });

  test('can add a new contact', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);

    await addContact(page, {
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '555-0101',
      email: 'alice@example.com',
      company: 'Meteor Inc',
    });

    await expect(page.getByText('Alice Smith')).toBeVisible();
  });

  test('can view contact details', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    await addContact(page, { firstName: 'Bob', lastName: 'Jones', phone: '555-0202', email: 'bob@test.com' });

    await page.getByText('Bob Jones').click();
    await expect(page.getByTestId('contact-detail-page')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('contact-name')).toContainText('Bob Jones');
    await expect(page.getByTestId('contact-phone')).toContainText('555-0202');
    await expect(page.getByTestId('contact-email')).toContainText('bob@test.com');
  });

  test('can edit a contact', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    await addContact(page, { firstName: 'Carol', lastName: 'White', company: 'OldCorp' });

    await page.getByText('Carol White').click();
    await expect(page.getByTestId('contact-detail-page')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('edit-btn').click();
    await expect(page.getByTestId('contact-form-page')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('input-company').locator('input').fill('NewCorp');
    await page.getByTestId('save-btn').click();

    // Should go back to detail page with updated info
    await expect(page.getByText('NewCorp')).toBeVisible({ timeout: 5000 });
  });

  test('can toggle favorite on detail page', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    await addContact(page, { firstName: 'Dave', lastName: 'Brown' });

    await page.getByText('Dave Brown').click();
    await expect(page.getByTestId('contact-detail-page')).toBeVisible({ timeout: 5000 });

    // Should show "Add to favorites"
    await expect(page.getByText('Add to favorites')).toBeVisible();
    await page.getByTestId('favorite-btn').click();

    // Should now show "Remove from favorites"
    await expect(page.getByText('Remove from favorites')).toBeVisible({ timeout: 3000 });
  });

  test('can delete a contact', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    await addContact(page, { firstName: 'Eve', lastName: 'Green' });

    await page.getByText('Eve Green').click();
    await expect(page.getByTestId('contact-detail-page')).toBeVisible({ timeout: 5000 });

    // Framework7 uses its own dialog, not browser dialog
    await page.getByTestId('delete-btn').click();

    // Wait for and click confirm in F7 dialog
    const confirmBtn = page.locator('.dialog-buttons .dialog-button').last();
    await expect(confirmBtn).toBeVisible({ timeout: 3000 });
    await confirmBtn.click();

    // Should navigate back to contacts list
    await expect(page.getByTestId('add-contact-fab')).toBeVisible({ timeout: 5000 });
    // Check specifically in the contacts list, not in lingering dialog/detail DOM
    await expect(page.locator('.contacts-list').getByText('Eve Green')).not.toBeVisible({ timeout: 5000 });
  });

  test('can search contacts by name', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);
    await addContact(page, { firstName: 'Frank', lastName: 'Adams' });
    await addContact(page, { firstName: 'Grace', lastName: 'Baker' });

    // Both contacts should be visible
    await expect(page.getByText('Frank Adams')).toBeVisible();
    await expect(page.getByText('Grace Baker')).toBeVisible();

    // Type in the Framework7 searchbar
    const searchInput = page.locator('.searchbar input[type="search"]');
    await searchInput.fill('Frank');

    // Only Frank should be visible
    await expect(page.getByText('Frank Adams')).toBeVisible();
    await expect(page.getByText('Grace Baker')).not.toBeVisible({ timeout: 3000 });
  });

  test('can logout', async ({ page }) => {
    const user = uniqueUser();
    await registerAndLogin(page, user);

    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-submit')).toBeVisible({ timeout: 10000 });
  });
});
