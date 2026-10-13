import type { PageModule } from "../../pageTypes";
import "./content.css";
import Attributes from "./Attributes";
import Properties from "./Properties";
import AriaWidgets from "./AriaWidgets";
import ShadowDom from "./ShadowDom";
import PageAudit from "./PageAudit";
import attributesSolution from "../../../e2e/content/attributes.spec.ts?raw";
import propertiesSolution from "../../../e2e/content/properties.spec.ts?raw";
import ariaWidgetsSolution from "../../../e2e/content/aria-widgets.spec.ts?raw";
import shadowDomSolution from "../../../e2e/content/shadow-dom.spec.ts?raw";
import pageAuditSolution from "../../../e2e/content/page-audit.spec.ts?raw";

export const pages: Record<string, PageModule> = {
  "/content/attributes": {
    Component: Attributes,
    solution: attributesSolution,
    brief: {
      goal: "Assert the text, the values, the attributes and the state of elements.",
      steps: [
        "Assert the text of the paragraph in full. Then assert a part of it.",
        'Assert that the nested text reads "Hello Playwright", although a bold tag splits it.',
        "Assert the value of the input and assert that the input is not editable.",
        "Assert the href, target, id, class and accessible name of the link.",
        "Assert that one button is enabled and the other button is disabled.",
      ],
      apis: [
        "toHaveText",
        "toContainText",
        "toHaveValue",
        "toBeEditable",
        "toHaveAttribute",
        "toHaveId",
        "toHaveClass",
        "toHaveAccessibleName",
      ],
      hint: 'The link has an aria-label, so its accessible name is not the same as its visible text. Which of the two does getByRole("link", { name }) use?',
    },
  },
  "/content/properties": {
    Component: Properties,
    solution: propertiesSolution,
    brief: {
      goal: "Tell an HTML attribute from a live property, and read data attributes.",
      steps: [
        'Type a new nickname. Assert that getAttribute("value") still returns the old value and that toHaveValue() returns the new one.',
        "Uncheck the product updates checkbox. Assert that the checked attribute is still there but the box is not checked.",
        "Assert that the work email field is required and the nickname field is not.",
        "Buy the mouse twice. After each purchase, assert data-stock and data-status. Then read all data attributes at once.",
        "Compare the href attribute of the link with its href property.",
      ],
      apis: ["getAttribute()", "toHaveJSProperty()", "toHaveAttribute(name)", "evaluate()", "dataset"],
      hint: "toHaveAttribute() with only a name checks that the attribute exists. In evaluate(), el.dataset gives all data-* attributes as one object.",
    },
  },
  "/content/aria-widgets": {
    Component: AriaWidgets,
    solution: ariaWidgetsSolution,
    brief: {
      goal: "Find widgets by their ARIA state and assert a whole structure with an aria snapshot.",
      steps: [
        "Use { selected: true } to assert the selected tab. Then change tabs with the arrow keys.",
        "Open one accordion question. Assert that exactly one question is expanded and that its answer is visible.",
        "Turn on Bold and Underline. Assert their pressed state and the formats line.",
        "Count the headings of level 3.",
        "Get an aria snapshot of the tab list with ariaSnapshot(). Turn it into a toMatchAriaSnapshot() assertion.",
      ],
      apis: ["{ selected }", "{ expanded }", "{ pressed }", "{ level }", "toMatchAriaSnapshot()", "ariaSnapshot()"],
      hint: "Run console.log(await locator.ariaSnapshot()) one time to see the YAML of an element. Then keep only the lines that your test needs.",
    },
  },
  "/content/shadow-dom": {
    Component: ShadowDom,
    solution: shadowDomSolution,
    brief: {
      goal: "Work with web components that have open and closed shadow roots.",
      steps: [
        "Follow Ada Lovelace (not Grace Hopper). Assert that her button now says Following.",
        "Assert that the page lists Ada as followed.",
        "Show that an XPath locator finds no buttons in the cards, but CSS and role locators find them.",
        "Assert that the Mentor badge is visible. Explain why XPath can find it.",
        "Unlock the closed widget. Assert its data-state and the status line.",
      ],
      apis: ["locator('user-card')", "filter({ hasText })", "xpath=", "boundingBox()", "page.mouse.click()"],
      hint: "Role and CSS locators look into open shadow roots by themselves. Nothing can look into a closed root. Use the outer element: its attributes, and a click inside its bounding box.",
    },
  },
  "/content/page-audit": {
    Component: PageAudit,
    solution: pageAuditSolution,
    brief: {
      goal: "Write automatic checks that find each deliberate problem on this page.",
      steps: [
        "Assert the page title, the meta description and the lang attribute of the html element.",
        "Find the image that has no alt attribute.",
        "Wait until all images finish loading. Then find the broken image.",
        "Request each link to the same site. Report the broken links with expect.soft().",
        'Find the link that opens a new tab and has no rel="noopener".',
        "Find the heading level that the release notes skip.",
      ],
      apis: ["toHaveTitle", "expect.soft()", "request.get()", "evaluateAll()", "naturalWidth", "expect.poll()"],
      hint: "A broken image is still a visible element, so check naturalWidth. A soft assertion lets one test report all broken links. It does not stop at the first one.",
    },
  },
};
