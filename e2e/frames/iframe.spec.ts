import { test, expect } from "@playwright/test";

test("iFrame Basics: work inside frames", async ({ page }) => {
  await page.goto("/frames/iframe");

  // Step 1: enter the frame, then use the usual locators.
  const form = page.getByTitle("Embedded Form").contentFrame();
  await form.getByLabel("Name").fill("Ada");
  await form.getByRole("button", { name: "Submit" }).click();
  await expect(form.getByRole("status")).toHaveText("Hello, Ada");

  // Step 2: page locators do not see inside the frame.
  await expect(page.getByText("Hello, Ada")).toHaveCount(0);

  // Step 3: the newsletter frame loads its own page by URL.
  const newsletter = page.frameLocator('iframe[title="Newsletter signup"]');
  await newsletter.getByLabel("Email address").fill("ada@example.com");
  await newsletter.getByLabel("Weekly digest").check();
  await newsletter.getByRole("button", { name: "Subscribe" }).click();
  await expect(newsletter.getByRole("status")).toHaveText("Subscribed ada@example.com to the weekly digest");

  // Step 4: the src belongs to the iframe element. owner() returns to it.
  await expect(newsletter.owner()).toHaveAttribute("src", "/embeds/newsletter/");
});
