import { useEffect, useRef, useState, type FormEvent } from "react";
import { Code, Lesson, PageHeader } from "../../components";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/i;
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "A number", test: (v: string) => /\d/.test(v) },
  { label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
];

type CheckState = "idle" | "checking" | "available" | "taken" | "error";

interface RegisterErrors {
  email?: string;
  age?: string;
}

function RegistrationForm() {
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): RegisterErrors => {
    const found: RegisterErrors = {};
    if (!email) found.email = "Email address is required.";
    else if (!EMAIL_PATTERN.test(email)) found.email = "Please enter a valid email address.";
    const value = Number(age);
    if (!age) found.age = "Age is required.";
    else if (Number.isNaN(value) || value < 18 || value > 100) found.age = "You must be between 18 and 100 years old.";
    return found;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setDone(false);
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, age: Number(age) }),
      });
      if (response.status === 409) setErrors({ email: "An account with this email already exists." });
      else if (response.ok) setDone(true);
      else setErrors({ email: "Something went wrong. Please try again." });
    } catch {
      setErrors({ email: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="test-card">
      <h2 id="registration-title">Registration Form</h2>
      <p>
        Some emails are already registered, for example <code>taken@example.com</code>. Only the server knows.
      </p>
      <form aria-labelledby="registration-title" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="validation-email">Email</label>
          <input
            id="validation-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "validation-email-error" : undefined}
          />
          {errors.email && (
            <span id="validation-email-error" className="error-message" role="alert">
              {errors.email}
            </span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="validation-age">Age</label>
          <input
            id="validation-age"
            name="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="18"
            max="100"
            required
            aria-invalid={!!errors.age}
            aria-describedby={errors.age ? "validation-age-error" : undefined}
          />
          {errors.age && (
            <span id="validation-age-error" className="error-message" role="alert">
              {errors.age}
            </span>
          )}
        </div>
        <button type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      {done && (
        <div className="result success" role="status" data-testid="validation-result">
          Form submitted successfully
        </div>
      )}
    </div>
  );
}

function SignupForm() {
  const [username, setUsername] = useState("");
  const [touched, setTouched] = useState(false);
  const [check, setCheck] = useState<CheckState>("idle");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [welcome, setWelcome] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const usernameMessage =
    (touched && !USERNAME_PATTERN.test(username) ? "Use 3–20 letters, digits or underscores." : null) ??
    (check === "taken" ? `${username} is already taken.` : check === "error" ? "Could not check this username. Try again." : null);
  const mismatch = confirmTouched && confirm !== password ? "Passwords do not match." : null;
  const rulesMet = PASSWORD_RULES.every((rule) => rule.test(password));
  const canSubmit = check === "available" && rulesMet && confirm === password;

  const checkUsername = async () => {
    setTouched(true);
    if (!USERNAME_PATTERN.test(username)) {
      setCheck("idle");
      return;
    }
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setCheck("checking");
    try {
      const response = await fetch(`/api/usernames/${encodeURIComponent(username)}`, { signal: current.signal });
      const data: { available?: boolean } = await response.json();
      setCheck(response.ok ? (data.available ? "available" : "taken") : "error");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setCheck("error");
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setConfirmTouched(true);
    if (canSubmit) setWelcome(username);
  };

  return (
    <div className="test-card">
      <h2 id="signup-title">Sign-up with live checks</h2>
      <p>The username is checked when you leave the field. The password rules update as you type.</p>
      <form aria-labelledby="signup-title" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            autoComplete="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setCheck("idle");
              setWelcome(null);
            }}
            onBlur={checkUsername}
            aria-invalid={usernameMessage ? true : undefined}
            aria-describedby="signup-username-hint"
          />
          <span id="signup-username-hint" className={usernameMessage ? "error-message" : "field-hint"} aria-live="polite">
            {usernameMessage ?? (check === "checking" ? "Checking…" : check === "available" ? `${username} is available.` : "")}
          </span>
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-rules"
          />
          <ul id="password-rules" className="password-rules">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.label} className={met ? "met" : undefined}>
                  <span aria-hidden="true">{met ? "✓" : "○"}</span> <span className="visually-hidden">{met ? "Met:" : "Not met:"}</span>{" "}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="form-group">
          <label htmlFor="signup-confirm">Confirm password</label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            aria-invalid={mismatch ? true : undefined}
            aria-describedby={mismatch ? "signup-confirm-error" : undefined}
          />
          {mismatch && (
            <span id="signup-confirm-error" className="error-message" role="alert">
              {mismatch}
            </span>
          )}
        </div>
        <button type="submit" disabled={!canSubmit}>
          Sign up
        </button>
      </form>
      {welcome && (
        <p className="result success" role="status">
          Welcome, {welcome}!
        </p>
      )}
    </div>
  );
}

function TeamForm() {
  const [team, setTeam] = useState<string | null>(null);
  return (
    <div className="test-card">
      <h2 id="team-title">Browser validation</h2>
      <p>This form uses the built-in checks of the browser. Submit it empty to see them.</p>
      <form
        aria-labelledby="team-title"
        onSubmit={(event) => {
          event.preventDefault();
          setTeam(new FormData(event.currentTarget).get("team")?.toString() ?? "");
        }}
      >
        <div className="form-group">
          <label htmlFor="team-name">Team name</label>
          <input id="team-name" name="team" type="text" required minLength={3} />
        </div>
        <div className="form-group">
          <label htmlFor="team-size">Team size</label>
          <input id="team-size" name="size" type="number" required min={2} max={50} />
        </div>
        <div className="form-group">
          <label htmlFor="team-website">Website (optional)</label>
          <input id="team-website" name="website" type="url" placeholder="https://" />
        </div>
        <button type="submit">Create team</button>
      </form>
      {team !== null && (
        <p className="result success" role="status">
          Team {team} created
        </p>
      )}
    </div>
  );
}

export default function Validation() {
  return (
    <>
      <PageHeader title="Form Validation">Rules checked on submit, by the server, as you leave a field, and by the browser itself.</PageHeader>

      <Lesson title="Testing validation">
        <h3>Assert the error from the field</h3>
        <p>
          A field can point at its error with <code>aria-describedby</code>. Then assert the error through the field. The test also proves that the
          two are connected.
        </p>
        <Code>{`
await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Email address is required.');
`}</Code>
        <h3>One test for each boundary value</h3>
        <p>Rules break at their edges. For an age from 18 to 100, test 17, 18, 100 and 101. Loop over the cases. Each case gets its own name in the report.</p>
        <Code>{`
for (const { age, valid } of [{ age: '17', valid: false }, { age: '18', valid: true }]) {
  test(\`age \${age} is \${valid ? 'accepted' : 'rejected'}\`, async ({ page }) => { ... });
}
`}</Code>
        <h3>Errors that appear when a field loses focus</h3>
        <p>
          <code>fill()</code> does not move the focus away. Press Tab or call <code>blur()</code> to start the checks that run on blur. You can mock a
          check that asks the server, like any other request.
        </p>
        <Code>{`
await page.route('**/api/usernames/*', (route) =>
  route.fulfill({ json: { username: 'ada', available: false } })
);
await page.getByLabel('Username').fill('ada');
await page.getByLabel('Username').blur();
`}</Code>
        <h3>The validation of the browser</h3>
        <p>
          A form without <code>noValidate</code> lets the browser block the submit and show its own bubble. The bubble is not part of the page. Read
          the <code>validity</code> and <code>validationMessage</code> of the field instead, or match <code>:invalid</code>.
        </p>
        <Code>{`
const teamName = page.getByLabel('Team name');
expect(await teamName.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
await expect(page.locator('input:invalid')).toHaveCount(2);
`}</Code>
        <div className="lesson-callout">
          The words in <code>validationMessage</code> depend on the browser and its language. Assert the <code>validity</code> flags. Do not assert the text.
        </div>
      </Lesson>

      <RegistrationForm />
      <SignupForm />
      <TeamForm />
    </>
  );
}
