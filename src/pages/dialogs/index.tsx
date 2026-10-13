import type { PageModule } from "../../pageTypes";
import JavaScriptDialogs from "./JavaScriptDialogs";
import ModalsOverlays from "./ModalsOverlays";
import TabsWindows from "./TabsWindows";
import NewWindowContent from "./NewWindowContent";
import NewTabContent from "./NewTabContent";
import Report from "./Report";
import javascriptSolution from "../../../e2e/dialogs/javascript.spec.ts?raw";
import modalSolution from "../../../e2e/dialogs/modal.spec.ts?raw";
import windowsSolution from "../../../e2e/dialogs/windows.spec.ts?raw";
import "./dialogs.css";

export const pages: Record<string, PageModule> = {
  "/dialogs/javascript": {
    Component: JavaScriptDialogs,
    brief: {
      goal: "Handle native alert, confirm and prompt dialogs, also when they come in pairs, come late, or appear when you leave.",
      steps: [
        "Trigger the alert, assert its message and accept it.",
        "Accept the confirm and assert the result. Then dismiss it and assert again.",
        'Answer the prompt with your name and assert the greeting. Then accept the prompt with its default value and assert "Hello, Guest".',
        "Delete budget.xlsx and assert that it is gone from the list. Then click Delete for notes.txt without a handler. What happens?",
        'Delete the account. Answer both dialogs and assert "Account deleted".',
        "Start a session and keep it alive when the warning appears.",
        'Type a note, then close the page and dismiss the "Leave site?" warning. Assert that the page is still open.',
      ],
      apis: [
        "page.once('dialog')",
        "page.on('dialog')",
        "dialog.type()",
        "dialog.defaultValue()",
        "dialog.accept(text)",
        "dialog.dismiss()",
        "page.waitForEvent('dialog')",
        "page.close({ runBeforeUnload: true })",
      ],
      hint: "If you register no handler, Playwright dismisses each dialog. A confirm then answers Cancel. page.once() handles only the next dialog, and Delete account opens two.",
    },
    solution: javascriptSolution,
  },
  "/dialogs/modal": {
    Component: ModalsOverlays,
    brief: {
      goal: "Test modals that are part of the page: native and custom, stacked, and one that interrupts you.",
      steps: [
        "Rename the project in the native dialog and assert the new name. Open it again and close it with Escape.",
        "While the native dialog is open, show that the button behind it cannot be clicked.",
        "Open Invite teammate and assert that the Email field has focus. Submit the empty form and assert the error.",
        "Send an invite as Editor. Assert that both buttons are disabled while it sends. Then assert the result.",
        "Open it again and press Tab after the last button. Assert that focus goes back to Email. Close the modal and assert that focus returns to Invite teammate.",
        "Edit the post, change the title and click Cancel. Assert that both dialogs are open. Choose Keep editing, then Cancel again and Discard.",
        'Add two products to the cart and assert "2 items". The newsletter popup appears at a random time. Your test must pass every time.',
      ],
      apis: [
        "getByRole('dialog', { name })",
        "toBeFocused",
        "keyboard.press('Escape')",
        "click({ trial: true })",
        "toBeDisabled",
        "page.addLocatorHandler()",
        "--repeat-each",
      ],
      hint: "In the post editor, two dialogs are open at the same time, and both have a Close button. Scope each locator to the dialog you mean. For the shop, run the test with --repeat-each=10 to see how often the popup is in the way.",
    },
    solution: modalSolution,
  },
  "/dialogs/windows": {
    Component: TabsWindows,
    brief: {
      goal: "Work with several pages at the same time: new tabs, popups, a sign-in window and tabs that share storage.",
      steps: [
        "Open the help article, catch the new tab and assert its heading. Assert that the original page did not move.",
        "Open the preview window. Close it with its own Close window button and wait for the close event.",
        "Sign in with Acme ID in the popup. Assert that the popup closed and that the page shows who signed in.",
        'Open the popup again and close it without an answer. Assert "Sign-in cancelled".',
        "Open all three reports. Use context.pages() to assert that four pages are open and to find the Traffic report.",
        "Open a second page in the same context and mark all messages as read there. Assert that the first page shows 0.",
      ],
      apis: [
        "page.waitForEvent('popup')",
        "popup.waitForEvent('close')",
        "context.pages()",
        "context.on('page')",
        "context.newPage()",
      ],
      hint: "Start to wait for the popup before the click that opens it. Pages in one browser context share localStorage. Pages in different contexts do not.",
    },
    solution: windowsSolution,
  },
  "/dialogs/new-window-content": { Component: NewWindowContent },
  "/dialogs/new-tab-content": { Component: NewTabContent },
  "/dialogs/report": { Component: Report },
};
