import { useEffect } from "react";
import { SITE_NAME } from "../../nav";

/** Sets the title of the browser tab. The layout sets its own title first, so this runs after it. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const id = window.setTimeout(() => {
      document.title = `${title} · ${SITE_NAME}`;
    }, 0);
    return () => window.clearTimeout(id);
  }, [title]);
}
