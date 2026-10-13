import type { PageModule } from "../../pageTypes";
import "./dynamic.css";
import AppearDisappear from "./AppearDisappear";
import ChangingText from "./ChangingText";
import ProgressBar from "./ProgressBar";
import Actionability from "./Actionability";
import FlakyLab from "./FlakyLab";
import Clock from "./Clock";
import appearDisappearSolution from "../../../e2e/dynamic/appear-disappear.spec.ts?raw";
import changingTextSolution from "../../../e2e/dynamic/changing-text.spec.ts?raw";
import progressBarSolution from "../../../e2e/dynamic/progress-bar.spec.ts?raw";
import actionabilitySolution from "../../../e2e/dynamic/actionability.spec.ts?raw";
import flakyLabSolution from "../../../e2e/dynamic/flaky-lab.spec.ts?raw";
import clockSolution from "../../../e2e/dynamic/clock.spec.ts?raw";

export const pages: Record<string, PageModule> = {
  "/dynamic/appear-disappear": {
    Component: AppearDisappear,
    brief: {
      goal: "Wait for elements to appear and to disappear. Do not use a fixed sleep.",
      steps: [
        'Click "Show element" and assert that the delayed element appears.',
        'Click "Load slowly" and make the assertion pass. The element needs 7 seconds, which is longer than the default timeout.',
        "Start loading. Assert that the spinner appears, then disappears, then the result shows.",
        "Save a draft. Assert that the toast appears and then goes away by itself.",
        "Remove one element and hide the other. Use toBeAttached() and toHaveCount(0) to show which element is still in the page.",
      ],
      apis: ["toBeVisible", "toBeHidden", "{ timeout }", "toBeAttached", "toHaveCount(0)"],
      hint: "toBeHidden() passes for the hidden element and for the removed element. Only toBeAttached() shows the difference.",
    },
    solution: appearDisappearSolution,
  },
  "/dynamic/changing-text": {
    Component: ChangingText,
    brief: {
      goal: "Assert text that changes over time, or that is different on every run.",
      steps: [
        "Run the job. Assert each status in order: Queued, Running, Passed.",
        "Write the flaky version that reads textContent() one time. Watch it fail.",
        "Place an order. Assert the format of the confirmation with a regular expression.",
        "Read the order ID from the confirmation. Place a second order and assert that it has a different ID.",
      ],
      apis: ["toHaveText", "toHaveText(/regex/)", "textContent()", "web-first assertions"],
      hint: "await expect(locator).toHaveText() retries. expect(await locator.textContent()) reads one time. Read the text only after an assertion shows that it is stable.",
    },
    solution: changingTextSolution,
  },
  "/dynamic/progress-bar": {
    Component: ProgressBar,
    brief: {
      goal: "Wait until a value reaches a threshold. Then act at the right time.",
      steps: [
        "Start the progress. Assert that the start button is disabled while the bar runs.",
        "Let the bar finish. Assert that aria-valuenow is 100 and that the result says Completed.",
        "Start again. Click Stop when the bar is at 70% or more. Assert that the stopped value is between 70% and 95%.",
      ],
      apis: ["getByRole('progressbar')", "toHaveAttribute", "expect.poll()", "intervals"],
      hint: "Poll aria-valuenow with a short interval, for example intervals: [50]. The default intervals are slow, so the bar can reach 100% between two checks.",
    },
    solution: progressBarSolution,
  },
  "/dynamic/actionability": {
    Component: Actionability,
    brief: {
      goal: "Learn what Playwright waits for before it clicks, and what force: true hides.",
      steps: [
        'Prepare the order. Click "Submit order" and do not check first that it is enabled.',
        "Refresh the data. Click Export while the overlay still shows. Assert that the export worked.",
        "Do it again, but click with force: true while the overlay shows. Assert that nothing was exported.",
        "Show the offer. Claim it while it still slides in.",
        "Accept the terms at the bottom of the scroll box. Do not scroll by hand.",
        'Click "Submit order" before you prepare the order, with a timeout of 1 second. Read which check failed.',
      ],
      apis: ["click()", "actionability checks", "{ force: true }", "{ timeout }", "scrollIntoViewIfNeeded()"],
      hint: "A plain click() waits until the element is visible, stable, enabled and not covered. It also scrolls by itself. When the timeout ends, the error message names the check that failed.",
    },
    solution: actionabilitySolution,
  },
  "/dynamic/flaky-lab": {
    Component: FlakyLab,
    brief: {
      goal: "Write tests that pass every time. Then prove it with many runs.",
      steps: [
        "Fetch the report and assert that it appears. Run the test with --repeat-each=20 and fix it until it never fails.",
        'Select "Beta" in the list that renders again. Assert the selection. Make the test reliable although the list changes order every second.',
        "Pick Beta with nth() by position. Watch it select the wrong service.",
        'Click "Quick save" and wait for its response. Do not create a race.',
        "Put a click and its assertion in expect(...).toPass(). Explain when this is the right tool.",
      ],
      apis: ["--repeat-each", "{ timeout }", "filter({ hasText })", "page.waitForResponse()", "toPass()"],
      hint: "The report can take 7 seconds, which is longer than the default timeout of 5 seconds. For the list, find the row by its text and not by its position. For the response, create the promise before the click.",
    },
    solution: flakyLabSolution,
  },
  "/dynamic/clock": {
    Component: Clock,
    brief: {
      goal: "Test behavior that depends on time at once, and content that depends on the date on any day.",
      steps: [
        "Install the fake clock and start a session. Assert that the countdown starts at 2:00.",
        "Fast-forward 90 seconds. Assert that 0:30 remains.",
        "Fast-forward to the end. Assert the session-expired alert.",
        "Set the date to a Saturday and assert the weekend sale. Then set the date to a Monday and assert that there is no promotion.",
      ],
      apis: ["page.clock.install()", "page.clock.fastForward()", "page.clock.runFor()", "page.clock.setFixedTime()"],
      hint: "Install the clock, or set the date, before page.goto(). The page reads the date and creates its timers when it loads.",
    },
    solution: clockSolution,
  },
};
