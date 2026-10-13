import { useEffect } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const DESCRIPTION = "Audit practice page: titles, meta tags, images, links and headings.";

export default function PageAudit() {
  // The page sets its own meta description. It restores the old one when the user leaves.
  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const meta = existing ?? document.head.appendChild(document.createElement("meta"));
    const previous = meta.content;
    meta.name = "description";
    meta.content = DESCRIPTION;
    return () => {
      if (existing) meta.content = previous;
      else meta.remove();
    };
  }, []);

  return (
    <>
      <PageHeader title="Page Audit">
        A page with a few deliberate problems. Write checks that find every one of them, as you would for a real release.
      </PageHeader>

      <Lesson title="Automated checks for a whole page">
        <h3>Title, meta tags and language</h3>
        <Code>{`
await expect(page).toHaveTitle('Page Audit · QA Playground');
await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /audit/i);
await expect(page.locator('html')).toHaveAttribute('lang', 'en');
`}</Code>
        <h3>Images without alt text</h3>
        <p>
          Each image needs an <code>alt</code> attribute. An empty <code>alt=""</code> is correct for a decorative image. A{" "}
          <em>missing</em> attribute is a bug.
        </p>
        <Code>{`
await expect(page.locator('main img:not([alt])')).toHaveCount(1);
`}</Code>
        <h3>Broken images</h3>
        <p>
          A broken image is still an element on the page, so <code>toBeVisible()</code> does not find it. First wait until all
          images finish loading. Then read <code>naturalWidth</code>. It is 0 when the browser could not show the file.
        </p>
        <Code>{`
const images = page.locator('main img');

await expect
  .poll(() => images.evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).complete)))
  .toBe(true);

const broken = await images.evaluateAll((imgs) =>
  (imgs as HTMLImageElement[])
    .filter((img) => img.naturalWidth === 0)
    .map((img) => img.getAttribute('src'))
);
expect(broken).toEqual(['/images/team-photo.png']);
`}</Code>
        <h3>Broken links</h3>
        <p>
          Collect each link to the same site. Request it with the <code>request</code> fixture. This needs no browser page. Use{" "}
          <code>expect.soft()</code>. A failed soft assertion does not stop the test, so the test reports all broken links at
          the end.
        </p>
        <Code>{`
test('links work', async ({ page, request }) => {
  await page.goto('/content/page-audit');

  const hrefs = await page
    .locator('main a[href^="/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')!));

  for (const href of hrefs) {
    const response = await request.get(href);
    expect.soft(response.status(), href).toBeLessThan(400);
  }
});
`}</Code>
        <p>Do not check external links in automated tests. Other sites are slow, they limit requests, and you do not control them.</p>
        <h3>Links that open a new tab without noopener</h3>
        <p>
          A link that opens a new tab needs <code>rel="noopener"</code>. If it has none, the new page can control the old page.
        </p>
        <Code>{`
await expect(page.locator('main a[target="_blank"]:not([rel~="noopener"])')).toHaveCount(1);
`}</Code>
        <h3>Skipped heading levels</h3>
        <p>
          Heading levels must go down one step at a time. Screen-reader users move through a page by headings. Read the levels
          and look for a jump.
        </p>
        <Code>{`
const levels = await page
  .getByTestId('release-notes')
  .getByRole('heading')
  .evaluateAll((headings) => headings.map((h) => Number(h.tagName[1])));

const skips = levels.filter((level, i) => i > 0 && level - levels[i - 1] > 1);
expect(skips).toEqual([5]);
`}</Code>
      </Lesson>

      <TestCard title="Images">
        <div className="audit-images">
          <img src="/favicon.svg" alt="QA Playground logo" />
          <img src="/icons.svg" alt="" />
          <img src="/favicon.svg" />
          <img src="/images/team-photo.png" alt="Team photo" />
        </div>
      </TestCard>

      <TestCard title="Links">
        <ul className="audit-links">
          <li>
            <a href="/downloads/sample-report.txt">Sample report</a>
          </li>
          <li>
            <a href="/api/status/200">API health check</a>
          </li>
          <li>
            <a href="/api/docs">Old API documentation</a>
          </li>
          <li>
            <a href="https://playwright.dev" target="_blank" rel="noopener noreferrer">
              Playwright documentation
            </a>
          </li>
          <li>
            <a href="https://example.com/forum" target="_blank">
              Community forum
            </a>
          </li>
        </ul>
      </TestCard>

      <TestCard title="Release notes">
        <article className="release-notes" data-testid="release-notes">
          <h3>Version 2.0</h3>
          <h4>New features</h4>
          <p>Data grid, aria snapshots and a fake clock.</p>
          <h3>Version 1.9</h3>
          <h5>Bug fixes</h5>
          <p>Timers no longer fire after leaving a page.</p>
        </article>
      </TestCard>
    </>
  );
}
