import { test, expect } from '@playwright/test';

// Two people at once: each one is a browser context of their own, signed in from
// the header. The seed gives everyone appointments in the current week.
let contexts = [];
test.afterEach(async () => {
  await Promise.all(contexts.map((context) => context.close()));
  contexts = [];
});

const signIn = async (browser, username) => {
  const context = await browser.newContext();
  contexts.push(context);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.bc-event').first()).toBeVisible();
  await page.locator('.sign-in').selectOption(username);
  await page.waitForFunction((name) => Meteor.user()?.username === name, username);
  return page;
};

const event = (page, title) => page.locator('.bc-event', { hasText: title }).first();
const editor = (page) => page.locator('dialog.editor[open]');

test('the header shows who else is on the page, and their pointer moves over the calendar', async ({ browser }) => {
  const maya = await signIn(browser, 'maya');
  const leo = await signIn(browser, 'leo');
  await expect(maya.locator('.top .bp-avatar-item[title="Leo Martin"]')).toBeVisible();
  await expect(leo.locator('.top .bp-avatar-item[title="Maya Chen"]')).toBeVisible();

  const box = await leo.locator('.calendar-area').boundingBox();
  await leo.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await expect(maya.locator('.bp-cursor', { hasText: 'Leo Martin' })).toBeVisible();

  // Leaving the page leaves its room.
  await leo.goto('/#list');
  await expect(maya.locator('.top .bp-avatar-item[title="Leo Martin"]')).toHaveCount(0);
  await leo.goto('/#calendar');
  await expect(maya.locator('.top .bp-avatar-item[title="Leo Martin"]')).toBeVisible();

  // Closing the tab too, without waiting for Meteor's 15 second grace period.
  await leo.close({ runBeforeUnload: true });
  await expect(maya.locator('.top .bp-avatar-item[title="Leo Martin"]')).toHaveCount(0, { timeout: 5000 });
});

test('someone editing an appointment is shown on it, and their change reaches the others', async ({ browser }) => {
  const maya = await signIn(browser, 'maya');
  const leo = await signIn(browser, 'leo');
  await event(leo, 'Design review').click();
  await expect(editor(leo).getByLabel('Title')).toHaveValue('Design review');
  await expect(event(maya, 'Design review').locator('.editing')).toHaveText('Leo Martin is editing');

  const client = `Contoso ${Date.now()}`;
  await editor(leo).getByLabel('Client').fill(client);
  await editor(leo).getByLabel('Client').press('Enter');
  await expect(editor(leo)).toHaveCount(0);
  await expect(event(maya, 'Design review')).toContainText(client);
  await expect(event(maya, 'Design review').locator('.editing')).toHaveCount(0);
});

test('a save made on an outdated version is refused', async ({ browser }) => {
  const maya = await signIn(browser, 'maya');
  const sara = await signIn(browser, 'sara');
  await event(maya, 'Contract renewal').click();
  await event(sara, 'Contract renewal').click();
  await expect(editor(maya).locator('.also')).toContainText('Sara Ali has it open too.');

  await editor(sara).getByLabel('Notes').fill(`Sara's notes ${Date.now()}`);
  await editor(sara).getByRole('button', { name: 'Save' }).click();
  await expect(editor(sara)).toHaveCount(0);

  await expect(editor(maya).locator('.warning')).toContainText('Someone changed it since you opened it.');
  await editor(maya).getByLabel('Notes').fill('Maya wins?');
  await editor(maya).getByRole('button', { name: 'Save' }).click();
  await expect(editor(maya).locator('.error')).toHaveText('Someone changed this appointment first.');
  await editor(maya).getByRole('button', { name: 'Show their version' }).click();
  await expect(editor(maya).getByLabel('Notes')).toHaveValue(/^Sara's notes/);
});

test('a viewer sees everything and changes nothing', async ({ browser }) => {
  const tom = await signIn(browser, 'tom');
  await expect(tom.locator('.hint')).toContainText('You are a viewer');
  await event(tom, 'Kickoff call').click();
  await expect(editor(tom).getByLabel('Title')).toBeDisabled();
  await expect(editor(tom).getByRole('button', { name: 'Save' })).toHaveCount(0);
  await expect(editor(tom).getByRole('button', { name: 'Delete' })).toHaveCount(0);
});

test('the list is filtered and searched by the server, and opens the editor', async ({ browser }) => {
  const sara = await signIn(browser, 'sara');
  await sara.goto('/#list');
  await sara.getByLabel('Upcoming only').uncheck();
  await sara.getByLabel('Mine only').check();
  const rows = sara.locator('.appointments tbody tr');
  await expect(rows.first()).toBeVisible();
  // Retried until the filtered page replaced the previous one.
  await expect(rows.locator('.owner').filter({ hasNotText: 'Sara Ali' })).toHaveCount(0);

  await sara.getByRole('searchbox').fill('onboarding');
  await expect(rows).toHaveCount(1);
  await rows.first().click();
  await expect(editor(sara).getByLabel('Title')).toHaveValue('Onboarding');
});
