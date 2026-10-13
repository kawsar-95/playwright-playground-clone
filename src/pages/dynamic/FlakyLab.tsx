import { useEffect, useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const MIN_DELAY = 1000;
const RANDOM_SPAN = 6000;
const SHUFFLE_EVERY = 1000;
const SERVICES = ["Alpha", "Beta", "Gamma"];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlakyLab() {
  const { later, every, cancel } = useTimers();
  const [fetching, setFetching] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const reportTimer = useRef<number | null>(null);
  const [services, setServices] = useState(SERVICES);
  const [renders, setRenders] = useState(0);
  const [selected, setSelected] = useState("");
  const [saveResult, setSaveResult] = useState("");

  useEffect(() => {
    const id = every(() => {
      setServices((current) => shuffle(current));
      setRenders((n) => n + 1);
    }, SHUFFLE_EVERY);
    return () => cancel(id);
  }, [every, cancel]);

  return (
    <div className="dynamic-page">
      <PageHeader title="Flaky Lab">
        Scenarios that make tests pass on your machine and fail in CI. Make them pass every time.
      </PageHeader>

      <Lesson title="Finding and fixing flaky tests">
        <h3>Prove that a test is stable</h3>
        <p>One pass proves little. Run the test many times in a row. A flaky test usually fails within 20 runs:</p>
        <Code>{`
npx playwright test flaky-lab --repeat-each=20
`}</Code>
        <h3>1. Random delays</h3>
        <p>
          The report takes 1 to 7 seconds. A fixed <code>waitForTimeout(3000)</code> fails most of the time. A plain{" "}
          <code>toBeVisible()</code> fails <em>sometimes</em>, because 7 seconds is longer than the default timeout of 5
          seconds. Set a timeout that is longer than the slowest realistic case:
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Fetch report' }).click();
await expect(page.getByTestId('report')).toBeVisible({ timeout: 10_000 });
`}</Code>
        <h3>2. Content that renders again</h3>
        <p>
          The page builds the service list again every second, in a new order. A <strong>locator</strong> is a
          description, not an element. It finds the element again each time you use it, so a new render does not matter. An{" "}
          <strong>element handle</strong> points at one node. The page can throw that node away a moment later.
        </p>
        <Code>{`
// Good: finds "Beta" again at the moment of the click, wherever it moved.
await page
  .getByRole('listitem')
  .filter({ hasText: 'Beta' })
  .getByRole('button', { name: 'Select' })
  .click();

// Bad: the list changes order, so nth(1) is a different service each time.
// await page.getByRole('button', { name: 'Select' }).nth(1).click();
`}</Code>
        <h3>3. A response that arrives before you listen</h3>
        <p>
          The save request ends in a few milliseconds. If you start to wait <em>after</em> the click, the response can
          already be there. Then the wait hangs until the timeout.
        </p>
        <Code>{`
// Bad: the response can arrive before waitForResponse starts.
await page.getByRole('button', { name: 'Quick save' }).click();
await page.waitForResponse('**/api/status/200');

// Good: start to wait first, then do the action.
const responsePromise = page.waitForResponse('**/api/status/200');
await page.getByRole('button', { name: 'Quick save' }).click();
await responsePromise;
`}</Code>
        <h3>Retry a block: toPass()</h3>
        <p>
          When several steps must succeed <em>together</em>, put them in <code>expect(async () =&gt; …).toPass()</code>.
          Playwright runs the whole block again until it passes or the time ends.
        </p>
        <div className="lesson-callout">
          The <code>retries</code> option in the config can make a flaky test look green and hide the problem. Fix the
          cause. Use retries only as a safety net.
        </div>
      </Lesson>

      <TestCard title="1. Random delay">
        <p>The report takes 1 to 7 seconds. The time is different every run.</p>
        <button
          type="button"
          onClick={() => {
            setFetching(true);
            setReportReady(false);
            const delay = MIN_DELAY + Math.random() * RANDOM_SPAN;
            cancel(reportTimer.current);
            reportTimer.current = later(() => {
              setFetching(false);
              setReportReady(true);
            }, delay);
          }}
          disabled={fetching}
        >
          Fetch report
        </button>
        {fetching && (
          <div className="result" role="status">
            Fetching report...
          </div>
        )}
        {reportReady && (
          <div className="result success" data-testid="report">
            Report ready: 128 tests, 124 passed
          </div>
        )}
      </TestCard>

      <TestCard title="2. Re-rendering list">
        <p>
          The page builds the list again every second, in a new order. Render #<span data-testid="render-count">{renders}</span>
        </p>
        <ul className="flaky-list" aria-label="Services">
          {services.map((name) => (
            <li key={`${name}-${renders}`}>
              <span>{name}</span>
              <button type="button" className="secondary" onClick={() => setSelected(name)}>
                Select
              </button>
            </li>
          ))}
        </ul>
        <div className="result" data-testid="selected-service">
          Selected service: <strong>{selected || "none"}</strong>
        </div>
      </TestCard>

      <TestCard title="3. Fast response">
        <p>Sends a request that ends almost at once.</p>
        <button
          type="button"
          onClick={async () => {
            setSaveResult("");
            const response = await fetch("/api/status/200");
            setSaveResult(response.ok ? "Saved" : "Save failed");
          }}
        >
          Quick save
        </button>
        {saveResult && (
          <div className="result success" data-testid="save-result">
            {saveResult}
          </div>
        )}
      </TestCard>
    </div>
  );
}
