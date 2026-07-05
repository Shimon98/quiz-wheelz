/*
 * THE single place that knows how server units become pixels and how motion
 * feels. Server position/speed/totalDistance are the source of truth; the
 * renderer layers never invent numbers — they read them from here, so
 * retuning speed-feel (or adapting to 24E's real tick cadence) is a
 * one-file change.
 */
export const STUDENT_RACE_ANIMATION_CONFIG = Object.freeze({
  // Server unit -> pixel conversions. Initial tuning guesses — adjust here
  // only, never inside layers.
  serverUnits: Object.freeze({
    positionToPixelsRatio: 4, // 1 server distance unit = 4 world pixels
    speedToPixelsPerSecondRatio: 120, // speed 1.0 = 120 px/s of world scroll
  }),

  // Per-frame lerp factors easing renderer-internal visual values toward the
  // contract's targetPosition/targetSpeed.
  interpolation: Object.freeze({
    targetPositionLerpFactor: 0.08,
    targetSpeedLerpFactor: 0.12,
  }),

  // Distance-to-go (server units) at which the finish line enters the frame.
  // (Owner moved here from studentRaceConfig in UI-10C.)
  finishLine: Object.freeze({
    revealDistanceFromFinish: 150,
  }),

  // One-shot effect durations, keyed by visual.activeEffect values
  // (STUDENT_RACE_EFFECT in the runtime constants).
  effects: Object.freeze({
    correctEffectDurationMs: 700,
    wrongEffectDurationMs: 500,
    boostEffectDurationMs: 900,
    finishEffectDurationMs: 1200,
  }),
});
