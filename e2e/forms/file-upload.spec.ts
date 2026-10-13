import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// A 1x1 transparent PNG.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHb2GRwAAAABJRU5ErkJggg==",
  "base64",
);

test("a file from disk shows its name", async ({ page }, testInfo) => {
  const filePath = testInfo.outputPath("report.txt");
  await writeFile(filePath, "quarterly numbers");
  await page.goto("/forms/file-upload");

  await page.getByLabel("Choose file").setInputFiles(filePath);
  await expect(page.getByTestId("uploaded-file")).toHaveText("Selected file: report.txt");

  await page.getByLabel("Choose file").setInputFiles([]);
  await expect(page.getByTestId("uploaded-file")).toHaveCount(0);
});

test("a small PNG shows a preview", async ({ page }) => {
  await page.goto("/forms/file-upload");
  await page.getByLabel("Profile photo").setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: TINY_PNG });

  await expect(page.getByRole("img", { name: "Preview of avatar.png" })).toBeVisible();
  await page.getByRole("button", { name: "Remove photo" }).click();
  await expect(page.getByRole("img", { name: "Preview of avatar.png" })).toHaveCount(0);
});

test("a GIF and a large PNG are rejected", async ({ page }) => {
  await page.goto("/forms/file-upload");
  const photo = page.getByLabel("Profile photo");

  await photo.setInputFiles({ name: "party.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
  await expect(page.getByRole("alert")).toHaveText("party.gif is not a PNG or JPEG image.");

  await photo.setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024) });
  await expect(page.getByRole("alert")).toHaveText("huge.png is 2.0 MB. The limit is 1 MB.");
});

test("attachments are added, dropped and uploaded", async ({ page }) => {
  await page.goto("/forms/file-upload");

  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Add files" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.alloc(1000, "a") },
    { name: "data.csv", mimeType: "text/csv", buffer: Buffer.alloc(2000, "b") },
  ]);
  await expect(page.getByRole("listitem").filter({ hasText: "notes.txt" })).toBeVisible();
  await expect(page.getByTestId("attachment-summary")).toHaveText("2 files · 2.9 KB");

  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["hello"], "hello.txt", { type: "text/plain" }));
    return transfer;
  });
  await page.getByText("Drop files here").dispatchEvent("drop", { dataTransfer });

  await expect(page.getByRole("list", { name: "Attachments" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByTestId("attachment-summary")).toHaveText("3 files · 2.9 KB");

  const responsePromise = page.waitForResponse("**/api/upload");
  await page.getByRole("button", { name: "Upload" }).click();
  const response = await responsePromise;

  expect(response.ok()).toBe(true);
  await expect(page.getByRole("status")).toHaveText("Uploaded 3 files (3,005 bytes)");
  await expect(page.getByTestId("attachment-summary")).toHaveCount(0);
});

test("a file can be removed from the attachments", async ({ page }) => {
  await page.goto("/forms/file-upload");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Add files" }).click();
  await (await chooserPromise).setFiles([{ name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("a") }]);

  await expect(page.getByTestId("attachment-summary")).toHaveText("1 file · 1 B");
  await page.getByRole("button", { name: "Remove a.txt" }).click();
  await expect(page.getByTestId("attachment-summary")).toHaveCount(0);
});
