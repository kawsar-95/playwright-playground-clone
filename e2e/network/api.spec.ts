import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/network/api");
});

test("GET Users shows one row for each user in the response", async ({ page }) => {
  const responsePromise = page.waitForResponse("**/api/users");
  await page.getByRole("button", { name: "GET Users" }).click();
  const response = await responsePromise;

  expect(response.status()).toBe(200);
  const body = (await response.json()) as { users: { firstName: string }[] };

  // One row for each user, plus the header row.
  await expect(page.getByRole("row")).toHaveCount(body.users.length + 1);
  await expect(page.getByRole("cell", { name: "John", exact: true })).toBeVisible();
});

test("GET Missing User shows a 404", async ({ page }) => {
  const responsePromise = page.waitForResponse("**/api/users/999");
  await page.getByRole("button", { name: "GET Missing User" }).click();
  const response = await responsePromise;

  expect(response.status()).toBe(404);
  await expect(page.getByTestId("api-status")).toHaveText("HTTP Status: 404");
  await expect(page.getByTestId("api-response")).toContainText("User not found");
});

test("the create form sends the exact JSON body", async ({ page, request }) => {
  const firstName = `Eve${Date.now()}`;
  const requestPromise = page.waitForRequest(
    (req) => req.method() === "POST" && req.url().endsWith("/api/users"),
  );
  const responsePromise = page.waitForResponse(
    (res) => res.request().method() === "POST" && res.url().endsWith("/api/users"),
  );

  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill("Adams");
  await page.getByLabel("Role").selectOption("Manager");
  await page.getByRole("button", { name: "Create user" }).click();

  const sent = await requestPromise;
  expect(sent.postDataJSON()).toEqual({ firstName, lastName: "Adams", role: "Manager" });

  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const user = (await response.json()) as { id: number };
  await expect(page.getByTestId("api-status")).toHaveText("HTTP Status: 201");
  await expect(page.getByTestId("api-response")).toContainText(firstName);

  // The form is empty again after a successful create.
  await expect(page.getByLabel("First name")).toHaveValue("");

  // Leave the API as you found it.
  await request.delete(`/api/users/${user.id}`);
});

test("empty names are rejected with a 400 and the page shows the error", async ({ page }) => {
  const responsePromise = page.waitForResponse(
    (res) => res.request().method() === "POST" && res.url().endsWith("/api/users"),
  );
  await page.getByRole("button", { name: "Create user" }).click();
  const response = await responsePromise;

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "firstName is required" });
  await expect(page.getByTestId("api-status")).toHaveText("HTTP Status: 400");
  await expect(page.getByTestId("api-response")).toContainText("firstName is required");
});

test("the delayed request shows a loading state", async ({ page }) => {
  await page.getByRole("button", { name: "GET Products — 2s Delay" }).click();

  await expect(page.getByTestId("api-loading")).toBeVisible();
  await expect(page.getByTestId("api-loading")).toBeHidden();
  await expect(page.getByTestId("api-status")).toHaveText("HTTP Status: 200");
  await expect(page.getByTestId("api-response")).toContainText("Laptop");
});

test("HTTP error buttons show the status they request", async ({ page }) => {
  for (const code of [400, 404, 500]) {
    await page.getByRole("button", { name: `HTTP ${code}` }).click();
    await expect(page.getByTestId("api-status")).toHaveText(`HTTP Status: ${code}`);
  }
});
