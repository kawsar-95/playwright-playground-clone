import type { PageModule } from "../../pageTypes";
import "./debugging.css";
import Failures from "./Failures";
import Trace from "./Trace";
import Toolkit from "./Toolkit";
import failuresSolution from "../../../e2e/debugging/failures.spec.ts?raw";
import traceSolution from "../../../e2e/debugging/trace.spec.ts?raw";
import toolkitSolution from "../../../e2e/debugging/toolkit.spec.ts?raw";

export const pages: Record<string, PageModule> = {
  "/debugging/failures": {
    Component: Failures,
    solution: failuresSolution,
    brief: {
      goal: "Read five different Playwright errors. Fix each test from what its error says.",
      steps: [
        "Copy the five failing tests from the lesson. Run them with a short timeout.",
        "Test 1: read the strict mode violation. Limit the Save button to the Profile form.",
        "Test 2: read the call log to see why the click waits. Do first what a user does first.",
        "Test 3: find the element that intercepts the click. Remove it from the way.",
        "Test 4: compare the expected text and the received text in the diff. Fix the assertion.",
        'Test 5: use the error context or the screenshot to tell "wrong locator" from "too slow". Fix the test.',
      ],
      apis: ["error messages", "call log", "error-context", "screenshot: 'only-on-failure'", "--timeout", "toBeVisible({ timeout })"],
      hint: "An assertion reads the text in the page, not the text that CSS shows. Only one of the five failures is about time.",
    },
  },
  "/debugging/trace": {
    Component: Trace,
    solution: traceSolution,
    brief: {
      goal: "Find a bug that only an automated test hits. Use a trace, not guesses.",
      steps: [
        "Write a test that opens the page and clicks Pay now. Assert that the payment is received. Watch the test fail.",
        "Run the test with --trace on. Open the trace.",
        "In the network tab, find the failed payment request: its status, the total that it sent, and its X-Request-Id header.",
        "In the console tab, find the error code that the app logged.",
        "Compare the snapshots before the click. What did the page show for shipping and for the total?",
        "Fill in the bug report on the page with what you found. Check your answers.",
        "Fix the test. It must wait for the real total before it pays. Assert the order number.",
      ],
      apis: ["--trace on", "npx playwright show-trace", "trace.playwright.dev", "UI mode", "toHaveText", "page.waitForResponse()"],
      hint: "Playwright clicks when the button is enabled. That is much faster than a person. What is not loaded at that time?",
    },
  },
  "/debugging/toolkit": {
    Component: Toolkit,
    solution: toolkitSolution,
    brief: {
      goal: "Use the debugging tools to find the errors behind a screen that says everything worked.",
      steps: [
        'Add a note and sync. Assert "All notes synced". The test passes. Now find what it missed.',
        "Listen for console messages and page errors. Add two more notes and an untitled note. Sync and collect what happens.",
        "Answer the three questions on the page from what you collected.",
        "Write an automatic fixture that fails any test when the page throws an uncaught error.",
        "Group the test into steps with test.step(). Attach the console log with testInfo.attach().",
        "Pause the test with page.pause() and try a locator in the Inspector. Record the same flow with codegen and compare its locators with yours.",
      ],
      apis: ["page.on('console')", "page.on('pageerror')", "test.extend({ auto: true })", "test.step()", "testInfo.attach()", "page.pause()", "codegen"],
      hint: "The page error is thrown after the screen updates. Wait for the sync result before you check what you collected. Warnings are usually noise. Errors usually are not.",
    },
  },
};
