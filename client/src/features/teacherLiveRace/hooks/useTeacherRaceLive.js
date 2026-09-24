import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { getTeacherRaceLiveState } from "../../../api/teacherRaceLiveApi";
import { normalizeApiError } from "../../../errors/normalizeApiError";
import { isTransientError } from "../../../errors/errorChecks";
import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import useBrowserLifecycleEvents, {
  isBrowserOffline,
} from "../../../shared/hooks/useBrowserLifecycleEvents";
import { EVENT_SOURCE_READY_STATES } from "../../../shared/live/useEventSourceStream";
import { TEACHER_RACE_LIVE_CONFIG } from "../config/teacherRaceLiveConfig";
import { mapTeacherRaceLiveState } from "../runtime/mapTeacherRaceLiveState";
import {
  INITIAL_TEACHER_LIVE_STATE,
  TEACHER_LIVE_ACTIONS,
  teacherRaceLiveReducer,
} from "../runtime/teacherRaceLiveReducer";
import {
  TEACHER_LIVE_RECOVERY_REASONS,
  TEACHER_STREAM_STATUSES,
} from "../runtime/teacherRaceLiveConstants";
import { computeRecoveryDelayMs } from "../utils/computeRecoveryDelayMs";
import { resolveTeacherConnectionState } from "../utils/resolveTeacherConnectionState";
import useTeacherRaceEventStream from "./useTeacherRaceEventStream";

const EMPTY_EVENTS = Object.freeze([]);
const RECOVERY_CONFIG = TEACHER_RACE_LIVE_CONFIG.recovery;

