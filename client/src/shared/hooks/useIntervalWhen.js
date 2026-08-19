import { useEffect } from "react";

/*
 * Runs `callback` every `delayMs` while `enabled` — the one shared interval
 * lifecycle owner. Callbacks must be stable (useCallback).
 */
export default function useIntervalWhen(callback, delayMs, enabled) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timer = setInterval(callback, delayMs);

    return () => {
      clearInterval(timer);
    };
  }, [callback, delayMs, enabled]);
}
