import { useMemo } from "react";

import useRacePlayerState from "../../../shared/racePlayer/useRacePlayerState.js";
import { getRaceView } from "../../../shared/racePlayer/getRaceView.js";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import { mapRaceStateToRuntime } from "../runtime/mapRaceStateToRuntime.js";

/*
 * useRaceBootstrap — the student race feature's orchestration layer. It only
 * COMPOSES the existing pieces:
 *
 *   useRacePlayerState()          request lifecycle (shared loader)
 *           ↓ raceState
 *   mapRaceStateToRuntime()       server DTO → StudentRaceRuntimeState
 *           ↓ runtimeState
 *   getRaceView()                 authoritative state → client view
 *
 * and returns { runtimeState, view, isLoading, error, retry } for the future
 * StudentRacePage. The runtime is DERIVED from the loader's raceState (no
 * duplicated React state); a mapping failure (ApiContractError) surfaces as
 * a normalized API_CONTRACT error. No navigation, polling, notifications or
 * session redirects here — the page/guard layers decide what to DO.
 */
export default function useRaceBootstrap() {
  const {
    raceState,
    isLoading,
    error: requestError,
    retry,
  } = useRacePlayerState();

  const { runtimeState, mappingError } = useMemo(() => {
    if (raceState == null) {
      return { runtimeState: null, mappingError: null };
    }

    try {
      return {
        runtimeState: mapRaceStateToRuntime(raceState),
        mappingError: null,
      };
    } catch (rawError) {
      return { runtimeState: null, mappingError: normalizeApiError(rawError) };
    }
  }, [raceState]);

  // View exists only for real server state; UNKNOWN is a valid view (an
  // unrecognized status combination), NOT an API contract error.
  const view = runtimeState ? getRaceView(runtimeState) : null;

  // A failed request has no fresh DTO to map — request errors win. The
  // loader keeps the last successful raceState on refetch failures, so
  // runtimeState/view can stay available ALONGSIDE the error.
  const error = requestError ?? mappingError;

  return { runtimeState, view, isLoading, error, retry };
}
