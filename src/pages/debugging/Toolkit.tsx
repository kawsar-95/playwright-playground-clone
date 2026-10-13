import { useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import Investigation, { type Question } from "./Investigation";
import { useLater } from "./useLater";

const FREE_PLAN_LIMIT = 3;
const SYNC_DELAY_MS = 600;

interface Note {
  id: number;
  /** An untitled note has no title. The sync code does not expect this. */
  title?: string;
}

const QUESTIONS: Question[] = [
  { label: "Free plan sync limit", check: (answer) => answer === String(FREE_PLAN_LIMIT) },
  {
    label: "Which property was the sync code reading when it crashed?",
    hint: "The page error says it.",
    check: (answer) => answer.replace(/['"]/g, "").toLowerCase() === "trim",
  },
  { label: "Which endpoint does the warning say the app uses?", check: (answer) => /legacy/i.test(answer) },
];

export default function Toolkit() {
  const later = useLater();
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: "Groceries" },
    { id: 2, title: "Ideas" },
  ]);
  const [title, setTitle] = useState("");
  const [sync, setSync] = useState<"idle" | "syncing" | "done">("idle");

  const addNote = (event: React.FormEvent) => {
    event.preventDefault();
    setNotes((list) => [...list, { id: Date.now(), title: title.trim() || undefined }]);
    setTitle("");
    setSync("idle");
  };

  const startSync = () => {
    setSync("syncing");
    console.warn("[sync] Using the legacy sync endpoint");
    later(() => {
      if (notes.length > FREE_PLAN_LIMIT) {
        console.error(`[sync] Free plan limit reached: only ${FREE_PLAN_LIMIT} notes were synced`);
      }
      // The bug: this runs after the screen shows "All notes synced". An untitled note has no
      // title, so the call below throws an uncaught TypeError. The user sees nothing.
      window.setTimeout(() => {
        notes.forEach((note) => (note.title as string).trim());
      });
      setSync("done");
    }, SYNC_DELAY_MS);
  };

  return (
    <>
      <PageHeader title="Debugging Toolkit">
        A notes app that always says the sync worked. It does not always work. Use the debugging tools of Playwright to find out
        what really happens.
      </PageHeader>

      <Lesson title="Tools for debugging a test">
        <h3>Stop and look around: page.pause()</h3>
        <p>
          Put <code>await page.pause()</code> in a test and run the test in headed mode. The Inspector opens. Step through the test
          one action at a time. Try locators on the live page.
        </p>
        <Code>{`
npx playwright test toolkit --headed     # page.pause() stops here
npx playwright test toolkit --debug      # stops before every action
`}</Code>
        <h3>Record a first draft: codegen</h3>
        <p>
          Codegen opens a browser and writes a test while you click. Use the result as a draft. Check each locator that it chose.
        </p>
        <Code>{`
npx playwright codegen https://playwright-playground.com/debugging/toolkit
`}</Code>
        <h3>Watch the console and the errors of the page</h3>
        <p>
          A page can throw errors and log failures while the screen looks fine. The <code>pageerror</code> event fires for each
          uncaught exception. The <code>console</code> event fires for each message.
        </p>
        <Code>{`
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
`}</Code>
        <p>Put this code in an automatic fixture. Then each test in the suite fails when the page throws. No test has to ask for it.</p>
        <Code>{`
export const test = base.extend<{ failOnPageErrors: void }>({
  failOnPageErrors: [async ({ page }, use) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await use();
    expect(errors, 'the page threw errors').toEqual([]);
  }, { auto: true }],
});
`}</Code>
        <h3>Make reports and traces easy to read</h3>
        <ul>
          <li>
            <code>test.step('Add a note', async () =&gt; ...)</code> puts actions under one name in the report and in the trace.
          </li>
          <li>
            <code>{"testInfo.attach('console', { body, contentType })"}</code> adds a file to the report, for example the console
            log.
          </li>
        </ul>
      </Lesson>

      <TestCard title="Notes">
        <form className="note-form" onSubmit={addNote}>
          <div className="form-group">
            <label htmlFor="note-title">Note title</label>
            <input id="note-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <button type="submit">Add note</button>
        </form>
        <ul className="notes-list" aria-label="Notes">
          {notes.map((note) => (
            <li key={note.id} className={note.title ? undefined : "muted"}>
              {note.title ?? "Untitled"}
            </li>
          ))}
        </ul>
        <button type="button" onClick={startSync} disabled={sync === "syncing"}>
          {sync === "syncing" ? "Syncing…" : "Sync"}
        </button>
        {sync === "done" && (
          <p className="result success" role="status">
            All notes synced
          </p>
        )}
      </TestCard>

      <TestCard>
        <Investigation title="What really happened?" questions={QUESTIONS} solvedMessage="Now write a fixture that fails any test when the page throws." />
      </TestCard>
    </>
  );
}
