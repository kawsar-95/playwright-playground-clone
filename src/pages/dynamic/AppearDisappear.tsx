import { useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const SHOW_DELAY = 3000;
const SLOW_DELAY = 7000;
const SPINNER_DELAY = 3000;
const TOAST_DELAY = 3000;

export default function AppearDisappear() {
  const { later, cancel } = useTimers();
  const [showElement, setShowElement] = useState(false);
  const [showSlow, setShowSlow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [hidden, setHidden] = useState(false);
  const showTimer = useRef<number | null>(null);
  const slowTimer = useRef<number | null>(null);
  const loadTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  const restart = (ref: { current: number | null }, fn: () => void, ms: number) => {
    cancel(ref.current);
    ref.current = later(fn, ms);
  };

  return (
    <div className="dynamic-page">
      <PageHeader title="Appear & Disappear">
        Elements that show up late, go away on their own, or leave the page in different ways.
      </PageHeader>

      <Lesson title="Waiting for elements without sleeping">
        <h3>Assertions wait for you</h3>
        <p>
          <code>expect(locator).toBeVisible()</code> does not check one time. It checks again and again until the element
          is visible or the timeout ends. The default timeout is <strong>5 seconds</strong>. An element that appears after
          3 seconds needs no extra code:
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Show element' }).click();
await expect(page.getByTestId('delayed-element')).toBeVisible();
`}</Code>
        <h3>Do not use a fixed sleep</h3>
        <p>
          <code>page.waitForTimeout(3000)</code> is either too long, so the test is slow, or too short, so the test is
          flaky. Wait for the state that you need.
        </p>
        <h3>The element is slower than the timeout</h3>
        <p>Raise the timeout for that one check only:</p>
        <Code>{`
await page.getByRole('button', { name: 'Load slowly' }).click();
await expect(page.getByTestId('slow-element')).toBeVisible({ timeout: 10_000 });
`}</Code>
        <h3>Wait for an element to go away</h3>
        <p>
          A spinner or a toast must disappear. Assert this too. <code>toBeHidden()</code> waits in the same way as{" "}
          <code>toBeVisible()</code>.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Start loading' }).click();
await expect(page.getByTestId('loading-spinner')).toBeVisible();
await expect(page.getByTestId('loading-spinner')).toBeHidden();
await expect(page.getByTestId('loading-result')).toBeVisible();
`}</Code>
        <h3>Hidden is not the same as removed</h3>
        <ul>
          <li>
            <code>toBeHidden()</code> passes in both cases: the element is invisible, or it is not in the page.
          </li>
          <li>
            <code>toBeAttached()</code> passes only while the element is in the DOM, even if the user cannot see it.
          </li>
          <li>
            <code>toHaveCount(0)</code> passes only when the element is gone.
          </li>
        </ul>
      </Lesson>

      <TestCard title="Delayed element">
        <p>The element appears 3 seconds after the click. The slow element appears after 7 seconds. A second click starts the wait again.</p>
        <div className="button-row">
          <button
            type="button"
            onClick={() => {
              setShowElement(false);
              restart(showTimer, () => setShowElement(true), SHOW_DELAY);
            }}
          >
            Show element
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setShowSlow(false);
              restart(slowTimer, () => setShowSlow(true), SLOW_DELAY);
            }}
          >
            Load slowly
          </button>
        </div>
        <div className="dynamic-area">
          {showElement && (
            <div className="dynamic-element" data-testid="delayed-element">
              Element appeared!
            </div>
          )}
          {showSlow && (
            <div className="dynamic-element" data-testid="slow-element">
              Finally loaded after 7 seconds
            </div>
          )}
        </div>
      </TestCard>

      <TestCard title="Loading spinner">
        <p>A spinner shows for 3 seconds. Then the result shows.</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setLoaded(false);
            restart(
              loadTimer,
              () => {
                setLoading(false);
                setLoaded(true);
              },
              SPINNER_DELAY,
            );
          }}
        >
          Start loading
        </button>
        <div className="dynamic-area" aria-busy={loading}>
          {loading && (
            <div className="spinner" role="status" data-testid="loading-spinner">
              <span className="spinner-icon" aria-hidden="true" />
              Loading...
            </div>
          )}
          {loaded && (
            <div className="dynamic-element" data-testid="loading-result">
              Loading complete!
            </div>
          )}
        </div>
      </TestCard>

      <TestCard title="Toast notification">
        <p>A confirmation that goes away by itself after 3 seconds.</p>
        <button
          type="button"
          onClick={() => {
            setToast(true);
            restart(toastTimer, () => setToast(false), TOAST_DELAY);
          }}
        >
          Save draft
        </button>
        {toast && (
          <div className="toast" role="status" data-testid="toast">
            ✓ Draft saved
          </div>
        )}
      </TestCard>

      <TestCard title="Hidden or removed">
        <p>
          Both elements leave the view, but in different ways. The page removes one of them. The other stays in the page,
          hidden.
        </p>
        <div className="disappear-grid">
          <div>
            {!removed && (
              <div className="dynamic-element" data-testid="disappearing-element">
                This element will disappear.
              </div>
            )}
            <button type="button" className="danger" onClick={() => setRemoved(true)} disabled={removed}>
              Remove element
            </button>
            {removed && <div className="result">Element has been removed.</div>}
          </div>
          <div>
            <div className="dynamic-element" data-testid="hidden-element" hidden={hidden}>
              This element will be hidden.
            </div>
            <button type="button" className="secondary" onClick={() => setHidden(true)} disabled={hidden}>
              Hide element
            </button>
            {hidden && <div className="result">Element is hidden but still in the page.</div>}
          </div>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setRemoved(false);
              setHidden(false);
            }}
          >
            Reset both
          </button>
        </div>
      </TestCard>
    </div>
  );
}
