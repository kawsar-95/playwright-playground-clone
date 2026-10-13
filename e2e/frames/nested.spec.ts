import { test, expect } from "@playwright/test";

test("Nested & Multiple Frames", async ({ page }) => {
  await page.goto("/frames/nested");

  // Step 1: a frame inside a frame.
  const store = page.getByTitle("Store").contentFrame();
  const reviews = store.getByTitle("Reviews").contentFrame();
  await expect(store.getByText("2 reviews")).toBeVisible();
  await reviews.getByLabel("Your review").fill("Works great");
  await reviews.getByRole("button", { name: "Post review" }).click();
  await expect(store.getByText("3 reviews")).toBeVisible();

  // Step 2: two frames with the same title. Scope by the region of the plan.
  const pro = page.getByRole("region", { name: "Pro plan" }).getByTitle("Payment").contentFrame();
  const basic = page.getByRole("region", { name: "Basic plan" }).getByTitle("Payment").contentFrame();
  await pro.getByLabel("Card number").fill("4242 4242 4242 4242");
  await pro.getByRole("button", { name: "Pay" }).click();
  await expect(pro.getByRole("status")).toHaveText("Paid $15 for Pro");
  await expect(basic.getByText("Paid")).toHaveCount(0);

  // Step 3: a short card number gives an error.
  await basic.getByLabel("Card number").fill("4242");
  await basic.getByRole("button", { name: "Pay" }).click();
  await expect(basic.getByRole("alert")).toHaveText("Card number must have 16 digits");

  // Step 4: the terms frame has no title. Use its src.
  const terms = page.locator('iframe[src="/embeds/terms/"]').contentFrame();
  await terms.getByLabel("I accept the terms").check();
  await expect(terms.getByRole("status")).toHaveText("Terms accepted");

  // Step 5: the Frame API.
  const proFrame = page.frame({ name: "pay-pro" });
  expect(proFrame).not.toBeNull();
  expect(proFrame?.url()).toContain("/embeds/pay/?plan=pro");
  expect(page.frames()).toHaveLength(6);
});
