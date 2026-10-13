import { test, expect } from "@playwright/test";

test("radio buttons: one selection in a group", async ({ page }) => {
  await page.goto("/basic/radio-buttons");

  const chrome = page.getByRole("radio", { name: "Chrome" });
  const firefox = page.getByRole("radio", { name: "Firefox" });
  const safari = page.getByRole("radio", { name: "Safari" });
  const selected = page.getByText("Selected browser:");

  await expect(chrome).not.toBeChecked();
  await expect(firefox).not.toBeChecked();
  await expect(safari).not.toBeChecked();
  await expect(selected).toHaveText("Selected browser: none");

  await firefox.check();
  await expect(firefox).toBeChecked();
  await expect(chrome).not.toBeChecked();
  await expect(safari).not.toBeChecked();
  await expect(selected).toHaveText("Selected browser: Firefox");

  await safari.check();
  await expect(safari).toBeChecked();
  await expect(firefox).not.toBeChecked();

  await expect(page.getByRole("radio", { name: "Internet Explorer" })).toBeDisabled();

  // Each enabled radio can be selected, and then it is the only one that is checked.
  const names = ["Chrome", "Firefox", "Safari"];
  for (const name of names) {
    await page.getByRole("radio", { name }).check();
    await expect(page.getByRole("radio", { name })).toBeChecked();
    await expect(selected).toHaveText(`Selected browser: ${name}`);
    for (const other of names.filter((n) => n !== name)) {
      await expect(page.getByRole("radio", { name: other })).not.toBeChecked();
    }
  }
});
