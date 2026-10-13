import { test, expect } from "@playwright/test";

test("Embedded Widgets", async ({ page }) => {
  // Step 5 needs the route before the page loads.
  await page.route("**/embeds/weather/", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>-5°C, snow</p>" }),
  );
  await page.goto("/frames/embeds");

  // Step 1: a frame that appears late.
  await page.getByRole("button", { name: "Open chat" }).click();
  const chat = page.getByTitle("Support chat").contentFrame();
  await chat.getByLabel("Message").fill("Hi");
  await chat.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText("Agent: Thanks, we got \"Hi\"")).toBeVisible();

  // Step 2: a frame that navigates, and a frame that talks to the page.
  const checkoutFrame = page.getByTitle("Checkout").contentFrame();
  const checkout = page.frame({ name: "checkout" })!;
  await checkoutFrame.getByRole("button", { name: "Continue to shipping" }).click();
  await expect.poll(() => checkout.url()).toContain("step=2");
  await expect(page).toHaveURL(/\/frames\/embeds$/);
  await checkoutFrame.getByRole("button", { name: "Continue to payment" }).click();
  await checkoutFrame.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByText("Order 1042 confirmed", { exact: true })).toBeVisible();

  // Step 3: a dialog from inside a frame reaches page.on('dialog').
  const messages: string[] = [];
  page.on("dialog", async (dialog) => {
    messages.push(dialog.message());
    await dialog.accept();
  });
  const account = page.getByTitle("Account settings").contentFrame();
  await account.getByRole("button", { name: "Delete account" }).click();
  await expect(account.getByRole("status")).toHaveText("Account deleted");
  expect(messages).toEqual(["Delete your account? This cannot be undone."]);

  // Step 4: a sandboxed frame.
  const rating = page.getByTitle("Rating widget").contentFrame();
  await rating.getByRole("button", { name: "4 stars" }).click();
  await expect(page.getByTestId("rating-result")).toHaveText("You rated 4 out of 5");
  await expect(page.getByTestId("rating-access")).toHaveText("blocked");

  // Step 5: the mocked weather frame.
  await expect(page.getByTitle("Weather").contentFrame().getByText("-5°C, snow")).toBeVisible();
});
