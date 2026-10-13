import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/content/shadow-dom");
});

test("follows a user through an open shadow root", async ({ page }) => {
  // Both cards have a Follow button. Select the card first.
  const ada = page.locator("user-card").filter({ hasText: "Ada Lovelace" });
  const grace = page.locator("user-card").filter({ hasText: "Grace Hopper" });

  await ada.getByRole("button", { name: "Follow" }).click();

  await expect(ada.getByRole("button", { name: "Following" })).toBeVisible();
  await expect(grace.getByRole("button", { name: "Follow", exact: true })).toBeVisible();
  await expect(page.getByTestId("following-result")).toHaveText("Following: Ada Lovelace");
});

test("XPath cannot see inside a shadow root but CSS and role locators can", async ({ page }) => {
  await expect(page.locator("xpath=//user-card//button")).toHaveCount(0);
  await expect(page.locator("user-card button")).toHaveCount(2);
  await expect(page.locator("user-card").getByRole("button")).toHaveCount(2);
});

test("finds slotted content with any locator", async ({ page }) => {
  // The badge is a child of <user-card> in the light DOM. A <slot> only shows it inside the card.
  // XPath works because the badge is not inside the shadow root.
  await expect(page.getByText("Mentor", { exact: true })).toBeVisible();
  await expect(page.locator("xpath=//user-card//span[contains(@class, 'status-badge')]")).toHaveText("Mentor");
});

test("unlocks a closed shadow root from the outside", async ({ page }) => {
  const widget = page.locator("locked-widget");

  // Locators cannot see into a closed shadow root.
  await expect(widget.getByRole("button")).toHaveCount(0);
  await expect(widget).toHaveAttribute("data-state", "locked");
  await expect(page.getByTestId("widget-state")).toHaveText("Widget state: locked");

  // page.mouse uses viewport coordinates and does not scroll. Scroll the widget into view first.
  // Then click at the centre of the widget with the mouse.
  await widget.scrollIntoViewIfNeeded();
  const box = await widget.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  await expect(widget).toHaveAttribute("data-state", "unlocked");
  await expect(page.getByTestId("widget-state")).toHaveText("Widget state: unlocked");
});
