import { useCallback } from "react";
import { createStudentRaceEventSource } from "../../../api/studentRaceLiveApi.js";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import useEventSourceStream from "../../../shared/live/useEventSourceStream.js";
import { mapStudentRaceLiveSignal } from "../runtime/mapStudentRaceLiveSignal.js";

const STREAM_UNAVAILABLE_MESSAGE = "Student live stream unavailable";

export default function useStudentRaceEventStream({ enabled, afterVersion, onSignal, onError, generation = 0 }) {
  const createSource = useCallback(() => createStudentRaceEventSource(afterVersion), [afterVersion]);

  const handleMessage = useCallback((message) => {
    try {
      onSignal(mapStudentRaceLiveSignal(JSON.parse(message.data)));
    } catch (error) {
      onError?.(normalizeApiError(error));
    }
  }, [onSignal, onError]);

  const handleError = useCallback(({ error }) => {
    onError?.(normalizeApiError(error ?? new Error(STREAM_UNAVAILABLE_MESSAGE)));
  }, [onError]);

  useEventSourceStream({
    enabled,
    generation,
    createSource,
    onMessage: handleMessage,
    onError: handleError,
  });
}
