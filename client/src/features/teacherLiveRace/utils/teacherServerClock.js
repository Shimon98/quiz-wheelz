import { RACE_STATUSES } from "../../../constants/raceStatusConstants";

export function estimateServerNowEpochMs(serverClock, performanceNowMs) {
  if (serverClock == null) {
    return null;
  }

  const elapsedSinceReceiptMs =
    performanceNowMs == null
      ? 0
      : Math.max(0, performanceNowMs - serverClock.receivedAtPerformanceNow);

  return serverClock.serverTimeEpochMs + elapsedSinceReceiptMs;
}

export function resolveRaceElapsedMs(race, serverNowEpochMs) {
  if (race == null || race.startedAtEpochMs == null) {
    return null;
  }

  if (race.status === RACE_STATUSES.FINISHED) {
    return race.finishedAtEpochMs == null
      ? null
      : Math.max(0, race.finishedAtEpochMs - race.startedAtEpochMs);
  }

  if (race.status === RACE_STATUSES.IN_PROGRESS && serverNowEpochMs != null) {
    return Math.max(0, serverNowEpochMs - race.startedAtEpochMs);
  }

  return null;
}
