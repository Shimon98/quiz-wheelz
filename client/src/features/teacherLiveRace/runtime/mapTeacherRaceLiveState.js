import {
  requireNonEmptyString,
  requireObject,
  requireOneOf,
  requireOptionalEpochMs,
  requireSafeInteger,
} from "../../../errors/apiContractGuards";
import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import { mapTeacherRaceLiveRoster } from "./mapTeacherRaceLivePlayer";

export const SERVER_RACE_STATUSES = new Set(
  Object.values(RACE_STATUSES).filter(
    (status) => status !== RACE_STATUSES.UNKNOWN,
  ),
);

export function mapTeacherRaceLiveState(response) {
  requireObject(response, "Teacher live state");

  return {
    race: {
      raceId: requireSafeInteger(response.raceId, "Teacher live state raceId", {
        min: 1,
      }),
      title: requireNonEmptyString(response.title, "Teacher live state title"),
      roomCode: requireNonEmptyString(
        response.roomCode,
        "Teacher live state roomCode",
      ),
      status: requireOneOf(
        response.status,
        SERVER_RACE_STATUSES,
        "Teacher live state status",
      ),
      totalDistance: requireSafeInteger(
        response.totalDistance,
        "Teacher live state totalDistance",
        { min: 1 },
      ),
      focusPolicy: requireNonEmptyString(
        response.focusPolicy,
        "Teacher live state focusPolicy",
      ),
      startedAtEpochMs: requireOptionalEpochMs(
        response.startedAtEpochMs,
        "Teacher live state startedAtEpochMs",
      ),
      finishedAtEpochMs: requireOptionalEpochMs(
        response.finishedAtEpochMs,
        "Teacher live state finishedAtEpochMs",
      ),
    },
    serverTimeEpochMs: requireSafeInteger(
      response.serverTimeEpochMs,
      "Teacher live state serverTimeEpochMs",
      { min: 1 },
    ),
    eventVersion: requireSafeInteger(
      response.eventVersion,
      "Teacher live state eventVersion",
      { min: 0 },
    ),
    players: mapTeacherRaceLiveRoster(response.players),
  };
}
