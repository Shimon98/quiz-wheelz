import { RACE_STATUSES } from "../../../constants/raceStatusConstants";
import { resolveVehicleCssColor } from "../../../shared/raceVehicles/raceVehicleIdentity";
import { formatElapsedClock } from "./formatElapsedClock";

const PERCENT_SCALE = 100;

function clampProgressRatio(position, totalDistance) {
  if (!(totalDistance > 0)) {
    return 0;
  }

  return Math.min(1, Math.max(0, position / totalDistance));
}

function buildLaneViewModel(player, totalDistance) {
  const progressRatio = clampProgressRatio(player.position, totalDistance);

  return {
    racePlayerId: player.racePlayerId,
    laneNumber: player.laneNumber,
    displayName: player.displayName,
    vehicleTypeKey: player.vehicleTypeKey,
    vehicleColorKey: player.vehicleColorKey,
    vehicleAssetKey: player.vehicleAssetKey,
    accentColor: resolveVehicleCssColor(player.vehicleColorKey),
    progressRatio,
    progressPercent: progressRatio * PERCENT_SCALE,
    rank: player.rank,
    status: player.status,
    streak: player.streak,
  };
}

function buildLeaderboardViewModel(player, totalDistance) {
  return {
    racePlayerId: player.racePlayerId,
    rank: player.rank,
    displayName: player.displayName,
    vehicleTypeKey: player.vehicleTypeKey,
    vehicleColorKey: player.vehicleColorKey,
    vehicleAssetKey: player.vehicleAssetKey,
    accentColor: resolveVehicleCssColor(player.vehicleColorKey),
    progressPercent:
      clampProgressRatio(player.position, totalDistance) * PERCENT_SCALE,
    score: player.score,
    streak: player.streak,
    status: player.status,
  };
}

export function buildTeacherRaceProjectorViewModel(runtime, elapsedMs) {
  const { race, players } = runtime;
  const isFinished = race.status === RACE_STATUSES.FINISHED;

  return {
    header: {
      title: race.title,
      status: race.status,
      roomCode: race.roomCode,
      participantCount: players.length,
      elapsedLabel: formatElapsedClock(elapsedMs),
      isFinished,
    },
    lanes: [...players]
      .sort((first, second) => first.laneNumber - second.laneNumber)
      .map((player) => buildLaneViewModel(player, race.totalDistance)),
    leaderboard: players.map((player) =>
      buildLeaderboardViewModel(player, race.totalDistance),
    ),
    race: {
      totalDistance: race.totalDistance,
      status: race.status,
      isFinished,
    },
  };
}
