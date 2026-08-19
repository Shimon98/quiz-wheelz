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
    // 1 server distance unit = 30 world pixels. Tuned with the C1-03M
    // continuous-movement server rate (speed 1.0 = 4 units/s) so the road
    // flows ~120 px/s at speed 1.0 — the feel the old cosmetic scroll had.
    // (The retired speedToPixelsPerSecondRatio is gone: position itself now
    // advances continuously, so one conversion serves all world motion.)
    positionToPixelsRatio: 30,
  }),

  // Per-frame lerp factors easing renderer-internal visual values toward the
  // contract's targetPosition/targetSpeed.
  interpolation: Object.freeze({
    targetPositionLerpFactor: 0.08,
    targetSpeedLerpFactor: 0.12,
  }),

  // The visible track window ahead of the player (server units): any
  // on-track object enters at the horizon when its relative distance drops
  // below this — which makes it also THE finish-line reveal distance (you
  // see the line exactly when it comes into sight). Single owner for the
  // unified projection (F-1); replaces finishLine.revealDistanceFromFinish.
  projection: Object.freeze({
    viewDistanceAhead: 150,
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
