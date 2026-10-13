import { useRef, useState, type KeyboardEvent } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const TABS = [
  { id: "profile", label: "Profile", content: "Your name and photo are visible to your team." },
  { id: "security", label: "Security", content: "Two-factor authentication is turned on." },
  { id: "billing", label: "Billing", content: "You are on the free plan." },
];

const FAQ = [
  { question: "Can I run tests in parallel?", answer: "Yes. Playwright runs test files in parallel by default." },
  { question: "Which browsers are supported?", answer: "Chromium, Firefox and WebKit." },
  { question: "Do I need a test id on every element?", answer: "No. Prefer roles, labels and text; use test ids as a fallback." },
];

const FORMATS = ["Bold", "Italic", "Underline"];

export default function AriaWidgets() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [formats, setFormats] = useState<string[]>([]);

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + TABS.length) % TABS.length;
    setActiveTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const toggleFormat = (name: string) => {
    setFormats((current) => (current.includes(name) ? current.filter((f) => f !== name) : [...current, name]));
  };

  return (
    <>
      <PageHeader title="ARIA Widgets">Tabs, an accordion and toggle buttons: widgets whose state lives in ARIA attributes.</PageHeader>

      <Lesson title="Role options and aria snapshots">
        <h3>Find an element by its state</h3>
        <p>
          <code>getByRole()</code> has options that match ARIA state. You can find "the selected tab" or "the open question"
          without knowing which one it is.
        </p>
        <Code>{`
await expect(page.getByRole('tab', { selected: true })).toHaveText('Profile');

await page.getByRole('button', { name: 'Can I run tests in parallel?' }).click();
await expect(page.getByRole('button', { expanded: true })).toHaveCount(1);

await page.getByRole('button', { name: 'Bold' }).click();
await expect(page.getByRole('button', { name: 'Bold', pressed: true })).toBeVisible();

await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3); // the questions
`}</Code>
        <p>
          The state options are <code>checked</code>, <code>disabled</code>, <code>expanded</code>, <code>level</code>,{" "}
          <code>pressed</code> and <code>selected</code>.
        </p>
        <h3>Use the keyboard too</h3>
        <Code>{`
await page.getByRole('tab', { name: 'Profile' }).focus();
await page.keyboard.press('ArrowRight');
await expect(page.getByRole('tab', { name: 'Security' })).toBeFocused();
await expect(page.getByRole('tabpanel')).toHaveText(/Two-factor/);
`}</Code>
        <h3>Assert a whole structure with toMatchAriaSnapshot()</h3>
        <p>
          An aria snapshot is YAML text. It describes the <em>accessibility tree</em>: roles, names and states. One assertion
          checks a whole widget.
        </p>
        <Code>{`
await expect(page.getByRole('tablist')).toMatchAriaSnapshot(\`
  - tablist "Account settings":
    - tab "Profile" [selected]
    - tab "Security"
    - tab "Billing"
\`);
`}</Code>
        <p>
          You do not need to write a snapshot by hand. <code>await locator.ariaSnapshot()</code> returns the YAML of any element.
          Paste it into the test and remove what the test does not need. A text can be a regular expression, for example{" "}
          <code>- tabpanel: /Two-factor/</code>.
        </p>
        <div className="lesson-callout">
          An aria snapshot fails when a role or a name changes. A screen-reader user would notice the same change. So the snapshot
          also finds accessibility regressions.
        </div>
      </Lesson>

      <TestCard title="Tabs">
        <div className="tabs">
          <div className="tab-list" role="tablist" aria-label="Account settings">
            {TABS.map((tab, index) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  className={selected ? "tab is-selected" : "tab"}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => onTabKey(event, index)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {TABS.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              className="tab-panel"
              tabIndex={0}
              hidden={tab.id !== activeTab}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </TestCard>

      <TestCard title="Accordion">
        <div className="accordion">
          {FAQ.map(({ question, answer }, index) => {
            const open = openQuestion === question;
            return (
              <div className="accordion-item" key={question}>
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${index}`}
                    className="accordion-trigger"
                    aria-expanded={open}
                    aria-controls={`faq-${index}`}
                    onClick={() => setOpenQuestion(open ? null : question)}
                  >
                    {question}
                    <span className="accordion-sign" aria-hidden="true">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div id={`faq-${index}`} role="region" aria-labelledby={`faq-trigger-${index}`} className="accordion-panel" hidden={!open}>
                  {answer}
                </div>
              </div>
            );
          })}
        </div>
      </TestCard>

      <TestCard title="Toggle buttons">
        <div className="button-row" role="group" aria-label="Text formatting">
          {FORMATS.map((name) => (
            <button
              key={name}
              type="button"
              className={formats.includes(name) ? "toggle is-on" : "toggle"}
              aria-pressed={formats.includes(name)}
              onClick={() => toggleFormat(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="result" data-testid="format-result">
          Formats: <strong>{formats.length ? formats.join(", ") : "none"}</strong>
        </div>
      </TestCard>
    </>
  );
}
