import { test, expect } from "@playwright/test";

test("home page lists the categories", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Learn Playwright by testing a real app" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Buttons" }).first()).toBeVisible();
  await page.getByRole("link", { name: /Start with/ }).click();
  await expect(page).toHaveURL(/\/basic\/buttons$/);
});
