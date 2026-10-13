import { useCallback, useEffect, useRef } from "react";

/** Timers that stop when the component unmounts. */
export function useTimers() {
  const timeouts = useRef(new Set<number>());
  const intervals = useRef(new Set<number>());

  useEffect(() => {
    const t = timeouts.current;
    const i = intervals.current;
    return () => {
      t.forEach((id) => window.clearTimeout(id));
      i.forEach((id) => window.clearInterval(id));
      t.clear();
      i.clear();
    };
  }, []);

  const later = useCallback((callback: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timeouts.current.delete(id);
      callback();
    }, ms);
    timeouts.current.add(id);
    return id;
  }, []);

  const every = useCallback((callback: () => void, ms: number) => {
    const id = window.setInterval(callback, ms);
    intervals.current.add(id);
    return id;
  }, []);

  const cancel = useCallback((id: number | null | undefined) => {
    if (id == null) return;
    window.clearTimeout(id);
    window.clearInterval(id);
    timeouts.current.delete(id);
    intervals.current.delete(id);
  }, []);

  return { later, every, cancel };
}
