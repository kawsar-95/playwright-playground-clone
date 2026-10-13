import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

export default function Buttons() {
  const [result, setResult] = useState("");

  return (
    <div>
      <PageHeader title="Buttons">Different button types and states for testing.</PageHeader>

      <Lesson title="Finding and clicking buttons">
        <h3>Find buttons by role and name</h3>
        <p>
          A user finds a button by its look and its text. Do the same in a test. Use the role and the text of the
          button. The text is the <em>accessible name</em> of the button.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Primary action' }).click();
`}</Code>
        <h3>A name matches part of a longer name</h3>
        <p>
          <code>name: 'Click me'</code> also matches "Double click me" and "Right click me". Playwright ignores case and
          accepts a part of a name. If a locator matches more than one element, Playwright stops with a{" "}
          <strong>strict mode violation</strong> and lists all matches. Add <code>exact: true</code> to match the full
          name.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Click me', exact: true }).click();
`}</Code>
        <h3>Other kinds of click</h3>
        <Code>{`
await page.getByRole('button', { name: 'Double click me' }).dblclick();
await page.getByRole('button', { name: 'Right click me' }).click({ button: 'right' });
`}</Code>
        <h3>Playwright waits before it clicks</h3>
        <p>
          Before a click, Playwright waits until the button is visible, stable and <strong>enabled</strong>. A click on a
          disabled button does not fail at once. Playwright waits, and then it fails with a timeout error that gives the
          reason. To check the state, write an assertion:
        </p>
        <Code>{`
await expect(page.getByRole('button', { name: 'Disabled button' })).toBeDisabled();
await expect(page.getByTestId('button-result')).toHaveText('Button clicked');
`}</Code>
      </Lesson>

      <TestCard title="Basic buttons">
        <p>Normal left clicks. One button is disabled.</p>
        <div className="button-row">
          <button className="secondary" onClick={() => setResult("Button clicked")}>
            Click me
          </button>
          <button onClick={() => setResult("Primary button clicked")}>Primary action</button>
          <button disabled>Disabled button</button>
        </div>
      </TestCard>

      <TestCard title="Double and right click">
        <p>These buttons ignore a normal click.</p>
        <div className="button-row">
          <button onDoubleClick={() => setResult("Double click detected")}>Double click me</button>
          <button
            onContextMenu={(e) => {
              e.preventDefault();
              setResult("Right click detected");
            }}
          >
            Right click me
          </button>
        </div>
      </TestCard>

      {result && (
        <div className="result" role="status" data-testid="button-result">
          {result}
        </div>
      )}
    </div>
  );
}
