import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => value * value * (3 - 2 * value);

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
  let finish = null;

  function updateRuntimeState(runtimeState) {
    const visual = runtimeState?.visual;
    if (!Number.isFinite(visual?.targetPosition) || !Number.isFinite(runtimeState.totalDistance)) return;

    const targetPosition = visual.targetPosition;
    const snapshotKey = runtimeState.lastSnapshotAtEpochMs ?? targetPosition;
    const raceId = runtimeState.race?.id ?? null;
    movementRate = Math.max(0, visual.movementUnitsPerSecond ?? 0);
    targetSpeed = visual.targetSpeed ?? 0;
    totalDistance = runtimeState.totalDistance;

    const changedRace = previousRaceId != null && raceId !== previousRaceId;
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
      initialized = true;
    }

    if (newSnapshot) {
      predictedPosition = targetPosition;
      previousSnapshotKey = snapshotKey;
      previousTargetPosition = targetPosition;
      previousRaceId = raceId;
    }

    if (runtimeState.playerFinished === true) {
      if (finish?.target !== targetPosition) {
        const distance = targetPosition - position;
        finish = {
          start: position,
          target: targetPosition,
          distance,
          elapsedMs: 0,
          durationMs: STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs,
        };
      }
    } else {
      finish = null;
    }
  }

  function advanceStep(deltaMs) {
    const seconds = deltaMs / 1000;
    const response = 1 - Math.exp(-deltaMs / config.velocityResponseMs);
    speed += (targetSpeed - speed) * response;

    if (finish != null) {
      finish.elapsedMs = Math.min(finish.durationMs, finish.elapsedMs + deltaMs);
      position = finish.start + finish.distance * smoothstep(finish.elapsedMs / finish.durationMs);
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
    baseVelocity += (movementRate - baseVelocity) * response;
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
      predictedPosition = Math.min(predictedPosition, totalDistance);
      position = Math.min(position, totalDistance);
    }
  }

  return {
    updateRuntimeState,
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
