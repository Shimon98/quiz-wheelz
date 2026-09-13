import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig.js";
import { smoothstep } from "./advanceFinishRunout.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeMotionAuthority(
  { position, positionAtEpochMs = null, movementRate = 0, canPredict = false },
  snapshotAtEpochMs,
  predictionLimitMs = STUDENT_RACE_ANIMATION_CONFIG.motion.predictionLimitMs,
) {
  const hasAnchor = Number.isFinite(positionAtEpochMs);
  const rate = canPredict === true && hasAnchor ? Math.max(0, movementRate ?? 0) : 0;
  const predictionAgeMs = hasAnchor && Number.isFinite(snapshotAtEpochMs)
    ? clamp(snapshotAtEpochMs - positionAtEpochMs, 0, predictionLimitMs)
    : 0;
  return {
    position,
    movementRate: rate,
    snapshotKey: JSON.stringify([hasAnchor ? positionAtEpochMs : snapshotAtEpochMs ?? null, position, rate, canPredict === true]),
    predictionAgeMs,
    maxPredictionMs: predictionLimitMs,
  };
}

export function presentedAuthorityPosition(authority, maxPosition = Infinity) {
  return Math.min(maxPosition, authority.position + authority.movementRate * (authority.predictionAgeMs ?? 0) / 1000);
}

export function createRaceVisualMotionTracker(config = STUDENT_RACE_ANIMATION_CONFIG.motion) {
  let position = 0;
  let predictedPosition = 0;
  let movementRate = 0;
  let baseVelocity = 0;
  let correctionVelocity = 0;
  let previousSnapshotKey = null;
  let previousAuthorityPosition = null;
  let predictionAgeMs = 0;
  let maxPredictionMs = Infinity;

  const isNewAuthority = (next) => next.snapshotKey !== previousSnapshotKey ||
    next.position !== previousAuthorityPosition;

  function seed(next, maxPosition = Infinity) {
    maxPredictionMs = next.maxPredictionMs ?? Infinity;
    predictionAgeMs = clamp(next.predictionAgeMs ?? 0, 0, maxPredictionMs);
    movementRate = next.movementRate;
    position = presentedAuthorityPosition({ ...next, predictionAgeMs }, maxPosition);
    predictedPosition = position;
    baseVelocity = movementRate;
    correctionVelocity = 0;
    previousSnapshotKey = next.snapshotKey;
    previousAuthorityPosition = next.position;
  }

  function updateAuthority(next) {
    movementRate = next.movementRate;
    maxPredictionMs = next.maxPredictionMs ?? Infinity;
    const age = clamp(next.predictionAgeMs ?? 0, 0, maxPredictionMs);
    if (isNewAuthority(next)) {
      predictionAgeMs = age;
      predictedPosition = next.position + movementRate * age / 1000;
      previousSnapshotKey = next.snapshotKey;
      previousAuthorityPosition = next.position;
    } else if (age > predictionAgeMs) {
      predictedPosition += movementRate * (age - predictionAgeMs) / 1000;
      predictionAgeMs = age;
    }
  }

  function advanceStep(deltaMs, { maxPosition, slowdownDistance, onStep }) {
    const seconds = deltaMs / 1000;
    const rate = predictionAgeMs >= maxPredictionMs ? 0 : movementRate;
    const response = 1 - Math.exp(-deltaMs / config.velocityResponseMs);
    onStep?.(deltaMs, response);
    const error = predictedPosition - position;
    const desiredCorrection = clamp(error / (config.correctionResponseMs / 1000),
      -config.maxCorrectionUnitsPerSecond, config.maxCorrectionUnitsPerSecond);
    const slowdown = slowdownDistance == null ? 1
      : smoothstep(clamp((maxPosition - position) / slowdownDistance, 0, 1));
    baseVelocity += (rate * slowdown - baseVelocity) * response;
    correctionVelocity += (desiredCorrection - correctionVelocity) *
      (1 - Math.exp(-deltaMs / config.correctionVelocityResponseMs));
    predictedPosition += rate * Math.min(deltaMs, Math.max(0, maxPredictionMs - predictionAgeMs)) / 1000;
    predictionAgeMs += deltaMs;
    const nextPosition = position + Math.max(0, baseVelocity + correctionVelocity) * seconds;
    position = rate === 0 ? Math.min(nextPosition, Math.max(position, predictedPosition)) : nextPosition;
    if (rate === 0 && position >= predictedPosition) {
      baseVelocity = 0;
      correctionVelocity = 0;
    }
    predictedPosition = Math.min(predictedPosition, maxPosition);
    position = Math.min(position, maxPosition);
  }

  return {
    seed,
    updateAuthority,
    isNewAuthority,
    position: () => position,
    targetPosition: () => predictedPosition,
    predictionAgeMs: () => predictionAgeMs,
    limitPosition: (limit) => { position = Math.min(position, limit); },
    advance(deltaMs, { maxPosition = Infinity, slowdownDistance = null, onStep } = {}) {
      if (Number.isFinite(deltaMs) && deltaMs > 0) {
        let remainingMs = Math.min(deltaMs, config.maxFrameDeltaMs);
        if (Number.isFinite(maxPredictionMs)) {
          const skippedMs = Math.min(Math.max(0, deltaMs - remainingMs), Math.max(0, maxPredictionMs - predictionAgeMs));
          predictedPosition += movementRate * skippedMs / 1000;
          predictionAgeMs += skippedMs;
        }
        while (remainingMs > 0.000001) {
          const stepMs = Math.min(remainingMs, config.maxStepMs);
          advanceStep(stepMs, { maxPosition, slowdownDistance, onStep });
          remainingMs -= stepMs;
        }
      }
      return { position, movementRate };
    },
  };
}
