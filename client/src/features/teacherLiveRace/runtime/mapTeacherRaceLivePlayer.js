import { ApiContractError } from "../../../errors/ApiContractError";
import {
  requireArray,
  requireFiniteNumber,
  requireNonEmptyString,
  requireObject,
  requireOneOf,
  requireSafeInteger,
} from "../../../errors/apiContractGuards";
import { RACE_PLAYER_STATUSES } from "../../../constants/raceStatusConstants";
import { RACE_MAX_PLAYERS } from "../../../constants/raceRulesConstants";

const PLAYER_STATUSES = new Set(Object.values(RACE_PLAYER_STATUSES));

export function mapTeacherRaceLivePlayer(player) {
  requireObject(player, "Teacher live player");

  return {
    racePlayerId: requireSafeInteger(
      player.racePlayerId,
      "Teacher live player racePlayerId",
      { min: 1 },
    ),
    displayName: requireNonEmptyString(
      player.displayName,
      "Teacher live player displayName",
    ),
    laneNumber: requireSafeInteger(
      player.laneNumber,
      "Teacher live player laneNumber",
      { min: 1, max: RACE_MAX_PLAYERS },
    ),
    vehicleTypeKey: requireNonEmptyString(
      player.vehicleTypeKey,
      "Teacher live player vehicleTypeKey",
    ),
    vehicleColorKey: requireNonEmptyString(
      player.vehicleColorKey,
      "Teacher live player vehicleColorKey",
    ),
    vehicleAssetKey: requireNonEmptyString(
      player.vehicleAssetKey,
      "Teacher live player vehicleAssetKey",
    ),
    rank: requireSafeInteger(player.rank, "Teacher live player rank", {
      min: 1,
    }),
    position: requireFiniteNumber(
      player.position,
      "Teacher live player position",
      { min: 0 },
    ),
    speed: requireFiniteNumber(player.speed, "Teacher live player speed", {
      min: 0,
    }),
    score: requireSafeInteger(player.score, "Teacher live player score", {
      min: 0,
    }),
    streak: requireSafeInteger(player.streak, "Teacher live player streak", {
      min: 0,
    }),
    status: requireOneOf(
      player.status,
      PLAYER_STATUSES,
      "Teacher live player status",
    ),
  };
}

export function mapTeacherRaceLiveRoster(players) {
  requireArray(players, "Teacher live roster", { maxLength: RACE_MAX_PLAYERS });

  const seenIds = new Set();
  const seenLanes = new Set();

  return players.map((player) => {
    const mappedPlayer = mapTeacherRaceLivePlayer(player);

    if (seenIds.has(mappedPlayer.racePlayerId)) {
      throw new ApiContractError("Teacher live roster repeats a racePlayerId");
    }

    if (seenLanes.has(mappedPlayer.laneNumber)) {
      throw new ApiContractError("Teacher live roster repeats a laneNumber");
    }

    seenIds.add(mappedPlayer.racePlayerId);
    seenLanes.add(mappedPlayer.laneNumber);

    return mappedPlayer;
  });
}
