import { useCallback, useEffect, useState } from "react";

import { getTeacherRaceResults } from "../../../api/teacherRaceResultsApi";
import { normalizeApiError } from "../../../errors/normalizeApiError";
import { mapTeacherRaceResults } from "../runtime/mapTeacherRaceResults";

export default function useTeacherRaceResults(raceId) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadResults() {
      try {
        const mapped = mapTeacherRaceResults(await getTeacherRaceResults(raceId));

        if (isActive) {
          setResults(mapped);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) {
          setResults(null);
          setError(normalizeApiError(requestError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      isActive = false;
    };
  }, [raceId, reloadToken]);

  return { results, error, isLoading, retry };
}
