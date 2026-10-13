import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/content/attributes");
});

test("asserts exact and partial text", async ({ page }) => {
  const paragraph = page.getByTestId("text-content");
  await expect(paragraph).toHaveText("This is visible text inside a paragraph.");
  await expect(paragraph).toContainText("visible text");
});

test("reads text that spans several tags", async ({ page }) => {
  await expect(page.getByTestId("nested-content")).toHaveText("Hello Playwright");
});

test("asserts the value of a read-only input", async ({ page }) => {
  const input = page.getByLabel("Input value");
  await expect(input).toHaveValue("Initial value");
  await expect(input).not.toBeEditable();
});

test("asserts the attributes of the link", async ({ page }) => {
  const link = page.getByTestId("attribute-link");
  await expect(link).toHaveAttribute("href", "/content/attributes");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveId("test-link");
  await expect(link).toHaveClass("special-link");

  // getByRole() uses the accessible name (the aria-label). getByText() uses the visible text.
  await expect(link).toHaveAccessibleName("Open attribute test page");
  await expect(page.getByRole("link", { name: "Open attribute test page" })).toBeVisible();
  await expect(page.getByText("Open page")).toBeVisible();
});

test("asserts enabled and disabled buttons", async ({ page }) => {
  const enabled = page.getByRole("button", { name: "Click Me" });
  await expect(enabled).toBeEnabled();
  await expect(page.getByRole("button", { name: "Disabled Button" })).toBeDisabled();

  await enabled.click();
  await expect(page.getByTestId("content-result")).toHaveText("Button was clicked");
});
