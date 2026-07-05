import { useEffect, useRef } from "react";

// focus + visibilitychange together cover both switching browser tabs and
// switching apps (e.g. Postman -> browser); the throttle collapses the
// double-fire when both land at once.
const MIN_REFRESH_GAP_MS = 1500;

/**
 * useRefetchOnWindowFocus — quietly re-runs `refetch` when the user comes
 * back to the tab/window, so list data (race player counts, statuses)
 * catches up without manual reloads. Pass a SILENT refetch (one that doesn't
 * flip a loading flag) to avoid skeleton flashes on every alt-tab.
 */
export default function useRefetchOnWindowFocus(refetch) {
  const lastRunRef = useRef(0);

  useEffect(() => {
    function run() {
      const now = Date.now();
      if (now - lastRunRef.current < MIN_REFRESH_GAP_MS) {
        return;
      }
      lastRunRef.current = now;
      refetch();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        run();
      }
    }

    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refetch]);
}
