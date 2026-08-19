import { useCallback, useMemo, useState } from "react";

import useIntervalWhen from "../../../shared/hooks/useIntervalWhen.js";
import useRacePlayerState from "../../../shared/racePlayer/useRacePlayerState.js";
import { getRaceView, RACE_VIEWS } from "../../../shared/racePlayer/getRaceView.js";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { isRacePlayerSessionError } from "../../../errors/errorChecks.js";
import { mapRaceStateToRuntime } from "../runtime/mapRaceStateToRuntime.js";
import { applyRaceSnapshot } from "../runtime/applyRaceSnapshot.js";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig.js";

/*
 * useRaceBootstrap — the student race feature's orchestration layer. It only
 * COMPOSES the existing pieces:
 *
 *   useRacePlayerState()          request lifecycle (shared loader)
 *           ↓ raceState
 *   mapRaceStateToRuntime()       server DTO → StudentRaceRuntimeState
 *           ↓ + latest answer snapshot (applyRaceSnapshot)
 *   getRaceView()                 authoritative state → client view
 *
 * and returns { runtimeState, view, isLoading, error, retry,
 * applyAuthoritativeSnapshot } for StudentRacePage. The runtime is DERIVED
 * from the loader's raceState (no duplicated React state); a mapping failure
 * (ApiContractError) surfaces as a normalized API_CONTRACT error. No
 * navigation, polling, notifications or session redirects here — the
 * page/guard layers decide what to DO.
 *
 * Answer snapshots (C1-03/03M): submit-answer returns the same
 * authoritative snapshot shape as race-state; the latest one is laid over
 * the race-state baseline through the SAME applyRaceSnapshot owner, and
 * `snapshotAtEpochMs` freshness ordering inside it decides which truth is
 * newer — an old race-state response that arrives late can never roll a
 * newer answer snapshot backward, and a fresher poll supersedes a stale
 * answer override on its own.
 *
 * Polling (C1-03M): the server advances position continuously with time, so
 * while the view is authoritatively PLAYING this hook silently re-syncs
 * race-state every raceStatePollMs. NOT the C1-05 heartbeat — pure gameplay
 * truth refresh; a future SSE stream replaces only this timer trigger.
 */
// syncEnabled (C1-05): a degraded connection pauses only the polling trigger.
export default function useRaceBootstrap({ syncEnabled = true } = {}) {
  const {
    raceState,
    isLoading,
    error: requestError,
    retry,
    silentRefresh,
    authoritativeResync,
  } = useRacePlayerState();

  const [answerSnapshot, setAnswerSnapshot] = useState(null);

  const applyAuthoritativeSnapshot = useCallback((snapshot) => {
    setAnswerSnapshot(snapshot);
  }, []);

  const { runtimeState, mappingError } = useMemo(() => {
    if (raceState == null) {
      return { runtimeState: null, mappingError: null };
    }

    try {
      const baseline = mapRaceStateToRuntime(raceState);
      const runtime = answerSnapshot
        ? applyRaceSnapshot(baseline, answerSnapshot)
        : baseline;

      return { runtimeState: runtime, mappingError: null };
    } catch (rawError) {
      return { runtimeState: null, mappingError: normalizeApiError(rawError) };
    }
  }, [raceState, answerSnapshot]);

  // View exists only for real server state; UNKNOWN is a valid view (an
  // unrecognized status combination), NOT an API contract error.
  const view = runtimeState ? getRaceView(runtimeState) : null;

  // A failed request has no fresh DTO to map — request errors win. The
  // loader keeps the last successful raceState on refetch failures, so
  // runtimeState/view can stay available ALONGSIDE the error.
  const error = requestError ?? mappingError;

  // Silent gameplay sync while PLAYING only: no polling for waiting/
  // finished/cancelled views, and never once race-state has reported a dead
  // RacePlayer session.
  useIntervalWhen(
    silentRefresh,
    STUDENT_RACE_CONFIG.raceStatePollMs,
    syncEnabled &&
      view === RACE_VIEWS.PLAYING &&
      !isRacePlayerSessionError(error),
  );

  return {
    runtimeState,
    view,
    isLoading,
    error,
    retry,
    authoritativeResync,
    applyAuthoritativeSnapshot,
  };
}
