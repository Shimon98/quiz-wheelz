/*
 * Flow-level timing constants for the student race screen — never game rules
 * (those live on the server). Screen geometry lives in raceVisualConfig.js;
 * unit conversions and motion tuning in raceAnimationConfig.js.
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

  // Question countdown DISPLAY (the server's expiresAt is the truth; these
  // only tune presentation). Urgency thresholds switch the timer accent —
  // one owner here, never inline in components.
  timer: Object.freeze({
    tickMs: 250,
    warningSeconds: 10,
    dangerSeconds: 5,
  }),
});
