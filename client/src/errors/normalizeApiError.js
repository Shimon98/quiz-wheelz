import { ApiContractError } from "./ApiContractError";
import { ERROR_CATEGORIES } from "./errorCategories";
import { SERVER_ERROR_NAMES } from "./serverErrorNames";

/*
 * normalizeApiError — the ONE entry point that turns any axios/network/API
 * failure into a stable shape feature code can act on:
 *
 *   { status, code, errorName, category, messageKey, validationErrors }
 *
 * `errorName` is the server's semantic ErrorCode name — client DECISIONS use
 * it (via errorChecks.js); the numeric `code` is kept only as debug metadata.
 * `messageKey` is always a key in the `errors` i18n namespace — NEVER raw
 * server text. `category` is the broad handling family (errorCategories.js).
 *
 * This layer only UNDERSTANDS the failure. What to DO about it — navigation,
 * retry, toast, inline state — is decided by the owning feature hook.
 */

const AUTH_SESSION_NAMES = new Set([
  SERVER_ERROR_NAMES.INVALID_TOKEN,
  SERVER_ERROR_NAMES.TOKEN_EXPIRED,
  SERVER_ERROR_NAMES.UNAUTHORIZED,
]);

const RACE_PLAYER_SESSION_NAMES = new Set([
  SERVER_ERROR_NAMES.RACE_PLAYER_TOKEN_MISSING,
  SERVER_ERROR_NAMES.INVALID_RACE_PLAYER_TOKEN,
  SERVER_ERROR_NAMES.RACE_PLAYER_NOT_FOUND,
]);

// Semantic name -> errors-namespace key, when the generic category message is
// not specific enough.
const NAME_MESSAGE_KEYS = Object.freeze({
  [SERVER_ERROR_NAMES.RACE_NOT_FOUND]: "race.notFound",
  [SERVER_ERROR_NAMES.RACE_NOT_JOINABLE]: "race.notJoinable",
  [SERVER_ERROR_NAMES.RACE_FULL]: "race.full",
  [SERVER_ERROR_NAMES.RACE_PLAYER_NAME_TAKEN]: "race.nameTaken",
});

const CATEGORY_MESSAGE_KEYS = Object.freeze({
  [ERROR_CATEGORIES.NETWORK]: "network",
  [ERROR_CATEGORIES.AUTH_SESSION]: "auth.sessionExpired",
  [ERROR_CATEGORIES.RACE_PLAYER_SESSION]: "racePlayer.sessionLost",
  [ERROR_CATEGORIES.VALIDATION]: "validation.default",
  [ERROR_CATEGORIES.FORBIDDEN]: "auth.forbidden",
  [ERROR_CATEGORIES.NOT_FOUND]: "general.notFound",
  [ERROR_CATEGORIES.CONFLICT]: "general.conflict",
  [ERROR_CATEGORIES.SERVER]: "general.server",
  [ERROR_CATEGORIES.API_CONTRACT]: "general.unexpected",
  [ERROR_CATEGORIES.UNKNOWN]: "general.unexpected",
});

function isRawNetworkError(error) {
  return (
    !error?.response &&
    (error?.code === "ECONNABORTED" ||
      error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error" ||
      error?.request != null)
  );
}

function resolveCategory(error, status, errorName) {
  if (error instanceof ApiContractError) {
    return ERROR_CATEGORIES.API_CONTRACT;
  }

  if (status == null && isRawNetworkError(error)) {
    return ERROR_CATEGORIES.NETWORK;
  }

  // Semantic names override generic HTTP classification — a RacePlayer 401
  // is a RACE_PLAYER_SESSION problem, never a teacher AUTH_SESSION one.
  if (RACE_PLAYER_SESSION_NAMES.has(errorName)) {
    return ERROR_CATEGORIES.RACE_PLAYER_SESSION;
  }

  if (AUTH_SESSION_NAMES.has(errorName)) {
    return ERROR_CATEGORIES.AUTH_SESSION;
  }

  if (errorName === SERVER_ERROR_NAMES.VALIDATION_ERROR) {
    return ERROR_CATEGORIES.VALIDATION;
  }

  if (status === 400) return ERROR_CATEGORIES.VALIDATION;
  if (status === 401) return ERROR_CATEGORIES.AUTH_SESSION;
  if (status === 403) return ERROR_CATEGORIES.FORBIDDEN;
  if (status === 404) return ERROR_CATEGORIES.NOT_FOUND;
  if (status === 409) return ERROR_CATEGORIES.CONFLICT;
  if (status != null && status >= 500) return ERROR_CATEGORIES.SERVER;

  return ERROR_CATEGORIES.UNKNOWN;
}

export function normalizeApiError(error) {
  // Idempotent: passing an already-normalized error back in is a no-op.
  if (error != null && ERROR_CATEGORIES[error.category] != null) {
    return error;
  }

  const data = error?.response?.data;
  const status = error?.response?.status ?? null;
  const code = typeof data?.code === "number" ? data.code : null;
  const errorName = typeof data?.error === "string" ? data.error : null;
  const validationErrors = data?.validationErrors ?? null;

  const category = resolveCategory(error, status, errorName);
  const messageKey =
    NAME_MESSAGE_KEYS[errorName] ??
    CATEGORY_MESSAGE_KEYS[category] ??
    "general.unexpected";

  return { status, code, errorName, category, messageKey, validationErrors };
}
