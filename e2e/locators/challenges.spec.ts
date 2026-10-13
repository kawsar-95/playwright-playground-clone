import { test, expect } from "@playwright/test";

test("locator challenges: pick exactly one element in each section", async ({ page }) => {
  await page.goto("/locators/challenges");

  // 1. Product cards: find the card by its heading, then click the button inside it.
  const products = page.getByRole("region", { name: "1. Product cards" });
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Wireless Keyboard", exact: true }) })
    .getByRole("button", { name: "Add to cart" })
    .click();
  await expect(products.getByRole("status")).toHaveText("Cart (1): Wireless Keyboard");

  // 2. The same button in two panels: scope the locator to one panel.
  const sameButton = page.getByRole("region", { name: "2. Same button, different sections" });
  await page.getByRole("region", { name: "Notification settings" }).getByRole("button", { name: "Save" }).click();
  await expect(sameButton.getByRole("status")).toHaveText("Notification settings saved");

  // 3. Exact names: "Delete" is a part of the other two names.
  const exact = page.getByRole("region", { name: "3. Exact names" });
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(exact.getByRole("status")).toHaveText("Deleted the selected item");

  // 4. Archive all Overdue tasks. The list changes after each click, so locate the rows again.
  const tasks = page.getByRole("list", { name: "Team tasks" });
  const overdueRows = tasks.getByRole("listitem").filter({ hasText: "Overdue" });
  while ((await overdueRows.count()) > 0) {
    await overdueRows.first().getByRole("button", { name: "Archive" }).click();
  }
  await expect(overdueRows).toHaveCount(0);
  await expect(tasks.getByText("Overdue")).toHaveCount(0);
  await expect(tasks.getByRole("listitem").filter({ hasText: "Write test plan" })).toContainText("Done");
  await expect(page.getByRole("region", { name: "4. Filter by state" }).getByRole("status")).toHaveText(
    "Archived: Fix flaky login test, Update CI pipeline",
  );

  // 5. Elements without text: use the placeholder and the title.
  const toolbar = page.getByRole("region", { name: "5. Elements without text" });
  await page.getByPlaceholder("Search the docs").fill("locators");
  await page.getByTitle("Open settings").click();
  await expect(toolbar.getByRole("status")).toHaveText("Settings opened · Searching for: locators");

  // 6. The logo image has alternative text.
  await expect(page.getByAltText("QA Playground logo")).toBeVisible();
});
