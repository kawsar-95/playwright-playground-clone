import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useLater } from "./useLater";

const SEARCH_DELAY_MS = 6000;

export default function Failures() {
  const later = useLater();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false);
  const [exportStarted, setExportStarted] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);
  const [continued, setContinued] = useState(false);
  const [search, setSearch] = useState<"idle" | "loading" | "done">("idle");

  return (
    <>
      <PageHeader title="Reading Failures">
        Five small widgets, each with a test that fails. Run the test, read the error, and fix the test. The error message almost
        always says what went wrong.
      </PageHeader>

      <Lesson title="How to read a Playwright error">
        <h3>The parts of an error</h3>
        <ul>
          <li>
            <strong>The first line</strong> gives the type of failure: a strict mode violation, a timeout, or an assertion that did
            not match.
          </li>
          <li>
            <strong>The locator</strong> is your locator, as Playwright understood it.
          </li>
          <li>
            <strong>The call log</strong> lists each step Playwright took, for example "locator resolved to ...", "element is not
            enabled" and "retrying click action". The last lines say why Playwright stopped.
          </li>
          <li>
            <strong>The error context</strong> is a snapshot of the page at the time of the failure. Playwright saves it with the
            test results.
          </li>
        </ul>
        <h3>Fail fast while you practise</h3>
        <p>
          A click waits until the end of the test timeout. The default is 30 seconds. Use a shorter timeout for this run, and
          keep a screenshot of each failure.
        </p>
        <Code>{`
npx playwright test failures --timeout 10000

// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},
`}</Code>
        <h3>The failing tests</h3>
        <p>Copy these tests into a spec file. Run them. Fix each one.</p>
        <Code>{`
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/debugging/failures');
});

test('1. saves the profile', async ({ page }) => {
  await page.getByLabel('Display name').fill('Ada');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible();
});

test('2. starts the export', async ({ page }) => {
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByText('Export started')).toBeVisible();
});

test('3. continues', async ({ page }) => {
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('You continued')).toBeVisible();
});

test('4. shows the invoice is paid', async ({ page }) => {
  await expect(page.getByTestId('invoice-status')).toHaveText('PAID');
});

test('5. loads the results', async ({ page }) => {
  await page.getByRole('button', { name: 'Load results' }).click();
  await expect(page.getByRole('list', { name: 'Results' })).toBeVisible();
});
`}</Code>
        <div className="lesson-callout">
          Read the error before you change anything. Then fix the test, not the timeout. A longer timeout is the right fix for only
          one of these five tests.
        </div>
      </Lesson>

      <TestCard title="1. Profile">
        <div className="document-toolbar" role="toolbar" aria-label="Document">
          <span>Untitled document</span>
          <button type="button" className="secondary" onClick={() => setProfileMessage("Document saved")}>
            Save
          </button>
        </div>
        <form
          className="failures-form"
          aria-label="Profile"
          onSubmit={(event) => {
            event.preventDefault();
            setProfileMessage(displayName.trim() ? "Profile saved" : "Enter a display name");
          }}
        >
          <div className="form-group">
            <label htmlFor="display-name">Display name</label>
            <input id="display-name" type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>
          <button type="submit">Save</button>
        </form>
        {profileMessage && (
          <p className="result" role="status">
            {profileMessage}
          </p>
        )}
      </TestCard>

      <TestCard title="2. Export">
        <label className="checkbox-label">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />I understand the export
          includes personal data
        </label>
        <div className="button-row">
          <button type="button" disabled={!consent} onClick={() => setExportStarted(true)}>
            Export
          </button>
        </div>
        {exportStarted && (
          <p className="result success" role="status">
            Export started
          </p>
        )}
      </TestCard>

      <TestCard title="3. Next step">
        <div className="covered-area">
          <button type="button" onClick={() => setContinued(true)}>
            Continue
          </button>
          {promoVisible && (
            <div className="promo-ribbon">
              <span>Spring sale: 20% off everything</span>
              <button type="button" className="secondary" onClick={() => setPromoVisible(false)}>
                Dismiss
              </button>
            </div>
          )}
        </div>
        {continued && (
          <p className="result success" role="status">
            You continued
          </p>
        )}
      </TestCard>

      <TestCard title="4. Invoice">
        <p>
          Invoice INV-2041 · $42.00 · <span className="invoice-badge" data-testid="invoice-status">Paid</span>
        </p>
      </TestCard>

      <TestCard title="5. Search results">
        <p>The search takes about six seconds.</p>
        <button
          type="button"
          disabled={search === "loading"}
          onClick={() => {
            setSearch("loading");
            later(() => setSearch("done"), SEARCH_DELAY_MS);
          }}
        >
          Load results
        </button>
        {search === "loading" && (
          <p className="result" role="status">
            Loading results…
          </p>
        )}
        {search === "done" && (
          <ul className="results-list" aria-label="Results">
            <li>Getting started with Playwright</li>
            <li>Writing your first test</li>
            <li>Locators in depth</li>
          </ul>
        )}
      </TestCard>
    </>
  );
}