export default function useTeacherRaceLive(raceId) {
  const [state, dispatch] = useReducer(
    teacherRaceLiveReducer,
    INITIAL_TEACHER_LIVE_STATE,
  );
  const [failure, setFailure] = useState(null);
  const [streamStatus, setStreamStatus] = useState(TEACHER_STREAM_STATUSES.IDLE);
  const [isOnline, setIsOnline] = useState(() => !isBrowserOffline());
  const generationRef = useRef(0);
  const inFlightGenerationRef = useRef(null);
  const attemptRef = useRef(0);
  const timersRef = useRef({ grace: null, retry: null });
  const runtimeRef = useRef(null);
  const loadRef = useRef(null);

  const isCurrentRace = state.raceId === raceId;
  const runtime = isCurrentRace ? state.runtime : null;
  const serverClock = isCurrentRace ? state.serverClock : null;
  const recentEvents = isCurrentRace ? state.recentEvents : EMPTY_EVENTS;
  const recovery = isCurrentRace ? state.recovery : null;
  const error = failure?.raceId === raceId ? failure.error : null;
  const isEnded = runtime?.race.status === RACE_STATUSES.FINISHED;

  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  const clearTimers = useCallback(() => {
    clearTimeout(timersRef.current.grace);
    clearTimeout(timersRef.current.retry);
    timersRef.current = { grace: null, retry: null };
  }, []);

  const scheduleRetry = useCallback((generation) => {
    const delayMs = computeRecoveryDelayMs(
      attemptRef.current,
      RECOVERY_CONFIG,
      Math.random(),
    );
    attemptRef.current += 1;
    timersRef.current.retry = setTimeout(() => {
      timersRef.current.retry = null;
      loadRef.current(generation);
    }, delayMs);
  }, []);

  const loadLiveState = useCallback(
    async (generation) => {
      if (
        generation !== generationRef.current ||
        inFlightGenerationRef.current === generation
      ) {
        return;
      }

      clearTimeout(timersRef.current.retry);
      timersRef.current.retry = null;
      inFlightGenerationRef.current = generation;

      try {
        const response = await getTeacherRaceLiveState(raceId);

        if (generation === generationRef.current) {
          const nextRuntime = mapTeacherRaceLiveState(response);
          attemptRef.current = 0;
          setStreamStatus(TEACHER_STREAM_STATUSES.OPENING);
          dispatch({
            type: TEACHER_LIVE_ACTIONS.AUTHORITATIVE_STATE_LOADED,
            raceId,
            runtime: nextRuntime,
            receivedAtPerformanceNow: performance.now(),
          });
        }
      } catch (rawError) {
        if (generation === generationRef.current) {
          const normalizedError = normalizeApiError(rawError);
          const canRetry =
            runtimeRef.current != null &&
            isTransientError(normalizedError) &&
            !isBrowserOffline();

          if (canRetry) {
            scheduleRetry(generation);
          } else {
            setFailure({ raceId, error: normalizedError });
          }
        }
      } finally {
        if (inFlightGenerationRef.current === generation) {
          inFlightGenerationRef.current = null;
        }
      }
    },
    [raceId, scheduleRetry],
  );

  useEffect(() => {
    loadRef.current = loadLiveState;
  }, [loadLiveState]);

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;
    attemptRef.current = 0;
    inFlightGenerationRef.current = null;
    loadRef.current(generation);

    return () => {
      generationRef.current += 1;
      clearTimers();
    };
  }, [raceId, clearTimers]);

  useEffect(() => {
    if (recovery != null && isOnline && error == null && !isEnded) {
      loadRef.current(generationRef.current);
    }
  }, [recovery, isOnline, error, isEnded]);

  useEffect(() => {
    if (isEnded) {
      clearTimers();
    }
  }, [isEnded, clearTimers]);

  const requestRecovery = useCallback((reason) => {
    dispatch({ type: TEACHER_LIVE_ACTIONS.RECOVERY_REQUESTED, reason });
  }, []);

  const handleStreamOpen = useCallback(() => {
    clearTimeout(timersRef.current.grace);
    timersRef.current.grace = null;
    attemptRef.current = 0;
    setStreamStatus(TEACHER_STREAM_STATUSES.OPEN);
  }, []);

  const handleStreamEvent = useCallback((event) => {
    dispatch({ type: TEACHER_LIVE_ACTIONS.LIVE_EVENT_RECEIVED, event });
  }, []);

  const handleStreamError = useCallback(
    ({ readyState, error: streamError }) => {
      if (readyState === EVENT_SOURCE_READY_STATES.CLOSED) {
        requestRecovery(TEACHER_LIVE_RECOVERY_REASONS.STREAM_CLOSED);
        return;
      }

      if (streamError != null) {
        requestRecovery(TEACHER_LIVE_RECOVERY_REASONS.MALFORMED_EVENT);
        return;
      }

      setStreamStatus(TEACHER_STREAM_STATUSES.RETRYING);

      if (timersRef.current.grace == null) {
        timersRef.current.grace = setTimeout(() => {
          timersRef.current.grace = null;
          requestRecovery(TEACHER_LIVE_RECOVERY_REASONS.RECONNECT_TIMEOUT);
        }, RECOVERY_CONFIG.nativeReconnectGraceMs);
      }
    },
    [requestRecovery],
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    requestRecovery(TEACHER_LIVE_RECOVERY_REASONS.BROWSER_ONLINE);
  }, [requestRecovery]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    clearTimers();
  }, [clearTimers]);

  useBrowserLifecycleEvents({ onOnline: handleOnline, onOffline: handleOffline });

  useTeacherRaceEventStream({
    enabled:
      runtime != null &&
      !isEnded &&
      recovery == null &&
      isOnline &&
      error == null,
    raceId,
    afterVersion: runtime?.eventVersion ?? 0,
    generation: state.loadCount,
    onOpen: handleStreamOpen,
    onEvent: handleStreamEvent,
    onError: handleStreamError,
  });

  const retry = useCallback(() => {
    setFailure(null);
    setStreamStatus(TEACHER_STREAM_STATUSES.OPENING);
    attemptRef.current = 0;
    loadRef.current(generationRef.current);
  }, []);

  return {
    runtime,
    serverClock,
    recentEvents,
    connectionState: resolveTeacherConnectionState({
      runtime,
      error,
      isOnline,
      recovery,
      streamStatus,
    }),
    isLoading: runtime == null && error == null,
    error,
    retry,
  };
}
