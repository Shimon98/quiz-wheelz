import { ERROR_CATEGORIES } from "./errorCategories";
import { SERVER_ERROR_NAMES } from "./serverErrorNames";

/*
 * Tiny predicates over a NORMALIZED error (the result of normalizeApiError) —
 * feature hooks branch on these instead of poking axios internals or
 * memorizing numeric server codes.
 */

export function isNetworkError(error) {
  return error?.category === ERROR_CATEGORIES.NETWORK;
}

export function isAuthSessionError(error) {
  return error?.category === ERROR_CATEGORIES.AUTH_SESSION;
}

export function isRacePlayerSessionError(error) {
  return error?.category === ERROR_CATEGORIES.RACE_PLAYER_SESSION;
}

export function isServerError(error) {
  return error?.category === ERROR_CATEGORIES.SERVER;
}

/*
 * True only for the semantic "race/player is no longer playable" conflicts
 * (RACE_NOT_IN_PROGRESS, RACE_PLAYER_NOT_RACING) — NEVER for every 409: the
 * server has many unrelated conflicts (QUESTION_EXPIRED, RACE_FULL, ...)
 * that must not trigger a race-state resync.
 */
export function isRaceLifecycleConflictError(error) {
  return (
    error?.errorName === SERVER_ERROR_NAMES.RACE_PLAYER_NOT_RACING ||
    error?.errorName === SERVER_ERROR_NAMES.RACE_NOT_IN_PROGRESS
  );
}

export function isApiContractError(error) {
  return error?.category === ERROR_CATEGORIES.API_CONTRACT;
}

/*
 * Transient = retrying the SAME request may succeed (network blip, 5xx).
 * Whether to actually retry stays a feature decision — e.g. re-sending a GET
 * race-state is safe, re-sending a POST answer may double-submit.
 */
export function isTransientError(error) {
  return isNetworkError(error) || isServerError(error);
}
