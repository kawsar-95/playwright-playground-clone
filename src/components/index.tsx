import { useId, useState, type ReactNode } from "react";

const LESSON_KEY = "qa-playground-lessons-open";

function lessonsOpen(): boolean {
  try {
    return localStorage.getItem(LESSON_KEY) === "true";
  } catch {
    return false;
  }
}

/** Title and one-line description at the top of a page. */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

/** Collapsible lesson. The open state is shared by all pages and saved in localStorage. */
export function Lesson({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(lessonsOpen);
  const descId = useId();
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(LESSON_KEY, String(next));
    } catch {
      /* storage can be blocked */
    }
  };
  return (
    <section className="lesson" aria-label={`Lesson: ${title}`}>
      <div className="lesson-header" onClick={toggle}>
        <button type="button" className="lesson-toggle" aria-expanded={open} aria-describedby={descId}>
          <span aria-hidden="true">{open ? "▾" : "▸"}</span> Lesson
        </button>
        <span id={descId} className="lesson-title">
          {title}
        </span>
      </div>
      {open && <div className="lesson-body">{children}</div>}
    </section>
  );
}

/** Code sample inside a lesson or a solution. */
export function Code({ children }: { children: string }) {
  return (
    <pre className="lesson-code">
      <code>{children.trim()}</code>
    </pre>
  );
}

/** White card that holds one group of controls to test. */
export function TestCard({ title, children, ...rest }: { title?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="test-card" {...rest}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </div>
  );
}
