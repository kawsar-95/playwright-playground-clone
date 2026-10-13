import { Code, Lesson, PageHeader, TestCard } from "../../components";

const formDocument = `<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="/embeds/embed.css" />
  </head>
  <body>
    <form id="form">
      <label for="name">Name</label>
      <input id="name" name="name" type="text" placeholder="Enter your name" />
      <button type="submit">Submit</button>
    </form>
    <div id="result" class="result" role="status"></div>

    <script>
      document.getElementById('form').addEventListener('submit', (event) => {
        event.preventDefault();
        document.getElementById('result').textContent =
          'Hello, ' + document.getElementById('name').value;
      });
    <\/script>
  </body>
</html>`;

export default function IframeBasics() {
  return (
    <>
      <PageHeader title="iFrame Basics">
        An iframe is a separate document inside the page. Enter it first, then use the usual locators.
      </PageHeader>

      <Lesson title="Working inside a frame">
        <h3>Page locators stop at the frame</h3>
        <p>
          <code>page.getByRole()</code>, <code>getByText()</code> and the other page locators search only the
          document of the page. To reach the document of a frame, get a locator for the frame first. Then
          locate inside it.
        </p>
        <Code>{`
const frame = page.getByTitle('Embedded Form').contentFrame();

await frame.getByLabel('Name').fill('Ada');
await frame.getByRole('button', { name: 'Submit' }).click();

await expect(frame.getByRole('status')).toHaveText('Hello, Ada');
await expect(page.getByText('Hello, Ada')).toHaveCount(0); // not in the page
`}</Code>

        <h3>contentFrame() or frameLocator()?</h3>
        <p>
          Both return a <code>FrameLocator</code>. <code>contentFrame()</code> starts from any locator of the{" "}
          <code>&lt;iframe&gt;</code> element. You can find the element by title, role or nearby text.{" "}
          <code>frameLocator()</code> takes a CSS selector.
        </p>
        <Code>{`
page.getByTitle('Newsletter signup').contentFrame();
page.frameLocator('iframe[title="Newsletter signup"]'); // same frame
`}</Code>

        <h3>The element and the document are different things</h3>
        <p>
          The attributes <code>src</code> and <code>title</code> belong to the <code>&lt;iframe&gt;</code>{" "}
          element in the page. Check them on the element. <code>owner()</code> goes from a frame back to its
          element.
        </p>
        <Code>{`
const newsletter = page.frameLocator('iframe[title="Newsletter signup"]');

await expect(newsletter.owner()).toHaveAttribute('src', '/embeds/newsletter/');
`}</Code>

        <div className="lesson-callout">
          Frame locators wait like all other locators. If the frame still loads, Playwright waits for the
          element inside it.
        </div>
      </Lesson>

      <TestCard title="Embedded form">
        <p data-testid="iframe-description">
          This form is an inline document (<code>srcdoc</code>) inside an iframe.
        </p>
        <iframe title="Embedded Form" className="test-iframe" srcDoc={formDocument} />
      </TestCard>

      <TestCard title="Newsletter">
        <p>This frame loads its own page by URL, like most third-party widgets.</p>
        <iframe title="Newsletter signup" className="test-iframe" src="/embeds/newsletter/" />
      </TestCard>
    </>
  );
}
