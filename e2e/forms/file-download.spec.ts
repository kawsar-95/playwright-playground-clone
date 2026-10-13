import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("the CSV export has a name, a header and 4 users", async ({ page }) => {
  await page.goto("/forms/file-download");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export users as CSV" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("users.csv");
  const lines = (await readFile(await download.path(), "utf-8")).trim().split("\n");
  expect(lines[0]).toBe("firstName,lastName,role");
  expect(lines).toHaveLength(5);
  await expect(page.getByRole("status")).toHaveText("Exported 4 users to users.csv");
});

test("the JSON export with inactive users has 6 users", async ({ page }) => {
  await page.goto("/forms/file-download");
  await page.getByLabel("Format").selectOption("json");
  await page.getByLabel("Include inactive users").check();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export users as JSON" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("users.json");
  const users: { firstName: string; lastName: string; role: string }[] = JSON.parse(await readFile(await download.path(), "utf-8"));
  expect(users).toHaveLength(6);
  expect(users[0]).toEqual({ firstName: "John", lastName: "Smith", role: "Admin" });
});

test("the sample report contains the test totals", async ({ page }) => {
  await page.goto("/forms/file-download");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download sample report" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("sample-report.txt");
  const content = await readFile(await download.path(), "utf-8");
  expect(content).toContain("Total tests");
});

test("the monthly report name matches the current month pattern", async ({ page }) => {
  await page.goto("/forms/file-download");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download monthly report" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^report-\d{4}-\d{2}\.txt$/);
});

test("a download is saved in the output folder of the test", async ({ page }, testInfo) => {
  await page.goto("/forms/file-download");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export users as CSV" }).click();
  const download = await downloadPromise;

  const target = testInfo.outputPath("exported-users.csv");
  await download.saveAs(target);

  const saved = await readFile(target, "utf-8");
  expect(saved).toContain("John,Smith,Admin");
});
