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
