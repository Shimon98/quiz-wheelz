/*
 * Broad handling families for normalized API errors. `errorName` says exactly
 * WHAT the server reported; `category` says WHICH KIND of problem it is, so
 * feature hooks can branch without memorizing server codes.
 *
 * The two session categories are deliberately separate: QuizWheelz has two
 * identities (teacher auth cookie vs RacePlayer race cookie) and a failure of
 * one must never be treated as a failure of the other.
 */
export const ERROR_CATEGORIES = Object.freeze({
  NETWORK: "NETWORK",

  AUTH_SESSION: "AUTH_SESSION",
  RACE_PLAYER_SESSION: "RACE_PLAYER_SESSION",

  VALIDATION: "VALIDATION",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  SERVER: "SERVER",
  API_CONTRACT: "API_CONTRACT",
  UNKNOWN: "UNKNOWN",
});
