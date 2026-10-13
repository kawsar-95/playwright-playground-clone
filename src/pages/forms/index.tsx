import type { PageModule } from "../../pageTypes";
import "./forms.css";
import Login from "./Login";
import Validation from "./Validation";
import Autocomplete from "./Autocomplete";
import FileUpload from "./FileUpload";
import FileDownload from "./FileDownload";
import Wizard from "./Wizard";
import loginSolution from "../../../e2e/forms/login.spec.ts?raw";
import validationSolution from "../../../e2e/forms/validation.spec.ts?raw";
import autocompleteSolution from "../../../e2e/forms/autocomplete.spec.ts?raw";
import fileUploadSolution from "../../../e2e/forms/file-upload.spec.ts?raw";
import fileDownloadSolution from "../../../e2e/forms/file-download.spec.ts?raw";
import wizardSolution from "../../../e2e/forms/wizard.spec.ts?raw";

export const pages: Record<string, PageModule> = {
  "/forms/login": {
    Component: Login,
    brief: {
      goal: "Test each path of a login form: required fields, a wrong password, a right password, the password toggle and the lockout. Sessions have their own page under Authentication.",
      steps: [
        "Submit the empty form. Assert both required-field errors and that both fields are aria-invalid.",
        "Sign in with a wrong password. Assert the error text, its error class and its red border, rgb(198, 40, 40).",
        "Sign in with the demo credentials and press Enter. Assert the success class and a green background, rgb(232, 245, 236).",
        "Assert that the password field is masked. Click Show password and assert that it is now plain text.",
        "Fail three times and assert that the form is locked. Do not wait 30 real seconds: assert that the form unlocks.",
      ],
      apis: ["getByLabel", "press('Enter')", "getByRole('alert')", "toHaveAttribute", "toHaveClass", "toHaveCSS", "toBeDisabled", "page.clock"],
      hint: "Show password is a toggle. It keeps its name and sets aria-pressed. For the lockout, call page.clock.install() before page.goto(). Then call page.clock.fastForward().",
    },
    solution: loginSolution,
  },
  "/forms/validation": {
    Component: Validation,
    brief: {
      goal: "Test validation rules where they run: on submit, on the server, when a field loses focus, and in the browser.",
      steps: [
        "Submit the empty registration form. Assert both errors through the fields.",
        "Try the ages 17, 18, 100 and 101. Assert which ones the form accepts.",
        "Register taken@example.com with a valid age. Assert the server error under Email.",
        "Assert that an invalid field has a red border, rgb(198, 40, 40), and that a valid submit removes it.",
        "Type a taken username (admin) and leave the field. Assert the error. Then mock the check so that any name is available.",
        "Type a password and watch the rules turn green. Make Confirm password different and assert the mismatch.",
        "Submit the empty Browser validation form. Assert through validity which fields block it.",
      ],
      apis: ["toHaveAccessibleDescription", "parameterized tests", "toHaveCSS", "blur()", "page.route()", "evaluate((input) => input.validity)", "locator(':invalid')"],
      hint: 'fill() does not leave the field. Call blur() or press Tab to start the checks that run on blur. getByLabel("Password") also matches "Confirm password", so add { exact: true }.',
    },
    solution: validationSolution,
  },
  "/forms/autocomplete": {
    Component: Autocomplete,
    brief: {
      goal: "Drive two comboboxes: one filters in the browser and one asks the server.",
      steps: [
        'Type "united". Assert the two country suggestions in order.',
        'Pick "United Kingdom" with the mouse. Assert the selection.',
        'Type "swe", choose the suggestion with the arrow keys and Enter, and assert the selection.',
        "Type text with no match. Assert the empty message and that no options show.",
        'Search the cities for "paris". Choose "Paris, France", not "Paris, United States".',
        'Count the requests to /api/cities while you type "london" fast. The debounce must send one.',
        "Mock the city API with an error. Assert the message. Then let Retry succeed.",
      ],
      apis: ["getByRole('combobox')", "getByRole('option')", "{ exact: true }", "press('ArrowDown')", "page.on('request')", "page.route()", "toHaveText([...])"],
      hint: 'The arrow keys move a highlight (aria-selected) while the focus stays in the input. Assert the highlighted option with toHaveAttribute("aria-selected", "true").',
    },
    solution: autocompleteSolution,
  },
  "/forms/file-upload": {
    Component: FileUpload,
    brief: {
      goal: "Upload files without the dialog of the operating system: plain inputs, checked files, hidden inputs, drop zones and a real upload.",
      steps: [
        "Upload a file from disk to Choose file. Assert that its name shows. Clear it and assert that the message disappears.",
        "Upload a small PNG made from a buffer as the profile photo. Assert the preview image.",
        "Upload a GIF and a 2 MB PNG. Assert each error message.",
        "Add two attachments with the Add files button and the file chooser.",
        "Drop a third file on the drop zone. Assert the list and the summary.",
        "Upload the files. Assert the number of bytes that the server reports.",
      ],
      apis: ["setInputFiles()", "{ name, mimeType, buffer }", "waitForEvent('filechooser')", "evaluateHandle()", "dispatchEvent('drop', { dataTransfer })", "page.waitForResponse()"],
      hint: "setInputFiles() ignores the accept attribute, as any user can. Buffer.alloc(2 * 1024 * 1024) makes a 2 MB file in memory. The attachments input is hidden: catch the filechooser when you click Add files.",
    },
    solution: fileUploadSolution,
  },
  "/forms/file-download": {
    Component: FileDownload,
    brief: {
      goal: "Catch downloads. Check their names and their content.",
      steps: [
        "Export the users as CSV. Assert the file name, the header and 4 user rows.",
        "Export JSON with the inactive users included. Parse it and assert 6 users.",
        "Download the sample report. Assert that it contains the test totals.",
        "Download the monthly report from the server. Assert that its name matches report-YYYY-MM.txt.",
        "Save one download in the output folder of the test with saveAs().",
      ],
      apis: ["waitForEvent('download')", "suggestedFilename()", "download.path()", "saveAs()", "JSON.parse", "toMatch(regex)"],
      hint: 'Start to wait before you click: const downloadPromise = page.waitForEvent("download"); then click; then await downloadPromise.',
    },
    solution: fileDownloadSolution,
  },
  "/forms/wizard": {
    Component: Wizard,
    brief: {
      goal: "Get through a three-step sign-up. Test what happens between the steps.",
      steps: [
        "Click Next on an empty first step. Assert both errors.",
        "Complete all steps with the Pro plan billed yearly. Assert the total, $120 per year, and the welcome message.",
        "On the Plan step, choose Team with 2 seats. Assert the seats error.",
        "Go back with page.goBack(). Assert that your name is still filled in.",
        "Reload in the middle of the form. Assert that the draft survived.",
        "Open ?step=3 directly in a new page. Assert that you land on step 1.",
        "From the review, use Edit plan to switch to Free. Assert the total.",
      ],
      apis: ["helper functions", "toHaveURL", "page.goBack()", "page.reload()", "getByRole('radio')", "getByRole('group')", "context.newPage()"],
      hint: 'Assert the heading of each step before you fill it. A radio name includes its whole label: "Yearly two months free" also matches "Free", so scope radios to their group. sessionStorage belongs to one tab: a new page in the same context starts without the draft.',
    },
    solution: wizardSolution,
  },
};
