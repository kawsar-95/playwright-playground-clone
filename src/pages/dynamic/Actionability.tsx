import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const PREPARE_DELAY = 2000;
const OVERLAY_DELAY = 2500;

export default function Actionability() {
  const { later } = useTimers();
  const [preparing, setPreparing] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitResult, setSubmitResult] = useState("");
  const [overlay, setOverlay] = useState(false);
  const [exportResult, setExportResult] = useState("");
  const [offerShown, setOfferShown] = useState(false);
  const [offerResult, setOfferResult] = useState("");
  const [scrollResult, setScrollResult] = useState("");

  return (
    <div className="dynamic-page">
      <PageHeader title="Actionability">
        Buttons that exist but cannot be clicked yet: disabled, covered, moving or out of view.
      </PageHeader>

      <Lesson title="What Playwright waits for before it acts">
        <h3>Actionability checks</h3>
        <p>
          Before <code>click()</code>, Playwright waits until the element is:
        </p>
        <ul>
          <li>
            <strong>visible</strong>: it has a size and it is not hidden;
          </li>
          <li>
            <strong>stable</strong>: it does not move and it does not animate;
          </li>
          <li>
            <strong>receiving events</strong>: no other element covers it;
          </li>
          <li>
            <strong>enabled</strong>: it is not disabled.
          </li>
        </ul>
        <p>
          Playwright also scrolls the element into view. So a plain <code>click()</code> works for every control on this
          page. Playwright does the waiting. You write no extra code:
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Prepare order' }).click();
// "Submit order" is disabled for 2 seconds. click() waits for it.
await page.getByRole('button', { name: 'Submit order' }).click();
`}</Code>
        <h3>Read the error when the element never becomes ready</h3>
        <p>If the wait ends, the error names the check that failed. For example:</p>
        <Code>{`
- element is not enabled
- <div class="loading-overlay">…</div> intercepts pointer events
- element is not stable
`}</Code>
        <p>This message tells you about your app. It does not only tell you about your test.</p>
        <h3>Why force: true is a trap</h3>
        <p>
          <code>click({"{ force: true }"})</code> skips the checks. It clicks at the position of the element. If an overlay
          is on top, the click goes to the overlay. <em>Nothing happens</em>, but the test step passes. Try it on the
          Export button while the overlay shows. Then assert the result.
        </p>
        <Code>{`
await page.getByRole('button', { name: 'Refresh data' }).click();
await page.getByRole('button', { name: 'Export' }).click({ force: true });
await expect(page.getByTestId('export-result')).toHaveCount(0); // nothing was exported
`}</Code>
        <div className="lesson-callout">
          Use <code>force</code> only if you know why the check fails and a real user could still do the action. This is
          rare.
        </div>
      </Lesson>

      <TestCard title="Enabled after a delay">
        <p>&quot;Submit order&quot; becomes enabled 2 seconds after you prepare the order.</p>
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setPreparing(true);
              setCanSubmit(false);
              setSubmitResult("");
              later(() => {
                setPreparing(false);
                setCanSubmit(true);
              }, PREPARE_DELAY);
            }}
            disabled={preparing}
          >
            Prepare order
          </button>
          <button type="button" disabled={!canSubmit} onClick={() => setSubmitResult("Order submitted")}>
            Submit order
          </button>
        </div>
        {preparing && (
          <div className="result" role="status">
            Preparing...
          </div>
        )}
        {submitResult && (
          <div className="result success" data-testid="submit-result">
            {submitResult}
          </div>
        )}
      </TestCard>

      <TestCard title="Covered by an overlay">
        <p>Refresh puts a loading overlay on the panel for 2.5 seconds.</p>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setOverlay(true);
            setExportResult("");
            later(() => setOverlay(false), OVERLAY_DELAY);
          }}
          disabled={overlay}
        >
          Refresh data
        </button>
        <div className="overlay-panel">
          <p>Monthly report · 1,284 rows</p>
          <button type="button" onClick={() => setExportResult("Report exported")}>
            Export
          </button>
          {overlay && (
            <div className="loading-overlay" aria-hidden="true">
              Refreshing...
            </div>
          )}
        </div>
        {exportResult && (
          <div className="result success" data-testid="export-result">
            {exportResult}
          </div>
        )}
      </TestCard>

      <TestCard title="Moving into place">
        <p>The offer slides in over 1.5 seconds.</p>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setOfferShown(true);
            setOfferResult("");
          }}
        >
          Show offer
        </button>
        <div className="slide-track">
          {offerShown && (
            <button type="button" className="slide-in" onClick={() => setOfferResult("Offer claimed")}>
              Claim offer
            </button>
          )}
        </div>
        {offerResult && (
          <div className="result success" data-testid="offer-result">
            {offerResult}
          </div>
        )}
      </TestCard>

      <TestCard title="Out of view">
        <p>The button is at the bottom of a box that scrolls.</p>
        <div className="scroll-box" tabIndex={0} aria-label="Terms and conditions" role="region">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>Section {i + 1}. These terms are long on purpose, so the button below starts out of view.</p>
          ))}
          <button type="button" onClick={() => setScrollResult("Terms accepted")}>
            Accept terms
          </button>
        </div>
        {scrollResult && (
          <div className="result success" data-testid="scroll-result">
            {scrollResult}
          </div>
        )}
      </TestCard>
    </div>
  );
}
