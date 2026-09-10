import { mapRaceStatePresentation, mapRaceStateToRuntime } from "./mapRaceStateToRuntime.js";
import { applyRaceSnapshot } from "./applyRaceSnapshot.js";

export function mergeRaceStateIntoRuntime(previous, response) {
  if (previous == null) return mapRaceStateToRuntime(response);
  const presentation = mapRaceStatePresentation(response);
  if (previous.race.id !== presentation.race.id ||
      previous.player.racePlayerId !== presentation.player.racePlayerId) {
    return mapRaceStateToRuntime(response);
  }
  const next = applyRaceSnapshot(previous, response.snapshot);
  if (next === previous) return previous;
  return { ...next, race: presentation.race, player: { ...next.player, ...presentation.player } };
}
