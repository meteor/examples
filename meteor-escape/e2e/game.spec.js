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

function extractRoomCode(text) {
  const match = text.match(/\b([A-HJ-NP-Z2-9]{6})\b/);
  return match ? match[1] : null;
}

test('opens on understandable mobile game home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await expect(page.getByText('Charge warp before shields fail')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quick Mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Crew Mission' })).toBeVisible();

  const tabbar = page.locator('.app-shell__tabbar');
  const tabbarBounds = await tabbar.boundingBox();
  const primaryActionBounds = await page.getByRole('button', { name: 'Quick Mission' }).boundingBox();
  const tabBounds = await Promise.all(
    ['Play', 'Records', 'System'].map((label) =>
      page.locator(`.app-shell__tabbar [aria-label="${label}"]`).boundingBox()
    )
  );

  expect(tabbarBounds).not.toBeNull();
  expect(primaryActionBounds).not.toBeNull();
  expect(tabbarBounds.y + tabbarBounds.height).toBeGreaterThanOrEqual(842);
  expect(tabbarBounds.height).toBeGreaterThanOrEqual(48);
  expect(primaryActionBounds.y + primaryActionBounds.height).toBeLessThanOrEqual(tabbarBounds.y);
  expect(tabBounds.every(Boolean)).toBe(true);
  expect(tabBounds.every((bounds) => bounds.width >= 48 && bounds.height >= 48)).toBe(true);
  expect(tabBounds[0].x).toBeLessThan(tabBounds[1].x);
  expect(tabBounds[1].x).toBeLessThan(tabBounds[2].x);
  expect(tabBounds[2].x + tabBounds[2].width).toBeGreaterThan(300);
});

test('keeps all mission actions within thumb reach on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Quick Mission' }).click();
  await expect(getTurnChip(page)).toHaveText('Your turn');

  const actionButtons = await getActionButtons(page);
  const bounds = await actionButtons.evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    })
  );

  expect(bounds).toHaveLength(3);
  expect(bounds.every((box) => box.width >= 48 && box.height >= 48)).toBe(true);
  expect(bounds.every((box) => box.y >= 0 && box.y + box.height <= 844)).toBe(true);
  expect(bounds[0].x).toBeLessThan(bounds[1].x);
  expect(bounds[1].x).toBeLessThan(bounds[2].x);
});

test('keeps technical controls on System Information', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('DDP endpoint')).toHaveCount(0);
  await expect(page.getByText(/Meteor.isCapacitor/)).toHaveCount(0);
  await expect(page.getByText('App updates')).toHaveCount(0);

  await page.getByRole('button', { name: 'System' }).click();

  await expect(page.getByRole('heading', { name: 'System information' })).toBeVisible();
  await expect(page.getByText('DDP endpoint')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preview HCP update' })).toBeVisible();
  await expect(page.getByLabel(/DDP connected|DDP connecting/)).toBeVisible();
  await expect(page.getByLabel(/Meteor.isCapacitor false/)).toBeVisible();

  const switchBounds = await page.getByRole('switch', { name: 'Live DDP connection' }).boundingBox();
  expect(switchBounds).not.toBeNull();
  expect(switchBounds.height).toBeGreaterThanOrEqual(48);
  expect(switchBounds.width).toBeGreaterThanOrEqual(48);

  const ddpSwitch = page.getByRole('switch', { name: 'Live DDP connection' });
  await ddpSwitch.click();
  await expect(page.getByText('DDP status: Paused')).toBeVisible();
  await page.getByRole('button', { name: 'Reconnect now' }).click();

  const previewUpdate = page.getByRole('button', { name: 'Preview HCP update' });
  await previewUpdate.click();
  const updateDialog = page.getByRole('dialog', { name: 'New app update available' });
  await expect(updateDialog).toBeVisible();
  await expect(updateDialog).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Install update' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Not now' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(updateDialog).toBeHidden();
  await expect(previewUpdate).toBeFocused();
});

