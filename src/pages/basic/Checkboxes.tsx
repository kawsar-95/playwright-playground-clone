import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

export default function Checkboxes() {
  const [newsletter, setNewsletter] = useState(false);
  const [terms, setTerms] = useState(false);

  return (
    <div>
      <PageHeader title="Checkboxes">Checkboxes for testing checked and unchecked states.</PageHeader>

      <Lesson title="Checking and unchecking">
        <h3>check(), not click()</h3>
        <p>
          <code>click()</code> toggles a checkbox. If the box is checked, a click unchecks it. <code>check()</code> makes
          sure that the box is checked at the end. It does nothing if the box is already checked. The test then does not
          depend on the start state.
        </p>
        <Code>{`
const newsletter = page.getByRole('checkbox', { name: 'Subscribe to newsletter' });

await newsletter.check();
await expect(newsletter).toBeChecked();

await newsletter.uncheck();
await expect(newsletter).not.toBeChecked();
`}</Code>
        <h3>Set a state from data</h3>
        <p>
          If the wanted state is in a variable, use <code>setChecked()</code>:
        </p>
        <Code>{`
await page.getByLabel('Accept terms and conditions').setChecked(true);
`}</Code>
        <h3>Also assert what the user sees</h3>
        <p>
          A checked input is only half of the result. Also check that the page reacted. On this page, read the "Current
          state" card.
        </p>
      </Lesson>

      <TestCard title="Checkbox examples">
        <div className="checkbox-group">
          <label>
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
            Subscribe to newsletter
          </label>
          <label>
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            Accept terms and conditions
          </label>
        </div>
      </TestCard>

      <TestCard title="Current state">
        <p>
          Newsletter: <strong>{newsletter ? "checked" : "unchecked"}</strong>
        </p>
        <p>
          Terms: <strong>{terms ? "checked" : "unchecked"}</strong>
        </p>
      </TestCard>
    </div>
  );
}
