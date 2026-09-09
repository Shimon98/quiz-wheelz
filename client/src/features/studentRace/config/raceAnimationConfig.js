export const STUDENT_RACE_ANIMATION_CONFIG = Object.freeze({
  serverUnits: Object.freeze({
    positionToPixelsRatio: 30,
  }),
  motion: Object.freeze({
    correctionResponseMs: 2800,
    correctionVelocityResponseMs: 700,
    velocityResponseMs: 400,
    maxCorrectionUnitsPerSecond: 24,
    maxFrameDeltaMs: 100,
    maxStepMs: 1000 / 120,
  }),
  projection: Object.freeze({
    viewDistanceAhead: 150,
  }),
  effects: Object.freeze({
    correctEffectDurationMs: 700,
    wrongEffectDurationMs: 500,
    boostEffectDurationMs: 900,
    finishEffectDurationMs: 1200,
  }),
});
