import { useCallback, useEffect, useState } from "react";

import { getTeacherRaceLiveState } from "../../../api/teacherRaceLiveApi";
import { normalizeApiError } from "../../../errors/normalizeApiError";
import { mapTeacherRaceLiveState } from "../runtime/mapTeacherRaceLiveState";

function buildRequestKey(raceId, reloadToken) {
  return `${raceId}:${reloadToken}`;
}

export default function useTeacherRaceLive(raceId) {
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = buildRequestKey(raceId, reloadToken);

  useEffect(() => {
    let isActive = true;

    async function loadLiveState() {
      try {
        const runtime = mapTeacherRaceLiveState(
          await getTeacherRaceLiveState(raceId),
        );

        if (isActive) {
          setResult({ requestKey, runtime, error: null });
        }
      } catch (rawError) {
        if (isActive) {
          setResult({
            requestKey,
            runtime: null,
            error: normalizeApiError(rawError),
          });
        }
      }
    }

    loadLiveState();

    return () => {
      isActive = false;
    };
  }, [raceId, requestKey]);

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const isSettled = result?.requestKey === requestKey;

  return {
    runtime: isSettled ? result.runtime : null,
    error: isSettled ? result.error : null,
    isLoading: !isSettled,
    retry,
  };
}
