import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dynamic/actionability");
});

test("click waits for a disabled button to become enabled", async ({ page }) => {
  await page.getByRole("button", { name: "Prepare order" }).click();
  // "Submit order" is disabled for 2 s. click() waits until it is enabled.
  await page.getByRole("button", { name: "Submit order" }).click();
  await expect(page.getByTestId("submit-result")).toHaveText("Order submitted");
});

test("click waits until the overlay is gone", async ({ page }) => {
  await page.getByRole("button", { name: "Refresh data" }).click();
  // The overlay covers Export for 2.5 s. click() retries until nothing covers it.
  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.getByTestId("export-result")).toHaveText("Report exported");
});

test("force: true clicks the overlay and exports nothing", async ({ page }) => {
  await page.getByRole("button", { name: "Refresh data" }).click();
  await page.getByRole("button", { name: "Export" }).click({ force: true });
  // The step passed, but the click went to the overlay.
  await expect(page.getByTestId("export-result")).toHaveCount(0);
});

test("click waits for a moving button to be stable", async ({ page }) => {
  await page.getByRole("button", { name: "Show offer" }).click();
  await page.getByRole("button", { name: "Claim offer" }).click();
  await expect(page.getByTestId("offer-result")).toHaveText("Offer claimed");
});

test("click scrolls the button into view", async ({ page }) => {
  // No manual scrolling is needed.
  await page.getByRole("button", { name: "Accept terms" }).click();
  await expect(page.getByTestId("scroll-result")).toHaveText("Terms accepted");
});

test("the timeout error names the failed check", async ({ page }) => {
  const submit = page.getByRole("button", { name: "Submit order" });
  // "Submit order" is disabled until the order is prepared, so the click cannot finish.
  await expect(submit).toBeDisabled();
  const click = submit.click({ timeout: 1000 });
  await expect(click).rejects.toThrow(/element is not enabled/);
  await expect(page.getByTestId("submit-result")).toHaveCount(0);
});
