import { useCallback, useEffect, useRef, useState } from "react";

import { getRaceState } from "../../api/racePlayerApi";
import { normalizeApiError } from "../../errors/normalizeApiError";

/*
 * useRacePlayerState — the ONE reusable loader for the current RacePlayer's
 * server state (GET race-state). The student race bootstrap and the waiting
 * flow both consume this request lifecycle instead of duplicating it.
 *
 * Owns ONLY: load-on-mount, loading flag, normalized error, manual retry.
 * Returns the RAW StudentRaceStateResponse — mapping into the race runtime
 * (mapRaceStateToRuntime) and status interpretation belong to the feature
 * layer, which also decides what to DO about an error (retry UI, navigation,
 * toast). The RacePlayer identity lives in the HttpOnly race cookie the
 * browser sends on its own — nothing is read from local/session storage.
 *
 * Loading runs in one place — the effect below. retry() bumps the reload
 * token from an event handler (the project's single-fetch-path pattern, see
 * useTeacherDashboardHome) and is a no-op while a load is already running.
 * A refetch failure keeps the last successful raceState and only reports
 * the normalized error — known state is not destroyed by a transient blip.
 *
 * silentRefresh() (C1-03M) is the polling-grade variant: same authoritative
 * request, but it never raises isLoading (no loading flicker at a 2s
 * gameplay-sync cadence), keeps last-known state on failure, and is
 * single-flight against both itself and retry(). Callers own the interval;
 * this hook only owns the request lifecycle.
 */
export default function useRacePlayerState() {
  const [raceState, setRaceState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Latest-request-wins: every load bumps the id, and a resolution that
  // belongs to an older id (superseded retry, unmounted consumer, StrictMode
  // re-run) skips its state updates instead of overwriting newer state.
  const requestIdRef = useRef(0);
  // Mirrors isLoading so retry can check it without a stale closure.
  const isLoadingRef = useRef(true);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function loadRaceState() {
      try {
        const response = await getRaceState();

        if (requestId === requestIdRef.current) {
          setRaceState(response);
          setError(null);
        }
      } catch (rawError) {
        if (requestId === requestIdRef.current) {
          // Keep the last successful raceState — report the failure only.
          setError(normalizeApiError(rawError));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    }

    loadRaceState();

    return () => {
      // Abandon any in-flight request: its late resolution sees a newer id
      // and performs no state updates.
      requestIdRef.current += 1;
    };
  }, [reloadToken]);

  const retry = useCallback(() => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  // Single-flight guard for silent refreshes (retry() has isLoadingRef).
  const isSilentRefreshingRef = useRef(false);

  const silentRefresh = useCallback(() => {
    if (isLoadingRef.current || isSilentRefreshingRef.current) {
      return;
    }

    isSilentRefreshingRef.current = true;
    // Claim latest-request-wins like every other load; a retry() started
    // afterwards supersedes this response the usual way.
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    getRaceState()
      .then((response) => {
        if (requestId === requestIdRef.current) {
          setRaceState(response);
          setError(null);
        }
      })
      .catch((rawError) => {
        if (requestId === requestIdRef.current) {
          // Keep the last successful raceState — report the failure only.
          setError(normalizeApiError(rawError));
        }
      })
      .finally(() => {
        isSilentRefreshingRef.current = false;
      });
  }, []);

  return { raceState, isLoading, error, retry, silentRefresh };
}
