import { test, expect, type Page } from "@playwright/test";

// The newsletter popup appears at a random time and covers the page.
// This handler runs each time the popup is visible before an action, and closes it.
async function handleNewsletterPopup(page: Page) {
  await page.addLocatorHandler(page.getByRole("dialog", { name: "Join our newsletter" }), async (overlay) => {
    await overlay.getByRole("button", { name: "No thanks" }).click();
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/dialogs/modal");
});

test("renames the project in the native dialog and closes it with Escape", async ({ page }) => {
  const rename = page.getByRole("dialog", { name: "Rename project" });

  await page.getByRole("button", { name: "Rename project" }).click();
  await rename.getByLabel("Project name").fill("Gemini");
  await rename.getByRole("button", { name: "Save" }).click();

  await expect(rename).toBeHidden();
  await expect(page.getByTestId("project-name")).toHaveText("Gemini");
  await expect(page.getByText("Project renamed to Gemini")).toBeVisible();

  await page.getByRole("button", { name: "Rename project" }).click();
  await expect(rename).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(rename).toBeHidden();
  await expect(page.getByText("Rename cancelled")).toBeVisible();
  await expect(page.getByTestId("project-name")).toHaveText("Gemini");
});

test("the page behind the native dialog cannot be clicked", async ({ page }) => {
  await page.getByRole("button", { name: "Rename project" }).click();
  await expect(page.getByRole("dialog", { name: "Rename project" })).toBeVisible();

  // A short trial click does not click. It only checks if the click would work.
  await expect(
    page.getByRole("button", { name: "Rename project" }).click({ trial: true, timeout: 1000 }),
  ).rejects.toThrow();
});

test("the invite modal moves focus in and shows a validation error", async ({ page }) => {
  await handleNewsletterPopup(page);
  const invite = page.getByRole("dialog", { name: "Invite teammate" });

  await page.getByRole("button", { name: "Invite teammate" }).click();
  await expect(invite.getByLabel("Email")).toBeFocused();

  await invite.getByRole("button", { name: "Send invite" }).click();
  await expect(invite.getByRole("alert")).toHaveText("Enter an email address");
  await expect(invite.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
});

test("sends an invite as Editor and disables the buttons while it sends", async ({ page }) => {
  await handleNewsletterPopup(page);
  const invite = page.getByRole("dialog", { name: "Invite teammate" });

  await page.getByRole("button", { name: "Invite teammate" }).click();
  await invite.getByLabel("Email").fill("ada@example.com");
  await invite.getByLabel("Role").selectOption("Editor");
  await invite.getByRole("button", { name: "Send invite" }).click();

  await expect(invite.getByRole("button", { name: "Sending…" })).toBeDisabled();
  await expect(invite.getByRole("button", { name: "Cancel" })).toBeDisabled();

  await expect(invite).toBeHidden();
  await expect(page.getByText("Invite sent to ada@example.com as Editor")).toBeVisible();
});

test("keeps focus inside the modal and gives it back when it closes", async ({ page }) => {
  await handleNewsletterPopup(page);
  const invite = page.getByRole("dialog", { name: "Invite teammate" });
  const opener = page.getByRole("button", { name: "Invite teammate" });

  await opener.click();
  await invite.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(invite.getByLabel("Email")).toBeFocused();

  await invite.getByRole("button", { name: "Close", exact: true }).click();
  await expect(invite).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.getByText("Invite cancelled (close button)")).toBeVisible();
});

test("handles a modal on top of a modal", async ({ page }) => {
  await handleNewsletterPopup(page);
  const edit = page.getByRole("dialog", { name: "Edit post" });
  const discard = page.getByRole("dialog", { name: "Discard changes?" });

  await page.getByRole("button", { name: "Edit post" }).click();
  await edit.getByLabel("Title").fill("A new title");
  await edit.getByRole("button", { name: "Cancel" }).click();

  // Both dialogs are open at the same time.
  await expect(edit).toBeVisible();
  await expect(discard).toBeVisible();

  await discard.getByRole("button", { name: "Keep editing" }).click();
  await expect(discard).toBeHidden();
  await expect(edit).toBeVisible();

  await edit.getByRole("button", { name: "Cancel" }).click();
  await discard.getByRole("button", { name: "Discard" }).click();

  await expect(discard).toBeHidden();
  await expect(edit).toBeHidden();
  await expect(page.getByText("Changes discarded")).toBeVisible();
  await expect(page.getByTestId("post-title")).toHaveText("Hello world");
});

test("adds to the cart even when the newsletter popup appears at a random time", async ({ page }) => {
  await handleNewsletterPopup(page);

  const products = page.getByRole("list", { name: "Products" });
  await products.getByRole("listitem").filter({ hasText: "USB-C hub" }).getByRole("button", { name: "Add to cart" }).click();
  await products.getByRole("listitem").filter({ hasText: "Desk lamp" }).getByRole("button", { name: "Add to cart" }).click();

  await expect(page.getByTestId("cart-count")).toHaveText("2 items");
});
