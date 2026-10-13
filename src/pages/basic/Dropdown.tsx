import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const languageOptions = ["English", "Polish", "German", "Spanish"];
const sizeOptions = ["Small", "Medium", "Large"];

export default function Dropdown() {
  const [country, setCountry] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [size, setSize] = useState("");
  const [open, setOpen] = useState(false);

  const choose = (value: string) => {
    setSize(value);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Dropdown">Select elements for practicing dropdown interactions.</PageHeader>

      <Lesson title="Native selects and custom dropdowns">
        <h3>Native select: selectOption()</h3>
        <p>
          For a real <code>&lt;select&gt;</code> element, do not click the options. Call <code>selectOption()</code>. You
          can give the value, the label or the index of an option:
        </p>
        <Code>{`
const country = page.getByLabel('Select a country');

await country.selectOption('Poland');               // by value
await country.selectOption({ label: 'Germany' });   // by visible text
await expect(country).toHaveValue('Germany');
`}</Code>
        <h3>Multiple selection</h3>
        <p>
          Give an array to select more than one option in one call. The new selection replaces the old selection. Use{" "}
          <code>toHaveValues()</code> to assert it.
        </p>
        <Code>{`
const languages = page.getByLabel('Languages you speak');

await languages.selectOption(['English', 'Polish']);
await expect(languages).toHaveValues(['English', 'Polish']);
`}</Code>
        <h3>A custom dropdown is not a select</h3>
        <p>
          Many sites make a dropdown from a button and a list. <code>selectOption()</code> does not work on them. Act as
          a user acts: open the list, and then click the option by its role.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Shirt size' }).click();
await page.getByRole('option', { name: 'Medium' }).click();

await expect(page.getByRole('button', { name: 'Shirt size' })).toContainText('Medium');
`}</Code>
        <p>
          To see the difference, inspect the element in DevTools. If the tag is <code>&lt;select&gt;</code>, use{" "}
          <code>selectOption()</code>. For all other tags, click.
        </p>
      </Lesson>

      <TestCard title="Country">
        <div className="form-group">
          <label htmlFor="country">Select a country</label>
          <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select country</option>
            <option value="Poland">Poland</option>
            <option value="Germany">Germany</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="United States">United States</option>
          </select>
        </div>
        <div className="result">
          Selected country: <strong>{country || "none"}</strong>
        </div>
      </TestCard>

      <TestCard title="Languages">
        <div className="form-group">
          <label htmlFor="languages">Languages you speak</label>
          <select
            id="languages"
            multiple
            size={languageOptions.length}
            value={languages}
            onChange={(e) => setLanguages(Array.from(e.target.selectedOptions, (o) => o.value))}
          >
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
        <div className="result" data-testid="languages-result">
          Selected languages: <strong>{languages.length ? languages.join(", ") : "none"}</strong>
        </div>
      </TestCard>

      <TestCard title="Shirt size">
        <p>A custom dropdown built from a button and a list.</p>
        <div className="custom-select">
          <span id="shirt-size-label" className="custom-select-label">
            Shirt size
          </span>
          <button
            type="button"
            id="shirt-size-button"
            className="custom-select-button secondary"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-labelledby="shirt-size-label shirt-size-button"
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            {size || "Choose a size"}
            <span className="custom-select-arrow" aria-hidden="true">
              ▾
            </span>
          </button>
          {open && (
            <ul className="custom-select-list" role="listbox" aria-labelledby="shirt-size-label">
              {sizeOptions.map((option) => (
                <li key={option} role="option" aria-selected={size === option} tabIndex={-1} onClick={() => choose(option)}>
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="result" data-testid="size-result">
          Selected size: <strong>{size || "none"}</strong>
        </div>
      </TestCard>
    </div>
  );
}
