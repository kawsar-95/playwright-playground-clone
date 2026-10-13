import { useEffect, useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";
import { useTimers } from "./useTimers";

const reportNames = ["Sales", "Traffic", "Support"];
const UNREAD_KEY = "qa-playground-unread";
const UNREAD_START = 3;

type SignIn =
  | { state: "idle" | "waiting" | "denied" | "cancelled" }
  | { state: "signed in"; email: string };

function readUnread(): number {
  try {
    const value = localStorage.getItem(UNREAD_KEY);
    return value === null ? UNREAD_START : Number(value);
  } catch {
    return UNREAD_START;
  }
}

export default function TabsWindows() {
  const { every, cancel } = useTimers();
  const [signIn, setSignIn] = useState<SignIn>({ state: "idle" });
  const popup = useRef<Window | null>(null);
  const watcher = useRef<number | null>(null);
  const [unread, setUnread] = useState(readUnread);

  // The sign-in popup answers with postMessage.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== popup.current || event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; email?: unknown } | null;
      if (data?.type === "signed-in") setSignIn({ state: "signed in", email: String(data.email) });
      else if (data?.type === "denied") setSignIn({ state: "denied" });
      else return;
      popup.current = null;
      cancel(watcher.current);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [cancel]);

  const openSignIn = () => {
    const win = window.open("/popups/sign-in/", "acme-sign-in", "width=480,height=560");
    if (!win) {
      setSignIn({ state: "cancelled" });
      return;
    }
    popup.current = win;
    setSignIn({ state: "waiting" });
    cancel(watcher.current);
    // If the user closes the popup without an answer, the sign-in is cancelled.
    watcher.current = every(() => {
      if (popup.current?.closed) {
        popup.current = null;
        cancel(watcher.current);
        setSignIn({ state: "cancelled" });
      }
    }, 300);
  };

  // Other tabs change the unread count in localStorage.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === UNREAD_KEY) setUnread(readUnread());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const changeUnread = (count: number) => {
    setUnread(count);
    try {
      localStorage.setItem(UNREAD_KEY, String(count));
    } catch {
      /* storage can be blocked */
    }
  };

  return (
    <>
      <PageHeader title="Tabs & Windows">
        New tabs, popup windows, a sign-in popup that talks back to the page, and tabs that keep each other up to date.
      </PageHeader>
      <Lesson title="Working with more than one page">
        <h3>Catch the new page</h3>
        <p>
          A new tab or a new window is a new <code>Page</code> object. Start to wait for the <code>popup</code> event before the
          click that opens it.
        </p>
        <Code>{`
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open help article' }).click();
const popup = await popupPromise;

await expect(popup.getByRole('heading', { level: 1 })).toHaveText('Help article');
`}</Code>
        <p>
          For Playwright, a tab and a window are the same. Links with <code>rel="noopener"</code> also give a popup.
        </p>
        <h3>Two pages at the same time</h3>
        <p>
          Each page has its own locators. Keep both pages in variables. Act on the correct page: the popup for its form, the
          original page for the result. A popup that closes itself fires the <code>close</code> event.
        </p>
        <Code>{`
await popup.getByRole('button', { name: 'Allow' }).click();
await popup.waitForEvent('close');
await expect(page.getByText('Signed in as ada@example.com')).toBeVisible();
`}</Code>
        <h3>All pages in the context</h3>
        <p>
          <code>context.pages()</code> lists all open pages. <code>context.on('page')</code> reports each new page, whichever page
          opened it. Find a tab by what it shows, not by the order in which it opened.
        </p>
        <Code>{`
for (const tab of context.pages()) {
  if (await tab.getByRole('heading', { name: 'Traffic report' }).isVisible()) { … }
}
`}</Code>
        <h3>Tabs share storage</h3>
        <p>
          Pages in one browser context share cookies and <code>localStorage</code>, like tabs in one browser. Open a second page
          with <code>context.newPage()</code>. Change a value there. Then assert that the first page sees the change.
        </p>
        <div className="lesson-callout">
          A new browser context is a new and empty browser profile. Pages in different contexts never see the data of each other.
        </div>
      </Lesson>
      <TestCard title="New tab and new window">
        <div className="button-row">
          <a href="/dialogs/new-tab-content" target="_blank" rel="noopener noreferrer" className="button-link">
            Open help article
          </a>
          <button
            type="button"
            onClick={() => window.open("/dialogs/new-window-content", "preview", "width=800,height=600")}
          >
            Open preview window
          </button>
        </div>
      </TestCard>
      <TestCard title="Sign in with a provider">
        <p>You sign in in a popup from Acme ID. Any email and password will do.</p>
        {signIn.state === "signed in" ? (
          <div className="button-row">
            <p className="result success" role="status">
              Signed in as {signIn.email}
            </p>
            <button type="button" className="secondary" onClick={() => setSignIn({ state: "idle" })}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <button type="button" onClick={openSignIn} disabled={signIn.state === "waiting"}>
              Sign in with Acme ID
            </button>
            {signIn.state !== "idle" && (
              <p className="result" role="status">
                {signIn.state === "waiting"
                  ? "Waiting for Acme ID…"
                  : signIn.state === "denied"
                    ? "Access denied"
                    : "Sign-in cancelled"}
              </p>
            )}
          </>
        )}
      </TestCard>
      <TestCard title="Reports">
        <p>Each report opens in its own tab.</p>
        <ul className="report-links">
          {reportNames.map((name) => (
            <li key={name}>
              <a href={`/dialogs/report?name=${name}`} target="_blank" rel="noopener">
                {name} report
              </a>
            </li>
          ))}
        </ul>
      </TestCard>
      <TestCard title="Tabs that stay in sync">
        <p>Open this page in a second tab. Mark the messages as read there. This tab updates too.</p>
        <p>
          Unread messages: <strong data-testid="unread-count">{unread}</strong>
        </p>
        <div className="button-row">
          <button type="button" onClick={() => changeUnread(0)} disabled={unread === 0}>
            Mark all as read
          </button>
          <button type="button" className="secondary" onClick={() => changeUnread(unread + 1)}>
            New message
          </button>
          <a href="/dialogs/windows" target="_blank" rel="noopener" className="button-link">
            Open this page in a new tab
          </a>
        </div>
      </TestCard>
    </>
  );
}
