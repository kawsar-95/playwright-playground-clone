import { test, expect, type Locator } from "@playwright/test";

async function readNumbers(cells: Locator): Promise<number[]> {
  return (await cells.allTextContents()).map(Number);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tables/sortable");
});

test("sorts by Age in both directions", async ({ page }) => {
  const ageHeader = page.getByRole("columnheader", { name: "Age" });
  const ages = page.locator("tbody tr").locator("td:nth-child(3)");

  await page.getByRole("button", { name: "Age" }).click();
  await expect(ageHeader).toHaveAttribute("aria-sort", "ascending");
  const ascending = await readNumbers(ages);
  expect(ascending).toEqual([...ascending].sort((a, b) => a - b));

  await page.getByRole("button", { name: "Age" }).click();
  await expect(ageHeader).toHaveAttribute("aria-sort", "descending");
  const descending = await readNumbers(ages);
  expect(descending).toEqual([...descending].sort((a, b) => b - a));
});

test("compares the Score column as numbers", async ({ page }) => {
  const scoreHeader = page.getByRole("columnheader", { name: "Score" });
  const scoreCells = page.locator("tbody tr").locator("td:nth-child(4)");

  await page.getByRole("button", { name: "Score" }).click();
  await expect(scoreHeader).toHaveAttribute("aria-sort", "ascending");

  const texts = await scoreCells.allTextContents();

  // The trap: a text sort puts "10" before "7", so it does not match the table.
  const sortedAsText = [...texts].sort();
  expect(sortedAsText).not.toEqual(texts);

  // The correct way: convert to numbers first.
  const scores = texts.map(Number);
  expect(scores).toEqual([...scores].sort((a, b) => a - b));
  expect(scores[0]).toBe(7);
  expect(scores[scores.length - 1]).toBe(100);
});

test("starts sorted by First Name and reverses the order", async ({ page }) => {
  const firstNameHeader = page.getByRole("columnheader", { name: "First Name" });
  const firstNames = page.locator("tbody tr").locator("td:nth-child(1)");

  await expect(firstNameHeader).toHaveAttribute("aria-sort", "ascending");
  const initial = await firstNames.allTextContents();
  expect(initial).toEqual([...initial].sort((a, b) => a.localeCompare(b)));

  await page.getByRole("button", { name: "First Name" }).click();
  await expect(firstNameHeader).toHaveAttribute("aria-sort", "descending");
  const reversed = await firstNames.allTextContents();
  expect(reversed).toEqual([...initial].reverse());

  // The other columns are not sorted.
  await expect(page.getByRole("columnheader", { name: "Age" })).toHaveAttribute("aria-sort", "none");
});
