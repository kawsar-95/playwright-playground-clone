import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/content/properties");
});

test("the value attribute does not change but the value property does", async ({ page }) => {
  const nickname = page.getByLabel("Nickname");
  await nickname.fill("Neo");

  expect(await nickname.getAttribute("value")).toBe("Initial value"); // the HTML
  await expect(nickname).toHaveValue("Neo"); // what the user sees
  await expect(nickname).toHaveJSProperty("value", "Neo"); // the property
});

test("the checked attribute stays after the box is cleared", async ({ page }) => {
  const updates = page.getByLabel("Send me product updates");
  await expect(updates).toBeChecked();

  await updates.uncheck();

  await expect(updates).toHaveAttribute("checked"); // still in the HTML
  await expect(updates).not.toBeChecked();
  await expect(updates).toHaveJSProperty("checked", false);
});

test("checks that an attribute exists", async ({ page }) => {
  await expect(page.getByLabel("Work email")).toHaveAttribute("required");
  await expect(page.getByLabel("Nickname")).not.toHaveAttribute("required");
});

test("reads data attributes", async ({ page }) => {
  const product = page.getByRole("article", { name: "Wireless Mouse" });
  await expect(product).toHaveAttribute("data-stock", "3");
  await expect(product).toHaveAttribute("data-status", "in-stock");

  await page.getByRole("button", { name: "Buy one" }).click();
  await expect(product).toHaveAttribute("data-stock", "2");
  await expect(product).toHaveAttribute("data-status", "in-stock");

  await page.getByRole("button", { name: "Buy one" }).click();
  await expect(product).toHaveAttribute("data-stock", "1");
  await expect(product).toHaveAttribute("data-status", "low-stock");

  const data = await product.evaluate((el) => ({ ...el.dataset }));
  expect(data).toEqual({ sku: "QA-1042", stock: "1", status: "low-stock" });
});

test("the href attribute is relative but the href property is absolute", async ({ page }) => {
  const link = page.getByRole("link", { name: "Back to Content & Attributes" });

  expect(await link.getAttribute("href")).toBe("/content/attributes");
  expect(await link.evaluate((a: HTMLAnchorElement) => a.href)).toBe(new URL("/content/attributes", page.url()).href);
});
