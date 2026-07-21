const { test, expect } = require('@playwright/test');

const ACTION_BY_EMERGENCY = {
  Meteor: 'Shield',
  Overheat: 'Cool',
  Path: 'Boost',
};

function emergencyLabelToAction(label) {
  return ACTION_BY_EMERGENCY[label] ?? 'Shield';
}

async function getActionButtons(page) {
  return page
    .getByRole('button')
    .filter({ has: page.locator('.mission-action__label') });
}

function getTurnChip(page) {
  return page.locator('.mission-stage__turn');
}

function getMissionStatus(page) {
  return page.locator('.emergency-prompt__status');
}

function getResultTitle(page) {
  return page.locator('.result-sheet h2');
}

function getLiveRegion(page) {
  return page.locator('.mission-stage__live');
}

test('opens on understandable mobile game home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await expect(page.getByText('Charge warp before shields fail')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quick Mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Crew Mission' })).toBeVisible();
});

test('keeps mobile controls inside narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});

test('uses flat home surfaces without gradients or nested join panel chrome', async ({ page }) => {
  await page.goto('/');

  const styles = await page.evaluate(() => {
    const bodyStyles = getComputedStyle(document.body);
    const joinStyles = getComputedStyle(document.querySelector('.join-crew-inline'));
    const keyArtStyles = getComputedStyle(document.querySelector('.play-home__key-art'));

    return {
      bodyBackgroundImage: bodyStyles.backgroundImage,
      joinBackgroundColor: joinStyles.backgroundColor,
      joinBorderTopWidth: joinStyles.borderTopWidth,
      keyArtObjectFit: keyArtStyles.objectFit,
    };
  });

  expect(styles.bodyBackgroundImage).toBe('none');
  expect(styles.joinBackgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.joinBorderTopWidth).toBe('0px');
  expect(styles.keyArtObjectFit).toBe('contain');
});

test('keeps records actions at least 48 pixels tall', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.app-shell__tabbar [aria-label="Records"]').click();
  await expect(page.getByRole('heading', { name: 'Records' })).toBeVisible();

  const bounds = await page.locator('.records-page button, .records-empty button').first().boundingBox();

  expect(bounds).not.toBeNull();
  expect(bounds.height).toBeGreaterThanOrEqual(48);
});

test('plays quick mission with visible CPU turns and result', async ({ page }) => {
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Quick Mission' }).click();

  await expect(getTurnChip(page)).toHaveText('Your turn');
  const emergency = await page.locator('.emergency-prompt__eyebrow').textContent();
  const actionName = emergencyLabelToAction(emergency?.trim() ?? '');

  await page.getByRole('button', { name: new RegExp(actionName, 'i') }).click();
  await expect(getLiveRegion(page)).toContainText('Warp charged', { timeout: 500 });
  await expect(getLiveRegion(page)).toContainText('Copilot turn', { timeout: 500 });
  await expect(getMissionStatus(page)).toHaveText('Copilot thinking');
  await expect(getTurnChip(page)).toHaveText('Copilot turn');

  await expect(getResultTitle(page)).toHaveText(/Warp charged|Shields collapsed/);
  await expect(page.getByRole('button', { name: 'Rematch' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Share Result' })).toBeVisible();
});

async function assertMissionActionLayout(page, viewport, requireViewportFit) {
  await page.setViewportSize(viewport);
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Quick Mission' }).click();
  await expect(getTurnChip(page)).toHaveText('Your turn');

  const buttons = await getActionButtons(page);
  await expect(buttons).toHaveCount(3);
  await buttons.nth(2).scrollIntoViewIfNeeded();

  const boxes = await Promise.all([
    buttons.nth(0).boundingBox(),
    buttons.nth(1).boundingBox(),
    buttons.nth(2).boundingBox(),
  ]);

  for (const box of boxes) {
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(64);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    if (requireViewportFit) {
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  }

  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index - 1].y + boxes[index - 1].height).toBeLessThanOrEqual(boxes[index].y);
  }
}

test('keeps mission actions 64 pixels tall without overlap on 320x700 phones', async ({ page }) => {
  await assertMissionActionLayout(page, { width: 320, height: 700 }, false);
});

test('keeps mission actions in viewport without overlap on 390x844 phones', async ({ page }) => {
  await assertMissionActionLayout(page, { width: 390, height: 844 }, true);
});

test('keeps mission result sheet inside viewport and honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Quick Mission' }).click();
  await expect(getTurnChip(page)).toHaveText('Your turn');

  const emergency = await page.locator('.emergency-prompt__eyebrow').textContent();
  const actionName = emergencyLabelToAction(emergency?.trim() ?? '');
  await page.getByRole('button', { name: new RegExp(actionName, 'i') }).click();

  const resultSheet = page.locator('.result-sheet');
  await expect(resultSheet).toBeVisible({ timeout: 30_000 });

  const resultBox = await resultSheet.boundingBox();
  expect(resultBox).not.toBeNull();
  expect(resultBox.x).toBeGreaterThanOrEqual(0);
  expect(resultBox.y).toBeGreaterThanOrEqual(0);
  expect(resultBox.x + resultBox.width).toBeLessThanOrEqual(390);
  expect(resultBox.y + resultBox.height).toBeLessThanOrEqual(844);

  const motionStyles = await page.locator('.mission-stage').evaluate((node) => {
    const styles = getComputedStyle(node);
    return {
      animationDuration: styles.animationDuration,
      transitionDuration: styles.transitionDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });

  expect(motionStyles.animationDuration).toMatch(/0s|0\.01ms|1e-05s/);
  expect(motionStyles.transitionDuration).toMatch(/0s|0\.01ms|1e-05s/);
  expect(motionStyles.scrollBehavior).toBe('auto');
});

test('closing result sheet keeps terminal mission stage visible until home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Quick Mission' }).click();
  await expect(getTurnChip(page)).toHaveText('Your turn');

  const emergency = await page.locator('.emergency-prompt__eyebrow').textContent();
  const actionName = emergencyLabelToAction(emergency?.trim() ?? '');
  await page.getByRole('button', { name: new RegExp(actionName, 'i') }).click();
  await expect(page.locator('.result-sheet')).toBeVisible({ timeout: 30_000 });

  await page.locator('.result-sheet-backdrop').click({ position: { x: 8, y: 8 } });

  await expect(page.locator('.result-sheet')).toBeHidden();
  await expect(page.locator('.mission-stage')).toBeVisible();
  await expect(page.getByRole('button', { name: 'View report' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home' })).toBeVisible();

  const viewReportBounds = await page.getByRole('button', { name: 'View report' }).boundingBox();
  const homeBounds = await page.getByRole('button', { name: 'Home' }).boundingBox();
  expect(viewReportBounds).not.toBeNull();
  expect(homeBounds).not.toBeNull();
  expect(viewReportBounds.height).toBeGreaterThanOrEqual(64);
  expect(homeBounds.height).toBeGreaterThanOrEqual(64);

  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quick Mission' })).toBeVisible();
});
