import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/content/aria-widgets");
});

test("finds the selected tab and moves with the arrow keys", async ({ page }) => {
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Profile");

  await page.getByRole("tab", { name: "Profile" }).focus();
  await page.keyboard.press("ArrowRight");

  await expect(page.getByRole("tab", { name: "Security" })).toBeFocused();
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Security");
  await expect(page.getByRole("tabpanel")).toHaveText(/Two-factor/);
});

test("opens one accordion question", async ({ page }) => {
  // Limit the search to the accordion: other parts of the page can have buttons that are expanded.
  const accordion = page.locator(".accordion");
  await expect(accordion.getByRole("button", { expanded: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Can I run tests in parallel?" }).click();

  await expect(accordion.getByRole("button", { expanded: true })).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Can I run tests in parallel?" })).toBeVisible();
  await expect(page.getByText("Playwright runs test files in parallel by default.")).toBeVisible();
});

test("shows the pressed state of toggle buttons", async ({ page }) => {
  await page.getByRole("button", { name: "Bold" }).click();
  await page.getByRole("button", { name: "Underline" }).click();

  await expect(page.getByRole("button", { name: "Bold", pressed: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Underline", pressed: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Italic", pressed: false })).toBeVisible();
  await expect(page.getByTestId("format-result")).toHaveText("Formats: Bold, Underline");
});

test("counts the headings of level 3", async ({ page }) => {
  // The three accordion questions are level 3 headings.
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
});

test("asserts the tab list with an aria snapshot", async ({ page }) => {
  // Step 1 (while you write the test): console.log(await page.getByRole('tablist').ariaSnapshot());
  // Step 2: paste the YAML here and keep only the lines that matter.
  await expect(page.getByRole("tablist")).toMatchAriaSnapshot(`
    - tablist "Account settings":
      - tab "Profile" [selected]
      - tab "Security"
      - tab "Billing"
  `);

  await page.getByRole("tab", { name: "Billing" }).click();
  await expect(page.getByRole("tablist")).toMatchAriaSnapshot(`
    - tablist "Account settings":
      - tab "Profile"
      - tab "Security"
      - tab "Billing" [selected]
  `);
  await expect(page.getByRole("tabpanel")).toMatchAriaSnapshot("- tabpanel: /free plan/");
});
