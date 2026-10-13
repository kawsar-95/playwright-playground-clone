import { test, expect } from "@playwright/test";

test("dropdown: native selects and a custom dropdown", async ({ page }) => {
  await page.goto("/basic/dropdown");

  const country = page.getByLabel("Select a country");
  await country.selectOption({ label: "Germany" });
  await expect(page.getByText("Selected country:")).toHaveText("Selected country: Germany");

  await country.selectOption("United States");
  await expect(country).toHaveValue("United States");

  const languages = page.getByLabel("Languages you speak");
  await languages.selectOption(["English", "Spanish"]);
  await expect(languages).toHaveValues(["English", "Spanish"]);
  await expect(page.getByTestId("languages-result")).toHaveText("Selected languages: English, Spanish");

  // The shirt-size dropdown is a button and a list.
  const shirtSize = page.getByRole("button", { name: "Shirt size" });
  await shirtSize.click();
  await page.getByRole("option", { name: "Large" }).click();
  await expect(page.getByTestId("size-result")).toHaveText("Selected size: Large");
  await expect(shirtSize).toContainText("Large");

  // selectOption() works only on a <select> element.
  await expect(shirtSize.selectOption("Large", { timeout: 1000 })).rejects.toThrow(/not a <select> element/);
});
