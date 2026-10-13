import { useCallback, useEffect, useRef } from "react";

/**
 * Timer helpers that clear every pending timer when the component unmounts.
 * `later` is setTimeout, `every` is setInterval, and `cancel` clears either one.
 */
export function useTimers() {
  const timeouts = useRef(new Set<number>());
  const intervals = useRef(new Set<number>());

  useEffect(() => {
    const pendingTimeouts = timeouts.current;
    const pendingIntervals = intervals.current;
    return () => {
      pendingTimeouts.forEach((id) => window.clearTimeout(id));
      pendingIntervals.forEach((id) => window.clearInterval(id));
      pendingTimeouts.clear();
      pendingIntervals.clear();
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timeouts.current.delete(id);
      fn();
    }, ms);
    timeouts.current.add(id);
    return id;
  }, []);

  const every = useCallback((fn: () => void, ms: number) => {
    const id = window.setInterval(fn, ms);
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
