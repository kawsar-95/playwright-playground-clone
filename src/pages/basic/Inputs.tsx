import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

export default function Inputs() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [range, setRange] = useState("50");

  return (
    <div className="page-container">
      <PageHeader title="Inputs">Different input types for practicing form interactions with Playwright.</PageHeader>

      <Lesson title="Typing into inputs">
        <h3>Find an input by its label</h3>
        <p>
          Each field on this page has a <code>&lt;label&gt;</code>. So <code>getByLabel()</code> finds the field the same
          way a user reads the form. A test id also works. A label has an extra benefit: it shows that the form is
          accessible.
        </p>
        <Code>{`
const username = page.getByLabel('Username');

await username.fill('tester');
await expect(username).toHaveValue('tester');
await expect(page.getByTestId('username-result')).toContainText('tester');
`}</Code>
        <h3>fill() or pressSequentially()?</h3>
        <ul>
          <li>
            <code>fill()</code> sets the complete value in one step. Use it in most cases.
          </li>
          <li>
            <code>pressSequentially()</code> presses one key at a time, as a person does. Use it when the page reacts to
            each key, for example in autocomplete.
          </li>
          <li>
            <code>clear()</code> removes the value of a field.
          </li>
        </ul>
        <h3>Special input types</h3>
        <p>
          You also fill date and range inputs with a string. A date always has the format <code>YYYY-MM-DD</code>. This
          is true for all browsers, also when the browser shows a different format.
        </p>
        <Code>{`
await page.getByLabel('Date').fill('2026-05-17');
await page.getByLabel(/Range/).fill('75');
`}</Code>
        <p>The label of the range input includes its current value. A regular expression matches it for any value.</p>
      </Lesson>

      <TestCard title="Text input">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            data-testid="username-input"
          />
        </div>
        <div className="result" data-testid="username-result">
          You entered: <strong>{username}</strong>
        </div>
      </TestCard>

      <TestCard title="Other inputs">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="email-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="number">Number</label>
          <input
            id="number"
            name="number"
            type="number"
            min="0"
            max="100"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            data-testid="number-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="date-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="range">
            Range (Value: <span data-testid="range-badge">{range}</span>)
          </label>
          <input
            id="range"
            name="range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            data-testid="range-input"
          />
        </div>
        <div className="result" data-testid="other-inputs-result">
          <p>
            <strong>Summary:</strong>
          </p>
          <ul>
            <li>
              Email: <span data-testid="result-email">{email || "N/A"}</span>
            </li>
            <li>
              Password: <span data-testid="result-password">{password ? "••••••••" : "N/A"}</span>
            </li>
            <li>
              Number: <span data-testid="result-number">{number || "N/A"}</span>
            </li>
            <li>
              Date: <span data-testid="result-date">{date || "N/A"}</span>
            </li>
            <li>
              Range: <span data-testid="result-range">{range}</span>
            </li>
          </ul>
        </div>
      </TestCard>
    </div>
  );
}
