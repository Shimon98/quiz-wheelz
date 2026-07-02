import { ERROR_CODES } from "./errorCodes";

/*
 * normalizeApiError — turns ANY axios/network failure into a small, uniform
 * shape the UI can act on:
 *
 *   { status, code, messageKey }
 *
 * `messageKey` is always a key in the `errors` i18n namespace — NEVER raw
 * server text — so everything shown to the user is localized and friendly.
 * Server-known codes win; otherwise we fall back by HTTP status.
 */

// Server errorCode (numeric, errors/errorCodes.js) -> errors-namespace key.
const CODE_MESSAGE_KEYS = Object.freeze({
  [ERROR_CODES.INVALID_REQUEST]: "validation.default",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "general.server",
  [ERROR_CODES.INVALID_TOKEN]: "auth.sessionExpired",
  [ERROR_CODES.UNAUTHORIZED]: "auth.sessionExpired",
  [ERROR_CODES.FORBIDDEN]: "auth.forbidden",
});

const STATUS_MESSAGE_KEYS = Object.freeze({
  400: "validation.default",
  401: "auth.sessionExpired",
  403: "auth.forbidden",
  404: "general.notFound",
  409: "general.conflict",
});

function isNetworkError(error) {
  return (
    !error?.response &&
    (error?.code === "ECONNABORTED" ||
      error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error" ||
      error?.request != null)
  );
}

export function normalizeApiError(error) {
  const status = error?.response?.status ?? null;
  const code =
    error?.response?.data?.errorCode ?? error?.response?.data?.code ?? null;

  if (status == null && isNetworkError(error)) {
    return { status: null, code: null, messageKey: "network" };
  }

  const messageKey =
    (code != null && CODE_MESSAGE_KEYS[code]) ||
    (status != null && STATUS_MESSAGE_KEYS[status]) ||
    (status >= 500 ? "general.server" : "general.unexpected");

  return { status, code, messageKey };
}
