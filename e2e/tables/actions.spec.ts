import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tables/actions");
});

test("edits an email: shows an error for an invalid value, then saves a valid one", async ({ page }) => {
  const anna = page.getByRole("row").filter({ hasText: "Anna" });
  await anna.getByRole("button", { name: "Edit" }).click();

  // In edit mode the names are input values, so filter by the textbox the row contains.
  const editingRow = page.getByRole("row").filter({ has: page.getByRole("textbox", { name: "Email" }) });
  await editingRow.getByRole("textbox", { name: "Email" }).fill("not-an-email");
  await editingRow.getByRole("button", { name: "Save" }).click();
  await expect(editingRow.getByRole("alert")).toHaveText("Enter a valid email address.");

  await editingRow.getByRole("textbox", { name: "Email" }).fill("anna@test.dev");
  await editingRow.getByRole("button", { name: "Save" }).click();

  await expect(page.getByTestId("table-action-result")).toHaveText("Updated Anna Kowalski successfully.");
  await expect(page.getByRole("row").filter({ hasText: "Anna" })).toContainText("anna@test.dev");
});

test("Escape leaves edit mode and changes nothing", async ({ page }) => {
  const john = page.getByRole("row").filter({ hasText: "John" });
  await john.getByRole("button", { name: "Edit" }).click();

  const editingRow = page.getByRole("row").filter({ has: page.getByRole("textbox", { name: "First Name" }) });
  await editingRow.getByRole("textbox", { name: "First Name" }).fill("Changed");
  await editingRow.getByRole("textbox", { name: "First Name" }).press("Escape");

  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByTestId("table-action-result")).toHaveText("Edit cancelled.");
  await expect(page.getByRole("row").filter({ hasText: "John" })).toContainText("john@example.com");
  await expect(page.getByRole("row").filter({ hasText: "Changed" })).toHaveCount(0);
});

test("deletes Sarah after a confirmation", async ({ page }) => {
  const body = page.locator("tbody");
  const sarah = body.getByRole("row").filter({ hasText: "Sarah" });

  await sarah.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByTestId("table-action-result")).toHaveText("Delete Sarah Wilson?");
  await sarah.getByRole("button", { name: "Yes, delete" }).click();

  await expect(sarah).toHaveCount(0);
  await expect(body.getByRole("row")).toHaveCount(3);
  await expect(page.getByTestId("table-action-result")).toHaveText("Sarah Wilson was deleted.");
});

test("keeps Michael when the delete is declined", async ({ page }) => {
  const michael = page.getByRole("row").filter({ hasText: "Michael" });

  await michael.getByRole("button", { name: "Delete" }).click();
  await michael.getByRole("button", { name: "Keep" }).click();

  await expect(michael).toBeVisible();
  await expect(michael.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.locator("tbody").getByRole("row")).toHaveCount(4);
  await expect(page.getByTestId("table-action-result")).toHaveText("Michael Brown was kept.");
});

test("shows a message when every user is deleted", async ({ page }) => {
  const body = page.locator("tbody");

  for (const name of ["John", "Anna", "Michael", "Sarah"]) {
    const row = body.getByRole("row").filter({ hasText: name });
    await row.getByRole("button", { name: "Delete" }).click();
    await row.getByRole("button", { name: "Yes, delete" }).click();
    await expect(row).toHaveCount(0);
  }

  await expect(body.getByRole("row")).toHaveCount(1);
  await expect(body.getByRole("row")).toHaveText("No users left. Add one below.");
});

test("adds a user and validates an empty form", async ({ page }) => {
  await page.getByRole("button", { name: "Add user" }).click();

  const form = page.getByRole("form", { name: "New user" });
  await form.getByRole("button", { name: "Create" }).click();
  await expect(form.getByRole("alert")).toHaveText([
    "First name is required.",
    "Last name is required.",
    "Email is required.",
  ]);
  await expect(page.locator("tbody").getByRole("row")).toHaveCount(4);

  await form.getByLabel("First name").fill("Zoe");
  await form.getByLabel("Last name").fill("Adams");
  await form.getByLabel("Email").fill("zoe@example.com");
  await form.getByRole("button", { name: "Create" }).click();

  await expect(form).toBeHidden();
  const zoe = page.getByRole("row").filter({ hasText: "Zoe" });
  await expect(zoe).toContainText("Adams");
  await expect(zoe).toContainText("zoe@example.com");
  await expect(page.locator("tbody").getByRole("row")).toHaveCount(5);
  await expect(page.getByTestId("table-action-result")).toHaveText("Added Zoe Adams.");
});
