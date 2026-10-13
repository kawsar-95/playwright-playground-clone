import { useEffect, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const initialFiles = ["report.pdf", "budget.xlsx", "notes.txt"];
const SESSION_WARNING_DELAY = 2000;

type SessionState = "idle" | "waiting" | "extended" | "signed out";

export default function JavaScriptDialogs() {
  const { later } = useTimers();
  const [result, setResult] = useState("");
  const [files, setFiles] = useState(initialFiles);
  const [fileResult, setFileResult] = useState<string | null>(null);
  const [accountResult, setAccountResult] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState>("idle");
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const dirty = draft !== saved;

  // Ask the browser to show the "Leave site?" warning while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const showAlert = () => {
    window.alert("This is an alert dialog");
    setResult("Alert was displayed");
  };

  const showConfirm = () => {
    setResult(window.confirm("Do you want to continue?") ? "Confirm accepted" : "Confirm dismissed");
  };

  const showPrompt = () => {
    const answer = window.prompt("What is your name?", "Guest");
    setResult(answer === null ? "Prompt dismissed" : `Hello, ${answer || "stranger"}`);
  };

  const deleteFile = (name: string) => {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      setFiles((list) => list.filter((f) => f !== name));
      setFileResult(`${name} deleted`);
    } else {
      setFileResult(`Kept ${name}`);
    }
  };

  const deleteAccount = () => {
    if (!window.confirm("Delete your account?")) {
      setAccountResult("Account kept");
      return;
    }
    const answer = window.prompt("Type DELETE to confirm.");
    setAccountResult(answer === "DELETE" ? "Account deleted" : "Account kept: confirmation did not match");
  };

  const startSession = () => {
    setSession("waiting");
    later(() => {
      const stay = window.confirm("Your session is about to expire. Stay signed in?");
      setSession(stay ? "extended" : "signed out");
    }, SESSION_WARNING_DELAY);
  };

  return (
    <>
      <PageHeader title="JavaScript Dialogs">
        The browser's own alert, confirm and prompt boxes, and the "Leave site?" warning. They are not part of the page. Handle
        them with events, not with locators.
      </PageHeader>
      <Lesson title="Handling native dialogs">
        <h3>Register the handler first</h3>
        <p>
          A native dialog blocks the page until someone answers it. You cannot click it. Listen for the <code>dialog</code> event{" "}
          <em>before</em> the action that opens the dialog. Then accept or dismiss the dialog.
        </p>
        <Code>{`
page.once('dialog', async (dialog) => {
  expect(dialog.message()).toBe('Do you want to continue?');
  await dialog.accept();          // or dialog.dismiss()
});
await page.getByRole('button', { name: 'Confirm' }).click();
`}</Code>
        <div className="lesson-callout">
          If you register no handler, Playwright <strong>dismisses</strong> each dialog. A confirm then returns <code>false</code>,
          and the app takes the "Cancel" path without a sound. Your test can still pass, unless you assert the result.
        </div>
        <h3>Prompts</h3>
        <p>
          <code>dialog.accept('Ada')</code> types an answer. <code>dialog.accept()</code> with no text answers with an <em>empty</em>{" "}
          string, not with the pre-filled value. The pre-filled value is in <code>dialog.defaultValue()</code>.
        </p>
        <h3>More than one dialog</h3>
        <p>
          <code>page.once()</code> handles only the next dialog. If one action opens several dialogs, use <code>page.on()</code>.
          Decide with <code>dialog.type()</code>. Then remove the handler with <code>page.off()</code>.
        </p>
        <Code>{`
const handler = async (dialog: Dialog) => {
  if (dialog.type() === 'confirm') await dialog.accept();
  else if (dialog.type() === 'prompt') await dialog.accept('DELETE');
};
page.on('dialog', handler);
await page.getByRole('button', { name: 'Delete account' }).click();
page.off('dialog', handler);
`}</Code>
        <h3>Wait for a dialog</h3>
        <p>If you need the dialog object, wait for the event. Start to wait before the action, as for downloads and popups.</p>
        <Code>{`
const dialogPromise = page.waitForEvent('dialog');
await page.getByRole('button', { name: 'Start session' }).click();
const dialog = await dialogPromise;
await dialog.accept();
`}</Code>
        <h3>"Leave site?"</h3>
        <p>
          A <code>beforeunload</code> warning has the type <code>beforeunload</code>. When Playwright closes a page, it does not run
          these handlers, unless you ask for them.
        </p>
        <Code>{`
page.once('dialog', (dialog) => dialog.dismiss());   // stay on the page
await page.close({ runBeforeUnload: true });
`}</Code>
        <div className="lesson-callout">
          A browser shows this warning only after the user interacts with the page. First click into a field and type.
        </div>
      </Lesson>
      <TestCard title="Alert, confirm and prompt">
        <div className="button-row">
          <button type="button" onClick={showAlert}>
            Alert
          </button>
          <button type="button" onClick={showConfirm}>
            Confirm
          </button>
          <button type="button" onClick={showPrompt}>
            Prompt
          </button>
        </div>
        {result && (
          <p className="result" role="status" data-testid="dialog-result">
            {result}
          </p>
        )}
      </TestCard>
      <TestCard title="Delete a file">
        <p>Every delete asks for confirmation first.</p>
        <ul className="dialog-files" aria-label="Documents">
          {files.map((name) => (
            <li className="file-row" key={name}>
              <span>{name}</span>
              <button type="button" className="danger secondary" onClick={() => deleteFile(name)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
        {files.length === 0 && <p>No documents left.</p>}
        {fileResult && (
          <p className="result" role="status">
            {fileResult}
          </p>
        )}
      </TestCard>
      <TestCard title="Two dialogs in a row">
        <p>Deleting the account asks two times: a confirm, then a prompt.</p>
        <button type="button" className="danger" onClick={deleteAccount}>
          Delete account
        </button>
        {accountResult && (
          <p className="result" role="status">
            {accountResult}
          </p>
        )}
      </TestCard>
      <TestCard title="A dialog on a delay">
        <p>Two seconds after you start, the session warns that it is about to expire.</p>
        <button type="button" onClick={startSession} disabled={session === "waiting"}>
          Start session
        </button>
        {session !== "idle" && (
          <p className="result" role="status">
            {session === "waiting"
              ? "Session active"
              : session === "extended"
                ? "Session extended"
                : "Signed out: session expired"}
          </p>
        )}
      </TestCard>
      <TestCard title="Unsaved changes">
        <p>Type a note. Then try to reload the page or close the tab before you save.</p>
        <div className="form-group">
          <label htmlFor="draft-notes">Notes</label>
          <textarea id="draft-notes" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        <button type="button" onClick={() => setSaved(draft)} disabled={!dirty}>
          Save notes
        </button>
        <p className="result" data-testid="save-state">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </p>
      </TestCard>
    </>
  );
}
