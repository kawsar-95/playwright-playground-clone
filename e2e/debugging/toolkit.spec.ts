import { test as base, expect } from "@playwright/test";

// A fixture with { auto: true } runs for every test that uses `test`, even when the test does not
// ask for it. It fails the test when the page throws an uncaught error.
const test = base.extend<{ failOnPageErrors: void }>({
  failOnPageErrors: [
    async ({ page }, use) => {
      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));
      await use();
      // An error can be thrown from a timer, after the screen has changed. Wait 50 ms in the page.
      // Events arrive in order, so the pageerror event is here before this call returns.
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(errors, "the page threw errors").toEqual([]);
    },
    { auto: true },
  ],
});

// This test uses a fixture of its own that does NOT fail on page errors. It shows what the page does.
// The other tests use the plain `base` test, so they do not stop on the page error that they collect.
const observed = base;

observed.beforeEach(async ({ page }) => {
  await page.goto("/debugging/toolkit");
});

observed("the happy path passes, but it misses the errors", async ({ page }) => {
  await page.getByLabel("Note title").fill("Milk");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByRole("button", { name: "Sync" }).click();

  // This passes. The screen says the sync worked.
  await expect(page.getByRole("status")).toHaveText("All notes synced");
});

observed("collects the console messages and the page errors", async ({ page }, testInfo) => {
  const consoleLog: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => consoleLog.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await observed.step("Add notes", async () => {
    for (const title of ["Milk", "Eggs"]) {
      await page.getByLabel("Note title").fill(title);
      await page.getByRole("button", { name: "Add note" }).click();
    }
    // An untitled note: a click without text.
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).toHaveCount(5);
    await expect(page.getByText("Untitled", { exact: true })).toBeVisible();
  });

  await observed.step("Sync", async () => {
    await page.getByRole("button", { name: "Sync" }).click();
    await expect(page.getByRole("status")).toHaveText("All notes synced");
    // The page error is thrown after the screen updates. Wait for it, do not guess.
    await expect.poll(() => pageErrors.length).toBeGreaterThan(0);
  });

  await testInfo.attach("console", { body: consoleLog.join("\n"), contentType: "text/plain" });

  // The answers to the three questions on the page.
  expect(consoleLog).toContain("warning: [sync] Using the legacy sync endpoint");
  expect(consoleLog).toContain("error: [sync] Free plan limit reached: only 3 notes were synced");
  expect(pageErrors).toEqual(["Cannot read properties of undefined (reading 'trim')"]);

  await observed.step("Answer the questions", async () => {
    const form = page.getByRole("form", { name: "What really happened?" });
    await form.getByLabel("Free plan sync limit").fill("3");
    await form.getByLabel("Which property was the sync code reading when it crashed?").fill("trim");
    await form.getByLabel("Which endpoint does the warning say the app uses?").fill("legacy");
    await form.getByRole("button", { name: "Check answers" }).click();
    await expect(form.getByRole("status")).toContainText("3 of 3 correct.");
  });
});

test("the automatic fixture passes when the page does not throw", async ({ page }) => {
  await page.goto("/debugging/toolkit");
  await page.getByRole("button", { name: "Sync" }).click();
  await expect(page.getByRole("status")).toHaveText("All notes synced");
});

// The automatic fixture makes this test fail, because the untitled note makes the page throw.
// test.fail() says that this is the expected result, so the spec file passes. The test has no
// code that checks for errors: the fixture does it for us.
test.fail("the automatic fixture fails a test when the page throws", async ({ page }) => {
  await page.goto("/debugging/toolkit");
  await page.getByRole("button", { name: "Add note" }).click(); // an untitled note
  await page.getByRole("button", { name: "Sync" }).click();
  await expect(page.getByRole("status")).toHaveText("All notes synced");
});

// To try the Inspector, add this line to a test and run it headed:
//   await page.pause();
// To record the same flow:  npx playwright codegen http://127.0.0.1:5173/debugging/toolkit