test('shows and preserves HCP update actions across app screens', async ({ page }) => {
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
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Meteor Escape' })).toBeVisible();
  await page.evaluate(() => window.__emitNativeUpdate('2026.07.23'));
  await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeVisible();
  await expect(page.getByText('Version 2026.07.23 is ready to install.')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__getNativeSwitchCalls())).toBe(0);
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__getNativeSwitchCalls())).toBe(0);

  const reviewUpdate = page.getByRole('button', { name: 'Review update' });
  await expect(reviewUpdate).toBeVisible();

  await page.getByRole('button', { name: 'Records' }).click();
  await expect(reviewUpdate).toBeVisible();
  await reviewUpdate.click();
  await expect(page.getByRole('dialog', { name: 'New app update available' })).toBeVisible();
  await page.getByRole('button', { name: 'Install update' }).click();
  await expect.poll(() => page.evaluate(() => window.__getNativeSwitchCalls())).toBe(1);
});

test('shows a global offline banner and disables mission controls until the link returns', async ({ page }) => {
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Quick Mission' }).click();
  await expect(getTurnChip(page)).toHaveText('Your turn');

  await page.context().setOffline(true);
  await expect(
    page.getByText('Offline. Mission controls pause until the ship link returns.')
  ).toBeVisible();

  const missionButtons = await getActionButtons(page);
  await expect(missionButtons.nth(0)).toBeDisabled();
  await expect(missionButtons.nth(1)).toBeDisabled();
  await expect(missionButtons.nth(2)).toBeDisabled();

  await page.context().setOffline(false);
  await expect(
    page.getByText('Offline. Mission controls pause until the ship link returns.')
  ).toHaveCount(0);
  await expect(missionButtons.nth(0)).toBeEnabled();
});

test('keeps room code controls inside join sheet with inline validation and retained server errors', async ({ page }) => {
  await page.goto('/?testMode=1');

  await expect(page.getByLabel('Room code')).toHaveCount(0);
  await page.getByRole('button', { name: 'Join Crew Mission' }).click();

  const sheet = page.getByRole('dialog', { name: 'Join Crew Mission' });
  await expect(sheet).toBeVisible();

  const roomCodeInput = sheet.getByLabel('Room code');
  await roomCodeInput.fill('BAD');
  await roomCodeInput.blur();
  await expect(sheet.getByText('Enter a six-character room code.')).toBeVisible();

  await roomCodeInput.fill('OOO111');
  await roomCodeInput.blur();
  await expect(sheet.getByText('Use only letters A-H, J-N, P-Z, and digits 2-9.')).toBeVisible();

  await roomCodeInput.fill('ABC234');
  await sheet.getByRole('button', { name: 'Join Mission' }).click();
  await expect(sheet.getByText('Room code not found')).toBeVisible();
  await expect(roomCodeInput).toHaveValue('ABC234');
  await expect(sheet).toBeVisible();
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
    const keyArtStyles = getComputedStyle(document.querySelector('.play-home__key-art'));

    return {
      bodyBackgroundImage: bodyStyles.backgroundImage,
      hasInlineRoomCode: Boolean(document.querySelector('.join-crew-inline')),
      keyArtObjectFit: keyArtStyles.objectFit,
    };
  });

  expect(styles.bodyBackgroundImage).toBe('none');
  expect(styles.hasInlineRoomCode).toBe(false);
  expect(styles.keyArtObjectFit).toBe('contain');
});

test('keeps create sheet open until a waiting crew mission becomes playing', async ({ browser }) => {
  const creatorContext = await browser.newContext();
  const joinerContext = await browser.newContext();
  const creatorPage = await creatorContext.newPage();
  const joinerPage = await joinerContext.newPage();

  await creatorPage.goto('/?testMode=1');
  await creatorPage.getByRole('button', { name: 'Create Crew Mission' }).click();

  const creatorSheet = creatorPage.getByRole('dialog', { name: 'Create Crew Mission' });
  await expect(creatorSheet).toBeVisible();
  await expect(creatorSheet.getByRole('button', { name: 'Share Crew Code' })).toBeVisible();
  await expect(creatorSheet.getByRole('button', { name: 'Keep Waiting in Background' })).toBeVisible();
  await expect(creatorSheet.getByRole('button', { name: 'Hide Crew Room' })).toBeVisible();

  const roomText = await creatorSheet.locator('.crew-sheet__code-block strong').textContent();
  const roomCode = extractRoomCode(roomText ?? '');
  expect(roomCode).toBeTruthy();

  await expect(creatorSheet).toBeVisible();

  await joinerPage.goto('/?testMode=1');
  await joinerPage.getByRole('button', { name: 'Join Crew Mission' }).click();

  const joinerSheet = joinerPage.getByRole('dialog', { name: 'Join Crew Mission' });
  await expect(joinerSheet).toBeVisible();
  await joinerSheet.getByLabel('Room code').fill(roomCode);
  await joinerSheet.getByRole('button', { name: 'Join Mission' }).click();

  await expect(creatorSheet).toBeHidden();
  await expect(joinerSheet).toBeHidden();
  await expect(creatorPage.getByRole('heading', { name: 'Mission control' })).toBeVisible();
  await expect(joinerPage.getByRole('heading', { name: 'Mission control' })).toBeVisible();

  await creatorContext.close();
  await joinerContext.close();
});

