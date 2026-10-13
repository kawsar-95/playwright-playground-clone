import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

export default function Attributes() {
  const [message, setMessage] = useState("");

  return (
    <>
      <PageHeader title="Content & Attributes">Practice reading text, values, attributes, and element state.</PageHeader>

      <Lesson title="Asserting what an element contains">
        <h3>Exact text and partial text</h3>
        <p>
          <code>toHaveText()</code> checks the <em>whole</em> text. It first collapses extra white space.{" "}
          <code>toContainText()</code> checks only a part of the text.
        </p>
        <Code>{`
const paragraph = page.getByTestId('text-content');

await expect(paragraph).toHaveText('This is visible text inside a paragraph.');
await expect(paragraph).toContainText('visible text');
`}</Code>
        <h3>Text in more than one tag</h3>
        <p>
          The markup <code>Hello &lt;strong&gt;Playwright&lt;/strong&gt;</code> holds two elements. Playwright reads it as one text.
        </p>
        <Code>{`
await expect(page.getByTestId('nested-content')).toHaveText('Hello Playwright');
`}</Code>
        <h3>Values, attributes and state</h3>
        <Code>{`
const input = page.getByLabel('Input value');
await expect(input).toHaveValue('Initial value');
await expect(input).not.toBeEditable(); // the input is read-only

const link = page.getByTestId('attribute-link');
await expect(link).toHaveAttribute('href', '/content/attributes');
await expect(link).toHaveAttribute('target', '_blank');
await expect(link).toHaveId('test-link');
await expect(link).toHaveClass('special-link');
`}</Code>
        <h3>Visible text and accessible name</h3>
        <p>
          The link shows the text "Open page". Its <code>aria-label</code> gives it the accessible name "Open attribute test page".{" "}
          <code>getByRole()</code> uses the accessible name. <code>getByText()</code> uses the visible text.
        </p>
        <Code>{`
await expect(page.getByRole('link', { name: 'Open attribute test page' })).toBeVisible();
await expect(page.getByText('Open page')).toBeVisible();
await expect(page.getByTestId('attribute-link')).toHaveAccessibleName('Open attribute test page');
`}</Code>
      </Lesson>

      <TestCard title="Text Content">
        <p data-testid="text-content">This is visible text inside a paragraph.</p>
        <div data-testid="nested-content" className="content-box">
          Hello <strong>Playwright</strong>
        </div>
      </TestCard>

      <TestCard title="Input Value">
        <div className="form-group">
          <label htmlFor="content-input">Input value</label>
          <input id="content-input" type="text" value="Initial value" readOnly />
        </div>
      </TestCard>

      <TestCard title="Attributes">
        <a
          href="/content/attributes"
          target="_blank"
          rel="noopener noreferrer"
          id="test-link"
          className="special-link"
          data-testid="attribute-link"
          aria-label="Open attribute test page"
        >
          Open page
        </a>
      </TestCard>

      <TestCard title="Element State">
        <div className="button-row">
          <button type="button" onClick={() => setMessage("Button was clicked")}>
            Click Me
          </button>
          <button type="button" disabled>
            Disabled Button
          </button>
        </div>
        {message && (
          <div className="result" role="status" data-testid="content-result">
            {message}
          </div>
        )}
      </TestCard>
    </>
  );
}
