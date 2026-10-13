import { test, expect } from "@playwright/test";

test("hover: hover box, hover menu and tooltip", async ({ page }) => {
  await page.goto("/basic/hover");

  await page.getByText("Hover over me").hover();
  await expect(page.getByText("Hover state: active")).toBeVisible();

  // The page heading is "Hover". Two card headings also contain "hover", so match it exactly.
  await page.getByRole("heading", { name: "Hover", exact: true }).hover();
  await expect(page.getByText("Hover state: inactive")).toBeVisible();

  const option1 = page.getByRole("button", { name: "Option 1" });
  const option2 = page.getByRole("button", { name: "Option 2" });
  await expect(option1).toBeHidden();
  await page.getByRole("button", { name: "Move mouse here" }).hover();
  await expect(option1).toBeVisible();
  await expect(option2).toBeVisible();

  await option2.click();
  await expect(page.getByTestId("hover-menu-result")).toHaveText("Menu choice: Option 2");

  const info = page.getByRole("button", { name: "Shipping info" });
  await info.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Free shipping on orders over 200 PLN");
  await expect(info).toHaveAccessibleDescription("Free shipping on orders over 200 PLN");

  await page.getByRole("heading", { name: "Hover", exact: true }).hover();
  await expect(page.getByRole("tooltip")).toBeHidden();
});
