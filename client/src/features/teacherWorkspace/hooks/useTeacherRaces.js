import { useEffect, useState } from "react";

import { getTeacherDashboard } from "../../../api/teacherApi";

const EMPTY_RACES = Object.freeze([]);

/**
 * useTeacherRaces — the full race list for the all-races page.
 *
 * ponytail: the server has no dedicated GET /teacher/races endpoint yet —
 * the dashboard response already carries the full races list, so we read it
 * from there. When Diana ships a dedicated (possibly paginated) endpoint,
 * this hook is the only place that changes.
 */
export default function useTeacherRaces() {
  const [races, setRaces] = useState(EMPTY_RACES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  function refetch() {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }

  useEffect(() => {
    let isActive = true;

    async function loadRaces() {
      try {
        const dashboardResponse = await getTeacherDashboard();

        if (isActive) {
          setRaces(
            Array.isArray(dashboardResponse?.races)
              ? dashboardResponse.races
              : EMPTY_RACES,
          );
          setError(null);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadRaces();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  return { races, isLoading, error, refetch };
}
