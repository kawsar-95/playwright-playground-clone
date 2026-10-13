import type { PageModule } from "../../pageTypes";
import Challenges from "./Challenges";
import challengesSolution from "../../../e2e/locators/challenges.spec.ts?raw";
import "./locators.css";

export const pages: Record<string, PageModule> = {
  "/locators/challenges": {
    Component: Challenges,
    brief: {
      goal: "Target exactly one element in each section. Do not use CSS selectors or test ids.",
      steps: [
        'Add "Wireless Keyboard" to the cart. Two products have "Wireless" in the name and two have "Keyboard".',
        "Click Save in the Notification settings panel only. Assert that the correct panel reported back.",
        'Click the button with the exact name "Delete". Do not click "Delete all" or "Undo delete".',
        "Archive every Overdue task. Then assert that no Overdue badge remains and that the Done task is still there.",
        'Search the docs for "locators". Then click the settings icon button. Neither element has a text label.',
        "Assert that the logo image is visible.",
      ],
      apis: [
        "filter({ hasText })",
        "filter({ has })",
        "getByRole('region', { name })",
        "{ exact: true }",
        "getByPlaceholder",
        "getByTitle",
        "getByAltText",
        "toHaveCount",
      ],
      hint: "Archiving removes rows, so a list that you collected with all() becomes stale. Instead, click the first Overdue row while the filtered locator still matches an element. Then assert toHaveCount(0).",
    },
    solution: challengesSolution,
  },
};
