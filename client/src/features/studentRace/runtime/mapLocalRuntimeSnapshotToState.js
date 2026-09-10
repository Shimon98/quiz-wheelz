export function mapLocalRuntimeSnapshotToState(previousState, snapshot) {
  return {
    ...previousState,
    raceStatus: snapshot.raceStatus,
    playerStatus: snapshot.playerStatus,
    playerFinished: snapshot.playerFinished,
    totalDistance: snapshot.totalDistance,
    lastSnapshotAtEpochMs: snapshot.snapshotAtEpochMs,
    player: {
      ...previousState.player,
      position: snapshot.position,
      speed: snapshot.speed,
      vehicleAssetKey: snapshot.vehicleAssetKey,
    },
    visual: {
      ...previousState.visual,
      targetPosition: snapshot.position,
      targetSpeed: snapshot.speed,
      movementUnitsPerSecond: snapshot.movementUnitsPerSecond,
    },
  };
}
