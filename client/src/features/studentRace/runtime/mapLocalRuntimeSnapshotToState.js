/*
 * Maps a local-runtime snapshot into the ONE runtime state contract — the
 * same mapper shape the future server-snapshot mapper (24E/SSE) will have,
 * so swapping the movement source is a mapper swap, not a screen change.
 *
 * Only movement/status fields update. question/answer/score/streak/
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
    },

    visual: {
      ...previousState.visual,
      targetPosition: snapshot.position,
      targetSpeed: snapshot.speed,
    },
  };
}
