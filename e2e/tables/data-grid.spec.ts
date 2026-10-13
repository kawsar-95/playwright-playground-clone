import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tables/data-grid");
  await expect(page.getByTestId("page-indicator")).toHaveText("Page 1 of 6");
});

test("goes to page 2 and shows 5 rows", async ({ page }) => {
  await page.getByRole("button", { name: "Next page" }).click();
  // Wait for a value that changes before you read the rows.
  await expect(page.getByTestId("page-indicator")).toHaveText("Page 2 of 6");
  await expect(page.locator("tbody").getByRole("row")).toHaveCount(5);
});

test("searches for Quinn and finds exactly one employee", async ({ page }) => {
  // The grid waits 300 ms after typing, then sends the request.
  const response = page.waitForResponse((r) => r.url().includes("/api/employees") && r.url().includes("search=Quinn"));
  await page.getByLabel("Search employees").fill("Quinn");
  expect((await response).ok()).toBe(true);
  await expect(page.getByTestId("result-count")).toHaveText("1 employee found");
  await expect(page.locator("tbody").getByRole("row")).toHaveCount(1);
  await expect(page.getByRole("row").filter({ hasText: "Quinn Harris" })).toBeVisible();
});

test("shows an empty message when nothing matches", async ({ page }) => {
  await page.getByLabel("Search employees").fill("zzzz-no-match");
  await expect(page.getByTestId("result-count")).toHaveText("0 employees found");
  await expect(page.locator("tbody")).toContainText('No employees match "zzzz-no-match".');
});

test("pages until Owen Virtanen appears, without skipping a page", async ({ page }) => {
  const target = page.getByRole("row").filter({ hasText: "Owen Virtanen" });
  const indicator = page.getByTestId("page-indicator");

  let pageNumber = 1;
  while (!(await target.isVisible())) {
    await page.getByRole("button", { name: "Next page" }).click();
    pageNumber++;
    // Wait for the new page before you check again.
    await expect(indicator).toHaveText(`Page ${pageNumber} of 6`);
  }

  await expect(target).toBeVisible();
  expect(pageNumber).toBeLessThanOrEqual(6);
});

test("keeps the selection when the page changes", async ({ page }) => {
  const indicator = page.getByTestId("page-indicator");
  const body = page.locator("tbody");
  const names = body.getByRole("row").locator("td:nth-child(2)");

  const firstTwo = (await names.allTextContents()).slice(0, 2);
  for (const name of firstTwo) {
    await page.getByRole("checkbox", { name: `Select ${name}` }).check();
  }
  await expect(page.getByTestId("selected-count")).toHaveText("2 selected");

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(indicator).toHaveText("Page 2 of 6");
  await expect(page.getByTestId("selected-count")).toHaveText("2 selected");

  await page.getByRole("checkbox", { name: "Select all on this page" }).check();
  await expect(page.getByTestId("selected-count")).toHaveText("7 selected");
  await expect(body.getByRole("checkbox", { checked: true })).toHaveCount(5);

  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.getByTestId("selected-count")).toHaveText("0 selected");
});

test("disables Previous on the first page and Next on the last page", async ({ page }) => {
  const indicator = page.getByTestId("page-indicator");
  const next = page.getByRole("button", { name: "Next page" });
  const previous = page.getByRole("button", { name: "Previous page" });

  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  for (let pageNumber = 2; pageNumber <= 6; pageNumber++) {
    await next.click();
    await expect(indicator).toHaveText(`Page ${pageNumber} of 6`);
  }

  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
});
