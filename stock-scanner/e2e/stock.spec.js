import { expect, test } from '@playwright/test';

async function expectTouchTarget(locator, minHeight = 48) {
  const box = await locator.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(minHeight);
}

async function openSystemInformation(page) {
  const navigationButton = page.getByRole('button', { name: 'Open navigation' });
  if (await navigationButton.isVisible()) {
    await navigationButton.click();
  }
  await page.getByRole('button', { name: 'System information' }).click();
}

test.describe('Stock Scanner', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const ownerId = testInfo.title.includes('showcase shift')
      ? 'demo-stock-owner'
      : `e2e-stock-${Date.now()}-${testInfo.workerIndex}-${testInfo.retry}`;
    if (testInfo.title.includes('HCP update actions')) {
      await page.addInitScript(() => {
        let updateListener;
        let switchCalls = 0;
        window.WebAppLocalServer = {
          onNewVersionReady(listener) {
            updateListener = listener;
            return () => {
              updateListener = undefined;
            };
          },
          switchToPendingVersion(resolve) {
            switchCalls += 1;
            resolve?.();
          },
        };
        window.__emitNativeUpdate = (version) => updateListener?.(version);
        window.__getNativeSwitchCalls = () => switchCalls;
      });
    }
    await page.addInitScript((value) => {
      localStorage.setItem('stock-scanner-owner-id', value);
    }, ownerId);
    await page.goto('/');
  });

  test('shows a ready-to-count showcase shift on first launch', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByText('Zone A · Morning shift')).toBeVisible();
    await expect(page.getByText('Shift progress')).toBeVisible();
    await expect(page.getByText('USB-C charging cable')).toBeVisible();
    await expect(page.getByText('First aid refill kit')).toBeVisible();
    await expect(page.getByLabel('Electronics product type')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Scan barcode' })).toBeVisible();

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });

  test('keeps inventory task-first and moves technical controls into system information', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole('heading', { name: 'Stock Scanner' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Today’s floor count' })).toBeVisible();
    await expect(page.getByText('App updates')).toBeHidden();
    await expect(page.getByText(/Meteor.isCapacitor/)).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Manual SKU' })).toBeVisible();

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

  test('keeps mobile scan controls comfortable to tap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expectTouchTarget(page.getByRole('textbox', { name: 'Manual SKU' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Add manual SKU' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Scan barcode' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Show low stock' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Share audit' }));

    await openSystemInformation(page);
    await expectTouchTarget(page.getByRole('button', { name: 'Check for update' }));
    await expectTouchTarget(page.getByRole('button', { name: 'Preview HCP update' }));
  });

  test('pauses and reconnects DDP from system information', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSystemInformation(page);

    const connectionSwitch = page.getByRole('switch', { name: 'Live DDP connection' });
    await expect(connectionSwitch).toBeChecked();
    await connectionSwitch.click();
    await expect(connectionSwitch).not.toBeChecked();
    await expect(page.getByText('DDP status: offline')).toBeVisible();

    await page.getByRole('button', { name: 'Reconnect now' }).click();
    await expect(connectionSwitch).toBeChecked();
    await expect(page.getByText(/DDP status: (connecting|connected)/)).toBeVisible();
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
      await expect(page.getByRole('heading', { name: 'Today’s floor count' })).toBeVisible();

      if (viewport.width < 900) {
        await expectTouchTarget(page.getByRole('button', { name: 'Open navigation' }));
      } else {
        await expect(page.getByRole('button', { name: 'System information' })).toBeVisible();
      }
    });
  }

  test('adds scanned SKU, edits details, filters low stock, and shares summary', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Manual SKU' }).fill('SKU-E2E-1');
    await page.getByRole('button', { name: 'Add manual SKU' }).click();

    await expect(page.getByText('SKU SKU-E2E-1')).toBeVisible();
    await page.getByRole('button', { name: 'Open SKU-E2E-1' }).click();
    await page.getByLabel('Product name').fill('Front counter scanner tape');
    await page.getByLabel('Category').click();
    await page.getByRole('option', { name: 'Hardware' }).click();
    await page.getByLabel('Minimum stock').fill('6');
    await page.getByRole('button', { name: 'Save product' }).click();

    await expect(page.getByText('Front counter scanner tape')).toBeVisible();
    await page.getByRole('button', { name: 'Show low stock' }).click();
    await expect(page.getByText('Front counter scanner tape')).toBeVisible();

    await page.getByRole('button', { name: 'Share audit' }).click();
    await expect(page.getByText(/Audit summary copied|Share sheet opened|Sharing unavailable/)).toBeVisible();
  });

  test('shows and preserves HCP update actions across app screens', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Today’s floor count' })).toBeVisible();
    await page.evaluate(() => window.__emitNativeUpdate('2026.07.23'));

    await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeVisible();
    await expect(page.getByText('Version 2026.07.23 is ready to install.')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__getNativeSwitchCalls())).toBe(0);
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__getNativeSwitchCalls())).toBe(0);

    const reviewUpdate = page.getByRole('button', { name: 'Review update' });
    await expect(reviewUpdate).toBeVisible();

    await openSystemInformation(page);
    await expect(reviewUpdate).toBeVisible();
    await reviewUpdate.click();
    await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeVisible();
    await page.getByRole('button', { name: 'Install update' }).click();
    await expect.poll(() => page.evaluate(() => window.__getNativeSwitchCalls())).toBe(1);
  });
});
