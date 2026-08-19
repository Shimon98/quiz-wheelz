import { useEffect } from "react";

/*
 * The one owner of window online/offline + document visibilitychange
 * subscriptions; handlers decide policy. Handlers must be stable.
 */

export function isDocumentHidden() {
  return document.visibilityState === "hidden";
}

export function isBrowserOffline() {
  return navigator.onLine === false;
}

export default function useBrowserLifecycleEvents({
  onOnline,
  onOffline,
  onVisible,
  onHidden,
}) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isDocumentHidden()) {
        onHidden?.();
      } else {
        onVisible?.();
      }
    };

    const handleOnline = () => onOnline?.();
    const handleOffline = () => onOffline?.();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onOnline, onOffline, onVisible, onHidden]);
}
