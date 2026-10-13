import { useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const JOB_STEPS = [
  { status: "Queued", at: 0 },
  { status: "Running", at: 1000 },
  { status: "Passed", at: 3500 },
];
const ORDER_DELAY = 800;

function newOrderId(): string {
  return `ORD-${Math.floor(1e5 + Math.random() * 9e5)}`;
}

export default function ChangingText() {
  const { later, cancel } = useTimers();
  const [status, setStatus] = useState("Not started");
  const [orderId, setOrderId] = useState("");
  const [placing, setPlacing] = useState(false);
  const jobTimers = useRef<number[]>([]);

  const runJob = () => {
    jobTimers.current.forEach(cancel);
    jobTimers.current = JOB_STEPS.map(({ status: next, at }) => later(() => setStatus(next), at));
  };

  const placeOrder = () => {
    setOrderId("");
    setPlacing(true);
    later(() => {
      setPlacing(false);
      setOrderId(newOrderId());
    }, ORDER_DELAY);
  };

  return (
    <div className="dynamic-page">
      <PageHeader title="Changing Text">
        Text that updates by itself over time, and text that is different on every run.
      </PageHeader>

      <Lesson title="Asserting text that is still changing">
        <h3>A snapshot goes stale</h3>
        <p>
          <code>textContent()</code> reads the text <em>one time</em>, at that moment. If the page is not ready, the test
          fails. It fails only sometimes. This is a classic flaky test:
        </p>
        <Code>{`
// Bad: reads the status one time. Fails when the job is not done.
const status = await page.getByTestId('job-status').textContent();
expect(status).toBe('Passed');
`}</Code>
        <p>
          A <strong>web-first assertion</strong> such as <code>toHaveText()</code> reads the text again and again until it
          matches or the timeout ends:
        </p>
        <Code>{`
// Good: retries until the status is "Passed".
await page.getByRole('button', { name: 'Run job' }).click();
await expect(page.getByTestId('job-status')).toHaveText('Queued');
await expect(page.getByTestId('job-status')).toHaveText('Passed');
`}</Code>
        <p>
          Rule: <code>await expect(locator)…</code> waits. <code>expect(await locator.something())</code> does not wait.
        </p>
        <h3>Text that is different on every run</h3>
        <p>
          You cannot hard-code generated values such as IDs, dates and totals. Assert their <em>format</em> with a regular
          expression:
        </p>
        <Code>{String.raw`
await page.getByRole('button', { name: 'Place order' }).click();
await expect(page.getByTestId('order-confirmation')).toHaveText(
  /^Order ORD-\d{6} confirmed$/
);
`}</Code>
        <h3>Use the value later in the test</h3>
        <p>After the assertion passes, the text is stable. Now you can read it and take the part that you need:</p>
        <Code>{String.raw`
const text = await page.getByTestId('order-confirmation').textContent();
const orderId = text!.match(/ORD-\d{6}/)![0];
`}</Code>
      </Lesson>

      <TestCard title="Job status">
        <p>After the click, the status changes by itself: Queued, then Running, then Passed. This takes about 3.5 seconds.</p>
        <button type="button" onClick={runJob} disabled={status === "Queued" || status === "Running"}>
          Run job
        </button>
        <div className="result job-status-row" aria-live="polite">
          Status:{" "}
          <span className={`job-status job-status-${status.toLowerCase().replace(" ", "-")}`} data-testid="job-status">
            {status}
          </span>
        </div>
      </TestCard>

      <TestCard title="Order confirmation">
        <p>Every order gets a new random ID.</p>
        <button type="button" onClick={placeOrder} disabled={placing}>
          Place order
        </button>
        {placing && (
          <div className="result" role="status">
            Placing order...
          </div>
        )}
        {orderId && (
          <div className="result success" data-testid="order-confirmation">
            Order {orderId} confirmed
          </div>
        )}
      </TestCard>
    </div>
  );
}
