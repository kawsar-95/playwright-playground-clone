import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dialogs/windows");
});

test("opens the help article in a new tab", async ({ page }) => {
  // Start to wait for the popup before the click that opens it.
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Open help article" }).click();
  const popup = await popupPromise;

  await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Help article");
  await expect(popup.getByTestId("new-tab-message")).toHaveText("You successfully opened a new tab.");
  await expect(popup).toHaveURL(/\/dialogs\/new-tab-content$/);

  // The original page did not move.
  await expect(page).toHaveURL(/\/dialogs\/windows$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tabs & Windows");
});

test("opens the preview window and closes it from inside", async ({ page }) => {
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open preview window" }).click();
  const popup = await popupPromise;

  await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Preview");
  await expect(popup.getByTestId("new-window-message")).toHaveText("You successfully opened a new window.");

  const closed = popup.waitForEvent("close");
  await popup.getByRole("button", { name: "Close window" }).click();
  await closed;

  expect(popup.isClosed()).toBe(true);
});

test("signs in with Acme ID in a popup", async ({ page }) => {
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Sign in with Acme ID" }).click();
  const popup = await popupPromise;
  await expect(page.getByText("Waiting for Acme ID…")).toBeVisible();

  await popup.getByLabel("Email").fill("ada@example.com");
  await popup.getByLabel("Password").fill("secret");
  const closed = popup.waitForEvent("close");
  await popup.getByRole("button", { name: "Allow" }).click();
  await closed;

  expect(popup.isClosed()).toBe(true);
  await expect(page.getByText("Signed in as ada@example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("shows access denied when the popup denies the request", async ({ page }) => {
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Sign in with Acme ID" }).click();
  const popup = await popupPromise;

  await popup.getByRole("button", { name: "Deny" }).click();

  await expect(page.getByText("Access denied")).toBeVisible();
});

test("shows that the sign-in is cancelled when the popup closes without an answer", async ({ page }) => {
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Sign in with Acme ID" }).click();
  const popup = await popupPromise;

  await popup.close();

  await expect(page.getByText("Sign-in cancelled")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Acme ID" })).toBeEnabled();
});

test("opens all reports and finds the Traffic report in the context", async ({ page, context }) => {
  for (const name of ["Sales", "Traffic", "Support"]) {
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("link", { name: `${name} report` }).click();
    const popup = await popupPromise;
    await expect(popup.getByRole("heading", { level: 1 })).toHaveText(`${name} report`);
  }

  // The original page and 3 reports.
  expect(context.pages()).toHaveLength(4);

  // Find a tab by what it shows, not by the order in which it opened.
  let traffic;
  for (const tab of context.pages()) {
    if (await tab.getByRole("heading", { name: "Traffic report" }).isVisible()) {
      traffic = tab;
    }
  }
  expect(traffic).toBeDefined();
  await expect(traffic!.getByText("8,950")).toBeVisible();
  await expect(traffic!.getByText("Bounce rate")).toBeVisible();
});

test("a second page in the same context updates the first page", async ({ page, context }) => {
  const unread = page.getByTestId("unread-count");
  await expect(unread).toHaveText("3");

  const second = await context.newPage();
  await second.goto("/dialogs/windows");
  await expect(second.getByTestId("unread-count")).toHaveText("3");
  await second.getByRole("button", { name: "Mark all as read" }).click();

  // Both pages share localStorage, so the first page gets a storage event.
  await expect(unread).toHaveText("0");
  await expect(page.getByRole("button", { name: "Mark all as read" })).toBeDisabled();
});
