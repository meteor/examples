const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { resolveScreenshotDir } = require('./gallery-output');

const SCREENSHOT_DIR = resolveScreenshotDir();

const ACTION_BY_EMERGENCY = {
  Meteor: 'Shield',
  Overheat: 'Cool',
  Path: 'Boost',
};

function emergencyLabelToAction(label) {
  return ACTION_BY_EMERGENCY[label] ?? 'Shield';
}

function readPngSize(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('Expected PNG screenshot output');
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function prepareGalleryPage(page, viewport) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    const STYLE_ID = 'meteor-escape-gallery-freeze';
    const css = `
      html {
        scroll-behavior: auto !important;
      }

      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `;

    const install = () => {
      if (document.getElementById(STYLE_ID)) {
        return;
      }

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    };

    if (document.head) {
      install();
    } else {
      document.addEventListener('DOMContentLoaded', install, { once: true });
    }
  });
}

async function waitForVisualReadiness(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => Boolean(document.querySelector('.app-shell__content')));
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const imageLoads = Array.from(document.images, (image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          });
        });

        await Promise.all(imageLoads);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      return;
    } catch (error) {
      if (!/Execution context was destroyed|Target closed|Navigation/i.test(String(error))) {
        throw error;
      }
    }
  }

  throw new Error('Page did not reach a stable visual state after retries.');
}

async function expectNoHorizontalOverflow(page, viewport) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body?.scrollWidth ?? 0,
    innerWidth: window.innerWidth,
  }));

  expect(metrics.clientWidth).toBe(viewport.width);
  expect(metrics.innerWidth).toBe(viewport.width);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
}

async function expectLoadedImages(page) {
  const images = await page.evaluate(() =>
    Array.from(document.images, (image) => ({
      complete: image.complete,
      height: image.naturalHeight,
      src: image.currentSrc || image.src,
      width: image.naturalWidth,
    }))
  );

  for (const image of images) {
    expect(image.complete, image.src || 'inline image').toBe(true);
    expect(image.width, image.src || 'inline image').toBeGreaterThan(0);
    expect(image.height, image.src || 'inline image').toBeGreaterThan(0);
  }
}

async function saveViewportScreenshot(page, fileName, viewport) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const screenshotPath = path.join(SCREENSHOT_DIR, fileName);
  const buffer = await page.screenshot({ path: screenshotPath, type: 'png' });
  const size = readPngSize(buffer);

  expect(size.width).toBe(viewport.width);
  expect(size.height).toBe(viewport.height);
  expect(buffer.byteLength).toBeGreaterThan(15_000);

  return screenshotPath;
}

async function openQuickMission(page) {
  await page.goto('/?testMode=1');
  await waitForVisualReadiness(page);
  await page.getByRole('button', { name: 'Quick Mission' }).click();
  await expect(page.locator('.mission-stage')).toBeVisible();
  await expect(page.locator('.mission-stage__turn')).toHaveText('Your turn');
}

async function finishMissionToResult(page) {
  const emergency = await page.locator('.emergency-prompt__eyebrow').textContent();
  const actionName = emergencyLabelToAction(emergency?.trim() ?? '');

  await page.getByRole('button', { name: new RegExp(actionName, 'i') }).click();
  await expect(page.locator('.result-sheet')).toBeVisible({ timeout: 30_000 });
}

test('captures mobile play gallery at 390x844', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await prepareGalleryPage(page, viewport);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await waitForVisualReadiness(page);
  await expectLoadedImages(page);
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'mobile-play.png', viewport);
});

test('captures mobile mission gallery at 390x844', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await prepareGalleryPage(page, viewport);
  await openQuickMission(page);
  await expectLoadedImages(page);
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'mobile-mission.png', viewport);
});

test('captures mobile result gallery at 390x844', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await prepareGalleryPage(page, viewport);
  await openQuickMission(page);
  await finishMissionToResult(page);
  await expect(page.getByRole('heading', { name: /Warp charged|Shields collapsed/ })).toBeVisible();
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'mobile-result.png', viewport);
});

test('captures mobile records gallery at 390x844', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await prepareGalleryPage(page, viewport);
  await openQuickMission(page);
  await finishMissionToResult(page);
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await page.getByLabel('Records').click();
  await expect(page.getByRole('heading', { name: 'Records' })).toBeVisible();
  await expect(page.getByText(/Solo mission|Crew mission/)).toBeVisible();
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'mobile-records.png', viewport);
});

test('captures mobile system gallery at 390x844', async ({ page }) => {
  const viewport = { width: 390, height: 844 };
  await prepareGalleryPage(page, viewport);
  await page.goto('/');
  await waitForVisualReadiness(page);
  await page.getByLabel('System').click();
  await expect(page.getByRole('heading', { name: 'System information' })).toBeVisible();
  await expect(page.getByText('DDP endpoint')).toBeVisible();
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'mobile-system.png', viewport);
});

test('captures tablet mission gallery at 768x1024', async ({ page }) => {
  const viewport = { width: 768, height: 1024 };
  await prepareGalleryPage(page, viewport);
  await openQuickMission(page);
  await expectLoadedImages(page);
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'tablet-mission.png', viewport);
});

test('captures desktop play gallery at 1440x1000', async ({ page }) => {
  const viewport = { width: 1440, height: 1000 };
  await prepareGalleryPage(page, viewport);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await waitForVisualReadiness(page);
  await expectLoadedImages(page);
  await expect(page.locator('.app-shell__rail')).toBeVisible();
  await expectNoHorizontalOverflow(page, viewport);
  await saveViewportScreenshot(page, 'desktop-play.png', viewport);
});
