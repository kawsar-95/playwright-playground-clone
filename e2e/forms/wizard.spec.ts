import { test, expect, type Page } from "@playwright/test";

async function fillAccount(page: Page, name = "Ada Lovelace") {
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Step 2 of 3: Plan" })).toBeVisible();
}

test("an empty first step shows both errors", async ({ page }) => {
  await page.goto("/forms/wizard");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByLabel("Full name")).toHaveAccessibleDescription("Enter your full name.");
  await expect(page.getByLabel("Email")).toHaveAccessibleDescription("Enter your email address.");
  await expect(page.getByRole("heading", { name: "Step 1 of 3: Account" })).toBeVisible();
});

test("the Pro plan billed yearly gives a total and a welcome message", async ({ page }) => {
  await page.goto("/forms/wizard");
  await fillAccount(page);
  await expect(page).toHaveURL(/step=2/);

  await page.getByRole("group", { name: "Plan" }).getByRole("radio", { name: "Pro" }).check();
  await page.getByRole("group", { name: "Billing" }).getByRole("radio", { name: "Yearly" }).check();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Step 3 of 3: Review" })).toBeVisible();
  await expect(page).toHaveURL(/step=3/);
  await expect(page.getByTestId("wizard-total")).toHaveText("$120 per year");

  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toHaveText("Accept the terms to continue.");

  await page.getByLabel("I agree to the terms").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toHaveText("Welcome aboard, Ada Lovelace! Your Pro plan (yearly) is active.");
});

test("the Team plan needs at least 3 seats", async ({ page }) => {
  await page.goto("/forms/wizard");
  await fillAccount(page);

  await page.getByRole("group", { name: "Plan" }).getByRole("radio", { name: "Team" }).check();
  await page.getByLabel("Number of seats").fill("2");
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByLabel("Number of seats")).toHaveAccessibleDescription("A team needs between 3 and 50 seats.");
  await expect(page.getByRole("heading", { name: "Step 2 of 3: Plan" })).toBeVisible();
});

test("Back keeps the name that the user entered", async ({ page }) => {
  await page.goto("/forms/wizard");
  await fillAccount(page, "Grace Hopper");

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Step 1 of 3: Account" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Grace Hopper");
});

test("a reload keeps the draft", async ({ page }) => {
  await page.goto("/forms/wizard");
  await fillAccount(page, "Grace Hopper");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Step 2 of 3: Plan" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Grace Hopper");
});

test("a new page cannot open step 3 directly", async ({ context }) => {
  const first = await context.newPage();
  await first.goto("/forms/wizard");
  await fillAccount(first);

  const second = await context.newPage();
  await second.goto("/forms/wizard?step=3");
  await expect(second.getByRole("heading", { name: "Step 1 of 3: Account" })).toBeVisible();
  await expect(second).toHaveURL(/step=1/);
});

test("Edit plan switches the review to the Free plan", async ({ page }) => {
  await page.goto("/forms/wizard");
  await fillAccount(page);
  await page.getByRole("group", { name: "Plan" }).getByRole("radio", { name: "Pro" }).check();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("wizard-total")).toHaveText("$12 per month");

  await page.getByRole("button", { name: "Edit plan" }).click();
  await expect(page.getByRole("heading", { name: "Step 2 of 3: Plan" })).toBeVisible();
  await page.getByRole("group", { name: "Plan" }).getByRole("radio", { name: "Free" }).check();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByTestId("wizard-total")).toHaveText("Free");
});
