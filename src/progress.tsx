import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const KEY = "qa-playground-solved";

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

interface Progress {
  solved: string[];
  isSolved: (path: string) => boolean;
  toggle: (path: string) => void;
  reset: () => void;
}

const Ctx = createContext<Progress | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [solved, setSolved] = useState<string[]>(load);

  const save = (next: string[]) => {
    setSolved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage can be blocked */
    }
  };

  const toggle = useCallback(
    (path: string) => save(solved.includes(path) ? solved.filter((p) => p !== path) : [...solved, path]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [solved],
  );

  const value = useMemo<Progress>(
    () => ({ solved, isSolved: (p) => solved.includes(p), toggle, reset: () => save([]) }),
    [solved, toggle],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): Progress {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress needs ProgressProvider");
  return v;
}
