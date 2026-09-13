import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { RACE_PLAYER_STATUSES } from "../../../../constants/raceStatusConstants.js";
import { advanceFinishRunout } from "./advanceFinishRunout.js";
import { createRaceVisualMotionTracker, normalizeMotionAuthority } from "./createRaceVisualMotionTracker.js";

export function createStudentRaceMotion(config = STUDENT_RACE_ANIMATION_CONFIG.motion) {
  const motion = createRaceVisualMotionTracker(config);
  let initialized = false;
  let speed = 0;
  let targetSpeed = 0;
  let totalDistance = null;
  let previousRaceId = null;
  let previousPlayerId = null;
  let finish = null;
  let finishPosition = null;
  let finishPresentation = null;
  let finishReleased = false;
  let reducedMotion = false;
  const position = () => finishPosition ?? motion.position();

  function authorityLimit() {
    return Math.max(0, totalDistance - (finishPresentation?.active ? finishPresentation.visualHoldUnits : 0));
  }

  function updateFinishPresentation(next) {
    finishPresentation = next;
    if (next?.active && next.ownCrossingReleased && !finishReleased && initialized) {
      finishReleased = true;
      finish = { start: position(), finishLine: totalDistance, target: totalDistance + next.runoutUnits,
        elapsedMs: 0, durationMs: next.runoutDurationMs };
    }
    if (initialized && !finishReleased) motion.limitPosition(authorityLimit());
  }

  function updateRuntimeState(runtimeState) {
    const visual = runtimeState?.visual;
    if (!Number.isFinite(visual?.targetPosition) || !Number.isFinite(runtimeState.totalDistance)) return;
    reducedMotion = visual.reducedMotion === true;
    const authority = normalizeMotionAuthority({
      position: visual.targetPosition,
      positionAtEpochMs: runtimeState.player?.positionAtEpochMs ?? null,
      movementRate: visual.movementUnitsPerSecond ?? 0,
      canPredict: runtimeState.playerStatus === RACE_PLAYER_STATUSES.RACING,
    }, runtimeState.lastSnapshotAtEpochMs, config.predictionLimitMs);
    const raceId = runtimeState.race?.id ?? null;
    const playerId = runtimeState.player?.racePlayerId ?? null;
    targetSpeed = visual.targetSpeed ?? 0;
    totalDistance = runtimeState.totalDistance;
    const changedRace = previousRaceId != null && (raceId !== previousRaceId || playerId !== previousPlayerId);
    const newSnapshot = motion.isNewAuthority(authority) || changedRace;
    const wrapped = authority.position - position() < -totalDistance / 2;
    const replacedVisibleWindow = Math.abs(authority.position - position()) >
      STUDENT_RACE_ANIMATION_CONFIG.projection.viewDistanceAhead;

    if (!initialized || (newSnapshot && (changedRace || wrapped || replacedVisibleWindow))) {
      motion.seed(authority, authorityLimit());
      speed = targetSpeed;
      finish = null;
      finishPosition = null;
      finishReleased = false;
      if (changedRace) finishPresentation = null;
      initialized = true;
    }
    motion.updateAuthority(authority);
    if (newSnapshot) {
      previousRaceId = raceId;
      previousPlayerId = playerId;
    }
    if (!finishReleased) motion.limitPosition(authorityLimit());
  }

  return {
    updateRuntimeState,
    updateFinishPresentation,
    advance(deltaMs) {
      if (initialized && Number.isFinite(deltaMs) && deltaMs > 0) {
        if (finish != null) {
          speed += (targetSpeed - speed) * (1 - Math.exp(-deltaMs / config.velocityResponseMs));
          finishPosition = advanceFinishRunout(finish, reducedMotion ? finish.durationMs : deltaMs);
        } else {
          motion.advance(deltaMs, {
            maxPosition: authorityLimit(),
            slowdownDistance: finishPresentation?.active ? finishPresentation.slowdownDistanceUnits : null,
            onStep: (_stepMs, response) => { speed += (targetSpeed - speed) * response; },
          });
        }
      }
      return { position: position(), speed };
    },
  };
}
