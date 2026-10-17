/*
 * Client-side runtime vocabulary for the student race screen — concepts that
 * exist ONLY in this client (answer-feedback phases, Pixi effect ids).
 *
 * Server-shared enums (race status, player status, difficulty) are NOT
 * defined here: reuse the shared constants (today RACE_STATUSES /
 * RACE_PLAYER_STATUSES in features/teacherWorkspace/config/raceStatusConfig.js;
 * hoisted to src/constants/ when this feature first consumes them in UI-10B).
 * Never keep a second copy of a server enum.
 */

// Phases the question panel cycles through around a submit.
export const STUDENT_RACE_FEEDBACK = Object.freeze({
  IDLE: "idle",
  CORRECT: "correct",
  WRONG: "wrong",
  EXPIRED: "expired",
  ERROR: "error",
});

// One-shot visual effects the Pixi renderer can play (visual.activeEffect).
export const STUDENT_RACE_EFFECT = Object.freeze({
  CORRECT: "correct",
  WRONG: "wrong",
  BOOST: "boost",
  FINISH: "finish",
});

export const STUDENT_RACE_MOMENT = Object.freeze({
  CORRECT: STUDENT_RACE_EFFECT.CORRECT,
  WRONG: STUDENT_RACE_EFFECT.WRONG,
  FINISH: STUDENT_RACE_EFFECT.FINISH,
  TIME_UP: "time-up",
});

// Phases of one challenge choice request, keyed to its offer (C5-02).
export const STUDENT_RACE_CHALLENGE_PHASE = Object.freeze({
  IDLE: "idle",
  SUBMITTING: "submitting",
  RECONCILING: "reconciling",
  RETRY_SAME_CHOICE: "retry-same-choice",
  SYNC_FAILED: "sync-failed",
});

// What an awaited race-state read proved (C5-02). CURRENT: the runtime now
// holds this read or newer truth. STALE: a resync or another identity took
// over. INVALID: the response could not be applied. Network failures throw.
export const STUDENT_RACE_STATE_READ = Object.freeze({
  CURRENT: "current",
  STALE: "stale",
  INVALID: "invalid",
});
