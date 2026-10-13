import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { allPages, groups, hiddenPaths, redirects, SITE_NAME, type Difficulty } from "./nav";
import { registry } from "./pages/registry";
import { useProgress } from "./progress";
import { Code } from "./components";
import type { Brief } from "./pageTypes";

const MOBILE = "(max-width: 900px)";

function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export function DifficultyBadge({ level }: { level: Difficulty }) {
  return <span className={`difficulty difficulty-${level}`}>{level}</span>;
}

function NavItem({ path, label, solved, onNavigate }: { path: string; label: string; solved?: boolean; onNavigate?: () => void }) {
  return (
    <NavLink to={path} end onClick={onNavigate} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
      {label}
      {solved && (
        <span className="nav-check">
          <span aria-hidden="true">✓</span>
          <span className="visually-hidden"> (solved)</span>
        </span>
      )}
    </NavLink>
  );
}

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { isSolved } = useProgress();
  return (
    <aside id="site-nav" className={open ? "sidebar is-open" : "sidebar"}>
      <div className="sidebar-logo">{SITE_NAME}</div>
      <nav>
        <NavItem path="/" label="Home" onNavigate={onNavigate} />
        {groups.map((g) => (
          <div className="nav-section" key={g.title}>
            <div className="nav-section-title">
              <span>{g.title}</span>
              <span className="nav-section-progress">
                {g.pages.filter((p) => isSolved(p.path)).length}/{g.pages.length}
              </span>
            </div>
            {g.pages.map((p) => (
              <NavItem key={p.path} path={p.path} label={p.label} solved={isSolved(p.path)} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

const BRIEF_KEY = "qa-playground-brief-open";

function briefOpen(): boolean {
  try {
    return localStorage.getItem(BRIEF_KEY) === "true";
  } catch {
    return false;
  }
}

type Panel = "brief" | "solution" | null;

function ExerciseTask({ brief, solution, path, level }: { brief: Brief; solution?: string; path: string; level: Difficulty }) {
  const [panel, setPanel] = useState<Panel>(() => (briefOpen() ? "brief" : null));
  const { isSolved, toggle } = useProgress();
  const solved = isSolved(path);

  const open = (target: "brief" | "solution") => {
    const next = panel === target ? null : target;
    setPanel(next);
    try {
      localStorage.setItem(BRIEF_KEY, String(next === "brief"));
    } catch {
      /* storage can be blocked */
    }
  };

  return (
    <aside className="exercise-task" aria-label="Exercise">
      <div className="exercise-task-bar">
        <button type="button" className="exercise-task-tab" aria-expanded={panel === "brief"} onClick={() => open("brief")}>
          <span aria-hidden="true">{panel === "brief" ? "▾" : "▸"}</span> Exercise brief
        </button>
        <button type="button" className="exercise-task-tab" aria-expanded={panel === "solution"} onClick={() => open("solution")}>
          <span aria-hidden="true">{panel === "solution" ? "▾" : "▸"}</span> Solution
        </button>
        <span className="exercise-task-spacer" />
        <DifficultyBadge level={level} />
        <button
          type="button"
          className={solved ? "solved-toggle is-solved" : "solved-toggle"}
          title={solved ? "Click to mark as not solved" : undefined}
          onClick={() => toggle(path)}
        >
          {solved ? "✓ Solved" : "Mark as solved"}
        </button>
      </div>
      {panel === "solution" && (
        <div className="exercise-task-body">{solution ? <Code>{solution}</Code> : <p>No solution is written for this exercise yet.</p>}</div>
      )}
      {panel === "brief" && (
        <div className="exercise-task-body">
          <p className="exercise-task-goal">{brief.goal}</p>
          <ol>
            {brief.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="exercise-task-apis">
            <span>Practises:</span>
            {brief.apis.map((a) => (
              <code key={a}>{a}</code>
            ))}
          </div>
          {brief.hint && (
            <details className="exercise-task-hint">
              <summary>Hint</summary>
              <p>{brief.hint}</p>
            </details>
          )}
        </div>
      )}
    </aside>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>Practice clone for learning · Built for Playwright exercises</span>
      <span>
        <a href="https://playwright.dev/docs/intro" target="_blank" rel="noopener noreferrer">
          Playwright docs
        </a>{" "}
        · Not affiliated with Playwright or Microsoft.
      </span>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const info = allPages.find((p) => p.path === pathname);
  const mod = registry[pathname];
  const isKnown =
    pathname === "/" || !!info || hiddenPaths.includes(pathname) || redirects.some((r) => r.from === pathname);
  const mobile = useMedia(MOBILE);
  const [navOpen, setNavOpen] = useState(false);
  const open = mobile && navOpen;
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = (focusToggle = false) => {
    setNavOpen(false);
    if (focusToggle) toggleRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    document.querySelector<HTMLElement>("#site-nav a")?.focus();
    document.body.classList.add("nav-locked");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("nav-locked");
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (info) document.title = `${info.label} · ${SITE_NAME}`;
    else if (pathname === "/") document.title = `${SITE_NAME} · Free Playwright Practice Exercises`;
    else if (!isKnown) document.title = `Page not found · ${SITE_NAME}`;
    else document.title = SITE_NAME;
  }, [info, isKnown, pathname]);

  return (
    <div className="app">
      <Sidebar open={open} onNavigate={() => close()} />
      {open && <div className="nav-backdrop" aria-hidden="true" onClick={() => close(true)} />}
      <div className="main-column">
        {mobile && (
          <header className="mobile-bar">
            <button
              ref={toggleRef}
              type="button"
              className="mobile-nav-toggle"
              aria-controls="site-nav"
              aria-expanded={open}
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className="mobile-nav-icon" aria-hidden="true" />
              <span className="visually-hidden">Open navigation</span>
            </button>
            <span className="mobile-bar-title">{SITE_NAME}</span>
          </header>
        )}
        <main className="main-content">
          {mobile && info?.needsDesktop && (
            <p className="desktop-note">
              Best on a desktop computer. This exercise needs a pointer or a physical keyboard, which touch screens do not have.
            </p>
          )}
          {info && mod?.brief && <ExerciseTask key={info.path} brief={mod.brief} solution={mod.solution} path={info.path} level={info.difficulty} />}
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="not-found">
      <div className="not-found-code" aria-hidden="true">
        404
      </div>
      <h1>Page not found</h1>
      <p>
        There is no page at <code>{pathname}</code>. It may have moved, or the link may have a typo.
      </p>
      <Link to="/" className="button-link">
        Back to home
      </Link>
    </div>
  );
}
