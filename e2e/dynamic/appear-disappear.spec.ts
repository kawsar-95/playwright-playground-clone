import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dynamic/appear-disappear");
});

test("delayed element appears after 3 seconds", async ({ page }) => {
  await page.getByRole("button", { name: "Show element" }).click();
  // toBeVisible() retries, so no sleep is needed. 3 s is shorter than the 5 s timeout.
  await expect(page.getByTestId("delayed-element")).toBeVisible();
  await expect(page.getByTestId("delayed-element")).toHaveText("Element appeared!");
});

test("slow element needs a longer timeout", async ({ page }) => {
  await page.getByRole("button", { name: "Load slowly" }).click();
  // The element appears after 7 s. The default timeout is 5 s, so raise it for this check.
  await expect(page.getByTestId("slow-element")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("slow-element")).toHaveText("Finally loaded after 7 seconds");
});

test("spinner appears, disappears, then the result shows", async ({ page }) => {
  await page.getByRole("button", { name: "Start loading" }).click();
  await expect(page.getByTestId("loading-spinner")).toBeVisible();
  await expect(page.getByTestId("loading-spinner")).toBeHidden();
  await expect(page.getByTestId("loading-result")).toBeVisible();
  await expect(page.getByTestId("loading-result")).toHaveText("Loading complete!");
});

test("toast goes away by itself", async ({ page }) => {
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByTestId("toast")).toBeVisible();
  await expect(page.getByTestId("toast")).toHaveText("✓ Draft saved");
  await expect(page.getByTestId("toast")).toBeHidden();
});

test("removed and hidden elements are different", async ({ page }) => {
  const removed = page.getByTestId("disappearing-element");
  const hidden = page.getByTestId("hidden-element");

  await expect(removed).toBeVisible();
  await expect(hidden).toBeVisible();

  await page.getByRole("button", { name: "Remove element" }).click();
  await page.getByRole("button", { name: "Hide element" }).click();

  // toBeHidden() passes for both of them.
  await expect(removed).toBeHidden();
  await expect(hidden).toBeHidden();

  // The removed element is not in the DOM. The hidden element is still there.
  await expect(removed).toHaveCount(0);
  await expect(removed).not.toBeAttached();
  await expect(hidden).toBeAttached();
  await expect(hidden).toHaveCount(1);

  await page.getByRole("button", { name: "Reset both" }).click();
  await expect(removed).toBeVisible();
  await expect(hidden).toBeVisible();
});
