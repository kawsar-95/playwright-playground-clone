import { useLayoutEffect, useRef, useState } from "react";
import { Code, Lesson, PageHeader, TestCard } from "../../components";

const COMMANDS = ["New file", "Open settings", "Show shortcuts"];
const SPEEDS = ["Standard", "Express", "Overnight"];

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export default function KeyboardActions() {
  const [text, setText] = useState("");
  const [lastKey, setLastKey] = useState("");
  const [keystrokes, setKeystrokes] = useState(0);

  const [saved, setSaved] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gift, setGift] = useState(false);
  const [speed, setSpeed] = useState("Standard");

  const searchRef = useRef<HTMLInputElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [command, setCommand] = useState<string | null>(null);
  const returnFocus = useRef<Element | null>(null);

  const [shiftHeld, setShiftHeld] = useState(false);
  const [deleted, setDeleted] = useState<string | null>(null);

  const matches = COMMANDS.filter((item) => item.toLowerCase().includes(query.trim().toLowerCase()));

  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") setShiftHeld(true);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        returnFocus.current = document.activeElement;
        setQuery("");
        setActive(0);
        setPaletteOpen(true);
        return;
      }
      if (event.key === "/" && !isEditable(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") setShiftHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const closePalette = () => {
    setPaletteOpen(false);
    (returnFocus.current as HTMLElement | null)?.focus();
  };

  const choose = (item: string) => {
    setCommand(item);
    closePalette();
  };

  return (
    <>
      <PageHeader title="Keyboard Actions">
        Typing, moving focus, shortcuts and held keys: everything a keyboard user does.
      </PageHeader>

      <Lesson title="Testing with the keyboard">
        <h3>fill(), pressSequentially() or keyboard.type()?</h3>
        <ul>
          <li>
            <code>fill()</code> sets the full value at once. It is fast and it fires an <code>input</code>{" "}
            event. It fires no key events.
          </li>
          <li>
            <code>pressSequentially()</code> presses one key for each character on an element. Use it when the
            app reacts to keys: masks, autocomplete, keystroke counters.
          </li>
          <li>
            <code>page.keyboard.type()</code> does the same in the element that has focus now.
          </li>
        </ul>
        <Code>{`
await input.fill('Playwright');                // Keystrokes: 0
await input.pressSequentially('Playwright');   // Keystrokes: 10
`}</Code>

        <h3>Editing keys work like a user's</h3>
        <Code>{`
await input.press('Home');
await input.press('Shift+ArrowRight');         // select one character
await input.press('ControlOrMeta+A');          // Ctrl on Windows/Linux, Cmd on macOS
`}</Code>

        <h3>Focus and Tab order</h3>
        <p>
          Press Tab on the page and check where focus goes with <code>toBeFocused()</code>. In a radio group,
          Tab enters the group one time. The arrow keys move between the options.
        </p>
        <Code>{`
await page.getByLabel('Full name').focus();
await page.keyboard.press('Tab');
await expect(page.getByLabel('Email')).toBeFocused();
`}</Code>
        <div className="lesson-callout">
          If the mouse can click a control but Tab never reaches it, that is an accessibility bug. Tab order
          tests find it.
        </div>

        <h3>Shortcuts belong to the page</h3>
        <p>
          The app does not type a shortcut into an element. Press it on <code>page.keyboard</code>. Check what
          has focus first. Most apps ignore shortcuts while you type in a field.
        </p>
        <Code>{`
await page.keyboard.press('ControlOrMeta+K');
await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
`}</Code>
        <div className="lesson-callout">
          <code>page.keyboard</code> waits for nothing, because it has no element to wait for. Right after{" "}
          <code>page.goto()</code> the app can be not ready, and the key press is lost. Check something on the
          page first, for example its heading.
        </div>

        <h3>Holding a key</h3>
        <p>
          <code>keyboard.down()</code> holds a key until <code>keyboard.up()</code>. All actions in between
          happen with the key held, mouse clicks too.
        </p>
        <Code>{`
await page.keyboard.down('Shift');
await page.getByRole('button', { name: 'Delete' }).click();
await page.keyboard.up('Shift');
`}</Code>
      </Lesson>

      <TestCard title="Text editing">
        <div className="form-group">
          <label htmlFor="keyboard-input">Type something</label>
          <input
            id="keyboard-input"
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              setLastKey(event.key);
              setKeystrokes((count) => count + 1);
            }}
            placeholder="Type here..."
          />
        </div>
        <p className="result" data-testid="keyboard-value">
          Current value: {text || "Empty"}
        </p>
        <p className="result" data-testid="last-key">
          Last key pressed: {lastKey || "None"}
        </p>
        <p className="result" data-testid="keystrokes">
          Keystrokes: {keystrokes}
        </p>
      </TestCard>

      <TestCard title="Focus and Tab order">
        <form
          className="keyboard-form"
          aria-label="Shipping preferences"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(
              [name || "No name", email || "no email", gift ? "gift wrap" : "no gift wrap", `${speed} delivery`].join(", "),
            );
          }}
        >
          <div className="form-group">
            <label htmlFor="ship-name">Full name</label>
            <input id="ship-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="ship-email">Email</label>
            <input id="ship-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={gift} onChange={(event) => setGift(event.target.checked)} />
            Gift wrap
          </label>
          <fieldset className="keyboard-radios">
            <legend>Delivery speed</legend>
            {SPEEDS.map((option) => (
              <label key={option} className="checkbox-label">
                <input
                  type="radio"
                  name="speed"
                  value={option}
                  checked={speed === option}
                  onChange={() => setSpeed(option)}
                />
                {option}
              </label>
            ))}
          </fieldset>
          <div className="keyboard-form-actions">
            <button type="submit">Save</button>
            <div
              role="button"
              className="secondary fake-button"
              onClick={() => {
                setName("");
                setEmail("");
                setGift(false);
                setSpeed("Standard");
                setSaved(null);
              }}
            >
              Clear form
            </div>
          </div>
        </form>
        {saved && (
          <p className="result success" role="status">
            Saved: {saved}
          </p>
        )}
      </TestCard>

      <TestCard title="Shortcuts">
        <p>
          Press <kbd>/</kbd> to jump to search, or <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to open the
          command palette.
        </p>
        <div className="form-group">
          <label htmlFor="docs-search">Search the docs</label>
          <input id="docs-search" ref={searchRef} type="search" />
        </div>
        {command && (
          <p className="result success" role="status">
            Last command: {command}
          </p>
        )}
        {paletteOpen && (
          <div className="palette-backdrop" onClick={closePalette}>
            <div
              className="palette"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                autoFocus
                role="combobox"
                aria-label="Command"
                aria-expanded="true"
                aria-controls="palette-options"
                aria-activedescendant={matches[active] ? `command-${active}` : undefined}
                placeholder="Type a command"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closePalette();
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((index) => Math.min(index + 1, matches.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((index) => Math.max(index - 1, 0));
                  } else if (event.key === "Enter" && matches[active]) {
                    event.preventDefault();
                    choose(matches[active]);
                  }
                }}
              />
              <ul id="palette-options" role="listbox" aria-label="Commands">
                {matches.map((item, index) => (
                  <li
                    key={item}
                    id={`command-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(item);
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              {matches.length === 0 && <p className="palette-empty">No matching commands</p>}
            </div>
          </div>
        )}
      </TestCard>

      <TestCard title="Holding a key">
        <p>
          Shift is <strong data-testid="shift-state">{shiftHeld ? "held" : "up"}</strong>. Hold Shift while
          deleting to skip the trash.
        </p>
        <div className="file-row">
          <span>draft.txt</span>
          <button
            type="button"
            className="danger secondary"
            onClick={(event) =>
              setDeleted(event.shiftKey ? "draft.txt deleted permanently" : "draft.txt moved to trash")
            }
          >
            Delete
          </button>
        </div>
        {deleted && (
          <p className="result" role="status">
            {deleted}
          </p>
        )}
      </TestCard>
    </>
  );
}
