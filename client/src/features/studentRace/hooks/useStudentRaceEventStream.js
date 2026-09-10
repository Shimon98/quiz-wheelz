import { useEffect, useRef } from "react";
import { createStudentRaceEventSource } from "../../../api/studentRaceLiveApi.js";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { mapStudentRaceLiveSignal } from "../runtime/mapStudentRaceLiveSignal.js";

export default function useStudentRaceEventStream({ enabled, afterVersion, onSignal, onError, generation = 0 }) {
  const latest = useRef({ afterVersion, onSignal, onError });
  useEffect(() => {
    latest.current = { afterVersion, onSignal, onError };
  }, [afterVersion, onSignal, onError]);

  useEffect(() => {
    if (!enabled) return;
    let source;
    let closed = false;
    try {
      source = createStudentRaceEventSource(latest.current.afterVersion);
    } catch (error) {
      latest.current.onError?.(normalizeApiError(error));
      return;
    }
    source.onmessage = (event) => {
      if (closed) return;
      try {
        latest.current.onSignal(mapStudentRaceLiveSignal(JSON.parse(event.data)));
      } catch (error) {
        latest.current.onError?.(normalizeApiError(error));
      }
    };
    source.onerror = () => {
      if (!closed) latest.current.onError?.(normalizeApiError(new Error("Student live stream unavailable")));
    };
    return () => {
      closed = true;
      source.onmessage = null;
      source.onerror = null;
      source.close();
    };
  }, [enabled, generation]);
}
