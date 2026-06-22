import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createTeacherRace,
    getTeacherDashboard,
} from "../../../api/teacherApi";
import { buildStatsFromDashboardResponse } from "../utils/raceStatsUtils";

const EMPTY_RACES = Object.freeze([]);

function getDashboardRaces(dashboardResponse) {
    return Array.isArray(dashboardResponse?.races)
        ? dashboardResponse.races
        : EMPTY_RACES;
}

export function useTeacherDashboardData() {
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const dashboardResponse = await getTeacherDashboard();
            setDashboard(dashboardResponse);

            return dashboardResponse;
        } catch (requestError) {
            setError(requestError);
            throw requestError;
        } finally {
            setIsLoading(false);
        }
    }, []);

    async function createRaceAndRefresh(payload) {
        setError(null);

        const createdRace = await createTeacherRace(payload);

        await refreshDashboard();

        return createdRace;
    }

    useEffect(() => {
        let isActive = true;

        async function loadDashboard() {
            setIsLoading(true);
            setError(null);

            try {
                const dashboardResponse = await getTeacherDashboard();

                if (isActive) {
                    setDashboard(dashboardResponse);
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
    }, []);

    const races = getDashboardRaces(dashboard);

    const stats = useMemo(
        () => buildStatsFromDashboardResponse(dashboard),
        [dashboard],
    );

    return {
        teacherName: dashboard?.teacherName,
        stats,
        races,
        isLoading,
        error,
        refreshDashboard,
        createRaceAndRefresh,
    };
}