import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/network/mocking");
});

test("shows mocked products only", async ({ page }) => {
  await page.route("**/api/products", (route) =>
    route.fulfill({
      json: {
        products: [
          { id: 98, name: "Mock Phone", price: 10 },
          { id: 99, name: "Mock Product", price: 1 },
        ],
      },
    }),
  );

  await page.getByRole("button", { name: "Load Products" }).click();

  await expect(page.getByRole("cell", { name: "Mock Product" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Mock Phone" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Laptop" })).toHaveCount(0);
  // Header row and two product rows.
  await expect(page.getByRole("row")).toHaveCount(3);
});

test("handles a 500 error and an aborted request", async ({ page }) => {
  await page.route("**/api/products", (route) => route.fulfill({ status: 500 }));
  await page.getByRole("button", { name: "Load Products" }).click();
  await expect(page.getByTestId("products-message")).toHaveText("Request failed with status 500");

  await page.unroute("**/api/products");
  await page.route("**/api/products", (route) => route.abort());
  await page.getByRole("button", { name: "Load Products" }).click();
  await expect(page.getByTestId("products-message")).toBeVisible();
  await expect(page.getByTestId("products-message")).not.toContainText("status 500");
  await expect(page.getByRole("button", { name: "Load Products" })).toBeEnabled();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("shows the loading state while a request is slow", async ({ page }) => {
  await page.route("**/api/products", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });

  await page.getByRole("button", { name: "Load Products" }).click();

  await expect(page.getByTestId("products-loading")).toHaveText("Loading products...");
  await expect(page.getByRole("button", { name: "Load Products" })).toBeDisabled();
  await expect(page.getByRole("cell", { name: "Laptop" })).toBeVisible();
  await expect(page.getByTestId("products-loading")).toBeHidden();
});

test("mocks only the search for phone", async ({ page }) => {
  await page.route(/\/api\/products\?search=phone/, (route) =>
    route.fulfill({ json: { products: [{ id: 50, name: "Mock Phone", price: 500 }] } }),
  );

  await page.getByLabel("Search products").fill("phone");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("cell", { name: "Mock Phone" })).toBeVisible();

  // Another search is not matched by the route, so it reaches the real API.
  await page.getByLabel("Search products").fill("mo");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("cell", { name: "Mouse" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Monitor" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Mock Phone" })).toHaveCount(0);
});

test("adds a product to the real search results with route.fetch()", async ({ page }) => {
  await page.route("**/api/products?*", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { products: { id: number; name: string; price: number }[] };
    body.products.push({ id: 100, name: "Injected Product", price: 1 });
    await route.fulfill({ response, json: body });
  });

  await page.getByLabel("Search products").fill("mo");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByRole("cell", { name: "Mouse" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Monitor" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Injected Product" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Search results" }).getByRole("row")).toHaveCount(4);
});

test("shows an empty search result", async ({ page }) => {
  await page.getByLabel("Search products").fill("zzz");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("No products found")).toBeVisible();
});

test("notifications fail once and the Retry button loads the real list", async ({ page }) => {
  await page.route("**/api/notifications", (route) => route.fulfill({ status: 503 }), { times: 1 });

  await page.getByRole("button", { name: "Load notifications" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not load notifications. Request failed with status 503");

  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.getByRole("alert")).toBeHidden();
  const list = page.getByRole("list", { name: "Notifications" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list).toContainText("Your test run finished: 42 passed");
});
