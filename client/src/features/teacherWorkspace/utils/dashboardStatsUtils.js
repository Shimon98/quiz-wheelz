import { RACE_STATUSES } from "../config/raceStatusConfig";

function toCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function countByStatus(races, statuses) {
  return races.filter((race) => statuses.includes(race?.status)).length;
}

/*
 * Builds the { active, waiting, cancelled, total } numbers for the stat cards.
 * Server-provided counters win when present; otherwise the count is derived
 * from the races list. The server does not send `cancelledRaces` yet — that
 * one is always derived until Diana adds the field, and this util picks it up
 * automatically when she does.
 */
export function buildDashboardStats(dashboardResponse) {
  const races = Array.isArray(dashboardResponse?.races)
    ? dashboardResponse.races
    : [];

  return {
    active:
      toCount(dashboardResponse?.activeRaces) ??
      countByStatus(races, [RACE_STATUSES.IN_PROGRESS]),
    waiting:
      toCount(dashboardResponse?.waitingRaces) ??
      countByStatus(races, [
        RACE_STATUSES.WAITING_FOR_PLAYERS,
        RACE_STATUSES.READY,
      ]),
    cancelled:
      toCount(dashboardResponse?.cancelledRaces) ??
      countByStatus(races, [RACE_STATUSES.CANCELLED]),
    total: toCount(dashboardResponse?.totalRaces) ?? races.length,
  };
}
