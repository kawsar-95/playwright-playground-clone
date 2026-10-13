import { useState } from "react";
import { Link } from "react-router-dom";
import { allPages, groups, type Difficulty } from "./nav";
import { useProgress } from "./progress";
import { DifficultyBadge } from "./Layout";

const filters: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export default function Home() {
  const { solved, isSolved, reset } = useProgress();
  const [level, setLevel] = useState<Difficulty | "all">("all");
  const done = allPages.filter((p) => isSolved(p.path)).length;
  const percent = Math.round((done / allPages.length) * 100);
  const next = allPages.find((p) => !isSolved(p.path));
  const visible = groups
    .map((g) => ({ ...g, visible: g.pages.filter((p) => level === "all" || p.difficulty === level) }))
    .filter((g) => g.visible.length > 0);

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-eyebrow">QA Playground · Playwright &amp; TypeScript</div>
        <h1 id="home-title">Learn Playwright by testing a real app</h1>
        <div className="home-intro">
          <p>
            This is a practice site for Playwright with TypeScript. It is for manual testers who move into automation,
            developers who write their first end-to-end tests, and anyone who prepares for a test automation job.
          </p>
          <p>
            Real applications are hard to test. Buttons share names, elements load late, forms sit in iframes, timing is
            flaky and much of the logic is behind an API. Each exercise recreates one of these problems on purpose.
          </p>
          <p>It is free and needs no sign-up. Your progress is saved in your browser.</p>
        </div>
        <div className="home-cta">
          {next ? (
            <Link to={next.path} className="button-link">
              {done === 0 ? "Start with" : "Continue:"} {next.label} →
            </Link>
          ) : (
            <strong>All exercises solved 🎉</strong>
          )}
          <div className="home-progress">
            <span>
              {groups.length} categories · {allPages.length} exercises · {done} solved ({percent}%)
            </span>
            <div
              className="progress-meter"
              role="progressbar"
              aria-label="Overall progress"
              aria-valuemin={0}
              aria-valuemax={allPages.length}
              aria-valuenow={done}
            >
              <div style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="home-steps" aria-labelledby="how-it-works">
        <h2 id="how-it-works">How it works</h2>
        <ol>
          <li>
            <strong>Read the brief</strong>
            <span>Each exercise starts with the goal, the steps and the Playwright APIs it practises.</span>
          </li>
          <li>
            <strong>Write your test</strong>
            <span>
              In your own Playwright project, set <code>baseURL</code> to the address of this site and write the test.
            </span>
          </li>
          <li>
            <strong>Compare with the solution</strong>
            <span>Each exercise has a full working test. It stays hidden until you open it. Then mark the exercise as solved.</span>
          </li>
        </ol>
      </section>

      <div className="page-header home-section-header">
        <h2>Testing Areas</h2>
        <p>Choose an area and start to practice. Mark an exercise as solved on its page to track your progress.</p>
      </div>
      <div className="home-toolbar">
        <div className="filter-chips" role="group" aria-label="Filter by difficulty">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={level === f.value ? "chip is-active" : "chip"}
              aria-pressed={level === f.value}
              onClick={() => setLevel(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {solved.length > 0 && (
          <button
            type="button"
            className="danger secondary"
            onClick={() => window.confirm("Reset your progress? This cannot be undone.") && reset()}
          >
            Reset progress
          </button>
        )}
      </div>

      <div className="category-grid">
        {visible.map((g) => {
          const n = g.pages.filter((p) => isSolved(p.path)).length;
          const pct = Math.round((n / g.pages.length) * 100);
          return (
            <article key={g.title} className="home-category-card" aria-labelledby={`category-${slug(g.title)}`}>
              <div className="home-category-header">
                <h3 id={`category-${slug(g.title)}`}>{g.title}</h3>
                <span className={n === g.pages.length ? "home-category-count is-complete" : "home-category-count"}>
                  {n}/{g.pages.length}
                </span>
              </div>
              <div className="progress-meter" aria-hidden="true">
                <div style={{ width: `${pct}%` }} />
              </div>
              <p>{g.description}</p>
              <ul className="exercise-list">
                {g.visible.map((p) => (
                  <li key={p.path}>
                    <Link to={p.path}>{p.label}</Link>
                    <DifficultyBadge level={p.difficulty} />
                    {isSolved(p.path) && (
                      <span className="exercise-solved">
                        <span aria-hidden="true">✓</span>
                        <span className="visually-hidden">Solved</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </>
  );
}
