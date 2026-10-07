import {
  mapStudentRaceGameplay,
  resolveStudentRacePresentationSpeed,
} from "./mapStudentRaceGameplay.js";

export function mapLocalRuntimeSnapshotToState(previousState, snapshot) {
  const gameplay = mapStudentRaceGameplay(snapshot.gameplay);

  return {
    ...previousState,
    raceStatus: snapshot.raceStatus,
    playerStatus: snapshot.playerStatus,
    playerFinished: snapshot.playerFinished,
    totalDistance: snapshot.totalDistance,
    lastSnapshotAtEpochMs: snapshot.snapshotAtEpochMs,
    gameplay,
    player: {
      ...previousState.player,
      position: snapshot.position,
      positionAtEpochMs: snapshot.snapshotAtEpochMs,
      speed: snapshot.speed,
      vehicleAssetKey: snapshot.vehicleAssetKey,
    },
    visual: {
      ...previousState.visual,
      targetPosition: snapshot.position,
      targetSpeed: resolveStudentRacePresentationSpeed(snapshot.speed, gameplay),
      movementUnitsPerSecond: snapshot.movementUnitsPerSecond,
    },
  };
}
