import { ApiContractError } from "../../../../errors/ApiContractError";
import { RACE_MAX_PLAYERS } from "../../../../constants/raceRulesConstants";

function upsertPlayer(players, player) {
  const index = players.findIndex(
    (candidate) => candidate.racePlayerId === player.racePlayerId,
  );

  if (index === -1) {
    if (players.length >= RACE_MAX_PLAYERS) {
      throw new ApiContractError("Teacher live roster is already at capacity");
    }

    return [...players, player];
  }

  return players.map((candidate, position) =>
    position === index ? player : candidate,
  );
}

export function applyPlayerJoined(runtime, event) {
  return {
    ...runtime,
    players: upsertPlayer(runtime.players, event.payload.player),
  };
}

export function applyRaceStarted(runtime, event) {
  return {
    ...runtime,
    race: {
      ...runtime.race,
      status: event.payload.raceStatus,
      startedAtEpochMs: event.payload.startedAtEpochMs,
    },
    players: event.payload.players,
  };
}

export function applyUnchanged(runtime) {
  return runtime;
}

export function applyRosterReplacement(runtime, event) {
  return {
    ...runtime,
    players: event.payload.players,
  };
}

export function applyRaceFinished(runtime, event) {
  return {
    ...runtime,
    race: {
      ...runtime.race,
      status: event.payload.raceStatus,
      finishedAtEpochMs: event.payload.finishedAtEpochMs,
    },
    players: event.payload.players,
  };
}
