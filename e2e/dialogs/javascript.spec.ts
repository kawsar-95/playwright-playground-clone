import { test, expect, type Dialog } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dialogs/javascript");
});

test("accepts the alert and checks its message", async ({ page }) => {
  let seen: { type: string; message: string } | undefined;
  // Register the handler before the click that opens the dialog.
  page.once("dialog", async (dialog) => {
    seen = { type: dialog.type(), message: dialog.message() };
    await dialog.accept();
  });

  await page.getByRole("button", { name: "Alert" }).click();

  expect(seen).toEqual({ type: "alert", message: "This is an alert dialog" });
  await expect(page.getByTestId("dialog-result")).toHaveText("Alert was displayed");
});

test("accepts and dismisses the confirm", async ({ page }) => {
  const result = page.getByTestId("dialog-result");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(result).toHaveText("Confirm accepted");

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(result).toHaveText("Confirm dismissed");
});

test("answers the prompt with a name and with its default value", async ({ page }) => {
  const result = page.getByTestId("dialog-result");

  page.once("dialog", (dialog) => dialog.accept("Ada"));
  await page.getByRole("button", { name: "Prompt" }).click();
  await expect(result).toHaveText("Hello, Ada");

  // accept() with no text sends an empty string. The pre-filled value is in defaultValue().
  page.once("dialog", (dialog) => dialog.accept(dialog.defaultValue()));
  await page.getByRole("button", { name: "Prompt" }).click();
  await expect(result).toHaveText("Hello, Guest");
});

test("deletes a file only when the confirm is accepted", async ({ page }) => {
  const documents = page.getByRole("list", { name: "Documents" });

  let message = "";
  page.once("dialog", async (dialog) => {
    message = dialog.message();
    await dialog.accept();
  });
  await documents.getByRole("listitem").filter({ hasText: "budget.xlsx" }).getByRole("button", { name: "Delete" }).click();

  expect(message).toBe("Delete budget.xlsx? This cannot be undone.");
  await expect(documents.getByRole("listitem")).toHaveText(["report.pdf", "notes.txt"].map((name) => new RegExp(name)));
  await expect(page.getByText("budget.xlsx deleted")).toBeVisible();

  // No handler: Playwright dismisses the confirm. The app takes the "Cancel" path.
  await documents.getByRole("listitem").filter({ hasText: "notes.txt" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Kept notes.txt")).toBeVisible();
  await expect(documents.getByRole("listitem").filter({ hasText: "notes.txt" })).toBeVisible();
});

test("answers both dialogs when the account is deleted", async ({ page }) => {
  const types: string[] = [];
  const handler = async (dialog: Dialog) => {
    types.push(dialog.type());
    if (dialog.type() === "confirm") await dialog.accept();
    else if (dialog.type() === "prompt") await dialog.accept("DELETE");
  };

  page.on("dialog", handler);
  await page.getByRole("button", { name: "Delete account" }).click();
  page.off("dialog", handler);

  expect(types).toEqual(["confirm", "prompt"]);
  await expect(page.getByText("Account deleted", { exact: true })).toBeVisible();
});

test("keeps the session alive when the warning appears", async ({ page }) => {
  const dialogPromise = page.waitForEvent("dialog");
  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByText("Session active")).toBeVisible();

  // The dialog opens about 2 seconds later.
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe("Your session is about to expire. Stay signed in?");
  await dialog.accept();

  await expect(page.getByText("Session extended")).toBeVisible();
});

test("dismisses the Leave site warning and stays on the page", async ({ page }) => {
  // The browser shows the warning only after a real interaction with the page.
  const notes = page.getByLabel("Notes");
  await notes.click();
  await notes.pressSequentially("Do not lose this");
  await expect(page.getByTestId("save-state")).toHaveText("Unsaved changes");

  // page.close() does not wait for the page. The warning arrives as a dialog event.
  const dialogPromise = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  const dialog = await dialogPromise;

  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss(); // stay on the page
  expect(page.isClosed()).toBe(false);
  await expect(notes).toHaveValue("Do not lose this");
});
