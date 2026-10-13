import type { PageModule } from "../../pageTypes";
import actionsSolution from "../../../e2e/keyboard/actions.spec.ts?raw";
import dragSolution from "../../../e2e/keyboard/drag-and-drop.spec.ts?raw";
import mouseSolution from "../../../e2e/keyboard/mouse-actions.spec.ts?raw";
import KeyboardActions from "./KeyboardActions";
import DragAndDrop from "./DragAndDrop";
import MouseActions from "./MouseActions";
import "./keyboard.css";

export const pages: Record<string, PageModule> = {
  "/keyboard/actions": {
    Component: KeyboardActions,
    brief: {
      goal: "Use the page with the keyboard only: typing, Tab order, shortcuts and held keys.",
      steps: [
        'Type "Playwright" key by key. Check the value and "Keystrokes: 10". Then use fill() on the field and check that the count does not change.',
        'Press Home, type "I love ", and check that the value is "I love Playwright". Clear the field with ControlOrMeta+A and Delete.',
        "Start in Full name and press Tab. Check that focus moves to Email, Gift wrap, Standard and Save, in this order.",
        "Tick Gift wrap with Space, choose Overnight with the arrow keys, press Enter in a text field, and check the saved message.",
        'Check that "Clear form" works with a click, but Tab never reaches it.',
        'Press / and check that the search field has focus. Open the command palette with ControlOrMeta+K, choose "Show shortcuts" with the arrow keys and Enter, and check the result. Open it again and close it with Escape.',
        'Hold Shift with keyboard.down(). Check "Shift is held", click Delete, and check that the file is deleted permanently. Release Shift and check that a normal Delete moves the file to the trash.',
      ],
      apis: [
        "pressSequentially()",
        "fill()",
        "press()",
        "keyboard.press()",
        "'ControlOrMeta+A'",
        "toBeFocused",
        "keyboard.down()",
        "keyboard.up()",
      ],
      hint: "fill() fires no key events. An app that counts keystrokes sees only pressSequentially(). In a radio group, Tab goes to the checked option only. The arrow keys move between the options. Send shortcuts to page.keyboard, not to a locator.",
    },
    solution: actionsSolution,
  },
  "/keyboard/drag-and-drop": {
    Component: DragAndDrop,
    brief: {
      goal: "Drag with dragTo(), with mouse moves in steps, and with the keyboard.",
      steps: [
        'Drag "Drag me" onto the drop target with dragTo(). Check that both show success.',
        "Try dragTo() on the sortable list and see that the order does not change. Then move Deploy to the top with page.mouse in steps, and check the new order.",
        'Move "Write tests" down two places with the keyboard: Space, ArrowDown two times, Space. Check the order and the status message.',
        'Drag "Write release notes" to the Done column. Check that the card is in Done and that the counts of both columns changed.',
      ],
      apis: [
        "dragTo()",
        "mouse.down()",
        "mouse.move({ steps })",
        "mouse.up()",
        "boundingBox()",
        "press('Space')",
        "toHaveText([...])",
      ],
      hint: 'The sortable list starts a drag only after the pointer moves. Then it tracks the pointer on later moves. dragTo() moves one time, so the list never sees the target. Use several mouse.move() steps. The handles are buttons named "Reorder <task>".',
    },
    solution: dragSolution,
  },
  "/keyboard/mouse-actions": {
    Component: MouseActions,
    brief: {
      goal: "Use the low-level mouse: modifier clicks, positions, drawing, the wheel and a slider.",
      steps: [
        "Click budget.xlsx, Shift+click notes.txt, and check that 4 files are selected. ControlOrMeta+click logo.png and check that 3 files stay selected.",
        "Select seats B3 and D6 with clicks at positions on the seat map, and check the selection. Click A1 and check that it is taken.",
        "Draw a short line on the signature pad and check that it is too short. Clear the pad, draw a longer line in steps, and check that it is accepted.",
        'Hover the zoom box and scroll the wheel up 3 times. Check "Zoom: 130%". Scroll down to the minimum and check 50%.',
        "Drag the Volume handle to 80% of the track width and check that aria-valuenow is 80. Then press ArrowLeft and check that it is 70.",
      ],
      apis: [
        "click({ modifiers })",
        "click({ position })",
        "boundingBox()",
        "mouse.down()",
        "mouse.move({ steps })",
        "mouse.wheel()",
        "toHaveAttribute",
      ],
      hint: "A seat (row r, number n, both counted from 1) has its centre at x = 50n − 10, y = 50r − 10 inside the map. position is relative to the element. page.mouse is relative to the page, so add the boundingBox() of the element.",
    },
    solution: mouseSolution,
  },
};
