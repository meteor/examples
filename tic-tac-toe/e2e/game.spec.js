import { test, expect } from "@playwright/test";

test.describe("Tic-Tac-Toe", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display the app header and room list", async ({ page }) => {
    await expect(page.getByText("Tic-Tac-Toe")).toBeVisible();
    await expect(page.getByText("Game Rooms")).toBeVisible();
    await expect(page.getByText("How to Play")).toBeVisible();
  });

  test("should show create room button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Create Room" })
    ).toBeVisible();
  });

  test("should create a room", async ({ page }) => {
    const roomsBefore = await page.getByText(/Room \.\.\./).count();
    await page.getByRole("button", { name: "Create Room" }).click();

    // A new room card should appear
    await expect(page.getByText(/Room \.\.\./)).toHaveCount(roomsBefore + 1);
  });

  test("should join a room and see game screen", async ({ page }) => {
    await page.getByRole("button", { name: "Create Room" }).click();

    // Join the first available room
    await page.getByRole("button", { name: "Join Room" }).first().click();

    // Should navigate to game screen
    await expect(page.getByText("Back to Rooms")).toBeVisible();
    await expect(page.getByText(/You are [XO]/)).toBeVisible();
  });

  test("should play a full game with two players", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const player1 = await context1.newPage();
    const player2 = await context2.newPage();

    // Player 1 creates a fresh room via Meteor method to get the room ID
    await player1.goto("/");
    await player1.waitForLoadState("networkidle");

    const roomId = await player1.evaluate(async () => {
      const room = await Meteor.callAsync("createRoom");
      return room._id;
    });

    const roomIdSuffix = roomId.slice(-4);

    // Player 1 joins from the room list using the room's ID suffix
    const p1RoomCard = player1
      .locator(".MuiCard-root")
      .filter({ hasText: new RegExp(`Room \\.\\.\\.${roomIdSuffix}`) });
    await p1RoomCard.getByRole("button", { name: "Join Room" }).click();

    await expect(player1.getByText("Back to Rooms")).toBeVisible();
    await expect(player1.getByText(/You are [XO]/)).toBeVisible();

    // Detect player 1's color
    const p1Color = await player1.getByText(/You are [XO]/).textContent();
    const p1IsX = p1Color.includes("X");

    // Player 2 joins the same room from the room list
    await player2.goto("/");
    await player2.waitForLoadState("networkidle");

    const p2RoomCard = player2
      .locator(".MuiCard-root")
      .filter({ hasText: new RegExp(`Room \\.\\.\\.${roomIdSuffix}`) });
    await p2RoomCard.getByRole("button", { name: "Join Room" }).click();

    await expect(player2.getByText("Back to Rooms")).toBeVisible();
    await expect(player2.getByText(/You are [XO]/)).toBeVisible();

    // Determine who is X (goes first) and who is O
    const xPlayer = p1IsX ? player1 : player2;
    const oPlayer = p1IsX ? player2 : player1;

    // Play a winning game for X:
    // X plays: 0, 1, 2 (top row) / O plays: 3, 4
    const xCells = xPlayer.locator(".MuiPaper-elevation2");
    const oCells = oPlayer.locator(".MuiPaper-elevation2");

    // X - cell 0
    await expect(xPlayer.getByText("Your turn")).toBeVisible({ timeout: 5000 });
    await xCells.nth(0).click();

    // O - cell 3
    await expect(oPlayer.getByText("Your turn")).toBeVisible({ timeout: 5000 });
    await oCells.nth(3).click();

    // X - cell 1
    await expect(xPlayer.getByText("Your turn")).toBeVisible({ timeout: 5000 });
    await xCells.nth(1).click();

    // O - cell 4
    await expect(oPlayer.getByText("Your turn")).toBeVisible({ timeout: 5000 });
    await oCells.nth(4).click();

    // X - cell 2 (winning move - top row complete)
    await expect(xPlayer.getByText("Your turn")).toBeVisible({ timeout: 5000 });
    await xCells.nth(2).click();

    // Game over dialog should appear
    await expect(xPlayer.getByText("Game Over!")).toBeVisible({
      timeout: 5000,
    });
    await expect(xPlayer.getByText("You Won!")).toBeVisible();
    await expect(oPlayer.getByText("Game Over!")).toBeVisible({
      timeout: 5000,
    });
    await expect(oPlayer.getByText("You Lost!")).toBeVisible();

    // Navigate back to rooms
    await xPlayer.getByRole("button", { name: "Back to Rooms" }).click();
    await expect(xPlayer.getByText("Game Rooms")).toBeVisible();

    await context1.close();
    await context2.close();
  });

  test("should navigate back to rooms from game screen", async ({ page }) => {
    // Create a fresh room and join it by its ID
    const roomId = await page.evaluate(async () => {
      const room = await Meteor.callAsync("createRoom");
      return room._id;
    });
    const suffix = roomId.slice(-4);
    const card = page
      .locator(".MuiCard-root")
      .filter({ hasText: new RegExp(`Room \\.\\.\\.${suffix}`) });
    await card.getByRole("button", { name: "Join Room" }).click();
    await expect(page.getByText("Back to Rooms")).toBeVisible();

    await page.getByRole("button", { name: "Back to Rooms" }).click();
    await expect(page.getByText("Game Rooms")).toBeVisible();
  });
});
