import { test, expect } from "@playwright/test";

test("session countdown with a fake clock", async ({ page }) => {
  // Install the fake clock before the page loads.
  await page.clock.install();
  await page.goto("/dynamic/clock");

  const countdown = page.getByTestId("session-countdown");

  await page.getByRole("button", { name: "Start session" }).click();
  await expect(countdown).toHaveText("2:00");

  await page.clock.fastForward("01:30");
  await expect(countdown).toHaveText("0:30");

  await page.clock.fastForward("00:30");
  await expect(page.getByRole("alert")).toHaveText(/Session expired/);
  await expect(countdown).toHaveCount(0);
});

test("session countdown with runFor", async ({ page }) => {
  await page.clock.install();
  await page.goto("/dynamic/clock");

  await page.getByRole("button", { name: "Start session" }).click();
  // runFor() fires every timer tick, one by one.
  await page.clock.runFor(5000);
  await expect(page.getByTestId("session-countdown")).toHaveText("1:55");
});

test("weekend promotion on a Saturday", async ({ page }) => {
  // 10 October 2026 is a Saturday.
  await page.clock.setFixedTime(new Date("2026-10-10T10:00:00"));
  await page.goto("/dynamic/clock");

  await expect(page.getByTestId("promo-banner")).toHaveText(/Weekend sale/);
  await expect(page.locator("time")).toHaveText(/^Saturday,? 10 October 2026$/);
});

test("no promotion on a Monday", async ({ page }) => {
  // 12 October 2026 is a Monday.
  await page.clock.setFixedTime(new Date("2026-10-12T10:00:00"));
  await page.goto("/dynamic/clock");

  await expect(page.getByTestId("promo-banner")).toHaveText(/No promotion today/);
  await expect(page.locator("time")).toHaveText(/^Monday,? 12 October 2026$/);
});
