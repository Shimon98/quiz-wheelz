import { useCallback, useMemo, useState } from "react";

import useRacePlayerState from "../../../shared/racePlayer/useRacePlayerState.js";
import { getRaceView } from "../../../shared/racePlayer/getRaceView.js";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { mapRaceStateToRuntime } from "../runtime/mapRaceStateToRuntime.js";
import { applyRaceSnapshot } from "../runtime/applyRaceSnapshot.js";

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
 * Answer snapshots (C1-03): submit-answer returns the same authoritative
 * snapshot shape as race-state; the latest one overrides the baseline via
 * the SAME applyRaceSnapshot owner. The override is keyed to the raceState
 * instance it arrived on top of, so a successful race-state refetch (a new
 * instance) automatically supersedes any stale answer override — fresh
 * server truth always wins, with zero extra bookkeeping.
 */
export default function useRaceBootstrap() {
  const {
    raceState,
    isLoading,
    error: requestError,
    retry,
  } = useRacePlayerState();

  const [answerOverride, setAnswerOverride] = useState(null);

  const applyAuthoritativeSnapshot = useCallback(
    (snapshot) => {
      setAnswerOverride({ snapshot, baseRaceState: raceState });
    },
    [raceState],
  );

  const { runtimeState, mappingError } = useMemo(() => {
    if (raceState == null) {
      return { runtimeState: null, mappingError: null };
    }

    try {
      const baseline = mapRaceStateToRuntime(raceState);
      const runtime =
        answerOverride?.baseRaceState === raceState
          ? applyRaceSnapshot(baseline, answerOverride.snapshot)
          : baseline;

      return { runtimeState: runtime, mappingError: null };
    } catch (rawError) {
      return { runtimeState: null, mappingError: normalizeApiError(rawError) };
    }
  }, [raceState, answerOverride]);

  // View exists only for real server state; UNKNOWN is a valid view (an
  // unrecognized status combination), NOT an API contract error.
  const view = runtimeState ? getRaceView(runtimeState) : null;

  // A failed request has no fresh DTO to map — request errors win. The
  // loader keeps the last successful raceState on refetch failures, so
  // runtimeState/view can stay available ALONGSIDE the error.
  const error = requestError ?? mappingError;

  return {
    runtimeState,
    view,
    isLoading,
    error,
    retry,
    applyAuthoritativeSnapshot,
  };
}
