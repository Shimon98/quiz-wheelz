import { ERROR_CATEGORIES } from "./errorCategories";
import { SERVER_ERROR_NAMES } from "./serverErrorNames";

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

export function isNotFoundError(error) {
  return error?.category === ERROR_CATEGORIES.NOT_FOUND;
}

export function isRaceLifecycleConflictError(error) {
  return (
    error?.errorName === SERVER_ERROR_NAMES.RACE_PLAYER_NOT_RACING ||
    error?.errorName === SERVER_ERROR_NAMES.RACE_NOT_IN_PROGRESS
  );
}

export function isQuestionExpiredError(error) {
  return error?.errorName === SERVER_ERROR_NAMES.QUESTION_EXPIRED;
}

export function isStaleQuestionSubmissionError(error) {
  return (
    error?.errorName === SERVER_ERROR_NAMES.QUESTION_NOT_ACTIVE ||
    error?.errorName === SERVER_ERROR_NAMES.QUESTION_NOT_FOUND_FOR_PLAYER ||
    error?.errorName === SERVER_ERROR_NAMES.QUESTION_CHOICE_NOT_FOUND
  );
}

export function isReconnectWindowExpiredError(error) {
  return (
    error?.errorName === SERVER_ERROR_NAMES.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED
  );
}

export function isRacePlayerReconnectRequiredError(error) {
  return error?.errorName === SERVER_ERROR_NAMES.RACE_PLAYER_RECONNECT_REQUIRED;
}

export function isApiContractError(error) {
  return error?.category === ERROR_CATEGORIES.API_CONTRACT;
}

export function isTransientError(error) {
  return isNetworkError(error) || isServerError(error);
}
