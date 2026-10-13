import { test, expect } from "@playwright/test";

// A trace shows why this test fails. Run it with:  npx playwright test trace --trace on
// Then open it with:  npx playwright show-trace test-results/<test-folder>/trace.zip
//
// The first test is the test that a learner writes first. It fails because the app has a bug that
// only a fast robot hits: the page sends the total before the shipping cost is loaded.
// test.fail() tells Playwright that this failure is expected, so this spec file passes.
// Remove test.fail() when you want to see the real failure and its trace.
test.fail("pays immediately (fails: the total is wrong)", async ({ page }) => {
  await page.goto("/debugging/trace");
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByText("Payment received")).toBeVisible();
});

test("the failed request shows the bug", async ({ page }) => {
  // What the trace shows in the network tab and in the console tab.
  const paymentResponse = page.waitForResponse((response) => response.url().endsWith("/api/checkout/pay"));
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/debugging/trace");
  await page.getByRole("button", { name: "Pay now" }).click();
  const response = await paymentResponse;

  expect(response.status()).toBe(422); // the status of the failed request
  expect(response.request().postDataJSON()).toEqual({ total: 40 }); // the subtotal only, no shipping
  expect(await response.headerValue("x-request-id")).toMatch(/^req_[a-z0-9]+$/i);
  await expect(page.getByRole("alert")).toHaveText("Payment failed. Please try again.");
  expect(errors).toContain("[checkout] payment rejected (TOTAL_MISMATCH)");
});

test("pays after the real total is known", async ({ page }) => {
  await page.goto("/debugging/trace");

  // The shipping request takes about 1.5 s. Wait until the page shows the real total.
  await expect(page.getByText("Calculating…")).toBeHidden();
  await expect(page.getByTestId("checkout-total")).not.toHaveText("$40.00");

  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page.getByRole("status")).toHaveText(/Payment received\. Order .+\./);
  await expect(page.getByRole("status")).toContainText(/Order \S+\./);
});

test("pays after waiting for the shipping response", async ({ page }) => {
  // Another way: wait for the response of the slow request, not for the text.
  const shipping = page.waitForResponse("**/api/checkout/shipping");
  await page.goto("/debugging/trace");
  await shipping;
  await expect(page.getByRole("button", { name: "Pay now" })).toBeEnabled();
  await expect(page.getByText("Calculating…")).toBeHidden();

  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByRole("status")).toContainText("Payment received");
});

test("answers the bug report on the page", async ({ page }) => {
  await page.goto("/debugging/trace");
  const paymentResponse = page.waitForResponse("**/api/checkout/pay");
  await page.getByRole("button", { name: "Pay now" }).click();
  const requestId = await (await paymentResponse).headerValue("x-request-id");
  expect(requestId).toBeTruthy();

  const report = page.getByRole("form", { name: "Bug report" });
  await report.getByLabel("HTTP status of the failed payment request").fill("422");
  await report.getByLabel("Amount the page sent in that request").fill("40");
  await report.getByLabel("X-Request-Id of the failed request").fill(requestId ?? "");
  await report.getByLabel("Error code the app logged to the console").fill("TOTAL_MISMATCH");
  await report.getByRole("button", { name: "Check answers" }).click();

  await expect(report.getByRole("status")).toContainText("4 of 4 correct.");
  await expect(report.getByRole("status")).toContainText("Bug found.");
});
