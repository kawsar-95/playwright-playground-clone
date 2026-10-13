import { useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const STEP = 5;
const TICK = 200;

export default function ProgressBar() {
  const { every, cancel } = useTimers();
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");
  const current = useRef(0);
  const timer = useRef<number | null>(null);

  const finish = (text: string) => {
    cancel(timer.current);
    timer.current = null;
    setRunning(false);
    setResult(text);
  };

  const start = () => {
    current.current = 0;
    setValue(0);
    setResult("");
    setRunning(true);
    timer.current = every(() => {
      current.current = Math.min(current.current + STEP, 100);
      setValue(current.current);
      if (current.current >= 100) finish("Completed");
    }, TICK);
  };

  return (
    <div className="dynamic-page">
      <PageHeader title="Progress Bar">A progress bar that slowly reaches 100%.</PageHeader>

      <Lesson title="Waiting for a value, then acting on it">
        <h3>Read the progress from ARIA, not from styles</h3>
        <p>
          The bar has <code>role="progressbar"</code>. It reports its value in <code>aria-valuenow</code>. Assistive
          technology uses this attribute, so it is stable and good for tests. The width of the bar in pixels is not.
        </p>
        <Code>{`
const bar = page.getByRole('progressbar', { name: 'Upload progress' });

await page.getByRole('button', { name: 'Start progress' }).click();
await expect(bar).toHaveAttribute('aria-valuenow', '100');
`}</Code>
        <h3>Act when a threshold is reached</h3>
        <p>
          To stop the bar at 70% or more, wait until the value is high enough. Then click. <code>expect.poll()</code>{" "}
          runs a function again and again until its result passes the matcher. This is good for numbers:
        </p>
        <Code>{String.raw`
await expect
  .poll(async () => Number(await bar.getAttribute('aria-valuenow')), {
    intervals: [50],
  })
  .toBeGreaterThanOrEqual(70);

await page.getByRole('button', { name: 'Stop' }).click();
await expect(page.getByTestId('progress-result')).toHaveText(/Stopped at (7\d|8\d|9\d)%/);
`}</Code>
        <p>
          <code>intervals</code> sets the time between checks. The default intervals are slow: 100 ms, then 250 ms, then 500
          ms. The bar can reach 100% between two checks.
        </p>
        <div className="lesson-callout">
          The bar keeps moving while your test runs. You cannot hit an exact value such as 75%. Assert a range.
        </div>
      </Lesson>

      <TestCard title="Upload">
        <p>The bar moves 5% every 200 ms. Stop it at 70% or more.</p>
        <div className="button-row">
          <button type="button" onClick={start} disabled={running}>
            Start progress
          </button>
          <button type="button" className="secondary" onClick={() => finish(`Stopped at ${current.current}%`)} disabled={!running}>
            Stop
          </button>
        </div>
        <div
          className="progress-container"
          role="progressbar"
          aria-label="Upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          data-testid="progress-bar"
        >
          <div className="progress" style={{ width: `${value}%` }} />
        </div>
        <div className="progress-value" data-testid="progress-value">
          {value}%
        </div>
        {result && (
          <div className={result === "Completed" ? "result success" : "result"} role="status" data-testid="progress-result">
            {result}
          </div>
        )}
      </TestCard>
    </div>
  );
}
