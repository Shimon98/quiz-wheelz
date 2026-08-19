import { useEffect, useRef } from "react";

/*
 * Calls the consumer's authoritative refresh on resyncToken ADVANCES; the
 * mount token is skipped (the initial load already covers it).
 */
export default function useRuntimeSessionResync(resyncToken, onResync) {
  const handledTokenRef = useRef(resyncToken);

  useEffect(() => {
    if (handledTokenRef.current === resyncToken) {
      return;
    }

    handledTokenRef.current = resyncToken;
    onResync();
  }, [resyncToken, onResync]);
}
