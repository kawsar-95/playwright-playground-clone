import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dynamic/flaky-lab");
});

// Run this file with: npx playwright test flaky-lab --repeat-each=20
test("random delay: the report can take up to 7 seconds", async ({ page }) => {
  await page.getByRole("button", { name: "Fetch report" }).click();
  // The default timeout is 5 s. Use a timeout that is longer than the slowest case.
  await expect(page.getByTestId("report")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("report")).toHaveText("Report ready: 128 tests, 124 passed");
});

test("re-rendering list: select Beta by its text", async ({ page }) => {
  const beta = page
    .getByRole("list", { name: "Services" })
    .getByRole("listitem")
    .filter({ hasText: "Beta" })
    .getByRole("button", { name: "Select" });

  // The page can render the list again between the mouse down and the mouse up.
  // toPass() runs the click and the assertion again until both succeed.
  await expect(async () => {
    await beta.click();
    await expect(page.getByTestId("selected-service")).toHaveText("Selected service: Beta", { timeout: 1000 });
  }).toPass();
});

test("nth() picks a different service each time", async ({ page }) => {
  const selected = page.getByTestId("selected-service");
  const renderCount = page.getByTestId("render-count");
  const picked = new Set<string>();

  for (let i = 0; i < 8; i++) {
    const before = await renderCount.textContent();
    await page.getByRole("button", { name: "Select" }).nth(1).click();
    const text = await selected.textContent();
    picked.add(text!.replace("Selected service: ", ""));
    // Wait for the next render. The order of the list changes again.
    await expect(renderCount).not.toHaveText(before!);
  }

  // The second row is not always Beta, so position is not a reliable way to find a service.
  expect(picked.size).toBeGreaterThan(1);
});

test("quick save: listen for the response before the click", async ({ page }) => {
  const responsePromise = page.waitForResponse("**/api/status/200");
  await page.getByRole("button", { name: "Quick save" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  await expect(page.getByTestId("save-result")).toHaveText("Saved");
});
