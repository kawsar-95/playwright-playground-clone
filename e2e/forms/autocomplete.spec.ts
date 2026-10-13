import { test, expect } from "@playwright/test";

test.describe("Country search", () => {
  test("typing filters the countries", async ({ page }) => {
    await page.goto("/forms/autocomplete");
    await page.getByRole("combobox", { name: "Country" }).fill("united");

    await expect(page.getByRole("option")).toHaveText(["United Kingdom", "United States"]);
  });

  test("a click on an option selects it", async ({ page }) => {
    await page.goto("/forms/autocomplete");
    await page.getByRole("combobox", { name: "Country" }).fill("united");
    await page.getByRole("option", { name: "United Kingdom" }).click();

    await expect(page.getByTestId("selected-country")).toHaveText("Selected country: United Kingdom");
    await expect(page.getByRole("combobox", { name: "Country" })).toHaveValue("United Kingdom");
    await expect(page.getByRole("option")).toHaveCount(0);
  });

  test("the arrow keys and Enter select an option", async ({ page }) => {
    await page.goto("/forms/autocomplete");
    const country = page.getByRole("combobox", { name: "Country" });
    await country.fill("swe");
    await country.press("ArrowDown");
    await expect(page.getByRole("option", { name: "Sweden" })).toHaveAttribute("aria-selected", "true");
    await country.press("Enter");

    await expect(page.getByTestId("selected-country")).toHaveText("Selected country: Sweden");
  });

  test("a search without a match shows a message and no options", async ({ page }) => {
    await page.goto("/forms/autocomplete");
    await page.getByRole("combobox", { name: "Country" }).fill("zzz");

    await expect(page.getByText("No matching countries")).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(0);
  });
});

test.describe("City search", () => {
  test("the user picks the right city from a repeated name", async ({ page }) => {
    await page.goto("/forms/autocomplete");
    await page.getByRole("combobox", { name: "City" }).fill("paris");
    await page.getByRole("option", { name: "Paris, France", exact: true }).click();

    await expect(page.getByTestId("selected-city")).toHaveText("Selected city: Paris, France");
  });

  test("the debounce sends one request for fast typing", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/cities")) requests.push(request.url());
    });
    await page.goto("/forms/autocomplete");

    await page.getByRole("combobox", { name: "City" }).pressSequentially("london");
    await expect(page.getByRole("option").first()).toBeVisible();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain("search=london");
  });

  test("an error shows a message and Retry loads the cities", async ({ page }) => {
    await page.route("**/api/cities?*", (route) => route.fulfill({ status: 500 }));
    await page.goto("/forms/autocomplete");
    await page.getByRole("combobox", { name: "City" }).fill("par");

    await expect(page.getByRole("alert")).toContainText("Couldn't load suggestions");

    await page.unroute("**/api/cities?*");
    await page.route("**/api/cities?*", (route) => route.fulfill({ json: { cities: ["Paris, France", "Parma, Italy"] } }));
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByRole("option")).toHaveText(["Paris, France", "Parma, Italy"]);
  });
});
