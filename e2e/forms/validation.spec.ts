import { test, expect } from "@playwright/test";

test.describe("Registration form", () => {
  test("an empty form shows both errors through the fields", async ({ page }) => {
    await page.goto("/forms/validation");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByLabel("Email")).toHaveAccessibleDescription("Email address is required.");
    await expect(page.getByLabel("Age")).toHaveAccessibleDescription("Age is required.");
  });

  const ages = [
    { age: "17", valid: false },
    { age: "18", valid: true },
    { age: "100", valid: true },
    { age: "101", valid: false },
  ];
  for (const { age, valid } of ages) {
    test(`age ${age} is ${valid ? "accepted" : "rejected"}`, async ({ page }) => {
      await page.goto("/forms/validation");
      await page.getByLabel("Email").fill("new.user@example.com");
      await page.getByLabel("Age").fill(age);
      await page.getByRole("button", { name: "Create account" }).click();

      if (valid) {
        await expect(page.getByTestId("validation-result")).toHaveText("Form submitted successfully");
      } else {
        await expect(page.getByLabel("Age")).toHaveAccessibleDescription("You must be between 18 and 100 years old.");
      }
    });
  }

  test("the server rejects an email that is already registered", async ({ page }) => {
    await page.goto("/forms/validation");
    await page.getByLabel("Email").fill("taken@example.com");
    await page.getByLabel("Age").fill("30");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByLabel("Email")).toHaveAccessibleDescription("An account with this email already exists.");
  });

  test("an invalid field has a red border that a valid submit removes", async ({ page }) => {
    await page.goto("/forms/validation");
    const email = page.getByLabel("Email");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(email).toHaveCSS("border-color", "rgb(198, 40, 40)");

    await email.fill("new.user@example.com");
    await page.getByLabel("Age").fill("30");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByTestId("validation-result")).toBeVisible();
    await expect(email).not.toHaveCSS("border-color", "rgb(198, 40, 40)");
  });
});

test.describe("Sign-up with live checks", () => {
  test("a taken username shows an error when the field loses focus", async ({ page }) => {
    await page.goto("/forms/validation");
    const username = page.getByLabel("Username", { exact: true });
    await username.fill("admin");
    await username.blur();

    await expect(page.getByText("admin is already taken.")).toBeVisible();
    await expect(username).toHaveAttribute("aria-invalid", "true");
  });

  test("a mocked check makes any username available", async ({ page }) => {
    await page.route("**/api/usernames/*", (route) => route.fulfill({ json: { username: "ada", available: true } }));
    await page.goto("/forms/validation");
    const username = page.getByLabel("Username", { exact: true });
    await username.fill("ada");
    await username.blur();

    await expect(page.getByText("ada is available.")).toBeVisible();
  });

  test("the password rules turn green and the confirmation must match", async ({ page }) => {
    await page.route("**/api/usernames/*", (route) => route.fulfill({ json: { username: "ada", available: true } }));
    await page.goto("/forms/validation");
    const username = page.getByLabel("Username", { exact: true });
    const password = page.getByLabel("Password", { exact: true });
    const confirm = page.getByLabel("Confirm password");
    const signUp = page.getByRole("button", { name: "Sign up" });

    await username.fill("ada");
    await username.blur();
    await expect(signUp).toBeDisabled();

    const rules = page.locator("#password-rules li");
    await expect(rules.filter({ hasText: "A number" })).not.toHaveClass("met");

    await password.fill("Secret123");
    await expect(rules).toHaveClass(["met", "met", "met"]);

    await confirm.fill("Different1");
    await confirm.blur();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
    await expect(signUp).toBeDisabled();

    await confirm.fill("Secret123");
    await expect(signUp).toBeEnabled();
    await signUp.click();
    await expect(page.getByText("Welcome, ada!")).toBeVisible();
  });
});

test.describe("Browser validation", () => {
  test("the empty form is blocked by the browser", async ({ page }) => {
    await page.goto("/forms/validation");
    await page.getByRole("button", { name: "Create team" }).click();

    const teamName = page.getByLabel("Team name");
    const teamSize = page.getByLabel("Team size");
    const website = page.getByLabel("Website (optional)");

    expect(await teamName.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    expect(await teamSize.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    expect(await website.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(true);
    // The other forms on the page have required fields too, so scope the check to this form.
    await expect(page.getByRole("form", { name: "Browser validation" }).locator("input:invalid")).toHaveCount(2);
    await expect(page.getByText(/created/)).toBeHidden();
  });

  test("a name that is too short is invalid", async ({ page }) => {
    await page.goto("/forms/validation");
    const teamName = page.getByLabel("Team name");
    await teamName.fill("ab");
    expect(await teamName.evaluate((input: HTMLInputElement) => input.validity.tooShort)).toBe(true);

    await teamName.fill("Playwrights");
    await page.getByLabel("Team size").fill("5");
    await page.getByRole("button", { name: "Create team" }).click();
    await expect(page.getByText("Team Playwrights created")).toBeVisible();
  });
});
