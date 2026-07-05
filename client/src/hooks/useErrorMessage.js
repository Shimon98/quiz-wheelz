import { useState } from "react";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../i18n/i18nConstants";
import { normalizeApiError } from "../errors/normalizeApiError";

/**
 * useErrorMessage — inline API-error state for forms. Stores the i18n KEY
 * (errors namespace) and translates at render time, so the message follows a
 * live language switch. normalizeApiError is the single error→key mapping —
 * the old hardcoded text tables (errorUtils/AUTH_TEXT/GENERAL_MESSAGES) are
 * gone.
 */
export default function useErrorMessage() {
  const { t } = useTranslation(I18N_NAMESPACES.ERRORS);
  const [errorKey, setErrorKey] = useState(null);

  return {
    errorMessage: errorKey ? t(errorKey) : "",
    clearErrorMessage: () => setErrorKey(null),
    setErrorMessageFromApiError: (error) =>
      setErrorKey(normalizeApiError(error).messageKey),
  };
}
