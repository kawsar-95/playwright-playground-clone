import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Code, Lesson, PageHeader } from "../../components";

const STORAGE_KEY = "qa-playground-wizard";
const STEP_NAMES = ["Account", "Plan", "Review"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PlanName = "Free" | "Pro" | "Team";
type Billing = "Monthly" | "Yearly";

interface Draft {
  name: string;
  email: string;
  plan: PlanName;
  billing: Billing;
  seats: string;
}

interface Errors {
  name?: string;
  email?: string;
  seats?: string;
}

const EMPTY: Draft = { name: "", email: "", plan: "Free", billing: "Monthly", seats: "3" };
const PRICE: Record<PlanName, number> = { Free: 0, Pro: 12, Team: 10 };

function total(draft: Draft): string {
  const seats = draft.plan === "Team" ? Number(draft.seats) : 1;
  const monthly = PRICE[draft.plan] * seats;
  if (monthly === 0) return "Free";
  return draft.billing === "Yearly" ? `$${monthly * 10} per year` : `$${monthly} per month`;
}

function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function accountErrors(draft: Draft): Errors {
  const found: Errors = {};
  if (!draft.name.trim()) found.name = "Enter your full name.";
  if (!draft.email.trim()) found.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(draft.email.trim())) found.email = "Enter a valid email address.";
  return found;
}

function planErrors(draft: Draft): Errors {
  const seats = Number(draft.seats);
  if (draft.plan === "Team" && (!Number.isInteger(seats) || seats < 3 || seats > 50)) {
    return { seats: "A team needs between 3 and 50 seats." };
  }
  return {};
}

/** The first step that still has missing data. A visitor cannot go past it. */
function furthestStep(draft: Draft): number {
  if (Object.keys(accountErrors(draft)).length > 0) return 1;
  if (Object.keys(planErrors(draft)).length > 0) return 2;
  return 3;
}

