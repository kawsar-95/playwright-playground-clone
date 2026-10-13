import { useState } from "react";
import { Link } from "react-router-dom";
import { Code, Lesson, PageHeader } from "../../components";

const SESSION_KEY = "qa-playground-session";
const DEMO = { username: "TedBuckland", password: "Alligator3" };
const SIGN_IN_DELAY_MS = 800;

interface Session {
  username: string;
  token: string;
  signedInAt: string;
  remembered: boolean;
}

function readStored(store: Storage): Omit<Session, "remembered"> | null {
  try {
    const raw = store.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Omit<Session, "remembered">) : null;
  } catch {
    return null;
  }
}

/** A remembered session lives in localStorage. Other sessions live in sessionStorage. */
function loadSession(): Session | null {
  const remembered = readStored(localStorage);
  if (remembered) return { ...remembered, remembered: true };
  const tabOnly = readStored(sessionStorage);
  return tabOnly ? { ...tabOnly, remembered: false } : null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function saveSession(username: string, remember: boolean): Session {
  const session = { username, token: crypto.randomUUID(), signedInAt: new Date().toISOString() };
  clearSession();
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  return { ...session, remembered: remember };
}

function Account({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return (
    <>
      <h2>My Account</h2>
      <dl className="account-details">
        <dt>Username</dt>
        <dd>{session.username}</dd>
        <dt>Signed in at</dt>
        <dd>
          <time dateTime={session.signedInAt}>{new Date(session.signedInAt).toLocaleString()}</time>
        </dd>
        <dt>Session stored in</dt>
        <dd data-testid="session-storage">
          {session.remembered ? "localStorage (remembered across tabs and restarts)" : "sessionStorage (this tab only)"}
        </dd>
      </dl>
      <div className="result success" role="status">
        Signed in as {session.username}
      </div>
      <button type="button" className="secondary auth-card-submit" onClick={onSignOut}>
        Sign out
      </button>
    </>
  );
}

function SignInForm({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <h2>Sign in to your account</h2>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setBusy(true);
          setTimeout(() => {
            setBusy(false);
            if (username !== DEMO.username || password !== DEMO.password) {
              setError("Invalid username or password");
              return;
            }
            onSignedIn(saveSession(username, remember));
          }, SIGN_IN_DELAY_MS);
        }}
      >
        <div className="form-group">
          <label htmlFor="sign-in-username">Username</label>
          <input
            id="sign-in-username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sign-in-password">Password</label>
          <input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="checkbox-group auth-card-remember">
          <label>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
        </div>
        <button type="submit" className="auth-card-submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error && (
        <div className="result" role="alert">
          {error}
        </div>
      )}
      <div className="credentials-note">
        <p>
          <strong>Demo Credentials:</strong>
        </p>
        <p>
          Login: <code>{DEMO.username}</code>
        </p>
        <p>
          Password: <code>{DEMO.password}</code>
        </p>
      </div>
    </>
  );
}

export default function SignIn() {
  const [session, setSession] = useState<Session | null>(loadSession);

  return (
    <>
      <PageHeader title="Sign In & Sessions">
        Sign in to see your account. The session is stored in the browser, so it survives a reload, and with "Remember me" it also reaches other tabs.
      </PageHeader>

      <Lesson title="Reusing a signed-in session across tests">
        <h3>Why not sign in for every test?</h3>
        <p>
          A sign-in through the UI is slow, and it tests the same screen again and again. Most suites sign in <em>once</em>, save the state of the
          browser to a file, and start every other test from that file, already signed in.
        </p>
        <h3>Step 1: a setup test that signs in and saves the state</h3>
        <Code>{`
// tests/auth.setup.ts
import { expect, test as setup } from '@playwright/test';

setup('sign in', async ({ page }) => {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Username').fill('TedBuckland');
  await page.getByLabel('Password').fill('Alligator3');
  await page.getByLabel('Remember me').check();
  await page.getByRole('button', { name: 'Sign in' }).click();

  // The sign-in takes a moment. The assertion waits for it.
  await expect(page.getByRole('status')).toHaveText('Signed in as TedBuckland');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
`}</Code>
        <h3>Step 2: tests that start from that file</h3>
        <Code>{`
// playwright.config.ts
projects: [
  { name: 'auth', testMatch: /auth\\.setup\\.ts/ },
  {
    name: 'signed-in',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['auth'],
  },
],
`}</Code>
        <p>
          For one file only, use <code>test.use({"{ storageState: 'playwright/.auth/user.json' }"})</code>. A test that starts from the file opens this
          page and sees the account at once.
        </p>
        <h3>The "Remember me" trap</h3>
        <p>
          <code>storageState()</code> saves cookies and <code>localStorage</code>, but <strong>not</strong> <code>sessionStorage</code>. On this page,
          an unchecked "Remember me" keeps the session in <code>sessionStorage</code>. The saved file is then empty, and every "signed-in" test sees the
          sign-in form. Real apps do this too. Check which storage your app uses before you rely on <code>storageState()</code>.
        </p>
        <div className="lesson-callout">
          Add <code>playwright/.auth</code> to <code>.gitignore</code>. The file holds a real session token.
        </div>
      </Lesson>

      <div className="auth-card">
        <div className="auth-card-brand">QA Playground</div>
        {session ? (
          <Account
            session={session}
            onSignOut={() => {
              clearSession();
              setSession(null);
            }}
          />
        ) : (
          <SignInForm onSignedIn={setSession} />
        )}
      </div>

      <p className="auth-cross-link">
        Practising form validation messages instead? Use the <Link to="/forms/login">Login Form</Link> exercise.
      </p>
    </>
  );
}
