import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const browsers = ["Chrome", "Firefox", "Safari"];

export default function RadioButtons() {
  const [selected, setSelected] = useState("");

  return (
    <div>
      <PageHeader title="Radio Buttons">Radio button groups for testing single selection.</PageHeader>

      <Lesson title="Selecting one option from a group">
        <h3>Radio buttons work as a group</h3>
        <p>
          Radio buttons with the same <code>name</code> are one group. Only one option of a group can be selected. When
          you select an option, the other options are cleared. A good test checks both facts.
        </p>
        <Code>{`
const firefox = page.getByRole('radio', { name: 'Firefox' });

await firefox.check();

await expect(firefox).toBeChecked();
await expect(page.getByRole('radio', { name: 'Chrome' })).not.toBeChecked();
`}</Code>
        <h3>You cannot uncheck a radio button</h3>
        <p>
          A user clears a radio button only when the user selects a different option. For this reason{" "}
          <code>uncheck()</code> throws an error on a radio button. Select another option instead.
        </p>
        <h3>Disabled options</h3>
        <Code>{`
await expect(page.getByRole('radio', { name: 'Internet Explorer' })).toBeDisabled();
`}</Code>
      </Lesson>

      <TestCard title="Select your browser">
        <div className="radio-group">
          {browsers.map((browser) => (
            <label key={browser}>
              <input
                type="radio"
                name="browser"
                value={browser}
                checked={selected === browser}
                onChange={(e) => setSelected(e.target.value)}
              />
              {browser}
            </label>
          ))}
          <label className="is-disabled">
            <input type="radio" name="browser" value="Internet Explorer" disabled />
            Internet Explorer
          </label>
        </div>
        <div className="result">
          Selected browser: <strong>{selected || "none"}</strong>
        </div>
      </TestCard>
    </div>
  );
}
