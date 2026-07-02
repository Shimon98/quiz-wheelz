import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { registerUser } from "../../../api/authApi";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { useLanguageStore } from "../../../stores/languageStore";
import useErrorMessage from "../../../hooks/useErrorMessage";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { ROUTES } from "../../../constants/routeConstants";

/**
 * useTeacherRegister — register screen logic: submit → authApi.registerUser →
 * success notification → login screen. Server errors map to localized text via
 * the existing errorUtils. Ready end-to-end on the client; goes live the moment
 * the server ships /auth/register.
 */
export default function useTeacherRegister() {
  const navigate = useNavigate();
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_AUTH);
  const language = useLanguageStore((state) => state.language);
  const { errorMessage, clearErrorMessage, setErrorMessageFromApiError } =
    useErrorMessage(language);

  const [submitting, setSubmitting] = useState(false);

  async function submit({ fullName, email, password, acceptsEmails }) {
    clearErrorMessage();
    setSubmitting(true);

    try {
      await registerUser({ fullName, email, password, acceptsEmails });
      notifications.show({
        title: t("register.successTitle"),
        message: t("register.successBody"),
        color: UI_TONES.SUCCESS,
      });
      navigate(ROUTES.TEACHER_LOGIN);
    } catch (error) {
      setErrorMessageFromApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return { submit, submitting, errorMessage };
}
