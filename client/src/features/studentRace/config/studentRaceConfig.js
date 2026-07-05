/*
 * Screen-level presentation constants for the student race screen — never
 * game rules (those live on the server).
 *
 * Deliberately ABSENT: a totalDistance fallback. totalDistance stays null
 * until the server provides it (the finish-line UI simply doesn't render
 * without it); the dev-only stand-in value belongs inside
 * runtime/localStudentRaceRuntime.js when that adapter lands (UI-10E).
 */
export const STUDENT_RACE_CONFIG = Object.freeze({
  // How long the correct/wrong feedback stays on screen after a submit.
  feedbackDelayMs: 900,
  // Pause after feedback before requesting the next question.
  nextQuestionDelayMs: 1000,
  // Distance-to-go (server units) at which the finish line enters the frame.
  finishLineRevealDistance: 150,
  // Desktop cap for the centered game frame (px); phones play fullscreen.
  maxGameFrameWidth: 520,
});
