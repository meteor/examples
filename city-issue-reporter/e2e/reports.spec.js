import { expect, test } from '@playwright/test';

async function expectTouchTarget(locator, minHeight = 48) {
  const box = await locator.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(minHeight);
}

async function openSystemInformation(page) {
  const navigationButton = page.getByRole('link', { name: 'Open navigation' });
  if (await navigationButton.isVisible()) {
    await expect(page.locator('.app-menu')).not.toHaveClass(/panel-in/);
    await navigationButton.click();
    await expect(page.locator('.app-menu')).toHaveClass(/panel-in/);
  }
  await page.getByRole('link', { name: 'System information' }).click();
}

test.describe('Civic Snap', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.4168, longitude: -3.7038 });
    const ownerId = testInfo.title.includes('neighborhood field brief')
      ? 'demo-civic-owner'
      : `e2e-civic-${Date.now()}-${testInfo.workerIndex}-${testInfo.retry}`;
    await page.addInitScript((value) => {
      localStorage.setItem('city-issue-reporter-owner-id', value);
    }, ownerId);
    await page.goto('/');
  });

  test('shows a neighborhood field brief and report lifecycle on first launch', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByText('Centro · Field brief')).toBeVisible();
    await expect(page.getByText('Pothole near transit stop')).toBeVisible();
    await expect(page.getByText('Graffiti on library shutters')).toBeVisible();
    await expect(page.getByLabel('Pothole category')).toBeVisible();
    await expect(page.getByText('In review', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New report' })).toBeVisible();

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });

  test('keeps reports task-first and moves technical controls into system information', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.locator('.main-view .navbar .title')).toHaveText('Civic Snap');
    await expect(page.getByText('Report nearby issue')).toBeVisible();
    await expect(page.getByText('App updates')).toBeHidden();
    await expect(page.getByText(/Meteor.isCapacitor/)).toBeHidden();
    await expect(page.getByRole('button', { name: 'New report' })).toBeVisible();

    await openSystemInformation(page);

    await expect(page.getByRole('heading', { name: 'System information' })).toBeVisible();
    await expect(page.getByText('Application version')).toBeVisible();
    await expect(page.getByText('1.0.0', { exact: true })).toBeVisible();
    await expect(page.getByText('Build number')).toBeVisible();
    await expect(page.getByText('DDP endpoint')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Live DDP connection' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reconnect now' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview HCP update' })).toBeVisible();
    await expect(page.getByLabel('Native ready')).toBeVisible();
    await expect(page.getByLabel(/DDP connected|DDP connecting/)).toBeVisible();
    await expect(page.getByLabel(/Meteor.isCapacitor/)).toBeVisible();
  });

  test('keeps mobile report controls comfortable to tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expectTouchTarget(page.getByRole('button', { name: 'New report' }));

    await page.getByRole('button', { name: 'New report' }).click();

    await expectTouchTarget(page.getByLabel('Issue title'));
    await expectTouchTarget(page.getByLabel('Category'));
    await expectTouchTarget(page.getByLabel('Description'), 72);
    await expectTouchTarget(page.getByRole('button', { name: 'Submit current report' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Use current location' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Attach photo' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Submit report' }));
  });

  test('pauses and reconnects DDP from system information', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSystemInformation(page);

    const connectionSwitch = page.getByRole('switch', { name: 'Live DDP connection' });
    await expect(connectionSwitch).toHaveAttribute('aria-checked', 'true');
    await connectionSwitch.click();
    await expect(connectionSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('DDP status: offline')).toBeVisible();
    await expect(page.locator('.ddp-card')).toContainText('Live report sync paused.');
    await expect(page.locator('.system-update-block')).toContainText(
      'Ready to check for mobile updates.'
    );

    await page.getByRole('button', { name: 'Reconnect now' }).click();
    await expect(connectionSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/DDP status: (connecting|connected)/)).toBeVisible();
    await expect(page.locator('.ddp-card')).toContainText('Reconnecting live report sync.');
  });

  test('keeps keyboard focus inside temporary navigation and update sheets', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const openNavigation = page.getByRole('link', { name: 'Open navigation' });
    await openNavigation.click();
    await expect(page.getByRole('link', { name: 'Reports' })).toBeFocused();
    await expect(page.locator('.main-view')).toHaveAttribute('inert', '');

    await page.getByRole('link', { name: 'System information' }).click();
    await expect(page.locator('.main-view')).not.toHaveAttribute('inert', '');

    const previewUpdate = page.getByRole('button', { name: 'Preview HCP update' });
    await previewUpdate.click();
    await expect(page.getByRole('button', { name: 'Not now' })).toBeFocused();
    await expect(page.locator('.main-view')).toHaveAttribute('inert', '');

    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.locator('.main-view')).not.toHaveAttribute('inert', '');
    await expect(previewUpdate).toBeFocused();
  });

  test('adapts persistent panel when viewport changes orientation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await expect(page.getByRole('link', { name: 'System information' })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.app-menu')).not.toHaveClass(/panel-(in|out)/);
    await expectTouchTarget(page.getByRole('link', { name: 'Open navigation' }));

    await page.getByRole('link', { name: 'Open navigation' }).click();
    await expect(page.locator('.app-menu')).toHaveClass(/panel-in/);
    await expect(page.getByRole('link', { name: 'System information' })).toBeVisible();
  });

  for (const viewport of [
    { name: 'narrow phone', width: 360, height: 640 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop preview', width: 1280, height: 800 },
  ]) {
    test(`keeps native navigation and content contained on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();

      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      await expect(page.getByText('Report nearby issue')).toBeVisible();

      if (viewport.width < 1024) {
        const navigationLink = page.getByRole('link', { name: 'Open navigation' });
        await expectTouchTarget(navigationLink);
        const navigationBox = await navigationLink.boundingBox();
        const titleBox = await page.locator('.main-view .navbar .title').boundingBox();
        expect(navigationBox?.x).toBeLessThan(titleBox?.x || 0);
      } else {
        const menu = page.locator('.app-menu');
        await expect(page.getByRole('link', { name: 'System information' })).toBeVisible();
        await expect(menu).toHaveCSS('width', '288px');
        await expect(page.locator('.main-view')).toHaveCSS(
          'transform',
          'matrix(1, 0, 0, 1, 288, 0)'
        );
      }
    });
  }

  test('creates and submits report with mocked location', async ({ page }) => {
    await page.getByRole('button', { name: 'New report' }).click();
    await page.getByLabel('Issue title').fill('Broken light by station');
    await page.getByLabel('Description').fill('Streetlight is out near the bike parking.');
    await page.getByLabel('Category').selectOption('Streetlight');
    await page.getByRole('button', { name: 'Use current location' }).click();
    await expect(page.getByText(/40.4168/)).toBeVisible();
    await page.getByRole('button', { name: 'Submit report' }).click();
    await expect(page.locator('.status-badge').getByText('Submitted', { exact: true })).toBeVisible();
  });

  test('submits a report only once when the action is tapped repeatedly', async ({ page }) => {
    const title = 'Repeated tap report';
    await page.getByRole('button', { name: 'New report' }).click();
    await page.getByLabel('Issue title').fill(title);

    await page.getByRole('button', { name: 'Submit report' }).evaluate((button) => {
      button.click();
      button.click();
    });

    await expect(page.locator('.status-badge').getByText('Submitted', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Reports', exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(1);
  });

  test('shares report using web fallback', async ({ page }) => {
    await page.getByRole('button', { name: 'New report' }).click();
    await page.getByLabel('Issue title').fill('Blocked bike lane');
    await page.getByRole('button', { name: 'Submit report' }).click();
    await page.getByRole('button', { name: 'Share report' }).click();
    await expect(page.getByText(/Report summary copied|Share sheet opened|Sharing unavailable/)).toBeVisible();
  });

  test('shows HCP update dialog from update preview flow', async ({ page }) => {
    await openSystemInformation(page);
    await page.getByRole('button', { name: 'Preview HCP update' }).click();
    await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeVisible();
    await expect(page.getByText('Version demo-preview is ready to install.')).toBeVisible();
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeHidden();
  });
});
