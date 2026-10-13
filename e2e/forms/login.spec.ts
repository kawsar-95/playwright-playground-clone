import { test, expect } from "@playwright/test";

test.describe("Login form", () => {
  test("an empty form shows both required errors", async ({ page }) => {
    await page.goto("/forms/login");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Username is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
    await expect(page.getByLabel("Username")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Password")).toHaveAttribute("aria-invalid", "true");
  });

  test("a wrong password shows a red error", async ({ page }) => {
    await page.goto("/forms/login");
    await page.getByLabel("Username").fill("TedBuckland");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Login" }).click();

    const result = page.getByTestId("login-result");
    await expect(result).toHaveText("Invalid username or password");
    await expect(result).toHaveClass(/error/);
    await expect(result).toHaveCSS("border-left-color", "rgb(198, 40, 40)");
    await expect(page.getByTestId("attempts-left")).toHaveText("2 attempts left");
  });

  test("the demo credentials sign in when the user presses Enter", async ({ page }) => {
    await page.goto("/forms/login");
    await page.getByLabel("Username").fill("TedBuckland");
    await page.getByLabel("Password").fill("Alligator3");
    await page.getByLabel("Password").press("Enter");

    const result = page.getByTestId("login-result");
    await expect(result).toHaveText("Login successful");
    await expect(result).toHaveClass(/success/);
    await expect(result).toHaveCSS("background-color", "rgb(232, 245, 236)");
  });

  test("the password is masked until the user shows it", async ({ page }) => {
    await page.goto("/forms/login");
    const password = page.getByLabel("Password");
    const toggle = page.getByRole("button", { name: "Show password" });

    await expect(password).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("three failed attempts lock the form until the clock moves on", async ({ page }) => {
    await page.clock.install();
    await page.goto("/forms/login");

    await page.getByLabel("Username").fill("TedBuckland");
    await page.getByLabel("Password").fill("wrong");
    const login = page.getByRole("button", { name: "Login" });
    for (let attempt = 0; attempt < 3; attempt++) {
      await login.click();
    }

    await expect(page.getByTestId("login-result")).toContainText("Too many failed attempts.");
    await expect(login).toBeDisabled();
    await expect(page.getByLabel("Username")).toBeDisabled();

    await page.clock.fastForward("00:31");
    await expect(login).toBeEnabled();
    await expect(page.getByLabel("Username")).toBeEnabled();
    await expect(page.getByTestId("login-result")).toBeHidden();
  });
});
