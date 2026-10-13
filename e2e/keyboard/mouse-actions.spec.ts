import { test, expect } from "@playwright/test";

test("Mouse Actions", async ({ page }) => {
  await page.goto("/keyboard/mouse-actions");

  // Step 1: clicks with modifier keys.
  const files = page.getByRole("listbox", { name: "Files" });
  await files.getByRole("option", { name: "budget.xlsx" }).click();
  await files.getByRole("option", { name: "notes.txt" }).click({ modifiers: ["Shift"] });
  await expect(page.getByText("4 selected: budget.xlsx, contract.pdf, logo.png, notes.txt")).toBeVisible();
  await files.getByRole("option", { name: "logo.png" }).click({ modifiers: ["ControlOrMeta"] });
  await expect(page.getByText("3 selected: budget.xlsx, contract.pdf, notes.txt")).toBeVisible();

  // Step 2: click positions on a canvas. Seat centre: x = 50n - 10, y = 50r - 10.
  const map = page.getByRole("img", { name: "Seat map" });
  await map.click({ position: { x: 140, y: 90 } }); // B3
  await map.click({ position: { x: 290, y: 190 } }); // D6
  await expect(page.getByText("Selected seats: B3, D6")).toBeVisible();
  await map.click({ position: { x: 40, y: 40 } }); // A1 is taken
  await expect(page.getByRole("alert")).toHaveText("Seat A1 is taken");

  // Step 3: draw on the signature pad.
  const pad = page.getByRole("img", { name: "Signature pad" });
  await pad.scrollIntoViewIfNeeded();
  const box = (await pad.boundingBox())!;
  const status = page.getByTestId("signature-status");
  await page.mouse.move(box.x + 20, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 60, { steps: 5 });
  await page.mouse.up();
  await expect(status).toHaveText("Signature too short. Draw a longer line.");
  await page.getByRole("button", { name: "Clear signature" }).click();
  await expect(status).toHaveText("Signature: empty");
  await page.mouse.move(box.x + 20, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 250, box.y + 80, { steps: 10 });
  await page.mouse.up();
  await expect(status).toHaveText("Signature accepted");

  // Step 4: the wheel.
  const zoomBox = page.getByTestId("zoom-box");
  await zoomBox.scrollIntoViewIfNeeded();
  await zoomBox.hover();
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -100);
  await expect(page.getByText("Zoom: 130%", { exact: true })).toBeVisible();
  for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 100);
  await expect(page.getByText("Zoom: 50%", { exact: true })).toBeVisible();

  // Step 5: drag the slider to 80% of the track width.
  const thumb = page.getByRole("slider", { name: "Volume" });
  await thumb.scrollIntoViewIfNeeded();
  const thumbBox = (await thumb.boundingBox())!;
  const trackBox = (await page.locator(".slider-track").boundingBox())!;
  await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(trackBox.x + trackBox.width * 0.8, thumbBox.y + thumbBox.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(thumb).toHaveAttribute("aria-valuenow", "80");
  await thumb.press("ArrowLeft");
  await expect(thumb).toHaveAttribute("aria-valuenow", "70");
});
