import { ERROR_CATEGORIES } from "./errorCategories";

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

export function isConflictError(error) {
  return error?.category === ERROR_CATEGORIES.CONFLICT;
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
