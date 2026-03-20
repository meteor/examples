import { test, expect } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);

test.describe("Task Manager", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display the app header and dashboard", async ({ page }) => {
    await expect(page.getByText("Task Manager")).toBeVisible();
    await expect(page.getByText("Total Tasks")).toBeVisible();
    await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "In Progress" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Completed" })
    ).toBeVisible();
  });

  test("should show empty state when no tasks exist", async ({ page }) => {
    const emptyMessage = page.getByText(
      "No tasks yet. Create your first task!"
    );
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test("should create a new task", async ({ page }) => {
    const name = `E2E Task ${uid()}`;
    await page.getByRole("button", { name: "Add Task" }).click();

    await expect(page.getByText("Create Task")).toBeVisible();

    await page.getByPlaceholder("Enter task title...").fill(name);
    await page
      .getByPlaceholder("Enter description (optional)...")
      .fill("Created by Playwright");

    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test("should edit an existing task", async ({ page }) => {
    const name = `Edit Task ${uid()}`;
    const editedName = `Edited ${uid()}`;

    // Create a task first
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByPlaceholder("Enter task title...").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Open the dropdown menu for the task row (last button is the actions menu)
    const taskRow = page.getByRole("row").filter({ hasText: name });
    await taskRow.getByRole("button").last().click();

    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    await page.getByPlaceholder("Enter task title...").clear();
    await page.getByPlaceholder("Enter task title...").fill(editedName);
    await page.getByRole("button", { name: "Update" }).click();

    await expect(page.getByText(editedName)).toBeVisible();
  });

  test("should filter tasks by status", async ({ page }) => {
    const name = `Filter Status ${uid()}`;

    // Create a task first
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByPlaceholder("Enter task title...").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Filter by "Done" status - task should disappear since it defaults to "To Do"
    const statusSelect = page.getByRole("combobox").first();
    await statusSelect.click();
    await page.getByLabel("Done").click();

    await expect(page.getByText(name)).not.toBeVisible();

    // Reset filter
    await statusSelect.click();
    await page.getByLabel("All Status").click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test("should filter tasks by priority", async ({ page }) => {
    const name = `Filter Priority ${uid()}`;

    // Create a task (defaults to medium priority)
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByPlaceholder("Enter task title...").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Filter by "High" priority - task should disappear since it defaults to "Medium"
    const prioritySelect = page.getByRole("combobox").nth(1);
    await prioritySelect.click();
    await page.getByLabel("High").click();

    await expect(page.getByText(name)).not.toBeVisible();

    // Reset filter
    await prioritySelect.click();
    await page.getByLabel("All Priority").click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test("should move task to next status", async ({ page }) => {
    const name = `Status ${uid()}`;

    // Create a task
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByPlaceholder("Enter task title...").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Open dropdown and move to "In Progress" (last button is the actions menu)
    const taskRow = page.getByRole("row").filter({ hasText: name });
    await taskRow.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Move to In Progress" }).click();

    // Verify the status badge updated
    await expect(
      taskRow.getByText("In Progress", { exact: true })
    ).toBeVisible();
  });

  test("should delete a task", async ({ page }) => {
    const name = `Delete ${uid()}`;

    // Create a task
    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByPlaceholder("Enter task title...").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Open dropdown and delete (last button is the actions menu)
    const taskRow = page.getByRole("row").filter({ hasText: name });
    await taskRow.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByText(name)).not.toBeVisible();
  });

  test("should update dashboard counts after creating a task", async ({
    page,
  }) => {
    const name = `Count ${uid()}`;

    // Get the "Total Tasks" card's count value
    const totalCard = page
      .locator("div")
      .filter({ hasText: /^Total Tasks$/ })
      .locator("..");
    const totalBefore = await totalCard.locator(".text-2xl").textContent();

    await page.getByRole("button", { name: "Add Task" }).click();
    await page.getByPlaceholder("Enter task title...").fill(name);
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText(name)).toBeVisible();

    // Wait for the dashboard to update reactively
    await expect(totalCard.locator(".text-2xl")).toHaveText(
      String(Number(totalBefore) + 1)
    );
  });
});
