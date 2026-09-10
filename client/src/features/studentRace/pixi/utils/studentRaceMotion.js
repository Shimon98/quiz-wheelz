import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { advanceFinishRunout, smoothstep } from "./advanceFinishRunout.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createStudentRaceMotion(config = STUDENT_RACE_ANIMATION_CONFIG.motion) {
  let initialized = false;
  let position = 0;
  let speed = 0;
  let predictedPosition = 0;
  let movementRate = 0;
  let targetSpeed = 0;
  let totalDistance = null;
  let baseVelocity = 0;
  let correctionVelocity = 0;
  let previousSnapshotKey = null;
  let previousTargetPosition = null;
  let previousRaceId = null;
  let previousPlayerId = null;
  let finish = null;
  let finishPresentation = null;
  let finishReleased = false;

  function authorityLimit() {
    return Math.max(0, totalDistance - (finishPresentation?.active ? finishPresentation.visualHoldUnits : 0));
  }

  function updateFinishPresentation(next) {
    finishPresentation = next;
    if (next?.active && next.ownCrossingReleased && !finishReleased && initialized) {
      finishReleased = true;
      finish = { start: position, finishLine: totalDistance, target: totalDistance + next.runoutUnits,
        elapsedMs: 0, durationMs: next.runoutDurationMs };
    }
    if (initialized && !finishReleased) position = Math.min(position, authorityLimit());
  }

  function updateRuntimeState(runtimeState) {
    const visual = runtimeState?.visual;
    if (!Number.isFinite(visual?.targetPosition) || !Number.isFinite(runtimeState.totalDistance)) return;

    const targetPosition = visual.targetPosition;
    const snapshotKey = runtimeState.lastSnapshotAtEpochMs ?? targetPosition;
    const raceId = runtimeState.race?.id ?? null;
    const playerId = runtimeState.player?.racePlayerId ?? null;
    movementRate = Math.max(0, visual.movementUnitsPerSecond ?? 0);
    targetSpeed = visual.targetSpeed ?? 0;
    totalDistance = runtimeState.totalDistance;

    const changedRace = previousRaceId != null &&
      (raceId !== previousRaceId || playerId !== previousPlayerId);
    const newSnapshot = snapshotKey !== previousSnapshotKey ||
      targetPosition !== previousTargetPosition || changedRace;
    const wrapped = Number.isFinite(totalDistance) &&
      targetPosition - position < -totalDistance / 2;
    const replacedVisibleWindow = Math.abs(targetPosition - position) >
      STUDENT_RACE_ANIMATION_CONFIG.projection.viewDistanceAhead;

    if (!initialized || (newSnapshot && (changedRace || wrapped || replacedVisibleWindow))) {
      position = targetPosition;
      speed = targetSpeed;
      baseVelocity = movementRate;
      correctionVelocity = 0;
      finish = null;
      finishReleased = false;
      if (changedRace) finishPresentation = null;
      initialized = true;
    }

    if (newSnapshot) {
      predictedPosition = targetPosition;
      previousSnapshotKey = snapshotKey;
      previousTargetPosition = targetPosition;
      previousRaceId = raceId;
      previousPlayerId = playerId;
    }

    if (!finishReleased) position = Math.min(position, authorityLimit());
  }

  function advanceStep(deltaMs) {
    const seconds = deltaMs / 1000;
    const response = 1 - Math.exp(-deltaMs / config.velocityResponseMs);
    speed += (targetSpeed - speed) * response;

    if (finish != null) {
      position = advanceFinishRunout(finish, deltaMs);
      baseVelocity = 0;
      correctionVelocity = 0;
      return;
    }

    const error = predictedPosition - position;
    const desiredCorrection = clamp(
      error / (config.correctionResponseMs / 1000),
      -config.maxCorrectionUnitsPerSecond,
      config.maxCorrectionUnitsPerSecond,
    );
    const limit = authorityLimit();
    const slowdown = finishPresentation?.active
      ? smoothstep(clamp((limit - position) / finishPresentation.slowdownDistanceUnits, 0, 1)) : 1;
    baseVelocity += (movementRate * slowdown - baseVelocity) * response;
    correctionVelocity += (desiredCorrection - correctionVelocity) *
      (1 - Math.exp(-deltaMs / config.correctionVelocityResponseMs));
    predictedPosition += movementRate * seconds;
    const nextPosition = position + Math.max(0, baseVelocity + correctionVelocity) * seconds;
    position = movementRate === 0
      ? Math.min(nextPosition, Math.max(position, predictedPosition))
      : nextPosition;

    if (movementRate === 0 && position >= predictedPosition) {
      baseVelocity = 0;
      correctionVelocity = 0;
    }

    if (Number.isFinite(totalDistance)) {
      predictedPosition = Math.min(predictedPosition, limit);
      position = Math.min(position, limit);
    }
  }

  return {
    updateRuntimeState,
    updateFinishPresentation,
    advance(deltaMs) {
      if (initialized && Number.isFinite(deltaMs) && deltaMs > 0) {
        if (finish != null) {
          advanceStep(deltaMs);
          return { position, speed };
        }
        let remainingMs = Math.min(deltaMs, config.maxFrameDeltaMs);
        while (remainingMs > 0.000001) {
          const stepMs = Math.min(remainingMs, config.maxStepMs);
          advanceStep(stepMs);
          remainingMs -= stepMs;
        }
      }
      return { position, speed };
    },
  };
}
