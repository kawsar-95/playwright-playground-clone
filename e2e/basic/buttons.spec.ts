import { test, expect } from "@playwright/test";

test("buttons: click, double click, right click and states", async ({ page }) => {
  await page.goto("/basic/buttons");
  const result = page.getByTestId("button-result");

  // "Click me" is also a part of two other names, so use an exact match.
  const clickMe = page.getByRole("button", { name: "Click me", exact: true });
  await clickMe.click();
  await expect(result).toHaveText("Button clicked");

  const primary = page.getByRole("button", { name: "Primary action" });
  await primary.click();
  await expect(result).toHaveText("Primary button clicked");

  await expect(page.getByRole("button", { name: "Disabled button" })).toBeDisabled();

  // A single click does nothing. A double click changes the message.
  const doubleClick = page.getByRole("button", { name: "Double click me" });
  await doubleClick.click();
  await expect(result).toHaveText("Primary button clicked");
  await doubleClick.dblclick();
  await expect(result).toHaveText("Double click detected");

  await page.getByRole("button", { name: "Right click me" }).click({ button: "right" });
  await expect(result).toHaveText("Right click detected");

  await expect(clickMe).toHaveClass(/secondary/);
  await expect(primary).not.toHaveClass(/secondary/);
  await expect(primary).toHaveCSS("background-color", "rgb(47, 95, 208)");
});
