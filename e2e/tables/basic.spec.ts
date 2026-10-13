import { test, expect, type Page } from "@playwright/test";

// Returns the cell of a row that sits in the column with the given header text.
async function cellByColumn(page: Page, rowText: string, column: string) {
  const headers = await page.getByRole("columnheader").allTextContents();
  const index = headers.indexOf(column);
  expect(index, `column "${column}" exists`).toBeGreaterThanOrEqual(0);
  return page.getByRole("row").filter({ hasText: rowText }).getByRole("cell").nth(index);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tables/basic");
});

test("the table has 4 data rows without the header and the footer", async ({ page }) => {
  await expect(page.locator("tbody").getByRole("row")).toHaveCount(4);
  // The header row and the footer row count as rows too.
  await expect(page.getByRole("row")).toHaveCount(6);
  await expect(page.getByTestId("table-total")).toHaveText("Total: 4 users");
});

test("finds the row of Michael and checks his email", async ({ page }) => {
  const michael = page.getByRole("row").filter({ hasText: "Michael" });
  await expect(michael.getByRole("cell").nth(2)).toHaveText("michael@example.com");
});

test("checks all column headers with one assertion", async ({ page }) => {
  await expect(page.getByRole("columnheader")).toHaveText(["First Name", "Last Name", "Email", "Age", "Role"]);
});

test("finds a cell by the name of its column", async ({ page }) => {
  await expect(await cellByColumn(page, "Anna", "Role")).toHaveText("User");
  await expect(await cellByColumn(page, "John", "Age")).toHaveText("32");
});

test("collects all roles and counts the users", async ({ page }) => {
  const roleCells = page.locator("tbody tr").locator("td:nth-child(5)");
  await expect(roleCells).toHaveCount(4);

  const roles = await roleCells.allTextContents();
  expect(roles.filter((role) => role === "User")).toHaveLength(2);
  expect(roles).toEqual(["Admin", "User", "Manager", "User"]);
});
