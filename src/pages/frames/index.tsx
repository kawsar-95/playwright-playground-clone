import type { PageModule } from "../../pageTypes";
import iframeSolution from "../../../e2e/frames/iframe.spec.ts?raw";
import nestedSolution from "../../../e2e/frames/nested.spec.ts?raw";
import embedsSolution from "../../../e2e/frames/embeds.spec.ts?raw";
import IframeBasics from "./IframeBasics";
import NestedFrames from "./NestedFrames";
import EmbeddedWidgets from "./EmbeddedWidgets";
import "./frames.css";

export const pages: Record<string, PageModule> = {
  "/frames/iframe": {
    Component: IframeBasics,
    brief: {
      goal: "Enter an iframe, use the form inside it, and tell the frame element from its document.",
      steps: [
        "Fill in Name in the Embedded Form frame, submit it, and check the greeting inside the frame.",
        "Check that a getByText() locator on the page cannot see the greeting.",
        "Subscribe in the Newsletter signup frame with the weekly digest ticked, and check the confirmation.",
        'Check that the newsletter iframe element has src "/embeds/newsletter/". Reach the element from the frame with owner().',
      ],
      apis: ["contentFrame()", "frameLocator()", "getByTitle('Embedded Form')", "owner()", "toHaveAttribute"],
      hint: "Page locators do not search inside frames. Enter the frame first, then use the usual locators. Attributes such as src belong to the <iframe> element in the page, not to the document inside it.",
    },
    solution: iframeSolution,
  },
  "/frames/nested": {
    Component: NestedFrames,
    brief: {
      goal: "Reach a frame inside a frame, choose between identical frames, and find a frame with no title.",
      steps: [
        "Post a review in the Reviews frame. It is inside the Store frame. Check that the store now shows 3 reviews.",
        'Pay with card 4242 4242 4242 4242 in the Pro plan widget and check "Paid $15 for Pro". Check that the Basic plan widget shows nothing.',
        "Send a short card number in the Basic plan widget and check the error.",
        "Accept the terms in the frame that has no title, and check the result.",
        "Use page.frame({ name }) to get the Pro plan frame. Check that page.frames() has 6 frames (the page and 5 frames).",
      ],
      apis: ["contentFrame()", "getByRole('region', { name })", "page.frame()", "page.frames()", "locator('iframe[src=…]')"],
      hint: 'Both payment frames have the title "Payment", so page.getByTitle(\'Payment\') breaks strict mode. Limit the search to the region of the plan first. The terms frame has no title and no name, only a src.',
    },
    solution: nestedSolution,
  },
  "/frames/embeds": {
    Component: EmbeddedWidgets,
    brief: {
      goal: "Test embedded widgets the way real apps use them.",
      steps: [
        'Open the chat, wait for the late frame, send "Hi" and check the reply of the agent.',
        'Finish the three-step checkout. Check that the URL of the frame changes to step=2 and the URL of the page stays the same. Then check "Order 1042 confirmed" on the page.',
        "Delete the account inside Account settings. Accept the confirm dialog, then check its message and the result.",
        'Rate the sandboxed widget 4 stars. Check that the page says "You rated 4 out of 5" and that page script access is blocked.',
        "Replace the document of the Weather frame with page.route() so that it shows your own text, and check it.",
      ],
      apis: ["contentFrame()", "frame.url()", "expect.poll()", "page.on('dialog')", "page.route()", "route.fulfill()"],
      hint: "Frame locators wait for late frames and keep working after navigation inside the frame. Dialogs from frames reach page.on('dialog'). Set up routes before page.goto(), because the frame loads with the page.",
    },
    solution: embedsSolution,
  },
};
