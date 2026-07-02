import { notifications } from "@mantine/notifications";

import i18n from "../../i18n/i18n";
import { I18N_NAMESPACES } from "../../i18n/i18nConstants";
import { UI_TONES } from "../../app/theme/quizWheelzTheme";
import { normalizeApiError } from "../../errors/normalizeApiError";

/*
 * The ONE way the app shows toast notifications — consistent colors, and for
 * API failures a guaranteed localized message (via normalizeApiError). Plain
 * functions (not hooks) on purpose: callable from hooks, stores and
 * interceptors alike; i18n.t resolves with the CURRENT language.
 */

export function showSuccessNotification({ id, title, message }) {
  notifications.show({ id, title, message, color: UI_TONES.SUCCESS });
}

export function showErrorNotification({ id, title, message }) {
  notifications.show({ id, title, message, color: UI_TONES.DANGER });
}

export function showInfoNotification({ id, title, message }) {
  notifications.show({ id, title, message, color: UI_TONES.INFO });
}

/**
 * Show an API failure as a friendly localized toast. Raw server text is
 * never displayed. `fallbackKey` (errors-namespace key) lets a flow override
 * the generic mapping with a contextual message for unexpected failures,
 * e.g. "teacher.createRaceFailed".
 */
export function showApiErrorNotification(error, { id, fallbackKey } = {}) {
  const { messageKey } = normalizeApiError(error);

  const key =
    fallbackKey && messageKey === "general.unexpected" ? fallbackKey : messageKey;

  showErrorNotification({
    id,
    message: i18n.t(`${I18N_NAMESPACES.ERRORS}:${key}`),
  });
}
