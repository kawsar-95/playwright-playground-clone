import { test, expect } from "@playwright/test";

test("inputs: fill every input type and read the summary", async ({ page }) => {
  await page.goto("/basic/inputs");

  const username = page.getByLabel("Username");
  await username.fill("tester");
  await expect(username).toHaveValue("tester");
  await expect(page.getByTestId("username-result")).toContainText("tester");

  const email = page.getByLabel("Email");
  await email.fill("tester@example.com");
  await page.getByLabel("Password").fill("secret123");
  await page.getByLabel("Number").fill("42");
  await page.getByLabel("Date").fill("2026-05-17");

  await expect(page.getByTestId("result-email")).toHaveText("tester@example.com");
  await expect(page.getByTestId("result-number")).toHaveText("42");
  await expect(page.getByTestId("result-date")).toHaveText("2026-05-17");

  // The summary masks the password.
  await expect(page.getByTestId("result-password")).toHaveText("••••••••");
  await expect(page.getByTestId("other-inputs-result")).not.toContainText("secret123");

  // The label of the range input has its value, so match it with a regular expression.
  await page.getByLabel(/Range/).fill("75");
  await expect(page.getByTestId("range-badge")).toHaveText("75");
  await expect(page.getByTestId("result-range")).toHaveText("75");

  await email.clear();
  await expect(email).toHaveValue("");
  await expect(page.getByTestId("result-email")).toHaveText("N/A");
});
