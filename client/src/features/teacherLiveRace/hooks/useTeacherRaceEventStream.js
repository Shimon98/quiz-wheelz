import { useCallback } from "react";

import { createTeacherRaceEventSource } from "../../../api/teacherRaceLiveApi";
import { normalizeApiError } from "../../../errors/normalizeApiError";
import useEventSourceStream from "../../../shared/live/useEventSourceStream";
import { mapTeacherLiveEventEnvelope } from "../runtime/liveEvents/mapTeacherLiveEventEnvelope";

export default function useTeacherRaceEventStream({
  enabled,
  raceId,
  afterVersion,
  generation,
  onOpen,
  onEvent,
  onError,
}) {
  const createSource = useCallback(
    () => createTeacherRaceEventSource(raceId, afterVersion),
    [raceId, afterVersion],
  );

  const handleMessage = useCallback(
    (message) => {
      try {
        onEvent(mapTeacherLiveEventEnvelope(JSON.parse(message.data)));
      } catch (error) {
        onError({ error: normalizeApiError(error) });
      }
    },
    [onEvent, onError],
  );

  useEventSourceStream({
    enabled,
    generation,
    createSource,
    onOpen,
    onMessage: handleMessage,
    onError,
  });
}
