/*
 * Maps a local-runtime snapshot into the ONE runtime state contract. Local
 * dev snapshots and real server snapshots feed the same
 * StudentRaceRuntimeState through separate mappers — applyRaceSnapshot owns
 * the authoritative server one; swapping the movement source is a mapper
 * swap, not a screen change.
 *
 * Only movement/status/vehicle-art fields update. question/answer/score/streak/
 * difficulty belong to REAL server responses and pass through untouched —
 * the local runtime has no authority over them.
 */
export function mapLocalRuntimeSnapshotToState(previousState, snapshot) {
  return {
    ...previousState,

    raceStatus: snapshot.raceStatus,
    playerStatus: snapshot.playerStatus,
    totalDistance: snapshot.totalDistance,

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
    },
  };
}
