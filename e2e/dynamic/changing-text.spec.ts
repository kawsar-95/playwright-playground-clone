import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dynamic/changing-text");
});

test("job status changes: Queued, Running, Passed", async ({ page }) => {
  const status = page.getByTestId("job-status");
  await expect(status).toHaveText("Not started");

  await page.getByRole("button", { name: "Run job" }).click();
  await expect(status).toHaveText("Queued");
  await expect(status).toHaveText("Running");
  await expect(status).toHaveText("Passed");
  await expect(page.getByRole("button", { name: "Run job" })).toBeEnabled();
});

// The flaky version: textContent() reads the text one time, before the job is done.
// test.fail() tells Playwright that this test is expected to fail.
test("reading textContent() once is flaky", async ({ page }) => {
  test.fail();
  await page.getByRole("button", { name: "Run job" }).click();
  const status = await page.getByTestId("job-status").textContent();
  expect(status).toBe("Passed");
});

test("order confirmation has a random ID in a fixed format", async ({ page }) => {
  const confirmation = page.getByTestId("order-confirmation");

  await page.getByRole("button", { name: "Place order" }).click();
  await expect(confirmation).toHaveText(/^Order ORD-\d{6} confirmed$/);
});

test("a second order gets a different ID", async ({ page }) => {
  const confirmation = page.getByTestId("order-confirmation");
  const placeOrder = page.getByRole("button", { name: "Place order" });

  await placeOrder.click();
  await expect(confirmation).toHaveText(/^Order ORD-\d{6} confirmed$/);
  // The assertion passed, so the text is stable and we can read it.
  const firstText = await confirmation.textContent();
  const firstId = firstText!.match(/ORD-\d{6}/)![0];

  await placeOrder.click();
  await expect(confirmation).toHaveText(/^Order ORD-\d{6} confirmed$/);
  const secondText = await confirmation.textContent();
  const secondId = secondText!.match(/ORD-\d{6}/)![0];

  expect(secondId).not.toBe(firstId);
});
