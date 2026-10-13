import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page, { remember }: { remember: boolean }) {
  await page.getByLabel("Username").fill("TedBuckland");
  await page.getByLabel("Password").fill("Alligator3");
  if (remember) await page.getByLabel("Remember me").check();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toHaveText("Signed in as TedBuckland");
}

test("a wrong password shows an error", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Username").fill("TedBuckland");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toHaveText("Invalid username or password");
});

test("the demo credentials show the account view", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await signIn(page, { remember: false });

  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  await expect(page.getByText("TedBuckland", { exact: true })).toBeVisible();
  await expect(page.getByTestId("session-storage")).toContainText("sessionStorage");
});

test("a reload keeps the user signed in", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await signIn(page, { remember: false });

  await page.reload();
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
});

test("a session without Remember me stays in its own tab", async ({ context }) => {
  const first = await context.newPage();
  await first.goto("/auth/sign-in");
  await signIn(first, { remember: false });

  const second = await context.newPage();
  await second.goto("/auth/sign-in");
  await expect(second.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
});

test("a remembered session reaches a new tab", async ({ context }) => {
  const first = await context.newPage();
  await first.goto("/auth/sign-in");
  await signIn(first, { remember: true });
  await expect(first.getByTestId("session-storage")).toContainText("localStorage");

  const second = await context.newPage();
  await second.goto("/auth/sign-in");
  await expect(second.getByRole("heading", { name: "My Account" })).toBeVisible();
});

test("Sign out brings the sign-in form back", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await signIn(page, { remember: true });

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
});

test.describe("reusing a saved session", () => {
  test("a setup that remembers the user gives a signed-in start", async ({ browser }, testInfo) => {
    const statePath = testInfo.outputPath("user.json");

    // Setup: sign in with "Remember me" and save the state.
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    await setupPage.goto("/auth/sign-in");
    await signIn(setupPage, { remember: true });
    await setupContext.storageState({ path: statePath });
    await setupContext.close();

    // Test: start from the saved file.
    const context = await browser.newContext({ storageState: statePath });
    const page = await context.newPage();
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
    await context.close();
  });

  test("a setup without Remember me gives an empty state", async ({ browser }, testInfo) => {
    const statePath = testInfo.outputPath("user.json");

    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    await setupPage.goto("/auth/sign-in");
    await signIn(setupPage, { remember: false });
    await setupContext.storageState({ path: statePath });
    await setupContext.close();

    // storageState() does not save sessionStorage, so the saved file has no session.
    const context = await browser.newContext({ storageState: statePath });
    const page = await context.newPage();
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My Account" })).toHaveCount(0);
    await context.close();
  });
});
