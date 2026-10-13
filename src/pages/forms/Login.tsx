import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Code, Lesson, PageHeader } from "../../components";

const MAX_ATTEMPTS = 3;
const LOCK_MS = 30_000;
const USERNAME = "TedBuckland";
const PASSWORD = "Alligator3";

interface Errors {
  username?: string;
  password?: string;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<number | null>(null);
  const locked = lockedUntil !== null;

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    },
    [],
  );

  const startLock = () => {
    const until = Date.now() + LOCK_MS;
    setLockedUntil(until);
    setSecondsLeft(Math.ceil(LOCK_MS / 1000));
    const id = window.setInterval(() => {
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) {
        window.clearInterval(id);
        timer.current = null;
        setLockedUntil(null);
        setFailures(0);
        setMessage("");
      } else {
        setSecondsLeft(left);
      }
    }, 250);
    timer.current = id;
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!username.trim()) found.username = "Username is required.";
    if (!password) found.password = "Password is required.";
    return found;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (locked) return;
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setMessage("");
      setSuccess(false);
      return;
    }
    setErrors({});
    if (username === USERNAME && password === PASSWORD) {
      setFailures(0);
      setMessage("Login successful");
      setSuccess(true);
      return;
    }
    const count = failures + 1;
    setFailures(count);
    setSuccess(false);
    if (count >= MAX_ATTEMPTS) {
      setMessage("Too many failed attempts.");
      startLock();
    } else {
      setMessage("Invalid username or password");
    }
  };

  const left = MAX_ATTEMPTS - failures;

  return (
    <>
      <PageHeader title="Login Form">
        Practice filling in a login form and checking its validation messages. Nothing is saved: signing in here does not create a session.
      </PageHeader>

      <Lesson title="Testing a form">
        <h3>Find fields by their label</h3>
        <p>
          <code>getByLabel()</code> finds an input by the text next to it, as a user does. <code>fill()</code> replaces the whole value, so you do
          not clear the field first.
        </p>
        <Code>{`
await page.getByLabel('Username').fill('TedBuckland');
await page.getByLabel('Password').fill('Alligator3');
await page.getByLabel('Password').press('Enter');   // submits, like a user
`}</Code>
        <h3>Assert what the user sees and what a screen reader hears</h3>
        <p>
          An error message is not enough alone. Check that the field is marked invalid too. Assistive technology announces{" "}
          <code>aria-invalid</code>.
        </p>
        <Code>{`
await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');
await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
`}</Code>
        <div className="lesson-callout">
          A toggle such as "Show password" keeps its name and reports its state with <code>aria-pressed</code>. Assert that state and the{" "}
          <code>type</code> of the field. Do not assert the text of the button.
        </div>
        <h3>Waiting out a lockout</h3>
        <p>Three wrong passwords lock the form for 30 seconds. A test must not wait 30 real seconds. Install a fake clock before the page loads. Then move it forward.</p>
        <Code>{`
await page.clock.install();
await page.goto('/forms/login');
// ... three failed attempts ...
await page.clock.fastForward('00:31');
await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
`}</Code>
      </Lesson>

      <div className="test-card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              disabled={locked}
              required
              aria-required="true"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <span id="username-error" className="error-message" role="alert">
                {errors.username}
              </span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={locked}
                required
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button type="button" className="secondary" aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)}>
                Show password
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="error-message" role="alert">
                {errors.password}
              </span>
            )}
          </div>
          <button type="submit" disabled={locked}>
            Login
          </button>
        </form>

        <div className="credentials-note">
          <p>
            <strong>Demo Credentials:</strong>
          </p>
          <p>
            Login: <code>{USERNAME}</code>
          </p>
          <p>
            Password: <code>{PASSWORD}</code>
          </p>
        </div>

        {message && (
          <div className={`result ${success ? "success" : "error"}`} role={success ? "status" : "alert"} data-testid="login-result">
            {message}
            {locked && ` Try again in ${secondsLeft} seconds.`}
          </div>
        )}
        {!success && !locked && failures > 0 && (
          <p className="attempts-left" data-testid="attempts-left">
            {left} {left === 1 ? "attempt" : "attempts"} left
          </p>
        )}
      </div>

      <p className="auth-cross-link">
        Want a real session with a protected page? Use <Link to="/auth/sign-in">Sign In &amp; Sessions</Link> under Authentication.
      </p>
    </>
  );
}