export default function Wizard() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [created, setCreated] = useState<Draft | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const requested = Number(params.get("step") ?? 1);
  const wanted = [1, 2, 3].includes(requested) ? requested : 1;
  const step = Math.min(wanted, furthestStep(draft));

  useEffect(() => {
    if (step !== requested) setParams({ step: String(step) }, { replace: true });
  }, [step, requested, setParams]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage can be blocked */
    }
  }, [draft]);

  const update = (change: Partial<Draft>) => setDraft((current) => ({ ...current, ...change }));

  const goTo = (target: number) => {
    setShowErrors(false);
    setParams({ step: String(target) });
    requestAnimationFrame(() => heading.current?.focus());
  };

  const next = (event: FormEvent) => {
    event.preventDefault();
    const found = step === 1 ? accountErrors(draft) : planErrors(draft);
    if (Object.keys(found).length > 0) {
      setShowErrors(true);
      return;
    }
    goTo(step + 1);
  };

  const create = (event: FormEvent) => {
    event.preventDefault();
    if (!terms) {
      setTermsError(true);
      return;
    }
    setCreated(draft);
    setDraft(EMPTY);
    setTerms(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage can be blocked */
    }
  };

  const errors: Errors = showErrors ? { ...accountErrors(draft), ...planErrors(draft) } : {};

  return (
    <>
      <PageHeader title="Multi-step Form">
        A three-step sign-up. Each step has its own URL, Back keeps what you entered, and a reload keeps your draft.
      </PageHeader>

      <Lesson title="Testing a wizard">
        <h3>One step at a time</h3>
        <p>
          Fill a step and go Next. Assert the heading of the next step before you touch its fields. Keep the steps in helper functions, because most
          tests must get through the first steps fast.
        </p>
        <Code>{`
async function fillAccount(page: Page, name = 'Ada Lovelace') {
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Step 2 of 3: Plan' })).toBeVisible();
}
`}</Code>
        <h3>The URL is part of the state</h3>
        <p>
          Each step has a new URL. Assert it with <code>toHaveURL()</code>. Use <code>page.goBack()</code> like the Back button of the browser. Try to
          open a later step directly: the form sends you back to the first unfinished step.
        </p>
        <h3>Surviving a reload</h3>
        <p>
          The form keeps the draft in <code>sessionStorage</code>. <code>page.reload()</code> keeps it. A new page in the same context starts empty,
          because <code>sessionStorage</code> belongs to one tab.
        </p>
        <h3>Radio groups</h3>
        <p>
          The name of a radio includes its whole label, with the extra text. Scope radios to their group. A group is a <code>fieldset</code> that its
          legend names.
        </p>
        <Code>{`
await page.getByRole('group', { name: 'Plan' }).getByRole('radio', { name: 'Team' }).check();
await expect(page.getByRole('group', { name: 'Billing' })).toBeVisible();
`}</Code>
      </Lesson>

      <div className="test-card wizard">
        {created ? (
          <>
            <h2 tabIndex={-1}>You're all set</h2>
            <p className="result success" role="status">
              Welcome aboard, {created.name.trim()}! Your {created.plan} plan{created.plan === "Free" ? "" : ` (${created.billing.toLowerCase()})`} is
              active.
            </p>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setCreated(null);
                goTo(1);
              }}
            >
              Start over
            </button>
          </>
        ) : (
          <>
            <ol className="wizard-steps" aria-label="Progress">
              {STEP_NAMES.map((name, index) => (
                <li
                  key={name}
                  className={index + 1 < step ? "done" : index + 1 === step ? "current" : undefined}
                  aria-current={index + 1 === step ? "step" : undefined}
                >
                  {name}
                </li>
              ))}
            </ol>
            <h2 ref={heading} tabIndex={-1}>
              Step {step} of 3: {STEP_NAMES[step - 1]}
            </h2>

            {step === 1 && (
              <form onSubmit={next} noValidate>
                <div className="form-group">
                  <label htmlFor="wizard-name">Full name</label>
                  <input
                    id="wizard-name"
                    type="text"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? "wizard-name-error" : undefined}
                  />
                  {errors.name && (
                    <span id="wizard-name-error" className="error-message" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="wizard-email">Email</label>
                  <input
                    id="wizard-email"
                    type="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(e) => update({ email: e.target.value })}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "wizard-email-error" : undefined}
                  />
                  {errors.email && (
                    <span id="wizard-email-error" className="error-message" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>
                <div className="button-row">
                  <button type="submit">Next</button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={next} noValidate>
                <fieldset className="wizard-options">
                  <legend>Plan</legend>
                  {(["Free", "Pro", "Team"] as const).map((plan) => (
                    <label key={plan} className="checkbox-label">
                      <input type="radio" name="plan" checked={draft.plan === plan} onChange={() => update({ plan })} />
                      {plan}
                      <span className="muted">{plan === "Free" ? "$0" : plan === "Pro" ? "$12 per month" : "$10 per seat per month"}</span>
                    </label>
                  ))}
                </fieldset>
                {draft.plan !== "Free" && (
                  <fieldset className="wizard-options">
                    <legend>Billing</legend>
                    {(["Monthly", "Yearly"] as const).map((billing) => (
                      <label key={billing} className="checkbox-label">
                        <input type="radio" name="billing" checked={draft.billing === billing} onChange={() => update({ billing })} />
                        {billing}
                        {billing === "Yearly" && <span className="muted">two months free</span>}
                      </label>
                    ))}
                  </fieldset>
                )}
                {draft.plan === "Team" && (
                  <div className="form-group">
                    <label htmlFor="wizard-seats">Number of seats</label>
                    <input
                      id="wizard-seats"
                      type="number"
                      min={3}
                      max={50}
                      value={draft.seats}
                      onChange={(e) => update({ seats: e.target.value })}
                      aria-invalid={errors.seats ? true : undefined}
                      aria-describedby={errors.seats ? "wizard-seats-error" : undefined}
                    />
                    {errors.seats && (
                      <span id="wizard-seats-error" className="error-message" role="alert">
                        {errors.seats}
                      </span>
                    )}
                  </div>
                )}
                <div className="button-row">
                  <button type="button" className="secondary" onClick={() => goTo(1)}>
                    Back
                  </button>
                  <button type="submit">Next</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={create} noValidate>
                <dl className="wizard-summary">
                  <div>
                    <dt>Name</dt>
                    <dd>{draft.name.trim()}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{draft.email.trim()}</dd>
                  </div>
                  <div>
                    <dt>Plan</dt>
                    <dd>
                      {draft.plan}
                      {draft.plan === "Team" && `, ${draft.seats} seats`}
                    </dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd data-testid="wizard-total">{total(draft)}</dd>
                  </div>
                </dl>
                <div className="button-row">
                  <button type="button" className="secondary" onClick={() => goTo(1)}>
                    Edit account
                  </button>
                  <button type="button" className="secondary" onClick={() => goTo(2)}>
                    Edit plan
                  </button>
                </div>
                <label className="checkbox-label wizard-terms">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      setTermsError(false);
                    }}
                    aria-invalid={termsError ? true : undefined}
                    aria-describedby={termsError ? "wizard-terms-error" : undefined}
                  />
                  I agree to the terms
                </label>
                {termsError && (
                  <p id="wizard-terms-error" className="error-message" role="alert">
                    Accept the terms to continue.
                  </p>
                )}
                <div className="button-row">
                  <button type="button" className="secondary" onClick={() => goTo(2)}>
                    Back
                  </button>
                  <button type="submit">Create account</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
}
