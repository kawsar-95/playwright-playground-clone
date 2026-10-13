import { test, expect } from "@playwright/test";

test("checkboxes: check, uncheck and setChecked", async ({ page }) => {
  await page.goto("/basic/checkboxes");

  const newsletter = page.getByRole("checkbox", { name: "Subscribe to newsletter" });
  const terms = page.getByRole("checkbox", { name: "Accept terms and conditions" });

  await newsletter.check();
  await terms.check();
  await expect(newsletter).toBeChecked();
  await expect(terms).toBeChecked();

  await expect(page.getByText("Newsletter:")).toHaveText("Newsletter: checked");
  await expect(page.getByText("Terms:")).toHaveText("Terms: checked");

  // check() on a checked box changes nothing.
  await newsletter.check();
  await expect(newsletter).toBeChecked();

  await newsletter.uncheck();
  await expect(newsletter).not.toBeChecked();
  await expect(terms).toBeChecked();
  await expect(page.getByText("Newsletter:")).toHaveText("Newsletter: unchecked");
  await expect(page.getByText("Terms:")).toHaveText("Terms: checked");

  const wantTerms = false;
  await terms.setChecked(wantTerms);
  await expect(terms).not.toBeChecked();
  await expect(page.getByText("Terms:")).toHaveText("Terms: unchecked");
});
