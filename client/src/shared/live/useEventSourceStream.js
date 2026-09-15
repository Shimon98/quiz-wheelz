import { useEffect, useRef } from "react";

export const EVENT_SOURCE_READY_STATES = Object.freeze({
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
});

export default function useEventSourceStream({
  enabled,
  generation = 0,
  createSource,
  onOpen,
  onMessage,
  onError,
}) {
  const latest = useRef({ createSource, onOpen, onMessage, onError });

  useEffect(() => {
    latest.current = { createSource, onOpen, onMessage, onError };
  }, [createSource, onOpen, onMessage, onError]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let source;
    let closed = false;

    try {
      source = latest.current.createSource();
    } catch (error) {
      latest.current.onError?.({
        error,
        readyState: EVENT_SOURCE_READY_STATES.CLOSED,
      });
      return undefined;
    }

    source.onopen = () => {
      if (!closed) {
        latest.current.onOpen?.({ readyState: source.readyState });
      }
    };

    source.onmessage = (message) => {
      if (!closed) {
        latest.current.onMessage?.(message);
      }
    };

    source.onerror = () => {
      if (!closed) {
        latest.current.onError?.({ readyState: source.readyState });
      }
    };

    return () => {
      closed = true;
      source.onopen = null;
      source.onmessage = null;
      source.onerror = null;
      source.close();
    };
  }, [enabled, generation]);
}
