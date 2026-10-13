import { useCallback, useEffect, useRef } from "react";

/** Like setTimeout, but every timer is cleared when the component unmounts. */
export function useLater() {
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach((id) => window.clearTimeout(id));
      active.clear();
    };
  }, []);

  return useCallback((callback: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      callback();
    }, delayMs);
    timers.current.add(id);
    return id;
  }, []);
}
