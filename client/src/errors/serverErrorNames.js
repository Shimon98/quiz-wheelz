/*
 * Semantic error names mirrored from the server's ErrorCode enum — ONLY the
 * names the client actually branches on, not the whole server table. The
 * error payload carries both `error` (this name) and `code` (numeric);
 * client decisions use the NAME, the number is kept as debug metadata, so a
 * renumbering on the server can no longer silently break client logic.
 *
 * Source of truth: server/src/main/java/com/quiz_wheelz/exception/ErrorCode.java
 */
export const SERVER_ERROR_NAMES = Object.freeze({
  // Teacher/user auth session
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Request validation
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Student join flow
  RACE_NOT_FOUND: "RACE_NOT_FOUND",
  RACE_NOT_JOINABLE: "RACE_NOT_JOINABLE",
  RACE_FULL: "RACE_FULL",
  RACE_PLAYER_NAME_TAKEN: "RACE_PLAYER_NAME_TAKEN",

  // RacePlayer session/identity — the student race cookie is invalid, missing
  // or points at a player that no longer exists. Race-state conflicts such as
  // RACE_PLAYER_NOT_RACING / RACE_NOT_IN_PROGRESS / QUESTION_EXPIRED are NOT
  // session failures and stay out of this group on purpose.
  RACE_PLAYER_TOKEN_MISSING: "RACE_PLAYER_TOKEN_MISSING",
  INVALID_RACE_PLAYER_TOKEN: "INVALID_RACE_PLAYER_TOKEN",
  RACE_PLAYER_NOT_FOUND: "RACE_PLAYER_NOT_FOUND",

  // Race lifecycle conflicts — the RacePlayer identity is VALID but the
  // race/player is no longer in a question-playable state; the student race
  // page resyncs race-state and lets getRaceView decide the screen.
  RACE_PLAYER_NOT_RACING: "RACE_PLAYER_NOT_RACING",
  RACE_NOT_IN_PROGRESS: "RACE_NOT_IN_PROGRESS",
});
