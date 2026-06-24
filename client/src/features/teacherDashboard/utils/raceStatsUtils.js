import { RACE_STATUSES } from "../config/raceStatusConfig";
import { TEACHER_DASHBOARD_STATS } from "../constants/teacherDashboardConstants";

function toNumber(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function buildStatsFromDashboardResponse(dashboardResponse) {
    const statValues = {
        totalRaces: toNumber(dashboardResponse?.totalRaces),
        activeRaces: toNumber(dashboardResponse?.activeRaces),
        finishedRaces: toNumber(dashboardResponse?.finishedRaces),
        waitingRaces: toNumber(dashboardResponse?.waitingRaces),
    };

    return TEACHER_DASHBOARD_STATS.map((stat) => ({
        ...stat,
        value: statValues[stat.contentKey] ?? 0,
    }));
}

export function buildStatsFromRaces(races = []) {
    const raceList = Array.isArray(races) ? races : [];

    return {
        totalRaces: raceList.length,
        activeRaces: raceList.filter((race) => race.status === RACE_STATUSES.IN_PROGRESS).length,
        finishedRaces: raceList.filter((race) => race.status === RACE_STATUSES.FINISHED).length,
        waitingRaces: raceList.filter(
            (race) =>
                race.status === RACE_STATUSES.WAITING_FOR_PLAYERS ||
                race.status === RACE_STATUSES.READY,
        ).length,
    };
}
