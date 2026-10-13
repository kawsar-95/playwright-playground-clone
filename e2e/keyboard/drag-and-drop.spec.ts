import { test, expect } from "@playwright/test";

const INITIAL = ["Write tests", "Review PR", "Fix flaky test", "Update docs", "Deploy"];

test.beforeEach(async ({ page }) => {
  await page.goto("/keyboard/drag-and-drop");
});

test("built-in drag and drop with dragTo()", async ({ page }) => {
  await page.getByTestId("drag-source").dragTo(page.getByTestId("drop-target"));
  await expect(page.getByTestId("drop-target")).toHaveText("Element dropped!");
  await expect(page.getByTestId("drag-drop-result")).toHaveText("Drag and drop completed");
});

test("sortable list: dragTo() fails, stepped mouse moves work", async ({ page }) => {
  const list = page.getByRole("list", { name: "Priorities" });
  const items = list.getByRole("listitem");

  // dragTo() jumps in one move, so the list never sees where the pointer goes.
  await list.getByRole("button", { name: "Reorder Deploy" }).dragTo(items.first());
  await expect(items).toHaveText(INITIAL);

  // Drive the mouse in steps.
  await list.getByRole("button", { name: "Reorder Deploy" }).hover();
  await page.mouse.down();
  const box = (await items.first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(items).toHaveText(["Deploy", "Write tests", "Review PR", "Fix flaky test", "Update docs"]);
  await expect(page.getByTestId("sortable-status")).toHaveText("Moved Deploy to position 1");
});

test("sortable list with the keyboard", async ({ page }) => {
  const list = page.getByRole("list", { name: "Priorities" });
  const handle = list.getByRole("button", { name: "Reorder Write tests" });
  await handle.press("Space");
  await handle.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(list.getByRole("listitem")).toHaveText([
    "Review PR",
    "Fix flaky test",
    "Write tests",
    "Update docs",
    "Deploy",
  ]);
  await expect(page.getByTestId("sortable-status")).toHaveText("Dropped Write tests at position 3");
});

test("kanban board", async ({ page }) => {
  const todo = page.getByRole("region", { name: /To do/ });
  const done = page.getByRole("region", { name: /Done/ });
  await expect(todo.getByRole("heading")).toHaveText("To do (2)");
  await expect(done.getByRole("heading")).toHaveText("Done (1)");

  await page.getByText("Write release notes", { exact: true }).dragTo(done);
  await expect(done.getByText("Write release notes")).toBeVisible();
  await expect(todo.getByRole("heading")).toHaveText("To do (1)");
  await expect(done.getByRole("heading")).toHaveText("Done (2)");
  await expect(page.getByText("Moved Write release notes to Done")).toBeVisible();
});
