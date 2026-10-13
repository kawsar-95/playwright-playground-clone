import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/dynamic/progress-bar");
});

test("progress runs to 100% and completes", async ({ page }) => {
  const bar = page.getByRole("progressbar", { name: "Upload progress" });
  const start = page.getByRole("button", { name: "Start progress" });

  await start.click();
  await expect(start).toBeDisabled();

  // 20 steps of 200 ms is about 4 s, which is shorter than the default timeout.
  await expect(bar).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByTestId("progress-value")).toHaveText("100%");
  await expect(page.getByTestId("progress-result")).toHaveText("Completed");
  await expect(start).toBeEnabled();
});

test("stop the bar at 70% or more", async ({ page }) => {
  const bar = page.getByRole("progressbar", { name: "Upload progress" });

  await page.getByRole("button", { name: "Start progress" }).click();

  // Poll with a short interval. The default intervals are slow, and the bar could pass 70%.
  await expect
    .poll(async () => Number(await bar.getAttribute("aria-valuenow")), { intervals: [50] })
    .toBeGreaterThanOrEqual(70);

  await page.getByRole("button", { name: "Stop" }).click();

  const result = page.getByTestId("progress-result");
  await expect(result).toHaveText(/^Stopped at \d+%$/);
  const stoppedAt = Number((await result.textContent())!.match(/\d+/)![0]);
  expect(stoppedAt).toBeGreaterThanOrEqual(70);
  expect(stoppedAt).toBeLessThanOrEqual(95);
  await expect(bar).toHaveAttribute("aria-valuenow", String(stoppedAt));
});