test('keeps waiting room in background and reopens same code without recreating', async ({ page }) => {
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: 'Create Crew Mission' }).click();

  const createSheet = page.getByRole('dialog', { name: 'Create Crew Mission' });
  await expect(createSheet).toBeVisible();
  const firstRoomText = await createSheet.locator('.crew-sheet__code-block strong').textContent();
  const firstRoomCode = extractRoomCode(firstRoomText ?? '');
  expect(firstRoomCode).toBeTruthy();

  await createSheet.getByRole('button', { name: 'Keep Waiting in Background' }).click();
  await expect(createSheet).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open Crew Room' })).toBeVisible();
  await expect(page.getByText('Crew room remains open in the background.')).toBeVisible();

  await page.getByRole('button', { name: 'Open Crew Room' }).click();
  await expect(createSheet).toBeVisible();
  await expect(createSheet.getByText('Generating room code')).toHaveCount(0);

  const reopenedRoomText = await createSheet.locator('.crew-sheet__code-block strong').textContent();
  const reopenedRoomCode = extractRoomCode(reopenedRoomText ?? '');
  expect(reopenedRoomCode).toBe(firstRoomCode);
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

async function assertMissionActionLayout(page, viewport) {
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
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }

  for (let first = 0; first < boxes.length; first += 1) {
    for (let second = first + 1; second < boxes.length; second += 1) {
      const overlap =
        boxes[first].x < boxes[second].x + boxes[second].width &&
        boxes[first].x + boxes[first].width > boxes[second].x &&
        boxes[first].y < boxes[second].y + boxes[second].height &&
        boxes[first].y + boxes[first].height > boxes[second].y;
      expect(overlap).toBe(false);
    }
  }
}

test('keeps mission actions 64 pixels tall without overlap on 320x700 phones', async ({ page }) => {
  await assertMissionActionLayout(page, { width: 320, height: 700 });
});

test('keeps mission actions in viewport without overlap on 390x844 phones', async ({ page }) => {
  await assertMissionActionLayout(page, { width: 390, height: 844 });
});

test('keeps mission actions in viewport without overlap on 768x1024 tablets', async ({ page }) => {
  await assertMissionActionLayout(page, { width: 768, height: 1024 });
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
  await expect(resultSheet).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Home' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close mission report' })).toBeFocused();

  const resultBox = await resultSheet.boundingBox();
  expect(resultBox).not.toBeNull();
  expect(resultBox.x).toBeGreaterThanOrEqual(0);
  expect(resultBox.y).toBeGreaterThanOrEqual(0);
  expect(resultBox.x + resultBox.width).toBeLessThanOrEqual(390);
  expect(resultBox.y + resultBox.height).toBeLessThanOrEqual(844);

  const closeButton = page.getByRole('button', { name: 'Close mission report' });
  const closeBounds = await closeButton.boundingBox();
  expect(closeBounds).not.toBeNull();
  expect(closeBounds.width).toBeGreaterThanOrEqual(48);
  expect(closeBounds.height).toBeGreaterThanOrEqual(48);

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

  await page.keyboard.press('Escape');
  await expect(resultSheet).toBeHidden();
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

  await page.getByRole('button', { name: 'Close mission report' }).click();

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
