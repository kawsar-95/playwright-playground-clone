import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Code, Lesson, PageHeader } from "../../components";

const COUNTRIES = ["Austria", "Belgium", "Poland", "Portugal", "Spain", "Sweden", "Switzerland", "United Kingdom", "United States"];
const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

type LoadState = "idle" | "loading" | "done" | "error";

function highlight(option: string, query: string): ReactNode {
  const needle = query.trim();
  const start = option.toLowerCase().indexOf(needle.toLowerCase());
  if (!needle || start === -1) return option;
  const end = start + needle.length;
  return (
    <>
      {option.slice(0, start)}
      <mark>{option.slice(start, end)}</mark>
      {option.slice(end)}
    </>
  );
}

interface ComboboxProps {
  id: string;
  label: string;
  value: string;
  onType: (value: string) => void;
  options: string[];
  onChoose: (value: string) => void;
  message: ReactNode;
}

function Combobox({ id, label, value, onType, options, onChoose, message }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${id}-options`;
  const expanded = open && options.length > 0;

  const choose = (option: string) => {
    onChoose(option);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && expanded && options[active]) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="form-group autocomplete">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
        autoComplete="off"
        placeholder="Start typing..."
        value={value}
        onChange={(event) => {
          onType(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      />
      <ul id={listId} className="autocomplete-list" role="listbox" hidden={!expanded}>
        {options.map((option, index) => (
          <li
            key={option}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => {
              event.preventDefault();
              choose(option);
            }}
            onMouseEnter={() => setActive(index)}
          >
            {highlight(option, value)}
          </li>
        ))}
      </ul>
      {open && message && <div className="autocomplete-message">{message}</div>}
    </div>
  );
}

export default function Autocomplete() {
  const [country, setCountry] = useState("");
  const [pickedCountry, setPickedCountry] = useState<string | null>(null);
  const countryOptions = country.trim() ? COUNTRIES.filter((name) => name.toLowerCase().includes(country.trim().toLowerCase())) : [];

  const [city, setCity] = useState("");
  const [pickedCity, setPickedCity] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const debounce = useRef<number | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (debounce.current !== null) window.clearTimeout(debounce.current);
      controller.current?.abort();
    },
    [],
  );

  const search = async (term: string) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState("loading");
    try {
      const response = await fetch(`/api/cities?search=${encodeURIComponent(term)}`, { signal: current.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: { cities: string[] } = await response.json();
      setCities(data.cities);
      setState("done");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setCities([]);
        setState("error");
      }
    }
  };

  const onCityType = (value: string) => {
    setCity(value);
    setPickedCity(null);
    if (debounce.current !== null) window.clearTimeout(debounce.current);
    if (value.trim().length < MIN_CHARS) {
      controller.current?.abort();
      setCities([]);
      setState("idle");
      return;
    }
    debounce.current = window.setTimeout(() => void search(value.trim()), DEBOUNCE_MS);
  };

  const cityMessage =
    state === "loading" ? (
      <span role="status">Searching…</span>
    ) : state === "error" ? (
      <span role="alert">
        Couldn't load suggestions.{" "}
        <button type="button" className="link-button" onMouseDown={(event) => event.preventDefault()} onClick={() => void search(city.trim())}>
          Retry
        </button>
      </span>
    ) : state === "done" && cities.length === 0 ? (
      <span role="status">No cities found</span>
    ) : null;

  return (
    <>
      <PageHeader title="Autocomplete">Two comboboxes: one filters a list in the browser, the other asks the server as you type.</PageHeader>

      <Lesson title="Testing an autocomplete">
        <h3>Type like a user</h3>
        <p>
          Suggestions react to key events. <code>fill()</code> sets the value at once, and most comboboxes handle that. If one does not, type with{" "}
          <code>pressSequentially()</code>.
        </p>
        <h3>Options have a role</h3>
        <p>
          The input is a <code>combobox</code>. The list is a <code>listbox</code>. Each suggestion is an <code>option</code>. Assert the whole list at
          once.
        </p>
        <Code>{`
await page.getByRole('combobox', { name: 'Country' }).fill('united');
await expect(page.getByRole('option')).toHaveText(['United Kingdom', 'United States']);
`}</Code>
        <div className="lesson-callout">
          The typed text sits in a <code>&lt;mark&gt;</code> inside each option. <code>toHaveText()</code> reads the text of the whole element, so the
          extra markup does not matter.
        </div>
        <h3>Names that repeat</h3>
        <p>
          A role name matches part of the text. "Paris" matches "Paris, France" and "Paris, United States". Use the full name with{" "}
          <code>exact: true</code>.
        </p>
        <h3>Suggestions from the server</h3>
        <p>
          The city search waits until you stop typing (a debounce). Then it sends one request. Control the answers with <code>page.route()</code>:
          return fixed cities, nothing, or an error.
        </p>
        <Code>{`
await page.route('**/api/cities?*', (route) => route.fulfill({ status: 500 }));
await page.getByRole('combobox', { name: 'City' }).fill('par');
await expect(page.getByRole('alert')).toContainText("Couldn't load suggestions");
`}</Code>
        <div className="lesson-callout">
          "Searching…" shows for less than half a second. An assertion checks the page at intervals and can miss a state this short. To test a loading
          state, hold the response in your route handler until you have asserted it.
        </div>
      </Lesson>

      <div className="test-card">
        <h2>Country Search</h2>
        <Combobox
          id="country-search"
          label="Country"
          value={country}
          onType={(value) => {
            setCountry(value);
            setPickedCountry(null);
          }}
          options={countryOptions}
          onChoose={(value) => {
            setCountry(value);
            setPickedCountry(value);
          }}
          message={country.trim() && countryOptions.length === 0 ? <span role="status">No matching countries</span> : null}
        />
        <div className="result" data-testid="selected-country">
          Selected country: {pickedCountry ?? "None"}
        </div>
      </div>

      <div className="test-card">
        <h2>City Search</h2>
        <p>Type at least two letters. Suggestions come from the server.</p>
        <Combobox
          id="city-search"
          label="City"
          value={city}
          onType={onCityType}
          options={state === "done" ? cities : []}
          onChoose={(value) => {
            setCity(value);
            setPickedCity(value);
            setState("idle");
          }}
          message={cityMessage}
        />
        <div className="result" data-testid="selected-city">
          Selected city: {pickedCity ?? "None"}
        </div>
      </div>
    </>
  );
}
