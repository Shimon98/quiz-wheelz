import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";

import { I18N_NAMESPACES } from "../i18n/i18nConstants";
import { UI_TONES } from "../app/theme/quizWheelzTheme";
import { normalizeApiError } from "../errors/normalizeApiError";

/**
 * useApiErrorNotifier — shows API/server failures as the app's pop-up
 * notifications (the same system the dashboard uses) instead of an inline
 * Alert that grows the entry card. FIELD validation errors stay inline next
 * to their inputs — this is only for request-level failures.
 *
 * notifyApiError(error)    — normalize an axios failure and show it.
 * notifyErrorKey(key)      — show a specific errors-namespace key (for
 *                            callers that remap keys first, e.g. the join
 *                            flow's friendlier fallback).
 */
export default function useApiErrorNotifier() {
  const { t } = useTranslation(I18N_NAMESPACES.ERRORS);

  function notifyErrorKey(messageKey) {
    notifications.show({
      message: t(messageKey),
      color: UI_TONES.DANGER,
      radius: "lg",
    });
  }

  function notifyApiError(error) {
    notifyErrorKey(normalizeApiError(error).messageKey);
  }

  return { notifyApiError, notifyErrorKey };
}
