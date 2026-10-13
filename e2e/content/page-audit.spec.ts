import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/content/page-audit");
});

/** All links to the same site inside <main>. External links are not checked. */
async function localHrefs(page: Page): Promise<string[]> {
  return page.locator('main a[href^="/"]').evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
}

test("has a title, a meta description and a language", async ({ page }) => {
  await expect(page).toHaveTitle("Page Audit · QA Playground");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /audit/i);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("finds the image without alt text", async ({ page }) => {
  // alt="" is fine for a decorative image. A missing alt attribute is the bug.
  const missingAlt = page.locator("main img:not([alt])");
  await expect(missingAlt).toHaveCount(1);
  await expect(missingAlt).toHaveAttribute("src", "/favicon.svg");
});

test("finds the broken image", async ({ page }) => {
  const images = page.locator("main img");

  // A broken image is still visible as an element. First wait until all images finished loading.
  await expect.poll(() => images.evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).complete))).toBe(true);

  const broken = await images.evaluateAll((imgs) =>
    (imgs as HTMLImageElement[]).filter((img) => img.naturalWidth === 0).map((img) => img.getAttribute("src")),
  );
  expect(broken).toEqual(["/images/team-photo.png"]);
});

// The page has one broken link: /api/docs. A soft assertion reports it and the test goes on to
// check the other links. The soft assertion records a failure, so the test is expected to fail.
// test.fail() marks that as the right result. If the broken link is fixed one day, this test
// passes, Playwright reports an unexpected pass, and you know to remove test.fail().
test.fail("reports every broken link with expect.soft()", async ({ page, request }) => {
  for (const href of await localHrefs(page)) {
    const response = await request.get(href);
    expect.soft(response.status(), `GET ${href}`).toBeLessThan(400);
  }
});

test("lists the broken links", async ({ page, request }) => {
  const broken: string[] = [];
  for (const href of await localHrefs(page)) {
    const response = await request.get(href);
    if (response.status() >= 400) broken.push(href);
  }
  expect(broken).toEqual(["/api/docs"]);
});

test("finds the new-tab link without rel=noopener", async ({ page }) => {
  const unsafe = page.locator('main a[target="_blank"]:not([rel~="noopener"])');
  await expect(unsafe).toHaveCount(1);
  await expect(unsafe).toHaveText("Community forum");
});

test("finds the skipped heading level", async ({ page }) => {
  const levels = await page
    .getByTestId("release-notes")
    .getByRole("heading")
    .evaluateAll((headings) => headings.map((h) => Number(h.tagName[1])));
  expect(levels).toEqual([3, 4, 3, 5]);

  // A jump of more than one level is a skip. Level 3 to level 5 skips level 4.
  const skips = levels.filter((level, i) => i > 0 && level - levels[i - 1] > 1);
  expect(skips).toEqual([5]);
});
