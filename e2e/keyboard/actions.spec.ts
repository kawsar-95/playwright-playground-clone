import { test, expect } from "@playwright/test";

test("Keyboard Actions", async ({ page }) => {
  await page.goto("/keyboard/actions");
  await expect(page.getByRole("heading", { name: "Keyboard Actions" })).toBeVisible();

  // Step 1: pressSequentially() fires key events. fill() does not.
  const input = page.getByLabel("Type something");
  await input.pressSequentially("Playwright");
  await expect(page.getByTestId("keyboard-value")).toHaveText("Current value: Playwright");
  await expect(page.getByTestId("keystrokes")).toHaveText("Keystrokes: 10");
  await input.fill("Playwright");
  await expect(page.getByTestId("keystrokes")).toHaveText("Keystrokes: 10");

  // Step 2: editing keys.
  await input.press("Home");
  await input.pressSequentially("I love ");
  await expect(input).toHaveValue("I love Playwright");
  await input.press("ControlOrMeta+A");
  await input.press("Delete");
  await expect(page.getByTestId("keyboard-value")).toHaveText("Current value: Empty");

  // Step 3: Tab order.
  const form = page.getByRole("form", { name: "Shipping preferences" });
  await page.getByLabel("Full name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Gift wrap")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Standard" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Save" })).toBeFocused();

  // Step 4: Space, arrow keys and Enter.
  await page.getByLabel("Full name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Gift wrap").focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Gift wrap")).toBeChecked();
  await page.getByRole("radio", { name: "Standard" }).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "Overnight" })).toBeChecked();
  await page.getByLabel("Full name").press("Enter");
  await expect(page.getByText("Saved: Ada Lovelace, ada@example.com, gift wrap, Overnight delivery")).toBeVisible();

  // Step 5: "Clear form" works with a click, but Tab never reaches it.
  const clear = form.getByRole("button", { name: "Clear form" });
  await page.getByRole("button", { name: "Save" }).focus();
  await page.keyboard.press("Tab");
  await expect(clear).not.toBeFocused();
  await clear.click();
  await expect(page.getByLabel("Full name")).toHaveValue("");
  await expect(page.getByRole("radio", { name: "Standard" })).toBeChecked();

  // Step 6: shortcuts.
  await page.getByRole("heading", { name: "Shortcuts" }).click();
  await page.keyboard.press("/");
  await expect(page.getByLabel("Search the docs")).toBeFocused();
  await page.getByRole("heading", { name: "Shortcuts" }).click();
  await page.keyboard.press("ControlOrMeta+K");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(palette).toBeHidden();
  await expect(page.getByText("Last command: Show shortcuts")).toBeVisible();
  await page.keyboard.press("ControlOrMeta+K");
  await expect(palette).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();

  // Step 7: hold Shift while you click.
  await page.keyboard.down("Shift");
  await expect(page.getByTestId("shift-state")).toHaveText("held");
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("draft.txt deleted permanently")).toBeVisible();
  await page.keyboard.up("Shift");
  await expect(page.getByTestId("shift-state")).toHaveText("up");
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("draft.txt moved to trash")).toBeVisible();
});
