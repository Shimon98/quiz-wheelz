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
    predictionLimitMs: 5000,
  }),
  projection: Object.freeze({
    viewDistanceAhead: 150,
  }),
  effects: Object.freeze({
    correctEffectDurationMs: 700,
    wrongEffectDurationMs: 500,
    boostEffectDurationMs: 900,
    finishEffectDurationMs: 1200,
    turboSuccessEffectDurationMs: 1100,
    turboFailureEffectDurationMs: 1000,
    safeCompleteEffectDurationMs: 900,
    safePerfectEffectDurationMs: 1300,
  }),
  kartPoses: Object.freeze({
    poseFadeMs: 320,
    turboReturnMs: 160,
    // The first upload of a pose blocked a frame for ~60 ms at Turbo entry, so it happens ahead, in a quiet moment.
    posePreloadDelayMs: 1500,
    retryGapMs: 5000,
    maxRetries: 2,
  }),
  // Presentation only: the server's score and +80 progress are unchanged, only how they are shown.
  turboSuccess: Object.freeze({
    poseHoldMs: 1300,
  }),
});
