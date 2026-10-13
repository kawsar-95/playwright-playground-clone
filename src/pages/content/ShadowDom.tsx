import { createElement, useEffect, useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const CARD_STYLES = `
  :host { display: block; }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 200px;
    padding: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    font-family: Arial, Helvetica, sans-serif;
  }
  .job { color: #666; font-size: 14px; }
  ::slotted(*) { align-self: flex-start; }
  button {
    margin-top: 6px;
    padding: 8px 14px;
    border-radius: 5px;
    border: 1px solid #2f5fd0;
    background: #2f5fd0;
    color: #fff;
    font: inherit;
    cursor: pointer;
  }
  button[aria-pressed='true'] { background: #fff; color: #2f5fd0; }
`;

/** A card with an OPEN shadow root. It holds a Follow button and a slot for light DOM children. */
class UserCard extends HTMLElement {
  #following = false;

  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    const name = this.getAttribute("name") ?? "Unknown";
    root.innerHTML = `
      <style>${CARD_STYLES}</style>
      <div class="card">
        <strong class="name"></strong>
        <span class="job"></span>
        <slot></slot>
        <button type="button" aria-pressed="false">Follow</button>
      </div>
    `;
    root.querySelector(".name")!.textContent = name;
    root.querySelector(".job")!.textContent = this.getAttribute("job") ?? "";
    const button = root.querySelector("button")!;
    button.addEventListener("click", () => {
      this.#following = !this.#following;
      button.textContent = this.#following ? "Following" : "Follow";
      button.setAttribute("aria-pressed", String(this.#following));
      this.dispatchEvent(
        new CustomEvent("follow-change", { bubbles: true, composed: true, detail: { name, following: this.#following } }),
      );
    });
  }
}

/** A widget with a CLOSED shadow root. Scripts and locators cannot reach the button inside. */
class LockedWidget extends HTMLElement {
  connectedCallback() {
    if (this.hasAttribute("data-state")) return;
    const root = this.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>
        :host { display: inline-block; }
        button {
          padding: 18px 28px;
          border-radius: 8px;
          border: 2px dashed #999;
          background: #fafafa;
          font: 600 16px Arial, Helvetica, sans-serif;
          cursor: pointer;
        }
      </style>
      <button type="button">🔒 Unlock (internal code 4242)</button>
    `;
    this.setAttribute("data-state", "locked");
    const button = root.querySelector("button")!;
    button.addEventListener("click", () => {
      button.textContent = "🔓 Unlocked";
      this.setAttribute("data-state", "unlocked");
      this.dispatchEvent(new CustomEvent("lock-change", { bubbles: true, composed: true, detail: { state: "unlocked" } }));
    });
  }
}

if (!customElements.get("user-card")) customElements.define("user-card", UserCard);
if (!customElements.get("locked-widget")) customElements.define("locked-widget", LockedWidget);

export default function ShadowDom() {
  const [following, setFollowing] = useState<string[]>([]);
  const [widgetState, setWidgetState] = useState("locked");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onFollow = (event: Event) => {
      const { name, following: isFollowing } = (event as CustomEvent<{ name: string; following: boolean }>).detail;
      setFollowing((list) => (isFollowing ? [...list, name] : list.filter((n) => n !== name)));
    };
    const onLock = (event: Event) => {
      setWidgetState((event as CustomEvent<{ state: string }>).detail.state);
    };
    root.addEventListener("follow-change", onFollow);
    root.addEventListener("lock-change", onLock);
    return () => {
      root.removeEventListener("follow-change", onFollow);
      root.removeEventListener("lock-change", onLock);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <PageHeader title="Shadow DOM">
        Web components hide their insides in a shadow root. Some you can reach into; some you cannot.
      </PageHeader>

      <Lesson title="Locating inside web components">
        <h3>Open shadow roots: no extra work</h3>
        <p>
          The role, text, label and CSS locators of Playwright look into <strong>open</strong> shadow roots by themselves. You
          write the same locators as for any other element.
        </p>
        <Code>{`
// Both cards have a Follow button. Select the card first.
const ada = page.locator('user-card').filter({ hasText: 'Ada Lovelace' });

await ada.getByRole('button', { name: 'Follow' }).click();
await expect(ada.getByRole('button', { name: 'Following' })).toBeVisible();
`}</Code>
        <h3>XPath stops at the shadow boundary</h3>
        <p>
          XPath cannot see into a shadow root. A path that works in the Elements panel of DevTools can find nothing in a test.
        </p>
        <Code>{`
await expect(page.locator('xpath=//user-card//button')).toHaveCount(0);
await expect(page.locator('user-card button')).toHaveCount(2); // CSS works
`}</Code>
        <h3>Slotted content is outside the shadow root</h3>
        <p>
          The "Mentor" badge is a normal child of <code>&lt;user-card&gt;</code>. A <code>&lt;slot&gt;</code> shows it inside the
          card. The badge stays in the light DOM, so all locators find it, XPath too.
        </p>
        <h3>Closed shadow roots: work from the outside</h3>
        <p>
          A <strong>closed</strong> shadow root is hidden from scripts, and Playwright is a script. No locator can find the
          button in the locked widget. These things still work:
        </p>
        <ul>
          <li>
            the attributes of the outer element, for example <code>data-state</code>;
          </li>
          <li>events and effects outside the widget, for example the status line below;</li>
          <li>a mouse click at a point inside the bounding box of the widget.</li>
        </ul>
        <Code>{`
const widget = page.locator('locked-widget');

await expect(widget.getByRole('button')).toHaveCount(0); // locators cannot see it
await expect(widget).toHaveAttribute('data-state', 'locked');

await widget.scrollIntoViewIfNeeded(); // page.mouse does not scroll
const box = await widget.boundingBox();
await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

await expect(widget).toHaveAttribute('data-state', 'unlocked');
`}</Code>
        <div className="lesson-callout">
          Closed shadow roots are rare. If an app uses one, ask the developers to show the state on the outer element or in an
          event. A click at a position is the last choice.
        </div>
      </Lesson>

      <TestCard title="Open shadow root">
        <div className="shadow-cards">
          {createElement(
            "user-card",
            { name: "Ada Lovelace", job: "Test Architect" },
            <span className="status-badge done">Mentor</span>,
          )}
          {createElement("user-card", { name: "Grace Hopper", job: "QA Engineer" })}
        </div>
        <div className="result" data-testid="following-result">
          Following: <strong>{following.length ? following.join(", ") : "nobody"}</strong>
        </div>
      </TestCard>

      <TestCard title="Closed shadow root">
        {createElement("locked-widget")}
        <div className="result" data-testid="widget-state">
          Widget state: <strong>{widgetState}</strong>
        </div>
      </TestCard>
    </div>
  );
}
