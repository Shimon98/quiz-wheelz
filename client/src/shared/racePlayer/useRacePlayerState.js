import { useCallback, useEffect, useRef, useState } from "react";

import { getRaceState } from "../../api/racePlayerApi";
import { normalizeApiError } from "../../errors/normalizeApiError";


export default function useRacePlayerState() {
  const [raceState, setRaceState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);
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
  const authoritativeResync = useCallback(() => {
    isLoadingRef.current = true;
    setReloadToken((token) => token + 1);
  }, []);
  const isSilentRefreshingRef = useRef(false);

  const silentRefresh = useCallback(() => {
    if (isLoadingRef.current || isSilentRefreshingRef.current) {
      return;
    }

    isSilentRefreshingRef.current = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    return getRaceState()
      .then((response) => {
        if (requestId === requestIdRef.current) {
          setRaceState(response);
          setError(null);
        }
      })
      .catch((rawError) => {
        if (requestId === requestIdRef.current) {
          setError(normalizeApiError(rawError));
        }
      })
      .finally(() => {
        isSilentRefreshingRef.current = false;
      });
  }, []);

  return { raceState, isLoading, error, retry, silentRefresh, authoritativeResync };
}
