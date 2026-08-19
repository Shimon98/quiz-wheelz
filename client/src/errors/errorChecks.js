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

/*
 * Expiry on submit is NOT a wrong answer and NOT a lifecycle conflict: no
 * feedback marking, no race resync — just a question resync.
 */
export function isQuestionExpiredError(error) {
  return error?.errorName === SERVER_ERROR_NAMES.QUESTION_EXPIRED;
}

/*
 * The submitted question is stale relative to server truth (already
 * answered/expired/replaced by a concurrent operation). Recovery is a safe
 * automatic question + race resync — never a wrong-answer marking, never an
 * automatic re-POST.
 */
export function isStaleQuestionSubmissionError(error) {
  return (
    error?.errorName === SERVER_ERROR_NAMES.QUESTION_NOT_ACTIVE ||
    error?.errorName === SERVER_ERROR_NAMES.QUESTION_NOT_FOUND_FOR_PLAYER ||
    error?.errorName === SERVER_ERROR_NAMES.QUESTION_CHOICE_NOT_FOUND
  );
}

// Reconnect grace expired — terminal lifecycle, never a /join redirect.
export function isReconnectWindowExpiredError(error) {
  return (
    error?.errorName === SERVER_ERROR_NAMES.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED
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
