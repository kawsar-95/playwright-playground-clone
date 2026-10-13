import { stripVTControlCharacters } from "node:util";
import { test, expect } from "@playwright/test";

// The lesson on this page gives five tests that fail. This file shows both sides of each test:
//   - the BROKEN version, as the lesson gives it. The test runs it and expects it to reject with
//     the error message that you must learn to read. So this spec passes, and it still proves
//     that the original test fails for that reason.
//   - the FIXED version. It does what a user does and it passes.
// A short action timeout makes the broken tests fail fast. (A real run would use --timeout 10000.)
test.use({ actionTimeout: 3_000 });

test.beforeEach(async ({ page }) => {
  await page.goto("/debugging/failures");
});

test.describe("1. strict mode violation", () => {
  test("broken: the locator matches two buttons", async ({ page }) => {
    const broken = async () => {
      await page.getByLabel("Display name").fill("Ada");
      await page.getByRole("button", { name: "Save" }).click();
    };
    // The error lists both matches: the toolbar button and the form button.
    await expect(broken()).rejects.toThrow(/strict mode violation: getByRole\('button', \{ name: 'Save' \}\) resolved to 2 elements/);
  });

  test("fixed: scope the button to the Profile form", async ({ page }) => {
    await page.getByLabel("Display name").fill("Ada");
    await page.getByRole("form", { name: "Profile" }).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();
  });
});

test.describe("2. the click waits for an element that is not enabled", () => {
  test("broken: Export is disabled until the box is checked", async ({ page }) => {
    const broken = async () => {
      await page.getByRole("button", { name: "Export" }).click();
    };
    // The call log says: "element is not enabled" and "retrying click action".
    await expect(broken()).rejects.toThrow(/element is not enabled/);
  });

  test("fixed: accept the terms first", async ({ page }) => {
    await page.getByLabel("I understand the export includes personal data").check();
    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.getByText("Export started")).toBeVisible();
  });
});

test.describe("3. another element intercepts the click", () => {
  test("broken: the promo ribbon covers the button", async ({ page }) => {
    const broken = async () => {
      await page.getByRole("button", { name: "Continue" }).click();
    };
    // The call log names the element that receives the click instead.
    await expect(broken()).rejects.toThrow(/promo-ribbon.*intercepts pointer events/s);
  });

  test("fixed: dismiss the ribbon first", async ({ page }) => {
    await page.getByRole("button", { name: "Dismiss" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("You continued")).toBeVisible();
  });
});

test.describe("4. expected text and received text are different", () => {
  test("broken: CSS shows PAID, but the text in the page is Paid", async ({ page }) => {
    const broken = async () => {
      await expect(page.getByTestId("invoice-status")).toHaveText("PAID", { timeout: 1_000 });
    };
    // The error shows Expected: "PAID" and Received: "Paid". CSS text-transform changes only the look.
    // Playwright colours parts of the message, so remove the colour codes before the check.
    const message = stripVTControlCharacters(await broken().then(() => "", (error: Error) => error.message));
    expect(message).toContain('Expected: "PAID"');
    expect(message).toContain('Received: "Paid"');
  });

  test("fixed: assert the text of the DOM", async ({ page }) => {
    await expect(page.getByTestId("invoice-status")).toHaveText("Paid");
    // Or ignore the case: toHaveText(/paid/i)
    await expect(page.getByTestId("invoice-status")).toHaveText(/paid/i);
  });
});

test.describe("5. the locator is right, but the page is too slow", () => {
  test("broken: the list does not exist yet", async ({ page }) => {
    const broken = async () => {
      await page.getByRole("button", { name: "Load results" }).click();
      await expect(page.getByRole("list", { name: "Results" })).toBeVisible({ timeout: 1_000 });
    };
    // "element(s) not found" and the error context shows "Loading results…": the locator is right.
    await expect(broken()).rejects.toThrow(/element\(s\) not found/);
  });

  test("fixed: wait longer than the 6 s search", async ({ page }) => {
    await page.getByRole("button", { name: "Load results" }).click();
    await expect(page.getByText("Loading results…")).toBeVisible();
    await expect(page.getByRole("list", { name: "Results" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("list", { name: "Results" }).getByRole("listitem")).toHaveText([
      "Getting started with Playwright",
      "Writing your first test",
      "Locators in depth",
    ]);
  });
});
