import { test, expect } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);

async function signUp(page) {
  const email = `e2e-${uid()}@test.com`;
  const password = "password123";

  await page.locator("#login-sign-in-link").click();
  await page.getByText("Create account").click();
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("#login-name-link")).toBeVisible({ timeout: 5000 });

  return { email, password };
}

test.describe("Parties", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display the app header and map", async ({ page }) => {
    await expect(page.getByText("All Tomorrow's Parties")).toBeVisible();
    await expect(page.locator("svg")).toBeVisible();
  });

  test("should show login button", async ({ page }) => {
    await expect(page.locator("#login-sign-in-link")).toBeVisible();
  });

  test("should sign up a new user", async ({ page }) => {
    await signUp(page);
    await expect(page.locator("#login-name-link")).toBeVisible();
  });

  test("should log in and log out", async ({ page }) => {
    const { email, password } = await signUp(page);

    // Log out
    await page.locator("#login-name-link").click();
    await page.locator("#login-buttons-logout").click();
    await expect(page.locator("#login-sign-in-link")).toBeVisible({
      timeout: 5000,
    });

    // Log back in
    await page.locator("#login-sign-in-link").click();
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("#login-name-link")).toBeVisible({ timeout: 5000 });
  });

  test("should show map instructions when logged in", async ({ page }) => {
    await signUp(page);
    await expect(
      page.getByText("Double click the map to post a party!")
    ).toBeVisible();
  });

  test("should create a party via double-click on map", async ({ page }) => {
    await signUp(page);

    // Double-click on the map SVG to open create dialog
    const svg = page.locator("svg").first();
    await svg.dblclick({ position: { x: 100, y: 100 } });

    // Fill in the create party form
    await expect(page.getByRole("heading", { name: "Add Party" })).toBeVisible({ timeout: 5000 });
    const partyTitle = `E2E Party ${uid()}`;
    await page.locator("input.title").fill(partyTitle);
    await page
      .locator("textarea.description")
      .fill("A party created by Playwright");

    // Click save
    await page.locator("button.save").click();

    // At least one party circle should be on the map
    await expect(page.locator("svg .circles circle").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("should RSVP to a party", async ({ page }) => {
    await signUp(page);

    // Create a party at a unique position to avoid overlapping with other tests
    const svg = page.locator("svg").first();
    await svg.dblclick({ position: { x: 350, y: 150 } });
    const partyTitle = `RSVP Party ${uid()}`;
    await page.locator("input.title").fill(partyTitle);
    await page.locator("textarea.description").fill("Testing RSVP");
    await page.locator("button.save").click();

    // Wait for the party circle to appear and click it using force
    // to avoid interception by overlapping circles from other tests
    const circles = page.locator("svg .circles circle");
    await expect(circles.last()).toBeVisible({ timeout: 5000 });
    await circles.last().click({ force: true });

    // Details sidebar should show the party and RSVP buttons
    await expect(page.locator("button.rsvp_yes")).toBeVisible({ timeout: 5000 });

    // Click "Going!"
    await page.locator("button.rsvp_yes").click();

    // Should show active state
    await expect(page.locator("button.rsvp_yes.rsvp-active-yes")).toBeVisible();
  });

  test("should delete a party", async ({ page }) => {
    await signUp(page);

    // Create a party at a unique position (far corner to avoid overlap)
    const svg = page.locator("svg").first();
    await svg.dblclick({ position: { x: 50, y: 50 } });
    const partyTitle = `Delete Party ${uid()}`;
    await page.locator("input.title").fill(partyTitle);
    await page.locator("textarea.description").fill("Will be deleted");
    await page.locator("button.save").click();

    // Wait for circle to appear, then click at the party's position
    await expect(page.locator("svg .circles circle").first()).toBeVisible({
      timeout: 5000,
    });
    await svg.click({ position: { x: 50, y: 50 }, force: true });

    // Verify we selected our party
    await expect(page.getByText(partyTitle)).toBeVisible({ timeout: 5000 });

    // Delete button should be visible (owner, no RSVPs)
    await expect(page.locator("a.remove")).toBeVisible({ timeout: 5000 });
    await page.locator("a.remove").click();

    // Party title should no longer be visible in details
    await expect(page.getByText(partyTitle)).not.toBeVisible();
  });
});
