import { useCallback, useEffect, useMemo, useState } from "react";
import { getTeacherDashboard } from "../../../api/teacherApi";
import { buildDashboardStats } from "../utils/dashboardStatsUtils";

const EMPTY_RACES = Object.freeze([]);

/**
 * useTeacherDashboardHome — all data logic for the dashboard home page, so the
 * view stays display-only: loads the dashboard from the existing teacher API,
 * derives the stat-card numbers, and exposes loading / error / refetch.
 */
export default function useTeacherDashboardHome() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Loading runs in one place — the effect below. `refetch` just bumps the
  // token (from event handlers), which re-triggers it with a fresh loading
  // state. Keeps the react-hooks/set-state-in-effect rule happy with a single
  // fetch path.
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const dashboardResponse = await getTeacherDashboard();

        if (isActive) {
          setDashboard(dashboardResponse);
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

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const races = Array.isArray(dashboard?.races)
    ? dashboard.races
    : EMPTY_RACES;

  const stats = useMemo(() => buildDashboardStats(dashboard), [dashboard]);

  return {
    teacherName: dashboard?.teacherName ?? null,
    races,
    stats,
    isLoading,
    error,
    refetch,
  };
}
