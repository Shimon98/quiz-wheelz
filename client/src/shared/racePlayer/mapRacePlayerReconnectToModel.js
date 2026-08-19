import { ApiContractError } from "../../errors/ApiContractError.js";
import {
  RACE_PLAYER_RECONNECT_OUTCOMES,
  RACE_PLAYER_STATUSES,
  RACE_STATUSES,
} from "../../constants/raceStatusConstants.js";

/*
 * The one boundary for the server's RacePlayerReconnectResponse — validates
 * only the fields C1-05 consumes; shape checks, never server policy.
 */

const VALID_OUTCOMES = new Set(Object.values(RACE_PLAYER_RECONNECT_OUTCOMES));
const VALID_PLAYER_STATUSES = new Set(Object.values(RACE_PLAYER_STATUSES));
// RACE_STATUSES.UNKNOWN is a client-only fallback, never a wire value.
const VALID_RACE_STATUSES = new Set(
  Object.values(RACE_STATUSES).filter(
    (status) => status !== RACE_STATUSES.UNKNOWN,
  ),
);

export function mapRacePlayerReconnectToModel(response) {
  if (response == null || typeof response !== "object") {
    throw new ApiContractError("Reconnect response is missing");
  }

  if (!VALID_OUTCOMES.has(response.outcome)) {
    throw new ApiContractError("Reconnect outcome is invalid");
  }

  if (typeof response.online !== "boolean") {
    throw new ApiContractError("Reconnect online flag is invalid");
  }

  if (typeof response.canContinueRace !== "boolean") {
    throw new ApiContractError("Reconnect continuation flag is invalid");
  }

  if (!VALID_PLAYER_STATUSES.has(response.playerStatus)) {
    throw new ApiContractError("Reconnect player status is invalid");
  }

  if (!VALID_RACE_STATUSES.has(response.raceStatus)) {
    throw new ApiContractError("Reconnect race status is invalid");
  }

  return {
    outcome: response.outcome,
    online: response.online,
    canContinueRace: response.canContinueRace,
    playerStatus: response.playerStatus,
    raceStatus: response.raceStatus,
  };
}
