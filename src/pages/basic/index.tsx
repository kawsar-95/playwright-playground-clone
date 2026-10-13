import type { PageModule } from "../../pageTypes";
import Buttons from "./Buttons";
import Inputs from "./Inputs";
import Checkboxes from "./Checkboxes";
import RadioButtons from "./RadioButtons";
import Dropdown from "./Dropdown";
import Hover from "./Hover";
import buttonsSolution from "../../../e2e/basic/buttons.spec.ts?raw";
import inputsSolution from "../../../e2e/basic/inputs.spec.ts?raw";
import checkboxesSolution from "../../../e2e/basic/checkboxes.spec.ts?raw";
import radioSolution from "../../../e2e/basic/radio-buttons.spec.ts?raw";
import dropdownSolution from "../../../e2e/basic/dropdown.spec.ts?raw";
import hoverSolution from "../../../e2e/basic/hover.spec.ts?raw";
import "./basic.css";

export const pages: Record<string, PageModule> = {
  "/basic/buttons": {
    Component: Buttons,
    brief: {
      goal: "Use the three kinds of click and check the result of each one.",
      steps: [
        'Click "Click me" and assert the result message.',
        'Click "Primary action" and assert that the message changed.',
        'Assert that "Disabled button" is disabled.',
        'Single-click "Double click me" and assert that the message did not change. Then double-click it and assert that the message changed.',
        'Right-click "Right click me" and assert the message.',
        'Assert that "Click me" has the secondary class and "Primary action" does not.',
        'Assert that "Primary action" has the accent background, rgb(47, 95, 208).',
      ],
      apis: [
        "getByRole",
        "{ exact: true }",
        "click()",
        "dblclick()",
        "click({ button: 'right' })",
        "toBeDisabled",
        "toHaveText",
        "toHaveClass",
        "toHaveCSS",
      ],
      hint: 'A name matches as a part of a longer name, and case does not matter. So "Click me" also matches "Double click me" and "Right click me". Use { exact: true }. toHaveCSS() reads the computed style. The browser always reports a colour as rgb(...), also when the CSS uses a hex value or a variable.',
    },
    solution: buttonsSolution,
  },
  "/basic/inputs": {
    Component: Inputs,
    brief: {
      goal: "Fill each input type and check the values that the page shows.",
      steps: [
        "Type a username and assert that the page shows it below the field.",
        "Fill email, password, number and date. Then assert the summary.",
        "Assert that the summary masks the password and does not show it as plain text.",
        "Set the range slider to 75. Assert the badge and the summary.",
        "Clear the email field and assert that the summary shows N/A again.",
      ],
      apis: ["getByLabel", "fill()", "clear()", "pressSequentially()", "toHaveValue"],
      hint: "A date input takes the format YYYY-MM-DD, also when the browser shows a different format. The label of the range input has its current value. Match it with a regular expression, for example /Range/.",
    },
    solution: inputsSolution,
  },
  "/basic/checkboxes": {
    Component: Checkboxes,
    brief: {
      goal: "Change the state of checkboxes and assert the inputs and the state summary.",
      steps: [
        "Check both checkboxes and assert that they are checked.",
        'Assert that the "Current state" card shows both as checked.',
        "Call check() on a box that is already checked. Assert that it is still checked.",
        "Uncheck the newsletter checkbox. Assert that only this checkbox changed.",
        "Use setChecked() with a boolean variable to set the terms checkbox.",
      ],
      apis: ["check()", "uncheck()", "setChecked()", "toBeChecked", "not.toBeChecked"],
      hint: "check() does nothing if the box is already checked. click() unchecks it. Which one makes a test more predictable?",
    },
    solution: checkboxesSolution,
  },
  "/basic/radio-buttons": {
    Component: RadioButtons,
    brief: {
      goal: "Select a radio option and check that the group allows only one selection.",
      steps: [
        "Assert that no browser is selected at the start.",
        "Select Firefox. Assert that it is checked and the other options are not.",
        "Select Safari. Assert that Firefox is not checked now.",
        "Assert that Internet Explorer is disabled.",
        "Assert all three enabled radio buttons together, with a loop or a list of names.",
      ],
      apis: ["getByRole('radio')", "check()", "toBeChecked", "not.toBeChecked", "toBeDisabled"],
      hint: "Call uncheck() on a radio button and read the error. Playwright refuses, because a user cannot do this action.",
    },
    solution: radioSolution,
  },
  "/basic/dropdown": {
    Component: Dropdown,
    brief: {
      goal: "Choose options in native selects and in a custom dropdown.",
      steps: [
        'Select "Germany" by its visible label and assert the result.',
        'Select "United States" by its value and assert the value of the select.',
        "Select English and Spanish in the languages list. Assert both with toHaveValues().",
        'Choose "Large" in the shirt-size dropdown and assert the result.',
        "Call selectOption() on the shirt-size dropdown and read why it fails.",
      ],
      apis: ["selectOption()", "toHaveValue", "toHaveValues", "getByRole('option')", "getByLabel"],
      hint: "selectOption() works only on a real <select> element. The shirt-size dropdown is a button and a list. Open it and click the option. Be careful: a native multi-select also has the listbox role. Give getByRole('listbox') a name.",
    },
    solution: dropdownSolution,
  },
  "/basic/hover": {
    Component: Hover,
    brief: {
      goal: "Trigger hover states, hover-only menus and tooltips.",
      steps: [
        "Hover the box and assert that the hover state is active.",
        "Move the mouse away and assert that the state is inactive again.",
        "Assert that the menu options are hidden. Hover the trigger. Then assert that the options are visible.",
        'Choose "Option 2" in the menu and assert the menu choice.',
        'Hover "Shipping info" and assert the tooltip text. Move away and assert that the tooltip is gone.',
      ],
      apis: ["hover()", "toBeVisible", "toBeHidden", "getByRole('tooltip')", "toHaveAccessibleDescription"],
      hint: 'To stop a hover, hover a different element, for example the page heading. The text "Hover" is also in the headings "Basic hover" and "Hover menu". Match the page heading with exact: true.',
    },
    solution: hoverSolution,
  },
};
