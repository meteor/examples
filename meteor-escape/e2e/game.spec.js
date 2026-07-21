const { test, expect } = require('@playwright/test');

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
